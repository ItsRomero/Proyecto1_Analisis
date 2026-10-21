# Prompt de ejecución — Fase 8

Este prompt corresponde a la fase 8 de `Prompt_Maestro_Proyecto_Final_Por_Fases_v2.md`. Antes de ejecutarlo, lee el maestro y aplica sus reglas globales, stack contractual, contrato canónico, reglas R-1 a R-7, decisiones D-1 a D-9, casos OP-1 a OP-7 y G-1 a G-8, rúbrica, penalizaciones y Definition of Done. Ejecuta únicamente esta fase y entrega el informe con el formato de la sección 3 del maestro. La generación de este archivo no ejecuta la fase 8 ni certifica que el proyecto esté listo para entregar.

## Entradas y continuidad verificadas al preparar este prompt

- Conserva el mismo repositorio y la rama `feat/proyecto-final-asistente-gerencial`. Inspecciona Git, remotos, etiquetas y divergencias antes de editar; preserva todo trabajo ajeno. No recrees la rama desde main ni descartes las fases integradas.
- Lee los cierres vigentes `docs/proyecto-final/00-auditoria-linea-base.md`, `01-arquitectura-contratos-integracion.md`, `02-persistencia-carga-canonica.md`, `03-api-interfaz-react.md`, `04-mcp-aprobacion-humana.md`, `05-rag-citacion-inyeccion.md`, `06-chat-gerencial.md` y `07-pruebas-evals-seguridad.md`. Los informes de bloqueo inicial y primera revisión son históricos y no sustituyen los cierres vigentes.
- La fase 7 está integrada en el commit `ba90a7c`; su base de oráculo/evals es `70def7e`. Declara 467 pruebas aprobadas con Node 22: 399 generales, 31 PostgreSQL, 10 e2e, seis RAG reales, 11 chat real y 10 pruebas de evals reales (nueve casos y resumen). Son resultados documentados de esa corrida, no resultados nuevos obtenidos al generar este prompt.
- Reutiliza `docs/proyecto-final/07-matriz-requisitos-pruebas.md`, `tests/evals/casos.ts`, `tests/evals/oraculo-congelado.json`, `tests/evals/grabaciones/`, `docs/proyecto-final/evals/reporte-2026-10-15-70def7e.{md,json}` y las evidencias de fases anteriores. Lee los ADR existentes, incluidos ADR-019 a ADR-023; no renumeres ni sustituyas decisiones aceptadas sin justificarlo.

## Control obligatorio de entrada y tratamiento de fallos

1. Verifica Node 22 LTS antes de comenzar. El cierre de fase 7 utilizó Node 22.23.3 portátil; no supongas que ese ejecutable siga disponible ni confundas el Node global con el de la evidencia.
2. Lee la implementación de los scripts antes de ejecutarlos para identificar sus bases, reinicios y artefactos regenerados. Conserva evidencia previa trazable y trabajo local. Nunca uses la base de demostración como TEST_DATABASE_URL.
3. Ejecuta `npm run fase8:preflight` y conserva salida, versión de Node, commit, fecha, duración y código de salida en `docs/proyecto-final/evidencia/fase8-preflight.txt`. Actualmente encadena `fase7:verificar`, con PostgreSQL, navegador, Ollama, RAG, chat y evals reales; el cierre previo midió unos 51 minutos. No lo sustituyas por `npm test` ni declares aprobada la entrada solo por leer un informe anterior.
4. Si falla una dependencia o prueba, identifica comando, caso, error y causa comprobable. Detén las acciones que dependan de ese resultado. Puedes completar documentación independiente, pero registra la fase como PARCIAL o BLOQUEADA según corresponda; no declares listo para entrega, no crees `entrega-pf` y no simules evidencia. Corrige dentro del alcance autorizado, conserva las pruebas heredadas y repite las verificaciones afectadas antes de aprobar.
5. No ejecutes automáticamente fases adicionales. Si la auditoría descubre un defecto funcional de fases anteriores, registra el requisito afectado y su evidencia; toda corrección debe incluir la regresión pertinente, sin duplicar reglas del núcleo ni debilitar seguridad para aprobar.

## Pendientes reales que debe resolver o medir esta fase

