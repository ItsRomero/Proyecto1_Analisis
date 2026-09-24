"""Wireframes del panel gerencial web (prototipo de Figma Make).

Fuente: https://www.figma.com/make/WHj2TK5IRg55X8JiaKXyvy/Prototipo-Microcr%25C3%25A9ditos-Web
Las posiciones y medidas se tomaron del prototipo a 1440 px de ancho, para que el
skeleton y el wireframe anotado tengan la misma disposición que el diseño.

Pantallas
  W01  Dashboard  · Tablero gerencial
  W02  Cartera    · Cartera de créditos
  W03  Clientes   · Ficha del cliente (lista + detalle)

Uso: python3 generar_wireframes_web.py
Salida: skeleton/W0x-*.svg y anotado/W0x-*.svg
"""
import os
from xml.sax.saxutils import escape

AQUI = os.path.dirname(os.path.abspath(__file__))

# Escala de grises del wireframe (sin color de marca: es baja fidelidad)
FONDO, TARJETA, BORDE = "#F1F3F5", "#FFFFFF", "#D5D9DE"
OSCURO, MEDIO, CLARO, TENUE = "#2B2F36", "#6B7280", "#AEB4BC", "#E4E7EB"
BARRA, BARRA_FUERTE = "#D9DDE2", "#8C939C"
NOTA = "#1F2937"


