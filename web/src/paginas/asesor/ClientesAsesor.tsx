import { useDeferredValue, useState } from "react";
import { Link } from "react-router";
import buscar from "../../assets/design/iconos/buscar.svg";
import chevron from "../../assets/design/iconos/chevron.svg";
import mas from "../../assets/design/iconos/mas.svg";
import nuevoCliente from "../../assets/design/iconos/nuevo-cliente.svg";
import { Dinero, Icono, InsigniaTramo, OrigenDatos } from "../../componentes/Basicos";
import { SegunEstado, Vacio } from "../../componentes/Estados";
import { EncabezadoAsesor } from "../../componentes/Layouts";
import { iniciales, nombreEstado } from "../../formato";
import { useConsulta } from "../../hooks/useConsulta";
import { useSesion } from "../../sesion/SesionContexto";

const COLOR_AVATAR: Readonly<Record<string, string>> = {
  SIN_MORA: "bg-tramo-al-dia", MORA_1: "bg-tramo-mora-1", MORA_2: "bg-tramo-mora-2", MORA_3: "bg-tramo-mora-3",
  VENCIDO: "bg-tramo-vencido", INCOBRABLE: "bg-tramo-incobrable",
};

/** Mis clientes (frames 11:196, 11:393 y 17:4042): búsqueda y orden sobre datos de la API. */
export function ClientesAsesor() {
  const { fechaCorte } = useSesion();
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<"prioridad" | "nombre">("prioridad");
  const buscado = useDeferredValue(busqueda.trim());
  const { estado, recargar } = useConsulta("listarClientes", { fechaCorte, ...(buscado ? { busqueda: buscado } : {}) });

  return (
    <>
      <EncabezadoAsesor titulo="Mis clientes">
        <label className="mt-4 flex items-center gap-2 rounded-xl bg-nav-activo px-3 py-2.5">
          <Icono src={buscar} className="h-4 w-4" />
          <span className="solo-lectores">Buscar cliente, municipio o crédito</span>
          <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar cliente, municipio o crédito…"
            className="w-full bg-transparent text-sm text-white placeholder:text-etiqueta focus:outline-none" />
        </label>
      </EncabezadoAsesor>
      <main className="flex flex-1 flex-col gap-3 p-4">
        <div role="group" aria-label="Orden" className="inline-flex w-fit rounded-xl bg-linea p-1 text-sm">
          {([["prioridad", "Prioridad"], ["nombre", "Nombre A-Z"]] as const).map(([valor, texto]) => (
            <button key={valor} type="button" aria-pressed={orden === valor} onClick={() => setOrden(valor)}
              className={`rounded-lg px-3 py-1.5 font-semibold ${orden === valor ? "bg-white text-tinta shadow-sm" : "text-tenue"}`}>{texto}</button>
          ))}
        </div>
        <SegunEstado estado={estado} onReintentar={recargar}>{(datos) => {
          type Fila = { readonly cliente: (typeof datos.clientes)[number]; readonly credito: (typeof datos.clientes)[number]["creditos"][number] | null };
          const filas = datos.clientes.flatMap((c): Fila[] => c.creditos.length === 0 ? [{ cliente: c, credito: null }]
            : c.creditos.map((credito) => ({ cliente: c, credito })));
          // Orden de presentación sobre días de atraso ya calculados por el núcleo.
          const ordenadas = orden === "nombre" ? filas : [...filas].sort((a, b) => (b.credito?.diasAtraso ?? -1) - (a.credito?.diasAtraso ?? -1));
          if (ordenadas.length === 0) return <Vacio titulo="Sin coincidencias">Pruebe con otro nombre, municipio o número de crédito.</Vacio>;
          return (
            <ul className="flex flex-col gap-3" aria-label="Clientes">
              {ordenadas.map(({ cliente, credito }) => (
                <li key={credito?.creditoId ?? cliente.clienteId}>
                  <Link to={credito ? `/asesor/creditos/${credito.creditoId}` : `/asesor/creditos/nuevo?clienteId=${cliente.clienteId}`}
                    className="tarjeta flex items-center gap-3 p-4 hover:border-sutil">
                    <span aria-hidden="true" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-bold text-white ${COLOR_AVATAR[credito?.tramo ?? ""] ?? "bg-secundario"}`}>
                      {iniciales(cliente.nombreCompleto)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{cliente.nombreCompleto}</span>
                      <span className="block truncate text-sm text-tenue">{cliente.municipio} · <span className="cifra">{credito?.creditoId ?? cliente.clienteId}</span></span>
                      {credito ? <Dinero valor={credito.saldoCapital} className="text-sm" /> : <span className="text-sm text-tenue">Sin créditos · solicitar</span>}
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      {credito && (credito.estado === "INCOBRABLE" || credito.estado === "VIGENTE" || credito.estado === "EN_MORA" || credito.estado === "REESTRUCTURADO"
                        ? <InsigniaTramo tramo={credito.estado === "REESTRUCTURADO" && credito.diasAtraso === 0 ? "REESTRUCTURADO" : credito.tramo} />
                        : <span className="text-xs font-bold text-tenue">{nombreEstado(credito.estado)}</span>)}
                      {credito && credito.diasAtraso > 0 && <span className="cifra text-xs text-tenue">{credito.diasAtraso} d</span>}
                    </span>
                    <Icono src={chevron} className="h-4 w-4" />
                  </Link>
                </li>
              ))}
            </ul>
          );
        }}</SegunEstado>
        <OrigenDatos fechaCorte={fechaCorte} operacion="listarClientes" />
        <div className="sticky bottom-3 mt-auto flex items-center justify-between gap-3 pt-2">
          <Link to="/asesor/creditos/nuevo" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-tinta bg-white px-4 text-sm font-bold">
            <Icono src={nuevoCliente} className="h-4 w-4" /> Nuevo cliente</Link>
          <Link to="/asesor/creditos/nuevo" aria-label="Solicitar crédito" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-acento shadow-lg">
            <Icono src={mas} className="h-6 w-6" /></Link>
        </div>
      </main>
    </>
  );
}
