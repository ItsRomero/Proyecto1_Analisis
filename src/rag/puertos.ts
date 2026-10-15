import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import type { BaseMessage } from "@langchain/core/messages";

/** Fragmento devuelto por la recuperación: dato no confiable con su fuente identificable. */
export interface FragmentoRecuperado {
  readonly fragmentoId: string;
  readonly documentoId: string;
  readonly titulo: string;
  readonly vigencia: string;
  readonly seccion: string;
  readonly contenido: string;
  /** Similitud coseno con la pregunta (1 = idéntico). */
  readonly similitud: number;
  readonly posibleInstruccion: boolean;
}
export interface Recuperador {
  buscar(pregunta: string, k: number): Promise<readonly FragmentoRecuperado[]>;
}
/** Modelo de embeddings identificado por nombre y digest (los vectores solo se comparan entre iguales). */
export interface ModeloEmbeddings {
  readonly nombre: string;
  readonly digest: string;
  readonly embeddings: EmbeddingsInterface;
}
/** Modelo que redacta: recibe mensajes y devuelve texto. Sin herramientas enlazadas. */
export interface ModeloLenguaje {
  readonly nombre: string;
  generar(mensajes: readonly BaseMessage[]): Promise<string>;
}
export interface RegistroConsultaRag {
  readonly id: string;
  readonly preguntaSha256: string;
  readonly clasificacion: "NORMATIVA" | "NUMERICA" | "MIXTA";
  readonly fuentes: readonly { readonly fragmentoId: string; readonly similitud: number }[];
  readonly citas: readonly string[];
  readonly sinRespaldo: boolean;
  readonly instruccionesIgnoradas: readonly string[];
  readonly piiOmitida: number;
  readonly modelo: string | null;
  readonly modeloEmbeddings: string;
}
export interface BitacoraRag {
  registrar(registro: RegistroConsultaRag): Promise<void>;
}
