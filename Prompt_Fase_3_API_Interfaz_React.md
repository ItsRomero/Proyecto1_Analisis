# Prompt de ejecución — Fase 3

Este prompt corresponde a la fase 3 de `Prompt_Maestro_Proyecto_Final_Por_Fases_v2.md`. Antes de ejecutarlo, lee ese documento y aplica sus reglas globales, el stack contractual, el contrato canónico, las reglas R-1 a R-7, las decisiones D-1 a D-9 y los casos OP-1 a OP-7 y G-1 a G-8. Revisa los cierres vigentes de las fases anteriores: `docs/proyecto-final/00-auditoria-linea-base.md`, `docs/proyecto-final/01-arquitectura-contratos-integracion.md` y `docs/proyecto-final/02-persistencia-carga-canonica.md`; verifica que se cumplieron sus criterios de salida antes de comenzar. Ejecuta únicamente esta fase y utiliza el formato de informe de la sección 3 del documento maestro. No avances automáticamente a la fase 4.

## Continuidad con la fase 2

- Inspecciona el estado Git antes de editar y conserva el trabajo existente. Continúa en `feat/proyecto-final-asistente-gerencial` si ya contiene las fases 0 a 2; no recrees la rama ni descartes sus commits.
- Ejecuta `npm run fase3:preflight` antes de cualquier cambio. Encadena `verify`, la integración PostgreSQL y la comprobación de la carga persistente; se detiene al primer fallo. Un fallo exige resolver la causa y repetir el control; no autoriza avanzar. Línea base esperada: typecheck sin errores, 292 pruebas generales en 21 archivos y 7 pruebas PostgreSQL. Confirma la línea base real y conserva intactas todas las pruebas existentes.
- Entorno local: PostgreSQL 17 + pgvector en el contenedor `cv-proyecto-final-db` (imagen `pgvector/pgvector` con el digest registrado en el README), puerto `127.0.0.1:55432`, bases `credito_vecino` (demo) y `credito_vecino_fase2_test` (integración). Si el contenedor existe, usa `docker start cv-proyecto-final-db`; si no, créalo con los comandos del README. `.env` se crea desde `.env.example` y nunca se versiona. Usa Node.js 22 LTS conforme a `.nvmrc`; si el entorno tiene otra versión, regístralo en el informe.
- La fase 1 dejó **solo contratos**: `CasosUsoFinal`, `ConsultasFinales` y los puertos de `src/aplicacion/puertos-final.ts`, los esquemas de `src/contratos/proyecto-final.ts`, el manifiesto `rutasFinales` de `src/contratos/rutas-proyecto-final.ts`, `presentarProblemaFinal` y `semantica-pago.ts`. La fase 2 dejó la migración, el cargador y un único adaptador (`clientes-pg.ts`). No existen todavía los servicios de aplicación, los adaptadores de lectura/escritura, el servidor HTTP ni `web/`. No presupongas que alguno está implementado.
- Implementa los casos de uso de `CasosUsoFinal` en `src/aplicacion/` sobre los hechos persistidos y el núcleo (`plan-con-vencimientos.ts`, `politicas-canonicas.ts`, `consultarMora`, `calcularCarteraPorTramo`, `RegistrarPago`, State del crédito). Los adaptadores `pg` de `src/persistencia/` solo recuperan y guardan hechos; ningún cálculo financiero en SQL, en Express ni en React. La fase 4 (MCP) despachará exactamente a estos mismos casos de uso.
- Implementa la API con Express 5 en loopback (`API_HOST`, `API_PORT`) conforme a ADR-006. Cada ruta del manifiesto `rutasFinales` valida entrada y salida con los esquemas de `src/contratos/`, construye `ContextoOperacion` desde la sesión del servidor y traduce errores con `presentarProblemaFinal` (`application/problem+json`). Regenera el OpenAPI final si cambian los contratos y conserva `docs/api/openapi.yaml` para regresión.
- Respeta las decisiones registradas: propuesta y confirmación de pago (ADR-010, flujo de la sección "Propuesta, aprobación y transacción" de la fase 1), comité dentro de OP-3 con perfil gerencia controlado por el servidor y teléfono opcional (ADR-014), fin de mes en vencimientos (ADR-013), ventana de vencimientos (ADR-015), cierres por concepto (ADR-016) e idempotencia (ADR-017). Si una limitación comprobable exige cambiar una decisión, documenta un ADR nuevo (desde ADR-019) antes de introducir la alternativa.
- Las pruebas de API y de recorridos que escriben en base usan `TEST_DATABASE_URL`; nunca la base de demo. Las dependencias nuevas (por ejemplo, librerías de pruebas de componentes) deben justificarse en el informe; un framework alternativo al stack contractual exige ADR.
- Documenta arranque de API y web, rutas, perfiles, tabla pantalla <-> caso de uso y resultados verificables en el README y en `docs/proyecto-final/03-api-interfaz-react.md`, con evidencia en `docs/proyecto-final/evidencia/fase3-*.txt` y capturas reales en `docs/proyecto-final/evidencia/`. Agrega un script `fase4:preflight` equivalente al de esta fase que incluya las nuevas pruebas. No inventes capturas ni resultados.

