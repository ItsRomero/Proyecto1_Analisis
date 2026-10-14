# E1 · Instrumentos de investigación de usuarios

Proyecto 2 · Crédito Vecino, S. A. · Integrantes: Christopher David Herrera Pérez, Erwin Alberto Ramírez Racancoj, Gabriela Elízabeth Noemí Aguilar Vásquez y Oliver Fernando Romero Esquite · 22 de septiembre de 2026.

Estos instrumentos sustentan las personas y el journey map de [e1-investigacion-usuario.md](e1-investigacion-usuario.md). Las respuestas se registran fuera del repositorio con códigos anónimos; aquí solo se versionan las guías.

# Propósito y alcance

Este documento organiza la investigación necesaria para comprender como un asesor captura datos y registra pagos en campo, como un cliente interpreta su deuda y la mora, y como gerencia toma decisiones con indicadores agregados. El resultado debe reducir errores de captura con consecuencias monetarias y sustentar las personas y el journey map del Proyecto 2.

- Validar condiciones de trabajo móvil, conectividad, iluminación y uso con una mano.

- Identificar lenguaje financiero comprensible para clientes y señales de confianza en comprobantes.

- Distinguir necesidades operativas del asesor de las necesidades analiticas de gerencia.

- Detectar puntos donde una decisión de interfaz puede modificar un monto, duplicar un pago o inducir una lectura incorrecta del riesgo.

## Método recomendado

Se propone un estudio exploratorio mixto y de baja escala. Combina investigación documental, entrevistas semiestructuradas, una encuesta breve y observación contextual. La muestra sugerida es de 6 a 9 participantes y no pretende representar estadisticamente a toda Guatemala; busca patrones útiles para decisiones de diseño.

| **Técnica**              | **Participantes o fuentes**    | **Propósito**                             | **Evidencia**                      |
|--------------------------|--------------------------------|-------------------------------------------|------------------------------------|
| Investigación documental | SIB, Banco Mundial y enunciado | Contexto nacional y requisitos            | Ficha de fuente y citas            |
| Entrevista               | 2-3 por perfil                 | Conductas, lenguaje y problemas recientes | Notas, citas autorizadas y códigos |
| Encuesta                 | Apoyo a los tres perfiles      | Frecuencia y preferencias                 | Respuestas exportadas y resumen    |
| Observación              | Asesor o rol análogo           | Condiciones reales de tarea               | Lista de cotejo y tiempos          |

## Investigación documental

Las fuentes secundarias permiten fundamentar el contexto de inclusión financiera, digitalización, conectividad y desigualdad territorial. No sustituyen la validación de comportamientos especificos de una institución. Cada dato debe registrarse con año, definición, alcance y limitación.

| **Fuente**            | **Institución y título**                                                                                       | **Uso**                                                                                     | **Limitación**                                                                          | **Enlace**                                                                                                                              |
|-----------------------|----------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| SIB ENIF 2024-2027    | Superintendencia de Bancos de Guatemala. Estrategia Nacional de Inclusión Financiera para Guatemala 2024-2027. | La estrategia nacional prioriza la inclusión financiera y el uso de herramientas digitales. | Contexto de digitalización e inclusión; no describe por si sola la rutina de un asesor. | https://www.sib.gob.gt/estrategia-nacional-de-inclusion-financiera-guatemala-2024-2027/                                                 |
| SIB indicadores       | Superintendencia de Bancos de Guatemala. Boletin Trimestral de Indicadores de Inclusión Financiera.            | Marco institucional para consultar acceso y uso de servicios financieros en Guatemala.      | Los indicadores agregados no sustituyen entrevistas de experiencia de uso.              | https://www.sib.gob.gt/informacion-sistema-financiero/boletines-estadisticas/boletin-trimestral-de-indicadores-de-inclusion-financiera/ |
| Global Findex 2025    | Banco Mundial. The Global Findex Database 2025 Connectivity and Financial Inclusión in the Digital Economy.    | Fuente de demanda sobre acceso y uso de servicios financieros y conectividad digital.       | Los datos nacionales no prueban comportamientos de una institución particular.          | https://www.worldbank.org/en/publication/globalfindex                                                                                   |
| Findex Guatemala 2024 | Banco Mundial. Guatemala 2024 Global Findex Microdata.                                                         | Microdatos y documentación especificos de Guatemala para inclusión y conectividad.          | Requiere interpretar cada variable con su universo y ponderación.                       | https://doi.org/10.48529/ad4w-j084                                                                                                      |
| Contexto Guatemala    | Grupo Banco Mundial. Guatemala panorama general.                                                               | Describe desigualdades territoriales, ruralidad, informalidad y brechas de acceso.          | Es contexto macro; no reemplaza evidencia de tareas de cobro y originación.             | https://www.bancomundial.org/ext/es/country/guatemala                                                                                   |
| Enunciado P2          | Universidad Mariano Gálvez de Guatemala. Proyecto 2 Experiencia de usuario interfaz y movilidad.               | Define perfiles, siete pantallas, trabajo en campo, conectividad y momentos criticos.       | Es el caso académico; sus datos son requisitos, no resultados de entrevistas.           | Documento académico proporcionado al equipo                                                                                             |

