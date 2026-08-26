# Fase 3 — Reglas y politicas financieras

## 1. Objetivo y alcance

Formalizar las reglas financieras del Sistema de Gestion de Microcredito y separar:

- las invariantes que ninguna configuracion puede violar;
- las politicas institucionales que pueden cambiar prospectivamente;
- las convenciones de calculo necesarias para producir resultados exactos y reproducibles;
- la evidencia que debe conservarse para reconstruir cualquier calculo historico.

Esta fase especifica comportamiento. No implementa TypeScript, UML, infraestructura, API ni persistencia.

## 2. Requisitos cubiertos

| Grupo | Identificadores cubiertos |
|---|---|
| Requisitos funcionales | RF-02, RF-04–RF-23, RF-25, RF-26 |
| Requisitos no funcionales | RNF-01–RNF-11, RNF-16 |
| Reglas de negocio | RN-01–RN-32 |
| Invariantes | INV-01–INV-18 |
| Politicas | POL-01–POL-12 |
| Casos de aceptacion | CA-01–CA-07 |

## 3. Clasificacion normativa

### 3.1 Invariantes no configurables

Una politica institucional no puede desactivar ni alterar estas reglas:

| ID | Regla no configurable | Motivo |
|---|---|---|
| INF-01 | No mezclar monedas en una operacion financiera. | Evita resultados sin significado economico. |
| INF-02 | No usar punto flotante binario para importes ni tasas financieras. | Protege exactitud y reproducibilidad. |
| INF-03 | Redondear importes monetarios a dos decimales mediante medio hacia arriba. | Convencion contractual del proyecto. |
| INF-04 | La suma de amortizaciones debe ser exactamente el capital desembolsado. | Conservacion del principal. |
| INF-05 | El saldo final del plan debe ser exactamente cero y el capital nunca negativo. | Integridad del credito. |
| INF-06 | El moratorio se calcula unicamente sobre capital vencido; nunca sobre intereses ni cargos. | Prohibe interes sobre interes. |
| INF-07 | El orden de aplicacion es gastos/comisiones, moratorio, corriente y capital. | Prelacion obligatoria del enunciado. |
| INF-08 | Un pago insuficiente se acepta y un excedente nunca se pierde. | Conservacion integra del efectivo recibido. |
| INF-09 | Los tramos son derivados de los dias de atraso, no estados del credito. | Mantiene coherencia del ciclo de vida. |
| INF-10 | Un credito incobrable sale de cartera activa y no se reactiva. | Irreversibilidad de la salida contable. |
| INF-11 | Pagos y cierres son idempotentes. | Evita doble afectacion por reintentos. |
| INF-12 | El mayor es append-only y sus movimientos reproducen los saldos. | Auditabilidad financiera. |
| INF-13 | Una nueva politica no modifica retroactivamente un credito otorgado. | Conservacion de condiciones contractuales. |
| INF-14 | Toda fecha usada en un calculo procede de una entrada o puerto `Reloj`; no se consulta implicitamente la fecha del sistema. | Determinismo temporal. |

### 3.2 Politicas configurables

Una politica puede cambiar sin reescribir el algoritmo, pero toda version debe respetar las invariantes anteriores. Son configurables:

- tasas de interes corriente y moratorio;
- tipo y periodicidad de la tasa;
- base de conteo admitida;
- criterios y facultades de aprobacion;
- periodo de expiracion de una aprobacion;
- gastos y comisiones autorizados;
- tratamiento del excedente;
- calendario y ajuste de vencimientos;
- criterios de reestructuracion;
- porcentajes de provision;
- condicion de reactivacion del devengo;
- representacion del indicador cuando no existe cartera activa.

## 4. Contrato comun de una politica versionada

### 4.1 Identidad y metadatos obligatorios

