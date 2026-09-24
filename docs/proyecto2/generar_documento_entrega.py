"""Genera docs/proyecto2/P2-documento-entrega.md a partir de la plantilla
fuente-documento-entrega.md y de los documentos del repositorio.

Uso:  python3 docs/proyecto2/generar_documento_entrega.py
"""
import os
import re

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PLANTILLA = "docs/proyecto2/fuente-documento-entrega.md"
SALIDA = "docs/proyecto2/P2-documento-entrega.md"

# Referencias internas de cada documento que cambian al renumerarlo dentro del documento de entrega.
REFERENCIAS = {
    "docs/proyecto2/e1-investigacion-usuario.md": [
        ("Momento crítico MC-4 (sección 4)", "Momento crítico MC-4 (§2.4.1)"),
        ("(ver E2, sección 5)", "(ver §3.5)"),
        ("(ver 4.1)", "(ver §2.4.1)"),
        ("E4 §4", "§5.4"), ("E2 §5", "§3.5"), ("E4 §3", "§5.3"),
    ],
    "docs/proyecto2/e2-arquitectura-informacion.md": [
        ("(E1, §2.3)", "(§2.2.3)"), ("(§5.3)", "(§3.5.3)"), ("Ver §5.3", "Ver §3.5.3"),
    ],
    "docs/proyecto2/e4-decision-movil-web.md": [
        ("(sección 4)", "(§5.4)"), ("(§4.2)", "(§5.4.2)"),
    ],
    "docs/informe-impacto-solid.md": [
        ("en commits separados por fase (sección 4.2)", "en commits separados por fase (ver la sección 8.2)"),
        ("E2 §3.2", "@@REF_E2@@"),
        (re.compile(r"§(\d)"), r"§7.2.\1"),
        ("@@REF_E2@@", "§3.3.2"),
    ],
}

ENCABEZADOS_A_QUITAR = (
    "Proyecto 2 · Crédito Vecino, S. A. · Análisis de Sistemas II (037)",
    "Crédito Vecino, S. A. · Análisis de Sistemas II (037)",
    "> Este documento sustituye al antiguo",
    "Este documento responde al entregable",
)


def rebasar_enlaces(texto, origen):
    """Convierte enlaces relativos del documento de origen en relativos a docs/proyecto2/."""
    dir_origen = os.path.dirname(origen)
    dir_salida = os.path.dirname(SALIDA)

    def cambiar(m):
        imagen, texto_enlace, destino, ancla = m.group(1), m.group(2), m.group(3), m.group(4) or ""
        if destino.startswith(("http", "#", "mailto")):
            return m.group(0)
        ruta = os.path.normpath(os.path.join(dir_origen, destino))
        return f"{imagen}[{texto_enlace}]({os.path.relpath(ruta, dir_salida)}{ancla})"

    return re.sub(r"(!?)\[([^\]]*)\]\(([^)#\s]+)(#[^)]*)?\)", cambiar, texto)


def incluir(ruta, capitulo, nivel):
    texto = open(os.path.join(RAIZ, ruta), encoding="utf-8").read()
    for viejo, nuevo in REFERENCIAS.get(ruta, []):
        texto = viejo.sub(nuevo, texto) if hasattr(viejo, "sub") else texto.replace(viejo, nuevo)
    lineas = []
    titulo_quitado = False
    ultimo = 0
    en_codigo = False
    for linea in texto.split("\n"):
        if linea.startswith("```"):
            en_codigo = not en_codigo
        if en_codigo:
            lineas.append(linea)
            continue
        if not titulo_quitado and linea.startswith("# "):
            titulo_quitado = True
            continue
        if linea.startswith(ENCABEZADOS_A_QUITAR):
            continue
        m = re.match(r"^(#{2,6}) (.*)$", linea)
        if m:
            profundidad = len(m.group(1)) - 2  # 0 para "##"
            resto = m.group(2)
            num = re.match(r"^(\d+(?:\.\d+)*)\.? (.*)$", resto)
            marcas = "#" * (nivel + profundidad)
            if num:
                if profundidad == 0:
                    ultimo = int(num.group(1).split(".")[0])
                linea = f"{marcas} {capitulo}.{num.group(1)} {num.group(2)}"
            elif profundidad == 0:
                ultimo += 1
                linea = f"{marcas} {capitulo}.{ultimo} {resto}"
            else:
                linea = f"{marcas} {resto}"
        lineas.append(linea)
    return rebasar_enlaces("\n".join(lineas).strip(), ruta)


TITULOS = {
    "P01": "Iniciar sesión", "P02": "Mis Clientes", "P03": "Mi perfil",
    "P04": "Nueva solicitud (paso 1)", "P05": "Simulación de pago (paso 2)",
    "P06": "Confirmar solicitud (paso 3)", "P07": "Solicitud enviada",
    "P08": "Detalle del crédito", "P09": "Plan de amortización",
    "P10": "Detalle de mora", "P11": "Registrar pago", "P12": "Confirmar pago",
    "P13": "Pago aplicado", "P14": "Sin señal",
    "G01": "Alta de cliente (guía)", "G02": "Confirmación de desembolso (guía)",
    "G03": "Bandeja del comité (guía)", "G04": "Tablero gerencial (guía)",
    "G05": "Créditos de un tramo (guía)", "G06": "Cierre diario / mensual (guía)",
    "G07": "Tablero en teléfono (guía)",
    "W01": "Dashboard (web)", "W02": "Cartera (web)", "W03": "Clientes (web)",
}


def galeria():
    carpeta = os.path.join(RAIZ, "docs/proyecto2/wireframes/anotado")
    items = ["![Mapa de navegación](wireframes/mapa-navegacion.svg)\n"]
    nombres = [n for n in os.listdir(carpeta) if re.match(r"[PG]\d\d-.*\.svg$", n)]
    # Primero las pantallas de Figma (P), luego las guías (G).
    for nombre in sorted(nombres, key=lambda n: (n[0] != "P", n)):
        titulo = TITULOS.get(nombre[:3], nombre[4:-4].replace("-", " "))
        items.append(f"![{nombre[:3]} · {titulo}](wireframes/anotado/{nombre})\n")
    return "\n".join(items)


def main():
    plantilla = open(os.path.join(RAIZ, PLANTILLA), encoding="utf-8").read()
    plantilla = re.sub(r"<!--.*?-->\n", "", plantilla, count=1, flags=re.S)

    def reemplazar(m):
        ruta, capitulo, nivel = m.group(1).split("|")
        return incluir(ruta, capitulo, int(nivel))

    salida = re.sub(r"\{\{INCLUDE:([^}]+)\}\}", reemplazar, plantilla)
    salida = salida.replace("{{WIREFRAMES}}", galeria())
    aviso = ("<!-- Archivo generado por generar_documento_entrega.py a partir de "
             "fuente-documento-entrega.md. No editar a mano. -->\n")
    open(os.path.join(RAIZ, SALIDA), "w", encoding="utf-8").write(aviso + salida)
    print(f"{SALIDA}: {len(salida.split())} palabras")


if __name__ == "__main__":
    main()
