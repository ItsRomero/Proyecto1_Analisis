# Auditoría final — corte de fase 8

Fecha: 2026-10-15. Base recibida: ba90a7c. **Estado: PARCIAL; entrega no certificada.** Este documento distingue resultados históricos, comprobaciones actuales y acciones externas pendientes. No sustituye la revisión del video ni asigna una nota individual.

## Verificaciones actuales y procedencia

- Se repitió el control de entrada con Node 22.23.3. Los primeros intentos detectaron dependencias ausentes, una incompatibilidad de saltos de línea de la grabación y una URL pública antigua que rompía los recorridos de navegador. Se conservan los errores en los logs de intentos, sin cambiar las aserciones heredadas.
- Control final completo: 400 pruebas generales, 31 PostgreSQL, diez recorridos de navegador, seis RAG reales, once de chat y diez evals aprobadas: 468, cero fallidas/omitidas, código 0, 4031.01 s. Código auditado 3a4c97a; log y resumen fase8-preflight/fase8-resumen-verificacion. El clon limpio está documentado por separado; no se hereda la aprobación histórica de fase 7.
- La auditoría npm detectó source-map-js 1.2.1; se aplicó 1.2.2 y el nuevo audit informó cero vulnerabilidades conocidas. Esto no equivale a ausencia absoluta de vulnerabilidades.
- PDF generado desde HTML editable, siete páginas, texto extraíble, sin desbordamientos detectados; se revisaron portada y página de resultados renderizadas. El PDF declara las condiciones pendientes de entrega.

## Matriz de cumplimiento

La [matriz de fase 7](07-matriz-requisitos-pruebas.md) localiza implementación, prueba y evidencia de cada OP/G, regla R y decisión D. El siguiente estado agrega los requisitos de cierre de esta fase.

| Requisito | Estado | Evidencia / límite |
| --- | --- | --- |
| Continuidad P1/P2, tipos y arquitectura | CUMPLE en verificación actual | Suite general de 400 pruebas; arquitectura, dominio y oráculo conservados. Incluye una nueva regresión de archivos estáticos. |
| E1: siete pantallas y flujos por aplicación | CUMPLE en prueba automatizada | Diez e2e tras corregir origen; no acredita una toma humana continua. |
| E2: migración/carga, huella, conteos, rollback e idempotencia | CUMPLE en integración | 31 pruebas PostgreSQL, incluidas carga y oráculo; integridad del ZIP/eventos en suite general. |
| E3: ocho capacidades MCP y aprobación humana | CUMPLE en integración | Tests MCP, stdio, HTTP y eventos humanos, dentro de las suites actuales. |
| E4: RAG, citas y resistencia OP-7 | CUMPLE en prueba automatizada RAG | Seis pruebas RAG reales aprobadas con los modelos locales; la demostración continua en video sigue pendiente. |
| E5: chat y pantalla iguales en G-1 a G-5 | PARCIAL | Once pruebas reales aprobadas, incluida igualdad de herramientas y pantallas; G-1/G-2/G-3 tienen redacción truncada y G-7 oculta. Véase [revisión de respuestas](08-revision-respuestas.md). |
| E6: pruebas y evals reales repetidas | CUMPLE en ejecución automatizada | Seis suites completas, 468 aprobadas. Nueve casos y resumen de evals aprobados en reporte-2026-10-16-3a4c97a; sus aserciones no exigen redacción completa. |
| E7: README y PDF | CUMPLE como artefactos | README reestructurado; PDF con fuente/script, metadatos y revisión visual. |
| Instalación desde clon limpio siguiendo README | CUMPLE en alcance documentado | Clon independiente de 3a4c97a, caché nueva, bases vacías y rol limitado: 400 generales, 31 PostgreSQL, diez e2e, carga, PDF y arranque. Véase [procedimiento y límites](08-instalacion-limpia.md). |
| Referencia de requisitos acordada | CUMPLE | Por instrucción del usuario del 15/10/2026 se excluye el PDF docente original; se usa el maestro y su rúbrica. No se afirma haber leído ese PDF ni se mantiene su ausencia como bloqueo. |
| R-1 a R-7 / D-1 a D-9 | CUMPLE en pruebas actuales pertinentes | Matriz de fase 7 y suites generales/PostgreSQL; no cambia el contrato del paquete. |
| Ausencia de secretos/PII en nuevas evidencias | CUMPLE en controles aplicados | Seis comprobaciones de seguridad sobre archivos preparados y revisión de capturas; sin secretos ni patrones protegidos detectados. No constituye garantía de ausencia absoluta. |
| Tiempo total del video 15–20 min | NO VERIFICABLE como video | No hay ensayo continuo ni grabación; la corrida actual excede el presupuesto solo en consultas. |
| Viabilidad del presupuesto con la latencia actual | NO CUMPLE en la corrida medida | G-1 a G-8 y OP-7 consumen 1702.5 s sin operaciones ni presentación; no cabe el guion completo en 20 minutos con esos tiempos. |
| Video compartible y cuatro voces | NO CUMPLE como entrega realizada | El usuario confirma el 15/10/2026 que todavía no existe video. Legibilidad y participación oral quedan sin verificar hasta grabarlo. |
| Entrega Canvas y etiqueta entrega-pf | NO CUMPLE como entrega realizada | No realizadas; no crear etiqueta ni afirmar entrega con evidencia crítica pendiente. |

