<!-- Archivo generado por generar_documento_entrega.py a partir de fuente-documento-entrega.md. No editar a mano. -->
# Proyecto 2 · UX/UI, movilidad y evolución del núcleo

**Sistema de Gestión de Microcrédito — Crédito Vecino, S. A.**
Análisis de Sistemas II (037) · Universidad Mariano Gálvez de Guatemala · Segundo semestre 2026 · Modalidad sabatina

| Dato | Valor |
|---|---|
| **Integrantes** | Christopher David Herrera Pérez · Erwin Alberto Ramírez Racancoj · Gabriela Elízabeth Noemí Aguilar Vásquez · Oliver Fernando Romero Esquite |
| **Grupo · carnés · sección** | *(completar antes de exportar el PDF)* |
| **Docente** | *(completar)* |
| **Prototipo navegable (Figma)** | https://www.figma.com/proto/jozM3QI8ZJ6pywdCoO5OVo/Microcr%C3%A9ditos-App?node-id=0-1&t=PJlTVLC3ASu31ttw-1 |
| **Repositorio** | https://github.com/ItsRomero/Proyecto1_Analisis |
| **Commit de entrega del Proyecto 1** | `8737d9b` (etiqueta `entrega-p1`) |
| **Fecha de entrega** | Viernes 25 de septiembre de 2026 |

---

# 1. Introducción

## 1.1 Qué responde este proyecto

El Proyecto 1 respondió a la pregunta *¿cómo está construido el sistema por dentro?* Definimos la arquitectura hexagonal, los componentes y un núcleo de dominio en TypeScript que calcula el dinero: plan de amortización, prelación de pagos, mora e indicadores de cartera. El Proyecto 2 trabaja sobre **el mismo sistema, el mismo repositorio y el mismo equipo** (regla de incrementalidad) y agrega dos preguntas.

**¿Cómo se usa el sistema?** Un motor de cálculo impecable produce créditos mal capturados si la asesora, de pie bajo el sol y con una mano ocupada, tiene que escribir el monto en un campo ambiguo. En una financiera, la interfaz es donde se originan la mayoría de los errores de datos. Por eso investigamos a los usuarios (E1), organizamos la información y dibujamos los wireframes (E2), construimos un prototipo navegable en Figma (E3), decidimos cómo debe funcionar la aplicación en el teléfono y sin señal (E4) y evaluamos el prototipo con las heurísticas de Nielsen y WCAG 2.2 (E5).

**¿Resiste el diseño un cambio de requisito real?** El comité de Crédito Vecino (Acta 09-2026) decidió que, desde el 1 de octubre de 2026, la mora deja de cobrarse con una tasa plana del 24 % y pasa a cobrarse **por tramos recorridos**: 18 %, 24 %, 30 % y 36 % anual según los días de atraso. Los créditos anteriores conservan la política vieja. Implementamos ese cambio en el núcleo del Proyecto 1 (E6) y medimos, con el historial de Git como evidencia, cuánto tuvimos que modificar. Ese es el informe de impacto SOLID.

## 1.2 Cómo leer este documento

Cada capítulo corresponde a un entregable del enunciado (sección 9) y sigue el orden E1 → E7. Tres convenciones se repiten en todo el documento:

- **Las cifras salen del núcleo.** Q1,004.62, Q18.14, Q50.80, 7.00 % y 21.75 % son resultados de `src/dominio` verificados por las pruebas (`npm test`), no estimaciones (regla 6.2 del enunciado).
- **Cada afirmación dice de dónde sale.** En la investigación distinguimos lo que viene del enunciado, de fuentes documentadas, del núcleo y lo que todavía es una hipótesis por validar.
- **Somos transparentes con lo que falta.** El capítulo 10 contrasta el trabajo con la lista de verificación de la sección 12.2 del enunciado.

La sección 8.2 presenta en una tabla ordenada **todos los commits** hechos desde la entrega del Proyecto 1, con lo que aportó cada uno.

---

# 2. E1 · Investigación de usuario

Este capítulo responde al entregable E1: personas fundamentadas, journey map del flujo principal y los momentos en que un error de interfaz se convierte en un error de dinero. Incluye el cuarto momento que el enunciado exige: el instante en que el cliente descubre que su mora subió de tramo.

## 2.1 Método y estado de la evidencia

La investigación combina tres fuentes, y cada afirmación de este documento indica de cuál proviene:

| Código | Tipo de fuente | Qué aporta | Estado |
|---|---|---|---|
| **ENU** | Enunciado P2, sección 3 (contexto de los tres perfiles) | Condiciones de trabajo del asesor, necesidades del cliente y de gerencia | Requisito del caso |
| **DOC** | Fuentes documentadas: SIB (ENIF 2024-2027), Banco Mundial (Global Findex 2025, panorama Guatemala), DataReportal *Digital 2024: Guatemala*, IICA/BID sobre conectividad rural | Contexto nacional de inclusión financiera, uso de teléfono e internet y brecha territorial | Documentado |
| **NÚC** | Núcleo de cálculo del repositorio (`src/dominio`) y sus pruebas | Cifras exactas con las que se construyen los escenarios (Q1,004.62, Q18.14, 7.00 %, etc.) | Verificado por `npm test` |
| **HIP** | Hipótesis de diseño derivadas de las anteriores | Conductas concretas que el equipo espera encontrar en campo | **Pendiente de validar** con los instrumentos de `e1-instrumentos-investigacion.md` |

Hallazgos del contexto documentado que sustentan las personas:

- **Hay muchos teléfonos, pero no tanta internet.** En enero de 2024 Guatemala tenía 20.65 millones de conexiones móviles (113.3 % de la población), pero solo el 60.3 % de la población usaba internet (DataReportal, *Digital 2024: Guatemala*). *Implicación:* el cliente casi siempre tiene un teléfono, pero no se puede suponer que tenga datos móviles. Los avisos al cliente no pueden depender solo de una app.
- **La conectividad rural es baja.** El IICA, con apoyo del BID y Microsoft, ubica a Guatemala entre los nueve países de América Latina y el Caribe con menor conectividad rural. También señala que una alta penetración de teléfonos móviles no equivale a conectividad, porque esta se concentra en zonas urbanas (Prensa Libre, 2020). *Implicación:* el asesor que visita negocios fuera de la cabecera trabajará sin señal durante parte de su ruta (ENU lo confirma: "señal intermitente o nula").
- **Digitalizar es una prioridad nacional.** La Estrategia Nacional de Inclusión Financiera 2024-2027 de la SIB prioriza el uso de canales digitales en los servicios financieros. *Implicación:* la digitalización del cobro en campo está alineada con la política pública, pero debe incluir a clientes con poca experiencia digital.

> **Límite declarado.** A la fecha de este documento el equipo **no ha aplicado todavía** las entrevistas ni la observación de campo. Los instrumentos están listos en [e1-instrumentos-investigacion.md](e1-instrumentos-investigacion.md). Las personas son **provisionales**: sus rasgos marcados como HIP deben confirmarse o corregirse antes de cerrar el prototipo de alta fidelidad (E3). No presentamos hipótesis como hallazgos de campo.

## 2.2 Personas

Las tres personas siguen la plantilla del Anexo A del enunciado. La edad no se usa como indicador de habilidad digital.

### 2.2.1 Mariela López, asesora de crédito en campo

| Campo | Contenido | Fuente |
|---|---|---|
| Rol y contexto | Asesora de Crédito Vecino. Visita entre 8 y 12 clientes al día en sus negocios o casas, origina solicitudes y cobra cuotas atrasadas. Trabaja de pie, a menudo bajo el sol, y con una mano ocupada (cartapacio, efectivo o documentos del cliente). | ENU |
| Dispositivo | Teléfono Android de gama media proporcionado por la empresa: pantalla de unas 6", poca memoria libre y batería que debe durar toda la jornada. | ENU · HIP (modelo concreto) |
| Conectividad | Intermitente o nula en parte de la ruta. Buena señal solo en la oficina y en la cabecera municipal. | ENU · DOC |
| Iluminación | Luz solar directa: los grises claros y los textos pequeños no se leen. | ENU |
| Manos libres | Opera con el pulgar de una sola mano durante la visita; teclea poco y mal cuando está de pie. | ENU |
| Alfabetización digital | Operativa: usa WhatsApp, cámara y apps bancarias. No conoce el concepto de "sincronización" ni tiene por qué conocerlo. | HIP |
| Objetivos (en sus palabras) | "Terminar la visita sin volver a pedirle nada al cliente." · "Saber que el pago quedó registrado una sola vez." · "Poder explicarle al cliente a dónde se fue su dinero." | ENU · HIP |
| Frustraciones actuales (hojas de cálculo) | Anota el pago en papel y lo transcribe al volver a la oficina, a veces al día siguiente; la fecha que queda registrada es la de la transcripción, no la del pago. Cuando la hoja compartida no abre sin internet, lleva una copia impresa que ya está desactualizada. | HIP |
| Relación con la mora | Debe explicar por qué un cliente debe más este mes. Con la política escalonada tiene que explicar tramos, no una sola tasa. | ENU |
| Cita representativa | *"Si la app me hace escribir el DPI dos veces, el cliente piensa que no sé lo que hago."* | HIP (cita a validar en entrevista) |

**Qué exige a la interfaz:** diseño mobile-first con objetivos táctiles de 48 px o más (por encima del mínimo de 24 px de WCAG 2.5.8), alto contraste y un modo de trabajo sin conexión con estado visible ("Guardado en el teléfono · pendiente de enviar"). Montos siempre con el prefijo **Q** y separador de miles, y el menor tecleo posible.

### 2.2.2 Carlos Chávez, cliente de microcrédito

| Campo | Contenido | Fuente |
|---|---|---|
| Rol y contexto | Tiene una tienda de barrio. Pidió **Q10,000 a 12 meses** para surtir inventario: es el caso de referencia del P1, con una cuota de **Q1,004.62** y la cuota 12 de **Q1,004.63**. | ENU · NÚC |
| Dispositivo | Teléfono propio con saldo prepago. A veces tiene datos y a veces no; los SMS siempre le llegan. | DOC · HIP |
| Conectividad | Variable; en su zona la señal de datos es débil dentro del local. | DOC |
| Iluminación y entorno | Atiende la tienda mientras habla con la asesora; lo interrumpen clientes. | HIP |
| Alfabetización digital | Baja a media: lee mensajes y usa WhatsApp, pero no navega por menús complejos ni entiende "TNA", "Actual/360" ni "prelación". | ENU · HIP |
| Objetivos (en sus palabras) | "Saber cuánto debo, cuándo pago y cuánto me falta." · "Que me avisen antes, no cuando ya me cobraron más." · "Tener un papel o un mensaje que diga que ya pagué." | ENU |
| Frustraciones actuales | Recibe un solo número ("debe Q1,040.99") sin saber por qué subió. Desconfía de lo que no entiende y lo percibe como una multa arbitraria, exactamente lo que el Acta 09-2026 del comité quiere evitar. | ENU (sección 7.1) · HIP |
| Relación con la mora | Sabe que atrasarse cuesta más, pero no sabe **cuánto por día** ni que al día 31 se agrega un **gasto de gestión de cobro de Q25.00**. | ENU · NÚC |
| Cita representativa | *"Si me explican, pago; si me cae de sorpresa, siento que me están robando."* | HIP |

**Qué exige a la interfaz:** lenguaje llano ("lleva 45 días de atraso", no "Mora 2"), cifras que no se puedan malinterpretar, desglose progresivo (primero el total y, al tocarlo, los tramos) y avisos **antes** de cada cambio de tramo por un canal que no dependa de tener datos (SMS).

### 2.2.3 Andrea Morales, gerente de cartera y miembro del comité

| Campo | Contenido | Fuente |
|---|---|---|
| Rol y contexto | Gerente de cartera; integra el comité de crédito. Revisa indicadores a diario y presenta el cierre mensual al comité. | ENU |
| Dispositivo | Computadora de escritorio con monitor grande en oficina; consulta rápida desde el teléfono cuando está en reunión o fuera de la oficina. | ENU · HIP (uso móvil) |
| Conectividad | Estable en oficina. | ENU |
| Alfabetización digital | Alta en hojas de cálculo; alta alfabetización financiera. | HIP |
| Objetivos (en sus palabras) | "En 30 segundos saber si la cartera se está deteriorando." · "Pasar del porcentaje a los créditos concretos." · "Confiar en que el cierre no se duplicó." | ENU · HIP |
| Frustraciones actuales | Las hojas de cálculo rotulan como "mora" tanto la cartera con cualquier atraso como la cartera en riesgo. Cuando se da de baja un crédito, el indicador de riesgo baja (7.00 % → 6.06 %) y parece una mejora aunque no se cobró nada. | ENU (sección 7.8) · NÚC |
| Relación con la mora | Decide con cartera en mora (21.75 %), cartera en riesgo (7.00 %), el desglose por tramo e incobrables del período. | ENU · NÚC |
| Cita representativa | *"No me muestre un número sin decirme qué número es."* | HIP |

**Qué exige a la interfaz:** diseño responsivo pensado para escritorio, densidad alta pero con jerarquía clara, **rótulos y definiciones distintos** para cada indicador, lo dado por incobrable junto a la cartera en riesgo, y navegación de lo general al detalle del crédito (drill-down).

## 2.3 Journey map del flujo principal: de la solicitud a la primera cuota

Escenario: Carlos solicita Q10,000 a 12 meses con Mariela y paga su primera cuota de Q1,004.62. En la variante con atraso (etapas 9b y 9c), la cuota vencida usa el capital de la cuota 2 del caso de referencia (Q725.76), igual que los oráculos M-1 a M-5 del enunciado. Escala emocional: −2 muy negativa … +2 muy positiva.

```mermaid
journey
  title Carlos y Mariela: de la solicitud a la primera cuota
  section Originación
    1 Solicitud en el negocio: 0: Carlos, Mariela
    2 Captura de datos y DPI: -1: Mariela
    3 Evaluación del comité: -1: Carlos
    4 Aprobación y condiciones: 1: Carlos
    5 Simulación del plan: 1: Carlos, Mariela
    6 Desembolso: 2: Carlos
  section Antes de pagar
    7 Consulta de saldo: 0: Carlos
    8 Recordatorio de cuota: 0: Carlos
  section Pago
    9 Pago de la primera cuota: -1: Carlos, Mariela
    10 Comprobante: 1: Carlos
```

