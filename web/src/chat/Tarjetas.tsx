import { useState, type ReactNode } from "react";
import type { MensajeChat, TarjetaHerramienta } from "@contratos/chat";
import type { SalidaFinal } from "@contratos/proyecto-final";
import { operar } from "../api/cliente";
import { Boton, Dinero, FilaDato, InsigniaEstado } from "../componentes/Basicos";
import { DesgloseDeuda, Prelacion } from "../componentes/Credito";
import { MensajeError } from "../componentes/Estados";
import { formatearFecha } from "../formato";

type Propuesta = SalidaFinal<"proponerPago">;
const esDinero = (v: unknown): v is { importe: string; moneda: string } =>
  v !== null && typeof v === "object" && typeof (v as { importe?: unknown }).importe === "string" && typeof (v as { moneda?: unknown }).moneda === "string";
const etiqueta = (k: string) => k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
const MAX_FILAS = 25;

/** Presenta un resultado del núcleo tal cual: importes con su formato exacto, sin cálculos. */
export function VistaDatos({ valor, nivel = 0 }: { readonly valor: unknown; readonly nivel?: number }): ReactNode {
  if (esDinero(valor)) return <Dinero valor={valor} />;
  if (valor === null || valor === undefined) return <span className="text-tenue">—</span>;
  if (typeof valor !== "object") return <span className={typeof valor === "number" ? "cifra" : ""}>{String(valor)}</span>;
  if (Array.isArray(valor)) {
    if (valor.length === 0) return <span className="text-tenue">(vacío)</span>;
    if (valor.every((v) => v !== null && typeof v === "object" && !Array.isArray(v) && !esDinero(v))) {
      const columnas = [...new Set(valor.flatMap((v) => Object.keys(v as object)))];
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-left text-tenue">{columnas.map((c) => <th key={c} className="py-1 pr-3">{etiqueta(c)}</th>)}</tr></thead>
            <tbody>{valor.slice(0, MAX_FILAS).map((fila, i) => (
              <tr key={i} className="border-t border-linea align-top">{columnas.map((c) => (
                <td key={c} className="py-1 pr-3"><VistaDatos valor={(fila as Record<string, unknown>)[c]} nivel={nivel + 1} /></td>))}</tr>))}</tbody>
          </table>
          {valor.length > MAX_FILAS && <p className="mt-1 text-xs text-tenue">Se muestran {MAX_FILAS} de {valor.length} filas (datos completos en la herramienta).</p>}
        </div>
      );
    }
    return <span>{valor.map((v, i) => <span key={i}>{i > 0 && ", "}<VistaDatos valor={v} nivel={nivel + 1} /></span>)}</span>;
  }
  return (
    <dl className={nivel > 0 ? "pl-3" : "divide-y divide-linea"}>
      {Object.entries(valor as Record<string, unknown>).map(([k, v]) => (
        <div key={k} className="flex flex-wrap items-baseline justify-between gap-x-3 py-1">
          <dt className="text-xs text-tenue">{etiqueta(k)}</dt><dd className="text-sm"><VistaDatos valor={v} nivel={nivel + 1} /></dd>
        </div>))}
    </dl>
  );
}

