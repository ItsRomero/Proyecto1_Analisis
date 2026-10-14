# Informe de impacto SOLID · Proyecto 2 (E6)

Crédito Vecino, S. A. · Análisis de Sistemas II (037)

Este informe sigue la plantilla del **Anexo D** del enunciado. Mide cuánto hubo que modificar el núcleo del Proyecto 1 para absorber los cambios CP-01 a CP-04 de la sección 7 y responde, con evidencia del repositorio, a las preguntas de la sección 8.2. Todas las cifras de esta sección se pueden reproducir con los comandos incluidos.

> Este documento sustituye al antiguo `docs/verificacion-solid-informe-impacto.md`, que duplicaba parte de este informe; su contenido quedó integrado aquí.

## 1. Punto de partida

| Hito | Referencia | Cómo reproducirlo |
|---|---|---|
| Entrega del Proyecto 1 | Etiqueta **`entrega-p1`** → commit `8737d9b782772a5cff9acb07de8d719f4f4e3a16` (26/08/2026) | `git show --stat entrega-p1` |
| Núcleo evolucionado (fases 1–4) | Commit `0d6c1a9` | Los commits posteriores solo agregan contratos, documentación y scripts; no cambian `src/dominio` |
| Entrega del Proyecto 2 | Etiqueta **`entrega-p2`**, que se crea sobre el commit final de la entrega | `git tag entrega-p2 && git push origin entrega-p1 entrega-p2` |

La historia no se reescribió: los cambios del P2 están en commits separados por fase (sección 4.2) y se integraron a `main` con el PR #1.

**Unidad de medida.** Líneas físicas que Git suma o elimina, incluidos comentarios y líneas vacías. No mide esfuerzo, complejidad ni cobertura.

## 2. Métricas del cambio (sección 8.1)

```text
$ git diff --stat entrega-p1 0d6c1a9 -- src/dominio
 src/dominio/calculadora-mora.ts                    | 51 ++++++-----
 src/dominio/cartera-por-tramo.ts                   | 99 ++++++++++++++++++++++
 src/dominio/clasificacion-tramo.ts                 | 13 +++
 src/dominio/credito-estado.ts                      | 14 ++-
 src/dominio/devengo-interes.ts                     | 57 +++++++++++++
 src/dominio/gasto-gestion-cobro.ts                 | 45 ++++++++++
 src/dominio/politica-mora/catalogo-politicas.ts    | 10 +++
 .../politica-mora/configuracion-politica.ts        | 22 +++++
 src/dominio/politica-mora/politica-escalonada.ts   | 17 ++++
 src/dominio/politica-mora/politica-mora.ts         | 38 +++++++++
 src/dominio/politica-mora/politica-plana.ts        | 18 ++++
 src/dominio/politica-mora/politica-retroactiva.ts  | 18 ++++
 12 files changed, 381 insertions(+), 21 deletions(-)
```

| Métrica (8.1) | Resultado | Lectura |
|---|---|---|
| Archivos del núcleo **creados** | **10** | Neutro o bueno: la funcionalidad nueva vive en archivos nuevos |
| Archivos del núcleo **modificados** (de los 7 que existían en el P1) | **2**: `calculadora-mora.ts` (+32/−19) y `credito-estado.ts` (+12/−2) | Dentro del objetivo razonable (≤ 2). Los otros 5 (`dinero`, `plan-amortizacion`, `cartera`, `pago-idempotente`, `prelacion-pago`) no se tocaron |
| **¿Se modificó el motor de cálculo de mora?** | **Sí.** `calculadora-mora.ts` cambió en +32/−19 (13 líneas netas) | El P1 **no** cumplía abierto/cerrado para la mora; ver §4.1 |
| Pruebas del P1 que dejaron de pasar | **0** | Los 10 archivos de prueba del P1 (206 pruebas) pasan sobre el núcleo evolucionado |
| Pruebas del P1 que hubo que reescribir | **0** | `git diff entrega-p1 -- tests` solo muestra archivos **añadidos** (A); ningún archivo del P1 aparece como modificado (M) |
| Líneas netas añadidas a `src/dominio` | **+360** (381 añadidas, 21 eliminadas) | Por encima del rango orientativo de 60–120 líneas; el desglose explica por qué |

