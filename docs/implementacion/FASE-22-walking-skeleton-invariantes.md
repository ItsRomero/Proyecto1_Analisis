# Fase 22 — E4 Walking Skeleton e invariantes

## 1. Objetivo

Cerrar el núcleo ejecutable E4, verificar su instalación y ejecución aisladas, y demostrar transversalmente que los módulos preservan las invariantes financieras y de ciclo de vida implementables dentro del alcance obligatorio.

## 2. Walking skeleton entregado

### Dominio

| Archivo | Capacidad |
|---|---|
| `src/dominio/dinero.ts` | Dinero exacto, moneda, redondeo e inmutabilidad. |
| `src/dominio/plan-amortizacion.ts` | Plan francés, tasas, cuotas y ajuste final. |
| `src/dominio/calculadora-mora.ts` | Fechas, días, tramos y moratorio Actual/360. |
| `src/dominio/prelacion-pago.ts` | Chain de prelación y Strategy de excedente. |
| `src/dominio/credito-estado.ts` | State, guardas e historial de crédito. |
| `src/dominio/cartera.ts` | Cartera activa, capital en riesgo y porcentaje. |

### Pruebas

| Archivo | Cobertura principal |
|---|---|
| `tests/dinero.test.ts` | Exactitud, redondeo, moneda y errores. |
| `tests/plan-amortizacion.test.ts` | CA-01 y plan completo. |
| `tests/calculadora-mora.test.ts` | CA-02, fechas y fronteras. |
| `tests/prelacion-pago.test.ts` | CA-03–CA-05, Chain y Strategy. |
| `tests/credito-estado.test.ts` | State, guardas, terminales e historial. |
| `tests/cartera.test.ts` | CA-06/CA-07 y reglas de riesgo. |
| `tests/invariantes.test.ts` | Integración transversal entre los módulos. |

## 3. Suite transversal de invariantes

La nueva suite no repite únicamente casos unitarios: compone objetos reales de los distintos módulos y verifica las ecuaciones y restricciones en sus fronteras.

| Invariante | Evidencia ejecutable |
|---|---|
| INV-01 | Amortizaciones del plan suman exactamente Q10,000.00. |
| INV-02 | Último saldo del plan es Q0.00. |
| INV-03 | Saldos y amortizaciones nunca son negativos. |
| INV-04/05 | SOLICITADO y RECHAZADO rechazan pagos. |
| INV-06 | Razón de cartera exacta permanece en `[0,1]`. |
| INV-09 | Regularización EN_MORA retorna a VIGENTE y reactiva devengo. |
| INV-10 | Fecha, días y tramo permanecen consistentes. |
| INV-11 | Moratorio se construye desde capital vencido y reproduce CA-02. |
| INV-12 | Conceptos aplicados más excedente equivalen al pago. |
| INV-13 | Strategy conserva íntegramente el excedente. |
| INV-14 | Una ecuación rechaza monedas heterogéneas. |
| INV-15 | Historial conserva cinco datos obligatorios. |
| INV-16 | Recuperación de incobrable no cambia estado ni historial. |

También se repite un cálculo completo con las mismas entradas para comprobar determinismo exacto.

## 4. Invariantes fuera del alcance ejecutable de E4

| Invariante | Motivo | Ubicación futura |
|---|---|---|
| INV-07 | Requiere mayor de movimientos append-only. | Cierres/mayor. |
| INV-08 | Al cierre de E4 requería registro de pago y alcance definitivo; fue resuelta posteriormente en la fase 24. | `pago-idempotente.ts`, `RegistrarPago`; DOC-24. |
| INV-17 | Requiere identidad y repositorio de cierres. | Cierres. |
| INV-18 | Requiere catálogo versionado y selección temporal de políticas. | Políticas/aplicación. |

No se simularon como pruebas aprobadas dentro del cierre de E4 porque sus componentes no pertenecían al walking skeleton mínimo solicitado. La matriz registra las resoluciones incorporadas en fases posteriores; INV-08 ya cuenta con evidencia en DOC-24.

## 5. Casos financieros completos

| Caso | Resultado verificado |
|---|---|
| CA-01 | 12 cuotas completas; Q12,055.45 pagado y saldo Q0.00. |
| CA-02 | Moratorio Q7.26. |
| CA-03 | Pago exacto Q1,011.88. |
| CA-04 | Pago parcial Q500.00; capital pendiente Q511.88. |
| CA-05 | Excedente Q1,988.12 conservado. |
| CA-06 | Cartera en riesgo 7.00%. |
| CA-07 | Cartera en riesgo 6.06% tras excluir C-005. |

## 6. Ejecución aislada

Se verificaron los comandos exigidos:

```text
npm install --offline
npm test
```

La instalación resolvió el lockfile desde caché, auditó 51 paquetes y reportó cero vulnerabilidades. La ejecución no requiere servidor, base de datos, variables externas ni servicios externos.

## 7. Restricciones de E4

| Restricción | Evidencia | Estado |
|---|---|---|
| No usar `Number` para dinero | API de `Dinero` usa cadena o `bigint`; importes internos decimales. | Cumplida |
| Sin `any` en dominio | Búsqueda estática sin coincidencias. | Cumplida |
| Sin Express/Fastify | No existen dependencias ni código de servidor. | Cumplida |
| Sin PostgreSQL/ORM | No existen controladores, adaptadores, ORM ni configuración de BD. | Cumplida |
| Sin frontend | Solo núcleo TypeScript y documentación. | Cumplida |
| Sin MCP/RAG | No existen módulos o dependencias asociados. | Cumplida |
| Tipado estricto | `tsc --noEmit` aprobado. | Cumplida |

`zod` está instalado desde la configuración inicial porque será utilizado en la fase 23, pero E4 no contiene contratos ni servidor.

## 8. Correspondencia E3 → E4

| Diseño E3 | Realización E4 |
|---|---|
| Value Object monetario | `Dinero`, `Moneda` |
| Cálculo financiero | Plan y calculadora de mora |
| Cartera y cobros | Chain, Strategy y State |
| Riesgo | Calculadora de cartera pura |
| Factory | `FabricaPlanAmortizacion` |
| Strategy | Políticas de excedente intercambiables |
| Chain of Responsibility | Prelación institucional no reordenable |
| State | Comportamientos concretos y terminalidad |

Los adaptadores y contratos permanecen fuera del núcleo, coherentemente con la arquitectura hexagonal y el monolito modular documentados.

## 9. Resultado de verificación

| Control | Resultado |
|---|---|
| Instalación aislada | Correcta |
| Auditoría npm | 0 vulnerabilidades |
| TypeScript estricto | Correcto |
| Archivos de pruebas | 7 aprobados |
| Pruebas totales | 179 aprobadas |
| Casos CA-01–CA-07 | Todos aprobados |
| Invariantes E4 ejecutables | INV-01–06 e INV-09–16 aprobadas |
| Infraestructura requerida | Ninguna |

## 10. Resultado

El walking skeleton E4 queda completo, instalable y ejecutable de forma autónoma. Sus módulos demuestran el recorrido esencial: dinero exacto → plan → mora → pago → estado → cartera en riesgo, con invariantes transversales y sin depender de infraestructura.
