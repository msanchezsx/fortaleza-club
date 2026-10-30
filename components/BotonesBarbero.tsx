"use client";

import { useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/client";

export type Estado = "libre" | "atendiendo";

export function BotonesBarbero({
  barberoId,
  estadoInicial,
  desdeInicial,
  cortesHoyInicial,
}: {
  barberoId: string;
  estadoInicial: Estado;
  desdeInicial: string | null;
  cortesHoyInicial: number;
}) {
  const [estado, setEstado] = useState<Estado>(estadoInicial);
  const [desde, setDesde] = useState<string | null>(desdeInicial);
  const [cortesHoy, setCortesHoy] = useState(cortesHoyInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function cambiarEstado(nuevo: Estado) {
    const ahora = new Date().toISOString();
    const { error } = await crearClienteNavegador()
      .from("estado_barbero")
      .update({ estado: nuevo, desde: ahora })
      .eq("barbero_id", barberoId);
    if (error) throw error;
    setEstado(nuevo);
    setDesde(ahora);
  }

  async function ejecutar(accion: () => Promise<void>) {
    setGuardando(true);
    setError(null);
    setAviso(null);
    try {
      await accion();
    } catch (e) {
      setError(`No se guardó: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setGuardando(false);
    }
  }

  const terminarCorte = () =>
    ejecutar(async () => {
      const { error } = await crearClienteNavegador().from("cortes")
        .insert({ barbero_id: barberoId, inicio: estado === "atendiendo" ? desde : null });
      if (error) throw error;
      setCortesHoy((n) => n + 1);
      await cambiarEstado("libre");
      setAviso("✓ Corte registrado");
    });

  const atendiendo = estado === "atendiendo";

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`rounded-2xl border p-5 text-center ${
          atendiendo ? "border-ladrillo/60 bg-ladrillo/20" : "border-emerald-500/40 bg-emerald-900/30"
        }`}
      >
        <p className="text-sm text-crema/70">Ahora estás</p>
        <p className={`font-serif text-4xl ${atendiendo ? "text-crema" : "text-emerald-300"}`}>
          {atendiendo ? "Atendiendo" : "Libre"}
        </p>
      </div>

      {atendiendo ? (
        <button
          onClick={terminarCorte}
          disabled={guardando}
          className="rounded-2xl bg-oro py-8 text-2xl font-bold text-noche transition active:scale-[0.98] disabled:opacity-50"
        >
          ✂️ Corte terminado
        </button>
      ) : (
        <button
          onClick={() => ejecutar(() => cambiarEstado("atendiendo"))}
          disabled={guardando}
          className="rounded-2xl bg-oro py-8 text-2xl font-bold text-noche transition active:scale-[0.98] disabled:opacity-50"
        >
          💈 Empezar a atender
        </button>
      )}

      {atendiendo && (
        <button
          onClick={() => ejecutar(() => cambiarEstado("libre"))}
          disabled={guardando}
          className="rounded-xl border border-crema/20 py-3 text-sm text-crema/70 transition hover:bg-crema/10 disabled:opacity-50"
        >
          Me equivoqué, sigo libre (no cuenta corte)
        </button>
      )}

      {aviso && <p className="rounded-lg bg-emerald-900/50 p-3 text-center text-emerald-200">{aviso}</p>}
      {error && <p className="rounded-lg bg-ladrillo/30 p-3 text-center text-sm">{error}</p>}

      <p className="text-center text-crema/70">
        Cortes de hoy: <span className="font-serif text-2xl text-oro">{cortesHoy}</span>
      </p>
    </div>
  );
}