**Desglose de las 360 líneas netas.** El rango de 60–120 líneas del enunciado se refiere al cambio de política. Nuestro diff incluye además CP-02 y CP-04:

| Cambio | Archivos | Líneas netas |
|---|---|---:|
| CP-01 / CP-03 · Política escalonada y coexistencia | `politica-mora/*` (5 archivos), `clasificacion-tramo.ts`, adaptación de `calculadora-mora.ts` | 123 + 13 + 13 = **149** |
| … de las cuales solo son doble de prueba o configuración | `politica-retroactiva.ts` (18), `configuracion-politica.ts` (22) | (40) |
| CP-02 · Gasto de gestión de cobro | `gasto-gestion-cobro.ts` | **45** |
| CP-04.1 · `en_mora → cancelado` | `credito-estado.ts` | **10** |
| CP-04.2 · Suspensión del devengo | `devengo-interes.ts` | **57** |
| CP-04.3 · Cartera en riesgo por tramo | `cartera-por-tramo.ts` | **99** |
| **Total** | 12 archivos | **360** |

Sin contar la configuración ni el doble de prueba, la política escalonada ocupó **109 líneas netas**, dentro del rango orientativo. El resto corresponde a correcciones que el enunciado exige y que no son parte de la política de mora.

Fuera de `src/dominio` se añadieron `aplicacion/consultar-mora.ts` (+27) y `contratos/presentadores-p2.ts` (+32), y se modificó `contratos/esquemas.ts` (+33/−0). Con esos archivos, todo `src/` suma 473 líneas añadidas y 21 eliminadas.

## 3. Los cinco principios (sección 8.2)

| Principio | Pregunta del enunciado | Respuesta con evidencia | Veredicto |
|---|---|---|---|
| **S** · Responsabilidad única | ¿Quién decide el tramo y quién decide cuánto cuesta? ¿Es la misma clase? | **Son piezas distintas.** El tramo lo decide `clasificarTramoMora` en `clasificacion-tramo.ts` (Specification: días → tramo). El costo lo decide cada `PoliticaMora` (`politica-escalonada.ts`, `politica-plana.ts`). Se prueban por separado: `INV-10` en `invariantes.test.ts` y los casos M-1 a M-4 en `politica-mora.test.ts`. En el P1, `clasificarTramoMora` y el enum `TramoMora` vivían **dentro** de `calculadora-mora.ts`; el diff los retira del motor y los reexporta | Se cumple **después** del cambio; en el P1 estaban juntos |
| **O** · Abierto/cerrado | ¿Se pudo agregar la política escalonada sin abrir el motor? | **No en el primer cambio.** `calculadora-mora.ts` cambió en +32/−19: el P1 recibía la **tasa** como parámetro de un método estático (`calcularInteresMoratorio(capital, tasa, dias)`), no una política. Hubo que abrir un punto de extensión (`constructor(private readonly politica: PoliticaMora)`). **A partir de ahora sí se cumple**: `contrato-politica.test.ts` inyecta una tercera política (`PoliticaRetroactiva`) sin tocar el motor | **Parcial**: el P1 no lo cumplía; el P2 lo establece |
| **L** · Sustitución de Liskov | ¿Se pueden intercambiar plana, escalonada y retroactiva sin romper los invariantes del motor? | **Sí.** `contrato-politica.test.ts` ejecuta la misma batería (`describe.each`) contra las tres: mismas entradas, resultado determinista e inmutable, no negativo, misma moneda y tope ≤ capital. Se prueban 3 políticas × 2 monedas × 4 capitales × 12 atrasos (0, 1, 30, 31, 60, 61, 90, 91, 120, 121, 150, 100000) = **288 combinaciones**. El motor además rechaza una estrategia que viole el contrato ("el motor rechaza una estrategia que incumple moneda, finitud, signo o tope") | **Se cumple** |
| **I** · Segregación de interfaces | ¿El puerto de política expone solo lo que el motor necesita? | **Sí.** `PoliticaMora` tiene 2 miembros: `readonly id` y `calcular(capital, dias): CalculoPolitica` (`politica-mora.ts`, 4 líneas de interfaz). Ninguna implementación lanza "no soportado"; ninguna persiste, lee el reloj ni cambia el estado del crédito | **Se cumple** |
| **D** · Inversión de dependencias | ¿El motor depende de la abstracción o de una implementación concreta? | **De la abstracción.** `calculadora-mora.ts` importa `PoliticaMora` **solo como tipo** (`import type`) y no nombra `PoliticaPlana` ni `PoliticaEscalonada`. Quien construye la política es `resolverPolitica` (`catalogo-politicas.ts`), y la composición ocurre en la capa de aplicación (`consultar-mora.ts`) | **Se cumple**, con una dependencia residual (ver §4.3) |

