# Impacto SOLID y GRASP de Proyecto 2

## Comparación reproducible

Base: `entrega-p1` = `8737d9b782772a5cff9acb07de8d719f4f4e3a16`, `main` local del repositorio ItsRomero. Destino: rama `feat/proyecto-2-evolucion-nucleo`; el núcleo medido está en `17be891` (fases 1–4). Los commits documentales/contractuales posteriores no cambian esas métricas de dominio.

```bash
git diff entrega-p1 --name-status -- src/dominio
git diff entrega-p1 --numstat -- src/dominio
git diff entrega-p1 -- src/dominio/calculadora-mora.ts
git diff entrega-p1 --diff-filter=M -- tests
```

Hay **10 archivos nuevos** y **2 preexistentes modificados** en `src/dominio/`. El diff suma **381 líneas añadidas**, **21 eliminadas**, **360 netas**. No son líneas de código lógico: son líneas físicas de Git, incluidos comentarios y espacios.

| Archivo relativo a src/dominio | Estado | Añadidas | Eliminadas |
|---|---|---:|---:|
| calculadora-mora.ts | Modificado | 32 | 19 |
| credito-estado.ts | Modificado | 12 | 2 |
| cartera-por-tramo.ts | Nuevo | 99 | 0 |
| clasificacion-tramo.ts | Nuevo | 13 | 0 |
| devengo-interes.ts | Nuevo | 57 | 0 |
| gasto-gestion-cobro.ts | Nuevo | 45 | 0 |
| politica-mora/catalogo-politicas.ts | Nuevo | 10 | 0 |
| politica-mora/configuracion-politica.ts | Nuevo | 22 | 0 |
| politica-mora/politica-escalonada.ts | Nuevo | 17 | 0 |
| politica-mora/politica-mora.ts | Nuevo | 38 | 0 |
| politica-mora/politica-plana.ts | Nuevo | 18 | 0 |
| politica-mora/politica-retroactiva.ts | Nuevo | 18 | 0 |

Los otros cinco archivos originales del dominio permanecen intactos: dinero, amortización, cartera agregada, idempotencia de pagos y prelación. Fuera del dominio se añade `src/aplicacion/consultar-mora.ts` y `src/contratos/presentadores-p2.ts`, y se modifica `src/contratos/esquemas.ts`, además de pruebas y documentación. Estas rutas no están incluidas en las 360 líneas netas.

## La calculadora sí cambió

No se afirma cumplimiento absoluto de OCP desde P1: fue necesario introducir un punto de extensión que antes no existía. Se extraen y reexportan clasificación/tramos, se referencia el límite corriente configurado y se añade una instancia con política inyectada. Extracto literal del diff:

```diff
+import type { PoliticaMora, CalculoPolitica } from "./politica-mora/politica-mora.js";
+export { TramoMora, clasificarTramoMora } from "./clasificacion-tramo.js";
 export class CalculadoraMora {
+  public constructor(private readonly politica: PoliticaMora) { Object.freeze(this); }
```

La nueva instancia delega con `this.politica.calcular(capital, dias)` y crea el `Dinero` final; no selecciona implementaciones. La fachada estática P1 mantiene su algoritmo de tasa directa. El cambio medido de este archivo es +32/−19, neto +13; no se oculta tras llamarlo «adaptador».

## Regresión observada

- Base verificada: 206 pruebas en diez archivos y typecheck correcto.
- Pruebas originales reescritas: **0**. El diff de los diez archivos es vacío.
- Fallos observados de pruebas P1 durante la evolución: **0** en las ejecuciones realizadas.
- Hubo dos fallos de compilación en pruebas nuevas antes de correr la suite: inferencia literal del parámetro de `PoliticaPlana` restringida a `"0.24"`, y ensanchamiento del enum de estado en una entrada nueva. Se corrigieron mediante anotación `string` y discriminante literal, sin alterar expectativas P1.
- La validación final registra los comandos completos y el total actualizado. No se confunde cantidad de pruebas con cobertura instrumentada.

## SOLID respaldado por símbolos

**S — responsabilidad única.** `DevengoInteres` lleva importes y cortes contables; `Credito` conserva transiciones/evidencia. `generarGastoGestion` decide una emisión por identidad y `incorporarGastoGestion` la proyecta a saldos. `calcularCarteraPorTramo` agrega indicadores y concilia porcentajes. Evidencia: archivos nuevos y pruebas independientes. Fricción: la calculadora P1 aún contiene objetos de fecha/tasa además de la fachada; no se reescribió todo para aparentar separación perfecta.

