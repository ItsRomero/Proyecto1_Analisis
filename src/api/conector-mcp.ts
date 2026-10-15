import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport, getDefaultEnvironment } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { Sesion } from "./sesiones.js";

/**
 * Lado backend del vínculo MCP ↔ sesión (ADR-020). Lanza el servidor MCP como proceso hijo stdio
 * ligado a la sesión de interfaz que abrió el chat. Solo se pasan las variables necesarias: el
 * hijo no recibe la cookie de sesión ni puede emitir eventos humanos (POST /v1/sesion/eventos-humanos).
 */
export async function conectarMcpSesion(sesion: Pick<Sesion, "sesionId" | "perfil">, opciones: {
  readonly fechaCorteDefecto: string; readonly databaseUrl: string; readonly diasRetencionIdempotencia?: number;
  readonly script?: string;
}): Promise<Client> {
  const transporte = new StdioClientTransport({
    command: process.execPath,
    args: [opciones.script ?? resolve("dist/src/mcp/principal.js")],
    env: { ...getDefaultEnvironment(), DATABASE_URL: opciones.databaseUrl, DEFAULT_SESSION_CUTOFF: opciones.fechaCorteDefecto,
      IDEMPOTENCY_RETENTION_DAYS: String(opciones.diasRetencionIdempotencia ?? 30),
      CV_MCP_SESION_ID: sesion.sesionId, CV_MCP_PERFIL: sesion.perfil },
    stderr: "pipe",
  });
  const cliente = new Client({ name: "backend-credito-vecino", version: "4.0.0" });
  await cliente.connect(transporte);
  return cliente;
}