### GRASP

| Principio | Pregunta del enunciado | Evidencia |
|---|---|---|
| Experto en información | ¿Quién conoce los días de atraso? Esa pieza debe calcular el tramo | `DiasAtraso` (núcleo) alimenta a `clasificarTramoMora`; `CalculadoraMora.calcularPorCuota` devuelve `tramo` junto al importe. **Ni el tablero ni el caso de uso calculan el tramo**: la interfaz lo recibe (ver E2 §3.2) |
| Polimorfismo | ¿La política se elige por despacho polimórfico o con un `switch`? | El motor usa despacho polimórfico (`this.politica.calcular(...)`). La **selección** de la política sí es un condicional por fecha en un único punto (`resolverPolitica`: `fechaOtorgamiento < vigencia ? plana : escalonada`). Crecerá con cada versión nueva (§4.4) |
| Bajo acoplamiento / alta cohesión | Medido con `git diff --stat` | 10 archivos nuevos frente a 2 modificados; cada archivo nuevo tiene una sola responsabilidad y su propio archivo de pruebas |

## 4. Puntos de fricción: qué se abrió que no debía abrirse

### 4.1 `calculadora-mora.ts` (el motor): +32 / −19

**Causa.** En el P1 la mora era `CalculadoraMora.calcularInteresMoratorio(capitalVencido, tasa, dias)`: un método estático que recibía una **tasa**, no una **política**. La tasa plana era, en la práctica, un parámetro primitivo. El tramo y su clasificación también vivían en el mismo archivo.

**Rediseño aplicado** (commit `ec2a436`):

```diff
+import type { PoliticaMora, CalculoPolitica } from "./politica-mora/politica-mora.js";
+export { TramoMora, clasificarTramoMora } from "./clasificacion-tramo.js";
 export class CalculadoraMora {
+  public constructor(private readonly politica: PoliticaMora) { Object.freeze(this); }
+  public calcular(capital: Dinero, dias: DiasAtraso) { … this.politica.calcular(capital, dias) … }
```

- Se extrajo `TramoMora` / `clasificarTramoMora` a `clasificacion-tramo.ts` y se reexporta, para que el código del P1 que los importaba siga compilando.
- Se agregó la instancia con la política inyectada. La **fachada estática del P1 se conservó intacta** para no romper las 206 pruebas.
- `debeDevengarInteresCorriente` pasó de `dias.valor <= 90` a leer `REGLAS_COBRO.diasHastaReconocimientoCorriente`.

**Qué se haría distinto en el P1:** inyectar desde el principio una `PoliticaMora`, aunque solo existiera la plana. Así, este cambio habría sido de 0 líneas en el motor.

### 4.2 `credito-estado.ts`: +12 / −2

