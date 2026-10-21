import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { resolve } from "node:path";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { leerPaquete } from "../../src/persistencia/paquete-canonico.js";
import { cargarPostgres, reiniciar } from "../../src/persistencia/postgres.js";
import { crearServidorFinal } from "../../src/api/servidor-final.js";
import { crearServidorMcp } from "../../src/mcp/servidor-mcp.js";
import { Dinero } from "../../src/dominio/dinero.js";

// Fase 4: MCP sobre la MISMA instancia de casos de uso que la API, con PostgreSQL real. Nunca la base de demo.
const url = process.env["TEST_DATABASE_URL"];
if (!url || !new URL(url).pathname.endsWith("_test")) throw new Error("TEST_DATABASE_URL debe apuntar a una base exclusiva terminada en _test.");
const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 5000, max: 8 });
const CORTE = "2026-10-31";
let servidor: Server;
let base = "";
let mcp: Client;

// Justificación de any: navegación de respuestas JSON en la prueba; el servidor valida cada salida con Zod.
type Json = { [k: string]: any };
class Navegador {
  cookie = "";
  sesionId = "";
  async abrir() {
    const r = await fetch(`${base}/v1/sesion`);
    this.cookie = (r.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
    this.sesionId = ((await r.json()) as Json)["sesionId"];
    return this;
  }
  async pedir(metodo: string, ruta: string, cuerpo?: unknown, cabeceras: Record<string, string> = {}) {
    const r = await fetch(`${base}/v1${ruta}`, { method: metodo, headers: { "content-type": "application/json", cookie: this.cookie, ...cabeceras },
      ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo) }) });
    return { status: r.status, headers: r.headers, body: (await r.json()) as Json };
  }
  get(ruta: string) { return this.pedir("GET", ruta); }
  async confirmar(p: Json, conEvento = true) {
    const cabeceras: Record<string, string> = { "idempotency-key": p["claveIdempotencia"] };
    if (conEvento) cabeceras["x-evento-humano"] = (await this.pedir("POST", "/sesion/eventos-humanos",
      { operacion: "confirmarPago", objetivo: p["propuestaId"] })).body["eventoAprobacionId"];
    return this.pedir("POST", `/propuestas-pago/${p["propuestaId"]}/confirmacion`, { fechaOperacion: p["fechaCorte"], versionCredito: p["versionCredito"] }, cabeceras);
  }
}
const vinculada = new Navegador();
async function herramienta(name: string, args: Record<string, unknown>) {
  const r = (await mcp.callTool({ name, arguments: args })) as { structuredContent: Json; isError?: boolean; content: { text: string }[] };
  return { ...r, cuerpo: r.structuredContent };
}
const auditoria = async (propuestaId: string) => (await pool.query(`SELECT tipo, resultado, sujeto_id, sesion_id, proponente, canal_proponente,
  clave_idempotencia, fecha_operacion::text AS fecha FROM cv.auditoria_aprobaciones WHERE propuesta_id=$1 ORDER BY registrado_en, tipo`, [propuestaId])).rows;
const conteoPagos = async () => (await pool.query<{ n: number }>("SELECT count(*)::int AS n FROM cv.pagos")).rows[0]?.n;

beforeAll(async () => {
  await reiniciar(pool);
  await cargarPostgres(pool, await leerPaquete(resolve("datos/datos-proyecto-final")));
  const { app, casos } = crearServidorFinal(pool, { host: "127.0.0.1", puerto: 0, fechaCorteDefecto: CORTE, origenWeb: undefined,
    diasRetencionIdempotencia: 30, directorioWeb: undefined });
  servidor = app.listen(0, "127.0.0.1");
  await new Promise<void>((ok) => servidor.once("listening", () => ok()));
  base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
  await vinculada.abrir();
  // El backend fija el vínculo con la sesión de interfaz que abrió el chat; el modelo no lo elige.
  const servidorMcp = crearServidorMcp({ casos, sesion: { sesionId: vinculada.sesionId, perfil: "ASESOR", fechaCorteDefecto: CORTE } });
  const [a, b] = InMemoryTransport.createLinkedPair();
  mcp = new Client({ name: "chat-prueba", version: "1.0.0" });
  await Promise.all([servidorMcp.connect(b), mcp.connect(a)]);
}, 120000);
afterAll(async () => { await mcp.close(); await new Promise((ok) => servidor.close(ok)); await pool.end(); });

