# Fase 3 — API e interfaz React de siete pantallas (E1)

Fecha: 2026-10-14. Base: `b079945` (cierre de la fase 2) en `feat/proyecto-final-asistente-gerencial`.

FASE: 3 — API e interfaz React de siete pantallas (E1).

ESTADO: COMPLETA. Los tres flujos obligatorios se recorrieron completos en un navegador real contra la API Express y PostgreSQL, sobre una base recién reiniciada y cargada, ensayando OP-1 a OP-6 en orden. No se inició la fase 4.

## Verificación de entrada

- Clon nuevo: se creó el contenedor `cv-proyecto-final-db` con la imagen `pgvector/pgvector` fijada por digest en el README, la base `credito_vecino_fase2_test` y `.env` desde `.env.example` (no versionado).
- `npm ci`, `npm run carga` (huella verificada; 60 / 75 / 6 / 363 eventos / 228 pagos importados / 226 aplicados) y `npm run fase3:preflight` correctos: typecheck, 292 pruebas generales en 21 archivos y 7 de PostgreSQL. La línea base documentada por la fase 2 se confirmó.
- Entorno: **Node.js v24.19.0**, no 22 LTS como pide `.nvmrc`. Todo pasó con esta versión; antes de grabar el video conviene repetir `npm run fase3:verificar` con Node 22.

## Cambios realizados

- **Servicios de aplicación** (`src/aplicacion/servicios-final.ts`): implementan las operaciones de `CasosUsoFinal` sobre hechos persistidos y el núcleo: `simularPlanConVencimientos`, `CatalogoPoliticasCanonicas` (D-4), `consultarMora` (con política inyectada opcional, retrocompatible), `calcularCarteraPorTramo` y `presentarCartera`, `RegistrarPago` + `ProcesadorPrelacionPago` y la máquina State `Credito`. Ninguna fórmula nueva.
- **Proyección al corte** (`proyeccion-credito.ts`): reconstruye el estado con State a cualquier `fechaCorte` sin anticipar bajas (ADR-009) y registra las transiciones de cada pago (`regularizar`, `registrarPagoParcial`, `liquidarConPago`).
- **Puertos de hechos** (`puertos-final.ts`) y **adaptador `pg`** (`repositorio-final-pg.ts`): fechas como texto civil, centavos BIGINT → BigInt, sin sumas ni cálculos en SQL. Escrituras en una transacción con el bloqueo consultivo de ADR-018 y `SELECT … FOR UPDATE` del crédito.
- **Contratos** (`src/contratos/`): cinco lecturas de interfaz y `rechazarCredito` en el registro único; seis códigos de problema nuevos; `objetivoEventoHumano` compartido por API e interfaz. OpenAPI regenerado (23 operaciones, 8 capacidades MCP sin cambios).
- **API Express 5** (`src/api/`): una ruta por entrada de `rutasFinales`, sesión de demostración en servidor, evento humano de un solo uso para escrituras, `Idempotency-Key` en la confirmación (201 / 200 + `Idempotency-Replayed` / 409), control de origen, problem+json con mensajes en español y servicio estático de `web/dist`.
- **Interfaz** (`web/`): React 19 + Vite 7 + Tailwind v4, TypeScript estricto con las banderas del núcleo. Siete pantallas obligatorias y complementos, layout móvil del asesor (403 px, Outfit) y web de gerencia (Inter), tokens y recursos del prototipo, validación con los esquemas Zod compartidos, estados de carga/vacío/error/sin conexión, foco visible, etiquetas y regiones accesibles. Selector de perfil y fecha de corte visibles en ambas vistas. `/gerencia/asistente` queda como espacio reservado sin respuestas simuladas.
- **Pruebas**: servicios sin base contrastados con el oráculo independiente de la fase 0, API HTTP sobre PostgreSQL real, componentes en jsdom y recorridos de navegador con capturas.
- **Documentación**: ADR-019, `migracion-vistas-react.md` (56 HTML), README (arranque, comandos, perfiles, tabla pantalla ↔ caso de uso) y `src/api/README.md`.

## Archivos