| Campo | Significado | Restriccion |
|---|---|---|
| `politicaId` | Identifica la familia de politica. | Inmutable y no vacio. |
| `version` | Identifica una revision dentro de la familia. | Inmutable y unica para `politicaId`. |
| `tipo` | Proposito de la politica. | Valor conocido: tasa corriente, moratoria, excedente, etc. |
| `vigenteDesde` | Primer instante/fecha de aplicabilidad. | Obligatorio. |
| `vigenteHasta` | ultimo instante/fecha de aplicabilidad. | Opcional; no anterior al inicio. |
| `estado` | Borrador, activa, retirada o reemplazada. | Solo una version activa puede cubrir un momento dado por ambito. |
| `autor` | Usuario/proceso responsable. | Obligatorio. |
| `fechaCreacion` | Momento de creacion de la version. | Obligatorio e inmutable. |
| `motivo` | Razon del alta o cambio. | Obligatorio al activar/reemplazar. |
| `parametros` | Configuracion especifica, tipada segun politica. | Validada antes de activacion. |
| `huella` | Identificador reproducible del contenido. | Permite verificar que la version no fue alterada. |

### 4.2 Semantica del intervalo de vigencia

Se adopta un intervalo semiabierto: `[vigenteDesde, vigenteHasta)`. La fecha/hora inicial esta incluida y la final esta excluida. Si `vigenteHasta` no existe, la version permanece abierta.

Esto permite reemplazar una politica exactamente en el comienzo de otra sin que ambas resulten vigentes simultaneamente.

### 4.3 Seleccion determinista

La seleccion recibe:

- tipo de politica;
- ambito institucional o producto;
- fecha efectiva explicita;
- atributos necesarios para discriminar el producto.

El resultado debe ser exactamente una version activa cuyo intervalo contenga la fecha efectiva. Cero coincidencias produce `PoliticaNoEncontrada`; mas de una produce `VigenciasDePoliticaSuperpuestas`. Ninguno de los dos casos permite continuar con un valor por defecto silencioso.

### 4.4 Conservacion historica

Al otorgarse un credito se conserva una referencia inmutable a cada politica contractual aplicable y una instantanea verificable de sus parametros esenciales. La referencia preserva trazabilidad; la instantanea evita que una alteracion externa cambie el resultado historico.

Una correccion se realiza publicando una nueva version prospectiva. No se edita una version que ya fue utilizada por un credito, pago o cierre.

## 5. Politica de tasa de interes corriente

### 5.1 Datos especificos

| Campo | Descripcion |
|---|---|
| tasa | Decimal exacto, expresado como razon; 36% se representa conceptualmente como `0.36`. |
| tipoTasa | TNA nominal u otro tipo admitido explicitamente. |
| periodicidadCapitalizacion | Mensual para el caso de referencia. |
| baseConteo | Convencion aplicable cuando el calculo dependa de dias. |
| metodoAmortizacion | Francesa para el producto actual. |
| reglaRedondeo | Dos decimales, medio hacia arriba. |

### 5.2 Conversion obligatoria del caso TNA

Para una TNA nominal con periodicidad mensual:

`tasaMensual = TNA / 12`

Ejemplo contractual:

`0.36 / 12 = 0.03`

No se interpreta una TNA como tasa efectiva anual. Incorporar otra clase de tasa requerira una estrategia distinta con conversion explicita, nunca una rama silenciosa o una reutilizacion aproximada.

### 5.3 Devengo corriente

El interes de una cuota del plan frances es:

`interesPeriodo = redondear(saldoAnterior x tasaMensual)`

El devengo usa saldo de capital, tasa contractual y periodo correspondiente. Despues de 90 dias de atraso se suspende el devengo de interes corriente. La suspension comienza cuando `diasAtraso > 90`; con exactamente 90 dias todavia no se activa esta regla.

La reactivacion solo puede ocurrir cuando:

- el credito no es INCOBRABLE;
- se pago todo lo vencido;
- los dias de atraso efectivos son cero;
- la politica de reactivacion lo autoriza y deja evidencia.

La reactivacion no acumula retroactivamente interes corriente por el periodo suspendido salvo que una politica contractual futura lo definiera expresamente y fuera juridicamente valida; esa funcionalidad no se presume en Proyecto 1.

## 6. Politica de amortizacion francesa

### 6.1 Entradas

