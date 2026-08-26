# Fase 1 — Analisis del dominio y requisitos

## 1. Objetivo y alcance de la fase

Definir el lenguaje, las responsabilidades, las reglas y los limites del dominio del Sistema de Gestion de Microcredito de Credito Vecino, S. A. antes de tomar decisiones de implementacion. Este documento constituye la linea base de requisitos para las fases posteriores.

En esta fase no se implementa codigo TypeScript, infraestructura, persistencia, API, interfaz grafica ni integracion externa.

## 2. Contexto del problema

Credito Vecino, S. A. es una institucion guatemalteca de microfinanzas que concede creditos entre Q1,000.00 y Q25,000.00, con plazos de 3 a 24 meses. El proceso actual depende de hojas de calculo dispersas, presenta diferencias en los calculos de mora y produce cierres financieros inconsistentes.

El sistema debe establecer una unica interpretacion del negocio y asegurar que los calculos financieros sean exactos, reproducibles, auditables, trazables y deterministas. El nucleo se diseñara para ser reutilizado posteriormente por una API, una interfaz, un chat y un servidor MCP, sin que esos componentes formen parte de Proyecto 1.

## 3. Glosario del dominio

| Termino | Definicion operativa |
|---|---|
| Cliente | Persona registrada que puede presentar una solicitud de credito. |
| Solicitud de credito | Peticion de financiamiento previa a la decision institucional y al nacimiento del credito desembolsado. |
| Credito | Obligacion financiera originada a partir de una solicitud aprobada y regida por condiciones y politicas conservadas historicamente. |
| Capital | Importe principal desembolsado o pendiente, sin incluir intereses, mora, gastos ni comisiones. |
| Cuota | Obligacion periodica compuesta por amortizacion de capital e interes corriente. |
| Plan de amortizacion | Calendario determinista de cuotas de un credito. |
| Interes corriente | Rendimiento calculado sobre el saldo de capital conforme a la politica aplicable. |
| Interes moratorio | Cargo calculado exclusivamente sobre capital vencido; nunca sobre intereses. |
| Mora | Situacion producida por obligaciones vencidas y no pagadas. |
| Dias de atraso | Dias calendario transcurridos desde el vencimiento de una obligacion impagada hasta una fecha de corte inyectada. |
| Tramo de mora | Clasificacion derivada de los dias de atraso; no es un estado principal del credito. |
| Regularizacion | Pago de todo lo vencido que permite que un credito en mora vuelva a estar vigente. |
| Prelacion de pago | Orden obligatorio de aplicacion del pago: gastos/comisiones, interes moratorio, interes corriente y capital. |
| Cartera activa | Capital de creditos activos, excluidos los declarados incobrables. |
| Capital en riesgo | Saldo completo de capital de creditos con mas de 30 dias de atraso o reestructurados, aunque estos ultimos esten al dia. |
| Cartera en riesgo | Razon entre capital en riesgo y cartera activa. |
| Cierre | Resultado financiero reproducible para una fecha o periodo, construido sin duplicar movimientos. |
| Mayor | Registro append-only de movimientos que permite reconstruir saldos sin sobrescribirlos. |
| Fecha de corte | Fecha explicita utilizada para evaluar vencimientos, mora, cartera y cierres. |
| Politica financiera | Configuracion versionada y vigente en un intervalo que determina tasas, tipo de tasa, base de conteo u otras decisiones institucionales. |

## 4. Actores

### 4.1 Actores humanos

| Actor | Responsabilidad e interaccion principal |
|---|---|
| Cliente | Proporciona sus datos, solicita el credito, recibe el desembolso y realiza pagos. |
| Asesor de credito | Registra clientes y solicitudes, recopila informacion y consulta el seguimiento de la solicitud. |
| Analista de credito | Evalua la solicitud conforme a criterios institucionales y emite una recomendacion trazable. |
| Aprobador o comite de credito | Aprueba o rechaza solicitudes dentro de sus atribuciones y deja motivo y autoria de la decision. |
| Cajero o gestor de cobros | Registra pagos y entrega el resultado de su aplicacion por concepto. |
| Encargado de desembolsos | Ejecuta el desembolso de una solicitud previamente aprobada. |
| Encargado financiero/contable | Genera y consulta cierres diarios y mensuales, devengos, saldos, provisiones e incobrables. |
| Gestor de cartera/riesgos | Consulta mora, tramos y cartera en riesgo; da seguimiento a creditos deteriorados o reestructurados. |
| Administrador de politicas | Registra versiones de politicas institucionales con vigencia, autor y version. |
| Auditor | Consulta el historial de decisiones, transiciones, pagos, politicas, movimientos y cierres sin alterarlo. |

### 4.2 Actores de sistema o tiempo

| Actor | Responsabilidad e interaccion principal |
|---|---|
| Reloj/fecha de corte | Proporciona de forma inyectable la fecha efectiva para calculos y procesos; evita depender de la fecha del sistema. |
| Proceso programado de cierre | Solicita la generacion idempotente de cierres para una fecha o periodo. |
| Sistema contable futuro | Consumira movimientos y cierres mediante contratos externos en una evolucion posterior. |
| Canal externo futuro (API, UI, chat o MCP) | Invocara los mismos casos de uso del nucleo en proyectos posteriores, sin contener reglas financieras. |

## 5. Requisitos funcionales

