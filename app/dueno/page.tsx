import Link from "next/link";
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
      <Link
        href="/dueno/barberos"
        className="rounded-2xl border border-oro/40 bg-carbon p-5 transition hover:bg-oro/10"
      >
        <p className="font-serif text-xl text-oro">Barberos</p>
        <p className="mt-1 text-sm text-crema/70">Dar de alta, desactivar y ver quién ya tiene cuenta.</p>
      </Link>
      <Tarjeta>Aquí vas a ver las estadísticas de cortes (Paso 7).</Tarjeta>
    </Panel>
  );
}
