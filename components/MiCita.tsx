"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/client";

// La cita apartada del cliente, con opción de cancelarla (con confirmación).
export function MiCita({ citaId, dia, hora, barbero }: { citaId: number; dia: string; hora: string; barbero: string }) {
  const router = useRouter();
  const [confirmar, setConfirmar] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancelar() {
    setCancelando(true);
    setError(null);
    const { error } = await crearClienteNavegador().rpc("cancelar_cita", { p_cita: citaId });
    setCancelando(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-oro bg-oro/10 p-5">
      <p className="text-xs tracking-widest text-crema/60 uppercase">Mi cita</p>
      <p className="mt-1 font-serif text-2xl text-oro first-letter:uppercase">
        {dia}, {hora}
      </p>
      <p className="text-crema/80">con {barbero}</p>
      <p className="mt-2 text-sm text-crema/60">Llega 5 minutos antes. Se paga en la barbería.</p>
      {error && <p className="mt-3 rounded-lg bg-ladrillo/30 p-3 text-sm">{error}</p>}
      {confirmar ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => setConfirmar(false)}
            className="rounded-xl border border-crema/20 px-4 py-3 text-sm text-crema/80"
          >
            No, la conservo
          </button>
          <button
            onClick={cancelar}
            disabled={cancelando}
            className="rounded-xl bg-ladrillo px-4 py-3 text-sm font-semibold text-crema disabled:opacity-50"
          >
            {cancelando ? "Cancelando…" : "Sí, cancelar"}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmar(true)}
          className="mt-4 w-full rounded-xl border border-ladrillo/60 px-4 py-3 text-sm text-crema/80 transition hover:bg-ladrillo/20"
        >
          Cancelar cita
        </button>
      )}
    </section>
  );
}
