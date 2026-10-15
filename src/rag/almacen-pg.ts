import type { Pool } from "pg";
import { transaccion } from "../persistencia/postgres.js";
import { ErrorCorpus, fragmentar, huellaCorpus, textoParaIncrustar, type DocumentoCorpus } from "./corpus.js";
import type { BitacoraRag, FragmentoRecuperado, ModeloEmbeddings, Recuperador, RegistroConsultaRag } from "./puertos.js";

const literalVector = (v: readonly number[]): string => `[${v.join(",")}]`;

export interface ResultadoIngesta {
  readonly repetida: boolean;
  readonly corpusSha256: string;
  readonly documentos: number;
  readonly fragmentos: number;
  readonly vectores: number;
  readonly modelo: string;
  readonly digest: string;
  readonly dimension: number;
  readonly fragmentosConInstrucciones: readonly string[];
}

/**
 * Ingesta idempotente en pgvector (misma base que el núcleo). Los vectores se calculan antes de
 * abrir la transacción; la escritura es atómica. Repetirla con el mismo corpus y modelo no inserta
 * nada; un documento que cambió de contenido se rechaza en lugar de sobrescribirse.
 */
export async function ingerirCorpus(pool: Pool, documentos: readonly DocumentoCorpus[], modelo: ModeloEmbeddings,
  dimensionEsperada: number): Promise<ResultadoIngesta> {
  const fragmentos = documentos.flatMap(fragmentar);
  const corpusSha256 = huellaCorpus(documentos);
  const base = { corpusSha256, documentos: documentos.length, fragmentos: fragmentos.length, modelo: modelo.nombre, digest: modelo.digest,
    dimension: dimensionEsperada, fragmentosConInstrucciones: fragmentos.filter((f) => f.metadata.posibleInstruccion).map((f) => f.metadata.fragmentoId) };
  const previa = await pool.query("SELECT 1 FROM cv.ingestas_rag WHERE modelo=$1 AND modelo_digest=$2 AND corpus_sha256=$3",
    [modelo.nombre, modelo.digest, corpusSha256]);
  if (previa.rowCount === 1) return { ...base, repetida: true, vectores: fragmentos.length };
  const vectores = await modelo.embeddings.embedDocuments(fragmentos.map(textoParaIncrustar));
  for (const v of vectores) if (v.length !== dimensionEsperada)
    throw new ErrorCorpus("DIMENSION_INVALIDA", `${modelo.nombre} devolvió ${v.length} dimensiones; se esperaban ${dimensionEsperada} (EMBEDDING_DIMENSIONS).`);
  return transaccion(pool, async (c) => {
    for (const d of documentos) {
      const r = await c.query<{ sha256: string }>("SELECT sha256 FROM cv.documentos WHERE id=$1", [d.documentoId]);
      if (r.rows[0] && r.rows[0].sha256 !== d.sha256) throw new ErrorCorpus("DOCUMENTO_MODIFICADO", `${d.archivo} cambió respecto a la ingesta anterior.`);
      if (!r.rows[0]) await c.query("INSERT INTO cv.documentos (id,nombre,fuente,sha256,contenido,titulo,vigencia) VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [d.documentoId, d.archivo, `corpus/${d.archivo}`, d.sha256, d.contenido, d.titulo, d.vigencia]);
    }
    let insertados = 0;
    for (const [i, f] of fragmentos.entries()) {
      const m = f.metadata;
      const existente = await c.query<{ sha256: string }>("SELECT sha256 FROM cv.fragmentos WHERE id=$1", [m.fragmentoId]);
      if (existente.rows[0] && existente.rows[0].sha256 !== m.sha256)
        throw new ErrorCorpus("FRAGMENTACION_MODIFICADA", `${m.fragmentoId} difiere de la ingesta anterior; reinicie la base antes de reingerir.`);
      await c.query(`INSERT INTO cv.fragmentos (id,documento_id,seccion,orden,contenido,sha256,posible_instruccion) VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (id) DO NOTHING`, [m.fragmentoId, m.documentoId, m.seccion, m.orden, f.pageContent, m.sha256, m.posibleInstruccion]);
      const r = await c.query(`INSERT INTO cv.vectores (fragmento_id,modelo,modelo_digest,embedding) VALUES ($1,$2,$3,$4::vector)
        ON CONFLICT DO NOTHING`, [m.fragmentoId, modelo.nombre, modelo.digest, literalVector(vectores[i]!)]);
      insertados += r.rowCount ?? 0;
    }
    await c.query("INSERT INTO cv.ingestas_rag VALUES ($1,$2,$3,$4,$5,$6,now())",
      [modelo.nombre, modelo.digest, dimensionEsperada, corpusSha256, documentos.length, fragmentos.length]);
    return { ...base, repetida: false, vectores: insertados };
  });
}

/** Recuperación por similitud coseno sobre los vectores del mismo modelo y digest. */
export class RecuperadorPg implements Recuperador {
  public constructor(private readonly pool: Pool, private readonly modelo: ModeloEmbeddings) {}
  public async buscar(pregunta: string, k: number): Promise<readonly FragmentoRecuperado[]> {
    const vector = await this.modelo.embeddings.embedQuery(pregunta);
    const r = await this.pool.query<{ id: string; documento_id: string; titulo: string; vigencia: string; seccion: string; contenido: string;
      similitud: number; posible_instruccion: boolean }>(
      `SELECT f.id, f.documento_id, d.titulo, d.vigencia, f.seccion, f.contenido, f.posible_instruccion,
        (1 - (v.embedding <=> $1::vector))::float8 AS similitud
       FROM cv.vectores v JOIN cv.fragmentos f ON f.id = v.fragmento_id JOIN cv.documentos d ON d.id = f.documento_id
       WHERE v.modelo = $2 AND v.modelo_digest = $3 ORDER BY v.embedding <=> $1::vector LIMIT $4`,
      [literalVector(vector), this.modelo.nombre, this.modelo.digest, k]);
    return r.rows.map((f) => ({ fragmentoId: f.id, documentoId: f.documento_id, titulo: f.titulo, vigencia: f.vigencia, seccion: f.seccion,
      contenido: f.contenido, similitud: f.similitud, posibleInstruccion: f.posible_instruccion }));
  }
}

/** Bitácora sin texto de preguntas ni respuestas: huella, fuentes, citas y decisiones. */
export class BitacoraRagPg implements BitacoraRag {
  public constructor(private readonly pool: Pool) {}
  public async registrar(r: RegistroConsultaRag): Promise<void> {
    await this.pool.query("INSERT INTO cv.consultas_rag VALUES ($1,now(),$2,$3,$4,$5,$6,$7,$8,$9,$10)", [r.id, r.preguntaSha256, r.clasificacion,
      JSON.stringify(r.fuentes), JSON.stringify(r.citas), r.sinRespaldo, JSON.stringify(r.instruccionesIgnoradas), r.piiOmitida, r.modelo, r.modeloEmbeddings]);
  }
}
