"""Generador de wireframes de baja fidelidad (SVG en escala de grises)."""
import os, html
OUT = os.path.dirname(os.path.abspath(__file__))
os.makedirs(OUT, exist_ok=True)

INK, MID, LIGHT, FILL, WHITE = "#222", "#777", "#bbb", "#e6e6e6", "#fff"
FONT = "font-family='Helvetica, Arial, sans-serif'"

def esc(t): return html.escape(str(t))

class Canvas:
    def __init__(self, w, h, title, code, device):
        self.w, self.h, self.e = w, h, []
        self.title, self.code, self.device = title, code, device
    def rect(self, x, y, w, h, fill=WHITE, stroke=INK, sw=1.5, rx=4, dash=None):
        d = f" stroke-dasharray='{dash}'" if dash else ""
        self.e.append(f"<rect x='{x}' y='{y}' width='{w}' height='{h}' rx='{rx}' fill='{fill}' stroke='{stroke}' stroke-width='{sw}'{d}/>")
    def text(self, x, y, t, size=13, weight="normal", color=INK, anchor="start", italic=False):
        st = " font-style='italic'" if italic else ""
        self.e.append(f"<text x='{x}' y='{y}' {FONT} font-size='{size}' font-weight='{weight}' fill='{color}' text-anchor='{anchor}'{st}>{esc(t)}</text>")
    def line(self, x1, y1, x2, y2, color=LIGHT, sw=1, dash=None):
        d = f" stroke-dasharray='{dash}'" if dash else ""
        self.e.append(f"<line x1='{x1}' y1='{y1}' x2='{x2}' y2='{y2}' stroke='{color}' stroke-width='{sw}'{d}/>")
    def xbox(self, x, y, w, h, label=""):
        self.rect(x, y, w, h, fill=FILL, stroke=MID, sw=1)
        self.line(x, y, x + w, y + h, MID); self.line(x + w, y, x, y + h, MID)
        if label: self.text(x + w / 2, y + h / 2 + 4, label, 11, color=INK, anchor="middle")
    def note(self, x, y, t, n):
        x = self.w + 16
        self.e.append(f"<line x1='{self.w - 6}' y1='{y}' x2='{x - 10}' y2='{y}' stroke='{INK}' stroke-width='1' stroke-dasharray='2 2'/>")
        self.e.append(f"<circle cx='{x}' cy='{y}' r='10' fill='{INK}'/>")
        self.text(x, y + 4, n, 11, "bold", WHITE, "middle")
        self.notes.append((n, t))
    def save(self, name):
        import textwrap
        maxc = int((self.w + 20) / 6.4)
        wrapped = [(n, textwrap.wrap(t, maxc - 4)) for n, t in getattr(self, "notes", [])]
        foot = 26 + 16 * sum(len(ls) for _, ls in wrapped)
        H = self.h + 76 + foot
        s = [f"<svg xmlns='http://www.w3.org/2000/svg' width='{self.w + 60}' height='{H}' viewBox='0 0 {self.w + 60} {H}'>",
             f"<rect width='100%' height='100%' fill='#f7f7f7'/>",
             f"<text x='20' y='28' {FONT} font-size='15' font-weight='bold' fill='{INK}'>{esc(self.code)} · {esc(self.title)}</text>",
             f"<text x='20' y='46' {FONT} font-size='12' fill='{MID}'>{esc(self.device)} · wireframe baja fidelidad</text>",
             f"<g transform='translate(20,60)'>"]
        s.append(f"<rect x='0' y='0' width='{self.w}' height='{self.h}' rx='14' fill='{WHITE}' stroke='{INK}' stroke-width='2'/>")
        s += self.e + ["</g>"]
        y = self.h + 60 + 24
        for n, ls in wrapped:
            for i, t in enumerate(ls):
                pre = f"<tspan font-weight='bold'>{esc(n)}.</tspan> " if i == 0 else ""
                s.append(f"<text x='{20 if i == 0 else 34}' y='{y}' {FONT} font-size='12' fill='{INK}'>{pre}{esc(t)}</text>")
                y += 16
        s.append("</svg>")
        open(os.path.join(OUT, name), "w", encoding="utf-8").write("\n".join(s))

# ---------- Mobile helpers ----------
MW, MH = 360, 720

