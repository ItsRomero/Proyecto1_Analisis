import { randomUUID } from "node:crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema, type CallToolResult, type Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { CasosUsoFinal, ContextoOperacion } from "../aplicacion/casos-uso-final.js";
import { ErrorCasoUsoFinal } from "../aplicacion/error-final.js";
import { operacionesFinales } from "../contratos/proyecto-final.js";
import { herramientasFinales } from "../contratos/rutas-proyecto-final.js";
import { presentarProblemaFinal } from "../api/presentar-problema-final.js";

/** Sujeto con el que el asistente queda registrado como proponente; nunca como aprobador. */
export const SUJETO_ASISTENTE = "ASISTENTE-MCP";

/**
 * Vínculo con la sesión de interfaz que abrió el chat. Lo fija el backend al lanzar o conectar
 * el servidor (variables del proceso hijo o parámetro en memoria), nunca un argumento del modelo.
 * Una propuesta creada aquí lleva este `sesionId` y solo esa sesión puede confirmarla por la API.
 */
export interface SesionVinculadaMcp {
  readonly sesionId: string;
  readonly perfil: "ASESOR" | "GERENCIA";
  /** Fecha de corte de la sesión: se usa cuando la herramienta no recibe `fechaCorte`. */
  readonly fechaCorteDefecto: string;
}
type NombreHerramienta = keyof typeof herramientasFinales;

const DESCRIPCIONES: Readonly<Record<NombreHerramienta, string>> = {
  consultar_credito: "Estado, saldo de capital, días de atraso, tramo, cuotas pagadas y vencidas y próxima cuota de un crédito a una fecha de corte. Solo lectura.",
  calcular_deuda_cuota: "Deuda exacta de una cuota a la fecha de corte: gastos, interés moratorio, interés corriente, capital y total exigible. Solo lectura.",
  explicar_mora: "Formación de la mora de una cuota: política aplicada, capital en mora y cada tramo recorrido con días y tasa. Solo lectura.",
  listar_creditos_mora: "Créditos con atraso a la fecha de corte, con días, tramo y saldo; filtrable por tramo (MORA_1, MORA_2, MORA_3, VENCIDO, INCOBRABLE). Solo lectura.",
  proximos_vencimientos: "Cuotas que vencen en la ventana (corte, corte + 7] o (corte, corte + 30], con cantidad y monto total. Solo lectura.",
  consultar_cartera: "Cartera activa, en mora, en riesgo por tramo e incobrable del período [inicioPeriodo, fechaCorte]. Solo lectura.",
  consultar_cierre: "Cierre DIARIO o MENSUAL: desembolsos y recuperaciones por concepto y cartera al corte. No genera el cierre. Solo lectura.",
  proponer_pago: "Crea una PROPUESTA de pago sin efecto financiero: devuelve la prelación, el monto exacto, el estado previsto y el propuestaId. "
    + "El pago solo se registra si una persona lo aprueba en la interfaz; esta herramienta no puede confirmarlo.",
};

/** El mismo esquema de entrada del registro único; `fechaCorte` es opcional porque la sesión aporta un valor por defecto. */
function esquemaEntrada(nombre: NombreHerramienta): Tool["inputSchema"] {
  const { $schema: _s, required = [], ...resto } = z.toJSONSchema(operacionesFinales[herramientasFinales[nombre]].entrada) as
    { $schema?: string; required?: string[]; [clave: string]: unknown };
  return { ...resto, type: "object", required: required.filter((campo) => campo !== "fechaCorte") };
}

export function definicionesHerramientas(): Tool[] {
  return (Object.keys(herramientasFinales) as NombreHerramienta[]).map((nombre) => ({
    name: nombre, description: DESCRIPCIONES[nombre], inputSchema: esquemaEntrada(nombre),
    annotations: { title: nombre.replace(/_/g, " "), readOnlyHint: nombre !== "proponer_pago", destructiveHint: false,
      idempotentHint: nombre !== "proponer_pago", openWorldHint: false },
  }));
}

const resultado = (cuerpo: Record<string, unknown>, esError = false): CallToolResult =>
  ({ content: [{ type: "text", text: JSON.stringify(cuerpo) }], structuredContent: cuerpo, ...(esError ? { isError: true } : {}) });

/**
 * Servidor MCP de menor privilegio: siete consultas y una propuesta, todas sobre la misma
 * instancia de CasosUsoFinal que usa la API. No publica confirmar, cancelar, alta, originación,
 * comité, desembolso ni cierres. Errores RFC 9457 sin SQL, trazas ni datos personales.
 */
export function crearServidorMcp(opciones: { readonly casos: CasosUsoFinal; readonly sesion: SesionVinculadaMcp }): Server {
  const { casos, sesion } = opciones;
  const servidor = new Server({ name: "credito-vecino-nucleo", version: "4.0.0" }, { capabilities: { tools: {} },
    instructions: "Herramientas del núcleo de microcrédito. Las cifras salen del núcleo; no las recalcule. "
      + "proponer_pago solo deja una propuesta pendiente: la aprobación humana ocurre en la interfaz." });

  servidor.setRequestHandler(ListToolsRequestSchema, () => ({ tools: definicionesHerramientas() }));
  servidor.setRequestHandler(CallToolRequestSchema, async (solicitud) => {
    const traceId = randomUUID();
    try {
      const nombre = solicitud.params.name;
      if (!Object.hasOwn(herramientasFinales, nombre)) throw new ErrorCasoUsoFinal("ENTRADA_INVALIDA");
      const operacion = herramientasFinales[nombre as NombreHerramienta];
      const argumentos: Record<string, unknown> = { ...(solicitud.params.arguments ?? {}) };
      if (!("fechaCorte" in argumentos)) argumentos["fechaCorte"] = sesion.fechaCorteDefecto;
      // Esquema estricto: aprobado, sujetoId, sesionId o perfil en los argumentos se rechazan.
      const entrada = operacionesFinales[operacion].entrada.parse(argumentos);
      const contexto: ContextoOperacion = { sujetoId: SUJETO_ASISTENTE, sesionId: sesion.sesionId, perfil: sesion.perfil, canal: "MCP", traceId };
      const ejecutar = casos[operacion].ejecutar as (e: unknown, c: ContextoOperacion) => Promise<Record<string, unknown>>;
      return resultado(await ejecutar(entrada, contexto));
    } catch (error) {
      const problema = presentarProblemaFinal(error, { traceId, timestamp: new Date().toISOString() });
      // stdout pertenece al protocolo: los diagnósticos van a stderr y sin datos de la solicitud.
      if (problema.status === 500) console.error(`[mcp ${traceId}] error interno`);
      return resultado(problema.body, true);
    }
  });
  return servidor;
}
