import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Pool } from "pg";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { leerPaquete } from "../../src/persistencia/paquete-canonico.js";
import { cargarPostgres, reiniciar } from "../../src/persistencia/postgres.js";
import { crearServidorFinal } from "../../src/api/servidor-final.js";
import { Dinero } from "../../src/dominio/dinero.js";

// Fase 3: API Express real sobre PostgreSQL real. Nunca usa la base de demo.
const url = process.env["TEST_DATABASE_URL"];
if (!url || !new URL(url).pathname.endsWith("_test")) throw new Error("TEST_DATABASE_URL debe apuntar a una base exclusiva terminada en _test.");
const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 5000, max: 6 });
const CORTE = "2026-10-31";
let servidor: Server;
let base = "";

/** Oráculo independiente de fase 0 (Python), no producido por el código bajo prueba. */
const oraculo = JSON.parse(readFileSync("docs/proyecto-final/evidencia/reproduccion.json", "utf8")) as {
  situaciones_guion: Record<string, { pagadas: number; vencidas: number; dias_atraso: number; saldo_capital_centavos: number }>;
};

// Justificación de any: navegación de respuestas JSON en la prueba; el servidor ya valida cada salida con Zod.
type Json = { [k: string]: any };
class Cliente {
  cookie = "";
  async sesion() {
    const r = await fetch(`${base}/v1/sesion`, { headers: this.cookie ? { cookie: this.cookie } : {} });
    const set = r.headers.get("set-cookie");
    if (set) this.cookie = set.split(";")[0]!;
    return (await r.json()) as Json;
  }
  async pedir(metodo: string, ruta: string, cuerpo?: unknown, cabeceras: Record<string, string> = {}) {
    const r = await fetch(`${base}/v1${ruta}`, { method: metodo, headers: { "content-type": "application/json",
      ...(this.cookie ? { cookie: this.cookie } : {}), ...cabeceras }, ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo) }) });
    return { status: r.status, headers: r.headers, body: (await r.json()) as Json };
  }
  get(ruta: string) { return this.pedir("GET", ruta); }
  async evento(operacion: string, objetivo: string) {
    const r = await this.pedir("POST", "/sesion/eventos-humanos", { operacion, objetivo });
    expect(r.status).toBe(201);
    return String(r.body["eventoAprobacionId"]);
  }
  async humano(operacion: string, objetivo: string, ruta: string, cuerpo: unknown, extra: Record<string, string> = {}) {
    return this.pedir("POST", ruta, cuerpo, { "x-evento-humano": await this.evento(operacion, objetivo), ...extra });
  }
  async perfil(perfil: "ASESOR" | "GERENCIA") { expect((await this.pedir("POST", "/sesion/perfil", { perfil })).status).toBe(200); }
  async proponer(creditoId: string, numeroCuota: number, importe: string, clave: string) {
    return this.pedir("POST", `/creditos/${creditoId}/propuestas-pago`, { fechaCorte: CORTE, numeroCuota,
      monto: { importe, moneda: "GTQ" }, claveIdempotencia: clave });
  }
  async confirmar(propuesta: Json, clave = String(propuesta["claveIdempotencia"])) {
    return this.humano("confirmarPago", String(propuesta["propuestaId"]), `/propuestas-pago/${String(propuesta["propuestaId"])}/confirmacion`,
      { fechaOperacion: CORTE, versionCredito: propuesta["versionCredito"] }, { "idempotency-key": clave });
  }
}
const gtq = (importe: string) => Dinero.desdeCadena(importe, "GTQ");
const asesor = new Cliente();

beforeAll(async () => {
  await reiniciar(pool);
  await cargarPostgres(pool, await leerPaquete(resolve("datos/datos-proyecto-final")));
  const { app } = crearServidorFinal(pool, { host: "127.0.0.1", puerto: 0, fechaCorteDefecto: CORTE, origenWeb: "http://localhost:5173",
    diasRetencionIdempotencia: 30, directorioWeb: undefined });
  servidor = app.listen(0, "127.0.0.1");
  await new Promise<void>((ok) => servidor.once("listening", () => ok()));
  base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
  await asesor.sesion();
}, 60000);
afterAll(async () => { await new Promise((ok) => servidor.close(ok)); await pool.end(); });

