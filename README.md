# Sistema de Gestión de Microcrédito — Proyectos 1 y 2

## Evolución del Proyecto 2

P2 amplía el núcleo existente con mora escalonada versionada, gasto de gestión idempotente, liquidación desde EN_MORA, interés corriente en suspenso y cartera desglosada. Los otorgamientos anteriores a **2026-10-01** conservan `POL-2024-01` (24% plana); desde esa fecha se selecciona `POL-2026-10` (18/24/30/36% por tramos hasta 120 días). El cálculo recibe las fechas explícitamente y conserva el moratorio acumulado después del día 120.

La entrada integrada es `src/aplicacion/consultar-mora.ts`; las respuestas JSON se preparan en `src/contratos/presentadores-p2.ts`. Se conservan las APIs P1, sus diez archivos de pruebas y los contratos de errores. No hay servidor HTTP ni frontend.

```bash
npm ci
npm test
npm run typecheck
npm run verify
npm run test:watch
```

En PowerShell con ejecución de scripts restringida, usar `npm.cmd` en lugar de `npm`. La suite P2 verifica **263 pruebas en 18 archivos**, incluidas las 206 originales. No existe comando de cobertura instrumentada ni proveedor de cobertura instalado; no se publica un porcentaje de cobertura. Los resultados y las particularidades del entorno están en la validación final.

### Comandos de pruebas por tema

Ejecutar desde la raíz del repositorio, después de instalar las dependencias. Cada comando ejecuta una vez los archivos seleccionados:

| Comando | Qué verifica | Pruebas / archivos verificados |
|---|---|---|
| `npm run test:mora` | Mora escalonada, contrato de políticas, fechas, clasificación, regresión y contratos de salida. | 65 / 5 |
| `npm run test:idempotencia` | Gasto único de GTQ25 por cuota, repetición de cierres y registro de pagos sin duplicados. | 19 / 2 |
| `npm run test:coexistencia` | CP-03: política plana del 24% para otorgamientos anteriores al 01/10/2026 y escalonada desde esa fecha, además de regresiones relacionadas. | 19 / 2 |
| `npm run test:cp04` | CP-04.1: liquidación; CP-04.2: interés corriente en suspenso; CP-04.3: cartera por tramo. | 18 / 3 |
| `npm run test:cartera` | Cartera en mora y en riesgo, exclusiones, bajas, porcentajes y entradas inválidas. | 27 / 2 |
| `npm run test:invariantes` | Invariantes transversales y comprobaciones relacionadas de cartera, políticas, gastos y pagos. | 85 / 8 |

Las selecciones se superponen y ejecutan archivos completos: sus cantidades no deben sumarse como pruebas distintas. `npm test` ejecuta la suite completa; `npm run verify` agrega la revisión de tipos. Para ejecutar únicamente las 13 pruebas transversales: `npm test -- tests/invariantes.test.ts`.

Ejemplo en PowerShell: `npm.cmd run test:cartera`. Los inputs, outputs, criterios de aprobación y límites de cada selección están en la [documentación de pruebas](docs/proyecto2/e6-03-pruebas-mora-escalonada.md).

