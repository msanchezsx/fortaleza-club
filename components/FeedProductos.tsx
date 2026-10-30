"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NEGOCIO } from "@/lib/negocio";
import {
  porcentajeDescuento,
  precioBonito,
  type Apartado,
  type Producto,
} from "@/lib/productos";
import { crearClienteNavegador } from "@/lib/supabase/client";

// Los productos con orden alto (como el curso) van al final y no piden cantidad.
const ES_DESTACADO = (p: Producto) => p.orden >= 1000;

// Productos a pantalla completa que se deslizan hacia arriba, estilo TikTok.
export function FeedProductos({
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
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );
  const [verApartados, setVerApartados] = useState(false);
  const [abierta, setAbierta] = useState<number | null>(null);

  async function apartar(p: Producto) {
    setOcupado(p.id);
    setMensaje(null);
    const { error } = await crearClienteNavegador().rpc("apartar_producto", {
      p_producto: p.id,
      p_cantidad: ES_DESTACADO(p) ? 1 : (cantidades[p.id] ?? 1),
    });
    setOcupado(null);
    setMensaje(
      error
        ? { ok: false, texto: error.message }
        : {
            ok: true,
            texto: ES_DESTACADO(p)
              ? `¡Listo! Apartaste tu lugar en ${p.nombre}. Te esperamos en la barbería.`
              : `¡Listo! Apartaste ${p.nombre}. Págalo y recógelo en la barbería.`,
          },
    );
    if (!error) router.refresh();
    setTimeout(() => setMensaje(null), 4000);
  }

  async function cancelar(a: Apartado) {
    if (
      !confirm(
        `¿Cancelar el apartado de ${a.productos?.nombre ?? "este producto"}?`,
      )
    )
      return;
    const { error } = await crearClienteNavegador().rpc("cambiar_apartado", {
      p_apartado: a.id,
      p_estado: "cancelado",
    });
    if (error) setMensaje({ ok: false, texto: error.message });
    router.refresh();
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
        {conSesion ? (
          <button
            type="button"
            onClick={() => setVerApartados(true)}
            className="pointer-events-auto rounded-full bg-noche/60 px-4 py-2 text-sm text-crema backdrop-blur"
          >
            🛍️ {apartados.length}
          </button>
        ) : (
          <span className="w-16" />
        )}
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

                  {conSesion ? (
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
                      <button
                        type="button"
                        onClick={() => apartar(p)}
                        disabled={ocupado !== null}
                        className="flex-1 rounded-xl bg-oro px-6 py-3 font-semibold text-noche transition hover:bg-oro-claro disabled:opacity-50"
                      >
                        {ocupado === p.id
                          ? "Apartando…"
                          : destacado
                            ? "Apartar mi lugar"
                            : "Apartar"}
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/login?siguiente=/productos"
                      className="mt-4 block rounded-xl bg-oro px-6 py-3 text-center font-semibold text-noche"
                    >
                      Entra para apartar
                    </Link>
                  )}

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

      {mensaje && (
        <p
          role="status"
          className={`absolute inset-x-4 top-20 z-30 mx-auto max-w-md rounded-xl p-4 text-sm shadow-xl ${
            mensaje.ok ? "bg-oro text-noche" : "bg-ladrillo text-crema"
          }`}
        >
          {mensaje.texto}
        </p>
      )}

      {/* Mis apartados: hoja que sube desde abajo */}
      {verApartados && (
        <div
          className="absolute inset-0 z-40 flex items-end bg-noche/70"
          onClick={() => setVerApartados(false)}
        >
          <section
            onClick={(e) => e.stopPropagation()}
            className="mx-auto w-full max-w-md rounded-t-3xl border-t border-oro/40 bg-carbon p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-oro">Mis apartados</h2>
              <button
                type="button"
                onClick={() => setVerApartados(false)}
                className="text-crema/70"
              >
                Cerrar
              </button>
            </div>
            {apartados.length === 0 ? (
              <p className="mt-3 text-sm text-crema/60">
                Todavía no apartas nada.
              </p>
            ) : (
              <>
                <p className="mt-1 text-sm text-crema/60">
                  Pásalos a recoger y pagar en la barbería.
                </p>
                <ul className="mt-3 flex flex-col gap-2">
                  {apartados.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-noche px-4 py-3"
                    >
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
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
