import Link from "next/link";
import { Suspense } from "react";
import { Cargando, Panel } from "@/components/Panel";
import { ReglasLealtad } from "@/components/ReglasLealtad";
import { exigirRol } from "@/lib/roles";
import { crearClienteServidor } from "@/lib/supabase/server";

export default function PaginaLealtad() {
  return (
    <Suspense fallback={<Cargando />}>
      <Lealtad />
    </Suspense>
  );
}

async function Lealtad() {
  const perfil = await exigirRol(["dueno"], "/dueno/lealtad");
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("reglas_lealtad")
    .select("cortes_para_gratis, activo, descuento_referido, referidos_activo")
    .eq("id", 1)
    .maybeSingle<{ cortes_para_gratis: number; activo: boolean; descuento_referido: string; referidos_activo: boolean }>();

  return (
    <Panel titulo="Lealtad" nombre={perfil.nombre}>
      <Link href="/dueno" className="text-sm text-oro/80 underline-offset-4 hover:underline">
        ← Volver al panel
      </Link>
      <ReglasLealtad
        cortesInicial={data?.cortes_para_gratis ?? 3}
        activoInicial={data?.activo ?? true}
        descuentoInicial={data?.descuento_referido ?? "$30 de descuento"}
        referidosInicial={data?.referidos_activo ?? true}
      />
    </Panel>
  );
}
