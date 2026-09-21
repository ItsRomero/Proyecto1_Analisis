import { z } from "zod";

const FORMATO_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$/;
const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const FORMATO_IMPORTE = /^(?:0|[1-9]\d*)\.\d{2}$/;
const FORMATO_TASA = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;

function unidadesMenores(valor: string): bigint {
  return BigInt(valor.replace(".", ""));
}

export const idSchema = z.string().regex(FORMATO_ID);
export const fechaCivilSchema = z.string().regex(FORMATO_FECHA);
export const monedaSchema = z.string().regex(/^[A-Z]{3}$/);
export const importeSchema = z.string().regex(FORMATO_IMPORTE);
export const tasaSchema = z.string().regex(FORMATO_TASA);
export const idempotencyKeySchema = z.string().regex(/^[\x21-\x7E]{1,255}$/);

export const dineroSchema = z.strictObject({
  importe: importeSchema,
  moneda: monedaSchema,
});

export const problemDetailFieldSchema = z.strictObject({
  campo: z.string().min(1),
  codigo: z.string().regex(/^[A-Z][A-Z0-9_]{2,63}$/),
  mensaje: z.string().min(1),
});

export const errorApiSchema = z.strictObject({
  type: z.string().min(1),
  title: z.string().min(1),
  status: z.number().int(),
  detail: z.string().min(1),
  instance: z.string().min(1).optional(),
  errorCode: z.string().regex(/^[A-Z][A-Z0-9_]{2,63}$/),
  scope: z.enum(["FIELD", "DOMAIN", "AUTH", "INFRA"]).optional(),
  details: z.array(problemDetailFieldSchema).readonly().optional(),
  traceId: z.string().min(1),
  timestamp: z.string().min(1),
});

export const identificadorLegalSchema = z.strictObject({
  tipo: z.string().min(1).max(40),
  valor: z.string().min(1).max(80),
});

export const crearClienteSchema = z.strictObject({
  nombreCompleto: z.string().trim().min(1).max(200),
  identificadorLegal: identificadorLegalSchema,
});

export const clienteSchema = crearClienteSchema.extend({
  clienteId: idSchema,
  fechaRegistro: fechaCivilSchema,
});

export const montoSolicitudSchema = importeSchema.refine((valor) => {
  const monto = unidadesMenores(valor);
  return monto >= 100_000n && monto <= 2_500_000n;
}, "El monto debe estar entre Q1,000.00 y Q25,000.00.");

export const crearSolicitudSchema = z.strictObject({
  clienteId: idSchema,
  monto: z.strictObject({ importe: montoSolicitudSchema, moneda: z.literal("GTQ") }),
  plazoMeses: z.number().int().min(3).max(24),
});

export const estadoSolicitudSchema = z.enum([
  "SOLICITADO", "APROBADO", "RECHAZADO", "ANULADO",
]);

export const solicitudSchema = crearSolicitudSchema.extend({
  solicitudId: idSchema,
  estado: estadoSolicitudSchema,
  fechaSolicitud: fechaCivilSchema,
});

export const decidirSolicitudSchema = z.strictObject({
  decision: z.enum(["APROBAR", "RECHAZAR"]),
  usuarioProceso: z.string().trim().min(1).max(100),
  motivo: z.string().trim().min(1).max(500),
  fecha: fechaCivilSchema,
});

export const estadoCreditoSchema = z.enum([
  "SOLICITADO", "APROBADO", "RECHAZADO", "DESEMBOLSADO", "VIGENTE",
  "EN_MORA", "REESTRUCTURADO", "ANULADO", "CANCELADO", "INCOBRABLE",
]);

export const desembolsarCreditoSchema = z.strictObject({
  fechaDesembolso: fechaCivilSchema,
  usuarioProceso: z.string().trim().min(1).max(100),
  politicaVersion: idSchema,
  tasaNominalAnual: tasaSchema,
});

export const cuotaApiSchema = z.strictObject({
  numero: z.number().int().positive(),
  saldoAnterior: dineroSchema,
  interes: dineroSchema,
  amortizacion: dineroSchema,
  importe: dineroSchema,
  saldoPosterior: dineroSchema,
});

export const transicionEstadoSchema = z.strictObject({
  estadoAnterior: estadoCreditoSchema,
  estadoNuevo: estadoCreditoSchema,
  fecha: fechaCivilSchema,
  usuarioProceso: z.string().min(1),
  motivo: z.string().min(1),
});

export const creditoSchema = z.strictObject({
  creditoId: idSchema,
  solicitudId: idSchema,
  estado: estadoCreditoSchema,
  capitalOriginal: dineroSchema,
  saldoCapital: dineroSchema,
  plazoMeses: z.number().int().min(3).max(24),
  tasaNominalAnual: tasaSchema,
  politicaVersion: idSchema,
  plan: z.array(cuotaApiSchema).readonly(),
  historial: z.array(transicionEstadoSchema).readonly(),
});

