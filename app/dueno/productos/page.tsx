import Link from "next/link";
import { Suspense } from "react";
import { AdministrarProductos } from "@/components/AdministrarProductos";
import { Cargando, Panel } from "@/components/Panel";
import { PedidosDueno } from "@/components/PedidosDueno";
import {
  COLUMNAS_PRODUCTO,
  urlFoto,
  type Pedido,
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
  const [{ data: productos }, { data: pedidos }] = await Promise.all([
    supabase
      .from("productos")
      .select(COLUMNAS_PRODUCTO)
      .order("activo", { ascending: false })
      .order("orden")
      .order("id"),
    supabase
      .from("pedidos")
      .select(
        "id, metodo, comprobante, total, estado, creado_en, pedido_items (nombre, precio, cantidad), perfiles (nombre, telefono)",
      )
      .in("estado", ["pendiente", "pagado"])
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

  // Enlaces temporales (1 hora) para ver las fotos de las transferencias.
  const conComprobante = ((pedidos ?? []) as unknown as Pedido[]).filter(
    (p) => p.comprobante,
  );
  const { data: firmadas } = conComprobante.length
    ? await supabase.storage.from("comprobantes").createSignedUrls(
        conComprobante.map((p) => p.comprobante!),
        60 * 60,
      )
    : { data: [] };
  const urlPorRuta = new Map(
    (firmadas ?? []).map((f) => [f.path, f.signedUrl]),
  );
  const listaPedidos = ((pedidos ?? []) as unknown as Pedido[]).map((p) => ({
    ...p,
    comprobanteUrl: p.comprobante
      ? (urlPorRuta.get(p.comprobante) ?? null)
      : null,
  }));

  return (
    <Panel titulo="Productos" nombre={perfil.nombre}>
      <Link
        href="/dueno"
        className="text-sm text-oro/80 underline-offset-4 hover:underline"
      >
        ← Volver al panel
      </Link>
      <PedidosDueno pedidos={listaPedidos} />
      <AdministrarProductos productos={lista} />
    </Panel>
  );
}
