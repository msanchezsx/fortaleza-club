"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/client";

type Dia = { etiqueta: string; horarios: { id: number; hora: string; barbero: string }[] };

// Lista de horarios libres: el cliente toca uno y confirma para apartarlo.
export function ApartarCita({ dias, conSesion }: { dias: Dia[]; conSesion: boolean }) {
  const router = useRouter();
  const [elegido, setElegido] = useState<{ id: number; texto: string } | null>(null);
  const [apartando, setApartando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apartar() {
    if (!elegido) return;
    setApartando(true);
    setError(null);
    const { error } = await crearClienteNavegador().rpc("apartar_cita", { p_horario: elegido.id });
    setApartando(false);
    if (error) {
      setError(error.message);
      router.refresh();
      return;
    }
    router.push("/cuenta");
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {dias.map((d) => (
        <section key={d.etiqueta} className="rounded-2xl border border-oro/20 bg-carbon p-5">
          <p className="font-serif text-xl text-oro capitalize">{d.etiqueta}</p>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {d.horarios.map((h) => {
              const activo = elegido?.id === h.id;
              return (
                <li key={h.id}>
                  <button
                    onClick={() => {
                      setError(null);
                      setElegido(activo ? null : { id: h.id, texto: `${d.etiqueta} a las ${h.hora} con ${h.barbero}` });
                    }}
                    aria-pressed={activo}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                      activo ? "border-oro bg-oro/15" : "border-transparent bg-noche/60 hover:border-oro/40"
                    }`}
                  >
                    <span className="font-semibold text-crema">{h.hora}</span>
                    <span className="block truncate text-xs text-crema/60">con {h.barbero}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {elegido && (
        <div className="sticky bottom-4 rounded-2xl border border-oro bg-carbon p-5 shadow-lg shadow-black/40">
          <p className="text-sm text-crema/70">Tu cita</p>
          <p className="mt-1 font-serif text-lg text-oro first-letter:uppercase">{elegido.texto}</p>
          {error && <p className="mt-3 rounded-lg bg-ladrillo/30 p-3 text-sm">{error}</p>}
          {conSesion ? (
            <button
              onClick={apartar}
              disabled={apartando}
              className="mt-4 w-full rounded-xl bg-oro px-6 py-3 font-semibold text-noche transition hover:bg-oro-claro disabled:opacity-50"
            >
              {apartando ? "Apartando…" : "Apartar gratis"}
            </button>
          ) : (
            <Link
              href="/login?siguiente=/citas"
              className="mt-4 block rounded-xl bg-oro px-6 py-3 text-center font-semibold text-noche"
            >
              Entra o crea tu cuenta para apartar
            </Link>
          )}
          <p className="mt-2 text-center text-xs text-crema/50">No se paga nada en línea. Si no puedes llegar, cancélala en Mi cuenta.</p>
        </div>
      )}
    </div>
  );
}
