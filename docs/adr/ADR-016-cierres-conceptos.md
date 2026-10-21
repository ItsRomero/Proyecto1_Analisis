# ADR-016: D-8: cierres diario y mensual

Estado: aceptado como diseño de fase 1. Fecha: 2026-10-13.

## Contexto

El núcleo no tiene cierres ejecutables; G-2/G-3 requieren desembolsos y recuperaciones por concepto.

## Decisión

Definir consulta PREVIO y generación explícita por GERENCIA, ambas usando los mismos hechos y núcleo. Diario: fechaCorte. Mensual: primer día del mes de fechaCorte hasta fechaCorte inclusive; para octubre completo usar 31/10. Mostrar cantidades/importes de desembolsos y pagos únicos; recuperaciones separadas en gastos, moratorio, corriente y capital. Cartera y riesgo por calcularCarteraPorTramo, bajas con fechas y evidencia. Snapshot generado es inmutable y único por tipo/inicio/corte.

## Alternativas

No fabricar devengo o mayor contable; no usar totales de prototipo ni fórmulas SQL. La consulta del asistente no genera ni reemplaza un cierre. No escribir devengo cero para simular un servicio inexistente.

## Consecuencias y límites

El contrato final separa PREVIO de GENERADO y evita el devengo obligatorio de la respuesta histórica. El cierre se genera después de las operaciones del guion. Si la cartera cambió respecto a un snapshot, mostrar estado/versiones y exigir una decisión explícita de corrección, nunca sustituirlo silenciosamente.

## Validación

Fases 2/3/7: conceptos concilian con aplicaciones del núcleo, duplicados no aumentan recuperación, límites de período e idempotencia de cierre.
