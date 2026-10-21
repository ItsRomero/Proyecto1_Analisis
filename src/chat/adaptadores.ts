import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { ChatOllama } from "@langchain/ollama";
import type { BaseMessage } from "@langchain/core/messages";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { BitacoraRagPg, RecuperadorPg } from "../rag/almacen-pg.js";
import { ErrorRag, digestModelo, embeddingsOllama, modeloOllama, type ConfiguracionRag } from "../rag/ollama.js";
import { responderPolitica } from "../rag/respuesta.js";
import type { ClienteHerramientas, DefinicionHerramienta, ModeloConHerramientas } from "./puertos.js";

/** qwen3:8b con tool calling (ADR-008): temperatura 0, sin razonamiento visible, contexto 8192. */
export async function modeloConHerramientasOllama(cfg: ConfiguracionRag): Promise<ModeloConHerramientas> {
  const digest = await digestModelo(cfg.OLLAMA_BASE_URL, cfg.LLM_MODEL);
  const base = new ChatOllama({ model: cfg.LLM_MODEL, baseUrl: cfg.OLLAMA_BASE_URL, temperature: cfg.LLM_TEMPERATURE, think: false, seed: 7, numCtx: 8192 });
  return {
    nombre: `${cfg.LLM_MODEL}@${digest.slice(0, 12)}`,
    async generar(mensajes: readonly BaseMessage[], herramientas: readonly DefinicionHerramienta[]) {
      const modelo = base.bindTools(herramientas.map((h) => ({ type: "function" as const,
        function: { name: h.name, description: h.description ?? "", parameters: h.inputSchema } })));
      try {
        const r = await modelo.invoke([...mensajes], { signal: AbortSignal.timeout(cfg.LLM_TIMEOUT_MS) });
        const texto = typeof r.content === "string" ? r.content : r.content.map((p) => ("text" in p ? String(p.text) : "")).join("");
        return { texto, llamadas: (r.tool_calls ?? []).map((c) => ({ id: c.id ?? `llamada-${randomUUID()}`, nombre: c.name,
          argumentos: (c.args ?? {}) as Record<string, unknown> })) };
      } catch { throw new ErrorRag("MODELO_NO_DISPONIBLE", `El modelo ${cfg.LLM_MODEL} no respondió dentro de ${cfg.LLM_TIMEOUT_MS} ms.`); }
    },
  };
}

/** Herramientas de un cliente MCP (stdio o en memoria) con tiempo límite por llamada. */
export function herramientasDeClienteMcp(cliente: Client, timeoutMs: number): ClienteHerramientas {
  return {
    async listar() {
      return (await cliente.listTools()).tools.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema as Record<string, unknown> }));
    },
    async llamar(nombre, argumentos) {
      const r = (await cliente.callTool({ name: nombre, arguments: argumentos }, undefined, { timeout: timeoutMs })) as
        { structuredContent?: Record<string, unknown>; isError?: boolean };
      return { cuerpo: r.structuredContent ?? {}, esError: r.isError === true };
    },
    cerrar: () => cliente.close(),
  };
}

/** RAG de la fase 5 ligado a la base y a los modelos configurados. */
export async function politicasOllama(pool: Pool, cfg: ConfiguracionRag) {
  const embeddings = await embeddingsOllama(cfg);
  const modelo = await modeloOllama(cfg);
  const recuperador = new RecuperadorPg(pool, embeddings);
  const bitacora = new BitacoraRagPg(pool);
  return (pregunta: string) => responderPolitica(pregunta, { recuperador, modelo, bitacora, k: cfg.RAG_TOP_K, umbral: cfg.RAG_UMBRAL_SIMILITUD,
    modeloEmbeddings: `${embeddings.nombre}@${embeddings.digest.slice(0, 12)}`, nuevoId: () => `RAG-${randomUUID()}` });
}
