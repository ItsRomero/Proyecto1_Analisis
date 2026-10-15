import express, { type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { z } from "zod";
import type { CasosUsoFinal, ContextoOperacion, OperacionesHumanas } from "../aplicacion/casos-uso-final.js";
import { ErrorCasoUsoFinal } from "../aplicacion/error-final.js";
import { operacionesFinales, type NombreOperacionFinal } from "../contratos/proyecto-final.js";
import { objetivoEventoHumano, rutasFinales } from "../contratos/rutas-proyecto-final.js";
import { presentarProblemaFinal } from "./presentar-problema-final.js";
import type { AlmacenSesiones, Sesion } from "./sesiones.js";

export interface OpcionesHttp {
  readonly casos: CasosUsoFinal;
  readonly sesiones: AlmacenSesiones;
  /** Fecha de corte por defecto de la sesión (DEFAULT_SESSION_CUTOFF); nunca el reloj. */
  readonly fechaCorteDefecto: string;
  readonly origenesPermitidos: readonly string[];
  /** Build de web/ servido en la misma origen; opcional en desarrollo con Vite. */
  readonly directorioWeb?: string;
  /** Fase 6: rutas adicionales (chat) con la misma sesión, origen y cabeceras. */
  readonly extender?: (app: express.Express, utilidades: { readonly exigirSesion: (req: Request) => Sesion }) => void;
  /** Fase 6: se invoca al reiniciar una sesión de interfaz (cierra su chat y su proceso MCP). */
  readonly alReiniciarSesion?: (sesionIdAnterior: string) => void;
}

const COOKIE = "cv_session";
const NUMERICOS = new Set(["numeroCuota", "dias"]);
const HUMANAS = new Set<NombreOperacionFinal>(Object.entries(rutasFinales).filter(([, r]) => r.humana).map(([n]) => n as NombreOperacionFinal));
const perfilSchema = z.strictObject({ perfil: z.enum(["ASESOR", "GERENCIA"]) });
const eventoSchema = z.strictObject({ operacion: z.string(), objetivo: z.string().min(1).max(200) });

function leerCookie(req: Request): string | undefined {
  for (const parte of (req.headers.cookie ?? "").split(";")) {
    const [nombre, ...valor] = parte.trim().split("=");
    if (nombre === COOKIE) return decodeURIComponent(valor.join("="));
  }
  return undefined;
}

export function crearAplicacionHttp(opciones: OpcionesHttp): express.Express {
  const { casos, sesiones } = opciones;
  const app = express();
  app.disable("x-powered-by");
  app.set("query parser", "simple");

  const escribirCookie = (res: Response, sesion: Sesion) =>
    res.setHeader("Set-Cookie", `${COOKIE}=${encodeURIComponent(sesion.token)}; HttpOnly; SameSite=Strict; Path=/`);
  const problema = (res: Response, error: unknown, traceId: string, instance: string) => {
    const p = presentarProblemaFinal(error, { traceId, timestamp: new Date().toISOString(), instance });
    if (p.status === 500) console.error(`[${traceId}]`, error instanceof Error ? error.message : error);
    res.status(p.status).type(p.contentType).json(p.body);
  };
  const sesionDe = (req: Request) => sesiones.obtener(leerCookie(req));
  const exigirSesion = (req: Request): Sesion => {
    const sesion = sesionDe(req);
    if (sesion === undefined) throw new ErrorCasoUsoFinal("SESION_NO_AUTORIZADA");
    return sesion;
  };

  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    next();
  });
  app.use("/v1", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    // Escrituras solo desde la propia interfaz: misma origen o WEB_ORIGIN configurada.
    const origen = req.get("origin");
    if (req.method !== "GET" && origen !== undefined && origen !== `${req.protocol}://${req.get("host") ?? ""}`
      && !opciones.origenesPermitidos.includes(origen)) {
      problema(res, new ErrorCasoUsoFinal("SESION_NO_AUTORIZADA"), randomUUID(), req.originalUrl);
      return;
    }
    next();
  });
  app.use("/v1", express.json({ limit: "32kb" }));

  app.get("/v1/sesion", (req, res) => {
    let sesion = sesionDe(req);
    if (sesion === undefined) { sesion = sesiones.crear(); escribirCookie(res, sesion); }
    res.json({ sesionId: sesion.sesionId, perfil: sesion.perfil, sujetoId: sesiones.sujeto(sesion), fechaCorteDefecto: opciones.fechaCorteDefecto });
  });
  app.post("/v1/sesion/perfil", (req, res) => {
    const traceId = randomUUID();
    try {
      const sesion = exigirSesion(req);
      sesiones.cambiarPerfil(sesion, perfilSchema.parse(req.body).perfil);
      res.json({ sesionId: sesion.sesionId, perfil: sesion.perfil, sujetoId: sesiones.sujeto(sesion), fechaCorteDefecto: opciones.fechaCorteDefecto });
    } catch (error) { problema(res, error, traceId, req.originalUrl); }
  });
  app.post("/v1/sesion/reinicio", (req, res) => {
    const traceId = randomUUID();
    try {
      const anterior = exigirSesion(req);
      opciones.alReiniciarSesion?.(anterior.sesionId);
      const nueva = sesiones.reiniciar(anterior);
      escribirCookie(res, nueva);
      res.json({ sesionId: nueva.sesionId, perfil: nueva.perfil, sujetoId: sesiones.sujeto(nueva), fechaCorteDefecto: opciones.fechaCorteDefecto });
    } catch (error) { problema(res, error, traceId, req.originalUrl); }
  });
  app.post("/v1/sesion/eventos-humanos", (req, res) => {
    const traceId = randomUUID();
    try {
      const sesion = exigirSesion(req);
      const e = eventoSchema.parse(req.body);
      if (!HUMANAS.has(e.operacion as NombreOperacionFinal)) throw new ErrorCasoUsoFinal("ENTRADA_INVALIDA");
      res.status(201).json({ eventoAprobacionId: sesiones.emitirEvento(sesion, e.operacion as OperacionesHumanas, e.objetivo) });
    } catch (error) { problema(res, error, traceId, req.originalUrl); }
  });

  for (const [nombre, ruta] of Object.entries(rutasFinales) as [NombreOperacionFinal, (typeof rutasFinales)[NombreOperacionFinal]][]) {
    const camino = `/v1${ruta.ruta.replace(/\{(\w+)\}/g, ":$1")}`;
    app[ruta.metodo](camino, async (req: Request, res: Response) => {
      const traceId = randomUUID();
      try {
        const sesion = exigirSesion(req);
        const fuente: unknown = ruta.metodo === "get" ? req.query : req.body ?? {};
        const crudo: Record<string, unknown> = { ...(typeof fuente === "object" && fuente !== null ? fuente : {}), ...req.params };
        for (const clave of NUMERICOS) {
          const valor = crudo[clave];
          if (typeof valor === "string" && /^\d{1,4}$/.test(valor)) crudo[clave] = Number(valor);
        }
        const valorEntrada = operacionesFinales[nombre].entrada.parse(crudo) as Record<string, unknown>;
        if (ruta.gerencia && sesion.perfil !== "GERENCIA") throw new ErrorCasoUsoFinal("SESION_NO_AUTORIZADA");
        let contexto: ContextoOperacion & { eventoAprobacionId?: string; claveIdempotencia?: string } = {
          sujetoId: sesiones.sujeto(sesion), sesionId: sesion.sesionId, perfil: sesion.perfil, canal: "INTERFAZ", traceId };
        if (ruta.humana) {
          const evento = req.get("x-evento-humano");
          const operacion = nombre as OperacionesHumanas;
          const objetivo = (objetivoEventoHumano[operacion] as (e: Record<string, unknown>) => string)(valorEntrada);
          if (evento === undefined || !sesiones.consumirEvento(sesion, evento, operacion, objetivo))
            throw new ErrorCasoUsoFinal("APROBACION_REQUERIDA");
          contexto = { ...contexto, eventoAprobacionId: evento };
        }
        if (nombre === "confirmarPago") {
          const clave = req.get("idempotency-key");
          if (clave === undefined || clave.length === 0) throw new ErrorCasoUsoFinal("ENTRADA_INVALIDA");
          contexto = { ...contexto, claveIdempotencia: clave };
        }
        const existiaCierre = nombre === "generarCierre"
          ? (await casos.consultarCierre.ejecutar(valorEntrada as never, contexto)).estado === "GENERADO" : false;
        // Frontera de transporte: entrada ya validada con el mismo esquema que valida el caso de uso.
        const ejecutar = casos[nombre].ejecutar as (e: unknown, c: unknown) => Promise<unknown>;
        const resultado = await ejecutar(valorEntrada, contexto);
        let status = ["altaCliente", "solicitarCredito", "proponerPago"].includes(nombre) ? 201 : 200;
        if (nombre === "generarCierre") status = existiaCierre ? 200 : 201;
        if (nombre === "confirmarPago") {
          const repetido = (resultado as { repetido: boolean }).repetido;
          res.setHeader("Idempotency-Replayed", repetido ? "true" : "false");
          status = repetido ? 200 : 201;
        }
        res.status(status).json(resultado);
      } catch (error) { problema(res, error, traceId, req.originalUrl); }
    });
  }

  opciones.extender?.(app, { exigirSesion });

  app.use("/v1", (req, res) => {
    res.status(404).type("application/problem+json").json({ type: "urn:credito-vecino:problema:ruta_no_existe", title: "RUTA_NO_EXISTE",
      status: 404, detail: "La ruta solicitada no existe.", errorCode: "RUTA_NO_EXISTE", traceId: randomUUID(),
      timestamp: new Date().toISOString(), instance: req.originalUrl });
  });

  if (opciones.directorioWeb !== undefined && existsSync(join(opciones.directorioWeb, "index.html"))) {
    const raiz = resolve(opciones.directorioWeb);
    app.use(express.static(raiz, { index: false }));
    app.use((req, res, next) => {
      if (req.method !== "GET") { next(); return; }
      res.sendFile(join(raiz, "index.html"));
    });
  }
  return app;
}
