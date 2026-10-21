# Prompt de ejecución — Fase 0

Este prompt corresponde a la fase 0 de `Prompt_Maestro_Proyecto_Final_Por_Fases_v2.md`. Antes de ejecutarlo, lee ese documento y aplica sus reglas globales, el contrato canónico, las reglas R-1 a R-7 y las decisiones D-1 a D-9. Ejecuta únicamente esta fase y utiliza el formato de informe de la sección 3 del documento maestro. No avances automáticamente a la fase 1.

# PROMPT 0 - Auditoría, sincronización y línea base

Actúa como arquitecto y analista senior. No implementes todavía funcionalidades del Proyecto Final.

## Objetivo

Preparar una línea base verificable de P1 y P2, confirmar la situación de Git y producir el plan de integración final.

## Acciones obligatorias

1. Inspecciona el repositorio, remotos, ramas, etiquetas, commits, archivos sin seguimiento y divergencias.
2. Confirma que `main` = `origin/main` (esperado `00192c9` o posterior) y que contiene los merges `183dc71` (PR #1) y `00192c9` (PR #2). Si existe trabajo local no publicado en cualquier rama, consérvalo y repórtalo.
3. Verifica la etiqueta `entrega-p1` en `8737d9b`; no la muevas.
4. Crea la rama `feat/proyecto-final-asistente-gerencial` desde `main`.
5. Ejecuta instalación limpia (`npm ci`), `npm run typecheck`, `npm test` y `npm run verify`.
6. Confirma o refuta la línea base esperada de 18 archivos y 263 pruebas.
7. Audita la estructura actual contra P1, P2 y el Anexo C del Proyecto Final.
8. Revisa contratos Zod, OpenAPI, puertos del dominio, adaptadores, política de mora, idempotencia y cartera por tramo. Confirma con evidencia de código los puntos del "Estado técnico verificado": constantes de política, gasto sin condición de política, guarda de incobrable, fachada estática de mora y ausencia de cierres.
9. Localiza las siete pantallas y los tres flujos del P2 en la documentación y en `vistas/`. No copies las cifras visuales como datos válidos.
10. Verifica la exportación visual en `vistas/` y contrasta su inventario contra `vistas/docs/README.md`, `verification.json`, `screens.json` y `navigation.json`. Confirma o refuta los 55 frames y las 139 conexiones.
11. Verifica el paquete en `datos/datos-proyecto-final.zip` y su extracción en `datos/datos-proyecto-final/`. Calcula los SHA-256 y configura `CV_DATA_DIR`.
12. Reproduce con un script de auditoría (fuera de `src/`, por ejemplo `scripts/auditoria/`) las reglas R-1 a R-7 y la tabla de situación al corte. Si algo no coincide, documéntalo antes de seguir.
13. Identifica brechas de P2 que no deben propagarse: cifras incorrectas en prototipos, falta de confirmación/desembolso al final de originación, ausencia de cierre mensual, correcciones heurísticas sin evidencia, inconsistencias del README.
14. Clasifica cada requisito como `CUMPLE`, `PARCIAL`, `NO CUMPLE` o `NO VERIFICABLE`, citando evidencia concreta.

## Entregables de esta fase

- `docs/proyecto-final/00-auditoria-linea-base.md`.
- Matriz P1/P2/Final con columnas: requisito, evidencia, archivo/commit, estado y brecha.
- Diagrama breve de arquitectura actual y objetivo.
- Resultado de la reproducción R-1 a R-7.
- Lista de bloqueos reales y de las decisiones D-1 a D-9 pendientes de ADR.
- Rama `feat/proyecto-final-asistente-gerencial`.

## Criterio de salida

No avances hasta demostrar que el núcleo heredado pasa sus pruebas, que ningún trabajo local se perderá y que las reglas R-1 a R-7 están confirmadas o sus diferencias explicadas.

---
