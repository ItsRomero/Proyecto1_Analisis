# Proyecto 2: evolución del núcleo

## Alcance y correspondencia

Se conserva el núcleo TypeScript estricto del monolito modular hexagonal, `Dinero`, la prelación y las 206 pruebas P1. No se implementan servidor, persistencia ni UI. La base está en [auditoría](00-auditoria-inicial.md) y los resultados en [validación](03-validacion-final.md).

| Requisito | Implementación y evidencia |
|---|---|
| CP-01 | `PoliticaMora`, plana/escalonada, catálogo por otorgamiento; `politica-mora.test.ts` |
| CP-02 | `generarGastoGestion` e `incorporarGastoGestion`; `gasto-gestion-cobro.test.ts` |
| CP-03 | Coexistencia y sustitución verificadas en `contrato-politica.test.ts` y `regresion-p1.test.ts` |
| CP-04.1 | `Credito.liquidarConPago`, `EstadoEnMora.cancelar`; `credito-cancelacion-p2.test.ts` |
| CP-04.2 | `DevengoInteres`; `devengo-interes.test.ts` |
| CP-04.3 | `calcularCarteraPorTramo`; `cartera-por-tramo.test.ts` |

El documento del encargo enumera CP-03 pero no contiene una sección normativa separada para él. Aquí se usa ese identificador para trazar coexistencia y sustituibilidad ya exigidas, sin inventar otra funcionalidad.

## Selección, fórmula y redondeo

`consultarMora` recibe crédito, estado, fecha de otorgamiento, fecha de corte y cuotas con capital y vencimiento. Selecciona una política mediante `resolverPolitica` y la inyecta en `CalculadoraMora`. La calculadora no importa implementaciones concretas.

- Otorgamiento anterior a 2026-10-01: `POL-2024-01`, plana 24%, Actual/360.
- Otorgamiento desde esa fecha: `POL-2026-10`, escalonada.
- La fecha de ejecución no interviene. El código P1 de `FechaCivil` usa `new Date(0)` para validar fechas recibidas, no para leer el reloj actual.

La configuración inmutable está en `src/dominio/politica-mora/configuracion-politica.ts`: identificador, vigencia, autor documental, motivo, base, tasas y límites. `autor` identifica la fuente del encargo, no una aprobación humana. La fecha inicial de la política histórica no fue proporcionada: su vigencia se registra como `null`, y el catálogo la aplica a todo otorgamiento anterior a la fecha de cambio.

| Tramo | Días | TNA |
|---|---|---|
| MORA_1 | 1–30 | 18% |
| MORA_2 | 31–60 | 24% |
| MORA_3 | 61–90 | 30% |
| VENCIDO | 91–120 | 36% |
| INCOBRABLE, clasificación por días | >120 | 0% de devengo adicional |

Para cada cuota, `diasTramo = max(0, min(atraso, hasta) - desde + 1)` y `mora = min(capital, suma(capital × TNA × diasTramo / 360))`. La única base es capital vencido; no se reciben intereses como base. Las sumas permanecen en Decimal de 40 cifras y se materializa **un solo Dinero al final** de la cuota, con dos decimales y `ROUND_HALF_UP`. El detalle expone las cadenas decimales sin redondear; no son importes ya contabilizados. Si un tope opera, la suma bruta del detalle puede superar el total limitado.

Con capital Q725.76:

| Caso | Días | Moratorio | Total exigible con Q278.86 de corriente |
|---|---:|---:|---:|
| M-1 | 15 | Q5.44 | Q1,010.06, sin gasto |
| M-2 | 45 | Q18.14 | Q1,047.76, incluido gasto |
| M-3 | 100 | Q50.80 | — |
| M-4 | 120 | Q65.32 | — |
| Congelación | 121 y 150 | Q65.32 | — |
| M-5, cuota 2 | 45 | Q18.14 | Q25.00 + Q18.14 + Q278.86 + Q725.76 = Q1,047.76 |
| Plana histórica | 15 / 45 | Q7.26 / Q21.77 | — |

En el día 100 los tramos producen `10.8864 + 14.5152 + 18.144 + 7.2576 = 50.8032`, que redondea a Q50.80. Redondear cada tramo daría Q50.81 y está expresamente descartado.

La política retroactiva es un doble **no productivo**: entre 1–120 aplica la tasa actual a todos los días. Para admitir las mismas entradas que las demás estrategias, congela su propio resultado del día 120 después de ese límite (Q87.09 en el ejemplo). Esa extensión del doble no es una regla de negocio. Nunca se compara escalonada ≤ retroactiva fuera de 1–120 y el catálogo no importa ni selecciona el doble.

## Compatibilidad y baja incobrable

`calculadora-mora.ts` sí cambió: incorporó la instancia inyectable y reexporta la clasificación extraída. Los métodos estáticos P1 conservan firma y fórmula originales. Esa fachada de tasa libre no aplica las reglas nuevas de tope, selección ni congelación; los consumidores P2 deben usar `consultarMora` o el motor inyectado. No se presenta la fachada como un cierre P2.

Se distingue la clasificación `TramoMora.INCOBRABLE` (>120 días) del estado contable `EstadoCredito.INCOBRABLE`. La escalonada congela automáticamente el cálculo al llegar a 120, incluso antes de una declaración. Se mantiene la transición State P1, que requiere atraso >120, autorización y evidencia para dar la baja y excluir el crédito de cartera activa. Así se conserva el comportamiento contractual probado en P1; la consulta financiera no modifica créditos ni autoriza bajas. Un activo pendiente de declaración permanece en la contribución VENCIDO del riesgo, aunque tenga más de 120 días.

