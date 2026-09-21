import type { FechaCivil } from "../calculadora-mora.js";
import { POLITICA_ESCALONADA } from "./configuracion-politica.js";
import type { PoliticaMora } from "./politica-mora.js";
import { PoliticaPlana } from "./politica-plana.js";
import { PoliticaEscalonada } from "./politica-escalonada.js";

export function resolverPolitica(fechaOtorgamiento: FechaCivil): PoliticaMora {
  return fechaOtorgamiento.valor < POLITICA_ESCALONADA.vigencia
    ? new PoliticaPlana() : new PoliticaEscalonada();
}
