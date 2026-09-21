# Fase 5 — Matriz de trazabilidad

## 1. Objetivo y criterio de lectura

Esta matriz constituye la fuente consolidada de trazabilidad del Sistema de Gestión de Microcrédito. Conecta requisitos, diseño, UML, módulos, código, pruebas y documentación para impedir divergencias entre E1, E2, E3 y E4.

En esta fase solo existen análisis y UML. Las rutas marcadas como **previstas** son compromisos para fases posteriores y no afirman que el archivo ya esté implementado. Al crear código o pruebas, la matriz deberá cambiar de `Previsto` a `Implementado/Verificado` con la ruta real.

## 2. Leyenda de artefactos

### 2.1 Casos de uso

| ID | Caso de uso |
|---|---|
| CU-01 | Registrar cliente |
| CU-02 | Solicitar crédito |
| CU-03 | Evaluar crédito |
| CU-04 | Aprobar solicitud |
| CU-05 | Rechazar solicitud |
| CU-06 | Desembolsar crédito |
| CU-07 | Registrar pago |
| CU-08 | Calcular mora |
| CU-09 | Regularizar crédito |
| CU-10 | Reestructurar crédito |
| CU-11 | Declarar crédito incobrable |
| CU-12 | Generar cierre diario |
| CU-13 | Generar cierre mensual |
| CU-14 | Consultar cartera en riesgo |
| CU-15 | Consultar crédito e historial |
| CU-16 | Administrar política financiera |
| CU-17 | Anular crédito aprobado |
| CU-18 | Cancelar crédito |

### 2.2 Diagramas UML

| Código | Archivo |
|---|---|
| UML-UC | `docs/diagramas/uml/01-casos-de-uso.puml` |
| UML-CL | `docs/diagramas/uml/02-clases.puml` |
| UML-SP | `docs/diagramas/uml/03-secuencia-registrar-pago.puml` |
| UML-SD | `docs/diagramas/uml/04-secuencia-desembolsar-credito.puml` |
| UML-ES | `docs/diagramas/uml/05-estados-credito.puml` |
| UML-AO | `docs/diagramas/uml/06-actividad-originacion.puml` |
| UML-AC | `docs/diagramas/uml/07-actividad-cierre-mensual.puml` |

### 2.3 Documentos fuente

| Código | Documento |
|---|---|
| DOC-01 | `docs/analisis/FASE-01-analisis-dominio-requisitos.md` |
| DOC-02 | `docs/analisis/FASE-02-modelo-conceptual-dinero.md` |
| DOC-03 | `docs/analisis/FASE-03-reglas-politicas-financieras.md` |
| DOC-04 | `docs/analisis/FASE-04-modelo-uml-e1.md` |
| DOC-05 | `docs/trazabilidad/matriz-trazabilidad.md` |
| DOC-06 | `docs/arquitectura/FASE-06-arquitectura-hexagonal-monolito-modular.md` |
| DOC-07 | `docs/arquitectura/FASE-07-iso-iec-25010.md` |
| DOC-08 | `docs/arquitectura/FASE-08-modelo-4-mas-1.md` |
| DOC-09 | `docs/arquitectura/FASE-09-c4-niveles-1-2-3.md` |
| DOC-10 | `docs/diseno/FASE-10-diseno-modular-e3.md` |
| DOC-11 | `docs/diseno/FASE-11-solid.md` |
| DOC-12 | `docs/diseno/FASE-12-grasp.md` |
| DOC-13 | `docs/diseno/FASE-13-patrones-diseno.md` |
| DOC-14 | `docs/diseno/FASE-14-cohesion-acoplamiento.md` |
| DOC-15 | `docs/configuracion/FASE-15-configuracion-typescript.md` |
| DOC-16 | `docs/implementacion/FASE-16-dinero.md` |
| DOC-17 | `docs/implementacion/FASE-17-plan-amortizacion.md` |
| DOC-18 | `docs/implementacion/FASE-18-mora.md` |
| DOC-19 | `docs/implementacion/FASE-19-prelacion-pagos.md` |
| DOC-20 | `docs/implementacion/FASE-20-state-credito.md` |
| DOC-21 | `docs/implementacion/FASE-21-cartera-riesgo.md` |
| DOC-22 | `docs/implementacion/FASE-22-walking-skeleton-invariantes.md` |
| DOC-23 | `docs/api/FASE-23-contratos-api.md` y `docs/api/openapi.yaml` |
| DOC-24 | `docs/implementacion/FASE-24-idempotencia-pagos.md` |
| DOC-25 | `docs/adr/ADR-001-arquitectura.md`, `docs/adr/ADR-002-dinero.md` y `docs/adr/ADR-003-amortizacion.md` |
| DOC-26 | `README.md` y `docs/arquitectura/FASE-26-estructura-repositorio.md` |
| DOC-27 | `README.md` profesional con alcance, uso, casos, artefactos, restricciones e IA |
| DOC-28 | `docs/entrega/P1_Arquitectura_NoDeGrupo.md`, fuente consolidada del documento final |
| DOC-29 | `docs/auditoria/FASE-29-validacion-rubrica.md`, auditoría y puntuación técnica proyectada |
| DOC-30 | `docs/auditoria/FASE-30-evitar-penalizaciones.md`, revisión explícita de restricciones finales |
| DOC-31 | `docs/auditoria/FASE-31-forma-trabajo.md`, protocolo secuencial y criterio final de terminación |

## 3. Matriz maestra exigida

