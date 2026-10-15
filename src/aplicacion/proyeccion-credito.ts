import { addDays, formatISO, parseISO } from "date-fns";
import { DiasAtraso, FechaCivil, clasificarTramoMora } from "../dominio/calculadora-mora.js";
import { Credito, EstadoCredito, type EvidenciaTransicion } from "../dominio/credito-estado.js";
import { Dinero } from "../dominio/dinero.js";
import type { CreditoHecho, CuotaHecho, PagoHecho, TransicionHecho } from "./puertos-final.js";

export const sumarDias = (fecha: string, dias: number): string =>
  formatISO(addDays(parseISO(fecha), dias), { representation: "date" });
export const gtq = (centavos: bigint): Dinero => Dinero.desdeUnidadesMenores(centavos, "GTQ");
const fecha = (valor: string): FechaCivil => FechaCivil.desdeCadena(valor);
const evidencia = (dia: string, sujeto: string, motivo: string): EvidenciaTransicion =>
  ({ fecha: fecha(dia), usuarioProceso: sujeto, motivo });

export type TramoResumen = "SIN_MORA" | "MORA_1" | "MORA_2" | "MORA_3" | "VENCIDO" | "INCOBRABLE";
const ACTIVADOS = new Set([EstadoCredito.DESEMBOLSADO, EstadoCredito.VIGENTE, EstadoCredito.EN_MORA,
  EstadoCredito.REESTRUCTURADO, EstadoCredito.CANCELADO, EstadoCredito.INCOBRABLE]);

export interface ProyeccionCredito {
  readonly hecho: CreditoHecho;
  readonly corte: FechaCivil;
  readonly credito: Credito;
  readonly estado: EstadoCredito;
  /** Desembolsado y activado en una fecha no posterior al corte. */
  readonly activado: boolean;
  readonly saldoCapital: Dinero;
  readonly diasAtraso: number;
  readonly tramo: TramoResumen;
  readonly pagos: readonly PagoHecho[];
  readonly pagadas: ReadonlySet<number>;
  readonly pendientes: readonly CuotaHecho[];
  readonly vencidas: readonly CuotaHecho[];
  readonly baja: CreditoHecho["baja"];
}

/** Cuota pendiente más antigua y sus días de atraso a una fecha, solo con pagos conocidos a esa fecha. */
function atrasoAl(h: CreditoHecho, dia: string): { readonly cuota: CuotaHecho | undefined; readonly dias: number } {
  const pagadas = new Set(h.pagos.filter((p) => p.fecha <= dia).map((p) => p.numeroCuota));
  const cuota = h.cuotas.find((q) => !pagadas.has(q.numero));
  return { cuota, dias: cuota ? DiasAtraso.entre(fecha(cuota.vencimiento), fecha(dia)).valor : 0 };
}

const PREVIAS_A_ACTIVACION = new Set(["SOLICITADO>APROBADO", "SOLICITADO>RECHAZADO",
  "APROBADO>DESEMBOLSADO", "APROBADO>ANULADO", "DESEMBOLSADO>VIGENTE"]);

/**
 * Reejecuta en State una transición ya autorizada y persistida. Los argumentos de guarda
 * se derivan de los hechos a la fecha de la transición (días de atraso reales), no se fingen.
 */
function aplicar(c: Credito, t: TransicionHecho, h: CreditoHecho): void {
  const e = evidencia(t.fecha, t.sujetoId, t.motivo);
  switch (`${t.estadoAnterior}>${t.estadoNuevo}`) {
    case "SOLICITADO>APROBADO": c.aprobar(e, true, true); break;
    case "SOLICITADO>RECHAZADO": c.rechazar(e, true, true); break;
    case "APROBADO>DESEMBOLSADO": c.desembolsar(e, true, true, true); break;
    case "APROBADO>ANULADO": c.anular(e, true); break;
    case "DESEMBOLSADO>VIGENTE": c.activar(e, true, true); break;
    case "VIGENTE>EN_MORA": case "REESTRUCTURADO>EN_MORA": c.detectarMora(e, atrasoAl(h, t.fecha).dias, true); break;
    case "EN_MORA>EN_MORA": c.registrarPagoParcial(e, true); break;
    case "EN_MORA>VIGENTE": c.regularizar(e, true, true); break;
    case "VIGENTE>CANCELADO": case "EN_MORA>CANCELADO": case "REESTRUCTURADO>CANCELADO":
      c.liquidarConPago(e, Dinero.cero("GTQ"), 0); break;
    case "EN_MORA>INCOBRABLE": c.declararIncobrable(e, atrasoAl(h, t.fecha).dias, true); break;
    default: throw new Error(`Transición persistida no reconocida: ${t.estadoAnterior}>${t.estadoNuevo}.`);
  }
}

/** Estado persistido completo, para continuar con una operación de escritura. */
export function rehidratarCredito(h: CreditoHecho): Credito {
  const c = new Credito(h.creditoId);
  for (const t of h.transiciones) aplicar(c, t, h);
  return c;
}

