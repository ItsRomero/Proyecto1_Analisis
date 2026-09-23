"""Wireframes tipo *skeleton* (baja fidelidad pura): solo bloques grises que indican
DÓNDE va cada elemento, sin textos reales ni cifras. Complementan a los wireframes
anotados W01–W15.

Uso: python3 docs/proyecto2/wireframes/generar_skeletons.py
"""
import html
import os

SALIDA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "skeleton")
os.makedirs(SALIDA, exist_ok=True)

FONDO, MARCO, BLOQUE, BLOQUE2, ETQ = "#ffffff", "#9a9a9a", "#e4e4e4", "#d2d2d2", "#8a8a8a"
FUENTE = "font-family='Helvetica, Arial, sans-serif'"


class Lienzo:
    def __init__(self, ancho, alto, codigo, titulo, dispositivo):
        self.w, self.h, self.e = ancho, alto, []
        self.codigo, self.titulo, self.dispositivo = codigo, titulo, dispositivo
        self.y = 0

    # primitivas
    def rect(self, x, y, w, h, color=BLOQUE, r=6):
        self.e.append(f"<rect x='{x}' y='{y}' width='{w}' height='{h}' rx='{r}' fill='{color}'/>")

    def contorno(self, x, y, w, h, r=10):
        self.e.append(f"<rect x='{x}' y='{y}' width='{w}' height='{h}' rx='{r}' fill='#fff' stroke='{BLOQUE2}' stroke-width='1.5'/>")

    def circulo(self, cx, cy, r, color=BLOQUE):
        self.e.append(f"<circle cx='{cx}' cy='{cy}' r='{r}' fill='{color}'/>")

    def etiqueta(self, x, y, texto, anchor="start"):
        self.e.append(f"<text x='{x}' y='{y}' {FUENTE} font-size='10' fill='{ETQ}' text-anchor='{anchor}'>{html.escape(texto)}</text>")

    def barra(self, x, y, w, h=10):
        self.rect(x, y, w, h, BLOQUE, h / 2)

    def guardar(self, nombre):
        H = self.h + 70
        partes = [
            f"<svg xmlns='http://www.w3.org/2000/svg' width='{self.w + 40}' height='{H}' viewBox='0 0 {self.w + 40} {H}'>",
            "<rect width='100%' height='100%' fill='#f5f5f5'/>",
            f"<text x='20' y='26' {FUENTE} font-size='14' font-weight='bold' fill='#333'>{self.codigo} · {html.escape(self.titulo)}</text>",
            f"<text x='20' y='44' {FUENTE} font-size='11' fill='#777'>{self.dispositivo} · skeleton (baja fidelidad)</text>",
            "<g transform='translate(20,56)'>",
            f"<rect x='0' y='0' width='{self.w}' height='{self.h}' rx='16' fill='{FONDO}' stroke='{MARCO}' stroke-width='2'/>",
        ]
        partes += self.e + ["</g></svg>"]
        with open(os.path.join(SALIDA, nombre), "w", encoding="utf-8") as f:
            f.write("\n".join(partes))


# ---------- componentes móviles ----------
MW, MH = 360, 720


