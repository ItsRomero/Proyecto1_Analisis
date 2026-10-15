import { z } from "zod";
import { politicasPaqueteSchema, fechaOperacionSchema } from "./proyecto-final.js";

const id = z.string().min(1);
const centavos = z.number().int().positive().refine(Number.isSafeInteger);
const base = z.object({ seq: z.number().int().positive() });
export const eventoCanonicoSchema = z.discriminatedUnion("tipo", [
  base.extend({ tipo: z.literal("CLIENTE"), id_cliente: id, nombre_completo: id, dpi: id,
    telefono: id, municipio: id, fecha_alta: fechaOperacionSchema }).strict(),
  base.extend({ tipo: z.literal("DESEMBOLSO"), id_credito: id, id_cliente: id, id_asesor: id,
    fecha: fechaOperacionSchema, capital_centavos: centavos, plazo_meses: z.number().int().min(3).max(24),
    tna_bps: z.number().int().nonnegative().refine(Number.isSafeInteger), reestructurado: z.boolean() }).strict(),
  base.extend({ tipo: z.literal("PAGO"), clave_idempotencia: id, id_credito: id,
    fecha: fechaOperacionSchema, monto_centavos: centavos, canal: id }).strict(),
]);
export type EventoCanonico = z.infer<typeof eventoCanonicoSchema>;
export type PoliticasPaquete = z.infer<typeof politicasPaqueteSchema>;
export type DesembolsoCanonico = Extract<EventoCanonico, { tipo: "DESEMBOLSO" }>;