| ID | Requisito | Tipo | Regla asociada | Caso de uso | Clase/Módulo |
|---|---|---|---|---|---|
| RF-01 | Registrar cliente con identidad única | Funcional | Identidad válida/no duplicada | CU-01 | `Cliente`, `RegistrarCliente` / Originación |
| RF-02 | Solicitud con monto y plazo válidos | Funcional | RN-01, RN-02 | CU-02 | `SolicitudCredito`, `Dinero`, `Plazo` / Originación |
| RF-03 | Evaluación trazable | Funcional | POL-05, INV-15 | CU-03 | `EvaluacionCredito`, `EvaluarCredito` / Originación |
| RF-04 | Aprobar/rechazar con actor, fecha y motivo | Funcional | POL-06, INV-15 | CU-04, CU-05 | `SolicitudCredito`, `TransicionEstado` / Originación |
| RF-05 | Desembolsar solo solicitud aprobada | Funcional | RN-21, RN-30 | CU-06 | `DesembolsarCredito`, `Credito` / Originación |
| RF-06 | Plan francés con ajuste final | Funcional | RN-05–RN-09, INV-01, INV-02 | CU-06 | `FabricaPlanAmortizacion`, `PlanAmortizacion`, `Cuota` / Cálculo financiero |
| RF-07 | Pagos parciales, exactos o excedentes | Funcional | RN-19, RN-20 | CU-07 | `RegistrarPago`, `Pago` / Cartera y cobros |
| RF-08 | Prelación obligatoria | Funcional | RN-18, INV-12 | CU-07 | `EslabonPrelacion` y handlers / Cartera y cobros |
| RF-09 | Procesar y conservar excedente | Funcional | RN-20, INV-13 | CU-07 | `PoliticaExcedente` / Cartera y cobros |
| RF-10 | Pago idempotente | Funcional | INV-08 | CU-07 | `ClaveIdempotencia`, `RepositorioPagos` / Cartera y cobros |
| RF-11 | Días calendario con corte explícito | Funcional | RN-10, INF-14 | CU-08 | `CalculadoraMora`, `FechaCorte`, `Reloj` / Cálculo financiero |
| RF-12 | Tramo derivado de atraso | Funcional | RN-11, RN-12, INV-10 | CU-08 | `DiasAtraso`, `TramoMora` / Cálculo financiero |
| RF-13 | Moratorio por cuota y solo capital | Funcional | RN-13–RN-16, INV-11 | CU-08 | `CalculadoraMora`, `Cuota` / Cálculo financiero |
| RF-14 | Suspender/reactivar corriente | Funcional | RN-17, POL-12 | CU-08, CU-09 | `Credito`, estados / Cartera y cobros |
| RF-15 | Ciclo y operaciones válidas por estado | Funcional | RN-21–RN-25 | CU-04–CU-11, CU-17, CU-18 | `EstadoCreditoComportamiento`, `Credito` / Cartera y cobros |
| RF-16 | Historial inalterable de transiciones | Funcional | INV-15 | CU-15 | `TransicionEstado`, `Credito` / Cartera y cobros |
| RF-17 | Deterioro, recuperación y reestructuración | Funcional | RN-22–RN-25 | CU-09–CU-11, CU-18 | Estados concretos / Cartera y cobros |
| RF-18 | Cartera en riesgo por saldo completo | Funcional | RN-26, RN-27 | CU-14 | `Cartera`, `ResultadoCarteraRiesgo` / Cierres y riesgo |
| RF-19 | Excluir incobrables y no reactivar | Funcional | RN-25, RN-28, INV-16 | CU-11, CU-14 | `Credito`, `Cartera` / Cartera y cobros; Cierres |
| RF-20 | Cierre diario completo | Funcional | RN-31, RN-32 | CU-12 | `CierreDiario`, `GenerarCierre` / Cierres |
| RF-21 | Cierre mensual completo | Funcional | RN-31, RN-32, POL-08 | CU-13 | `CierreMensual`, `GenerarCierre` / Cierres |
| RF-22 | Cierre idempotente | Funcional | INV-17 | CU-12, CU-13 | `Cierre`, `RepositorioCierres` / Cierres |
| RF-23 | Mayor append-only reproduce saldos | Funcional | RN-32, INV-07 | CU-12, CU-13, CU-15 | `Movimiento`, `MayorMovimientos` / Cierres |
| RF-24 | Consultar crédito, saldo e historial | Funcional | RNF-04 | CU-15 | `Credito`, repositorios / Cartera y cobros |
| RF-25 | Registrar y seleccionar políticas versionadas | Funcional | RN-29 | CU-16 | `PoliticaFinanciera`, `SelectorPoliticaFinanciera` / Políticas |
| RF-26 | Conservar política contractual | Funcional | RN-30, INV-18 | CU-06, CU-15 | `Credito`, `VersionPolitica` / Políticas |
| RNF-01 | Exactitud monetaria | No funcional | RN-03, RN-04 | CU-02, CU-06–CU-14 | `Dinero`, `Tasa` / Cálculo financiero |
| RNF-02 | Determinismo | No funcional | INF-14 | CU-06–CU-14 | Cálculos puros, `Reloj` |
| RNF-03 | Reproducibilidad | No funcional | RN-30–RN-32 | CU-12–CU-15 | Políticas, `Movimiento`, `Cierre` |
| RNF-04 | Auditabilidad | No funcional | INV-15, RN-32 | CU-03–CU-16 | `TransicionEstado`, `Movimiento`, políticas |
| RNF-05 | Trazabilidad | No funcional | Esta matriz | Todos | Todos los módulos |
| RNF-06 | Integridad append-only | No funcional | RN-32 | CU-12, CU-13, CU-15 | `Movimiento`, `MayorMovimientos` |
| RNF-07 | Idempotencia | No funcional | INV-08, INV-17 | CU-07, CU-12, CU-13 | `ClaveIdempotencia`, `Pago`, `Cierre` |
| RNF-08 | Mantenibilidad | No funcional | Separación modular | Todos | Monolito modular conceptual |
| RNF-09 | Modificabilidad de políticas | No funcional | RN-29 | CU-06–CU-16 | Strategies y políticas versionadas |
| RNF-10 | Testabilidad | No funcional | Puertos y cálculos puros | Todos | `Reloj`, repositorios, `GeneradorIds` |
| RNF-11 | Confiabilidad | No funcional | INV-01–INV-18 | Todos | Dominio completo |
| RNF-12 | Interoperabilidad futura | No funcional | Casos de uso sin canal | Todos | Servicios de aplicación/puertos |
| RNF-13 | Seguridad conceptual | No funcional | Autoría y exposición mínima | CU-03–CU-16 | Casos de uso, contratos futuros |
| RNF-14 | Portabilidad | No funcional | Node.js 20+ sin externos | Casos ejecutables | Proyecto/núcleo |
| RNF-15 | Tipado estricto | No funcional | Sin `any` evasivo | Casos ejecutables | TypeScript/dominio |
| RNF-16 | Independencia de infraestructura | No funcional | Restricciones del alcance | Todos | Dominio y puertos |