**Causa.** CP-04.1 es un defecto del enunciado del P1: la tabla de transiciones no incluía `EN_MORA → CANCELADO`. Con el patrón State, una transición nueva **obliga** a modificar la clase del estado de origen (`EstadoEnMora` añade `cancelar`). Esto es propio del patrón, no un problema de acoplamiento.

**Rediseño:** override de `cancelar` en `EstadoEnMora` con la guarda "saldo = 0.00 exacto y sin cuotas vencidas pendientes", y el método `Credito.liquidarConPago(e, saldoTotal: Dinero, cuotasVencidasPendientes)`. Además, la suspensión del devengo usa la misma regla de `debeDevengarInteresCorriente` en lugar de repetir el número 90.

### 4.3 Dependencias residuales (no requirieron abrir archivos, pero existen)

- `PoliticaEscalonada` lee sus tasas de `configuracion-politica.ts` con un `import`, no por constructor. **Para cambiar el 30 % de Mora 3 se edita `configuracion-politica.ts`, no `calculadora-mora.ts`**: se cumple la regla de la sección 7.2 ("sin tocar el motor"). Sin embargo, sigue siendo un cambio de código que requiere volver a compilar. En el Proyecto Final, la configuración debería llegar desde el repositorio de políticas versionadas (puerto `AdministrarPolitica`).
- Las políticas importan el tipo `DiasAtraso` de `calculadora-mora.ts`, y la plana reutiliza el validador de tasa de ese archivo. Es un acoplamiento de tipos heredado del P1 que podría extraerse a `dias-atraso.ts`.

### 4.4 Deuda aceptada

1. **Fachada estática P1**: conserva la fórmula plana sin tope ni congelación a 120 días. Las entradas del P2 usan `consultarMora` o el motor inyectado.
2. **Catálogo con un condicional**: dos versiones cerradas en código. Una tercera política exigirá tocar `resolverPolitica` (aunque no el motor).
3. **Clasificación ≠ baja contable**: pasados los 120 días la mora se congela automáticamente, pero la baja (`INCOBRABLE`) requiere autorización y evidencia, como en el P1.
4. **Gasto y devengo son funciones puras**: el llamador conserva el resultado. La persistencia atómica y la concurrencia corresponden al Proyecto Final.
5. **Porcentajes conciliados por restos mayores**: una fila puede diferir una centésima de su redondeo aislado para que la suma sea exactamente 7.00 % (invariante 7).
6. **Duplicación menor** del conjunto de estados activos entre `cartera.ts` (P1) y `cartera-por-tramo.ts`, retenida para no modificar un sexto archivo del P1.

## 5. Resultado de las pruebas

Última ejecución registrada: `npm run verify` (`tsc --noEmit` + `vitest run`) con **263 pruebas aprobadas en 18 archivos** y código de salida 0. La validación desde instalación limpia (`npm ci`) está en [e6-04-validacion-final.md](proyecto2/e6-04-validacion-final.md).

