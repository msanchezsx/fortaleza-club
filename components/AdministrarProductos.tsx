"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { comprimirFoto } from "@/lib/comprimir";
import { precioBonito, type Producto } from "@/lib/productos";
import { crearClienteNavegador } from "@/lib/supabase/client";

type ProductoDueno = Producto & { fotoUrl: string | null };

const campo = "rounded-xl border border-crema/15 bg-noche px-4 py-3 text-crema outline-none focus:border-oro";

// El dueño agrega productos con foto y precio, y los oculta o borra.
export function AdministrarProductos({ productos }: { productos: ProductoDueno[] }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    const supabase = crearClienteNavegador();
    try {
      let ruta: string | null = null;
      if (foto) {
        ruta = `${Date.now()}.jpg`;
        const { error } = await supabase.storage
          .from("productos")
          .upload(ruta, await comprimirFoto(foto), { contentType: "image/jpeg" });
        if (error) throw new Error(error.message);
      }
      const { error } = await supabase.from("productos").insert({
        nombre: nombre.trim(),
        precio: Number(precio),
        descripcion: descripcion.trim() || null,
        foto: ruta,
      });
      if (error) throw new Error(error.message);
      setNombre("");
      setPrecio("");
      setDescripcion("");
      setFoto(null);
      if (entrada.current) entrada.current.value = "";
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarActivo(p: ProductoDueno) {
    const { error } = await crearClienteNavegador().from("productos").update({ activo: !p.activo }).eq("id", p.id);
    if (error) setError(error.message);
    router.refresh();
  }

  async function borrar(p: ProductoDueno) {
    if (!confirm(`¿Borrar ${p.nombre}? También se borran sus apartados.`)) return;
    const supabase = crearClienteNavegador();
    const { error } = await supabase.from("productos").delete().eq("id", p.id);
    if (error) {
      setError(error.message);
      return;
    }
    if (p.foto) await supabase.storage.from("productos").remove([p.foto]);
    router.refresh();
  }

  return (
    <>
      <form onSubmit={agregar} className="flex flex-col gap-3 rounded-2xl border border-oro/20 bg-carbon p-5">
        <p className="font-serif text-xl text-oro">Agregar producto</p>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre (ej. Cera mate)"
          required
          className={campo}
        />
        <input
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          placeholder="Precio en pesos (ej. 150)"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.5"
          required
          className={campo}
        />
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción (opcional)"
          rows={2}
          className={campo}
        />
        <input
          ref={entrada}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          className="rounded-xl border border-oro/40 px-4 py-3 text-left text-oro"
        >
          📷 {foto ? `Foto: ${foto.name}` : "Elegir foto (opcional)"}
        </button>
        {error && <p className="rounded-lg bg-ladrillo/30 p-3 text-sm">{error}</p>}
        <button
          disabled={guardando}
          className="rounded-xl bg-oro px-6 py-3 font-semibold text-noche transition hover:bg-oro-claro disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Agregar producto"}
        </button>
      </form>

      {productos.length === 0 ? (
        <p className="text-center text-sm text-crema/50">Todavía no hay productos.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {productos.map((p) => (
            <li
              key={p.id}
              className={`flex items-center gap-3 rounded-2xl border border-oro/20 bg-carbon p-3 ${p.activo ? "" : "opacity-60"}`}
            >
              {p.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- foto pública de Supabase
                <img src={p.fotoUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <span className="h-16 w-16 rounded-lg bg-noche" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-crema">{p.nombre}</p>
                <p className="text-sm text-crema/60">
                  {precioBonito(p.precio)}
                  {!p.activo && " · Oculto"}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => cambiarActivo(p)}
                  className="rounded-lg border border-oro/40 px-3 py-1 text-sm text-oro"
                >
                  {p.activo ? "Ocultar" : "Mostrar"}
                </button>
                <button
                  type="button"
                  onClick={() => borrar(p)}
                  className="rounded-lg border border-ladrillo px-3 py-1 text-sm text-ladrillo"
                >
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
