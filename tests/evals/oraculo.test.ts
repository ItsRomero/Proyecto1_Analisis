import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import type { CasosUsoFinal } from "../../src/aplicacion/casos-uso-final.js";
import type { SalidaFinal } from "../../src/contratos/proyecto-final.js";
import { Dinero } from "../../src/dominio/dinero.js";
import { casosEnMemoria } from "../apoyo/hechos-memoria.js";
import { consultarOraculo } from "../apoyo/guion-op.js";
import { CONSULTAS_ORACULO } from "./casos.js";

// Fase 7: el oráculo congelado (npm run evals:oraculo) se contrasta con el núcleo y con la reproducción independiente de fase 0.
interface Oraculo {
  origen: { comando: string; commit: string; fecha: string; node: string; huellaEventos: string };
  estados: Record<"POST_CARGA" | "POST_OP1_OP3", { descripcion: string; resultados: Record<string, unknown> }>;
}
const oraculo = JSON.parse(readFileSync("tests/evals/oraculo-congelado.json", "utf8")) as Oraculo;
const fase0 = JSON.parse(readFileSync("docs/proyecto-final/evidencia/reproduccion.json", "utf8")) as {
  sha256_eventos: string; situaciones_guion: Record<string, { pagadas: number; vencidas: number; dias_atraso: number; saldo_capital_centavos: number }>;
  incobrables_derivados: Record<string, unknown>; reestructurados: Record<string, unknown>; g7_dias_cuota2: number;
};
const post = oraculo.estados.POST_CARGA.resultados;
const op = oraculo.estados.POST_OP1_OP3.resultados;
const gtq = (i: string) => Dinero.desdeCadena(i, "GTQ");
let casos: CasosUsoFinal;
beforeAll(async () => { casos = (await casosEnMemoria()).casos; });

describe("fase 7: oráculo congelado con origen", () => {
  it("declara comando, commit, fecha, huella del paquete y ambos estados de partida", () => {
    expect(oraculo.origen.comando).toBe("npm run evals:oraculo");
    expect(oraculo.origen.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(oraculo.origen.huellaEventos).toBe(fase0.sha256_eventos);
    expect(Object.keys(post).sort()).toEqual(Object.keys(CONSULTAS_ORACULO).sort());
    expect(Object.keys(op).sort()).toEqual(Object.keys(CONSULTAS_ORACULO).sort());
  });

  it("POST_CARGA coincide exactamente con el núcleo actual (detecta regresiones de cifras)", async () => {
    expect(await consultarOraculo(casos)).toEqual(post);
  });

  it("POST_CARGA coincide con la reproducción independiente de fase 0", () => {
    const g5 = post["G-5.credito"] as SalidaFinal<"consultarCredito">;
    const esperado = fase0.situaciones_guion["CV-2026-0030"]!;
    expect({ pagadas: g5.cuotasPagadas, vencidas: g5.cuotasVencidas, dias: g5.diasAtraso, saldo: gtq(g5.saldoCapital.importe).aUnidadesMenores() })
      .toEqual({ pagadas: esperado.pagadas, vencidas: esperado.vencidas, dias: esperado.dias_atraso, saldo: BigInt(esperado.saldo_capital_centavos) });
    expect((post["G-7"] as SalidaFinal<"explicarMora">).cuotas[0]?.diasAtraso).toBe(fase0.g7_dias_cuota2);
    const g1 = post["G-1"] as SalidaFinal<"consultarCartera">;
    expect(g1.desglose?.incobrablesDelPeriodo.creditos.map((c) => c.creditoId)).toEqual(Object.keys(fase0.incobrables_derivados).sort());
    expect(g1.desglose?.tramosEnRiesgo.find((t) => t.tramo === "REESTRUCTURADO")?.cantidadCreditos).toBe(Object.keys(fase0.reestructurados).length);
    const g4 = post["G-4"] as SalidaFinal<"listarCreditosMora">;
    for (const c of g4.creditos) expect(c.diasAtraso, c.creditoId).toBe(fase0.situaciones_guion[c.creditoId]?.dias_atraso ?? c.diasAtraso);
    expect(g4.creditos.map((c) => c.creditoId)).toEqual(["CV-2026-0035", "CV-2026-0030"]);
  });

  it("POST_OP1_OP3 es consistente con las operaciones: un desembolso, dos pagos y la cartera conciliada", () => {
    const g3 = op["G-3"] as SalidaFinal<"consultarCierre">;
    expect(g3.desembolsos).toEqual({ cantidad: 1, monto: { importe: "10000.00", moneda: "GTQ" } });
    expect(g3.recuperaciones.cantidad).toBe(2);
    const antes = post["G-1"] as SalidaFinal<"consultarCartera">;
    const despues = op["G-1"] as SalidaFinal<"consultarCartera">;
    expect(gtq(despues.carteraActiva.importe).aCadena())
      .toBe(gtq(antes.carteraActiva.importe).sumar(gtq("10000.00")).restar(gtq(g3.recuperaciones.capital.importe)).aCadena());
    // OP-2 saca a 0035 de Mora 3; G-5 y G-7 no dependen de OP-1 a OP-3.
    expect((op["G-4"] as SalidaFinal<"listarCreditosMora">).creditos.map((c) => c.creditoId)).toEqual(["CV-2026-0030"]);
    expect(op["G-5.mora"]).toEqual(post["G-5.mora"]);
    expect(op["G-7"]).toEqual(post["G-7"]);
    const g6 = op["G-6.30"] as SalidaFinal<"proximosVencimientos">;
    expect(g6.cuotas.some((q) => q.creditoId === "CV-2026-9001" && q.fechaVencimiento === "2026-11-30")).toBe(true);
  });
});