Para un crédito ya declarado incobrable, `consultarMora` exige `fechaDeclaracionIncobrable`, limita a esa fecha el corte de devengo y mantiene visible el corte solicitado. Esto congela también la política plana sin modificar lo acumulado antes de la baja. El llamador proporciona una fotografía de capital congruente con ese corte: reconstruir saldos históricos tras pagos es responsabilidad de una persistencia futura.

## Gasto e idempotencia

La clave es la tupla serializada `[creditoId, cuotaId, "GESTION_COBRO"]`, evitando colisiones por separadores. Desde 31 días, si no consta la clave, se devuelve un nuevo evento por Q25 y la lista de identificadores actualizada. Un primer cierre tardío recupera el gasto omitido; nunca produce uno por cada tramo recorrido. Repetir usando la lista devuelta no genera evento, en la misma fecha o en otra.

`incorporarGastoGestion` suma solamente el evento nuevo a `gastosComisiones`; el procesador P1 conserva gastos → moratorio → corriente → capital. El gasto es GTQ, por lo que `Dinero` rechaza incorporarlo a saldos de otra moneda. El llamador conserva conjuntamente identificadores y saldos actualizados. No se prometen garantías concurrentes de una base de datos inexistente: dos llamadas con la misma fotografía antigua son el mismo cálculo puro, no dos confirmaciones persistentes.

## Cancelación y devengo corriente

`liquidarConPago(evidencia, saldoTotal, cuotasVencidasPendientes)` exige saldo monetario cero y contador entero no negativo igual a cero. `saldoTotal` incluye gastos, ambos intereses y capital después del pago; el llamador proporciona ese total. Una guarda fallida no cambia el historial. SOLICITADO no admite pagos ni cancelación. La fachada booleana de P1 se mantiene.

`DevengoInteres` es un estado contable inmutable por crédito y moneda. Cada movimiento trae fecha, atraso e importe **incremental de esa fecha**, no un total acumulado. No reparte automáticamente un importe global que cruce la frontera de 90 días: el llamador suministra los movimientos separados y puede enviarlos juntos en un corte.

- Hasta día 90 reconoce el movimiento en ingreso.
- Desde 91 lo acumula en `interesEnSuspenso`.
- La regularización explícita libera el suspenso a `reconocidoEnPeriodo`, lo deja en cero y reactiva devengo.
- Repetir el último corte con entradas idénticas devuelve el mismo objeto; no produce otra contabilización. No se debe volver a sumar `reconocidoEnPeriodo` como si fuera un evento nuevo.
- Mismo corte con entradas diferentes produce conflicto. Cortes regresivos, fechas duplicadas/solapadas y movimientos posteriores al corte se rechazan. Un corte nuevo posterior a una regularización ya no vuelve a reconocer el suspenso liberado.
- La operación de aplicación futura debe coordinar State y este modelo. El booleano histórico de `Credito` no es el registro contable de suspenso.

## Cartera: mora, riesgo y redondeo porcentual

El método agregado P1 queda intacto. La operación nueva devuelve agregado, tramosEnRiesgo, activa, mora y bajas entre `inicioPeriodo` y `fechaCorte` inclusivos. Cada fila de riesgo tiene cantidad, capital y porcentaje. **Las filas representan contribución al riesgo**, no toda la población atrasada: Mora 1 aporta cero porque el riesgo P1 comienza después de 30 días. Un reestructurado aporta una sola vez a REESTRUCTURADO, aunque también esté atrasado.

La fotografía sintética de prueba (no datos reales de clientes) distribuye Q800,000 así: Q620,000 al día; Q124,000 a 15 días; Q24,000 a 45; Q18,000 a 75; Q8,000 a 100; y Q6,000 reestructurados al día. Así se obtienen:

| Contribución | Capital | Porcentaje |
|---|---:|---:|
| Mora 1 | Q0.00 | 0.00% |
| Mora 2 | Q24,000.00 | 3.00% |
| Mora 3 | Q18,000.00 | 2.25% |
| Vencido | Q8,000.00 | 1.00% |
| Reestructurado | Q6,000.00 | 0.75% |
| Total riesgo | Q56,000.00 | 7.00% |

La mora incluye todo saldo activo con atraso >0: Q124,000 + Q24,000 + Q18,000 + Q8,000 = Q174,000, 21.75%. El reestructurado al día aporta al riesgo y no a mora. Después de declarar C-005 incobrable, activa = Q792,000, riesgo = Q48,000 y porcentaje = 6.06%; Q8,000 permanecen visibles en bajas del período.

La suma monetaria es exacta con `Dinero`. Las centésimas de porcentaje se distribuyen por restos mayores con desempate por orden de tramo, para coincidir con el porcentaje total redondeado; por ejemplo, tres tercios se presentan 33.34%, 33.33%, 33.33%. El ajuste es de presentación, no de saldo. Sin cartera activa los porcentajes son `null`, conservando `SIN_CARTERA_ACTIVA` y evitando 0/0. Bajas duplicadas o incompatibles con estados presentes se rechazan.

## Contratos y pruebas

Los campos P2 de Zod/OpenAPI son opcionales para aceptar respuestas P1. `presentarMora` y `presentarCartera` convierten fechas, dinero y detalles a JSON y validan con Zod. Se conserva ErrorApi y las 14 operaciones documentadas; no hay servidor. Se corrigió la descripción histórica de `Porcentaje` a escala 0–100, distinguiéndola de `razon`.

Contrato LSP común: tipos, no negatividad, moneda, tope, determinismo, inmutabilidad y sustitución en motor. Pruebas específicas: fórmula por tramos, monotonía, congelación, comparación 1–120 y coexistencia por otorgamiento. Los ocho invariantes están trazados en la [matriz](../trazabilidad/matriz-trazabilidad.md).
