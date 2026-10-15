import { Decimal } from "decimal.js";
import { formatISO, parseISO, startOfMonth } from "date-fns";
import { operacionesFinales, type EntradaFinal, type NombreOperacionFinal, type SalidaFinal } from "../contratos/proyecto-final.js";
import { presentarCartera, presentarMora } from "../contratos/presentadores-p2.js";
import { calcularCarteraPorTramo } from "../dominio/cartera-por-tramo.js";
import { DiasAtraso, FechaCivil } from "../dominio/calculadora-mora.js";
import {
  CronologiaTransicionInvalida, EstadoCredito, GuardaTransicionIncumplida, TransicionInvalida, type EvidenciaTransicion,
} from "../dominio/credito-estado.js";
import { Dinero } from "../dominio/dinero.js";
import { ClaveIdempotencia, ConflictoIdempotencia, HuellaSolicitudPago, PagoRegistrado } from "../dominio/pago-idempotente.js";
import { CapitalInvalido, PlazoInvalido, PlazoMeses, TasaInvalida, TasaNominalAnual } from "../dominio/plan-amortizacion.js";
import { ConceptoPrelacion, ProcesadorPrelacionPago, type AplicacionPago } from "../dominio/prelacion-pago.js";
import type { CasosUsoFinal, ContextoDe } from "./casos-uso-final.js";
import { consultarMora } from "./consultar-mora.js";
import { ErrorCasoUsoFinal, type CodigoProblemaFinal } from "./error-final.js";
import { simularPlanConVencimientos } from "./plan-con-vencimientos.js";
import { CatalogoPoliticasCanonicas, tasaDesdeBps } from "./politicas-canonicas.js";
import { gtq, proyectarCredito, rehidratarCredito, sumarDias, transicionesTrasPago, type ProyeccionCredito } from "./proyeccion-credito.js";
import { RegistrarPago, type RepositorioPagosIdempotentes } from "./registrar-pago.js";
import type {
  ConceptoAplicado, CreditoHecho, GeneradorIdsFinal, LecturasFinal, PagoHecho, PropuestaHecho, TransicionHecho, UnidadTrabajoFinal,
} from "./puertos-final.js";

export interface DependenciasCasosUso {
  readonly lecturas: LecturasFinal;
  readonly unidad: UnidadTrabajoFinal;
  readonly ids: GeneradorIdsFinal;
  /** ADR-017: retención mínima de la respuesta de idempotencia, contada desde la fecha de operación. */
  readonly diasRetencionIdempotencia: number;
}

const error = (codigo: CodigoProblemaFinal): ErrorCasoUsoFinal => new ErrorCasoUsoFinal(codigo);
const fecha = (valor: string): FechaCivil => FechaCivil.desdeCadena(valor);
const dinero = (d: Dinero) => ({ importe: d.aCadena(), moneda: "GTQ" });
const CERO = Dinero.cero("GTQ");
const entrada = <N extends NombreOperacionFinal>(n: N, valor: unknown): EntradaFinal<N> =>
  operacionesFinales[n].entrada.parse(valor) as EntradaFinal<N>;
/** Una salida fuera de contrato es un defecto interno, nunca un error de entrada de la persona usuaria. */
function salida<N extends NombreOperacionFinal>(n: N, valor: unknown): SalidaFinal<N> {
  const r = operacionesFinales[n].salida.safeParse(valor);
  if (!r.success) throw new Error(`Salida de ${n} fuera de contrato.`);
  return r.data as SalidaFinal<N>;
}
const evidencia = (dia: string, sujeto: string, motivo: string): EvidenciaTransicion =>
  ({ fecha: fecha(dia), usuarioProceso: sujeto, motivo });

/** Errores de dominio que tienen un código público; el resto llega al transporte como ERROR_INTERNO. */
function traducir(causa: unknown): never {
  if (causa instanceof TransicionInvalida || causa instanceof GuardaTransicionIncumplida) throw error("TRANSICION_INVALIDA");
  if (causa instanceof CronologiaTransicionInvalida) throw error("FECHA_INVALIDA");
  if (causa instanceof TasaInvalida || causa instanceof PlazoInvalido || causa instanceof CapitalInvalido) throw error("ENTRADA_INVALIDA");
  throw causa;
}

const CONCEPTOS: Readonly<Record<ConceptoPrelacion, ConceptoAplicado>> = {
  [ConceptoPrelacion.GASTOS_COMISIONES]: "GASTOS", [ConceptoPrelacion.INTERES_MORATORIO]: "MORATORIO",
  [ConceptoPrelacion.INTERES_CORRIENTE]: "CORRIENTE", [ConceptoPrelacion.CAPITAL]: "CAPITAL",
};
function conceptosDe(aplicacion: AplicacionPago): Record<ConceptoAplicado, bigint> {
  const r: Record<ConceptoAplicado, bigint> = { GASTOS: 0n, MORATORIO: 0n, CORRIENTE: 0n, CAPITAL: 0n,
    EXCEDENTE: aplicacion.excedente.aUnidadesMenores() };
  for (const paso of aplicacion.pasos) r[CONCEPTOS[paso.concepto]] = paso.aplicado.aUnidadesMenores();
  return r;
}
const aplicacionJson = (a: Readonly<Record<ConceptoAplicado, bigint>>) => ({
  gastosComisiones: dinero(gtq(a.GASTOS)), interesMoratorio: dinero(gtq(a.MORATORIO)),
  interesCorriente: dinero(gtq(a.CORRIENTE)), capital: dinero(gtq(a.CAPITAL)), excedente: dinero(gtq(a.EXCEDENTE)),
});
const pagoJson = (creditoId: string, p: PagoHecho) => ({ importe: gtq(p.importe).aCadena(), moneda: "GTQ",
  fechaPago: p.fecha, usuarioProceso: p.usuarioProceso, pagoId: p.pagoId, creditoId, idempotencyKey: p.clave,
  aplicacion: aplicacionJson(p.aplicacion) });

