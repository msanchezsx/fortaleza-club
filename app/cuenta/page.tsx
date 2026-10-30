import { Suspense } from "react";
import { MiPerfil } from "@/components/MiPerfil";
import { Cargando, Panel } from "@/components/Panel";
import { exigirRol } from "@/lib/roles";
import { crearClienteServidor } from "@/lib/supabase/server";

export default function PaginaCuenta() {
  return (
    <Suspense fallback={<Cargando />}>
      <Cuenta />
    </Suspense>
  );
}

async function Cuenta() {
  const perfil = await exigirRol(["cliente", "barbero", "dueno"], "/cuenta");
  const supabase = await crearClienteServidor();

  const [{ data: datos }, { data: barberos }, { count: cortes }] = await Promise.all([
    supabase
      .from("perfiles")
      .select("telefono, barbero_favorito")
      .eq("id", perfil.id)
      .single<{ telefono: string | null; barbero_favorito: string | null }>(),
    supabase.from("barberos").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("cortes").select("id", { count: "exact", head: true }).eq("cliente_id", perfil.id),
  ]);

  return (
    <Panel titulo="Mi cuenta" nombre={perfil.nombre}>
      <MiPerfil
        nombreInicial={perfil.nombre ?? ""}
        telefonoInicial={datos?.telefono ?? ""}
        favoritoInicial={datos?.barbero_favorito ?? null}
        barberos={barberos ?? []}
      />
      <section className="rounded-2xl border border-oro/20 bg-carbon p-5">
        <p className="font-serif text-xl text-oro">Mis cortes</p>
        <p className="mt-2 text-crema/80">
          {cortes ? `Llevas ${cortes} ${cortes === 1 ? "corte" : "cortes"} en La Fortaleza.` : "Todavía no tienes cortes registrados."}
        </p>
        <p className="mt-1 text-sm text-crema/50">Pronto: cada 3 cortes, uno gratis.</p>
      </section>
    </Panel>
  );
}
