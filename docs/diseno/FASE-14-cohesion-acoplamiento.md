# Fase 14 — Cohesión y acoplamiento

## 1. Objetivo y alcance

Evaluar si los módulos definidos en E3 agrupan responsabilidades relacionadas y colaboran mediante dependencias mínimas, estables y dirigidas hacia abstracciones. El análisis establece reglas que deberán comprobarse cuando exista E4.

No se asignan métricas numéricas de código antes de existir imports, archivos y clases implementadas. Se definen umbrales y procedimientos para medirlos posteriormente sin fabricar resultados.

## 2. Criterios de evaluación

### 2.1 Cohesión

| Nivel | Interpretación usada |
|---|---|
| Alta | Los elementos colaboran para una capacidad clara y cambian por razones relacionadas. |
| Media | Existe un propósito común, pero contiene subresponsabilidades que deben vigilarse. |
| Baja | Agrupa elementos por conveniencia técnica o nombre genérico, con razones de cambio no relacionadas. |

Se busca cohesión funcional y semántica, no únicamente proximidad de archivos.

### 2.2 Acoplamiento

| Nivel | Interpretación usada |
|---|---|
| Bajo | Depende de tipos estables, interfaces estrechas, IDs o resultados inmutables. |
| Moderado controlado | Existe colaboración necesaria con varios contratos, pero la dirección y superficie están limitadas. |
| Alto | Conoce detalles internos, infraestructura, estructuras mutables o múltiples responsabilidades ajenas. |

El objetivo no es cero acoplamiento: una dependencia semántica estable es preferible a duplicar reglas o introducir traducciones artificiales.

## 3. Tabla obligatoria por módulo

| Módulo | Responsabilidad | Cohesión | Dependencias | Acoplamiento | Justificación |
|---|---|---|---|---|---|
| Dominio compartido | Dinero, Moneda, FechaCorte y errores universales mínimos | Alta, si permanece pequeño | Biblioteca decimal/fechas encapsulada; lenguaje | Bajo | Todos los consumidores usan la misma semántica exacta; no contiene reglas de una capacidad particular. |
| Originación — dominio | Cliente, solicitud, evaluación y decisión previa al crédito | Alta | Compartido; tipos públicos mínimos de política/plan al desembolsar | Bajo–moderado | Sus elementos cambian por reglas de originación; la colaboración de desembolso se hace por contratos públicos. |
| Cálculo financiero | Dinero aplicado, tasa, plan, cuota, interés y mora matemática | Muy alta | Compartido | Bajo | Funciones puras sin puertos, estado global, aplicación o infraestructura. |
| Cartera y Cobros — dominio | Crédito, State, pagos, prelación, excedentes, saldos y cartera operativa | Alta | Compartido, Cálculo financiero, contratos de Políticas | Moderado controlado | La capacidad es amplia pero unificada por administración del crédito activo/cobro; usa cálculo sin apropiarse de fórmulas. |
| Cierres y Riesgo — dominio | Mayor, movimientos, cierres, cartera en riesgo y provisiones | Alta | Compartido, Cálculo, proyecciones públicas de Cartera, contratos de Políticas | Moderado controlado | Consolida hechos financieros; depende de vistas estables, no de internals o mutaciones de Crédito. |
| Políticas — dominio | Versiones, vigencias, parámetros, huellas y selección | Alta | Compartido/tipos propios | Bajo | Su única razón de cambio es cómo se representan/seleccionan reglas configurables; no ejecuta fórmulas consumidoras. |
| Aplicación de Originación | Coordinar registro, solicitud, evaluación, decisión y desembolso | Alta | Dominio de Originación/Cálculo/Políticas y puertos requeridos | Moderado controlado | La coordinación multiagregado requiere varias dependencias, todas explícitas y orientadas al caso de uso. |
| Aplicación de Cartera/Cobros | Coordinar pago, idempotencia, mora, regularización y reestructuración | Alta | Cartera, Cálculo, Políticas, repositorios, Reloj, IDs y UoW | Moderado controlado | Orquesta un flujo crítico sin contener reglas; se evita una fachada para todos los módulos. |
| Aplicación de Cierres/Riesgo | Coordinar cierres idempotentes y consultas | Alta | Cierres, proyecciones de Cartera, Políticas y puertos específicos | Moderado controlado | Varias fuentes son inherentes a consolidación; se limitan mediante proyecciones y repositorios segregados. |
| Aplicación de Políticas | Coordinar alta, activación y reemplazo de versiones | Alta | Dominio de Políticas, repositorio, Reloj, IDs y UoW | Bajo–moderado | Flujo acotado; no depende de consumidores de la política. |
| Puertos primarios | Expresar intenciones del sistema independientes del canal | Alta | Comandos/resultados públicos de aplicación | Bajo | Una interfaz por intención/capacidad evita que un canal dependa de operaciones ajenas. |
| Puertos secundarios | Expresar necesidades externas del núcleo | Alta si están segregados | Tipos de agregados/proyecciones y VO | Bajo | Interfaces definidas por consumidores; no contienen implementaciones ni modelos ORM. |
| Contratos externos futuros | Validar/traducir DTO Zod y errores externos | Alta | Puertos primarios y tipos públicos | Bajo | No contiene reglas; cambios HTTP/JSON no afectan dominio. |
| Adaptadores primarios futuros | Traducir API/UI/MCP/proceso a casos de uso | Alta por adaptador | Contratos + puerto primario específico | Bajo | Cada canal depende de una superficie estrecha y nunca de repositorios. |
| Adaptadores secundarios futuros | Implementar repositorios, Reloj, IDs, UoW e integraciones | Alta por adaptador | Puertos secundarios + tecnología concreta | Bajo respecto al núcleo; alto localmente con tecnología | El acoplamiento tecnológico queda confinado al borde y puede sustituirse. |

