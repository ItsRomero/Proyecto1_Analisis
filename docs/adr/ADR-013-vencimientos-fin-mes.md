# ADR-013: D-5: vencimientos contractuales y fin de mes

Estado: aceptado como diseño de fase 1. Fecha: 2026-10-13.

## Contexto

PlanAmortizacion no contiene fechas y OP-3 desembolsa el día 31.

## Decisión

Componer cada cuota del plan con una fecha calculada desde el día original del desembolso más k meses. Si el día no existe, usar el último día del mes de destino. No encadenar fechas ajustadas ni modificar importes o clases del núcleo. Se implementa en plan-con-vencimientos.ts con date-fns.

## Alternativas

No usar 30 días por mes ni sumar un mes repetidamente sobre febrero, porque desplaza el día contractual.

## Consecuencias y límites

31/10/2026 genera 30/11, 31/12, 31/01. Enero de 2027 y 2028 cubren febrero común y bisiesto. Fecha de desembolso siempre inyectada.

## Validación

Pruebas de fase 1 verifican fin de mes, año bisiesto, no arrastre y conservación de objetos de cuota del núcleo.
