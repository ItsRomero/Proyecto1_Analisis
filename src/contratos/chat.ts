import { z } from "zod";
import { idSchema } from "./esquemas.js";
import { fechaOperacionSchema, propuestaPagoSchema } from "./proyecto-final.js";

/*
 * Fase 6: contrato único del chat gerencial (API /v1/chat y web/src/chat). Las cifras viajan dentro de
 * `herramientas[].resultado` tal como las devolvió el núcleo; el texto del asistente no es fuente de cifras.
 */
export const rutaChatSchema = z.enum(["MCP", "RAG", "MCP+RAG", "NINGUNA"]);
export const tarjetaHerramientaSchema = z.strictObject({
  id: z.string().min(1), herramienta: z.string().min(1), origen: z.enum(["MCP", "RAG"]),
  argumentos: z.record(z.string(), z.unknown()), estado: z.enum(["OK", "ERROR"]),
  /** Fecha de corte con la que respondió la herramienta (null en políticas o errores sin corte). */
  fechaCorte: fechaOperacionSchema.nullable(), resultado: z.unknown(), duracionMs: z.number().int().nonnegative(),
});
export const citaChatSchema = z.strictObject({ documentoId: z.string().min(1), seccion: z.string().min(1), fragmentoId: z.string().min(1) });
export const mensajeChatSchema = z.strictObject({
  id: z.string().min(1), rol: z.enum(["USUARIO", "ASISTENTE"]), texto: z.string(),
  ruta: rutaChatSchema.nullable(), clasificacion: z.enum(["NORMATIVA", "NUMERICA", "MIXTA"]).nullable(),
  herramientas: z.array(tarjetaHerramientaSchema).readonly(), citas: z.array(citaChatSchema).readonly(),
  propuestas: z.array(propuestaPagoSchema).readonly(),
  /** false si el texto del modelo traía cifras que no estaban en los resultados de herramientas (se oculta). */
  cifrasVerificadas: z.boolean(), aviso: z.string().nullable(), duracionMs: z.number().int().nonnegative().nullable(),
  fechaCorte: fechaOperacionSchema,
});
export const estadoChatSchema = z.strictObject({
  chatId: z.string().nullable(), mensajes: z.array(mensajeChatSchema).readonly(), pendientes: z.array(propuestaPagoSchema).readonly(),
  turnos: z.number().int().nonnegative(), maxTurnos: z.number().int().positive(), ttlMinutos: z.number().int().positive(),
  ocupado: z.boolean(), modelo: z.string().nullable(),
});
export const enviarMensajeChatSchema = z.strictObject({ texto: z.string().trim().min(1).max(1000), fechaCorte: fechaOperacionSchema });
export const resolucionPropuestaChatSchema = z.strictObject({ resultado: z.enum(["CONFIRMADA", "CANCELADA"]), pagoId: idSchema.optional() });

export type TarjetaHerramienta = z.infer<typeof tarjetaHerramientaSchema>;
export type MensajeChat = z.infer<typeof mensajeChatSchema>;
export type EstadoChat = z.infer<typeof estadoChatSchema>;