| Ruta | Propósito |
| --- | --- |
| `src/aplicacion/servicios-final.ts` | Implementación de `CasosUsoFinal` (23 operaciones) |
| `src/aplicacion/proyeccion-credito.ts` | Estado al corte y transiciones de pago con State |
| `src/aplicacion/puertos-final.ts`, `casos-uso-final.ts` | Puertos de hechos y contexto de confirmación con `Idempotency-Key` |
| `src/aplicacion/consultar-mora.ts` | Parámetro opcional `politica` (D-4), sin cambio de fórmula |
| `src/persistencia/repositorio-final-pg.ts` | Lecturas y unidad de trabajo `pg` |
| `src/contratos/proyecto-final.ts`, `rutas-proyecto-final.ts` | Operaciones, rutas, códigos y objetivo del evento humano |
| `src/api/aplicacion-http.ts`, `sesiones.ts`, `servidor-final.ts`, `principal.ts`, `presentar-problema-final.ts` | Servidor HTTP, sesión, arranque y problemas RFC 9457 |
| `docs/api/openapi-proyecto-final.json` | OpenAPI regenerado desde Zod |
| `web/` | Aplicación React (páginas, componentes, cliente API, estilos, recursos de diseño) |
| `tests/servicios-final.test.ts`, `tests/apoyo/hechos-memoria.ts` | 12 pruebas de servicios sin base |
| `tests/integracion/api-http.integration.ts` | 16 pruebas HTTP contra PostgreSQL real |
| `web/src/pruebas/` | 11 pruebas de formato, rutas y componentes en jsdom |
| `tests/e2e/recorridos.e2e.ts`, `vitest.e2e.config.ts` | 10 recorridos en Chrome con capturas y revisión responsive |
| `vitest.config.ts` | Proyectos `nucleo` (Node) y `web` (jsdom) dentro de `npm test` |
| `docs/adr/ADR-019-api-sesion-evento-humano.md` | Decisiones de la fase |
| `docs/proyecto-final/migracion-vistas-react.md` | Inventario y estado de los 56 HTML de `vistas/` |
| `docs/proyecto-final/evidencia/fase3-*.txt`, `evidencia/capturas/fase3-*.png` | Evidencia de comandos, integridad, responsive y capturas reales |
| `README.md`, `src/api/README.md`, `.env.example`, `package.json`, `package-lock.json` | Arranque, comandos y dependencias |

## Comandos y resultados

| Comando | Resultado verificable |
| --- | --- |
| `npm run fase3:preflight` (antes de cambiar nada) | Correcto: typecheck, 292 + 7 pruebas, carga persistente verificada |
| `npm run openapi` | `OpenAPI generado: 23 operaciones y 8 herramientas.` |
| `npm run fase3:verificar` | Código 0. Typecheck de núcleo y web; 315 pruebas en 23 archivos; 23 de PostgreSQL en 2 archivos; build de web; 10 recorridos e2e; carga de demo verificada. Salida completa: `evidencia/fase3-verificacion-final.txt` |
| Revisión responsive (dentro de `test:e2e`) | 24/24 combinaciones (320, 375, 403 y 768 px × 6 pantallas del asesor) sin desplazamiento horizontal de la página: `evidencia/fase3-responsive.txt` |
| `sha256sum` del ZIP y de `eventos.jsonl`; `git status` de `vistas/`, `datos/`, `src/dominio/` y pruebas heredadas | Hashes iguales a los del maestro; sin cambios: `evidencia/fase3-integridad-insumos.txt` |
| `npm run app` (prueba de humo sobre la base de demo, solo lecturas) | `/` y `/asesor/clientes` sirven la SPA (200); `/v1/ruta-inexistente` responde 404 problem+json |

## Pruebas

**348 aprobadas, 0 fallidas y 0 omitidas** en el control final: 315 generales (las 292 previas sin modificar, más 12 de servicios y 11 de interfaz), 23 de PostgreSQL (7 de carga y 16 de API) y 10 recorridos de navegador.

| Requisito | Evidencia automatizada |
| --- | --- |
| Estados de entrada del guion (tabla de situación al corte) | Servicios e HTTP contrastados con `reproduccion.json` de la fase 0 (pagadas, vencidas, días y saldo de 0043, 0035, 0061, 0015, 0030, 0410, incobrables y reestructurados) |
| OP-1 | Prelación visible antes de aprobar; sin evento humano → 403; clave distinta → 409; 201 y estado posterior EN_MORA con la cuota 2 pendiente (HTTP y navegador) |
| OP-2 | Detalle de mora de la cuota 2 (70 días, Mora 3, un tramo plano) y pago de esa cuota; cuota 3 primero → `CUOTA_FUERA_DE_ORDEN` |
| OP-3 | Alta sin teléfono, solicitud, simulación (cuota 1 el 30/11/2026), desembolso sin aprobar → 409, asesor no aprueba → 403, comité con Gerencia en el mismo recorrido, desembolso, plan igual a la simulación, política POL-2026-10 |
| OP-4 | Reenvío de la confirmación con la misma clave: 200, `Idempotency-Replayed: true`, mismo `pagoId`, sin pago ni versión adicional |
| OP-5 | Q500.00 → 422 `MONTO_NO_EXACTO` con `montoCorrecto` igual a `calcularDeudaCuota`; la pantalla lo muestra y ofrece usarlo |
| OP-6 | CV-2026-0015 → 409 `CREDITO_INCOBRABLE` |
| Cuota ya pagada, clave repetida con otro contenido, fecha inválida, propuesta obsoleta, de otra sesión o cancelada | HTTP sobre PostgreSQL |
| G-1 / G-4 | Cartera tras las operaciones = inicial + Q10,000.00 − capital pagado; filas Mora 2/3/Vencido = listas por tramo; el tablero muestra exactamente las cifras de la API |
| G-2 / G-3 | Conceptos del cierre = suma de las aplicaciones de los pagos; cierre diario con 1 desembolso y 2 pagos; generar dos veces devuelve el mismo snapshot (201/200); asesor no genera |
| G-5 / G-7 / G-8 | Tramo plano de 65 días (0030 c3); `mora_1` 30 d + `mora_2` 15 d (0410 c2 al 24/01/2027); POL-2024-01 para un otorgamiento de agosto |
| D-7 | Ventana `(corte, corte + N]` en sus fronteras |
| Reloj y PII | Reloj del sistema falseado a nov 2026 / nov 2027 sin cambios en ninguna cifra; los listados no contienen DPI ni teléfono |
| Interfaz | Monto exacto prellenado; ninguna confirmación sin "Aprobar pago" → "Confirmar pago"; evento humano y misma clave en confirmación y reenvío; estados de carga, vacío, error, sin conexión; validación Zod antes de enviar; área de gerencia protegida |
| Sin HTML de `vistas/` ni reglas financieras en el frontend | El navegador no pidió ningún `.html` ni nada de `vistas/`; no hubo respuestas 500; el bundle no contiene marcas del núcleo financiero ni secretos |
| Límites de capas | `src/aplicacion` solo importa dominio, contratos, `decimal.js`, `date-fns` y `zod` |