## 4. Trazabilidad detallada de requisitos funcionales

| ID | Diseño/UML | Código previsto | Prueba prevista | Documento | Estado actual |
|---|---|---|---|---|---|
| RF-01 | UML-UC, UML-CL, UML-AO | `src/dominio/originacion/cliente.ts`, servicio registrar | Cliente válido y duplicado rechazado | DOC-01 §5; DOC-04 | Diseñado |
| RF-02 | UML-UC, UML-CL, UML-AO | Solicitud, `Dinero`, `Plazo` | Límites Q1,000/Q25,000 y 3/24; fuera de rango | DOC-01 §5; DOC-02 | Diseñado |
| RF-03 | UML-UC, UML-CL, UML-AO | Evaluación y servicio evaluar | Conserva criterios, fecha, autor y resultado | DOC-01 §5; DOC-04 | Diseñado |
| RF-04 | UML-UC, UML-CL, UML-ES, UML-AO | Solicitud/State de decisión | Aprobación/rechazo válidos y motivo requerido | DOC-01 §14; DOC-04 | Diseñado |
| RF-05 | UML-UC, UML-CL, UML-SD, UML-AO | Servicio desembolsar | Aprobada desembolsa; demás estados fallan sin efecto | DOC-03 §13; DOC-04 | Diseñado |
| RF-06 | UML-CL, UML-SD, UML-AO | `src/dominio/plan-amortizacion.ts` | `tests/plan-amortizacion.test.ts`: CA-01, tasa cero y ajuste final | DOC-02 §7.1; DOC-03 §6; DOC-17 | Implementado/verificado |
| RF-07 | UML-UC, UML-CL, UML-SP | `src/dominio/prelacion-pago.ts` | `tests/prelacion-pago.test.ts`: CA-03, CA-04 y CA-05 | DOC-03 §10; DOC-19 | Implementado/verificado |
| RF-08 | UML-CL, UML-SP | `ProcesadorPrelacionPago` y cadena interna fija | Orden exacto y consumo parcial por eslabón | DOC-03 §10; DOC-19 | Implementado/verificado |
| RF-09 | UML-CL, UML-SP | `PoliticaExcedente` y estrategias | Q1,988.12 íntegro y estrategias sustituibles | DOC-03 §11; DOC-19 | Implementado/verificado |
| RF-10 | UML-CL, UML-SP | `pago-idempotente.ts` y `RegistrarPago` | Replay idéntico sin segundo efecto; contenido distinto en conflicto | DOC-03 §14; DOC-24 | Implementado/verificado |
| RF-11 | UML-CL | `src/dominio/calculadora-mora.ts` | Vencimiento=0, día siguiente=1, corte anterior=0 | DOC-03 §7; DOC-18 | Implementado/verificado |
| RF-12 | UML-CL, UML-ES | `TramoMora`, `clasificarTramoMora` | Límites 0/1/30/31/60/61/90/91/120/121 | DOC-03 §8; DOC-18 | Implementado/verificado |
| RF-13 | UML-CL | `src/dominio/calculadora-mora.ts` | `tests/calculadora-mora.test.ts`: CA-02 y varias cuotas independientes | DOC-03 §9; DOC-18 | Implementado/verificado |
| RF-14 | UML-CL, UML-ES | Calculadora de mora y `Credito`/State | Umbral 90/91 y reactivación al regularizar | DOC-03 §5.3; DOC-18; DOC-20 | Implementado/verificado |
| RF-15 | UML-CL, UML-SP, UML-ES | `src/dominio/credito-estado.ts` | `tests/credito-estado.test.ts`: transiciones, guardas y terminales | DOC-01 §14; DOC-04 §4.5; DOC-20 | Implementado/verificado |
| RF-16 | UML-CL, UML-ES | `TransicionEstado` e historial congelado | Cinco campos, cronología y operaciones fallidas sin efecto | DOC-01 §14; DOC-20 | Implementado/verificado |
| RF-17 | UML-CL, UML-SP, UML-ES | Estados concretos | Deterioro, parcial, regularización, reestructura y cancelación | DOC-04 §4.5; DOC-20 | Implementado/verificado |
| RF-18 | UML-CL, UML-AC | `src/dominio/cartera.ts` | `tests/cartera.test.ts`: CA-06, 30/31 y reestructurado al día | DOC-03 §12; DOC-21 | Implementado/verificado |
| RF-19 | UML-CL, UML-ES, UML-AC | State y `src/dominio/cartera.ts` | CA-07, exclusión y recuperación sin reactivación | DOC-03 §12–13; DOC-20; DOC-21 | Implementado/verificado |
| RF-20 | UML-UC, UML-CL | Módulo cierres | Incluye cinco componentes diarios | DOC-01 §5; DOC-03 §14 | Diseñado |
| RF-21 | UML-UC, UML-CL, UML-AC | Módulo cierres | Consolida campos mensuales y versión de provisión | DOC-03 §12, §14 | Diseñado |
| RF-22 | UML-CL, UML-AC | Cierre/repositorio | Segunda ejecución idéntica no duplica | DOC-03 §14 | Diseñado |
| RF-23 | UML-CL, UML-SP, UML-AC | Movimiento/mayor | Saldo reproducido; corrección compensatoria | DOC-03 §14.2 | Diseñado |
| RF-24 | UML-UC, UML-CL | Contratos GET crédito/pagos/mora | OpenAPI integra plan, saldo, pagos, mora y transiciones | DOC-01 §13; DOC-23 | Contrato implementado/verificado |
| RF-25 | UML-UC, UML-CL, UML-SD, UML-AO | Catálogo/selector de políticas | Selección única, ausencia y superposición | DOC-03 §4 | Diseñado |
| RF-26 | UML-CL, UML-SD | Crédito/política | Nueva versión no altera crédito existente | DOC-03 §4.4 | Diseñado |

