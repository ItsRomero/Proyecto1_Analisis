# Proyecto 2 · UX/UI, movilidad y evolución del núcleo

**Sistema de Gestión de Microcrédito — Crédito Vecino, S. A.**
Análisis de Sistemas II (037) · Universidad Mariano Gálvez de Guatemala · Segundo semestre 2026

| | |
|---|---|
| **Integrantes** | Christopher David Herrera Pérez · Erwin Alberto Ramírez Racancoj · Gabriela Elízabeth Noemí Aguilar Vásquez · Oliver Fernando Romero Esquite |
| **Grupo / carnés / sección** | *(completar antes de exportar el PDF)* |
| **Prototipo navegable (Figma)** | https://www.figma.com/proto/jozM3QI8ZJ6pywdCoO5OVo/Microcr%C3%A9ditos-App?node-id=0-1&t=PJlTVLC3ASu31ttw-1 |
| **Repositorio** | https://github.com/ItsRomero/Proyecto1_Analisis |
| **Fecha de entrega** | Viernes 25 de septiembre de 2026 |

---

## Índice

1. [Antes de empezar: qué es este documento](#1-antes-de-empezar-qué-es-este-documento)
2. [¿Está todo lo que pide el enunciado? Lista de verificación](#2-está-todo-lo-que-pide-el-enunciado-lista-de-verificación)
3. [Cómo trabajamos: la historia del repositorio, commit por commit](#3-cómo-trabajamos-la-historia-del-repositorio-commit-por-commit)
4. [E1 · Investigación de usuario](#4-e1--investigación-de-usuario)
5. [E2 · Arquitectura de información y wireframes](#5-e2--arquitectura-de-información-y-wireframes)
6. [E3 · Prototipo navegable en Figma](#6-e3--prototipo-navegable-en-figma)
7. [E4 · Decisión móvil/web y diseño responsivo](#7-e4--decisión-móvilweb-y-diseño-responsivo)
8. [E5 · Evaluación heurística y de accesibilidad](#8-e5--evaluación-heurística-y-de-accesibilidad)
9. [E6 · Evolución del núcleo e informe de impacto SOLID](#9-e6--evolución-del-núcleo-e-informe-de-impacto-solid)
10. [Reparto del trabajo](#10-reparto-del-trabajo)
11. [Declaración de uso de herramientas de IA](#11-declaración-de-uso-de-herramientas-de-ia)
12. [Dónde encontrar cada cosa en el repositorio](#12-dónde-encontrar-cada-cosa-en-el-repositorio)

---

## 1. Antes de empezar: qué es este documento

El Proyecto 1 respondió a la pregunta *¿cómo está construido el sistema por dentro?* Este Proyecto 2 responde a dos preguntas nuevas.

La primera es **¿cómo se usa?** Un motor de cálculo perfecto no sirve de mucho si la asesora, de pie bajo el sol y con una mano ocupada, escribe Q1,000 cuando quería escribir Q10,000. En una financiera, la interfaz es el lugar donde nacen la mayoría de los errores de dinero. Por eso investigamos a nuestros usuarios, diseñamos la navegación, construimos un prototipo en Figma y decidimos cómo debe funcionar la aplicación cuando no hay señal.

La segunda es **¿aguantó el diseño un cambio real?** El comité de Crédito Vecino decidió que, desde el 1 de octubre de 2026, la mora ya no se cobra con una tasa única del 24 %, sino por tramos: 18 %, 24 %, 30 % y 36 % según los días de atraso. Implementamos ese cambio en el núcleo del Proyecto 1 y medimos, con el historial de Git como evidencia, cuánto tuvimos que modificar.

Este documento es la versión narrativa y consolidada de todo el trabajo. Cada sección resume lo esencial y enlaza al documento técnico completo del repositorio, donde están las tablas y los cálculos en detalle. Siempre que aparece una cifra (Q1,004.62, Q18.14, 7.00 %…), sale del núcleo de cálculo y de sus pruebas, no de una estimación.

---

## 2. ¿Está todo lo que pide el enunciado? Lista de verificación

Revisamos la lista de la sección 12.2 del enunciado punto por punto. Marcamos con ✅ lo que está completo, con ⚠️ lo que existe pero necesita un ajuste antes de entregar y con ❌ lo que todavía falta.

| # | Requisito (sección 12.2) | Estado | Dónde está / qué falta |
|---|---|---|---|
| 1 | Personas fundamentadas y journey map con puntos de dolor concretos, incluido el cambio de tramo | ⚠️ | Hechos en §4. Se basan en el enunciado y en fuentes documentadas; **faltan las entrevistas u observación de campo** para validar los rasgos marcados como hipótesis |
| 2 | Tabla pantalla ↔ caso de uso completa y coherente con los puertos del P1 | ✅ | §5.3 |
| 3 | Las siete pantallas obligatorias y los tres flujos navegables con clics | ⚠️ | El prototipo tiene el flujo del asesor (originación y cobro). **Faltan en Figma: tablero gerencial, cierre diario/mensual y confirmación de desembolso**, y con ellos el flujo 3 (consulta gerencial). Ver §6.3 |
| 4 | Plan de amortización con el caso de referencia real y la cuota 12 de Q1,004.63 explicada | ⚠️ | La pantalla de Figma muestra las 12 cuotas correctas y resalta la cuota 12, pero **no explica** por qué es un centavo mayor. Falta agregar la nota |
| 5 | Detalle de la mora con el desglose por tramos recorridos del caso M-3 | ❌ | La pantalla existe, pero **usa tasas y montos que no son los del núcleo** (0.5 % a 2 % mensual sobre Q6,240.50). Debe mostrar el caso M-3: Q725.76, 100 días, total Q50.80. Ver §6.4 |
| 6 | El tablero distingue cartera en mora (21.75 %) y cartera en riesgo (7.00 %), con el desglose por tramo | ⚠️ | Diseñado y justificado en el wireframe W11 (§5.5); **falta construirlo en Figma** |
| 7 | Decisión móvil/web argumentada, con pérdida de conexión, idempotencia y puerto Reloj | ✅ | §7 |
| 8 | ≥ 8 hallazgos heurísticos con severidad y ≥ 5 correcciones con antes/después | ⚠️ | §8 trae 14 hallazgos preliminares sobre el prototipo actual. **Falta** que los cuatro integrantes evalúen por separado, consolidar, corregir en Figma y capturar el antes/después |
| 9 | Auditoría de los seis criterios A/AA nuevos de WCAG 2.2 y del 3.3.4 | ⚠️ | §8.3 trae la auditoría preliminar; falta confirmarla sobre la versión corregida |
| 10 | Qué se incorporó del design review y qué se rechazó, con argumento | ❌ | Depende de las notas de la sesión 9 del equipo |
| 11 | `npm install && npm test` corre en limpio; pasan M-1 a M-5, la coexistencia y la suite del P1 | ✅ | 263 pruebas en 18 archivos (§9). Conviene volver a correr `npm run verify` sobre el commit final |
| 12 | Informe de impacto SOLID con métricas respaldadas por el diff y una respuesta por principio | ✅ | §9 y `docs/informe-impacto-solid.md` |
| 13 | Commit de entrega del P1 etiquetado o su hash en el informe | ⚠️ | El hash `8737d9b` está en el informe. La etiqueta `entrega-p1` **existe solo en una computadora local**; hay que publicarla con `git push origin entrega-p1` |
| 14 | Enlaces de Figma y del repositorio abren sin pedir permisos | ✅ / ⚠️ | El prototipo abre sin iniciar sesión (lo comprobamos). Confirmar que el repositorio sea público |
| 15 | Tabla de reparto del trabajo | ⚠️ | §10 propone la tabla a partir del historial de Git; **el equipo debe confirmarla** |

**En resumen:** la parte técnica (E4 y E6) y la arquitectura de información (E2) están completas. Lo que más urge antes del viernes es **corregir en Figma la pantalla de detalle de la mora, construir el tablero gerencial, el cierre y el desembolso**, y hacer la evaluación E5 entre los cuatro. La sección 6 y la sección 8 dicen exactamente qué cambiar.

---

## 3. Cómo trabajamos: la historia del repositorio, commit por commit

El enunciado pide que el historial permita comparar el estado de entrega del P1 con el del P2, y advierte que alterarlo es falta de integridad. No reescribimos nada: todo lo que se hizo está en commits separados y se puede revisar con `git log`.

### 3.1 El punto de partida

El Proyecto 1 se entregó en el commit **`8737d9b`** (26 de agosto de 2026). Al empezar el P2 lo marcamos con la etiqueta `entrega-p1` y abrimos la rama `feat/proyecto-2-evolucion-nucleo`. En ese momento el núcleo tenía 7 archivos de dominio y 206 pruebas, todas pasando.

### 3.2 La evolución, en el orden en que ocurrió

**21 de septiembre: el núcleo se adapta al cambio de requisito.** Fue un día intenso de trabajo por fases, cada una con su propio commit:

- **Fase 0 · `71a5179`** (Christopher Herrera). Antes de tocar código, auditamos el repositorio y registramos la línea base: qué archivos existían, cuántas pruebas pasaban y con qué versiones. Esto quedó en `e6-01-auditoria-inicial.md`.
- **Fase 1 · `ec2a436`** (Christopher Herrera). El cambio central: creamos el puerto `PoliticaMora` y tres implementaciones (plana, escalonada y retroactiva), más un catálogo que elige la política según la fecha de otorgamiento. Aquí tuvimos que **abrir el motor** `calculadora-mora.ts` (+32/−19 líneas); explicamos por qué en §9.
- **Fase 2 · `d3b30f5`** (Christopher Herrera). El gasto de gestión de cobro: Q25.00 por cuota vencida, que se genera una sola vez al día 31 aunque el cierre se ejecute varias veces.
- **Fase 3 · `5752b55`** (Christopher Herrera). Las tres correcciones de CP-04: la transición `en_mora → cancelado`, la suspensión del devengo después del día 90 y el desglose de la cartera en riesgo por tramo.
- **Fase 4 · `0d6c1a9`** (ERAMR18). Las pruebas de contrato: la misma batería corre contra las tres políticas (prueba de Liskov) y una suite de regresión integrada. **Este es el commit que usamos para medir el impacto**, porque después ya no cambia `src/dominio`.
- **Fase 5 · `958e70f`** (ERAMR18). Documentación y contratos: ADR-004, el primer informe SOLID, diagramas UML nuevos y esquemas Zod/OpenAPI.
- **Fase 6 · `8112e57`** (ERAMR18). Validación desde una instalación limpia: 263 pruebas en 18 archivos y la revisión de tipos, sin errores.

**22 de septiembre: se integra todo a `main`.**

- **`5e73d12`** (Christopher Herrera) agregó seis comandos de prueba por tema en `package.json` (`test:mora`, `test:cp04`, etc.), para que cualquiera del equipo pueda verificar una parte específica durante la defensa.
- **`9e06c37`** (Elízabeth) agregó el documento de pruebas unitarias de la mora escalonada, con entradas, salidas y criterios de cada caso, y un segundo informe de verificación SOLID.
- **`8e421a6`** (Elízabeth) sincronizó la rama local con la remota.
- **`183dc71`** (Oliver Romero) integró la rama completa a `main` mediante el **Pull Request #1**: 42 archivos, +2,751 / −108 líneas.
- **`13aa167`** (Erwin) documentó en el README los comandos de prueba por tema.

**23 de septiembre: se completa la documentación de experiencia de usuario.**

- **`16f983f`** (Oliver Romero, con apoyo de IA declarado). Agregó E1, E2 y E4, los 15 wireframes y el mapa de navegación. Reorganizó el informe SOLID según el Anexo D del enunciado y renombró los documentos por entregable.
- **Commits siguientes** (Oliver Romero, con apoyo de IA declarado): el historial de cambios, el documento consolidado y este documento de entrega, con el enlace del prototipo y la revisión del prototipo de Figma.

### 3.3 Qué faltaba documentar y cómo lo resolvimos

Al revisar el historial encontramos que varias cosas se habían hecho pero no estaban bien documentadas:

| Qué encontramos | Cómo lo resolvimos |
|---|---|
| Tres documentos afirmaban que "el enunciado no define CP-03". En realidad, CP-03 es la sección 7.6, *Coexistencia de políticas* | Corregido en `e6-02`, `e6-04` y en la matriz de trazabilidad |
| La validación final decía "sin push, PR ni merge", pero luego sí hubo un PR | Actualizado para reflejar el PR #1 |
| El documento de pruebas no tenía extensión `.md`, así que GitHub lo mostraba como texto plano | Renombrado a `e6-03-pruebas-mora-escalonada.md` |
| Había dos informes SOLID que se contradecían en detalles (13 frente a 12 atrasos probados) | Fusionados en uno solo, con la cifra correcta: 12 atrasos y 288 combinaciones |
| Los comandos de prueba (commit 7) y los merges (commits 9 y 10) no aparecían en ningún documento | Registrados en `historial-cambios.md` y en esta sección |
| E1, E2 y E4 casi no existían; el documento móvil no tomaba una decisión | Escritos desde cero (§4, §5 y §7) |

El detalle archivo por archivo está en `docs/proyecto2/historial-cambios.md`.

---

## 4. E1 · Investigación de usuario

### 4.1 Cómo investigamos, y qué no hicimos todavía

Trabajamos con tres tipos de fuentes y marcamos cada afirmación con su origen:

- **El enunciado (sección 3)**, que describe el contexto real de los tres perfiles.
- **Fuentes documentadas** sobre Guatemala: la Estrategia Nacional de Inclusión Financiera 2024-2027 de la SIB, el Global Findex 2025 del Banco Mundial, *Digital 2024: Guatemala* de DataReportal y el estudio de conectividad rural del IICA y el BID.
- **El núcleo de cálculo**, que nos da las cifras exactas de cada escenario.

Tres datos marcaron el diseño:

1. En enero de 2024 Guatemala tenía **20.65 millones de conexiones móviles (113.3 % de la población)**, pero solo el **60.3 % usaba internet**. Casi todos los clientes tienen teléfono, pero no podemos suponer que tengan datos. Por eso los avisos al cliente van por SMS.
2. Guatemala está entre los nueve países de la región con **menor conectividad rural**, y que haya muchos teléfonos no significa que haya señal. La asesora va a trabajar sin conexión en parte de su ruta.
3. La digitalización es una prioridad nacional, pero tiene que incluir a personas con poca experiencia digital.

Somos honestos con una limitación: **todavía no hemos aplicado las entrevistas ni la observación de campo**. Los instrumentos ya están listos (guías para asesor, cliente y gerencia, una encuesta de 20 preguntas y una lista de observación, en `e1-instrumentos-investigacion.md`). Mientras tanto, los rasgos que no salen del enunciado ni de las fuentes están marcados como **hipótesis** y no los presentamos como hallazgos.

### 4.2 Las tres personas

**Mariela López, asesora de crédito en campo.** Visita de 8 a 12 clientes al día en negocios y casas, casi siempre de pie, bajo el sol y con el cartapacio o el efectivo en una mano. Usa un Android de gama media que le da la empresa y pierde la señal cuando sale de la cabecera municipal. Maneja WhatsApp y la cámara sin problema, pero no tiene por qué saber qué significa "sincronizar". Quiere tres cosas: terminar la visita sin volver a pedirle datos al cliente, estar segura de que el pago quedó registrado *una sola vez* y poder explicarle al cliente a dónde se fue su dinero. Hoy anota los pagos en papel y los transcribe al volver a la oficina, así que la fecha que queda registrada es la de la transcripción, no la del pago.
> *"Si la app me hace escribir el DPI dos veces, el cliente piensa que no sé lo que hago."* (cita hipotética, a validar en entrevista)

**Carlos Chávez, cliente de microcrédito.** Tiene una tienda de barrio y pidió **Q10,000 a 12 meses** para surtir inventario: es exactamente el caso de referencia del P1, con cuota de **Q1,004.62** y la última de **Q1,004.63**. Tiene un teléfono prepago; a veces tiene datos y a veces no, pero los SMS siempre le llegan. Lee mensajes y usa WhatsApp, pero palabras como "TNA" o "prelación" no le dicen nada. Lo que quiere saber es cuánto debe, cuándo paga y cuánto le falta. Si un día le dicen "debe Q1,040.99" sin explicación, siente que le están cobrando una multa, que es justo lo que el comité quiere evitar con la nueva política.
> *"Si me explican, pago; si me cae de sorpresa, siento que me están robando."* (hipotética)

**Andrea Morales, gerente de cartera y miembro del comité.** Trabaja en oficina, con un monitor grande, y revisa el teléfono en reuniones. Es muy buena con las hojas de cálculo y con los números. Necesita saber en 30 segundos si la cartera se está deteriorando y poder bajar del porcentaje a los créditos concretos. Su frustración es que las hojas actuales llaman "mora" a dos cosas distintas, y que cuando se da de baja un crédito el indicador de riesgo baja (de 7.00 % a 6.06 %) como si fuera una buena noticia, aunque no se cobró nada.
> *"No me muestre un número sin decirme qué número es."* (hipotética)

### 4.3 El recorrido de Carlos: de la solicitud a la primera cuota

| Etapa | Qué pasa | Cómo se siente | Dónde le puede fallar la interfaz | Qué proponemos |
|---|---|---|---|---|
| 1. Solicitud | Carlos dice cuánto necesita | Expectativa, duda | Mariela escribe "10000" en un campo sin formato y un cero de más o de menos pasa desapercibido | Monto con prefijo Q, separadores en vivo y rango Q1,000–Q25,000 visible |
| 2. Captura | Mariela registra DPI y datos del negocio | Prisa | Se cae la señal, la sesión expira y hay que **volver a capturar el DPI** frente al cliente | Borrador guardado en el teléfono campo por campo |
| 3. Evaluación | El comité revisa | Incertidumbre | Nadie puede decirle a Carlos en qué va su solicitud | Estado visible: solicitado → en evaluación → aprobado |
| 4. Aprobación | Le avisan que sí | Alivio | Le dicen "aprobado" sin decirle que pagará **Q2,055.45 de interés** | Resumen con cuota y total a pagar antes de confirmar |
| 5. Plan de pagos | Revisan las 12 cuotas | Control | La cuota 12 es **Q1,004.63** y Carlos cree que es un error | Nota: "un centavo más para cerrar el saldo exacto" |
| 6. Desembolso | Se entrega el dinero | Alegría | Un doble toque con señal lenta puede generar **dos desembolsos** | Pantalla de revisión y botón que se bloquea después del primer toque |
| 7. Seguimiento | Carlos pregunta cuánto debe | Neutral | El saldo que ve Mariela sin señal es de ayer y no lo dice | Toda cifra lleva su fecha de corte |
| 8. Recordatorio | Aviso de la primera cuota | Neutral | El aviso llega por una app que Carlos no abre sin datos | SMS tres días antes y el día del vencimiento |
| 9. Pago | Mariela recibe Q1,004.62 | Tensión | Sin señal, Mariela no sabe si se registró y teme **cobrarlo dos veces** | "Pendiente de enviar", con la misma clave en cada reintento |
| 10. Comprobante | Carlos recibe su constancia | Confianza | "Pagado Q1,004.62" no dice cuánto fue a interés (Q300.00) y cuánto a capital (Q704.62) | Comprobante con la prelación y el saldo que queda (Q9,295.38) |

### 4.4 Los cuatro momentos en que un error de pantalla se vuelve un error de dinero

1. **MC-1 · El monto de la solicitud.** Un cero de menos convierte un crédito de Q10,000 en uno de Q1,000 y cambia las 12 cuotas.
2. **MC-2 · El pago sin señal.** Si la app no dice qué pasó con el pago, Mariela lo vuelve a registrar y Carlos paga Q1,004.62 dos veces.
3. **MC-3 · El tablero gerencial.** Si "cartera en mora" (21.75 %) y "cartera en riesgo" (7.00 %) se ven iguales, el comité decide sobre el número equivocado.
4. **MC-4 · El día en que la mora sube de tramo.** Este es el momento que el enunciado pide analizar a fondo.

**¿Carlos se entera antes o después? ¿Por qué canal?** Hoy se entera **después** y **en persona**. El día 31 de atraso pasan dos cosas a la vez: la cuota entra en Mora 2 y se genera el gasto de gestión de cobro de Q25.00, que es precisamente el costo de la visita de la asesora. Así que el primer contacto de Carlos con el nuevo tramo es Mariela en la puerta, cobrando un total que ya subió.

Con la cuota 2 (capital en mora Q725.76) el salto se ve así:

| Días de atraso | Tramo | Mora | Gasto de cobro | Total de la cuota |
|---|---|---|---|---|
| 28 | Mora 1 | Q10.16 | — | Q1,014.78 |
| 30 | Mora 1 | Q10.89 | — | **Q1,015.51** |
| **31** | **Mora 2** | Q11.37 | **Q25.00** | **Q1,040.99** |
| 45 | Mora 2 | Q18.14 | Q25.00 | Q1,047.76 |

En un solo día la cuota sube **Q25.48**. Además, la mora diaria pasa de Q0.36 a Q0.48, y eso explica por qué "este mes la mora creció más rápido que el anterior".

**Lo que proponemos es que se entere antes, por dos canales:** un **SMS el día 28** ("si paga en los próximos 2 días debe Q1,015.51; después se agrega un cargo de visita de Q25.00"), otro **SMS el día 31** confirmando el cambio y, en la visita, la **pantalla de detalle de la mora** para que Carlos pueda verificar tramo por tramo. Elegimos SMS porque llega sin datos móviles. El umbral de tres días y la redacción exacta se validarán con las preguntas 9 y 10 de la guía de entrevista al cliente.

Documento completo: `docs/proyecto2/e1-investigacion-usuario.md`.

---

## 5. E2 · Arquitectura de información y wireframes

### 5.1 Una aplicación, tres puertas de entrada

El error que el enunciado nos pide evitar es diseñar "una pantalla para todos". Nuestra solución es que cada rol tenga su propio inicio: la asesora entra a su **Ruta del día**, el comité a su **Bandeja** y la gerencia al **Tablero**. Además, fijamos cinco reglas para todas las pantallas:

- Cada pantalla invoca un puerto del P1 y nunca calcula cifras por su cuenta.
- El estado de conexión siempre está a la vista en el teléfono.
- Cada cifra lleva su fecha de corte.
- La ayuda está siempre en el mismo lugar.
- Los montos siempre llevan "Q" y separador de miles.

### 5.2 Mapa de navegación

![Mapa de navegación](wireframes/mapa-navegacion.svg)

Los tres flujos que exige el E3 recorren el mapa así:

- **Originación:** solicitud → simulación del plan → decisión del comité → confirmación de desembolso.
- **Cobro en campo:** buscar cliente → saldo y tramo → detalle de la mora → registrar pago → comprobante.
- **Consulta gerencial:** tablero → cartera en riesgo por tramo → créditos de ese tramo.

### 5.3 Tabla de correspondencia pantalla ↔ caso de uso (sección 6.1)

| Puerto del enunciado | Puerto del P1 | Caso de uso | Pantalla | Wireframe |
|---|---|---|---|---|
| RegistrarCliente | `RegistrarCliente` | CU-01 | Alta de cliente | W03 |
| SolicitarCredito | `SolicitarCredito` | CU-02 | Solicitud + simulación del plan | W04, W05 |
| EvaluarSolicitud | `EvaluarCredito` + `DecidirSolicitud` | CU-03, CU-04, CU-05 | Bandeja del comité | W13 |
| DesembolsarCredito | `DesembolsarCredito` | CU-06 | Confirmación de desembolso | W06 |
| RegistrarPago | `RegistrarPago` | CU-07 | Registro de pago + comprobante | W09, W10 |
| ConsultarCarteraEnRiesgo | `ConsultarCarteraEnRiesgo` | CU-14 | Tablero gerencial + detalle de tramo | W11, W12, W15 |
| GenerarCierre | `GenerarCierre` | CU-12, CU-13 | Cierre diario / mensual | W14 |

Una aclaración: en el P1 dividimos el puerto que el enunciado llama `EvaluarSolicitud` en dos: `EvaluarCredito`, cuando el analista registra la evaluación, y `DecidirSolicitud`, cuando el comité aprueba o rechaza. La Bandeja del comité usa los dos. No cambiamos los nombres para respetar la regla de incrementalidad.

También trazamos las pantallas de apoyo, porque una pantalla sin caso de uso resta 0.5 puntos. Ruta del día, Buscar y Detalle del crédito corresponden a `ConsultarCredito` (CU-15); Detalle de la mora, a `CalcularMora` (CU-08); Plan de amortización, a la simulación de `SolicitarCredito` (CU-02).

### 5.4 Los wireframes

Dibujamos 15 wireframes de baja fidelidad en escala de grises, antes del prototipo, con anotaciones numeradas que explican cada decisión: 10 para el teléfono de la asesora y 5 para el escritorio de gerencia y comité. Están en `docs/proyecto2/wireframes/` y en el anexo del documento Word. Los más importantes son:

- **W08, Detalle de la mora.** Es la pantalla más difícil. Si solo muestra "Mora: Q50.80", el cliente no puede verificar nada; si muestra la fórmula completa, no la entiende. Nuestro punto medio es una fila por tramo con el rango de días en palabras ("Días 31–60"), la tasa anual ("24 % al año"), los días recorridos y una barra proporcional. Debajo va una **nota de redondeo**: si alguien suma las filas redondeadas obtiene Q50.81, pero el total oficial es Q50.80, porque se redondea una sola vez al final.
- **W09, Registro de pago.** Muestra la prelación (gastos → mora → interés → capital) **antes** de confirmar, no después.
- **W11, Tablero gerencial.** Se explica en el punto siguiente.

### 5.5 Por qué el tablero se ve así

El tablero se lee de izquierda a derecha y de arriba abajo, en el orden de las preguntas que Andrea lleva al comité:

1. **Primero, el contexto:** fecha de corte, "cierre congelado ✓" y la aclaración de que la política se aplica según la fecha de otorgamiento.
2. **Después, la cartera en riesgo (7.00 %)**, en la tarjeta principal con borde grueso, porque es la cifra con la que decide el comité.
3. **Junto a ella, lo dado por incobrable en el período.** El enunciado lo exige, y con razón: dar de baja un crédito baja el riesgo sin cobrar un centavo.
4. **En tercer lugar, la cartera en mora (21.75 %)**, que sirve como alerta temprana.
5. **Luego, el desglose por tramo:** 3.00 + 2.25 + 1.00 + 0.75 = 7.00 %. Cada fila abre la lista de sus créditos.
6. **Al final, desembolsos y recuperaciones.**
7. **A la derecha, un panel plegable** reservado para el asistente conversacional del Proyecto Final.

Confundir mora con riesgo es un hallazgo de severidad 4 y resta 0.5 puntos, así que no dependemos de una sola señal para distinguirlos: usamos **cinco a la vez**. Tienen nombre distinto ("RIESGO" frente a "MORA"), una definición visible bajo la cifra ("más de 30 días + reestructurados" frente a "cualquier atraso ≥ 1 día"), un símbolo distinto (▲ frente a ●), un borde distinto (grueso frente a discontinuo) y una posición separada. Ninguna de estas señales depende solo del color.

Documento completo: `docs/proyecto2/e2-arquitectura-informacion.md`.

---

## 6. E3 · Prototipo navegable en Figma

**Enlace al prototipo:** https://www.figma.com/proto/jozM3QI8ZJ6pywdCoO5OVo/Microcr%C3%A9ditos-App?node-id=0-1&t=PJlTVLC3ASu31ttw-1

El enlace abre sin iniciar sesión en Figma, como pide la sección 13. El archivo se llama *Microcréditos App* y la pantalla inicial es *Asesor de Crédito – Móvil*.

### 6.1 Cómo recorrerlo

1. **Iniciar sesión** → *Ingresar*.
2. **Mis Clientes.** Lista ordenada por prioridad, con la etiqueta de tramo de cada cliente (Incobrable, Mora 3, Mora 2, Mora 1, Al día) y los días de atraso.
3. **Flujo de cobro:** tocar la tarjeta de *Pedro Xol Cux* → *Detalle del crédito* → *Detalle mora* o *Plan de pago* → *Registrar pago* → tocar el monto → *Revisar y confirmar* → *Aplicar pago* → comprobante *Pago aplicado*.
4. **Variante sin señal:** en *Confirmar pago*, tocar *Simular pago sin señal (demo)* y luego *Aplicar pago*. Aparece la pantalla *Sin señal* con el pago en cola y el botón *Sincronizar ahora*.
5. **Flujo de originación:** desde *Mis Clientes*, botón **+** → *Nueva solicitud* (cliente, monto, plazo) → *Simulación de pago* → *Confirmar solicitud* → *Solicitud enviada*.
6. **Perfil:** tocar las iniciales *MA*.

### 6.2 Lo que el prototipo resuelve bien

Recorrimos el prototipo completo y estas decisiones cumplen lo que pide el enunciado:

- **La captura del monto es difícil de equivocar:** botones − y +, montos rápidos (Q2k, Q5k, Q10k…) y el rango "Q1,000 – Q25,000 en pasos de Q500" siempre visible. Esto responde a MC-1.
- **El plazo se elige con botones** (3 a 24 meses), sin teclado.
- **Antes de confirmar, siempre hay revisión:** la solicitud tiene tres pasos, y el pago una pantalla "Confirme antes de aplicar" con salida "← Modificar monto". Esto cumple WCAG 3.3.4.
- **La prelación se ve antes de aplicar el pago**, con barras por concepto.
- **El plan de amortización usa el caso de referencia real:** Q10,000 al 3 % mensual, las 12 cuotas, interés total Q2,055.45, total Q12,055.45 y la **cuota 12 de Q1,004.63 resaltada**.
- **La simulación de Q5,000 a 12 meses también es correcta** (cuota Q502.31, la mitad exacta del caso de referencia).
- **Existe un flujo sin señal** con el pago en cola, estado "Pendiente", folio y botón "Sincronizar ahora". Esto responde a MC-2 y a E4.
- Los objetivos táctiles son grandes y el contraste de los botones principales es alto.

### 6.3 Lo que falta construir en Figma

| Requisito del E3 | ¿Está en el prototipo? | Qué hacer |
|---|---|---|
| Solicitud de crédito (asesor, móvil) | ✅ | — |
| Detalle del crédito (cliente/asesor, móvil) | ✅ | Agregar el tramo en lenguaje llano ("lleva 45 días de atraso") |
| Registro de pago con prelación | ✅ | Corregir cifras (§6.4) |
| Plan de amortización con cuota 12 explicada | ⚠️ | Agregar la nota que explica el centavo de diferencia |
| Detalle de la mora con el caso M-3 | ❌ | Rehacer con las cifras del núcleo (§6.4) |
| **Tablero gerencial (escritorio)** | ❌ | Construir a partir del wireframe W11 |
| **Cierre diario / mensual (escritorio)** | ❌ | Construir a partir del wireframe W14 |
| Confirmación de desembolso (tabla 6.1) | ❌ | Agregar después de "Solicitud enviada", a partir de W06 |
| Bandeja del comité (tabla 6.1) | ❌ | Recomendable, a partir de W13 |
| Alta de cliente (tabla 6.1) | ❌ | Recomendable, a partir de W03 |
| Flujo 1: solicitud → simulación → confirmación → **desembolso** | ⚠️ | Hoy termina en "Solicitud enviada" |
| Flujo 2: cobro en campo | ✅ | — |
| **Flujo 3: consulta gerencial** | ❌ | Depende del tablero |
| *Mi perfil* | Existe, pero no corresponde a ningún caso de uso del P1 | Justificarla como pantalla de soporte de sesión o quitarla (hay penalización de −0.5 por pantallas sin caso de uso) |

### 6.4 Cifras que no coinciden con el núcleo (atención: penalización de la sección 6.2)

Esta es la corrección más importante antes de entregar. El enunciado penaliza con −0.5 las cifras inventadas y con otro −0.5 la política retroactiva o mal aplicada.

**Pantalla "Detalle de mora"**

| Lo que muestra hoy | Lo que dice la política | Cómo corregirlo |
|---|---|---|
| "Tasa adicional mensual" de 0.5 %, 1.0 %, 1.5 % y 2.0 % | Tasas **anuales** de 18 %, 24 %, 30 % y 36 % (1.5 %, 2 %, 2.5 % y 3 % mensual) | Mostrar "18 % al año", "24 % al año", etc. |
| Recargo calculado sobre el **saldo total** (Q6,240.50) | Sobre el **capital en mora de la cuota vencida**, cuota por cuota | Usar el caso M-3: capital Q725.76 |
| Total de recargos Q228.81 | M-3 = **Q50.80** (Q10.8864 + Q14.5152 + Q18.1440 + Q7.2576, redondeado una vez) | Poner Q10.89 · Q14.52 · Q18.14 · Q7.26 y la nota de redondeo (Q50.80, no Q50.81) |
| "Total a pagar hoy Q6,469.31" (saldo + recargos) | Lo exigible de la cuota: gastos + mora + interés corriente + capital | Para 45 días: Q25.00 + Q18.14 + Q278.86 + Q725.76 = **Q1,047.76** (M-5) |
| Entra desde el crédito de Pedro (132 días, incobrable), pero muestra 100 días y el saldo de Rosa | Un crédito incobrable deja de generar mora después del día 120 | Enlazar desde un crédito con 100 días de atraso, o mostrar la mora congelada en Q65.32 si el crédito ya es incobrable |

**Otras pantallas**

- **Registrar pago:** muestra "Gastos de gestión Q150.00". La política es **Q25.00 por cuota vencida**, generado una sola vez al día 31.
- **Solicitud enviada:** el cliente cambia de *Carlos Martínez Ixcot* (el seleccionado) a *Juan Pablo Pérez Xol*.
- **Pantalla sin señal:** el folio cambia de *PAG-251250* a *PAG-309097* al tocar "Sincronizar ahora". El folio representa la **clave de idempotencia**, que **debe ser la misma en cada reintento** (E4 §7.4). Si cambia, la pantalla contradice nuestra propia estrategia contra el doble cobro.

---

## 7. E4 · Decisión móvil/web y diseño responsivo

### 7.1 Decidimos: una sola aplicación web progresiva (PWA)

Evaluamos tres caminos: una app nativa (Kotlin/Swift), una app híbrida (React con Capacitor) y una PWA. Elegimos la **PWA**, una sola aplicación instalable que se diseña primero para el teléfono y sirve a los tres perfiles. Estas son nuestras razones, pensadas desde cada usuario:

- **Mariela** necesita trabajar sin señal. Una PWA lo logra con un *service worker*, que guarda la app y los datos, y con una cola persistente en IndexedDB. Pero lo importante no es "tener señal": es **no perder ni duplicar un pago cuando no la hay**, y eso depende de cómo diseñemos la cola y la API, no de que la app sea nativa. En su Android de gama media, la PWA se instala desde Chrome, ocupa poco y se actualiza sola, sin pasar por una tienda.
- **Andrea** trabaja en escritorio con buena conexión. Para ella la PWA es simplemente la web; no hace falta construir un segundo producto.
- **El equipo** debe implementar el Proyecto Final en React + Vite + Tailwind en cuatro semanas. Una PWA es exactamente ese stack; la opción nativa agregaría dos lenguajes más.

No escondemos los riesgos. El navegador puede borrar datos guardados (por eso pedimos almacenamiento persistente y vaciamos la cola en cuanto hay señal), y la sincronización en segundo plano no existe en todos los navegadores (por eso no la prometemos: también reenviamos al recuperar la señal, al abrir la app y con un botón manual). Si en campo la cola se pierde con frecuencia, migramos la app de la asesora a Capacitor sin reescribir el código React.

### 7.2 Del escritorio al teléfono: qué cambia en el tablero

En el teléfono, las tres tarjetas (riesgo, incobrables, mora) se apilan **en el mismo orden y con las mismas señales visuales** que en el escritorio. El desglose por tramo se convierte en una lista de cuatro filas con porcentaje, y el asistente pasa a ser un botón flotante.

**Qué sacrificamos en la pantalla pequeña y por qué es aceptable:** las gráficas de series (en 360 px no se leen), los montos en quetzales dentro del desglose (aparecen al tocar la fila), la exportación a CSV y la ejecución del cierre. El cierre es una operación irreversible y preferimos que no se pueda disparar con un toque accidental.

**Lo que nunca sacrificamos:** la diferencia entre mora y riesgo, los incobrables junto al riesgo y la fecha de corte.

### 7.3 Qué pasa si Mariela registra un pago sin señal

Esta decisión de experiencia solo es posible porque dos decisiones del Proyecto 1 la sostienen.

**La clave de idempotencia.** Al tocar "Confirmar", la app genera **una sola vez** una `Idempotency-Key` y la guarda con el pago en el teléfono. Solo después muestra "Pendiente de enviar". Cuando vuelve la señal, envía el pago **con la misma clave y el mismo contenido**, y el contrato OpenAPI del P1 responde de una de tres formas:

- **201:** el pago es nuevo y queda confirmado.
- **200 con `Idempotency-Replayed: true`:** el pago ya había llegado (el primer envío llegó, pero se perdió la respuesta). Se confirma sin cobrar de nuevo.
- **409:** esa clave ya existe con un contenido distinto. La app lo muestra como un conflicto para revisión y **nunca genera una clave nueva automáticamente**.

**El puerto Reloj.** Supongamos que la cuota de Carlos tiene 30 días de atraso: Mariela recibe el pago hoy sin señal y el teléfono lo sincroniza mañana. Si el sistema usara la fecha de sincronización, la cuota ya tendría 31 días y Carlos pagaría Q1,040.99 en lugar de Q1,015.51, **Q25.48 de más** por una demora que no es suya. La solución ya estaba en el P1: la fecha es un parámetro, no "hoy". El teléfono fija la `fechaPago` en el momento de confirmar y el núcleo la recibe como parámetro, sin leer nunca el reloj del sistema.

**Un ajuste que descubrimos.** El OpenAPI del P1 sugiere que la clave de idempotencia dure 24 horas. Si Mariela pasa más de un día sin señal, su reintento llegaría con la clave vencida y se procesaría como un pago nuevo. Proponemos que la clave dure más que la ventana máxima sin conexión (30 días) y lo dejamos anotado para el Proyecto Final.

Documento completo: `docs/proyecto2/e4-decision-movil-web.md`.

---

## 8. E5 · Evaluación heurística y de accesibilidad

### 8.1 Cómo usar esta sección

El enunciado pide que **los cuatro integrantes evalúen por separado** y luego consoliden, porque varios evaluadores independientes encuentran más problemas que uno solo. Lo que sigue es una **evaluación preliminar hecha por un evaluador** (el asistente de IA, declarado en §11) al recorrer el prototipo el 23 de septiembre de 2026. Sirve de punto de partida, pero **no sustituye** la evaluación del equipo: cada integrante debe hacer la suya, tomar capturas como evidencia y registrar quién encontró qué.

Escala de severidad (Anexo C): 0 no es problema · 1 cosmético · 2 menor · 3 mayor · 4 catastrófico.

### 8.2 Hallazgos heurísticos preliminares (Nielsen)

| # | Pantalla | Hallazgo | Heurística | Sev. | Corrección propuesta |
|---|---|---|---|---|---|
| H-01 | Detalle de mora | Usa tasas mensuales de 0.5 %–2 % sobre el saldo total; no son las de la política ni las del núcleo | 2 · Correspondencia con el mundo real | **4** | Mostrar el caso M-3 con las tasas anuales y el capital en mora (§6.4) |
| H-02 | Detalle de mora | "Total a pagar hoy" suma el saldo completo más los recargos; el cliente creería que debe Q6,469.31 hoy | 5 · Prevención de errores | **4** | Mostrar lo exigible de la cuota vencida (M-5: Q1,047.76) |
| H-03 | Detalle de mora | Un crédito incobrable (132 días) sigue mostrando recargos, y los datos corresponden a otro cliente | 4 · Consistencia | 3 | Congelar la mora en el día 120 y enlazar los datos correctos |
| H-04 | Sin señal | El folio cambia al sincronizar; la asesora no puede saber si es el mismo pago | 1 · Visibilidad del estado | 3 | Mantener el mismo folio (clave de idempotencia) en todos los reintentos |
| H-05 | Sin señal | "Si lo registra otra vez se duplicará" le deja al usuario la tarea de evitar el doble cobro | 5 · Prevención de errores | 3 | Que el sistema lo impida: "Este pago ya está guardado; si lo vuelve a intentar no se cobrará dos veces" |
| H-06 | Registrar pago | Mientras se escribe, el monto aparece como "Q 10000", sin separador de miles | 5 · Prevención de errores | 3 | Formato en vivo "Q 10,000.00" desde la primera tecla |
| H-07 | Registrar pago | Gastos de gestión de Q150.00; la política es Q25.00 por cuota vencida | 2 · Correspondencia | 3 | Usar el oráculo M-5 |
| H-08 | Solicitud enviada | El cliente cambia de Carlos Martínez a Juan Pablo Pérez | 4 · Consistencia | 3 | Mantener el cliente seleccionado en el paso 1 |
| H-09 | Plan de amortización | La cuota 12 (Q1,004.63) está resaltada pero sin explicación | 10 · Ayuda y documentación | 2 | Nota: "1 centavo más para que el saldo cierre exacto en Q0.00" |
| H-10 | Mis Clientes | Las etiquetas "Mora 1/2/3" no dicen nada al cliente | 2 · Correspondencia | 2 | Acompañarlas con "más de 30 días de atraso" |
| H-11 | Todas | La ayuda solo aparece en el inicio de sesión ("Llama al soporte técnico") | 10 · Ayuda / WCAG 3.2.6 | 2 | Un ícono "?" en el mismo lugar de cada encabezado |
| H-12 | Registrar pago | Los atajos "1 cuota / 2 cuotas / 3 cuotas" no llenan el monto | 7 · Flexibilidad y eficiencia | 2 | Conectar cada atajo con el monto correspondiente |
| H-13 | Pago aplicado | El comprobante no muestra el saldo que queda después del pago | 1 · Visibilidad del estado | 2 | Agregar "Saldo de capital restante" |
| H-14 | Detalle de mora y pago | Textos secundarios muy pequeños y en gris claro ("Adeudado: Q150.00", notas de tramo), difíciles de leer bajo el sol | 8 · Diseño estético / WCAG 1.4.3 | 2 | Subir a 14 px y oscurecer hasta un contraste ≥ 4.5:1 |

### 8.3 Auditoría preliminar WCAG 2.2 (criterios A/AA nuevos + 3.3.4)

| Criterio | Nivel | Resultado preliminar | Observación |
|---|---|---|---|
| 2.4.11 Foco no oculto (mínimo) | AA | No verificable en Figma | Revisarlo en la implementación React: el encabezado fijo no debe tapar el foco |
| 2.5.7 Movimientos de arrastre | AA | ✅ Cumple | Ninguna acción requiere arrastrar; todo se resuelve con toques |
| 2.5.8 Tamaño del objetivo (mínimo) | AA | ✅ Cumple | Botones y tarjetas muy por encima de 24 × 24 px |
| 3.2.6 Ayuda consistente | A | ❌ No cumple | Ver H-11 |
| 3.3.7 Entrada redundante | A | ⚠️ Revisar | En la solicitud se elige el cliente de la lista (bien). Falta la pantalla de alta de cliente para comprobar que no se pide dos veces el DPI |
| 3.3.8 Autenticación accesible (mínimo) | AA | ✅ Probable | Usuario y contraseña con opción de mostrarla; confirmar que se permita pegar la contraseña |
| 3.3.4 Prevención de errores (financieras) | AA | ⚠️ Parcial | Pago y solicitud tienen revisión y salida. **Falta la confirmación de desembolso** |
| 1.4.3 Contraste mínimo (heredado) | AA | ⚠️ Revisar | Ver H-14 |

### 8.4 Correcciones con antes/después y design review

Todavía **falta**:

- Elegir al menos cinco hallazgos, corregirlos en Figma y guardar la captura de antes y de después. Recomendamos H-01, H-02, H-04, H-06 y H-09, porque son los que más afectan al dinero y a la nota.
- Documentar qué se aceptó y qué se rechazó del design review de la sesión 9, con su argumento.

---

## 9. E6 · Evolución del núcleo e informe de impacto SOLID

### 9.1 Qué construimos

Implementamos los cuatro cambios de la sección 7 del enunciado:

- **CP-01 · Política escalonada.** Cada día de atraso paga la tasa del tramo en que estaba: 18 %, 24 %, 30 % o 36 % anual sobre el capital en mora, con base Actual/360 y **un solo redondeo al final**. Así evitamos el error de un centavo que aparece si se redondea por tramo (Q18.15 en lugar de Q18.14 a 45 días).
- **CP-02 · Gasto de gestión de cobro.** Q25.00 por cuota vencida al día 31, una sola vez, aunque el cierre se ejecute dos veces.
- **CP-03 · Coexistencia de políticas.** Los créditos otorgados antes del 1 de octubre conservan la política plana del 24 %. A 45 días, el crédito CV-2026-0100 paga Q21.77 y el CV-2026-0410 paga Q18.14, en el mismo sistema y en el mismo cierre.
- **CP-04 · Correcciones del P1.** La transición `en_mora → cancelado`, la suspensión del devengo después del día 90 y el desglose de la cartera en riesgo por tramo.

### 9.2 Lo que midió el informe de impacto

| Métrica | Resultado | Qué significa |
|---|---|---|
| Archivos del núcleo creados | **10** | La funcionalidad nueva vive en archivos nuevos |
| Archivos del núcleo modificados | **2 de 7** (`calculadora-mora.ts` y `credito-estado.ts`) | Dentro del objetivo de ≤ 2 |
| ¿Se modificó el motor de cálculo? | **Sí**, +32/−19 líneas | Lo reconocemos: en el P1 no cumplíamos el principio abierto/cerrado para la mora |
| Pruebas del P1 que dejaron de pasar | **0** | Sin regresiones |
| Pruebas del P1 reescritas | **0** | El diff de los 10 archivos de prueba del P1 está vacío |
| Líneas netas en `src/dominio` | **+360** | De ellas, la política de mora ocupa 109; el resto corresponde a CP-02 y CP-04 |

**¿Por qué tuvimos que abrir el motor?** En el P1, la mora se calculaba con un método estático que recibía una *tasa*, no una *política*. No había un punto de extensión. Tuvimos que agregar un constructor que recibe la política inyectada. La fachada del P1 se conservó intacta para que sus 206 pruebas siguieran pasando. Desde ahora, **agregar una política nueva no requiere tocar el motor**, y lo demostramos agregando la política retroactiva sin cambiarlo. Lo que haríamos distinto: declarar el puerto `PoliticaMora` desde el P1, aunque solo existiera la política plana.

**Los cinco principios en una línea cada uno:**

- **S (responsabilidad única):** quién decide el tramo (`clasificacion-tramo.ts`) y quién decide cuánto cuesta (cada política) son piezas separadas y se prueban por separado.
- **O (abierto/cerrado):** se cumple **a partir del P2**, no antes.
- **L (sustitución de Liskov):** la misma batería de pruebas corre contra las tres políticas: 288 combinaciones de política, moneda, capital y días de atraso.
- **I (segregación de interfaces):** el puerto tiene solo dos miembros, `id` y `calcular`.
- **D (inversión de dependencias):** el motor importa la política solo como tipo y nunca nombra una implementación concreta.

### 9.3 Las pruebas

La última ejecución registrada da **263 pruebas aprobadas en 18 archivos**, sin errores de tipos. Pasan los casos M-1 a M-5 (Q5.44, Q18.14, Q50.80, Q65.32 y Q1,047.76), la coexistencia de políticas (Q21.77 frente a Q18.14), la prueba original de Q7.26 del P1, el contrato de las tres políticas, los ocho invariantes de la sección 7.9, CP-04.1, CP-04.2 (entre el día 90 y el 100 el ingreso no sube y el interés en suspenso sí) y CP-04.3 (3.00 + 2.25 + 1.00 + 0.75 = 7.00 %). El núcleo no importa `express` ni `pg`, no usa `any`, mantiene `"strict": true` y nunca lee la fecha del sistema.

Documentos completos: `docs/informe-impacto-solid.md`, `docs/adr/ADR-004-politica-mora-escalonada.md` y `docs/proyecto2/e6-0*.md`.

---

## 10. Reparto del trabajo

La tabla se armó a partir del historial de Git y de los roles declarados en el P1. **Cada integrante debe confirmar o corregir su fila**, especialmente las contribuciones que no dejan rastro en Git (Figma, investigación, design review).

| Integrante | Responsabilidad principal | Evidencia verificable | Entregables |
|---|---|---|---|
| Christopher David Herrera Pérez | Ingeniería de dominio: políticas de mora, gasto de cobro, CP-04 y comandos de prueba | Commits `71a5179`, `ec2a436`, `d3b30f5`, `5752b55`, `5e73d12` | E6 |
| Erwin Alberto Ramírez Racancoj | Pruebas de contrato, documentación técnica, validación y README (commits como *ERAMR18* y *Erwin*; confirmar que ERAMR18 es la misma persona) | Commits `0d6c1a9`, `958e70f`, `8112e57`, `13aa167` | E6, E7 |
| Gabriela Elízabeth Noemí Aguilar Vásquez | Documentación de pruebas e informe de verificación SOLID; *(agregar: Figma / investigación)* | Commits `9e06c37`, `8e421a6` | E6, *(E1–E3)* |
| Oliver Fernando Romero Esquite | Coordinación e integración (PR #1), documentación de E1, E2 y E4, consolidación del informe SOLID; *(agregar: Figma)* | Commits `183dc71`, `16f983f` y siguientes | E1, E2, E4, E7 |

---

## 11. Declaración de uso de herramientas de IA

Usamos herramientas de IA como apoyo, tal como permite la sección 15 del enunciado:

| Herramienta | Para qué la usamos |
|---|---|
| **OpenAI Codex** | Apoyo en la evolución del núcleo (CP-01 a CP-04), en las pruebas y en la documentación técnica de E6 |
| **Claude (Anthropic)** | Apoyo en la redacción de E1, E2 y E4; en la generación de los wireframes de baja fidelidad mediante un script editable; en la reorganización del informe SOLID según el Anexo D; en el historial de cambios; en la revisión preliminar del prototipo de Figma (§6.4 y §8) y en la redacción de este documento |

Las decisiones de diseño y su justificación son del equipo, y cualquiera de los cuatro debe poder explicarlas en la defensa. Las personas del E1 se apoyan en fuentes documentadas; los rasgos marcados como hipótesis **no** provienen de entrevistas. Los hallazgos del §8 son de un solo evaluador y deben complementarse con la evaluación independiente de cada integrante.

---

## 12. Dónde encontrar cada cosa en el repositorio

| Tema | Archivo |
|---|---|
| Índice por entregable | `docs/proyecto2/README.md` |
| Este documento | `docs/proyecto2/P2-documento-entrega.md` |
| Todos los documentos técnicos unidos | `docs/proyecto2/documentacion-completa.md` |
| Historial de commits, archivo por archivo | `docs/proyecto2/historial-cambios.md` |
| E1 · Personas y journey map | `docs/proyecto2/e1-investigacion-usuario.md` |
| E1 · Instrumentos de entrevista y encuesta | `docs/proyecto2/e1-instrumentos-investigacion.md` |
| E2 · Navegación, tabla 6.1 y tablero | `docs/proyecto2/e2-arquitectura-informacion.md` |
| E2 · Wireframes | `docs/proyecto2/wireframes/` |
| E4 · Decisión PWA y trabajo sin conexión | `docs/proyecto2/e4-decision-movil-web.md` |
| E6 · Informe de impacto SOLID | `docs/informe-impacto-solid.md` |
| E6 · Decisión de arquitectura | `docs/adr/ADR-004-politica-mora-escalonada.md` |
| E6 · Auditoría, evolución, pruebas y validación | `docs/proyecto2/e6-01` a `e6-04` |
| Código del núcleo | `src/dominio/` |
| Pruebas | `tests/` · se ejecutan con `npm test` |
