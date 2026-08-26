# Fase 10 — Diseño modular E3

## 1. Objetivo y alcance

Transformar la arquitectura de alto nivel en un diseño de componentes suficientemente preciso para guiar E4, sin implementar todavia el codigo. El diseño asigna responsabilidades, propiedad de conceptos, interfaces publicas, dependencias y limites de consistencia.

Esta fase no desarrolla aun el analisis detallado de SOLID, GRASP, patrones o metricas de cohesion/acoplamiento, reservado para las Fases 11–14. Los patrones ya exigidos aparecen como participantes porque forman parte del comportamiento aprobado, pero su justificacion completa se realizara en la Fase 13.

## 2. Artefactos

| Codigo | Artefacto | Ubicacion |
|---|---|---|
| E3-DOC | Diseño modular | `docs/diseno/FASE-10-diseno-modular-e3.md` |
| E3-COMP | Diagrama editable de componentes | `docs/diagramas/diseno/01-componentes-e3.puml` |

## 3. Principios de particion

| ID | Principio | Aplicacion |
|---|---|---|
| DM-01 | Agrupar por capacidad de negocio | Originacion, Calculo, Cartera/Cobros, Cierres/Riesgo y Politicas. |
| DM-02 | Separar decision de orquestacion | Dominio decide; aplicacion coordina. |
| DM-03 | Un propietario por agregado | Solo su modulo modifica su estado interno. |
| DM-04 | Dependencias hacia abstracciones | Aplicacion usa puertos, nunca adaptadores concretos. |
| DM-05 | Pureza del calculo | Formulas sin I/O, repositorios o tiempo implicito. |
| DM-06 | Contratos estrechos | Cada interfaz expone operaciones necesarias para un consumidor. |
| DM-07 | Consistencia explicita | UoW delimita efectos multiagregado. |
| DM-08 | Evolucion sin duplicacion | Canales futuros invocan los mismos puertos primarios. |
| DM-09 | Errores con semantica | Fallos de dominio/aplicacion son distinguibles y no dejan efectos parciales. |
| DM-10 | Trazabilidad permanente | Cada componente se relaciona con requisito, prueba y documentacion. |

## 4. Capas y componentes

### 4.1 Dominio compartido minimo

| Componente | Responsabilidad | API conceptual | No debe hacer |
|---|---|---|---|
| `Dinero` | Importe exacto, moneda, redondeo y operaciones inmutables | crear, cero, sumar, restar, multiplicar, dividir, comparar, serializar | Formatear UI, convertir monedas o validar reglas de credito. |
| `Moneda` | Identificar moneda y comparar compatibilidad | crear/igualdad | Consultar tasas FX. |
| `FechaCorte` | Representar fecha civil explicita | crear, comparar, diferencia controlada | Leer fecha del sistema. |
| Errores de dominio | Expresar violacion concreta | codigo estable y datos minimos | Conocer HTTP o mensajes de interfaz. |

Solo se comparten conceptos con semantica identica en todos los modulos. La carpeta compartida no recibe servicios por comodidad.

### 4.2 Originacion

| Componente | Tipo | Responsabilidad | Colaboradores permitidos |
|---|---|---|---|
| `Cliente` | Agregado/entidad raiz | Proteger identidad y datos validos. | Tipos compartidos. |
| `SolicitudCredito` | Agregado raiz | Monto, plazo, evaluaciones, decision y estado previo al credito. | `EvaluacionCredito`, `Dinero`, `Plazo`. |
| `EvaluacionCredito` | Entidad subordinada | Conservar criterios, version, resultado, fecha y autor. | Politica por referencia/version. |
| Servicio de desembolso del dominio | Servicio | Construir condiciones para crear credito desde solicitud aprobada. | Plan, politica y tipos de credito publicos. |
| Casos de uso de Originacion | Aplicacion | Coordinar registro, solicitud, evaluacion, decision y desembolso. | Agregados, fabrica, selector y puertos. |

Originacion deja de ser propietario una vez creado el credito. Conserva el vinculo `SolicitudCreditoId → CreditoId`, pero no modifica saldos ni pagos.

