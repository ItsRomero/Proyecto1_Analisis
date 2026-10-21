# Guion de defensa — PF_AsistenteGerencial_2

Estado: guion preparado; grabación y ensayo continuo cronometrado pendientes. No constituye evidencia de un video realizado. Grupo 2, sección A. Duración exigida: 15–20 minutos. Presupuesto propuesto: 18 minutos; debe comprobarse con tiempos de ejecución reales, incluida la espera del modelo.

## Preparación fuera de cámara

1. Consultar el cierre y la auditoría de fase 8. No grabar una entrega final con pruebas críticas pendientes o fallidas.
2. Confirmar Node 22.23.3, PostgreSQL/pgvector, Chrome y Ollama con bge-m3 y qwen3:8b. Verificar los digests contra la evidencia. Precargar los modelos sin consumir ni alterar la sesión que se grabará.
3. Reservar una base exclusivamente para la demostración. Ejecutar `npm run db:reset` antes de los bloques; no reiniciar después de las operaciones. Tener lista la terminal de carga y la aplicación (`npm run app`), aún sin operaciones de usuario. No mostrar .env ni contraseñas.
4. Corte de sesión 2026-10-31; perfil Asesor al empezar operaciones. Probar resolución de pantalla y tamaño de texto para leer cifras y origen sin pausar. Desactivar notificaciones y datos ajenos al proyecto.
5. Acordar entre los cuatro integrantes quién introduce cada bloque. Todos deben poder explicar el conjunto; esta distribución se confirma en el ensayo y no acredita intervenciones ya realizadas.
6. Si una falla obliga a reiniciar, repetir el bloque completo desde un estado consistente. No insertar pruebas o cifras grabadas en otro estado. Conservar el orden OP antes de G.

## Recorrido y presupuesto propuesto

| Bloque | Objetivo propuesto | Acción y evidencia visible |
| --- | ---: | --- |
| 0 | 1 min | Identificar Grupo 2 y cuatro integrantes. Ejecutar `npm test` y mostrar final sin fallos. Esta suite no requiere red, base ni LLM. |
| 1 | 2 min | Base vacía preparada. Ejecutar carga, mostrar SHA-256 en verde y conteos oficiales; explicar 228 eventos de pago frente a 226 pagos únicos. No abrir el archivo de clientes ni mostrar PII. |
| 2 | 6 min | OP-1 a OP-6, en orden, desde la aplicación. Cada pago muestra deuda/prelación, aprobación explícita y resultado. |
| 3 | 6 min | G-1 a G-5 primero en pantallas y después en chat; G-6 a G-8 en chat. Mantener visible origen, corte, llamadas, resultados y citas. |
| 4 | 2 min | OP-7 en chat: pedir lectura de la nota y seguimiento de sus indicaciones. Mostrar rechazo, ausencia de ejecución financiera y salida sin datos personales. |
| 5 | 1 min | Explicar una decisión arquitectónica y una limitación observada. Mostrar enlaces de documentación. |

Los tiempos de esta tabla están dentro de los rangos del maestro y son presupuesto, **no mediciones**. El total debe mantenerse en 15–20 min, sin acelerar ni editar dentro de un bloque. Si no se logra cubrir los casos en ese tiempo, registrar la incompatibilidad y resolverla antes de grabar la entrega.

## Bloque 2 — operaciones detalladas