function resumen(p: ProyeccionCredito): SalidaFinal<"consultarCredito"> {
  const proxima = p.pendientes[0];
  return salida("consultarCredito", { creditoId: p.hecho.creditoId, fechaCorte: p.corte.valor, estado: p.estado,
    saldoCapital: dinero(p.saldoCapital), diasAtraso: p.diasAtraso, tramo: p.tramo, cuotasPagadas: p.pagadas.size,
    cuotasVencidas: p.vencidas.length, versionCredito: p.hecho.version,
    proximaCuota: proxima ? { numeroCuota: proxima.numero, fechaVencimiento: proxima.vencimiento, importe: dinero(gtq(proxima.importe)) } : null });
}

/**
 * Precarga de idempotencia (diseño fase 1): las claves y huellas vienen del crédito bloqueado.
 * El replay devuelve el pago original reconstruido; contenido distinto lanza ConflictoIdempotencia.
 */
function idempotenciaPrecargada(h: CreditoHecho): RepositorioPagosIdempotentes {
  return {
    ejecutarUnaVez(creditoId, clave, huella, crear) {
      const previo = h.pagos.find((p) => p.clave === clave.valor);
      if (previo === undefined) return { pago: crear(), repetido: false };
      if (previo.huella !== huella.valor) throw new ConflictoIdempotencia();
      const importe = gtq(previo.importe);
      const original = new PagoRegistrado({ pagoId: previo.pagoId, creditoId, claveIdempotencia: clave,
        huella: HuellaSolicitudPago.crear({ creditoId, importe: importe.aCadena(), moneda: "GTQ", fechaPago: previo.fecha,
          usuarioProceso: previo.usuarioProceso }),
        aplicacion: new ProcesadorPrelacionPago().procesar(importe, { gastosComisiones: gtq(previo.aplicacion.GASTOS),
          interesMoratorio: gtq(previo.aplicacion.MORATORIO), interesCorriente: gtq(previo.aplicacion.CORRIENTE),
          capital: gtq(previo.aplicacion.CAPITAL) }) });
      if (!original.huella.esIgualA(huella)) throw new ConflictoIdempotencia();
      return { pago: original, repetido: true };
    },
  };
}

/** Proponente, canal y clave de la propuesta, copiados en cada evento de auditoría que la resuelve. */
const rastro = (p: PropuestaHecho) => ({ proponente: p.sujetoProponente, canalProponente: p.canalProponente, claveIdempotencia: p.claveIdempotencia });

