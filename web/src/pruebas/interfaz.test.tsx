import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { formatearDinero, formatearFecha, normalizarImporte, porcentajeComoTasa, tasaComoPorcentaje } from "../formato";
import { deuda, ficha, montar, pago, problema, propuesta, simularApi } from "./apoyo";

afterEach(() => cleanup());

describe("formato: solo presentación de cadenas de la API", () => {
  it("agrupa miles y conserva los centavos exactos", () => {
    expect(formatearDinero({ importe: "1234567.05", moneda: "GTQ" })).toBe("Q 1,234,567.05");
    expect(formatearDinero({ importe: "0.00", moneda: "GTQ" })).toBe("Q 0.00");
  });
  it("convierte tasas y porcentajes sin punto flotante", () => {
    expect(tasaComoPorcentaje("0.36")).toBe("36");
    expect(tasaComoPorcentaje("0.025")).toBe("2.5");
    expect(porcentajeComoTasa("36")).toBe("0.36");
    expect(porcentajeComoTasa("2.5")).toBe("0.025");
    expect(porcentajeComoTasa("abc")).toBeNull();
  });
  it("normaliza importes escritos por la persona usuaria y formatea fechas civiles", () => {
    expect(normalizarImporte("500")).toBe("500.00");
    expect(normalizarImporte("Q 1,000.5")).toBe("1000.50");
    expect(normalizarImporte("10.123")).toBeNull();
    expect(formatearFecha("2026-11-30")).toBe("30 nov 2026");
  });
});

const rutasPago = {
  "GET /v1/creditos/CV-PRUEBA/ficha": () => ({ cuerpo: ficha }),
  "GET /v1/creditos/CV-PRUEBA/cuotas/2/deuda": () => ({ cuerpo: deuda }),
  "GET /v1/creditos/CV-PRUEBA": () => ({ cuerpo: { ...ficha.resumen, estado: "VIGENTE", cuotasVencidas: 0, diasAtraso: 0, tramo: "SIN_MORA" } }),
  "POST /v1/sesion/eventos-humanos": () => ({ status: 201, cuerpo: { eventoAprobacionId: "EVH-PRUEBA" } }),
};

