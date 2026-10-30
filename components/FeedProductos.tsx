"use client";

import Link from "next/link";
import { useState } from "react";
import { CarritoHoja } from "@/components/CarritoHoja";
import { useCarrito } from "@/lib/carrito";
import { NEGOCIO } from "@/lib/negocio";
import {
  ES_DESTACADO,
  porcentajeDescuento,
  precioBonito,
  type Pedido,
  type Producto,
} from "@/lib/productos";

// Productos a pantalla completa que se deslizan hacia arriba, estilo TikTok.
// Se agregan al carrito y se paga en efectivo en la sucursal o por transferencia.
export function FeedProductos({
  productos,
  pedidos,
  clienteId,
}: {
  productos: Producto[];
  pedidos: Pedido[];
  clienteId: string | null;
}) {
  const { carrito, piezas, agregar } = useCarrito();
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [verCarrito, setVerCarrito] = useState(false);
  const [abierta, setAbierta] = useState<number | null>(null);

  function alCarrito(p: Producto) {
    const destacado = ES_DESTACADO(p);
    agregar(p.id, destacado ? 1 : (cantidades[p.id] ?? 1), destacado ? 1 : 10);
    setAviso(`${p.nombre} está en tu carrito.`);
    setTimeout(() => setAviso(null), 3500);
  }

  function compartir(p: Producto) {
    const texto = `Mira esto en ${NEGOCIO.nombre}: ${p.nombre} a ${precioBonito(p.precio)} ${NEGOCIO.sitio}/productos`;
    return `https://wa.me/?text=${encodeURIComponent(texto)}`;
  }

  return (
    <div className="fixed inset-0 bg-noche">
      {/* Barra de arriba, encima de los productos */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 mx-auto flex max-w-md items-center justify-between bg-gradient-to-b from-noche/90 to-transparent px-4 pt-4 pb-8">
        <Link
          href="/"
          className="pointer-events-auto rounded-full bg-noche/60 px-4 py-2 text-sm text-crema backdrop-blur"
        >
          ← Inicio
        </Link>
        <p className="font-serif text-lg text-oro">Productos</p>
        <button
          type="button"
          onClick={() => setVerCarrito(true)}
          className="pointer-events-auto relative rounded-full bg-noche/60 px-4 py-2 text-sm text-crema backdrop-blur"
          aria-label={`Carrito, ${piezas} piezas`}
        >
          🛒
          {piezas > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ladrillo px-1 text-xs font-bold">
              {piezas}
            </span>
          )}
        </button>
      </header>

      {productos.length === 0 ? (
        <p className="mx-auto mt-32 max-w-md px-6 text-center text-crema/70">
          Muy pronto verás aquí nuestros productos.
        </p>
      ) : (
        <div className="mx-auto h-full max-w-md snap-y snap-mandatory overflow-y-auto overscroll-contain">
          {productos.map((p, i) => {
            const descuento = porcentajeDescuento(p);
            const destacado = ES_DESTACADO(p);
            return (
              <section
                key={p.id}
                className="relative h-full snap-start snap-always overflow-hidden"
              >
                {/* Fondo: la foto borrosa llena la pantalla y encima la foto completa */}
                {p.foto ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element -- foto de producto */}
                    <img
                      src={p.foto}
                      alt=""
                      aria-hidden
                      className="absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-2xl"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element -- foto de producto */}
                    <img
                      src={p.foto}
                      alt={p.nombre}
                      loading={i < 2 ? "eager" : "lazy"}
                      className="absolute inset-x-4 top-20 bottom-[42%] m-auto max-h-[46%] w-[calc(100%-2rem)] rounded-2xl object-contain"
                    />
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-start bg-gradient-to-b from-oro/30 via-carbon to-noche pt-28">
                    <span className="text-8xl">{destacado ? "🎓" : "✂️"}</span>
                    <p className="mt-4 font-serif text-2xl tracking-widest text-oro uppercase">
                      {destacado ? "Curso" : NEGOCIO.nombre}
                    </p>
                  </div>
                )}

                {descuento && (
                  <span className="absolute top-20 left-4 z-10 rounded-full bg-ladrillo px-4 py-2 text-lg font-bold text-crema shadow-lg">
                    -{descuento}%
                  </span>
                )}

                {/* Botones del costado, como en TikTok */}
                <div className="absolute right-3 bottom-[44%] z-10 flex flex-col items-center gap-4">
                  <a
                    href={compartir(p)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center text-xs text-crema"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-noche/70 text-2xl backdrop-blur">
                      📲
                    </span>
                    <span className="mt-1 rounded-full bg-noche/70 px-2 py-0.5">
                      Compartir
                    </span>
                  </a>
                  <span className="rounded-full bg-noche/70 px-3 py-1 text-xs text-crema/80 backdrop-blur">
                    {i + 1} / {productos.length}
                  </span>
                </div>

                {/* Información del producto */}
                <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-noche via-noche/95 to-transparent px-5 pt-16 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                  <h2 className="font-serif text-3xl leading-tight text-oro">
                    {p.nombre}
                  </h2>
                  {p.descripcion && (
                    <button
                      type="button"
                      onClick={() => setAbierta(abierta === p.id ? null : p.id)}
                      className={`mt-2 text-left text-sm text-crema/80 ${abierta === p.id ? "" : "line-clamp-2"}`}
                    >
                      {p.descripcion}
                    </button>
                  )}

                  <div className="mt-3 flex items-baseline gap-3">
                    <p className="text-3xl font-bold text-crema">
                      {precioBonito(p.precio)}
                    </p>
                    {p.precio_antes && descuento && (
                      <p className="text-lg text-crema/50 line-through">
                        {precioBonito(p.precio_antes)}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    {!destacado && (
                      <select
                        aria-label="Cantidad"
                        value={cantidades[p.id] ?? 1}
                        onChange={(e) =>
                          setCantidades({
                            ...cantidades,
                            [p.id]: Number(e.target.value),
                          })
                        }
                        className="rounded-xl border border-crema/15 bg-noche px-3 py-3 text-crema"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    )}
                    {destacado && carrito[p.id] ? (
                      <button
                        type="button"
                        onClick={() => setVerCarrito(true)}
                        className="flex-1 rounded-xl border border-oro px-6 py-3 font-semibold text-oro"
                      >
                        ✓ En tu carrito
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => alCarrito(p)}
                        className="flex-1 rounded-xl bg-oro px-6 py-3 font-semibold text-noche transition hover:bg-oro-claro"
                      >
                        🛒 Agregar al carrito
                      </button>
                    )}
                  </div>

                  {i === 0 && productos.length > 1 && (
                    <p className="mt-3 animate-bounce text-center text-xs text-crema/60">
                      Desliza hacia arriba ↑
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {aviso && (
        <div
          role="status"
          className="absolute inset-x-4 top-20 z-30 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl bg-oro p-4 text-sm text-noche shadow-xl"
        >
          <span>{aviso}</span>
          <button
            type="button"
            onClick={() => {
              setAviso(null);
              setVerCarrito(true);
            }}
            className="shrink-0 rounded-lg bg-noche px-3 py-2 font-semibold text-oro"
          >
            Ver carrito
          </button>
        </div>
      )}

      {verCarrito && (
        <CarritoHoja
          productos={productos}
          pedidos={pedidos}
          clienteId={clienteId}
          onCerrar={() => setVerCarrito(false)}
        />
      )}
    </div>
  );
}
