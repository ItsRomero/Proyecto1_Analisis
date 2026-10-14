import { z } from "zod";
import { FechaCivil } from "../dominio/calculadora-mora.js";
import {
  aplicacionPagoSchema, carteraRiesgoSchema, consultaMoraSchema, crearClienteSchema,
  cuotaApiSchema, dineroSchema, errorApiSchema, estadoCreditoSchema, fechaCivilSchema,
  idempotencyKeySchema, idSchema, montoSolicitudSchema, pagoSchema, tasaSchema, tramoMoraSchema,
} from "./esquemas.js";

// Extensiones finales: las definiciones heredadas permanecen compatibles.
export const fechaOperacionSchema = fechaCivilSchema.refine((valor) => {
  try { FechaCivil.desdeCadena(valor); return true; } catch { return false; }
}, "Fecha civil inexistente.");
const numeroCuotaSchema = z.number().int().min(1).max(24);
const corteSchema = z.strictObject({ fechaCorte: fechaOperacionSchema });
const creditoCorteSchema = corteSchema.extend({ creditoId: idSchema });
const cuotaCorteSchema = creditoCorteSchema.extend({ numeroCuota: numeroCuotaSchema });
const montoGtqSchema = dineroSchema.extend({ moneda: z.literal("GTQ") });

export const altaClienteFinalSchema = crearClienteSchema.extend({
  clienteId: idSchema, municipio: z.string().trim().min(1).max(100),
  telefono: z.string().trim().min(1).max(30).optional(), fechaAlta: fechaOperacionSchema,
});
export const clienteFinalSchema = altaClienteFinalSchema;
export const originarCreditoSchema = z.strictObject({
  creditoId: idSchema, clienteId: idSchema, asesorId: idSchema,
  monto: z.strictObject({ importe: montoSolicitudSchema, moneda: z.literal("GTQ") }),
  plazoMeses: z.number().int().min(3).max(24), tasaNominalAnual: tasaSchema,
  fechaSolicitud: fechaOperacionSchema,
});
export const simularPlanSchema = originarCreditoSchema.omit({ creditoId: true, clienteId: true, asesorId: true, fechaSolicitud: true })
  .extend({ fechaDesembolso: fechaOperacionSchema });
export const cuotaConFechaSchema = cuotaApiSchema.extend({ fechaVencimiento: fechaOperacionSchema });
export const planConFechasSchema = z.strictObject({
  fechaDesembolso: fechaOperacionSchema, cuotas: z.array(cuotaConFechaSchema).min(3).max(24).readonly(),
});
export const decidirCreditoFinalSchema = z.strictObject({
  creditoId: idSchema, fechaOperacion: fechaOperacionSchema, motivo: z.string().trim().min(1).max(500),
});
export const desembolsarFinalSchema = decidirCreditoFinalSchema;
export const resumenCreditoFinalSchema = z.strictObject({
  creditoId: idSchema, fechaCorte: fechaOperacionSchema, estado: estadoCreditoSchema,
  saldoCapital: montoGtqSchema, diasAtraso: z.number().int().nonnegative(), tramo: tramoMoraSchema,
  cuotasPagadas: z.number().int().nonnegative(), cuotasVencidas: z.number().int().nonnegative(),
  proximaCuota: z.strictObject({ numeroCuota: numeroCuotaSchema, fechaVencimiento: fechaOperacionSchema, importe: montoGtqSchema }).nullable(),
  versionCredito: z.number().int().nonnegative(),
});
export const deudaCuotaSchema = cuotaCorteSchema.extend({
  gastosComisiones: montoGtqSchema, interesMoratorio: montoGtqSchema,
  interesCorriente: montoGtqSchema, capital: montoGtqSchema, totalExigible: montoGtqSchema,
});
export const listarMoraSchema = corteSchema.extend({ tramo: tramoMoraSchema.optional() });
export const listaMoraSchema = corteSchema.extend({ creditos: z.array(resumenCreditoFinalSchema).readonly() });
export const proximosVencimientosSchema = corteSchema.extend({ dias: z.union([z.literal(7), z.literal(30)]) });
export const vencimientosSchema = proximosVencimientosSchema.extend({
  hastaIncluido: fechaOperacionSchema, cantidad: z.number().int().nonnegative(), montoTotal: montoGtqSchema,
  cuotas: z.array(z.strictObject({ creditoId: idSchema, numeroCuota: numeroCuotaSchema,
    fechaVencimiento: fechaOperacionSchema, importe: montoGtqSchema })).readonly(),
});
export const consultarCarteraFinalSchema = corteSchema.extend({ inicioPeriodo: fechaOperacionSchema });
export const consultarCierreFinalSchema = corteSchema.extend({ tipo: z.enum(["DIARIO", "MENSUAL"]) });
export const cierreFinalSchema = consultarCierreFinalSchema.extend({
  inicioPeriodo: fechaOperacionSchema, cierreId: idSchema.nullable(), estado: z.enum(["PREVIO", "GENERADO"]),
  desembolsos: z.strictObject({ cantidad: z.number().int().nonnegative(), monto: montoGtqSchema }),
  recuperaciones: z.strictObject({ cantidad: z.number().int().nonnegative(), total: montoGtqSchema,
    gastosComisiones: montoGtqSchema, interesMoratorio: montoGtqSchema, interesCorriente: montoGtqSchema, capital: montoGtqSchema }),
  cartera: carteraRiesgoSchema,
});
export const proponerPagoSchema = cuotaCorteSchema.extend({
  monto: montoGtqSchema.refine((m) => BigInt(m.importe.replace(".", "")) > 0n, "Pago positivo requerido."),
  claveIdempotencia: idempotencyKeySchema,
});
export const propuestaPagoSchema = proponerPagoSchema.extend({
  propuestaId: idSchema, sesionId: idSchema, estado: z.enum(["PENDIENTE", "CONFIRMADA", "CANCELADA", "OBSOLETA"]),
  versionCredito: z.number().int().nonnegative(), deuda: deudaCuotaSchema,
  aplicacionPrevista: aplicacionPagoSchema, estadoPrevisto: estadoCreditoSchema,
});
// No se aceptan booleanos de aprobación ni identidad humana en contenido generado por LLM.
export const confirmarPagoSchema = z.strictObject({
  propuestaId: idSchema, fechaOperacion: fechaOperacionSchema, versionCredito: z.number().int().nonnegative(),
});
export const cancelarPropuestaSchema = z.strictObject({ propuestaId: idSchema, fechaOperacion: fechaOperacionSchema });
export const resultadoConfirmacionSchema = z.strictObject({ pago: pagoSchema, repetido: z.boolean() });
export const problemaFinalSchema = errorApiSchema.extend({
  montoCorrecto: montoGtqSchema.optional(), propuestaId: idSchema.optional(),
}).superRefine((problema, ctx) => {
  if (problema.errorCode === "MONTO_NO_EXACTO" && problema.montoCorrecto === undefined) {
    ctx.addIssue({ code: "custom", path: ["montoCorrecto"], message: "El monto correcto es obligatorio." });
  }
});

