import { crearPool } from "../persistencia/postgres.js";
import { configuracionDesdeEntorno, crearServidorFinal } from "./servidor-final.js";

// Punto de entrada: API en loopback (ADR-006) y, si existe web/dist, la interfaz en la misma origen.
const config = configuracionDesdeEntorno(process.env);
const pool = crearPool();
const { app } = crearServidorFinal(pool, config);
const servidor = app.listen(config.puerto, config.host, () => {
  console.log(`API Crédito Vecino en http://${config.host}:${config.puerto}/v1 · corte por defecto ${config.fechaCorteDefecto}`);
});
const cerrar = () => { servidor.close(() => { void pool.end(); }); };
process.on("SIGINT", cerrar);
process.on("SIGTERM", cerrar);