class Lienzo:
    def __init__(self, codigo, titulo, ancho, alto, modo, notas):
        self.codigo, self.titulo, self.modo = codigo, titulo, modo
        self.W, self.H = ancho, alto
        self.notas = notas          # [(n, texto)]
        self.marcas = []            # [(n, x, y)]
        self.el = []

    # ---------- primitivas ----------
    def caja(self, x, y, w, h, fill=TARJETA, stroke=BORDE, r=0, dash=False, sw=1):
        d = ' stroke-dasharray="6 4"' if dash else ""
        s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
        self.el.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"{s}{d}/>')

    def circulo(self, cx, cy, r, fill):
        self.el.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}"/>')

    def texto(self, x, y, w, h, s, size=14, peso=400, color=OSCURO, fuerte=False, ancla="start"):
        """En skeleton el texto se vuelve una barra gris del mismo ancho."""
        if self.modo == "skeleton":
            bh = max(6, round(h * 0.5))
            self.caja(x, y + (h - bh) / 2, w, bh, BARRA_FUERTE if fuerte else BARRA, None, bh / 2)
            return
        tx = x + (w if ancla == "end" else w / 2 if ancla == "middle" else 0)
        self.el.append(
            f'<text x="{tx}" y="{y + h * 0.78:.0f}" font-size="{size}" font-weight="{peso}" fill="{color}" '
            f'text-anchor="{ancla}">{escape(s)}</text>')

    def etiqueta(self, x, y, s):
        """Nombre de la región: solo en skeleton."""
        if self.modo == "skeleton":
            self.el.append(f'<text x="{x}" y="{y}" font-size="11" fill="{MEDIO}" font-style="italic">{escape(s)}</text>')

    def marca(self, n, x, y):
        self.marcas.append((n, x, y))

    # ---------- componentes compartidos ----------
    def barra_superior(self, activo):
        self.caja(0, 0, self.W, 64, OSCURO, None)
        self.caja(32, 16, 32, 32, MEDIO, None, 8)
        self.texto(39, 24, 19, 15, "CV", 12, 900, "#FFFFFF")
        self.texto(74, 22, 115, 19, "Crédito Vecino", 16, 700, "#FFFFFF")
        xs = [(237, 73, "Dashboard"), (344, 50, "Cartera"), (428, 54, "Clientes"), (517, 49, "Cobros"), (599, 60, "Reportes")]
        for x, w, s in xs:
            if s == activo:
                self.caja(x - 16, 14, w + 32, 36, "#4B5059", None, 8)
            self.texto(x, 24, w, 17, s, 14, 700 if s == activo else 500, "#FFFFFF" if s == activo else CLARO)
        self.caja(1162, 14, 116, 36, BARRA_FUERTE if self.modo == "skeleton" else "#FFFFFF", None, 8)
        self.texto(1178, 24, 84, 17, "Cierre diario", 14, 700, OSCURO)
        self.caja(1290, 17, 70, 30, "none", MEDIO, 8)
        self.texto(1303, 24, 44, 15, "← Inicio", 12, 500, CLARO)
        self.circulo(1390, 32, 18, "#4B5059")
        self.texto(1382, 24, 17, 15, "AR", 12, 600, CLARO)
        self.etiqueta(700, 38, "navegación del panel")

    def kpi(self, x, y, w, h, rotulo, valor, detalle, vsize=24):
        self.caja(x, y, w, h, TARJETA, TENUE, 16)
        self.texto(x + 21, y + 22, min(w - 42, 8 * len(rotulo)), 17, rotulo, 14, 400, MEDIO)
        self.texto(x + 21, y + 46, min(w - 42, int(vsize * 0.62 * len(valor))), vsize + 5, valor, vsize, 900, OSCURO, True)
        self.texto(x + 21, y + 81 - (6 if h < 115 else 0), min(w - 42, int(6.6 * len(detalle))), 15, detalle, 12, 400, MEDIO)

    def pastilla(self, x, y, w, s, oscura=False):
        self.caja(x, y, w, 24, "#E5E7EB" if not oscura else "#CBD0D6", None, 12)
        self.circulo(x + 13, y + 12, 3, MEDIO)
        self.texto(x + 22, y + 4, w - 28, 15, s, 12, 600, OSCURO)

    # ---------- salida ----------
    def svg(self):
        alto_notas = 0 if self.modo == "skeleton" else 34 + 26 * len(self.notas) + 20
        cab = 44
        H = cab + self.H + alto_notas
        out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.W + 40}" height="{H + 20}" '
               f'viewBox="0 0 {self.W + 40} {H + 20}" font-family="Inter, Arial, sans-serif">',
               f'<rect width="100%" height="100%" fill="#FFFFFF"/>',
               f'<text x="20" y="24" font-size="16" font-weight="700" fill="{NOTA}">{self.codigo} · {escape(self.titulo)}</text>',
               f'<text x="20" y="40" font-size="11" fill="{MEDIO}">Escritorio 1440 px · '
               f'{"skeleton" if self.modo == "skeleton" else "wireframe anotado"} · panel gerencial del prototipo web de Figma</text>',
               f'<g transform="translate(20,{cab})">',
               f'<rect x="0" y="0" width="{self.W}" height="{self.H}" fill="{FONDO}" stroke="{BORDE}"/>',
               f'<svg x="0" y="0" width="{self.W}" height="{self.H}" viewBox="0 0 {self.W} {self.H}">']
        out += self.el
        out.append("</svg>")
        if self.modo == "anotado":
            for n, x, y in self.marcas:
                out.append(f'<circle cx="{x}" cy="{y}" r="13" fill="{NOTA}"/>'
                           f'<text x="{x}" y="{y + 5}" font-size="13" font-weight="700" fill="#FFFFFF" text-anchor="middle">{n}</text>')
        out.append("</g>")
        if self.modo == "anotado":
            y0 = cab + self.H + 30
            out.append(f'<text x="20" y="{y0}" font-size="14" font-weight="700" fill="{NOTA}">Notas de diseño</text>')
            for k, (n, t) in enumerate(self.notas):
                yy = y0 + 26 * (k + 1)
                col = "#B42318" if t.startswith("CORREGIR EN FIGMA") or t.startswith("DECIDIR") else NOTA
                out.append(f'<circle cx="31" cy="{yy - 5}" r="10" fill="{NOTA}"/>'
                           f'<text x="31" y="{yy - 1}" font-size="11" font-weight="700" fill="#FFFFFF" text-anchor="middle">{n}</text>'
                           f'<text x="50" y="{yy}" font-size="13" fill="{col}">{escape(t)}</text>')
        out.append("</svg>")
        return "\n".join(out)


