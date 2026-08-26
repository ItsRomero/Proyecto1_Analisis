# Fase 15 — Configuracion TypeScript

## 1. Objetivo y alcance

Preparar un entorno reproducible para implementar y probar exclusivamente el nucleo de dominio con Node.js 20 o superior, TypeScript estricto y Vitest.

Esta fase configura herramientas y dependencias. No implementa todavia `Dinero` ni otros componentes financieros.

## 2. Archivos creados

| Archivo | Proposito |
|---|---|
| `package.json` | Metadatos, motor, scripts y dependencias. |
| `package-lock.json` | Versiones transitivas exactas para instalaciones reproducibles. |
| `tsconfig.json` | Compilacion TypeScript estricta y sin emision. |
| `vitest.config.ts` | Entorno Node y descubrimiento de pruebas. |
| `.gitignore` | Excluye dependencias, cache, cobertura, compilados, logs y secretos. |

## 3. Entorno validado

| Componente | Version validada |
|---|---:|
| Node.js | 22.13.0 |
| npm | 10.9.2 |
| TypeScript | 5.9.3 |
| Vitest | 4.1.11 |
| decimal.js | 10.6.0 |
| date-fns | 4.4.0 |
| Zod | 4.4.3 |
| @types/node | 22.20.1 |

Node.js 22.13.0 satisface `engines.node >=20.0.0`.

## 4. Decisiones de modulos y ejecucion

| Decision | Configuracion | Justificacion |
|---|---|---|
| ECMAScript Modules | `"type": "module"` | Ecosistema moderno y compatibilidad con Vitest/Vite. |
| Resolucion Node | `module/moduleResolution: NodeNext` | TypeScript sigue semantica real de ESM en Node. |
| Nivel de lenguaje | `target/lib: ES2022` | Compatible con Node 20+ sin transpilar caracteristicas antiguas. |
| Sin emision | `noEmit: true` | P1 ejecuta tests sobre TypeScript; `tsc` valida tipos. |
| Archivos incluidos | `src/**/*.ts`, `tests/**/*.ts`, config Vitest | Evita revisar dependencias/artefactos. |
| Entorno de pruebas | `node` | No existe DOM ni frontend en P1. |
| Sin tests temporal | `passWithNoTests: true` | Permite validar Fase 15; desde Fase 16 habra tests reales. |

## 5. Tipado estricto

Ademas de `strict: true`, se activaron controles explicitos:

| Opcion | Riesgo mitigado |
|---|---|
| `noImplicitAny` | Uso accidental de `any`. |
| `strictNullChecks` | Nulos/undefined no tratados. |
| `strictFunctionTypes` | Sustituciones inseguras de funciones. |
| `strictBindCallApply` | Invocacion con argumentos incompatibles. |
| `strictPropertyInitialization` | Entidades parcialmente inicializadas. |
| `useUnknownInCatchVariables` | Errores tratados como `any`. |
| `noUncheckedIndexedAccess` | indices asumidos como existentes. |
| `exactOptionalPropertyTypes` | Confusion entre ausencia y `undefined`. |
| `noImplicitOverride` | Overrides accidentales. |
| `noFallthroughCasesInSwitch` | Caidas involuntarias entre casos. |
| `noPropertyAccessFromIndexSignature` | Acceso no verificado a mapas. |
| `forceConsistentCasingInFileNames` | Fallos entre sistemas de archivos. |
| `verbatimModuleSyntax` | Imports ESM explicitos/coherentes. |
| `isolatedModules` | Archivos compilables de forma segura por herramientas. |

No se usara `any` para evadir tipado en el nucleo. Entradas desconocidas deberan validarse o estrecharse desde `unknown`.

## 6. Dependencias

### 6.1 Produccion/nucleo

| Dependencia | Uso autorizado | Uso prohibido |
|---|---|---|
| `decimal.js` | Importe, tasa y precision intermedia encapsulados | Aceptar `number` como importe publico. |
| `date-fns` | Fechas civiles/diferencias deterministas | Leer fecha actual dentro de calculos. |
| `zod` | Contratos/esquemas futuros en el borde | Implementar reglas financieras. |

### 6.2 Desarrollo

| Dependencia | Uso |
|---|---|
| `typescript` | Comprobacion estatica estricta. |
| `vitest` | Pruebas unitarias/de invariantes. |
| `@types/node` | Tipos del entorno Node, principalmente configuracion/composicion. |

No se instalaron Express, Fastify, PostgreSQL, ORM, frontend, RAG o MCP.

## 7. Scripts

| Comando | Resultado |
|---|---|
| `npm run typecheck` | Ejecuta `tsc --noEmit`. |
| `npm test` | Ejecuta pruebas una vez mediante Vitest. |
| `npm run test:watch` | Ejecuta Vitest interactivo durante desarrollo. |
| `npm run verify` | Ejecuta typecheck y tests en secuencia. |

El comando minimo exigido permanece:

