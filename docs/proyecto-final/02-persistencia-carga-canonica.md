# Fase 2 — Persistencia y carga canónica (E2)

Fecha: 2026-10-14. Base: `7d713c3`, cierre de diseño y contratos de fase 1.

FASE: 2.

ESTADO: COMPLETA. Se ejecutaron migraciones, carga inicial, segunda carga y pruebas contra PostgreSQL con pgvector real. No se inició fase 3.

## Cambios realizados

- Migración 001 reproducible y versionada por SHA-256, en esquema dedicado `cv`, a partir del DDL de fase 1. Su codificación UTF-8 sin BOM y saltos LF fijados en `.gitattributes` conservan el hash entre plataformas. Incluye entidades operativas, bitácora, aplicaciones, bajas, políticas, propuestas, aprobaciones, cierres y tablas documentales/vectoriales; estas últimas quedan preparadas para sus fases, sin atribuirles funciones ya implementadas.
- Contratos de eventos Zod centralizados en `src/contratos/paquete-canonico.ts`. Lectura solo desde CV_DATA_DIR, validación de huella antes de carga, campos reales, secuencia, fechas, seis asesores e integridad referencial.
- Reproducción de 363 eventos: calendario sobre el plan francés, selección de política por otorgamiento, deuda exacta de la cuota más antigua y aplicación mediante `RegistrarPago`/prelación P1. Ningún cálculo financiero en SQL.
- Catálogo de políticas inyectado desde JSON, validado y persistido por hash. Se reutilizan las funciones de política P2. Único cambio de dominio: parámetro opcional de configuración del generador de gasto, manteniendo sus defaults y comportamiento heredado, documentado en ADR-018.
- Bajas derivadas mediante State/autorización de sistema en fechas de ADR-009; evidencia de paquete, seq, política, actor y saldo. Los reestructurados al día se clasifican por el hecho importado, sin inventar atraso ni fecha histórica de reestructuración.
- Persistencia transaccional con un mismo cliente pg y advisory lock. La segunda carga reconoce la carga completada y retorna sin escribir, conservando operaciones posteriores. La bitácora rechaza UPDATE y DELETE; incluye los duplicados separados de sus efectos financieros.
- Comandos de migración, carga, reinicio, integración y control de salida. `db:reset` afecta solo el esquema dedicado de DATABASE_URL. El control se detiene ante cualquier fallo y devuelve código distinto de cero.

## Archivos

| Ruta | Propósito |
| --- | --- |
| `src/contratos/paquete-canonico.ts` | Esquemas y tipos de eventos oficiales |
| `src/aplicacion/politicas-canonicas.ts` | Catálogo y composición de deuda sobre reglas del núcleo |
| `src/dominio/gasto-gestion-cobro.ts` | Inyección opcional retrocompatible de importe/umbral |
| `src/persistencia/paquete-canonico.ts` | Preflight, lectura, huellas y validación |
| `src/persistencia/reproducir-canonico.ts` | Reproducción mediante el núcleo y estados derivados |
| `src/persistencia/migraciones/001-inicial.sql` | Migración del modelo persistente |
| `src/persistencia/postgres.ts` | Migraciones, transacciones, carga y reinicio |
| `src/persistencia/clientes-pg.ts` | Adaptador del puerto de clientes; usado en prueba de conservación |
| `scripts/persistencia/ejecutar.mjs` | Comandos de preparación y comprobación, con salida de error explícita |
| `tests/carga.test.ts` | 17 pruebas de validación/reproducción |
| `tests/integracion/carga-postgres.integration.ts` | Siete pruebas contra PostgreSQL real |
| `vitest.postgres.config.ts` | Integración separada, sin skips por entorno faltante |
| `docs/adr/ADR-018-carga-transaccional-canonica.md` | Decisiones y control de salida |
| `README.md`, `src/persistencia/README.md`, `.env.example`, `package.json`, `package-lock.json` | Reproducción, configuración y dependencias |

## Comandos y resultados

| Comando | Resultado y evidencia |
| --- | --- |
| `npm.cmd run verify` previo | Typecheck correcto; 275 pruebas en 20 archivos |
| `git -c http.sslBackend=schannel fetch origin` | Correcto; main frente a origin/main: 0/0 commits |
| `npm.cmd run db:reset` | Esquema vacío y migración aplicada; `evidencia/fase2-reinicio.txt` |
| `npm.cmd run carga` | Huella válida en verde; carga inicial completa; `evidencia/fase2-carga-inicial.txt` |
| `npm.cmd run carga` repetido | `repetida: true`, mismos conteos; `evidencia/fase2-segunda-carga.txt` |
| `npm.cmd run fase2:verificar` | Typecheck, 292 pruebas generales, siete PostgreSQL y comprobación persistente; `evidencia/fase2-verificacion-final.txt` |
| Control de comprobación con conexión inválida deliberada | `BASE_NO_DISPONIBLE (ECONNREFUSED)`, “Fase 3 bloqueada”, código 1; `evidencia/fase2-control-negativo.txt` |
| SHA-256 de ZIP/eventos y diff datos/vistas | Coinciden con fase 0/maestro, insumos sin cambios; `evidencia/fase2-integridad-insumos.txt` |

