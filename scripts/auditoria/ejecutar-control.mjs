import { spawn, execFileSync } from 'node:child_process';
import { createWriteStream, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

// Captura UTF-8 sin mezclar las codificaciones de Tee-Object/PowerShell 5.
const [comando = 'fase8:preflight', archivo = 'fase8-preflight.txt'] = process.argv.slice(2);
const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts;
if (!/^[a-z0-9:-]+$/.test(comando) || !Object.hasOwn(scripts, comando) || !/^fase8-[a-z0-9.-]+\.txt$/.test(archivo))
  throw new Error('Comando o nombre de evidencia inválido.');
const inicio = new Date();
const reloj = performance.now();
const log = createWriteStream(join('docs/proyecto-final/evidencia', archivo), { encoding: 'utf8' });
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const huellaCambios = createHash('sha256').update(git('diff', 'HEAD', '--', 'src', 'web/src', 'tests', 'package.json', 'package-lock.json', '.gitattributes', '.nvmrc')).digest('hex');
log.write(`FASE 8 — CONTROL\nInicio UTC: ${inicio.toISOString()}\nNode: ${process.version}\nCommit: ${git('rev-parse', 'HEAD')}\nSHA-256 diff de código/configuración: ${huellaCambios}\nComando: npm run ${comando}\n\n`);
const hijo = process.platform === 'win32'
  ? spawn(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', `npm.cmd run ${comando}`], { windowsHide: true })
  : spawn('npm', ['run', comando]);
hijo.stdout.on('data', (b) => { process.stdout.write(b); log.write(b); });
hijo.stderr.on('data', (b) => { process.stderr.write(b); log.write(b); });
hijo.on('error', (error) => { log.write(`Error de ejecución: ${error.message}\n`); });
hijo.on('close', (codigo, senal) => {
  log.end(`\nCódigo de salida: ${codigo ?? 1}\nSeñal: ${senal ?? '-'}\nDuración segundos: ${((performance.now() - reloj) / 1000).toFixed(2)}\n`);
  process.exitCode = codigo ?? 1;
});
