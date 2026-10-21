# ADR-014: D-6: aprobación del comité dentro de la aplicación

Estado: aceptado como diseño de fase 1. Fecha: 2026-10-13.

## Contexto

OP-3 debe recorrer alta, solicitud, simulación, aprobación y desembolso sin SQL o consola.

## Decisión

Flujo React por pasos. El selector de perfil de demo actualiza una sesión controlada por servidor; solo GERENCIA autoriza el paso de comité, con actor/fecha/motivo/evidencia. Luego desembolsar exige el estado APROBADO del State existente. Teléfono opcional en alta; no inventar el de CL-9001. Las acciones se exponen por interfaz/API y nunca como herramientas MCP.

## Alternativas

No usar autorización implícita al simular ni saltar SOLICITADO → APROBADO. No exigir autenticación empresarial fuera de alcance.

## Consecuencias y límites

El selector de demo no equivale a IAM empresarial; el adaptador debe comprobar perfil del servidor y origen de solicitud. Se registra transición y se muestra resultado real.

## Validación

Fase 3: solicitud sin aprobación no desembolsa, perfil asesor no aprueba, recorrido OP-3 completo y teléfono omitido.
