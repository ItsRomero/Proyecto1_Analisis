<!--
Plantilla del documento de entrega. NO se edita el resultado (P2-documento-entrega.md):
se edita esta plantilla o los documentos incluidos y se regenera con
  python3 docs/proyecto2/generar_documento_entrega.py
Cada línea {{INCLUDE:ruta|capítulo|nivel}} inserta un documento del repositorio,
renumerando sus secciones dentro del capítulo indicado.
-->
# Proyecto 2 · UX/UI, movilidad y evolución del núcleo

**Sistema de Gestión de Microcrédito — Crédito Vecino, S. A.**
Análisis de Sistemas II (037) · Universidad Mariano Gálvez de Guatemala · Segundo semestre 2026 · Modalidad sabatina

| Dato | Valor |
|---|---|
| **Integrantes** | Christopher David Herrera Pérez · Erwin Alberto Ramírez Racancoj · Gabriela Elízabeth Noemí Aguilar Vásquez · Oliver Fernando Romero Esquite |
| **Grupo · carnés · sección** | *(completar antes de exportar el PDF)* |
| **Docente** | *(completar)* |
| **Prototipo navegable (Figma)** | https://www.figma.com/proto/jozM3QI8ZJ6pywdCoO5OVo/Microcr%C3%A9ditos-App?node-id=0-1&t=PJlTVLC3ASu31ttw-1 |
| **Repositorio** | https://github.com/ItsRomero/Proyecto1_Analisis |
| **Commit de entrega del Proyecto 1** | `8737d9b` (etiqueta `entrega-p1`) |
| **Fecha de entrega** | Viernes 25 de septiembre de 2026 |

---

# 1. Introducción

## 1.1 Qué responde este proyecto

El Proyecto 1 respondió a la pregunta *¿cómo está construido el sistema por dentro?* Definimos la arquitectura hexagonal, los componentes y un núcleo de dominio en TypeScript que calcula el dinero: plan de amortización, prelación de pagos, mora e indicadores de cartera. El Proyecto 2 trabaja sobre **el mismo sistema, el mismo repositorio y el mismo equipo** (regla de incrementalidad) y agrega dos preguntas.

**¿Cómo se usa el sistema?** Un motor de cálculo impecable produce créditos mal capturados si la asesora, de pie bajo el sol y con una mano ocupada, tiene que escribir el monto en un campo ambiguo. En una financiera, la interfaz es donde se originan la mayoría de los errores de datos. Por eso investigamos a los usuarios (E1), organizamos la información y dibujamos los wireframes (E2), construimos un prototipo navegable en Figma (E3), decidimos cómo debe funcionar la aplicación en el teléfono y sin señal (E4) y evaluamos el prototipo con las heurísticas de Nielsen y WCAG 2.2 (E5).

**¿Resiste el diseño un cambio de requisito real?** El comité de Crédito Vecino (Acta 09-2026) decidió que, desde el 1 de octubre de 2026, la mora deja de cobrarse con una tasa plana del 24 % y pasa a cobrarse **por tramos recorridos**: 18 %, 24 %, 30 % y 36 % anual según los días de atraso. Los créditos anteriores conservan la política vieja. Implementamos ese cambio en el núcleo del Proyecto 1 (E6) y medimos, con el historial de Git como evidencia, cuánto tuvimos que modificar. Ese es el informe de impacto SOLID.

## 1.2 Cómo leer este documento

Cada capítulo corresponde a un entregable del enunciado (sección 9) y sigue el orden E1 → E7. Tres convenciones se repiten en todo el documento:

- **Las cifras salen del núcleo.** Q1,004.62, Q18.14, Q50.80, 7.00 % y 21.75 % son resultados de `src/dominio` verificados por las pruebas (`npm test`), no estimaciones (regla 6.2 del enunciado).
- **Cada afirmación dice de dónde sale.** En la investigación distinguimos lo que viene del enunciado, de fuentes documentadas, del núcleo y lo que todavía es una hipótesis por validar.
- **Somos transparentes con lo que falta.** El capítulo 10 contrasta el trabajo con la lista de verificación de la sección 12.2 del enunciado.

La sección 8.2 presenta en una tabla ordenada **todos los commits** hechos desde la entrega del Proyecto 1, con lo que aportó cada uno.

---

# 2. E1 · Investigación de usuario

Este capítulo responde al entregable E1: personas fundamentadas, journey map del flujo principal y los momentos en que un error de interfaz se convierte en un error de dinero. Incluye el cuarto momento que el enunciado exige: el instante en que el cliente descubre que su mora subió de tramo.

{{INCLUDE:docs/proyecto2/e1-investigacion-usuario.md|2|2}}

---

# 3. E2 · Arquitectura de información y wireframes

