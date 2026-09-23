import { Decimal } from "decimal.js";

import { Dinero } from "./dinero.js";
import { TramoMora, clasificarTramoMora } from "./clasificacion-tramo.js";
import { REGLAS_COBRO } from "./politica-mora/configuracion-politica.js";
import type { PoliticaMora, CalculoPolitica } from "./politica-mora/politica-mora.js";
export { TramoMora, clasificarTramoMora } from "./clasificacion-tramo.js";

const FORMATO_FECHA_CIVIL = /^(\d{4})-(\d{2})-(\d{2})$/;
const FORMATO_TASA = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const MILISEGUNDOS_POR_DIA = 86_400_000;
const DIAS_BASE_ACTUAL_360 = new Decimal("360");
const DecimalMora = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
});

export class FechaCivilInvalida extends Error {
  public constructor(valor: string) {
    super(`La fecha civil no es válida: "${valor}".`);
    this.name = "FechaCivilInvalida";
  }
}

export class DiasAtrasoInvalidos extends Error {
  public constructor(valor: number) {
    super(`Los días de atraso deben ser un entero no negativo; se recibió ${valor}.`);
    this.name = "DiasAtrasoInvalidos";
  }
}

export class TasaMoratoriaInvalida extends Error {
  public constructor(valor: string) {
    super(`La tasa nominal anual moratoria no es válida: "${valor}".`);
    this.name = "TasaMoratoriaInvalida";
  }
}

export class CapitalVencidoInvalido extends Error {
  public constructor() {
    super("El capital vencido no puede ser negativo.");
    this.name = "CapitalVencidoInvalido";
  }
}

export class FechaCivil {
  public readonly valor: string;
  readonly #diaEpoch: number;

  private constructor(valor: string, diaEpoch: number) {
    this.valor = valor;
    this.#diaEpoch = diaEpoch;
    Object.freeze(this);
  }

  public static desdeCadena(valor: string): FechaCivil {
    const partes = FORMATO_FECHA_CIVIL.exec(valor);
    if (partes === null) {
      throw new FechaCivilInvalida(valor);
    }

    const anio = Number(partes[1]);
    const mes = Number(partes[2]);
    const dia = Number(partes[3]);
    const fecha = new Date(0);
    fecha.setUTCFullYear(anio, mes - 1, dia);
    fecha.setUTCHours(0, 0, 0, 0);

    if (
      fecha.getUTCFullYear() !== anio ||
      fecha.getUTCMonth() !== mes - 1 ||
      fecha.getUTCDate() !== dia
    ) {
      throw new FechaCivilInvalida(valor);
    }

    return new FechaCivil(valor, fecha.getTime() / MILISEGUNDOS_POR_DIA);
  }

  public diasDesde(anterior: FechaCivil): number {
    return this.#diaEpoch - anterior.#diaEpoch;
  }

  public toString(): string {
    return this.valor;
  }
}

export class DiasAtraso {
  public readonly valor: number;

  private constructor(valor: number) {
    this.valor = valor;
    Object.freeze(this);
  }

  public static desdeNumero(valor: number): DiasAtraso {
    if (!Number.isSafeInteger(valor) || valor < 0) {
      throw new DiasAtrasoInvalidos(valor);
    }
    return new DiasAtraso(valor);
  }

  public static entre(
    fechaVencimiento: FechaCivil,
    fechaCorte: FechaCivil,
  ): DiasAtraso {
    return new DiasAtraso(
      Math.max(0, fechaCorte.diasDesde(fechaVencimiento)),
    );
  }
}

export function debeDevengarInteresCorriente(dias: DiasAtraso): boolean {
  return dias.valor <= REGLAS_COBRO.diasHastaReconocimientoCorriente;
}

export class TasaNominalAnualMoratoria {
  readonly #valor: Decimal;

  private constructor(valor: Decimal) {
    this.#valor = new DecimalMora(valor);
    Object.freeze(this);
  }

  public static desdeCadena(valor: string): TasaNominalAnualMoratoria {
    if (typeof valor !== "string" || !FORMATO_TASA.test(valor)) {
      throw new TasaMoratoriaInvalida(valor);
    }
    const decimal = new DecimalMora(valor);
    if (!decimal.isFinite() || decimal.isNegative()) {
      throw new TasaMoratoriaInvalida(valor);
    }
    return new TasaNominalAnualMoratoria(decimal);
  }

  public aCadena(): string {
    return this.#valor.toFixed();
  }

  public aTasaDiariaActual360(): string {
    return this.#valor.div(DIAS_BASE_ACTUAL_360).toFixed();
  }
}

