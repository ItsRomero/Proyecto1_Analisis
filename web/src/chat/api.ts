import { estadoChatSchema, type EstadoChat } from "@contratos/chat";
import { http } from "../api/cliente";

/** Cliente de /v1/chat: la conversación vive en el servidor, ligada a la sesión de interfaz. */
export const chatApi = {
  async estado(): Promise<EstadoChat> { return estadoChatSchema.parse((await http("GET", "/chat")).json); },
  async enviar(texto: string, fechaCorte: string): Promise<EstadoChat> {
    return estadoChatSchema.parse((await http("POST", "/chat/mensajes", { texto, fechaCorte })).json);
  },
  async resolver(propuestaId: string, resultado: "CONFIRMADA" | "CANCELADA", pagoId?: string): Promise<EstadoChat> {
    return estadoChatSchema.parse((await http("POST", `/chat/propuestas/${encodeURIComponent(propuestaId)}/resolucion`,
      { resultado, ...(pagoId ? { pagoId } : {}) })).json);
  },
  async reiniciar(): Promise<EstadoChat> { return estadoChatSchema.parse((await http("POST", "/chat/reinicio", {})).json); },
};
