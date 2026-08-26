import { describe, expect, it } from "vitest";

import { FechaCivil } from "../src/dominio/calculadora-mora.js";
import {
  Credito,
  CronologiaTransicionInvalida,
  EstadoCredito,
  EvidenciaTransicionInvalida,
  GuardaTransicionIncumplida,
  TransicionInvalida,
  type EvidenciaTransicion,
} from "../src/dominio/credito-estado.js";

const evidencia = (dia: number, motivo = "motivo válido"): EvidenciaTransicion => ({
  fecha: FechaCivil.desdeCadena(`2026-01-${dia.toString().padStart(2, "0")}`),
  usuarioProceso: "usuario-01",
  motivo,
});

function vigente(): Credito {
  const credito = new Credito("CR-001");
  credito.aprobar(evidencia(1), true, true);
  credito.desembolsar(evidencia(2), true, true, true);
  credito.activar(evidencia(3), true, true);
  return credito;
}

describe("State: originación y activación", () => {
  it("recorre SOLICITADO → APROBADO → DESEMBOLSADO → VIGENTE", () => {
    const credito = vigente();
    expect(credito.estado).toBe(EstadoCredito.VIGENTE);
    expect(credito.historial.map((t) => t.estadoNuevo)).toEqual([
      EstadoCredito.APROBADO, EstadoCredito.DESEMBOLSADO, EstadoCredito.VIGENTE,
    ]);
  });

  it("permite SOLICITADO → RECHAZADO", () => {
    const credito = new Credito("CR-002");
    credito.rechazar(evidencia(1, "riesgo no aceptado"), true, true);
    expect(credito.estado).toBe(EstadoCredito.RECHAZADO);
  });

  it("permite APROBADO → ANULADO sin desembolso", () => {
    const credito = new Credito("CR-003");
    credito.aprobar(evidencia(1), true, true);
    credito.anular(evidencia(2, "desistimiento"), true);
    expect(credito.estado).toBe(EstadoCredito.ANULADO);
  });

  it.each([
    [false, true], [true, false],
  ])("protege las guardas de aprobación", (evaluacion, autorizado) => {
    expect(() => new Credito("CR-X").aprobar(evidencia(1), evaluacion, autorizado)).toThrow(GuardaTransicionIncumplida);
  });

  it("protege las tres guardas del desembolso", () => {
    const credito = new Credito("CR-X");
    credito.aprobar(evidencia(1), true, true);
    expect(() => credito.desembolsar(evidencia(2), false, true, true)).toThrow(GuardaTransicionIncumplida);
    expect(() => credito.desembolsar(evidencia(2), true, false, true)).toThrow(GuardaTransicionIncumplida);
    expect(() => credito.desembolsar(evidencia(2), true, true, false)).toThrow(GuardaTransicionIncumplida);
  });
});

describe("State: deterioro, recuperación y cancelación", () => {
  it("recorre VIGENTE → EN_MORA → VIGENTE y reactiva devengo", () => {
    const credito = vigente();
    credito.detectarMora(evidencia(4), 91, true);
    expect(credito.devengoInteresCorrienteActivo).toBe(false);
    credito.regularizar(evidencia(5), true, true);
    expect(credito.estado).toBe(EstadoCredito.VIGENTE);
    expect(credito.devengoInteresCorrienteActivo).toBe(true);
  });

  it("mantiene devengo a 90 días y lo suspende a 91", () => {
    const aNoventa = vigente();
    aNoventa.detectarMora(evidencia(4), 90, true);
    expect(aNoventa.devengoInteresCorrienteActivo).toBe(true);

    const aNoventaYUno = vigente();
    aNoventaYUno.detectarMora(evidencia(4), 91, true);
    expect(aNoventaYUno.devengoInteresCorrienteActivo).toBe(false);
  });

  it("registra pago parcial como EN_MORA → EN_MORA", () => {
    const credito = vigente();
    credito.detectarMora(evidencia(4), 10, true);
    credito.registrarPagoParcial(evidencia(5, "abono parcial"), true);
    const ultima = credito.historial.at(-1);
    expect(ultima?.estadoAnterior).toBe(EstadoCredito.EN_MORA);
    expect(ultima?.estadoNuevo).toBe(EstadoCredito.EN_MORA);
  });

  it("recorre EN_MORA → REESTRUCTURADO → EN_MORA", () => {
    const credito = vigente();
    credito.detectarMora(evidencia(4), 30, true);
    credito.reestructurar(evidencia(5), true, true);
    expect(credito.estado).toBe(EstadoCredito.REESTRUCTURADO);
    credito.detectarMora(evidencia(6), 1, true);
    expect(credito.estado).toBe(EstadoCredito.EN_MORA);
  });

  it("cancela desde VIGENTE con saldos en cero", () => {
    const credito = vigente();
    credito.cancelar(evidencia(4), true, true);
    expect(credito.estado).toBe(EstadoCredito.CANCELADO);
  });

  it("cancela desde REESTRUCTURADO con saldos en cero", () => {
    const credito = vigente();
    credito.detectarMora(evidencia(4), 20, true);
    credito.reestructurar(evidencia(5), true, true);
    credito.cancelar(evidencia(6), true, true);
    expect(credito.estado).toBe(EstadoCredito.CANCELADO);
  });

  it("rechaza regularización, parcial, mora y cancelación sin sus guardas", () => {
    const credito = vigente();
    expect(() => credito.detectarMora(evidencia(4), 0, true)).toThrow(GuardaTransicionIncumplida);
    credito.detectarMora(evidencia(4), 1, true);
    expect(() => credito.registrarPagoParcial(evidencia(5), false)).toThrow(GuardaTransicionIncumplida);
    expect(() => credito.regularizar(evidencia(5), true, false)).toThrow(GuardaTransicionIncumplida);
  });
});

