import { addDays, formatISO, parseISO } from "date-fns";
import { FechaCivil, DiasAtraso } from "../dominio/calculadora-mora.js";
import { Credito, EstadoCredito } from "../dominio/credito-estado.js";
import { Dinero } from "../dominio/dinero.js";
import { PlazoMeses, TasaNominalAnual } from "../dominio/plan-amortizacion.js";
import { ConflictoIdempotencia, type PagoRegistrado } from "../dominio/pago-idempotente.js";
import { RegistrarPago, type RepositorioPagosIdempotentes } from "../aplicacion/registrar-pago.js";
import { simularPlanConVencimientos } from "../aplicacion/plan-con-vencimientos.js";
import { CatalogoPoliticasCanonicas, tasaDesdeBps } from "../aplicacion/politicas-canonicas.js";
import { ErrorCarga, type DesembolsoCanonico, type PaqueteCanonico } from "./paquete-canonico.js";

export interface CreditoReproducido {
  readonly origen: DesembolsoCanonico;
  readonly credito: Credito;
  readonly plan: ReturnType<typeof simularPlanConVencimientos>;
  readonly politicaId: string;
  pagadas: number;
  saldo: Dinero;
  diasAtraso: number;
  baja: { fecha: string; saldo: Dinero; seq: number } | null;
}
export interface PagoReproducido {
  readonly seq: number;
  readonly numeroCuota: number;
  readonly fecha: string;
  readonly canal: string;
  readonly pago: PagoRegistrado;
}
const sumarDias = (fecha: string, dias: number): string => formatISO(addDays(parseISO(fecha), dias), { representation: "date" });

