# Fase 6 — Arquitectura Hexagonal + Monolito Modular

## 1. Objetivo y alcance

Definir la arquitectura principal del Sistema de Gestion de Microcredito para que el nucleo financiero permanezca exacto, comprobable e independiente de tecnologias externas, y para que Proyecto 2 y el Proyecto Final puedan añadir canales y persistencia sin reescribir el dominio.

La decision es una **Arquitectura Hexagonal organizada como Monolito Modular**. En Proyecto 1 solo se implementara el nucleo ejecutable y sus pruebas; los adaptadores de HTTP, base de datos, interfaz, autenticacion, chat, RAG y MCP permanecen fuera del alcance.

Este documento no sustituye los analisis ISO/IEC 25010, 4+1 o C4, que corresponden a las Fases 7, 8 y 9.

## 2. Requisitos arquitectonicos cubiertos

| Requisito | Respuesta arquitectonica |
|---|---|
| RNF-01 Exactitud | Calculo financiero aislado, decimal exacto y funciones puras. |
| RNF-02 Determinismo | Fecha de corte explicita y puerto `Reloj`; ausencia de dependencias ambientales en calculos. |
| RNF-03 Reproducibilidad | Politicas versionadas y mayor append-only. |
| RNF-04 Auditabilidad | Movimientos e historial de transiciones inmutables. |
| RNF-06 Integridad | Agregados como limites de consistencia y unidad de trabajo en aplicacion. |
| RNF-07 Idempotencia | Identidad de operacion verificada en puertos/repositorios antes del efecto. |
| RNF-08 Mantenibilidad | Modulos con responsabilidades explicitas y dependencias controladas. |
| RNF-09 Modificabilidad | Politicas y adaptadores detras de abstracciones. |
| RNF-10 Testabilidad | Puertos sustituibles, calculos puros y nucleo sin servicios externos. |
| RNF-11 Confiabilidad | Invariantes dentro de agregados y efectos transaccionales atomicos. |
| RNF-12 Interoperabilidad | API, UI, chat y MCP futuros reutilizan los mismos puertos primarios. |
| RNF-16 Independencia de infraestructura | Dominio y aplicacion no importan servidor, ORM, BD ni frameworks de UI. |

## 3. Decision arquitectonica

### 3.1 Arquitectura Hexagonal

El sistema se divide en un interior estable y bordes sustituibles:

1. **Dominio:** entidades, objetos de valor, agregados, politicas y servicios que expresan reglas de negocio.
2. **Aplicacion:** casos de uso que coordinan dominio, puertos, idempotencia y limites transaccionales.
3. **Puertos primarios:** contratos mediante los cuales un actor o canal solicita una operacion.
4. **Puertos secundarios:** contratos que la aplicacion necesita para consultar o producir efectos externos.
5. **Adaptadores primarios:** API, UI, chat, MCP, CLI o procesos programados que traducen entradas al lenguaje de los casos de uso.
6. **Adaptadores secundarios:** persistencia, reloj del sistema, generador de identificadores e integraciones.

La regla fundamental es que las dependencias de codigo apuntan hacia el interior. El nucleo define los contratos que necesita; la infraestructura futura los implementa.

### 3.2 Monolito Modular

Los modulos se despliegan conceptualmente como una unidad, pero cada uno mantiene:

- responsabilidad de negocio explicita;
- API interna estrecha;
- tipos y agregados propios;
- reglas de dependencia verificables;
- ausencia de acceso directo a los detalles internos de otro modulo.

Compartir un proceso no significa compartir indiscriminadamente estado o clases. La comunicacion interna ocurre mediante servicios de aplicacion, identidades y contratos del dominio.

## 4. Por que no microservicios

Microservicios no aportan una ventaja proporcional en Proyecto 1 y elevarian el riesgo financiero y operativo:

