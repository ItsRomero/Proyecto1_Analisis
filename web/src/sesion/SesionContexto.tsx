import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fechaOperacionSchema } from "@contratos/proyecto-final";
import { sesionApi, type SesionApi } from "../api/cliente";

interface ValorSesion {
  readonly sesion: SesionApi | null;
  readonly error: unknown;
  readonly cargando: boolean;
  login(perfil: "ASESOR" | "GERENCIA" | "USUARIO", usuario: string, contrasena: string): Promise<void>;
  logout(): Promise<void>;
  /** Fecha de corte y de operación de la sesión; por defecto DEFAULT_SESSION_CUTOFF del servidor. */
  readonly fechaCorte: string;
  cambiarFechaCorte(fecha: string): boolean;
  reiniciar(): Promise<void>;
  reintentar(): void;
}
const Contexto = createContext<ValorSesion | null>(null);

export function ProveedorSesion({ children }: { readonly children: ReactNode }) {
  const [cargando, setCargando] = useState(true);
  const [sesion, setSesion] = useState<SesionApi | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [fechaCorte, setFechaCorte] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    sesionApi.obtener().then((s) => {
      if (!vigente) return;
      setSesion(s);
      setFechaCorte((actual) => actual || s?.fechaCorteDefecto || "");
      setError(null);
      setCargando(false);
    }, (e: unknown) => { if (vigente) { setError(e); setCargando(false); } });
    return () => { vigente = false; };
  }, [intento]);

  const login = useCallback(async (perfil: "ASESOR" | "GERENCIA" | "USUARIO", usuario: string, contrasena: string) => {
    const s = await sesionApi.login(perfil, usuario, contrasena);
    setSesion(s); setFechaCorte(s.fechaCorteDefecto); setError(null);
  }, []);
  const logout = useCallback(async () => { await sesionApi.logout(); setSesion(null); setFechaCorte(""); }, []);
  const cambiarFechaCorte = useCallback((fecha: string) => {
    if (!fechaOperacionSchema.safeParse(fecha).success) return false;
    setFechaCorte(fecha);
    return true;
  }, []);
  const reiniciar = useCallback(async () => {
    const s = await sesionApi.reiniciar();
    setSesion(s);
    setFechaCorte(s.fechaCorteDefecto);
  }, []);
  const reintentar = useCallback(() => setIntento((n) => n + 1), []);
  const valor = useMemo(() => ({ sesion, error, cargando, login, logout, fechaCorte, cambiarFechaCorte, reiniciar, reintentar }),
    [sesion, error, cargando, login, logout, fechaCorte, cambiarFechaCorte, reiniciar, reintentar]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion(): ValorSesion {
  const valor = useContext(Contexto);
  if (valor === null) throw new Error("useSesion requiere ProveedorSesion.");
  return valor;
}
