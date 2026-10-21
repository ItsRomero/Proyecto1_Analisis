import { describe, expect, it } from "vitest";
import { RegistrarPago, type RepositorioPagosIdempotentes } from "../src/aplicacion/registrar-pago.js";
import { ConflictoIdempotencia, type PagoRegistrado } from "../src/dominio/pago-idempotente.js";
import { Dinero } from "../src/dominio/dinero.js";
import { FechaCivil } from "../src/dominio/calculadora-mora.js";
import { respuestaPagoIdempotente } from "../src/api/semantica-pago.js";
import { presentarProblemaFinal } from "../src/api/presentar-problema-final.js";
import { ErrorCasoUsoFinal } from "../src/aplicacion/error-final.js";

describe("fase 1: semántica HTTP sobre RegistrarPago real", () => {
  it("crea con 201, repite con 200 sin efectos y rechaza contenido distinto con 409", () => {
    const registros = new Map<string, PagoRegistrado>();
    let efectos = 0;
    const repositorio: RepositorioPagosIdempotentes = {
      ejecutarUnaVez(credito, clave, huella, crear) {
        const alcance = `${credito}:${clave.valor}`;
        const previo = registros.get(alcance);
        if (previo !== undefined) {
          if (!previo.huella.esIgualA(huella)) throw new ConflictoIdempotencia();
          return { pago: previo, repetido: true };
        }
        const pago = crear(); registros.set(alcance, pago); efectos++;
        return { pago, repetido: false };
      },
    };
    const gtq = (valor: string) => Dinero.desdeCadena(valor, "GTQ");
    const servicio = new RegistrarPago(repositorio, { siguiente: () => "PAGO-1" });
    const comando = { creditoId: "CR-1", claveIdempotencia: "CLAVE-1", importe: gtq("100.00"),
      fechaPago: FechaCivil.desdeCadena("2026-10-31"), usuarioProceso: "asesor-01",
      saldosExigibles: { gastosComisiones: gtq("0"), interesMoratorio: gtq("0"), interesCorriente: gtq("20"), capital: gtq("80") },
      contextoExcedente: { capitalNoExigible: gtq("0"), cuotasFuturas: gtq("0") } };
    const primero = respuestaPagoIdempotente(servicio.ejecutar(comando));
    const repetido = respuestaPagoIdempotente(servicio.ejecutar(comando));
    expect(primero.status).toBe(201);
    expect(primero.headers["Idempotency-Replayed"]).toBe("false");
    expect(repetido.status).toBe(200);
    expect(repetido.headers["Idempotency-Replayed"]).toBe("true");
    expect(repetido.pago).toBe(primero.pago);
    let conflicto: unknown;
    try { servicio.ejecutar({ ...comando, importe: gtq("99.00") }); } catch (error) { conflicto = error; }
    const respuesta = presentarProblemaFinal(conflicto, { traceId: "TRACE-1", timestamp: "2026-10-13T12:00:00Z" });
    expect(respuesta.status).toBe(409);
    expect(respuesta.body.errorCode).toBe("CONFLICTO_IDEMPOTENCIA");
    expect(respuesta.contentType).toBe("application/problem+json");
    expect(efectos).toBe(1);
    expect(registros.size).toBe(1);
  });

  it("devuelve monto correcto para monto no exacto y no filtra errores internos", () => {
    const meta = { traceId: "TRACE-2", timestamp: "2026-10-13T12:00:00Z" };
    const respuesta = presentarProblemaFinal(new ErrorCasoUsoFinal("MONTO_NO_EXACTO", { importe: "100.00", moneda: "GTQ" }), meta);
    expect(respuesta.status).toBe(422);
    expect(respuesta.body.montoCorrecto).toEqual({ importe: "100.00", moneda: "GTQ" });
    const interno = presentarProblemaFinal(new Error("SQL contraseña privada"), meta);
    expect(interno.status).toBe(500);
    expect(JSON.stringify(interno)).not.toContain("contraseña");
  });
});
