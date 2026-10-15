import type { CasosUsoFinal, ContextoConfirmacionHumana } from "../../src/aplicacion/casos-uso-final.js";
import { CONSULTAS_ORACULO, CORTE, type ClaveOraculo } from "../evals/casos.js";

/*
 * Solo pruebas y congelado de oráculo: OP-1 a OP-3 ejecutados con los MISMOS casos de uso que usa la
 * API (sin HTTP). El contexto humano es sintético; las cifras resultantes las calcula el núcleo.
 */
const contexto = (perfil: "ASESOR" | "GERENCIA"): ContextoConfirmacionHumana => ({ sujetoId: `${perfil}-ORACULO`, sesionId: "SES-ORACULO",
  perfil, canal: "INTERFAZ", traceId: "ORACULO", eventoAprobacionId: "EVH-ORACULO" });

async function pagarCuotaMasAntigua(casos: CasosUsoFinal, creditoId: string, clave: string) {
  const c = await casos.consultarCredito.ejecutar({ creditoId, fechaCorte: CORTE }, contexto("ASESOR"));
  if (c.proximaCuota === null) throw new Error(`${creditoId} sin cuota pendiente.`);
  const d = await casos.calcularDeudaCuota.ejecutar({ creditoId, numeroCuota: c.proximaCuota.numeroCuota, fechaCorte: CORTE }, contexto("ASESOR"));
  const p = await casos.proponerPago.ejecutar({ creditoId, fechaCorte: CORTE, numeroCuota: d.numeroCuota, monto: d.totalExigible, claveIdempotencia: clave }, contexto("ASESOR"));
  await casos.confirmarPago.ejecutar({ propuestaId: p.propuestaId, fechaOperacion: CORTE, versionCredito: p.versionCredito },
    { ...contexto("ASESOR"), claveIdempotencia: clave });
}

/** OP-1 (cuota más antigua de 0043), OP-2 (de 0035) y OP-3 (alta CL-9001 + originación CV-2026-9001). */
export async function ejecutarOp1aOp3(casos: CasosUsoFinal): Promise<void> {
  await pagarCuotaMasAntigua(casos, "CV-2026-0043", "ORACULO-OP1");
  await pagarCuotaMasAntigua(casos, "CV-2026-0035", "ORACULO-OP2");
  await casos.altaCliente.ejecutar({ clienteId: "CL-9001", nombreCompleto: "Gerencia Demostración Gálvez",
    identificadorLegal: { tipo: "DPI", valor: "DPI-FICT-009001" }, municipio: "Guatemala", fechaAlta: CORTE }, contexto("ASESOR"));
  await casos.solicitarCredito.ejecutar({ creditoId: "CV-2026-9001", clienteId: "CL-9001", asesorId: "AS-01", monto: { importe: "10000.00", moneda: "GTQ" },
    plazoMeses: 12, tasaNominalAnual: "0.36", fechaSolicitud: CORTE }, contexto("ASESOR"));
  await casos.aprobarCredito.ejecutar({ creditoId: "CV-2026-9001", fechaOperacion: CORTE, motivo: "Comité" }, contexto("GERENCIA"));
  await casos.desembolsarCredito.ejecutar({ creditoId: "CV-2026-9001", fechaOperacion: CORTE, motivo: "Desembolso" }, contexto("ASESOR"));
}

/** Resultado de cada consulta del oráculo con los casos de uso indicados. */
export async function consultarOraculo(casos: CasosUsoFinal): Promise<Record<ClaveOraculo, unknown>> {
  const salida = {} as Record<ClaveOraculo, unknown>;
  for (const [clave, { operacion, entrada }] of Object.entries(CONSULTAS_ORACULO) as [ClaveOraculo, (typeof CONSULTAS_ORACULO)[ClaveOraculo]][]) {
    salida[clave] = await (casos[operacion].ejecutar as (e: unknown, c: unknown) => Promise<unknown>)(entrada, contexto("GERENCIA"));
  }
  return salida;
}
