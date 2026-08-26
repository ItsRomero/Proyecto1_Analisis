# Fase 4 — Modelo UML E1

## 1. Objetivo y alcance

Representar el dominio y sus comportamientos principales mediante diagramas UML editables en PlantUML, manteniendo consistencia con los requisitos, reglas, politicas e invariantes definidos en las Fases 1-3.

Esta fase incluye los cinco tipos de diagramas solicitados: casos de uso, clases, secuencia, estados y actividades. Se produjeron dos secuencias y dos actividades para cubrir tanto la operacion financiera critica como los procesos de originacion y cierre.

No se implementa codigo TypeScript, API, infraestructura, C4 ni modelo 4+1.

## 2. Archivos creados

| Archivo | Tipo | Proposito |
|---|---|---|
| `docs/diagramas/uml/01-casos-de-uso.puml` | Casos de uso | Relaciona actores con los 18 casos identificados e incluye comportamientos obligatorios. |
| `docs/diagramas/uml/02-clases.puml` | Clases | Presenta entidades, objetos de valor, agregados, servicios, puertos, operaciones, asociaciones, multiplicidades y patrones. |
| `docs/diagramas/uml/03-secuencia-registrar-pago.puml` | Secuencia | Detalla idempotencia, validacion de estado, prelacion completa, excedente, transicion y movimientos. |
| `docs/diagramas/uml/04-secuencia-desembolsar-credito.puml` | Secuencia | Detalla seleccion de politica, creacion del plan, invariantes, transiciones y movimiento de desembolso. |
| `docs/diagramas/uml/05-estados-credito.puml` | Estados | Modela el ciclo completo, deterioro, recuperacion, reestructuracion, cancelacion e incobrable. |
| `docs/diagramas/uml/06-actividad-originacion.puml` | Actividad | Representa desde registro del cliente hasta activacion o terminacion de la solicitud. |
| `docs/diagramas/uml/07-actividad-cierre-mensual.puml` | Actividad | Representa cierre idempotente, consolidacion, riesgo, provision y congelamiento. |

Todos los archivos fuente son editables y constituyen el entregable primario; una imagen renderizada futura sera un derivado, no un sustituto.

## 3. Requisitos cubiertos

| Grupo | Cobertura UML |
|---|---|
| Actores y CU-01-CU-18 | Diagrama de casos de uso |
| Entidades, VO y agregados de Fase 1 | Diagrama de clases |
| RF-05 y RF-06 | Secuencia de desembolso y actividad de originacion |
| RF-07-RF-10 | Secuencia de pago |
| RF-15-RF-17 | Diagramas de clases, secuencia de pago y estados |
| RF-18-RF-23 | Clases y actividad de cierre mensual |
| RF-25 y RF-26 | Clases, desembolso y originacion |
| INV-01-INV-03 | Plan, secuencia de desembolso y actividad de originacion |
| INV-04, INV-05, INV-09, INV-15, INV-16 | State, secuencia de pago y diagrama de estados |
| INV-07, INV-08, INV-12, INV-13, INV-17 | Clases, secuencia de pago y actividad de cierre |
| Patrones requeridos | Value Object, Strategy, Chain of Responsibility, State y Factory en clases |

## 4. Decisiones representadas

### 4.1 Casos de uso

El limite del sistema encierra unicamente capacidades del nucleo y aplicacion. API, UI, chat y MCP no aparecen como actores actuales porque son canales futuros y no deben confundirse con actores del Proyecto 1.

Se usan relaciones `include` cuando el comportamiento siempre forma parte del caso base:

- desembolsar incluye seleccionar politica y generar plan;
- registrar pago incluye aplicar prelacion;
- cierre mensual incluye consultar cartera en riesgo.

Se usa `extend` para resultados condicionales:

- procesar excedente solo cuando queda remanente;
- regularizar cuando el pago cubre todo lo vencido;
- cancelar cuando el saldo total queda en cero.

### 4.2 Clases

El diagrama organiza las clases en modulos conceptuales para mostrar responsabilidad y direccion de dependencias sin adelantar la arquitectura formal de la Fase 6.

Las composiciones indican ciclo de vida dependiente:

- una solicitud compone sus evaluaciones;
- un credito compone plan, cuotas e historial;
- un pago compone su aplicacion.