| Factor | Monolito modular | Microservicios prematuros |
|---|---|---|
| Consistencia de pago y movimientos | Un limite transaccional local puede ser atomico. | Exige transacciones distribuidas, compensaciones y entrega idempotente. |
| Reproducibilidad | Versiones y calculos residen en una unidad coherente. | Riesgo de versiones divergentes entre servicios. |
| Pruebas | Nucleo completo ejecuta sin red ni servicios. | Requiere contratos, red y entornos multiples. |
| Operacion | Un artefacto y observabilidad central. | Despliegues, monitoreo y fallos parciales por servicio. |
| Volumen conocido | El enunciado no demuestra escalado independiente. | Complejidad sin evidencia de necesidad. |
| Evolucion | Los limites modulares permiten extraer mas adelante. | La distribucion temprana dificulta corregir limites de dominio. |

Una extraccion futura solo se justificaria con evidencia, por ejemplo escalado independiente sostenido, equipos autonomos, requisitos de disponibilidad distintos o aislamiento regulatorio. La extraccion conservaria los contratos de modulo y no modificaria las reglas financieras.

## 5. Capas logicas y responsabilidades

| Capa | Contiene | Puede depender de | No puede depender de |
|---|---|---|---|
| Dominio | Entidades, VO, agregados, servicios, politicas e invariantes | Otros modulos de dominio autorizados y tipos compartidos minimos | Aplicacion, adaptadores, HTTP, ORM, BD, sistema de archivos, fecha global |
| Aplicacion | Casos de uso, comandos, resultados y coordinacion transaccional | Dominio y puertos secundarios | Implementaciones concretas de infraestructura o UI |
| Contratos de entrada | Esquemas futuros y traduccion a comandos | Tipos publicos de aplicacion | Reglas financieras |
| Adaptadores primarios | API/UI/chat/MCP/CLI/proceso | Puertos primarios y contratos | Acceso directo a repositorios o mutacion del dominio |
| Adaptadores secundarios | Repositorios concretos, reloj, UUID, integracion | Puertos secundarios | Decisiones de negocio propias |

## 6. Modulos del monolito

### 6.1 Originacion

Responsable de:

- registrar Cliente;
- crear SolicitudCredito;
- registrar EvaluacionCredito;
- aprobar, rechazar o anular;
- coordinar el desembolso de una aprobacion valida.

Publica casos de uso y resultados; no calcula formulas por su cuenta. Para desembolsar solicita al modulo financiero un plan exacto y al catalogo de politicas la version aplicable.

Propiedad principal: `Cliente`, `SolicitudCredito`, `EvaluacionCredito`.

### 6.2 Calculo financiero

Responsable de:

- `Dinero`, moneda, tasa y redondeo;
- amortizacion francesa;
- interes corriente;
- interes moratorio;
- diferencias de fechas necesarias para mora;
- resultados matematicos exactos.

Sus operaciones son puras: todos los datos, incluidas fechas y politicas, entran como parametros; no consulta repositorios ni reloj.

Propiedad principal: `Dinero`, `Tasa`, `PlanAmortizacion`, `Cuota`, `CalculadoraMora`, `DiasAtraso`, `TramoMora`.

### 6.3 Cartera y cobros

Responsable de:

- ciclo de vida del `Credito`;
- saldos y obligaciones exigibles;
- `Pago` y aplicacion por prelacion;
- tratamiento de excedentes;
- deterioro, regularizacion y reestructuracion;
- estado y clasificacion operativa de mora.

Utiliza calculo financiero mediante funciones/servicios de dominio y politicas mediante contratos. No decide como se persiste un pago.

Propiedad principal: `Credito`, `Pago`, `AplicacionPago`, State, Chain y Strategy de excedente.

### 6.4 Cierres y riesgo

Responsable de:

- mayor basado en `Movimiento` append-only;
- cierres diario y mensual;
- cartera en riesgo y riesgo por tramo;
- provisiones versionadas;
- incobrables del periodo;
- congelamiento e idempotencia del cierre.

