import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { estadoChatSchema } from "@contratos/chat";
import { montar, pago, propuesta, simularApi, type Llamada } from "./apoyo";

afterEach(() => cleanup());
const gerencia = { sesionId: "SES-PRUEBA", perfil: "GERENCIA", sujetoId: "GERENCIA-DEMO", fechaCorteDefecto: "2026-10-31" };
const vacio = { chatId: null, mensajes: [], pendientes: [], turnos: 0, maxTurnos: 12, ttlMinutos: 60, ocupado: false, modelo: null };
const cartera = { tipo: "SIN_CARTERA_ACTIVA", fechaCorte: "2026-10-31", carteraActiva: { importe: "0.00", moneda: "GTQ" }, capitalEnRiesgo: { importe: "0.00", moneda: "GTQ" } };
const usuario = (texto: string) => ({ id: `u-${texto.length}`, rol: "USUARIO", texto, ruta: null, clasificacion: "NUMERICA", herramientas: [], citas: [],
  propuestas: [], cifrasVerificadas: true, aviso: null, duracionMs: null, fechaCorte: "2026-10-31" });
const asistente = (extra: Record<string, unknown>) => ({ id: `a-${JSON.stringify(extra).length}`, rol: "ASISTENTE", texto: "", ruta: "MCP", clasificacion: "NUMERICA",
  herramientas: [], citas: [], propuestas: [], cifrasVerificadas: true, aviso: null, duracionMs: 1500, fechaCorte: "2026-10-31", ...extra });
const tarjeta = (herramienta: string, resultado: unknown) => ({ id: `t-${herramienta}`, herramienta, origen: "MCP", argumentos: { fechaCorte: "2026-10-31" },
  estado: "OK", fechaCorte: "2026-10-31", resultado, duracionMs: 900 });
const estado = (mensajes: unknown[], pendientes: unknown[] = []) => estadoChatSchema.parse({ ...vacio, chatId: "CHAT-1", modelo: "modelo-prueba", mensajes, pendientes, turnos: 1 });