Con las personas definidas, organizamos la aplicación. Este capítulo presenta el mapa de navegación, la tabla de correspondencia pantalla ↔ caso de uso que exige la sección 6.1 y los wireframes de baja fidelidad. Los wireframes se produjeron **antes** del prototipo de alta fidelidad y están completos en el Anexo A. Al final se justifica la jerarquía del tablero gerencial y cómo se distinguen la cartera en mora y la cartera en riesgo.

{{INCLUDE:docs/proyecto2/e2-arquitectura-informacion.md|3|2}}

---

# 4. E3 · Prototipo navegable en Figma

## 4.1 Enlace y acceso

**Prototipo:** https://www.figma.com/proto/jozM3QI8ZJ6pywdCoO5OVo/Microcr%C3%A9ditos-App?node-id=0-1&t=PJlTVLC3ASu31ttw-1

El enlace abre sin iniciar sesión en Figma, como pide la sección 13. El archivo se llama *Microcréditos App* y la pantalla inicial es *Asesor de Crédito – Móvil*. Es un prototipo navegable, no una serie de imágenes: cada flujo se recorre haciendo clic.

## 4.2 Cómo recorrerlo

| Paso | Qué hacer | Qué se ve |
|---|---|---|
| 1 | *Ingresar* en la pantalla de inicio de sesión | **Mis Clientes**: cartera de la asesora ordenada por prioridad, con la etiqueta de tramo (Incobrable, Mora 3, Mora 2, Mora 1, Al día) y los días de atraso |
| 2 | **Flujo de cobro:** tocar la tarjeta de *Pedro Xol Cux* | **Detalle del crédito**: estado, saldo, próxima cuota, monto original, plazo y tasa |
| 3 | Botón *Plan de pago* | **Plan de amortización** del caso de referencia: Q10,000, 12 meses, 3 % mensual, con la cuota 12 de Q1,004.63 resaltada |
| 4 | Botón *Detalle mora* | **Detalle de mora** por tramo recorrido |
| 5 | *Registrar pago* → tocar el monto → *Revisar y confirmar* | **Registrar pago** con la prelación visible antes de aplicar (gastos → mora → interés → capital) |
| 6 | *Aplicar pago* | **Pago aplicado**: comprobante con número y distribución del pago, más opciones para enviarlo por WhatsApp o imprimirlo |
| 7 | **Variante sin señal:** en *Confirmar pago*, tocar *Simular pago sin señal (demo)* y luego *Aplicar pago* | **Sin señal**: pago en cola, estado "Pendiente", folio y botón *Sincronizar ahora* |
| 8 | **Flujo de originación:** en *Mis Clientes*, botón **+** | **Nueva solicitud** (cliente, monto con límites y plazo) → **Simulación de pago** → **Confirmar solicitud** → **Solicitud enviada** |
| 9 | Tocar las iniciales *MA* | **Mi perfil** de la asesora: zona, ruta, cartera asignada y estado de sincronización |

## 4.3 Lo que el prototipo resuelve bien

Recorrimos el prototipo completo el 23 de septiembre de 2026. Estas decisiones cumplen lo que pide el enunciado y lo que encontramos en la investigación (E1):

- **La captura del monto es difícil de equivocar:** botones − y +, montos rápidos (Q2k, Q5k, Q10k…) y el rango "Q1,000 – Q25,000 en pasos de Q500" siempre visible. Esto responde al momento crítico MC-1.
- **El plazo se elige con botones** (3 a 24 meses), sin teclado.
- **Siempre hay una revisión antes de confirmar.** La solicitud tiene tres pasos, y el pago pasa por "Confirme antes de aplicar", con la salida "← Modificar monto". Esto cumple WCAG 3.3.4 (prevención de errores en transacciones financieras).
- **La prelación se ve antes de aplicar el pago**, con una barra por concepto.
- **El plan de amortización usa el caso de referencia real:** Q10,000 al 3 % mensual, las 12 cuotas, interés total Q2,055.45, total Q12,055.45 y la cuota 12 de Q1,004.63 resaltada.
- **La simulación de Q5,000 a 12 meses coincide con el núcleo:** cuota de Q502.31, exactamente la mitad del caso de referencia.
- **Hay un flujo sin señal** con el pago en cola, su estado y un botón manual de sincronización. Esto responde a MC-2 y a la estrategia del E4.
- Los objetivos táctiles son grandes y los botones principales tienen alto contraste, algo importante para trabajar bajo el sol.

## 4.4 Correspondencia con las pantallas y los flujos obligatorios

