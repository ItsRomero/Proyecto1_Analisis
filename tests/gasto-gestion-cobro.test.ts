import { describe, expect, it } from "vitest";
import { FechaCivil, CalculadoraMora, DiasAtraso } from "../src/dominio/calculadora-mora.js";
import { Dinero } from "../src/dominio/dinero.js";
import { generarGastoGestion, incorporarGastoGestion } from "../src/dominio/gasto-gestion-cobro.js";
import { PoliticaEscalonada } from "../src/dominio/politica-mora/politica-escalonada.js";
import { ConceptoPrelacion, ProcesadorPrelacionPago } from "../src/dominio/prelacion-pago.js";

const fecha = (s: string) => FechaCivil.desdeCadena(s);
const q = (s: string) => Dinero.desdeCadena(s, "GTQ");
const entrada = { creditoId: "CR-1", cuotaId: "2", fechaVencimiento: fecha("2026-10-01"), identificadoresRegistrados: Object.freeze([]) };

describe("CP-02: gasto por cuota e integración con prelación", () => {
  it.each(["2026-10-01", "2026-10-02", "2026-10-16", "2026-10-31"])("no genera hasta 30 días: %s", (corte) => {
    expect(generarGastoGestion({ ...entrada, fechaCorte: fecha(corte) }).nuevo).toBeNull();
  });
  it("genera Q25 al día 31, sin mutar entradas", () => {
    const r = generarGastoGestion({ ...entrada, fechaCorte: fecha("2026-11-01") });
    expect(r.nuevo?.importe.aCadena()).toBe("25.00");
    expect(r.nuevo?.concepto).toBe("GESTION_COBRO");
    expect(entrada.identificadoresRegistrados).toEqual([]);
    expect(Object.isFrozen(r.nuevo)).toBe(true);
  });
  it("invariante 6: repetir el cierre y cambiar de tramo no duplica", () => {
    let registros: readonly string[] = [];
    let total = q("0");
    for (const corte of ["2026-11-01", "2026-11-01", "2026-12-10", "2027-01-15", "2027-03-01"]) {
      const r = generarGastoGestion({ ...entrada, fechaCorte: fecha(corte), identificadoresRegistrados: registros });
      registros = r.identificadoresRegistrados;
      if (r.nuevo) total = total.sumar(r.nuevo.importe);
    }
    expect(registros).toHaveLength(1);
    expect(total.aCadena()).toBe("25.00");
  });
  it("distingue créditos y cuotas incluso con separadores en sus identificadores", () => {
    const a = generarGastoGestion({ ...entrada, creditoId: "a:b", cuotaId: "c", fechaCorte: fecha("2026-11-01") });
    const b = generarGastoGestion({ ...entrada, creditoId: "a", cuotaId: "b:c", fechaCorte: fecha("2026-11-01"), identificadoresRegistrados: a.identificadoresRegistrados });
    const c = generarGastoGestion({ ...entrada, cuotaId: "3", fechaCorte: fecha("2026-11-01"), identificadoresRegistrados: b.identificadoresRegistrados });
    expect(c.identificadoresRegistrados).toHaveLength(3);
  });
  it.each([["2026-11-15", 45, "1047.76", "25.00"], ["2026-10-16", 15, "1010.06", "0.00"]] as const)("M-5 y pago sin gasto al corte %s", (corte, dias, total, gasto) => {
    const r = generarGastoGestion({ ...entrada, fechaCorte: fecha(corte) });
    const mora = new CalculadoraMora(new PoliticaEscalonada()).calcular(q("725.76"), DiasAtraso.desdeNumero(dias));
    const saldos = incorporarGastoGestion({ gastosComisiones: q("0"), interesMoratorio: mora.interesMoratorio,
      interesCorriente: q("278.86"), capital: q("725.76") }, r);
    const pago = new ProcesadorPrelacionPago().procesar(q(total), saldos);
    expect(pago.pasos.map((p) => p.concepto)).toEqual([ConceptoPrelacion.GASTOS_COMISIONES, ConceptoPrelacion.INTERES_MORATORIO, ConceptoPrelacion.INTERES_CORRIENTE, ConceptoPrelacion.CAPITAL]);
    expect(pago.aplicadoA(ConceptoPrelacion.GASTOS_COMISIONES).aCadena()).toBe(gasto);
    expect(pago.pasos.every((p) => p.saldoPendiente.esCero())).toBe(true);
    expect(pago.excedente.aCadena()).toBe("0.00");
    const repetido = generarGastoGestion({ ...entrada, fechaCorte: fecha(corte), identificadoresRegistrados: r.identificadoresRegistrados });
    expect(incorporarGastoGestion(saldos, repetido).gastosComisiones.aCadena()).toBe(gasto);
  });
  it("un abono insuficiente cubre gastos primero", () => {
    const r = generarGastoGestion({ ...entrada, fechaCorte: fecha("2026-11-01") });
    const saldos = incorporarGastoGestion({ gastosComisiones: q("0"), interesMoratorio: q("18.14"), interesCorriente: q("278.86"), capital: q("725.76") }, r);
    const pago = new ProcesadorPrelacionPago().procesar(q("20"), saldos);
    expect(pago.pendienteDe(ConceptoPrelacion.GASTOS_COMISIONES).aCadena()).toBe("5.00");
    expect(pago.aplicadoA(ConceptoPrelacion.INTERES_MORATORIO).aCadena()).toBe("0.00");
  });
});
