"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoCastillo } from "@/components/LogoCastillo";
import { crearClienteNavegador } from "@/lib/supabase/client";

// Se llega aquí desde el correo de "¿Olvidaste tu contraseña?" (ya con la sesión abierta).
export function NuevaContrasena() {
  const [contrasena, setContrasena] = useState("");
  const [ver, setVer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    const { error } = await crearClienteNavegador().auth.updateUser({ password: contrasena });
    setEnviando(false);
    if (error) {
      setError(
        error.message.includes("session")
          ? "El enlace ya caducó. Vuelve a pedir el correo desde Entrar."
          : error.message.includes("different")
            ? "Escribe una contraseña distinta a la anterior."
            : error.message,
      );
      return;
    }
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- /entrar es una ruta del servidor y queremos recarga completa
    window.location.assign("/entrar");
  }

  return (
    <div className="flex flex-col items-center text-center">
      <Link href="/" className="text-oro">
        <LogoCastillo className="h-16 w-16" />
      </Link>
      <h1 className="mt-4 font-serif text-3xl text-oro">Nueva contraseña</h1>
      <form onSubmit={guardar} className="mt-6 flex w-full flex-col gap-3 text-left">
        <label className="flex flex-col gap-1 text-sm text-crema/70">
          Escribe tu nueva contraseña
          <div className="relative">
            <input
              type={ver ? "text" : "password"}
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
              className="w-full rounded-xl border border-crema/15 bg-carbon px-4 py-3 pr-16 text-base text-crema outline-none focus:border-oro"
            />
            <button
              type="button"
              onClick={() => setVer(!ver)}
              className="absolute inset-y-0 right-3 text-sm text-oro"
            >
              {ver ? "Ocultar" : "Ver"}
            </button>
          </div>
        </label>
        {error && <p className="rounded-lg bg-ladrillo/30 p-3 text-sm">{error}</p>}
        <button
          disabled={enviando}
          className="mt-2 rounded-xl bg-oro px-6 py-4 font-semibold text-noche transition hover:bg-oro-claro disabled:opacity-50"
        >
          {enviando ? "Un momento…" : "Guardar y entrar"}
        </button>
      </form>
    </div>
  );
}
