import type { consultarMora } from "../aplicacion/consultar-mora.js";
import type { calcularCarteraPorTramo } from "../dominio/cartera-por-tramo.js";
import { consultaMoraSchema, carteraRiesgoSchema } from "./esquemas.js";

/** Traduce objetos de dominio a contratos JSON sin implementar transporte HTTP. */
export function presentarMora(resultado: ReturnType<typeof consultarMora>) {
  return consultaMoraSchema.parse({
    creditoId: resultado.creditoId, fechaCorte: resultado.fechaCorte.valor,
    corteDevengo: resultado.corteDevengo.valor, politicaId: resultado.politicaId,
    cuotas: resultado.cuotas.map((c) => ({ referencia: c.referencia,
      fechaVencimiento: c.fechaVencimiento.valor, diasAtraso: c.diasAtraso.valor, tramo: c.tramo,
      capitalVencido: c.capitalVencido.aJSON(), interesMoratorio: c.interesMoratorio.aJSON(),
      politicaId: c.politicaId, detalle: { ...c.detalle, moneda: c.detalle.moneda.codigo } })),
  });
}

export function presentarCartera(resultado: ReturnType<typeof calcularCarteraPorTramo>) {
  const resumen = (r: typeof resultado.totalEnRiesgo) => ({ ...r, saldoCapital: r.saldoCapital.aJSON() });
  const base = { tipo: resultado.agregado.tipo, fechaCorte: resultado.fechaCorte.valor,
    carteraActiva: resultado.carteraActiva.aJSON(), capitalEnRiesgo: resultado.totalEnRiesgo.saldoCapital.aJSON(),
    desglose: { inicioPeriodo: resultado.inicioPeriodo.valor, cantidadActiva: resultado.cantidadActiva,
      tramosEnRiesgo: resultado.tramosEnRiesgo.map((t) => ({ ...resumen(t), tramo: t.tramo })),
      carteraEnMora: resumen(resultado.carteraEnMora), totalEnRiesgo: resumen(resultado.totalEnRiesgo),
      incobrablesDelPeriodo: { ...resultado.incobrablesDelPeriodo,
        saldoCapital: resultado.incobrablesDelPeriodo.saldoCapital.aJSON(),
        creditos: resultado.incobrablesDelPeriodo.creditos.map((c) => ({ ...c, fecha: c.fecha.valor, saldoCapital: c.saldoCapital.aJSON() })) },
    },
  };
  return carteraRiesgoSchema.parse(resultado.agregado.tipo === "CON_RAZON"
    ? { ...base, razon: resultado.agregado.razon.aRazonCadena(), porcentaje: resultado.agregado.razon.aPorcentajeCadena() }
    : base);
}