# =====================================================================
# W01 · Dashboard (Tablero gerencial)
# =====================================================================
NOTAS_W01 = [
    (1, "Barra del panel: Dashboard, Cartera, Clientes, Cobros y Reportes; la acción principal «Cierre diario» (CU-12) va aparte y destacada."),
    (2, "Selector de período: todas las cifras corresponden a un corte (fecha del puerto Reloj / cierre congelado), no a «hoy»."),
    (3, "Cinco indicadores del período: cartera total, desembolsos, recuperaciones, cartera en riesgo (CeR) e incobrable."),
    (4, "Cartera por tramo: barra apilada al 100 % + lista con monto y %; «Ver →» abre los créditos de ese tramo (Cartera filtrada, CU-14)."),
    (5, "Tendencia de 6 meses y eficiencia de cobro: 65.6 % = Q318,000 / Q485,000 (cifra verificada)."),
    (6, "CeR 23.4 % = 8.3 + 6.1 + 5.8 + 3.2 (tramos de 1 a 120 días, sin incobrable); Q573,300 = 23.4 % × Q2,450,000 (verificado)."),
    (7, "Espacio reservado para el asistente conversacional (sección 6.3 del enunciado)."),
    (8, "DECIDIR: la guía G04 del E2 ponía la cartera en riesgo primero; el prototipo pone la cartera total primero. Alinear ambos."),
    (9, "CORREGIR EN FIGMA: el período y el pie dicen 2024; el proyecto usa septiembre de 2026."),
    (10, "Distinguir «Incobrable del período» (Q18,500, lo castigado este mes) de «Incobrable» en tramos (Q58,800, saldo acumulado)."),
]


