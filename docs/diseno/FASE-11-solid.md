# Fase 11 — Aplicación concreta de SOLID

## 1. Objetivo y alcance

Documentar cómo SRP, OCP, LSP, ISP y DIP orientan decisiones reales del Sistema de Gestión de Microcrédito. Cada principio se vincula con componentes, problemas evitados, límites y verificaciones posteriores.

SOLID no se usa como una lista de definiciones ni como obligación de crear una interfaz para cada clase. Se aplica donde protege exactitud, mantenibilidad, testabilidad y evolución del dominio financiero.

Esta fase no implementa TypeScript. La evidencia actual está en el diseño E3 y UML; la evidencia ejecutable se añadirá en E4.

## 2. Resumen de aplicación

| Principio | Aplicación principal | Problema evitado | Evidencia de diseño |
|---|---|---|---|
| SRP | Módulos y clases con una razón de cambio | Clases que mezclan fórmulas, persistencia, flujo y presentación | E3-COMP; módulos de Fase 10 |
| OCP | Strategy, State, Chain y políticas versionadas | Modificar algoritmos estables para cada nueva política/estado | UML-CL; E3-COMP |
| LSP | Contratos conductuales para Strategies, estados, handlers y puertos | Implementaciones sustituibles que rompen invariantes | Contratos de esta fase + UML-CL |
| ISP | Puertos por agregado y caso de uso | Interfaces gigantes y dobles de prueba frágiles | Puertos E3 |
| DIP | Aplicación depende de interfaces; adaptadores dependen del núcleo | Acoplamiento a BD, reloj, UUID, HTTP o proveedor | Arquitectura hexagonal y C4-N3 |

## 3. SRP — Principio de Responsabilidad Única

### 3.1 Criterio usado

Una clase o módulo tiene una responsabilidad cuando existe una razón de negocio/técnica cohesiva para cambiarlo. “Hacer una sola operación” no es el criterio; proteger un mismo concepto e invariantes sí puede requerir varias operaciones.

### 3.2 Aplicación por componente

| Clase/módulo | Responsabilidad única | Razón legítima de cambio | Responsabilidad excluida |
|---|---|---|---|
| `Dinero` | Exactitud monetaria, moneda y operaciones inmutables | Cambia la convención monetaria común | Amortización, formato UI, persistencia |
| `FabricaPlanAmortizacion` | Construir un plan francés globalmente válido | Cambia el método/fórmula de creación admitida | Cambios de estado, guardar crédito |
| `PlanAmortizacion` | Mantener cuotas/totales e invariantes del plan | Cambia la consistencia contractual del plan | Seleccionar tasa o registrar pago |
| `CalculadoraMora` | Derivar atraso, tramo y moratorio por cuota | Cambia la regla matemática de mora | Decidir declaración contable incobrable |
| `Credito` | Proteger ciclo, saldo, plan contractual e historial | Cambian invariantes del crédito | Consultar BD, mapear HTTP, calcular cartera global |
| Estado concreto | Comportamiento permitido en un estado | Cambian transiciones desde ese estado | Fórmula monetaria o persistencia |
| Handler de prelación | Consumir el pendiente de un concepto | Cambia la aplicación de ese concepto | Decidir el resto de conceptos |
| `PoliticaExcedente` concreta | Resolver un excedente según una estrategia | Cambia el tratamiento institucional elegido | Aplicar gastos/moratorio/corriente |
| `Cartera` | Calcular cartera activa y capital en riesgo | Cambian criterios de inclusión | Modificar créditos o producir HTTP |
| `Movimiento`/`Mayor` | Registrar/reproducir efectos append-only | Cambia semántica contable del mayor | Procesar pagos o decidir estados |
| `CierreMensual` | Consolidar resultado de un período | Cambia contenido/invariantes del cierre mensual | Calcular una cuota individual |
| Servicio de aplicación `RegistrarPago` | Coordinar un caso de uso completo | Cambia el flujo transaccional/idempotente | Cambian fórmulas financieras |
| Adaptador futuro API | Traducir HTTP a comando/resultado | Cambia el protocolo/contrato HTTP | Cambian reglas de pago |