### 4.3 Calculo financiero

| Componente | Tipo | Responsabilidad | Entrada/salida principal |
|---|---|---|---|
| `Tasa` | Value Object | Mantener razon, tipo y periodicidad exactas. | Cadena/decimal controlado → tasa. |
| `FabricaPlanAmortizacion` | Servicio/fabrica | Crear plan frances y validar invariantes globales. | Capital, tasa, plazo, calendario → plan valido. |
| `PlanAmortizacion` | Entidad/conjunto consistente | Organizar cuotas y totales. | Cuotas inmutables/ordenadas. |
| `Cuota` | Entidad del plan | Mantener componentes y vencimiento de un periodo. | Numero, fecha, interes, amortizacion, saldos. |
| `CalculadoraMora` | Servicio puro | Calcular dias, tramo y moratorio por cuota. | Cuota, politica y corte → resultado de mora. |

Este modulo no define si un credito cambia a EN_MORA o INCOBRABLE. Calcula hechos; Cartera/Cobros aplica el ciclo de vida.

### 4.4 Cartera y cobros

| Componente | Tipo | Responsabilidad | Invariantes principales |
|---|---|---|---|
| `Credito` | Agregado raiz | Saldo, plan, estado, politica contractual e historial. | Capital no negativo; transicion valida; politica no retroactiva. |
| Estados del credito | State | Autorizar/rechazar comportamiento por estado. | Terminales no se reactivan; pago solo donde procede. |
| `Pago` | Agregado raiz | Identidad, importe, clave idempotente y aplicacion. | Importe positivo; resultado conservado. |
| `AplicacionPago` | Value Object | Desglose por concepto y excedente. | Suma exacta igual al importe recibido. |
| Chain de prelacion | Servicio/patron | Aplicar gastos, mora, corriente y capital en orden. | Pendientes no negativos; remanente integro. |
| Strategy de excedente | Politica/patron | Aplicar remanente sin perderlo. | Misma moneda; resultado auditado. |
| `Cartera` | Servicio de dominio | Determinar cartera activa/capital en riesgo. | Sin doble conteo; incobrables excluidos. |
| Casos de uso de Cobros | Aplicacion | Coordinar idempotencia, reloj, agregados, movimientos y UoW. | Efecto atomico y reproducible. |

### 4.5 Cierres y riesgo

| Componente | Tipo | Responsabilidad | Invariantes principales |
|---|---|---|---|
| `Movimiento` | Entidad inmutable | Representar un efecto financiero firmado. | No actualizar/eliminar; misma moneda por saldo. |
| `Mayor` | Servicio/conjunto | Anexar movimientos y reproducir saldo. | Append-only; compensaciones referenciadas. |
| `CierreDiario` | Agregado/resultado | Consolidar desembolsos, cobros, devengo, mora y saldo. | Idempotencia por fecha/ambito. |
| `CierreMensual` | Agregado/resultado | Consolidar diario, riesgo, provisiones, incobrables y vencimientos. | Idempotencia por periodo/ambito. |
| `ResultadoCarteraRiesgo` | Value Object | Razon valida o `SIN_CARTERA_ACTIVA`. | Razon en `[0,1]` cuando existe. |
| Casos de uso de Cierres | Aplicacion | Obtener hechos, seleccionar politicas, congelar y confirmar. | No duplicar ni sobrescribir. |

### 4.6 Politicas institucionales

| Componente | Tipo | Responsabilidad | Invariantes principales |
|---|---|---|---|
| `PoliticaFinanciera` | Entidad versionada | Parametros, vigencia, autor, motivo y huella. | Version utilizada no se edita. |
| `SelectorPolitica` | Servicio de dominio | Encontrar exactamente una version aplicable. | Cero o multiples coincidencias son error. |
| Casos de uso de Politicas | Aplicacion | Crear, activar y reemplazar versiones prospectivas. | No modificar creditos historicos. |

## 5. Puertos primarios

Cada puerto representa una intencion completa. La implementacion concreta sera un servicio de aplicacion; el transporte futuro solo adapta comandos y resultados.

