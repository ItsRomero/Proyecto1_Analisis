# Fase 8 — Modelo arquitectonico 4+1

## 1. Objetivo y alcance

Describir la arquitectura desde perspectivas complementarias para que analistas, desarrolladores, evaluadores y responsables del negocio puedan verificar decisiones distintas sin depender de un unico diagrama.

El prompt exige:

1. vista logica;
2. vista de escenarios;
3. una vista adicional, preferiblemente desarrollo.

Se crean exactamente esas tres vistas. La vista de escenarios es el “+1” que valida las otras vistas mediante recorridos representativos. No se agregan vistas de procesos o fisica/despliegue porque Proyecto 1 no implementa concurrencia distribuida, servidor, base de datos ni infraestructura.

## 2. Artefactos creados

| Codigo | Vista | Archivo editable |
|---|---|---|
| V4P1-L | Logica | `docs/diagramas/4+1/01-vista-logica.puml` |
| V4P1-D | Desarrollo | `docs/diagramas/4+1/02-vista-desarrollo.puml` |
| V4P1-E | Escenarios (+1) | `docs/diagramas/4+1/03-vista-escenarios.puml` |

Los archivos PlantUML son los artefactos fuente. Las imagenes que se generen posteriormente seran derivados para lectura o inclusion en el documento final.

## 3. Audiencias y preguntas respondidas

| Vista | Audiencia principal | Pregunta que responde |
|---|---|---|
| Logica | Analistas, arquitectos y desarrolladores | ¿Que conceptos y modulos realizan las reglas y como colaboran? |
| Desarrollo | Desarrolladores, revisores y responsables de mantenimiento | ¿Como se organiza el codigo y que dependencias estan permitidas? |
| Escenarios | Negocio, evaluadores, QA y arquitectos | ¿La arquitectura soporta los recorridos criticos y sus atributos de calidad? |

## 4. Vista logica

### 4.1 Proposito

La vista logica muestra la descomposicion funcional del nucleo, las responsabilidades del dominio y las relaciones necesarias para cumplir las reglas financieras.

### 4.2 Elementos representados

| Modulo | Elementos principales | Responsabilidad comunicada |
|---|---|---|
| Originacion | Cliente, SolicitudCredito, EvaluacionCredito | Registrar, evaluar y decidir antes de desembolsar. |
| Calculo financiero | Dinero, Tasa, PlanAmortizacion, CalculadoraMora | Ejecutar calculos exactos y puros. |
| Cartera y cobros | Credito, Pago, State, Chain, Strategy | Proteger el ciclo, aplicar pagos y mantener saldos. |
| Cierres y riesgo | Movimiento, Mayor, Cierre, CarteraRiesgo | Reconstruir saldos y producir cierres/riesgo. |
| Politicas | PoliticaFinanciera, SelectorPolitica | Seleccionar y conservar reglas versionadas. |
| Aplicacion y puertos | Casos de uso y puertos | Separar intencion del canal e infraestructura. |

### 4.3 Decisiones arquitectonicas que comunica

1. El calculo financiero tiene alta cohesion y no depende de repositorios, I/O ni fecha global.
2. El credito es responsable de su ciclo mediante State; `TramoMora` no sustituye su estado.
3. El pago usa Chain para la prelacion y Strategy para el excedente.
4. El plan pertenece al credito, pero su creacion se delega a una fabrica financiera.
5. Pago y Movimiento estan relacionados, pero son hechos distintos: operacion recibida frente a efecto contable.
6. Cierres consolidan movimientos append-only y no recalculan alterando agregados.
7. Los casos de uso coordinan modulos y dependen de puertos secundarios abstractos.

### 4.4 Atributos de calidad demostrados

| Atributo | Evidencia en la vista |
|---|---|
| Exactitud | Calculo financiero centralizado y `Dinero` compartido. |
| Mantenibilidad | Modulos cohesionados y patrones ubicados en su problema. |
| Fiabilidad | Mayor append-only, State e idempotencia conceptual de cierres. |
| Modificabilidad | Politicas y Strategy separadas de consumidores. |
| Interoperabilidad | Puertos primarios independientes de canales. |

## 5. Vista de desarrollo

### 5.1 Proposito

