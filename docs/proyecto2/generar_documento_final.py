"""Genera P2-documento-final.md: el documento de entrega con los complementos
insertados en el lugar que les corresponde.

Orden de la fusión
  Cap. 3 (E2)  §3.3.3–3.3.4  diagrama y tabla de los 18 casos de uso
               §3.4.3        qué va en cada bloque de los wireframes
  Cap. 5 (E4)  §5.6          ADR-005 (PWA con trabajo sin conexión)
  Cap. 7 (E6)  §7.3          ADR-004 (políticas moratorias coexistentes)
  Cap. 8 (E7)  §8.1          repositorio con hipervínculos a GitHub
               §8.2.1        tabla de commits con hipervínculos
               §8.4          catálogo de ADR del proyecto
  Anexo A      skeleton y wireframe anotado de cada pantalla, lado a lado

Uso: python3 generar_documento_final.py   (después de generar_documento_entrega.py
y generar_complementos.py)
"""
import os
import re

AQUI = os.path.dirname(os.path.abspath(__file__))
ent = open(os.path.join(AQUI, "P2-documento-entrega.md"), encoding="utf-8").read()
comp = open(os.path.join(AQUI, "P2-complementos.md"), encoding="utf-8").read()
ent = re.sub(r"^<!--.*?-->\n", "", ent, flags=re.S)


def seccion(texto, inicio, fin):
    """Texto entre la línea que empieza con `inicio` y la que empieza con `fin`."""
    i = texto.index("\n" + inicio) + 1
    j = texto.index("\n" + fin, i) + 1
    return texto[i:j]


def cuerpo(bloque):
    """Quita la línea de título y los separadores horizontales."""
    bloque = bloque.split("\n", 1)[1]
    return re.sub(r"\n---\n", "\n", bloque).strip() + "\n"


def filas(tabla_md):
    return [l for l in tabla_md.splitlines() if l.startswith("| ") and not l.startswith("| #") and not l.startswith("|---")]


def celdas(fila):
    return [c.strip() for c in fila.strip().strip("|").split(" | ")]


# ---------------- piezas de los complementos ----------------
c_diag = cuerpo(seccion(comp, "### 2.1 Diagrama", "### 2.2"))
c_diag = c_diag.replace("Complementa la tabla 6.1 del capítulo 3", "Complementa la tabla 6.1 de la sección 3.3.1")
c_cu = cuerpo(seccion(comp, "### 2.2 Los 18", "## 3. Registros"))
c_bloques = cuerpo(seccion(comp, "### 1.2 Qué va en cada bloque", "### 1.3"))
c_galeria = cuerpo(seccion(comp, "### 1.3 Skeleton", "## 2. Casos de uso"))
c_adr_intro = seccion(comp, "## 3. Registros", "### 3.1")
c_adr_tabla = "\n".join(l for l in c_adr_intro.splitlines() if l.startswith("|")) + "\n"
c_adr4 = seccion(comp, "### 3.1 ADR-004", "### 3.2")
c_adr5 = seccion(comp, "### 3.2 ADR-005", "## 4. Repositorio")
c_repo = cuerpo(seccion(comp, "### 4.1 Cómo se organizó", "### 4.2"))
c_hist = comp[comp.index("### 4.2 Historial"):]
nota_uno = re.search(r"^> ¹ Los enlaces marcados.*$", comp, flags=re.M).group(0)


def adr_numerado(bloque, numero, nivel):
    """Convierte el ADR del complemento en una sección numerada del documento."""
    lineas = bloque.strip().splitlines()
    titulo = re.sub(r"^### 3\.\d ", "", lineas[0])
    sub = "#" * (nivel + 1)
    salida, k = [f"{'#' * nivel} {numero} {titulo}"], 0
    for l in lineas[1:]:
        if l.startswith("#### "):
            k += 1
            l = f"{sub} {numero}.{k} {l[5:]}"
        salida.append(l)
    texto = "\n".join(salida)
    return re.sub(r"\n---\s*$", "", texto).rstrip() + "\n\n"


# ---------------- tabla de commits: descripción del documento + enlaces ----------------
t_ent = seccion(ent, "### 8.2.1 Tabla de commits", "**Totales desde")
desc = {}
for f in filas(t_ent):
    c = celdas(f)
    h = re.sub(r"[`*¹ ]", "", c[2])
    if re.fullmatch(r"[0-9a-f]{7}", h):
        desc[h] = c
