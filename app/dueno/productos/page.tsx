import Link from "next/link";
import { Suspense } from "react";
import { AdministrarProductos } from "@/components/AdministrarProductos";
import { ApartadosDueno } from "@/components/ApartadosDueno";
import { Cargando, Panel } from "@/components/Panel";
import {
  COLUMNAS_PRODUCTO,
  urlFoto,
  type Apartado,
  type Producto,
} from "@/lib/productos";
import { exigirRol } from "@/lib/roles";
import { crearClienteServidor } from "@/lib/supabase/server";

export default function PaginaProductosDueno() {
  return (
    <Suspense fallback={<Cargando />}>
      <ProductosDueno />
    </Suspense>
  );
}

async function ProductosDueno() {
  const perfil = await exigirRol(["dueno"], "/dueno/productos");
  const supabase = await crearClienteServidor();
  const [{ data: productos }, { data: apartados }] = await Promise.all([
    supabase
      .from("productos")
      .select(COLUMNAS_PRODUCTO)
      .order("activo", { ascending: false })
      .order("orden")
      .order("id"),
    supabase
      .from("apartados")
      .select(
        "id, cantidad, creado_en, productos (nombre, precio), perfiles (nombre, telefono)",
      )
      .eq("estado", "pendiente")
      .order("creado_en"),
  ]);

  const lista = ((productos ?? []) as Producto[]).map((p) => ({
    ...p,
    fotoUrl: urlFoto(
      p.foto,
      (ruta) =>
        supabase.storage.from("productos").getPublicUrl(ruta).data.publicUrl,
    ),
  }));

  return (
    <Panel titulo="Productos" nombre={perfil.nombre}>
      <Link
        href="/dueno"
        className="text-sm text-oro/80 underline-offset-4 hover:underline"
      >
        ← Volver al panel
      </Link>
      <ApartadosDueno apartados={(apartados ?? []) as unknown as Apartado[]} />
      <AdministrarProductos productos={lista} />
    </Panel>
  );
}
