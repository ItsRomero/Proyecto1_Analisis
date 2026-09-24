# Pruebas unitarias de mora escalonada: entradas, salidas y resultados esperados

## 1. Objetivo y alcance

Este documento permite entender y comprobar el cálculo de mora escalonada de `POL-2026-10`, considerando todos los tramos, sus fronteras, el redondeo, la congelación y la convivencia con contratos anteriores.

Se documenta cada caso de [politica-mora.test.ts](../../tests/politica-mora.test.ts), el contrato compartido de [contrato-politica.test.ts](../../tests/contrato-politica.test.ts) y las pruebas relacionadas con fechas, clasificación, selección de política y serialización. Los casos parametrizados se desglosan por entrada o por conjunto de entradas. Se incluyen casos adicionales propuestos para completar la comprobación explícita de importes en todas las fronteras.

**Cómo interpretar los resultados:** «salida esperada» es el valor que debe producir el sistema; «criterio de aprobación» indica qué comparar. Los valores calculados como referencia no implican que exista una aserción automatizada para cada campo. La sección 10 registra la ejecución realizada y sus límites.

Fuentes de las reglas: [configuración de políticas](../../src/dominio/politica-mora/configuracion-politica.ts), [política escalonada](../../src/dominio/politica-mora/politica-escalonada.ts), [calculadora](../../src/dominio/calculadora-mora.ts) y [evolución del núcleo](e6-02-evolucion-nucleo.md).

## 2. Datos y reglas comunes

Salvo indicación contraria, se usa capital vencido `"725.76"`, moneda `"GTQ"`, política `POL-2026-10` y base anual de 360 días. Los importes monetarios se ingresan como cadenas y las tasas como fracciones: `"0.18"` representa 18% anual.

| Clasificación | Días de atraso | Tasa nominal anual | Comportamiento esperado |
|---|---|---|---|
| SIN_MORA | 0 | No aplica | Mora cero; detalle sin tramos. |
| MORA_1 | 1–30 | 18% | Acumula únicamente días del primer tramo. |
| MORA_2 | 31–60 | 24% | Conserva los primeros 30 días al 18% y agrega los días del segundo tramo al 24%. |
| MORA_3 | 61–90 | 30% | Conserva los dos tramos anteriores y agrega días al 30%. |
| VENCIDO | 91–120 | 36% | Conserva los tres tramos anteriores y agrega días al 36%. |
| INCOBRABLE | Más de 120 | 0% adicional | Conserva lo acumulado al día 120; no reinicia el importe en cero. |

`SIN_MORA` e `INCOBRABLE` son clasificaciones; no se agregan como filas al detalle de cálculo. `detalle.tramos` contiene únicamente los tramos configurados con días recorridos mayores que cero, en orden cronológico. Clasificar una cuota como `INCOBRABLE` no declara automáticamente la baja contable del crédito.

Para capital vencido `C` y atraso `d`:

```text
días del tramo = max(0, min(d, hasta) - desde + 1)
importe del tramo = C × tasa anual × días del tramo / 360
totalSinRedondear = min(C, suma de importes de los tramos)
interesMoratorio = redondear(totalSinRedondear, 2 decimales, ROUND_HALF_UP)
```

El capital es la única base: los intereses corrientes, la mora anterior y los gastos no se capitalizan. Se redondea una sola vez por cuota. Con las tasas actuales, recorrer los cuatro tramos completos genera el 9% del capital; por eso el tope del 100% es una garantía del contrato, pero no llega a activarse con esta configuración escalonada.

### Regla obligatoria: prohibido redondear por tramo

**Está prohibido redondear los importes de cada tramo antes de sumarlos.** Esta restricción aplica a MORA_1, MORA_2, MORA_3 y VENCIDO. Se debe conservar la precisión decimal interna de cada aporte, sumar los aportes, aplicar el tope de capital y redondear únicamente el total final de cada cuota a dos decimales con `ROUND_HALF_UP`.

Los cálculos intermedios usan Decimal con precisión de 40 cifras. No se deben convertir los aportes individuales a `Dinero`, porque su construcción redondea a dos decimales, ni aplicarles `toFixed(2)` para luego sumarlos. Los campos `importeSinRedondear` del detalle deben conservar sus cadenas decimales originales.

**Ejemplo de control (ME-12):** capital GTQ725.76 y atraso de 100 días.

| Tramo | Aporte sin redondear que debe sumarse | Aporte redondeado cuya suma está prohibida |
|---|---:|---:|
| MORA_1 | 10.8864 | 10.89 |
| MORA_2 | 14.5152 | 14.52 |
| MORA_3 | 18.144 | 18.14 |
| VENCIDO | 7.2576 | 7.26 |
| Suma | 50.8032 | 50.81 |

- **Output permitido:** redondear `50.8032` una sola vez produce **GTQ50.80**.
- **Output incorrecto:** sumar los cuatro aportes redondeados produce **GTQ50.81**, un cobro adicional indebido de GTQ0.01 para este caso.
- **Resultado esperado de la prueba:** `Cumple` solamente si conserva los cuatro importes originales, el total exacto `"50.8032"` y la mora final `"50.80"`. Si devuelve `"50.81"` o altera el detalle mediante redondeo por tramo, el resultado es `No cumple`.

La prueba existente `desglosa sin redondear cada tramo`, documentada en ME-12, comprueba esos importes y totales. Que otros ejemplos coincidan accidentalmente después de redondear por tramo no hace válido ese procedimiento. En cálculos de varias cuotas, el redondeo final se realiza una vez por cada cuota, conforme a ME-13.

### Entradas y salidas del motor

| Elemento | Tipo / ejemplo | Significado |
|---|---|---|
| Entrada `capital` | `Dinero.desdeCadena("725.76", "GTQ")` | Capital vencido de una cuota. |
| Entrada `dias` | `DiasAtraso.desdeNumero(100)` | Días enteros no negativos. |
| Salida `politicaId` | `"POL-2026-10"` | Política utilizada. |
| Salida `interesMoratorio` | `Dinero`; `aCadena() === "50.80"` | Importe final redondeado. |
| Salida `detalle.totalSinRedondear` | `"50.8032"` | Total decimal previo al redondeo, sujeto al tope. |
| Salida `detalle.moneda` | Objeto `Moneda` con código `GTQ` | Moneda del capital. |
| Salida `detalle.tramos` | Lista de `{ nombre, dias, tasa, importeSinRedondear }` | Aporte de cada tramo recorrido. |

`calcularPorCuota` agrega referencia, vencimiento, capital, días y clasificación; `calcularVariasCuotas` devuelve una lista en el orden de entrada. El método `calcular` por sí solo no devuelve la clasificación.

## 3. Casos existentes de cálculo y políticas: CP-01

Archivo: [politica-mora.test.ts](../../tests/politica-mora.test.ts). Cada fila parametrizada representa una prueba independiente de Vitest.

### ME-01 a ME-07: ejemplos monetarios y congelación

Nombre automatizado: `M-1 a M-4 y congelación: día %s = %s`.

| ID | Input: días | Días por tramo (MORA_1 / MORA_2 / MORA_3 / VENCIDO) | Total exacto de referencia | Output esperado: mora GTQ | Criterio de aprobación automatizado |
|---|---:|---|---:|---:|---|
| ME-01 | 0 | 0 / 0 / 0 / 0 | 0 | `"0.00"` | `interesMoratorio.aCadena()` coincide exactamente. |
| ME-02 | 15 | 15 / 0 / 0 / 0 | 5.4432 | `"5.44"` | Coincide con M-1: `725.76 × 0.18 × 15 / 360`. |
| ME-03 | 45 | 30 / 15 / 0 / 0 | 18.144 | `"18.14"` | Coincide con M-2: `10.8864 + 7.2576`. |
| ME-04 | 100 | 30 / 30 / 30 / 10 | 50.8032 | `"50.80"` | Coincide con M-3: suma de los cuatro tramos recorridos. |
| ME-05 | 120 | 30 / 30 / 30 / 30 | 65.3184 | `"65.32"` | Coincide con M-4: cuatro tramos completos. |
| ME-06 | 121 | 30 / 30 / 30 / 30 | 65.3184 | `"65.32"` | Conserva el importe del día 120. |
| ME-07 | 150 | 30 / 30 / 30 / 30 | 65.3184 | `"65.32"` | Sigue congelada aunque aumente el atraso. |

La aserción actual compara la mora redondeada. La distribución de días y el total exacto de esta tabla explican el cálculo esperado; no todos esos campos se comprueban en estas siete pruebas.

### ME-08 a ME-10: selección según fecha de otorgamiento

Nombre automatizado: `elige por otorgamiento %s`. Entrada común: capital GTQ725.76 y 15 días de atraso. Se llama a `resolverPolitica` y se inyecta su resultado en el motor.

| ID | Input: otorgamiento | Output: política | Output: mora | Criterio de aprobación |
|---|---|---|---|---|
| ME-08 | `2026-09-30` | `POL-2024-01` | `"7.26"` | Conserva la plana histórica al 24%. |
| ME-09 | `2026-10-01` | `POL-2026-10` | `"5.44"` | Activa la escalonada desde el inicio de vigencia inclusive. |
| ME-10 | `2027-01-01` | `POL-2026-10` | `"5.44"` | Mantiene la escalonada para otorgamientos posteriores. |

### ME-11: conservación de la política plana

- **Test:** `conserva la plana de 45 días`.
- **Inputs:** `new PoliticaPlana()`, capital GTQ725.76, atraso 45 días.
- **Output esperado:** mora `"21.77"`.
- **Cálculo:** `725.76 × 0.24 × 45 / 360 = 21.7728`.
- **Criterio:** igualdad exacta con `"21.77"`; este resultado corresponde a la política histórica, mientras que ME-03 exige `"18.14"` para la escalonada.

### ME-12: detalle y redondeo único

**Test:** `desglosa sin redondear cada tramo`. **Inputs:** capital GTQ725.76 y 100 días.

| Nombre esperado | Días esperados | Tasa esperada | Output `importeSinRedondear` |
|---|---:|---|---|
| MORA_1 | 30 | `"0.18"` | `"10.8864"` |
| MORA_2 | 30 | `"0.24"` | `"14.5152"` |
| MORA_3 | 30 | `"0.30"` | `"18.144"` |
| VENCIDO | 10 | `"0.36"` | `"7.2576"` |

**Outputs y criterio automatizado:** la lista de importes debe coincidir en ese orden, `detalle.totalSinRedondear` debe ser `"50.8032"` y la mora final `"50.80"`. Sumar importes previamente redondeados daría `10.89 + 14.52 + 18.14 + 7.26 = 50.81`, resultado incorrecto. Los nombres, días y tasas se muestran como referencia; el test actual compara los importes y los totales.

### ME-13: cálculo independiente por cuota

**Test:** `calcula cada cuota con su vencimiento y corte explícitos`. **Input común:** corte `2026-11-15`; lista y objetos de entrada congelados.

| Referencia de entrada | Capital GTQ | Vencimiento | Días derivados | Clasificación esperada | Output: mora |
|---|---:|---|---:|---|---|
| `"1"` | 725.76 | `2026-10-01` | 45 | MORA_2 | `"18.14"` |
| `"2"` | 725.76 | `2026-10-31` | 15 | MORA_1 | `"5.44"` |