| Requisito del E3 | Perfil / formato | Estado en el prototipo | Acción pendiente |
|---|---|---|---|
| Solicitud de crédito con simulación del plan | Asesor · móvil | ✅ Nueva solicitud + Simulación de pago | — |
| Detalle del crédito | Cliente/Asesor · móvil | ✅ | Agregar el tramo en lenguaje llano ("lleva 45 días de atraso") |
| Registro de pago con desglose de la prelación | Asesor · móvil | ✅ | Corregir las cifras (§4.5) |
| Plan de amortización con la cuota 12 explicada | Cliente/Asesor · móvil | ⚠️ La cuota 12 está resaltada, pero sin explicación | Agregar la nota "1 centavo más para cerrar el saldo exacto en Q0.00" |
| Detalle de la mora con el caso M-3 | Cliente/Asesor · móvil | ❌ Muestra tasas y montos que no son los del núcleo | Rehacer con el caso M-3 (§4.5) |
| Tablero gerencial | Gerencia · escritorio | ❌ No existe todavía | Construir a partir del wireframe W11 |
| Cierre diario / mensual | Gerencia · escritorio | ❌ No existe todavía | Construir a partir del wireframe W14 |
| Confirmación de desembolso (tabla 6.1) | Encargado · móvil | ❌ | Agregar después de "Solicitud enviada", a partir de W06 |
| Bandeja del comité y Alta de cliente (tabla 6.1) | Comité / Asesor | ❌ | Recomendable, a partir de W13 y W03 |
| Flujo 1: solicitud → simulación → confirmación → desembolso | — | ⚠️ Termina en "Solicitud enviada" | Agregar el desembolso |
| Flujo 2: buscar → saldo y tramo → mora → pago → comprobante | — | ✅ | — |
| Flujo 3: tablero → riesgo por tramo → créditos del tramo | — | ❌ | Depende del tablero |
| *Mi perfil* | — | Existe, pero no corresponde a ningún caso de uso | Justificarla como soporte de sesión o retirarla (la sección 10 resta 0.5 puntos por pantalla sin caso de uso) |

## 4.5 Cifras que deben coincidir con el núcleo (sección 6.2)

El enunciado resta 0.5 puntos por cifras inventadas y otros 0.5 por aplicar mal la política de mora. Estas son las diferencias encontradas y cómo corregirlas.

**Pantalla "Detalle de mora"**

| Lo que muestra hoy | Lo que dice la política y calcula el núcleo | Corrección |
|---|---|---|
| "Tasa adicional mensual" de 0.5 %, 1.0 %, 1.5 % y 2.0 % | Tasas **anuales** de 18 %, 24 %, 30 % y 36 % (1.5 %, 2 %, 2.5 % y 3 % mensual), base Actual/360 | Mostrar "18 % al año", "24 % al año", etc. |
| Recargo calculado sobre el **saldo total** (Q6,240.50) | Se calcula sobre el **capital en mora de cada cuota vencida**, por separado | Usar el caso M-3: capital Q725.76 |
| Total de recargos Q228.81 | M-3 = **Q50.80** (10.8864 + 14.5152 + 18.1440 + 7.2576 = 50.8032, redondeado una sola vez) | Mostrar Q10.89 · Q14.52 · Q18.14 · Q7.26 con la nota de redondeo: Q50.80, no Q50.81 |
| "Total a pagar hoy Q6,469.31" (saldo + recargos) | Lo exigible de la cuota: gastos + mora + interés corriente + capital | A 45 días: Q25.00 + Q18.14 + Q278.86 + Q725.76 = **Q1,047.76** (caso M-5) |
| Se abre desde un crédito incobrable (132 días), pero muestra 100 días y el saldo de otro cliente | Después de 120 días el crédito es incobrable y deja de generar mora (invariante 8) | Abrirla desde un crédito con 100 días de atraso, o mostrar la mora congelada en Q65.32 |

**Otras pantallas**

| Pantalla | Diferencia | Corrección |
|---|---|---|
| Registrar pago | "Gastos de gestión Q150.00" | La política es **Q25.00 por cuota vencida**, generado una sola vez al día 31 (CP-02) |
| Solicitud enviada | El cliente cambia de *Carlos Martínez Ixcot* (el seleccionado) a *Juan Pablo Pérez Xol* | Mantener el cliente elegido en el paso 1 |
| Sin señal | El folio cambia de *PAG-251250* a *PAG-309097* al tocar "Sincronizar ahora" | El folio representa la **clave de idempotencia** y debe ser el mismo en todos los reintentos (E4, §5.4.2) |

---

# 5. E4 · Decisión de arquitectura móvil/web y diseño responsivo

Este capítulo decide cómo se construye la aplicación: nativa, híbrida o PWA. La decisión se argumenta contra el contexto real de cada perfil. Explica también cómo se transforma el tablero entre el teléfono y el escritorio, y qué pasa cuando la asesora registra un pago sin señal. Esa última decisión solo funciona gracias a dos piezas del Proyecto 1: la clave de idempotencia y el puerto `Reloj`.