### 3.3 Separaciones críticas

#### Pago frente a movimiento

`Pago` representa la operación recibida y su aplicación; `Movimiento` representa un efecto contable. Separarlos evita que una modificación del mayor cambie la semántica de recepción de pagos y permite que otras operaciones originen movimientos.

#### Tramo frente a estado

`CalculadoraMora` deriva `TramoMora`; State controla el ciclo de `Credito`. La clasificación temporal no ejecuta por sí misma una declaración contable.

#### Política frente a algoritmo

`PoliticaFinanciera` conserva parámetros/versiones; el módulo consumidor ejecuta la fórmula. La política no acumula algoritmos heterogéneos y el cálculo no decide vigencias.

#### Aplicación frente a dominio

El servicio de aplicación obtiene agregados, reloj y política, delimita idempotencia/UoW y delega decisiones. No replica fórmulas ni inspecciona atributos para decidir transiciones.

### 3.4 Problemas evitados

- `CreditoService` gigantesco con originación, pagos, mora, riesgo y cierres;
- fórmulas repetidas en casos de uso o controladores;
- cambios HTTP que modifican el dominio;
- repositorios que calculan reglas de negocio;
- una clase “Mora” que mezcla cálculo, estado y salida contable.

### 3.5 Verificación prevista

| ID | Verificación SRP |
|---|---|
| SOL-SRP-01 | `dinero.ts` no importa módulos de crédito, pago, cierre o infraestructura. |
| SOL-SRP-02 | `calculadora-mora.ts` no cambia estados ni guarda entidades. |
| SOL-SRP-03 | Servicios de aplicación no contienen fórmulas de cuota/moratorio. |
| SOL-SRP-04 | Adaptadores futuros no contienen reglas financieras. |
| SOL-SRP-05 | Repositorios no aplican prelación ni transiciones. |

## 4. OCP — Principio Abierto/Cerrado

### 4.1 Criterio usado

Los puntos de variación con evidencia deben admitir nuevas implementaciones sin modificar el consumidor estable. OCP no significa que todo quede extensible; las invariantes legales/contractuales permanecen cerradas a configuración arbitraria.

### 4.2 Puntos de extensión

| Abstracción/punto | Extensión permitida | Consumidor que no cambia | Límite protegido |
|---|---|---|---|
| `PoliticaExcedente` | Amortización directa, pago anticipado u otra política válida | Chain/`RegistrarPago` | El excedente nunca se pierde. |
| Política de tasa/conversión | Nueva versión o tipo con estrategia explícita | Fábrica/calculadora | No usar tasa implícita ni alterar históricos. |
| State del crédito | Comportamiento de un estado autorizado | `Credito` como contexto | Transiciones inválidas siguen imposibles. |
| `EslabonPrelacion` | Nuevo handler permitido por cambio institucional | Orquestador de cadena | Orden obligatorio actual solo cambia mediante decisión trazada. |
| `RepositorioCreditos` | Adaptador en memoria, PostgreSQL u otro | Casos de uso | Semántica del agregado permanece. |
| `Reloj` | Falso, fijo o sistema | Aplicación | Fecha nunca se lee en cálculo. |
| `GeneradorIds` | Secuencial de prueba, UUID futuro | Aplicación | Identidad no se acopla al proveedor. |
| Puerto primario | API, CLI, UI/chat o MCP | Caso de uso | Canal no altera semántica. |

### 4.3 Elementos deliberadamente cerrados