**Criterio automatizado:** `resultados.map(r => r.interesMoratorio.aCadena())` es exactamente `["18.14", "5.44"]`. Cada cuota utiliza su propio vencimiento. Los días y clasificaciones de la tabla son referencias derivadas, no aserciones de este test. La suma de las moras redondeadas es GTQ23.58; el método devuelve las cuotas, no un total agregado.

#### Procedimiento: cada cuota vencida se calcula por separado

La unidad de cálculo es la cuota. `calcularVariasCuotas` recorre las obligaciones y llama a `calcularPorCuota` para cada una, usando el mismo corte y la política inyectada, pero conservando el capital y el vencimiento propios de cada obligación.

1. Obtener el capital vencido de la cuota, sin incluir intereses ni gastos.
2. Calcular sus días calendario de atraso desde su vencimiento hasta el corte, con mínimo cero.
3. Distribuir esos días entre MORA_1, MORA_2, MORA_3 y VENCIDO. Cada cuota inicia su propio recorrido; después de 120 días no acumula mora adicional.
4. Sumar los aportes de sus tramos sin redondearlos, aplicar el tope de su capital y redondear una sola vez el total de esa cuota.
5. Devolver el resultado asociado a su referencia. Si se necesita un total de mora del crédito, sumar después las moras monetarias finales de las cuotas.

Para las entradas de ME-13, el cálculo detallado es:

| Cuota | Cálculo de sus tramos sin redondear | Total exacto por cuota | Mora final por cuota |
|---|---|---:|---:|
| `1`: 45 días | `725.76 × 0.18 × 30 / 360 + 725.76 × 0.24 × 15 / 360` | 18.144 | 18.14 |
| `2`: 15 días | `725.76 × 0.18 × 15 / 360` | 5.4432 | 5.44 |

**Output esperado:** dos resultados, en el orden de entrada, con moras `["18.14", "5.44"]`. La suma posterior es **GTQ23.58**. Esta suma es una referencia para el consumidor; `calcularVariasCuotas` no devuelve un campo de total agregado.

**Procedimiento incorrecto:** sumar primero los capitales (`725.76 + 725.76 = 1451.52`) y aplicar a ambos los 45 días de la cuota más antigua produciría GTQ36.29. Esto asignaría a la segunda cuota días de atraso que no tiene y no cumple la regla del proyecto. Tampoco corresponde sumar los días de ambas cuotas ni usar un atraso promedio.

**Criterios de aprobación del cálculo separado:**

- Cada cuota conserva su referencia, capital y vencimiento; sus días y clasificación corresponden a ese vencimiento y al corte común.
- La mora de una cuota calculada dentro de la lista coincide con la calculada individualmente con la misma política y corte.
- Los intereses de una cuota no se incorporan al capital de esa cuota ni al de otra.
- Se redondea el total de cada cuota, sin redondear sus tramos ni sustituir los resultados individuales por un único cálculo global.

ME-13 automatiza la comparación de los dos importes. La comprobación explícita de todos los campos y de la equivalencia entre ejecución individual y en lista queda como ampliación propuesta; no se presenta como una aserción existente.

#### Referencia legal: Código Civil de Guatemala, Decreto-Ley 106