```bash
npm install
npm test
```

## 8. Reproducibilidad y seguridad de instalacion

`package-lock.json` registra versiones exactas. En validaciones limpias se preferira:

```bash
npm ci
npm run verify
```

La red local presento una cadena TLS no reconocida por npm durante esta sesion. La instalacion autorizada se ejecuto una sola vez con validacion TLS deshabilitada unicamente para ese comando. No se modifico la configuracion global: `npm config get strict-ssl` continua devolviendo `true`.

El cache local `.npm-cache/` esta ignorado y no es parte del entregable.

## 9. Correspondencia con arquitectura y calidad

| Decision previa | Evidencia de configuracion |
|---|---|
| RNF-01 Exactitud | `decimal.js` instalado. |
| RNF-10 Testabilidad | Vitest y entorno Node sin servicios. |
| RNF-14 Portabilidad | Motor Node >=20 y lockfile. |
| RNF-15 Tipado | `strict` y verificaciones adicionales. |
| RNF-16 Independencia | No hay frameworks de servidor/BD/UI. |
| ARQ-11 | Tests pueden ejecutar sin servidor ni BD. |
| Q-MA-03 | `noImplicitAny` y strict. |
| Q-MA-04 | `npm run verify` sin servicios externos. |
| VD-06 | No existen dependencias HTTP/ORM. |
| CA-R10 | Dependencias externas limitadas a las autorizadas. |

## 10. Validaciones realizadas

| Validacion | Resultado |
|---|---|
| `npm install` | Correcto; 50 paquetes instalados. |
| Auditoria npm de instalacion | 0 vulnerabilidades reportadas. |
| `npm run typecheck` | Correcto. |
| `npm test` | Correcto; todavia no existen tests por orden de fases. |
| `npm run verify` | Correcto. |
| `strict: true` | Confirmado. |
| Dependencias prohibidas | Ninguna instalada. |
| Configuracion TLS global | Permanece `true`. |

## 11. Trazabilidad incremental

| Requisito | Diseño/configuracion | Codigo/prueba futura | Estado |
|---|---|---|---|
| RNF-01 | decimal.js exacto | `dinero.ts`/pruebas Dinero | Configurado |
| RNF-02 | date-fns + Reloj diseñado | calculos temporales | Dependencia configurada |
| RNF-10 | Vitest/Node | todas las suites | Configurado |
| RNF-14 | Node >=20, npm/lockfile | instalacion limpia | Verificado localmente |
| RNF-15 | TypeScript estricto | nucleo sin `any` | Configurado/verificado |
| RNF-16 | Sin infraestructura | auditoria final | Verificado en dependencias |
| E4 | Rutas `src/tests` incluidas | Fases 16–22 | Preparado |

## 12. Decisiones adoptadas

| ID | Decision | Consecuencia |
|---|---|---|
| D15-01 | ESM con NodeNext. | Imports reflejan ejecucion Node moderna. |
| D15-02 | TypeScript 5 estricto con banderas adicionales. | Errores de tipos se detectan antes de ejecutar. |
| D15-03 | Vitest 4 en entorno Node. | Pruebas rapidas sin navegador/servidor. |
| D15-04 | Dependencias de dominio explicitas desde configuracion. | Fases posteriores no cambian stack. |
| D15-05 | Lockfile versionable. | Instalaciones reproducibles. |
| D15-06 | `passWithNoTests` solo permite validar la configuracion inicial. | La suite real comenzara en Fase 16. |
| D15-07 | No añadir linter/import checker todavia. | Se evita herramienta no obligatoria; reglas se revisaran con estructura/tests. |

## 13. Decisiones pendientes

| ID | Punto | Resolucion prevista |
|---|---|---|
| DP-04 | Precision interna de Decimal | Fase 16, con pruebas de redondeo/casos. |
| DP-28 | Archivos adicionales State/politicas/cierres | Fases 16–22 segun implementacion. |
| DP-29 | Resultados/errores concretos | Al implementar primeros VO/casos. |
| DP-18 | Herramienta de imports/ciclos | Reevaluar al crecer E4; no necesaria aun. |

## 14. Validacion contra el enunciado

| Criterio | Estado |
|---|---|
| Node.js 20 LTS o superior | Cumplido con Node 22.13.0 |
| TypeScript | Instalado/configurado |
| `strict: true` | Cumplido |
| Vitest | Instalado/configurado |
| Zod | Instalado |
| decimal.js | Instalado |
| date-fns | Instalado |
| Sin `any` evasivo | Configuracion preparada; se auditara con codigo |
| `npm install` | Cumplido |
| `npm test` sin servicios | Cumplido |
| Sin servidor/BD/ORM/frontend | Cumplido |

## 15. Resultado esperado

El proyecto dispone de una base reproducible y estricta para comenzar E4. La siguiente fase puede implementar `Dinero` con decimal.js y pruebas Vitest sin cambiar stack, añadir servicios externos ni relajar el tipado.
