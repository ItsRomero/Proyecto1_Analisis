import { describe, expect, it } from "vitest";

import {
  CalculadoraMora,
  DiasAtraso,
  FechaCivil,
  TasaNominalAnualMoratoria,
  TramoMora,
  clasificarTramoMora,
} from "../src/dominio/calculadora-mora.js";
import { CalculadoraCarteraRiesgo } from "../src/dominio/cartera.js";
import {
  Credito,
  EstadoCredito,
  TransicionInvalida,
  type EvidenciaTransicion,
} from "../src/dominio/credito-estado.js";
import { Dinero, MonedasIncompatibles } from "../src/dominio/dinero.js";
import {
  FabricaPlanAmortizacion,
  PlazoMeses,
  TasaNominalAnual,
} from "../src/dominio/plan-amortizacion.js";
import {
  ConceptoPrelacion,
  ProcesadorPrelacionPago,
} from "../src/dominio/prelacion-pago.js";

const gtq = (valor: string): Dinero => Dinero.desdeCadena(valor, "GTQ");
const evidencia = (fecha: string, motivo: string): EvidenciaTransicion => ({
  fecha: FechaCivil.desdeCadena(fecha),
  usuarioProceso: "suite-invariantes",
  motivo,
});

describe("invariantes transversales del plan", () => {
  const plan = new FabricaPlanAmortizacion().crearFrances({
    capital: gtq("10000"),
    tasaNominalAnual: TasaNominalAnual.desdeCadena("0.36"),
    plazo: PlazoMeses.desdeNumero(12),
  });

  it("INV-01: la suma de amortizaciones es exactamente el capital", () => {
    expect(plan.totalAmortizacion.aCadena()).toBe("10000.00");
    expect(plan.totalAmortizacion.esIgualA(plan.capital)).toBe(true);
  });

  it("INV-02: el saldo de la última cuota es exactamente cero", () => {
    expect(plan.saldoFinal().aCadena()).toBe("0.00");
  });

  it("INV-03: ningún saldo ni amortización de capital es negativo", () => {
    for (const cuota of plan.cuotas) {
      expect(cuota.saldoAnterior.esNegativo()).toBe(false);
      expect(cuota.amortizacion.esNegativo()).toBe(false);
      expect(cuota.saldoPosterior.esNegativo()).toBe(false);
    }
  });
});

describe("invariantes transversales de State", () => {
  it("INV-04 e INV-05: SOLICITADO y RECHAZADO no admiten pagos", () => {
    const credito = new Credito("CR-INV");
    expect(() => credito.registrarPagoParcial(
      evidencia("2026-01-01", "pago improcedente"), true,
    )).toThrow(TransicionInvalida);

    credito.rechazar(
      evidencia("2026-01-01", "solicitud rechazada"), true, true,
    );
    expect(() => credito.registrarPagoParcial(
      evidencia("2026-01-02", "pago improcedente"), true,
    )).toThrow(TransicionInvalida);
  });

  it("INV-09: una mora regularizada vuelve a VIGENTE", () => {
    const credito = crearCreditoVigente();
    credito.detectarMora(evidencia("2026-01-04", "cuota vencida"), 91, true);
    credito.regularizar(evidencia("2026-01-05", "vencido cubierto"), true, true);
    expect(credito.estado).toBe(EstadoCredito.VIGENTE);
    expect(credito.devengoInteresCorrienteActivo).toBe(true);
  });

  it("INV-15: cada transición conserva los cinco datos obligatorios", () => {
    const credito = new Credito("CR-AUD");
    credito.aprobar(evidencia("2026-01-01", "evaluación aprobada"), true, true);
    expect(credito.historial[0]).toMatchObject({
      estadoAnterior: EstadoCredito.SOLICITADO,
      estadoNuevo: EstadoCredito.APROBADO,
      usuarioProceso: "suite-invariantes",
      motivo: "evaluación aprobada",
    });
    expect(credito.historial[0]?.fecha.valor).toBe("2026-01-01");
  });

  it("INV-16: una recuperación no reactiva un crédito INCOBRABLE", () => {
    const credito = crearCreditoVigente();
    credito.detectarMora(evidencia("2026-01-04", "atraso severo"), 121, true);
    credito.declararIncobrable(
      evidencia("2026-01-05", "salida contable autorizada"), 121, true,
    );
    const historiaPrevia = credito.historial;
    credito.registrarRecuperacion();
    expect(credito.estado).toBe(EstadoCredito.INCOBRABLE);
    expect(credito.historial).toBe(historiaPrevia);
  });
});