export interface ObligacionVencida {
  readonly referencia: string;
  readonly capitalVencido: Dinero;
  readonly fechaVencimiento: FechaCivil;
}

export class ResultadoMoraCuota {
  public readonly referencia: string;
  public readonly fechaVencimiento: FechaCivil;
  public readonly diasAtraso: DiasAtraso;
  public readonly tramo: TramoMora;
  public readonly capitalVencido: Dinero;
  public readonly interesMoratorio: Dinero;

  public constructor(datos: {
    readonly referencia: string;
    readonly fechaVencimiento: FechaCivil;
    readonly diasAtraso: DiasAtraso;
    readonly capitalVencido: Dinero;
    readonly interesMoratorio: Dinero;
  }) {
    this.referencia = datos.referencia;
    this.fechaVencimiento = datos.fechaVencimiento;
    this.diasAtraso = datos.diasAtraso;
    this.tramo = clasificarTramoMora(datos.diasAtraso);
    this.capitalVencido = datos.capitalVencido;
    this.interesMoratorio = datos.interesMoratorio;
    Object.freeze(this);
  }
}

export class CalculadoraMora {
  public constructor(private readonly politica: PoliticaMora) { Object.freeze(this); }

  public calcular(capital: Dinero, dias: DiasAtraso): Readonly<{
    politicaId: string; interesMoratorio: Dinero; detalle: CalculoPolitica;
  }> {
    if (capital.esNegativo()) throw new CapitalVencidoInvalido();
    const detalle = this.politica.calcular(capital, dias);
    const total = new DecimalMora(detalle.totalSinRedondear);
    if (!total.isFinite() || total.isNegative() || total.greaterThan(capital.aCadena()) ||
        !detalle.moneda.esIgualA(capital.moneda)) throw new Error("Política incompatible con el contrato.");
    return Object.freeze({ politicaId: this.politica.id, detalle,
      interesMoratorio: Dinero.desdeCadena(total.toFixed(), capital.moneda) });
  }

  public calcularPorCuota(obligacion: ObligacionVencida, fechaCorte: FechaCivil) {
    const diasAtraso = DiasAtraso.entre(obligacion.fechaVencimiento, fechaCorte);
    const calculo = this.calcular(obligacion.capitalVencido, diasAtraso);
    return Object.freeze({ ...calculo, referencia: obligacion.referencia,
      fechaVencimiento: obligacion.fechaVencimiento, diasAtraso,
      tramo: clasificarTramoMora(diasAtraso), capitalVencido: obligacion.capitalVencido });
  }

  public calcularVariasCuotas(obligaciones: readonly ObligacionVencida[], fechaCorte: FechaCivil) {
    return Object.freeze(obligaciones.map((cuota) => this.calcularPorCuota(cuota, fechaCorte)));
  }

  // Fachada P1: conserva la fórmula y la API estática de tasa directa.
  public static calcularInteresMoratorio(
    capitalVencido: Dinero,
    tasa: TasaNominalAnualMoratoria,
    dias: DiasAtraso,
  ): Dinero {
    if (capitalVencido.esNegativo()) {
      throw new CapitalVencidoInvalido();
    }

    const resultado = new DecimalMora(capitalVencido.aCadena())
      .times(tasa.aTasaDiariaActual360())
      .times(dias.valor.toString());

    return Dinero.desdeCadena(resultado.toFixed(), capitalVencido.moneda);
  }

  public static calcularPorCuota(
    obligacion: ObligacionVencida,
    tasa: TasaNominalAnualMoratoria,
    fechaCorte: FechaCivil,
  ): ResultadoMoraCuota {
    const diasAtraso = DiasAtraso.entre(
      obligacion.fechaVencimiento,
      fechaCorte,
    );
    const interesMoratorio = this.calcularInteresMoratorio(
      obligacion.capitalVencido,
      tasa,
      diasAtraso,
    );

    return new ResultadoMoraCuota({
      referencia: obligacion.referencia,
      fechaVencimiento: obligacion.fechaVencimiento,
      diasAtraso,
      capitalVencido: obligacion.capitalVencido,
      interesMoratorio,
    });
  }

  public static calcularVariasCuotas(
    obligaciones: readonly ObligacionVencida[],
    tasa: TasaNominalAnualMoratoria,
    fechaCorte: FechaCivil,
  ): readonly ResultadoMoraCuota[] {
    return Object.freeze(
      obligaciones.map((obligacion) =>
        this.calcularPorCuota(obligacion, tasa, fechaCorte),
      ),
    );
  }
}
