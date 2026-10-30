"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useCarrito } from "@/lib/carrito";
import { comprimirFoto } from "@/lib/comprimir";
import { NEGOCIO, whatsappUrl } from "@/lib/negocio";
import {
  ES_DESTACADO,
  ESTADO_PEDIDO,
  precioBonito,
  type Pedido,
  type Producto,
} from "@/lib/productos";
import { crearClienteNavegador } from "@/lib/supabase/client";

type Metodo = "efectivo" | "transferencia";

// Hoja que sube desde abajo: carrito, forma de pago y mis pedidos.
export function CarritoHoja({
  productos,
  pedidos,
  clienteId,
  onCerrar,
}: {
  productos: Producto[];
  pedidos: Pedido[];
  clienteId: string | null;
  onCerrar: () => void;
}) {
  const router = useRouter();
  const { carrito, poner, vaciar } = useCarrito();
  const [pestana, setPestana] = useState<"carrito" | "pedidos">("carrito");
  const [metodo, setMetodo] = useState<Metodo | null>(null);
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);

  const porId = new Map(productos.map((p) => [p.id, p]));
  const renglones = Object.entries(carrito).flatMap(([id, cantidad]) => {
    const p = porId.get(Number(id));
    return p ? [{ p, cantidad }] : [];
  });
  const total = renglones.reduce(
    (suma, r) => suma + Number(r.p.precio) * r.cantidad,
    0,
  );
  const banco = NEGOCIO.transferencia;
  const hayDatosBanco = Boolean(banco.clabe);

  async function confirmar() {
    if (!clienteId || !metodo) return;
    setError(null);
    setEnviando(true);
    try {
      const supabase = crearClienteNavegador();
      let ruta: string | null = null;
      if (metodo === "transferencia") {
        if (!comprobante)
          throw new Error("Adjunta la foto de tu transferencia.");
        ruta = `${clienteId}/${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage
          .from("comprobantes")
          .upload(ruta, await comprimirFoto(comprobante), {
            contentType: "image/jpeg",
          });
        if (error) throw new Error(error.message);
      }
      const { data, error } = await supabase.rpc("crear_pedido", {
        p_items: renglones.map((r) => ({ id: r.p.id, cantidad: r.cantidad })),
        p_metodo: metodo,
        p_comprobante: ruta,
      });
      if (error) throw new Error(error.message);
      vaciar();
      setMetodo(null);
      setComprobante(null);
      setExito(
        metodo === "efectivo"
          ? `¡Pedido #${data} recibido! Pásalo a recoger y pagar en la sucursal.`
          : `¡Pedido #${data} recibido! Revisaremos tu transferencia y te avisamos.`,
      );
      setPestana("pedidos");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo hacer el pedido.");
    } finally {
      setEnviando(false);
    }
  }

  async function cancelar(pedido: Pedido) {
    if (!confirm(`¿Cancelar el pedido #${pedido.id}?`)) return;
    const { error } = await crearClienteNavegador().rpc("cambiar_pedido", {
      p_pedido: pedido.id,
      p_estado: "cancelado",
    });
    if (error) setError(error.message);
    router.refresh();
  }

  async function copiarClabe() {
    try {
      await navigator.clipboard.writeText(banco.clabe);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso para copiar: el cliente la puede copiar a mano.
    }
  }

  const opcion = (activa: boolean) =>
    `flex-1 rounded-xl border p-3 text-left text-sm transition ${
      activa
        ? "border-oro bg-oro/15 text-crema"
        : "border-crema/15 text-crema/80"
    }`;

  return (
    <div
      className="absolute inset-0 z-40 flex items-end bg-noche/70"
      onClick={onCerrar}
    >
      <section
        onClick={(e) => e.stopPropagation()}
        className="mx-auto flex max-h-[90%] w-full max-w-md flex-col rounded-t-3xl border-t border-oro/40 bg-carbon pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex gap-2" role="tablist">
            {(["carrito", "pedidos"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={pestana === t}
                onClick={() => setPestana(t)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  pestana === t ? "bg-oro text-noche" : "text-crema/70"
                }`}
              >
                {t === "carrito"
                  ? "🛒 Carrito"
                  : `Mis pedidos${pedidos.length ? ` (${pedidos.length})` : ""}`}
              </button>
            ))}
          </div>
          <button type="button" onClick={onCerrar} className="text-crema/70">
            Cerrar
          </button>
        </div>

        <div className="mt-3 overflow-y-auto px-5">
          {exito && (
            <p className="mb-3 rounded-xl bg-oro p-3 text-sm text-noche">
              {exito}
            </p>
          )}
          {error && (
            <p className="mb-3 rounded-xl bg-ladrillo/40 p-3 text-sm text-crema">
              {error}
            </p>
          )}

          {pestana === "carrito" ? (
            renglones.length === 0 ? (
              <p className="py-6 text-center text-sm text-crema/60">
                Tu carrito está vacío.
              </p>
            ) : (
              <>
                <ul className="flex flex-col gap-2">
                  {renglones.map(({ p, cantidad }) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 rounded-xl bg-noche p-3"
                    >
                      {p.foto ? (
                        // eslint-disable-next-line @next/next/no-img-element -- foto de producto
                        <img
                          src={p.foto}
                          alt=""
                          className="h-14 w-14 rounded-lg bg-crema object-contain"
                        />
                      ) : (
                        <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-oro/20 text-2xl">
                          {ES_DESTACADO(p) ? "🎓" : "✂️"}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-crema">
                          {p.nombre}
                        </p>
                        <p className="text-sm font-semibold text-oro">
                          {precioBonito(Number(p.precio) * cantidad)}
                        </p>
                      </div>
                      {ES_DESTACADO(p) ? (
                        <button
                          type="button"
                          onClick={() => poner(p.id, 0)}
                          className="text-sm text-ladrillo"
                        >
                          Quitar
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label="Uno menos"
                            onClick={() => poner(p.id, cantidad - 1)}
                            className="h-9 w-9 rounded-lg border border-crema/20 text-crema"
                          >
                            {cantidad === 1 ? "🗑" : "−"}
                          </button>
                          <span className="w-6 text-center text-crema">
                            {cantidad}
                          </span>
                          <button
                            type="button"
                            aria-label="Uno más"
                            onClick={() => poner(p.id, cantidad + 1)}
                            className="h-9 w-9 rounded-lg border border-crema/20 text-crema"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                <p className="mt-4 flex items-baseline justify-between text-crema">
                  <span>Total</span>
                  <span className="text-2xl font-bold">
                    {precioBonito(total)}
                  </span>
                </p>

                {!clienteId ? (
                  <Link
                    href="/login?siguiente=/productos"
                    className="mt-4 mb-2 block rounded-xl bg-oro px-6 py-3 text-center font-semibold text-noche"
                  >
                    Entra para hacer tu pedido
                  </Link>
                ) : (
                  <>
                    <p className="mt-5 text-sm font-semibold text-crema">
                      ¿Cómo vas a pagar?
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setMetodo("efectivo")}
                        className={opcion(metodo === "efectivo")}
                      >
                        💵 <b>Efectivo</b>
                        <span className="block text-xs text-crema/60">
                          Pagas al recoger en la sucursal
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMetodo("transferencia")}
                        className={opcion(metodo === "transferencia")}
                      >
                        🏦 <b>Transferencia</b>
                        <span className="block text-xs text-crema/60">
                          Adjuntas la foto del pago
                        </span>
                      </button>
                    </div>

                    {metodo === "transferencia" && (
                      <div className="mt-3 rounded-xl border border-oro/30 bg-noche p-4 text-sm text-crema/80">
                        {hayDatosBanco ? (
                          <>
                            <p>
                              Transfiere{" "}
                              <b className="text-crema">
                                {precioBonito(total)}
                              </b>{" "}
                              a:
                            </p>
                            <p className="mt-2">
                              {banco.banco} · {banco.titular}
                            </p>
                            <button
                              type="button"
                              onClick={copiarClabe}
                              className="mt-1 font-mono text-base text-oro underline-offset-4 hover:underline"
                            >
                              CLABE {banco.clabe}{" "}
                              {copiado ? "✓ copiada" : "(copiar)"}
                            </button>
                          </>
                        ) : (
                          <p>
                            Pídenos los datos para transferir por{" "}
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-oro underline"
                            >
                              WhatsApp
                            </a>
                            .
                          </p>
                        )}
                        <input
                          ref={entrada}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            setComprobante(e.target.files?.[0] ?? null)
                          }
                        />
                        <button
                          type="button"
                          onClick={() => entrada.current?.click()}
                          className="mt-3 w-full rounded-xl border border-oro/50 px-4 py-3 text-oro"
                        >
                          📎{" "}
                          {comprobante
                            ? `Comprobante: ${comprobante.name}`
                            : "Adjuntar comprobante"}
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={confirmar}
                      disabled={
                        !metodo ||
                        enviando ||
                        (metodo === "transferencia" && !comprobante)
                      }
                      className="mt-4 mb-2 w-full rounded-xl bg-oro px-6 py-4 font-semibold text-noche transition hover:bg-oro-claro disabled:opacity-40"
                    >
                      {enviando
                        ? "Enviando pedido…"
                        : `Confirmar pedido · ${precioBonito(total)}`}
                    </button>
                  </>
                )}
              </>
            )
          ) : pedidos.length === 0 ? (
            <p className="py-6 text-center text-sm text-crema/60">
              {clienteId
                ? "Todavía no tienes pedidos."
                : "Entra a tu cuenta para ver tus pedidos."}
            </p>
          ) : (
            <ul className="flex flex-col gap-3 pb-2">
              {pedidos.map((pedido) => (
                <li key={pedido.id} className="rounded-xl bg-noche p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-crema">
                      Pedido #{pedido.id}
                    </p>
                    <p className="text-crema/70">
                      {ESTADO_PEDIDO[pedido.estado]}
                    </p>
                  </div>
                  <ul className="mt-2 text-crema/70">
                    {pedido.pedido_items.map((it, i) => (
                      <li key={i}>
                        {it.cantidad} × {it.nombre}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 flex justify-between text-crema">
                    <span>
                      {pedido.metodo === "efectivo"
                        ? "💵 Efectivo en sucursal"
                        : "🏦 Transferencia"}
                    </span>
                    <b>{precioBonito(pedido.total)}</b>
                  </p>
                  {pedido.estado === "pendiente" && (
                    <button
                      type="button"
                      onClick={() => cancelar(pedido)}
                      className="mt-3 rounded-lg border border-ladrillo px-3 py-1 text-ladrillo"
                    >
                      Cancelar pedido
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