| Entrada | Restriccion |
|---|---|
| Capital `P` | `Dinero` positivo; para el producto actual entre Q1,000.00 y Q25,000.00. |
| Tasa mensual `i` | Decimal exacto mayor o igual que cero. |
| Numero de cuotas `n` | Entero entre 3 y 24. |
| Fecha inicial/calendario | Explicitos y reproducibles. |
| Politica contractual | Version vigente en la fecha de otorgamiento. |

### 6.2 Formula

Si `i > 0`:

`cuota = P x [i(1+i)^n / ((1+i)^n - 1)]`

Si `i = 0`:

`cuota = P / n`

La cuota normal se redondea a dos decimales con medio hacia arriba.

### 6.3 Calculo por periodo

Para las primeras `n - 1` cuotas:

1. `interes = redondear(saldoAnterior x i)`.
2. `amortizacion = cuotaNormal - interes`.
3. `saldo = saldoAnterior - amortizacion`.

Para la cuota `n`:

1. `interesFinal = redondear(saldoAnterior x i)`.
2. `amortizacionFinal = saldoAnterior`.
3. `cuotaFinal = amortizacionFinal + interesFinal`.
4. `saldoFinal = Q0.00` exactamente.

No se distribuye la diferencia de redondeo entre cuotas anteriores; el ajuste se concentra obligatoriamente en la ultima cuota.

### 6.4 Caso de aceptacion CA-01

| Dato | Valor obligatorio |
|---|---:|
| Capital | Q10,000.00 |
| TNA nominal | 36% |
| Tasa mensual | 3% |
| Plazo | 12 meses |
| Cuotas 1–11 | Q1,004.62 cada una |
| Cuota 12 | Q1,004.63 |
| Total de pagos | Q12,055.45 |
| Total de intereses | Q2,055.45 |
| Total de amortizacion | Q10,000.00 |
| Saldo final | Q0.00 |

La prueba futura debe comparar las 12 filas completas y no solo los totales.

## 7. Politica de fechas y dias de atraso

### 7.1 Fecha civil e inyeccion

Los vencimientos y fechas de corte se modelan como fechas civiles, sin hora, para evitar que zona horaria u horario de verano alteren dias de atraso. Los casos de uso reciben una `FechaCorte` o la obtienen de un puerto `Reloj` inyectado.

### 7.2 Convencion de conteo

Se formaliza la convencion pendiente DP-02:

`diasAtraso = max(0, diferenciaDiasCalendario(fechaCorte, fechaVencimiento))`

- En la propia fecha de vencimiento: 0 dias.
- El dia calendario siguiente: 1 dia.
- No se cuentan horas parciales.
- Una fecha de corte anterior al vencimiento produce 0, no un valor negativo.

Ejemplo: vencimiento 10 de abril y corte 25 de abril producen 15 dias de atraso.

### 7.3 Calendario de vencimientos

El ajuste por dia no habil permanece como POL-10 porque el enunciado no establece una convencion. Hasta que la institucion defina calendario y regla, el nucleo usara las fechas contractuales explicitas recibidas/generadas y no movera silenciosamente un vencimiento.

Cuando exista ajuste, la fecha contractual ajustada debera conservarse en el plan y sera la unica base para calcular atraso.

## 8. Clasificacion de mora

| Dias de atraso | Tramo derivado | Estado principal mientras exista vencido |
|---:|---|---|
| 0 | SIN_MORA | VIGENTE o REESTRUCTURADO, segun historia |
| 1–30 | MORA_1 | EN_MORA |
| 31–60 | MORA_2 | EN_MORA |
| 61–90 | MORA_3 | EN_MORA |
| 91–120 | VENCIDO | EN_MORA |
| >120 | INCOBRABLE | EN_MORA hasta la declaracion autorizada; despues, estado INCOBRABLE |

`INCOBRABLE` aparece como nombre de la clasificacion para mas de 120 dias y tambien como estado contable despues de la declaracion. No son el mismo hecho: superar 120 dias hace al credito elegible; la transicion de estado requiere el acto autorizado de declaracion. Esta distincion evita que una consulta temporal ejecute por si sola una salida contable.

Para un credito con varias cuotas vencidas, los moratorios se calculan por cuota. El tramo general del credito se deriva del mayor numero de dias de atraso entre sus obligaciones vencidas pendientes.

