# Fase 6 — Chat gerencial integrado (E5)

Fecha: 2026-10-15. Base: `cb89526` (prompt de fase 6 y evidencia regenerada; cierre de fase 5 en `8d954df`) en `feat/proyecto-final-asistente-gerencial`.

FASE: 6 — Chat gerencial integrado (E5).

ESTADO: COMPLETA. El chat vive en la aplicación (`/gerencia/asistente`) y orquesta MCP y RAG con `qwen3:8b` real. G-1 a G-8 y OP-7 se responden tras OP-1 a OP-3; las cifras de G-1 a G-5 son idénticas a las de las pantallas. Un pago propuesto en el chat solo se registró al pulsar **Aprobar** en el navegador. No se inició la fase 7.

## Verificación de entrada

- `npm run fase6:preflight` antes de cualquier cambio: código 0 (347 + 30 + 10 + 6 pruebas), igual a la línea base de la fase 5. Evidencia: `evidencia/fase6-preflight.txt`.
- Había capturas e2e y respuestas reales de la fase 5 regeneradas por las corridas del control: claves aleatorias nuevas y variaciones de redacción del modelo, a pesar de la temperatura 0 con semilla. Se conservaron y se commitearon aparte (`cb89526`).
- Contenedores `cv-proyecto-final-db` y `cv-ollama` activos. Entorno: **Node.js v24.19.0**, no 22 LTS como pide `.nvmrc`. El modelo corre en CPU.
- Sonda previa: `qwen3:8b` hace *tool calling* real con los esquemas MCP. La primera llamada tardó 77.8 s (carga del modelo) y la siguiente, 12.8 s (caché del prefijo).

## Cambios realizados

- **Orquestador en el backend** (`src/chat/orquestador.ts`): `SesionChat` por sesión de interfaz y `AlmacenChats`, memoria de 12 turnos y 60 min, ciclo de *tool calling* acotado a 4 rondas, herramienta local `consultar_politicas` (RAG), respaldo de enrutamiento con `clasificarPregunta`, inyección de la fecha de corte de la sesión, clave de idempotencia generada por el servidor, verificación de cifras, filtro de PII y manejo de errores sin perder las propuestas pendientes.
- **Adaptadores** (`src/chat/adaptadores.ts`): `ChatOllama.bindTools` (temperatura 0, `think: false`, `numCtx` 8192), cliente MCP con tiempo límite y RAG de la fase 5. El RAG pasó a `numCtx` 8192 para que Ollama no recargue el modelo entre llamadas.
- **Rutas** `/v1/chat`, `/v1/chat/mensajes`, `/v1/chat/propuestas/{id}/resolucion` y `/v1/chat/reinicio` (`src/chat/rutas-chat.ts`), montadas en la misma API con un punto de extensión. Reiniciar la sesión de interfaz cierra el chat y su proceso MCP. `principal.ts` crea el chat con MCP por stdio (`conectarMcpSesion`) y amplía el tiempo límite HTTP a 15 min.
- **Contrato** `src/contratos/chat.ts` (Zod) compartido por la API y la interfaz.
- **Interfaz** `web/src/chat/`: conversación, contador de espera, sugerencias G-1 a G-8, tarjetas de herramienta con origen, argumentos, fecha de corte y duración, vista genérica de resultados, citas legibles, tarjeta de propuesta con **Aprobar** y **Cancelar**, y reinicio que cancela antes las pendientes. Se agregó un botón persistente **Asistente** en el layout de gerencia.
- **Documentación**: ADR-022, `web/src/chat/README.md`, sección de la fase 6 en el README y este informe. Comandos: `test:chat`, `fase6:verificar` y `fase7:preflight`.

## Archivos