class Mobile(Canvas):
    def __init__(self, title, code, header, back=True, sync="online"):
        super().__init__(MW, MH, title, code, "Móvil 360×720")
        self.notes, self.y = [], 0
        self.rect(0, 0, MW, 24, fill=FILL, stroke=FILL, rx=0)
        self.text(12, 16, "9:41", 11)
        estado = {"online": "● En línea", "offline": "○ Sin señal · 2 pendientes", "sync": "↻ Enviando…"}[sync]
        self.text(MW - 12, 16, estado, 11, "bold" if sync != "online" else "normal", anchor="end")
        self.rect(0, 24, MW, 52, fill=WHITE, stroke=INK, rx=0)
        if back: self.text(16, 56, "←", 20, "bold")
        self.text(48 if back else 16, 57, header, 17, "bold")
        self.text(MW - 16, 57, "?", 18, "bold", anchor="end")  # ayuda consistente (WCAG 3.2.6)
        self.y = 92
    def head(self, t, size=14):
        self.text(16, self.y + 14, t, size, "bold"); self.y += 24
    def p(self, t, size=12, color=MID, italic=False):
        self.text(16, self.y + 12, t, size, color=color, italic=italic); self.y += 18
    def field(self, label, value, hint=None, big=False):
        self.text(16, self.y + 12, label, 12, color=MID); self.y += 18
        h = 52 if big else 44
        self.rect(16, self.y, MW - 32, h, stroke=INK, sw=2 if big else 1.5)
        self.text(28, self.y + h / 2 + 6, value, 20 if big else 15, "bold" if big else "normal")
        self.y += h + 4
        if hint: self.text(16, self.y + 11, hint, 11, color=MID); self.y += 16
        self.y += 6
    def segmented(self, label, opts, sel):
        self.text(16, self.y + 12, label, 12, color=MID); self.y += 18
        w = (MW - 32) / len(opts)
        for i, o in enumerate(opts):
            self.rect(16 + i * w, self.y, w, 44, fill=INK if o == sel else WHITE, rx=0)
            self.text(16 + i * w + w / 2, self.y + 27, o, 13, "bold", WHITE if o == sel else INK, "middle")
        self.y += 54
    def kv(self, k, v, bold=False, size=13):
        self.text(16, self.y + 14, k, size, color=INK)
        self.text(MW - 16, self.y + 14, v, size, "bold" if bold else "normal", anchor="end")
        self.line(16, self.y + 22, MW - 16, self.y + 22); self.y += 28
    def card(self, h, fill=WHITE, dash=None):
        self.rect(16, self.y, MW - 32, h, fill=fill, dash=dash); y0 = self.y; return y0
    def button(self, t, primary=True, y=None):
        yy = y if y is not None else self.y
        self.rect(16, yy, MW - 32, 52, fill=INK if primary else WHITE, rx=8)
        self.text(MW / 2, yy + 32, t, 15, "bold", WHITE if primary else INK, "middle")
        if y is None: self.y += 62
    def bottom(self, t, secondary=None):
        if secondary:
            self.button(secondary, False, MH - 128)
        self.button(t, True, MH - 68)
    def tabbar(self, items, sel):
        self.rect(0, MH - 56, MW, 56, fill=WHITE, stroke=INK, rx=0)
        w = MW / len(items)
        for i, it in enumerate(items):
            self.text(i * w + w / 2, MH - 24, it, 12, "bold" if it == sel else "normal", anchor="middle")

TABS = ["Ruta", "Buscar", "Nuevo", "Pendientes"]

# W01 Ruta del día
m = Mobile("Ruta del día (inicio de la asesora)", "W01", "Hoy · 10 visitas", back=False, sync="offline")
m.rect(16, m.y, MW - 32, 44, fill=FILL, dash="4 3"); m.text(28, m.y + 27, "○ Sin señal. 2 pagos guardados en el teléfono.", 12, "bold"); m.y += 54
m.note(MW - 26, m.y - 32, "Banner de estado de envío siempre visible (Nielsen 1). Toca → lista Pendientes.", 1)
for n, (cli, estado, d) in enumerate([("Carlos Chávez", "Cuota 2 · 45 días de atraso", "Cobro"),
                                      ("Tienda La Esperanza", "Solicitud nueva", "Originación"),
                                      ("María Tzul", "Al día · sin pagos pendientes", "Seguimiento"),
                                      ("Comedor Doña Rosa", "Cuota 5 · 12 días de atraso", "Cobro")]):
    m.rect(16, m.y, MW - 32, 76)
    m.text(28, m.y + 24, cli, 15, "bold"); m.text(28, m.y + 44, estado, 12, color=MID)
    m.rect(28, m.y + 52, 96, 18, fill=FILL, stroke=FILL); m.text(76, m.y + 65, d, 11, anchor="middle")
    m.text(MW - 28, m.y + 44, "›", 22, "bold", anchor="end"); m.y += 86
