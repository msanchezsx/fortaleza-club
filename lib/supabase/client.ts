import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";

// Conexión a Supabase desde el navegador (componentes con "use client").
export function crearClienteNavegador() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
