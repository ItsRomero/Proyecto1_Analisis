import { crearPool } from "../persistencia/postgres.js";
import { herramientasDeClienteMcp, modeloConHerramientasOllama, politicasOllama } from "../chat/adaptadores.js";
import { configuracionRag } from "../rag/ollama.js";
import { conectarMcpSesion } from "./conector-mcp.js";
import { configuracionDesdeEntorno, crearServidorFinal } from "./servidor-final.js";

// Punto de entrada: API en loopback (ADR-006) y, si existe web/dist, la interfaz en la misma origen.
const config = configuracionDesdeEntorno(process.env);
const pool = crearPool();
const databaseUrl = process.env["DATABASE_URL"] ?? "";
const entero = (valor: string | undefined, defecto: number) => (valor && /^\d+$/.test(valor) ? Number(valor) : defecto);

/*
 * Fase 6: el chat se crea por sesión de interfaz al primer mensaje. Si Ollama no está disponible, las
 * rutas /v1/chat responden ASISTENTE_NO_DISPONIBLE y el resto de la aplicación sigue operando.
 */
const { app } = crearServidorFinal(pool, config, {
  maxTurnos: entero(process.env["CHAT_SESSION_MAX_TURNS"], 12),
  ttlMinutos: entero(process.env["CHAT_SESSION_TTL_MINUTES"], 60),
  async fabrica(sesion) {
    const cfg = configuracionRag(process.env);
    const [modelo, politicas] = await Promise.all([modeloConHerramientasOllama(cfg), politicasOllama(pool, cfg)]);
    const cliente = await conectarMcpSesion(sesion, { fechaCorteDefecto: config.fechaCorteDefecto, databaseUrl,
      diasRetencionIdempotencia: config.diasRetencionIdempotencia });
    return { modelo, politicas, herramientas: herramientasDeClienteMcp(cliente, cfg.LLM_TIMEOUT_MS) };
  },
});
const servidor = app.listen(config.puerto, config.host, () => {
  console.log(`API Crédito Vecino en http://${config.host}:${config.puerto}/v1 · corte por defecto ${config.fechaCorteDefecto}`);
});
// Un turno de chat en CPU puede encadenar varias llamadas al modelo (fase 6, ~1–3 min).
servidor.requestTimeout = 15 * 60_000;
servidor.headersTimeout = 15 * 60_000 + 1_000;
const cerrar = () => { servidor.close(() => { void pool.end(); }); };
process.on("SIGINT", cerrar);
process.on("SIGTERM", cerrar);
