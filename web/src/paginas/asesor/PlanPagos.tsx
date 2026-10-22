import { useParams } from "react-router";
import { OrigenDatos } from "../../componentes/Basicos";
import { SegunEstado } from "../../componentes/Estados";
import { EncabezadoAsesor } from "../../componentes/Layouts";
import { useConsulta } from "../../hooks/useConsulta";
import { useSesion } from "../../sesion/SesionContexto";
import { TablaPlan } from "./Originacion";

/** Pantalla obligatoria 4: plan de amortización con fechas contractuales (frame 12:741, R-2). */
export function PlanPagos() {
  const { creditoId = "" } = useParams();
  const { fechaCorte, sesion } = useSesion();
  const plan = useConsulta("consultarPlan", { creditoId, fechaCorte });
  const resumen = useConsulta("consultarCredito", { creditoId, fechaCorte });
  return (
    <>
      <EncabezadoAsesor titulo="Plan de amortización" antetitulo={creditoId} regresar={`/${sesion?.perfil === "GERENCIA" ? "gerencia" : "asesor"}/creditos/${creditoId}`} />
      <main className="flex flex-col gap-3 p-4">
        <SegunEstado estado={resumen.estado} onReintentar={resumen.recargar}>{(r) => (
          <SegunEstado estado={plan.estado} onReintentar={plan.recargar}>{(p) => (
            <>
              <ul className="flex flex-wrap gap-3 text-xs" aria-label="Leyenda">
                <li><span className="mr-1 inline-block h-3 w-3 rounded bg-green-100 align-middle" />Pagadas ({r.cuotasPagadas})</li>
                <li><span className="mr-1 inline-block h-3 w-3 rounded bg-orange-100 align-middle" />Vencidas ({r.cuotasVencidas})</li>
                <li><span className="mr-1 inline-block h-3 w-3 rounded border border-linea bg-white align-middle" />Pendientes</li>
              </ul>
              <TablaPlan plan={p} pagadas={r.cuotasPagadas} vencidas={r.cuotasVencidas} />
              <OrigenDatos fechaCorte={fechaCorte} operacion="consultarPlan · consultarCredito" />
            </>
          )}</SegunEstado>
        )}</SegunEstado>
      </main>
    </>
  );
}
