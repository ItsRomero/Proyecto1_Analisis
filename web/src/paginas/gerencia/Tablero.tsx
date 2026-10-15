import type { ReactNode } from "react";
import { Link } from "react-router";
import type { SalidaFinal } from "@contratos/proyecto-final";
import { Dinero, OrigenDatos, Tarjeta } from "../../componentes/Basicos";
import { SegunEstado } from "../../componentes/Estados";
import { formatearFecha, formatearPorcentaje, inicioDeMes, nombreTramo } from "../../formato";
import { useConsulta } from "../../hooks/useConsulta";
import { useSesion } from "../../sesion/SesionContexto";

type Cartera = SalidaFinal<"consultarCartera">;
const RIESGO = ["MORA_2", "MORA_3", "VENCIDO", "REESTRUCTURADO"] as const;
const PUNTO: Readonly<Record<string, string>> = { MORA_1: "bg-tramo-mora-1", MORA_2: "bg-tramo-mora-2", MORA_3: "bg-tramo-mora-3",
  VENCIDO: "bg-tramo-vencido", REESTRUCTURADO: "bg-indigo-700" };

export function Kpi({ titulo, children, pie }: { readonly titulo: string; readonly children: ReactNode; readonly pie?: ReactNode }) {
  return (
    <div className="tarjeta p-5">
      <p className="text-sm text-tenue">{titulo}</p>
      <div className="mt-1 text-2xl font-bold">{children}</div>
      {pie && <div className="mt-1 text-xs text-tenue">{pie}</div>}
    </div>
  );
}

