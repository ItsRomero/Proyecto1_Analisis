import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const [mayor = 0, menor = 0, parche = 0] = process.versions.node.split(".").map(Number);
if (mayor < 22 || (mayor === 22 && (menor < 22 || (menor === 22 && parche < 2)))) {
  throw new Error(`Node ${process.versions.node} no es compatible con las pruebas. Use Node >=22.22.2; .nvmrc fija 22.23.3. La dependencia undici necesita zlib.createZstdDecompress.`);
}

export default defineConfig({
  test: {
    maxWorkers: 4,
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    passWithNoTests: true,
    // Un solo `npm test`: suite P1/P2 + fases 1–3 en Node y la interfaz React en jsdom, sin red ni base.
    projects: [
      { extends: true, test: { name: "nucleo", environment: "node", include: ["tests/**/*.test.ts"] } },
      {
        extends: true,
        plugins: [react()],
        resolve: { alias: { "@contratos": fileURLToPath(new URL("./src/contratos", import.meta.url)) } },
        test: { name: "web", environment: "jsdom", include: ["web/src/**/*.test.tsx", "web/src/**/*.test.ts"],
          setupFiles: ["web/src/pruebas/configuracion.ts"] },
      },
    ],
  },
});
