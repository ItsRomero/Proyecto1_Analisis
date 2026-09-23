import re, os
R=os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')) + '/'
OUT='docs/proyecto2/documentacion-completa.md'
files=[('docs/proyecto2/historial-cambios.md','Historial de commits y cambios'),
 ('docs/proyecto2/e1-investigacion-usuario.md','E1 · Investigación de usuario'),
 ('docs/proyecto2/e2-arquitectura-informacion.md','E2 · Arquitectura de información y wireframes'),
 ('docs/proyecto2/e4-decision-movil-web.md','E4 · Decisión móvil/web'),
 ('docs/informe-impacto-solid.md','E6 · Informe de impacto SOLID'),
 ('docs/adr/ADR-004-politica-mora-escalonada.md','E6 · ADR-004'),
 ('docs/proyecto2/e6-01-auditoria-inicial.md','E6 · Auditoría inicial'),
 ('docs/proyecto2/e6-02-evolucion-nucleo.md','E6 · Evolución del núcleo'),
 ('docs/proyecto2/e6-04-validacion-final.md','E6 · Validación final'),
 ('docs/proyecto2/e6-03-pruebas-mora-escalonada.md','Anexo A · Pruebas de mora escalonada'),
 ('docs/proyecto2/e1-instrumentos-investigacion.md','Anexo B · Instrumentos de investigación')]
outdir=os.path.dirname(OUT)
def rebase(src,text):
    sd=os.path.dirname(src)
    def f(m):
        pre,txt,link,anc=m.group(1),m.group(2),m.group(3),m.group(4) or ''
        if link.startswith(('http','#','mailto')): return m.group(0)
        p=os.path.normpath(os.path.join(sd,link))
        return f'{pre}[{txt}]({os.path.relpath(p,outdir)}{anc})'
    return re.sub(r'(!?)\[([^\]]*)\]\(([^)#\s]+)(#[^)]*)?\)',f,text)
parts=["# Proyecto 2 · Documentación completa\n",
"Sistema de Gestión de Microcrédito — Crédito Vecino, S. A. · Análisis de Sistemas II (037) · Universidad Mariano Gálvez de Guatemala.\n",
"Integrantes: Christopher David Herrera Pérez · Erwin Alberto Ramírez Racancoj · Gabriela Elízabeth Noemí Aguilar Vásquez · Oliver Fernando Romero Esquite.\n",
"Repositorio: https://github.com/ItsRomero/Proyecto1_Analisis\n",
"> Este archivo **se genera** uniendo los documentos individuales del repositorio, en el orden del índice. Si se corrige algo, se corrige en el documento de origen (indicado al inicio de cada parte) y se vuelve a generar este archivo.\n",
"## Índice\n"]
for i,(f,t) in enumerate(files,1):
    parts.append(f"{i}. [{t}](#parte-{i})")
parts.append("\n")
for i,(f,t) in enumerate(files,1):
    s=open(R+f,encoding='utf-8').read()
    s=rebase(f,s)
    s=re.sub(r'^(#{1,5}) ',lambda m:'#'+m.group(1)+' ',s,flags=re.M)  # demote
    parts.append(f'\n---\n\n<a id="parte-{i}"></a>\n\n# Parte {i} · {t}\n\n*Documento de origen: `{f}`*\n\n{s.strip()}\n')
open(R+OUT,'w',encoding='utf-8').write('\n'.join(parts))
print(sum(len(p) for p in parts))
