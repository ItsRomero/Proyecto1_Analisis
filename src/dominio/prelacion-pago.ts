import { Dinero, Moneda } from "./dinero.js";

export enum ConceptoPrelacion {
  GASTOS_COMISIONES = "GASTOS_COMISIONES",
  INTERES_MORATORIO = "INTERES_MORATORIO",
  INTERES_CORRIENTE = "INTERES_CORRIENTE",
  CAPITAL = "CAPITAL",
}

export class PagoInvalido extends Error {
  public constructor() {
    super("El pago debe ser mayor que cero.");
    this.name = "PagoInvalido";
  }
}

export class SaldoExigibleInvalido extends Error {
  public constructor(concepto: ConceptoPrelacion) {
    super(`El saldo exigible de ${concepto} no puede ser negativo.`);
    this.name = "SaldoExigibleInvalido";
  }
}

export class ContextoExcedenteInvalido extends Error {
  public constructor() {
    super("Los saldos disponibles para aplicar el excedente no pueden ser negativos.");
    this.name = "ContextoExcedenteInvalido";
  }
}

export interface SaldosExigibles {
  readonly gastosComisiones: Dinero;
  readonly interesMoratorio: Dinero;
  readonly interesCorriente: Dinero;
  readonly capital: Dinero;
}

export interface ContextoExcedente {
  readonly capitalNoExigible: Dinero;
  readonly cuotasFuturas: Dinero;
}

export class PasoPrelacion {
  public readonly concepto: ConceptoPrelacion;
  public readonly saldoExigible: Dinero;
  public readonly aplicado: Dinero;
  public readonly saldoPendiente: Dinero;
  public readonly remanente: Dinero;

  public constructor(datos: {
    readonly concepto: ConceptoPrelacion;
    readonly saldoExigible: Dinero;
    readonly aplicado: Dinero;
    readonly saldoPendiente: Dinero;
    readonly remanente: Dinero;
  }) {
    this.concepto = datos.concepto;
    this.saldoExigible = datos.saldoExigible;
    this.aplicado = datos.aplicado;
    this.saldoPendiente = datos.saldoPendiente;
    this.remanente = datos.remanente;
    Object.freeze(this);
  }
}

export class ResultadoExcedente {
  public readonly aplicadoCapital: Dinero;
  public readonly aplicadoCuotasFuturas: Dinero;
  public readonly remanente: Dinero;

  public constructor(datos: {
    readonly aplicadoCapital: Dinero;
    readonly aplicadoCuotasFuturas: Dinero;
    readonly remanente: Dinero;
  }) {
    this.aplicadoCapital = datos.aplicadoCapital;
    this.aplicadoCuotasFuturas = datos.aplicadoCuotasFuturas;
    this.remanente = datos.remanente;
    Object.freeze(this);
  }

  public total(): Dinero {
    return this.aplicadoCapital
      .sumar(this.aplicadoCuotasFuturas)
      .sumar(this.remanente);
  }
}

export interface PoliticaExcedente {
  readonly nombre: string;
  procesar(excedente: Dinero, contexto: ContextoExcedente): ResultadoExcedente;
}

function validarContextoExcedente(contexto: ContextoExcedente): void {
  if (contexto.capitalNoExigible.esNegativo() || contexto.cuotasFuturas.esNegativo()) {
    throw new ContextoExcedenteInvalido();
  }
  contexto.capitalNoExigible.sumar(contexto.cuotasFuturas);
}

export class AmortizacionDirectaCapital implements PoliticaExcedente {
  public readonly nombre = "AMORTIZACION_DIRECTA_CAPITAL";

  public procesar(excedente: Dinero, contexto: ContextoExcedente): ResultadoExcedente {
    validarContextoExcedente(contexto);
    const aplicadoCapital = excedente.minimo(contexto.capitalNoExigible);
    return new ResultadoExcedente({
      aplicadoCapital,
      aplicadoCuotasFuturas: Dinero.cero(excedente.moneda),
      remanente: excedente.restar(aplicadoCapital),
    });
  }
}

export class PagoAnticipadoCuotasFuturas implements PoliticaExcedente {
  public readonly nombre = "PAGO_ANTICIPADO_CUOTAS_FUTURAS";

  public procesar(excedente: Dinero, contexto: ContextoExcedente): ResultadoExcedente {
    validarContextoExcedente(contexto);
    const aplicadoCuotasFuturas = excedente.minimo(contexto.cuotasFuturas);
    return new ResultadoExcedente({
      aplicadoCapital: Dinero.cero(excedente.moneda),
      aplicadoCuotasFuturas,
      remanente: excedente.restar(aplicadoCuotasFuturas),
    });
  }
}

abstract class EslabonPrelacion {
  readonly #siguiente: EslabonPrelacion | undefined;

  public constructor(siguiente?: EslabonPrelacion) {
    this.#siguiente = siguiente;
  }

