import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import type { BaseMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { ModeloEmbeddings, ModeloLenguaje } from "./puertos.js";

export class ErrorRag extends Error {
  public constructor(public readonly codigo: string, mensaje: string) { super(`${codigo}: ${mensaje}`); this.name = "ErrorRag"; }
}

/** Variables de .env.example; el proveedor es Ollama local (ADR-008), sin respaldo externo silencioso. */
export function configuracionRag(env: NodeJS.ProcessEnv) {
  const r = z.object({
    OLLAMA_BASE_URL: z.url().default("http://127.0.0.1:11434"),
    EMBEDDING_MODEL: z.string().min(1).default("bge-m3"),
    EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(1024),
    RAG_TOP_K: z.coerce.number().int().min(1).max(20).default(4),
    RAG_UMBRAL_SIMILITUD: z.coerce.number().min(0).max(1).default(0.5),
    LLM_PROVIDER: z.literal("ollama").default("ollama"),
    LLM_MODEL: z.string().min(1).default("qwen3:8b"),
    LLM_TEMPERATURE: z.coerce.number().min(0).max(1).default(0),
    LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
  }).safeParse(env);
  if (!r.success) throw new ErrorRag("CONFIGURACION_RAG_INVALIDA", r.error.issues.map((i) => i.path.join(".")).join(", "));
  return r.data;
}
export type ConfiguracionRag = ReturnType<typeof configuracionRag>;

/** Digest del modelo instalado en Ollama: identifica qué vectores son comparables. */
export async function digestModelo(baseUrl: string, modelo: string): Promise<string> {
  let respuesta: Response;
  try { respuesta = await fetch(new URL("/api/tags", baseUrl), { signal: AbortSignal.timeout(5000) }); }
  catch { throw new ErrorRag("OLLAMA_NO_DISPONIBLE", `No responde ${baseUrl}.`); }
  const tags = z.object({ models: z.array(z.object({ name: z.string(), digest: z.string() })) }).parse(await respuesta.json());
  const nombre = modelo.includes(":") ? modelo : `${modelo}:latest`;
  const m = tags.models.find((x) => x.name === nombre);
  if (!m) throw new ErrorRag("MODELO_NO_INSTALADO", `Ollama no tiene ${nombre}; ejecute ollama pull ${modelo}.`);
  return m.digest;
}

export async function embeddingsOllama(cfg: ConfiguracionRag): Promise<ModeloEmbeddings> {
  return { nombre: cfg.EMBEDDING_MODEL, digest: await digestModelo(cfg.OLLAMA_BASE_URL, cfg.EMBEDDING_MODEL),
    embeddings: new OllamaEmbeddings({ model: cfg.EMBEDDING_MODEL, baseUrl: cfg.OLLAMA_BASE_URL }) };
}

/** Modelo de redacción sin herramientas enlazadas; temperatura 0 y sin modo de razonamiento visible. */
export async function modeloOllama(cfg: ConfiguracionRag): Promise<ModeloLenguaje> {
  const digest = await digestModelo(cfg.OLLAMA_BASE_URL, cfg.LLM_MODEL);
  const chat = new ChatOllama({ model: cfg.LLM_MODEL, baseUrl: cfg.OLLAMA_BASE_URL, temperature: cfg.LLM_TEMPERATURE, think: false, seed: 7 });
  return {
    nombre: `${cfg.LLM_MODEL}@${digest.slice(0, 12)}`,
    async generar(mensajes: readonly BaseMessage[]) {
      try {
        const r = await chat.invoke([...mensajes], { signal: AbortSignal.timeout(cfg.LLM_TIMEOUT_MS) });
        return typeof r.content === "string" ? r.content : r.content.map((p) => ("text" in p ? String(p.text) : "")).join("");
      } catch { throw new ErrorRag("MODELO_NO_DISPONIBLE", `El modelo ${cfg.LLM_MODEL} no respondió dentro de ${cfg.LLM_TIMEOUT_MS} ms.`); }
    },
  };
}
