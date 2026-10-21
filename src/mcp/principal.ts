import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { fechaOperacionSchema } from "../contratos/proyecto-final.js";
import { idSchema } from "../contratos/esquemas.js";
import { crearCasosPg } from "../persistencia/casos-pg.js";
import { crearPool } from "../persistencia/postgres.js";
import { crearServidorMcp } from "./servidor-mcp.js";

/*
 * Proceso hijo stdio (ADR-007). El backend lo lanza por sesión de interfaz con CV_MCP_SESION_ID y
 * CV_MCP_PERFIL; el modelo de lenguaje no puede cambiarlos. stdout queda reservado al protocolo.
 */
const entorno = z.object({
  CV_MCP_SESION_ID: idSchema, CV_MCP_PERFIL: z.enum(["ASESOR", "GERENCIA"]).default("GERENCIA"),
  DEFAULT_SESSION_CUTOFF: fechaOperacionSchema, IDEMPOTENCY_RETENTION_DAYS: z.coerce.number().int().min(30).default(30),
}).safeParse(process.env);
if (!entorno.success) {
  console.error("MCP no iniciado: configure CV_MCP_SESION_ID, CV_MCP_PERFIL y DEFAULT_SESSION_CUTOFF.");
  process.exit(1);
}
const pool = crearPool();
const servidor = crearServidorMcp({ casos: crearCasosPg(pool, entorno.data.IDEMPOTENCY_RETENTION_DAYS),
  sesion: { sesionId: entorno.data.CV_MCP_SESION_ID, perfil: entorno.data.CV_MCP_PERFIL, fechaCorteDefecto: entorno.data.DEFAULT_SESSION_CUTOFF } });
const transporte = new StdioServerTransport();
transporte.onclose = () => { void pool.end(); };
await servidor.connect(transporte);
console.error(`MCP Crédito Vecino listo (stdio) · sesión vinculada ${entorno.data.CV_MCP_SESION_ID}`);