export const registrarPagoSchema = z.strictObject({
  importe: importeSchema.refine((valor) => unidadesMenores(valor) > 0n, "El pago debe ser positivo."),
  moneda: z.literal("GTQ"),
  fechaPago: fechaCivilSchema,
  usuarioProceso: z.string().trim().min(1).max(100),
});

export const aplicacionPagoSchema = z.strictObject({
  gastosComisiones: dineroSchema,
  interesMoratorio: dineroSchema,
  interesCorriente: dineroSchema,
  capital: dineroSchema,
  excedente: dineroSchema,
});

export const pagoSchema = registrarPagoSchema.extend({
  pagoId: idSchema,
  creditoId: idSchema,
  idempotencyKey: idempotencyKeySchema,
  aplicacion: aplicacionPagoSchema,
});

export const tramoMoraSchema = z.enum([
  "SIN_MORA", "MORA_1", "MORA_2", "MORA_3", "VENCIDO", "INCOBRABLE",
]);

export const moraCuotaSchema = z.strictObject({
  referencia: idSchema,
  fechaVencimiento: fechaCivilSchema,
  diasAtraso: z.number().int().nonnegative(),
  tramo: tramoMoraSchema,
  capitalVencido: dineroSchema,
  interesMoratorio: dineroSchema,
  politicaId: idSchema.optional(),
  detalle: z.strictObject({
    totalSinRedondear: tasaSchema,
    moneda: monedaSchema,
    tramos: z.array(z.strictObject({
      nombre: z.string().min(1), dias: z.number().int().nonnegative(),
      tasa: tasaSchema, importeSinRedondear: tasaSchema,
    })).readonly(),
  }).optional(),
});

export const consultaMoraSchema = z.strictObject({
  creditoId: idSchema,
  fechaCorte: fechaCivilSchema,
  cuotas: z.array(moraCuotaSchema).readonly(),
  politicaId: idSchema.optional(),
  corteDevengo: fechaCivilSchema.optional(),
});

export const resumenCarteraSchema = z.strictObject({
  cantidadCreditos: z.number().int().nonnegative(),
  saldoCapital: dineroSchema,
  porcentaje: importeSchema.nullable(),
});

export const desgloseCarteraSchema = z.strictObject({
  inicioPeriodo: fechaCivilSchema,
  cantidadActiva: z.number().int().nonnegative(),
  tramosEnRiesgo: z.array(resumenCarteraSchema.extend({
    tramo: z.enum(["MORA_1", "MORA_2", "MORA_3", "VENCIDO", "REESTRUCTURADO"]),
  })).length(5).readonly(),
  carteraEnMora: resumenCarteraSchema,
  totalEnRiesgo: resumenCarteraSchema,
  incobrablesDelPeriodo: z.strictObject({
    cantidadCreditos: z.number().int().nonnegative(), saldoCapital: dineroSchema,
    creditos: z.array(z.strictObject({ creditoId: idSchema, fecha: fechaCivilSchema, saldoCapital: dineroSchema })).readonly(),
  }),
});

export const carteraConRazonSchema = z.strictObject({
  tipo: z.literal("CON_RAZON"),
  fechaCorte: fechaCivilSchema,
  carteraActiva: dineroSchema,
  capitalEnRiesgo: dineroSchema,
  razon: tasaSchema,
  porcentaje: importeSchema,
  desglose: desgloseCarteraSchema.optional(),
});

export const carteraSinActivaSchema = z.strictObject({
  tipo: z.literal("SIN_CARTERA_ACTIVA"),
  fechaCorte: fechaCivilSchema,
  carteraActiva: dineroSchema,
  capitalEnRiesgo: dineroSchema,
  desglose: desgloseCarteraSchema.optional(),
});

export const carteraRiesgoSchema = z.discriminatedUnion("tipo", [
  carteraConRazonSchema,
  carteraSinActivaSchema,
]);

export const generarCierreSchema = z.strictObject({
  fechaCorte: fechaCivilSchema,
  usuarioProceso: z.string().trim().min(1).max(100),
});

export const cierreSchema = z.strictObject({
  cierreId: idSchema,
  tipo: z.enum(["DIARIO", "MENSUAL"]),
  fechaCorte: fechaCivilSchema,
  estado: z.literal("GENERADO"),
  desembolsos: dineroSchema,
  recuperaciones: dineroSchema,
  devengo: dineroSchema,
  mora: dineroSchema,
  saldoCartera: dineroSchema,
  carteraRiesgo: carteraRiesgoSchema.optional(),
});

export type ErrorApi = z.infer<typeof errorApiSchema>;
export type CrearCliente = z.infer<typeof crearClienteSchema>;
export type CrearSolicitud = z.infer<typeof crearSolicitudSchema>;
export type RegistrarPago = z.infer<typeof registrarPagoSchema>;
