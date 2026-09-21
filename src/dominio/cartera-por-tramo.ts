import { Decimal } from "decimal.js";
import { CalculadoraCarteraRiesgo, type CreditoParaCartera } from "./cartera.js";
import { EstadoCredito } from "./credito-estado.js";
import { Dinero } from "./dinero.js";
import { DiasAtraso, FechaCivil, clasificarTramoMora, TramoMora } from "./calculadora-mora.js";

const NOMBRES = ["MORA_1", "MORA_2", "MORA_3", "VENCIDO", "REESTRUCTURADO"] as const;
export type NombreTramoCartera = typeof NOMBRES[number];

export interface ResumenTramoCartera {
  readonly tramo: NombreTramoCartera;
  readonly cantidadCreditos: number;
  readonly saldoCapital: Dinero;
  /** null cuando no existe denominador; nunca se inventa un 0/0. */
  readonly porcentaje: string | null;
}

export interface BajaIncobrable {
  readonly creditoId: string;
  readonly fecha: FechaCivil;
  readonly saldoCapital: Dinero;
}

const ACTIVOS = new Set([EstadoCredito.DESEMBOLSADO, EstadoCredito.VIGENTE, EstadoCredito.EN_MORA, EstadoCredito.REESTRUCTURADO]);

function porcentaje(saldo: Dinero, activa: Dinero): string | null {
  if (activa.esCero()) return null;
  const unidades = (2n * saldo.aUnidadesMenores() * 10000n + activa.aUnidadesMenores()) / (2n * activa.aUnidadesMenores());
  return new Decimal(unidades.toString()).div("100").toFixed(2);
}

/** Reparte centésimas por restos mayores para que la presentación sume el total redondeado. */
function porcentajesConciliados(saldos: readonly Dinero[], activa: Dinero): readonly (string | null)[] {
  if (activa.esCero()) return saldos.map(() => null);
  const denominador = activa.aUnidadesMenores();
  const filas = saldos.map((saldo, indice) => {
    const numerador = saldo.aUnidadesMenores() * 10000n;
    return { indice, unidades: numerador / denominador, resto: numerador % denominador };
  });
  const suma = saldos.reduce((n, s) => n + s.aUnidadesMenores(), 0n);
  const objetivo = (2n * suma * 10000n + denominador) / (2n * denominador);
  let pendientes = objetivo - filas.reduce((n, f) => n + f.unidades, 0n);
  const ordenadas = [...filas].sort((a, b) => a.resto === b.resto ? a.indice - b.indice : a.resto > b.resto ? -1 : 1);
  for (const fila of ordenadas) {
    if (pendientes <= 0n) break;
    fila.unidades += 1n;
    pendientes -= 1n;
  }
  return filas.map((f) => new Decimal(f.unidades.toString()).div("100").toFixed(2));
}

export function calcularCarteraPorTramo(datos: {
  readonly creditos: readonly CreditoParaCartera[];
  readonly moneda: string;
  readonly fechaCorte: FechaCivil;
  readonly inicioPeriodo: FechaCivil;
  readonly bajas?: readonly BajaIncobrable[];
}) {
  if (datos.inicioPeriodo.diasDesde(datos.fechaCorte) > 0) throw new Error("Período invertido.");
  const agregado = CalculadoraCarteraRiesgo.calcular(datos.creditos, datos.moneda);
  const activa = agregado.carteraActiva;
  const filas = NOMBRES.map((tramo) => ({ tramo, cantidadCreditos: 0, saldoCapital: Dinero.cero(datos.moneda) }));
  let mora = Dinero.cero(datos.moneda);
  let cantidadEnMora = 0;
  let cantidadActiva = 0;
  for (const credito of datos.creditos) {
    if (!ACTIVOS.has(credito.estado)) continue;
    cantidadActiva++;
    if (credito.diasAtraso > 0) { mora = mora.sumar(credito.saldoCapital); cantidadEnMora++; }
    // Mora 1 tiene contribución cero al riesgo; su saldo sí integra carteraEnMora.
    if (credito.diasAtraso <= 30 && credito.estado !== EstadoCredito.REESTRUCTURADO) continue;
    const derivado = clasificarTramoMora(DiasAtraso.desdeNumero(credito.diasAtraso));
    const nombre = credito.estado === EstadoCredito.REESTRUCTURADO ? "REESTRUCTURADO"
      : derivado === TramoMora.INCOBRABLE ? "VENCIDO" : derivado;
    const fila = filas.find((f) => f.tramo === nombre);
    if (fila === undefined) throw new Error("Crédito en riesgo sin tramo.");
    fila.cantidadCreditos++;
    fila.saldoCapital = fila.saldoCapital.sumar(credito.saldoCapital);
  }
  const porcentajes = porcentajesConciliados(filas.map((f) => f.saldoCapital), activa);
  const tramosEnRiesgo: readonly ResumenTramoCartera[] = Object.freeze(filas.map((fila, i) => Object.freeze({ ...fila, porcentaje: porcentajes[i] ?? null })));
  const idsBajas = new Set<string>();
  const bajas = (datos.bajas ?? []).filter((baja) => {
    if (!baja.creditoId.trim() || idsBajas.has(baja.creditoId) || baja.saldoCapital.esNegativo()) throw new Error("Baja inválida o duplicada.");
    idsBajas.add(baja.creditoId);
    baja.saldoCapital.sumar(Dinero.cero(datos.moneda));
    const credito = datos.creditos.find((c) => c.id === baja.creditoId);
    if (credito !== undefined && credito.estado !== EstadoCredito.INCOBRABLE) throw new Error("Baja incompatible con estado del crédito.");
    return baja.fecha.diasDesde(datos.inicioPeriodo) >= 0 && baja.fecha.diasDesde(datos.fechaCorte) <= 0;
  });
  return Object.freeze({ fechaCorte: datos.fechaCorte, inicioPeriodo: datos.inicioPeriodo, agregado, tramosEnRiesgo,
    carteraActiva: activa, cantidadActiva,
    carteraEnMora: Object.freeze({ cantidadCreditos: cantidadEnMora, saldoCapital: mora, porcentaje: porcentaje(mora, activa) }),
    totalEnRiesgo: Object.freeze({ cantidadCreditos: filas.reduce((n, f) => n + f.cantidadCreditos, 0), saldoCapital: agregado.capitalEnRiesgo, porcentaje: porcentaje(agregado.capitalEnRiesgo, activa) }),
    incobrablesDelPeriodo: Object.freeze({ cantidadCreditos: bajas.length,
      saldoCapital: bajas.reduce((s, b) => s.sumar(b.saldoCapital), Dinero.cero(datos.moneda)),
      creditos: Object.freeze(bajas.map((b) => Object.freeze({ ...b }))) }),
  });
}