## 9. Politica de interes moratorio

### 9.1 Datos especificos

| Campo | Descripcion |
|---|---|
| TNA moratoria | Decimal exacto y no negativo. |
| Base de conteo | Actual/360 para el caso de referencia. |
| Vigencia | Intervalo semiabierto comun a politicas. |
| Autor y version | Obligatorios. |

### 9.2 Formula Actual/360

`tasaMoratoriaDiaria = TNA_moratoria / 360`

Por cada cuota vencida:

`moratorioCuota = redondear(capitalVencidoCuota x tasaMoratoriaDiaria x diasAtrasoCuota)`

El calculo recibe la fecha de corte y se reproduce independientemente para cada cuota. La base excluye:

- interes corriente vencido;
- interes moratorio acumulado;
- gastos y comisiones;
- capital futuro que todavia no vencio.

### 9.3 Caso de aceptacion CA-02

`Q725.76 x (0.24 / 360) x 15 = Q7.2576`, que redondeado a dos decimales mediante medio hacia arriba produce `Q7.26`.

## 10. Politica de prelacion de pagos

### 10.1 Orden invariable

Todo pago se aplica secuencialmente:

1. gastos/comisiones exigibles;
2. interes moratorio exigible;
3. interes corriente exigible;
4. capital exigible.

Cada etapa consume `min(remanente, pendienteConcepto)` y entrega el nuevo remanente a la siguiente. Ningun concepto puede quedar con saldo negativo.

La implementacion posterior usara Chain of Responsibility, pero esta fase fija la regla sin adelantar el diseño UML.

### 10.2 Conservacion

Para todo pago:

`pagoRecibido = aplicadoGastos + aplicadoMoratorio + aplicadoCorriente + aplicadoCapital + excedente`

Todos los terminos tienen la misma moneda. La igualdad debe ser exacta a centavos.

### 10.3 Casos de aceptacion

| Caso | Pago | Gastos | Moratorio | Corriente | Capital | Excedente/capital pendiente |
|---|---:|---:|---:|---:|---:|---:|
| CA-03 Exacto | Q1,011.88 | Q0.00 | Q7.26 | Q278.86 | Q725.76 | Q0.00 excedente |
| CA-04 Parcial | Q500.00 | Q0.00 | Q7.26 | Q278.86 | Q213.88 | Q511.88 capital pendiente |
| CA-05 Excedente | Q3,000.00 | Q0.00 | Q7.26 | Q278.86 | Q725.76 | Q1,988.12 excedente |

## 11. Politica de tratamiento del excedente

### 11.1 Estrategias admitidas

| Estrategia | Efecto | Ventaja | Trade-off |
|---|---|---|---|
| Amortizacion directa a capital | Reduce inmediatamente el saldo no vencido. | Reduce exposicion y costo financiero futuro; es simple de auditar. | Puede exigir recalcular plazo o cuotas segun contrato. |
| Pago anticipado de cuotas futuras | Reserva/aplica el importe a vencimientos posteriores. | Mantiene el saldo contractual segun el calendario original. | Es mas complejo y puede no reducir interes futuro de la misma manera. |

### 11.2 Decision preferida

Se adopta como politica predeterminada institucional para el diseño **amortizacion directa a capital**, porque reduce el riesgo, el saldo expuesto y el costo financiero del cliente. No esta incrustada en el algoritmo: el credito conserva la version de la politica utilizada y otra institucion o producto puede elegir pago anticipado de cuotas.

La politica debe definir ademas que se mantiene constante despues de amortizar anticipadamente:

- cuota y reduccion de plazo; o
- plazo y recalculo de cuota.

El enunciado no decide entre ambas. En Proyecto 1, el excedente se conserva y se aplica a capital; cualquier regeneracion del plan debe quedar explicita, versionada y auditada antes de implementarse. No se inventara una de esas dos modalidades.

## 12. Politicas de cartera en riesgo y provisiones

### 12.1 Cartera activa

Es la suma del saldo completo de capital de creditos que permanecen en el ciclo activo. Excluye creditos cuyo estado sea INCOBRABLE. No se limita a capital actualmente vencido.

