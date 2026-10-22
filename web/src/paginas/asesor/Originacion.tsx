import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import type { z } from "zod";
import { altaClienteFinalSchema, originarCreditoSchema, type EntradaFinal, type SalidaFinal } from "@contratos/proyecto-final";
import { operar } from "../../api/cliente";
import { Boton, Campo, Dinero, FilaDato, InsigniaEstado, OrigenDatos, Selector, Tarjeta } from "../../componentes/Basicos";
import { MensajeError, SegunEstado } from "../../componentes/Estados";
import { EncabezadoAsesor, Pasos } from "../../componentes/Layouts";
import { formatearFecha, normalizarImporte, porcentajeComoTasa, tasaComoPorcentaje } from "../../formato";
import { useConsulta } from "../../hooks/useConsulta";
import { useSesion } from "../../sesion/SesionContexto";

const PASOS = ["Cliente", "Solicitud", "Simulación", "Confirmación", "Comité", "Desembolso"] as const;
type Resumen = SalidaFinal<"consultarCredito">;
type Errores = Readonly<Record<string, string>>;
const erroresDe = (issues: readonly z.core.$ZodIssue[], alias: Readonly<Record<string, string>> = {}): Errores =>
  Object.fromEntries(issues.map((i) => { const campo = String(i.path[0] ?? "general"); return [alias[campo] ?? campo, i.message]; }));