## 5. Trazabilidad detallada de requisitos no funcionales

| ID | Diseño/UML | Verificación prevista | Documento | Estado actual |
|---|---|---|---|---|
| RNF-01 | `Dinero`/`Tasa` en UML-CL | 205 pruebas acumuladas; núcleo y contratos conservan decimales exactos | DOC-02 §4; DOC-16–DOC-24 | Implementado/verificado |
| RNF-02 | Fecha explícita/Reloj en UML-CL, UML-SP, UML-SD, UML-AC | Mismas entradas producen mismo resultado | DOC-02 §4.6; DOC-03 §7 | Diseñado |
| RNF-03 | Política histórica y mayor en UML-CL | Reconstrucción desde entradas/políticas/movimientos | DOC-03 §4.4, §14 | Diseñado |
| RNF-04 | Transiciones, políticas y movimientos en UML-CL/ES | Transiciones con cinco datos y cronología verificadas | DOC-01 §6; DOC-04; DOC-20 | State implementado/verificado |
| RNF-05 | DOC-05 | Auditoría automática de IDs y cobertura | DOC-01 §16; DOC-05 | Documentado |
| RNF-06 | Movimiento inmutable en UML-CL/AC | No sobrescritura; compensación enlazada | DOC-03 §14.2 | Diseñado |
| RNF-07 | Flujos alternos en UML-SP/AC | Pagos: replay sin doble efecto y conflicto por datos distintos; cierres pendientes | DOC-03 §14.1; DOC-24 | Parcial: pagos verificados |
| RNF-08 | Paquetes en UML-CL | Revisión de cohesión y dependencias | DOC-04 §4.2 | Parcial; arquitectura en fases 6/14 |
| RNF-09 | Strategy/políticas en UML-CL | Sustituir política sin modificar consumidor | DOC-03 §4, §11 | Diseñado |
| RNF-10 | Puertos en UML-CL y Reloj en secuencias | Dobles de reloj, IDs y repositorios | DOC-04 §4.2 | Diseñado |
| RNF-11 | Guardas UML-SD/SP/ES/AO/AC | Suite transversal INV-01–06 e INV-09–16; cuatro invariantes trazadas a módulos futuros | DOC-01 §8; DOC-03 §16; DOC-22 | Verificado para alcance E4 |
| RNF-12 | Servicios de aplicación en UML-CL | 14 operaciones OpenAPI sin servidor ni dependencia de canal | DOC-01 §15; DOC-23 | Contratos verificados |
| RNF-13 | Actor/fecha/motivo en UML-CL/ES | Zod/OpenAPI exigen autoría en decisiones y operaciones sensibles | DOC-01 §6; DOC-23 | Seguridad conceptual documentada |
| RNF-14 | Sin infraestructura en UML | `npm install --offline`, `npm test` y `npm run verify` | Prompt maestro; DOC-01; DOC-15; DOC-22 | Implementado/verificado E4 |
| RNF-15 | Contratos TypeScript estrictos | `tsc --noEmit`, revisión sin `any` evasivo | DOC-02 §4; DOC-15; DOC-22 | Implementado/verificado E4 |
| RNF-16 | Puertos en UML-CL | Ausencia verificada de HTTP, BD, ORM, frontend, RAG y MCP | DOC-01 §15; DOC-04; DOC-22 | Verificado E4 |

## 6. Trazabilidad de reglas financieras y de negocio