La vista de desarrollo traduce los limites logicos a una organizacion de codigo prevista. No afirma que las carpetas o archivos de implementacion ya existan; define donde perteneceran y que imports se permitiran.

### 5.2 Organizacion prevista

| area | Contenido | Regla |
|---|---|---|
| `src/dominio/compartido` | Dinero y tipos universales minimos | No convertirse en almacen de logica residual. |
| `src/dominio/originacion` | Entidades y reglas de originacion | No conocer cobros ni cierres internamente. |
| `src/dominio/calculo-financiero` | Plan y mora | Sin puertos, repositorios ni fecha del sistema. |
| `src/dominio/cartera-cobros` | Credito, estados, pago, prelacion y cartera | Puede usar calculo y politicas mediante contratos. |
| `src/dominio/cierres-riesgo` | Mayor, cierres, riesgo y provisiones | Consulta hechos; no modifica internamente otros agregados. |
| `src/dominio/politicas` | Versiones, vigencias y seleccion | No ejecuta la formula consumidora. |
| `src/aplicacion` | Casos de uso por capacidad | Orquesta, no contiene formulas. |
| `src/puertos` | Contratos primarios/secundarios | Define fronteras estables. |
| `src/contratos` | Zod futuro | Traduce; no decide. |
| `tests` | Pruebas de dominio/aplicacion | Usa dobles de puertos, no servicios reales. |
| `docs` | Analisis, arquitectura, diagramas, ADR, API y trazabilidad | Mantiene evidencia editable. |

### 5.3 Decisiones arquitectonicas que comunica

1. Las dependencias apuntan hacia dominio y abstracciones.
2. Dominio nunca importa aplicacion, contratos ni adaptadores.
3. Contratos externos invocan puertos primarios y no acceden a repositorios.
4. Las pruebas de dominio dependen solo del dominio; las de aplicacion sustituyen puertos.
5. Las rutas minimas exigidas por el prompt seguiran disponibles aunque internamente se organicen modulos.
6. La documentacion y UML especifican el codigo, pero no forman una dependencia de ejecucion.

### 5.4 Reglas de dependencia comprobables

| ID | Regla |
|---|---|
| VD-01 | `dominio/**` no importa `aplicacion/**`, `contratos/**` ni adaptadores. |
| VD-02 | `calculo-financiero/**` solo importa tipos matematicos/compartidos autorizados. |
| VD-03 | `aplicacion/**` depende de puertos secundarios por interfaz. |
| VD-04 | `contratos/**` solo transforma e invoca puertos primarios. |
| VD-05 | No existen dependencias circulares entre modulos. |
| VD-06 | Ningun archivo de P1 importa Express, Fastify, ORM o controladores HTTP. |
| VD-07 | Los tests del nucleo no requieren red, BD, variables externas ni reloj real. |

### 5.5 Atributos de calidad demostrados

| Atributo | Evidencia en la vista |
|---|---|
| Mantenibilidad | Ubicacion predecible y dependencias unidireccionales. |
| Testabilidad | Separacion de pruebas y puertos sustituibles. |
| Modificabilidad | Variaciones externas aisladas del dominio. |
| Seguridad | Contratos no exponen entidades ni acceden directamente a persistencia. |
| Analizabilidad | Correspondencia visible entre modulo, archivo y responsabilidad. |

## 6. Vista de escenarios (+1)

### 6.1 Proposito

La vista de escenarios comprueba que la descomposicion logica y de desarrollo soporta los recorridos de mayor riesgo. No reemplaza los diagramas de secuencia de E1; los conecta dentro de una historia arquitectonica comun.

### 6.2 Escenarios seleccionados

| ID | Escenario | Motivo de seleccion | Requisitos principales |
|---|---|---|---|
| E1 | Originar credito | Recorre cliente, solicitud, evaluacion y decision. | RF-01–RF-04 |
| E2 | Desembolsar credito | Une politica, calculo exacto, estado y mayor. | RF-05, RF-06, RF-25, RF-26 |
| E3 | Registrar pago | Es el flujo critico de idempotencia, prelacion, excedente y movimiento. | RF-07–RF-10 |
| E4 | Deteriorar y regularizar | Demuestra reversibilidad valida del ciclo y salida incobrable. | RF-11–RF-17, RF-19 |
| E5 | Consultar cartera en riesgo | Demuestra clasificacion, saldo completo y exclusiones. | RF-18, RF-19 |
| E6 | Generar cierre mensual | Integra hechos, riesgo, provision, idempotencia y congelamiento. | RF-21–RF-23 |

