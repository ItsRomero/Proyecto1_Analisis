# ADR-019: API Express, sesión de demostración, evento humano y proyección al corte

Estado: aceptado. Fecha: 2026-10-14. Complementa ADR-006, ADR-010, ADR-014, ADR-016 y ADR-017.

## Contexto

La fase 1 dejó contratos (`CasosUsoFinal`, `rutasFinales`, esquemas Zod) y la fase 2 la carga persistente. La fase 3 necesita los servicios, el adaptador HTTP y la interfaz. Hay cinco puntos que los ADR previos dejan abiertos: cómo se demuestra en el servidor la "evidencia humana" de una confirmación, cómo se calcula el estado de un crédito a una fecha distinta de la carga, qué lecturas adicionales necesitan las pantallas, qué pasa con una cuota que no es la más antigua y cómo se reintenta un pago.

## Decisiones

1. **Express 5 en loopback** (`API_HOST`, `API_PORT`), una ruta por entrada de `rutasFinales`. Cada ruta valida su entrada con `operacionesFinales[n].entrada`; el caso de uso la vuelve a validar y valida su salida. Una salida fuera de contrato se trata como `ERROR_INTERNO`, nunca como un error de la persona usuaria. La interfaz compilada (`web/dist`) se sirve desde la misma origen; en desarrollo Vite redirige `/v1`.
2. **Sesión de demostración en memoria** con cookie `HttpOnly; SameSite=Strict`. El token de la cookie es secreto y distinto del `sesionId` público que se guarda en propuestas y auditoría. El selector de perfil (Asesor/Gerencia) cambia la sesión en el servidor; `aprobarCredito`, `rechazarCredito` y `generarCierre` exigen GERENCIA en el servidor, no solo en la interfaz. Reiniciar la sesión o el servidor invalida las propuestas pendientes (su confirmación exige la misma sesión).
3. **Evento humano de un solo uso.** Antes de cada operación marcada `humana` en `rutasFinales`, la interfaz pide `POST /v1/sesion/eventos-humanos {operacion, objetivo}` justo cuando la persona pulsa el botón explícito. El servidor lo liga a sesión + operación + objetivo (`objetivoEventoHumano`, definido una sola vez en `src/contratos/`) y lo consume al ejecutar (`X-Evento-Humano`). Sin evento: `403 APROBACION_REQUERIDA`. Un modelo de lenguaje que use MCP (fase 4) no tiene la cookie ni puede obtener ese evento; un campo `aprobado: true` en un cuerpo sigue siendo rechazado por los esquemas estrictos. Las escrituras con `Origin` ajena a la propia origen o a `WEB_ORIGIN` se rechazan.
4. **Proyección al corte con State.** Las consultas reconstruyen el estado del crédito a la `fechaCorte` pedida: se reejecutan en `Credito` (P1) las transiciones persistidas previas a la activación y el resto se deriva de los hechos conocidos a esa fecha (pagos con fecha ≤ corte, cuota pendiente más antigua, baja con fecha ≤ corte), igual que el cargador de ADR-018. Así no se anticipa una baja posterior (ADR-009) ni se depende del reloj. Las escrituras parten del estado persistido rehidratado y registran sus transiciones con State (`regularizar`, `registrarPagoParcial`, `liquidarConPago`, `detectarMora` si la mora quedó pendiente de registrar).
5. **Lecturas de interfaz y rechazo del comité** se agregan al mismo registro (`listarClientes`, `consultarFichaCredito`, `listarPagos`, `listarSolicitudes`, `listarAsesores`, `rechazarCredito`). No son herramientas MCP; los listados no contienen DPI ni teléfono. El OpenAPI final se regenera desde Zod (23 operaciones).
6. **Orden de cuotas (R-1).** Una propuesta sobre una cuota que no es la pendiente más antigua se rechaza con `409 CUOTA_FUERA_DE_ORDEN`. Se agregan también `ENTRADA_INVALIDA` (400), `CLIENTE_YA_EXISTE`, `CREDITO_YA_EXISTE`, `TRANSICION_INVALIDA` (409) y `REFERENCIA_INEXISTENTE` (422).
7. **Clave de idempotencia y reintento.** La interfaz genera la clave al iniciar cada pago y la muestra. Una clave ya usada no abre una propuesta nueva (`409 CONFLICTO_IDEMPOTENCIA`). El reintento de OP-4 es el reenvío de la misma confirmación con la misma clave, desde el comprobante del pago (el mismo caso que la cola sin conexión de ADR-005). La precarga de idempotencia se construye con las claves y huellas del crédito bloqueado `FOR UPDATE`, y `RegistrarPago` resuelve el replay con su semántica P1: `200` + `Idempotency-Replayed: true` y el pago original reconstruido desde los hechos.
8. **Gasto de gestión al confirmar.** Si la deuda exacta incluye gasto (solo `POL-2026-10`, ADR-011), se persiste en `gastos_gestion` con la misma transacción del pago; la clave primaria impide duplicarlo.

## Alternativas descartadas

- Confiar en el perfil enviado por la interfaz o en un booleano del cuerpo: no es evidencia verificable.
- Leer la columna `estado` persistida como verdad para cualquier corte: anticiparía bajas y no reflejaría el atraso a otra fecha.
- Exponer DPI o teléfono en listados, o permitir que MCP llame a operaciones humanas.
- CORS con credenciales hacia otra origen: se usa la misma origen (Vite proxy o Express estático).
- Convertir importes a `number` en la interfaz: solo se formatean cadenas.

## Consecuencias y límites

- El selector de perfil no es autenticación empresarial (fuera de alcance). Cualquiera con acceso a la máquina puede elegir Gerencia; el control demuestra separación de funciones y aprobación humana, no identidad.
- Las sesiones viven en memoria: reiniciar el servidor obliga a recargar la interfaz y a rehacer las propuestas pendientes.
- Las escrituras se serializan con el bloqueo consultivo del cargador (ADR-018) y `FOR UPDATE`; es suficiente para la demostración local, no para alta concurrencia.
- La regla de gasto y los umbrales siguen viniendo de `politicas.json` (D-4); el núcleo no cambió de fórmula.

## Validación

`tests/integracion/api-http.integration.ts` (16 pruebas contra PostgreSQL real), `tests/servicios-final.test.ts` (12, contrastadas con el oráculo independiente de fase 0), `web/src/pruebas/interfaz.test.tsx` (11) y `tests/e2e/recorridos.e2e.ts` (10, navegador real).