## Decisiones

- **Evento humano verificable** en lugar de confiar en un perfil o un booleano del cliente (ADR-019, punto 3). Descartado: aprobación implícita al simular o un campo `aprobado`.
- **Proyección al corte con State** en lugar de leer la columna `estado`: así se consulta cualquier fecha sin anticipar bajas. Descartado: actualizar estados con un proceso batch.
- **Lecturas de interfaz en el registro único** (no herramientas MCP), sin DPI ni teléfono. Descartado: un segundo contrato solo para la web.
- **Reintento de OP-4 = reenvío de la confirmación** con la misma clave desde el comprobante; una clave usada no abre otra propuesta. Descartado: reutilizar la clave en una propuesta nueva (siempre sería otro contenido → 409).
- **Misma origen** (Vite proxy en desarrollo, Express estático en `app`) en lugar de CORS con credenciales; `VITE_API_BASE_URL=/v1`.
- **Dependencias nuevas** dentro del stack contractual: `express@5`, `react@19`, `react-dom`, `react-router@7` (enrutado), `vite@7`, `@vitejs/plugin-react`, `tailwindcss@4`, `@tailwindcss/vite`; para pruebas `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`, `@testing-library/jest-dom` y `playwright-core` (controla el Chrome instalado sin descargar navegadores). Ningún framework alternativo.
- **Contraste**: Mora 1 y Mora 2 un tono más oscuros que en el prototipo para cumplir 4.5:1 con texto blanco.

## Errores encontrados y resolución

1. Validación de cuerpo vacío clasificada como `FECHA_INVALIDA`: ahora `FECHA_INVALIDA` solo cuando todos los problemas son de campos de fecha; si no, `ENTRADA_INVALIDA`.
2. Al borrar el monto, el prellenado lo restituía (lo detectó una prueba de interfaz): el prellenado ahora ocurre una sola vez.
3. En móvil los importes se partían en dos líneas y la tabla del plan quedaba apretada (visto en las capturas): importes sin salto de línea y tabla con desplazamiento propio.
4. Recorrido gerencial con conteo de filas antes de que la tabla cargara: ahora espera la primera fila.
5. `decimal.js` llega al bundle porque el contrato valida fechas con `FechaCivil` del dominio; las clases y fórmulas financieras no entran (lo verifica el recorrido e2e). Se probó marcar el paquete sin efectos secundarios, no cambió el resultado y se revirtió.

No quedan errores activos en el criterio de salida.

## Riesgos o bloqueos

- Node v24 en esta máquina en lugar de 22 LTS (ver Verificación de entrada).
- El selector de perfil no es autenticación; las sesiones viven en memoria (reiniciar el servidor obliga a recargar la interfaz y rehacer propuestas pendientes).
- Los recorridos e2e requieren Chrome instalado (`E2E_CANAL_NAVEGADOR=msedge` permite usar Edge) y reinician la base `_test`, nunca la de demo.
- La cola sin conexión (ADR-005) no se implementa: el estado "sin señal" solo informa y permite reintentar con la misma clave.
- La vista del cliente (`usuario-*.html`) queda fuera de E1, como permite el maestro.
- No hay video ni ensayo con las cuatro personas integrantes; las capturas son del recorrido automatizado.

## Pendiente para la siguiente fase

- Fase 4: servidor MCP con el SDK de TypeScript sobre los mismos `crearCasosUsoFinal` (las ocho capacidades de `herramientasFinales`), con contexto de canal `MCP`, propuesta sin confirmación y pruebas de menor privilegio y concurrencia. Antes de iniciarla: `npm run fase4:preflight`.
- Antes de grabar el Bloque 2: `npm run db:reset` y `npm run carga` sobre la base de demo, y luego `npm run app`.

## Git

- Rama: `feat/proyecto-final-asistente-gerencial`.
- Base: `b079945`.
- Commit de cierre: consultar `git log -1 --oneline -- docs/proyecto-final/03-api-interfaz-react.md`.
- Push: no realizado.
