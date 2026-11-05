import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join, delimiter } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL("../", import.meta.url));
const version = readFileSync(join(raiz, ".nvmrc"), "utf8").trim();
const [mayor, menor, parche] = process.versions.node.split(".").map(Number);
const compatible = mayor > 22 || (mayor === 22 && (menor > 22 || (menor === 22 && parche >= 2)));
let ejecutable = process.execPath;

if (!compatible) {
  const plataforma = process.platform === "win32" ? "win" : process.platform;
  ejecutable = join(raiz, ".npm-cache", "node-runtime", `node-v${version}-${plataforma}-${process.arch}`,
    process.platform === "win32" ? "node.exe" : "bin/node");
  if (!existsSync(ejecutable)) {
    console.error(`Node ${process.versions.node} no es compatible. Instale Node ${version} (ver .nvmrc) o coloque su distribución portable en .npm-cache/node-runtime/.`);
    process.exit(1);
  }
  console.log(`Pruebas: usando Node ${version} portable del proyecto (terminal: ${process.versions.node}).`);
}

// Los workers y procesos secundarios heredan el mismo runtime que Vitest.
const env = { ...process.env };
const clavePath = Object.keys(env).find(clave => clave.toLowerCase() === "path") ?? "PATH";
env[clavePath] = `${dirname(ejecutable)}${delimiter}${env[clavePath] ?? ""}`;
const hijo = spawn(ejecutable, [join(raiz, "node_modules", "vitest", "vitest.mjs"), ...process.argv.slice(2)], {
  cwd: raiz, env, stdio: "inherit",
});
hijo.on("error", error => { console.error(error.message); process.exitCode = 1; });
hijo.on("exit", codigo => { process.exitCode = codigo ?? 1; });
