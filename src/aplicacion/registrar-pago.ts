import { FechaCivil } from "../dominio/calculadora-mora.js";
import { Dinero } from "../dominio/dinero.js";
import {
  ClaveIdempotencia,
  HuellaSolicitudPago,
  PagoRegistrado,
} from "../dominio/pago-idempotente.js";
import {
  ProcesadorPrelacionPago,
  type ContextoExcedente,
  type SaldosExigibles,
} from "../dominio/prelacion-pago.js";

export interface ResultadoEjecucionIdempotente {
  readonly pago: PagoRegistrado;
  readonly repetido: boolean;
}

export interface RepositorioPagosIdempotentes {
  ejecutarUnaVez(
    creditoId: string,
    clave: ClaveIdempotencia,
    huella: HuellaSolicitudPago,
    crear: () => PagoRegistrado,
  ): ResultadoEjecucionIdempotente;
}

export interface GeneradorPagoId {
  siguiente(): string;
}

export interface ComandoRegistrarPago {
  readonly creditoId: string;
  readonly claveIdempotencia: string;
  readonly importe: Dinero;
  readonly fechaPago: FechaCivil;
  readonly usuarioProceso: string;
  readonly saldosExigibles: SaldosExigibles;
  readonly contextoExcedente: ContextoExcedente;
}

export class RegistrarPago {
  readonly #repositorio: RepositorioPagosIdempotentes;
  readonly #generadorIds: GeneradorPagoId;
  readonly #procesador: ProcesadorPrelacionPago;

  public constructor(
    repositorio: RepositorioPagosIdempotentes,
    generadorIds: GeneradorPagoId,
    procesador: ProcesadorPrelacionPago = new ProcesadorPrelacionPago(),
  ) {
    this.#repositorio = repositorio;
    this.#generadorIds = generadorIds;
    this.#procesador = procesador;
  }

  public ejecutar(comando: ComandoRegistrarPago): ResultadoEjecucionIdempotente {
    const clave = ClaveIdempotencia.desdeCadena(comando.claveIdempotencia);
    const huella = HuellaSolicitudPago.crear({
      creditoId: comando.creditoId,
      importe: comando.importe.aCadena(),
      moneda: comando.importe.moneda.codigo,
      fechaPago: comando.fechaPago.valor,
      usuarioProceso: comando.usuarioProceso,
    });

    return this.#repositorio.ejecutarUnaVez(
      comando.creditoId,
      clave,
      huella,
      () => new PagoRegistrado({
        pagoId: this.#generadorIds.siguiente(),
        creditoId: comando.creditoId,
        claveIdempotencia: clave,
        huella,
        aplicacion: this.#procesador.procesar(
          comando.importe,
          comando.saldosExigibles,
          comando.contextoExcedente,
        ),
      }),
    );
  }
}