# PROMPT 3 - API e interfaz React de siete pantallas (E1)

## Objetivo

Implementar las siete pantallas prototipadas en P2 como aplicación real, conectada a la API y al núcleo.

## Fuente visual obligatoria

Usa `vistas/` como especificación local de diseño. La ejecución debe trabajar con la copia local. Empieza leyendo:

- `vistas/index.html`: directorio de los tres perfiles.
- `vistas/docs/README.md`: inventario, navegación, alcance y limitaciones.
- `vistas/docs/verification.json`: comprobaciones y detalle de los frames.
- `vistas/docs/screens.json` y `vistas/docs/navigation.json`, si existen.
- `vistas/css/shared.css`, `design.css`, `responsive.css` y `asesor-responsive.css`.
- `vistas/js/app.js` y `vistas/js/asesor.js`: intención de las interacciones, a reimplementar en React.
- `vistas/assets/`: SVG, imágenes y fuentes Outfit, Inter y DM Mono con sus licencias.

No conviertas cada variante del prototipo en una página. Consolida pasos, confirmaciones, errores y variantes en componentes y rutas React.

## Pantallas obligatorias

1. Solicitud de crédito, con alta del cliente como primer paso.
2. Detalle del crédito.
3. Registro de pago.
4. Plan de amortización.
5. Detalle de la mora.
6. Tablero gerencial.
7. Cierre diario/mensual.

## Perfiles

Basta distinguir asesor y gerencia (fuera de alcance: autenticación empresarial). Implementa un selector de perfil simple dentro de la aplicación, visible en el video, que también permita la aprobación del comité durante OP-3 (D-6).

## Mapa de archivos fuente a rutas React

| Área funcional | Archivos de referencia bajo `vistas/` | Ruta React objetivo |
| --- | --- | --- |
| Entrada y cartera del asesor | `asesor-inicio-17-3107.html`, `asesor-prioridad-11-196.html`, `asesor-nombre-a-z-11-393.html`, `asesor-busqueda-17-4042.html` | `/asesor/clientes` |
| Alta de cliente | `asesor-nuevo-cliente-1-85-873.html` a `asesor-nuevo-cliente-6-85-1294.html` | primer paso de `/asesor/creditos/nuevo` (y `/asesor/clientes/nuevo` como acceso directo opcional) |
| Solicitud, simulación y desembolso | `asesor-solicitar-credito-0-85-376.html`, `asesor-solicitar-credito-0-1-85-507.html`, `asesor-solicitar-credito-1-85-725.html`, `asesor-solicitar-credito-2-15-2405.html`, `asesor-solicitar-credito-3-15-2899.html`, `asesor-solicitar-credito-4-15-3021.html` | `/asesor/creditos/nuevo` como flujo por pasos: alta -> solicitud -> simulación -> confirmación -> aprobación -> desembolso |
| Detalle del crédito | `asesor-detalle-del-credito-11-591.html` | `/asesor/creditos/:creditoId` |
| Plan de amortización | `asesor-plan-de-amortizacion-12-741.html` | `/asesor/creditos/:creditoId/plan` |
| Detalle de mora | `asesor-detalle-de-mora-12-1040.html` | `/asesor/creditos/:creditoId/mora` |
| Registro y resultado de pago | `asesor-registrar-pago-12-1309.html`, `asesor-registrar-pago-12-1388.html`, familia `asesor-registrar-pago-v*.html`, `asesor-confirmacion-12-1534.html`, `asesor-pago-aplicado-15-2083.html` | `/asesor/creditos/:creditoId/pagos/nuevo`; propuesta, confirmación y resultado son estados del flujo |
| Estados sin conexión | `asesor-sin-senal-12-1646.html` y familia `asesor-sin-senal-guardado-*.html` | Estado reutilizable dentro del flujo de pago; no simular sincronización si no se implementa la cola offline |
| Tablero gerencial | `gerencia-prototipo-microcreditos-web-103-7192.html` | `/gerencia` |
| Cartera y riesgo por tramo | `gerencia-cartera-103-7580.html` | `/gerencia/cartera` y `/gerencia/cartera/tramos/:tramo` |
| Clientes de gerencia | `gerencia-clientes-103-8224.html` | `/gerencia/clientes` |
| Solicitudes y decisión | `gerencia-solicitudes-103-8780.html`, `gerencia-confirmar-aprobacion-103-9670.html`, `gerencia-confirmar-rechazo-103-10164.html` | `/gerencia/solicitudes` y `/gerencia/solicitudes/:solicitudId/decision` |
| Cierre diario y mensual | `gerencia-cierre-1-103-9199.html`, `gerencia-cierre-2-103-9370.html`, `gerencia-cierre-3-103-9511.html` | `/gerencia/cierres/diario` y `/gerencia/cierres/mensual` |
| Asistente gerencial | No existe como frame; reutiliza el sistema visual de Gerencia | `/gerencia/asistente`, más acceso persistente desde el layout gerencial |