t_comp = c_hist[c_hist.index("| # |"):]
t_comp = t_comp[: t_comp.index("\n\n")]
nuevas = []
for f in filas(t_comp):
    c = celdas(f)
    h = re.sub(r"[`\[\]¹ ]", "", c[2]).split("(")[0]
    if h in desc:  # la redacción del documento de entrega es más detallada
        d = desc[h]
        c[3], c[4], c[5], c[6] = d[3], d[4] or c[4], d[5] or c[5], d[6]
    if "¹" in c[2] and "IA declarada" not in c[3]:
        c[3] += " · IA declarada"
    c[6] = c[6].replace(" (este archivo)", "")
    nuevas.append("| " + " | ".join(c) + " |")
ultimo = len(nuevas) - 1  # la fila base no lleva número
nuevas.append(f"| {ultimo} | 23/09 | *(este documento)* | Oliver Romero · IA declarada | Documentación | E1–E7 | "
              "**Documento final:** une la entrega, los complementos y el panel gerencial web; E3 y E5 actualizados con los dos prototipos, portada e índice | "
              "`P2-documento-final.md`, `generar_documento_final.py` | — |")
cab = "| # | Fecha | Commit | Autor (Git) | Tipo | Entregable | Qué se hizo | Archivos principales (GitHub) | Cambio |\n|---|---|---|---|---|---|---|---|---|\n"
tabla_commits = cab + "\n".join(nuevas) + "\n"
nota_hash = re.search(r"^> ¹ Commit de la rama.*$", c_hist, flags=re.M).group(0)
comparacion = re.search(r"^\*\*Comparación completa.*$", c_hist, flags=re.M).group(0)

# ---------------- fusión ----------------
doc = ent

# Cap. 1: cómo leer
doc = doc.replace(
    "La sección 8.2 presenta en una tabla ordenada **todos los commits**",
    "Este documento ya incluye los complementos (casos de uso, skeletons, ADR e hipervínculos a GitHub) en el capítulo al que "
    "pertenece cada uno. La sección 8.2 presenta en una tabla ordenada **todos los commits**")

# Cap. 3: casos de uso después de §3.3.2
doc = doc.replace("\n## 3.4 Wireframes de baja fidelidad",
                  "\n### 3.3.3 Diagrama de casos de uso\n\n" + c_diag +
                  "\n### 3.3.4 Los 18 casos de uso del P1 y su pantalla\n\n" + c_cu +
                  "\n## 3.4 Wireframes de baja fidelidad", 1)

# Cap. 3: tablas de wireframes sin imágenes (las figuras van en el Anexo A) + qué va en cada bloque
doc = doc.replace("| Skeleton | Anotado |\n|---|---|---|---|---|\n", "| Figura |\n|---|---|---|---|\n")
doc = doc.replace("| Skeleton | Anotado |\n|---|---|---|---|---|---|\n", "| Figura |\n|---|---|---|---|---|\n")
doc = re.sub(r"\| !\[([PG]\d\d)\]\(wireframes/skeleton/[^)]+\) \| !\[[PG]\d\d\]\(wireframes/anotado/[^)]+\) \|",
             r"| Anexo A · \1 |", doc)
i = doc.index("\n### 3.4.3 ")
doc = doc[:i] + "\n### 3.4.3 Qué va en cada bloque\n\n" + c_bloques + doc[i:]
doc = re.sub(r"\n### 3\.4\.3 (La pantalla difícil)", r"\n### 3.4.4 \1", doc)

# Cap. 3: panel gerencial web (W01–W03) como §3.4.5
web = open(os.path.join(AQUI, "P2-panel-gerencial-web.md"), encoding="utf-8").read()
def bloque(t, ini, fin):
    i = t.index(ini); j = t.index(fin, i)
    return t[i:j].split("\n", 1)[1].strip()
