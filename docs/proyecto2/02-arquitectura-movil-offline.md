# Decisión conceptual móvil y offline

Estado: propuesta para una fase futura. No se implementan frontend, service worker, API, almacenamiento del dispositivo ni autenticación. Esta decisión deriva de los escenarios del encargo, no de entrevistas ni observación reales.

## Alternativas

| Opción | Ventaja para este sistema | Coste o límite |
|---|---|---|
| Nativa por plataforma | Integración directa con dispositivo y controles de plataforma | Adaptar y mantener canales separados; no se ha demostrado una necesidad que lo justifique |
| Híbrida con contenedor nativo | Reutilización del núcleo TypeScript y acceso a funciones nativas | Distribución, pruebas y mantenimiento de cada plataforma y sus complementos |
| PWA | Acceso web y distribución sencilla para consulta de gerencia | Capacidad offline y tareas de fondo dependen del navegador; necesita recuperación explícita de sincronización |

Capacitor documenta un runtime que permite emplear tecnologías web y acceder a funciones nativas. Esto respalda técnicamente la alternativa híbrida, sin implicar su instalación en este repositorio. [Documentación oficial de Capacitor](https://capacitorjs.com/docs).

MDN describe el trabajo offline mediante service workers y señala que una PWA debe ofrecer alternativas cuando Background Sync no esté disponible. No se debe prometer sincronización automática universal. [Operación offline y en segundo plano](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation), [mejora progresiva en PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/What_is_a_progressive_web_app).

## Recomendación razonada

Para el asesor de campo se propone un canal híbrido si el trabajo desconectado y la integración del dispositivo son requisitos confirmados. Para gerencia se propone un canal web adaptable/PWA, centrado en consulta, con fecha de actualización visible. Es una inferencia de los escenarios y las capacidades citadas, pendiente de validar con equipos, dispositivos y conectividad reales; no es una evaluación UX completada.

La estrategia mobile-first comienza por capturar y revisar un pago y su desglose en pantalla pequeña, mostrar claramente pendiente/confirmado/conflicto y permitir reintentar. Los informes se amplían en pantallas mayores. Se debe mostrar por separado mora, riesgo, bajas, corte y versión de política, para evitar interpretar una reducción por castigo como recuperación de efectivo. No se han construido esas pantallas.

## Cola offline propuesta

Cada comando pendiente conservaría identificador local, crédito, importe como cadena, moneda, `fechaPago`, fecha de corte, versión de política, clave de idempotencia y estado de envío. Se almacena antes de mostrarlo como pendiente. La confirmación definitiva solo procede de una respuesta del sistema; pendiente no equivale a pago contabilizado.

La sincronización reutiliza la misma `Idempotency-Key` y **el mismo contenido** de `RegistrarPago` en todos los reintentos. La huella actual incluye crédito, importe, moneda, fechaPago y usuarioProceso. Un corte actualizado al reconectar no debe alterar silenciosamente ese comando. El servidor futuro devuelve creación o replay, o conflicto cuando una clave lleva contenido distinto. La UI futura debe mostrar el conflicto y permitir resolverlo; no generar automáticamente una clave nueva que pueda duplicar el pago. La garantía concurrente exige una implementación atómica del puerto `RepositorioPagosIdempotentes`, hoy solo definido y probado con dobles.

Se propone envío ordenado por crédito, reintentos acotados, conservación de comandos no confirmados y un botón de sincronización al recuperar conectividad. Actualizar saldos exige conciliar la fotografía con el resultado confirmado, sin borrar comandos por un timeout.

## Fecha de corte y puerto Reloj

El puerto Reloj del diseño conceptual se ubicaría en aplicación/adaptadores: suministra una fecha civil autorizada cuando se crea un comando. Después se conserva la fecha explícita en la cola y durante el replay. El núcleo nunca consulta el reloj del dispositivo ni usa `new Date()` para elegir la política. La selección depende de la fecha contractual de otorgamiento.

`consultarMora` ya recibe otorgamiento y corte; `RegistrarPago` ya recibe fechaPago. El puerto Reloj, la persistencia de la cola y la reconciliación distribuida no se implementan en P2. Deben probarse posteriormente con desconexión, cierres del dispositivo, reloj incorrecto y pagos concurrentes. No se atribuyen resultados de esas pruebas a este trabajo.
