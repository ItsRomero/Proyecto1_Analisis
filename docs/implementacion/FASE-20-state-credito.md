# Fase 20 — State del crédito

## 1. Objetivo

Implementar el ciclo de vida completo del crédito mediante State Pattern, haciendo inválidas por diseño las operaciones no admitidas y conservando evidencia inmutable de cada transición.

## 2. Artefactos

| Archivo | Responsabilidad |
|---|---|
| `src/dominio/credito-estado.ts` | Agregado `Credito`, estados concretos, guardas e historial. |
| `tests/credito-estado.test.ts` | Caminos válidos, guardas, terminales, recuperación e historial. |

## 3. State Pattern

`Credito` delega cada operación al comportamiento de su estado actual. La clase base rechaza todas las operaciones; cada estado concreto sobrescribe únicamente las permitidas. No existe un `if/else` o `switch` central que decida transiciones.

El cambio interno requiere un token privado del módulo. Los consumidores solo pueden intentar operaciones de negocio y no pueden asignar arbitrariamente un estado.

## 4. Transiciones implementadas

| Origen | Operación | Destino | Guardas principales |
|---|---|---|---|
| SOLICITADO | aprobar | APROBADO | Evaluación concluida y autorización. |
| SOLICITADO | rechazar | RECHAZADO | Decisión emitida, autorización y motivo. |
| APROBADO | desembolsar | DESEMBOLSADO | Aprobación vigente, política fijada y desembolso único. |
| APROBADO | anular | ANULADO | Ausencia de desembolso. |
| DESEMBOLSADO | activar | VIGENTE | Plan generado y saldo reconocido. |
| VIGENTE | detectar mora | EN_MORA | Atraso >0 y obligación vencida. |
| VIGENTE | cancelar | CANCELADO | Capital y obligaciones en cero. |
| EN_MORA | pago parcial | EN_MORA | Permanece vencido pendiente. |
| EN_MORA | regularizar | VIGENTE | Atraso cero y todo lo vencido cubierto. |
| EN_MORA | reestructurar | REESTRUCTURADO | Autorización y condiciones nuevas. |
| EN_MORA | declarar incobrable | INCOBRABLE | Más de 120 días y autorización contable. |
| REESTRUCTURADO | nuevo atraso | EN_MORA | Atraso >0 y obligación reestructurada vencida. |
| REESTRUCTURADO | cancelar | CANCELADO | Capital y obligaciones en cero. |

El paso `DESEMBOLSADO → VIGENTE` queda explícito después de reconocer plan y saldo, resolviendo DP-10 sin ocultar el estado transitorio.

## 5. Terminalidad e irreversibilidad

`RECHAZADO`, `ANULADO` y `CANCELADO` no sobrescriben ninguna operación y, por tanto, son terminales. `INCOBRABLE` solo admite registrar conceptualmente una recuperación: el estado y el historial de transiciones permanecen iguales, porque la recuperación posterior es un hecho contable y no una reactivación crediticia.

En particular, `SOLICITADO` y `RECHAZADO` rechazan pagos sin crear evidencia parcial.

## 6. Historial append-only

Cada `TransicionEstado` conserva obligatoriamente:

1. estado anterior;
2. estado nuevo;
3. fecha civil;
4. usuario o proceso;
5. motivo.

Los textos vacíos son inválidos. Las fechas no pueden retroceder respecto de la última transición. Cada registro y el arreglo publicado están congelados; una transición nueva reemplaza internamente el arreglo por otro que incluye toda la historia anterior. Una operación inválida no cambia estado ni historial.

La transición reflexiva `EN_MORA → EN_MORA` por pago parcial se registra porque constituye un hecho auditable aunque no cambie el nombre del estado.

## 7. Devengo corriente

`devengoInteresCorrienteActivo` continúa verdadero en `EN_MORA` hasta 90 días y se suspende a partir del día 91. Al cubrir todo lo vencido y volver a `VIGENTE`, se reactiva. State conserva el resultado del umbral temporal definido y probado en la fase 18.

## 8. Errores

| Error | Condición |
|---|---|
| `TransicionInvalida` | Operación no admitida por el estado actual o intento de forzar cambio. |
| `GuardaTransicionIncumplida` | Falta una condición de negocio necesaria. |
| `EvidenciaTransicionInvalida` | Identificador, usuario/proceso o motivo vacío. |
| `CronologiaTransicionInvalida` | Fecha anterior a la última transición. |

## 9. Verificación

| Control | Resultado |
|---|---|
| Originación, desembolso y activación | Aprobado |
| Rechazo y anulación | Aprobado |
| Deterioro y regularización | Aprobado |
| Pago parcial permanece EN_MORA | Aprobado |
| Reestructuración, nuevo atraso y cancelación | Aprobado |
| Declaración >120 días | Aprobado |
| Incobrable irreversible | Aprobado |
| Cinco datos e historial inmutable | Aprobado |
| Operaciones inválidas sin efecto | Aprobado |
| TypeScript estricto | Aprobado |
| Suite completa | 5 archivos, 145 pruebas aprobadas |
| `any` evasivo | Ninguno |

## 10. Alcance pendiente

- La exclusión monetaria de incobrables y CA-06/CA-07 corresponden a cartera en riesgo de la fase 21.
- Los asientos concretos de recuperaciones posteriores a incobrable requieren el módulo contable futuro.
- La autorización se recibe como guarda explícita; identidad, roles y persistencia pertenecen a capas posteriores.

## 11. Resultado

RF-14 a RF-17, RN-21 a RN-25 e INV-04, INV-05, INV-09, INV-15 e INV-16 quedan implementados y verificados. RF-19 queda cubierto respecto de la no reactivación; su exclusión de cartera se completa en la fase 21.