class Movil(Lienzo):
    def __init__(self, codigo, titulo, atras=True, tabs=False):
        super().__init__(MW, MH, codigo, titulo, "Móvil 360×720")
        self.rect(0, 0, MW, 22, "#efefef", 0)
        self.barra(12, 7, 30, 8)
        self.barra(MW - 70, 7, 58, 8)
        self.rect(0, 22, MW, 56, "#f0f0f0", 0)
        if atras:
            self.circulo(26, 50, 10)
        self.barra(48 if atras else 16, 44, 150, 12)
        self.circulo(MW - 26, 50, 10)
        self.etiqueta(MW - 26, 72, "ayuda", "middle")
        self.y = 92
        self.tabs = tabs

    def aviso(self, texto):
        self.contorno(16, self.y, MW - 32, 40, 8)
        self.circulo(34, self.y + 20, 8)
        self.barra(50, self.y + 15, 140)
        self.etiqueta(MW - 24, self.y + 24, texto, "end")
        self.y += 50

    def titulo_seccion(self, w=140):
        self.barra(16, self.y, w, 12)
        self.y += 24

    def campo(self, etiqueta, alto=44):
        self.barra(16, self.y, 90, 8)
        self.y += 14
        self.contorno(16, self.y, MW - 32, alto, 8)
        self.barra(28, self.y + alto / 2 - 6, 120, 12)
        self.etiqueta(MW - 26, self.y + alto / 2 + 4, etiqueta, "end")
        self.y += alto + 12

    def fichas(self, n, etiqueta):
        w = (MW - 32 - (n - 1) * 8) / n
        for i in range(n):
            self.rect(16 + i * (w + 8), self.y, w, 38, BLOQUE2 if i == n // 2 else BLOQUE, 8)
        self.etiqueta(16, self.y + 52, etiqueta)
        self.y += 62

    def tarjeta_lista(self, n, etiqueta):
        for i in range(n):
            self.contorno(16, self.y, MW - 32, 72, 10)
            self.circulo(46, self.y + 36, 18)
            self.barra(76, self.y + 18, 130, 11)
            self.barra(76, self.y + 36, 90, 8)
            self.barra(76, self.y + 52, 70, 9)
            self.rect(MW - 86, self.y + 14, 56, 14, BLOQUE2, 7)
            if i == 0:
                self.etiqueta(MW - 58, self.y + 62, etiqueta, "middle")
            self.y += 80

    def filas(self, n, etiqueta, ancho_valor=70):
        for i in range(n):
            self.barra(16, self.y + 6, 120)
            self.barra(MW - 16 - ancho_valor, self.y + 6, ancho_valor)
            self.rect(16, self.y + 24, MW - 32, 1, "#eeeeee", 0)
            self.y += 30
        self.etiqueta(MW - 16, self.y + 2, etiqueta, "end")
        self.y += 12

    def bloque(self, alto, etiqueta, color=BLOQUE):
        self.rect(16, self.y, MW - 32, alto, color, 10)
        self.etiqueta(MW / 2, self.y + alto / 2 + 4, etiqueta, "middle")
        self.y += alto + 12

    def tarjeta_resumen(self, etiqueta):
        self.contorno(16, self.y, MW - 32, 100, 12)
        self.barra(32, self.y + 18, 110, 9)
        self.rect(32, self.y + 38, 180, 28, BLOQUE2, 8)
        self.barra(32, self.y + 78, 140, 9)
        self.etiqueta(MW - 28, self.y + 92, etiqueta, "end")
        self.y += 112

    def tabla(self, filas, cols, etiqueta, resaltar=None):
        ancho = (MW - 32) / cols
        self.rect(16, self.y, MW - 32, 22, BLOQUE2, 4)
        self.y += 26
        for f in range(filas):
            if f == resaltar:
                self.rect(12, self.y - 2, MW - 24, 20, "#f0f0f0", 4)
            for c in range(cols):
                self.barra(20 + c * ancho, self.y + 4, ancho - 14, 8)
            self.y += 20
        self.etiqueta(MW - 16, self.y + 10, etiqueta, "end")
        self.y += 18

    def boton(self, primario=True, y=None, etiqueta=""):
        yy = self.y if y is None else y
        self.rect(16, yy, MW - 32, 50, "#bdbdbd" if primario else BLOQUE, 10)
        self.barra(MW / 2 - 60, yy + 20, 120, 10)
        if etiqueta:
            self.etiqueta(MW / 2, yy + 44, etiqueta, "middle")
        if y is None:
            self.y += 60

    def pie(self, principal, secundario=None):
        if secundario:
            self.boton(False, MH - 124, secundario)
        self.boton(True, MH - 64, principal)

    def barra_tabs(self):
        self.rect(0, MH - 56, MW, 56, "#f0f0f0", 0)
        for i in range(4):
            cx = MW / 8 + i * MW / 4
            self.circulo(cx, MH - 36, 9)
            self.barra(cx - 18, MH - 20, 36, 7)


def moviles():
    s = Movil("S01", "Ruta del día", atras=False)
    s.aviso("estado de conexión")
    s.tarjeta_lista(5, "etiqueta de tramo")
    s.barra_tabs()
    s.guardar("S01-ruta-del-dia.svg")

    s = Movil("S02", "Buscar cliente o crédito")
    s.campo("búsqueda")
    s.tarjeta_lista(3, "estado")
    s.barra(16, s.y, 180)
    s.barra_tabs()
    s.guardar("S02-buscar-cliente.svg")

    s = Movil("S03", "Alta de cliente")
    s.barra(16, s.y, 100, 8); s.y += 18
    s.bloque(110, "foto del DPI")
    s.campo("número de DPI")
    s.campo("nombre completo")
    s.campo("teléfono para SMS")
    s.aviso("guardado en el teléfono")
    s.pie("continuar")
    s.guardar("S03-alta-cliente.svg")

    s = Movil("S04", "Solicitud de crédito")
    s.campo("monto (Q, con límites)", 56)
    s.barra(16, s.y - 6, 200, 8); s.y += 10
    s.fichas(5, "plazo en meses (botones)")
    s.campo("destino del crédito")
    s.tarjeta_resumen("cuota estimada y total")
    s.pie("ver plan de pagos")
    s.guardar("S04-solicitud-credito.svg")

    s = Movil("S05", "Simulación / plan de amortización")
    s.barra(16, s.y, 200, 9); s.y += 20
    s.tabla(12, 5, "12 cuotas · última resaltada", resaltar=11)
    s.bloque(46, "explicación del ajuste de la última cuota", "#efefef")
    s.pie("confirmar", "cambiar monto o plazo")
    s.guardar("S05-plan-amortizacion.svg")

    s = Movil("S06", "Confirmación de desembolso")
    s.titulo_seccion(200)
    s.filas(8, "resumen de condiciones")
    s.contorno(16, s.y, 24, 24, 4); s.barra(50, s.y + 7, 220); s.etiqueta(MW - 16, s.y + 38, "casilla de aceptación", "end"); s.y += 50
    s.pie("desembolsar", "volver y corregir")
    s.guardar("S06-confirmacion-desembolso.svg")

    s = Movil("S07", "Detalle del crédito")
    s.barra(16, s.y, 160, 8); s.y += 18
    s.tarjeta_resumen("lo que debe hoy + días de atraso")
    s.filas(3, "próxima cuota · saldo · estado")
    s.bloque(56, "aviso del siguiente tramo", "#efefef")
    s.boton(False, etiqueta="¿por qué debo esto?")
    s.pie("registrar pago")
    s.guardar("S07-detalle-credito.svg")

    s = Movil("S08", "Detalle de la mora por tramos")
    s.barra(16, s.y, 240, 9); s.barra(16, s.y + 16, 280, 8); s.y += 36
    for i, largo in enumerate([1, 1, 1, 0.33]):
        s.contorno(16, s.y, MW - 32, 62, 10)
        s.barra(30, s.y + 12, 150, 11)
        s.barra(MW - 100, s.y + 12, 70, 11)
        s.rect(30, s.y + 34, (MW - 130) * largo, 14, BLOQUE2, 4)
        if i == 0:
            s.etiqueta(MW - 30, s.y + 56, "rango · tasa anual · días · importe", "end")
        s.y += 70
    s.tarjeta_resumen("total redondeado una vez + nota")
    s.pie("entendido")
    s.guardar("S08-detalle-mora.svg")

    s = Movil("S09", "Registro de pago")
    s.barra(16, s.y, 230, 9); s.y += 20
    s.campo("monto recibido", 56)
    s.fichas(3, "atajos: todo · cuota · otro")
    s.titulo_seccion(160)
    s.filas(4, "prelación: gastos → mora → interés → capital")
    s.aviso("estado sin señal")
    s.pie("revisar y confirmar")
    s.guardar("S09-registro-pago.svg")

    s = Movil("S10", "Comprobante")
    s.aviso("pendiente / enviado / confirmado")
    s.filas(3, "cliente · fecha · monto")
    s.titulo_seccion(100)
    s.filas(5, "aplicado a cada concepto + saldo")
    s.barra(16, s.y, 150, 8); s.etiqueta(MW - 16, s.y + 8, "clave de operación", "end"); s.y += 20
    s.pie("enviar por SMS", "ir a la ruta")
    s.guardar("S10-comprobante.svg")

    s = Movil("S15", "Tablero gerencial en teléfono")
    s.tarjeta_resumen("cartera en RIESGO")
    s.bloque(52, "incobrables del período")
    s.tarjeta_resumen("cartera en MORA (otro estilo)")
    s.titulo_seccion(120)
    s.filas(4, "riesgo por tramo (toque = detalle)", 50)
    s.circulo(MW - 46, MH - 46, 26, "#bdbdbd")
    s.etiqueta(MW - 46, MH - 12, "asistente", "middle")
    s.guardar("S15-tablero-movil.svg")


# ---------- componentes escritorio ----------
DW, DH = 1280, 760


class Escritorio(Lienzo):
    def __init__(self, codigo, titulo):
        super().__init__(DW, DH, codigo, titulo, "Escritorio 1280×760")
        self.rect(0, 0, DW, 56, "#f0f0f0", 0)
        self.barra(20, 22, 130, 12)
        for i in range(4):
            self.barra(200 + i * 160, 23, 100, 10)
        self.circulo(DW - 30, 28, 14)

    def kpi(self, x, y, w, h, etiqueta, fuerte=False):
        self.contorno(x, y, w, h, 12)
        if fuerte:
            self.e.append(f"<rect x='{x}' y='{y}' width='{w}' height='{h}' rx='12' fill='none' stroke='#9a9a9a' stroke-width='3'/>")
        self.barra(x + 16, y + 20, 140, 11)
        self.rect(x + 16, y + 44, 150, 34, BLOQUE2, 8)
        self.barra(x + 16, y + 92, 180, 8)
        self.barra(x + 16, y + 108, 120, 8)
        self.etiqueta(x + w - 12, y + h - 10, etiqueta, "end")


def escritorio():
    s = Escritorio("S11", "Tablero gerencial")
    s.barra(20, 76, 520, 9)
    s.etiqueta(560, 84, "fecha de corte · estado del cierre")
    s.kpi(20, 100, 300, 140, "1 · cartera en RIESGO", True)
    s.kpi(336, 100, 250, 140, "2 · incobrables del período")
    s.kpi(602, 100, 280, 140, "3 · cartera en MORA")
    s.contorno(20, 258, 862, 262, 12)
    s.barra(36, 278, 300, 11)
    for i, frac in enumerate([1, 0.75, 0.33, 0.25]):
        y = 310 + i * 44
        s.barra(36, y, 150); s.barra(230, y, 60); s.barra(330, y, 90)
        s.rect(460, y - 4, 300 * frac, 18, BLOQUE2, 4)
        s.barra(800, y, 50)
    s.etiqueta(866, 510, "4 · riesgo por tramo (clic = créditos)", "end")
    s.contorno(20, 540, 420, 190, 12); s.rect(36, 580, 388, 134, BLOQUE, 8); s.etiqueta(230, 650, "desembolsos del período", "middle")
    s.contorno(462, 540, 420, 190, 12); s.rect(478, 580, 388, 134, BLOQUE, 8); s.etiqueta(672, 650, "recuperaciones del período", "middle")
    s.e.append("<rect x='904' y='100' width='356' height='630' rx='12' fill='#fafafa' stroke='#c8c8c8' stroke-dasharray='6 4'/>")
    s.rect(924, 130, 316, 500, BLOQUE, 8); s.etiqueta(1082, 380, "asistente (Proyecto Final)", "middle")
    s.contorno(924, 646, 316, 44, 8); s.barra(940, 663, 200)
    s.guardar("S11-tablero-gerencial.svg")

    s = Escritorio("S12", "Créditos de un tramo")
    s.barra(20, 76, 380, 9); s.etiqueta(410, 84, "ruta de navegación")
    s.rect(20, 100, 700, 18, BLOQUE2, 6); s.etiqueta(730, 114, "tramo · cantidad · saldo · %")
    s.rect(20, 140, 1240, 38, BLOQUE2, 6)
    for f in range(6):
        y = 190 + f * 40
        for c in range(8):
            s.barra(34 + c * 155, y, 110)
    s.etiqueta(1260, 440, "tabla de créditos del tramo", "end")
    s.guardar("S12-detalle-tramo.svg")

    s = Escritorio("S13", "Bandeja del comité")
    s.barra(20, 80, 220, 12)
    for i in range(4):
        y = 110 + i * 72
        s.contorno(20, y, 420, 60, 10); s.barra(36, y + 16, 200, 11); s.barra(36, y + 36, 260, 8)
    s.etiqueta(440, 420, "solicitudes pendientes", "end")
    s.contorno(460, 110, 800, 620, 12)
    s.barra(480, 132, 420, 12)
    s.rect(480, 160, 370, 220, BLOQUE, 8); s.etiqueta(665, 274, "datos del cliente y negocio", "middle")
    s.rect(870, 160, 370, 220, BLOQUE, 8); s.etiqueta(1055, 274, "evaluación", "middle")
    s.rect(480, 396, 760, 170, BLOQUE, 8); s.etiqueta(860, 485, "plan simulado", "middle")
    s.contorno(480, 586, 760, 50, 8); s.etiqueta(1230, 616, "motivo de la decisión", "end")
    s.rect(480, 656, 240, 50, "#bdbdbd", 10); s.rect(740, 656, 240, 50, BLOQUE, 10)
    s.etiqueta(600, 724, "aprobar", "middle"); s.etiqueta(860, 724, "rechazar", "middle")
    s.guardar("S13-bandeja-comite.svg")

    s = Escritorio("S14", "Cierre diario / mensual")
    s.barra(20, 80, 280, 12)
    s.rect(20, 110, 600, 70, BLOQUE2, 10); s.etiqueta(630, 150, "estado: congelado · identificador")
    s.contorno(20, 200, 1240, 300, 12)
    for f in range(8):
        y = 226 + f * 34
        s.barra(40, y, 260); s.barra(560, y, 140)
    s.etiqueta(1250, 490, "cifras del cierre", "end")
    s.rect(20, 520, 300, 52, BLOQUE, 10); s.barra(340, 540, 380, 9)
    s.etiqueta(170, 590, "ejecutar cierre (con confirmación)", "middle")
    s.guardar("S14-cierre.svg")


if __name__ == "__main__":
    moviles()
    escritorio()
    print(sorted(os.listdir(SALIDA)))
