import { describe, expect, it } from "vitest";

import { Dinero, MonedasIncompatibles } from "../src/dominio/dinero.js";
import {
  AmortizacionDirectaCapital,
  ConceptoPrelacion,
  ContextoExcedenteInvalido,
  PagoAnticipadoCuotasFuturas,
  PagoInvalido,
  ProcesadorPrelacionPago,
  SaldoExigibleInvalido,
  type SaldosExigibles,
} from "../src/dominio/prelacion-pago.js";

const gtq = (valor: string): Dinero => Dinero.desdeCadena(valor, "GTQ");
const exigibles = (): SaldosExigibles => ({
  gastosComisiones: gtq("0"),
  interesMoratorio: gtq("7.26"),
  interesCorriente: gtq("278.86"),
  capital: gtq("725.76"),
});
const contexto = (capital: string, cuotas: string) => ({
  capitalNoExigible: gtq(capital),
  cuotasFuturas: gtq(cuotas),
});

describe("Chain of Responsibility de prelación", () => {
  it("cumple CA-03 con el pago exacto", () => {
    const resultado = new ProcesadorPrelacionPago().procesar(gtq("1011.88"), exigibles());
    expect(resultado.pasos.map((paso) => paso.concepto)).toEqual([
      ConceptoPrelacion.GASTOS_COMISIONES,
      ConceptoPrelacion.INTERES_MORATORIO,
      ConceptoPrelacion.INTERES_CORRIENTE,
      ConceptoPrelacion.CAPITAL,
    ]);
    expect(resultado.aplicadoA(ConceptoPrelacion.GASTOS_COMISIONES).aCadena()).toBe("0.00");
    expect(resultado.aplicadoA(ConceptoPrelacion.INTERES_MORATORIO).aCadena()).toBe("7.26");
    expect(resultado.aplicadoA(ConceptoPrelacion.INTERES_CORRIENTE).aCadena()).toBe("278.86");
    expect(resultado.aplicadoA(ConceptoPrelacion.CAPITAL).aCadena()).toBe("725.76");
    expect(resultado.excedente.aCadena()).toBe("0.00");
  });

  it("cumple CA-04 y acepta el pago parcial", () => {
    const resultado = new ProcesadorPrelacionPago().procesar(gtq("500"), exigibles());
    expect(resultado.aplicadoA(ConceptoPrelacion.INTERES_MORATORIO).aCadena()).toBe("7.26");
    expect(resultado.aplicadoA(ConceptoPrelacion.INTERES_CORRIENTE).aCadena()).toBe("278.86");
    expect(resultado.aplicadoA(ConceptoPrelacion.CAPITAL).aCadena()).toBe("213.88");
    expect(resultado.pendienteDe(ConceptoPrelacion.CAPITAL).aCadena()).toBe("511.88");
    expect(resultado.excedente.aCadena()).toBe("0.00");
  });

  it("detiene consumo después de agotar un pago pequeño", () => {
    const saldos = { ...exigibles(), gastosComisiones: gtq("10") };
    const resultado = new ProcesadorPrelacionPago().procesar(gtq("5"), saldos);
    expect(resultado.aplicadoA(ConceptoPrelacion.GASTOS_COMISIONES).aCadena()).toBe("5.00");
    expect(resultado.aplicadoA(ConceptoPrelacion.INTERES_MORATORIO).aCadena()).toBe("0.00");
    expect(resultado.pendienteDe(ConceptoPrelacion.GASTOS_COMISIONES).aCadena()).toBe("5.00");
  });

  it("ningún eslabón consume más que su saldo", () => {
    const resultado = new ProcesadorPrelacionPago().procesar(gtq("9999"), exigibles());
    for (const paso of resultado.pasos) {
      expect(paso.aplicado.esMenorOIgualQue(paso.saldoExigible)).toBe(true);
      expect(paso.saldoPendiente.esNegativo()).toBe(false);
      expect(paso.remanente.esNegativo()).toBe(false);
    }
  });
});

