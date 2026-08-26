# Fase 26 — E6: Repositorio

## 1. Proposito

Consolidar en un unico repositorio reproducible el codigo TypeScript, las pruebas automatizadas y los artefactos editables producidos durante el analisis, la arquitectura, el diseño y la implementacion del nucleo de microcredito.

## 2. Estructura entregada

```text
proyecto-analisis2/
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── aplicacion/
│   ├── contratos/
│   └── dominio/
├── tests/
└── docs/
    ├── adr/
    ├── analisis/
    ├── api/
    ├── arquitectura/
    ├── configuracion/
    ├── diagramas/
    │   ├── 4+1/
    │   ├── arquitectura/
    │   ├── c4/
    │   ├── diseno/
    │   ├── patrones/
    │   └── uml/
    ├── diseno/
    ├── implementacion/
    └── trazabilidad/
```

La estructura amplia el arbol minimo solicitado para separar el dominio, la orquestacion de casos de uso y los contratos de entrada sin alterar la decision de Arquitectura Hexagonal con Monolito Modular.

## 3. Responsabilidad de las carpetas

| Ruta | Responsabilidad |
|---|---|
| `src/dominio/` | Objetos de valor, entidades, politicas y servicios puros del negocio. |
| `src/aplicacion/` | Orquestacion de casos de uso y coordinacion con puertos. |
| `src/contratos/` | Esquemas de validacion para los limites de la aplicacion. |
| `tests/` | Pruebas unitarias, contractuales y transversales de invariantes. |
| `docs/analisis/` | Requisitos, modelo conceptual, reglas y UML inicial. |
| `docs/arquitectura/` | Decisiones y vistas arquitectonicas. |
| `docs/diseno/` | Diseño modular, principios y patrones. |
| `docs/implementacion/` | Evidencia tecnica de las fases implementadas. |
| `docs/api/` | Contratos API y especificacion OpenAPI. |
| `docs/adr/` | Registros de decisiones arquitectonicas. |
| `docs/diagramas/` | Fuentes editables de todos los diagramas. |
| `docs/trazabilidad/` | Relacion entre requisitos, reglas, invariantes, diseño y pruebas. |

## 4. Diagramas editables

Se entregan 18 diagramas como archivos fuente `.puml` de PlantUML:

| Familia | Cantidad | Ubicacion |
|---|---:|---|
| UML | 7 | `docs/diagramas/uml/` |
| C4 | 3 | `docs/diagramas/c4/` |
| Modelo 4+1 | 3 | `docs/diagramas/4+1/` |
| Arquitectura | 1 | `docs/diagramas/arquitectura/` |
| Diseño | 1 | `docs/diagramas/diseno/` |
| Patrones | 3 | `docs/diagramas/patrones/` |

Los archivos `.puml` son la fuente de la entrega y pueden modificarse y volver a renderizarse. No se depende de imagenes PNG como unico formato documental.

## 5. Reproducibilidad

- `package.json` declara scripts, dependencias y la version minima de Node.js.
- `package-lock.json` fija el arbol de dependencias.
- `tsconfig.json` configura la compilacion estricta de TypeScript.
- `vitest.config.ts` configura la ejecucion de pruebas.
- `.gitignore` excluye dependencias instaladas, caches, cobertura, compilados y archivos locales de entorno.

La validacion integral se ejecuta con:

```bash
npm run verify
```

Este comando comprueba tipos mediante `tsc --noEmit` y luego ejecuta toda la suite con Vitest.

## 6. Criterios satisfechos

- El repositorio contiene `README.md`, manifiesto npm, lockfile y configuracion TypeScript.
- El codigo fuente, las pruebas y la documentacion estan separados por responsabilidad.
- Arquitectura, UML, C4, 4+1, ADR, API y trazabilidad tienen ubicaciones explicitas.
- Todos los diagramas se conservan en un formato textual editable.
- La instalacion y validacion son reproducibles mediante comandos npm.

## 7. Limite de esta fase

Esta fase organiza y documenta el repositorio. El contenido profesional completo del `README.md`, incluidos alcance, casos financieros, decisiones y declaracion de herramientas de IA, corresponde a la fase 27.
