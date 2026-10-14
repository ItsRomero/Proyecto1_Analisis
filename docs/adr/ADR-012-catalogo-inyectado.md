# ADR-012: D-4: políticas versionadas e inyección

Estado: aceptado como diseño de fase 1. Fecha: 2026-10-13.

## Contexto

El catálogo actual usa constantes y decide vigencia en código; la fuente operativa debe ser politicas.json.

## Decisión

Validar el JSON con Zod en contratos y cargar catálogo/políticas versionadas por hash. El servicio selecciona por fecha de otorgamiento. Agregar fábrica o puntos de inyección retrocompatibles en fase 2; conservar defaults de pruebas P2. Comparar JSON con defaults al arrancar, prevalece JSON y se informa divergencia. Si un parámetro no está soportado por el motor, fallar explícitamente en lugar de aplicar una fórmula distinta silenciosamente.

## Alternativas

No copiar políticas dentro de API/MCP o SQL; no modificar el paquete ni cambiar reglas existentes para ajustar expectativas.

## Consecuencias y límites

Las instancias ya otorgadas conservan su política/versionado. Se inyectan tasas/tramos/base/umbrales y alcance de gasto; no basta cambiar un ID. Cambios de parámetros necesitan prueba de contrato del motor.

## Validación

Fase 2: vigencia 30/09 y 01/10, configuración alterada controladamente en tests y suite heredada intacta.
