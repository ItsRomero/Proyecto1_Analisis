# Sistema de Gestión de Microcrédito — Proyecto 1

Núcleo de dominio para la gestión de microcréditos de **Crédito Vecino, S. A.**, acompañado por requisitos trazables, modelos arquitectónicos, diagramas editables, contratos API y pruebas automatizadas.

## 1. Descripción

Este repositorio modela las reglas críticas de un sistema de microcrédito: representación exacta del dinero, generación de planes de amortización, cálculo de mora, aplicación de pagos, estados del crédito, idempotencia y cartera en riesgo.

El proyecto prioriza exactitud financiera, auditabilidad e independencia de infraestructura. Los importes no se procesan con punto flotante binario y las reglas del negocio pueden probarse sin una base de datos, un servidor HTTP ni servicios externos.

## 2. Objetivo

Diseñar y validar un núcleo de microcrédito mantenible que:

- preserve las invariantes monetarias y contables;
- haga explícitas las políticas financieras;
- permita sustituir canales e infraestructura mediante puertos y adaptadores;
- mantenga trazabilidad desde requisitos hasta código y pruebas;
- sirva como base para futuras etapas de implementación.

## 3. Alcance de P1

P1 incluye:

- análisis del dominio, requisitos, reglas, políticas e invariantes;
- Arquitectura Hexagonal organizada como Monolito Modular;
- modelos UML, C4 y 4+1 en PlantUML editable;
- objeto de valor `Dinero` con precisión decimal exacta;
- plan de amortización francés con ajuste final;
- mora simple por cuota bajo convención Actual/360;
- prelación de pagos mediante Chain of Responsibility y tratamiento de excedentes mediante Strategy;
- ciclo de estados del crédito mediante State;
- cálculo de cartera en riesgo y exclusión de créditos incobrables;
- registro idempotente de pagos en el caso de uso implementado;
- contratos OpenAPI 3.1 y esquemas Zod para las capacidades principales;
- pruebas unitarias, contractuales y transversales de invariantes.

## 4. Arquitectura

La solución adopta **Arquitectura Hexagonal + Monolito Modular**:

```text
Canales y adaptadores futuros
            │
            ▼
   Casos de uso / aplicación
            │
            ▼
       Núcleo de dominio
            ▲
            │
 Puertos implementados por infraestructura futura
```

Las dependencias apuntan hacia el núcleo. El dominio contiene las decisiones del negocio; aplicación coordina los casos de uso; contratos valida representaciones externas. La arquitectura completa está documentada en [`docs/arquitectura/FASE-06-arquitectura-hexagonal-monolito-modular.md`](docs/arquitectura/FASE-06-arquitectura-hexagonal-monolito-modular.md).

## 5. Stack tecnológico

| Tecnología | Uso |
|---|---|
| Node.js 20 o superior | Entorno de ejecución. |
| TypeScript, modo estricto | Implementación y verificación estática. |
| Vitest | Pruebas automatizadas. |
| `decimal.js` | Aritmética decimal exacta encapsulada por el dominio. |
| `date-fns` | Operaciones de fechas controladas. |
| Zod | Contratos ejecutables y validación de datos. |
| OpenAPI 3.1 / YAML | Especificación de la interfaz HTTP futura. |
| PlantUML | Diagramas textuales editables. |

## 6. Estructura de carpetas

```text
proyecto-analisis2/
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── aplicacion/        # Orquestación de casos de uso
│   ├── contratos/         # Esquemas Zod y tipos externos
│   └── dominio/           # Reglas, objetos de valor y políticas
├── tests/                 # Suite automatizada
└── docs/
    ├── adr/               # Decisiones arquitectónicas
    ├── analisis/          # Requisitos y reglas
    ├── api/               # OpenAPI y contratos
    ├── arquitectura/      # Arquitectura y atributos de calidad
    ├── configuracion/     # Configuración técnica
    ├── diagramas/         # Fuentes PlantUML editables
    ├── diseno/            # Principios y patrones
    ├── implementacion/    # Evidencia por fase
    └── trazabilidad/      # Matriz integral
```

El inventario detallado se encuentra en [`docs/arquitectura/FASE-26-estructura-repositorio.md`](docs/arquitectura/FASE-26-estructura-repositorio.md).

## 7. Instalación

### Requisitos previos

- Node.js `>=20.0.0`.
- npm compatible con la versión instalada de Node.js.

Desde la raíz del repositorio:

```bash
npm install
```

El archivo `package-lock.json` fija las versiones resueltas. En integración continua puede utilizarse `npm ci` para una instalación limpia y reproducible.

## 8. Ejecución

P1 entrega un núcleo de dominio, no un servidor ni una aplicación de línea de comandos. Su ejecución observable se realiza mediante la suite y la verificación estática:

```bash
npm run verify
```

Comandos disponibles:

| Comando | Resultado |
|---|---|
| `npm run typecheck` | Comprueba TypeScript sin emitir archivos. |
| `npm test` | Ejecuta una vez toda la suite. |
| `npm run test:watch` | Ejecuta Vitest en modo interactivo. |
| `npm run verify` | Ejecuta tipos y pruebas en secuencia. |

## 9. Pruebas

La suite contiene pruebas de:

- exactitud, redondeo, moneda e inmutabilidad de `Dinero`;
- amortización francesa, tasa cero y ajuste de última cuota;
- mora, fechas límite y cálculo independiente por cuota;
- prelación, pagos parciales y estrategias para excedentes;
- transiciones y guardas del estado del crédito;
- cartera en riesgo, fronteras y exclusiones;
- idempotencia de pagos, replay y conflictos;
- invariantes transversales;
- equivalencia y validez de contratos Zod/OpenAPI.

