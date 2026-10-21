import { ZodError } from "zod";
import { ErrorCasoUsoFinal, type CodigoProblemaFinal } from "../aplicacion/error-final.js";
import { FechaCivilInvalida } from "../dominio/calculadora-mora.js";
import { ConflictoIdempotencia } from "../dominio/pago-idempotente.js";
import { codigosProblemaFinal, problemaFinalSchema } from "../contratos/proyecto-final.js";

/** Mensajes públicos: comprensibles para la persona usuaria, sin SQL, trazas ni datos personales. */
const MENSAJES: Readonly<Record<CodigoProblemaFinal | "ERROR_INTERNO", string>> = {
  CREDITO_NO_EXISTE: "El crédito no existe a la fecha de corte indicada.",
  CUOTA_YA_PAGADA: "La cuota ya está pagada; no se registró otro pago.",
  CREDITO_INCOBRABLE: "El crédito está dado de baja como incobrable; no admite pagos nuevos.",
  MONTO_NO_EXACTO: "El monto no es exacto. El núcleo exige el monto correcto indicado.",
  FECHA_INVALIDA: "La fecha no es válida para esta operación.",
  CONFLICTO_IDEMPOTENCIA: "La clave de idempotencia ya se usó con un contenido distinto; no se aplicó ningún efecto.",
  APROBACION_REQUERIDA: "La operación requiere una aprobación explícita en la interfaz.",
  PROPUESTA_OBSOLETA: "La propuesta ya no es vigente. Genere una propuesta nueva y apruébela otra vez.",
  PROPUESTA_NO_EXISTE: "La propuesta de pago no existe.",
  SESION_NO_AUTORIZADA: "La sesión o el perfil actual no autorizan esta operación.",
  PERIODO_INVALIDO: "El período indicado no es válido.",
  ENTRADA_INVALIDA: "Los datos enviados no cumplen el contrato.",
  CLIENTE_YA_EXISTE: "Ya existe un cliente con ese identificador o documento.",
  CREDITO_YA_EXISTE: "Ya existe un crédito con ese identificador.",
  TRANSICION_INVALIDA: "El estado actual del crédito no permite esta operación.",
  CUOTA_FUERA_DE_ORDEN: "Primero debe pagarse la cuota vencida más antigua.",
  REFERENCIA_INEXISTENTE: "El cliente, asesor o cuota indicados no existen.",
  ERROR_INTERNO: "No se pudo completar la operación.",
};

function codigoDe(error: unknown): CodigoProblemaFinal | "ERROR_INTERNO" {
  if (error instanceof ConflictoIdempotencia) return "CONFLICTO_IDEMPOTENCIA";
  if (error instanceof FechaCivilInvalida) return "FECHA_INVALIDA";
  if (error instanceof ErrorCasoUsoFinal) return error.codigo;
  if (error instanceof ZodError) return error.issues.every((i) => /^fecha/i.test(String(i.path.at(-1) ?? "")))
    ? "FECHA_INVALIDA" : "ENTRADA_INVALIDA";
  return "ERROR_INTERNO";
}

/** Metadatos técnicos inyectados por el servidor; no fechas financieras ni texto del error. */
export function presentarProblemaFinal(error: unknown, meta: { readonly traceId: string; readonly timestamp: string; readonly instance?: string }) {
  const codigo = codigoDe(error);
  const status = codigo === "ERROR_INTERNO" ? 500 : codigosProblemaFinal[codigo];
  const detalles = error instanceof ZodError ? { scope: "FIELD" as const, details: error.issues.map((i) => ({
    campo: i.path.length ? i.path.join(".") : "(cuerpo)", codigo: "VALOR_INVALIDO", mensaje: i.message })) } : {};
  return { status, contentType: "application/problem+json" as const,
    body: problemaFinalSchema.parse({ type: `urn:credito-vecino:problema:${codigo.toLowerCase()}`,
      title: codigo, status, detail: MENSAJES[codigo], errorCode: codigo, ...meta, ...detalles,
      ...(error instanceof ErrorCasoUsoFinal && error.montoCorrecto !== undefined ? { montoCorrecto: error.montoCorrecto } : {}),
    }),
  };
}
