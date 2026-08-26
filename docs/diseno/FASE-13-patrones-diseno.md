# Fase 13 — Patrones GoF y demás patrones de diseño

## 1. Objetivo y alcance

Documentar los patrones necesarios para resolver problemas concretos del Sistema de Gestión de Microcrédito y fijar su correspondencia con E3 y la futura implementación E4.

Se seleccionan seis patrones:

1. Value Object — `Dinero`;
2. Strategy — tratamiento del excedente y variaciones financieras;
3. Chain of Responsibility — prelación de pagos;
4. State — ciclo del crédito;
5. Factory — construcción del plan de amortización;
6. Repository — aislamiento de persistencia.

Strategy, Chain of Responsibility y State son patrones GoF. Factory se utiliza como fábrica de dominio; no se afirma que sea Factory Method GoF mientras no exista una jerarquía de creadores que lo justifique. Value Object y Repository son patrones de dominio/arquitectura, no GoF.

La fase documenta y modela los patrones; su implementación se realizará en las fases de código correspondientes.

## 2. Artefactos

| Código | Artefacto | Ubicación |
|---|---|---|
| PAT-DOC | Análisis de patrones | `docs/diseno/FASE-13-patrones-diseno.md` |
| PAT-PAGO | Strategy + Chain | `docs/diagramas/patrones/01-strategy-chain-pago.puml` |
| PAT-STATE | State del crédito | `docs/diagramas/patrones/02-state-credito.puml` |
| PAT-VFR | Value Object + Factory + Repository | `docs/diagramas/patrones/03-value-object-factory-repository.puml` |

## 3. Criterios de selección

| ID | Criterio | Aplicación |
|---|---|---|
| PS-01 | Existe una variación real o regla compleja | Estados, excedentes, políticas, creación del plan. |
| PS-02 | El patrón protege una invariante | Dinero, Chain, State y Factory. |
| PS-03 | El patrón reduce acoplamiento observable | Strategy y Repository. |
| PS-04 | Sus participantes tienen responsabilidades claras | Todos los patrones seleccionados. |
| PS-05 | Puede verificarse mediante pruebas de comportamiento | Contratos y escenarios definidos. |
| PS-06 | El beneficio supera clases/indirección adicionales | Se rechazan patrones sin necesidad actual. |

## 4. Value Object — `Dinero`

### 4.1 Clasificación

Patrón de Domain-Driven Design; no es GoF.

### 4.2 Problema

Representar dinero como `number` o como valores primitivos dispersa moneda, escala y redondeo. Esto permite mezclar GTQ con otra moneda, mutar importes o aplicar reglas distintas en plan, mora, pago y cierre.

### 4.3 Participantes

| Participante | Rol |
|---|---|
| `Dinero` | Value Object que encapsula importe decimal exacto y moneda. |
| `Moneda` | Value Object que identifica la unidad monetaria. |
| `decimal.js` | Detalle encapsulado futuro para aritmética decimal. |
| Plan, Cuota, Pago, Movimiento, Cierre | Clientes que usan `Dinero` sin conocer su representación. |

### 4.4 Ubicación

- Diseño: dominio compartido mínimo.
- E4 previsto: `src/dominio/dinero.ts`.
- Pruebas: `tests/dinero.test.ts` y `tests/invariantes.test.ts`.

### 4.5 Solución

`Dinero`:

- se construye desde cadena o unidades menores controladas, no desde `number`;
- normaliza a dos decimales con redondeo medio hacia arriba;
- conserva moneda;
- es inmutable;
- compara por valor;
- devuelve nuevas instancias;
- rechaza operaciones entre monedas incompatibles;
- serializa importe como cadena.

### 4.6 Invariantes protegidas

- homogeneidad de moneda INV-14;
- exactitud y redondeo RN-03/RN-04;
- operandos no modificados;
- importe observable finito y normalizado.

### 4.7 Beneficios

