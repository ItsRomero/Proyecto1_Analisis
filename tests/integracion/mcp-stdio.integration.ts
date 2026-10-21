import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { Pool } from "pg";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { conectarMcpSesion } from "../../src/api/conector-mcp.js";
import { herramientasFinales } from "../../src/contratos/rutas-proyecto-final.js";
import { crearCasosPg } from "../../src/persistencia/casos-pg.js";
import { leerPaquete } from "../../src/persistencia/paquete-canonico.js";
import { cargarPostgres, reiniciar } from "../../src/persistencia/postgres.js";

// Fase 4: el servidor MCP real como proceso hijo stdio (ADR-007), lanzado por el conector del backend.
const url = process.env["TEST_DATABASE_URL"];
if (!url || !new URL(url).pathname.endsWith("_test")) throw new Error("TEST_DATABASE_URL debe apuntar a una base exclusiva terminada en _test.");
const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 5000, max: 2 });
let cliente: Client;

beforeAll(async () => {
  // El proceso hijo ejecuta el código compilado, igual que en la demostración.
  execSync("npm run build:backend", { stdio: "ignore" });
  await reiniciar(pool);
  await cargarPostgres(pool, await leerPaquete(resolve("datos/datos-proyecto-final")));
  cliente = await conectarMcpSesion({ sesionId: "SES-STDIO-PRUEBA", perfil: "GERENCIA" },
    { fechaCorteDefecto: "2026-10-31", databaseUrl: url, script: resolve("dist/src/mcp/principal.js") });
}, 180000);
afterAll(async () => { await cliente?.close(); await pool.end(); });

describe("fase 4: MCP por stdio", () => {
  it("negocia el protocolo por stdout limpio y publica las ocho herramientas", async () => {
    expect(cliente.getServerVersion()?.name).toBe("credito-vecino-nucleo");
    const { tools } = await cliente.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(Object.keys(herramientasFinales).sort());
  });

  it("consulta el núcleo en la base de prueba igual que el caso de uso en proceso", async () => {
    const r = (await cliente.callTool({ name: "consultar_credito", arguments: { creditoId: "CV-2026-0030" } })) as { structuredContent: unknown };
    const esperado = await crearCasosPg(pool, 30).consultarCredito.ejecutar({ creditoId: "CV-2026-0030", fechaCorte: "2026-10-31" },
      { sujetoId: "PRUEBA", sesionId: "SES-STDIO-PRUEBA", perfil: "GERENCIA", canal: "MCP", traceId: "T" });
    expect(r.structuredContent).toEqual(esperado);
  });
});
