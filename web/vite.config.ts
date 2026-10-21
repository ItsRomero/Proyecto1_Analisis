import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// La interfaz consume la API real en /v1. En desarrollo Vite la redirige al servidor Express.
const api = `http://${process.env["API_HOST"] ?? "127.0.0.1"}:${process.env["API_PORT"] ?? "3000"}`;
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  envDir: fileURLToPath(new URL("..", import.meta.url)),
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@contratos": fileURLToPath(new URL("../src/contratos", import.meta.url)) } },
  server: { port: 5173, strictPort: true, proxy: { "/v1": { target: api } }, fs: { allow: [".."] } },
  // El chunk de terceros (React, React Router, Zod) supera 500 kB sin comprimir; se acepta en demo local.
  build: { outDir: "dist", emptyOutDir: true, sourcemap: false, chunkSizeWarningLimit: 650,
    rollupOptions: { output: { manualChunks: (id) => (id.includes("node_modules") ? "terceros" : undefined) } } },
});