| ID | Regla resumida | Diseño/UML | Clase/módulo | Prueba prevista | Documento |
|---|---|---|---|---|---|
| RN-01 | Monto Q1,000–Q25,000 | UML-AO | Solicitud/Originación | Límites inclusivos y fuera de rango | DOC-01 §7 |
| RN-02 | Plazo 3–24 meses | UML-CL, UML-AO | `Plazo`, Solicitud | Límites inclusivos y no entero | DOC-01 §7 |
| RN-03 | Dinero con moneda compatible | UML-CL | `Dinero` | Mezcla GTQ/USD falla | DOC-02 §4.8 |
| RN-04 | Decimal exacto, dos decimales, HALF_UP | UML-CL | `Dinero` | Casos `1.004/1.005/1.006` | DOC-02 §4.7 |
| RN-05 | Fórmula francesa | UML-CL, UML-SD | Plan/Fábrica | CA-01 completo | DOC-03 §6.2 |
| RN-06 | TNA/12 y caso tasa cero | UML-CL | `Tasa`, Plan | 36%→3%; tasa cero | DOC-03 §5.2, §6.2 |
| RN-07 | Interés, amortización y saldo por período | UML-CL | Plan/Cuota | Comparar 12 filas | DOC-03 §6.3 |
| RN-08 | Ajuste de última cuota | UML-SD, UML-AO | Plan/Cuota | Última amortización=saldo anterior | DOC-03 §6.3 |
| RN-09 | Amortización=capital y saldo final cero | UML-SD, UML-AO | Plan | INV-01, INV-02 | DOC-03 §6.4 |
| RN-10 | Días calendario desde vencimiento | UML-CL | CalculadoraMora | Vencimiento/día siguiente | DOC-03 §7.2 |
| RN-11 | Límites de tramos | UML-ES | TramoMora | Diez fronteras | DOC-03 §8 |
| RN-12 | Tramo no es estado | UML-CL, UML-ES | Mora/State | Revisión estructural | DOC-04 §4.5 |
| RN-13 | Fórmula moratoria | UML-CL | CalculadoraMora | CA-02 | DOC-03 §9.2 |
| RN-14 | Moratorio solo sobre capital | UML-CL | CalculadoraMora | Variar intereses no cambia base | DOC-03 §9.2 |
| RN-15 | Cada cuota calcula mora independiente | UML-CL | CalculadoraMora/Cuota | Dos cuotas con atrasos distintos | DOC-03 §9.2 |
| RN-16 | Actual/360 | UML-CL | Política/Tasa | `0.24/360` exacto | DOC-03 §9.2 |
| RN-17 | Suspensión >90 y reactivación | UML-ES | Credito/State | 90 vs. 91 y regularización | DOC-03 §5.3 |
| RN-18 | Prelación fija | UML-CL, UML-SP | Chain handlers | Orden e importes CA-03/04 | DOC-03 §10 |
| RN-19 | Aceptar pago insuficiente | UML-SP | RegistrarPago/Chain | CA-04 | DOC-03 §10.3 |
| RN-20 | Excedente por Strategy, nunca perdido | UML-CL, UML-SP | PoliticaExcedente | CA-05 | DOC-03 §11 |
| RN-21 | Estados que no admiten pago | UML-CL, UML-SP, UML-ES | State | SOLICITADO/RECHAZADO sin efecto | DOC-01 §7 |
| RN-22 | Regularizar EN_MORA a VIGENTE | UML-SP, UML-ES | EstadoEnMora | Atraso cero y vencido cubierto | DOC-03 §13 |
| RN-23 | Parcial conserva EN_MORA | UML-SP, UML-ES | EstadoEnMora | Queda vencido pendiente | DOC-03 §13 |
| RN-24 | Saldo cero lleva a CANCELADO | UML-SP, UML-ES | State | Desde VIGENTE/REESTRUCTURADO | DOC-01 §7 |
| RN-25 | >120 permite INCOBRABLE irreversible | UML-ES | EstadoEnMora/Incobrable | Guarda, autorización y no reactivación | DOC-03 §8, §13 |
| RN-26 | Riesgo=capital riesgo/cartera activa | UML-CL, UML-AC | Cartera | CA-06 y rango | DOC-03 §12.3 |
| RN-27 | Riesgo por saldo completo o reestructurado | UML-AC | Cartera | >30, reestructurado al día, sin doble conteo | DOC-03 §12.2 |
| RN-28 | Excluir incobrables | UML-ES, UML-AC | Cartera | CA-07 | DOC-03 §12.1 |
| RN-29 | Tasas versionadas, no quemadas | UML-CL, UML-SD | Politicas/Selector | Sustitución de versión | DOC-03 §4 |
| RN-30 | Conservar política de otorgamiento | UML-CL, UML-SD | Credito/Politica | No retroactividad | DOC-03 §4.4 |
| RN-31 | Cierre repetido no duplica | UML-AC | Cierre/Repositorio | Ejecución doble idéntica | DOC-03 §14.1 |
| RN-32 | Saldos por mayor append-only | UML-CL, UML-AC | Movimiento/Mayor | Reproducción y compensación | DOC-03 §14.2 |

## 7. Trazabilidad de invariantes

| ID | Invariante | Clase/módulo responsable | Código previsto | Prueba prevista | UML/Documento |
|---|---|---|---|---|---|
| INV-01 | Σ amortizaciones = capital | Plan/Fábrica | `src/dominio/plan-amortizacion.ts` | `tests/plan-amortizacion.test.ts`: CA-01 y tasa cero | UML-SD/AO; DOC-03 §6; DOC-17 |
| INV-02 | Saldo final = 0 | Plan/Fábrica | `src/dominio/plan-amortizacion.ts` | `tests/plan-amortizacion.test.ts`: CA-01 y tasa cero | UML-SD/AO; DOC-03 §6; DOC-17 |
| INV-03 | Capital nunca negativo | Credito/Cuota | Plan, Chain y estrategias | `tests/invariantes.test.ts`: saldos, cuotas y límites | UML-CL; DOC-02 §4.9; DOC-22 |
| INV-04 | SOLICITADO no se paga | State/RegistrarPago | `src/dominio/credito-estado.ts` | Rechazo sin transición | UML-SP/ES; DOC-20 |
| INV-05 | RECHAZADO no se paga | State/RegistrarPago | `src/dominio/credito-estado.ts` | Rechazo sin transición | UML-SP/ES; DOC-20 |
| INV-06 | Riesgo en [0,1] | Cartera/Resultado | `src/dominio/cartera.ts` | `tests/cartera.test.ts`: 0, 1 y `SIN_CARTERA_ACTIVA` | UML-AC; DOC-03 §12; DOC-21 |
| INV-07 | Mayor reproduce saldo | Mayor/Movimiento | Módulo cierres futuro | Pendiente: movimientos firmados/compensados | UML-CL/AC; DOC-22 §4 |
| INV-08 | Pago duplicado sin segundo efecto | Pago/RepositorioPagos | `src/dominio/pago-idempotente.ts`; `src/aplicacion/registrar-pago.ts` | `tests/pago-idempotencia.test.ts`: replay y conflicto | UML-SP; DOC-24 |
| INV-09 | EN_MORA atraso 0 → VIGENTE | State | `src/dominio/credito-estado.ts` | Regularización y reactivación verificadas | UML-SP/ES; DOC-20 |
| INV-10 | Tramo corresponde a días | CalculadoraMora | `src/dominio/calculadora-mora.ts` | `tests/calculadora-mora.test.ts`: todas las fronteras | UML-CL/ES; DOC-18 |
| INV-11 | Nunca interés sobre interés | CalculadoraMora | `src/dominio/calculadora-mora.ts` | API con base exclusiva de capital y CA-02 | UML-CL; DOC-03 §9; DOC-18 |
| INV-12 | Aplicado + remanente = pago | AplicacionPago/Chain | `src/dominio/prelacion-pago.ts` | `tests/prelacion-pago.test.ts`: CA-03–CA-05 y conservación | UML-SP; DOC-19 |
| INV-13 | Excedente nunca desaparece | PoliticaExcedente | `src/dominio/prelacion-pago.ts` | CA-05 Q1,988.12 y límites de ambas estrategias | UML-CL/SP; DOC-19 |
| INV-14 | Moneda homogénea | Dinero/agregados | `src/dominio/dinero.ts` | Operación cruzada verificada en `tests/dinero.test.ts` | UML-CL; DOC-16 |
| INV-15 | Transición con cinco datos | Credito/TransicionEstado | `src/dominio/credito-estado.ts` | Campos, orden, cronología e inmutabilidad | UML-CL/ES; DOC-20 |
| INV-16 | Incobrable no se reactiva | EstadoIncobrable | `src/dominio/credito-estado.ts` | Recuperación conserva estado e historial | UML-ES; DOC-20 |
| INV-17 | Cierre repetido no duplica | Cierre/RepositorioCierres | Módulo cierres futuro | Pendiente: dos ejecuciones | UML-AC; DOC-22 §4 |
| INV-18 | Política contractual inmutable | Credito/Politica | Catálogo de políticas futuro | Pendiente: nueva versión no modifica previo | UML-CL/SD; DOC-22 §4 |

