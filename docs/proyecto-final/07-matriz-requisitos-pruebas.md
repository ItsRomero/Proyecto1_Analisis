# Matriz requisito → prueba → evidencia (fase 7)

Cada fila indica dónde se prueba el requisito (archivo y nombre de la prueba), el comando que la ejecuta y la evidencia versionada. Los comandos son estos:

| Comando | Qué ejecuta | Requiere |
| --- | --- | --- |
| `npm test` (dentro de `npm run verify`) | Núcleo P1/P2, carga en memoria, API en proceso, MCP, RAG y chat con dobles, interfaz (jsdom), evals deterministas, oráculo, seguridad e integridad | Nada: sin red, sin Ollama, sin base |
| `npm run test:carga:postgres` | `tests/integracion/*.integration.ts` | PostgreSQL de prueba (`TEST_DATABASE_URL`) |
| `npm run test:e2e` | `tests/e2e/recorridos.e2e.ts` (Chrome del sistema) | PostgreSQL de prueba y Chrome |
| `npm run test:rag` | `tests/rag/rag-real.rag.ts` | PostgreSQL de prueba y Ollama (`bge-m3`, `qwen3:8b`) |
| `npm run test:chat` | `tests/chat/chat-real.chat.ts` | PostgreSQL de prueba, Ollama y Chrome |
| `npm run evals` | `tests/evals/evals-reales.eval.ts` | PostgreSQL de prueba y Ollama |
| `npm run fase7:verificar` (= `fase8:preflight`) | Todo lo anterior en cadena, con parada al primer fallo | Todo lo anterior |

Abreviaturas de evidencia: `ev/` = `docs/proyecto-final/evidencia/`, `evals/` = `docs/proyecto-final/evals/`.

## P1 y P2 heredados

| Requisito | Prueba | Comando | Evidencia |
| --- | --- | --- | --- |
| Suite P1 (dinero, amortización francesa, prelación, idempotencia, estados del crédito, invariantes) | `tests/dinero.test.ts`, `plan-amortizacion.test.ts`, `prelacion-pago.test.ts`, `pago-idempotencia.test.ts`, `credito-estado.test.ts`, `invariantes.test.ts`, `calculadora-mora.test.ts`, `cartera.test.ts`, `regresion-p1.test.ts` | `npm test` | `ev/fase7-verificacion-node22.txt` y `ev/fase7-preflight.txt` |
| Suite P2 (CP-01 a CP-04: mora escalonada, gasto idempotente, políticas por fecha, cancelación desde mora, suspenso, cartera por tramo) | `politica-mora.test.ts`, `gasto-gestion-cobro.test.ts`, `contrato-politica.test.ts`, `credito-cancelacion-p2.test.ts`, `devengo-interes.test.ts`, `cartera-por-tramo.test.ts`, `contratos-p2.test.ts` | `npm test` | Ídem |
| Las heredadas no se modificaron | `git diff 70def7e -- tests web/src/pruebas` solo muestra `tests/chat/chat-real.chat.ts`. Su preparación se movió a `tests/apoyo/entorno-chat-real.ts` para compartirla con las evals reales, y sus 11 aserciones no cambiaron. La fase 7 agrega `tests/evals/`, `tests/apoyo/` y la integración del oráculo | `git diff` | Commit de fase 7 |
| Dominio independiente de capas y frameworks | `fase1-arquitectura-contratos.test.ts` › "mantiene dominio independiente de otras capas y frameworks"; `servicios-final.test.ts` › "la aplicación no depende de transporte, persistencia ni interfaz" | `npm test` | Ídem |

## Entregables E1 a E7

