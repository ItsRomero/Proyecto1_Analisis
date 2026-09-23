# Proyecto 2 · Documentación por entregable

Índice de la documentación del Proyecto 2 (*UX/UI, movilidad y evolución del núcleo*). Los archivos llevan el prefijo del entregable del enunciado (sección 9) al que responden.

| Entregable | Documento | Contenido |
|---|---|---|
| **Todo** | [documentacion-completa.md](documentacion-completa.md) | Todos los documentos de esta tabla unidos en un solo archivo. Se regenera con `python3 docs/proyecto2/generar_documentacion_completa.py` |
| **Historial** | [historial-cambios.md](historial-cambios.md) | Cada commit desde `entrega-p1`: qué agregó y si ya estaba documentado |
| **E1** · Investigación de usuario | [e1-investigacion-usuario.md](e1-investigacion-usuario.md) | Personas (asesora, cliente y gerencia), journey map de la solicitud a la primera cuota y los cuatro momentos críticos, incluido el cambio de tramo |
| | [e1-instrumentos-investigacion.md](e1-instrumentos-investigacion.md) | Guías de entrevista, encuesta y observación para validar las personas |
| **E2** · Arquitectura de información y wireframes | [e2-arquitectura-informacion.md](e2-arquitectura-informacion.md) | Mapa de navegación, tabla pantalla ↔ caso de uso (6.1) y jerarquía del tablero (7.8) |
| | [wireframes/](wireframes/) | 15 wireframes de baja fidelidad (SVG), el mapa de navegación y el script que genera los wireframes |
| **E3** · Prototipo en Figma | *(enlace pendiente)* | Se construye a partir de los wireframes de E2 |
| **E4** · Decisión móvil/web y diseño responsivo | [e4-decision-movil-web.md](e4-decision-movil-web.md) | PWA, estrategia mobile-first, trabajo sin conexión con idempotencia y puerto Reloj |
| **E5** · Evaluación heurística y WCAG | *(pendiente)* | Se realiza sobre el prototipo de E3 |
| **E6** · Evolución del núcleo e informe SOLID | [../informe-impacto-solid.md](../informe-impacto-solid.md) | Informe de impacto (Anexo D) con métricas del diff |
| | [e6-01-auditoria-inicial.md](e6-01-auditoria-inicial.md) | Línea base del P1 y creación de la etiqueta `entrega-p1` |
| | [e6-02-evolucion-nucleo.md](e6-02-evolucion-nucleo.md) | CP-01 a CP-04: fórmulas, selección de política y redondeo |
| | [e6-03-pruebas-mora-escalonada.md](e6-03-pruebas-mora-escalonada.md) | Entradas, salidas y criterios de cada prueba |
| | [e6-04-validacion-final.md](e6-04-validacion-final.md) | Instalación limpia, resultados y limitaciones |
| | [../adr/ADR-004-politica-mora-escalonada.md](../adr/ADR-004-politica-mora-escalonada.md) | Decisión de arquitectura sobre la política escalonada |

Los documentos de E1 a E4 citan las cifras del núcleo (Q1,004.62, Q18.14, Q50.80, 7.00 %, 21.75 %…) para cumplir la regla 6.2: las pantallas muestran lo que calcula el núcleo, no cifras de relleno.
