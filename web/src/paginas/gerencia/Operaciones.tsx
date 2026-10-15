import { useDeferredValue, useState } from "react";
import { Link, useParams } from "react-router";
import type { SalidaFinal } from "@contratos/proyecto-final";
import { operar } from "../../api/cliente";
import { Boton, Dinero, FilaDato, InsigniaEstado, InsigniaTramo, OrigenDatos, Tarjeta } from "../../componentes/Basicos";
import { FranjaSituacion, MoraDelCredito, ResumenCredito } from "../../componentes/Credito";
import { MensajeError, SegunEstado, Vacio } from "../../componentes/Estados";
import { formatearFecha, tasaComoPorcentaje } from "../../formato";
import { useConsulta } from "../../hooks/useConsulta";
import { useSesion } from "../../sesion/SesionContexto";
import { PasoDecision } from "../asesor/Originacion";

/** Clientes de gerencia (frame 103:8224): sin DPI ni teléfono. */
export function ClientesGerencia() {
  const { fechaCorte } = useSesion();
  const [busqueda, setBusqueda] = useState("");
  const buscado = useDeferredValue(busqueda.trim());
  const { estado, recargar } = useConsulta("listarClientes", { fechaCorte, ...(buscado ? { busqueda: buscado } : {}) });
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <label className="flex flex-col text-sm font-semibold text-secundario">Buscar
          <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Nombre, municipio o crédito"
            className="mt-1 min-h-11 w-72 rounded-xl border border-linea bg-white px-3" /></label>
      </div>
      <SegunEstado estado={estado} onReintentar={recargar}>{(d) => d.clientes.length === 0 ? <Vacio titulo="Sin coincidencias" /> : (
        <div className="tarjeta overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <caption className="solo-lectores">Clientes y créditos al corte</caption>
            <thead className="bg-superficie-suave text-left text-xs text-tenue"><tr><th className="p-3">Cliente</th><th>Municipio</th><th>Créditos</th></tr></thead>
            <tbody>{d.clientes.map((c) => (
              <tr key={c.clienteId} className="border-t border-linea align-top">
                <td className="p-3"><span className="font-bold">{c.nombreCompleto}</span><span className="cifra block text-xs text-tenue">{c.clienteId}</span></td>
                <td className="py-3">{c.municipio}</td>
                <td className="py-3"><ul className="flex flex-col gap-1">{c.creditos.length === 0 ? <li className="text-tenue">Sin créditos</li> : c.creditos.map((cr) => (
                  <li key={cr.creditoId} className="flex flex-wrap items-center gap-2"><Link to={`/gerencia/creditos/${cr.creditoId}`} className="cifra underline">{cr.creditoId}</Link>
                    <InsigniaEstado estado={cr.estado} />{cr.diasAtraso > 0 && <InsigniaTramo tramo={cr.tramo} />}<Dinero valor={cr.saldoCapital} /></li>))}</ul></td>
              </tr>))}</tbody>
          </table>
        </div>)}</SegunEstado>
      <OrigenDatos fechaCorte={fechaCorte} operacion="listarClientes" />
    </div>
  );
}

/** Solicitudes pendientes de comité o desembolso (frame 103:8780). */
export function Solicitudes() {
  const { fechaCorte } = useSesion();
  const { estado, recargar } = useConsulta("listarSolicitudes", { fechaCorte });
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-bold">Solicitudes</h1>
      <SegunEstado estado={estado} onReintentar={recargar}>{(d) => d.solicitudes.length === 0
        ? <Vacio titulo="Sin solicitudes pendientes">Las solicitudes registradas por los asesores aparecen aquí hasta su desembolso.</Vacio> : (
          <div className="tarjeta overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <caption className="solo-lectores">Solicitudes pendientes</caption>
              <thead className="bg-superficie-suave text-left text-xs text-tenue"><tr><th className="p-3">Solicitud</th><th>Cliente</th><th>Asesor</th>
                <th className="text-right">Monto</th><th className="text-right">Plazo / tasa</th><th>Estado</th><th className="p-3" /></tr></thead>
              <tbody>{d.solicitudes.map((s) => (
                <tr key={s.creditoId} className="border-t border-linea">
                  <td className="cifra p-3 font-bold">{s.creditoId}<span className="block text-xs font-normal text-tenue">{formatearFecha(s.fechaSolicitud)}</span></td>
                  <td>{s.nombreCliente}</td><td className="cifra">{s.asesorId}</td><td className="text-right"><Dinero valor={s.monto} /></td>
                  <td className="text-right">{s.plazoMeses} m · {tasaComoPorcentaje(s.tasaNominalAnual)} %</td><td><InsigniaEstado estado={s.estado} /></td>
                  <td className="p-3 text-right"><Link to={`/gerencia/solicitudes/${s.creditoId}/decision`} className="font-bold text-acento-oscuro underline">
                    {s.estado === "SOLICITADO" ? "Decidir" : "Ver"}</Link></td>
                </tr>))}</tbody>
            </table>
          </div>)}</SegunEstado>
    </div>
  );
}

