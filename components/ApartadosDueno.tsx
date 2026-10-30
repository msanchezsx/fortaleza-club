"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { precioBonito, type Apartado } from "@/lib/productos";
import { crearClienteNavegador } from "@/lib/supabase/client";

// Apartados pendientes: el dueño los entrega (ya pagados) o los cancela.
export function ApartadosDueno({ apartados }: { apartados: Apartado[] }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cambiar(a: Apartado, estado: "entregado" | "cancelado") {
    if (estado === "cancelado" && !confirm("¿Cancelar este apartado?")) return;
    setOcupado(a.id);
    setError(null);
    const { error } = await crearClienteNavegador().rpc("cambiar_apartado", {
      p_apartado: a.id,
      p_estado: estado,
    });
    setOcupado(null);
    if (error) setError(error.message);
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-oro/40 bg-carbon p-5">
      <h2 className="font-serif text-xl text-oro">Apartados por entregar</h2>
      {error && <p className="mt-2 rounded-lg bg-ladrillo/30 p-3 text-sm">{error}</p>}
      {apartados.length === 0 ? (
        <p className="mt-2 text-sm text-crema/60">No hay apartados pendientes.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {apartados.map((a) => (
            <li key={a.id} className="rounded-xl bg-noche p-4">
              <p className="text-crema">
                <span className="font-semibold">
                  {a.cantidad} × {a.productos?.nombre}
                </span>
                {a.productos && (
                  <span className="text-crema/70"> · {precioBonito(a.productos.precio * a.cantidad)}</span>
                )}
              </p>
              <p className="mt-1 text-sm text-crema/60">
                {a.perfiles?.nombre ?? "Cliente"}
                {a.perfiles?.telefono && (
                  <>
                    {" · "}
                    <a
                      href={`https://wa.me/52${a.perfiles.telefono.replace(/\D/g, "").slice(-10)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-oro underline-offset-4 hover:underline"
                    >
                      WhatsApp
                    </a>
                  </>
                )}
                {" · "}
                {new Date(a.creado_en).toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "short",
                  timeZone: "America/Mexico_City",
                })}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={ocupado === a.id}
                  onClick={() => cambiar(a, "entregado")}
                  className="flex-1 rounded-lg bg-oro px-4 py-2 font-semibold text-noche disabled:opacity-50"
                >
                  Pagado y entregado
                </button>
                <button
                  type="button"
                  disabled={ocupado === a.id}
                  onClick={() => cambiar(a, "cancelado")}
                  className="rounded-lg border border-ladrillo px-4 py-2 text-ladrillo disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