## 4. Análisis detallado de cohesión

### 4.1 Dominio compartido

La cohesión solo permanece alta si contiene conceptos con semántica universal. Candidatos aceptados:

- `Dinero` y `Moneda`;
- `FechaCorte` cuando su semántica es igual en todos los módulos;
- identidades base o errores verdaderamente comunes.

No se aceptan:

- `Utils`, `Helpers`, `CommonService`;
- reglas de mora por ser usadas por varios módulos;
- DTO de API;
- repositorios;
- configuración global mutable.

Una dependencia muy utilizada no convierte automáticamente su contenido en compartido.

### 4.2 Originación

Cliente, solicitud, evaluación y decisión comparten el objetivo de determinar si nace un crédito. Desembolso es el límite de salida: Originación coordina la creación, pero Cartera/Cobros se vuelve propietario del crédito activo.

Señal de división futura: si gestión de clientes adquiere un ciclo independiente amplio, podría convertirse en módulo propio sin cambiar `ClienteId` ni contratos existentes. No se divide preventivamente en P1.

### 4.3 Cálculo financiero

Es el módulo más cohesivo: todas sus operaciones convierten entradas explícitas en resultados financieros exactos. La pureza impide que se convierta en un servicio general.

La clasificación `TramoMora` cabe aquí como función matemática derivada. La transición a EN_MORA/INCOBRABLE no cabe porque pertenece al ciclo del crédito.

### 4.4 Cartera y Cobros

Tiene más conceptos que otros módulos, pero convergen en una responsabilidad: administrar la obligación activa y su recuperación. Se vigilarán dos posibles fracturas:

- si “Cartera” crece como reporting masivo, sus consultas pueden quedar en Cierres/Riesgo;
- si reestructuración adquiere reglas extensas, puede formar un submódulo interno sin extraer un servicio.

Pago y Crédito permanecen agregados distintos aunque compartan módulo, porque idempotencia de la operación y consistencia contractual tienen identidades diferentes.

### 4.5 Cierres y Riesgo

Movimientos, mayor, cierres, riesgo y provisión comparten consolidación y lectura financiera. No procesa pagos ni cambia estados para producir reportes.