{{INCLUDE:docs/proyecto2/e4-decision-movil-web.md|5|2}}

---

# 6. E5 · Evaluación heurística y de accesibilidad

## 6.1 Método

El enunciado pide que **los cuatro integrantes evalúen por separado** y después consoliden, porque varios evaluadores independientes encuentran más problemas que uno solo. Esta sección presenta la **evaluación preliminar de un evaluador**, hecha al recorrer el prototipo el 23 de septiembre de 2026 con apoyo de una herramienta de IA (declarada en el capítulo 9). Es el punto de partida del consolidado. **No sustituye** la evaluación de cada integrante, que debe registrar quién encontró cada hallazgo y adjuntar la captura como evidencia.

Escala de severidad (Anexo C del enunciado): 0 no es problema · 1 cosmético · 2 menor · 3 mayor · 4 catastrófico.

## 6.2 Hallazgos heurísticos (Nielsen)

| # | Pantalla | Hallazgo | Heurística | Sev. | Corrección propuesta |
|---|---|---|---|---|---|
| H-01 | Detalle de mora | Usa tasas mensuales de 0.5 %–2 % sobre el saldo total; no son las de la política ni las del núcleo | 2 · Correspondencia con el mundo real | **4** | Mostrar el caso M-3 con tasas anuales sobre el capital en mora (§4.5) |
| H-02 | Detalle de mora | "Total a pagar hoy" suma el saldo completo más los recargos; el cliente cree que debe Q6,469.31 hoy | 5 · Prevención de errores | **4** | Mostrar lo exigible de la cuota vencida (M-5: Q1,047.76) |
| H-03 | Detalle de mora | Un crédito incobrable (132 días) sigue mostrando recargos, con datos de otro cliente | 4 · Consistencia y estándares | 3 | Congelar la mora al día 120 y enlazar los datos correctos |
| H-04 | Sin señal | El folio cambia al sincronizar; la asesora no puede saber si es el mismo pago | 1 · Visibilidad del estado del sistema | 3 | Mantener el mismo folio (clave de idempotencia) en cada reintento |
| H-05 | Sin señal | "Si lo registra otra vez se duplicará" deja en manos de la asesora evitar el doble cobro | 5 · Prevención de errores | 3 | Que el sistema lo impida y lo diga: "Este pago ya está guardado; aunque lo intente de nuevo no se cobrará dos veces" |
| H-06 | Registrar pago | El monto aparece como "Q 10000" sin separador de miles mientras se escribe | 5 · Prevención de errores | 3 | Formato en vivo "Q 10,000.00" desde la primera tecla |
| H-07 | Registrar pago | Gastos de gestión de Q150.00; la política es Q25.00 por cuota vencida | 2 · Correspondencia | 3 | Usar el oráculo M-5 |
| H-08 | Solicitud enviada | El cliente cambia de Carlos Martínez a Juan Pablo Pérez | 4 · Consistencia | 3 | Mantener el cliente seleccionado |
| H-09 | Plan de amortización | La cuota 12 (Q1,004.63) está resaltada pero sin explicación | 10 · Ayuda y documentación | 2 | Nota: "1 centavo más para que el saldo cierre exacto en Q0.00" |
| H-10 | Mis Clientes | "Mora 1/2/3" no significa nada para el cliente | 2 · Correspondencia | 2 | Acompañarlo con "más de 30 días de atraso" |
| H-11 | Todas | La ayuda solo aparece en el inicio de sesión ("Llama al soporte técnico") | 10 · Ayuda / WCAG 3.2.6 | 2 | Ícono "?" en el mismo lugar de cada encabezado |
| H-12 | Registrar pago | Los atajos "1 cuota / 2 cuotas / 3 cuotas" no llenan el monto | 7 · Flexibilidad y eficiencia | 2 | Conectar cada atajo con su monto |
| H-13 | Pago aplicado | El comprobante no muestra el saldo restante | 1 · Visibilidad del estado | 2 | Agregar "Saldo de capital restante" |
| H-14 | Detalle de mora y pago | Textos secundarios muy pequeños y en gris claro, difíciles de leer bajo el sol | 8 · Diseño estético y minimalista / WCAG 1.4.3 | 2 | Tamaño mínimo de 14 px y contraste ≥ 4.5:1 |

## 6.3 Auditoría WCAG 2.2 (criterios A/AA nuevos + 3.3.4)

