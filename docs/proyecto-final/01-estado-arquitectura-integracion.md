# Fase 1 — Estado previo a arquitectura, contratos e integración

FASE: 1 — Arquitectura objetivo, contratos y plan de integración.

ESTADO HISTÓRICO: BLOQUEADA por prerrequisito de entrada en la primera revisión. No se ha ejecutado el diseño ni la implementación de esta fase.

Actualización tras repetir fase 0: el informe vigente `00-auditoria-linea-base.md` sustituye las condiciones descritas aquí. Este archivo conserva el diagnóstico anterior; no declara ejecutada la fase 1 ni mantiene por sí mismo un bloqueo vigente.

Actualización posterior: la fase 1 se ejecutó tras validar fase 0. Su cierre vigente es `01-arquitectura-contratos-integracion.md`, con 275 pruebas aprobadas. El resto de este documento se conserva únicamente como historial del bloqueo inicial.

## Motivo

`Prompt_Fase_1_Arquitectura_Contratos_Integracion.md` exige: «Revisa el informe y las evidencias de la fase 0 y verifica que se cumplió su criterio de salida antes de comenzar».

La auditoría `00-auditoria-linea-base.md` declara la fase 0 PARCIAL. La revisión del estado actual confirma que continúan sin seguimiento los prompts de fase 0 y 1, los entregables de auditoría y el script independiente. No se ha realizado una integración que cierre los pendientes registrados.

El último estado Git verificado por fase 0 es:

- Rama `feat/proyecto-2-evolucion-nucleo`, con commit local no publicado `833851a`.
- `main` local en `183dc71`, 16 commits detrás de la referencia local `origin/main` en `00192c9`.
- Fetch sin completar por error de confianza del certificado SSL.
- Rama `feat/proyecto-final-asistente-gerencial` pendiente de preparación desde la base integrada.

Además, el paquete auténtico está en `data/`, mientras que el contrato exige `datos/`. La reproducción independiente y las 263 pruebas sí pasaron en fase 0; esos resultados no demuestran que la integración pendiente esté resuelta.

## Cambios realizados

- Lectura del prompt de fase 1 y del cierre de auditoría de fase 0.
- Comprobación del estado de los archivos locales.
- Registro del prerrequisito incumplido y de una ruta concreta de resolución.

## Archivos

- `docs/proyecto-final/01-estado-arquitectura-integracion.md`: este informe de bloqueo; no sustituye los entregables técnicos de fase 1.

## Ruta propuesta para cerrar fase 0

1. Preservar el commit `833851a` y los archivos de trabajo existentes. Revisar su contenido antes de integrar; no asumir que todo pertenece al entregable final.
2. Resolver el certificado de Git sin desactivar la validación TLS y actualizar las referencias remotas.
3. Preparar la rama final desde `main` actualizado y recuperar los insumos útiles del commit local mediante una integración trazable. Mantener intacta la rama de origen como referencia de conservación.
4. Colocar el paquete original y su extracción bajo `datos/`, conservando el contenido y comprobando nuevamente los hashes. Evitar mover o borrar la copia de origen sin resolver primero su seguimiento en Git.
5. Repetir typecheck, pruebas y reproducción en la base integrada. Completar el contraste pendiente contra el núcleo y explicar la diferencia de inventario de vistas.
6. Actualizar el informe de fase 0 con evidencia del resultado antes de iniciar fase 1.

## Pendiente de fase 1

Todos los entregables técnicos siguen pendientes: límites de módulos; contratos de casos de uso; composición del plan con vencimientos; Zod y OpenAPI; modelo persistente; propuesta y confirmación de pago; errores uniformes; `.env.example`; ADR de tecnología y D-1 a D-9; pruebas de semántica idempotente y plan de integración.

## Comandos y resultados

- `git status --short`: prompts y entregables locales sin seguimiento; conservados.
- Lectura de `docs/adr/`: checkout con ADR-001 a ADR-004; incorporar ADR-005 de la historia integrada antes de continuar la numeración desde ADR-006.
- Lectura de `src/contratos/esquemas.ts`: existen esquemas heredados de dinero, errores, fechas e idempotencia; no se modificaron.

## Pruebas

No se ejecutaron nuevas pruebas en esta revisión documental. La fase 0 registra 263 aprobadas y typecheck correcto. No se atribuye ese resultado a una base integrada todavía inexistente.

## Decisiones

Se respeta el prerrequisito explícito del prompt. No se publican ADR definitivos ni contratos de aplicación sobre la rama pendiente de integración.

## Riesgos o bloqueos

La integración del trabajo local necesita una decisión explícita de conservación e incorporación, dado que el maestro ordenó detenerse ante trabajo no integrado. La verificación remota sigue pendiente del certificado. No se ha pedido ni realizado push.

## Git

Sin cambio de rama, commit ni push en esta revisión. El núcleo y las pruebas heredadas permanecen sin modificaciones.
