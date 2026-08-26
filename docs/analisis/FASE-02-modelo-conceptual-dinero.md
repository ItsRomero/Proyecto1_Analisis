# Fase 2 — Modelo conceptual y Value Object Dinero

## 1. Objetivo y alcance

Definir el modelo conceptual que conecta los conceptos descubiertos en la Fase 1 y especificar el contrato de dominio del objeto de valor `Dinero`. Esta definicion sera la referencia para UML, arquitectura, codigo, pruebas y contratos posteriores.

Esta fase no implementa TypeScript. Tampoco crea diagramas UML formales, configuracion de proyecto, contratos HTTP ni infraestructura; esos artefactos pertenecen a fases posteriores del orden de ejecucion.

## 2. Requisitos cubiertos

| Grupo | Identificadores cubiertos |
|---|---|
| Requisitos funcionales | RF-02, RF-05, RF-06, RF-07, RF-08, RF-09, RF-13, RF-18, RF-19, RF-20, RF-21, RF-22, RF-23 |
| Requisitos no funcionales | RNF-01, RNF-02, RNF-03, RNF-09, RNF-10, RNF-11 |
| Reglas | RN-03, RN-04, RN-05, RN-06, RN-07, RN-08, RN-09, RN-13, RN-14, RN-18, RN-20, RN-26, RN-27, RN-28, RN-31, RN-32 |
| Invariantes | INV-01, INV-02, INV-03, INV-07, INV-11, INV-12, INV-13, INV-14, INV-17 |

## 3. Modelo conceptual del dominio

### 3.1 Nucleo conceptual

El recorrido principal del dominio es el siguiente:

1. Un `Cliente` presenta una `SolicitudCredito`.
2. La solicitud recibe una o mas evidencias de `EvaluacionCredito` y una decision.
3. Una solicitud aprobada origina un `Credito` al desembolsarse.
4. El credito fija sus condiciones y la version de `PoliticaFinanciera` aplicable.
5. El credito contiene un `PlanAmortizacion`, compuesto por `Cuota` ordenadas.
6. Cada `Pago` se distribuye en una `AplicacionPago` conforme a la prelacion obligatoria.
7. La aplicacion de un pago y los demas hechos financieros producen `Movimiento` inmutables.
8. Los movimientos permiten reconstruir saldos y producir `CierreDiario` y `CierreMensual`.
9. La situacion de cada obligacion a una `FechaCorte` determina `DiasAtraso`, `TramoMora` y, cuando corresponde, interes moratorio.
10. Los saldos de creditos activos permiten calcular `CarteraEnRiesgo`.

### 3.2 Relaciones conceptuales

| Concepto origen | Relacion | Concepto destino | Cardinalidad conceptual | Restriccion principal |
|---|---|---|---|---|
| Cliente | presenta | SolicitudCredito | 1 a 0..* | Una solicitud pertenece a un unico cliente. |
| SolicitudCredito | registra | EvaluacionCredito | 1 a 0..* | Cada evaluacion conserva fecha, criterios y autor. |
| SolicitudCredito | origina | Credito | 1 a 0..1 | Solo despues de aprobacion y desembolso. |
| Credito | conserva | PoliticaFinanciera | 1 a 1 por proposito contractual | La version aplicable no cambia retroactivamente. |
| Credito | contiene | PlanAmortizacion | 1 a 1 vigente | Una reestructuracion conserva el plan anterior y genera condiciones identificables. |
| PlanAmortizacion | compone | Cuota | 1 a 3..24 inicialmente | Las cuotas estan ordenadas y sus amortizaciones suman el capital. |
| Credito | recibe | Pago | 1 a 0..* | Solo en estados que admiten cobro ordinario. |
| Pago | produce | AplicacionPago | 1 a 1 | Aplicado por conceptos mas remanente equivale al pago. |
| Pago | origina | Movimiento | 1 a 1..* | Un reintento idempotente no vuelve a originarlos. |
| Cuota | recibe aplicacion de | AplicacionPago | 1 a 0..* | Cada componente pendiente permanece no negativo. |
| Credito | registra | TransicionEstado | 1 a 1..* | El historial es inmutable y cronologico. |
| Mayor | contiene | Movimiento | 1 a 0..* | Es append-only y reproduce el saldo. |
| Cierre | consolida | Movimiento | 1 a 0..* | No duplica movimientos al repetirse. |
| CarteraEnRiesgo | resume | Credito | 1 a 0..* | Usa el saldo completo de los creditos en riesgo. |

