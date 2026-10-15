import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import { Pool } from "pg";
import { resolve, join } from "node:path";
import { mkdtemp, cp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { leerPaquete, type PaqueteCanonico } from "../../src/persistencia/paquete-canonico.js";
import { cargarPostgres, migrar, reiniciar } from "../../src/persistencia/postgres.js";
import { RepositorioClientesPg } from "../../src/persistencia/clientes-pg.js";

// Este comando falla, sin skip, si falta la base. Nunca reinicia la base de demo.
const url = process.env["TEST_DATABASE_URL"];
if (!url || !new URL(url).pathname.endsWith("_test")) throw new Error("TEST_DATABASE_URL debe apuntar a una base exclusiva terminada en _test. Fase 2 NO aprobada.");
const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 5000, max: 4 });
let paquete: PaqueteCanonico;
beforeAll(async () => { paquete = await leerPaquete(resolve("datos/datos-proyecto-final")); });
beforeEach(async () => { await reiniciar(pool); });
afterAll(async () => { await pool.end(); });
async function conteos() {
  return (await pool.query(`SELECT (SELECT count(*)::int FROM cv.clientes) AS clientes,
    (SELECT count(*)::int FROM cv.creditos) AS creditos, (SELECT count(*)::int FROM cv.asesores) AS asesores,
    (SELECT count(*)::int FROM cv.pagos) AS pagos, (SELECT count(*)::int FROM cv.bitacora_eventos) AS eventos,
    (SELECT count(*)::int FROM cv.cargas_canonicas) AS cargas`)).rows[0];
}
describe("PostgreSQL + pgvector: carga transaccional real", () => {
  it("migra dos veces, carga exacta, conserva prelación, bajas y bitácora", async () => {
    await migrar(pool);
    const r = await cargarPostgres(pool, paquete);
    expect(r.repetida).toBe(false);
    expect(await conteos()).toEqual({ clientes: 60, creditos: 75, asesores: 6, pagos: 226, eventos: 363, cargas: 1 });
    const descuadres = await pool.query(`SELECT p.id FROM cv.pagos p JOIN cv.aplicaciones_pago a ON a.pago_id=p.id
      GROUP BY p.id HAVING sum(a.centavos) <> p.importe_centavos`);
    expect(descuadres.rows).toHaveLength(0);
    const bajas = await pool.query("SELECT credito_id,fecha::text FROM cv.bajas_incobrables ORDER BY credito_id");
    expect(bajas.rows).toEqual([{ credito_id: "CV-2026-0015", fecha: "2026-10-22" }, { credito_id: "CV-2026-0022", fecha: "2026-10-27" }]);
    const reestructurados = await pool.query("SELECT id FROM cv.creditos WHERE estado='REESTRUCTURADO'");
    expect(reestructurados.rowCount).toBe(3);
    const vector = await pool.query("SELECT extversion FROM pg_extension WHERE extname='vector'");
    expect(vector.rowCount).toBe(1);
  });
  it("segunda carga conserva altas y versiones operativas posteriores", async () => {
    await cargarPostgres(pool, paquete);
    const clientes = new RepositorioClientesPg(pool);
    await clientes.crear({ clienteId: "CL-PRUEBA-POSTERIOR", nombreCompleto: "Cliente de prueba posterior",
      identificadorLegal: { tipo: "FICTICIO", valor: "PRUEBA-POSTERIOR" }, municipio: "Guatemala", fechaAlta: "2026-10-31" });
    // Cambio concurrente simulado exclusivamente como fixture de prueba, nunca comando operativo.
    await pool.query("UPDATE cv.creditos SET version=7 WHERE id='CV-2026-0043'");
    const antes = await pool.query("SELECT row_to_json(p) AS pago FROM cv.pagos p ORDER BY id");
    const r = await cargarPostgres(pool, paquete);
    expect(r.repetida).toBe(true);
    expect(await clientes.existe("CL-PRUEBA-POSTERIOR")).toBe(true);
    expect((await conteos()).clientes).toBe(61);
    expect((await pool.query("SELECT version::text FROM cv.creditos WHERE id='CV-2026-0043'")).rows[0].version).toBe("7");
    expect((await pool.query("SELECT row_to_json(p) AS pago FROM cv.pagos p ORDER BY id")).rows).toEqual(antes.rows);
  });
  it("rollback elimina todo ante fallo a mitad de persistencia", async () => {
    await pool.query(`CREATE FUNCTION cv.fallar_prueba() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
      RAISE EXCEPTION 'FALLO_CONTROLADO_PERSISTENCIA'; END; $$;
      CREATE TRIGGER fallo_pago BEFORE INSERT ON cv.pagos FOR EACH ROW EXECUTE FUNCTION cv.fallar_prueba()`);
    await expect(cargarPostgres(pool, paquete)).rejects.toThrow("FALLO_CONTROLADO_PERSISTENCIA");
    expect(await conteos()).toEqual({ clientes: 0, creditos: 0, asesores: 0, pagos: 0, eventos: 0, cargas: 0 });
    await pool.query("DROP TRIGGER fallo_pago ON cv.pagos; DROP FUNCTION cv.fallar_prueba()");
    expect((await cargarPostgres(pool, paquete)).pagosAplicados).toBe(226);
  });
  it("dos cargas concurrentes producen un solo efecto", async () => {
    const resultados = await Promise.all([cargarPostgres(pool, paquete), cargarPostgres(pool, paquete)]);
    expect(resultados.map((r) => r.repetida).sort()).toEqual([false, true]);
    expect((await conteos()).pagos).toBe(226);
    expect((await conteos()).eventos).toBe(363);
  });
  it("protege bitácora de UPDATE y DELETE y reinicia solo el esquema dedicado", async () => {
    await cargarPostgres(pool, paquete);
    await expect(pool.query("DELETE FROM cv.bitacora_eventos WHERE seq=1")).rejects.toThrow("BITACORA_INMUTABLE");
    await expect(pool.query("UPDATE cv.bitacora_eventos SET estado='DUPLICADO' WHERE seq=1")).rejects.toThrow("BITACORA_INMUTABLE");
    await reiniciar(pool);
    expect(await conteos()).toEqual({ clientes: 0, creditos: 0, asesores: 0, pagos: 0, eventos: 0, cargas: 0 });
    expect((await cargarPostgres(pool, paquete)).pagosAplicados).toBe(226);
  });
  it("referencias inválidas o monto no exacto no dejan carga parcial", async () => {
    const eventos = paquete.eventos.map((e) => e.tipo === "DESEMBOLSO" ? { ...e, id_cliente: "NO-EXISTE" } : e);
    await expect(cargarPostgres(pool, { ...paquete, eventos })).rejects.toThrow("Cliente o asesor inexistente");
    expect((await conteos()).clientes).toBe(0);
  });
  it("huella inválida rechaza el insumo sin alterar la base", async () => {
    const temporal = await mkdtemp(join(tmpdir(), "cv-huella-db-"));
    try {
      await cp(resolve("datos/datos-proyecto-final"), temporal, { recursive: true });
      await writeFile(join(temporal, "eventos.jsonl"), "{}\n");
      await expect(leerPaquete(temporal).then((p) => cargarPostgres(pool, p))).rejects.toThrow("HUELLA_INVALIDA");
      expect(await conteos()).toEqual({ clientes: 0, creditos: 0, asesores: 0, pagos: 0, eventos: 0, cargas: 0 });
    } finally { await rm(temporal, { recursive: true, force: true }); }
  });
});
