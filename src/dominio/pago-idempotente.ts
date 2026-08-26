import type { AplicacionPago } from "./prelacion-pago.js";

const FORMATO_CLAVE = /^[\x21-\x7E]{1,255}$/;

export class ClaveIdempotenciaInvalida extends Error {
  public constructor() {
    super("Idempotency-Key debe contener entre 1 y 255 caracteres ASCII visibles.");
    this.name = "ClaveIdempotenciaInvalida";
  }
}

export class ConflictoIdempotencia extends Error {
  public constructor() {
    super("Idempotency-Key ya fue utilizada con un contenido diferente.");
    this.name = "ConflictoIdempotencia";
  }
}

export class ClaveIdempotencia {
  public readonly valor: string;

  private constructor(valor: string) {
    this.valor = valor;
    Object.freeze(this);
  }

  public static desdeCadena(valor: string): ClaveIdempotencia {
    if (typeof valor !== "string" || !FORMATO_CLAVE.test(valor)) {
      throw new ClaveIdempotenciaInvalida();
    }
    return new ClaveIdempotencia(valor);
  }
}

export class HuellaSolicitudPago {
  public readonly valor: string;

  private constructor(valor: string) {
    this.valor = valor;
    Object.freeze(this);
  }

  public static crear(datos: {
    readonly creditoId: string;
    readonly importe: string;
    readonly moneda: string;
    readonly fechaPago: string;
    readonly usuarioProceso: string;
  }): HuellaSolicitudPago {
    return new HuellaSolicitudPago(JSON.stringify([
      datos.creditoId,
      datos.importe,
      datos.moneda,
      datos.fechaPago,
      datos.usuarioProceso,
    ]));
  }

  public esIgualA(otra: HuellaSolicitudPago): boolean {
    return this.valor === otra.valor;
  }
}

export class PagoRegistrado {
  public readonly pagoId: string;
  public readonly creditoId: string;
  public readonly claveIdempotencia: ClaveIdempotencia;
  public readonly huella: HuellaSolicitudPago;
  public readonly aplicacion: AplicacionPago;

  public constructor(datos: {
    readonly pagoId: string;
    readonly creditoId: string;
    readonly claveIdempotencia: ClaveIdempotencia;
    readonly huella: HuellaSolicitudPago;
    readonly aplicacion: AplicacionPago;
  }) {
    this.pagoId = datos.pagoId;
    this.creditoId = datos.creditoId;
    this.claveIdempotencia = datos.claveIdempotencia;
    this.huella = datos.huella;
    this.aplicacion = datos.aplicacion;
    Object.freeze(this);
  }
}
