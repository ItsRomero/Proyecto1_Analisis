import { afterAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";
import { crearCasosPg } from "../../src/persistencia/casos-pg.js";
import { leerPaquete } from "../../src/persistencia/paquete-canonico.js";
import { cargarPostgres, reiniciar } from "../../src/persistencia/postgres.js";
import { consultarOraculo, ejecutarOp1aOp3 } from "../apoyo/guion-op.js";

// Fase 7: el oráculo congelado se reproduce sobre PostgreSQL real en ambos estados de partida. Nunca la base de demo.
const url = process.env["TEST_DATABASE_URL"];
if (!url || !new URL(url).pathname.endsWith("_test")) throw new Error("TEST_DATABASE_URL debe apuntar a una base exclusiva terminada en _test.");
const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 5000, max: 4 });
const oraculo = JSON.parse(readFileSync("tests/evals/oraculo-congelado.json", "utf8")) as {
  estados: Record<"POST_CARGA" | "POST_OP1_OP3", { resultados: Record<string, unknown> }> };
afterAll(async () => { await pool.end(); });

describe("fase 7: oráculo congelado sobre PostgreSQL", () => {
  it("POST_CARGA y POST_OP1_OP3 se reproducen exactamente con la carga oficial y los casos de uso", async () => {
    await reiniciar(pool);
    await cargarPostgres(pool, await leerPaquete(resolve("datos/datos-proyecto-final")));
    const casos = crearCasosPg(pool, 30);
    expect(await consultarOraculo(casos)).toEqual(oraculo.estados.POST_CARGA.resultados);
    await ejecutarOp1aOp3(casos);
    expect(await consultarOraculo(casos)).toEqual(oraculo.estados.POST_OP1_OP3.resultados);
  }, 120000);
});
