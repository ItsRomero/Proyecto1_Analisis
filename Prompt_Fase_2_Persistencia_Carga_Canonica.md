# Prompt de ejecución — Fase 2

Este prompt corresponde a la fase 2 de `Prompt_Maestro_Proyecto_Final_Por_Fases_v2.md`. Antes de ejecutarlo, lee ese documento y aplica sus reglas globales, el contrato canónico, las reglas R-1 a R-7 y las decisiones D-1 a D-9. Revisa el cierre vigente de la fase 0 en `docs/proyecto-final/00-auditoria-linea-base.md` y el de la fase 1 en `docs/proyecto-final/01-arquitectura-contratos-integracion.md`; verifica que se cumplieron sus criterios de salida antes de comenzar. El archivo `01-estado-arquitectura-integracion.md` conserva un diagnóstico histórico y no sustituye el cierre vigente. Ejecuta únicamente esta fase y utiliza el formato de informe de la sección 3 del documento maestro. No avances automáticamente a la fase 3.

## Continuidad con la fase 1

- Inspecciona el estado Git antes de editar y conserva el trabajo existente. Continúa en `feat/proyecto-final-asistente-gerencial` si ya contiene las fases anteriores; no recrees la rama ni descartes sus commits.
- Reutiliza los contratos y puertos de `src/aplicacion/` y `src/contratos/`, el calendario de `plan-con-vencimientos.ts`, el diseño persistente y los ADR-006 a ADR-017. La fase 1 cerró diseño y contratos; no presupongas que sus adaptadores operativos ya están implementados.
- Implementa PostgreSQL + pgvector con `pg`, conforme a la decisión de fase 1. Si una limitación comprobable exige cambiarla, documenta un ADR antes de introducir la alternativa autorizada por el maestro.
- Verifica los insumos mediante el preflight del maestro y ejecuta `npm.cmd run verify` antes y después de los cambios. La fase 1 documenta 275 pruebas aprobadas en 20 archivos; confirma la línea base real y conserva intactas las pruebas heredadas.
- Si faltan PostgreSQL, pgvector o acceso a la base, identifica el bloqueo con evidencia. Continúa con los entregables independientes y no declares completa la carga sin haberla ejecutado contra la base real.
- Documenta migraciones, carga, reinicio, requisitos y resultados verificables en el README y en `docs/proyecto-final/02-persistencia-carga-canonica.md`. No inventes resultados ni confundas la reproducción independiente de fase 0 con la carga persistente de esta fase.

# PROMPT 2 - Persistencia y carga canónica (E2)

## Objetivo

Implementar una base reproducible y un cargador idempotente del paquete oficial.

## Acciones obligatorias

1. Usa PostgreSQL + pgvector o PGlite + pgvector, según el ADR.
2. Implementa migraciones reproducibles.
3. Lee la ruta desde `CV_DATA_DIR`.
4. Lee el contrato de `LEEME.md` y no supongas campos inexistentes.
5. Antes de cargar, calcula SHA-256 de `eventos.jsonl` y compáralo con `eventos.sha256`. Si no coincide, aborta sin carga parcial y muestra un error claro.
6. Estrategia única de ingesta: reproduce `eventos.jsonl` en orden de `seq` (fuente de verdad). Si se usan los CSV, verifica primero que coincidan exactamente con la bitácora.
7. **Cada pago histórico se aplica mediante el núcleo**: plan con vencimientos (R-2), mora por la política del crédito a la fecha de pago, prelación P1 y gasto solo si aplica (R-4). Se persiste la aplicación por concepto de cada pago, porque los cierres la necesitan. Copiar montos sin pasar por el núcleo no es válido.
8. Verifica durante la reproducción que cada pago único sea exactamente el monto exigible de la cuota más antigua (R-1, R-3). Si alguno no lo es, la carga se detiene y reporta el `seq`; no se ajusta en silencio.
9. Deriva los estados al corte `2026-10-31`: vigente, en mora, reestructurado (R-6) e incobrable (R-5, D-1), con la evidencia de sistema y la fecha de baja definidas en el ADR.
10. Carga las políticas desde `politicas.json` como datos versionados (D-4).
11. Logra exactamente 60 clientes, 75 créditos, 6 asesores y 228 eventos de pago importados, con 226 pagos únicos aplicados.
12. Carga transaccional e idempotente: una segunda ejecución no duplica datos y **no borra ni altera** operaciones hechas después por la aplicación (por ejemplo, las de OP-1 a OP-3).
13. No alteres los archivos canónicos.
14. Comando único de carga (por ejemplo `npm run carga`) con salida legible que muestre la huella verificada **en verde** y los conteos.
15. Comando de reinicio para ensayos y para el Bloque 1 (por ejemplo `npm run db:reset`) que deja la base vacía con migraciones aplicadas. Se documenta en el README como herramienta de preparación, nunca como forma de operar la cartera.
16. Persiste por separado la bitácora inmutable de los 363 eventos y las proyecciones operativas.
17. Valida que los seis asesores existan y que créditos y pagos respeten la integridad referencial.
18. Valida la continuidad de `seq` del 1 al 363.
19. Después de la carga, cualquier alta, pago o desembolso entra solo por la interfaz/API.

## Pruebas mínimas (`tests/carga.test.ts`)

- Huella válida.
- Huella inválida y rollback (sin carga parcial).
- Conteos exactos: 60 / 75 / 6 / 228 importados / 226 aplicados.
- Orden y reproducción deterministas.
- Segunda carga sin duplicados ni pérdida de operaciones posteriores.
- `CV_DATA_DIR` faltante o inválida.
- Secuencia incompleta, repetida o fuera de orden (con copias alteradas en un directorio temporal de prueba, nunca sobre `datos/`).
- Duplicados `IDEM-000068` e `IDEM-000127` sin doble efecto financiero.
- Integridad referencial.
- Selección de `POL-2024-01` y `POL-2026-10` según fecha de otorgamiento.
- R-1 y R-3: cada pago aplicado iguala el exigible de la cuota más antigua.
- R-5: `CV-2026-0015` y `CV-2026-0022` incobrables al corte, con fecha de baja según D-1.
- R-6: los tres reestructurados cuentan en riesgo.
- Discrepancia de rango de `LEEME.md` registrada.

## Criterio de salida

Desde una base vacía, un solo comando verifica la huella, carga la información y deja los conteos requeridos. Una segunda ejecución no cambia esos conteos.

---