| Puerto | Comando conceptual | Resultado | Errores principales |
|---|---|---|---|
| `RegistrarCliente` | datos + identidad de operacion | `ClienteId` | datos invalidos, duplicado |
| `SolicitarCredito` | cliente, monto, moneda, plazo | `SolicitudCreditoId` | cliente inexistente, rango/plazo invalido |
| `EvaluarYDecidirSolicitud` | solicitud, evaluacion/decision, actor, fecha, motivo | estado y evaluacion | estado/actor/politica invalidos |
| `DesembolsarCredito` | solicitud, actor, fecha, clave | credito, plan, estado | no aprobada, expirada, politica ambigua, plan invalido |
| `RegistrarPago` | credito, importe, clave, fecha/actor | aplicacion, saldo, estado | estado invalido, moneda, conflicto idempotente |
| `ActualizarMora` | credito/ambito y fecha de corte | dias, tramo, moratorio y estado | politica ausente, fecha invalida |
| `ReestructurarCredito` | credito, condiciones, autorizacion | estado/plan reestructurado | no elegible, autorizacion invalida |
| `GenerarCierre` | tipo, periodo, ambito | cierre o resultado previo | conflicto idempotente, politica ausente |
| `ConsultarCarteraEnRiesgo` | ambito y corte | razon/desglose o sin cartera | moneda/datos inconsistentes |
| `AdministrarPolitica` | tipo, version, vigencia, parametros, autor | politica registrada | superposicion, parametros invalidos |

## 6. Puertos secundarios segregados por consumidor

### 6.1 Repositorios

| Puerto | Operaciones minimas | Consumidor |
|---|---|---|
| `RepositorioClientes` | existePorIdentidad, obtener, guardar | Originacion |
| `RepositorioSolicitudes` | obtener, guardar | Originacion |
| `RepositorioCreditos` | obtener, guardar, listarActivosAFecha | Originacion, Cobros, Cierres |
| `RepositorioPagos` | buscarPorClave, guardar | Cobros |
| `RepositorioMovimientos` | anexar, listarPorPeriodo, reproducir | Cobros, Cierres |
| `RepositorioCierres` | buscarPorIdentidad, guardar | Cierres |
| `RepositorioPoliticas` | listarAplicables, guardar | Todos mediante selector/Politicas |

Los repositorios devuelven agregados o proyecciones explicitas, nunca modelos ORM filtrados hacia el dominio. `RepositorioMovimientos` no expone actualizar ni eliminar.

### 6.2 Servicios tecnicos abstractos

| Puerto | Operacion minima | Regla |
|---|---|---|
| `Reloj` | `hoy(): FechaCorte` | Aplicacion lo consulta; calculo recibe el valor. |
| `GeneradorIds` | generar identidad por tipo | Determinista/sustituible en pruebas. |
| `UnidadDeTrabajo` | ejecutar una operacion atomica | No expone transacciones de una tecnologia concreta. |

## 7. Contratos internos de comando, resultado y error

### 7.1 Comandos

Un comando de aplicacion es inmutable y contiene:

- datos necesarios para la intencion;
- identidad del actor/proceso cuando corresponde;
- fecha efectiva o instrucciones para obtenerla del `Reloj`;
- identidad/idempotencia para operaciones con efecto;
- referencias por ID, no agregados construidos por el adaptador.

No contiene objetos HTTP, request/response, ORM ni funciones de presentacion.

### 7.2 Resultados

Un resultado expone solo datos necesarios al consumidor:

- identificadores;
- importes como `Dinero` dentro del nucleo;
- estados y clasificaciones diferenciados;
- desglose auditable;
- metadatos de idempotencia/reproduccion cuando proceda.

Los adaptadores futuros transformaran `Dinero` a `{ importe: string, moneda: string }`.

### 7.3 Taxonomia de errores

