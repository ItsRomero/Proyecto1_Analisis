/// <reference types="vite/client" />
interface ImportMetaEnv {
  /** Solo la URL pública de la API; nunca credenciales (las variables VITE_ llegan al navegador). */
  readonly VITE_API_BASE_URL?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv }
