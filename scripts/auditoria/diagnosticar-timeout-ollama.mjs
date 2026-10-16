import { createServer } from 'node:http';
import { writeFile } from 'node:fs/promises';
import { ChatOllama } from '@langchain/ollama';

// Diagnóstico aislado del cliente instalado: no consulta Ollama, cartera ni credenciales.
const servidor = createServer((req, res) => {
  req.resume();
  res.writeHead(200, { 'content-type': 'application/x-ndjson' });
  const parte = (content, done) => JSON.stringify({ model: 'diagnostico', created_at: new Date().toISOString(),
    message: { role: 'assistant', content }, done, ...(done ? { done_reason: 'stop' } : {}) }) + '\n';
  res.write(parte('respuesta parcial', false));
  const pendiente = setTimeout(() => res.end(parte(' terminada', true)), 400);
  res.on('close', () => clearTimeout(pendiente));
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
const inicio = performance.now();
const signal = AbortSignal.timeout(150);
const resultado = { tipo: 'servidor HTTP local simulado; sin inferencia real', node: process.version };
try {
  const modelo = new ChatOllama({ model: 'diagnostico', baseUrl: `http://127.0.0.1:${servidor.address().port}` });
  const respuesta = await modelo.invoke('Prueba de tiempo limite', { signal });
  Object.assign(resultado, { devolvioRespuesta: true, texto: respuesta.content, signalAbortada: signal.aborted,
    finalizacion: respuesta.response_metadata?.done_reason ?? null });
} catch (error) {
  Object.assign(resultado, { devolvioRespuesta: false, signalAbortada: signal.aborted, error: error.name });
} finally {
  servidor.closeAllConnections();
  await new Promise((ok) => servidor.close(ok));
}
resultado.duracionMs = Math.round(performance.now() - inicio);
await writeFile('docs/proyecto-final/evidencia/fase8-diagnostico-timeout.json', JSON.stringify(resultado, null, 2) + '\n');
console.log(JSON.stringify(resultado, null, 2));