El módulo debe evitar convertirse en un “reporting” genérico. Una consulta futura no relacionada con cierres/riesgo necesita justificación o módulo de lectura separado.

### 4.6 Políticas

Agrupa representación, versionado y selección de parámetros. La fórmula consumidora permanece en Cálculo/Cartera/Cierres, evitando una clase de políticas con métodos heterogéneos para todo el sistema.

## 5. Análisis de acoplamiento por tipo

| Tipo de acoplamiento | Estado deseado | Ejemplo/decisión |
|---|---|---|
| De datos | Permitido | Pasar `Dinero`, `FechaCorte`, IDs y resultados inmutables. |
| De mensaje/contrato | Preferido | Invocar puertos o APIs públicas del módulo. |
| De sello/estructura | Restringido | No pasar agregados completos si basta una proyección. |
| De control | Restringido | No pasar banderas que ordenen internals; usar intención/polimorfismo. |
| Externo | Confinado | `decimal.js`/date-fns encapsulados; ORM solo en adaptador. |
| Común/global | Prohibido | Sin variables globales mutables, reloj global ni singleton de repositorio. |
| De contenido | Prohibido | Ningún módulo accede a campos privados o tablas de otro. |

## 6. Matriz de dependencias permitidas

`✓` dependencia directa permitida; `P` solo contrato/proyección pública; `—` prohibida.

| Origen ↓ / Destino → | Compartido | Originación D | Cálculo D | Cartera D | Cierres D | Políticas D | Puertos | Aplicación | Contratos/Adaptadores |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Compartido | — | — | — | — | — | — | — | — | — |
| Originación D | ✓ | — | P | P | — | P | — | — | — |
| Cálculo D | ✓ | — | — | — | — | P como datos tipados | — | — | — |
| Cartera D | ✓ | — | ✓ | — | — | P | — | — | — |
| Cierres D | ✓ | P | ✓ | P | — | P | — | — | — |
| Políticas D | ✓ | — | — | — | — | — | — | — | — |
| Puertos | ✓ | P | P | P | P | P | — | — | — |
| Aplicación | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| Contratos | ✓ | — | — | — | — | — | P primario | P resultados | — |
| Adaptadores | ✓ | — | — | — | — | — | ✓ | P primario | ✓ local |

`Originación D → Cartera D` solo significa usar una fábrica/API pública para originar el agregado Crédito; nunca manipular internals. Al implementar, se preferirá coordinación en aplicación para reducir esa dependencia si el modelo lo permite.

## 7. Dirección y estabilidad de dependencias

### 7.1 Dirección obligatoria

```text
Adaptadores → Contratos/Puertos → Aplicación → Dominio
Adaptadores secundarios → Puertos secundarios ← Aplicación
Dominio de negocio → Compartido/Cálculo estable
```

No existe flecha desde dominio hacia aplicación o adaptadores.

### 7.2 Estabilidad conceptual

| Componente | Estabilidad esperada | Razón |
|---|---|---|
| `Dinero`/reglas de precisión | Muy alta | Impacta todos los cálculos e invariantes. |
| Puertos primarios | Alta | Son contratos de capacidades, aunque evolucionan versionadamente. |
| Agregados del dominio | Alta | Representan reglas centrales. |
| Políticas concretas | Media/baja | Cambian prospectivamente por institución. |
| Servicios de aplicación | Media | Cambian con el flujo, no con transporte. |
| Contratos HTTP/Zod | Media/baja | Evolucionan con clientes externos. |
| Adaptadores concretos | Baja | Dependen de tecnología/proveedor. |

Los componentes menos estables dependen de los más estables. Una excepción debe registrarse en ADR.

## 8. Acoplamiento temporal y transaccional

### 8.1 Temporal

Los cálculos no dependen del instante real: reciben `FechaCorte`. Esto elimina acoplamiento temporal oculto.

Los pasos de un pago sí tienen orden causal:

1. idempotencia;
2. carga/validación State;
3. Chain;
4. Strategy;
5. creación de pago/movimientos;
6. confirmación atómica.

