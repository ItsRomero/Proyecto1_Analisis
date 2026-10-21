# Migración de `vistas/` a React

Inventario de los 56 archivos HTML reales de `vistas/` (55 frames y `index.html`) y su destino en `web/`. La aplicación no carga ningún HTML de `vistas/` en tiempo de ejecución: `tests/e2e/recorridos.e2e.ts` registra cada solicitud del navegador y lo verifica. Tampoco se usan `iframe` ni `dangerouslySetInnerHTML`.

Recuento: CONSOLIDADO: 28, FUERA DE E1: 8, MIGRADO: 18, SOLO REFERENCIA: 2.

- **MIGRADO**: el frame tiene una pantalla o un estado React equivalente.
- **CONSOLIDADO**: el frame es un paso, una variante o un estado resuelto dentro de otro componente.
- **SOLO REFERENCIA**: material de revisión, no operativo.
- **FUERA DE E1**: no forma parte de las siete pantallas obligatorias o depende de algo fuera de alcance.

## Correspondencia con las siete pantallas obligatorias

| Pantalla P2 | Ruta React | Casos de uso |
| --- | --- | --- |
| 1. Solicitud de crédito (alta como primer paso) | `/asesor/creditos/nuevo` | `altaCliente`, `solicitarCredito`, `simularPlan`, `aprobarCredito`/`rechazarCredito`, `desembolsarCredito` |
| 2. Detalle del crédito | `/asesor/creditos/:creditoId` | `consultarFichaCredito`, `listarPagos` |
| 3. Registro de pago | `/asesor/creditos/:creditoId/pagos/nuevo` | `calcularDeudaCuota`, `proponerPago`, `confirmarPago`, `cancelarPropuesta` |
| 4. Plan de amortización | `/asesor/creditos/:creditoId/plan` | `consultarPlan`, `consultarCredito` |
| 5. Detalle de la mora | `/asesor/creditos/:creditoId/mora` | `consultarCredito`, `explicarMora`, `calcularDeudaCuota` |
| 6. Tablero gerencial | `/gerencia` | `consultarCartera`, `consultarCierre` |
| 7. Cierre diario/mensual | `/gerencia/cierres/diario`, `/gerencia/cierres/mensual` | `consultarCierre`, `generarCierre` |

## Inventario completo

