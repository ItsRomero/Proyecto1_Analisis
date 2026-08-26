# Fase 21 — Cartera en riesgo

## 1. Objetivo

Calcular de forma exacta y reproducible la razón entre capital en riesgo y cartera activa, usando el saldo completo de cada crédito, incluyendo reestructurados y excluyendo salidas contables incobrables.

## 2. Artefactos

| Archivo | Responsabilidad |
|---|---|
| `src/dominio/cartera.ts` | Fotografía, criterios de inclusión, agregación, porcentaje y resultado sin cartera. |
| `tests/cartera.test.ts` | CA-06, CA-07, fronteras, reestructurados, exclusiones e invariantes. |

## 3. Entrada del cálculo

Cada `CreditoParaCartera` aporta:

- identificador único;
- estado del ciclo;
- saldo completo de capital como `Dinero`;
- días de atraso como entero no negativo.

La calculadora recibe también la moneda institucional de la fotografía. Todos los registros, incluidos los excluidos, deben ser monetariamente homogéneos para impedir mezclar carteras distintas silenciosamente.

## 4. Cartera activa

Se incluyen saldos de créditos en:

- `DESEMBOLSADO`;
- `VIGENTE`;
- `EN_MORA`;
- `REESTRUCTURADO`.

Se excluyen `SOLICITADO`, `APROBADO`, `RECHAZADO`, `ANULADO`, `CANCELADO` e `INCOBRABLE`. En particular, `INCOBRABLE` queda fuera tanto del denominador como del numerador, completando la salida contable irreversible modelada en la fase 20.

## 5. Capital en riesgo

Para cada crédito activo se incluye una sola vez su saldo completo cuando:

- tiene más de 30 días de atraso; o
- está `REESTRUCTURADO`, incluso con cero días de atraso.

La condición es una unión lógica. Un reestructurado con más de 30 días no se duplica. El límite se verificó expresamente: 30 días no entra y 31 días sí.

## 6. Razón y presentación

Con cartera activa positiva:

`razon = capitalEnRiesgo / carteraActiva`

`Porcentaje` mantiene el cociente decimal exacto dentro de `[0,1]` y lo presenta multiplicado por 100 con dos decimales. El cálculo no usa `number` para importes ni para la razón.

Con cartera activa cero se devuelve `ResultadoSinCarteraActiva`, cuyo discriminante es `SIN_CARTERA_ACTIVA`. No contiene propiedad `razon` y evita inventar `0%`, `NaN` o infinito.

## 7. Casos de aceptación

| Caso | Cartera activa | Capital en riesgo | Resultado |
|---|---:|---:|---:|
| CA-06 | Q800,000.00 | Q56,000.00 | 7.00% |
| CA-07, C-005 incobrable | Q792,000.00 | Q48,000.00 | 6.06% |

En CA-07, C-005 aporta Q8,000.00 antes de la declaración. Al pasar a `INCOBRABLE`, esos Q8,000.00 salen simultáneamente de cartera activa y capital activo en riesgo.

## 8. Invariantes y errores

- La razón solo existe con denominador positivo y permanece en `[0,1]`.
- Capital en riesgo nunca supera cartera activa porque solo se agrega desde el conjunto activo.
- Un identificador duplicado se rechaza para evitar doble conteo.
- Saldos negativos, días negativos/fraccionarios y monedas mezcladas se rechazan.
- Los resultados quedan congelados.

## 9. Verificación

| Control | Resultado |
|---|---|
| CA-06 = 7.00% | Aprobado |
| CA-07 = 6.06% | Aprobado |
| Saldo completo en riesgo | Aprobado |
| Frontera 30/31 | Aprobado |
| Reestructurado al día | Aprobado |
| Sin doble conteo | Aprobado |
| Exclusión de incobrables | Aprobado |
| Extremos 0% y 100% | Aprobado |
| `SIN_CARTERA_ACTIVA` | Aprobado |
| TypeScript estricto | Aprobado |
| Suite completa | 6 archivos, 166 pruebas aprobadas |
| `any` evasivo | Ninguno |

## 10. Alcance pendiente

- Provisiones y cierres usarán este resultado, pero no se implementan en esta fase.
- Los movimientos contables concretos de recuperación de incobrables continúan pendientes de catálogo institucional.
- La composición de cartera por tramo podrá derivarse en cierres posteriores sin modificar esta razón base.

## 11. Resultado

RF-18 y RF-19, RN-26 a RN-28, INV-06, POL-11 y los casos CA-06/CA-07 quedan implementados y verificados en el núcleo de dominio.
