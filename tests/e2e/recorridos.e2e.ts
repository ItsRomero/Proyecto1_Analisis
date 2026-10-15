import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";
import { leerPaquete } from "../../src/persistencia/paquete-canonico.js";
import { cargarPostgres, reiniciar } from "../../src/persistencia/postgres.js";
import { crearServidorFinal } from "../../src/api/servidor-final.js";
import { formatearDinero, formatearFecha } from "../../web/src/formato.js";

/*
 * Fase 3: ensayo del guion OP-1 a OP-6 y de los tres flujos sobre una base recién cargada
 * (reinicio + carga en TEST_DATABASE_URL), con la interfaz compilada servida por la API real.
 * Las expectativas se leen de la API (núcleo) en el momento; ninguna cifra está escrita aquí.
 */
const url = process.env["TEST_DATABASE_URL"];
if (!url || !new URL(url).pathname.endsWith("_test")) throw new Error("TEST_DATABASE_URL debe apuntar a una base exclusiva terminada en _test.");
if (!existsSync("web/dist/index.html")) throw new Error("Falta web/dist: ejecute npm run web:build (npm run test:e2e lo hace).");
const CORTE = "2026-10-31";
const CAPTURAS = resolve("docs/proyecto-final/evidencia/capturas");
const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 5000, max: 6 });
let servidor: Server;
let base = "";
let navegador: Browser;
let contexto: BrowserContext;
let pagina: Page;
const solicitudes: string[] = [];
const respuestas500: string[] = [];
let cookieApi = "";

// Justificación de any: lectura de respuestas JSON de la API en la prueba; el servidor valida su contrato.
async function api(ruta: string): Promise<any> {
  const r = await fetch(`${base}/v1${ruta}`, { headers: { cookie: cookieApi } });
  if (!r.ok) throw new Error(`${ruta}: ${r.status}`);
  return r.json();
}
async function capturar(nombre: string, completa = true) {
  await pagina.waitForLoadState("networkidle");
  await pagina.screenshot({ path: join(CAPTURAS, `fase3-${nombre}.png`), fullPage: completa });
}
const textoMonto = (importe: string) => formatearDinero({ importe, moneda: "GTQ" });

