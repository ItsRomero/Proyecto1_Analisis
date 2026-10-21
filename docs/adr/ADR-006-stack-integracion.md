# ADR-006: Stack de integración y persistencia

Estado: aceptado como diseño de fase 1. Fecha: 2026-10-13.

## Contexto

El núcleo es independiente de frameworks y el paquete exige operaciones atómicas, políticas versionadas y recuperación vectorial en una misma base.

## Decisión

Usar PostgreSQL + pgvector y acceso mediante `pg`; API Express 5; React + Vite + Tailwind; Node 22 y TypeScript estricto. Persistir dinero como BIGINT en centavos y tasas como puntos básicos. Recuperar BIGINT como string/BigInt. Los adaptadores traducen; el núcleo calcula. `01-modelo-persistente.sql` es diseño y no migración aplicada.

## Alternativas

PGlite es alternativa contractual para una revisión futura si la instalación PostgreSQL bloquea la demo. No mezclar dos motores en producción. Prisma/Drizzle agregan una capa innecesaria para este esquema pequeño; SQL parametrizado con pg permite controlar bloqueos y transacciones.

## Consecuencias y límites

Fase 2 instala dependencias y prueba rollback/concurrencia. No hay base levantada o validada en fase 1. Referencias: https://www.postgresql.org/docs/ y https://github.com/pgvector/pgvector.

## Validación

Pruebas de carga, rollback, unicidad de clave por crédito y persistencia de importes exactos en fase 2.
