"use client";

import { useEffect, useState } from "react";
import { HORAS_CITA, horaBonita, instanteMexico, proximosDias } from "@/lib/citas";
import { crearClienteNavegador } from "@/lib/supabase/client";

// El barbero toca las horas tranquilas en las que acepta cita.
export function AbrirHorarios({
  barberoId,
  abiertos,
  apartados,
}: {
  barberoId: string;
  abiertos: string[];
  apartados: string[];
}) {
  const [conCita] = useState(() => new Set(apartados.map((i) => new Date(i).getTime())));
  const [ahora, setAhora] = useState(0);
  const [dia, setDia] = useState<string | null>(null);
  const [seleccion, setSeleccion] = useState(() => new Set(abiertos.map((i) => new Date(i).getTime())));
  const [guardando, setGuardando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tic = () => setAhora(Date.now());
    tic();
    const reloj = setInterval(tic, 60_000);
    return () => clearInterval(reloj);
  }, []);

  if (!ahora) return null;
  const dias = proximosDias(7, new Date(ahora));
  const diaActivo = dia ?? dias[0].ymd;

  async function cambiar(inicio: string) {
    const ms = new Date(inicio).getTime();
    const abierto = seleccion.has(ms);
    setGuardando(ms);
    setError(null);
    const supabase = crearClienteNavegador();
    const { error } = abierto
      ? await supabase.from("horarios_cita").delete().eq("barbero_id", barberoId).eq("inicio", inicio)
      : await supabase.from("horarios_cita").insert({ barbero_id: barberoId, inicio });
    setGuardando(null);
    if (error) {
      setError(error.message);
      return;
    }
    setSeleccion((s) => {
      const nueva = new Set(s);
      if (abierto) nueva.delete(ms);
      else nueva.add(ms);
      return nueva;
    });
  }

  const contarDia = (ymd: string) =>
    HORAS_CITA.filter((h) => seleccion.has(new Date(instanteMexico(ymd, h)).getTime())).length;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-oro/20 bg-carbon p-5">
      <p className="text-sm text-crema/70">
        Toca las horas en que puedes atender con cita. Elige horas tranquilas: los clientes sin cita se siguen
        atendiendo igual.
      </p>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {dias.map((d) => {
          const n = contarDia(d.ymd);
          return (
            <button
              key={d.ymd}
              onClick={() => setDia(d.ymd)}
              className={`shrink-0 rounded-xl border px-3 py-2 text-sm capitalize transition ${
                d.ymd === diaActivo ? "border-oro bg-oro/15 font-semibold text-oro" : "border-crema/15 text-crema/80"
              }`}
            >
              {d.etiqueta}
              {n > 0 && <span className="ml-1 rounded-full bg-oro px-1.5 text-xs text-noche">{n}</span>}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {HORAS_CITA.map((h) => {
          const inicio = instanteMexico(diaActivo, h);
          const ms = new Date(inicio).getTime();
          const pasado = ms <= ahora;
          const abierto = seleccion.has(ms);
          const apartado = conCita.has(ms);
          return (
            <button
              key={h}
              disabled={pasado || apartado || guardando !== null}
              onClick={() => cambiar(inicio)}
              aria-pressed={abierto}
              className={`rounded-xl border px-2 py-3 text-sm transition disabled:opacity-30 ${
                apartado
                  ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-300 disabled:opacity-100"
                  : abierto
                    ? "border-oro bg-oro font-semibold text-noche"
                    : "border-crema/15 text-crema/80"
              } ${guardando === ms ? "animate-pulse" : ""}`}
            >
              {horaBonita(inicio)}
              {apartado && <span className="block text-[10px] tracking-wide uppercase">Con cita</span>}
            </button>
          );
        })}
      </div>

      {error && <p className="rounded-lg bg-ladrillo/30 p-3 text-sm">{error}</p>}
      <p className="text-center text-sm text-crema/60">
        {seleccion.size === 0
          ? "Todavía no tienes horarios abiertos."
          : `Tienes ${seleccion.size} ${seleccion.size === 1 ? "horario abierto" : "horarios abiertos"} a partir de ahora.`}
      </p>
    </section>
  );
}