def w01(modo):
    c = Lienzo("W01", "Dashboard · Tablero gerencial", 1440, 800, modo, NOTAS_W01)
    c.barra_superior("Dashboard")
    c.texto(32, 89, 209, 29, "Tablero gerencial", 24, 900, OSCURO, True)
    c.texto(32, 124, 172, 17, "Período: septiembre 2024", 14, 400, MEDIO)
    for x, w, s, act in [(1101, 93, "Jul 2024", False), (1202, 100, "Ago 2024", False), (1309, 99, "Sep 2024", True)]:
        c.caja(x, 97, w, 36, "#4B5059" if act else TARJETA, BORDE, 8)
        c.texto(x + 17, 107, w - 34, 17, s, 14, 500, "#FFFFFF" if act else OSCURO)
    c.etiqueta(940, 120, "selector de período")
    kp = [("Cartera total", "Q2,450,000", "847 créditos activos"),
          ("Desembolsos del período", "Q485,000", "↑ 9.5% vs agosto"),
          ("Recuperaciones", "Q318,000", "↑ 8.2% vs agosto"),
          ("Cartera en riesgo (CeR)", "23.4%", "Q573,300.00"),
          ("Incobrable del período", "Q18,500", "Dado por perdido")]
    for k, (a, b, d) in enumerate(kp):
        c.kpi(32 + k * 278.5, 166, 262, 118, a, b, d)
    c.etiqueta(32, 300, "indicadores del período")
    # Cartera por tramo
    c.caja(32, 308, 512, 474, TARJETA, TENUE, 16)
    c.texto(53, 331, 206, 19, "Cartera por tramo de mora", 16, 700, OSCURO, True)
    c.texto(424, 332, 99, 15, "Total Q2,450,000", 12, 400, MEDIO)
    grises = ["#9AA1AA", "#B5BBC2", "#C4C9CF", "#D0D4D9", "#DADDE1", "#E6E8EB"]
    x = 53
    for w, g in zip([349, 39, 29, 27, 15, 11], grises):
        c.caja(x, 368, w, 20, g, None, 0)
        x += w
    tramos = [("Al día", "Q1,817,900.00", "74.2%", False), ("1–30 días", "Q203,350.00", "8.3%", True),
              ("31–60 días", "Q149,450.00", "6.1%", True), ("61–90 días", "Q142,100.00", "5.8%", True),
              ("91–120 días", "Q78,400.00", "3.2%", True), ("Incobrable", "Q58,800.00", "2.4%", False)]
    for k, (a, m, p, ver) in enumerate(tramos):
        y = 416 + 60 * k
        c.circulo(69, y + 16, 6, grises[k] if modo == "anotado" else BARRA_FUERTE)
        c.texto(87, y, 8 * len(a), 17, a, 14, 500, OSCURO)
        c.texto(87, y + 18, 75, 15, m, 12, 400, MEDIO)
        c.texto(460, y + (0 if ver else 8), 53, 17, p, 14, 700, OSCURO, True, "end")
        if ver:
            c.texto(480, y + 18, 33, 15, "Ver →", 12, 400, CLARO)
    # Desembolsos y recuperaciones
    c.caja(560, 308, 512, 474, TARJETA, TENUE, 16)
    c.texto(581, 331, 246, 19, "Desembolsos y recuperaciones", 16, 700, OSCURO, True)
    c.texto(959, 332, 92, 15, "últimos 6 meses", 12, 400, MEDIO)
    for k, m in enumerate(["Abr", "May", "Jun", "Jul", "Ago", "Sep"]):
        cx = 617 + k * 79.5
        for j, h in enumerate([(70, 48), (82, 55), (78, 60), (95, 62), (100, 70), (112, 74)][k]):
            c.caja(cx - 16 + j * 17, 505 - h, 14, h, "#8C939C" if j == 0 else "#C9CED4", None, 3)
        c.texto(cx - 11, 516, 22, 15, m, 12, 400, MEDIO)
    c.etiqueta(581, 372, "gráfico de barras (esquemático)")
    c.caja(581, 552, 12, 12, "#8C939C", None, 3)
    c.texto(599, 550, 90, 17, "Desembolsos", 14, 400, MEDIO)
    c.caja(704, 552, 12, 12, "#C9CED4", None, 3)
    c.texto(722, 550, 107, 17, "Recuperaciones", 14, 400, MEDIO)
    c.caja(581, 584, 470, 1, TENUE, None)
    for (x, y, a, b) in [(581, 601, "Desembolsos sep", "Q485,000"), (822, 601, "Recuperaciones sep", "Q318,000"),
                         (581, 659, "Eficiencia de cobro", "65.6%"), (822, 659, "Créditos nuevos", "47")]:
        c.texto(x, y, 7 * len(a), 15, a, 12, 400, MEDIO)
        c.texto(x, y + 21, 11 * len(b), 22, b, 18, 700, OSCURO, True)
    # Cartera en riesgo
    c.caja(1088, 308, 320, 230, TARJETA, TENUE, 16)
    c.texto(1109, 331, 135, 19, "Cartera en riesgo", 16, 700, OSCURO, True)
    c.texto(1109, 354, 123, 44, "23.4%", 36, 900, OSCURO, True)
    c.texto(1109, 400, 181, 15, "Q573,300.00 sobre cartera total", 12, 400, MEDIO)
    for k, (a, p) in enumerate([("1–30 días", "8.3%"), ("31–60 días", "6.1%"), ("61–90 días", "5.8%"), ("91–120 días", "3.2%")]):
        y = 428 + 24 * k
        c.circulo(1113, y + 8, 4, BARRA_FUERTE)
        c.texto(1125, y, 6.5 * len(a), 15, a, 12, 400, MEDIO)
        c.texto(1350, y, 37, 15, p, 12, 700, OSCURO, False, "end")
    # Asistente
    c.caja(1088, 553, 320, 228, "#F7F8F9", "#C5CAD0", 16, True, 1.6)
    c.caja(1224, 618, 48, 48, TENUE, None, 12)
    c.texto(1186, 680, 124, 17, "Espacio reservado", 14, 500, MEDIO, False)
    c.texto(1177, 700, 142, 15, "Asistente conversacional", 12, 400, CLARO)
    for n, x, y in [(1, 700, 32), (2, 1085, 115), (3, 16, 225), (4, 530, 330), (5, 1060, 640),
                    (6, 1395, 330), (7, 1395, 575), (8, 16, 185), (9, 220, 132), (10, 1395, 190)]:
        c.marca(n, x, y)
    return c


