import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useOutletContext, useParams, useLocation, useNavigate, useSearchParams } from "react-router";
import { z } from "zod";
import { operacionesFinales } from "@contratos/proyecto-final";
import { http } from "../../api/cliente";
import { BarraSesion, EncabezadoAsesor } from "../../componentes/Layouts";
import { Boton, Dinero, FilaDato, Tarjeta } from "../../componentes/Basicos";
import { MensajeError } from "../../componentes/Estados";
import { FranjaSituacion } from "../../componentes/Credito";
import { SegunEstado, Vacio } from "../../componentes/Estados";
import { useConsulta, type EstadoConsulta } from "../../hooks/useConsulta";
import { useSesion } from "../../sesion/SesionContexto";
import { formatearFecha, tasaComoPorcentaje } from "../../formato";

const usuarioSchema = z.object({ cliente: operacionesFinales.listarClientes.salida.shape.clientes.unwrap().element.nullable() });
type Cliente = NonNullable<z.infer<typeof usuarioSchema>["cliente"]>;
function useCliente() { return useOutletContext<Cliente | null>(); }

/** Área móvil basada en los cuatro frames usuario de vistas/, con consultas al núcleo. */
export function LayoutUsuario() {
  const { pathname } = useLocation();
  const esLista = pathname === "/usuario" || pathname === "/usuario/";
  const { sesion, fechaCorte } = useSesion();
  const [intento, setIntento] = useState(0);
  const [estado, setEstado] = useState<EstadoConsulta<z.infer<typeof usuarioSchema>>>({ tipo: "cargando" });
  useEffect(() => {
    if (esLista || sesion?.perfil !== "USUARIO" || !fechaCorte) return;
    let vigente = true;
    setEstado({ tipo: "cargando" });
    http("GET", `/usuario?fechaCorte=${encodeURIComponent(fechaCorte)}`).then(r => {
      const datos = usuarioSchema.parse(r.json);
      if (vigente) setEstado({ tipo: "listo", datos });
    }).catch((error: unknown) => { if (vigente) setEstado({ tipo: "error", error }); });
    return () => { vigente = false; };
  }, [esLista, sesion?.perfil, fechaCorte, intento]);
  return <div className="min-h-svh bg-superficie font-gerencia">
    <div className="mx-auto flex min-h-svh max-w-[390px] flex-col">
      <div className="bg-tinta px-4 py-3"><BarraSesion oscura /></div>
      {sesion?.perfil !== "USUARIO" ? <div className="p-5">Selecciona el perfil Usuario en la barra superior para consultar tu crédito.</div>
        : esLista ? <Outlet /> : <SegunEstado estado={estado} onReintentar={() => setIntento(i => i + 1)}>{({ cliente }) => <>
          <Link to="/usuario" className="border-b border-linea bg-white px-4 py-3 text-sm font-bold underline">Cambiar de usuario</Link>
          <div className="flex-1"><Outlet context={cliente} /></div>
          <nav aria-label="Usuario" className="sticky bottom-0 grid grid-cols-3 border-t border-linea bg-white p-3 text-center text-sm font-bold">
            <NavLink to="/usuario/inicio" end className={({ isActive }) => isActive ? "border-b-2 border-acento py-2" : "py-2"}>Inicio</NavLink>
            <NavLink to={cliente?.creditos[0] ? `/usuario/creditos/${cliente.creditos[0].creditoId}` : "/usuario"} className="py-2">Mi crédito</NavLink>
            <NavLink to="/usuario/ayuda" className={({ isActive }) => isActive ? "border-b-2 border-acento py-2" : "py-2"}>Ayuda</NavLink>
          </nav>
        </>}</SegunEstado>}
    </div>
  </div>;
}

const listaSchema = z.object({ pagina: z.number(), totalPaginas: z.number(), total: z.number(), usuarios: z.array(z.object({
  clienteId: z.string(), nombreCompleto: z.string(), municipio: z.string(), cantidadCreditos: z.number(),
})) });

