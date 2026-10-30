import { Suspense } from "react";
import { AdministrarBarberos, type Barbero } from "@/components/AdministrarBarberos";
import { Cargando, Panel } from "@/components/Panel";
import { exigirRol } from "@/lib/roles";
import { crearClienteServidor } from "@/lib/supabase/server";

export default function PaginaBarberos() {
  return (
    <Suspense fallback={<Cargando />}>
      <ListaBarberos />
    </Suspense>
  );
}

async function ListaBarberos() {
  const perfil = await exigirRol(["dueno"], "/dueno/barberos");
  const supabase = await crearClienteServidor();
  const { data: barberos } = await supabase
    .from("barberos")
    .select("id, nombre, correo, activo, perfil_id")
    .order("activo", { ascending: false })
    .order("nombre")
    .returns<Barbero[]>();

  return (
    <Panel titulo="Barberos" nombre={perfil.nombre}>
      <AdministrarBarberos barberos={barberos ?? []} />
    </Panel>
  );
}
