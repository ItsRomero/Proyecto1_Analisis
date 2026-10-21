/*
 * Verificación de cifras del texto del modelo: todo número decimal que escriba (importes, porcentajes,
 * tasas) debe aparecer en los resultados de herramientas del mismo turno. Así el modelo puede repetir
 * cifras del núcleo, pero no calcularlas, sumarlas, redondearlas ni inventarlas.
 * Fase 7 (ADR-023): también los porcentajes, aunque sean enteros ("(100%)"), deben estar respaldados; una tasa
 * decimal del núcleo (0.24) respalda su forma porcentual (24 %). Los enteros sin % (días, conteos) no se verifican.
 */
// Fase 7: un punto final de oración no impide reconocer la cifra ("…es de Q 370.85."); sí lo impide ".dígito".
const DECIMAL = /(?<![\w.])(?:Q\s?)?\d{1,3}(?:,\d{3})+(?:\.\d+)?(?!\w|\.\d)|(?<![\w.,])(?:Q\s?)?\d+\.\d+(?!\w|\.\d)/g;
const PORCENTAJE = /(?<![\w.,])(\d{1,3}(?:\.\d+)?)\s?%/g;
const normalizar = (t: string) => t.replace(/^Q\s?/, "").replace(/,/g, "");
const canonico = (t: string) => {
  const n = normalizar(t);
  return n.includes(".") ? n.replace(/0+$/, "").replace(/\.$/, "") : n;
};
/** "0.24" -> "24", "0.025" -> "2.5": desplazamiento de texto, sin punto flotante. */
function comoPorcentaje(tasa: string): string {
  const digitos = tasa.slice(2).padEnd(2, "0");
  const entero = digitos.slice(0, 2).replace(/^0(?=\d)/, "");
  const resto = digitos.slice(2);
  return canonico(resto ? `${entero}.${resto}` : entero);
}

/** Cifras permitidas: todo valor numérico (o cadena numérica) que aparezca en los resultados. */
export function cifrasDe(valor: unknown, destino = new Set<string>()): Set<string> {
  if (typeof valor === "number") destino.add(canonico(String(valor)));
  else if (typeof valor === "string") {
    if (/^\d+(\.\d+)?$/.test(valor)) destino.add(canonico(valor));
    if (/^0\.\d+$/.test(valor)) destino.add(comoPorcentaje(valor));
    for (const [m] of valor.matchAll(DECIMAL)) {
      destino.add(canonico(m));
      if (/^0\.\d+$/.test(normalizar(m))) destino.add(comoPorcentaje(normalizar(m)));
    }
    for (const m of valor.matchAll(PORCENTAJE)) destino.add(canonico(m[1]!));
  } else if (Array.isArray(valor)) for (const v of valor) cifrasDe(v, destino);
  else if (valor !== null && typeof valor === "object") for (const v of Object.values(valor)) cifrasDe(v, destino);
  return destino;
}

export function verificarCifras(texto: string, permitidas: ReadonlySet<string>): { readonly verificadas: boolean; readonly ajenas: readonly string[] } {
  const decimales = [...texto.matchAll(DECIMAL)].map(([m]) => m).filter((m) => !permitidas.has(canonico(m)));
  const porcentajes = [...texto.matchAll(PORCENTAJE)].filter((m) => !permitidas.has(canonico(m[1]!))).map((m) => m[0].trim());
  const ajenas = [...new Set([...decimales, ...porcentajes])];
  return { verificadas: ajenas.length === 0, ajenas };
}