m.note(40, 200, "Tarjeta completa es el objetivo táctil (≥48 px). Sin tecleo para llegar al cliente.", 2)
m.tabbar(TABS, "Ruta"); m.save("W01-ruta-del-dia.svg")

# W02 Buscar cliente
m = Mobile("Buscar cliente o crédito", "W02", "Buscar")
m.field("Nombre, DPI o número de crédito", "Chávez|")
m.note(MW - 26, 124, "Búsqueda por reconocimiento: nombre parcial basta (Nielsen 6). Funciona sin señal sobre la cartera de la ruta.", 1)
for cli, cred in [("Carlos Chávez", "CV-2026-0410 · Tienda · en mora"), ("Carla Chávez López", "CV-2026-0133 · al día")]:
    m.rect(16, m.y, MW - 32, 64); m.text(28, m.y + 26, cli, 15, "bold"); m.text(28, m.y + 46, cred, 12, color=MID); m.y += 72
m.p("¿No aparece? Registrar cliente nuevo →", 13, INK)
m.tabbar(TABS, "Buscar"); m.save("W02-buscar-cliente.svg")

# W03 Alta de cliente
m = Mobile("Alta de cliente (RegistrarCliente)", "W03", "Nuevo cliente", sync="offline")
m.p("Paso 1 de 3 · Identificación", 12, INK)
m.xbox(16, m.y, MW - 32, 110, "Foto del DPI (cámara)"); m.y += 118
m.note(MW - 30, m.y - 60, "Leer DPI desde foto reduce tecleo; campos se autocompletan y se pueden corregir.", 1)
m.field("Número de DPI", "2587 45612 0101")
m.field("Nombre completo", "Carlos Chávez")
m.field("Teléfono (para avisos por SMS)", "5123 4567")
m.rect(16, m.y, MW - 32, 36, fill=FILL, dash="4 3"); m.text(28, m.y + 23, "✓ Guardado en el teléfono · 10:42", 12, "bold"); m.y += 44
m.note(MW - 30, m.y - 22, "Borrador local por campo: si se pierde la señal no se recaptura nada (WCAG 3.3.7).", 2)
m.bottom("Continuar")
m.save("W03-alta-cliente.svg")

# W04 Solicitud de crédito
m = Mobile("Solicitud de crédito (SolicitarCredito)", "W04", "Solicitud · Carlos Chávez")
m.field("¿Cuánto necesita?", "Q 10,000.00", "Entre Q1,000 y Q25,000 · diez mil quetzales", big=True)
m.note(MW - 30, 130, "Prefijo Q, separador de miles en vivo, rango visible y monto en letras (MC-1, Nielsen 5).", 1)
m.segmented("¿En cuántos meses?", ["3", "6", "12", "18", "24"], "12")
m.note(MW - 30, m.y - 30, "Plazo con botones, no teclado: evita plazos fuera de 3–24.", 2)
m.p("Otro plazo (3 a 24) ›", 12, INK)
m.field("Destino del crédito", "Inventario de tienda  ▾")
m.card(84, fill=FILL); y0 = m.y
m.text(28, y0 + 24, "Cuota estimada", 12, color=MID); m.text(MW - 28, y0 + 24, "Q 1,004.62 al mes", 15, "bold", anchor="end")
m.text(28, y0 + 48, "Tasa", 12, color=MID); m.text(MW - 28, y0 + 48, "3 % al mes (36 % al año)", 12, anchor="end")
m.text(28, y0 + 70, "Total a pagar", 12, color=MID); m.text(MW - 28, y0 + 70, "Q 12,055.45", 12, anchor="end"); m.y += 94
m.bottom("Ver plan de pagos")
m.save("W04-solicitud-credito.svg")

# W05 Plan de amortización
m = Mobile("Simulación / Plan de amortización", "W05", "Plan de pagos")
m.p("Q10,000.00 · 12 meses · 3 % al mes", 12, INK)
cols = [(16, "#"), (44, "Pago"), (140, "Interés"), (220, "Capital"), (MW - 16, "Queda")]
for x, t in cols: m.text(x, m.y + 12, t, 11, "bold", anchor="end" if x == MW - 16 else "start")
m.y += 20
rows = [(1, "1,004.62", "300.00", "704.62", "9,295.38"), (2, "1,004.62", "278.86", "725.76", "8,569.62"),
        (3, "1,004.62", "257.09", "747.53", "7,822.09"), (4, "1,004.62", "234.66", "769.96", "7,052.13"),
        (5, "1,004.62", "211.56", "793.06", "6,259.07"), (6, "1,004.62", "187.77", "816.85", "5,442.22"),
        (7, "1,004.62", "163.27", "841.35", "4,600.87"), (8, "1,004.62", "138.03", "866.59", "3,734.28"),
        (9, "1,004.62", "112.03", "892.59", "2,841.69"), (10, "1,004.62", "85.25", "919.37", "1,922.32"),
        (11, "1,004.62", "57.67", "946.95", "975.37"), (12, "1,004.63", "29.26", "975.37", "0.00")]