| ID | Requisito funcional |
|---|---|
| RF-01 | Registrar un cliente con identidad suficiente y un identificador unico. |
| RF-02 | Crear una solicitud para un cliente registrado por un importe entre Q1,000.00 y Q25,000.00 y un plazo entre 3 y 24 meses. |
| RF-03 | Evaluar una solicitud y conservar resultado, fecha, criterios, autor y observaciones. |
| RF-04 | Aprobar o rechazar una solicitud evaluada, registrando actor, fecha y motivo. |
| RF-05 | Desembolsar unicamente una solicitud aprobada y conservar las condiciones y la version de la politica aplicable. |
| RF-06 | Generar un plan de amortizacion frances y ajustar la ultima cuota para amortizar exactamente el capital y dejar saldo cero. |
| RF-07 | Registrar pagos parciales, exactos o con excedente, sin rechazarlos por insuficiencia. |
| RF-08 | Aplicar cada pago en el orden: gastos/comisiones, interes moratorio, interes corriente y capital. |
| RF-09 | Procesar el excedente de un pago mediante una politica explicita y no perderlo. |
| RF-10 | Evitar que el reintento del mismo pago con la misma clave de idempotencia afecte nuevamente el saldo. |
| RF-11 | Calcular dias calendario de atraso para cada obligacion vencida usando una fecha de corte explicita. |
| RF-12 | Clasificar el atraso como sin mora, Mora 1, Mora 2, Mora 3, Vencido o Incobrable segun sus dias. |
| RF-13 | Calcular interes moratorio por cuota exclusivamente sobre su capital vencido y de forma independiente. |
| RF-14 | Suspender el devengo de interes corriente despues de 90 dias de atraso y permitir reactivarlo al regularizarse. |
| RF-15 | Mantener el ciclo de vida y rechazar transiciones u operaciones incompatibles con el estado del credito. |
| RF-16 | Conservar un historial inalterable de transiciones con estado anterior, estado nuevo, fecha, actor/proceso y motivo. |
| RF-17 | Permitir deterioro, pago parcial, regularizacion, reestructuracion, cancelacion y declaracion de incobrable conforme a reglas. |
| RF-18 | Calcular cartera en riesgo usando el saldo completo de capital de creditos con mas de 30 dias de atraso o reestructurados. |
| RF-19 | Excluir creditos incobrables de la cartera activa y tratarlos como salida contable sin reactivacion posterior. |
| RF-20 | Generar un cierre diario con desembolsos, cobros por concepto, devengo, mora y saldo de cartera. |
| RF-21 | Generar un cierre mensual consolidado con cartera en riesgo, riesgo por tramo, incobrables, provisiones, activos y proximos vencimientos. |
| RF-22 | Hacer idempotente cada cierre para que una segunda ejecucion equivalente no duplique movimientos. |
| RF-23 | Registrar movimientos financieros en un mayor append-only capaz de reproducir los saldos. |
| RF-24 | Consultar el detalle de un credito, su saldo, plan, pagos, mora, estado e historial. |
| RF-25 | Registrar politicas institucionales versionadas y seleccionar la vigente en la fecha correspondiente. |
| RF-26 | Conservar en cada credito la politica financiera aplicable al otorgamiento, aunque posteriormente existan nuevas versiones. |

## 6. Requisitos no funcionales

| ID | Requisito no funcional | Criterio verificable |
|---|---|---|
| RNF-01 | Exactitud | Los importes no usan punto flotante binario; se redondean a dos decimales con metodo medio hacia arriba. |
| RNF-02 | Determinismo | Las mismas entradas, politicas y fecha de corte producen exactamente el mismo resultado. |
| RNF-03 | Reproducibilidad | Un saldo o cierre puede reconstruirse a partir de politicas, entradas y movimientos conservados. |
| RNF-04 | Auditabilidad | Decisiones, transiciones, politicas, pagos, cierres y movimientos conservan identidad, fecha y autor/proceso. |
| RNF-05 | Trazabilidad | Todo requisito se relaciona con caso de uso, clase/modulo y prueba cuando corresponda. |
| RNF-06 | Integridad | No se sobrescriben movimientos ni historiales; los registros financieros son append-only. |
| RNF-07 | Idempotencia | Reintentos de un pago o cierre con la misma identidad no producen un segundo efecto financiero. |
| RNF-08 | Mantenibilidad | Las reglas financieras, ciclo de vida, casos de uso y adaptadores permanecen separados en modulos cohesivos. |
| RNF-09 | Modificabilidad | Las politicas de tasa y excedente pueden sustituirse sin modificar los algoritmos que las consumen. |
| RNF-10 | Testabilidad | Reloj, identificadores, repositorios y politicas pueden sustituirse por dobles de prueba; los calculos financieros son puros. |
| RNF-11 | Confiabilidad | Las invariantes financieras se validan y las operaciones invalidas fallan explicitamente sin efectos parciales. |
| RNF-12 | Interoperabilidad futura | Los casos de uso no dependen del canal y pueden ser reutilizados por API, UI, chat o MCP. |
| RNF-13 | Seguridad conceptual | Las decisiones sensibles conservan autoria; los contratos futuros no expondran reglas internas ni datos innecesarios. |
| RNF-14 | Portabilidad | El nucleo ejecutara con Node.js 20 LTS o superior sin servicios externos. |
| RNF-15 | Tipado | TypeScript se configurara en modo estricto y el nucleo no usara `any` para evadir el tipado. |
| RNF-16 | Independencia de infraestructura | El nucleo no depende de servidor HTTP, base de datos, ORM, frontend, autenticacion, RAG o MCP. |

## 7. Reglas financieras y de negocio

