import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cifrasDe, verificarCifras } from "../../src/chat/cifras.js";
import { CASOS_EVAL } from "./casos.js";

/*
 * Fase 7: el límite que dejó la fase 6 (un porcentaje entero agregado por el modelo, como "(100%)" en G-2,
 * no se detectaba). Se mide sobre una GRABACIÓN inmutable de la transcripción real de fase 6 (commit a83b11a)
 * con los resultados de herramientas del oráculo congelado para el mismo estado de partida (POST_OP1_OP3).
 */
const oraculo = JSON.parse(readFileSync("tests/evals/oraculo-congelado.json", "utf8")) as {
  estados: { POST_OP1_OP3: { resultados: Record<string, unknown> } } };
const grabacion = readFileSync("tests/evals/grabaciones/chat-fase6-a83b11a.txt", "utf8");
function respuestas(): Map<string, string> {
  const r = new Map<string, string>();
  for (const bloque of grabacion.split(/^## /m).slice(1)) {
    const pregunta = bloque.split("\n")[0]!.trim();
    const texto = bloque.split(/^respuesta:\n/m)[1]?.trim() ?? "";
    r.set(pregunta, texto);
  }
  return r;
}

describe("fase 7: verificador de cifras ampliado (ADR-023)", () => {
  it("respalda la forma porcentual de una tasa del núcleo y rechaza porcentajes ajenos, incluidos los enteros", () => {
    const permitidas = cifrasDe({ tasa: "0.24", porcentaje: "10.51", respuesta: "tasa nominal anual única del 24 %", tramo: { tasa: "0.18" } });
    expect(verificarCifras("Tasa 0.24 (24 % anual), riesgo 10.51 %, Mora 1 al 18 %.", permitidas).verificadas).toBe(true);
    expect(verificarCifras("Cartera activa (100%).", permitidas).ajenas).toEqual(["100%"]);
    expect(verificarCifras("Riesgo 11 %.", permitidas).ajenas).toEqual(["11 %"]);
    expect(verificarCifras("Hay 44 pagos y 65 días.", permitidas).verificadas).toBe(true);
    // Defecto heredado de fase 6 corregido: una cifra al final de una oración también se verifica.
    expect(verificarCifras("El total es de Q 370.85.", cifrasDe({ total: "370.85" })).verificadas).toBe(true);
    expect(verificarCifras("El total es de Q 999.99.", cifrasDe({ total: "370.85" })).ajenas).toEqual(["Q 999.99"]);
  });

  it("mide la transcripción real de fase 6: G-2 y G-3 traían «(100%)» sin respaldo; el resto, ninguna cifra ajena", () => {
    const textos = respuestas();
    const medicion: Record<string, readonly string[]> = {};
    for (const caso of CASOS_EVAL.filter((c) => c.ruta === "MCP")) {
      const texto = textos.get(caso.pregunta);
      expect(texto, caso.id).toBeDefined();
      const permitidas = new Set<string>();
      for (const h of caso.herramientas) cifrasDe(oraculo.estados.POST_OP1_OP3.resultados[h.oraculo], permitidas);
      medicion[caso.id] = verificarCifras(texto ?? "", permitidas).ajenas;
    }
    // Medición sobre la grabación: con el verificador de fase 6 estos dos textos se mostraron; con el ampliado se ocultan.
    expect(medicion).toEqual({ "G-1": [], "G-2": ["100%"], "G-3": ["100%"], "G-4": [], "G-5": [], "G-6": [], "G-7": [] });
  });
});
