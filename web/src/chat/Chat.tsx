import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { EstadoChat } from "@contratos/chat";
import { SinConexion, operar } from "../api/cliente";
import { Boton } from "../componentes/Basicos";
import { AvisoSinConexion, Cargando, MensajeError } from "../componentes/Estados";
import { useSesion } from "../sesion/SesionContexto";
import { chatApi } from "./api";
import { OrigenMensaje, TarjetaDeHerramienta, TarjetaPropuesta, TextoConCitas, type ResultadoPropuesta } from "./Tarjetas";

const SUGERENCIAS = [
  "¿Cuál es la cartera activa, en mora, en riesgo por tramo e incobrable del mes al corte?",
  "¿Cuál es el cierre mensual de octubre de 2026 por concepto?",
  "¿Cuál es el cierre diario del 2026-10-31?",
  "¿Qué créditos están en Mora 3, con días de atraso y saldo?",
  "¿Cuál es el estado de CV-2026-0030 y cómo se formó la mora de su cuota 3?",
  "¿Cuántas cuotas y por qué monto vencen en los próximos 7 y 30 días?",
  "Explica tramo por tramo la mora de la cuota 2 de CV-2026-0410 al 2027-01-24.",
  "¿Cómo se calcula la mora de un crédito otorgado en agosto de 2026? Cita la política vigente.",
] as const;

