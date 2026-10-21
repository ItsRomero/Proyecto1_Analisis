import { readFile, writeFile } from 'node:fs/promises';
const fuente = 'docs/proyecto-final/evidencia/fase8-preflight.txt';
const texto = (await readFile(fuente, 'utf8')).replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');
const suites = [...texto.matchAll(/^\s*Tests\s+([^\r\n]+)/gm)].map((m) => {
  const r = { aprobadas: 0, fallidas: 0, omitidas: 0, linea: m[1].trim() };
  for (const n of m[1].matchAll(/(\d+)\s+(passed|failed|skipped|todo)/g)) {
    const clave = n[2] === 'passed' ? 'aprobadas' : n[2] === 'failed' ? 'fallidas' : 'omitidas';
    r[clave] += Number(n[1]);
  }
  return r;
});
const codigo = texto.match(/^Código de salida: (\d+)$/m)?.[1];
const resumen = { fuente, commit: texto.match(/^Commit: (\w+)$/m)?.[1] ?? null,
  node: texto.match(/^Node: (.+)$/m)?.[1] ?? null,
  codigoSalida: codigo === undefined ? null : Number(codigo),
  duracionSegundos: Number(texto.match(/^Duración segundos: ([\d.]+)$/m)?.[1]) || null,
  completa: codigo === '0' && suites.length === 6 && suites.every((s) => s.fallidas === 0 && s.omitidas === 0),
  suites, totales: suites.reduce((r, s) => ({ aprobadas: r.aprobadas + s.aprobadas, fallidas: r.fallidas + s.fallidas, omitidas: r.omitidas + s.omitidas }),
    { aprobadas: 0, fallidas: 0, omitidas: 0 }) };
await writeFile('docs/proyecto-final/evidencia/fase8-resumen-verificacion.json', JSON.stringify(resumen, null, 2) + '\n');
console.log(JSON.stringify(resumen, null, 2));
