import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, it, expect } from "vitest";
import { ficha, montar, resumen, simularApi } from "./apoyo";

it("abre la cuenta autenticada sin permitir seleccionar otros clientes", async () => {
  const llamadas = preparar();
  montar("/usuario");
  expect(await screen.findByText(ficha.nombreCliente)).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Cambiar de usuario" })).not.toBeInTheDocument();
  expect(llamadas.some(l => l.ruta.startsWith("/v1/usuarios"))).toBe(false);
});

afterEach(cleanup);
function preparar() {
  return simularApi({
    "GET /v1/sesion": () => ({ cuerpo: { sesionId: "SES-USUARIO", perfil: "USUARIO", sujetoId: "USUARIO-DEMO", fechaCorteDefecto: "2026-10-31" } }),
    "GET /v1/usuario": () => ({ cuerpo: { cliente: { clienteId: ficha.clienteId, nombreCompleto: ficha.nombreCliente,
      municipio: ficha.municipio, creditos: [resumen] } } }),
    "GET /v1/creditos/CV-PRUEBA/ficha": () => ({ cuerpo: ficha }),
    "GET /v1/creditos/CV-PRUEBA/pagos": () => ({ cuerpo: { creditoId: "CV-PRUEBA", fechaCorte: "2026-10-31", pagos: [] } }),
    "GET /v1/creditos/CV-PRUEBA/plan": () => ({ cuerpo: { fechaDesembolso: "2026-08-19", cuotas: [1, 2, 3].map(numero => ({
      numero, fechaVencimiento: `2026-${String(numero + 8).padStart(2, "0")}-19`, saldoAnterior: { importe: "1000.00", moneda: "GTQ" },
      interes: { importe: "10.00", moneda: "GTQ" }, amortizacion: { importe: "100.00", moneda: "GTQ" },
      importe: { importe: "110.00", moneda: "GTQ" }, saldoPosterior: { importe: "900.00", moneda: "GTQ" },
    })) } }),
  });
}
it("muestra el inicio real y permite navegar a detalle y ayuda sin acciones financieras", async () => {
  const llamadas = preparar();
  montar("/usuario/inicio");
  expect(await screen.findByText(ficha.nombreCliente)).toBeInTheDocument();
  expect(await screen.findByText("Tu avance")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("link", { name: /Ver mi crédito/ }));
  expect(await screen.findByText("Detalle del crédito")).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Ver plan completo de cuotas" })).toHaveAttribute("href", "/usuario/creditos/CV-PRUEBA/plan");
  expect(screen.queryByRole("link", { name: "Registrar pago" })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("link", { name: "Ayuda" }));
  await userEvent.click(await screen.findByText("¿Qué es un crédito?"));
  expect(screen.getByText(/Es dinero prestado/).closest("details")).toHaveAttribute("open");
  expect(llamadas.every(l => l.metodo === "GET")).toBe(true);
});

it("muestra las cuotas contractuales en la tabla del usuario", async () => {
  preparar();
  montar("/usuario/creditos/CV-PRUEBA/plan");
  expect(await screen.findByRole("table")).toBeInTheDocument();
  expect(screen.getAllByRole("row")).toHaveLength(4);
  expect(screen.getByText(/El saldo es el contractual/)).toBeInTheDocument();
});

it("presenta un estado vacío si no hay cliente cargado", async () => {
  simularApi({
    "GET /v1/sesion": () => ({ cuerpo: { sesionId: "SES-USUARIO", perfil: "USUARIO", sujetoId: "USUARIO-DEMO", fechaCorteDefecto: "2026-10-31" } }),
    "GET /v1/usuario": () => ({ cuerpo: { cliente: null } }),
  });
  montar("/usuario/inicio");
  expect(await screen.findByText("Selecciona un usuario")).toBeInTheDocument();
});
