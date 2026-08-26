# Fase 12 — Aplicación concreta de GRASP

## 1. Objetivo y alcance

Asignar responsabilidades de manera coherente con el conocimiento y las colaboraciones del dominio mediante GRASP. El análisis cubre:

- Information Expert;
- Creator;
- Controller;
- Low Coupling;
- High Cohesion;
- Polymorphism;
- Protected Variations.

No se presentan como definiciones aisladas. Cada decisión se relaciona con componentes de E3, problemas evitados y verificaciones posteriores. Esta fase no implementa TypeScript.

## 2. Resumen de aplicación

| GRASP | Decisión principal | Elementos | Resultado esperado |
|---|---|---|---|
| Information Expert | La responsabilidad reside donde está la información necesaria | Dinero, Plan, Cuota, Crédito, Pago, Cartera, Mayor | Menos consultas y lógica desplazada |
| Creator | Crea quien contiene, registra, usa estrechamente o posee datos de inicialización | Fábrica de plan, casos de uso, agregados | Construcción válida y localizada |
| Controller | Un controlador de caso de uso recibe el evento del sistema | Servicios de aplicación | UI/API/MCP sin reglas |
| Low Coupling | Colaboración mediante puertos, IDs y APIs públicas | Módulos, repositorios, reloj | Cambios localizados y tests aislados |
| High Cohesion | Responsabilidades relacionadas permanecen juntas | Módulos de negocio y cálculo puro | Código comprensible y estable |
| Polymorphism | Variaciones de comportamiento se resuelven por contrato | State, Strategy, Chain, puertos | Sin condicionales centrales crecientes |
| Protected Variations | Puntos inestables quedan detrás de fronteras estables | Políticas, tiempo, IDs, persistencia, canales | Evolución sin reescribir el núcleo |

## 3. Information Expert

### 3.1 Criterio de asignación

La responsabilidad se asigna al objeto o módulo que posee la información necesaria para cumplirla, siempre que eso no destruya cohesión ni introduzca dependencias inadecuadas.

### 3.2 Expertos seleccionados

| Responsabilidad | Experto | Información que posee | Decisión concreta |
|---|---|---|---|
| Validar moneda y operar importes | `Dinero` | importe normalizado y moneda | Rechaza mezcla y devuelve nuevos valores. |
| Calcular interés/amortización de una fila | Fábrica/algoritmo de plan con `Cuota` | saldo anterior, tasa, número y regla de redondeo | Construye cada fila sin consultar crédito/persistencia. |
| Validar totales/saldo final | `PlanAmortizacion` | todas las cuotas y capital original | Comprueba suma de amortizaciones y Q0.00 final. |
| Determinar capital vencido de una cuota | `Cuota` | componentes, pagos y fecha de vencimiento | Expone solo el capital pendiente vencido. |
| Calcular días/tramo/moratorio | `CalculadoraMora` | fecha contractual, corte, política y capital vencido recibido | Produce un resultado puro por cuota. |
| Autorizar transición/operación | Estado actual del `Credito` | comportamiento permitido por estado | Ejecuta transición válida o falla sin efecto. |
| Proteger saldo contractual | `Credito` | saldo, plan, pagos y estado | Impide capital negativo y cancelación inválida. |
| Verificar conservación del pago | `AplicacionPago` | desglose por conceptos y remanente | Compara suma exacta con importe recibido. |
| Resolver consumo de un concepto | Handler correspondiente | pendiente del concepto y remanente | Consume `min(pendiente, remanente)`. |
| Determinar si crédito está en riesgo | `Cartera` | saldo, estado, atraso y reestructuración de la proyección | Incluye saldo completo una sola vez. |
| Reproducir saldo | `Mayor` | secuencia de movimientos firmados | Suma hechos append-only. |
| Elegir política vigente | `SelectorPolitica` | versiones, ámbitos e intervalos | Exige exactamente una coincidencia. |

### 3.3 Decisiones que no siguen Expert por conflicto de calidad

Information Expert no obliga a cargar toda la información en una entidad.