## 8. Trazabilidad de políticas institucionales

| ID | Política | Consumidores/casos de uso | Clase/módulo | Prueba prevista | Evidencia |
|---|---|---|---|---|---|
| POL-01 | Tasa corriente | CU-06, CU-08 | PoliticaFinanciera, Tasa, Plan | TNA/12, versión y vigencia | UML-CL/SD; DOC-03 §5 |
| POL-02 | Tasa moratoria | CU-08 | PoliticaFinanciera, CalculadoraMora | CA-02/Actual-360 | UML-CL; DOC-03 §9 |
| POL-03 | Tratamiento excedente | CU-07 | PoliticaExcedente | Ambas estrategias conservan monto | UML-CL/SP; DOC-03 §11 |
| POL-04 | Gastos/comisiones | CU-07 | Handler Gastos/PoliticaFinanciera | Cero y valores configurados futuros | UML-CL/SP |
| POL-05 | Evaluación | CU-03 | EvaluacionCredito/PoliticaFinanciera | Conservación de criterios/versiones | UML-CL/AO |
| POL-06 | Aprobación | CU-04, CU-05 | Solicitud/PoliticaFinanciera | Actor autorizado y límites futuros | UML-UC/AO |
| POL-07 | Expiración | CU-17 | Solicitud/PoliticaFinanciera | Fecha límite y transición ANULADO | UML-ES/AO |
| POL-08 | Provisiones | CU-13 | CierreMensual/PoliticaFinanciera | Versión y porcentajes cuando existan | UML-CL/AC |
| POL-09 | Reestructuración | CU-10 | Credito/State/PoliticaFinanciera | Autorización, historia y riesgo | UML-CL/ES |
| POL-10 | Calendario | CU-06, CU-08 | Fábrica/FechaCorte/Política | Fecha contractual sin ajuste silencioso | UML-SD/AO |
| POL-11 | Cartera activa cero | CU-14 | `ResultadoSinCarteraActiva` | `SIN_CARTERA_ACTIVA` verificado | UML-CL/AC; DOC-03 §12.3; DOC-21 |
| POL-12 | Reactivación de devengo | CU-09 | Credito/State/PoliticaFinanciera | Regularizado reactiva; incobrable no | UML-ES; DOC-03 §5.3 |

## 9. Trazabilidad de casos financieros de aceptación

| ID | Entradas | Resultado exigido | Código previsto | Prueba prevista | Requisitos cubiertos |
|---|---|---|---|---|---|
| CA-01 | Q10,000; TNA 36%; 3%; 12 meses | 11×Q1,004.62; final Q1,004.63; totales y saldo exactos | `src/dominio/plan-amortizacion.ts` | `tests/plan-amortizacion.test.ts`: 12 filas completas verificadas | RF-06, RN-05–RN-09, INV-01–INV-03; DOC-17 |
| CA-02 | Q725.76; 24%; Actual/360; 15 días | Q7.26 | `src/dominio/calculadora-mora.ts` | `tests/calculadora-mora.test.ts`: fórmula y base exclusiva verificadas | RF-13, RN-13–RN-16, INV-11; DOC-18 |
| CA-03 | Pago Q1,011.88 | 0/7.26/278.86/725.76; remanente cero | `src/dominio/prelacion-pago.ts` | `tests/prelacion-pago.test.ts`: pago exacto verificado | RF-07, RF-08, INV-12; DOC-19 |
| CA-04 | Pago Q500.00 | 0/7.26/278.86/213.88; capital pendiente 511.88 | `src/dominio/prelacion-pago.ts` | `tests/prelacion-pago.test.ts`: pago parcial verificado | RF-07, RF-08, RN-19, INV-12; DOC-19 |
| CA-05 | Pago Q3,000.00 | Saldar 1,011.88; excedente 1,988.12 | `src/dominio/prelacion-pago.ts` | `tests/prelacion-pago.test.ts`: Strategy y conservación verificadas | RF-09, RN-20, INV-13; DOC-19 |
| CA-06 | Activa Q800,000; riesgo Q56,000 | 7.00% | `src/dominio/cartera.ts` | `tests/cartera.test.ts`: razón exacta verificada | RF-18, RN-26, RN-27, INV-06; DOC-21 |
| CA-07 | Activa Q792,000; riesgo Q48,000 | 6.06% | `src/dominio/cartera.ts` | `tests/cartera.test.ts`: exclusión C-005 verificada | RF-19, RN-28, INV-06, INV-16; DOC-21 |

## 10. Cobertura requisito → caso de uso → UML

