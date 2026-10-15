import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import type { SalidaFinal } from "@contratos/proyecto-final";
import { ErrorApi, SinConexion, operar } from "../../api/cliente";
import verificado from "../../assets/design/iconos/verificado.svg";
import { Boton, Campo, Dinero, FilaDato, Icono, InsigniaEstado, OrigenDatos, Tarjeta } from "../../componentes/Basicos";
import { ComprobantePago, DesgloseDeuda, Prelacion } from "../../componentes/Credito";
import { AvisoSinConexion, MensajeError, SegunEstado, Vacio } from "../../componentes/Estados";
import { EncabezadoAsesor } from "../../componentes/Layouts";
import { formatearFecha, normalizarImporte } from "../../formato";
import { useConsulta } from "../../hooks/useConsulta";
import { useSesion } from "../../sesion/SesionContexto";

type Propuesta = SalidaFinal<"proponerPago">;
type Pago = SalidaFinal<"confirmarPago">["pago"];
type Resumen = SalidaFinal<"consultarCredito">;
type Fase =
  | { readonly tipo: "formulario" }
  | { readonly tipo: "propuesta"; readonly propuesta: Propuesta; readonly confirmar: boolean }
  | { readonly tipo: "resultado"; readonly propuesta: Propuesta; readonly pago: Pago; readonly repetido: boolean; readonly posterior: Resumen | undefined };

const nuevaClave = (creditoId: string) => `PAGO-${creditoId}-${crypto.randomUUID()}`;

/** Confirma una propuesta con su misma clave; el servidor resuelve el replay sin duplicar efectos. */
export async function confirmarPropuesta(p: { readonly propuestaId: string; readonly fechaCorte: string; readonly versionCredito: number;
  readonly claveIdempotencia: string; readonly creditoId: string }) {
  const r = await operar("confirmarPago", { propuestaId: p.propuestaId, fechaOperacion: p.fechaCorte, versionCredito: p.versionCredito },
    { claveIdempotencia: p.claveIdempotencia });
  const posterior = await operar("consultarCredito", { creditoId: p.creditoId, fechaCorte: p.fechaCorte }).then((x) => x.datos, () => undefined);
  return { pago: r.datos.pago, repetido: r.repetido, posterior };
}

