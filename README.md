sistema-gestion-microcredito-p1

<!-- Auto-generated improved README by assistant -->

   

comprobar consistencia y trazabilidad entre artefactos.

Tabla de contenido

Descripción

Instalación

Uso rápido

Scripts útiles

API / OpenAPI

Estructura del repositorio

Contribuir

Autores

Licencia

Descripción

Extracto del README original:

# Sistema de Gestión de Microcrédito — Proyecto 1

Núcleo de dominio para la gestión de microcréditos de **Crédito Vecino, S. A.**, acompañado por requisitos trazables, modelos arquitectónicos, diagramas editables, contratos API y pruebas automatizadas.

## 1. Descripción

Este repositorio modela las reglas críticas de un sistema de microcrédito: representación exacta del dinero, generación de planes de amortización, cálculo de mora, aplicación de pagos, estados del crédito, idempotencia y cartera en riesgo.

El proyecto prioriza exactitud financiera, auditabilidad e independencia de infraestructura. Los importes no se procesan con punto flotante binario y las reglas del negocio pueden probarse sin una base de datos, un servidor HTTP ni servicios externos.

## 2. Objetivo


Este repositorio implementa el núcleo de dominio para un sistema de microcréditos. Está diseñado para ser:

Preciso en representaciones monetarias (sin uso de number para importes).

Auditables y con invariantes verificadas por pruebas automatizadas.

Independiente de infraestructura: no requiere servidor ni BD para validar reglas de negocio.

Instalación

Requisitos:

Node.js >=20.0.0+

npm compatible con Node.js

Instalación:

npm install

Uso rápido

Verificación completa (tipos + tests):

npm run verify

Scripts útiles

Los scripts detectados en package.json son:

Script

Descripción

typecheck

tsc --noEmit

test

vitest run --passWithNoTests

test:watch

vitest

verify

npm run typecheck && npm test

API / OpenAPI

Se detectaron especificaciones OpenAPI en el repositorio. Puedes usar Swagger UI o herramientas como Postman para importar el YAML y probar los contratos.

Estructura del repositorio (resumen)

Proyecto1_Analisis-main

Para un inventario detallado revisa docs/ en el repositorio.

Contribuir

Abrir un issue para discutir cambios grandes.

Crear una rama feat/... o fix/... desde main.

Enviar PR con descripción, tests y referencia a la matriz de trazabilidad si aplica.

Autores

Nombre

Rol

Perfil

CHRISTOPHER DAVID HERRERA PÉREZ

Implementación / Pruebas

https://miumg.instructure.com/courses/208556/users/202078

ERWIN ALBERTO RAMIREZ RACANCOJ

Diseño / Documentación

https://miumg.instructure.com/courses/208556/users/157988

GABRIELA ELÍZABETH NOEMÍ AGUILAR VÁSQUEZ

Pruebas / Trazabilidad

https://miumg.instructure.com/courses/208556/users/171820

OLIVER FERNANDO ROMERO ESQUITE

Coordinación / Integración

https://miumg.instructure.com/courses/208556/users/171758

Puedes editar los roles si prefieren etiquetas diferentes (Autor principal, QA, Docs, etc.).

Licencia

Este proyecto está bajo la licencia UNLICENSED. Reemplaza o especifica otra licencia si corresponde.