| Entregable | Prueba | Comando | Evidencia |
| --- | --- | --- | --- |
| E1 Siete pantallas React contra la API | `web/src/pruebas/interfaz.test.tsx` (11 pruebas); `tests/e2e/recorridos.e2e.ts` (flujos 1 a 3, responsive 320–768 px, sin HTML de `vistas/` ni reglas financieras en el bundle) | `npm test`, `npm run test:e2e` | `ev/capturas/fase3-*.png`, `docs/proyecto-final/03-api-interfaz-react.md` |
| E2 Persistencia y carga canónica | `tests/carga.test.ts` (15 pruebas); `tests/integracion/carga-postgres.integration.ts` (7 pruebas) | `npm test`, `npm run test:carga:postgres` | `ev/fase2-*.txt`, `02-persistencia-carga-canonica.md` |
| E3 MCP con menor privilegio y aprobación humana | `tests/mcp.test.ts` (6); `tests/integracion/mcp-aprobacion.integration.ts` (5); `tests/integracion/mcp-stdio.integration.ts` (2) | `npm test`, `npm run test:carga:postgres` | `ev/fase4-*.txt`, `04-mcp-aprobacion-humana.md` |
| E4 RAG con citación y OP-7 | `tests/rag.test.ts` (12); `tests/rag/rag-real.rag.ts` (6) | `npm test`, `npm run test:rag` | `ev/fase5-*.txt`, `05-rag-citacion-inyeccion.md` |
| E5 Chat gerencial integrado | `tests/chat.test.ts` (19); `web/src/pruebas/chat.test.tsx` (4); `tests/chat/chat-real.chat.ts` (11) | `npm test`, `npm run test:chat` | `ev/fase6-respuestas-chat-real.txt`, `ev/capturas/fase6-chat-*.png` |
| E6 Pruebas, evals y seguridad | `tests/evals/*.test.ts` (deterministas, oráculo, verificador, seguridad); `tests/evals/evals-reales.eval.ts`; `tests/integracion/oraculo-congelado.integration.ts` | `npm test`, `npm run evals`, `npm run test:carga:postgres` | `evals/reporte-*.{md,json}`, `ev/fase7-*.txt`, este documento |
| E7 Documentación, PDF, video y defensa | **Sin prueba automatizada.** Corresponde a la fase 8 | — | Pendiente (fase 8) |

## Operaciones OP-1 a OP-7 (estado de partida: después de la carga, en este orden)

| Caso | Prueba | Comando | Evidencia |
| --- | --- | --- | --- |
| OP-1 prelación, aprobación humana y estado posterior | `api-http.integration.ts` › "OP-1: propuesta con prelación, aprobación humana obligatoria y estado posterior"; `recorridos.e2e.ts` › "flujo 2 — OP-1 …"; `interfaz.test.tsx` › "muestra la prelación antes de confirmar …" | `test:carga:postgres`, `test:e2e`, `npm test` | `ev/capturas/fase3-op1-*.png` |
| OP-2 detalle de mora y pago | `api-http.integration.ts` › "OP-2: detalle de mora de la cuota más antigua y su pago"; `recorridos.e2e.ts` › "OP-2: …" | Ídem | `ev/capturas/fase3-op2-*.png` |
| OP-3 alta sin teléfono, simulación, comité y desembolso | `api-http.integration.ts` › "OP-3: …"; `recorridos.e2e.ts` › "flujo 1 — OP-3 …"; `fase1-arquitectura-contratos.test.ts` › "acepta alta sin teléfono …" | Ídem | `ev/capturas/fase3-op3-*.png` |
| OP-4 reintento con la misma clave | `api-http.integration.ts` › "OP-4: …"; `fase1-idempotencia-http.test.ts` › "crea con 201, repite con 200 sin efectos y rechaza contenido distinto con 409"; `recorridos.e2e.ts` › "OP-4: …" | Ídem | `ev/capturas/fase3-op4-*.png` |
| OP-5 monto no exacto con monto correcto | `api-http.integration.ts` › "OP-5: …"; `mcp-aprobacion.integration.ts` › "rechazos uniformes por MCP …"; `recorridos.e2e.ts` › "OP-5: …" | Ídem | `ev/capturas/fase3-op5-*.png` |
| OP-6 incobrable rechazado | `api-http.integration.ts` › "OP-6: …"; `mcp-aprobacion.integration.ts` › "rechazos uniformes por MCP …"; `recorridos.e2e.ts` › "OP-6: …" | Ídem | `ev/capturas/fase3-op6-*.png` |
| OP-7 inyección rehusada, sin herramientas ni PII | `rag.test.ts` › detector e instrucciones; `chat.test.ts` › "OP-7: el modelo del chat solo ve la respuesta del RAG …"; `evals-deterministas.test.ts` › "OP-7: ruta, herramientas, cifras del núcleo, seguridad"; `rag-real.rag.ts` › "OP-7: …"; `chat-real.chat.ts` › "OP-7: …"; `evals-reales.eval.ts` › "OP-7" | `npm test`, `test:rag`, `test:chat`, `evals` | `ev/fase5-*.txt`, `ev/fase6-respuestas-chat-real.txt`, `evals/reporte-*.md` |

