# Fase 19 — Prelación de pagos

## 1. Objetivo

Implementar la aplicación exacta de pagos mediante Chain of Responsibility y delegar el excedente a una Strategy sustituible, conservando íntegramente cada importe y aceptando pagos parciales.

## 2. Artefactos

| Archivo | Responsabilidad |
|---|---|
| `src/dominio/prelacion-pago.ts` | Cadena fija, resultados, invariantes y estrategias de excedente. |
| `tests/prelacion-pago.test.ts` | CA-03, CA-04, CA-05, orden, límites, estrategias, monedas e inmutabilidad. |

## 3. Cadena institucional

`ProcesadorPrelacionPago` ensambla internamente y en un único orden:

1. gastos y comisiones;
2. interés moratorio;
3. interés corriente;
4. capital.

Los eslabones concretos no se exportan. Por ello, el consumidor no puede omitirlos ni construir una secuencia distinta. Cada eslabón aplica `min(remanente, saldoExigible)`, registra su saldo pendiente y entrega el remanente al siguiente.

## 4. Resultado auditable

Cada `PasoPrelacion` conserva concepto, saldo exigible, importe aplicado, saldo pendiente y remanente. `AplicacionPago` conserva el pago original, los cuatro pasos, el excedente y el resultado de la Strategy.

Se validan dos ecuaciones:

- `pago = Σ conceptos aplicados + excedente`;
- `excedente = capital anticipado + cuotas futuras anticipadas + remanente`.

Todos los importes son `Dinero`; una mezcla de monedas falla antes de producir resultado.

## 5. Casos de aceptación

| Caso | Pago | Gastos | Moratorio | Corriente | Capital | Resultado adicional |
|---|---:|---:|---:|---:|---:|---:|
| CA-03 | Q1,011.88 | Q0.00 | Q7.26 | Q278.86 | Q725.76 | Q0.00 excedente |
| CA-04 | Q500.00 | Q0.00 | Q7.26 | Q278.86 | Q213.88 | Q511.88 capital pendiente |
| CA-05 | Q3,000.00 | Q0.00 | Q7.26 | Q278.86 | Q725.76 | Q1,988.12 excedente |

El pago parcial no se rechaza: la cadena consume lo disponible y deja saldos pendientes no negativos.

## 6. Strategy de excedente

El contrato `PoliticaExcedente` recibe el excedente y los saldos disponibles para aplicación anticipada.

| Estrategia | Comportamiento |
|---|---|
| `AmortizacionDirectaCapital` | Reduce capital no exigible hasta el saldo disponible. Es la opción predeterminada. |
| `PagoAnticipadoCuotasFuturas` | Aplica a cuotas futuras hasta el saldo informado. |

Se prefiere amortización directa porque reduce inmediatamente el principal y la exposición financiera. La regeneración concreta de plazo o cuota no se inventa: continúa pendiente de definición contractual. Si la estrategia no puede absorber todo el excedente, el resto permanece explícito en `remanente` y nunca desaparece.

Cambiar la Strategy no modifica el orden ni los importes aplicados por la cadena.

## 7. Validaciones

- El pago debe ser positivo.
- Los saldos exigibles y disponibilidades futuras no pueden ser negativos.
- Todos los importes operados deben tener la misma moneda.
- Ningún eslabón consume más que su saldo.
- Ningún pendiente ni remanente se vuelve negativo.
- Aplicación, pasos, arreglos y resultados de Strategy son inmutables.

## 8. Verificación

| Control | Resultado |
|---|---|
| CA-03 pago exacto | Aprobado |
| CA-04 pago parcial | Aprobado |
| CA-05 excedente Q1,988.12 | Aprobado |
| Orden obligatorio | Aprobado |
| Sustitución de Strategy | Aprobado |
| INV-12 conservación del pago | Aprobado |
| INV-13 conservación del excedente | Aprobado |
| TypeScript estricto | Aprobado |
| Suite completa | 4 archivos, 121 pruebas aprobadas |
| `any` evasivo | Ninguno |

## 9. Alcance pendiente

- La transición posterior a un pago pertenece al State de la fase 20.
- La idempotencia de registro no forma parte del cálculo puro de prelación.
- El catálogo institucional de gastos sigue configurable; los casos obligatorios usan Q0.00.
- La elección entre reducir plazo o cuota después de amortizar directamente requiere política contractual.

## 10. Resultado

RF-07, RF-08 y RF-09; RN-18, RN-19 y RN-20; INV-12 e INV-13; y CA-03, CA-04 y CA-05 quedan implementados y verificados dentro del dominio.
