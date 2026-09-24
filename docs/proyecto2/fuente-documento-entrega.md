<!--
Plantilla del documento de entrega. NO se edita el resultado (P2-documento-entrega.md):
se edita esta plantilla o los documentos incluidos y se regenera con
  python3 docs/proyecto2/generar_documento_entrega.py
Cada línea {{INCLUDE:ruta|capítulo|nivel}} inserta un documento del repositorio,
renumerando sus secciones dentro del capítulo indicado.
-->
# Proyecto 2 · UX/UI, movilidad y evolución del núcleo

**Universidad Mariano Gálvez de Guatemala** · Facultad de Ingeniería en Sistemas de Información · Análisis de Sistemas II (037)

**Sistema de Gestión de Microcrédito — Crédito Vecino, S. A.**

| Dato | Valor |
|---|---|
| **Grupo** | 2 |
| **Sección** | A |
| **Docente** | Ing. Ezequiel Urizar |
| **Prototipo móvil (Figma)** | [Microcréditos App](https://www.figma.com/proto/jozM3QI8ZJ6pywdCoO5OVo/Microcr%C3%A9ditos-App?node-id=0-1&t=PJlTVLC3ASu31ttw-1) |
| **Prototipo web (Figma Make)** | [Prototipo Microcréditos Web](https://www.figma.com/make/WHj2TK5IRg55X8JiaKXyvy/Prototipo-Microcr%25C3%25A9ditos-Web?code-node-id=0-6&p=f&fullscreen=1) |
| **Repositorio** | [github.com/ItsRomero/Proyecto1_Analisis](https://github.com/ItsRomero/Proyecto1_Analisis) |
| **Commit de entrega del Proyecto 1** | `8737d9b` (etiqueta `entrega-p1`) |
| **Fecha de entrega** | Guatemala, 25 de septiembre de 2026 |

| Integrante | Carné | Rol |
|---|---|---|
| Christopher David Herrera Pérez | 7690-20-20773 | Implementación / Pruebas |
| Erwin Alberto Ramírez Racancoj | 7690-23-2387 | Pruebas / Trazabilidad |
| Gabriela Elízabeth Noemí Aguilar Vásquez | 7690-23-13249 | Diseño / Documentación |
| Oliver Fernando Romero Esquite | 7690-23-7366 | Coordinación / Integración |

---

# 1. Introducción

## 1.1 Qué responde este proyecto

El Proyecto 1 respondió a la pregunta *¿cómo está construido el sistema por dentro?* Definimos la arquitectura hexagonal, los componentes y un núcleo de dominio en TypeScript que calcula el dinero: plan de amortización, prelación de pagos, mora e indicadores de cartera. El Proyecto 2 trabaja sobre **el mismo sistema, el mismo repositorio y el mismo equipo** (regla de incrementalidad) y agrega dos preguntas.

**¿Cómo se usa el sistema?** Un motor de cálculo impecable produce créditos mal capturados si la asesora, de pie bajo el sol y con una mano ocupada, tiene que escribir el monto en un campo ambiguo. En una financiera, la interfaz es donde se originan la mayoría de los errores de datos. Por eso investigamos a los usuarios (E1), organizamos la información y dibujamos los wireframes (E2), construimos un prototipo navegable en Figma (E3), decidimos cómo debe funcionar la aplicación en el teléfono y sin señal (E4) y evaluamos el prototipo con las heurísticas de Nielsen y WCAG 2.2 (E5).

**¿Resiste el diseño un cambio de requisito real?** El comité de Crédito Vecino (Acta 09-2026) decidió que, desde el 1 de octubre de 2026, la mora deja de cobrarse con una tasa plana del 24 % y pasa a cobrarse **por tramos recorridos**: 18 %, 24 %, 30 % y 36 % anual según los días de atraso. Los créditos anteriores conservan la política vieja. Implementamos ese cambio en el núcleo del Proyecto 1 (E6) y medimos, con el historial de Git como evidencia, cuánto tuvimos que modificar. Ese es el informe de impacto SOLID.

## 1.2 Cómo leer este documento

Cada capítulo corresponde a un entregable del enunciado (sección 9) y sigue el orden E1 → E7. Tres convenciones se repiten en todo el documento:

- **Las cifras salen del núcleo.** Q1,004.62, Q18.14, Q50.80, 7.00 % y 21.75 % son resultados de `src/dominio` verificados por las pruebas (`npm test`), no estimaciones (regla 6.2 del enunciado).
- **Cada afirmación dice de dónde sale.** En la investigación distinguimos lo que viene del enunciado, de fuentes documentadas, del núcleo y lo que todavía es una hipótesis por validar.
- **Somos transparentes con lo que falta.** El capítulo 10 contrasta el trabajo con la lista de verificación de la sección 12.2 del enunciado.

La sección 8.2 presenta en una tabla ordenada **todos los commits** hechos desde la entrega del Proyecto 1, con lo que aportó cada uno.

---

# 2. E1 · Investigación de usuario

Este capítulo responde al entregable E1: personas fundamentadas, journey map del flujo principal y los momentos en que un error de interfaz se convierte en un error de dinero. Incluye el cuarto momento que el enunciado exige: el instante en que el cliente descubre que su mora subió de tramo.

{{INCLUDE:docs/proyecto2/e1-investigacion-usuario.md|2|2}}

---

# 3. E2 · Arquitectura de información y wireframes

Con las personas definidas, organizamos la aplicación. Este capítulo presenta el mapa de navegación, la tabla de correspondencia pantalla ↔ caso de uso que exige la sección 6.1 y los wireframes de baja fidelidad (skeleton y anotado). Todas las pantallas usan los **mismos nombres y códigos que el prototipo de Figma** (P01–P14), y las que faltan construir tienen su guía (G01–G07); los wireframes anotados completos están en el Anexo A. Al final se justifica la jerarquía del tablero gerencial y cómo se distinguen la cartera en mora y la cartera en riesgo.

{{INCLUDE:docs/proyecto2/e2-arquitectura-informacion.md|3|2}}

---

# 4. E3 · Prototipo navegable en Figma

Este capítulo presenta los dos prototipos navegables, cómo recorrer los tres flujos obligatorios, qué resuelven bien y qué cifras todavía no coinciden con el núcleo.

{{INCLUDE:docs/proyecto2/e3-prototipo-figma.md|4|2}}

---

# 5. E4 · Decisión de arquitectura móvil/web y diseño responsivo

Este capítulo decide cómo se construye la aplicación: nativa, híbrida o PWA. La decisión se argumenta contra el contexto real de cada perfil. Explica también cómo se transforma el tablero entre el teléfono y el escritorio, y qué pasa cuando la asesora registra un pago sin señal. Esa última decisión solo funciona gracias a dos piezas del Proyecto 1: la clave de idempotencia y el puerto `Reloj`.

{{INCLUDE:docs/proyecto2/e4-decision-movil-web.md|5|2}}

---

# 6. E5 · Evaluación heurística y de accesibilidad

{{INCLUDE:docs/proyecto2/e5-evaluacion-heuristica.md|6|2}}

---

# 7. E6 · Evolución del núcleo e informe de impacto SOLID

## 7.1 Qué se implementó

Implementamos en el mismo repositorio del Proyecto 1 los cuatro cambios de la sección 7 del enunciado:

| Cambio | Qué pide el enunciado | Qué hicimos | Dónde está |
|---|---|---|---|
| **CP-01** · Política escalonada | Cada día de atraso se cobra a la tasa del tramo al que pertenece (18/24/30/36 %), base Actual/360, **un solo redondeo al final** y tope en el capital en mora | Puerto `PoliticaMora` con implementación escalonada; tasas en configuración versionada, fuera del motor | `src/dominio/politica-mora/` |
| **CP-02** · Gasto de gestión de cobro | Q25.00 por cuota vencida al llegar al día 31, una sola vez, aunque el cierre se repita | `generarGastoGestion`, idempotente por crédito, cuota y concepto | `gasto-gestion-cobro.ts` |
| **CP-03** · Coexistencia de políticas (sección 7.6 del enunciado) | Los créditos otorgados antes del 1/10/2026 conservan la política plana del 24 % | `resolverPolitica` elige según la fecha de otorgamiento: CV-2026-0100 paga Q21.77 y CV-2026-0410 paga Q18.14 a 45 días | `catalogo-politicas.ts` |
| **CP-04.1** · `en_mora → cancelado` | Un pago que deja el saldo exacto en cero cancela el crédito en mora | Transición nueva en el State `EstadoEnMora` | `credito-estado.ts` |
| **CP-04.2** · Suspensión del devengo | Después del día 90 el interés corriente va a "interés en suspenso" y no al ingreso | `DevengoInteres`: entre el día 90 y el 100 el ingreso no sube y el suspenso sí | `devengo-interes.ts` |
| **CP-04.3** · Cartera en riesgo por tramo | El núcleo expone el desglose para que el tablero no recalcule | `calcularCarteraPorTramo`: 3.00 + 2.25 + 1.00 + 0.75 = 7.00 % | `cartera-por-tramo.ts` |

Los casos de referencia del enunciado salen exactos de las pruebas: M-1 Q5.44, M-2 Q18.14, M-3 Q50.80, M-4 Q65.32, M-5 Q1,047.76, coexistencia Q21.77 frente a Q18.14, y la prueba original del P1 de Q7.26 sigue pasando. El detalle de fórmulas y la selección de políticas están en `docs/proyecto2/e6-02-evolucion-nucleo.md`; las entradas, salidas y criterios de cada prueba, en `e6-03-pruebas-mora-escalonada.md`.

## 7.2 Informe de impacto SOLID (Anexo D)

Este es el informe que exige la sección 8. También está en el repositorio como `docs/informe-impacto-solid.md`, tal como pide el E7.

{{INCLUDE:docs/informe-impacto-solid.md|7.2|3}}

---

# 8. E7 · Repositorio e historial de cambios

## 8.1 Cómo se organizó el repositorio

La documentación del Proyecto 2 vive en `docs/proyecto2/`, con un prefijo por entregable para que su propósito sea evidente:

| Prefijo | Entregable | Archivos |
|---|---|---|
| `e1-` | Investigación de usuario | `e1-investigacion-usuario.md`, `e1-instrumentos-investigacion.md` |
| `e2-` | Arquitectura de información | `e2-arquitectura-informacion.md` y la carpeta `wireframes/` |
| `e4-` | Decisión móvil/web | `e4-decision-movil-web.md` |
| `e6-` | Evolución del núcleo | `e6-01-auditoria-inicial.md`, `e6-02-evolucion-nucleo.md`, `e6-03-pruebas-mora-escalonada.md`, `e6-04-validacion-final.md` |
| — | Informe SOLID y ADR | `docs/informe-impacto-solid.md`, `docs/adr/ADR-004-politica-mora-escalonada.md` |
| — | Índice e historial | `docs/proyecto2/README.md`, `historial-cambios.md` |

El núcleo sigue en `src/dominio/` y las pruebas en `tests/`. Todo se verifica con `npm install && npm test`, sin base de datos, sin servidor y sin interfaz.

## 8.2 Historial de commits

El enunciado exige que el historial permita comparar la entrega del P1 con la del P2, y advierte que alterar ese historial es falta de integridad académica. No reescribimos nada. Esta tabla presenta **todos los commits** desde `entrega-p1`, en orden cronológico, con lo que aportó cada uno. Los datos salen de:

```bash
git log --reverse --format='%h %ad %an %s' --date=short entrega-p1..HEAD
git show --stat <hash>
```

### 8.2.1 Tabla de commits

| # | Fecha | Commit | Autor (Git) | Tipo | Entregable | Qué se hizo | Archivos principales | Cambio |
|---|---|---|---|---|---|---|---|---|
| — | 26/08 | `8737d9b` | — | Base | P1 | **Entrega del Proyecto 1** (etiqueta `entrega-p1`). Punto de comparación de todas las métricas | — | — |
| 0 | 21/09 | `71a5179` | Christopher Herrera | Auditoría | E6 | Auditoría inicial y línea base: 7 archivos de dominio y 206 pruebas pasando; se crea la etiqueta `entrega-p1` | `e6-01-auditoria-inicial.md` | 1 archivo, +70 |
| 1 | 21/09 | `ec2a436` | Christopher Herrera | Funcionalidad | E6 · CP-01 | Puerto `PoliticaMora`, políticas plana, escalonada y retroactiva, catálogo por fecha de otorgamiento, configuración versionada y Specification de tramo. Se abre el motor para inyectar la política | `politica-mora/*`, `clasificacion-tramo.ts`, `calculadora-mora.ts` | 10 archivos, +223 / −21 |
| 2 | 21/09 | `d3b30f5` | Christopher Herrera | Funcionalidad | E6 · CP-02 | Gasto de gestión de cobro de Q25.00 al día 31, idempotente por cuota | `gasto-gestion-cobro.ts` y su prueba | 2 archivos, +105 |
| 3 | 21/09 | `5752b55` | Christopher Herrera | Funcionalidad | E6 · CP-04 | Transición `en_mora → cancelado`, suspensión del devengo y cartera en riesgo por tramo; diagramas de estado actualizados | `credito-estado.ts`, `devengo-interes.ts`, `cartera-por-tramo.ts` | 10 archivos, +343 / −2 |
| 4 | 21/09 | `0d6c1a9` | ERAMR18 | Pruebas | E6 · CP-03 | Contrato común contra las tres políticas (Liskov), regresión integrada y caso de uso `consultarMora`. **Corte del núcleo medido en el informe SOLID** | `contrato-politica.test.ts`, `regresion-p1.test.ts`, `consultar-mora.ts` | 3 archivos, +121 |
| 5 | 21/09 | `958e70f` | ERAMR18 | Documentación | E6 | ADR-004, primer informe SOLID, UML (Strategy de mora, secuencias), contratos Zod/OpenAPI y documento móvil inicial | `ADR-004`, `informe-impacto-solid.md`, `*.puml`, `openapi.yaml` | 16 archivos, +753 / −97 |
| 6 | 21/09 | `8112e57` | ERAMR18 | Validación | E6 | Validación desde instalación limpia: 263 pruebas en 18 archivos y revisión de tipos sin errores | `e6-04-validacion-final.md` | 2 archivos, +100 / −1 |
| 7 | 22/09 | `5e73d12` | Christopher Herrera | Herramientas | E6 | Seis comandos de prueba por tema (`test:mora`, `test:cp04`, `test:invariantes`…) para verificar partes específicas en la defensa | `package.json` | 1 archivo, +6 |
| 8 | 22/09 | `9e06c37` | Elízabeth | Documentación | E6 | Documento de pruebas de la mora escalonada (entradas, salidas y criterios) e informe de verificación SOLID | `e6-03-pruebas-mora-escalonada.md`, informe de verificación | 2 archivos, +1,043 |
| 9 | 22/09 | `8e421a6` | Elízabeth | Integración | — | Sincronización de la rama local con la remota | `package.json` | 1 archivo, +6 |
| 10 | 22/09 | `183dc71` | Oliver Romero | Integración | E6 · E7 | **Pull Request #1**: integra toda la evolución del núcleo en `main` | 42 archivos | +2,751 / −108 |
| 11 | 22/09 | `13aa167` | Erwin | Documentación | E7 | README: tabla de comandos de prueba por tema | `README.md` | 1 archivo, +20 / −1 |
| 12 | 23/09 | `16f983f` | Oliver Romero · IA declarada | Documentación | E1 · E2 · E4 · E6 | Investigación de usuario, arquitectura de información, 15 wireframes, decisión PWA; informe SOLID reorganizado según el Anexo D; documentos renombrados por entregable | `e1-*`, `e2-*`, `e4-*`, `wireframes/`, `informe-impacto-solid.md` | 32 archivos, +2,413 / −232 |
| 13 | 23/09 | `4ba9e55` | Oliver Romero · IA declarada | Documentación | E7 | Historial de cambios y documento técnico consolidado | `historial-cambios.md`, `documentacion-completa.md` | 4 archivos, +2,658 |
| 14 | 23/09 | `00709f9` | Oliver Romero · IA declarada | Documentación | E3 · E5 · E7 | Enlace de Figma en el README y el índice, revisión del prototipo y evaluación preliminar E5 | `P2-documento-entrega.md`, `README.md` | 6 archivos, +511 / −12 |
| 15 | 23/09 | `8486b6e` | Oliver Romero · IA declarada | Documentación | E1–E7 | Documento de entrega unificado (este archivo), generado a partir de los documentos del repositorio | `P2-documento-entrega.md`, `fuente-documento-entrega.md` | — |
| 16 | 23/09 | `53689ef` | Oliver Romero · IA declarada | Documentación | E2 · E6 | Primeros skeletons, diagrama de casos de uso y ADR-005 (PWA) | `wireframes/skeleton/`, `casos-de-uso-p2.svg`, `ADR-005` | 22 archivos |
| 17 | 23/09 | `cdc92c4` | Oliver Romero · IA declarada | Documentación | E2 · E6 · E7 | Documento de complementos con enlaces a GitHub | `P2-complementos.md` | 2 archivos |
| 18 | 23/09 | *(este documento)* | Oliver Romero · IA declarada | Documentación | E2 · E3 | **Alineación con Figma:** wireframes P01–P14 con la misma disposición que el prototipo y guías G01–G07 para las pantallas que faltan; mapa, casos de uso y documentos con los mismos códigos | `wireframes/anotado/`, `wireframes/skeleton/`, `e2-arquitectura-informacion.md` | — |

**Totales desde `entrega-p1`:** el núcleo `src/dominio` suma 12 archivos (10 nuevos y 2 modificados), +381 / −21 líneas. Las pruebas pasan de 206 a 263 sin modificar ningún archivo de prueba del P1.

> **Nota sobre los hashes.** Los commits 0 a 11 están en `main` desde el Pull Request #1. Los commits de documentación (12 en adelante) están en la rama `docs/proyecto2-ux` y se publican con el mismo hash.

### 8.2.2 Las fases del trabajo

| Fase | Fechas | Commits | Resultado |
|---|---|---|---|
| Auditoría | 21/09 | 0 | Línea base del P1 verificada y etiquetada |
| Evolución del núcleo | 21/09 | 1 – 4 | CP-01 a CP-04 implementados, de 206 a 260 pruebas |
| Contratos y documentación técnica | 21/09 | 5 – 6 | ADR, UML, OpenAPI, informe SOLID y validación limpia (263 pruebas) |
| Herramientas e integración | 22/09 | 7 – 11 | Comandos de prueba, documento de pruebas, PR #1 y README |
| Experiencia de usuario y entrega | 23/09 | 12 – 18 | E1, E2, E4, wireframes, revisión E3/E5, historial y documento de entrega |

## 8.3 Qué faltaba documentar y cómo se resolvió

| Problema encontrado en la revisión | Solución |
|---|---|
| Tres documentos afirmaban que "el enunciado no define CP-03". Sí lo define: es la sección 7.6, *Coexistencia de políticas* | Corregido en `e6-02`, `e6-04` y en la matriz de trazabilidad |
| La validación decía "sin push, PR ni merge", pero después hubo un PR | Actualizada con el PR #1 (`183dc71`) |
| El documento de pruebas no tenía extensión `.md` y GitHub lo mostraba como texto plano | Renombrado a `e6-03-pruebas-mora-escalonada.md` |
| Había dos informes SOLID con datos distintos (13 frente a 12 atrasos probados) | Fusionados en uno, con la cifra correcta: 12 atrasos y 288 combinaciones |
| Los comandos de prueba (commit 7) y los merges (9 y 10) no estaban en ningún documento | Registrados en la tabla de §8.2.1 y en `historial-cambios.md` |
| E1, E2 y E4 casi no existían, y el documento móvil no tomaba una decisión | Escritos de nuevo (capítulos 2, 3 y 5) |

---

# 9. Reparto del trabajo y declaración de uso de IA

## 9.1 Reparto del trabajo (sección 12.1)

La tabla combina los roles del equipo con la evidencia del historial de Git. Los commits firmados como *ERAMR18* y *Erwin* son de Erwin Ramírez, y los firmados como *Elízabeth*, de Gabriela Aguilar.

| Integrante | Rol | Responsabilidad principal | Evidencia verificable | Entregables |
|---|---|---|---|---|
| Christopher David Herrera Pérez | Implementación / Pruebas | Auditoría inicial, políticas de mora (CP-01), gasto de cobro (CP-02), CP-04 y comandos de prueba por tema | Commits 0, 1, 2, 3 y 7 | E6 |
| Erwin Alberto Ramírez Racancoj | Pruebas / Trazabilidad | Contrato común de las políticas (LSP), regresión del P1, ADR-004, UML, contratos Zod/OpenAPI, validación limpia y README | Commits 4, 5, 6 y 11 | E6, E7 |
| Gabriela Elízabeth Noemí Aguilar Vásquez | Diseño / Documentación | Prototipos de Figma (móvil y web), documento de pruebas de la mora escalonada e informe de verificación SOLID | Prototipos enlazados en el capítulo 4; commits 8 y 9 | E3, E5, E6 |
| Oliver Fernando Romero Esquite | Coordinación / Integración | Pull Request #1, investigación de usuario, arquitectura de información y wireframes, decisión móvil/web, informe SOLID según el Anexo D y documento de entrega | Commits 10 y 12 en adelante | E1, E2, E4, E7 |

## 9.2 Declaración de uso de herramientas de IA (sección 15)

| Herramienta | Uso |
|---|---|
| **OpenAI Codex** | Apoyo en la evolución del núcleo (CP-01 a CP-04), en las pruebas y en la documentación técnica de E6 |
| **Claude (Anthropic)** | Apoyo en la redacción de E1, E2 y E4; generación de los wireframes de baja fidelidad con scripts editables (`wireframes/generar_wireframes_figma.py` y `generar_wireframes_web.py`); reorganización del informe SOLID según el Anexo D; historial de cambios; revisión de los prototipos, medición de contraste y tamaño de controles (capítulos 4 y 6) y redacción de este documento |

Las decisiones de diseño y su justificación son del equipo, y cualquiera de los cuatro integrantes debe poder explicarlas en la defensa. Las personas del E1 se apoyan en fuentes documentadas: los rasgos marcados como hipótesis no provienen de entrevistas. Los hallazgos del capítulo 6 son preliminares; la evaluación independiente de cada integrante se registra con los formularios del Anexo C.

---

# 10. Lista de verificación de entrega (sección 12.2)

Estado al 23 de septiembre de 2026. ✅ completo · ⚠️ existe con un ajuste pendiente · ❌ pendiente.

| # | Requisito | Estado | Evidencia o pendiente |
|---|---|---|---|
| 1 | Personas fundamentadas y journey map con puntos de dolor concretos, incluido el cambio de tramo | ✅ | Capítulo 2; los rasgos no validados están marcados como hipótesis |
| 2 | Tabla pantalla ↔ caso de uso completa y coherente con los puertos del P1 | ✅ | Sección 3.3, con las pantallas del prototipo web |
| 3 | Siete pantallas obligatorias y tres flujos navegables | ⚠️ | Sección 4.4: existen el tablero, el cierre diario y los tres flujos; falta la confirmación de desembolso |
| 4 | Plan de amortización con la cuota 12 de Q1,004.63 explicada | ⚠️ | La nota está en el prototipo web; falta corregir la fila 12 (Anexo B) |
| 5 | Detalle de la mora con el caso M-3 | ❌ | Ambos prototipos usan tasas y base equivocadas; corrección exacta en el Anexo B |
| 6 | Tablero que distingue mora y riesgo con desglose por tramo | ✅ | W01 en el prototipo web; jerarquía en las secciones 3.4.5 y 3.5 |
| 7 | Decisión móvil/web con pérdida de conexión, idempotencia y puerto Reloj | ✅ | Capítulo 5 y ADR-005 |
| 8 | ≥ 8 hallazgos con severidad y ≥ 5 correcciones con antes/después | ⚠️ | 22 hallazgos con evidencia (sección 6.2); faltan las cuatro evaluaciones individuales y las correcciones (Anexo C) |
| 9 | Auditoría de los seis criterios nuevos de WCAG 2.2 y del 3.3.4 | ✅ | Sección 6.3, con mediciones en el prototipo web |
| 10 | Design review: qué se aceptó y qué se rechazó | ❌ | Acta en el Anexo C, a llenar en la Sesión 9 |
| 11 | `npm install && npm test` en limpio, con M-1 a M-5, coexistencia y suite del P1 | ✅ | 263 pruebas en 18 archivos |
| 12 | Informe SOLID con métricas respaldadas por el diff | ✅ | Sección 7.2 |
| 13 | Commit del P1 etiquetado o con su hash en el informe | ✅ | `8737d9b`, etiqueta `entrega-p1` |
| 14 | Enlaces de Figma y del repositorio abren sin pedir permisos | ✅ | Portada y capítulo 4 |
| 15 | Tabla de reparto del trabajo | ✅ | Sección 9.1 |

---

# Anexo A · Wireframes de baja fidelidad

Wireframes anotados de las 14 pantallas del prototipo de Figma (P01–P14) y de las 7 guías (G01–G07). Los skeletons correspondientes están en `docs/proyecto2/wireframes/skeleton/` y en el documento de complementos.

{{WIREFRAMES}}

---

# Anexo B · Instrucciones de corrección para los prototipos de Figma

{{INCLUDE:docs/proyecto2/anexo-b-correcciones-figma.md|B|2}}

---

# Anexo C · Formularios de la evaluación E5

{{INCLUDE:docs/proyecto2/anexo-c-formularios-e5.md|C|2}}
