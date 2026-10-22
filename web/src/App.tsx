import { useState, type ReactNode, type FormEvent } from "react";
import { useParams } from "react-router";
import { LayoutUsuario, InicioUsuario, DetalleUsuario, PlanUsuario, AyudaUsuario } from "./paginas/usuario/Usuario";
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
  if (sesion === null) return <Navigate to="/login" replace />;
  return <Navigate to={sesion.perfil === "USUARIO" ? "/usuario" : sesion.perfil === "GERENCIA" ? "/gerencia" : "/asesor/clientes"} replace />;
}

/** Rutas de las siete pantallas obligatorias y sus complementos (docs/proyecto-final/migracion-vistas-react.md). */
export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/login/:rol" element={<Login />} />
      <Route path="/" element={<Inicio />} />
      <Route path="/usuario" element={<Protegida perfil="USUARIO"><LayoutUsuario /></Protegida>}>
        <Route index element={<Navigate to="inicio" replace />} />
        <Route path="inicio" element={<InicioUsuario />} />
        <Route path="creditos/:creditoId" element={<DetalleUsuario />} />
        <Route path="creditos/:creditoId/plan" element={<PlanUsuario />} />
        <Route path="ayuda" element={<AyudaUsuario />} />
      </Route>
      <Route path="/asesor" element={<Protegida perfil="ASESOR"><LayoutAsesor /></Protegida>}>
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
      <Route path="/gerencia" element={<Protegida perfil="GERENCIA"><LayoutGerencia /></Protegida>}>
        <Route index element={<Tablero />} />
        <Route path="cartera" element={<Cartera />} />
        <Route path="cartera/tramos/:tramo" element={<CreditosTramo />} />
        <Route path="clientes" element={<ClientesGerencia />} />
        <Route path="creditos/:creditoId" element={<CreditoGerencia />} />
        <Route path="creditos/:creditoId/plan" element={<PlanPagos />} />
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

function Protegida({ perfil, children }: { perfil: "ASESOR" | "GERENCIA" | "USUARIO"; children: ReactNode }) {
  const { sesion, cargando, error, reintentar } = useSesion();
  if (cargando) return <p className="p-6">Cargando sesión...</p>;
  if (error) return <div className="p-6">No se pudo consultar la sesión. <button onClick={reintentar}>Reintentar</button></div>;
  if (!sesion) return <Navigate to={`/login/${perfil === "USUARIO" ? "cliente" : perfil.toLowerCase()}`} replace />;
  if (sesion.perfil !== perfil) return <Inicio />;
  return <>{children}</>;
}

function Login() {
  const { rol } = useParams();
  const { sesion, login, cargando } = useSesion();
  const perfil = rol === "gerencia" ? "GERENCIA" : rol === "cliente" ? "USUARIO" : "ASESOR";
  if (cargando) return <p className="p-6">Cargando sesión...</p>;
  if (sesion) return <Inicio />;
  return <FormularioLogin key={perfil} perfil={perfil} login={login} />;
}
function FormularioLogin({ perfil, login }: { perfil: "ASESOR" | "GERENCIA" | "USUARIO";
  login: (perfil: "ASESOR" | "GERENCIA" | "USUARIO", usuario: string, contrasena: string) => Promise<void> }) {
  const cliente = perfil === "USUARIO";
  const [usuario, setUsuario] = useState(cliente ? "" : perfil === "GERENCIA" ? "gerencia" : "asesor");
  const [contrasena, setContrasena] = useState(cliente ? "" : perfil === "GERENCIA" ? "Gerencia123!" : "Asesor123!");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const enviar = async (e: FormEvent) => {
    e.preventDefault(); setError(""); setOcupado(true);
    try { await login(perfil, usuario, contrasena); }
    catch { setError("No se pudo iniciar sesión. Verifica tus datos de acceso y la conexión."); }
    finally { setOcupado(false); }
  };
  return <main className="flex min-h-svh items-center justify-center bg-superficie p-4">
    <section className="tarjeta w-full max-w-md p-6">
      <p className="font-bold text-secundario">Crédito Vecino</p>
      <h1 className="my-4 text-2xl font-bold">Iniciar sesión · {cliente ? "Cliente" : perfil === "GERENCIA" ? "Gerencia" : "Asesor"}</h1>
      <nav aria-label="Accesos" className="mb-6 flex gap-4 text-sm font-bold underline">
        <a href="/login/gerencia">Gerencia</a><a href="/login/asesor">Asesor</a><a href="/login/cliente">Cliente</a>
      </nav>
      <form onSubmit={e => void enviar(e)} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">{cliente ? "ID del cliente (id_cliente)" : "Usuario"}
          <input required autoComplete="username" value={usuario} onChange={e => setUsuario(e.target.value)} className="rounded-lg border border-linea p-3" /></label>
        <label className="flex flex-col gap-1">{cliente ? "DPI" : "Contraseña"}
          <input required type="password" autoComplete="current-password" value={contrasena} onChange={e => setContrasena(e.target.value)} className="rounded-lg border border-linea p-3" /></label>
        {error && <p role="alert" className="text-sm text-peligro">{error}</p>}
        <button disabled={ocupado} className="rounded-lg bg-tinta p-3 font-bold text-white disabled:opacity-50">{ocupado ? "Ingresando..." : "Entrar"}</button>
      </form>
    </section>
  </main>;
}