| Responsabilidad | Candidato aparente | Asignación real | Motivo |
|---|---|---|---|
| Calcular cartera global | Cada `Credito` | `Cartera` | Un crédito no conoce los demás ni el denominador. |
| Seleccionar política | `Credito` | `SelectorPolitica` antes del otorgamiento | Crédito conserva versión, pero no conoce catálogo/vigencias globales. |
| Guardarse a sí mismo | Agregado | Servicio de aplicación + repositorio | Persistencia violaría pureza/DIP. |
| Obtener fecha actual | Calculadora | Aplicación mediante `Reloj` | El cálculo no debe conocer el entorno. |
| Mapear error a HTTP | Error de dominio | Adaptador futuro | HTTP no pertenece al dominio. |

### 3.4 Problemas evitados

- servicios procedurales que inspeccionan atributos internos para decidir;
- DTO con lógica financiera;
- repositorio que calcula reglas por tener acceso a datos;
- duplicación de validación de moneda/redondeo;
- objeto Crédito que conoce la cartera completa.

### 3.5 Verificación prevista

| ID | Verificación |
|---|---|
| GR-IE-01 | Toda operación monetaria binaria delega compatibilidad a `Dinero`. |
| GR-IE-02 | `PlanAmortizacion` valida sus totales sin consulta externa. |
| GR-IE-03 | State, no el controlador, decide si el estado admite el evento. |
| GR-IE-04 | `AplicacionPago` demuestra conservación del importe. |
| GR-IE-05 | `Mayor` reproduce saldo exclusivamente desde movimientos. |

## 4. Creator

### 4.1 Criterio de asignación

Se asigna creación a quien contiene, agrega, registra, usa estrechamente o dispone de los datos iniciales necesarios. Cuando la construcción requiere un algoritmo/invariantes de conjunto, se utiliza una fábrica especializada.

### 4.2 Asignaciones de creación

| Objeto creado | Creador | Justificación GRASP | Validación posterior |
|---|---|---|---|
| `Dinero` | Fábricas estáticas de `Dinero` | El VO conoce formato, moneda y normalización. | Entradas inválidas no crean instancia. |
| `EvaluacionCredito` | `SolicitudCredito` o caso de uso delegando al agregado | Solicitud agrega y registra evaluaciones; protege secuencia. | No agregar a solicitud terminal. |
| `PlanAmortizacion`/`Cuota` | `FabricaPlanAmortizacion` | Posee datos y algoritmo; valida el conjunto antes de retornarlo. | Nunca retorna plan parcial/inválido. |
| `Credito` | Caso `DesembolsarCredito` mediante fábrica/constructor de dominio | Reúne solicitud aprobada, política, plan, ID y fecha. | Solo desde aprobación válida. |
| `TransicionEstado` | `Credito`/contexto State | Crédito compone historial y conoce anterior/nuevo. | Cinco campos obligatorios. |
| `Pago` | `RegistrarPago` mediante fábrica de dominio | Caso de uso reúne ID, crédito, importe, corte y clave. | Estado/idempotencia validados antes. |
| `AplicacionPago` | Cadena de prelación | La cadena produce todos los componentes y remanente. | Conservación exacta. |
| `Movimiento` | Fábrica/servicio de mayor a partir de hecho confirmado | Mayor conoce contrato contable; aplicación aporta origen. | Identidad, concepto, fecha e importe completos. |
| `CierreDiario/Mensual` | `GenerarCierre` mediante fábrica/constructor de cierre | Caso reúne período, movimientos, riesgo y políticas. | Idempotencia antes de crear. |
| `PoliticaFinanciera` | `AdministrarPolitica` mediante fábrica de política | Reúne versión, vigencia, autor, parámetros y huella. | No activa superposición. |

### 4.3 Creaciones rechazadas

| Diseño rechazado | Problema |
|---|---|
| `new Cuota(...)` desde controlador/API | Omite algoritmo y validación global del plan. |
| `new Credito(...)` desde adaptador | Permite saltar solicitud, política y caso de uso. |
| Entidad que hace `new Repositorio...` | Acopla dominio a infraestructura. |
| Repositorio que crea reglas/estados por su cuenta | Rehidratar se confunde con decidir negocio. |
| Handler individual que crea `Pago` completo | Solo conoce un concepto, no toda la operación. |

Rehidratar un agregado futuro desde persistencia no equivale a originar un nuevo hecho de negocio. El adaptador reconstruye el estado previamente validado mediante un mecanismo controlado, sin repetir transiciones ni generar eventos.

