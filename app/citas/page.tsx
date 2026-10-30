import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ApartarCita } from "@/components/ApartarCita";
import { LogoCastillo } from "@/components/LogoCastillo";
import { Cargando } from "@/components/Panel";
import { diaMexico, horaBonita, proximosDias } from "@/lib/citas";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";

type Horario = { id: number; inicio: string; barbero: string };

export default function PaginaCitas() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <header>
        <Link href="/" className="flex items-center gap-2 text-oro">
          <LogoCastillo className="h-8 w-8" />
          <span className="font-serif text-lg">La Fortaleza</span>
        </Link>
      </header>
      <h1 className="mt-8 font-serif text-3xl text-oro">Horarios para cita</h1>
      <p className="mt-1 text-crema/70">Horas tranquilas que abrieron nuestros barberos. Sin cita también te atendemos.</p>
      <Suspense fallback={<Cargando />}>
        <ListaHorarios />
      </Suspense>
    </main>
  );
}

async function ListaHorarios() {
  await connection();
  if (!supabaseConfigurado) return null;
  const supabase = await crearClienteServidor();
  const [{ data }, { data: claims }] = await Promise.all([
    supabase.rpc("horarios_libres"),
    supabase.auth.getClaims(),
  ]);
  const horarios = (data ?? []) as Horario[];

  if (horarios.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-oro/20 bg-carbon p-5 text-crema/70">
        Por ahora no hay horarios libres. Revisa más tarde o ven sin cita.
      </p>
    );
  }

  const etiquetas = new Map(proximosDias(14).map((d) => [d.ymd, d.etiqueta]));
  const dias = new Map<string, { etiqueta: string; horarios: { id: number; hora: string; barbero: string }[] }>();
  for (const h of horarios) {
    const dia = diaMexico(h.inicio);
    const grupo = dias.get(dia) ?? { etiqueta: etiquetas.get(dia) ?? dia, horarios: [] };
    grupo.horarios.push({ id: h.id, hora: horaBonita(h.inicio), barbero: h.barbero });
    dias.set(dia, grupo);
  }

  return <ApartarCita dias={[...dias.values()]} conSesion={Boolean(claims?.claims)} />;
}
