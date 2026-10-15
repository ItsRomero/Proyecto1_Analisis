# Prompt de ejecución — Fase 7

Este prompt corresponde a la fase 7 de `Prompt_Maestro_Proyecto_Final_Por_Fases_v2.md`. Antes de ejecutarlo, lee ese documento y aplica sus reglas globales, el stack contractual, el contrato canónico, las reglas R-1 a R-7, las decisiones D-1 a D-9, los casos OP-1 a OP-7 y G-1 a G-8, y la rúbrica y penalizaciones de la sección 4. Revisa los cierres vigentes de las fases anteriores: `docs/proyecto-final/00-auditoria-linea-base.md`, `01-arquitectura-contratos-integracion.md`, `02-persistencia-carga-canonica.md`, `03-api-interfaz-react.md`, `04-mcp-aprobacion-humana.md`, `05-rag-citacion-inyeccion.md` y `06-chat-gerencial.md`; verifica que se cumplieron sus criterios de salida antes de comenzar. Ejecuta únicamente esta fase y utiliza el formato de informe de la sección 3 del documento maestro. No avances automáticamente a la fase 8.

## Continuidad con la fase 6

- Inspecciona el estado Git antes de editar y conserva el trabajo existente. Continúa en `feat/proyecto-final-asistente-gerencial` si ya contiene las fases 0 a 6 (cierre de fase 6: commit `a83b11a`, sin push); no recrees la rama ni descartes sus commits. Las corridas e2e y de modelos reales regeneran capturas y transcripciones en `docs/proyecto-final/evidencia/`; si aparecen modificadas, revísalas y consérvalas o restáuralas de forma explícita, sin descartar otros cambios.
- Ejecuta `npm run fase7:preflight` antes de cualquier cambio (en PowerShell, `npm.cmd run …` si la política de ejecución bloquea `npm.ps1`). Encadena typecheck de núcleo y web, `npm test`, la integración PostgreSQL, los recorridos e2e, la comprobación de la carga de demo, las pruebas RAG reales y las pruebas del chat real; tarda unos 40 minutos en CPU y se detiene al primer fallo. Línea base esperada: 370 pruebas generales en 27 archivos, 30 de PostgreSQL en 4 archivos, 10 recorridos e2e, 6 pruebas RAG reales y 11 pruebas de chat real. Confirma la línea base real y conserva intactas todas las pruebas existentes.
- Entorno local: contenedores `cv-proyecto-final-db` (PostgreSQL 17 + pgvector, `127.0.0.1:55432`, migraciones 001 a 003, base de demo con carga canónica y corpus ingerido) y `cv-ollama` (Ollama 0.40.4, `qwen3:8b` y `bge-m3` con digests en `evidencia/fase5-modelos.txt`); si están detenidos, `docker start cv-proyecto-final-db cv-ollama`. `.env` desde `.env.example`, nunca versionado. Las fases 3 a 6 se validaron con Node v24.19.0: en esta fase ejecuta el control completo **también con Node.js 22 LTS** conforme a `.nvmrc` (por ejemplo con nvm o fnm) y registra ambas versiones y sus resultados; si no es posible instalar Node 22, registra el bloqueo con evidencia.
- Ya existe gran parte de la suite: `tests/carga.test.ts` y `tests/integracion/carga-postgres.integration.ts` (carga y R-1 a R-7), `tests/servicios-final.test.ts` (servicios frente al oráculo independiente de fase 0 en `evidencia/reproduccion.json`), `tests/integracion/api-http.integration.ts` (OP-1 a OP-6 por HTTP), `tests/mcp.test.ts` e integración MCP/stdio, `tests/rag.test.ts` y `tests/rag/rag-real.rag.ts`, `tests/chat.test.ts`, `web/src/pruebas/` y `tests/chat/chat-real.chat.ts`, y `tests/e2e/recorridos.e2e.ts`. **Reutilízalos y complétalos; no dupliques pruebas** y no modifiques las heredadas para hacerlas pasar. Las nuevas evals viven en `tests/evals/` (Anexo C).
- Evals en dos niveles, como exige el maestro: (1) **deterministas dentro de `npm test`**, sin red, Ollama ni base, con el modelo guionado y los dobles ya existentes (`tests/apoyo/`), para enrutamiento, cifras iguales a las de la herramienta, aprobación humana, OP-7 y ausencia de PII; (2) **con el modelo real en un comando aparte** (`npm run evals`), temperatura 0, que ejecute G-1 a G-8 y OP-7 sobre `TEST_DATABASE_URL` y escriba un **reporte versionado** (por ejemplo `docs/proyecto-final/evals/reporte-<fecha>-<commit>.md` y `.json`) con casos aprobados y fallidos, herramientas usadas, tiempos, modelo y digest. Reutiliza la infraestructura de `tests/chat/chat-real.chat.ts` en lugar de duplicarla, y documenta la variabilidad observada del modelo (la redacción cambia entre corridas aun con temperatura 0 y semilla).
- Cada eval y cada caso OP/G declaran su **estado de partida**: inmediatamente después de la carga, o después de OP-1 a OP-3 (G-1 a G-3 cambian con esas operaciones). No inventes números oráculo: obtén las expectativas del paquete procesado por el núcleo, congélalas en un archivo con su origen (comando, commit, fecha y estado de partida) y crúzalas con la reproducción independiente de la fase 0 donde aplique.
- Cubre explícitamente lo que la fase 6 dejó como límite: el verificador de cifras del chat solo controla decimales (un entero o porcentaje redondo agregado por el modelo, como "(100%)" en G-2, no se detecta). Agrega una eval que mida esos casos sobre las transcripciones reales y documenta el resultado; si decides ampliar el verificador, hazlo con pruebas y sin romper las existentes.
- Verifica y documenta las comprobaciones transversales del maestro: aprobación humana y menor privilegio (sin herramienta de escritura distinta de `proponer_pago`, sin confirmación desde MCP ni chat), monto no exacto, incobrable, cuota ya pagada, clave repetida y fecha inválida; independencia del reloj (sistema falseado a noviembre sin cambios); coincidencia pantalla/chat en G-1 a G-5; ausencia de secretos y de DPI/teléfono en respuestas, bitácoras y repositorio (`.env` excluido); integridad de los insumos canónicos (SHA-256 del ZIP y de `eventos.jsonl` iguales a los del maestro).
- Construye la **matriz requisito → prueba → evidencia** (`docs/proyecto-final/07-matriz-requisitos-pruebas.md`) que cubra P1/P2 heredados, E1 a E7, OP-1 a OP-7, G-1 a G-8, R-1 a R-7, D-1 a D-9 y cada penalización de la sección 4 del maestro, con el archivo y nombre de prueba, el comando y la evidencia. Marca honestamente lo que no tenga prueba automatizada (por ejemplo, el video).
- Documenta en el README los comandos de verificación con sus tiempos medidos y requisitos (`npm run verify` sin red ni modelo; integración, e2e, RAG, chat y evals con sus dependencias), y en `docs/proyecto-final/07-pruebas-evals-seguridad.md` los resultados verificables, con evidencia en `docs/proyecto-final/evidencia/fase7-*.txt`. Agrega `npm run fase8:preflight` equivalente al control de esta fase. Si una decisión lo requiere, regístrala en un ADR nuevo desde ADR-023. No inventes resultados.

