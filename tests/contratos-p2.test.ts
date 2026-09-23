import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { z } from "zod";
import { describe, expect, it } from "vitest";
import { consultaMoraSchema, carteraRiesgoSchema, desgloseCarteraSchema, moraCuotaSchema } from "../src/contratos/esquemas.js";
import { presentarCartera, presentarMora } from "../src/contratos/presentadores-p2.js";
import { consultarMora } from "../src/aplicacion/consultar-mora.js";
import { calcularCarteraPorTramo } from "../src/dominio/cartera-por-tramo.js";
import { Dinero } from "../src/dominio/dinero.js";
import { EstadoCredito } from "../src/dominio/credito-estado.js";
import { FechaCivil } from "../src/dominio/calculadora-mora.js";

const fecha = (s: string) => FechaCivil.desdeCadena(s);
const q = (s: string) => Dinero.desdeCadena(s, "GTQ");
const datos = { fechaCorte: fecha("2027-01-09"), inicioPeriodo: fecha("2027-01-01"), moneda: "GTQ" };

describe("Contratos P2 aditivos", () => {
  it("serializa resultados reales de mora, incluidos importes sin redondeo", () => {
    const r = presentarMora(consultarMora({ creditoId: "C", estado: EstadoCredito.EN_MORA,
      fechaOtorgamiento: fecha("2026-10-01"), fechaCorte: datos.fechaCorte,
      cuotas: [{ referencia: "1", capitalVencido: q("725.76"), fechaVencimiento: fecha("2026-10-01") }] }));
    expect(consultaMoraSchema.parse(JSON.parse(JSON.stringify(r)))).toEqual(r);
    expect(r.cuotas[0]?.detalle?.totalSinRedondear).toBe("50.8032");
    expect(r.cuotas[0]?.interesMoratorio.importe).toBe("50.80");
    expect(consultaMoraSchema.safeParse({ ...r, cuotas: [{ ...r.cuotas[0], detalle: { totalSinRedondear: 50.8032, moneda: "GTQ", tramos: [] } }] }).success).toBe(false);
  });
  it("serializa cartera, porcentajes, bajas y ausencia de denominador", () => {
    const r = presentarCartera(calcularCarteraPorTramo({ ...datos, creditos: [
      { id: "C", estado: EstadoCredito.EN_MORA, diasAtraso: 45, saldoCapital: q("100") }],
      bajas: [{ creditoId: "B", fecha: fecha("2027-01-02"), saldoCapital: q("50") }] }));
    expect(carteraRiesgoSchema.parse(JSON.parse(JSON.stringify(r)))).toEqual(r);
    expect(r.desglose?.totalEnRiesgo.porcentaje).toBe("100.00");
    expect(r.desglose?.incobrablesDelPeriodo.saldoCapital.importe).toBe("50.00");
    const vacia = presentarCartera(calcularCarteraPorTramo({ ...datos, creditos: [] }));
    expect(vacia.tipo).toBe("SIN_CARTERA_ACTIVA");
    expect(vacia.desglose?.totalEnRiesgo.porcentaje).toBeNull();
    expect(desgloseCarteraSchema.safeParse({ ...r.desglose, tramosEnRiesgo: [] }).success).toBe(false);
    expect(desgloseCarteraSchema.safeParse({ ...r.desglose, cantidadActiva: -1 }).success).toBe(false);
  });
  it("OpenAPI y Zod mantienen estructura, obligatoriedad y restricciones de los nuevos objetos", () => {
    type Objeto = Record<string, unknown>;
    const doc = parse(readFileSync("docs/api/openapi.yaml", "utf8")) as { components: { schemas: Record<string, Objeto> } };
    function normalizar(valor: unknown): unknown {
      if (Array.isArray(valor)) return valor.map(normalizar);
      if (typeof valor !== "object" || valor === null) return valor;
      const obj = valor as Objeto;
      if (typeof obj["$ref"] === "string") return normalizar(doc.components.schemas[obj["$ref"].split("/").at(-1)!]);
      if (Array.isArray(obj["anyOf"])) {
        const opciones = obj["anyOf"] as Objeto[];
        const noNula = opciones.find((o) => o["type"] !== "null");
        if (opciones.length === 2 && noNula && opciones.some((o) => o["type"] === "null")) {
          return normalizar({ ...noNula, type: [noNula["type"], "null"] });
        }
      }
      const claves = ["type", "properties", "required", "additionalProperties", "items", "minItems", "maxItems", "minimum", "minLength", "pattern", "enum"];
      const salida: Objeto = {};
      for (const clave of claves) {
        if (obj[clave] === undefined) continue;
        if (clave === "properties") salida[clave] = Object.fromEntries(Object.entries(obj[clave] as Objeto).map(([k, v]) => [k, normalizar(v)]));
        else if (clave === "required" || clave === "enum") salida[clave] = [...obj[clave] as string[]].sort();
        else if (clave === "pattern") salida[clave] = String(obj[clave]).replaceAll("(?:", "(");
        else salida[clave] = normalizar(obj[clave]);
      }
      return salida;
    }
    expect(normalizar(doc.components.schemas["DesgloseCartera"])).toEqual(normalizar(z.toJSONSchema(desgloseCarteraSchema)));
    expect(normalizar(doc.components.schemas["MoraCuota"])).toEqual(normalizar(z.toJSONSchema(moraCuotaSchema)));
    for (const nombre of ["CarteraConRazon", "CarteraSinActiva"]) {
      expect(doc.components.schemas[nombre]?.["required"]).not.toContain("desglose");
      expect((doc.components.schemas[nombre]?.["properties"] as Objeto)["desglose"]).toEqual({ $ref: "#/components/schemas/DesgloseCartera" });
    }
  });
});
