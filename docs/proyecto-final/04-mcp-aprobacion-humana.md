# Fase 4 — Servidor MCP y aprobación humana (E3)

Fecha: 2026-10-15. Base: `7ad45e4` (cierre de la fase 3) en `feat/proyecto-final-asistente-gerencial`.

FASE: 4 — Servidor MCP y aprobación humana (E3).

ESTADO: COMPLETA. El asistente consulta el núcleo por siete herramientas de solo lectura y solo puede dejar propuestas de pago pendientes; ninguna escritura financiera ocurre sin la confirmación humana en la interfaz. No se inició la fase 5.

## Verificación de entrada

- `npm run fase4:preflight` antes de cualquier cambio: código 0. Typecheck de núcleo y web, 315 pruebas generales en 23 archivos, 23 de PostgreSQL en 2 archivos, 10 recorridos e2e y carga de demo verificada. Coincide con la línea base de la fase 3. Evidencia: `evidencia/fase4-preflight.txt`.
- Contenedor `cv-proyecto-final-db` activo; `.env` local sin versionar.
- Entorno: **Node.js v24.19.0**, no 22 LTS como pide `.nvmrc`. Todo pasó con esta versión; conviene repetir `npm run fase4:verificar` con Node 22 antes de grabar.

## Cambios realizados

- **Servidor MCP** (`src/mcp/servidor-mcp.ts`) con el SDK oficial 1.32.1: publica exactamente las ocho entradas de `herramientasFinales`. El esquema de entrada es el JSON Schema del mismo Zod de `operacionesFinales` (estricto, `additionalProperties: false`); `fechaCorte` es opcional y la sesión aporta su valor por defecto, que la respuesta muestra. Anotaciones `readOnlyHint` en las siete consultas. Los errores son los problemas RFC 9457 de `presentarProblemaFinal`.
- **Contexto fijado por el backend**: sujeto `ASISTENTE-MCP`, canal `MCP`, la sesión y el perfil vinculados al crear el servidor. Ningún argumento puede cambiarlos.
- **Proceso stdio** (`src/mcp/principal.ts`) que no arranca sin `CV_MCP_SESION_ID`; stdout solo protocolo, diagnósticos a stderr. **Conector del backend** (`src/api/conector-mcp.ts`) que lanza un proceso hijo por sesión de chat (lo usará la fase 6).
- **Fábrica única** `crearCasosPg` (`src/persistencia/casos-pg.ts`), usada por la API y por MCP.
- **Auditoría**: migración 002 aditiva (`canal_proponente` en propuestas; `proponente`, `canal_proponente`, `clave_idempotencia` y el tipo `PROPUESTA` en auditoría). `migrar` aplica una lista versionada por SHA-256 sin tocar la 001. `proponerPago` acepta solo los canales `INTERFAZ` y `MCP` y registra el evento `PROPUESTA`; la confirmación, el reintento y la cancelación copian proponente, canal y clave junto con quien aprueba.
- **Documentación**: ADR-020, `src/mcp/README.md`, sección de la fase 4 en el README y este informe. Nuevos comandos: `npm run mcp`, `npm run test:mcp`, `npm run fase4:verificar` y `npm run fase5:preflight`; `npm run api` aplica migraciones antes de arrancar.

## Archivos

| Ruta | Propósito |
| --- | --- |
| `src/mcp/servidor-mcp.ts` | Servidor MCP: herramientas, contexto vinculado, errores |
| `src/mcp/principal.ts` | Proceso hijo stdio |
| `src/api/conector-mcp.ts` | Lanzamiento del proceso MCP ligado a una sesión de interfaz |
| `src/persistencia/casos-pg.ts` | Fábrica común de casos de uso (API y MCP) |
| `src/persistencia/migraciones/002-auditoria-propuestas.sql`, `src/persistencia/postgres.ts` | Migración 002 y migraciones versionadas |
| `src/aplicacion/servicios-final.ts`, `puertos-final.ts`, `src/persistencia/repositorio-final-pg.ts` | Proponente, canal y clave en propuestas y auditoría |
| `tests/mcp.test.ts` | 20 pruebas con cliente MCP real en memoria (dentro de `npm test`) |
| `tests/integracion/mcp-aprobacion.integration.ts` | 5 pruebas sobre PostgreSQL real con la misma instancia que la API |
| `tests/integracion/mcp-stdio.integration.ts` | 2 pruebas con el proceso hijo real por stdio |
| `docs/adr/ADR-020-mcp-vinculo-sesion-auditoria.md` | Decisiones de la fase |
| `docs/proyecto-final/evidencia/fase4-*.txt` | Control previo, control final e integridad |
| `README.md`, `src/mcp/README.md`, `package.json`, `package-lock.json` | Arranque, herramientas y dependencias |

## Comandos y resultados

| Comando | Resultado verificable |
| --- | --- |
| `npm run fase4:preflight` (entrada) | Código 0; 315 + 23 + 10 pruebas (`evidencia/fase4-preflight.txt`) |
| `npm run db:migrate` (base de demo) | `Migraciones verificadas y aplicadas.`; migraciones 1 y 2; los 226 pagos canónicos intactos |
| `node dist/src/mcp/principal.js` sin sesión vinculada | Código 1, mensaje en stderr, 0 bytes en stdout |
| `npm run fase4:verificar` | Código 0. Typecheck; 335 pruebas en 24 archivos; 30 de PostgreSQL en 4 archivos; build de web; 10 recorridos e2e; carga de demo verificada (`evidencia/fase4-verificacion-final.txt`) |
| `sha256sum` y `git diff --stat 7ad45e4` de insumos, dominio, migración 001 y pruebas existentes | Hashes iguales a los del maestro; sin cambios (`evidencia/fase4-integridad-insumos.txt`) |