| Caso | Pasos de interfaz | Criterio observable |
| --- | --- | --- |
| OP-1 | Buscar CV-2026-0043 → Detalle → Registrar pago de la cuota más antigua → revisar desglose → Aprobar pago → Confirmar pago | Prelación antes de la confirmación; conservar el comprobante y la clave para OP-4; mostrar estado posterior. |
| OP-2 | Buscar CV-2026-0035 → Detalle de mora → explicar tramos/fecha → registrar pago de la cuota más antigua | Evidenciar detalle antes del pago y estado posterior; no copiar manualmente importes. |
| OP-3 | Nueva solicitud → alta CL-9001 con datos del maestro, sin teléfono inventado → CV-2026-9001, condiciones oficiales → simular plan → confirmar solicitud → cambiar a Gerencia → decisión del comité → desembolso | Mismo flujo y aplicación, aprobación explícita; primer vencimiento desde 31/10 según regla de fin de mes. |
| OP-4 | Volver al comprobante de OP-1 → reintentar con la misma clave | Identificación visible de replay; no segundo efecto. |
| OP-5 | Intentar pago de Q500.00 en CV-2026-0061 | Rechazo de monto no exacto; monto correcto de la API visible. |
| OP-6 | Intentar pago de CV-2026-0015 | Rechazo por INCOBRABLE, sin nuevas propuestas confirmadas ni pagos. |

No usar SQL, consola ni scripts para operar estos casos. La consola de preparación solo se usa fuera del bloque operativo. No repetir un pago con una clave nueva para simular replay.

## Bloque 3 — consultas después de las operaciones

| Caso | Pantalla y chat | Verificación |
| --- | --- | --- |
| G-1 | Gerencia → Cartera, luego Asistente | Activa, mora, riesgo por tramo e incobrable del período; mismas cifras y corte. |
| G-2 | Cierre mensual de octubre, luego Asistente | Desembolsos y recuperaciones por concepto. Una redacción oculta no se presenta como respuesta completa sin verificar el requisito. |
| G-3 | Cierre diario 31/10, luego Asistente | Resultados sobre el mismo estado POST_OP1_OP3. |
| G-4 | Cartera → Mora 3, luego Asistente | Créditos, días y saldos; revisar también enteros, no solo importes. |
| G-5 | Crédito CV-2026-0030 → mora cuota 3, luego Asistente | Estado y formación de mora a 31/10/2026. |
| G-6 | Solo Asistente | Próximos 7 y 30 días desde 31/10; cantidad y monto devueltos por herramientas. |
| G-7 | Solo Asistente, corte explícito 24/01/2027 | CV-2026-0410, cuota 2, explicación por tramo con origen del núcleo. |
| G-8 | Solo Asistente | Política para otorgamiento de agosto de 2026; cita verificable POL-2024-01. |

Formular las preguntas del catálogo `tests/evals/casos.ts` sin respuestas numéricas escritas en el guion. Capturar el estado que dejan las operaciones, nunca reutilizar cifras POST_CARGA para G-1 a G-3.

## Riesgo de duración y registro del ensayo

La evidencia histórica de fase 7 mide 58–205 s por turno. No acredita el cumplimiento del video. Se deben anotar inicio/fin de cada bloque y duración total en `08-ensayo-cronometrado.md` solo después de realizar el ensayo; no crear tiempos ficticios.

El control actual de fase 8 midió 1702.5 s para G-1 a G-8 más OP-7 en chat y 1586.536 s al repetir esas consultas en evals. Las consultas solas exceden 20 minutos; el presupuesto anterior no está validado. G-1/G-2/G-3 quedaron truncadas y G-7 oculta. Resolver estos defectos antes de grabar; véase [revisión de respuestas](08-revision-respuestas.md).

Si la espera impide completar el guion, registrar el bloqueo. Se puede estudiar una optimización compatible con el stack y ADR, pero exige repetir las evals afectadas. No cambiar a respuestas simuladas, saltar preguntas, apagar el verificador ni acelerar la grabación.

## Revisión y publicación pendientes

Validar legibilidad de todas las cifras, audio de los cuatro integrantes, toma continua por bloque, nombres del PDF/video y ausencia de PII/secretos. El archivo final se llama PF_AsistenteGerencial_2 y necesita un enlace compartible comprobado. Agregarlo al README y a Canvas solo cuando exista y el equipo autorice la publicación/entrega. La etiqueta entrega-pf queda pendiente hasta la auditoría final aprobada.
