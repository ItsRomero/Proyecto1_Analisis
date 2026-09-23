import { CalculadoraMora, type FechaCivil, type ObligacionVencida } from "../dominio/calculadora-mora.js";
import { EstadoCredito } from "../dominio/credito-estado.js";
import { resolverPolitica } from "../dominio/politica-mora/catalogo-politicas.js";

type SituacionCredito = { readonly estado: Exclude<EstadoCredito, EstadoCredito.INCOBRABLE> }
  | { readonly estado: EstadoCredito.INCOBRABLE; readonly fechaDeclaracionIncobrable: FechaCivil };

/** Orquestación sin reloj implícito; una baja congela también contratos de política plana. */
export function consultarMora(datos: SituacionCredito & {
  readonly creditoId: string;
  readonly fechaOtorgamiento: FechaCivil;
  readonly fechaCorte: FechaCivil;
  readonly cuotas: readonly ObligacionVencida[];
}) {
  if (!datos.creditoId.trim()) throw new Error("Crédito obligatorio.");
  if (datos.fechaCorte.diasDesde(datos.fechaOtorgamiento) < 0) throw new Error("Corte anterior al otorgamiento.");
  let corteDevengo = datos.fechaCorte;
  if (datos.estado === EstadoCredito.INCOBRABLE) {
    if (datos.fechaDeclaracionIncobrable.diasDesde(datos.fechaOtorgamiento) < 0 ||
        datos.fechaDeclaracionIncobrable.diasDesde(datos.fechaCorte) > 0) throw new Error("Declaración incobrable fuera del período.");
    corteDevengo = datos.fechaDeclaracionIncobrable;
  }
  const politica = resolverPolitica(datos.fechaOtorgamiento);
  const motor = new CalculadoraMora(politica);
  return Object.freeze({ creditoId: datos.creditoId, fechaCorte: datos.fechaCorte, corteDevengo,
    politicaId: politica.id, cuotas: motor.calcularVariasCuotas(datos.cuotas, corteDevengo) });
}
