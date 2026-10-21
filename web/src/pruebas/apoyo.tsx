import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";
import { App } from "../App";
import { ProveedorSesion } from "../sesion/SesionContexto";

/*
 * Solo pruebas de interfaz: respuestas sintéticas con la forma del contrato (los importes no son
 * cifras canónicas). La API real se ejercita en tests/integracion y en los recorridos e2e.
 */
const q = (importe: string) => ({ importe, moneda: "GTQ" });
export const sesion = { sesionId: "SES-PRUEBA", perfil: "ASESOR", sujetoId: "ASESOR-DEMO", fechaCorteDefecto: "2026-10-31" };
export const resumen = { creditoId: "CV-PRUEBA", fechaCorte: "2026-10-31", estado: "EN_MORA", saldoCapital: q("900.00"), diasAtraso: 12,
  tramo: "MORA_1", cuotasPagadas: 1, cuotasVencidas: 1, proximaCuota: { numeroCuota: 2, fechaVencimiento: "2026-10-19", importe: q("110.00") },
  versionCredito: 3 };
export const ficha = { resumen, clienteId: "CL-PRUEBA", nombreCliente: "Persona de Prueba", municipio: "Municipio de Prueba", asesorId: "AS-01",
  capitalOriginal: q("1000.00"), tasaNominalAnual: "0.24", plazoMeses: 10, fechaSolicitud: "2026-08-19", fechaDesembolso: "2026-08-19",
  politicaId: "POL-2024-01", reestructurado: false, historial: [] };
export const deuda = { creditoId: "CV-PRUEBA", fechaCorte: "2026-10-31", numeroCuota: 2, gastosComisiones: q("0.00"), interesMoratorio: q("1.11"),
  interesCorriente: q("10.00"), capital: q("100.00"), totalExigible: q("111.11") };
export const aplicacion = { gastosComisiones: q("0.00"), interesMoratorio: q("1.11"), interesCorriente: q("10.00"), capital: q("100.00"), excedente: q("0.00") };
export const propuesta = { creditoId: "CV-PRUEBA", fechaCorte: "2026-10-31", numeroCuota: 2, monto: q("111.11"), claveIdempotencia: "CLAVE-PRUEBA",
  propuestaId: "PROP-PRUEBA", sesionId: "SES-PRUEBA", estado: "PENDIENTE", versionCredito: 3, deuda, aplicacionPrevista: aplicacion, estadoPrevisto: "VIGENTE" };
export const pago = { importe: "111.11", moneda: "GTQ", fechaPago: "2026-10-31", usuarioProceso: "ASESOR-DEMO", pagoId: "PAGO-PRUEBA",
  creditoId: "CV-PRUEBA", idempotencyKey: "CLAVE-PRUEBA", aplicacion };
export const problema = (errorCode: string, status: number, extra: Record<string, unknown> = {}) => ({ type: `urn:prueba:${errorCode}`, title: errorCode,
  status, detail: `Detalle ${errorCode}`, errorCode, traceId: "TRAZA", timestamp: "2026-10-31T00:00:00Z", ...extra });

export interface Llamada { readonly metodo: string; readonly ruta: string; readonly cuerpo: unknown; readonly cabeceras: Record<string, string> }
type Respuesta = { status?: number; cuerpo: unknown; cabeceras?: Record<string, string> } | "sin-conexion";
/** Sustituye fetch por un enrutador de respuestas; registra cada llamada para las aserciones. */
export function simularApi(rutas: Record<string, (l: Llamada) => Respuesta>) {
  const llamadas: Llamada[] = [];
  vi.stubGlobal("fetch", vi.fn(async (entrada: string, init: RequestInit = {}) => {
    const url = new URL(entrada, "http://localhost");
    const llamada = { metodo: init.method ?? "GET", ruta: url.pathname + url.search, cuerpo: init.body ? JSON.parse(String(init.body)) : undefined,
      cabeceras: Object.fromEntries(Object.entries((init.headers ?? {}) as Record<string, string>).map(([k, v]) => [k.toLowerCase(), v])) };
    llamadas.push(llamada);
    const clave = `${llamada.metodo} ${url.pathname}`;
    const manejador: ((l: Llamada) => Respuesta) | undefined = rutas[clave] ?? (clave === "GET /v1/sesion" ? () => ({ cuerpo: sesion }) : undefined);
    if (manejador === undefined) return new Response(JSON.stringify(problema("RUTA_NO_SIMULADA", 404)), { status: 404 });
    const r = manejador(llamada);
    if (r === "sin-conexion") throw new TypeError("Failed to fetch");
    return new Response(JSON.stringify(r.cuerpo), { status: r.status ?? 200, headers: { "Content-Type": "application/json", ...(r.cabeceras ?? {}) } });
  }));
  return llamadas;
}

export function montar(ruta: string) {
  return render(<MemoryRouter initialEntries={[ruta]}><ProveedorSesion><App /></ProveedorSesion></MemoryRouter>);
}
