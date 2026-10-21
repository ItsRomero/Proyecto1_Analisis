import { readFile, access } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";

import { politicasPaqueteSchema } from "../contratos/proyecto-final.js";
import { eventoCanonicoSchema, type EventoCanonico, type PoliticasPaquete } from "../contratos/paquete-canonico.js";
export type { EventoCanonico, PoliticasPaquete, DesembolsoCanonico } from "../contratos/paquete-canonico.js";

export const sha256 = (contenido: string | Buffer): string => createHash("sha256").update(contenido).digest("hex");
export class ErrorCarga extends Error {
  public constructor(public readonly codigo: string, mensaje: string, public readonly seq?: number) {
    super(`${codigo}${seq === undefined ? "" : ` (seq ${seq})`}: ${mensaje}`);
    this.name = "ErrorCarga";
  }
}
export interface PaqueteCanonico {
  readonly huella: string;
  readonly huellaPoliticas: string;
  readonly huellaAsesores: string;
  readonly eventos: readonly EventoCanonico[];
  readonly lineas: readonly string[];
  readonly politicas: PoliticasPaquete;
  readonly asesores: readonly { id: string; nombre: string }[];
  readonly leeme: string;
}

/** Verifica bytes antes de analizar o abrir una transacción. Nunca escribe los insumos. */
export async function leerPaquete(carpeta = process.env["CV_DATA_DIR"]): Promise<PaqueteCanonico> {
  if (!carpeta?.trim()) throw new ErrorCarga("CV_DATA_DIR_FALTANTE", "Configure la carpeta del paquete oficial.");
  const raiz = resolve(carpeta);
  let archivos: Buffer[];
  try {
    archivos = await Promise.all(["eventos.jsonl", "eventos.sha256", "politicas.json", "asesores.csv", "LEEME.md"]
      .map((nombre) => readFile(join(raiz, nombre))));
    await access(join(raiz, "corpus"));
  } catch { throw new ErrorCarga("INSUMO_NO_DISPONIBLE", `Paquete incompleto o ilegible en ${raiz}.`); }
  const [eventosBytes, huellaBytes, politicasBytes, asesoresBytes, leemeBytes] = archivos as [Buffer, Buffer, Buffer, Buffer, Buffer];
  const huella = sha256(eventosBytes);
  const declarada = /^([a-f0-9]{64})(?:\s+\*?eventos\.jsonl)?\s*$/i.exec(huellaBytes.toString("utf8").trim())?.[1]?.toLowerCase();
  if (huella !== declarada) throw new ErrorCarga("HUELLA_INVALIDA", "SHA-256 de eventos.jsonl no coincide con eventos.sha256; no se cargó nada.");
  const lineas = eventosBytes.toString("utf8").trimEnd().split(/\r?\n/);
  const eventos = lineas.map((linea, i) => {
    try { return eventoCanonicoSchema.parse(JSON.parse(linea)); }
    catch { throw new ErrorCarga("EVENTO_INVALIDO", "JSON o campos fuera del contrato.", i + 1); }
  });
  eventos.forEach((e, i) => {
    if (e.seq !== i + 1) throw new ErrorCarga("SECUENCIA_INVALIDA", "seq debe ser continuo, único y estar en orden desde 1.", e.seq);
  });
  if (eventos.length !== 363) throw new ErrorCarga("CONTEO_INVALIDO", `Se esperaban 363 eventos; hay ${eventos.length}.`);
  let politicas: PoliticasPaquete;
  try { politicas = politicasPaqueteSchema.parse(JSON.parse(politicasBytes.toString("utf8"))); }
  catch { throw new ErrorCarga("POLITICAS_INVALIDAS", "politicas.json no cumple el contrato compartido."); }
  const filas = asesoresBytes.toString("utf8").trim().split(/\r?\n/);
  if (filas.shift() !== "id_asesor,nombre_completo") throw new ErrorCarga("ASESORES_INVALIDOS", "Encabezado CSV inesperado.");
  const asesores = filas.map((fila) => {
    const partes = fila.split(",");
    if (partes.length !== 2 || !partes[0] || !partes[1]) throw new ErrorCarga("ASESORES_INVALIDOS", "Fila de asesores inválida.");
    return { id: partes[0], nombre: partes[1] };
  });
  if (asesores.length !== 6 || new Set(asesores.map((a) => a.id)).size !== 6)
    throw new ErrorCarga("ASESORES_INVALIDOS", "Se requieren seis asesores únicos.");
  return { huella, eventos, lineas, politicas, asesores, leeme: leemeBytes.toString("utf8"),
    huellaPoliticas: sha256(politicasBytes), huellaAsesores: sha256(asesoresBytes) };
}

export async function preflight(raiz = process.cwd()): Promise<void> {
  const rutas = ["vistas/index.html", "vistas/docs/README.md", "vistas/css/shared.css", "vistas/css/design.css", "vistas/assets",
    "datos/datos-proyecto-final.zip", "datos/datos-proyecto-final/eventos.jsonl", "datos/datos-proyecto-final/eventos.sha256",
    "datos/datos-proyecto-final/politicas.json", "datos/datos-proyecto-final/LEEME.md", "datos/datos-proyecto-final/corpus"];
  const faltantes: string[] = [];
  for (const ruta of rutas) { try { await access(resolve(raiz, ruta)); } catch { faltantes.push(ruta); } }
  if (faltantes.length) throw new ErrorCarga("PREFLIGHT_FALLIDO", `Faltan: ${faltantes.join(", ")}`);
}