- **Tiempo del video:** la fase 7 documenta latencias de 58 a 205 segundos por turno en CPU. Ensaya el guion completo con tiempos reales antes de afirmar que cabe en 15–20 minutos. Precargar el modelo puede reducir el arranque, pero no demuestra que la latencia sostenida sea suficiente. No edites, aceleres, pauses artificialmente ni sustituyas respuestas por grabaciones dentro de los bloques. Si necesitas ajustar ejecución, hardware o modelo, conserva el stack, documenta la decisión en ADR y repite las evals afectadas. Si no puedes cumplir el tiempo, registra el bloqueo y no certifiques el video.
- **Redacción oculta:** en G-2 la corrida de fase 7 ocultó una respuesta por agregar «100%» sin respaldo. Las tarjetas del núcleo siguen visibles. Ensaya el comportamiento observable y verifica si satisface el requisito del chat; que la eval figure APROBADO no demuestra por sí solo una presentación completa en cámara. No ocultes esta limitación ni desactives el verificador para grabar.
- **Enteros sin porcentaje:** ADR-023 documenta que no se verifican todos los enteros de la redacción, incluidos días y conteos. Contrasta las respuestas completas con las herramientas/oráculo y evalúa el riesgo según la rúbrica de cifras. Si hay cifras inventadas, corrige con pruebas o declara el incumplimiento; no atribuyas garantía total de exactitud al verificador existente.
- **Variabilidad del modelo:** con temperatura 0 y semilla, solo dos de nueve textos coincidieron entre las corridas documentadas. Evalúa cifras, herramientas, citas y acciones efectivas en cada ensayo; no exijas una frase memorizada ni reutilices aprobaciones humanas.
- **Sesiones en memoria:** un reinicio del servidor pierde sesión y contexto. Prepara los servicios antes de cada bloque y conserva la continuidad exigida. No reinicies entre OP y G para reconstruir silenciosamente el estado.
- **Estado del oráculo:** distingue POST_CARGA de POST_OP1_OP3. G-1 a G-3 cambian después de las operaciones; G-7 usa corte 2027-01-24. No copies cifras de una corrida con estado distinto ni escribas respuestas financieras a mano en el guion.

## Entregables y evidencia de cierre

- Reestructura el README como guía reproducible del proyecto completo. Corrige las inconsistencias heredadas usando conteos actuales medidos; conserva referencias útiles de P1/P2. Documenta herramientas de IA realmente utilizadas (incluidas las contribuciones de Claude Code y Codex que pueda acreditarse), sin inventar porcentajes, tareas de integrantes ni entrevistas.
- Genera `PF_AsistenteGerencial_2.pdf` con su fuente editable versionada y un procedimiento gratuito reproducible. Verifica que el PDF abre, no tiene cortes de tablas/texto, tiene fuentes y enlaces legibles y corresponde a la versión final del código. Usa los nombres y carnés del maestro; no los reconstruyas de memoria.
- Escribe `docs/proyecto-final/08-guion-video.md`, `08-guia-defensa-interna.md`, `08-auditoria-final.md` y `08-documentacion-defensa-cierre.md`. El guion incluye pasos de interfaz, estado inicial, corte, origen visible de cifras, tiempos medidos, evidencia requerida y fallos que obligan a repetir un bloque. La guía de defensa prepara a los cuatro integrantes para explicar el sistema completo sin atribuirles intervenciones que no hayan ocurrido.
- Realiza la prueba de instalación en un clon limpio y aislado de un commit identificado, siguiendo solo el README. No uses node_modules, dist, cachés, rutas absolutas o una base ya cargada del checkout habitual para aparentar instalación limpia. Las credenciales y los insumos oficiales no versionados se provisionan por el procedimiento documentado; registra su procedencia y huellas. No copies secretos al clon ni al reporte.
- Reproduce carga, OP-1 a OP-6 y consultas G en el orden del maestro, sobre la misma base y mediante la aplicación. Incluye OP-7 en el bloque de seguridad. Los comandos de preparación se usan antes de operar; no sustituyas recorridos humanos por scripts o SQL en el bloque operativo.
- En la auditoría, enlaza requisito → implementación → prueba → evidencia con commit y estado de partida. Cubre E1 a E7, OP/G, R-1 a R-7, D-1 a D-9 y cada penalización. Usa CUMPLE, PARCIAL, NO CUMPLE o NO VERIFICABLE según evidencia real. Distingue cobertura automatizada, ensayo y grabación final. Presenta nota bruta por criterio y después penalizaciones; la nota individual depende de un dato externo y no se inventa.
- No atribuyas la grabación, participación oral, publicación del video o entrega en Canvas a la generación de documentación. Si falta el video real compartible, registra ese pendiente y no marques la fase completa ni listo para entrega. No generes enlaces ficticios ni archivos vacíos con nombre de video/PDF.
- Ejecuta las verificaciones apropiadas al cierre. Las evidencias deben identificar la versión auditada; si cambias código, dependencias, prompts, modelo o configuración, repite lo afectado. No modifiques pruebas para ocultar fallos ni regeneres el oráculo simplemente para acomodar cifras inesperadas.
- Crea `entrega-pf` únicamente sobre el commit final realmente aprobado por la auditoría, con evidencia crítica completa. Conserva `entrega-p1`; la etiqueta opcional `entrega-p2` solo se crea si el equipo lo decide. No hagas push, publiques el video ni envíes a Canvas por inferir autorización de la creación de este prompt; aplica las instrucciones expresas de publicación de la sesión cuando existan.

