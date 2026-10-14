import { addMonths, formatISO, parseISO } from "date-fns";
import { FechaCivil } from "../dominio/calculadora-mora.js";
import { FabricaPlanAmortizacion, type PlanAmortizacion, type PlazoMeses, type TasaNominalAnual } from "../dominio/plan-amortizacion.js";
import type { Dinero } from "../dominio/dinero.js";

/** D-5: cada fecha se calcula desde el desembolso original, sin arrastrar febrero. */
export function fecharPlan(plan: PlanAmortizacion, fechaDesembolso: FechaCivil) {
  const origen = parseISO(fechaDesembolso.valor);
  return Object.freeze({ plan, fechaDesembolso,
    cuotas: Object.freeze(plan.cuotas.map((cuota) => Object.freeze({ cuota,
      fechaVencimiento: FechaCivil.desdeCadena(formatISO(addMonths(origen, cuota.numero), { representation: "date" })),
    }))),
  });
}

export function simularPlanConVencimientos(datos: {
  readonly capital: Dinero; readonly tasaNominalAnual: TasaNominalAnual;
  readonly plazo: PlazoMeses; readonly fechaDesembolso: FechaCivil;
}) {
  return fecharPlan(new FabricaPlanAmortizacion().crearFrances(datos), datos.fechaDesembolso);
}
