# Fase 7 — Atributos de calidad ISO/IEC 25010

## 1. Objetivo y alcance

Priorizar los atributos de calidad del Sistema de Gestion de Microcredito y convertirlos en decisiones arquitectonicas, escenarios verificables y criterios de aceptacion. El analisis se basa en ISO/IEC 25010:2023 y mantiene correspondencia explicita con los terminos exigidos por la rubrica del proyecto.

Esta fase analiza calidad del producto. No implementa codigo, infraestructura, seguridad operativa, pruebas de carga ni interfaz.

## 2. Referencia normativa y criterio de adaptacion

Se adopta **ISO/IEC 25010:2023, edicion 2**, publicada en noviembre de 2023. La fuente oficial de ISO indica que define un modelo de calidad de producto aplicable a productos TIC y software, compuesto por nueve caracteristicas y utilizable para especificar requisitos, objetivos de prueba, criterios de aceptacion y medidas de calidad.

La edicion ISO/IEC 25010:2011 aparece oficialmente como retirada. Por ello no se presenta el modelo de ocho caracteristicas de 2011 como si fuera la edicion vigente. Sin embargo, se conservan terminos conocidos de esa edicion y de la rubrica cuando facilitan la evaluacion:

- “usabilidad” se relaciona con la capacidad de interaccion de la edicion vigente;
- portabilidad y escalabilidad se analizan principalmente bajo flexibilidad;
- interoperabilidad se mantiene bajo compatibilidad;
- testabilidad y modificabilidad se analizan bajo mantenibilidad;
- exactitud funcional se expresa como correccion funcional dentro de adecuacion funcional.

El estandar es un modelo de referencia, no una garantia automatica. Las medidas y umbrales de este documento son decisiones del proyecto adaptadas al riesgo financiero.

## 3. Caracteristicas consideradas

| Caracteristica ISO/IEC 25010:2023 | Aplicacion al sistema | Prioridad P1 |
|---|---|---:|
| Adecuacion funcional | Cobertura y correccion de calculos, reglas y casos de uso. | Critica (P0) |
| Eficiencia de desempeño | Tiempo, recursos y capacidad para calculos y cierres. | Media (P2) |
| Compatibilidad | Interoperabilidad futura y coexistencia con sistemas/canales. | Alta (P1) |
| Capacidad de interaccion | Uso correcto y prevencion de errores en canales futuros. | Diferida (P2) |
| Fiabilidad | Resultados consistentes, tolerancia a reintentos y recuperacion. | Critica (P0) |
| Seguridad | Integridad, trazabilidad, autenticidad y no repudio conceptual. | Alta (P1) |
| Mantenibilidad | Modularidad, analizabilidad, modificabilidad y testabilidad. | Critica (P0) |
| Flexibilidad | Adaptabilidad, escalabilidad, reemplazabilidad e instalacion futura. | Alta (P1) |
| Seguridad operacional (safety) | Evitar que fallos produzcan perjuicio financiero o decisiones silenciosas. | Alta (P1) |

`P0` significa que un incumplimiento invalida el nucleo de Proyecto 1. `P1` es obligatorio en el diseño y prepara la evolucion. `P2` se diseña conceptualmente, pero su medicion completa depende de componentes fuera del alcance actual.

## 4. Principios de priorizacion

### 4.1 Prioridades criticas

1. **Correccion funcional:** un centavo incorrecto puede acumular diferencias, cambiar saldos, mora, cierres o la obligacion del cliente.
2. **Fiabilidad:** un pago duplicado, cierre no reproducible o movimiento perdido compromete la contabilidad.
3. **Mantenibilidad/testabilidad:** las reglas institucionales cambian; una modificacion no debe alterar contratos historicos ni romper calculos no relacionados.

### 4.2 Prioridades altas

4. **Seguridad:** aun sin autenticacion en P1, el nucleo debe conservar integridad, autoria conceptual y evidencia de operaciones.
5. **Compatibilidad/interoperabilidad:** API, UI, chat, MCP y contabilidad deberan invocar el mismo nucleo sin duplicar reglas.
6. **Flexibilidad:** politicas, adaptadores y capacidad futura deben evolucionar sin reescribir el dominio.
7. **Seguridad operacional:** un resultado ambiguo o una politica ausente debe detener la operacion, no producir un calculo silencioso.

