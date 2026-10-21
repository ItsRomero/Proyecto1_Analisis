import type { ReactNode } from "react";
import { ErrorApi, SinConexion } from "../api/cliente";
import type { EstadoConsulta } from "../hooks/useConsulta";
import { Boton, Dinero } from "./Basicos";

export function Cargando({ texto = "Cargando datos del núcleo…" }: { readonly texto?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 p-6 text-tenue">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-linea border-t-acento" aria-hidden="true" />
      {texto}
    </div>
  );
}

export function Vacio({ titulo, children }: { readonly titulo: string; readonly children?: ReactNode }) {
  return (
    <div className="tarjeta flex flex-col items-center gap-2 p-8 text-center" role="status">
      <p className="font-bold">{titulo}</p>
      {children && <div className="text-sm text-tenue">{children}</div>}
    </div>
  );
}

/** Mensaje y código del problema RFC 9457; el monto correcto, si existe, viene del núcleo. */
export function MensajeError({ error, onReintentar }: { readonly error: unknown; readonly onReintentar?: () => void }) {
  if (error instanceof SinConexion) return <AvisoSinConexion {...(onReintentar ? { onReintentar } : {})} />;
  const problema = error instanceof ErrorApi ? error.problema : null;
  return (
    <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
      <p className="font-bold">{problema ? problema.detail : "Ocurrió un error inesperado en la interfaz."}</p>
      {problema?.montoCorrecto && <p className="mt-1">Monto correcto según el núcleo: <Dinero valor={problema.montoCorrecto} className="font-bold" /></p>}
      {problema && <p className="mt-1 text-xs text-red-800">Código <span className="cifra">{problema.errorCode}</span> · traza <span className="cifra">{problema.traceId}</span></p>}
      {onReintentar && <Boton variante="secundario" className="mt-3" onClick={onReintentar}>Reintentar</Boton>}
    </div>
  );
}

/** Estado "sin señal" del prototipo: no simula guardado local ni sincronización. */
export function AvisoSinConexion({ onReintentar, detalle }: { readonly onReintentar?: () => void; readonly detalle?: string }) {
  return (
    <div role="alert" className="rounded-xl border border-aviso-borde bg-aviso-fondo p-4 text-sm text-aviso-texto">
      <p className="font-bold">Sin conexión con el servidor</p>
      <p className="mt-1">{detalle ?? "La operación no se pudo confirmar. No se guardó nada en este dispositivo."}</p>
      {onReintentar && <Boton variante="secundario" className="mt-3" onClick={onReintentar}>Reintentar</Boton>}
    </div>
  );
}

/** Renderiza carga, error o datos de una consulta. */
export function SegunEstado<T>({ estado, onReintentar, children }: { readonly estado: EstadoConsulta<T>;
  readonly onReintentar: () => void; readonly children: (datos: T) => ReactNode }) {
  if (estado.tipo === "cargando") return <Cargando />;
  if (estado.tipo === "error") return <MensajeError error={estado.error} onReintentar={onReintentar} />;
  return <>{children(estado.datos)}</>;
}