Consume saldos/hechos publicados por otros modulos a traves de consultas o puertos, sin modificar directamente sus agregados.

Propiedad principal: `Movimiento`, `CierreDiario`, `CierreMensual`, `ResultadoCarteraRiesgo`.

### 6.5 Politicas institucionales

Responsable de:

- identidad y versiones de politicas;
- intervalos de vigencia;
- seleccion determinista;
- deteccion de ausencia y superposicion;
- conservacion de instantaneas verificables.

No ejecuta la formula consumidora. Entrega parametros tipados al modulo que conoce el calculo.

Propiedad principal: `PoliticaFinanciera`, `VersionPolitica`, `SelectorPoliticaFinanciera`.

### 6.6 Contratos/API

Responsable futuro de:

- esquemas Zod de entrada/salida;
- DTO y errores externos uniformes;
- transformacion entre representacion externa y comandos/resultados;
- especificacion OpenAPI.

No contiene reglas financieras, no crea `Dinero` desde `number` y no accede directamente a repositorios. El servidor HTTP no forma parte de Proyecto 1.

## 7. Matriz de dependencias entre modulos

`✓` significa dependencia autorizada; `—` significa que no debe existir dependencia directa.

| Modulo origen ↓ / destino → | Originacion | Calculo financiero | Cartera y cobros | Cierres y riesgo | Politicas | Contratos |
|---|---:|---:|---:|---:|---:|---:|
| Originacion | — | ✓ | Solo invocacion publica para crear/activar credito | — | ✓ | — |
| Calculo financiero | — | — | — | — | Abstracciones matematicas recibidas como datos | — |
| Cartera y cobros | — | ✓ | — | — | ✓ | — |
| Cierres y riesgo | Consulta publica/identidades | ✓ | Consulta publica/identidades | — | ✓ | — |
| Politicas | — | — | — | — | — | — |
| Contratos | Via puertos primarios | — | Via puertos primarios | Via puertos primarios | Via puerto administrativo | — |

Reglas adicionales:

- ningun modulo importa una implementacion de repositorio;
- Cierres no muta agregados de Cartera para generar un reporte;
- Originacion no modifica internamente `Credito` fuera del caso de uso publico de desembolso/activacion;
- Calculo financiero no conoce estados, repositorios ni actores;
- Contratos traduce, pero no decide.

## 8. Puertos primarios

Los puertos primarios expresan intencion de negocio y son independientes del transporte.

| Puerto | Entrada conceptual | Salida conceptual | Modulo coordinador |
|---|---|---|---|
| `RegistrarCliente` | Datos validados del cliente | `ClienteId` | Originacion |
| `SolicitarCredito` | Cliente, monto, moneda, plazo | `SolicitudCreditoId` | Originacion |
| `EvaluarCredito` | Solicitud, criterios/resultado, actor | `EvaluacionCreditoId` | Originacion |
| `DecidirSolicitud` | Solicitud, decision, actor, motivo | Estado/resultado | Originacion |
| `DesembolsarCredito` | Solicitud, fecha/actor, clave operacion | Credito y plan | Originacion |
| `RegistrarPago` | Credito, importe, fecha/actor, Idempotency-Key | Aplicacion y saldo | Cartera y cobros |
| `CalcularMora` | Credito/cuotas y fecha de corte | Mora por cuota y clasificacion | Cartera y cobros |
| `ReestructurarCredito` | Credito, autorizacion y condiciones | Credito reestructurado | Cartera y cobros |
| `DeclararIncobrable` | Credito, fecha, actor y motivo | Salida contable | Cartera/Cierres |
| `GenerarCierre` | Tipo, periodo, ambito | Cierre diario/mensual | Cierres y riesgo |
| `ConsultarCarteraEnRiesgo` | Fecha de corte y ambito | Resultado de riesgo | Cierres y riesgo |
| `ConsultarCredito` | Credito e identidad del solicitante futuro | Vista de credito/historial | Cartera y cobros |
| `AdministrarPolitica` | Version, vigencia, parametros, autor | Politica registrada | Politicas |

