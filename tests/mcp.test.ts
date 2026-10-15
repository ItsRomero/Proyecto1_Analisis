import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { CasosUsoFinal } from "../src/aplicacion/casos-uso-final.js";
import { operacionesFinales } from "../src/contratos/proyecto-final.js";
import { herramientasFinales } from "../src/contratos/rutas-proyecto-final.js";
import { crearServidorMcp, SUJETO_ASISTENTE } from "../src/mcp/servidor-mcp.js";
import { casosEnMemoria, contexto } from "./apoyo/hechos-memoria.js";

// Fase 4: cliente MCP real del SDK contra el servidor, en memoria, sobre los hechos canónicos reproducidos por el núcleo.
const CORTE = "2026-10-31";
let casos: CasosUsoFinal;
let cliente: Client;
interface Resultado { structuredContent?: Record<string, unknown>; isError?: boolean; content: { type: string; text?: string }[] }
const llamar = async (name: string, args: Record<string, unknown>) => (await cliente.callTool({ name, arguments: args })) as Resultado;

beforeAll(async () => {
  casos = (await casosEnMemoria()).casos;
  const servidor = crearServidorMcp({ casos, sesion: { sesionId: "SES-VINCULADA", perfil: "GERENCIA", fechaCorteDefecto: CORTE } });
  const [lado1, lado2] = InMemoryTransport.createLinkedPair();
  cliente = new Client({ name: "prueba", version: "1.0.0" });
  await Promise.all([servidor.connect(lado2), cliente.connect(lado1)]);
});
afterAll(async () => { await cliente.close(); });

