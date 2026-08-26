# Fase 17 — Plan de amortización francesa

## 1. Objetivo y alcance

Implementar un plan francés exacto, inmutable y autoconsistente, incluyendo TNA nominal, conversión mensual, plazo de producto, cuotas, totales y ajuste obligatorio de la última fila.

Esta fase no implementa calendario de vencimientos, pagos ni mora. Las fechas contractuales se incorporarán cuando la política de calendario esté definida; el cálculo financiero de importes ya queda completo.

## 2. Archivos

| Archivo | Estado | Propósito |
|---|---|---|
| `src/dominio/plan-amortizacion.ts` | Implementado | Tasa, plazo, cuota, plan y fábrica francesa. |
| `tests/plan-amortizacion.test.ts` | Implementado | Caso obligatorio completo, tasa cero y bordes. |

## 3. Componentes implementados

| Componente | Responsabilidad |
|---|---|
| `TasaNominalAnual` | Representar TNA exacta desde cadena. |
| `TasaMensual` | Representar TNA/12 sin `number`. |
| `PlazoMeses` | Validar entero entre 3 y 24. |
| `Cuota` | Fila inmutable de saldo, interés, amortización e importe. |
| `PlanAmortizacion` | Conservar filas/totales y validar invariantes globales. |
| `FabricaPlanAmortizacion` | Construir plan francés completo o fallar. |

## 4. Algoritmo

Si la tasa mensual es positiva:

```text
cuota = P × [i(1+i)^n / ((1+i)^n - 1)]
```

Si es cero:

```text
cuota = P / n
```

Para las primeras `n-1` filas:

```text
interés = redondear(saldoAnterior × i)
amortización = cuotaNormal - interés
saldoPosterior = saldoAnterior - amortización
```

Última fila:

```text
amortizaciónFinal = saldoAnterior
interésFinal = redondear(saldoAnterior × i)
cuotaFinal = amortizaciónFinal + interésFinal
saldoFinal = Q0.00
```

Las potencias y divisiones usan precisión decimal de 40 dígitos; los importes se materializan mediante `Dinero` y HALF_UP.

## 5. Caso obligatorio validado

Entrada:

- capital Q10,000.00;
- TNA 36%;
- tasa mensual 3%;
- plazo 12 meses.

| # | Saldo anterior | Interés | Amortización | Cuota | Saldo posterior |
|---:|---:|---:|---:|---:|---:|
| 1 | Q10,000.00 | Q300.00 | Q704.62 | Q1,004.62 | Q9,295.38 |
| 2 | Q9,295.38 | Q278.86 | Q725.76 | Q1,004.62 | Q8,569.62 |
| 3 | Q8,569.62 | Q257.09 | Q747.53 | Q1,004.62 | Q7,822.09 |
| 4 | Q7,822.09 | Q234.66 | Q769.96 | Q1,004.62 | Q7,052.13 |
| 5 | Q7,052.13 | Q211.56 | Q793.06 | Q1,004.62 | Q6,259.07 |
| 6 | Q6,259.07 | Q187.77 | Q816.85 | Q1,004.62 | Q5,442.22 |
| 7 | Q5,442.22 | Q163.27 | Q841.35 | Q1,004.62 | Q4,600.87 |
| 8 | Q4,600.87 | Q138.03 | Q866.59 | Q1,004.62 | Q3,734.28 |
| 9 | Q3,734.28 | Q112.03 | Q892.59 | Q1,004.62 | Q2,841.69 |
| 10 | Q2,841.69 | Q85.25 | Q919.37 | Q1,004.62 | Q1,922.32 |
| 11 | Q1,922.32 | Q57.67 | Q946.95 | Q1,004.62 | Q975.37 |
| 12 | Q975.37 | Q29.26 | Q975.37 | Q1,004.63 | Q0.00 |

Totales verificados:

- pagos: Q12,055.45;
- intereses: Q2,055.45;
- amortización: Q10,000.00;
- saldo final: Q0.00.

La prueba compara las seis columnas de las 12 filas, no solo totales.

## 6. Invariantes ejecutables

`PlanAmortizacion` valida al construirse:

1. cantidad de cuotas igual al plazo;
2. numeración consecutiva;
3. importes de fila no negativos;
4. interés + amortización = cuota;
5. saldo anterior − amortización = saldo posterior;
6. continuidad de saldo entre filas;
7. suma de amortizaciones = capital;
8. saldo final = cero;
9. intereses + capital = pagos totales.

Una violación produce `PlanAmortizacionInvalido`; la fábrica nunca entrega un plan parcial.

## 7. Caso tasa cero

Para Q1,000.00 a tres meses:

| # | Interés | Amortización/cuota | Saldo |
|---:|---:|---:|---:|
| 1 | Q0.00 | Q333.33 | Q666.67 |
| 2 | Q0.00 | Q333.33 | Q333.34 |
| 3 | Q0.00 | Q333.34 | Q0.00 |

