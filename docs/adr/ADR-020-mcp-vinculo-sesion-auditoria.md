# ADR-020: Vínculo MCP ↔ sesión de interfaz y auditoría de propuestas

Estado: aceptado. Fecha: 2026-10-15. Complementa ADR-007, ADR-010, ADR-017 y ADR-019. No cambia el transporte de ADR-007 (stdio).

## Contexto

ADR-007 decidió un servidor MCP stdio como proceso hijo del backend con siete consultas y `proponer_pago`. Faltaba definir tres cosas: de dónde sale el contexto de cada llamada (sujeto, sesión, perfil), cómo una propuesta creada por el asistente llega a ser confirmable por una persona, y cómo la auditoría distingue a quien propone de quien aprueba. La migración 001 no tenía columnas para proponente, canal ni clave en la auditoría.

## Decisiones

1. **Contexto fijado por el backend.** `crearServidorMcp({ casos, sesion })` recibe la sesión vinculada (`sesionId`, `perfil`, `fechaCorteDefecto`) al crearse. Cada llamada construye `ContextoOperacion` con `sujetoId: "ASISTENTE-MCP"`, ese `sesionId`, ese perfil, `canal: "MCP"` y un `traceId` nuevo. Los argumentos se validan con el esquema estricto del registro único: `sujetoId`, `sesionId`, `perfil` o `aprobado` en los argumentos son `ENTRADA_INVALIDA`.
2. **Un proceso hijo por sesión de chat.** `conectarMcpSesion(sesion)` (`src/api/conector-mcp.ts`) lanza `dist/src/mcp/principal.js` por stdio con `CV_MCP_SESION_ID` y `CV_MCP_PERFIL` de la sesión de interfaz que abre el chat (fase 6), más `DATABASE_URL`, `DEFAULT_SESSION_CUTOFF` e `IDEMPOTENCY_RETENTION_DAYS`. El hijo no recibe la cookie, no publica ninguna ruta HTTP y no puede emitir eventos humanos. Sin `CV_MCP_SESION_ID` el proceso no arranca.
3. **Propuesta confirmable solo en la sesión vinculada.** Una propuesta de MCP lleva el `sesionId` vinculado; la confirmación sigue siendo exclusiva de `POST /v1/propuestas-pago/{id}/confirmacion` con evento humano e `Idempotency-Key` (ADR-019). Otra sesión obtiene `SESION_NO_AUTORIZADA`; sin evento, `APROBACION_REQUERIDA`. Reiniciar la sesión invalida las propuestas pendientes.
4. **Misma instancia de casos de uso.** API y MCP se construyen con `crearCasosPg` (`src/persistencia/casos-pg.ts`); dentro del backend puede conectarse en memoria a la misma instancia que la API, y por stdio el hijo usa el mismo código y la misma base. MCP no accede a SQL ni a otros adaptadores.
5. **Fecha de corte por defecto.** Si el modelo no envía `fechaCorte`, el servidor usa la de la sesión y la respuesta la incluye, para que el chat la muestre.
6. **Auditoría (migración 002).** `propuestas_pago.canal_proponente` (`INTERFAZ` o `MCP`) y, en `auditoria_aprobaciones`, `proponente`, `canal_proponente` y `clave_idempotencia`, más el tipo `PROPUESTA`. Proponer registra un evento `PROPUESTA/PENDIENTE` con el proponente; confirmar, reintentar o cancelar registran a la persona que aprueba (`sujeto_id`) junto con proponente, canal, fecha de operación, resultado y clave. El pago conserva `usuario_proceso` = proponente (huella P1) y `aprobacion_id` apunta al evento de aprobación humana.

## Alternativas descartadas

- Pasar la sesión como argumento de herramienta o en `_meta` desde el modelo: el modelo podría elegir otra sesión.
- Una herramienta `confirmar_pago` protegida por un booleano o un texto del usuario en el chat: no es evidencia humana verificable.
- Streamable HTTP: agrega superficie de red que la demostración local no necesita (ADR-007).
- Guardar el proponente solo en `propuestas_pago`: la auditoría de aprobación no mostraría quién propuso sin un join.

## Consecuencias y límites

- Un proceso por sesión de chat abre su propio pool de conexiones (máximo 5); suficiente para la demostración local.
- El nombre `ASISTENTE-MCP` identifica al canal, no al proveedor ni al modelo concreto; la fase 6 puede registrar el modelo en sus propios registros sin PII.
- Las escrituras siguen serializadas por el bloqueo consultivo de ADR-018 y `FOR UPDATE`.
- La migración 002 es aditiva; las bases existentes deben ejecutar `npm run db:migrate` (lo hace `npm run api`).

## Validación

`tests/mcp.test.ts` (20 pruebas en memoria), `tests/integracion/mcp-aprobacion.integration.ts` (5, PostgreSQL real: igualdad MCP = API, propuesta sin efecto, sesión vinculada, auditoría, rechazos y concurrencia) y `tests/integracion/mcp-stdio.integration.ts` (2, proceso hijo real por stdio).
