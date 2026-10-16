# Guía interna de defensa — Grupo 2

Preparación para los cuatro integrantes; no acredita una defensa oral realizada. Usar el maestro para nombres y carnés y el código para explicar el comportamiento real. Ningún integrante queda limitado a su rol histórico.

## Recorrido que cada integrante debe poder explicar

1. Abrir un crédito en la interfaz y señalar el corte y el origen de sus cifras.
2. Seguir la petición desde React a la API, los casos de uso y el núcleo. Explicar por qué React, SQL y el modelo no calculan dinero.
3. Proponer un pago, mostrar la prelación y explicar qué sucede antes y después de la confirmación humana. Distinguir propuesta pendiente de pago aplicado.
4. Formular una consulta numérica y otra normativa: señalar MCP frente a RAG, tarjetas, fuentes y citas.
5. Explicar OP-7 sin obedecer ni divulgar el contenido malicioso; identificar los límites observados del sistema.

## Preguntas y evidencias para preparar

| Pregunta | Puntos que deben explicarse | Evidencia |
| --- | --- | --- |
| ¿Qué se conservó de P1/P2? | Dinero exacto, plan francés, mora, prelación, State, idempotencia y riesgo; extensiones por aplicación y puertos. | `src/dominio/`, `servicios-final.ts`, suites heredadas, ADR-001/006/019. |
| ¿Por qué no calcula el LLM? | Puede seleccionar herramientas y redactar; las cifras provienen del núcleo y se muestran con origen/corte. El verificador no es garantía semántica completa. | `src/chat/`, `src/mcp/`, ADR-022/023. |
| ¿Qué puede escribir MCP? | Solo proponer un pago pendiente; no confirmar, aprobar, desembolsar ni generar cierres. Confirmar requiere evento humano de un solo uso y sesión vinculada. | Ocho herramientas, ADR-020, pruebas MCP. |
| ¿Qué ocurre con una clave repetida? | Misma solicitud devuelve el pago original; contenido diferente genera conflicto; no se vuelve a cobrar ni se paga la siguiente cuota por el replay. | RegistrarPago, bloqueo de crédito, claves persistentes, OP-4. |
| ¿Cómo se carga sin adulterar? | SHA-256 de bytes; orden seq; pagos por núcleo; transacción y rollback; log separado de proyecciones; segunda carga sin sobrescribir operaciones. | `carga.test.ts`, integración, ADR-018. |
| ¿Qué se decide en D-1 a D-9? | Bajas derivadas; exactitud/aprobación; gasto por política; catálogo; fin de mes; comité; ventana; cierre; retención idempotente. | ADR-009 a ADR-017. |
| ¿Cómo funciona RAG? | Siete documentos; secciones completas; embeddings bge-m3; pgvector; k/umbral; citas contrastadas; ausencia de respaldo explícita. | ADR-021 y pruebas RAG. |
| ¿Cómo se mitiga OP-7? | Corpus como dato no confiable; instrucciones separadas; redactor sin herramientas; permisos; filtrado PII y citación. No prometer invulnerabilidad absoluta. | `src/rag/`, tests OP-7, reportes reales. |
| ¿Qué significa que una eval apruebe? | Exactitud de herramientas y seguridad según aserciones; no equivale a redacción completa, tiempo de video ni defensa oral aprobada. | ADR-023, reporte de calidad G-2. |
| ¿Por qué importa la fecha? | Fecha de corte explícita, consultas históricas y ventanas; G-7 usa otra fecha; no usar el reloj del sistema para cobrar. | Pruebas con reloj falseado. |

## Decisiones a elegir para la explicación individual

Cada integrante debe poder justificar una decisión con su alternativa descartada: arquitectura hexagonal; dinero decimal; menor privilegio MCP; aprobación ligada a sesión; RAG con citas; memoria de sesión; oráculo con dos estados. Señalar código y prueba que la respalda, no memorizar solo el nombre del patrón.

## Límites que no deben ocultarse

- Selector de perfil de demostración; no autenticación empresarial.
- Sesiones y memoria en proceso; reiniciar pierde contexto.
- Latencia de CPU; necesidad de medir el video completo.
- Redacción variable y posible ocultación por cifras sin respaldo.
- El verificador no contrasta todos los enteros ni interpreta semánticamente cada cifra.
- Grabación, participación oral, enlace del video y entrega Canvas requieren acciones/evidencia reales.

## Lista de preparación del equipo

Realizar un ensayo por integrante, rotar la explicación de las herramientas y revisar cada pregunta de la tabla. Registrar resultados reales y correcciones; dejar sin marcar lo que no se haya ensayado. La nota individual depende del porcentaje de la serie del Examen Final y no puede calcularse sin ese dato.
