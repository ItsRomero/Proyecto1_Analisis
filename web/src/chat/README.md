# Chat gerencial (fase 6)

Ruta `/gerencia/asistente`, con el botón persistente **Asistente** en todas las pantallas de gerencia. La conversación vive en el servidor (`src/chat/`, ADR-022); esta carpeta solo presenta el estado.

| Archivo | Rol |
| --- | --- |
| `Chat.tsx` | Conversación, estado de espera con segundos transcurridos, sugerencias G-1 a G-8, envío (Enter) y reinicio (cancela antes las propuestas pendientes) |
| `Tarjetas.tsx` | Tarjeta de herramienta (origen MCP o RAG, herramienta, argumentos, corte y duración), vista genérica de resultados del núcleo, citas como referencias legibles y tarjeta de propuesta con **Aprobar** y **Cancelar** |
| `api.ts` | Cliente de `/v1/chat`, validado con `estadoChatSchema` (`src/contratos/chat.ts`) |

Reglas de presentación:

- **Cifras:** solo se muestran las de las tarjetas, con el formato exacto de la API y sin conversiones a `number`. Si el texto del modelo trae cifras sin respaldo, el servidor lo oculta y la interfaz lo indica.
- **Origen de cada respuesta:** debajo de cada una aparecen la ruta (MCP, RAG o ambas), las herramientas de las que salen las cifras, la fecha de corte, la duración y si las cifras quedaron verificadas.
- **Aprobación:** una propuesta de pago no tiene efecto hasta pulsar **Aprobar**. Ese botón llama a `confirmarPago` con evento humano e `Idempotency-Key`, igual que la pantalla de registro de pago; luego informa el resultado al chat. Un mensaje de texto nunca aprueba.
- **Errores y conexión:** se muestran sin perder el mensaje escrito ni las propuestas pendientes.