| Regla cerrada | Motivo |
|---|---|
| Compatibilidad de moneda | No puede “extenderse” aceptando mezclas sin conversión auditada. |
| Redondeo medio hacia arriba | Requisito contractual único de P1. |
| Suma de amortizaciones y saldo final | Invariantes, no estrategias. |
| Prohibición de interés sobre interés | Regla financiera no desactivable. |
| Conservación del pago/excedente | Invariante contable. |
| Irreversibilidad de INCOBRABLE | Salida contable definida por el dominio. |

### 4.4 Ejemplo concreto: excedente

`RegistrarPago` depende de `PoliticaExcedente`. Para usar `PagoAnticipadoCuotas` en lugar de `AmortizacionDirectaCapital`, se suministra otra implementación. No se modifica:

- la cadena gastos → mora → corriente → capital;
- la validación de idempotencia;
- la conservación del pago;
- el agregado `Pago`;
- el mapeo de canales futuros.

### 4.5 Problemas evitados

- `switch (tipoPolitica)` creciente dentro del caso de uso;
- tasas codificadas en la fórmula;
- `if/else` masivo para todos los estados;
- reescribir casos de uso al cambiar persistencia o reloj;
- divergencia de reglas entre API y MCP.

### 4.6 Verificación prevista

| ID | Verificación OCP |
|---|---|
| SOL-OCP-01 | Dos Strategies de excedente pasan el mismo contrato sin modificar `RegistrarPago`. |
| SOL-OCP-02 | Versiones de tasa se sustituyen sin cambiar `PlanAmortizacion`. |
| SOL-OCP-03 | Reloj fijo y real son sustituibles sin cambiar casos de uso. |
| SOL-OCP-04 | Un adaptador nuevo invoca puertos existentes sin modificar dominio. |
| SOL-OCP-05 | No existe un selector central masivo de comportamiento de estados. |

## 5. LSP — Principio de Sustitución de Liskov

### 5.1 Criterio usado

Toda implementación de una abstracción debe poder sustituir a otra sin reforzar precondiciones, debilitar postcondiciones ni violar invariantes observables.

El tipado estructural por sí solo no garantiza LSP; se necesitan contratos conductuales y pruebas compartidas.

### 5.2 Contratos de sustitución

#### `PoliticaExcedente`

| Condición | Contrato |
|---|---|
| Precondición | Excedente no negativo, moneda del crédito y crédito apto para estrategia. |
| Postcondición | Aplicado + remanente identificable = excedente recibido. |
| Invariante | Saldo de capital no negativo; no se pierden centavos. |

Ninguna implementación puede rechazar arbitrariamente un excedente que el contrato base acepta ni ocultar remanente.

#### `EslabonPrelacion`

| Condición | Contrato |
|---|---|
| Precondición | Remanente y pendiente en la misma moneda, ambos no negativos. |
| Postcondición | Consumo = `min(remanente, pendiente)`; entrega el resto exacto. |
| Invariante | Pendiente y remanente resultantes no negativos. |

Un handler no puede consumir conceptos que no posee ni cambiar el orden por sí solo.

#### `EstadoCreditoComportamiento`

| Condición | Contrato |
|---|---|
| Precondición | Recibe contexto consistente y datos tipados del evento. |
| Postcondición | Ejecuta una transición válida con historial o rechaza sin efecto. |
| Invariante | Nunca deja un estado parcialmente cambiado ni omite evidencia. |

Un estado terminal no puede aceptar una operación solo para evitar lanzar error; eso violaría el contrato del contexto.

#### Repositorios

| Condición | Contrato |
|---|---|
| Precondición | Identidades/comandos válidos. |
| Postcondición | `obtener` retorna el agregado correspondiente o un no encontrado explícito. |
| Invariante | `guardar` no cambia reglas del agregado ni fabrica datos. |

Un repositorio en memoria usado en pruebas debe preservar identidad, idempotencia y semántica igual que el adaptador persistente futuro.

#### `Reloj`

Todas las implementaciones retornan una `FechaCorte` válida. Un reloj falso no puede retornar `Date` mutable o zona horaria ambigua si el puerto promete fecha civil.

