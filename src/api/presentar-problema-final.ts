import { ErrorCasoUsoFinal } from "../aplicacion/error-final.js";
import { FechaCivilInvalida } from "../dominio/calculadora-mora.js";
import { ConflictoIdempotencia } from "../dominio/pago-idempotente.js";
import { codigosProblemaFinal, problemaFinalSchema } from "../contratos/proyecto-final.js";

/** Metadatos técnicos inyectados por el servidor; no fechas financieras ni texto del error. */
export function presentarProblemaFinal(error: unknown, meta: { readonly traceId: string; readonly timestamp: string }) {
  const codigo = error instanceof ConflictoIdempotencia ? "CONFLICTO_IDEMPOTENCIA"
    : error instanceof FechaCivilInvalida ? "FECHA_INVALIDA"
    : error instanceof ErrorCasoUsoFinal ? error.codigo : "ERROR_INTERNO";
  const status = codigo === "ERROR_INTERNO" ? 500 : codigosProblemaFinal[codigo];
  return { status, contentType: "application/problem+json" as const,
    body: problemaFinalSchema.parse({ type: `urn:credito-vecino:problema:${codigo.toLowerCase()}`,
      title: codigo, status, detail: codigo === "ERROR_INTERNO" ? "No se pudo completar la operación." : codigo,
      errorCode: codigo, ...meta,
      ...(error instanceof ErrorCasoUsoFinal && error.montoCorrecto !== undefined ? { montoCorrecto: error.montoCorrecto } : {}),
    }),
  };
}
