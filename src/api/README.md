# Adaptador REST planificado

Fase 3 implementará Express 5 en loopback. OpenAPI final generado:
`docs/api/openapi-proyecto-final.json`. El contrato histórico de 14 operaciones
permanece en `docs/api/openapi.yaml` para regresión; la extensión final usa Zod
como fuente y no constituye un servidor ya implementado.

Cada ruta del manifiesto `rutasFinales` traduce path/query/body a una entrada,
valida con `operacionesFinales`, construye contexto desde sesión y despacha al
mismo `CasosUsoFinal` que MCP. Validar salidas y traducir errores RFC 9457.
La ruta de confirmación exige evidencia humana de interfaz, sesión ligada a
propuesta, Idempotency-Key coincidente y validación de origen. Un campo booleano
de un mensaje del modelo no concede permisos. Perfil gerencia obligatorio en
aprobación del comité y cierres; basta selector de perfil de demo controlado
por servidor, sin IAM empresarial.

`semantica-pago.ts` solo presenta un resultado de `RegistrarPago`: 201 la primera
vez, 200 y `Idempotency-Replayed: true` al repetir; conflicto se traduce a 409.
No es una ruta operativa ni omite la confirmación humana.
