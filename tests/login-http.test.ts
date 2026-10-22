import { it, expect } from "vitest";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { crearAplicacionHttp } from "../src/api/aplicacion-http.js";
import { AlmacenSesiones } from "../src/api/sesiones.js";
import type { CasosUsoFinal } from "../src/aplicacion/casos-uso-final.js";

it("autentica cada rol, rechaza credenciales falsas e invalida la cookie al salir", async () => {
  const app = crearAplicacionHttp({ casos: {} as CasosUsoFinal, sesiones: new AlmacenSesiones(),
    fechaCorteDefecto: "2026-10-31", origenesPermitidos: [],
    validarCliente: async (id, dpi) => id === "CL-01" && dpi === "1234567890123" });
  const server = app.listen(0, "127.0.0.1");
  try {
    await once(server, "listening");
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`;
    const post = (ruta: string, cuerpo: unknown, cookie = "") => fetch(base + ruta, {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify(cuerpo) });
    expect(await (await fetch(base + "/sesion")).json()).toBeNull();
    expect((await fetch(base + "/clientes?fechaCorte=2026-10-31")).status).toBe(403);
    for (const [perfil, usuario, contrasena] of [
      ["ASESOR", "asesor", "Asesor123!"], ["GERENCIA", "gerencia", "Gerencia123!"],
      ["USUARIO", "CL-01", "1234567890123"],
    ]) {
      expect((await post("/sesion/login", { perfil, usuario, contrasena: "incorrecta" })).status).toBe(403);
      const r = await post("/sesion/login", { perfil, usuario, contrasena });
      expect(r.status).toBe(200);
      const cookie = r.headers.get("set-cookie")!.split(";")[0]!;
      expect(r.headers.get("set-cookie")).toContain("HttpOnly");
      expect(await r.json()).toMatchObject({ perfil });
      expect((await post("/sesion/perfil", { perfil: "GERENCIA" }, cookie)).status).toBe(403);
      if (perfil === "ASESOR") expect((await fetch(base + "/cartera?fechaCorte=2026-10-31", { headers: { Cookie: cookie } })).status).toBe(403);
      if (perfil === "GERENCIA") expect((await post("/creditos/CV-01/desembolso", { fechaDesembolso: "2026-10-31" }, cookie)).status).not.toBe(200);
      expect((await post("/sesion/logout", {}, cookie)).status).toBe(200);
      expect(await (await fetch(base + "/sesion", { headers: { Cookie: cookie } })).json()).toBeNull();
    }
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
