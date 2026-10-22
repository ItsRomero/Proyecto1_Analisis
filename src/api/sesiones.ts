import { randomBytes, randomUUID } from "node:crypto";
import type { OperacionesHumanas } from "../aplicacion/casos-uso-final.js";

export type Perfil = "ASESOR" | "GERENCIA" | "USUARIO";
export interface Sesion {
  /** Secreto de la cookie HttpOnly; nunca viaja en cuerpos JSON ni en propuestas. */
  readonly token: string;
  /** Identificador público que se guarda en propuestas y auditoría. */
  readonly sesionId: string;
  perfil: Perfil;
  clienteId?: string;
}
interface EventoHumano { readonly sesionId: string; readonly operacion: OperacionesHumanas; readonly objetivo: string }

/** Selector de perfil de demostración (ADR-014); no es IAM empresarial. */
const SUJETOS: Readonly<Record<Perfil, string>> = { USUARIO: "USUARIO-DEMO", ASESOR: "ASESOR-DEMO", GERENCIA: "GERENCIA-DEMO" };
const MAXIMO_EVENTOS_PENDIENTES = 50;

/**
 * Sesiones solo en memoria (migración 001). Reiniciar la sesión o el servidor invalida las
 * propuestas pendientes: su confirmación exige la misma sesión. El evento humano es un
 * identificador de un solo uso, ligado a sesión + operación + objetivo, que la interfaz
 * solicita justo antes de enviar una acción explícita de la persona usuaria. Un modelo de
 * lenguaje sin la cookie de sesión no puede obtenerlo ni reutilizarlo.
 */
export class AlmacenSesiones {
  readonly #sesiones = new Map<string, Sesion>();
  readonly #eventos = new Map<string, EventoHumano>();

  public crear(perfil: Perfil = "ASESOR"): Sesion {
    const sesion: Sesion = { token: randomBytes(32).toString("base64url"), sesionId: `SES-${randomUUID()}`, perfil };
    this.#sesiones.set(sesion.token, sesion);
    return sesion;
  }
  public eliminar(sesion: Sesion): void {
    this.#sesiones.delete(sesion.token);
    for (const [id, e] of this.#eventos) if (e.sesionId === sesion.sesionId) this.#eventos.delete(id);
  }
  public obtener(token: string | undefined): Sesion | undefined {
    return token === undefined ? undefined : this.#sesiones.get(token);
  }
  public sujeto(sesion: Sesion): string { return sesion.clienteId ?? SUJETOS[sesion.perfil]; }
  public reiniciar(sesion: Sesion): Sesion {
    this.#sesiones.delete(sesion.token);
    for (const [id, e] of this.#eventos) if (e.sesionId === sesion.sesionId) this.#eventos.delete(id);
    const nueva = this.crear(sesion.perfil);
    if (sesion.clienteId !== undefined) nueva.clienteId = sesion.clienteId;
    return nueva;
  }
  public emitirEvento(sesion: Sesion, operacion: OperacionesHumanas, objetivo: string): string {
    const propios = [...this.#eventos].filter(([, e]) => e.sesionId === sesion.sesionId);
    for (const [id] of propios.slice(0, Math.max(0, propios.length - MAXIMO_EVENTOS_PENDIENTES + 1))) this.#eventos.delete(id);
    const id = `EVH-${randomUUID()}`;
    this.#eventos.set(id, { sesionId: sesion.sesionId, operacion, objetivo });
    return id;
  }
  /** Consume el evento: no puede reutilizarse en otra operación, objetivo o sesión. */
  public consumirEvento(sesion: Sesion, id: string, operacion: OperacionesHumanas, objetivo: string): boolean {
    const evento = this.#eventos.get(id);
    if (evento === undefined || evento.sesionId !== sesion.sesionId || evento.operacion !== operacion || evento.objetivo !== objetivo) return false;
    this.#eventos.delete(id);
    return true;
  }
}
