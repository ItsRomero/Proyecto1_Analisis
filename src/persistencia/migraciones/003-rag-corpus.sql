-- Migración 003 (fase 5): metadatos del corpus, registro de ingestas y bitácora de consultas RAG.
-- Sin texto de preguntas ni respuestas: solo huellas, fuentes, citas y decisiones.
ALTER TABLE documentos ADD COLUMN titulo text, ADD COLUMN vigencia text;
ALTER TABLE fragmentos ADD COLUMN sha256 text, ADD COLUMN posible_instruccion boolean NOT NULL DEFAULT false;
CREATE TABLE ingestas_rag (
  modelo text NOT NULL, modelo_digest text NOT NULL, dimension integer NOT NULL CHECK (dimension > 0),
  corpus_sha256 text NOT NULL, documentos integer NOT NULL, fragmentos integer NOT NULL,
  registrado_en timestamptz NOT NULL, PRIMARY KEY (modelo, modelo_digest, corpus_sha256)
);
CREATE TABLE consultas_rag (
  id text PRIMARY KEY, registrado_en timestamptz NOT NULL, pregunta_sha256 text NOT NULL,
  clasificacion text NOT NULL CHECK (clasificacion IN ('NORMATIVA','NUMERICA','MIXTA')),
  fuentes jsonb NOT NULL, citas jsonb NOT NULL, sin_respaldo boolean NOT NULL,
  instrucciones_ignoradas jsonb NOT NULL, pii_omitida integer NOT NULL CHECK (pii_omitida >= 0),
  modelo text, modelo_embeddings text NOT NULL
);
