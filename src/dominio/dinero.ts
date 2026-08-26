import { Decimal } from "decimal.js";

const FORMATO_DECIMAL = /^[+-]?(?:0|[1-9]\d*)(?:\.\d+)?$/;
const FORMATO_MONEDA = /^[A-Z]{3}$/;
const ESCALA_MONETARIA = 2;
const DecimalDominio = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
});
const FACTOR_UNIDADES_MENORES = new DecimalDominio("100");

export class ImporteMonetarioInvalido extends Error {
  public constructor(valor: string) {
    super(`El importe monetario no es válido: "${valor}".`);
    this.name = "ImporteMonetarioInvalido";
  }
}

export class MonedaInvalida extends Error {
  public constructor(codigo: string) {
    super(`El código de moneda no es válido: "${codigo}".`);
    this.name = "MonedaInvalida";
  }
}

export class MonedasIncompatibles extends Error {
  public readonly monedaIzquierda: string;
  public readonly monedaDerecha: string;

  public constructor(monedaIzquierda: string, monedaDerecha: string) {
    super(
      `No se pueden operar importes en monedas distintas: ${monedaIzquierda} y ${monedaDerecha}.`,
    );
    this.name = "MonedasIncompatibles";
    this.monedaIzquierda = monedaIzquierda;
    this.monedaDerecha = monedaDerecha;
  }
}

export class EscalarMonetarioInvalido extends Error {
  public constructor(valor: string) {
    super(`El escalar monetario no es válido: "${valor}".`);
    this.name = "EscalarMonetarioInvalido";
  }
}

export class DivisionMonetariaPorCero extends Error {
  public constructor() {
    super("No se puede dividir un importe monetario entre cero.");
    this.name = "DivisionMonetariaPorCero";
  }
}

export class Moneda {
  public readonly codigo: string;

  private constructor(codigo: string) {
    this.codigo = codigo;
    Object.freeze(this);
  }

  public static desdeCodigo(codigo: string): Moneda {
    if (!FORMATO_MONEDA.test(codigo)) {
      throw new MonedaInvalida(codigo);
    }

    return new Moneda(codigo);
  }

  public esIgualA(otra: Moneda): boolean {
    return this.codigo === otra.codigo;
  }

  public toString(): string {
    return this.codigo;
  }
}

export interface DineroSerializado {
  readonly importe: string;
  readonly moneda: string;
}

export class Dinero {
  public readonly moneda: Moneda;
  readonly #importe: Decimal;

  private constructor(importe: Decimal, moneda: Moneda) {
    this.#importe = Dinero.redondear(importe);
    this.moneda = moneda;
    Object.freeze(this);
  }

  public static desdeCadena(valor: string, moneda: Moneda | string): Dinero {
    const importe = Dinero.decimalDesdeCadena(valor, "importe");
    return new Dinero(importe, Dinero.normalizarMoneda(moneda));
  }

  public static desdeUnidadesMenores(
    unidadesMenores: bigint,
    moneda: Moneda | string,
  ): Dinero {
    const importe = new DecimalDominio(unidadesMenores.toString()).div(
      FACTOR_UNIDADES_MENORES,
    );
    return new Dinero(importe, Dinero.normalizarMoneda(moneda));
  }

  public static cero(moneda: Moneda | string): Dinero {
    return new Dinero(
      new DecimalDominio("0"),
      Dinero.normalizarMoneda(moneda),
    );
  }

  public sumar(otro: Dinero): Dinero {
    this.validarMoneda(otro);
    return new Dinero(this.#importe.plus(otro.#importe), this.moneda);
  }

  public restar(otro: Dinero): Dinero {
    this.validarMoneda(otro);
    return new Dinero(this.#importe.minus(otro.#importe), this.moneda);
  }

  public multiplicar(factor: string): Dinero {
    const escalar = Dinero.decimalDesdeCadena(factor, "escalar");
    return new Dinero(this.#importe.times(escalar), this.moneda);
  }

  public dividir(divisor: string): Dinero {
    const escalar = Dinero.decimalDesdeCadena(divisor, "escalar");

    if (escalar.isZero()) {
      throw new DivisionMonetariaPorCero();
    }

    return new Dinero(this.#importe.div(escalar), this.moneda);
  }

  public negar(): Dinero {
    return new Dinero(this.#importe.negated(), this.moneda);
  }

  public absoluto(): Dinero {
    return new Dinero(this.#importe.abs(), this.moneda);
  }

  public minimo(otro: Dinero): Dinero {
    this.validarMoneda(otro);
    return this.#importe.lessThanOrEqualTo(otro.#importe)
      ? new Dinero(this.#importe, this.moneda)
      : new Dinero(otro.#importe, this.moneda);
  }

  public maximo(otro: Dinero): Dinero {
    this.validarMoneda(otro);
    return this.#importe.greaterThanOrEqualTo(otro.#importe)
      ? new Dinero(this.#importe, this.moneda)
      : new Dinero(otro.#importe, this.moneda);
  }

  public esIgualA(otro: Dinero): boolean {
    return (
      this.moneda.esIgualA(otro.moneda) && this.#importe.equals(otro.#importe)
    );
  }

  public esMayorQue(otro: Dinero): boolean {
    this.validarMoneda(otro);
    return this.#importe.greaterThan(otro.#importe);
  }

  public esMayorOIgualQue(otro: Dinero): boolean {
    this.validarMoneda(otro);
    return this.#importe.greaterThanOrEqualTo(otro.#importe);
  }

  public esMenorQue(otro: Dinero): boolean {
    this.validarMoneda(otro);
    return this.#importe.lessThan(otro.#importe);
  }

  public esMenorOIgualQue(otro: Dinero): boolean {
    this.validarMoneda(otro);
    return this.#importe.lessThanOrEqualTo(otro.#importe);
  }

  public esCero(): boolean {
    return this.#importe.isZero();
  }

  public esNegativo(): boolean {
    return this.#importe.isNegative() && !this.#importe.isZero();
  }

  public aCadena(): string {
    return this.#importe.toFixed(ESCALA_MONETARIA);
  }

  public aUnidadesMenores(): bigint {
    return BigInt(
      this.#importe.times(FACTOR_UNIDADES_MENORES).toFixed(0),
    );
  }

  public aJSON(): DineroSerializado {
    return Object.freeze({
      importe: this.aCadena(),
      moneda: this.moneda.codigo,
    });
  }

  public toJSON(): DineroSerializado {
    return this.aJSON();
  }

  private static normalizarMoneda(moneda: Moneda | string): Moneda {
    return typeof moneda === "string" ? Moneda.desdeCodigo(moneda) : moneda;
  }

  private static decimalDesdeCadena(
    valor: string,
    tipo: "importe" | "escalar",
  ): Decimal {
    if (!FORMATO_DECIMAL.test(valor)) {
      if (tipo === "importe") {
        throw new ImporteMonetarioInvalido(valor);
      }

      throw new EscalarMonetarioInvalido(valor);
    }

    const decimal = new DecimalDominio(valor);
    if (!decimal.isFinite()) {
      if (tipo === "importe") {
        throw new ImporteMonetarioInvalido(valor);
      }

      throw new EscalarMonetarioInvalido(valor);
    }

    return decimal;
  }

  private static redondear(importe: Decimal): Decimal {
    return importe.toDecimalPlaces(ESCALA_MONETARIA, Decimal.ROUND_HALF_UP);
  }

  private validarMoneda(otro: Dinero): void {
    if (!this.moneda.esIgualA(otro.moneda)) {
      throw new MonedasIncompatibles(
        this.moneda.codigo,
        otro.moneda.codigo,
      );
    }
  }
}
