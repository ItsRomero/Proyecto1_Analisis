# Auditoría final — corte de fase 8

Fecha: 2026-10-15. Base recibida: ba90a7c. **Estado: PARCIAL; entrega no certificada.** Este documento distingue resultados históricos, comprobaciones actuales y acciones externas pendientes. No sustituye la revisión del video ni asigna una nota individual.

## Verificaciones actuales y procedencia

- Se repitió el control de entrada con Node 22.23.3. Los primeros intentos detectaron dependencias ausentes, una incompatibilidad de saltos de línea de la grabación y una URL pública antigua que rompía los recorridos de navegador. Se conservan los errores en los logs de intentos, sin cambiar las aserciones heredadas.
- Tras las correcciones: 399 pruebas generales y 31 PostgreSQL aprobadas; los diez recorridos de navegador pasan en la repetición específica. El control completo con modelos reales y la instalación limpia se registran en el cierre vigente; no se hereda automáticamente su aprobación de la fase 7.
- La auditoría npm detectó source-map-js 1.2.1; se aplicó 1.2.2 y el nuevo audit informó cero vulnerabilidades conocidas. Esto no equivale a ausencia absoluta de vulnerabilidades.
- PDF generado desde HTML editable, siete páginas, texto extraíble, sin desbordamientos detectados; se revisaron portada y página de resultados renderizadas. El PDF declara las condiciones pendientes de entrega.

## Matriz de cumplimiento

La [matriz de fase 7](07-matriz-requisitos-pruebas.md) localiza implementación, prueba y evidencia de cada OP/G, regla R y decisión D. El siguiente estado agrega los requisitos de cierre de esta fase.

| Requisito | Estado | Evidencia / límite |
| --- | --- | --- |
| Continuidad P1/P2, tipos y arquitectura | CUMPLE en verificación actual | Suite general de 399 pruebas; arquitectura, dominio y oráculo conservados. |
| E1: siete pantallas y flujos por aplicación | CUMPLE en prueba automatizada | Diez e2e tras corregir origen; no acredita una toma humana continua. |
| E2: migración/carga, huella, conteos, rollback e idempotencia | CUMPLE en integración | 31 pruebas PostgreSQL, incluidas carga y oráculo; integridad del ZIP/eventos en suite general. |
| E3: ocho capacidades MCP y aprobación humana | CUMPLE en integración | Tests MCP, stdio, HTTP y eventos humanos, dentro de las suites actuales. |
| E4: RAG, citas y resistencia OP-7 | PARCIAL en auditoría actual | Pruebas deterministas aprobadas; prueba con modelos del equipo actual debe completarse y registrarse. Evidencia histórica de fase 7 disponible. |
| E5: chat y pantalla iguales en G-1 a G-5 | PARCIAL en auditoría actual | Evidencia histórica y suite determinista; falta aprobación actual completa con modelos reales y revisión de la redacción. |
| E6: pruebas y evals reales repetidas | PARCIAL | Suite sin red, integración y navegador aprobadas; revisar resultado del control completo en cierre. |
| E7: README y PDF | CUMPLE como artefactos | README reestructurado; PDF con fuente/script, metadatos y revisión visual. |
| Instalación desde clon limpio siguiendo README | NO VERIFICABLE hasta completar ensayo | Debe identificar commit, entorno independiente y resultado; no basta npm ci en checkout de trabajo. |
| R-1 a R-7 / D-1 a D-9 | CUMPLE en pruebas actuales pertinentes | Matriz de fase 7 y suites generales/PostgreSQL; no cambia el contrato del paquete. |
| Ausencia de secretos/PII en nuevas evidencias | PARCIAL hasta revisión final | Prueba de seguridad y revisión de los archivos nuevos antes del commit final. |
| Tiempo total del video 15–20 min | NO VERIFICABLE como video | No hay ensayo continuo ni grabación. La latencia histórica amenaza el cumplimiento. |
| Video compartible, cuatro voces y bloques legibles | NO VERIFICABLE | No existe evidencia de grabación/participación oral en esta fase. |
| Entrega Canvas y etiqueta entrega-pf | NO CUMPLE como entrega realizada | No realizadas; no crear etiqueta ni afirmar entrega con evidencia crítica pendiente. |

Los estados de esta tabla se actualizan únicamente con resultados observados, no por la existencia de scripts o documentos. CUMPLE automatizado se limita al alcance indicado.

## Riesgos detectados en exactitud y presentación

La fase 7 aprobó nueve casos de evals reales, pero G-2 ocultó la redacción por un porcentaje sin respaldo. Una aprobación de herramientas no equivale a respuesta completa en cámara. El verificador tampoco contrasta todos los enteros ni la relación semántica de cada cifra con su concepto. El ensayo debe leer la respuesta completa y compararla con sus tarjetas/oráculo.

Sobre el reporte histórico `evals/reporte-2026-10-15-70def7e.json`, la suma de duraciones de G-1 a G-8 es **1050.620 s**; con OP-7 suma **1147.507 s**. Son tiempos de esas consultas históricas, no un ensayo nuevo. Ocupan por sí solos aproximadamente 19.1 minutos, sin incluir pruebas, carga, operaciones, pantallas ni presentación. No permiten certificar un video completo de 20 minutos con ese comportamiento. La duración actual debe medirse y, si es necesario, optimizarse con regresión antes de grabar; no recortar, acelerar ni simular respuestas.

## Rúbrica y penalizaciones

Sin video ni defensa, la nota grupal final es **NO VERIFICABLE**. Se preserva el máximo bruto por criterio para su evaluación humana, sin conceder puntos por artefactos no demostrados.

| Criterio | Máximo bruto | Evidencia existente / condición pendiente | Nota auditada |
| --- | ---: | --- | --- |
| RAG funcional con citación | 4 | Tests y citas; completar corrida actual y demostración G-8/OP-7 | NO VERIFICABLE final |
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

Completar el control actual, reproducir instalación limpia, resolver cualquier fallo activo, ensayar la secuencia completa dentro del tiempo y revisar la grabación final. Solo entonces enlazar el video, completar la auditoría, crear el commit final y etiquetar entrega-pf. La publicación y Canvas requieren la acción/autorización del equipo.
