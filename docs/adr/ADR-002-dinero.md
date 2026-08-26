# Representacion exacta de valores monetarios

## Estado

Aceptada

## Fecha

2026-08-20

## Contexto

El sistema calcula cuotas, intereses, mora, saldos y pagos. Los errores binarios de punto flotante, los redondeos inconsistentes o la mezcla accidental de monedas pueden producir diferencias contables y resultados dificiles de auditar.

Los importes observables deben manejar dos decimales con redondeo comercial, mientras que ciertos calculos intermedios -tasas, divisiones y potencias- requieren mayor precision. Ademas, la representacion debe conservarse de forma segura al atravesar contratos JSON.

## Decision

Se adopta el objeto de valor inmutable `Dinero` como representacion unica de importes monetarios del dominio.

- La aritmetica decimal usa `decimal.js` con precision interna de 40 digitos.
- Los importes observables se redondean a dos decimales mediante `ROUND_HALF_UP`.
- Las entradas publicas exactas se reciben como cadena decimal o como unidades menores en `bigint`; no se acepta `number`.
- Cada importe incluye una moneda de tres letras mayusculas.
- Toda operacion entre importes exige la misma moneda; no se realiza conversion cambiaria implicita.
- La serializacion usa `{ importe: string, moneda: string }` para preservar el valor exacto.
- `Dinero` admite valores con signo; las restricciones de no negatividad corresponden al agregado o regla de negocio que los consume.

## Alternativas consideradas

### `number` de JavaScript

Es nativo y conveniente, pero usa punto flotante binario y puede introducir errores en operaciones decimales. Se descarto por no ofrecer exactitud monetaria reproducible.

### Unidades menores exclusivamente con `bigint`

Representa importes de dos decimales de forma exacta. Se descarto como solucion exclusiva porque tasas, divisiones, potencias y resultados intermedios requieren una politica adicional de escala y redondeo, aumentando la complejidad de los calculos financieros.

### Uso directo de `decimal.js` en todo el sistema

Proporciona precision decimal, pero expondria la biblioteca y permitiria politicas de redondeo o moneda inconsistentes entre modulos. Se descarto en favor de encapsularla en un objeto de valor del dominio.

### Cadenas decimales con aritmetica propia

Evita el punto flotante, pero exige implementar y mantener operaciones, escalas y redondeos financieros. Se descarto por su coste y riesgo de errores.

## Consecuencias

### Beneficios

- Los resultados monetarios son exactos, deterministas y reproducibles.
- La politica de precision y redondeo se aplica en un solo lugar.
- El tipo impide mezclar monedas accidentalmente.
- La serializacion JSON no pierde precision.
- El dominio no queda expuesto directamente a la API de la biblioteca decimal.

### Desventajas y trade-offs

- El nucleo mantiene una dependencia controlada de `decimal.js`.
- Los limites del sistema deben convertir explicitamente cadenas, unidades menores y objetos serializados.
- La creacion de objetos y la aritmetica decimal tienen mayor coste que las operaciones nativas con `number`.
- La precision interna de 40 digitos es mayor que la precision observable de dos decimales, por lo que cada punto de materializacion debe respetar la politica acordada.
- Permitir valores con signo hace necesario que cada agregado aplique sus propias restricciones contextuales.