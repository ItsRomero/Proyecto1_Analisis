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
/** La cabecera Idempotency-Key llega por transporte y debe coincidir con la propuesta. */
export interface ContextoConfirmacionPago extends ContextoConfirmacionHumana {
  readonly claveIdempotencia: string;
}
export type OperacionesHumanas = "altaCliente" | "solicitarCredito" | "aprobarCredito" | "rechazarCredito" | "desembolsarCredito" | "generarCierre" | "confirmarPago" | "cancelarPropuesta";
export type ContextoDe<N extends NombreOperacionFinal> = N extends "confirmarPago" ? ContextoConfirmacionPago
  : N extends OperacionesHumanas ? ContextoConfirmacionHumana : ContextoOperacion;
export type CasosUsoFinal = {
  readonly [N in NombreOperacionFinal]: {
    ejecutar(entrada: EntradaFinal<N>, contexto: ContextoDe<N>): Promise<SalidaFinal<N>>;
  };
};

/** Lecturas sin efecto financiero; la fase 4 publica solo las ocho capacidades de herramientasFinales. */
export type ConsultasFinales = Pick<CasosUsoFinal,
  "consultarCredito" | "consultarPlan" | "calcularDeudaCuota" | "explicarMora" |
  "listarCreditosMora" | "proximosVencimientos" | "consultarCartera" | "consultarCierre">;
