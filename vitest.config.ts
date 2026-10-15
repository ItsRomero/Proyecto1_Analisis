import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  test: {
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