### 12.2 Capital en riesgo

Incluye el saldo completo de capital de:

- creditos con mas de 30 dias de atraso; y
- creditos REESTRUCTURADOS, incluso si estan al dia.

Un credito que cumple ambas condiciones se suma una sola vez.

### 12.3 Razon

Si la cartera activa es positiva:

`carteraRiesgo = capitalEnRiesgo / carteraActiva`

El resultado pertenece a `[0,1]` y se presenta porcentualmente con dos decimales cuando sea necesario.

Cuando la cartera activa es cero, no existe una razon matematica definida. Se resuelve DP-07 adoptando un resultado de dominio explicito `SIN_CARTERA_ACTIVA`, en lugar de fabricar `0%` o dividir por cero. El contrato futuro podra representarlo como estado discriminado y nunca como `NaN`/infinito. La invariante `[0,1]` se aplica unicamente cuando el resultado contiene una razon.

### 12.4 Casos de aceptacion

| Caso | Cartera activa | Capital en riesgo | Resultado |
|---|---:|---:|---:|
| CA-06 Antes de incobrable | Q800,000.00 | Q56,000.00 | 7.00% |
| CA-07 Despues de C-005 incobrable | Q792,000.00 | Q48,000.00 | 6.06% |

### 12.5 Provisiones

Las tasas de provision son POL-08. Cada version define porcentaje por tramo o condicion, vigencia, autor y base. El cierre conserva la version utilizada. Como el enunciado no proporciona porcentajes, esta fase no inventa valores.

## 13. Politicas de ciclo de vida con efecto financiero

| Situacion | Regla financiera |
|---|---|
| SOLICITADO/APROBADO sin desembolso | No existe saldo desembolsado y no se aceptan pagos ordinarios. |
| DESEMBOLSADO | Se reconoce el capital y se fija la politica contractual. |
| VIGENTE | Devenga corriente conforme al plan; no existe obligacion vencida pendiente. |
| EN_MORA | Calcula moratorio por cuota; suspende corriente al superar 90 dias. |
| EN_MORA con pago parcial | Aplica prelacion y permanece en mora si queda vencido pendiente. |
| Regularizacion | Al cubrir todo lo vencido vuelve a VIGENTE y puede reactivar devengo. |
| REESTRUCTURADO | Conserva historia previa y siempre cuenta como riesgo mientras siga activo. |
| CANCELADO | Saldo de capital y obligaciones exigibles en cero; no admite nuevos cargos ordinarios. |
| INCOBRABLE | Sale de cartera activa; una recuperacion posterior genera movimientos contables sin reactivacion. |

## 14. Politicas de cierres y mayor

### 14.1 Identidad idempotente

| Operacion | Identidad conceptual |
|---|---|
| Pago | Clave de idempotencia + ambito institucional del registro. |
| Cierre diario | Tipo de cierre + fecha de corte + ambito institucional. |
| Cierre mensual | Tipo de cierre + periodo mensual + ambito institucional. |

La misma identidad con la misma entrada devuelve/reconoce el resultado previo sin nuevos movimientos. La misma identidad con contenido diferente produce un conflicto explicito; no reemplaza silenciosamente el resultado anterior.

### 14.2 Mayor append-only

Un movimiento contiene como minimo identidad, fecha efectiva, fecha de registro, credito/operacion origen, concepto, importe firmado, moneda e identidad idempotente. No se actualiza ni elimina.

Una correccion se representa mediante un movimiento compensatorio que referencia el movimiento corregido. Asi:

`saldo = saldoInicial + Σ movimientosFirmados`

continua siendo reproducible.

### 14.3 Congelamiento de cierre

Generar un cierre no sobrescribe saldos ni recrea hechos. Consolida el conjunto de movimientos elegibles hasta la fecha de corte y conserva su alcance o huella. Un movimiento tardio posterior se trata mediante politica de ajuste en el periodo abierto o movimiento compensatorio; nunca se inserta ocultamente alterando un cierre congelado.

## 15. Catalogo consolidado de politicas