### 4.3 Prioridades posteriores

8. **Eficiencia:** es importante, pero el enunciado no aporta volumen ni SLA que justifique sacrificar exactitud o claridad.
9. **Capacidad de interaccion:** la interfaz no pertenece a P1; el nucleo si debe producir errores y resultados que una futura interfaz pueda explicar correctamente.

## 5. Adecuacion funcional y exactitud

### 5.1 Objetivo

El nucleo cubre los casos de uso requeridos y produce resultados financieros matematicamente correctos, completos y apropiados para su proposito.

### 5.2 Riesgos

- redondeo inconsistente entre modulos;
- uso de punto flotante binario;
- ultima cuota con saldo residual;
- interes moratorio sobre intereses;
- tramo que no corresponde a la fecha de corte;
- exclusion o doble conteo incorrecto en cartera;
- transicion invalida que admite una operacion financiera.

### 5.3 Respuesta arquitectonica

| Decision | Efecto de calidad |
|---|---|
| `Dinero` decimal exacto y ROUND_HALF_UP | Una regla monetaria unica para todo el nucleo. |
| Calculo financiero puro | Formulas aisladas y repetibles. |
| Politicas versionadas | La tasa no se incrusta ni cambia retroactivamente. |
| Factory del plan | Valida el conjunto antes de entregar un plan valido. |
| State del credito | Impide operaciones incompatibles con el estado. |
| Chain de prelacion | Hace visible y comprobable el orden obligatorio. |
| Fecha de corte explicita | El calculo temporal no depende de “hoy”. |
| Matriz de trazabilidad | Cada requisito conserva responsable y prueba. |

### 5.4 Criterios medibles

| ID | Medida/criterio | Umbral P1 |
|---|---|---|
| Q-AC-01 | Filas correctas del caso CA-01 | 12 de 12 |
| Q-AC-02 | Diferencia entre suma de amortizaciones y capital | Q0.00 |
| Q-AC-03 | Saldo final del plan | Q0.00 |
| Q-AC-04 | Error de CA-02 respecto a Q7.26 | Q0.00 |
| Q-AC-05 | Conservacion de pago por concepto y remanente | 100% de casos |
| Q-AC-06 | Fronteras de tramo correctas | 10 de 10 valores definidos |
| Q-AC-07 | Casos de cartera CA-06/CA-07 | 7.00% y 6.06% exactos al presentar |
| Q-AC-08 | Requisitos RF con caso de uso y modulo | 26 de 26 |
| Q-AC-09 | Invariantes con prueba automatizada al finalizar | 18 de 18 identificadas; minimo obligatorio ejecutable cubierto |

## 6. Fiabilidad

### 6.1 Objetivo

El sistema conserva un estado financiero consistente ante reintentos, errores de entrada, fallos antes de confirmacion y reproduccion historica.

### 6.2 Respuesta arquitectonica

- idempotencia para pagos y cierres;
- unidad de trabajo conceptual para credito, pago y movimientos;
- mayor append-only con correcciones compensatorias;
- invariantes protegidas por agregados;
- seleccion de politica que falla ante ausencia o superposicion;
- conflictos explicitos ante una clave idempotente reutilizada con datos distintos;
- control de concurrencia previsto para persistencia futura;
- estados terminales que no se reactivan accidentalmente.

### 6.3 Escenarios y metricas

| ID | Estimulo | Respuesta exigida | Medida |
|---|---|---|---|
| Q-FI-01 | El mismo pago se reintenta 2 o mas veces | Se devuelve el primer resultado sin nuevos movimientos | Exactamente 1 efecto financiero |
| Q-FI-02 | Misma clave, contenido diferente | Conflicto explicito y saldo intacto | 0 movimientos nuevos |
| Q-FI-03 | Cierre se ejecuta dos veces | Resultado previo reconocido | 0 duplicados |
| Q-FI-04 | Falla antes de confirmar pago | Credito, pago y mayor permanecen en estado anterior | 0 efectos parciales |
| Q-FI-05 | Se reproducen movimientos | Saldo reconstruido coincide con saldo reportado | Diferencia Q0.00 |
| Q-FI-06 | Politica ausente o superpuesta | Operacion se detiene con error especifico | 0 calculos con valor implicito |
| Q-FI-07 | Recuperacion de credito incobrable | Se registra contablemente sin reactivar | Estado sigue INCOBRABLE |