| Categoria | Ejemplos | Responsable |
|---|---|---|
| Validacion de dominio | monto/plazo invalido, moneda incompatible | Dominio |
| Regla de estado | transicion invalida, pago no permitido | Agregado/State |
| Politica | ausente, superpuesta, parametros invalidos | Politicas |
| Conflicto | idempotencia con datos distintos, version concurrente | Aplicacion/puerto secundario |
| No encontrado | cliente, solicitud, credito | Aplicacion/repositorio |
| Consistencia | plan invalido, saldo no reproducible | Dominio/aplicacion |

La futura capa HTTP mapeara categorias a codigos sin cambiar su significado. El dominio no conoce HTTP.

## 8. Propiedad y acceso a datos

| Dato/concepto | Propietario | Otros modulos pueden | Otros modulos no pueden |
|---|---|---|---|
| Cliente | Originacion | Referenciar `ClienteId`, consultar vista permitida | Modificar datos internos directamente |
| Solicitud/evaluacion | Originacion | Consultar estado/condiciones aprobadas | Alterar decision tras desembolso |
| Credito/plan/saldo | Cartera y Cobros | Consultar proyeccion para cierres | Aplicar pagos o cambiar estado directamente |
| Politica/versiones | Politicas | Seleccionar y conservar referencia/instantanea | Editar version utilizada |
| Movimiento/mayor | Cierres y Riesgo | Anexar mediante contrato autorizado, consultar | Actualizar/eliminar |
| Cierre | Cierres y Riesgo | Consultar resultado congelado | Sobrescribir o duplicar |

Aunque `PlanAmortizacion` se calcula en Calculo financiero, el plan contractual de una instancia de credito queda bajo el agregado `Credito`. El algoritmo pertenece a Calculo; el uso contractual pertenece a Cartera.

## 9. Flujos de componente

### 9.1 Desembolso

```text
DesembolsarCredito
  → RepositorioSolicitudes
  → SelectorPolitica
  → FabricaPlanAmortizacion
  → Credito
  → RepositorioCreditos + RepositorioMovimientos
  → UnidadDeTrabajo
```

La aplicacion coordina. Solicitud valida aprobacion, selector decide version, fabrica garantiza plan y Credito protege transicion.

### 9.2 Pago

```text
RegistrarPago
  → RepositorioPagos (idempotencia)
  → RepositorioCreditos
  → Credito/State
  → Chain de prelacion
  → Strategy de excedente
  → Pago + Movimiento
  → UnidadDeTrabajo
```

Ningun repositorio calcula prelacion ni cambia estado.

### 9.3 Cierre mensual

```text
GenerarCierre
  → RepositorioCierres (idempotencia)
  → RepositorioMovimientos + RepositorioCreditos
  → Cartera / ResultadoCarteraRiesgo
  → SelectorPolitica (provision)
  → CierreMensual
  → UnidadDeTrabajo
```

## 10. Limites transaccionales

| Operacion | Lecturas | Escrituras atomicas | Clave/conflicto |
|---|---|---|---|
| Registrar cliente | identidad existente | Cliente | identidad/operacion |
| Decidir solicitud | Solicitud/politica | Solicitud + evaluacion/transicion | version de solicitud |
| Desembolsar | Solicitud/politica | solicitud vinculada + credito + movimiento | clave desembolso + versiones |
| Registrar pago | pago previo/credito/politica | credito + pago + movimientos | Idempotency-Key + version credito |
| Declarar incobrable | credito | estado/transicion + movimiento | version credito |
| Generar cierre | cierre previo/movimientos/politicas | cierre + ajustes/provision si aplica | tipo/periodo/ambito + huella |

La atomicidad concreta se implementara en Proyecto Final. En P1, servicios y pruebas demostraran que el diseño no confirma efectos parciales.

## 11. Dependencias permitidas

| Origen | Puede depender de | Prohibido |
|---|---|---|
| Dominio compartido | Nada externo al lenguaje/biblioteca decimal-fechas encapsulada | Cualquier modulo de negocio, aplicacion o infraestructura |
| Originacion dominio | Compartido | Aplicacion, repositorios concretos, cierres |
| Calculo financiero | Compartido | Originacion, Cartera, Cierres, aplicacion, puertos |
| Cartera/Cobros dominio | Compartido, Calculo, contratos de Politicas | Originacion interna, Cierres, adaptadores |
| Cierres/Riesgo dominio | Compartido, Calculo, tipos publicos de Cartera/Politicas | Mutacion interna de otros agregados |
| Politicas dominio | Compartido/tipos propios | Consumidores, aplicacion, infraestructura |
| Aplicacion | Dominio + puertos | Adaptadores concretos |
| Contratos futuros | Puertos primarios/resultados publicos | Reglas internas y repositorios |

