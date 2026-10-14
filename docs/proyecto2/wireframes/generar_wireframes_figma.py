"""Wireframes alineados con el prototipo de Figma (Microcréditos App).

Cada pantalla se describe UNA sola vez como una lista de componentes y se dibuja en dos
niveles de fidelidad a partir de la misma descripción, para que nunca se desfasen:

  * skeleton  -> solo bloques grises que indican dónde va cada elemento
  * anotado   -> los mismos bloques con textos, cifras del núcleo y notas de diseño

Pantallas P01–P14: existen en el prototipo de Figma y respetan su disposición.
Pantallas G01–G07: no existen todavía en Figma; son la guía para construirlas con el
mismo lenguaje visual.

Uso: python3 docs/proyecto2/wireframes/generar_wireframes_figma.py
"""
import html
import os
import textwrap

BASE = os.path.dirname(os.path.abspath(__file__))
DIR_ANOTADO = os.path.join(BASE, "anotado")
DIR_SKELETON = os.path.join(BASE, "skeleton")
FIGMA = "https://www.figma.com/proto/jozM3QI8ZJ6pywdCoO5OVo/Microcr%C3%A9ditos-App?node-id=0-1"
FUENTE = "font-family='Helvetica, Arial, sans-serif'"

# Paleta en escala de grises (baja fidelidad)
TINTA, MEDIO, CLARO, RELLENO, BLANCO = "#1f1f1f", "#6b6b6b", "#bdbdbd", "#ececec", "#ffffff"
OSCURO, OSCURO2 = "#3a3a3a", "#555555"          # encabezados oscuros de Figma
SK_BLOQUE, SK_FUERTE, SK_TEXTO = "#e4e4e4", "#c9c9c9", "#d6d6d6"


def esc(t):
    return html.escape(str(t))


