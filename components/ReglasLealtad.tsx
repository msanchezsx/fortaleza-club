"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/client";

// El dueño decide cuántos cortes dan uno gratis, o pausa el programa.
export function ReglasLealtad({
  cortesInicial,
  activoInicial,
  descuentoInicial,
  referidosInicial,
}: {
  cortesInicial: number;
  activoInicial: boolean;
  descuentoInicial: string;
  referidosInicial: boolean;
}) {
  const [descuento, setDescuento] = useState(descuentoInicial);
  const [referidos, setReferidos] = useState(referidosInicial);
  const router = useRouter();
  const [cortes, setCortes] = useState(cortesInicial);
  const [activo, setActivo] = useState(activoInicial);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  async function guardar() {
    setGuardando(true);
    setMensaje(null);
    const { error } = await crearClienteNavegador()
      .from("reglas_lealtad")
      .update({ cortes_para_gratis: cortes, activo, descuento_referido: descuento.trim() || descuentoInicial, referidos_activo: referidos })
      .eq("id", 1);
    setGuardando(false);
    setMensaje(error ? { ok: false, texto: error.message } : { ok: true, texto: "Listo, la regla ya aplica para todos." });
    if (!error) router.refresh();
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-oro/20 bg-carbon p-5">
      <div>
        <p className="font-serif text-xl text-oro">Cortes para uno gratis</p>
        <p className="mt-1 text-sm text-crema/60">Los cortes gratis no cuentan para la tarjeta.</p>
        <div className="mt-4 flex items-center justify-center gap-6">
          <button
            onClick={() => setCortes((n) => Math.max(2, n - 1))}
            aria-label="Menos"
            className="h-12 w-12 rounded-full border border-crema/20 text-2xl text-crema"
          >
            −
          </button>
          <p className="w-24 text-center">
            <span className="font-serif text-5xl text-oro tabular-nums">{cortes}</span>
            <span className="block text-sm text-crema/60">= 1 gratis</span>
          </p>
          <button
            onClick={() => setCortes((n) => Math.min(20, n + 1))}
            aria-label="Más"
            className="h-12 w-12 rounded-full border border-crema/20 text-2xl text-crema"
          >
            +
          </button>
        </div>
      </div>

      <label className="flex items-center justify-between gap-4 rounded-xl bg-noche/60 px-4 py-3">
        <span>
          <span className="block text-crema">Programa activo</span>
          <span className="text-sm text-crema/60">Si lo pausas, los clientes no ven ni ganan cortes gratis.</span>
        </span>
        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="h-6 w-6 accent-oro" />
      </label>

      <div className="flex flex-col gap-3 border-t border-crema/10 pt-5">
        <p className="font-serif text-xl text-oro">Invita a un amigo</p>
        <label className="flex flex-col gap-1 text-sm text-crema/70">
          Qué gana cada uno (el amigo y quien lo invitó)
          <input
            value={descuento}
            onChange={(e) => setDescuento(e.target.value)}
            maxLength={60}
            placeholder="$30 de descuento"
            className="rounded-xl border border-crema/15 bg-noche px-4 py-3 text-crema outline-none focus:border-oro"
          />
        </label>
        <label className="flex items-center justify-between gap-4 rounded-xl bg-noche/60 px-4 py-3">
          <span className="text-crema">Invitaciones activas</span>
          <input
            type="checkbox"
            checked={referidos}
            onChange={(e) => setReferidos(e.target.checked)}
            className="h-6 w-6 accent-oro"
          />
        </label>
      </div>

      {mensaje && (
        <p className={`rounded-lg p-3 text-sm ${mensaje.ok ? "bg-emerald-500/15 text-emerald-300" : "bg-ladrillo/30"}`}>
          {mensaje.texto}
        </p>
      )}
      <button
        onClick={guardar}
        disabled={guardando}
        className="rounded-xl bg-oro px-6 py-3 font-semibold text-noche transition hover:bg-oro-claro disabled:opacity-50"
      >
        {guardando ? "Guardando…" : "Guardar"}
      </button>
    </section>
  );
}
