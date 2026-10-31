import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";

// Regreso de Google o del correo de "olvidé mi contraseña": guarda la sesión y sigue.
export async function GET(request: NextRequest) {
  const parametros = request.nextUrl.searchParams;
  const codigo = parametros.get("code");
  const siguiente = parametros.get("siguiente");
  const invita = parametros.get("invita")?.replace(/\D/g, "").slice(0, 4);

  if (!codigo) return NextResponse.redirect(new URL("/login?error=google", request.url));

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.exchangeCodeForSession(codigo);
  if (error) return NextResponse.redirect(new URL("/login?error=google", request.url));

  // Si lo invitó un amigo, registrar la invitación (si ya tenía cuenta, la base de datos la rechaza).
  if (invita?.length === 4) await supabase.rpc("usar_invitacion", { p_codigo: invita });

  const destino = siguiente?.startsWith("/") ? `?siguiente=${encodeURIComponent(siguiente)}` : "";
  return NextResponse.redirect(new URL(`/entrar${destino}`, request.url));
}