## 12. Correspondencia E3 → E4 prevista

El prompt exige ciertos archivos minimos bajo `src/dominio`. Esta tabla asegura correspondencia sin afirmar implementacion actual.

| Componente E3 | Archivo E4 minimo/previsto | Prueba prevista |
|---|---|---|
| Dinero/Moneda | `src/dominio/dinero.ts` | `tests/dinero.test.ts` y `invariantes.test.ts` |
| Plan/Fabrica/Cuota | `src/dominio/plan-amortizacion.ts` | `tests/plan-amortizacion.test.ts` |
| CalculadoraMora | `src/dominio/calculadora-mora.ts` | `tests/calculadora-mora.test.ts` |
| Chain/AplicacionPago/Strategy | `src/dominio/prelacion-pago.ts` | `tests/prelacion-pago.test.ts` |
| Cartera/ResultadoRiesgo | `src/dominio/cartera.ts` | `tests/cartera.test.ts` |
| Credito/State/Transicion | Archivos adicionales dentro de `src/dominio` | `tests/credito-estado.test.ts` |
| Politicas versionadas | Archivos adicionales dentro de `src/dominio` | Pruebas de politicas/invariantes |
| Movimiento/Mayor/Cierre | Archivos adicionales dentro de `src/dominio` | `tests/invariantes.test.ts` y cierres |

Los nombres definitivos de archivos adicionales se fijaran en la Fase 15. Las rutas minimas exigidas no se eliminaran.

## 13. Correspondencia E1/E2/E3

| Concepto | E1 UML | E2 arquitectura | E3 componente |
|---|---|---|---|
| Cliente/Solicitud | Clases/casos/actividad | Originacion | Agregados + casos de uso Originacion |
| Dinero/Plan/Mora | Clases/secuencias | Calculo financiero puro | VO, fabrica, plan y calculadora |
| Credito/Pago | Clases/State/secuencia pago | Cartera y cobros | Agregados, State, Chain y Strategy |
| Movimiento/Cierre | Clases/actividad cierre | Cierres y riesgo | Mayor y cierres |
| Politica | Clases/desembolso | Politicas institucionales | Entidad versionada + selector |
| Reloj/repositorios | Interfaces UML | Puertos secundarios | Interfaces segregadas |

## 14. Criterios de aceptacion del diseño modular

| ID | Criterio verificable |
|---|---|
| E3-A01 | Cada requisito funcional tiene un componente responsable. |
| E3-A02 | Cada agregado posee un unico modulo propietario. |
| E3-A03 | Calculo financiero no depende de aplicacion ni puertos. |
| E3-A04 | Aplicacion no contiene formulas financieras. |
| E3-A05 | Contratos externos no contienen reglas. |
| E3-A06 | Los cuatro puertos primarios obligatorios estan definidos. |
| E3-A07 | `RepositorioCreditos`, `Reloj` y `GeneradorIds` estan definidos. |
| E3-A08 | Pago y movimiento tienen limites distintos y confirmacion coordinada. |
| E3-A09 | Los repositorios no exponen modelos ORM. |
| E3-A10 | Mayor no expone actualizar/eliminar. |
| E3-A11 | Existe correspondencia explicita E3→E4. |
| E3-A12 | Los canales futuros solo conocen puertos primarios. |

## 15. Trazabilidad incremental

