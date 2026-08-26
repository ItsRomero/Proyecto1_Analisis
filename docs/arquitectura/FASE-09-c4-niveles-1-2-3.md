# Fase 9 — Modelo C4: niveles 1, 2 y 3

## 1. Objetivo y alcance

Comunicar la arquitectura del Sistema de Gestion de Microcredito mediante tres niveles de abstraccion coherentes:

1. **Nivel 1 — Contexto:** personas y sistemas externos que interactuan con el sistema.
2. **Nivel 2 — Contenedores:** unidades ejecutables/almacenamiento actuales y futuras.
3. **Nivel 3 — Componentes:** estructura interna del contenedor principal, el nucleo.

Los diagramas muestran la evolucion futura exigida sin afirmar que API, interfaz, chat, MCP, base de datos o integraciones esten implementados en Proyecto 1.

## 2. Artefactos creados

| Codigo | Nivel | Archivo editable |
|---|---|---|
| C4-N1 | Contexto | `docs/diagramas/c4/01-nivel-1-contexto.puml` |
| C4-N2 | Contenedores | `docs/diagramas/c4/02-nivel-2-contenedores.puml` |
| C4-N3 | Componentes del nucleo | `docs/diagramas/c4/03-nivel-3-componentes-nucleo.puml` |

Los diagramas utilizan C4-PlantUML mediante las inclusiones estandar `<C4/C4_Context>`, `<C4/C4_Container>` y `<C4/C4_Component>`. Requieren una distribucion de PlantUML que incluya la biblioteca C4.

## 3. Convenciones

| Convencion | Significado |
|---|---|
| Etiqueta `P1` en verde | Elemento que pertenece al nucleo previsto para Proyecto 1. |
| Etiqueta `Futuro` en gris | Elemento mostrado para evolucion, expresamente no implementado. |
| Relacion “invoca puertos primarios” | El canal traduce entradas y reutiliza casos de uso; no contiene reglas. |
| Relacion “implementa puertos secundarios” | La dependencia concreta queda fuera del nucleo. |
| “Tecnologia por decidir” | No se inventa una seleccion tecnologica fuera de la fase correspondiente. |

El contexto no usa etiquetas de implementacion porque presenta responsabilidades organizacionales, no inventario tecnico. En N2 y N3 la distincion temporal es obligatoria para evitar confundir vision futura con alcance entregado.

## 4. C4 Nivel 1 — Contexto

### 4.1 Proposito

Definir el limite del Sistema de Gestion de Microcredito y mostrar quien obtiene valor de el o intercambia informacion con el.

### 4.2 Personas

| Persona | Relacion con el sistema |
|---|---|
| Cliente | Solicita credito, recibe desembolso, paga y consulta informacion por canales futuros. |
| Asesor de credito | Registra clientes y solicitudes; consulta seguimiento. |
| Analista/Aprobador | Evalua y decide solicitudes. |
| Gestor de cobros | Registra pagos y regularizaciones. |
| Gestor de riesgos | Consulta mora/riesgo y gestiona deterioro. |
| Encargado financiero | Genera cierres y consulta cartera/movimientos. |
| Auditor | Consulta evidencia historica sin modificarla. |

### 4.3 Sistemas externos

| Sistema externo | Relacion prevista | Estado |
|---|---|---|
| Sistema contable institucional | Recibira movimientos y cierres confirmados. | Futuro |
| Proveedor de identidad | Autenticara usuarios y aportara identidad/roles en el borde. | Futuro |
| Servicio de notificaciones | Recibira solicitudes de avisos de decision, pago o vencimiento. | Futuro |

Estos sistemas se incluyen porque delimitan responsabilidades futuras relevantes. No se presupone proveedor, protocolo ni implementacion concreta.

### 4.4 Decision comunicada

El Sistema de Gestion de Microcredito es una unidad funcional unica responsable de reglas financieras y ciclo del credito. Identidad, contabilidad y entrega de notificaciones son responsabilidades externas. Los usuarios no calculan cuotas, mora o riesgo fuera del sistema como fuente autoritativa.

## 5. C4 Nivel 2 — Contenedores

### 5.1 Proposito

Mostrar las unidades ejecutables y de datos previstas, distinguiendo la entrega P1 de la arquitectura evolutiva.

### 5.2 Contenedores

