import { Suspense } from "react";
import Link from "next/link";
import { MiCita } from "@/components/MiCita";
import { MiPerfil } from "@/components/MiPerfil";
import { Cargando, Panel } from "@/components/Panel";
import { etiquetaDia, horaBonita } from "@/lib/citas";
import { exigirRol } from "@/lib/roles";
import { crearClienteServidor } from "@/lib/supabase/server";

type CitaFila = { id: number; horarios_cita: { inicio: string; barberos: { nombre: string } | null } };

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

  const [{ data: datos }, { data: barberos }, { count: cortes }, { data: citas }] = await Promise.all([
    supabase
      .from("perfiles")
      .select("telefono, barbero_favorito")
      .eq("id", perfil.id)
      .single<{ telefono: string | null; barbero_favorito: string | null }>(),
    supabase.from("barberos").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("cortes").select("id", { count: "exact", head: true }).eq("cliente_id", perfil.id),
    supabase
      .from("citas")
      .select("id, horarios_cita!inner (inicio, barberos (nombre))")
      .eq("cliente_id", perfil.id)
      .gt("horarios_cita.inicio", new Date().toISOString()),
  ]);
  const cita = ((citas ?? []) as unknown as CitaFila[])[0];

  return (
    <Panel titulo="Mi cuenta" nombre={perfil.nombre}>
      {cita ? (
        <MiCita
          citaId={cita.id}
          dia={etiquetaDia(cita.horarios_cita.inicio)}
          hora={horaBonita(cita.horarios_cita.inicio)}
          barbero={cita.horarios_cita.barberos?.nombre ?? "tu barbero"}
        />
      ) : (
        <Link
          href="/citas"
          className="rounded-2xl border border-oro/40 bg-carbon p-5 transition hover:bg-oro/10"
        >
          <p className="font-serif text-xl text-oro">Apartar cita</p>
          <p className="mt-1 text-sm text-crema/70">Gratis, en las horas tranquilas que abren los barberos.</p>
        </Link>
      )}
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