/**
 * Proyección al corte: reproduce con State las transiciones previas a la activación y deriva
 * el resto de los hechos conocidos a esa fecha (ADR-009/018), sin anticipar bajas posteriores.
 */
export function proyectarCredito(h: CreditoHecho, corte: FechaCivil): ProyeccionCredito {
  const c = new Credito(h.creditoId);
  for (const t of h.transiciones) {
    if (t.fecha <= corte.valor && PREVIAS_A_ACTIVACION.has(`${t.estadoAnterior}>${t.estadoNuevo}`)) aplicar(c, t, h);
  }
  const activado = c.estado === EstadoCredito.VIGENTE;
  const pagos = activado ? h.pagos.filter((p) => p.fecha <= corte.valor) : [];
  const pagadas = new Set(pagos.map((p) => p.numeroCuota));
  const pendientes = activado ? h.cuotas.filter((q) => !pagadas.has(q.numero)) : [];
  const vencidas = pendientes.filter((q) => DiasAtraso.entre(fecha(q.vencimiento), corte).valor > 0);
  const masAntigua = pendientes[0];
  const diasAtraso = masAntigua ? DiasAtraso.entre(fecha(masAntigua.vencimiento), corte).valor : 0;
  const saldoCapital = activado
    ? pagos.reduce((saldo, p) => saldo.restar(gtq(p.aplicacion.CAPITAL)), gtq(h.capital)) : Dinero.cero("GTQ");
  const baja = h.baja !== null && h.baja.fecha <= corte.valor ? h.baja : null;
  if (activado) {
    const ultimo = pagos.at(-1);
    if (masAntigua === undefined && ultimo !== undefined) {
      c.liquidarConPago(evidencia(ultimo.fecha, ultimo.usuarioProceso, "Cuotas del plan liquidadas."), Dinero.cero("GTQ"), 0);
    } else if (masAntigua !== undefined && diasAtraso > 0) {
      c.detectarMora(evidencia(sumarDias(masAntigua.vencimiento, 1), "PROYECCION_AL_CORTE",
        "Cuota más antigua pendiente al corte."), diasAtraso, true);
      if (baja !== null) c.declararIncobrable(evidencia(baja.fecha, "PROYECCION_AL_CORTE", "Baja registrada (ADR-009)."),
        DiasAtraso.entre(fecha(masAntigua.vencimiento), fecha(baja.fecha)).valor, true);
    }
  }
  const estado = h.reestructurado && c.estado === EstadoCredito.VIGENTE ? EstadoCredito.REESTRUCTURADO : c.estado;
  const tramo: TramoResumen = estado === EstadoCredito.INCOBRABLE ? "INCOBRABLE"
    : activado ? clasificarTramoMora(DiasAtraso.desdeNumero(diasAtraso)) : "SIN_MORA";
  return Object.freeze({ hecho: h, corte, credito: c, estado, activado: ACTIVADOS.has(c.estado) && activado,
    saldoCapital, diasAtraso, tramo, pagos, pagadas, pendientes, vencidas, baja });
}

/**
 * Transiciones State que produce un pago confirmado, a partir del estado persistido.
 * Si el estado persistido quedó atrás de la fecha (mora nueva), primero se registra la mora.
 */
export function transicionesTrasPago(h: CreditoHecho, pago: PagoHecho, dia: FechaCivil, sujeto: string) {
  const c = rehidratarCredito(h);
  const previas = c.historial.length;
  const antes = atrasoAl(h, dia.valor);
  if ((c.estado === EstadoCredito.VIGENTE || c.estado === EstadoCredito.REESTRUCTURADO) && antes.dias > 0 && antes.cuota) {
    c.detectarMora(evidencia(sumarDias(antes.cuota.vencimiento, 1), sujeto, "Cuota vencida antes del pago."), antes.dias, true);
  }
  const conPago: CreditoHecho = { ...h, pagos: [...h.pagos, pago] };
  const despues = proyectarCredito(conPago, dia);
  const motivo = `Pago ${pago.pagoId} de la cuota ${pago.numeroCuota}.`;
  if (despues.pendientes.length === 0) c.liquidarConPago(evidencia(dia.valor, sujeto, motivo), Dinero.cero("GTQ"), 0);
  else if (c.estado === EstadoCredito.EN_MORA) {
    if (despues.diasAtraso > 0) c.registrarPagoParcial(evidencia(dia.valor, sujeto, `${motivo} Persiste una cuota vencida.`), true);
    else c.regularizar(evidencia(dia.valor, sujeto, `${motivo} Sin cuotas vencidas.`), true, true);
  }
  const transiciones: TransicionHecho[] = c.historial.slice(previas).map((t) => ({ estadoAnterior: t.estadoAnterior,
    estadoNuevo: t.estadoNuevo, fecha: t.fecha.valor, sujetoId: t.usuarioProceso, motivo: t.motivo }));
  return { estado: despues.estado, proyeccion: despues, transiciones };
}