- **[Documento de entrega del Proyecto 2](docs/proyecto2/P2-documento-entrega.md)**
- **[Prototipo navegable en Figma](https://www.figma.com/proto/jozM3QI8ZJ6pywdCoO5OVo/Microcr%C3%A9ditos-App?node-id=0-1&t=PJlTVLC3ASu31ttw-1)**
- **[Índice de la documentación del Proyecto 2 por entregable (E1–E6)](docs/proyecto2/README.md)**
- [E1 · Personas, journey map y momentos críticos](docs/proyecto2/e1-investigacion-usuario.md)
- [E2 · Arquitectura de información y wireframes](docs/proyecto2/e2-arquitectura-informacion.md)
- [E4 · Decisión móvil/web (PWA) y trabajo sin conexión](docs/proyecto2/e4-decision-movil-web.md)
- [E6 · Auditoría y línea base P1](docs/proyecto2/e6-01-auditoria-inicial.md)
- [E6 · Evolución del núcleo: fórmulas, ejemplos, compatibilidad y límites](docs/proyecto2/e6-02-evolucion-nucleo.md)
- [E6 · Validación final](docs/proyecto2/e6-04-validacion-final.md)
- [ADR-004: políticas de mora](docs/adr/ADR-004-politica-mora-escalonada.md)
- [Impacto SOLID y métricas del diff](docs/informe-impacto-solid.md)
- [Strategy de mora](docs/diagramas/patrones/04-strategy-mora.puml), [secuencia de cálculo](docs/diagramas/uml/08-secuencia-politica-mora.puml) y [gasto idempotente](docs/diagramas/uml/09-secuencia-gasto-idempotente.puml)

La documentación siguiente conserva la entrega P1 y sus cifras históricas. Las afirmaciones de revisión humana y distribución del equipo pertenecen a esa documentación heredada: este trabajo P2 fue realizado con Codex, con verificaciones automatizadas, sin atribuir una revisión humana nueva ni commits a integrantes.

---

Núcleo de dominio para la gestión de microcréditos de **Crédito Vecino, S. A.**, construido con reglas de negocio trazables, arquitectura hexagonal, diagramas editables, contratos de API y una suite de pruebas automatizadas completa.

<p align="left">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-%3E%3D20-339933?logo=node.js&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white">
  <img alt="Vitest" src="https://img.shields.io/badge/Vitest-Tests-6E9F18?logo=vitest&logoColor=white">
  <img alt="Zod" src="https://img.shields.io/badge/Zod-Validation-3E67B1?logo=zod&logoColor=white">
  <img alt="OpenAPI" src="https://img.shields.io/badge/OpenAPI-3.1-6BA539?logo=openapiinitiative&logoColor=white">
  <img alt="decimal.js" src="https://img.shields.io/badge/decimal.js-Precisi%C3%B3n%20exacta-informational">
  <img alt="date-fns" src="https://img.shields.io/badge/date--fns-Fechas-770C56?logo=datefns&logoColor=white">
  <img alt="PlantUML" src="https://img.shields.io/badge/PlantUML-Diagramas-blueviolet">
</p>

<p align="left">
  <img alt="Tests" src="https://img.shields.io/badge/tests-206%20passing-brightgreen">
  <img alt="Test files" src="https://img.shields.io/badge/archivos%20de%20prueba-10-brightgreen">
  <img alt="Status" src="https://img.shields.io/badge/estado-P1%20completado-blue">
</p>

---

## Tabla de contenido

1. [Descripción](#1-descripción)
2. [Objetivo](#2-objetivo)
3. [Alcance de P1](#3-alcance-de-p1)
4. [Arquitectura](#4-arquitectura)
5. [Stack tecnológico](#5-stack-tecnológico)
6. [Estructura de carpetas](#6-estructura-de-carpetas)
7. [Instalación](#7-instalación)
8. [Ejecución](#8-ejecución)
9. [Pruebas](#9-pruebas)
10. [Casos financieros de referencia](#10-casos-financieros-de-referencia)
11. [Diagramas](#11-diagramas)
12. [Decisiones arquitectónicas (ADR)](#12-decisiones-arquitectónicas-adr)
13. [Decisiones de diseño](#13-decisiones-de-diseño)
14. [Restricciones](#14-restricciones)
15. [Trazabilidad y documentación](#15-trazabilidad-y-documentación)
16. [Autores](#16-autores)
17. [Herramientas de IA utilizadas](#17-herramientas-de-ia-utilizadas)

---

## 1. Descripción

Este repositorio modela las reglas críticas de un sistema de microcrédito: representación exacta del dinero, generación de planes de amortización, cálculo de mora, aplicación de pagos, control del ciclo de vida del crédito, idempotencia en operaciones sensibles y medición de la cartera en riesgo.

El proyecto prioriza tres cualidades por encima de todo: **exactitud financiera**, **auditabilidad** e **independencia de infraestructura**. Esto significa que los importes nunca se procesan con punto flotante binario (evitando errores de redondeo típicos de `number` en JavaScript) y que todas las reglas del negocio pueden probarse de forma aislada, sin necesidad de una base de datos, un servidor HTTP ni servicios externos.

## 2. Objetivo

El objetivo de este proyecto es diseñar y validar un núcleo de microcrédito mantenible que:

- preserve las invariantes monetarias y contables en todo momento;
- haga explícitas las políticas financieras (tasas, mora, prelación de pagos) en lugar de dejarlas implícitas en el código;
- permita sustituir canales e infraestructura en el futuro mediante el patrón de puertos y adaptadores;
- mantenga trazabilidad completa desde los requisitos hasta el código y las pruebas;
- sirva como base sólida para futuras etapas de implementación (persistencia, API HTTP, autenticación, etc.).

## 3. Alcance de P1

Esta primera fase del proyecto (**P1**) incluye:

- análisis del dominio: requisitos, reglas, políticas e invariantes financieras;
- Arquitectura Hexagonal organizada como Monolito Modular;
- modelos UML, C4 y 4+1 documentados en PlantUML editable;
- un objeto de valor `Dinero` con precisión decimal exacta;
- un plan de amortización bajo el sistema francés, con ajuste en la última cuota;
- cálculo de mora simple por cuota, bajo la convención Actual/360;
- prelación de pagos mediante el patrón Chain of Responsibility, y tratamiento de excedentes mediante Strategy;
- ciclo de estados del crédito modelado con el patrón State;
- cálculo de cartera en riesgo, incluyendo la exclusión de créditos incobrables;
- registro idempotente de pagos en el caso de uso implementado;
- contratos OpenAPI 3.1 y esquemas Zod para las capacidades principales del sistema;
- pruebas unitarias, contractuales y transversales de invariantes.

## 4. Arquitectura

La solución adopta el estilo **Arquitectura Hexagonal + Monolito Modular**, donde todas las dependencias apuntan hacia el centro del sistema:

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

Bajo este modelo, el **dominio** concentra las decisiones del negocio y no depende de ningún detalle técnico externo; la capa de **aplicación** coordina los casos de uso orquestando al dominio; y la capa de **contratos** valida las representaciones externas (Zod, OpenAPI) sin filtrar reglas financieras hacia los canales. Esto permite, por ejemplo, añadir en el futuro una API REST o una base de datos sin tocar una sola línea de las reglas de negocio.

La documentación completa de este modelo arquitectónico se encuentra dentro de la carpeta `docs/arquitectura/`.

## 5. Stack tecnológico

| Tecnología | Insignia | Uso en el proyecto |
|---|---|---|
| Node.js 20 o superior | ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white) | Entorno de ejecución de todo el proyecto. |
| TypeScript, modo estricto | ![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white) | Implementación del dominio y verificación estática de tipos. |
| Vitest | ![Vitest](https://img.shields.io/badge/Vitest-Tests-6E9F18?logo=vitest&logoColor=white) | Motor de pruebas automatizadas (unitarias, contractuales y de invariantes). |
| `decimal.js` | ![decimal.js](https://img.shields.io/badge/decimal.js-Precisi%C3%B3n%20exacta-informational) | Aritmética decimal exacta, encapsulada por el objeto `Dinero`. |
| `date-fns` | ![date-fns](https://img.shields.io/badge/date--fns-Fechas-770C56?logo=datefns&logoColor=white) | Operaciones de fechas controladas (plazos, mora, vencimientos). |
| Zod | ![Zod](https://img.shields.io/badge/Zod-Validation-3E67B1?logo=zod&logoColor=white) | Definición de contratos ejecutables y validación de datos externos. |
| OpenAPI 3.1 / YAML | ![OpenAPI](https://img.shields.io/badge/OpenAPI-3.1-6BA539?logo=openapiinitiative&logoColor=white) | Especificación de la futura interfaz HTTP del sistema. |
| PlantUML | ![PlantUML](https://img.shields.io/badge/PlantUML-Diagramas-blueviolet) | Diagramas textuales y editables (UML, C4, 4+1). |

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

Un inventario detallado, carpeta por carpeta, se encuentra documentado dentro de `docs/arquitectura/`.

## 7. Instalación

### Requisitos previos

- Node.js `>=20.0.0`.
- npm compatible con la versión instalada de Node.js.

### Pasos

Clona el repositorio e instala las dependencias desde la raíz del proyecto:

```bash
git clone https://github.com/ItsRomero/Proyecto1_Analisis.git
cd Proyecto1_Analisis
npm install
```

El archivo `package-lock.json` fija las versiones exactas resueltas de cada dependencia. En entornos de integración continua se recomienda usar `npm ci` en lugar de `npm install`, ya que realiza una instalación limpia y perfectamente reproducible a partir del lockfile.

## 8. Ejecución

Es importante entender que P1 entrega un **núcleo de dominio**, no un servidor ni una aplicación de línea de comandos. Por lo tanto, su ejecución "observable" se realiza a través de la verificación de tipos y la suite de pruebas:

```bash
npm run verify
```

Este comando ejecuta, en secuencia, la comprobación de tipos y toda la suite de pruebas. Otros comandos disponibles:

| Comando | Resultado |
|---|---|
| `npm run typecheck` | Comprueba TypeScript sin emitir archivos. |
| `npm test` | Ejecuta una vez toda la suite de pruebas. |
| `npm run test:watch` | Ejecuta Vitest en modo interactivo (útil durante el desarrollo). |
| `npm run verify` | Ejecuta tipos y pruebas en secuencia; es el comando recomendado antes de un commit. |

## 9. Pruebas

Los comandos actuales de P2 están en [Comandos de pruebas por tema](#comandos-de-pruebas-por-tema). La descripción siguiente conserva el alcance histórico de P1.

La suite de pruebas cubre, con distintos niveles de granularidad, todas las reglas críticas del sistema:

- exactitud, redondeo, moneda e inmutabilidad del objeto `Dinero`;
- amortización francesa, caso de tasa cero y ajuste correcto en la última cuota;
- cálculo de mora, fechas límite y verificación independiente por cuota;
- prelación de pagos, pagos parciales y las distintas estrategias para excedentes;
- transiciones válidas e inválidas (guardas) del estado del crédito;
- cálculo de cartera en riesgo, casos frontera y exclusiones correctas;
- idempotencia de pagos, comportamiento ante reintentos (replay) y detección de conflictos;
- invariantes transversales que deben cumplirse en todo el sistema;
- equivalencia y validez de los contratos definidos en Zod y OpenAPI.

Para ejecutar la suite completa:

```bash
npm test
```

**Estado verificado al cerrar esta fase:** 10 archivos de prueba y 206 pruebas aprobadas, sin fallos.

## 10. Casos financieros de referencia

Estos casos documentan, con números reales, el comportamiento esperado y verificado del sistema. Sirven tanto como ejemplos de uso como evidencia de que las reglas financieras se cumplen correctamente:

| Caso | Entrada principal | Resultado esperado y verificado |
|---|---|---|
| CA-01 | Q10,000.00, TNA 36%, 12 meses | 11 cuotas de Q1,004.62; última cuota Q1,004.63; total pagado Q12,055.45; interés total Q2,055.45; saldo final Q0.00. |
| CA-02 | Q725.76, TNA moratoria 24%, Actual/360, 15 días de atraso | Interés moratorio calculado: Q7.26. |
| CA-03 | Pago exacto de Q1,011.88 | Se aplican Q7.26 a mora, Q278.86 a interés y Q725.76 a capital; remanente Q0.00. |
| CA-04 | Pago parcial de Q500.00 | Se aplican Q7.26 a mora, Q278.86 a interés y Q213.88 a capital; capital pendiente Q511.88. |
| CA-05 | Pago de Q3,000.00 | La obligación de Q1,011.88 queda saldada y el excedente de Q1,988.12 se conserva según la estrategia definida. |
| CA-06 | Cartera activa de Q800,000.00; riesgo de Q56,000.00 | Cartera en riesgo del 7.00%. |
| CA-07 | Cartera activa de Q792,000.00; riesgo de Q48,000.00 tras excluir el crédito C-005 | Cartera en riesgo del 6.06%. |

El detalle matemático y normativo completo de estos casos, junto con su evidencia integral, se encuentra documentado dentro de `docs/analisis/` y `docs/trazabilidad/`.

## 11. Diagramas

El repositorio contiene **18 fuentes `.puml` editables**, organizadas por tipo de vista dentro de `docs/diagramas/`:

| Vista | Contenido |
|---|---|
| UML | Diagramas de clases, secuencia y objetos del dominio. |
| C4 | Contexto, contenedores y componentes del sistema. |
| Modelo 4+1 | Vistas lógica, de procesos, de desarrollo, física y de escenarios. |
| Arquitectura | Representación general de la arquitectura hexagonal. |
| Diseño modular | Organización interna de los módulos del dominio y la aplicación. |
| Patrones | Chain of Responsibility, Strategy y State aplicados al sistema. |

Los archivos `.puml` son los artefactos fuente del proyecto y pueden renderizarse con cualquier extensión de PlantUML para el editor de código, o con las herramientas oficiales de PlantUML. La entrega no depende de imágenes PNG como único formato de consulta.

## 12. Decisiones arquitectónicas (ADR)

Las decisiones principales del proyecto están registradas formalmente, incluyendo su contexto, las alternativas consideradas y sus consecuencias. Estos registros (Architecture Decision Records) se encuentran dentro de `docs/adr/` e incluyen, entre otros:

- **ADR-001** — Justificación de la Arquitectura Hexagonal con Monolito Modular.
- **ADR-002** — Representación exacta de valores monetarios mediante el objeto `Dinero`.
- **ADR-003** — Amortización francesa con ajuste en la última cuota.

## 13. Decisiones de diseño

- **Dinero exacto:** los importes se representan como cadenas decimales o unidades menores en `bigint`; nunca se reciben ni se procesan como `number`, para evitar errores de precisión.
- **Redondeo único:** se aplican exactamente dos decimales con la estrategia `ROUND_HALF_UP` únicamente al momento de materializar un valor monetario final.
- **Moneda explícita:** las operaciones monetarias rechazan monedas incompatibles entre sí y el sistema nunca realiza conversiones de divisa de forma implícita.
- **Amortización auditable:** la última cuota del plan absorbe cualquier diferencia de redondeo acumulada, garantizando que el capital se conserve y el saldo final sea exactamente cero.
- **Mora simple:** el interés moratorio se calcula exclusivamente sobre el capital vencido, sin aplicar interés sobre interés.
- **Pagos extensibles:** el patrón Chain of Responsibility define el orden de prelación (mora, interés, capital), mientras que Strategy determina cómo se procesa cualquier excedente del pago.
- **Ciclo de vida protegido:** el patrón State concentra todas las transiciones y guardas válidas del ciclo de vida de un crédito, evitando estados inconsistentes.
- **Reintentos seguros:** el uso de una `Idempotency-Key` evita que un pago se aplique dos veces por error y permite detectar reutilizaciones conflictivas de la misma clave.
- **Contratos independientes:** Zod y OpenAPI describen únicamente los límites de entrada y salida del sistema, sin trasladar ninguna regla financiera hacia la capa de contratos o el canal de comunicación.

## 14. Restricciones

Es importante aclarar qué queda explícitamente **fuera** del alcance de esta fase (P1):

- servidor HTTP, controladores o cualquier forma de despliegue de API real;
- base de datos, ORM, migraciones o adaptadores de persistencia reales;
- interfaz web, móvil, chatbot o integración tipo MCP;
- autenticación, autorización o gestión real de usuarios;
- integraciones bancarias, contables o de notificaciones;
- conversión entre distintas monedas;
- fechas contractuales completas dentro del plan de amortización;
- cierres mensuales, mayor contable y versionado persistente de políticas financieras;
- generación del documento PDF final del proyecto.

Los contratos OpenAPI incluidos representan una interfaz **futura**; su existencia no implica que haya un servicio HTTP ejecutable en esta fase.

## 15. Trazabilidad y documentación

Toda la documentación de requisitos funcionales y no funcionales, reglas de negocio, invariantes, casos de uso, diagramas, módulos, pruebas, casos de aceptación y decisiones pendientes está relacionada de forma integral dentro de una matriz de trazabilidad, disponible en `docs/trazabilidad/`.

Además, toda la documentación del proyecto está organizada por fase, lo que permite conservar la evolución de las decisiones a lo largo del tiempo y distinguir claramente entre análisis, diseño, implementación ya verificada y trabajo pendiente para futuras etapas.

## 16. Autores declarados en la entrega P1

| Autor | Rol en el proyecto |
|---|---|
| Christopher David Herrera Pérez | Implementación / Pruebas |
| Erwin Alberto Ramírez Racancoj | Pruebas / Trazabilidad |
| Gabriela Elízabeth Noemí Aguilar Vásquez | Diseño / Documentación |
| Oliver Fernando Romero Esquite | Coordinación / Integración |

## 17. Herramientas de IA utilizadas (declaración histórica P1)

Se utilizó OpenAI Codex como apoyo durante el desarrollo del proyecto para:

- analizar y organizar los requisitos del sistema
- ayudar a redactar documentación técnica y diagramas en PlantUML
- verificar la coherencia entre los diferentes artefactos del proyecto

La inteligencia artificial se utilizó únicamente como herramienta de apoyo. Todo el código, documentación y decisiones del proyecto fueron revisados y validados manualmente por el equipo mediante compilación en TypeScript y ejecución de pruebas.
## 18. Herramientas de IA utilizadas en el Proyecto 2 (sección 15 del enunciado)

| Herramienta | Uso | Artefactos |
|---|---|---|
| OpenAI Codex | Apoyo en la evolución del núcleo (CP-01 a CP-04), pruebas y documentación técnica de E6 | `src/dominio/`, `tests/`, `docs/proyecto2/e6-*` |
| Claude (Anthropic) | Apoyo en la redacción de E1, E2 y E4, en la generación de los wireframes de baja fidelidad (script `docs/proyecto2/wireframes/generar_wireframes.py`), en la consolidación del informe de impacto SOLID según el Anexo D y en la revisión de la coherencia entre documentos | `docs/proyecto2/e1-*`, `e2-*`, `e4-*`, `wireframes/`, `docs/informe-impacto-solid.md` |

Las decisiones de diseño y su justificación corresponden al equipo, que debe revisarlas y poder explicarlas en la defensa. Los rasgos de las personas marcados como hipótesis (HIP) no provienen de entrevistas y deben validarse con los instrumentos de E1.
