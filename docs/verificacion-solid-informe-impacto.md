# Verificación de SOLID: informe de impacto

## Resultado de la medición

La evolución CP-01 a CP-04 se absorbió modificando **2 de los 7 archivos originales del dominio (28.57%)** y agregando **10 archivos de dominio**. Los otros 5 archivos originales permanecen intactos. La adaptación del código existente fue de **44 líneas añadidas y 21 eliminadas**; las extensiones nuevas aportaron **337 líneas**. En conjunto, el dominio presenta **381 adiciones, 21 eliminaciones y 360 líneas netas**.

La evidencia respalda una evolución mediante responsabilidades separadas y políticas intercambiables. También muestra que hubo que modificar la calculadora y el State: no fue una extensión sin cambios al núcleo anterior. SOLID se evalúa aquí mediante estructura, dependencias y pruebas; no se asigna un porcentaje artificial de «cumplimiento SOLID».

Este documento verifica y complementa el [informe de impacto original](informe-impacto-solid.md), con comparación de Git y validación del espacio de trabajo actual.

## Base, destino y método

- Base P1: etiqueta `entrega-p1`, commit `8737d9b782772a5cff9acb07de8d719f4f4e3a16`.
- Destino versionado inspeccionado: `8112e57`.
- Corte de implementación del núcleo: `0d6c1a9`; los commits posteriores añaden contratos y documentación sin cambiar las cifras de dominio.
- Unidad: líneas físicas añadidas/eliminadas por Git, incluidos comentarios y líneas vacías. No representa horas de trabajo, complejidad ciclomática ni cobertura instrumentada.
- La medición compara los extremos; no suma cambios intermedios que podrían contarse más de una vez.

Los comandos de pruebas y la documentación creados durante esta sesión son cambios locales adicionales. No forman parte del diff entre los dos commits indicados. No se necesita crear un commit nuevo para consultar la evidencia histórica.

## Cuánto hubo que modificar para absorber los requisitos

| Archivo en `src/dominio/` | Situación | Añadidas | Eliminadas | Motivo |
|---|---|---:|---:|---|
| `calculadora-mora.ts` | Existente modificado | 32 | 19 | Introducir política inyectada, delegación, validación del resultado y conservar fachada P1. |
| `credito-estado.ts` | Existente modificado | 12 | 2 | Permitir liquidación desde EN_MORA con saldo cero, sin cuotas vencidas pendientes y con evidencia. |
| `cartera-por-tramo.ts` | Nuevo | 99 | 0 | Desglose de riesgo, cartera en mora y bajas del período. |
| `clasificacion-tramo.ts` | Nuevo | 13 | 0 | Separar clasificación derivada del cálculo de intereses. |
| `devengo-interes.ts` | Nuevo | 57 | 0 | Reconocimiento, suspenso y regularización de interés corriente. |
| `gasto-gestion-cobro.ts` | Nuevo | 45 | 0 | Gasto único por crédito/cuota/concepto y proyección a saldos. |
| `politica-mora/catalogo-politicas.ts` | Nuevo | 10 | 0 | Selección por fecha de otorgamiento. |
| `politica-mora/configuracion-politica.ts` | Nuevo | 22 | 0 | Versiones, tasas, límites y vigencia explícitos. |
| `politica-mora/politica-escalonada.ts` | Nuevo | 17 | 0 | Cálculo acumulado por tramos. |
| `politica-mora/politica-mora.ts` | Nuevo | 38 | 0 | Contrato y operaciones comunes de precisión/tope. |
| `politica-mora/politica-plana.ts` | Nuevo | 18 | 0 | Estrategia histórica de tasa plana. |
| `politica-mora/politica-retroactiva.ts` | Nuevo | 18 | 0 | Doble de comparación para pruebas; no seleccionable por el catálogo. |
| **Total dominio** | **2 modificados y 10 nuevos** | **381** | **21** | **360 netas; 402 líneas de cambio (adiciones + eliminaciones).** |

Los 5 archivos conservados son `dinero.ts`, `plan-amortizacion.ts`, `cartera.ts`, `pago-idempotente.ts` y `prelacion-pago.ts`. El 28.57% mide archivos originales tocados, no porcentaje de líneas originales reescritas.

| Alcance adicional dentro de `src/` | Añadidas | Eliminadas |
|---|---:|---:|
| `aplicacion/consultar-mora.ts`, nuevo | 27 | 0 |
| `contratos/esquemas.ts`, modificado | 33 | 0 |
| `contratos/presentadores-p2.ts`, nuevo | 32 | 0 |
| **Total `src/`, incluyendo dominio** | **473** | **21** |

En todo `src/` son **12 archivos nuevos y 3 existentes modificados**, con **452 líneas netas**. Pruebas, diagramas, documentación y scripts quedan fuera de estas cifras.

## Verificación por principio SOLID