### 5.3 Riesgos de violación

| Violación | Consecuencia |
|---|---|
| Strategy de excedente descarta centavos | Rompe INV-13. |
| Handler devuelve remanente negativo | Rompe capital/pago. |
| Estado “ignora” transición inválida silenciosamente | Impide auditar el error. |
| Repositorio en memoria omite unicidad idempotente | Pruebas pasan y producción duplica pagos. |
| Reloj de prueba usa semántica distinta | Tests temporales no representan producción. |

### 5.4 Pruebas de contrato previstas

| ID | Familia de implementación | Propiedades comunes |
|---|---|---|
| SOL-LSP-01 | Todas las `PoliticaExcedente` | Conservación, moneda y capital no negativo. |
| SOL-LSP-02 | Todos los handlers | Consumo mínimo y remanente exacto. |
| SOL-LSP-03 | Todos los estados | Transición válida o error sin efecto + historial completo. |
| SOL-LSP-04 | Repositorios en memoria/futuros | Identidad, no encontrado e idempotencia equivalentes. |
| SOL-LSP-05 | Relojes | Fecha civil válida y controlable. |

## 6. ISP — Principio de Segregación de Interfaces

### 6.1 Criterio usado

Un consumidor no debe depender de operaciones que no utiliza. Se diseñan puertos orientados al caso de uso o agregado, no una interfaz general de “servicios del sistema”.

### 6.2 Puertos primarios segregados

| Interfaz | Consumidor típico | Operación expuesta |
|---|---|---|
| `RegistrarCliente` | Asesor/API futura | registrar |
| `DesembolsarCredito` | Encargado de desembolso | ejecutar desembolso |
| `RegistrarPago` | Cajero/API/MCP futuros | registrar pago |
| `GenerarCierre` | Financiero/proceso | diario/mensual según contrato tipado |
| `ConsultarCarteraEnRiesgo` | Riesgos/financiero | consultar |
| `AdministrarPolitica` | Administrador | crear/activar versión |

Un adaptador MCP que solo registra pagos no necesita depender de administración de políticas ni cierres.

### 6.3 Puertos secundarios segregados

| Interfaz | Por qué está separada |
|---|---|
| `RepositorioClientes` | Unicidad/consulta de cliente no requiere operaciones de crédito. |
| `RepositorioSolicitudes` | Ciclo previo al crédito. |
| `RepositorioCreditos` | Carga/guarda agregado y lista proyecciones autorizadas. |
| `RepositorioPagos` | Búsqueda idempotente y conservación de pagos. |
| `RepositorioMovimientos` | API append-only distinta de CRUD. |
| `RepositorioCierres` | Identidad por período y congelamiento. |
| `RepositorioPoliticas` | Consultas por tipo/ámbito/vigencia. |
| `Reloj` | Solo proporciona tiempo. |
| `GeneradorIds` | Solo crea identidades. |
| `UnidadDeTrabajo` | Solo delimita confirmación atómica. |

### 6.4 Decisiones de granularidad

`RepositorioCreditos` puede ser compartido por Originación, Cobros y Cierres porque todos necesitan crédito, pero cada consumidor debe recibir una vista estrecha cuando no requiere el agregado completo. Si TypeScript necesita interfaces consumidor-específicas, se pueden definir:

- `ObtenerCredito`;
- `GuardarCredito`;
- `ListarCreditosActivos`.

Estas interfaces pueden ser implementadas por el mismo adaptador sin obligar a todos los casos de uso a conocer todos los métodos.

`GenerarCierre` puede mantener operaciones diaria/mensual juntas solo si comparten el mismo consumidor y contrato. Si divergen autorizaciones o dependencias, se separará en `GenerarCierreDiario` y `GenerarCierreMensual`.

### 6.5 Interfaces rechazadas

```text
RepositorioGeneral<T> {
  crear, obtener, actualizar, eliminar, listar, ejecutarConsulta
}
```