# =====================================================================
# W02 · Cartera de créditos
# =====================================================================
NOTAS_W02 = [
    (1, "Título con el número de créditos del corte; acción «+ Nuevo crédito» (CU-02) arriba a la derecha."),
    (2, "Cuatro totales por estado: 5 + 7 + 3 = 15 créditos y Q50,150.00 + Q41,020.54 + Q14,250.00 = Q105,420.54 (verificado)."),
    (3, "Filtro segmentado por estado + búsqueda por cliente o código (CU-15)."),
    (4, "Tabla ordenable (Cliente ↑, Días ↕). El saldo va en negrita porque es la cifra que se cobra."),
    (5, "Estado con pastilla, punto y texto del tramo: no depende solo del color (WCAG 1.4.1)."),
    (6, "Fila de totales fija: 15 créditos · capital Q146,500.00 · saldo Q105,420.54."),
    (7, "María García (Q10,000 · 12 m · 5/12): cuota Q1,004.62 y saldo Q6,259.07 coinciden con el núcleo."),
    (8, "CORREGIR EN FIGMA: Pedro Alvarado (Q12,000 · 12 m) muestra Q1,004.62, que es la cuota de Q10,000; al 3 % sería Q1,205.55."),
    (9, "CORREGIR EN FIGMA: Andrés Lima (Q5,000 · 12 m) muestra Q485.50; el caso de referencia del núcleo da Q502.31."),
    (10, "DECIDIR: aquí los filtros dicen «En mora / Vencidos / Incobrables» y en Clientes son tramos; usar los mismos nombres."),
]

FILAS_W02 = [
    ("Ana Lucía Morales", "CRD-2024-0654", "Q15,000.00", "Q9,120.50", "Q1,264.30", "18 m", "5 / 18", "52 d", "31–60 d"),
    ("Andrés Lima Castillo", "CRD-2023-1988", "Q5,000.00", "Q4,500.00", "Q485.50", "12 m", "1 / 12", "180 d", "+120 d"),
    ("Carlos Fuentes García", "CRD-2024-0589", "Q5,000.00", "Q4,500.00", "Q891.85", "6 m", "1 / 6", "41 d", "31–60 d"),
    ("Carmen Judith López", "CRD-2024-0388", "Q7,500.00", "Q5,200.00", "Q892.50", "9 m", "3 / 9", "—", "Al día"),
    ("Ernesto Cabrera Méndez", "CRD-2024-0355", "Q25,000.00", "Q18,500.00", "Q2,005.00", "12 m", "4 / 12", "—", "Al día"),
    ("Gloria Estela Fuentes", "CRD-2024-0312", "Q4,000.00", "Q2,800.00", "Q580.00", "9 m", "3 / 9", "15 d", "1–30 d"),
    ("José Domingo Pérez", "CRD-2024-0731", "Q8,000.00", "Q3,840.22", "Q742.15", "12 m", "8 / 12", "22 d", "1–30 d"),
]