describe("State: salida incobrable y estados terminales", () => {
  it("declara INCOBRABLE solo después de 120 días y con autorización", () => {
    const credito = vigente();
    credito.detectarMora(evidencia(4), 121, true);
    expect(() => credito.declararIncobrable(evidencia(5), 120, true)).toThrow(GuardaTransicionIncumplida);
    expect(() => credito.declararIncobrable(evidencia(5), 121, false)).toThrow(GuardaTransicionIncumplida);
    credito.declararIncobrable(evidencia(5), 121, true);
    expect(credito.estado).toBe(EstadoCredito.INCOBRABLE);
  });

  it("una recuperación no reactiva INCOBRABLE ni agrega transición", () => {
    const credito = vigente();
    credito.detectarMora(evidencia(4), 121, true);
    credito.declararIncobrable(evidencia(5), 121, true);
    const cantidad = credito.historial.length;
    credito.registrarRecuperacion();
    expect(credito.estado).toBe(EstadoCredito.INCOBRABLE);
    expect(credito.historial).toHaveLength(cantidad);
    expect(() => credito.detectarMora(evidencia(6), 130, true)).toThrow(TransicionInvalida);
  });

  it.each([EstadoCredito.RECHAZADO, EstadoCredito.CANCELADO])(
    "%s es terminal",
    (terminal) => {
      const credito = terminal === EstadoCredito.RECHAZADO ? new Credito("CR-T") : vigente();
      if (terminal === EstadoCredito.RECHAZADO) credito.rechazar(evidencia(1), true, true);
      if (terminal === EstadoCredito.CANCELADO) credito.cancelar(evidencia(4), true, true);
      expect(() => credito.detectarMora(evidencia(6), 1, true)).toThrow(TransicionInvalida);
    },
  );

  it("ANULADO es terminal", () => {
    const credito = new Credito("CR-A");
    credito.aprobar(evidencia(1), true, true);
    credito.anular(evidencia(2), true);
    expect(() => credito.desembolsar(evidencia(3), true, true, true)).toThrow(TransicionInvalida);
  });

  it("SOLICITADO y RECHAZADO no admiten pagos", () => {
    const solicitado = new Credito("CR-S");
    expect(() => solicitado.registrarPagoParcial(evidencia(1), true)).toThrow(TransicionInvalida);
    solicitado.rechazar(evidencia(1), true, true);
    expect(() => solicitado.registrarPagoParcial(evidencia(2), true)).toThrow(TransicionInvalida);
  });
});

describe("historial auditable y append-only", () => {
  it("conserva los cinco datos obligatorios e inmutables", () => {
    const credito = new Credito("CR-H");
    credito.aprobar(evidencia(1, "aprobación documentada"), true, true);
    const transicion = credito.historial[0];
    expect(transicion).toMatchObject({
      estadoAnterior: EstadoCredito.SOLICITADO,
      estadoNuevo: EstadoCredito.APROBADO,
      usuarioProceso: "usuario-01",
      motivo: "aprobación documentada",
    });
    expect(transicion?.fecha.valor).toBe("2026-01-01");
    expect(Object.isFrozen(transicion)).toBe(true);
    expect(Object.isFrozen(credito.historial)).toBe(true);
  });

  it.each(["", "   "])("rechaza motivo vacío", (motivo) => {
    expect(() => new Credito("CR-H").aprobar(evidencia(1, motivo), true, true)).toThrow(EvidenciaTransicionInvalida);
  });

  it("rechaza cronología regresiva sin alterar estado ni historial", () => {
    const credito = new Credito("CR-H");
    credito.aprobar(evidencia(2), true, true);
    expect(() => credito.desembolsar(evidencia(1), true, true, true)).toThrow(CronologiaTransicionInvalida);
    expect(credito.estado).toBe(EstadoCredito.APROBADO);
    expect(credito.historial).toHaveLength(1);
  });

  it("una transición inválida no deja evidencia parcial", () => {
    const credito = new Credito("CR-H");
    expect(() => credito.cancelar(evidencia(1), true, true)).toThrow(TransicionInvalida);
    expect(credito.estado).toBe(EstadoCredito.SOLICITADO);
    expect(credito.historial).toHaveLength(0);
  });
});
