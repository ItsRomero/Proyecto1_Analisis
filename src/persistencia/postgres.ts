import { Pool, type PoolClient } from "pg";
import { readFile } from "node:fs/promises";
import { ErrorCarga, sha256, type PaqueteCanonico } from "./paquete-canonico.js";
import { estadoCanonico, reproducirCanonico } from "./reproducir-canonico.js";

export function crearPool(url = process.env["DATABASE_URL"]): Pool {
  if (!url) throw new ErrorCarga("DATABASE_URL_FALTANTE", "Configure una base PostgreSQL con pgvector.");
  return new Pool({ connectionString: url, connectionTimeoutMillis: 5000, max: 5 });
}

/** Un mismo cliente para BEGIN/COMMIT/ROLLBACK y todo el trabajo. */
export async function transaccion<T>(pool: Pool, accion: (cliente: PoolClient) => Promise<T>): Promise<T> {
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");
    await cliente.query("SET LOCAL search_path TO cv, public");
    await cliente.query("SELECT pg_advisory_xact_lock(37002602)");
    const resultado = await accion(cliente);
    await cliente.query("COMMIT");
    return resultado;
  } catch (error) { await cliente.query("ROLLBACK"); throw error; }
  finally { cliente.release(); }
}

/** Migraciones versionadas por SHA-256; una aplicada no puede cambiar (ADR-018). */
const MIGRACIONES = [{ version: 1, archivo: "001-inicial.sql" }, { version: 2, archivo: "002-auditoria-propuestas.sql" }] as const;
const leerMigracion = (archivo: string) =>
  readFile(new URL(`../../../src/persistencia/migraciones/${archivo}`, import.meta.url), "utf8").catch(async () =>
    readFile(new URL(`./migraciones/${archivo}`, import.meta.url), "utf8"));

export async function migrar(pool: Pool): Promise<void> {
  const ddls = await Promise.all(MIGRACIONES.map(async (m) => ({ ...m, ddl: await leerMigracion(m.archivo) })));
  await transaccion(pool, async (c) => {
    await c.query("CREATE SCHEMA IF NOT EXISTS cv");
    await c.query("CREATE TABLE IF NOT EXISTS cv.migraciones (version integer PRIMARY KEY, sha256 text NOT NULL)");
    for (const m of ddls) {
      const anterior = await c.query<{ sha256: string }>("SELECT sha256 FROM cv.migraciones WHERE version=$1", [m.version]);
      if (anterior.rows[0]) {
        if (anterior.rows[0].sha256 !== sha256(m.ddl))
          throw new ErrorCarga("MIGRACION_MODIFICADA", `La migración ${String(m.version).padStart(3, "0")} cambió después de aplicarse.`);
        continue;
      }
      await c.query(m.ddl);
      await c.query("INSERT INTO cv.migraciones VALUES ($1,$2)", [m.version, sha256(m.ddl)]);
    }
  });
}

/** Reinicia únicamente el esquema dedicado cv; nunca bases ni esquemas ajenos. */
export async function reiniciar(pool: Pool): Promise<void> {
  await transaccion(pool, async (c) => { await c.query("DROP SCHEMA IF EXISTS cv CASCADE"); });
  await migrar(pool);
}