## Consentimiento breve

Se le invita a participar en una actividad académica sobre la experiencia de uso de servicios de microcrédito. La conversacion durará entre 20 y 30 minutos. Su participacion es voluntaria y puede omitir cualquier pregunta o retirarse. Las respuestas se identificarán con un código y no se solicitarán contraseñas, DPI completo, números completos de cuenta ni montos financieros personales. El audio solo se grabará con permiso separado.

| **Código del participante** | **______** |
|-----------------------------|--------------------------------------------------------------|
| Acepta participar           | \[ \] Sí \[ \] No                                            |
| Autoriza notas anónimas     | \[ \] Sí \[ \] No                                            |
| Autoriza grabacion de audio | \[ \] Sí \[ \] No \[ \] No aplica                            |
| Firma o confirmación        | ______     |
| Fecha                       | ______     |

## Ficha del participante

| **Código**            |                                                        |
|-----------------------|--------------------------------------------------------|
| Perfil                | \[ \] Campo \[ \] Cliente \[ \] Gerencia \[ \] Análogo |
| Rango de edad         |                                                        |
| Ocupación general     |                                                        |
| Dispositivo habitual  |                                                        |
| Experiencia digital   | \[ \] Baja \[ \] Media \[ \] Alta                      |
| Conectividad habitual | \[ \] Estable \[ \] Intermitente \[ \] Sin datos       |
| Fecha y modalidad     |                                                        |
| Duración              |                                                        |
| Investigador          |                                                        |

## Guía de entrevista para asesor de crédito o rol análogo

Duración sugerida: 20-30 minutos. Pedir ejemplos recientes y evitar preguntas que sugieran la respuesta.

**1. Describa un día reciente de trabajo fuera de oficina, desde la primera visita hasta el cierre.**

Respuesta: ______  
______

**2. En qué momentos usa el teléfono mientras está de pie o tiene una mano ocupada?**

Respuesta: ______  
______

**3. Qué información necesita ver primero cuando llega con un cliente?**

Respuesta: ______  
______

**4. Cuénteme la última vez que tuvo que capturar nuevamente un dato. Qué provocó la repeticion?**

Respuesta: ______  
______

**5. Qué ocurre cuando pierde la señal durante una captura o un pago?**

Respuesta: ______  
______

**6. Cómo confirma que una operación se guardó y no se enviará dos veces?**

Respuesta: ______  
______

**7. Qué campos producen más errores o requieren más explicación?**

Respuesta: ______  
______

**8. Cómo busca a un cliente cuando solo recuerda parte de sus datos?**

Respuesta: ______  
______

**9. Qué necesita comprobar antes de registrar un pago?**

Respuesta: ______  
______

**10. Cómo explica al cliente cuanto se aplicó a gastos, mora, interés y capital?**

Respuesta: ______  
______

**11. Qué tipo de comprobante genera mayor confianza y por qué?**

Respuesta: ______  
______

**12. Cómo detecta y corrige un monto mal ingresado antes de confirmar?**

Respuesta: ______  
______

**13. Qué cambios nota al usar el teléfono bajo luz solar?**

Respuesta: ______  
______

**14. Cómo comunica un cambio de tramo de mora y qué dudas recibe?**

Respuesta: ______  
______

**15. Qué información debe permanecer disponible sin conexión?**

Respuesta: ______  
______

**16. Si pudiera eliminar un paso de su proceso actual, cuál sería y por qué?**

Respuesta: ______  
______

## Guía de entrevista para cliente

Duración sugerida: 20-30 minutos. Pedir ejemplos recientes y evitar preguntas que sugieran la respuesta.

**1. Cómo sabe cuánto debe y cuándo debe realizar su próximo pago?**

Respuesta: ______  
______

**2. Qué diferencia entiende entre cuota, saldo, interés y mora?**

Respuesta: ______  
______

**3. Qué parte de un estado de cuenta le resulta menos clara?**

Respuesta: ______  
______

**4. Cuénteme la última vez que recibió un recordatorio de pago. Fue útil?**