| Caso de uso | Requisitos funcionales principales | UML que demuestra interacción |
|---|---|---|
| CU-01 | RF-01 | UML-UC, UML-CL, UML-AO |
| CU-02 | RF-02 | UML-UC, UML-CL, UML-AO |
| CU-03 | RF-03 | UML-UC, UML-CL, UML-AO |
| CU-04 | RF-04, RF-15 | UML-UC, UML-CL, UML-ES, UML-AO |
| CU-05 | RF-04, RF-15 | UML-UC, UML-CL, UML-ES, UML-AO |
| CU-06 | RF-05, RF-06, RF-25, RF-26 | UML-UC, UML-CL, UML-SD, UML-AO |
| CU-07 | RF-07–RF-10, RF-15, RF-17 | UML-UC, UML-CL, UML-SP, UML-ES |
| CU-08 | RF-11–RF-15 | UML-UC, UML-CL, UML-ES |
| CU-09 | RF-14, RF-17 | UML-UC, UML-SP, UML-ES |
| CU-10 | RF-15, RF-17 | UML-UC, UML-CL, UML-ES |
| CU-11 | RF-15, RF-17, RF-19 | UML-UC, UML-CL, UML-ES, UML-AC |
| CU-12 | RF-20, RF-22, RF-23 | UML-UC, UML-CL |
| CU-13 | RF-21–RF-23 | UML-UC, UML-CL, UML-AC |
| CU-14 | RF-18, RF-19 | UML-UC, UML-CL, UML-AC |
| CU-15 | RF-16, RF-23, RF-24, RF-26 | UML-UC, UML-CL |
| CU-16 | RF-25 | UML-UC, UML-CL |
| CU-17 | RF-15 | UML-UC, UML-ES, UML-AO |
| CU-18 | RF-15, RF-17 | UML-UC, UML-SP, UML-ES |

## 11. Control de cobertura y actualización

### 11.1 Criterios de integridad

La matriz solo se considera íntegra cuando:

1. cada RF tiene al menos un caso de uso y una clase/módulo;
2. cada requisito calculable tiene una prueba prevista o implementada;
3. cada invariante tiene un responsable de dominio y una prueba;
4. cada política identifica consumidores y evidencia de versión;
5. cada caso financiero tiene resultados exactos y una prueba futura;
6. ningún archivo previsto se marca implementado antes de existir;
7. los nombres de clases coinciden con UML y, posteriormente, con código;
8. cualquier cambio de regla actualiza primero su documento fuente y luego esta matriz.

### 11.2 Estado por capa de trazabilidad

| Capa | Estado al cerrar Fase 5 |
|---|---|
| Requisitos | Documentados RF-01–RF-26 y RNF-01–RNF-16 |
| Reglas/invariantes/políticas | Documentadas RN-01–RN-32, INV-01–INV-18 y POL-01–POL-12 |
| Casos de aceptación | Documentados CA-01–CA-07 |
| Diseño conceptual | Documentado en DOC-02 y DOC-03 |
| UML | Creado y referenciado mediante UML-UC–UML-AC |
| Código | Previsto; no iniciado por orden del prompt |
| Pruebas | Previstas; no iniciadas por orden del prompt |
| Arquitectura Hexagonal/Monolito Modular | Documentada en DOC-06 y diagrama PlantUML de arquitectura |
| ISO/IEC 25010 | Priorizado y operacionalizado en DOC-07 |
| Modelo 4+1 | Vistas lógica, desarrollo y escenarios documentadas en DOC-08 |
| C4 N1/N2/N3 | Contexto, contenedores y componentes documentados en DOC-09 |
| Diseño modular E3 | Componentes, contratos y correspondencia E3→E4 documentados en DOC-10 |
| SOLID | Aplicación concreta de SRP, OCP, LSP, ISP y DIP documentada en DOC-11 |
| GRASP | Aplicación concreta de siete patrones de asignación documentada en DOC-12 |
| Patrones | Value Object, Strategy, Chain, State, Factory y Repository documentados en DOC-13 |
| Cohesión/acoplamiento | Módulos, dependencias, ciclos y reglas verificables documentados en DOC-14 |
| Configuración TypeScript | Node/TypeScript/Vitest estricto y reproducible documentado en DOC-15 |
| Dinero E4 | Value Object implementado y verificado con 43 pruebas en DOC-16 |
| Plan E4 | Amortización francesa y CA-01 implementados/verificados en DOC-17 |
| Mora E4 | Días, tramos, Actual/360 y CA-02 implementados/verificados en DOC-18 |
| Pagos E4 | Chain, Strategy y CA-03–CA-05 implementados/verificados en DOC-19 |
| State E4 | Ciclo, guardas e historial implementados/verificados en DOC-20 |
| Cartera E4 | Riesgo, exclusiones y CA-06/CA-07 implementados/verificados en DOC-21 |
| Walking skeleton E4 | Instalación autónoma, 179 pruebas e invariantes transversales verificadas en DOC-22 |
| Contratos E5 | OpenAPI 3.1, 14 operaciones, Zod y error uniforme verificados en DOC-23 |
| Idempotencia | Pagos con clave, replay y conflicto implementados/verificados en DOC-24 |
| ADR | Arquitectura, dinero y amortización registrados como decisiones aceptadas en DOC-25 |
| Repositorio E6 | Código, pruebas, documentación y 18 fuentes PlantUML editables organizados y verificados en DOC-26 |
| README | Guía profesional de instalación, ejecución, pruebas, arquitectura y documentación consolidada en DOC-27 |
| Documento final | Contenido de portada a anexos, plan de figuras legibles y lista de exportación preparados en DOC-28 |
| Rúbrica | Cuatro bloques, 18 controles y riesgos de entrega auditados con proyección 10/10 en DOC-29 |
| Penalizaciones | Once controles cumplidos, cero incumplimientos técnicos y publicación del repositorio pendiente en DOC-30 |
| Forma de trabajo | Ocho pasos, puerta de autorización, cadena requisito-documento y 12 criterios finales verificados en DOC-31 |

## 12. Decisiones pendientes trazadas