describe("chat gerencial en la interfaz", () => {
  it("muestra el origen y el corte de cada cifra, y las citas como referencias legibles", async () => {
    simularApi({ "GET /v1/sesion": () => ({ cuerpo: gerencia }), "GET /v1/chat": () => ({ cuerpo: vacio }),
      "POST /v1/chat/mensajes": () => ({ cuerpo: estado([usuario("¿Cartera?"), asistente({ texto: "Ver la tarjeta de consultar_cartera. Regla [POL-CARTERA-01 §Cartera en riesgo].",
        herramientas: [tarjeta("consultar_cartera", cartera)], ruta: "MCP+RAG",
        citas: [{ documentoId: "POL-CARTERA-01", seccion: "Cartera en riesgo", fragmentoId: "POL-CARTERA-01#3" }] })]) }) });
    montar("/gerencia/asistente");
    await userEvent.type(await screen.findByLabelText("Mensaje para el asistente"), "¿Cartera?{Enter}");
    const respuesta = await screen.findByRole("article", { name: "Respuesta del asistente" });
    expect(within(respuesta).getByText("Núcleo vía MCP")).toBeInTheDocument();
    expect(within(respuesta).getAllByText("consultar_cartera").length).toBeGreaterThan(0);
    expect(respuesta).toHaveTextContent("corte 2026-10-31");
    expect(within(respuesta).getByText("POL-CARTERA-01 § Cartera en riesgo", { selector: "cite" })).toBeInTheDocument();
    expect(respuesta).toHaveTextContent("cifras verificadas contra las herramientas");
  });

  it("una propuesta solo se aprueba con el botón: confirma con evento humano y su Idempotency-Key", async () => {
    const llamadas = simularApi({ "GET /v1/sesion": () => ({ cuerpo: gerencia }), "GET /v1/chat": () => ({ cuerpo: vacio }),
      "POST /v1/chat/mensajes": (l: Llamada) => ({ cuerpo: estado([usuario(String((l.cuerpo as { texto: string }).texto)),
        asistente({ texto: "Propuesta lista; apruébela con el botón.", propuestas: [propuesta] })], [propuesta]) }),
      "POST /v1/sesion/eventos-humanos": () => ({ status: 201, cuerpo: { eventoAprobacionId: "EVH-CHAT" } }),
      "POST /v1/propuestas-pago/PROP-PRUEBA/confirmacion": () => ({ status: 201, cuerpo: { pago, repetido: false }, cabeceras: { "Idempotency-Replayed": "false" } }),
      "POST /v1/chat/propuestas/PROP-PRUEBA/resolucion": () => ({ cuerpo: estado([asistente({ texto: "Propuesta lista.", propuestas: [propuesta] })]) }) });
    montar("/gerencia/asistente");
    const caja = await screen.findByLabelText("Mensaje para el asistente");
    await userEvent.type(caja, "Propón el pago de la cuota 2{Enter}");
    const tarjetaPropuesta = await screen.findByRole("region", { name: "Propuesta de pago PROP-PRUEBA" });
    await userEvent.type(caja, "sí, apruébalo{Enter}");
    await screen.findAllByRole("region", { name: "Propuesta de pago PROP-PRUEBA" });
    // El texto del chat no aprueba: solo se enviaron mensajes al asistente.
    expect(llamadas.some((l) => l.ruta.includes("/confirmacion"))).toBe(false);
    await userEvent.click(within(screen.getAllByRole("region", { name: "Propuesta de pago PROP-PRUEBA" }).at(-1) ?? tarjetaPropuesta).getByRole("button", { name: "Aprobar" }));
    expect(await screen.findByText(/Pago aplicado/)).toBeInTheDocument();
    const confirmacion = llamadas.find((l) => l.ruta.endsWith("/confirmacion"));
    expect(confirmacion?.cabeceras["x-evento-humano"]).toBe("EVH-CHAT");
    expect(confirmacion?.cabeceras["idempotency-key"]).toBe(propuesta.claveIdempotencia);
    expect(llamadas.find((l) => l.ruta.endsWith("/resolucion"))?.cuerpo).toEqual({ resultado: "CONFIRMADA", pagoId: pago.pagoId });
  });

  it("reiniciar la conversación cancela antes las propuestas pendientes", async () => {
    const llamadas = simularApi({ "GET /v1/sesion": () => ({ cuerpo: gerencia }),
      "GET /v1/chat": () => ({ cuerpo: estado([asistente({ texto: "Propuesta lista.", propuestas: [propuesta] })], [propuesta]) }),
      "POST /v1/sesion/eventos-humanos": () => ({ status: 201, cuerpo: { eventoAprobacionId: "EVH-CANCELA" } }),
      "POST /v1/propuestas-pago/PROP-PRUEBA/cancelacion": () => ({ cuerpo: { ...propuesta, estado: "CANCELADA" } }),
      "POST /v1/chat/propuestas/PROP-PRUEBA/resolucion": () => ({ cuerpo: estado([]) }),
      "POST /v1/chat/reinicio": () => ({ cuerpo: vacio }) });
    montar("/gerencia/asistente");
    await userEvent.click(await screen.findByRole("button", { name: /Reiniciar conversación \(cancela 1 propuesta\)/ }));
    expect(await screen.findByText("Pruebe con una consulta:")).toBeInTheDocument();
    expect(llamadas.map((l) => `${l.metodo} ${l.ruta}`).filter((r) => r.startsWith("POST"))).toEqual([
      "POST /v1/sesion/eventos-humanos", "POST /v1/propuestas-pago/PROP-PRUEBA/cancelacion",
      "POST /v1/chat/propuestas/PROP-PRUEBA/resolucion", "POST /v1/chat/reinicio"]);
  });

  it("un error del asistente se muestra sin perder el mensaje escrito", async () => {
    simularApi({ "GET /v1/sesion": () => ({ cuerpo: gerencia }), "GET /v1/chat": () => ({ cuerpo: vacio }),
      "POST /v1/chat/mensajes": () => ({ status: 503, cuerpo: { type: "urn:x", title: "ASISTENTE_NO_DISPONIBLE", status: 503,
        detail: "El asistente no está disponible: revise que Ollama y sus modelos estén activos.", errorCode: "ASISTENTE_NO_DISPONIBLE", traceId: "T", timestamp: "-" } }) });
    montar("/gerencia/asistente");
    const caja = await screen.findByLabelText("Mensaje para el asistente");
    await userEvent.type(caja, "¿Cartera?{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent("Ollama");
    expect(caja).toHaveValue("¿Cartera?");
  });
});