for r in rows:
    if r[0] == 12: m.rect(10, m.y - 2, MW - 20, 24, fill=FILL, stroke=INK)
    for (x, _), v in zip(cols, r):
        m.text(x, m.y + 14, v, 12, "bold" if r[0] == 12 else "normal", anchor="end" if x == MW - 16 else "start")
    m.y += 26
m.note(MW - 26, m.y - 38, "Cuota 12 resaltada: Q1,004.63.", 1)
m.rect(16, m.y + 4, MW - 32, 56, fill=WHITE, dash="4 3")
m.text(28, m.y + 26, "¿Por qué la última cuota es 1 centavo más?", 12, "bold")
m.text(28, m.y + 46, "Para que el saldo cierre exacto en Q0.00.", 12, color=MID); m.y += 70
m.p("Cifras calculadas por el núcleo (plan-amortizacion.ts).", 11, MID, True)
m.bottom("Confirmar solicitud", "Cambiar monto o plazo")
m.save("W05-plan-amortizacion.svg")

# W06 Confirmación de desembolso
m = Mobile("Confirmación de desembolso (DesembolsarCredito)", "W06", "Revisar y desembolsar")
m.p("Revise antes de entregar el dinero:", 13, INK)
for k, v in [("Cliente", "Carlos Chávez"), ("DPI", "2587 45612 0101"), ("Monto a entregar", "Q 10,000.00"),
             ("Plazo", "12 meses"), ("Cuota mensual", "Q 1,004.62"), ("Última cuota (12)", "Q 1,004.63"),
             ("Política de mora", "Escalonada POL-2026-10"), ("Fecha de otorgamiento", "10/10/2026")]:
    m.kv(k, v, k == "Monto a entregar")
m.note(MW - 26, 240, "Resumen completo antes de mover dinero (WCAG 3.3.4). Política queda fija por fecha de otorgamiento.", 1)
m.rect(16, m.y + 4, 24, 24); m.text(52, m.y + 22, "El cliente revisó y acepta las condiciones", 12); m.y += 40
m.note(MW - 26, m.y - 16, "Casilla obligatoria; el botón se habilita al marcarla y se bloquea tras el primer toque.", 2)
m.bottom("Desembolsar Q10,000.00", "Volver y corregir")
m.save("W06-confirmacion-desembolso.svg")

# W07 Detalle del crédito
m = Mobile("Detalle del crédito (ConsultarCredito)", "W07", "Crédito de Carlos Chávez")
m.p("Saldo al 24/01/2027 · calculado hoy", 11, MID, True)
m.note(MW - 26, 100, "Toda cifra dice su fecha de corte; sin señal: 'calculado con datos del 22/09'.", 1)
m.card(96, fill=FILL); y0 = m.y
m.text(28, y0 + 26, "Debe hoy (cuota 2 atrasada)", 12, color=MID)
m.text(28, y0 + 60, "Q 1,047.76", 28, "bold")
m.text(28, y0 + 84, "Lleva 45 días de atraso", 13, "bold"); m.y += 106
m.note(MW - 26, y0 + 60, "Primero lo que debe, en grande. Tramo en lenguaje llano, no 'Mora 2'.", 2)
m.kv("Próxima cuota (3)", "Q 1,004.62", size=12)
m.kv("Le quedan por pagar", "Q 9,295.38 de capital", size=12)
m.kv("Estado", "Atrasado", size=12)
m.rect(16, m.y + 4, MW - 32, 56, dash="4 3")
m.text(28, m.y + 26, "Aviso: en 15 días pasa a más de 60 días.", 12, "bold")
m.text(28, m.y + 46, "La mora diaria sube de Q0.48 a Q0.60.", 12, color=MID); m.y += 70
m.note(MW - 26, m.y - 44, "Aviso anticipado del siguiente tramo (MC-4).", 3)
m.button("¿Por qué debo Q1,047.76?", False)
m.bottom("Registrar pago")
m.save("W07-detalle-credito.svg")

