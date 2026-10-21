import { Link, useParams } from "react-router";
import alerta from "../../assets/design/iconos/alerta.svg";
import documento from "../../assets/design/iconos/documento.svg";
import reloj from "../../assets/design/iconos/reloj.svg";
import ubicacion from "../../assets/design/iconos/ubicacion.svg";
import { Dinero, FilaDato, Icono, Tarjeta } from "../../componentes/Basicos";
import { FranjaSituacion, ResumenCredito } from "../../componentes/Credito";
import { SegunEstado, Vacio } from "../../componentes/Estados";
import { EncabezadoAsesor } from "../../componentes/Layouts";
import { formatearFecha, nombreEstado, tasaComoPorcentaje } from "../../formato";
import { useConsulta } from "../../hooks/useConsulta";
import { useSesion } from "../../sesion/SesionContexto";

/** Pantalla obligatoria 2: detalle del crédito (frame 11:591). */
export function DetalleCredito() {
  const { creditoId = "" } = useParams();
  const { fechaCorte } = useSesion();
  const ficha = useConsulta("consultarFichaCredito", { creditoId, fechaCorte });
  const pagos = useConsulta("listarPagos", { creditoId, fechaCorte });
  return (
    <SegunEstado estado={ficha.estado} onReintentar={ficha.recargar}>{(f) => {
      const r = f.resumen;
      return (
        <>
          <EncabezadoAsesor titulo={f.nombreCliente} antetitulo={`Detalle del crédito · ${creditoId}`} regresar="/asesor/clientes">
            <p className="mt-3 flex items-center gap-2 rounded-xl bg-nav-activo px-3 py-2 text-sm"><Icono src={ubicacion} className="h-4 w-4" />
              {f.municipio} · cliente <span className="cifra">{f.clienteId}</span></p>
          </EncabezadoAsesor>
          <main className="flex flex-col gap-3 p-4">
            <FranjaSituacion resumen={r} />
            <ResumenCredito resumen={r} extra={<>
              <FilaDato etiqueta="Monto original"><Dinero valor={f.capitalOriginal} /></FilaDato>
              <FilaDato etiqueta="Plazo / tasa">{f.plazoMeses} m · {tasaComoPorcentaje(f.tasaNominalAnual)} % TNA</FilaDato>
              <FilaDato etiqueta="Política de mora">{f.politicaId ?? "Se fija al desembolsar"}</FilaDato>
              <FilaDato etiqueta="Desembolso">{f.fechaDesembolso ? formatearFecha(f.fechaDesembolso) : "Pendiente"}</FilaDato>
              {f.reestructurado && <FilaDato etiqueta="Condición">Reestructurado (cuenta en riesgo)</FilaDato>}
            </>} />
            {f.fechaDesembolso !== null ? (
              <>
                <Link to={`/asesor/creditos/${creditoId}/pagos/nuevo`} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-tinta text-lg font-bold text-white">
                  <Icono src={reloj} className="h-5 w-5 invert" /> Registrar pago</Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link to={`/asesor/creditos/${creditoId}/plan`} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-linea bg-white text-sm font-bold">
                    <Icono src={documento} className="h-4 w-4" /> Plan de pago</Link>
                  <Link to={`/asesor/creditos/${creditoId}/mora`} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-secundario text-sm font-bold text-white">
                    <Icono src={alerta} className="h-4 w-4 invert" /> Detalle mora</Link>
                </div>
              </>
            ) : (r.estado === "SOLICITADO" || r.estado === "APROBADO") && (
              <Link to={`/asesor/creditos/nuevo?creditoId=${creditoId}`} className="flex min-h-12 items-center justify-center rounded-2xl bg-acento font-bold">
                Continuar originación ({nombreEstado(r.estado).toLowerCase()})</Link>
            )}
            <Tarjeta titulo="Pagos registrados">
              <SegunEstado estado={pagos.estado} onReintentar={pagos.recargar}>{(p) => p.pagos.length === 0
                ? <Vacio titulo="Sin pagos al corte" />
                : <ul className="divide-y divide-linea">{[...p.pagos].reverse().map((pg) => (
                  <li key={pg.pagoId}><Link to={`/asesor/creditos/${creditoId}/pagos/${pg.pagoId}`} className="flex items-center justify-between gap-2 py-2 text-sm hover:bg-superficie-suave">
                    <span>Cuota {pg.numeroCuota} · {formatearFecha(pg.fechaPago)}<span className="block text-xs text-tenue">{pg.canal}</span></span>
                    <Dinero valor={pg.importe} className="font-semibold" /></Link></li>))}</ul>}
              </SegunEstado>
            </Tarjeta>
            <details className="tarjeta p-4 text-sm">
              <summary className="cursor-pointer font-bold">Historial de estados ({f.historial.length})</summary>
              <ol className="mt-2 flex flex-col gap-2">{f.historial.map((t, i) => (
                <li key={i} className="border-l-2 border-linea pl-3"><strong>{nombreEstado(t.estadoAnterior)} → {nombreEstado(t.estadoNuevo)}</strong> · {formatearFecha(t.fecha)}
                  <span className="block text-xs break-words text-tenue">{t.usuarioProceso}: {t.motivo}</span></li>))}</ol>
            </details>
          </main>
        </>
      );
    }}</SegunEstado>
  );
}
