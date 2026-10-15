import type { NombreOperacionFinal } from "./proyecto-final.js";

export const rutasFinales: Readonly<Record<NombreOperacionFinal, {
  readonly metodo: "get" | "post"; readonly ruta: string; readonly resumen: string;
  readonly humana: boolean; readonly gerencia?: boolean;
}>> = {
  altaCliente: { metodo: "post", ruta: "/clientes", resumen: "Dar de alta un cliente", humana: true },
  solicitarCredito: { metodo: "post", ruta: "/creditos", resumen: "Registrar solicitud de crédito", humana: true },
  simularPlan: { metodo: "post", ruta: "/planes/simulacion", resumen: "Simular plan con vencimientos", humana: false },
  aprobarCredito: { metodo: "post", ruta: "/creditos/{creditoId}/aprobacion", resumen: "Aprobar con evidencia del comité", humana: true, gerencia: true },
  rechazarCredito: { metodo: "post", ruta: "/creditos/{creditoId}/rechazo", resumen: "Rechazar con evidencia del comité", humana: true, gerencia: true },
  desembolsarCredito: { metodo: "post", ruta: "/creditos/{creditoId}/desembolso", resumen: "Desembolsar crédito aprobado", humana: true },
  consultarCredito: { metodo: "get", ruta: "/creditos/{creditoId}", resumen: "Consultar crédito al corte", humana: false },
  consultarPlan: { metodo: "get", ruta: "/creditos/{creditoId}/plan", resumen: "Consultar plan contractual", humana: false },
  calcularDeudaCuota: { metodo: "get", ruta: "/creditos/{creditoId}/cuotas/{numeroCuota}/deuda", resumen: "Consultar deuda exacta de cuota", humana: false },
  explicarMora: { metodo: "get", ruta: "/creditos/{creditoId}/cuotas/{numeroCuota}/mora", resumen: "Explicar mora por tramos", humana: false },
  listarCreditosMora: { metodo: "get", ruta: "/cartera/mora", resumen: "Listar créditos por tramo", humana: false },
  proximosVencimientos: { metodo: "get", ruta: "/cartera/vencimientos", resumen: "Consultar ventana de vencimientos", humana: false },
  consultarCartera: { metodo: "get", ruta: "/cartera", resumen: "Consultar cartera y riesgo", humana: false },
  consultarCierre: { metodo: "get", ruta: "/cierres", resumen: "Consultar cierre diario o mensual", humana: false },
  generarCierre: { metodo: "post", ruta: "/cierres", resumen: "Generar cierre idempotente", humana: true, gerencia: true },
  proponerPago: { metodo: "post", ruta: "/creditos/{creditoId}/propuestas-pago", resumen: "Proponer pago sin efecto financiero", humana: false },
  confirmarPago: { metodo: "post", ruta: "/propuestas-pago/{propuestaId}/confirmacion", resumen: "Confirmar pago con aprobación humana", humana: true },
  cancelarPropuesta: { metodo: "post", ruta: "/propuestas-pago/{propuestaId}/cancelacion", resumen: "Cancelar propuesta sin efecto financiero", humana: true },
  listarClientes: { metodo: "get", ruta: "/clientes", resumen: "Listar clientes y créditos al corte, sin DPI ni teléfono", humana: false },
  consultarFichaCredito: { metodo: "get", ruta: "/creditos/{creditoId}/ficha", resumen: "Consultar condiciones e historial del crédito", humana: false },
  listarPagos: { metodo: "get", ruta: "/creditos/{creditoId}/pagos", resumen: "Listar pagos aplicados y su prelación", humana: false },
  listarSolicitudes: { metodo: "get", ruta: "/solicitudes", resumen: "Listar solicitudes pendientes de comité o desembolso", humana: false },
  listarAsesores: { metodo: "get", ruta: "/asesores", resumen: "Listar asesores cargados", humana: false },
};

/** Ocho capacidades MCP. Confirmar no se publica como herramienta del LLM. */
export const herramientasFinales = {
  consultar_credito: "consultarCredito", calcular_deuda_cuota: "calcularDeudaCuota",
  explicar_mora: "explicarMora", listar_creditos_mora: "listarCreditosMora",
  proximos_vencimientos: "proximosVencimientos", consultar_cartera: "consultarCartera",
  consultar_cierre: "consultarCierre", proponer_pago: "proponerPago",
} as const satisfies Record<string, NombreOperacionFinal>;

/**
 * Fase 3: recurso al que queda ligado el evento humano de un solo uso que emite la sesión.
 * La interfaz lo solicita al pulsar el botón explícito; el servidor lo consume al ejecutar.
 */
export const objetivoEventoHumano = {
  altaCliente: (e: { readonly clienteId: string }) => e.clienteId,
  solicitarCredito: (e: { readonly creditoId: string }) => e.creditoId,
  aprobarCredito: (e: { readonly creditoId: string }) => e.creditoId,
  rechazarCredito: (e: { readonly creditoId: string }) => e.creditoId,
  desembolsarCredito: (e: { readonly creditoId: string }) => e.creditoId,
  generarCierre: (e: { readonly tipo: string; readonly fechaCorte: string }) => `${e.tipo}:${e.fechaCorte}`,
  confirmarPago: (e: { readonly propuestaId: string }) => e.propuestaId,
  cancelarPropuesta: (e: { readonly propuestaId: string }) => e.propuestaId,
} as const satisfies { readonly [N in NombreOperacionFinal as (typeof rutasFinales)[N]["humana"] extends true ? N : never]?: unknown };
