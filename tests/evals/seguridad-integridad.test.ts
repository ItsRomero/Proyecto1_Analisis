import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

/*
 * Fase 7: comprobaciones transversales sin red ni base. Secretos fuera del repositorio, sin datos personales en
 * la evidencia y en los reportes, e integridad de los insumos canónicos (hashes del documento maestro).
 */
const SHA_ZIP = "1d9cc4471f25f8bab795f45c1f3fae36a50b76116cb58062a5dc2b46a5c37b0b";
const SHA_EVENTOS = "e2d46283de8578f19ea2eb14ace283573ebb729aaa0e9b0e65f80a348e4b9d50";
const sha256 = (ruta: string) => createHash("sha256").update(readFileSync(ruta)).digest("hex");
const versionados = execSync("git ls-files", { encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
const TEXTO = /\.(md|ts|tsx|mjs|js|json|txt|sql|ya?ml|css|html|example)$/;
const leer = (f: string) => readFileSync(f, "utf8");

describe("fase 7: secretos y datos personales", () => {
  it(".env y variantes con valores reales no están versionados; solo .env.example", () => {
    expect(versionados.filter((f) => /(^|\/)\.env($|\.)/.test(f))).toEqual([".env.example"]);
    expect(leer(".gitignore")).toMatch(/^\.env$/m);
  });

  it("ningún archivo versionado contiene claves de API ni contraseñas fuera de los marcadores documentados", () => {
    const hallazgos: string[] = [];
    for (const f of versionados.filter((x) => TEXTO.test(x) && !x.startsWith("datos/") && !x.startsWith("vistas/") && statSync(x).size < 2_000_000)) {
      const t = leer(f);
      for (const m of t.matchAll(/postgres(?:ql)?:\/\/[^:\s/]+:([^@\s]+)@/g))
        if (!["COMPLETAR_LOCALMENTE", "cv_demo_local"].includes(m[1]!) && !/\$|\{|\*/.test(m[1]!)) hallazgos.push(`${f}: cadena de conexión con contraseña`);
      if (/\b(?:sk|gsk|AIza)[-_][A-Za-z0-9_-]{16,}|\b(?:OPENAI|GROQ|GEMINI|GOOGLE)_API_KEY\s*=\s*\S{8,}/.test(t)) hallazgos.push(`${f}: clave de API`);
    }
    expect(hallazgos).toEqual([]);
  });

  it("la contraseña de demostración solo aparece como valor local documentado, nunca en la evidencia", () => {
    const con = versionados.filter((f) => TEXTO.test(f) && !f.startsWith("datos/") && !f.startsWith("vistas/") && leer(f).includes("cv_demo_local"));
    expect(con.filter((f) => f !== "README.md" && !f.startsWith("tests/"))).toEqual([]);
  });

  it("la evidencia, los reportes de evals y las grabaciones no contienen DPI ni teléfonos de clientes", () => {
    const rutas = versionados.filter((f) => /^(docs\/proyecto-final\/(evidencia|evals)\/|tests\/evals\/)/.test(f) && TEXTO.test(f));
    expect(rutas.length).toBeGreaterThan(0);
    for (const f of rutas) expect(leer(f), f).not.toMatch(/DPI-FICT-0000\d{2}|(?<![\w-])5555[-\s]\d{4}(?![\w-])/);
  });
});

describe("fase 7: integridad de los insumos canónicos", () => {
  it("SHA-256 del ZIP y de eventos.jsonl iguales a los del documento maestro, y eventos.sha256 coherente", () => {
    expect(sha256("datos/datos-proyecto-final.zip")).toBe(SHA_ZIP);
    expect(sha256("datos/datos-proyecto-final/eventos.jsonl")).toBe(SHA_EVENTOS);
    expect(leer("datos/datos-proyecto-final/eventos.sha256")).toContain(SHA_EVENTOS);
  });
  it("datos/ y vistas/ no tienen cambios respecto al repositorio", () => {
    expect(execSync("git status --porcelain -- datos vistas", { encoding: "utf8" }).trim()).toBe("");
  });
});
