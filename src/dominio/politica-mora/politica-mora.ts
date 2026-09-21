import { Decimal } from "decimal.js";
import type { DiasAtraso } from "../calculadora-mora.js";
import type { Dinero, Moneda } from "../dinero.js";

export const DecimalPolitica = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export interface DetalleTramo {
  readonly nombre: string;
  readonly dias: number;
  readonly tasa: string;
  readonly importeSinRedondear: string;
}

export interface CalculoPolitica {
  readonly totalSinRedondear: string;
  readonly moneda: Moneda;
  readonly tramos: readonly DetalleTramo[];
}

/** Contrato común: puro, determinista, no negativo, misma moneda y tope de capital. */
export interface PoliticaMora {
  readonly id: string;
  calcular(capital: Dinero, dias: DiasAtraso): CalculoPolitica;
}

export function resultadoPolitica(capital: Dinero, tramos: readonly DetalleTramo[]): CalculoPolitica {
  if (capital.esNegativo()) throw new Error("El capital vencido no puede ser negativo.");
  const total = tramos.reduce((suma, tramo) => suma.plus(tramo.importeSinRedondear), new DecimalPolitica("0"));
  return Object.freeze({
    totalSinRedondear: DecimalPolitica.min(total, capital.aCadena()).toFixed(),
    moneda: capital.moneda,
    tramos: Object.freeze(tramos.map((t) => Object.freeze({ ...t }))),
  });
}

export function importeTramo(capital: Dinero, tasa: string, dias: number, base: string): string {
  return new DecimalPolitica(capital.aCadena()).times(tasa).times(dias.toString()).div(base).toFixed();
}
