import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import type { BaseMessage } from "@langchain/core/messages";
import { fragmentar, textoParaIncrustar, type DocumentoCorpus } from "../../src/rag/corpus.js";
import type { FragmentoRecuperado, ModeloLenguaje, Recuperador } from "../../src/rag/puertos.js";

/*
 * Dobles SOLO para pruebas deterministas (sin red ni Ollama). No son adaptadores de producción:
 * la ingesta y la recuperación reales usan bge-m3 + pgvector (tests/rag/*.rag.ts).
 */
const DIMENSION = 128;
const fichas = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
function vector(texto: string): number[] {
  const v = new Array<number>(DIMENSION).fill(0);
  for (const f of fichas(texto)) {
    let h = 2166136261;
    for (const c of f) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    v[Math.abs(h) % DIMENSION]! += 1;
  }
  const n = Math.hypot(...v) || 1;
  return v.map((x) => x / n);
}
export const embeddingsDePrueba: EmbeddingsInterface = {
  embedDocuments: async (textos) => textos.map(vector),
  embedQuery: async (texto) => vector(texto),
};

export function recuperadorEnMemoria(documentos: readonly DocumentoCorpus[]): Recuperador {
  const indice = documentos.flatMap(fragmentar).map((f) => ({ f, v: vector(textoParaIncrustar(f)) }));
  return {
    async buscar(pregunta, k) {
      const q = vector(pregunta);
      return indice.map(({ f, v }): FragmentoRecuperado => ({ fragmentoId: f.metadata.fragmentoId, documentoId: f.metadata.documentoId,
        titulo: f.metadata.titulo, vigencia: f.metadata.vigencia, seccion: f.metadata.seccion, contenido: f.pageContent,
        posibleInstruccion: f.metadata.posibleInstruccion, similitud: v.reduce((s, x, i) => s + x * q[i]!, 0) }))
        .sort((a, b) => b.similitud - a.similitud).slice(0, k);
    },
  };
}

/** Modelo guionado: registra los mensajes recibidos y devuelve el texto indicado. */
export function modeloGuionado(respuesta: string | ((m: readonly BaseMessage[]) => string)) {
  const llamadas: (readonly BaseMessage[])[] = [];
  const modelo: ModeloLenguaje = { nombre: "modelo-de-prueba",
    async generar(m) { llamadas.push(m); return typeof respuesta === "string" ? respuesta : respuesta(m); } };
  return { modelo, llamadas };
}