describe("Strategy de excedente", () => {
  it("cumple CA-05 y conserva Q1,988.12 con amortización directa", () => {
    const resultado = new ProcesadorPrelacionPago(
      new AmortizacionDirectaCapital(),
    ).procesar(gtq("3000"), exigibles(), contexto("5000", "5000"));
    expect(resultado.excedente.aCadena()).toBe("1988.12");
    expect(resultado.resultadoExcedente.aplicadoCapital.aCadena()).toBe("1988.12");
    expect(resultado.resultadoExcedente.aplicadoCuotasFuturas.aCadena()).toBe("0.00");
    expect(resultado.resultadoExcedente.remanente.aCadena()).toBe("0.00");
    expect(resultado.politicaExcedente).toBe("AMORTIZACION_DIRECTA_CAPITAL");
  });

  it("limita amortización directa al capital disponible y conserva remanente", () => {
    const resultado = new ProcesadorPrelacionPago().procesar(
      gtq("3000"), exigibles(), contexto("1000", "5000"),
    );
    expect(resultado.resultadoExcedente.aplicadoCapital.aCadena()).toBe("1000.00");
    expect(resultado.resultadoExcedente.remanente.aCadena()).toBe("988.12");
    expect(resultado.resultadoExcedente.total().aCadena()).toBe("1988.12");
  });

  it("permite sustituir por pago anticipado sin cambiar la cadena", () => {
    const resultado = new ProcesadorPrelacionPago(
      new PagoAnticipadoCuotasFuturas(),
    ).procesar(gtq("3000"), exigibles(), contexto("5000", "1500"));
    expect(resultado.aplicadoA(ConceptoPrelacion.CAPITAL).aCadena()).toBe("725.76");
    expect(resultado.resultadoExcedente.aplicadoCuotasFuturas.aCadena()).toBe("1500.00");
    expect(resultado.resultadoExcedente.remanente.aCadena()).toBe("488.12");
    expect(resultado.politicaExcedente).toBe("PAGO_ANTICIPADO_CUOTAS_FUTURAS");
  });
});

describe("invariantes y errores", () => {
  it.each(["0", "-1"])("rechaza pago no positivo %s", (valor) => {
    expect(() => new ProcesadorPrelacionPago().procesar(gtq(valor), exigibles())).toThrow(PagoInvalido);
  });

  it("rechaza saldos exigibles negativos", () => {
    const saldos = { ...exigibles(), interesMoratorio: gtq("-0.01") };
    expect(() => new ProcesadorPrelacionPago().procesar(gtq("10"), saldos)).toThrow(SaldoExigibleInvalido);
  });

  it("rechaza monedas incompatibles", () => {
    const saldos = { ...exigibles(), capital: Dinero.desdeCadena("10", "USD") };
    expect(() => new ProcesadorPrelacionPago().procesar(gtq("10"), saldos)).toThrow(MonedasIncompatibles);
  });

  it("rechaza contexto de excedente negativo", () => {
    expect(() => new ProcesadorPrelacionPago().procesar(
      gtq("3000"), exigibles(), contexto("-1", "0"),
    )).toThrow(ContextoExcedenteInvalido);
  });

  it("conserva exactamente pago y excedente", () => {
    const resultado = new ProcesadorPrelacionPago().procesar(
      gtq("3000"), exigibles(), contexto("1000", "0"),
    );
    const conceptos = resultado.pasos.reduce(
      (total, paso) => total.sumar(paso.aplicado), gtq("0"),
    );
    expect(conceptos.sumar(resultado.excedente).esIgualA(resultado.pago)).toBe(true);
    expect(resultado.resultadoExcedente.total().esIgualA(resultado.excedente)).toBe(true);
  });

  it("congela aplicación, pasos y resultado de estrategia", () => {
    const resultado = new ProcesadorPrelacionPago().procesar(gtq("1011.88"), exigibles());
    expect(Object.isFrozen(resultado)).toBe(true);
    expect(Object.isFrozen(resultado.pasos)).toBe(true);
    expect(resultado.pasos.every(Object.isFrozen)).toBe(true);
    expect(Object.isFrozen(resultado.resultadoExcedente)).toBe(true);
  });
});
