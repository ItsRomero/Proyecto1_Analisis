import { useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { useSesion } from "../sesion/SesionContexto";
import volver from "../assets/design/iconos/volver.svg";
import { Boton, Icono } from "./Basicos";
import { Cargando, MensajeError } from "./Estados";

/** Selector de perfil de demostración y fecha de corte de la sesión (ADR-014, regla de fecha inyectada). */
export function BarraSesion({ oscura = false }: { readonly oscura?: boolean }) {
  const { sesion, fechaCorte, cambiarFechaCorte, cambiarPerfil, reiniciar } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  if (sesion === null) return null;
  const elegir = async (perfil: "ASESOR" | "GERENCIA") => {
    setOcupado(true);
    try {
      await cambiarPerfil(perfil);
      // Solo desde las pantallas de inicio: un flujo en curso (p. ej. el comité de OP-3) no se abandona.
      if (["/", "/asesor/clientes", "/gerencia"].includes(ubicacion.pathname)) navegar(perfil === "GERENCIA" ? "/gerencia" : "/asesor/clientes");
    } finally { setOcupado(false); }
  };
  const tono = oscura ? "text-slate-200" : "text-secundario";
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 text-xs ${tono}`} aria-label="Sesión de demostración">
      <div role="group" aria-label="Perfil" className={`inline-flex rounded-lg p-0.5 ${oscura ? "bg-nav-activo" : "bg-superficie"}`}>
        {(["ASESOR", "GERENCIA"] as const).map((p) => (
          <button key={p} type="button" disabled={ocupado} aria-pressed={sesion.perfil === p} onClick={() => void elegir(p)}
            className={`rounded-md px-2.5 py-1.5 font-bold ${sesion.perfil === p ? "bg-acento text-tinta" : oscura ? "text-slate-200" : "text-secundario"}`}>
            {p === "ASESOR" ? "Asesor" : "Gerencia"}
          </button>
        ))}
      </div>
      <label className="inline-flex items-center gap-1.5">
        <span>Corte</span>
        <input type="date" value={fechaCorte} required aria-describedby={error ? "error-corte" : undefined}
          onChange={(e) => setError(cambiarFechaCorte(e.target.value) ? null : "Fecha civil inválida.")}
          className="cifra rounded-md border border-linea bg-white px-1.5 py-1 text-tinta" />
      </label>
      {error && <span id="error-corte" role="alert" className="font-bold text-peligro">{error}</span>}
      <button type="button" className="underline" onClick={() => void reiniciar()}>Reiniciar sesión</button>
      <span className="cifra opacity-80" title="Sujeto de la sesión">{sesion.sujetoId}</span>
    </div>
  );
}

function EsperaSesion({ children }: { readonly children: ReactNode }) {
  const { sesion, error, fechaCorte, reintentar } = useSesion();
  if (error) return <div className="p-4"><MensajeError error={error} onReintentar={reintentar} /></div>;
  if (sesion === null || fechaCorte === "") return <Cargando texto="Abriendo sesión…" />;
  return <>{children}</>;
}

/** Marco móvil del asesor (ancho del prototipo, 403 px) con fuente Outfit. */
export function LayoutAsesor() {
  return (
    <div className="min-h-svh bg-superficie font-asesor">
      <div className="mx-auto flex min-h-svh w-full max-w-[403px] flex-col bg-superficie">
        <div className="bg-tinta px-4 pt-3 pb-1"><BarraSesion oscura /></div>
        <EsperaSesion><Outlet /></EsperaSesion>
      </div>
    </div>
  );
}

export function EncabezadoAsesor({ titulo, antetitulo, regresar, children }: { readonly titulo: string; readonly antetitulo?: string;
  readonly regresar?: string; readonly children?: ReactNode }) {
  return (
    <header className="bg-tinta px-4 pt-3 pb-5 text-white">
      <div className="flex items-center gap-3">
        {regresar && <Link to={regresar} aria-label="Regresar" className="rounded-lg p-1.5 hover:bg-nav-activo">
          <Icono src={volver} className="h-5 w-5" /></Link>}
        <div className="min-w-0">
          {antetitulo && <p className="text-xs font-bold tracking-widest text-etiqueta uppercase">{antetitulo}</p>}
          <h1 className="truncate text-xl font-bold">{titulo}</h1>
        </div>
      </div>
      {children}
    </header>
  );
}

const ENLACES = [
  { a: "/gerencia", texto: "Tablero", fin: true }, { a: "/gerencia/cartera", texto: "Cartera" },
  { a: "/gerencia/clientes", texto: "Clientes" }, { a: "/gerencia/solicitudes", texto: "Solicitudes" },
  { a: "/gerencia/cierres/diario", texto: "Cierre diario" }, { a: "/gerencia/cierres/mensual", texto: "Cierre mensual" },
  { a: "/gerencia/asistente", texto: "Asistente" },
] as const;

/** Marco web de gerencia (escritorio, fuente Inter). */
export function LayoutGerencia() {
  return (
    <div className="min-h-svh bg-superficie font-gerencia">
      <header className="bg-tinta text-white">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-8">
          <Link to="/gerencia" className="flex items-center gap-2 font-bold">
            <span className="rounded-lg bg-acento px-2 py-1 text-sm text-tinta">CV</span> Crédito Vecino
          </Link>
          <nav aria-label="Gerencia" className="flex flex-wrap gap-1">
            {ENLACES.map((e) => (
              <NavLink key={e.a} to={e.a} end={"fin" in e}
                className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? "bg-nav-activo text-acento" : "text-slate-300 hover:text-white"}`}>
                {e.texto}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto"><BarraSesion oscura /></div>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8"><EsperaSesion><RequiereGerencia><Outlet /></RequiereGerencia></EsperaSesion></main>
      <AccesoAsistente />
    </div>
  );
}

/** Acceso persistente al chat desde cualquier pantalla de gerencia. */
function AccesoAsistente() {
  const ubicacion = useLocation();
  if (ubicacion.pathname === "/gerencia/asistente") return null;
  return <Link to="/gerencia/asistente" className="fixed right-5 bottom-5 rounded-full bg-acento px-5 py-3 text-sm font-bold text-tinta shadow-lg">Asistente</Link>;
}

function RequiereGerencia({ children }: { readonly children: ReactNode }) {
  const { sesion } = useSesion();
  const navegar = useNavigate();
  if (sesion?.perfil === "GERENCIA") return <>{children}</>;
  return (
    <div className="tarjeta mx-auto max-w-lg p-6 text-center">
      <p className="font-bold">Esta área corresponde al perfil Gerencia.</p>
      <p className="mt-1 text-sm text-tenue">Cambie de perfil en la barra superior o regrese a la vista del asesor.</p>
      <Boton variante="secundario" className="mt-4" onClick={() => navegar("/asesor/clientes")}>Ir a la vista del asesor</Boton>
    </div>
  );
}

export function Pasos({ pasos, actual }: { readonly pasos: readonly string[]; readonly actual: number }) {
  return (
    <ol className="flex gap-1" aria-label="Pasos de la originación">
      {pasos.map((p, i) => (
        <li key={p} aria-current={i === actual ? "step" : undefined} className="flex-1">
          <span className={`block h-1.5 rounded-full ${i < actual ? "bg-exito" : i === actual ? "bg-acento" : "bg-nav-borde"}`} />
          <span className={`mt-1 block text-[10px] font-semibold ${i === actual ? "text-white" : "text-etiqueta"}`}>{p}</span>
        </li>
      ))}
    </ol>
  );
}