describe("fase 4: MCP de menor privilegio", () => {
  it("publica exactamente las ocho capacidades, con el esquema Zod compartido y solo lectura salvo la propuesta", async () => {
    const { tools } = await cliente.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(Object.keys(herramientasFinales).sort());
    for (const prohibida of ["confirmar_pago", "cancelar_propuesta", "alta_cliente", "solicitar_credito", "aprobar_credito",
      "rechazar_credito", "desembolsar_credito", "generar_cierre"]) expect(tools.map((t) => t.name)).not.toContain(prohibida);
    for (const t of tools) {
      const op = herramientasFinales[t.name as keyof typeof herramientasFinales];
      const zod = z.toJSONSchema(operacionesFinales[op].entrada) as { properties: unknown; required: string[]; additionalProperties: unknown };
      expect(t.inputSchema.properties, t.name).toEqual(zod.properties);
      expect(t.inputSchema.required, t.name).toEqual(zod.required.filter((c) => c !== "fechaCorte"));
      expect((t.inputSchema as { additionalProperties?: unknown }).additionalProperties, t.name).toBe(false);
      expect(t.annotations?.readOnlyHint, t.name).toBe(t.name !== "proponer_pago");
      expect(t.annotations?.destructiveHint, t.name).toBe(false);
    }
  });

  it.each([
    ["G-1", "consultar_cartera", "consultarCartera", { fechaCorte: CORTE, inicioPeriodo: "2026-10-01" }],
    ["G-2", "consultar_cierre", "consultarCierre", { fechaCorte: CORTE, tipo: "MENSUAL" }],
    ["G-3", "consultar_cierre", "consultarCierre", { fechaCorte: CORTE, tipo: "DIARIO" }],
    ["G-4", "listar_creditos_mora", "listarCreditosMora", { fechaCorte: CORTE, tramo: "MORA_3" }],
    ["G-5 estado", "consultar_credito", "consultarCredito", { fechaCorte: CORTE, creditoId: "CV-2026-0030" }],
    ["G-5 mora", "explicar_mora", "explicarMora", { fechaCorte: CORTE, creditoId: "CV-2026-0030", numeroCuota: 3 }],
    ["G-6 7 días", "proximos_vencimientos", "proximosVencimientos", { fechaCorte: CORTE, dias: 7 }],
    ["G-6 30 días", "proximos_vencimientos", "proximosVencimientos", { fechaCorte: CORTE, dias: 30 }],
    ["G-7", "explicar_mora", "explicarMora", { fechaCorte: "2027-01-24", creditoId: "CV-2026-0410", numeroCuota: 2 }],
    ["OP-1 deuda", "calcular_deuda_cuota", "calcularDeudaCuota", { fechaCorte: CORTE, creditoId: "CV-2026-0043", numeroCuota: 1 }],
  ] as const)("%s: %s devuelve exactamente lo mismo que el caso de uso", async (_caso, herramienta, operacion, args) => {
    const r = await llamar(herramienta, args);
    expect(r.isError).toBeFalsy();
    const esperado = await (casos[operacion].ejecutar as (e: unknown, c: unknown) => Promise<unknown>)(args, contexto);
    expect(r.structuredContent).toEqual(esperado);
    expect(JSON.parse(r.content[0]?.text ?? "null")).toEqual(esperado);
  });

  it("sin fechaCorte usa el corte de la sesión vinculada y lo muestra en la respuesta", async () => {
    const r = await llamar("consultar_credito", { creditoId: "CV-2026-0043" });
    expect(r.structuredContent?.["fechaCorte"]).toBe(CORTE);
  });

  it.each([
    ["consultar_credito", { creditoId: "CV-2026-0043", sujetoId: "GERENTE" }],
    ["consultar_credito", { creditoId: "CV-2026-0043", sesionId: "SES-OTRA" }],
    ["consultar_cartera", { inicioPeriodo: "2026-10-01", perfil: "GERENCIA" }],
    ["proponer_pago", { creditoId: "CV-2026-0043", numeroCuota: 1, monto: { importe: "1.00", moneda: "GTQ" }, claveIdempotencia: "K-1", aprobado: true }],
  ] as const)("rechaza por esquema estricto la identidad, sesión, perfil o aprobación inyectada en %s", async (herramienta, args) => {
    const r = await llamar(herramienta, args);
    expect(r.isError).toBe(true);
    expect(r.structuredContent?.["errorCode"]).toBe("ENTRADA_INVALIDA");
  });

  it("no existe herramienta de confirmación ni de otras escrituras", async () => {
    for (const nombre of ["confirmar_pago", "confirmarPago", "generar_cierre", "aprobar_credito", "desembolsar_credito"]) {
      const r = await llamar(nombre, { propuestaId: "PROP-X" });
      expect(r.isError, nombre).toBe(true);
      expect(r.structuredContent?.["errorCode"], nombre).toBe("ENTRADA_INVALIDA");
    }
  });

  it("errores uniformes RFC 9457 sin SQL, trazas ni datos personales", async () => {
    const casosError = [
      ["consultar_credito", { creditoId: "CV-2026-9999" }, "CREDITO_NO_EXISTE"],
      ["consultar_credito", { creditoId: "CV-2026-0043", fechaCorte: "2026-02-30" }, "FECHA_INVALIDA"],
      ["calcular_deuda_cuota", { creditoId: "CV-2026-0035", numeroCuota: 1 }, "CUOTA_YA_PAGADA"],
      ["consultar_cartera", { inicioPeriodo: "2026-11-01" }, "PERIODO_INVALIDO"],
      // La unidad de trabajo de esta prueba es de solo lectura: su mensaje interno no debe filtrarse.
      ["proponer_pago", { creditoId: "CV-2026-0043", numeroCuota: 1, monto: { importe: "561.87", moneda: "GTQ" }, claveIdempotencia: "K-2" }, "ERROR_INTERNO"],
    ] as const;
    for (const [herramienta, args, codigo] of casosError) {
      const r = await llamar(herramienta, args);
      expect(r.isError, codigo).toBe(true);
      expect(r.structuredContent, codigo).toMatchObject({ errorCode: codigo, type: `urn:credito-vecino:problema:${codigo.toLowerCase()}` });
      expect(r.content[0]?.text, codigo).not.toMatch(/SELECT|cv\.|\bat\s|Prueba de solo lectura|DPI-FICT|5555-\d{4}/);
    }
  });

  it("las respuestas no cambian con el reloj del sistema falseado", async () => {
    const consultar = () => Promise.all([llamar("consultar_cartera", { inicioPeriodo: "2026-10-01" }),
      llamar("proximos_vencimientos", { dias: 30 }), llamar("explicar_mora", { creditoId: "CV-2026-0030", numeroCuota: 3 })]);
    const antes = (await consultar()).map((r) => r.structuredContent);
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-25T10:00:00Z"));
    try { expect((await consultar()).map((r) => r.structuredContent)).toEqual(antes); } finally { vi.useRealTimers(); }
  });
});

describe("fase 4: límites del adaptador MCP", () => {
  it("el servidor MCP no accede a la base ni a HTTP; solo principal.ts compone la persistencia", () => {
    for (const archivo of readdirSync("src/mcp").filter((f) => f.endsWith(".ts"))) {
      const imports = ts.preProcessFile(readFileSync(resolve("src/mcp", archivo), "utf8")).importedFiles.map((m) => m.fileName);
      expect(imports.filter((m) => /express|aplicacion-http|sesiones|^pg$/.test(m)), archivo).toEqual([]);
      if (archivo !== "principal.ts") expect(imports.filter((m) => /persistencia/.test(m)), archivo).toEqual([]);
    }
    expect(SUJETO_ASISTENTE).toBe("ASISTENTE-MCP");
  });
});