export async function cargarPostgres(pool: Pool, paquete: PaqueteCanonico, fechaCorte = "2026-10-31") {
  const r = reproducirCanonico(paquete, fechaCorte);
  return transaccion(pool, async (c) => {
    const anterior = await c.query<{ huella: string; huella_politicas: string; huella_asesores: string; fecha: string }>(
      "SELECT huella, huella_politicas, huella_asesores, fecha_corte::text AS fecha FROM cargas_canonicas");
    if (anterior.rowCount) {
      const carga = anterior.rows[0]!;
      if (carga.huella !== paquete.huella || carga.huella_politicas !== paquete.huellaPoliticas || carga.huella_asesores !== paquete.huellaAsesores || carga.fecha !== fechaCorte)
        throw new ErrorCarga("PAQUETE_DIFERENTE", "Ya existe otra carga; no se reemplazan datos operativos.");
      return { repetida: true, huella: paquete.huella, ...r.conteos, divergencias: r.divergencias, rangoReal: r.rangoReal };
    }
    const ocupada = await c.query<{ existe: boolean }>("SELECT EXISTS(SELECT 1 FROM clientes UNION ALL SELECT 1 FROM creditos UNION ALL SELECT 1 FROM bitacora_eventos) AS existe");
    if (ocupada.rows[0]?.existe) throw new ErrorCarga("BASE_NO_VACIA", "Primera carga requiere base vacía; no se sobrescriben registros.");
    for (const a of paquete.asesores) await c.query("INSERT INTO asesores VALUES ($1,$2)", [a.id, a.nombre]);
    for (const [id, p] of Object.entries(paquete.politicas.politicas_mora)) {
      const vigencia = p.vigencia_otorgamiento;
      await c.query("INSERT INTO politicas_versionadas VALUES ($1,$2,$3,$4,$5,'politicas.json')",
        [id, "desde" in vigencia ? vigencia.desde : null, "hasta" in vigencia ? vigencia.hasta : null,
          JSON.stringify({ politica: p, configuracion: paquete.politicas }), paquete.huellaPoliticas]);
    }
    for (const cliente of r.clientes.values()) await c.query("INSERT INTO clientes VALUES ($1,$2,'DPI_FICTICIO',$3,$4,$5,$6)",
      [cliente.id_cliente, cliente.nombre_completo, cliente.dpi, cliente.municipio, cliente.telefono, cliente.fecha_alta]);
    for (const cr of r.creditos.values()) {
      const e = cr.origen;
      await c.query(`INSERT INTO creditos VALUES ($1,$2,$3,$4,$5,$6,'GTQ',$7,$8,$9,$9,$10,0)`,
        [e.id_credito, e.id_cliente, e.id_asesor, cr.politicaId, estadoCanonico(cr), String(e.capital_centavos), e.tna_bps, e.plazo_meses, e.fecha, e.reestructurado]);
      for (const fila of cr.plan.cuotas) {
        const q = fila.cuota;
        await c.query("INSERT INTO cuotas VALUES ($1,$2,$3,$4,$5,$6,$7)", [e.id_credito, q.numero, fila.fechaVencimiento.valor,
          q.amortizacion.aUnidadesMenores().toString(), q.interes.aUnidadesMenores().toString(), q.importe.aUnidadesMenores().toString(), q.saldoPosterior.aUnidadesMenores().toString()]);
      }
      for (const [i, t] of cr.credito.historial.entries()) await c.query("INSERT INTO transiciones_credito VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
        [`${e.id_credito}-${i}`, e.id_credito, t.estadoAnterior, t.estadoNuevo, t.fecha.valor, t.usuarioProceso, t.motivo,
          JSON.stringify({ paquete: paquete.huella, seq: e.seq, origen: "CARGA_CANONICA", tipo: "IMPORTACION_DERIVADA" })]);
      if (cr.baja) await c.query("INSERT INTO bajas_incobrables VALUES ($1,$2,$3,'CARGA_CANONICA',$4,$5)",
        [e.id_credito, cr.baja.fecha, cr.baja.saldo.aUnidadesMenores().toString(),
          JSON.stringify({ adr: "ADR-009", seq: e.seq, politica: cr.politicaId, autorizacionSistema: true }), paquete.huella]);
    }
    const conceptos = { GASTOS_COMISIONES: "GASTOS", INTERES_MORATORIO: "MORATORIO", INTERES_CORRIENTE: "CORRIENTE", CAPITAL: "CAPITAL" } as const;
    for (const p of r.pagos) {
      const pago = p.pago;
      await c.query(`INSERT INTO pagos (id,credito_id,numero_cuota,clave_idempotencia,huella,fecha,importe_centavos,usuario_proceso,canal)
        VALUES ($1,$2,$3,$4,$5,$6,$7,'CARGA_CANONICA',$8)`, [pago.pagoId, pago.creditoId, p.numeroCuota,
        pago.claveIdempotencia.valor, pago.huella.valor, p.fecha, pago.aplicacion.pago.aUnidadesMenores().toString(), p.canal]);
      for (const paso of pago.aplicacion.pasos) await c.query("INSERT INTO aplicaciones_pago VALUES ($1,$2,$3)",
        [pago.pagoId, conceptos[paso.concepto], paso.aplicado.aUnidadesMenores().toString()]);
      await c.query("INSERT INTO aplicaciones_pago VALUES ($1,'EXCEDENTE',$2)", [pago.pagoId, pago.aplicacion.excedente.aUnidadesMenores().toString()]);
      await c.query("INSERT INTO claves_idempotencia VALUES ($1,$2,$3,$4,$5,($6::date + 30))", [pago.creditoId, pago.claveIdempotencia.valor,
        pago.huella.valor, pago.pagoId, JSON.stringify({ pagoId: pago.pagoId, importe: pago.aplicacion.pago.aCadena(), fecha: p.fecha }), p.fecha]);
    }
    // El log original se guarda por separado, incluidos los dos duplicados.
    for (const e of paquete.eventos) await c.query("INSERT INTO bitacora_eventos VALUES ($1,$2,$3,$4,$5,$6)",
      [paquete.huella, e.seq, e.tipo, JSON.stringify(e), sha256(paquete.lineas[e.seq - 1]!), r.duplicados.has(e.seq) ? "DUPLICADO" : "APLICADO"]);
    await c.query("INSERT INTO cargas_canonicas VALUES ($1,$2,$3,$4,$5,$6)",
      [paquete.huella, paquete.huellaPoliticas, paquete.huellaAsesores, fechaCorte, JSON.stringify(r.conteos), JSON.stringify(r.rangoReal)]);
    return { repetida: false, huella: paquete.huella, ...r.conteos, divergencias: r.divergencias, rangoReal: r.rangoReal };
  });
}