| ID | Regla |
|---|---|
| RN-01 | El importe solicitado y desembolsado esta entre Q1,000.00 y Q25,000.00, inclusive. |
| RN-02 | El plazo contractual esta entre 3 y 24 meses, inclusive. |
| RN-03 | Todo dinero incluye importe y moneda; operaciones entre monedas distintas estan prohibidas. |
| RN-04 | Los importes se representan de forma decimal exacta, se expresan a dos decimales y usan redondeo medio hacia arriba. |
| RN-05 | El plan usa amortizacion francesa: cuota = P x [i(1+i)^n / ((1+i)^n - 1)]. |
| RN-06 | Para TNA nominal, la tasa mensual es TNA/12; si la tasa es cero, cuota = capital/plazo. |
| RN-07 | Por periodo: interes = redondear(saldo anterior x tasa); amortizacion = cuota - interes; saldo = saldo anterior - amortizacion. |
| RN-08 | En la ultima cuota, la amortizacion equivale al saldo anterior y la cuota final equivale a esa amortizacion mas su interes. |
| RN-09 | La suma de amortizaciones equivale exactamente al capital desembolsado y el saldo final es Q0.00. |
| RN-10 | Los dias de atraso son dias calendario contados desde el vencimiento hasta la fecha de corte conforme a la convencion que se formalice. |
| RN-11 | Tramos: 0 sin mora; 1-30 Mora 1; 31-60 Mora 2; 61-90 Mora 3; 91-120 Vencido; mas de 120 Incobrable. |
| RN-12 | Los tramos de mora son clasificaciones derivadas, no estados principales; el estado general durante el atraso es EN_MORA. |
| RN-13 | El interes moratorio se calcula como capital en mora x tasa moratoria diaria x dias de atraso. |
| RN-14 | El moratorio se calcula exclusivamente sobre capital vencido, nunca sobre interes, gastos ni moratorio acumulado. |
| RN-15 | Cada cuota vencida calcula su moratorio independientemente. |
| RN-16 | Con base Actual/360, la tasa diaria se deriva usando 360 dias. |
| RN-17 | Despues de 90 dias de atraso se suspende el interes corriente; al regularizarse puede reactivarse. |
| RN-18 | La aplicacion del pago sigue estrictamente: gastos/comisiones, moratorio, interes corriente y capital. |
| RN-19 | Un pago insuficiente se acepta y se aplica hasta agotar el importe disponible. |
| RN-20 | Un excedente se procesa mediante una politica; se prefiere amortizacion directa a capital porque reduce saldo y costo financiero, siempre sujeto a las condiciones contractuales. |
| RN-21 | Un credito solicitado, rechazado, aprobado aun no desembolsado, anulado, cancelado o incobrable no admite pagos ordinarios. |
| RN-22 | Un credito con todo lo vencido pagado y atraso cero se regulariza de EN_MORA a VIGENTE. |
| RN-23 | Un pago parcial que no cubre todo lo vencido conserva el estado EN_MORA. |
| RN-24 | Un saldo de capital cero conduce a CANCELADO desde VIGENTE o, tras el plan reestructurado, desde REESTRUCTURADO. |
| RN-25 | Un atraso mayor de 120 dias permite declarar INCOBRABLE desde EN_MORA; es una salida contable irreversible. |
| RN-26 | La cartera en riesgo es capital en riesgo/cartera activa y su resultado pertenece al intervalo [0,1]. |
| RN-27 | En riesgo cuenta el saldo completo de todo credito con mas de 30 dias de atraso y de todo credito reestructurado, incluso al dia. |
| RN-28 | Los incobrables se excluyen tanto de la cartera activa como del riesgo activo. |
| RN-29 | Las tasas son politicas versionadas e intercambiables, no constantes incrustadas en algoritmos. |
| RN-30 | El credito conserva la politica vigente al otorgarse; una nueva version no altera calculos contractuales historicos. |
| RN-31 | Un cierre repetido con la misma identidad y periodo devuelve/reconoce el resultado previo sin duplicar movimientos. |
| RN-32 | Los saldos se derivan de movimientos append-only y nunca se corrigen sobrescribiendo movimientos historicos. |

## 8. Invariantes del dominio

| ID | Invariante | ambito |
|---|---|---|
| INV-01 | La suma de las amortizaciones es exactamente igual al capital desembolsado. | Plan de amortizacion |
| INV-02 | El saldo posterior a la ultima cuota es exactamente cero. | Plan de amortizacion |
| INV-03 | El capital pendiente nunca puede ser negativo. | Credito/Cuota |
| INV-04 | Un credito SOLICITADO no puede recibir pagos. | Credito |
| INV-05 | Un credito RECHAZADO no puede recibir pagos. | Credito |
| INV-06 | La cartera en riesgo se mantiene en [0,1]; con cartera activa cero se requiere un resultado definido por politica, no una division invalida. | Cartera |
| INV-07 | La suma ordenada de movimientos del mayor reproduce el saldo reportado. | Mayor/Cierre |
| INV-08 | Registrar dos veces el mismo pago con igual clave idempotente no cambia nuevamente el saldo. | Pagos |
| INV-09 | Un credito EN_MORA con todo lo vencido cubierto y cero dias de atraso vuelve a VIGENTE. | Credito |
| INV-10 | El tramo de mora siempre corresponde a los dias reales de atraso de la fecha de corte. | Mora |
| INV-11 | No se calculan intereses sobre intereses. | Calculo financiero |
| INV-12 | El importe aplicado por concepto mas el remanente equivale exactamente al importe recibido. | Prelacion de pago |
| INV-13 | Ningun excedente desaparece: queda aplicado o identificado como remanente segun la politica. | Pagos |
| INV-14 | La moneda permanece homogenea dentro de un credito, su plan, pagos, saldos y movimientos. | Credito |
| INV-15 | Toda transicion conserva el estado anterior, nuevo estado, fecha, actor/proceso y motivo. | Credito |
| INV-16 | Un credito INCOBRABLE no vuelve a un estado activo aunque exista recuperacion posterior. | Credito |
| INV-17 | Un cierre idempotente no duplica movimientos ni cambia saldos al repetirse. | Cierres |
| INV-18 | La politica contractual asociada a un credito no cambia retroactivamente. | Credito/Politicas |

## 9. Politicas institucionales configurables

Las politicas se configuran y versionan; no deben confundirse con invariantes. Una politica puede cambiar prospectivamente, mientras que una invariante siempre debe cumplirse.