Las asociaciones por identidad mantienen separados los agregados. En particular, `Pago` origina `Movimiento`, pero uno no forma parte del agregado del otro.

Los patrones visibles son:

| Patron | Participantes UML | Problema representado |
|---|---|---|
| Value Object | `Dinero`, `Tasa`, `FechaCorte`, `DiasAtraso`, `AplicacionPago` | Exactitud, igualdad estructural e inmutabilidad. |
| Chain of Responsibility | `EslabonPrelacion`, `Gastos`, `Moratorio`, `InteresCorriente`, `Capital` | Aplicacion ordenada y extensible del pago. |
| Strategy | `PoliticaExcedente` y sus dos implementaciones | Sustituir tratamiento del excedente sin cambiar la prelacion. |
| State | `EstadoCreditoComportamiento` y clases de cada estado | Hacer invalidas por diseño las operaciones incompatibles. |
| Factory | `FabricaPlanAmortizacion` | Crear y validar el plan como conjunto consistente. |
| Repository/Ports | Interfaces de repositorio, `Reloj` y `GeneradorIds` | Mantener el nucleo independiente de infraestructura. |

### 4.3 Secuencia de pago

La secuencia hace explicito el recorrido obligatorio:

`Pago → Gastos → Moratorio → InteresCorriente → Capital`

Antes del efecto financiero se valida idempotencia y estado. Despues se verifica conservacion del importe, se procesa cualquier excedente mediante Strategy, se determina la transicion correspondiente y se registran efectos por concepto en el mayor.

La secuencia distingue tres reintentos:

- clave nueva: ejecuta la operacion;
- misma clave y mismos datos: devuelve el resultado anterior;
- misma clave y datos diferentes: produce conflicto.

### 4.4 Secuencia de desembolso

El desembolso requiere solicitud aprobada y vigente. La politica se selecciona con fecha inyectada y queda conservada antes de fabricar el plan. El plan valida suma de amortizaciones y saldo final; solo entonces se crea el credito, se registran las dos transiciones explicitas y se emite el movimiento.

### 4.5 Estados

El diagrama incluye exactamente los estados principales del enunciado. Mora 1, Mora 2, Mora 3 y Vencido aparecen unicamente en una nota como clasificacion derivada.

La recuperacion se expresa como `EN_MORA → VIGENTE`; el pago parcial conserva `EN_MORA`. `INCOBRABLE` es terminal y una recuperacion posterior solo puede producir movimientos contables.

Superar 120 dias es una guarda de elegibilidad. La transicion requiere ademas el evento autorizado `declarar incobrable`, preservando la distincion entre calculo de atraso y decision contable.

### 4.6 Actividades

La originacion muestra validaciones y puntos de terminacion sin efectos financieros. El cierre mensual muestra idempotencia antes de calcular, trabajo consolidable, exclusion de incobrables, prevencion del doble conteo de riesgo, provisiones versionadas y congelamiento append-only.

## 5. Consistencia entre diagramas

| Elemento | Casos de uso | Clases | Secuencia/actividad | Estados |
|---|---|---|---|---|
| Registrar pago | UC-07 | `RegistrarPago`, `Pago`, handlers | Secuencia completa | Puede regularizar, cancelar o permanecer en mora |
| Desembolsar | UC-06 | `DesembolsarCredito`, Factory, politicas | Secuencia y originacion | APROBADO→DESEMBOLSADO→VIGENTE |
| Mora | UC-08 | `CalculadoraMora`, `DiasAtraso`, `TramoMora` | Pago consulta obligaciones | VIGENTE↔EN_MORA; tramos no son estados |
| Reestructurar | UC-10 | `Credito`, State | Referido en aplicacion/cierre | EN_MORA→REESTRUCTURADO→EN_MORA/CANCELADO |
| Incobrable | UC-11 | `Credito`, State, `Movimiento` | Actividad de cierre lo excluye | EN_MORA→INCOBRABLE terminal |
| Cierre mensual | UC-13 | `GenerarCierre`, `CierreMensual` | Actividad completa | Consume estados, no los cambia implicitamente |
| Cartera en riesgo | UC-14 | `Cartera`, `ResultadoCarteraRiesgo` | Actividad de cierre | Usa EN_MORA/REESTRUCTURADO e INCOBRABLE |

Todos los participantes con nombre de clase utilizados en las dos secuencias existen en `02-clases.puml`. Los actores son roles externos y no se modelan como clases de dominio.