describe("registro de pago: estados y aprobación humana", () => {
  it("prellena el monto exacto del núcleo y ofrece el monto correcto ante MONTO_NO_EXACTO", async () => {
    simularApi({ ...rutasPago, "POST /v1/creditos/CV-PRUEBA/propuestas-pago": () => ({ status: 422,
      cuerpo: problema("MONTO_NO_EXACTO", 422, { montoCorrecto: { importe: "111.11", moneda: "GTQ" } }) }) });
    montar("/asesor/creditos/CV-PRUEBA/pagos/nuevo");
    expect(await screen.findByRole("status")).toHaveTextContent(/Cargando|Abriendo/);
    const monto = await screen.findByLabelText("Monto recibido (Q)");
    await waitFor(() => expect(monto).toHaveValue("111.11"));
    await userEvent.clear(monto);
    await userEvent.type(monto, "50");
    await userEvent.click(screen.getByRole("button", { name: "Revisar prelación" }));
    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("Monto correcto según el núcleo: Q 111.11");
    await userEvent.click(screen.getByRole("button", { name: "Usar el monto correcto" }));
    expect(monto).toHaveValue("111.11");
  });

  it("muestra la prelación antes de confirmar y envía evento humano + misma clave; el reenvío es un replay", async () => {
    let confirmaciones = 0;
    const llamadas = simularApi({ ...rutasPago,
      "POST /v1/creditos/CV-PRUEBA/propuestas-pago": (l) => ({ status: 201, cuerpo: { ...propuesta, claveIdempotencia: (l.cuerpo as { claveIdempotencia: string }).claveIdempotencia } }),
      "POST /v1/propuestas-pago/PROP-PRUEBA/confirmacion": (l) => {
        confirmaciones++;
        return { status: confirmaciones === 1 ? 201 : 200, cuerpo: { pago: { ...pago, idempotencyKey: l.cabeceras["idempotency-key"] }, repetido: confirmaciones > 1 },
          cabeceras: { "Idempotency-Replayed": String(confirmaciones > 1) } };
      } });
    montar("/asesor/creditos/CV-PRUEBA/pagos/nuevo");
    await waitFor(() => expect(screen.getByLabelText("Monto recibido (Q)")).toHaveValue("111.11"));
    await userEvent.click(screen.getByRole("button", { name: "Revisar prelación" }));
    const prelacion = await screen.findByRole("region", { name: "Prelación de aplicación" });
    expect(within(prelacion).getByText("2. Interés moratorio").parentElement).toHaveTextContent("Q 1.11");
    // Sin aprobación explícita no se envía ninguna confirmación.
    expect(llamadas.some((l) => l.ruta.includes("/confirmacion"))).toBe(false);
    await userEvent.click(screen.getByRole("button", { name: "Aprobar pago" }));
    await userEvent.click(await screen.findByRole("button", { name: "Confirmar pago" }));
    expect(await screen.findByText("Pago aplicado")).toBeInTheDocument();
    const confirmacion = llamadas.find((l) => l.ruta.endsWith("/confirmacion"));
    const clave = (llamadas.find((l) => l.ruta.endsWith("/propuestas-pago"))?.cuerpo as { claveIdempotencia: string }).claveIdempotencia;
    expect(confirmacion?.cabeceras["x-evento-humano"]).toBe("EVH-PRUEBA");
    expect(confirmacion?.cabeceras["idempotency-key"]).toBe(clave);
    expect(llamadas.find((l) => l.ruta === "/v1/sesion/eventos-humanos")?.cuerpo).toEqual({ operacion: "confirmarPago", objetivo: "PROP-PRUEBA" });
    await userEvent.click(screen.getByRole("button", { name: "Reenviar confirmación con la misma clave" }));
    expect(await screen.findByText("Reintento sin efecto adicional")).toBeInTheDocument();
    expect(llamadas.filter((l) => l.ruta.endsWith("/confirmacion")).map((l) => l.cabeceras["idempotency-key"])).toEqual([clave, clave]);
  });

  it("sin conexión muestra el estado sin señal y no simula un guardado local", async () => {
    simularApi({ ...rutasPago, "POST /v1/creditos/CV-PRUEBA/propuestas-pago": () => "sin-conexion" });
    montar("/asesor/creditos/CV-PRUEBA/pagos/nuevo");
    await waitFor(() => expect(screen.getByLabelText("Monto recibido (Q)")).toHaveValue("111.11"));
    await userEvent.click(screen.getByRole("button", { name: "Revisar prelación" }));
    expect(await screen.findByText("Sin conexión con el servidor")).toBeInTheDocument();
    expect(screen.getByText(/No se guardó nada en este dispositivo/)).toBeInTheDocument();
  });

  it("presenta el rechazo de crédito incobrable devuelto por la API", async () => {
    simularApi({ ...rutasPago, "POST /v1/creditos/CV-PRUEBA/propuestas-pago": () => ({ status: 409, cuerpo: problema("CREDITO_INCOBRABLE", 409) }) });
    montar("/asesor/creditos/CV-PRUEBA/pagos/nuevo");
    await waitFor(() => expect(screen.getByLabelText("Monto recibido (Q)")).toHaveValue("111.11"));
    await userEvent.click(screen.getByRole("button", { name: "Revisar prelación" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("CREDITO_INCOBRABLE");
  });
});

describe("estados de vacío, error y validación", () => {
  it("cartera del asesor sin coincidencias", async () => {
    simularApi({ "GET /v1/clientes": () => ({ cuerpo: { fechaCorte: "2026-10-31", clientes: [] } }) });
    montar("/asesor/clientes");
    expect(await screen.findByText("Sin coincidencias")).toBeInTheDocument();
  });

  it("tablero muestra el error del servidor con reintento", async () => {
    simularApi({ "GET /v1/cartera": () => ({ status: 500, cuerpo: problema("ERROR_INTERNO", 500) }),
      "GET /v1/cierres": () => ({ status: 500, cuerpo: problema("ERROR_INTERNO", 500) }),
      "GET /v1/sesion": () => ({ cuerpo: { sesionId: "SES-PRUEBA", perfil: "GERENCIA", sujetoId: "GERENCIA-DEMO", fechaCorteDefecto: "2026-10-31" } }) });
    montar("/gerencia");
    expect(await screen.findByRole("heading", { name: "Tablero gerencial" })).toBeInTheDocument();
    expect((await screen.findAllByRole("alert"))[0]).toHaveTextContent("Detalle ERROR_INTERNO");
    expect(screen.getAllByRole("button", { name: "Reintentar" }).length).toBeGreaterThan(0);
  });

  it("la originación valida el alta con el esquema compartido antes de llamar a la API", async () => {
    const llamadas = simularApi({});
    montar("/asesor/creditos/nuevo");
    await userEvent.click(await screen.findByRole("button", { name: "Dar de alta y continuar" }));
    expect(await screen.findAllByText(/Too small|Invalid|inválid/i)).not.toHaveLength(0);
    expect(llamadas.some((l) => l.metodo === "POST")).toBe(false);
  });

  it("el área de gerencia exige el perfil Gerencia", async () => {
    simularApi({});
    montar("/gerencia/cierres/diario");
    expect(await screen.findByRole("heading", { name: "Mis clientes" })).toBeInTheDocument();
  });
});
