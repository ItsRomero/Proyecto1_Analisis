import { it, expect } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { Pool } from "pg";
import { crearServidorFinal } from "../src/api/servidor-final.js";

it("sirve la SPA desde un checkout oculto sin publicar archivos ocultos ni sustituir errores de API por HTML", async () => {
  const temporal = await mkdtemp(join(tmpdir(), "cv-pf8-estaticos-"));
  const directorioWeb = join(temporal, ".checkout", "web", "dist");
  await mkdir(directorioWeb, { recursive: true });
  await writeFile(join(directorioWeb, "index.html"), "<!doctype html><title>SPA de prueba</title>");
  await writeFile(join(directorioWeb, "app.css"), "body{color:navy}");
  await writeFile(join(directorioWeb, ".env"), "CONTENIDO_PRIVADO_NO_PUBLICAR");
  const pool = new Pool(); // Sin conexión: servir archivos no debe consultar una base.
  const { app } = crearServidorFinal(pool, { host: "127.0.0.1", puerto: 0, fechaCorteDefecto: "2026-10-31",
    origenWeb: undefined, diasRetencionIdempotencia: 30, directorioWeb });
  const servidor = app.listen(0, "127.0.0.1");
  try {
    await once(servidor, "listening");
    const base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
    for (const ruta of ["/", "/gerencia/asistente"]) {
      const r = await fetch(base + ruta);
      expect(r.status, ruta).toBe(200);
      expect(await r.text()).toContain("SPA de prueba");
    }
    expect(await (await fetch(base + "/app.css")).text()).toBe("body{color:navy}");
    expect(await (await fetch(base + "/.env")).text()).not.toContain("CONTENIDO_PRIVADO_NO_PUBLICAR");
    const api = await fetch(base + "/v1/no-existe");
    expect(api.status).toBe(404);
    expect(api.headers.get("content-type")).toContain("application/problem+json");
  } finally {
    await new Promise<void>((ok) => servidor.close(() => ok()));
    await pool.end();
    await rm(temporal, { recursive: true, force: true });
  }
});
