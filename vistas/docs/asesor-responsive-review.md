# Revisión de Asesor de crédito

Se revisaron las 37 pantallas de esta área usando los contextos detallados de Figma guardados en la conversión original, los HTML actuales y las referencias visuales recuperadas para detalle de crédito, mora y solicitud/selección de cliente.

## Problemas encontrados y corregidos

- **Anchos rígidos:** campos y contenedores de aproximadamente 329–403 px podían superar el espacio útil de un móvil de 320 px. Los contenedores y sus padres ahora comparten anchos fluidos; las imágenes y sus recortes originales se conservan.
- **Alturas y recortes:** 80 contenedores grandes tenían alturas exportadas o recorte fijo. Se permite crecimiento natural del contenido y desplazamiento de la página. Los tamaños pequeños de campos, íconos y controles se conservan.
- **Columnas y tarjetas:** 17 grupos de dos o tres columnas usan fracciones adaptables y filas automáticas. Las tarjetas de clientes permiten salto de línea del nombre y municipio, con espacio independiente para el avatar y el estado de mora. Los resúmenes monetarios se ajustan en anchos pequeños.
- **Tablas de amortización:** las dos tablas mantienen las cinco columnas originales, todos los importes y las filas completas, con desplazamiento horizontal dentro de su propio contenedor. No se comprimen las cifras hasta volverlas ilegibles.
- **Solicitud de crédito:** los grupos de monto y plazo se adaptan al ancho útil. Los botones de incremento/decremento conservan espacio propio al lado del importe. Los cálculos del diseño siguen siendo datos de demostración; no se añadió lógica financiera.
- **Selector de clientes:** se adapta a la altura del viewport con una lista desplazable. Se conserva la selección enlazada en Figma, se añade cierre accesible, Escape y control del foco del teclado. La búsqueda filtra solamente los ejemplos del diseño.
- **Inicio de sesión:** el ícono de mostrar contraseña ya no queda fuera del campo al estrechar la pantalla. El control ahora muestra/oculta el texto localmente; no autentica ni transmite datos.

## Comprobaciones realizadas

Se conservaron los 147 usos de imágenes/SVG, sus rutas, clases de imagen y asociación con los nodos del diseño. Se comprobaron 94 destinos de Figma, referencias locales no vacías, contenido textual original y los 23 campos existentes. También se verificaron la sintaxis CSS/JavaScript, el filtrado del selector y el botón de contraseña.

La cascada CSS se comprobó para **320, 375, 403 y 768 px** en todas las pantallas. Estas pruebas comprueban reglas y estructura: **no calculan geometría de renderizado ni sustituyen una inspección visual en un navegador real**. La inspección automatizada mediante file:// sigue bloqueada por la política del navegador.

## Inventario revisado

