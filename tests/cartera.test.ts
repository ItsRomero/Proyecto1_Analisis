import { describe, expect, it } from "vitest";

import {
  CalculadoraCarteraRiesgo,
  CreditoCarteraDuplicado,
  CreditoCarteraInvalido,
  type CreditoParaCartera,
} from "../src/dominio/cartera.js";
import { EstadoCredito } from "../src/dominio/credito-estado.js";
import { Dinero, MonedasIncompatibles } from "../src/dominio/dinero.js";

const gtq = (valor: string): Dinero => Dinero.desdeCadena(valor, "GTQ");
const credito = (
  id: string,
  saldo: string,
  diasAtraso: number,
  estado: EstadoCredito = EstadoCredito.VIGENTE,
): CreditoParaCartera => ({ id, saldoCapital: gtq(saldo), diasAtraso, estado });

const carteraReferencia = (estadoC005: EstadoCredito): readonly CreditoParaCartera[] => [
  credito("C-001", "48000", 31),
  credito("C-002", "744000", 0),
  credito("C-005", "8000", 121, estadoC005),
];

describe("casos de aceptación de cartera en riesgo", () => {
  it("cumple CA-06: Q56,000 / Q800,000 = 7.00%", () => {
    const resultado = CalculadoraCarteraRiesgo.calcular(
      carteraReferencia(EstadoCredito.EN_MORA), "GTQ",
    );
    expect(resultado.tipo).toBe("CON_RAZON");
    if (resultado.tipo === "CON_RAZON") {
      expect(resultado.carteraActiva.aCadena()).toBe("800000.00");
      expect(resultado.capitalEnRiesgo.aCadena()).toBe("56000.00");
      expect(resultado.razon.aRazonCadena()).toBe("0.07");
      expect(resultado.razon.aPorcentajeCadena()).toBe("7.00");
    }
  });

  it("cumple CA-07: excluye C-005 y obtiene 6.06%", () => {
    const resultado = CalculadoraCarteraRiesgo.calcular(
      carteraReferencia(EstadoCredito.INCOBRABLE), "GTQ",
    );
    expect(resultado.tipo).toBe("CON_RAZON");
    if (resultado.tipo === "CON_RAZON") {
      expect(resultado.carteraActiva.aCadena()).toBe("792000.00");
      expect(resultado.capitalEnRiesgo.aCadena()).toBe("48000.00");
      expect(resultado.razon.aPorcentajeCadena()).toBe("6.06");
    }
  });
});

describe("reglas de inclusión y riesgo", () => {
  it("usa el saldo completo, no una cuota vencida", () => {
    const resultado = CalculadoraCarteraRiesgo.calcular([
      credito("C-1", "10000", 31),
    ], "GTQ");
    if (resultado.tipo !== "CON_RAZON") throw new Error("se esperaba razón");
    expect(resultado.capitalEnRiesgo.aCadena()).toBe("10000.00");
    expect(resultado.razon.aPorcentajeCadena()).toBe("100.00");
  });

  it("30 días no es riesgo y 31 días sí", () => {
    const resultado = CalculadoraCarteraRiesgo.calcular([
      credito("C-30", "100", 30), credito("C-31", "100", 31),
    ], "GTQ");
    if (resultado.tipo !== "CON_RAZON") throw new Error("se esperaba razón");
    expect(resultado.capitalEnRiesgo.aCadena()).toBe("100.00");
    expect(resultado.razon.aPorcentajeCadena()).toBe("50.00");
  });

  it("incluye reestructurado al día", () => {
    const resultado = CalculadoraCarteraRiesgo.calcular([
      credito("R-1", "200", 0, EstadoCredito.REESTRUCTURADO),
      credito("V-1", "800", 0),
    ], "GTQ");
    if (resultado.tipo !== "CON_RAZON") throw new Error("se esperaba razón");
    expect(resultado.capitalEnRiesgo.aCadena()).toBe("200.00");
    expect(resultado.razon.aPorcentajeCadena()).toBe("20.00");
  });

  it("no duplica un reestructurado que además tiene más de 30 días", () => {
    const resultado = CalculadoraCarteraRiesgo.calcular([
      credito("R-1", "200", 31, EstadoCredito.REESTRUCTURADO),
      credito("V-1", "800", 0),
    ], "GTQ");
    if (resultado.tipo !== "CON_RAZON") throw new Error("se esperaba razón");
    expect(resultado.capitalEnRiesgo.aCadena()).toBe("200.00");
  });

  it.each([
    EstadoCredito.SOLICITADO,
    EstadoCredito.APROBADO,
    EstadoCredito.RECHAZADO,
    EstadoCredito.ANULADO,
    EstadoCredito.CANCELADO,
    EstadoCredito.INCOBRABLE,
  ])("excluye del ciclo activo el estado %s", (estado) => {
    const resultado = CalculadoraCarteraRiesgo.calcular([
      credito("X", "100", 200, estado),
    ], "GTQ");
    expect(resultado.tipo).toBe("SIN_CARTERA_ACTIVA");
  });
});

describe("invariantes y entradas inválidas", () => {
  it("devuelve SIN_CARTERA_ACTIVA para una fotografía vacía", () => {
    const resultado = CalculadoraCarteraRiesgo.calcular([], "GTQ");
    expect(resultado.tipo).toBe("SIN_CARTERA_ACTIVA");
    expect(resultado.carteraActiva.aCadena()).toBe("0.00");
    expect(resultado.capitalEnRiesgo.aCadena()).toBe("0.00");
    expect("razon" in resultado).toBe(false);
  });

  it("produce los extremos válidos 0% y 100%", () => {
    const cero = CalculadoraCarteraRiesgo.calcular([credito("C-0", "100", 0)], "GTQ");
    const cien = CalculadoraCarteraRiesgo.calcular([credito("C-1", "100", 31)], "GTQ");
    expect(cero.tipo === "CON_RAZON" && cero.razon.aPorcentajeCadena()).toBe("0.00");
    expect(cien.tipo === "CON_RAZON" && cien.razon.aPorcentajeCadena()).toBe("100.00");
  });

  it("rechaza identificadores duplicados", () => {
    expect(() => CalculadoraCarteraRiesgo.calcular([
      credito("C-1", "10", 0), credito("C-1", "20", 0),
    ], "GTQ")).toThrow(CreditoCarteraDuplicado);
  });

  it.each([-1, 1.5, Number.NaN])("rechaza días inválidos %s", (dias) => {
    expect(() => CalculadoraCarteraRiesgo.calcular([
      credito("C-1", "10", dias),
    ], "GTQ")).toThrow(CreditoCarteraInvalido);
  });

  it("rechaza saldo negativo", () => {
    expect(() => CalculadoraCarteraRiesgo.calcular([
      credito("C-1", "-0.01", 0),
    ], "GTQ")).toThrow(CreditoCarteraInvalido);
  });

  it("rechaza monedas mezcladas incluso en créditos excluidos", () => {
    expect(() => CalculadoraCarteraRiesgo.calcular([{
      id: "C-1",
      estado: EstadoCredito.INCOBRABLE,
      saldoCapital: Dinero.desdeCadena("10", "USD"),
      diasAtraso: 121,
    }], "GTQ")).toThrow(MonedasIncompatibles);
  });

  it("congela los resultados", () => {
    const conRazon = CalculadoraCarteraRiesgo.calcular([credito("C-1", "100", 0)], "GTQ");
    const sinCartera = CalculadoraCarteraRiesgo.calcular([], "GTQ");
    expect(Object.isFrozen(conRazon)).toBe(true);
    expect(Object.isFrozen(sinCartera)).toBe(true);
  });
});
