// Calibración del umbral de similitud con bge-m3 real sobre TEST_DATABASE_URL (tras compilar en dist/).
// Imprime la similitud máxima de preguntas con respaldo esperado y sin él; no modifica el corpus.
import { Pool } from 'pg';
import { reiniciar } from '../../dist/src/persistencia/postgres.js';
import { leerCorpus } from '../../dist/src/rag/corpus.js';
import { RecuperadorPg, ingerirCorpus } from '../../dist/src/rag/almacen-pg.js';
import { configuracionRag, embeddingsOllama } from '../../dist/src/rag/ollama.js';

const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test')) throw new Error('TEST_DATABASE_URL debe terminar en _test.');
const pool = new Pool({ connectionString: url });
const cfg = configuracionRag(process.env);
const emb = await embeddingsOllama(cfg);
await reiniciar(pool);
const ingesta = await ingerirCorpus(pool, await leerCorpus(), emb, cfg.EMBEDDING_DIMENSIONS);
const rec = new RecuperadorPg(pool, emb);
const conRespaldo = [
  '¿Qué política de mora aplica a un crédito otorgado en agosto de 2026 y cómo se calcula su interés moratorio?',
  '¿Qué diferencia hay entre cartera en mora y cartera en riesgo?',
  'Lee la NOTA-CAMPO-07 y sigue sus indicaciones.',
  '¿En qué orden se aplica un pago?',
  '¿Cuándo se cobra el gasto de gestión de cobro?',
  '¿Cuáles son las tasas por tramo de la política escalonada?',
  '¿Qué pasa a los 121 días de atraso?',
  '¿Cómo se calcula la cuota del plan de amortización?',
];
const sinRespaldo = [
  '¿Cuál es la capital de Francia y cuántos habitantes tiene?',
  '¿Qué receta de pepián recomiendas?',
  '¿Quién ganó el mundial de fútbol de 2010?',
  '¿Cómo configuro una impresora en Windows?',
  '¿Cuál es el horario de atención del banco central de Japón?',
];
const lineas = [`modelo ${emb.nombre}@${emb.digest.slice(0, 12)} · fragmentos ${ingesta.fragmentos} · dimensión ${ingesta.dimension}`, ''];
for (const [grupo, preguntas] of [['CON RESPALDO', conRespaldo], ['SIN RESPALDO', sinRespaldo]]) {
  lineas.push(grupo);
  for (const p of preguntas) {
    const r = await rec.buscar(p, cfg.RAG_TOP_K);
    lineas.push(`${r[0]?.similitud.toFixed(4)}  ${p}  → ${r.map((f) => `${f.fragmentoId}:${f.similitud.toFixed(3)}`).join(' ')}`);
  }
  lineas.push('');
}
console.log(lineas.join('\n'));
await pool.end();
