import { defineConfig } from "vitest/config";

// RAG con Ollama (bge-m3, qwen3:8b) y PostgreSQL reales; comando aparte: no forma parte de npm test.
export default defineConfig({
  test: {
    environment: "node", include: ["tests/rag/*.rag.ts"],
    fileParallelism: false, testTimeout: 300000, hookTimeout: 300000,
  },
});
