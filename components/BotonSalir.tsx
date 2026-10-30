"use client";

import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";

export function BotonSalir() {
  const router = useRouter();

  async function salir() {
    await crearClienteNavegador().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <button
      onClick={salir}
      className="rounded-xl border border-crema/20 px-4 py-2 text-sm text-crema/70 transition hover:bg-crema/10"
    >
      Cerrar sesión
    </button>
  );
}
