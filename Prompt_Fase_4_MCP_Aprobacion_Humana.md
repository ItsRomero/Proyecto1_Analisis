# Prompt de ejecución — Fase 4

Este prompt corresponde a la fase 4 de `Prompt_Maestro_Proyecto_Final_Por_Fases_v2.md`. Antes de ejecutarlo, lee ese documento y aplica sus reglas globales, el stack contractual, el contrato canónico, las reglas R-1 a R-7, las decisiones D-1 a D-9 y los casos OP-1 a OP-7 y G-1 a G-8. Revisa los cierres vigentes de las fases anteriores: `docs/proyecto-final/00-auditoria-linea-base.md`, `01-arquitectura-contratos-integracion.md`, `02-persistencia-carga-canonica.md` y `03-api-interfaz-react.md`; verifica que se cumplieron sus criterios de salida antes de comenzar. Ejecuta únicamente esta fase y utiliza el formato de informe de la sección 3 del documento maestro. No avances automáticamente a la fase 5.

## Continuidad con la fase 3

- Inspecciona el estado Git antes de editar y conserva el trabajo existente. Continúa en `feat/proyecto-final-asistente-gerencial` si ya contiene las fases 0 a 3 (cierre de fase 3: commit `7ad45e4`, sin push); no recrees la rama ni descartes sus commits.
- Ejecuta `npm run fase4:preflight` antes de cualquier cambio. Encadena typecheck de núcleo y web, `npm test`, la integración PostgreSQL, los recorridos e2e en navegador y la comprobación de la carga de demo; se detiene al primer fallo. Un fallo exige resolver la causa y repetir el control; no autoriza avanzar. Línea base esperada: 315 pruebas generales en 23 archivos, 23 de PostgreSQL en 2 archivos y 10 recorridos e2e. Confirma la línea base real y conserva intactas todas las pruebas existentes.
- Entorno local: PostgreSQL 17 + pgvector en el contenedor `cv-proyecto-final-db` (puerto `127.0.0.1:55432`, bases `credito_vecino` y `credito_vecino_fase2_test`); si existe, `docker start cv-proyecto-final-db`; si no, créalo con los comandos del README. `.env` se crea desde `.env.example` y nunca se versiona. Los recorridos e2e requieren Chrome instalado (`E2E_CANAL_NAVEGADOR=msedge` permite Edge). La fase 3 se validó con Node v24.19.0; usa Node.js 22 LTS conforme a `.nvmrc` y registra en el informe la versión real.
- Ya existen y deben reutilizarse: `crearCasosUsoFinal` en `src/aplicacion/servicios-final.ts` (la misma instancia de casos de uso que usa la API), las ocho capacidades de `herramientasFinales` en `src/contratos/rutas-proyecto-final.ts` (siete consultas + `proponer_pago`; `confirmarPago` excluido), los esquemas de `operacionesFinales`, `ContextoOperacion` con `canal: "MCP"` en `src/aplicacion/casos-uso-final.ts`, la sesión y el evento humano de un solo uso de `src/api/sesiones.ts`, y la semántica de propuesta/confirmación de ADR-010, ADR-017 y ADR-019. No dupliques cálculos ni esquemas dentro de `src/mcp/`.
- Respeta ADR-007: SDK de MCP para TypeScript con transporte `stdio`, proceso hijo del backend; stdout reservado al protocolo y logs técnicos a stderr sin PII. Si una limitación comprobable exige otro transporte, documenta un ADR nuevo (desde ADR-020) antes de introducirlo.
- El contexto de cada llamada MCP (`sujetoId`, `sesionId`, `perfil`, `canal: "MCP"`, `traceId`) lo fija el backend que lanza o conecta el proceso MCP, nunca los argumentos de la herramienta. Una propuesta creada por MCP debe quedar ligada a la sesión de interfaz que la confirmará: diseña y documenta ese vínculo (fase 6 integrará el chat en la misma aplicación) sin permitir que el modelo elija sesión, perfil ni evidencia. El proponente (MCP) y quien aprueba (persona en la interfaz) deben quedar diferenciados en la auditoría.
- La confirmación sigue existiendo solo por la API de interfaz (`POST /v1/propuestas-pago/{propuestaId}/confirmacion` con evento humano e `Idempotency-Key`). El proceso MCP no tiene acceso a la cookie de sesión ni a `POST /v1/sesion/eventos-humanos`, ni acceso directo a la base distinto de los casos de uso.
- `tests/mcp.test.ts` debe correr dentro de `npm test` sin red ni base: usa un cliente MCP real del SDK conectado en memoria y los hechos de `tests/apoyo/hechos-memoria.ts` para comparar cada consulta con el caso de uso. Las pruebas que crean propuestas o confirman pagos usan `TEST_DATABASE_URL` en `tests/integracion/`, nunca la base de demo. Las dependencias nuevas se justifican en el informe.
- Documenta arranque, herramientas, firmas, vínculo de sesión, auditoría y resultados verificables en el README, `src/mcp/README.md` y `docs/proyecto-final/04-mcp-aprobacion-humana.md`, con evidencia en `docs/proyecto-final/evidencia/fase4-*.txt`. Agrega `npm run fase5:preflight` equivalente al control de esta fase que incluya las nuevas pruebas. No inventes resultados.

