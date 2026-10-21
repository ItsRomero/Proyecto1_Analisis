# ADR-017: D-9: retención de claves y replay permanente

Estado: aceptado como diseño de fase 1. Fecha: 2026-10-13.

## Contexto

OpenAPI heredado sugería 24 horas; ADR-005 requiere al menos 30 días para reintentos sin conexión.

## Decisión

Retener respuesta/clave/huella un mínimo de 30 días, usando fecha de operación explícita para la convención de retención. Mantener UNIQUE(credito_id, clave_idempotencia) y huella vinculada al pago permanentemente. Expirar caché no libera la clave financiera; reconstruir respuesta original desde el pago. Primera ejecución 201, replay igual 200 con Idempotency-Replayed:true, contenido distinto 409.

## Alternativas

No borrar el vínculo después de 30 días ni generar otra clave automáticamente tras timeout. No convertir replay en error ni aplicar un pago otra vez.

## Consecuencias y límites

Huella conserva semántica P1: crédito/importe/moneda/fecha/usuarioProceso. Propuesta tiene verificación adicional de sesión/cuota/versión; no se cambia la huella del núcleo. Unidad de trabajo precarga estado y arbitra carreras antes de invocar RegistrarPago síncrono.

## Validación

Prueba 201/200/409 con RegistrarPago real en fase 1; persistencia, reintentos tras 30 días y concurrencia en fase 2/4.