export function ListaUsuarios() {
  const { fechaCorte } = useSesion();
  const [consulta, setConsulta] = useSearchParams();
  const valorPagina = Number(consulta.get("pagina") ?? 1);
  const pagina = Number.isSafeInteger(valorPagina) && valorPagina > 0 ? valorPagina : 1;
  const [estado, setEstado] = useState<EstadoConsulta<z.infer<typeof listaSchema>>>({ tipo: "cargando" });
  const [intento, setIntento] = useState(0);
  const [error, setError] = useState<unknown>(null);
  const [ocupado, setOcupado] = useState(false);
  const navegar = useNavigate();
  useEffect(() => {
    let vigente = true;
    setEstado({ tipo: "cargando" });
    http("GET", `/usuarios?fechaCorte=${encodeURIComponent(fechaCorte)}&pagina=${pagina}`).then(r => {
      const datos = listaSchema.parse(r.json);
      if (vigente) setEstado({ tipo: "listo", datos });
    }).catch((e: unknown) => { if (vigente) setEstado({ tipo: "error", error: e }); });
    return () => { vigente = false; };
  }, [pagina, fechaCorte, intento]);
  const elegir = async (clienteId: string) => {
    setOcupado(true); setError(null);
    try {
      await http("POST", "/usuario/seleccion", { clienteId, fechaCorte });
      navegar("/usuario/inicio");
    } catch (e) { setError(e); } finally { setOcupado(false); }
  };
  return <><EncabezadoAsesor titulo="Usuarios" antetitulo="Selecciona un perfil" />
    <main className="flex flex-col gap-4 p-4">
      <p className="text-sm text-tenue">Selecciona una persona para ver su crédito y sus cuotas.</p>
      {error !== null && <MensajeError error={error} />}
      <SegunEstado estado={estado} onReintentar={() => setIntento(i => i + 1)}>{datos => <>
        {datos.usuarios.length === 0 ? <Vacio titulo="Sin usuarios disponibles" /> : <ul className="flex flex-col gap-3" aria-label="Usuarios">
          {datos.usuarios.map(u => <li key={u.clienteId}><button type="button" disabled={ocupado} onClick={() => void elegir(u.clienteId)}
            className="tarjeta w-full p-4 text-left hover:border-sutil disabled:opacity-50">
            <span className="block font-bold">{u.nombreCompleto}</span>
            <span className="block text-sm text-tenue">{u.clienteId} · {u.municipio}</span>
            <span className="mt-1 block text-xs">{u.cantidadCreditos} crédito(s)</span>
          </button></li>)}
        </ul>}
        <nav aria-label="Paginación de usuarios" className="flex items-center justify-between gap-2">
          <Boton variante="secundario" disabled={ocupado || datos.pagina <= 1} onClick={() => setConsulta({ pagina: String(datos.pagina - 1) })}>Anterior</Boton>
          <span className="text-center text-xs" aria-live="polite">Página {datos.pagina} de {datos.totalPaginas}<br />{datos.total} usuarios</span>
          <Boton variante="secundario" disabled={ocupado || datos.pagina >= datos.totalPaginas} onClick={() => setConsulta({ pagina: String(datos.pagina + 1) })}>Siguiente</Boton>
        </nav>
      </>}</SegunEstado>
    </main></>;
}

export function InicioUsuario() {
  const cliente = useCliente();
  if (!cliente) return <div className="p-4"><Vacio titulo="Selecciona un usuario"><Link to="/usuario" className="underline">Ir a la lista de usuarios</Link></Vacio></div>;
  return <><EncabezadoAsesor titulo={cliente.nombreCompleto} antetitulo="Bienvenido/a" />
    <main className="flex flex-col gap-4 p-4">{cliente.creditos.length === 0 && <Vacio titulo="Sin créditos disponibles" />}{cliente.creditos.map(c => <InicioCredito key={c.creditoId} creditoId={c.creditoId} />)}</main></>;
}