### 6.3 Encadenamiento comunicado

1. E1 habilita E2 unicamente despues de aprobacion.
2. E2 crea un credito activo que puede recibir E3.
3. E3 puede mantener mora, regularizar o cancelar, afectando E4.
4. E4 cambia la composicion consultada por E5.
5. Desembolsos y pagos generan movimientos consumidos por E6.
6. E6 incluye E5 para reportar cartera en riesgo.

### 6.4 Decisiones arquitectonicas que comunica

- ningun escenario salta los puertos/casos de uso para modificar estado;
- las reglas exactas se reutilizan entre escenarios;
- politicas, fecha e identidad son entradas explicitas;
- movimientos conectan operaciones con cierres sin acoplar cierres a la ejecucion interna del pago;
- idempotencia se aplica en los limites de operaciones con efecto;
- el deterioro se deriva, pero la declaracion incobrable requiere autorizacion.

### 6.5 Relacion con escenarios de calidad

| Escenario 4+1 | Escenario ISO/IEC 25010 relacionado |
|---|---|
| E2 Desembolsar | ECQ-01 exactitud del plan; ECQ-03 cambio de tasa; ECQ-05 politica inconsistente |
| E3 Registrar pago | ECQ-02 reintento de pago |
| E4 Deteriorar/regularizar | Q-FI-07 y Q-SA-02 |
| E5 Consultar riesgo | Q-AC-07 |
| E6 Cierre mensual | Q-FI-03 y Q-FI-05 |
| Todos mediante nuevos canales | ECQ-04 nuevo canal MCP |

## 7. Correspondencia entre vistas

| Capacidad | Vista logica | Vista de desarrollo | Vista de escenarios |
|---|---|---|---|
| Originacion | Cliente/Solicitud/Evaluacion | `dominio/originacion`, `aplicacion/originacion` | E1, E2 |
| Plan exacto | Dinero/Tasa/Plan | `calculo-financiero` | E2 |
| Pago | Credito/Pago/Chain/Strategy | `cartera-cobros`, caso RegistrarPago | E3 |
| Mora/estado | CalculadoraMora/State | calculo + cartera | E4 |
| Cartera en riesgo | CarteraRiesgo/Credito | `cierres-riesgo` + consulta de cartera | E5 |
| Cierre | Movimiento/Mayor/Cierre | `cierres-riesgo`, aplicacion y puertos | E6 |
| Politica | Politica/Selector | `dominio/politicas` | E2, E6 |

Si un elemento aparece en un escenario, debe tener responsable en la vista logica y ubicacion prevista en desarrollo. Esta tabla demuestra esa correspondencia.

## 8. Relacion con Arquitectura Hexagonal

| Concepto hexagonal | Vista logica | Vista de desarrollo | Escenarios |
|---|---|---|---|
| Dominio | Modulos y conceptos | `src/dominio` | Decide reglas durante E1–E6 |
| Aplicacion | Casos de uso | `src/aplicacion` | Coordina cada escenario |
| Puerto primario | Frontera de invocacion | `src/puertos/primarios` | Punto de entrada E1–E6 |
| Puerto secundario | Dependencia abstracta | `src/puertos/secundarios` | Reloj, repositorio, IDs, UoW |
| Adaptador futuro | Implicito fuera del nucleo | No se implementa en P1 | Puede iniciar escenarios sin cambiarlos |

## 9. Vistas no incluidas y razon

### 9.1 Vista de procesos

No se crea como vista adicional porque P1 no tiene procesos concurrentes, hilos, colas, servidor ni tareas desplegadas. Inventar topologia de ejecucion seria engañoso. La atomicidad e idempotencia si quedan descritas en arquitectura y escenarios.

Cuando exista API, proceso programado y persistencia, una vista de procesos podra mostrar:

- concurrencia entre pagos;
- exclusion/control optimista por credito;
- ejecucion de cierres;
- publicacion Outbox;
- reintentos y consumidores idempotentes.

### 9.2 Vista fisica/despliegue