| Archivo | Ruta / componente | Estado | Decisión | Evidencia de prueba |
| --- | --- | --- | --- | --- |
| `asesor-busqueda-17-4042.html` | `/asesor/clientes` · `ClientesAsesor` | CONSOLIDADO | Nombre A-Z es el selector de orden; Búsqueda es el campo de búsqueda; Inicio es la misma entrada. | `tests/e2e/recorridos.e2e.ts` (OP-1) |
| `asesor-confirmacion-12-1534.html` | `RegistrarPago` (confirmación explícita) | CONSOLIDADO | Diálogo previo al registro; solo esa aprobación registra el pago. | `tests/e2e/recorridos.e2e.ts`, `web/src/pruebas/interfaz.test.tsx` |
| `asesor-detalle-de-mora-12-1040.html` | `/asesor/creditos/:creditoId/mora` · `DetalleMora` | MIGRADO | Una tarjeta por cuota vencida: días, política, tramos recorridos, tasa, capital en mora e interés del núcleo. Política plana: un solo tramo. | `tests/e2e/recorridos.e2e.ts` (OP-2) |
| `asesor-detalle-del-credito-11-591.html` | `/asesor/creditos/:creditoId` · `DetalleCredito` | MIGRADO | Franja de tramo, resumen y accesos a pago, plan y mora; pagos registrados e historial de estados. | `tests/e2e/recorridos.e2e.ts` (OP-1) |
| `asesor-inicio-17-3107.html` | `/asesor/clientes` · `ClientesAsesor` | CONSOLIDADO | Nombre A-Z es el selector de orden; Búsqueda es el campo de búsqueda; Inicio es la misma entrada. | `tests/e2e/recorridos.e2e.ts` (OP-1) |
| `asesor-nombre-a-z-11-393.html` | `/asesor/clientes` · `ClientesAsesor` | CONSOLIDADO | Nombre A-Z es el selector de orden; Búsqueda es el campo de búsqueda; Inicio es la misma entrada. | `tests/e2e/recorridos.e2e.ts` (OP-1) |
| `asesor-nuevo-cliente-1-85-873.html` | `/asesor/creditos/nuevo` paso 1 · `PasoCliente` | CONSOLIDADO | Los seis pasos del alta se consolidan en un formulario validado con `altaClienteFinalSchema`; teléfono opcional. No se simula verificación de DPI. | `tests/e2e/recorridos.e2e.ts` (OP-3), `web/src/pruebas/interfaz.test.tsx` (validación) |
| `asesor-nuevo-cliente-2-85-935.html` | `/asesor/creditos/nuevo` paso 1 · `PasoCliente` | CONSOLIDADO | Los seis pasos del alta se consolidan en un formulario validado con `altaClienteFinalSchema`; teléfono opcional. No se simula verificación de DPI. | `tests/e2e/recorridos.e2e.ts` (OP-3), `web/src/pruebas/interfaz.test.tsx` (validación) |
| `asesor-nuevo-cliente-3-85-996.html` | `/asesor/creditos/nuevo` paso 1 · `PasoCliente` | CONSOLIDADO | Los seis pasos del alta se consolidan en un formulario validado con `altaClienteFinalSchema`; teléfono opcional. No se simula verificación de DPI. | `tests/e2e/recorridos.e2e.ts` (OP-3), `web/src/pruebas/interfaz.test.tsx` (validación) |
| `asesor-nuevo-cliente-4-85-1092.html` | `/asesor/creditos/nuevo` paso 1 · `PasoCliente` | CONSOLIDADO | Los seis pasos del alta se consolidan en un formulario validado con `altaClienteFinalSchema`; teléfono opcional. No se simula verificación de DPI. | `tests/e2e/recorridos.e2e.ts` (OP-3), `web/src/pruebas/interfaz.test.tsx` (validación) |
| `asesor-nuevo-cliente-5-85-1188.html` | `/asesor/creditos/nuevo` paso 1 · `PasoCliente` | CONSOLIDADO | Los seis pasos del alta se consolidan en un formulario validado con `altaClienteFinalSchema`; teléfono opcional. No se simula verificación de DPI. | `tests/e2e/recorridos.e2e.ts` (OP-3), `web/src/pruebas/interfaz.test.tsx` (validación) |
| `asesor-nuevo-cliente-6-85-1294.html` | `/asesor/creditos/nuevo` paso 1 · `PasoCliente` | CONSOLIDADO | Los seis pasos del alta se consolidan en un formulario validado con `altaClienteFinalSchema`; teléfono opcional. No se simula verificación de DPI. | `tests/e2e/recorridos.e2e.ts` (OP-3), `web/src/pruebas/interfaz.test.tsx` (validación) |
| `asesor-pago-aplicado-15-2083.html` | `RegistrarPago` (resultado) y `/asesor/creditos/:creditoId/pagos/:pagoId` · `ComprobanteRegistrado` | MIGRADO | Comprobante con la prelación aplicada, estado posterior y reintento con la misma clave (OP-4). | `tests/e2e/recorridos.e2e.ts` (OP-1, OP-4) |
| `asesor-plan-de-amortizacion-12-741.html` | `/asesor/creditos/:creditoId/plan` · `PlanPagos` | MIGRADO | Plan persistido con vencimientos (R-2); el estado de cada cuota sale de los conteos de `consultarCredito`. | `tests/e2e/recorridos.e2e.ts` (responsive) |
| `asesor-prioridad-11-196.html` | `/asesor/clientes` · `ClientesAsesor` | MIGRADO | Lista de clientes ordenada por días de atraso del núcleo. | `tests/e2e/recorridos.e2e.ts` (OP-1), `web/src/pruebas/interfaz.test.tsx` (vacío) |
| `asesor-prototipo-asesor-de-credito-85-1933.html` | — | SOLO REFERENCIA | Lámina de presentación del prototipo; no es una pantalla operativa. | — |
| `asesor-registrar-pago-12-1309.html` | `/asesor/creditos/:creditoId/pagos/nuevo` · `RegistrarPago` (formulario) | MIGRADO | Monto exacto prellenado desde `calcularDeudaCuota`; se eliminan los atajos de 1/2/3 cuotas (R-1: un pago liquida la cuota más antigua). | `tests/e2e/recorridos.e2e.ts` (OP-1, OP-2, OP-5, OP-6), `web/src/pruebas/interfaz.test.tsx` |
| `asesor-registrar-pago-12-1388.html` | `/asesor/creditos/:creditoId/pagos/nuevo` · `RegistrarPago` (formulario) | MIGRADO | Monto exacto prellenado desde `calcularDeudaCuota`; se eliminan los atajos de 1/2/3 cuotas (R-1: un pago liquida la cuota más antigua). | `tests/e2e/recorridos.e2e.ts` (OP-1, OP-2, OP-5, OP-6), `web/src/pruebas/interfaz.test.tsx` |
| `asesor-registrar-pago-v1-85-1397.html` | `RegistrarPago` (estados de la propuesta) | CONSOLIDADO | Las variantes V1–V3.5 son estados del mismo flujo: monto, prelación, monto no exacto y propuesta. | `web/src/pruebas/interfaz.test.tsx` |
| `asesor-registrar-pago-v2-85-1539.html` | `RegistrarPago` (estados de la propuesta) | CONSOLIDADO | Las variantes V1–V3.5 son estados del mismo flujo: monto, prelación, monto no exacto y propuesta. | `web/src/pruebas/interfaz.test.tsx` |
| `asesor-registrar-pago-v3-1-85-1823.html` | `RegistrarPago` (estados de la propuesta) | CONSOLIDADO | Las variantes V1–V3.5 son estados del mismo flujo: monto, prelación, monto no exacto y propuesta. | `web/src/pruebas/interfaz.test.tsx` |
| `asesor-registrar-pago-v3-2-85-2075.html` | `RegistrarPago` (estados de la propuesta) | CONSOLIDADO | Las variantes V1–V3.5 son estados del mismo flujo: monto, prelación, monto no exacto y propuesta. | `web/src/pruebas/interfaz.test.tsx` |
| `asesor-registrar-pago-v3-3-85-2187.html` | `RegistrarPago` (estados de la propuesta) | CONSOLIDADO | Las variantes V1–V3.5 son estados del mismo flujo: monto, prelación, monto no exacto y propuesta. | `web/src/pruebas/interfaz.test.tsx` |
| `asesor-registrar-pago-v3-4-85-2305.html` | `RegistrarPago` (estados de la propuesta) | CONSOLIDADO | Las variantes V1–V3.5 son estados del mismo flujo: monto, prelación, monto no exacto y propuesta. | `web/src/pruebas/interfaz.test.tsx` |
| `asesor-registrar-pago-v3-5-85-2424.html` | `RegistrarPago` (estados de la propuesta) | CONSOLIDADO | Las variantes V1–V3.5 son estados del mismo flujo: monto, prelación, monto no exacto y propuesta. | `web/src/pruebas/interfaz.test.tsx` |
| `asesor-registrar-pago-v3-85-1681.html` | `RegistrarPago` (estados de la propuesta) | CONSOLIDADO | Las variantes V1–V3.5 son estados del mismo flujo: monto, prelación, monto no exacto y propuesta. | `web/src/pruebas/interfaz.test.tsx` |
| `asesor-sin-senal-12-1646.html` | `AvisoSinConexion` en `RegistrarPago` | CONSOLIDADO | Estado reutilizable sin conexión; el reintento usa la misma clave. | `web/src/pruebas/interfaz.test.tsx` (sin conexión) |
| `asesor-sin-senal-guardado-1-15-1760.html` | — | FUERA DE E1 | Guardado local y sincronización: la cola sin conexión no se implementa y por eso no se simula. | — |
| `asesor-sin-senal-guardado-2-15-1877.html` | — | FUERA DE E1 | Guardado local y sincronización: la cola sin conexión no se implementa y por eso no se simula. | — |
| `asesor-sin-senal-guardado-3-15-1996.html` | — | FUERA DE E1 | Guardado local y sincronización: la cola sin conexión no se implementa y por eso no se simula. | — |
| `asesor-solicitar-credito-0-1-85-507.html` | `/asesor/creditos/nuevo` paso 2 · `PasoSolicitud` | CONSOLIDADO | Datos de la solicitud validados con `originarCreditoSchema`. | `tests/e2e/recorridos.e2e.ts` (OP-3) |
| `asesor-solicitar-credito-0-85-376.html` | `/asesor/creditos/nuevo` paso 2 · `PasoSolicitud` | CONSOLIDADO | Datos de la solicitud validados con `originarCreditoSchema`. | `tests/e2e/recorridos.e2e.ts` (OP-3) |
| `asesor-solicitar-credito-1-85-725.html` | `/asesor/creditos/nuevo` paso 2 · `PasoSolicitud` | CONSOLIDADO | Datos de la solicitud validados con `originarCreditoSchema`. | `tests/e2e/recorridos.e2e.ts` (OP-3) |
| `asesor-solicitar-credito-2-15-2405.html` | `/asesor/creditos/nuevo` paso 3 · `PasoSimulacion` | MIGRADO | Plan con fechas de `simularPlan`; las cifras del frame se sustituyen por las del núcleo. Sin fila de totales (la interfaz no suma importes). | `tests/e2e/recorridos.e2e.ts` (OP-3, cuota 1 el 30/11/2026) |
| `asesor-solicitar-credito-3-15-2899.html` | `/asesor/creditos/nuevo` pasos 4–5 · confirmación y `PasoDecision` | CONSOLIDADO | Confirmación de la solicitud y aprobación del comité con perfil Gerencia en el mismo recorrido (D-6). | `tests/e2e/recorridos.e2e.ts` (OP-3) |
| `asesor-solicitar-credito-4-15-3021.html` | `/asesor/creditos/nuevo` paso 6 · `PasoDesembolso` | MIGRADO | Desembolso real (faltaba en P2) con el resultado del núcleo. | `tests/e2e/recorridos.e2e.ts` (OP-3) |
| `asesor-user-17-3391.html` | `BarraSesion` (selector de perfil y fecha de corte) | CONSOLIDADO | El menú de usuario se sustituye por el selector de perfil de demostración (ADR-014). | `tests/e2e/recorridos.e2e.ts` |
| `gerencia-cartera-103-7580.html` | `/gerencia/cartera` y `/gerencia/cartera/tramos/:tramo` · `Cartera`, `CreditosTramo` | MIGRADO | Riesgo por tramo con porcentajes del núcleo y lista de créditos del tramo. | `tests/e2e/recorridos.e2e.ts` (G-4) |
| `gerencia-cierre-1-103-9199.html` | `/gerencia/cierres/diario` y `/mensual` · `Cierre` (vista previa) | MIGRADO | Vista previa con desembolsos y recuperaciones por concepto (D-8). | `tests/e2e/recorridos.e2e.ts` (G-2) |
| `gerencia-cierre-2-103-9370.html` | `Cierre` (confirmación y cierre generado) | CONSOLIDADO | Confirmación y snapshot generado; generarlo otra vez devuelve el mismo. | `tests/e2e/recorridos.e2e.ts` (G-3) |
| `gerencia-cierre-3-103-9511.html` | `Cierre` (confirmación y cierre generado) | CONSOLIDADO | Confirmación y snapshot generado; generarlo otra vez devuelve el mismo. | `tests/e2e/recorridos.e2e.ts` (G-3) |
| `gerencia-clientes-103-8224.html` | `/gerencia/clientes` · `ClientesGerencia` | MIGRADO | Clientes y créditos al corte, sin DPI ni teléfono. | `tests/servicios-final.test.ts` (sin PII) |
| `gerencia-confirmar-aprobacion-103-9670.html` | `/gerencia/solicitudes/:solicitudId/decision` · `DecisionSolicitud` | CONSOLIDADO | Aprobación y rechazo en un mismo componente de decisión con motivo. | `tests/integracion/api-http.integration.ts` |
| `gerencia-confirmar-rechazo-103-10164.html` | `/gerencia/solicitudes/:solicitudId/decision` · `DecisionSolicitud` | CONSOLIDADO | Aprobación y rechazo en un mismo componente de decisión con motivo. | `tests/integracion/api-http.integration.ts` |
| `gerencia-ingreso-1-101-4501.html` | — | FUERA DE E1 | Autenticación empresarial fuera de alcance; el perfil se elige con el selector. | — |
| `gerencia-ingreso-2-107-10599.html` | — | FUERA DE E1 | Autenticación empresarial fuera de alcance; el perfil se elige con el selector. | — |
| `gerencia-prototipo-microcreditos-web-103-7192.html` | `/gerencia` · `Tablero` | MIGRADO | Cartera activa, en mora, riesgo por tramo e incobrable del período; desembolsos y recuperaciones del mes. Se omite el gráfico de seis meses (no hay serie del núcleo). | `tests/e2e/recorridos.e2e.ts` (G-1), `web/src/pruebas/interfaz.test.tsx` (error) |
| `gerencia-solicitudes-103-8780.html` | `/gerencia/solicitudes` · `Solicitudes` | MIGRADO | Solicitudes pendientes de comité o desembolso. | `tests/integracion/api-http.integration.ts` |
| `index.html` | — | SOLO REFERENCIA | Directorio de revisión del prototipo; no se migra (regla global 20). | — |
| `usuario-ayuda-1-92-3822.html` | `/usuario/ayuda` | MIGRADO | Preguntas frecuentes desplegables; sin teléfono ficticio. | `web/src/pruebas/usuario.test.tsx` |
| `usuario-ayuda-2-92-3942.html` | `/usuario/...` (no implementado) | FUERA DE E1 | Vista del cliente: complementaria según el maestro; no retrasa E1. | — |
| `usuario-detalle-del-credito-92-3310.html` | `/usuario/creditos/:creditoId` | MIGRADO | Condiciones, atraso e historial real; lectura limitada al cliente de la sesión. | `tests/usuario-http.test.ts`, `web/src/pruebas/usuario.test.tsx` |
| `usuario-ingreso-1-92-2940.html` | `/usuario/...` (no implementado) | FUERA DE E1 | Vista del cliente: complementaria según el maestro; no retrasa E1. | — |
| `usuario-ingreso-2-92-3250.html` | `/usuario/...` (no implementado) | FUERA DE E1 | Vista del cliente: complementaria según el maestro; no retrasa E1. | — |
| `usuario-inicio-92-3081.html` | `/usuario/inicio` | MIGRADO | Capital pendiente, próxima cuota y avance con datos reales. | `web/src/pruebas/usuario.test.tsx` |
| `usuario-plan-de-cuotas-92-3528.html` | `/usuario/creditos/:creditoId/plan` | MIGRADO | Tabla móvil de cuotas contractuales y estado al corte. | `web/src/pruebas/usuario.test.tsx` |

