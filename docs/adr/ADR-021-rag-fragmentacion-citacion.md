# ADR-021: RAG por secciones con bge-m3, pgvector, citas verificables y corpus no confiable

Estado: aceptado. Fecha: 2026-10-15. Concreta ADR-008 para la fase 5; mantiene ADR-007/020 (el corpus no autoriza herramientas).

## Contexto

El corpus oficial tiene siete documentos Markdown de 144 a 264 palabras, con encabezado YAML (`doc_id`, `titulo`, `vigencia`) y secciones `##`. Uno (`NOTA-CAMPO-07`) contiene un bloque dirigido al asistente que intenta cambiar sus reglas, invocar una herramienta de pago y obtener datos personales (OP-7). La migración 001 ya prevé `documentos`, `fragmentos` y `vectores vector(1024)` en la misma base del núcleo.

## Decisiones

1. **LangChain.js** (`@langchain/core`, `@langchain/ollama`): `Document` para fragmentos y metadatos, `OllamaEmbeddings` para `bge-m3`, `ChatOllama` para `qwen3:8b` (temperatura 0, `think: false`, semilla fija) y mensajes `SystemMessage`/`HumanMessage`. El almacén vectorial es propio sobre las tablas de la migración 001 (consulta `ORDER BY embedding <=> $1`), en lugar del `PGVectorStore` de LangChain, que impone su propio esquema.
2. **Fragmentación por secciones `##`**, sin tamaño fijo ni solapamiento: cada sección es una unidad normativa completa (regla, tabla, ejemplo) y los documentos son demasiado cortos para trocearlos más. El texto previo a la primera sección forma "Introducción"; un documento sin secciones es un solo fragmento. Resultado: 32 fragmentos. El texto que se incrusta antepone título, `doc_id`, sección y vigencia, de modo que la vigencia de cada política entra en el vector y en el prompt.
3. **Limpieza** al ingerir: se quita el encabezado YAML, se normalizan saltos de línea y se sustituyen patrones de DPI, teléfono y correo por `[dato personal omitido]`. Se guarda el SHA-256 de los bytes originales de cada documento y de cada fragmento.
4. **Embeddings `bge-m3`** (1024 dimensiones medidas, F16, digest registrado). No se evaluó `nomic-embed-text`: el maestro solo lo permite con una comparación en español que justifique el cambio, y `bge-m3` separó bien las preguntas con y sin respaldo.
5. **Recuperación**: k = 4 (`RAG_TOP_K`) y umbral de similitud coseno 0.5 (`RAG_UMBRAL_SIMILITUD`), calibrado con preguntas reales (`evidencia/fase5-calibracion-umbral.txt`): las preguntas con respaldo tuvieron una similitud máxima de 0.554 a 0.732 y las ajenas al corpus, de 0.275 a 0.452. Si ningún fragmento supera el umbral, no se consulta al modelo y la respuesta es "No hay respaldo en el corpus…".
6. **Corpus como datos no confiables**: las reglas viven solo en el mensaje de sistema. Los fragmentos van en el mensaje humano dentro de `<corpus><fragmento id documento seccion vigencia contiene_instrucciones_no_autorizadas>…</fragmento></corpus>`, con `<` y `>` escapados para que el texto no pueda cerrar delimitadores. Un detector genérico (órdenes al asistente, "ignora las reglas", pedidos de herramientas o de datos personales) marca los fragmentos sospechosos; no conoce ninguna cadena ni archivo concreto. El modelo de redacción **no tiene herramientas enlazadas**, así que el corpus no puede provocar escrituras, y la única escritura del asistente (MCP `proponer_pago`) sigue requiriendo aprobación humana.
7. **Salida verificada**: se eliminan bloques `<think>`, se filtran datos personales y cada cita `[DOC_ID §Sección]` se contrasta con los fragmentos efectivamente recuperados. Las citas inválidas se descartan y, si no queda ninguna válida (o el modelo responde `SIN_RESPALDO`), la respuesta es "sin respaldo".
8. **Normativa frente a numérica**: `clasificarPregunta` marca cada pregunta como NORMATIVA, NUMÉRICA o MIXTA para que el chat (fase 6) use RAG, MCP o ambos. El RAG nunca produce cifras de créditos concretos.
9. **Bitácora `consultas_rag`** (migración 003): huella SHA-256 de la pregunta, clasificación, fuentes con similitud, citas, sin respaldo, fragmentos con instrucciones ignoradas, PII omitida y modelos. No guarda el texto de preguntas ni respuestas.
10. **Ingesta idempotente** (`ingestas_rag`, por modelo, digest y huella del corpus): repetirla no inserta nada; un documento o fragmento que cambió se rechaza en lugar de sobrescribirse.
11. **Ollama en contenedor oficial** (`ollama/ollama`, volumen `cv-ollama-modelos`, puerto 127.0.0.1:11434) porque la máquina de trabajo no tenía Ollama.

## Alternativas descartadas

- Fragmentos de tamaño fijo con solapamiento: cortan tablas y reglas en documentos de 200 palabras y mezclan secciones.
- Bloquear o quitar `NOTA-CAMPO-07` del corpus: el maestro exige ingerir los siete y permite resumir su contenido legítimo.
- Detectar el texto malicioso por su contenido literal o por el nombre del archivo: prohibido por el maestro y frágil.
- Proveedor externo (Gemini o Groq) como respaldo silencioso: ADR-008 lo excluye.

## Consecuencias y límites

- Latencia en CPU (sin GPU en Docker): unos 45 s por respuesta con `qwen3:8b`; `LLM_TIMEOUT_MS=180000`.
- El margen del umbral es estrecho (0.452 frente a 0.554); otra pregunta ajena al corpus podría superarlo. En ese caso el modelo aún debe responder `SIN_RESPALDO` o dar una cita válida, porque sin cita válida no hay respuesta normativa.
- La temperatura 0 con semilla reduce la variación, pero no garantiza determinismo total. Las pruebas con el modelo real son un comando aparte (`npm run test:rag`) y no forman parte de `npm test`.

## Validación

`tests/rag.test.ts` (12 pruebas deterministas en `npm test`) y `tests/rag/rag-real.rag.ts` (6 pruebas con `bge-m3`, `qwen3:8b` y pgvector reales): ingesta idempotente y dimensión, G-8, OP-7, pregunta sin respaldo, citas dentro de lo recuperado y bitácora sin texto.