| Pantalla | Ajustes de columnas | Tablas desplazables | Comprobación |
|---|---:|---:|---|
| [Prioridad](../asesor-prioridad-11-196.html) | 0 | 0 | Código y enlaces correctos |
| [Nombre A-Z](../asesor-nombre-a-z-11-393.html) | 0 | 0 | Código y enlaces correctos |
| [Detalle del crédito](../asesor-detalle-del-credito-11-591.html) | 1 | 0 | Código y enlaces correctos |
| [Plan de amortización](../asesor-plan-de-amortizacion-12-741.html) | 1 | 1 | Código y enlaces correctos |
| [Detalle de mora](../asesor-detalle-de-mora-12-1040.html) | 1 | 0 | Código y enlaces correctos |
| [Registrar pago](../asesor-registrar-pago-12-1309.html) | 1 | 0 | Código y enlaces correctos |
| [Registrar pago](../asesor-registrar-pago-12-1388.html) | 1 | 0 | Código y enlaces correctos |
| [Confirmación](../asesor-confirmacion-12-1534.html) | 0 | 0 | Código y enlaces correctos |
| [Sin señal](../asesor-sin-senal-12-1646.html) | 0 | 0 | Código y enlaces correctos |
| [Sin señal guardado 1](../asesor-sin-senal-guardado-1-15-1760.html) | 0 | 0 | Código y enlaces correctos |
| [Sin señal guardado 2](../asesor-sin-senal-guardado-2-15-1877.html) | 0 | 0 | Código y enlaces correctos |
| [Sin señal guardado 3](../asesor-sin-senal-guardado-3-15-1996.html) | 0 | 0 | Código y enlaces correctos |
| [Pago aplicado](../asesor-pago-aplicado-15-2083.html) | 0 | 0 | Código y enlaces correctos |
| [Solicitar crédito 2](../asesor-solicitar-credito-2-15-2405.html) | 1 | 1 | Código y enlaces correctos |
| [Solicitar crédito 3](../asesor-solicitar-credito-3-15-2899.html) | 1 | 0 | Código y enlaces correctos |
| [Solicitar crédito 4](../asesor-solicitar-credito-4-15-3021.html) | 0 | 0 | Código y enlaces correctos |
| [Inicio](../asesor-inicio-17-3107.html) | 0 | 0 | Código y enlaces correctos |
| [User](../asesor-user-17-3391.html) | 1 | 0 | Código y enlaces correctos |
| [Búsqueda](../asesor-busqueda-17-4042.html) | 0 | 0 | Código y enlaces correctos |
| [Solicitar crédito 0](../asesor-solicitar-credito-0-85-376.html) | 2 | 0 | Código y enlaces correctos |
| [Solicitar crédito 0.1](../asesor-solicitar-credito-0-1-85-507.html) | 2 | 0 | Código y enlaces correctos |
| [Solicitar crédito 1](../asesor-solicitar-credito-1-85-725.html) | 2 | 0 | Código y enlaces correctos |
| [Nuevo Cliente 1](../asesor-nuevo-cliente-1-85-873.html) | 0 | 0 | Código y enlaces correctos |
| [Nuevo Cliente 2](../asesor-nuevo-cliente-2-85-935.html) | 0 | 0 | Código y enlaces correctos |
| [Nuevo Cliente 3](../asesor-nuevo-cliente-3-85-996.html) | 0 | 0 | Código y enlaces correctos |
| [Nuevo Cliente 4](../asesor-nuevo-cliente-4-85-1092.html) | 0 | 0 | Código y enlaces correctos |
| [Nuevo Cliente 5](../asesor-nuevo-cliente-5-85-1188.html) | 0 | 0 | Código y enlaces correctos |
| [Nuevo Cliente 6](../asesor-nuevo-cliente-6-85-1294.html) | 0 | 0 | Código y enlaces correctos |
| [Registrar Pago V1](../asesor-registrar-pago-v1-85-1397.html) | 1 | 0 | Código y enlaces correctos |
| [Registrar Pago V2](../asesor-registrar-pago-v2-85-1539.html) | 1 | 0 | Código y enlaces correctos |
| [Registrar Pago V3](../asesor-registrar-pago-v3-85-1681.html) | 1 | 0 | Código y enlaces correctos |
| [Registrar Pago V3.1](../asesor-registrar-pago-v3-1-85-1823.html) | 0 | 0 | Código y enlaces correctos |
| [Prototipo Asesor de Crédito](../asesor-prototipo-asesor-de-credito-85-1933.html) | 0 | 0 | Código y enlaces correctos |
| [Registrar Pago V3.2](../asesor-registrar-pago-v3-2-85-2075.html) | 0 | 0 | Código y enlaces correctos |
| [Registrar Pago V3.3](../asesor-registrar-pago-v3-3-85-2187.html) | 0 | 0 | Código y enlaces correctos |
| [Registrar Pago V3.4](../asesor-registrar-pago-v3-4-85-2305.html) | 0 | 0 | Código y enlaces correctos |
| [Registrar Pago V3.5](../asesor-registrar-pago-v3-5-85-2424.html) | 0 | 0 | Código y enlaces correctos |

## Archivos

- css/asesor-responsive.css: ajustes compartidos y exclusivos del área de Asesor.
- js/asesor.js: contraseña y selector; sin servicios de servidor.
- docs/asesor-responsive-review.json: resultados de las comprobaciones por pantalla.

Los estilos y pantallas de Usuario y Gerencia no se modificaron en esta revisión.