| Contenedor | Tecnologia | Responsabilidad | Estado |
|---|---|---|---|
| Nucleo de dominio y aplicacion | Node.js 20+ / TypeScript | Casos de uso, dominio, puertos y pruebas exactas. | P1 |
| API REST | Por decidir | Traducir OpenAPI/HTTP a puertos primarios. | Futuro |
| Interfaz/Chat | Por decidir | Presentar capacidades a clientes/usuarios. | Futuro |
| Servidor MCP | Por decidir | Exponer herramientas sobre los mismos casos de uso. | Futuro |
| Proceso programado | Por decidir | Disparar mora y cierres con corte explicito. | Futuro |
| Base de datos | PostgreSQL/tecnologia por decidir | Repositorios, UoW, idempotencia y mayor persistente. | Futuro |

Aunque PostgreSQL es la evolucion esperada por el prompt general, no se selecciona ORM ni diseño fisico en P1.

### 5.3 Relaciones clave

1. UI/chat consume la API futura; no accede a base de datos.
2. API invoca puertos primarios del nucleo.
3. MCP invoca los mismos puertos primarios, no una copia de reglas.
4. El proceso programado invoca casos de mora/cierre con fecha controlada.
5. El nucleo utiliza la base futura unicamente mediante puertos secundarios.
6. Integraciones externas ocurren mediante adaptadores, no desde entidades.

### 5.4 Decision comunicada

P1 es ejecutable y comprobable sin un servidor ni base de datos. La topologia futura rodea al nucleo en lugar de reemplazarlo. El agregado de canales no requiere migrar las formulas a controladores, herramientas MCP o frontend.

## 6. C4 Nivel 3 — Componentes del nucleo

### 6.1 Proposito

Abrir el contenedor “Nucleo de dominio y aplicacion” y mostrar sus componentes, responsabilidades y dependencias.

### 6.2 Componentes de aplicacion

| Componente | Responsabilidad |
|---|---|
| Puertos primarios | Superficie estable para casos de uso. |
| Aplicacion de Originacion | Coordina cliente, solicitud, evaluacion, decision y desembolso. |
| Aplicacion de Cartera y Cobros | Coordina pago idempotente, mora, regularizacion y reestructuracion. |
| Aplicacion de Cierres y Consultas | Coordina cierres y consultas de riesgo. |
| Aplicacion de Politicas | Coordina administracion de versiones. |

### 6.3 Componentes de dominio

| Componente | Responsabilidad |
|---|---|
| Dominio de Originacion | Cliente, solicitud y evaluacion. |
| Calculo Financiero | Dinero, tasas, plan frances e intereses con funciones puras. |
| Dominio de Cartera y Cobros | Credito/State, Pago, Chain, Strategy y mora. |
| Dominio de Cierres y Riesgo | Movimiento append-only, cierres, provisiones y cartera en riesgo. |
| Dominio de Politicas | Versiones, vigencia, huella y seleccion determinista. |

### 6.4 Frontera secundaria

`Puertos secundarios` agrupa las abstracciones:

- repositorios de clientes, solicitudes, creditos, pagos, movimientos, cierres y politicas;
- `Reloj`;
- `GeneradorIds`;
- `UnidadDeTrabajo`.

Persistencia, reloj real, UUID e integracion contable se muestran como adaptadores futuros que implementan o consumen esos contratos.

### 6.5 Decision comunicada

Los adaptadores primarios solo conocen la superficie de aplicacion. Los servicios de aplicacion orquestan y los componentes de dominio deciden. Las dependencias externas quedan detras de puertos secundarios. Calculo financiero permanece reutilizable y ajeno al transporte, persistencia y fecha global.

## 7. Conexion futura de API, Chat/UI y MCP

| Canal | Conexion | Regla |
|---|---|---|
| API REST | Adaptador API → Puertos primarios | Valida/traduce mediante contratos; no implementa formulas. |
| Chat/UI | UI → API o adaptador autorizado → Puertos primarios | Presenta resultados; no calcula cuotas/mora localmente. |
| MCP | Adaptador MCP → Puertos primarios | Cada tool envuelve un caso de uso existente. |

Ejemplo conceptual:

```text
API POST /creditos/{id}/pagos ─┐
UI accion "Registrar pago" ────┼──> RegistrarPago ──> dominio/puertos secundarios
MCP tool registrar_pago ────────┘
```