| ID | Decisión pendiente | Requisitos afectados | Acción posterior |
|---|---|---|---|
| DP-03 | Calendario y ajuste no hábil | RF-06, RF-11, POL-10 | Definir política institucional antes de ajustar fechas contractuales; DOC-18 usa sin alteración la fecha explícita recibida. |
| DP-06 | Cuentas de recuperaciones de incobrable | RF-19, RF-23 | Definir catálogo contable; no reactivar estado. |
| DP-08 | Tasas de provisión | RF-21, POL-08 | Mantener configurables hasta recibir datos institucionales. |
| DP-09 | Gastos/comisiones | RF-08, POL-04 | Mantener concepto configurable; CA-03–05 usan Q0.00. |
| DP-11 | Plazo o cuota tras amortización anticipada | RF-09, POL-03 | Resolver contractualmente antes de regenerar planes. |
| DP-12 | Evaluación y facultades concretas | RF-03, RF-04, POL-05, POL-06 | Requiere información institucional. |
| DP-13 | Renderizado automático PlantUML | RNF-14 | Configurar herramienta en fase documental sin reemplazar `.puml`. |

## 13. Validación de la Fase 5

| Validación | Evidencia | Estado |
|---|---|---|
| Tabla mínima `Requisito → Caso de uso → Clase/Módulo` | Sección 3 | Cumplida |
| RF-01–RF-26 presentes | Secciones 3 y 4 | Cumplida |
| RNF-01–RNF-16 presentes | Secciones 3 y 5 | Cumplida |
| RN-01–RN-32 presentes | Sección 6 | Cumplida |
| INV-01–INV-18 presentes | Sección 7 | Cumplida |
| POL-01–POL-12 presentes | Sección 8 | Cumplida |
| CA-01–CA-07 presentes | Sección 9 | Cumplida |
| CU-01–CU-18 conectados | Secciones 2 y 10 | Cumplida |
| UML editable enlazado | Leyenda y columnas UML | Cumplida |
| Código/pruebas no presentados como existentes | Leyenda y estado actual | Cumplida |
| Correspondencia con Fases 1–4 | DOC-01–DOC-04 | Cumplida |

## 14. Resultado esperado

Toda regla conocida puede recorrerse desde su origen hasta un caso de uso, una responsabilidad de dominio, un artefacto UML, una ubicación futura de código y una validación prevista. La matriz queda preparada para actualizarse incrementalmente durante arquitectura, diseño modular, implementación, pruebas, contratos y documentación final.
## 15. Evolución P2 — requisitos implementados

| Requisito | Regla/diseño | Código | Prueba | Documento/diagrama |
|---|---|---|---|---|
| CP-01 | Strategy y tramos, tope, redondeo único | `src/dominio/politica-mora/`; `calculadora-mora.ts`; `src/aplicacion/consultar-mora.ts` | `tests/politica-mora.test.ts` | `docs/proyecto2/01-evolucion-nucleo.md`; ADR-004; `08-secuencia-politica-mora.puml`; `04-strategy-mora.puml` |
| CP-02 | Q25 una vez por crédito/cuota/concepto | `src/dominio/gasto-gestion-cobro.ts` | `tests/gasto-gestion-cobro.test.ts` | Evolución P2; `09-secuencia-gasto-idempotente.puml` |
| CP-03 | Coexistencia y sustitución (agrupación de trazabilidad; el encargo no define una sección CP-03 independiente) | Catálogo, políticas y `consultarMora` | `tests/contrato-politica.test.ts`; `tests/regresion-p1.test.ts` | ADR-004; `docs/informe-impacto-solid.md` |
| CP-04.1 | Liquidación desde EN_MORA con dos guardas | `src/dominio/credito-estado.ts`: `liquidarConPago`, `EstadoEnMora.cancelar` | `tests/credito-cancelacion-p2.test.ts` | `docs/implementacion/FASE-20-state-credito.md`; `docs/diagramas/uml/05-estados-credito.puml`; `docs/diagramas/patrones/02-state-credito.puml` |
| CP-04.2 | Suspenso monetario y cortes idempotentes | `src/dominio/devengo-interes.ts`: `DevengoInteres` | `tests/devengo-interes.test.ts` | `docs/implementacion/FASE-20-state-credito.md`; State P2 |
| CP-04.3 | Contribuciones al riesgo, mora total y bajas del período | `src/dominio/cartera-por-tramo.ts`: `calcularCarteraPorTramo` | `tests/cartera-por-tramo.test.ts` | `docs/proyecto2/01-evolucion-nucleo.md`, oráculos 7.00%, 21.75% y 6.06% |

### Invariantes P2 y contrato

| Invariante | Evidencia ejecutable |
|---|---|
| 1. Monotonía 0–120 y congelación posterior | `politica-mora.test.ts`: recorrido 1–120 y días 121, 150, 365, 10000 |
| 2. Escalonada ≤ retroactiva solo 1–120 | `politica-mora.test.ts`: comparación limitada explícitamente |
| 3. Moratorio ≤ capital | `contrato-politica.test.ts`: tres estrategias, cuatro capitales, dos monedas, trece atrasos |
| 4. Escalonada = plana 18% entre 1–30 | `politica-mora.test.ts`: bucle de fronteras |
| 5. Otorgamiento previo conserva Q7.26 | `regresion-p1.test.ts`: corte posterior a nueva vigencia |
| 6. Gasto como máximo una vez | `gasto-gestion-cobro.test.ts`: reejecución y cambios de tramo |
| 7. Sumas monetarias y porcentuales | `cartera-por-tramo.test.ts`: oráculo y tercios con centésima residual |
| 8. Incobrable congela y sale de activa | `regresion-p1.test.ts`: plana y escalonada integradas con cartera |
| Contratos externos aditivos | `contratos-p2.test.ts`: presentadores reales y equivalencia estructural Zod/OpenAPI; `openapi.test.ts` conserva 14 operaciones y referencias |

La [validación P2](../proyecto2/03-validacion-final.md) actualiza el estado de implementación. Las secciones anteriores conservan la trazabilidad histórica P1; no deben leerse como si los pendientes de aquella fecha fueran el estado actual de P2.