| ID | Politica configurable | Datos minimos | Regla de conservacion |
|---|---|---|---|
| POL-01 | Tasa de interes corriente | tasa, tipo de tasa, vigencia, base de conteo, autor, version | El credito referencia la version vigente al otorgamiento. |
| POL-02 | Tasa de interes moratorio | tasa, tipo, vigencia, base de conteo, autor, version | Los calculos historicos identifican la version aplicada. |
| POL-03 | Tratamiento de excedentes | amortizacion directa o cuotas futuras, vigencia, autor, version | El pago registra estrategia y resultado. |
| POL-04 | Gastos y comisiones permitidos | concepto, importe/formula, vigencia, autor, version | No puede alterar la prelacion obligatoria. |
| POL-05 | Criterios de evaluacion | variables, umbrales, ponderacion, vigencia, autor, version | Cada evaluacion conserva criterios y resultado. |
| POL-06 | Facultades de aprobacion | rol/comite, limites, vigencia, autor, version | Cada decision conserva aprobador y version. |
| POL-07 | Expiracion de aprobaciones | periodo de validez, vigencia, autor, version | Una aprobacion expirada puede pasar a ANULADO. |
| POL-08 | Provisiones por riesgo | porcentajes por tramo/condicion, vigencia, autor, version | El cierre conserva version y base de calculo. |
| POL-09 | Reestructuracion | elegibilidad, autorizadores, efectos y vigencia | Conserva autorizacion y vinculo con las condiciones previas. |
| POL-10 | Calendario de vencimientos | regla de ajuste para fecha no habil, calendario y version | El plan conserva las fechas contractuales generadas. |
| POL-11 | Resultado con cartera activa cero | convencion explicita y version | Evita division por cero y mantiene resultado interpretable. |
| POL-12 | Reactivacion del devengo | condicion de regularizacion, vigencia, autor, version | No habilita reactivacion de un credito INCOBRABLE. |

Los limites legales/contractuales del producto, el orden de prelacion, la prohibicion de interes sobre interes y la irreversibilidad contable de INCOBRABLE no se modelan como simples configuraciones que un administrador pueda desactivar.

## 10. Entidades

| Entidad | Identidad | Responsabilidad principal |
|---|---|---|
| Cliente | ClienteId | Mantener identidad y datos necesarios para la relacion crediticia. |
| SolicitudCredito | SolicitudCreditoId | Registrar monto, plazo, solicitante, evaluacion y decision antes del desembolso. |
| EvaluacionCredito | EvaluacionCreditoId | Conservar criterios, resultado, fecha, analista y observaciones. |
| Credito | CreditoId | Proteger ciclo de vida, condiciones contractuales, saldo e historial de transiciones. |
| PlanAmortizacion | PlanAmortizacionId o identidad dentro del credito | Organizar las cuotas y asegurar invariantes globales del plan. |
| Cuota | CuotaId/numero contractual | Conservar vencimiento y componentes exigibles/pagados de cada periodo. |
| Pago | PagoId | Registrar importe recibido, clave idempotente y aplicacion por concepto. |
| Movimiento | MovimientoId | Representar un hecho financiero inmutable en el mayor. |
| CierreDiario | CierreId + fecha | Consolidar resultados diarios de manera idempotente. |
| CierreMensual | CierreId + periodo | Consolidar informacion mensual y metricas de riesgo. |
| PoliticaFinanciera | PoliticaId + version | Conservar configuracion, vigencia y autoria. |
| Reestructuracion | ReestructuracionId | Conservar autorizacion y nuevas condiciones sin borrar el historial anterior. |
| TransicionEstado | TransicionId | Conservar evidencia inmutable de cada cambio de estado. |

## 11. Objetos de valor

| Objeto de valor | Contenido/semantica | Validaciones principales |
|---|---|---|
| Dinero | importe decimal exacto y moneda | Escala, redondeo medio hacia arriba y moneda compatible. |
| Moneda | codigo monetario, inicialmente GTQ | Codigo valido; igualdad estructural. |
| Tasa | valor, periodicidad y tipo | No negativa y expresada sin punto flotante binario. |
| Plazo | cantidad de meses | Entero entre 3 y 24 para el producto actual. |
| RangoMontoCredito | minimo y maximo permitidos | Q1,000.00-Q25,000.00 para la politica/producto actual. |
| FechaCorte | fecha civil usada en calculos | Explicita, valida e independiente del reloj del sistema. |
| PeriodoVigencia | fecha inicial y final opcional | Inicio no posterior al fin; sin ambigüedad entre versiones. |
| VersionPolitica | identificador de version | No vacio e inmutable. |
| BaseConteo | convencion, por ejemplo Actual/360 | Valor reconocido por el calculo aplicable. |
| DiasAtraso | entero de dias calendario | Mayor o igual a cero. |
| TramoMora | clasificacion derivada | Debe corresponder exactamente a DiasAtraso. |
| EstadoCredito | estado principal del ciclo de vida | Solo admite valores y transiciones definidos. |
| AplicacionPago | importes por concepto y remanente | Conservacion exacta del importe recibido. |
| ClaveIdempotencia | identidad externa estable del intento | No vacia y unica dentro del alcance definido. |
| Porcentaje | razon decimal exacta | Segun uso, dentro de rango; cartera en riesgo en [0,1]. |
| Motivo | texto/codigo explicativo | Obligatorio en decisiones y transiciones relevantes. |

## 12. Agregados y limites de consistencia

| Agregado | Raiz | Miembros/controlados | Invariantes protegidas |
|---|---|---|---|
| Cliente | Cliente | Datos e identidad del cliente | Identidad unica y datos validos. |
| Solicitud de credito | SolicitudCredito | Evaluaciones y decision | Secuencia solicitud → evaluacion → aprobacion/rechazo; decision trazable. |
| Credito | Credito | Plan, cuotas, transiciones y referencia a politica contractual | Estado valido, capital no negativo, plan consistente, politica historica inmutable. |
| Pago | Pago | Aplicaciones por concepto | Idempotencia, prelacion y conservacion exacta de importes. |
| Mayor | Movimiento como entrada append-only; libro identificado conceptualmente | Secuencia de movimientos | No sobrescritura y reproduccion del saldo. |
| Cierre | CierreDiario/CierreMensual | Resultados y referencias a movimientos | Idempotencia por fecha/periodo y congelamiento sin duplicacion. |
| Catalogo de politicas | PoliticaFinanciera | Versiones y vigencias | Seleccion inequivoca de version y conservacion historica. |

