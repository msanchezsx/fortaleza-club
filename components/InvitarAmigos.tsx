"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { NEGOCIO } from "@/lib/negocio";
import { crearClienteNavegador } from "@/lib/supabase/client";

export type Referidos = {
  descuento: string;
  activo: boolean;
  invitados: number;
  disponibles: number;
  invitado_por: string | null;
};

// Enlace para invitar amigos y descuentos ganados.
export function InvitarAmigos({ codigo, referidos }: { codigo: string; referidos: Referidos }) {
  const router = useRouter();
  const [copiado, setCopiado] = useState(false);
  const [codigoAmigo, setCodigoAmigo] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!referidos.activo) return null;
  const { descuento, invitados, disponibles, invitado_por } = referidos;
  const enlace = `${NEGOCIO.sitio}/login?invita=${codigo}`;
  const mensaje = `¡Te invito a La Fortaleza Barbería! Crea tu cuenta con mi código ${codigo} y te dan ${descuento} en tu primer corte: ${enlace}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  async function usarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await crearClienteNavegador().rpc("usar_invitacion", { p_codigo: codigoAmigo });
    if (error) setError(error.message);
    else router.refresh();
  }

  return (
    <section className="rounded-2xl border border-oro/20 bg-carbon p-5">
      <p className="font-serif text-xl text-oro">Invita a tus amigos</p>
      <p className="mt-1 text-sm text-crema/70">
        Tu amigo recibe <b className="text-crema">{descuento}</b> en su primer corte, y tú también cuando venga.
      </p>

      {disponibles > 0 && (
        <p className="mt-4 rounded-xl bg-emerald-400/15 p-3 text-center font-semibold text-emerald-300">
          💸 Tienes {disponibles === 1 ? descuento : `${disponibles} descuentos`}. Avísale a tu barbero.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-oro px-4 py-3 text-center text-sm font-semibold text-noche"
        >
          Invitar por WhatsApp
        </a>
        <button onClick={copiar} className="rounded-xl border border-oro/50 px-4 py-3 text-sm text-oro">
          {copiado ? "✓ Enlace copiado" : "Copiar enlace"}
        </button>
      </div>
      <p className="mt-3 text-sm text-crema/60">
        {invitados === 0 ? "Todavía no has invitado a nadie." : `Has invitado a ${invitados} ${invitados === 1 ? "amigo" : "amigos"}.`}
        {invitado_por && ` Te invitó ${invitado_por}.`}
      </p>

      {!invitado_por && (
        <form onSubmit={usarCodigo} className="mt-4 flex gap-2">
          <input
            value={codigoAmigo}
            onChange={(e) => setCodigoAmigo(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            placeholder="¿Te invitaron? Código"
            className="min-w-0 flex-1 rounded-xl border border-crema/15 bg-noche px-4 py-2 text-sm text-crema outline-none focus:border-oro"
          />
          <button disabled={codigoAmigo.length !== 4} className="rounded-xl border border-oro/50 px-4 text-sm text-oro disabled:opacity-40">
            Usar
          </button>
        </form>
      )}
      {error && <p className="mt-2 rounded-lg bg-ladrillo/30 p-3 text-sm">{error}</p>}
    </section>
  );
}
