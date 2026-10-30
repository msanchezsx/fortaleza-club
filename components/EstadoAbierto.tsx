"use client";

import { useEffect, useState } from "react";
import { estaAbierto } from "@/lib/negocio";

// Se calcula en el celular del cliente y se revisa cada minuto.
export function EstadoAbierto() {
  const [abierto, setAbierto] = useState<boolean | null>(null);

  useEffect(() => {
    const revisar = () => setAbierto(estaAbierto());
    revisar();
    const id = setInterval(revisar, 60_000);
    return () => clearInterval(id);
  }, []);

  if (abierto === null) {
    return <p className="inline-flex h-7 w-40 animate-pulse rounded-full bg-crema/10" />;
  }

  return (
    <p
      className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-sm font-semibold ${
        abierto ? "bg-emerald-900/50 text-emerald-300" : "bg-ladrillo/30 text-crema"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${abierto ? "bg-emerald-400" : "bg-ladrillo"}`} />
      {abierto ? "Abierto ahora" : "Cerrado, abrimos a las 11 am"}
    </p>
  );
}