| Criterio | Nivel | Resultado preliminar | Observación |
|---|---|---|---|
| 2.4.11 Focus Not Obscured (Minimum) | AA | No verificable en Figma | Revisarlo en la implementación React: el encabezado fijo no debe tapar el foco |
| 2.5.7 Dragging Movements | AA | ✅ Cumple | Ninguna acción requiere arrastrar |
| 2.5.8 Target Size (Minimum) | AA | ✅ Cumple | Botones y tarjetas muy por encima de 24 × 24 px |
| 3.2.6 Consistent Help | A | ❌ No cumple | Ver H-11 |
| 3.3.7 Redundant Entry | A | ⚠️ Revisar | El cliente se elige de una lista (bien); falta la pantalla de alta de cliente para comprobar que no se pide dos veces el DPI |
| 3.3.8 Accessible Authentication (Minimum) | AA | ✅ Probable | Contraseña con opción de mostrarla; confirmar que se permita pegarla |
| 3.3.4 Error Prevention (Legal, Financial) | AA | ⚠️ Parcial | El pago y la solicitud tienen revisión y salida; falta la confirmación de desembolso |
| 1.4.3 Contrast (Minimum), heredado | AA | ⚠️ Revisar | Ver H-14 |

## 6.4 Correcciones y design review (pendiente del equipo)

Para cerrar el E5 falta:

- Corregir en Figma **al menos cinco hallazgos** y adjuntar la captura del antes y del después. Recomendamos empezar por H-01, H-02, H-04, H-06 y H-09, porque son los que más afectan al dinero y a la calificación.
- Documentar la retroalimentación del design review de la Sesión 9: qué se aceptó, qué se rechazó y con qué argumento.

---

# 7. E6 · Evolución del núcleo e informe de impacto SOLID

## 7.1 Qué se implementó

Implementamos en el mismo repositorio del Proyecto 1 los cuatro cambios de la sección 7 del enunciado:

| Cambio | Qué pide el enunciado | Qué hicimos | Dónde está |
|---|---|---|---|
| **CP-01** · Política escalonada | Cada día de atraso se cobra a la tasa del tramo al que pertenece (18/24/30/36 %), base Actual/360, **un solo redondeo al final** y tope en el capital en mora | Puerto `PoliticaMora` con implementación escalonada; tasas en configuración versionada, fuera del motor | `src/dominio/politica-mora/` |
| **CP-02** · Gasto de gestión de cobro | Q25.00 por cuota vencida al llegar al día 31, una sola vez, aunque el cierre se repita | `generarGastoGestion`, idempotente por crédito, cuota y concepto | `gasto-gestion-cobro.ts` |
| **CP-03** · Coexistencia de políticas (sección 7.6 del enunciado) | Los créditos otorgados antes del 1/10/2026 conservan la política plana del 24 % | `resolverPolitica` elige según la fecha de otorgamiento: CV-2026-0100 paga Q21.77 y CV-2026-0410 paga Q18.14 a 45 días | `catalogo-politicas.ts` |
| **CP-04.1** · `en_mora → cancelado` | Un pago que deja el saldo exacto en cero cancela el crédito en mora | Transición nueva en el State `EstadoEnMora` | `credito-estado.ts` |
| **CP-04.2** · Suspensión del devengo | Después del día 90 el interés corriente va a "interés en suspenso" y no al ingreso | `DevengoInteres`: entre el día 90 y el 100 el ingreso no sube y el suspenso sí | `devengo-interes.ts` |
| **CP-04.3** · Cartera en riesgo por tramo | El núcleo expone el desglose para que el tablero no recalcule | `calcularCarteraPorTramo`: 3.00 + 2.25 + 1.00 + 0.75 = 7.00 % | `cartera-por-tramo.ts` |

Los casos de referencia del enunciado salen exactos de las pruebas: M-1 Q5.44, M-2 Q18.14, M-3 Q50.80, M-4 Q65.32, M-5 Q1,047.76, coexistencia Q21.77 frente a Q18.14, y la prueba original del P1 de Q7.26 sigue pasando. El detalle de fórmulas y la selección de políticas están en `docs/proyecto2/e6-02-evolucion-nucleo.md`; las entradas, salidas y criterios de cada prueba, en `e6-03-pruebas-mora-escalonada.md`.

## 7.2 Informe de impacto SOLID (Anexo D)

Este es el informe que exige la sección 8. También está en el repositorio como `docs/informe-impacto-solid.md`, tal como pide el E7.

{{INCLUDE:docs/informe-impacto-solid.md|7.2|3}}

---

# 8. E7 · Repositorio e historial de cambios

## 8.1 Cómo se organizó el repositorio

La documentación del Proyecto 2 vive en `docs/proyecto2/`, con un prefijo por entregable para que su propósito sea evidente:

| Prefijo | Entregable | Archivos |
|---|---|---|
| `e1-` | Investigación de usuario | `e1-investigacion-usuario.md`, `e1-instrumentos-investigacion.md` |
| `e2-` | Arquitectura de información | `e2-arquitectura-informacion.md` y la carpeta `wireframes/` |
| `e4-` | Decisión móvil/web | `e4-decision-movil-web.md` |
| `e6-` | Evolución del núcleo | `e6-01-auditoria-inicial.md`, `e6-02-evolucion-nucleo.md`, `e6-03-pruebas-mora-escalonada.md`, `e6-04-validacion-final.md` |
| — | Informe SOLID y ADR | `docs/informe-impacto-solid.md`, `docs/adr/ADR-004-politica-mora-escalonada.md` |
| — | Índice e historial | `docs/proyecto2/README.md`, `historial-cambios.md` |

El núcleo sigue en `src/dominio/` y las pruebas en `tests/`. Todo se verifica con `npm install && npm test`, sin base de datos, sin servidor y sin interfaz.

## 8.2 Historial de commits

El enunciado exige que el historial permita comparar la entrega del P1 con la del P2, y advierte que alterar ese historial es falta de integridad académica. No reescribimos nada. Esta tabla presenta **todos los commits** desde `entrega-p1`, en orden cronológico, con lo que aportó cada uno. Los datos salen de:

```bash
git log --reverse --format='%h %ad %an %s' --date=short entrega-p1..HEAD
git show --stat <hash>
```

### 8.2.1 Tabla de commits

| # | Fecha | Commit | Autor (Git) | Tipo | Entregable | Qué se hizo | Archivos principales | Cambio |
|---|---|---|---|---|---|---|---|---|
| — | 26/08 | `8737d9b` | — | Base | P1 | **Entrega del Proyecto 1** (etiqueta `entrega-p1`). Punto de comparación de todas las métricas | — | — |
| 0 | 21/09 | `71a5179` | Christopher Herrera | Auditoría | E6 | Auditoría inicial y línea base: 7 archivos de dominio y 206 pruebas pasando; se crea la etiqueta `entrega-p1` | `e6-01-auditoria-inicial.md` | 1 archivo, +70 |
| 1 | 21/09 | `ec2a436` | Christopher Herrera | Funcionalidad | E6 · CP-01 | Puerto `PoliticaMora`, políticas plana, escalonada y retroactiva, catálogo por fecha de otorgamiento, configuración versionada y Specification de tramo. Se abre el motor para inyectar la política | `politica-mora/*`, `clasificacion-tramo.ts`, `calculadora-mora.ts` | 10 archivos, +223 / −21 |
| 2 | 21/09 | `d3b30f5` | Christopher Herrera | Funcionalidad | E6 · CP-02 | Gasto de gestión de cobro de Q25.00 al día 31, idempotente por cuota | `gasto-gestion-cobro.ts` y su prueba | 2 archivos, +105 |
| 3 | 21/09 | `5752b55` | Christopher Herrera | Funcionalidad | E6 · CP-04 | Transición `en_mora → cancelado`, suspensión del devengo y cartera en riesgo por tramo; diagramas de estado actualizados | `credito-estado.ts`, `devengo-interes.ts`, `cartera-por-tramo.ts` | 10 archivos, +343 / −2 |
| 4 | 21/09 | `0d6c1a9` | ERAMR18 | Pruebas | E6 · CP-03 | Contrato común contra las tres políticas (Liskov), regresión integrada y caso de uso `consultarMora`. **Corte del núcleo medido en el informe SOLID** | `contrato-politica.test.ts`, `regresion-p1.test.ts`, `consultar-mora.ts` | 3 archivos, +121 |
| 5 | 21/09 | `958e70f` | ERAMR18 | Documentación | E6 | ADR-004, primer informe SOLID, UML (Strategy de mora, secuencias), contratos Zod/OpenAPI y documento móvil inicial | `ADR-004`, `informe-impacto-solid.md`, `*.puml`, `openapi.yaml` | 16 archivos, +753 / −97 |
| 6 | 21/09 | `8112e57` | ERAMR18 | Validación | E6 | Validación desde instalación limpia: 263 pruebas en 18 archivos y revisión de tipos sin errores | `e6-04-validacion-final.md` | 2 archivos, +100 / −1 |
| 7 | 22/09 | `5e73d12` | Christopher Herrera | Herramientas | E6 | Seis comandos de prueba por tema (`test:mora`, `test:cp04`, `test:invariantes`…) para verificar partes específicas en la defensa | `package.json` | 1 archivo, +6 |
| 8 | 22/09 | `9e06c37` | Elízabeth | Documentación | E6 | Documento de pruebas de la mora escalonada (entradas, salidas y criterios) e informe de verificación SOLID | `e6-03-pruebas-mora-escalonada.md`, informe de verificación | 2 archivos, +1,043 |
| 9 | 22/09 | `8e421a6` | Elízabeth | Integración | — | Sincronización de la rama local con la remota | `package.json` | 1 archivo, +6 |
| 10 | 22/09 | `183dc71` | Oliver Romero | Integración | E6 · E7 | **Pull Request #1**: integra toda la evolución del núcleo en `main` | 42 archivos | +2,751 / −108 |
| 11 | 22/09 | `13aa167` | Erwin | Documentación | E7 | README: tabla de comandos de prueba por tema | `README.md` | 1 archivo, +20 / −1 |
| 12 | 23/09 | `16f983f` | Oliver Romero · IA declarada | Documentación | E1 · E2 · E4 · E6 | Investigación de usuario, arquitectura de información, 15 wireframes, decisión PWA; informe SOLID reorganizado según el Anexo D; documentos renombrados por entregable | `e1-*`, `e2-*`, `e4-*`, `wireframes/`, `informe-impacto-solid.md` | 32 archivos, +2,413 / −232 |
| 13 | 23/09 | `4ba9e55` | Oliver Romero · IA declarada | Documentación | E7 | Historial de cambios y documento técnico consolidado | `historial-cambios.md`, `documentacion-completa.md` | 4 archivos, +2,658 |
| 14 | 23/09 | `00709f9` | Oliver Romero · IA declarada | Documentación | E3 · E5 · E7 | Enlace de Figma en el README y el índice, revisión del prototipo y evaluación preliminar E5 | `P2-documento-entrega.md`, `README.md` | 6 archivos, +511 / −12 |
| 15 | 23/09 | *(este documento)* | Oliver Romero · IA declarada | Documentación | E1–E7 | Documento de entrega unificado (este archivo), generado a partir de los documentos del repositorio | `P2-documento-entrega.md`, `fuente-documento-entrega.md` | — |

