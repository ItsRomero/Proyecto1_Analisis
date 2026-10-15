import type { EntradaFinal, SalidaFinal } from "../contratos/proyecto-final.js";
import type { PoliticasPaquete } from "../contratos/paquete-canonico.js";
import type { EstadoCredito } from "../dominio/credito-estado.js";

export interface RepositorioClientesFinal {
  crear(cliente: EntradaFinal<"altaCliente">): Promise<SalidaFinal<"altaCliente">>;
  existe(clienteId: string): Promise<boolean>;
}

/*
 * Fase 3: los adaptadores solo recuperan y guardan HECHOS (centavos, fechas civiles,
 * transiciones y aplicaciones registradas). Saldos, días, tramos, deuda, cartera y cierres
 * los produce el núcleo en src/aplicacion; ningún adaptador devuelve cifras derivadas.
 */
export type ConceptoAplicado = "GASTOS" | "MORATORIO" | "CORRIENTE" | "CAPITAL" | "EXCEDENTE";

export interface CuotaHecho {
  readonly numero: number;
  readonly vencimiento: string;
  readonly capital: bigint;
  readonly interes: bigint;
  readonly importe: bigint;
  readonly saldoPosterior: bigint;
}
export interface PagoHecho {
  readonly pagoId: string;
  readonly numeroCuota: number;
  readonly fecha: string;
  readonly importe: bigint;
  readonly clave: string;
  readonly huella: string;
  readonly usuarioProceso: string;
  readonly canal: string;
  readonly propuestaId: string | null;
  readonly aplicacion: Readonly<Record<ConceptoAplicado, bigint>>;
}
export interface TransicionHecho {
  readonly estadoAnterior: EstadoCredito;
  readonly estadoNuevo: EstadoCredito;
  readonly fecha: string;
  readonly sujetoId: string;
  readonly motivo: string;
}
export interface CreditoHecho {
  readonly creditoId: string;
  readonly clienteId: string;
  readonly asesorId: string;
  readonly politicaId: string | null;
  /** Proyección operativa persistida; las consultas al corte la derivan otra vez con State. */
  readonly estado: EstadoCredito;
  readonly capital: bigint;
  readonly tnaBps: number;
  readonly plazoMeses: number;
  readonly fechaSolicitud: string;
  readonly fechaDesembolso: string | null;
  readonly reestructurado: boolean;
  readonly version: number;
  readonly cuotas: readonly CuotaHecho[];
  readonly pagos: readonly PagoHecho[];
  readonly transiciones: readonly TransicionHecho[];
  readonly baja: { readonly fecha: string; readonly saldo: bigint } | null;
}
export interface ClienteHecho {
  readonly clienteId: string;
  readonly nombreCompleto: string;
  readonly municipio: string;
  readonly fechaAlta: string;
}
export type PropuestaHecho = SalidaFinal<"proponerPago"> & {
  readonly sujetoProponente: string;
  /** Canal que creó la propuesta: la persona en la interfaz o el asistente vía MCP (fase 4). */
  readonly canalProponente: "INTERFAZ" | "MCP";
  readonly huella: string;
};
export type CierreHecho = SalidaFinal<"generarCierre">;
export interface EventoAuditoria {
  readonly id: string;
  readonly propuestaId: string | null;
  readonly creditoId: string;
  readonly sujetoId: string;
  readonly sesionId: string;
  readonly tipo: "PAGO" | "COMITE" | "DESEMBOLSO" | "CANCELACION" | "PROPUESTA";
  readonly fechaOperacion: string;
  readonly resultado: string;
  readonly versionCredito: number;
  readonly traceId: string;
  /** Fase 4: quién propuso, por qué canal y con qué clave (null en eventos sin propuesta de pago). */
  readonly proponente?: string | null;
  readonly canalProponente?: "INTERFAZ" | "MCP" | null;
  readonly claveIdempotencia?: string | null;
}

export interface LecturasFinal {
  /** Configuración versionada cargada desde politicas.json (D-4). */
  configuracionPoliticas(): Promise<PoliticasPaquete>;
  credito(creditoId: string): Promise<CreditoHecho | null>;
  creditos(): Promise<readonly CreditoHecho[]>;
  clientes(): Promise<readonly ClienteHecho[]>;
  asesores(): Promise<readonly { readonly asesorId: string; readonly nombre: string }[]>;
  cierre(tipo: "DIARIO" | "MENSUAL", inicio: string, corte: string): Promise<CierreHecho | null>;
}

export interface TransaccionFinal {
  /**
   * Bloquea la fila del crédito hasta el commit (SELECT ... FOR UPDATE) y devuelve sus hechos,
   * incluidas claves y huellas: la aplicación precarga con ellos la idempotencia de RegistrarPago.
   */
  bloquearCredito(creditoId: string): Promise<CreditoHecho | null>;
  existeCliente(clienteId: string): Promise<boolean>;
  identificacionRegistrada(tipo: string, valor: string): Promise<boolean>;
  existeAsesor(asesorId: string): Promise<boolean>;
  insertarCliente(cliente: EntradaFinal<"altaCliente">): Promise<void>;
  insertarCredito(credito: Omit<CreditoHecho, "cuotas" | "pagos" | "transiciones" | "baja">): Promise<void>;
  actualizarCredito(creditoId: string, cambios: {
    readonly estado: EstadoCredito; readonly version: number;
    readonly politicaId?: string; readonly fechaDesembolso?: string;
  }): Promise<void>;
  insertarTransiciones(creditoId: string, transiciones: readonly TransicionHecho[], evidencia: Readonly<Record<string, string>>): Promise<void>;
  insertarCuotas(creditoId: string, cuotas: readonly CuotaHecho[]): Promise<void>;
  guardarPropuesta(propuesta: PropuestaHecho): Promise<void>;
  obtenerPropuesta(propuestaId: string): Promise<PropuestaHecho | null>;
  actualizarEstadoPropuesta(propuestaId: string, estado: PropuestaHecho["estado"]): Promise<void>;
  insertarPago(creditoId: string, pago: PagoHecho, extras: {
    readonly aprobacionId: string; readonly conservarClaveHasta: string;
  }): Promise<void>;
  insertarGasto(creditoId: string, numeroCuota: number, fecha: string, importe: bigint): Promise<void>;
  registrarAuditoria(evento: EventoAuditoria): Promise<void>;
  obtenerCierre(tipo: "DIARIO" | "MENSUAL", inicio: string, corte: string): Promise<CierreHecho | null>;
  insertarCierre(cierre: CierreHecho, versionCartera: number, generadoPor: string): Promise<void>;
}

export interface UnidadTrabajoFinal {
  /** Una transacción: el fallo de cualquier escritura revierte todo. */
  ejecutar<T>(accion: (tx: TransaccionFinal) => Promise<T>): Promise<T>;
}

export interface GeneradorIdsFinal {
  propuesta(): string;
  pago(): string;
  aprobacion(): string;
}
