# E5 · Evaluación heurística y de accesibilidad

## Método y estado

El enunciado pide que **los cuatro integrantes evalúen por separado** y después consoliden, porque varios evaluadores independientes encuentran más problemas que uno solo. Este capítulo reúne dos insumos y deja preparado el tercero:

| Insumo | Estado | Contenido |
|---|---|---|
| Evaluación preliminar del prototipo móvil | Hecha (23/09) | 14 hallazgos de un evaluador, con apoyo de IA declarado en el capítulo 9 (H-01 a H-14) |
| Revisión del prototipo web con medición | Hecha (23/09) | 8 hallazgos nuevos (H-15 a H-22). El contraste de cada texto se calculó con la fórmula de WCAG sobre sus colores reales y se midió el tamaño de cada control interactivo en 13 pantallas |
| Evaluación independiente de los cuatro integrantes, cinco correcciones con antes/después y design review | **Pendiente del equipo** | Formularios en el Anexo C. Los resultados no se inventan: se registran cuando cada integrante haga su evaluación |

Escala de severidad (Anexo C del enunciado): 0 no es problema · 1 cosmético · 2 menor · 3 mayor · 4 catastrófico.

## Hallazgos heurísticos (Nielsen)

| # | Prototipo · pantalla | Hallazgo y evidencia | Heurística | Sev. | Corrección propuesta |
|---|---|---|---|---|---|
| H-01 | Móvil · Detalle de mora | Tasas mensuales de 0.5 %–2 % sobre el saldo total | 2 · Correspondencia con el mundo real | **4** | Caso M-3 con tasas anuales sobre el capital en mora (sección 4.5) |
| H-02 | Móvil · Detalle de mora | «Total a pagar hoy Q6,469.31» suma el saldo completo; el cliente cree que debe eso hoy | 5 · Prevención de errores | **4** | Mostrar lo exigible de la cuota vencida (M-5: Q1,047.76) |
| H-03 | Móvil · Detalle de mora | Un crédito incobrable (132 días) sigue mostrando recargos, con datos de otro cliente | 4 · Consistencia y estándares | 3 | Congelar la mora al día 120 |
| H-04 | Móvil · Sin señal | El folio cambia de PAG-251250 a PAG-309097 al sincronizar | 1 · Visibilidad del estado | 3 | Mismo folio (clave de idempotencia) en cada reintento |
| H-05 | Móvil · Sin señal | «Si lo registra otra vez se duplicará» deja a la asesora evitar el doble cobro | 5 · Prevención de errores | 3 | Que el sistema lo impida y lo diga |
| H-06 | Móvil · Registrar pago | El monto se ve como «Q 10000», sin separador de miles | 5 · Prevención de errores | 3 | Formato en vivo «Q 10,000.00» |
| H-07 | Móvil · Registrar pago | Gastos de gestión de Q150.00 | 2 · Correspondencia | 3 | Q25.00 por cuota vencida |
| H-08 | Móvil · Solicitud enviada | El cliente cambia de Carlos Martínez a Juan Pablo Pérez | 4 · Consistencia | 3 | Mantener el cliente seleccionado |
| H-09 | Móvil · Plan de amortización | La cuota 12 está resaltada pero sin explicación | 10 · Ayuda y documentación | 2 | Nota del centavo de ajuste (ya resuelto en el prototipo web) |
| H-10 | Móvil · Mis Clientes | «Mora 1/2/3» no significa nada para el cliente | 2 · Correspondencia | 2 | «Más de 30 días de atraso» |
| H-11 | Ambos · todas | La ayuda solo aparece en el inicio de sesión del móvil; el prototipo web no tiene ayuda | 10 · Ayuda / WCAG 3.2.6 | 2 | Ícono «?» en el mismo lugar de cada encabezado |
| H-12 | Móvil · Registrar pago | Los atajos «1 / 2 / 3 cuotas» no llenan el monto | 7 · Flexibilidad y eficiencia | 2 | Conectar cada atajo con su monto |
| H-13 | Móvil · Pago aplicado | El comprobante no muestra el saldo restante (el web sí: «Nuevo saldo») | 1 · Visibilidad del estado | 2 | Agregar el saldo restante |
| H-14 | Móvil · Detalle de mora y pago | Textos secundarios pequeños y en gris claro | 8 · Diseño estético / WCAG 1.4.3 | 2 | 14 px y contraste ≥ 4.5:1 |
| H-15 | Web · Detalle de mora | Tasas de 2 %, 3 %, 4 % y 5 % mensual sobre el saldo de Q6,259.07; total Q667.65 para 100 días | 2 · Correspondencia | **4** | M-3: 18/24/30/36 % anual sobre Q725.76 = Q50.80 |
| H-16 | Web · Confirmar pago | Gastos Q125.00 y mora Q219.07 en la prelación; el monto rápido «Cuota + mora» es Q1,500.00 | 5 · Prevención de errores | **4** | Q25.00 y Q20.42; «Cuota + mora» = Q1,050.04 (sección 4.5) |
| H-17 | Web · Crédito → Detalle de mora | El crédito dice 45 días de atraso y su detalle de mora, 100 días | 4 · Consistencia | 3 | Los mismos días en ambas pantallas |
| H-18 | Web · Plan y simulación | La fila 12 dice Q1,004.62 mientras la nota dice Q1,004.63; el saldo pierde un centavo desde la cuota 8 | 4 · Consistencia | 2 | Q3,734.28 … Q975.37 y cuota 12 de Q1,004.63 |
| H-19 | Web · todas | El texto secundario #90A1B9 sobre blanco tiene contraste 2.63:1 (29 textos en el Dashboard, 47 en Clientes) | 8 · Diseño estético / WCAG 1.4.3 | 3 | Usar #475569 o más oscuro (≥ 4.5:1) |
| H-20 | Web · Confirmar solicitud | El texto dice «autoriza el desembolso», pero el flujo termina en «Solicitud enviada · En revisión» | 2 · Correspondencia | 3 | Separar la solicitud (va al comité) del desembolso (después de aprobar) |
| H-21 | Web · Pago y Cartera | Ana Lucía Morales aparece «Al día» y «31–60 d»; Pedro Alvarado tiene dos códigos de crédito | 4 · Consistencia | 3 | Un solo conjunto de datos de ejemplo |
| H-22 | Web · Dashboard | «Ver →» en #CAD5E2 sobre blanco (1.49:1): la entrada al flujo 3 casi no se ve | 6 · Reconocer antes que recordar | 2 | Enlace visible («Ver créditos →») con contraste ≥ 4.5:1 |