# PROMPT 7 - Pruebas, evals, seguridad y regresión (E6)

## Objetivo

Demostrar repetiblemente que la integración no rompió P1/P2 y que el asistente cumple exactitud, seguridad y control humano.

## Acciones obligatorias

1. Conserva y ejecuta intacta la suite heredada (263 pruebas en 18 archivos, o la línea base confirmada en la fase 0).
2. Agrega pruebas unitarias, de integración y, donde aporte valor, end-to-end.
3. `tests/carga.test.ts`: huella, conteos, rollback, idempotencia y reglas R-1 a R-7.
4. `tests/mcp.test.ts`: MCP devuelve lo mismo que el núcleo y la API para las ocho capacidades, y rechaza lo que debe rechazar.
5. `tests/evals/`, en dos niveles:
   - **Deterministas, dentro de `npm test`**: con un modelo simulado o respuestas grabadas, verifican el enrutamiento (MCP, RAG o ambos), que las cifras del chat sean exactamente las de la herramienta, la aprobación humana, el rechazo de OP-7 y la ausencia de PII. No requieren red ni Ollama, para que `npm test` termine sin fallos en cámara.
   - **Con el modelo real, comando aparte** (por ejemplo `npm run evals`): ejecuta G-1 a G-8 y OP-7 contra el LLM configurado, con temperatura 0, y guarda un reporte versionado de casos aprobados y fallidos.
6. Cubre OP-1 a OP-7 y G-1 a G-8. Cada eval declara si su resultado esperado corresponde al estado **inmediatamente después de la carga** o **después de OP-1 a OP-3**, porque G-1 a G-3 cambian con esas operaciones.
7. Verifica aprobación humana, menor privilegio, monto no exacto, incobrable, cuota ya pagada, clave repetida y fecha inválida.
8. Verifica que ningún cálculo dependa del reloj real (por ejemplo, con el reloj del sistema falseado a una fecha de noviembre, los resultados no cambian).
9. Verifica que pantalla y chat coincidan para G-1 a G-5.
10. No inventes números oráculo: obtén las expectativas del paquete procesado por el núcleo, congélalas con su origen (comando, commit y fecha) y crúzalas con la reproducción independiente de la fase 0.
11. Comando único de verificación completa (`npm run verify`: typecheck + `npm test`), documentando tiempos y requisitos.

## Evidencia requerida

- Typecheck sin errores.
- Suite P1/P2 sin regresiones.
- Pruebas nuevas sin fallos ni pruebas omitidas ocultas.
- Reporte de evals con casos aprobados y fallidos.
- Matriz requisito -> prueba -> evidencia.

## Criterio de salida

`npm test` se ejecuta en cámara y termina sin fallos, incluyendo carga, MCP y evals deterministas, sin depender de red ni del LLM.

---