Entorno validado: Node 22.13.0 y contenedor aislado `cv-proyecto-final-db`, imagen PostgreSQL 17 con pgvector (digest registrado en README), puerto local 55432. La demostración y la integración usan bases distintas. `.env` contiene las conexiones locales y está excluido de Git; no se publica.

Conteos observados: 60 clientes, 75 créditos, seis asesores, 363 eventos originales, 228 eventos PAGO y 226 pagos aplicados. Duplicados idénticos `IDEM-000068` y `IDEM-000127`, sin efecto adicional. La prueba PostgreSQL verifica la conservación de los importes por concepto.

## Pruebas

**299 aprobadas, cero fallidas y cero omitidas** en la verificación final: 292 generales en 21 archivos y siete PostgreSQL en un archivo separado. Se conservan las 275 pruebas previas, incluidas las 263 P1/P2, sin modificar sus archivos. Las duraciones de cada suite figuran en `evidencia/fase2-verificacion-final.txt`, más el trabajo de typecheck/compilación y comprobación.

| Requisito | Evidencia automatizada |
| --- | --- |
| Huella válida e inválida, sin carga parcial | Pruebas generales y PostgreSQL con copia temporal alterada |
| Conteos y reproducción determinista | Reproducción y consultas PostgreSQL; planes y vencimientos contrastados con el oráculo independiente de fase 0 |
| R-1/R-3: monto exacto y cuota más antigua | Todos los pagos dejan saldos exigibles cero y sin excedente; monto alterado falla indicando seq |
| Secuencia incompleta/repetida/fuera de orden | Copias temporales con huella coherente; nunca se alteran insumos |
| Idempotencia histórica | Dos eventos duplicados preservados, 226 aplicaciones |
| Segunda carga y concurrencia | Conservación de alta posterior por puerto, versión operativa y pagos existentes; dos cargas simultáneas generan un solo efecto |
| Rollback real | Trigger de fallo controlado al insertar pagos: ninguna entidad ni marcador de carga queda persistido; reintento posterior correcto |
| Integridad referencial | Rechazo de cliente/asesor inexistente, relaciones SQL y entrada sin carga parcial |
| Políticas y gasto R-4 | Plana/escalonada, configuración modificada en test, días 30/31, gasto repetido sin duplicación y umbrales no soportados rechazados |
| R-2 | Calendario compuesto de fase 1, contraste de los 75 planes/vencimientos con reproducción independiente |
| R-5 | CV-2026-0015 baja 22/10 y CV-2026-0022 baja 27/10, mediante State/evidencia de sistema |
| R-6 | Tres reestructurados al día incluidos en riesgo mediante cartera P2 |
| R-7 | Duplicados válidos sin efecto y contenido distinto rechazado |
| Fechas/corte | Reloj cambiado a noviembre de 2027 conserva resultados al corte explícito |
| Reinicio y log | UPDATE/DELETE del log rechazados; reinicio deja base vacía y permite volver a cargar |

## Decisiones

Se conserva PostgreSQL/pgvector + pg de ADR-006. No se cambió de motor para hacer pasar pruebas. ADR-018 documenta la migración del diseño, bloqueo transaccional, marcador de carga, configuración del gasto y control de salida. Los parámetros de State/riesgo sin extensión soportada fallan explícitamente; no se alteran fórmulas para ajustar importes canónicos.

La discrepancia de rango de LEEME se conserva documentada: declara 14/01–31/10/2026, mientras los eventos reales van de 07/01 a 30/10/2026. El corte financiero sigue siendo 31/10/2026.

## Errores encontrados y resolución

1. PostgreSQL no escuchaba y Docker Desktop estaba detenido. Se inició Docker y se preparó un contenedor exclusivo, sin reutilizar bases de otros proyectos.
2. npm/Git no confiaban en el certificado local. npm utilizó los certificados del almacén de Windows mediante NODE_EXTRA_CA_CERTS; Git usó schannel en el comando de fetch. No se desactivó TLS.
3. La primera integración rechazó la migración con `syntax error at or near` del carácter BOM: seis pruebas fallaron durante migración. Se corrigió el SQL a UTF-8 sin BOM y se repitió la integración. Las siete pruebas finales pasan.

No quedan errores activos detectados en el criterio de salida de esta fase. El fallo de conexión del control negativo es deliberado y demuestra que no se concede aprobación cuando falta la base.

## Riesgos o bloqueos

Mantener PostgreSQL/Docker disponible y configurar las dos conexiones para repetir la verificación. `db:reset` elimina los datos del esquema `cv`; es preparación, no operación de cartera. No se afirma que existan API, UI, MCP, pagos interactivos o RAG funcionales: corresponden a las fases posteriores. No se grabó video.

## Pendiente para la siguiente fase

La fase 3 **no se ejecutó**. Antes de iniciarla se debe ejecutar `npm run fase3:preflight`, que encadena las verificaciones y se detiene al primer fallo. Cualquier fallo exige resolver el error y repetir el control; no autoriza avanzar. La comprobación no inicia ninguna implementación de fase 3.

## Git

- Rama: `feat/proyecto-final-asistente-gerencial`.
- Base: `7d713c3`; main/origin/main sincronizados al fetch de esta revisión.
- Commit de cierre: consultar `git log -1 --oneline -- docs/proyecto-final/02-persistencia-carga-canonica.md`.
- Push: no realizado.