## Auditoría WCAG 2.2 (criterios A/AA nuevos + 3.3.4)

Resultados sobre el **prototipo web**, medidos el 23/09 en 13 pantallas: Inicio, solicitud (3 pasos), buscar cliente, crédito, detalle de mora, registrar pago, confirmar pago, Dashboard, Cartera y Clientes.

| Criterio | Nivel | Resultado | Evidencia |
|---|---|---|---|
| 2.4.11 Focus Not Obscured (Minimum) | AA | ✅ Cumple | Ninguna pantalla tiene elementos fijos o pegajosos (`position: fixed/sticky`) que puedan tapar el foco |
| 2.5.7 Dragging Movements | AA | ✅ Cumple | El único control que admite arrastre es el deslizador del monto, y también responde a un clic en la barra; el plazo usa botones |
| 2.5.8 Target Size (Minimum) | AA | ✅ Cumple | El control más pequeño mide 28 px (chips de Clientes); en móvil, 44 px. Recomendación: llevar a 48 × 48 px lo que se usa en campo (E4) |
| 3.2.6 Consistent Help | A | ❌ No cumple | No hay ayuda en ninguna pantalla web (H-11) |
| 3.3.7 Redundant Entry | A | ✅ Cumple | El cliente se elige de una lista en el pago; la solicitud no vuelve a pedir datos ya capturados |
| 3.3.8 Accessible Authentication (Minimum) | AA | ✅ Cumple en el móvil | P01 usa usuario y contraseña con opción de mostrarla y sin pruebas cognitivas; el prototipo web no tiene inicio de sesión |
| 3.3.4 Error Prevention (Legal, Financial) | AA | ⚠️ Parcial | ✅ Solicitud: revisión en el paso 3 y casilla de aceptación. ✅ Pago: desglose y aviso antes de aplicar. ❌ Desembolso: la pantalla no existe todavía |
| 1.4.3 Contrast (Minimum), heredado | AA | ❌ No cumple | Tabla siguiente |

**Detalle del contraste (1.4.3).** Mínimo 4.5:1 para texto normal y 3:1 para texto grande (≥ 24 px, o ≥ 18.66 px en negrita).

| Color de texto sobre fondo | Contraste | Dónde aparece | Corrección |
|---|---|---|---|
| #90A1B9 sobre #FFFFFF | 2.63:1 | Etiquetas de indicadores, códigos de crédito, subtítulos (todas las pantallas) | #475569 (7.6:1) |
| #90A1B9 sobre #F8FAFC / #F1F5F9 | 2.51:1 · 2.40:1 | «Paso 1 de 3», «Período: septiembre 2024», encabezados de tabla | #475569 |
| #CAD5E2 sobre #FFFFFF | 1.49:1 | «Ver →» del Dashboard | #334155 |
| #F97316 sobre #FFFFFF | 2.80:1 (texto grande) | «23.4%» de cartera en riesgo | #C2410C (5.2:1) |
| #16A34A sobre #FFFFFF | 3.30:1 | «65.6%» y montos en verde | #15803D (5.0:1) |
| Blanco sobre #EAB308 / #F97316 | 1.92:1 · 2.80:1 | Etiquetas «30d» del recorrido de la mora | Texto #1E293B sobre esos colores |

El botón «Confirmar y enviar solicitud» deshabilitado (2.08:1) queda exento: WCAG no exige contraste en controles inactivos.

## Correcciones y design review

Las cinco correcciones recomendadas, por su impacto en el dinero y en la calificación, son **H-01/H-15, H-02/H-16, H-04, H-18 y H-19**. El Anexo C trae la tabla antes/después para registrarlas con sus capturas, el formulario de evaluación individual y el acta del design review de la Sesión 9 (qué se aceptó, qué se rechazó y por qué).
