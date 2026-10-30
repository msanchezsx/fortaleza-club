"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ESTADO_PEDIDO,
  precioBonito,
  type EstadoPedido,
  type Pedido,
} from "@/lib/productos";
import { crearClienteNavegador } from "@/lib/supabase/client";

type PedidoDueno = Pedido & { comprobanteUrl: string | null };

// Pedidos por atender: confirmar pago, entregar o cancelar.
export function PedidosDueno({ pedidos }: { pedidos: PedidoDueno[] }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [foto, setFoto] = useState<string | null>(null);

  async function cambiar(
    p: PedidoDueno,
    estado: Exclude<EstadoPedido, "pendiente">,
  ) {
    if (estado === "cancelado" && !confirm(`¿Cancelar el pedido #${p.id}?`))
      return;
    setOcupado(p.id);
    setError(null);
    const { error } = await crearClienteNavegador().rpc("cambiar_pedido", {
      p_pedido: p.id,
      p_estado: estado,
    });
    setOcupado(null);
    if (error) setError(error.message);
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-oro/40 bg-carbon p-5">
      <h2 className="font-serif text-xl text-oro">Pedidos por atender</h2>
      {error && (
        <p className="mt-2 rounded-lg bg-ladrillo/30 p-3 text-sm">{error}</p>
      )}
      {pedidos.length === 0 ? (
        <p className="mt-2 text-sm text-crema/60">No hay pedidos pendientes.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {pedidos.map((p) => (
            <li key={p.id} className="rounded-xl bg-noche p-4 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-crema">
                  #{p.id} · {p.perfiles?.nombre ?? "Cliente"}
                </p>
                <p className="text-crema/70">{ESTADO_PEDIDO[p.estado]}</p>
              </div>
              <ul className="mt-2 text-crema/70">
                {p.pedido_items.map((it, i) => (
                  <li key={i}>
                    {it.cantidad} × {it.nombre} ·{" "}
                    {precioBonito(it.precio * it.cantidad)}
                  </li>
                ))}
              </ul>
              <p className="mt-2 flex justify-between text-crema">
                <span>
                  {p.metodo === "efectivo"
                    ? "💵 Paga en efectivo"
                    : "🏦 Transferencia"}
                </span>
                <b>{precioBonito(p.total)}</b>
              </p>
              <p className="mt-1 text-crema/60">
                {new Date(p.creado_en).toLocaleString("es-MX", {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: "America/Mexico_City",
                })}
                {p.perfiles?.telefono && (
                  <>
                    {" · "}
                    <a
                      href={`https://wa.me/52${p.perfiles.telefono.replace(/\D/g, "").slice(-10)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-oro underline-offset-4 hover:underline"
                    >
                      WhatsApp
                    </a>
                  </>
                )}
              </p>
              {p.comprobanteUrl && (
                <button
                  type="button"
                  onClick={() => setFoto(p.comprobanteUrl)}
                  className="mt-2 text-oro underline underline-offset-4"
                >
                  📎 Ver comprobante
                </button>
              )}
              <div className="mt-3 flex gap-2">
                {p.estado === "pendiente" ? (
                  <button
                    type="button"
                    disabled={ocupado === p.id}
                    onClick={() => cambiar(p, "pagado")}
                    className="flex-1 rounded-lg bg-oro px-3 py-2 font-semibold text-noche disabled:opacity-50"
                  >
                    {p.metodo === "efectivo"
                      ? "Pagó en efectivo"
                      : "Transferencia recibida"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={ocupado === p.id}
                    onClick={() => cambiar(p, "entregado")}
                    className="flex-1 rounded-lg bg-oro px-3 py-2 font-semibold text-noche disabled:opacity-50"
                  >
                    Entregado
                  </button>
                )}
                <button
                  type="button"
                  disabled={ocupado === p.id}
                  onClick={() => cambiar(p, "cancelado")}
                  className="rounded-lg border border-ladrillo px-3 py-2 text-ladrillo disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {foto && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-noche/95 p-4"
          onClick={() => setFoto(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- comprobante privado con enlace temporal */}
          <img
            src={foto}
            alt="Comprobante de transferencia"
            className="max-h-[80vh] max-w-full rounded-xl"
          />
          <button
            type="button"
            className="rounded-xl border border-oro/50 px-6 py-3 text-oro"
          >
            Cerrar
          </button>
        </div>
      )}
    </section>
  );
}
