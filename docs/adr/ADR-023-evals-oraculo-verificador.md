# ADR-023: Evals en dos niveles, oráculo congelado y verificador de porcentajes

Estado: aceptado. Fecha: 2026-10-15. Complementa ADR-021 (RAG) y ADR-022 (chat).

## Contexto

La fase 7 exige evals deterministas dentro de `npm test` y evals con el modelo real en un comando aparte, con un reporte versionado; expectativas que no se inventan, sino que se congelan con su origen y se cruzan con la reproducción independiente de la fase 0; y que cada caso declare su estado de partida. La fase 6 dejó un límite: el verificador de cifras del chat solo controlaba decimales, así que un porcentaje entero agregado por el modelo, como "(100%)" en G-2, no se detectaba.

## Decisiones

1. **Catálogo único** (`tests/evals/casos.ts`): G-1 a G-8 y OP-7 con pregunta, estado de partida, ruta esperada, herramientas con sus argumentos, clave del oráculo, cita esperada y si tiene pantalla equivalente. Lo usan las evals deterministas, las reales y el congelado del oráculo.
2. **Oráculo congelado** (`tests/evals/oraculo-congelado.json`, producido por `npm run evals:oraculo`): lo calculan los casos de uso del núcleo sobre `TEST_DATABASE_URL` recién cargada, en dos estados: `POST_CARGA` y `POST_OP1_OP3` (OP-1 a OP-3 con `tests/apoyo/guion-op.ts`). Registra comando, commit, fecha, versión de Node y huella del paquete. Se verifica de tres formas:
   - en `npm test`: `POST_CARGA` frente al núcleo en memoria y frente a `reproduccion.json` de la fase 0;
   - en la integración PostgreSQL: los dos estados se reproducen sobre la base real;
   - en las evals reales: las herramientas del chat deben devolver exactamente el estado `POST_OP1_OP3`.
3. **Evals deterministas** (`tests/evals/evals-deterministas.test.ts`, estado `POST_CARGA`): el orquestador real, el MCP real en memoria y el RAG real con un recuperador en memoria. El modelo guionado reproduce las llamadas registradas en la corrida real de la fase 6. Comprueban ruta, igualdad con el oráculo, ocultación de cifras alteradas, aprobación solo por botón, OP-7 y ausencia de PII.
4. **Evals reales** (`npm run evals`, `tests/evals/evals-reales.eval.ts`, estado `POST_OP1_OP3`): reutilizan `tests/apoyo/entorno-chat-real.ts`, el mismo entorno que `test:chat`. Cada caso registra comprobaciones de exactitud y seguridad (aprueban o fallan) y métricas de calidad que no hacen fallar: redacción oculta, aviso y si el texto es idéntico al de la corrida de la fase 6. El reporte versionado queda en `docs/proyecto-final/evals/reporte-<fecha>-<commit>.{json,md}`.
5. **Verificador ampliado**: un porcentaje del texto (entero o decimal, seguido de `%`) debe estar respaldado por un resultado del turno. Una tasa decimal del núcleo (`0.24`) respalda su forma porcentual (24 %), con un desplazamiento de texto y sin punto flotante. Los enteros sin `%` (días, conteos) siguen sin verificarse, porque aparecen legítimamente en la redacción y en las tarjetas.
6. **Seguridad e integridad en `npm test`**: `.env` no versionado; sin claves de API ni contraseñas fuera de los marcadores documentados; sin DPI ni teléfonos de clientes en la evidencia, los reportes ni las grabaciones; hashes del ZIP y de `eventos.jsonl` iguales a los del maestro; `datos/` y `vistas/` sin cambios.

## Alternativas descartadas

- Escribir a mano las cifras esperadas: lo prohíbe el maestro.
- Evaluar con el modelo real dentro de `npm test`: dependería de Ollama y de su variabilidad en cámara.
- Hacer fallar la eval por diferencias de redacción: el texto cambia entre corridas aun con temperatura 0 y semilla. Se mide como calidad y se exige exactitud solo sobre las herramientas y las cifras.

## Consecuencias

- Las respuestas que agreguen un porcentaje sin respaldo ahora se ocultan, y el aviso indica cuál era. La fuente visible sigue siendo la tarjeta del núcleo.
- Si cambia el núcleo o el paquete, el oráculo falla en `npm test` y se vuelve a congelar a conciencia con `npm run evals:oraculo`, dejando un nuevo origen registrado.
