import subprocess, os, re
R=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..'))
GH='https://github.com/ItsRomero/Proyecto1_Analisis'
def g(*a): return subprocess.check_output(['git','-C',R,*a],text=True).strip()
publicados=set(g('rev-list','13aa167').split())
commits=g('rev-list','--reverse','8737d9b..HEAD').split()
info={
 '71a5179':('Auditoría','E6','Auditoría inicial y línea base del P1: 7 archivos de dominio y 206 pruebas; se crea la etiqueta entrega-p1'),
 'ec2a436':('Funcionalidad','E6 · CP-01','Puerto PoliticaMora, políticas plana/escalonada/retroactiva, catálogo por fecha de otorgamiento y Specification de tramo; se abre el motor para inyectar la política'),
 'd3b30f5':('Funcionalidad','E6 · CP-02','Gasto de gestión de cobro de Q25.00 al día 31, idempotente por cuota'),
 '5752b55':('Funcionalidad','E6 · CP-04','Transición en_mora → cancelado, suspensión del devengo y cartera en riesgo por tramo'),
 '0d6c1a9':('Pruebas','E6 · CP-03','Contrato común contra las tres políticas (Liskov), regresión integrada y caso de uso consultarMora; corte del núcleo medido'),
 '958e70f':('Documentación','E6','ADR-004, informe SOLID inicial, UML, contratos Zod/OpenAPI y documento móvil inicial'),
 '8112e57':('Validación','E6','Validación desde instalación limpia: 263 pruebas en 18 archivos'),
 '5e73d12':('Herramientas','E6','Seis comandos de prueba por tema en package.json'),
 '9e06c37':('Documentación','E6','Documento de pruebas de la mora escalonada e informe de verificación SOLID'),
 '8e421a6':('Integración','—','Sincronización de la rama local con la remota'),
 '183dc71':('Integración','E6 · E7','Pull Request #1: integra la evolución del núcleo en main'),
 '13aa167':('Documentación','E7','README: tabla de comandos de prueba por tema'),
 '16f983f':('Documentación','E1 · E2 · E4 · E6','E1, E2, E4, 15 wireframes, informe SOLID según el Anexo D y documentos renombrados por entregable'),
 '4ba9e55':('Documentación','E7','Historial de cambios y documento técnico consolidado'),
 '00709f9':('Documentación','E3 · E5 · E7','Enlace de Figma, revisión del prototipo y evaluación E5 preliminar'),
 '8486b6e':('Documentación','E1–E7','Documento de entrega unificado, generado desde los documentos del repositorio'),
 '53689ef':('Documentación','E2 · E6','Wireframes skeleton, diagrama de casos de uso y ADR-005 (PWA)'),
}
def principales(h):
    fs=g('show','--name-status','--format=','-m','--first-parent',h).split('\n')
    out=[]
    for l in fs:
        if not l.strip(): continue
        parts=l.split('\t'); st=parts[0][0]; p=parts[-1]
        if st=='D': continue
        if re.search(r'wireframes/(W|S)\d\d|\.svg$|package-lock',p): continue
        out.append(p)
    return sorted(out,key=lambda p:(0 if p.startswith('src/') else 1 if p.startswith('tests/') else 2, p))
filas=[]
for i,h in enumerate(commits):
    short=h[:7]; full=h
    fecha,autor,msg=g('log','-1','--format=%ad|%an|%s','--date=format:%d/%m',h).split('|',2)
    stat=g('show','--shortstat','--format=','-m','--first-parent',h).split('\n')[-1].strip()
    stat=re.sub(r' files? changed','',stat).replace(' insertions(+)','').replace(' insertion(+)','').replace(' deletions(-)','').replace(' deletion(-)','')
    parts=[x.strip() for x in stat.split(',')]
    cambio=f"{parts[0]} arch. · +{parts[1]}" + (f" / −{parts[2]}" if len(parts)>2 else "")
    tipo,ent,que=info.get(short,('','',msg))
    pub=h in publicados
    ref=full if pub else 'main'
    arch=principales(h)
    extra=len(arch)-5
    links=' · '.join(f"[`{os.path.basename(p)}`]({GH}/blob/{ref}/{p})" for p in arch[:5])
    if extra>0: links+=f" · y {extra} más"
    clink=f"[`{short}`]({GH}/commit/{full})" if pub else f"`{short}` ¹"
    filas.append(f"| {i} | {fecha} | {clink} | {autor} | {tipo} | {ent} | {que} | {links or '—'} | {cambio} |")