Los tres caminos producen la misma semantica de idempotencia, State, Chain, Strategy, movimientos y errores. Ningun canal puede omitir una invariante.

## 8. Consistencia vertical N1 → N2 → N3

| Necesidad de N1 | Contenedor N2 | Componentes N3 |
|---|---|---|
| Registrar/decidir solicitudes | Nucleo; API/UI futuros | Puertos primarios, aplicacion y dominio de Originacion |
| Desembolsar con calculo exacto | Nucleo | Originacion, Calculo Financiero y Politicas |
| Registrar pagos | Nucleo; API/UI/MCP futuros | Aplicacion/Dominio de Cartera y Cobros |
| Consultar riesgo | Nucleo; canales futuros | Cierres/Consultas, Cartera y Calculo Financiero |
| Generar cierres | Nucleo; proceso programado futuro | Aplicacion/Dominio de Cierres y Riesgo |
| Auditar | Nucleo; API/UI futuros | Movimiento, cierres, estados y politicas |
| Integrar contabilidad | Sistema contable externo | Puertos secundarios + adaptador de integracion futuro |
| Autenticar | Proveedor externo + API/MCP | Fuera del nucleo; ActorId llega al caso de uso |

No existe un contenedor en N2 sin proposito de contexto o componente interno correspondiente, ni un componente N3 que contradiga los limites de N1.

## 9. Correspondencia con 4+1 y UML

| C4 | Vista 4+1/UML relacionada | Diferencia de proposito |
|---|---|---|
| N1 Contexto | Casos de uso / vista de escenarios | C4 delimita personas y sistemas; UML detalla capacidades. |
| N2 Contenedores | Vista de desarrollo futura | C4 muestra unidades ejecutables; desarrollo muestra organizacion del codigo. |
| N3 Componentes | Vista logica | C4 muestra componentes del contenedor; logica muestra conceptos/colaboraciones. |
| Relaciones de pago/desembolso | Secuencias UML | C4 no describe orden temporal; las secuencias si. |
| Estado del credito | Diagrama de estados | C4 asigna propietario; UML define transiciones. |

Los diagramas no se duplican: cada notacion responde una pregunta distinta.

## 10. Relacion con atributos ISO/IEC 25010

| Atributo | Evidencia C4 |
|---|---|
| Exactitud | unico componente de Calculo Financiero reutilizado por casos de uso. |
| Fiabilidad | Pago/cierre permanecen en el nucleo; persistencia implementara UoW e idempotencia. |
| Mantenibilidad | Componentes cohesionados y dependencias dirigidas. |
| Testabilidad | Nucleo P1 ejecuta aislado; adaptadores quedan fuera. |
| Seguridad | Identidad se valida en el borde; autoria llega al nucleo; BD no se expone a canales. |
| Interoperabilidad | API/MCP/integracion son adaptadores explicitos. |
| Flexibilidad | Canales y persistencia son sustituibles sin cambiar componentes de dominio. |

## 11. Reglas de consistencia C4

| ID | Regla verificable |
|---|---|
| C4-R01 | Todo sistema externo de N1 conserva su condicion externa en N2/N3. |
| C4-R02 | Todo contenedor futuro esta etiquetado como `Futuro`. |
| C4-R03 | El unico contenedor ejecutable de P1 es el nucleo. |
| C4-R04 | API, UI/chat y MCP no acceden directamente al dominio ni a persistencia. |
| C4-R05 | API y MCP invocan los mismos puertos primarios. |
| C4-R06 | Calculo Financiero no depende de aplicacion ni adaptadores. |
| C4-R07 | Persistencia futura implementa puertos secundarios. |
| C4-R08 | `Reloj` es un puerto secundario explicito. |
| C4-R09 | N3 conserva los seis modulos definidos en arquitectura. |
| C4-R10 | Ninguna relacion implica servidor, BD o MCP ya implementado. |

## 12. Trazabilidad incremental

