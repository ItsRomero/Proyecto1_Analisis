import type { Pool, PoolClient } from "pg";
import type { EntradaFinal } from "../contratos/proyecto-final.js";
import { politicasPaqueteSchema } from "../contratos/proyecto-final.js";
import type { PoliticasPaquete } from "../contratos/paquete-canonico.js";
import type { EstadoCredito } from "../dominio/credito-estado.js";
import type {
  CierreHecho, ClienteHecho, ConceptoAplicado, CreditoHecho, CuotaHecho, EventoAuditoria, LecturasFinal,
  PagoHecho, PropuestaHecho, TransaccionFinal, TransicionHecho, UnidadTrabajoFinal,
} from "../aplicacion/puertos-final.js";
import { transaccion } from "./postgres.js";

/*
 * Adaptador de hechos. Fechas como texto civil (::text), dinero BIGINT como texto -> BigInt.
 * No hay sumas, mora, saldos ni cierres calculados en SQL: el núcleo los produce en aplicación.
 */
type Consultor = Pick<Pool | PoolClient, "query">;
interface FilaCredito {
  id: string; cliente_id: string; asesor_id: string; politica_id: string | null; estado: EstadoCredito;
  capital: string; tna_bps: number; plazo_meses: number; fecha_solicitud: string; fecha_desembolso: string | null;
  reestructurado: boolean; version: string;
}
const COLUMNAS_CREDITO = `id, cliente_id, asesor_id, politica_id, estado, capital_centavos::text AS capital, tna_bps, plazo_meses,
  fecha_solicitud::text AS fecha_solicitud, fecha_desembolso::text AS fecha_desembolso, reestructurado, version::text AS version`;

async function cargarHechos(q: Consultor, filas: readonly FilaCredito[]): Promise<CreditoHecho[]> {
  if (filas.length === 0) return [];
  const ids = filas.map((f) => f.id);
  // Secuencial: un PoolClient de transacción no admite consultas concurrentes.
  const cuotas = await q.query<{ credito_id: string; numero: number; vencimiento: string; capital: string; interes: string; importe: string; saldo: string }>(
      `SELECT credito_id, numero, vencimiento::text AS vencimiento, capital_centavos::text AS capital, interes_centavos::text AS interes,
        importe_centavos::text AS importe, saldo_posterior_centavos::text AS saldo FROM cv.cuotas WHERE credito_id = ANY($1) ORDER BY credito_id, numero`, [ids]);
  const pagos = await q.query<{ id: string; credito_id: string; numero_cuota: number; fecha: string; importe: string; clave_idempotencia: string;
      huella: string; usuario_proceso: string; canal: string; propuesta_id: string | null }>(
      `SELECT id, credito_id, numero_cuota, fecha::text AS fecha, importe_centavos::text AS importe, clave_idempotencia, huella,
        usuario_proceso, canal, propuesta_id FROM cv.pagos WHERE credito_id = ANY($1) ORDER BY credito_id, numero_cuota`, [ids]);
  const aplicaciones = await q.query<{ pago_id: string; concepto: ConceptoAplicado; centavos: string }>(
      `SELECT a.pago_id, a.concepto, a.centavos::text AS centavos FROM cv.aplicaciones_pago a JOIN cv.pagos p ON p.id = a.pago_id
        WHERE p.credito_id = ANY($1)`, [ids]);
  const transiciones = await q.query<{ credito_id: string; estado_anterior: EstadoCredito; estado_nuevo: EstadoCredito; fecha: string; sujeto_id: string; motivo: string }>(
      `SELECT credito_id, estado_anterior, estado_nuevo, fecha::text AS fecha, sujeto_id, motivo FROM cv.transiciones_credito
        WHERE credito_id = ANY($1) ORDER BY credito_id, (substring(id from '([0-9]+)$'))::integer`, [ids]);
  const bajas = await q.query<{ credito_id: string; fecha: string; saldo: string }>(
      `SELECT credito_id, fecha::text AS fecha, saldo_centavos::text AS saldo FROM cv.bajas_incobrables WHERE credito_id = ANY($1)`, [ids]);
  const porPago = new Map<string, Record<ConceptoAplicado, bigint>>();
  for (const a of aplicaciones.rows) {
    const r = porPago.get(a.pago_id) ?? { GASTOS: 0n, MORATORIO: 0n, CORRIENTE: 0n, CAPITAL: 0n, EXCEDENTE: 0n };
    r[a.concepto] = BigInt(a.centavos);
    porPago.set(a.pago_id, r);
  }
  return filas.map((f): CreditoHecho => {
    const baja = bajas.rows.find((b) => b.credito_id === f.id);
    return {
      creditoId: f.id, clienteId: f.cliente_id, asesorId: f.asesor_id, politicaId: f.politica_id, estado: f.estado,
      capital: BigInt(f.capital), tnaBps: f.tna_bps, plazoMeses: f.plazo_meses, fechaSolicitud: f.fecha_solicitud,
      fechaDesembolso: f.fecha_desembolso, reestructurado: f.reestructurado, version: Number(f.version),
      cuotas: cuotas.rows.filter((c) => c.credito_id === f.id).map((c): CuotaHecho => ({ numero: c.numero, vencimiento: c.vencimiento,
        capital: BigInt(c.capital), interes: BigInt(c.interes), importe: BigInt(c.importe), saldoPosterior: BigInt(c.saldo) })),
      pagos: pagos.rows.filter((p) => p.credito_id === f.id).map((p): PagoHecho => {
        const aplicacion = porPago.get(p.id);
        if (aplicacion === undefined) throw new Error("Pago sin aplicación por concepto.");
        return { pagoId: p.id, numeroCuota: p.numero_cuota, fecha: p.fecha, importe: BigInt(p.importe), clave: p.clave_idempotencia,
          huella: p.huella, usuarioProceso: p.usuario_proceso, canal: p.canal, propuestaId: p.propuesta_id, aplicacion };
      }),
      transiciones: transiciones.rows.filter((t) => t.credito_id === f.id).map((t): TransicionHecho => ({ estadoAnterior: t.estado_anterior,
        estadoNuevo: t.estado_nuevo, fecha: t.fecha, sujetoId: t.sujeto_id, motivo: t.motivo })),
      baja: baja ? { fecha: baja.fecha, saldo: BigInt(baja.saldo) } : null,
    };
  });
}

