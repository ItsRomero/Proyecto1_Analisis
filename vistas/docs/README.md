# Crédito Vecino — proyecto HTML, CSS y JavaScript

## Abrir
Abra ../index.html en un navegador. También puede servir la carpeta con cualquier servidor estático. No requiere npm, frameworks ni compilación. Los recursos y fuentes están guardados localmente.

## Fuente
[Figma original](https://www.figma.com/design/jozM3QI8ZJ6pywdCoO5OVo/Microcr%C3%A9ditos-App?node-id=48-5&m=dev). Se incluyen los 55 Frames de las páginas Asesor de Crédito - Móvil (37), Usuario - Móvil (7) y Gerencia - Web (11). Cada variante tiene un HTML propio; los nombres contienen el ID de Figma para evitar colisiones. El index es un directorio añadido para facilitar la revisión.

## Estructura
- index.html: directorio de las tres áreas.
- asesor-*.html, usuario-*.html, gerencia-*.html: pantallas independientes.
- css/shared.css: fuentes, tokens, controles, accesibilidad y directorio.
- css/design.css: declaraciones CSS compartidas derivadas del diseño, sin Tailwind.
- css/responsive.css: adaptación de distribución a móviles y pantallas amplias.
- js/app.js: campos editables, búsqueda local, teclado, visibilidad de contraseña y avisos.
- assets/: imágenes, SVG y fuentes locales.
- docs/screens.json: inventario con dimensiones, IDs y conexiones originales.
- docs/navigation.json: mapa de enlaces por nodo.

## Alcance funcional y servidor pendiente
Los enlaces siguen los destinos de las reacciones del prototipo. Las variantes con datos ya escritos preservan los datos de ejemplo de Figma. Los campos son editables, pero esta entrega no persiste ni envía datos personales. La búsqueda filtra únicamente los registros mostrados. Los botones sin destino en el diseño muestran un aviso; no se les asignan resultados inventados.

Las pantallas «Pago aplicado», «DPI verificado», «Guardado localmente», «Sincronizado», aprobación y cierre son estados visuales del prototipo. Su visita no verifica un DPI, registra un pago, guarda una transacción, sincroniza ni aprueba una solicitud. Falta integrar: autenticación y sesiones, API de clientes y verificación de DPI, cálculo contractual de crédito/amortización/mora, registro idempotente de pagos, almacenamiento seguro y cola offline, sincronización, recibos reales, aprobación/rechazo con auditoría, dashboard y cierre transaccional. Los importes y fechas son los del diseño, no cálculos financieros nuevos.

## Navegación
### Asesor de crédito
- [Prioridad](../asesor-prioridad-11-196.html) (11:196) → User, Búsqueda, Nombre A-Z, Detalle del crédito, Nuevo Cliente 1, Solicitar crédito 0
- [Nombre A-Z](../asesor-nombre-a-z-11-393.html) (11:393) → User, Prioridad, Nuevo Cliente 1, Solicitar crédito 0
- [Detalle del crédito](../asesor-detalle-del-credito-11-591.html) (11:591) → Prioridad, Registrar pago, Plan de amortización, Detalle de mora
- [Plan de amortización](../asesor-plan-de-amortizacion-12-741.html) (12:741) → Detalle del crédito
- [Detalle de mora](../asesor-detalle-de-mora-12-1040.html) (12:1040) → Detalle del crédito, Registrar pago
- [Registrar pago](../asesor-registrar-pago-12-1309.html) (12:1309) → Detalle del crédito, Registrar Pago V1, Registrar Pago V2, Registrar Pago V3, Registrar pago
- [Registrar pago](../asesor-registrar-pago-12-1388.html) (12:1388) → Detalle del crédito, Registrar Pago V1, Registrar Pago V2, Registrar Pago V3, Confirmación
- [Confirmación](../asesor-confirmacion-12-1534.html) (12:1534) → Registrar pago, Sin señal, Pago aplicado
- [Sin señal](../asesor-sin-senal-12-1646.html) (12:1646) → Confirmación, Sin señal guardado 1, Registrar pago
- [Sin señal guardado 1](../asesor-sin-senal-guardado-1-15-1760.html) (15:1760) → Sin señal guardado 2
- [Sin señal guardado 2](../asesor-sin-senal-guardado-2-15-1877.html) (15:1877) → Sin señal guardado 3
- [Sin señal guardado 3](../asesor-sin-senal-guardado-3-15-1996.html) (15:1996) → Pago aplicado, Prioridad
- [Pago aplicado](../asesor-pago-aplicado-15-2083.html) (15:2083) → Prioridad
- [Solicitar crédito 2](../asesor-solicitar-credito-2-15-2405.html) (15:2405) → Prioridad, Solicitar crédito 1, Solicitar crédito 3
- [Solicitar crédito 3](../asesor-solicitar-credito-3-15-2899.html) (15:2899) → Solicitar crédito 2, Solicitar crédito 4, Prioridad
- [Solicitar crédito 4](../asesor-solicitar-credito-4-15-3021.html) (15:3021) → Prioridad
- [Inicio](../asesor-inicio-17-3107.html) (17:3107) → Prioridad
- [User](../asesor-user-17-3391.html) (17:3391) → Prioridad, Inicio
- [Búsqueda](../asesor-busqueda-17-4042.html) (17:4042) → User, Prioridad
- [Solicitar crédito 0](../asesor-solicitar-credito-0-85-376.html) (85:376) → Prioridad, Solicitar crédito 0.1
- [Solicitar crédito 0.1](../asesor-solicitar-credito-0-1-85-507.html) (85:507) → Solicitar crédito 0, Solicitar crédito 1
- [Solicitar crédito 1](../asesor-solicitar-credito-1-85-725.html) (85:725) → Prioridad, Solicitar crédito 2
- [Nuevo Cliente 1](../asesor-nuevo-cliente-1-85-873.html) (85:873) → Prioridad, Nuevo Cliente 2
- [Nuevo Cliente 2](../asesor-nuevo-cliente-2-85-935.html) (85:935) → Prioridad, Nuevo Cliente 3
- [Nuevo Cliente 3](../asesor-nuevo-cliente-3-85-996.html) (85:996) → Prioridad, Nuevo Cliente 4
- [Nuevo Cliente 4](../asesor-nuevo-cliente-4-85-1092.html) (85:1092) → Prioridad, Nuevo Cliente 5
- [Nuevo Cliente 5](../asesor-nuevo-cliente-5-85-1188.html) (85:1188) → Prioridad, Nuevo Cliente 6, Nuevo Cliente 4
- [Nuevo Cliente 6](../asesor-nuevo-cliente-6-85-1294.html) (85:1294) → Solicitar crédito 0, Prioridad
- [Registrar Pago V1](../asesor-registrar-pago-v1-85-1397.html) (85:1397) → Prioridad, Registrar Pago V2, Registrar Pago V3
- [Registrar Pago V2](../asesor-registrar-pago-v2-85-1539.html) (85:1539) → Prioridad, Registrar Pago V1, Registrar Pago V3
- [Registrar Pago V3](../asesor-registrar-pago-v3-85-1681.html) (85:1681) → Prioridad, Registrar Pago V1, Registrar Pago V2, Registrar Pago V3.1
- [Registrar Pago V3.1](../asesor-registrar-pago-v3-1-85-1823.html) (85:1823) → Prioridad, Registrar Pago V3.2, Prototipo Asesor de Crédito, Registrar Pago V3
- [Prototipo Asesor de Crédito](../asesor-prototipo-asesor-de-credito-85-1933.html) (85:1933) → Prioridad
- [Registrar Pago V3.2](../asesor-registrar-pago-v3-2-85-2075.html) (85:2075) → Prioridad, Registrar Pago V3.1, Registrar Pago V3.3, Registrar Pago V3
- [Registrar Pago V3.3](../asesor-registrar-pago-v3-3-85-2187.html) (85:2187) → Registrar Pago V3.4, Prioridad
- [Registrar Pago V3.4](../asesor-registrar-pago-v3-4-85-2305.html) (85:2305) → Registrar Pago V3.5, Prioridad
- [Registrar Pago V3.5](../asesor-registrar-pago-v3-5-85-2424.html) (85:2424) → Prioridad

### Usuario
- [Ingreso 1](../usuario-ingreso-1-92-2940.html) (92:2940) → Ingreso 2
- [Ingreso 2](../usuario-ingreso-2-92-3250.html) (92:3250) → Inicio
- [Inicio](../usuario-inicio-92-3081.html) (92:3081) → Detalle del crédito, Ayuda 1
- [Detalle del crédito](../usuario-detalle-del-credito-92-3310.html) (92:3310) → Ayuda 1, Plan de Cuotas, Inicio
- [Plan de Cuotas](../usuario-plan-de-cuotas-92-3528.html) (92:3528) → Inicio, Ayuda 1
- [Ayuda 1](../usuario-ayuda-1-92-3822.html) (92:3822) → Ayuda 2, Inicio, Detalle del crédito
- [Ayuda 2](../usuario-ayuda-2-92-3942.html) (92:3942) → Inicio, Detalle del crédito

### Gerencia
- [Ingreso 1](../gerencia-ingreso-1-101-4501.html) (101:4501) → Ingreso 2
- [Ingreso 2](../gerencia-ingreso-2-107-10599.html) (107:10599) → Prototipo Microcréditos Web
- [Prototipo Microcréditos Web](../gerencia-prototipo-microcreditos-web-103-7192.html) (103:7192) → Cartera, Clientes, Solicitudes, Cierre 1, Ingreso 1
- [Cartera](../gerencia-cartera-103-7580.html) (103:7580) → Prototipo Microcréditos Web, Clientes, Solicitudes, Cierre 1, Ingreso 1
- [Clientes](../gerencia-clientes-103-8224.html) (103:8224) → Prototipo Microcréditos Web, Cartera, Solicitudes, Cierre 1, Ingreso 1
- [Solicitudes](../gerencia-solicitudes-103-8780.html) (103:8780) → Prototipo Microcréditos Web, Cartera, Clientes, Cierre 1, Ingreso 1, Confirmar rechazo, Confirmar aprobación
- [Cierre 1](../gerencia-cierre-1-103-9199.html) (103:9199) → Prototipo Microcréditos Web, Cierre 2
- [Cierre 2](../gerencia-cierre-2-103-9370.html) (103:9370) → Cierre 3
- [Cierre 3](../gerencia-cierre-3-103-9511.html) (103:9511) → Prototipo Microcréditos Web
- [Confirmar aprobación](../gerencia-confirmar-aprobacion-103-9670.html) (103:9670) → Solicitudes
- [Confirmar rechazo](../gerencia-confirmar-rechazo-103-10164.html) (103:10164) → Solicitudes

## Recursos
Los 179 recursos gráficos provienen de las respuestas de Figma MCP. Las fuentes Outfit, Inter y DM Mono se incluyen con sus licencias. Las capturas de las pantallas no se usan como imágenes de la interfaz.

## Verificación de esta entrega
Se comprobó la existencia y contenido no vacío de todas las referencias, los 139 destinos de las reacciones de Figma, 359 enlaces locales y 216 llamadas a imágenes en las 55 pantallas. Se validó la sintaxis JavaScript y CSS y se ejecutaron las interacciones en un DOM de prueba. No se pudo verificar el renderizado visual, la geometría final de las imágenes ni los tamaños responsive en un navegador real porque la infraestructura de vista previa no respondió. El detalle se guarda en verification.json.

## Corrección de Inicio de Usuario
La pantalla 92:3081 utiliza una estructura propia y css/usuario-inicio.css para evitar que los Frames internos llamados HomeScreen reciban reglas de pantalla completa. Se conservaron los recursos originales y la navegación. El informe de esta revisión está en usuario-inicio-review.json. La inspección automatizada del archivo local fue bloqueada por la política file:// del navegador; la comprobación visual permanece pendiente.

## Corrección responsive de Ayuda
Las pantallas 92:3822 y 92:3942 usan css/usuario-ayuda.css con tarjetas de altura automática, textos que se adaptan al ancho disponible y navegación en flujo normal. Se reutiliza la navegación de Inicio. Ayuda 1 enlaza al estado abierto Ayuda 2; la primera pregunta permite regresar al estado cerrado. Los textos y SVG se conservaron. Informe: usuario-ayuda-review.json. La verificación visual en navegador permanece pendiente por la restricción file://.

## Revisión de Asesor de crédito
Las 37 pantallas incluyen css/asesor-responsive.css y js/asesor.js. Se corrigieron anchos/alturas rígidos, resúmenes, formularios, tarjetas, tablas y el selector. [Informe completo](asesor-responsive-review.md). La cascada CSS se comprobó a 320, 375, 403 y 768 px; la inspección visual en navegador real permanece pendiente.
