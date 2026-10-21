import { defineConfig } from "vitest/config";

// Chat con Ollama (qwen3:8b, bge-m3), PostgreSQL y navegador reales; comando aparte: no forma parte de npm test.
export default defineConfig({
  test: {
    environment: "node", include: ["tests/chat/*.chat.ts"],
    fileParallelism: false, testTimeout: 900000, hookTimeout: 900000,
  },
});