| Requisito/atributo | Componente responsable | Puerto/caso de uso | E4/prueba prevista |
|---|---|---|---|
| RF-01–RF-04 | Originacion | Registrar/Solicitar/EvaluarYDecidir | Pruebas de originacion |
| RF-05, RF-06, RF-25, RF-26 | Originacion + Calculo + Politicas | DesembolsarCredito | Plan CA-01/politicas |
| RF-07–RF-10 | Cartera/Cobros | RegistrarPago | Prelacion CA-03–05/idempotencia |
| RF-11–RF-14 | Calculo + Cartera | ActualizarMora | Mora CA-02/limites |
| RF-15–RF-17 | Credito/State | Pago/Reestructurar/Declarar | Estados/invariantes |
| RF-18, RF-19 | Cartera + Cierres | ConsultarCarteraEnRiesgo | CA-06/CA-07 |
| RF-20–RF-23 | Cierres/Mayor | GenerarCierre | Idempotencia/reproduccion |
| RNF-01, RNF-02 | Compartido + Calculo | Entradas exactas/corte | Exactitud/determinismo |
| RNF-07, RNF-11 | Aplicacion + agregados | Comandos idempotentes/UoW | Fallos sin efecto parcial |
| RNF-08–RNF-10 | Todos los limites | Puertos estrechos | Imports y tests aislados |
| RNF-12, RNF-16 | Puertos primarios/secundarios | Contratos | Adaptadores sin cambiar dominio |

## 16. Decisiones adoptadas

| ID | Decision | Consecuencia |
|---|---|---|
| D10-01 | Separar componentes de dominio y aplicacion por capacidad. | La orquestacion no contamina reglas. |
| D10-02 | Mantener un dominio compartido minimo. | Reduce ciclos y “cajon de sastre”. |
| D10-03 | Asignar el plan contractual a Credito y el algoritmo a Calculo. | Propiedad de estado y reutilizacion matematica quedan claras. |
| D10-04 | Segregar repositorios por agregado/consumidor. | Interfaces estrechas y dobles simples. |
| D10-05 | Usar comandos/resultados independientes de transporte. | API/MCP/CLI pueden reutilizar casos. |
| D10-06 | Usar errores de dominio sin codigos HTTP. | Semantica estable y mapeo externo posterior. |
| D10-07 | Coordinar efectos multiagregado con UoW. | Evita pago sin movimiento y desembolso parcial. |
| D10-08 | Hacer explicita la correspondencia E3→E4. | Codigo y pruebas posteriores no divergen del diseño. |

## 17. Decisiones pendientes

| ID | Punto | Fase prevista |
|---|---|---|
| DP-28 | Nombres/rutas de archivos adicionales de State, politicas y cierres | Fase 15 |
| DP-18 | Herramienta automatica para reglas de imports | Fase 15 |
| DP-29 | Forma concreta de resultados tipados (`Result` o errores tipados) | Fase 15/implementacion |
| DP-14 | Implementacion real de repositorios/UoW | Proyecto Final, fuera de P1 |
| DP-15 | Version/concurrencia concreta | Proyecto Final |

## 18. Validacion contra el enunciado

| Criterio | Evidencia | Estado |
|---|---|---|
| Modulos cohesivos definidos | Seccion 4 | Cumplido |
| Responsabilidades explicitas | Secciones 4–6 | Cumplido |
| Puertos primarios | Seccion 5 | Cumplido |
| Puertos secundarios | Seccion 6 | Cumplido |
| Nucleo independiente de infraestructura | Secciones 7 y 11 | Cumplido |
| Calculos puros | Seccion 4.3 y dependencias | Cumplido |
| Propiedad de agregados | Seccion 8 | Cumplido |
| Limites transaccionales | Seccion 10 | Cumplido conceptualmente |
| Correspondencia E1/E2/E3 | Seccion 13 | Cumplido |
| Correspondencia E3/E4 | Seccion 12 | Cumplido como plan |
| Diagrama editable | E3-COMP | Cumplido |
| Sin implementar fases posteriores | Solo documentacion/PlantUML | Cumplido |

## 19. Resultado esperado

Cada responsabilidad del sistema tiene ahora un componente propietario, una interfaz de colaboracion y un destino de implementacion/prueba. E4 podra construirse siguiendo esta asignacion sin introducir reglas en controladores, repositorios o infraestructura, y sin alterar los limites definidos por UML, arquitectura, 4+1 y C4.
