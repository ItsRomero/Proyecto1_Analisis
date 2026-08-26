# Fase 16 — Implementación de Dinero

## 1. Objetivo y alcance

Implementar el Value Object monetario exacto que utilizarán todas las fases financieras posteriores. La implementación cubre importe, moneda, inmutabilidad, operaciones, redondeo, serialización y errores específicos.

## 2. Archivos

| Archivo | Estado | Propósito |
|---|---|---|
| `src/dominio/dinero.ts` | Implementado | `Dinero`, `Moneda`, serialización y errores monetarios. |
| `tests/dinero.test.ts` | Implementado | Pruebas de comportamiento, bordes y tipos públicos. |

## 3. Decisiones implementadas

| Decisión | Implementación |
|---|---|
| Decimal exacto | `decimal.js` encapsulado. |
| Precisión interna | Instancia clonada con 40 dígitos significativos. |
| Redondeo | `Decimal.ROUND_HALF_UP` a dos decimales. |
| Entrada monetaria | `string` decimal estricta o `bigint` de unidades menores. |
| Prohibición de `number` | Ninguna fábrica u operación monetaria pública lo acepta. |
| Moneda | VO `Moneda`, código de tres letras mayúsculas. |
| Inmutabilidad | Campos privados/readonly, `Object.freeze` y operaciones que crean instancias. |
| Importes firmados | Permitidos por `Dinero`; agregados impondrán restricciones contextuales. |
| Serialización | `{ importe: string, moneda: string }`. |
| Conversión FX | No implementada; monedas distintas producen error. |

La instancia decimal se clona en lugar de modificar la configuración global de `decimal.js`. Así otros consumidores no pueden cambiar accidentalmente precisión o redondeo del dominio.

## 4. API pública

### 4.1 Construcción

| Operación | Entrada | Resultado |
|---|---|---|
| `Dinero.desdeCadena` | cadena decimal + moneda | Importe normalizado. |
| `Dinero.desdeUnidadesMenores` | `bigint` de centavos + moneda | Importe exacto. |
| `Dinero.cero` | moneda | `0.00`. |
| `Moneda.desdeCodigo` | código ISO conceptual de tres letras | Moneda inmutable. |

El formato monetario no admite espacios, separadores de miles, exponente, `NaN`, infinito, punto sin fracción ni ceros enteros no canónicos.

### 4.2 Operaciones

- `sumar` y `restar`;
- `multiplicar` y `dividir` mediante escalares en cadena;
- `negar` y `absoluto`;
- `minimo` y `maximo`;
- comparaciones tipadas;
- `esCero` y `esNegativo`;
- conversión exacta a unidades menores;
- serialización segura.

Todas las operaciones binarias monetarias validan moneda. Multiplicación/división materializan un nuevo importe monetario redondeado a dos decimales.

## 5. Errores específicos

| Error | Condición |
|---|---|
| `ImporteMonetarioInvalido` | Cadena monetaria inválida. |
| `MonedaInvalida` | Código no formado por tres mayúsculas. |
| `MonedasIncompatibles` | Operación binaria entre monedas distintas. |
| `EscalarMonetarioInvalido` | Factor/divisor con formato inválido. |
| `DivisionMonetariaPorCero` | Divisor igual a cero. |

No se usan errores HTTP ni dependencias de infraestructura.

## 6. Cobertura de pruebas

Vitest reporta 43 casos ejecutados, incluyendo tablas parametrizadas.

| Grupo | Evidencia |
|---|---|
| Normalización | `1000`, `1000.0`, `1000.00` → `1000.00`. |
| HALF_UP | Positivos y negativos alrededor de medio centavo. |
| Exactitud | `0.10 + 0.20 = 0.30`. |
| Inmutabilidad | Operandos intactos y resultados con nueva identidad. |
| Valores firmados | Resta negativa, negar y absoluto. |
| Escalares | Multiplicación/división exacta y división por cero. |
| Formatos inválidos | Vacío, espacios, exponente, infinito, comas y otros. |
| Moneda | Códigos inválidos y operaciones cruzadas. |
| Unidades menores | Ida/vuelta exacta positiva y negativa con `bigint`. |
| Comparaciones | Igualdad normalizada, orden, mínimo y máximo. |
| Serialización | Importe JSON como cadena. |
| Congelamiento | `Moneda`, `Dinero` y resultado serializado congelados. |
| Tipos públicos | Importe/escalar `string`; centavos `bigint`; no `number`. |

## 7. Trazabilidad de pruebas previstas de Fase 2

