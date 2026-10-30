import { redirect } from "next/navigation";
import { connection } from "next/server";
import { inicioDeRol, type Rol } from "@/lib/roles-cliente";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Perfil = { id: string; nombre: string | null; rol: Rol };

// Devuelve el perfil de quien inició sesión, o lo manda al login.
// Si su rol no está en `permitidos`, lo manda a su propia página.
export async function exigirRol(permitidos: Rol[], desde: string): Promise<Perfil> {
  await connection(); // siempre revisar la sesión al momento, nunca guardar en caché
  if (!supabaseConfigurado) redirect("/login");
  const supabase = await crearClienteServidor();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) redirect(`/login?siguiente=${encodeURIComponent(desde)}`);

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, nombre, rol")
    .eq("id", userId)
    .single<Perfil>();

  if (!perfil) redirect("/login");
  if (!permitidos.includes(perfil.rol)) redirect(inicioDeRol(perfil.rol));
  return perfil;
}