/** Pantalla obligatoria 1: solicitud de crédito con alta del cliente como primer paso (frames 85:873–15:3021). */
export function Originacion() {
  const { fechaCorte, sesion } = useSesion();
  const [parametros] = useSearchParams();
  const [paso, setPaso] = useState(0);
  const [cliente, setCliente] = useState<{ readonly clienteId: string; readonly nombre: string } | null>(null);
  const [solicitud, setSolicitud] = useState<EntradaFinal<"solicitarCredito"> | null>(null);
  const [plan, setPlan] = useState<SalidaFinal<"simularPlan"> | null>(null);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [ocupado, setOcupado] = useState(false);

  // Reanudar una solicitud registrada (desde el detalle del crédito o Solicitudes de gerencia).
  const reanudar = parametros.get("creditoId");
  useEffect(() => {
    if (!reanudar) return;
    operar("consultarFichaCredito", { creditoId: reanudar, fechaCorte }).then(({ datos }) => {
      setCliente({ clienteId: datos.clienteId, nombre: datos.nombreCliente });
      setResumen(datos.resumen);
      setPaso(datos.resumen.estado === "SOLICITADO" ? 4 : 5);
    }, setError);
  }, [reanudar, fechaCorte]);

  async function ejecutar<T>(accion: () => Promise<T>, siguiente: (r: T) => void) {
    setOcupado(true); setError(null);
    try { siguiente(await accion()); } catch (e) { setError(e); } finally { setOcupado(false); }
  }

  return (
    <>
      <EncabezadoAsesor titulo="Solicitud de crédito" antetitulo={`Paso ${paso + 1} de ${PASOS.length} · ${PASOS[paso]}`} regresar="/asesor/clientes">
        <div className="mt-4"><Pasos pasos={PASOS} actual={paso} /></div>
      </EncabezadoAsesor>
      <main className="flex flex-col gap-3 p-4">
        {cliente && <p className="text-sm text-tenue">Cliente: <strong className="text-tinta">{cliente.nombre}</strong> · <span className="cifra">{cliente.clienteId}</span></p>}
        {paso === 0 && <PasoCliente fechaCorte={fechaCorte} inicial={parametros.get("clienteId") ?? ""} ocupado={ocupado}
          onListo={(c) => { setCliente(c); setPaso(1); }} ejecutar={ejecutar} />}
        {paso === 1 && cliente && <PasoSolicitud fechaCorte={fechaCorte} clienteId={cliente.clienteId} previa={solicitud} ocupado={ocupado}
          onSimular={(s) => void ejecutar(() => operar("simularPlan", { monto: s.monto, plazoMeses: s.plazoMeses,
            tasaNominalAnual: s.tasaNominalAnual, fechaDesembolso: fechaCorte }), (r) => { setSolicitud(s); setPlan(r.datos); setPaso(2); })} />}
        {paso === 2 && plan && solicitud && <PasoSimulacion plan={plan} solicitud={solicitud} onModificar={() => setPaso(1)} onConfirmar={() => setPaso(3)} />}
        {paso === 3 && solicitud && plan && (
          <Tarjeta titulo="Confirmar solicitud">
            <dl className="divide-y divide-linea">
              <FilaDato etiqueta="Crédito"><span className="cifra">{solicitud.creditoId}</span></FilaDato>
              <FilaDato etiqueta="Asesor"><span className="cifra">{solicitud.asesorId}</span></FilaDato>
              <FilaDato etiqueta="Monto"><Dinero valor={solicitud.monto} /></FilaDato>
              <FilaDato etiqueta="Plazo">{solicitud.plazoMeses} meses</FilaDato>
              <FilaDato etiqueta="Tasa nominal anual">{tasaComoPorcentaje(solicitud.tasaNominalAnual)} %</FilaDato>
              <FilaDato etiqueta="Primera cuota (simulada)">{plan.cuotas[0] && <><Dinero valor={plan.cuotas[0].importe} /> · {formatearFecha(plan.cuotas[0].fechaVencimiento)}</>}</FilaDato>
            </dl>
            <p className="mt-3 text-sm text-tenue">Se registrará la solicitud en estado <strong>Solicitado</strong>. El desembolso exige antes la aprobación del comité.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Boton variante="secundario" onClick={() => setPaso(2)}>Volver</Boton>
              <Boton disabled={ocupado} onClick={() => void ejecutar(() => operar("solicitarCredito", solicitud), (r) => { setResumen(r.datos); setPaso(4); })}>
                Registrar solicitud</Boton>
            </div>
          </Tarjeta>
        )}
        {paso === 4 && resumen && (
          <PasoDecision titulo="Aprobación del comité" resumen={resumen} esGerencia={sesion?.perfil === "GERENCIA"} ocupado={ocupado}
            onActualizarEstado={() => void ejecutar(() => operar("consultarCredito", { creditoId: resumen.creditoId, fechaCorte }), (r) => { setResumen(r.datos); if (r.datos.estado !== "SOLICITADO") setPaso(5); })}
            motivoInicial="Aprobación del comité de crédito"
            onAprobar={(motivo) => void ejecutar(() => operar("aprobarCredito", { creditoId: resumen.creditoId, fechaOperacion: fechaCorte, motivo }),
              (r) => { setResumen(r.datos); setPaso(5); })}
            onRechazar={(motivo) => void ejecutar(() => operar("rechazarCredito", { creditoId: resumen.creditoId, fechaOperacion: fechaCorte, motivo }),
              (r) => setResumen(r.datos))} />
        )}
        {paso === 5 && resumen && <PasoDesembolso resumen={resumen} fechaCorte={fechaCorte} ocupado={ocupado} esGerencia={sesion?.perfil === "GERENCIA"}
          onDesembolsar={(motivo) => void ejecutar(() => operar("desembolsarCredito", { creditoId: resumen.creditoId, fechaOperacion: fechaCorte, motivo }),
            (r) => setResumen(r.datos))} />}
        {error !== null && <MensajeError error={error} />}
      </main>
    </>
  );
}