# W08 Detalle de la mora (M-3)
m = Mobile("Detalle de la mora (caso M-3, 100 días)", "W08", "¿Por qué pago Q50.80 de mora?")
m.p("Cuota 2 · capital atrasado Q725.76 · 100 días", 12, INK)
m.p("La mora se cobra solo sobre el capital atrasado,", 12)
m.p("y cada día paga la tasa del tramo en que estaba.", 12)
m.y += 6
bars = [("Días 1–30", "18 % al año", "30 días", "Q 10.89*", 30), ("Días 31–60", "24 % al año", "30 días", "Q 14.52*", 30),
        ("Días 61–90", "30 % al año", "30 días", "Q 18.14*", 30), ("Días 91–100", "36 % al año", "10 días", "Q 7.26*", 10)]
for i, (r, t, d, v, n) in enumerate(bars):
    m.rect(16, m.y, MW - 32, 62)
    m.text(28, m.y + 22, f"{r} · {t}", 13, "bold"); m.text(MW - 28, m.y + 22, v, 14, "bold", anchor="end")
    m.rect(28, m.y + 34, (MW - 120) * n / 30, 14, fill=[LIGHT, "#999", "#666", INK][i], stroke=INK, rx=2)
    m.text(MW - 28, m.y + 46, d, 11, color=MID, anchor="end"); m.y += 68
m.note(MW - 26, 214, "Un tramo por fila: rango en días, tasa anual y días recorridos. Ancho de barra = días.", 1)
m.card(76, fill=FILL); y0 = m.y
m.text(28, y0 + 24, "Mora total de esta cuota", 13, "bold"); m.text(MW - 28, y0 + 24, "Q 50.80", 18, "bold", anchor="end")
m.text(28, y0 + 48, "* Mostrado a 2 decimales. Suma exacta Q50.8032,", 11, color=MID)
m.text(28, y0 + 64, "redondeada una sola vez al final.", 11, color=MID); m.y += 86
m.note(MW - 26, y0 + 24, "Nota de redondeo: las filas suman Q50.81 si se redondean por separado; el total oficial es Q50.80 (sección 7.3).", 2)
m.p("Si se cobrara la tasa del último tramo en los 100 días", 11, MID, True)
m.p("serían Q72.58. Esta política no se aplica.", 11, MID, True)
m.bottom("Entendido")
m.save("W08-detalle-mora.svg")

# W09 Registro de pago
m = Mobile("Registro de pago en campo (RegistrarPago)", "W09", "Registrar pago", sync="offline")
m.p("Carlos Chávez · CV-2026-0410 · debe Q1,047.76", 12, INK)
m.field("Monto recibido", "Q 1,047.76", big=True)
m.note(MW - 26, 146, "Monto sugerido = total adeudado; atajos para pagar exacto o la cuota (Nielsen 7).", 1)
m.rect(16, m.y, 100, 40, fill=INK); m.text(66, m.y + 25, "Todo", 12, "bold", WHITE, "middle")
m.rect(126, m.y, 100, 40); m.text(176, m.y + 25, "Cuota", 12, "bold", anchor="middle")
m.rect(236, m.y, 108, 40); m.text(290, m.y + 25, "Otro", 12, "bold", anchor="middle"); m.y += 52
m.head("Así se aplicará su pago", 13)
for k, v in [("1. Gastos de cobro", "Q 25.00"), ("2. Mora", "Q 18.14"), ("3. Interés", "Q 278.86"), ("4. Capital", "Q 725.76")]:
    m.kv(k, v)
m.kv("Queda debiendo de esta cuota", "Q 0.00", True)
m.note(MW - 26, m.y - 110, "Prelación visible ANTES de confirmar: gastos → mora → interés → capital.", 2)
m.rect(16, m.y + 2, MW - 32, 40, fill=FILL, dash="4 3"); m.text(28, m.y + 27, "○ Sin señal: se guardará y se enviará solo.", 12, "bold"); m.y += 48
m.note(MW - 26, m.y - 26, "Estado offline explícito; la fecha del pago queda fijada ahora (puerto Reloj).", 3)
m.bottom("Revisar y confirmar")
m.save("W09-registro-pago.svg")

# W10 Comprobante
m = Mobile("Comprobante con prelación aplicada", "W10", "Comprobante", back=False, sync="offline")
m.rect(16, m.y, MW - 32, 44, fill=FILL, dash="4 3"); m.text(28, m.y + 27, "⏳ Pendiente de enviar · se confirmará con señal", 12, "bold"); m.y += 54
m.note(MW - 26, 116, "Tres estados distintos: Pendiente / Enviado / Confirmado. Nunca 'Pagado' sin respuesta del sistema.", 1)
for k, v in [("Recibido de", "Carlos Chávez"), ("Fecha del pago", "24/01/2027 10:51"), ("Monto", "Q 1,047.76")]:
    m.kv(k, v, k == "Monto")