No se incluye porque despliegue esta expresamente fuera del alcance. Se definira cuando existan decisiones reales de servidor, base de datos, red y observabilidad. C4 Nivel 2 mostrara evolucion futura sin afirmar un despliegue implementado.

## 10. Trazabilidad incremental

| Requisito/atributo | Vista | Elemento | Verificacion posterior |
|---|---|---|---|
| RF-01–RF-04 | Logica/desarrollo/escenarios | Originacion, E1 | Pruebas de cliente, evaluacion y decision |
| RF-05, RF-06, RF-25, RF-26 | Tres vistas | Plan/politica/desembolso, E2 | CA-01 y no retroactividad |
| RF-07–RF-10 | Tres vistas | Pago/Chain/Strategy, E3 | CA-03–CA-05 e idempotencia |
| RF-11–RF-17 | Logica/escenarios | Mora/State, E4 | Limites y transiciones |
| RF-18, RF-19 | Logica/desarrollo/escenarios | CarteraRiesgo, E5 | CA-06/CA-07 |
| RF-20–RF-23 | Logica/desarrollo/escenarios | Movimiento/Cierre, E6 | Cierre y mayor |
| RNF-01–RNF-03 | Logica/escenarios | Calculo puro, politica, movimientos | Exactitud/reproduccion |
| RNF-08–RNF-10 | Desarrollo | Modulos, imports y tests | VD-01–VD-07 |
| RNF-12, RNF-16 | Logica/desarrollo | Puertos y contratos | Nuevo adaptador sin cambiar dominio |

## 11. Decisiones adoptadas

| ID | Decision | Consecuencia |
|---|---|---|
| D8-01 | Usar vista logica, desarrollo y escenarios. | Cumple exactamente las vistas obligatorias/preferidas del prompt. |
| D8-02 | Tratar escenarios como el “+1”. | Los recorridos validan la utilidad de las otras vistas. |
| D8-03 | Mostrar modulos, no clases exhaustivas, en logica. | Evita duplicar el diagrama de clases E1 y resalta responsabilidades. |
| D8-04 | Representar la estructura de codigo como prevista. | No se afirma que exista implementacion antes de su fase. |
| D8-05 | Seleccionar seis escenarios de alto riesgo. | Cubre origen, operacion, deterioro, riesgo y cierre. |
| D8-06 | No inventar proceso/despliegue. | Las vistas futuras se basaran en componentes realmente implementados. |

## 12. Decisiones pendientes

| ID | Punto | Fase/momento |
|---|---|---|
| DP-24 | Vista de procesos con concurrencia real | Proyecto Final, tras decidir persistencia/ejecucion |
| DP-25 | Vista fisica de despliegue | Proyecto Final |
| DP-18 | Automatizacion de VD-01–VD-07 | Fase de configuracion TypeScript |
| DP-13 | Renderizado automatico de PlantUML | Fase documental/configuracion |

## 13. Validacion contra el enunciado

| Criterio | Evidencia | Estado |
|---|---|---|
| Vista logica obligatoria | V4P1-L y seccion 4 | Cumplido |
| Vista de escenarios obligatoria | V4P1-E y seccion 6 | Cumplido |
| Vista adicional de desarrollo | V4P1-D y seccion 5 | Cumplido |
| Explicacion de cada vista | Secciones 4–6 | Cumplido |
| Decision comunicada por cada vista | Secciones 4.3, 5.3 y 6.4 | Cumplido |
| Consistencia entre vistas | Seccion 7 | Cumplido |
| Relacion con arquitectura hexagonal | Seccion 8 | Cumplido |
| Relacion con atributos de calidad | Secciones 4.4, 5.5 y 6.5 | Cumplido |
| Diagramas editables | Tres archivos `.puml` | Cumplido |
| No adelantar C4 ni despliegue | Secciones 1 y 9 | Cumplido |
| Sin codigo de fases posteriores | Solo documentacion/PlantUML | Cumplido |

## 14. Resultado esperado

El modelo 4+1 permite comprobar el sistema desde tres angulos coherentes: la vista logica asigna las reglas a conceptos y modulos; la vista de desarrollo protege la organizacion y las dependencias; y la vista de escenarios demuestra que ambas soportan los recorridos financieros criticos sin duplicacion ni atajos arquitectonicos.
