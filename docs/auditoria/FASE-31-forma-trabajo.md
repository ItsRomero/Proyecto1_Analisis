# Fase 31 — Forma de trabajo y cierre secuencial

## 1. Objetivo

Formalizar el metodo secuencial utilizado en el proyecto, verificar que cada decision pueda recorrer la cadena `Requisito → Diseño → Codigo → Prueba → Documento` y establecer una puerta de autorizacion que impida avanzar de fase sin solicitud expresa.

Esta fase no agrega capacidades al dominio. Su resultado es un protocolo de trabajo y una auditoria de cierre basada en evidencia, no unicamente en que el proyecto compile.

## 2. Requisitos cubiertos

- Trabajo fase por fase, sin desarrollar todo de una sola vez.
- Ocho actividades obligatorias para cada fase.
- Detencion al cerrar una fase y espera de autorizacion.
- Mantenimiento de trazabilidad multidireccional.
- Verificacion de los doce criterios finales del prompt.
- Distincion entre implementado, diseñado, validado y pendiente.

## 3. Archivos de esta fase

| Archivo | Accion | Proposito |
|---|---|---|
| `docs/auditoria/FASE-31-forma-trabajo.md` | Creado | Protocolo secuencial y criterio de cierre. |
| `docs/trazabilidad/matriz-trazabilidad.md` | Actualizado | Registrar DOC-31 y el cierre metodologico. |

## 4. Protocolo obligatorio por fase

Cada fase debe seguir este orden:

### Paso 1 — Indicar objetivo

Definir el resultado concreto de la fase y su limite. El objetivo debe impedir que se adelanten piezas reservadas para fases posteriores.

### Paso 2 — Indicar requisitos cubiertos

Enumerar requisitos, reglas, invariantes, casos de aceptacion o restricciones afectados. Cuando una fase sea documental, identificar los criterios del prompt que satisface.

### Paso 3 — Indicar archivos creados o modificados

Declarar los artefactos previstos y su responsabilidad. Antes de modificar, revisar la estructura existente para evitar duplicados y contradicciones.

### Paso 4 — Desarrollar la solucion

Crear unicamente los artefactos autorizados para la fase. Preservar decisiones anteriores y actualizar los consumidores afectados cuando exista un cambio legitimo.

### Paso 5 — Explicar las decisiones

Documentar motivo, alternativas relevantes, consecuencias, limites y trade-offs. Las decisiones arquitectonicas duraderas se registran ademas como ADR.

### Paso 6 — Validar contra el enunciado

Contrastar el resultado punto por punto con la seccion correspondiente del prompt. Una busqueda textual no sustituye la validacion semantica.

### Paso 7 — Mostrar resultado esperado

Informar requisitos satisfechos, archivos, pruebas o validaciones y decisiones pendientes. No ocultar limites externos ni presentar diseño futuro como implementacion.

### Paso 8 — Detenerse

Cerrar con `FASE X COMPLETADA` y esperar una nueva solicitud del usuario. La siguiente fase requiere autorizacion explicita.

## 5. Puerta de autorizacion

La transicion entre fases se rige por este estado:

```text
SOLICITADA
   ↓
EN_DESARROLLO
   ↓
VALIDADA
   ↓
COMPLETADA ──→ ESPERA_DE_AUTORIZACION
                         ↓
                 siguiente solicitud
```

Reglas:

1. solo una fase puede estar en desarrollo;
2. una fase validada no autoriza automaticamente la siguiente;
3. una correccion pertenece a la fase activa salvo que cambie materialmente el alcance;
4. una tarea externa pendiente se registra y no se declara cumplida;
5. la autorizacion para una fase no autoriza publicacion, despliegue u otras acciones externas no solicitadas.

## 6. Evidencia de ejecucion secuencial

La seccion 2.3 de `docs/trazabilidad/matriz-trazabilidad.md` conserva un registro continuo `DOC-01` a `DOC-31`. Las fases se desarrollaron por grupos conceptuales consecutivos:

| Secuencia | Resultado |
|---|---|
| 1–5 | Requisitos, dinero conceptual, reglas, UML y matriz base. |
| 6–9 | Arquitectura Hexagonal/Monolito Modular, ISO/IEC 25010, 4+1 y C4. |
| 10–14 | Diseño modular, SOLID, GRASP, patrones y acoplamiento/cohesion. |
| 15–22 | Configuracion y walking skeleton financiero ejecutable. |
| 23–25 | Contratos API, idempotencia y ADR. |
| 26–28 | Repositorio, README profesional y documento consolidado. |
| 29–31 | Auditoria de rubrica, penalizaciones y forma de trabajo. |

Cada avance fue solicitado por el usuario de forma separada. El repositorio no contiene implementacion de infraestructura futura adelantada dentro de E4.

## 7. Matriz interna obligatoria

### 7.1 Cadena de trazabilidad

| Eslabon | Pregunta | Evidencia principal |
|---|---|---|
| Requisito | ¿Que necesidad o restriccion se satisface? | RF, RNF, RN, INV, POL y CA. |
| Diseño | ¿Como se representa y que decision se adopta? | UML, arquitectura, C4, 4+1, SOLID, GRASP y patrones. |
| Codigo | ¿Donde se materializa dentro del alcance? | `src/dominio`, `src/aplicacion`, `src/contratos`. |
| Prueba | ¿Que evidencia ejecutable demuestra el comportamiento? | `tests/*.test.ts` y `npm run verify`. |
| Documento | ¿Donde se explica y audita? | DOC-01–DOC-31 y ADR. |

### 7.2 Ejemplos completos