## Consultas G-1 a G-8

Estado de partida declarado en `tests/evals/casos.ts`: las evals deterministas usan `POST_CARGA` y las reales usan `POST_OP1_OP3`. Las expectativas salen del oráculo congelado `tests/evals/oraculo-congelado.json`, cuyo origen está registrado en el propio archivo.

| Caso | Prueba | Comando | Evidencia |
| --- | --- | --- | --- |
| G-1 cartera | `servicios-final.test.ts` › proyección y listados; `oraculo.test.ts`; `evals-deterministas.test.ts` › "G-1 …"; `mcp-aprobacion.integration.ts` › "las siete consultas MCP devuelven lo mismo que la API"; `chat-real.chat.ts` › "G-1 …"; `evals-reales.eval.ts` › "G-1" (oráculo y pantalla) | `npm test`, `test:carga:postgres`, `test:chat`, `evals` | `evals/reporte-*.md`, `ev/fase7-respuestas-evals-real.txt` |
| G-2 cierre mensual | `servicios-final.test.ts` › "cierre mensual de octubre concilia …"; `api-http.integration.ts` › "G-2/G-3 …"; evals y chat real › "G-2" | Ídem | Ídem |
| G-3 cierre diario | `api-http.integration.ts` › "G-2/G-3 …"; `oraculo.test.ts` › "POST_OP1_OP3 es consistente …"; evals y chat real › "G-3" | Ídem | Ídem |
| G-4 Mora 3 | `servicios-final.test.ts` › listados por tramo; `api-http.integration.ts` › "G-1/G-4 …"; evals y chat real › "G-4" | Ídem | Ídem |
| G-5 estado de CV-2026-0030 y mora de su cuota 3 | `servicios-final.test.ts` › "G-5, G-7 y G-8 …"; `oraculo.test.ts` › contra fase 0; evals y chat real › "G-5" | Ídem | Ídem |
| G-6 vencimientos a 7 y 30 días | `servicios-final.test.ts` › "D-7: ventana …"; `api-http.integration.ts` › "G-6 …"; evals y chat real › "G-6" | Ídem | Ídem |
| G-7 mora tramo por tramo de CV-2026-0410 | `servicios-final.test.ts` › "G-5, G-7 y G-8 …"; `chat.test.ts` › "la fecha de corte de la sesión se inyecta salvo que la persona pida otra (G-7)"; evals y chat real › "G-7" | Ídem | Ídem |
| G-8 política citada (POL-2024-01) | `chat.test.ts` › "G-8 por RAG …"; `evals-deterministas.test.ts` › "G-8 …"; `rag-real.rag.ts` › "G-8 …"; evals y chat real › "G-8" | `npm test`, `test:rag`, `test:chat`, `evals` | Ídem |
| Pantalla = chat en G-1 a G-5 | `chat-real.chat.ts` › G-1 a G-5 (`toEqual` con la API); `evals-reales.eval.ts` › comprobación "= pantalla"; `mcp-aprobacion.integration.ts` › "las siete consultas MCP devuelven lo mismo que la API (G-1 a G-7)" | `test:chat`, `evals`, `test:carga:postgres` | `evals/reporte-*.md` |

## Reglas del paquete R-1 a R-7

