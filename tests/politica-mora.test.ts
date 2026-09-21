import { describe, expect, it } from "vitest";
import { CalculadoraMora, DiasAtraso, FechaCivil } from "../src/dominio/calculadora-mora.js";
import { Dinero } from "../src/dominio/dinero.js";
import { PoliticaEscalonada } from "../src/dominio/politica-mora/politica-escalonada.js";
import { PoliticaPlana } from "../src/dominio/politica-mora/politica-plana.js";
import { PoliticaRetroactiva } from "../src/dominio/politica-mora/politica-retroactiva.js";
import { resolverPolitica } from "../src/dominio/politica-mora/catalogo-politicas.js";

const capital = Dinero.desdeCadena("725.76", "GTQ");
const escalonada = new CalculadoraMora(new PoliticaEscalonada());
const mora = (dias: number) => escalonada.calcular(capital, DiasAtraso.desdeNumero(dias)).interesMoratorio;

describe("CP-01: políticas versionadas", () => {
  it.each([[0, "0.00"], [15, "5.44"], [45, "18.14"], [100, "50.80"],
    [120, "65.32"], [121, "65.32"], [150, "65.32"]])("M-1 a M-4 y congelación: día %s = %s", (dias, esperado) => {
    expect(mora(dias as number).aCadena()).toBe(esperado);
  });
  it.each([["2026-09-30", "POL-2024-01", "7.26"], ["2026-10-01", "POL-2026-10", "5.44"],
    ["2027-01-01", "POL-2026-10", "5.44"]])("elige por otorgamiento %s", (fecha, id, esperado) => {
    const politica = resolverPolitica(FechaCivil.desdeCadena(fecha));
    expect(politica.id).toBe(id);
    expect(new CalculadoraMora(politica).calcular(capital, DiasAtraso.desdeNumero(15)).interesMoratorio.aCadena()).toBe(esperado);
  });
  it("conserva la plana de 45 días", () => {
    expect(new CalculadoraMora(new PoliticaPlana()).calcular(capital, DiasAtraso.desdeNumero(45)).interesMoratorio.aCadena()).toBe("21.77");
  });
  it("desglosa sin redondear cada tramo", () => {
    const resultado = escalonada.calcular(capital, DiasAtraso.desdeNumero(100));
    expect(resultado.detalle.tramos.map((t) => t.importeSinRedondear)).toEqual(["10.8864", "14.5152", "18.144", "7.2576"]);
    expect(resultado.detalle.totalSinRedondear).toBe("50.8032");
    // Redondear cada tramo daría 50.81; el total correcto es 50.80.
    expect(resultado.interesMoratorio.aCadena()).toBe("50.80");
  });
  it("calcula cada cuota con su vencimiento y corte explícitos", () => {
    const cuotas = Object.freeze([
      Object.freeze({ referencia: "1", capitalVencido: capital, fechaVencimiento: FechaCivil.desdeCadena("2026-10-01") }),
      Object.freeze({ referencia: "2", capitalVencido: capital, fechaVencimiento: FechaCivil.desdeCadena("2026-10-31") }),
    ]);
    const resultados = escalonada.calcularVariasCuotas(cuotas, FechaCivil.desdeCadena("2026-11-15"));
    expect(resultados.map((r) => r.interesMoratorio.aCadena())).toEqual(["18.14", "5.44"]);
  });
  it("invariantes 1, 2 y 4: monotonía, comparación 1–120 y plana al 18%", () => {
    const retro = new CalculadoraMora(new PoliticaRetroactiva());
    const plana18 = new CalculadoraMora(new PoliticaPlana("0.18"));
    for (let dia = 1; dia <= 120; dia++) {
      const dias = DiasAtraso.desdeNumero(dia);
      expect(mora(dia).esMayorOIgualQue(mora(dia - 1)), `monotonía ${dia}`).toBe(true);
      expect(mora(dia).esMenorOIgualQue(retro.calcular(capital, dias).interesMoratorio), `retro ${dia}`).toBe(true);
      if (dia <= 30) expect(mora(dia).aCadena()).toBe(plana18.calcular(capital, dias).interesMoratorio.aCadena());
    }
    for (const dia of [121, 150, 365, 10000]) expect(mora(dia).aCadena()).toBe(mora(120).aCadena());
  });
});
