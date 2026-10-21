import { Decimal } from "decimal.js";
import { CalculadoraMora, DiasAtraso } from "../dominio/calculadora-mora.js";
import { Dinero } from "../dominio/dinero.js";
import { generarGastoGestion } from "../dominio/gasto-gestion-cobro.js";
import { importeTramo, resultadoPolitica, type PoliticaMora } from "../dominio/politica-mora/politica-mora.js";
import type { z } from "zod";
import { politicasPaqueteSchema } from "../contratos/proyecto-final.js";
import { POLITICA_PLANA, POLITICA_ESCALONADA, REGLAS_COBRO } from "../dominio/politica-mora/configuracion-politica.js";

type Configuracion = z.infer<typeof politicasPaqueteSchema>;
export const tasaDesdeBps = (bps: number): string => new Decimal(bps.toString()).div("10000").toFixed();

/** D-4: Strategy inyectada. Reutiliza el cálculo y tope del núcleo P2 sin copiar fórmulas. */
export class CatalogoPoliticasCanonicas {
  public readonly configuracion: Configuracion;
  public readonly divergencias: readonly string[];
  public constructor(configuracion: Configuracion) {
    this.configuracion = politicasPaqueteSchema.parse(configuracion);
    const plana = this.configuracion.politicas_mora["POL-2024-01"];
    const escalonada = this.configuracion.politicas_mora["POL-2026-10"];
    if (this.configuracion.regla_incobrable_dias !== POLITICA_ESCALONADA.limiteDevengo || this.configuracion.regla_riesgo_dias !== 30)
      throw new Error("Umbral de incobrable/riesgo no soportado por State/cartera P2; se requiere extensión con ADR.");
    if (plana.vigencia_otorgamiento.hasta >= escalonada.vigencia_otorgamiento.desde)
      throw new Error("Vigencias de políticas solapadas.");
    let siguiente = 1;
    for (const tramo of escalonada.tramos) {
      if (tramo.ini !== siguiente || tramo.fin < tramo.ini) throw new Error("Tramos de política no continuos.");
      siguiente = tramo.fin + 1;
    }
    if (siguiente !== this.configuracion.regla_incobrable_dias + 1)
      throw new Error("Los tramos deben llegar al umbral de congelación.");
    this.divergencias = Object.freeze([
      ...(tasaDesdeBps(plana.tna_bps) !== new Decimal(POLITICA_PLANA.tasa).toFixed() ? ["Tasa plana del JSON difiere del default P2; prevalece JSON."] : []),
      ...(escalonada.vigencia_otorgamiento.desde !== POLITICA_ESCALONADA.vigencia ? ["Vigencia escalonada del JSON difiere del default P2; prevalece JSON."] : []),
      ...(JSON.stringify(escalonada.tramos.map((t) => [t.ini, t.fin, tasaDesdeBps(t.bps)])) !==
        JSON.stringify(POLITICA_ESCALONADA.tramos.map((t) => [t.desde, t.hasta, new Decimal(t.tasa).toFixed()]))
        ? ["Tramos del JSON difieren del default P2; prevalece JSON."] : []),
      ...(this.configuracion.gasto_gestion_cobro.dia_generacion !== REGLAS_COBRO.diaGastoGestion ||
        BigInt(this.configuracion.gasto_gestion_cobro.monto_centavos) !== Dinero.desdeCadena(REGLAS_COBRO.importeGasto, "GTQ").aUnidadesMenores()
        ? ["Gasto del JSON difiere del default P2; prevalece JSON."] : []),
    ]);
  }
  public resolver(fechaOtorgamiento: string): PoliticaMora {
    const p = this.configuracion.politicas_mora;
    if (fechaOtorgamiento <= p["POL-2024-01"].vigencia_otorgamiento.hasta) {
      const tasa = tasaDesdeBps(p["POL-2024-01"].tna_bps);
      return { id: "POL-2024-01", calcular: (capital, dias) => resultadoPolitica(capital, [
        { nombre: "PLANA", dias: dias.valor, tasa, importeSinRedondear: importeTramo(capital, tasa, dias.valor, "360") },
      ]) };
    }
    if (fechaOtorgamiento < p["POL-2026-10"].vigencia_otorgamiento.desde) throw new Error("Fecha sin política vigente.");
    return { id: "POL-2026-10", calcular: (capital, dias) => resultadoPolitica(capital,
      p["POL-2026-10"].tramos.map((t) => {
        const recorridos = Math.max(0, Math.min(dias.valor, t.fin) - t.ini + 1);
        const tasa = tasaDesdeBps(t.bps);
        return { nombre: t.id.toUpperCase(), dias: recorridos, tasa,
          importeSinRedondear: importeTramo(capital, tasa, recorridos, "360") };
      }).filter((t) => t.dias > 0)) };
  }
  public deuda(capital: Dinero, interesCorriente: Dinero, dias: DiasAtraso, politica: PoliticaMora,
    contexto: Omit<Parameters<typeof generarGastoGestion>[0], "configuracion">) {
    if (dias.valor !== DiasAtraso.entre(contexto.fechaVencimiento, contexto.fechaCorte).valor)
      throw new Error("Los días de mora no coinciden con vencimiento y fecha de corte explícitos.");
    const gasto = this.configuracion.gasto_gestion_cobro;
    const generacion = gasto.aplica_a_politicas.some((id) => id === politica.id)
      ? generarGastoGestion({ ...contexto, configuracion: { diaGeneracion: gasto.dia_generacion,
        importe: Dinero.desdeUnidadesMenores(BigInt(gasto.monto_centavos), "GTQ") } }) : null;
    const gastosComisiones = generacion?.nuevo?.importe ?? Dinero.cero("GTQ");
    const interesMoratorio = new CalculadoraMora(politica).calcular(capital, dias).interesMoratorio;
    return { capital, interesCorriente, gastosComisiones, interesMoratorio,
      total: capital.sumar(interesCorriente).sumar(gastosComisiones).sumar(interesMoratorio) };
  }
}
