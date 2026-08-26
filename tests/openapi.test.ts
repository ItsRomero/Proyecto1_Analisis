import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Objeto = Record<string, unknown>;

const ruta = resolve(process.cwd(), "docs/api/openapi.yaml");
const texto = readFileSync(ruta, "utf8");
const documento: unknown = parse(texto);

function objeto(valor: unknown, contexto: string): Objeto {
  if (typeof valor !== "object" || valor === null || Array.isArray(valor)) {
    throw new Error(`${contexto} debe ser un objeto.`);
  }
  return valor as Objeto;
}

function referencias(valor: unknown): readonly string[] {
  if (Array.isArray(valor)) return valor.flatMap(referencias);
  if (typeof valor !== "object" || valor === null) return [];
  const actual = valor as Objeto;
  const propias = typeof actual["$ref"] === "string" ? [actual["$ref"]] : [];
  return [...propias, ...Object.values(actual).flatMap(referencias)];
}

function resolverReferenciaLocal(raiz: Objeto, referencia: string): unknown {
  if (!referencia.startsWith("#/")) return undefined;
  return referencia.slice(2).split("/").reduce<unknown>((actual, segmento) => {
    return objeto(actual, referencia)[segmento.replaceAll("~1", "/").replaceAll("~0", "~")];
  }, raiz);
}

describe("OpenAPI", () => {
  it("es YAML parseable y declara OpenAPI 3.1", () => {
    const raiz = objeto(documento, "documento");
    expect(raiz["openapi"]).toBe("3.1.0");
    expect(objeto(raiz["info"], "info")["title"]).toBeTypeOf("string");
    expect(objeto(raiz["paths"], "paths")).not.toEqual({});
  });

  it("resuelve todas las referencias locales", () => {
    const raiz = objeto(documento, "documento");
    const refs = referencias(raiz).filter((ref) => ref.startsWith("#/"));
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) expect(resolverReferenciaLocal(raiz, ref), ref).toBeDefined();
  });

  it("define operationId único, propósito y respuestas por operación", () => {
    const paths = objeto(objeto(documento, "documento")["paths"], "paths");
    const ids: string[] = [];
    for (const [rutaOperacion, itemValor] of Object.entries(paths)) {
      const item = objeto(itemValor, rutaOperacion);
      for (const metodo of ["get", "post", "put", "patch", "delete"]) {
        if (item[metodo] === undefined) continue;
        const operacion = objeto(item[metodo], `${metodo} ${rutaOperacion}`);
        expect(operacion["operationId"]).toBeTypeOf("string");
        expect(operacion["summary"]).toBeTypeOf("string");
        expect(Object.keys(objeto(operacion["responses"], "responses")).length).toBeGreaterThan(0);
        ids.push(String(operacion["operationId"]));
      }
    }
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(14);
  });

  it("usa la estructura uniforme ErrorApi en todas las respuestas reutilizables", () => {
    const components = objeto(objeto(documento, "documento")["components"], "components");
    const responses = objeto(components["responses"], "responses");
    for (const respuesta of Object.values(responses)) {
      const contenido = objeto(objeto(respuesta, "response")["content"], "content");
      const problem = objeto(contenido["application/problem+json"], "problem+json");
      expect(referencias(problem)).toContain("#/components/schemas/ErrorApi");
    }
  });

  it("representa importes y tasas como string", () => {
    const schemas = objeto(objeto(objeto(documento, "documento")["components"], "components")["schemas"], "schemas");
    expect(objeto(schemas["Importe"], "Importe")["type"]).toBe("string");
    expect(objeto(schemas["Tasa"], "Tasa")["type"]).toBe("string");
  });

  it("exige Idempotency-Key y documenta creación, replay y conflicto del pago", () => {
    const raiz = objeto(documento, "documento");
    const paths = objeto(raiz["paths"], "paths");
    const pagos = objeto(paths["/creditos/{creditoId}/pagos"], "pagos");
    const post = objeto(pagos["post"], "post pago");
    const parametros = post["parameters"];
    expect(referencias(parametros)).toContain("#/components/parameters/IdempotencyKey");
    const responses = objeto(post["responses"], "responses pago");
    expect(responses["200"]).toBeDefined();
    expect(responses["201"]).toBeDefined();
    expect(responses["409"]).toBeDefined();

    const components = objeto(raiz["components"], "components");
    const parametro = objeto(objeto(components["parameters"], "parameters")["IdempotencyKey"], "IdempotencyKey");
    expect(parametro["in"]).toBe("header");
    expect(parametro["required"]).toBe(true);
  });
});
