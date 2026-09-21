import { describe, expect, it } from "vitest";
import { Credito, EstadoCredito, TransicionInvalida } from "../src/dominio/credito-estado.js";
import { FechaCivil } from "../src/dominio/calculadora-mora.js";
import { Dinero } from "../src/dominio/dinero.js";
const e = { fecha: FechaCivil.desdeCadena("2026-12-01"), usuarioProceso: "prueba", motivo: "pago total" };
const q = (s: string) => Dinero.desdeCadena(s, "GTQ");
function enMora() {
  const c = new Credito("C"); c.aprobar(e, true, true); c.desembolsar(e, true, true, true);
  c.activar(e, true, true); c.detectarMora(e, 45, true); return c;
}
describe("CP-04.1: pago que liquida EN_MORA", () => {
  it("cancela con saldo exacto cero, sin pendientes y evidencia", () => {
    const c = enMora(); c.liquidarConPago(e, q("0"), 0);
    expect(c.estado).toBe(EstadoCredito.CANCELADO);
    expect(c.historial.at(-1)).toMatchObject({ estadoAnterior: EstadoCredito.EN_MORA, estadoNuevo: EstadoCredito.CANCELADO, motivo: e.motivo, usuarioProceso: e.usuarioProceso, fecha: e.fecha });
  });
  it.each([["0.01", 0], ["0", 1], ["-0.01", 0], ["0", -1], ["0", 1.5]] as const)("rechaza saldo %s y pendientes %s", (saldo, pendientes) => {
    const c = enMora(); const n = c.historial.length;
    expect(() => c.liquidarConPago(e, q(saldo), pendientes)).toThrow();
    expect(c.estado).toBe(EstadoCredito.EN_MORA); expect(c.historial).toHaveLength(n);
  });
  it("SOLICITADO no puede pagar ni cancelar con ninguna fachada", () => {
    const c = new Credito("S");
    expect(() => c.liquidarConPago(e, q("0"), 0)).toThrow(TransicionInvalida);
    expect(() => c.cancelar(e, true, true)).toThrow(TransicionInvalida);
    expect(() => c.registrarPagoParcial(e, true)).toThrow(TransicionInvalida);
    expect(c.historial).toHaveLength(0);
  });
});