Las referencias entre agregados se realizan por identidad. Pago y Movimiento permanecen separados: el pago es el hecho operativo recibido y los movimientos son sus efectos contables auditables.

## 13. Casos de uso

| ID | Caso de uso | Actor principal | Resultado exitoso |
|---|---|---|---|
| CU-01 | Registrar cliente | Asesor de credito | Cliente valido con identidad unica. |
| CU-02 | Solicitar credito | Asesor de credito/Cliente | Solicitud en estado SOLICITADO con monto y plazo validos. |
| CU-03 | Evaluar credito | Analista de credito | Evaluacion trazable asociada a la solicitud. |
| CU-04 | Aprobar solicitud | Aprobador/comite | Solicitud aprobada con decision y condiciones. |
| CU-05 | Rechazar solicitud | Aprobador/comite | Solicitud rechazada con motivo. |
| CU-06 | Desembolsar credito | Encargado de desembolsos | Credito desembolsado con politica contractual y plan. |
| CU-07 | Registrar pago | Cajero/gestor de cobros | Pago aplicado por prelacion, saldo actualizado y movimientos emitidos una sola vez. |
| CU-08 | Calcular mora | Gestor de cartera/proceso | Dias, tramo y moratorio por cuota a fecha de corte. |
| CU-09 | Regularizar credito | Gestor de cobros | Todo lo vencido cubierto y credito nuevamente VIGENTE. |
| CU-10 | Reestructurar credito | Aprobador autorizado | Condiciones reestructuradas con historial preservado. |
| CU-11 | Declarar credito incobrable | Encargado autorizado | Salida contable irreversible y exclusion de cartera activa. |
| CU-12 | Generar cierre diario | Encargado financiero/proceso | Cierre diario unico y reproducible. |
| CU-13 | Generar cierre mensual | Encargado financiero/proceso | Consolidado mensual unico con metricas y provisiones. |
| CU-14 | Consultar cartera en riesgo | Gestor de riesgo/encargado financiero | Razon y composicion del riesgo a una fecha de corte. |
| CU-15 | Consultar credito e historial | Asesor/auditor/gestor | Vista trazable de condiciones, pagos, movimientos y transiciones. |
| CU-16 | Administrar politica financiera | Administrador de politicas | Nueva version valida, fechada y atribuida, sin alterar creditos previos. |
| CU-17 | Anular credito aprobado | Aprobador/proceso de expiracion | Credito aprobado pasa a ANULADO con motivo, sin desembolso. |
| CU-18 | Cancelar credito | Sistema por resultado del pago | Credito con saldo cero pasa a CANCELADO. |

## 14. Estados del credito y transiciones permitidas

### 14.1 Estados principales

| Estado | Significado | ¿Terminal? |
|---|---|---|
| SOLICITADO | Solicitud creada y pendiente de decision. | No |
| APROBADO | Solicitud autorizada, aun no desembolsada. | No |
| RECHAZADO | Solicitud denegada. | Si |
| DESEMBOLSADO | Desembolso ejecutado; estado explicito previo a activacion operativa. | Transitorio |
| VIGENTE | Credito activo sin obligacion vencida pendiente. | No |
| EN_MORA | Credito activo con obligacion vencida pendiente. | No |
| REESTRUCTURADO | Credito con nuevas condiciones autorizadas y seguimiento especial. | No |
| ANULADO | Aprobacion terminada por desistimiento o expiracion sin desembolso. | Si |
| CANCELADO | Credito pagado totalmente. | Si |
| INCOBRABLE | Credito retirado de cartera activa como salida contable. | Si para el ciclo crediticio |

Mora 1, Mora 2, Mora 3 y Vencido no son estados. Son valores derivados de `DiasAtraso`; durante esos tramos el estado principal es EN_MORA. La eventual recuperacion de efectivo de un credito INCOBRABLE se registra contablemente, pero no reactiva el credito.

### 14.2 Tabla de transiciones

| Estado origen | Evento/condicion | Estado destino | Guarda/efecto esencial |
|---|---|---|---|
| SOLICITADO | aprobar | APROBADO | Evaluacion concluida y aprobacion autorizada. |
| SOLICITADO | rechazar | RECHAZADO | Decision autorizada y motivo obligatorio. |
| APROBADO | desembolsar | DESEMBOLSADO | Aprobacion vigente, politica fijada y desembolso unico. |
| DESEMBOLSADO | activar | VIGENTE | Plan generado y saldo inicial reconocido. |
| APROBADO | desistir o expirar | ANULADO | No existe desembolso. |
| VIGENTE | detectar cuota impagada | EN_MORA | Dias de atraso mayores que cero y obligacion vencida pendiente. |
| VIGENTE | pagar saldo total | CANCELADO | Saldo de capital y obligaciones exigibles igual a cero. |
| EN_MORA | pago parcial | EN_MORA | Permanece obligacion vencida pendiente. |
| EN_MORA | pagar todo lo vencido | VIGENTE | Dias de atraso efectivos vuelven a cero; puede reactivarse devengo. |
| EN_MORA | reestructurar | REESTRUCTURADO | Autorizacion y condiciones nuevas conservando historial. |
| REESTRUCTURADO | detectar nuevo atraso | EN_MORA | Nueva obligacion reestructurada queda vencida. |
| REESTRUCTURADO | pagar ultima cuota/saldo | CANCELADO | Todas las obligaciones quedan en cero. |
| EN_MORA | superar 120 dias y declarar incobrable | INCOBRABLE | Salida contable autorizada; se suspende ciclo activo. |

Toda transicion no incluida es invalida. En particular, no se aceptan pagos en SOLICITADO ni RECHAZADO, y no existen transiciones de salida desde CANCELADO, RECHAZADO, ANULADO o INCOBRABLE dentro del ciclo del credito.

## 15. Modulos y contextos delimitados

