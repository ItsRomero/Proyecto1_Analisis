# ADR-015: D-7: ventana de próximos vencimientos

Estado: aceptado como diseño de fase 1. Fecha: 2026-10-13.

## Contexto

G-6 necesita límites inequívocos para 7 y 30 días desde el corte.

## Decisión

Adoptar (corte, corte + N días]: excluir vencimientos del mismo día e incluir el último día. N solo 7 o 30 en el contrato de demo. Considerar cuotas pendientes a la fecha consultada, sin anticipar pagos posteriores. El núcleo/servicio produce cantidad e importe total; chat y UI los presentan sin recalcular.

## Alternativas

No usar semana calendario ni incluir atrasos dentro de próximos vencimientos.

## Consecuencias y límites

Mostrar corte, hastaIncluido y ventana usada. Fecha del sistema y zona horaria del navegador no deciden el resultado.

## Validación

Fase 2/3: fronteras corte, corte+1, corte+N y corte+N+1; datos históricos con pago posterior al corte.
