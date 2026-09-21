import { describe, expect, it } from "vitest";
import { calcularCarteraPorTramo } from "../src/dominio/cartera-por-tramo.js";
import { EstadoCredito } from "../src/dominio/credito-estado.js";
import { Dinero } from "../src/dominio/dinero.js";
import { FechaCivil } from "../src/dominio/calculadora-mora.js";

const q = (s: string) => Dinero.desdeCadena(s, "GTQ");
const fecha = (s: string) => FechaCivil.desdeCadena(s);
const credito = (id: string, saldo: string, diasAtraso: number, estado = EstadoCredito.EN_MORA) => ({ id, saldoCapital: q(saldo), diasAtraso, estado });
const datos = { moneda: "GTQ", fechaCorte: fecha("2027-02-01"), inicioPeriodo: fecha("2027-01-01") };
const creditos = [credito("C-001", "24000", 45), credito("C-002", "18000", 75),
  credito("C-005", "8000", 100), credito("C-R", "6000", 0, EstadoCredito.REESTRUCTURADO),
  credito("C-M1", "124000", 15), credito("C-V", "620000", 0, EstadoCredito.VIGENTE)];

describe("CP-04.3: desglose de contribuciones al riesgo", () => {
  it("cumple oráculo: 7.00% en riesgo y 21.75% en mora", () => {
    const r = calcularCarteraPorTramo({ ...datos, creditos });
    expect(r.carteraActiva.aCadena()).toBe("800000.00");
    expect(r.tramosEnRiesgo.map((t) => [t.tramo, t.cantidadCreditos, t.saldoCapital.aCadena(), t.porcentaje])).toEqual([
      ["MORA_1", 0, "0.00", "0.00"], ["MORA_2", 1, "24000.00", "3.00"],
      ["MORA_3", 1, "18000.00", "2.25"], ["VENCIDO", 1, "8000.00", "1.00"],
      ["REESTRUCTURADO", 1, "6000.00", "0.75"],
    ]);
    expect(r.totalEnRiesgo.saldoCapital.aCadena()).toBe("56000.00");
    expect(r.totalEnRiesgo.porcentaje).toBe("7.00");
    expect(r.carteraEnMora.saldoCapital.aCadena()).toBe("174000.00");
    expect(r.carteraEnMora.porcentaje).toBe("21.75");
  });
  it("excluye C-005 y conserva la baja del período; riesgo = 6.06%", () => {
    const r = calcularCarteraPorTramo({ ...datos,
      creditos: creditos.map((c) => c.id === "C-005" ? { ...c, estado: EstadoCredito.INCOBRABLE, diasAtraso: 121 } : c),
      bajas: [{ creditoId: "C-005", fecha: fecha("2027-01-31"), saldoCapital: q("8000") }],
    });
    expect(r.carteraActiva.aCadena()).toBe("792000.00");
    expect(r.totalEnRiesgo.saldoCapital.aCadena()).toBe("48000.00");
    expect(r.totalEnRiesgo.porcentaje).toBe("6.06");
    expect(r.incobrablesDelPeriodo.saldoCapital.aCadena()).toBe("8000.00");
    expect(r.incobrablesDelPeriodo.creditos[0]?.creditoId).toBe("C-005");
  });
  it("invariante 7: concilia porcentajes incluso cuando redondear cada razón perdería centésimas", () => {
    const r = calcularCarteraPorTramo({ ...datos, creditos: [credito("1", "1", 31), credito("2", "1", 61), credito("3", "1", 91)] });
    expect(r.tramosEnRiesgo.map((t) => t.porcentaje)).toEqual(["0.00", "33.34", "33.33", "33.33", "0.00"]);
    const sumaPorcentajes = r.tramosEnRiesgo.reduce((s, t) => s + BigInt(t.porcentaje!.replace(".", "")), 0n);
    expect(sumaPorcentajes).toBe(BigInt(r.totalEnRiesgo.porcentaje!.replace(".", "")));
    expect(r.tramosEnRiesgo.reduce((s, t) => s.sumar(t.saldoCapital), q("0")).esIgualA(r.totalEnRiesgo.saldoCapital)).toBe(true);
  });
  it("evita doble conteo de reestructurados y conserva >120 pendientes de declaración como vencido", () => {
    const r = calcularCarteraPorTramo({ ...datos, creditos: [credito("R", "100", 65, EstadoCredito.REESTRUCTURADO), credito("V", "200", 121)] });
    expect(r.totalEnRiesgo.saldoCapital.aCadena()).toBe("300.00");
    expect(r.tramosEnRiesgo.find((t) => t.tramo === "MORA_3")?.saldoCapital.aCadena()).toBe("0.00");
    expect(r.tramosEnRiesgo.find((t) => t.tramo === "VENCIDO")?.saldoCapital.aCadena()).toBe("200.00");
  });
  it("sin activa no inventa un cociente", () => {
    const r = calcularCarteraPorTramo({ ...datos, creditos: [] });
    expect(r.agregado.tipo).toBe("SIN_CARTERA_ACTIVA");
    expect(r.totalEnRiesgo.porcentaje).toBeNull();
    expect(r.tramosEnRiesgo.every((t) => t.porcentaje === null)).toBe(true);
  });
  it("filtra bajas por período, valida duplicados y estado", () => {
    const baja = { creditoId: "B", fecha: fecha("2026-12-31"), saldoCapital: q("8") };
    expect(calcularCarteraPorTramo({ ...datos, creditos: [], bajas: [baja] }).incobrablesDelPeriodo.cantidadCreditos).toBe(0);
    expect(() => calcularCarteraPorTramo({ ...datos, creditos: [], bajas: [baja, baja] })).toThrow("duplicada");
    expect(() => calcularCarteraPorTramo({ ...datos, creditos, bajas: [{ ...baja, creditoId: "C-005" }] })).toThrow("estado");
  });
});
