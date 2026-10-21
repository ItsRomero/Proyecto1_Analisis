import { expect } from "vitest";
import { resolve } from "node:path";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import type { Pool } from "pg";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { crearServidorFinal } from "../../src/api/servidor-final.js";
import { herramientasDeClienteMcp, modeloConHerramientasOllama, politicasOllama } from "../../src/chat/adaptadores.js";
import type { EstadoChat, MensajeChat } from "../../src/contratos/chat.js";
import { crearServidorMcp } from "../../src/mcp/servidor-mcp.js";
import { leerPaquete } from "../../src/persistencia/paquete-canonico.js";
import { cargarPostgres, reiniciar } from "../../src/persistencia/postgres.js";
import { ingerirCorpus } from "../../src/rag/almacen-pg.js";
import { leerCorpus } from "../../src/rag/corpus.js";
import { embeddingsOllama, type ConfiguracionRag } from "../../src/rag/ollama.js";

/*
 * Infraestructura compartida por tests/chat/chat-real.chat.ts y tests/evals/evals-reales.eval.ts: base de prueba
 * reiniciada y cargada, corpus ingerido, API real con chat (qwen3:8b) y MCP en memoria sobre la MISMA instancia de
 * casos de uso, y una sesión HTTP que ejecuta OP-1 a OP-3 por la API. Nunca usa la base de demo.
 */
export const CORTE = "2026-10-31";
// Justificación de any: navegación de respuestas JSON en la prueba; el servidor valida cada salida con Zod.
export type Json = { [k: string]: any };

export async function prepararEntornoChatReal(pool: Pool, cfg: ConfiguracionRag, opciones: { readonly directorioWeb?: string } = {}) {
  await reiniciar(pool);
  await cargarPostgres(pool, await leerPaquete(resolve("datos/datos-proyecto-final")));
  await ingerirCorpus(pool, await leerCorpus(), await embeddingsOllama(cfg), cfg.EMBEDDING_DIMENSIONS);
  const { app } = crearServidorFinal(pool, { host: "127.0.0.1", puerto: 0, fechaCorteDefecto: CORTE, origenWeb: undefined, diasRetencionIdempotencia: 30,
    directorioWeb: opciones.directorioWeb }, { maxTurnos: 12, ttlMinutos: 60, async fabrica(sesion, casos) {
      const servidorMcp = crearServidorMcp({ casos, sesion: { ...sesion, fechaCorteDefecto: CORTE } });
      const [a, b] = InMemoryTransport.createLinkedPair();
      const cliente = new Client({ name: "chat-real", version: "1.0.0" });
      await Promise.all([servidorMcp.connect(b), cliente.connect(a)]);
      return { modelo: await modeloConHerramientasOllama(cfg), politicas: await politicasOllama(pool, cfg),
        herramientas: herramientasDeClienteMcp(cliente, cfg.LLM_TIMEOUT_MS) };
    } });
  const servidor: Server = app.listen(0, "127.0.0.1");
  servidor.requestTimeout = 0;
  await new Promise<void>((ok) => servidor.once("listening", () => ok()));
  return { base: `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`, cerrar: () => new Promise<void>((ok) => servidor.close(() => ok())) };
}