async function cierreGuardado(q: Consultor, tipo: string, inicio: string, corte: string, bloquear = false): Promise<CierreHecho | null> {
  const r = await q.query<{ snapshot_nucleo: CierreHecho }>(`SELECT snapshot_nucleo FROM cv.cierres
    WHERE tipo=$1 AND inicio_periodo=$2 AND fecha_corte=$3${bloquear ? " FOR UPDATE" : ""}`, [tipo, inicio, corte]);
  return r.rows[0]?.snapshot_nucleo ?? null;
}

export class LecturasFinalPg implements LecturasFinal {
  public constructor(private readonly pool: Pool) {}
  public async configuracionPoliticas(): Promise<PoliticasPaquete> {
    const r = await this.pool.query<{ configuracion: unknown }>(
      "SELECT parametros->'configuracion' AS configuracion FROM cv.politicas_versionadas ORDER BY id LIMIT 1");
    if (r.rows[0] === undefined) throw new Error("Carga canónica pendiente: no hay políticas versionadas.");
    return politicasPaqueteSchema.parse(r.rows[0].configuracion);
  }
  public async credito(creditoId: string) {
    const r = await this.pool.query<FilaCredito>(`SELECT ${COLUMNAS_CREDITO} FROM cv.creditos WHERE id=$1`, [creditoId]);
    return (await cargarHechos(this.pool, r.rows))[0] ?? null;
  }
  public async creditos() {
    return cargarHechos(this.pool, (await this.pool.query<FilaCredito>(`SELECT ${COLUMNAS_CREDITO} FROM cv.creditos ORDER BY id`)).rows);
  }
  public async clientes(): Promise<readonly ClienteHecho[]> {
    const r = await this.pool.query<{ id: string; nombre_completo: string; municipio: string; fecha_alta: string }>(
      "SELECT id, nombre_completo, municipio, fecha_alta::text AS fecha_alta FROM cv.clientes ORDER BY id");
    return r.rows.map((c) => ({ clienteId: c.id, nombreCompleto: c.nombre_completo, municipio: c.municipio, fechaAlta: c.fecha_alta }));
  }
  public async asesores() {
    const r = await this.pool.query<{ id: string; nombre: string }>("SELECT id, nombre FROM cv.asesores ORDER BY id");
    return r.rows.map((a) => ({ asesorId: a.id, nombre: a.nombre }));
  }
  public cierre(tipo: "DIARIO" | "MENSUAL", inicio: string, corte: string) { return cierreGuardado(this.pool, tipo, inicio, corte); }
}

