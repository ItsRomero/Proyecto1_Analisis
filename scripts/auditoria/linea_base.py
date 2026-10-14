"""Auditoría independiente, de solo lectura; no es un cargador de producción.

CV_DATA_DIR=./datos/datos-proyecto-final python scripts/auditoria/linea_base.py
Opciones: --zip RUTA --corte AAAA-MM-DD --output RUTA
No importa ni sustituye al núcleo TypeScript. Importes en centavos Decimal.
"""
import argparse
import calendar
import hashlib
import json
import os
from collections import Counter
from datetime import date, timedelta
from decimal import Decimal as D, ROUND_HALF_UP, getcontext
from pathlib import Path

getcontext().prec = 40


def redondear(valor):
    return int(valor.quantize(D('1'), rounding=ROUND_HALF_UP))


def vencimiento(fecha, numero):
    origen = date.fromisoformat(fecha)
    mes = origen.year * 12 + origen.month - 1 + numero
    anio, mes = divmod(mes, 12)
    mes += 1
    return date(anio, mes, min(origen.day, calendar.monthrange(anio, mes)[1]))


def plan(evento):
    saldo = evento['capital_centavos']
    tasa = D(evento['tna_bps']) / 10000 / 12
    n = evento['plazo_meses']
    factor = (1 + tasa) ** n
    cuota = redondear(D(saldo) * tasa * factor / (factor - 1)) if tasa else redondear(D(saldo) / n)
    cuotas = []
    for i in range(1, n + 1):
        interes = redondear(D(saldo) * tasa)
        capital = saldo if i == n else cuota - interes
        cuotas.append({'numero': i, 'capital': capital, 'interes': interes,
                       'vence': vencimiento(evento['fecha'], i)})
        saldo -= capital
    return cuotas


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--zip', type=Path)
    parser.add_argument('--corte', default='2026-10-31')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    carpeta = Path(os.environ.get('CV_DATA_DIR', './datos/datos-proyecto-final'))
    corte = date.fromisoformat(args.corte)
    eventos_path = carpeta / 'eventos.jsonl'
    if not eventos_path.is_file():
        parser.error(f'Falta {eventos_path}; no se generará un paquete sustituto.')
    eventos = [json.loads(linea) for linea in eventos_path.read_text(encoding='utf-8-sig').splitlines() if linea.strip()]
    politicas = json.loads((carpeta / 'politicas.json').read_text(encoding='utf-8-sig'))
    vigente = politicas['politicas_mora']['POL-2026-10']['vigencia_otorgamiento']['desde']
    creditos, claves, diferencias, duplicados, fechas = {}, {}, [], [], []
    pagos_futuros = 0
    for e in eventos:
        fechas.append(e.get('fecha', e.get('fecha_alta')))
        if e.get('fecha', e.get('fecha_alta')) > args.corte:
            pagos_futuros += 1
            continue
        if e['tipo'] == 'DESEMBOLSO':
            creditos[e['id_credito']] = {'evento': e, 'cuotas': plan(e), 'pagadas': 0}
        elif e['tipo'] == 'PAGO':
            clave = e['clave_idempotencia']
            contenido = {k: v for k, v in e.items() if k != 'seq'}
            if clave in claves:
                duplicados.append({'clave': clave, 'seq': e['seq'], 'identico': claves[clave] == contenido})
                continue
            claves[clave] = contenido
            c = creditos[e['id_credito']]
            q = c['cuotas'][c['pagadas']]
            dias = max(0, (date.fromisoformat(e['fecha']) - q['vence']).days)
            pol = 'POL-2026-10' if c['evento']['fecha'] >= vigente else 'POL-2024-01'
            regla = politicas['politicas_mora'][pol]
            if regla['tipo'] == 'plana':
                mora = redondear(D(q['capital']) * regla['tna_bps'] * dias / 10000 / 360)
            else:
                mora = redondear(sum((D(q['capital']) * t['bps'] * max(0, min(dias, t['fin']) - t['ini'] + 1) / 10000 / 360 for t in regla['tramos']), D(0)))
            gasto = politicas['gasto_gestion_cobro']
            gestion = gasto['monto_centavos'] if pol in gasto['aplica_a_politicas'] and dias >= gasto['dia_generacion'] else 0
            esperado = q['capital'] + q['interes'] + mora + gestion
            if esperado != e['monto_centavos']:
                diferencias.append({'seq': e['seq'], 'credito': e['id_credito'], 'esperado_centavos': esperado, 'recibido_centavos': e['monto_centavos']})
            c['pagadas'] += 1
    situaciones = {}
    for clave, c in creditos.items():
        pendientes = c['cuotas'][c['pagadas']:]
        dias = max(0, (corte - pendientes[0]['vence']).days) if pendientes else 0
        situaciones[clave] = {'pagadas': c['pagadas'], 'vencidas': sum(q['vence'] < corte for q in pendientes),
                             'dias_atraso': dias, 'politica': 'POL-2026-10' if c['evento']['fecha'] >= vigente else 'POL-2024-01',
                             'reestructurado': c['evento']['reestructurado'],
                             'saldo_capital_centavos': sum(q['capital'] for q in pendientes),
                             'fecha_incobrable_derivada': (pendientes[0]['vence'] + timedelta(days=121)).isoformat() if dias > politicas['regla_incobrable_dias'] else None}
    screens = json.loads((root / 'vistas/docs/screens.json').read_text(encoding='utf-8-sig'))
    navigation = json.loads((root / 'vistas/docs/navigation.json').read_text(encoding='utf-8-sig'))
    nodos_rutas = {n['node'] for n in navigation}
    conexiones = Counter((s['id'], link['id'], d.get('destinationId'))
                         for s in screens for link in s.get('links', []) for d in link.get('destinations', []))
    destinos_sin_ruta = [{'pantalla': s['id'], 'nodo': link['id'], 'destino': d.get('destinationId')}
                         for s in screens for link in s.get('links', []) for d in link.get('destinations', [])
                         if link['id'] not in nodos_rutas]
    sha = hashlib.sha256(eventos_path.read_bytes()).hexdigest()
    faltantes = [p for p in ['vistas/index.html', 'vistas/docs/README.md', 'vistas/css/shared.css', 'vistas/css/design.css', 'vistas/assets', 'datos/datos-proyecto-final.zip', *['datos/datos-proyecto-final/' + x for x in ['eventos.jsonl', 'eventos.sha256', 'politicas.json', 'LEEME.md', 'corpus']]] if not (root / p).exists()]
    resultado = {'corte': args.corte, 'cv_data_dir': str(carpeta), 'faltantes_contractuales': faltantes,
                 'sha256_eventos': sha, 'huella_interna_valida': sha == (carpeta / 'eventos.sha256').read_text().split()[0],
                 'sha256_zip': hashlib.sha256(args.zip.read_bytes()).hexdigest() if args.zip else None,
                 'conteos': dict(Counter(e['tipo'] for e in eventos)),
                 'seq_continua': [e['seq'] for e in eventos] == list(range(1, len(eventos) + 1)),
                 'rango_eventos': [min(fechas), max(fechas)], 'eventos_posteriores_al_corte': pagos_futuros,
                 'pagos_unicos_reproducidos': len(claves), 'duplicados': duplicados, 'diferencias_monto': diferencias,
                 'planes_sha256': {k: hashlib.sha256(json.dumps([[q['numero'], q['capital'], q['interes']] for q in c['cuotas']], separators=(',', ':')).encode()).hexdigest() for k, c in creditos.items()},
                 'vencimientos': {k: [q['vence'].isoformat() for q in c['cuotas']] for k, c in creditos.items()},
                 'incobrables_derivados': {k: v for k, v in situaciones.items() if v['fecha_incobrable_derivada']},
                 'reestructurados': {k: v for k, v in situaciones.items() if v['reestructurado']},
                 'creditos_politica_nueva': sum(v['politica'] == 'POL-2026-10' for v in situaciones.values()),
                 'situaciones_guion': {k: situaciones[k] for k in ['CV-2026-0043', 'CV-2026-0035', 'CV-2026-0061', 'CV-2026-0015', 'CV-2026-0030', 'CV-2026-0410']},
                 'g7_dias_cuota2': (date(2027, 1, 24) - vencimiento(creditos['CV-2026-0410']['evento']['fecha'], 2)).days,
                 'vistas': {'frames': len(screens), 'conexiones_inventario': sum(len(link.get('destinations', [])) for s in screens for link in s.get('links', [])),
                            'conexiones_unicas': len(conexiones),
                            'conexiones_duplicadas': [{'pantalla': k[0], 'nodo': k[1], 'destino': k[2], 'repeticiones': v} for k, v in conexiones.items() if v > 1],
                            'rutas_navigation': len(navigation), 'destinos_sin_ruta': destinos_sin_ruta,
                            'destinos_faltantes': [n['to'] for n in navigation if not (root / 'vistas' / n['to']).is_file()],
                            'html_sin_indice': len(list((root / 'vistas').glob('*.html'))) - 1},
                 'advertencia': 'Reproducción independiente. No ejecuta el dominio TypeScript ni prueba integración. No se persisten clientes ni datos personales.'}
    salida = json.dumps(resultado, ensure_ascii=False, indent=2)
    if args.output:
        args.output.write_text(salida + '\n', encoding='utf-8')
    print(salida)
    return 1 if diferencias or not resultado['huella_interna_valida'] else 0


if __name__ == '__main__':
    raise SystemExit(main())
