"""Mapa de navegación con los códigos del prototipo de Figma (P01–P14) y las guías (G01–G07).

Uso: python3 docs/proyecto2/wireframes/generar_mapa.py
"""
import os

F = "font-family='Helvetica, Arial, sans-serif'"
e = []


def caja(x, y, t, w=200, h=42, guia=False):
    d = " stroke-dasharray='6 4'" if guia else ""
    e.append(f"<rect x='{x}' y='{y}' width='{w}' height='{h}' rx='8' fill='{'#fff' if not guia else '#fafafa'}' stroke='#222' stroke-width='1.5'{d}/>")
    for i, l in enumerate(t.split("\n")):
        e.append(f"<text x='{x + w / 2}' y='{y + h / 2 + 5 + (i - (len(t.split(chr(10))) - 1) / 2) * 15}' {F} font-size='12.5' text-anchor='middle'>{l}</text>")
    return (x, y, w, h)


def flecha(p, guia=False, etq=""):
    d = " stroke-dasharray='5 4'" if guia else ""
    pts = " ".join(f"{a},{b}" for a, b in p)
    e.append(f"<polyline points='{pts}' fill='none' stroke='#222' stroke-width='1.4'{d} marker-end='url(#a)'/>")
    if etq:
        (x1, y1), (x2, y2) = p[-2], p[-1]
        e.append(f"<text x='{(x1 + x2) / 2 + 5}' y='{(y1 + y2) / 2 - 4}' {F} font-size='10.5' fill='#555'>{etq}</text>")


def abajo(a, b, guia=False, etq=""):
    flecha([(a[0] + a[2] / 2, a[1] + a[3]), (b[0] + b[2] / 2, b[1])], guia, etq)


def derecha(a, b, guia=False, etq=""):
    flecha([(a[0] + a[2], a[1] + a[3] / 2), (b[0], b[1] + b[3] / 2)], guia, etq)


for x, w, t in [(10, 700, "Asesora de crédito · móvil (prototipo de Figma)"), (720, 250, "Comité · escritorio"), (980, 300, "Gerencia · escritorio y móvil")]:
    e.append(f"<rect x='{x}' y='80' width='{w}' height='740' fill='#f4f4f4' stroke='#bbb'/>")
    e.append(f"<text x='{x + 10}' y='102' {F} font-size='13.5' font-weight='bold'>{t}</text>")

p01 = caja(560, 16, "P01 Iniciar sesión", 200, 40)
p02 = caja(30, 120, "P02 Mis Clientes")
p03 = caja(260, 120, "P03 Mi perfil", 150)
p08 = caja(30, 220, "P08 Detalle del crédito")
p09 = caja(260, 220, "P09 Plan de amortización", 190)
p10 = caja(260, 320, "P10 Detalle de mora", 190)
p11 = caja(30, 420, "P11 Registrar pago")
p12 = caja(30, 520, "P12 Confirmar pago")
p13 = caja(30, 650, "P13 Pago aplicado")
p14 = caja(260, 650, "P14 Sin señal", 190)
p04 = caja(480, 220, "P04 Nueva solicitud\n(paso 1)", 200, 48)
p05 = caja(480, 320, "P05 Simulación de pago\n(paso 2)", 200, 48)
p06 = caja(480, 420, "P06 Confirmar solicitud\n(paso 3)", 200, 48)
p07 = caja(480, 520, "P07 Solicitud enviada", 200)
g01 = caja(480, 130, "G01 Alta de cliente", 200, 42, True)
g03 = caja(740, 220, "G03 Bandeja del comité", 210, 42, True)
g02 = caja(740, 520, "G02 Confirmación\nde desembolso", 210, 48, True)
g04 = caja(1000, 150, "G04 Tablero gerencial", 260, 42, True)
g05 = caja(1000, 260, "G05 Créditos de un tramo", 260, 42, True)
g06 = caja(1000, 370, "G06 Cierre diario / mensual", 260, 42, True)
g07 = caja(1000, 480, "G07 Tablero en teléfono", 260, 42, True)

flecha([(600, 56), (600, 70), (130, 70), (130, 120)])
flecha([(700, 56), (700, 66), (845, 66), (845, 220)], True)
flecha([(730, 56), (730, 62), (1130, 62), (1130, 150)], True)
derecha(p02, p03)
abajo(p02, p08, etq="tarjeta")
derecha(p08, p09, etq="plan")
flecha([(130, 262), (130, 290), (240, 290), (240, 341), (260, 341)], etq="")
e.append(f"<text x='150' y='285' {F} font-size='10.5' fill='#555'>detalle mora</text>")
abajo(p08, p11, etq="registrar pago")
flecha([(355, 362), (355, 441), (230, 441)], etq="")
abajo(p11, p12); abajo(p12, p13, etq="con señal")
flecha([(230, 541), (355, 541), (355, 650)], etq="sin señal")
flecha([(260, 671), (230, 671)])
flecha([(210, 162), (210, 190), (455, 190), (455, 244), (480, 244)])
e.append(f"<text x='300' y='184' {F} font-size='10.5' fill='#555'>botón +</text>")
abajo(p04, p05); abajo(p05, p06); abajo(p06, p07)
abajo(g01, p04, True)
derecha(p07, g02, True)
abajo(g03, g02, True, "aprobar")
abajo(g04, g05, True, 'tramo')
flecha([(1260, 171), (1272, 171), (1272, 391), (1260, 391)], True)
flecha([(1272, 391), (1272, 501), (1260, 501)], True)
e.append(f"<text x='1200' y='330' {F} font-size='10.5' fill='#555'>cierre</text>")
e.append(f"<text x='1195' y='452' {F} font-size='10.5' fill='#555'>teléfono</text>")
flecha([(1000, 281), (985, 281), (985, 60), (210, 60), (210, 110), (160, 110), (160, 220)], True)
e.append(f"<text x='870' y='54' {F} font-size='10.5' fill='#555'>G05 → P08 (detalle, solo lectura)</text>")

leyenda = [("Flujo 1 · Originación: P02 (+) → P04 → P05 → P06 → P07 → G02", 790),
           ("Flujo 2 · Cobro en campo: P02 → P08 → P10 → P11 → P12 → P13 / P14", 806),
           ("Flujo 3 · Consulta gerencial: G04 → G05 → P08", 822)]
for t, y in leyenda:
    e.append(f"<text x='740' y='{y - 150}' {F} font-size='11.5' fill='#333'>{t}</text>")
e.append(f"<rect x='740' y='690' width='26' height='14' fill='#fff' stroke='#222'/><text x='772' y='702' {F} font-size='11'>Existe en Figma</text>")
e.append(f"<rect x='880' y='690' width='26' height='14' fill='#fafafa' stroke='#222' stroke-dasharray='5 3'/><text x='912' y='702' {F} font-size='11'>Guía: falta construir en Figma</text>")

svg = ("<svg xmlns='http://www.w3.org/2000/svg' width='1290' height='830'><defs><marker id='a' markerWidth='10' markerHeight='8' refX='9' refY='4' orient='auto'>"
       "<path d='M0,0 L10,4 L0,8 z' fill='#222'/></marker></defs><rect width='100%' height='100%' fill='#fff'/>" + "".join(e) + "</svg>")
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "mapa-navegacion.svg"), "w", encoding="utf-8").write(svg)
print("ok")
