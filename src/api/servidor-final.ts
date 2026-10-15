import type { Pool } from "pg";
import { FechaCivil } from "../dominio/calculadora-mora.js";
import { crearCasosPg } from "../persistencia/casos-pg.js";
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

export function crearServidorFinal(pool: Pool, config: ConfiguracionServidor) {
  const casos = crearCasosPg(pool, config.diasRetencionIdempotencia);
  const app = crearAplicacionHttp({ casos, sesiones: new AlmacenSesiones(), fechaCorteDefecto: config.fechaCorteDefecto,
    origenesPermitidos: config.origenWeb ? [config.origenWeb] : [],
    ...(config.directorioWeb !== undefined ? { directorioWeb: config.directorioWeb } : {}) });
  return { app, casos };
}