Respuesta: ______  
______

**5. Por qué canal prefiere recibir recordatorios y confirmaciones?**

Respuesta: ______  
______

**6. Qué necesita revisar antes de confirmar un pago?**

Respuesta: ______  
______

**7. Cómo comprueba que un pago fue recibido correctamente?**

Respuesta: ______  
______

**8. Qué haría si recibe dos confirmaciones para el mismo pago?**

Respuesta: ______  
______

**9. Cómo esperaria que le expliquen un aumento de mora por días de atraso?**

Respuesta: ______  
______

**10. Preferiría conocer el cambio de tramo antes o después de que ocurra? Por qué?**

Respuesta: ______  
______

**11. Qué palabras financieras le parecen confusas o poco confiables?**

Respuesta: ______  
______

**12. Qué opción necesitaría si detecta un monto incorrecto?**

Respuesta: ______  
______

**13. Qué tareas evita hacer desde el teléfono y por qué?**

Respuesta: ______  
______

**14. Qué haría que confiara más en la información mostrada?**

Respuesta: ______  
______

## Guía de entrevista para gerencia o comité

Duración sugerida: 20-30 minutos. Pedir ejemplos recientes y evitar preguntas que sugieran la respuesta.

**1. Qué decisiones toma con mayor frecuencia usando indicadores de cartera?**

Respuesta: ______  
______

**2. Qué necesita identificar durante los primeros treinta segundos de consulta?**

Respuesta: ______  
______

**3. Cómo explica la diferencia entre cartera en mora y cartera en riesgo?**

Respuesta: ______  
______

**4. Qué consecuencia tendría confundir 21.75 por ciento de mora con 7.00 por ciento de riesgo?**

Respuesta: ______  
______

**5. Qué desglose necesita por tramo y con qué frecuencia?**

Respuesta: ______  
______

**6. Cuándo necesita pasar de un indicador al detalle de los créditos?**

Respuesta: ______  
______

**7. Cómo debe presentarse lo dado por incobrable en el período?**

Respuesta: ______  
______

**8. Qué evidencia necesita para confiar en un cierre diario o mensual?**

Respuesta: ______  
______

**9. Qué debe ocurrir si alguien intenta ejecutar nuevamente el mismo cierre?**

Respuesta: ______  
______

**10. Qué información consulta desde escritorio y cuál desde teléfono?**

Respuesta: ______  
______

**11. Qué exportaciones o comparaciones utiliza para presentar decisiones?**

Respuesta: ______  
______

**12. Qué alerta debería ser visible sin abrir otro reporte?**

Respuesta: ______  
______

**13. Qué dato mal rotulado podría causar una decisión económica equivocada?**

Respuesta: ______  
______

**14. Cómo verificaría que una cifra del tablero proviene del núcleo y no de un calculo manual?**

Respuesta: ______  
______

## Encuesta breve por perfiles

Aplicar solo los bloques pertinentes. Escala de acuerdo: 1 totalmente en desacuerdo, 2 en desacuerdo, 3 neutral, 4 de acuerdo, 5 totalmente de acuerdo.

| **No.** | **Perfil** | **Pregunta**                                                 | **Respuesta**            | **Decisión informada**    |
|---------|------------|--------------------------------------------------------------|--------------------------|---------------------------|
| 1       | Todos      | Qué dispositivo usa con mayor frecuencia?                    | Única                    | Dispositivo objetivo      |
| 2       | Todos      | Cómo califica su acceso a internet durante la tarea?         | 1 muy malo a 5 excelente | Estrategia offline        |
| 3       | Campo      | Puedo completar una captura usando una sola mano.            | Likert 1-5               | Tamaño y disposición      |
| 4       | Campo      | La luz exterior dificulta leer la pantalla.                  | Frecuencia               | Contraste                 |
| 5       | Campo      | He perdido datos al quedarse sin señal.                      | Frecuencia               | Guardado local            |
| 6       | Campo      | Necesito recapturar datos del cliente.                       | Frecuencia               | Persistencia del flujo    |
| 7       | Campo      | Me preocupa registrar dos veces un pago.                     | Likert 1-5               | Idempotencia visible      |
| 8       | Campo      | El comprobante muestra claramente el desglose.               | Likert 1-5               | Contenido del comprobante |
| 9       | Cliente    | Comprendo cuánto debo actualmente.                           | Likert 1-5               | Jerarquía de saldo        |
| 10      | Cliente    | Comprendo la diferencia entre interés y mora.                | Likert 1-5               | Lenguaje llano            |
| 11      | Cliente    | Prefiero recibir alertas antes de cambiar de tramo.          | Likert 1-5               | Notificación preventiva   |
| 12      | Cliente    | Qué canal prefiere para recordatorios?                       | Múltiple                 | Canal                     |
| 13      | Cliente    | Reviso el comprobante después de pagar.                      | Frecuencia               | Confirmación              |
| 14      | Cliente    | Puedo detectar si un monto es incorrecto antes de confirmar. | Likert 1-5               | Revisión previa           |
| 15      | Gerencia   | Distingo con rapidez mora y riesgo.                          | Likert 1-5               | Rotulado de indicadores   |
| 16      | Gerencia   | Necesito ver riesgo por tramo.                               | Likert 1-5               | Drill-down                |
| 17      | Gerencia   | Necesito ver incobrables junto al riesgo.                    | Likert 1-5               | Contexto contable         |
| 18      | Gerencia   | El cierre debe mostrar evidencia de no duplicación.          | Likert 1-5               | Auditoría                 |
| 19      | Todos      | Qué información le resulta más dificil de entender?          | Abierta                  | Microcopy                 |
| 20      | Todos      | Qué cambio reduciría más errores en su tarea?                | Abierta                  | Prioridad                 |

