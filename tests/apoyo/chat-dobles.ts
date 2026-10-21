import type { BaseMessage } from "@langchain/core/messages";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { CasosUsoFinal } from "../../src/aplicacion/casos-uso-final.js";
import { herramientasDeClienteMcp } from "../../src/chat/adaptadores.js";
import type { ClienteHerramientas, DefinicionHerramienta, LlamadaHerramienta, ModeloConHerramientas } from "../../src/chat/puertos.js";
import { propuestaPagoSchema } from "../../src/contratos/proyecto-final.js";
import { crearServidorMcp } from "../../src/mcp/servidor-mcp.js";

/*
 * Dobles SOLO para pruebas deterministas del chat: modelo guionado que emite llamadas a herramientas
 * y MCP real en memoria sobre los hechos canónicos. No son adaptadores de producción.
 */
export type Paso = (mensajes: readonly BaseMessage[], herramientas: readonly DefinicionHerramienta[]) =>
  { readonly texto?: string; readonly llamadas?: readonly Omit<LlamadaHerramienta, "id">[] };
export function modeloGuionado(pasos: Paso[]) {
  const recibidos: { mensajes: readonly BaseMessage[]; herramientas: readonly string[] }[] = [];
  let n = 0;
  const modelo: ModeloConHerramientas = { nombre: "modelo-guionado",
    async generar(mensajes, herramientas) {
      recibidos.push({ mensajes: [...mensajes], herramientas: herramientas.map((h) => h.name) });
      const paso = pasos.shift();
      if (paso === undefined) throw new Error("MODELO_NO_DISPONIBLE: guion agotado");
      const r = paso(mensajes, herramientas);
      return { texto: r.texto ?? "", llamadas: (r.llamadas ?? []).map((l) => ({ ...l, id: `ll-${++n}` })) };
    } };
  return { modelo, recibidos, agregar: (...p: Paso[]) => pasos.push(...p) };
}
export const llamar = (nombre: string, argumentos: Record<string, unknown> = {}): Paso => () => ({ llamadas: [{ nombre, argumentos }] });
export const responder = (texto: string | ((m: readonly BaseMessage[]) => string)): Paso => (m) => ({ texto: typeof texto === "string" ? texto : texto(m) });

export async function mcpEnMemoria(casos: CasosUsoFinal, sesionId = "SES-CHAT"): Promise<ClienteHerramientas> {
  const servidor = crearServidorMcp({ casos, sesion: { sesionId, perfil: "GERENCIA", fechaCorteDefecto: "2026-10-31" } });
  const [a, b] = InMemoryTransport.createLinkedPair();
  const cliente = new Client({ name: "chat-prueba", version: "1.0.0" });
  await Promise.all([servidor.connect(b), cliente.connect(a)]);
  return herramientasDeClienteMcp(cliente, 5000);
}

/** Propuesta con la forma del contrato construida desde la deuda real (la unidad en memoria es de solo lectura). */
export function conPropuestaSimulada(base: ClienteHerramientas, casos: CasosUsoFinal) {
  const propuestas: unknown[] = [];
  const cliente: ClienteHerramientas = { ...base,
    // El cliente base se comparte entre pruebas: cerrar la conversación no lo desconecta.
    cerrar: async () => undefined,
    async llamar(nombre, args) {
      if (nombre !== "proponer_pago") return base.llamar(nombre, args);
      const deuda = await casos.calcularDeudaCuota.ejecutar({ creditoId: String(args["creditoId"]), numeroCuota: Number(args["numeroCuota"]),
        fechaCorte: String(args["fechaCorte"]) }, { sujetoId: "T", sesionId: "SES-CHAT", perfil: "GERENCIA", canal: "MCP", traceId: "T" });
      const p = propuestaPagoSchema.parse({ creditoId: deuda.creditoId, fechaCorte: deuda.fechaCorte, numeroCuota: deuda.numeroCuota,
        monto: deuda.totalExigible, claveIdempotencia: String(args["claveIdempotencia"]), propuestaId: `PROP-SIM-${propuestas.length + 1}`,
        sesionId: "SES-CHAT", estado: "PENDIENTE", versionCredito: 0, deuda, estadoPrevisto: "EN_MORA",
        aplicacionPrevista: { gastosComisiones: deuda.gastosComisiones, interesMoratorio: deuda.interesMoratorio,
          interesCorriente: deuda.interesCorriente, capital: deuda.capital, excedente: { importe: "0.00", moneda: "GTQ" } } });
      propuestas.push(p);
      return { cuerpo: p as unknown as Record<string, unknown>, esError: false };
    } };
  return { cliente, propuestas };
}
