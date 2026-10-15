import { defineConfig } from "vitest/config";

// Evals con el modelo real (qwen3:8b, bge-m3) y PostgreSQL de prueba; comando aparte: no forma parte de npm test.
export default defineConfig({
  test: {
    environment: "node", include: ["tests/evals/*.eval.ts"],
    fileParallelism: false, testTimeout: 900000, hookTimeout: 900000,
  },
});
