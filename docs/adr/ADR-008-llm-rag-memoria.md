# ADR-008: LLM, embeddings, RAG y memoria de sesión

Estado: aceptado como diseño de fase 1. Fecha: 2026-10-13.

## Contexto

Se necesita un proveedor gratuito con herramientas, políticas en español citables y contexto acotado, sin enviar PII a servicios externos.

## Decisión

Seleccionar Ollama local con qwen3:8b, temperatura 0, y bge-m3 para embeddings; dimensión prevista 1024, validar la dimensión real al ingerir. Canalización LangChain.js. Corpus exclusivo de siete documentos. Fragmentar por encabezados/secciones, sin solapamiento entre documentos; conservar fuente/sección/hash. Memoria de hasta 12 turnos por sesión y caducidad técnica de 60 minutos, reiniciable y aislada.

## Alternativas

Gemini/Groq gratuitos son alternativas contractuales que requieren revisión explícita, credenciales y minimización de datos; no se activa fallback externo silencioso. No se elige nomic sin comparación documentada en español. No se guarda memoria global ni razonamiento interno.

## Consecuencias y límites

qwen3:8b figura con capacidad tools en https://ollama.com/library/qwen3:8b. Embeddings: https://ollama.com/library/bge-m3. Tool calling: https://github.com/ollama/ollama/blob/main/docs/capabilities/tool-calling.mdx. No se descargaron modelos ni se midieron latencia/calidad en esta fase. El contenido recuperado es dato no confiable, nunca autorización de herramientas. Los parámetros de RAG son iniciales y deben evaluarse.

## Validación

Fases 5–7: verificar modelo/digest, dimensión, recuperación G-8, citas, OP-7, ausencia de PII y respuestas sin respaldo. La temperatura 0 no promete determinismo total.