w_tabla = bloque(web, "## 1. Qué agrega", "**Dónde va en el documento final:**")
w_tabla = w_tabla[w_tabla.index("| Código |"):].strip()
w_rel = re.search(r"^\*\*Relación con las guías del E2\.\*\*.*$", web, flags=re.M).group(0)
w_rel = w_rel.replace("las diferencias están en la sección 5", "las diferencias están en la sección 3.4.5.5")
secciones = [
    ("3.4.5.1", "W01 · Dashboard (tablero gerencial)", bloque(web, "### 2.3 Qué va en cada bloque", "\n---")),
    ("3.4.5.2", "W02 · Cartera de créditos", bloque(web, "### 3.3 Qué va en cada bloque", "\n---")),
    ("3.4.5.3", "W03 · Clientes (lista y ficha)", bloque(web, "### 4.3 Qué va en cada bloque", "\n---")),
    ("3.4.5.4", "Cifras verificadas", bloque(web, "### 5.1 Cifras verificadas", "### 5.2")),
    ("3.4.5.5", "Ajustes pendientes", bloque(web, "### 5.2 Ajustes pendientes", "\n---")),
]
panel_md = ("### 3.4.5 Panel gerencial web (W01–W03)\n\n"
            "El prototipo web de Figma Make agrega las pantallas de escritorio del panel gerencial. Sus skeletons y wireframes "
            "anotados se midieron del prototipo a 1440 px (script `wireframes/generar_wireframes_web.py`) y están en el Anexo A.\n\n"
            + w_tabla + "\n\n" + w_rel + "\n\n"
            + "\n\n".join(f"#### {n} {t}\n\n{c}" for n, t, c in secciones) + "\n\n")
i = doc.index("\n## 3.5 ")
doc = doc[:i] + "\n" + panel_md + doc[i + 1:]

# Cap. 5: ADR-005 antes de las referencias
doc = doc.replace("\n## 5.6 Referencias", "\n" + adr_numerado(c_adr5, "5.6", 2) + "## 5.7 Referencias", 1)

# Cap. 7: ADR-004 al final del capítulo
i = doc.index("\n# 8. E7")
j = doc.rindex("\n---\n", 0, i)
doc = doc[:j] + "\n\n" + adr_numerado(c_adr4, "7.3", 2) + doc[j:]

# Cap. 8: repositorio con enlaces
a = doc.index("| Prefijo | Entregable | Archivos |")
b = doc.index("\n\n", a)
doc = doc[:a] + c_repo.strip().split("\n\n")[0] + "\n\n" + nota_uno + doc[b:]

# Cap. 8: tabla de commits con enlaces
a = doc.index("| # | Fecha | Commit |")
b = doc.index("\n\n", a)
doc = doc[:a] + tabla_commits.rstrip() + "\n\n" + nota_hash + "\n\n" + comparacion + doc[b:]
doc = re.sub(r"> \*\*Nota sobre los hashes\.\*\*.*\n", "", doc)
doc = doc.replace("| 12 – 18 |", f"| 12 – {ultimo} |")

# Cap. 8: catálogo de ADR
i = doc.index("\n# 9. Reparto")
j = doc.rindex("\n---\n", 0, i)
doc = (doc[:j] + "\n\n## 8.4 Registros de decisiones de arquitectura (ADR)\n\n"
       "Un ADR registra una decisión de arquitectura con su contexto, las alternativas descartadas y sus consecuencias. "
       "El proyecto tiene cinco; los dos del Proyecto 2 están completos en las secciones 5.6 (ADR-005) y 7.3 (ADR-004).\n\n"
       + c_adr_tabla + doc[j:])

# Anexo A: skeleton y anotado lado a lado (hasta el Anexo B, que se conserva)
a = doc.index("# Anexo A")
b = doc.index("# Anexo B")
doc = (doc[:a] + "# Anexo A · Wireframes de baja fidelidad\n\n"
       "Cada pantalla aparece dos veces, a partir de la misma descripción: a la izquierda el **skeleton** (solo bloques) y a la "
       "derecha el **wireframe anotado** (textos, cifras del núcleo y notas numeradas). Primero van las 14 pantallas del "
       "prototipo móvil de Figma (P01–P14), después las 7 guías (G01–G07) y al final las tres pantallas de escritorio del "
       "panel gerencial web (W01–W03); en las pantallas de escritorio el skeleton va arriba y el anotado abajo. Las convenciones y el "
       "contenido de cada bloque están en las secciones 3.4.3 y 3.4.5.\n\n"
       "![Mapa de navegación](wireframes/mapa-navegacion.svg)\n\n"
       + c_galeria.replace("A la izquierda, el skeleton; a la derecha, el wireframe anotado de la misma pantalla.\n\n", "").rstrip()
       + "\n\n---\n\n" + doc[b:])

doc = re.sub(r"\n{3,}", "\n\n", doc)
aviso = "<!-- Archivo generado por generar_documento_final.py a partir de P2-documento-entrega.md y P2-complementos.md. No editar a mano. -->\n"
open(os.path.join(AQUI, "P2-documento-final.md"), "w", encoding="utf-8").write(aviso + doc)
print("P2-documento-final.md:", len(doc.split()), "palabras")
