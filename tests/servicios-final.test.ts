import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { CasosUsoFinal } from "../src/aplicacion/casos-uso-final.js";
import { Dinero } from "../src/dominio/dinero.js";
import { casosEnMemoria, contexto } from "./apoyo/hechos-memoria.js";

// Oráculo independiente de fase 0 (Python + decimal), congelado en docs/proyecto-final/evidencia.
const oraculo = JSON.parse(readFileSync("docs/proyecto-final/evidencia/reproduccion.json", "utf8")) as {
  situaciones_guion: Record<string, Situacion>; incobrables_derivados: Record<string, Situacion>;
  reestructurados: Record<string, Situacion>; vencimientos: Record<string, string[]>; g7_dias_cuota2: number;
};
interface Situacion { pagadas: number; vencidas: number; dias_atraso: number; saldo_capital_centavos: number; fecha_incobrable_derivada: string | null }
const CORTE = "2026-10-31";
const gtq = (importe: string) => Dinero.desdeCadena(importe, "GTQ");
let casos: CasosUsoFinal;
beforeAll(async () => { casos = (await casosEnMemoria()).casos; });

describe("fase 3: servicios de aplicación sobre hechos canónicos", () => {
  it("la proyección al corte coincide con la reproducción independiente de fase 0", async () => {
    const todos = { ...oraculo.situaciones_guion, ...oraculo.incobrables_derivados, ...oraculo.reestructurados };
    for (const [creditoId, esperado] of Object.entries(todos)) {
      const r = await casos.consultarCredito.ejecutar({ creditoId, fechaCorte: CORTE }, contexto);
      expect({ pagadas: r.cuotasPagadas, vencidas: r.cuotasVencidas, dias: r.diasAtraso, saldo: gtq(r.saldoCapital.importe).aUnidadesMenores() },
        creditoId).toEqual({ pagadas: esperado.pagadas, vencidas: esperado.vencidas, dias: esperado.dias_atraso,
        saldo: BigInt(esperado.saldo_capital_centavos) });
      if (esperado.fecha_incobrable_derivada) expect(r.estado, creditoId).toBe("INCOBRABLE");
    }
    for (const id of Object.keys(oraculo.reestructurados))
      expect((await casos.consultarCredito.ejecutar({ creditoId: id, fechaCorte: CORTE }, contexto)).estado).toBe("REESTRUCTURADO");
  });

  it("los 75 planes con fechas coinciden con los vencimientos reproducidos (R-2)", async () => {
    for (const [creditoId, fechas] of Object.entries(oraculo.vencimientos)) {
      const plan = await casos.consultarPlan.ejecutar({ creditoId, fechaCorte: CORTE }, contexto);
      expect(plan.cuotas.map((q) => q.fechaVencimiento), creditoId).toEqual(fechas);
    }
  });

  it("no anticipa una baja posterior al corte consultado (ADR-009)", async () => {
    const antes = await casos.consultarCredito.ejecutar({ creditoId: "CV-2026-0015", fechaCorte: "2026-10-21" }, contexto);
    const dia = await casos.consultarCredito.ejecutar({ creditoId: "CV-2026-0015", fechaCorte: "2026-10-22" }, contexto);
    expect(antes.estado).toBe("EN_MORA");
    expect(dia.estado).toBe("INCOBRABLE");
    expect(dia.tramo).toBe("INCOBRABLE");
  });

  it("una baja congela el devengo moratorio en su fecha", async () => {
    const enBaja = await casos.calcularDeudaCuota.ejecutar({ creditoId: "CV-2026-0015", numeroCuota: 3, fechaCorte: "2026-10-22" }, contexto);
    const despues = await casos.calcularDeudaCuota.ejecutar({ creditoId: "CV-2026-0015", numeroCuota: 3, fechaCorte: CORTE }, contexto);
    expect(despues.interesMoratorio).toEqual(enBaja.interesMoratorio);
    const mora = await casos.explicarMora.ejecutar({ creditoId: "CV-2026-0015", numeroCuota: 3, fechaCorte: CORTE }, contexto);
    expect(mora.corteDevengo).toBe("2026-10-22");
  });

  it("G-5, G-7 y G-8: tramo plano, tramos escalonados recorridos y política por otorgamiento", async () => {
    const g5 = await casos.explicarMora.ejecutar({ creditoId: "CV-2026-0030", numeroCuota: 3, fechaCorte: CORTE }, contexto);
    expect(g5.cuotas[0]).toMatchObject({ diasAtraso: 65, tramo: "MORA_3", politicaId: "POL-2024-01" });
    expect(g5.cuotas[0]?.detalle?.tramos.map((t) => [t.nombre, t.dias])).toEqual([["PLANA", 65]]);
    const g7 = await casos.explicarMora.ejecutar({ creditoId: "CV-2026-0410", numeroCuota: 2, fechaCorte: "2027-01-24" }, contexto);
    expect(g7.politicaId).toBe("POL-2026-10");
    expect(g7.cuotas[0]?.diasAtraso).toBe(oraculo.g7_dias_cuota2);
    expect(g7.cuotas[0]?.detalle?.tramos.map((t) => [t.nombre, t.dias, t.tasa])).toEqual([["MORA_1", 30, "0.18"], ["MORA_2", 15, "0.24"]]);
    const g8 = await casos.consultarFichaCredito.ejecutar({ creditoId: "CV-2026-0100", fechaCorte: CORTE }, contexto);
    expect(g8.politicaId).toBe("POL-2024-01");
  });

  it("deuda exacta: suma por concepto y rechazo de cuota pagada o fuera de plan", async () => {
    const d = await casos.calcularDeudaCuota.ejecutar({ creditoId: "CV-2026-0043", numeroCuota: 1, fechaCorte: CORTE }, contexto);
    expect(gtq(d.gastosComisiones.importe).sumar(gtq(d.interesMoratorio.importe)).sumar(gtq(d.interesCorriente.importe))
      .sumar(gtq(d.capital.importe)).aCadena()).toBe(d.totalExigible.importe);
    expect(d.gastosComisiones.importe).toBe("0.00");
    await expect(casos.calcularDeudaCuota.ejecutar({ creditoId: "CV-2026-0035", numeroCuota: 1, fechaCorte: CORTE }, contexto))
      .rejects.toMatchObject({ codigo: "CUOTA_YA_PAGADA" });
    await expect(casos.calcularDeudaCuota.ejecutar({ creditoId: "CV-2026-0035", numeroCuota: 24, fechaCorte: CORTE }, contexto))
      .rejects.toMatchObject({ codigo: "REFERENCIA_INEXISTENTE" });
    await expect(casos.consultarCredito.ejecutar({ creditoId: "CV-2026-9999", fechaCorte: CORTE }, contexto))
      .rejects.toMatchObject({ codigo: "CREDITO_NO_EXISTE" });
  });

  it("D-7: ventana (corte, corte + N] excluye el día del corte e incluye el último", async () => {
    // CV-2026-0001 vence cada día 14: un corte en 14/11 la excluye; uno en 07/11 la incluye en su último día.
    const enCorte = await casos.proximosVencimientos.ejecutar({ fechaCorte: "2026-11-14", dias: 7 }, contexto);
    const ultimoDia = await casos.proximosVencimientos.ejecutar({ fechaCorte: "2026-11-07", dias: 7 }, contexto);
    const fuera = await casos.proximosVencimientos.ejecutar({ fechaCorte: "2026-11-06", dias: 7 }, contexto);
    const tiene = (r: typeof enCorte) => r.cuotas.some((q) => q.creditoId === "CV-2026-0001" && q.fechaVencimiento === "2026-11-14");
    expect([tiene(enCorte), tiene(ultimoDia), tiene(fuera)]).toEqual([false, true, false]);
    expect(ultimoDia.hastaIncluido).toBe("2026-11-14");
    expect(ultimoDia.montoTotal.importe).toBe(ultimoDia.cuotas.reduce((s, q) => s.sumar(gtq(q.importe.importe)), gtq("0.00")).aCadena());
  });

  it("cierre mensual de octubre concilia conceptos y coincide con la cartera de G-1", async () => {
    const cierre = await casos.consultarCierre.ejecutar({ fechaCorte: CORTE, tipo: "MENSUAL" }, contexto);
    const r = cierre.recuperaciones;
    expect(gtq(r.gastosComisiones.importe).sumar(gtq(r.interesMoratorio.importe)).sumar(gtq(r.interesCorriente.importe))
      .sumar(gtq(r.capital.importe)).aCadena()).toBe(r.total.importe);
    expect(r.gastosComisiones.importe).toBe("0.00");
    expect(cierre.desembolsos.cantidad).toBe(10);
    expect(cierre.cartera).toEqual(await casos.consultarCartera.ejecutar({ fechaCorte: CORTE, inicioPeriodo: "2026-10-01" }, contexto));
    await expect(casos.consultarCartera.ejecutar({ fechaCorte: CORTE, inicioPeriodo: "2026-11-01" }, contexto))
      .rejects.toMatchObject({ codigo: "PERIODO_INVALIDO" });
  });

  it("listados por tramo concilian con la cartera y excluyen incobrables de la base", async () => {
    const cartera = await casos.consultarCartera.ejecutar({ fechaCorte: CORTE, inicioPeriodo: "2026-10-01" }, contexto);
    for (const tramo of ["MORA_2", "MORA_3", "VENCIDO"] as const) {
      const lista = await casos.listarCreditosMora.ejecutar({ fechaCorte: CORTE, tramo }, contexto);
      const fila = cartera.desglose?.tramosEnRiesgo.find((t) => t.tramo === tramo);
      expect(lista.creditos.length, tramo).toBe(fila?.cantidadCreditos);
    }
    const g4 = await casos.listarCreditosMora.ejecutar({ fechaCorte: CORTE, tramo: "MORA_3" }, contexto);
    expect(g4.creditos.map((c) => [c.creditoId, c.diasAtraso])).toEqual([["CV-2026-0035", 70], ["CV-2026-0030", 65]]);
    expect(cartera.desglose?.incobrablesDelPeriodo.creditos.map((c) => c.creditoId)).toEqual(["CV-2026-0015", "CV-2026-0022"]);
  });

  it("los listados de interfaz no exponen DPI ni teléfono y filtran sin acentos", async () => {
    const r = await casos.listarClientes.ejecutar({ fechaCorte: CORTE, busqueda: "galvez" }, contexto);
    const todos = await casos.listarClientes.ejecutar({ fechaCorte: CORTE }, contexto);
    expect(todos.clientes).toHaveLength(60);
    expect(JSON.stringify(todos)).not.toMatch(/DPI-FICT|5555-\d{4}/);
    expect(r.clientes.every((c) => c.nombreCompleto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().includes("galvez"))).toBe(true);
  });

  it("ninguna cifra cambia con el reloj del sistema falseado", async () => {
    const consultar = () => Promise.all([
      casos.consultarCartera.ejecutar({ fechaCorte: CORTE, inicioPeriodo: "2026-10-01" }, contexto),
      casos.consultarCierre.ejecutar({ fechaCorte: CORTE, tipo: "MENSUAL" }, contexto),
      casos.proximosVencimientos.ejecutar({ fechaCorte: CORTE, dias: 30 }, contexto),
    ]);
    const antes = await consultar();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-20T08:00:00Z"));
    try { expect(await consultar()).toEqual(antes); } finally { vi.useRealTimers(); }
  });
});

describe("fase 3: límites de capas", () => {
  const archivos = (dir: string): string[] => readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => e.isDirectory() ? archivos(resolve(dir, e.name)) : [resolve(dir, e.name)]);
  it("la aplicación no depende de transporte, persistencia ni interfaz", () => {
    for (const ruta of archivos("src/aplicacion").filter((r) => r.endsWith(".ts"))) {
      for (const m of ts.preProcessFile(readFileSync(ruta, "utf8")).importedFiles) {
        if (m.fileName.startsWith(".")) expect(m.fileName, ruta).toMatch(/^\.\.?\/(?:\.\.\/(?:dominio|contratos)\/)?[\w-]+(?:\/[\w-]+)*\.js$/);
        else expect(["decimal.js", "date-fns", "zod"], ruta).toContain(m.fileName);
        expect(m.fileName, ruta).not.toMatch(/persistencia|api|web|pg|express/);
      }
    }
  });
});
