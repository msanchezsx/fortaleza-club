"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { comprimirFoto } from "@/lib/comprimir";
import { crearClienteNavegador } from "@/lib/supabase/client";

const MAXIMO = 24;
type Foto = { ruta: string; url: string };

// Galería privada del cliente: fotos de sus cortes o de cortes que le gustan.
export function MisFotos({ clienteId }: { clienteId: string }) {
  const [fotos, setFotos] = useState<Foto[] | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<Foto | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  const cargar = useCallback(async () => {
    const almacen = crearClienteNavegador().storage.from("fotos");
    const { data: lista, error } = await almacen.list(clienteId, {
      limit: MAXIMO,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) {
      setError("No pudimos cargar tus fotos.");
      setFotos([]);
      return;
    }
    const rutas = (lista ?? [])
      .filter((f) => f.name.endsWith(".jpg"))
      .map((f) => `${clienteId}/${f.name}`);
    if (rutas.length === 0) {
      setFotos([]);
      return;
    }
    const { data: firmadas } = await almacen.createSignedUrls(rutas, 60 * 60);
    setFotos(
      (firmadas ?? []).flatMap((f) =>
        f.signedUrl && f.path ? [{ ruta: f.path, url: f.signedUrl }] : [],
      ),
    );
  }, [clienteId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde Supabase
    void cargar();
  }, [cargar]);

  async function subir(archivo: File | undefined) {
    if (!archivo) return;
    setError(null);
    setSubiendo(true);
    try {
      const foto = await comprimirFoto(archivo);
      const { error } = await crearClienteNavegador()
        .storage.from("fotos")
        .upload(`${clienteId}/${Date.now()}.jpg`, foto, {
          contentType: "image/jpeg",
        });
      if (error)
        throw new Error(
          error.message.includes("security")
            ? `Llegaste al máximo de ${MAXIMO} fotos.`
            : error.message,
        );
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la foto.");
    } finally {
      setSubiendo(false);
      if (entrada.current) entrada.current.value = "";
    }
  }

  async function borrar(foto: Foto) {
    if (!confirm("¿Borrar esta foto?")) return;
    setAbierta(null);
    const { error } = await crearClienteNavegador()
      .storage.from("fotos")
      .remove([foto.ruta]);
    if (error) setError("No se pudo borrar la foto.");
    else
      setFotos((actual) => (actual ?? []).filter((f) => f.ruta !== foto.ruta));
  }

  const llena = (fotos?.length ?? 0) >= MAXIMO;

  return (
    <section className="rounded-2xl border border-oro/20 bg-carbon p-5">
      <h2 className="font-serif text-xl text-oro">Mis fotos de cortes</h2>
      <p className="mt-1 text-sm text-crema/60">
        Guarda tus cortes favoritos o fotos de referencia para enseñárselas a tu
        barbero. Solo tú las ves.
      </p>

      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => subir(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => entrada.current?.click()}
        disabled={subiendo || llena || fotos === null}
        className="mt-4 w-full rounded-xl bg-oro px-6 py-3 font-semibold text-noche transition hover:bg-oro-claro disabled:opacity-50"
      >
        {subiendo
          ? "Subiendo…"
          : llena
            ? `Máximo ${MAXIMO} fotos`
            : "📷 Subir foto"}
      </button>
      {error && <p className="mt-3 text-sm text-ladrillo">{error}</p>}

      {fotos === null ? (
        <p className="mt-4 text-sm text-crema/60">Cargando fotos…</p>
      ) : fotos.length === 0 ? (
        <p className="mt-4 text-sm text-crema/60">Todavía no tienes fotos.</p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {fotos.map((f) => (
            <button
              key={f.ruta}
              type="button"
              onClick={() => setAbierta(f)}
              className="aspect-square overflow-hidden rounded-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada de Supabase */}
              <img
                src={f.url}
                alt="Foto de corte"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {abierta && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-noche/95 p-4"
          onClick={() => setAbierta(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada de Supabase */}
          <img
            src={abierta.url}
            alt="Foto de corte"
            className="max-h-[75vh] max-w-full rounded-xl"
          />
          <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setAbierta(null)}
              className="rounded-xl border border-oro/50 px-6 py-3 font-semibold text-oro"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => borrar(abierta)}
              className="rounded-xl border border-ladrillo px-6 py-3 font-semibold text-ladrillo"
            >
              Borrar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