Los cuatro puertos exigidos explicitamente —`DesembolsarCredito`, `RegistrarPago`, `GenerarCierre` y `ConsultarCarteraEnRiesgo`— estan incluidos.

## 9. Puertos secundarios

| Puerto | Necesidad del nucleo | Regla arquitectonica |
|---|---|---|
| `RepositorioClientes` | Buscar unicidad y conservar clientes | Interfaz definida junto a aplicacion/dominio consumidor. |
| `RepositorioSolicitudes` | Recuperar y guardar solicitudes | Devuelve agregados, no registros ORM. |
| `RepositorioCreditos` | Recuperar/guardar credito y listar cartera | No filtra reglas de riesgo dentro de SQL como fuente unica de verdad. |
| `RepositorioPagos` | Detectar idempotencia y conservar pago | Busqueda atomica por clave y ambito. |
| `RepositorioCierres` | Detectar y conservar cierre idempotente | Identidad unica por tipo/periodo/ambito. |
| `RepositorioMovimientos` | Anexar y consultar el mayor | No ofrece actualizar/eliminar movimiento. |
| `RepositorioPoliticas` | Seleccionar versiones por vigencia | Debe detectar 0 o multiples coincidencias. |
| `Reloj` | Proporcionar fecha explicita a casos de uso | Obligatorio; calculos reciben la fecha ya resuelta. |
| `GeneradorIds` | Crear identidades sin acoplarse a UUID | Sustituible y determinista en pruebas. |
| `UnidadDeTrabajo` | Confirmar cambios y movimientos atomicamente | El nucleo no conoce la tecnologia transaccional. |

Los tres puertos secundarios minimos del enunciado —`RepositorioCreditos`, `Reloj` y `GeneradorIds`— estan incluidos.

## 10. Adaptadores y alcance temporal

### 10.1 Adaptadores permitidos en Proyecto 1

Para probar el nucleo pueden existir adaptadores en memoria o dobles dentro de pruebas. No constituyen persistencia real y no requieren servicios externos.

### 10.2 Adaptadores futuros, no implementados

| Adaptador | Puerto utilizado/implementado | Proyecto esperado |
|---|---|---|
| API REST | Invoca puertos primarios | Proyecto Final |
| Interfaz/prototipo | Invoca los mismos puertos primarios | Proyecto 2/Final |
| Chat | Invoca los mismos puertos primarios | Proyecto Final |
| Servidor MCP | Invoca los mismos puertos primarios | Proyecto Final |
| Proceso de cierre | Invoca `GenerarCierre` | Proyecto Final |
| PostgreSQL/ORM | Implementa repositorios y unidad de trabajo | Proyecto Final |
| Reloj del sistema | Implementa `Reloj` | Proyecto Final |

API, UI, chat y MCP no duplican formulas ni transiciones. Solo traducen solicitudes, invocan un caso de uso y presentan su resultado.

## 11. Flujo de control representativo

### 11.1 Registrar pago

1. Un adaptador primario traduce entrada externa a un comando exacto.
2. `RegistrarPago` verifica Idempotency-Key mediante `RepositorioPagos`.
3. Obtiene fecha por `Reloj` si no fue fijada licitamente por el comando.
4. Recupera `Credito` mediante `RepositorioCreditos`.
5. El agregado/State valida que el estado admite pago.
6. Chain aplica gastos, moratorio, corriente y capital.
7. Strategy procesa el excedente.
8. El agregado aplica cambios y transiciones.
9. La aplicacion prepara `Pago` y `Movimiento` por concepto.
10. `UnidadDeTrabajo` confirma credito, pago y movimientos de manera atomica.
11. El mismo reintento devuelve el resultado previo sin repetir los pasos financieros.

