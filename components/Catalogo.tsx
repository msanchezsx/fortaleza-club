"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { precioBonito, type Apartado, type Producto } from "@/lib/productos";
import { crearClienteNavegador } from "@/lib/supabase/client";

// Lista pública de productos. Con sesión, el cliente aparta y ve sus apartados.
export function Catalogo({
  productos,
  apartados,
  conSesion,
}: {
  productos: Producto[];
  apartados: Apartado[];
  conSesion: boolean;
}) {
  const router = useRouter();
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  async function apartar(p: Producto) {
    setOcupado(p.id);
    setMensaje(null);
    const { error } = await crearClienteNavegador().rpc("apartar_producto", {
      p_producto: p.id,
      p_cantidad: cantidades[p.id] ?? 1,
    });
    setOcupado(null);
    setMensaje(
      error
        ? { ok: false, texto: error.message }
        : { ok: true, texto: `¡Listo! Apartaste ${p.nombre}. Págalo y recógelo en la barbería.` },
    );
    if (!error) router.refresh();
  }

  async function cancelar(a: Apartado) {
    if (!confirm(`¿Cancelar el apartado de ${a.productos?.nombre ?? "este producto"}?`)) return;
    const { error } = await crearClienteNavegador().rpc("cambiar_apartado", {
      p_apartado: a.id,
      p_estado: "cancelado",
    });
    setMensaje(error ? { ok: false, texto: error.message } : null);
    router.refresh();
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {apartados.length > 0 && (
        <section className="rounded-2xl border border-oro/40 bg-carbon p-5">
          <h2 className="font-serif text-xl text-oro">Mis apartados</h2>
          <p className="mt-1 text-sm text-crema/60">Pásalos a recoger y pagar en la barbería.</p>
          <ul className="mt-3 flex flex-col gap-2">
            {apartados.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl bg-noche px-4 py-3">
                <span className="text-crema">
                  {a.cantidad} × {a.productos?.nombre}
                  {a.productos && (
                    <span className="block text-sm text-crema/60">
                      {precioBonito(a.productos.precio * a.cantidad)}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => cancelar(a)}
                  className="rounded-lg border border-ladrillo px-3 py-2 text-sm text-ladrillo"
                >
                  Cancelar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {mensaje && (
        <p
          className={`rounded-xl p-4 text-sm ${mensaje.ok ? "bg-oro/15 text-crema" : "bg-ladrillo/30 text-crema"}`}
          role="status"
        >
          {mensaje.texto}
        </p>
      )}

      {productos.length === 0 ? (
        <p className="rounded-2xl border border-oro/20 bg-carbon p-5 text-crema/70">
          Muy pronto verás aquí nuestros productos.
        </p>
      ) : (
        productos.map((p) => (
          <article key={p.id} className="overflow-hidden rounded-2xl border border-oro/20 bg-carbon">
            {p.foto && (
              // eslint-disable-next-line @next/next/no-img-element -- foto pública de Supabase
              <img src={p.foto} alt={p.nombre} className="aspect-[4/3] w-full object-cover" />
            )}
            <div className="p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-serif text-2xl text-oro">{p.nombre}</h2>
                <p className="text-lg font-semibold text-crema">{precioBonito(p.precio)}</p>
              </div>
              {p.descripcion && <p className="mt-2 text-sm text-crema/70">{p.descripcion}</p>}

              {conSesion ? (
                <div className="mt-4 flex gap-2">
                  <select
                    aria-label="Cantidad"
                    value={cantidades[p.id] ?? 1}
                    onChange={(e) => setCantidades({ ...cantidades, [p.id]: Number(e.target.value) })}
                    className="rounded-xl border border-crema/15 bg-noche px-3 py-3 text-crema"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => apartar(p)}
                    disabled={ocupado !== null}
                    className="flex-1 rounded-xl bg-oro px-6 py-3 font-semibold text-noche transition hover:bg-oro-claro disabled:opacity-50"
                  >
                    {ocupado === p.id ? "Apartando…" : "Apartar"}
                  </button>
                </div>
              ) : (
                <Link
                  href="/login?siguiente=/productos"
                  className="mt-4 block rounded-xl border border-oro/50 px-6 py-3 text-center font-semibold text-oro"
                >
                  Entra para apartar
                </Link>
              )}
            </div>
          </article>
        ))
      )}
    </div>
  );
}