Ejecución mínima solicitada:

```bash
npm test
```

Estado verificado al cerrar esta fase: **10 archivos de prueba y 205 pruebas aprobadas**.

## 10. Casos financieros de referencia

| Caso | Entrada principal | Resultado esperado y verificado |
|---|---|---|
| CA-01 | Q10,000.00, TNA 36%, 12 meses | 11 cuotas de Q1,004.62; última Q1,004.63; total Q12,055.45; interés Q2,055.45; saldo Q0.00. |
| CA-02 | Q725.76, TNA moratoria 24%, Actual/360, 15 días | Interés moratorio Q7.26. |
| CA-03 | Pago exacto Q1,011.88 | Q7.26 a mora, Q278.86 a interés, Q725.76 a capital; remanente Q0.00. |
| CA-04 | Pago parcial Q500.00 | Q7.26 a mora, Q278.86 a interés, Q213.88 a capital; capital pendiente Q511.88. |
| CA-05 | Pago Q3,000.00 | Obligación Q1,011.88 saldada y excedente Q1,988.12 conservado. |
| CA-06 | Cartera activa Q800,000.00; riesgo Q56,000.00 | Cartera en riesgo 7.00%. |
| CA-07 | Cartera activa Q792,000.00; riesgo Q48,000.00 tras excluir C-005 | Cartera en riesgo 6.06%. |

El detalle matemático y normativo está en [`docs/analisis/FASE-03-reglas-politicas-financieras.md`](docs/analisis/FASE-03-reglas-politicas-financieras.md), y su evidencia integral en la [matriz de trazabilidad](docs/trazabilidad/matriz-trazabilidad.md).

## 11. Diagramas

El repositorio contiene **18 fuentes `.puml` editables**:

| Vista | Ruta |
|---|---|
| UML | [`docs/diagramas/uml/`](docs/diagramas/uml/) |
| C4 | [`docs/diagramas/c4/`](docs/diagramas/c4/) |
| Modelo 4+1 | [`docs/diagramas/4+1/`](docs/diagramas/4+1/) |
| Arquitectura | [`docs/diagramas/arquitectura/`](docs/diagramas/arquitectura/) |
| Diseño modular | [`docs/diagramas/diseno/`](docs/diagramas/diseno/) |
| Patrones | [`docs/diagramas/patrones/`](docs/diagramas/patrones/) |

Los `.puml` son los artefactos fuente y pueden renderizarse con una extensión de PlantUML para el editor o con las herramientas oficiales de PlantUML. La entrega no depende de PNG como único formato.

## 12. ADR

Las decisiones principales están registradas con contexto, alternativas y consecuencias:

- [ADR-001 — Arquitectura Hexagonal con Monolito Modular](docs/adr/ADR-001-arquitectura.md).
- [ADR-002 — Representación exacta de valores monetarios](docs/adr/ADR-002-dinero.md).
- [ADR-003 — Amortización francesa con ajuste en la última cuota](docs/adr/ADR-003-amortizacion.md).

## 13. Decisiones de diseño

- **Dinero exacto:** importes como cadenas decimales o unidades menores `bigint`; nunca se reciben como `number`.
- **Redondeo único:** dos decimales con `ROUND_HALF_UP` al materializar dinero.
- **Moneda explícita:** las operaciones monetarias rechazan monedas incompatibles y no convierten divisas implícitamente.
- **Amortización auditable:** la última cuota absorbe la diferencia de redondeo para conservar capital y terminar en saldo cero.
- **Mora simple:** se calcula exclusivamente sobre capital vencido, sin interés sobre interés.
- **Pagos extensibles:** Chain of Responsibility fija la prelación y Strategy procesa el excedente.
- **Ciclo de vida protegido:** State concentra transiciones y guardas del crédito.
- **Reintentos seguros:** `Idempotency-Key` evita un segundo efecto para pagos equivalentes y detecta reutilización conflictiva.
- **Contratos independientes:** Zod y OpenAPI describen los límites sin trasladar reglas financieras al canal.

## 14. Restricciones

El alcance actual no incluye:

- servidor HTTP, controladores o despliegue de API;
- base de datos, ORM, migraciones o adaptadores de persistencia reales;
- interfaz web, móvil, chatbot o MCP;
- autenticación, autorización o gestión real de usuarios;
- integraciones bancarias, contables o de notificaciones;
- conversión de monedas;
- fechas contractuales completas del plan de amortización;
- cierres mensuales, mayor contable y versionado persistente de políticas;
- generación del documento PDF final.

Los contratos OpenAPI representan una interfaz futura; no implican que exista un servicio HTTP ejecutable en P1.

## 15. Trazabilidad y documentación

La [matriz de trazabilidad](docs/trazabilidad/matriz-trazabilidad.md) relaciona requisitos funcionales y no funcionales, reglas, invariantes, casos de uso, diagramas, módulos, pruebas, casos de aceptación y decisiones pendientes.

La documentación está organizada por fase para conservar la evolución de las decisiones y distinguir claramente entre análisis, diseño, implementación verificada y trabajo futuro.

## 16. Herramientas de IA utilizadas

Se utilizó **OpenAI Codex** como herramienta de asistencia durante el desarrollo para:

- analizar y estructurar requisitos;
- proponer y revisar documentación técnica y diagramas PlantUML;
- apoyar la implementación en TypeScript;
- generar y revisar pruebas automatizadas;
- comprobar consistencia y trazabilidad entre artefactos.

La IA se empleó como apoyo técnico. Los resultados se validaron mediante revisión de los archivos, compilación estricta y ejecución automatizada de la suite; la responsabilidad sobre la entrega y sus decisiones permanece en el equipo autor.