/** Orquesta exclusivamente plan, mora, State, dinero y prelación P1/P2 reales. */
export function reproducirCanonico(paquete: PaqueteCanonico, fechaCorte: string) {
  const corte = FechaCivil.desdeCadena(fechaCorte);
  const catalogo = new CatalogoPoliticasCanonicas(paquete.politicas);
  const clientes = new Map<string, Extract<PaqueteCanonico["eventos"][number], { tipo: "CLIENTE" }>>();
  const creditos = new Map<string, CreditoReproducido>();
  const asesores = new Set(paquete.asesores.map((a) => a.id));
  const pagos: PagoReproducido[] = [];
  const duplicados = new Set<number>();
  const registrados = new Map<string, { pago: PagoRegistrado; canal: string }>();
  let seqActual = 0;
  let canalActual = "";
  const repositorio: RepositorioPagosIdempotentes = {
    ejecutarUnaVez(creditoId, clave, huella, crear) {
      const anterior = registrados.get(clave.valor);
      if (anterior) {
        if (anterior.pago.creditoId !== creditoId || !anterior.pago.huella.esIgualA(huella) || anterior.canal !== canalActual)
          throw new ConflictoIdempotencia();
        return { pago: anterior.pago, repetido: true };
      }
      const pago = crear();
      registrados.set(clave.valor, { pago, canal: canalActual });
      return { pago, repetido: false };
    },
  };
  const registrar = new RegistrarPago(repositorio, { siguiente: () => `CANONICO-${paquete.huella.slice(0, 12)}-${seqActual}` });
  const evidencia = (fecha: string, motivo: string) => ({ fecha: FechaCivil.desdeCadena(fecha), usuarioProceso: "CARGA_CANONICA", motivo });
  let fechaAnterior = "0000-01-01";
  let pagosImportados = 0;
  for (const e of paquete.eventos) {
    seqActual = e.seq;
    try {
      const fecha = e.tipo === "CLIENTE" ? e.fecha_alta : e.fecha;
      if (fecha < fechaAnterior || fecha > fechaCorte) throw new Error("Fecha fuera de orden o posterior al corte.");
      fechaAnterior = fecha;
      if (e.tipo === "CLIENTE") {
        if (clientes.has(e.id_cliente)) throw new Error("Cliente repetido.");
        clientes.set(e.id_cliente, e);
      } else if (e.tipo === "DESEMBOLSO") {
        if (!clientes.has(e.id_cliente) || !asesores.has(e.id_asesor)) throw new Error("Cliente o asesor inexistente.");
        if (creditos.has(e.id_credito)) throw new Error("Crédito repetido.");
        const plan = simularPlanConVencimientos({ capital: Dinero.desdeUnidadesMenores(BigInt(e.capital_centavos), "GTQ"),
          tasaNominalAnual: TasaNominalAnual.desdeCadena(tasaDesdeBps(e.tna_bps)), plazo: PlazoMeses.desdeNumero(e.plazo_meses),
          fechaDesembolso: FechaCivil.desdeCadena(e.fecha) });
        const credito = new Credito(e.id_credito);
        const ev = evidencia(e.fecha, `Importación histórica autorizada; paquete ${paquete.huella}; seq ${e.seq}`);
        credito.aprobar(ev, true, true);
        credito.desembolsar(ev, true, true, true);
        credito.activar(ev, true, true);
        creditos.set(e.id_credito, { origen: e, credito, plan, politicaId: catalogo.resolver(e.fecha).id,
          pagadas: 0, saldo: plan.plan.capital, diasAtraso: 0, baja: null });
      } else {
        pagosImportados++;
        canalActual = e.canal;
        const c = creditos.get(e.id_credito);
        if (!c) throw new Error("Crédito del pago inexistente.");
        // Resolver replay antes de escoger la siguiente cuota: duplicado no debe pagarla.
        const previo = registrados.get(e.clave_idempotencia);
        const fila = c.plan.cuotas[previo ? pagos.find((p) => p.pago === previo.pago)!.numeroCuota - 1 : c.pagadas];
        if (!fila) throw new Error("No hay cuota pendiente.");
        const dias = DiasAtraso.entre(fila.fechaVencimiento, FechaCivil.desdeCadena(e.fecha));
        const deuda = catalogo.deuda(fila.cuota.amortizacion, fila.cuota.interes, dias, catalogo.resolver(c.origen.fecha),
          { creditoId: e.id_credito, cuotaId: String(fila.cuota.numero), fechaVencimiento: fila.fechaVencimiento,
            fechaCorte: FechaCivil.desdeCadena(e.fecha), identificadoresRegistrados: [] });
        const importe = Dinero.desdeUnidadesMenores(BigInt(e.monto_centavos), "GTQ");
        if (!previo && !importe.esIgualA(deuda.total)) throw new ErrorCarga("MONTO_NO_EXACTO",
          `La cuota más antigua ${fila.cuota.numero} exige ${deuda.total.aCadena()} GTQ; recibido ${importe.aCadena()} GTQ.`, e.seq);
        const resultado = registrar.ejecutar({ creditoId: e.id_credito, claveIdempotencia: e.clave_idempotencia, importe,
          fechaPago: FechaCivil.desdeCadena(e.fecha), usuarioProceso: "CARGA_CANONICA", saldosExigibles: deuda,
          contextoExcedente: { capitalNoExigible: Dinero.cero("GTQ"), cuotasFuturas: Dinero.cero("GTQ") } });
        if (resultado.repetido) duplicados.add(e.seq);
        else {
          c.pagadas++;
          c.saldo = c.saldo.restar(fila.cuota.amortizacion);
          pagos.push({ seq: e.seq, numeroCuota: fila.cuota.numero, fecha: e.fecha, canal: e.canal, pago: resultado.pago });
        }
      }
    } catch (error) {
      if (error instanceof ErrorCarga) throw error;
      throw new ErrorCarga("REPRODUCCION_FALLIDA", error instanceof ConflictoIdempotencia ? "Clave repetida con contenido diferente."
        : error instanceof Error ? error.message : "Error desconocido.", e.seq);
    }
  }
  for (const c of creditos.values()) {
    const proxima = c.plan.cuotas[c.pagadas];
    const ev = evidencia(fechaCorte, `Estado derivado al corte; paquete ${paquete.huella}`);
    if (!proxima) { c.credito.liquidarConPago(ev, c.saldo, 0); continue; }
    c.diasAtraso = DiasAtraso.entre(proxima.fechaVencimiento, corte).valor;
    if (c.diasAtraso > 0) {
      const inicioMora = sumarDias(proxima.fechaVencimiento.valor, 1);
      c.credito.detectarMora(evidencia(inicioMora, "Cuota más antigua pendiente al corte de carga."), c.diasAtraso, true);
      if (c.diasAtraso > paquete.politicas.regla_incobrable_dias) {
        const fecha = sumarDias(proxima.fechaVencimiento.valor, paquete.politicas.regla_incobrable_dias + 1);
        c.credito.declararIncobrable(evidencia(fecha, `ADR-009; autorización de sistema; paquete ${paquete.huella}; seq ${c.origen.seq}; política ${c.politicaId}`),
          paquete.politicas.regla_incobrable_dias + 1, true);
        c.baja = { fecha, saldo: c.saldo, seq: c.origen.seq };
      }
    }
  }
  const conteos = { clientes: clientes.size, creditos: creditos.size, asesores: asesores.size, pagosImportados, pagosAplicados: pagos.length, eventos: paquete.eventos.length };
  if (conteos.clientes !== 60 || conteos.creditos !== 75 || conteos.asesores !== 6 || pagosImportados !== 228 || pagos.length !== 226)
    throw new ErrorCarga("CONTEO_INVALIDO", JSON.stringify(conteos));
  return { clientes, creditos, pagos, duplicados, conteos, fechaCorte, divergencias: catalogo.divergencias,
    rangoReal: { desde: paquete.eventos[0]?.tipo === "CLIENTE" ? paquete.eventos[0].fecha_alta : fechaAnterior, hasta: fechaAnterior },
    incobrables: [...creditos.values()].filter((c) => c.credito.estado === EstadoCredito.INCOBRABLE) };
}

/** R-6 es clasificación importada: no inventa atraso ni fecha de reestructuración. */
export function estadoCanonico(c: CreditoReproducido): EstadoCredito {
  return c.origen.reestructurado && c.credito.estado === EstadoCredito.VIGENTE
    ? EstadoCredito.REESTRUCTURADO : c.credito.estado;
}