### 3.3 Propiedad de los conceptos y limites

| Concepto | Tipo conceptual | Propietario/limite | Razon |
|---|---|---|---|
| Cliente | Entidad | Agregado Cliente | Tiene identidad y ciclo independiente. |
| SolicitudCredito | Entidad/raiz | Agregado Solicitud | Protege evaluacion y decision previas al credito. |
| EvaluacionCredito | Entidad subordinada | Agregado Solicitud | Su significado depende de la solicitud, pero conserva autoria propia. |
| Credito | Entidad/raiz | Agregado Credito | Protege estado, saldo, plan y politica contractual. |
| PlanAmortizacion | Entidad subordinada | Agregado Credito | Su consistencia se valida como conjunto de cuotas. |
| Cuota | Entidad subordinada | Agregado Credito | Tiene numero/vencimiento estable dentro del plan. |
| Pago | Entidad/raiz | Agregado Pago | Requiere identidad e idempotencia independientes. |
| Movimiento | Entidad inmutable | Mayor | Tiene identidad contable y no se sobrescribe. |
| Cierre | Entidad/raiz | Agregado Cierre | Tiene identidad por tipo y periodo para garantizar idempotencia. |
| PoliticaFinanciera | Entidad versionada | Catalogo de politicas | Su identidad incluye politica y version. |
| Dinero | Objeto de valor | Compartido por el dominio | Se identifica unicamente por importe y moneda. |
| Tasa | Objeto de valor | Calculo financiero/politicas | Se compara por valor, tipo y periodicidad. |
| AplicacionPago | Objeto de valor | Agregado Pago | Es el resultado inmutable de distribuir un importe. |
| DiasAtraso | Objeto de valor | Calculo de mora | Entero no negativo derivado de fechas. |
| TramoMora | Objeto de valor derivado | Cartera y cobros | Depende exclusivamente de los dias de atraso. |
| FechaCorte | Objeto de valor | Casos de uso de calculo | Hace explicito el tiempo del calculo. |

### 3.4 Hechos del dominio relevantes

Los siguientes hechos se conservaran conceptualmente y podran convertirse en eventos de dominio si una fase posterior demuestra que aporta valor:

| Hecho | Datos minimos | Consumidores conceptuales |
|---|---|---|
| SolicitudAprobada | solicitud, fecha, actor, condiciones, motivo | Originacion |
| CreditoDesembolsado | credito, fecha, capital, moneda, politica | Cartera, mayor y cierre diario |
| PagoRegistrado | pago, credito, fecha, importe, clave idempotente | Cartera y cobros |
| PagoAplicado | importes por concepto, remanente, estrategia | Mayor y auditoria |
| CreditoEntroEnMora | credito, fecha de corte, dias, obligacion vencida | Riesgo y cierre |
| CreditoRegularizado | credito, fecha, obligaciones cubiertas | Riesgo y devengo |
| CreditoReestructurado | credito, autorizacion, condiciones anteriores y nuevas | Riesgo y cierre |
| CreditoDeclaradoIncobrable | credito, fecha, saldo, actor y motivo | Mayor, cierre y cartera activa |
| CreditoCancelado | credito, fecha, saldo cero | Cartera y cierre |
| CierreGenerado | identidad, tipo, periodo, movimientos incluidos | Auditoria |

