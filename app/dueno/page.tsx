import Link from "next/link";
import { Suspense } from "react";
import { Estadisticas } from "@/components/Estadisticas";
import { Cargando, Panel } from "@/components/Panel";
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
      <Link
        href="/dueno/lealtad"
        className="rounded-2xl border border-oro/40 bg-carbon p-5 transition hover:bg-oro/10"
      >
        <p className="font-serif text-xl text-oro">Lealtad</p>
        <p className="mt-1 text-sm text-crema/70">Cuántos cortes dan uno gratis y el descuento por invitar.</p>
      </Link>
      <Estadisticas />
    </Panel>
  );
}
