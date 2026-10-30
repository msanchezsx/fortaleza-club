"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { estimarLiberacion, formatoReloj } from "@/lib/estimado";

type Props = { nombre: string; libre: boolean; desde: string; duracionMin: number };

// Tarjeta del barbero favorito: si está libre o cuánto le falta.
export function MiFavorito({ nombre, libre, desde, duracionMin }: Props) {
  const [ahora, setAhora] = useState(0);

  useEffect(() => {
    if (libre) return;
    const tic = () => setAhora(Date.now());
    tic();
    const reloj = setInterval(tic, 1000);
    return () => clearInterval(reloj);
  }, [libre]);

  const falta = !libre && ahora ? estimarLiberacion([desde], duracionMin, ahora)?.segundos : null;

  return (
    <Link
      href="/cuenta"
      className={`mb-4 block rounded-xl border px-4 py-3 ${
        libre ? "border-emerald-400/50 bg-emerald-400/10" : "border-oro/30 bg-oro/5"
      }`}
    >
      <p className="text-xs tracking-widest text-crema/60 uppercase">★ Tu barbero</p>
      <p className="mt-1 font-serif text-lg text-oro">{nombre}</p>
      {libre ? (
        <p className="text-sm text-emerald-300">Está libre ahora. ¡Es buen momento para venir!</p>
      ) : (
        <p className="text-sm text-crema/80">
          Está atendiendo
          {falta == null ? "" : falta === 0 ? ", termina en cualquier momento" : (
            <>
              , termina en{" "}
              <span className="font-mono font-semibold tabular-nums text-oro">{formatoReloj(falta)}</span> aprox.
            </>
          )}
        </p>
      )}
    </Link>
  );
}