| ID | Politica | Parametros minimos | Estrategia/resultado seleccionado en esta fase |
|---|---|---|---|
| POL-01 | Interes corriente | tasa, tipo, periodicidad, base, metodo | TNA/12 para TNA nominal mensual; francesa. |
| POL-02 | Interes moratorio | TNA, base, vigencia | Actual/360 para CA-02; por cuota y solo capital. |
| POL-03 | Excedentes | estrategia, modalidad posterior, vigencia | Preferida: amortizacion directa; modalidad plazo/cuota pendiente. |
| POL-04 | Gastos/comisiones | conceptos, formulas/importes, vigencia | Sin valores inventados; siempre primera prelacion. |
| POL-05 | Evaluacion | criterios, umbrales, ponderacion | Pendiente de datos institucionales. |
| POL-06 | Aprobacion | rol, limites, ambitos | Pendiente de datos institucionales. |
| POL-07 | Expiracion | duracion y evento de inicio | Pendiente de datos institucionales. |
| POL-08 | Provision | porcentajes por riesgo/tramo | Pendiente de datos institucionales. |
| POL-09 | Reestructuracion | elegibilidad, autorizacion, condiciones | Mantiene historia y marca riesgo. |
| POL-10 | Calendario | calendario, ajuste no habil | Sin ajuste silencioso hasta definirla. |
| POL-11 | Cartera activa cero | resultado discriminado | `SIN_CARTERA_ACTIVA`. |
| POL-12 | Reactivacion de devengo | regularizacion, autorizacion | Al pagar todo lo vencido y atraso cero; nunca incobrable. |

## 16. Casos limite obligatorios

| area | Caso limite | Resultado requerido |
|---|---|---|
| Tasa | Tasa mensual cero | Cuota = capital/plazo; ajuste final conserva capital y saldo cero. |
| Amortizacion | Redondeo acumulado | Solo la ultima cuota absorbe diferencia. |
| Mora | Corte antes o en vencimiento | Cero dias y SIN_MORA. |
| Mora | Limites 30/31, 60/61, 90/91, 120/121 | Clasificacion exacta segun tabla. |
| Devengo | Exactamente 90 dias | Aun no se suspende por la regla “despues de 90”. |
| Devengo | 91 dias | Suspendido. |
| Moratorio | Capital vencido cero | Moratorio Q0.00. |
| Moratorio | Varias cuotas vencidas | Calculo independiente y suma posterior. |
| Pago | Pago menor al primer concepto | Se aplica parcialmente y no se rechaza. |
| Pago | Pago con excedente | El excedente queda identificado y se procesa por POL-03. |
| Pago | Misma clave y mismos datos | Sin segundo efecto. |
| Pago | Misma clave y datos distintos | Conflicto explicito. |
| Cartera | Un credito cumple dos criterios de riesgo | Se cuenta una sola vez. |
| Cartera | Cartera activa cero | `SIN_CARTERA_ACTIVA`. |
| Cierre | Segunda ejecucion identica | Mismo resultado, cero movimientos nuevos. |
| Politica | Cero o varias versiones vigentes | Error explicito; no se calcula. |

## 17. Pruebas previstas

| ID | Prueba | Reglas verificadas |
|---|---|---|
| PF-01 | Seleccionar exactamente una version por fecha en intervalos semiabiertos | INF-13, seccion 4 |
| PF-02 | Rechazar vacio y superposicion de vigencias | Seleccion determinista |
| PF-03 | Nueva version no altera un credito previo | INV-18 |
| PF-04 | TNA 36% se convierte exactamente en 3% mensual | Seccion 5.2 |
| PF-05 | Validar las 12 filas y totales de CA-01 | INV-01, INV-02 |
| PF-06 | Tasa cero conserva capital y saldo final cero | Seccion 6.2 |
| PF-07 | Fecha de vencimiento produce 0 y dia siguiente produce 1 | Seccion 7.2 |
| PF-08 | Validar todos los limites de tramo | INV-10 |
| PF-09 | CA-02 produce Q7.26 y excluye intereses de la base | INV-11 |
| PF-10 | Varias cuotas calculan moratorio independientemente | RN-15 |
| PF-11 | Corriente activo a 90 y suspendido a 91 dias | RN-17 |
| PF-12 | Regularizacion permite reactivacion sin retroactividad | POL-12 |
| PF-13 | CA-03, CA-04 y CA-05 conservan exactamente el pago | INV-12, INV-13 |
| PF-14 | Estrategias de excedente conservan el remanente | POL-03 |
| PF-15 | CA-06 = 7.00% y CA-07 = 6.06% | RF-18, RF-19 |
| PF-16 | Cartera cero devuelve `SIN_CARTERA_ACTIVA` | POL-11 |
| PF-17 | Credito reestructurado al dia sigue en riesgo | RN-27 |
| PF-18 | Credito con doble criterio de riesgo se suma una vez | Seccion 12.2 |
| PF-19 | Pago repetido identico no genera movimientos | INV-08 |
| PF-20 | Clave repetida con contenido distinto produce conflicto | Seccion 14.1 |
| PF-21 | Cierre repetido no genera movimientos | INV-17 |
| PF-22 | Movimientos y compensaciones reproducen el saldo | INV-07 |

