import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { crearCasosUsoFinal } from "../aplicacion/servicios-final.js";
import { LecturasFinalPg, UnidadTrabajoFinalPg } from "./repositorio-final-pg.js";

/** Única fábrica de casos de uso sobre PostgreSQL: la usan la API y el proceso MCP (ADR-007). */
export function crearCasosPg(pool: Pool, diasRetencionIdempotencia: number) {
  return crearCasosUsoFinal({ lecturas: new LecturasFinalPg(pool), unidad: new UnidadTrabajoFinalPg(pool),
    ids: { propuesta: () => `PROP-${randomUUID()}`, pago: () => `PAGO-${randomUUID()}`, aprobacion: () => `APR-${randomUUID()}` },
    diasRetencionIdempotencia });
}
