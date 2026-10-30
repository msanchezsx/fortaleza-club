"use client";

import { useEffect, useState } from "react";
import { estimarLiberacion, formatoReloj } from "@/lib/estimado";

// Reloj que baja segundo a segundo hasta que se desocupe el próximo barbero.
export function CuentaRegresiva({ inicios, duracionMin }: { inicios: string[]; duracionMin: number }) {
  const [ahora, setAhora] = useState(0);

  useEffect(() => {
    const tic = () => setAhora(Date.now());
    tic();
    const reloj = setInterval(tic, 1000);
    return () => clearInterval(reloj);
  }, []);

  if (!ahora) return null;
  const proximo = estimarLiberacion(inicios, duracionMin, ahora);
  if (!proximo) return null;

  return (
    <div className="mt-2 rounded-lg bg-oro/10 px-3 py-2 text-sm text-oro-claro">
      {proximo.segundos === 0 ? (
        <p>⏱ Un barbero se desocupa en cualquier momento</p>
      ) : (
        <p>
          ⏱ El próximo barbero se desocupa en{" "}
          <span className="font-mono text-base font-semibold tabular-nums text-oro">{formatoReloj(proximo.segundos)}</span>
        </p>
      )}
      {proximo.enDiezMin > 1 && (
        <p className="mt-1 text-xs text-crema/70">{proximo.enDiezMin} barberos se desocupan en los próximos 10 min</p>
      )}
    </div>
  );
}