class Pantalla:
    """Lienzo de una pantalla. modo = 'anotado' | 'skeleton'."""

    def __init__(self, modo, codigo, titulo, ancho=360, alto=760, estado="Figma"):
        self.modo, self.codigo, self.titulo = modo, codigo, titulo
        self.w, self.h = ancho, alto
        self.e, self.notas, self.marcas = [], [], []
        self.y = 0
        self.estado = estado  # "Figma" o "Guía"

    # ---------- primitivas ----------
    @property
    def sk(self):
        return self.modo == "skeleton"

    def rect(self, x, y, w, h, fill=BLANCO, stroke=None, r=10, sw=1.2, dash=None):
        s = f" stroke='{stroke}' stroke-width='{sw}'" if stroke else ""
        d = f" stroke-dasharray='{dash}'" if dash else ""
        self.e.append(f"<rect x='{x:.1f}' y='{y:.1f}' width='{w:.1f}' height='{h:.1f}' rx='{r}' fill='{fill}'{s}{d}/>")

    def circ(self, cx, cy, r, fill=RELLENO, stroke=None):
        s = f" stroke='{stroke}' stroke-width='1.5'" if stroke else ""
        self.e.append(f"<circle cx='{cx:.1f}' cy='{cy:.1f}' r='{r}' fill='{fill}'{s}/>")

    def texto(self, x, y, t, size=12, peso="normal", color=TINTA, anchor="start", mono=False, fuerte=False):
        """En modo skeleton el texto se convierte en una barra gris del mismo ancho aproximado."""
        if t is None or t == "":
            return
        if self.sk:
            ancho = min(len(str(t)) * size * 0.52, self.w - 40)
            alto = max(6, size * 0.62)
            x0 = x - ancho if anchor == "end" else (x - ancho / 2 if anchor == "middle" else x)
            self.rect(x0, y - alto, ancho, alto, SK_FUERTE if (fuerte or peso == "bold" and size >= 16) else SK_TEXTO, alto / 2)
            return
        fam = "font-family='Courier New, monospace'" if mono else FUENTE
        self.e.append(f"<text x='{x:.1f}' y='{y:.1f}' {fam} font-size='{size}' font-weight='{peso}' fill='{color}' text-anchor='{anchor}'>{esc(t)}</text>")

    def etiqueta_sk(self, x, y, t, anchor="end"):
        """Nombre de la región, solo en skeleton."""
        if self.sk:
            self.e.append(f"<text x='{x:.1f}' y='{y:.1f}' {FUENTE} font-size='9.5' fill='#8a8a8a' text-anchor='{anchor}'>{esc(t)}</text>")

    def nota(self, y, texto):
        if self.sk:
            return
        n = len(self.notas) + 1
        self.notas.append(texto)
        x = self.w + 16
        self.marcas.append(f"<line x1='{self.w - 4}' y1='{y:.1f}' x2='{x - 10}' y2='{y:.1f}' stroke='{TINTA}' stroke-width='1' stroke-dasharray='2 2'/>")
        self.marcas.append(f"<circle cx='{x}' cy='{y:.1f}' r='10' fill='{TINTA}'/>")
        self.marcas.append(f"<text x='{x}' y='{y + 4:.1f}' {FUENTE} font-size='11' font-weight='bold' fill='#fff' text-anchor='middle'>{n}</text>")

    # ---------- componentes móviles (lenguaje visual del prototipo) ----------
    def barra_estado(self, oscuro=True):
        self.rect(0, 0, self.w, 28, OSCURO if oscuro and not self.sk else ("#f0f0f0" if self.sk else RELLENO), 0)
        self.texto(16, 19, "9:41", 11, "bold", BLANCO if oscuro else TINTA)
        self.texto(self.w - 16, 19, "▮▮ ◠ ▭", 10, color=BLANCO if oscuro else TINTA, anchor="end")
        self.y = 28

    def encabezado(self, titulo, sobre=None, atras=True, avatar=None, alto=64, tono=OSCURO, etq="encabezado", centro=None):
        fondo = "#f0f0f0" if self.sk else tono
        self.rect(0, self.y, self.w, alto, fondo, 0)
        centro = centro if centro is not None else alto / 2
        x = 16
        if atras:
            if self.sk:
                self.circ(28, self.y + alto / 2, 10, SK_BLOQUE)
            else:
                self.texto(20, self.y + alto / 2 + 6, "‹", 22, "bold", BLANCO)
            x = 48
        if sobre:
            self.texto(x, self.y + alto / 2 - 8, sobre.upper(), 9.5, color="#d0d0d0")
            self.texto(x, self.y + alto / 2 + 12, titulo, 16, "bold", BLANCO)
        else:
            self.texto(x, self.y + centro + 6, titulo, 19, "bold", BLANCO)
        if avatar:
            self.circ(self.w - 34, self.y + centro, 17, SK_FUERTE if self.sk else "#9a9a9a")
            self.texto(self.w - 34, self.y + centro + 5, avatar, 12, "bold", TINTA, "middle")
        self.etiqueta_sk(self.w - 12, self.y + alto - 6, etq)
        self.y += alto

    def heroe(self, titulo, subtitulo, extra=None, alto=180, tono=OSCURO2, icono="✓", etq="resultado"):
        self.rect(0, self.y, self.w, alto, "#f0f0f0" if self.sk else tono, 0)
        self.circ(self.w / 2, self.y + 46, 26, SK_FUERTE if self.sk else BLANCO)
        self.texto(self.w / 2, self.y + 54, icono, 22, "bold", tono, "middle")
        self.texto(self.w / 2, self.y + 100, titulo, 19, "bold", BLANCO, "middle")
        self.texto(self.w / 2, self.y + 120, subtitulo, 11, color="#e0e0e0", anchor="middle")
        if extra:
            self.texto(self.w / 2, self.y + 158, extra, 24, "bold", BLANCO, "middle", mono=True, fuerte=True)
        self.etiqueta_sk(self.w - 12, self.y + alto - 8, etq)
        self.y += alto

    def espacio(self, h=12):
        self.y += h

    def tarjeta(self, filas, titulo=None, etq=None, destacar=False, borde=None, pad=14):
        """Tarjeta blanca con filas. Cada fila es una tupla (tipo, ...)."""
        y0 = self.y
        alto = self._alto_filas(filas) + (26 if titulo else 0) + pad * 2
        relleno = "#f6f6f6" if destacar and not self.sk else BLANCO
        trazo = borde or ("#cfcfcf" if not destacar else TINTA)
        self.rect(12, y0, self.w - 24, alto, relleno, trazo, 12, 1.4 if destacar else 1.1)
        yy = y0 + pad
        if titulo:
            self.texto(26, yy + 11, titulo.upper(), 10, "bold", MEDIO)
            yy += 26
        for f in filas:
            yy = self._fila(f, yy)
        self.etiqueta_sk(self.w - 20, y0 + alto - 6, etq or "")
        self.y = y0 + alto + 10
        return y0

    def _alto_filas(self, filas):
        return sum(self._alto(f) for f in filas)

    def _alto(self, f):
        t = f[0]
        fijos = {"kv": 26, "big": 44, "texto": 18, "stepper": 70, "sep": 10, "campo": 64, "stats": 64, "total": 32}
        if t in fijos:
            return fijos[t]
        if t == "chips":
            return 44 * ((len(f[1]) + f[3] - 1) // f[3])
        if t == "grid":
            return 46 * ((len(f[1]) + f[2] - 1) // f[2])
        por_item = {"barras": 46, "clientes": 50, "pasos": 26, "lista": 44}
        return por_item.get(t, 20) * len(f[1])

    def _fila(self, f, y):
        t, W = f[0], self.w
        if t == "kv":
            _, k, v = f[:3]
            fuerte = len(f) > 3 and f[3]
            self.texto(26, y + 16, k, 12.5, "bold" if fuerte else "normal")
            self.texto(W - 26, y + 16, v, 12.5, "bold" if fuerte else "normal", anchor="end", mono=True, fuerte=fuerte)
            self.rect(26, y + 24, W - 52, 0.8, "#e6e6e6", r=0)
        elif t == "big":
            self.texto(26, y + 34, f[1], 28, "bold", mono=True, fuerte=True)
        elif t == "texto":
            self.texto(26, y + 13, f[1], 11, color=MEDIO)
        elif t == "chips":
            _, ops, sel, cols = f
            w = (W - 52 - (cols - 1) * 8) / cols
            for i, o in enumerate(ops):
                cx, cy = 26 + (i % cols) * (w + 8), y + (i // cols) * 44
                on = o == sel
                self.rect(cx, cy, w, 36, (SK_FUERTE if self.sk else OSCURO) if on else (SK_BLOQUE if self.sk else BLANCO),
                          None if self.sk else "#cfcfcf", 8)
                self.texto(cx + w / 2, cy + 23, o, 12, "bold", BLANCO if on else TINTA, "middle", mono=True)
        elif t == "stepper":
            _, valor, pista = f
            self.rect(26, y, 40, 40, SK_BLOQUE if self.sk else RELLENO, r=8)
            self.rect(W - 66, y, 40, 40, SK_BLOQUE if self.sk else RELLENO, r=8)
            self.texto(46, y + 27, "−", 18, "bold", anchor="middle")
            self.texto(W - 46, y + 27, "+", 18, "bold", anchor="middle")
            self.texto(W / 2, y + 28, valor, 22, "bold", anchor="middle", mono=True, fuerte=True)
            self.texto(W / 2, y + 56, pista, 10, color=MEDIO, anchor="middle")
        elif t == "grid":
            _, celdas, cols = f
            w = (W - 52) / cols
            for i, (k, v) in enumerate(celdas):
                cx, cy = 26 + (i % cols) * w, y + (i // cols) * 46
                self.texto(cx, cy + 12, k, 10, color=MEDIO)
                self.texto(cx, cy + 34, v, 15, "bold", mono=True)
        elif t == "barras":
            for i, (k, v, frac, sub) in enumerate(f[1]):
                cy = y + i * 46
                self.texto(26, cy + 13, k, 12, "bold")
                self.texto(W - 26, cy + 13, v, 12, "bold", anchor="end", mono=True)
                self.rect(26, cy + 20, W - 52, 6, SK_BLOQUE if self.sk else RELLENO, r=3)
                self.rect(26, cy + 20, (W - 52) * frac, 6, SK_FUERTE if self.sk else [OSCURO, "#6e6e6e", "#9a9a9a", "#4b4b4b"][i % 4], r=3)
                self.texto(26, cy + 39, sub, 9.5, color=MEDIO)
        elif t == "clientes":
            for i, (ini, nombre, sub, check) in enumerate(f[1]):
                cy = y + i * 50
                self.rect(26, cy, W - 52, 42, SK_BLOQUE if (self.sk and check) else BLANCO, TINTA if check else "#dcdcdc", 8, 1.6 if check else 1)
                self.circ(48, cy + 21, 13, SK_FUERTE if self.sk else RELLENO)
                self.texto(48, cy + 25, ini, 10, "bold", anchor="middle")
                self.texto(70, cy + 18, nombre, 12, "bold")
                self.texto(70, cy + 33, sub, 10, color=MEDIO)
                if check:
                    self.circ(W - 44, cy + 21, 9, SK_FUERTE if self.sk else TINTA)
        elif t == "pasos":
            for i, p in enumerate(f[1]):
                cy = y + i * 26
                self.circ(34, cy + 9, 8, SK_BLOQUE if self.sk else RELLENO)
                self.texto(34, cy + 13, str(i + 1), 10, "bold", anchor="middle")
                self.texto(50, cy + 13, p, 11.5)
        elif t == "sep":
            self.rect(26, y + 4, W - 52, 0.8, "#e0e0e0", r=0)
        elif t == "campo":
            _, etiqueta, valor = f
            self.texto(26, y + 12, etiqueta, 11, "bold")
            self.rect(26, y + 20, W - 52, 38, SK_BLOQUE if self.sk else BLANCO, None if self.sk else "#cfcfcf", 8)
            self.texto(38, y + 44, valor, 12, color=MEDIO)
        elif t == "lista":
            for i, (icono, k, v) in enumerate(f[1]):
                cy = y + i * 44
                self.circ(38, cy + 18, 11, SK_BLOQUE if self.sk else RELLENO)
                self.texto(38, cy + 22, icono, 11, anchor="middle")
                self.texto(58, cy + 22, k, 12)
                self.texto(W - 26, cy + 22, v, 12, "bold", anchor="end")
                if i < len(f[1]) - 1:
                    self.rect(26, cy + 38, W - 52, 0.8, "#e6e6e6", r=0)
        elif t == "stats":
            _, celdas = f
            n = len(celdas)
            w = (W - 52 - (n - 1) * 8) / n
            for i, (k, v, hl) in enumerate(celdas):
                cx = 26 + i * (w + 8)
                self.rect(cx, y, w, 56, (SK_FUERTE if self.sk else OSCURO) if hl else (SK_BLOQUE if self.sk else "#f4f4f4"), None, 8)
                self.texto(cx + w / 2, y + 20, k, 10, color="#dddddd" if hl else MEDIO, anchor="middle")
                self.texto(cx + w / 2, y + 42, v, 12.5, "bold", BLANCO if hl else TINTA, "middle", mono=True)
        elif t == "total":
            _, k, v = f
            self.texto(26, y + 21, k, 14, "bold")
            self.texto(W - 26, y + 21, v, 17, "bold", anchor="end", mono=True, fuerte=True)
        return y + self._alto(f)

    def buscador(self, texto):
        self.rect(16, self.y - 52, self.w - 32, 38, SK_BLOQUE if self.sk else "#5a5a5a", r=10)
        self.texto(44, self.y - 28, texto, 12, color="#d0d0d0")

    def segmentado(self, ops, sel):
        w = 84
        self.rect(16, self.y, w * len(ops) + 8, 34, SK_BLOQUE if self.sk else RELLENO, r=10)
        for i, o in enumerate(ops):
            if o == sel:
                self.rect(20 + i * w, self.y + 4, w, 26, SK_FUERTE if self.sk else BLANCO, r=8)
            self.texto(20 + i * w + w / 2, self.y + 21, o, 11, "bold" if o == sel else "normal", anchor="middle")
        self.y += 46

    def cliente(self, ini, nombre, lugar, monto, tag, dias):
        y = self.y
        self.rect(12, y, self.w - 24, 78, BLANCO, "#d6d6d6", 12)
        self.circ(46, y + 39, 20, SK_FUERTE if self.sk else "#8f8f8f")
        self.texto(46, y + 44, ini, 12, "bold", BLANCO, "middle")
        self.texto(78, y + 26, nombre, 13.5, "bold")
        self.texto(78, y + 43, lugar, 11, color=MEDIO)
        self.texto(78, y + 62, monto, 12.5, mono=True)
        self.rect(self.w - 98, y + 14, 70, 18, SK_FUERTE if self.sk else OSCURO2, r=9)
        self.texto(self.w - 63, y + 27, tag, 10, "bold", BLANCO, "middle")
        self.texto(self.w - 28, y + 48, dias, 10, color=MEDIO, anchor="end")
        self.texto(self.w - 28, y + 66, "›", 14, color=MEDIO, anchor="end")
        self.y += 88

    def fab(self):
        self.circ(self.w - 44, self.h - 44, 26, SK_FUERTE if self.sk else "#8a8a8a")
        self.texto(self.w - 44, self.h - 36, "+", 24, "bold", BLANCO, "middle")
        self.etiqueta_sk(self.w - 44, self.h - 8, "nueva solicitud", "middle")

    def boton(self, texto, estilo="primario", etq=None):
        colores = {"primario": OSCURO, "exito": "#4a4a4a", "alerta": "#5a5a5a", "secundario": BLANCO, "inactivo": "#b8b8b8"}
        fondo = (SK_FUERTE if estilo in ("primario", "exito", "alerta") else SK_BLOQUE) if self.sk else colores[estilo]
        self.rect(16, self.y, self.w - 32, 50, fondo, None if estilo != "secundario" or self.sk else "#bdbdbd", 12)
        self.texto(self.w / 2, self.y + 31, texto, 14.5, "bold", TINTA if estilo == "secundario" else BLANCO, "middle")
        self.etiqueta_sk(self.w - 24, self.y + 64, etq or "")
        self.y += 60 if not etq or not self.sk else 70

    def dos_botones(self, a, b, etq=None):
        w = (self.w - 40) / 2
        for i, (t, primario) in enumerate([(a, False), (b, True)]):
            x = 16 + i * (w + 8)
            self.rect(x, self.y, w, 46, (SK_FUERTE if primario else SK_BLOQUE) if self.sk else (OSCURO if primario else BLANCO),
                      None if (self.sk or primario) else "#bdbdbd", 12)
            self.texto(x + w / 2, self.y + 29, t, 13, "bold", BLANCO if primario else TINTA, "middle")
        self.etiqueta_sk(self.w - 24, self.y + 60, etq or "")
        self.y += 56

    def enlace(self, t):
        self.texto(self.w / 2, self.y + 14, t, 12, color=MEDIO, anchor="middle")
        self.y += 28

    def aviso(self, titulo, cuerpo, etq="aviso"):
        lineas = textwrap.wrap(cuerpo, 46)
        alto = 34 + 15 * len(lineas)
        self.rect(12, self.y, self.w - 24, alto, "#f3f3f3" if not self.sk else BLANCO, "#9a9a9a", 10, 1.3)
        self.texto(26, self.y + 20, "⚠ " + titulo, 12.5, "bold")
        for i, l in enumerate(lineas):
            self.texto(26, self.y + 38 + i * 15, l, 11, color=MEDIO)
        self.etiqueta_sk(self.w - 20, self.y + alto - 6, etq)
        self.y += alto + 10

    def tabla(self, cab, filas, resaltar=None, total=None, etq="tabla"):
        W = self.w
        cols = len(cab)
        anchos = [22] + [(W - 24 - 22) / (cols - 1)] * (cols - 1)
        xs = [12]
        for a in anchos[:-1]:
            xs.append(xs[-1] + a)
        self.rect(12, self.y, W - 24, 24, SK_FUERTE if self.sk else OSCURO, r=6)
        for x, a, c in zip(xs, anchos, cab):
            self.texto(x + a - 4 if c != "#" else x + 6, self.y + 16, c, 9.5, "bold", BLANCO, "end" if c != "#" else "start")
        self.y += 26
        for i, fila in enumerate(filas):
            if i == resaltar:
                self.rect(12, self.y - 1, W - 24, 20, "#e6e6e6" if not self.sk else "#efefef", TINTA if not self.sk else None, 4, 1)
            for x, a, c in zip(xs, anchos, fila):
                self.texto(x + a - 4 if x != 12 else x + 6, self.y + 13, c, 9.5, "bold" if i == resaltar else "normal",
                           anchor="end" if x != 12 else "start", mono=True)
            self.y += 20
        if total:
            self.rect(12, self.y, W - 24, 22, SK_FUERTE if self.sk else OSCURO, r=6)
            for x, a, c in zip(xs, anchos, total):
                self.texto(x + a - 4 if x != 12 else x + 6, self.y + 15, c, 9.5, "bold", BLANCO,
                           "end" if x != 12 else "start", mono=True)
            self.y += 26
        self.etiqueta_sk(W - 16, self.y + 10, etq)
        self.y += 14

    def tramo(self, nombre, sub, monto, filas, nota, tono):
        y0 = self.y
        alto = 44 + 22 * len(filas) + 22
        self.rect(12, y0, self.w - 24, alto, BLANCO, "#cfcfcf", 12)
        self.rect(12, y0, self.w - 24, 44, SK_FUERTE if self.sk else tono, r=12)
        self.texto(26, y0 + 20, nombre, 13, "bold", BLANCO)
        self.texto(26, y0 + 36, sub, 10, color="#eeeeee")
        self.texto(self.w - 26, y0 + 30, monto, 16, "bold", BLANCO, "end", mono=True, fuerte=True)
        yy = y0 + 50
        for k, v in filas:
            self.texto(26, yy + 13, k, 11)
            self.texto(self.w - 26, yy + 13, v, 11.5, "bold", anchor="end", mono=True)
            yy += 22
        self.texto(26, yy + 12, nota, 9.5, color=MEDIO)
        self.y = y0 + alto + 8
        return y0

    # ---------- escritorio ----------
    def nav_escritorio(self, activo):
        self.rect(0, 0, self.w, 56, "#f0f0f0" if self.sk else OSCURO, r=0)
        self.texto(20, 35, "Crédito Vecino", 16, "bold", BLANCO)
        for i, it in enumerate(["Tablero", "Bandeja del comité", "Cierres", "Créditos"]):
            x = 210 + i * 170
            self.texto(x, 35, it, 13, "bold" if it == activo else "normal", BLANCO)
            if it == activo and not self.sk:
                self.rect(x, 48, 110, 3, BLANCO, r=1)
        self.circ(self.w - 34, 28, 16, SK_FUERTE if self.sk else "#9a9a9a")
        self.texto(self.w - 34, 33, "AM", 11, "bold", TINTA, "middle")

    def caja(self, x, y, w, h, etiqueta, dash=False, relleno=None):
        self.rect(x, y, w, h, relleno or (SK_BLOQUE if self.sk else "#f4f4f4"), "#bdbdbd", 10, 1.2, "6 4" if dash else None)
        self.texto(x + w / 2, y + h / 2 + 4, etiqueta, 11, color=MEDIO, anchor="middle")
        if self.sk:
            self.e.append(f"<text x='{x + w / 2:.1f}' y='{y + h / 2 + 4:.1f}' {FUENTE} font-size='10' fill='#8a8a8a' text-anchor='middle'>{esc(etiqueta)}</text>")

    def kpi(self, x, y, w, h, simbolo, titulo, valor, sub1, sub2, estilo):
        dash = "6 4" if estilo == "discontinuo" else None
        sw = 3 if estilo == "grueso" else 1.4
        self.rect(x, y, w, h, BLANCO, TINTA if estilo != "normal" else "#bdbdbd", 12, sw, dash)
        self.texto(x + 16, y + 28, f"{simbolo} {titulo}", 14, "bold")
        self.texto(x + 16, y + 76, valor, 36, "bold", fuerte=True)
        self.texto(x + 16, y + 102, sub1, 11.5, color=MEDIO)
        self.texto(x + 16, y + 120, sub2, 11.5)
        self.etiqueta_sk(x + w - 12, y + h - 8, titulo.lower())

    # ---------- salida ----------
    def guardar(self, nombre):
        dispositivo = f"{'Móvil' if self.w < 600 else 'Escritorio'} {self.w}×{self.h}"
        nivel = "skeleton" if self.sk else "wireframe anotado"
        origen = "pantalla del prototipo de Figma" if self.estado == "Figma" else "GUÍA: pantalla por construir en Figma"
        ancho_total = self.w + 60
        lineas_notas = []
        if not self.sk:
            maxc = int((self.w + 20) / 6.3)
            for n, t in enumerate(self.notas, 1):
                for i, l in enumerate(textwrap.wrap(t, maxc - 4)):
                    lineas_notas.append((n if i == 0 else None, l))
        H = self.h + 80 + 16 * len(lineas_notas) + (16 if lineas_notas else 0)
        s = [f"<svg xmlns='http://www.w3.org/2000/svg' width='{ancho_total}' height='{H}' viewBox='0 0 {ancho_total} {H}'>",
             "<rect width='100%' height='100%' fill='#f7f7f7'/>",
             f"<text x='20' y='26' {FUENTE} font-size='14' font-weight='bold' fill='#222'>{esc(self.codigo)} · {esc(self.titulo)}</text>",
             f"<text x='20' y='44' {FUENTE} font-size='11' fill='{'#777' if self.estado == 'Figma' else '#a33'}'>{dispositivo} · {nivel} · {origen}</text>",
             "<g transform='translate(20,58)'>",
             f"<rect x='0' y='0' width='{self.w}' height='{self.h}' rx='18' fill='{'#fbfbfb' if not self.sk else BLANCO}' stroke='#8a8a8a' stroke-width='2'/>",
             f"<clipPath id='c'><rect x='0' y='0' width='{self.w}' height='{self.h}' rx='18'/></clipPath><g clip-path='url(#c)'>"]
        s += self.e + ["</g>"] + self.marcas + ["</g>"]
        y = self.h + 58 + 26
        for n, l in lineas_notas:
            pre = f"<tspan font-weight='bold'>{n}.</tspan> " if n else ""
            s.append(f"<text x='{20 if n else 34}' y='{y}' {FUENTE} font-size='11.5' fill='#222'>{pre}{esc(l)}</text>")
            y += 16
        s.append("</svg>")
        destino = DIR_SKELETON if self.sk else DIR_ANOTADO
        os.makedirs(destino, exist_ok=True)
        with open(os.path.join(destino, nombre), "w", encoding="utf-8") as f:
            f.write("\n".join(s))


# =====================================================================
#  Pantallas del prototipo (P01–P14)
# =====================================================================

def p01(m):
    p = Pantalla(m, "P01", "Iniciar sesión")
    p.barra_estado()
    p.rect(0, 28, p.w, 190, "#f0f0f0" if p.sk else OSCURO, r=0)
    p.rect(p.w / 2 - 28, 60, 56, 56, SK_FUERTE if p.sk else "#9a9a9a", r=12)
    p.texto(p.w / 2, 150, "Crédito Vecino", 20, "bold", BLANCO, "middle")
    p.texto(p.w / 2, 172, "Sistema para asesores de campo", 11, color="#d0d0d0", anchor="middle")
    p.etiqueta_sk(p.w - 12, 212, "marca")
    p.y = 232
    y0 = p.tarjeta([("kv", "Iniciar sesión", "", True), ("campo", "Usuario", "ej. maju.toc"), ("campo", "Contraseña", "••••••••   (mostrar)")], etq="credenciales")
    p.nota(y0 + 110, "Contraseña con opción de mostrarla y que permita pegar (WCAG 3.3.8, autenticación accesible).")
    p.y -= 10
    p.boton("Ingresar")
    p.enlace("¿Olvidaste tu contraseña? Llama al soporte técnico")
    p.nota(p.y - 14, "Ayuda visible desde el inicio; debe repetirse en el mismo lugar en todas las pantallas (WCAG 3.2.6, hallazgo H-11).")
    p.texto(p.w / 2, p.h - 24, "Crédito Vecino, S. A. · v2.4.1", 10, color=MEDIO, anchor="middle")
    p.guardar("P01-iniciar-sesion.svg")


CLIENTES = [("PX", "Pedro Xol Cux", "San Martín Jilotepeque", "Q 17,580.00", "Incobrable", "132 d"),
            ("RL", "Rosa López Ajú", "Chimaltenango", "Q 6,240.50", "Mora 3", "85 d"),
            ("AS", "Ana Sánchez Chumil", "Zaragoza", "Q 2,870.40", "Mora 2", "45 d"),
            ("MG", "María García Oxlaj", "Patzicía", "Q 3,980.20", "Mora 1", "18 d"),
            ("JP", "Juan Pablo Pérez Xol", "Tecpán Guatemala", "Q 8,960.00", "Al día", ""),
            ("CM", "Carlos Martínez Ixcot", "San Andrés Itzapa", "Q 11,250.00", "Al día", "")]


def p02(m):
    p = Pantalla(m, "P02", "Mis Clientes")
    p.barra_estado()
    p.encabezado("Mis Clientes", atras=False, avatar="MA", alto=110, etq="encabezado + búsqueda", centro=30)
    p.buscador("Buscar cliente o municipio…")
    p.nota(p.y - 34, "Búsqueda por nombre o municipio: se reconoce, no se recuerda (Nielsen 6). Sustituye a la pantalla de búsqueda separada.")
    p.espacio(12)
    p.segmentado(["Prioridad", "Nombre A–Z"], "Prioridad")
    y0 = p.y
    for c in CLIENTES:
        p.cliente(*c)
    p.nota(y0 + 26, "Etiqueta de tramo y días de atraso en cada tarjeta; ordenar por prioridad pone primero a quien más urge visitar.")
    p.fab()
    p.nota(p.h - 44, "Botón + inicia una nueva solicitud (CU-02).")
    p.guardar("P02-mis-clientes.svg")


def p03(m):
    p = Pantalla(m, "P03", "Mi perfil")
    p.barra_estado()
    p.encabezado("Mi perfil", atras=True, alto=56)
    p.espacio(12)
    y0 = p.y
    p.rect(12, p.y, p.w - 24, 120, SK_BLOQUE if p.sk else OSCURO, r=12)
    p.rect(26, p.y + 14, 80, 92, SK_FUERTE if p.sk else "#9a9a9a", r=8)
    p.texto(120, p.y + 40, "ASESOR DE CRÉDITO", 9.5, color="#d0d0d0")
    p.texto(120, p.y + 60, "Miguel Ángel Ajú Toc", 14, "bold", BLANCO)
    p.texto(120, p.y + 92, "ASR-0247", 18, "bold", BLANCO, mono=True)
    p.etiqueta_sk(p.w - 20, p.y + 114, "datos de la asesora")
    p.y += 132
    p.tarjeta([("lista", [("◎", "Zona Chimaltenango Sur", "Chimaltenango"), ("◷", "Ruta 3 · Patzicía / Zaragoza", ""),
                          ("♙", "Cartera asignada", "6 clientes"), ("↻", "Señal débil · 1 registro pendiente", "")])],
              "Estado operativo", "estado operativo")
    p.nota(p.y - 40, "Estado de sincronización visible: 'última sincronización hace 18 min · 1 registro pendiente' (Nielsen 1).")
    p.tarjeta([("stats", [("Total", "6", False), ("Al día", "2", False), ("En mora", "4", True)])], etq="resumen de cartera")
    p.tarjeta([("lista", [("🔒", "Cambiar contraseña", "›"), ("⇥", "Cerrar sesión", "")])], "Cuenta y sesión", "cuenta")
    p.nota(y0 + 60, "Pantalla de soporte de sesión: no corresponde a un caso de uso del P1. Se justifica como soporte (estado de sincronización) o se retira del prototipo.")
    p.guardar("P03-mi-perfil.svg")


def p04(m):
    p = Pantalla(m, "P04", "Nueva solicitud · paso 1 de 3", alto=1000)
    p.barra_estado()
    p.encabezado("Nueva solicitud", sobre="Paso 1 de 3", alto=64)
    p.espacio(12)
    y0 = p.tarjeta([("clientes", [("RL", "Rosa López Ajú", "Chimaltenango", False), ("JP", "Juan Pablo Pérez Xol", "Tecpán Guatemala", False),
                                  ("MG", "María García Oxlaj", "Patzicía", False), ("CM", "Carlos Martínez Ixcot", "San Andrés Itzapa", True),
                                  ("AS", "Ana Sánchez Chumil", "Zaragoza", False)])], "Seleccionar cliente", "cliente (lista)")
    p.nota(y0 + 170, "El cliente se elige de la lista, no se teclea: no se vuelve a pedir un dato ya capturado (WCAG 3.3.7).")
    y1 = p.tarjeta([("stepper", "Q 5,000.00", "Q1,000 – Q25,000 en pasos de Q500"),
                    ("chips", ["Q2k", "Q5k", "Q10k", "Q15k", "Q20k", "Q25k"], "Q5k", 3)], "Monto del crédito", "monto")
    p.nota(y1 + 60, "Monto con − / + y montos rápidos; el rango se ve siempre. Evita teclear Q100,000 cuando el máximo es Q25,000 (MC-1, Nielsen 5).")
    y2 = p.tarjeta([("chips", ["3m", "6m", "9m", "12m", "18m", "24m"], "12m", 3)], "Plazo", "plazo")
    p.nota(y2 + 40, "Plazo con botones (3 a 24 meses), sin teclado.")
    y3 = p.tarjeta([("big", "Q 502.31"), ("texto", "Tasa 3 % mensual · 12 cuotas · total Q 6,027.70")], "Cuota mensual estimada", "cuota estimada", destacar=True)
    p.nota(y3 + 40, "Cuota calculada por el núcleo (plan-amortizacion.ts): Q5,000 × 12 meses = Q502.31, la mitad exacta del caso de referencia.")
    p.boton("Ver plan de amortización →")
    p.guardar("P04-nueva-solicitud.svg")


PLAN_5K = [("1", "502.31", "150.00", "352.31", "4,647.69"), ("2", "502.31", "139.43", "362.88", "4,284.81"),
           ("3", "502.31", "128.54", "373.77", "3,911.04"), ("4", "502.31", "117.33", "384.98", "3,526.06"),
           ("5", "502.31", "105.78", "396.53", "3,129.53"), ("6", "502.31", "93.89", "408.42", "2,721.11"),
           ("7", "502.31", "81.63", "420.68", "2,300.43"), ("8", "502.31", "69.01", "433.30", "1,867.13"),
           ("9", "502.31", "56.01", "446.30", "1,420.83"), ("10", "502.31", "42.62", "459.69", "961.14"),
           ("11", "502.31", "28.83", "473.48", "487.66"), ("12", "502.29", "14.63", "487.66", "0.00")]

PLAN_10K = [("1", "1,004.62", "300.00", "704.62", "9,295.38"), ("2", "1,004.62", "278.86", "725.76", "8,569.62"),
            ("3", "1,004.62", "257.09", "747.53", "7,822.09"), ("4", "1,004.62", "234.66", "769.96", "7,052.13"),
            ("5", "1,004.62", "211.56", "793.06", "6,259.07"), ("6", "1,004.62", "187.77", "816.85", "5,442.22"),
            ("7", "1,004.62", "163.27", "841.35", "4,600.87"), ("8", "1,004.62", "138.03", "866.59", "3,734.28"),
            ("9", "1,004.62", "112.03", "892.59", "2,841.69"), ("10", "1,004.62", "85.25", "919.37", "1,922.32"),
            ("11", "1,004.62", "57.67", "946.95", "975.37"), ("12", "1,004.63", "29.26", "975.37", "0.00")]


def p05(m):
    p = Pantalla(m, "P05", "Simulación de pago · paso 2 de 3")
    p.barra_estado()
    p.encabezado("Simulación de pago", sobre="Paso 2 de 3", alto=64)
    p.espacio(12)
    p.tarjeta([("stats", [("Capital", "Q 5,000.00", False), ("Cuota", "Q 502.31", False), ("Interés total", "Q 1,027.70", False)])], etq="resumen")
    y0 = p.y
    p.tabla(["#", "Cuota", "Interés", "Capital", "Saldo"], PLAN_5K, resaltar=11,
            total=["Σ", "6,027.70", "1,027.70", "5,000.00", "0.00"], etq="12 cuotas del núcleo")
    p.nota(y0 + 250, "Las 12 cuotas las calcula el núcleo. La última (Q502.29) es menor por el ajuste de cuadre: agregar la explicación, como en P09.")
    p.dos_botones("← Modificar", "Confirmar →")
    p.nota(p.y - 30, "Salida clara para corregir monto o plazo antes de confirmar (Nielsen 3).")
    p.guardar("P05-simulacion-pago.svg")


def p06(m):
    p = Pantalla(m, "P06", "Confirmar solicitud · paso 3 de 3")
    p.barra_estado()
    p.encabezado("Confirmar solicitud", sobre="Paso 3 de 3", alto=64)
    p.espacio(12)
    y0 = p.y
    p.aviso("Revise antes de enviar", "Esta acción enviará la solicitud al sistema para aprobación. No se puede modificar una vez enviada.")
    p.nota(y0 + 30, "Revisión antes de una acción que no se puede deshacer (WCAG 3.3.4).")
    p.tarjeta([("texto", "Cliente"), ("kv", "Carlos Martínez Ixcot", "", True), ("texto", "San Andrés Itzapa · DPI 4567 89012 0101"), ("sep",),
               ("grid", [("Monto solicitado", "Q 5,000.00"), ("Plazo", "12 meses"), ("Cuota mensual", "Q 502.31"),
                         ("Tasa mensual", "3.00 %"), ("Total intereses", "Q 1,027.70"), ("Total a devolver", "Q 6,027.70")], 2)],
              "Datos de la solicitud", "datos de la solicitud")
    p.boton("✓ Enviar solicitud", "exito")
    p.enlace("Cancelar y volver al inicio")
    p.guardar("P06-confirmar-solicitud.svg")


def p07(m):
    p = Pantalla(m, "P07", "Solicitud enviada")
    p.barra_estado(False)
    p.heroe("Solicitud enviada", "Pendiente de aprobación del comité", alto=170)
    p.espacio(12)
    y0 = p.tarjeta([("big", "SOL-835678"), ("texto", "Carlos Martínez Ixcot · Q 5,000.00 · 12 meses")], "No. de referencia", "referencia")
    p.nota(y0 + 60, "Debe mostrar el MISMO cliente elegido en el paso 1 (en Figma aparece otro nombre: hallazgo H-08).")
    p.tarjeta([("pasos", ["El comité revisará la solicitud en 24–48 h.", "Recibirás notificación en esta app.",
                          "El desembolso se confirma en G02 (por construir)."])], "¿Qué sigue?", "próximos pasos")
    p.nota(p.y - 40, "El flujo 1 del E3 debe continuar hasta la confirmación de desembolso (guía G02).")
    p.boton("Volver al inicio")
    p.guardar("P07-solicitud-enviada.svg")


def p08(m):
    p = Pantalla(m, "P08", "Detalle del crédito")
    p.barra_estado()
    p.encabezado("Ana Sánchez Chumil", sobre="Detalle del crédito", alto=64)
    p.rect(12, p.y + 8, p.w - 24, 44, SK_BLOQUE if p.sk else "#5a5a5a", r=10)
    p.texto(26, p.y + 28, "◎ Aldea Lo de Ramírez", 11.5, "bold", BLANCO)
    p.texto(26, p.y + 44, "Zaragoza", 10, color="#d0d0d0")
    p.texto(p.w - 26, p.y + 36, "+502 5123-4567", 11, color=BLANCO, anchor="end", mono=True)
    p.etiqueta_sk(p.w - 20, p.y + 62, "ubicación y teléfono")
    p.y += 64
    y0 = p.y
    p.rect(12, p.y, p.w - 24, 82, SK_BLOQUE if p.sk else "#707070", r=12)
    p.texto(26, p.y + 26, "Mora 2", 15, "bold", BLANCO)
    p.texto(26, p.y + 44, "Lleva 45 días de atraso", 11, color=BLANCO)
    p.texto(26, p.y + 66, "En 15 días pasa a más de 60 días: la mora diaria sube de Q0.48 a Q0.60.", 9.5, color=BLANCO)
    p.rect(p.w - 76, p.y + 12, 50, 44, SK_FUERTE if p.sk else "#8a8a8a", r=8)
    p.texto(p.w - 51, p.y + 38, "45", 17, "bold", BLANCO, "middle")
    p.etiqueta_sk(p.w - 20, p.y + 78, "estado y tramo")
    p.y += 94
    p.nota(y0 + 40, "Tramo en lenguaje llano ('lleva 45 días de atraso') y aviso del siguiente tramo antes de que ocurra (MC-4).")
    y1 = p.tarjeta([("texto", "Debe hoy (cuota 2 atrasada)"), ("big", "Q 1,047.76"), ("sep",),
                    ("grid", [("Próxima cuota", "Q 1,004.62"), ("Fecha de pago", "10/12/2026"), ("Monto original", "Q 10,000.00"), ("Plazo / tasa", "12 m · 3 %")], 2)],
                   "Resumen del crédito", "resumen del crédito")
    p.nota(y1 + 70, "Cifra principal = lo exigible hoy según el núcleo (M-5: Q25.00 + Q18.14 + Q278.86 + Q725.76). Caso de referencia Q10,000 a 12 meses.")
    p.boton("◷ Registrar pago")
    p.dos_botones("Plan de pago", "Detalle mora", "accesos a P09 y P10")
    p.nota(p.y - 30, "Misma disposición que Figma. Datos de ejemplo: Figma usa a Pedro Xol Cux (incobrable, 132 días); se recomienda un crédito en Mora 2 para que las cifras coincidan con M-2/M-5.")
    p.guardar("P08-detalle-credito.svg")


def p09(m):
    p = Pantalla(m, "P09", "Plan de amortización", alto=820)
    p.barra_estado()
    p.encabezado("Plan de amortización", atras=True, alto=56)
    p.espacio(12)
    p.tarjeta([("stats", [("Capital", "Q 10,000.00", False), ("Interés total", "Q 2,055.45", False), ("Total a pagar", "Q 12,055.45", True)])], etq="resumen")
    p.texto(26, p.y + 12, "ⓘ Capital Q10,000 · 12 meses · tasa 3 % mensual (36 % anual)", 10.5, color=MEDIO)
    p.y += 24
    y0 = p.y
    p.tabla(["#", "Cuota", "Interés", "Capital", "Saldo"], PLAN_10K, resaltar=11,
            total=["Σ", "12,055.45", "2,055.45", "10,000.00", "0.00"], etq="caso de referencia del P1")
    p.nota(y0 + 250, "Cuota 12 = Q1,004.63, resaltada (caso de referencia del enunciado, sección 6.2).")
    y1 = p.tarjeta([("kv", "¿Por qué la última cuota es 1 centavo más?", "", True), ("texto", "Para que el saldo cierre exacto en Q0.00.")],
                   etq="explicación del ajuste", destacar=True)
    p.nota(y1 + 24, "FALTA EN FIGMA: nota que explica el centavo de diferencia (hallazgo H-09).")
    p.guardar("P09-plan-amortizacion.svg")


def p10(m):
    p = Pantalla(m, "P10", "Detalle de mora (caso M-3)", alto=1080)
    p.barra_estado()
    p.encabezado("Detalle de mora", atras=True, alto=56, tono="#4a4a4a")
    p.rect(0, p.y, p.w, 86, "#f0f0f0" if p.sk else "#4a4a4a", r=0)
    p.rect(12, p.y + 6, p.w - 24, 70, SK_BLOQUE if p.sk else "#5f5f5f", r=10)
    for i, (k, v) in enumerate([("Días de atraso", "100"), ("Capital en mora", "Q 725.76"), ("Mora total", "Q 50.80")]):
        cx = 12 + (p.w - 24) / 6 * (2 * i + 1)
        p.texto(cx, p.y + 30, k, 9.5, color="#dddddd", anchor="middle")
        p.texto(cx, p.y + 56, v, 15 if i else 22, "bold", BLANCO, "middle", mono=True, fuerte=True)
    p.etiqueta_sk(p.w - 20, p.y + 84, "resumen")
    y_res = p.y
    p.y += 96
    p.nota(y_res + 40, "CORREGIR EN FIGMA: mora sobre el capital en mora de la cuota (Q725.76), no sobre el saldo total (Q6,240.50). Caso M-3 = Q50.80.")
    p.texto(16, p.y + 12, "Esta cuota lleva 100 días de atraso y recorrió 4 tramos. Cada día", 11, color=MEDIO)
    p.texto(16, p.y + 28, "se cobra a la tasa del tramo en que estaba.", 11, color=MEDIO)
    p.y += 40
    tonos = ["#8a8a8a", "#707070", "#585858", "#3f3f3f"]
    datos = [("Mora 1", "Días 1–30 · 30 días en este tramo", "Q 10.89*", "18 % al año", "Q 0.36", "Recordatorio. Sin gestión de campo."),
             ("Mora 2", "Días 31–60 · 30 días en este tramo", "Q 14.52*", "24 % al año", "Q 0.48", "Visita de cobro: gasto único de Q25.00 al día 31."),
             ("Mora 3", "Días 61–90 · 30 días en este tramo", "Q 18.14*", "30 % al año", "Q 0.60", "Cobro intensivo."),
             ("Vencido", "Días 91–100 · 10 días en este tramo", "Q 7.26*", "36 % al año", "Q 0.73", "Se suspende el devengo del interés corriente.")]
    y_tr = p.y
    for (n, s, mo, tasa, dia, nota), tono in zip(datos, tonos):
        p.tramo(n, s, mo, [("Tasa del tramo", tasa), ("Mora por día", dia)], nota, tono)
    p.nota(y_tr + 60, "CORREGIR EN FIGMA: tasas ANUALES 18/24/30/36 % (no 0.5–2 % mensual). Una tarjeta por tramo recorrido.")
    y1 = p.tarjeta([("kv", "Mora 1 · 30 días", "Q 10.8864"), ("kv", "Mora 2 · 30 días", "Q 14.5152"), ("kv", "Mora 3 · 30 días", "Q 18.1440"),
                    ("kv", "Vencido · 10 días", "Q 7.2576"), ("total", "Mora total (1 redondeo)", "Q 50.80"),
                    ("texto", "* Montos por tramo mostrados a 2 decimales; sumarlos da Q50.81."),
                    ("texto", "  La mora se redondea una sola vez al final: Q50.80.")],
                   "Cómo se calculó", "cálculo y nota de redondeo", destacar=True)
    p.nota(y1 + 110, "Nota de redondeo obligatoria (sección 7.3): redondear por tramo daría Q50.81; lo correcto es Q50.80.")
    p.boton("Registrar pago ahora", "alerta")
    p.nota(p.y - 30, "El enunciado pide el caso M-3 (cuota con 100 días): abrir esta pantalla desde un crédito con 100 días de atraso (p. ej. pasar a Rosa López Ajú a 'Vencido · 100 d' en Mis Clientes).")
    p.guardar("P10-detalle-mora.svg")


PRELACION = [("1. Gastos de gestión", "Q 25.00", 1.0, "Adeudado: Q 25.00 · generado al día 31"),
             ("2. Interés moratorio", "Q 18.14", 1.0, "Adeudado: Q 18.14 · caso M-2"),
             ("3. Interés corriente", "Q 278.86", 1.0, "Adeudado: Q 278.86"),
             ("4. Abono a capital", "Q 725.76", 1.0, "Adeudado: Q 725.76")]


def p11(m):
    p = Pantalla(m, "P11", "Registrar pago")
    p.barra_estado()
    p.encabezado("Ana Sánchez Chumil", sobre="Registrar pago", alto=64)
    p.espacio(12)
    y0 = p.tarjeta([("big", "Q 1,047.76"), ("chips", ["1 cuota", "2 cuotas", "3 cuotas"], None, 3)], "Monto recibido", "monto recibido")
    p.nota(y0 + 50, "Formato 'Q 1,047.76' con separador de miles desde la primera tecla (en Figma aparece 'Q 10000': H-06). Atajos que sí llenan el monto (H-12).")
    y1 = p.tarjeta([("barras", PRELACION)], "Prelación de aplicación", "prelación antes de confirmar")
    p.nota(y1 + 60, "CORREGIR EN FIGMA: gastos Q25.00 por cuota vencida (no Q150.00). Cifras del caso M-5 = Q1,047.76.")
    p.boton("Revisar y confirmar →")
    p.guardar("P11-registrar-pago.svg")


def p12(m):
    p = Pantalla(m, "P12", "Confirmar pago")
    p.barra_estado()
    p.encabezado("Ana Sánchez Chumil", sobre="Confirmar pago", alto=64)
    p.espacio(12)
    p.aviso("Confirme antes de aplicar", "Verifique el monto con el cliente. Esta acción queda registrada y no se puede revertir fácilmente.")
    p.tarjeta([("big", "Q 1,047.76"), ("texto", "Fecha del pago: 23/09/2026 (fijada al confirmar · puerto Reloj)")], "Monto recibido", "monto y fecha")
    p.nota(p.y - 40, "La fecha del pago se fija al confirmar y no cambia al sincronizar: evita cobrar el gasto del día 31 por una demora de la señal (E4).")
    p.tarjeta([("kv", "1. Gastos de gestión", "Q 25.00"), ("kv", "2. Interés moratorio", "Q 18.14"),
               ("kv", "3. Interés corriente", "Q 278.86"), ("kv", "4. Abono a capital", "Q 725.76")], "Distribución (prelación)", "distribución")
    p.rect(12, p.y, p.w - 24, 34, SK_BLOQUE if p.sk else "#f4f4f4", "#cfcfcf", 10)
    p.texto(p.w / 2, p.y + 22, "≋ Simular pago sin señal (demo)", 11, color=MEDIO, anchor="middle")
    p.etiqueta_sk(p.w - 20, p.y + 30, "demo sin señal")
    p.y += 44
    p.boton("✓ Aplicar pago", "exito")
    p.enlace("← Modificar monto")
    p.nota(p.y - 14, "Salida para corregir el monto antes de aplicar (WCAG 3.3.4, Nielsen 3).")
    p.guardar("P12-confirmar-pago.svg")


def p13(m):
    p = Pantalla(m, "P13", "Pago aplicado (comprobante)")
    p.barra_estado(False)
    p.heroe("Pago aplicado", "23 sept 2026", "Q 1,047.76", alto=190)
    p.espacio(12)
    y0 = p.tarjeta([("big", "PAG-251250")], "No. de comprobante", "comprobante")
    p.nota(y0 + 40, "El número de comprobante es la clave de operación (idempotencia): el mismo que se mostró en la cola sin señal.")
    p.tarjeta([("kv", "Ana Sánchez Chumil", "", True), ("texto", "Zaragoza · DPI 3012 45678 0101")], "Cliente", "cliente")
    y1 = p.tarjeta([("kv", "Gastos de gestión", "Q 25.00"), ("kv", "Interés moratorio", "Q 18.14"), ("kv", "Interés corriente", "Q 278.86"),
                    ("kv", "Abono a capital", "Q 725.76"), ("kv", "Saldo de capital restante", "Q 8,569.62", True)],
                   "Distribución del pago", "distribución y saldo")
    p.nota(y1 + 130, "AGREGAR EN FIGMA: saldo restante después del pago (hallazgo H-13).")
    p.dos_botones("WhatsApp", "Imprimir")
    p.boton("Volver al inicio")
    p.guardar("P13-pago-aplicado.svg")


def p14(m):
    p = Pantalla(m, "P14", "Sin señal (pago en cola)")
    p.barra_estado(False)
    p.heroe("Sin señal", "Pago guardado en el dispositivo · se enviará al reconectar", alto=170, icono="✕")
    p.espacio(12)
    y0 = p.y
    p.aviso("Este pago ya está guardado", "Aunque lo intente de nuevo no se cobrará dos veces: se enviará con el mismo folio.", "aviso")
    p.nota(y0 + 30, "CORREGIR TEXTO: el sistema evita el doble cobro, no la asesora (Figma dice 'si lo registra otra vez se duplicará': H-05).")
    y1 = p.tarjeta([("kv", "Ana Sánchez Chumil", "Pendiente", True), ("texto", "Zaragoza"), ("big", "Q 1,047.76"),
                    ("texto", "Folio: PAG-251250 · Registrado: 23 sept 2026")], "Pago en cola", "pago en cola")
    p.nota(y1 + 110, "El folio (clave de idempotencia) NO cambia al sincronizar; en Figma cambia de PAG-251250 a PAG-309097 (H-04).")
    p.tarjeta([("kv", "● Sin señal — esperando conexión", ""), ("texto", "Se reintenta al volver la señal, al abrir la app o con el botón.")],
              "Estado de sincronización", "estado de sincronización")
    p.boton("↻ Sincronizar ahora")
    p.enlace("Volver al inicio")
    p.guardar("P14-sin-senal.svg")


# =====================================================================
#  Guías para construir en Figma (G01–G07)
# =====================================================================

def g01(m):
    p = Pantalla(m, "G01", "Alta de cliente", estado="Guía")
    p.barra_estado()
    p.encabezado("Nuevo cliente", sobre="Registrar cliente", alto=64)
    p.espacio(12)
    p.tarjeta([("campo", "Foto del DPI (cámara)", "Tomar foto · se autocompletan los campos")], "Identificación", "foto del DPI")
    y0 = p.tarjeta([("campo", "Número de DPI", "2587 45612 0101"), ("campo", "Nombre completo", "Carlos Martínez Ixcot"),
                    ("campo", "Teléfono (avisos por SMS)", "5123 4567")], "Datos del cliente", "datos del cliente")
    p.nota(y0 + 90, "Borrador guardado en el teléfono campo por campo: si se pierde la señal no se recaptura el DPI (WCAG 3.3.7).")
    p.tarjeta([("kv", "✓ Guardado en el teléfono · 10:42", "")], etq="estado del borrador")
    p.boton("Continuar a la solicitud →")
    p.nota(p.y - 30, "Conecta con P04: el cliente nuevo aparece seleccionado en 'Seleccionar cliente'.")
    p.guardar("G01-alta-cliente.svg")


def g02(m):
    p = Pantalla(m, "G02", "Confirmación de desembolso", estado="Guía")
    p.barra_estado()
    p.encabezado("Confirmar desembolso", sobre="Crédito aprobado", alto=64)
    p.espacio(12)
    p.aviso("Revise antes de entregar el dinero", "Esta acción mueve dinero de la institución y no se puede deshacer.")
    y0 = p.tarjeta([("kv", "Cliente", "Carlos Martínez Ixcot"), ("kv", "Monto a entregar", "Q 5,000.00", True),
                    ("kv", "Plazo", "12 meses"), ("kv", "Cuota mensual", "Q 502.31"), ("kv", "Última cuota (12)", "Q 502.29"),
                    ("kv", "Política de mora", "Escalonada POL-2026-10"), ("kv", "Fecha de otorgamiento", "10/10/2026")],
                   "Condiciones", "resumen de condiciones")
    p.nota(y0 + 100, "La política de mora se fija por la fecha de otorgamiento (CP-03) y se muestra antes de desembolsar.")
    p.tarjeta([("kv", "☐ El cliente revisó y acepta las condiciones", "")], etq="aceptación")
    p.boton("Desembolsar Q5,000.00", "exito")
    p.enlace("← Volver y corregir")
    p.nota(p.y - 14, "Confirmación explícita y salida clara (WCAG 3.3.4). El botón se bloquea tras el primer toque.")
    p.guardar("G02-confirmacion-desembolso.svg")


def g07(m):
    p = Pantalla(m, "G07", "Tablero gerencial en teléfono", estado="Guía")
    p.barra_estado()
    p.encabezado("Tablero", sobre="Corte 30/09/2026 · cierre congelado", alto=64)
    p.espacio(12)
    y0 = p.tarjeta([("kv", "▲ Cartera en RIESGO", "", True), ("big", "7.00 %"), ("texto", "Más de 30 días + reestructurados · Q56,000")],
                   etq="1 · riesgo", destacar=True)
    p.nota(y0 + 40, "Mismo orden y mismas señales que en escritorio (G04): riesgo → incobrables → mora.")
    p.tarjeta([("kv", "✕ Dado por incobrable", "C-007"), ("texto", "Sale de la base: no es cobro")], etq="2 · incobrables")
    p.tarjeta([("kv", "● Cartera en MORA", "", True), ("big", "21.75 %"), ("texto", "Cualquier atraso ≥ 1 día · Q174,000")],
              etq="3 · mora", borde="#9a9a9a")
    y1 = p.tarjeta([("kv", "Mora 2 · 31–60 d", "3.00 %"), ("kv", "Mora 3 · 61–90 d", "2.25 %"),
                    ("kv", "Vencido · 91–120 d", "1.00 %"), ("kv", "Reestructurado", "0.75 %")], "Riesgo por tramo", "4 · riesgo por tramo")
    p.nota(y1 + 60, "Desglose del núcleo (calcularCarteraPorTramo): 3.00 + 2.25 + 1.00 + 0.75 = 7.00 %. Tocar una fila abre sus créditos.")
    p.guardar("G07-tablero-movil.svg")


def escritorio_base(m, codigo, titulo, activo):
    p = Pantalla(m, codigo, titulo, 1280, 760, estado="Guía")
    p.nav_escritorio(activo)
    return p


def g03(m):
    p = escritorio_base(m, "G03", "Bandeja del comité", "Bandeja del comité")
    p.texto(20, 92, "Solicitudes por decidir (3)", 18, "bold")
    for i, (n, d) in enumerate([("Carlos Martínez Ixcot", "Q5,000.00 · 12 meses · En evaluación"),
                                ("Juan Pablo Pérez Xol", "Q10,000.00 · 12 meses · Solicitado"),
                                ("María García Oxlaj", "Q3,000.00 · 6 meses · Solicitado")]):
        y = 110 + i * 72
        p.rect(20, y, 420, 60, BLANCO, TINTA if i == 0 else "#cfcfcf", 12, 2 if i == 0 else 1)
        p.texto(36, y + 26, n, 14, "bold")
        p.texto(36, y + 46, d, 11.5, color=MEDIO)
    p.nota(140, "Lista a la izquierda y detalle a la derecha: se decide sin perder la cola. Usa EvaluarCredito + DecidirSolicitud (CU-03/04/05).")
    p.rect(460, 110, 800, 620, BLANCO, "#cfcfcf", 12)
    p.texto(480, 142, "Carlos Martínez Ixcot · Q5,000.00 · 12 meses · cuota Q502.31", 16, "bold")
    p.caja(480, 160, 370, 220, "Datos del cliente y del negocio")
    p.caja(870, 160, 370, 220, "Evaluación: criterios y autor")
    p.caja(480, 396, 760, 170, "Plan simulado (P05, cifras del núcleo)")
    p.rect(480, 586, 760, 50, BLANCO, "#cfcfcf", 10)
    p.texto(496, 616, "Motivo de la decisión (obligatorio si se rechaza)", 12, color=MEDIO)
    p.nota(610, "Motivo obligatorio al rechazar; queda en el historial del crédito (INV-15).")
    p.rect(480, 656, 240, 52, SK_FUERTE if p.sk else OSCURO, r=12)
    p.texto(600, 688, "Aprobar", 15, "bold", BLANCO, "middle")
    p.rect(740, 656, 240, 52, BLANCO, "#bdbdbd", 12)
    p.texto(860, 688, "Rechazar", 15, "bold", anchor="middle")
    p.guardar("G03-bandeja-comite.svg")


def g04(m):
    p = escritorio_base(m, "G04", "Tablero gerencial", "Tablero")
    p.texto(20, 88, "Cartera al corte del 30/09/2026 · cierre mensual congelado ✓ · política por fecha de otorgamiento", 12.5, color=MEDIO)
    p.nota(84, "Primero el contexto: fecha de corte y estado del cierre.")
    p.kpi(20, 104, 300, 140, "▲", "Cartera en RIESGO", "7.00 %", "Q56,000 de Q800,000 activos", "Más de 30 días + reestructurados", "grueso")
    p.kpi(336, 104, 250, 140, "✕", "Dado por incobrable", "C-007", "Bajas del período (del cierre)", "Sale de la base: no es cobro", "normal")
    p.kpi(602, 104, 280, 140, "●", "Cartera en MORA", "21.75 %", "Q174,000 de Q800,000 activos", "Cualquier atraso ≥ 1 día", "discontinuo")
    p.nota(174, "Riesgo e incobrables juntos; mora con otro rótulo, símbolo y borde. Nunca el mismo nombre (sección 7.8, severidad 4).")
    p.rect(20, 262, 862, 262, BLANCO, "#cfcfcf", 12)
    p.texto(36, 290, "Cartera en riesgo por tramo · clic para ver los créditos", 14.5, "bold")
    filas = [("Mora 2 · 31–60 días", "1 crédito", "Q24,000.00", "3.00 %", 1.0), ("Mora 3 · 61–90 días", "1 crédito", "Q18,000.00", "2.25 %", 0.75),
             ("Vencido · 91–120 días", "1 crédito", "Q8,000.00", "1.00 %", 0.33), ("Reestructurado al día", "1 crédito", "Q6,000.00", "0.75 %", 0.25)]
    for i, (a, b, c, d, f) in enumerate(filas):
        y = 312 + i * 42
        p.texto(36, y + 22, a, 13, "bold")
        p.texto(230, y + 22, b, 12, color=MEDIO)
        p.texto(330, y + 22, c, 13, mono=True)
        p.rect(460, y + 8, 300, 20, SK_BLOQUE if p.sk else RELLENO, r=4)
        p.rect(460, y + 8, 300 * f, 20, SK_FUERTE if p.sk else ["#6e6e6e", "#555", OSCURO, "#9a9a9a"][i], r=4)
        p.texto(850, y + 22, d, 14, "bold", anchor="end")
    p.texto(36, 500, "Total: 4 créditos · Q56,000.00 · 7.00 %   |   Mora 1 (1–30 días) no es riesgo: se ve en 'Cartera en MORA'", 11.5, color=MEDIO)
    p.nota(400, "Desglose del núcleo (CP-04.3): la interfaz no recalcula.")
    p.caja(20, 540, 420, 190, "Desembolsos del período (cifras del cierre)")
    p.caja(462, 540, 420, 190, "Recuperaciones del período (cifras del cierre)")
    p.caja(904, 104, 356, 626, "Asistente conversacional (Proyecto Final)", dash=True)
    p.nota(420, "Panel plegable reservado para el chat del Proyecto Final (sección 6.3): no tapa las cifras.")
    p.guardar("G04-tablero-gerencial.svg")


def g05(m):
    p = escritorio_base(m, "G05", "Créditos de un tramo", "Tablero")
    p.texto(20, 88, "Tablero › Cartera en riesgo › Mora 2 (31–60 días) · corte 30/09/2026", 12.5, color=MEDIO)
    p.texto(20, 124, "Mora 2 · 31–60 días: 1 crédito · Q24,000.00 · 3.00 % de la cartera activa", 18, "bold")
    heads = ["Crédito", "Cliente", "Asesora", "Días", "Saldo de capital", "Mora acumulada", "Gasto de cobro", "Política"]
    xs = [20, 150, 360, 520, 640, 820, 990, 1140]
    p.rect(20, 146, 1240, 40, SK_FUERTE if p.sk else OSCURO, r=8)
    for x, h in zip(xs, heads):
        p.texto(x + 10, 171, h, 12.5, "bold", BLANCO)
    for i, fila in enumerate([["C-003", "Cliente de C-003", "Miguel Á. Ajú Toc", "45", "Q24,000.00", "por cuota", "Q25.00 × cuota", "POL-2026-10"]]):
        y = 190 + i * 44
        p.rect(20, y, 1240, 40, BLANCO, "#dcdcdc", 6)
        for x, v in zip(xs, fila):
            p.texto(x + 10, y + 25, v, 12.5, mono=x in (640, 820, 990))
    p.nota(210, "Cada fila abre el Detalle del crédito (P08) en modo lectura; las cifras vienen de consultarMora.")
    p.guardar("G05-creditos-tramo.svg")


def g06(m):
    p = escritorio_base(m, "G06", "Cierre diario / mensual", "Cierres")
    p.texto(20, 92, "Cierre mensual · septiembre 2026", 18, "bold")
    p.rect(20, 110, 620, 70, SK_BLOQUE if p.sk else "#f1f1f1", TINTA, 12, 2)
    p.texto(36, 140, "✓ CONGELADO · generado 30/09/2026 23:59 por proceso programado", 13.5, "bold")
    p.texto(36, 164, "Identificador CM-2026-09 · volver a ejecutarlo devuelve este mismo cierre (no duplica)", 11.5, color=MEDIO)
    p.nota(145, "Estado congelado e idempotencia visibles.")
    p.rect(20, 200, 1240, 300, BLANCO, "#cfcfcf", 12)
    for i, (k, v) in enumerate([("Desembolsos", "del cierre"), ("Cobros aplicados", "del cierre"), ("Interés devengado", "del cierre"),
                                ("Interés en suspenso (> 90 días)", "del cierre"), ("Gastos de cobro generados", "Q25.00 por cuota al día 31"),
                                ("Cartera en mora", "21.75 %"), ("Cartera en riesgo", "7.00 %"), ("Incobrables del período", "C-007")]):
        y = 232 + i * 32
        p.texto(40, y, k, 13)
        p.texto(720, y, v, 13, "bold", anchor="end")
    p.nota(330, "Interés en suspenso separado del ingreso (CP-04.2).")
    p.rect(20, 520, 300, 52, BLANCO, "#bdbdbd", 12)
    p.texto(170, 552, "Ejecutar cierre del día", 14.5, "bold", anchor="middle")
    p.texto(340, 552, "Deshabilitado si el día ya está cerrado · pide confirmación", 11.5, color=MEDIO)
    p.nota(546, "Acción financiera con confirmación (WCAG 3.3.4); en el teléfono solo se consulta.")
    p.guardar("G06-cierre.svg")


PANTALLAS = [p01, p02, p03, p04, p05, p06, p07, p08, p09, p10, p11, p12, p13, p14, g01, g02, g03, g04, g05, g06, g07]

if __name__ == "__main__":
    for modo in ("anotado", "skeleton"):
        for f in PANTALLAS:
            f(modo)
    print(len(PANTALLAS), "pantallas ×2 niveles")