- una regla monetaria única;
- tipos expresivos en todo el dominio;
- evita pérdida silenciosa de precisión;
- simplifica pruebas de igualdad y conservación;
- protege futuros contratos JSON.

### 4.8 Trade-offs

- crea objetos en cada operación;
- encapsula una dependencia decimal;
- obliga a transformar entradas/salidas;
- no sustituye reglas contextuales como capital no negativo.

El costo se acepta porque exactitud domina microoptimizaciones. `Dinero` permite valores firmados para el mayor; cada agregado impone no negatividad donde corresponda.

### 4.9 Pruebas previstas

| ID | Prueba |
|---|---|
| PAT-VO-01 | Igualdad por importe normalizado y moneda. |
| PAT-VO-02 | Suma/resta inmutables y exactas. |
| PAT-VO-03 | Mezcla de monedas rechazada. |
| PAT-VO-04 | HALF_UP en positivos y negativos. |
| PAT-VO-05 | API pública no acepta `number`. |

## 5. Strategy — políticas intercambiables

### 5.1 Clasificación

Patrón de comportamiento GoF.

### 5.2 Problema

El tratamiento del excedente puede variar institucionalmente. Codificarlo en `RegistrarPago` mediante `if/switch` obliga a modificar el flujo crítico, mezcla prelación con política y aumenta el riesgo de perder el remanente.

Las conversiones de tipos de tasa también pueden variar; no deben confundirse en una fórmula única.

### 5.3 Participantes principales

| Participante GoF | Clase del dominio | Rol |
|---|---|---|
| Strategy | `PoliticaExcedente` | Define `procesar(credito, excedente, fecha)`. |
| ConcreteStrategy | `AmortizacionDirectaCapital` | Reduce directamente capital no vencido. |
| ConcreteStrategy | `PagoAnticipadoCuotas` | Aplica/reserva a obligaciones futuras. |
| Context | `RegistrarPago`/cadena | Invoca la Strategy cuando existe excedente. |
| Client/configuración | Política institucional versionada | Determina qué implementación aplica. |

### 5.4 Ubicación

- Módulo: Cartera y Cobros.
- E4 previsto: `src/dominio/prelacion-pago.ts` y archivos de políticas si la separación lo requiere.
- Diagrama: PAT-PAGO.

### 5.5 Solución

El contexto recibe una implementación por composición. Después de pagar conceptos exigibles:

1. si el remanente es cero, no invoca Strategy;
2. si es positivo, invoca la política seleccionada;
3. la implementación devuelve aplicación y remanente identificable;
4. el resultado se incorpora al `Pago` y movimientos;
5. el contrato común verifica conservación exacta.

La Strategy no decide idempotencia ni orden de prelación.

### 5.6 Invariantes protegidas

- excedente nunca perdido INV-13;
- capital nunca negativo INV-03;
- moneda homogénea INV-14;
- política/version conservada INV-18.

### 5.7 Beneficios

- cambia la política sin alterar `RegistrarPago`;
- permite pruebas de contrato comunes;
- hace auditable la estrategia aplicada;
- evita ramificación creciente;
- soporta OCP/Polymorphism/Protected Variations.

### 5.8 Trade-offs

- requiere selección/composición de Strategy;
- aumenta el número de participantes;
- ambas estrategias necesitan reglas contractuales completas;
- no resuelve todavía si amortización directa reduce plazo o cuota.

### 5.9 Pruebas previstas

| ID | Prueba |
|---|---|
| PAT-ST-01 | Amortización directa conserva todo el excedente. |
| PAT-ST-02 | Pago anticipado conserva todo el excedente. |
| PAT-ST-03 | Ambas respetan moneda y capital no negativo. |
| PAT-ST-04 | Cambiar Strategy no modifica prelación previa. |
| PAT-ST-05 | Crédito/pago conserva versión de política aplicada. |

## 6. Chain of Responsibility — prelación de pagos

### 6.1 Clasificación

Patrón de comportamiento GoF.

### 6.2 Problema

