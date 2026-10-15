# ADR-022: Chat gerencial: orquestación en el servidor, cifras verificadas y aprobación por botón

Estado: aceptado. Fecha: 2026-10-15. Complementa ADR-008 (modelo y memoria), ADR-019 (sesión y evento humano), ADR-020 (MCP por sesión) y ADR-021 (RAG).

## Contexto

La fase 6 integra en la aplicación un chat que debe consultar cifras por MCP, políticas por RAG o ambas, mostrar el origen y el corte de cada cifra, proponer pagos con aprobación explícita y resistir OP-7. El modelo local `qwen3:8b` corre en CPU (unos 13 a 80 s por llamada) y la heurística `clasificarPregunta` de la fase 5 tiene falsos positivos.

## Decisiones

1. **Orquestador en el backend** (`src/chat/orquestador.ts`), una `SesionChat` por sesión de interfaz en `AlmacenChats`, expuesta por `/v1/chat` (estado), `/v1/chat/mensajes`, `/v1/chat/propuestas/{id}/resolucion` y `/v1/chat/reinicio`, con la misma cookie y el mismo control de origen que la API. El navegador nunca habla con Ollama ni con MCP.
2. **Herramientas**: las ocho que publica el MCP de la sesión (`conectarMcpSesion`, stdio) más una herramienta local `consultar_politicas`, que invoca `responderPolitica`. El modelo decide con *tool calling* (`ChatOllama.bindTools`, temperatura 0, `think: false`, `numCtx` 8192, igual que el RAG para que Ollama no recargue el modelo). La clasificación heurística se le pasa como orientación y sirve de respaldo: una pregunta no numérica a la que el modelo responde sin herramientas se envía al RAG.
3. **Cifras solo de herramientas**: cada resultado se muestra en una tarjeta con la herramienta, el origen (MCP o RAG), los argumentos y la fecha de corte que devolvió el núcleo. El texto del modelo pasa por `verificarCifras`: si incluye un decimal (importe, porcentaje o tasa) que no aparece en los resultados del turno, la redacción se oculta y quedan solo las tarjetas. La fecha de corte de la sesión se inyecta en cada herramienta, salvo que el modelo pase otra porque la persona la pidió (G-7).
4. **Contexto mínimo para el modelo**: las listas de más de 15 elementos se recortan solo en el mensaje al modelo (la tarjeta conserva el resultado completo). El modelo del chat recibe la respuesta citada del RAG, nunca los fragmentos del corpus: el texto incrustado de `NOTA-CAMPO-07` no llega a su contexto. Si la única herramienta de un turno es `consultar_politicas`, la respuesta del RAG es la final, sin otra redacción.
5. **Aprobación humana**: `proponer_pago` deja la propuesta pendiente en la conversación y la interfaz la muestra con desglose, prelación, estado previsto, clave e identificador, y con los botones **Aprobar** y **Cancelar**. Aprobar llama a la confirmación existente de la API (evento humano e `Idempotency-Key`). El modelo no tiene ninguna herramienta de confirmación: una llamada inexistente vuelve como error y un mensaje como "sí, apruébalo" no tiene efecto. La interfaz informa el resultado (`resolucion`) para que la memoria lo refleje.
6. **Memoria acotada**: últimos `CHAT_SESSION_MAX_TURNS` (12) turnos (pregunta y respuesta final, sin resultados viejos de herramientas) y caducidad técnica de `CHAT_SESSION_TTL_MINUTES` (60). Las propuestas pendientes no caducan ni se pierden por errores. **Reiniciar la conversación** exige que no queden pendientes: la interfaz cancela cada una con evento humano y después reinicia (el servidor responde `409 PROPUESTAS_PENDIENTES` si queda alguna). Reiniciar la sesión de interfaz cierra el chat y su proceso MCP.
7. **Errores**: los timeouts y fallas del modelo, el RAG o MCP se devuelven como aviso o tarjeta de error con un código (`MODELO_NO_DISPONIBLE`, `MCP_NO_DISPONIBLE`, `ASISTENTE_NO_DISPONIBLE`), sin trazas, SQL ni PII. Las pendientes se conservan. Hay un solo mensaje en curso por conversación (`409 CHAT_OCUPADO`) y un máximo de 4 rondas de herramientas por mensaje.
8. **PII**: se filtra la pregunta antes de guardarla y el texto del asistente antes de mostrarlo, con el mismo filtro del RAG. Las herramientas no devuelven DPI ni teléfono.

## Alternativas descartadas

- Orquestar en el navegador o exponer MCP por HTTP: rompe el vínculo de sesión de ADR-020 y expone el modelo.
- Confiar en el clasificador para enrutar: tiene falsos positivos; el modelo decide y la heurística solo orienta y respalda.
- Mostrar el texto del modelo tal cual: podría contener cifras calculadas o redondeadas por el modelo.
- Una herramienta `confirmar_pago` protegida por un texto de confirmación: no es evidencia humana verificable.

## Consecuencias y límites

- Latencia en CPU: un turno con herramientas suma una llamada para decidir y otra para redactar (más el RAG si aplica); los tiempos medidos están en el informe de la fase 6.
- `verificarCifras` controla decimales; un entero (días o conteos) que el modelo escriba no se verifica, pero también aparece en la tarjeta de la herramienta.
- Las sesiones de chat viven en memoria: reiniciar el servidor las pierde, pero no las propuestas guardadas en la base.

## Validación

`tests/chat.test.ts` (19 pruebas deterministas), `web/src/pruebas/chat.test.tsx` (4) y `tests/chat/chat-real.chat.ts` (11 con modelos reales, incluido un recorrido en navegador con aprobación por botón).
