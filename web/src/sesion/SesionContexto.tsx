import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fechaOperacionSchema } from "@contratos/proyecto-final";
import { sesionApi, type SesionApi } from "../api/cliente";

interface ValorSesion {
  readonly sesion: SesionApi | null;
  readonly error: unknown;
  /** Fecha de corte y de operación de la sesión; por defecto DEFAULT_SESSION_CUTOFF del servidor. */
  readonly fechaCorte: string;
  cambiarFechaCorte(fecha: string): boolean;
  cambiarPerfil(perfil: "ASESOR" | "GERENCIA"): Promise<void>;
  reiniciar(): Promise<void>;
  reintentar(): void;
}
const Contexto = createContext<ValorSesion | null>(null);

export function ProveedorSesion({ children }: { readonly children: ReactNode }) {
  const [sesion, setSesion] = useState<SesionApi | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [fechaCorte, setFechaCorte] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    sesionApi.obtener().then((s) => {
      if (!vigente) return;
      setSesion(s);
      setFechaCorte((actual) => actual || s.fechaCorteDefecto);
      setError(null);
    }, (e: unknown) => { if (vigente) setError(e); });
    return () => { vigente = false; };
  }, [intento]);

  const cambiarFechaCorte = useCallback((fecha: string) => {
    if (!fechaOperacionSchema.safeParse(fecha).success) return false;
    setFechaCorte(fecha);
    return true;
  }, []);
  const cambiarPerfil = useCallback(async (perfil: "ASESOR" | "GERENCIA") => { setSesion(await sesionApi.cambiarPerfil(perfil)); }, []);
  const reiniciar = useCallback(async () => {
    const s = await sesionApi.reiniciar();
    setSesion(s);
    setFechaCorte(s.fechaCorteDefecto);
  }, []);
  const reintentar = useCallback(() => setIntento((n) => n + 1), []);
  const valor = useMemo(() => ({ sesion, error, fechaCorte, cambiarFechaCorte, cambiarPerfil, reiniciar, reintentar }),
    [sesion, error, fechaCorte, cambiarFechaCorte, cambiarPerfil, reiniciar, reintentar]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion(): ValorSesion {
  const valor = useContext(Contexto);
  if (valor === null) throw new Error("useSesion requiere ProveedorSesion.");
  return valor;
}
