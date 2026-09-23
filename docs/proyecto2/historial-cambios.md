# Historial de cambios del Proyecto 2

Este documento recorre **todos los commits** hechos después de la entrega del Proyecto 1 y, para cada uno, indica **qué agregó** y **si ya estaba documentado en algún `.md`**. Al final resume qué documentación faltaba y cómo se completó.

- **Base P1:** `8737d9b` (etiqueta `entrega-p1`, 26/08/2026).
- **Estado actual:** rama `docs/proyecto2-ux`, cuatro commits por encima de `main` (`13aa167`).
- **Total desde el P1:** 62 archivos, +4,951 / −108 líneas. De ellas, el último commit de documentación aporta 32 archivos, +2,413 / −232.

> **Sobre los hashes.** Los hashes de los commits 0 a 11 ya están en GitHub y son definitivos. Los commits 12 a 15 existen solo en la rama `docs/proyecto2-ux`; si se aplican con `git am`, Git les asigna un hash nuevo. En ese caso, búsquelos por su mensaje (`git log --oneline -3`).

Comandos para reproducir cualquier fila:

```bash
git log --reverse --format='%h %ad %an %s' --date=short entrega-p1..HEAD
git show --stat <hash>
git show --name-status --format= <hash>
```

## 1. Commits, uno por uno

La columna **"¿Documentado antes en .md?"** indica si el trabajo del commit aparecía en algún `.md` del repositorio **antes** del commit de documentación `16f983f`. Estados posibles:
- **Sí**: ya estaba documentado.
- **Parcial**: se mencionaba, pero con errores o incompleto.
- **No**: no aparecía en ningún `.md`.

