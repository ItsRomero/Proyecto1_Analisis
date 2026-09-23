# Proyecto 2 — validación final

Fecha: 2026-09-21. Rama: `feat/proyecto-2-evolucion-nucleo`.
Base: `entrega-p1` = `8737d9b782772a5cff9acb07de8d719f4f4e3a16`.
Commit de implementación/documentación validado: `958e70f`; este informe se añade después sin cambiar el código probado.

## Instalación y ejecución limpia

Antes de reinstalar, `git diff --exit-code` y `git diff --cached --exit-code` no mostraron cambios en archivos versionados. El documento de encargo `(2).md` permanece como archivo del usuario sin seguimiento. `npm ci` reconstruyó las dependencias desde el lockfile; no se reutilizó una instalación como sustituto de esa comprobación.

En este Windows, PowerShell bloquea `npm.ps1`. Se ejecutó `npm.cmd`, sin cambiar la política de ejecución. Node necesitó las raíces de confianza de Windows exportadas temporalmente, como se documenta en la auditoría. Se mantuvo TLS y se utilizó la caché local ya ignorada por Git:

```powershell
$env:NODE_EXTRA_CA_CERTS = Join-Path $env:TEMP 'proyecto2-trusted-roots.pem'
npm.cmd ci --cache .npm-cache --fetch-retries=0
npm.cmd test
npm.cmd run typecheck --if-present
```

El archivo PEM temporal contiene certificados públicos del almacén de confianza del equipo, no claves privadas; no forma parte del repositorio. En un entorno con certificados correctamente configurados bastan los comandos `npm ci`, `npm test` y `npm run typecheck --if-present` del encargo.

| Comprobación | Resultado observado |
|---|---|
| Instalación desde lockfile | Salida 0, 51 paquetes instalados y 52 auditados; npm reportó 0 vulnerabilidades |
| Suite completa tras instalar | **18 archivos y 263 pruebas aprobadas**, salida 0 |
| TypeScript | `tsc --noEmit`, salida 0 |
| Diez archivos de pruebas P1 | Comparados contra `entrega-p1`, ninguno alterado |
| Suite P1 | Sus 206 pruebas forman parte de la suite aprobada; 57 pruebas nuevas |
| Configuración/dependencias | `package.json`, `package-lock.json` y `tsconfig.json` sin diff contra P1 |
| `strict: true` | Conservado |
| `any` en src | `rg -n '\bany\b' src`: sin coincidencias |
| Lectura implícita del reloj | `rg -n 'new Date\(\)' src`: sin coincidencias; el `new Date(0)` histórico valida una fecha civil explícita |
| Tasas y límites del motor nuevo | Configuración versionada fuera del motor; selección por otorgamiento en catálogo |
| Redondeo | Detalles decimales sin redondear y un `Dinero` final por cuota; prueba día 100 distingue Q50.80 de Q50.81 |
| OpenAPI | YAML parseable, referencias locales resueltas, 14 operaciones conservadas y nuevos objetos comparados estructuralmente con Zod |
| RFC 9457 / ErrorApi | Contrato P1 y pruebas originales conservados |
| Diff de dominio | 10 archivos nuevos, 2 modificados, 381 líneas añadidas, 21 eliminadas, **360 netas** |
| Git | La rama `feat/proyecto-2-evolucion-nucleo` se integró a `main` con el PR #1 (merge `183dc71`). La etiqueta `entrega-p1` debe publicarse en GitHub con `git push origin entrega-p1` para que la comparación sea reproducible desde el remoto |

La equivalencia Zod/OpenAPI comprueba estructura, obligatoriedad, patrones y restricciones relevantes de los objetos nuevos. No equivale a ejecutar un validador externo exhaustivo de toda la especificación OpenAPI ni a probar un servidor inexistente.

## Casos e invariantes

| Requisito | Evidencia |
|---|---|
| M-1, M-2, M-3 y M-4 | `politica-mora.test.ts`: Q5.44, Q18.14, Q50.80, Q65.32 |
| Días 121 y 150 | Q65.32 exactos; no aumenta ni desaparece el acumulado |
| M-5 | `gasto-gestion-cobro.test.ts`: pago Q1,047.76; saldos pendientes cero |
| Día 15 sin gasto | Q1,010.06 |
| Plana histórica | Q7.26 a 15 días y Q21.77 a 45 |
| Contrato de tres políticas | `contrato-politica.test.ts`: tipos, moneda, tope, determinismo, inmutabilidad y sustitución |
| Invariantes 1, 2 y 4 | `politica-mora.test.ts`: recorrido 1–120, comparación acotada y plana 18%; congelación posterior |
| Invariante 3 | Contrato común en cuatro capitales, dos monedas y trece atrasos |
| Invariantes 5 y 8 | `regresion-p1.test.ts`: coexistencia y baja incobrable integrada con mora/cartera |
| Invariante 6 | Reejecuciones y cambios de tramo generan solo un gasto por cuota |
| Invariante 7 | Oráculo de cartera y conciliación de porcentajes con tercios |
| CP-04.1 | `credito-cancelacion-p2.test.ts`: ambas guardas, historial y bloqueo de SOLICITADO |
| CP-04.2 | `devengo-interes.test.ts`: día 90 frente a 100, suspenso, regularización única y conflictos |
| CP-04.3 | `cartera-por-tramo.test.ts`: 7.00%, 21.75%, 6.06% y bajas visibles |
| Contratos P2 | `contratos-p2.test.ts`: serialización real y campos opcionales compatibles |