### 11.2 Desembolsar credito

1. `DesembolsarCredito` obtiene solicitud y fecha.
2. Valida estado APROBADO y vigencia.
3. Selecciona exactamente una politica.
4. Solicita al calculo financiero crear el plan.
5. El plan valida capital amortizado y saldo final.
6. Se crea/activa el credito conservando politica e historial.
7. Credito, solicitud y movimiento de desembolso se confirman atomicamente.

## 12. Consistencia, transacciones e idempotencia

### 12.1 Limites de consistencia

Cada agregado protege invariantes locales. Una operacion que involucra mas de un agregado se coordina en la capa de aplicacion mediante `UnidadDeTrabajo`.

| Caso de uso | Cambios que deben confirmarse juntos |
|---|---|
| Desembolsar | Solicitud/estado, credito/plan y movimiento de desembolso. |
| Registrar pago | Credito/cuotas, Pago/aplicacion y movimientos por concepto. |
| Declarar incobrable | Estado del credito y movimiento de salida contable. |
| Generar cierre | Identidad/resultado del cierre y cualquier movimiento propio de ajuste/provision. |

Una falla antes de confirmar no deja un efecto parcial. La persistencia futura debera imponer claves unicas para la identidad idempotente, pero la semantica pertenece a aplicacion/dominio.

### 12.2 Concurrencia futura

Aunque Proyecto 1 no persiste datos, el contrato supone control de concurrencia optimista o serializacion equivalente para impedir que dos pagos actualicen simultaneamente el mismo saldo desde una version antigua.

El agregado puede conservar un numero de version conceptual. Ante conflicto, el caso de uso se reintenta recuperando el estado vigente y respetando la misma clave idempotente; nunca se fuerza una escritura que viole invariantes.

## 13. Eventos y comunicacion interna

Los hechos identificados en Fase 2 pueden modelarse como eventos de dominio inmutables para desacoplar efectos secundarios dentro del monolito. En Proyecto 1 no requieren bus ni mensajeria.

Reglas:

- el agregado registra hechos despues de validar una transicion;
- la aplicacion convierte hechos financieros en movimientos dentro de la misma unidad de trabajo;
- un evento no sustituye la confirmacion atomica del saldo;
- cualquier publicacion externa futura ocurre despues de persistir, mediante un patron confiable como Outbox, no implementado ahora;
- consumidores deben ser idempotentes.

## 14. Estructura prevista del codigo

La estructura definitiva se creara en las fases de configuracion e implementacion. Esta vista expresa limites, no autoriza crear infraestructura:

```text
src/
  dominio/
    compartido/             # Dinero y tipos minimos verdaderamente compartidos
    originacion/
    calculo-financiero/
    cartera-cobros/
    cierres-riesgo/
    politicas/
  aplicacion/
    originacion/
    cartera-cobros/
    cierres-riesgo/
    politicas/
  puertos/
    primarios/
    secundarios/
  contratos/                # Zod futuro; sin reglas financieras
tests/
  dominio/
  aplicacion/
```

El prompt exige como minimo ciertos archivos directamente bajo `src/dominio/`. En la fase de configuracion se armonizara esa exigencia con los modulos sin romper las rutas obligatorias: los archivos minimos podran actuar como puntos publicos del modulo y delegar internamente cuando el volumen lo justifique.

## 15. Reglas de cumplimiento arquitectonico

