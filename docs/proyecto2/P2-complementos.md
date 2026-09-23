# Proyecto 2 · Complementos al documento de entrega

Crédito Vecino, S. A. · Análisis de Sistemas II (037) · Repositorio: https://github.com/ItsRomero/Proyecto1_Analisis

Este documento reúne cuatro agregados solicitados después de revisar el documento de entrega. Cada sección indica **dónde insertarse** en el documento principal.

| # | Agregado | Dónde va en el documento de entrega |
|---|---|---|
| 1 | Wireframes (skeleton y anotados) alineados con Figma (E2) | Capítulo 3, reemplaza §3.4 «Wireframes de baja fidelidad» y el Anexo A |
| 2 | Diagrama y tabla de casos de uso | Capítulo 3, junto a §3.3 «Tabla de correspondencia pantalla ↔ caso de uso» |
| 3 | Registros de decisiones de arquitectura (ADR) | Capítulo 7 (ADR-004, E6) y capítulo 5 (ADR-005, E4) |
| 4 | Repositorio e historial de commits con hipervínculos a GitHub | Capítulo 8, reemplaza las tablas de §8.1 y §8.2.1 |

> ¹ Los enlaces marcados con **¹** apuntan a archivos que se agregaron en la rama `docs/proyecto2-ux`. Funcionarán en GitHub en cuanto esa rama se integre a `main` (`git am docs-proyecto2-ux.patch` y `git push`). Los demás enlaces ya funcionan.

---

## 1. E2 · Wireframes alineados con el prototipo de Figma

### 1.1 Una sola fuente de diseño