Un pago debe aplicarse en un orden obligatorio, aceptar importes parciales y entregar el excedente. Un bloque procedural grande mezcla conceptos, facilita cambiar el orden accidentalmente y complica agregar evidencia por eslabón.

### 6.3 Participantes

| Participante GoF | Clase del dominio | Rol |
|---|---|---|
| Handler | `EslabonPrelacion` | Contrato para aplicar y enlazar siguiente. |
| BaseHandler | `EslabonConceptoBase` | Implementa consumo común y delegación. |
| ConcreteHandler | `Gastos` | Consume gastos/comisiones. |
| ConcreteHandler | `Moratorio` | Consume interés moratorio. |
| ConcreteHandler | `InteresCorriente` | Consume interés corriente. |
| ConcreteHandler | `Capital` | Consume capital exigible. |
| Client | `RegistrarPago` | Construye/recibe la cadena e inicia el recorrido. |
| Request/Context | `ContextoAplicacionPago` + remanente | Pendientes, moneda y aplicaciones acumuladas. |

### 6.4 Ubicación

- Módulo: Cartera y Cobros.
- E4 previsto: `src/dominio/prelacion-pago.ts`.
- Prueba: `tests/prelacion-pago.test.ts`.
- Diagrama: PAT-PAGO.

### 6.5 Solución

La cadena se compone una vez en el orden:

`Gastos → Moratorio → InteresCorriente → Capital`

Cada handler:

1. recibe contexto y remanente;
2. calcula `consumo = min(pendiente, remanente)`;
3. registra el consumo de su concepto;
4. calcula remanente exacto;
5. delega al siguiente o devuelve el resultado.

El pago nunca se rechaza por insuficiencia. Si el remanente final es positivo, se entrega a Strategy.

### 6.6 Invariantes protegidas

- orden RN-18;
- pago parcial aceptado RN-19;
- conservación INV-12;
- pendientes/remanente no negativos;
- ningún concepto consume más de su saldo.

### 6.7 Beneficios

- lógica uniforme por concepto;
- orden visible y testeable;
- cada eslabón tiene alta cohesión;
- escenarios parciales/exactos/excedentes usan el mismo flujo;
- facilita desglose auditable.

### 6.8 Trade-offs

- el flujo se distribuye entre objetos;
- el orden debe configurarse correctamente;
- una cadena excesivamente dinámica podría violar la prelación;
- una base abstracta añade herencia pequeña.

Para controlar el riesgo, P1 expone una fábrica/configuración institucional única de cadena; los callers no suministran orden arbitrario.

### 6.9 Pruebas previstas

| ID | Prueba |
|---|---|
| PAT-CH-01 | CA-03 aplica pago exacto en orden. |
| PAT-CH-02 | CA-04 agota remanente dentro de Capital. |
| PAT-CH-03 | CA-05 entrega Q1,988.12 a Strategy. |
| PAT-CH-04 | Cada handler consume `min` sin negativos. |
| PAT-CH-05 | Una composición fuera del orden obligatorio no se expone públicamente. |

## 7. State — ciclo de vida del crédito

### 7.1 Clasificación

Patrón de comportamiento GoF.

### 7.2 Problema

El crédito tiene diez estados, operaciones permitidas distintas, deterioro, recuperación y terminales. Un gran `if/else` o `switch` central sería difícil de modificar, permitiría omitir guardas y mezclaría transiciones no relacionadas.

### 7.3 Participantes

| Participante GoF | Clase del dominio | Rol |
|---|---|---|
| Context | `Credito` | Conserva identidad, saldo, estado e historial; delega eventos. |
| State | `EstadoCreditoComportamiento` | Contrato de comportamiento por estado. |
| ConcreteState | Diez clases de estado | Implementan eventos válidos y rechazan los demás. |
| Historial | `TransicionEstado` | Evidencia anterior/nuevo/fecha/actor/motivo. |

Estados concretos:

- `EstadoSolicitado`;
- `EstadoAprobado`;
- `EstadoRechazado`;
- `EstadoDesembolsado`;
- `EstadoVigente`;
- `EstadoEnMora`;
- `EstadoReestructurado`;
- `EstadoAnulado`;
- `EstadoCancelado`;
- `EstadoIncobrable`.

### 7.4 Ubicación

- Módulo: Cartera y Cobros, con coordinación inicial desde Originación.
- E4 previsto: archivos adicionales de `Credito`/estados en `src/dominio`.
- Prueba: `tests/credito-estado.test.ts`.
- Diagrama: PAT-STATE y UML-ES.

### 7.5 Solución

`Credito` delega cada evento al objeto estado actual. Un estado concreto:

- ejecuta únicamente eventos válidos;
- verifica guardas propias;
- solicita al contexto una transición controlada;
- el contexto crea `TransicionEstado` y cambia el estado atómicamente;
- eventos no admitidos producen error específico sin efectos.

Mora 1/2/3 y Vencido no son States: son clasificación derivada. `EstadoEnMora` sigue siendo el comportamiento principal durante esos tramos.

### 7.6 Invariantes protegidas

- SOLICITADO/RECHAZADO no admiten pagos INV-04/05;
- regularización retorna a VIGENTE INV-09;
- historial completo INV-15;
- INCOBRABLE no se reactiva INV-16;
- capital/operación no cambia ante evento inválido.

### 7.7 Beneficios

- transición y comportamiento localizados;
- elimina un selector central creciente;
- pruebas por estado/evento;
- hace terminales explícitos;
- admite recuperación sin convertir tramos en estados.

### 7.8 Trade-offs

- diez clases de estado y una base común;
- navegar el flujo requiere diagrama/pruebas;
- comportamiento duplicado pequeño puede requerir una base controlada;
- agregar un evento al contrato puede tocar estados para rechazo explícito.

Se acepta el último costo porque fuerza a decidir conscientemente el comportamiento de cada estado.

### 7.9 Pruebas previstas

| ID | Prueba |
|---|---|
| PAT-SV-01 | Todas las transiciones mostradas son posibles con guardas. |
| PAT-SV-02 | Toda transición no mostrada falla sin cambiar saldo/historial. |
| PAT-SV-03 | Pago parcial conserva EN_MORA; total vencido regulariza. |
| PAT-SV-04 | Terminales rechazan reactivación. |
| PAT-SV-05 | Cada transición agrega cinco datos obligatorios. |

## 8. Factory — plan de amortización válido

### 8.1 Clasificación

Fábrica de dominio. No se clasifica como Factory Method GoF en P1 porque no necesita subclases de creador ni un método fábrica polimórfico.

### 8.2 Problema

Crear un plan requiere fórmula, precisión intermedia, redondeo periódico, fechas, 3–24 cuotas y ajuste final. Permitir que cualquier cliente construya cuotas individualmente podría producir un conjunto cuyo capital no cuadra o saldo final no es cero.

### 8.3 Participantes

| Participante | Rol |
|---|---|
| `FabricaPlanAmortizacion` | Recibe datos completos, ejecuta algoritmo y valida. |
| `PlanAmortizacion` | Producto consistente. |
| `Cuota` | Elemento creado por período. |
| `Dinero`, `Tasa`, `Plazo`, calendario | Entradas tipadas. |
| `DesembolsarCredito` | Cliente que solicita un plan; no crea cuotas. |

### 8.4 Ubicación

- Módulo: Cálculo financiero.
- E4 previsto: `src/dominio/plan-amortizacion.ts`.
- Prueba: `tests/plan-amortizacion.test.ts`.
- Diagrama: PAT-VFR.

### 8.5 Solución

La fábrica:

1. valida capital, tasa, plazo y calendario;
2. calcula cuota normal o caso tasa cero;
3. crea primeras `n-1` filas;
4. ajusta la última amortización al saldo anterior;
5. calcula la última cuota;
6. construye el plan;
7. valida suma de amortizaciones y saldo final;
8. retorna el producto completo o falla sin entregar un plan parcial.