Estos hechos no autorizan por si mismos una arquitectura asincrona ni infraestructura de mensajeria en Proyecto 1.

## 4. Value Object `Dinero`

### 4.1 Proposito

`Dinero` representa un importe monetario exacto junto con su moneda. Centraliza las reglas de precision, redondeo, comparacion y compatibilidad monetaria para impedir que cada calculo financiero adopte convenciones diferentes.

Es un objeto de valor porque dos instancias con el mismo importe normalizado y la misma moneda son equivalentes, sin necesitar identidad propia.

### 4.2 Decisiones de representacion

| Decision | Seleccion | Justificacion |
|---|---|---|
| Biblioteca decimal | `decimal.js` | Permite calculos intermedios decimales exactos, potencias para amortizacion francesa y configuracion explicita del redondeo. Su instalacion se realizara en la fase de configuracion. |
| Entrada de importes | Cadena decimal o instancia decimal controlada | Se prohibe recibir `number` para evitar introducir previamente una aproximacion binaria. |
| Moneda inicial | `GTQ` | El producto opera en quetzales; el diseño conserva la moneda para impedir mezclas y permitir extension controlada. |
| Escala monetaria observable | Dos decimales | Es la precision exigida para importes del proyecto. |
| Redondeo monetario | Medio hacia arriba (`ROUND_HALF_UP`) | Es la regla explicita del enunciado. |
| Inmutabilidad | Total | Toda operacion devuelve una nueva instancia y nunca cambia operandos. |
| Serializacion | Importe como cadena de dos decimales y moneda separada | Conserva ceros finales y evita convertir a punto flotante. |

La eleccion de `decimal.js` no autoriza el uso de `number` para dinero. Los numeros enteros usados como conteos —por ejemplo, meses o dias— no representan importes monetarios y se validaran por separado.

### 4.3 Estado conceptual

| Campo | Tipo conceptual | Restricciones |
|---|---|---|
| importe | Decimal exacto | Finito, normalizado a dos decimales con redondeo medio hacia arriba. |
| moneda | Moneda | Obligatoria; inicialmente `GTQ`; participa en la igualdad. |

No se expone una referencia decimal mutable. Si la biblioteca subyacente es inmutable, aun asi el objeto encapsula su representacion y solo publica resultados seguros.

### 4.4 Construccion

El contrato conceptual admite las siguientes fabricas:

| Operacion | Entrada | Resultado/validacion |
|---|---|---|
| `Dinero.desdeCadena` | cadena decimal, moneda | Crea un importe normalizado; rechaza cadena vacia, formato invalido, infinito o NaN. |
| `Dinero.cero` | moneda | Devuelve `0.00` en la moneda indicada. |
| `Dinero.desdeUnidadesMenores` | entero de centavos, moneda | Convierte de forma exacta sin punto flotante; util en limites externos controlados. |

No habra una fabrica publica que acepte `number`. Las entradas externas futuras usaran cadenas mediante Zod y se transformaran a `Dinero` en el borde de la aplicacion.

### 4.5 Operaciones monetarias

| Operacion conceptual | Parametros | Resultado | Precondicion/regla |
|---|---|---|---|
| `sumar` | otro Dinero | nuevo Dinero | Misma moneda. |
| `restar` | otro Dinero | nuevo Dinero | Misma moneda; puede producir valor firmado, sujeto a invariantes del contexto consumidor. |
| `multiplicar` | factor decimal exacto | nuevo Dinero | Factor finito; resultado redondeado a dos decimales. |
| `dividir` | divisor decimal exacto | nuevo Dinero | Divisor distinto de cero; resultado redondeado a dos decimales. |
| `negar` | — | nuevo Dinero | Conserva moneda. |
| `absoluto` | — | nuevo Dinero | Conserva moneda. |
| `minimo` | otro Dinero | nuevo Dinero | Misma moneda. |
| `maximo` | otro Dinero | nuevo Dinero | Misma moneda. |
| `esIgualA` | otro Dinero | booleano | Compara importe normalizado y moneda. |
| `esMayorQue` | otro Dinero | booleano | Misma moneda. |
| `esMayorOIgualQue` | otro Dinero | booleano | Misma moneda. |
| `esMenorQue` | otro Dinero | booleano | Misma moneda. |
| `esCero` | — | booleano | Evalua el importe normalizado. |
| `esNegativo` | — | booleano | Permite a agregados imponer capital no negativo. |
| `aCadena` | — | cadena | Siempre dos decimales, sin simbolo ni separadores regionales. |
| `aUnidadesMenores` | — | entero seguro/controlado | Solo despues de normalizar a dos decimales. |

