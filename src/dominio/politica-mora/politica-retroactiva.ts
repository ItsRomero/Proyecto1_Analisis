import type { DiasAtraso } from "../calculadora-mora.js";
import type { Dinero } from "../dinero.js";
import { POLITICA_ESCALONADA as configuracion } from "./configuracion-politica.js";
import { importeTramo, resultadoPolitica, type PoliticaMora, type CalculoPolitica } from "./politica-mora.js";

/** Doble de prueba: NO adoptado por el negocio ni incluido en el catálogo. */
export class PoliticaRetroactiva implements PoliticaMora {
  public readonly id = "NO-PRODUCTIVA-RETROACTIVA";
  public constructor() { Object.freeze(this); }
  public calcular(capital: Dinero, dias: DiasAtraso): CalculoPolitica {
    // Extensión total del doble: congela su propio acumulado a 120, nunca lo elimina.
    const efectivos = Math.min(dias.valor, configuracion.limiteDevengo);
    const tramo = configuracion.tramos.find((t) => efectivos <= t.hasta);
    if (tramo === undefined) throw new Error("Configuración sin tramo aplicable.");
    return resultadoPolitica(capital, [{ nombre: tramo.nombre, dias: efectivos, tasa: tramo.tasa,
      importeSinRedondear: importeTramo(capital, tramo.tasa, efectivos, configuracion.base) }]);
  }
}