class TransaccionFinalPg implements TransaccionFinal {
  public constructor(private readonly c: PoolClient) {}
  public async bloquearCredito(creditoId: string) {
    const r = await this.c.query<FilaCredito>(`SELECT ${COLUMNAS_CREDITO} FROM cv.creditos WHERE id=$1 FOR UPDATE`, [creditoId]);
    return (await cargarHechos(this.c, r.rows))[0] ?? null;
  }
  public async existeCliente(clienteId: string) {
    return (await this.c.query("SELECT 1 FROM cv.clientes WHERE id=$1", [clienteId])).rowCount === 1;
  }
  public async identificacionRegistrada(tipo: string, valor: string) {
    return (await this.c.query("SELECT 1 FROM cv.clientes WHERE tipo_identificacion=$1 AND identificacion=$2", [tipo, valor])).rowCount === 1;
  }
  public async existeAsesor(asesorId: string) {
    return (await this.c.query("SELECT 1 FROM cv.asesores WHERE id=$1", [asesorId])).rowCount === 1;
  }
  public async insertarCliente(cliente: EntradaFinal<"altaCliente">) {
    await this.c.query("INSERT INTO cv.clientes VALUES ($1,$2,$3,$4,$5,$6,$7)", [cliente.clienteId, cliente.nombreCompleto,
      cliente.identificadorLegal.tipo, cliente.identificadorLegal.valor, cliente.municipio, cliente.telefono ?? null, cliente.fechaAlta]);
  }
  public async insertarCredito(h: Parameters<TransaccionFinal["insertarCredito"]>[0]) {
    await this.c.query("INSERT INTO cv.creditos VALUES ($1,$2,$3,$4,$5,$6,'GTQ',$7,$8,$9,$10,$11,$12)", [h.creditoId, h.clienteId,
      h.asesorId, h.politicaId, h.estado, h.capital.toString(), h.tnaBps, h.plazoMeses, h.fechaSolicitud, h.fechaDesembolso,
      h.reestructurado, h.version]);
  }
  public async actualizarCredito(creditoId: string, cambios: Parameters<TransaccionFinal["actualizarCredito"]>[1]) {
    await this.c.query(`UPDATE cv.creditos SET estado=$2, version=$3, politica_id=COALESCE($4, politica_id),
      fecha_desembolso=COALESCE($5::date, fecha_desembolso) WHERE id=$1`,
      [creditoId, cambios.estado, cambios.version, cambios.politicaId ?? null, cambios.fechaDesembolso ?? null]);
  }
  public async insertarTransiciones(creditoId: string, transiciones: readonly TransicionHecho[], evidencia: Readonly<Record<string, string>>) {
    const previas = (await this.c.query<{ n: number }>("SELECT count(*)::integer AS n FROM cv.transiciones_credito WHERE credito_id=$1", [creditoId])).rows[0]?.n ?? 0;
    for (const [i, t] of transiciones.entries()) await this.c.query("INSERT INTO cv.transiciones_credito VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [`${creditoId}-${previas + i}`, creditoId, t.estadoAnterior, t.estadoNuevo, t.fecha, t.sujetoId, t.motivo, JSON.stringify(evidencia)]);
  }
  public async insertarCuotas(creditoId: string, cuotas: readonly CuotaHecho[]) {
    for (const q of cuotas) await this.c.query("INSERT INTO cv.cuotas VALUES ($1,$2,$3,$4,$5,$6,$7)", [creditoId, q.numero, q.vencimiento,
      q.capital.toString(), q.interes.toString(), q.importe.toString(), q.saldoPosterior.toString()]);
  }
  public async guardarPropuesta(p: PropuestaHecho) {
    const { sujetoProponente, huella, canalProponente, ...publica } = p;
    await this.c.query("INSERT INTO cv.propuestas_pago VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)", [p.propuestaId, p.creditoId,
      p.numeroCuota, sujetoProponente, p.sesionId, p.fechaCorte, p.claveIdempotencia, huella, p.versionCredito,
      BigInt(p.monto.importe.replace(".", "")).toString(), p.estado, JSON.stringify(publica), p.estadoPrevisto, canalProponente]);
  }
  public async obtenerPropuesta(propuestaId: string): Promise<PropuestaHecho | null> {
    const r = await this.c.query<{ desglose_snapshot: Omit<PropuestaHecho, "sujetoProponente" | "huella" | "canalProponente">;
      estado: PropuestaHecho["estado"]; sujeto_proponente: string; huella: string; canal_proponente: PropuestaHecho["canalProponente"] }>(
      "SELECT desglose_snapshot, estado, sujeto_proponente, huella, canal_proponente FROM cv.propuestas_pago WHERE id=$1 FOR UPDATE", [propuestaId]);
    const f = r.rows[0];
    return f ? { ...f.desglose_snapshot, estado: f.estado, sujetoProponente: f.sujeto_proponente, huella: f.huella,
      canalProponente: f.canal_proponente } : null;
  }
  public async actualizarEstadoPropuesta(propuestaId: string, estado: PropuestaHecho["estado"]) {
    await this.c.query("UPDATE cv.propuestas_pago SET estado=$2 WHERE id=$1", [propuestaId, estado]);
  }
  public async insertarPago(creditoId: string, p: PagoHecho, extras: { readonly aprobacionId: string; readonly conservarClaveHasta: string }) {
    await this.c.query(`INSERT INTO cv.pagos (id,credito_id,numero_cuota,clave_idempotencia,huella,fecha,importe_centavos,usuario_proceso,canal,propuesta_id,aprobacion_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [p.pagoId, creditoId, p.numeroCuota, p.clave, p.huella, p.fecha, p.importe.toString(),
      p.usuarioProceso, p.canal, p.propuestaId, extras.aprobacionId]);
    for (const [concepto, centavos] of Object.entries(p.aplicacion)) await this.c.query("INSERT INTO cv.aplicaciones_pago VALUES ($1,$2,$3)",
      [p.pagoId, concepto, centavos.toString()]);
    await this.c.query("INSERT INTO cv.claves_idempotencia VALUES ($1,$2,$3,$4,$5,$6)", [creditoId, p.clave, p.huella, p.pagoId,
      JSON.stringify({ pagoId: p.pagoId, numeroCuota: p.numeroCuota, fecha: p.fecha, importeCentavos: p.importe.toString() }), extras.conservarClaveHasta]);
  }
  public async insertarGasto(creditoId: string, numeroCuota: number, fecha: string, importe: bigint) {
    await this.c.query("INSERT INTO cv.gastos_gestion VALUES ($1,$2,'GESTION_COBRO',$3,$4) ON CONFLICT DO NOTHING",
      [creditoId, numeroCuota, fecha, importe.toString()]);
  }
  public async registrarAuditoria(e: EventoAuditoria) {
    await this.c.query("INSERT INTO cv.auditoria_aprobaciones VALUES ($1,$2,$3,$4,$5,$6,$7,now(),$8,$9,$10,$11,$12,$13)", [e.id, e.propuestaId,
      e.creditoId, e.sujetoId, e.sesionId, e.tipo, e.fechaOperacion, e.resultado, e.versionCredito, e.traceId,
      e.proponente ?? null, e.canalProponente ?? null, e.claveIdempotencia ?? null]);
  }
  public obtenerCierre(tipo: "DIARIO" | "MENSUAL", inicio: string, corte: string) { return cierreGuardado(this.c, tipo, inicio, corte, true); }
  public async insertarCierre(cierre: CierreHecho, versionCartera: number, generadoPor: string) {
    if (cierre.cierreId === null) throw new Error("Un cierre generado requiere identificador.");
    await this.c.query("INSERT INTO cv.cierres VALUES ($1,$2,$3,$4,$5,$6,$7)", [cierre.cierreId, cierre.tipo, cierre.inicioPeriodo,
      cierre.fechaCorte, versionCartera, JSON.stringify(cierre), generadoPor]);
  }
}

/** Misma transacción, bloqueo consultivo y search_path del cargador (ADR-018). */
export class UnidadTrabajoFinalPg implements UnidadTrabajoFinal {
  public constructor(private readonly pool: Pool) {}
  public ejecutar<T>(accion: (tx: TransaccionFinal) => Promise<T>): Promise<T> {
    return transaccion(this.pool, (cliente) => accion(new TransaccionFinalPg(cliente)));
  }
}