beforeAll(async () => {
  mkdirSync(CAPTURAS, { recursive: true });
  await reiniciar(pool);
  await cargarPostgres(pool, await leerPaquete(resolve("datos/datos-proyecto-final")));
  const { app } = crearServidorFinal(pool, { host: "127.0.0.1", puerto: 0, fechaCorteDefecto: CORTE, origenWeb: undefined,
    diasRetencionIdempotencia: 30, directorioWeb: "web/dist" });
  servidor = app.listen(0, "127.0.0.1");
  await new Promise<void>((ok) => servidor.once("listening", () => ok()));
  base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
  const s = await fetch(`${base}/v1/sesion`);
  cookieApi = (s.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
  navegador = await chromium.launch({ channel: process.env["E2E_CANAL_NAVEGADOR"] ?? "chrome", headless: true });
  contexto = await navegador.newContext({ viewport: { width: 375, height: 812 }, locale: "es-GT" });
  pagina = await contexto.newPage();
  pagina.on("request", (r) => solicitudes.push(r.url()));
  pagina.on("response", (r) => { if (r.status() >= 500) respuestas500.push(`${r.status()} ${r.url()}`); });
}, 120000);
afterAll(async () => {
  await navegador?.close();
  await new Promise((ok) => servidor.close(ok));
  await pool.end();
});

async function pagarCuotaMasAntigua(creditoId: string, prefijo: string) {
  const resumen = await api(`/creditos/${creditoId}?fechaCorte=${CORTE}`);
  const deuda = await api(`/creditos/${creditoId}/cuotas/${resumen.proximaCuota.numeroCuota}/deuda?fechaCorte=${CORTE}`);
  await pagina.getByRole("link", { name: "Registrar pago", exact: true }).click();
  const monto = pagina.getByLabel("Monto recibido (Q)");
  await expect.poll(() => monto.inputValue()).toBe(deuda.totalExigible.importe);
  await pagina.getByRole("button", { name: "Revisar prelación" }).click();
  const prelacion = pagina.getByRole("region", { name: "Prelación de aplicación" });
  await prelacion.waitFor();
  expect(await prelacion.textContent()).toContain(textoMonto(deuda.interesMoratorio.importe));
  await capturar(`${prefijo}-prelacion-antes-de-aprobar`);
  await pagina.getByRole("button", { name: "Aprobar pago" }).click();
  await pagina.getByRole("button", { name: "Confirmar pago" }).click();
  await pagina.getByText("Pago aplicado", { exact: true }).waitFor();
  const posterior = await api(`/creditos/${creditoId}?fechaCorte=${CORTE}`);
  expect(posterior.cuotasPagadas).toBe(resumen.cuotasPagadas + 1);
  await capturar(`${prefijo}-comprobante-y-estado-posterior`);
  return posterior;
}

describe("fase 3: guion OP-1 a OP-6 y flujos obligatorios en navegador", () => {
  it("flujo 2 — OP-1: buscar cliente, saldo/tramo, prelación, aprobación, comprobante y estado posterior", async () => {
    await pagina.goto(`${base}/asesor/clientes`);
    await pagina.getByPlaceholder("Buscar cliente, municipio o crédito…").fill("CV-2026-0043");
    await pagina.getByRole("link", { name: /CV-2026-0043/ }).click();
    const ficha = await api(`/creditos/CV-2026-0043/ficha?fechaCorte=${CORTE}`);
    await pagina.getByRole("heading", { name: ficha.nombreCliente }).waitFor();
    expect(await pagina.getByRole("region", { name: "Resumen del crédito" }).textContent()).toContain(textoMonto(ficha.resumen.saldoCapital.importe));
    await capturar("op1-detalle-del-credito");
    const posterior = await pagarCuotaMasAntigua("CV-2026-0043", "op1");
    expect(posterior.estado).toBe("EN_MORA");
  });

  it("OP-2: detalle de mora de CV-2026-0035 y pago de su cuota vencida más antigua", async () => {
    await pagina.goto(`${base}/asesor/creditos/CV-2026-0035/mora`);
    const mora = await api(`/creditos/CV-2026-0035/cuotas/2/mora?fechaCorte=${CORTE}`);
    const tarjeta = pagina.getByRole("region", { name: "Cuota 2" });
    await tarjeta.getByText("Interés moratorio (redondeado por el núcleo)").waitFor();
    expect(await tarjeta.textContent()).toContain(textoMonto(mora.cuotas[0].interesMoratorio.importe));
    expect(await tarjeta.textContent()).toContain("POL-2024-01");
    await capturar("op2-detalle-de-mora");
    await pagina.goto(`${base}/asesor/creditos/CV-2026-0035`);
    await pagarCuotaMasAntigua("CV-2026-0035", "op2");
  });

  it("flujo 1 — OP-3: alta sin teléfono, solicitud, simulación, confirmación, comité y desembolso", async () => {
    await pagina.goto(`${base}/asesor/creditos/nuevo`);
    await pagina.getByLabel("Código de cliente").fill("CL-9001");
    await pagina.getByLabel("Nombre completo").fill("Gerencia Demostración Gálvez");
    await pagina.getByLabel("DPI").fill("DPI-FICT-009001");
    await pagina.getByLabel("Municipio").fill("Guatemala");
    await capturar("op3-1-alta-del-cliente");
    await pagina.getByRole("button", { name: "Dar de alta y continuar" }).click();
    await pagina.getByLabel("Número de crédito").fill("CV-2026-9001");
    await pagina.getByLabel("Asesor responsable").selectOption("AS-01");
    await pagina.getByLabel("Monto (Q)").fill("10000");
    await pagina.getByLabel("Plazo (meses)").selectOption("12");
    await pagina.getByLabel("Tasa nominal anual (%)").fill("36");
    await pagina.getByRole("button", { name: "Simular plan" }).click();
    await pagina.getByRole("region", { name: "Plan simulado" }).waitFor();
    expect(await pagina.getByRole("table").textContent()).toContain(formatearFecha("2026-11-30"));
    await capturar("op3-2-plan-simulado");
    await pagina.getByRole("button", { name: "Confirmar", exact: true }).click();
    await pagina.getByRole("button", { name: "Registrar solicitud" }).click();
    await pagina.getByRole("button", { name: "Cambiar a perfil Gerencia" }).click();
    await pagina.getByRole("button", { name: "Aprobar en comité" }).waitFor();
    await capturar("op3-3-comite-perfil-gerencia");
    await pagina.getByRole("button", { name: "Aprobar en comité" }).click();
    await pagina.getByRole("button", { name: "Volver a perfil Asesor" }).click();
    await pagina.getByRole("button", { name: "Desembolsar" }).click();
    await pagina.getByRole("region", { name: "Crédito desembolsado" }).waitFor();
    const r = await api(`/creditos/CV-2026-9001?fechaCorte=${CORTE}`);
    expect(r).toMatchObject({ estado: "VIGENTE", proximaCuota: { numeroCuota: 1, fechaVencimiento: "2026-11-30" } });
    expect((await api(`/creditos/CV-2026-9001/ficha?fechaCorte=${CORTE}`)).historial.map((t: { estadoNuevo: string }) => t.estadoNuevo))
      .toEqual(["APROBADO", "DESEMBOLSADO", "VIGENTE"]);
    await capturar("op3-4-desembolso");
  });

  it("OP-4: reintento de OP-1 con la misma clave, sin aplicar el pago otra vez", async () => {
    const pagos = (await api(`/creditos/CV-2026-0043/pagos?fechaCorte=${CORTE}`)).pagos as { pagoId: string }[];
    await pagina.goto(`${base}/asesor/creditos/CV-2026-0043`);
    await pagina.getByRole("link", { name: /Cuota 1/ }).click();
    await pagina.getByRole("button", { name: "Reintentar envío con la misma clave" }).click();
    await pagina.getByText("Reintento detectado: sin efecto adicional").waitFor();
    expect((await api(`/creditos/CV-2026-0043/pagos?fechaCorte=${CORTE}`)).pagos).toHaveLength(pagos.length);
    await capturar("op4-reintento-misma-clave");
  });

  it("OP-5: Q500.00 sobre CV-2026-0061 se rechaza y muestra el monto correcto del núcleo", async () => {
    const deuda = await api(`/creditos/CV-2026-0061/cuotas/1/deuda?fechaCorte=${CORTE}`);
    await pagina.goto(`${base}/asesor/creditos/CV-2026-0061/pagos/nuevo`);
    const monto = pagina.getByLabel("Monto recibido (Q)");
    await expect.poll(() => monto.inputValue()).toBe(deuda.totalExigible.importe);
    await monto.fill("500.00");
    await pagina.getByRole("button", { name: "Revisar prelación" }).click();
    const alerta = pagina.getByRole("alert");
    await alerta.waitFor();
    expect(await alerta.textContent()).toContain(`Monto correcto según el núcleo: ${textoMonto(deuda.totalExigible.importe)}`);
    await capturar("op5-monto-no-exacto");
  });

  it("OP-6: un pago sobre CV-2026-0015 se rechaza por crédito incobrable", async () => {
    await pagina.goto(`${base}/asesor/creditos/CV-2026-0015/pagos/nuevo`);
    await pagina.getByLabel("Monto recibido (Q)").waitFor();
    await expect.poll(() => pagina.getByLabel("Monto recibido (Q)").inputValue()).not.toBe("");
    await pagina.getByRole("button", { name: "Revisar prelación" }).click();
    const alerta = pagina.getByRole("alert");
    await alerta.waitFor();
    expect(await alerta.textContent()).toContain("CREDITO_INCOBRABLE");
    await capturar("op6-incobrable-rechazado");
  });

  it("flujo 3 — consulta gerencial: tablero, riesgo por tramo y créditos del tramo (G-1, G-4)", async () => {
    await pagina.setViewportSize({ width: 1440, height: 900 });
    await pagina.goto(`${base}/asesor/clientes`);
    await pagina.getByRole("group", { name: "Perfil" }).getByRole("button", { name: "Gerencia" }).click();
    await pagina.getByRole("heading", { name: "Tablero gerencial" }).waitFor();
    const cartera = await api(`/cartera?fechaCorte=${CORTE}&inicioPeriodo=2026-10-01`);
    await pagina.getByText("Cartera activa (denominador)").waitFor();
    const cuerpo = await pagina.locator("main").textContent();
    expect(cuerpo).toContain(textoMonto(cartera.carteraActiva.importe));
    expect(cuerpo).toContain(textoMonto(cartera.desglose.incobrablesDelPeriodo.saldoCapital.importe));
    expect(cuerpo).toContain(`${cartera.porcentaje} %`);
    await capturar("g1-tablero-gerencial");
    await pagina.getByRole("row", { name: /Mora 3/ }).getByRole("link", { name: "Ver créditos" }).click();
    await pagina.getByRole("heading", { name: "Créditos en Mora 3" }).waitFor();
    const lista = await api(`/cartera/mora?fechaCorte=${CORTE}&tramo=MORA_3`);
    await pagina.getByRole("link", { name: lista.creditos[0].creditoId }).waitFor();
    expect(await pagina.getByRole("table", { name: "Créditos del tramo Mora 3" }).locator("tbody tr").count()).toBe(lista.creditos.length);
    await capturar("g4-creditos-del-tramo");
  });

  it("G-2, G-3 y G-5 en pantalla: cierres mensual y diario y estado de CV-2026-0030", async () => {
    await pagina.goto(`${base}/gerencia/cierres/mensual`);
    const mensual = await api(`/cierres?fechaCorte=${CORTE}&tipo=MENSUAL`);
    await pagina.getByText(/Vista previa/).waitFor();
    expect(await pagina.locator("main").textContent()).toContain(textoMonto(mensual.recuperaciones.total.importe));
    await capturar("g2-cierre-mensual");
    await pagina.goto(`${base}/gerencia/cierres/diario`);
    const diario = await api(`/cierres?fechaCorte=${CORTE}&tipo=DIARIO`);
    expect(diario.desembolsos.cantidad).toBe(1);
    expect(diario.recuperaciones.cantidad).toBe(2);
    await pagina.getByRole("button", { name: "Ejecutar cierre del día" }).click();
    await pagina.getByRole("button", { name: "Confirmar cierre" }).click();
    await pagina.getByText("Cierre generado").waitFor();
    await capturar("g3-cierre-diario-generado");
    await pagina.goto(`${base}/gerencia/creditos/CV-2026-0030`);
    await pagina.getByRole("region", { name: "Cuota 3" }).getByText("Interés moratorio (redondeado por el núcleo)").waitFor();
    await capturar("g5-credito-0030-mora-cuota-3");
  });

  it("revisión responsive del asesor a 320, 375, 403 y 768 px sin desplazamiento horizontal de la página", async () => {
    await pagina.goto(`${base}/asesor/clientes`);
    await pagina.getByRole("group", { name: "Perfil" }).getByRole("button", { name: "Asesor" }).click();
    const rutas = ["/asesor/clientes", "/asesor/creditos/CV-2026-0043", "/asesor/creditos/CV-2026-0043/plan",
      "/asesor/creditos/CV-2026-0035/mora", "/asesor/creditos/CV-2026-0043/pagos/nuevo", "/asesor/creditos/nuevo"];
    const informe: string[] = [];
    for (const ancho of [320, 375, 403, 768]) {
      await pagina.setViewportSize({ width: ancho, height: 900 });
      for (const ruta of rutas) {
        await pagina.goto(`${base}${ruta}`);
        await pagina.waitForLoadState("networkidle");
        // Expresión evaluada en el navegador (el tsconfig del núcleo no incluye tipos DOM).
        const medida = await pagina.evaluate<{ pagina: number; ventana: number }>("({ pagina: document.documentElement.scrollWidth, ventana: window.innerWidth })");
        informe.push(`${ancho}px ${ruta}: scrollWidth=${medida.pagina} innerWidth=${medida.ventana} ${medida.pagina <= medida.ventana ? "OK" : "DESBORDA"}`);
        expect(medida.pagina, `${ancho}px ${ruta}`).toBeLessThanOrEqual(medida.ventana);
      }
      await pagina.goto(`${base}/asesor/creditos/CV-2026-0043`);
      await pagina.waitForLoadState("networkidle");
      await capturar(`responsive-${ancho}-detalle-credito`, false);
    }
    writeFileSync(resolve("docs/proyecto-final/evidencia/fase3-responsive.txt"), `${informe.join("\n")}\n`);
  });

  it("la aplicación no carga HTML de vistas/ ni recibe errores 500, y el bundle no contiene reglas financieras", () => {
    expect(solicitudes.filter((u) => /\/vistas\/|\.html(?:$|\?)/.test(u))).toEqual([]);
    expect(respuestas500).toEqual([]);
    const bundle = readdirSync("web/dist/assets").filter((f) => f.endsWith(".js")).map((f) => readFileSync(join("web/dist/assets", f), "utf8")).join("\n");
    for (const marca of ["Política incompatible con el contrato", "La aplicación no conserva el pago", "los pagos totales no coinciden",
      "Crédito en riesgo sin tramo", "Configuración de gasto inválida", "DATABASE_URL", "cv_demo_local"]) expect(bundle, marca).not.toContain(marca);
  });
});