## 6. Trazabilidad incremental: requisito → UML → codigo → prueba → documento

| Requisito | Artefacto UML | Codigo previsto | Prueba prevista | Evidencia documental |
|---|---|---|---|---|
| RF-01-RF-05 | Casos de uso, clases y actividad de originacion | Modulo Originacion | Pruebas de registro, decision y transicion | Secciones 2-5 |
| RF-06, INV-01, INV-02 | Clases, desembolso y originacion | `plan-amortizacion.ts` | 12 filas de CA-01 y tasa cero | Diagramas 02, 04 y 06 |
| RF-07-RF-10, INV-08, INV-12, INV-13 | Clases y secuencia de pago | `prelacion-pago.ts`, pago | CA-03-CA-05 e idempotencia | Diagramas 02 y 03 |
| RF-11-RF-14, INV-10, INV-11 | Clases y estados | `calculadora-mora.ts` | Limites y CA-02 | Diagramas 02 y 05 |
| RF-15-RF-17, INV-04, INV-05, INV-09, INV-15, INV-16 | Clases State y diagrama de estados | Estado del credito | Transiciones validas e invalidas | Diagramas 02, 03 y 05 |
| RF-18, RF-19, INV-06 | Clases y cierre mensual | `cartera.ts` | CA-06, CA-07 y cartera cero | Diagramas 02 y 07 |
| RF-20-RF-23, INV-07, INV-17 | Clases y cierre mensual | Cierres/mayor | Idempotencia y reproduccion de saldo | Diagramas 02 y 07 |
| RF-25, RF-26, INV-18 | Clases, desembolso y originacion | Politicas versionadas | Seleccion unica/no retroactividad | Diagramas 02, 04 y 06 |
| RNF-10, RNF-16 | Puertos en clases y uso de `Reloj` | Puertos de aplicacion/secundarios | Dobles de prueba | Diagramas 02-04 y 06-07 |

La matriz exhaustiva solicitada como entregable independiente se consolidara en la Fase 5; esta tabla conserva la continuidad interna sin adelantarla.

## 7. Validaciones realizadas

| Validacion | Resultado esperado |
|---|---|
| Existen los cinco tipos UML | Casos de uso, clases, secuencia, estados y actividades. |
| Existen al menos dos secuencias | Registrar pago y desembolsar credito. |
| La secuencia de pago muestra los cuatro eslabones en orden | Gastos → Moratorio → Interes corriente → Capital. |
| Clases minimas obligatorias presentes | Cliente, SolicitudCredito, Credito, PlanAmortizacion, Cuota, Pago, Movimiento, Cierre y Dinero. |
| Clases de secuencia presentes en clases | Correspondencia nominal completa. |
| Diagrama de clases contiene atributos y operaciones | Incluidos para las clases principales. |
| Asociaciones, multiplicidades y composiciones | Representadas explicitamente. |
| Interfaces y patrones | Strategy, Chain, State, Factory y puertos visibles. |
| Ciclo de estados completo | Deterioro, recuperacion, parcial, reestructuracion, cancelacion e incobrable. |
| Tramos no modelados como estados | Solo nota/clasificacion derivada. |
| Actividad obligatoria | Se incluyeron originacion y cierre mensual. |
| Formato editable | Todos los diagramas son `.puml`. |

## 8. Decisiones pendientes

| ID | Punto | Fase prevista |
|---|---|---|
| DP-03 | Calendario institucional y ajuste por dias no habiles | Politicas/implementacion de fechas |
| DP-05 | Alcance contractual definitivo de `Idempotency-Key` | OpenAPI/Zod |
| DP-08 | Porcentajes de provision | Politicas/cierres, cuando la institucion los proporcione |
| DP-09 | Gastos y comisiones concretos | Politicas/prelacion |
| DP-11 | Reducir plazo o recalcular cuota tras amortizacion anticipada | Politica contractual futura |
| DP-13 | Renderizado automatico de PlantUML | Configuracion/documentacion; el fuente editable ya es autoritativo |

## 9. Resultado esperado

El E1 comunica quien usa el sistema, que responsabilidades existen, como colaboran en pago y desembolso, que transiciones son validas y como fluyen originacion y cierre. Los diagramas comparten nombres y reglas, y quedan listos para alimentar la matriz exhaustiva de trazabilidad de la Fase 5.
