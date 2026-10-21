# Prompt de ejecución — Fase 1

Este prompt corresponde a la fase 1 de `Prompt_Maestro_Proyecto_Final_Por_Fases_v2.md`. Antes de ejecutarlo, lee ese documento y aplica sus reglas globales, el contrato canónico, las reglas R-1 a R-7 y las decisiones D-1 a D-9. Revisa el informe y las evidencias de la fase 0 y verifica que se cumplió su criterio de salida antes de comenzar. Ejecuta únicamente esta fase y utiliza el formato de informe de la sección 3 del documento maestro. No avances automáticamente a la fase 2.

# PROMPT 1 - Arquitectura objetivo, contratos y plan de integración

Usa como entrada la auditoría de la fase 0.

## Objetivo

Diseñar la extensión mínima que conecta núcleo, persistencia, API, interfaz, MCP, RAG y chat sin duplicar reglas financieras.

## Acciones obligatorias

1. Define los límites de módulos y dependencias permitidas: `src/dominio` no importa nada de `src/aplicacion`, `src/api`, `src/persistencia`, `src/mcp`, `src/rag` ni `web/`.
2. Conserva `src/dominio/` como núcleo independiente de frameworks.
3. Define o completa los casos de uso de aplicación (en `src/aplicacion/`) que hoy no existen, sobre el dominio actual:
   - alta de cliente y originación (solicitud, simulación de plan, aprobación, desembolso);
   - consultar crédito (estado, saldo, días de atraso, tramo, cuotas pagadas y vencidas, próxima cuota);
   - calcular deuda de una cuota (gastos, moratorio, corriente, capital, total exigible);
   - explicar mora (reutiliza `consultarMora`);
   - listar créditos en mora filtrables por tramo;
   - próximos vencimientos en una ventana (D-7);
   - cartera y riesgo por tramo (reutiliza `calcularCarteraPorTramo`);
   - cierre diario y mensual (D-8);
   - proponer pago y confirmar pago (reutiliza `RegistrarPago`, D-2).
4. Define el plan de amortización con fechas de vencimiento (R-2, D-5) como servicio que compone `PlanAmortizacion` sin modificarlo.
5. Define adaptadores de persistencia, API REST y MCP sobre los mismos casos de uso.
6. Actualiza esquemas Zod y OpenAPI antes de implementar consumidores.
7. Diseña el esquema persistente: clientes, asesores, créditos, cuotas con vencimiento, pagos con su aplicación por concepto, bitácora de eventos, bajas incobrables con evidencia, políticas versionadas, cierres, claves de idempotencia, propuestas de pago pendientes, auditoría de aprobaciones, documentos, fragmentos y vectores.
8. Modela explícitamente la propuesta de pago y su confirmación humana. El LLM no ejecuta una escritura sin confirmación.
9. Define un contrato uniforme de errores (`application/problem+json`): crédito inexistente, cuota ya pagada, crédito incobrable, monto no exacto con monto correcto, fecha inválida y conflicto o repetición de clave.
10. Documenta variables de entorno sin secretos (`.env.example`).
11. Registra los ADR: motor de base de datos, acceso a datos, transporte MCP, proveedor y modelo del LLM (con soporte de tool calling), embeddings, memoria de sesión y las decisiones D-1 a D-9.
12. Conserva las convenciones P1/P2: importes de API como valor exacto con moneda, errores RFC 9457 e idempotencia por `Idempotency-Key`.
13. En registro de pagos, documenta y prueba la semántica heredada: `201 Created` la primera vez; `200` con `Idempotency-Replayed` y sin efecto adicional al repetir la misma clave con el mismo contenido; `409` cuando la misma clave llega con contenido distinto.
14. Mantén el núcleo libre de Express, Fastify, PostgreSQL, React, MCP y RAG.

## Estructura objetivo mínima (Anexo C)

```text
src/dominio/                  núcleo P1/P2 — NO se reescribe
src/dominio/politica-mora/    catálogo de políticas del P2
src/aplicacion/               casos de uso (existentes y nuevos)
src/contratos/                esquemas Zod únicos para API y MCP
src/api/                      API REST
src/persistencia/             esquema, migraciones y cargador
src/mcp/                      servidor MCP
src/rag/                      ingesta, recuperación y citación
web/                          React + Vite + Tailwind
web/src/chat/                 chat integrado
tests/                        suite P1/P2 intacta + nuevas
tests/carga.test.ts
tests/mcp.test.ts
tests/evals/
docs/proyecto-final/
vistas/                       fuente visual HTML/CSS/JS de solo lectura
datos/datos-proyecto-final.zip  ZIP canónico original sin modificar
datos/datos-proyecto-final/     paquete extraído; valor de CV_DATA_DIR
```

## Criterio de salida

Una sola fuente de verdad: pantalla y chat llegan a los mismos casos de uso. No hay fórmulas financieras en React, en prompts del LLM ni en consultas SQL. Las decisiones D-1 a D-9 tienen ADR.

---
