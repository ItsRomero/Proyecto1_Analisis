// Congela el oráculo de las evals (fase 7). Uso: npm run evals:oraculo (compila antes en dist/).
// Las expectativas las produce el núcleo sobre TEST_DATABASE_URL recién reiniciada y cargada; nunca la base de demo.
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';
import { leerPaquete } from '../../dist/src/persistencia/paquete-canonico.js';
import { cargarPostgres, reiniciar } from '../../dist/src/persistencia/postgres.js';
import { crearCasosPg } from '../../dist/src/persistencia/casos-pg.js';
import { consultarOraculo, ejecutarOp1aOp3 } from '../../dist/tests/apoyo/guion-op.js';

const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test')) throw new Error('TEST_DATABASE_URL debe apuntar a una base exclusiva terminada en _test.');
const pool = new pg.Pool({ connectionString: url, max: 4 });
try {
  await reiniciar(pool);
  const paquete = await leerPaquete(resolve('datos/datos-proyecto-final'));
  await cargarPostgres(pool, paquete);
  const casos = crearCasosPg(pool, 30);
  const postCarga = await consultarOraculo(casos);
  await ejecutarOp1aOp3(casos);
  const postOp = await consultarOraculo(casos);
  const oraculo = {
    origen: {
      comando: 'npm run evals:oraculo',
      commit: execSync('git rev-parse HEAD').toString().trim(),
      // Metadato técnico de cuándo se congeló; ninguna cifra depende del reloj.
      fecha: new Date().toISOString(),
      node: process.version,
      huellaEventos: paquete.huella,
      base: 'TEST_DATABASE_URL reiniciada y cargada con el paquete oficial',
      productor: 'Casos de uso del núcleo (crearCasosPg); OP-1 a OP-3 con tests/apoyo/guion-op.ts',
    },
    estados: {
      POST_CARGA: { descripcion: 'Inmediatamente después de la carga canónica', resultados: postCarga },
      POST_OP1_OP3: { descripcion: 'Después de OP-1 (0043), OP-2 (0035) y OP-3 (CL-9001 / CV-2026-9001) al 2026-10-31', resultados: postOp },
    },
  };
  writeFileSync(resolve('tests/evals/oraculo-congelado.json'), `${JSON.stringify(oraculo, null, 2)}\n`);
  console.log(`Oráculo congelado: ${Object.keys(postCarga).length} consultas × 2 estados · commit ${oraculo.origen.commit.slice(0, 7)}`);
} finally { await pool.end(); }