Los nombres exactos podran adaptarse a las convenciones de TypeScript en la Fase 16, pero no podra cambiar su semantica sin actualizar esta decision y la trazabilidad.

### 4.6 Operaciones escalares y precision intermedia

Los calculos financieros requieren distinguir entre:

- `Dinero`, que es observable y se redondea a dos decimales; y
- escalares exactos, como tasas y factores, que necesitan mas precision intermedia.

Una tasa no es `Dinero`. Se representara mediante un objeto de valor decimal distinto. Por ejemplo, 3% mensual se conserva conceptualmente como `0.03`, no como un `number` binario.

Para amortizacion francesa, las potencias y el calculo de la cuota se realizan con precision decimal suficiente. El resultado monetario se redondea cuando la regla financiera lo exige. No se redondeara cada subexpresion arbitrariamente, porque eso cambiaria el resultado contractual.

### 4.7 Politica de redondeo

La regla unica es redondeo medio hacia arriba a dos decimales cuando se materializa un importe monetario.

Ejemplos de aceptacion:

| Entrada exacta | Resultado monetario |
|---:|---:|
| `1.004` | `1.00` |
| `1.005` | `1.01` |
| `1.006` | `1.01` |
| `-1.004` | `-1.00` |
| `-1.005` | `-1.01` |

El formateo visual con `Q`, comas o convenciones regionales no pertenece a `Dinero`; corresponde a presentadores o adaptadores futuros. El nucleo serializa `1004.62` y `GTQ`, mientras que una interfaz podria mostrar `Q1,004.62`.

### 4.8 Compatibilidad de moneda

Las operaciones binarias que combinan importes (`sumar`, `restar`, comparaciones, minimo y maximo) exigen la misma moneda. Ante monedas distintas, la operacion falla explicitamente y no produce un resultado.

`Dinero` no convierte monedas. Una conversion necesitaria una tasa, fecha, fuente y politica de redondeo auditables, funcionalidad que esta fuera del alcance actual.

### 4.9 Importes negativos y cero

`Dinero` admite importes firmados porque el mayor append-only necesita debitos, creditos y movimientos compensatorios sin crear otro tipo monetario. Sin embargo, permitir un valor negativo en el Value Object no permite que cualquier concepto del dominio sea negativo.

Las restricciones se aplican donde existe el significado:

| Concepto | Restriccion contextual |
|---|---|
| Capital solicitado/desembolsado | Positivo y dentro del rango institucional. |
| Saldo de capital | Mayor o igual que cero. |
| Pago recibido | Mayor que cero. |
| Componentes pendientes de una cuota | Mayores o iguales que cero. |
| Movimiento de mayor | Puede ser positivo o negativo segun su naturaleza. |
| Dinero cero | Valido para conceptos sin cargo, saldos cancelados y remanentes agotados. |

Esta separacion evita que `Dinero` conozca todas las reglas de cada agregado y mantiene alta cohesion.

### 4.10 Errores de dominio previstos

