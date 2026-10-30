import { connection } from "next/server";
import { Suspense } from "react";
import { FeedProductos } from "@/components/FeedProductos";
import { Cargando } from "@/components/Panel";
import {
  COLUMNAS_PRODUCTO,
  urlFoto,
  type Pedido,
  type Producto,
} from "@/lib/productos";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";

// Productos a pantalla completa: se deslizan hacia arriba como videos.
export default function PaginaProductos() {
  return (
    <Suspense fallback={<Cargando />}>
      <ListaProductos />
    </Suspense>
  );
}

async function ListaProductos() {
  await connection();
  if (!supabaseConfigurado) return null;
  const supabase = await crearClienteServidor();
  const [{ data: productos }, { data: claims }] = await Promise.all([
    supabase
      .from("productos")
      .select(COLUMNAS_PRODUCTO)
      .eq("activo", true)
      .order("orden")
      .order("id"),
    supabase.auth.getClaims(),
  ]);
  const usuario = claims?.claims.sub;

  const { data: pedidos } = usuario
    ? await supabase
        .from("pedidos")
        .select(
          "id, metodo, comprobante, total, estado, creado_en, pedido_items (nombre, precio, cantidad)",
        )
        .eq("cliente_id", usuario)
        .neq("estado", "cancelado")
        .order("creado_en", { ascending: false })
        .limit(10)
    : { data: [] };

  const lista = ((productos ?? []) as Producto[]).map((p) => ({
    ...p,
    foto: urlFoto(
      p.foto,
      (ruta) =>
        supabase.storage.from("productos").getPublicUrl(ruta).data.publicUrl,
    ),
  }));

  return (
    <FeedProductos
      productos={lista}
      pedidos={(pedidos ?? []) as unknown as Pedido[]}
      clienteId={usuario ?? null}
    />
  );
}
