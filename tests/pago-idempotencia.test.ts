import { describe, expect, it } from "vitest";

import {
  type GeneradorPagoId,
  RegistrarPago,
  type RepositorioPagosIdempotentes,
  type ResultadoEjecucionIdempotente,
} from "../src/aplicacion/registrar-pago.js";
import { FechaCivil } from "../src/dominio/calculadora-mora.js";
import { Dinero } from "../src/dominio/dinero.js";
import {
  ClaveIdempotencia,
  ClaveIdempotenciaInvalida,
  ConflictoIdempotencia,
  HuellaSolicitudPago,
  type PagoRegistrado,
} from "../src/dominio/pago-idempotente.js";

class RepositorioPagosMemoria implements RepositorioPagosIdempotentes {
  readonly #pagos = new Map<string, PagoRegistrado>();

  public ejecutarUnaVez(
    creditoId: string,
    clave: ClaveIdempotencia,
    huella: HuellaSolicitudPago,
    crear: () => PagoRegistrado,
  ): ResultadoEjecucionIdempotente {
    const alcance = `${creditoId}\u0000${clave.valor}`;
    const existente = this.#pagos.get(alcance);
    if (existente !== undefined) {
      if (!existente.huella.esIgualA(huella)) throw new ConflictoIdempotencia();
      return Object.freeze({ pago: existente, repetido: true });
    }
    const pago = crear();
    this.#pagos.set(alcance, pago);
    return Object.freeze({ pago, repetido: false });
  }

  public cantidad(): number { return this.#pagos.size; }
}

class GeneradorSecuencial implements GeneradorPagoId {
  public llamadas = 0;
  public siguiente(): string {
    this.llamadas += 1;
    return `PAGO-${this.llamadas}`;
  }
}

const gtq = (valor: string): Dinero => Dinero.desdeCadena(valor, "GTQ");
const comando = (clave = "pago-2026-0001", importe = "500.00", creditoId = "CR-001") => ({
  creditoId,
  claveIdempotencia: clave,
  importe: gtq(importe),
  fechaPago: FechaCivil.desdeCadena("2026-04-25"),
  usuarioProceso: "caja-01",
  saldosExigibles: {
    gastosComisiones: gtq("0"),
    interesMoratorio: gtq("7.26"),
    interesCorriente: gtq("278.86"),
    capital: gtq("725.76"),
  },
  contextoExcedente: { capitalNoExigible: gtq("5000"), cuotasFuturas: gtq("5000") },
});

describe("registro idempotente de pagos", () => {
  it("crea y aplica el primer pago una sola vez", () => {
    const repositorio = new RepositorioPagosMemoria();
    const ids = new GeneradorSecuencial();
    const servicio = new RegistrarPago(repositorio, ids);
    const resultado = servicio.ejecutar(comando());
    expect(resultado.repetido).toBe(false);
    expect(resultado.pago.pagoId).toBe("PAGO-1");
    expect(resultado.pago.aplicacion.pago.aCadena()).toBe("500.00");
    expect(repositorio.cantidad()).toBe(1);
    expect(ids.llamadas).toBe(1);
  });

  it("reintentar exactamente lo mismo devuelve el mismo resultado", () => {
    const repositorio = new RepositorioPagosMemoria();
    const ids = new GeneradorSecuencial();
    const servicio = new RegistrarPago(repositorio, ids);
    const primero = servicio.ejecutar(comando());
    const segundo = servicio.ejecutar(comando());
    expect(segundo.repetido).toBe(true);
    expect(segundo.pago).toBe(primero.pago);
    expect(repositorio.cantidad()).toBe(1);
    expect(ids.llamadas).toBe(1);
  });

  it("misma clave con importe diferente produce conflicto sin reemplazar", () => {
    const repositorio = new RepositorioPagosMemoria();
    const ids = new GeneradorSecuencial();
    const servicio = new RegistrarPago(repositorio, ids);
    const primero = servicio.ejecutar(comando());
    expect(() => servicio.ejecutar(comando("pago-2026-0001", "501.00"))).toThrow(ConflictoIdempotencia);
    expect(repositorio.cantidad()).toBe(1);
    expect(ids.llamadas).toBe(1);
    expect(primero.pago.aplicacion.pago.aCadena()).toBe("500.00");
  });

  it("la misma clave puede usarse en otro crédito por el alcance definido", () => {
    const repositorio = new RepositorioPagosMemoria();
    const ids = new GeneradorSecuencial();
    const servicio = new RegistrarPago(repositorio, ids);
    servicio.ejecutar(comando("clave-compartida", "500.00", "CR-001"));
    servicio.ejecutar(comando("clave-compartida", "500.00", "CR-002"));
    expect(repositorio.cantidad()).toBe(2);
    expect(ids.llamadas).toBe(2);
  });

  it.each(["", "con espacio", "á", "x".repeat(256)])("rechaza clave inválida", (clave) => {
    const servicio = new RegistrarPago(new RepositorioPagosMemoria(), new GeneradorSecuencial());
    expect(() => servicio.ejecutar(comando(clave))).toThrow(ClaveIdempotenciaInvalida);
  });

  it("la huella distingue fecha y actor además del importe", () => {
    const base = HuellaSolicitudPago.crear({
      creditoId: "CR-1", importe: "500.00", moneda: "GTQ", fechaPago: "2026-01-01", usuarioProceso: "caja-1",
    });
    const otra = HuellaSolicitudPago.crear({
      creditoId: "CR-1", importe: "500.00", moneda: "GTQ", fechaPago: "2026-01-02", usuarioProceso: "caja-1",
    });
    expect(base.esIgualA(otra)).toBe(false);
  });
});