| Requisito | Diseño | Codigo | Prueba | Documento |
|---|---|---|---|---|
| RF-06 / INV-01–02 | Factory y plan frances | `plan-amortizacion.ts` | `plan-amortizacion.test.ts`, `invariantes.test.ts` | DOC-03, DOC-17, ADR-003 |
| RF-07–09 / INV-12–13 | Chain + Strategy | `prelacion-pago.ts` | `prelacion-pago.test.ts` | DOC-13, DOC-19 |
| RF-10 / INV-08 | Repository e identidad idempotente | `pago-idempotente.ts`, `registrar-pago.ts` | `pago-idempotencia.test.ts` | DOC-24 |
| RF-13 / INV-11 | Servicio de mora puro | `calculadora-mora.ts` | `calculadora-mora.test.ts` | DOC-18 |
| RF-15–17 / INV-16 | State | `credito-estado.ts` | `credito-estado.test.ts` | DOC-20 |
| RF-18–19 / INV-06 | Servicio de cartera | `cartera.ts` | `cartera.test.ts` | DOC-21 |
| RNF-01 / RN-04 | Value Object `Dinero` | `dinero.ts` | `dinero.test.ts` | DOC-02, DOC-16, ADR-002 |
| RNF-12 | Contratos independientes | `esquemas.ts`, `openapi.yaml` | `contratos-api.test.ts`, `openapi.test.ts` | DOC-23 |

### 7.3 Estados permitidos

| Estado | Significado |
|---|---|
| Diseñado | Existe decision y modelo, pero no codigo ejecutable. |
| Implementado | Existe codigo dentro del alcance, pendiente de evidencia completa si se indica. |
| Implementado/verificado | Codigo y pruebas reproducen el comportamiento esperado. |
| Pendiente | Falta una decision, dato, modulo o accion externa. |
| Fuera de alcance | Se reconoce, pero no corresponde a P1. |

Estos estados impiden que la matriz confunda la cobertura documental con una implementacion terminada.

## 8. Control de cambios entre artefactos

Ante un cambio de requisito se debe recorrer esta secuencia:

1. actualizar el requisito y sus reglas/invariantes;
2. revisar UML y decisiones arquitectonicas;
3. revisar interfaces y patrones afectados;
4. modificar codigo solo si pertenece al alcance autorizado;
5. crear o ajustar pruebas antes de declarar cumplimiento;
6. actualizar OpenAPI/Zod si cambia el limite externo;
7. actualizar matriz, documento consolidado y ADR cuando corresponda;
8. ejecutar la verificacion integral.

No se permite corregir unicamente el codigo dejando documentacion o contratos contradictorios.

## 9. Criterio final de terminacion

| # | Criterio | Evidencia | Estado |
|---:|---|---|---|
| 1 | UML representa el dominio | Cinco tipos UML, siete fuentes y DOC-04 | Cumplido |
| 2 | Arquitectura justificada | DOC-06, DOC-07 y ADR-001 | Cumplido |
| 3 | E1, E2, E3 y E4 consistentes | Correspondencias en DOC-10–14, DOC-22 y DOC-29 | Cumplido |
| 4 | Casos financieros exactos | CA-01–CA-07 y pruebas | Cumplido |
| 5 | Invariantes tienen pruebas | Suite transversal; pendientes futuros diferenciados | Cumplido para P1 |
| 6 | Transiciones invalidas imposibles | State, guardas y pruebas sin efecto | Cumplido |
| 7 | OpenAPI refleja el dominio | OpenAPI/Zod y pruebas contractuales | Cumplido |
| 8 | ADR explica decisiones reales | Tres ADR aceptados | Cumplido |
| 9 | Diagramas editables | 18 archivos PlantUML | Cumplido |
| 10 | Instalacion y pruebas reproducibles | lockfile, ejecucion aislada de fase 22 y `npm run verify` | Cumplido localmente |
| 11 | Documentacion requerida presente | README, documento final, auditorias y matriz | Cumplido; faltan datos externos |
| 12 | Preparado para P2/Final sin reescribir nucleo | Puertos y adaptadores futuros en Hexagonal/C4 | Cumplido por diseño |

Compilar es solo una evidencia del criterio 10; no sustituye los otros once criterios.

## 10. Decisiones y pendientes

### Decisiones consolidadas

- La matriz de trazabilidad es la fuente de control entre artefactos.
- `npm run verify` es la puerta tecnica minima de cada cambio de codigo o contrato.
- Los estados de implementacion se conservan explicitos.
- Una fase termina al validar y reportar, no al comenzar la siguiente.

### Pendientes externos

- completar nombre, carne, seccion, grupo e informacion institucional;
- publicar el repositorio y verificar su URL desde el contexto del evaluador;
- insertar diagramas vectoriales y exportar el PDF final.

Ninguno de estos pendientes autoriza inventar datos ni publicar sin instruccion del usuario.

## 11. Validacion contra el enunciado

| Exigencia | Evidencia | Estado |
|---|---|---|
| Trabajo secuencial | Registro DOC-01–DOC-31 y solicitudes separadas | Cumplido |
| Ocho pasos por fase | Seccion 4 | Cumplido |
| Detenerse tras cada fase | Puerta de seccion 5 | Cumplido |
| Esperar autorizacion | Estado `ESPERA_DE_AUTORIZACION` | Cumplido |
| Matriz requisito a documento | Seccion 7 y matriz principal | Cumplido |
| Evitar inconsistencias | Control de cambios de seccion 8 | Cumplido |
| No considerar compilacion como cierre | Doce criterios de seccion 9 | Cumplido |

## 12. Resultado esperado

El proyecto queda gobernado por un proceso explicito, reproducible y auditable. Cada cambio futuro puede localizar su requisito, diseño, implementacion, prueba y documento; cualquier ausencia queda visible como pendiente. Al cerrar esta fase se debe detener el trabajo y esperar una nueva autorizacion.
