# Reproducción desde clon limpio

Fecha: 2026-10-15. Commit auditado: `3a4c97a11e8f117c4708cd997fa4da8fdad0b49b`. Rama de trabajo original preservada; no se usó etiqueta de entrega.

## Procedimiento observado

1. `git clone --no-local --no-hardlinks --branch feat/proyecto-final-asistente-gerencial . .npm-cache/fase8-clon-validado`: checkout nuevo del commit anterior, independiente del índice de trabajo y sin node_modules ni dist.
2. Runtime oficial Node 22.23.3, ZIP contrastado con SHASUMS256.txt; el ejecutable portátil se seleccionó mediante PATH, como alternativa a instalar Node/nvm global. Se usa el mismo runtime como requisito del sistema, no una copia de dependencias del checkout original.
3. `npm ci --cache .npm-cache/instalacion-limpia --fetch-retries=0` con un directorio de caché nuevo dentro del clon: 299 paquetes, cero vulnerabilidades conocidas, código 0. No se copió el node_modules, dist ni caché del checkout original. npm avisó de una versión mayor disponible; no se actualizó globalmente ni se cambió el lockfile.
4. Se provisionaron dos bases nuevas y vacías, `cv_pf8_3a4c97a` y `cv_pf8_3a4c97a_test`, con rol propio sin SUPERUSER/CREATEDB/CREATEROLE. El administrador instaló previamente la extensión vector pública. Esto satisface el requisito PostgreSQL/pgvector del README sin reutilizar la cartera de demo ni la base de pruebas original.
5. Se creó `.env` a partir de `.env.example`, con credenciales locales nuevas del rol y puerto propio. No se copió el `.env` previo; el nuevo archivo está excluido de Git y sus valores no se imprimen ni se versionan.
6. `npm run verify`: typecheck de núcleo/web y **400 pruebas aprobadas en 32 archivos**, código 0. Evidencia `evidencia/fase8-clon-validado-verify.txt`.
7. `npm run carga`: migraciones desde base vacía, huella oficial válida y conteos contractuales, código 0. Evidencia `evidencia/fase8-clon-validado-carga.txt`.
8. `npm run test:e2e`: build propio y **diez recorridos aprobados** sobre la nueva base `_test`, sin tocar la demo. OP-1 a OP-6, consultas de pantallas y responsive por navegador. Evidencia `evidencia/fase8-clon-validado-e2e.txt`.
9. Arranque del punto de entrada Node de la API con los artefactos compilados en los pasos anteriores, puerto local exclusivo 33090: página y sesión responden 200; navegador muestra el buscador sin errores JavaScript. Evidencia `fase8-clon-arranque.json`, `fase8-clon-ui.json` y `capturas/fase8-clon-arranque.png`. No se registraron operaciones financieras adicionales en esta comprobación.
10. `npm run test:carga:postgres` también dentro del clon y con su rol limitado: **31 pruebas aprobadas**, código 0, suite de 65.11 s. Evidencia `evidencia/fase8-clon-validado-postgres.txt`.
11. `npm run docs:pdf` dentro del clon: siete páginas generadas desde la fuente y las dependencias instaladas allí. El PDF de entrega en la raíz principal conserva su revisión visual y metadatos propios. La aplicación temporal se detuvo tras comprobar el arranque; no se dejaron operaciones ni un servidor de diagnóstico en su puerto.
12. `npm run rag:ingesta` en la base nueva de demo del clon: primera ingesta (`repetida: false`), siete documentos, 32 fragmentos y 32 vectores de 1024 dimensiones. Digest bge-m3 verificado y código 0. No se copió el índice vectorial de la base original. Evidencia `evidencia/fase8-clon-validado-rag.txt`.

Los insumos `datos/` y `vistas/` estaban versionados en el commit clonado; no se sustituyeron ni regeneraron. Los hashes del ZIP y de eventos se comprueban en la suite de seguridad y al cargar. El lockfile del clon coincide con el auditado tras normalizar LF para comparar los checkouts de Windows; la huella canónica está en `evidencia/fase8-clon-lock.json`. No hay cambios en src, tests, datos, vistas, package.json ni package-lock.json del clon tras estas verificaciones; los recorridos regeneran capturas de evidencia, como está previsto.

## Fallo real encontrado en el primer clon

El intento inicial en `fc96417` instaló dependencias, pasó 399 pruebas y cargó correctamente, pero la SPA devolvió 404 porque el path absoluto de index atravesaba `.npm-cache/`. Se añadió una regresión que falló con ese comportamiento y pasó con `sendFile("index.html", { root: raiz })`. La solución conserva el bloqueo de archivos ocultos y las respuestas JSON de la API. El segundo clon es nuevo y contiene esa corrección; no se limitó a reutilizar el build fallido.

## Alcance pendiente

La instalación/carga/UI y la ingesta RAG anteriores están verificadas en el clon. Las seis suites completas con modelos reales se ejecutaron en el checkout principal del mismo código 3a4c97a, con resultado y límites en el cierre de fase 8; no se afirma que se repitieron las consultas LLM completas dentro del clon. La reproducción automatizada no acredita un ensayo humano continuo, la duración del video, las cuatro intervenciones orales ni la entrega Canvas.
