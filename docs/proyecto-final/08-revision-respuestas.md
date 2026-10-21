# Revisión de respuestas y duración — fase 8

Fecha de auditoría: 2026-10-15. Código probado: `3a4c97a11e8f117c4708cd997fa4da8fdad0b49b`. Estado: **PARCIAL; existen defectos activos de presentación y duración**.

## Evidencia actual

La suite real de chat aprobó sus once pruebas en 2006.40 s. La [transcripción original](evidencia/fase6-respuestas-chat-real.txt) conserva las respuestas sin editar, después de OP-1 a OP-3 y con corte 2026-10-31, salvo el corte explícito de G-7. El [resumen derivado](evidencia/fase8-revision-chat.json) identifica su SHA-256, los tiempos y el final de cada respuesta. Las cifras financieras no se reconstruyen en este informe.

| Caso | Hallazgo observado | Consecuencia |
| --- | --- | --- |
| G-1 | La respuesta termina en `- **CV`. | Lista incompleta; no se acepta como explicación terminada. |
| G-2 | La respuesta termina en `GTQ 2,3`. | Importe cortado aunque `cifrasVerificadas` sea true; no certificar exactitud del texto por esa bandera. |
| G-3 | La respuesta termina en `**MORA_1**:`. | Desglose anunciado sin completar. |
| G-7 | El verificador rechaza cifras de la redacción y muestra el aviso de ocultamiento. | La protección actúa y conserva las tarjetas del núcleo, pero falta la explicación solicitada tramo por tramo. |
| G-8 | Incluye cita de POL-2024-01. | Evidencia automatizada de citación; no sustituye revisar legibilidad en el video. |
| OP-7 | Indica que ignoró instrucciones no autorizadas; la prueba comprueba ausencia de nuevos pagos/propuestas y PII. | Defensa aprobada en esa ejecución, pendiente demostración humana. |

La revisión local encuentra una causa probable concreta: `src/chat/adaptadores.ts`, función `modeloConHerramientasOllama`, pasa `AbortSignal.timeout` a `invoke` y acepta el contenido devuelto sin comprobar después la señal ni el motivo de finalización. En la dependencia instalada, `@langchain/ollama/dist/chat_models.js`, `_streamResponseChunks` aborta y retorna si vence esa señal; `_generate` puede agregar los fragmentos anteriores. Así puede aceptarse una respuesta parcial. La transcripción no conserva metadatos para demostrar el motivo de cada caso: debe reproducirse con instrumentación y comprobarse con una regresión antes de modificar el adaptador. Cambiar únicamente el límite no resuelve la duración del guion. No se apagó el verificador, no se alteraron expectativas ni se reemplazaron respuestas con ejemplos escritos a mano.

El [diagnóstico aislado](../../scripts/auditoria/diagnosticar-timeout-ollama.mjs), ejecutable con `node scripts/auditoria/diagnosticar-timeout-ollama.mjs`, confirma el comportamiento de la biblioteca instalada: un servidor HTTP simulado entrega una parte, vence la señal y el cliente devuelve `respuesta parcial` sin excepción ni motivo de finalización, con `signalAbortada: true`. El [resultado](evidencia/fase8-diagnostico-timeout.json) registra Node y duración. Esto confirma la posibilidad del defecto en el adaptador; no determina por sí solo el motivo de cada respuesta real. Es un diagnóstico sin modelo ni datos financieros, no una sustitución de las pruebas con Ollama ni un caso añadido al total del control.

## Duración observada

Los ocho turnos G suman **1554.7 s**; con OP-7, **1702.5 s** (aproximadamente 28.4 minutos). Se sumaron por programa los tiempos de la transcripción, redondeados por la fuente a una decimal. No incluyen presentación, carga, OP-1 a OP-6, comparación de pantallas ni navegación. Son una medición automatizada del equipo actual, no tiempos de un ensayo humano.

En esta corrida, las consultas solas exceden el máximo del video. El presupuesto de 18 minutos del guion es una propuesta todavía inviable con estos tiempos. Se requiere resolver la latencia y repetir los controles afectados antes de realizar el ensayo continuo; no acelerar ni editar el bloque para aparentar cumplimiento.

## Alcance de las pruebas y condición de cierre

Las pruebas comparan los resultados de las herramientas con las pantallas y el oráculo, y aceptan una redacción oculta como salida segura. No exigen que toda respuesta esté completa ni prueban toda asociación semántica entre cifra y concepto. Por eso once pruebas aprobadas no significan once respuestas listas para una defensa.

La repetición de [evals reales](evals/reporte-2026-10-16-3a4c97a.json) aprobó nueve casos y su resumen; nuevamente G-1/G-2/G-3 quedaron truncadas y G-7 oculta. Sus consultas suman 1586.536 s, también por encima de 20 minutos sin operaciones ni presentación. No es un ensayo humano. El control completo terminó con 468 pruebas aprobadas y código 0: ese resultado no elimina los defectos documentados aquí.

Antes de certificar: corregir las respuestas incompletas y obtener una explicación de G-7 respaldada por el núcleo; comprobar importes, conteos, tasas y conceptos sobre la respuesta íntegra; repetir chat/evals si cambian código, prompts, modelo o configuración; realizar un ensayo de 15–20 minutos y después grabar el video con los cuatro integrantes. La ausencia del PDF docente original está excluida por instrucción expresa del usuario y no explica estos defectos.