function InicioCredito({ creditoId }: { readonly creditoId: string }) {
  const { fechaCorte } = useSesion();
  const consulta = useConsulta("consultarFichaCredito", { creditoId, fechaCorte });
  return <SegunEstado estado={consulta.estado} onReintentar={consulta.recargar}>{f => {
    const r = f.resumen;
    return <>
      <FranjaSituacion resumen={r} />
      <Tarjeta titulo="Capital pendiente"><p className="text-4xl font-extrabold"><Dinero valor={r.saldoCapital} /></p>
        <p className="mt-2 text-sm text-tenue">Capital original: <Dinero valor={f.capitalOriginal} /></p>
        <Link className="mt-3 block font-bold underline" to={`/usuario/creditos/${creditoId}`}>Ver mi crédito · {creditoId}</Link>
      </Tarjeta>
      <Tarjeta titulo="Próxima cuota">{r.proximaCuota ? <>
        <p className="text-2xl font-bold"><Dinero valor={r.proximaCuota.importe} /></p>
        <p className="mt-2 text-sm">Vencimiento: {formatearFecha(r.proximaCuota.fechaVencimiento)}</p>
      </> : <p>Sin cuotas pendientes.</p>}</Tarjeta>
      <Tarjeta titulo="Tu avance">
        <progress className="w-full accent-slate-900" value={r.cuotasPagadas} max={f.plazoMeses} aria-label="Cuotas pagadas" />
        <ol className="mt-3 flex flex-wrap gap-2" aria-label="Estado de las cuotas">{Array.from({ length: f.plazoMeses }, (_, i) => {
          const estado = i < r.cuotasPagadas ? "pagada" : i < r.cuotasPagadas + r.cuotasVencidas ? "vencida" : "pendiente";
          return <li key={i} aria-label={`Cuota ${i + 1} ${estado}`} className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${estado === "pagada" ? "bg-tinta text-white" : estado === "vencida" ? "bg-orange-100 text-orange-900" : "bg-superficie text-tenue"}`}>{i + 1}</li>;
        })}</ol>
        <p className="mt-3 text-sm">{r.cuotasPagadas} de {f.plazoMeses} cuotas pagadas · {r.cuotasVencidas} vencidas</p>
      </Tarjeta>
    </>;
  }}</SegunEstado>;
}

export function DetalleUsuario() {
  const { creditoId = "" } = useParams();
  const { fechaCorte } = useSesion();
  const ficha = useConsulta("consultarFichaCredito", { creditoId, fechaCorte });
  const pagos = useConsulta("listarPagos", { creditoId, fechaCorte });
  return <><EncabezadoAsesor titulo="Detalle del crédito" regresar="/usuario/inicio" />
    <main className="flex flex-col gap-4 p-4">
      <SegunEstado estado={ficha.estado} onReintentar={ficha.recargar}>{f => <>
        <Tarjeta titulo={creditoId}><dl>
          <FilaDato etiqueta="Capital original"><Dinero valor={f.capitalOriginal} /></FilaDato>
          <FilaDato etiqueta="Capital pendiente"><Dinero valor={f.resumen.saldoCapital} /></FilaDato>
          <FilaDato etiqueta="Cuotas pagadas">{f.resumen.cuotasPagadas} de {f.plazoMeses}</FilaDato>
          <FilaDato etiqueta="Tasa nominal anual">{tasaComoPorcentaje(f.tasaNominalAnual)} %</FilaDato>
        </dl></Tarjeta>
        <FranjaSituacion resumen={f.resumen} />
      </>}</SegunEstado>
      <Tarjeta titulo="Historial de pagos"><SegunEstado estado={pagos.estado} onReintentar={pagos.recargar}>{p => p.pagos.length ?
        <ul className="divide-y divide-linea">{p.pagos.map(pg => <li key={pg.pagoId} className="flex items-center justify-between gap-2 py-3 text-sm">
          <span>Cuota {pg.numeroCuota}<span className="block text-tenue">{formatearFecha(pg.fechaPago)}</span></span><Dinero valor={pg.importe} />
        </li>)}</ul> : <Vacio titulo="Sin pagos al corte" />}</SegunEstado></Tarjeta>
      <Link to={`/usuario/creditos/${creditoId}/plan`} className="rounded-xl bg-tinta p-4 text-center font-bold text-white">Ver plan completo de cuotas</Link>
    </main></>;
}

export function PlanUsuario() {
  const { creditoId = "" } = useParams();
  const { fechaCorte } = useSesion();
  const plan = useConsulta("consultarPlan", { creditoId, fechaCorte });
  const ficha = useConsulta("consultarFichaCredito", { creditoId, fechaCorte });
  return <><EncabezadoAsesor titulo="Plan de cuotas" regresar={`/usuario/creditos/${creditoId}`} />
    <main className="flex flex-col gap-4 p-4">
      <SegunEstado estado={ficha.estado} onReintentar={ficha.recargar}>{f => <>
        <Tarjeta><p>Capital: <Dinero valor={f.capitalOriginal} /></p><p>Cuotas: {f.plazoMeses} · TNA: {tasaComoPorcentaje(f.tasaNominalAnual)} %</p></Tarjeta>
        <SegunEstado estado={plan.estado} onReintentar={plan.recargar}>{p => <div className="tarjeta overflow-x-auto">
          <table className="w-full text-xs"><caption className="p-3 text-left">Cuotas contractuales · corte {formatearFecha(fechaCorte)}</caption>
            <thead className="bg-tinta text-white"><tr>{["#", "Fecha", "Cuota", "Saldo"].map(t => <th key={t} className="p-2">{t}</th>)}</tr></thead>
            <tbody>{p.cuotas.map((q, i) => <tr key={q.numero} className={i < f.resumen.cuotasPagadas ? "bg-green-50" : i < f.resumen.cuotasPagadas + f.resumen.cuotasVencidas ? "bg-orange-50" : ""}>
              <td className="p-2">{q.numero}<span className="solo-lectores">{i < f.resumen.cuotasPagadas ? " pagada" : i < f.resumen.cuotasPagadas + f.resumen.cuotasVencidas ? " vencida" : " pendiente"}</span></td>
              <td className="p-2">{formatearFecha(q.fechaVencimiento)}</td><td className="p-2"><Dinero valor={q.importe} /></td><td className="p-2"><Dinero valor={q.saldoPosterior} /></td>
            </tr>)}</tbody></table>
          <p className="p-3 text-xs text-tenue">Verde: pagada. Naranja: vencida. El saldo es el contractual después de cada cuota.</p>
        </div>}</SegunEstado>
      </>}</SegunEstado>
    </main></>;
}

const PREGUNTAS = [
  ["¿Qué es un crédito?", "Es dinero prestado que se devuelve mediante cuotas, según las condiciones acordadas. Consulta tu capital, tasa y calendario en Mi crédito."],
  ["¿Qué es una mora y por qué se produce?", "Es el atraso de una cuota que no se pagó en su fecha de vencimiento. Puede generar intereses moratorios conforme a la política del crédito."],
  ["¿Por qué sube el cargo si llevo más de un mes atrasado?", "La política aplicable puede tener distintos tramos de atraso. Los días y las condiciones de tu crédito determinan el cargo; consulta a tu asesor para obtener el desglose."],
  ["¿Cómo se calcula lo que debo de más por atraso?", "Depende del capital vencido, los días de atraso y la política aplicable. El capital pendiente que ves en Inicio no incluye por sí solo todos los cargos exigibles."],
  ["¿Qué pasa si no pago?", "El crédito continúa en atraso y puede cambiar de estado según las condiciones y políticas aplicables. Habla con tu asesor para revisar tu situación."],
  ["¿A dónde llamo si tengo dudas?", "Contacta a tu asesor mediante el canal que te proporcionó Crédito Vecino. El teléfono del prototipo es un ejemplo y no se utiliza como contacto real."],
] as const;
export function AyudaUsuario() {
  return <><EncabezadoAsesor titulo="Ayuda" regresar="/usuario/inicio" /><main className="flex flex-col gap-4 p-4">
    <h2 className="text-lg font-bold">Preguntas frecuentes</h2>
    {PREGUNTAS.map(([pregunta, respuesta]) => <details key={pregunta} className="tarjeta p-4"><summary className="cursor-pointer font-bold">{pregunta}</summary><p className="mt-3 text-sm text-tenue">{respuesta}</p></details>)}
    <Tarjeta titulo="¿Todavía tienes dudas?"><p>Tu asesor puede explicarte las cuotas y los cargos de tu crédito.</p></Tarjeta>
  </main></>;
}
