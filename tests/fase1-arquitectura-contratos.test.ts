import { readFileSync, readdirSync } from "node:fs";
import { resolve, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import ts from "typescript";
import { operacionesFinales, fechaOperacionSchema, altaClienteFinalSchema, confirmarPagoSchema, politicasPaqueteSchema } from "../src/contratos/proyecto-final.js";
import { herramientasFinales } from "../src/contratos/rutas-proyecto-final.js";
import { simularPlanConVencimientos } from "../src/aplicacion/plan-con-vencimientos.js";
import { FechaCivil } from "../src/dominio/calculadora-mora.js";
import { Dinero } from "../src/dominio/dinero.js";
import { PlazoMeses, TasaNominalAnual } from "../src/dominio/plan-amortizacion.js";

function archivos(directorio: string): string[] {
  return readdirSync(directorio, { withFileTypes: true }).flatMap(e => e.isDirectory()
    ? archivos(resolve(directorio, e.name)) : [resolve(directorio, e.name)]);
}

describe("fase 1: límites y contratos", () => {
  it("mantiene dominio independiente de otras capas y frameworks", () => {
    const raiz = resolve("src/dominio");
    for (const ruta of archivos(raiz).filter(r => r.endsWith(".ts"))) {
      const imports = ts.preProcessFile(readFileSync(ruta, "utf8")).importedFiles;
      for (const modulo of imports) {
        if (modulo.fileName.startsWith(".")) {
          expect(relative(raiz, resolve(ruta, "..", modulo.fileName)).startsWith(".."), ruta).toBe(false);
        } else expect(["decimal.js", "date-fns"], ruta).toContain(modulo.fileName);
      }
    }
  });

  it("genera OpenAPI desde los mismos esquemas Zod de aplicación/MCP", () => {
    const doc = JSON.parse(readFileSync("docs/api/openapi-proyecto-final.json", "utf8")) as {
      components: { schemas: Record<string, unknown> };
      paths: Record<string, Record<string, { operationId: string }>>;
    };
    for (const [nombre, op] of Object.entries(operacionesFinales)) {
      expect(doc.components.schemas[`${nombre}Entrada`]).toEqual(z.toJSONSchema(op.entrada));
      expect(doc.components.schemas[`${nombre}Salida`]).toEqual(z.toJSONSchema(op.salida));
    }
    const ids = Object.values(doc.paths).flatMap(p => Object.values(p).map(op => op.operationId));
    expect(new Set(ids)).toEqual(new Set(Object.keys(operacionesFinales)));
    expect(ids).toHaveLength(Object.keys(operacionesFinales).length);
  });

  it("acepta alta sin teléfono y rechaza una identidad de aprobación inyectada", () => {
    expect(altaClienteFinalSchema.safeParse({ clienteId: "CL-9001", nombreCompleto: "Demostración",
      identificadorLegal: { tipo: "DPI", valor: "DPI-FICT-009001" }, municipio: "Guatemala", fechaAlta: "2026-10-31" }).success).toBe(true);
    expect(confirmarPagoSchema.safeParse({ propuestaId: "P-1", fechaOperacion: "2026-10-31", versionCredito: 1,
      aprobado: true, sujetoId: "gerente" }).success).toBe(false);
    expect(Object.keys(herramientasFinales)).toHaveLength(8);
    expect(Object.values(herramientasFinales)).not.toContain("confirmarPago");
  });

  it.each(["2026-02-29", "2026-04-31", "2026-13-01"])("rechaza fecha civil inválida %s", fecha => {
    expect(fechaOperacionSchema.safeParse(fecha).success).toBe(false);
  });

  it("valida las políticas oficiales sin depender de una ruta absoluta", () => {
    const contenido: unknown = JSON.parse(readFileSync(resolve(process.env["CV_DATA_DIR"] ?? "datos/datos-proyecto-final", "politicas.json"), "utf8"));
    expect(politicasPaqueteSchema.safeParse(contenido).success).toBe(true);
  });
});

describe("D-5: plan con fechas compone el núcleo", () => {
  it.each([
    ["2026-10-31", ["2026-11-30", "2026-12-31", "2027-01-31"]],
    ["2027-01-31", ["2027-02-28", "2027-03-31", "2027-04-30"]],
    ["2028-01-31", ["2028-02-29", "2028-03-31", "2028-04-30"]],
  ] as const)("conserva el día contractual desde %s sin arrastrar meses cortos", (fecha, esperadas) => {
    const resultado = simularPlanConVencimientos({ capital: Dinero.desdeCadena("10000.00", "GTQ"),
      tasaNominalAnual: TasaNominalAnual.desdeCadena("0.36"), plazo: PlazoMeses.desdeNumero(3), fechaDesembolso: FechaCivil.desdeCadena(fecha) });
    expect(resultado.cuotas.map(q => q.fechaVencimiento.valor)).toEqual(esperadas);
    expect(resultado.cuotas.every((q, i) => q.cuota === resultado.plan.cuotas[i])).toBe(true);
    expect(resultado.plan.saldoFinal().esCero()).toBe(true);
  });
});