### 4.4 Verificación prevista

| ID | Verificación |
|---|---|
| GR-CR-01 | Solo la fábrica del plan crea la colección contractual de cuotas. |
| GR-CR-02 | Crédito solo se origina desde una aprobación válida y plan completo. |
| GR-CR-03 | Cada transición se crea dentro del contexto Crédito/State. |
| GR-CR-04 | Adaptadores no construyen agregados saltando casos de uso. |
| GR-CR-05 | Rehidratación no emite hechos ni repite reglas de creación. |

## 5. Controller

### 5.1 Controladores del sistema

GRASP Controller se asigna a servicios de aplicación orientados a intención, no a controladores HTTP ni a una única fachada gigantesca.

| Evento del sistema | Controller de aplicación | Delegaciones principales |
|---|---|---|
| Registrar cliente | `RegistrarCliente` | repositorio, ID, `Cliente`, UoW |
| Solicitar crédito | `SolicitarCredito` | cliente, `SolicitudCredito`, política de producto |
| Evaluar/decidir | `EvaluarYDecidirSolicitud` | solicitud, política, State/decisión, UoW |
| Desembolsar | `DesembolsarCredito` | reloj, solicitud, selector, fábrica plan, crédito, mayor, UoW |
| Registrar pago | `RegistrarPago` | idempotencia, crédito/State, Chain, Strategy, mayor, UoW |
| Actualizar mora | `ActualizarMora` | reloj, cuotas, calculadora, crédito/State |
| Reestructurar | `ReestructurarCredito` | autorización, crédito, política, nuevo plan |
| Generar cierre | `GenerarCierre` | idempotencia, movimientos, cartera, política, UoW |
| Consultar riesgo | `ConsultarCarteraEnRiesgo` | reloj, repositorio, `Cartera` |
| Administrar política | `AdministrarPolitica` | repositorio, selector/validación, ID, UoW |

### 5.2 Responsabilidad del Controller

Un Controller:

1. valida la forma básica del comando ya tipado;
2. resuelve fecha e identidad por puertos;
3. verifica idempotencia cuando corresponde;
4. carga agregados/proyecciones;
5. delega reglas a expertos del dominio;
6. coordina efectos y unidad de trabajo;
7. devuelve resultado o error de aplicación.

No calcula cuotas, no inspecciona estado para sustituir State, no aplica conceptos por sí mismo y no formatea respuestas HTTP.

### 5.3 Controladores externos futuros

Un controlador HTTP, handler MCP o acción UI es un adaptador. Traduce entrada y llama al Controller GRASP de aplicación. Por ejemplo:

```text
POST /creditos/{id}/pagos ─┐
MCP registrar_pago ─────────┼──> RegistrarPago.execute(comando)
CLI registrar-pago ─────────┘
```

### 5.4 Problemas evitados

- entidad que coordina repositorios y transacciones;
- controlador HTTP con lógica financiera;
- fachada `SistemaMicrocredito` responsable de todos los eventos;
- caso de uso que no delega a expertos;
- distintos flujos para API y MCP.

### 5.5 Verificación prevista

| ID | Verificación |
|---|---|
| GR-CO-01 | Cada puerto primario tiene un Controller de aplicación identificable. |
| GR-CO-02 | Controllers no contienen fórmulas financieras. |
| GR-CO-03 | Controllers no dependen de adaptadores concretos. |
| GR-CO-04 | Un mismo Controller puede invocarse desde prueba/API/MCP. |
| GR-CO-05 | No existe una fachada única con todos los casos de uso. |

## 6. Low Coupling

### 6.1 Decisiones de bajo acoplamiento

| Colaboración | Mecanismo | Acoplamiento evitado |
|---|---|---|
| Aplicación ↔ persistencia | Puertos de repositorio/UoW | ORM, SQL y transacción concreta. |
| Aplicación ↔ tiempo | `Reloj` | Fecha global. |
| Aplicación ↔ IDs | `GeneradorIds` | UUID concreto. |
| Canal ↔ núcleo | Puerto primario/comando | HTTP/MCP/UI dentro del dominio. |
| Agregado ↔ agregado | Identidad/API pública | Mutación interna cruzada. |
| Cierres ↔ Cartera | Proyección/servicio público | Cierre modificando crédito. |
| Crédito ↔ política | Referencia e instantánea | Catálogo mutable dentro del agregado. |
| Pago ↔ mayor | Hecho/resultado coordinado por aplicación | Pago persistiendo movimientos. |
| Cálculo ↔ entorno | Parámetros puros | Repositorio, reloj o variables globales. |

