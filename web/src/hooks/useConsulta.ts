import { useCallback, useEffect, useState } from "react";
import type { EntradaFinal, NombreOperacionFinal, SalidaFinal } from "@contratos/proyecto-final";
import { operar } from "../api/cliente";

export type EstadoConsulta<T> =
  | { readonly tipo: "cargando" }
  | { readonly tipo: "error"; readonly error: unknown }
  | { readonly tipo: "listo"; readonly datos: T };

/** Lectura contra la API real; `entrada` null espera a que la sesión tenga fecha de corte. */
export function useConsulta<N extends NombreOperacionFinal>(nombre: N, entrada: EntradaFinal<N> | null) {
  const clave = entrada === null ? null : JSON.stringify(entrada);
  const [estado, setEstado] = useState<EstadoConsulta<SalidaFinal<N>>>({ tipo: "cargando" });
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    if (clave === null) return;
    let vigente = true;
    setEstado({ tipo: "cargando" });
    operar(nombre, JSON.parse(clave) as EntradaFinal<N>).then(
      (r) => { if (vigente) setEstado({ tipo: "listo", datos: r.datos }); },
      (error: unknown) => { if (vigente) setEstado({ tipo: "error", error }); });
    return () => { vigente = false; };
  }, [nombre, clave, intento]);
  const recargar = useCallback(() => setIntento((n) => n + 1), []);
  return { estado, recargar };
}
