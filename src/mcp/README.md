# Servidor MCP (fase 4)

SDK de MCP para TypeScript, transporte `stdio` (ADR-007), vínculo con la sesión de interfaz y auditoría según ADR-020.

- `servidor-mcp.ts`: `crearServidorMcp({ casos, sesion })` publica las ocho entradas de `herramientasFinales` con el esquema de entrada de `operacionesFinales` (JSON Schema generado desde el mismo Zod; `fechaCorte` es opcional porque la sesión aporta su valor). Siete consultas con `readOnlyHint: true` y `proponer_pago`, que solo crea una propuesta pendiente.
- `principal.ts`: proceso hijo. Lee `CV_MCP_SESION_ID`, `CV_MCP_PERFIL`, `DEFAULT_SESSION_CUTOFF`, `DATABASE_URL` e `IDEMPOTENCY_RETENTION_DAYS`; sin sesión vinculada no arranca. stdout es solo protocolo; diagnósticos a stderr, sin datos de la solicitud.
- Lanzamiento desde el backend: `conectarMcpSesion(sesion, opciones)` en `src/api/conector-mcp.ts`. Manual, para inspección: `CV_MCP_SESION_ID=SES-... npm run mcp`.

| Herramienta | Caso de uso | Argumentos (además de `fechaCorte` opcional) | Escribe |
| --- | --- | --- | --- |
| `consultar_credito` | `consultarCredito` | `creditoId` | No |
| `calcular_deuda_cuota` | `calcularDeudaCuota` | `creditoId`, `numeroCuota` | No |
| `explicar_mora` | `explicarMora` | `creditoId`, `numeroCuota` | No |
| `listar_creditos_mora` | `listarCreditosMora` | `tramo?` | No |
| `proximos_vencimientos` | `proximosVencimientos` | `dias` (7 o 30) | No |
| `consultar_cartera` | `consultarCartera` | `inicioPeriodo` | No |
| `consultar_cierre` | `consultarCierre` | `tipo` (`DIARIO` o `MENSUAL`) | No (no genera el cierre) |
| `proponer_pago` | `proponerPago` | `creditoId`, `numeroCuota`, `monto`, `claveIdempotencia` | Solo una propuesta `PENDIENTE`, sin efecto financiero |

No existen herramientas para confirmar o cancelar pagos, dar de alta clientes, originar, aprobar, rechazar, desembolsar ni generar cierres. La confirmación de una propuesta de MCP ocurre únicamente en la interfaz, en la sesión vinculada, con evento humano e `Idempotency-Key`. Los errores son los problemas RFC 9457 de `presentarProblemaFinal`, sin SQL, trazas ni datos personales; ninguna salida de herramienta contiene DPI ni teléfono.
