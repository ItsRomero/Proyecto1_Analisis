# Prompt de ejecución — Fase 6

Este prompt corresponde a la fase 6 de `Prompt_Maestro_Proyecto_Final_Por_Fases_v2.md`. Antes de ejecutarlo, lee ese documento y aplica sus reglas globales, el stack contractual, el contrato canónico, las reglas R-1 a R-7, las decisiones D-1 a D-9 y los casos OP-1 a OP-7 y G-1 a G-8. Revisa los cierres vigentes de las fases anteriores: `docs/proyecto-final/00-auditoria-linea-base.md`, `01-arquitectura-contratos-integracion.md`, `02-persistencia-carga-canonica.md`, `03-api-interfaz-react.md`, `04-mcp-aprobacion-humana.md` y `05-rag-citacion-inyeccion.md`; verifica que se cumplieron sus criterios de salida antes de comenzar. Ejecuta únicamente esta fase y utiliza el formato de informe de la sección 3 del documento maestro. No avances automáticamente a la fase 7.

## Continuidad con la fase 5

- Inspecciona el estado Git antes de editar y conserva el trabajo existente. Continúa en `feat/proyecto-final-asistente-gerencial` si ya contiene las fases 0 a 5 (cierre de fase 5: commit `8d954df`, sin push); no recrees la rama ni descartes sus commits. Los recorridos e2e regeneran las capturas de `docs/proyecto-final/evidencia/capturas/`; si aparecen modificadas, revísalas y consérvalas o restáuralas de forma explícita, sin descartar otros cambios.
- Ejecuta `npm run fase6:preflight` antes de cualquier cambio (en PowerShell, `npm.cmd run …` si la política de ejecución bloquea `npm.ps1`). Encadena typecheck de núcleo y web, `npm test`, la integración PostgreSQL (carga, API, MCP y stdio), los recorridos e2e, la comprobación de la carga de demo y las pruebas RAG con modelos reales; se detiene al primer fallo. Línea base esperada: 347 pruebas generales en 25 archivos, 30 de PostgreSQL en 4 archivos, 10 recorridos e2e y 6 pruebas RAG reales. Confirma la línea base real y conserva intactas todas las pruebas existentes.
- Entorno local: contenedores `cv-proyecto-final-db` (PostgreSQL 17 + pgvector, `127.0.0.1:55432`, migraciones 001 a 003) y `cv-ollama` (Ollama 0.40.4, `127.0.0.1:11434`, `bge-m3` y `qwen3:8b` con sus digests en `evidencia/fase5-modelos.txt`); si están detenidos, `docker start cv-proyecto-final-db cv-ollama`. La base de demo ya tiene la carga canónica y el corpus ingerido. `.env` desde `.env.example`, nunca versionado. Usa Node.js 22 LTS conforme a `.nvmrc` (las fases 3 a 5 se validaron con v24.19.0) y registra la versión real.
- Ya existen y deben reutilizarse, sin duplicar lógica: `conectarMcpSesion` (`src/api/conector-mcp.ts`, proceso MCP stdio ligado a la sesión de interfaz, ADR-020) para las siete consultas y `proponer_pago`; `responderPolitica` y `clasificarPregunta` (`src/rag/`, ADR-021) para preguntas normativas; la sesión de demostración, el evento humano de un solo uso y la confirmación `POST /v1/propuestas-pago/{propuestaId}/confirmacion` con `Idempotency-Key` (ADR-019); el layout gerencial y la ruta reservada `/gerencia/asistente` de la fase 3; y las variables `LLM_*`, `CHAT_SESSION_MAX_TURNS` (12) y `CHAT_SESSION_TTL_MINUTES` (60) de `.env.example` (ADR-008).
- El orquestador del chat vive en el backend (por ejemplo, `src/chat/` expuesto por rutas `/v1/chat/...` de la misma API) y usa `qwen3:8b` con *tool calling* sobre las herramientas que publica el servidor MCP de la sesión. La interfaz del chat vive en `web/src/chat/` y se muestra en `/gerencia/asistente`, con acceso persistente desde el layout gerencial. El navegador nunca habla con Ollama ni con MCP directamente.
- Enrutamiento: decide MCP, RAG o ambos con el modelo y las herramientas, apoyado en `clasificarPregunta`, sin depender solo de esta heurística (la fase 5 documentó falsos positivos como "¿cuántos habitantes…?"). Las cifras salen solo de los resultados de herramientas MCP y se muestran tal como las devolvió el núcleo. La fecha de corte de la sesión se pasa a las herramientas y aparece junto a cada cifra con la herramienta de origen.
- Aprobación humana: cuando el modelo invoque `proponer_pago`, el chat muestra la propuesta (prelación, monto exacto, estado previsto, clave e identificador) con botones explícitos **Aprobar** y **Cancelar**. Aprobar llama a la confirmación existente de la API con evento humano e `Idempotency-Key`; ningún mensaje de texto, silencio ni respuesta del modelo cuenta como aprobación. Una propuesta pertenece a su sesión y no se reutiliza entre conversaciones; reiniciar la conversación invalida las pendientes.
- Memoria: solo de la sesión, acotada a `CHAT_SESSION_MAX_TURNS` y `CHAT_SESSION_TTL_MINUTES`, con opción de reiniciar. No se guarda razonamiento interno ni se muestra al usuario (`think: false` y eliminación de bloques `<think>`); se muestran las llamadas a herramientas y su estado de forma comprensible. Al modelo no se le envían DPI, teléfonos ni registros completos de clientes, y la salida se filtra con el mismo filtro de PII del RAG.
- Latencia: `qwen3:8b` en CPU tarda ~45 s por respuesta (fase 5) y una conversación con herramientas puede encadenar varias llamadas. Diseña estados de espera claros, tiempo límite por paso (`LLM_TIMEOUT_MS`) y manejo de errores y timeouts del modelo, embeddings, base de datos y MCP sin perder el estado de una propuesta pendiente. Documenta los tiempos reales medidos.
- Pruebas en dos niveles: (1) **deterministas, dentro de `npm test`**, sin red ni Ollama, con un modelo guionado solo en pruebas que emite llamadas a herramientas (enrutamiento MCP/RAG/ambos, cifras del chat idénticas a las de la herramienta, aprobación solo por botón, rechazo de OP-7, ausencia de PII, aislamiento de sesiones, límite de memoria y reinicio); (2) **con Ollama y PostgreSQL reales, en un comando aparte** (por ejemplo `npm run test:chat`), sobre `TEST_DATABASE_URL`, para recorrer G-1 a G-8 y OP-7 tras OP-1 a OP-3 y comprobar que pantalla y chat coinciden en G-1 a G-5. Agrega al menos un recorrido e2e del chat en navegador. Las dependencias nuevas se justifican en el informe.
- Documenta arquitectura del chat, enrutamiento, memoria, aprobación, manejo de errores y resultados verificables en el README, en `web/src/chat/README.md` y en `docs/proyecto-final/06-chat-gerencial.md`, con evidencia en `docs/proyecto-final/evidencia/fase6-*.txt` (incluidas las respuestas reales del modelo, sin editarlas) y capturas reales. Si una decisión lo requiere, regístrala en un ADR nuevo desde ADR-022. Agrega `npm run fase7:preflight` equivalente al control de esta fase que incluya las nuevas pruebas. No inventes resultados.