CP-03 es la coexistencia de políticas de la sección 7.6 del enunciado (Q21.77 plana frente a Q18.14 escalonada para la misma cuota a 45 días); se verifica en `politica-mora.test.ts` y `regresion-p1.test.ts`.

## Registro por fases

| Fase | Commit | Resultado al cerrarla |
|---|---|---|
| 0 | `71a5179` | Auditoría, etiqueta/rama y 206 pruebas base |
| 1 | `ec2a436` | Políticas/configuración/catálogo y 220 pruebas |
| 2 | `d3b30f5` | Gasto idempotente y 230 pruebas |
| 3 | `5752b55` | State, devengo, cartera y 248 pruebas |
| 4 | `0d6c1a9` | Contratos de políticas, regresión integrada y 260 pruebas |
| 5 | `958e70f` | Zod/OpenAPI, presentadores, UML, ADR, trazabilidad, informe SOLID y 263 pruebas |
| 6 | Commit que añade este informe | Instalación limpia, 263 pruebas, typecheck e integridad verificados |

Los únicos fallos de compilación intermedios afectaron inferencias de tipos en código/pruebas nuevas, documentados en el informe SOLID. No hubo fallos observados ni reescrituras de pruebas P1.

## Limitaciones reales

- **PlantUML:** Java 11 está disponible, pero no había comando PlantUML ni JAR instalado. Se intentó descargar PlantUML 1.2025.4 de Maven Central al directorio temporal; la conexión falló, incluso al seleccionar TLS 1.2. Se entregan fuentes `.puml` editables revisadas, pero **no se afirma validación sintáctica por PlantUML ni renderizado**. Puede completarse con `java -jar plantuml.jar -checkonly -failfast2 "docs/diagramas/**/*.puml"` cuando esté disponible.
- No hay proveedor ni comando de cobertura instrumentada instalado. Se informa cantidad de pruebas, no un porcentaje de cobertura.
- La fachada estática P1 mantiene la fórmula histórica. El catálogo y las garantías nuevas se usan mediante el motor inyectado o `consultarMora`.
- La clasificación por días no realiza una baja contable sin autorización/evidencia; se conserva State P1. La mora escalonada sí se congela automáticamente en 120.
- Gasto y devengo requieren que el llamador conserve la fotografía resultante. No hay garantía persistente/concurrente ni coordinación transaccional simulada entre State y contabilidad.
- Devengo recibe importes incrementales fechados; no reconstruye por sí solo devengos diarios a partir de un importe agregado. Los cortes retroactivos se rechazan.
- Se conserva la documentación conceptual P1 identificándola como histórica; no se presenta todo ese diseño como implementación.

## Pendiente fuera del repositorio

Estado actualizado el 2026-09-23. Ya están documentados en el repositorio, con validación de campo pendiente: personas y journey map fundamentados en fuentes documentadas ([E1](e1-investigacion-usuario.md)), mapa de navegación, tabla pantalla ↔ caso de uso y wireframes de baja fidelidad ([E2](e2-arquitectura-informacion.md)) y la decisión móvil/web ([E4](e4-decision-movil-web.md)). Siguen pendientes y requieren trabajo del equipo:

- Aplicar los instrumentos de entrevista y observación y actualizar el estado de validación de cada rasgo de las personas.
- Prototipo navegable de alta fidelidad en Figma (E3), su enlace público y capturas de antes/después.
- Implementación de pantallas React/Tailwind, excluida de este encargo del núcleo.
- Evaluación independiente de los cuatro integrantes, ocho hallazgos Nielsen sobre un prototipo real y auditoría visual WCAG de Figma.
- Design review de la Sesión 9, decisiones de pares, nombres/reparto de trabajo y atribuciones verificadas del equipo.
- PDF final `P2_UXUI_NoDeGrupo.pdf`.

Backend, API ejecutable, base de datos, autenticación, despliegue, chat, RAG y MCP también están expresamente fuera de alcance. No se crearon ni se presentan como entregables completados.