| Condicion | Error conceptual | Efecto |
|---|---|---|
| Formato monetario invalido | `ImporteMonetarioInvalido` | No se crea la instancia. |
| Moneda ausente/no admitida | `MonedaInvalida` | No se crea la instancia. |
| Mezcla de monedas | `MonedasIncompatibles` | La operacion no produce resultado. |
| Division por cero | `DivisionMonetariaPorCero` | La operacion no produce resultado. |
| Entrada mediante punto flotante | Error de tipo/contrato | No existe sobrecarga publica que la acepte. |
| Resultado no finito | `ResultadoMonetarioInvalido` | La operacion no produce resultado. |

Los errores concretos se diseñaran de forma tipada en la fase de implementacion; no se usaran excepciones genericas para ocultar la causa.

## 5. Uso de `Dinero` en el modelo conceptual

| Concepto | Atributos monetarios | Reglas relevantes |
|---|---|---|
| SolicitudCredito | monto solicitado | Rango Q1,000.00-Q25,000.00. |
| Credito | capital desembolsado, saldo de capital | Misma moneda; saldo nunca negativo. |
| Cuota | cuota, interes corriente, amortizacion, saldos pendientes | Suma de componentes y ajuste final exactos. |
| Pago | importe recibido | Positivo; aplicacion completa e idempotente. |
| AplicacionPago | gastos, moratorio, corriente, capital, excedente | Todos en la moneda del pago; conservacion del total. |
| CalculadoraMora | capital vencido, interes moratorio | Base exclusiva de capital; redondeo monetario final. |
| Movimiento | importe | Firmado y monetariamente homogeneo por cuenta/credito. |
| Cierre | desembolsos, cobros, devengos, mora, saldos, provisiones | Reproducibles a partir de movimientos. |
| CarteraEnRiesgo | cartera activa, capital en riesgo | Mismos importes/moneda antes de obtener la razon. |

## 6. Invariantes monetarias formalizadas

Para importes de una misma moneda `M`:

1. **Inmutabilidad:** si `c = a.sumar(b)`, ni `a` ni `b` cambian.
2. **Conservacion de pago:** `pago = gastos + moratorio + corriente + capital + remanente`.
3. **Conservacion del plan:** `capitalDesembolsado = Σ amortizacionCuota`.
4. **Cierre del plan:** `saldoPosteriorUltimaCuota = Dinero.cero(M)`.
5. **Capital no negativo:** para todo saldo contractual, `saldoCapital >= Dinero.cero(M)`.
6. **Homogeneidad:** todos los sumandos de una ecuacion monetaria tienen moneda `M`.
7. **No anatocismo:** la base monetaria del moratorio contiene capital vencido y excluye intereses y cargos.
8. **Excedente integro:** el monto que no cubre conceptos exigibles sigue identificado como remanente o se aplica mediante la politica elegida.
9. **Reproduccion del saldo:** `saldoFinal = saldoInicial + Σ movimientosFirmados`.
10. **Idempotencia financiera:** la misma clave de operacion no agrega una segunda vez sus movimientos monetarios.

## 7. Contratos conceptuales de calculos posteriores

### 7.1 Plan de amortizacion

Entrada conceptual:

- capital como `Dinero` positivo;
- tasa periodica como decimal exacto;
- plazo como entero valido;
- fechas y politica aplicable.

Salida conceptual:

- coleccion ordenada de cuotas en la moneda del capital;
- totales de amortizacion, interes y pagos;
- saldo final exacto en cero.

La ultima cuota absorbe la diferencia provocada por el redondeo periodico sin permitir capital negativo.

### 7.2 Interes moratorio

Entrada conceptual:

- capital vencido de una cuota como `Dinero` no negativo;
- tasa diaria como decimal exacto;
- dias de atraso como entero no negativo.

Salida conceptual:

- interes moratorio como un nuevo `Dinero` en la moneda del capital vencido.

La base excluye interes corriente, moratorio anterior, gastos y comisiones.

### 7.3 Prelacion de pago

Entrada conceptual:

- pago como `Dinero` positivo;
- obligaciones por concepto, todas en la misma moneda.

Salida conceptual:

- `AplicacionPago` inmutable con gastos, moratorio, corriente, capital y remanente;
- suma exacta igual al pago recibido.