# PROMPT 4 - Servidor MCP y aprobación humana (E3)

## Objetivo

Exponer los casos de uso del núcleo al asistente con menor privilegio y control humano para escrituras.

## Capacidades mínimas (sección 6.3 del enunciado)

| Capacidad | Debe devolver | Se ejercita en |
| --- | --- | --- |
| Consultar un crédito | Estado, saldo, días de atraso, tramo, cuotas pagadas y vencidas, próxima cuota | G-5 |
| Calcular la deuda de una cuota | Gastos, moratorio, interés corriente, capital y total exigible | OP-1, OP-2 |
| Explicar una mora | Capital en mora y cada tramo recorrido, con días y tasa | G-5, G-7 |
| Listar créditos en mora | Créditos con días, tramo y saldo; filtrable por tramo | G-4 |
| Ver próximos vencimientos | Cuotas en la ventana; cantidad y monto totales | G-6 |
| Consultar la cartera | Activa, en mora, en riesgo por tramo e incobrable del período | G-1 |
| Consultar un cierre | Desembolsos y recuperaciones por concepto, diario o mensual | G-2, G-3 |
| Registrar un pago (sensible) | Prelación e idempotencia del P1; requiere aprobación humana; rechaza monto no exacto e incobrables | OP-1 a OP-6 |

## Acciones obligatorias

1. Usa el SDK de MCP para TypeScript y los esquemas Zod de `src/contratos/`.
2. Herramientas de solo lectura por defecto.
3. Todas reciben `fechaCorte` (o fecha de operación); ninguna usa `new Date()` como regla de negocio. Si el usuario no da fecha, el chat usa la fecha de corte configurada de la sesión y la muestra en la respuesta.
4. MCP invoca los mismos casos de uso que la API, no una copia del cálculo.
5. El pago se divide en dos pasos: propuesta (dry-run) y ejecución confirmada.
6. La propuesta devuelve la prelación completa, el monto exacto, el estado previsto y un identificador verificable de la operación pendiente.
7. La ejecución solo ocurre tras aprobación explícita en la interfaz. Revalida la propuesta antes de escribir.
8. Conserva idempotencia y rechaza claves repetidas sin duplicar efectos.
9. Errores uniformes sin trazas, SQL ni datos personales innecesarios.
10. Auditoría: quién o qué propuso, quién aprobó, fecha de corte, resultado y clave de idempotencia.
11. No expongas otra herramienta de escritura. Registrar un pago es la única acción sensible autorizada; el alta, la originación y la aprobación del comité solo existen por la interfaz.
12. Nombres y firmas de herramientas: decisión del equipo, coherentes con los puertos del P1.
13. El asistente nunca accede directo a la base de datos.

## Pruebas mínimas (`tests/mcp.test.ts` y `tests/integracion/`)

- La lista de herramientas publicada es exactamente la de `herramientasFinales`; no aparece ninguna de confirmación, cancelación, alta, originación, aprobación, desembolso ni cierre.
- Cada una de las siete consultas devuelve lo mismo que el caso de uso y que la API para los mismos argumentos (G-1 a G-7).
- `proponer_pago` crea una propuesta `PENDIENTE` sin efecto financiero: conteos de pagos y versión del crédito sin cambios.
- Argumentos que intenten fijar identidad, sesión, perfil o aprobación (`aprobado: true`, `sujetoId`, `sesionId`) se rechazan por esquema estricto.
- Una propuesta de MCP solo se confirma por la interfaz con evento humano, en la sesión vinculada; otra sesión obtiene `SESION_NO_AUTORIZADA` y sin evento `APROBACION_REQUERIDA`.
- Monto no exacto (con monto correcto), crédito incobrable, cuota ya pagada, fecha inválida y clave repetida devuelven errores uniformes sin SQL, trazas ni PII.
- La auditoría registra proponente MCP, aprobador humano, fecha de corte, resultado y clave.
- Con el reloj del sistema falseado, las respuestas de las herramientas no cambian.

## Criterio de salida

El chat consulta libremente, pero no registra un pago por sí solo. Toda escritura queda pendiente hasta la confirmación humana.

---