### 6.2 Dependencias aceptadas

Bajo acoplamiento no significa cero colaboración. Se aceptan dependencias estables y semánticas:

- `PlanAmortizacion` depende de `Dinero`;
- `Credito` contiene su plan contractual;
- Cartera/Cobros usa Cálculo financiero;
- aplicación depende del dominio;
- adaptadores futuros dependen de puertos.

Eliminar estas relaciones introduciría DTO anémicos, duplicación o indirección sin beneficio.

### 6.3 Control de cambios

| Cambio | Componentes que deberían cambiar | Componentes que no deberían cambiar |
|---|---|---|
| Sustituir PostgreSQL | Adaptador/composición | Dominio y casos de uso |
| Cambiar formato HTTP | Contratos/adaptador API | Dominio, repositorios y cálculos |
| Agregar MCP | Adaptador MCP/composición | Fórmulas y estados |
| Nueva tasa prospectiva | Política/configuración y quizá Strategy de conversión | Créditos históricos/algoritmos estables |
| Nueva fórmula de provisión | Política/servicio de provisión/cierre | Pago y plan |
| Cambiar regla de mora | Calculadora/política y pruebas relacionadas | Originación y API |

### 6.4 Verificación prevista

| ID | Verificación |
|---|---|
| GR-LC-01 | Grafo de imports sin ciclos entre módulos. |
| GR-LC-02 | Cambiar adaptador no modifica dominio. |
| GR-LC-03 | Referencias entre agregados usan IDs/API pública. |
| GR-LC-04 | Cálculo financiero tiene cero dependencias en puertos. |
| GR-LC-05 | Contratos externos no filtran tipos de infraestructura al núcleo. |

## 7. High Cohesion

### 7.1 Cohesión por módulo

| Módulo | Conjunto cohesivo | Elementos excluidos para preservarlo |
|---|---|---|
| Originación | Cliente, solicitud, evaluación, decisión, preparación de desembolso | Pagos, cartera global, cierres |
| Cálculo financiero | Dinero, tasa, plan, interés, mora matemática | Estados, repositorios, usuarios |
| Cartera/Cobros | Crédito, State, pago, prelación, excedente, saldo | Contratos HTTP y cierre consolidado |
| Cierres/Riesgo | Movimientos, mayor, cierres, cartera en riesgo, provisiones | Procesamiento interno de pagos |
| Políticas | Versiones, vigencia, parámetros, selección | Fórmulas consumidoras |
| Aplicación | Orquestación por caso de uso | Reglas matemáticas y presentación |

### 7.2 Cohesión dentro de clases

| Clase | Por qué sus operaciones pertenecen juntas |
|---|---|
| `Dinero` | Todas mantienen semántica monetaria exacta. |
| `Credito` | Todas protegen el mismo ciclo/saldo/historial contractual. |
| `AplicacionPago` | Sus datos y operaciones prueban la distribución de un pago. |
| `SelectorPolitica` | Todas resuelven aplicabilidad/ambigüedad de versiones. |
| `Mayor` | Todas agregan o reproducen movimientos inmutables. |

### 7.3 Señales de pérdida de cohesión

- nombre genérico `Utils`, `Helpers`, `Manager` o `Service` sin capacidad;
- clase cambia por razones de UI, persistencia y negocio;
- módulo compartido importa módulos de negocio;
- servicio de aplicación contiene fórmulas extensas;
- `Credito` calcula indicadores de toda la cartera;
- `Cierre` registra pagos.

### 7.4 Verificación prevista

| ID | Verificación |
|---|---|
| GR-HC-01 | Cada clase tiene una responsabilidad/razón de cambio documentable. |
| GR-HC-02 | No se crean módulos `utils` para reglas sin propietario. |
| GR-HC-03 | El compartido solo contiene semántica universal. |
| GR-HC-04 | Tests de una regla se ubican junto al módulo responsable. |
| GR-HC-05 | Cambios de un requisito afectan un conjunto pequeño y relacionado. |