| Principio | Evidencia verificable | Resultado y límite |
|---|---|---|
| **S: responsabilidad única** | `DevengoInteres` administra movimientos y suspenso; `Credito` administra transiciones; gasto y cartera tienen módulos propios. Pruebas separadas por responsabilidad. | Separación respaldada en P2. La calculadora histórica todavía contiene tipos de fecha y tasa; no se afirma separación completa de toda la base. |
| **O: abierto a extensión** | `CalculadoraMora.calcular` delega en `PoliticaMora`; plana y escalonada comparten motor. | El punto de extensión existe después de la adaptación de +32/−19 líneas. Una política nueva compatible no exige cambiar ese método, pero incorporarla a la selección productiva puede requerir catálogo/configuración. State también requirió +12/−2. |
| **L: sustitución** | `contrato-politica.test.ts` ejecuta plana, escalonada y retroactiva con entradas comunes y verifica tipo monetario, moneda, no negatividad, tope, determinismo e inmutabilidad. El motor rechaza salidas incompatibles. | Sustituibilidad comprobada para los casos ensayados; no significa que las políticas produzcan el mismo importe. La fachada estática P1 queda fuera del nuevo contrato de estrategias. |
| **I: segregación de interfaces** | `PoliticaMora` expone identificador y `calcular(capital, dias)`; no obliga a persistir ni modificar créditos. | Interfaz específica para cálculo. La interfaz State histórica continúa siendo amplia; no se presenta como rediseñada. |
| **D: inversión de dependencias** | El motor recibe `PoliticaMora`; `resolverPolitica` construye implementaciones y `consultarMora` las compone. Los presentadores consumen resultados del dominio. | Selección fuera del motor y dependencia hacia la abstracción. Subsisten referencias a tipos de la calculadora y reutilización de su validador de tasa en la plana. |

Fuentes: [calculadora](../src/dominio/calculadora-mora.ts), [contrato de política](../src/dominio/politica-mora/politica-mora.ts), [catálogo](../src/dominio/politica-mora/catalogo-politicas.ts), [aplicación](../src/aplicacion/consultar-mora.ts) y [contrato probado](../tests/contrato-politica.test.ts).

## Medición de pruebas y conservación del comportamiento

| Medida | Resultado |
|---|---|
| Archivos de pruebas originales modificados entre base y destino | **0**; el diff filtrado por modificaciones está vacío. |
| Archivos de pruebas añadidos | **8**. |
| Base histórica documentada | **206 pruebas en 10 archivos**, según la validación P1/P2 previa. No se volvió a ejecutar aquí un checkout de P1. |
| Suite actual | **263 pruebas en 18 archivos**; incremento de **57 pruebas** sobre la base documentada. |
| Matriz de sustitución de políticas | 3 políticas × 2 monedas × 4 capitales × **12 atrasos** = **288 combinaciones**; cada una se calcula dos veces para comparar determinismo. |

**Corrección del informe anterior:** la lista de atrasos contiene `0, 1, 30, 31, 60, 61, 90, 91, 120, 121, 150, 100000`: son 12, no 13. Las 288 combinaciones son iteraciones dentro de pruebas; no equivalen a 288 tests independientes.

Las verificaciones relevantes incluyen coexistencia de plana/escalonada (GTQ7.26 frente a GTQ5.44 a 15 días), redondeo único por cuota (GTQ50.80 a 100 días), gasto único de GTQ25, cancelación, suspenso y cartera. Los inputs, outputs y criterios están en la [documentación de pruebas](proyecto2/04-pruebas-unitarias-mora-escalonada.md).

La conservación de archivos de prueba y su ejecución satisfactoria respaldan la regresión de los casos existentes. No demuestran cobertura total ni permiten reconstruir todos los fallos ocurridos durante el desarrollo; los incidentes históricos relatados en el informe anterior se mantienen como antecedentes, no como una nueva medición.

## Commits para inspeccionar los cambios

| Commit existente | Aporte a la evolución |
|---|---|
| `8737d9b` | Base `entrega-p1`. |
| `71a5179` | Auditoría y línea base documentada. |
| `ec2a436` | Políticas versionadas e inyectables; adaptación de la calculadora. |
| `d3b30f5` | Gasto de cobro idempotente por cuota. |
| `5752b55` | Liquidación, devengo y cartera por tramo; adaptación de State. |
| `0d6c1a9` | Contrato de estrategias, aplicación y regresión integrada. |
| `958e70f` | Contratos, UML, ADR y evidencia SOLID. |
| `8112e57` | Registro de validación final desde instalación limpia. |

Para inspeccionar un commit y los dos archivos originales que cambiaron:

```sh
git show --stat ec2a436
git show ec2a436 -- src/dominio/calculadora-mora.ts
git show 5752b55 -- src/dominio/credito-estado.ts
```

Para reproducir las mediciones con un destino fijo, sin incluir modificaciones locales:

```sh
git diff entrega-p1 8112e57 --name-status -- src/dominio
git diff entrega-p1 8112e57 --numstat -- src/dominio
git diff entrega-p1 8112e57 --numstat -- src
git diff entrega-p1 8112e57 --name-status -- tests
git diff entrega-p1 8112e57 --diff-filter=M -- tests
```

Para validar el espacio de trabajo actual:

```sh
npm run verify
```

En PowerShell se puede usar `npm.cmd run verify`. Este comando ejecuta TypeScript sin emitir archivos y la suite completa. Los comandos `npm run test:coexistencia`, `npm run test:invariantes` y `npm run test:cp04` permiten revisiones por tema; no sustituyen una medición estática formal de SOLID.

**Resultado observado durante esta verificación:** `npm.cmd run verify` finalizó con código 0; `tsc --noEmit` aprobó y Vitest 4.1.11 reportó **263 pruebas aprobadas en 18 archivos**. Se utilizaron las dependencias instaladas; no se realizó una nueva instalación limpia.

## Límites y trabajo pendiente

La medición muestra un cambio localizado en el núcleo anterior y extensiones separadas para las nuevas responsabilidades. No mide esfuerzo humano ni demuestra que el diseño sea óptimo. Permanecen la fachada histórica sin las garantías P2, la coordinación entre State y devengo a cargo de la aplicación y la conservación de registros de idempotencia a cargo del llamador. Persistencia atómica, concurrencia y recuperación ante fallos no están acreditadas por las pruebas en memoria.