## Sistema visual

- Los tokens de `vistas/css/shared.css` y `design.css` (tinta, superficie, línea, acento, tenue, éxito, peligro, atraso y colores de tramo) se tradujeron al `@theme` de Tailwind v4 en `web/src/estilos.css`.
- Las fuentes Outfit (asesor), Inter (gerencia) y DM Mono (cifras) se copiaron con sus licencias a `web/src/assets/design/fuentes/`, y once SVG del prototipo a `web/src/assets/design/iconos/` (origen en `ORIGEN.md`).
- Las interacciones de `app.js` y `asesor.js` (búsqueda, orden, campos, avisos) se reimplementaron con componentes controlados y llamadas a la API, sin manipular el DOM directamente.
- No pasaron al build los paneles de herramientas del prototipo, los avisos de demostración ni los enlaces a `index.html`.

## Diferencias justificadas respecto al prototipo

| Diferencia | Motivo |
| --- | --- |
| Cifras de ejemplo de Figma (gastos de Q150, cuota 12 sin explicar, totales del tablero) | Se sustituyen por las del núcleo; el prototipo no es fuente de datos. |
| Mora 1 y Mora 2 un tono más oscuros (`#a16207`, `#c2410c`) | Contraste de texto blanco ≥ 4.5:1 (WCAG 2.2 AA); los tonos originales no lo alcanzaban. |
| Sin atajos de pago de 2 o 3 cuotas | R-1 y D-2: un pago liquida exactamente la cuota vencida más antigua. |
| Sin "Guardado localmente / Sincronizado" | No existe cola sin conexión; mostrarlo sería simular una función ausente. |
| Sin gráfico de desembolsos de seis meses en el tablero | El núcleo no publica esa serie; inventarla violaría la regla de cifras. |
| Sin fila de totales en el plan simulado | La interfaz no suma importes; capital y cuota vienen del núcleo. |
| La tabla del plan tiene desplazamiento horizontal propio por debajo de 480 px | Seis columnas de importes exactos; la página no se desplaza (ver `evidencia/fase3-responsive.txt`). |
| Selector de perfil y fecha de corte visibles en ambos perfiles | Exigencia del video (ADR-014) y regla de fecha inyectada. |