## 8. Polymorphism

### 8.1 Variaciones resueltas polimórficamente

| Variación | Contrato | Implementaciones previstas | Cliente |
|---|---|---|---|
| Estado del crédito | `EstadoCreditoComportamiento` | Solicitado, Aprobado, Rechazado, Desembolsado, Vigente, EnMora, Reestructurado, Anulado, Cancelado, Incobrable | `Credito` |
| Tratamiento de excedente | `PoliticaExcedente` | Amortización directa, pago anticipado | `RegistrarPago`/Chain |
| Eslabón de prelación | `EslabonPrelacion` | Gastos, Moratorio, Interés corriente, Capital | Cadena de pago |
| Persistencia | Puertos repositorio | En memoria de prueba, PostgreSQL futuro | Casos de uso |
| Tiempo | `Reloj` | Fijo/falso, sistema futuro | Casos de uso |
| Identidad | `GeneradorIds` | Secuencial de prueba, UUID futuro | Casos de uso |
| Canal | Puerto primario | Prueba/CLI, API, MCP, UI indirecta | Aplicación |

### 8.2 Decisión de usar composición

State y Strategy se inyectan/componen. No se hereda `Credito` para crear `CreditoEnMora`, porque cambiaría identidad/tipo al transicionar. `Credito` conserva identidad y delega comportamiento a un estado.

Los handlers comparten contrato, pero cada uno conoce únicamente su concepto. El orden se compone al construir la cadena y no depende del tipo concreto mediante `instanceof`.

### 8.3 Condicionales legítimos

Polymorphism no elimina toda condición:

- clasificar un entero de días en intervalos es una función pura y finita;
- el caso especial tasa cero evita división inválida en la fórmula;
- comprobar si existe excedente decide si se invoca Strategy;
- discriminar `SIN_CARTERA_ACTIVA` es parte del tipo de resultado.

Se evita polimorfismo artificial cuando una tabla o función pura expresa mejor una regla cerrada.

### 8.4 Verificación prevista

| ID | Verificación |
|---|---|
| GR-PO-01 | Crédito no contiene `switch` central de estados. |
| GR-PO-02 | RegistrarPago no contiene `switch` de Strategy. |
| GR-PO-03 | Cadena no usa `instanceof` para ordenar/ejecutar handlers. |
| GR-PO-04 | Implementaciones pasan contratos LSP compartidos. |
| GR-PO-05 | No se introducen subclases donde una función cerrada es suficiente. |

## 9. Protected Variations

### 9.1 Puntos de variación protegidos

| Punto inestable | Protección estable | Consumidores protegidos | Riesgo mitigado |
|---|---|---|---|
| Tasas y vigencias | `PoliticaFinanciera` + selector + versión | Plan, mora, cierres | Tasa quemada/cambio retroactivo. |
| Tratamiento excedente | `PoliticaExcedente` | RegistrarPago | Reescribir flujo de pago. |
| Ciclo por estado | State | Crédito/casos de uso | Condicional central frágil. |
| Persistencia | Repositorios/UoW | Aplicación/dominio | Dependencia de ORM/BD. |
| Fecha del sistema | `Reloj` + `FechaCorte` | Todos los cálculos temporales | No determinismo. |
| Identificadores | `GeneradorIds` | Casos de uso | Acoplamiento a UUID. |
| Canales | Puertos primarios | Dominio/aplicación | Reglas duplicadas en API/MCP/UI. |
| Formato externo | Zod/DTO futuro | Entidades/VO | JSON/HTTP contaminando dominio. |
| Provisión | Política versionada | Cierre mensual | Porcentajes incrustados. |
| Calendario no hábil | Política de calendario | Fábrica del plan/mora | Fechas cambiantes dispersas. |

### 9.2 Fronteras que conservan historia

Protected Variations no solo protege código frente a cambios; protege resultados históricos:

- crédito conserva versión e instantánea de política;
- cierre conserva versión de provisión y huella;
- movimiento es inmutable;
- corrección usa compensación;
- plan conserva fechas contractuales generadas.

### 9.3 Variaciones no protegidas todavía

No se crean abstracciones para hipótesis sin evidencia:

| Hipótesis | Decisión actual |
|---|---|
| Múltiples monedas con FX | Fuera de alcance; mezcla se rechaza. |
| Varios métodos de amortización | Solo francesa; Factory permite evolución sin implementar métodos ficticios. |
| Microservicios | No; módulos lógicos antes de distribución. |
| Múltiples motores de reglas | No; políticas tipadas suficientes. |
| Varios proveedores de mensajería | No existe integración en P1. |

### 9.4 Verificación prevista

| ID | Verificación |
|---|---|
| GR-PV-01 | Nueva versión de tasa no modifica créditos existentes. |
| GR-PV-02 | Cambiar reloj/repositorio/ID no modifica dominio. |
| GR-PV-03 | API/MCP futuros reutilizan puertos comunes. |
| GR-PV-04 | Movimiento/cierre/política usados no se sobrescriben. |
| GR-PV-05 | No existen abstracciones especulativas fuera de variaciones identificadas. |

## 10. Matriz GRASP → clase/módulo → problema → decisión

| GRASP | Clase/módulo | Problema evitado | Decisión tomada |
|---|---|---|---|
| Information Expert | `Dinero` | Redondeo/moneda duplicados | Operaciones monetarias en el VO. |
| Information Expert | `PlanAmortizacion` | Validación global fuera del plan | El plan valida totales/saldo final. |
| Information Expert | `Credito`/State | Controlador inspecciona estados | Estado decide operaciones/transiciones. |
| Information Expert | `Cartera` | Crédito conoce cartera global | Servicio calcula sobre proyecciones. |
| Creator | Fábrica de Plan | Cuotas parciales/inválidas | Fábrica crea y valida el conjunto. |
| Creator | `Credito` | Historial creado externamente | Contexto crea transiciones. |
| Controller | `RegistrarPago` | Lógica en API/MCP | Caso de uso coordina y delega. |
| Controller | `GenerarCierre` | Cierre acoplado a proceso/cron | Controller independiente del disparador. |
| Low Coupling | Puertos secundarios | Dependencia de ORM/reloj | Interfaces del núcleo. |
| Low Coupling | IDs entre agregados | Mutación cruzada | Colaboración por identidad/API. |
| High Cohesion | Cálculo financiero | Fórmulas dispersas | Módulo puro especializado. |
| High Cohesion | Políticas | Algoritmo y vigencia mezclados | Catálogo/selector separado. |
| Polymorphism | State | `switch` de ciclo | Estados sustituibles. |
| Polymorphism | Strategy excedente | Rama por política | Implementación inyectable. |
| Protected Variations | Política versionada | Cambio retroactivo | Referencia/instantánea/huella. |
| Protected Variations | Puertos primarios | Canal cambia reglas | API/UI/MCP sobre los mismos casos. |

## 11. Relación entre GRASP y SOLID

| Decisión | GRASP | SOLID relacionado | Complemento |
|---|---|---|---|
| Dinero conoce operaciones monetarias | Information Expert, High Cohesion | SRP | Ubica información y razón de cambio juntas. |
| Caso de uso coordina | Controller | SRP, DIP | Separa flujo de dominio e infraestructura. |
| State/Strategy | Polymorphism, Protected Variations | OCP, LSP | Variación sustituible con contrato. |
| Puertos estrechos | Low Coupling, Protected Variations | ISP, DIP | Reduce superficie y dirige dependencias. |
| Fábrica de plan | Creator, Information Expert | SRP | Construcción compleja en especialista. |

GRASP guía la asignación inicial de responsabilidades; SOLID ayuda a sostener esa asignación frente al cambio.

## 12. Trade-offs

| Decisión GRASP | Beneficio | Trade-off/control |
|---|---|---|
| Expert en entidades/VO | Reglas cerca de datos | Evitar entidad que conoce contexto global. |
| Factory especializada | Plan siempre válido | Una clase adicional justificada por fórmula/invariantes. |
| Controller por caso | Flujo comprensible y canal-independiente | Más servicios; se agrupan solo intenciones relacionadas. |
| Puertos/IDs | Bajo acoplamiento | Más traducción/carga; se acepta por límites claros. |
| Polimorfismo | Variación localizada | Más participantes; usar funciones para reglas cerradas. |
| Protected Variations | Cambios aislados | Abstracciones adicionales; solo para variaciones reales. |

