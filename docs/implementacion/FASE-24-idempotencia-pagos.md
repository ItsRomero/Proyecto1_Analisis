# Fase 24 — Idempotencia de pagos

## 1. Objetivo

Garantizar que reintentar exactamente el mismo registro de pago no cobre, aplique, identifique ni conserve el efecto una segunda vez, y que reutilizar la identidad con contenido distinto produzca un conflicto explícito.

## 2. Artefactos

| Archivo | Responsabilidad |
|---|---|
| `src/dominio/pago-idempotente.ts` | Clave, huella, pago registrado y errores de dominio. |
| `src/aplicacion/registrar-pago.ts` | Caso de uso y puertos de repositorio/generador de IDs. |
| `tests/pago-idempotencia.test.ts` | Creación, replay, conflicto, alcance y validación. |
| `src/contratos/esquemas.ts` | Esquema Zod de `Idempotency-Key`. |
| `docs/api/openapi.yaml` | Header obligatorio y respuestas HTTP. |

No se agregó servidor ni repositorio persistente. El repositorio en memoria existe solo como doble de prueba y respeta el contrato del puerto.

## 3. Alcance de la identidad

DP-05 se resuelve con el alcance compuesto:

`registrar-pago + creditoId + Idempotency-Key`

La misma clave puede utilizarse en otro crédito sin colisión. Dentro del mismo crédito identifica un único intento lógico. `Idempotency-Key` admite de 1 a 255 caracteres ASCII visibles, sin espacios ni Unicode ambiguo.

## 4. Huella del request

La huella canónica incluye exclusivamente datos originales de la operación:

- `creditoId` de la ruta;
- importe decimal exacto;
- moneda;
- fecha del pago;
- usuario o proceso.

No incluye saldos exigibles, estado calculado ni otros datos derivados que pueden cambiar entre reintentos. Esto permite reconocer el mismo comando aunque la cartera haya evolucionado después del primer resultado.

## 5. Flujo

1. Validar y construir `ClaveIdempotencia`.
2. Construir `HuellaSolicitudPago` determinista.
3. Pedir al puerto `RepositorioPagosIdempotentes.ejecutarUnaVez` el resultado dentro del alcance.
4. Si no existe, ejecutar la fábrica una vez: generar ID, aplicar Chain/Strategy y conservar `PagoRegistrado`.
5. Si existe y la huella coincide, devolver el pago previo con `repetido = true`.
6. Si existe y la huella difiere, lanzar `ConflictoIdempotencia` sin invocar la fábrica ni reemplazar datos.

El puerto agrupa consulta y creación en una sola operación para que una implementación persistente futura pueda garantizar atomicidad mediante restricción única y transacción.

## 6. Contrato HTTP

`POST /creditos/{creditoId}/pagos` requiere:

```http
Idempotency-Key: pago-2026-0001
```

| Código | Significado | Header de respuesta |
|---:|---|---|
| 201 | Pago nuevo creado y aplicado | `Idempotency-Replayed: false` |
| 200 | Replay idéntico; retorna el resultado previo | `Idempotency-Replayed: true` |
| 409 | Misma clave y contenido diferente | ErrorApi uniforme |

La representación `Pago` conserva también `idempotencyKey` para auditoría contractual.

## 7. Invariantes

- INV-08: dos ejecuciones con clave y entrada iguales producen un solo pago.
- El generador de IDs se invoca una sola vez.
- La prelación y sus efectos se crean una sola vez.
- Un conflicto no reemplaza ni modifica el primer pago.
- La comparación usa toda la entrada contractual relevante.
- El resultado previamente conservado se retorna por identidad, no se recalcula.

## 8. Verificación

| Control | Resultado |
|---|---|
| Primer intento nuevo | Aprobado |
| Replay devuelve mismo pago | Aprobado |
| Un solo ID/registro | Aprobado |
| Contenido distinto da conflicto | Aprobado |
| Conflicto sin reemplazo | Aprobado |
| Alcance separado por crédito | Aprobado |
| Claves inválidas | Rechazadas |
| Header OpenAPI obligatorio | Aprobado |
| Respuestas 200/201/409 | Aprobadas |
| Zod | Aprobado |
| TypeScript estricto | Aprobado |
| Suite completa | 10 archivos, 205 pruebas aprobadas |

## 9. Alcance pendiente

- La implementación persistente deberá imponer unicidad atómica por `(creditoId, idempotencyKey)`.
- Los movimientos contables futuros conservarán la misma identidad idempotente.
- INV-17, idempotencia de cierres, continúa separado porque requiere el módulo de cierres.

## 10. Resultado

RF-10 e INV-08 quedan implementados y verificados. RNF-07 queda cubierto para pagos; la idempotencia de cierres permanece trazada por separado.
