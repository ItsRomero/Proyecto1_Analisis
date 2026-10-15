import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { mkdtemp, cp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { leerPaquete, sha256, preflight, type PaqueteCanonico } from "../src/persistencia/paquete-canonico.js";
import { reproducirCanonico, estadoCanonico } from "../src/persistencia/reproducir-canonico.js";
import { CatalogoPoliticasCanonicas } from "../src/aplicacion/politicas-canonicas.js";
import { calcularCarteraPorTramo } from "../src/dominio/cartera-por-tramo.js";
import { EstadoCredito } from "../src/dominio/credito-estado.js";
import { DiasAtraso, FechaCivil } from "../src/dominio/calculadora-mora.js";
import { Dinero } from "../src/dominio/dinero.js";
import { generarGastoGestion } from "../src/dominio/gasto-gestion-cobro.js";

let paquete: PaqueteCanonico;
let temporal: string;
const origen = resolve("datos/datos-proyecto-final");
beforeAll(async () => { paquete = await leerPaquete(origen); temporal = await mkdtemp(join(tmpdir(), "cv-carga-")); });
afterAll(async () => { await rm(temporal, { recursive: true, force: true }); });
async function copia(nombre: string, alterar: (lineas: string[]) => string[], rehuellar = true) {
  const destino = join(temporal, nombre);
  await cp(origen, destino, { recursive: true });
  const contenido = alterar([...paquete.lineas]).join("\n") + "\n";
  await writeFile(join(destino, "eventos.jsonl"), contenido);
  if (rehuellar) await writeFile(join(destino, "eventos.sha256"), `${sha256(contenido)}  eventos.jsonl\n`);
  return destino;
}

describe("Carga canónica: validación y núcleo", () => {
  it("preflight de entradas y huella oficial", async () => {
    await preflight();
    expect(paquete.huella).toBe((await readFile(join(origen, "eventos.sha256"), "utf8")).split(/\s/)[0]);
    expect(paquete.eventos).toHaveLength(363);
  });
  it("rechaza huella inválida antes de reproducir", async () => {
    const ruta = await copia("huella", (l) => [...l, "{}"], false);
    await expect(leerPaquete(ruta)).rejects.toThrow("HUELLA_INVALIDA");
  });
  it("rechaza CV_DATA_DIR ausente e inválido", async () => {
    await expect(leerPaquete("")).rejects.toThrow("CV_DATA_DIR_FALTANTE");
    await expect(leerPaquete(join(temporal, "no-existe"))).rejects.toThrow("INSUMO_NO_DISPONIBLE");
  });
  it.each(["incompleta", "repetida", "desordenada"])("rechaza secuencia %s aunque la copia tenga huella coherente", async (tipo) => {
    const ruta = await copia(tipo, (l) => {
      if (tipo === "incompleta") l.splice(20, 1);
      else if (tipo === "repetida") l[20] = l[19]!;
      else [l[19], l[20]] = [l[20]!, l[19]!];
      return l;
    });
    await expect(leerPaquete(ruta)).rejects.toThrow("SECUENCIA_INVALIDA");
  });
  it("reproduce conteos exactos y cada pago conserva conceptos", () => {
    const r = reproducirCanonico(paquete, "2026-10-31");
    expect(r.conteos).toEqual({ clientes: 60, creditos: 75, asesores: 6, pagosImportados: 228, pagosAplicados: 226, eventos: 363 });
    for (const p of r.pagos) {
      expect(p.pago.aplicacion.pasos.every((paso) => paso.saldoPendiente.esCero())).toBe(true);
      expect(p.pago.aplicacion.excedente.esCero()).toBe(true);
      const suma = p.pago.aplicacion.pasos.reduce((s, paso) => s.sumar(paso.aplicado), Dinero.cero("GTQ"));
      expect(suma.esIgualA(p.pago.aplicacion.pago)).toBe(true);
    }
  });
  it("los dos duplicados no pagan una cuota adicional", () => {
    const r = reproducirCanonico(paquete, "2026-10-31");
    expect([...r.duplicados].map((seq) => paquete.eventos[seq - 1]).map((e) => e?.tipo === "PAGO" ? e.clave_idempotencia : "").sort())
      .toEqual(["IDEM-000068", "IDEM-000127"]);
  });
  it("detiene monto incorrecto con el seq causante y sin ajustar", () => {
    const eventos = paquete.eventos.map((e) => e.tipo === "PAGO" ? { ...e } : e);
    const primero = eventos.find((e) => e.tipo === "PAGO")!;
    if (primero.tipo !== "PAGO") throw new Error("Sin pagos");
    primero.monto_centavos++;
    expect(() => reproducirCanonico({ ...paquete, eventos }, "2026-10-31")).toThrow(`MONTO_NO_EXACTO (seq ${primero.seq})`);
  });
  it("rechaza referencia de asesor inexistente", () => {
    const eventos = paquete.eventos.map((e) => e.tipo === "DESEMBOLSO" ? { ...e, id_asesor: "AS-INEXISTENTE" } : e);
    expect(() => reproducirCanonico({ ...paquete, eventos }, "2026-10-31")).toThrow("Cliente o asesor inexistente");
  });
  it("deriva las dos bajas con State y fechas de ADR-009", () => {
    const r = reproducirCanonico(paquete, "2026-10-31");
    expect(r.incobrables.map((c) => [c.origen.id_credito, c.baja?.fecha]).sort())
      .toEqual([["CV-2026-0015", "2026-10-22"], ["CV-2026-0022", "2026-10-27"]]);
    for (const c of r.incobrables) {
      expect(c.credito.historial.at(-1)?.usuarioProceso).toBe("CARGA_CANONICA");
      expect(c.credito.historial.at(-1)?.motivo).toContain(paquete.huella);
    }
  });
  it("los tres reestructurados al día cuentan en riesgo mediante P2", () => {
    const r = reproducirCanonico(paquete, "2026-10-31");
    const creditos = [...r.creditos.values()].map((c) => ({ id: c.origen.id_credito, estado: estadoCanonico(c), saldoCapital: c.saldo, diasAtraso: c.diasAtraso }));
    const reestructurados = creditos.filter((c) => c.estado === EstadoCredito.REESTRUCTURADO);
    expect(reestructurados).toHaveLength(3);
    expect(reestructurados.every((c) => c.diasAtraso === 0)).toBe(true);
    const cartera = calcularCarteraPorTramo({ creditos, moneda: "GTQ", fechaCorte: FechaCivil.desdeCadena("2026-10-31"), inicioPeriodo: FechaCivil.desdeCadena("2026-10-01") });
    expect(cartera.tramosEnRiesgo.find((t) => t.tramo === "REESTRUCTURADO")?.cantidadCreditos).toBe(3);
  });
  it("selecciona política por otorgamiento, inyecta tasas y limita gasto", () => {
    const catalogo = new CatalogoPoliticasCanonicas(paquete.politicas);
    const plana = catalogo.resolver("2026-08-10");
    const escalonada = catalogo.resolver("2026-10-01");
    expect(plana.id).toBe("POL-2024-01"); expect(escalonada.id).toBe("POL-2026-10");
    const capital = Dinero.desdeCadena("1000.00", "GTQ");
    const cero = Dinero.cero("GTQ");
    const contexto = (dias: number) => ({ creditoId: "PRUEBA", cuotaId: "1", fechaVencimiento: FechaCivil.desdeCadena("2026-09-01"),
      fechaCorte: FechaCivil.desdeCadena(dias === 30 ? "2026-10-01" : "2026-10-02"), identificadoresRegistrados: [] });
    expect(catalogo.deuda(capital, cero, DiasAtraso.desdeNumero(31), plana, contexto(31)).gastosComisiones.esCero()).toBe(true);
    expect(catalogo.deuda(capital, cero, DiasAtraso.desdeNumero(30), escalonada, contexto(30)).gastosComisiones.esCero()).toBe(true);
    expect(catalogo.deuda(capital, cero, DiasAtraso.desdeNumero(31), escalonada, contexto(31)).gastosComisiones.aUnidadesMenores()).toBe(BigInt(paquete.politicas.gasto_gestion_cobro.monto_centavos));
    const cambiada = structuredClone(paquete.politicas); cambiada.politicas_mora["POL-2024-01"].tna_bps = 1200;
    const otro = new CatalogoPoliticasCanonicas(cambiada);
    expect(otro.deuda(capital, cero, DiasAtraso.desdeNumero(30), otro.resolver("2026-08-10"), contexto(30)).interesMoratorio.aCadena()).toBe("10.00");
  });
  it("no depende del reloj y registra discrepancia de rango del LEEME", () => {
    const primero = reproducirCanonico(paquete, "2026-10-31");
    vi.useFakeTimers(); vi.setSystemTime(new Date("2027-11-15T00:00:00Z"));
    try {
      const segundo = reproducirCanonico(paquete, "2026-10-31");
      const snapshot = (r: typeof primero) => [...r.creditos.values()].map((c) => [c.origen.id_credito, c.saldo.aCadena(), estadoCanonico(c), c.baja?.fecha]);
      expect(snapshot(segundo)).toEqual(snapshot(primero));
      expect(primero.rangoReal.desde).toBe("2026-01-07");
      expect(paquete.leeme).toContain("14 de enero de 2026");
    } finally { vi.useRealTimers(); }
  });
  it("gasto inyectado conserva la idempotencia del núcleo y rechaza umbrales no soportados", () => {
    const datos = { creditoId: "PRUEBA", cuotaId: "1", fechaVencimiento: FechaCivil.desdeCadena("2026-10-01"),
      fechaCorte: FechaCivil.desdeCadena("2026-11-01"), identificadoresRegistrados: [] as readonly string[],
      configuracion: { diaGeneracion: 31, importe: Dinero.desdeCadena("25.00", "GTQ") } };
    const primero = generarGastoGestion(datos);
    expect(primero.nuevo).not.toBeNull();
    expect(generarGastoGestion({ ...datos, identificadoresRegistrados: primero.identificadoresRegistrados }).nuevo).toBeNull();
    const alteradas = structuredClone(paquete.politicas); alteradas.regla_riesgo_dias = 40;
    expect(() => new CatalogoPoliticasCanonicas(alteradas)).toThrow("Umbral de incobrable/riesgo no soportado");
  });
  it("rechaza claves duplicadas con contenido distinto", () => {
    const eventos = paquete.eventos.map((e) => e.tipo === "PAGO" && e.seq === 164 ? { ...e, monto_centavos: e.monto_centavos + 1 } : e);
    expect(() => reproducirCanonico({ ...paquete, eventos }, "2026-10-31")).toThrow("Clave repetida con contenido diferente");
  });
  it("planes y vencimientos coinciden con reproducción independiente de fase 0", async () => {
    const independiente = JSON.parse(await readFile("docs/proyecto-final/evidencia/reproduccion.json", "utf8")) as {
      sha256_eventos: string; planes_sha256: Record<string, string>; vencimientos: Record<string, string[]>;
    };
    expect(independiente.sha256_eventos).toBe(paquete.huella);
    const r = reproducirCanonico(paquete, "2026-10-31");
    for (const c of r.creditos.values()) {
      const filas = c.plan.cuotas.map(({ cuota: q }) => [q.numero, Number(q.amortizacion.aUnidadesMenores()), Number(q.interes.aUnidadesMenores())]);
      // Solo serialización del formato del oráculo, no aritmética monetaria en number.
      expect(sha256(JSON.stringify(filas))).toBe(independiente.planes_sha256[c.origen.id_credito]);
      expect(c.plan.cuotas.map((q) => q.fechaVencimiento.valor)).toEqual(independiente.vencimientos[c.origen.id_credito]);
    }
  });
});
