-- Diseño de fase 1; NO es una migración aplicada ni un cargador.
-- PostgreSQL + pgvector. No hay fórmulas financieras en SQL.
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE clientes (
  id text PRIMARY KEY, nombre_completo text NOT NULL, tipo_identificacion text NOT NULL,
  identificacion text NOT NULL, municipio text NOT NULL, telefono text,
  fecha_alta date NOT NULL, UNIQUE (tipo_identificacion, identificacion)
);
CREATE TABLE asesores (id text PRIMARY KEY, nombre text NOT NULL);
CREATE TABLE politicas_versionadas (
  id text PRIMARY KEY, desde date, hasta date, parametros jsonb NOT NULL,
  sha256 text NOT NULL, fuente text NOT NULL
);
CREATE TABLE creditos (
  id text PRIMARY KEY, cliente_id text NOT NULL REFERENCES clientes,
  asesor_id text NOT NULL REFERENCES asesores, politica_id text REFERENCES politicas_versionadas,
  estado text NOT NULL CHECK (estado IN ('SOLICITADO','APROBADO','RECHAZADO','DESEMBOLSADO',
    'VIGENTE','EN_MORA','REESTRUCTURADO','ANULADO','CANCELADO','INCOBRABLE')),
  capital_centavos bigint NOT NULL CHECK (capital_centavos > 0),
  moneda text NOT NULL CHECK (moneda = 'GTQ'), tna_bps integer NOT NULL CHECK (tna_bps >= 0),
  plazo_meses integer NOT NULL CHECK (plazo_meses BETWEEN 3 AND 24),
  fecha_solicitud date NOT NULL, fecha_desembolso date,
  reestructurado boolean NOT NULL, version bigint NOT NULL CHECK (version >= 0)
);
CREATE TABLE transiciones_credito (
  id text PRIMARY KEY, credito_id text NOT NULL REFERENCES creditos,
  estado_anterior text NOT NULL, estado_nuevo text NOT NULL, fecha date NOT NULL,
  sujeto_id text NOT NULL, motivo text NOT NULL, evidencia jsonb NOT NULL
);
CREATE TABLE cuotas (
  credito_id text NOT NULL REFERENCES creditos, numero integer NOT NULL CHECK (numero BETWEEN 1 AND 24),
  vencimiento date NOT NULL, capital_centavos bigint NOT NULL CHECK (capital_centavos >= 0),
  interes_centavos bigint NOT NULL CHECK (interes_centavos >= 0),
  importe_centavos bigint NOT NULL CHECK (importe_centavos >= 0),
  saldo_posterior_centavos bigint NOT NULL CHECK (saldo_posterior_centavos >= 0),
  PRIMARY KEY (credito_id, numero)
);
CREATE TABLE bitacora_eventos (
  paquete_sha256 text NOT NULL, seq integer NOT NULL, tipo text NOT NULL,
  contenido_original jsonb NOT NULL, sha256_evento text NOT NULL,
  estado text NOT NULL CHECK (estado IN ('APLICADO','DUPLICADO')),
  PRIMARY KEY (paquete_sha256, seq)
);
-- contenido_original puede contener PII: acceso exclusivo del cargador/auditor, nunca RAG o LLM.
CREATE TABLE bajas_incobrables (
  credito_id text PRIMARY KEY REFERENCES creditos, fecha date NOT NULL,
  saldo_centavos bigint NOT NULL CHECK (saldo_centavos >= 0),
  autorizado_por text NOT NULL, evidencia jsonb NOT NULL, paquete_sha256 text NOT NULL
);
CREATE TABLE propuestas_pago (
  id text PRIMARY KEY, credito_id text NOT NULL, numero_cuota integer NOT NULL,
  sujeto_proponente text NOT NULL, sesion_id text NOT NULL, fecha_operacion date NOT NULL,
  clave_idempotencia text NOT NULL, huella text NOT NULL, version_credito bigint NOT NULL,
  importe_centavos bigint NOT NULL CHECK (importe_centavos > 0),
  estado text NOT NULL CHECK (estado IN ('PENDIENTE','CONFIRMADA','CANCELADA','OBSOLETA')),
  desglose_snapshot jsonb NOT NULL, estado_previsto text NOT NULL,
  FOREIGN KEY (credito_id, numero_cuota) REFERENCES cuotas
);
CREATE TABLE auditoria_aprobaciones (
  id text PRIMARY KEY, propuesta_id text REFERENCES propuestas_pago,
  credito_id text NOT NULL REFERENCES creditos, sujeto_id text NOT NULL, sesion_id text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('PAGO','COMITE','DESEMBOLSO','CANCELACION')),
  fecha_operacion date NOT NULL, registrado_en timestamptz NOT NULL,
  resultado text NOT NULL, version_credito bigint NOT NULL, trace_id text NOT NULL
);
CREATE TABLE pagos (
  id text PRIMARY KEY, credito_id text NOT NULL, numero_cuota integer NOT NULL,
  clave_idempotencia text NOT NULL, huella text NOT NULL, fecha date NOT NULL,
  importe_centavos bigint NOT NULL CHECK (importe_centavos > 0),
  usuario_proceso text NOT NULL, canal text NOT NULL,
  propuesta_id text REFERENCES propuestas_pago, aprobacion_id text REFERENCES auditoria_aprobaciones,
  FOREIGN KEY (credito_id, numero_cuota) REFERENCES cuotas,
  UNIQUE (credito_id, clave_idempotencia)
);
CREATE TABLE aplicaciones_pago (
  pago_id text NOT NULL REFERENCES pagos,
  concepto text NOT NULL CHECK (concepto IN ('GASTOS','MORATORIO','CORRIENTE','CAPITAL','EXCEDENTE')),
  centavos bigint NOT NULL CHECK (centavos >= 0), PRIMARY KEY (pago_id, concepto)
);
CREATE TABLE claves_idempotencia (
  credito_id text NOT NULL REFERENCES creditos, clave text NOT NULL,
  huella text NOT NULL, pago_id text NOT NULL UNIQUE REFERENCES pagos,
  respuesta_snapshot jsonb NOT NULL, conservar_hasta date NOT NULL,
  PRIMARY KEY (credito_id, clave)
);
CREATE TABLE gastos_gestion (
  credito_id text NOT NULL, numero_cuota integer NOT NULL, concepto text NOT NULL CHECK (concepto = 'GESTION_COBRO'),
  fecha_generacion date NOT NULL, importe_centavos bigint NOT NULL CHECK (importe_centavos >= 0),
  PRIMARY KEY (credito_id, numero_cuota, concepto), FOREIGN KEY (credito_id, numero_cuota) REFERENCES cuotas
);
CREATE TABLE cierres (
  id text PRIMARY KEY, tipo text NOT NULL CHECK (tipo IN ('DIARIO','MENSUAL')),
  inicio_periodo date NOT NULL, fecha_corte date NOT NULL,
  version_cartera bigint NOT NULL, snapshot_nucleo jsonb NOT NULL,
  generado_por text NOT NULL, UNIQUE (tipo, inicio_periodo, fecha_corte)
);
CREATE TABLE documentos (
  id text PRIMARY KEY, nombre text NOT NULL, fuente text NOT NULL, sha256 text NOT NULL,
  contenido text NOT NULL, UNIQUE (fuente, sha256)
);
CREATE TABLE fragmentos (
  id text PRIMARY KEY, documento_id text NOT NULL REFERENCES documentos,
  seccion text NOT NULL, orden integer NOT NULL, contenido text NOT NULL,
  UNIQUE (documento_id, orden)
);
CREATE TABLE vectores (
  fragmento_id text NOT NULL REFERENCES fragmentos, modelo text NOT NULL,
  modelo_digest text NOT NULL, embedding vector(1024) NOT NULL,
  PRIMARY KEY (fragmento_id, modelo, modelo_digest)
);
-- Sesiones solo en memoria. Reiniciar o expirar sesión invalida propuestas pendientes.
-- No usar triggers para calcular mora, cuotas, cierres o saldos.
-- BIGINT se lee como string/BigInt; nunca convertir dinero de DB a number.