### 8.6 Invariantes protegidas

- Σ amortizaciones = capital INV-01;
- saldo final cero INV-02;
- capital nunca negativo INV-03;
- moneda homogénea INV-14;
- plazo y monto válidos.

### 8.7 Beneficios

- construcción compleja localizada;
- producto válido desde su nacimiento;
- API simple para `DesembolsarCredito`;
- evita setters y planes parcialmente construidos;
- prueba completa del algoritmo en un punto.

### 8.8 Trade-offs

- añade un participante;
- debe recibir varias entradas explícitas;
- si aparecen múltiples métodos de amortización podría evolucionar a Strategy/Factory especializada, pero no se anticipa ahora.

### 8.9 Pruebas previstas

| ID | Prueba |
|---|---|
| PAT-FA-01 | CA-01 compara 12 filas y totales. |
| PAT-FA-02 | Tasa cero genera plan válido. |
| PAT-FA-03 | Última cuota absorbe diferencia y termina cero. |
| PAT-FA-04 | Entrada inválida no retorna plan parcial. |
| PAT-FA-05 | Clientes no pueden construir lista contractual inconsistente. |

## 9. Repository — aislamiento de persistencia

### 9.1 Clasificación

Patrón de Domain-Driven Design/arquitectura; no es GoF.

### 9.2 Problema

Los casos de uso necesitan recuperar y conservar agregados, pero el núcleo no puede depender de PostgreSQL, ORM o colecciones de prueba. Una interfaz CRUD genérica además permitiría operaciones inválidas como eliminar movimientos.

### 9.3 Participantes

| Participante | Rol |
|---|---|
| Interfaces `Repositorio*` | Contratos definidos por necesidades de aplicación. |
| Casos de uso | Clientes de repositorios. |
| Agregados/proyecciones | Objetos recuperados/conservados. |
| Adaptadores en memoria | Dobles o adaptadores de prueba. |
| Adaptadores PostgreSQL futuros | Implementación real fuera de P1. |
| `UnidadDeTrabajo` | Coordina confirmación atómica entre repositorios. |

### 9.4 Ubicación

- Contratos: puertos secundarios.
- Implementación en memoria: pruebas cuando sea necesaria.
- Implementación real: Proyecto Final.
- Diagrama: PAT-VFR y C4-N3.

### 9.5 Solución

Se define un repositorio por agregado/capacidad:

- clientes;
- solicitudes;
- créditos;
- pagos;
- movimientos;
- cierres;
- políticas.

Los casos de uso reciben interfaces. Los adaptadores implementan contratos y reconstruyen agregados sin decidir reglas. `RepositorioMovimientos` ofrece anexar/consultar, no actualizar/eliminar.

### 9.6 Invariantes protegidas

- identidad de agregados;
- idempotencia de pagos/cierres;
- append-only del mayor;
- no filtrar estados parcialmente inválidos;
- semántica equivalente entre memoria y persistencia futura.

### 9.7 Beneficios

- núcleo independiente de infraestructura;
- pruebas sin base de datos;
- contratos semánticos en lugar de CRUD;
- tecnología sustituible;
- permite control de concurrencia/UoW futuro sin cambiar entidades.

### 9.8 Trade-offs

- mapeo entre almacenamiento y agregados;
- más interfaces/adaptadores;
- consultas de reporte pueden necesitar proyecciones especializadas;
- dobles demasiado simples pueden incumplir LSP.

Las pruebas de contrato deberán exigir idempotencia, identidad y errores equivalentes.

### 9.9 Pruebas previstas

| ID | Prueba |
|---|---|
| PAT-RE-01 | Guardar/obtener conserva identidad y estado. |
| PAT-RE-02 | Buscar Idempotency-Key encuentra la operación previa. |
| PAT-RE-03 | Movimientos solo se anexan. |
| PAT-RE-04 | No encontrado es explícito. |
| PAT-RE-05 | Adaptadores pasan contrato compartido. |

## 10. Colaboración de patrones en casos críticos