**Totales desde `entrega-p1`:** el núcleo `src/dominio` suma 12 archivos (10 nuevos y 2 modificados), +381 / −21 líneas. Las pruebas pasan de 206 a 263 sin modificar ningún archivo de prueba del P1.

> **Nota sobre los hashes.** Los commits 0 a 11 ya están en GitHub y sus hashes son definitivos. Los commits 12 a 15 se integran después de esta entrega; si se aplican desde un parche, Git les asigna un hash nuevo y se identifican por su mensaje.

### 8.2.2 Las fases del trabajo

| Fase | Fechas | Commits | Resultado |
|---|---|---|---|
| Auditoría | 21/09 | 0 | Línea base del P1 verificada y etiquetada |
| Evolución del núcleo | 21/09 | 1 – 4 | CP-01 a CP-04 implementados, de 206 a 260 pruebas |
| Contratos y documentación técnica | 21/09 | 5 – 6 | ADR, UML, OpenAPI, informe SOLID y validación limpia (263 pruebas) |
| Herramientas e integración | 22/09 | 7 – 11 | Comandos de prueba, documento de pruebas, PR #1 y README |
| Experiencia de usuario y entrega | 23/09 | 12 – 15 | E1, E2, E4, wireframes, revisión E3/E5, historial y documento de entrega |

## 8.3 Qué faltaba documentar y cómo se resolvió

| Problema encontrado en la revisión | Solución |
|---|---|
| Tres documentos afirmaban que "el enunciado no define CP-03". Sí lo define: es la sección 7.6, *Coexistencia de políticas* | Corregido en `e6-02`, `e6-04` y en la matriz de trazabilidad |
| La validación decía "sin push, PR ni merge", pero después hubo un PR | Actualizada con el PR #1 (`183dc71`) |
| El documento de pruebas no tenía extensión `.md` y GitHub lo mostraba como texto plano | Renombrado a `e6-03-pruebas-mora-escalonada.md` |
| Había dos informes SOLID con datos distintos (13 frente a 12 atrasos probados) | Fusionados en uno, con la cifra correcta: 12 atrasos y 288 combinaciones |
| Los comandos de prueba (commit 7) y los merges (9 y 10) no estaban en ningún documento | Registrados en la tabla de §8.2.1 y en `historial-cambios.md` |
| E1, E2 y E4 casi no existían, y el documento móvil no tomaba una decisión | Escritos de nuevo (capítulos 2, 3 y 5) |

---

# 9. Reparto del trabajo y declaración de uso de IA

## 9.1 Reparto del trabajo (sección 12.1)

Esta tabla se armó a partir del historial de Git y de los roles declarados en el P1. **Cada integrante debe confirmar o corregir su fila**, en especial el trabajo que no deja rastro en Git (Figma, investigación, design review).

