# ADR-024: runtime, grabaciones y evidencia reproducible de la auditoría

Estado: aceptado. Fecha: 2026-10-15. Complementa ADR-023.

## Hallazgos comprobados

El checkout tenía dependencias incompletas y Node 22.13.0. El lockfile de fases 3–7 contiene paquetes que exigen al menos Node 22.22.2. Con Node 22.23.3 oficial y hash verificado, el typecheck y 398 pruebas pasaron, pero una prueba histórica falló: el checkout CRLF de la grabación no coincidía con su delimitador LF y producía respuestas vacías. No era un fallo de la fórmula financiera ni justifica modificar el resultado esperado.

La configuración local antigua usaba VITE_API_BASE_URL absoluta en localhost:3000, incompatible con la app de misma origen y los puertos efímeros de e2e. Nueve de diez recorridos fallaron por elementos no disponibles. Se actualizó únicamente esa variable pública a `/v1`, conforme a `.env.example`; se mantienen las aserciones y se repite navegador.

La auditoría npm detectó source-map-js 1.2.1 con una vulnerabilidad alta. Se actualizó exclusivamente a su parche 1.2.2; el audit posterior informó cero vulnerabilidades conocidas.

## Decisión

- `.nvmrc` fija 22.23.3; engines declara mínimo 22.22.2. No cambiar el Node global para validar otro runtime.
- La grabación histórica tiene `text eol=lf` en `.gitattributes`. Se preserva el contenido Git original y las aserciones heredadas. No generar una transcripción nueva para acomodar expectativas.
- Mantener la API relativa `/v1` en instalación y documentar la actualización de `.env` anterior. No agregar excepciones de origen ni debilitar cookies para que pase e2e.
- Capturar nuevos controles con un script Node UTF-8, metadatos de runtime/commit/diff, duración y código de salida. Se evita mezclar UTF-8 con UTF-16LE de Tee-Object en Windows PowerShell 5.
- Generar el PDF desde HTML editable mediante Chrome y Playwright ya presentes, con revisión de dimensiones, texto, páginas y vista renderizada. No agregar una biblioteca de producción para PDF.

## Consecuencias

La reproducibilidad se verifica en clon independiente, con npm ci y base de prueba separada. Los resultados históricos no se presentan como corridas nuevas. Las optimizaciones de latencia/modelo y la ampliación semántica del verificador no forman parte de estas correcciones; quedan sujetas a evidencia y regresión antes de certificar una entrega.

## Referencia de la corrección de dependencia

[Aviso del proyecto source-map-js y parche 1.2.2](https://github.com/7rulnik/source-map-js/releases/tag/v1.2.2); [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).