| Contexto/modulo | Responsabilidad | Conceptos principales | Dependencias conceptuales permitidas |
|---|---|---|---|
| Originacion | Cliente, solicitud, evaluacion, decision y desembolso. | Cliente, SolicitudCredito, EvaluacionCredito | Usa politicas y solicita creacion/activacion del credito. |
| Calculo financiero | Calculos exactos y puros de dinero, tasas, amortizacion, interes corriente y moratorio. | Dinero, Tasa, PlanAmortizacion, Cuota | No depende de originacion, cobros, cierres ni infraestructura. |
| Cartera y cobros | Ciclo del credito, pagos, prelacion, saldos, mora, clasificacion y reestructuracion. | Credito, Pago, AplicacionPago, EstadoCredito, TramoMora | Usa calculo financiero y politicas mediante abstracciones. |
| Cierres y riesgo | Mayor, cierres diarios/mensuales, cartera en riesgo, provisiones y salida incobrable. | Movimiento, Cierre, Porcentaje | Consulta hechos de originacion/cartera y usa fecha de corte. |
| Politicas institucionales | Versionado, vigencia y seleccion de reglas configurables. | PoliticaFinanciera, PeriodoVigencia | Es consumido por los demas modulos sin incrustar tasas. |
| Contratos | Esquemas externos futuros y traduccion de entradas/salidas. | DTO/esquemas, errores uniformes | Invoca casos de uso; no contiene reglas financieras. |
| Puertos de aplicacion | Casos de uso independientes del canal y abstracciones externas. | DesembolsarCredito, RegistrarPago, GenerarCierre, ConsultarCarteraEnRiesgo, Reloj | Depende del dominio; infraestructura futura implementara puertos secundarios. |

## 16. Matriz de trazabilidad de Fase 1

La columna de prueba expresa la validacion prevista para fases de implementacion. `Documental` significa que el cumplimiento se verifica por revision de modelos o documentacion y no requiere por si solo una prueba unitaria.

