import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { montar, simularApi } from "./apoyo";

afterEach(cleanup);
for (const [rol, usuario, clave] of [["gerencia", "gerencia", "Gerencia123!"], ["asesor", "asesor", "Asesor123!"]]) {
  it(`rellena las credenciales de ${rol} y las envia al login`, async () => {
    const llamadas = simularApi({ "GET /v1/sesion": () => ({ cuerpo: null }),
      "POST /v1/sesion/login": () => ({ status: 403, cuerpo: {} }) });
    montar(`/login/${rol}`);
    expect(await screen.findByLabelText("Usuario")).toHaveValue(usuario);
    expect(screen.getByLabelText(/Contrase/)).toHaveValue(clave);
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(llamadas.find(l => l.ruta === "/v1/sesion/login")?.cuerpo).toEqual({ perfil: rol!.toUpperCase(), usuario, contrasena: clave });
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
}
it("redirige al cliente sin sesion a su login vacio", async () => {
  simularApi({ "GET /v1/sesion": () => ({ cuerpo: null }) });
  montar("/usuario/inicio");
  expect(await screen.findByLabelText("ID del cliente (id_cliente)")).toHaveValue("");
  expect(screen.getByLabelText("DPI")).toHaveValue("");
});