| Prueba obligatoria de E6 | Archivo y caso | Resultado |
|---|---|---|
| M-1 Q5.44 · M-2 Q18.14 · M-3 Q50.80 · M-4 Q65.32 | `politica-mora.test.ts` · "M-1 a M-4 y congelación: día %s = %s" (incluye 121 y 150 días = Q65.32) | Pasa |
| M-5 Q1,047.76 (y Q1,010.06 a 15 días) | `gasto-gestion-cobro.test.ts` · "M-5 y pago sin gasto al corte" | Pasa |
| Coexistencia: Q21.77 plana y Q18.14 escalonada a 45 días | `politica-mora.test.ts` · "conserva la plana de 45 días"; `regresion-p1.test.ts` | Pasa |
| Suite del P1 intacta (Q7.26, tabla de 12 filas) | 10 archivos del P1 sin modificar; `regresion-p1.test.ts` · "invariante 5 … mantienen 7.26" | 206 de 206 pasan |
| Contrato contra las tres políticas (Liskov) | `contrato-politica.test.ts` · "Contrato LSP: $id" | Pasa para plana, escalonada y retroactiva |
| Los ocho invariantes de la sección 7.9 | 1, 2 y 4: `politica-mora.test.ts`; 3: `contrato-politica.test.ts`; 5 y 8: `regresion-p1.test.ts`; 6: `gasto-gestion-cobro.test.ts`; 7: `cartera-por-tramo.test.ts` | Pasa |
| CP-04.1 `en_mora → cancelado`; SOLICITADO no puede pagar | `credito-cancelacion-p2.test.ts` | Pasa |
| CP-04.2 día 90 frente a 100: el ingreso no sube y el suspenso sí | `devengo-interes.test.ts` · "día 90 reconoce; días 91 y 100 acumulan suspenso sin aumentar ingreso" | Pasa |
| CP-04.3 3.00 + 2.25 + 1.00 + 0.75 = 7.00 % | `cartera-por-tramo.test.ts` · "cumple oráculo: 7.00% en riesgo y 21.75% en mora" | Pasa |
| Redondeo por tramo prohibido (Q50.80 y no Q50.81) | `politica-mora.test.ts` · "desglosa sin redondear cada tramo" | Pasa |

Durante la evolución hubo **dos fallos de compilación** en pruebas **nuevas**: la inferencia literal del parámetro de `PoliticaPlana` quedó restringida a `"0.24"`, y un enum de estado se ensanchó en una entrada nueva. Se corrigieron con una anotación `string` y un discriminante literal, sin tocar las expectativas del P1. No se observaron fallos de pruebas del P1.

Restricciones de E6 verificadas: `"strict": true` en `tsconfig.json`; `rg '\bany\b' src` sin coincidencias; `rg 'new Date\(\)' src` sin coincidencias (el núcleo no lee el reloj); dependencias de producción: `date-fns`, `decimal.js` y `zod`, sin `express` ni `pg`.

**Comandos para reproducir**

```bash
npm install && npm test                                  # suite completa
npm run test:mora            # también: test:coexistencia, test:cp04, test:invariantes
git diff --stat entrega-p1 0d6c1a9 -- src/dominio        # métricas de §2
git diff --name-status entrega-p1 -- tests               # solo "A": ninguna prueba P1 modificada
git show ec2a436 -- src/dominio/calculadora-mora.ts      # apertura del motor (§4.1)
git show 5752b55 -- src/dominio/credito-estado.ts        # transición nueva (§4.2)
```

## 6. Conclusión

**Grado real de cumplimiento de SOLID en el diseño del P1:** parcial. El P1 aplicó bien **S** e **I** en los módulos de dinero, amortización, prelación e idempotencia: ninguno de esos cinco archivos cambió. También aplicó **State** en el ciclo de vida del crédito. Pero **no cumplía O ni D para la mora**: la tasa llegaba como parámetro primitivo a un método estático, y la clasificación del tramo compartía archivo con el cálculo. Por eso el motor tuvo que abrirse una vez (+32/−19).

**Después del P2**, el motor depende de una abstracción inyectada, tres políticas cumplen el mismo contrato y una política nueva ya **no** requiere modificar `calculadora-mora.ts`. La prueba de ello es `PoliticaRetroactiva`, que se agregó sin tocarlo. La medición respalda que el cambio fue localizado: 2 de 7 archivos modificados, 0 pruebas del P1 reescritas y 0 regresiones.

**Qué haríamos distinto hoy:**

1. Declarar el puerto `PoliticaMora` desde el P1, aunque tuviera una sola implementación.
2. Separar desde el inicio la Specification del tramo y el cálculo.
3. Cargar la configuración de tasas desde un repositorio de políticas versionadas en lugar de un módulo TypeScript.
4. Resolver la política con un registro de versiones por vigencia (una tabla ordenada por fecha) en lugar de un condicional, para que una tercera versión no toque `catalogo-politicas.ts`.