export class SesionHttp {
  cookie = "";
  public constructor(private readonly base: string) {}
  async abrir() {
    const r = await fetch(`${this.base}/v1/sesion`);
    this.cookie = (r.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
    return this;
  }
  async pedir(metodo: string, ruta: string, cuerpo?: unknown, cabeceras: Record<string, string> = {}) {
    const r = await fetch(`${this.base}/v1${ruta}`, { method: metodo, headers: { "content-type": "application/json", cookie: this.cookie, ...cabeceras },
      ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo) }) });
    return { status: r.status, body: (await r.json()) as Json };
  }
  get(ruta: string) { return this.pedir("GET", ruta); }
  async humano(operacion: string, objetivo: string, ruta: string, cuerpo: unknown, extra: Record<string, string> = {}) {
    const ev = (await this.pedir("POST", "/sesion/eventos-humanos", { operacion, objetivo })).body["eventoAprobacionId"];
    return this.pedir("POST", ruta, cuerpo, { "x-evento-humano": ev, ...extra });
  }
  async pagarCuotaMasAntigua(creditoId: string, clave: string) {
    const c = (await this.get(`/creditos/${creditoId}?fechaCorte=${CORTE}`)).body;
    const d = (await this.get(`/creditos/${creditoId}/cuotas/${c["proximaCuota"].numeroCuota}/deuda?fechaCorte=${CORTE}`)).body;
    const p = (await this.pedir("POST", `/creditos/${creditoId}/propuestas-pago`, { fechaCorte: CORTE, numeroCuota: d["numeroCuota"],
      monto: d["totalExigible"], claveIdempotencia: clave })).body;
    const r = await this.humano("confirmarPago", p["propuestaId"], `/propuestas-pago/${p["propuestaId"]}/confirmacion`,
      { fechaOperacion: CORTE, versionCredito: p["versionCredito"] }, { "idempotency-key": clave });
    expect(r.status).toBe(201);
  }
  /** OP-1, OP-2 y OP-3 por la API (el recorrido en pantalla se prueba en la fase 3). */
  async operacionesGuion(prefijo: string) {
    await this.pagarCuotaMasAntigua("CV-2026-0043", `${prefijo}-OP1`);
    await this.pagarCuotaMasAntigua("CV-2026-0035", `${prefijo}-OP2`);
    await this.humano("altaCliente", "CL-9001", "/clientes", { clienteId: "CL-9001", nombreCompleto: "Gerencia Demostración Gálvez",
      identificadorLegal: { tipo: "DPI", valor: "DPI-FICT-009001" }, municipio: "Guatemala", fechaAlta: CORTE });
    await this.humano("solicitarCredito", "CV-2026-9001", "/creditos", { creditoId: "CV-2026-9001", clienteId: "CL-9001", asesorId: "AS-01",
      monto: { importe: "10000.00", moneda: "GTQ" }, plazoMeses: 12, tasaNominalAnual: "0.36", fechaSolicitud: CORTE });
    await this.pedir("POST", "/sesion/perfil", { perfil: "GERENCIA" });
    await this.humano("aprobarCredito", "CV-2026-9001", "/creditos/CV-2026-9001/aprobacion", { fechaOperacion: CORTE, motivo: "Comité" });
    await this.humano("desembolsarCredito", "CV-2026-9001", "/creditos/CV-2026-9001/desembolso", { fechaOperacion: CORTE, motivo: "Desembolso" });
  }
  async chat(texto: string, fechaCorte = CORTE): Promise<{ readonly mensaje: MensajeChat; readonly ms: number }> {
    const inicio = Date.now();
    const r = await this.pedir("POST", "/chat/mensajes", { texto, fechaCorte });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    return { mensaje: (r.body as EstadoChat).mensajes.at(-1)!, ms: Date.now() - inicio };
  }
}

/** Bloque de transcripción con el formato de la evidencia de fase 6. */
export function transcribir(texto: string, m: MensajeChat, ms: number): string[] {
  return [`## ${texto}`, `ruta: ${m.ruta} · clasificación: ${m.clasificacion} · cifras verificadas: ${m.cifrasVerificadas} · ${(ms / 1000).toFixed(1)} s`,
    ...m.herramientas.map((t) => `herramienta: ${t.herramienta} (${t.origen}) ${t.estado} · corte ${t.fechaCorte ?? "-"} · args ${JSON.stringify(t.argumentos)} · ${(t.duracionMs / 1000).toFixed(1)} s`),
    `citas: ${m.citas.map((c) => `${c.documentoId} §${c.seccion}`).join("; ") || "ninguna"}`, `aviso: ${m.aviso ?? "ninguno"}`, `respuesta:\n${m.texto}\n`];
}