  public procesar(remanente: Dinero, saldos: SaldosExigibles): readonly PasoPrelacion[] {
    const saldoExigible = this.obtenerSaldo(saldos);
    if (saldoExigible.esNegativo()) {
      throw new SaldoExigibleInvalido(this.concepto);
    }

    const aplicado = remanente.minimo(saldoExigible);
    const nuevoRemanente = remanente.restar(aplicado);
    const paso = new PasoPrelacion({
      concepto: this.concepto,
      saldoExigible,
      aplicado,
      saldoPendiente: saldoExigible.restar(aplicado),
      remanente: nuevoRemanente,
    });
    const posteriores = this.#siguiente?.procesar(nuevoRemanente, saldos) ?? [];
    return Object.freeze([paso, ...posteriores]);
  }

  protected abstract readonly concepto: ConceptoPrelacion;
  protected abstract obtenerSaldo(saldos: SaldosExigibles): Dinero;
}

class EslabonGastos extends EslabonPrelacion {
  protected readonly concepto = ConceptoPrelacion.GASTOS_COMISIONES;
  protected obtenerSaldo(saldos: SaldosExigibles): Dinero { return saldos.gastosComisiones; }
}

class EslabonMoratorio extends EslabonPrelacion {
  protected readonly concepto = ConceptoPrelacion.INTERES_MORATORIO;
  protected obtenerSaldo(saldos: SaldosExigibles): Dinero { return saldos.interesMoratorio; }
}

class EslabonCorriente extends EslabonPrelacion {
  protected readonly concepto = ConceptoPrelacion.INTERES_CORRIENTE;
  protected obtenerSaldo(saldos: SaldosExigibles): Dinero { return saldos.interesCorriente; }
}

class EslabonCapital extends EslabonPrelacion {
  protected readonly concepto = ConceptoPrelacion.CAPITAL;
  protected obtenerSaldo(saldos: SaldosExigibles): Dinero { return saldos.capital; }
}

export class AplicacionPago {
  public readonly pago: Dinero;
  public readonly pasos: readonly PasoPrelacion[];
  public readonly excedente: Dinero;
  public readonly politicaExcedente: string;
  public readonly resultadoExcedente: ResultadoExcedente;

  public constructor(datos: {
    readonly pago: Dinero;
    readonly pasos: readonly PasoPrelacion[];
    readonly excedente: Dinero;
    readonly politicaExcedente: string;
    readonly resultadoExcedente: ResultadoExcedente;
  }) {
    this.pago = datos.pago;
    this.pasos = Object.freeze([...datos.pasos]);
    this.excedente = datos.excedente;
    this.politicaExcedente = datos.politicaExcedente;
    this.resultadoExcedente = datos.resultadoExcedente;
    this.validarConservacion();
    Object.freeze(this);
  }

  public aplicadoA(concepto: ConceptoPrelacion): Dinero {
    const paso = this.pasos.find((candidato) => candidato.concepto === concepto);
    return paso?.aplicado ?? Dinero.cero(this.pago.moneda);
  }

  public pendienteDe(concepto: ConceptoPrelacion): Dinero {
    const paso = this.pasos.find((candidato) => candidato.concepto === concepto);
    return paso?.saldoPendiente ?? Dinero.cero(this.pago.moneda);
  }

  private validarConservacion(): void {
    const totalConceptos = this.pasos.reduce(
      (total, paso) => total.sumar(paso.aplicado),
      Dinero.cero(this.pago.moneda),
    );
    if (!totalConceptos.sumar(this.excedente).esIgualA(this.pago)) {
      throw new Error("La aplicación no conserva el pago recibido.");
    }
    if (!this.resultadoExcedente.total().esIgualA(this.excedente)) {
      throw new Error("La política no conserva el excedente recibido.");
    }
  }
}

export class ProcesadorPrelacionPago {
  readonly #primerEslabon: EslabonPrelacion;
  readonly #politicaExcedente: PoliticaExcedente;

  public constructor(
    politicaExcedente: PoliticaExcedente = new AmortizacionDirectaCapital(),
  ) {
    this.#politicaExcedente = politicaExcedente;
    this.#primerEslabon = new EslabonGastos(
      new EslabonMoratorio(new EslabonCorriente(new EslabonCapital())),
    );
    Object.freeze(this);
  }

  public procesar(
    pago: Dinero,
    saldos: SaldosExigibles,
    contextoExcedente: ContextoExcedente = ProcesadorPrelacionPago.contextoVacio(pago.moneda),
  ): AplicacionPago {
    if (pago.esNegativo() || pago.esCero()) throw new PagoInvalido();

    const pasos = this.#primerEslabon.procesar(pago, saldos);
    const excedente = pasos.at(-1)?.remanente ?? pago;
    const resultadoExcedente = this.#politicaExcedente.procesar(excedente, contextoExcedente);
    return new AplicacionPago({
      pago,
      pasos,
      excedente,
      politicaExcedente: this.#politicaExcedente.nombre,
      resultadoExcedente,
    });
  }

  private static contextoVacio(moneda: Moneda): ContextoExcedente {
    return Object.freeze({
      capitalNoExigible: Dinero.cero(moneda),
      cuotasFuturas: Dinero.cero(moneda),
    });
  }
}
