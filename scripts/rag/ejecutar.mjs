// Comandos del RAG sobre DATABASE_URL (tras compilar en dist/). Uso: ingesta | consulta "<pregunta>"
import { randomUUID } from 'node:crypto';
import { crearPool, migrar } from '../../dist/src/persistencia/postgres.js';
import { leerCorpus } from '../../dist/src/rag/corpus.js';
import { BitacoraRagPg, RecuperadorPg, ingerirCorpus } from '../../dist/src/rag/almacen-pg.js';
import { configuracionRag, embeddingsOllama, modeloOllama } from '../../dist/src/rag/ollama.js';
import { responderPolitica } from '../../dist/src/rag/respuesta.js';

const [operacion, ...resto] = process.argv.slice(2);
let pool;
try {
  if (!['ingesta', 'consulta'].includes(operacion)) throw new Error('Operación desconocida: use ingesta o consulta "<pregunta>".');
  const cfg = configuracionRag(process.env);
  pool = crearPool();
  const embeddings = await embeddingsOllama(cfg);
  if (operacion === 'ingesta') {
    await migrar(pool);
    const r = await ingerirCorpus(pool, await leerCorpus(), embeddings, cfg.EMBEDDING_DIMENSIONS);
    console.log(JSON.stringify(r, null, 2));
  } else {
    const pregunta = resto.join(' ').trim();
    if (!pregunta) throw new Error('Escriba la pregunta entre comillas.');
    const r = await responderPolitica(pregunta, { recuperador: new RecuperadorPg(pool, embeddings), modelo: await modeloOllama(cfg),
      modeloEmbeddings: `${embeddings.nombre}@${embeddings.digest.slice(0, 12)}`, k: cfg.RAG_TOP_K, umbral: cfg.RAG_UMBRAL_SIMILITUD,
      bitacora: new BitacoraRagPg(pool), nuevoId: () => `RAG-${randomUUID()}` });
    console.log(JSON.stringify(r, null, 2));
  }
} catch (error) {
  console.error(`RAG: ${error instanceof Error ? error.message.replace(/postgres(?:ql)?:\/\/\S+/g, '[conexión omitida]') : 'error desconocido'}`);
  process.exitCode = 1;
} finally { await pool?.end(); }