m.head("Aplicado a", 13)
for k, v in [("Gastos de cobro", "Q 25.00"), ("Mora", "Q 18.14"), ("Interés", "Q 278.86"), ("Capital", "Q 725.76")]:
    m.kv(k, v)
m.kv("Saldo de capital restante", "Q 8,569.62", True)
m.p("Clave de operación: 7f3c…a91e", 11, MID, True)
m.note(MW - 26, m.y - 8, "Clave de idempotencia visible para soporte; el reintento usa la misma clave.", 2)
m.bottom("Enviar por SMS al cliente", "Ir a la ruta")
m.save("W10-comprobante.svg")

# ---------- Desktop ----------
DW, DH = 1280, 760

class Desktop(Canvas):
    def __init__(self, title, code, active):
        super().__init__(DW, DH, title, code, "Escritorio 1280×760")
        self.notes = []
        self.rect(0, 0, DW, 56, fill=WHITE, rx=0)
        self.text(20, 35, "Crédito Vecino", 17, "bold")
        for i, it in enumerate(["Tablero", "Bandeja del comité", "Cierres", "Créditos"]):
            x = 200 + i * 170
            self.text(x, 35, it, 14, "bold" if it == active else "normal")
            if it == active: self.line(x, 50, x + 120, 50, INK, 3)
        self.text(DW - 20, 35, "Andrea Morales · ?", 13, anchor="end")

def kpi(c, x, y, w, h, label, value, sub, sub2, style="solid", icon=""):
    c.rect(x, y, w, h, fill=WHITE if style != "fill" else FILL, sw=3 if style == "thick" else 1.5, dash="6 4" if style == "dash" else None)
    c.text(x + 16, y + 28, f"{icon} {label}".strip(), 15, "bold")
    c.text(x + 16, y + 80, value, 40, "bold")
    c.text(x + 16, y + 106, sub, 12, color=MID)
    c.text(x + 16, y + 124, sub2, 12, color=INK)

# W11 Tablero gerencial
d = Desktop("Tablero gerencial (ConsultarCarteraEnRiesgo)", "W11", "Tablero")
d.text(20, 86, "Cartera al corte del 30/09/2026 · cierre mensual congelado ✓ · política de cálculo por fecha de otorgamiento", 13, color=MID)
d.note(930, 82, "Fecha de corte y estado del cierre en la primera línea: el contexto antes que la cifra.", 1)
kpi(d, 20, 104, 300, 140, "Cartera en RIESGO", "7.00 %", "Q56,000 de Q800,000 activos", "Más de 30 días + reestructurados", "thick", "▲")
kpi(d, 336, 104, 250, 140, "Dado por incobrable", "C-007", "Bajas del período (del cierre)", "Sale de la base: no es cobro", "solid", "✕")
kpi(d, 602, 104, 280, 140, "Cartera en MORA", "21.75 %", "Q174,000 de Q800,000 activos", "Cualquier atraso ≥ 1 día", "dash", "●")
d.note(170, 104, "Riesgo primero y con borde grueso: es el indicador de decisión del comité.", 2)
d.note(460, 104, "Incobrables junto al riesgo: una baja reduce el % sin cobrar (7.00 → 6.06 %).", 3)
d.note(740, 104, "Mora con borde discontinuo, otro símbolo y definición distinta: nunca el mismo rótulo.", 4)
d.rect(20, 262, 862, 262)
d.text(36, 290, "Cartera en riesgo por tramo · clic para ver los créditos", 15, "bold")
tr = [("Mora 2 · 31–60 días", "1 crédito", "Q24,000.00", "3.00 %", 3.00), ("Mora 3 · 61–90 días", "1 crédito", "Q18,000.00", "2.25 %", 2.25),
      ("Vencido · 91–120 días", "1 crédito", "Q8,000.00", "1.00 %", 1.00), ("Reestructurado al día", "1 crédito", "Q6,000.00", "0.75 %", 0.75)]
y = 312
for i, (a, b, c_, p, v) in enumerate(tr):
    d.text(36, y + 22, a, 13, "bold"); d.text(230, y + 22, b, 12, color=MID); d.text(330, y + 22, c_, 13, anchor="start")
    d.rect(460, y + 8, v / 3.0 * 300, 20, fill=["#999", "#666", INK, LIGHT][i], rx=2)
    d.text(850, y + 22, p, 14, "bold", anchor="end"); d.text(866, y + 22, "›", 16, "bold", anchor="end")
    d.line(36, y + 38, 866, y + 38); y += 42