| Requisito/decision | N1 | N2 | N3 | Verificacion posterior |
|---|---|---|---|---|
| RF-01–RF-06 | Actores de originacion | Nucleo/API/UI | Originacion, Calculo, Politicas | Pruebas originacion/CA-01 |
| RF-07–RF-10 | Cliente/Gestor cobros | Nucleo/API/UI/MCP | Cartera y Cobros | CA-03–CA-05/idempotencia |
| RF-11–RF-17 | Gestor riesgos/proceso | Nucleo/proceso futuro | Cartera, Calculo, Politicas | Mora/State |
| RF-18, RF-19 | Gestor/Financiero | Nucleo/canales | Cierres, Cartera, Calculo | CA-06/CA-07 |
| RF-20–RF-23 | Financiero/Proceso/Contabilidad | Nucleo/proceso/DB futuros | Cierres, puertos secundarios | Cierres/mayor |
| RNF-08–RNF-10 | Sistema delimitado | Nucleo aislado | Componentes/puertos | Dependencias/tests |
| RNF-12 | Sistemas externos | API/MCP/integracion | Adaptadores → mismos puertos | OpenAPI/MCP futuro |
| RNF-16 | Responsabilidades externas | Adaptadores separados | Dominio sin adaptadores | Auditoria de imports |
| D6-08 | Canales reutilizan casos de uso | API/UI/MCP futuros | Puertos primarios comunes | C4-R04/C4-R05 |

## 13. Decisiones adoptadas

| ID | Decision | Consecuencia |
|---|---|---|
| D9-01 | Crear C4 N1, N2 y N3 en C4-PlantUML. | Los tres niveles son editables y consistentes. |
| D9-02 | Marcar visualmente P1 frente a Futuro. | La vision evolutiva no se confunde con implementacion actual. |
| D9-03 | Tratar el nucleo como unico contenedor P1. | Se respeta el alcance sin servidor ni persistencia. |
| D9-04 | Modelar API, UI/chat y MCP como adaptadores de puertos comunes. | No se duplican reglas al añadir canales. |
| D9-05 | Mostrar identidad, contabilidad y notificaciones como externos futuros. | El limite del sistema queda explicito sin implementarlos. |
| D9-06 | Abrir en N3 solo el nucleo. | Se detalla el contenedor relevante de P1. |
| D9-07 | No seleccionar tecnologias futuras sin evidencia. | Se evitan compromisos prematuros, salvo restricciones ya indicadas. |

## 14. Decisiones pendientes

| ID | Punto | Momento |
|---|---|---|
| DP-26 | Tecnologia de API/UI/chat/MCP | Proyecto 2/Final |
| DP-14 | Persistencia/ORM y UoW concretos | Proyecto Final |
| DP-21 | Proveedor/protocolo de identidad | Proyecto Final |
| DP-16 | Integracion contable y Outbox | Proyecto Final si se requiere |
| DP-27 | Servicio/canales de notificacion | Proyecto Final |
| DP-13 | Renderizado automatizado de C4-PlantUML | Fase documental/configuracion |

## 15. Validacion contra el enunciado

| Criterio | Evidencia | Estado |
|---|---|---|
| C4 Nivel 1 Contexto | C4-N1 y seccion 4 | Cumplido |
| Actores y sistemas externos | C4-N1, secciones 4.2–4.3 | Cumplido |
| C4 Nivel 2 Contenedores | C4-N2 y seccion 5 | Cumplido |
| Evolucion futura sin implementar | Etiquetas y seccion 5.2 | Cumplido |
| C4 Nivel 3 Componentes | C4-N3 y seccion 6 | Cumplido |
| Detalle del nucleo principal | Componentes de aplicacion/dominio/puertos | Cumplido |
| API REST futura explicita | C4-N2/N3 y seccion 7 | Cumplido |
| Chat/UI futuro explicito | C4-N2/N3 y seccion 7 | Cumplido |
| MCP futuro explicito | C4-N2/N3 y seccion 7 | Cumplido |
| Mismos casos de uso reutilizados | Puertos primarios comunes | Cumplido |
| Consistencia N1–N3 | Seccion 8 | Cumplido |
| PlantUML editable | Tres archivos `.puml` | Cumplido |
| Sin implementar piezas futuras | Solo documentacion/diagramas | Cumplido |

## 16. Resultado esperado

El modelo C4 permite pasar desde el entorno institucional hasta los componentes internos sin contradicciones. Queda inequivoco que P1 entrega un nucleo Node/TypeScript independiente y que API, UI/chat, MCP, procesos, persistencia e integraciones se conectaran posteriormente mediante puertos, reutilizando las mismas reglas y casos de uso.
