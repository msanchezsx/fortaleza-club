import { Suspense } from "react";
import { Cargando, Panel, Tarjeta } from "@/components/Panel";
import { exigirRol } from "@/lib/roles";

export default function PaginaDueno() {
  return (
    <Suspense fallback={<Cargando />}>
      <PanelDueno />
    </Suspense>
  );
}

async function PanelDueno() {
  const perfil = await exigirRol(["dueno"], "/dueno");

  return (
    <Panel titulo="Panel del dueño" nombre={perfil.nombre}>
      <Tarjeta>Aquí vas a dar de alta a tus barberos (Paso 4) y ver las estadísticas (Paso 7).</Tarjeta>
    </Panel>
  );
}