Ese acoplamiento temporal es explícito y pertenece al Controller de aplicación; no se distribuye entre adaptadores.

### 8.2 Transaccional

Pago, Crédito y Movimiento están acoplados por consistencia, no por estructura. `UnidadDeTrabajo` conserva atomicidad sin fusionar agregados.

Fusionarlos crearía un agregado enorme; separarlos sin UoW permitiría efectos parciales. El diseño acepta acoplamiento transaccional controlado.

## 9. Interfaces y tamaño de superficie

| Frontera | Superficie deseada | Señal de acoplamiento excesivo |
|---|---|---|
| Puerto primario | Un caso/intención coherente | Adaptador debe implementar/conocer casos ajenos. |
| Repositorio | Operaciones requeridas por consumidores | CRUD general, consultas arbitrarias o modelos ORM. |
| API de agregado | Comandos de dominio, consultas mínimas | Setters públicos o colecciones mutables. |
| Resultado/proyección | Campos necesarios e inmutables | Exponer agregado completo para reportes. |
| Política | Parámetros/contrato específico | Objeto genérico sin tipo o mapas libres. |

## 10. Ciclos potenciales y cómo evitarlos

### 10.1 Originación ↔ Cartera

Riesgo: Originación crea el crédito y Cartera consulta datos de la solicitud.

Control:

- aplicación coordina;
- solicitud entrega una instantánea aprobada/DTO de dominio;
- Cartera crea Crédito sin importar internals de Originación;
- vínculo posterior por IDs.

### 10.2 Cartera ↔ Cierres

Riesgo: Cartera emite movimientos y Cierres consulta créditos.

Control:

- aplicación/puerto de movimientos recibe hechos;
- Cierres usa proyecciones de lectura;
- Cartera no importa Cierres;
- Cierres no modifica Crédito.

### 10.3 Políticas ↔ consumidores

Riesgo: políticas necesitan conocer fórmulas y fórmulas el catálogo.

Control:

- Políticas define parámetros/versiones;
- selector devuelve datos tipados;
- consumidor ejecuta fórmula;
- Políticas no importa consumidor.

### 10.4 Compartido ↔ módulos

Riesgo: mover tipos al compartido para resolver ciclos.

Control:

- compartido no importa módulos;
- contratos públicos pertenecen al proveedor semántico;
- usar IDs/proyecciones, no trasladar lógica a `common`.

## 11. Métricas futuras

Las métricas se recopilarán al existir E4. No reemplazan revisión semántica.

### 11.1 Acoplamiento aferente/eferente

| Métrica | Definición aplicada | Uso |
|---|---|---|
| `Ca` | Módulos internos que dependen del módulo | Identificar estabilidad/responsabilidad. |
| `Ce` | Módulos internos de los que depende | Detectar módulos demasiado conocedores. |
| Inestabilidad `I = Ce/(Ca+Ce)` | Relación de dependencias salientes | Verificar que bordes sean más inestables que núcleo. |

No se fija un número universal. Se investigará:

- cualquier ciclo;
- dominio con `Ce` hacia aplicación/adaptadores;
- `Compartido` con `Ce > 0` hacia negocio;
- caso de uso con demasiados puertos no relacionados;
- módulo estable que dependa de uno tecnológico/inestable.

### 11.2 Cohesión estructural

Se usarán señales combinadas:

- clases con múltiples grupos de métodos/campos no relacionados;
- archivos con varias razones de cambio;
- pruebas que requieren preparar módulos ajenos;
- cambios de un requisito que dispersan ediciones;
- nombres genéricos;
- LCOM u otra métrica como alerta, no sentencia.

### 11.3 Dependencias externas

| Dependencia | Módulos autorizados |
|---|---|
| `decimal.js` | Implementación encapsulada de Dinero/Tasa/Cálculo. |
| `date-fns` o Luxon | Cálculo/FechaCorte encapsulado. |
| Zod | Contratos/borde; no fórmulas. |
| Vitest | Tests únicamente. |
| Node APIs | Composición/adaptadores; evitar en dominio salvo tipos seguros indispensables. |
| Framework HTTP/ORM | Ninguno en P1; adaptadores futuros solamente. |