La disponibilidad de un servidor no se mide en P1 porque no existe servidor. La fiabilidad evaluable es la del nucleo y sus efectos conceptuales.

## 7. Mantenibilidad y testabilidad

### 7.1 Objetivo

Cambiar una politica o agregar un adaptador sin modificar formulas estables ni provocar efectos no relacionados; diagnosticar rapidamente el origen de un fallo.

### 7.2 Respuesta arquitectonica

| Subatributo | Decision |
|---|---|
| Modularidad | Monolito dividido por capacidades de negocio. |
| Reusabilidad | Casos de uso independientes de API/UI/chat/MCP. |
| Analizabilidad | Trazabilidad, UML editable, reglas con ID y errores especificos. |
| Modificabilidad | Strategy y politicas versionadas; puertos para variaciones externas. |
| Testabilidad | Funciones puras, `Reloj`, IDs y repositorios sustituibles. |

### 7.3 Reglas verificables

| ID | Criterio | Verificacion |
|---|---|---|
| Q-MA-01 | Dominio no importa adaptadores | Revision automatica de imports |
| Q-MA-02 | Calculo financiero no importa aplicacion/repositorios | Revision automatica de imports |
| Q-MA-03 | Nucleo no usa `any` evasivo | TypeScript estricto y busqueda estatica |
| Q-MA-04 | Tests no requieren red, BD ni variables externas | `npm test` en entorno limpio |
| Q-MA-05 | Fecha controlable | 100% de calculos temporales reciben corte o `Reloj` |
| Q-MA-06 | Cambio de Strategy no cambia el consumidor | Pruebas de contrato de estrategias |
| Q-MA-07 | Toda clase usada en secuencia existe en clases | Validacion documental 100% |
| Q-MA-08 | Cada regla corregida actualiza trazabilidad | Revision por ID en matriz |

No se fija un porcentaje arbitrario de cobertura de lineas como sustituto de calidad. Se prioriza cobertura de reglas, ramas financieras, limites y mutaciones de invariantes. Una metrica de cobertura podra acompañar, pero no reemplazar, los casos de aceptacion.

## 8. Seguridad

### 8.1 Alcance en Proyecto 1

Autenticacion y autorizacion estan excluidas, pero eso no elimina los requisitos de seguridad del nucleo. P1 prepara integridad, responsabilidad y no repudio conceptual sin implementar controles de identidad externos.

### 8.2 Amenazas y controles de diseño

| Propiedad | Riesgo | Control de P1 |
|---|---|---|
| Confidencialidad | Exponer datos personales innecesarios | Contratos futuros minimos; entidades no serializadas directamente. |
| Integridad | Alterar saldo, movimiento o politica historica | Agregados, append-only, version/huella y UoW. |
| No repudio | Negar una aprobacion o transicion | Actor/proceso, fecha y motivo obligatorios. |
| Responsabilidad | No identificar origen de una operacion | IDs de operacion, claves idempotentes y referencias de movimiento. |
| Autenticidad | Atribuir accion a identidad no verificada | Puerto futuro de identidad/autorizacion en el borde; P1 conserva `ActorId`. |
| Resistencia | Entrada malformada o reintento abusivo | Tipos estrictos, validacion futura Zod e idempotencia. |

### 8.3 Criterios

| ID | Criterio P1 | Umbral |
|---|---|---|
| Q-SE-01 | Transicion financiera sin actor/proceso | 0 permitidas |
| Q-SE-02 | Movimiento actualizable/eliminable por API de dominio | 0 operaciones expuestas |
| Q-SE-03 | Politica usada sin version/autor/vigencia | 0 permitidas |
| Q-SE-04 | Importe externo convertido desde `number` | 0 rutas permitidas |
| Q-SE-05 | Credenciales o secretos requeridos por tests del nucleo | 0 |

