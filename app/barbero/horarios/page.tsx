import Link from "next/link";
import { Suspense } from "react";
import { AbrirHorarios } from "@/components/AbrirHorarios";
import { Cargando, Panel, Tarjeta } from "@/components/Panel";
import { exigirRol } from "@/lib/roles";
import { crearClienteServidor } from "@/lib/supabase/server";

export default function PaginaHorarios() {
  return (
    <Suspense fallback={<Cargando />}>
      <Horarios />
    </Suspense>
  );
}

async function Horarios() {
  const perfil = await exigirRol(["barbero", "dueno"], "/barbero/horarios");
  const supabase = await crearClienteServidor();

  const { data: barbero } = await supabase
    .from("barberos")
    .select("id, nombre, activo")
    .eq("perfil_id", perfil.id)
    .maybeSingle<{ id: string; nombre: string; activo: boolean }>();

  if (!barbero || !barbero.activo) {
    return (
      <Panel titulo="Horarios para cita" nombre={perfil.nombre}>
        <Tarjeta>Tu cuenta todavía no está registrada como barbero activo.</Tarjeta>
      </Panel>
    );
  }

  const { data: horarios } = await supabase
    .from("horarios_cita")
    .select("inicio")
    .eq("barbero_id", barbero.id)
    .gte("inicio", new Date().toISOString())
    .order("inicio");

  return (
    <Panel titulo="Horarios para cita" nombre={barbero.nombre}>
      <Link href="/barbero" className="text-sm text-oro/80 underline-offset-4 hover:underline">
        ← Volver a mi panel
      </Link>
      <AbrirHorarios barberoId={barbero.id} abiertos={(horarios ?? []).map((h) => h.inicio as string)} />
    </Panel>
  );
}
