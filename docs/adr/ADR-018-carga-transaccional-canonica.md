# ADR-018: reproducción canónica transaccional y control de salida

Estado: aceptado. Fecha: 2026-10-14. Complementa ADR-006, ADR-009, ADR-011 y ADR-012.

## Decisión

La migración 001 materializa el diseño de fase 1 en el esquema dedicado `cv` de PostgreSQL con pgvector. Se registra la huella de la migración y se rechaza modificar una migración aplicada. El cargador verifica primero archivos, huella, secuencia, referencias y reproducción con el núcleo. Después guarda todas las proyecciones, aplicaciones, bajas, eventos originales y marcador de carga en una sola transacción, con un mismo cliente `pg`. Un advisory lock transaccional serializa cargas y reinicios concurrentes.

Una carga completada se identifica por las huellas de eventos, políticas y asesores y por su corte. Repetirla devuelve sin escribir: conserva cualquier operación posterior. Otra carga sobre datos existentes se rechaza; no se usa upsert para reconstruir y sobrescribir cartera. La bitácora rechaza UPDATE/DELETE mediante trigger; el reinicio de ensayos elimina solamente el esquema `cv` y reaplica migraciones.

Las tasas y tramos se inyectan mediante Strategy `PoliticaMora`, reutilizando `importeTramo`, `resultadoPolitica` y `CalculadoraMora`. `generarGastoGestion` recibe un parámetro opcional de configuración (umbral/importe), con los mismos defaults P2. Conserva su identidad crédito/cuota/concepto y su fórmula; solo se invoca si la política figura en el alcance del JSON. Se prueba que la repetición no genera otro gasto. Parámetros que contradigan umbrales no configurables de State/riesgo se rechazan explícitamente.

`reestructurado` es un hecho importado. Para los créditos al día se proyecta REESTRUCTURADO y se usa esa clasificación en cartera P2. No se inventa un atraso ni una fecha histórica de reestructuración para forzar State. Las bajas sí invocan State con la autorización de sistema definida por ADR-009.

El paquete histórico contiene exclusivamente pagos de política plana. La persistencia de gastos escalonados operativos corresponde al servicio de pagos de las fases posteriores; esta carga no inventa gastos inexistentes.

## Control de salida

`npm run fase2:verificar` exige typecheck, suite general, integración real PostgreSQL y comprobación de carga persistente. Los comandos se encadenan con `&&`: el primer fallo devuelve código distinto de cero y detiene la secuencia. `npm run fase3:preflight` ejecuta ese control y no implementa fase 3. La integración exige TEST_DATABASE_URL para una base terminada en `_test`; su ausencia es fallo, nunca skip. El comando de carga puede inicializar migraciones desde base vacía.

## Alternativas descartadas

No usar memoria como evidencia de persistencia, copiar montos sin núcleo, desactivar TLS, sustituir PostgreSQL por una base distinta solo para las pruebas o borrar datos operativos durante una recarga.

## Referencias

- [Transacciones node-postgres](https://node-postgres.com/features/transactions): un cliente por transacción.
- [Bloqueos PostgreSQL](https://www.postgresql.org/docs/current/explicit-locking.html): advisory locks transaccionales.
