// Tras compilar TypeScript en dist/auditoria: node scripts/contratos/generar-openapi.mjs
import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import { operacionesFinales, problemaFinalSchema, codigosProblemaFinal, politicasPaqueteSchema } from '../../dist/auditoria/src/contratos/proyecto-final.js';
import { rutasFinales, herramientasFinales } from '../../dist/auditoria/src/contratos/rutas-proyecto-final.js';

const schemas = { ProblemaFinal: z.toJSONSchema(problemaFinalSchema), PoliticasPaquete: z.toJSONSchema(politicasPaqueteSchema) };
const paths = {};
const ref = name => ({ $ref: `#/components/schemas/${name}` });
for (const [nombre, contrato] of Object.entries(operacionesFinales)) {
  const ruta = rutasFinales[nombre];
  const input = z.toJSONSchema(contrato.entrada);
  const output = z.toJSONSchema(contrato.salida);
  schemas[`${nombre}Entrada`] = input;
  schemas[`${nombre}Salida`] = output;
  const pathParams = [...ruta.ruta.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
  const parameters = pathParams.map(name => ({ name, in: 'path', required: true, schema: input.properties[name] }));
  const respuestas = {
    '200': { description: 'Resultado o repetición sin efectos adicionales', content: { 'application/json': { schema: ref(`${nombre}Salida`) } } },
  };
  if (ruta.metodo === 'post' && ['altaCliente', 'solicitarCredito', 'proponerPago', 'confirmarPago', 'generarCierre'].includes(nombre)) {
    respuestas['201'] = { description: 'Primera creación', content: { 'application/json': { schema: ref(`${nombre}Salida`) } } };
  }
  for (const status of new Set([...Object.values(codigosProblemaFinal), 500])) respuestas[String(status)] = {
    description: 'Error RFC 9457; MONTO_NO_EXACTO incluye montoCorrecto',
    content: { 'application/problem+json': { schema: ref('ProblemaFinal') } },
  };
  const op = { operationId: nombre, summary: ruta.resumen, parameters, responses: respuestas,
    'x-confirmacion-humana': ruta.humana, 'x-perfil-gerencia': ruta.gerencia ?? false };
  if (ruta.metodo === 'get') {
    for (const [name, schema] of Object.entries(input.properties)) if (!pathParams.includes(name)) {
      parameters.push({ name, in: 'query', required: input.required?.includes(name) ?? false, schema });
    }
  } else {
    const props = Object.fromEntries(Object.entries(input.properties).filter(([name]) => !pathParams.includes(name)));
    op.requestBody = { required: true, content: { 'application/json': { schema: {
      ...input, properties: props, required: (input.required ?? []).filter(name => !pathParams.includes(name)),
    } } } };
  }
  if (nombre === 'confirmarPago') {
    parameters.push({ name: 'Idempotency-Key', in: 'header', required: true, schema: { type: 'string', minLength: 1, maxLength: 255 },
      description: 'Debe coincidir con la propuesta; retención mínima 30 días y unicidad del pago permanente.' });
    for (const status of ['200', '201']) respuestas[status].headers = {
      'Idempotency-Replayed': { required: true, schema: { type: 'boolean' }, description: status === '200' ? 'true: pago ya aplicado' : 'false: primer registro' },
    };
    op.description = 'Solo interfaz con sesión y evento humano verificados por servidor. Replay válido se resuelve antes de revalidar cuota o versión; mismo contenido devuelve pago original. Contenido distinto: 409. No existe herramienta MCP de confirmación.';
  }
  (paths[ruta.ruta] ??= {})[ruta.metodo] = op;
}
const document = { openapi: '3.1.0', info: { title: 'Proyecto Final — extensión contractual P1/P2', version: '2.0.0',
  description: 'Diseño de fase 1. No acredita servidor desplegado. Esquemas generados desde Zod; fechas civiles validadas en runtime y por el dominio.' },
  servers: [{ url: 'http://localhost:3000/v1' }], paths, security: [{ sesionDemo: [] }],
  components: { schemas, securitySchemes: { sesionDemo: { type: 'apiKey', in: 'cookie', name: 'cv_session',
    description: 'Sesión de demostración controlada por servidor; no es identidad aportada por el LLM.' } } },
  'x-herramientas-mcp': herramientasFinales,
  'x-codigos-problema': codigosProblemaFinal,
};
writeFileSync('docs/api/openapi-proyecto-final.json', JSON.stringify(document, null, 2) + '\n');
console.log(`OpenAPI generado: ${Object.keys(operacionesFinales).length} operaciones y ${Object.keys(herramientasFinales).length} herramientas.`);
