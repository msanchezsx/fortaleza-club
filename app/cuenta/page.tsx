import { Suspense } from "react";
import Link from "next/link";
import { InvitarAmigos, type Referidos } from "@/components/InvitarAmigos";
import { MiCita } from "@/components/MiCita";
import { MiPerfil } from "@/components/MiPerfil";
import { MisFotos } from "@/components/MisFotos";
import { Cargando, Panel } from "@/components/Panel";
import { TarjetaLealtad, type Lealtad } from "@/components/TarjetaLealtad";
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

  const [{ data: datos }, { data: barberos }, { data: lealtad }, { data: citas }, { data: refs }] = await Promise.all([
    supabase
      .from("perfiles")
      .select("telefono, barbero_favorito")
      .eq("id", perfil.id)
      .single<{ telefono: string | null; barbero_favorito: string | null }>(),
    supabase.from("barberos").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.rpc("mi_lealtad"),
    supabase
      .from("citas")
      .select("id, horarios_cita!inner (inicio, barberos (nombre))")
      .eq("cliente_id", perfil.id)
      .gt("horarios_cita.inicio", new Date().toISOString()),
    supabase.rpc("mis_referidos"),
  ]);
  const cita = ((citas ?? []) as unknown as CitaFila[])[0];
  const tarjeta = ((lealtad ?? []) as Lealtad[])[0];
  const referidos = ((refs ?? []) as Referidos[])[0];

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
      {tarjeta && <TarjetaLealtad lealtad={tarjeta} />}
      {tarjeta && referidos && <InvitarAmigos codigo={tarjeta.codigo} referidos={referidos} />}
      <MisFotos clienteId={perfil.id} />
      <MiPerfil
        nombreInicial={perfil.nombre ?? ""}
        telefonoInicial={datos?.telefono ?? ""}
        favoritoInicial={datos?.barbero_favorito ?? null}
        barberos={barberos ?? []}
      />
    </Panel>
  );
}