| ID | Regla verificable |
|---|---|
| ARQ-01 | Ningun archivo de dominio importa desde aplicacion, contratos o adaptadores. |
| ARQ-02 | Ningun calculo financiero lee fecha del sistema, variables de entorno, red o almacenamiento. |
| ARQ-03 | Ningun contrato Zod/OpenAPI implementa formulas o transiciones. |
| ARQ-04 | Ningun adaptador modifica agregados sin invocar un puerto primario. |
| ARQ-05 | Repositorios concretos implementan interfaces del nucleo; el nucleo no importa ORM. |
| ARQ-06 | Solo el modulo propietario modifica su agregado. |
| ARQ-07 | Toda referencia entre agregados usa identidad o API publica, no acceso a miembros internos. |
| ARQ-08 | Pago y sus movimientos se confirman en un limite atomico. |
| ARQ-09 | Movimientos no exponen operaciones de actualizacion o eliminacion. |
| ARQ-10 | API, UI, chat y MCP futuros reutilizan los mismos casos de uso. |
| ARQ-11 | Los tests del nucleo ejecutan sin servidor, BD ni servicios externos. |
| ARQ-12 | No se introducen microservicios sin un ADR y evidencia operativa. |

Estas reglas se verificaran mas adelante con revision de imports, pruebas y auditoria de dependencias.

## 16. Riesgos arquitectonicos y mitigaciones

| Riesgo | Impacto | Mitigacion |
|---|---|---|
| Monolito se convierte en “bola de lodo” | Acoplamiento y cambios impredecibles | APIs internas, propiedad de agregados y reglas ARQ automatizables. |
| Carpeta compartida crece sin control | Dependencias circulares | Compartir solo VO universales; mover logica al modulo propietario. |
| Duplicacion de reglas en API/UI | Resultados inconsistentes | Canales invocan puertos primarios y no calculan. |
| Repositorio filtra reglas financieras | Regla oculta en infraestructura | Repositorios recuperan datos; dominio decide salvo consultas optimizadas verificadas. |
| Pago queda sin movimiento o viceversa | Saldo/auditoria divergentes | Unidad de trabajo y restriccion idempotente. |
| Politica se modifica retroactivamente | Resultados historicos irreproducibles | Version + instantanea + huella. |
| Eventos añaden consistencia eventual innecesaria | Complejidad y fallos parciales | Procesamiento local/transaccional en P1; Outbox solo futuro. |
| Limites modulares equivocados | Reorganizacion futura | Mantenerlos logicos y faciles de refactorizar antes de distribuir. |

## 17. Diagrama editable

El archivo `docs/diagramas/arquitectura/01-hexagonal-monolito-modular.puml` muestra:

- adaptadores primarios futuros;
- puertos primarios;
- servicios de aplicacion;
- modulos del dominio;
- puertos secundarios;
- adaptadores secundarios futuros;
- direccion de dependencias hacia los contratos del nucleo.

## 18. Trazabilidad incremental

| Requisito/decision | Mecanismo arquitectonico | Artefacto | Verificacion posterior |
|---|---|---|---|
| RF-05, RF-06, RF-25, RF-26 | Servicio de desembolso + politica + calculo puro | Originacion/Calculo/Politicas | Prueba de aplicacion con puertos falsos |
| RF-07–RF-10 | Puerto `RegistrarPago`, agregado, Chain, Strategy y UoW | Cartera y cobros | Casos CA-03–CA-05 e idempotencia |
| RF-11–RF-14 | Fecha inyectada y calculo puro | `Reloj`, Calculo financiero | Fechas limites y CA-02 |
| RF-15–RF-17 | State dentro del agregado | Cartera y cobros | Matriz de transiciones |
| RF-18, RF-19 | Consulta coordinada y servicio de dominio | Cierres y riesgo | CA-06/CA-07 |
| RF-20–RF-23 | Cierre/mayor y repositorios append-only | Cierres y riesgo | Idempotencia y reproduccion de saldo |
| RNF-01, RNF-02 | Calculo puro, decimal y Reloj | Nucleo de dominio/puerto | Repetibilidad exacta |
| RNF-08–RNF-10 | Modulos, abstracciones y puertos | Arquitectura completa | Reglas de imports y dobles de prueba |
| RNF-12, RNF-16 | Adaptadores externos al nucleo | Hexagono | Revision de dependencias y C4 futuro |
| Evolucion API/UI/chat/MCP | Mismos puertos primarios | Adaptadores futuros | Contratos en fases posteriores |