**O — abierto a extensión.** `PoliticaMora` admite plana, escalonada y retroactiva sin condicionales por tipo en el motor. Agregar una estrategia no exige modificar `CalculadoraMora.calcular`. Sí hubo adaptación inicial (+32/−19) y futuras versiones seleccionables requerirán cambios en catálogo/configuración. `EstadoEnMora` se modificó para permitir una transición que P1 no ofrecía; State no vuelve inmutable toda regla de evolución.

**L — sustitución.** `contrato-politica.test.ts` inyecta las tres implementaciones y verifica mismos tipos, no negatividad, moneda, límite, determinismo e inmutabilidad en dos monedas, cuatro capitales y trece atrasos. No exige mismos importes. La comparación escalonada/retroactiva es un invariante específico 1–120. El doble no productivo nunca se selecciona en el catálogo. El motor rechaza salidas incompatibles. La fachada estática P1 no implementa este contrato nuevo y no se presenta como otra Strategy.

**I — interfaces pequeñas.** `PoliticaMora` expone solo identificador y `calcular`; el resultado contiene únicamente total, moneda y desglose. No obliga a una política a persistir, modificar State ni acceder al reloj. `MovimientoDevengo` y `BajaIncobrable` expresan las entradas que cada cálculo necesita. La interfaz State histórica sigue siendo amplia: no se cambió para resolver un requisito de mora.

**D — inversión de dependencias.** La calculadora depende del tipo `PoliticaMora`. Las implementaciones se construyen en `resolverPolitica`; `consultarMora` actúa como composición de aplicación. `presentadores-p2.ts` depende de resultados del núcleo y Zod, nunca a la inversa. No aparecen dependencias HTTP/DB/UI. Las políticas importan por tipo `DiasAtraso` de la calculadora histórica; la plana reutiliza el validador de tasa allí definido. Esto conserva una dependencia concreta heredada que podría extraerse en otra fase.

## GRASP

| Principio | Asignación y evidencia |
|---|---|
| Experto en Información | Políticas conocen sus tasas; `Dinero` conoce moneda y redondeo; `DevengoInteres` conoce último corte y suspenso; cartera recibe la fotografía completa |
| Polimorfismo | `CalculadoraMora.calcular` invoca la interfaz común; contrato de tres estrategias y State con override de cancelación |
| Bajo Acoplamiento | Cálculos puros sin almacenamiento, fechas recibidas, catálogo fuera del motor y presentación fuera del dominio |
| Alta Cohesión | Archivos separados para gasto, contabilidad, clasificación y agregación; pruebas nombradas por responsabilidad |

## Fricciones y deuda sin ocultar

1. Fachada P1 de tasa libre conserva fórmula sin tope/congelación. Las entradas P2 deben usar motor inyectado o `consultarMora`; no se eliminó la API histórica.
2. `Credito.cancelar` conserva booleanos por compatibilidad. La entrada P2 usa `Dinero`, pero el llamador todavía debe calcular el saldo total y el número de cuotas pendientes correctamente.
3. La clasificación >120 y la declaración contable son conceptos distintos. No se automatiza una baja sin evidencia/autorización; el cálculo sí se congela automáticamente. Activos todavía no declarados permanecen en VENCIDO del riesgo.
4. Gasto/devengo son funciones o estados puros; el llamador debe conservar la nueva fotografía. Persistencia atómica, concurrencia y coordinación entre regularización contable y State no se simulan como implementadas.
5. Devengo recibe movimientos incrementales fechados y no deduce la distribución temporal de un importe acumulado. Rechaza cortes anteriores al último en vez de implementar correcciones retroactivas; el replay soportado es el último corte.
6. El catálogo tiene dos versiones cerradas en código, no edición administrativa. No se inventa una fecha de vigencia inicial ni un firmante humano para P1.
7. Los porcentajes por tramo se concilian por restos mayores; una fila puede diferir una centésima de su redondeo aislado. La documentación lo explica para futuros consumidores.
8. Algunos diagramas P1 describen entidades y puertos futuros. El diagrama State se alinea con clases implementadas y el paquete P2 de clases se identifica expresamente; no se presenta todo el modelo conceptual como código ejecutable.
9. Hay duplicación pequeña del conjunto de estados activos entre cartera P1 y el nuevo desglose, retenida para no modificar la operación histórica; pruebas de exclusión y oráculos vigilan su coherencia.
