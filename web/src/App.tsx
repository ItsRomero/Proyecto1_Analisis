import { Navigate, Route, Routes } from "react-router";
import { LayoutAsesor, LayoutGerencia } from "./componentes/Layouts";
import { Vacio } from "./componentes/Estados";
import { ClientesAsesor } from "./paginas/asesor/ClientesAsesor";
import { DetalleCredito } from "./paginas/asesor/DetalleCredito";
import { DetalleMora } from "./paginas/asesor/DetalleMora";
import { Originacion } from "./paginas/asesor/Originacion";
import { PlanPagos } from "./paginas/asesor/PlanPagos";
import { ComprobanteRegistrado, RegistrarPago } from "./paginas/asesor/RegistrarPago";
import { Cartera, CreditosTramo } from "./paginas/gerencia/Cartera";
import { Cierre, ClientesGerencia, CreditoGerencia, DecisionSolicitud, Solicitudes } from "./paginas/gerencia/Operaciones";
import { Chat } from "./chat/Chat";
import { Tablero } from "./paginas/gerencia/Tablero";
import { useSesion } from "./sesion/SesionContexto";

function Inicio() {
  const { sesion } = useSesion();
  if (sesion === null) return null;
  return <Navigate to={sesion.perfil === "GERENCIA" ? "/gerencia" : "/asesor/clientes"} replace />;
}

/** Rutas de las siete pantallas obligatorias y sus complementos (docs/proyecto-final/migracion-vistas-react.md). */
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/asesor" element={<LayoutAsesor />}>
        <Route index element={<Navigate to="clientes" replace />} />
        <Route path="clientes" element={<ClientesAsesor />} />
        <Route path="clientes/nuevo" element={<Navigate to="/asesor/creditos/nuevo" replace />} />
        <Route path="creditos/nuevo" element={<Originacion />} />
        <Route path="creditos/:creditoId" element={<DetalleCredito />} />
        <Route path="creditos/:creditoId/plan" element={<PlanPagos />} />
        <Route path="creditos/:creditoId/mora" element={<DetalleMora />} />
        <Route path="creditos/:creditoId/pagos/nuevo" element={<RegistrarPago />} />
        <Route path="creditos/:creditoId/pagos/:pagoId" element={<ComprobanteRegistrado />} />
      </Route>
      <Route path="/gerencia" element={<LayoutGerencia />}>
        <Route index element={<Tablero />} />
        <Route path="cartera" element={<Cartera />} />
        <Route path="cartera/tramos/:tramo" element={<CreditosTramo />} />
        <Route path="clientes" element={<ClientesGerencia />} />
        <Route path="creditos/:creditoId" element={<CreditoGerencia />} />
        <Route path="solicitudes" element={<Solicitudes />} />
        <Route path="solicitudes/:solicitudId/decision" element={<DecisionSolicitud />} />
        <Route path="cierres/diario" element={<Cierre key="diario" tipo="DIARIO" />} />
        <Route path="cierres/mensual" element={<Cierre key="mensual" tipo="MENSUAL" />} />
        <Route path="asistente" element={<Chat />} />
      </Route>
      <Route path="*" element={<div className="p-6"><Vacio titulo="Página no encontrada" /></div>} />
    </Routes>
  );
}