## 19. Decisiones adoptadas

| ID | Decision | Consecuencia |
|---|---|---|
| D6-01 | Arquitectura Hexagonal. | El dominio no depende de infraestructura y los canales son sustituibles. |
| D6-02 | Monolito Modular como unidad de despliegue. | Consistencia y operacion simples con limites internos explicitos. |
| D6-03 | Servicios de aplicacion orquestan; dominio decide. | Se evitan formulas en controladores y coordinacion dentro de entidades. |
| D6-04 | Calculo financiero puro. | Maxima testabilidad y determinismo. |
| D6-05 | `Reloj` obligatorio como puerto. | Ningun calculo depende implicitamente de “hoy”. |
| D6-06 | Unidad de trabajo conceptual. | Pago/movimientos y demas efectos multiagregado son atomicos. |
| D6-07 | Eventos locales sin bus en P1. | Se preserva desacoplamiento sin introducir distribucion. |
| D6-08 | API, UI, chat y MCP reutilizaran puertos primarios. | El nucleo no se reescribe al añadir canales. |
| D6-09 | Persistencia futura detras de repositorios. | ORM y PostgreSQL no contaminan el modelo. |
| D6-10 | Sin microservicios en el alcance actual. | Se evita complejidad distribuida sin evidencia. |

## 20. Decisiones pendientes

| ID | Punto pendiente | Tratamiento |
|---|---|---|
| DP-14 | Tecnologia concreta de persistencia y UoW | Fuera de P1; no afecta interfaces del nucleo. |
| DP-15 | Mecanismo de control de concurrencia | Elegir en Proyecto Final; el contrato exige detectar conflicto. |
| DP-16 | Publicacion externa/Outbox | Solo si existe integracion real futura. |
| DP-17 | Extraccion eventual de modulos | Solo con metricas y ADR; no prevista actualmente. |
| DP-18 | Reglas automaticas de imports | Definir al configurar TypeScript/lint sin agregar herramientas innecesarias. |

## 21. Validacion contra el enunciado

| Criterio | Evidencia | Estado |
|---|---|---|
| Arquitectura Hexagonal principal | Secciones 3.1 y 5 | Cumplido |
| Monolito Modular | Secciones 3.2, 4, 6 y 7 | Cumplido |
| Sin microservicios | Seccion 4 y D6-10 | Cumplido |
| Originacion separada | Seccion 6.1 | Cumplido |
| Calculo financiero puro | Seccion 6.2 | Cumplido |
| Cartera y cobros separada | Seccion 6.3 | Cumplido |
| Cierres separados | Seccion 6.4 | Cumplido |
| Contratos sin reglas | Seccion 6.6 | Cumplido |
| Puertos primarios minimos | Seccion 8 | Cumplido |
| Puertos secundarios minimos | Seccion 9 | Cumplido |
| `Reloj` y fecha inyectada | Secciones 9 y 11 | Cumplido |
| Nucleo sin infraestructura | Secciones 5, 10 y 15 | Cumplido |
| Evolucion API/chat/MCP explicita | Seccion 10.2 y diagrama | Cumplido |
| Diagrama editable | Archivo PlantUML de arquitectura | Cumplido |
| Sin implementar piezas fuera del alcance | Solo documentacion y PlantUML | Cumplido |

## 22. Resultado esperado

El sistema queda diseñado como un nucleo estable de dominio y aplicacion, rodeado de puertos. Los calculos pueden probarse sin infraestructura; pagos y cierres tienen limites consistentes; las politicas permanecen versionadas; y API, UI, chat, MCP y persistencia podran conectarse posteriormente mediante adaptadores sin duplicar ni reescribir las reglas financieras.
