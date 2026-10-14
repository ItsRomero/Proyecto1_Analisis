# Adaptador de persistencia planificado

Fase 1 define PostgreSQL + pgvector con `pg`; el DDL de diseño está en
`docs/proyecto-final/01-modelo-persistente.sql`. No se aplicó a ninguna base.
Las migraciones y el cargador corresponden a fase 2.

Implementar los puertos de `src/aplicacion/puertos-final.ts`. SQL recupera y
persiste hechos o resultados del núcleo; no calcula cuotas, mora o cartera.
La unidad de trabajo abre transacción, bloquea el crédito (`FOR UPDATE`),
precarga clave/huella, instancia el repositorio síncrono que necesita
`RegistrarPago`, invoca el núcleo y guarda pago, aplicaciones, versión,
aprobación y respuesta antes del commit. Rollback completo ante cualquier fallo.

Un replay con igual clave/huella se resuelve primero y devuelve el pago original,
incluso si la cuota ya fue pagada. El conflicto se resuelve antes de autorizar un
nuevo efecto. Una propuesta nueva sí debe revalidar cuota, monto y versión.
Restricciones únicas arbitran carreras; un adaptador de memoria no es persistencia.

La bitácora guarda 363 eventos, incluidos los dos pagos duplicados; solo 226
efectos. Las bajas derivadas tienen evidencia separada, sin editar el paquete.
Idempotencia conserva el vínculo al pago permanentemente y snapshot al menos
30 días. No usar TTL para borrar la protección contra duplicados.
