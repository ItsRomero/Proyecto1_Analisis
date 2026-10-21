import type { ReactNode } from "react";
import type { SalidaFinal } from "@contratos/proyecto-final";
import { formatearFecha, nombreTramo, tasaComoPorcentaje } from "../formato";
import { useConsulta } from "../hooks/useConsulta";
import { Dinero, FilaDato, InsigniaEstado, InsigniaTramo, OrigenDatos, Tarjeta } from "./Basicos";
import { SegunEstado, Vacio } from "./Estados";

type Resumen = SalidaFinal<"consultarCredito">;
type Aplicacion = SalidaFinal<"proponerPago">["aplicacionPrevista"];

const FONDO_ESTADO: Readonly<Record<string, string>> = {
  SIN_MORA: "bg-tramo-al-dia", MORA_1: "bg-tramo-mora-1", MORA_2: "bg-tramo-mora-2", MORA_3: "bg-tramo-mora-3",
  VENCIDO: "bg-tramo-vencido", INCOBRABLE: "bg-tramo-incobrable",
};

/** Franja de situación del detalle del crédito (frame 11:591), con días de atraso del núcleo. */
export function FranjaSituacion({ resumen }: { readonly resumen: Resumen }) {
  const sinPlan = resumen.estado === "SOLICITADO" || resumen.estado === "APROBADO" || resumen.estado === "RECHAZADO";
  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl p-4 text-white ${sinPlan ? "bg-secundario" : FONDO_ESTADO[resumen.tramo] ?? "bg-secundario"}`}>
      <div>
        <p className="text-lg font-bold">{sinPlan ? "Sin desembolso" : nombreTramo(resumen.tramo)}</p>
        <p className="text-sm opacity-90">Estado: {resumen.estado.replace("_", " ").toLowerCase()}</p>
      </div>
      <div className="rounded-xl bg-white/20 px-3 py-2 text-center">
        <p className="cifra text-2xl font-bold">{resumen.diasAtraso}</p>
        <p className="text-xs">días de atraso</p>
      </div>
    </div>
  );
}

export function ResumenCredito({ resumen, extra }: { readonly resumen: Resumen; readonly extra?: ReactNode }) {
  return (
    <Tarjeta titulo="Resumen del crédito">
      <p className="text-sm text-tenue">Saldo de capital</p>
      <p className="mb-3 text-3xl"><Dinero valor={resumen.saldoCapital} /></p>
      <dl className="divide-y divide-linea border-t border-linea">
        <FilaDato etiqueta="Estado"><InsigniaEstado estado={resumen.estado} /></FilaDato>
        <FilaDato etiqueta="Tramo"><InsigniaTramo tramo={resumen.tramo} /></FilaDato>
        <FilaDato etiqueta="Cuotas pagadas / vencidas"><span className="cifra">{resumen.cuotasPagadas} / {resumen.cuotasVencidas}</span></FilaDato>
        <FilaDato etiqueta="Próxima cuota a pagar">
          {resumen.proximaCuota ? <span>#{resumen.proximaCuota.numeroCuota} · <Dinero valor={resumen.proximaCuota.importe} /> · vence{" "}
            {formatearFecha(resumen.proximaCuota.fechaVencimiento)}</span> : "Sin cuotas pendientes"}
        </FilaDato>
        {extra}
      </dl>
      <div className="mt-3"><OrigenDatos fechaCorte={resumen.fechaCorte} operacion="consultarCredito" /></div>
    </Tarjeta>
  );
}

const PRELACION: readonly { readonly clave: keyof Aplicacion; readonly texto: string; readonly color: string }[] = [
  { clave: "gastosComisiones", texto: "1. Gastos de gestión", color: "border-peligro" },
  { clave: "interesMoratorio", texto: "2. Interés moratorio", color: "border-atraso" },
  { clave: "interesCorriente", texto: "3. Interés corriente", color: "border-acento" },
  { clave: "capital", texto: "4. Abono a capital", color: "border-exito" },
];
/** Prelación P1 (Chain of Responsibility) tal como la calculó el núcleo. */
export function Prelacion({ aplicacion, titulo = "Prelación de aplicación" }: { readonly aplicacion: Aplicacion; readonly titulo?: string }) {
  return (
    <Tarjeta titulo={titulo}>
      <ol className="flex flex-col gap-2">
        {PRELACION.map((p) => (
          <li key={p.clave} className={`flex items-baseline justify-between border-l-4 pl-3 ${p.color}`}>
            <span className="text-sm font-semibold">{p.texto}</span><Dinero valor={aplicacion[p.clave]} />
          </li>
        ))}
        <li className="flex items-baseline justify-between border-l-4 border-linea pl-3 text-tenue">
          <span className="text-sm">Excedente</span><Dinero valor={aplicacion.excedente} />
        </li>
      </ol>
    </Tarjeta>
  );
}

export function DesgloseDeuda({ deuda }: { readonly deuda: SalidaFinal<"calcularDeudaCuota"> }) {
  return (
    <dl className="divide-y divide-linea">
      <FilaDato etiqueta="Gastos de gestión"><Dinero valor={deuda.gastosComisiones} /></FilaDato>
      <FilaDato etiqueta="Interés moratorio"><Dinero valor={deuda.interesMoratorio} /></FilaDato>
      <FilaDato etiqueta="Interés corriente"><Dinero valor={deuda.interesCorriente} /></FilaDato>
      <FilaDato etiqueta="Capital de la cuota"><Dinero valor={deuda.capital} /></FilaDato>
      <FilaDato etiqueta="Total exigible"><Dinero valor={deuda.totalExigible} className="text-base font-bold" /></FilaDato>
    </dl>
  );
}

/** Formación de la mora de una cuota: días, política, tramos recorridos, capital y total (frame 12:1040). */
export function MoraDeCuota({ creditoId, numeroCuota, fechaCorte }: { readonly creditoId: string; readonly numeroCuota: number; readonly fechaCorte: string }) {
  const mora = useConsulta("explicarMora", { creditoId, numeroCuota, fechaCorte });
  const deuda = useConsulta("calcularDeudaCuota", { creditoId, numeroCuota, fechaCorte });
  return (
    <SegunEstado estado={mora.estado} onReintentar={mora.recargar}>{(m) => {
      const c = m.cuotas[0];
      if (c === undefined) return <Vacio titulo="Sin datos de mora para la cuota." />;
      return (
        <Tarjeta titulo={`Cuota ${numeroCuota}`}>
          <p className="text-sm">Venció el <strong>{formatearFecha(c.fechaVencimiento)}</strong> · <strong className="cifra">{c.diasAtraso}</strong> días
            de atraso · <InsigniaTramo tramo={c.tramo} /></p>
          <p className="mt-1 text-sm text-tenue">Política aplicada: <strong className="text-tinta">{m.politicaId}</strong>
            {m.corteDevengo && m.corteDevengo !== m.fechaCorte && <> · devengo congelado al {formatearFecha(m.corteDevengo)} (baja incobrable)</>}</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[300px] text-sm">
              <caption className="solo-lectores">Tramos recorridos por la mora de la cuota {numeroCuota}</caption>
              <thead><tr className="text-left text-xs text-tenue"><th className="py-1 pr-2">Tramo</th><th className="pr-2">Días</th><th className="pr-2">Tasa anual</th><th className="text-right">Importe sin redondear</th></tr></thead>
              <tbody>
                {(c.detalle?.tramos ?? []).map((t) => (
                  <tr key={t.nombre} className="border-t border-linea">
                    <td className="py-1.5 pr-2 font-semibold">{nombreTramo(t.nombre)}</td><td className="cifra pr-2">{t.dias}</td>
                    <td className="cifra pr-2 whitespace-nowrap">{tasaComoPorcentaje(t.tasa)} %</td><td className="cifra text-right break-all">Q {t.importeSinRedondear}</td>
                  </tr>
                ))}
                {(c.detalle?.tramos ?? []).length === 0 && <tr><td colSpan={4} className="py-2 text-tenue">Sin días de atraso: no hay mora.</td></tr>}
              </tbody>
            </table>
          </div>
          <dl className="mt-3 divide-y divide-linea border-t border-linea">
            <FilaDato etiqueta="Capital en mora (capital de la cuota)"><Dinero valor={c.capitalVencido} /></FilaDato>
            <FilaDato etiqueta="Interés moratorio (redondeado por el núcleo)"><Dinero valor={c.interesMoratorio} className="font-bold" /></FilaDato>
          </dl>
          <h3 className="etiqueta-seccion mt-4">Deuda exigible de la cuota</h3>
          <SegunEstado estado={deuda.estado} onReintentar={deuda.recargar}>{(d) => <DesgloseDeuda deuda={d} />}</SegunEstado>
          <div className="mt-2"><OrigenDatos fechaCorte={m.fechaCorte} operacion="explicarMora · calcularDeudaCuota" /></div>
        </Tarjeta>
      );
    }}</SegunEstado>
  );
}

/** Explicación de todas las cuotas vencidas, empezando por la más antigua. */
export function MoraDelCredito({ resumen }: { readonly resumen: Resumen }) {
  const numeros = Array.from({ length: resumen.cuotasVencidas }, (_, i) => resumen.cuotasPagadas + 1 + i);
  if (numeros.length === 0) return <Vacio titulo="Sin cuotas vencidas al corte">El crédito no tiene mora a esta fecha.</Vacio>;
  return <div className="flex flex-col gap-3">{numeros.map((n) => <MoraDeCuota key={n} creditoId={resumen.creditoId} numeroCuota={n} fechaCorte={resumen.fechaCorte} />)}</div>;
}

export function ComprobantePago({ pago, estadoPosterior }: { readonly pago: SalidaFinal<"confirmarPago">["pago"]; readonly estadoPosterior?: Resumen | undefined }) {
  return (
    <div className="flex flex-col gap-3">
      <Tarjeta titulo="Comprobante">
        <dl className="divide-y divide-linea">
          <FilaDato etiqueta="Pago"><span className="cifra break-all">{pago.pagoId}</span></FilaDato>
          <FilaDato etiqueta="Crédito"><span className="cifra">{pago.creditoId}</span></FilaDato>
          <FilaDato etiqueta="Fecha de pago">{formatearFecha(pago.fechaPago)}</FilaDato>
          <FilaDato etiqueta="Monto recibido"><Dinero valor={{ importe: pago.importe, moneda: pago.moneda }} className="font-bold" /></FilaDato>
          <FilaDato etiqueta="Clave de idempotencia"><span className="cifra break-all">{pago.idempotencyKey}</span></FilaDato>
          <FilaDato etiqueta="Registrado por"><span className="cifra">{pago.usuarioProceso}</span></FilaDato>
        </dl>
      </Tarjeta>
      <Prelacion aplicacion={pago.aplicacion} titulo="Aplicación del pago" />
      {estadoPosterior && <ResumenCredito resumen={estadoPosterior} />}
    </div>
  );
}
