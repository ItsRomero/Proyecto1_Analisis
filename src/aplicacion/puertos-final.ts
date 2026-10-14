import type { EntradaFinal, SalidaFinal } from "../contratos/proyecto-final.js";
import type { RepositorioPagosIdempotentes, ResultadoEjecucionIdempotente } from "./registrar-pago.js";
import type { FechaCivil } from "../dominio/calculadora-mora.js";

export interface RepositorioClientesFinal {
  crear(cliente: EntradaFinal<"altaCliente">): Promise<SalidaFinal<"altaCliente">>;
  existe(clienteId: string): Promise<boolean>;
}
export interface RepositorioLecturasFinal {
  consultarCredito(entrada: EntradaFinal<"consultarCredito">): Promise<SalidaFinal<"consultarCredito"> | null>;
  consultarPlan(entrada: EntradaFinal<"consultarPlan">): Promise<SalidaFinal<"consultarPlan"> | null>;
  // El adaptador recupera hechos; estos DTO financieros solo se publican tras cálculo del núcleo.
}
export interface RepositorioPropuestasFinal {
  guardar(propuesta: SalidaFinal<"proponerPago">): Promise<void>;
  obtenerParaActualizar(propuestaId: string): Promise<SalidaFinal<"proponerPago"> | null>;
}
export interface AuditoriaAprobacionesFinal {
  registrar(evento: { readonly eventoId: string; readonly sujetoId: string; readonly sesionId: string;
    readonly propuestaId: string; readonly fecha: FechaCivil; readonly resultado: "CONFIRMADA" | "CANCELADA" }): Promise<void>;
}
/** Puente asíncrono a DB: precargar clave/huella antes de invocar RegistrarPago síncrono. */
export interface TransaccionPagoFinal {
  readonly idempotenciaPrecargada: RepositorioPagosIdempotentes;
  persistir(resultado: ResultadoEjecucionIdempotente): Promise<void>;
}
export interface UnidadTrabajoPagoFinal {
  ejecutar<T>(creditoId: string, clave: string, accion: (tx: TransaccionPagoFinal) => Promise<T>): Promise<T>;
}