## 18. Trazabilidad incremental: requisito → politica/diseño → codigo → prueba → documento

Los destinos de codigo y pruebas son previstos; se crearan unicamente en sus fases autorizadas.

| Requisito/regla | Politica o diseño | Codigo previsto | Prueba prevista | Evidencia en esta fase |
|---|---|---|---|---|
| RF-25, RF-26, RN-29, RN-30, INV-18 | Contrato versionado, intervalo semiabierto y seleccion unica | Modulo de politicas del dominio | PF-01–PF-03 | Secciones 4 y 15 |
| RF-06, RN-05–RN-09, INV-01, INV-02 | TNA/12, francesa y ajuste final | `src/dominio/plan-amortizacion.ts` | PF-04–PF-06 | Secciones 5 y 6 |
| RF-11, RF-12, RN-10–RN-12, INV-10 | Fecha civil, conteo y tabla de tramos | `src/dominio/calculadora-mora.ts` | PF-07, PF-08 | Secciones 7 y 8 |
| RF-13, RN-13–RN-16, INV-11 | Actual/360, por cuota, solo capital | `src/dominio/calculadora-mora.ts` | PF-09, PF-10 | Seccion 9 |
| RF-14, RN-17 | Suspension >90 y reactivacion controlada | Estado/politicas de credito | PF-11, PF-12 | Secciones 5.3 y 13 |
| RF-07–RF-09, RN-18–RN-20, INV-12, INV-13 | Prelacion fija y Strategy de excedente | `src/dominio/prelacion-pago.ts` | PF-13, PF-14 | Secciones 10 y 11 |
| RF-18, RF-19, RN-26–RN-28, INV-06 | Saldo completo, reestructurados, exclusion de incobrables | `src/dominio/cartera.ts` | PF-15–PF-18 | Seccion 12 |
| RF-10, RF-22, RN-31, INV-08, INV-17 | Identidades idempotentes y conflicto por contenido diferente | Pago y modulo de cierres | PF-19–PF-21 | Seccion 14.1 |
| RF-23, RN-32, INV-07 | Mayor append-only y compensaciones | Movimiento/mayor | PF-22 | Secciones 14.2 y 14.3 |
| RNF-01, RNF-02, INF-01–INF-03, INF-14 | Decimales exactos, moneda y tiempo explicito | `dinero.ts`, tasa y puerto `Reloj` | Pruebas Dinero/PF-04/PF-07 | Secciones 3, 5 y 7 |

## 19. Decisiones adoptadas

