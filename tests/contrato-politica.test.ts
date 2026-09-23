import { describe, expect, it } from "vitest";
import { CalculadoraMora, DiasAtraso } from "../src/dominio/calculadora-mora.js";
import { Dinero } from "../src/dominio/dinero.js";
import { PoliticaEscalonada } from "../src/dominio/politica-mora/politica-escalonada.js";
import { PoliticaPlana } from "../src/dominio/politica-mora/politica-plana.js";
import { PoliticaRetroactiva } from "../src/dominio/politica-mora/politica-retroactiva.js";
import type { PoliticaMora } from "../src/dominio/politica-mora/politica-mora.js";

const politicas: readonly PoliticaMora[] = [new PoliticaPlana(), new PoliticaEscalonada(), new PoliticaRetroactiva()];
describe.each(politicas)("Contrato LSP: $id", (politica) => {
  it("acepta las mismas entradas, es determinista e inmutable y conserva moneda/tope", () => {
    const motor = new CalculadoraMora(politica);
    for (const moneda of ["GTQ", "USD"]) {
      for (const importe of ["0", "0.01", "725.76", "999999999999.99"]) {
        const capital = Dinero.desdeCadena(importe, moneda);
        const antes = capital.aJSON();
        for (const dia of [0, 1, 30, 31, 60, 61, 90, 91, 120, 121, 150, 100000]) {
          const dias = DiasAtraso.desdeNumero(dia);
          const resultado = motor.calcular(capital, dias);
          const repetido = motor.calcular(capital, dias);
          expect(resultado.interesMoratorio).toBeInstanceOf(Dinero);
          expect(resultado.interesMoratorio.esNegativo()).toBe(false);
          expect(resultado.interesMoratorio.esMenorOIgualQue(capital)).toBe(true);
          expect(resultado.interesMoratorio.moneda.codigo).toBe(moneda);
          expect(resultado).toEqual(repetido);
          expect(capital.aJSON()).toEqual(antes);
          expect(dias.valor).toBe(dia);
          expect(Object.isFrozen(resultado.detalle.tramos)).toBe(true);
          expect(resultado.detalle.tramos.every(Object.isFrozen)).toBe(true);
        }
      }
    }
  });
  it("rechaza capital negativo sin mutar la entrada", () => {
    const capital = Dinero.desdeCadena("-0.01", "GTQ");
    expect(() => politica.calcular(capital, DiasAtraso.desdeNumero(15))).toThrow();
    expect(() => new CalculadoraMora(politica).calcular(capital, DiasAtraso.desdeNumero(15))).toThrow();
    expect(capital.aCadena()).toBe("-0.01");
  });
});

it("el motor rechaza una estrategia que incumple moneda, finitud, signo o tope", () => {
  const capital = Dinero.desdeCadena("10", "GTQ");
  for (const totalSinRedondear of ["-1", "11", "NaN", "Infinity"]) {
    const incompatible: PoliticaMora = { id: "INVALIDA", calcular: () => ({ totalSinRedondear, moneda: capital.moneda, tramos: [] }) };
    expect(() => new CalculadoraMora(incompatible).calcular(capital, DiasAtraso.desdeNumero(1))).toThrow("incompatible");
  }
  const otraMoneda: PoliticaMora = { id: "INVALIDA", calcular: () => ({ totalSinRedondear: "1", moneda: Dinero.cero("USD").moneda, tramos: [] }) };
  expect(() => new CalculadoraMora(otraMoneda).calcular(capital, DiasAtraso.desdeNumero(1))).toThrow("incompatible");
});
