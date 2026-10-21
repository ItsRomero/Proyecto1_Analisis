import type { SalidaFinal } from "../contratos/proyecto-final.js";
import { codigosProblemaFinal } from "../contratos/proyecto-final.js";

export type CodigoProblemaFinal = keyof typeof codigosProblemaFinal;
export class ErrorCasoUsoFinal extends Error {
  public constructor(public readonly codigo: CodigoProblemaFinal,
    public readonly montoCorrecto?: SalidaFinal<"calcularDeudaCuota">["totalExigible"]) {
    super(codigo);
    if (codigo === "MONTO_NO_EXACTO" && montoCorrecto === undefined) throw new Error("Monto correcto requerido.");
    this.name = "ErrorCasoUsoFinal";
  }
}
