// Ejecutar tras: npx tsc --noEmit false --outDir dist/auditoria
// No registra transacciones; contrasta el núcleo real con el paquete y Python.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Dinero } from '../../dist/auditoria/src/dominio/dinero.js';
import { FabricaPlanAmortizacion, TasaNominalAnual, PlazoMeses } from '../../dist/auditoria/src/dominio/plan-amortizacion.js';
import { CalculadoraMora, DiasAtraso, FechaCivil } from '../../dist/auditoria/src/dominio/calculadora-mora.js';
import { resolverPolitica } from '../../dist/auditoria/src/dominio/politica-mora/catalogo-politicas.js';

const carpeta = process.env.CV_DATA_DIR ?? './datos/datos-proyecto-final';
const evidencia = new URL('../../docs/proyecto-final/evidencia/', import.meta.url);
const independiente = JSON.parse(readFileSync(new URL('reproduccion.json', evidencia), 'utf8'));
const eventos = readFileSync(`${carpeta}/eventos.jsonl`, 'utf8').trim().split(/\r?\n/).map(JSON.parse);
const creditos = new Map();
const claves = new Set();
const diferencias = [];
let planes = 0;
let pagos = 0;
for (const e of eventos) {
  if (e.tipo === 'DESEMBOLSO') {
    const plan = new FabricaPlanAmortizacion().crearFrances({
      capital: Dinero.desdeUnidadesMenores(BigInt(e.capital_centavos), 'GTQ'),
      tasaNominalAnual: TasaNominalAnual.desdeCadena((e.tna_bps / 10000).toFixed(4)),
      plazo: PlazoMeses.desdeNumero(e.plazo_meses),
    });
    const filas = plan.cuotas.map(q => [q.numero, Number(q.amortizacion.aUnidadesMenores()), Number(q.interes.aUnidadesMenores())]);
    const hash = createHash('sha256').update(JSON.stringify(filas)).digest('hex');
    if (hash !== independiente.planes_sha256[e.id_credito]) diferencias.push({ credito: e.id_credito, tipo: 'PLAN_DIFIERE_DE_PYTHON' });
    creditos.set(e.id_credito, { evento: e, plan, pagadas: 0 });
    planes++;
  } else if (e.tipo === 'PAGO' && !claves.has(e.clave_idempotencia)) {
    claves.add(e.clave_idempotencia);
    const c = creditos.get(e.id_credito);
    const q = c.plan.cuotas[c.pagadas];
    // Las fechas provienen del calendario independiente, no del reloj del sistema.
    const fecha = independiente.vencimientos[e.id_credito][c.pagadas];
    const corte = FechaCivil.desdeCadena(e.fecha);
    const dias = DiasAtraso.entre(FechaCivil.desdeCadena(fecha), corte);
    const politica = resolverPolitica(FechaCivil.desdeCadena(c.evento.fecha));
    // El histórico es exclusivamente plano. No se inventa cobertura de gasto/escalonada.
    if (politica.id !== 'POL-2024-01') throw new Error('La auditoría histórica requiere revisar nuevas políticas antes de continuar.');
    const mora = new CalculadoraMora(politica).calcular(q.amortizacion, dias).interesMoratorio;
    const exigible = q.importe.sumar(mora).aUnidadesMenores();
    if (exigible !== BigInt(e.monto_centavos)) diferencias.push({ seq: e.seq, tipo: 'MONTO_NUCLEO_DIFIERE', esperado: exigible.toString(), recibido: String(e.monto_centavos) });
    c.pagadas++;
    pagos++;
  }
}
const reporte = { planes_contrastados_con_python: planes, pagos_contrastados_con_eventos: pagos,
  diferencias, alcance: 'Plan francés y mora histórica ejecutados mediante el núcleo TypeScript compilado; no es cargador de producción.' };
writeFileSync(new URL('contraste-nucleo.json', evidencia), JSON.stringify(reporte, null, 2) + '\n');
console.log(JSON.stringify(reporte, null, 2));
if (diferencias.length || planes !== 75 || pagos !== 226) process.exitCode = 1;