| Ruta | Propósito |
| --- | --- |
| `src/chat/orquestador.ts`, `cifras.ts`, `puertos.ts`, `adaptadores.ts`, `rutas-chat.ts` | Orquestación, verificación de cifras, puertos, modelo/MCP/RAG y rutas |
| `src/contratos/chat.ts` | Contrato del chat |
| `src/api/aplicacion-http.ts`, `servidor-final.ts`, `principal.ts` | Extensión de rutas, almacén de chats y arranque |
| `src/rag/ollama.ts` | `numCtx` 8192 en el modelo del RAG |
| `web/src/chat/Chat.tsx`, `Tarjetas.tsx`, `api.ts`, `README.md` | Interfaz del chat |
| `web/src/App.tsx`, `componentes/Layouts.tsx`, `api/cliente.ts`, `paginas/gerencia/Operaciones.tsx` | Ruta, acceso persistente, `http` exportado y retiro del marcador de posición |
| `tests/chat.test.ts`, `tests/apoyo/chat-dobles.ts` | 19 pruebas deterministas (modelo guionado, MCP real en memoria) |
| `web/src/pruebas/chat.test.tsx` | 4 pruebas de la interfaz del chat |
| `tests/chat/chat-real.chat.ts`, `vitest.chat.config.ts` | 11 pruebas con modelos reales, incluido el recorrido en navegador |
| `docs/adr/ADR-022-chat-orquestacion.md` | Decisiones |
| `docs/proyecto-final/evidencia/fase6-*.txt`, `capturas/fase6-*.png` | Control previo, transcripción real sin editar, control final, integridad y capturas |

## Comandos y resultados

| Comando | Resultado verificable |
| --- | --- |
| `npm run fase6:verificar` | Código 0: typecheck; 370 pruebas en 27 archivos; 30 de PostgreSQL; 10 e2e; carga de demo verificada; 6 RAG reales; 11 de chat real en 1556 s (`evidencia/fase6-verificacion-final.txt`) |
| `npm run api` (prueba de humo) | `GET /v1/chat` con sesión → estado vacío; sin sesión → 403; cuerpo inválido → 400; otra origen → 403 |
| Integridad | Hashes del ZIP y de `eventos.jsonl` iguales; sin cambios en insumos, dominio, migraciones ni pruebas existentes; base de demo con 226 pagos y 32 vectores (`evidencia/fase6-integridad-insumos.txt`) |

## Pruebas

**426 aprobadas, 0 fallidas y 0 omitidas**: 370 generales (las 347 previas sin modificar, 19 del orquestador y 4 de la interfaz del chat), 30 de PostgreSQL, 10 e2e, 6 RAG reales y 11 de chat real.

Con modelos reales, sobre la base de prueba tras OP-1 a OP-3 (transcripción completa sin editar en `evidencia/fase6-respuestas-chat-real.txt`):

| Caso | Herramienta y verificación | Tiempo |
| --- | --- | ---: |
| G-1 | `consultar_cartera` (`inicioPeriodo` 2026-10-01), idéntica a `/v1/cartera` | 182.9 s |
| G-2 | `consultar_cierre` MENSUAL, idéntica a la pantalla ("44 pagos" por Q37,404.42) | 205.4 s |
| G-3 | `consultar_cierre` DIARIO, idéntica (1 desembolso, 2 pagos) | 201.1 s |
| G-4 | `listar_creditos_mora` MORA_3, idéntica | 78.3 s |
| G-5 | `consultar_credito` + `explicar_mora` cuota 3, idénticas ("tasa 0.24 (24 % anual)", Q7.11) | 153.1 s |
| G-6 | `proximos_vencimientos` 7 y 30 días, idénticas | 153.0 s |
| G-7 | `explicar_mora` al 2027-01-24, idéntica: `mora_1` 30 d a 0.18 → 10.8864; `mora_2` 15 d a 0.24 → 7.2576; total Q18.14 | 136.0 s |
| G-8 | RAG con cita `[POL-2024-01 §Regla de cálculo]` | 159.5 s |
| OP-7 | RAG: resume la nota con cita y avisa que ignoró las instrucciones; sin `proponer_pago`, sin el marcador de la nota, sin PII; pagos y propuestas sin cambios | 117.9 s |
| Navegador | "Propón el pago… de CV-2026-0061" → propuesta con prelación; 0 pagos nuevos hasta pulsar **Aprobar**; luego +1 pago y auditoría `ASISTENTE-MCP`/`MCP` → `GERENCIA-DEMO` | — |

Todas las respuestas reales quedaron con las cifras verificadas contra las herramientas.

