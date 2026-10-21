# ADR-011: D-3: gasto de gestión condicionado por política

Estado: aceptado como diseño de fase 1. Fecha: 2026-10-13.

## Contexto

generarGastoGestion es idempotente por crédito/cuota/concepto pero no recibe política; el paquete limita el gasto a POL-2026-10.

## Decisión

El servicio de deuda/carga consulta aplica_a_politicas de la configuración validada. Solo para política aplicable invoca generarGastoGestion. Persiste gasto una sola vez por crédito/cuota/concepto y usa fecha/corte explícitos. No cambia fórmula ni umbral del generador.

## Alternativas

No alterar la función para invalidar pruebas P2 ni cobrar el gasto a todos los créditos por tener 31 días.

## Consecuencias y límites

Los pagos históricos planos no tienen gasto. La política nueva sí requiere prueba de frontera del día 31; la auditoría del histórico no cubre esa frontera operativa.

## Validación

Fase 2: plana con 31 o más días sin gasto, escalonada días 30/31, e idempotencia de generación.
