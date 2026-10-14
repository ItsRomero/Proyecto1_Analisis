# Crédito Vecino

Abra **index.html** para acceder a las 55 pantallas de Asesor, Usuario y Gerencia. Todos los recursos están incluidos; no requiere instalación ni frameworks.

- [Documentación, inventario y mapa de navegación](docs/README.md)
- [Verificación técnica](docs/verification.json)

Se comprobaron 139 conexiones del prototipo, 359 enlaces locales y 216 usos de imágenes. Los campos HTML son nativos y editables; las interacciones utilizan JavaScript vanilla.

La revisión visual en navegador no pudo completarse: el navegador integrado y la conexión HTTP local agotaron el tiempo de respuesta. Por tanto, la fidelidad visual y el comportamiento responsive en un navegador real quedan pendientes de confirmación.

Esta es una interfaz de demostración. Los estados de pago, autenticación, verificación de DPI, sincronización, aprobación y cierre muestran el diseño original y requieren backend para funcionar realmente.

Los tokens de colores y fuentes se editan en css/shared.css. css/design.css comparte las reglas de Figma entre todas las páginas; css/responsive.css adapta sus estructuras.
