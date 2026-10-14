# Vista del cliente (C01–C06)

El prototipo de cliente de Figma Make ([Prototipo Cliente](https://www.figma.com/make/3P7qsVBkFW6B9SShgQEBoz/Prototipo-Cliente?fullscreen=1&t=sokzjUmb0IMEfUqX-1&code-node-id=0-6)) muestra lo que ve la persona que tiene el crédito. No muestra el nombre del cliente: la aplicación se dirige al **usuario** de la sesión («Mi crédito», «Tu avance», «Tu situación hoy»). Sus skeletons se midieron del prototipo a 390 px (script `wireframes/generar_skeletons_cliente.py`) y están en el Anexo A.

| Código | Pantalla | Qué va en cada bloque | Caso de uso |
|---|---|---|---|
| **C01** | Inicio · Mi crédito | Encabezado con ayuda «?»; aviso de atraso; deuda actual con barra de avance; próxima cuota con etiqueta de estado; 12 casillas de cuotas; botones «Ver detalle de mi crédito» y «Entender mi atraso»; barra inferior Inicio · Mi crédito · Ayuda | CU-15 · CU-08 |
| **C02** | Mi crédito en detalle | Cuatro datos del crédito (capital original, capital pendiente, cuotas pagadas, tasa); tarjeta del atraso actual; historial de pagos con una fila por cuota; «Ver plan completo de cuotas» | CU-15 |
| **C03** | Plan de cuotas | Resumen (capital, cuotas, tasa); tabla de 12 filas con fecha, cuota y saldo; las cuotas pagadas, vencidas y futuras se distinguen por el ícono | CU-15 |
| **C04** | Entendiendo tu atraso | Situación de hoy en lenguaje llano; línea de tiempo por etapa (al día, 1–30, 31–60 días, siguiente etapa); resumen de lo que se debe; «Ver el aviso que recibiste» | CU-08 |
| **C05** | Aviso de cambio de etapa | Fecha del aviso; qué cambió (antes / ahora); cuánto cambió el cargo por día; próxima advertencia; «Entendido» y «Tengo dudas — ir a Ayuda» | CU-08 (momento crítico MC-4) |
| **C06** | Ayuda | Preguntas frecuentes desplegables y teléfono de atención | Soporte (WCAG 3.2.6) |

**Qué resuelve.** Explica la mora al cliente sin tecnicismos, cumple el aviso preventivo que propuso el E1 para el momento crítico MC-4 (el cliente se entera antes del cambio de tramo, no después) y pone la ayuda en el mismo lugar de todas las pantallas. El plan de cuotas (C03) coincide con el núcleo, incluida la cuota 12 de Q1,004.63.

**Cifras a corregir** (al 12 de septiembre de 2026: 42 días de atraso de la cuota 5 y 11 de la cuota 6)

| Pantalla | Prototipo | Valor correcto |
|---|---|---|
| C01 · C02 · Deuda y capital pendiente | Q6,259.07 con 4 de 12 cuotas pagadas | Con 4 cuotas pagadas el capital pendiente es **Q7,052.13** (pagado Q2,947.87); Q6,259.07 corresponde a 5 cuotas pagadas |
| C04 · Cargos por atraso | ~Q188 en la etapa 1, ~Q125 en la etapa 2, total Q313.00 | Mora de la cuota 5 (capital Q793.06): **Q18.24**; de la cuota 6 (capital Q816.85): **Q4.49**; gasto de cobro de la cuota 5: **Q25.00**. Cargos: **Q47.73** |
| C04 · Total a pagar hoy | Q2,322.24 | **Q2,056.97** = Q2,009.24 de cuotas vencidas + Q47.73 |
| C04 · Etapas | «61–120 días» como una sola etapa | Dos etapas: 61–90 días (30 % anual) y 91–120 días (36 % anual) |
| C05 · Cargo por día | ~Q6.27 → ~Q10.44 (+Q4.17 al día) | Cuota 5: **Q0.40 → Q0.53 al día (+Q0.13)**; además, al pasar el día 30 se cobra **una sola vez Q25.00** de gasto de gestión |
| C06 · «¿Cómo se calcula…?» | «Se multiplica el saldo pendiente por una tasa diaria» | «Se multiplica el **capital de cada cuota vencida** por la tasa anual de su etapa ÷ 360, por cada día; al pasar el día 30 se suma un gasto de Q25.00 por cuota» |
| C02 · C03 · Fechas | «01/Apr/2026» | «01/abr/2026» (meses en español) |
