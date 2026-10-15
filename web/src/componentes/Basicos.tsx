import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { formatearDinero, nombreEstado, nombreTramo, type DineroApi } from "../formato";

type Variante = "primario" | "acento" | "secundario" | "peligro" | "exito";
const VARIANTES: Readonly<Record<Variante, string>> = {
  primario: "bg-tinta text-white hover:bg-nav-activo",
  acento: "bg-acento text-tinta hover:brightness-95",
  secundario: "bg-white text-tinta border border-linea hover:bg-superficie-suave",
  peligro: "bg-white text-peligro border border-peligro hover:bg-red-50",
  exito: "bg-exito text-white hover:bg-exito-oscuro",
};
export function Boton({ variante = "primario", className = "", children, ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { readonly variante?: Variante }) {
  return (
    <button type="button" {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition
        disabled:opacity-50 ${VARIANTES[variante]} ${className}`}>
      {children}
    </button>
  );
}

export function Tarjeta({ titulo, accion, children, className = "" }: { readonly titulo?: string; readonly accion?: ReactNode;
  readonly children: ReactNode; readonly className?: string }) {
  return (
    <section className={`tarjeta p-4 sm:p-5 ${className}`} aria-label={titulo}>
      {(titulo || accion) && <div className="mb-3 flex items-center justify-between gap-2">
        {titulo && <h2 className="etiqueta-seccion">{titulo}</h2>}{accion}
      </div>}
      {children}
    </section>
  );
}

/** Importe exacto de la API, sin conversión numérica. */
export function Dinero({ valor, className = "" }: { readonly valor: DineroApi; readonly className?: string }) {
  return <span className={`cifra whitespace-nowrap ${className}`}>{formatearDinero(valor)}</span>;
}

const COLOR_TRAMO: Readonly<Record<string, string>> = {
  SIN_MORA: "bg-tramo-al-dia text-white", MORA_1: "bg-tramo-mora-1 text-white", MORA_2: "bg-tramo-mora-2 text-white",
  MORA_3: "bg-tramo-mora-3 text-white", VENCIDO: "bg-tramo-vencido text-white", INCOBRABLE: "bg-tramo-incobrable text-white",
  REESTRUCTURADO: "bg-indigo-700 text-white",
};
export function InsigniaTramo({ tramo }: { readonly tramo: string }) {
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-bold ${COLOR_TRAMO[tramo] ?? "bg-secundario text-white"}`}>
    {nombreTramo(tramo)}</span>;
}
const COLOR_ESTADO: Readonly<Record<string, string>> = {
  VIGENTE: "bg-green-100 text-exito-oscuro", EN_MORA: "bg-orange-100 text-orange-900", INCOBRABLE: "bg-slate-200 text-slate-800",
  REESTRUCTURADO: "bg-indigo-100 text-indigo-900", CANCELADO: "bg-slate-100 text-slate-700", SOLICITADO: "bg-amber-100 text-amber-900",
  APROBADO: "bg-sky-100 text-sky-900", RECHAZADO: "bg-red-100 text-red-900",
};
export function InsigniaEstado({ estado }: { readonly estado: string }) {
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-bold ${COLOR_ESTADO[estado] ?? "bg-slate-100 text-slate-800"}`}>
    {nombreEstado(estado)}</span>;
}

export function Campo({ etiqueta, error, ayuda, ...props }: InputHTMLAttributes<HTMLInputElement> & {
  readonly etiqueta: string; readonly error?: string | undefined; readonly ayuda?: string }) {
  const id = useId();
  const descripcion = [error ? `${id}-error` : "", ayuda ? `${id}-ayuda` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-secundario">{etiqueta}</label>
      <input id={id} {...props} aria-invalid={error ? true : undefined} aria-describedby={descripcion}
        className={`min-h-11 rounded-xl border bg-white px-3 py-2 text-base text-tinta ${error ? "border-peligro" : "border-linea"} ${props.className ?? ""}`} />
      {ayuda && <p id={`${id}-ayuda`} className="text-xs text-tenue">{ayuda}</p>}
      {error && <p id={`${id}-error`} className="text-sm font-semibold text-peligro">{error}</p>}
    </div>
  );
}

export function Selector({ etiqueta, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { readonly etiqueta: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-secundario">{etiqueta}</label>
      <select id={id} {...props} className="min-h-11 rounded-xl border border-linea bg-white px-3 py-2 text-base">{children}</select>
    </div>
  );
}

export function FilaDato({ etiqueta, children }: { readonly etiqueta: string; readonly children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-sm text-tenue">{etiqueta}</dt>
      <dd className="text-right text-sm font-semibold">{children}</dd>
    </div>
  );
}

export function Icono({ src, etiqueta, className = "h-5 w-5" }: { readonly src: string; readonly etiqueta?: string; readonly className?: string }) {
  return <img src={src} alt={etiqueta ?? ""} aria-hidden={etiqueta ? undefined : true} className={className} />;
}

/** Origen visible de las cifras: núcleo vía API y fecha de corte usada. */
export function OrigenDatos({ fechaCorte, operacion }: { readonly fechaCorte: string; readonly operacion: string }) {
  return <p className="text-xs text-tenue">Cifras del núcleo vía API · <span className="cifra">{operacion}</span> · corte{" "}
    <span className="cifra">{fechaCorte}</span></p>;
}