# PROMPT 6 - Chat gerencial integrado (E5)

## Objetivo

Integrar en la misma aplicación un chat que orquesta MCP y RAG, conserva contexto de sesión y muestra aprobaciones humanas.

## Acciones obligatorias

1. El chat vive en `web/src/chat/`, dentro de la aplicación; no en terminal ni en una ventana aparte.
2. Memoria limitada a la sesión, con opción de reiniciar la conversación.
3. Decide si una solicitud requiere MCP, RAG o ambos.
4. Cifras por MCP; políticas por RAG; respuestas mixtas combinando resultados sin recalcular.
5. Muestra las llamadas y el estado de las herramientas de forma comprensible, sin razonamiento interno ni secretos. La fecha de corte usada y la herramienta de origen quedan visibles junto a cada cifra (origen visible exigido por el video).
6. Citas como enlaces o referencias legibles.
7. Al proponer un pago, muestra el desglose y botones explícitos de aprobar y cancelar. El silencio o un mensaje ambiguo no son aprobación.
8. Maneja errores y timeouts del modelo, embeddings, base de datos y MCP sin perder el estado de una operación sensible.
9. Evita DPI, teléfono u otros datos personales salvo que el caso de uso autorizado lo requiera; nunca en OP-7.
10. Proveedor y modelo por variables de entorno; sin claves en el repositorio.
11. Con Gemini o Groq, minimiza el contexto enviado: sin DPI, teléfonos ni registros completos de clientes.
12. Contexto suficiente para preguntas encadenadas, sin mezclar sesiones ni reutilizar aprobaciones entre conversaciones.

## Consultas obligatorias

- G-1 a G-5 se ejecutan primero en pantalla y después en el chat, con resultados idénticos.
- G-6 y G-7 se resuelven en el chat mediante MCP.
- G-8 se resuelve mediante RAG con cita.
- Todas usan corte `2026-10-31`, salvo G-7 (`2027-01-24`).
- Se formulan después de OP-1 a OP-7, sobre el mismo estado de la base.

## Pruebas mínimas

- El chat enruta a MCP las preguntas numéricas, a RAG las normativas y a ambos las mixtas, y sus cifras son exactamente las de la herramienta.
- Una propuesta de pago del chat no tiene efecto hasta pulsar Aprobar; Cancelar la deja sin efecto; un mensaje como "sí, apruébalo" no aprueba.
- OP-7 en el chat no invoca herramientas por indicación de la nota, no reproduce sus marcadores y no contiene DPI ni teléfono.
- Dos sesiones no comparten memoria ni propuestas; reiniciar la conversación limpia el contexto e invalida las propuestas pendientes.
- Errores y timeouts del modelo o de MCP se muestran sin perder una propuesta pendiente ni filtrar trazas, SQL o PII.
- G-1 a G-5 en el chat coinciden con las pantallas para el mismo corte.

## Criterio de salida

El chat mantiene contexto, usa la herramienta correcta y coincide con la pantalla porque ambos consumen el mismo núcleo.

---
