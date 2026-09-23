"""Diagrama de casos de uso del Proyecto 2: actores, casos de uso del P1 que tienen
pantalla y la pantalla (wireframe) que los implementa.

Uso: python3 docs/proyecto2/wireframes/generar_casos_uso.py
"""
import html
import os

F = "font-family='Helvetica, Arial, sans-serif'"
W, H = 1180, 760
e = []


def t(x, y, s, size=13, weight="normal", anchor="middle", color="#222"):
    e.append(f"<text x='{x}' y='{y}' {F} font-size='{size}' font-weight='{weight}' fill='{color}' text-anchor='{anchor}'>{html.escape(s)}</text>")


def actor(x, y, nombre):
    e.append(f"<circle cx='{x}' cy='{y}' r='13' fill='#fff' stroke='#222' stroke-width='2'/>")
    e.append(f"<line x1='{x}' y1='{y+13}' x2='{x}' y2='{y+48}' stroke='#222' stroke-width='2'/>")
    e.append(f"<line x1='{x-20}' y1='{y+26}' x2='{x+20}' y2='{y+26}' stroke='#222' stroke-width='2'/>")
    e.append(f"<line x1='{x}' y1='{y+48}' x2='{x-16}' y2='{y+72}' stroke='#222' stroke-width='2'/>")
    e.append(f"<line x1='{x}' y1='{y+48}' x2='{x+16}' y2='{y+72}' stroke='#222' stroke-width='2'/>")
    for i, parte in enumerate(nombre.split("\n")):
        t(x, y + 92 + i * 15, parte, 12, "bold")
    return (x, y + 36)


def caso(x, y, cu, nombre, pantalla):
    e.append(f"<ellipse cx='{x}' cy='{y}' rx='118' ry='30' fill='#f4f6fa' stroke='#1f3a5f' stroke-width='1.6'/>")
    t(x, y - 4, f"{cu} {nombre}", 12, "bold")
    t(x, y + 13, pantalla, 11, color="#555")
    return (x, y)


def linea(a, b, lado):
    ax, ay = a
    bx, by = b
    bx = bx - 118 if lado == "izq" else bx + 118
    e.append(f"<line x1='{ax}' y1='{ay}' x2='{bx}' y2='{by}' stroke='#555' stroke-width='1.3'/>")


def relacion(a, b, etiqueta):
    (ax, ay), (bx, by) = a, b
    e.append(f"<line x1='{ax}' y1='{ay+30}' x2='{bx}' y2='{by-30}' stroke='#555' stroke-width='1.2' stroke-dasharray='5 4' marker-end='url(#f)'/>")
    t((ax + bx) / 2 + 8, (ay + by) / 2 + 4, etiqueta, 10, anchor="start", color="#555")


e.append(f"<rect x='230' y='60' width='720' height='660' rx='14' fill='#fff' stroke='#1f3a5f' stroke-width='2'/>")
t(590, 88, "Sistema de Gestión de Microcrédito — pantallas del Proyecto 2", 15, "bold")

# columna izquierda: originación y cobro (móvil); derecha: comité y gerencia
cu01 = caso(430, 140, "CU-01", "Registrar cliente", "W03 Alta de cliente")
cu02 = caso(430, 220, "CU-02", "Solicitar crédito", "W04 Solicitud · W05 Plan")
cu15 = caso(430, 330, "CU-15", "Consultar crédito", "W01 Ruta · W02 Buscar · W07")
cu08 = caso(430, 420, "CU-08", "Calcular mora", "W08 Detalle de la mora")
cu07 = caso(430, 530, "CU-07", "Registrar pago", "W09 Registro · W10 Comprobante")
cu18 = caso(430, 650, "CU-18", "Cancelar crédito", "resultado del pago (sin pantalla)")

cu03 = caso(760, 170, "CU-03/04/05", "Evaluar y decidir", "W13 Bandeja del comité")
cu06 = caso(760, 290, "CU-06", "Desembolsar crédito", "W06 Confirmación")
cu14 = caso(760, 440, "CU-14", "Cartera en riesgo", "W11 Tablero · W12 · W15")
cu12 = caso(760, 580, "CU-12/13", "Generar cierre", "W14 Cierre diario/mensual")

e.append(f"<line x1='430' y1='620' x2='430' y2='562' stroke='#555' stroke-width='1.2' stroke-dasharray='5 4' marker-end='url(#f)'/>")
t(438, 595, "«extend» [saldo = Q0.00]", 10, anchor="start", color="#555")
relacion(cu15, cu08, "«include»")
e.append(f"<line x1='760' y1='550' x2='760' y2='472' stroke='#555' stroke-width='1.2' stroke-dasharray='5 4' marker-end='url(#f)'/>")
t(768, 515, "«include»", 10, anchor="start", color="#555")

asesor = actor(90, 170, "Asesora\nde crédito")
cliente = actor(90, 470, "Cliente")
comite = actor(1090, 150, "Comité /\naprobador")
desemb = actor(1090, 300, "Encargado de\ndesembolsos")
gerencia = actor(1090, 450, "Gerencia /\nfinanciero")
proceso = actor(1090, 580, "Proceso\nprogramado")

for c in (cu01, cu02, cu15, cu08, cu07):
    linea(asesor, c, "izq")
for c in (cu02, cu07, cu08):
    linea(cliente, c, "izq")
linea(comite, cu03, "der")
linea(desemb, cu06, "der")
linea(gerencia, cu14, "der")
linea(gerencia, cu12, "der")
linea(proceso, cu12, "der")

t(590, 745, "Actores y casos de uso del P1 (FASE-01, sección 13) con la pantalla del P2 que los implementa.", 11, color="#555")
svg = (f"<svg xmlns='http://www.w3.org/2000/svg' width='{W}' height='{H+20}' viewBox='0 0 {W} {H+20}'>"
       "<defs><marker id='f' markerWidth='10' markerHeight='8' refX='9' refY='4' orient='auto'><path d='M0,0 L10,4 L0,8 z' fill='#555'/></marker></defs>"
       "<rect width='100%' height='100%' fill='#fff'/>" + "".join(e) + "</svg>")
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "casos-de-uso-p2.svg"), "w", encoding="utf-8").write(svg)
print("ok")
