import type { DiasAtraso } from "../calculadora-mora.js";
import type { Dinero } from "../dinero.js";
import { POLITICA_ESCALONADA as configuracion } from "./configuracion-politica.js";
import { importeTramo, resultadoPolitica, type PoliticaMora, type CalculoPolitica } from "./politica-mora.js";

export class PoliticaEscalonada implements PoliticaMora {
  public readonly id = configuracion.id;
  public constructor() { Object.freeze(this); }
  public calcular(capital: Dinero, dias: DiasAtraso): CalculoPolitica {
    const tramos = configuracion.tramos.map((tramo) => {
      const recorridos = Math.max(0, Math.min(dias.valor, tramo.hasta) - tramo.desde + 1);
      return { nombre: tramo.nombre, dias: recorridos, tasa: tramo.tasa,
        importeSinRedondear: importeTramo(capital, tramo.tasa, recorridos, configuracion.base) };
    }).filter((tramo) => tramo.dias > 0);
    return resultadoPolitica(capital, tramos);
  }
}
