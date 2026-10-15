import { defineConfig } from "vitest/config";

// Recorridos de navegador contra API + PostgreSQL reales; requieren Chrome instalado y TEST_DATABASE_URL.
export default defineConfig({
  test: {
    environment: "node", include: ["tests/e2e/*.e2e.ts"],
    fileParallelism: false, testTimeout: 120000, hookTimeout: 180000,
  },
});
