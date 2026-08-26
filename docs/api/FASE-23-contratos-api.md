# Fase 23 — E5 Contratos API

## 1. Objetivo

Diseñar contratos HTTP interoperables para las capacidades principales sin implementar servidor, controladores, persistencia ni autenticacion. OpenAPI describe la interfaz futura y Zod proporciona los esquemas ejecutables equivalentes.

## 2. Artefactos

| Archivo | Proposito |
|---|---|
| `docs/api/openapi.yaml` | Contrato OpenAPI 3.1.0. |
| `src/contratos/esquemas.ts` | Esquemas Zod y tipos inferidos. |
| `tests/contratos-api.test.ts` | Limites, dinero como cadena, uniones y errores. |
| `tests/openapi.test.ts` | Parseo YAML, referencias, operaciones y estructura. |

El paquete `yaml` se añadio unicamente como dependencia de desarrollo para validar el documento. No existe servidor.

## 3. Operaciones

| Metodo | Ruta | Proposito | Exito | Errores |
|---|---|---|---|---|
| POST | `/clientes` | Registrar identidad unica | 201 | 400, 409, 422 |
| GET | `/clientes/{clienteId}` | Consultar cliente | 200 | 400, 404 |
| POST | `/solicitudes` | Crear solicitud valida | 201 | 400, 404, 422 |
| GET | `/solicitudes/{solicitudId}` | Consultar solicitud | 200 | 400, 404 |
| POST | `/solicitudes/{solicitudId}/decision` | Aprobar o rechazar | 200 | 400, 404, 409, 422 |
| POST | `/creditos/{creditoId}/desembolso` | Desembolsar y activar | 200 | 400, 404, 409, 422 |
| GET | `/creditos/{creditoId}` | Consultar saldo, plan e historial | 200 | 400, 404 |
| POST | `/creditos/{creditoId}/pagos` | Registrar y aplicar pago | 201 | 400, 404, 409, 422 |
| GET | `/creditos/{creditoId}/pagos` | Listar pagos | 200 | 400, 404 |
| GET | `/creditos/{creditoId}/mora` | Calcular mora por cuota | 200 | 400, 404, 422 |
| POST | `/cierres/diarios` | Solicitar cierre diario | 201 | 400, 409, 422 |
| POST | `/cierres/mensuales` | Solicitar cierre mensual | 201 | 400, 409, 422 |
| GET | `/cierres/{cierreId}` | Consultar cierre | 200 | 400, 404 |
| GET | `/cartera-riesgo` | Consultar razon a fecha de corte | 200 | 400, 422 |

Cada operacion define proposito, parametros, request cuando corresponde, response de exito, errores y codigos HTTP dentro de OpenAPI.

## 4. Decisiones contractuales

### 4.1 Dinero y tasas

Los importes se exponen como `{ importe: string, moneda: string }`. Tasas, razones y porcentajes tambien son cadenas decimales. JSON `number` se rechaza para evitar perdida de exactitud entre clientes y lenguajes.

Las solicitudes restringen GTQ, Q1,000.00-Q25,000.00 y 3-24 meses. Los pagos deben ser mayores que Q0.00.

### 4.2 Fechas e identidad

Las fechas financieras son fechas civiles `AAAA-MM-DD`. Mora y cartera requieren `fechaCorte` explicita. DP-01 se resuelve con `IdentificadorLegal { tipo, valor }`: admite DPI u otro identificador institucional sin inventar un catalogo unico.

### 4.3 Estados, tramos y cartera

`EstadoCredito` contiene los diez estados del ciclo. `TramoMora` permanece separado como clasificacion derivada. `CarteraRiesgo` es una union discriminada entre `CON_RAZON` y `SIN_CARTERA_ACTIVA`; la segunda forma no contiene razon y evita `NaN`, infinito o un 0% artificial.

## 5. Error uniforme

Todas las respuestas reutilizables usan `application/problem+json`:

```json
{
  "codigo": "SOLICITUD_INVALIDA",
  "mensaje": "La solicitud no cumple las reglas.",
  "detalles": [{ "campo": "monto.importe", "razon": "Fuera de rango." }],
  "traceId": "traza-001"
}
```

- `400`: sintaxis o parametros mal formados;
- `404`: recurso inexistente;
- `409`: unicidad, repeticion o estado incompatible;
- `422`: entrada bien formada que incumple una regla de negocio.

## 6. Correspondencia OpenAPI ↔ Zod

| OpenAPI | Zod |
|---|---|
| `Dinero`, `Importe`, `Tasa` | `dineroSchema`, `importeSchema`, `tasaSchema` |
| `CrearCliente`, `Cliente` | `crearClienteSchema`, `clienteSchema` |
| `CrearSolicitud`, `SolicitudCredito` | `crearSolicitudSchema`, `solicitudSchema` |
| `DecidirSolicitud` | `decidirSolicitudSchema` |
| `Credito`, `Cuota`, `TransicionEstado` | `creditoSchema`, `cuotaApiSchema`, `transicionEstadoSchema` |
| `RegistrarPago`, `Pago` | `registrarPagoSchema`, `pagoSchema` |
| `ConsultaMora`, `MoraCuota` | `consultaMoraSchema`, `moraCuotaSchema` |
| `CarteraRiesgo` | `carteraRiesgoSchema` |
| `GenerarCierre`, `Cierre` | `generarCierreSchema`, `cierreSchema` |
| `ErrorApi` | `errorApiSchema` |

Los objetos de entrada Zod son estrictos y los tipos externos se derivan mediante `z.infer`.

## 7. Idempotencia

La fase 24 amplio el contrato: `Idempotency-Key` es obligatorio al registrar pagos; OpenAPI diferencia creacion, replay y conflicto. La decision completa esta documentada en `docs/implementacion/FASE-24-idempotencia-pagos.md`.

## 8. Validacion

| Control | Resultado |
|---|---|
| YAML parseable / OpenAPI | 3.1.0 aprobado |
| Operaciones / IDs unicos | 14 / aprobados |
| Referencias locales | Todas resueltas |
| Proposito y responses | Aprobado |
| Error uniforme y Zod | Aprobados |
| TypeScript estricto | Aprobado |
| Suite completa | 9 archivos, 194 pruebas aprobadas |
| Servidor implementado | No |

## 9. Resultado

E5 queda diseñado como contrato independiente del canal. Todos los recursos exigidos disponen de metodo, ruta, proposito, parametros, entrada, salida, errores y codigos HTTP, con representacion exacta verificable desde Zod.