Si la fase 0 encuentra nombres de archivo distintos en `vistas/`, actualiza esta tabla con los reales; no inventes archivos.

Las siete vistas `usuario-*.html` pueden migrarse como rutas complementarias (`/usuario/...`) si el tiempo lo permite. No reemplazan ninguna pantalla obligatoria ni deben retrasar E1.

La ruta `/gerencia/asistente` se deja en esta fase como espacio del layout sin funcionalidad simulada; el chat se implementa en la fase 6.

## Flujos obligatorios

1. Originación: alta de cliente -> solicitud -> simulación (plan con fechas) -> confirmación -> aprobación del comité -> desembolso.
2. Cobro en campo: buscar cliente -> saldo/tramo/mora -> propuesta de pago (cuota más antigua y prelación) -> aprobación -> comprobante -> estado posterior del crédito.
3. Consulta gerencial: tablero -> cartera en riesgo por tramo -> créditos del tramo.

## Acciones obligatorias

1. Implementa `web/` con React, Vite, Tailwind CSS y TypeScript estricto.
2. Implementa la API con Express 5 o Fastify sobre los casos de uso del prompt 1.
3. Reutiliza los esquemas Zod de `src/contratos/`.
4. Todas las cifras vienen de la API y del núcleo. La fecha de operación y de corte se elige en la interfaz con valor por defecto configurado (`2026-10-31` para la defensa, por variable de entorno), nunca con la fecha del reloj.
5. Pantallas de asesor usables en ancho de teléfono; de gerencia en escritorio.
6. El tablero muestra cartera activa (denominador), cartera en mora, riesgo por tramo (Mora 2, Mora 3, Vencido, Reestructurado) e incobrable del período.
7. El cierre muestra desembolsos y recuperaciones separadas en gastos, interés moratorio, interés corriente y capital, diario y mensual (D-8).
8. El detalle de mora explica días, política aplicada, tasas, tramos recorridos, capital en mora y total. Para créditos `POL-2024-01` muestra un único tramo plano.
9. Registro de pago: propone por defecto la cuota vencida más antigua con su monto exacto, muestra la prelación antes de confirmar y estados claros para monto no exacto (con el monto correcto), crédito incobrable, cuota ya pagada, fecha inválida y clave repetida (reintento sin efecto).
10. Estados de carga, vacío, éxito y error; navegación por teclado, foco visible, etiquetas, contraste suficiente y mensajes comprensibles.
11. Actualiza en el README la tabla pantalla <-> caso de uso.
12. Demuestra correspondencia directa con las siete pantallas del prototipo P2 mediante nombre, flujo, propósito y evidencia visual.
13. Corrige en la implementación cualquier cifra ficticia del prototipo; no modifiques el núcleo para que coincida con Figma.
14. Cartera en riesgo: saldo de capital completo de créditos con más de 30 días de atraso más reestructurados, sobre cartera activa; excluye incobrables de la base y reporta por separado lo dado por incobrable.
15. Crea `docs/proyecto-final/migracion-vistas-react.md`: cada HTML de `vistas/`, su ruta/componente, estado `MIGRADO`, `CONSOLIDADO`, `SOLO REFERENCIA` o `FUERA DE E1`, y evidencia de prueba.
16. Extrae componentes reutilizables para layout móvil de asesor, layout web de gerencia, encabezados, navegación, tarjetas, tablas, formularios, diálogos, estados y comprobantes. No copies el HTML generado ni sus clases opacas.
17. Traduce los tokens de `shared.css` y `design.css` al tema de Tailwind y a CSS semántico. Copia solo los recursos usados a `web/src/assets/design/`, conservando licencias; la aplicación no depende de `../vistas/` en producción.
18. Reimplementa las interacciones de `app.js` y `asesor.js` con componentes controlados, hooks, validación Zod y llamadas reales. Sin manipulación directa del DOM.
19. Elimina del build los paneles de herramientas del prototipo, avisos de demostración y enlaces a `index.html`.
20. Pruebas de rutas y componentes críticos con estados de carga, vacío, error y éxito, y al menos un recorrido automatizado por cada flujo obligatorio.
21. Revisión visual responsive a 320, 375, 403 y 768 px para asesor, y escritorio para gerencia; registra diferencias justificadas.

## Validación funcional obligatoria

Prepara los flujos para OP-1 a OP-6 sin insertar resultados manuales, con fecha `2026-10-31`. Ensaya el guion completo sobre una base recién cargada (`db:reset` + carga) y verifica los estados de entrada de la tabla de situación al corte.

La tabla de situación al corte del maestro es solo verificación: no se copia a la interfaz, a fixtures de producción ni a la documentación de usuario. Las pruebas que la contrasten deben obtener sus valores del núcleo sobre la carga oficial.

## Criterio de salida

Los tres flujos se recorren completos contra la API real. Ningún botón depende de mocks ni de datos de relleno, y ninguna fórmula financiera vive en el frontend. La aplicación no carga archivos `.html` de `vistas/` en tiempo de ejecución.

---
