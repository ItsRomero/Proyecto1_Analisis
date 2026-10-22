import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { FechaCivil } from "../dominio/calculadora-mora.js";
import { crearCasosPg } from "../persistencia/casos-pg.js";
import type { CasosUsoFinal } from "../aplicacion/casos-uso-final.js";
import { AlmacenChats } from "../chat/orquestador.js";
import type { DependenciasChat } from "../chat/puertos.js";
import { registrarRutasChat } from "../chat/rutas-chat.js";
import { crearAplicacionHttp } from "./aplicacion-http.js";
import { AlmacenSesiones } from "./sesiones.js";

export interface ConfiguracionServidor {
  readonly host: string;
  readonly puerto: number;
  readonly fechaCorteDefecto: string;
  readonly origenWeb: string | undefined;
  readonly diasRetencionIdempotencia: number;
  readonly directorioWeb: string | undefined;
}

/** Variables de .env.example; la fecha de corte por defecto es obligatoria y nunca se toma del reloj. */
export function configuracionDesdeEntorno(env: NodeJS.ProcessEnv): ConfiguracionServidor {
  const corte = env["DEFAULT_SESSION_CUTOFF"];
  if (corte === undefined) throw new Error("Configure DEFAULT_SESSION_CUTOFF (por ejemplo 2026-10-31).");
  FechaCivil.desdeCadena(corte);
  const puerto = Number(env["API_PORT"] ?? "3000");
  const retencion = Number(env["IDEMPOTENCY_RETENTION_DAYS"] ?? "30");
  if (!Number.isInteger(puerto) || puerto < 0 || !Number.isInteger(retencion) || retencion < 30)
    throw new Error("API_PORT o IDEMPOTENCY_RETENTION_DAYS inválidos (retención mínima 30 días, ADR-017).");
  return { host: env["API_HOST"] ?? "127.0.0.1", puerto, fechaCorteDefecto: corte, origenWeb: env["WEB_ORIGIN"],
    diasRetencionIdempotencia: retencion, directorioWeb: env["WEB_DIST_DIR"] ?? "web/dist" };
}

/** Fase 6: chat gerencial. La fábrica recibe la sesión de interfaz y la MISMA instancia de casos de uso. */
export interface OpcionesChatServidor {
  readonly fabrica: (sesion: { readonly sesionId: string; readonly perfil: "ASESOR" | "GERENCIA" }, casos: CasosUsoFinal) => Promise<DependenciasChat>;
  readonly maxTurnos: number;
  readonly ttlMinutos: number;
  readonly maxPasos?: number;
}

export function crearServidorFinal(pool: Pool, config: ConfiguracionServidor, chat?: OpcionesChatServidor) {
  const casos = crearCasosPg(pool, config.diasRetencionIdempotencia);
  const almacen = chat === undefined ? undefined : new AlmacenChats((sesion) => chat.fabrica(sesion, casos),
    { maxTurnos: chat.maxTurnos, ttlMinutos: chat.ttlMinutos, maxPasos: chat.maxPasos ?? 4, ahora: () => Date.now(), nuevoId: () => randomUUID() });
  const app = crearAplicacionHttp({ casos, sesiones: new AlmacenSesiones(), fechaCorteDefecto: config.fechaCorteDefecto,
    validarCliente: async (clienteId, dpi) => (await pool.query(
      "SELECT 1 FROM cv.clientes WHERE id=$1 AND tipo_identificacion IN ('DPI','DPI_FICTICIO') AND identificacion=$2", [clienteId, dpi])).rowCount === 1,
    origenesPermitidos: config.origenWeb ? [config.origenWeb] : [],
    ...(almacen && chat ? {
      extender: (app: Parameters<NonNullable<Parameters<typeof crearAplicacionHttp>[0]["extender"]>>[0],
        u: { readonly exigirSesion: Parameters<typeof registrarRutasChat>[1]["exigirSesion"] }) =>
        registrarRutasChat(app, { almacen, exigirSesion: u.exigirSesion, maxTurnos: chat.maxTurnos, ttlMinutos: chat.ttlMinutos }),
      alReiniciarSesion: (sesionId: string) => { void almacen.cerrar(sesionId); },
    } : {}),
    ...(config.directorioWeb !== undefined ? { directorioWeb: config.directorioWeb } : {}) });
  return { app, casos, almacen };
}
