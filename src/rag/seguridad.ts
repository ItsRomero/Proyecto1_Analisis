/*
 * Defensas genéricas del RAG. Ninguna depende de un documento ni de una cadena concreta del corpus:
 * patrones de datos personales de Guatemala y señales de texto que se dirige al asistente.
 */
const PII: readonly { readonly tipo: string; readonly patron: RegExp }[] = [
  { tipo: "DPI", patron: /\bDPI[-\s]?[A-Z]*[-\s]?\d{4,}\b/gi },
  { tipo: "DPI", patron: /(?<![\w-])\d{4}\s?\d{5}\s?\d{4}(?![\w-])/g },
  // Teléfono de 8 dígitos (dddd-dddd o dddd dddd); no toca identificadores como CV-2026-0001.
  { tipo: "TELEFONO", patron: /(?:\+?502[\s-]?)?(?<![\w-])\d{4}[\s-]\d{4}(?![\w-])/g },
  { tipo: "CORREO", patron: /\b[\w.+-]+@[\w-]+\.[\w.]+\b/g },
];
export const MARCA_PII = "[dato personal omitido]";

/** Sustituye datos personales; se usa al ingerir (limpieza) y sobre cada respuesta del modelo. */
export function filtrarPii(texto: string): { readonly texto: string; readonly omitidos: number } {
  let omitidos = 0;
  let resultado = texto;
  for (const { patron } of PII) resultado = resultado.replace(patron, () => { omitidos++; return MARCA_PII; });
  return { texto: resultado, omitidos };
}

/**
 * Señales de que un fragmento se dirige al asistente (órdenes, cambio de rol, herramientas o secretos).
 * No bloquea el fragmento: lo marca para que el prompt y la bitácora lo traten como dato no confiable.
 */
const SENALES_INSTRUCCION: readonly RegExp[] = [
  /\b(asistente|modelo|ia|ai|chatbot|llm)\b[^.\n]{0,40}\b(instrucci[oó]n|orden|debes|responde)/i,
  /\bignora\w*\b[^.\n]{0,60}\b(reglas?|instrucciones|restricciones|anteriores)\b/i,
  /\b(ejecuta|invoca|llama|usa)\w*\b[^.\n]{0,40}\bherramienta\b/i,
  /\bsin (pedir|solicitar) (aprobaci[oó]n|autorizaci[oó]n|confirmaci[oó]n)\b/i,
  /\b(muestra|revela|imprime|lista)\w*\b[^.\n]{0,40}\b(DPI|tel[eé]fonos?|contraseñas?|secretos?|claves?)\b/i,
  /\bresponde (?:únicamente|solo|solamente)\b/i,
  /\b(a partir de (este|ahora)|desde ahora)\b[^.\n]{0,40}\b(eres|act[uú]a|responde)/i,
];
export function pareceInstruccion(texto: string): boolean {
  return SENALES_INSTRUCCION.some((s) => s.test(texto));
}

/** Escapa el texto recuperado para que no pueda cerrar ni abrir los delimitadores del prompt. */
export function escaparDato(texto: string): string {
  return texto.replace(/</g, "‹").replace(/>/g, "›");
}