/** Chat gerencial integrado (fase 6): orquesta MCP y RAG en el servidor; cifras con origen y corte visibles. */
export function Chat() {
  const { fechaCorte } = useSesion();
  const [estado, setEstado] = useState<EstadoChat | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState<string | null>(null);
  const [segundos, setSegundos] = useState(0);
  const [error, setError] = useState<unknown>(null);
  const [resultados, setResultados] = useState<ReadonlyMap<string, ResultadoPropuesta>>(new Map());
  const final = useRef<HTMLDivElement>(null);

  const cargar = useCallback(() => { chatApi.estado().then(setEstado, setError); }, []);
  useEffect(cargar, [cargar]);
  useEffect(() => {
    if (enviando === null) return;
    setSegundos(0);
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [enviando]);
  useEffect(() => { final.current?.scrollIntoView?.({ block: "end" }); }, [estado?.mensajes.length, enviando]);

  const enviar = async (mensaje: string) => {
    const limpio = mensaje.trim();
    if (!limpio || enviando !== null) return;
    setEnviando(limpio); setError(null); setTexto("");
    try { setEstado(await chatApi.enviar(limpio, fechaCorte)); }
    catch (e) { setError(e); setTexto(limpio); cargar(); }
    finally { setEnviando(null); }
  };
  const alEnviar = (e: FormEvent) => { e.preventDefault(); void enviar(texto); };
  const alTeclear = (e: KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void enviar(texto); } };
  const resolver = async (propuestaId: string, r: ResultadoPropuesta) => {
    setResultados((m) => new Map(m).set(propuestaId, r));
    setEstado(await chatApi.resolver(propuestaId, r.tipo === "aprobada" ? "CONFIRMADA" : "CANCELADA", r.tipo === "aprobada" ? r.pagoId : undefined));
  };
  const reiniciar = async () => {
    if (estado === null) return;
    setError(null);
    try {
      // Reiniciar invalida las propuestas pendientes: se cancelan con evento humano antes de limpiar la memoria.
      for (const p of estado.pendientes) {
        await operar("cancelarPropuesta", { propuestaId: p.propuestaId, fechaOperacion: p.fechaCorte });
        await chatApi.resolver(p.propuestaId, "CANCELADA");
      }
      setEstado(await chatApi.reiniciar());
      setResultados(new Map());
    } catch (e) { setError(e); cargar(); }
  };

  if (estado === null && error === null) return <Cargando texto="Abriendo el asistente…" />;
  const pendientes = new Set(estado?.pendientes.map((p) => p.propuestaId) ?? []);
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Asistente gerencial</h1>
          <p className="text-sm text-tenue">Corte de la sesión <span className="cifra">{fechaCorte}</span> · memoria de {estado?.turnos ?? 0}/{estado?.maxTurnos ?? 12} turnos
            ({estado?.ttlMinutos ?? 60} min) · {estado?.modelo ?? "modelo local"}</p>
        </div>
        <Boton variante="secundario" disabled={enviando !== null} onClick={() => void reiniciar()}>
          Reiniciar conversación{estado && estado.pendientes.length > 0 ? ` (cancela ${estado.pendientes.length} propuesta${estado.pendientes.length > 1 ? "s" : ""})` : ""}</Boton>
      </div>
      <p className="rounded-xl bg-superficie-suave p-3 text-xs text-secundario">Las cifras salen del núcleo mediante herramientas MCP y se muestran en tarjetas con su
        herramienta y fecha de corte; las políticas salen del corpus con su cita. El asistente puede proponer un pago, pero solo usted lo aprueba o cancela con los botones.</p>

      <div role="log" aria-live="polite" aria-label="Conversación" className="flex flex-col gap-4">
        {estado?.mensajes.length === 0 && enviando === null && (
          <div className="tarjeta p-4">
            <p className="font-bold">Pruebe con una consulta:</p>
            <ul className="mt-2 flex flex-wrap gap-2">{SUGERENCIAS.map((s) => (
              <li key={s}><button type="button" onClick={() => setTexto(s)} className="rounded-full border border-linea px-3 py-1 text-left text-xs hover:bg-superficie-suave">{s}</button></li>))}</ul>
          </div>
        )}
        {estado?.mensajes.map((m) => m.rol === "USUARIO" ? (
          <div key={m.id} className="ml-auto max-w-[85%] rounded-2xl bg-tinta px-4 py-3 text-white"><p className="whitespace-pre-wrap">{m.texto}</p></div>
        ) : (
          <article key={m.id} aria-label="Respuesta del asistente" className="flex flex-col gap-2 rounded-2xl border border-linea bg-white p-4">
            {m.texto && <TextoConCitas texto={m.texto} />}
            {m.aviso && <p role="note" className="rounded-lg bg-aviso-fondo p-2 text-sm text-aviso-texto">{m.aviso}</p>}
            {m.citas.length > 0 && <p className="text-xs text-tenue">Fuentes: {m.citas.map((c) => `${c.documentoId} § ${c.seccion}`).join(" · ")}</p>}
            {m.herramientas.filter((t) => !(t.herramienta === "proponer_pago" && t.estado === "OK")).map((t) => <TarjetaDeHerramienta key={t.id} tarjeta={t} />)}
            {m.propuestas.map((p) => <TarjetaPropuesta key={p.propuestaId} propuesta={p} pendiente={pendientes.has(p.propuestaId)}
              resultado={resultados.get(p.propuestaId)} onResuelta={(r) => resolver(p.propuestaId, r)} />)}
            <OrigenMensaje mensaje={m} />
          </article>
        ))}
        {enviando !== null && <>
          <div className="ml-auto max-w-[85%] rounded-2xl bg-tinta px-4 py-3 text-white opacity-80"><p className="whitespace-pre-wrap">{enviando}</p></div>
          <div role="status" className="flex items-center gap-3 rounded-2xl border border-dashed border-linea p-4 text-sm text-tenue">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-linea border-t-acento" aria-hidden="true" />
            El asistente consulta herramientas y redacta… <span className="cifra">{segundos} s</span>. En CPU una respuesta puede tardar de 1 a 3 minutos.
          </div>
        </>}
        <div ref={final} />
      </div>

      {error instanceof SinConexion ? <AvisoSinConexion detalle="No se pudo contactar al servidor. Su mensaje sigue en el cuadro de texto." />
        : error !== null && <MensajeError error={error} />}
      <form onSubmit={alEnviar} className="sticky bottom-3 flex items-end gap-2 rounded-2xl border border-linea bg-white p-2 shadow-lg">
        <label htmlFor="mensaje-chat" className="solo-lectores">Mensaje para el asistente</label>
        <textarea id="mensaje-chat" rows={2} maxLength={1000} value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={alTeclear}
          placeholder="Escriba su consulta (Enter envía, Mayús+Enter salta de línea)" disabled={enviando !== null}
          className="min-h-12 flex-1 resize-y rounded-xl px-3 py-2 text-sm focus:outline-none" />
        <Boton type="submit" disabled={enviando !== null || !texto.trim()}>Enviar</Boton>
      </form>
    </div>
  );
}
