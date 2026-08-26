import { describe, expect, it } from "vitest";

import {
  carteraRiesgoSchema,
  crearClienteSchema,
  crearSolicitudSchema,
  dineroSchema,
  errorApiSchema,
  idempotencyKeySchema,
  registrarPagoSchema,
} from "../src/contratos/esquemas.js";

describe("contratos Zod", () => {
  it("acepta un cliente con identificador legal extensible", () => {
    expect(crearClienteSchema.parse({
      nombreCompleto: "María López",
      identificadorLegal: { tipo: "DPI", valor: "1234567890101" },
    }).nombreCompleto).toBe("María López");
  });

  it("rechaza campos no declarados", () => {
    expect(() => crearClienteSchema.parse({
      nombreCompleto: "María López",
      identificadorLegal: { tipo: "DPI", valor: "1234567890101" },
      privilegio: "ADMIN",
    })).toThrow();
  });

  it.each([
    ["1000.00", 3], ["25000.00", 24],
  ])("acepta límites de solicitud %s/%i", (importe, plazoMeses) => {
    expect(crearSolicitudSchema.safeParse({
      clienteId: "CLI-001", monto: { importe, moneda: "GTQ" }, plazoMeses,
    }).success).toBe(true);
  });

  it.each(["999.99", "25000.01"])("rechaza monto fuera de rango %s", (importe) => {
    expect(crearSolicitudSchema.safeParse({
      clienteId: "CLI-001", monto: { importe, moneda: "GTQ" }, plazoMeses: 12,
    }).success).toBe(false);
  });

  it("representa dinero mediante cadena decimal y rechaza number", () => {
    expect(dineroSchema.safeParse({ importe: "725.76", moneda: "GTQ" }).success).toBe(true);
    expect(dineroSchema.safeParse({ importe: 725.76, moneda: "GTQ" }).success).toBe(false);
  });

  it("exige pagos positivos y fecha explícita", () => {
    expect(registrarPagoSchema.safeParse({
      importe: "500.00", moneda: "GTQ", fechaPago: "2026-04-25", usuarioProceso: "caja-01",
    }).success).toBe(true);
    expect(registrarPagoSchema.safeParse({
      importe: "0.00", moneda: "GTQ", fechaPago: "2026-04-25", usuarioProceso: "caja-01",
    }).success).toBe(false);
  });

  it("valida Idempotency-Key como ASCII visible de 1 a 255 caracteres", () => {
    expect(idempotencyKeySchema.safeParse("pago-2026-0001").success).toBe(true);
    expect(idempotencyKeySchema.safeParse("con espacio").success).toBe(false);
    expect(idempotencyKeySchema.safeParse("x".repeat(256)).success).toBe(false);
  });

  it("discrimina cartera con razón y sin cartera activa", () => {
    expect(carteraRiesgoSchema.safeParse({
      tipo: "CON_RAZON", fechaCorte: "2026-04-30",
      carteraActiva: { importe: "800000.00", moneda: "GTQ" },
      capitalEnRiesgo: { importe: "56000.00", moneda: "GTQ" },
      razon: "0.07", porcentaje: "7.00",
    }).success).toBe(true);
    expect(carteraRiesgoSchema.safeParse({
      tipo: "SIN_CARTERA_ACTIVA", fechaCorte: "2026-04-30",
      carteraActiva: { importe: "0.00", moneda: "GTQ" },
      capitalEnRiesgo: { importe: "0.00", moneda: "GTQ" },
    }).success).toBe(true);
  });

  it("valida la estructura uniforme de errores (RFC 9457)", () => {
    expect(errorApiSchema.safeParse({
      type: "https://api.example.invalid/probs/validation-error",
      title: "Solicitud inválida",
      status: 400,
      detail: "La solicitud no cumple las reglas.",
      errorCode: "SOLICITUD_INVALIDA",
      details: [{ campo: "monto.importe", codigo: "FUERA_DE_RANGO", mensaje: "Fuera de rango." }],
      traceId: "traza-001",
      timestamp: "2026-04-25T10:00:00.000Z",
    }).success).toBe(true);
  });

  it("rechaza un error sin los campos obligatorios de RFC 9457", () => {
    expect(errorApiSchema.safeParse({
      codigo: "SOLICITUD_INVALIDA",
      mensaje: "Forma legada, ya no admitida.",
      traceId: "traza-001",
    }).success).toBe(false);
  });
});
