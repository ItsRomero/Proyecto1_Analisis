import { DiasAtraso, FechaCivil, debeDevengarInteresCorriente } from "./calculadora-mora.js";
import { Dinero } from "./dinero.js";

export interface MovimientoDevengo {
  /** Importe incremental atribuible a esta fecha, nunca un acumulado de cortes anteriores. */
  readonly fecha: FechaCivil;
  readonly diasAtraso: DiasAtraso;
  readonly importe: Dinero;
}

/** Estado contable inmutable por crédito. Cortes crecientes; replay del último corte es idempotente. */
export class DevengoInteres {
  private constructor(
    public readonly creditoId: string,
    public readonly ingresoReconocido: Dinero,
    public readonly interesEnSuspenso: Dinero,
    public readonly devengoActivo: boolean,
    public readonly ultimoCorte: FechaCivil | null,
    public readonly reconocidoEnPeriodo: Dinero,
    private readonly ultimaHuella: string,
  ) { Object.freeze(this); }

  public static iniciar(creditoId: string, moneda: string): DevengoInteres {
    if (!creditoId.trim()) throw new Error("Crédito obligatorio.");
    return new DevengoInteres(creditoId, Dinero.cero(moneda), Dinero.cero(moneda), true, null, Dinero.cero(moneda), "");
  }

  public aplicarCorte(fechaCorte: FechaCivil, movimientos: readonly MovimientoDevengo[], regularizado = false): DevengoInteres {
    const huella = JSON.stringify([regularizado, movimientos.map((m) => [m.fecha.valor, m.diasAtraso.valor, m.importe.aJSON()])]);
    if (this.ultimoCorte?.valor === fechaCorte.valor) {
      if (huella !== this.ultimaHuella) throw new Error("Conflicto: mismo corte con contenido diferente.");
      return this;
    }
    if (this.ultimoCorte !== null && fechaCorte.diasDesde(this.ultimoCorte) < 0) throw new Error("Corte regresivo.");
    let anterior = this.ultimoCorte;
    let suspenso = this.interesEnSuspenso;
    let reconocido = Dinero.cero(this.ingresoReconocido.moneda);
    let activo = this.devengoActivo;
    for (const movimiento of movimientos) {
      if (movimiento.importe.esNegativo()) throw new Error("Devengo negativo.");
      movimiento.importe.sumar(Dinero.cero(this.ingresoReconocido.moneda));
      if (movimiento.fecha.diasDesde(fechaCorte) > 0 ||
          (anterior !== null && movimiento.fecha.diasDesde(anterior) <= 0)) throw new Error("Movimiento fuera de período o duplicado.");
      activo = debeDevengarInteresCorriente(movimiento.diasAtraso);
      if (activo) reconocido = reconocido.sumar(movimiento.importe);
      else suspenso = suspenso.sumar(movimiento.importe);
      anterior = movimiento.fecha;
    }
    if (regularizado) {
      reconocido = reconocido.sumar(suspenso);
      suspenso = Dinero.cero(suspenso.moneda);
      activo = true;
    }
    return new DevengoInteres(this.creditoId, this.ingresoReconocido.sumar(reconocido), suspenso,
      activo, fechaCorte, reconocido, huella);
  }
}
