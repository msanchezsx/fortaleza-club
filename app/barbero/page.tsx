import { Suspense } from "react";
import { Cargando, Panel, Tarjeta } from "@/components/Panel";
import { exigirRol } from "@/lib/roles";

export default function PaginaBarbero() {
  return (
    <Suspense fallback={<Cargando />}>
      <PanelBarbero />
    </Suspense>
  );
}

async function PanelBarbero() {
  const perfil = await exigirRol(["barbero", "dueno"], "/barbero");

  return (
    <Panel titulo="Panel del barbero" nombre={perfil.nombre}>
      <Tarjeta>Aquí van a estar tus botones de Atendiendo / Libre y Corte terminado (Paso 5).</Tarjeta>
    </Panel>
  );
}