| Regla | Prueba | Comando | Evidencia |
| --- | --- | --- | --- |
| R-1 un pago, una cuota | `carga.test.ts` › "reproduce conteos exactos y cada pago conserva conceptos", "los dos duplicados no pagan una cuota adicional" | `npm test` | `ev/fase2-*.txt` |
| R-2 vencimientos y fin de mes | `carga.test.ts` › "planes y vencimientos coinciden con reproducción independiente de fase 0"; `servicios-final.test.ts` › "los 75 planes con fechas coinciden … (R-2)"; `oraculo.test.ts` › CV-2026-9001 vence el 2026-11-30 | `npm test` | `ADR-013` |
| R-3 monto exacto | `carga.test.ts` › "detiene monto incorrecto con el seq causante y sin ajustar"; `servicios-final.test.ts` › "deuda exacta …"; OP-5 | `npm test`, `test:carga:postgres` | `ADR-010` |
| R-4 gasto solo POL-2026-10 | `carga.test.ts` › "selecciona política por otorgamiento, inyecta tasas y limita gasto", "gasto inyectado conserva la idempotencia …" | `npm test` | `ADR-011` |
| R-5 incobrables derivados | `carga.test.ts` › "deriva las dos bajas con State y fechas de ADR-009"; `regresion-p1.test.ts` › "invariante 8 …"; `oraculo.test.ts` › 0015 y 0022 | `npm test` | `ADR-009` |
| R-6 reestructurados en riesgo | `carga.test.ts` › "los tres reestructurados al día cuentan en riesgo mediante P2"; `oraculo.test.ts` | `npm test` | — |
| R-7 política por fecha | `carga.test.ts` › "selecciona política por otorgamiento …"; `regresion-p1.test.ts` › "invariante 5 …"; G-7 y G-8 | `npm test` | `ADR-012` |

## Decisiones D-1 a D-9

| Decisión | ADR | Prueba | Comando |
| --- | --- | --- | --- |
| D-1 baja derivada | ADR-009 | `carga.test.ts` › "deriva las dos bajas …"; `servicios-final.test.ts` › "no anticipa una baja posterior al corte", "una baja congela el devengo moratorio …" | `npm test` |
| D-2 monto exacto en el caso de uso | ADR-010 | OP-5 (API, MCP, e2e); `fase1-idempotencia-http.test.ts` › "devuelve monto correcto para monto no exacto …" | `npm test`, `test:carga:postgres` |
| D-3 gasto por política | ADR-011 | `carga.test.ts` › "… limita gasto" | `npm test` |
| D-4 `politicas.json` inyectado | ADR-012 | `fase1-arquitectura-contratos.test.ts` › "valida las políticas oficiales …"; `carga.test.ts` › "… inyecta tasas …" | `npm test` |
| D-5 fin de mes | ADR-013 | R-2 y OP-3 | `npm test`, `test:carga:postgres` |
| D-6 comité dentro de OP-3 | ADR-014 | `api-http.integration.ts` › "OP-3 … comité por perfil gerencia …"; `recorridos.e2e.ts` › "flujo 1 — OP-3 …" | `test:carga:postgres`, `test:e2e` |
| D-7 ventana `(corte, corte + N]` | ADR-015 | `servicios-final.test.ts` › "D-7: …"; `api-http.integration.ts` › "G-6 …" | `npm test` |
| D-8 contenido del cierre | ADR-016 | `servicios-final.test.ts` › "cierre mensual …"; `api-http.integration.ts` › "G-2/G-3 …" | `npm test`, `test:carga:postgres` |
| D-9 TTL de `Idempotency-Key` | ADR-017 | `openapi.test.ts` › "exige Idempotency-Key y documenta creación, replay y conflicto del pago" | `npm test` |

## Comprobaciones transversales del maestro