| ID | Criterio | Prueba implementada | Estado |
|---|---|---|---|
| PD-01 | Normalización | Tabla de tres entradas | Verificado |
| PD-02 | HALF_UP positivo | Tabla 1.004/1.005/1.006 | Verificado |
| PD-03 | HALF_UP negativo | Tabla -1.004/-1.005 | Verificado |
| PD-04 | Suma/resta/inmutabilidad | Tests exactos | Verificado |
| PD-05 | GTQ + USD falla | `MonedasIncompatibles` | Verificado |
| PD-06 | Multiplicar exacto | Q725.76 × 0.01 | Verificado |
| PD-07 | División por cero | Error específico | Verificado |
| PD-08 | Formato inválido | Tablas de importe/escalar | Verificado |
| PD-09 | No aceptar `number` | `expectTypeOf` sobre API | Verificado |
| PD-10 | Unidades menores | Ida/vuelta con `bigint` | Verificado |
| PD-11 | Igualdad | Importe normalizado + moneda | Verificado |
| PD-12 | Resultado negativo | Resta 2.00−3.25 | Verificado |
| PD-13 | Cero por moneda | `Dinero.cero` | Verificado |
| PD-14 | Serialización | Cadena + moneda | Verificado |

## 8. Invariantes relacionadas

| Invariante | Aporte de `Dinero` | Estado completo |
|---|---|---|
| INV-01/02 | Suma/resta exacta y cero representable | Se verificará con plan. |
| INV-03 | Detecta negativos | El agregado Crédito impondrá restricción. |
| INV-07 | Importes firmados exactos | Mayor se implementará después. |
| INV-11 | Tipo monetario de base/resultado | Calculadora de mora impondrá base. |
| INV-12/13 | Conservación exacta | Prelación impondrá ecuación. |
| INV-14 | Moneda compatible | Verificado directamente. |

## 9. Correspondencia con diseño

| Diseño | Implementación |
|---|---|
| DOC-02 contrato de Dinero | API y reglas implementadas. |
| DOC-07 exactitud ISO | Q-AC y Q-SE preparados. |
| DOC-10 E3 | Dominio compartido mínimo. |
| DOC-11 SRP/OCP/LSP | VO cohesivo, sin infraestructura. |
| DOC-12 Expert/High Cohesion | Dinero decide operaciones/compatibilidad. |
| DOC-13 Value Object | Participantes y pruebas PAT-VO implementados. |

## 10. Validaciones realizadas

| Validación | Resultado |
|---|---|
| `npm run typecheck` | Correcto. |
| `npm test` | 1 archivo, 43 pruebas correctas. |
| `npm run verify` | Correcto. |
| Búsqueda de `any` en dominio | Ninguno. |
| `number` en API monetaria pública | Ninguno. |
| Servicios/infraestructura | Ninguno añadido. |

## 11. Decisiones adoptadas

| ID | Decisión | Consecuencia |
|---|---|---|
| D16-01 | Precisión interna decimal de 40 dígitos. | Suficiente margen para fórmulas futuras sin usar globales. |
| D16-02 | Formato decimal canónico estricto. | Entradas ambiguas se rechazan en lugar de normalizar silenciosamente. |
| D16-03 | Escalares públicos como cadenas. | Tasas/factores no introducen punto flotante. |
| D16-04 | Moneda como VO separado. | Compatibilidad y extensión quedan explícitas. |
| D16-05 | `Dinero` permite signo. | Mayor puede registrar débitos/créditos; agregados restringen saldos. |
| D16-06 | Import de `Decimal` nombrado en ESM. | Compatible con TypeScript `NodeNext` y decimal.js 10.6.0. |

## 12. Decisiones pendientes

| ID | Punto | Fase prevista |
|---|---|---|
| DP-37 | VO decimal específico para Tasa | Fase 17/18 según primer consumidor. |
| DP-38 | Formato externo validado por Zod | Fase 23. |
| DP-39 | Catálogo de monedas admitidas por producto | Política/contratos futuros; P1 valida forma y compatibilidad. |

## 13. Validación contra el enunciado

| Criterio | Estado |
|---|---|
| Value Object `Dinero` | Cumplido |
| Inmutable | Cumplido |
| Importe y moneda | Cumplido |
| Impide mezclar monedas | Cumplido |
| Evita punto flotante | Cumplido |
| Operaciones devuelven nuevas instancias | Cumplido |
| Dos decimales | Cumplido |
| Redondeo medio hacia arriba | Cumplido |
| Sin `any` | Cumplido |
| Pruebas automatizadas | 43 correctas |
| Sin infraestructura | Cumplido |

## 14. Resultado esperado

`Dinero` queda listo como base exacta y reutilizable para plan, mora, pagos, cartera, movimientos y cierres. Ninguna fase posterior necesita representar importes con `number` ni repetir reglas de moneda/redondeo.
