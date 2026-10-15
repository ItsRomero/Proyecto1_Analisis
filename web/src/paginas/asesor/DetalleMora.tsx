import { Link, useParams } from "react-router";
import volver from "../../assets/design/iconos/volver.svg";
import { Dinero, Icono } from "../../componentes/Basicos";
import { MoraDelCredito } from "../../componentes/Credito";
import { SegunEstado } from "../../componentes/Estados";
import { useConsulta } from "../../hooks/useConsulta";
import { useSesion } from "../../sesion/SesionContexto";

/** Pantalla obligatoria 5: detalle de la mora por cuota y tramo recorrido (frame 12:1040). */
export function DetalleMora() {
  const { creditoId = "" } = useParams();
  const { fechaCorte } = useSesion();
  const resumen = useConsulta("consultarCredito", { creditoId, fechaCorte });
  return (
    <SegunEstado estado={resumen.estado} onReintentar={resumen.recargar}>{(r) => (
      <>
        <header className="bg-tramo-vencido px-4 pt-3 pb-5 text-white">
          <div className="flex items-center gap-3">
            <Link to={`/asesor/creditos/${creditoId}`} aria-label="Regresar" className="rounded-lg p-1.5 hover:bg-white/10"><Icono src={volver} /></Link>
            <div><p className="text-xs font-bold tracking-widest uppercase opacity-80">{creditoId}</p><h1 className="text-xl font-bold">Detalle de mora</h1></div>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-white/10 p-3 text-center">
            <div><dt className="text-xs opacity-80">Días en mora</dt><dd className="cifra text-2xl font-bold">{r.diasAtraso}</dd></div>
            <div><dt className="text-xs opacity-80">Saldo capital</dt><dd className="text-sm"><Dinero valor={r.saldoCapital} /></dd></div>
            <div><dt className="text-xs opacity-80">Cuotas vencidas</dt><dd className="cifra text-2xl font-bold">{r.cuotasVencidas}</dd></div>
          </dl>
        </header>
        <main className="flex flex-col gap-3 p-4">
          <p className="text-sm text-secundario">La mora se calcula sobre el capital de cada cuota vencida con la política vigente al otorgamiento.
            Cada tramo recorrido aplica su tasa a los días que la cuota permaneció en él.</p>
          <MoraDelCredito resumen={r} />
          {r.cuotasVencidas > 0 && <Link to={`/asesor/creditos/${creditoId}/pagos/nuevo`} className="flex min-h-12 items-center justify-center rounded-2xl bg-tinta font-bold text-white">
            Registrar pago de la cuota más antigua</Link>}
        </main>
      </>
    )}</SegunEstado>
  );
}