## Guía de observación contextual

| **No.** | **Elemento observado**                                 | **Sí** | **No** | **Nota y tiempo** |
|---------|--------------------------------------------------------|--------|--------|-------------------|
| 1       | La persona alterna teléfono y documentos físicos.      | \[ \]  | \[ \]  |                   |
| 2       | Opera con una mano o mientras permanece de pie.        | \[ \]  | \[ \]  |                   |
| 3       | El reflejo o la luz exterior reduce legibilidad.       | \[ \]  | \[ \]  |                   |
| 4       | La conectividad se interrumpe durante la tarea.        | \[ \]  | \[ \]  |                   |
| 5       | La aplicación conserva el progreso al perder conexión. | \[ \]  | \[ \]  |                   |
| 6       | Se repiten datos ya ingresados en el mismo flujo.      | \[ \]  | \[ \]  |                   |
| 7       | La persona duda al leer monto, saldo o mora.           | \[ \]  | \[ \]  |                   |
| 8       | Existe revisión antes de desembolso o pago.            | \[ \]  | \[ \]  |                   |
| 9       | La recuperación de error es visible y comprensible.    | \[ \]  | \[ \]  |                   |
| 10      | El comprobante permite verificar el destino del pago.  | \[ \]  | \[ \]  |                   |

## Registro de evidencia

| **Código** | **Tarea** | **Respuesta o conducta** | **Cita autorizada** | **Dolor** | **Oportunidad** | **Frecuencia** | **Evidencia** | **Estado** |
|------------|-----------|--------------------------|---------------------|-----------|-----------------|----------------|---------------|------------|
|            |           |                          |                     |           |                 |                |               |            |

## Plan de análisis

- Anonimizar participantes y separar citas textuales de interpretaciones del equipo.

- Codificar respuestas por tarea, contexto, dolor, riesgo monetario y oportunidad.

- Agrupar observaciones por afinidad y registrar también excepciones o contradicciones.

- Triangular: aceptar un hallazgo como fuerte cuando coincide en más de una técnica o perfil.

- Convertir hallazgos en necesidades sin saltar directamente a una pantalla especifica.

- Actualizar las personas y el journey map indicando evidencia y nivel de validación.

## Referencias

Banco Mundial. (2025). The Global Findex Database 2025: Connectivity and Financial Inclusión in the Digital Economy. https://www.worldbank.org/en/publication/globalfindex

Banco Mundial. (2025). Guatemala 2024 Global Findex Microdata \[Conjunto de datos\]. https://doi.org/10.48529/ad4w-j084

Grupo Banco Mundial. (2026). Guatemala: panorama general. https://www.bancomundial.org/ext/es/country/guatemala

Superintendencia de Bancos de Guatemala. (2024). Estrategia Nacional de Inclusión Financiera para Guatemala 2024-2027. https://www.sib.gob.gt/estrategia-nacional-de-inclusion-financiera-guatemala-2024-2027/

Superintendencia de Bancos de Guatemala. (s. f.). Boletin Trimestral de Indicadores de Inclusión Financiera. https://www.sib.gob.gt/informacion-sistema-financiero/boletines-estadisticas/boletin-trimestral-de-indicadores-de-inclusion-financiera/

Universidad Mariano Gálvez de Guatemala. (2026). Proyecto 2: experiencia de usuario, interfaz y movilidad, y evolucion del núcleo. Documento del curso Análisis de Sistemas II.
