import { Decimal } from "decimal.js";

import { EstadoCredito } from "./credito-estado.js";
import { Dinero, Moneda } from "./dinero.js";

const DecimalCartera = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
});

const ESTADOS_CARTERA_ACTIVA = new Set<EstadoCredito>([
  EstadoCredito.DESEMBOLSADO,
  EstadoCredito.VIGENTE,
  EstadoCredito.EN_MORA,
  EstadoCredito.REESTRUCTURADO,
]);

export interface CreditoParaCartera {
  readonly id: string;
  readonly estado: EstadoCredito;
  readonly saldoCapital: Dinero;
  readonly diasAtraso: number;
}

export class CreditoCarteraInvalido extends Error {
  public constructor(id: string, motivo: string) {
    super(`El crédito ${id} no es válido para calcular cartera: ${motivo}.`);
    this.name = "CreditoCarteraInvalido";
  }
}

export class CreditoCarteraDuplicado extends Error {
  public constructor(id: string) {
    super(`El crédito ${id} aparece más de una vez en la fotografía de cartera.`);
    this.name = "CreditoCarteraDuplicado";
  }
}

export class Porcentaje {
  readonly #razon: Decimal;

  private constructor(razon: Decimal) {
    if (razon.isNegative() || razon.greaterThan(1)) {
      throw new Error("El porcentaje debe pertenecer al intervalo [0,1].");
    }
    this.#razon = new DecimalCartera(razon);
    Object.freeze(this);
  }

  public static desdeCociente(numerador: Dinero, denominador: Dinero): Porcentaje {
    numerador.sumar(Dinero.cero(denominador.moneda));
    if (denominador.esCero() || denominador.esNegativo() || numerador.esNegativo()) {
      throw new Error("El cociente de cartera requiere importes válidos y denominador positivo.");
    }
    return new Porcentaje(
      new DecimalCartera(numerador.aCadena()).div(denominador.aCadena()),
    );
  }

  public aRazonCadena(): string {
    return this.#razon.toFixed();
  }

  public aPorcentajeCadena(): string {
    return this.#razon.times("100").toFixed(2);
  }
}

export class ResultadoCarteraConRazon {
  public readonly tipo = "CON_RAZON" as const;
  public readonly carteraActiva: Dinero;
  public readonly capitalEnRiesgo: Dinero;
  public readonly razon: Porcentaje;

  public constructor(carteraActiva: Dinero, capitalEnRiesgo: Dinero) {
    this.carteraActiva = carteraActiva;
    this.capitalEnRiesgo = capitalEnRiesgo;
    this.razon = Porcentaje.desdeCociente(capitalEnRiesgo, carteraActiva);
    Object.freeze(this);
  }
}

export class ResultadoSinCarteraActiva {
  public readonly tipo = "SIN_CARTERA_ACTIVA" as const;
  public readonly carteraActiva: Dinero;
  public readonly capitalEnRiesgo: Dinero;

  public constructor(moneda: Moneda) {
    this.carteraActiva = Dinero.cero(moneda);
    this.capitalEnRiesgo = Dinero.cero(moneda);
    Object.freeze(this);
  }
}

export type ResultadoCarteraRiesgo =
  | ResultadoCarteraConRazon
  | ResultadoSinCarteraActiva;

export class CalculadoraCarteraRiesgo {
  public static calcular(
    creditos: readonly CreditoParaCartera[],
    moneda: Moneda | string,
  ): ResultadoCarteraRiesgo {
    const monedaCartera = typeof moneda === "string" ? Moneda.desdeCodigo(moneda) : moneda;
    const identificadores = new Set<string>();
    let carteraActiva = Dinero.cero(monedaCartera);
    let capitalEnRiesgo = Dinero.cero(monedaCartera);

    for (const credito of creditos) {
      this.validarCredito(credito, identificadores, monedaCartera);
      if (!ESTADOS_CARTERA_ACTIVA.has(credito.estado)) continue;

      carteraActiva = carteraActiva.sumar(credito.saldoCapital);
      const estaEnRiesgo =
        credito.diasAtraso > 30 || credito.estado === EstadoCredito.REESTRUCTURADO;
      if (estaEnRiesgo) {
        capitalEnRiesgo = capitalEnRiesgo.sumar(credito.saldoCapital);
      }
    }

    if (carteraActiva.esCero()) {
      return new ResultadoSinCarteraActiva(monedaCartera);
    }
    return new ResultadoCarteraConRazon(carteraActiva, capitalEnRiesgo);
  }

  private static validarCredito(
    credito: CreditoParaCartera,
    identificadores: Set<string>,
    moneda: Moneda,
  ): void {
    if (typeof credito.id !== "string" || credito.id.trim().length === 0) {
      throw new CreditoCarteraInvalido(credito.id, "el identificador es obligatorio");
    }
    if (identificadores.has(credito.id)) throw new CreditoCarteraDuplicado(credito.id);
    identificadores.add(credito.id);
    if (credito.saldoCapital.esNegativo()) {
      throw new CreditoCarteraInvalido(credito.id, "el saldo de capital no puede ser negativo");
    }
    if (!Number.isSafeInteger(credito.diasAtraso) || credito.diasAtraso < 0) {
      throw new CreditoCarteraInvalido(credito.id, "los días de atraso deben ser un entero no negativo");
    }
    credito.saldoCapital.sumar(Dinero.cero(moneda));
  }
}