## 12. Reglas automatizables

| ID | Regla |
|---|---|
| CA-R01 | Grafo de módulos sin ciclos. |
| CA-R02 | `src/dominio/**` no importa `src/aplicacion/**`, contratos ni adaptadores. |
| CA-R03 | Cálculo financiero no importa puertos/repositorios. |
| CA-R04 | Contratos no importan clases internas de State/Chain ni implementan fórmulas. |
| CA-R05 | Adaptadores primarios no importan repositorios secundarios concretos. |
| CA-R06 | Ningún repositorio expone ORM al dominio. |
| CA-R07 | `RepositorioMovimientos` no declara actualizar/eliminar. |
| CA-R08 | No existen globales mutables/Service Locator. |
| CA-R09 | No se crean `utils/helpers/common-service` con reglas de negocio. |
| CA-R10 | Dependencias externas solo aparecen en módulos autorizados. |
| CA-R11 | Referencias entre agregados usan IDs/API pública. |
| CA-R12 | API/UI/MCP futuros invocan puertos primarios comunes. |

La herramienta concreta para imports se decidirá en Fase 15. Si no se añade una dependencia especializada, estas reglas pueden verificarse con TypeScript, convenciones y pruebas estáticas simples.

## 13. Escenarios de cambio

| Cambio | Impacto esperado | Criterio de bajo acoplamiento/alta cohesión |
|---|---|---|
| Nueva versión de tasa | Política/configuración y pruebas | Plan/Crédito histórico sin cambios. |
| Nuevo tipo de tasa | Strategy/conversión + cálculo/pruebas | Pago, Cierres y canales sin cambios salvo consumo requerido. |
| Cambiar tratamiento de excedente | Nueva Strategy/composición | Chain e idempotencia sin cambios. |
| Agregar canal MCP | Adaptador/composición | Dominio/aplicación sin cambios. |
| Cambiar PostgreSQL por otra persistencia | Adaptador/composición | Casos y dominio sin cambios. |
| Agregar concepto de cobro autorizado | Handler/composición/política/pruebas | Otros handlers sin cambios; orden revisado institucionalmente. |
| Cambiar formato de error HTTP | Contrato/adaptador | Errores de dominio sin cambios. |
| Nueva provisión | Política/servicio de provisión/cierre | Plan y pago sin cambios. |

## 14. Riesgos y acciones

| Riesgo | Indicador | Acción |
|---|---|---|
| `Cartera/Cobros` crece demasiado | Cambios no relacionados y muchas dependencias | Crear submódulos internos por saldo/pago/reestructuración manteniendo agregado propietario. |
| `Cierres/Riesgo` se vuelve reporting genérico | Consultas ajenas a cierre/riesgo | Separar módulo de consultas/proyecciones si existe evidencia. |
| Compartido se vuelve cajón de sastre | Importa negocio o contiene “utils” | Devolver elemento a módulo propietario. |
| Aplicación contiene dominio | Fórmulas/guardas en Controllers | Mover a experto/servicio de dominio. |
| Dominio anémico | Servicios inspeccionan/setean internals | Encapsular comportamiento en agregado/VO. |
| Exceso de interfaces | Contrato con una implementación y sin variación/consumidor | Mantener interfaz solo en frontera o prueba real. |
| Proyección duplica regla | SQL decide riesgo sin dominio | Validar proyección contra cálculo autoritativo. |

## 15. Correspondencia con SOLID, GRASP y patrones

| Objetivo | SOLID | GRASP | Patrón/decisión |
|---|---|---|---|
| Alta cohesión monetaria | SRP | Expert/High Cohesion | Value Object Dinero |
| Bajo acoplamiento a políticas | OCP/DIP | Protected Variations | Strategy/versionado |
| Pago cohesivo y extensible | SRP/OCP/LSP | Polymorphism | Chain + Strategy |
| Ciclo localizado | SRP/OCP | Expert/Polymorphism | State |
| Construcción consistente | SRP | Creator | Factory |
| Infraestructura aislada | ISP/DIP | Low Coupling | Repository/puertos |