tabla='\n'.join(filas)



# ---------- documento complementario ----------
en_main=set(g('ls-tree','-r','--name-only','13aa167').split('\n'))
def L(p, texto=None):
    t=texto or os.path.basename(p)
    marca='' if p in en_main or p.rstrip('/') in {os.path.dirname(x) for x in en_main} else ' ¹'
    return f"[`{t}`]({GH}/{'tree' if p.endswith('/') else 'blob'}/main/{p.rstrip('/')}){marca}"
adr4=open(f'{R}/docs/adr/ADR-004-politica-mora-escalonada.md',encoding='utf-8').read()
adr5=open(f'{R}/docs/adr/ADR-005-pwa-trabajo-sin-conexion.md',encoding='utf-8').read()
def demote(t,n=2):
    t=re.sub(r'^(#+) ',lambda m:'#'*(len(m.group(1))+n)+' ',t,flags=re.M)
    return t
sk=[('S01','Ruta del día','Aviso de conexión arriba; tarjetas de cliente (avatar, nombre, estado, etiqueta de tramo); barra de pestañas','W01','CU-15'),
('S02','Buscar cliente o crédito','Campo de búsqueda; lista de resultados; enlace para registrar cliente nuevo','W02','CU-15'),
('S03','Alta de cliente','Foto del DPI; campos DPI, nombre y teléfono; aviso "guardado en el teléfono"; botón continuar','W03','CU-01'),
('S04','Solicitud de crédito','Monto grande con límites; plazo en botones; destino; tarjeta de cuota estimada y total','W04','CU-02'),
('S05','Plan de amortización','Tabla de 12 cuotas con la última resaltada; explicación del ajuste; confirmar o cambiar','W05','CU-02'),
('S06','Confirmación de desembolso','Resumen de condiciones; casilla de aceptación; desembolsar o volver','W06','CU-06'),
('S07','Detalle del crédito','Lo que debe hoy y días de atraso; próxima cuota, saldo y estado; aviso del siguiente tramo','W07','CU-15 · CU-08'),
('S08','Detalle de la mora','Una tarjeta por tramo (rango, tasa anual, días e importe) con barra proporcional; total redondeado una vez','W08','CU-08'),
('S09','Registro de pago','Monto recibido; atajos; prelación antes de confirmar; aviso sin señal','W09','CU-07'),
('S10','Comprobante','Estado del envío; datos del pago; aplicación por concepto y saldo; clave de operación','W10','CU-07'),
('S11','Tablero gerencial','Contexto (fecha de corte); 1 riesgo · 2 incobrables · 3 mora; 4 riesgo por tramo; actividad del período; panel del asistente','W11','CU-14'),
('S12','Créditos de un tramo','Ruta de navegación; resumen del tramo; tabla de créditos','W12','CU-14'),
('S13','Bandeja del comité','Lista de solicitudes; datos, evaluación y plan simulado; motivo; aprobar o rechazar','W13','CU-03/04/05'),
('S14','Cierre diario / mensual','Estado congelado e identificador; cifras del cierre; ejecutar con confirmación','W14','CU-12/13'),
('S15','Tablero en teléfono','Mismas tres tarjetas apiladas; riesgo por tramo en lista; asistente flotante','W15','CU-14')]
skfiles=sorted(os.listdir(f'{R}/docs/proyecto2/wireframes/skeleton'))
sk_rows='\n'.join(f"| {c} | {n} | {d} | {w} | {cu} |" for c,n,d,w,cu in sk)
sk_imgs='\n\n'.join(f"![{f[:3]} · {f[4:-4].replace('-',' ')}](wireframes/skeleton/{f})" for f in skfiles)
cus=[('CU-01','Registrar cliente','Asesora','RegistrarCliente','W03 · S03 Alta de cliente'),
('CU-02','Solicitar crédito','Asesora / cliente','SolicitarCredito','W04–W05 · S04–S05'),
('CU-03','Evaluar crédito','Analista / comité','EvaluarCredito','W13 · S13 Bandeja del comité'),
('CU-04','Aprobar solicitud','Comité','DecidirSolicitud','W13 · S13'),
('CU-05','Rechazar solicitud','Comité','DecidirSolicitud','W13 · S13'),
('CU-06','Desembolsar crédito','Encargado de desembolsos','DesembolsarCredito','W06 · S06'),
('CU-07','Registrar pago','Asesora / cajero','RegistrarPago','W09–W10 · S09–S10'),
('CU-08','Calcular mora','Gestor de cartera / proceso','CalcularMora','W08 · S08 (y W07)'),
('CU-09','Regularizar crédito','Gestor de cobros','RegistrarPago (extend)','Resultado del pago; sin pantalla propia'),
('CU-10','Reestructurar crédito','Aprobador autorizado','ReestructurarCredito','Fuera del alcance de E3 (Proyecto Final)'),
('CU-11','Declarar incobrable','Encargado autorizado','DeclararIncobrable','Fuera del alcance de E3; su efecto se ve en W11'),
('CU-12','Generar cierre diario','Financiero / proceso','GenerarCierre','W14 · S14'),
('CU-13','Generar cierre mensual','Financiero / proceso','GenerarCierre','W14 · S14'),
('CU-14','Consultar cartera en riesgo','Gerencia / riesgo','ConsultarCarteraEnRiesgo','W11, W12, W15 · S11, S12, S15'),
('CU-15','Consultar crédito e historial','Asesora / auditor / gestor','ConsultarCredito','W01, W02, W07 · S01, S02, S07'),
('CU-16','Administrar política','Administrador de políticas','AdministrarPolitica','Fuera del alcance de E3'),
('CU-17','Anular crédito aprobado','Aprobador / proceso','DecidirSolicitud','Fuera del alcance de E3'),
('CU-18','Cancelar crédito','Sistema (resultado del pago)','RegistrarPago (extend)','Sin pantalla: ocurre al dejar el saldo en Q0.00')]
cu_rows='\n'.join(f"| {a} | {b} | {c} | `{d.split(' ')[0]}`{d[len(d.split(' ')[0]):]} | {e} |" for a,b,c,d,e in cus)
repo_rows=f"""| `e1-` | Investigación de usuario | {L('docs/proyecto2/e1-investigacion-usuario.md')}, {L('docs/proyecto2/e1-instrumentos-investigacion.md')} |
| `e2-` | Arquitectura de información | {L('docs/proyecto2/e2-arquitectura-informacion.md')}, carpeta {L('docs/proyecto2/wireframes/','wireframes/')} (anotados W01–W15, {L('docs/proyecto2/wireframes/skeleton/','skeleton/')} S01–S15 y {L('docs/proyecto2/wireframes/casos-de-uso-p2.svg')}) |
| `e4-` | Decisión móvil/web | {L('docs/proyecto2/e4-decision-movil-web.md')} |
| `e6-` | Evolución del núcleo | {L('docs/proyecto2/e6-01-auditoria-inicial.md')}, {L('docs/proyecto2/e6-02-evolucion-nucleo.md')}, {L('docs/proyecto2/e6-03-pruebas-mora-escalonada.md')}, {L('docs/proyecto2/e6-04-validacion-final.md')} |
| — | Informe SOLID y ADR | {L('docs/informe-impacto-solid.md')}, {L('docs/adr/ADR-004-politica-mora-escalonada.md')}, {L('docs/adr/ADR-005-pwa-trabajo-sin-conexion.md')} |
| — | Índice e historial | {L('docs/proyecto2/README.md')}, {L('docs/proyecto2/historial-cambios.md')}, {L('docs/proyecto2/P2-documento-entrega.md')} |
| — | Núcleo y pruebas | {L('src/dominio/','src/dominio/')}, {L('tests/','tests/')} |"""
adr_rows=f"""| ADR-001 | Arquitectura hexagonal con monolito modular | P1 | Aceptada | {L('docs/adr/ADR-001-arquitectura.md')} |
| ADR-002 | Representación del dinero (`Dinero`, decimal exacto, redondeo) | P1 | Aceptada | {L('docs/adr/ADR-002-dinero.md')} |
| ADR-003 | Plan de amortización francés con ajuste final | P1 | Aceptada | {L('docs/adr/ADR-003-amortizacion.md')} |
| **ADR-004** | **Políticas moratorias coexistentes por fecha de otorgamiento** | P2 · E6 | Aceptada | {L('docs/adr/ADR-004-politica-mora-escalonada.md')} |
| **ADR-005** | **PWA con trabajo sin conexión, idempotencia y puerto Reloj** | P2 · E4 | Propuesta | {L('docs/adr/ADR-005-pwa-trabajo-sin-conexion.md')} |"""
doc=f"""# Proyecto 2 · Complementos al documento de entrega

Crédito Vecino, S. A. · Análisis de Sistemas II (037) · Repositorio: {GH}

Este documento reúne cuatro agregados solicitados después de revisar el documento de entrega. Cada sección indica **dónde insertarse** en el documento principal.

| # | Agregado | Dónde va en el documento de entrega |
|---|---|---|
| 1 | Wireframes tipo *skeleton* (E2) | Capítulo 3, después de §3.4 «Wireframes de baja fidelidad» |
| 2 | Diagrama y tabla de casos de uso | Capítulo 3, junto a §3.3 «Tabla de correspondencia pantalla ↔ caso de uso» |
| 3 | Registros de decisiones de arquitectura (ADR) | Capítulo 7 (ADR-004, E6) y capítulo 5 (ADR-005, E4) |
| 4 | Repositorio e historial de commits con hipervínculos a GitHub | Capítulo 8, reemplaza las tablas de §8.1 y §8.2.1 |

> ¹ Los enlaces marcados con **¹** apuntan a archivos que se agregaron en la rama `docs/proyecto2-ux`. Funcionarán en GitHub en cuanto esa rama se integre a `main` (`git am docs-proyecto2-ux.patch` y `git push`). Los demás enlaces ya funcionan.

---

## 1. E2 · Wireframes tipo *skeleton*

### 1.1 ¿Ya estaba el skeleton?

**No del todo.** Los wireframes W01–W15 del capítulo 3 son de baja fidelidad (escala de grises, sin color ni tipografía final), pero son **wireframes anotados**: tienen textos reales, cifras del núcleo y notas numeradas que justifican cada decisión. Un **skeleton** es un paso anterior y más abstracto: solo bloques grises que indican **dónde va cada elemento**, sin contenido. Así se discute la estructura de la pantalla sin distraerse con textos o números.

Con este agregado, el diseño queda en tres niveles, en el orden en que se produce:

| Nivel | Qué muestra | Para qué sirve | Archivos |
|---|---|---|---|
| 1 · Skeleton (S01–S15) | Solo la ubicación y el tamaño relativo de cada bloque | Acordar la estructura y la jerarquía de cada pantalla | {L('docs/proyecto2/wireframes/skeleton/','wireframes/skeleton/')} |
| 2 · Wireframe anotado (W01–W15) | Textos, cifras del núcleo y notas de diseño | Justificar decisiones (prevención de errores, WCAG, jerarquía) | {L('docs/proyecto2/wireframes/','wireframes/')} |
| 3 · Prototipo de alta fidelidad | Color, tipografía, componentes y navegación | Evaluación con usuarios (E3 y E5) | [Figma](https://www.figma.com/proto/jozM3QI8ZJ6pywdCoO5OVo/Microcr%C3%A9ditos-App?node-id=0-1&t=PJlTVLC3ASu31ttw-1) |

### 1.2 Qué va en cada bloque

| Skeleton | Pantalla | Qué indica cada bloque | Wireframe anotado | Caso de uso |
|---|---|---|---|---|
{sk_rows}

Convenciones: las barras grises son textos, los círculos son avatares o íconos, los rectángulos grandes son imágenes o gráficos, los bloques más oscuros son los elementos principales (la cifra principal, la opción elegida o el botón primario) y las etiquetas pequeñas nombran la región. El círculo de la esquina superior derecha es siempre la ayuda (WCAG 3.2.6).

### 1.3 Skeletons

{sk_imgs}

---

## 2. Casos de uso

### 2.1 Diagrama

El diagrama muestra los actores, los casos de uso del P1 que tienen pantalla en el P2 y la pantalla que los implementa. Complementa la tabla 6.1 del capítulo 3 y el diagrama completo del P1 ({L('docs/diagramas/uml/01-casos-de-uso.puml')}).

![Diagrama de casos de uso del Proyecto 2](wireframes/casos-de-uso-p2.svg)

### 2.2 Los 18 casos de uso del P1 y su pantalla

| CU | Caso de uso | Actor principal | Puerto primario (P1) | Pantalla en el P2 (anotado · skeleton) |
|---|---|---|---|---|
{cu_rows}

Ningún caso de uso **principal** queda sin pantalla (sección 6.1 del enunciado). Los que no tienen pantalla son administrativos (CU-10, CU-11, CU-16 y CU-17, previstos para el Proyecto Final) o son el resultado automático de un pago (CU-09 y CU-18). La fuente de la tabla es {L('docs/analisis/FASE-01-analisis-dominio-requisitos.md')}, sección 13.

---

## 3. Registros de decisiones de arquitectura (ADR)

Un ADR registra una decisión de arquitectura con su contexto, las alternativas descartadas y sus consecuencias. El proyecto tiene cinco:

| ADR | Decisión | Proyecto | Estado | Archivo |
|---|---|---|---|---|
{adr_rows}

### 3.1 ADR-004 · Políticas moratorias coexistentes (E6)

Es el ADR que pide el E6 («`adr/ADR-00X.md` → decisión sobre la política escalonada»).

{demote(adr4.split(chr(10),1)[1])}

### 3.2 ADR-005 · PWA con trabajo sin conexión (E4)

Registra formalmente la decisión del E4 para que el Proyecto Final la implemente.

{demote(adr5.split(chr(10),1)[1])}

---

## 4. Repositorio e historial con hipervínculos

### 4.1 Cómo se organizó el repositorio

| Prefijo | Entregable | Archivos |
|---|---|---|
{repo_rows}

### 4.2 Historial de commits

Cada hash abre el commit en GitHub con su diff completo, y cada archivo abre la versión **de ese commit**, de modo que se ve exactamente lo que se entregó en ese momento. En los commits con muchos archivos se enlazan los cinco principales.

| # | Fecha | Commit | Autor (Git) | Tipo | Entregable | Qué se hizo | Archivos principales | Cambio |
|---|---|---|---|---|---|---|---|---|
| — | 26/08 | [`8737d9b`]({GH}/commit/8737d9b782772a5cff9acb07de8d719f4f4e3a16) | — | Base | P1 | **Entrega del Proyecto 1** (etiqueta `entrega-p1`), punto de comparación | [`src/dominio/`]({GH}/tree/8737d9b782772a5cff9acb07de8d719f4f4e3a16/src/dominio) | — |
{tabla}

> ¹ Commit todavía no publicado en GitHub; sus archivos se enlazan en `main` y quedarán disponibles al integrar la rama. Al aplicar el parche, Git asigna un hash nuevo a estos commits.

**Comparación completa entre entregas:** [{GH}/compare/8737d9b...main]({GH}/compare/8737d9b...main) muestra en GitHub todos los cambios desde el Proyecto 1.
"""
open(f'{R}/docs/proyecto2/P2-complementos.md','w',encoding='utf-8').write(doc)
print(len(doc.split()))