describe("fase 4: MCP y aprobación humana sobre PostgreSQL", () => {
  let propuestaOp1: Json;

  it("las siete consultas MCP devuelven lo mismo que la API (G-1 a G-7)", async () => {
    const pares: [string, Record<string, unknown>, string][] = [
      ["consultar_cartera", { inicioPeriodo: "2026-10-01" }, `/cartera?fechaCorte=${CORTE}&inicioPeriodo=2026-10-01`],
      ["consultar_cierre", { tipo: "MENSUAL" }, `/cierres?fechaCorte=${CORTE}&tipo=MENSUAL`],
      ["consultar_cierre", { tipo: "DIARIO" }, `/cierres?fechaCorte=${CORTE}&tipo=DIARIO`],
      ["listar_creditos_mora", { tramo: "MORA_3" }, `/cartera/mora?fechaCorte=${CORTE}&tramo=MORA_3`],
      ["consultar_credito", { creditoId: "CV-2026-0030" }, `/creditos/CV-2026-0030?fechaCorte=${CORTE}`],
      ["explicar_mora", { creditoId: "CV-2026-0030", numeroCuota: 3 }, `/creditos/CV-2026-0030/cuotas/3/mora?fechaCorte=${CORTE}`],
      ["proximos_vencimientos", { dias: 7 }, `/cartera/vencimientos?fechaCorte=${CORTE}&dias=7`],
      ["proximos_vencimientos", { dias: 30 }, `/cartera/vencimientos?fechaCorte=${CORTE}&dias=30`],
      ["explicar_mora", { creditoId: "CV-2026-0410", numeroCuota: 2, fechaCorte: "2027-01-24" }, "/creditos/CV-2026-0410/cuotas/2/mora?fechaCorte=2027-01-24"],
      ["calcular_deuda_cuota", { creditoId: "CV-2026-0043", numeroCuota: 1 }, `/creditos/CV-2026-0043/cuotas/1/deuda?fechaCorte=${CORTE}`],
    ];
    for (const [nombre, args, ruta] of pares) {
      const r = await herramienta(nombre, args);
      expect(r.isError, ruta).toBeFalsy();
      expect(r.cuerpo, ruta).toEqual((await vinculada.get(ruta)).body);
    }
  });

  it("proponer_pago crea una propuesta PENDIENTE sin efecto financiero y deja rastro del proponente MCP", async () => {
    const deuda = (await herramienta("calcular_deuda_cuota", { creditoId: "CV-2026-0043", numeroCuota: 1 })).cuerpo;
    const antes = { pagos: await conteoPagos(), credito: (await vinculada.get(`/creditos/CV-2026-0043?fechaCorte=${CORTE}`)).body };
    const r = await herramienta("proponer_pago", { creditoId: "CV-2026-0043", numeroCuota: 1, monto: deuda["totalExigible"], claveIdempotencia: "MCP-OP1-0043" });
    expect(r.isError).toBeFalsy();
    propuestaOp1 = r.cuerpo;
    expect(propuestaOp1).toMatchObject({ estado: "PENDIENTE", sesionId: vinculada.sesionId, monto: deuda["totalExigible"], estadoPrevisto: "EN_MORA" });
    const a = propuestaOp1["aplicacionPrevista"];
    expect(["gastosComisiones", "interesMoratorio", "interesCorriente", "capital"].reduce((s, k) => s.sumar(Dinero.desdeCadena(a[k].importe, "GTQ")),
      Dinero.cero("GTQ")).aCadena()).toBe(deuda["totalExigible"].importe);
    expect(await conteoPagos()).toBe(antes.pagos);
    expect((await vinculada.get(`/creditos/CV-2026-0043?fechaCorte=${CORTE}`)).body).toEqual(antes.credito);
    expect(await auditoria(propuestaOp1["propuestaId"])).toEqual([{ tipo: "PROPUESTA", resultado: "PENDIENTE", sujeto_id: "ASISTENTE-MCP",
      sesion_id: vinculada.sesionId, proponente: "ASISTENTE-MCP", canal_proponente: "MCP", clave_idempotencia: "MCP-OP1-0043", fecha: CORTE }]);
  });

  it("solo la sesión vinculada, con evento humano, confirma; la auditoría separa proponente y aprobador", async () => {
    const ajena = await new Navegador().abrir();
    expect((await ajena.confirmar(propuestaOp1)).body["errorCode"]).toBe("SESION_NO_AUTORIZADA");
    expect((await vinculada.confirmar(propuestaOp1, false)).body["errorCode"]).toBe("APROBACION_REQUERIDA");
    expect(await conteoPagos()).toBe(226);
    const c = await vinculada.confirmar(propuestaOp1);
    expect(c.status).toBe(201);
    expect(c.headers.get("idempotency-replayed")).toBe("false");
    expect(await conteoPagos()).toBe(227);
    const filas = await auditoria(propuestaOp1["propuestaId"]);
    expect(filas.find((f) => f["resultado"] === "CONFIRMADA")).toEqual({ tipo: "PAGO", resultado: "CONFIRMADA", sujeto_id: "ASESOR-DEMO",
      sesion_id: vinculada.sesionId, proponente: "ASISTENTE-MCP", canal_proponente: "MCP", clave_idempotencia: "MCP-OP1-0043", fecha: CORTE });
    const pago = (await pool.query("SELECT canal, usuario_proceso, propuesta_id, aprobacion_id IS NOT NULL AS aprobado FROM cv.pagos WHERE clave_idempotencia=$1",
      ["MCP-OP1-0043"])).rows[0];
    expect(pago).toEqual({ canal: "INTERFAZ", usuario_proceso: "ASISTENTE-MCP", propuesta_id: propuestaOp1["propuestaId"], aprobado: true });
    // Reintento con la misma clave: replay sin efecto adicional.
    const replay = await vinculada.confirmar(propuestaOp1);
    expect(replay.status).toBe(200);
    expect(replay.headers.get("idempotency-replayed")).toBe("true");
    expect(await conteoPagos()).toBe(227);
  });

  it("rechazos uniformes por MCP: monto no exacto con monto correcto, incobrable, cuota pagada, fecha inválida y clave repetida", async () => {
    const deuda0061 = (await herramienta("calcular_deuda_cuota", { creditoId: "CV-2026-0061", numeroCuota: 1 })).cuerpo;
    const deuda0043 = (await herramienta("calcular_deuda_cuota", { creditoId: "CV-2026-0043", numeroCuota: 2 })).cuerpo;
    const deuda0015 = (await herramienta("calcular_deuda_cuota", { creditoId: "CV-2026-0015", numeroCuota: 3 })).cuerpo;
    const casos: [Record<string, unknown>, string][] = [
      [{ creditoId: "CV-2026-0061", numeroCuota: 1, monto: { importe: "500.00", moneda: "GTQ" }, claveIdempotencia: "MCP-OP5" }, "MONTO_NO_EXACTO"],
      [{ creditoId: "CV-2026-0015", numeroCuota: 3, monto: deuda0015["totalExigible"], claveIdempotencia: "MCP-OP6" }, "CREDITO_INCOBRABLE"],
      [{ creditoId: "CV-2026-0043", numeroCuota: 1, monto: { importe: "1.00", moneda: "GTQ" }, claveIdempotencia: "MCP-PAGADA" }, "CUOTA_YA_PAGADA"],
      [{ creditoId: "CV-2026-0043", numeroCuota: 2, monto: deuda0043["totalExigible"], claveIdempotencia: "MCP-FECHA", fechaCorte: "2026-02-30" }, "FECHA_INVALIDA"],
      [{ creditoId: "CV-2026-0043", numeroCuota: 2, monto: deuda0043["totalExigible"], claveIdempotencia: "MCP-OP1-0043" }, "CONFLICTO_IDEMPOTENCIA"],
    ];
    const pagos = await conteoPagos();
    for (const [args, codigo] of casos) {
      const r = await herramienta("proponer_pago", args);
      expect(r.isError, codigo).toBe(true);
      expect(r.cuerpo["errorCode"], codigo).toBe(codigo);
      expect(r.content[0]?.text, codigo).not.toMatch(/SELECT|cv\.|\bat\s|DPI-FICT|5555-\d{4}|postgres/i);
    }
    expect((await herramienta("proponer_pago", casos[0]![0])).cuerpo["montoCorrecto"]).toEqual(deuda0061["totalExigible"]);
    expect(await conteoPagos()).toBe(pagos);
  });

  it("concurrencia: dos confirmaciones simultáneas aplican un solo pago y una propuesta rival queda obsoleta", async () => {
    const deuda = (await herramienta("calcular_deuda_cuota", { creditoId: "CV-2026-0061", numeroCuota: 1 })).cuerpo;
    const a = (await herramienta("proponer_pago", { creditoId: "CV-2026-0061", numeroCuota: 1, monto: deuda["totalExigible"], claveIdempotencia: "MCP-CONC-A" })).cuerpo;
    const b = (await herramienta("proponer_pago", { creditoId: "CV-2026-0061", numeroCuota: 1, monto: deuda["totalExigible"], claveIdempotencia: "MCP-CONC-B" })).cuerpo;
    const pagos = await conteoPagos();
    const [r1, r2] = await Promise.all([vinculada.confirmar(a), vinculada.confirmar(a)]);
    expect([r1.status, r2.status].sort()).toEqual([200, 201]);
    expect(r1.body["pago"].pagoId).toBe(r2.body["pago"].pagoId);
    expect(await conteoPagos()).toBe((pagos ?? 0) + 1);
    expect((await vinculada.confirmar(b)).body["errorCode"]).toBe("PROPUESTA_OBSOLETA");
    expect(await conteoPagos()).toBe((pagos ?? 0) + 1);
  });
});
