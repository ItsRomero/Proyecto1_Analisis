# Fase 8 — Documentación, defensa y auditoría final (E7)

Fecha: 2026-10-15. Base recibida: ba90a7c, rama feat/proyecto-final-asistente-gerencial.

FASE: 8.

ESTADO: PARCIAL. Documentación y PDF generados. La verificación completa con modelos y la instalación limpia se están documentando; ensayo continuo, video compartible y defensa oral no se acreditan como realizados. No listo para entrega.

## Cambios realizados

- README reestructurado para instalación de todo el sistema, variables, base/modelos, carga, siete pantallas, chat, comandos, origen de cifras y límites. Corrige el título histórico, Node, conteos, árbol y diagramas sin borrar historia de Git.
- PDF PF_AsistenteGerencial_2.pdf, siete páginas, con fuente HTML editable y script gratuito sobre Chrome/Playwright. Portada con cuatro integrantes y carnés del maestro, arquitectura, integración, MCP/RAG, seguridad, decisiones y límites reales.
- Guion de video con presupuesto de 18 minutos y pasos por caso, guía interna de defensa y auditoría de rúbrica/penalizaciones.
- Correcciones de reproducibilidad: Node mínimo compatible, `.nvmrc`, grabación histórica con LF y source-map-js 1.2.2. Variable pública de `.env` actualizada a API relativa; sin modificar credenciales ni pruebas heredadas.
- Capturador de controles UTF-8 y ADR-024. Sin cambios en fórmulas financieras, corpus, datos ni permisos de aprobación.

## Archivos

`README.md`, `.nvmrc`, `.gitattributes`, `package.json`, `package-lock.json`; `scripts/auditoria/ejecutar-control.mjs`; `scripts/documentacion/generar-pdf.mjs`; `docs/adr/ADR-024-reproducibilidad-auditoria-final.md`; `docs/proyecto-final/PF_AsistenteGerencial_2.html`, `08-guion-video.md`, `08-guia-defensa-interna.md`, `08-auditoria-final.md`, este informe y evidencia fase8-*; PDF en raíz.

## Comandos y resultados observados

| Comando | Resultado |
| --- | --- |
| Fetch usando schannel | main/origin/main 0/0; se conserva la rama existente |
| Primer fase8:preflight | Falló typecheck por dependencias ausentes; código 2 |
| npm ci | Restauró dependencias del lockfile; detectó runtime antiguo y una vulnerabilidad |
| Node 22.23.3 oficial | ZIP contrastado con SHASUMS256.txt, runtime portátil sin cambiar el global |
| Segundo fase8:preflight | Typecheck correcto; 398 pasan y una prueba de grabación falla por CRLF |
| Prueba de verificador tras LF | Dos aprobadas; mismas aserciones y contenido Git de la grabación |
| Parche source-map-js | Solo 1.2.1 → 1.2.2; npm audit informa cero vulnerabilidades conocidas |
| Tercer fase8:preflight | 399 generales y 31 PostgreSQL pasan; navegador: nueve fallan, uno pasa por URL pública antigua |
| test:e2e tras `/v1` | Diez aprobadas; 37.96 s de suite en la corrida específica |
| docs:pdf + revisión | Siete páginas, texto extraíble, un enlace, sin desbordamiento de fuente; portada y resultados revisados renderizados |

Las corridas fallidas se conservan con sus mensajes reales. El control completo final y el clon limpio se agregan con su resultado una vez terminen; no se atribuyen los 467 éxitos históricos de fase 7 a esta ejecución.

## Pruebas

Pruebas actuales aprobadas por sección: 399 generales, 31 PostgreSQL y diez navegador. La prueba de grabación conserva sus expectativas originales. Ninguna prueba heredada se modificó para aprobar. La validación con modelos reales está pendiente del control final; una suite no ejecutada no se cuenta como omitida silenciosamente ni aprobada.

## Decisiones

ADR-024 documenta compatibilidad de runtime, saltos LF, API relativa, dependencia corregida, captura UTF-8 y PDF sin una nueva biblioteca de producción. Se preservan modelo y stack; no se oculta la latencia ni se apaga el verificador de cifras.

## Riesgos o bloqueos

No existe video real, enlace compartible, ensayo continuo dentro de 15–20 minutos ni defensa oral acreditada. Las consultas históricas G + OP-7 consumieron por sí solas 1147.507 s; no se puede certificar el tiempo total del video con ese dato. El verificador no controla todos los enteros ni la semántica de cada cifra; G-2 puede ocultarse por cifras ajenas. Sesiones en memoria.

## Pendiente para completar la fase

Terminar control completo y clon limpio; resolver errores actuales si aparecen; medir y resolver la duración del guion; grabar/revisar el video con los cuatro integrantes; agregar enlace real y completar auditoría. No crear entrega-pf ni declarar listo hasta contar con evidencia crítica completa. No hay una siguiente fase automática.

## Git

Rama feat/proyecto-final-asistente-gerencial. Base ba90a7c. Los commits de fase 8 se consultan con `git log --oneline -- docs/proyecto-final/08-documentacion-defensa-cierre.md`. Sin push ni etiqueta de entrega.
