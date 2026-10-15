import { Link, useParams } from "react-router";
import { tramoMoraSchema } from "@contratos/esquemas";
import { Dinero, InsigniaEstado, InsigniaTramo, OrigenDatos, Tarjeta } from "../../componentes/Basicos";
import { SegunEstado, Vacio } from "../../componentes/Estados";
import { formatearFecha, formatearPorcentaje, inicioDeMes, nombreTramo } from "../../formato";
import { useConsulta } from "../../hooks/useConsulta";
import { useSesion } from "../../sesion/SesionContexto";
import { Kpi, TablaRiesgo } from "./Tablero";

/** Cartera y riesgo por tramo (frame 103:7580). */
export function Cartera() {
  const { fechaCorte } = useSesion();
  const cartera = useConsulta("consultarCartera", { fechaCorte, inicioPeriodo: inicioDeMes(fechaCorte) });
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-bold">Cartera</h1>
      <SegunEstado estado={cartera.estado} onReintentar={cartera.recargar}>{(c) => (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi titulo="Cartera activa"><Dinero valor={c.carteraActiva} /></Kpi>
            <Kpi titulo="Capital en riesgo" pie={c.tipo === "CON_RAZON" ? `${c.porcentaje} % de la cartera activa` : "Sin cartera activa"}><Dinero valor={c.capitalEnRiesgo} /></Kpi>
            <Kpi titulo="Cartera en mora (cualquier atraso)" pie={formatearPorcentaje(c.desglose?.carteraEnMora.porcentaje ?? null)}>
              {c.desglose && <Dinero valor={c.desglose.carteraEnMora.saldoCapital} />}</Kpi>
          </div>
          <Tarjeta titulo="Cartera en riesgo por tramo">
            <TablaRiesgo cartera={c} conMora1 />
            <p className="mt-3 text-xs text-tenue">Riesgo = saldo de capital completo de créditos con más de 30 días de atraso más reestructurados, sobre cartera activa.
              Mora 1 aparece con contribución cero. <Link to="/gerencia/cartera/tramos/MORA_1" className="underline">Ver créditos en Mora 1</Link>.</p>
          </Tarjeta>
          <OrigenDatos fechaCorte={c.fechaCorte} operacion="consultarCartera" />
        </>
      )}</SegunEstado>
    </div>
  );
}

/** Créditos de un tramo: tercer paso del flujo de consulta gerencial. */
export function CreditosTramo() {
  const { tramo = "" } = useParams();
  const { fechaCorte } = useSesion();
  const valido = tramoMoraSchema.safeParse(tramo);
  const lista = useConsulta("listarCreditosMora", valido.success ? { fechaCorte, tramo: valido.data } : null);
  const cartera = useConsulta("consultarCartera", { fechaCorte, inicioPeriodo: inicioDeMes(fechaCorte) });
  if (!valido.success) return <Vacio titulo="Tramo desconocido" />;
  const fila = cartera.estado.tipo === "listo" ? cartera.estado.datos.desglose?.tramosEnRiesgo.find((t) => t.tramo === tramo) : undefined;
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link to="/gerencia/cartera" className="text-sm underline">← Cartera</Link>
        <h1 className="mt-1 text-3xl font-bold">Créditos en {nombreTramo(tramo)}</h1>
        {fila && <p className="text-sm text-tenue">Fila del tablero: {fila.cantidadCreditos} créditos · <Dinero valor={fila.saldoCapital} /> · {formatearPorcentaje(fila.porcentaje)}</p>}
      </div>
      <SegunEstado estado={lista.estado} onReintentar={lista.recargar}>{(l) => l.creditos.length === 0
        ? <Vacio titulo={`Sin créditos en ${nombreTramo(tramo)} al corte`} />
        : (
          <div className="tarjeta overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <caption className="solo-lectores">Créditos del tramo {nombreTramo(tramo)}</caption>
              <thead className="bg-superficie-suave text-left text-xs text-tenue"><tr><th className="p-3">Crédito</th><th>Estado</th><th>Tramo</th>
                <th className="text-right">Días de atraso</th><th className="text-right">Saldo de capital</th><th className="text-right">Cuotas vencidas</th><th className="p-3 text-right">Cuota más antigua</th></tr></thead>
              <tbody>{l.creditos.map((c) => (
                <tr key={c.creditoId} className="border-t border-linea">
                  <td className="p-3"><Link to={`/gerencia/creditos/${c.creditoId}`} className="cifra font-bold underline">{c.creditoId}</Link></td>
                  <td><InsigniaEstado estado={c.estado} /></td><td><InsigniaTramo tramo={c.tramo} /></td>
                  <td className="cifra text-right font-bold">{c.diasAtraso}</td><td className="text-right"><Dinero valor={c.saldoCapital} /></td>
                  <td className="cifra text-right">{c.cuotasVencidas}</td>
                  <td className="p-3 text-right">{c.proximaCuota && <>#{c.proximaCuota.numeroCuota} · {formatearFecha(c.proximaCuota.fechaVencimiento)}</>}</td>
                </tr>))}</tbody>
            </table>
          </div>
        )}</SegunEstado>
      <OrigenDatos fechaCorte={fechaCorte} operacion="listarCreditosMora" />
    </div>
  );
}
