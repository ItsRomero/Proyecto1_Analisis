import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Document } from "@langchain/core/documents";
import { filtrarPii, pareceInstruccion } from "./seguridad.js";

export const sha256 = (contenido: string | Buffer): string => createHash("sha256").update(contenido).digest("hex");

export interface DocumentoCorpus {
  readonly documentoId: string;
  readonly archivo: string;
  readonly titulo: string;
  readonly vigencia: string;
  /** SHA-256 de los bytes originales: permite verificar que el insumo canónico no cambió. */
  readonly sha256: string;
  /** Cuerpo limpio (sin encabezado YAML y con datos personales sustituidos). */
  readonly contenido: string;
}
export interface MetadatosFragmento {
  readonly fragmentoId: string;
  readonly documentoId: string;
  readonly titulo: string;
  readonly vigencia: string;
  readonly seccion: string;
  readonly orden: number;
  readonly sha256: string;
  readonly posibleInstruccion: boolean;
}
export class ErrorCorpus extends Error {
  public constructor(public readonly codigo: string, mensaje: string) { super(`${codigo}: ${mensaje}`); this.name = "ErrorCorpus"; }
}

const DOCUMENTOS_ESPERADOS = 7;

/** Lee exactamente los siete documentos Markdown de CV_DATA_DIR/corpus; nunca escribe los insumos. */
export async function leerCorpus(carpeta = process.env["CV_DATA_DIR"]): Promise<readonly DocumentoCorpus[]> {
  if (!carpeta?.trim()) throw new ErrorCorpus("CV_DATA_DIR_FALTANTE", "Configure la carpeta del paquete oficial.");
  const dir = resolve(carpeta, "corpus");
  let archivos: string[];
  try { archivos = (await readdir(dir)).filter((f) => f.endsWith(".md")).sort(); }
  catch { throw new ErrorCorpus("CORPUS_NO_DISPONIBLE", `No se puede leer ${dir}.`); }
  if (archivos.length !== DOCUMENTOS_ESPERADOS) throw new ErrorCorpus("CORPUS_INCOMPLETO", `Se esperaban ${DOCUMENTOS_ESPERADOS} documentos; hay ${archivos.length}.`);
  return Promise.all(archivos.map(async (archivo) => {
    const bytes = await readFile(join(dir, archivo));
    const texto = bytes.toString("utf8").replace(/\r\n/g, "\n");
    const encabezado = /^---\n([\s\S]*?)\n---\n/.exec(texto);
    if (!encabezado?.[1]) throw new ErrorCorpus("ENCABEZADO_INVALIDO", `${archivo} no tiene encabezado YAML.`);
    const meta = Object.fromEntries(encabezado[1].split("\n").map((l) => /^(\w+):\s*(.+)$/.exec(l)).filter((m) => m !== null)
      .map((m) => [m[1], m[2]!.trim()]));
    const documentoId = meta["doc_id"];
    if (!documentoId || `${documentoId}.md` !== archivo || !meta["titulo"] || !meta["vigencia"])
      throw new ErrorCorpus("ENCABEZADO_INVALIDO", `${archivo}: doc_id, titulo y vigencia son obligatorios y doc_id debe coincidir con el archivo.`);
    return { documentoId, archivo, titulo: meta["titulo"], vigencia: meta["vigencia"], sha256: sha256(bytes),
      contenido: filtrarPii(texto.slice(encabezado[0].length).trim()).texto };
  }));
}

/**
 * Fragmentación por secciones (`##`): los documentos tienen entre 144 y 264 palabras y cada sección
 * es una unidad normativa completa (regla, tabla, ejemplo). Sin solapamiento y sin cortar tablas.
 * El texto previo a la primera sección forma el fragmento "Introducción"; un documento sin secciones
 * es un único fragmento. El texto que se incrusta lleva documento, título, sección y vigencia.
 */
export function fragmentar(doc: DocumentoCorpus): Document<MetadatosFragmento>[] {
  const lineas = doc.contenido.split("\n");
  const bloques: { seccion: string; lineas: string[] }[] = [{ seccion: "Introducción", lineas: [] }];
  for (const linea of lineas) {
    const h2 = /^##\s+(.+)$/.exec(linea);
    if (h2?.[1]) bloques.push({ seccion: h2[1].trim(), lineas: [] });
    else if (!/^#\s+/.test(linea)) bloques.at(-1)!.lineas.push(linea);
  }
  return bloques.map((b) => ({ ...b, texto: b.lineas.join("\n").replace(/\n{3,}/g, "\n\n").trim() }))
    .filter((b) => b.texto.length > 0)
    .map((b, orden) => new Document<MetadatosFragmento>({
      pageContent: b.texto,
      metadata: { fragmentoId: `${doc.documentoId}#${orden + 1}`, documentoId: doc.documentoId, titulo: doc.titulo,
        vigencia: doc.vigencia, seccion: b.seccion, orden: orden + 1, sha256: sha256(b.texto), posibleInstruccion: pareceInstruccion(b.texto) },
    }));
}

/** Texto que se convierte en vector: contexto del documento + contenido de la sección. */
export const textoParaIncrustar = (f: Document<MetadatosFragmento>): string =>
  `${f.metadata.titulo} (${f.metadata.documentoId}) — ${f.metadata.seccion}\nVigencia: ${f.metadata.vigencia}\n\n${f.pageContent}`;

export const huellaCorpus = (docs: readonly DocumentoCorpus[]): string => sha256(docs.map((d) => `${d.documentoId}:${d.sha256}`).join("\n"));