Se rechaza porque permitiría eliminar movimientos, expondría operaciones innecesarias y ocultaría semántica.

```text
ServicioMicrocredito {
  registrarCliente, aprobar, desembolsar, pagar, cerrar, administrarPolitica...
}
```

Se rechaza porque acoplaría todos los actores y adaptadores a todos los cambios.

### 6.6 Verificación prevista

| ID | Verificación ISP |
|---|---|
| SOL-ISP-01 | Ningún puerto contiene operaciones CRUD no usadas. |
| SOL-ISP-02 | `RepositorioMovimientos` no expone actualizar/eliminar. |
| SOL-ISP-03 | Dobles de un caso de uso implementan solo dependencias requeridas. |
| SOL-ISP-04 | Adaptador MCP/API puede depender de un puerto primario específico. |
| SOL-ISP-05 | Repositorio compartido se divide en capacidades si consumidores divergen. |

## 7. DIP — Principio de Inversión de Dependencias

### 7.1 Criterio usado

Las políticas de alto nivel no dependen de mecanismos de bajo nivel. Ambos dependen de abstracciones definidas por las necesidades del núcleo.

### 7.2 Inversiones concretas

| Política de alto nivel | Abstracción | Detalle futuro sustituible | Problema evitado |
|---|---|---|---|
| Registrar pago | `RepositorioCreditos`, `RepositorioPagos`, `RepositorioMovimientos`, UoW | PostgreSQL/ORM | Dominio acoplado a esquema/transacción. |
| Calcular a fecha | `Reloj`/`FechaCorte` | Fecha del sistema | Tests no deterministas. |
| Crear identidades | `GeneradorIds` | UUID/proveedor | IDs difíciles de controlar. |
| Desembolsar | `RepositorioSolicitudes`, `RepositorioCreditos`, selector | Persistencia/catálogo concreto | Caso de uso conoce consultas técnicas. |
| Generar cierre | Repositorios de movimientos/cierres/políticas | SQL/proyecciones concretas | Cierre atado a una BD. |
| Canales externos | Puertos primarios | API, UI, CLI, MCP | Reglas copiadas por canal. |
| Tratamiento excedente | `PoliticaExcedente` | Estrategias concretas | Caso de uso atado a una política. |

### 7.3 Dirección de dependencias

```text
Adaptador API/MCP futuro ──depende──> Puerto primario <──implementa── Aplicación
Adaptador PostgreSQL futuro ──implementa──> Puerto secundario <──usa── Aplicación
Aplicación ──depende──> Dominio
Dominio financiero ──depende──> tipos propios/abstracciones, nunca adaptadores
```

Las interfaces se ubican cerca del consumidor que expresa la necesidad, no en una carpeta de infraestructura. El adaptador acepta depender del núcleo; el núcleo no acepta depender del adaptador.

### 7.4 Inyección explícita

Los servicios de aplicación reciben sus dependencias mediante constructor o fábrica de composición futura. No usan:

- localizadores de servicio globales;
- singletons mutables;
- imports de instancias concretas;
- `new` de repositorios dentro del caso de uso;
- acceso directo a `Date.now()` o equivalente.

Las entidades no reciben repositorios. El caso de uso carga el agregado, invoca comportamiento y confirma mediante puertos.

### 7.5 Problemas evitados

- tests que necesitan PostgreSQL;
- cálculos dependientes del reloj real;
- ORM filtrado dentro de entidades;
- API/MCP con implementaciones financieras distintas;
- reemplazo costoso de persistencia o generador de IDs.

### 7.6 Verificación prevista

| ID | Verificación DIP |
|---|---|
| SOL-DIP-01 | Ningún dominio importa adaptadores/frameworks. |
| SOL-DIP-02 | Casos de uso reciben dependencias explícitas. |
| SOL-DIP-03 | Tests sustituyen repositorios/reloj/IDs sin servicios externos. |
| SOL-DIP-04 | No hay `Date.now()`/fecha global en cálculos. |
| SOL-DIP-05 | Adaptadores futuros implementan interfaces del núcleo. |

