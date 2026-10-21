import { DiasAtraso, type FechaCivil } from "./calculadora-mora.js";
import { Dinero } from "./dinero.js";
import type { SaldosExigibles } from "./prelacion-pago.js";
import { REGLAS_COBRO } from "./politica-mora/configuracion-politica.js";

export interface EventoGastoGestion {
  readonly id: string;
  readonly creditoId: string;
  readonly cuotaId: string;
  readonly concepto: "GESTION_COBRO";
  readonly fechaCorte: FechaCivil;
  readonly importe: Dinero;
}

export interface ResultadoGastoGestion {
  readonly nuevo: EventoGastoGestion | null;
  readonly identificadoresRegistrados: readonly string[];
}

/** Función pura: el llamador conserva el resultado junto con el saldo actualizado. */
export function generarGastoGestion(datos: {
  readonly creditoId: string;
  readonly cuotaId: string;
  readonly fechaVencimiento: FechaCivil;
  readonly fechaCorte: FechaCivil;
  readonly identificadoresRegistrados: readonly string[];
  /** Extensión retrocompatible D-4; el llamador selecciona primero la política aplicable. */
  readonly configuracion?: { readonly diaGeneracion: number; readonly importe: Dinero };
}): ResultadoGastoGestion {
  if (!datos.creditoId.trim() || !datos.cuotaId.trim()) throw new Error("Crédito y cuota son obligatorios.");
  const id = JSON.stringify([datos.creditoId, datos.cuotaId, "GESTION_COBRO"]);
  const dias = DiasAtraso.entre(datos.fechaVencimiento, datos.fechaCorte);
  const diaGeneracion = datos.configuracion?.diaGeneracion ?? REGLAS_COBRO.diaGastoGestion;
  const importe = datos.configuracion?.importe ?? Dinero.desdeCadena(REGLAS_COBRO.importeGasto, REGLAS_COBRO.moneda);
  if (!Number.isSafeInteger(diaGeneracion) || diaGeneracion < 1 || importe.esNegativo()) throw new Error("Configuración de gasto inválida.");
  const generar = dias.valor >= diaGeneracion && !datos.identificadoresRegistrados.includes(id);
  const nuevo = generar ? Object.freeze({ id, creditoId: datos.creditoId, cuotaId: datos.cuotaId,
    concepto: "GESTION_COBRO" as const, fechaCorte: datos.fechaCorte,
    importe }) : null;
  return Object.freeze({ nuevo,
    identificadoresRegistrados: Object.freeze(generar ? [...datos.identificadoresRegistrados, id] : [...datos.identificadoresRegistrados]),
  });
}

/** Solo suma el evento NUEVO; las ejecuciones repetidas tienen nuevo = null. */
export function incorporarGastoGestion(saldos: SaldosExigibles, resultado: ResultadoGastoGestion): SaldosExigibles {
  return Object.freeze({ ...saldos,
    gastosComisiones: resultado.nuevo === null ? saldos.gastosComisiones : saldos.gastosComisiones.sumar(resultado.nuevo.importe),
  });
}