## 13. Correspondencia E1–E4

| Entregable | Evidencia GRASP |
|---|---|
| E1 UML | Expertos en clases, Creator/Fábrica, Controllers, interfaces y polimorfismo. |
| E2 Arquitectura | Bajo acoplamiento y variaciones protegidas mediante hexagonal. |
| E3 Diseño | Componentes propietarios, casos de uso y contratos internos. |
| E4 futuro | Métodos ubicados en expertos, fábricas/controladores y tests de contratos. |

## 14. Trazabilidad incremental

| Requisito/atributo | GRASP | Responsable | Evidencia futura |
|---|---|---|---|
| RF-06, INV-01/02 | Expert, Creator | Plan/Fábrica | CA-01 completo |
| RF-07–RF-10 | Controller, Expert, Polymorphism | RegistrarPago/Pago/Chain/Strategy | CA-03–05/idempotencia |
| RF-11–RF-14 | Expert | Cuota/Calculadora/State | CA-02/fronteras |
| RF-15–RF-17 | Expert, Polymorphism | Credito/State | Transiciones |
| RF-18, RF-19 | Expert | Cartera | CA-06/07 |
| RF-20–RF-23 | Controller, Expert | GenerarCierre/Mayor/Cierre | Idempotencia/saldo |
| RF-25, RF-26 | Protected Variations | Política/Selector | No retroactividad |
| RNF-08 | High Cohesion | Módulos | Cambios localizados |
| RNF-09 | Polymorphism/Protected Variations | Strategies/puertos/políticas | Sustitución |
| RNF-10 | Low Coupling/Controller | Aplicación/puertos | Tests aislados |
| RNF-12/16 | Low Coupling/Protected Variations | Hexágono | Nuevos adaptadores |

## 15. Decisiones adoptadas

| ID | Decisión | Consecuencia |
|---|---|---|
| D12-01 | Asignar reglas al experto sin introducir contexto global. | Entidades ricas pero acotadas. |
| D12-02 | Usar fábrica cuando la construcción tiene invariantes de conjunto. | El plan nunca se entrega parcialmente válido. |
| D12-03 | Usar Controller por intención de aplicación. | Canales delgados y sin fachada gigante. |
| D12-04 | Aceptar dependencias semánticas estables. | Bajo acoplamiento no degenera en indirección total. |
| D12-05 | Usar polimorfismo solo para variaciones abiertas reales. | Las reglas cerradas permanecen funciones simples. |
| D12-06 | Proteger variaciones y también evidencia histórica. | Cambios prospectivos no alteran resultados pasados. |

## 16. Decisiones pendientes

| ID | Punto | Resolución prevista |
|---|---|---|
| DP-29 | Forma concreta de resultados/errores | Fase 15/implementación |
| DP-30 | Interfaces consumidor-específicas de repositorio | Fase 15 según dependencias reales |
| DP-31 | Controllers separados para cierre diario/mensual | Fase 15 |
| DP-32 | Mecanismo controlado de rehidratación | Proyecto Final al elegir persistencia |

## 17. Validación contra el enunciado

| Criterio | Evidencia | Estado |
|---|---|---|
| Information Expert concreto | Sección 3 | Cumplido |
| Creator concreto | Sección 4 | Cumplido |
| Controller concreto | Sección 5 | Cumplido |
| Low Coupling concreto | Sección 6 | Cumplido |
| High Cohesion concreto | Sección 7 | Cumplido |
| Polymorphism concreto | Sección 8 | Cumplido |
| Protected Variations concreto | Sección 9 | Cumplido |
| Clase/módulo, problema y decisión | Sección 10 | Cumplido |
| Verificaciones previstas | GR-IE/CR/CO/LC/HC/PO/PV | Cumplido |
| Relación con SOLID | Sección 11 | Cumplido |
| Correspondencia E1–E4 | Sección 13 | Cumplido |
| Sin código prematuro | Solo documentación | Cumplido |

## 18. Resultado esperado

Las responsabilidades quedan asignadas a expertos, creadores y controladores coherentes; los módulos colaboran con bajo acoplamiento y alta cohesión; y las variaciones reales se resuelven polimórficamente detrás de fronteras estables. E4 podrá implementar estas decisiones sin convertir servicios o adaptadores en depósitos de lógica financiera.
