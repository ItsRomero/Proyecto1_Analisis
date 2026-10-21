# Adaptador REST (fase 3)

Express 5 en loopback (`API_HOST`, `API_PORT`). `servidor-final.ts` arma el servidor con los adaptadores `pg` y `principal.ts` lo arranca; `aplicacion-http.ts` registra una ruta por cada entrada de `rutasFinales`, valida con `operacionesFinales` y despacha al mismo `CasosUsoFinal` que usará MCP. OpenAPI generado desde Zod: `docs/api/openapi-proyecto-final.json` (`npm run openapi`). El contrato histórico de 14 operaciones permanece en `docs/api/openapi.yaml` para regresión.

- Sesión de demostración en memoria (`sesiones.ts`), cookie `HttpOnly; SameSite=Strict`; el perfil lo fija el servidor. Gerencia es obligatoria para comité y cierres.
- Operaciones humanas: exigen `X-Evento-Humano`, un evento de un solo uso emitido por `POST /v1/sesion/eventos-humanos` y ligado a sesión, operación y objetivo (ADR-019). Un campo booleano de un mensaje del modelo no concede permisos.
- `confirmarPago` exige `Idempotency-Key` igual a la de la propuesta: 201 la primera vez; 200 con `Idempotency-Replayed: true` al repetirla; 409 si el contenido difiere.
- Errores `application/problem+json` mediante `presentarProblemaFinal`, sin SQL, trazas ni datos personales.
- Escrituras desde otra origen distinta de la propia o de `WEB_ORIGIN`: 403.
