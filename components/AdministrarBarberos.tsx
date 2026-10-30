"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/client";

export type Barbero = {
  id: string;
  nombre: string;
  correo: string | null;
  activo: boolean;
  perfil_id: string | null;
};

export function AdministrarBarberos({ barberos }: { barberos: Barbero[] }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    const { error } = await crearClienteNavegador()
      .from("barberos")
      .insert({ nombre: nombre.trim(), correo: correo.trim() || null });
    setGuardando(false);

    if (error) {
      setError(error.code === "23505" ? "Ya hay un barbero con ese correo." : error.message);
      return;
    }
    setNombre("");
    setCorreo("");
    router.refresh();
  }

  async function cambiarActivo(barbero: Barbero) {
    const { error } = await crearClienteNavegador()
      .from("barberos")
      .update({ activo: !barbero.activo })
      .eq("id", barbero.id);
    if (error) setError(error.message);
    router.refresh();
  }

  return (
    <>
      <form onSubmit={agregar} className="flex flex-col gap-3 rounded-2xl border border-oro/20 bg-carbon p-5">
        <p className="font-serif text-xl text-oro">Agregar barbero</p>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre"
          required
          className="rounded-xl border border-crema/15 bg-noche px-4 py-3 text-crema outline-none focus:border-oro"
        />
        <input
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          type="email"
          placeholder="Correo (con el que va a crear su cuenta)"
          className="rounded-xl border border-crema/15 bg-noche px-4 py-3 text-crema outline-none focus:border-oro"
        />
        {error && <p className="rounded-lg bg-ladrillo/30 p-3 text-sm">{error}</p>}
        <button
          disabled={guardando}
          className="rounded-xl bg-oro px-6 py-3 font-semibold text-noche transition hover:bg-oro-claro disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Agregar"}
        </button>
      </form>

      {barberos.length === 0 ? (
        <p className="text-center text-sm text-crema/50">Todavía no hay barberos.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {barberos.map((b) => (
            <li
              key={b.id}
              className={`flex items-center justify-between gap-3 rounded-2xl border border-oro/20 bg-carbon p-4 ${
                b.activo ? "" : "opacity-50"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-crema">{b.nombre}</p>
                <p className="truncate text-sm text-crema/60">{b.correo ?? "Sin correo"}</p>
                <p className={`mt-1 text-xs ${b.perfil_id ? "text-emerald-300" : "text-oro-claro"}`}>
                  {b.perfil_id ? "✓ Ya tiene cuenta" : "Esperando que cree su cuenta"}
                </p>
              </div>
              <button
                onClick={() => cambiarActivo(b)}
                className="shrink-0 rounded-xl border border-crema/20 px-3 py-2 text-sm text-crema/80 transition hover:bg-crema/10"
              >
                {b.activo ? "Desactivar" : "Activar"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
