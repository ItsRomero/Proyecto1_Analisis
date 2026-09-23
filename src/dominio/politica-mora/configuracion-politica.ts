// Fuente normativa: enunciado P2. No se atribuye aprobación a personas inexistentes.
export const POLITICA_PLANA = Object.freeze({
  id: "POL-2024-01", vigencia: null, autor: "Enunciado institucional del proyecto",
  motivo: "Conservar contratos anteriores a la vigencia de P2", tasa: "0.24", base: "360",
});

export const POLITICA_ESCALONADA = Object.freeze({
  id: "POL-2026-10", vigencia: "2026-10-01", autor: "Enunciado institucional del proyecto",
  motivo: "Devengar por tramos recorridos sin anatocismo", base: "360",
  limiteDevengo: 120,
  tramos: Object.freeze([
    Object.freeze({ nombre: "MORA_1" as const, desde: 1, hasta: 30, tasa: "0.18" }),
    Object.freeze({ nombre: "MORA_2" as const, desde: 31, hasta: 60, tasa: "0.24" }),
    Object.freeze({ nombre: "MORA_3" as const, desde: 61, hasta: 90, tasa: "0.30" }),
    Object.freeze({ nombre: "VENCIDO" as const, desde: 91, hasta: 120, tasa: "0.36" }),
  ]),
  tasaSinDevengo: "0",
});

export const REGLAS_COBRO = Object.freeze({
  diasHastaReconocimientoCorriente: 90, diaGastoGestion: 31, importeGasto: "25.00", moneda: "GTQ",
});