### 10.1 Registrar pago

```text
Repository carga Crédito/Pago previo
  → State valida que el crédito permite pagar
  → Chain aplica conceptos en orden
  → Strategy procesa excedente
  → Value Object conserva exactitud
  → Repository/UoW confirma Pago, Crédito y Movimientos
```

Ningún patrón sustituye a otro: State responde “¿se puede?”, Chain “¿en qué orden?”, Strategy “¿qué hacer con el remanente?”, Value Object “¿cómo preservar exactitud?” y Repository “¿cómo aislar almacenamiento?”.

### 10.2 Desembolsar crédito

```text
Repository obtiene Solicitud
  → política versionada aporta parámetros
  → Factory crea Plan usando Dinero
  → State ejecuta APROBADO→DESEMBOLSADO→VIGENTE
  → Repository/UoW confirma Crédito y Movimiento
```

## 11. Matriz patrón → problema → participantes → ubicación → solución → beneficio → trade-off

| Patrón | Problema | Participantes principales | Ubicación | Solución | Beneficio | Trade-off |
|---|---|---|---|---|---|---|
| Value Object | Primitivos monetarios inseguros | Dinero, Moneda | Compartido | Encapsular valor/operaciones | Exactitud única | Más objetos/conversión |
| Strategy (GoF) | Excedente variable | Política, Strategies, contexto | Cartera/Cobros | Composición sustituible | OCP/auditoría | Más implementaciones |
| Chain (GoF) | Prelación secuencial/parcial | Handler, cuatro eslabones | Cartera/Cobros | Delegación ordenada | Orden visible | Flujo distribuido |
| State (GoF) | Ciclo complejo | Crédito, State, diez estados | Cartera/Cobros | Delegar por estado | Inválidas imposibles | Más clases |
| Factory | Construcción global del plan | Fábrica, Plan, Cuota | Cálculo | Crear/validar como unidad | Nunca parcial | Participante adicional |
| Repository | Persistencia variable | Interfaces, casos, adaptadores | Puertos secundarios | Abstraer colecciones de agregados | DIP/testabilidad | Mapeo/contratos |

## 12. Patrones considerados y rechazados por ahora

| Patrón | Motivo para no introducirlo en P1 |
|---|---|
| Observer/Event Bus de infraestructura | No existe integración asíncrona ni necesidad de consistencia eventual. Se permiten hechos locales sin bus. |
| Template Method general | La base de handlers puede compartir consumo, pero no se presenta como patrón principal innecesario. |
| Specification | Los criterios institucionales de evaluación aún no están definidos; una abstracción sería prematura. |
| Builder | El plan se crea de una vez mediante algoritmo; un builder permitiría estados parciales. |
| Command GoF | Los comandos de aplicación son DTO inmutables, pero no requieren historial/undo/objeto ejecutable GoF. |
| Abstract Factory | No hay familias completas de objetos intercambiables. |
| Singleton | Introduciría estado global y dañaría testabilidad. |
| Microkernel/Plugin | No existe ecosistema de extensiones en P1. |

## 13. Relación con SOLID y GRASP

| Patrón | SOLID | GRASP |
|---|---|---|
| Value Object | SRP | Information Expert, High Cohesion |
| Strategy | OCP, LSP, DIP | Polymorphism, Protected Variations |
| Chain | SRP, OCP, LSP | Polymorphism, High Cohesion |
| State | SRP, OCP, LSP | Information Expert, Polymorphism |
| Factory | SRP | Creator, Information Expert |
| Repository | ISP, DIP, LSP | Low Coupling, Protected Variations |

## 14. Correspondencia E1–E4

| Patrón | E1 UML | E2/E3 | E4 previsto |
|---|---|---|---|
| Value Object | `Dinero` en clases | Compartido/Cálculo | `dinero.ts` |
| Strategy | Clases/secuencia pago | Cartera/Cobros | `prelacion-pago.ts`/políticas |
| Chain | Clases/secuencia pago | Cartera/Cobros | `prelacion-pago.ts` |
| State | Clases/estados/secuencias | Crédito | Archivos Crédito/estados |
| Factory | Clases/desembolso | Cálculo | `plan-amortizacion.ts` |
| Repository | Interfaces/secuencias | Puertos secundarios | Interfaces + dobles de prueba |

