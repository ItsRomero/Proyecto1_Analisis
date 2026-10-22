import { z } from "zod";
import {
  operacionesFinales, problemaFinalSchema, type EntradaFinal, type NombreOperacionFinal, type SalidaFinal,
} from "@contratos/proyecto-final";
import { objetivoEventoHumano, rutasFinales } from "@contratos/rutas-proyecto-final";

export type Problema = z.infer<typeof problemaFinalSchema>;
const BASE = import.meta.env.VITE_API_BASE_URL ?? "/v1";

/** Problema RFC 9457 devuelto por la API; la interfaz lo muestra tal cual, sin reinterpretar cifras. */
export class ErrorApi extends Error {
  public constructor(public readonly problema: Problema) { super(problema.detail); this.name = "ErrorApi"; }
}
/** El servidor no respondió: no se sabe si hubo efecto. Un pago se reintenta con la misma clave. */
export class SinConexion extends Error {
  public constructor() { super("No hay conexión con el servidor."); this.name = "SinConexion"; }
}

export const sesionSchema = z.strictObject({ sesionId: z.string(), perfil: z.enum(["ASESOR", "GERENCIA", "USUARIO"]),
  sujetoId: z.string(), fechaCorteDefecto: z.string() });
export type SesionApi = z.infer<typeof sesionSchema>;

export async function http(metodo: "GET" | "POST", ruta: string, cuerpo?: unknown, cabeceras: Record<string, string> = {}) {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE}${ruta}`, { method: metodo, credentials: "same-origin",
      headers: { Accept: "application/json", ...(cuerpo === undefined ? {} : { "Content-Type": "application/json" }), ...cabeceras },
      ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo) }) });
  } catch { throw new SinConexion(); }
  const texto = await respuesta.text();
  let json: unknown = null;
  try { json = texto ? JSON.parse(texto) : null; } catch { json = null; }
  if (!respuesta.ok) {
    const problema = problemaFinalSchema.safeParse(json);
    throw new ErrorApi(problema.success ? problema.data : { type: "about:blank", title: "ERROR_INTERNO", status: respuesta.status,
      detail: "No se pudo completar la operación.", errorCode: "ERROR_INTERNO", traceId: "-", timestamp: "-" });
  }
  return { status: respuesta.status, headers: respuesta.headers, json };
}

export const sesionApi = {
  async login(perfil: "ASESOR" | "GERENCIA" | "USUARIO", usuario: string, contrasena: string) {
    return sesionSchema.parse((await http("POST", "/sesion/login", { perfil, usuario, contrasena })).json);
  },
  async logout() { await http("POST", "/sesion/logout", {}); },
  async obtener() { return sesionSchema.nullable().parse((await http("GET", "/sesion")).json); },
  async reiniciar() { return sesionSchema.parse((await http("POST", "/sesion/reinicio", {})).json); },
};

export interface ResultadoOperacion<N extends NombreOperacionFinal> {
  readonly datos: SalidaFinal<N>;
  readonly status: number;
  /** Cabecera Idempotency-Replayed de la confirmación de pago. */
  readonly repetido: boolean;
}

/**
 * Invoca una operación del registro único. Las operaciones humanas piden primero un evento de
 * un solo uso a la sesión: solo se llaman desde el botón explícito que pulsa la persona usuaria.
 */
export async function operar<N extends NombreOperacionFinal>(nombre: N, entrada: EntradaFinal<N>,
  opciones: { readonly claveIdempotencia?: string } = {}): Promise<ResultadoOperacion<N>> {
  const valida = operacionesFinales[nombre].entrada.parse(entrada) as Record<string, unknown>;
  const ruta = rutasFinales[nombre];
  const usados = new Set<string>();
  const camino = ruta.ruta.replace(/\{(\w+)\}/g, (_, clave: string) => { usados.add(clave); return encodeURIComponent(String(valida[clave])); });
  const resto = Object.fromEntries(Object.entries(valida).filter(([k, v]) => !usados.has(k) && v !== undefined));
  const cabeceras: Record<string, string> = {};
  if (ruta.humana) {
    const objetivo = (objetivoEventoHumano[nombre as keyof typeof objetivoEventoHumano] as (e: Record<string, unknown>) => string)(valida);
    const evento = await http("POST", "/sesion/eventos-humanos", { operacion: nombre, objetivo });
    cabeceras["X-Evento-Humano"] = z.strictObject({ eventoAprobacionId: z.string() }).parse(evento.json).eventoAprobacionId;
  }
  if (opciones.claveIdempotencia !== undefined) cabeceras["Idempotency-Key"] = opciones.claveIdempotencia;
  const consulta = new URLSearchParams(Object.entries(resto).map(([k, v]) => [k, String(v)])).toString();
  const r = ruta.metodo === "get"
    ? await http("GET", consulta ? `${camino}?${consulta}` : camino, undefined, cabeceras)
    : await http("POST", camino, resto, cabeceras);
  return { datos: operacionesFinales[nombre].salida.parse(r.json) as SalidaFinal<N>, status: r.status,
    repetido: r.headers.get("Idempotency-Replayed") === "true" };
}