/** Filas de riesgo por tramo tal como las concilia calcularCarteraPorTramo (porcentajes del núcleo). */
export function TablaRiesgo({ cartera, conMora1 = false }: { readonly cartera: Cartera; readonly conMora1?: boolean }) {
  const d = cartera.desglose;
  if (d === undefined) return null;
  const filas = d.tramosEnRiesgo.filter((t) => conMora1 || (RIESGO as readonly string[]).includes(t.tramo));
  return (
    <table className="w-full text-sm">
      <caption className="solo-lectores">Cartera en riesgo por tramo</caption>
      <thead><tr className="text-left text-xs text-tenue"><th className="py-2">Tramo</th><th className="text-right">Créditos</th><th className="text-right">Saldo de capital</th>
        <th className="text-right">% de cartera activa</th><th className="text-right"><span className="solo-lectores">Detalle</span></th></tr></thead>
      <tbody>
        {filas.map((t) => (
          <tr key={t.tramo} className="border-t border-linea">
            <td className="py-2.5"><span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${PUNTO[t.tramo] ?? "bg-secundario"}`} aria-hidden="true" />{nombreTramo(t.tramo)}</td>
            <td className="cifra text-right">{t.cantidadCreditos}</td><td className="text-right"><Dinero valor={t.saldoCapital} /></td>
            <td className="cifra text-right font-bold">{formatearPorcentaje(t.porcentaje)}</td>
            <td className="text-right">{t.tramo !== "REESTRUCTURADO" && <Link to={`/gerencia/cartera/tramos/${t.tramo}`} className="text-xs font-bold text-acento-oscuro underline">Ver créditos</Link>}</td>
          </tr>
        ))}
        <tr className="border-t-2 border-tinta font-bold">
          <td className="py-2.5">Total en riesgo</td><td className="cifra text-right">{d.totalEnRiesgo.cantidadCreditos}</td>
          <td className="text-right"><Dinero valor={d.totalEnRiesgo.saldoCapital} /></td><td className="cifra text-right">{formatearPorcentaje(d.totalEnRiesgo.porcentaje)}</td><td />
        </tr>
      </tbody>
    </table>
  );
}

/** Pantalla obligatoria 6: tablero gerencial (frame 103:7192). */
export function Tablero() {
  const { fechaCorte } = useSesion();
  const inicio = inicioDeMes(fechaCorte);
  const cartera = useConsulta("consultarCartera", { fechaCorte, inicioPeriodo: inicio });
  const cierre = useConsulta("consultarCierre", { fechaCorte, tipo: "MENSUAL" });
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold">Tablero gerencial</h1>
        <p className="text-sm text-tenue">Período: {formatearFecha(inicio)} a {formatearFecha(fechaCorte)} · corte {formatearFecha(fechaCorte)}</p>
      </div>
      <SegunEstado estado={cartera.estado} onReintentar={cartera.recargar}>{(c) => {
        const d = c.desglose;
        return (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Kpi titulo="Cartera activa (denominador)" pie={`${d?.cantidadActiva ?? 0} créditos activos`}><Dinero valor={c.carteraActiva} /></Kpi>
              <Kpi titulo="Cartera en mora" pie={<>{d?.carteraEnMora.cantidadCreditos} créditos · {formatearPorcentaje(d?.carteraEnMora.porcentaje ?? null)}</>}>
                {d && <Dinero valor={d.carteraEnMora.saldoCapital} className="text-atraso" />}</Kpi>
              <Kpi titulo="Cartera en riesgo (> 30 días + reestructurados)" pie={<Dinero valor={c.capitalEnRiesgo} />}>
                <span className="cifra text-atraso">{c.tipo === "CON_RAZON" ? `${c.porcentaje} %` : "Sin cartera activa"}</span></Kpi>
              <Kpi titulo="Incobrable del período" pie={`${d?.incobrablesDelPeriodo.cantidadCreditos ?? 0} créditos dados de baja`}>
                {d && <Dinero valor={d.incobrablesDelPeriodo.saldoCapital} className="text-secundario" />}</Kpi>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <Tarjeta titulo="Riesgo por tramo" className="lg:col-span-2">
                <TablaRiesgo cartera={c} />
                <p className="mt-3 text-xs text-tenue">Mora 1 (1–30 días) integra la cartera en mora pero no la cartera en riesgo. Los incobrables se excluyen
                  de la cartera activa y se reportan por separado.</p>
              </Tarjeta>
              <div className="flex flex-col gap-4">
                <Tarjeta titulo="Desembolsos y recuperaciones del mes">
                  <SegunEstado estado={cierre.estado} onReintentar={cierre.recargar}>{(m) => (
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div><dt className="text-tenue">Desembolsos ({m.desembolsos.cantidad})</dt><dd className="font-bold"><Dinero valor={m.desembolsos.monto} /></dd></div>
                      <div><dt className="text-tenue">Recuperaciones ({m.recuperaciones.cantidad})</dt><dd className="font-bold text-exito"><Dinero valor={m.recuperaciones.total} /></dd></div>
                    </dl>)}</SegunEstado>
                  <Link to="/gerencia/cierres/mensual" className="mt-3 inline-block text-xs font-bold underline">Ver cierre mensual</Link>
                </Tarjeta>
                <Tarjeta titulo="Incobrables del período">
                  {d && d.incobrablesDelPeriodo.creditos.length > 0 ? <ul className="text-sm">{d.incobrablesDelPeriodo.creditos.map((b) => (
                    <li key={b.creditoId} className="flex justify-between border-t border-linea py-1.5 first:border-0">
                      <Link to={`/gerencia/creditos/${b.creditoId}`} className="cifra underline">{b.creditoId}</Link>
                      <span>{formatearFecha(b.fecha)} · <Dinero valor={b.saldoCapital} /></span></li>))}</ul>
                    : <p className="text-sm text-tenue">Sin bajas en el período.</p>}
                </Tarjeta>
                <Link to="/gerencia/asistente" className="tarjeta flex flex-col items-center justify-center gap-1 border-dashed p-5 text-center text-sm text-tenue">
                  <span className="font-bold text-secundario">Asistente gerencial</span>Espacio reservado para el chat integrado.</Link>
              </div>
            </div>
            <OrigenDatos fechaCorte={c.fechaCorte} operacion="consultarCartera · consultarCierre" />
          </>
        );
      }}</SegunEstado>
    </div>
  );
}
