# Proyecto 2 · Documentación por entregable

Índice de la documentación del Proyecto 2 (*UX/UI, movilidad y evolución del núcleo*). Los archivos llevan el prefijo del entregable del enunciado (sección 9) al que responden.

| Entregable | Documento | Contenido |
|---|---|---|
| **Documento final** | [P2-documento-final.md](P2-documento-final.md) | **Versión para entregar:** el documento de entrega con los complementos (casos de uso, skeletons, ADR-004/005 y commits con hipervínculos) insertados en su capítulo. Se genera con `generar_documento_final.py` |
| **Entrega** | [P2-documento-entrega.md](P2-documento-entrega.md) | Documento completo para el catedrático: E1 a E7 con todo el detalle técnico, revisión del prototipo de Figma, evaluación E5, informe SOLID, tabla de commits y lista de verificación. Se genera con `python3 docs/proyecto2/generar_documento_entrega.py` a partir de `fuente-documento-entrega.md` y los documentos de cada entregable |
| **Todo** | [documentacion-completa.md](documentacion-completa.md) | Todos los documentos de esta tabla unidos en un solo archivo. Se regenera con `python3 docs/proyecto2/generar_documentacion_completa.py` |
| **Historial** | [historial-cambios.md](historial-cambios.md) | Cada commit desde `entrega-p1`: qué agregó y si ya estaba documentado |
| **E1** · Investigación de usuario | [e1-investigacion-usuario.md](e1-investigacion-usuario.md) | Personas (asesora, cliente y gerencia), journey map de la solicitud a la primera cuota y los cuatro momentos críticos, incluido el cambio de tramo |
| | [e1-instrumentos-investigacion.md](e1-instrumentos-investigacion.md) | Guías de entrevista, encuesta y observación para validar las personas |
| **E2** · Arquitectura de información y wireframes | [e2-arquitectura-informacion.md](e2-arquitectura-informacion.md) | Mapa de navegación, tabla pantalla ↔ caso de uso (6.1) y jerarquía del tablero (7.8) |
| | [wireframes/](wireframes/) | Wireframes alineados con el prototipo de Figma: [skeleton/](wireframes/skeleton/) y [anotado/](wireframes/anotado/) de P01–P14 (pantallas de Figma) y G01–G07 (guías por construir), mapa de navegación y diagrama de casos de uso, con sus scripts |
| **E3** · Prototipo en Figma | [Abrir el prototipo](https://www.figma.com/proto/jozM3QI8ZJ6pywdCoO5OVo/Microcr%C3%A9ditos-App?node-id=0-1&t=PJlTVLC3ASu31ttw-1) | Flujo del asesor en móvil (originación, cobro y pago sin señal). La revisión y lo que falta están en `P2-documento-entrega.md` §6 |
| **E4** · Decisión móvil/web y diseño responsivo | [e4-decision-movil-web.md](e4-decision-movil-web.md) | PWA, estrategia mobile-first, trabajo sin conexión con idempotencia y puerto Reloj |
| **E5** · Evaluación heurística y WCAG | [P2-documento-entrega.md §8](P2-documento-entrega.md#8-e5--evaluación-heurística-y-de-accesibilidad) | 14 hallazgos preliminares y auditoría WCAG 2.2; falta la evaluación independiente de los cuatro integrantes |
| **E6** · Evolución del núcleo e informe SOLID | [../informe-impacto-solid.md](../informe-impacto-solid.md) | Informe de impacto (Anexo D) con métricas del diff |
| | [e6-01-auditoria-inicial.md](e6-01-auditoria-inicial.md) | Línea base del P1 y creación de la etiqueta `entrega-p1` |
| | [e6-02-evolucion-nucleo.md](e6-02-evolucion-nucleo.md) | CP-01 a CP-04: fórmulas, selección de política y redondeo |
| | [e6-03-pruebas-mora-escalonada.md](e6-03-pruebas-mora-escalonada.md) | Entradas, salidas y criterios de cada prueba |
| | [e6-04-validacion-final.md](e6-04-validacion-final.md) | Instalación limpia, resultados y limitaciones |
| | [../adr/ADR-004-politica-mora-escalonada.md](../adr/ADR-004-politica-mora-escalonada.md) | Decisión de arquitectura sobre la política escalonada |

Los documentos de E1 a E4 citan las cifras del núcleo (Q1,004.62, Q18.14, Q50.80, 7.00 %, 21.75 %…) para cumplir la regla 6.2: las pantallas muestran lo que calcula el núcleo, no cifras de relleno.
