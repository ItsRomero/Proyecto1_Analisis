import { describe, expect, expectTypeOf, it } from "vitest";

import { Dinero } from "../src/dominio/dinero.js";
import {
  CapitalInvalido,
  FabricaPlanAmortizacion,
  PlazoInvalido,
  PlazoMeses,
  TasaInvalida,
  TasaMensual,
  TasaNominalAnual,
} from "../src/dominio/plan-amortizacion.js";

interface FilaEsperada {
  readonly numero: number;
  readonly saldoAnterior: string;
  readonly interes: string;
  readonly amortizacion: string;
  readonly importe: string;
  readonly saldoPosterior: string;
}

const CASO_REFERENCIA: readonly FilaEsperada[] = [
  {
    numero: 1,
    saldoAnterior: "10000.00",
    interes: "300.00",
    amortizacion: "704.62",
    importe: "1004.62",
    saldoPosterior: "9295.38",
  },
  {
    numero: 2,
    saldoAnterior: "9295.38",
    interes: "278.86",
    amortizacion: "725.76",
    importe: "1004.62",
    saldoPosterior: "8569.62",
  },
  {
    numero: 3,
    saldoAnterior: "8569.62",
    interes: "257.09",
    amortizacion: "747.53",
    importe: "1004.62",
    saldoPosterior: "7822.09",
  },
  {
    numero: 4,
    saldoAnterior: "7822.09",
    interes: "234.66",
    amortizacion: "769.96",
    importe: "1004.62",
    saldoPosterior: "7052.13",
  },
  {
    numero: 5,
    saldoAnterior: "7052.13",
    interes: "211.56",
    amortizacion: "793.06",
    importe: "1004.62",
    saldoPosterior: "6259.07",
  },
  {
    numero: 6,
    saldoAnterior: "6259.07",
    interes: "187.77",
    amortizacion: "816.85",
    importe: "1004.62",
    saldoPosterior: "5442.22",
  },
  {
    numero: 7,
    saldoAnterior: "5442.22",
    interes: "163.27",
    amortizacion: "841.35",
    importe: "1004.62",
    saldoPosterior: "4600.87",
  },
  {
    numero: 8,
    saldoAnterior: "4600.87",
    interes: "138.03",
    amortizacion: "866.59",
    importe: "1004.62",
    saldoPosterior: "3734.28",
  },
  {
    numero: 9,
    saldoAnterior: "3734.28",
    interes: "112.03",
    amortizacion: "892.59",
    importe: "1004.62",
    saldoPosterior: "2841.69",
  },
  {
    numero: 10,
    saldoAnterior: "2841.69",
    interes: "85.25",
    amortizacion: "919.37",
    importe: "1004.62",
    saldoPosterior: "1922.32",
  },
  {
    numero: 11,
    saldoAnterior: "1922.32",
    interes: "57.67",
    amortizacion: "946.95",
    importe: "1004.62",
    saldoPosterior: "975.37",
  },
  {
    numero: 12,
    saldoAnterior: "975.37",
    interes: "29.26",
    amortizacion: "975.37",
    importe: "1004.63",
    saldoPosterior: "0.00",
  },
];

function crearPlanReferencia() {
  return new FabricaPlanAmortizacion().crearFrances({
    capital: Dinero.desdeCadena("10000.00", "GTQ"),
    tasaNominalAnual: TasaNominalAnual.desdeCadena("0.36"),
    plazo: PlazoMeses.desdeNumero(12),
  });
}