| # | Etapa | Actor | Acción | Emoción | Punto de dolor concreto | Oportunidad de diseño | Pantalla | Fuente |
|---|---|---|---|---|---|---|---|---|
| 1 | Solicitud | Carlos, Mariela | Carlos dice cuánto necesita y en cuánto tiempo | 0: expectativa y duda | Mariela escribe "10000" en un campo sin formato; un cero de más (Q100,000) o de menos (Q1,000) no se detecta porque el campo no muestra separador de miles ni los límites Q1,000–Q25,000. | Campo con prefijo Q, formato en vivo "Q10,000.00", rango visible y validación inmediata; plazo con botones de 3 a 24 meses, no teclado. | P04 Nueva solicitud | ENU · HIP |
| 2 | Captura | Mariela | Registra DPI, datos del negocio y foto | −1: prisa | La señal se cae a mitad del formulario; al reintentar, la sesión expiró y Mariela debe **recapturar el DPI y los datos del negocio** frente al cliente. | Borrador guardado en el teléfono campo por campo; la sesión no expira mientras hay un borrador; aviso "Guardado en el teléfono". Cumple WCAG 3.3.7 (no pedir de nuevo un dato ya capturado). | G01 Alta de cliente (guía) | ENU · HIP |
| 3 | Evaluación | Comité, Carlos | El comité revisa la solicitud | −1: incertidumbre | Carlos no sabe si su solicitud "está en algún lado". Mariela no puede decirle en qué estado está porque la hoja no guarda el historial. | Estado visible (Solicitado → En evaluación → Aprobado) consultable por la asesora; la bandeja del comité muestra el motivo si se rechaza. | G03 Bandeja del comité (guía) | ENU · NÚC (estados) |
| 4 | Aprobación | Carlos | Recibe la noticia | +1: alivio | Le comunican "aprobado" sin la cuota ni el costo total; Carlos acepta sin saber que pagará **Q2,055.45 de interés**. | Resumen con monto, plazo, tasa en lenguaje llano ("3 % al mes"), cuota y total a pagar antes de confirmar. | P05 Simulación → P06 Confirmar solicitud | NÚC |
| 5 | Simulación del plan | Carlos, Mariela | Revisan las 12 cuotas | +1: control | La cuota 12 dice **Q1,004.63** y Carlos cree que hay un error de un centavo. Si la pantalla la oculta o la iguala a Q1,004.62, el plan mostrado no coincide con el cobrado. | Plan con las 12 filas del núcleo y una nota junto a la cuota 12: "1 centavo más para cerrar el saldo exacto". | P09 Plan de amortización | NÚC |
| 6 | Desembolso | Encargado, Carlos | Se confirma y se entrega el dinero | +2: alegría | Un doble toque en "Desembolsar" con la señal lenta puede generar **dos desembolsos** si la operación no es idempotente. | Pantalla de revisión y confirmación explícita (WCAG 3.3.4), botón deshabilitado tras el primer toque y clave de operación única. | G02 Confirmación de desembolso (guía) | ENU · NÚC |
| 7 | Seguimiento | Carlos | Pregunta cuánto debe | 0 | La cifra que ve Mariela sin señal es de ayer y no dice de qué fecha es; Carlos recibe un saldo desactualizado. | Todo saldo muestra su fecha de corte: "Saldo al 23/09/2026". Sin conexión se rotula como "calculado con datos del 22/09". | P08 Detalle del crédito | ENU · HIP |
| 8 | Recordatorio | Carlos | Recibe aviso de su primera cuota | 0 | El aviso llega por una app que Carlos no abre sin datos, o llega **el mismo día** del vencimiento. | SMS 3 días antes y el día del vencimiento con monto y fecha; canal a validar con la encuesta (pregunta 12). | (Notificación) | DOC · HIP |
| 9 | Pago | Mariela, Carlos | Mariela recibe Q1,004.62 y lo registra | −1: tensión | Mariela registra el pago sin señal. La app no dice si se envió; Mariela lo vuelve a intentar y teme **cobrarlo dos veces**. | Estado "Pendiente de enviar · se enviará solo al tener señal", misma clave de idempotencia en cada reintento y comprobante provisional. | P11 Registrar pago · P14 Sin señal | ENU · NÚC |
| 9b | (Variante) Pago con atraso de 45 días | Mariela, Carlos | La cuota vencida suma Q1,047.76 | −2: sorpresa | Carlos esperaba pagar Q1,004.62 y le piden **Q1,047.76** sin explicación: Q25.00 de gasto + Q18.14 de mora + Q278.86 de interés + Q725.76 de capital. | Desglose en el orden de la prelación, con "¿por qué?" en cada concepto. | P10 Detalle de mora | NÚC (M-5) |
| 9c | (Variante) Cambio de tramo | Carlos | Pasa del día 30 al 31 | −2: enojo | En un día, el total de la cuota pasa de **Q1,015.51 a Q1,040.99** (+Q25.48) y Carlos se entera en la visita de cobro, cuando ya ocurrió. | Momento crítico MC-4 (§2.4.1). | P10 Detalle de mora + aviso SMS | NÚC · HIP |
| 10 | Comprobante | Carlos | Recibe comprobante | +1: confianza | Un comprobante que solo dice "Pagado Q1,004.62" no permite comprobar cuánto fue a interés (Q300.00) y cuánto a capital (Q704.62). | Comprobante con la prelación aplicada y el saldo resultante (Q9,295.38), enviado por SMS o impreso. | P13 Pago aplicado | NÚC |

Cifras de la primera cuota según el núcleo: interés Q300.00 + capital Q704.62 = Q1,004.62; el saldo pasa de Q10,000.00 a Q9,295.38.

## 2.4 Momentos críticos: error de interfaz → error de dinero

Cada momento indica la causa en la interfaz, la consecuencia monetaria con cifras del núcleo y el control de diseño que la previene.

| ID | Momento | Error de interfaz | Consecuencia en dinero | Prevención (diseño) | Recuperación |
|---|---|---|---|---|---|
| **MC-1** | Captura del monto en la solicitud | Campo numérico sin formato ni límites; se teclea "1000" en lugar de "10000" o se escribe un punto decimal como separador de miles | Un crédito de Q1,000 en vez de Q10,000 cambia **las 12 cuotas** (de Q1,004.62 a unos Q100.46) y el contrato firmado no refleja lo solicitado | Prefijo Q, formato en vivo, rango Q1,000–Q25,000 visible, resumen "Diez mil quetzales" en letras antes de confirmar | Botón "Editar" en la pantalla de revisión; nada se envía sin confirmación (WCAG 3.3.4) |
| **MC-2** | Registro de un pago sin señal | La app no muestra el estado del envío y Mariela toca "Registrar" otra vez o captura el pago de nuevo | **Doble cobro**: Q1,004.62 × 2; el cliente pierde la confianza | Cola local con **la misma Idempotency-Key** en cada reintento; estado visible Pendiente / Enviado / Confirmado; el botón se bloquea tras el primer toque (ver E4) | Si el servidor responde que la clave ya existe, se muestra el pago original y no se crea otro |
| **MC-3** | Lectura del tablero gerencial | Rotular igual "cartera en mora" (21.75 %) y "cartera en riesgo" (7.00 %), o mostrar solo uno sin decir cuál es | El comité decide sobre el número equivocado: provisiona o restringe la colocación por 21.75 % cuando el riesgo real es 7.00 %, o celebra un 6.06 % que solo bajó por la baja de C-005 | Dos tarjetas con nombre, definición y forma distintos; incobrables del período junto al riesgo (ver §3.5) | Enlace "¿Qué incluye?" en cada indicador, que abre el desglose por tramo |
| **MC-4** | **El cliente descubre que su mora subió de tramo** | Sin aviso previo: el cliente se entera después y por la persona que le cobra | +Q25.48 en un día (Q1,015.51 → Q1,040.99), percibidos como multa arbitraria; más probabilidad de disputa y de dejar de pagar | Aviso preventivo por SMS y detalle por tramos (ver §2.4.1) | La pantalla de detalle de la mora permite verificar tramo por tramo |

### 2.4.1 MC-4 en detalle: el cambio de tramo

El enunciado pregunta: *¿Se enteró antes o después? ¿Por qué canal?*

**Situación actual (con hojas de cálculo):** Carlos se entera **después** y **en persona**. La política escalonada genera el gasto de gestión de cobro precisamente al entrar en Mora 2 (día 31), que es también cuando "se activa la gestión de cobro en campo" (sección 7.2). Por eso el primer contacto de Carlos con el nuevo tramo es la visita de Mariela, que llega a cobrar un total que ya subió.

| Día de atraso de la cuota 2 (capital Q725.76) | Tramo | Mora acumulada | Gasto de cobro | Total de la cuota (gasto + mora + Q278.86 + Q725.76) |
|---|---|---|---|---|
| 15 | Mora 1 | Q5.44 | Q0.00 | Q1,010.06 |
| 28 | Mora 1 | Q10.16 | Q0.00 | Q1,014.78 |
| 30 | Mora 1 | Q10.89 | Q0.00 | Q1,015.51 |
| **31** | **Mora 2** | **Q11.37** | **Q25.00** | **Q1,040.99** |
| 45 | Mora 2 | Q18.14 | Q25.00 | Q1,047.76 |
| 60 | Mora 2 | Q25.40 | Q25.00 | Q1,055.02 |
| 61 | Mora 3 | Q26.01 | Q25.00 | Q1,055.63 |
| 91 | Vencido | Q44.27 | Q25.00 | Q1,073.89 |

Además, en los días 1 a 30 la mora crece Q0.36 por día y en los días 31 a 60 crece Q0.48 por día. Esto responde a la pregunta del objetivo de aprendizaje: *por qué su mora creció más rápido este mes que el anterior*.

**Situación propuesta: Carlos se entera antes, por dos canales.**

| Cuándo | Canal | Mensaje (lenguaje llano, a validar con clientes) | Por qué ese canal |
|---|---|---|---|
| Día 28 de atraso | **SMS** | "Crédito Vecino: su cuota 2 lleva 28 días de atraso. Si paga en los próximos 2 días debe Q1,015.51. Después se agrega un cargo de visita de cobro de Q25.00." | Llega sin datos móviles; hay más conexiones móviles que usuarios de internet (DOC) |
| Día 31 (al entrar en Mora 2) | **SMS** + visita de la asesora | "Su cuota 2 pasó a más de 30 días de atraso. Ahora debe Q1,040.99. Pida a su asesora el detalle." | Confirma el cambio; el detalle se explica en persona |
| En la visita | **Pantalla "Detalle de la mora"**, en el teléfono de la asesora | Desglose por tramos recorridos: "30 días a 18 % al año → Q10.89 · 1 día a 24 % → Q0.48 · total redondeado una vez → Q11.37" | El cliente puede verificar; la asesora no tiene que improvisar la explicación |

El sistema calcula el plazo con la fecha de vencimiento real de la cuota más 30 días, a partir de la fecha de corte que recibe como parámetro. El núcleo expone el tramo (`clasificarTramoMora`) y el desglose (`detalle.tramos`), así que la interfaz no recalcula nada: solo presenta. El umbral de "3 días antes" y la redacción son hipótesis que se validan con las preguntas 9 y 10 de la guía de cliente y con las preguntas 11 y 12 de la encuesta.

## 2.5 Oportunidades priorizadas y trazabilidad hacia E2–E4

| ID | Oportunidad | Perfil | Prioridad | Dónde se resuelve |
|---|---|---|---|---|
| OP-1 | Borrador local y cola de pagos idempotente | Asesora | Alta | §5.4 · G01 Alta de cliente, P11 Registrar pago y P14 Sin señal |
| OP-2 | Revisión de monto, plazo y cuota antes de confirmar | Asesora, cliente | Alta | E2 · P04 Nueva solicitud, P05 Simulación, P06 Confirmar y G02 Desembolso |
| OP-3 | Mora explicada por tramos y avisada antes | Cliente | Alta | E2 · P10 Detalle de mora; aviso por SMS (MC-4) |
| OP-4 | Indicadores de mora y de riesgo claramente diferenciados | Gerencia | Alta | §3.5 · G04 Tablero gerencial |
| OP-5 | Objetivos táctiles grandes y alto contraste | Asesora | Media-alta | §5.3 · sistema responsivo |
| OP-6 | Comprobante con la prelación aplicada | Cliente | Media-alta | E2 · P13 Pago aplicado |

## 2.6 Plan de validación pendiente

1. Aplicar al menos una entrevista por perfil (guías en `e1-instrumentos-investigacion.md`) y una observación de una tarea de captura o cobro al aire libre.
2. Actualizar la columna "Fuente" de cada rasgo marcado HIP a **Validado**, **Corregido** o **Descartado**, con el código anónimo del participante.
3. Probar la comprensión de la pantalla "Detalle de la mora" (caso M-3) con al menos tres personas sin formación financiera.

## 2.7 Referencias

- Banco Mundial (2025). *The Global Findex Database 2025: Connectivity and Financial Inclusion in the Digital Economy*. https://www.worldbank.org/en/publication/globalfindex
- Banco Mundial (2025). *Guatemala 2024 Global Findex Microdata*. https://doi.org/10.48529/ad4w-j084
- Grupo Banco Mundial (2026). *Guatemala: panorama general*. https://www.bancomundial.org/ext/es/country/guatemala
- DataReportal (2024). *Digital 2024: Guatemala*. https://datareportal.com/reports/digital-2024-guatemala
- Prensa Libre (2020). *Guatemala, entre los nueve países con baja conectividad rural*, con datos de IICA, BID y Microsoft. https://www.prensalibre.com/economia/guatemala-entre-los-nueve-paises-con-baja-conectividad-rural-y-las-claves-para-ampliar-la-cobertura/
- Superintendencia de Bancos de Guatemala (2024). *Estrategia Nacional de Inclusión Financiera 2024-2027*. https://www.sib.gob.gt/estrategia-nacional-de-inclusion-financiera-guatemala-2024-2027/
- Universidad Mariano Gálvez de Guatemala (2026). *Enunciado del Proyecto 2*, secciones 3, 7 y 9.

---

# 3. E2 · Arquitectura de información y wireframes

Con las personas definidas, organizamos la aplicación. Este capítulo presenta el mapa de navegación, la tabla de correspondencia pantalla ↔ caso de uso que exige la sección 6.1 y los wireframes de baja fidelidad (skeleton y anotado). Todas las pantallas usan los **mismos nombres y códigos que el prototipo de Figma** (P01–P14), y las que faltan construir tienen su guía (G01–G07); los wireframes anotados completos están en el Anexo A. Al final se justifica la jerarquía del tablero gerencial y cómo se distinguen la cartera en mora y la cartera en riesgo.

## 3.1 Principios que ordenan la información

Cada principio sale de un hallazgo de [E1](e1-investigacion-usuario.md):

1. **Una aplicación, tres puertas de entrada.** Después de *Iniciar sesión* (P01), cada rol ve su propio inicio: la asesora ve **Mis Clientes** (P02), el comité su **Bandeja** (G03) y la gerencia el **Tablero** (G04). No hay una "pantalla para todos" (enunciado, sección 3).
2. **Cada pantalla invoca un puerto primario del P1.** La interfaz no calcula cifras: presenta lo que devuelve el núcleo (sección 6.2). Por eso cada wireframe indica de qué función sale cada número.
3. **El estado de envío siempre está a la vista** en el móvil: la pantalla *Sin señal* (P14) muestra el pago en cola y *Mi perfil* (P03) el estado de sincronización (heurística 1 de Nielsen, OP-1).
4. **Toda cifra muestra su fecha de corte.** El tramo depende de la fecha, y la fecha de corte es un parámetro (puerto `Reloj`), no "hoy".
5. **La ayuda está en el mismo lugar en todas las pantallas** (WCAG 3.2.6). En el prototipo solo aparece en el inicio de sesión; es un hallazgo del E5 (H-11).

### 3.1.1 Una sola fuente para el diseño: el prototipo de Figma