## 15. Trazabilidad incremental

| Requisito/invariante | Patrón | Evidencia de diseño | Prueba futura |
|---|---|---|---|
| RNF-01, RN-03/04, INV-14 | Value Object | PAT-VFR | PAT-VO-01–05 |
| RF-09, RN-20, INV-13 | Strategy | PAT-PAGO | PAT-ST-01–05, CA-05 |
| RF-07/08, RN-18/19, INV-12 | Chain | PAT-PAGO | PAT-CH-01–05, CA-03/04/05 |
| RF-15–17, INV-04/05/09/15/16 | State | PAT-STATE | PAT-SV-01–05 |
| RF-06, INV-01/02/03 | Factory | PAT-VFR | PAT-FA-01–05, CA-01 |
| RF-10/22/23, RNF-16 | Repository | PAT-VFR/C4-N3 | PAT-RE-01–05 |

## 16. Decisiones adoptadas

| ID | Decisión | Consecuencia |
|---|---|---|
| D13-01 | Implementar/documentar seis patrones con necesidad demostrada. | Supera mínimo sin llenar el diseño de patrones arbitrarios. |
| D13-02 | Reconocer tres GoF: Strategy, Chain y State. | Se supera el mínimo de dos GoF. |
| D13-03 | No llamar GoF a Value Object, Repository o fábrica simple. | Clasificación técnicamente precisa. |
| D13-04 | Fijar una composición institucional de Chain. | Los clientes no alteran el orden obligatorio. |
| D13-05 | Hacer que State rechace explícitamente eventos no válidos. | Toda operación tiene resultado auditable. |
| D13-06 | Usar Factory que no entrega planes parciales. | Invariantes globales desde creación. |
| D13-07 | Exigir pruebas de contrato para implementaciones sustituibles. | Strategy/State/Repository cumplen LSP. |

## 17. Decisiones pendientes

| ID | Punto | Resolución prevista |
|---|---|---|
| DP-11 | Reducir plazo o cuota tras amortización directa | Política contractual futura |
| DP-30 | Segregación final de interfaces repositorio | Fase 15 |
| DP-32 | Rehidratación de agregados | Proyecto Final |
| DP-33 | Base abstracta compartida de handlers/estados | Implementación; solo si reduce duplicación sin ocultar reglas |

## 18. Validación contra el enunciado

| Criterio | Evidencia | Estado |
|---|---|---|
| Mínimo cuatro patrones | Se documentan seis | Cumplido |
| Mínimo dos GoF | Strategy, Chain y State | Cumplido |
| Value Object — Dinero | Sección 4 | Cumplido |
| Strategy | Sección 5 | Cumplido |
| Chain of Responsibility | Sección 6 | Cumplido |
| State | Sección 7 | Cumplido |
| Factory | Sección 8 | Cumplido |
| Repository adicional justificado | Sección 9 | Cumplido |
| Problema/participantes/ubicación/solución/beneficio/trade-off | Secciones 4–11 | Cumplido |
| Diagramas PlantUML útiles | PAT-PAGO, PAT-STATE y PAT-VFR | Cumplido |
| Correspondencia E3/E4 | Sección 14 | Cumplido |
| Sin patrones innecesarios | Sección 12 | Cumplido |
| Sin código prematuro | Solo documentación/PlantUML | Cumplido |

## 19. Resultado esperado

El diseño utiliza patrones como herramientas concretas: Dinero protege exactitud; Strategy protege políticas variables; Chain protege la prelación; State protege el ciclo; Factory protege la creación del plan; Repository protege al núcleo de persistencia. Sus contratos e invariantes quedan preparados para implementación y pruebas sin introducir abstracciones especulativas.
