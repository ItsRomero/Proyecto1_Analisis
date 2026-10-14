"""Skeletons de la vista del cliente (prototipo de Figma Make «Prototipo Cliente»).

Fuente: https://www.figma.com/make/3P7qsVBkFW6B9SShgQEBoz/Prototipo-Cliente
Las medidas se tomaron del prototipo (contenedor móvil de 390 px) y están en
datos/prototipo-cliente.txt. Este script solo dibuja bloques: es baja fidelidad.

Uso: python3 generar_skeletons_cliente.py  ->  skeleton/C0x-*.svg
"""
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
DATOS = os.path.join(AQUI, "datos", "prototipo-cliente.txt")

NOMBRES = {
    "C01": ("C01-inicio", "Inicio · Mi crédito"),
    "C02": ("C02-detalle-credito", "Mi crédito en detalle"),
    "C03": ("C03-plan-cuotas", "Plan de cuotas"),
    "C04": ("C04-entender-atraso", "Entendiendo tu atraso"),
    "C05": ("C05-aviso", "Aviso de cambio de etapa"),
    "C06": ("C06-ayuda", "Ayuda · preguntas frecuentes"),
}

OSCUROS = {"0f172a", "ea580c", "16a34a", "ca8a04", "dc2626", "f59e0b"}
CLAROS = {"fff7ed", "f1f5f9", "dcfce7", "f7f8f9"}


def relleno(c):
    if c in ("-", ""):
        return "none"
    if c == "ffffff":
        return "#FFFFFF"
    if c == "e2e8f0":
        return "#EEF0F2"
    if c in OSCUROS:
        return "#8C939C"
    if c in CLAROS:
        return "#E5E7EB"
    return "#E5E7EB"


def leer():
    pantallas, actual = {}, None
    for linea in open(DATOS, encoding="utf-8"):
        linea = linea.strip()
        if not linea or (linea.startswith("#") and not linea[1:4].startswith("C0")):
            continue
        if linea.startswith("#C0"):
            actual = linea[1:4]
            pantallas[actual] = {"H": 0, "el": []}
        elif linea.startswith("H="):
            pantallas[actual]["H"] = int(linea[2:])
        elif linea.startswith("@FILAS"):
            _, y0, paso, n, tipos = linea.split(" ")
            colores = [c for t in tipos.split(",") for c in [t.split(":")[0]] * int(t.split(":")[1])]
            for k in range(int(n)):
                y = int(y0) + k * int(paso)
                pantallas[actual]["el"] += [
                    ["b", 16, y, 358, 52, "ffffff", "-", 18, ""],
                    ["b", 54, y + 12, 28, 28, colores[k], "-", 99, ""],
                    ["t", 118, y + 18, 70, 15, 0, 12, "m"],
                    ["t", 202, y + 18, 71, 17, 1, 14, "0f172a"],
                    ["t", 300, y + 18, 62, 15, 1, 12, "0f172a"],
                ]
        else:
            p = linea.split(",")
            pantallas[actual]["el"].append([p[0]] + [int(v) for v in p[1:5]] + p[5:])
    return pantallas


def svg(codigo, datos):
    nombre, titulo = NOMBRES[codigo]
    W, H = 390, datos["H"]
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W + 40}" height="{H + 70}" viewBox="0 0 {W + 40} {H + 70}" '
           f'font-family="Inter, Arial, sans-serif">',
           '<rect width="100%" height="100%" fill="#FFFFFF"/>',
           f'<text x="20" y="24" font-size="15" font-weight="700" fill="#1F2937">{codigo} · {titulo}</text>',
           '<text x="20" y="40" font-size="11" fill="#6B7280">Móvil 390 px · skeleton · vista del cliente (usuario) del prototipo de Figma</text>',
           f'<g transform="translate(20,50)"><rect width="{W}" height="{H}" rx="18" fill="#EEF0F2" stroke="#D5D9DE"/>',
           f'<clipPath id="c{codigo}"><rect width="{W}" height="{H}" rx="18"/></clipPath><g clip-path="url(#c{codigo})">']
    for e in datos["el"]:
        if e[0] == "b":
            _, x, y, w, h, fill, borde, r, tipo = e[:9]
            r = min(int(r), h / 2, w / 2)
            if tipo == "svg":
                out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{min(w, h) / 2}" fill="#B5BBC2"/>')
                continue
            if x == 0 and y == 0 and w == W and h == H:
                continue
            st = ' stroke="#C5CAD0" stroke-width="1.2"' if borde not in ("-", "") else ""
            out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{relleno(fill)}"{st}/>')
        else:
            _, x, y, w, h, negrita, tam, color = e[:8]
            lineas = max(1, round(h / (int(tam) * 1.35)))
            alto_linea = h / lineas
            bh = max(5, round(int(tam) * 0.55))
            c = "#F3F4F6" if color == "ffffff" else ("#9AA1AA" if negrita == "1" else "#D0D4D9")
            for k in range(lineas):
                ww = w if k < lineas - 1 or lineas == 1 else w * 0.6
                yy = y + k * alto_linea + (alto_linea - bh) / 2
                out.append(f'<rect x="{x}" y="{yy:.1f}" width="{ww:.0f}" height="{bh}" rx="{bh / 2}" fill="{c}"/>')
    out.append("</g></g></svg>")
    return nombre, "\n".join(out)


if __name__ == "__main__":
    d = os.path.join(AQUI, "skeleton")
    os.makedirs(d, exist_ok=True)
    for codigo, datos in leer().items():
        nombre, contenido = svg(codigo, datos)
        open(os.path.join(d, nombre + ".svg"), "w", encoding="utf-8").write(contenido)
        print("skeleton", nombre)