Para que la documentación y el prototipo **no se desfasen**, todas las pantallas se nombran igual que en el [prototipo de Figma](https://www.figma.com/proto/jozM3QI8ZJ6pywdCoO5OVo/Microcr%C3%A9ditos-App?node-id=0-1&t=PJlTVLC3ASu31ttw-1) y se identifican con un código:

- **P01–P14:** pantallas que **ya existen en Figma**. Sus wireframes reproducen la misma disposición, los mismos componentes y el mismo orden de los bloques.
- **G01–G07:** pantallas que el enunciado exige y que **todavía no existen en Figma**. Sus wireframes son la **guía para construirlas** con el mismo lenguaje visual (encabezado oscuro, tarjetas blancas, botón principal abajo).

Cuando una cifra del prototipo no coincide con el núcleo, el wireframe muestra la cifra correcta y lo marca con **"CORREGIR EN FIGMA"**. La lista completa de correcciones está en el E3 y el E5.

## 3.2 Mapa de navegación

```mermaid
flowchart TB
  P01[P01 Iniciar sesión] --> R{Rol}

  R -->|Asesora| P02[P02 Mis Clientes]
  P02 --> P03[P03 Mi perfil]
  P02 -->|tarjeta de cliente| P08[P08 Detalle del crédito]
  P02 -->|botón +| P04[P04 Nueva solicitud · paso 1]
  P04 --> P05[P05 Simulación de pago · paso 2]
  P05 -->|← Modificar| P04
  P05 --> P06[P06 Confirmar solicitud · paso 3]
  P06 --> P07[P07 Solicitud enviada]
  P07 -.guía.-> G02[G02 Confirmación de desembolso]
  P04 -.cliente nuevo · guía.-> G01[G01 Alta de cliente]
  P08 --> P09[P09 Plan de amortización]
  P08 --> P10[P10 Detalle de mora]
  P08 --> P11[P11 Registrar pago]
  P10 --> P11
  P11 --> P12[P12 Confirmar pago]
  P12 -->|con señal| P13[P13 Pago aplicado]
  P12 -->|sin señal| P14[P14 Sin señal · pago en cola]
  P14 -->|sincronizar| P13
  P13 --> P02

  R -.->|Comité · guía| G03[G03 Bandeja del comité]
  G03 -.aprobar.-> G02

  R -.->|Gerencia · guía| G04[G04 Tablero gerencial]
  G04 -.-> G05[G05 Créditos de un tramo]
  G05 -.-> P08
  G04 -.-> G06[G06 Cierre diario / mensual]
  G04 -.teléfono.-> G07[G07 Tablero en teléfono]
```

Las flechas continuas existen en el prototipo; las punteadas son las que faltan construir. Versión en imagen, con carriles por perfil: [wireframes/mapa-navegacion.svg](wireframes/mapa-navegacion.svg).

Los tres flujos navegables que exige el E3 recorren este mapa así:

| Flujo E3 | Recorrido | Estado en Figma |
|---|---|---|
| 1. Originación | P02 (+) → P04 Nueva solicitud → P05 Simulación → P06 Confirmar → P07 Enviada → **G02 Desembolso** | Existe hasta P07; falta G02 |
| 2. Cobro en campo | P02 buscar → P08 saldo y tramo → P10 desglose de la mora → P11 registrar pago → P12 confirmar → P13 comprobante (o P14 sin señal) | Completo |
| 3. Consulta gerencial | **G04 Tablero** → tramo de la cartera en riesgo → **G05 créditos de ese tramo** → P08 | Falta construir G04 y G05 |

## 3.3 Tabla de correspondencia pantalla ↔ caso de uso

### 3.3.1 Tabla obligatoria de la sección 6.1

| Puerto primario del enunciado (6.1) | Puerto definido en el P1 (`FASE-06`, sección 8) | Caso de uso P1 | Pantalla P2 | Código |
|---|---|---|---|---|
| RegistrarCliente | `RegistrarCliente` | CU-01 Registrar cliente | Alta de cliente | G01 (guía) |
| SolicitarCredito | `SolicitarCredito` | CU-02 Solicitar crédito | Nueva solicitud → Simulación de pago → Confirmar solicitud → Solicitud enviada | P04, P05, P06, P07 |
| EvaluarSolicitud | `EvaluarCredito` + `DecidirSolicitud` | CU-03 Evaluar, CU-04 Aprobar, CU-05 Rechazar | Bandeja del comité | G03 (guía) |
| DesembolsarCredito | `DesembolsarCredito` | CU-06 Desembolsar crédito | Confirmación de desembolso | G02 (guía) |
| RegistrarPago | `RegistrarPago` | CU-07 Registrar pago | Registrar pago → Confirmar pago → Pago aplicado / Sin señal | P11, P12, P13, P14 |
| ConsultarCarteraEnRiesgo | `ConsultarCarteraEnRiesgo` | CU-14 Consultar cartera en riesgo | Tablero gerencial, créditos de un tramo y tablero en teléfono | G04, G05, G07 (guías) |
| GenerarCierre | `GenerarCierre` | CU-12 Cierre diario, CU-13 Cierre mensual | Cierre diario / mensual | G06 (guía) |

> **Nota de coherencia.** En el P1 el puerto que el enunciado llama `EvaluarSolicitud` quedó dividido en dos puertos: `EvaluarCredito` (el analista registra la evaluación) y `DecidirSolicitud` (el comité aprueba o rechaza). La Bandeja del comité usa ambos. No se cambia el nombre de los puertos del P1, para respetar la regla de incrementalidad.

### 3.3.2 Pantallas de apoyo: también corresponden a un caso de uso

La penalización de la sección 10 aplica a pantallas **sin** caso de uso. Por eso se trazan también las pantallas que no aparecen en la tabla 6.1:

| Pantalla (Figma) | Código | Puerto P1 | Caso de uso | Función del núcleo que provee las cifras |
|---|---|---|---|---|
| Mis Clientes (con búsqueda) | P02 | `ConsultarCredito` (cartera de la asesora) | CU-15 | `consultarMora` (días y tramo por cuota) |
| Detalle del crédito | P08 | `ConsultarCredito` + `CalcularMora` | CU-15, CU-08 | `consultarMora`, `clasificarTramoMora` |
| Plan de amortización | P09 | `ConsultarCredito` | CU-15 | `plan-amortizacion.ts` |
| Detalle de mora | P10 | `CalcularMora` | CU-08 | `CalculadoraMora.calcular` → `detalle.tramos` |
| Iniciar sesión | P01 | — (autenticación, fuera de alcance del P2) | — | — |
| Mi perfil | P03 | — | — | — |

**Iniciar sesión (P01) y Mi perfil (P03)** no corresponden a un caso de uso del P1: son pantallas de soporte de sesión. P01 es necesaria para entrar a la aplicación; P03 muestra el estado de sincronización que exige la estrategia sin conexión del E4. El equipo debe decidir si se justifican así ante el catedrático o si P03 se retira del prototipo (la sección 10 resta 0.5 puntos por pantalla sin caso de uso).

Ningún caso de uso principal queda sin pantalla. `ReestructurarCredito` (CU-10), `DeclararIncobrable` (CU-11), `AnularCredito` (CU-17) y `AdministrarPolitica` (CU-16) son operaciones administrativas que el enunciado no exige prototipar. En el Proyecto Final se accederán desde el detalle del crédito en la vista de gerencia (G05 → P08). CU-18 Cancelar crédito no tiene pantalla propia porque ocurre como resultado de un pago que deja el saldo en Q0.00 (CP-04.1).

## 3.4 Wireframes de baja fidelidad

Cada pantalla se dibuja en **dos niveles** a partir de **una sola descripción** (script `wireframes/generar_wireframes_figma.py`), así ambos niveles y el prototipo no pueden quedar distintos:

| Nivel | Qué muestra | Carpeta |
|---|---|---|
| **Skeleton** | Solo bloques grises que indican dónde va cada elemento, sin textos ni cifras | [`wireframes/skeleton/`](wireframes/skeleton) |
| **Wireframe anotado** | Los mismos bloques con textos, cifras del núcleo y notas numeradas que justifican cada decisión | [`wireframes/anotado/`](wireframes/anotado) |
| **Alta fidelidad** | Color, tipografía, componentes y navegación | [Prototipo de Figma](https://www.figma.com/proto/jozM3QI8ZJ6pywdCoO5OVo/Microcr%C3%A9ditos-App?node-id=0-1&t=PJlTVLC3ASu31ttw-1) |

### 3.4.1 Pantallas del prototipo (P01–P14, móvil)

| Código | Pantalla en Figma | Decisión principal | Skeleton | Anotado |
|---|---|---|---|---|
| P01 | Iniciar sesión | Contraseña con opción de mostrarla; ayuda visible ("Llama al soporte técnico") | ![P01](wireframes/skeleton/P01-iniciar-sesion.svg) | ![P01](wireframes/anotado/P01-iniciar-sesion.svg) |
| P02 | Mis Clientes | Búsqueda por nombre o municipio; orden por prioridad; etiqueta de tramo y días; botón + | ![P02](wireframes/skeleton/P02-mis-clientes.svg) | ![P02](wireframes/anotado/P02-mis-clientes.svg) |
| P03 | Mi perfil | Estado operativo y de sincronización de la asesora | ![P03](wireframes/skeleton/P03-mi-perfil.svg) | ![P03](wireframes/anotado/P03-mi-perfil.svg) |
| P04 | Nueva solicitud (paso 1) | Cliente de una lista; monto con − / + y montos rápidos; plazo con botones; cuota estimada | ![P04](wireframes/skeleton/P04-nueva-solicitud.svg) | ![P04](wireframes/anotado/P04-nueva-solicitud.svg) |
| P05 | Simulación de pago (paso 2) | Las 12 cuotas del núcleo para Q5,000 a 12 meses | ![P05](wireframes/skeleton/P05-simulacion-pago.svg) | ![P05](wireframes/anotado/P05-simulacion-pago.svg) |
| P06 | Confirmar solicitud (paso 3) | Aviso "Revise antes de enviar" y resumen completo (WCAG 3.3.4) | ![P06](wireframes/skeleton/P06-confirmar-solicitud.svg) | ![P06](wireframes/anotado/P06-confirmar-solicitud.svg) |
| P07 | Solicitud enviada | Número de referencia y próximos pasos | ![P07](wireframes/skeleton/P07-solicitud-enviada.svg) | ![P07](wireframes/anotado/P07-solicitud-enviada.svg) |
| P08 | Detalle del crédito | Estado y tramo en lenguaje llano; lo exigible hoy; accesos a plan y mora | ![P08](wireframes/skeleton/P08-detalle-credito.svg) | ![P08](wireframes/anotado/P08-detalle-credito.svg) |
| P09 | Plan de amortización | Caso de referencia Q10,000; cuota 12 de Q1,004.63 resaltada **y explicada** | ![P09](wireframes/skeleton/P09-plan-amortizacion.svg) | ![P09](wireframes/anotado/P09-plan-amortizacion.svg) |
| P10 | Detalle de mora | Caso M-3: una tarjeta por tramo recorrido, tasas anuales y nota de redondeo (Q50.80) | ![P10](wireframes/skeleton/P10-detalle-mora.svg) | ![P10](wireframes/anotado/P10-detalle-mora.svg) |
| P11 | Registrar pago | Monto con separador de miles; prelación visible antes de confirmar | ![P11](wireframes/skeleton/P11-registrar-pago.svg) | ![P11](wireframes/anotado/P11-registrar-pago.svg) |
| P12 | Confirmar pago | "Confirme antes de aplicar"; fecha fijada al confirmar; salida "Modificar monto" | ![P12](wireframes/skeleton/P12-confirmar-pago.svg) | ![P12](wireframes/anotado/P12-confirmar-pago.svg) |
| P13 | Pago aplicado | Comprobante con la distribución y el saldo restante | ![P13](wireframes/skeleton/P13-pago-aplicado.svg) | ![P13](wireframes/anotado/P13-pago-aplicado.svg) |
| P14 | Sin señal | Pago en cola con folio fijo (clave de idempotencia) y sincronización | ![P14](wireframes/skeleton/P14-sin-senal.svg) | ![P14](wireframes/anotado/P14-sin-senal.svg) |

### 3.4.2 Guías para las pantallas que faltan en Figma (G01–G07)

| Código | Pantalla | Formato | Caso de uso | Skeleton | Anotado |
|---|---|---|---|---|---|
| G01 | Alta de cliente | Móvil | CU-01 | ![G01](wireframes/skeleton/G01-alta-cliente.svg) | ![G01](wireframes/anotado/G01-alta-cliente.svg) |
| G02 | Confirmación de desembolso | Móvil | CU-06 | ![G02](wireframes/skeleton/G02-confirmacion-desembolso.svg) | ![G02](wireframes/anotado/G02-confirmacion-desembolso.svg) |
| G03 | Bandeja del comité | Escritorio | CU-03/04/05 | ![G03](wireframes/skeleton/G03-bandeja-comite.svg) | ![G03](wireframes/anotado/G03-bandeja-comite.svg) |
| G04 | Tablero gerencial | Escritorio | CU-14 | ![G04](wireframes/skeleton/G04-tablero-gerencial.svg) | ![G04](wireframes/anotado/G04-tablero-gerencial.svg) |
| G05 | Créditos de un tramo | Escritorio | CU-14 | ![G05](wireframes/skeleton/G05-creditos-tramo.svg) | ![G05](wireframes/anotado/G05-creditos-tramo.svg) |
| G06 | Cierre diario / mensual | Escritorio | CU-12/13 | ![G06](wireframes/skeleton/G06-cierre.svg) | ![G06](wireframes/anotado/G06-cierre.svg) |
| G07 | Tablero en teléfono | Móvil | CU-14 | ![G07](wireframes/skeleton/G07-tablero-movil.svg) | ![G07](wireframes/anotado/G07-tablero-movil.svg) |

### 3.4.3 La pantalla difícil: Detalle de mora (P10)

El enunciado advierte que mostrar solo "Mora: Q50.80" no permite verificar nada, y que mostrar la fórmula completa no se entiende. El prototipo ya resuelve bien la **forma**: una tarjeta por tramo recorrido, con el rango de días y los días en ese tramo. Lo que falta es que las **cifras** sean las del núcleo:

| Qué muestra el wireframe | Qué oculta | Por qué |
|---|---|---|
| Resumen arriba: 100 días · capital en mora Q725.76 · mora total Q50.80 | El saldo total del crédito | La mora se calcula sobre el capital de la cuota vencida, no sobre el saldo total |
| Una tarjeta por tramo con el rango de días ("Días 31–60 · 30 días en este tramo") | Solo el nombre "Mora 2" | El cliente entiende días, no nombres de tramo (heurística 2 de Nielsen) |
| Tasa **anual** del tramo ("24 % al año") y mora por día (Q0.48) | La tasa diaria 0.000666667 | Una tasa diaria no significa nada para el cliente |
| Importe por tramo a 2 decimales con asterisco | Los importes con 4 decimales | Legibilidad |
| Tarjeta "Cómo se calculó" con los 4 decimales y la **nota de redondeo** | — | Sumar las filas redondeadas da **Q50.81**; el total oficial es **Q50.80** porque se redondea una sola vez (sección 7.3) |

Los importes por tramo salen de `detalle.tramos[].importeSinRedondear` y el total de `interesMoratorio`. La interfaz solo formatea: nunca suma ni redondea por su cuenta.

## 3.5 Jerarquía del tablero gerencial (G04)

### 3.5.1 Qué se ve primero y por qué

El tablero se lee en forma de Z, de izquierda a derecha y de arriba abajo. El orden sigue las preguntas que Andrea trae al comité (§2.2.3):

| Orden | Zona | Contenido (cifras del núcleo) | Pregunta que responde | Por qué en ese lugar |
|---|---|---|---|---|
| 0 | Línea de contexto | Fecha de corte, "cierre congelado ✓" y política por fecha de otorgamiento | ¿De cuándo son estos números? ¿Son definitivos? | Un indicador sin fecha no sirve para decidir; con la mora escalonada, el tramo depende de la fecha |
| 1 | Tarjeta principal, arriba a la izquierda | **Cartera en riesgo 7.00 %** (Q56,000 de Q800,000) | ¿Cuánto de la cartera está en deterioro real? | Es el indicador sobre el que decide el comité (provisiones, restricciones de colocación) |
| 2 | Junto al riesgo | **Dado por incobrable en el período** (C-007) | ¿El riesgo bajó porque cobramos o porque dimos de baja? | El enunciado exige mostrarlo junto al riesgo: declarar incobrable a C-005 bajaría el indicador de 7.00 % a 6.06 % sin cobrar nada |
| 3 | Tercera tarjeta | **Cartera en mora 21.75 %** (Q174,000) | ¿Cuántos clientes tienen algún atraso? | Es una alerta temprana útil, pero no es la base de la decisión de riesgo; por eso va después |
| 4 | Bloque central | Riesgo por tramo: 3.00 + 2.25 + 1.00 + 0.75 = **7.00 %** | ¿Dónde está concentrado el riesgo? | Explica la tarjeta 1 y es la entrada al detalle (flujo 3 de E3) |
| 5 | Parte inferior | Desembolsos y recuperaciones del período | ¿Cómo se movió la cartera en el período? | Contexto de actividad; se consulta después de entender el riesgo |
| — | Panel derecho plegable | Asistente conversacional (Proyecto Final) | "¿Por qué subió la mora de…?" | Ver §3.5.3 |

### 3.5.2 Cómo se distinguen la cartera en mora y la cartera en riesgo

Confundir estos dos indicadores es un hallazgo de severidad 4 y una penalización de −0.5 puntos (sección 10). El diseño los separa con **cinco señales independientes**, para que ninguna dependa solo del color (WCAG 1.4.1):

| Señal | Cartera en RIESGO | Cartera en MORA |
|---|---|---|
| Rótulo | "Cartera en **RIESGO**" | "Cartera en **MORA**" (la palabra distinta, en mayúsculas) |
| Definición visible bajo la cifra | "Más de 30 días + reestructurados" | "Cualquier atraso ≥ 1 día" |
| Símbolo | ▲ | ● |
| Borde de la tarjeta | Grueso y continuo (indicador principal) | Discontinuo |
| Posición | Primera, junto a incobrables | Tercera, separada por la tarjeta de incobrables |
| Color en alta fidelidad (E3) | Color de alerta del sistema de diseño | Neutro / informativo |

Además, el bloque de tramos explica expresamente por qué Mora 1 no forma parte del riesgo ("Q124,000 con atraso ≤ 30 días se ven en *Cartera en mora*"). Así, un lector que sume los tramos no busca el 21.75 % en ese bloque.

Origen de las cifras: `calcularCarteraPorTramo` devuelve `carteraActiva`, `tramosEnRiesgo[]`, `totalEnRiesgo`, `carteraEnMora` e `incobrablesDelPeriodo`. Los porcentajes llegan ya conciliados para que sumen exactamente el total (invariante 7 de la sección 7.9). El tablero no recalcula nada (CP-04.3). El enunciado no da el saldo de C-007; el tablero lo toma de `incobrablesDelPeriodo` del cierre, por eso la guía G04 no muestra un monto inventado.

> **Observación para el equipo.** En `tests/cartera-por-tramo.test.ts` los créditos se llaman C-001, C-002… con las cifras de la sección 7.8, pero los identificadores no coinciden con los del enunciado (C-003 con 45 días, C-004 con 75 días, etc.). Los montos y porcentajes sí coinciden. El prototipo usa los identificadores del enunciado; conviene alinear el fixture para que la defensa no se preste a confusión.

### 3.5.3 El lugar del asistente (sección 6.3)

El chat del Proyecto Final ocupa una **columna derecha plegable** (G04) y, en el teléfono, un acceso desde el tablero móvil (G07). Justificación:

- **No tapa las cifras**: las tarjetas y el desglose quedan a la izquierda, en el recorrido natural de lectura.
- **Convive con el tablero**: la gerencia puede preguntar "¿por qué C-004 está en Mora 3?" mientras ve el tramo. El asistente responde con la misma fuente que el tablero (el núcleo) y cita de dónde sale cada cifra.
- **Plegable**: si no se usa, el tablero recupera ancho sin reorganizarse.

## 3.6 Qué se validará en E3 y E5

- Prueba de lectura del tablero (cinco segundos): ¿qué porcentaje reporta el participante como "riesgo"?
- Prueba de comprensión de P10 con tres personas sin formación financiera: ¿pueden explicar por qué la mora de los días 91–100 es de Q7.26 si son solo 10 días?
- Tiempo para registrar un pago con una mano, de pie (P11 → P12): objetivo de menos de 30 segundos y 4 toques desde P08.

*Uso de IA declarado (sección 15):* los SVG de baja fidelidad se generaron con apoyo de un asistente de IA a partir de las decisiones del equipo, mediante el script editable `wireframes/generar_wireframes_figma.py`, tomando como referencia las pantallas del prototipo de Figma. Las decisiones de jerarquía y su justificación son del equipo y deben revisarse antes de la entrega.

---

# 4. E3 · Prototipo navegable en Figma

## 4.1 Enlace y acceso

**Prototipo:** https://www.figma.com/proto/jozM3QI8ZJ6pywdCoO5OVo/Microcr%C3%A9ditos-App?node-id=0-1&t=PJlTVLC3ASu31ttw-1

El enlace abre sin iniciar sesión en Figma, como pide la sección 13. El archivo se llama *Microcréditos App* y la pantalla inicial es *Asesor de Crédito – Móvil*. Es un prototipo navegable, no una serie de imágenes: cada flujo se recorre haciendo clic.

## 4.2 Cómo recorrerlo

| Paso | Qué hacer | Qué se ve |
|---|---|---|
| 1 | *Ingresar* en **P01 Iniciar sesión** | **P02 Mis Clientes**: cartera de la asesora ordenada por prioridad, con la etiqueta de tramo (Incobrable, Mora 3, Mora 2, Mora 1, Al día) y los días de atraso |
| 2 | **Flujo de cobro:** tocar la tarjeta de *Pedro Xol Cux* | **P08 Detalle del crédito**: estado, saldo, próxima cuota, monto original, plazo y tasa |
| 3 | Botón *Plan de pago* | **P09 Plan de amortización** del caso de referencia: Q10,000, 12 meses, 3 % mensual, con la cuota 12 de Q1,004.63 resaltada |
| 4 | Botón *Detalle mora* | **P10 Detalle de mora** por tramo recorrido |
| 5 | *Registrar pago* → tocar el monto → *Revisar y confirmar* | **P11 Registrar pago** → **P12 Confirmar pago**, con la prelación visible antes de aplicar (gastos → mora → interés → capital) |
| 6 | *Aplicar pago* | **P13 Pago aplicado**: comprobante con número y distribución del pago, más opciones para enviarlo por WhatsApp o imprimirlo |
| 7 | **Variante sin señal:** en *Confirmar pago*, tocar *Simular pago sin señal (demo)* y luego *Aplicar pago* | **P14 Sin señal**: pago en cola, estado "Pendiente", folio y botón *Sincronizar ahora* |
| 8 | **Flujo de originación:** en *Mis Clientes*, botón **+** | **P04 Nueva solicitud** (cliente, monto con límites y plazo) → **P05 Simulación de pago** → **P06 Confirmar solicitud** → **P07 Solicitud enviada** |
| 9 | Tocar las iniciales *MA* | **P03 Mi perfil** de la asesora: zona, ruta, cartera asignada y estado de sincronización |

## 4.3 Lo que el prototipo resuelve bien

Recorrimos el prototipo completo el 23 de septiembre de 2026. Estas decisiones cumplen lo que pide el enunciado y lo que encontramos en la investigación (E1):

- **La captura del monto es difícil de equivocar:** botones − y +, montos rápidos (Q2k, Q5k, Q10k…) y el rango "Q1,000 – Q25,000 en pasos de Q500" siempre visible. Esto responde al momento crítico MC-1.
- **El plazo se elige con botones** (3 a 24 meses), sin teclado.
- **Siempre hay una revisión antes de confirmar.** La solicitud tiene tres pasos, y el pago pasa por "Confirme antes de aplicar", con la salida "← Modificar monto". Esto cumple WCAG 3.3.4 (prevención de errores en transacciones financieras).
- **La prelación se ve antes de aplicar el pago**, con una barra por concepto.
- **El plan de amortización usa el caso de referencia real:** Q10,000 al 3 % mensual, las 12 cuotas, interés total Q2,055.45, total Q12,055.45 y la cuota 12 de Q1,004.63 resaltada.
- **La simulación de Q5,000 a 12 meses coincide con el núcleo:** cuota de Q502.31, exactamente la mitad del caso de referencia.
- **Hay un flujo sin señal** con el pago en cola, su estado y un botón manual de sincronización. Esto responde a MC-2 y a la estrategia del E4.
- Los objetivos táctiles son grandes y los botones principales tienen alto contraste, algo importante para trabajar bajo el sol.

## 4.4 Correspondencia con las pantallas y los flujos obligatorios

| Requisito del E3 | Perfil / formato | Estado en el prototipo | Acción pendiente |
|---|---|---|---|
| Solicitud de crédito con simulación del plan | Asesor · móvil | ✅ P04 → P05 → P06 → P07 | — |
| Detalle del crédito | Cliente/Asesor · móvil | ✅ P08 | Agregar el tramo en lenguaje llano ("lleva 45 días de atraso") |
| Registro de pago con desglose de la prelación | Asesor · móvil | ✅ P11 → P12 → P13 / P14 | Corregir las cifras (§4.5) |
| Plan de amortización con la cuota 12 explicada | Cliente/Asesor · móvil | ⚠️ P09: la cuota 12 está resaltada, pero sin explicación | Agregar la nota "1 centavo más para cerrar el saldo exacto en Q0.00" |
| Detalle de la mora con el caso M-3 | Cliente/Asesor · móvil | ❌ P10: muestra tasas y montos que no son los del núcleo | Rehacer con el caso M-3 (§4.5) |
| Tablero gerencial | Gerencia · escritorio | ❌ No existe todavía | Construir a partir de la guía G04 (y G07 para teléfono) |
| Cierre diario / mensual | Gerencia · escritorio | ❌ No existe todavía | Construir a partir de la guía G06 |
| Confirmación de desembolso (tabla 6.1) | Encargado · móvil | ❌ | Agregar después de "Solicitud enviada", a partir de la guía G02 |
| Bandeja del comité y Alta de cliente (tabla 6.1) | Comité / Asesor | ❌ | Recomendable, a partir de las guías G03 y G01 |
| Flujo 1: solicitud → simulación → confirmación → desembolso | — | ⚠️ Termina en "Solicitud enviada" | Agregar el desembolso |
| Flujo 2: buscar → saldo y tramo → mora → pago → comprobante | — | ✅ | — |
| Flujo 3: tablero → riesgo por tramo → créditos del tramo | — | ❌ | Depende del tablero |
| *P03 Mi perfil* | — | Existe, pero no corresponde a ningún caso de uso | Justificarla como soporte de sesión o retirarla (la sección 10 resta 0.5 puntos por pantalla sin caso de uso) |

## 4.5 Cifras que deben coincidir con el núcleo (sección 6.2)

El enunciado resta 0.5 puntos por cifras inventadas y otros 0.5 por aplicar mal la política de mora. Estas son las diferencias encontradas y cómo corregirlas.

**Pantalla "Detalle de mora"**

| Lo que muestra hoy | Lo que dice la política y calcula el núcleo | Corrección |
|---|---|---|
| "Tasa adicional mensual" de 0.5 %, 1.0 %, 1.5 % y 2.0 % | Tasas **anuales** de 18 %, 24 %, 30 % y 36 % (1.5 %, 2 %, 2.5 % y 3 % mensual), base Actual/360 | Mostrar "18 % al año", "24 % al año", etc. |
| Recargo calculado sobre el **saldo total** (Q6,240.50) | Se calcula sobre el **capital en mora de cada cuota vencida**, por separado | Usar el caso M-3: capital Q725.76 |
| Total de recargos Q228.81 | M-3 = **Q50.80** (10.8864 + 14.5152 + 18.1440 + 7.2576 = 50.8032, redondeado una sola vez) | Mostrar Q10.89 · Q14.52 · Q18.14 · Q7.26 con la nota de redondeo: Q50.80, no Q50.81 |
| "Total a pagar hoy Q6,469.31" (saldo + recargos) | Lo exigible de la cuota: gastos + mora + interés corriente + capital | A 45 días: Q25.00 + Q18.14 + Q278.86 + Q725.76 = **Q1,047.76** (caso M-5) |
| Se abre desde un crédito incobrable (132 días), pero muestra 100 días y el saldo de otro cliente | Después de 120 días el crédito es incobrable y deja de generar mora (invariante 8) | Abrirla desde un crédito con 100 días de atraso, o mostrar la mora congelada en Q65.32 |

**Otras pantallas**

| Pantalla | Diferencia | Corrección |
|---|---|---|
| Registrar pago | "Gastos de gestión Q150.00" | La política es **Q25.00 por cuota vencida**, generado una sola vez al día 31 (CP-02) |
| Solicitud enviada | El cliente cambia de *Carlos Martínez Ixcot* (el seleccionado) a *Juan Pablo Pérez Xol* | Mantener el cliente elegido en el paso 1 |
| Sin señal | El folio cambia de *PAG-251250* a *PAG-309097* al tocar "Sincronizar ahora" | El folio representa la **clave de idempotencia** y debe ser el mismo en todos los reintentos (E4, §5.4.2) |

---

# 5. E4 · Decisión de arquitectura móvil/web y diseño responsivo

Este capítulo decide cómo se construye la aplicación: nativa, híbrida o PWA. La decisión se argumenta contra el contexto real de cada perfil. Explica también cómo se transforma el tablero entre el teléfono y el escritorio, y qué pasa cuando la asesora registra un pago sin señal. Esa última decisión solo funciona gracias a dos piezas del Proyecto 1: la clave de idempotencia y el puerto `Reloj`.

**Alcance.** En el P2 no se implementan frontend, service worker, API ni almacenamiento del dispositivo (sección 5 del enunciado). Esta es una decisión de arquitectura que el Proyecto Final implementará con React + Vite + Tailwind (sección 14). Las restricciones de contexto provienen de [E1](e1-investigacion-usuario.md).

## 5.1 Restricciones que decide la arquitectura

| Restricción | Perfil | Fuente | Qué exige |
|---|---|---|---|
| Señal intermitente o nula durante parte de la ruta | Asesora | Enunciado, sección 3; IICA/BID (conectividad rural) | Trabajar sin conexión: consultar la cartera de la ruta, capturar solicitudes y registrar pagos |
| Teléfono Android de gama media, poca memoria | Asesora | Enunciado, sección 3 | App ligera, sin descargas grandes para actualizar |
| Uso con una mano, de pie y bajo el sol | Asesora | Enunciado, sección 3 | Objetivos táctiles grandes, alto contraste, poco tecleo (depende del diseño, no de la tecnología) |
| Escritorio con pantalla grande y conexión estable | Gerencia | Enunciado, sección 3 | Alta densidad de información; acceso por navegador sin instalar nada |
| Consulta ocasional desde el teléfono | Gerencia | E1 (hipótesis) | El mismo tablero, adaptado |
| El cliente puede no tener datos móviles | Cliente | DataReportal 2024 (60.3 % usa internet) | Los avisos al cliente van por SMS, no por la app (MC-4) |
| El Proyecto Final debe implementarse en 4 semanas con React y Tailwind | Equipo | Enunciado, secciones 2.1 y 14 | Un solo código web |

## 5.2 Decisión: una PWA única, mobile-first

### 5.2.1 Alternativas evaluadas

| Criterio | Nativa (Kotlin / Swift) | Híbrida (React + Capacitor) | **PWA (React + service worker)** |
|---|---|---|---|
| Trabajo sin conexión | Completo | Completo (web + plugins nativos) | Suficiente: service worker para la app y los datos en caché; IndexedDB para la cola de pagos y los borradores |
| Cola de envío en segundo plano | Completa | Completa | Background Sync en Chrome para Android; en otros navegadores, reenvío al volver la señal o al abrir la app, más un botón manual |
| Teléfono de gama media | Mejor rendimiento, pero instalador pesado | Contenedor nativo + web | Se instala desde el navegador, ocupa poco, sin tienda de aplicaciones |
| Escritorio para gerencia | No aplica: exige otro producto | Requiere además la versión web | **El mismo código** en el navegador de escritorio |
| Actualizaciones (por ejemplo, un cambio de política) | Publicar en la tienda y esperar a que los asesores actualicen | Publicar en la tienda para cambios nativos | Inmediatas al volver a cargar la app |
| Cámara para la foto del DPI (G01) | Sí | Sí | Sí: `<input type="file" accept="image/*" capture>` o `getUserMedia` |
| Coherencia con el Proyecto Final (React + Vite + Tailwind en 4 semanas) | Rompe el stack: dos lenguajes más | Compatible, pero agrega compilación, firma y pruebas por plataforma | **Idéntico stack** |
| Costo de mantenimiento | 2 o 3 bases de código | 1 base de código + contenedores | **1 base de código** |

### 5.2.2 Decisión y justificación

**Se adopta una PWA única, instalable, mobile-first, para los tres perfiles.** El rol que inicia sesión determina la pantalla de inicio: Ruta del día, Bandeja del comité o Tablero.

- **Para la asesora:** su necesidad crítica es trabajar sin señal, y eso lo resuelven el service worker (app y datos en caché) y una cola persistente en IndexedDB. La operación clave no es "tener señal", sino **no perder ni duplicar un pago cuando no la hay**, y eso depende del diseño de la cola y de la API (§5.4), no de que la app sea nativa. En un Android de gama media, una PWA se instala desde Chrome sin pasar por la tienda y se actualiza sola.
- **Para la gerencia:** trabaja en escritorio con buena conexión. Una PWA es simplemente la web; no se construye un segundo producto.
- **Para el proyecto:** el Proyecto Final exige React + Vite + Tailwind. Una PWA es ese mismo stack, sin compilar ni firmar por plataforma.

### 5.2.3 Riesgos aceptados y cómo se mitigan

| Riesgo de la PWA | Mitigación |
|---|---|
| El navegador puede borrar el almacenamiento de un sitio | Solicitar `navigator.storage.persist()` al instalar. La cola se vacía en cuanto hay señal. Aviso visible si quedan pendientes al final del día (P03 Mi perfil y P14). Nunca se borra un comando sin confirmación del servidor |
| Background Sync no existe en todos los navegadores | No se promete sincronización automática universal. Reenvío al recibir el evento `online`, al abrir la app y con el botón "Enviar ahora" en Pendientes. La flota de asesoras usa Android con Chrome (supuesto a confirmar con TI) |
| iOS limita las PWA | La gerencia en iPhone solo consulta: no necesita cola ni sincronización |

**Condición de revisión.** Si la validación de campo muestra que Android borra la cola con frecuencia o que la cámara no alcanza para leer el DPI, se migra la app de la asesora a **Capacitor**. Esto conserva el mismo código React y agrega almacenamiento nativo: la decisión es reversible sin reescribir.

## 5.3 Estrategia responsiva mobile-first

Se diseña primero para 360 px (el teléfono de la asesora) y se **agrega** información a medida que crece la pantalla. Puntos de quiebre de Tailwind:

| Ancho | Clase | Uso principal |
|---|---|---|
| < 640 px | base | Asesora en campo; gerencia consultando en reunión |
| ≥ 768 px | `md` | Tableta en oficina de agencia |
| ≥ 1024 px | `lg` | Escritorio de gerencia |
| ≥ 1280 px | `xl` | Escritorio con el panel del asistente abierto |

### 5.3.1 Cómo se transforma el tablero gerencial

| Elemento | Teléfono (G07) | Escritorio (G04) |
|---|---|---|
| Línea de contexto (fecha de corte, cierre congelado) | En el encabezado: "Tablero · corte 30/09" | Línea completa con estado del cierre y política |
| Riesgo → incobrables → mora | Tres tarjetas **apiladas en ese mismo orden**, con los mismos rótulos, símbolos (▲ ✕ ●) y bordes | Tres tarjetas en fila |
| Desglose por tramo | Lista de 4 filas con porcentaje; al tocar una fila se abre el detalle | Tabla con créditos, saldo en Q, barra proporcional y % |
| Detalle de un tramo (G05) | Tarjetas por crédito | Tabla de 8 columnas |
| Desembolsos y recuperaciones | Dos cifras del período, sin gráfico | Series mensuales |
| Asistente (Proyecto Final) | Botón flotante que abre el chat a pantalla completa | Columna derecha plegable |
| Cierre (G06) | Solo consulta | Consulta y ejecución, con confirmación |

**Qué se sacrifica en la pantalla pequeña, y por qué es aceptable:**

1. **Las series temporales y las barras.** Una gráfica de 12 meses en 360 px no se lee. En el teléfono se contesta "¿cómo estamos hoy?"; las tendencias se ven en escritorio.
2. **Los montos en quetzales dentro del desglose por tramo.** Se muestra solo el porcentaje para que cada fila quepa en una línea; el monto aparece al tocar la fila.
3. **La exportación a CSV.** Es una tarea de escritorio.
4. **Ejecutar el cierre.** Es una operación financiera irreversible (WCAG 3.3.4). Se reserva al escritorio para evitar toques accidentales.

**Lo que no se sacrifica nunca:** la distinción entre cartera en mora y cartera en riesgo, la cifra de incobrables junto al riesgo y la fecha de corte. Quitarlas en el teléfono reintroduciría el error MC-3.

### 5.3.2 Reglas del sistema responsivo

- Los objetivos táctiles miden al menos 48 × 48 px en todos los anchos; WCAG 2.5.8 exige 24 px como mínimo.
- Ninguna acción requiere arrastrar (WCAG 2.5.7). Las listas se desplazan, y el orden se cambia con botones.
- El texto base es de 16 px y se puede ampliar al 200 % sin perder contenido (WCAG 1.4.4). Las tablas pasan a tarjetas antes de necesitar desplazamiento horizontal.
- Contraste mínimo de 4.5:1 (WCAG 1.4.3). La paleta de alta fidelidad (E3) se probará también a plena luz del día.

## 5.4 Estrategia ante pérdida de conexión

### 5.4.1 Qué funciona sin señal

| Operación | Sin señal | Cómo |
|---|---|---|
| Ver la ruta y el detalle de los créditos de la ruta | Sí, con la fecha de los datos visible | Copia descargada al iniciar la jornada |
| Ver el detalle de la mora | Sí, rotulado "calculado con datos del 22/09" | Última respuesta de `consultarMora` en caché. **No se recalcula en el teléfono** |
| Capturar alta de cliente y solicitud | Sí | Borrador en IndexedDB, guardado campo por campo |
| Registrar un pago | Sí, **queda pendiente** | Cola de comandos (§5.4.2) |
| Desembolsar | **No** | Mueve dinero de la institución; requiere confirmación en línea |
| Tablero y cierres | No (gerencia trabaja en línea) | — |

### 5.4.2 Registrar un pago sin señal: la clave de idempotencia

Cuando Mariela toca "Aplicar pago" en P12 (Confirmar pago) sin señal, ocurre lo siguiente, en este orden:

1. **Se crea el comando** `RegistrarPago` con `creditoId`, `importe` como cadena (`"1047.76"`), `moneda`, `fechaPago` y `usuarioProceso`.
2. **Se genera la `Idempotency-Key` una sola vez** (un UUID) y se guarda junto al comando en IndexedDB **antes** de mostrar "Pendiente". Sin ese registro, un cierre de la app podría perder el pago.
3. La pantalla muestra **Pendiente** en la pantalla Sin señal (P14). Nunca muestra "Pagado" sin una respuesta del sistema.
4. Al volver la señal, la cola envía `POST /creditos/{creditoId}/pagos` con **la misma clave y el mismo contenido**, en orden por crédito.
5. El contrato OpenAPI del P1 responde:
   - **201**: pago nuevo registrado → estado **Confirmado**.
   - **200** con `Idempotency-Replayed: true`: el pago ya había llegado (por ejemplo, el primer envío sí llegó y se perdió la respuesta) → **Confirmado**, sin un segundo efecto.
   - **409**: la clave ya existe con un contenido distinto → estado **Conflicto**, visible para la asesora y para su supervisor. **Nunca se genera una clave nueva automáticamente**, porque eso sí podría duplicar el pago.
6. Un timeout **no borra el comando**: se reintenta con la misma clave.

```mermaid
sequenceDiagram
  participant A as Asesora (PWA)
  participant Q as Cola local (IndexedDB)
  participant API as API · RegistrarPago
  A->>Q: Confirmar pago (fechaPago fijada, clave K1)
  Q-->>A: Pendiente de enviar
  Note over Q: sin señal
  Q->>API: POST /pagos · Idempotency-Key: K1
  API--xQ: (respuesta perdida)
  Q->>API: reintento · misma K1, mismo contenido
  API-->>Q: 200 Idempotency-Replayed: true
  Q-->>A: Confirmado (un solo pago)
```

Así se previene MC-2 (doble cobro de Q1,047.76). El núcleo ya lo sostiene: `pago-idempotente.ts` y sus pruebas del P1 verifican que una repetición no cambia saldos ni movimientos.

**Ajuste necesario al contrato del P1.** El OpenAPI sugiere un tiempo de vida (TTL) de **24 horas** para la clave. Una asesora que pasa más de un día sin señal enviaría su pago cuando la clave ya expiró, y el reintento se procesaría como un pago nuevo. **El TTL debe ser mayor que la ventana máxima de trabajo sin conexión** (se propone 30 días), o la clave debe conservarse junto con el pago de forma permanente. Este cambio se registra para el Proyecto Final; no cambia el núcleo.

### 5.4.3 ¿Con qué fecha se calcula? El puerto Reloj

Caso: la cuota 2 de Carlos tiene **30 días** de atraso. Mariela recibe el pago hoy sin señal y el teléfono lo sincroniza **mañana**, cuando la cuota ya tendría 31 días.

| Si se calcula con… | Días | Mora | Gasto de cobro | Total de la cuota |
|---|---|---|---|---|
| **`fechaPago` = día en que Carlos pagó** (correcto) | 30 | Q10.89 | Q0.00 | **Q1,015.51** |
| Fecha de sincronización (incorrecto) | 31 | Q11.37 | Q25.00 | Q1,040.99 |

Si se usara la fecha de sincronización, Carlos pagaría **Q25.48 de más** por una demora que no es suya. La respuesta está en el P1: la fecha de corte es un parámetro y no "hoy".

- En el teléfono, el **adaptador del puerto `Reloj`** fija la `fechaPago` **en el momento de confirmar** y la guarda en el comando. Los reintentos envían esa misma fecha.
- En el núcleo, `RegistrarPago` recibe `fechaPago` y `consultarMora` recibe `fechaCorte` como parámetros. **El núcleo nunca lee la fecha del sistema**: la validación final lo comprobó con `rg 'new Date\(\)' src`, que no encuentra coincidencias ([e6-04](e6-04-validacion-final.md)).
- La política aplicable (plana o escalonada) no depende de ninguna de esas fechas, sino de la **fecha de otorgamiento** (`resolverPolitica`).

**Salvaguarda contra un reloj del teléfono mal configurado.** Al recibir el comando, el servidor compara `fechaPago` con la fecha de recepción y con la última sincronización del dispositivo. Una `fechaPago` futura o anterior a la última sincronización exitosa se acepta, pero queda **marcada para revisión** del supervisor en lugar de aplicarse en silencio. Esta regla corresponde a la capa de aplicación del Proyecto Final, no al núcleo.

### 5.4.4 Lo que se ve en pantalla

| Estado del comando | Texto en P12 / P14 | Estado en Mi perfil (P03) |
|---|---|---|
| Guardado sin señal | "Pendiente de enviar · se enviará solo al tener señal" | "Sin señal · 2 pendientes" |
| Enviando | "Enviando…" | "Enviando…" |
| Confirmado (201 o 200 replay) | "Confirmado · comprobante definitivo" y opción de enviar SMS al cliente | "En línea" |
| Conflicto (409) | "Este pago no coincide con uno ya registrado. No se cobró de nuevo. Revíselo con su supervisor." | "1 pago requiere revisión" |

## 5.5 Dos decisiones del Proyecto 1 que hacen viable el trabajo sin conexión

| Decisión de experiencia | Decisión de arquitectura del P1 que la sostiene | Qué pasaría sin ella |
|---|---|---|
| Registrar pagos sin señal y reintentar al reconectar | **Clave de idempotencia** en `RegistrarPago` (`Idempotency-Key`, respuestas 201 / 200 replay / 409) | Cada reintento podría ser un pago duplicado |
| Mostrar y cobrar la mora correcta aunque se sincronice otro día | **Puerto `Reloj`**: fecha de corte y `fechaPago` como parámetros, nunca "hoy" | El tramo y el gasto de Q25.00 dependerían del momento en que el teléfono recuperó la señal |

## 5.6 Referencias

- MDN Web Docs. *Offline and background operation* (PWA). https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation
- MDN Web Docs. *What is a progressive web app?* https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/What_is_a_progressive_web_app
- MDN Web Docs. *StorageManager.persist()*. https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist
- Capacitor. *Documentación oficial*. https://capacitorjs.com/docs
- W3C (2023). *Web Content Accessibility Guidelines (WCAG) 2.2*. https://www.w3.org/TR/WCAG22/
- Repositorio: `docs/api/openapi.yaml` (operación `registrarPago`), `src/dominio/pago-idempotente.ts`, `src/aplicacion/consultar-mora.ts`.

---

# 6. E5 · Evaluación heurística y de accesibilidad

## 6.1 Método

El enunciado pide que **los cuatro integrantes evalúen por separado** y después consoliden, porque varios evaluadores independientes encuentran más problemas que uno solo. Esta sección presenta la **evaluación preliminar de un evaluador**, hecha al recorrer el prototipo el 23 de septiembre de 2026 con apoyo de una herramienta de IA (declarada en el capítulo 9). Es el punto de partida del consolidado. **No sustituye** la evaluación de cada integrante, que debe registrar quién encontró cada hallazgo y adjuntar la captura como evidencia.

Escala de severidad (Anexo C del enunciado): 0 no es problema · 1 cosmético · 2 menor · 3 mayor · 4 catastrófico.

## 6.2 Hallazgos heurísticos (Nielsen)

| # | Pantalla | Hallazgo | Heurística | Sev. | Corrección propuesta |
|---|---|---|---|---|---|
| H-01 | Detalle de mora | Usa tasas mensuales de 0.5 %–2 % sobre el saldo total; no son las de la política ni las del núcleo | 2 · Correspondencia con el mundo real | **4** | Mostrar el caso M-3 con tasas anuales sobre el capital en mora (§4.5) |
| H-02 | Detalle de mora | "Total a pagar hoy" suma el saldo completo más los recargos; el cliente cree que debe Q6,469.31 hoy | 5 · Prevención de errores | **4** | Mostrar lo exigible de la cuota vencida (M-5: Q1,047.76) |
| H-03 | Detalle de mora | Un crédito incobrable (132 días) sigue mostrando recargos, con datos de otro cliente | 4 · Consistencia y estándares | 3 | Congelar la mora al día 120 y enlazar los datos correctos |
| H-04 | Sin señal | El folio cambia al sincronizar; la asesora no puede saber si es el mismo pago | 1 · Visibilidad del estado del sistema | 3 | Mantener el mismo folio (clave de idempotencia) en cada reintento |
| H-05 | Sin señal | "Si lo registra otra vez se duplicará" deja en manos de la asesora evitar el doble cobro | 5 · Prevención de errores | 3 | Que el sistema lo impida y lo diga: "Este pago ya está guardado; aunque lo intente de nuevo no se cobrará dos veces" |
| H-06 | Registrar pago | El monto aparece como "Q 10000" sin separador de miles mientras se escribe | 5 · Prevención de errores | 3 | Formato en vivo "Q 10,000.00" desde la primera tecla |
| H-07 | Registrar pago | Gastos de gestión de Q150.00; la política es Q25.00 por cuota vencida | 2 · Correspondencia | 3 | Usar el oráculo M-5 |
| H-08 | Solicitud enviada | El cliente cambia de Carlos Martínez a Juan Pablo Pérez | 4 · Consistencia | 3 | Mantener el cliente seleccionado |
| H-09 | Plan de amortización | La cuota 12 (Q1,004.63) está resaltada pero sin explicación | 10 · Ayuda y documentación | 2 | Nota: "1 centavo más para que el saldo cierre exacto en Q0.00" |
| H-10 | Mis Clientes | "Mora 1/2/3" no significa nada para el cliente | 2 · Correspondencia | 2 | Acompañarlo con "más de 30 días de atraso" |
| H-11 | Todas | La ayuda solo aparece en el inicio de sesión ("Llama al soporte técnico") | 10 · Ayuda / WCAG 3.2.6 | 2 | Ícono "?" en el mismo lugar de cada encabezado |
| H-12 | Registrar pago | Los atajos "1 cuota / 2 cuotas / 3 cuotas" no llenan el monto | 7 · Flexibilidad y eficiencia | 2 | Conectar cada atajo con su monto |
| H-13 | Pago aplicado | El comprobante no muestra el saldo restante | 1 · Visibilidad del estado | 2 | Agregar "Saldo de capital restante" |
| H-14 | Detalle de mora y pago | Textos secundarios muy pequeños y en gris claro, difíciles de leer bajo el sol | 8 · Diseño estético y minimalista / WCAG 1.4.3 | 2 | Tamaño mínimo de 14 px y contraste ≥ 4.5:1 |

## 6.3 Auditoría WCAG 2.2 (criterios A/AA nuevos + 3.3.4)

| Criterio | Nivel | Resultado preliminar | Observación |
|---|---|---|---|
| 2.4.11 Focus Not Obscured (Minimum) | AA | No verificable en Figma | Revisarlo en la implementación React: el encabezado fijo no debe tapar el foco |
| 2.5.7 Dragging Movements | AA | ✅ Cumple | Ninguna acción requiere arrastrar |
| 2.5.8 Target Size (Minimum) | AA | ✅ Cumple | Botones y tarjetas muy por encima de 24 × 24 px |
| 3.2.6 Consistent Help | A | ❌ No cumple | Ver H-11 |
| 3.3.7 Redundant Entry | A | ⚠️ Revisar | El cliente se elige de una lista (bien); falta la pantalla de alta de cliente para comprobar que no se pide dos veces el DPI |
| 3.3.8 Accessible Authentication (Minimum) | AA | ✅ Probable | Contraseña con opción de mostrarla; confirmar que se permita pegarla |
| 3.3.4 Error Prevention (Legal, Financial) | AA | ⚠️ Parcial | El pago y la solicitud tienen revisión y salida; falta la confirmación de desembolso |
| 1.4.3 Contrast (Minimum), heredado | AA | ⚠️ Revisar | Ver H-14 |

## 6.4 Correcciones y design review (pendiente del equipo)

Para cerrar el E5 falta:

- Corregir en Figma **al menos cinco hallazgos** y adjuntar la captura del antes y del después. Recomendamos empezar por H-01, H-02, H-04, H-06 y H-09, porque son los que más afectan al dinero y a la calificación.
- Documentar la retroalimentación del design review de la Sesión 9: qué se aceptó, qué se rechazó y con qué argumento.

---

# 7. E6 · Evolución del núcleo e informe de impacto SOLID

## 7.1 Qué se implementó

Implementamos en el mismo repositorio del Proyecto 1 los cuatro cambios de la sección 7 del enunciado:

| Cambio | Qué pide el enunciado | Qué hicimos | Dónde está |
|---|---|---|---|
| **CP-01** · Política escalonada | Cada día de atraso se cobra a la tasa del tramo al que pertenece (18/24/30/36 %), base Actual/360, **un solo redondeo al final** y tope en el capital en mora | Puerto `PoliticaMora` con implementación escalonada; tasas en configuración versionada, fuera del motor | `src/dominio/politica-mora/` |
| **CP-02** · Gasto de gestión de cobro | Q25.00 por cuota vencida al llegar al día 31, una sola vez, aunque el cierre se repita | `generarGastoGestion`, idempotente por crédito, cuota y concepto | `gasto-gestion-cobro.ts` |
| **CP-03** · Coexistencia de políticas (sección 7.6 del enunciado) | Los créditos otorgados antes del 1/10/2026 conservan la política plana del 24 % | `resolverPolitica` elige según la fecha de otorgamiento: CV-2026-0100 paga Q21.77 y CV-2026-0410 paga Q18.14 a 45 días | `catalogo-politicas.ts` |
| **CP-04.1** · `en_mora → cancelado` | Un pago que deja el saldo exacto en cero cancela el crédito en mora | Transición nueva en el State `EstadoEnMora` | `credito-estado.ts` |
| **CP-04.2** · Suspensión del devengo | Después del día 90 el interés corriente va a "interés en suspenso" y no al ingreso | `DevengoInteres`: entre el día 90 y el 100 el ingreso no sube y el suspenso sí | `devengo-interes.ts` |
| **CP-04.3** · Cartera en riesgo por tramo | El núcleo expone el desglose para que el tablero no recalcule | `calcularCarteraPorTramo`: 3.00 + 2.25 + 1.00 + 0.75 = 7.00 % | `cartera-por-tramo.ts` |

Los casos de referencia del enunciado salen exactos de las pruebas: M-1 Q5.44, M-2 Q18.14, M-3 Q50.80, M-4 Q65.32, M-5 Q1,047.76, coexistencia Q21.77 frente a Q18.14, y la prueba original del P1 de Q7.26 sigue pasando. El detalle de fórmulas y la selección de políticas están en `docs/proyecto2/e6-02-evolucion-nucleo.md`; las entradas, salidas y criterios de cada prueba, en `e6-03-pruebas-mora-escalonada.md`.

## 7.2 Informe de impacto SOLID (Anexo D)

Este es el informe que exige la sección 8. También está en el repositorio como `docs/informe-impacto-solid.md`, tal como pide el E7.

Este informe sigue la plantilla del **Anexo D** del enunciado. Mide cuánto hubo que modificar el núcleo del Proyecto 1 para absorber los cambios CP-01 a CP-04 de la sección 7 y responde, con evidencia del repositorio, a las preguntas de la sección 8.2. Todas las cifras de esta sección se pueden reproducir con los comandos incluidos.


### 7.2.1 Punto de partida

| Hito | Referencia | Cómo reproducirlo |
|---|---|---|
| Entrega del Proyecto 1 | Etiqueta **`entrega-p1`** → commit `8737d9b782772a5cff9acb07de8d719f4f4e3a16` (26/08/2026) | `git show --stat entrega-p1` |
| Núcleo evolucionado (fases 1–4) | Commit `0d6c1a9` | Los commits posteriores solo agregan contratos, documentación y scripts; no cambian `src/dominio` |
| Entrega del Proyecto 2 | Etiqueta **`entrega-p2`**, que se crea sobre el commit final de la entrega | `git tag entrega-p2 && git push origin entrega-p1 entrega-p2` |

La historia no se reescribió: los cambios del P2 están en commits separados por fase (ver la sección 8.2) y se integraron a `main` con el PR #1.

**Unidad de medida.** Líneas físicas que Git suma o elimina, incluidos comentarios y líneas vacías. No mide esfuerzo, complejidad ni cobertura.

### 7.2.2 Métricas del cambio (sección 8.1)

```text
$ git diff --stat entrega-p1 0d6c1a9 -- src/dominio
 src/dominio/calculadora-mora.ts                    | 51 ++++++-----
 src/dominio/cartera-por-tramo.ts                   | 99 ++++++++++++++++++++++
 src/dominio/clasificacion-tramo.ts                 | 13 +++
 src/dominio/credito-estado.ts                      | 14 ++-
 src/dominio/devengo-interes.ts                     | 57 +++++++++++++
 src/dominio/gasto-gestion-cobro.ts                 | 45 ++++++++++
 src/dominio/politica-mora/catalogo-politicas.ts    | 10 +++
 .../politica-mora/configuracion-politica.ts        | 22 +++++
 src/dominio/politica-mora/politica-escalonada.ts   | 17 ++++
 src/dominio/politica-mora/politica-mora.ts         | 38 +++++++++
 src/dominio/politica-mora/politica-plana.ts        | 18 ++++
 src/dominio/politica-mora/politica-retroactiva.ts  | 18 ++++
 12 files changed, 381 insertions(+), 21 deletions(-)
```

| Métrica (8.1) | Resultado | Lectura |
|---|---|---|
| Archivos del núcleo **creados** | **10** | Neutro o bueno: la funcionalidad nueva vive en archivos nuevos |
| Archivos del núcleo **modificados** (de los 7 que existían en el P1) | **2**: `calculadora-mora.ts` (+32/−19) y `credito-estado.ts` (+12/−2) | Dentro del objetivo razonable (≤ 2). Los otros 5 (`dinero`, `plan-amortizacion`, `cartera`, `pago-idempotente`, `prelacion-pago`) no se tocaron |
| **¿Se modificó el motor de cálculo de mora?** | **Sí.** `calculadora-mora.ts` cambió en +32/−19 (13 líneas netas) | El P1 **no** cumplía abierto/cerrado para la mora; ver §7.2.4.1 |
| Pruebas del P1 que dejaron de pasar | **0** | Los 10 archivos de prueba del P1 (206 pruebas) pasan sobre el núcleo evolucionado |
| Pruebas del P1 que hubo que reescribir | **0** | `git diff entrega-p1 -- tests` solo muestra archivos **añadidos** (A); ningún archivo del P1 aparece como modificado (M) |
| Líneas netas añadidas a `src/dominio` | **+360** (381 añadidas, 21 eliminadas) | Por encima del rango orientativo de 60–120 líneas; el desglose explica por qué |

**Desglose de las 360 líneas netas.** El rango de 60–120 líneas del enunciado se refiere al cambio de política. Nuestro diff incluye además CP-02 y CP-04:

| Cambio | Archivos | Líneas netas |
|---|---|---:|
| CP-01 / CP-03 · Política escalonada y coexistencia | `politica-mora/*` (5 archivos), `clasificacion-tramo.ts`, adaptación de `calculadora-mora.ts` | 123 + 13 + 13 = **149** |
| … de las cuales solo son doble de prueba o configuración | `politica-retroactiva.ts` (18), `configuracion-politica.ts` (22) | (40) |
| CP-02 · Gasto de gestión de cobro | `gasto-gestion-cobro.ts` | **45** |
| CP-04.1 · `en_mora → cancelado` | `credito-estado.ts` | **10** |
| CP-04.2 · Suspensión del devengo | `devengo-interes.ts` | **57** |
| CP-04.3 · Cartera en riesgo por tramo | `cartera-por-tramo.ts` | **99** |
| **Total** | 12 archivos | **360** |

Sin contar la configuración ni el doble de prueba, la política escalonada ocupó **109 líneas netas**, dentro del rango orientativo. El resto corresponde a correcciones que el enunciado exige y que no son parte de la política de mora.

Fuera de `src/dominio` se añadieron `aplicacion/consultar-mora.ts` (+27) y `contratos/presentadores-p2.ts` (+32), y se modificó `contratos/esquemas.ts` (+33/−0). Con esos archivos, todo `src/` suma 473 líneas añadidas y 21 eliminadas.

### 7.2.3 Los cinco principios (sección 8.2)

| Principio | Pregunta del enunciado | Respuesta con evidencia | Veredicto |
|---|---|---|---|
| **S** · Responsabilidad única | ¿Quién decide el tramo y quién decide cuánto cuesta? ¿Es la misma clase? | **Son piezas distintas.** El tramo lo decide `clasificarTramoMora` en `clasificacion-tramo.ts` (Specification: días → tramo). El costo lo decide cada `PoliticaMora` (`politica-escalonada.ts`, `politica-plana.ts`). Se prueban por separado: `INV-10` en `invariantes.test.ts` y los casos M-1 a M-4 en `politica-mora.test.ts`. En el P1, `clasificarTramoMora` y el enum `TramoMora` vivían **dentro** de `calculadora-mora.ts`; el diff los retira del motor y los reexporta | Se cumple **después** del cambio; en el P1 estaban juntos |
| **O** · Abierto/cerrado | ¿Se pudo agregar la política escalonada sin abrir el motor? | **No en el primer cambio.** `calculadora-mora.ts` cambió en +32/−19: el P1 recibía la **tasa** como parámetro de un método estático (`calcularInteresMoratorio(capital, tasa, dias)`), no una política. Hubo que abrir un punto de extensión (`constructor(private readonly politica: PoliticaMora)`). **A partir de ahora sí se cumple**: `contrato-politica.test.ts` inyecta una tercera política (`PoliticaRetroactiva`) sin tocar el motor | **Parcial**: el P1 no lo cumplía; el P2 lo establece |
| **L** · Sustitución de Liskov | ¿Se pueden intercambiar plana, escalonada y retroactiva sin romper los invariantes del motor? | **Sí.** `contrato-politica.test.ts` ejecuta la misma batería (`describe.each`) contra las tres: mismas entradas, resultado determinista e inmutable, no negativo, misma moneda y tope ≤ capital. Se prueban 3 políticas × 2 monedas × 4 capitales × 12 atrasos (0, 1, 30, 31, 60, 61, 90, 91, 120, 121, 150, 100000) = **288 combinaciones**. El motor además rechaza una estrategia que viole el contrato ("el motor rechaza una estrategia que incumple moneda, finitud, signo o tope") | **Se cumple** |
| **I** · Segregación de interfaces | ¿El puerto de política expone solo lo que el motor necesita? | **Sí.** `PoliticaMora` tiene 2 miembros: `readonly id` y `calcular(capital, dias): CalculoPolitica` (`politica-mora.ts`, 4 líneas de interfaz). Ninguna implementación lanza "no soportado"; ninguna persiste, lee el reloj ni cambia el estado del crédito | **Se cumple** |
| **D** · Inversión de dependencias | ¿El motor depende de la abstracción o de una implementación concreta? | **De la abstracción.** `calculadora-mora.ts` importa `PoliticaMora` **solo como tipo** (`import type`) y no nombra `PoliticaPlana` ni `PoliticaEscalonada`. Quien construye la política es `resolverPolitica` (`catalogo-politicas.ts`), y la composición ocurre en la capa de aplicación (`consultar-mora.ts`) | **Se cumple**, con una dependencia residual (ver §7.2.4.3) |

#### GRASP

| Principio | Pregunta del enunciado | Evidencia |
|---|---|---|
| Experto en información | ¿Quién conoce los días de atraso? Esa pieza debe calcular el tramo | `DiasAtraso` (núcleo) alimenta a `clasificarTramoMora`; `CalculadoraMora.calcularPorCuota` devuelve `tramo` junto al importe. **Ni el tablero ni el caso de uso calculan el tramo**: la interfaz lo recibe (ver §3.3.2) |
| Polimorfismo | ¿La política se elige por despacho polimórfico o con un `switch`? | El motor usa despacho polimórfico (`this.politica.calcular(...)`). La **selección** de la política sí es un condicional por fecha en un único punto (`resolverPolitica`: `fechaOtorgamiento < vigencia ? plana : escalonada`). Crecerá con cada versión nueva (§7.2.4.4) |
| Bajo acoplamiento / alta cohesión | Medido con `git diff --stat` | 10 archivos nuevos frente a 2 modificados; cada archivo nuevo tiene una sola responsabilidad y su propio archivo de pruebas |

### 7.2.4 Puntos de fricción: qué se abrió que no debía abrirse

#### 7.2.4.1 `calculadora-mora.ts` (el motor): +32 / −19

**Causa.** En el P1 la mora era `CalculadoraMora.calcularInteresMoratorio(capitalVencido, tasa, dias)`: un método estático que recibía una **tasa**, no una **política**. La tasa plana era, en la práctica, un parámetro primitivo. El tramo y su clasificación también vivían en el mismo archivo.

**Rediseño aplicado** (commit `ec2a436`):

```diff
+import type { PoliticaMora, CalculoPolitica } from "./politica-mora/politica-mora.js";
+export { TramoMora, clasificarTramoMora } from "./clasificacion-tramo.js";
 export class CalculadoraMora {
+  public constructor(private readonly politica: PoliticaMora) { Object.freeze(this); }
+  public calcular(capital: Dinero, dias: DiasAtraso) { … this.politica.calcular(capital, dias) … }
```

- Se extrajo `TramoMora` / `clasificarTramoMora` a `clasificacion-tramo.ts` y se reexporta, para que el código del P1 que los importaba siga compilando.
- Se agregó la instancia con la política inyectada. La **fachada estática del P1 se conservó intacta** para no romper las 206 pruebas.
- `debeDevengarInteresCorriente` pasó de `dias.valor <= 90` a leer `REGLAS_COBRO.diasHastaReconocimientoCorriente`.

**Qué se haría distinto en el P1:** inyectar desde el principio una `PoliticaMora`, aunque solo existiera la plana. Así, este cambio habría sido de 0 líneas en el motor.

#### 7.2.4.2 `credito-estado.ts`: +12 / −2

**Causa.** CP-04.1 es un defecto del enunciado del P1: la tabla de transiciones no incluía `EN_MORA → CANCELADO`. Con el patrón State, una transición nueva **obliga** a modificar la clase del estado de origen (`EstadoEnMora` añade `cancelar`). Esto es propio del patrón, no un problema de acoplamiento.

**Rediseño:** override de `cancelar` en `EstadoEnMora` con la guarda "saldo = 0.00 exacto y sin cuotas vencidas pendientes", y el método `Credito.liquidarConPago(e, saldoTotal: Dinero, cuotasVencidasPendientes)`. Además, la suspensión del devengo usa la misma regla de `debeDevengarInteresCorriente` en lugar de repetir el número 90.

#### 7.2.4.3 Dependencias residuales (no requirieron abrir archivos, pero existen)

- `PoliticaEscalonada` lee sus tasas de `configuracion-politica.ts` con un `import`, no por constructor. **Para cambiar el 30 % de Mora 3 se edita `configuracion-politica.ts`, no `calculadora-mora.ts`**: se cumple la regla de la sección 7.2 ("sin tocar el motor"). Sin embargo, sigue siendo un cambio de código que requiere volver a compilar. En el Proyecto Final, la configuración debería llegar desde el repositorio de políticas versionadas (puerto `AdministrarPolitica`).
- Las políticas importan el tipo `DiasAtraso` de `calculadora-mora.ts`, y la plana reutiliza el validador de tasa de ese archivo. Es un acoplamiento de tipos heredado del P1 que podría extraerse a `dias-atraso.ts`.

#### 7.2.4.4 Deuda aceptada

1. **Fachada estática P1**: conserva la fórmula plana sin tope ni congelación a 120 días. Las entradas del P2 usan `consultarMora` o el motor inyectado.
2. **Catálogo con un condicional**: dos versiones cerradas en código. Una tercera política exigirá tocar `resolverPolitica` (aunque no el motor).
3. **Clasificación ≠ baja contable**: pasados los 120 días la mora se congela automáticamente, pero la baja (`INCOBRABLE`) requiere autorización y evidencia, como en el P1.
4. **Gasto y devengo son funciones puras**: el llamador conserva el resultado. La persistencia atómica y la concurrencia corresponden al Proyecto Final.
5. **Porcentajes conciliados por restos mayores**: una fila puede diferir una centésima de su redondeo aislado para que la suma sea exactamente 7.00 % (invariante 7).
6. **Duplicación menor** del conjunto de estados activos entre `cartera.ts` (P1) y `cartera-por-tramo.ts`, retenida para no modificar un sexto archivo del P1.

### 7.2.5 Resultado de las pruebas

Última ejecución registrada: `npm run verify` (`tsc --noEmit` + `vitest run`) con **263 pruebas aprobadas en 18 archivos** y código de salida 0. La validación desde instalación limpia (`npm ci`) está en [e6-04-validacion-final.md](e6-04-validacion-final.md).

| Prueba obligatoria de E6 | Archivo y caso | Resultado |
|---|---|---|
| M-1 Q5.44 · M-2 Q18.14 · M-3 Q50.80 · M-4 Q65.32 | `politica-mora.test.ts` · "M-1 a M-4 y congelación: día %s = %s" (incluye 121 y 150 días = Q65.32) | Pasa |
| M-5 Q1,047.76 (y Q1,010.06 a 15 días) | `gasto-gestion-cobro.test.ts` · "M-5 y pago sin gasto al corte" | Pasa |
| Coexistencia: Q21.77 plana y Q18.14 escalonada a 45 días | `politica-mora.test.ts` · "conserva la plana de 45 días"; `regresion-p1.test.ts` | Pasa |
| Suite del P1 intacta (Q7.26, tabla de 12 filas) | 10 archivos del P1 sin modificar; `regresion-p1.test.ts` · "invariante 5 … mantienen 7.26" | 206 de 206 pasan |
| Contrato contra las tres políticas (Liskov) | `contrato-politica.test.ts` · "Contrato LSP: $id" | Pasa para plana, escalonada y retroactiva |
| Los ocho invariantes de la sección 7.9 | 1, 2 y 4: `politica-mora.test.ts`; 3: `contrato-politica.test.ts`; 5 y 8: `regresion-p1.test.ts`; 6: `gasto-gestion-cobro.test.ts`; 7: `cartera-por-tramo.test.ts` | Pasa |
| CP-04.1 `en_mora → cancelado`; SOLICITADO no puede pagar | `credito-cancelacion-p2.test.ts` | Pasa |
| CP-04.2 día 90 frente a 100: el ingreso no sube y el suspenso sí | `devengo-interes.test.ts` · "día 90 reconoce; días 91 y 100 acumulan suspenso sin aumentar ingreso" | Pasa |
| CP-04.3 3.00 + 2.25 + 1.00 + 0.75 = 7.00 % | `cartera-por-tramo.test.ts` · "cumple oráculo: 7.00% en riesgo y 21.75% en mora" | Pasa |
| Redondeo por tramo prohibido (Q50.80 y no Q50.81) | `politica-mora.test.ts` · "desglosa sin redondear cada tramo" | Pasa |

Durante la evolución hubo **dos fallos de compilación** en pruebas **nuevas**: la inferencia literal del parámetro de `PoliticaPlana` quedó restringida a `"0.24"`, y un enum de estado se ensanchó en una entrada nueva. Se corrigieron con una anotación `string` y un discriminante literal, sin tocar las expectativas del P1. No se observaron fallos de pruebas del P1.

Restricciones de E6 verificadas: `"strict": true` en `tsconfig.json`; `rg '\bany\b' src` sin coincidencias; `rg 'new Date\(\)' src` sin coincidencias (el núcleo no lee el reloj); dependencias de producción: `date-fns`, `decimal.js` y `zod`, sin `express` ni `pg`.

**Comandos para reproducir**

```bash
npm install && npm test                                  # suite completa
npm run test:mora            # también: test:coexistencia, test:cp04, test:invariantes
git diff --stat entrega-p1 0d6c1a9 -- src/dominio        # métricas de §7.2.2
git diff --name-status entrega-p1 -- tests               # solo "A": ninguna prueba P1 modificada
git show ec2a436 -- src/dominio/calculadora-mora.ts      # apertura del motor (§7.2.4.1)
git show 5752b55 -- src/dominio/credito-estado.ts        # transición nueva (§7.2.4.2)
```

### 7.2.6 Conclusión

**Grado real de cumplimiento de SOLID en el diseño del P1:** parcial. El P1 aplicó bien **S** e **I** en los módulos de dinero, amortización, prelación e idempotencia: ninguno de esos cinco archivos cambió. También aplicó **State** en el ciclo de vida del crédito. Pero **no cumplía O ni D para la mora**: la tasa llegaba como parámetro primitivo a un método estático, y la clasificación del tramo compartía archivo con el cálculo. Por eso el motor tuvo que abrirse una vez (+32/−19).

**Después del P2**, el motor depende de una abstracción inyectada, tres políticas cumplen el mismo contrato y una política nueva ya **no** requiere modificar `calculadora-mora.ts`. La prueba de ello es `PoliticaRetroactiva`, que se agregó sin tocarlo. La medición respalda que el cambio fue localizado: 2 de 7 archivos modificados, 0 pruebas del P1 reescritas y 0 regresiones.

**Qué haríamos distinto hoy:**

1. Declarar el puerto `PoliticaMora` desde el P1, aunque tuviera una sola implementación.
2. Separar desde el inicio la Specification del tramo y el cálculo.
3. Cargar la configuración de tasas desde un repositorio de políticas versionadas en lugar de un módulo TypeScript.
4. Resolver la política con un registro de versiones por vigencia (una tabla ordenada por fecha) en lugar de un condicional, para que una tercera versión no toque `catalogo-politicas.ts`.

---

# 8. E7 · Repositorio e historial de cambios

## 8.1 Cómo se organizó el repositorio

La documentación del Proyecto 2 vive en `docs/proyecto2/`, con un prefijo por entregable para que su propósito sea evidente:

| Prefijo | Entregable | Archivos |
|---|---|---|
| `e1-` | Investigación de usuario | `e1-investigacion-usuario.md`, `e1-instrumentos-investigacion.md` |
| `e2-` | Arquitectura de información | `e2-arquitectura-informacion.md` y la carpeta `wireframes/` |
| `e4-` | Decisión móvil/web | `e4-decision-movil-web.md` |
| `e6-` | Evolución del núcleo | `e6-01-auditoria-inicial.md`, `e6-02-evolucion-nucleo.md`, `e6-03-pruebas-mora-escalonada.md`, `e6-04-validacion-final.md` |
| — | Informe SOLID y ADR | `docs/informe-impacto-solid.md`, `docs/adr/ADR-004-politica-mora-escalonada.md` |
| — | Índice e historial | `docs/proyecto2/README.md`, `historial-cambios.md` |

El núcleo sigue en `src/dominio/` y las pruebas en `tests/`. Todo se verifica con `npm install && npm test`, sin base de datos, sin servidor y sin interfaz.

## 8.2 Historial de commits

El enunciado exige que el historial permita comparar la entrega del P1 con la del P2, y advierte que alterar ese historial es falta de integridad académica. No reescribimos nada. Esta tabla presenta **todos los commits** desde `entrega-p1`, en orden cronológico, con lo que aportó cada uno. Los datos salen de:

```bash
git log --reverse --format='%h %ad %an %s' --date=short entrega-p1..HEAD
git show --stat <hash>
```

### 8.2.1 Tabla de commits

| # | Fecha | Commit | Autor (Git) | Tipo | Entregable | Qué se hizo | Archivos principales | Cambio |
|---|---|---|---|---|---|---|---|---|
| — | 26/08 | `8737d9b` | — | Base | P1 | **Entrega del Proyecto 1** (etiqueta `entrega-p1`). Punto de comparación de todas las métricas | — | — |
| 0 | 21/09 | `71a5179` | Christopher Herrera | Auditoría | E6 | Auditoría inicial y línea base: 7 archivos de dominio y 206 pruebas pasando; se crea la etiqueta `entrega-p1` | `e6-01-auditoria-inicial.md` | 1 archivo, +70 |
| 1 | 21/09 | `ec2a436` | Christopher Herrera | Funcionalidad | E6 · CP-01 | Puerto `PoliticaMora`, políticas plana, escalonada y retroactiva, catálogo por fecha de otorgamiento, configuración versionada y Specification de tramo. Se abre el motor para inyectar la política | `politica-mora/*`, `clasificacion-tramo.ts`, `calculadora-mora.ts` | 10 archivos, +223 / −21 |
| 2 | 21/09 | `d3b30f5` | Christopher Herrera | Funcionalidad | E6 · CP-02 | Gasto de gestión de cobro de Q25.00 al día 31, idempotente por cuota | `gasto-gestion-cobro.ts` y su prueba | 2 archivos, +105 |
| 3 | 21/09 | `5752b55` | Christopher Herrera | Funcionalidad | E6 · CP-04 | Transición `en_mora → cancelado`, suspensión del devengo y cartera en riesgo por tramo; diagramas de estado actualizados | `credito-estado.ts`, `devengo-interes.ts`, `cartera-por-tramo.ts` | 10 archivos, +343 / −2 |
| 4 | 21/09 | `0d6c1a9` | ERAMR18 | Pruebas | E6 · CP-03 | Contrato común contra las tres políticas (Liskov), regresión integrada y caso de uso `consultarMora`. **Corte del núcleo medido en el informe SOLID** | `contrato-politica.test.ts`, `regresion-p1.test.ts`, `consultar-mora.ts` | 3 archivos, +121 |
| 5 | 21/09 | `958e70f` | ERAMR18 | Documentación | E6 | ADR-004, primer informe SOLID, UML (Strategy de mora, secuencias), contratos Zod/OpenAPI y documento móvil inicial | `ADR-004`, `informe-impacto-solid.md`, `*.puml`, `openapi.yaml` | 16 archivos, +753 / −97 |
| 6 | 21/09 | `8112e57` | ERAMR18 | Validación | E6 | Validación desde instalación limpia: 263 pruebas en 18 archivos y revisión de tipos sin errores | `e6-04-validacion-final.md` | 2 archivos, +100 / −1 |
| 7 | 22/09 | `5e73d12` | Christopher Herrera | Herramientas | E6 | Seis comandos de prueba por tema (`test:mora`, `test:cp04`, `test:invariantes`…) para verificar partes específicas en la defensa | `package.json` | 1 archivo, +6 |
| 8 | 22/09 | `9e06c37` | Elízabeth | Documentación | E6 | Documento de pruebas de la mora escalonada (entradas, salidas y criterios) e informe de verificación SOLID | `e6-03-pruebas-mora-escalonada.md`, informe de verificación | 2 archivos, +1,043 |
| 9 | 22/09 | `8e421a6` | Elízabeth | Integración | — | Sincronización de la rama local con la remota | `package.json` | 1 archivo, +6 |
| 10 | 22/09 | `183dc71` | Oliver Romero | Integración | E6 · E7 | **Pull Request #1**: integra toda la evolución del núcleo en `main` | 42 archivos | +2,751 / −108 |
| 11 | 22/09 | `13aa167` | Erwin | Documentación | E7 | README: tabla de comandos de prueba por tema | `README.md` | 1 archivo, +20 / −1 |
| 12 | 23/09 | `16f983f` | Oliver Romero · IA declarada | Documentación | E1 · E2 · E4 · E6 | Investigación de usuario, arquitectura de información, 15 wireframes, decisión PWA; informe SOLID reorganizado según el Anexo D; documentos renombrados por entregable | `e1-*`, `e2-*`, `e4-*`, `wireframes/`, `informe-impacto-solid.md` | 32 archivos, +2,413 / −232 |
| 13 | 23/09 | `4ba9e55` | Oliver Romero · IA declarada | Documentación | E7 | Historial de cambios y documento técnico consolidado | `historial-cambios.md`, `documentacion-completa.md` | 4 archivos, +2,658 |
| 14 | 23/09 | `00709f9` | Oliver Romero · IA declarada | Documentación | E3 · E5 · E7 | Enlace de Figma en el README y el índice, revisión del prototipo y evaluación preliminar E5 | `P2-documento-entrega.md`, `README.md` | 6 archivos, +511 / −12 |
| 15 | 23/09 | `8486b6e` | Oliver Romero · IA declarada | Documentación | E1–E7 | Documento de entrega unificado (este archivo), generado a partir de los documentos del repositorio | `P2-documento-entrega.md`, `fuente-documento-entrega.md` | — |
| 16 | 23/09 | `53689ef` | Oliver Romero · IA declarada | Documentación | E2 · E6 | Primeros skeletons, diagrama de casos de uso y ADR-005 (PWA) | `wireframes/skeleton/`, `casos-de-uso-p2.svg`, `ADR-005` | 22 archivos |
| 17 | 23/09 | `cdc92c4` | Oliver Romero · IA declarada | Documentación | E2 · E6 · E7 | Documento de complementos con enlaces a GitHub | `P2-complementos.md` | 2 archivos |
| 18 | 23/09 | *(este documento)* | Oliver Romero · IA declarada | Documentación | E2 · E3 | **Alineación con Figma:** wireframes P01–P14 con la misma disposición que el prototipo y guías G01–G07 para las pantallas que faltan; mapa, casos de uso y documentos con los mismos códigos | `wireframes/anotado/`, `wireframes/skeleton/`, `e2-arquitectura-informacion.md` | — |

**Totales desde `entrega-p1`:** el núcleo `src/dominio` suma 12 archivos (10 nuevos y 2 modificados), +381 / −21 líneas. Las pruebas pasan de 206 a 263 sin modificar ningún archivo de prueba del P1.

> **Nota sobre los hashes.** Los commits 0 a 11 ya están en GitHub y sus hashes son definitivos. Los commits 12 a 18 se integran después de esta entrega; si se aplican desde un parche, Git les asigna un hash nuevo y se identifican por su mensaje.

### 8.2.2 Las fases del trabajo

| Fase | Fechas | Commits | Resultado |
|---|---|---|---|
| Auditoría | 21/09 | 0 | Línea base del P1 verificada y etiquetada |
| Evolución del núcleo | 21/09 | 1 – 4 | CP-01 a CP-04 implementados, de 206 a 260 pruebas |
| Contratos y documentación técnica | 21/09 | 5 – 6 | ADR, UML, OpenAPI, informe SOLID y validación limpia (263 pruebas) |
| Herramientas e integración | 22/09 | 7 – 11 | Comandos de prueba, documento de pruebas, PR #1 y README |
| Experiencia de usuario y entrega | 23/09 | 12 – 18 | E1, E2, E4, wireframes, revisión E3/E5, historial y documento de entrega |

## 8.3 Qué faltaba documentar y cómo se resolvió

| Problema encontrado en la revisión | Solución |
|---|---|
| Tres documentos afirmaban que "el enunciado no define CP-03". Sí lo define: es la sección 7.6, *Coexistencia de políticas* | Corregido en `e6-02`, `e6-04` y en la matriz de trazabilidad |
| La validación decía "sin push, PR ni merge", pero después hubo un PR | Actualizada con el PR #1 (`183dc71`) |
| El documento de pruebas no tenía extensión `.md` y GitHub lo mostraba como texto plano | Renombrado a `e6-03-pruebas-mora-escalonada.md` |
| Había dos informes SOLID con datos distintos (13 frente a 12 atrasos probados) | Fusionados en uno, con la cifra correcta: 12 atrasos y 288 combinaciones |
| Los comandos de prueba (commit 7) y los merges (9 y 10) no estaban en ningún documento | Registrados en la tabla de §8.2.1 y en `historial-cambios.md` |
| E1, E2 y E4 casi no existían, y el documento móvil no tomaba una decisión | Escritos de nuevo (capítulos 2, 3 y 5) |

---

# 9. Reparto del trabajo y declaración de uso de IA

## 9.1 Reparto del trabajo (sección 12.1)

Esta tabla se armó a partir del historial de Git y de los roles declarados en el P1. **Cada integrante debe confirmar o corregir su fila**, en especial el trabajo que no deja rastro en Git (Figma, investigación, design review).

| Integrante | Rol | Responsabilidad principal | Evidencia verificable | Entregables |
|---|---|---|---|---|
| Christopher David Herrera Pérez | Ingeniería de dominio | Políticas de mora, gasto de cobro, CP-04 y comandos de prueba | Commits 0, 1, 2, 3 y 7 | E6 |
| Erwin Alberto Ramírez Racancoj | Pruebas y trazabilidad | Contratos de prueba, documentación técnica, validación y README (commits como *ERAMR18* y *Erwin*; confirmar que es la misma persona) | Commits 4, 5, 6 y 11 | E6, E7 |
| Gabriela Elízabeth Noemí Aguilar Vásquez | Diseño y documentación | Documento de pruebas e informe de verificación SOLID; *(agregar: Figma e investigación)* | Commits 8 y 9 | E6, *(E1–E3)* |
| Oliver Fernando Romero Esquite | Coordinación e integración | PR #1, documentación de E1, E2 y E4, consolidación del informe SOLID y documento de entrega; *(agregar: Figma)* | Commits 10, 12, 13, 14 y 15 | E1, E2, E4, E7 |

## 9.2 Declaración de uso de herramientas de IA (sección 15)

| Herramienta | Uso |
|---|---|
| **OpenAI Codex** | Apoyo en la evolución del núcleo (CP-01 a CP-04), en las pruebas y en la documentación técnica de E6 |
| **Claude (Anthropic)** | Apoyo en la redacción de E1, E2 y E4; generación de los wireframes de baja fidelidad con un script editable (`wireframes/generar_wireframes_figma.py`); reorganización del informe SOLID según el Anexo D; historial de cambios; revisión preliminar del prototipo de Figma (capítulos 4 y 6) y redacción de este documento |

Las decisiones de diseño y su justificación son del equipo, y cualquiera de los cuatro integrantes debe poder explicarlas en la defensa. Las personas del E1 se apoyan en fuentes documentadas: los rasgos marcados como hipótesis no provienen de entrevistas. Los hallazgos del capítulo 6 son de un solo evaluador y deben complementarse con la evaluación independiente de cada integrante.

---

# 10. Lista de verificación de entrega (sección 12.2)

Estado al 23 de septiembre de 2026. ✅ completo · ⚠️ existe, pero requiere un ajuste · ❌ pendiente. **Actualizar esta tabla antes de exportar el PDF.**

| # | Requisito | Estado | Evidencia / pendiente |
|---|---|---|---|
| 1 | Personas fundamentadas y journey map con puntos de dolor concretos, incluido el cambio de tramo | ⚠️ | Capítulo 2. Faltan las entrevistas u observación para validar los rasgos marcados como hipótesis |
| 2 | Tabla pantalla ↔ caso de uso completa y coherente con los puertos del P1 | ✅ | §3.3 |
| 3 | Siete pantallas obligatorias y tres flujos navegables | ⚠️ | §4.4: faltan el tablero, el cierre y el desembolso |
| 4 | Plan de amortización con la cuota 12 de Q1,004.63 explicada | ⚠️ | Falta la nota explicativa en Figma |
| 5 | Detalle de la mora con el caso M-3 | ❌ | Corregir las cifras (§4.5) |
| 6 | Tablero que distingue mora (21.75 %) y riesgo (7.00 %) con desglose por tramo | ⚠️ | Justificado en la guía G04 (§3.5); falta en Figma |
| 7 | Decisión móvil/web con pérdida de conexión, idempotencia y puerto Reloj | ✅ | Capítulo 5 |
| 8 | ≥ 8 hallazgos con severidad y ≥ 5 correcciones con antes/después | ⚠️ | 14 hallazgos preliminares (§6.2); faltan la evaluación de los cuatro y las correcciones |
| 9 | Auditoría de los seis criterios nuevos de WCAG 2.2 y del 3.3.4 | ⚠️ | §6.3, preliminar |
| 10 | Design review: qué se aceptó y qué se rechazó | ❌ | Notas de la Sesión 9 |
| 11 | `npm install && npm test` en limpio, con M-1 a M-5, coexistencia y suite del P1 | ✅ | 263 pruebas en 18 archivos; repetir `npm run verify` sobre el commit final |
| 12 | Informe SOLID con métricas respaldadas por el diff | ✅ | §7.2 |
| 13 | Commit del P1 etiquetado o con su hash en el informe | ⚠️ | El hash está en el informe; falta `git push origin entrega-p1` |
| 14 | Enlaces de Figma y del repositorio abren sin pedir permisos | ✅ / ⚠️ | Figma abre sin iniciar sesión; confirmar que el repositorio sea público |
| 15 | Tabla de reparto del trabajo | ⚠️ | §9.1, a confirmar por el equipo |

---

# Anexo A · Wireframes de baja fidelidad

Wireframes anotados de las 14 pantallas del prototipo de Figma (P01–P14) y de las 7 guías (G01–G07). Los skeletons correspondientes están en `docs/proyecto2/wireframes/skeleton/` y en el documento de complementos.

![Mapa de navegación](wireframes/mapa-navegacion.svg)

![P01 · Iniciar sesión](wireframes/anotado/P01-iniciar-sesion.svg)

![P02 · Mis Clientes](wireframes/anotado/P02-mis-clientes.svg)

![P03 · Mi perfil](wireframes/anotado/P03-mi-perfil.svg)

![P04 · Nueva solicitud (paso 1)](wireframes/anotado/P04-nueva-solicitud.svg)

![P05 · Simulación de pago (paso 2)](wireframes/anotado/P05-simulacion-pago.svg)

![P06 · Confirmar solicitud (paso 3)](wireframes/anotado/P06-confirmar-solicitud.svg)

![P07 · Solicitud enviada](wireframes/anotado/P07-solicitud-enviada.svg)

![P08 · Detalle del crédito](wireframes/anotado/P08-detalle-credito.svg)

![P09 · Plan de amortización](wireframes/anotado/P09-plan-amortizacion.svg)

![P10 · Detalle de mora](wireframes/anotado/P10-detalle-mora.svg)

![P11 · Registrar pago](wireframes/anotado/P11-registrar-pago.svg)

![P12 · Confirmar pago](wireframes/anotado/P12-confirmar-pago.svg)

![P13 · Pago aplicado](wireframes/anotado/P13-pago-aplicado.svg)

![P14 · Sin señal](wireframes/anotado/P14-sin-senal.svg)

![G01 · Alta de cliente (guía)](wireframes/anotado/G01-alta-cliente.svg)

![G02 · Confirmación de desembolso (guía)](wireframes/anotado/G02-confirmacion-desembolso.svg)

![G03 · Bandeja del comité (guía)](wireframes/anotado/G03-bandeja-comite.svg)

![G04 · Tablero gerencial (guía)](wireframes/anotado/G04-tablero-gerencial.svg)

![G05 · Créditos de un tramo (guía)](wireframes/anotado/G05-creditos-tramo.svg)

![G06 · Cierre diario / mensual (guía)](wireframes/anotado/G06-cierre.svg)

![G07 · Tablero en teléfono (guía)](wireframes/anotado/G07-tablero-movil.svg)

