import { describe, expect, it } from "vitest";
import { DevengoInteres } from "../src/dominio/devengo-interes.js";
import { FechaCivil, DiasAtraso } from "../src/dominio/calculadora-mora.js";
import { Dinero } from "../src/dominio/dinero.js";

const fecha = (s: string) => FechaCivil.desdeCadena(s);
const q = (s: string) => Dinero.desdeCadena(s, "GTQ");
const movimiento = (s: string, dias: number, importe = "10") => Object.freeze({ fecha: fecha(s), diasAtraso: DiasAtraso.desdeNumero(dias), importe: q(importe) });
const dia90 = DevengoInteres.iniciar("CR-1", "GTQ").aplicarCorte(fecha("2026-12-30"), [movimiento("2026-12-30", 90)]);
const pendientes = Object.freeze([movimiento("2026-12-31", 91), movimiento("2027-01-09", 100)]);

describe("CP-04.2: devengo monetario por corte", () => {
  it("día 90 reconoce; días 91 y 100 acumulan suspenso sin aumentar ingreso", () => {
    const dia100 = dia90.aplicarCorte(fecha("2027-01-09"), pendientes);
    expect(dia90.ingresoReconocido.aCadena()).toBe("10.00");
    expect(dia100.ingresoReconocido.aCadena()).toBe("10.00");
    expect(dia100.interesEnSuspenso.aCadena()).toBe("20.00");
    expect(dia100.reconocidoEnPeriodo.aCadena()).toBe("0.00");
    expect(dia100.devengoActivo).toBe(false);
    expect(dia90.interesEnSuspenso.aCadena()).toBe("0.00");
  });
  it("regulariza, reconoce el suspenso una vez y reactiva", () => {
    const suspendido = dia90.aplicarCorte(fecha("2027-01-09"), pendientes);
    const regularizado = suspendido.aplicarCorte(fecha("2027-01-10"), [], true);
    expect(regularizado.ingresoReconocido.aCadena()).toBe("30.00");
    expect(regularizado.reconocidoEnPeriodo.aCadena()).toBe("20.00");
    expect(regularizado.interesEnSuspenso.aCadena()).toBe("0.00");
    expect(regularizado.devengoActivo).toBe(true);
    expect(regularizado.aplicarCorte(fecha("2027-01-10"), [], true)).toBe(regularizado);
    const siguiente = regularizado.aplicarCorte(fecha("2027-01-11"), [movimiento("2027-01-11", 0)], true);
    expect(siguiente.ingresoReconocido.aCadena()).toBe("40.00");
    expect(siguiente.reconocidoEnPeriodo.aCadena()).toBe("10.00");
  });
  it("repetir un corte no duplica ni acepta cambios de importe", () => {
    const r = dia90.aplicarCorte(fecha("2027-01-09"), pendientes);
    expect(r.aplicarCorte(fecha("2027-01-09"), pendientes)).toBe(r);
    expect(() => r.aplicarCorte(fecha("2027-01-09"), [movimiento("2027-01-09", 100, "21")])).toThrow("Conflicto");
  });
  it("rechaza solapamiento, fechas futuras, regresión y duplicados", () => {
    expect(() => dia90.aplicarCorte(fecha("2026-12-29"), [])).toThrow("regresivo");
    expect(() => dia90.aplicarCorte(fecha("2026-12-31"), [movimiento("2026-12-30", 90)])).toThrow("fuera de período");
    expect(() => dia90.aplicarCorte(fecha("2026-12-31"), [movimiento("2027-01-01", 92)])).toThrow("fuera de período");
    expect(() => dia90.aplicarCorte(fecha("2026-12-31"), [pendientes[0]!, pendientes[0]!])).toThrow("duplicado");
  });
  it("rechaza importes negativos y monedas diferentes sin efectos parciales", () => {
    expect(() => dia90.aplicarCorte(fecha("2026-12-31"), [movimiento("2026-12-31", 91, "-1")])).toThrow("negativo");
    expect(() => dia90.aplicarCorte(fecha("2026-12-31"), [{ ...movimiento("2026-12-31", 91), importe: Dinero.desdeCadena("10", "USD") }])).toThrow();
    expect(dia90.ingresoReconocido.aCadena()).toBe("10.00");
  });
});
