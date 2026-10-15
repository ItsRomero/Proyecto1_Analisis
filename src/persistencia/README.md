# Persistencia de fase 2

PostgreSQL + pgvector y `pg`, conforme ADR-006/018. `migraciones/001-inicial.sql` materializa el diseño de fase 1 en el esquema dedicado `cv`. La migración se registra con su hash y no puede editarse después de aplicada.

`paquete-canonico.ts` verifica bytes SHA-256 antes de analizar JSON, valida eventos Zod, secuencia y catálogo de asesores. `reproducir-canonico.ts` compone calendario, mora inyectada, `RegistrarPago`, prelación y State reales. `postgres.ts` persiste la reproducción completa en una sola transacción, serializada por advisory lock; no implementa fórmulas SQL. `clientes-pg.ts` implementa el puerto de clientes.

La carga completada tiene huellas de eventos/políticas/asesores y corte. Repetirla retorna sin escribir, conservando operaciones posteriores. La bitácora guarda los 363 eventos, incluidos dos duplicados, separados de los 226 pagos y sus aplicaciones por concepto. Los registros originales contienen PII ficticia: no exponerlos a chat/RAG.

Usar los comandos de instalación, carga, integración y control de salida del README raíz. `db:reset` elimina solo el esquema `cv` de DATABASE_URL y reaplica migraciones; es exclusivamente preparación de ensayos.

Pendiente de fases posteriores: unidad de trabajo del pago interactivo con bloqueo FOR UPDATE, propuesta/confirmación humana, aprobación y persistencia de pagos nuevos; API y MCP consumirán los mismos puertos. El cargador no autoriza una ruta de escritura para el modelo.