## Pruebas

**375 aprobadas, 0 fallidas y 0 omitidas**: 335 generales (las 315 previas sin modificar y 20 de MCP), 30 de PostgreSQL (las 23 previas, 5 de MCP con aprobación y 2 de stdio) y 10 recorridos de navegador.

| Prueba mínima del prompt | Evidencia |
| --- | --- |
| Lista de herramientas = `herramientasFinales`, sin confirmar, cancelar, alta, originación, aprobación, desembolso ni cierre | `mcp.test.ts` (en memoria) y `mcp-stdio.integration.ts` (proceso real) |
| Cada consulta = caso de uso y = API (G-1 a G-7) | `mcp.test.ts` compara 10 llamadas con el caso de uso; `mcp-aprobacion.integration.ts`, las mismas 10 con la respuesta HTTP |
| `proponer_pago` crea `PENDIENTE` sin efecto financiero | Conteo de pagos y respuesta de `consultarCredito` (incluida la versión) idénticos antes y después |
| Argumentos con `sujetoId`, `sesionId`, `perfil` o `aprobado: true` | `ENTRADA_INVALIDA` por esquema estricto |
| Confirmación solo por interfaz, con evento humano, en la sesión vinculada | Otra sesión → `SESION_NO_AUTORIZADA`; sin evento → `APROBACION_REQUERIDA`; sesión vinculada con evento → 201; reintento con la misma clave → 200 `Idempotency-Replayed: true` |
| Errores uniformes sin SQL, trazas ni PII | `MONTO_NO_EXACTO` (con `montoCorrecto` igual a `calcular_deuda_cuota`), `CREDITO_INCOBRABLE`, `CUOTA_YA_PAGADA`, `FECHA_INVALIDA`, `CONFLICTO_IDEMPOTENCIA`, `CREDITO_NO_EXISTE`, `PERIODO_INVALIDO` y un error interno sin filtrar su mensaje |
| Auditoría: proponente MCP, aprobador humano, fecha, resultado y clave | Eventos `PROPUESTA/PENDIENTE` (ASISTENTE-MCP) y `PAGO/CONFIRMADA` (ASESOR-DEMO) con proponente, canal `MCP`, fecha `2026-10-31` y clave |
| Reloj falseado | Las respuestas de las herramientas no cambian |
| Concurrencia | Dos confirmaciones simultáneas de la misma propuesta: una 201 y una 200 con el mismo pago, un solo efecto; la propuesta rival queda `PROPUESTA_OBSOLETA` |
| Límites | `src/mcp` no importa Express, sesiones ni `pg`; solo `principal.ts` compone la persistencia |

## Decisiones

- **Servidor de bajo nivel del SDK** (`Server` con `tools/list` y `tools/call`) en lugar de `McpServer.registerTool`: así se publica tal cual el JSON Schema del Zod compartido y se valida con el mismo esquema que la API, sin una segunda definición.
- **Vínculo por proceso hijo y variables fijadas por el backend** (ADR-020). Descartado: sesión como argumento o en `_meta` enviada por el modelo.
- **Auditoría con migración aditiva 002** en lugar de inferir el proponente con joins. Descartado modificar la 001: su huella está aplicada en la base de demo.
- **Dependencia nueva**: `@modelcontextprotocol/sdk@1.32.1` (exigida por el stack contractual; admite Zod 4). Ninguna otra.

## Errores encontrados y resolución

No hubo fallos en la implementación ni en las pruebas nuevas. Solo un ajuste de diseño antes de probar: la fábrica de casos de uso se movió a `src/persistencia/casos-pg.ts` para que el proceso MCP no cargue Express. No quedan errores activos.

## Riesgos o bloqueos

- Node v24 en esta máquina en lugar de 22 LTS (ver Verificación de entrada).
- Hasta la fase 6 no existe chat que use `conectarMcpSesion`; el vínculo está implementado y probado, pero falta conectarlo a la conversación.
- `timestamp` de los problemas usa el reloj como metadato técnico; no interviene en ninguna cifra.
- Un proceso MCP por sesión abre su propio pool (máximo 5 conexiones); suficiente para la demo local.
- La resistencia a instrucciones incrustadas (OP-7) depende del RAG y del chat (fases 5 y 6). Por ahora la garantía es estructural: no existe ninguna herramienta que confirme pagos.

## Pendiente para la siguiente fase

- Fase 5: RAG sobre los siete documentos de `corpus/` con `bge-m3` y pgvector (tablas `documentos`, `fragmentos` y `vectores` de la migración 001), citación y defensa ante instrucciones incrustadas. Requiere Ollama con los modelos de ADR-008. Antes de iniciarla: `npm run fase5:preflight`.
- Antes de grabar: `npm run db:reset` y `npm run carga` en la base de demo (aplica las migraciones 001 y 002).

## Git

- Rama: `feat/proyecto-final-asistente-gerencial`.
- Base: `7ad45e4`.
- Commit de cierre: consultar `git log -1 --oneline -- docs/proyecto-final/04-mcp-aprobacion-humana.md`.
- Push: no realizado.