| # | Commit | Fecha | Autor (según Git) | Mensaje | Qué agregó o cambió | ¿Documentado antes en .md? |
|---|---|---|---|---|---|---|
| 0 | `71a5179` | 2026-09-21 | Christopher Herrera | docs(p2): registrar auditoria y linea base verificada | **+** `docs/proyecto2/00-auditoria-inicial.md` (70 líneas): línea base P1, 7 archivos de dominio originales, 206 pruebas, creación de `entrega-p1` | **Sí**: es el propio documento (fase 0 en `03-validacion-final.md`) |
| 1 | `ec2a436` | 2026-09-21 | Christopher Herrera | feat(p2): introducir politicas de mora versionadas e inyectables | **+** `politica-mora/` (puerto `PoliticaMora`, plana, escalonada, retroactiva, catálogo y configuración), **+** `clasificacion-tramo.ts`, **+** `tests/politica-mora.test.ts`; **modifica** `calculadora-mora.ts` (+32/−19) | **Sí**: en `01-evolucion-nucleo.md` y en el informe SOLID (agregados en `958e70f`) |
| 2 | `d3b30f5` | 2026-09-21 | Christopher Herrera | feat(p2): generar gasto de cobro idempotente por cuota | **+** `gasto-gestion-cobro.ts` (CP-02, Q25.00 al día 31, una sola vez) y su prueba | **Sí**: en `01-evolucion-nucleo.md` |
| 3 | `5752b55` | 2026-09-21 | Christopher Herrera | feat(p2): corregir liquidacion devengo y cartera por tramo | **+** `devengo-interes.ts` (CP-04.2), **+** `cartera-por-tramo.ts` (CP-04.3), 3 pruebas nuevas; **modifica** `credito-estado.ts` (CP-04.1, `EN_MORA → CANCELADO`), 2 diagramas de estado, `FASE-20` y la matriz de trazabilidad | **Sí** |
| 4 | `0d6c1a9` | 2026-09-21 | ERAMR18 | test(p2): verificar contratos de politicas y regresion integrada | **+** `aplicacion/consultar-mora.ts`, **+** `contrato-politica.test.ts` (Liskov, 3 políticas), **+** `regresion-p1.test.ts`. Es el **corte del núcleo** medido en el informe SOLID | **Sí** |
| 5 | `958e70f` | 2026-09-21 | ERAMR18 | docs(p2): alinear contratos UML ADR y evidencia SOLID | **+** ADR-004, **+** `informe-impacto-solid.md`, **+** `01-evolucion-nucleo.md`, **+** `02-arquitectura-movil-offline.md`, 3 diagramas `.puml` nuevos y 3 modificados, contratos Zod/OpenAPI (`esquemas.ts`, `presentadores-p2.ts`, `openapi.yaml`), README | **Parcial**: el informe SOLID no seguía el Anexo D; `02-arquitectura` no tomaba una decisión y declaraba no tener investigación; `01-evolucion` afirmaba que CP-03 no existía en el enunciado |
| 6 | `8112e57` | 2026-09-21 | ERAMR18 | docs(p2): registrar validacion final desde instalacion limpia | **+** `03-validacion-final.md` (263 pruebas, 18 archivos, typecheck, límites); ajuste del informe SOLID | **Parcial**: repetía el error de CP-03 y decía "sin push, PR ni merge", que dejó de ser cierto con `183dc71` |
| 7 | `5e73d12` | 2026-09-22 | Christopher Herrera | feat: se generan comandos de test | **modifica** `package.json`: 6 scripts nuevos (`test:mora`, `test:idempotencia`, `test:coexistencia`, `test:cp04`, `test:cartera`, `test:invariantes`) | **No** en su momento; lo documentó después `13aa167` en el README |
| 8 | `9e06c37` | 2026-09-22 | Elízabeth | Actualización de pruebas | **+** `docs/proyecto2/04-pruebas-unitarias-mora-escalonada` (922 líneas, **sin extensión `.md`**, por lo que GitHub no lo mostraba con formato); **+** `docs/verificacion-solid-informe-impacto.md` (121 líneas, duplicaba y corregía parte del informe SOLID) | **Parcial**: el contenido existía, pero sin extensión y en un segundo informe SOLID paralelo |
| 9 | `8e421a6` | 2026-09-22 | Elízabeth | Merge branch 'feat/proyecto-2-evolucion-nucleo' … | Merge de la rama remota con la local; solo integra `package.json` (6 líneas del commit 7) | **No**: ningún `.md` mencionaba el merge |
| 10 | `183dc71` | 2026-09-22 | Oliver Romero | Merge pull request #1 … | Integra toda la rama P2 en `main`: 42 archivos, +2,751 / −108 | **No**: `03-validacion-final.md` seguía diciendo "sin PR ni merge" |
| 11 | `13aa167` | 2026-09-22 | Erwin | Actualizacion del README | **modifica** `README.md`: sección "Comandos de pruebas por tema" (tabla de los 6 scripts con pruebas/archivos) y enlace a la documentación de pruebas | **Sí**: documenta el commit 7 |
| 12 | `16f983f` | 2026-09-23 | Oliver Romero (con apoyo de IA, declarado) | docs(p2): documentar E1, E2 y E4 y consolidar el informe SOLID | Ver la sección 2 | Es el commit que completa la documentación |
| 13 | `4ba9e55` | 2026-09-23 | Oliver Romero (con apoyo de IA, declarado) | docs(p2): agregar historial de cambios y documento consolidado | **+** `historial-cambios.md` (este archivo), **+** `documentacion-completa.md` | — |
| 14 | `00709f9` | 2026-09-23 | Oliver Romero (con apoyo de IA, declarado) | docs(p2): documento de entrega con enlace de Figma y revisión del prototipo | **+** `P2-documento-entrega.md`: lista de verificación contra el enunciado, historia del repositorio narrada, revisión del prototipo de Figma y evaluación E5 preliminar; enlace de Figma en el README y en el índice | — |
| 15 | *(este commit)* | 2026-09-23 | Oliver Romero (con apoyo de IA, declarado) | docs(p2): unificar el documento de entrega | `P2-documento-entrega.md` pasa a generarse desde `fuente-documento-entrega.md` e incluye completos E1, E2, E4 y el informe SOLID, más E3, E5, la tabla de commits, el reparto y la lista de verificación | — |

**Registro por fases.** `e6-04-validacion-final.md` registra las fases 0 a 6 (commits 0 a 6). Los commits 7 a 15 solo quedan registrados en esta tabla.

## 2. Qué agregó el commit de documentación `16f983f`

### 2.1 Documentación nueva (no existía en ningún `.md`)