function PasoCliente({ fechaCorte, inicial, ocupado, onListo, ejecutar }: { readonly fechaCorte: string; readonly inicial: string; readonly ocupado: boolean;
  readonly onListo: (c: { clienteId: string; nombre: string }) => void;
  readonly ejecutar: <T>(accion: () => Promise<T>, siguiente: (r: T) => void) => Promise<void> }) {
  const [modo, setModo] = useState<"nuevo" | "existente">(inicial ? "existente" : "nuevo");
  const [f, setF] = useState({ clienteId: "", nombreCompleto: "", documento: "", municipio: "", telefono: "" });
  const [existente, setExistente] = useState(inicial);
  const [errores, setErrores] = useState<Errores>({});
  const campo = (k: keyof typeof f) => ({ value: f[k], onChange: (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value }), error: errores[k] });

  const alta = (e: FormEvent) => {
    e.preventDefault();
    const entrada = { clienteId: f.clienteId.trim(), nombreCompleto: f.nombreCompleto, identificadorLegal: { tipo: "DPI", valor: f.documento.trim() },
      municipio: f.municipio, ...(f.telefono.trim() ? { telefono: f.telefono } : {}), fechaAlta: fechaCorte };
    const r = altaClienteFinalSchema.safeParse(entrada);
    if (!r.success) { setErrores(erroresDe(r.error.issues, { identificadorLegal: "documento" })); return; }
    setErrores({});
    void ejecutar(() => operar("altaCliente", r.data), ({ datos }) => onListo({ clienteId: datos.clienteId, nombre: datos.nombreCompleto }));
  };
  const buscar = (e: FormEvent) => {
    e.preventDefault();
    void ejecutar(() => operar("listarClientes", { fechaCorte, busqueda: existente.trim() }), ({ datos }) => {
      const c = datos.clientes.find((x) => x.clienteId === existente.trim());
      if (c) onListo({ clienteId: c.clienteId, nombre: c.nombreCompleto }); else setErrores({ existente: "No hay un cliente con ese código a la fecha de corte." });
    });
  };
  return (
    <Tarjeta titulo="Cliente">
      <div role="group" aria-label="Tipo de cliente" className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-superficie p-1 text-sm">
        {([["nuevo", "Alta de cliente"], ["existente", "Cliente existente"]] as const).map(([m, t]) => (
          <button key={m} type="button" aria-pressed={modo === m} onClick={() => setModo(m)}
            className={`rounded-lg py-2 font-semibold ${modo === m ? "bg-white shadow-sm" : "text-tenue"}`}>{t}</button>))}
      </div>
      {modo === "nuevo" ? (
        <form onSubmit={alta} className="flex flex-col gap-3" noValidate>
          <Campo etiqueta="Código de cliente" placeholder="CL-9001" autoComplete="off" {...campo("clienteId")} />
          <Campo etiqueta="Nombre completo" autoComplete="off" {...campo("nombreCompleto")} />
          <Campo etiqueta="DPI" autoComplete="off" {...campo("documento")} />
          <Campo etiqueta="Municipio" {...campo("municipio")} />
          <Campo etiqueta="Teléfono (opcional)" type="tel" ayuda="No es obligatorio; no se completa con datos inventados." {...campo("telefono")} />
          <p className="text-xs text-tenue">Fecha de alta: fecha de operación de la sesión, <span className="cifra">{fechaCorte}</span>.</p>
          <Boton type="submit" disabled={ocupado}>Dar de alta y continuar</Boton>
        </form>
      ) : (
        <form onSubmit={buscar} className="flex flex-col gap-3" noValidate>
          <Campo etiqueta="Código de cliente" value={existente} onChange={(e) => setExistente(e.target.value)} error={errores["existente"]} />
          <Boton type="submit" disabled={ocupado || !existente.trim()}>Usar este cliente</Boton>
        </form>
      )}
    </Tarjeta>
  );
}

function PasoSolicitud({ fechaCorte, clienteId, previa, ocupado, onSimular }: { readonly fechaCorte: string; readonly clienteId: string;
  readonly previa: EntradaFinal<"solicitarCredito"> | null; readonly ocupado: boolean; readonly onSimular: (s: EntradaFinal<"solicitarCredito">) => void }) {
  const asesores = useConsulta("listarAsesores", {});
  const [f, setF] = useState({ creditoId: previa?.creditoId ?? "", asesorId: previa?.asesorId ?? "AS-01", monto: previa?.monto.importe ?? "",
    plazo: String(previa?.plazoMeses ?? 12), tasa: previa ? tasaComoPorcentaje(previa.tasaNominalAnual) : "36" });
  const [errores, setErrores] = useState<Errores>({});
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const importe = normalizarImporte(f.monto);
    const tasa = porcentajeComoTasa(f.tasa);
    const r = originarCreditoSchema.safeParse({ creditoId: f.creditoId.trim(), clienteId, asesorId: f.asesorId,
      monto: { importe: importe ?? f.monto, moneda: "GTQ" }, plazoMeses: Number(f.plazo), tasaNominalAnual: tasa ?? f.tasa, fechaSolicitud: fechaCorte });
    if (!r.success) { setErrores(erroresDe(r.error.issues, { tasaNominalAnual: "tasa", plazoMeses: "plazo" })); return; }
    setErrores({});
    onSimular(r.data);
  };
  return (
    <Tarjeta titulo="Datos de la solicitud">
      <form onSubmit={enviar} className="flex flex-col gap-3" noValidate>
        <Campo etiqueta="Número de crédito" placeholder="CV-2026-9001" value={f.creditoId} onChange={(e) => setF({ ...f, creditoId: e.target.value })} error={errores["creditoId"]} />
        <SegunEstado estado={asesores.estado} onReintentar={asesores.recargar}>{(d) => (
          <Selector etiqueta="Asesor responsable" value={f.asesorId} onChange={(e) => setF({ ...f, asesorId: e.target.value })}>
            {d.asesores.map((a) => <option key={a.asesorId} value={a.asesorId}>{a.asesorId} · {a.nombre}</option>)}
          </Selector>)}</SegunEstado>
        <Campo etiqueta="Monto (Q)" inputMode="decimal" placeholder="10000.00" value={f.monto} onChange={(e) => setF({ ...f, monto: e.target.value })}
          error={errores["monto"]} ayuda="Entre Q1,000.00 y Q25,000.00." />
        <Selector etiqueta="Plazo (meses)" value={f.plazo} onChange={(e) => setF({ ...f, plazo: e.target.value })}>
          {Array.from({ length: 22 }, (_, i) => i + 3).map((n) => <option key={n} value={n}>{n}</option>)}
        </Selector>
        <Campo etiqueta="Tasa nominal anual (%)" inputMode="decimal" value={f.tasa} onChange={(e) => setF({ ...f, tasa: e.target.value })} error={errores["tasa"]} />
        <Boton type="submit" disabled={ocupado}>Simular plan</Boton>
      </form>
    </Tarjeta>
  );
}

