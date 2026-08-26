import { describe, expect, expectTypeOf, it } from "vitest";

import {
  Dinero,
  DivisionMonetariaPorCero,
  EscalarMonetarioInvalido,
  ImporteMonetarioInvalido,
  Moneda,
  MonedaInvalida,
  MonedasIncompatibles,
} from "../src/dominio/dinero.js";

describe("Dinero", () => {
  it.each(["1000", "1000.0", "1000.00"])(
    "normaliza %s a dos decimales",
    (valor) => {
      const dinero = Dinero.desdeCadena(valor, "GTQ");

      expect(dinero.aCadena()).toBe("1000.00");
      expect(dinero.moneda.codigo).toBe("GTQ");
    },
  );

  it.each([
    ["1.004", "1.00"],
    ["1.005", "1.01"],
    ["1.006", "1.01"],
    ["-1.004", "-1.00"],
    ["-1.005", "-1.01"],
  ])("redondea %s como HALF_UP a %s", (entrada, esperado) => {
    expect(Dinero.desdeCadena(entrada, "GTQ").aCadena()).toBe(esperado);
  });

  it("suma exactamente sin modificar los operandos", () => {
    const primero = Dinero.desdeCadena("0.10", "GTQ");
    const segundo = Dinero.desdeCadena("0.20", "GTQ");

    const resultado = primero.sumar(segundo);

    expect(resultado.aCadena()).toBe("0.30");
    expect(primero.aCadena()).toBe("0.10");
    expect(segundo.aCadena()).toBe("0.20");
    expect(resultado).not.toBe(primero);
  });

  it("resta exactamente y puede representar un valor firmado", () => {
    const resultado = Dinero.desdeCadena("2.00", "GTQ").restar(
      Dinero.desdeCadena("3.25", "GTQ"),
    );

    expect(resultado.aCadena()).toBe("-1.25");
    expect(resultado.esNegativo()).toBe(true);
  });

  it("multiplica usando un escalar decimal expresado como cadena", () => {
    const resultado = Dinero.desdeCadena("725.76", "GTQ").multiplicar(
      "0.01",
    );

    expect(resultado.aCadena()).toBe("7.26");
  });

  it("divide y redondea el resultado monetario", () => {
    const resultado = Dinero.desdeCadena("10.00", "GTQ").dividir("3");

    expect(resultado.aCadena()).toBe("3.33");
  });

  it("rechaza la división entre cero", () => {
    const dinero = Dinero.desdeCadena("10.00", "GTQ");

    expect(() => dinero.dividir("0")).toThrow(DivisionMonetariaPorCero);
  });

  it.each(["", " ", "NaN", "Infinity", "1e3", ".50", "1.", "01.00", "1,000.00"])(
    "rechaza el formato de importe inválido %j",
    (valor) => {
      expect(() => Dinero.desdeCadena(valor, "GTQ")).toThrow(
        ImporteMonetarioInvalido,
      );
    },
  );

  it.each(["", "NaN", "Infinity", "1e2", ".5", "01"])(
    "rechaza el formato de escalar inválido %j",
    (valor) => {
      const dinero = Dinero.desdeCadena("10.00", "GTQ");
      expect(() => dinero.multiplicar(valor)).toThrow(
        EscalarMonetarioInvalido,
      );
    },
  );

  it("rechaza operaciones entre monedas distintas", () => {
    const quetzales = Dinero.desdeCadena("10.00", "GTQ");
    const dolares = Dinero.desdeCadena("10.00", "USD");

    expect(() => quetzales.sumar(dolares)).toThrow(MonedasIncompatibles);
    expect(() => quetzales.restar(dolares)).toThrow(MonedasIncompatibles);
    expect(() => quetzales.esMayorQue(dolares)).toThrow(
      MonedasIncompatibles,
    );
  });

  it.each(["gtq", "GT", "GTQQ", "12Q", " GTQ"])(
    "rechaza el código de moneda inválido %j",
    (codigo) => {
      expect(() => Moneda.desdeCodigo(codigo)).toThrow(MonedaInvalida);
    },
  );

  it("crea y reconoce cero por moneda", () => {
    const cero = Dinero.cero("GTQ");

    expect(cero.aCadena()).toBe("0.00");
    expect(cero.esCero()).toBe(true);
    expect(cero.esNegativo()).toBe(false);
  });

  it("convierte unidades menores sin pasar por punto flotante", () => {
    const dinero = Dinero.desdeUnidadesMenores(100_462n, "GTQ");

    expect(dinero.aCadena()).toBe("1004.62");
    expect(dinero.aUnidadesMenores()).toBe(100_462n);
  });

  it("realiza el viaje exacto de unidades menores negativas", () => {
    const dinero = Dinero.desdeUnidadesMenores(-101n, "GTQ");

    expect(dinero.aCadena()).toBe("-1.01");
    expect(dinero.aUnidadesMenores()).toBe(-101n);
  });

  it("compara por importe normalizado y moneda", () => {
    const primero = Dinero.desdeCadena("10", "GTQ");
    const segundo = Dinero.desdeCadena("10.004", Moneda.desdeCodigo("GTQ"));
    const mayor = Dinero.desdeCadena("10.01", "GTQ");

    expect(primero.esIgualA(segundo)).toBe(true);
    expect(mayor.esMayorQue(primero)).toBe(true);
    expect(mayor.esMayorOIgualQue(primero)).toBe(true);
    expect(primero.esMenorQue(mayor)).toBe(true);
    expect(primero.esMenorOIgualQue(segundo)).toBe(true);
  });

  it("calcula mínimo y máximo como nuevas instancias", () => {
    const menor = Dinero.desdeCadena("2.00", "GTQ");
    const mayor = Dinero.desdeCadena("3.00", "GTQ");

    const minimo = menor.minimo(mayor);
    const maximo = menor.maximo(mayor);

    expect(minimo.aCadena()).toBe("2.00");
    expect(maximo.aCadena()).toBe("3.00");
    expect(minimo).not.toBe(menor);
    expect(maximo).not.toBe(mayor);
  });

  it("niega y obtiene el valor absoluto sin mutar el original", () => {
    const original = Dinero.desdeCadena("5.25", "GTQ");

    expect(original.negar().aCadena()).toBe("-5.25");
    expect(original.negar().absoluto().aCadena()).toBe("5.25");
    expect(original.aCadena()).toBe("5.25");
  });

  it("serializa el importe como cadena y conserva la moneda", () => {
    const dinero = Dinero.desdeCadena("1004.62", "GTQ");

    expect(dinero.aJSON()).toEqual({
      importe: "1004.62",
      moneda: "GTQ",
    });
    expect(JSON.stringify(dinero)).toBe(
      '{"importe":"1004.62","moneda":"GTQ"}',
    );
  });

  it("expone instancias congeladas", () => {
    const moneda = Moneda.desdeCodigo("GTQ");
    const dinero = Dinero.desdeCadena("1.00", moneda);

    expect(Object.isFrozen(moneda)).toBe(true);
    expect(Object.isFrozen(dinero)).toBe(true);
    expect(Object.isFrozen(dinero.aJSON())).toBe(true);
  });

  it("no acepta number como importe o escalar en su API pública", () => {
    expectTypeOf(Dinero.desdeCadena).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(Dinero.desdeUnidadesMenores)
      .parameter(0)
      .toEqualTypeOf<bigint>();
    expectTypeOf<Dinero["multiplicar"]>()
      .parameter(0)
      .toEqualTypeOf<string>();
    expectTypeOf<Dinero["dividir"]>()
      .parameter(0)
      .toEqualTypeOf<string>();
  });
});