export function TarjetaDeHerramienta({ tarjeta }: { readonly tarjeta: TarjetaHerramienta }) {
  const ok = tarjeta.estado === "OK";
  const resultado = tarjeta.resultado as Record<string, unknown> | null;
  return (
    <details open={ok && tarjeta.origen === "MCP" && tarjeta.herramienta !== "proponer_pago"} className={`rounded-xl border bg-white text-sm ${ok ? "border-linea" : "border-red-300"}`}>
      <summary className="flex cursor-pointer flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2">
        <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${tarjeta.origen === "MCP" ? "bg-tinta text-white" : "bg-indigo-700 text-white"}`}>
          {tarjeta.origen === "MCP" ? "Núcleo vía MCP" : "Políticas vía RAG"}</span>
        <span className="cifra font-semibold">{tarjeta.herramienta}</span>
        {tarjeta.fechaCorte && <span className="text-xs text-tenue">corte <span className="cifra">{tarjeta.fechaCorte}</span></span>}
        <span className={`text-xs font-bold ${ok ? "text-exito-oscuro" : "text-peligro"}`}>{ok ? "correcta" : "con error"}</span>
        <span className="cifra ml-auto text-xs text-tenue">{(tarjeta.duracionMs / 1000).toFixed(1)} s</span>
      </summary>
      <div className="border-t border-linea px-3 py-2">
        <p className="mb-1 text-xs text-tenue">Argumentos: <span className="cifra break-all">{JSON.stringify(tarjeta.argumentos)}</span></p>
        {!ok ? <p className="text-sm text-red-900"><span className="cifra font-bold">{String(resultado?.["errorCode"] ?? "ERROR")}</span> · {String(resultado?.["detail"] ?? "")}
          {esDinero(resultado?.["montoCorrecto"]) && <> · monto correcto <Dinero valor={resultado["montoCorrecto"] as { importe: string; moneda: string }} /></>}</p>
          : tarjeta.origen === "RAG" ? <p className="text-xs text-tenue">La respuesta citada del RAG aparece en el mensaje del asistente.</p>
          : <VistaDatos valor={tarjeta.resultado} />}
      </div>
    </details>
  );
}

const PATRON_CITA = /\[([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)\s*§\s*([^\]]+)\]/g;
/** Texto del asistente con las citas como referencias legibles. */
export function TextoConCitas({ texto }: { readonly texto: string }) {
  const partes: ReactNode[] = [];
  let ultimo = 0;
  for (const m of texto.matchAll(PATRON_CITA)) {
    partes.push(texto.slice(ultimo, m.index));
    partes.push(<cite key={m.index} className="mx-0.5 inline-block rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-semibold text-indigo-900 not-italic">
      {m[1]} § {m[2]}</cite>);
    ultimo = (m.index ?? 0) + m[0].length;
  }
  partes.push(texto.slice(ultimo));
  return <p className="whitespace-pre-wrap">{partes}</p>;
}

/** Propuesta de pago del asistente: no tiene efecto hasta pulsar Aprobar (confirmación con evento humano e Idempotency-Key). */
export type ResultadoPropuesta = { readonly tipo: "aprobada"; readonly pagoId: string; readonly repetido: boolean } | { readonly tipo: "cancelada" };
export function TarjetaPropuesta({ propuesta, pendiente, resultado, onResuelta }: { readonly propuesta: Propuesta; readonly pendiente: boolean;
  /** Resultado guardado por el chat: sobrevive a nuevos renderizados de la conversación. */
  readonly resultado: ResultadoPropuesta | undefined;
  readonly onResuelta: (resultado: ResultadoPropuesta) => Promise<void> }) {
  const estado = resultado ?? { tipo: "pendiente" as const };
  const [error, setError] = useState<unknown>(null);
  const [ocupado, setOcupado] = useState(false);
  const aprobar = async () => {
    setOcupado(true); setError(null);
    try {
      const r = await operar("confirmarPago", { propuestaId: propuesta.propuestaId, fechaOperacion: propuesta.fechaCorte, versionCredito: propuesta.versionCredito },
        { claveIdempotencia: propuesta.claveIdempotencia });
      await onResuelta({ tipo: "aprobada", pagoId: r.datos.pago.pagoId, repetido: r.repetido });
    } catch (e) { setError(e); } finally { setOcupado(false); }
  };
  const cancelar = async () => {
    setOcupado(true); setError(null);
    try {
      await operar("cancelarPropuesta", { propuestaId: propuesta.propuestaId, fechaOperacion: propuesta.fechaCorte });
      await onResuelta({ tipo: "cancelada" });
    } catch (e) { setError(e); } finally { setOcupado(false); }
  };
  const resuelta = estado.tipo !== "pendiente" || !pendiente;
  return (
    <section aria-label={`Propuesta de pago ${propuesta.propuestaId}`} className="rounded-2xl border-2 border-acento bg-white p-4 text-sm">
      <p className="etiqueta-seccion">Propuesta de pago del asistente (sin efecto financiero)</p>
      <dl className="mt-2 divide-y divide-linea">
        <FilaDato etiqueta="Crédito / cuota"><span className="cifra">{propuesta.creditoId}</span> · cuota {propuesta.numeroCuota}</FilaDato>
        <FilaDato etiqueta="Monto exacto"><Dinero valor={propuesta.monto} className="font-bold" /></FilaDato>
        <FilaDato etiqueta="Fecha de pago">{formatearFecha(propuesta.fechaCorte)}</FilaDato>
        <FilaDato etiqueta="Estado previsto"><InsigniaEstado estado={propuesta.estadoPrevisto} /></FilaDato>
        <FilaDato etiqueta="Clave de idempotencia"><span className="cifra text-xs break-all">{propuesta.claveIdempotencia}</span></FilaDato>
        <FilaDato etiqueta="Propuesta"><span className="cifra text-xs break-all">{propuesta.propuestaId}</span></FilaDato>
      </dl>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div><p className="etiqueta-seccion mb-1">Deuda exigible</p><DesgloseDeuda deuda={propuesta.deuda} /></div>
        <Prelacion aplicacion={propuesta.aplicacionPrevista} />
      </div>
      {error !== null && <div className="mt-3"><MensajeError error={error} /></div>}
      {estado.tipo === "aprobada" && <p role="status" className="mt-3 rounded-xl bg-green-50 p-3 font-semibold text-exito-oscuro">
        {estado.repetido ? "Reintento sin efecto adicional" : "Pago aplicado"} · <span className="cifra">{estado.pagoId}</span></p>}
      {estado.tipo === "cancelada" && <p role="status" className="mt-3 rounded-xl bg-slate-100 p-3 font-semibold">Propuesta cancelada; no se registró ningún pago.</p>}
      {!resuelta && <>
        <p className="mt-3 text-xs text-tenue">Solo estos botones resuelven la propuesta. Un mensaje en el chat no la aprueba.</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Boton variante="secundario" disabled={ocupado} onClick={() => void cancelar()}>Cancelar</Boton>
          <Boton variante="exito" disabled={ocupado} onClick={() => void aprobar()}>Aprobar</Boton>
        </div>
      </>}
      {resuelta && estado.tipo === "pendiente" && <p className="mt-3 text-xs text-tenue">Propuesta ya resuelta.</p>}
    </section>
  );
}

export function OrigenMensaje({ mensaje }: { readonly mensaje: MensajeChat }) {
  const mcp = [...new Set(mensaje.herramientas.filter((t) => t.origen === "MCP" && t.estado === "OK").map((t) => t.herramienta))];
  const cortes = [...new Set(mensaje.herramientas.map((t) => t.fechaCorte).filter((f): f is string => f !== null))];
  return (
    <p className="text-xs text-tenue">
      Ruta <strong>{mensaje.ruta ?? "—"}</strong>
      {mcp.length > 0 && <> · cifras de <span className="cifra">{mcp.join(", ")}</span></>}
      {cortes.length > 0 && <> · corte <span className="cifra">{cortes.join(", ")}</span></>}
      {mensaje.duracionMs !== null && <> · <span className="cifra">{(mensaje.duracionMs / 1000).toFixed(1)} s</span></>}
      {mensaje.cifrasVerificadas ? " · cifras verificadas contra las herramientas" : " · redacción oculta: cifras sin respaldo"}
    </p>
  );
}