d.text(36, y + 24, "Total cartera en riesgo: 4 créditos · Q56,000.00", 13, "bold"); d.text(850, y + 24, "7.00 %", 15, "bold", anchor="end")
d.text(36, y + 44, "Mora 1 (1–30 días) no es riesgo: Q124,000 con atraso ≤ 30 días se ven en 'Cartera en mora'.", 12, color=MID)
d.note(880, 300, "Desglose del núcleo (calcularCarteraPorTramo): 3.00+2.25+1.00+0.75 = 7.00 %. La UI no recalcula.", 5)
d.rect(20, 540, 420, 190); d.text(36, 566, "Desembolsos del período", 14, "bold"); d.xbox(36, 580, 388, 134, "Serie mensual · cifras del cierre")
d.rect(462, 540, 420, 190); d.text(478, 566, "Recuperaciones del período", 14, "bold"); d.xbox(478, 580, 388, 134, "Serie mensual · cifras del cierre")
d.note(450, 540, "Actividad del período abajo: se consulta después de entender el riesgo.", 6)
d.rect(904, 104, 356, 626, fill=FILL, dash="6 4")
d.text(1082, 140, "Asistente (Proyecto Final)", 15, "bold", anchor="middle")
d.text(1082, 164, "Panel reservado, plegable", 12, color=MID, anchor="middle")
d.xbox(924, 186, 316, 440, "Conversación con fuentes citadas")
d.rect(924, 646, 316, 44); d.text(940, 673, "Pregunte: ¿por qué subió la mora de…?", 12, color=MID)
d.note(1250, 116, "Chat a la derecha: no tapa las cifras; cita la misma fuente (núcleo) que el tablero (6.3).", 7)
d.save("W11-tablero-gerencial.svg")

# W12 Detalle del tramo
d = Desktop("Detalle de un tramo (drill-down)", "W12", "Tablero")
d.text(20, 86, "Tablero › Cartera en riesgo › Mora 2 (31–60 días) · corte 30/09/2026", 13, color=MID)
d.note(560, 82, "Migas de pan: siempre se sabe en qué indicador se está.", 1)
d.text(20, 124, "Mora 2 · 31–60 días de atraso: 1 crédito · Q24,000.00 · 3.00 % de la cartera activa", 18, "bold")
heads = ["Crédito", "Cliente", "Asesora", "Días de atraso", "Saldo de capital", "Mora acumulada", "Gasto de cobro", "Política"]
xs = [20, 150, 360, 520, 680, 850, 1010, 1140]
d.rect(20, 146, 1240, 40, fill=FILL)
for x, h_ in zip(xs, heads): d.text(x + 10, 171, h_, 13, "bold")
d.rect(20, 186, 1240, 44)
for x, v in zip(xs, ["C-003", "(cliente)", "(asesora)", "45", "Q24,000.00", "según cuotas", "Q25.00 × cuota", "POL-…"]):
    d.text(x + 10, 213, v, 13)
d.note(1240, 208, "Cifras por crédito vienen de consultarMora (cada cuota por separado, con su política).", 2)
d.text(20, 270, "Exportar CSV · Volver al tablero", 13, color=INK)
d.save("W12-detalle-tramo.svg")

# W13 Bandeja del comité
d = Desktop("Bandeja del comité (EvaluarCredito · DecidirSolicitud)", "W13", "Bandeja del comité")
d.text(20, 90, "Solicitudes por decidir (3)", 18, "bold")
for i, (n, mnt, pl, est) in enumerate([("Carlos Chávez", "Q10,000.00", "12 meses", "En evaluación"),
                                          ("Tienda La Esperanza", "Q5,000.00", "6 meses", "Solicitado"),
                                          ("Comedor Doña Rosa", "Q18,000.00", "24 meses", "Solicitado")]):
    y = 110 + i * 70
    d.rect(20, y, 420, 60, fill=FILL if i == 0 else WHITE, sw=3 if i == 0 else 1.5)
    d.text(36, y + 26, n, 14, "bold"); d.text(36, y + 46, f"{mnt} · {pl} · {est}", 12, color=MID)
