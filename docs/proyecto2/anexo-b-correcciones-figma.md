# Anexo B · Instrucciones de corrección para los prototipos de Figma

## Cómo usar este anexo

El prototipo web se hizo con Figma Make, que acepta instrucciones escritas. El texto de la sección siguiente se puede pegar tal cual en el chat de Figma Make. Las correcciones del prototipo móvil se hacen a mano en Figma, con la tabla de la última sección. Todas las cifras salen del núcleo (sección 4.5).

## Instrucción para Figma Make (prototipo web)

```text
Corrige el prototipo con estas reglas y cifras exactas. No cambies el diseño visual salvo donde se indica.

1. Detalle de mora (caso M-3, 100 días de atraso):
   - La mora se calcula sobre el CAPITAL EN MORA de la cuota vencida (Q725.76), no sobre el saldo.
   - Tasas ANUALES por tramo, base Actual/360: Mora 1 (1–30 días) 18 %, Mora 2 (31–60) 24 %,
     Mora 3 (61–90) 30 %, Mora 4 (91–120) 36 %. Elimina el tramo "Vencido 5 % mensual".
   - Montos por tramo: Q10.89, Q14.52, Q18.14 y Q7.26 (10 días). Total: Q50.80.
   - Agrega la nota: "Cada tramo se muestra redondeado; el total se redondea una sola vez: Q50.80, no Q50.81."
   - Abre esta pantalla desde un crédito con 100 días de atraso (no desde el de 45 días).

2. Crédito de María García López (CRD-2024-0892), cuota 6 vencida hace 45 días:
   - "Exigible hoy" = Q1,050.04 (gasto Q25.00 + mora Q20.42 + interés Q187.77 + capital Q816.85).
   - En Registrar pago, el monto rápido "Cuota + mora" = Q1,050.04.
   - En Confirmar pago, la prelación es: Gastos de cobro Q25.00 · Interés moratorio Q20.42 ·
     Interés corriente Q187.77 · Abono a capital Q816.85. Total Q1,050.04.
   - En los créditos del tramo 31–60, "Mora acum." de María = Q20.42.
   - El gasto de cobro es siempre Q25.00 por cuota vencida y se genera una sola vez al llegar al día 31.

3. Plan de amortización y simulación (Q10,000, 3 % mensual, 12 meses):
   - Saldos después de las cuotas 8 a 11: Q3,734.28, Q2,841.69, Q1,922.32 y Q975.37.
   - Fila 12: cuota Q1,004.63, interés Q29.26, capital Q975.37, saldo Q0.00. Resalta la fila y conserva la nota del ajuste.

4. Solicitud de crédito:
   - En Confirmar solicitud cambia "autoriza el desembolso" por "envía la solicitud al comité".
   - Agrega después de la aprobación una pantalla "Confirmar desembolso" con: monto, plazo, cuota, tasa,
     total a pagar y la política de mora vigente (18/24/30/36 % anual); casilla de aceptación;
     botones "Desembolsar" y "Volver y corregir"; aviso de que la acción no se puede deshacer.

5. Datos de ejemplo coherentes en todas las pantallas:
   - Ana Lucía Morales: 31–60 días en todas las pantallas.
   - Pedro Alvarado Castro: un solo código, CRD-2024-0488; su cuota (Q12,000, 12 meses, 3 %) es Q1,205.55.
   - Andrés Lima Castillo (Q5,000, 12 meses, 3 %): cuota Q502.31.
   - José Domingo Pérez: los mismos días de atraso en Cartera y en los créditos del tramo.
   - Todas las fechas en septiembre de 2026.

6. Accesibilidad (WCAG 1.4.3 y 3.2.6):
   - Texto secundario #475569 en lugar de #90A1B9; "Ver →" en #334155; "23.4%" en #C2410C; verdes en #15803D.
   - Texto de las etiquetas "30d" del recorrido de la mora en #1E293B.
   - Un botón "?" de ayuda en el mismo lugar del encabezado de todas las pantallas.

7. Panel gerencial: agrega "Cierre mensual" junto a "Cierre diario", con el mismo flujo de verificación y congelamiento.
```

## Correcciones del prototipo móvil (a mano en Figma)

| Pantalla | Corrección |
|---|---|
| P10 Detalle de mora | Igual que el punto 1 de la instrucción: tasas anuales, base Q725.76, total Q50.80 con la nota de redondeo |
| P10 · «Total a pagar hoy» | Cambiar Q6,469.31 por lo exigible de la cuota: Q1,047.76 (M-5) |
| P11 Registrar pago | Gastos de gestión Q25.00 (no Q150.00); formato «Q 10,000.00» mientras se escribe; atajos 1/2/3 cuotas conectados a su monto |
| P07 Solicitud enviada | Mantener el cliente elegido en el paso 1 (Carlos Martínez Ixcot) |
| P14 Sin señal | El folio PAG-251250 no cambia al sincronizar |
| P13 Pago aplicado | Agregar el saldo de capital restante |
| P09 Plan de amortización | Nota: «1 centavo más para que el saldo cierre exacto en Q0.00» |