export function crearCasosUsoFinal(deps: DependenciasCasosUso): CasosUsoFinal {
  const catalogo = async () => new CatalogoPoliticasCanonicas(await deps.lecturas.configuracionPoliticas());

  async function creditoExistente(creditoId: string, corte: string): Promise<CreditoHecho> {
    const h = await deps.lecturas.credito(creditoId);
    if (h === null || corte < h.fechaSolicitud) throw error("CREDITO_NO_EXISTE");
    return h;
  }

  /** Deuda exacta de una cuota mediante el catálogo inyectado y el núcleo (R-3, D-3). */
  function deudaDe(p: ProyeccionCredito, numero: number, cat: CatalogoPoliticasCanonicas) {
    const h = p.hecho;
    if (!p.activado || h.fechaDesembolso === null) throw error("TRANSICION_INVALIDA");
    const cuota = h.cuotas.find((q) => q.numero === numero);
    if (cuota === undefined) throw error("REFERENCIA_INEXISTENTE");
    if (p.pagadas.has(numero)) throw error("CUOTA_YA_PAGADA");
    // Una baja congela el devengo moratorio en su fecha (ADR-009, consultarMora P2).
    const corteDevengo = p.baja !== null ? fecha(p.baja.fecha) : p.corte;
    const vencimiento = fecha(cuota.vencimiento);
    const politica = cat.resolver(h.fechaDesembolso);
    const deuda = cat.deuda(gtq(cuota.capital), gtq(cuota.interes), DiasAtraso.entre(vencimiento, corteDevengo), politica,
      { creditoId: h.creditoId, cuotaId: String(numero), fechaVencimiento: vencimiento, fechaCorte: corteDevengo, identificadoresRegistrados: [] });
    return { cuota, politica, deuda };
  }
  const deudaJson = (p: ProyeccionCredito, numero: number, d: ReturnType<typeof deudaDe>["deuda"]) => ({
    creditoId: p.hecho.creditoId, fechaCorte: p.corte.valor, numeroCuota: numero,
    gastosComisiones: dinero(d.gastosComisiones), interesMoratorio: dinero(d.interesMoratorio),
    interesCorriente: dinero(d.interesCorriente), capital: dinero(d.capital), totalExigible: dinero(d.total) });

  async function cartera(corte: FechaCivil, inicio: FechaCivil) {
    if (inicio.diasDesde(corte) > 0) throw error("PERIODO_INVALIDO");
    const proyecciones = (await deps.lecturas.creditos()).map((h) => proyectarCredito(h, corte)).filter((p) => p.activado);
    return presentarCartera(calcularCarteraPorTramo({ moneda: "GTQ", fechaCorte: corte, inicioPeriodo: inicio,
      creditos: proyecciones.map((p) => ({ id: p.hecho.creditoId, estado: p.estado, saldoCapital: p.saldoCapital, diasAtraso: p.diasAtraso })),
      bajas: proyecciones.flatMap((p) => p.baja === null ? [] : [{ creditoId: p.hecho.creditoId, fecha: fecha(p.baja.fecha), saldoCapital: gtq(p.baja.saldo) }]) }));
  }

  /** D-8: desembolsos y recuperaciones por concepto desde la prelación registrada de cada pago. */
  async function cierrePrevio(tipo: "DIARIO" | "MENSUAL", corte: string): Promise<SalidaFinal<"consultarCierre">> {
    const inicio = tipo === "DIARIO" ? corte : formatISO(startOfMonth(parseISO(corte)), { representation: "date" });
    const creditos = await deps.lecturas.creditos();
    const enPeriodo = (dia: string | null) => dia !== null && dia >= inicio && dia <= corte;
    const desembolsados = creditos.filter((h) => enPeriodo(h.fechaDesembolso));
    const pagos = creditos.flatMap((h) => h.pagos).filter((p) => enPeriodo(p.fecha));
    const suma = (f: (p: PagoHecho) => bigint) => pagos.reduce((s, p) => s.sumar(gtq(f(p))), CERO);
    return salida("consultarCierre", { fechaCorte: corte, tipo, inicioPeriodo: inicio, cierreId: null, estado: "PREVIO",
      desembolsos: { cantidad: desembolsados.length, monto: dinero(desembolsados.reduce((s, h) => s.sumar(gtq(h.capital)), CERO)) },
      recuperaciones: { cantidad: pagos.length, total: dinero(suma((p) => p.importe)),
        gastosComisiones: dinero(suma((p) => p.aplicacion.GASTOS)), interesMoratorio: dinero(suma((p) => p.aplicacion.MORATORIO)),
        interesCorriente: dinero(suma((p) => p.aplicacion.CORRIENTE)), capital: dinero(suma((p) => p.aplicacion.CAPITAL)) },
      cartera: await cartera(fecha(corte), fecha(inicio)) });
  }

  /** Transiciones de comité/desembolso: State existente, evidencia de sesión y auditoría. */
  async function transicionHumana(e: EntradaFinal<"aprobarCredito">, ctx: ContextoDe<"aprobarCredito">,
    tipo: "COMITE" | "DESEMBOLSO", accion: (c: ReturnType<typeof rehidratarCredito>, h: CreditoHecho) => Promise<Partial<CreditoHecho>>) {
    return deps.unidad.ejecutar(async (tx) => {
      const h = await tx.bloquearCredito(e.creditoId);
      if (h === null) throw error("CREDITO_NO_EXISTE");
      if (e.fechaOperacion < h.fechaSolicitud) throw error("FECHA_INVALIDA");
      const c = rehidratarCredito(h);
      const previas = c.historial.length;
      let cambios: Partial<CreditoHecho>;
      try { cambios = await accion(c, h); } catch (causa) { traducir(causa); }
      const nuevas: TransicionHecho[] = c.historial.slice(previas).map((t) => ({ estadoAnterior: t.estadoAnterior,
        estadoNuevo: t.estadoNuevo, fecha: t.fecha.valor, sujetoId: t.usuarioProceso, motivo: t.motivo }));
      const version = h.version + 1;
      await tx.insertarTransiciones(h.creditoId, nuevas, { origen: "INTERFAZ", sesionId: ctx.sesionId,
        eventoAprobacionId: ctx.eventoAprobacionId, traceId: ctx.traceId });
      await tx.actualizarCredito(h.creditoId, { estado: c.estado, version,
        ...(cambios.politicaId ? { politicaId: cambios.politicaId } : {}),
        ...(cambios.fechaDesembolso ? { fechaDesembolso: cambios.fechaDesembolso } : {}) });
      await tx.registrarAuditoria({ id: deps.ids.aprobacion(), propuestaId: null, creditoId: h.creditoId, sujetoId: ctx.sujetoId,
        sesionId: ctx.sesionId, tipo, fechaOperacion: e.fechaOperacion, resultado: c.estado, versionCredito: version, traceId: ctx.traceId });
      const actualizado: CreditoHecho = { ...h, ...cambios, estado: c.estado, version, transiciones: [...h.transiciones, ...nuevas] };
      return resumen(proyectarCredito(actualizado, fecha(e.fechaOperacion)));
    });
  }

  const casos: CasosUsoFinal = {
    altaCliente: { async ejecutar(valor) {
      const e = entrada("altaCliente", valor);
      return deps.unidad.ejecutar(async (tx) => {
        if (await tx.existeCliente(e.clienteId) || await tx.identificacionRegistrada(e.identificadorLegal.tipo, e.identificadorLegal.valor))
          throw error("CLIENTE_YA_EXISTE");
        await tx.insertarCliente(e);
        return salida("altaCliente", e);
      });
    } },

    solicitarCredito: { async ejecutar(valor) {
      const e = entrada("solicitarCredito", valor);
      let tnaBps: number;
      try {
        TasaNominalAnual.desdeCadena(e.tasaNominalAnual);
        PlazoMeses.desdeNumero(e.plazoMeses);
        const bps = new Decimal(e.tasaNominalAnual).times(10000);
        if (!bps.isInteger()) throw error("ENTRADA_INVALIDA");
        tnaBps = bps.toNumber();
      } catch (causa) { traducir(causa); }
      return deps.unidad.ejecutar(async (tx) => {
        if (await tx.bloquearCredito(e.creditoId) !== null) throw error("CREDITO_YA_EXISTE");
        if (!await tx.existeCliente(e.clienteId) || !await tx.existeAsesor(e.asesorId)) throw error("REFERENCIA_INEXISTENTE");
        const hecho = { creditoId: e.creditoId, clienteId: e.clienteId, asesorId: e.asesorId, politicaId: null,
          estado: EstadoCredito.SOLICITADO, capital: Dinero.desdeCadena(e.monto.importe, "GTQ").aUnidadesMenores(), tnaBps,
          plazoMeses: e.plazoMeses, fechaSolicitud: e.fechaSolicitud, fechaDesembolso: null, reestructurado: false, version: 0 };
        await tx.insertarCredito(hecho);
        return resumen(proyectarCredito({ ...hecho, cuotas: [], pagos: [], transiciones: [], baja: null }, fecha(e.fechaSolicitud)));
      });
    } },

    simularPlan: { async ejecutar(valor) {
      const e = entrada("simularPlan", valor);
      try {
        const plan = simularPlanConVencimientos({ capital: Dinero.desdeCadena(e.monto.importe, "GTQ"),
          tasaNominalAnual: TasaNominalAnual.desdeCadena(e.tasaNominalAnual), plazo: PlazoMeses.desdeNumero(e.plazoMeses),
          fechaDesembolso: fecha(e.fechaDesembolso) });
        return salida("simularPlan", { fechaDesembolso: e.fechaDesembolso, cuotas: plan.cuotas.map(({ cuota, fechaVencimiento }) => ({
          numero: cuota.numero, saldoAnterior: cuota.saldoAnterior.aJSON(), interes: cuota.interes.aJSON(),
          amortizacion: cuota.amortizacion.aJSON(), importe: cuota.importe.aJSON(), saldoPosterior: cuota.saldoPosterior.aJSON(),
          fechaVencimiento: fechaVencimiento.valor })) });
      } catch (causa) { traducir(causa); }
    } },

    aprobarCredito: { async ejecutar(valor, ctx) {
      const e = entrada("aprobarCredito", valor);
      if (ctx.perfil !== "GERENCIA") throw error("SESION_NO_AUTORIZADA");
      return transicionHumana(e, ctx, "COMITE", async (c) => {
        c.aprobar(evidencia(e.fechaOperacion, ctx.sujetoId, `Aprobación del comité: ${e.motivo}`), true, true);
        return {};
      });
    } },

    rechazarCredito: { async ejecutar(valor, ctx) {
      const e = entrada("rechazarCredito", valor);
      if (ctx.perfil !== "GERENCIA") throw error("SESION_NO_AUTORIZADA");
      return transicionHumana(e, ctx, "COMITE", async (c) => {
        c.rechazar(evidencia(e.fechaOperacion, ctx.sujetoId, `Rechazo del comité: ${e.motivo}`), true, true);
        return {};
      });
    } },

    desembolsarCredito: { async ejecutar(valor, ctx) {
      const e = entrada("desembolsarCredito", valor);
      const cat = await catalogo();
      return deps.unidad.ejecutar(async (tx) => {
        const h = await tx.bloquearCredito(e.creditoId);
        if (h === null) throw error("CREDITO_NO_EXISTE");
        // D-5: vencimientos desde la fecha real de desembolso; la política se fija por esa fecha (R-7).
        const plan = simularPlanConVencimientos({ capital: gtq(h.capital), tasaNominalAnual: TasaNominalAnual.desdeCadena(tasaDesdeBps(h.tnaBps)),
          plazo: PlazoMeses.desdeNumero(h.plazoMeses), fechaDesembolso: fecha(e.fechaOperacion) });
        const cuotas = plan.cuotas.map(({ cuota, fechaVencimiento }) => ({ numero: cuota.numero, vencimiento: fechaVencimiento.valor,
          capital: cuota.amortizacion.aUnidadesMenores(), interes: cuota.interes.aUnidadesMenores(),
          importe: cuota.importe.aUnidadesMenores(), saldoPosterior: cuota.saldoPosterior.aUnidadesMenores() }));
        const politicaId = cat.resolver(e.fechaOperacion).id;
        const c = rehidratarCredito(h);
        const previas = c.historial.length;
        try {
          const ev = evidencia(e.fechaOperacion, ctx.sujetoId, `Desembolso: ${e.motivo}`);
          c.desembolsar(ev, true, true, true);
          c.activar(evidencia(e.fechaOperacion, ctx.sujetoId, "Plan contractual generado y saldo inicial reconocido."), true, true);
        } catch (causa) { traducir(causa); }
        if (e.fechaOperacion < h.fechaSolicitud) throw error("FECHA_INVALIDA");
        const nuevas: TransicionHecho[] = c.historial.slice(previas).map((t) => ({ estadoAnterior: t.estadoAnterior,
          estadoNuevo: t.estadoNuevo, fecha: t.fecha.valor, sujetoId: t.usuarioProceso, motivo: t.motivo }));
        const version = h.version + 1;
        await tx.insertarCuotas(h.creditoId, cuotas);
        await tx.insertarTransiciones(h.creditoId, nuevas, { origen: "INTERFAZ", sesionId: ctx.sesionId,
          eventoAprobacionId: ctx.eventoAprobacionId, traceId: ctx.traceId });
        await tx.actualizarCredito(h.creditoId, { estado: c.estado, version, politicaId, fechaDesembolso: e.fechaOperacion });
        await tx.registrarAuditoria({ id: deps.ids.aprobacion(), propuestaId: null, creditoId: h.creditoId, sujetoId: ctx.sujetoId,
          sesionId: ctx.sesionId, tipo: "DESEMBOLSO", fechaOperacion: e.fechaOperacion, resultado: c.estado, versionCredito: version, traceId: ctx.traceId });
        return resumen(proyectarCredito({ ...h, politicaId, fechaDesembolso: e.fechaOperacion, estado: c.estado, version, cuotas,
          transiciones: [...h.transiciones, ...nuevas] }, fecha(e.fechaOperacion)));
      });
    } },

    consultarCredito: { async ejecutar(valor) {
      const e = entrada("consultarCredito", valor);
      return resumen(proyectarCredito(await creditoExistente(e.creditoId, e.fechaCorte), fecha(e.fechaCorte)));
    } },

    consultarPlan: { async ejecutar(valor) {
      const e = entrada("consultarPlan", valor);
      const h = await creditoExistente(e.creditoId, e.fechaCorte);
      if (h.fechaDesembolso === null || h.cuotas.length === 0) throw error("TRANSICION_INVALIDA");
      return salida("consultarPlan", { fechaDesembolso: h.fechaDesembolso, cuotas: h.cuotas.map((q, i) => ({ numero: q.numero,
        saldoAnterior: dinero(gtq(i === 0 ? h.capital : h.cuotas[i - 1]!.saldoPosterior)), interes: dinero(gtq(q.interes)),
        amortizacion: dinero(gtq(q.capital)), importe: dinero(gtq(q.importe)), saldoPosterior: dinero(gtq(q.saldoPosterior)),
        fechaVencimiento: q.vencimiento })) });
    } },

    calcularDeudaCuota: { async ejecutar(valor) {
      const e = entrada("calcularDeudaCuota", valor);
      const p = proyectarCredito(await creditoExistente(e.creditoId, e.fechaCorte), fecha(e.fechaCorte));
      return salida("calcularDeudaCuota", deudaJson(p, e.numeroCuota, deudaDe(p, e.numeroCuota, await catalogo()).deuda));
    } },

    explicarMora: { async ejecutar(valor) {
      const e = entrada("explicarMora", valor);
      const h = await creditoExistente(e.creditoId, e.fechaCorte);
      const p = proyectarCredito(h, fecha(e.fechaCorte));
      const { cuota, politica } = deudaDe(p, e.numeroCuota, await catalogo());
      const base = { creditoId: h.creditoId, fechaOtorgamiento: fecha(h.fechaDesembolso!), fechaCorte: p.corte, politica,
        cuotas: [{ referencia: `${h.creditoId}:C${cuota.numero}`, capitalVencido: gtq(cuota.capital), fechaVencimiento: fecha(cuota.vencimiento) }] };
      const estado = p.estado;
      return presentarMora(estado === EstadoCredito.INCOBRABLE && p.baja !== null
        ? consultarMora({ ...base, estado, fechaDeclaracionIncobrable: fecha(p.baja.fecha) })
        : consultarMora({ ...base, estado: estado === EstadoCredito.INCOBRABLE ? EstadoCredito.EN_MORA : estado }));
    } },

    listarCreditosMora: { async ejecutar(valor) {
      const e = entrada("listarCreditosMora", valor);
      const corte = fecha(e.fechaCorte);
      const lista = (await deps.lecturas.creditos()).map((h) => proyectarCredito(h, corte))
        .filter((p) => p.activado && p.diasAtraso > 0 && (e.tramo === undefined || p.tramo === e.tramo))
        .sort((a, b) => b.diasAtraso - a.diasAtraso || a.hecho.creditoId.localeCompare(b.hecho.creditoId));
      return salida("listarCreditosMora", { fechaCorte: e.fechaCorte, creditos: lista.map(resumen) });
    } },

    proximosVencimientos: { async ejecutar(valor) {
      const e = entrada("proximosVencimientos", valor);
      // D-7: ventana (corte, corte + N]; cuotas pendientes a la fecha consultada, sin anticipar pagos posteriores.
      const hasta = sumarDias(e.fechaCorte, e.dias);
      const cuotas = (await deps.lecturas.creditos()).map((h) => proyectarCredito(h, fecha(e.fechaCorte)))
        .filter((p) => p.activado && p.estado !== EstadoCredito.INCOBRABLE && p.estado !== EstadoCredito.CANCELADO)
        .flatMap((p) => p.pendientes.filter((q) => q.vencimiento > e.fechaCorte && q.vencimiento <= hasta)
          .map((q) => ({ creditoId: p.hecho.creditoId, numeroCuota: q.numero, fechaVencimiento: q.vencimiento, importe: gtq(q.importe) })))
        .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento) || a.creditoId.localeCompare(b.creditoId));
      return salida("proximosVencimientos", { fechaCorte: e.fechaCorte, dias: e.dias, hastaIncluido: hasta, cantidad: cuotas.length,
        montoTotal: dinero(cuotas.reduce((s, q) => s.sumar(q.importe), CERO)),
        cuotas: cuotas.map((q) => ({ ...q, importe: dinero(q.importe) })) });
    } },

    consultarCartera: { async ejecutar(valor) {
      const e = entrada("consultarCartera", valor);
      return salida("consultarCartera", await cartera(fecha(e.fechaCorte), fecha(e.inicioPeriodo)));
    } },

    consultarCierre: { async ejecutar(valor) {
      const e = entrada("consultarCierre", valor);
      const previo = await cierrePrevio(e.tipo, e.fechaCorte);
      return await deps.lecturas.cierre(e.tipo, previo.inicioPeriodo, e.fechaCorte) ?? previo;
    } },

    generarCierre: { async ejecutar(valor, ctx) {
      const e = entrada("generarCierre", valor);
      if (ctx.perfil !== "GERENCIA") throw error("SESION_NO_AUTORIZADA");
      const previo = await cierrePrevio(e.tipo, e.fechaCorte);
      const versionCartera = (await deps.lecturas.creditos()).reduce((n, h) => n + h.version + 1, 0);
      return deps.unidad.ejecutar(async (tx) => {
        // Snapshot inmutable y único por tipo/inicio/corte (ADR-016): repetir devuelve el existente.
        const existente = await tx.obtenerCierre(e.tipo, previo.inicioPeriodo, e.fechaCorte);
        if (existente !== null) return existente;
        const generado = salida("generarCierre", { ...previo, estado: "GENERADO",
          cierreId: `CIERRE-${e.tipo}-${previo.inicioPeriodo}-${e.fechaCorte}` });
        await tx.insertarCierre(generado, versionCartera, ctx.sujetoId);
        return generado;
      });
    } },

    proponerPago: { async ejecutar(valor, ctx) {
      const e = entrada("proponerPago", valor);
      // Proponer existe para la interfaz y para el asistente (MCP); nunca para la carga.
      if (ctx.canal !== "INTERFAZ" && ctx.canal !== "MCP") throw error("SESION_NO_AUTORIZADA");
      const canalProponente = ctx.canal;
      const cat = await catalogo();
      return deps.unidad.ejecutar(async (tx) => {
        const h = await tx.bloquearCredito(e.creditoId);
        if (h === null || e.fechaCorte < h.fechaSolicitud) throw error("CREDITO_NO_EXISTE");
        // Una clave ya usada no abre otra propuesta: el reintento se hace sobre la confirmación original.
        if (h.pagos.some((p) => p.clave === e.claveIdempotencia)) throw new ConflictoIdempotencia();
        const corte = fecha(e.fechaCorte);
        const p = proyectarCredito(h, corte);
        if (!p.activado) throw error("TRANSICION_INVALIDA");
        if (p.estado === EstadoCredito.INCOBRABLE) throw error("CREDITO_INCOBRABLE");
        if (h.pagos.some((pg) => pg.fecha > e.fechaCorte)) throw error("FECHA_INVALIDA");
        if (p.pagadas.has(e.numeroCuota) || p.pendientes.length === 0) throw error("CUOTA_YA_PAGADA");
        if (p.pendientes[0]?.numero !== e.numeroCuota) throw error("CUOTA_FUERA_DE_ORDEN");
        const { deuda } = deudaDe(p, e.numeroCuota, cat);
        const monto = Dinero.desdeCadena(e.monto.importe, "GTQ");
        // D-2: el pago debe igualar al centavo el exigible que calcula el núcleo.
        if (!monto.esIgualA(deuda.total)) throw new ErrorCasoUsoFinal("MONTO_NO_EXACTO", { importe: deuda.total.aCadena(), moneda: "GTQ" });
        const aplicacion = new ProcesadorPrelacionPago().procesar(monto, deuda);
        const previsto: PagoHecho = { pagoId: "PREVISTO", numeroCuota: e.numeroCuota, fecha: e.fechaCorte, importe: monto.aUnidadesMenores(),
          clave: e.claveIdempotencia, huella: "", usuarioProceso: ctx.sujetoId, canal: ctx.canal, propuestaId: null, aplicacion: conceptosDe(aplicacion) };
        const propuesta = salida("proponerPago", { ...e, propuestaId: deps.ids.propuesta(), sesionId: ctx.sesionId, estado: "PENDIENTE",
          versionCredito: h.version, deuda: deudaJson(p, e.numeroCuota, deuda), aplicacionPrevista: aplicacionJson(conceptosDe(aplicacion)),
          estadoPrevisto: proyectarCredito({ ...h, pagos: [...h.pagos, previsto] }, corte).estado });
        await tx.guardarPropuesta({ ...propuesta, sujetoProponente: ctx.sujetoId, canalProponente,
          huella: HuellaSolicitudPago.crear({ creditoId: h.creditoId, importe: monto.aCadena(), moneda: "GTQ",
            fechaPago: e.fechaCorte, usuarioProceso: ctx.sujetoId }).valor });
        // Fase 4: rastro de quién o qué propuso; la propuesta no tiene efecto financiero.
        await tx.registrarAuditoria({ id: deps.ids.aprobacion(), propuestaId: propuesta.propuestaId, creditoId: h.creditoId, sujetoId: ctx.sujetoId,
          sesionId: ctx.sesionId, tipo: "PROPUESTA", fechaOperacion: e.fechaCorte, resultado: "PENDIENTE", versionCredito: h.version,
          traceId: ctx.traceId, proponente: ctx.sujetoId, canalProponente, claveIdempotencia: e.claveIdempotencia });
        return propuesta;
      });
    } },

    confirmarPago: { async ejecutar(valor, ctx) {
      const e = entrada("confirmarPago", valor);
      const cat = await catalogo();
      const resultado = await deps.unidad.ejecutar(async (tx) => {
        const prop = await tx.obtenerPropuesta(e.propuestaId);
        if (prop === null) throw error("PROPUESTA_NO_EXISTE");
        if (ctx.claveIdempotencia !== prop.claveIdempotencia) throw new ConflictoIdempotencia();
        const h = await tx.bloquearCredito(prop.creditoId);
        if (h === null) throw error("CREDITO_NO_EXISTE");
        const monto = Dinero.desdeCadena(prop.monto.importe, "GTQ");
        const comando = { creditoId: h.creditoId, claveIdempotencia: prop.claveIdempotencia, importe: monto,
          fechaPago: fecha(prop.fechaCorte), usuarioProceso: prop.sujetoProponente,
          contextoExcedente: { capitalNoExigible: CERO, cuotasFuturas: CERO } };
        const repositorio = idempotenciaPrecargada(h);
        const previo = h.pagos.find((p) => p.clave === prop.claveIdempotencia);
        if (previo !== undefined) {
          // ADR-010/017: el replay se resuelve antes de revalidar; mismo contenido devuelve el pago original.
          new RegistrarPago(repositorio, { siguiente: () => { throw new Error("Un replay no crea pagos."); } })
            .ejecutar({ ...comando, saldosExigibles: { gastosComisiones: CERO, interesMoratorio: CERO, interesCorriente: CERO, capital: CERO } });
          await tx.registrarAuditoria({ id: deps.ids.aprobacion(), propuestaId: prop.propuestaId, creditoId: h.creditoId, sujetoId: ctx.sujetoId,
            sesionId: ctx.sesionId, tipo: "PAGO", fechaOperacion: prop.fechaCorte, resultado: "REINTENTO_SIN_EFECTO", versionCredito: h.version, traceId: ctx.traceId,
            ...rastro(prop) });
          return { tipo: "ok" as const, pago: pagoJson(h.creditoId, previo), repetido: true };
        }
        if (prop.sesionId !== ctx.sesionId) throw error("SESION_NO_AUTORIZADA");
        if (prop.estado !== "PENDIENTE") throw error("PROPUESTA_OBSOLETA");
        const obsoleta = async () => { await tx.actualizarEstadoPropuesta(prop.propuestaId, "OBSOLETA"); return { tipo: "obsoleta" as const }; };
        if (e.fechaOperacion !== prop.fechaCorte || e.versionCredito !== prop.versionCredito || h.version !== prop.versionCredito) return obsoleta();
        const corte = fecha(prop.fechaCorte);
        const p = proyectarCredito(h, corte);
        if (p.estado === EstadoCredito.INCOBRABLE) throw error("CREDITO_INCOBRABLE");
        if (p.pagadas.has(prop.numeroCuota)) throw error("CUOTA_YA_PAGADA");
        if (p.pendientes[0]?.numero !== prop.numeroCuota) throw error("CUOTA_FUERA_DE_ORDEN");
        const { deuda } = deudaDe(p, prop.numeroCuota, cat);
        if (!deuda.total.esIgualA(monto)) return obsoleta();
        const aprobacionId = deps.ids.aprobacion();
        await tx.registrarAuditoria({ id: aprobacionId, propuestaId: prop.propuestaId, creditoId: h.creditoId, sujetoId: ctx.sujetoId,
          sesionId: ctx.sesionId, tipo: "PAGO", fechaOperacion: prop.fechaCorte, resultado: "CONFIRMADA", versionCredito: h.version, traceId: ctx.traceId,
          ...rastro(prop) });
        const registro = new RegistrarPago(repositorio, { siguiente: () => deps.ids.pago() }).ejecutar({ ...comando, saldosExigibles: deuda });
        if (registro.repetido || registro.pago.huella.valor !== prop.huella) throw new Error("Idempotencia inconsistente con la propuesta.");
        const pago: PagoHecho = { pagoId: registro.pago.pagoId, numeroCuota: prop.numeroCuota, fecha: prop.fechaCorte,
          importe: monto.aUnidadesMenores(), clave: prop.claveIdempotencia, huella: registro.pago.huella.valor,
          usuarioProceso: prop.sujetoProponente, canal: ctx.canal, propuestaId: prop.propuestaId, aplicacion: conceptosDe(registro.pago.aplicacion) };
        let sincronizado: ReturnType<typeof transicionesTrasPago>;
        try { sincronizado = transicionesTrasPago(h, pago, corte, ctx.sujetoId); } catch (causa) { traducir(causa); }
        await tx.insertarPago(h.creditoId, pago, { aprobacionId,
          conservarClaveHasta: sumarDias(prop.fechaCorte, deps.diasRetencionIdempotencia) });
        if (!deuda.gastosComisiones.esCero())
          await tx.insertarGasto(h.creditoId, prop.numeroCuota, prop.fechaCorte, deuda.gastosComisiones.aUnidadesMenores());
        await tx.insertarTransiciones(h.creditoId, sincronizado.transiciones, { origen: "INTERFAZ", pagoId: pago.pagoId,
          propuestaId: prop.propuestaId, aprobacionId, eventoAprobacionId: ctx.eventoAprobacionId, traceId: ctx.traceId });
        await tx.actualizarCredito(h.creditoId, { estado: sincronizado.estado, version: h.version + 1 });
        await tx.actualizarEstadoPropuesta(prop.propuestaId, "CONFIRMADA");
        return { tipo: "ok" as const, pago: pagoJson(h.creditoId, pago), repetido: false };
      });
      if (resultado.tipo === "obsoleta") throw error("PROPUESTA_OBSOLETA");
      return salida("confirmarPago", { pago: resultado.pago, repetido: resultado.repetido });
    } },

    cancelarPropuesta: { async ejecutar(valor, ctx) {
      const e = entrada("cancelarPropuesta", valor);
      return deps.unidad.ejecutar(async (tx) => {
        const prop = await tx.obtenerPropuesta(e.propuestaId);
        if (prop === null) throw error("PROPUESTA_NO_EXISTE");
        if (prop.sesionId !== ctx.sesionId) throw error("SESION_NO_AUTORIZADA");
        if (prop.estado !== "PENDIENTE") throw error("PROPUESTA_OBSOLETA");
        await tx.actualizarEstadoPropuesta(prop.propuestaId, "CANCELADA");
        await tx.registrarAuditoria({ id: deps.ids.aprobacion(), propuestaId: prop.propuestaId, creditoId: prop.creditoId, sujetoId: ctx.sujetoId,
          sesionId: ctx.sesionId, tipo: "CANCELACION", fechaOperacion: e.fechaOperacion, resultado: "CANCELADA",
          versionCredito: prop.versionCredito, traceId: ctx.traceId, ...rastro(prop) });
        const { sujetoProponente: _s, huella: _h, canalProponente: _c, ...publica } = prop;
        return salida("cancelarPropuesta", { ...publica, estado: "CANCELADA" });
      });
    } },

    listarClientes: { async ejecutar(valor) {
      const e = entrada("listarClientes", valor);
      const corte = fecha(e.fechaCorte);
      const normalizar = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
      const buscado = e.busqueda ? normalizar(e.busqueda) : "";
      const creditos = (await deps.lecturas.creditos()).filter((h) => h.fechaSolicitud <= e.fechaCorte);
      const clientes = (await deps.lecturas.clientes()).filter((c) => c.fechaAlta <= e.fechaCorte).map((c) => {
        const propios = creditos.filter((h) => h.clienteId === c.clienteId);
        return { c, propios };
      }).filter(({ c, propios }) => buscado === "" || [c.nombreCompleto, c.municipio, c.clienteId, ...propios.map((h) => h.creditoId)]
        .some((t) => normalizar(t).includes(buscado)))
        .sort((a, b) => a.c.nombreCompleto.localeCompare(b.c.nombreCompleto, "es"));
      return salida("listarClientes", { fechaCorte: e.fechaCorte, clientes: clientes.map(({ c, propios }) => ({ clienteId: c.clienteId,
        nombreCompleto: c.nombreCompleto, municipio: c.municipio, creditos: propios.map((h) => resumen(proyectarCredito(h, corte))) })) });
    } },

    consultarFichaCredito: { async ejecutar(valor) {
      const e = entrada("consultarFichaCredito", valor);
      const h = await creditoExistente(e.creditoId, e.fechaCorte);
      const cliente = (await deps.lecturas.clientes()).find((c) => c.clienteId === h.clienteId);
      if (cliente === undefined) throw new Error("Integridad referencial rota.");
      return salida("consultarFichaCredito", { resumen: resumen(proyectarCredito(h, fecha(e.fechaCorte))), clienteId: h.clienteId,
        nombreCliente: cliente.nombreCompleto, municipio: cliente.municipio, asesorId: h.asesorId, capitalOriginal: dinero(gtq(h.capital)),
        tasaNominalAnual: tasaDesdeBps(h.tnaBps), plazoMeses: h.plazoMeses, fechaSolicitud: h.fechaSolicitud,
        fechaDesembolso: h.fechaDesembolso !== null && h.fechaDesembolso <= e.fechaCorte ? h.fechaDesembolso : null,
        politicaId: h.politicaId, reestructurado: h.reestructurado,
        historial: h.transiciones.filter((t) => t.fecha <= e.fechaCorte).map((t) => ({ estadoAnterior: t.estadoAnterior,
          estadoNuevo: t.estadoNuevo, fecha: t.fecha, usuarioProceso: t.sujetoId, motivo: t.motivo })) });
    } },

    listarPagos: { async ejecutar(valor) {
      const e = entrada("listarPagos", valor);
      const p = proyectarCredito(await creditoExistente(e.creditoId, e.fechaCorte), fecha(e.fechaCorte));
      return salida("listarPagos", { creditoId: e.creditoId, fechaCorte: e.fechaCorte, pagos: p.pagos.map((pg) => ({
        pagoId: pg.pagoId, numeroCuota: pg.numeroCuota, fechaPago: pg.fecha, importe: dinero(gtq(pg.importe)),
        claveIdempotencia: pg.clave, canal: pg.canal, usuarioProceso: pg.usuarioProceso, propuestaId: pg.propuestaId,
        aplicacion: aplicacionJson(pg.aplicacion) })) });
    } },

    listarSolicitudes: { async ejecutar(valor) {
      const e = entrada("listarSolicitudes", valor);
      const clientes = new Map((await deps.lecturas.clientes()).map((c) => [c.clienteId, c.nombreCompleto]));
      const pendientes = (await deps.lecturas.creditos()).filter((h) => h.fechaSolicitud <= e.fechaCorte &&
        (h.estado === EstadoCredito.SOLICITADO || h.estado === EstadoCredito.APROBADO));
      return salida("listarSolicitudes", { fechaCorte: e.fechaCorte, solicitudes: pendientes.map((h) => ({ creditoId: h.creditoId,
        clienteId: h.clienteId, nombreCliente: clientes.get(h.clienteId) ?? h.clienteId, asesorId: h.asesorId,
        monto: dinero(gtq(h.capital)), plazoMeses: h.plazoMeses, tasaNominalAnual: tasaDesdeBps(h.tnaBps),
        fechaSolicitud: h.fechaSolicitud, estado: h.estado, versionCredito: h.version })) });
    } },

    listarAsesores: { async ejecutar(valor) {
      entrada("listarAsesores", valor);
      return salida("listarAsesores", { asesores: await deps.lecturas.asesores() });
    } },
  };
  return casos;
}
