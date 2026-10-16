# Fase 8 — Documentación, defensa y auditoría final (E7)

Fecha: 2026-10-15. Base recibida: ba90a7c, rama feat/proyecto-final-asistente-gerencial.

FASE: 8.

ESTADO: PARCIAL. Documentación y PDF generados; instalación limpia y control automatizado completo aprobados. Persisten respuestas incompletas y latencia incompatible con el guion medido. Ensayo continuo, video compartible y defensa oral no se acreditan como realizados. No listo para entrega.

## Cambios realizados

- README reestructurado para instalación de todo el sistema, variables, base/modelos, carga, siete pantallas, chat, comandos, origen de cifras y límites. Corrige el título histórico, Node, conteos, árbol y diagramas sin borrar historia de Git.
- PDF PF_AsistenteGerencial_2.pdf, siete páginas, con fuente HTML editable y script gratuito sobre Chrome/Playwright. Portada con cuatro integrantes y carnés del maestro, arquitectura, integración, MCP/RAG, seguridad, decisiones y límites reales.
- Guion de video con presupuesto de 18 minutos y pasos por caso, guía interna de defensa y auditoría de rúbrica/penalizaciones.
- Correcciones de reproducibilidad: Node mínimo compatible, `.nvmrc`, grabación histórica con LF y source-map-js 1.2.2. Variable pública de `.env` actualizada a API relativa; sin modificar credenciales ni pruebas heredadas.
- Capturador de controles UTF-8 y ADR-024. Sin cambios en fórmulas financieras, corpus, datos ni permisos de aprobación.
- Corrección del servicio de la SPA al instalar en rutas con una carpeta oculta: index relativo a su raíz estática. Regresión nueva que falla antes de corregir y pasa después, conservando el bloqueo de archivos ocultos y los 404 JSON de la API.
- Clon independiente de `3a4c97a`, instalación con caché nueva y dos bases vacías con un rol propio limitado; verificados carga, interfaz, PostgreSQL, PDF y arranque. Procedimiento en [08-instalacion-limpia.md](08-instalacion-limpia.md).

## Archivos

`README.md`, `.nvmrc`, `.gitattributes`, `package.json`, `package-lock.json`; `scripts/auditoria/ejecutar-control.mjs`; `scripts/documentacion/generar-pdf.mjs`; `docs/adr/ADR-024-reproducibilidad-auditoria-final.md`; `docs/proyecto-final/PF_AsistenteGerencial_2.html`, `08-guion-video.md`, `08-guia-defensa-interna.md`, `08-auditoria-final.md`, este informe y evidencia fase8-*; PDF en raíz.

## Comandos y resultados observados

| Comando | Resultado |
| --- | --- |
| Fetch usando schannel | main/origin/main 0/0; se conserva la rama existente |
| Primer fase8:preflight | Falló typecheck por dependencias ausentes; código 2 |
| npm ci | Restauró dependencias del lockfile; detectó runtime antiguo y una vulnerabilidad |
| Node 22.23.3 oficial | ZIP contrastado con SHASUMS256.txt, runtime portátil sin cambiar el global |
| Segundo fase8:preflight | Typecheck correcto; 398 pasan y una prueba de grabación falla por CRLF |
| Prueba de verificador tras LF | Dos aprobadas; mismas aserciones y contenido Git de la grabación |
| Parche source-map-js | Solo 1.2.1 → 1.2.2; npm audit informa cero vulnerabilidades conocidas |
| Tercer fase8:preflight | 399 generales y 31 PostgreSQL pasan; navegador: nueve fallan, uno pasa por URL pública antigua |
| test:e2e tras `/v1` | Diez aprobadas; 37.96 s de suite en la corrida específica |
| docs:pdf + revisión | Siete páginas, texto extraíble, un enlace, sin desbordamiento de fuente; portada y resultados revisados renderizados |
| Regresión SPA en carpeta oculta | Falló antes de corregir; pasó después. El segundo clon aprueba los diez e2e |
| Control final fase8:preflight | Commit 3a4c97a, Node 22.23.3: 468 aprobadas, cero fallidas/omitidas, código 0, 4031.01 s |
| Evals reales actuales | Nueve casos y resumen aprobados; reporte reporte-2026-10-16-3a4c97a, fecha UTC |
| Clon limpio | npm ci con caché nueva; 400 generales, 31 PostgreSQL, diez e2e, carga, PDF y arranque aprobados |
| Ingesta RAG en clon | Primera ingesta, siete documentos, 32 fragmentos y 32 vectores; bge-m3 con digest verificado, código 0 |
| Seguridad de archivos preparados | Seis comprobaciones específicas aprobadas; insumos canónicos intactos |

Las corridas fallidas se conservan con sus mensajes reales. El [log final](evidencia/fase8-preflight.txt) y el [resumen calculado](evidencia/fase8-resumen-verificacion.json) identifican el commit y confirman las seis suites completas. No se atribuyen los 467 éxitos históricos de fase 7 a esta ejecución. Los reportes usan fecha UTC, que ya era 16/10 durante la noche local del 15/10.

## Pruebas

Pruebas actuales aprobadas por sección en el control final: 400 generales, 31 PostgreSQL, diez navegador, seis RAG reales, once chat reales y diez evals (nueve casos más resumen): **468**. La prueba de grabación conserva sus expectativas originales; el caso adicional prueba el error estático encontrado en el clon. Ninguna prueba heredada se modificó para aprobar. Las repeticiones en el clon y la revisión específica de seguridad no se suman como pruebas distintas. La aprobación automatizada no certifica redacción completa ni duración apta para video.

## Decisiones

ADR-024 documenta compatibilidad de runtime, saltos LF, API relativa, dependencia corregida, captura UTF-8 y PDF sin una nueva biblioteca de producción. Se preservan modelo y stack; no se oculta la latencia ni se apaga el verificador de cifras.

## Riesgos o bloqueos

No existe video real, enlace compartible, ensayo continuo dentro de 15–20 minutos ni defensa oral acreditada. En la corrida actual los nueve turnos G/OP-7 sumaron 1702.5 s (unos 28.4 min), sin operaciones ni presentación. G-1/G-2/G-3 salieron truncadas y G-7 ocultó la redacción por cifras sin respaldo. Son defectos activos pese a las once pruebas de chat aprobadas: estas validan herramientas/pantallas y permiten ocultar texto inseguro, pero no exigen redacción completa. Véase [revisión de respuestas](08-revision-respuestas.md). El verificador no controla todos los enteros ni la semántica de cada cifra. Sesiones en memoria.

El usuario confirmó el 15/10/2026 que todavía no existe video e indicó ignorar `Proyecto-Final-Enunciado-037-v2.pdf`. La auditoría usa el maestro como referencia; el PDF docente se excluye por instrucción expresa y su ausencia no se mantiene como bloqueo. Esto no excluye el PDF técnico PF_AsistenteGerencial_2.pdf, que sí se generó y verificó.

## Pendiente para completar la fase

Resolver el truncamiento de G-1/G-2/G-3 y la explicación oculta de G-7; reducir la latencia y repetir las verificaciones afectadas; ensayar el guion completo dentro de 15–20 minutos; grabar/revisar el video con los cuatro integrantes; agregar enlace real y completar auditoría. No crear entrega-pf ni declarar listo hasta contar con evidencia crítica completa. No hay una siguiente fase automática.

## Git

Rama feat/proyecto-final-asistente-gerencial. Base ba90a7c. Los commits de fase 8 se consultan con `git log --oneline -- docs/proyecto-final/08-documentacion-defensa-cierre.md`. Sin push ni etiqueta de entrega.