El artículo 1949 dispone: **«Queda prohibida la capitalización de intereses.»** El mismo artículo contempla una excepción para instituciones bancarias sujeta a lo que establezca la Junta Monetaria. Fuente: [Código Civil, Decreto-Ley 106, artículo 1949, edición alojada por el Ministerio de Cultura y Deportes](https://mcd.gob.gt/wp-content/uploads/2013/07/codigo-civil.pdf#page=256).

En el proyecto, la regla de usar exclusivamente capital vencido como base evita calcular intereses sobre intereses. Esta es la relación de la implementación con la prohibición citada: ni la mora acumulada ni el interés corriente se añaden al capital para calcular nuevos intereses, incluso cuando existen varias cuotas vencidas.

**Alcance de la referencia:** el artículo 1949 citado no establece el algoritmo por cuota, las tasas escalonadas, la base Actual/360, la congelación a 120 días ni la prohibición de redondear por tramo. Esas son reglas del proyecto documentadas aquí. El cálculo separado preserva los vencimientos de cada obligación; no se atribuye al artículo una instrucción informática que su texto no contiene. La referencia tampoco constituye una determinación del régimen jurídico aplicable a cada contrato.

### ME-14: invariantes sobre todos los días

**Test:** `invariantes 1, 2 y 4: monotonía, comparación 1–120 y plana al 18%`.

| Inputs / recorrido | Output esperado | Criterio de aprobación |
|---|---|---|
| Capital GTQ725.76; días 1 a 120 | `mora(d) >= mora(d - 1)` | Todas las comparaciones de monotonía son `true`. |
| Mismo capital y días; escalonada frente a `PoliticaRetroactiva` | `escalonada(d) <= retroactiva(d)` | Todas las comparaciones entre 1 y 120 son `true`. |
| Días 1 a 30; escalonada frente a `PoliticaPlana("0.18")` | Igual importe redondeado | Igualdad exacta de las cadenas monetarias para cada día. |
| Días 121, 150, 365 y 10000 | Mora `"65.32"` en todos | Cada importe coincide con la mora del día 120. |

La retroactiva es un doble de prueba que aplica la tasa del tramo actual a todos los días. Por ejemplo, al día 45 produce GTQ21.77 frente a GTQ18.14 de escalonada; al día 100, GTQ72.58 frente a GTQ50.80. La comparación automatizada se limita a 1–120; el catálogo productivo no selecciona este doble.

## 4. Fronteras de todos los tramos

Cada fila siguiente define una comprobación monetaria explícita con capital GTQ725.76. La clasificación de los diez límites 0/1/30/31/60/61/90/91/120/121 ya se verifica en [calculadora-mora.test.ts](../../tests/calculadora-mora.test.ts), mediante `clasifica %i días como %s`.

Los importes exactos de los límites intermedios se documentan como **casos adicionales propuestos**: el contrato LSP y las invariantes recorren esos días, pero no comparan cada uno con una constante monetaria. El día 75 añade un caso interior de MORA_3.

| ID | Input: días | Clasificación esperada | Días M1/M2/M3/V | Output exacto esperado | Output monetario esperado | Cobertura monetaria explícita actual |
|---|---:|---|---|---|---|---|
| FR-01 | 0 | SIN_MORA | 0/0/0/0 | `"0"` | `"0.00"` | ME-01 verifica mora final. |
| FR-02 | 1 | MORA_1 | 1/0/0/0 | `"0.36288"` | `"0.36"` | Constante propuesta. |
| FR-03 | 30 | MORA_1 | 30/0/0/0 | `"10.8864"` | `"10.89"` | Constante propuesta. |
| FR-04 | 31 | MORA_2 | 30/1/0/0 | `"11.37024"` | `"11.37"` | Constante propuesta. |
| FR-05 | 60 | MORA_2 | 30/30/0/0 | `"25.4016"` | `"25.40"` | Constante propuesta. |
| FR-06 | 61 | MORA_3 | 30/30/1/0 | `"26.0064"` | `"26.01"` | Constante propuesta. |
| FR-07 | 75 | MORA_3 | 30/30/15/0 | `"34.4736"` | `"34.47"` | Caso interior propuesto. |
| FR-08 | 90 | MORA_3 | 30/30/30/0 | `"43.5456"` | `"43.55"` | Constante propuesta. |
| FR-09 | 91 | VENCIDO | 30/30/30/1 | `"44.27136"` | `"44.27"` | Constante propuesta. |
| FR-10 | 120 | VENCIDO | 30/30/30/30 | `"65.3184"` | `"65.32"` | ME-05 verifica mora final. |
| FR-11 | 121 | INCOBRABLE | 30/30/30/30 | `"65.3184"` | `"65.32"` | ME-06 verifica mora final. |

**Criterio para aprobar cada caso completo:** comparar clasificación, total exacto, mora final y días de los tramos presentes. Los ceros de la tabla representan tramos ausentes del detalle, no filas con cero días. Al día 121 siguen presentes los cuatro tramos completos; no se agrega una fila `INCOBRABLE`.

## 5. Contrato de las estrategias: entradas válidas y errores

Archivo: [contrato-politica.test.ts](../../tests/contrato-politica.test.ts). Las dos primeras pruebas se ejecutan para plana, escalonada y retroactiva: seis pruebas, más una de estrategia incompatible.

### CT-01: mismos tipos de entrada, determinismo, moneda, inmutabilidad y tope

**Test:** `acepta las mismas entradas, es determinista e inmutable y conserva moneda/tope`.

**Inputs:** producto cartesiano de:

- Monedas: `GTQ`, `USD`.
- Capitales: `"0"`, `"0.01"`, `"725.76"`, `"999999999999.99"`.
- Días: `0, 1, 30, 31, 60, 61, 90, 91, 120, 121, 150, 100000`.
- Políticas: plana, escalonada y retroactiva.

Hay 96 combinaciones por política, 288 en total; cada combinación se calcula dos veces dentro de la prueba, no como un test independiente de Vitest.

| Output observado | Resultado esperado / criterio de aprobación |
|---|---|
| `interesMoratorio` | Instancia de `Dinero`, no negativa y menor o igual al capital. |
| Moneda del interés | Igual a la moneda de entrada. |
| Primera y segunda ejecución | Resultados profundamente iguales. |
| Capital después del cálculo | `aJSON()` idéntico al valor anterior. |
| Días después del cálculo | Mismo valor numérico. |
| `detalle.tramos` y cada fila | `Object.isFrozen(...) === true`. |

Referencias monetarias de escalonada: capital cero produce `"0.00"` para todos los días; capital `"0.01"` al día 120 produce exacto `"0.0009"` y mora `"0.00"`; capital `"725.76"` al día 120 produce `"65.32"`; capital `"999999999999.99"` al día 120 produce exacto `"89999999999.9991"` y mora `"90000000000.00"`. CT-01 comprueba propiedades, no estas constantes.

### CT-02: capital negativo

- **Test:** `rechaza capital negativo sin mutar la entrada`.
- **Inputs:** capital `"-0.01"` GTQ, 15 días, cada una de las tres estrategias.
- **Acciones:** llamar directamente a `politica.calcular` y mediante `new CalculadoraMora(politica).calcular`.
- **Output esperado:** excepción en ambas llamadas; capital sigue siendo `"-0.01"`.
- **Criterio automatizado:** ambas llamadas cumplen `toThrow()` y la entrada conserva su importe. El motor lanza `CapitalVencidoInvalido`; la política escalonada directa lanza un `Error`. El test no exige una clase específica.

### CT-03: rechazo de una estrategia incompatible

**Test:** `el motor rechaza una estrategia que incumple moneda, finitud, signo o tope`. **Inputs comunes:** capital GTQ10.00, 1 día y estrategia simulada `INVALIDA`, con detalle vacío.

| Output simulado por la estrategia | Motivo del rechazo esperado |
|---|---|
| Total `"-1"`, GTQ | Mora negativa. |
| Total `"11"`, GTQ | Supera el capital de 10.00. |
| Total `"NaN"`, GTQ | Total no numérico. |
| Total `"Infinity"`, GTQ | Total no finito. |
| Total `"1"`, USD | Moneda diferente del capital. |

**Criterio:** cada llamada al motor lanza una excepción cuyo mensaje contiene `"incompatible"`; no devuelve un interés válido. Esta prueba verifica el rechazo de incumplimientos del contrato, no la activación del tope en la configuración escalonada actual.

## 6. Fechas, días y clasificación que alimentan la mora

Archivo: [calculadora-mora.test.ts](../../tests/calculadora-mora.test.ts). Se documentan aquí los casos compartidos que usa la escalonada; las pruebas de tasa directa de P1 pertenecen a la fórmula histórica.

| ID / test | Inputs | Output esperado | Criterio de aprobación |
|---|---|---|---|
| FE-01: produce cero en la fecha de vencimiento | Vencimiento y corte `2026-04-10` | 0 días | Igualdad exacta. |
| FE-02: produce uno al día calendario siguiente | Vencimiento `2026-04-10`; corte `2026-04-11` | 1 día | Igualdad exacta. |
| FE-03: produce cero si el corte es anterior | Vencimiento `2026-04-10`; corte `2026-03-01` | 0 días | No produce atraso negativo. |
| FE-04: cuenta correctamente a través de un año bisiesto | Vencimiento `2024-02-28`; corte `2024-03-01` | 2 días | Incluye el 29 de febrero. |
| FE-05 a FE-08: rechaza la fecha civil inválida | Cada valor: `2026-2-01`, `2026-02-30`, `2026-13-01`, `texto` | `FechaCivilInvalida` | Cada entrada lanza esa clase de error. |
| FE-09 a FE-11: rechaza días inválidos | Cada valor: `-1`, `1.5`, `NaN` | `DiasAtrasoInvalidos` | Cada entrada lanza esa clase de error. |
| FE-12 a FE-21: clasifica días | Los diez límites de la sección 4, sin el caso adicional de 75 días | Enumeración indicada en la tabla | Igualdad exacta de `clasificarTramoMora`. |
| FE-22: suspende interés corriente después de 90 días, no antes | 90 y 91 días | `true` y `false`, respectivamente | `debeDevengarInteresCorriente` cambia en 91. |

FE-22 se refiere al interés **corriente**. La mora escalonada sigue acumulándose en VENCIDO, hasta el día 120.

## 7. Regresión y convivencia en la aplicación

Archivo: [regresion-p1.test.ts](../../tests/regresion-p1.test.ts). Estos casos verifican colaboración entre componentes, además del cálculo unitario.

### AP-01: conserva API de tasa directa y CA-02

- **Inputs:** fachada estática `CalculadoraMora.calcularInteresMoratorio`, capital GTQ725.76, tasa `"0.24"`, 15 días.
- **Output y criterio:** mora exactamente `"7.26"`.
- **Propósito:** preservar el contrato P1. Esta fachada no selecciona política ni añade las reglas P2 de congelación y tope.

### AP-02: invariante 5, fecha de otorgamiento frente a corte

- **Inputs comunes:** crédito `C`, estado `EN_MORA`, corte `2026-11-16`; cuota `1`, capital GTQ725.76 y vencimiento `2026-11-01` (15 días).
- **Variante anterior:** otorgamiento `2026-09-30`; outputs comprobados: `politicaId = "POL-2024-01"` y mora `"7.26"`.
- **Variante nueva:** otorgamiento `2026-10-01`; output comprobado: mora `"5.44"`.
- **Criterio:** ambas consultas producen esos importes aun compartiendo un corte posterior al cambio de política. La fecha de otorgamiento determina la política.

### AP-03 y AP-04: invariante 8, baja incobrable y congelación

**Inputs comunes:** crédito `C`, estado `INCOBRABLE`, declaración `2027-01-30`, cuota `1` de GTQ725.76 vencida `2026-10-01`. Se comparan cortes `2027-01-30` y `2027-03-01`.

| Caso | Otorgamiento | Mora de referencia en ambos cortes | Resultado esperado adicional |
|---|---|---|---|
| AP-03 | `2026-09-30` | `"58.54"`, plana por 121 días hasta la declaración | Cartera activa `"0.00"`; capital de bajas del período `"725.76"`. |
| AP-04 | `2026-10-01` | `"65.32"`, escalonada congelada desde el día 120 | Cartera activa `"0.00"`; capital de bajas del período `"725.76"`. |

Para cartera se usa inicio de período `2027-01-01`, corte `2027-01-30`, crédito con atraso 121 y baja por GTQ725.76 en la fecha de declaración.

**Criterio automatizado:** igualdad de mora entre ambos cortes para cada política; además, igualdad explícita con `"65.32"` para escalonada y con los dos importes de cartera para ambas. `"58.54"` es una referencia calculada (`725.76 × 0.24 × 121 / 360 = 58.54464`); el test histórico compara conservación, no esa constante.

### AP-05: fechas incompatibles

- **Test:** `rechaza corte anterior a otorgamiento o baja fuera de período`.
- **Inputs base:** crédito `C` incobrable, otorgamiento `2026-10-01`, corte `2027-01-01`, declaración `2027-02-01`, cuotas vacías.
- **Output esperado:** error que contiene `"fuera del período"`, porque la declaración es posterior al corte.
- **Segunda entrada:** mismo objeto, cambiando corte a `2026-09-01`.
- **Output esperado:** error que contiene `"anterior"`, porque el corte precede al otorgamiento.
- **Criterio:** las dos llamadas cumplen la aserción de excepción correspondiente.

## 8. Salida serializada de la mora

Archivo: [contratos-p2.test.ts](../../tests/contratos-p2.test.ts), test `serializa resultados reales de mora, incluidos importes sin redondeo`.

- **Inputs:** crédito `C`, estado `EN_MORA`, otorgamiento `2026-10-01`, corte `2027-01-09`; cuota `1`, capital GTQ725.76, vencimiento `2026-10-01`. El atraso es de 100 días.
- **Acción:** `presentarMora(consultarMora(datos))`, conversión a JSON y validación con `consultaMoraSchema`.
- **Outputs comprobados:** `cuotas[0].detalle.totalSinRedondear === "50.8032"` e `interesMoratorio.importe === "50.80"`; JSON validado igual al resultado presentado.
- **Entrada inválida adicional:** sustituir la cadena del total exacto por el número `50.8032` en el detalle, con moneda `GTQ` y tramos vacíos.
- **Output esperado de validación:** `safeParse(...).success === false`.
- **Criterio:** el recorrido válido conserva estructura e importes y el objeto inválido se rechaza.

## 9. Casos adicionales propuestos para completar la evidencia

Además de las constantes de frontera de la sección 4, estos casos describen aserciones útiles que todavía no existen como pruebas específicas de escalonada. No se contabilizan como pruebas aprobadas.

| ID | Inputs | Outputs esperados | Criterio de aprobación propuesto |
|---|---|---|---|
| AD-01 | Capital GTQ10.00, 1 día, escalonada | Total exacto `"0.005"`; mora `"0.01"` | Verificar el empate `ROUND_HALF_UP` de forma explícita. |
| AD-02 | Capital GTQ725.76, 0 días | `detalle.tramos = []`; total `"0"`; mora `"0.00"` | Comprobar el detalle vacío además del importe. |
| AD-03 | Capital GTQ725.76, 121 y 150 días | Cuatro filas, 30 días cada una; total `"65.3184"`; mora `"65.32"` | Confirmar ausencia de una quinta fila y congelación del detalle completo. |
| AD-04 | Cuota GTQ725.76, vencimiento `2026-10-01`, corte `2026-09-30`, motor escalonado directo | 0 días, SIN_MORA, `"0.00"` | Verificar las reglas de fechas conectadas al motor escalonado. |
| AD-05 | Capital GTQ725.76, 100 días, escalonada | Nombres, tasas y días exactamente como ME-12 | Ampliar la comprobación del detalle más allá de sus importes. |

Ejemplo de cómo automatizar una frontera propuesta en un archivo dentro de `tests/`:

```ts
import { expect, it } from "vitest";
import {
  CalculadoraMora, DiasAtraso, TramoMora, clasificarTramoMora,
} from "../src/dominio/calculadora-mora.js";
import { Dinero } from "../src/dominio/dinero.js";
import { PoliticaEscalonada } from "../src/dominio/politica-mora/politica-escalonada.js";

it("FR-04: el día 31 agrega un día al 24%", () => {
  const capital = Dinero.desdeCadena("725.76", "GTQ");
  const dias = DiasAtraso.desdeNumero(31);
  const resultado = new CalculadoraMora(new PoliticaEscalonada()).calcular(capital, dias);

  expect(clasificarTramoMora(dias)).toBe(TramoMora.MORA_2);
  expect(resultado.detalle.totalSinRedondear).toBe("11.37024");
  expect(resultado.interesMoratorio.aCadena()).toBe("11.37");
  expect(resultado.detalle.tramos).toEqual([
    { nombre: "MORA_1", dias: 30, tasa: "0.18", importeSinRedondear: "10.8864" },
    { nombre: "MORA_2", dias: 1, tasa: "0.24", importeSinRedondear: "0.48384" },
  ]);
});
```

## 10. Ejecución y registro de cumplimiento

Para invariantes transversales y las comprobaciones relacionadas de cartera, políticas y pagos, usar `npm run test:invariantes`. La sección 15 detalla su alcance y criterios.

Para cartera en mora y cartera en riesgo, usar `npm run test:cartera`. La sección 14 explica los indicadores y las pruebas agregadas y por tramo.

Para CP-04.1, CP-04.2 y CP-04.3, usar `npm run test:cp04`. La sección 13 documenta las pruebas de cancelación, devengo y cartera que ejecuta.

Para validar CP-03, selección por otorgamiento y conservación de contratos anteriores, usar `npm run test:coexistencia`. La sección 12 documenta la regla y sus pruebas.

Para las pruebas de cierre sin duplicar gastos y de pagos idempotentes, usar `npm run test:idempotencia`. Las entradas, salidas y condiciones de estas pruebas se documentan en la sección 11.

### Comando rápido

Desde la raíz del repositorio:

```sh
npm run test:mora
```

En PowerShell también se puede ejecutar `npm.cmd run test:mora`.

El script `test:mora`, definido en [package.json](../../package.json), ejecuta una sola vez estos cinco archivos: `politica-mora.test.ts`, `contrato-politica.test.ts`, `calculadora-mora.test.ts`, `regresion-p1.test.ts` y `contratos-p2.test.ts`. Incluye cálculo, contrato de estrategias, fechas, clasificación, regresión y contratos de salida. Ejecuta todas las pruebas de esos archivos, incluidas las comprobaciones históricas y de cartera que contienen; los casos propuestos en este documento no se ejecutan hasta implementarlos.

### Ejecución manual por archivos

Desde la raíz del repositorio, ejecutar las pruebas principales:

```powershell
npm.cmd test -- tests/politica-mora.test.ts tests/contrato-politica.test.ts
```

Para incluir fechas, clasificación, regresión y contratos de salida:

```powershell
npm.cmd test -- tests/politica-mora.test.ts tests/contrato-politica.test.ts tests/calculadora-mora.test.ts tests/regresion-p1.test.ts tests/contratos-p2.test.ts
```

En shells donde `npm.cmd` no corresponda, usar `npm`. Se requiere disponer de las dependencias del proyecto.

**Ejecución verificada:** `npm.cmd run test:mora` terminó con código 0, **5 archivos aprobados y 65 pruebas aprobadas**, con Vitest 4.1.11. Ese total incluye pruebas históricas de tasa directa y contratos de cartera de los archivos seleccionados; no son 65 pruebas exclusivas de mora escalonada.

| Criterio | Evidencia | Resultado de la verificación actual |
|---|---|---|
| Acumulación por tramos y ejemplos M-1 a M-4 | ME-01 a ME-07 | Aprobado en las aserciones existentes. |
| Clasificación en todas las fronteras | FE-12 a FE-21 | Aprobado. |
| Importe constante explícito en cada frontera y dentro de MORA_3 | Sección 4 | Documentado; pendientes las aserciones adicionales indicadas. |
| Redondeo único por cuota | ME-12 | Aprobado. |
| Vencimientos independientes | ME-13 | Aprobado para los importes comparados. |
| Monotonía, comparación y congelación | ME-14 | Aprobado en los recorridos indicados. |
| Conservación de contratos anteriores | ME-08 a ME-11, AP-01 y AP-02 | Aprobado. |
| Moneda, tope, no negatividad, determinismo e inmutabilidad | CT-01 a CT-03 | Aprobado para las entradas ensayadas. |
| Baja contable y conservación de mora | AP-03 a AP-05 | Aprobado. |
| Salida JSON y precisión decimal | Sección 8 | Aprobado. |
| Detalles adicionales y empate de redondeo | AD-01 a AD-05 | Propuestos; no ejecutados como tests específicos. |

Para registrar una ejecución posterior, anotar el identificador del caso, entrada utilizada, salida obtenida y resultado `Cumple / No cumple`. En casos monetarios debe compararse la cadena exacta a dos decimales; en detalles se conserva la precisión original y en casos inválidos se compara la excepción indicada.

## 11. Idempotencia en cierres: gasto único de GTQ25 y pagos sin duplicados

### Regla y alcance

Repetir un cierre debe conservar el gasto de gestión ya generado: **GTQ25 una sola vez por crédito, cuota y concepto `GESTION_COBRO`**, desde el día 31 de atraso. Repetir la fecha de cierre, avanzar a otro tramo o ejecutar un cierre posterior no autoriza un segundo cargo para esa misma cuota. Otra cuota puede generar su propio gasto de GTQ25.

Hay dos operaciones que se verifican por separado:

| Operación | Identidad utilizada | Resultado del reintento |
|---|---|---|
| Generar el gasto de gestión | Tupla serializada `[creditoId, cuotaId, "GESTION_COBRO"]` | `nuevo = null`; conserva el identificador registrado y no agrega GTQ25 al saldo. |
| Registrar y aplicar un pago | Crédito y `claveIdempotencia`; se compara la huella de la solicitud | Misma solicitud: devuelve el pago existente con `repetido = true`. Contenido diferente: conflicto. |

Generar el cargo aumenta el saldo exigible de gastos; registrar un pago distribuye dinero para cubrir obligaciones. El cierre no implica por sí mismo que el cliente haya pagado. Ambas operaciones deben evitar duplicados dentro de su propio alcance.

Implementación: [gasto-gestion-cobro.ts](../../src/dominio/gasto-gestion-cobro.ts), [registrar-pago.ts](../../src/aplicacion/registrar-pago.ts) y [pago-idempotente.ts](../../src/dominio/pago-idempotente.ts).

### Secuencia de un cierre repetido

Inputs comunes: crédito `CR-1`, cuota `2`, vencimiento `2026-10-01`, moneda GTQ. El primer cierre recibe `identificadoresRegistrados = []`; cada cierre posterior recibe la lista devuelta por el anterior.

| Ejecución | Corte | Días de atraso | Output `nuevo` | Identificadores acumulados | Gasto generado acumulado |
|---|---|---:|---|---:|---:|
| Primer cierre elegible | `2026-11-01` | 31 | Evento `GESTION_COBRO`, importe `"25.00"` | 1 | 25.00 |
| Repetición del mismo cierre | `2026-11-01` | 31 | `null` | 1 | 25.00 |
| Cierre en MORA_3 | `2026-12-10` | 70 | `null` | 1 | 25.00 |
| Cierre en VENCIDO | `2027-01-15` | 106 | `null` | 1 | 25.00 |
| Cierre con atraso superior a 120 | `2027-03-01` | 151 | `null` | 1 | 25.00 |

**Resultado esperado:** una sola identidad `["CR-1","2","GESTION_COBRO"]` y gasto total generado `"25.00"`. Un total de `"50.00"` tras repetir el primer cierre sería `No cumple`. El gasto generado acumulado de esta tabla no representa el saldo pendiente después de pagos.

**Condición necesaria:** el llamador debe conservar juntos los identificadores devueltos y los saldos actualizados. `generarGastoGestion` es una función pura; volver a enviar una lista vacía vuelve a calcular un evento nuevo. `incorporarGastoGestion` suma el evento recibido y no mantiene un registro propio: aplicar dos veces el mismo resultado con `nuevo` no nulo duplicaría el cargo. Para un reintento se debe generar el resultado con la lista actualizada, obteniendo `nuevo = null`.

### Pruebas de generación del gasto e integración con pagos

Archivo: [gasto-gestion-cobro.test.ts](../../tests/gasto-gestion-cobro.test.ts). Inputs comunes: los indicados en la secuencia anterior, salvo cambios explícitos.

| ID / nombre del test | Inputs | Outputs esperados y criterio automatizado |
|---|---|---|
| IG-01 a IG-04: `no genera hasta 30 días: %s` | Cortes `2026-10-01`, `2026-10-02`, `2026-10-16`, `2026-10-31` (0, 1, 15 y 30 días); sin registros previos | `nuevo === null` en cada caso; no hay cargo antes del día 31. |
| IG-05: `genera Q25 al día 31, sin mutar entradas` | Corte `2026-11-01`; registros vacíos | Evento con importe `"25.00"` y concepto `GESTION_COBRO`; la lista original permanece vacía y el evento está congelado. |
| IG-06: `invariante 6: repetir el cierre y cambiar de tramo no duplica` | Los cinco cierres de la tabla, reutilizando los registros devueltos | Al finalizar, exactamente 1 identificador y suma de eventos nuevos `"25.00"`. El test comprueba el resultado acumulado; los outputs por paso de la tabla explican el comportamiento. |
| IG-07: `distingue créditos y cuotas incluso con separadores en sus identificadores` | Pares crédito/cuota `a:b`/`c`, `a`/`b:c`, `CR-1`/`3`; corte `2026-11-01`; propagar los registros entre llamadas | La lista final tiene 3 identidades. La serialización de tuplas evita confundir identificadores que contienen `:` y permite cargos de cuotas distintas. |
| IG-08: `M-5 y pago sin gasto al corte %s`, variante 45 días | Corte `2026-11-15`; capital `725.76`, corriente `278.86`, mora escalonada `18.14`, gastos iniciales `0`; pago `1047.76` | Aplica `25.00` a gastos; orden gastos → mora → corriente → capital; todos los saldos pendientes y excedente quedan en cero. Regenerar con los identificadores devueltos e incorporar a los saldos exigibles originales ya cargados conserva gastos `25.00`, no `50.00`. |
| IG-09: mismo test, variante 15 días | Corte `2026-10-16`; capital `725.76`, corriente `278.86`, mora `5.44`, gastos iniciales `0`; pago `1010.06` | Aplica `0.00` a gastos, mantiene el orden de prelación y deja pendientes y excedente en cero. Repetir la generación e incorporación mantiene gastos `0.00`. |
| IG-10: `un abono insuficiente cubre gastos primero` | Corte `2026-11-01`; gasto generado `25.00`, mora `18.14`, corriente `278.86`, capital `725.76`; abono `20.00` | Pendiente de gastos `"5.00"`; aplicado a mora `"0.00"`. Verifica prelación, no un reintento de pago. |

IG-08 e IG-09 comprueban que el cargo no se incorpora nuevamente, pero no ejecutan dos veces `RegistrarPago`. La protección del registro del pago se verifica en las pruebas siguientes. En IG-10, la mora `18.14` es un saldo suministrado por el test, no un cálculo de mora para el día 31.

### Pruebas de registro idempotente de pagos

Archivo: [pago-idempotencia.test.ts](../../tests/pago-idempotencia.test.ts). Cada prueba inicia con un repositorio en memoria vacío y un generador secuencial de identificadores, salvo la comparación directa de huellas.

Inputs predeterminados: crédito `CR-001`, clave `pago-2026-0001`, importe GTQ500.00, fecha `2026-04-25`, usuario `caja-01`. Saldos exigibles: gastos `0.00`, mora `7.26`, corriente `278.86`, capital `725.76`. Contexto de excedente: capital no exigible y cuotas futuras de `5000.00` cada uno.

| ID / nombre del test | Inputs / acciones | Outputs esperados y criterio automatizado |
|---|---|---|
| IP-01: `crea y aplica el primer pago una sola vez` | Ejecutar el comando predeterminado una vez | `repetido = false`, `pagoId = "PAGO-1"`, importe de aplicación `"500.00"`, 1 pago almacenado y 1 llamada al generador de IDs. |
| IP-02: `reintentar exactamente lo mismo devuelve el mismo resultado` | Ejecutar dos veces el mismo comando en el mismo servicio | Segundo resultado con `repetido = true`; `segundo.pago` es el mismo objeto que `primero.pago`; siguen existiendo 1 pago y 1 llamada al generador. |
| IP-03: `misma clave con importe diferente produce conflicto sin reemplazar` | Registrar `500.00`; reintentar con la misma clave y crédito pero importe `501.00` | Excepción `ConflictoIdempotencia`; siguen existiendo 1 pago y 1 llamada al generador; el importe original permanece `"500.00"`. |
| IP-04: `la misma clave puede usarse en otro crédito por el alcance definido` | Clave `clave-compartida`, importe `500.00`, créditos `CR-001` y `CR-002` | 2 pagos y 2 llamadas al generador: son operaciones de créditos distintos. |
| IP-05 a IP-08: `rechaza clave inválida` | Cada clave: cadena vacía, `con espacio`, `á`, 256 caracteres `x` | Cada ejecución lanza `ClaveIdempotenciaInvalida`; se admiten de 1 a 255 caracteres ASCII visibles sin espacios. |
| IP-09: `la huella distingue fecha y actor además del importe` | Dos huellas para `CR-1`, importe `500.00`, GTQ, usuario `caja-1`, cambiando fecha de `2026-01-01` a `2026-01-02` | `esIgualA(...) === false`. Aunque el nombre menciona al actor, la aserción existente cambia únicamente la fecha; no prueba explícitamente un cambio de usuario. |

La huella implementada incluye crédito, importe, moneda, fecha de pago y usuario. En un reintento debe conservarse la misma clave para el mismo pago. Una clave nueva identifica otra operación y no activa la recuperación del pago anterior. Los saldos exigibles y el contexto de excedente no forman parte de esa huella.

### Alcance comprobado y condiciones de integración

Las pruebas verifican secuencias de llamadas en memoria. El repositorio de prueba implementa `ejecutarUnaVez`: al encontrar crédito y clave con la misma huella devuelve el pago almacenado sin volver a ejecutar su creación y cálculo de aplicación. Un consumidor no debe tratar el resultado con `repetido = true` como una nueva instrucción para descontar saldos.

No hay en estos archivos una prueba integral de un cierre persistente que genere el gasto, registre el pago y confirme ambos cambios en una transacción, ni pruebas de cierres concurrentes o recuperación tras reinicio. La futura persistencia debe conservar el registro del gasto junto con su saldo y asegurar la unicidad del pago y su aplicación. La evidencia actual acredita el comportamiento de los componentes bajo las condiciones descritas.

### Comando para ejecutar estas pruebas

Desde la raíz del repositorio:

```sh
npm run test:idempotencia
```

En PowerShell: `npm.cmd run test:idempotencia`.

El script está definido en [package.json](../../package.json) y ejecuta únicamente los dos archivos documentados en esta sección:

```sh
vitest run tests/gasto-gestion-cobro.test.ts tests/pago-idempotencia.test.ts
```

**Resultado esperado:** 2 archivos y 19 pruebas aprobadas, con código de salida 0. Incluye los casos parametrizados; las iteraciones de IG-06 cuentan como una sola prueba. `npm run test:mora` conserva su selección anterior; para verificar también esta sección se usa el nuevo comando.

**Ejecución verificada al documentar esta sección:** `npm.cmd run test:idempotencia` finalizó con código 0; Vitest 4.1.11 reportó **2 archivos aprobados y 19 pruebas aprobadas**.

## 12. CP-03: coexistencia de política plana y escalonada

### Regla de selección y conservación

**Ambas políticas deben funcionar al mismo tiempo en el sistema.** La política aplicable depende de la **fecha de otorgamiento de cada crédito**, con fecha de cambio **1 de octubre de 2026**, inclusive para la nueva política.

| Fecha de otorgamiento | Política aplicable | Regla de mora |
|---|---|---|
| Anterior a `2026-10-01` | `POL-2024-01`, plana histórica | Tasa nominal anual del 24%, con base Actual/360. |
| Desde `2026-10-01`, inclusive | `POL-2026-10`, escalonada | 18% en días 1–30; 24% en 31–60; 30% en 61–90; 36% en 91–120; sin devengo adicional después del día 120. |

Un crédito otorgado el 30 de septiembre de 2026 conserva la política plana aunque su cuota venza o su cierre se ejecute después del 1 de octubre. El avance del calendario no migra los créditos anteriores a escalonada. La fecha de corte determina los días de atraso; la fecha de otorgamiento determina la política. La política plana es del **24% anual**, no un cargo fijo del 24% por cuota o por mes.

La aplicación [consultarMora](../../src/aplicacion/consultar-mora.ts) utiliza [resolverPolitica](../../src/dominio/politica-mora/catalogo-politicas.ts) e inyecta la estrategia seleccionada en el motor. El catálogo aplica esta condición:

```text
si fechaOtorgamiento < 2026-10-01:
    usar POL-2024-01 (plana 24%)
en otro caso:
    usar POL-2026-10 (escalonada)
```

La coexistencia permite atender créditos de ambas generaciones en el mismo proceso y con el mismo corte. No requiere cambiar una configuración global para alternar entre ellos. La política retroactiva utilizada como doble en algunas pruebas no es una tercera política seleccionable en producción.

### Ejemplo de ambas políticas en un mismo corte

Inputs comunes: cuota con capital vencido GTQ725.76, vencimiento `2026-11-01`, corte `2026-11-16` y estado `EN_MORA`. Ambas consultas tienen 15 días de atraso.

| Otorgamiento | Output: política esperada | Cálculo de referencia | Output: mora esperada |
|---|---|---|---|
| `2026-09-30` | `POL-2024-01` | `725.76 × 0.24 × 15 / 360 = 7.2576` | `"7.26"` |
| `2026-10-01` | `POL-2026-10` | `725.76 × 0.18 × 15 / 360 = 5.4432` | `"5.44"` |

**Resultado esperado:** conservar ambos resultados en la misma ejecución de pruebas. Aplicar `"5.44"` al otorgamiento anterior o `"7.26"` al nuevo incumple CP-03. El interés se redondea al final de cada cuota conforme a la sección 2.

### Pruebas existentes que verifican CP-03

| ID | Archivo / test | Inputs | Outputs y criterio de aprobación |
|---|---|---|---|
| CO-01 | `politica-mora.test.ts`: `elige por otorgamiento 2026-09-30` | Otorgamiento `2026-09-30`, capital GTQ725.76, 15 días | Política `POL-2024-01` y mora `"7.26"`. Comprueba el día anterior a la vigencia. |
| CO-02 | `politica-mora.test.ts`: `elige por otorgamiento 2026-10-01` | Otorgamiento `2026-10-01`, mismo capital y atraso | Política `POL-2026-10` y mora `"5.44"`. Comprueba que la fecha límite está incluida. |
| CO-03 | `politica-mora.test.ts`: `elige por otorgamiento 2027-01-01` | Otorgamiento `2027-01-01`, mismo capital y atraso | Política `POL-2026-10` y mora `"5.44"`. Comprueba otorgamientos posteriores. |
| CO-04 | `politica-mora.test.ts`: `conserva la plana de 45 días` | Estrategia plana, capital GTQ725.76, 45 días | Mora `"21.77"`, preservando la fórmula histórica. Con escalonada el ejemplo ME-03 exige `"18.14"`. |
| CO-05 | `regresion-p1.test.ts`: `invariante 5: los otorgamientos previos mantienen 7.26 con cortes posteriores a la nueva vigencia` | Las dos variantes del ejemplo anterior, consultadas sucesivamente dentro del mismo test | La anterior devuelve `POL-2024-01` y `"7.26"`; la nueva devuelve `"5.44"`. El test de aplicación compara esos campos; CO-02 comprueba explícitamente el ID de la nueva política. |
| CO-06 | `regresion-p1.test.ts`: `conserva API de tasa directa y CA-02` | Fachada histórica, capital GTQ725.76, tasa `0.24`, 15 días | Mora `"7.26"`; conserva compatibilidad de la API anterior. Esta prueba no selecciona política por fecha. |

Fuentes ejecutables: [politica-mora.test.ts](../../tests/politica-mora.test.ts) y [regresion-p1.test.ts](../../tests/regresion-p1.test.ts). CO-01 a CO-06 corresponden a ME-08 a ME-11 y AP-01/AP-02 ya descritos: son referencias a las mismas pruebas, no pruebas nuevas duplicadas.

CO-05 usa dos variantes de datos con el mismo identificador sintético `C` para aislar el efecto del otorgamiento; no modifica un crédito persistido. Verifica que ambas políticas están disponibles en el mismo proceso mediante consultas sucesivas. No es una prueba de concurrencia ni de migración en base de datos.

### Comando para validar la coexistencia

Desde la raíz del repositorio:

```sh
npm run test:coexistencia
```

En PowerShell también puede usarse `npm.cmd run test:coexistencia`. El script definido en [package.json](../../package.json) ejecuta:

```sh
vitest run tests/politica-mora.test.ts tests/regresion-p1.test.ts
```

**Resultado esperado:** 2 archivos y 19 pruebas aprobadas, con código de salida 0. El comando ejecuta todas las pruebas de esos dos archivos: incluye CO-01 a CO-06, cálculo escalonado y regresiones relacionadas con congelación y validación de fechas. No ejecuta toda la suite del proyecto.

**Ejecución verificada:** `npm.cmd run test:coexistencia` finalizó con código 0; Vitest 4.1.11 reportó **2 archivos aprobados y 19 pruebas aprobadas**.

## 13. CP-04: cancelación, suspensión de interés corriente y cartera

### CP-04.1: cancelar un crédito EN_MORA mediante liquidación

**Regla:** la transición `EN_MORA → CANCELADO` requiere saldo total exactamente GTQ0.00 y cero cuotas vencidas pendientes. El saldo suministrado debe incluir gastos, interés moratorio, interés corriente y capital después de aplicar el pago. `liquidarConPago` valida las condiciones de cancelación; el llamador proporciona el saldo y la cantidad de cuotas pendientes. Debe quedar evidencia en el historial. Un crédito `SOLICITADO` no admite pago ni cancelación.

Archivo: [credito-cancelacion-p2.test.ts](../../tests/credito-cancelacion-p2.test.ts), suite `CP-04.1: pago que liquida EN_MORA`.

**Preparación común:** crédito `C` aprobado, desembolsado, activado y llevado a `EN_MORA` con 45 días de atraso. Evidencia: fecha `2026-12-01`, usuario `prueba`, motivo `pago total`. Importes en GTQ.

| ID / test | Inputs | Outputs esperados y criterio de aprobación |
|---|---|---|
| CA-01: `cancela con saldo exacto cero, sin pendientes y evidencia` | `liquidarConPago(evidencia, "0.00", 0)` sobre el crédito en mora | Estado `CANCELADO`; última entrada del historial con anterior `EN_MORA`, nuevo `CANCELADO` y la misma fecha, usuario y motivo. |
| CA-02: `rechaza saldo 0.01 y pendientes 0` | Saldo `"0.01"`, pendientes 0 | Excepción; conserva `EN_MORA` y la longitud del historial. Un centavo pendiente impide cancelar. |
| CA-03: `rechaza saldo 0 y pendientes 1` | Saldo `"0.00"`, pendientes 1 | Excepción; conserva estado e historial. No basta el saldo cero si hay una cuota vencida pendiente. |
| CA-04: `rechaza saldo -0.01 y pendientes 0` | Saldo `"-0.01"`, pendientes 0 | Excepción; conserva estado e historial. La guarda exige cero exacto. |
| CA-05: `rechaza saldo 0 y pendientes -1` | Saldo `"0.00"`, pendientes -1 | Excepción; conserva estado e historial. El contador no puede ser negativo. |
| CA-06: `rechaza saldo 0 y pendientes 1.5` | Saldo `"0.00"`, pendientes 1.5 | Excepción; conserva estado e historial. El contador debe ser entero. |
| CA-07: `SOLICITADO no puede pagar ni cancelar con ninguna fachada` | Crédito nuevo `S`; intentar `liquidarConPago(e, cero, 0)`, `cancelar(e, true, true)` y `registrarPagoParcial(e, true)` | Cada llamada lanza `TransicionInvalida`; historial con 0 entradas. |

**Alcance comprobado:** 7 pruebas. El caso válido comprueba la evidencia registrada; los cinco casos de guardas fallidas comprueban una excepción sin exigir su clase concreta. No se simula aquí el procesamiento monetario previo del pago ni una transacción persistente.

### CP-04.2: suspensión cuantificable del interés corriente

**Regla:** hasta el día 90 inclusive, el interés corriente se reconoce como ingreso. Desde el día 91, los importes se acumulan en `interesEnSuspenso`. Al regularizar, se libera ese suspenso al ingreso del período y se reactiva el devengo. Esta regla corresponde al interés corriente; la mora escalonada continúa según sus propios tramos.

Archivo: [devengo-interes.test.ts](../../tests/devengo-interes.test.ts), suite `CP-04.2: devengo monetario por corte`. Implementación: [devengo-interes.ts](../../src/dominio/devengo-interes.ts).

**Contrato de entrada:** cada movimiento contiene fecha, días de atraso e importe incremental correspondiente a esa fecha; no debe reenviar un importe acumulado de períodos anteriores. Las fechas y montos son explícitos. Los movimientos deben estar ordenados, sin fechas repetidas, posteriores al último corte y no posteriores al corte solicitado. El modelo recibe los importes; no calcula una tasa corriente ni reparte automáticamente un monto que cruce el día 90.

**Preparación común:** `DevengoInteres.iniciar("CR-1", "GTQ")`; aplicar corte `2026-12-30` con un movimiento de esa fecha, atraso 90 e importe `"10.00"`. Se obtiene `dia90` con ingreso reconocido `"10.00"` y suspenso `"0.00"`. La lista `pendientes` contiene dos movimientos de GTQ10.00: `2026-12-31` (91 días) y `2027-01-09` (100 días).

| ID / nombre del test | Inputs / acciones | Outputs esperados y criterio de aprobación |
|---|---|---|
| DE-01: `día 90 reconoce; días 91 y 100 acumulan suspenso sin aumentar ingreso` | Sobre `dia90`, corte `2027-01-09` con `pendientes` | Ingreso acumulado `"10.00"`, suspenso `"20.00"`, reconocido en período `"0.00"`, `devengoActivo = false`. El objeto anterior conserva suspenso `"0.00"`. |
| DE-02: `regulariza, reconoce el suspenso una vez y reactiva` | Sobre el suspendido de DE-01, corte `2027-01-10`, movimientos `[]`, `regularizado = true`; repetir exactamente ese corte | Ingreso acumulado `"30.00"`, reconocido en período `"20.00"`, suspenso `"0.00"`, devengo activo. Repetir devuelve el mismo objeto. |
| DE-02, continuación del mismo test | Corte siguiente `2027-01-11`, movimiento de esa fecha, atraso 0, importe `"10.00"`, `regularizado = true` | Ingreso acumulado `"40.00"`; reconocido en período `"10.00"`. No reconoce otra vez los GTQ20.00 liberados. |
| DE-03: `repetir un corte no duplica ni acepta cambios de importe` | Aplicar y repetir `2027-01-09` con `pendientes`; después repetir esa fecha con un único movimiento de atraso 100 e importe `"21.00"` | Repetición idéntica devuelve el mismo objeto. Contenido diferente lanza error que contiene `Conflicto`. |
| DE-04: `rechaza solapamiento, fechas futuras, regresión y duplicados` | Cuatro entradas inválidas detalladas debajo | Cada llamada lanza el error indicado; no produce un nuevo resultado válido. |
| DE-05: `rechaza importes negativos y monedas diferentes sin efectos parciales` | Sobre `dia90`, corte `2026-12-31`: movimiento de esa fecha con atraso 91 e importe `"-1.00"` GTQ; en otra llamada, importe `"10.00"` USD | El negativo lanza error que contiene `negativo`; la moneda distinta lanza excepción. `dia90.ingresoReconocido` permanece `"10.00"`. |

Entradas de DE-04, siempre partiendo de `dia90`:

| Variante | Corte solicitado | Movimientos | Error esperado |
|---|---|---|---|
| Corte regresivo | `2026-12-29` | Ninguno | Mensaje contiene `regresivo`. |
| Fecha ya incluida en el corte anterior | `2026-12-31` | `2026-12-30`, atraso 90, GTQ10.00 | Mensaje contiene `fuera de período`. |
| Movimiento posterior al corte | `2026-12-31` | `2027-01-01`, atraso 92, GTQ10.00 | Mensaje contiene `fuera de período`. |
| Movimiento duplicado | `2026-12-31` | Dos veces `2026-12-31`, atraso 91, GTQ10.00 | Mensaje contiene `duplicado`. |

**Alcance comprobado:** 5 pruebas, con varias acciones y aserciones por prueba. La idempotencia permite repetir el **último corte** con las mismas entradas, sobre el estado devuelto. Un corte anterior se rechaza como regresivo. `reconocidoEnPeriodo` permanece visible al repetir el último corte; el consumidor no debe contabilizarlo otra vez como un evento nuevo. Este modelo contable no ejecuta por sí mismo una transición de estado de `Credito`.

### CP-04.3: cartera por tramo, mora y bajas del período

**Regla:** devolver cartera activa, cartera en mora, total en riesgo, contribuciones por tramo y bajas incobrables del período, conservando el resultado agregado anterior. Cada fila de riesgo informa cantidad de créditos, capital y porcentaje sobre cartera activa.

Las filas `tramosEnRiesgo` representan **contribuciones al riesgo**: MORA_1 aporta cero porque el riesgo por atraso comienza después de 30 días. Cartera en mora incluye capital activo con atraso mayor que cero. Un reestructurado aporta al riesgo aun estando al día y se cuenta una sola vez en REESTRUCTURADO. Un crédito activo con más de 120 días sigue contribuyendo a VENCIDO hasta su declaración contable como incobrable.

Archivo: [cartera-por-tramo.test.ts](../../tests/cartera-por-tramo.test.ts), suite `CP-04.3: desglose de contribuciones al riesgo`. Implementación: [cartera-por-tramo.ts](../../src/dominio/cartera-por-tramo.ts).

**Inputs comunes:** moneda GTQ, inicio de período `2027-01-01`, corte `2027-02-01`. Fotografía base:

| Crédito | Capital GTQ | Días de atraso | Estado |
|---|---:|---:|---|
| C-001 | 24000.00 | 45 | EN_MORA |
| C-002 | 18000.00 | 75 | EN_MORA |
| C-005 | 8000.00 | 100 | EN_MORA |
| C-R | 6000.00 | 0 | REESTRUCTURADO |
| C-M1 | 124000.00 | 15 | EN_MORA |
| C-V | 620000.00 | 0 | VIGENTE |

#### CR-01: `cumple oráculo: 7.00% en riesgo y 21.75% en mora`

**Entrada:** fotografía base. **Outputs comprobados por tramo:**

| Contribución al riesgo | Cantidad de créditos | Capital GTQ | Porcentaje sobre activa |
|---|---:|---:|---:|
| MORA_1 | 0 | 0.00 | `"0.00"` |
| MORA_2 | 1 | 24000.00 | `"3.00"` |
| MORA_3 | 1 | 18000.00 | `"2.25"` |
| VENCIDO | 1 | 8000.00 | `"1.00"` |
| REESTRUCTURADO | 1 | 6000.00 | `"0.75"` |

**Otros outputs y criterio:** activa `"800000.00"`; riesgo `"56000.00"` y porcentaje `"7.00"`; mora `"174000.00"` y porcentaje `"21.75"`. Todas las cadenas y las filas deben coincidir exactamente.

El riesgo suma `24000 + 18000 + 8000 + 6000 = 56000`. La mora suma `124000 + 24000 + 18000 + 8000 = 174000`. C-R aporta al riesgo pero está al día; C-M1 aporta a mora pero no al riesgo.

#### CR-02: `excluye C-005 y conserva la baja del período; riesgo = 6.06%`

- **Inputs:** fotografía base modificando C-005 a `INCOBRABLE`, atraso 121; baja de ese crédito con fecha `2027-01-31` y capital GTQ8000.00.
- **Outputs:** activa `"792000.00"`, riesgo `"48000.00"`, porcentaje `"6.06"`; capital incobrable del período `"8000.00"` y primer identificador de baja `C-005`.
- **Criterio:** igualdad exacta de esos campos. La baja reduce el denominador y el numerador del riesgo: `48000 / 792000 × 100 ≈ 6.06%`; conserva visible el capital dado de baja.

#### CR-03: `invariante 7: concilia porcentajes incluso cuando redondear cada razón perdería centésimas`

- **Inputs:** tres créditos EN_MORA, IDs `1`, `2`, `3`, cada uno con GTQ1.00 y atrasos 31, 61 y 91, respectivamente.
- **Outputs:** porcentajes en orden MORA_1/MORA_2/MORA_3/VENCIDO/REESTRUCTURADO: `["0.00", "33.34", "33.33", "33.33", "0.00"]`.
- **Criterio:** esa lista exacta; suma de porcentajes en centésimas igual al porcentaje total; suma de capitales de las filas igual al capital total en riesgo. El total de referencia es 100.00% sobre GTQ3.00.
- **Regla de presentación:** se distribuyen las centésimas por restos mayores, con desempate por orden de tramo. Este ajuste porcentual no cambia capitales y no autoriza redondear aportes monetarios por tramo en el cálculo de mora.

#### CR-04: `evita doble conteo de reestructurados y conserva >120 pendientes de declaración como vencido`

- **Inputs:** crédito `R`, REESTRUCTURADO, capital GTQ100.00, atraso 65; crédito `V`, EN_MORA, capital GTQ200.00, atraso 121.
- **Outputs comprobados:** riesgo `"300.00"`, contribución MORA_3 `"0.00"`, contribución VENCIDO `"200.00"`.
- **Criterio:** igualdad exacta; R no se suma otra vez a MORA_3 y V permanece en el riesgo mientras no se declare incobrable. La contribución esperada de REESTRUCTURADO es GTQ100.00, aunque este test no compara ese campo directamente.

#### CR-05: `sin activa no inventa un cociente`

- **Inputs:** lista de créditos vacía, período y moneda comunes.
- **Outputs y criterio:** `agregado.tipo === "SIN_CARTERA_ACTIVA"`, porcentaje total de riesgo `null` y porcentaje de todas las filas `null`. No sustituir la ausencia de denominador por 0% ni por un valor no finito.

#### CR-06: `filtra bajas por período, valida duplicados y estado`

| Variante | Inputs | Output esperado / criterio |
|---|---|---|
| Baja anterior al período | Sin créditos; baja de `B`, `2026-12-31`, GTQ8.00 | Cantidad de incobrables del período igual a 0. |
| Baja duplicada | Sin créditos; dos copias de la baja anterior | Excepción cuyo mensaje contiene `duplicada`. |
| Baja incompatible con el estado presente | Fotografía base; baja con fecha e importe anteriores, cambiando el ID a `C-005`, cuyo estado sigue EN_MORA | Excepción cuyo mensaje contiene `estado`. |

El período de bajas es inclusivo entre inicio y corte según la implementación; CR-06 prueba una baja anterior, no todas las fronteras del período. **Alcance de CP-04.3:** 6 pruebas con los casos y aserciones descritos.

### Comando conjunto y resultado esperado

Desde la raíz del repositorio:

```sh
npm run test:cp04
```

En PowerShell también puede usarse `npm.cmd run test:cp04`. El script de [package.json](../../package.json) ejecuta únicamente:

```sh
vitest run tests/credito-cancelacion-p2.test.ts tests/devengo-interes.test.ts tests/cartera-por-tramo.test.ts
```

**Criterio de aprobación:** código de salida 0 y **18 pruebas aprobadas en 3 archivos**: 7 de CP-04.1, 5 de CP-04.2 y 6 de CP-04.3. Los casos parametrizados de cancelación cuentan como pruebas independientes; las variantes dentro de un mismo test de devengo o cartera no incrementan ese conteo.

**Ejecución verificada:** `npm.cmd run test:cp04` terminó con código 0; Vitest 4.1.11 reportó **3 archivos aprobados y 18 pruebas aprobadas**.

## 14. Cartera en mora y cartera en riesgo

### Definiciones, entradas y salidas

Estos indicadores usan el **saldo completo de capital de cada crédito** de la fotografía. No suman solamente cuotas vencidas ni incorporan intereses o gastos al capital de cartera.

| Indicador | Créditos incluidos | Cálculo |
|---|---|---|
| Cartera activa | Estados DESEMBOLSADO, VIGENTE, EN_MORA y REESTRUCTURADO | Suma de sus saldos de capital. |
| Cartera en mora | Créditos activos con `diasAtraso > 0` | Suma de su capital; porcentaje = capital en mora / cartera activa × 100. |
| Cartera en riesgo | Créditos activos con `diasAtraso > 30` **o** estado REESTRUCTURADO | Suma de su capital una sola vez; porcentaje = capital en riesgo / cartera activa × 100. |

Un crédito de 15 días aporta a mora pero no al riesgo por atraso. Un reestructurado al día aporta a riesgo pero no a mora. Si está reestructurado y atrasado, puede pertenecer a ambos indicadores, pero se cuenta una sola vez dentro de cada uno. Por eso los indicadores no se suman entre sí.

Los estados SOLICITADO, APROBADO, RECHAZADO, ANULADO, CANCELADO e INCOBRABLE quedan fuera de la cartera activa. Un atraso superior a 120 días no sustituye la declaración contable de incobrable: mientras conserve un estado activo, el crédito sigue incluido. El cálculo consume los días y el estado proporcionados; no realiza esa transición.

| Operación | Inputs | Outputs relevantes |
|---|---|---|
| `CalculadoraCarteraRiesgo.calcular` | Lista de `{ id, saldoCapital, diasAtraso, estado }` y moneda | `tipo`, `carteraActiva`, `capitalEnRiesgo` y, si existe denominador, `razon`. |
| `calcularCarteraPorTramo` | Fotografía de créditos, moneda, `inicioPeriodo`, `fechaCorte` y bajas opcionales | `agregado`, `carteraActiva`, `carteraEnMora`, `totalEnRiesgo`, `tramosEnRiesgo` e `incobrablesDelPeriodo`. |

La API agregada histórica solo calcula riesgo. La operación por tramo incorpora el indicador de mora. `razon.aRazonCadena()` devuelve una fracción, por ejemplo `"0.07"`; `razon.aPorcentajeCadena()` devuelve `"7.00"`. Los porcentajes del desglose también están en escala 0–100.

Sin capital activo, el agregado devuelve `SIN_CARTERA_ACTIVA` sin propiedad `razon`; en el desglose los porcentajes son `null`. Esto es diferente de una cartera activa positiva con riesgo cero, que sí tiene porcentaje `"0.00"`.

Fuentes: [cartera.ts](../../src/dominio/cartera.ts) y [cartera-por-tramo.ts](../../src/dominio/cartera-por-tramo.ts).

### Pruebas del cálculo agregado de riesgo

Archivo: [cartera.test.ts](../../tests/cartera.test.ts). Salvo indicación contraria, moneda GTQ y estado de entrada VIGENTE. Cada fila indica las aserciones actuales; los casos parametrizados se cuentan individualmente.

Fotografía de referencia para RC-01 y RC-02: C-001 con GTQ48000.00 y 31 días; C-002 con GTQ744000.00 y 0 días; C-005 con GTQ8000.00 y 121 días, variando su estado. Esta fotografía histórica es distinta de la fotografía de seis créditos de CP-04.3, aunque produce los mismos totales iniciales de riesgo.

| ID / nombre del test | Inputs | Outputs esperados y criterio de aprobación |
|---|---|---|
| RC-01: `cumple CA-06: Q56,000 / Q800,000 = 7.00%` | Fotografía de referencia; C-005 EN_MORA | `CON_RAZON`, activa `"800000.00"`, riesgo `"56000.00"`, razón `"0.07"`, porcentaje `"7.00"`. |
| RC-02: `cumple CA-07: excluye C-005 y obtiene 6.06%` | Misma fotografía; C-005 INCOBRABLE | `CON_RAZON`, activa `"792000.00"`, riesgo `"48000.00"`, porcentaje `"6.06"`. |
| RC-03: `usa el saldo completo, no una cuota vencida` | C-1, capital `10000.00`, atraso 31 | Resultado con razón, riesgo `"10000.00"`, porcentaje `"100.00"`. |
| RC-04: `30 días no es riesgo y 31 días sí` | C-30 y C-31, capital `100.00` cada uno, atrasos 30 y 31 | Resultado con razón, riesgo `"100.00"`, porcentaje `"50.00"`. |
| RC-05: `incluye reestructurado al día` | R-1 REESTRUCTURADO, capital `200.00`, atraso 0; V-1 VIGENTE, capital `800.00`, atraso 0 | Resultado con razón, riesgo `"200.00"`, porcentaje `"20.00"`. |
| RC-06: `no duplica un reestructurado que además tiene más de 30 días` | Misma composición de RC-05, cambiando R-1 a atraso 31 | Resultado con razón y riesgo `"200.00"`, sin duplicar el capital de R-1. |
| RC-07 a RC-12: `excluye del ciclo activo el estado %s` | Un crédito X de `100.00`, atraso 200; un caso por estado SOLICITADO, APROBADO, RECHAZADO, ANULADO, CANCELADO e INCOBRABLE | `tipo === "SIN_CARTERA_ACTIVA"` en cada caso. |
| RC-13: `devuelve SIN_CARTERA_ACTIVA para una fotografía vacía` | Lista `[]` | `SIN_CARTERA_ACTIVA`; activa y riesgo `"0.00"`; no existe propiedad `razon`. |
| RC-14: `produce los extremos válidos 0% y 100%` | Dos consultas: crédito C-0 de `100.00` al día; crédito C-1 de `100.00` con atraso 31 | Ambas con razón: porcentajes `"0.00"` y `"100.00"`, respectivamente. |
| RC-15: `rechaza identificadores duplicados` | Dos créditos con ID C-1, capitales `10.00` y `20.00`, atraso 0 | Excepción `CreditoCarteraDuplicado`. |
| RC-16 a RC-18: `rechaza días inválidos %s` | C-1 de `10.00`; un caso por atraso -1, 1.5 y NaN | Excepción `CreditoCarteraInvalido` en cada caso. |
| RC-19: `rechaza saldo negativo` | C-1, capital `-0.01`, atraso 0 | Excepción `CreditoCarteraInvalido`. |
| RC-20: `rechaza monedas mezcladas incluso en créditos excluidos` | Moneda solicitada GTQ; C-1 INCOBRABLE, capital USD10.00, atraso 121 | Excepción `MonedasIncompatibles`, aun cuando el estado excluiría al crédito. |
| RC-21: `congela los resultados` | Consulta con C-1, capital `100.00`, atraso 0; otra consulta con lista vacía | `Object.isFrozen(...) === true` para ambos resultados. |

**Criterio general:** igualdad exacta de las cadenas monetarias, porcentajes y tipos indicados; para entradas inválidas, la clase de excepción especificada. Estas 21 pruebas verifican el agregado de riesgo, no el campo `carteraEnMora`.

### Pruebas de cartera en mora y comparación con riesgo

Archivo: [cartera-por-tramo.test.ts](../../tests/cartera-por-tramo.test.ts). Las seis pruebas CR-01 a CR-06 están documentadas con sus entradas y salidas completas en la sección 13, CP-04.3, y también se ejecutan con el comando de esta sección.

La prueba `cumple oráculo: 7.00% en riesgo y 21.75% en mora` verifica explícitamente ambos indicadores sobre una misma fotografía. Inputs: GTQ620000.00 al día, GTQ124000.00 a 15 días, GTQ24000.00 a 45, GTQ18000.00 a 75, GTQ8000.00 a 100 y GTQ6000.00 reestructurados al día. Corte `2027-02-01`, inicio de período `2027-01-01`.

| Output | Operación de referencia | Resultado esperado comprobado |
|---|---|---|
| `carteraActiva` | Suma de los seis capitales | `"800000.00"` |
| `carteraEnMora.saldoCapital` | `124000 + 24000 + 18000 + 8000` | `"174000.00"` |
| `carteraEnMora.porcentaje` | `174000 / 800000 × 100` | `"21.75"` |
| `totalEnRiesgo.saldoCapital` | `24000 + 18000 + 8000 + 6000` | `"56000.00"` |
| `totalEnRiesgo.porcentaje` | `56000 / 800000 × 100` | `"7.00"` |

**Resultado esperado:** ambos pares de saldo y porcentaje deben coincidir. Devolver 7.00% como cartera en mora o 21.75% como cartera en riesgo incumple el caso. La fila MORA_1 del desglose de **riesgo** tiene capital cero, aunque la fotografía incluya GTQ124000.00 con atraso de 15 días; ese saldo sí está incluido en cartera en mora.

Las otras cinco pruebas del archivo verifican la exclusión de una baja manteniendo su registro del período, la conciliación de porcentajes por tramo, la ausencia de doble conteo de reestructurados, el resultado sin cartera activa y la validación de bajas. No todas comparan directamente el campo de mora; sus aserciones concretas se detallan en CR-02 a CR-06.

### Comando para ejecutar cartera en mora y cartera en riesgo

Desde la raíz del repositorio:

```sh
npm run test:cartera
```

En PowerShell también puede usarse `npm.cmd run test:cartera`. El script de [package.json](../../package.json) ejecuta únicamente:

```sh
vitest run tests/cartera.test.ts tests/cartera-por-tramo.test.ts
```

**Criterio de aprobación:** código de salida 0 y **27 pruebas aprobadas en 2 archivos**: 21 del cálculo agregado y 6 del cálculo por tramo, incluyendo el caso que compara mora y riesgo.

**Ejecución verificada:** `npm.cmd run test:cartera` finalizó con código 0; Vitest 4.1.11 reportó **2 archivos aprobados y 27 pruebas aprobadas**.

## 15. Pruebas de invariantes

### Objetivo y alcance

Un invariante es una condición que debe mantenerse al ejecutar las operaciones del dominio: conservar el capital y el dinero aplicado, impedir estados incompatibles, mantener la moneda y evitar efectos duplicados. Cada prueba comprueba esa condición con las entradas descritas; aprobar ejemplos concretos no demuestra por sí solo todos los valores posibles.

Se distingue la numeración histórica `INV-01`, `INV-02`, etc., de los invariantes P2 numerados 1 a 8 en las pruebas de políticas. Por ejemplo, INV-06 histórico trata la razón de cartera, mientras que el invariante 6 de P2 trata el gasto único de gestión.

El comando de esta sección reúne la suite transversal, el archivo de cartera seleccionado en el IDE y las pruebas relacionadas de políticas, gastos y pagos. Ejecuta archivos completos; también incluye casos de aceptación y errores de esos archivos, no exclusivamente tests cuyo nombre contiene «invariante».

### Suite transversal: plan de amortización

Archivo: [invariantes.test.ts](../../tests/invariantes.test.ts). Inputs comunes: plan francés de GTQ10000.00, tasa nominal anual `"0.36"` y plazo de 12 meses, creado mediante `FabricaPlanAmortizacion.crearFrances`.

| Test | Inputs / acción | Outputs esperados y criterio de aprobación |
|---|---|---|
| `INV-01: la suma de amortizaciones es exactamente el capital` | Consultar `totalAmortizacion` del plan | `"10000.00"` e igualdad monetaria con `plan.capital`. No se admite diferencia de centavos. |
| `INV-02: el saldo de la última cuota es exactamente cero` | Consultar `plan.saldoFinal()` | Cadena exacta `"0.00"`. |
| `INV-03: ningún saldo ni amortización de capital es negativo` | Recorrer todas las cuotas | `esNegativo() === false` en `saldoAnterior`, `amortizacion` y `saldoPosterior` de cada cuota. |

### Suite transversal: estados e historial

La evidencia usa fechas civiles explícitas, usuario `suite-invariantes` y el motivo indicado. Para preparar un crédito vigente se crea `CR-VIG`, se aprueba el `2026-01-01`, desembolsa el `2026-01-02` y activa el `2026-01-03`, con las guardas booleanas requeridas en `true`.

| Test | Inputs / acciones | Outputs esperados y criterio de aprobación |
|---|---|---|
| `INV-04 e INV-05: SOLICITADO y RECHAZADO no admiten pagos` | Crear `CR-INV`; intentar pago parcial el `2026-01-01`, motivo `pago improcedente`; rechazar el mismo día con motivo `solicitud rechazada` y guardas verdaderas; intentar otro pago parcial el `2026-01-02` | Ambos intentos de pago lanzan `TransicionInvalida`, aun pasando `true` a la guarda del pago. |
| `INV-09: una mora regularizada vuelve a VIGENTE` | Crédito vigente; detectar 91 días de atraso el `2026-01-04`, motivo `cuota vencida`; regularizar el `2026-01-05`, motivo `vencido cubierto`, con ambas guardas verdaderas | Estado `VIGENTE` y `devengoInteresCorrienteActivo === true`. Este test comprueba State; los importes suspendidos se prueban en CP-04.2. |
| `INV-15: cada transición conserva los cinco datos obligatorios` | Crear `CR-AUD` y aprobar el `2026-01-01`, motivo `evaluación aprobada`, con guardas verdaderas | Primera entrada con estado anterior SOLICITADO, nuevo APROBADO, usuario `suite-invariantes`, motivo y fecha exactos. El ejemplo automatizado comprueba una transición de aprobación. |
| `INV-16: una recuperación no reactiva un crédito INCOBRABLE` | Crédito vigente; detectar atraso 121 el `2026-01-04`, motivo `atraso severo`; declarar incobrable el `2026-01-05`, motivo `salida contable autorizada`, atraso 121 y autorización verdadera; ejecutar `registrarRecuperacion()` | Estado permanece INCOBRABLE y el historial conserva la misma referencia que antes de la recuperación. No verifica aquí un asiento monetario de recuperación. |

### Suite transversal: mora, pagos y moneda

| Test | Inputs | Outputs esperados y criterio de aprobación |
|---|---|---|
| `INV-10: el tramo siempre corresponde a los días calculados` | Vencimiento `2026-01-01`, corte `2026-02-01`; calcular días y clasificar | Atraso 31 y tramo MORA_2. Este caso prueba una frontera; las restantes se documentan en la sección 4. |
| `INV-11: el moratorio se obtiene exclusivamente desde capital vencido` | Fachada histórica, capital GTQ725.76, tasa `"0.24"`, atraso 15 | Moratorio `"7.26"`. La firma recibe capital, tasa y días; la aserción comprueba ese importe. No es el resultado escalonado de GTQ5.44. |
| `INV-12 e INV-13: se conservan pago y excedente` | Pago GTQ3000.00; gastos 0.00, mora 7.26, corriente 278.86, capital 725.76; contexto con capital no exigible 1000.00 y cuotas futuras 0.00 | Suma aplicada a conceptos más excedente igual al pago; excedente `"1988.12"`; distribución del excedente suma ese mismo importe; aplicado a capital exigible `"725.76"`. |
| `INV-14: una ecuación financiera no admite monedas heterogéneas` | Pago GTQ10.00; gastos, mora y corriente cero GTQ; capital USD10.00 | Excepción `MonedasIncompatibles`. |

Para INV-12/13, los conceptos exigibles suman `0 + 7.26 + 278.86 + 725.76 = 1011.88`; por tanto, `1011.88 + 1988.12 = 3000.00`. El excedente es la parte posterior a cubrir los conceptos exigibles; su distribución se valida separadamente para no perder ni duplicar dinero.

### Suite transversal: razón de cartera y determinismo

| Test | Inputs | Outputs esperados y criterio de aprobación |
|---|---|---|
| `INV-06: la razón de cartera pertenece a [0,1]` | C-1 EN_MORA, capital GTQ40.00, atraso 31; C-2 VIGENTE, capital GTQ60.00, atraso 0 | `CON_RAZON`, razón `"0.4"` y porcentaje `"40.00"`. La prueba verifica ese ejemplo dentro del intervalo; los extremos se prueban en RC-14. |
| `las mismas entradas generan exactamente las mismas salidas` | Crear dos veces el plan francés de GTQ10000.00, TNA `"0.36"`, 12 meses; extraer las cadenas de importe de todas sus cuotas | Ambas listas son profundamente iguales. Comprueba determinismo de importes, no identidad de objetos ni comparación de todos los campos del plan. |

La suite transversal contiene **13 pruebas**; algunas verifican dos identificadores INV en un solo test.

### Invariantes y entradas inválidas de cartera

El bloque `invariantes y entradas inválidas` de [cartera.test.ts](../../tests/cartera.test.ts) contiene los nueve casos RC-13 a RC-21 de la sección 14. Se incluyen en el nuevo comando:

| Casos | Inputs resumidos | Resultado esperado |
|---|---|---|
| RC-13 | Fotografía vacía, GTQ | SIN_CARTERA_ACTIVA, capitales cero y ausencia de `razon`. |
| RC-14 | Capital 100.00 al día; otra consulta con capital 100.00 a 31 días | Porcentajes 0.00% y 100.00%. |
| RC-15 | Dos créditos con el mismo ID C-1 | `CreditoCarteraDuplicado`. |
| RC-16 a RC-18 | Capital 10.00 y atraso -1, 1.5 o NaN | `CreditoCarteraInvalido` para cada entrada. |
| RC-19 | Capital -0.01 | `CreditoCarteraInvalido`. |
| RC-20 | Fotografía GTQ con un incobrable de USD10.00 | `MonedasIncompatibles`, aunque el crédito esté excluido del activo. |
| RC-21 | Cartera con capital 100.00 al día y cartera vacía | Ambos resultados congelados. |

Las entradas completas, nombres de tests y criterios exactos permanecen en la sección 14. El comando también ejecuta los otros doce casos del archivo de cartera.

### Invariantes P2 y protección contra duplicados

Estas pruebas ya se documentaron en las secciones anteriores; se integran al comando para comprobar su relación con las propiedades transversales.

| Propiedad / evidencia | Inputs | Resultado esperado y ubicación de la documentación |
|---|---|---|
| P2 1, 2 y 4: monotonía, comparación con retroactiva y equivalencia inicial | GTQ725.76; recorrido días 1–120; comparación con día anterior, retroactiva y plana al 18% | Mora no decreciente; escalonada ≤ retroactiva en 1–120; igualdad con plana al 18% en 1–30. ME-14, `politica-mora.test.ts`. |
| Congelación escalonada | Mismo capital, días 121, 150, 365 y 10000 | Importe igual al día 120: `"65.32"`. ME-14. |
| P2 3: no negatividad y tope de capital / contrato común | Tres políticas; GTQ y USD; capitales 0, 0.01, 725.76 y 999999999999.99; doce atrasos, desde 0 hasta 100000 | Interés entre cero y capital, moneda conservada, determinismo y entradas sin cambios; rechazo de estrategias incompatibles. CT-01 a CT-03, `contrato-politica.test.ts`. |
| P2 5: conservación de contratos anteriores | Otorgamientos `2026-09-30` y `2026-10-01`, capital 725.76, vencimiento `2026-11-01`, corte `2026-11-16` | Mora histórica `"7.26"` y nueva `"5.44"`. AP-02 y CO-05, `regresion-p1.test.ts`. |
| P2 6: gasto único | CR-1/cuota 2; cierre del día 31 repetido y cortes posteriores, conservando identificadores | Una identidad y gasto acumulado `"25.00"`. IG-06, `gasto-gestion-cobro.test.ts`. |
| P2 7: conciliación de cartera por tramo | Tres créditos de GTQ1.00 a 31, 61 y 91 días | Porcentajes 33.34%, 33.33%, 33.33%; sumas de porcentajes y capitales conciliadas. CR-03, sección 13, `cartera-por-tramo.test.ts`. |
| P2 8: incobrable congela mora y sale de activa | Ambas fechas de otorgamiento; cuota 725.76 vencida `2026-10-01`; baja `2027-01-30`; cortes de baja y `2027-03-01` | Igual mora antes y después; escalonada `"65.32"`; activa `"0.00"` y baja visible `"725.76"`. AP-03/AP-04, `regresion-p1.test.ts`. |
| INV-08 histórico: pago duplicado sin segundo efecto | Repetir crédito, clave y pago GTQ500.00; otra variante cambia importe a 501.00 | Reintento devuelve el mismo pago y un solo registro; importe diferente produce conflicto. IP-01 a IP-09, `pago-idempotencia.test.ts`. |

**Límite de cobertura:** INV-07 histórico, reproducción de saldos desde el mayor de movimientos, figura pendiente en la [matriz de trazabilidad](../trazabilidad/matriz-trazabilidad.md). No se presenta como probado por este comando. El comando tampoco sustituye las pruebas específicas de devengo de CP-04.2 ni toda la suite de prelación; esas verificaciones conservan su alcance propio.

### Comando y criterio de aprobación

Desde la raíz del repositorio:

```sh
npm run test:invariantes
```

En PowerShell: `npm.cmd run test:invariantes`. El script de [package.json](../../package.json) ejecuta estos ocho archivos:

```text
tests/invariantes.test.ts
tests/cartera.test.ts
tests/politica-mora.test.ts
tests/contrato-politica.test.ts
tests/regresion-p1.test.ts
tests/gasto-gestion-cobro.test.ts
tests/cartera-por-tramo.test.ts
tests/pago-idempotencia.test.ts
```

Para ejecutar solamente las 13 pruebas transversales:

```sh
npm test -- tests/invariantes.test.ts
```

**Criterio de aprobación del comando conjunto:** código de salida 0 y ninguna aserción fallida en los ocho archivos seleccionados. Los bucles internos de las pruebas comprueban múltiples combinaciones, pero no cuentan como tests independientes de Vitest.

**Ejecución verificada:** `npm.cmd run test:invariantes` terminó con código 0; Vitest 4.1.11 reportó **8 archivos aprobados y 85 pruebas aprobadas**. El total incluye los casos relacionados de los archivos completos, además de las 13 pruebas transversales.
