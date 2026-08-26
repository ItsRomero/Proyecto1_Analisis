# Amortizacion francesa con ajuste en la ultima cuota

## Estado

Aceptada

## Fecha

2026-08-20

## Contexto

El producto requiere generar planes de pago mediante el sistema frances: cuotas periodicas niveladas calculadas a partir del capital, la tasa nominal anual y el numero de periodos. Al expresar dinero con dos decimales, el redondeo de cada cuota puede dejar un saldo residual o hacer que la suma de las amortizaciones difiera del capital original.

El resultado debe ser determinista, auditable y conservar exactamente el capital, incluso cuando el importe matematico de la cuota tenga mas de dos decimales. Todavia no existe una politica de calendario o vencimientos, por lo que esa decision queda fuera del calculo financiero actual.

## Decision

Se adopta el metodo de amortizacion frances con las siguientes reglas:

- La tasa periodica se obtiene como tasa nominal anual dividida entre 12.
- Para una tasa distinta de cero se utiliza la formula de cuota constante del sistema frances.
- Para tasa cero se utiliza una rama explicita que divide el capital entre el numero de cuotas.
- Las primeras `n - 1` cuotas se calculan y redondean conforme a la politica monetaria.
- La ultima cuota se ajusta: su amortizacion equivale al saldo pendiente y su importe es la suma exacta de ese capital y su interes.
- El plan resultante debe terminar con saldo cero y la suma de las amortizaciones debe ser exactamente igual al capital original.
- Las fechas y reglas de calendario se incorporaran mediante una politica separada cuando sean definidas.

## Alternativas consideradas

### Sistema aleman o amortizacion constante

Reduce progresivamente el importe de las cuotas y simplifica la amortizacion de capital. Se descarto porque no corresponde al sistema frances requerido por el producto.

### Mantener todas las cuotas identicas sin ajuste final

Conserva una igualdad visual estricta entre cuotas, pero el redondeo puede dejar saldo residual o alterar el capital total amortizado. Se descarto porque viola las invariantes contables del plan.

### Distribuir las diferencias de redondeo entre varias cuotas

Puede reducir la diferencia visible de la ultima cuota. Se descarto porque complica la explicacion, reproduccion y auditoria del calendario, y vuelve menos estable la secuencia ante cambios minimos.

### Calcular con punto flotante binario

Simplifica la implementacion matematica, pero introduce diferencias no deterministas al materializar importes monetarios. Se descarto por incompatibilidad con la politica exacta de dinero.

## Consecuencias

### Beneficios

- El plan satisface literalmente el metodo frances requerido.
- El saldo final es cero y el capital se conserva de manera exacta.
- El tratamiento de redondeos es determinista, localizable y facil de auditar.
- La tasa cero esta definida sin divisiones problematicas ni casos implicitos.
- El calculo financiero permanece separado de decisiones futuras de calendario.

### Desventajas y trade-offs

- La ultima cuota puede diferir por algunos centavos de las anteriores.
- Los contratos y la interfaz futura deberan explicar que la igualdad de cuotas esta sujeta al ajuste contable final.
- La implementacion requiere validar invariantes y tratar explicitamente la ultima cuota.
- Una politica futura de fechas, dias reales o periodos distintos de meses podria exigir una nueva decision y otra formula de tasa periodica.
- Cambiar a otro metodo de amortizacion requerira una estrategia separada, no una modificacion silenciosa de este algoritmo.