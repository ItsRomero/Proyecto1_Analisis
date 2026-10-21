-- Migración 002 (fase 4): auditoría de propuestas con proponente, canal y clave de idempotencia.
-- Solo agrega columnas y amplía un CHECK; no hay fórmulas financieras en SQL.
ALTER TABLE propuestas_pago ADD COLUMN canal_proponente text NOT NULL DEFAULT 'INTERFAZ'
  CHECK (canal_proponente IN ('INTERFAZ','MCP'));
ALTER TABLE auditoria_aprobaciones DROP CONSTRAINT auditoria_aprobaciones_tipo_check;
ALTER TABLE auditoria_aprobaciones ADD CONSTRAINT auditoria_aprobaciones_tipo_check
  CHECK (tipo IN ('PAGO','COMITE','DESEMBOLSO','CANCELACION','PROPUESTA'));
ALTER TABLE auditoria_aprobaciones ADD COLUMN proponente text, ADD COLUMN canal_proponente text,
  ADD COLUMN clave_idempotencia text;