describe("fase 3: API HTTP sobre núcleo y PostgreSQL", () => {
  const pagosOp: Json[] = [];
  let carteraInicial: Json;

  it("exige sesión del servidor y rechaza escrituras de otra origen", async () => {
    const anonimo = new Cliente();
    expect((await anonimo.get(`/creditos/CV-2026-0043?fechaCorte=${CORTE}`)).body["errorCode"]).toBe("SESION_NO_AUTORIZADA");
    const r = await asesor.pedir("POST", "/sesion/perfil", { perfil: "ASESOR" }, { origin: "http://sitio-ajeno.example" });
    expect(r.status).toBe(403);
    expect(r.headers.get("content-type")).toContain("application/problem+json");
  });

  it("estados de entrada del guion coinciden con la reproducción independiente de fase 0", async () => {
    for (const [creditoId, esperado] of Object.entries(oraculo.situaciones_guion)) {
      const r = await asesor.get(`/creditos/${creditoId}?fechaCorte=${CORTE}`);
      expect(r.status, creditoId).toBe(200);
      expect({ pagadas: r.body["cuotasPagadas"], vencidas: r.body["cuotasVencidas"], dias: r.body["diasAtraso"],
        saldo: gtq(r.body["saldoCapital"].importe).aUnidadesMenores() }, creditoId).toEqual({ pagadas: esperado.pagadas,
        vencidas: esperado.vencidas, dias: esperado.dias_atraso, saldo: BigInt(esperado.saldo_capital_centavos) });
    }
    expect((await asesor.get(`/creditos/CV-2026-0015?fechaCorte=${CORTE}`)).body["estado"]).toBe("INCOBRABLE");
    carteraInicial = (await asesor.get(`/cartera?fechaCorte=${CORTE}&inicioPeriodo=2026-10-01`)).body;
    expect(carteraInicial["desglose"].incobrablesDelPeriodo.creditos.map((c: Json) => c["creditoId"])).toEqual(["CV-2026-0015", "CV-2026-0022"]);
  });

  it("OP-1: propuesta con prelación, aprobación humana obligatoria y estado posterior", async () => {
    const deuda = (await asesor.get(`/creditos/CV-2026-0043/cuotas/1/deuda?fechaCorte=${CORTE}`)).body;
    const p = await asesor.proponer("CV-2026-0043", 1, deuda["totalExigible"].importe, "OP1-CV-2026-0043");
    expect(p.status).toBe(201);
    expect(p.body["estado"]).toBe("PENDIENTE");
    expect(p.body["estadoPrevisto"]).toBe("EN_MORA");
    const a = p.body["aplicacionPrevista"];
    expect(["gastosComisiones", "interesMoratorio", "interesCorriente", "capital"].reduce((s, k) => s.sumar(gtq(a[k].importe)), gtq("0.00"))
      .aCadena()).toBe(deuda["totalExigible"].importe);
    // Sin evento humano de interfaz no hay escritura.
    const sinEvento = await asesor.pedir("POST", `/propuestas-pago/${p.body["propuestaId"]}/confirmacion`,
      { fechaOperacion: CORTE, versionCredito: 0 }, { "idempotency-key": "OP1-CV-2026-0043" });
    expect(sinEvento.body["errorCode"]).toBe("APROBACION_REQUERIDA");
    expect((await asesor.confirmar(p.body, "OTRA-CLAVE")).body["errorCode"]).toBe("CONFLICTO_IDEMPOTENCIA");
    const c = await asesor.confirmar(p.body);
    expect(c.status).toBe(201);
    expect(c.headers.get("idempotency-replayed")).toBe("false");
    expect(c.body["pago"].aplicacion).toEqual({ ...a });
    pagosOp.push(c.body["pago"]);
    const despues = (await asesor.get(`/creditos/CV-2026-0043?fechaCorte=${CORTE}`)).body;
    expect(despues).toMatchObject({ estado: "EN_MORA", cuotasPagadas: 1, cuotasVencidas: 1, versionCredito: 1 });
    expect(despues["proximaCuota"].numeroCuota).toBe(2);
  });

  it("OP-2: detalle de mora de la cuota más antigua y su pago", async () => {
    const mora = (await asesor.get(`/creditos/CV-2026-0035/cuotas/2/mora?fechaCorte=${CORTE}`)).body;
    expect(mora["cuotas"][0]).toMatchObject({ diasAtraso: 70, tramo: "MORA_3", politicaId: "POL-2024-01" });
    expect(mora["cuotas"][0].detalle.tramos).toHaveLength(1);
    expect((await asesor.proponer("CV-2026-0035", 3, "1.00", "OP2-FUERA-DE-ORDEN")).body["errorCode"]).toBe("CUOTA_FUERA_DE_ORDEN");
    const deuda = (await asesor.get(`/creditos/CV-2026-0035/cuotas/2/deuda?fechaCorte=${CORTE}`)).body;
    expect(deuda["interesMoratorio"]).toEqual(mora["cuotas"][0].interesMoratorio);
    const p = await asesor.proponer("CV-2026-0035", 2, deuda["totalExigible"].importe, "OP2-CV-2026-0035");
    const c = await asesor.confirmar(p.body);
    expect(c.status).toBe(201);
    pagosOp.push(c.body["pago"]);
  });

  it("OP-3: alta sin teléfono, solicitud, simulación, comité por perfil gerencia y desembolso", async () => {
    const alta = { clienteId: "CL-9001", nombreCompleto: "Gerencia Demostración Gálvez",
      identificadorLegal: { tipo: "DPI", valor: "DPI-FICT-009001" }, municipio: "Guatemala", fechaAlta: CORTE };
    expect((await asesor.humano("altaCliente", "CL-9001", "/clientes", alta)).status).toBe(201);
    expect((await asesor.humano("altaCliente", "CL-9001", "/clientes", alta)).body["errorCode"]).toBe("CLIENTE_YA_EXISTE");
    const solicitud = { creditoId: "CV-2026-9001", clienteId: "CL-9001", asesorId: "AS-01", monto: { importe: "10000.00", moneda: "GTQ" },
      plazoMeses: 12, tasaNominalAnual: "0.36", fechaSolicitud: CORTE };
    const s = await asesor.humano("solicitarCredito", "CV-2026-9001", "/creditos", solicitud);
    expect(s.status).toBe(201);
    expect(s.body["estado"]).toBe("SOLICITADO");
    const sim = await asesor.pedir("POST", "/planes/simulacion", { monto: solicitud.monto, plazoMeses: 12, tasaNominalAnual: "0.36", fechaDesembolso: CORTE });
    expect(sim.body["cuotas"]).toHaveLength(12);
    expect(sim.body["cuotas"][0].fechaVencimiento).toBe("2026-11-30");
    const decision = { fechaOperacion: CORTE, motivo: "Comité de demostración" };
    const sinAprobar = await asesor.humano("desembolsarCredito", "CV-2026-9001", "/creditos/CV-2026-9001/desembolso", decision);
    expect(sinAprobar.body["errorCode"]).toBe("TRANSICION_INVALIDA");
    expect((await asesor.humano("aprobarCredito", "CV-2026-9001", "/creditos/CV-2026-9001/aprobacion", decision)).body["errorCode"])
      .toBe("SESION_NO_AUTORIZADA");
    await asesor.perfil("GERENCIA");
    expect((await asesor.humano("aprobarCredito", "CV-2026-9001", "/creditos/CV-2026-9001/aprobacion", decision)).body["estado"]).toBe("APROBADO");
    await asesor.perfil("ASESOR");
    const d = await asesor.humano("desembolsarCredito", "CV-2026-9001", "/creditos/CV-2026-9001/desembolso", decision);
    expect(d.body).toMatchObject({ estado: "VIGENTE", saldoCapital: { importe: "10000.00", moneda: "GTQ" }, diasAtraso: 0 });
    const plan = (await asesor.get(`/creditos/CV-2026-9001/plan?fechaCorte=${CORTE}`)).body;
    expect(plan["cuotas"]).toEqual(sim.body["cuotas"]);
    const ficha = (await asesor.get(`/creditos/CV-2026-9001/ficha?fechaCorte=${CORTE}`)).body;
    expect(ficha["politicaId"]).toBe("POL-2026-10");
    expect(ficha["historial"].map((t: Json) => t["estadoNuevo"])).toEqual(["APROBADO", "DESEMBOLSADO", "VIGENTE"]);
  });

  it("OP-4: reintento con la misma clave devuelve el pago original sin efecto adicional", async () => {
    const pagos = (await asesor.get(`/creditos/CV-2026-0043/pagos?fechaCorte=${CORTE}`)).body["pagos"] as Json[];
    const original = pagos.find((p) => p["claveIdempotencia"] === "OP1-CV-2026-0043")!;
    const r = await asesor.confirmar({ propuestaId: original["propuestaId"], claveIdempotencia: "OP1-CV-2026-0043", versionCredito: 0 });
    expect(r.status).toBe(200);
    expect(r.headers.get("idempotency-replayed")).toBe("true");
    expect(r.body["repetido"]).toBe(true);
    expect(r.body["pago"].pagoId).toBe(original["pagoId"]);
    expect((await asesor.get(`/creditos/CV-2026-0043/pagos?fechaCorte=${CORTE}`)).body["pagos"]).toHaveLength(pagos.length);
    expect((await asesor.get(`/creditos/CV-2026-0043?fechaCorte=${CORTE}`)).body["versionCredito"]).toBe(1);
  });

  it("OP-5: monto no exacto devuelve el monto correcto del núcleo", async () => {
    const deuda = (await asesor.get(`/creditos/CV-2026-0061/cuotas/1/deuda?fechaCorte=${CORTE}`)).body;
    const r = await asesor.proponer("CV-2026-0061", 1, "500.00", "OP5-CV-2026-0061");
    expect(r.status).toBe(422);
    expect(r.body["errorCode"]).toBe("MONTO_NO_EXACTO");
    expect(r.body["montoCorrecto"]).toEqual(deuda["totalExigible"]);
  });

  it("OP-6: crédito incobrable rechaza el pago", async () => {
    const deuda = (await asesor.get(`/creditos/CV-2026-0015/cuotas/3/deuda?fechaCorte=${CORTE}`)).body;
    const r = await asesor.proponer("CV-2026-0015", 3, deuda["totalExigible"].importe, "OP6-CV-2026-0015");
    expect(r.status).toBe(409);
    expect(r.body["errorCode"]).toBe("CREDITO_INCOBRABLE");
  });

  it("G-2/G-3: cierres concilian con la prelación registrada y se generan una sola vez", async () => {
    const diario = (await asesor.get(`/cierres?fechaCorte=${CORTE}&tipo=DIARIO`)).body;
    expect(diario["estado"]).toBe("PREVIO");
    expect(diario["desembolsos"]).toEqual({ cantidad: 1, monto: { importe: "10000.00", moneda: "GTQ" } });
    expect(diario["recuperaciones"].cantidad).toBe(2);
    for (const [concepto, campo] of [["gastosComisiones", "gastosComisiones"], ["interesMoratorio", "interesMoratorio"],
      ["interesCorriente", "interesCorriente"], ["capital", "capital"]] as const) {
      expect(diario["recuperaciones"][campo].importe).toBe(pagosOp.reduce<Dinero>((s, p) => s.sumar(gtq(p["aplicacion"][concepto].importe)), gtq("0.00")).aCadena());
    }
    const mensual = (await asesor.get(`/cierres?fechaCorte=${CORTE}&tipo=MENSUAL`)).body;
    expect(mensual["inicioPeriodo"]).toBe("2026-10-01");
    expect(mensual["cartera"]).toEqual((await asesor.get(`/cartera?fechaCorte=${CORTE}&inicioPeriodo=2026-10-01`)).body);
    const asesorGenera = await asesor.humano("generarCierre", `DIARIO:${CORTE}`, "/cierres", { fechaCorte: CORTE, tipo: "DIARIO" });
    expect(asesorGenera.body["errorCode"]).toBe("SESION_NO_AUTORIZADA");
    await asesor.perfil("GERENCIA");
    const g1 = await asesor.humano("generarCierre", `DIARIO:${CORTE}`, "/cierres", { fechaCorte: CORTE, tipo: "DIARIO" });
    expect(g1.status).toBe(201);
    expect(g1.body).toMatchObject({ estado: "GENERADO", cierreId: `CIERRE-DIARIO-${CORTE}-${CORTE}` });
    const g2 = await asesor.humano("generarCierre", `DIARIO:${CORTE}`, "/cierres", { fechaCorte: CORTE, tipo: "DIARIO" });
    expect(g2.status).toBe(200);
    expect(g2.body).toEqual(g1.body);
    await asesor.perfil("ASESOR");
  });

  it("G-1/G-4: cartera tras las operaciones concilia con los pagos y la lista por tramo", async () => {
    const despues = (await asesor.get(`/cartera?fechaCorte=${CORTE}&inicioPeriodo=2026-10-01`)).body;
    const capitalPagado = pagosOp.reduce<Dinero>((s, p) => s.sumar(gtq(p["aplicacion"].capital.importe)), gtq("0.00"));
    expect(gtq(despues["carteraActiva"].importe).aCadena())
      .toBe(gtq(carteraInicial["carteraActiva"].importe).sumar(gtq("10000.00")).restar(capitalPagado).aCadena());
    for (const tramo of ["MORA_2", "MORA_3", "VENCIDO"]) {
      const fila = despues["desglose"].tramosEnRiesgo.find((t: Json) => t["tramo"] === tramo);
      const lista = (await asesor.get(`/cartera/mora?fechaCorte=${CORTE}&tramo=${tramo}`)).body["creditos"] as Json[];
      expect(lista.length, tramo).toBe(fila.cantidadCreditos);
      expect(lista.reduce<Dinero>((s, c) => s.sumar(gtq(c["saldoCapital"].importe)), gtq("0.00")).aCadena(), tramo).toBe(fila.saldoCapital.importe);
    }
  });

  it("G-6: ventana (corte, corte + N] y cuotas pendientes", async () => {
    const r = (await asesor.get(`/cartera/vencimientos?fechaCorte=${CORTE}&dias=30`)).body;
    expect(r["hastaIncluido"]).toBe("2026-11-30");
    expect(r["cuotas"].every((q: Json) => q["fechaVencimiento"] > CORTE && q["fechaVencimiento"] <= "2026-11-30")).toBe(true);
    expect(r["cuotas"].some((q: Json) => q["creditoId"] === "CV-2026-9001" && q["numeroCuota"] === 1)).toBe(true);
    expect(r["cantidad"]).toBe(r["cuotas"].length);
  });

  it("rechaza cuota ya pagada, clave repetida con otro contenido y fecha inválida", async () => {
    expect((await asesor.proponer("CV-2026-0043", 1, "1.00", "OTRA-CUOTA-PAGADA")).body["errorCode"]).toBe("CUOTA_YA_PAGADA");
    const deuda2 = (await asesor.get(`/creditos/CV-2026-0043/cuotas/2/deuda?fechaCorte=${CORTE}`)).body;
    expect((await asesor.proponer("CV-2026-0043", 2, deuda2["totalExigible"].importe, "OP1-CV-2026-0043")).body["errorCode"])
      .toBe("CONFLICTO_IDEMPOTENCIA");
    const r = await asesor.get("/creditos/CV-2026-0043?fechaCorte=2026-02-30");
    expect(r.status).toBe(422);
    expect(r.body["errorCode"]).toBe("FECHA_INVALIDA");
  });

  it("propuesta obsoleta, de otra sesión o cancelada no se confirma", async () => {
    const deuda = (await asesor.get(`/creditos/CV-2026-0061/cuotas/1/deuda?fechaCorte=${CORTE}`)).body;
    const total = deuda["totalExigible"].importe;
    const a = (await asesor.proponer("CV-2026-0061", 1, total, "OBSOLETA-A")).body;
    const b = (await asesor.proponer("CV-2026-0061", 1, total, "OBSOLETA-B")).body;
    const ajena = new Cliente();
    await ajena.sesion();
    expect((await ajena.confirmar(a)).body["errorCode"]).toBe("SESION_NO_AUTORIZADA");
    const cancelada = await asesor.humano("cancelarPropuesta", String(a["propuestaId"]),
      `/propuestas-pago/${String(a["propuestaId"])}/cancelacion`, { fechaOperacion: CORTE });
    expect(cancelada.body["estado"]).toBe("CANCELADA");
    expect((await asesor.confirmar(a)).body["errorCode"]).toBe("PROPUESTA_OBSOLETA");
    expect((await asesor.confirmar(b)).status).toBe(201);
    const c = (await asesor.proponer("CV-2026-0061", 2, "1.00", "OBSOLETA-C")).body;
    expect(c["errorCode"]).toBe("MONTO_NO_EXACTO");
  });

  it("un evento humano es de un solo uso y ligado a su objetivo", async () => {
    const evento = await asesor.evento("cancelarPropuesta", "PROP-INEXISTENTE");
    const r1 = await asesor.pedir("POST", "/propuestas-pago/PROP-OTRA/cancelacion", { fechaOperacion: CORTE }, { "x-evento-humano": evento });
    expect(r1.body["errorCode"]).toBe("APROBACION_REQUERIDA");
    const r2 = await asesor.pedir("POST", "/propuestas-pago/PROP-INEXISTENTE/cancelacion", { fechaOperacion: CORTE }, { "x-evento-humano": evento });
    expect(r2.body["errorCode"]).toBe("PROPUESTA_NO_EXISTE");
    const r3 = await asesor.pedir("POST", "/propuestas-pago/PROP-INEXISTENTE/cancelacion", { fechaOperacion: CORTE }, { "x-evento-humano": evento });
    expect(r3.body["errorCode"]).toBe("APROBACION_REQUERIDA");
  });

  it("el reloj del sistema no cambia ninguna cifra al corte explícito", async () => {
    const antes = await Promise.all([`/creditos/CV-2026-0030?fechaCorte=${CORTE}`, `/cartera?fechaCorte=${CORTE}&inicioPeriodo=2026-10-01`,
      `/cierres?fechaCorte=${CORTE}&tipo=MENSUAL`].map(async (r) => (await asesor.get(r)).body));
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2027-11-15T12:00:00Z"));
    try {
      const despues = await Promise.all([`/creditos/CV-2026-0030?fechaCorte=${CORTE}`, `/cartera?fechaCorte=${CORTE}&inicioPeriodo=2026-10-01`,
        `/cierres?fechaCorte=${CORTE}&tipo=MENSUAL`].map(async (r) => (await asesor.get(r)).body));
      expect(despues).toEqual(antes);
    } finally { vi.useRealTimers(); }
  });

  it("los listados de interfaz no exponen DPI ni teléfono", async () => {
    const texto = JSON.stringify((await asesor.get(`/clientes?fechaCorte=${CORTE}`)).body);
    expect(texto).not.toMatch(/DPI-FICT|5555-\d{4}/);
    expect(texto).toContain("CL-9001");
  });
});