### 7.4 Cartera en riesgo

Entrada conceptual:

- cartera activa y capital en riesgo como `Dinero` de la misma moneda.

Salida conceptual:

- `Porcentaje` decimal, no `Dinero`, dentro de `[0,1]`.

El caso de cartera activa cero se resolvera mediante la politica pendiente POL-11 antes de implementar este calculo.

## 8. Pruebas previstas para `Dinero`

La implementacion de estas pruebas corresponde a las fases de codigo, pero sus criterios quedan fijados desde ahora.

| ID | Prueba prevista | Resultado esperado |
|---|---|---|
| PD-01 | Crear desde `"1000"`, `"1000.0"` y `"1000.00"` en GTQ | Instancias equivalentes serializadas como `1000.00`. |
| PD-02 | Redondear `1.004`, `1.005` y `1.006` | `1.00`, `1.01`, `1.01`. |
| PD-03 | Redondear `-1.004` y `-1.005` | `-1.00`, `-1.01`. |
| PD-04 | Sumar y restar importes GTQ | Resultado exacto y operandos sin cambios. |
| PD-05 | Intentar sumar GTQ y USD | Error explicito de monedas incompatibles. |
| PD-06 | Multiplicar por tasa decimal exacta | Resultado a dos decimales con medio hacia arriba. |
| PD-07 | Dividir entre cero | Error explicito sin resultado. |
| PD-08 | Intentar construir con formato invalido o no finito | Construccion rechazada. |
| PD-09 | Verificar que la API publica no acepte `number` | Error de compilacion esperado o prueba de tipos. |
| PD-10 | Convertir a/desde unidades menores | Viaje de ida y vuelta exacto. |
| PD-11 | Comparar importes equivalentes | Igualdad por importe normalizado y moneda. |
| PD-12 | Restar produciendo negativo | `Dinero` lo representa; el agregado de capital lo rechaza cuando corresponda. |
| PD-13 | Cero por moneda | `0.00` con moneda conservada. |
| PD-14 | Serializar | Objeto contractual con importe cadena y moneda, sin `number`. |

## 9. Trazabilidad incremental: requisito → diseño → codigo → prueba → documento

El codigo y las pruebas aun no existen por orden del prompt. Se indican sus destinos previstos para evitar inconsistencias posteriores.

| Requisito | Diseño de esta fase | Codigo previsto | Prueba prevista | Documento |
|---|---|---|---|---|
| RNF-01, RN-03, RN-04 | `Dinero` exacto, con moneda, escala 2 y HALF_UP | `src/dominio/dinero.ts` | `tests/dinero.test.ts`, PD-01-PD-14 | Secciones 4 y 8 |
| RF-06, RN-05-RN-09, INV-01, INV-02 | Contrato conceptual del plan y ajuste final | `src/dominio/plan-amortizacion.ts` | `tests/plan-amortizacion.test.ts` | Secciones 3, 6 y 7.1 |
| RF-07-RF-09, RN-18, RN-20, INV-12, INV-13 | Pago y `AplicacionPago` conservan el importe | `src/dominio/prelacion-pago.ts` | `tests/prelacion-pago.test.ts` | Secciones 3, 5, 6 y 7.3 |
| RF-13, RN-13, RN-14, INV-11 | Moratorio basado solo en capital vencido | `src/dominio/calculadora-mora.ts` | `tests/calculadora-mora.test.ts` | Secciones 5, 6 y 7.2 |
| RF-18, RF-19, RN-26-RN-28 | Razon separada de los importes monetarios | `src/dominio/cartera.ts` | `tests/cartera.test.ts` | Secciones 3, 5 y 7.4 |
| RF-20-RF-23, RN-31, RN-32, INV-07, INV-17 | Mayor append-only y cierres idempotentes | Modulo de cierres en fase correspondiente | Pruebas de cierres e invariantes | Secciones 3 y 6 |
| INV-03 | `Dinero` firmado + restriccion contextual del agregado | `dinero.ts`, credito/cuota | `invariantes.test.ts` | Seccion 4.9 |
| INV-14 | Compatibilidad monetaria obligatoria | `dinero.ts` y agregados | PD-05 y pruebas de invariantes | Seccion 4.8 |
| RNF-02, RNF-03, RNF-10 | Entradas explicitas, escalares exactos y fecha de corte | Calculos puros y puerto `Reloj` | Repeticion determinista con reloj falso | Secciones 3 y 4.6 |