Los estados de esta tabla se actualizan únicamente con resultados observados, no por la existencia de scripts o documentos. CUMPLE automatizado se limita al alcance indicado.

## Riesgos detectados en exactitud y presentación

La fase 7 aprobó nueve casos de evals reales, pero G-2 ocultó la redacción por un porcentaje sin respaldo. La corrida de chat actual tiene respuestas truncadas en G-1/G-2/G-3 y redacción oculta en G-7. Una aprobación de herramientas no equivale a respuesta completa en cámara. El verificador tampoco contrasta todos los enteros ni la relación semántica de cada cifra con su concepto. La [revisión actual](08-revision-respuestas.md) detalla los defectos y el alcance de las aserciones.

Sobre el reporte histórico `evals/reporte-2026-10-15-70def7e.json`, la suma de duraciones de G-1 a G-8 es **1050.620 s**; con OP-7 suma **1147.507 s**. Son tiempos de esas consultas históricas, no un ensayo nuevo. Ocupan por sí solos aproximadamente 19.1 minutos, sin incluir pruebas, carga, operaciones, pantallas ni presentación. No permiten certificar un video completo de 20 minutos con ese comportamiento. La duración actual debe medirse y, si es necesario, optimizarse con regresión antes de grabar; no recortar, acelerar ni simular respuestas.

La transcripción actual de chat suma **1554.7 s** para G-1 a G-8 y **1702.5 s** incluyendo OP-7: las consultas por sí solas exceden 20 minutos en este equipo. Esta medición automatizada no es un ensayo humano. La latencia y las respuestas incompletas son defectos activos que impiden certificar el guion, además de faltar el video.

## Rúbrica y penalizaciones

Sin video ni defensa, la nota grupal final es **NO VERIFICABLE**. Se preserva el máximo bruto por criterio para su evaluación humana, sin conceder puntos por artefactos no demostrados.

| Criterio | Máximo bruto | Evidencia existente / condición pendiente | Nota auditada |
| --- | ---: | --- | --- |
| RAG funcional con citación | 4 | Corrida actual con citas aprobada; demostración G-8/OP-7 pendiente | NO VERIFICABLE final |
| Chat integrado | 2 | Implementación y tests; redacción/latencia en ensayo continuo | NO VERIFICABLE final |
| Acciones y consultas vía MCP | 4 | Integración y navegador; OP/G en video con aprobación | NO VERIFICABLE final |
| Coherencia P1/P2 y pruebas | 2 | Suite vigente y prueba de coincidencia; cámara y versión final | NO VERIFICABLE final |
| Seguridad y menor privilegio | 2 | Permisos, aprobación y filtros; OP-7 real de entrega | NO VERIFICABLE final |
| Presentación y documentación | 1 | README/PDF/guías presentes; faltan video y defensa | NO VERIFICABLE final |
| Total bruto posible | 15 | No es nota obtenida | NO VERIFICABLE |

Después de la evaluación bruta, revisar cada penalización:

| Defecto | Penalización | Situación de auditoría |
| --- | ---: | --- |
| Cifra distinta del núcleo | −2.0 y criterio insuficiente | Oráculos y verificador mitigan; enteros/redacción completa y voz requieren revisión. No afirmar ausencia por el total de tests. |
| SQL/consola operando en Bloque 2 | −1.5 y bloque no calificado | Automatización usa API/UI; falta verificar la grabación. |
| Fecha actual en vez de corte | −1.0 | Pruebas de reloj falseado aprobadas; verificar el corte visible del video. |
| Carga alterada o sin SHA-256 | −1.0 | Huellas verificadas por pruebas; mostrar carga en video. |
| Pago sin aprobación / escritura por defecto | −1.0 | Controles automatizados; mostrar la aprobación previa real. |
| Obedecer OP-7 o revelar DPI/teléfono | −1.0 | Pruebas y permisos; verificar resultado actual y grabado. |
| Tablero y asistente distintos | −1.0 | Oráculo y pruebas; comparar el mismo estado posterior a operaciones. |
| Edición dentro de bloque / sin origen | −1.0 y bloque no calificado | Guion lo prohíbe; no verificable sin archivo de video. |
| Video ilegible | −4.0 | No verificable sin video reproducible. |

No se asigna cero a penalizaciones cuyo objeto aún no existe. Nota neta y porcentaje individual del Examen Final quedan pendientes de evaluación y datos reales.

## Condición para certificar

El control automatizado y la instalación limpia ya están aprobados. Resolver los defectos activos de redacción y latencia, repetir lo afectado, ensayar la secuencia completa dentro del tiempo y revisar la grabación final. Solo entonces enlazar el video, completar la auditoría, crear el commit de entrega y etiquetar entrega-pf. Los commits actuales registran una auditoría parcial, no una entrega aprobada. La publicación y Canvas requieren la acción/autorización del equipo.