/** Pantalla obligatoria 3: registro de pago (frames 12:1309, 12:1388, 12:1534, 12:1646 y 15:2083). */
export function RegistrarPago() {
  const { creditoId = "" } = useParams();
  const { fechaCorte } = useSesion();
  const ficha = useConsulta("consultarFichaCredito", { creditoId, fechaCorte });
  const resumen = ficha.estado.tipo === "listo" ? ficha.estado.datos.resumen : null;
  const numero = resumen?.proximaCuota?.numeroCuota ?? null;
  const deuda = useConsulta("calcularDeudaCuota", numero === null ? null : { creditoId, numeroCuota: numero, fechaCorte });
  const [clave, setClave] = useState(() => nuevaClave(creditoId));
  const [monto, setMonto] = useState("");
  const [errorMonto, setErrorMonto] = useState<string | undefined>();
  const [fase, setFase] = useState<Fase>({ tipo: "formulario" });
  const [error, setError] = useState<unknown>(null);
  const [ocupado, setOcupado] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const prellenado = useRef(false);

  // Prelleno único con el monto exacto que devuelve el núcleo; la persona puede editarlo o borrarlo.
  useEffect(() => {
    if (deuda.estado.tipo !== "listo" || prellenado.current) return;
    prellenado.current = true;
    setMonto(deuda.estado.datos.totalExigible.importe);
  }, [deuda.estado]);
  useEffect(() => { titulo.current?.focus(); }, [fase.tipo]);

  async function proponer(e: FormEvent) {
    e.preventDefault();
    if (numero === null) return;
    const importe = normalizarImporte(monto);
    if (importe === null) { setErrorMonto("Escriba un monto como 561.87."); return; }
    setErrorMonto(undefined); setError(null); setOcupado(true);
    try {
      const r = await operar("proponerPago", { creditoId, fechaCorte, numeroCuota: numero, monto: { importe, moneda: "GTQ" }, claveIdempotencia: clave });
      setFase({ tipo: "propuesta", propuesta: r.datos, confirmar: false });
    } catch (causa) { setError(causa); } finally { setOcupado(false); }
  }
  async function confirmar(propuesta: Propuesta) {
    setError(null); setOcupado(true);
    try { setFase({ tipo: "resultado", propuesta, ...(await confirmarPropuesta(propuesta)) }); }
    catch (causa) { setError(causa); } finally { setOcupado(false); }
  }
  async function cancelar(propuesta: Propuesta) {
    setError(null); setOcupado(true);
    try {
      await operar("cancelarPropuesta", { propuestaId: propuesta.propuestaId, fechaOperacion: fechaCorte });
      setFase({ tipo: "formulario" }); setClave(nuevaClave(creditoId));
      setError(null);
    } catch (causa) { setError(causa); } finally { setOcupado(false); }
  }
  const reiniciar = () => {
    setFase({ tipo: "formulario" }); setClave(nuevaClave(creditoId)); setError(null); setMonto("");
    prellenado.current = false; deuda.recargar(); ficha.recargar();
  };
  const codigo = error instanceof ErrorApi ? error.problema.errorCode : null;

  return (
    <>
      <EncabezadoAsesor titulo={ficha.estado.tipo === "listo" ? ficha.estado.datos.nombreCliente : "Registrar pago"} antetitulo={`Registrar pago · ${creditoId}`}
        regresar={`/asesor/creditos/${creditoId}`} />
      <main className="flex flex-col gap-3 p-4">
        <h2 ref={titulo} tabIndex={-1} className="solo-lectores">{fase.tipo === "formulario" ? "Monto del pago" : fase.tipo === "propuesta" ? "Revisión de la prelación" : "Resultado del pago"}</h2>
        <SegunEstado estado={ficha.estado} onReintentar={ficha.recargar}>{(f) => {
          if (fase.tipo === "resultado") return <Resultado fase={fase} ocupado={ocupado} onReenviar={() => void confirmar(fase.propuesta)} />;
          if (f.resumen.proximaCuota === null) return <Vacio titulo="Sin cuotas pendientes">El crédito no tiene cuotas por pagar a esta fecha.</Vacio>;
          if (fase.tipo === "propuesta") return (
            <>
              <Tarjeta titulo="Propuesta de pago (sin efecto financiero)">
                <dl className="divide-y divide-linea">
                  <FilaDato etiqueta="Cuota">{fase.propuesta.numeroCuota} (vencida más antigua)</FilaDato>
                  <FilaDato etiqueta="Monto"><Dinero valor={fase.propuesta.monto} className="font-bold" /></FilaDato>
                  <FilaDato etiqueta="Fecha de pago">{formatearFecha(fase.propuesta.fechaCorte)}</FilaDato>
                  <FilaDato etiqueta="Estado actual → previsto"><InsigniaEstado estado={f.resumen.estado} /> → <InsigniaEstado estado={fase.propuesta.estadoPrevisto} /></FilaDato>
                  <FilaDato etiqueta="Clave de idempotencia"><span className="cifra text-xs break-all">{fase.propuesta.claveIdempotencia}</span></FilaDato>
                </dl>
              </Tarjeta>
              <Prelacion aplicacion={fase.propuesta.aplicacionPrevista} />
              <OrigenDatos fechaCorte={fase.propuesta.fechaCorte} operacion="proponerPago" />
              {error instanceof SinConexion
                ? <AvisoSinConexion detalle="No se sabe si el pago se registró. Reintente: se enviará la misma clave y el servidor no duplicará el pago."
                  onReintentar={() => void confirmar(fase.propuesta)} />
                : error !== null && <MensajeError error={error} />}
              {codigo === "PROPUESTA_OBSOLETA" ? <Boton onClick={reiniciar}>Generar una propuesta nueva</Boton> : !fase.confirmar ? (
                <div className="grid grid-cols-2 gap-2">
                  <Boton variante="secundario" disabled={ocupado} onClick={() => void cancelar(fase.propuesta)}>Cancelar propuesta</Boton>
                  <Boton variante="exito" disabled={ocupado} onClick={() => setFase({ ...fase, confirmar: true })}>Aprobar pago</Boton>
                </div>
              ) : (
                <div role="alertdialog" aria-labelledby="titulo-confirmar" aria-describedby="texto-confirmar" className="tarjeta border-2 border-exito p-4">
                  <p id="titulo-confirmar" className="font-bold">¿Confirma el registro del pago?</p>
                  <p id="texto-confirmar" className="mt-1 text-sm">Se aplicará <Dinero valor={fase.propuesta.monto} className="font-bold" /> a la cuota {fase.propuesta.numeroCuota} con la
                    prelación mostrada. Solo esta aprobación explícita registra el pago.</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Boton variante="secundario" disabled={ocupado} onClick={() => setFase({ ...fase, confirmar: false })}>Volver</Boton>
                    <Boton variante="exito" autoFocus disabled={ocupado} onClick={() => void confirmar(fase.propuesta)}>Confirmar pago</Boton>
                  </div>
                </div>
              )}
            </>
          );
          return (
            <>
              {f.resumen.estado === "INCOBRABLE" && <p role="note" className="rounded-xl bg-slate-200 p-3 text-sm font-semibold">Crédito dado de baja como incobrable. El servidor rechazará pagos nuevos.</p>}
              <Tarjeta titulo={`Cuota vencida más antigua: ${f.resumen.proximaCuota.numeroCuota}`}>
                <SegunEstado estado={deuda.estado} onReintentar={deuda.recargar}>{(d) => <DesgloseDeuda deuda={d} />}</SegunEstado>
                <div className="mt-2"><OrigenDatos fechaCorte={fechaCorte} operacion="calcularDeudaCuota" /></div>
              </Tarjeta>
              <form onSubmit={(e) => void proponer(e)} className="tarjeta flex flex-col gap-3 p-4" noValidate>
                <Campo etiqueta="Monto recibido (Q)" inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} error={errorMonto}
                  ayuda="Debe ser exactamente el total exigible; el núcleo rechaza montos distintos." className="cifra text-2xl" />
                <p className="text-xs text-tenue">Fecha de pago: fecha de operación de la sesión, <span className="cifra">{fechaCorte}</span>.</p>
                <p className="text-xs text-tenue">Clave de idempotencia: <span className="cifra break-all">{clave}</span></p>
                {error instanceof SinConexion ? <AvisoSinConexion onReintentar={() => void proponer({ preventDefault() {} } as FormEvent)} />
                  : error !== null && <MensajeError error={error} />}
                {codigo === "MONTO_NO_EXACTO" && error instanceof ErrorApi && error.problema.montoCorrecto && (
                  <Boton variante="secundario" onClick={() => { setMonto(error.problema.montoCorrecto?.importe ?? ""); setError(null); }}>Usar el monto correcto</Boton>)}
                <Boton type="submit" disabled={ocupado || deuda.estado.tipo !== "listo"}>Revisar prelación</Boton>
              </form>
            </>
          );
        }}</SegunEstado>
      </main>
    </>
  );
}

