import type { BaseMessage } from "@langchain/core/messages";
import type { RespuestaRag } from "../rag/respuesta.js";

/** Definición de herramienta tal como la publica MCP (o la herramienta local de políticas). */
export interface DefinicionHerramienta {
  readonly name: string;
  readonly description?: string | undefined;
  readonly inputSchema: Record<string, unknown>;
}
export interface LlamadaHerramienta {
  readonly id: string;
  readonly nombre: string;
  readonly argumentos: Record<string, unknown>;
}
/** Modelo con tool calling: devuelve texto o llamadas a herramientas, nunca ejecuta nada por sí mismo. */
export interface ModeloConHerramientas {
  readonly nombre: string;
  generar(mensajes: readonly BaseMessage[], herramientas: readonly DefinicionHerramienta[]): Promise<{
    readonly texto: string; readonly llamadas: readonly LlamadaHerramienta[];
  }>;
}
/** Cliente de las herramientas MCP de la sesión vinculada (ADR-020). */
export interface ClienteHerramientas {
  listar(): Promise<readonly DefinicionHerramienta[]>;
  llamar(nombre: string, argumentos: Record<string, unknown>): Promise<{ readonly cuerpo: Record<string, unknown>; readonly esError: boolean }>;
  cerrar(): Promise<void>;
}
export interface DependenciasChat {
  readonly modelo: ModeloConHerramientas;
  readonly herramientas: ClienteHerramientas;
  /** RAG de la fase 5 (`responderPolitica`), ya ligado a recuperador, modelo y bitácora. */
  readonly politicas: (pregunta: string) => Promise<RespuestaRag>;
}
export class ErrorChat extends Error {
  public constructor(public readonly codigo: string, mensaje: string) { super(`${codigo}: ${mensaje}`); this.name = "ErrorChat"; }
}
