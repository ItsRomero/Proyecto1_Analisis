/*
 * Verificación de cifras del texto del modelo: todo número decimal que escriba (importes, porcentajes,
 * tasas) debe aparecer en los resultados de herramientas del mismo turno. Así el modelo puede repetir
 * cifras del núcleo, pero no calcularlas, sumarlas, redondearlas ni inventarlas.
 */
const DECIMAL = /(?<![\w.])(?:Q\s?)?\d{1,3}(?:,\d{3})+(?:\.\d+)?(?![\w])|(?<![\w.,])(?:Q\s?)?\d+\.\d+(?![\w.])/g;
const normalizar = (t: string) => t.replace(/^Q\s?/, "").replace(/,/g, "");
const canonico = (t: string) => {
  const n = normalizar(t);
  return n.includes(".") ? n.replace(/0+$/, "").replace(/\.$/, "") : n;
};

/** Cifras permitidas: todo valor numérico (o cadena numérica) que aparezca en los resultados. */
export function cifrasDe(valor: unknown, destino = new Set<string>()): Set<string> {
  if (typeof valor === "number") destino.add(canonico(String(valor)));
  else if (typeof valor === "string") {
    if (/^\d+(\.\d+)?$/.test(valor)) destino.add(canonico(valor));
    for (const [m] of valor.matchAll(DECIMAL)) destino.add(canonico(m));
  } else if (Array.isArray(valor)) for (const v of valor) cifrasDe(v, destino);
  else if (valor !== null && typeof valor === "object") for (const v of Object.values(valor)) cifrasDe(v, destino);
  return destino;
}

export function verificarCifras(texto: string, permitidas: ReadonlySet<string>): { readonly verificadas: boolean; readonly ajenas: readonly string[] } {
  const ajenas = [...texto.matchAll(DECIMAL)].map(([m]) => m).filter((m) => !permitidas.has(canonico(m)));
  return { verificadas: ajenas.length === 0, ajenas };
}
