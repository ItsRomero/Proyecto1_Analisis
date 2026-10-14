import type { EntradaFinal, NombreOperacionFinal, SalidaFinal } from "../contratos/proyecto-final.js";

/** Construido por el servidor a partir de la sesión; nunca de argumentos MCP/LLM. */
export interface ContextoOperacion {
  readonly sujetoId: string;
  readonly sesionId: string;
  readonly perfil: "ASESOR" | "GERENCIA";
  readonly canal: "INTERFAZ" | "MCP" | "CARGA";
  readonly traceId: string;
}
export interface ContextoConfirmacionHumana extends ContextoOperacion {
  readonly canal: "INTERFAZ";
  /** Evidencia verificable del evento de interfaz en la misma sesión, no texto del chat. */
  readonly eventoAprobacionId: string;
}
type OperacionesHumanas = "altaCliente" | "solicitarCredito" | "aprobarCredito" | "desembolsarCredito" | "generarCierre" | "confirmarPago" | "cancelarPropuesta";
export type CasosUsoFinal = {
  readonly [N in NombreOperacionFinal]: {
    ejecutar(entrada: EntradaFinal<N>, contexto: N extends OperacionesHumanas ? ContextoConfirmacionHumana : ContextoOperacion): Promise<SalidaFinal<N>>;
  };
};

/** Contratos de entrada, todavía sin adaptadores. Evita implementaciones vacías o mocks en producción. */
export type ConsultasFinales = Pick<CasosUsoFinal,
  "consultarCredito" | "consultarPlan" | "calcularDeudaCuota" | "explicarMora" |
  "listarCreditosMora" | "proximosVencimientos" | "consultarCartera" | "consultarCierre">;
