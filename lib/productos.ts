export type Producto = {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  precio_antes: number | null;
  foto: string | null;
  activo: boolean;
  orden: number;
};

export type Apartado = {
  id: number;
  cantidad: number;
  creado_en: string;
  productos: { nombre: string; precio: number } | null;
  perfiles?: { nombre: string | null; telefono: string | null } | null;
};

const formato = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export function precioBonito(precio: number): string {
  return formato.format(Number(precio));
}

export const COLUMNAS_PRODUCTO =
  "id, nombre, descripcion, precio, precio_antes, foto, activo, orden";

// Las fotos de ejemplo viven dentro de la app ("/productos/..."); las del dueño, en Supabase.
export function urlFoto(
  foto: string | null,
  publica: (ruta: string) => string,
): string | null {
  if (!foto) return null;
  return foto.startsWith("/") ? foto : publica(foto);
}

export function porcentajeDescuento(
  p: Pick<Producto, "precio" | "precio_antes">,
): number | null {
  if (!p.precio_antes || Number(p.precio_antes) <= Number(p.precio))
    return null;
  return Math.round((1 - Number(p.precio) / Number(p.precio_antes)) * 100);
}
