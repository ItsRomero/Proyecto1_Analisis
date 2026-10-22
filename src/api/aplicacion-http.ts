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
  readonly validarCliente?: (clienteId: string, dpi: string) => Promise<boolean>;
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
const perfilSchema = z.strictObject({ perfil: z.enum(["ASESOR", "GERENCIA", "USUARIO"]) });
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

  const presentarSesion = (sesion: Sesion) => ({ sesionId: sesion.sesionId, perfil: sesion.perfil,
    sujetoId: sesiones.sujeto(sesion), fechaCorteDefecto: opciones.fechaCorteDefecto });
  app.get("/v1/sesion", (req, res) => {
    const sesion = sesionDe(req);
    res.json(sesion ? presentarSesion(sesion) : null);
  });
  app.post("/v1/sesion/login", async (req, res) => {
    try {
      const e = z.strictObject({ perfil: perfilSchema.shape.perfil, usuario: z.string().trim().min(1).max(200),
        contrasena: z.string().min(1).max(200) }).parse(req.body);
      const valida = e.perfil === "USUARIO"
        ? await opciones.validarCliente?.(e.usuario, e.contrasena) === true
        : e.usuario === (e.perfil === "GERENCIA" ? "gerencia" : "asesor")
          && e.contrasena === (e.perfil === "GERENCIA" ? "Gerencia123!" : "Asesor123!");
      if (!valida) throw new ErrorCasoUsoFinal("SESION_NO_AUTORIZADA");
      const anterior = sesionDe(req);
      if (anterior) { opciones.alReiniciarSesion?.(anterior.sesionId); sesiones.eliminar(anterior); }
      const sesion = sesiones.crear(e.perfil);
      if (e.perfil === "USUARIO") sesion.clienteId = e.usuario;
      escribirCookie(res, sesion);
      res.json(presentarSesion(sesion));
    } catch (error) { problema(res, error, randomUUID(), req.originalUrl); }
  });
  app.post("/v1/sesion/logout", (req, res) => {
    const sesion = sesionDe(req);
    if (sesion) { opciones.alReiniciarSesion?.(sesion.sesionId); sesiones.eliminar(sesion); }
    res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
    res.json(null);
  });
  app.post("/v1/sesion/perfil", (req, res) => {
    problema(res, new ErrorCasoUsoFinal("SESION_NO_AUTORIZADA"), randomUUID(), req.originalUrl);
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
  // Selector explícito de clientes para recorrer los perfiles de demostración.
  const clientesUsuario = async (sesion: Sesion, fechaCorte: string) => {
    if (sesion.perfil !== "USUARIO") throw new ErrorCasoUsoFinal("SESION_NO_AUTORIZADA");
    const contexto: ContextoOperacion = { sujetoId: sesiones.sujeto(sesion), sesionId: sesion.sesionId,
      perfil: sesion.perfil, canal: "INTERFAZ", traceId: randomUUID() };
    const datos = await casos.listarClientes.ejecutar({ fechaCorte }, contexto);
    return { ...datos, clientes: datos.clientes.filter(c => c.clienteId === sesion.clienteId) };
  };
  const clienteUsuario = async (sesion: Sesion, fechaCorte: string) => {
    const datos = await clientesUsuario(sesion, fechaCorte);
    return datos.clientes.find(c => c.clienteId === sesion.clienteId) ?? null;
  };
  app.get("/v1/usuarios", async (req, res) => {
    try {
      const fechaCorte = z.iso.date().parse(req.query["fechaCorte"] ?? opciones.fechaCorteDefecto);
      const pagina = z.coerce.number().int().min(1).max(1000000).parse(req.query["pagina"] ?? 1);
      const datos = await clientesUsuario(exigirSesion(req), fechaCorte);
      const ordenados = [...datos.clientes].sort((a, b) => a.clienteId.localeCompare(b.clienteId));
      const totalPaginas = Math.max(1, Math.ceil(ordenados.length / 10));
      const actual = Math.min(pagina, totalPaginas);
      res.json({ pagina: actual, totalPaginas, total: ordenados.length,
        usuarios: ordenados.slice((actual - 1) * 10, actual * 10).map(c => ({ clienteId: c.clienteId,
          nombreCompleto: c.nombreCompleto, municipio: c.municipio, cantidadCreditos: c.creditos.length })) });
    } catch (error) { problema(res, error, randomUUID(), req.originalUrl); }
  });
  app.post("/v1/usuario/seleccion", async (req, res) => {
    try {
      const entrada = z.strictObject({ clienteId: z.string().min(1).max(200), fechaCorte: z.iso.date() }).parse(req.body);
      const sesion = exigirSesion(req);
      const datos = await clientesUsuario(sesion, entrada.fechaCorte);
      const cliente = datos.clientes.find(c => c.clienteId === entrada.clienteId);
      if (!cliente) throw new ErrorCasoUsoFinal("ENTRADA_INVALIDA");
      if (sesion.clienteId !== cliente.clienteId) throw new ErrorCasoUsoFinal("SESION_NO_AUTORIZADA");
      res.json({ cliente });
    } catch (error) { problema(res, error, randomUUID(), req.originalUrl); }
  });
  app.get("/v1/usuario", async (req, res) => {
    try {
      const fechaCorte = z.iso.date().parse(req.query["fechaCorte"] ?? opciones.fechaCorteDefecto);
      const cliente = await clienteUsuario(exigirSesion(req), fechaCorte);
      res.json({ cliente });
    } catch (error) { problema(res, error, randomUUID(), req.originalUrl); }
  });

  app.post("/v1/sesion/eventos-humanos", (req, res) => {
    const traceId = randomUUID();
    try {
      const sesion = exigirSesion(req);
      if (sesion.perfil === "USUARIO") throw new ErrorCasoUsoFinal("SESION_NO_AUTORIZADA");
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
        if (sesion.perfil === "GERENCIA" && ["altaCliente", "solicitarCredito", "desembolsarCredito", "proponerPago", "confirmarPago", "cancelarPropuesta"].includes(nombre))
          throw new ErrorCasoUsoFinal("SESION_NO_AUTORIZADA");
        if (sesion.perfil === "ASESOR" && ["consultarCartera", "consultarCierre", "listarCreditosMora", "proximosVencimientos", "listarSolicitudes"].includes(nombre))
          throw new ErrorCasoUsoFinal("SESION_NO_AUTORIZADA");
        if (ruta.gerencia && sesion.perfil !== "GERENCIA") throw new ErrorCasoUsoFinal("SESION_NO_AUTORIZADA");
        const fuente: unknown = ruta.metodo === "get" ? req.query : req.body ?? {};
        const crudo: Record<string, unknown> = { ...(typeof fuente === "object" && fuente !== null ? fuente : {}), ...req.params };
        for (const clave of NUMERICOS) {
          const valor = crudo[clave];
          if (typeof valor === "string" && /^\d{1,4}$/.test(valor)) crudo[clave] = Number(valor);
        }
        const valorEntrada = operacionesFinales[nombre].entrada.parse(crudo) as Record<string, unknown>;
        if (sesion.perfil === "USUARIO") {
          const permitidas = ["consultarCredito", "consultarFichaCredito", "consultarPlan", "listarPagos"];
          if (!permitidas.includes(nombre)) throw new ErrorCasoUsoFinal("SESION_NO_AUTORIZADA");
          const cliente = await clienteUsuario(sesion, String(valorEntrada["fechaCorte"]));
          if (!cliente?.creditos.some(c => c.creditoId === valorEntrada["creditoId"]))
            throw new ErrorCasoUsoFinal("SESION_NO_AUTORIZADA");
        }
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
      res.sendFile("index.html", { root: raiz });
    });
  }
  return app;
}