El cifrado, gestion de sesiones, control de acceso, registro de seguridad y proteccion de red se definiran cuando existan adaptadores y despliegue; no se simulan dentro del dominio.

## 9. Compatibilidad e interoperabilidad

### 9.1 Objetivo

Permitir que canales y sistemas futuros intercambien informacion sin copiar reglas financieras ni acoplar el dominio a un protocolo.

### 9.2 Respuesta arquitectonica

- puertos primarios independientes del transporte;
- DTO/esquemas separados de entidades;
- importes externos como cadena y moneda explicita;
- fechas con formato contractual y fecha de corte explicita;
- errores uniformes y codigos estables futuros;
- OpenAPI derivable de Zod;
- movimientos y resultados con identificadores trazables;
- API, UI, chat y MCP como adaptadores del mismo puerto.

### 9.3 Escenarios y criterios

| ID | Escenario | Respuesta/medida |
|---|---|---|
| Q-IN-01 | API y MCP registran el mismo comando valido | Invocan el mismo caso de uso y producen semantica equivalente |
| Q-IN-02 | Importe `1004.62` cruza JSON | Se conserva como cadena exacta; perdida Q0.00 |
| Q-IN-03 | Adaptador cambia de HTTP a CLI/prueba | Dominio modificado: 0 archivos |
| Q-IN-04 | Sistema contable consume movimientos | Concepto, importe, moneda, fecha y origen identificables en 100% |
| Q-IN-05 | Contrato invalido llega al borde | Se rechaza antes de invocar el dominio |

## 10. Flexibilidad, escalabilidad y modificabilidad

### 10.1 Modificabilidad

La modificabilidad aparece tanto en mantenibilidad como en la capacidad del sistema para adaptarse. Los principales puntos de variacion protegidos son:

| Variacion | Mecanismo |
|---|---|
| Tasa/tipo/base | Politica versionada + Strategy |
| Tratamiento de excedente | Strategy |
| Estado y transiciones | State |
| Prelacion | Chain con orden institucional protegido |
| Persistencia | Repositorios/Unidad de trabajo |
| Tiempo e IDs | Puertos `Reloj`/`GeneradorIds` |
| Canal de entrada | Puerto primario + adaptador |
| Calendario | Politica de calendario |

### 10.2 Escalabilidad

P1 no conoce volumen, concurrencia ni SLA, por lo que no se prometen cifras inventadas. Se prepara escalabilidad mediante:

- calculos puros sin estado global;
- servicios de aplicacion sin sesion;
- consultas separadas de mutaciones;
- modulos extraibles solo si metricas futuras lo justifican;
- cierres idempotentes que pueden reintentarse;
- procesamiento por periodo/ambito claramente identificado;
- puertos que permiten optimizar persistencia sin cambiar el dominio.

### 10.3 Criterios actuales y futuros

| ID | Criterio | Fase |
|---|---|---|
| Q-FL-01 | Añadir un adaptador no modifica dominio | P1/diseño |
| Q-FL-02 | Nueva version de tasa no modifica algoritmo ni credito historico | P1/pruebas |
| Q-FL-03 | Nueva Strategy de excedente cumple contrato comun | P1/pruebas |
| Q-FL-04 | Modulos no presentan ciclos de imports | P1/estatica |
| Q-FL-05 | Capacidad de pagos/cierres bajo carga | Proyecto Final, con volumen/SLA reales |
| Q-FL-06 | Extraccion de modulo requiere ADR y evidencia | Evolucion futura |

La escalabilidad no justifica microservicios preventivos. El monolito modular puede escalar verticalmente y replicarse cuando los adaptadores/persistencia sean seguros para ello; una distribucion posterior se decidira con mediciones.

## 11. Eficiencia de desempeño

### 11.1 Prioridad y riesgos

La eficiencia es P2 porque exactitud y auditabilidad prevalecen. Aun asi, una implementacion innecesariamente costosa afectaria cierres y consultas.

### 11.2 Decisiones

- evitar I/O dentro de calculos por cuota;
- calcular un plan en memoria con complejidad lineal `O(n)`, donde `n ≤ 24`;
- recorrer la cartera una vez cuando sea suficiente;
- no recalcular historiales si existe una proyeccion verificable;
- optimizar consultas futuras detras de repositorios;
- no usar cache que omita fecha, version de politica o moneda de la clave.

