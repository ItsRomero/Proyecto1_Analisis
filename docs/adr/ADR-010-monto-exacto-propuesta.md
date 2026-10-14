# ADR-010: D-2: monto exacto y propuesta revalidable

Estado: aceptado como diseño de fase 1. Fecha: 2026-10-13.

## Contexto

RegistrarPago heredado acepta pagos parciales y excedentes; la operación canónica requiere una cuota completa y humana.

## Decisión

La aplicación calcula deuda mediante el núcleo y exige igualdad exacta en centavos con el importe. Propuesta liga crédito/cuota/corte/monto/clave/huella/versión/sesión y presenta prelación y estado previsto. Confirmar requiere evidencia humana verificable, pertenece a la misma sesión y revalida estado/deuda/versión bajo bloqueo. Replay válido se resuelve primero y devuelve el pago original. Cambios de cartera dejan propuesta OBSOLETA y exigen nueva aprobación; cancelar no afecta cartera.

## Alternativas

No endurecer el dominio ni romper CA-04/CA-05. No aceptar aprobado:true del LLM ni reutilizar aprobación de otra sesión. No ejecutar propuestas automáticamente al crearlas.

## Consecuencias y límites

MONTO_NO_EXACTO es 422 con montoCorrecto calculado por el núcleo. Cuota ya pagada o incobrable son 409 para una operación nueva. No registrar pago, auditoría parcial o nueva clave después de un timeout: repetir la clave original.

## Validación

Pruebas de semántica 201/200/409 en fase 1; fase 4 añade pruebas transaccionales de confirmación, obsolescencia y concurrencia.
