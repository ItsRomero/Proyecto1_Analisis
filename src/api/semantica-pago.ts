import { ConflictoIdempotencia } from "../dominio/pago-idempotente.js";
import type { ResultadoEjecucionIdempotente } from "../aplicacion/registrar-pago.js";

/** Traducción pura; no registra pagos ni crea una aprobación. */
export function respuestaPagoIdempotente(resultado: ResultadoEjecucionIdempotente) {
  return { status: resultado.repetido ? 200 as const : 201 as const,
    headers: { "Idempotency-Replayed": resultado.repetido ? "true" : "false" },
    pago: resultado.pago };
}
export function esConflictoIdempotencia(error: unknown): error is ConflictoIdempotencia {
  return error instanceof ConflictoIdempotencia;
}