### 11.3 Medicion responsable

| ID | Medida | Criterio P1/futuro |
|---|---|---|
| Q-PE-01 | Complejidad de generar plan | `O(n)` y memoria `O(n)`, `n ≤ 24` |
| Q-PE-02 | Dependencias externas durante prueba de calculo | 0 |
| Q-PE-03 | Tiempo de suite del nucleo | Se registra al existir; no se fija umbral sin linea base |
| Q-PE-04 | Tiempo de cierre y capacidad concurrente | Se fija en Proyecto Final tras conocer cartera y SLA |

## 12. Capacidad de interaccion

La interfaz esta fuera de P1. El nucleo prepara una interaccion futura segura mediante:

- errores especificos en vez de fallos genericos;
- resultados por concepto para explicar un pago;
- estado y tramo separados para evitar mensajes engañosos;
- conflictos de idempotencia distinguibles;
- campos monetarios y fechas sin ambigüedad;
- decisiones con motivo e historial consultable.

Criterios futuros:

| ID | Criterio | Proyecto |
|---|---|---|
| Q-IC-01 | Mostrar desglose completo del pago | P2/Final |
| Q-IC-02 | Confirmar antes de acciones financieras irreversibles | P2/Final |
| Q-IC-03 | Explicar error sin revelar datos sensibles | P2/Final |
| Q-IC-04 | Accesibilidad e inclusion de UI | P2/Final |

## 13. Seguridad operacional (safety)

En este contexto no se trata de seguridad fisica, sino de evitar que un fallo del producto produzca perjuicios financieros silenciosos o decisiones institucionales incorrectas.

| Riesgo perjudicial | Restriccion de seguridad |
|---|---|
| Politica ausente | Detener calculo; nunca usar una tasa por defecto. |
| Resultado no finito o moneda incompatible | Rechazar operacion antes del efecto. |
| Pago parcial | Aplicarlo segun prelacion; nunca descartarlo por insuficiencia. |
| Excedente | Mantenerlo trazable; nunca perderlo. |
| Transicion invalida | Rechazar sin movimientos. |
| Saldo negativo | Impedir confirmacion. |
| Cierre repetido | No duplicar. |
| Correccion contable | Movimiento compensatorio; no alterar historia. |

| ID | Medida P1 | Umbral |
|---|---|---|
| Q-SA-01 | Errores financieros silenciosos identificados | 0 permitidos |
| Q-SA-02 | Operaciones invalidas con efecto parcial | 0 |
| Q-SA-03 | Excedentes no explicados | Q0.00 |
| Q-SA-04 | Saldos de capital negativos | 0 casos |

## 14. Matriz de tacticas arquitectonicas

| Tactica/decision | Exactitud | Fiabilidad | Mantenibilidad | Seguridad | Interoperabilidad | Flexibilidad |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `Dinero` exacto | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Funciones financieras puras | ✓ | ✓ | ✓ | — | — | ✓ |
| Politicas versionadas | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| State/Chain/Strategy/Factory | ✓ | ✓ | ✓ | — | — | ✓ |
| Puertos y adaptadores | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| `Reloj` inyectable | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| Mayor append-only | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Idempotencia/UoW | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Monolito modular | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## 15. Trade-offs y conflictos entre atributos

| Decision | Beneficio | Costo/compromiso | Resolucion |
|---|---|---|---|
| Decimal exacto | Correccion | Mas costo que aritmetica binaria | Aceptado; exactitud domina desempeño. |
| Historial append-only | Auditoria/fiabilidad | Mayor almacenamiento y consultas mas complejas | Aceptado; se permiten proyecciones verificables. |
| Politicas versionadas | Reproducibilidad | Mas metadatos y validacion de vigencias | Aceptado; evita cambios retroactivos. |
| State y patrones | Modificabilidad | Mas clases y navegacion | Aceptado donde impide transiciones invalidas; no se generaliza sin necesidad. |
| Monolito modular | Consistencia/operacion simple | Escalado independiente limitado | Aceptado sin evidencia de carga; limites facilitan extraccion futura. |
| Errores fail-fast | Safety/correccion | Puede detener una operacion | Aceptado; un calculo silenciosamente incorrecto es peor. |
| Idempotencia | Fiabilidad | Requiere identidad y almacenamiento consistente | Obligatoria para pagos/cierres. |