| ID | Requisito | Tipo | Regla asociada | Caso de uso | Clase/Modulo | Prueba cuando corresponda |
|---|---|---|---|---|---|---|
| RF-01 | Registrar cliente unico | Funcional | Identidad valida | CU-01 | Cliente / Originacion | Registro valido y duplicado rechazado |
| RF-02 | Solicitar monto y plazo validos | Funcional | RN-01, RN-02 | CU-02 | SolicitudCredito / Originacion | Limites inclusivos y valores fuera de rango |
| RF-03 | Evaluacion trazable | Funcional | POL-05 | CU-03 | EvaluacionCredito / Originacion | Conserva criterios, fecha y autor |
| RF-04 | Aprobar o rechazar con evidencia | Funcional | INV-15, POL-06 | CU-04, CU-05 | SolicitudCredito / Originacion | Transiciones y motivo obligatorio |
| RF-05 | Desembolsar solo lo aprobado | Funcional | RN-21, RN-30 | CU-06 | Credito / Originacion | Rechaza desembolso desde estado invalido |
| RF-06 | Plan frances con ajuste final | Funcional | RN-05-RN-09 | CU-06 | PlanAmortizacion / Calculo financiero | Caso Q10,000, 36%, 12 meses; 12 filas completas |
| RF-07 | Admitir pagos parciales/exactos/excedentes | Funcional | RN-19, RN-20 | CU-07 | Pago / Cartera y cobros | Escenarios Q500, Q1,011.88 y Q3,000 |
| RF-08 | Aplicar prelacion obligatoria | Funcional | RN-18 | CU-07 | AplicacionPago / Cartera y cobros | Gastos → mora → corriente → capital |
| RF-09 | Conservar y procesar excedente | Funcional | RN-20, INV-13 | CU-07 | PoliticaExcedente / Cartera y cobros | Excedente Q1,988.12 integro |
| RF-10 | Pago idempotente | Funcional | INV-08 | CU-07 | Pago, ClaveIdempotencia / Cartera y cobros | Repeticion no cambia saldo ni movimientos |
| RF-11 | Calcular dias calendario | Funcional | RN-10 | CU-08 | DiasAtraso, Reloj / Calculo financiero | Fechas limite y fecha de corte inyectada |
| RF-12 | Clasificar mora | Funcional | RN-11, RN-12 | CU-08 | TramoMora / Cartera y cobros | 0, 1, 30, 31, 60, 61, 90, 91, 120 y 121 dias |
| RF-13 | Moratorio por cuota y capital | Funcional | RN-13-RN-16 | CU-08 | CalculadoraMora / Calculo financiero | Q725.76, 24%, Actual/360, 15 dias = Q7.26 |
| RF-14 | Suspender/reactivar devengo | Funcional | RN-17, POL-12 | CU-08, CU-09 | Credito / Cartera y cobros | Suspende >90; reactiva al regularizar |
| RF-15 | Proteger ciclo de vida | Funcional | RN-21-RN-25 | CU-04-CU-11, CU-17, CU-18 | Credito, EstadoCredito / Cartera y cobros | Toda transicion valida e invalida relevante |
| RF-16 | Historial inalterable | Funcional | INV-15 | CU-15 | TransicionEstado / Cartera y cobros | Orden y campos completos; sin eliminacion |
| RF-17 | Deterioro y recuperacion | Funcional | RN-22-RN-25 | CU-09-CU-11, CU-18 | Credito / Cartera y cobros | EN_MORA→VIGENTE; parcial; reestructura; cancela |
| RF-18 | Calcular cartera en riesgo | Funcional | RN-26, RN-27 | CU-14 | Cartera / Cierres y riesgo | Q56,000/Q800,000 = 7.00% |
| RF-19 | Excluir incobrables | Funcional | RN-25, RN-28 | CU-11, CU-14 | Cartera, Credito / Cierres y riesgo | Q48,000/Q792,000 = 6.06%; no reactivacion |
| RF-20 | Cierre diario completo | Funcional | RN-31, RN-32 | CU-12 | CierreDiario / Cierres y riesgo | Incluye desembolsos, cobros, devengo, mora y saldo |
| RF-21 | Cierre mensual completo | Funcional | RN-31, RN-32, POL-08 | CU-13 | CierreMensual / Cierres y riesgo | Consolida campos exigidos y provisiones versionadas |
| RF-22 | Cierre idempotente | Funcional | INV-17, RN-31 | CU-12, CU-13 | Cierre / Cierres y riesgo | Doble ejecucion no duplica movimientos |
| RF-23 | Mayor append-only | Funcional | INV-07, RN-32 | CU-12, CU-13 | Movimiento / Cierres y riesgo | Movimientos reproducen saldo; correccion compensatoria |
| RF-24 | Consultar detalle e historial | Funcional | RNF-04 | CU-15 | Credito / Cartera y cobros | Consulta integra plan, pagos y transiciones |
| RF-25 | Versionar politicas | Funcional | RN-29 | CU-16 | PoliticaFinanciera / Politicas | Seleccion por vigencia sin ambigüedad |
| RF-26 | Conservar politica contractual | Funcional | RN-30, INV-18 | CU-06, CU-15 | Credito / Politicas | Nueva version no altera credito existente |
| RNF-01 | Exactitud monetaria | No funcional | RN-03, RN-04 | CU-06-CU-14 | Dinero / Calculo financiero | Operaciones decimales y redondeo medio hacia arriba |
| RNF-02 | Determinismo | No funcional | RN-10, RN-29 | Todos los calculos | Calculo financiero, Reloj | Mismas entradas producen resultado identico |
| RNF-03 | Reproducibilidad | No funcional | RN-30-RN-32 | CU-12-CU-15 | Mayor, Politicas / Cierres | Reconstruccion desde hechos conservados |
| RNF-04 | Auditabilidad | No funcional | INV-15, RN-32 | CU-03-CU-16 | TransicionEstado, Movimiento, Cierre | Evidencia completa y ordenada |
| RNF-05 | Trazabilidad | No funcional | Matriz de trazabilidad | Todos | Todos los modulos | Revision documental y cobertura por ID |
| RNF-06 | Integridad append-only | No funcional | RN-32 | CU-12, CU-13, CU-15 | Movimiento / Cierres | No sobrescritura; ajustes compensatorios |
| RNF-07 | Idempotencia | No funcional | INV-08, INV-17 | CU-07, CU-12, CU-13 | Pago, Cierre | Reintentos sin doble efecto |
| RNF-08 | Mantenibilidad | No funcional | Separacion de contextos | Todos | Monolito modular conceptual | Revision de dependencias y responsabilidades |
| RNF-09 | Modificabilidad | No funcional | RN-29, POL-01-POL-12 | CU-06-CU-16 | Politicas institucionales | Cambiar estrategia sin alterar calculo consumidor |
| RNF-10 | Testabilidad | No funcional | Fecha de corte explicita | Todos | Puertos, Reloj, Calculo financiero | Dobles de reloj/repositorio; funciones puras |
| RNF-11 | Confiabilidad | No funcional | INV-01-INV-18 | Todos | Dominio completo | Suite de invariantes y fallos sin efecto parcial |
| RNF-12 | Interoperabilidad futura | No funcional | Casos de uso independientes | Todos | Puertos de aplicacion / Contratos | Revision documental en arquitectura y contratos |
| RNF-13 | Seguridad conceptual | No funcional | Autoria y minimo privilegio futuro | CU-03-CU-16 | Casos de uso / Contratos | Revision documental; autorizacion fuera de P1 |
| RNF-14 | Portabilidad | No funcional | Node.js 20+ sin externos | Casos ejecutables | Proyecto/nucleo | `npm install` y `npm test` sin servicios |
| RNF-15 | Tipado estricto | No funcional | Sin `any` evasivo | Casos ejecutables | TypeScript / Dominio | Compilacion `strict` y revision estatica |
| RNF-16 | Independencia de infraestructura | No funcional | Restricciones de alcance | Todos | Dominio y puertos | Ausencia de HTTP, BD, ORM, frontend, RAG y MCP |
| INV-01 | Amortizaciones suman capital | Invariante | RN-09 | CU-06 | PlanAmortizacion | Suma exacta del caso de referencia y casos de borde |
| INV-02 | Saldo final cero | Invariante | RN-08, RN-09 | CU-06 | PlanAmortizacion | ultima fila termina Q0.00 |
| INV-03 | Capital nunca negativo | Invariante | RN-08, RN-20 | CU-07 | Credito, Cuota | Pagos y excedentes no producen saldo negativo |
| INV-04 | Solicitado no admite pago | Invariante | RN-21 | CU-07 | Credito, EstadoCredito | Operacion rechazada sin movimientos |
| INV-05 | Rechazado no admite pago | Invariante | RN-21 | CU-07 | Credito, EstadoCredito | Operacion rechazada sin movimientos |
| INV-06 | Riesgo en [0,1] | Invariante | RN-26, POL-11 | CU-14 | Cartera, Porcentaje | Extremos y cartera activa cero |
| INV-07 | Mayor reproduce saldo | Invariante | RN-32 | CU-12-CU-15 | Movimiento / Cierres | Suma de movimientos igual al saldo |
| INV-08 | Pago duplicado sin efecto | Invariante | RF-10 | CU-07 | Pago / Cartera y cobros | Misma clave retorna resultado previo |
| INV-09 | Mora regularizada vuelve vigente | Invariante | RN-22 | CU-09 | Credito, EstadoCredito | EN_MORA→VIGENTE con atraso cero |
| INV-10 | Tramo coincide con dias | Invariante | RN-11 | CU-08 | TramoMora | Pruebas de todos los limites |
| INV-11 | Sin interes sobre interes | Invariante | RN-14 | CU-08 | CalculadoraMora | Base solo capital vencido |
| INV-12 | Pago conserva importe | Invariante | RN-18 | CU-07 | AplicacionPago | Aplicado + remanente = recibido |
| INV-13 | Excedente no se pierde | Invariante | RN-20 | CU-07 | PoliticaExcedente | Escenario Q3,000 conserva Q1,988.12 |
| INV-14 | Moneda homogenea | Invariante | RN-03 | CU-06, CU-07 | Dinero, Credito | Mezcla de monedas rechazada |
| INV-15 | Transicion auditable | Invariante | RF-16 | CU-04-CU-11, CU-17, CU-18 | Cinco datos obligatorios por transicion |
| INV-16 | Incobrable irreversible | Invariante | RN-25 | CU-11 | Credito, EstadoCredito | Recuperacion no cambia estado |
| INV-17 | Cierre repetido sin duplicacion | Invariante | RN-31 | CU-12, CU-13 | Cierre | Misma identidad conserva movimientos |
| INV-18 | Politica no cambia retroactivamente | Invariante | RN-30 | CU-06, CU-16 | Credito, PoliticaFinanciera | Nueva version no cambia plan previo |