/** Confirmar aprobación o rechazo del comité (frames 103:9670 y 103:10164). */
export function DecisionSolicitud() {
  const { solicitudId = "" } = useParams();
  const { fechaCorte } = useSesion();
  const ficha = useConsulta("consultarFichaCredito", { creditoId: solicitudId, fechaCorte });
  const [resumen, setResumen] = useState<SalidaFinal<"consultarCredito"> | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [ocupado, setOcupado] = useState(false);
  const decidir = async (accion: "aprobarCredito" | "rechazarCredito", motivo: string) => {
    setOcupado(true); setError(null);
    try { setResumen((await operar(accion, { creditoId: solicitudId, fechaOperacion: fechaCorte, motivo })).datos); }
    catch (e) { setError(e); } finally { setOcupado(false); }
  };
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link to="/gerencia/solicitudes" className="text-sm underline">← Solicitudes</Link>
      <h1 className="text-3xl font-bold">Decisión del comité</h1>
      <SegunEstado estado={ficha.estado} onReintentar={ficha.recargar}>{(f) => {
        const actual = resumen ?? f.resumen;
        return (
          <>
            <Tarjeta titulo="Solicitud">
              <dl className="divide-y divide-linea">
                <FilaDato etiqueta="Crédito"><span className="cifra">{solicitudId}</span></FilaDato>
                <FilaDato etiqueta="Cliente">{f.nombreCliente} · <span className="cifra">{f.clienteId}</span></FilaDato>
                <FilaDato etiqueta="Monto"><Dinero valor={f.capitalOriginal} /></FilaDato>
                <FilaDato etiqueta="Plazo / tasa">{f.plazoMeses} meses · {tasaComoPorcentaje(f.tasaNominalAnual)} % TNA</FilaDato>
                <FilaDato etiqueta="Asesor"><span className="cifra">{f.asesorId}</span></FilaDato>
              </dl>
            </Tarjeta>
            <PasoDecision titulo="Decisión" resumen={actual} esGerencia ocupado={ocupado} motivoInicial="Aprobación del comité de crédito"
              onAprobar={(m) => void decidir("aprobarCredito", m)} onRechazar={(m) => void decidir("rechazarCredito", m)} />
            {actual.estado === "APROBADO" && <p className="text-sm">Aprobada. El desembolso lo realiza el asesor en{" "}
              <Link to={`/asesor/creditos/nuevo?creditoId=${solicitudId}`} className="font-bold underline">la originación</Link>.</p>}
            {error !== null && <MensajeError error={error} />}
          </>
        );
      }}</SegunEstado>
    </div>
  );
}