Las pruebas deterministas cubren:
- el enrutamiento MCP, RAG y mixto, y el respaldo al RAG;
- las cifras idénticas al caso de uso y la ocultación de cifras ajenas con su detalle;
- la fecha de corte inyectada o pedida;
- la propuesta pendiente: "sí, apruébalo" no aprueba y no existe herramienta de confirmación;
- el reinicio bloqueado mientras haya pendientes y la nota de resolución en la memoria;
- el aislamiento de sesiones, el límite de turnos, el TTL que conserva pendientes y un mensaje a la vez;
- los timeouts del modelo y las fallas de MCP sin trazas ni SQL;
- el filtro de PII;
- OP-7, donde el modelo del chat nunca recibe el texto incrustado de la nota;
- el límite de rondas;
- los límites del módulo (sin base de datos ni dominio).

Las pruebas de interfaz verifican el origen y el corte visibles, las citas, la aprobación solo por botón con evento humano e `Idempotency-Key`, el reinicio que cancela antes y que un error no pierde el mensaje escrito.

## Decisiones

- **Orquestación en el servidor** con *tool calling* del modelo y la heurística como orientación y respaldo (ADR-022). Descartados: orquestar en el navegador y enrutar solo con el clasificador.
- **Cifras verificadas**: el texto del modelo se oculta si trae decimales ausentes de los resultados del turno. La fuente visible de las cifras son las tarjetas del núcleo.
- **El modelo del chat no ve el corpus**: recibe la respuesta citada del RAG.
- **Clave de idempotencia del servidor** en cada propuesta, en lugar de la que escribía el modelo (en la primera corrida usó `pago_cuota_1_CV-2026-0061`).
- **Reinicio solo sin pendientes**: la interfaz las cancela con evento humano antes de reiniciar.
- Sin dependencias nuevas (se reutilizaron LangChain, el SDK MCP y playwright-core).

## Errores encontrados y resolución

1. Una prueba de reinicio cerraba el cliente MCP compartido por las demás pruebas: el doble ya no cierra el cliente base. El código cerraba correctamente el MCP de la sesión.
2. Una prueba de PII estaba mal diseñada (el respaldo al RAG reemplazaba el texto); se ajustó el caso.
3. Si la conversación se volvía a renderizar, la tarjeta de propuesta perdía su estado local ("Pago aplicado"). El resultado se guarda ahora en el chat.
4. En la primera corrida real, el modelo escribió "0.24 % por día" (G-5) y "44 créditos" (G-2), y su redacción de G-7 se ocultó por redondear. Se agregaron reglas al sistema (tasas anuales en decimal, cantidades con su unidad, no redondear) y el aviso ahora indica qué cifras no tenían respaldo. En la segunda corrida, G-5, G-2 y G-7 salieron correctas y verificadas.
5. El modelo elegía la clave de idempotencia; ahora la genera el servidor.

No quedan errores activos en el criterio de salida.

## Riesgos o bloqueos

- **Latencia en CPU:** de 78 a 205 s por turno con herramientas (2 o 3 llamadas al modelo). Para el video conviene precargar el modelo con una consulta previa y avisar de la espera, o usar GPU nativa.
- El verificador controla decimales; un entero o un porcentaje redondo que agregue el modelo no se verifica (por ejemplo, "(100%)" junto a la cartera activa en G-2). Las tarjetas muestran siempre las cifras del núcleo.
- La redacción del modelo varía entre corridas incluso con temperatura 0 y semilla. Las aserciones reales se basan en las herramientas y las cifras, no en el texto.
- Las conversaciones viven en memoria: reiniciar el servidor las pierde (no las propuestas guardadas en la base).
- Node v24 en lugar de 22 LTS.

## Pendiente para la siguiente fase

- Fase 7: matriz requisito → prueba → evidencia, evals versionadas G-1 a G-8 y OP-7 con estado de partida declarado, reporte de casos aprobados y fallidos, y comprobación de reloj, menor privilegio y coincidencia pantalla/chat. Antes de iniciarla: `npm run fase7:preflight`.
- Antes de grabar: `npm run db:reset`, `npm run carga` y `npm run rag:ingesta` en la base de demo, y una consulta previa al chat para cargar el modelo.

## Git

- Rama: `feat/proyecto-final-asistente-gerencial`.
- Base: `cb89526`.
- Commit de cierre: consultar `git log -1 --oneline -- docs/proyecto-final/06-chat-gerencial.md`.
- Push: no realizado.