## 16. Trazabilidad incremental

| Requisito/atributo | Decisión de cohesión/acoplamiento | Regla/verificación |
|---|---|---|
| RNF-01/02 | Cálculo puro y compartido exacto | CA-R02/03/10 |
| RNF-03/04/06 | Mayor/Cierres cohesionados y append-only | CA-R07 |
| RNF-08 | Módulos por capacidad, sin common genérico | CA-R01/09 |
| RNF-09 | Variaciones detrás de políticas/Strategy | Escenarios de cambio |
| RNF-10 | Puertos/dobles y dominio aislado | CA-R02/03/05 |
| RNF-12 | Canales desacoplados por puertos | CA-R12 |
| RNF-16 | Dependencias hacia abstracciones | CA-R02/05/06/10 |
| RF-07–10 | Cartera/Cobros propietario; UoW controla efectos | Acoplamiento transaccional explícito |
| RF-18–23 | Cierres usa proyecciones/movimientos | Sin mutación cruzada |

## 17. Decisiones adoptadas

| ID | Decisión | Consecuencia |
|---|---|---|
| D14-01 | Evaluar cohesión semántica antes que tamaño. | Un módulo puede contener varias clases si comparten capacidad. |
| D14-02 | Aceptar acoplamiento semántico estable y rechazar detalles. | Se evita duplicación e indirección artificial. |
| D14-03 | Mantener compartido mínimo y sin dependencia de negocio. | Se previenen ciclos y cajón de sastre. |
| D14-04 | Usar proyecciones para lecturas cruzadas. | Cierres no necesita agregados completos ni mutarlos. |
| D14-05 | Conservar acoplamiento transaccional mediante UoW, no agregado gigante. | Pago/Crédito/Movimiento son consistentes y separados. |
| D14-06 | No publicar métricas numéricas antes de E4. | El análisis no inventa evidencia. |
| D14-07 | Tratar cualquier ciclo como defecto de diseño. | Las dependencias permanecen dirigidas. |

## 18. Decisiones pendientes

| ID | Punto | Resolución prevista |
|---|---|---|
| DP-18 | Herramienta para verificar imports/ciclos | Fase 15 |
| DP-30 | Interfaces consumidor-específicas de crédito | Fase 15 según acoplamiento real |
| DP-34 | Umbrales cuantitativos después de línea base | Fases 15–22 |
| DP-35 | Necesidad de submódulos internos en Cartera/Cobros | Solo si E4 muestra pérdida de cohesión |
| DP-36 | Proyecciones optimizadas de cierre | Proyecto Final con persistencia real |

## 19. Validación contra el enunciado

| Criterio | Evidencia | Estado |
|---|---|---|
| Tabla Módulo/Responsabilidad/Cohesión/Dependencias/Acoplamiento/Justificación | Sección 3 | Cumplido |
| Cada módulo analizado | Secciones 3–4 | Cumplido |
| Alta cohesión buscada | Secciones 4 y 7 | Cumplido por diseño |
| Bajo acoplamiento buscado | Secciones 5–10 | Cumplido por diseño |
| Dependencias hacia abstracciones | Secciones 6–7 | Cumplido |
| Ciclos analizados | Sección 10 | Cumplido |
| Métricas futuras responsables | Sección 11 | Cumplido |
| Reglas verificables | CA-R01–CA-R12 | Cumplido |
| Trade-offs/riesgos | Secciones 8 y 14 | Cumplido |
| Relación SOLID/GRASP/patrones | Sección 15 | Cumplido |
| Sin código prematuro | Solo documentación | Cumplido |

## 20. Resultado esperado

El diseño mantiene alta cohesión por capacidad y acoplamiento controlado mediante datos inmutables, contratos, puertos y proyecciones. Las dependencias apuntan hacia componentes estables; cualquier ciclo, acceso a internals o filtración de infraestructura tendrá una regla concreta para detectarse durante E4.