## 16. Escenarios prioritarios de calidad

Se usa la forma: fuente, estimulo, entorno, artefacto, respuesta y medida.

### ECQ-01 — Exactitud del plan

| Elemento | Definicion |
|---|---|
| Fuente | Encargado de desembolso |
| Estimulo | Solicita plan CA-01 |
| Entorno | Nucleo aislado, politica 36% TNA, corte controlado |
| Artefacto | Calculo financiero |
| Respuesta | Genera 12 filas y ajuste final |
| Medida | Coincidencia exacta de cada fila, totales y Q0.00 final |

### ECQ-02 — Reintento de pago

| Elemento | Definicion |
|---|---|
| Fuente | Adaptador futuro por fallo de comunicacion |
| Estimulo | Reenvia el mismo pago con igual clave |
| Entorno | Operacion original confirmada |
| Artefacto | RegistrarPago, Pago y Mayor |
| Respuesta | Devuelve resultado previo |
| Medida | Un pago y un conjunto de movimientos; saldo cambia una vez |

### ECQ-03 — Cambio de tasa

| Elemento | Definicion |
|---|---|
| Fuente | Administrador de politicas |
| Estimulo | Activa una nueva version prospectiva |
| Entorno | Existen creditos bajo la version anterior |
| Artefacto | Politicas y creditos |
| Respuesta | Nuevos creditos usan la nueva; previos conservan la anterior |
| Medida | Cero planes historicos alterados |

### ECQ-04 — Nuevo canal MCP

| Elemento | Definicion |
|---|---|
| Fuente | Equipo de Proyecto Final |
| Estimulo | Añade adaptador MCP |
| Entorno | Puertos primarios estables |
| Artefacto | Aplicacion/dominio |
| Respuesta | MCP traduce e invoca casos existentes |
| Medida | Cero formulas o transiciones duplicadas; cero cambios necesarios en dominio |

### ECQ-05 — Politica inconsistente

| Elemento | Definicion |
|---|---|
| Fuente | Configuracion institucional |
| Estimulo | Dos versiones cubren la fecha del desembolso |
| Entorno | Antes de confirmar efecto financiero |
| Artefacto | Selector de politicas |
| Respuesta | Error de superposicion y operacion abortada |
| Medida | Cero creditos/movimientos creados |

## 17. Evidencia y plan de verificacion

| Momento | Evidencia |
|---|---|
| Fases 1-7 | Requisitos, reglas, UML, arquitectura, trazabilidad y escenarios de calidad. |
| Fases 10-14 | Diseño modular, SOLID, GRASP, patrones y acoplamiento alineados con Q-MA/Q-FL. |
| Fases 15-22 | Compilacion estricta, pruebas unitarias y de invariantes, casos CA-01-CA-07. |
| Fase 23 | OpenAPI/Zod para interoperabilidad, precision e idempotencia. |
| Fase 24 | ADR con decisiones y trade-offs reales. |
| Fase 27 | Auditoria final de metricas aplicables y restricciones. |

## 18. Trazabilidad incremental

| Atributo | Requisitos | Decisiones/artefactos | Medidas |
|---|---|---|---|
| Exactitud funcional | RNF-01, RF-06, RF-13, RF-18 | Dinero, calculos puros, politicas | Q-AC-01-Q-AC-09 |
| Fiabilidad | RNF-02, RNF-03, RNF-07, RNF-11 | Idempotencia, UoW, mayor, State | Q-FI-01-Q-FI-07 |
| Mantenibilidad/testabilidad | RNF-05, RNF-08-RNF-10, RNF-15 | Modulos, puertos, patrones, strict | Q-MA-01-Q-MA-08 |
| Seguridad | RNF-04, RNF-06, RNF-13 | Autoria, append-only, huellas | Q-SE-01-Q-SE-05 |
| Interoperabilidad | RNF-12 | Puertos, contratos separados | Q-IN-01-Q-IN-05 |
| Flexibilidad/escalabilidad | RNF-09, RNF-12, RNF-16 | Hexagonal, monolito modular, Strategy | Q-FL-01-Q-FL-06 |
| Eficiencia | Evolucion futura | Pureza, complejidad lineal, repositorios | Q-PE-01-Q-PE-04 |
| Interaccion | Proyecto 2/Final | Errores/resultados explicables | Q-IC-01-Q-IC-04 |
| Safety | RNF-11, INV-01-INV-18 | Fail-fast e invariantes | Q-SA-01-Q-SA-04 |