function Resultado({ fase, ocupado, onReenviar }: { readonly fase: Extract<Fase, { tipo: "resultado" }>; readonly ocupado: boolean; readonly onReenviar: () => void }) {
  return (
    <>
      <div role="status" className={`flex items-center gap-3 rounded-2xl p-4 ${fase.repetido ? "bg-aviso-fondo text-aviso-texto" : "bg-green-50 text-exito-oscuro"}`}>
        <Icono src={verificado} className="h-10 w-10" />
        <div>
          <p className="text-lg font-bold">{fase.repetido ? "Reintento sin efecto adicional" : "Pago aplicado"}</p>
          <p className="text-sm">{fase.repetido ? "La misma clave ya había registrado este pago (Idempotency-Replayed: true). El núcleo devolvió el pago original."
            : "El pago quedó registrado con la prelación mostrada antes de aprobar."}</p>
        </div>
      </div>
      <ComprobantePago pago={fase.pago} estadoPosterior={fase.posterior} />
      <Boton variante="secundario" disabled={ocupado} onClick={onReenviar}>Reenviar confirmación con la misma clave</Boton>
      <div className="grid grid-cols-2 gap-2">
        <Link to={`/asesor/creditos/${fase.pago.creditoId}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-tinta text-sm font-bold text-white">Ver crédito</Link>
        <Link to="/asesor/clientes" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-linea bg-white text-sm font-bold">Volver a clientes</Link>
      </div>
    </>
  );
}

/** Comprobante de un pago ya registrado, con reintento de la misma confirmación (OP-4). */
export function ComprobanteRegistrado() {
  const { creditoId = "", pagoId = "" } = useParams();
  const { fechaCorte } = useSesion();
  const pagos = useConsulta("listarPagos", { creditoId, fechaCorte });
  const resumen = useConsulta("consultarCredito", { creditoId, fechaCorte });
  const [reintento, setReintento] = useState<{ repetido: boolean; pagoId: string } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [ocupado, setOcupado] = useState(false);
  return (
    <>
      <EncabezadoAsesor titulo="Comprobante de pago" antetitulo={creditoId} regresar={`/asesor/creditos/${creditoId}`} />
      <main className="flex flex-col gap-3 p-4">
        <SegunEstado estado={pagos.estado} onReintentar={pagos.recargar}>{(lista) => {
          const pg = lista.pagos.find((p) => p.pagoId === pagoId);
          if (pg === undefined) return <Vacio titulo="Pago no encontrado a la fecha de corte" />;
          const pago: Pago = { importe: pg.importe.importe, moneda: "GTQ", fechaPago: pg.fechaPago, usuarioProceso: pg.usuarioProceso,
            pagoId: pg.pagoId, creditoId, idempotencyKey: pg.claveIdempotencia, aplicacion: pg.aplicacion };
          const reenviar = async () => {
            if (pg.propuestaId === null) return;
            setOcupado(true); setError(null);
            try {
              const r = await confirmarPropuesta({ propuestaId: pg.propuestaId, fechaCorte: pg.fechaPago, claveIdempotencia: pg.claveIdempotencia, creditoId,
                versionCredito: resumen.estado.tipo === "listo" ? resumen.estado.datos.versionCredito : 0 });
              setReintento({ repetido: r.repetido, pagoId: r.pago.pagoId });
              resumen.recargar();
            } catch (causa) { setError(causa); } finally { setOcupado(false); }
          };
          return (
            <>
              {reintento && <div role="status" className="rounded-2xl bg-aviso-fondo p-4 text-sm text-aviso-texto">
                <p className="font-bold">{reintento.repetido ? "Reintento detectado: sin efecto adicional" : "Pago registrado"}</p>
                <p>El servidor respondió <span className="cifra">Idempotency-Replayed: {String(reintento.repetido)}</span> y devolvió el pago <span className="cifra break-all">{reintento.pagoId}</span>.</p>
              </div>}
              <ComprobantePago pago={pago} estadoPosterior={resumen.estado.tipo === "listo" ? resumen.estado.datos : undefined} />
              {error !== null && <MensajeError error={error} />}
              {pg.propuestaId !== null
                ? <Boton variante="secundario" disabled={ocupado} onClick={() => void reenviar()}>Reintentar envío con la misma clave</Boton>
                : <p className="text-xs text-tenue">Pago importado de la carga canónica ({pg.canal}); no tiene confirmación de interfaz que reenviar.</p>}
            </>
          );
        }}</SegunEstado>
      </main>
    </>
  );
}
