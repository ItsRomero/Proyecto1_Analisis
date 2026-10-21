import { preflight, leerPaquete, ErrorCarga } from '../../dist/src/persistencia/paquete-canonico.js';
import { crearPool, migrar, reiniciar, cargarPostgres } from '../../dist/src/persistencia/postgres.js';

const operacion = process.argv[2];
let pool;
try {
  if (!['migrar', 'carga', 'reset', 'comprobar'].includes(operacion)) throw new Error('Operación de preparación desconocida.');
  // Fallar antes de tocar DB si hay un insumo inválido.
  let paquete;
  if (operacion === 'carga' || operacion === 'comprobar') {
    await preflight();
    paquete = await leerPaquete();
  }
  pool = crearPool();
  if (operacion === 'reset') {
    await reiniciar(pool);
    console.log('Base de demostración vacía: esquema cv reiniciado y migración 001 aplicada.');
  } else if (operacion === 'migrar') {
    await migrar(pool);
    console.log('Migraciones verificadas y aplicadas.');
  } else if (operacion === 'carga') {
    await migrar(pool);
    const resultado = await cargarPostgres(pool, paquete);
    console.log(`\u001b[32mSHA-256 VERIFICADO: ${resultado.huella}\u001b[0m`);
    console.log(JSON.stringify(resultado, null, 2));
  } else {
    // Solo lectura: no aplicar migraciones ni completar carga durante el control de salida.
    const c = await pool.connect();
    try {
      const carga = await c.query('SELECT huella,huella_politicas,huella_asesores,conteos FROM cv.cargas_canonicas');
      const fila = carga.rows[0];
      if (carga.rowCount !== 1 || fila?.huella !== paquete.huella || fila.huella_politicas !== paquete.huellaPoliticas || fila.huella_asesores !== paquete.huellaAsesores)
        throw new ErrorCarga('FASE_2_NO_APROBADA', 'Carga oficial ausente o distinta de los insumos actuales.');
      const hechos = await c.query(`SELECT count(*)::integer AS eventos,
        count(*) FILTER (WHERE tipo='PAGO')::integer AS pagos_importados,
        count(*) FILTER (WHERE estado='DUPLICADO')::integer AS duplicados FROM cv.bitacora_eventos WHERE paquete_sha256=$1`, [paquete.huella]);
      const h = hechos.rows[0];
      if (h.eventos !== 363 || h.pagos_importados !== 228 || h.duplicados !== 2)
        throw new ErrorCarga('FASE_2_NO_APROBADA', 'Bitácora incompleta.');
      const proyecciones = await c.query(`SELECT
        (SELECT count(*)::integer FROM cv.pagos WHERE id LIKE $1) AS pagos,
        (SELECT count(*)::integer FROM cv.politicas_versionadas WHERE sha256=$2) AS politicas,
        (SELECT count(*)::integer FROM pg_extension WHERE extname='vector') AS vector`,
        [`CANONICO-${paquete.huella.slice(0, 12)}-%`, paquete.huellaPoliticas]);
      const p = proyecciones.rows[0];
      if (p.pagos !== 226 || p.politicas !== 2 || p.vector !== 1)
        throw new ErrorCarga('FASE_2_NO_APROBADA', 'Pagos, políticas o extensión vector incompletos.');
      console.log('Carga persistente verificada. Para aprobar fase 2 también deben pasar verify y las pruebas PostgreSQL.');
    } finally { c.release(); }
  }
} catch (error) {
  console.error(`FASE 2 NO APROBADA. Fase 3 bloqueada. ${error instanceof ErrorCarga ? error.message :
    error instanceof Error && /^ECONN|ETIMEDOUT/.test(error.code ?? '') ? `BASE_NO_DISPONIBLE (${error.code})` :
    error instanceof Error && /^[A-Z0-9]{5}$/.test(error.code ?? '') ? `POSTGRES_${error.code}: ${error.message}` :
    error instanceof Error ? error.message.replace(/postgres(?:ql)?:\/\/\S+/g, '[conexión omitida]') : 'Error desconocido.'}`);
  process.exitCode = 1;
} finally { await pool?.end(); }