## 19. Decisiones adoptadas

| ID | Decision | Consecuencia |
|---|---|---|
| D7-01 | Usar ISO/IEC 25010:2023 como referencia vigente. | El analisis reconoce nueve caracteristicas y no presenta 2011 como vigente. |
| D7-02 | Priorizar exactitud, fiabilidad y mantenibilidad/testabilidad. | Ninguna optimizacion puede debilitar invariantes financieras. |
| D7-03 | Tratar seguridad conceptual aun sin autenticacion en P1. | Autoria, integridad y auditabilidad quedan preparadas. |
| D7-04 | No inventar SLA ni volumen. | Desempeño y escalabilidad se mediran con una linea base real. |
| D7-05 | Medir cobertura de reglas e invariantes, no solo lineas. | Las pruebas se alinean con riesgo financiero. |
| D7-06 | Fallar de forma explicita ante ambigüedad financiera. | Se favorece safety/correccion sobre disponibilidad aparente. |
| D7-07 | Mantener terminos de la rubrica mapeados al modelo vigente. | La evaluacion academica y la referencia normativa permanecen compatibles. |

## 20. Decisiones pendientes

| ID | Punto | Momento de resolucion |
|---|---|---|
| DP-19 | SLA y volumen de cartera/pagos | Proyecto Final, antes de pruebas de carga. |
| DP-20 | Umbral temporal de la suite de pruebas | Despues de obtener linea base en Fase 22. |
| DP-21 | Controles concretos de autenticacion/autorizacion | Proyecto Final; fuera de P1. |
| DP-22 | Requisitos medibles de interaccion/accesibilidad | Proyecto 2. |
| DP-23 | Objetivos de disponibilidad y recuperacion | Proyecto Final con infraestructura definida. |

## 21. Validacion contra el enunciado

| Criterio | Evidencia | Estado |
|---|---|---|
| Exactitud funcional | Seccion 5 | Cumplido |
| Mantenibilidad | Seccion 7 | Cumplido |
| Testabilidad | Seccion 7.3 | Cumplido |
| Confiabilidad | Seccion 6 | Cumplido |
| Seguridad | Seccion 8 | Cumplido |
| Interoperabilidad | Seccion 9 | Cumplido |
| Escalabilidad/modificabilidad | Seccion 10 | Cumplido |
| Prioridades justificadas para finanzas | Seccion 4 | Cumplido |
| Arquitectura Hexagonal + Monolito Modular justificada | Secciones 5-15 | Cumplido |
| Medidas y escenarios verificables | Secciones 5-17 | Cumplido |
| Edicion normativa verificada | Seccion 2 y referencias | Cumplido |
| Sin implementar alcance posterior | Solo documentacion | Cumplido |

## 22. Referencias

- ISO. **ISO/IEC 25010:2023 — Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — Product quality model**. Edicion 2, publicada en noviembre de 2023. https://www.iso.org/standard/78176.html
- ISO. **ISO/IEC 25002:2024 — Systems and software engineering — SQuaRE — Quality model overview and usage**. Edicion 1, publicada en marzo de 2024. https://www.iso.org/standard/78175.html
- ISO. **ISO/IEC 25010:2011 — System and software quality models**. Edicion retirada, consultada unicamente para aclarar correspondencia terminologica. https://www.iso.org/standard/35733.html

## 23. Resultado esperado

La calidad deja de ser una aspiracion generica: cada prioridad financiera tiene una respuesta arquitectonica y una medida. El nucleo debera demostrar exactitud centavo a centavo, idempotencia, reproduccion de saldos, aislamiento de infraestructura, modificabilidad por politicas y capacidad de reutilizacion por futuros canales sin duplicar reglas.
