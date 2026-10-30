import { Suspense } from "react";
import { BotonesBarbero, type Estado } from "@/components/BotonesBarbero";
import { Cargando, Panel, Tarjeta } from "@/components/Panel";
import { inicioDelDiaMexico } from "@/lib/negocio";
import { exigirRol } from "@/lib/roles";
import { crearClienteServidor } from "@/lib/supabase/server";

export default function PaginaBarbero() {
  return (
    <Suspense fallback={<Cargando />}>
      <PanelBarbero />
    </Suspense>
  );
}

async function PanelBarbero() {
  const perfil = await exigirRol(["barbero", "dueno"], "/barbero");
  const supabase = await crearClienteServidor();

  const { data: barbero } = await supabase
    .from("barberos")
    .select("id, nombre, activo, estado_barbero (estado, desde)")
    .eq("perfil_id", perfil.id)
    .maybeSingle<{ id: string; nombre: string; activo: boolean; estado_barbero: { estado: Estado; desde: string } | null }>();

  if (!barbero || !barbero.activo) {
    return (
      <Panel titulo="Panel del barbero" nombre={perfil.nombre}>
        <Tarjeta>
          {barbero
            ? "Tu perfil de barbero está desactivado. Pídele al dueño que lo active."
            : "Tu cuenta todavía no está registrada como barbero. Pídele al dueño que te dé de alta con este correo."}
        </Tarjeta>
      </Panel>
    );
  }

  const { count } = await supabase
    .from("cortes")
    .select("id", { count: "exact", head: true })
    .eq("barbero_id", barbero.id)
    .gte("hecho_en", inicioDelDiaMexico());

  return (
    <Panel titulo="Panel del barbero" nombre={barbero.nombre}>
      <BotonesBarbero
        barberoId={barbero.id}
        estadoInicial={barbero.estado_barbero?.estado ?? "libre"}
        desdeInicial={barbero.estado_barbero?.desde ?? null}
        cortesHoyInicial={count ?? 0}
      />
    </Panel>
  );
}
