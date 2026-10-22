import { it, expect, vi } from "vitest";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { crearAplicacionHttp } from "../src/api/aplicacion-http.js";
import { AlmacenSesiones } from "../src/api/sesiones.js";
import type { CasosUsoFinal } from "../src/aplicacion/casos-uso-final.js";

it("Usuario consulta solo sus créditos y no puede escribir, listar clientes ni emitir aprobaciones", async () => {
  const sesiones = new AlmacenSesiones();
  const sesion = sesiones.crear("USUARIO");
  sesion.clienteId = "CL-01";
  const leer = vi.fn(async () => ({ creditoId: "CV-PROPIO" }));
  const casos = {
    listarClientes: { ejecutar: vi.fn(async () => ({ clientes: [
      { clienteId: "CL-02", creditos: [{ creditoId: "CV-AJENO" }] },
      { clienteId: "CL-01", creditos: [{ creditoId: "CV-PROPIO" }] },
      ...Array.from({ length: 21 }, (_, i) => ({ clienteId: `CL-${String(i + 3).padStart(2, "0")}`, creditos: [] })),
    ] })) },
    consultarCredito: { ejecutar: leer },
  } as unknown as CasosUsoFinal;
  const servidor = crearAplicacionHttp({ casos, sesiones, fechaCorteDefecto: "2026-10-31", origenesPermitidos: [] }).listen(0, "127.0.0.1");
  try {
    await once(servidor, "listening");
    const base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}/v1`;
    const headers = { Cookie: `cv_session=${sesion.token}`, "Content-Type": "application/json" };
    const lista = await fetch(`${base}/usuarios`, { headers });
    expect(await lista.json()).toMatchObject({ total: 1, usuarios: [{ clienteId: "CL-01" }] });
    const propio = await fetch(`${base}/usuario`, { headers });
    expect(propio.status).toBe(200);
    expect(await propio.json()).toMatchObject({ cliente: { clienteId: "CL-01" } });
    expect((await fetch(`${base}/creditos/CV-PROPIO?fechaCorte=2026-10-31`, { headers })).status).toBe(200);
    expect((await fetch(`${base}/creditos/CV-AJENO?fechaCorte=2026-10-31`, { headers })).status).toBe(403);
    expect((await fetch(`${base}/clientes?fechaCorte=2026-10-31`, { headers })).status).toBe(403);
    expect((await fetch(`${base}/creditos/CV-PROPIO/propuestas-pago`, { method: "POST", headers, body: "{}" })).status).not.toBe(200);
    expect((await fetch(`${base}/sesion/eventos-humanos`, { method: "POST", headers,
      body: JSON.stringify({ operacion: "altaCliente", objetivo: "CL-03" }) })).status).toBe(403);
    expect(leer).toHaveBeenCalledTimes(1);
    const cambiar = await fetch(`${base}/usuario/seleccion`, { method: "POST", headers,
      body: JSON.stringify({ clienteId: "CL-02", fechaCorte: "2026-10-31" }) });
    expect(cambiar.status).toBe(400);
    expect((await fetch(`${base}/creditos/CV-PROPIO?fechaCorte=2026-10-31`, { headers })).status).toBe(200);
    expect((await fetch(`${base}/usuario/seleccion`, { method: "POST", headers,
      body: JSON.stringify({ clienteId: "NO-EXISTE", fechaCorte: "2026-10-31" }) })).status).toBe(400);
    expect(await (await fetch(`${base}/usuario`, { headers })).json()).toMatchObject({ cliente: { clienteId: "CL-01" } });
    const otra = sesiones.crear();
    expect((await fetch(`${base}/usuario`, { headers: { Cookie: `cv_session=${otra.token}` } })).status).toBe(403);
  } finally { await new Promise<void>(ok => servidor.close(() => ok())); }
});