| ID | Decision | Justificacion y consecuencia |
|---|---|---|
| D3-01 | Usar vigencia semiabierta `[desde, hasta)`. | Elimina ambigüedad en el instante de reemplazo. |
| D3-02 | Fallar si no hay exactamente una politica aplicable. | Evita calculos silenciosos con valores predeterminados. |
| D3-03 | Conservar referencia e instantanea verificable de politicas contractuales. | Maximiza auditabilidad y resistencia a cambios retroactivos. |
| D3-04 | Interpretar “despues de 90 dias” como `diasAtraso > 90`. | Mantiene el significado literal: 90 activo, 91 suspendido. |
| D3-05 | Contar atraso desde el dia posterior al vencimiento. | En vencimiento hay 0 dias; al dia siguiente hay 1. |
| D3-06 | Distinguir tramo >120 de declaracion contable INCOBRABLE. | Una clasificacion calculada no ejecuta automaticamente una salida contable. |
| D3-07 | Usar el maximo atraso pendiente como tramo general del credito. | Refleja la obligacion mas deteriorada sin perder calculo individual por cuota. |
| D3-08 | Preferir amortizacion directa a capital para excedentes. | Reduce exposicion y costo; permanece sustituible como Strategy. |
| D3-09 | Representar cartera activa cero como `SIN_CARTERA_ACTIVA`. | Evita una razon falsa, NaN o infinito. |
| D3-10 | Tratar reutilizacion de identidad con datos diferentes como conflicto. | Idempotencia no debe ocultar una operacion distinta. |
| D3-11 | Corregir mediante movimientos compensatorios. | Preserva el mayor append-only y la reconstruccion historica. |

## 20. Decisiones pendientes

| ID | Punto pendiente | Razon |
|---|---|---|
| DP-03 | Calendario y ajuste de dias no habiles | Requiere definicion institucional; no se moveran fechas silenciosamente. |
| DP-04 | Precision interna concreta de `decimal.js` | Se fijara y probara en configuracion/implementacion. |
| DP-05 | Alcance tecnico definitivo de `Idempotency-Key` | Se precisara en contratos OpenAPI/Zod conservando el ambito institucional. |
| DP-06 | Cuentas contables de recuperaciones posteriores a incobrable | Requiere catalogo contable; el estado seguira siendo INCOBRABLE. |
| DP-08 | Tasas de provision | No estan en el enunciado; deben ser aportadas por la institucion. |
| DP-09 | Gastos y comisiones concretos | No estan en el enunciado; el orden ya esta fijado. |
| DP-11 | Tras amortizacion anticipada, reducir plazo o recalcular cuota | Requiere decision contractual; el excedente si queda preservado/aplicado. |
| DP-12 | Criterios, umbrales y facultades de evaluacion/aprobacion | Requieren reglas institucionales no incluidas en el caso. |

## 21. Validacion contra el enunciado

| Criterio | Evidencia | Estado |
|---|---|---|
| Tasas no incrustadas en algoritmos | Secciones 3, 4, 5 y 15 | Cumplido por diseño |
| Politica incluye tasa, tipo, vigencia, base, autor y version | Secciones 4, 5 y 9 | Cumplido |
| Credito conserva politica de otorgamiento | Seccion 4.4 | Cumplido |
| Amortizacion francesa y tasa cero | Seccion 6 | Cumplido |
| Ajuste obligatorio de ultima cuota | Seccion 6.3 | Cumplido |
| Caso financiero CA-01 fijado | Seccion 6.4 | Cumplido |
| Dias calendario y tramos exactos | Secciones 7 y 8 | Cumplido |
| Tramos separados de estados | Seccion 8 | Cumplido |
| Moratorio solo sobre capital y por cuota | Seccion 9 | Cumplido |
| Caso moratorio Q7.26 | Seccion 9.3 | Cumplido |
| Suspension posterior a 90 dias y reactivacion | Secciones 5.3 y 13 | Cumplido |
| Prelacion y tres escenarios | Seccion 10 | Cumplido |
| Excedente como Strategy y no perdido | Seccion 11 | Cumplido |
| Cartera en riesgo y casos 7.00%/6.06% | Seccion 12 | Cumplido |
| Idempotencia y mayor append-only | Seccion 14 | Cumplido |
| Trazabilidad incremental | Seccion 18 | Cumplido |
| Sin codigo ni artefactos de fases futuras | Solo documentacion de analisis | Cumplido |

## 22. Resultado esperado

Las fases posteriores cuentan con reglas financieras inequivocas, politicas versionables y criterios de error explicitos. Los calculos tendran entradas temporales y decimales controladas, conservaran las politicas historicas y podran demostrar sus resultados mediante los casos CA-01 a CA-07 y las pruebas PF-01 a PF-22.
