"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/client";

type Props = {
  nombreInicial: string;
  telefonoInicial: string;
  favoritoInicial: string | null;
  barberos: { id: string; nombre: string }[];
};

// Datos del cliente y su barbero favorito.
export function MiPerfil({ nombreInicial, telefonoInicial, favoritoInicial, barberos }: Props) {
  const router = useRouter();
  const [nombre, setNombre] = useState(nombreInicial);
  const [telefono, setTelefono] = useState(telefonoInicial);
  const [favorito, setFavorito] = useState(favoritoInicial);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    const { error } = await crearClienteNavegador().rpc("actualizar_mi_perfil", {
      p_nombre: nombre,
      p_telefono: telefono,
      p_favorito: favorito,
    });
    setGuardando(false);
    setMensaje(error ? { ok: false, texto: error.message } : { ok: true, texto: "Listo, guardado." });
    if (!error) router.refresh();
  }

  const campo = "rounded-xl border border-crema/15 bg-noche px-4 py-3 text-crema outline-none focus:border-oro";

  return (
    <form onSubmit={guardar} className="flex flex-col gap-4 rounded-2xl border border-oro/20 bg-carbon p-5">
      <label className="flex flex-col gap-1 text-sm text-crema/70">
        Nombre
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} required className={campo} />
      </label>
      <label className="flex flex-col gap-1 text-sm text-crema/70">
        WhatsApp (opcional)
        <input
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          type="tel"
          inputMode="tel"
          placeholder="55 1234 5678"
          className={campo}
        />
      </label>

      <fieldset>
        <legend className="font-serif text-xl text-oro">Mi barbero favorito</legend>
        <p className="mt-1 text-sm text-crema/60">En la página de inicio verás si está libre.</p>
        {barberos.length === 0 ? (
          <p className="mt-3 text-sm text-crema/50">Todavía no hay barberos registrados.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[{ id: "", nombre: "Cualquiera" }, ...barberos].map((b) => {
              const elegido = (favorito ?? "") === b.id;
              return (
                <button
                  key={b.id || "ninguno"}
                  type="button"
                  onClick={() => setFavorito(b.id || null)}
                  aria-pressed={elegido}
                  className={`rounded-xl border px-3 py-3 text-sm transition ${
                    elegido ? "border-oro bg-oro/15 font-semibold text-oro" : "border-crema/15 text-crema/80 hover:border-oro/50"
                  }`}
                >
                  {elegido && b.id ? "★ " : ""}
                  {b.nombre}
                </button>
              );
            })}
          </div>
        )}
      </fieldset>

      {mensaje && (
        <p className={`rounded-lg p-3 text-sm ${mensaje.ok ? "bg-emerald-500/15 text-emerald-300" : "bg-ladrillo/30"}`}>
          {mensaje.texto}
        </p>
      )}
      <button
        disabled={guardando}
        className="rounded-xl bg-oro px-6 py-3 font-semibold text-noche transition hover:bg-oro-claro disabled:opacity-50"
      >
        {guardando ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
