import type { DiasAtraso } from "./calculadora-mora.js";
import { POLITICA_ESCALONADA } from "./politica-mora/configuracion-politica.js";

export enum TramoMora {
  SIN_MORA = "SIN_MORA", MORA_1 = "MORA_1", MORA_2 = "MORA_2",
  MORA_3 = "MORA_3", VENCIDO = "VENCIDO", INCOBRABLE = "INCOBRABLE",
}

export function clasificarTramoMora(dias: DiasAtraso): TramoMora {
  if (dias.valor === 0) return TramoMora.SIN_MORA;
  const tramo = POLITICA_ESCALONADA.tramos.find((t) => dias.valor <= t.hasta);
  return tramo === undefined ? TramoMora.INCOBRABLE : TramoMora[tramo.nombre];
}