| Comprobación | Prueba | Comando |
| --- | --- | --- |
| Aprobación humana (solo botón, evento humano de un solo uso) | `evals-deterministas.test.ts` › "aprobación humana …"; `chat.test.ts` › "proponer_pago deja una propuesta pendiente; «sí, apruébalo» no aprueba …"; `chat.test.tsx` › "una propuesta solo se aprueba con el botón …"; `api-http.integration.ts` › "un evento humano es de un solo uso …"; `mcp-aprobacion.integration.ts` › "solo la sesión vinculada …"; `chat-real.chat.ts` › "e2e en navegador …" | `npm test`, `test:carga:postgres`, `test:chat` |
| Menor privilegio (sin escritura salvo `proponer_pago`, sin confirmación por MCP ni chat) | `mcp.test.ts` › "publica exactamente las ocho capacidades …", "no existe herramienta de confirmación …", "el servidor MCP no accede a la base ni a HTTP …"; `chat.test.ts` › "el chat no accede a la base ni a casos de uso …"; `rag.test.ts` › "el RAG no enlaza herramientas …" | `npm test` |
| Monto no exacto, incobrable, cuota ya pagada, clave repetida, fecha inválida | `api-http.integration.ts` › OP-5, OP-6 y "rechaza cuota ya pagada, clave repetida con otro contenido y fecha inválida"; `mcp-aprobacion.integration.ts` › "rechazos uniformes por MCP …"; `fase1-arquitectura-contratos.test.ts` › "rechaza fecha civil inválida %s" | `npm test`, `test:carga:postgres` |
| Independencia del reloj (sistema falseado a noviembre) | `servicios-final.test.ts` › "ninguna cifra cambia con el reloj del sistema falseado"; `mcp.test.ts` › "las respuestas no cambian con el reloj del sistema falseado"; `api-http.integration.ts` › "el reloj del sistema no cambia ninguna cifra al corte explícito"; `carga.test.ts` › "no depende del reloj …" | `npm test`, `test:carga:postgres` |
| Cifras del chat = cifras de la herramienta | `evals-deterministas.test.ts` (catálogo y "una cifra alterada por el modelo no se muestra" en G-1 a G-7); `verificador.test.ts`; `chat.test.ts` › "verificador de cifras …"; `chat-real.chat.ts` › "las cifras del texto del asistente siempre están verificadas …" | `npm test`, `test:chat` |
| Secretos y PII | `seguridad-integridad.test.ts` (`.env`, claves, contraseña de demo, DPI y teléfonos en evidencia, reportes y grabaciones); `rag.test.ts` y `chat.test.ts` › filtros de PII; `api-http.integration.ts` y `servicios-final.test.ts` › "los listados de interfaz no exponen DPI ni teléfono" | `npm test`, `test:carga:postgres` |
| Integridad de insumos (SHA-256 del ZIP y de `eventos.jsonl`; `datos/` y `vistas/` sin cambios) | `seguridad-integridad.test.ts`; `carga.test.ts` › "preflight de entradas y huella oficial", "rechaza huella inválida …"; `carga-postgres.integration.ts` › "huella inválida rechaza el insumo sin alterar la base" | `npm test`, `test:carga:postgres` |

Evidencia de las comprobaciones transversales: `ev/fase7-integridad-insumos.txt` y `ev/fase7-verificacion-node22.txt`.

## Penalizaciones de la sección 4

| Penalización | Defensa automatizada | Comando | Lo que no se automatiza |
| --- | --- | --- | --- |
| Cifra distinta de la del núcleo (−2.0) | Oráculo congelado cruzado con la fase 0 (`oraculo.test.ts`); evals deterministas y reales contra el oráculo; verificador de cifras ampliado | `npm test`, `evals` | Cifras dichas oralmente en el video |
| Operar por SQL o consola en el Bloque 2 (−1.5) | OP-1 a OP-6 solo por HTTP o interfaz (`api-http.integration.ts`, `recorridos.e2e.ts`); `seguridad-integridad.test.ts` y el guion de las evals usan la API | `test:carga:postgres`, `test:e2e` | Que la grabación no muestre consola: control humano en la fase 8 |
| Calcular con la fecha actual (−1.0) | Pruebas de reloj falseado (cuatro archivos) | `npm test`, `test:carga:postgres` | — |
| Alterar la carga canónica o no verificar SHA-256 (−1.0) | `seguridad-integridad.test.ts`; preflight y huella de `carga.test.ts`; `ev/fase7-integridad-insumos.txt` | `npm test` | — |
| Pago sin aprobación o escritura expuesta por defecto (−1.0) | Comprobaciones de aprobación humana y menor privilegio | `npm test`, `test:carga:postgres`, `test:chat` | — |
| Obedecer OP-7 o divulgar DPI o teléfono (−1.0) | OP-7 en cinco niveles; filtros de PII; `seguridad-integridad.test.ts` | `npm test`, `test:rag`, `test:chat`, `evals` | — |
| Tablero y asistente con cifras distintas (−1.0) | Pantalla = chat en G-1 a G-5 (`chat-real.chat.ts`, `evals-reales.eval.ts`) | `test:chat`, `evals` | — |
| Editar un bloque o mostrar cifras sin origen visible (−1.0) | `chat.test.tsx` › "muestra el origen y el corte de cada cifra …"; tarjetas del núcleo con operación y corte | `npm test` | Que el video sea una toma continua sin edición: **no automatizable** |
| Video ilegible (−4.0) | **Sin prueba automatizada** | — | Revisión humana del video (fase 8) |