describe("FabricaPlanAmortizacion", () => {
  it("reproduce las 12 filas completas del caso obligatorio", () => {
    const plan = crearPlanReferencia();

    const filas = plan.cuotas.map((cuota) => ({
      numero: cuota.numero,
      saldoAnterior: cuota.saldoAnterior.aCadena(),
      interes: cuota.interes.aCadena(),
      amortizacion: cuota.amortizacion.aCadena(),
      importe: cuota.importe.aCadena(),
      saldoPosterior: cuota.saldoPosterior.aCadena(),
    }));

    expect(filas).toEqual(CASO_REFERENCIA);
  });

  it("produce once cuotas normales de Q1,004.62 y una final de Q1,004.63", () => {
    const plan = crearPlanReferencia();

    expect(plan.cuotas.slice(0, 11).every((cuota) => cuota.importe.aCadena() === "1004.62"))
      .toBe(true);
    expect(plan.cuotas[11]?.importe.aCadena()).toBe("1004.63");
  });

  it("reproduce los totales obligatorios exactamente", () => {
    const plan = crearPlanReferencia();

    expect(plan.totalPagos.aCadena()).toBe("12055.45");
    expect(plan.totalIntereses.aCadena()).toBe("2055.45");
    expect(plan.totalAmortizacion.aCadena()).toBe("10000.00");
    expect(plan.saldoFinal().aCadena()).toBe("0.00");
  });

  it("convierte TNA 36% a una tasa mensual exacta de 3%", () => {
    const plan = crearPlanReferencia();

    expect(plan.tasaNominalAnual.aCadena()).toBe("0.36");
    expect(plan.tasaMensual.aCadena()).toBe("0.03");
  });

  it("ajusta la última amortización al saldo anterior", () => {
    const plan = crearPlanReferencia();
    const ultima = plan.cuotas.at(-1);

    expect(ultima).toBeDefined();
    expect(ultima?.amortizacion.esIgualA(ultima.saldoAnterior)).toBe(true);
    expect(ultima?.importe.esIgualA(ultima.amortizacion.sumar(ultima.interes)))
      .toBe(true);
  });

  it("genera un plan de tasa cero sin división inválida", () => {
    const plan = new FabricaPlanAmortizacion().crearFrances({
      capital: Dinero.desdeCadena("1000.00", "GTQ"),
      tasaNominalAnual: TasaNominalAnual.desdeCadena("0"),
      plazo: PlazoMeses.desdeNumero(3),
    });

    expect(
      plan.cuotas.map((cuota) => ({
        interes: cuota.interes.aCadena(),
        amortizacion: cuota.amortizacion.aCadena(),
        importe: cuota.importe.aCadena(),
        saldo: cuota.saldoPosterior.aCadena(),
      })),
    ).toEqual([
      {
        interes: "0.00",
        amortizacion: "333.33",
        importe: "333.33",
        saldo: "666.67",
      },
      {
        interes: "0.00",
        amortizacion: "333.33",
        importe: "333.33",
        saldo: "333.34",
      },
      {
        interes: "0.00",
        amortizacion: "333.34",
        importe: "333.34",
        saldo: "0.00",
      },
    ]);
    expect(plan.totalIntereses.aCadena()).toBe("0.00");
    expect(plan.totalPagos.aCadena()).toBe("1000.00");
  });

  it("no modifica el capital original", () => {
    const capital = Dinero.desdeCadena("10000.00", "GTQ");

    new FabricaPlanAmortizacion().crearFrances({
      capital,
      tasaNominalAnual: TasaNominalAnual.desdeCadena("0.36"),
      plazo: PlazoMeses.desdeNumero(12),
    });

    expect(capital.aCadena()).toBe("10000.00");
  });

  it("produce un plan, una colección y cuotas inmutables", () => {
    const plan = crearPlanReferencia();

    expect(Object.isFrozen(plan)).toBe(true);
    expect(Object.isFrozen(plan.cuotas)).toBe(true);
    expect(plan.cuotas.every((cuota) => Object.isFrozen(cuota))).toBe(true);
  });

  it.each(["0.00", "-1.00"])(
    "rechaza capital no positivo %s",
    (capital) => {
      expect(() =>
        new FabricaPlanAmortizacion().crearFrances({
          capital: Dinero.desdeCadena(capital, "GTQ"),
          tasaNominalAnual: TasaNominalAnual.desdeCadena("0.36"),
          plazo: PlazoMeses.desdeNumero(12),
        }),
      ).toThrow(CapitalInvalido);
    },
  );
});

describe("TasaNominalAnual", () => {
  it.each(["", "-0.01", ".36", "1.", "01", "NaN", "Infinity", "36%"])(
    "rechaza la tasa inválida %j",
    (valor) => {
      expect(() => TasaNominalAnual.desdeCadena(valor)).toThrow(TasaInvalida);
    },
  );

  it("no acepta number en su fábrica pública", () => {
    expectTypeOf(TasaNominalAnual.desdeCadena)
      .parameter(0)
      .toEqualTypeOf<string>();
  });

  it("mantiene también la tasa mensual fuera de number", () => {
    expect(TasaMensual.desdeCadena("0.03").aCadena()).toBe("0.03");
    expectTypeOf(TasaMensual.desdeCadena)
      .parameter(0)
      .toEqualTypeOf<string>();
  });
});

describe("PlazoMeses", () => {
  it.each([3, 12, 24])("acepta el plazo válido %i", (valor) => {
    expect(PlazoMeses.desdeNumero(valor).valor).toBe(valor);
  });

  it.each([2, 25, 3.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rechaza el plazo inválido %s",
    (valor) => {
      expect(() => PlazoMeses.desdeNumero(valor)).toThrow(PlazoInvalido);
    },
  );
});