| Integrante | Rol | Responsabilidad principal | Evidencia verificable | Entregables |
|---|---|---|---|---|
| Christopher David Herrera Pérez | Ingeniería de dominio | Políticas de mora, gasto de cobro, CP-04 y comandos de prueba | Commits 0, 1, 2, 3 y 7 | E6 |
| Erwin Alberto Ramírez Racancoj | Pruebas y trazabilidad | Contratos de prueba, documentación técnica, validación y README (commits como *ERAMR18* y *Erwin*; confirmar que es la misma persona) | Commits 4, 5, 6 y 11 | E6, E7 |
| Gabriela Elízabeth Noemí Aguilar Vásquez | Diseño y documentación | Documento de pruebas e informe de verificación SOLID; *(agregar: Figma e investigación)* | Commits 8 y 9 | E6, *(E1–E3)* |
| Oliver Fernando Romero Esquite | Coordinación e integración | PR #1, documentación de E1, E2 y E4, consolidación del informe SOLID y documento de entrega; *(agregar: Figma)* | Commits 10, 12, 13, 14 y 15 | E1, E2, E4, E7 |

## 9.2 Declaración de uso de herramientas de IA (sección 15)

| Herramienta | Uso |
|---|---|
| **OpenAI Codex** | Apoyo en la evolución del núcleo (CP-01 a CP-04), en las pruebas y en la documentación técnica de E6 |
| **Claude (Anthropic)** | Apoyo en la redacción de E1, E2 y E4; generación de los wireframes de baja fidelidad con un script editable (`wireframes/generar_wireframes.py`); reorganización del informe SOLID según el Anexo D; historial de cambios; revisión preliminar del prototipo de Figma (capítulos 4 y 6) y redacción de este documento |

Las decisiones de diseño y su justificación son del equipo, y cualquiera de los cuatro integrantes debe poder explicarlas en la defensa. Las personas del E1 se apoyan en fuentes documentadas: los rasgos marcados como hipótesis no provienen de entrevistas. Los hallazgos del capítulo 6 son de un solo evaluador y deben complementarse con la evaluación independiente de cada integrante.

---

# 10. Lista de verificación de entrega (sección 12.2)

Estado al 23 de septiembre de 2026. ✅ completo · ⚠️ existe, pero requiere un ajuste · ❌ pendiente. **Actualizar esta tabla antes de exportar el PDF.**

| # | Requisito | Estado | Evidencia / pendiente |
|---|---|---|---|
| 1 | Personas fundamentadas y journey map con puntos de dolor concretos, incluido el cambio de tramo | ⚠️ | Capítulo 2. Faltan las entrevistas u observación para validar los rasgos marcados como hipótesis |
| 2 | Tabla pantalla ↔ caso de uso completa y coherente con los puertos del P1 | ✅ | §3.3 |
| 3 | Siete pantallas obligatorias y tres flujos navegables | ⚠️ | §4.4: faltan el tablero, el cierre y el desembolso |
| 4 | Plan de amortización con la cuota 12 de Q1,004.63 explicada | ⚠️ | Falta la nota explicativa en Figma |
| 5 | Detalle de la mora con el caso M-3 | ❌ | Corregir las cifras (§4.5) |
| 6 | Tablero que distingue mora (21.75 %) y riesgo (7.00 %) con desglose por tramo | ⚠️ | Justificado en el wireframe W11 (§3.5); falta en Figma |
| 7 | Decisión móvil/web con pérdida de conexión, idempotencia y puerto Reloj | ✅ | Capítulo 5 |
| 8 | ≥ 8 hallazgos con severidad y ≥ 5 correcciones con antes/después | ⚠️ | 14 hallazgos preliminares (§6.2); faltan la evaluación de los cuatro y las correcciones |
| 9 | Auditoría de los seis criterios nuevos de WCAG 2.2 y del 3.3.4 | ⚠️ | §6.3, preliminar |
| 10 | Design review: qué se aceptó y qué se rechazó | ❌ | Notas de la Sesión 9 |
| 11 | `npm install && npm test` en limpio, con M-1 a M-5, coexistencia y suite del P1 | ✅ | 263 pruebas en 18 archivos; repetir `npm run verify` sobre el commit final |
| 12 | Informe SOLID con métricas respaldadas por el diff | ✅ | §7.2 |
| 13 | Commit del P1 etiquetado o con su hash en el informe | ⚠️ | El hash está en el informe; falta `git push origin entrega-p1` |
| 14 | Enlaces de Figma y del repositorio abren sin pedir permisos | ✅ / ⚠️ | Figma abre sin iniciar sesión; confirmar que el repositorio sea público |
| 15 | Tabla de reparto del trabajo | ⚠️ | §9.1, a confirmar por el equipo |

---

# Anexo A · Wireframes de baja fidelidad

Los 15 wireframes y el mapa de navegación están en `docs/proyecto2/wireframes/`. Cada uno tiene anotaciones numeradas que explican las decisiones de diseño.

{{WIREFRAMES}}