function PasoSimulacion({ plan, solicitud, onModificar, onConfirmar }: { readonly plan: SalidaFinal<"simularPlan">;
  readonly solicitud: EntradaFinal<"solicitarCredito">; readonly onModificar: () => void; readonly onConfirmar: () => void }) {
  const primera = plan.cuotas[0];
  return (
    <>
      <Tarjeta titulo="Plan simulado">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div><dt className="text-tenue">Capital</dt><dd><Dinero valor={solicitud.monto} /></dd></div>
          <div><dt className="text-tenue">Cuota</dt><dd>{primera && <Dinero valor={primera.importe} />}</dd></div>
          <div><dt className="text-tenue">Desembolso previsto</dt><dd>{formatearFecha(plan.fechaDesembolso)}</dd></div>
          <div><dt className="text-tenue">Primer vencimiento</dt><dd>{primera && formatearFecha(primera.fechaVencimiento)}</dd></div>
        </dl>
      </Tarjeta>
      <TablaPlan plan={plan} />
      <OrigenDatos fechaCorte={plan.fechaDesembolso} operacion="simularPlan" />
      <div className="grid grid-cols-2 gap-2">
        <Boton variante="secundario" onClick={onModificar}>Modificar</Boton>
        <Boton onClick={onConfirmar}>Confirmar</Boton>
      </div>
    </>
  );
}