La última fila absorbe el centavo restante sin división inválida.

## 8. Errores

| Error | Condición |
|---|---|
| `TasaInvalida` | Formato no canónico, negativo o no finito. |
| `PlazoInvalido` | No entero seguro o fuera de 3–24. |
| `CapitalInvalido` | Capital cero o negativo. |
| `PlanAmortizacionInvalido` | Cualquier invariante global rota. |

## 9. Pruebas

La suite de la fase añade 28 casos; el proyecto completo ejecuta 71.

| Cobertura | Estado |
|---|---|
| Doce filas completas CA-01 | Verificada |
| Cuotas normales/final | Verificada |
| Totales obligatorios | Verificados |
| TNA 36% → 3% mensual | Verificada |
| Ajuste final | Verificado |
| Tasa cero | Verificada |
| Capital original inmutable | Verificado |
| Plan/colección/cuotas congelados | Verificado |
| Capital no positivo | Rechazado |
| Formatos de tasa inválidos | Rechazados |
| Tasa pública sin `number` | Verificada por tipos |
| Plazos 3/12/24 | Aceptados |
| Plazos inválidos | Rechazados |

## 10. Correspondencia con diseño

| Artefacto | Correspondencia |
|---|---|
| DOC-03 | Fórmula, ajuste y CA-01 implementados. |
| UML-CL/UML-SD | Fábrica, Plan y Cuota corresponden al modelo. |
| DOC-10 | E3→E4 en `plan-amortizacion.ts`. |
| DOC-11/12 | SRP, Expert y Creator aplicados. |
| DOC-13 | Factory de dominio implementada. |
| DOC-16 | Reutiliza `Dinero` exacto. |

## 11. Trazabilidad

| Requisito | Código | Prueba | Estado |
|---|---|---|---|
| RF-06 | `plan-amortizacion.ts` | Caso de referencia/tasa cero | Implementado |
| RN-05–RN-09 | Fábrica/Plan/Cuota | 12 filas y totales | Verificado |
| INV-01 | Total amortización | Q10,000.00 | Verificado |
| INV-02 | `saldoFinal()` | Q0.00 | Verificado |
| INV-03 | Validación de filas/capital | No negativos | Verificado en plan |
| INV-14 | Operaciones `Dinero` | Moneda homogénea | Verificado |
| CA-01 | Fábrica francesa | 12 filas completas | Verificado |

## 12. Validaciones realizadas

| Validación | Resultado |
|---|---|
| `npm run typecheck` | Correcto |
| `npm test` | 2 archivos, 71 pruebas correctas |
| `npm run verify` | Correcto |
| `any` en dominio | Ninguno |
| `number` para tasas públicas | Ninguno |
| Infraestructura añadida | Ninguna |

## 13. Decisiones adoptadas

| ID | Decisión | Consecuencia |
|---|---|---|
| D17-01 | TNA y tasa mensual como VO exactos desde cadena. | No entra punto flotante en tasas. |
| D17-02 | Plazo como VO de entero 3–24. | Regla de producto visible y tipada. |
| D17-03 | Factory calcula y Plan valida nuevamente. | Construcción y defensa de invariantes separadas. |
| D17-04 | Ajustar solo la última cuota. | Se cumple literalmente el modelo financiero. |
| D17-05 | Plan/cuotas congelados. | El contrato no cambia después del desembolso. |
| D17-06 | No incluir fechas hasta resolver calendario. | No se inventa ajuste por días no hábiles. |

## 14. Decisiones pendientes

| ID | Punto | Fase prevista |
|---|---|---|
| DP-03 | Calendario y días no hábiles | Política institucional futura |
| DP-40 | Fecha de primer vencimiento en plan contractual | Al integrar calendario/originación |
| DP-41 | Otros tipos de tasa | Strategy futura; solo TNA nominal requerida |

## 15. Validación contra el enunciado

| Criterio | Estado |
|---|---|
| Amortización francesa | Cumplido |
| TNA/12 | Cumplido |
| Caso `i = 0` | Cumplido |
| Interés por saldo | Cumplido |
| Ajuste final obligatorio | Cumplido |
| Σ amortizaciones = capital | Cumplido |
| Saldo final Q0.00 | Cumplido |
| Q1,004.62 primeras 11 | Cumplido |
| Q1,004.63 cuota 12 | Cumplido |
| Totales obligatorios | Cumplidos |
| 12 filas completas probadas | Cumplido |
| Sin `number` para dinero/tasa | Cumplido |
| Sin infraestructura | Cumplido |

## 16. Resultado esperado

El núcleo genera exactamente el plan financiero obligatorio y rechaza cualquier construcción que rompa sus invariantes. Mora, pagos y cartera podrán consumir cuotas y saldos exactos sin recalcular ni corregir manualmente el plan.
