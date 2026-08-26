import { Decimal } from "decimal.js";

import { Dinero } from "./dinero.js";

const FORMATO_TASA = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const MINIMO_CUOTAS = 3;
const MAXIMO_CUOTAS = 24;
const MESES_POR_ANIO = new Decimal("12");
const DecimalFinanciero = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
});

export class TasaInvalida extends Error {
  public constructor(valor: string) {
    super(`La tasa nominal anual no es válida: "${valor}".`);
    this.name = "TasaInvalida";
  }
}

export class PlazoInvalido extends Error {
  public constructor(meses: number) {
    super(
      `El plazo debe ser un entero entre ${MINIMO_CUOTAS} y ${MAXIMO_CUOTAS} meses; se recibió ${meses}.`,
    );
    this.name = "PlazoInvalido";
  }
}

export class CapitalInvalido extends Error {
  public constructor() {
    super("El capital del plan debe ser mayor que cero.");
    this.name = "CapitalInvalido";
  }
}

export class PlanAmortizacionInvalido extends Error {
  public constructor(motivo: string) {
    super(`El plan de amortización no cumple sus invariantes: ${motivo}.`);
    this.name = "PlanAmortizacionInvalido";
  }
}

export class PlazoMeses {
  public readonly valor: number;

  private constructor(valor: number) {
    this.valor = valor;
    Object.freeze(this);
  }

  public static desdeNumero(valor: number): PlazoMeses {
    if (
      !Number.isSafeInteger(valor) ||
      valor < MINIMO_CUOTAS ||
      valor > MAXIMO_CUOTAS
    ) {
      throw new PlazoInvalido(valor);
    }

    return new PlazoMeses(valor);
  }
}

export class TasaMensual {
  readonly #valor: Decimal;

  private constructor(valor: Decimal) {
    this.#valor = new DecimalFinanciero(valor);
    Object.freeze(this);
  }

  public static desdeCadena(valor: string): TasaMensual {
    if (!FORMATO_TASA.test(valor)) {
      throw new TasaInvalida(valor);
    }

    const decimal = new DecimalFinanciero(valor);
    if (!decimal.isFinite() || decimal.isNegative()) {
      throw new TasaInvalida(valor);
    }

    return new TasaMensual(decimal);
  }

  public esCero(): boolean {
    return this.#valor.isZero();
  }

  public aCadena(): string {
    return this.#valor.toFixed();
  }
}

export class TasaNominalAnual {
  readonly #valor: Decimal;

  private constructor(valor: Decimal) {
    this.#valor = new DecimalFinanciero(valor);
    Object.freeze(this);
  }

  public static desdeCadena(valor: string): TasaNominalAnual {
    if (!FORMATO_TASA.test(valor)) {
      throw new TasaInvalida(valor);
    }

    const decimal = new DecimalFinanciero(valor);
    if (!decimal.isFinite() || decimal.isNegative()) {
      throw new TasaInvalida(valor);
    }

    return new TasaNominalAnual(decimal);
  }

  public aMensual(): TasaMensual {
    return TasaMensual.desdeCadena(
      this.#valor.div(MESES_POR_ANIO).toFixed(),
    );
  }

  public aCadena(): string {
    return this.#valor.toFixed();
  }
}

export interface DatosCuota {
  readonly numero: number;
  readonly saldoAnterior: Dinero;
  readonly interes: Dinero;
  readonly amortizacion: Dinero;
  readonly importe: Dinero;
  readonly saldoPosterior: Dinero;
}

export class Cuota implements DatosCuota {
  public readonly numero: number;
  public readonly saldoAnterior: Dinero;
  public readonly interes: Dinero;
  public readonly amortizacion: Dinero;
  public readonly importe: Dinero;
  public readonly saldoPosterior: Dinero;

  public constructor(datos: DatosCuota) {
    this.numero = datos.numero;
    this.saldoAnterior = datos.saldoAnterior;
    this.interes = datos.interes;
    this.amortizacion = datos.amortizacion;
    this.importe = datos.importe;
    this.saldoPosterior = datos.saldoPosterior;
    Object.freeze(this);
  }
}

export class PlanAmortizacion {
  public readonly capital: Dinero;
  public readonly tasaNominalAnual: TasaNominalAnual;
  public readonly tasaMensual: TasaMensual;
  public readonly plazo: PlazoMeses;
  public readonly cuotas: readonly Cuota[];
  public readonly totalIntereses: Dinero;
  public readonly totalAmortizacion: Dinero;
  public readonly totalPagos: Dinero;

  public constructor(datos: {
    readonly capital: Dinero;
    readonly tasaNominalAnual: TasaNominalAnual;
    readonly tasaMensual: TasaMensual;
    readonly plazo: PlazoMeses;
    readonly cuotas: readonly Cuota[];
  }) {
    this.capital = datos.capital;
    this.tasaNominalAnual = datos.tasaNominalAnual;
    this.tasaMensual = datos.tasaMensual;
    this.plazo = datos.plazo;
    this.cuotas = Object.freeze([...datos.cuotas]);

    const cero = Dinero.cero(datos.capital.moneda);
    this.totalIntereses = this.cuotas.reduce(
      (total, cuota) => total.sumar(cuota.interes),
      cero,
    );
    this.totalAmortizacion = this.cuotas.reduce(
      (total, cuota) => total.sumar(cuota.amortizacion),
      cero,
    );
    this.totalPagos = this.cuotas.reduce(
      (total, cuota) => total.sumar(cuota.importe),
      cero,
    );

    this.validarInvariantes();
    Object.freeze(this);
  }

