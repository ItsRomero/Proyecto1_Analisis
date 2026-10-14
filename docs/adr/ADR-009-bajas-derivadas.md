# ADR-009: D-1: bajas incobrables derivadas de carga

Estado: aceptado como diseño de fase 1. Fecha: 2026-10-13.

## Contexto

El paquete no incluye bajas y State exige atraso mayor de 120 días, autorización y evidencia.

## Decisión

El cargador calcula la primera fecha con más de 120 días desde la cuota más antigua impaga y registra una baja derivada y su evidencia: paquete/hash/seq origen, política, fecha, saldo y actor de sistema CARGA_CANONICA. Invoca la transición State con autorización de sistema explícita. Mantener inalterados eventos y guarda. Estado a fecha histórica se reconstruye sin anticipar una baja posterior.

## Alternativas

No marcar INCOBRABLE solo cambiando una columna ni eliminar la autorización. No usar el día de importación como fecha financiera.

## Consecuencias y límites

Al corte 2026-10-31 la auditoría deriva 0015 el 22/10 y 0022 el 27/10. Son expectativas independientes, no bajas ya persistidas. La carga oficial es el único origen de esta autorización de sistema; no se expone al chat.

## Validación

Fase 2: trazabilidad de las dos bajas y rechazo OP-6; rollback conserva consistencia y volver a cargar no genera otra baja.