def w02(modo):
    c = Lienzo("W02", "Cartera · Cartera de créditos", 1440, 954, modo, NOTAS_W02)
    c.barra_superior("Cartera")
    c.texto(32, 89, 231, 29, "Cartera de créditos", 24, 900, OSCURO, True)
    c.texto(32, 124, 276, 17, "Septiembre 2024 · 15 créditos registrados", 14, 400, MEDIO)
    c.caja(1260, 95, 148, 40, "#4B5059", None, 12)
    c.texto(1280, 107, 108, 17, "+ Nuevo crédito", 14, 700, "#FFFFFF")
    kp = [("Total cartera", "Q105,420.54", "15 créditos"), ("Al día", "5 créditos", "Q50,150.00"),
          ("En mora (1–3)", "7 créditos", "Q41,020.54"), ("Vencido / Incob.", "3 créditos", "Q14,250.00")]
    for k, (a, b, d) in enumerate(kp):
        c.kpi(32 + 348 * k, 166, 332, 112, a, b, d, 20)
    # filtros
    c.caja(32, 302, 460, 46, TARJETA, TENUE, 12)
    c.caja(37, 306, 73, 36, "#4B5059", None, 8)
    for x, w, s in [(53, 41, "Todos"), (130, 37, "Al día"), (203, 55, "En mora"), (294, 62, "Vencidos"), (392, 79, "Incobrables")]:
        c.texto(x, 316, w, 17, s, 14, 500, "#FFFFFF" if s == "Todos" else MEDIO)
    c.caja(1088, 304, 320, 40, TARJETA, BORDE, 12)
    c.caja(1104, 317, 14, 14, "none", MEDIO, 7)
    c.texto(1130, 316, 190, 17, "Buscar por cliente o código", 14, 400, CLARO)
    c.etiqueta(500, 330, "filtro por estado")
    # tabla
    c.caja(32, 363, 1376, 567, TARJETA, TENUE, 16)
    c.caja(33, 364, 1374, 41, "#F7F8F9", None, 0)
    cols = [57, 683, 793, 913, 1013, 1103, 1193, 1273]
    for x, s in zip(cols, ["Cliente / Código ↑", "Capital", "Saldo", "Cuota", "Plazo", "Pagadas", "Días ↕", "Estado"]):
        c.texto(x, 376, 7 * len(s), 15, s, 12, 600, MEDIO)
    for k, f in enumerate(FILAS_W02):
        y = 405 + 67 * k
        c.caja(33, y + 66, 1374, 1, TENUE, None)
        c.texto(57, y + 15, 7.6 * len(f[0]), 17, f[0], 14, 600, OSCURO, True)
        c.texto(57, y + 36, 95, 15, f[1], 12, 400, MEDIO)
        for x, v, fuerte in [(683, f[2], False), (793, f[3], True), (913, f[4], False), (1013, f[5], False), (1103, f[6], False), (1193, f[7], False)]:
            c.texto(x, y + 24, 7.6 * len(v), 17, v, 14, 700 if fuerte else 400, OSCURO, fuerte)
        c.pastilla(1273, y + 21, 22 + 7 * len(f[8]) + 12, f[8], f[8] == "+120 d")
    c.caja(33, 885, 1374, 45, "#F7F8F9", BORDE, 0)
    c.texto(57, 899, 74, 17, "15 créditos", 14, 700, OSCURO, True)
    c.texto(683, 902, 76, 15, "Q146,500.00", 12, 600, MEDIO)
    c.texto(793, 899, 90, 17, "Q105,420.54", 14, 700, OSCURO, True)
    c.etiqueta(40, 882, "fila de totales")
    for n, x, y in [(1, 1245, 115), (2, 16, 222), (3, 16, 325), (4, 200, 384), (5, 1395, 384),
                    (6, 16, 907), (7, 20, 700), (8, 20, 760), (9, 20, 490), (10, 507, 325)]:
        c.marca(n, x, y)
    return c


# =====================================================================
# W03 · Clientes (lista + ficha)
# =====================================================================
NOTAS_W03 = [
    (1, "Lista de clientes (15 de 15) con búsqueda por nombre, DPI o código y filtros por tramo."),
    (2, "Cada fila: iniciales, nombre, código · zona, tramo en texto y saldo; la fila elegida queda resaltada."),
    (3, "Encabezado de la ficha: estado en lenguaje llano («Más de un mes de atraso»), como se decidió en E1/E2."),
    (4, "Datos de contacto: DPI, teléfono y zona. Sugerencia: enmascarar el DPI (2456 ••••• 0101) y mostrarlo al pedirlo."),
    (5, "Resumen: deuda total, créditos activos y estado general."),
    (6, "Créditos del cliente: saldo Q6,259.07 tras 5 de 12 cuotas de Q1,004.62, igual que el núcleo; «Ver» abre el detalle (CU-15)."),
    (7, "Acciones: «Registrar pago» es la principal (CU-07); «Editar cliente» e «Historial de pagos» son secundarias."),
    (8, "DECIDIR: los chips de tramo de esta pantalla deben usar los mismos nombres que el filtro de Cartera (W02)."),
]