Los wireframes del E2 se rehicieron **tomando como referencia el [prototipo de Figma](https://www.figma.com/proto/jozM3QI8ZJ6pywdCoO5OVo/Microcr%C3%A9ditos-App?node-id=0-1&t=PJlTVLC3ASu31ttw-1)**, para que la documentación y el prototipo no se desfasen. Cada pantalla se describe una sola vez y se dibuja en dos niveles a partir de esa misma descripción (script [`generar_wireframes_figma.py`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/wireframes/generar_wireframes_figma.py) ¹):

| Nivel | Qué muestra | Para qué sirve | Archivos |
|---|---|---|---|
| 1 · Skeleton | Solo bloques grises que indican dónde va cada elemento | Acordar la estructura y la jerarquía de cada pantalla | [`wireframes/skeleton/`](https://github.com/ItsRomero/Proyecto1_Analisis/tree/main/docs/proyecto2/wireframes/skeleton) ¹ |
| 2 · Wireframe anotado | Los mismos bloques con textos, cifras del núcleo y notas numeradas | Justificar decisiones (prevención de errores, WCAG, jerarquía) | [`wireframes/anotado/`](https://github.com/ItsRomero/Proyecto1_Analisis/tree/main/docs/proyecto2/wireframes/anotado) ¹ |
| 3 · Alta fidelidad | Color, tipografía, componentes y navegación | Evaluación con usuarios (E3 y E5) | [Prototipo de Figma](https://www.figma.com/proto/jozM3QI8ZJ6pywdCoO5OVo/Microcr%C3%A9ditos-App?node-id=0-1&t=PJlTVLC3ASu31ttw-1) |

Los códigos son los mismos en todos los documentos:

- **P01–P14:** pantallas que **ya existen en Figma**; el skeleton y el wireframe reproducen su disposición, sus componentes y el orden de sus bloques.
- **G01–G07:** pantallas que el enunciado exige y que **faltan en Figma**; son la **guía para construirlas** con el mismo lenguaje visual (encabezado oscuro, tarjetas blancas, botón principal abajo).

Donde una cifra del prototipo no coincide con el núcleo, el wireframe anotado muestra la cifra correcta con la marca **"CORREGIR EN FIGMA"**, para que el ajuste en Figma se haga sobre la misma pantalla.

### 1.2 Qué va en cada bloque

| Código | Pantalla | Qué indica cada bloque | Caso de uso |
|---|---|---|---|
| P01 | Iniciar sesión | Encabezado con marca; tarjeta con usuario y contraseña; botón Ingresar; enlace de soporte | — |
| P02 | Mis Clientes | Encabezado con búsqueda y avatar; selector Prioridad / Nombre A–Z; tarjetas de cliente (iniciales, nombre, municipio, saldo, etiqueta de tramo, días); botón + | CU-15 |
| P03 | Mi perfil | Tarjeta de la asesora; estado operativo y de sincronización; resumen de cartera; cuenta y sesión | — (soporte) |
| P04 | Nueva solicitud · paso 1 | Lista de clientes; monto con − / + y montos rápidos; plazo en botones; cuota mensual estimada; botón Ver plan | CU-02 |
| P05 | Simulación de pago · paso 2 | Resumen (capital, cuota, interés total); tabla de 12 cuotas con la última resaltada; Modificar / Confirmar | CU-02 |
| P06 | Confirmar solicitud · paso 3 | Aviso "Revise antes de enviar"; datos de la solicitud en cuadrícula; Enviar solicitud; Cancelar | CU-02 |
| P07 | Solicitud enviada | Encabezado de éxito; número de referencia; ¿Qué sigue?; Volver al inicio | CU-02 |
| P08 | Detalle del crédito | Encabezado con nombre; ubicación y teléfono; estado y tramo; resumen del crédito; Registrar pago; Plan de pago / Detalle mora | CU-15 · CU-08 |
| P09 | Plan de amortización | Resumen (capital, interés, total); tabla de 12 cuotas con la 12 resaltada; explicación del ajuste | CU-15 |
| P10 | Detalle de mora | Resumen (días, capital en mora, mora total); una tarjeta por tramo recorrido; cálculo con nota de redondeo; Registrar pago ahora | CU-08 |
| P11 | Registrar pago | Monto recibido con atajos; prelación de aplicación con barras; Revisar y confirmar | CU-07 |
| P12 | Confirmar pago | Aviso "Confirme antes de aplicar"; monto y fecha; distribución; demo sin señal; Aplicar pago; Modificar monto | CU-07 |
| P13 | Pago aplicado | Encabezado de éxito con monto; número de comprobante; cliente; distribución y saldo; WhatsApp / Imprimir | CU-07 |
| P14 | Sin señal | Encabezado sin señal; aviso; pago en cola con folio fijo; estado de sincronización; Sincronizar ahora | CU-07 |
| G01 | Alta de cliente (guía) | Foto del DPI; datos del cliente; estado del borrador; continuar a la solicitud | CU-01 |
| G02 | Confirmación de desembolso (guía) | Aviso; condiciones con política de mora; aceptación; Desembolsar; Volver y corregir | CU-06 |
| G03 | Bandeja del comité (guía) | Lista de solicitudes; datos, evaluación y plan; motivo; Aprobar / Rechazar | CU-03/04/05 |
| G04 | Tablero gerencial (guía) | Contexto; 1 riesgo · 2 incobrables · 3 mora; 4 riesgo por tramo; actividad del período; panel del asistente | CU-14 |
| G05 | Créditos de un tramo (guía) | Ruta de navegación; resumen del tramo; tabla de créditos | CU-14 |
| G06 | Cierre diario / mensual (guía) | Estado congelado e identificador; cifras del cierre; ejecutar con confirmación | CU-12/13 |
| G07 | Tablero en teléfono (guía) | Mismas tarjetas apiladas; riesgo por tramo en lista | CU-14 |

Convenciones del skeleton: las barras grises son textos, los círculos son avatares o íconos, los bloques más oscuros son los elementos principales (la cifra principal, la opción elegida o el botón primario) y las etiquetas pequeñas nombran la región.

### 1.3 Skeleton y wireframe anotado de cada pantalla

A la izquierda, el skeleton; a la derecha, el wireframe anotado de la misma pantalla.

![P01 · Iniciar sesión · skeleton](wireframes/skeleton/P01-iniciar-sesion.svg) ![P01 · anotado](wireframes/anotado/P01-iniciar-sesion.svg)

![P02 · Mis Clientes · skeleton](wireframes/skeleton/P02-mis-clientes.svg) ![P02 · anotado](wireframes/anotado/P02-mis-clientes.svg)

![P03 · Mi perfil · skeleton](wireframes/skeleton/P03-mi-perfil.svg) ![P03 · anotado](wireframes/anotado/P03-mi-perfil.svg)

![P04 · Nueva solicitud (paso 1) · skeleton](wireframes/skeleton/P04-nueva-solicitud.svg) ![P04 · anotado](wireframes/anotado/P04-nueva-solicitud.svg)

![P05 · Simulación de pago (paso 2) · skeleton](wireframes/skeleton/P05-simulacion-pago.svg) ![P05 · anotado](wireframes/anotado/P05-simulacion-pago.svg)

![P06 · Confirmar solicitud (paso 3) · skeleton](wireframes/skeleton/P06-confirmar-solicitud.svg) ![P06 · anotado](wireframes/anotado/P06-confirmar-solicitud.svg)

![P07 · Solicitud enviada · skeleton](wireframes/skeleton/P07-solicitud-enviada.svg) ![P07 · anotado](wireframes/anotado/P07-solicitud-enviada.svg)

![P08 · Detalle del crédito · skeleton](wireframes/skeleton/P08-detalle-credito.svg) ![P08 · anotado](wireframes/anotado/P08-detalle-credito.svg)

![P09 · Plan de amortización · skeleton](wireframes/skeleton/P09-plan-amortizacion.svg) ![P09 · anotado](wireframes/anotado/P09-plan-amortizacion.svg)

![P10 · Detalle de mora · skeleton](wireframes/skeleton/P10-detalle-mora.svg) ![P10 · anotado](wireframes/anotado/P10-detalle-mora.svg)

![P11 · Registrar pago · skeleton](wireframes/skeleton/P11-registrar-pago.svg) ![P11 · anotado](wireframes/anotado/P11-registrar-pago.svg)

![P12 · Confirmar pago · skeleton](wireframes/skeleton/P12-confirmar-pago.svg) ![P12 · anotado](wireframes/anotado/P12-confirmar-pago.svg)

![P13 · Pago aplicado · skeleton](wireframes/skeleton/P13-pago-aplicado.svg) ![P13 · anotado](wireframes/anotado/P13-pago-aplicado.svg)

![P14 · Sin señal · skeleton](wireframes/skeleton/P14-sin-senal.svg) ![P14 · anotado](wireframes/anotado/P14-sin-senal.svg)

![G01 · Alta de cliente (guía) · skeleton](wireframes/skeleton/G01-alta-cliente.svg) ![G01 · anotado](wireframes/anotado/G01-alta-cliente.svg)

![G02 · Confirmación de desembolso (guía) · skeleton](wireframes/skeleton/G02-confirmacion-desembolso.svg) ![G02 · anotado](wireframes/anotado/G02-confirmacion-desembolso.svg)

![G03 · Bandeja del comité (guía) · skeleton](wireframes/skeleton/G03-bandeja-comite.svg) ![G03 · anotado](wireframes/anotado/G03-bandeja-comite.svg)

![G04 · Tablero gerencial (guía) · skeleton](wireframes/skeleton/G04-tablero-gerencial.svg) ![G04 · anotado](wireframes/anotado/G04-tablero-gerencial.svg)

![G05 · Créditos de un tramo (guía) · skeleton](wireframes/skeleton/G05-creditos-tramo.svg) ![G05 · anotado](wireframes/anotado/G05-creditos-tramo.svg)

![G06 · Cierre diario / mensual (guía) · skeleton](wireframes/skeleton/G06-cierre.svg) ![G06 · anotado](wireframes/anotado/G06-cierre.svg)

![G07 · Tablero en teléfono (guía) · skeleton](wireframes/skeleton/G07-tablero-movil.svg) ![G07 · anotado](wireframes/anotado/G07-tablero-movil.svg)

---

## 2. Casos de uso

### 2.1 Diagrama

El diagrama muestra los actores, los casos de uso del P1 que tienen pantalla en el P2 y la pantalla que los implementa. Complementa la tabla 6.1 del capítulo 3 y el diagrama completo del P1 ([`01-casos-de-uso.puml`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/diagramas/uml/01-casos-de-uso.puml)).

![Diagrama de casos de uso del Proyecto 2](wireframes/casos-de-uso-p2.svg)

### 2.2 Los 18 casos de uso del P1 y su pantalla

| CU | Caso de uso | Actor principal | Puerto primario (P1) | Pantalla en el P2 (anotado · skeleton) |
|---|---|---|---|---|
| CU-01 | Registrar cliente | Asesora | `RegistrarCliente` | G01 Alta de cliente (guía) |
| CU-02 | Solicitar crédito | Asesora / cliente | `SolicitarCredito` | P04 → P05 → P06 → P07 |
| CU-03 | Evaluar crédito | Analista / comité | `EvaluarCredito` | G03 Bandeja del comité (guía) |
| CU-04 | Aprobar solicitud | Comité | `DecidirSolicitud` | G03 (guía) |
| CU-05 | Rechazar solicitud | Comité | `DecidirSolicitud` | G03 (guía) |
| CU-06 | Desembolsar crédito | Encargado de desembolsos | `DesembolsarCredito` | G02 Confirmación de desembolso (guía) |
| CU-07 | Registrar pago | Asesora / cajero | `RegistrarPago` | P11 → P12 → P13 / P14 |
| CU-08 | Calcular mora | Gestor de cartera / proceso | `CalcularMora` | P10 Detalle de mora (y P08) |
| CU-09 | Regularizar crédito | Gestor de cobros | `RegistrarPago` (extend) | Resultado del pago; sin pantalla propia |
| CU-10 | Reestructurar crédito | Aprobador autorizado | `ReestructurarCredito` | Fuera del alcance de E3 (Proyecto Final) |
| CU-11 | Declarar incobrable | Encargado autorizado | `DeclararIncobrable` | Fuera del alcance de E3; su efecto se ve en G04 |
| CU-12 | Generar cierre diario | Financiero / proceso | `GenerarCierre` | G06 Cierre (guía) |
| CU-13 | Generar cierre mensual | Financiero / proceso | `GenerarCierre` | G06 Cierre (guía) |
| CU-14 | Consultar cartera en riesgo | Gerencia / riesgo | `ConsultarCarteraEnRiesgo` | G04, G05, G07 (guías) |
| CU-15 | Consultar crédito e historial | Asesora / auditor / gestor | `ConsultarCredito` | P02 Mis Clientes, P08, P09 |
| CU-16 | Administrar política | Administrador de políticas | `AdministrarPolitica` | Fuera del alcance de E3 |
| CU-17 | Anular crédito aprobado | Aprobador / proceso | `DecidirSolicitud` | Fuera del alcance de E3 |
| CU-18 | Cancelar crédito | Sistema (resultado del pago) | `RegistrarPago` (extend) | Sin pantalla: ocurre al dejar el saldo en Q0.00 |

Ningún caso de uso **principal** queda sin pantalla (sección 6.1 del enunciado). Los que no tienen pantalla son administrativos (CU-10, CU-11, CU-16 y CU-17, previstos para el Proyecto Final) o son el resultado automático de un pago (CU-09 y CU-18). La fuente de la tabla es [`FASE-01-analisis-dominio-requisitos.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/analisis/FASE-01-analisis-dominio-requisitos.md), sección 13.

---

## 3. Registros de decisiones de arquitectura (ADR)

Un ADR registra una decisión de arquitectura con su contexto, las alternativas descartadas y sus consecuencias. El proyecto tiene cinco:

| ADR | Decisión | Proyecto | Estado | Archivo |
|---|---|---|---|---|
| ADR-001 | Arquitectura hexagonal con monolito modular | P1 | Aceptada | [`ADR-001-arquitectura.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/adr/ADR-001-arquitectura.md) |
| ADR-002 | Representación del dinero (`Dinero`, decimal exacto, redondeo) | P1 | Aceptada | [`ADR-002-dinero.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/adr/ADR-002-dinero.md) |
| ADR-003 | Plan de amortización francés con ajuste final | P1 | Aceptada | [`ADR-003-amortizacion.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/adr/ADR-003-amortizacion.md) |
| **ADR-004** | **Políticas moratorias coexistentes por fecha de otorgamiento** | P2 · E6 | Aceptada | [`ADR-004-politica-mora-escalonada.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/adr/ADR-004-politica-mora-escalonada.md) |
| **ADR-005** | **PWA con trabajo sin conexión, idempotencia y puerto Reloj** | P2 · E4 | Propuesta | [`ADR-005-pwa-trabajo-sin-conexion.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/adr/ADR-005-pwa-trabajo-sin-conexion.md) ¹ |

### 3.1 ADR-004 · Políticas moratorias coexistentes (E6)

Es el ADR que pide el E6 («`adr/ADR-00X.md` → decisión sobre la política escalonada»).


#### Estado y fecha

Aceptada para el núcleo del encargo P2. Fecha de registro: 2026-09-21. Vigencia financiera de POL-2026-10: 2026-10-01. No se afirma aprobación humana del equipo.

#### Contexto

P1 recibía una tasa directamente en métodos estáticos. P2 exige acumulación por tramos, preservación de contratos anteriores, tope de capital, desglose, congelación y sustitución comprobable. Cambiar globalmente la tasa rompería el resultado histórico Q7.26.

#### Decisión

Introducir Strategy con `PoliticaMora.calcular`, resultado sin redondear, moneda y detalle inmutable. La instancia de `CalculadoraMora` recibe la abstracción y materializa el importe una vez al final de cada cuota. El catálogo construye plana o escalonada según otorgamiento explícito; nunca según reloj de ejecución. `consultarMora` compone catálogo, motor y corte de baja cuando existe.

La configuración institucional queda versionada e inmutable con fuente documental, motivo y vigencia. La política anterior aplica 24% y la nueva 18/24/30/36% en intervalos de 30 días. Los días >120 no incrementan ni eliminan el acumulado. Actual/360 y Decimal a 40 cifras se conservan; solo el total de cuota pasa a `Dinero`, con `ROUND_HALF_UP` a dos decimales.

Se mantiene la fachada estática P1. La retroactiva se marca como doble no productivo y queda fuera del catálogo. Su comparación con escalonada solo se prueba en 1–120. El contrato común verifica propiedades estructurales y límites, no igualdad de resultados financieros.

#### Alternativas

- Sustituir la tasa P1 globalmente: descartado porque alteraría contratos previos.
- Condicionales de fecha y tramo dentro del motor: descartado por acoplar selección, cálculo y representación.
- Redondear cada tramo: descartado, produce Q50.81 en lugar de Q50.80 al día 100.
- Aplicar retroactivamente la tasa actual: descartado como política productiva; se conserva como doble para LSP.
- Reescribir el núcleo: descartado por alcance incremental y coste de regresión.

#### Consecuencias y trade-offs

Añadir una estrategia no exige modificar el motor, pero seleccionar una nueva versión sí exige evolucionar el catálogo y la configuración. El catálogo fija reglas en código, no ofrece edición ni persistencia institucional. La vigencia original P1 no fue suministrada y se representa como `null`, evitando inventarla.

La interfaz expone cadenas de precisión interna; un consumidor no debe redondear y volver a sumar los tramos. La fachada histórica permanece fuera de las nuevas garantías de tope/congelación; se documenta su uso limitado y se recomienda la entrada de aplicación P2. Las reglas comunes se verifican en la salida del motor.

State mantiene la declaración contable con evidencia y autorización; la clasificación por días y la congelación financiera no mutan el estado. Los llamadores deben aportar saldos, cortes y fechas contractuales coherentes y conservar los resultados puros de devengo y gasto. Persistencia atómica y reconstrucción histórica siguen pendientes.

#### Evidencia

`tests/politica-mora.test.ts`, `tests/contrato-politica.test.ts`, `tests/regresion-p1.test.ts`, [evolución](../proyecto2/e6-02-evolucion-nucleo.md), [informe SOLID](../informe-impacto-solid.md) y secuencia `docs/diagramas/uml/08-secuencia-politica-mora.puml`.


### 3.2 ADR-005 · PWA con trabajo sin conexión (E4)

Registra formalmente la decisión del E4 para que el Proyecto Final la implemente.


#### Estado y fecha

Propuesta por el equipo para el Proyecto Final. Fecha de registro: 2026-09-23. Se implementará en React + Vite + Tailwind durante el Proyecto Final. En el Proyecto 2 no se programa la interfaz (enunciado, sección 2.1).

#### Contexto

El sistema tiene tres perfiles con contextos muy distintos (enunciado, sección 3; E1):

- **Asesora de crédito:** trabaja en campo, de pie, con una mano ocupada, con un Android de gama media y con señal intermitente o nula. Registra pagos y solicitudes durante las visitas.
- **Cliente:** tiene teléfono, pero no siempre datos móviles (en 2024, el 60.3 % de la población de Guatemala usaba internet, frente a 113.3 % de conexiones móviles).
- **Gerencia y comité:** trabajan en escritorio con conexión estable y consultan ocasionalmente desde el teléfono.

El Proyecto Final debe construirse en cuatro semanas con React y Tailwind. Dos decisiones del Proyecto 1 ya condicionan el trabajo sin conexión: la **clave de idempotencia** de `RegistrarPago` y el **puerto `Reloj`**, por el que la fecha de corte es un parámetro y nunca "hoy".

#### Decisión

Construir **una sola aplicación web progresiva (PWA), instalable y diseñada primero para el teléfono**, para los tres perfiles. El rol con que se inicia sesión define la pantalla inicial: Ruta del día, Bandeja del comité o Tablero.

1. **Sin conexión:** un *service worker* guarda la aplicación y los datos de la ruta. Los borradores y la cola de pagos se guardan en IndexedDB. Se solicita almacenamiento persistente con `navigator.storage.persist()`.
2. **Cola de pagos idempotente:** la `Idempotency-Key` se genera una sola vez al confirmar el pago y se guarda con él antes de mostrar "Pendiente de enviar". Cada reintento envía la misma clave y el mismo contenido. Las respuestas del contrato del P1 se interpretan así: 201 es un pago nuevo; 200 con `Idempotency-Replayed` es un reintento ya aplicado; 409 es un conflicto que se muestra para revisión. Un timeout nunca borra el comando.
3. **Fecha del pago:** el adaptador del puerto `Reloj` en el teléfono fija la `fechaPago` al confirmar, y los reintentos la conservan. El núcleo recibe la fecha como parámetro y no lee el reloj del sistema.
4. **Sincronización:** Background Sync donde exista (Chrome en Android); además, reenvío al recuperar la señal, al abrir la aplicación y con un botón manual. No se promete sincronización automática universal.
5. **Operaciones que requieren conexión:** desembolsar y ejecutar cierres no se permiten sin señal.

#### Alternativas

- **Aplicación nativa (Kotlin/Swift):** descartada. Exige dos lenguajes y dos bases de código más la web de gerencia, publicar en tiendas y esperar a que los asesores actualicen. Además no cabe en las cuatro semanas del Proyecto Final.
- **Aplicación híbrida (React + Capacitor):** viable, pero agrega compilación, firma y pruebas por plataforma sin resolver un problema que la PWA no resuelva hoy. Se conserva como **plan de contingencia**.
- **Web sin capacidad offline:** descartada, porque la asesora perdería capturas y pagos al quedarse sin señal (momentos críticos MC-1 y MC-2 del E1).

#### Consecuencias y trade-offs

- Un solo código para los tres perfiles, coherente con el stack del Proyecto Final; las actualizaciones llegan sin pasar por una tienda.
- El navegador puede desalojar el almacenamiento. Se mitiga con almacenamiento persistente, vaciando la cola en cuanto hay señal y avisando si quedan pendientes al final del día.
- En iOS las PWA tienen limitaciones; se aceptan porque la gerencia solo consulta desde el iPhone.
- **Ajuste requerido al contrato del P1:** el OpenAPI sugiere un TTL de 24 horas para la `Idempotency-Key`. Debe ampliarse por encima de la ventana máxima sin conexión (se propone 30 días); si no, un reintento después de un día sin señal se procesaría como pago nuevo.
- **Condición de revisión:** si la validación de campo muestra que Android desaloja la cola con frecuencia, o que la cámara del navegador no basta para leer el DPI, la aplicación de la asesora migra a Capacitor sin reescribir el código React.

#### Evidencia

`docs/proyecto2/e4-decision-movil-web.md`, `docs/proyecto2/e1-investigacion-usuario.md` (momentos críticos MC-2 y MC-4), `docs/api/openapi.yaml` (operación `registrarPago`, cabecera `Idempotency-Key`), `src/dominio/pago-idempotente.ts` y `src/aplicacion/consultar-mora.ts`.


---

## 4. Repositorio e historial con hipervínculos

### 4.1 Cómo se organizó el repositorio

| Prefijo | Entregable | Archivos |
|---|---|---|
| `e1-` | Investigación de usuario | [`e1-investigacion-usuario.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/e1-investigacion-usuario.md) ¹, [`e1-instrumentos-investigacion.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/e1-instrumentos-investigacion.md) ¹ |
| `e2-` | Arquitectura de información | [`e2-arquitectura-informacion.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/e2-arquitectura-informacion.md) ¹, carpeta [`wireframes/`](https://github.com/ItsRomero/Proyecto1_Analisis/tree/main/docs/proyecto2/wireframes) ¹ ([`anotado/`](https://github.com/ItsRomero/Proyecto1_Analisis/tree/main/docs/proyecto2/wireframes/anotado) ¹ y [`skeleton/`](https://github.com/ItsRomero/Proyecto1_Analisis/tree/main/docs/proyecto2/wireframes/skeleton) ¹ P01–P14 y G01–G07, [`mapa-navegacion.svg`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/wireframes/mapa-navegacion.svg) ¹ y [`casos-de-uso-p2.svg`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/wireframes/casos-de-uso-p2.svg) ¹) |
| `e4-` | Decisión móvil/web | [`e4-decision-movil-web.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/e4-decision-movil-web.md) ¹ |
| `e6-` | Evolución del núcleo | [`e6-01-auditoria-inicial.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/e6-01-auditoria-inicial.md) ¹, [`e6-02-evolucion-nucleo.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/e6-02-evolucion-nucleo.md) ¹, [`e6-03-pruebas-mora-escalonada.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/e6-03-pruebas-mora-escalonada.md) ¹, [`e6-04-validacion-final.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/e6-04-validacion-final.md) ¹ |
| — | Informe SOLID y ADR | [`informe-impacto-solid.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/informe-impacto-solid.md), [`ADR-004-politica-mora-escalonada.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/adr/ADR-004-politica-mora-escalonada.md), [`ADR-005-pwa-trabajo-sin-conexion.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/adr/ADR-005-pwa-trabajo-sin-conexion.md) ¹ |
| — | Índice e historial | [`README.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/README.md) ¹, [`historial-cambios.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/historial-cambios.md) ¹, [`P2-documento-entrega.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/P2-documento-entrega.md) ¹ |
| — | Núcleo y pruebas | [`src/dominio/`](https://github.com/ItsRomero/Proyecto1_Analisis/tree/main/src/dominio), [`tests/`](https://github.com/ItsRomero/Proyecto1_Analisis/tree/main/tests) |

### 4.2 Historial de commits

Cada hash abre el commit en GitHub con su diff completo, y cada archivo abre la versión **de ese commit**, de modo que se ve exactamente lo que se entregó en ese momento. En los commits con muchos archivos se enlazan los cinco principales.

| # | Fecha | Commit | Autor (Git) | Tipo | Entregable | Qué se hizo | Archivos principales | Cambio |
|---|---|---|---|---|---|---|---|---|
| — | 26/08 | [`8737d9b`](https://github.com/ItsRomero/Proyecto1_Analisis/commit/8737d9b782772a5cff9acb07de8d719f4f4e3a16) | — | Base | P1 | **Entrega del Proyecto 1** (etiqueta `entrega-p1`), punto de comparación | [`src/dominio/`](https://github.com/ItsRomero/Proyecto1_Analisis/tree/8737d9b782772a5cff9acb07de8d719f4f4e3a16/src/dominio) | — |
| 0 | 21/09 | [`71a5179`](https://github.com/ItsRomero/Proyecto1_Analisis/commit/71a5179e4a4c092c0fd8c460d11e1546938d6b5b) | Christopher Herrera | Auditoría | E6 | Auditoría inicial y línea base del P1: 7 archivos de dominio y 206 pruebas; se crea la etiqueta entrega-p1 | [`00-auditoria-inicial.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/71a5179e4a4c092c0fd8c460d11e1546938d6b5b/docs/proyecto2/00-auditoria-inicial.md) | 1 arch. · +70 |
| 1 | 21/09 | [`ec2a436`](https://github.com/ItsRomero/Proyecto1_Analisis/commit/ec2a43636fe208d0dd24f13b81c473582163ba14) | Christopher Herrera | Funcionalidad | E6 · CP-01 | Puerto PoliticaMora, políticas plana/escalonada/retroactiva, catálogo por fecha de otorgamiento y Specification de tramo; se abre el motor para inyectar la política | [`calculadora-mora.ts`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/ec2a43636fe208d0dd24f13b81c473582163ba14/src/dominio/calculadora-mora.ts) · [`clasificacion-tramo.ts`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/ec2a43636fe208d0dd24f13b81c473582163ba14/src/dominio/clasificacion-tramo.ts) · [`catalogo-politicas.ts`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/ec2a43636fe208d0dd24f13b81c473582163ba14/src/dominio/politica-mora/catalogo-politicas.ts) · [`configuracion-politica.ts`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/ec2a43636fe208d0dd24f13b81c473582163ba14/src/dominio/politica-mora/configuracion-politica.ts) · [`politica-escalonada.ts`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/ec2a43636fe208d0dd24f13b81c473582163ba14/src/dominio/politica-mora/politica-escalonada.ts) · y 5 más | 10 arch. · +223 / −21 |
| 2 | 21/09 | [`d3b30f5`](https://github.com/ItsRomero/Proyecto1_Analisis/commit/d3b30f50c075fcb7fc6490622960c39762e65a41) | Christopher Herrera | Funcionalidad | E6 · CP-02 | Gasto de gestión de cobro de Q25.00 al día 31, idempotente por cuota | [`gasto-gestion-cobro.ts`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/d3b30f50c075fcb7fc6490622960c39762e65a41/src/dominio/gasto-gestion-cobro.ts) · [`gasto-gestion-cobro.test.ts`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/d3b30f50c075fcb7fc6490622960c39762e65a41/tests/gasto-gestion-cobro.test.ts) | 2 arch. · +105 |
| 3 | 21/09 | [`5752b55`](https://github.com/ItsRomero/Proyecto1_Analisis/commit/5752b55090a67328cc1860584e9d6fc8f81d6b93) | Christopher Herrera | Funcionalidad | E6 · CP-04 | Transición en_mora → cancelado, suspensión del devengo y cartera en riesgo por tramo | [`cartera-por-tramo.ts`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/5752b55090a67328cc1860584e9d6fc8f81d6b93/src/dominio/cartera-por-tramo.ts) · [`credito-estado.ts`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/5752b55090a67328cc1860584e9d6fc8f81d6b93/src/dominio/credito-estado.ts) · [`devengo-interes.ts`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/5752b55090a67328cc1860584e9d6fc8f81d6b93/src/dominio/devengo-interes.ts) · [`cartera-por-tramo.test.ts`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/5752b55090a67328cc1860584e9d6fc8f81d6b93/tests/cartera-por-tramo.test.ts) · [`credito-cancelacion-p2.test.ts`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/5752b55090a67328cc1860584e9d6fc8f81d6b93/tests/credito-cancelacion-p2.test.ts) · y 5 más | 10 arch. · +343 / −2 |
| 4 | 21/09 | [`0d6c1a9`](https://github.com/ItsRomero/Proyecto1_Analisis/commit/0d6c1a93584449b673d0f475891efdda03fb61b7) | ERAMR18 | Pruebas | E6 · CP-03 | Contrato común contra las tres políticas (Liskov), regresión integrada y caso de uso consultarMora; corte del núcleo medido | [`consultar-mora.ts`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/0d6c1a93584449b673d0f475891efdda03fb61b7/src/aplicacion/consultar-mora.ts) · [`contrato-politica.test.ts`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/0d6c1a93584449b673d0f475891efdda03fb61b7/tests/contrato-politica.test.ts) · [`regresion-p1.test.ts`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/0d6c1a93584449b673d0f475891efdda03fb61b7/tests/regresion-p1.test.ts) | 3 arch. · +121 |
| 5 | 21/09 | [`958e70f`](https://github.com/ItsRomero/Proyecto1_Analisis/commit/958e70fd6a7ee02fd6a86e4f754178fa9c353536) | ERAMR18 | Documentación | E6 | ADR-004, informe SOLID inicial, UML, contratos Zod/OpenAPI y documento móvil inicial | [`esquemas.ts`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/958e70fd6a7ee02fd6a86e4f754178fa9c353536/src/contratos/esquemas.ts) · [`presentadores-p2.ts`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/958e70fd6a7ee02fd6a86e4f754178fa9c353536/src/contratos/presentadores-p2.ts) · [`contratos-p2.test.ts`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/958e70fd6a7ee02fd6a86e4f754178fa9c353536/tests/contratos-p2.test.ts) · [`README.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/958e70fd6a7ee02fd6a86e4f754178fa9c353536/README.md) · [`ADR-004-politica-mora-escalonada.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/958e70fd6a7ee02fd6a86e4f754178fa9c353536/docs/adr/ADR-004-politica-mora-escalonada.md) · y 11 más | 16 arch. · +753 / −97 |
| 6 | 21/09 | [`8112e57`](https://github.com/ItsRomero/Proyecto1_Analisis/commit/8112e5742c4c77a4dba63a4981b04a465189c885) | ERAMR18 | Validación | E6 | Validación desde instalación limpia: 263 pruebas en 18 archivos | [`informe-impacto-solid.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/8112e5742c4c77a4dba63a4981b04a465189c885/docs/informe-impacto-solid.md) · [`03-validacion-final.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/8112e5742c4c77a4dba63a4981b04a465189c885/docs/proyecto2/03-validacion-final.md) | 2 arch. · +100 / −1 |
| 7 | 22/09 | [`5e73d12`](https://github.com/ItsRomero/Proyecto1_Analisis/commit/5e73d12d595709dc164345b824bf017c8475b3a2) | Christopher Herrera | Herramientas | E6 | Seis comandos de prueba por tema en package.json | [`package.json`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/5e73d12d595709dc164345b824bf017c8475b3a2/package.json) | 1 arch. · +6 |
| 8 | 22/09 | [`9e06c37`](https://github.com/ItsRomero/Proyecto1_Analisis/commit/9e06c378158d2b402bb76ecd57080434b041c0de) | Elízabeth | Documentación | E6 | Documento de pruebas de la mora escalonada e informe de verificación SOLID | [`04-pruebas-unitarias-mora-escalonada`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/9e06c378158d2b402bb76ecd57080434b041c0de/docs/proyecto2/04-pruebas-unitarias-mora-escalonada) · [`verificacion-solid-informe-impacto.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/9e06c378158d2b402bb76ecd57080434b041c0de/docs/verificacion-solid-informe-impacto.md) | 2 arch. · +1043 |
| 9 | 22/09 | [`8e421a6`](https://github.com/ItsRomero/Proyecto1_Analisis/commit/8e421a6855b6be41a39f19fdfacdbed4432ca2fc) | Elízabeth | Integración | — | Sincronización de la rama local con la remota | [`package.json`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/8e421a6855b6be41a39f19fdfacdbed4432ca2fc/package.json) | 1 arch. · +6 |
| 10 | 22/09 | [`183dc71`](https://github.com/ItsRomero/Proyecto1_Analisis/commit/183dc71fb578583edb445ef127629431e4ddcc9b) | Oliver Romero | Integración | E6 · E7 | Pull Request #1: integra la evolución del núcleo en main | [`consultar-mora.ts`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/183dc71fb578583edb445ef127629431e4ddcc9b/src/aplicacion/consultar-mora.ts) · [`esquemas.ts`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/183dc71fb578583edb445ef127629431e4ddcc9b/src/contratos/esquemas.ts) · [`presentadores-p2.ts`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/183dc71fb578583edb445ef127629431e4ddcc9b/src/contratos/presentadores-p2.ts) · [`calculadora-mora.ts`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/183dc71fb578583edb445ef127629431e4ddcc9b/src/dominio/calculadora-mora.ts) · [`cartera-por-tramo.ts`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/183dc71fb578583edb445ef127629431e4ddcc9b/src/dominio/cartera-por-tramo.ts) · y 37 más | 42 arch. · +2751 / −108 |
| 11 | 22/09 | [`13aa167`](https://github.com/ItsRomero/Proyecto1_Analisis/commit/13aa16701063f80144bb166f8148cf4a6877dcee) | Erwin | Documentación | E7 | README: tabla de comandos de prueba por tema | [`README.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/13aa16701063f80144bb166f8148cf4a6877dcee/README.md) | 1 arch. · +20 / −1 |
| 12 | 23/09 | `16f983f` ¹ | Oliver Romero | Documentación | E1 · E2 · E4 · E6 | E1, E2, E4, 15 wireframes, informe SOLID según el Anexo D y documentos renombrados por entregable | [`README.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/README.md) · [`ADR-004-politica-mora-escalonada.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/adr/ADR-004-politica-mora-escalonada.md) · [`informe-impacto-solid.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/informe-impacto-solid.md) · [`README.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/README.md) · [`e1-instrumentos-investigacion.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/e1-instrumentos-investigacion.md) · y 9 más | 32 arch. · +2413 / −232 |
| 13 | 23/09 | `4ba9e55` ¹ | Oliver Romero | Documentación | E7 | Historial de cambios y documento técnico consolidado | [`README.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/README.md) · [`documentacion-completa.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/documentacion-completa.md) · [`generar_documentacion_completa.py`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/generar_documentacion_completa.py) · [`historial-cambios.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/historial-cambios.md) | 4 arch. · +2658 |
| 14 | 23/09 | `00709f9` ¹ | Oliver Romero | Documentación | E3 · E5 · E7 | Enlace de Figma, revisión del prototipo y evaluación E5 preliminar | [`README.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/README.md) · [`P2-documento-entrega.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/P2-documento-entrega.md) · [`README.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/README.md) · [`documentacion-completa.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/documentacion-completa.md) · [`e6-04-validacion-final.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/e6-04-validacion-final.md) · y 1 más | 6 arch. · +511 / −12 |
| 15 | 23/09 | `8486b6e` ¹ | Oliver Romero | Documentación | E1–E7 | Documento de entrega unificado, generado desde los documentos del repositorio | [`P2-documento-entrega.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/P2-documento-entrega.md) · [`README.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/README.md) · [`documentacion-completa.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/documentacion-completa.md) · [`e2-arquitectura-informacion.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/e2-arquitectura-informacion.md) · [`e4-decision-movil-web.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/e4-decision-movil-web.md) · y 3 más | 8 arch. · +1381 / −340 |
| 16 | 23/09 | `53689ef` ¹ | Oliver Romero | Documentación | E2 · E6 | Primeros skeletons, diagrama de casos de uso y ADR-005 (PWA) | [`ADR-005-pwa-trabajo-sin-conexion.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/adr/ADR-005-pwa-trabajo-sin-conexion.md) · [`generar_casos_uso.py`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/wireframes/generar_casos_uso.py) · [`generar_skeletons.py`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/wireframes/generar_skeletons.py) | 19 arch. · +1252 |
| 17 | 23/09 | `cdc92c4` ¹ | Oliver Romero | Documentación | E2 · E6 · E7 | Documento de complementos con enlaces a GitHub | [`P2-complementos.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/P2-complementos.md) · [`generar_complementos.py`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/generar_complementos.py) | 2 arch. · +492 |
| 18 | 23/09 | `2e6e9c6` ¹ | Oliver Romero | Documentación | E2 · E3 | Alineación con Figma: wireframes P01–P14 y guías G01–G07; mapa, casos de uso y documentos con los mismos códigos | [`P2-complementos.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/P2-complementos.md) · [`P2-documento-entrega.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/P2-documento-entrega.md) · [`README.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/README.md) · [`documentacion-completa.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/documentacion-completa.md) · [`e1-investigacion-usuario.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/e1-investigacion-usuario.md) · y 9 más | 90 arch. · +4386 / −2960 |
| 19 | 23/09 | `d1b2166` ¹ | Oliver Romero |  |  | docs(p2): regenerar complementos con el historial actualizado | [`P2-complementos.md`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/P2-complementos.md) · [`generar_complementos.py`](https://github.com/ItsRomero/Proyecto1_Analisis/blob/main/docs/proyecto2/generar_complementos.py) | 2 arch. · +2 / −2 |

> ¹ Commit todavía no publicado en GitHub; sus archivos se enlazan en `main` y quedarán disponibles al integrar la rama. Al aplicar el parche, Git asigna un hash nuevo a estos commits.

**Comparación completa entre entregas:** [https://github.com/ItsRomero/Proyecto1_Analisis/compare/8737d9b...main](https://github.com/ItsRomero/Proyecto1_Analisis/compare/8737d9b...main) muestra en GitHub todos los cambios desde el Proyecto 1.
