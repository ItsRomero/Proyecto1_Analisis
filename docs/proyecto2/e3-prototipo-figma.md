# E3 · Prototipo navegable en Figma

## Enlaces y acceso

El equipo construyó dos prototipos en Figma. Los dos abren sin iniciar sesión (sección 13 del enunciado) y se recorren haciendo clic; no son imágenes sueltas.

| Prototipo | Enlace | Qué contiene |
|---|---|---|
| **Móvil · asesora de crédito** (*Microcréditos App*) | [Abrir el prototipo móvil](https://www.figma.com/proto/jozM3QI8ZJ6pywdCoO5OVo/Microcr%C3%A9ditos-App?node-id=0-1&t=PJlTVLC3ASu31ttw-1) | Pantallas P01–P14: cartera de la asesora, detalle del crédito, plan, mora, registro de pago, pago sin señal y solicitud de crédito |
| **Web · flujos y panel gerencial** (*Prototipo Microcréditos Web*, Figma Make) | [Abrir el prototipo web](https://www.figma.com/make/WHj2TK5IRg55X8JiaKXyvy/Prototipo-Microcr%25C3%25A9ditos-Web?code-node-id=0-6&p=f&fullscreen=1) | Inicio con tres flujos: *Solicitar crédito* y *Registrar pago* en vista móvil de 375 px, y el *Panel gerencial* de escritorio (Dashboard, Cartera, Clientes y Cierre diario) |

## Cómo recorrerlos

**Prototipo móvil**

| Paso | Qué hacer | Qué se ve |
|---|---|---|
| 1 | *Ingresar* en **P01 Iniciar sesión** | **P02 Mis Clientes**: cartera ordenada por prioridad, con la etiqueta de tramo y los días de atraso |
| 2 | Tocar la tarjeta de *Pedro Xol Cux* | **P08 Detalle del crédito** → *Plan de pago* (**P09**) → *Detalle mora* (**P10**) |
| 3 | *Registrar pago* → monto → *Revisar y confirmar* → *Aplicar pago* | **P11** → **P12 Confirmar pago** con la prelación → **P13 Pago aplicado** |
| 4 | Variante: en *Confirmar pago*, *Simular pago sin señal (demo)* | **P14 Sin señal**: pago en cola, estado y *Sincronizar ahora* |
| 5 | En *Mis Clientes*, botón **+** | **P04 Nueva solicitud** → **P05 Simulación** → **P06 Confirmar** → **P07 Solicitud enviada** |

**Prototipo web**

| Flujo | Recorrido | Pantallas |
|---|---|---|
| Flujo 1 · Solicitar crédito | *Solicitar crédito* → *Ver plan de amortización* → *Continuar con solicitud* → marcar la aceptación → *Confirmar y enviar solicitud* | Monto y plazo (paso 1 de 3) → Simulación (paso 2 de 3) → Confirmar solicitud (paso 3 de 3) → ¡Solicitud enviada! |
| Flujo 2 · Registrar pago | *Registrar pago* → *María García López* → *Ver detalle de mora* / *Ver tabla* → *Registrar pago* → *Cuota regular* → *Ver desglose del pago* → *Aplicar pago ahora* | Buscar cliente → Crédito → Detalle de mora · Plan de amortización → Registrar pago → Confirmar pago (prelación) → Comprobante |
| Flujo 3 · Panel gerencial | *Panel gerencial* → *Dashboard* → *Ver →* en un tramo → *Ver crédito*; pestañas *Cartera*, *Clientes* y *Cierre diario* | W01 Dashboard → créditos del tramo → crédito; W02 Cartera; W03 Clientes; Cierre diario |

## Lo que los prototipos resuelven bien

Recorrimos los dos prototipos completos el 23 de septiembre de 2026.

- **Captura del monto difícil de equivocar:** botones − y +, montos rápidos y el rango permitido siempre visible (móvil); control deslizante con límites Q1,000–Q25,000 (web). Responde al momento crítico MC-1.
- **El plazo se elige con botones** (3 a 24 meses), sin teclado.
- **Revisión antes de confirmar (WCAG 3.3.4).** La solicitud web tiene tres pasos y exige marcar «He leído y acepto…» antes de enviar, con el aviso «Esta acción no se puede deshacer». El pago muestra el desglose y «Una vez aplicado, este pago no puede revertirse» antes de *Aplicar pago ahora*.
- **La prelación se ve antes de aplicar el pago**, en el orden gastos → mora → interés corriente → capital.
- **El plan de amortización usa el caso de referencia:** Q10,000 al 3 % mensual, cuota Q1,004.62, interés total Q2,055.45 y total Q12,055.45. El plan web ya incluye la nota «La última cuota es Q1,004.63, con ajuste de Q0.01».
- **Existe el tablero gerencial (W01)** con cartera por tramo, cartera en riesgo 23.4 % y espacio para el asistente, y el **desglose por tramo** lleva a los créditos de ese tramo (flujo 3).
- **Existe el cierre diario** con verificación previa, congelamiento de cifras y protección contra duplicados («ya cerrado»), coherente con la idempotencia del núcleo.
- **Flujo sin señal** con el pago en cola y sincronización manual (móvil, P14).

## Correspondencia con las pantallas y los flujos obligatorios

| Requisito del E3 | Perfil / formato | Estado | Dónde | Pendiente |
|---|---|---|---|---|
| Solicitud de crédito con simulación del plan | Asesor · móvil | ✅ | P04 → P07 · web pasos 1 a 3 | — |
| Detalle del crédito | Cliente/Asesor · móvil | ✅ | P08 · web *Crédito* | Mostrar lo exigible hoy cuando hay mora (tabla siguiente) |
| Registro de pago con desglose de la prelación | Asesor · móvil | ⚠️ | P11 → P13 · web *Confirmar pago* | Corregir los montos del desglose |
| Plan de amortización con la cuota 12 explicada | Cliente/Asesor · móvil | ⚠️ | P09 · web *Plan de amortización* | La nota ya está en la web; falta corregir la fila 12 y el centavo desde la cuota 8 |
| Detalle de la mora con el caso M-3 | Cliente/Asesor · móvil | ❌ | P10 · web *Detalle de mora* | Ambos usan tasas y base equivocadas |
| Tablero gerencial | Gerencia · escritorio | ✅ | W01 (web) | Ajustes de la sección 3.4.5 |
| Cierre diario / mensual | Gerencia · escritorio | ⚠️ | Web *Cierre diario* | Falta el cierre mensual (CU-13) |
| Confirmación de desembolso | Encargado · móvil | ❌ | — | Construir a partir de la guía G02 |
| Flujo 1: solicitud → simulación → confirmación → desembolso | — | ⚠️ | Termina en «Solicitud enviada» | Agregar el desembolso después de la aprobación |
| Flujo 2: buscar → saldo y tramo → mora → pago → comprobante | — | ✅ | P02 → P13 · web flujo 2 | Corregir cifras |
| Flujo 3: tablero → riesgo por tramo → créditos del tramo | — | ✅ | Web flujo 3 | — |
| *P03 Mi perfil* | Asesor | ✅ | P03 | Se justifica como pantalla de soporte de sesión y sincronización (sección 3.3.2), sin caso de uso de negocio propio |

## Cifras que deben coincidir con el núcleo (sección 6.2)

El enunciado resta 0.5 puntos por cifras inventadas y otros 0.5 por aplicar mal la política de mora. Estas son las diferencias encontradas en los dos prototipos, con el valor correcto que debe mostrarse.

**Detalle de la mora (P10 y web)**

| Elemento | Prototipo | Valor correcto |
|---|---|---|
| Tasas | Móvil: 0.5 %, 1 %, 1.5 % y 2 % mensual · Web: 2 %, 3 %, 4 % y 5 % mensual | **18 %, 24 %, 30 % y 36 % anual**, base Actual/360 |
| Base del cálculo | Saldo total: Q6,240.50 (móvil) · Q6,259.07 (web) | **Capital en mora** de la cuota vencida: Q725.76 en el caso M-3 |
| Caso M-3 (100 días) | Q228.81 (móvil) · Q667.65 (web) | **Q50.80** = 10.8864 + 14.5152 + 18.1440 + 7.2576 = 50.8032, redondeado una sola vez (no Q50.81) |
| Tramo de 91 a 100 días | Web: «Vencido · 5 % mensual» | **Mora 4 · 36 % anual** (el crédito es incobrable después de 120 días) |
| Total exigible (M-5, 45 días) | «Total a pagar hoy Q6,469.31» (móvil) | **Q1,047.76** = Q25.00 + Q18.14 + Q278.86 + Q725.76 |
| Días de atraso | Web: el crédito dice 45 días y su detalle de mora, 100 | Abrir el detalle desde un crédito con 100 días, o mostrar los 45 días del mismo crédito |

**Registro de pago y crédito (web)** · María García, cuota 6 vencida hace 45 días (capital Q816.85, interés Q187.77)

| Elemento | Prototipo | Valor correcto (misma fórmula que M-2 y M-5) |
|---|---|---|
| Gastos de cobro | Q125.00 (web) · Q150.00 (móvil) | **Q25.00** por cuota vencida, generado una sola vez al día 31 |
| Interés moratorio | Q219.07 | **Q20.42** = Q816.85 × (18 % × 30 + 24 % × 15) / 360 |
| Monto rápido «Cuota + mora» | Q1,500.00 | **Q1,050.04** = Q25.00 + Q20.42 + Q187.77 + Q816.85 |
| «Mora acum.» en los créditos del tramo | Q281.66 | **Q20.42** |
| «Próxima cuota» en el crédito en mora | Q1,004.62 | Mostrar lo **exigible hoy: Q1,050.04** |

**Plan de amortización (web)**

| Elemento | Prototipo | Valor correcto |
|---|---|---|
| Saldo después de la cuota 8 | Q3,734.27 | **Q3,734.28** (el centavo se arrastra a las cuotas 9, 10 y 11) |
| Saldos después de las cuotas 9, 10 y 11 | Q2,841.68 · Q1,922.31 · Q975.36 | **Q2,841.69 · Q1,922.32 · Q975.37** |
| Fila de la cuota 12 (plan y simulación) | Q1,004.62, capital Q975.36 | **Q1,004.63**, capital **Q975.37**, como dice la nota |

**Coherencia entre pantallas**

| Pantalla | Diferencia | Corrección |
|---|---|---|
| Solicitud enviada (móvil) | El cliente cambia de *Carlos Martínez Ixcot* a *Juan Pablo Pérez Xol* | Mantener el cliente elegido en el paso 1 |
| Sin señal (móvil) | El folio cambia de *PAG-251250* a *PAG-309097* al sincronizar | El folio es la **clave de idempotencia**: debe ser el mismo en todos los reintentos |
| Registrar pago y Cartera (web) | Ana Lucía Morales figura «Al día» en un lugar y «31–60 d» en otro; Pedro Alvarado tiene códigos distintos (CRD-2024-0388 y 0488); José Domingo tiene 22 días en Cartera y 38 en el tramo | Usar un solo conjunto de datos de ejemplo |
| Cartera (web) | Pedro Alvarado (Q12,000 a 12 meses) con cuota Q1,004.62; Andrés Lima (Q5,000 a 12 meses) con Q485.50 | Q1,205.55 y Q502.31 al 3 % mensual |
| Todas (web) | Fechas de 2024 | Septiembre de 2026 |

Las instrucciones para aplicar estas correcciones en Figma Make, listas para copiar, están en el Anexo B.