export function TablaPlan({ plan, pagadas = 0, vencidas = 0 }: { readonly plan: SalidaFinal<"simularPlan">; readonly pagadas?: number; readonly vencidas?: number }) {
  return (
    <div className="tarjeta overflow-x-auto">
      <table className="w-full min-w-[480px] text-xs">
        <caption className="solo-lectores">Plan de amortización con fechas de vencimiento</caption>
        <thead className="bg-tinta text-left text-white">
          <tr><th className="p-2">#</th><th className="p-2">Vence</th><th className="p-2 text-right">Cuota</th><th className="p-2 text-right">Interés</th>
            <th className="p-2 text-right">Capital</th><th className="p-2 text-right">Saldo</th></tr>
        </thead>
        <tbody>
          {plan.cuotas.map((q, i) => {
            // R-1: las cuotas pagadas son siempre las primeras; los conteos vienen de consultarCredito.
            const estado = i < pagadas ? "pagada" : i < pagadas + vencidas ? "vencida" : "pendiente";
            return (
              <tr key={q.numero} className={`border-t border-linea ${estado === "pagada" ? "bg-green-50" : estado === "vencida" ? "bg-orange-50" : ""}`}>
                <td className="p-2 font-semibold">{q.numero}{estado !== "pendiente" && <span className="solo-lectores"> ({estado})</span>}</td>
                <td className="p-2 whitespace-nowrap">{formatearFecha(q.fechaVencimiento)}</td>
                <td className="cifra p-2 text-right"><Dinero valor={q.importe} /></td>
                <td className="cifra p-2 text-right text-tenue"><Dinero valor={q.interes} /></td>
                <td className="cifra p-2 text-right"><Dinero valor={q.amortizacion} /></td>
                <td className="cifra p-2 text-right text-tenue"><Dinero valor={q.saldoPosterior} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PasoDecision({ titulo, resumen, esGerencia, ocupado, motivoInicial, onAprobar, onRechazar, onActualizarEstado }: {
  readonly titulo: string; readonly resumen: Resumen; readonly esGerencia: boolean; readonly ocupado: boolean; readonly motivoInicial: string;
  readonly onAprobar: (motivo: string) => void; readonly onRechazar: (motivo: string) => void; readonly onActualizarEstado?: () => void }) {
  const [motivo, setMotivo] = useState(motivoInicial);
  if (resumen.estado !== "SOLICITADO") return (
    <Tarjeta titulo={titulo}><p className="text-sm">Decisión registrada: <InsigniaEstado estado={resumen.estado} /></p>
      {resumen.estado === "RECHAZADO" && <Link to={esGerencia ? "/gerencia/clientes" : "/asesor/clientes"} className="mt-3 inline-block text-sm font-bold underline">Volver a clientes</Link>}</Tarjeta>);
  return (
    <Tarjeta titulo={titulo}>
      <p className="text-sm">Solicitud <span className="cifra">{resumen.creditoId}</span>: <InsigniaEstado estado={resumen.estado} /></p>
      {!esGerencia ? (
        <div className="mt-3 rounded-xl border border-aviso-borde bg-aviso-fondo p-3 text-sm text-aviso-texto">
          <p className="font-bold">La aprobación corresponde al perfil Gerencia (comité).</p>
          <p className="mt-1">El servidor rechaza la aprobación desde el perfil Asesor.</p>
          {onActualizarEstado && <Boton variante="primario" className="mt-3" disabled={ocupado} onClick={onActualizarEstado}>Actualizar estado</Boton>}
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          <Campo etiqueta="Motivo de la decisión" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Boton variante="peligro" disabled={ocupado || !motivo.trim()} onClick={() => onRechazar(motivo)}>Rechazar</Boton>
            <Boton variante="exito" disabled={ocupado || !motivo.trim()} onClick={() => onAprobar(motivo)}>Aprobar en comité</Boton>
          </div>
        </div>
      )}
    </Tarjeta>
  );
}

function PasoDesembolso({ resumen, fechaCorte, ocupado, esGerencia, onDesembolsar }: { readonly resumen: Resumen; readonly fechaCorte: string;
  readonly ocupado: boolean; readonly esGerencia: boolean; readonly onDesembolsar: (motivo: string) => void }) {
  const [motivo, setMotivo] = useState("Desembolso autorizado por el comité");
  if (resumen.estado === "APROBADO") return (
    <Tarjeta titulo="Desembolso">
      <p className="text-sm">Solicitud aprobada por el comité: <InsigniaEstado estado={resumen.estado} /></p>
      <div className="mt-3 flex flex-col gap-3">
        <Campo etiqueta="Observación del desembolso" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        <p className="text-xs text-tenue">Fecha de desembolso: <span className="cifra">{fechaCorte}</span>. El plan y la política se fijan con esa fecha.</p>
        <Boton variante="acento" disabled={ocupado || !motivo.trim()} onClick={() => onDesembolsar(motivo)}>Desembolsar</Boton>
      </div>
    </Tarjeta>
  );
  return (
    <Tarjeta titulo="Crédito desembolsado">
      <dl className="divide-y divide-linea">
        <FilaDato etiqueta="Estado"><InsigniaEstado estado={resumen.estado} /></FilaDato>
        <FilaDato etiqueta="Saldo de capital"><Dinero valor={resumen.saldoCapital} /></FilaDato>
        {resumen.proximaCuota && <FilaDato etiqueta="Primera cuota"><Dinero valor={resumen.proximaCuota.importe} /> · vence {formatearFecha(resumen.proximaCuota.fechaVencimiento)}</FilaDato>}
      </dl>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link to={`/asesor/creditos/${resumen.creditoId}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-tinta text-sm font-bold text-white">Ver detalle</Link>
        <Link to={`/asesor/creditos/${resumen.creditoId}/plan`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-linea bg-white text-sm font-bold">Ver plan</Link>
      </div>
      <div className="mt-3"><OrigenDatos fechaCorte={resumen.fechaCorte} operacion="desembolsarCredito" /></div>
    </Tarjeta>
  );
}
