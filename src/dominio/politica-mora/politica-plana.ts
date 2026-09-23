import { TasaNominalAnualMoratoria, type DiasAtraso } from "../calculadora-mora.js";
import type { Dinero } from "../dinero.js";
import { POLITICA_PLANA } from "./configuracion-politica.js";
import { importeTramo, resultadoPolitica, type PoliticaMora, type CalculoPolitica } from "./politica-mora.js";

export class PoliticaPlana implements PoliticaMora {
  public readonly id: string;
  private readonly tasa: string;
  public constructor(tasa: string = POLITICA_PLANA.tasa) {
    this.tasa = TasaNominalAnualMoratoria.desdeCadena(tasa).aCadena();
    this.id = tasa === POLITICA_PLANA.tasa ? POLITICA_PLANA.id : "PLANA-PRUEBA";
    Object.freeze(this);
  }
  public calcular(capital: Dinero, dias: DiasAtraso): CalculoPolitica {
    return resultadoPolitica(capital, [{ nombre: "PLANA", dias: dias.valor, tasa: this.tasa,
      importeSinRedondear: importeTramo(capital, this.tasa, dias.valor, POLITICA_PLANA.base) }]);
  }
}