d.note(430, 120, "Lista a la izquierda, detalle a la derecha: se decide sin perder la cola.", 1)
d.rect(460, 110, 800, 620)
d.text(480, 142, "Carlos Chávez · Q10,000.00 · 12 meses · cuota Q1,004.62", 16, "bold")
d.xbox(480, 160, 370, 220, "Datos del cliente y del negocio")
d.xbox(870, 160, 370, 220, "Evaluación: criterios y autor")
d.xbox(480, 396, 760, 170, "Plan simulado (12 cuotas del núcleo)")
d.rect(480, 586, 760, 50); d.text(496, 616, "Motivo de la decisión (obligatorio si se rechaza)", 13, color=MID)
d.note(1240, 600, "Motivo obligatorio al rechazar; queda en el historial (INV-15).", 2)
d.rect(480, 656, 240, 52, fill=INK, rx=8); d.text(600, 688, "Aprobar", 15, "bold", WHITE, "middle")
d.rect(740, 656, 240, 52, rx=8); d.text(860, 688, "Rechazar", 15, "bold", anchor="middle")
d.save("W13-bandeja-comite.svg")

# W14 Cierre
d = Desktop("Cierre diario / mensual (GenerarCierre)", "W14", "Cierres")
d.text(20, 90, "Cierre mensual · septiembre 2026", 18, "bold")
d.rect(20, 110, 600, 70, fill=FILL, sw=2); d.text(36, 140, "✓ CONGELADO · generado 30/09/2026 23:59 por proceso programado", 14, "bold")
d.text(36, 164, "Identificador de cierre: CM-2026-09 · reejecutar devuelve este mismo cierre", 12, color=MID)
d.note(610, 120, "Estado congelado visible y explicación de idempotencia: reejecutar no duplica.", 1)
d.rect(20, 200, 1240, 300)
for i, (k, v) in enumerate([("Desembolsos", "del cierre"), ("Cobros aplicados", "del cierre"), ("Interés devengado", "del cierre"),
                            ("Interés en suspenso (> 90 días)", "del cierre"), ("Gastos de cobro generados", "Q25.00 por cuota al día 31"),
                            ("Cartera en mora", "21.75 %"), ("Cartera en riesgo", "7.00 %"), ("Incobrables del período", "C-007")]):
    y = 230 + i * 34
    d.text(40, y, k, 14); d.text(700, y, v, 14, "bold", anchor="end"); d.line(40, y + 10, 700, y + 10)
d.note(720, 330, "Suspenso separado del ingreso (CP-04.2): ingreso no sube entre día 90 y 100; suspenso sí.", 2)
d.rect(20, 520, 300, 52, rx=8); d.text(170, 552, "Ejecutar cierre del día", 15, "bold", anchor="middle")
d.text(340, 552, "Deshabilitado si el día ya está cerrado · requiere confirmación", 12, color=MID)
d.note(310, 530, "Acción financiera con confirmación (WCAG 3.3.4); en móvil solo consulta.", 3)
d.save("W14-cierre.svg")

# W15 Tablero en móvil
m = Mobile("Tablero gerencial en teléfono (responsivo)", "W15", "Tablero · corte 30/09")
m.card(110); y0 = m.y
m.text(28, y0 + 26, "▲ Cartera en RIESGO", 14, "bold"); m.text(28, y0 + 66, "7.00 %", 32, "bold")
m.text(28, y0 + 90, "Más de 30 días + reestructurados", 11, color=MID); m.y += 118
m.card(56); m.text(28, m.y + 24, "✕ Incobrable del período", 13, "bold"); m.text(28, m.y + 44, "C-007 · sale de la base", 11, color=MID); m.y += 64
m.rect(16, m.y, MW - 32, 80, dash="6 4"); m.text(28, m.y + 24, "● Cartera en MORA", 13, "bold"); m.text(28, m.y + 54, "21.75 %", 22, "bold")
m.text(MW - 28, m.y + 54, "atraso ≥ 1 día", 11, color=MID, anchor="end"); m.y += 90
m.note(MW - 26, 120, "Mismo orden y mismas formas que en escritorio; las tarjetas se apilan en una columna.", 1)
m.head("Riesgo por tramo", 13)
for a, p in [("Mora 2 · 31–60 d", "3.00 %"), ("Mora 3 · 61–90 d", "2.25 %"), ("Vencido · 91–120 d", "1.00 %"), ("Reestructurado", "0.75 %")]:
    m.kv(a + "  ›", p, size=12)
m.note(MW - 26, m.y - 70, "Barras y montos en Q se sustituyen por lista con %; el detalle se abre al tocar.", 2)
m.p("Sin gráficos de series ni exportación en el teléfono.", 11, MID, True)
m.rect(MW - 76, MH - 76, 56, 56, fill=INK, rx=28); m.text(MW - 48, MH - 42, "Chat", 11, "bold", WHITE, "middle")
m.note(MW - 90, MH - 50, "Asistente como botón flotante; se abre a pantalla completa.", 3)
m.save("W15-tablero-movil.svg")
print("ok", sorted(os.listdir(OUT)))
