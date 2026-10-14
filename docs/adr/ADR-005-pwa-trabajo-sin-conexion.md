# ADR-005: aplicación web progresiva (PWA) con trabajo sin conexión

## Estado y fecha

Propuesta por el equipo para el Proyecto Final. Fecha de registro: 2026-09-23. Se implementará en React + Vite + Tailwind durante el Proyecto Final. En el Proyecto 2 no se programa la interfaz (enunciado, sección 2.1).

## Contexto

El sistema tiene tres perfiles con contextos muy distintos (enunciado, sección 3; E1):

- **Asesora de crédito:** trabaja en campo, de pie, con una mano ocupada, con un Android de gama media y con señal intermitente o nula. Registra pagos y solicitudes durante las visitas.
- **Cliente:** tiene teléfono, pero no siempre datos móviles (en 2024, el 60.3 % de la población de Guatemala usaba internet, frente a 113.3 % de conexiones móviles).
- **Gerencia y comité:** trabajan en escritorio con conexión estable y consultan ocasionalmente desde el teléfono.

El Proyecto Final debe construirse en cuatro semanas con React y Tailwind. Dos decisiones del Proyecto 1 ya condicionan el trabajo sin conexión: la **clave de idempotencia** de `RegistrarPago` y el **puerto `Reloj`**, por el que la fecha de corte es un parámetro y nunca "hoy".

## Decisión

Construir **una sola aplicación web progresiva (PWA), instalable y diseñada primero para el teléfono**, para los tres perfiles. El rol con que se inicia sesión define la pantalla inicial: Ruta del día, Bandeja del comité o Tablero.

1. **Sin conexión:** un *service worker* guarda la aplicación y los datos de la ruta. Los borradores y la cola de pagos se guardan en IndexedDB. Se solicita almacenamiento persistente con `navigator.storage.persist()`.
2. **Cola de pagos idempotente:** la `Idempotency-Key` se genera una sola vez al confirmar el pago y se guarda con él antes de mostrar "Pendiente de enviar". Cada reintento envía la misma clave y el mismo contenido. Las respuestas del contrato del P1 se interpretan así: 201 es un pago nuevo; 200 con `Idempotency-Replayed` es un reintento ya aplicado; 409 es un conflicto que se muestra para revisión. Un timeout nunca borra el comando.
3. **Fecha del pago:** el adaptador del puerto `Reloj` en el teléfono fija la `fechaPago` al confirmar, y los reintentos la conservan. El núcleo recibe la fecha como parámetro y no lee el reloj del sistema.
4. **Sincronización:** Background Sync donde exista (Chrome en Android); además, reenvío al recuperar la señal, al abrir la aplicación y con un botón manual. No se promete sincronización automática universal.
5. **Operaciones que requieren conexión:** desembolsar y ejecutar cierres no se permiten sin señal.

## Alternativas

- **Aplicación nativa (Kotlin/Swift):** descartada. Exige dos lenguajes y dos bases de código más la web de gerencia, publicar en tiendas y esperar a que los asesores actualicen. Además no cabe en las cuatro semanas del Proyecto Final.
- **Aplicación híbrida (React + Capacitor):** viable, pero agrega compilación, firma y pruebas por plataforma sin resolver un problema que la PWA no resuelva hoy. Se conserva como **plan de contingencia**.
- **Web sin capacidad offline:** descartada, porque la asesora perdería capturas y pagos al quedarse sin señal (momentos críticos MC-1 y MC-2 del E1).

## Consecuencias y trade-offs

- Un solo código para los tres perfiles, coherente con el stack del Proyecto Final; las actualizaciones llegan sin pasar por una tienda.
- El navegador puede desalojar el almacenamiento. Se mitiga con almacenamiento persistente, vaciando la cola en cuanto hay señal y avisando si quedan pendientes al final del día.
- En iOS las PWA tienen limitaciones; se aceptan porque la gerencia solo consulta desde el iPhone.
- **Ajuste requerido al contrato del P1:** el OpenAPI sugiere un TTL de 24 horas para la `Idempotency-Key`. Debe ampliarse por encima de la ventana máxima sin conexión (se propone 30 días); si no, un reintento después de un día sin señal se procesaría como pago nuevo.
- **Condición de revisión:** si la validación de campo muestra que Android desaloja la cola con frecuencia, o que la cámara del navegador no basta para leer el DPI, la aplicación de la asesora migra a Capacitor sin reescribir el código React.

## Evidencia

`docs/proyecto2/e4-decision-movil-web.md`, `docs/proyecto2/e1-investigacion-usuario.md` (momentos críticos MC-2 y MC-4), `docs/api/openapi.yaml` (operación `registrarPago`, cabecera `Idempotency-Key`), `src/dominio/pago-idempotente.ts` y `src/aplicacion/consultar-mora.ts`.
