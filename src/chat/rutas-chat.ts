import { randomUUID } from "node:crypto";
import type express from "express";
import type { Request, Response } from "express";
import { ZodError } from "zod";
import { enviarMensajeChatSchema, estadoChatSchema, resolucionPropuestaChatSchema, type EstadoChat } from "../contratos/chat.js";
import type { Sesion } from "../api/sesiones.js";
import type { AlmacenChats } from "./orquestador.js";
import { ErrorChat } from "./puertos.js";

const ESTADOS: Readonly<Record<string, number>> = { CHAT_OCUPADO: 409, PROPUESTAS_PENDIENTES: 409, PROPUESTA_NO_PENDIENTE: 404,
  ASISTENTE_NO_DISPONIBLE: 503, ENTRADA_INVALIDA: 400 };
const DETALLES: Readonly<Record<string, string>> = {
  CHAT_OCUPADO: "El asistente todavía responde el mensaje anterior.",
  PROPUESTAS_PENDIENTES: "Apruebe o cancele las propuestas pendientes antes de reiniciar la conversación.",
  PROPUESTA_NO_PENDIENTE: "La propuesta no está pendiente en esta conversación.",
  ASISTENTE_NO_DISPONIBLE: "El asistente no está disponible: revise que Ollama y sus modelos estén activos.",
  ENTRADA_INVALIDA: "El mensaje no cumple el contrato.",
};

/** Rutas /v1/chat: la conversación vive en el servidor y se liga a la sesión de interfaz (cookie). */
export function registrarRutasChat(app: express.Express, opciones: {
  readonly almacen: AlmacenChats; readonly exigirSesion: (req: Request) => Sesion;
  readonly maxTurnos: number; readonly ttlMinutos: number;
}) {
  const exigirSesion = (req: Request) => {
    const sesion = opciones.exigirSesion(req);
    if (sesion.perfil === "USUARIO") throw new Error("SESION_NO_AUTORIZADA");
    return { ...sesion, perfil: sesion.perfil };
  };
  const vacio = (): EstadoChat => ({ chatId: null, mensajes: [], pendientes: [], turnos: 0, maxTurnos: opciones.maxTurnos,
    ttlMinutos: opciones.ttlMinutos, ocupado: false, modelo: null });
  const problema = (res: Response, error: unknown) => {
    const codigo = error instanceof ErrorChat ? error.codigo : error instanceof ZodError ? "ENTRADA_INVALIDA"
      : error instanceof Error && /^SESION_NO_AUTORIZADA$/.test(error.message) ? "SESION_NO_AUTORIZADA" : "ASISTENTE_NO_DISPONIBLE";
    const status = codigo === "SESION_NO_AUTORIZADA" ? 403 : ESTADOS[codigo] ?? 503;
    if (status >= 500) console.error("[chat]", error instanceof Error ? error.message.replace(/postgres(?:ql)?:\/\/\S+/g, "[conexión]") : error);
    res.status(status).type("application/problem+json").json({ type: `urn:credito-vecino:problema:${codigo.toLowerCase()}`, title: codigo, status,
      detail: DETALLES[codigo] ?? "La sesión no autoriza esta operación.", errorCode: codigo, traceId: randomUUID(), timestamp: new Date().toISOString() });
  };
  const responder = (res: Response, estado: EstadoChat) => res.json(estadoChatSchema.parse(estado));

  app.get("/v1/chat", (req, res) => {
    try { responder(res, opciones.almacen.existente(exigirSesion(req).sesionId)?.estado() ?? vacio()); } catch (e) { problema(res, e); }
  });
  app.post("/v1/chat/mensajes", async (req, res) => {
    try {
      const sesion = exigirSesion(req);
      const e = enviarMensajeChatSchema.parse(req.body);
      const chat = await opciones.almacen.obtener({ sesionId: sesion.sesionId, perfil: sesion.perfil }).catch((c: unknown) => {
        throw c instanceof ErrorChat ? c : new ErrorChat("ASISTENTE_NO_DISPONIBLE", c instanceof Error ? c.message : "sin detalle");
      });
      await chat.enviar(e.texto, e.fechaCorte);
      responder(res, chat.estado());
    } catch (e) { problema(res, e); }
  });
  app.post("/v1/chat/propuestas/:propuestaId/resolucion", (req, res) => {
    try {
      const sesion = exigirSesion(req);
      const e = resolucionPropuestaChatSchema.parse(req.body);
      const chat = opciones.almacen.existente(sesion.sesionId);
      if (chat === undefined) throw new ErrorChat("PROPUESTA_NO_PENDIENTE", "Sin conversación.");
      chat.resolver(String(req.params["propuestaId"]), e.resultado, e.pagoId);
      responder(res, chat.estado());
    } catch (e) { problema(res, e); }
  });
  app.post("/v1/chat/reinicio", async (req, res) => {
    try {
      const sesion = exigirSesion(req);
      await opciones.almacen.reiniciar(sesion.sesionId);
      responder(res, vacio());
    } catch (e) { problema(res, e); }
  });
}