A continuación se conserva el alcance obligatorio de fase 8 del maestro. Las aclaraciones anteriores agregan continuidad y verificaciones concretas; no reducen sus requisitos.

# PROMPT 8 - Documentación, defensa y auditoría final (E7)

## Objetivo

Dejar el repositorio reproducible y preparar evidencia exacta para el video de defensa.

## README obligatorio

Incluye:

- Requisitos e instalación desde cero (Node 22, base de datos, Ollama y modelos si aplica).
- Migraciones, preparación de la base y `db:reset`.
- Uso de `CV_DATA_DIR` y del comando de carga.
- Cómo levantar API, web, MCP, RAG y chat.
- Variables de entorno, con `.env.example` sin secretos.
- Modelo de lenguaje y embeddings seleccionados, y la razón.
- Estrategia de fragmentación y embeddings (criterio de la rúbrica de RAG).
- Herramientas de IA utilizadas por el equipo y para qué.
- Arquitectura y flujo de datos.
- Tabla pantalla <-> caso de uso.
- Comandos de pruebas y evals.
- Discrepancias del paquete (duplicados de idempotencia y rango de fechas) y reglas R-1 a R-7 adoptadas.
- Limitaciones conocidas.
- Enlace al video cuando exista.
- Corrección de las inconsistencias heredadas: insignias de pruebas, conteo de diagramas y nombre de la raíz.

## Documento PDF obligatorio

Genera `PF_AsistenteGerencial_2.pdf` (Grupo 2), con portada de grupo, sección y los cuatro integrantes con carné. Contenido mínimo:

- Arquitectura del asistente.
- Integración con el núcleo P1/P2.
- Estrategia de RAG, fragmentación, embeddings y citación.
- Herramientas MCP y aprobación humana.
- Seguridad y mitigación de inyección.
- Decisiones de diseño y ADR relacionados (incluidas D-1 a D-9).
- Resultados verificables de pruebas y evals.
- Limitaciones reales.

Breve y orientado a evidencia; no repite P1/P2.

## Guion del video (15 a 20 minutos, bloques continuos)

Preparación antes de grabar: `db:reset` y migraciones, base vacía, Ollama o proveedor listo, aplicación levantada, fecha de corte de la sesión `2026-10-31`.

1. Bloque 0, 1-2 min: grupo, integrantes y `npm test` sin fallos.
2. Bloque 1, 2-3 min: base vacía, carga, SHA-256 en verde y conteos 60 / 75 / 228 (más los 226 pagos únicos aplicados).
3. Bloque 2, 6-7 min: OP-1 a OP-6 desde la aplicación, en orden, con prelación antes de cada pago, aprobación humana y estado posterior del crédito. Sin SQL ni consola.
4. Bloque 3, 5-6 min: G-1 a G-5 en pantalla y luego en el chat; G-6 a G-8 solo en el chat.
5. Bloque 4, 1-2 min: OP-7, seguridad y rechazo de instrucciones incrustadas.
6. Bloque 5, 1 min: una decisión de diseño y una limitación conocida.

Los cuatro integrantes hablan y pueden explicar el sistema completo. No se edita, acelera ni pega evidencia dentro de un bloque. Se graba la pantalla, no una cámara apuntando al monitor. Las operaciones se hacen con ratón y teclado. Las cifras deben leerse sin pausar y su origen debe quedar visible.

El video se llama `PF_AsistenteGerencial_2`, se publica con un enlace compartible y se enlaza en el README y en Canvas.

## Auditoría final

1. Repite la instalación desde un clon limpio siguiendo solo el README.
2. Repite carga, guion completo y pruebas.
3. Comprueba la correspondencia entre código, documentos, commits, enlaces y video.
4. Comprueba que pantalla y chat coinciden.
5. Comprueba que no hay secretos, datos personales filtrados ni archivos canónicos modificados (SHA-256 del ZIP y de `eventos.jsonl` iguales a los de este documento).
6. Revisa una por una las penalizaciones de la sección 8.1 del enunciado.
7. Emite la tabla final `CUMPLE`, `PARCIAL`, `NO CUMPLE` o `NO VERIFICABLE`, con evidencia.
8. Solo declara listo para entrega si ningún requisito crítico queda sin evidencia.
9. Verifica los nombres del PDF y del video, el Grupo 2, los cuatro integrantes y la tarea de Canvas "Proyecto Final — Asistente gerencial".
10. Crea la etiqueta `entrega-pf` sobre el commit de entrega (y, si el equipo lo decide, `entrega-p2` sobre `00192c9`), sin mover `entrega-p1`.
11. Prepara una guía de defensa interna para que cada integrante pueda explicar una decisión arquitectónica, una herramienta MCP, el control de aprobación, la defensa RAG y la separación entre LLM y núcleo (la serie del Examen Final evalúa esto individualmente).

---
