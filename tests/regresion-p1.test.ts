import { describe, expect, it } from "vitest";
import { CalculadoraMora, DiasAtraso, FechaCivil, TasaNominalAnualMoratoria } from "../src/dominio/calculadora-mora.js";
import { Dinero } from "../src/dominio/dinero.js";
import { consultarMora } from "../src/aplicacion/consultar-mora.js";
import { EstadoCredito } from "../src/dominio/credito-estado.js";
import { calcularCarteraPorTramo } from "../src/dominio/cartera-por-tramo.js";

const q = (s: string) => Dinero.desdeCadena(s, "GTQ");
const fecha = (s: string) => FechaCivil.desdeCadena(s);

describe("Regresión P1 y coexistencia en aplicación", () => {
  it("conserva API de tasa directa y CA-02", () => {
    const interes = CalculadoraMora.calcularInteresMoratorio(q("725.76"), TasaNominalAnualMoratoria.desdeCadena("0.24"), DiasAtraso.desdeNumero(15));
    expect(interes.aCadena()).toBe("7.26");
  });
  it("invariante 5: los otorgamientos previos mantienen 7.26 con cortes posteriores a la nueva vigencia", () => {
    const datos = { creditoId: "C", estado: EstadoCredito.EN_MORA as const, fechaOtorgamiento: fecha("2026-09-30"),
      fechaCorte: fecha("2026-11-16"), cuotas: [{ referencia: "1", capitalVencido: q("725.76"), fechaVencimiento: fecha("2026-11-01") }] };
    const anterior = consultarMora(datos);
    const nuevo = consultarMora({ ...datos, fechaOtorgamiento: fecha("2026-10-01") });
    expect(anterior.politicaId).toBe("POL-2024-01");
    expect(anterior.cuotas[0]?.interesMoratorio.aCadena()).toBe("7.26");
    expect(nuevo.cuotas[0]?.interesMoratorio.aCadena()).toBe("5.44");
  });
  it.each(["2026-09-30", "2026-10-01"])("invariante 8: incobrable congela mora y sale de activa, otorgamiento %s", (otorgamiento) => {
    const datos = { creditoId: "C", estado: EstadoCredito.INCOBRABLE as const, fechaOtorgamiento: fecha(otorgamiento),
      fechaDeclaracionIncobrable: fecha("2027-01-30"), fechaCorte: fecha("2027-01-30"),
      cuotas: [{ referencia: "1", capitalVencido: q("725.76"), fechaVencimiento: fecha("2026-10-01") }] };
    const baja = consultarMora(datos);
    const despues = consultarMora({ ...datos, fechaCorte: fecha("2027-03-01") });
    expect(despues.cuotas[0]?.interesMoratorio.aCadena()).toBe(baja.cuotas[0]?.interesMoratorio.aCadena());
    if (otorgamiento === "2026-10-01") expect(despues.cuotas[0]?.interesMoratorio.aCadena()).toBe("65.32");
    const cartera = calcularCarteraPorTramo({ moneda: "GTQ", inicioPeriodo: fecha("2027-01-01"), fechaCorte: datos.fechaCorte,
      creditos: [{ id: "C", estado: datos.estado, saldoCapital: q("725.76"), diasAtraso: 121 }],
      bajas: [{ creditoId: "C", fecha: datos.fechaDeclaracionIncobrable, saldoCapital: q("725.76") }] });
    expect(cartera.carteraActiva.aCadena()).toBe("0.00");
    expect(cartera.incobrablesDelPeriodo.saldoCapital.aCadena()).toBe("725.76");
  });
  it("rechaza corte anterior a otorgamiento o baja fuera de período", () => {
    const datos = { creditoId: "C", estado: EstadoCredito.INCOBRABLE as const, fechaOtorgamiento: fecha("2026-10-01"), fechaCorte: fecha("2027-01-01"), fechaDeclaracionIncobrable: fecha("2027-02-01"), cuotas: [] };
    expect(() => consultarMora(datos)).toThrow("fuera del período");
    expect(() => consultarMora({ ...datos, fechaCorte: fecha("2026-09-01") })).toThrow("anterior");
  });
});