FILAS_W03 = [
    ("MG", "María García López", "CLI-001 · Zona 1", "31–60 d", "Q6,259.07", True),
    ("JD", "José Domingo Pérez", "CLI-002 · Zona 3", "1–30 d", "Q3,840.22", False),
    ("AL", "Ana Lucía Morales", "CLI-003 · Zona 6", "31–60 d", "Q9,120.50", False),
    ("CF", "Carlos Fuentes García", "CLI-004 · Zona 2", "31–60 d", "Q4,500.00", False),
    ("RE", "Rosa Elena Hernández", "CLI-005 · Zona 5", "61–90 d", "Q2,100.75", False),
    ("PA", "Pedro Alvarado Castro", "CLI-006 · Zona 7", "Al día", "Q8,450.00", False),
    ("LR", "Luisa Ramírez Vidal", "CLI-007 · Zona 1", "Al día", "Q3,200.00", False),
    ("MÁ", "Miguel Ángel Torres", "CLI-008 · Zona 12", "Al día", "Q14,800.00", False),
    ("CJ", "Carmen Judith López", "CLI-009 · Zona 4", "Al día", "Q5,200.00", False),
]


def w03(modo):
    c = Lienzo("W03", "Clientes · Lista y ficha del cliente", 1440, 900, modo, NOTAS_W03)
    c.barra_superior("Clientes")
    # panel izquierdo
    c.caja(0, 64, 360, 836, TARJETA, TENUE, 0)
    c.texto(16, 82, 64, 19, "Clientes", 16, 700, OSCURO, True)
    c.texto(298, 84, 45, 15, "15 de 15", 12, 400, MEDIO)
    c.caja(16, 116, 327, 38, "#F7F8F9", BORDE, 12)
    c.caja(29, 128, 14, 14, "none", MEDIO, 7)
    c.texto(52, 127, 150, 17, "Nombre, DPI o código", 14, 400, CLARO)
    chips = [(16, 166, 55, "Todos"), (77, 166, 52, "Al día"), (135, 166, 73, "1–30 días"), (214, 166, 81, "31–60 días"),
             (16, 200, 81, "61–90 días"), (103, 200, 67, "Vencido"), (176, 200, 81, "Incobrable")]
    for x, y, w, s in chips:
        c.caja(x, y, w, 28, "#4B5059" if s == "Todos" else "#EEF0F2", None, 8)
        c.texto(x + 10, y + 6, w - 20, 15, s, 12, 500, "#FFFFFF" if s == "Todos" else MEDIO)
    c.caja(0, 244, 360, 1, TENUE, None)
    for k, (ini, n, cod, tr, sal, sel) in enumerate(FILAS_W03):
        y = 245 + 73 * k
        if y + 73 > 900:
            break
        c.caja(0, y, 359, 73, "#EEF0F2" if sel else TARJETA, None, 0)
        c.caja(0, y + 72, 359, 1, TENUE, None)
        c.circulo(38, y + 36, 20, "#4B5059" if sel else "#E5E7EB")
        c.texto(27, y + 27, 22, 17, ini, 14, 700, "#FFFFFF" if sel else MEDIO)
        c.texto(70, y + 18, 7.6 * len(n), 17, n, 14, 600, OSCURO, True)
        c.texto(70, y + 39, 92, 15, cod, 12, 400, MEDIO)
        wp = 16 + 7 * len(tr)
        c.caja(343 - wp, y + 17, wp, 19, "#E5E7EB", None, 10)
        c.texto(343 - wp + 8, y + 19, wp - 16, 15, tr, 12, 600, OSCURO)
        c.texto(343 - 7 * len(sal), y + 42, 7 * len(sal), 15, sal, 12, 400, MEDIO)
    c.etiqueta(200, 240, "lista de clientes")
    # ficha
    c.caja(392, 96, 64, 64, "#4B5059", None, 16)
    c.texto(407, 116, 34, 24, "MG", 20, 900, "#FFFFFF")
    c.texto(472, 102, 229, 29, "María García López", 24, 900, OSCURO, True)
    c.texto(472, 137, 107, 17, "CLI-001 · Zona 1", 14, 400, MEDIO)
    c.caja(1201, 96, 207, 32, "#E5E7EB", None, 16)
    c.circulo(1217, 112, 4, MEDIO)
    c.texto(1227, 104, 169, 17, "Más de un mes de atraso", 14, 600, OSCURO)
    for k, (a, b) in enumerate([("DPI", "2456 78901 0101"), ("Teléfono", "+502 5512-3456"), ("Zona", "Zona 1")]):
        x = 392 + 342.5 * k
        c.caja(x, 184, 331, 74, TARJETA, TENUE, 12)
        c.texto(x + 17, 201, 7 * len(a), 15, a, 12, 400, MEDIO)
        c.texto(x + 17, 222, 8 * len(b), 17, b, 14, 600, OSCURO, True)
    for k, (a, b) in enumerate([("Deuda total", "Q6,259.07"), ("Créditos activos", "1 crédito"), ("Estado general", "Más de un mes de atraso")]):
        x = 392 + 342.5 * k
        c.caja(x, 282, 331, 82, TARJETA, TENUE, 12)
        c.texto(x + 17, 298, 7 * len(a), 15, a, 12, 400, MEDIO)
        c.texto(x + 17, 322, min(300, 10 * len(b)), 22, b, 18, 900, OSCURO, True)
    c.caja(392, 387, 1016, 163, TARJETA, TENUE, 16)
    c.caja(393, 388, 1014, 55, "#F7F8F9", None, 0)
    c.texto(413, 407, 146, 15, "Créditos del cliente", 12, 600, MEDIO, True)
    c.caja(1271, 400, 116, 30, "#4B5059", None, 8)
    c.texto(1283, 407, 92, 15, "+ Nuevo crédito", 12, 600, "#FFFFFF")
    for x, s in zip([413, 573, 663, 773, 863, 943, 1043], ["Código", "Capital", "Saldo", "Cuota", "Plazo", "Estado", "Acción"]):
        c.texto(x, 453, 7 * len(s), 15, s, 12, 600, MEDIO)
    c.caja(393, 480, 1014, 1, TENUE, None)
    c.texto(413, 497, 114, 17, "CRD-2024-0892", 14, 600, OSCURO, True)
    c.texto(413, 518, 65, 15, "5/12 cuotas", 12, 400, MEDIO)
    for x, v, f in [(573, "Q10,000.00", False), (663, "Q6,259.07", True), (773, "Q1,004.62", False), (863, "12 m", False)]:
        c.texto(x, 506, 7.6 * len(v), 17, v, 14, 700 if f else 400, OSCURO, f)
    c.pastilla(943, 503, 77, "31–60 d")
    c.caja(1043, 500, 44, 30, "#4B5059", None, 8)
    c.texto(1055, 507, 20, 15, "Ver", 12, 600, "#FFFFFF")
    c.caja(392, 574, 148, 44, BARRA_FUERTE if modo == "skeleton" else "#4B5059", None, 12)
    c.texto(416, 588, 100, 17, "Registrar pago", 14, 700, "#FFFFFF")
    c.caja(552, 574, 138, 44, TARJETA, BORDE, 12)
    c.texto(577, 588, 88, 17, "Editar cliente", 14, 600, OSCURO)
    c.caja(702, 574, 172, 44, TARJETA, BORDE, 12)
    c.texto(727, 588, 122, 17, "Historial de pagos", 14, 600, OSCURO)
    c.etiqueta(900, 600, "acciones sobre el cliente")
    for n, x, y in [(1, 110, 92), (2, 346, 280), (3, 1180, 112), (4, 392, 180), (5, 392, 290),
                    (6, 1395, 470), (7, 392, 570), (8, 346, 214)]:
        c.marca(n, x, y)
    return c


PANTALLAS = [("W01-dashboard", w01), ("W02-cartera", w02), ("W03-clientes", w03)]

if __name__ == "__main__":
    for nombre, f in PANTALLAS:
        for modo in ("skeleton", "anotado"):
            d = os.path.join(AQUI, modo)
            os.makedirs(d, exist_ok=True)
            with open(os.path.join(d, nombre + ".svg"), "w", encoding="utf-8") as fh:
                fh.write(f(modo).svg())
            print(modo, nombre)