## 17. Casos financieros de aceptacion ya establecidos

Estos casos se registran ahora como criterios de aceptacion y se implementaran en las fases de codigo correspondientes.

| ID | Caso | Resultado exigido |
|---|---|---|
| CA-01 | Q10,000.00, TNA 36%, tasa mensual 3%, 12 meses | Cuotas 1-11 Q1,004.62; cuota 12 Q1,004.63; pagos Q12,055.45; intereses Q2,055.45; amortizacion Q10,000.00; saldo Q0.00; validar 12 filas. |
| CA-02 | Capital vencido Q725.76, TNA moratoria 24%, Actual/360, 15 dias | Interes moratorio Q7.26. |
| CA-03 | Pago exacto Q1,011.88 | Q0.00 gastos, Q7.26 moratorio, Q278.86 corriente, Q725.76 capital, Q0.00 remanente. |
| CA-04 | Pago parcial Q500.00 | Q0.00 gastos, Q7.26 moratorio, Q278.86 corriente, Q213.88 capital; Q511.88 de capital pendiente. |
| CA-05 | Pago Q3,000.00 | Saldar Q1,011.88 y conservar/procesar Q1,988.12 de excedente. |
| CA-06 | Cartera Q800,000.00; riesgo Q56,000.00 | 7.00%. |
| CA-07 | Tras declarar C-005 incobrable: cartera Q792,000.00; riesgo Q48,000.00 | 6.06%. |

## 18. Supuestos controlados y decisiones pendientes

No se inventan reglas para cerrar vacios del enunciado. Los siguientes puntos deben resolverse o formalizarse en las fases indicadas sin bloquear el analisis actual:

| ID | Punto pendiente | Tratamiento provisional | Fase de resolucion prevista |
|---|---|---|---|
| DP-01 | Datos obligatorios e identificador legal del cliente | Se reconoce identidad unica sin fijar DPI/NIT ni campos personales. | Contratos/Zod |
| DP-02 | Inclusividad exacta del dia de vencimiento al contar atraso | Cero dias mientras no haya pasado el vencimiento; se formalizara con ejemplos de fechas. | Reglas/mora |
| DP-03 | Calendario y ajuste de vencimientos en fines de semana/feriados | Se modela como politica; no se elige convencion todavia. | Reglas/politicas |
| DP-04 | Conversion de TNA corriente y otras clases de tasa | Solo TNA/12 esta fijada por el enunciado; demas tipos requeriran estrategia explicita. | Reglas/politicas |
| DP-05 | Alcance de unicidad de Idempotency-Key | Se propone por operacion/canal institucional, sujeto al contrato definitivo. | OpenAPI/Zod |
| DP-06 | Tratamiento contable de recuperaciones posteriores a incobrable | No reactiva el credito; cuentas/movimientos especificos quedan por definir. | Cierres/arquitectura |
| DP-07 | Convencion de cartera activa cero | Debe ser politica explicita para preservar [0,1], sin decidir aun si reporta 0 o “sin cartera”. | Cartera en riesgo |
| DP-08 | Tasas concretas de provision | Configurables y versionadas; no provistas por el enunciado. | Politicas/cierres |
| DP-09 | Gastos y comisiones concretos | Se admite Q0.00 en los casos de referencia; catalogo no definido. | Politicas/prelacion |
| DP-10 | Momento exacto DESEMBOLSADO→VIGENTE | Se considera transicion explicita tras reconocer el plan y saldo; se precisara en el modelo de estados. | UML/State |

## 19. Validacion de la Fase 1 contra el enunciado

| Exigencia de Fase 1 | Evidencia | Estado |
|---|---|---|
| Identificar actores | Seccion 4 | Cumplida |
| Identificar requisitos funcionales | Seccion 5, RF-01-RF-26 | Cumplida |
| Identificar requisitos no funcionales | Seccion 6, RNF-01-RNF-16 | Cumplida |
| Identificar reglas financieras | Seccion 7, RN-01-RN-32 | Cumplida |
| Identificar invariantes | Seccion 8, INV-01-INV-18 | Cumplida |
| Identificar politicas configurables | Seccion 9, POL-01-POL-12 | Cumplida |
| Identificar entidades | Seccion 10 | Cumplida |
| Identificar objetos de valor | Seccion 11 | Cumplida |
| Identificar agregados | Seccion 12 | Cumplida |
| Identificar casos de uso minimos | Seccion 13, CU-01-CU-18 | Cumplida |
| Identificar estados del credito | Seccion 14 | Cumplida |
| Identificar modulos/contextos | Seccion 15 | Cumplida |
| Generar tabla exigida | Seccion 16 | Cumplida |
| Mantener trazabilidad a prueba | Seccion 16 | Cumplida como linea base; se actualizara al crear pruebas |
| No escribir codigo de fases posteriores | Solo se creo documentacion de analisis | Cumplida |

## 20. Resultado esperado

Esta linea base permite que el modelo conceptual, UML, arquitectura, codigo, pruebas y contratos posteriores usen los mismos terminos, reglas e identificadores. En fases posteriores, la matriz se ampliara de forma incremental con artefactos concretos de diseño, rutas de codigo, pruebas y documentos, sin cambiar retroactivamente una regla sin registrar la decision.
