# Adaptador MCP planificado

Fase 4 implementará SDK TypeScript con transporte `stdio`, proceso hijo del
servidor, sin conexión directa del navegador ni stdout de depuración.
Registro de herramientas: `src/contratos/rutas-proyecto-final.ts`;
entradas/salidas: `src/contratos/proyecto-final.ts`. Se invocan las mismas
instancias de `CasosUsoFinal` que la API. Identidad, sesión y permisos proceden
del servidor; no se aceptan desde argumentos del modelo.

Siete herramientas consultan. `proponer_pago` crea una propuesta pendiente
sin efecto financiero y muestra deuda/prelación. Confirmar, cancelar,
originar, aprobar, desembolsar y generar cierre no son herramientas del LLM.
La confirmación ocurre por la API después de un evento humano verificable en
la misma sesión. El MCP nunca recibe la capacidad de generar esa evidencia.

Una llamada incrustada en corpus no se convierte en instrucción. Los resultados
se validan con Zod y se filtra PII antes de devolver al proveedor/chat.