/** Pantalla obligatoria 7: cierre diario y mensual (frames 103:9199, 103:9370 y 103:9511). */
export function Cierre({ tipo }: { readonly tipo: "DIARIO" | "MENSUAL" }) {
  const { fechaCorte } = useSesion();
  const { estado, recargar } = useConsulta("consultarCierre", { fechaCorte, tipo });
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [ocupado, setOcupado] = useState(false);
  const generar = async () => {
    setOcupado(true); setError(null);
    try { await operar("generarCierre", { fechaCorte, tipo }); setConfirmar(false); recargar(); }
    catch (e) { setError(e); } finally { setOcupado(false); }
  };
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold">Cierre {tipo === "DIARIO" ? "diario" : "mensual"}</h1>
        <p className="text-sm text-tenue">Corte {formatearFecha(fechaCorte)}</p>
      </div>
      <SegunEstado estado={estado} onReintentar={recargar}>{(c) => (
        <>
          <div className={`rounded-2xl border p-4 text-sm ${c.estado === "GENERADO" ? "border-green-300 bg-green-50 text-exito-oscuro" : "border-aviso-borde bg-aviso-fondo text-aviso-texto"}`}>
            {c.estado === "GENERADO"
              ? <p><strong>Cierre generado</strong> · <span className="cifra">{c.cierreId}</span>. El snapshot es inmutable: generarlo otra vez devuelve el mismo.</p>
              : <p><strong>Vista previa</strong>. Las cifras salen de los pagos y desembolsos registrados; al generar el cierre quedan congeladas en un snapshot único.</p>}
          </div>
          <Tarjeta titulo={`Período ${formatearFecha(c.inicioPeriodo)} – ${formatearFecha(c.fechaCorte)}`}>
            <dl className="divide-y divide-linea">
              <FilaDato etiqueta={`Desembolsos (${c.desembolsos.cantidad})`}><Dinero valor={c.desembolsos.monto} /></FilaDato>
              <FilaDato etiqueta={`Recuperaciones (${c.recuperaciones.cantidad} pagos)`}><Dinero valor={c.recuperaciones.total} className="font-bold" /></FilaDato>
              <FilaDato etiqueta="· Gastos de gestión"><Dinero valor={c.recuperaciones.gastosComisiones} /></FilaDato>
              <FilaDato etiqueta="· Interés moratorio"><Dinero valor={c.recuperaciones.interesMoratorio} /></FilaDato>
              <FilaDato etiqueta="· Interés corriente"><Dinero valor={c.recuperaciones.interesCorriente} /></FilaDato>
              <FilaDato etiqueta="· Capital"><Dinero valor={c.recuperaciones.capital} /></FilaDato>
            </dl>
          </Tarjeta>
          <Tarjeta titulo="Cartera al corte">
            <dl className="divide-y divide-linea">
              <FilaDato etiqueta="Cartera activa"><Dinero valor={c.cartera.carteraActiva} /></FilaDato>
              {c.cartera.desglose && <FilaDato etiqueta="Cartera en mora"><Dinero valor={c.cartera.desglose.carteraEnMora.saldoCapital} /></FilaDato>}
              <FilaDato etiqueta="Cartera en riesgo"><Dinero valor={c.cartera.capitalEnRiesgo} />{c.cartera.tipo === "CON_RAZON" && <> · {c.cartera.porcentaje} %</>}</FilaDato>
              {c.cartera.desglose && <FilaDato etiqueta={`Incobrable del período (${c.cartera.desglose.incobrablesDelPeriodo.cantidadCreditos})`}>
                <Dinero valor={c.cartera.desglose.incobrablesDelPeriodo.saldoCapital} /></FilaDato>}
            </dl>
          </Tarjeta>
          <OrigenDatos fechaCorte={c.fechaCorte} operacion={c.estado === "GENERADO" ? "generarCierre (snapshot)" : "consultarCierre"} />
          {error !== null && <MensajeError error={error} />}
          {c.estado === "PREVIO" && (!confirmar
            ? <Boton variante="primario" onClick={() => setConfirmar(true)}>Ejecutar cierre {tipo === "DIARIO" ? "del día" : "del mes"}</Boton>
            : <div role="alertdialog" aria-labelledby="titulo-cierre" className="tarjeta border-2 border-tinta p-4">
                <p id="titulo-cierre" className="font-bold">¿Generar el cierre {tipo === "DIARIO" ? "diario" : "mensual"} al {formatearFecha(fechaCorte)}?</p>
                <p className="mt-1 text-sm text-tenue">Asegúrese de que todos los cobros del período estén registrados. Las cifras quedarán congeladas.</p>
                <div className="mt-3 flex gap-2"><Boton variante="secundario" onClick={() => setConfirmar(false)}>Cancelar</Boton>
                  <Boton autoFocus disabled={ocupado} onClick={() => void generar()}>Confirmar cierre</Boton></div>
              </div>)}
        </>
      )}</SegunEstado>
    </div>
  );
}

/** Estado de un crédito y formación de su mora en la vista gerencial (G-5). */
export function CreditoGerencia() {
  const { creditoId = "" } = useParams();
  const { fechaCorte } = useSesion();
  const ficha = useConsulta("consultarFichaCredito", { creditoId, fechaCorte });
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Crédito <span className="cifra">{creditoId}</span></h1>
      <SegunEstado estado={ficha.estado} onReintentar={ficha.recargar}>{(f) => (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <p className="text-sm">{f.nombreCliente} · {f.municipio} · política <strong>{f.politicaId ?? "pendiente"}</strong></p>
            <FranjaSituacion resumen={f.resumen} />
            <ResumenCredito resumen={f.resumen} extra={<FilaDato etiqueta="Monto original"><Dinero valor={f.capitalOriginal} /></FilaDato>} />
            <Link to={`/asesor/creditos/${creditoId}/plan`} className="text-sm font-bold underline">Ver plan de amortización</Link>
          </div>
          <div className="flex flex-col gap-3"><h2 className="etiqueta-seccion">Formación de la mora</h2><MoraDelCredito resumen={f.resumen} /></div>
        </div>
      )}</SegunEstado>
    </div>
  );
}
