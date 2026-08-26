import { describe, expect, it } from "vitest";

import {
  CalculadoraMora,
  CapitalVencidoInvalido,
  DiasAtraso,
  DiasAtrasoInvalidos,
  FechaCivil,
  FechaCivilInvalida,
  TasaMoratoriaInvalida,
  TasaNominalAnualMoratoria,
  TramoMora,
  clasificarTramoMora,
  debeDevengarInteresCorriente,
} from "../src/dominio/calculadora-mora.js";
import { Dinero } from "../src/dominio/dinero.js";

const gtq = (importe: string): Dinero => Dinero.desdeCadena(importe, "GTQ");
const fecha = (valor: string): FechaCivil => FechaCivil.desdeCadena(valor);
const dias = (valor: number): DiasAtraso => DiasAtraso.desdeNumero(valor);
const tasa24 = TasaNominalAnualMoratoria.desdeCadena("0.24");

describe("días calendario de atraso", () => {
  it("produce cero en la fecha de vencimiento", () => {
    expect(DiasAtraso.entre(fecha("2026-04-10"), fecha("2026-04-10")).valor).toBe(0);
  });

  it("produce uno al día calendario siguiente", () => {
    expect(DiasAtraso.entre(fecha("2026-04-10"), fecha("2026-04-11")).valor).toBe(1);
  });

  it("produce cero si el corte es anterior", () => {
    expect(DiasAtraso.entre(fecha("2026-04-10"), fecha("2026-03-01")).valor).toBe(0);
  });

  it("cuenta correctamente a través de un año bisiesto", () => {
    expect(DiasAtraso.entre(fecha("2024-02-28"), fecha("2024-03-01")).valor).toBe(2);
  });

  it.each(["2026-2-01", "2026-02-30", "2026-13-01", "texto"])(
    "rechaza la fecha civil inválida %s",
    (valor) => expect(() => fecha(valor)).toThrow(FechaCivilInvalida),
  );

  it.each([-1, 1.5, Number.NaN])("rechaza días inválidos %s", (valor) => {
    expect(() => dias(valor)).toThrow(DiasAtrasoInvalidos);
  });
});

describe("clasificación derivada de mora", () => {
  it.each([
    [0, TramoMora.SIN_MORA],
    [1, TramoMora.MORA_1],
    [30, TramoMora.MORA_1],
    [31, TramoMora.MORA_2],
    [60, TramoMora.MORA_2],
    [61, TramoMora.MORA_3],
    [90, TramoMora.MORA_3],
    [91, TramoMora.VENCIDO],
    [120, TramoMora.VENCIDO],
    [121, TramoMora.INCOBRABLE],
  ])("clasifica %i días como %s", (cantidad, esperado) => {
    expect(clasificarTramoMora(dias(cantidad))).toBe(esperado);
  });

  it("suspende interés corriente después de 90 días, no antes", () => {
    expect(debeDevengarInteresCorriente(dias(90))).toBe(true);
    expect(debeDevengarInteresCorriente(dias(91))).toBe(false);
  });
});

describe("interés moratorio Actual/360", () => {
  it("cumple CA-02: Q725.76 al 24% durante 15 días produce Q7.26", () => {
    const resultado = CalculadoraMora.calcularInteresMoratorio(
      gtq("725.76"), tasa24, dias(15),
    );
    expect(resultado.aCadena()).toBe("7.26");
  });

  it("expone exactamente la tasa diaria Actual/360", () => {
    expect(tasa24.aTasaDiariaActual360()).toBe(
      "0.0006666666666666666666666666666666666666667",
    );
  });

  it.each([
    ["0.00", 15, "0.00"],
    ["725.76", 0, "0.00"],
    ["725.76", 30, "14.52"],
  ])("calcula capital %s y %i días como %s", (capital, atraso, esperado) => {
    expect(
      CalculadoraMora.calcularInteresMoratorio(gtq(capital), tasa24, dias(atraso)).aCadena(),
    ).toBe(esperado);
  });

  it.each(["-0.1", "NaN", "0,24", " 0.24", ""])(
    "rechaza la tasa inválida %s",
    (valor) => expect(() => TasaNominalAnualMoratoria.desdeCadena(valor)).toThrow(TasaMoratoriaInvalida),
  );

  it("rechaza capital vencido negativo", () => {
    expect(() =>
      CalculadoraMora.calcularInteresMoratorio(gtq("-1"), tasa24, dias(1)),
    ).toThrow(CapitalVencidoInvalido);
  });

  it("calcula cada cuota vencida independientemente", () => {
    const resultados = CalculadoraMora.calcularVariasCuotas(
      [
        { referencia: "C-01", capitalVencido: gtq("725.76"), fechaVencimiento: fecha("2026-04-10") },
        { referencia: "C-02", capitalVencido: gtq("500.00"), fechaVencimiento: fecha("2026-04-20") },
      ],
      tasa24,
      fecha("2026-04-25"),
    );

    expect(resultados).toHaveLength(2);
    expect(resultados[0]?.diasAtraso.valor).toBe(15);
    expect(resultados[0]?.interesMoratorio.aCadena()).toBe("7.26");
    expect(resultados[1]?.diasAtraso.valor).toBe(5);
    expect(resultados[1]?.interesMoratorio.aCadena()).toBe("1.67");
    expect(Object.isFrozen(resultados)).toBe(true);
    expect(Object.isFrozen(resultados[0])).toBe(true);
  });

  it("deriva días y tramo al calcular una cuota", () => {
    const resultado = CalculadoraMora.calcularPorCuota(
      { referencia: "C-01", capitalVencido: gtq("725.76"), fechaVencimiento: fecha("2026-01-01") },
      tasa24,
      fecha("2026-05-02"),
    );
    expect(resultado.diasAtraso.valor).toBe(121);
    expect(resultado.tramo).toBe(TramoMora.INCOBRABLE);
  });
});

describe("contratos de tipos", () => {
  it("solo admite cadenas exactas para las tasas", () => {
    // @ts-expect-error Un number no es una entrada monetaria exacta autorizada.
    expect(() => TasaNominalAnualMoratoria.desdeCadena(0.24)).toThrow();
  });
});