const metadatosPoliticaSchema = z.strictObject({ nombre: z.string().min(1), autor: z.string().min(1), motivo: z.string().min(1) });
const politicaPlanaPaqueteSchema = metadatosPoliticaSchema.extend({
  tipo: z.literal("plana"), tna_bps: z.number().int().nonnegative(),
  vigencia_otorgamiento: z.strictObject({ hasta: fechaOperacionSchema }),
});
const politicaEscalonadaPaqueteSchema = metadatosPoliticaSchema.extend({
  tipo: z.literal("escalonada"), vigencia_otorgamiento: z.strictObject({ desde: fechaOperacionSchema }),
  tramos: z.array(z.strictObject({ id: idSchema, ini: z.number().int().positive(),
    fin: z.number().int().positive(), bps: z.number().int().nonnegative() })).min(1),
});
export const politicasPaqueteSchema = z.strictObject({
  version: z.string().min(1), descripcion: z.string().min(1), moneda: z.literal("GTQ"), base_conteo: z.literal("Actual/360"),
  politicas_mora: z.strictObject({ "POL-2024-01": politicaPlanaPaqueteSchema, "POL-2026-10": politicaEscalonadaPaqueteSchema }),
  gasto_gestion_cobro: z.strictObject({ monto_centavos: z.number().int().nonnegative(), dia_generacion: z.number().int().positive(),
    aplica_a_politicas: z.array(z.enum(["POL-2024-01", "POL-2026-10"])), nota: z.string().min(1) }),
  regla_incobrable_dias: z.number().int().positive(), regla_riesgo_dias: z.number().int().nonnegative(),
});

// Registro único que consumen casos de uso, API, MCP y generación OpenAPI.
export const operacionesFinales = {
  altaCliente: { entrada: altaClienteFinalSchema, salida: clienteFinalSchema },
  solicitarCredito: { entrada: originarCreditoSchema, salida: resumenCreditoFinalSchema },
  simularPlan: { entrada: simularPlanSchema, salida: planConFechasSchema },
  aprobarCredito: { entrada: decidirCreditoFinalSchema, salida: resumenCreditoFinalSchema },
  desembolsarCredito: { entrada: desembolsarFinalSchema, salida: resumenCreditoFinalSchema },
  consultarCredito: { entrada: creditoCorteSchema, salida: resumenCreditoFinalSchema },
  consultarPlan: { entrada: creditoCorteSchema, salida: planConFechasSchema },
  calcularDeudaCuota: { entrada: cuotaCorteSchema, salida: deudaCuotaSchema },
  explicarMora: { entrada: cuotaCorteSchema, salida: consultaMoraSchema },
  listarCreditosMora: { entrada: listarMoraSchema, salida: listaMoraSchema },
  proximosVencimientos: { entrada: proximosVencimientosSchema, salida: vencimientosSchema },
  consultarCartera: { entrada: consultarCarteraFinalSchema, salida: carteraRiesgoSchema },
  consultarCierre: { entrada: consultarCierreFinalSchema, salida: cierreFinalSchema },
  generarCierre: { entrada: consultarCierreFinalSchema, salida: cierreFinalSchema },
  proponerPago: { entrada: proponerPagoSchema, salida: propuestaPagoSchema },
  confirmarPago: { entrada: confirmarPagoSchema, salida: resultadoConfirmacionSchema },
  cancelarPropuesta: { entrada: cancelarPropuestaSchema, salida: propuestaPagoSchema },
} as const;
export type NombreOperacionFinal = keyof typeof operacionesFinales;
export type EntradaFinal<N extends NombreOperacionFinal> = z.infer<(typeof operacionesFinales)[N]["entrada"]>;
export type SalidaFinal<N extends NombreOperacionFinal> = z.infer<(typeof operacionesFinales)[N]["salida"]>;

export const codigosProblemaFinal = {
  CREDITO_NO_EXISTE: 404, CUOTA_YA_PAGADA: 409, CREDITO_INCOBRABLE: 409,
  MONTO_NO_EXACTO: 422, FECHA_INVALIDA: 422, CONFLICTO_IDEMPOTENCIA: 409,
  APROBACION_REQUERIDA: 403, PROPUESTA_OBSOLETA: 409, PROPUESTA_NO_EXISTE: 404,
  SESION_NO_AUTORIZADA: 403, PERIODO_INVALIDO: 422,
} as const;
