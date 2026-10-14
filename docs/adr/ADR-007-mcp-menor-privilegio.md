# ADR-007: MCP local y confirmación fuera del modelo

Estado: aceptado como diseño de fase 1. Fecha: 2026-10-13.

## Contexto

La demostración es local y el asistente necesita siete consultas y una capacidad de propuesta de pago, con autorización humana para el efecto financiero.

## Decisión

SDK MCP TypeScript con stdio como proceso hijo del backend; el navegador solo accede al backend. Publicar las ocho entradas de `herramientasFinales`, usando el registro Zod único. Siete consultas y proponer_pago; confirmar_pago no es herramienta del modelo. La API de interfaz verifica sesión, origen y evento explícito de aprobación antes de invocar el caso de uso sensible.

## Alternativas

Streamable HTTP agrega superficie de transporte que no exige la demo local. Un booleano aprobado dentro de una tool call no acredita participación humana y se rechaza.

## Consecuencias y límites

El servidor construye ContextoOperacion sin confiar en argumentos del LLM. El proceso MCP no puede emitir evidencia humana válida. stdout queda reservado para el protocolo; logs técnicos van a stderr, sin PII. Referencia: https://modelcontextprotocol.io/docs/develop/connect-local-servers.

## Validación

Fase 4 debe demostrar que el modelo no confirma, no origina, no desembolsa y no genera cierres; pruebas de sesión, permisos y OP-7.
