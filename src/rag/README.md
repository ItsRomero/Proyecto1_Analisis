# RAG de políticas (fase 5)

Diseño en ADR-021. Recuperación y generación separadas; el corpus es dato no confiable y el modelo de redacción no tiene herramientas.

| Archivo | Rol |
| --- | --- |
| `corpus.ts` | Lee exactamente los siete `.md` de `CV_DATA_DIR/corpus`, valida el encabezado YAML, limpia PII y fragmenta por secciones `##` (LangChain `Document`) |
| `seguridad.ts` | Filtro de PII (DPI, teléfono, correo), detector genérico de texto dirigido al asistente y escape de delimitadores |
| `almacen-pg.ts` | Ingesta idempotente en `documentos`/`fragmentos`/`vectores` (pgvector), recuperador coseno y bitácora `consultas_rag` |
| `ollama.ts` | Configuración (`OLLAMA_BASE_URL`, `EMBEDDING_*`, `RAG_*`, `LLM_*`), digest de modelos, `OllamaEmbeddings` y `ChatOllama` |
| `respuesta.ts` | Clasificación normativa/numérica, prompt con reglas en sistema y corpus delimitado, validación de citas, filtro de salida y registro |
| `puertos.ts` | `Recuperador`, `ModeloEmbeddings`, `ModeloLenguaje` y `BitacoraRag` |

Flujo de `responderPolitica(pregunta)`:

1. Se clasifica la pregunta (NORMATIVA, NUMÉRICA o MIXTA).
2. Se recuperan k = 4 fragmentos del mismo modelo y digest, y se descartan los que no llegan al umbral de 0.5. Si no queda ninguno, la respuesta es "sin respaldo" y no se consulta al modelo.
3. Se arman los mensajes: las reglas van en el mensaje de sistema; el corpus y la pregunta, escapados y delimitados, en el mensaje humano.
4. `qwen3:8b` redacta la respuesta (temperatura 0, sin modo de razonamiento).
5. Se procesa la salida: se quitan los bloques `<think>`, se filtran datos personales y se validan las citas `[DOC_ID §Sección]` contra lo recuperado. Sin una cita válida, la respuesta es "sin respaldo".
6. Se registra en la bitácora sin el texto de la pregunta ni de la respuesta.

Comandos: `npm run rag:ingesta` y `npm run rag:consulta -- "<pregunta>"` (base de `DATABASE_URL`), `npm run test:rag` (Ollama + `TEST_DATABASE_URL`) y `node scripts/rag/calibrar.mjs` (umbral, base de prueba).
