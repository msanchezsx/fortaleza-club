import { NextResponse, type NextRequest } from "next/server";
import { inicioDeRol, type Rol } from "@/lib/roles-cliente";
import { crearClienteServidor } from "@/lib/supabase/server";

// Después de iniciar sesión: manda a cada quien a su página según su rol.
export async function GET(request: NextRequest) {
  const siguiente = request.nextUrl.searchParams.get("siguiente");
  const supabase = await crearClienteServidor();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;

  let destino = "/login";
  if (userId) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", userId)
      .maybeSingle<{ rol: Rol }>();
    destino = siguiente?.startsWith("/") ? siguiente : inicioDeRol(perfil?.rol ?? "cliente");
  }

  return NextResponse.redirect(new URL(destino, request.url));
}
