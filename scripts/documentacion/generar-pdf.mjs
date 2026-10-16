import { chromium } from 'playwright-core';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';

const fuente = resolve('docs/proyecto-final/PF_AsistenteGerencial_2.html');
const salida = resolve('PF_AsistenteGerencial_2.pdf');
const navegador = await chromium.launch({ channel: process.env.E2E_CANAL_NAVEGADOR ?? 'chrome', headless: true });
try {
  const pagina = await navegador.newPage();
  await pagina.goto(pathToFileURL(fuente).href);
  await pagina.emulateMedia({ media: 'print' });
  const paginas = await pagina.locator('article').evaluateAll((elementos) => elementos.map((e, i) => ({
    pagina: i + 1, alto: e.getBoundingClientRect().height, ancho: e.getBoundingClientRect().width,
    desbordeHorizontal: e.scrollWidth > e.clientWidth, texto: e.textContent.trim().length,
  })));
  if (!paginas.length || paginas.some((p) => p.alto > 960 || p.desbordeHorizontal || p.texto < 50))
    throw new Error('El documento tiene una página vacía o fuera del área imprimible.');
  await pagina.pdf({ path: salida, format: 'A4', printBackground: true, displayHeaderFooter: true,
    headerTemplate: '<span></span>', footerTemplate: '<div style="width:100%;font:9px Arial;text-align:center;color:#526070">Crédito Vecino · Grupo 2 · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    margin: { top: '17mm', right: '17mm', bottom: '17mm', left: '17mm' } });
  await mkdir('docs/proyecto-final/evidencia', { recursive: true });
  await writeFile('docs/proyecto-final/evidencia/fase8-pdf-layout.json', JSON.stringify({ fuente: 'docs/proyecto-final/PF_AsistenteGerencial_2.html', salida: 'PF_AsistenteGerencial_2.pdf', paginas }, null, 2) + '\n');
  console.log(`PDF generado: PF_AsistenteGerencial_2.pdf; ${paginas.length} páginas fuente sin desbordamiento.`);
} finally { await navegador.close(); }