## 8. Matriz principio → clase/módulo → decisión → problema evitado

| Principio | Clase/módulo | Decisión tomada | Problema evitado |
|---|---|---|---|
| SRP | `Dinero` | Solo semántica monetaria exacta | VO que conoce créditos/UI. |
| SRP | `CalculadoraMora` | Calcula, no cambia estado | Cálculo temporal con efectos ocultos. |
| SRP | `RegistrarPago` | Orquesta, no calcula fórmulas | Servicio de aplicación financiero duplicado. |
| SRP | Cierres | Consolidan hechos, no procesan pagos | Acoplamiento entre cierre y cobro. |
| OCP | `PoliticaExcedente` | Variación por Strategy | `switch` por política. |
| OCP | State | Comportamiento por estado | Gran `if/else` de ciclo. |
| OCP | Puertos | Adaptadores sustituibles | Reescritura por tecnología. |
| LSP | Strategies | Contrato de conservación | Implementación que pierde excedente. |
| LSP | Handlers | Consumo/remanente uniforme | Handler que rompe prelación. |
| LSP | Repositorios | Semántica igual en memoria/producción | Dobles irreales. |
| ISP | Puertos primarios | Interfaz por intención | Adaptador acoplado a todo el sistema. |
| ISP | Repositorios | Interfaz por agregado/capacidad | CRUD que permite acciones inválidas. |
| DIP | Aplicación | Depende de repositorios abstractos | Acoplamiento a ORM/BD. |
| DIP | Tiempo | Puerto `Reloj` | No determinismo. |
| DIP | Canales | Dependencia sobre casos de uso | Reglas en HTTP/MCP/UI. |

## 9. Trade-offs y límites

| Decisión SOLID | Beneficio | Trade-off/control |
|---|---|---|
| Más clases State/Chain/Strategy | Extensión y reglas localizadas | Mayor navegación; solo se aplica a variaciones reales. |
| Puertos segregados | Consumidores desacoplados | Más interfaces; se evita dividir cuando consumidores son iguales. |
| Inyección explícita | Testabilidad y claridad | Constructores más amplios; se agrupan casos por composición, no service locator. |
| Dominio puro | Determinismo | Aplicación debe preparar más entradas | Se acepta por auditabilidad. |
| Repositorios semánticos | Protegen agregados | Menos reutilización CRUD genérica | La semántica es prioritaria en finanzas. |
| OCP selectivo | Evita modificación en puntos variables | No todo se vuelve plugin | Invariantes permanecen cerradas. |

## 10. Antipatrones prohibidos por el diseño

| Antipatrón | Regla que lo impide |
|---|---|
| God Service de microcrédito | SRP y módulos propietarios. |
| Anemic Domain Model | Agregados/State protegen reglas. |
| `switch` central de estados | OCP + State. |
| CRUD universal | ISP y repositorios semánticos. |
| Service Locator/globales | DIP e inyección explícita. |
| Infraestructura en dominio | DIP y arquitectura hexagonal. |
| Interfaz por cada clase sin consumidor | Aplicación pragmática de ISP/OCP. |
| Herencia solo para reutilizar código | LSP; preferencia por composición/contratos. |

## 11. Correspondencia con E1, E2, E3 y E4

| Entregable | Evidencia SOLID |
|---|---|
| E1 UML | Interfaces Strategy/Chain/State, servicios y puertos en clases; secuencias delegan. |
| E2 Arquitectura | Hexagonal invierte dependencias y monolito modular separa razones de cambio. |
| E3 Diseño | Componentes propietarios, contratos estrechos y dependencias permitidas. |
| E4 futuro | Archivos cohesivos, implementaciones sustituibles y tests de contrato. |

## 12. Trazabilidad incremental

