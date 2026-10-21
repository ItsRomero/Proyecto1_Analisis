/*
 * Presentación de cifras que llegan de la API. Solo manipula cadenas: no convierte importes a
 * number, no redondea, no suma y no usa el reloj. Cualquier cálculo financiero vive en el núcleo.
 */
export interface DineroApi { readonly importe: string; readonly moneda: string }

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] as const;

/** "12345.67" -> "Q 12,345.67" (separador de miles por agrupación de caracteres). */
export function formatearDinero(d: DineroApi): string {
  const [entero = "0", decimales = "00"] = d.importe.split(".");
  const agrupado = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${d.moneda === "GTQ" ? "Q" : d.moneda} ${agrupado}.${decimales}`;
}

/** "11.93" -> "11.93 %"; null (sin denominador) -> "—". */
export function formatearPorcentaje(valor: string | null): string {
  return valor === null ? "—" : `${valor} %`;
}

/** Desplaza el punto decimal dos posiciones a la derecha: "0.36" -> "36", "0.025" -> "2.5". */
export function tasaComoPorcentaje(tasa: string): string {
  const [entero = "0", decimales = ""] = tasa.split(".");
  const relleno = decimales.padEnd(2, "0");
  const nuevoEntero = `${entero}${relleno.slice(0, 2)}`.replace(/^0+(?=\d)/, "");
  const resto = relleno.slice(2).replace(/0+$/, "");
  return resto ? `${nuevoEntero}.${resto}` : nuevoEntero;
}

/** Inverso exacto: "36" -> "0.36", "36.5" -> "0.365". Devuelve null si el texto no es una tasa. */
export function porcentajeComoTasa(texto: string): string | null {
  const limpio = texto.trim().replace(",", ".");
  if (!/^\d{1,3}(?:\.\d{1,6})?$/.test(limpio)) return null;
  const [entero = "0", decimales = ""] = limpio.split(".");
  const relleno = entero.padStart(3, "0");
  const nuevoEntero = relleno.slice(0, -2).replace(/^0+(?=\d)/, "");
  const nuevosDecimales = `${relleno.slice(-2)}${decimales}`.replace(/0+$/, "");
  return nuevosDecimales ? `${nuevoEntero}.${nuevosDecimales}` : nuevoEntero;
}

/** Normaliza lo que escribe la persona usuaria al formato del contrato ("500" -> "500.00"). */
export function normalizarImporte(texto: string): string | null {
  const limpio = texto.trim().replace(/^Q\s*/i, "").replace(/,/g, "");
  if (/^\d+$/.test(limpio)) return `${limpio.replace(/^0+(?=\d)/, "")}.00`;
  if (/^\d+\.\d$/.test(limpio)) return `${limpio.replace(/^0+(?=\d)/, "")}0`;
  if (/^\d+\.\d{2}$/.test(limpio)) return limpio.replace(/^0+(?=\d)/, "");
  return null;
}

/** "2026-10-31" -> "31 oct 2026" sin construir objetos Date. */
export function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-");
  const nombre = MESES[Number(mes) - 1];
  return nombre === undefined || dia === undefined ? fecha : `${Number(dia)} ${nombre} ${anio}`;
}

/** Primer día del mes de una fecha civil, por manipulación de texto. */
export function inicioDeMes(fecha: string): string {
  return `${fecha.slice(0, 7)}-01`;
}

const NOMBRES_TRAMO: Readonly<Record<string, string>> = {
  SIN_MORA: "Al día", MORA_1: "Mora 1", MORA_2: "Mora 2", MORA_3: "Mora 3", VENCIDO: "Vencido",
  INCOBRABLE: "Incobrable", REESTRUCTURADO: "Reestructurado", PLANA: "Política plana",
};
export const nombreTramo = (tramo: string): string => NOMBRES_TRAMO[tramo] ?? tramo.replace(/_/g, " ");

const NOMBRES_ESTADO: Readonly<Record<string, string>> = {
  SOLICITADO: "Solicitado", APROBADO: "Aprobado", RECHAZADO: "Rechazado", DESEMBOLSADO: "Desembolsado",
  VIGENTE: "Vigente", EN_MORA: "En mora", REESTRUCTURADO: "Reestructurado", ANULADO: "Anulado",
  CANCELADO: "Cancelado", INCOBRABLE: "Incobrable",
};
export const nombreEstado = (estado: string): string => NOMBRES_ESTADO[estado] ?? estado;

export const iniciales = (nombre: string): string =>
  nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