## 10. Decisiones adoptadas

| ID | Decision | Consecuencia |
|---|---|---|
| D2-01 | Usar `decimal.js` como representacion subyacente futura. | Se obtienen decimales y potencias controladas; se incorpora una dependencia pequeña que debera encapsularse. |
| D2-02 | Prohibir `number` en la construccion publica de importes y escalares financieros. | Se evita introducir aproximaciones antes de llegar al dominio. |
| D2-03 | Redondear importes observables a dos decimales con medio hacia arriba. | Todas las areas comparten la misma regla contractual. |
| D2-04 | Mantener tasa/porcentaje separados de `Dinero`. | Se conserva precision intermedia y semantica correcta. |
| D2-05 | Permitir `Dinero` firmado y aplicar no negatividad en el agregado correspondiente. | El mayor puede usar movimientos firmados sin debilitar invariantes de capital. |
| D2-06 | Serializar importes como cadenas. | Contratos futuros no pierden precision en JSON. |
| D2-07 | No realizar conversion de moneda. | Mezclar monedas falla explicitamente; FX queda fuera de alcance. |
| D2-08 | Mantener Pago y Movimiento como conceptos distintos. | Se separan el hecho operativo, su aplicacion y sus efectos contables. |

## 11. Decisiones pendientes

| ID | Decision pendiente | Motivo y fase prevista |
|---|---|---|
| DP-02 | Convencion exacta para contar el primer dia de atraso | Se formalizara en la fase de reglas/mora con ejemplos fechados. |
| DP-03 | Ajuste de vencimientos por dias no habiles | Requiere politica institucional; fase de politicas. |
| DP-04 | Precision interna concreta de `decimal.js` | Se fijara al configurar e implementar, validandola con casos financieros. |
| DP-07 | Resultado cuando cartera activa es cero | Requiere politica explicita antes de implementar cartera. |
| DP-09 | Catalogo de gastos/comisiones | No fue definido; no afecta el diseño de prelacion. |

## 12. Validacion contra el enunciado

| Criterio | Evidencia | Estado |
|---|---|---|
| Modelo conceptual definido antes del codigo | Secciones 3 y 5 | Cumplido |
| `Dinero` es inmutable | Secciones 4.1 y 4.2 | Cumplido por contrato |
| Incluye importe y moneda | Seccion 4.3 | Cumplido |
| Impide mezclar monedas | Seccion 4.8 | Cumplido por contrato |
| Evita punto flotante | Secciones 4.2, 4.4 y D2-02 | Cumplido por diseño |
| Operaciones devuelven instancias nuevas | Secciones 4.1, 4.5 y 6 | Cumplido por contrato |
| Redondea a dos decimales | Secciones 4.2 y 4.7 | Cumplido por diseño |
| Usa redondeo medio hacia arriba | Seccion 4.7 | Cumplido por diseño |
| Mantiene trazabilidad incremental | Seccion 9 | Cumplido |
| No adelanta implementacion de `Dinero` | No se crearon archivos TypeScript | Cumplido |

## 13. Resultado esperado

Las siguientes fases disponen de un lenguaje comun, relaciones y limites de consistencia definidos. La futura implementacion de `Dinero` tendra un contrato inequivoco: decimal exacto, moneda obligatoria, construccion sin `number`, dos decimales, redondeo medio hacia arriba, inmutabilidad, serializacion segura y errores explicitos.
