# Fase 18 — Mora

## 1. Objetivo

Implementar un cálculo de mora exacto, determinista y auditable: días calendario desde una fecha contractual explícita, clasificación derivada por tramos e interés moratorio Actual/360 aplicado exclusivamente al capital vencido de cada cuota.

## 2. Artefactos

| Archivo | Responsabilidad |
|---|---|
| `src/dominio/calculadora-mora.ts` | Fechas civiles, días de atraso, tramos, TNA moratoria, suspensión de devengo y cálculo por cuota. |
| `tests/calculadora-mora.test.ts` | Fronteras, fechas, CA-02, errores, independencia por cuota e inmutabilidad. |

## 3. Modelo implementado

| Elemento | Decisión |
|---|---|
| `FechaCivil` | Cadena estricta `AAAA-MM-DD`, validada como fecha gregoriana y sin hora ni zona horaria. |
| `DiasAtraso` | Entero seguro no negativo; `max(0, corte - vencimiento)`. |
| `TramoMora` | Valor derivado; no representa ni modifica el estado del crédito. |
| `TasaNominalAnualMoratoria` | Decimal exacto, no negativo y construido desde cadena. |
| `CalculadoraMora` | Servicio puro y sin estado que calcula una cuota o una colección de cuotas. |
| `ResultadoMoraCuota` | Resultado inmutable con referencia, fecha, días, tramo, capital e interés. |

## 4. Conteo y clasificación

Una fecha de corte anterior o igual al vencimiento produce cero. El día calendario siguiente produce uno. No intervienen horas parciales ni la zona horaria del proceso.

| Días | Tramo derivado | Devengo corriente |
|---:|---|---|
| 0 | `SIN_MORA` | Continúa |
| 1–30 | `MORA_1` | Continúa |
| 31–60 | `MORA_2` | Continúa |
| 61–90 | `MORA_3` | Continúa |
| 91–120 | `VENCIDO` | Suspendido |
| >120 | `INCOBRABLE` | Suspendido |

`INCOBRABLE` en esta tabla es una clasificación. La declaración del estado contable requiere autorización y corresponde a la fase de State.

## 5. Interés moratorio

La fórmula implementada por cuota es:

`moratorio = redondear(capitalVencido × (TNA_moratoria / 360) × diasAtraso)`

El cálculo se mantiene en precisión decimal 40 y redondea a dos decimales, medio hacia arriba, al construir el `Dinero` resultante. La interfaz recibe únicamente `capitalVencido`; por construcción no acepta interés corriente, moratorio previo, gastos, comisiones ni capital futuro como componentes de la base.

### Caso CA-02

`Q725.76 × (0.24 / 360) × 15 = Q7.2576 → Q7.26`

Resultado verificado: `Q7.26`.

## 6. Independencia por cuota

`calcularVariasCuotas` recorre obligaciones explícitas y calcula para cada una su propio vencimiento, días, tramo, capital e interés. No agrega capitales antes de calcular ni capitaliza moratorios. El arreglo y cada resultado quedan congelados.

## 7. Errores de dominio

| Error | Condición |
|---|---|
| `FechaCivilInvalida` | Formato o fecha gregoriana inexistente. |
| `DiasAtrasoInvalidos` | Valor negativo, fraccionario o no seguro. |
| `TasaMoratoriaInvalida` | Tasa negativa, no finita, mal formada o no expresada como cadena. |
| `CapitalVencidoInvalido` | Capital vencido negativo. |

Capital cero, tasa cero y cero días son casos válidos y producen dinero cero.

## 8. Verificación

| Control | Resultado |
|---|---|
| Fronteras 0/1/30/31/60/61/90/91/120/121 | Verificadas |
| Vencimiento, día siguiente y corte anterior | Verificados |
| Año bisiesto | Verificado |
| CA-02 Q7.26 | Verificado |
| Varias cuotas independientes | Verificado |
| Devengo a 90 y suspensión a 91 | Verificado |
| TypeScript estricto | Correcto |
| Suite completa | 3 archivos, 107 pruebas aprobadas |
| `any` evasivo | Ninguno |

## 9. Alcance pendiente

- La reactivación del devengo tras regularización requiere el estado del crédito de la fase 20.
- El ajuste de vencimientos por días no hábiles continúa como política institucional pendiente; esta fase usa la fecha contractual recibida sin alterarla.
- La declaración autorizada de un crédito como estado `INCOBRABLE` no se infiere del tramo y se implementará con State.

## 10. Resultado

RF-11, RF-12 y RF-13 quedan implementados y verificados. RF-14 queda cubierto en su regla pura de suspensión a partir del día 91; su reactivación y transición de estado permanecen correctamente reservadas para la fase 20.