| Atributo/requisito | Principio | Aplicación | Evidencia futura |
|---|---|---|---|
| RNF-08 Mantenibilidad | SRP/OCP/ISP | Módulos, variaciones y contratos estrechos | Imports/revisión/cambios localizados |
| RNF-09 Modificabilidad | OCP/LSP/DIP | Strategy, State, políticas, puertos | Pruebas de contrato |
| RNF-10 Testabilidad | SRP/ISP/DIP | Cálculos puros y dobles mínimos | Tests sin servicios externos |
| RNF-11 Confiabilidad | LSP | Postcondiciones/invariantes comunes | SOL-LSP-01–05 |
| RNF-12 Interoperabilidad | ISP/DIP | Puertos primarios por caso | API/MCP reutilizan casos |
| RNF-16 Independencia | DIP | Núcleo define abstracciones | Auditoría de imports |
| RF-08 Prelación | SRP/OCP/LSP | Handler por concepto | Contrato común/CA-03–05 |
| RF-09 Excedente | OCP/LSP | Strategy sustituible | Conservación INV-13 |
| RF-15 Estados | SRP/OCP/LSP | State por comportamiento | Transiciones válidas/inválidas |
| RF-25 Políticas | OCP/DIP | Versiones/selector | Cambio prospectivo |

## 13. Decisiones adoptadas

| ID | Decisión | Consecuencia |
|---|---|---|
| D11-01 | Aplicar SRP por razón de cambio, no por cantidad de métodos. | Agregados pueden proteger varias operaciones cohesivas. |
| D11-02 | Aplicar OCP solo a variaciones demostradas. | No se crean abstracciones especulativas. |
| D11-03 | Formalizar contratos conductuales para LSP. | El tipado no es la única garantía de sustitución. |
| D11-04 | Segregar puertos por consumidor/capacidad. | Dobles y adaptadores dependen de superficies mínimas. |
| D11-05 | Ubicar abstracciones cerca del núcleo consumidor. | Adaptadores dependen del dominio/aplicación, no al revés. |
| D11-06 | Mantener invariantes cerradas a extensión arbitraria. | Configurabilidad no debilita exactitud o integridad. |

## 14. Decisiones pendientes

| ID | Punto | Resolución prevista |
|---|---|---|
| DP-29 | `Result` discriminado o errores tipados lanzados | Fase 15/implementación, manteniendo taxonomía. |
| DP-30 | Segregar `RepositorioCreditos` en interfaces consumidor-específicas | Fase 15 según constructores reales. |
| DP-31 | Separar cierre diario/mensual en dos puertos primarios | Fase 15 según dependencias reales. |
| DP-18 | Herramienta para dependencias/imports | Fase 15. |

## 15. Validación contra el enunciado

| Criterio | Evidencia | Estado |
|---|---|---|
| SRP aplicado concretamente | Sección 3 | Cumplido |
| OCP aplicado concretamente | Sección 4 | Cumplido |
| LSP aplicado concretamente | Sección 5 | Cumplido |
| ISP aplicado concretamente | Sección 6 | Cumplido |
| DIP aplicado concretamente | Sección 7 | Cumplido |
| Clase/módulo indicado | Secciones 3–8 | Cumplido |
| Problema evitado indicado | Secciones 3–8 | Cumplido |
| Decisión tomada indicada | Secciones 3–8 | Cumplido |
| Verificación prevista | SOL-SRP/OCP/LSP/ISP/DIP | Cumplido |
| Trade-offs documentados | Sección 9 | Cumplido |
| Correspondencia E1–E4 | Sección 11 | Cumplido |
| Sin código prematuro | Solo documentación | Cumplido |

## 16. Resultado esperado

SOLID queda expresado como restricciones y contratos comprobables, no como teoría decorativa. La futura implementación deberá mantener clases cohesionadas, variaciones sustituibles, interfaces estrechas y dependencias dirigidas al núcleo, preservando en todo momento las invariantes financieras.
