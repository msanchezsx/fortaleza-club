import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Catalogo } from "@/components/Catalogo";
import { LogoCastillo } from "@/components/LogoCastillo";
import { Cargando } from "@/components/Panel";
import type { Apartado, Producto } from "@/lib/productos";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";

export default function PaginaProductos() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <header>
        <Link href="/" className="flex items-center gap-2 text-oro">
          <LogoCastillo className="h-8 w-8" />
          <span className="font-serif text-lg">La Fortaleza</span>
        </Link>
      </header>
      <h1 className="mt-8 font-serif text-3xl text-oro">Productos</h1>
      <p className="mt-1 text-crema/70">Apártalo aquí y págalo cuando pases a la barbería.</p>
      <Suspense fallback={<Cargando />}>
        <ListaProductos />
      </Suspense>
    </main>
  );
}

async function ListaProductos() {
  await connection();
  if (!supabaseConfigurado) return null;
  const supabase = await crearClienteServidor();
  const [{ data: productos }, { data: claims }] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, descripcion, precio, foto, activo")
      .eq("activo", true)
      .order("nombre"),
    supabase.auth.getClaims(),
  ]);
  const usuario = claims?.claims.sub;

  const { data: apartados } = usuario
    ? await supabase
        .from("apartados")
        .select("id, cantidad, creado_en, productos (nombre, precio)")
        .eq("cliente_id", usuario)
        .eq("estado", "pendiente")
        .order("creado_en")
    : { data: [] };

  const lista = ((productos ?? []) as Producto[]).map((p) => ({
    ...p,
    foto: p.foto ? supabase.storage.from("productos").getPublicUrl(p.foto).data.publicUrl : null,
  }));

  return (
    <Catalogo
      productos={lista}
      apartados={(apartados ?? []) as unknown as Apartado[]}
      conSesion={Boolean(usuario)}
    />
  );
}