  public saldoFinal(): Dinero {
    const ultimaCuota = this.cuotas.at(-1);
    if (ultimaCuota === undefined) {
      throw new PlanAmortizacionInvalido("no contiene cuotas");
    }

    return ultimaCuota.saldoPosterior;
  }

  private validarInvariantes(): void {
    if (this.cuotas.length !== this.plazo.valor) {
      throw new PlanAmortizacionInvalido(
        "la cantidad de cuotas no coincide con el plazo",
      );
    }

    for (const [indice, cuota] of this.cuotas.entries()) {
      if (cuota.numero !== indice + 1) {
        throw new PlanAmortizacionInvalido(
          "la numeración de cuotas no es consecutiva",
        );
      }

      if (
        cuota.saldoAnterior.esNegativo() ||
        cuota.interes.esNegativo() ||
        cuota.amortizacion.esNegativo() ||
        cuota.importe.esNegativo() ||
        cuota.saldoPosterior.esNegativo()
      ) {
        throw new PlanAmortizacionInvalido(
          "una cuota contiene un importe que debe ser no negativo",
        );
      }

      if (!cuota.interes.sumar(cuota.amortizacion).esIgualA(cuota.importe)) {
        throw new PlanAmortizacionInvalido(
          `la cuota ${cuota.numero} no conserva interés + amortización = importe`,
        );
      }

      if (
        !cuota.saldoAnterior
          .restar(cuota.amortizacion)
          .esIgualA(cuota.saldoPosterior)
      ) {
        throw new PlanAmortizacionInvalido(
          `la cuota ${cuota.numero} no conserva el saldo`,
        );
      }

      const anterior = this.cuotas[indice - 1];
      if (
        anterior !== undefined &&
        !anterior.saldoPosterior.esIgualA(cuota.saldoAnterior)
      ) {
        throw new PlanAmortizacionInvalido(
          `la cuota ${cuota.numero} no continúa el saldo anterior`,
        );
      }
    }

    if (!this.totalAmortizacion.esIgualA(this.capital)) {
      throw new PlanAmortizacionInvalido(
        "la suma de amortizaciones no coincide con el capital",
      );
    }

    if (!this.saldoFinal().esCero()) {
      throw new PlanAmortizacionInvalido("el saldo final no es cero");
    }

    if (!this.totalIntereses.sumar(this.capital).esIgualA(this.totalPagos)) {
      throw new PlanAmortizacionInvalido(
        "los pagos totales no coinciden con capital más intereses",
      );
    }
  }
}

export class FabricaPlanAmortizacion {
  public crearFrances(datos: {
    readonly capital: Dinero;
    readonly tasaNominalAnual: TasaNominalAnual;
    readonly plazo: PlazoMeses;
  }): PlanAmortizacion {
    if (datos.capital.esCero() || datos.capital.esNegativo()) {
      throw new CapitalInvalido();
    }

    const tasaMensual = datos.tasaNominalAnual.aMensual();
    const cuotaNormal = this.calcularCuotaNormal(
      datos.capital,
      tasaMensual,
      datos.plazo,
    );
    const cuotas: Cuota[] = [];
    let saldoAnterior = datos.capital;

    for (let numero = 1; numero <= datos.plazo.valor; numero += 1) {
      const interes = saldoAnterior.multiplicar(tasaMensual.aCadena());
      const esUltima = numero === datos.plazo.valor;
      const amortizacion = esUltima
        ? saldoAnterior
        : cuotaNormal.restar(interes);
      const importe = amortizacion.sumar(interes);
      const saldoPosterior = saldoAnterior.restar(amortizacion);

      cuotas.push(
        new Cuota({
          numero,
          saldoAnterior,
          interes,
          amortizacion,
          importe,
          saldoPosterior,
        }),
      );
      saldoAnterior = saldoPosterior;
    }

    return new PlanAmortizacion({
      capital: datos.capital,
      tasaNominalAnual: datos.tasaNominalAnual,
      tasaMensual,
      plazo: datos.plazo,
      cuotas,
    });
  }

  private calcularCuotaNormal(
    capital: Dinero,
    tasaMensual: TasaMensual,
    plazo: PlazoMeses,
  ): Dinero {
    const principal = new DecimalFinanciero(capital.aCadena());
    const periodos = new DecimalFinanciero(plazo.valor);
    const tasa = new DecimalFinanciero(tasaMensual.aCadena());

    if (tasa.isZero()) {
      return Dinero.desdeCadena(
        principal.div(periodos).toFixed(),
        capital.moneda,
      );
    }

    const factor = tasa.plus(1).pow(plazo.valor);
    const cuota = principal.times(tasa.times(factor).div(factor.minus(1)));

    return Dinero.desdeCadena(cuota.toFixed(), capital.moneda);
  }
}
