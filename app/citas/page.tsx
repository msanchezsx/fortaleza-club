import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { LogoCastillo } from "@/components/LogoCastillo";
import { Cargando } from "@/components/Panel";
import { diaMexico, horaBonita, proximosDias } from "@/lib/citas";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";

type Horario = { id: number; inicio: string; barberos: { nombre: string } | null };

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
  const { data } = await supabase
    .from("horarios_cita")
    .select("id, inicio, barberos (nombre)")
    .gte("inicio", new Date().toISOString())
    .order("inicio")
    .limit(200);
  const horarios = (data ?? []) as unknown as Horario[];

  if (horarios.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-oro/20 bg-carbon p-5 text-crema/70">
        Por ahora no hay horarios abiertos. Revisa más tarde o ven sin cita.
      </p>
    );
  }

  const etiquetas = new Map(proximosDias(14).map((d) => [d.ymd, d.etiqueta]));
  const porDia = new Map<string, Horario[]>();
  for (const h of horarios) {
    const dia = diaMexico(h.inicio);
    porDia.set(dia, [...(porDia.get(dia) ?? []), h]);
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {[...porDia].map(([dia, lista]) => (
        <section key={dia} className="rounded-2xl border border-oro/20 bg-carbon p-5">
          <p className="font-serif text-xl text-oro capitalize">{etiquetas.get(dia) ?? dia}</p>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {lista.map((h) => (
              <li key={h.id} className="rounded-xl bg-noche/60 px-3 py-2 text-sm">
                <span className="font-semibold text-crema">{horaBonita(h.inicio)}</span>
                <span className="block truncate text-xs text-crema/60">con {h.barberos?.nombre ?? "barbero"}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-center text-sm text-crema/50">Muy pronto podrás apartar tu horario desde aquí.</p>
    </div>
  );
}