| Entregable | Archivo nuevo | Qué contiene que antes no estaba |
|---|---|---|
| E1 | `e1-investigacion-usuario.md` | 3 personas con la plantilla del Anexo A y la fuente de cada rasgo (enunciado, fuentes documentadas, núcleo o hipótesis). Journey map de 10 etapas + 2 variantes con puntos de dolor concretos y cifras del núcleo. **4 momentos críticos** (MC-1 a MC-4). El cuarto es el **cambio de tramo**: tabla día 15 → 91 (Q1,015.51 → Q1,040.99 al pasar al día 31) y respuesta a "¿antes o después? ¿por qué canal?" |
| E1 | `e1-instrumentos-investigacion.md` | Guías de entrevista (asesor, cliente, gerencia), encuesta de 20 preguntas, observación contextual y plan de análisis. Existían solo en `.docx` |
| E2 | `e2-arquitectura-informacion.md` | Mapa de navegación (Mermaid + SVG). **Tabla 6.1 completa**, con la nota `EvaluarSolicitud` = `EvaluarCredito` + `DecidirSolicitud`. Trazabilidad de las pantallas de apoyo. Justificación de la jerarquía del tablero. Cinco señales visuales que separan cartera en mora de cartera en riesgo. Lugar reservado para el asistente (6.3) |
| E2 | `wireframes/W01…W15.svg`, `mapa-navegacion.svg`, `generar_wireframes.py` | 15 wireframes de baja fidelidad con anotaciones y cifras del núcleo. Por ejemplo, W08 muestra el caso M-3 con la nota de redondeo Q50.80 frente a Q50.81 |
| E4 | `e4-decision-movil-web.md` (reemplaza a `02-arquitectura-movil-offline.md`) | **Decisión firme: PWA única.** Comparación entre nativa, híbrida y PWA; riesgos y condición de revisión (Capacitor). Transformación del tablero entre teléfono y escritorio, y qué se sacrifica. Flujo sin conexión con `Idempotency-Key` (201 / 200 replay / 409). Ejemplo del puerto Reloj: pagar el día 30 y sincronizar el 31 no cobra los Q25. Hallazgo: el TTL de 24 h del OpenAPI es insuficiente |
| Índice | `docs/proyecto2/README.md` | Índice por entregable (E1 a E6) |
| IA | `README.md` §18 | Declaración de uso de IA del Proyecto 2 (sección 15 del enunciado) |

### 2.2 Documentación que se corrigió o reorganizó

| Archivo | Antes | Después |
|---|---|---|
| `docs/informe-impacto-solid.md` | Texto libre; no seguía el Anexo D; datos repartidos en 2 informes | Estructura del **Anexo D** en 6 secciones. Tabla de las **6 métricas** de 8.1 con el `git diff --stat`. Desglose de las 360 líneas netas (la política ocupa 109). Una fila por principio respondiendo la pregunta de 8.2. GRASP. Fricciones con causa y rediseño. Pruebas obligatorias de E6, una por una. Conclusión y "qué haríamos distinto" |
| `docs/verificacion-solid-informe-impacto.md` | Segundo informe SOLID paralelo | **Eliminado**; su contenido (métricas de `src/`, corrección de 13 a 12 atrasos, 288 combinaciones) pasó al informe principal |
| `00…04` de `docs/proyecto2/` | Numeración sin relación con los entregables; `04-…` sin extensión `.md` | Renombrados `e6-01` a `e6-04` (y `.md` agregado); todos los enlaces del repo actualizados |
| `e6-02-evolucion-nucleo.md`, `e6-04-validacion-final.md`, `matriz-trazabilidad.md` | "El enunciado no define CP-03" | **Corregido**: CP-03 es la sección 7.6, "Coexistencia de políticas" (Q21.77 plana frente a Q18.14 escalonada) |
| `e6-04-validacion-final.md` | "Commits locales, sin push, PR ni merge"; pendientes E1/E2/E4 sin actualizar | Refleja el PR #1 (`183dc71`) y la necesidad de publicar `entrega-p1`; pendientes actualizados |
| `README.md` | Enlaces a los nombres viejos | Enlaces a E1, E2, E4, E6 y al índice |

## 3. Lo que sigue sin estar en el repositorio

| Pendiente | Entregable | Responsable |
|---|---|---|
| Entrevistas u observación reales; actualizar los rasgos marcados HIP | E1 | Equipo |
| Prototipo navegable en Figma y su enlace público | E3 | Equipo |
| 8 hallazgos Nielsen, auditoría WCAG 2.2, 5 correcciones con antes/después, design review | E5 | Equipo |
| Portada, carnés, tabla de reparto de trabajo (12.1) y PDF `P2_UXUI_NoDeGrupo.pdf` | E7 | Equipo |
| Publicar las etiquetas: `git push origin entrega-p1` y crear `entrega-p2` | E6 | Quien tenga permisos en el repo |
| Volver a ejecutar `npm run verify` sobre el commit de entrega | E6 | Equipo (no se pudo en la sesión que redactó estos documentos) |
| Alinear los IDs del fixture de `cartera-por-tramo.test.ts` (C-001…) con los del enunciado (C-003…) | E6 | Opcional |
| Ampliar el TTL de la `Idempotency-Key` más allá de 24 h | Proyecto Final | Opcional, anotado en E4 |