describe("invariantes transversales de mora y pagos", () => {
  it("INV-10: el tramo siempre corresponde a los días calculados", () => {
    const dias = DiasAtraso.entre(
      FechaCivil.desdeCadena("2026-01-01"),
      FechaCivil.desdeCadena("2026-02-01"),
    );
    expect(dias.valor).toBe(31);
    expect(clasificarTramoMora(dias)).toBe(TramoMora.MORA_2);
  });

  it("INV-11: el moratorio se obtiene exclusivamente desde capital vencido", () => {
    const moratorio = CalculadoraMora.calcularInteresMoratorio(
      gtq("725.76"),
      TasaNominalAnualMoratoria.desdeCadena("0.24"),
      DiasAtraso.desdeNumero(15),
    );
    expect(moratorio.aCadena()).toBe("7.26");
  });

  it("INV-12 e INV-13: se conservan pago y excedente", () => {
    const resultado = new ProcesadorPrelacionPago().procesar(
      gtq("3000"),
      {
        gastosComisiones: gtq("0"),
        interesMoratorio: gtq("7.26"),
        interesCorriente: gtq("278.86"),
        capital: gtq("725.76"),
      },
      { capitalNoExigible: gtq("1000"), cuotasFuturas: gtq("0") },
    );
    const aplicado = resultado.pasos.reduce(
      (total, paso) => total.sumar(paso.aplicado), gtq("0"),
    );
    expect(aplicado.sumar(resultado.excedente).esIgualA(resultado.pago)).toBe(true);
    expect(resultado.excedente.aCadena()).toBe("1988.12");
    expect(resultado.resultadoExcedente.total().esIgualA(resultado.excedente)).toBe(true);
    expect(resultado.aplicadoA(ConceptoPrelacion.CAPITAL).aCadena()).toBe("725.76");
  });

  it("INV-14: una ecuación financiera no admite monedas heterogéneas", () => {
    expect(() => new ProcesadorPrelacionPago().procesar(gtq("10"), {
      gastosComisiones: gtq("0"),
      interesMoratorio: gtq("0"),
      interesCorriente: gtq("0"),
      capital: Dinero.desdeCadena("10", "USD"),
    })).toThrow(MonedasIncompatibles);
  });
});

describe("INV-06 y propiedades sistémicas de E4", () => {
  it("INV-06: la razón de cartera pertenece a [0,1]", () => {
    const resultado = CalculadoraCarteraRiesgo.calcular([
      { id: "C-1", estado: EstadoCredito.EN_MORA, saldoCapital: gtq("40"), diasAtraso: 31 },
      { id: "C-2", estado: EstadoCredito.VIGENTE, saldoCapital: gtq("60"), diasAtraso: 0 },
    ], "GTQ");
    expect(resultado.tipo).toBe("CON_RAZON");
    if (resultado.tipo === "CON_RAZON") {
      expect(resultado.razon.aRazonCadena()).toBe("0.4");
      expect(resultado.razon.aPorcentajeCadena()).toBe("40.00");
    }
  });

  it("las mismas entradas generan exactamente las mismas salidas", () => {
    const calcular = () => new FabricaPlanAmortizacion().crearFrances({
      capital: gtq("10000"),
      tasaNominalAnual: TasaNominalAnual.desdeCadena("0.36"),
      plazo: PlazoMeses.desdeNumero(12),
    }).cuotas.map((cuota) => cuota.importe.aCadena());
    expect(calcular()).toEqual(calcular());
  });
});

function crearCreditoVigente(): Credito {
  const credito = new Credito("CR-VIG");
  credito.aprobar(evidencia("2026-01-01", "aprobado"), true, true);
  credito.desembolsar(evidencia("2026-01-02", "desembolso"), true, true, true);
  credito.activar(evidencia("2026-01-03", "activación"), true, true);
  return credito;
}
