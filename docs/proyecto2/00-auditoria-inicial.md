# Proyecto 2 — Fase 0: auditoría inicial

Fecha de auditoría: 2026-09-21. Esta fecha documenta la ejecución; no es una fecha financiera implícita.

## Línea base Git

- Origen local verificado: `git@github.com:ItsRomero/Proyecto1_Analisis.git`.
- `main`, `origin/main` y el HEAD inicial local: `8737d9b782772a5cff9acb07de8d719f4f4e3a16`.
- `origin/HEAD` apunta a `origin/main`. No se realizó fetch: se verifica la copia local, no la actualidad del remoto.
- La etiqueta `entrega-p1` no existía; se creó sobre ese commit, sin mover etiquetas ni reescribir historia.
- Rama creada: `feat/proyecto-2-evolucion-nucleo`.
- El único archivo inicialmente sin seguimiento era `Prompt_Proyecto_2_Evolucion_Repositorio (1).md`; se conserva fuera de los commits de implementación.
- No se usa como base el antiguo repositorio `cherreragt/proyecto_analisis2`. La identidad Git local configurada no determina el origen del repositorio.

## Inspección y resultados iniciales

Se inspeccionaron README, package.json, tsconfig.json, los archivos de dominio, el caso de uso de pagos, los esquemas Zod, pruebas de mora/cartera/State, ADR, matriz de trazabilidad y diagramas de clases y State. Se inventariaron `src/`, `tests/` y `docs/`.

Los siete archivos originales de `src/dominio/` son:

1. `calculadora-mora.ts`
2. `cartera.ts`
3. `credito-estado.ts`
4. `dinero.ts`
5. `pago-idempotente.ts`
6. `plan-amortizacion.ts`
7. `prelacion-pago.ts`

Entorno observado: Node.js v22.13.0, npm 10.9.2, Vitest 4.1.11 instalado desde el lockfile. TypeScript conserva `strict: true` y comprobaciones adicionales estrictas. Dependencias productivas: date-fns, decimal.js y zod; no hay servidor, base de datos ni UI.

| Comando | Resultado |
|---|---|
| `npm ci` | PowerShell bloqueó el envoltorio `npm.ps1`; se utilizó `npm.cmd`. |
| `npm.cmd ci` | Primer intento afectado por cadena de certificados no reconocida por Node; no completó instalación. |
| `npm.cmd ci --cache .npm-cache --fetch-retries=0` | Correcto: 51 paquetes instalados, 52 auditados, 0 vulnerabilidades reportadas. |
| `npm.cmd test` | Correcto: 10 archivos, 206 pruebas aprobadas. |
| `npm.cmd run typecheck --if-present` | Correcto: `tsc --noEmit`, salida 0. |

Para la instalación exitosa se exportaron certificados públicos del almacén de raíces de confianza de Windows a un archivo temporal y se indicó su ruta mediante `NODE_EXTRA_CA_CERTS` en el proceso. Se mantuvo la verificación TLS. La caché local `.npm-cache/` ya está excluida por `.gitignore`; evita escribir en la caché global restringida. No se cambiaron configuraciones permanentes del equipo ni dependencias.

## Impacto previsto y compatibilidad

- `CalculadoraMora` recibe `TasaNominalAnualMoratoria` directamente. La introducción de Strategy requiere una extensión explícita y una fachada compatible; no se puede declarar que el motor quedó intacto antes de evaluar el diff.
- `Dinero` redondea al construirse: los resultados parciales de los tramos deben permanecer en decimal hasta materializar el total monetario de la cuota.
- `CalculadoraCarteraRiesgo` incluye en riesgo atrasos mayores de 30 días o créditos reestructurados. Los créditos declarados INCOBRABLE salen de activa; superar 120 días no equivale por sí solo a declarar ese estado.
- El ejemplo P1 de cartera usa una fotografía agregada distinta del desglose P2. La extensión debe conservar sus resultados y distinguir contribución al riesgo de saldo de todos los créditos en mora.
- El State recibe booleanos para la cancelación; P2 requiere una entrada monetaria comprobable y preservar la fachada pública existente.
- El booleano de devengo no cuantifica interés suspendido. Se necesita un modelo separado con cortes explícitos y tratamiento de repetición.
- La prelación ya establece gastos → moratorio → corriente → capital; no debe reordenarse.
- La idempotencia de pagos existente no cubre gastos por crédito/cuota/concepto.
- Zod expone detalle de mora y respuesta de cartera. Cualquier extensión deberá mantener coherencia con OpenAPI y con las pruebas originales de contrato.
- La matriz y algunos diagramas combinan diseño conceptual y estado histórico P1: la documentación P2 debe distinguir implementación real y propuestas futuras.

## Contradicción inicial y resolución

El invariante 2 pide que la mora escalonada sea menor o igual a la retroactiva del tramo actual sin delimitar días. La política retroactiva debe aplicar la tasa actual a todos los días y el tramo posterior a 120 tiene tasa 0 %. Por tanto, al día 121:

- escalonada acumulada: Q65.32 (conserva lo acumulado a 120 días);
- retroactiva literal: Q0.00;
- `65.32 <= 0.00` es falso.

Se consultó al usuario si la comparación debe limitarse a los días 0–120, verificando por separado la congelación de la escalonada desde el día 121, o si desea redefinir la retroactiva. No se ha supuesto una respuesta ni alterado el dominio para ocultar la contradicción.

La sección «Forma de trabajo» del encargo indica: «Detente ante una contradicción que cambie materialmente el dominio o requiera inventar información». La ejecución inicial se detuvo sin modificar código ni pruebas. El usuario aportó después `Prompt_Proyecto_2_Evolucion_Repositorio (2).md` y ordenó continuar: limita expresamente la comparación a 1–120 y exige conservar Q65.32 desde el día 121. Se reanudan las fases con esa versión; la base Git y las 206 pruebas originales siguen siendo las mismas.

## Pendiente fuera del repositorio

No se realizaron entrevistas, observación, investigación humana, personas o journey maps; wireframes, mockups, prototipo o enlaces Figma; capturas de antes/después; pantallas React/Tailwind; evaluación independiente de cuatro integrantes; hallazgos Nielsen sobre prototipos; auditoría visual WCAG; design review de sesión 9; atribuciones de integrantes sin evidencia; ni el PDF `P2_UXUI_NoDeGrupo.pdf`. Requieren trabajo humano, Figma o datos reales del equipo.

Backend, API ejecutable, base de datos, autenticación, despliegue, chat, RAG y MCP permanecen fuera del alcance técnico de este encargo.
