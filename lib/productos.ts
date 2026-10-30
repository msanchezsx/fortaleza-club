export type Producto = {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  foto: string | null;
  activo: boolean;
};

export type Apartado = {
  id: number;
  cantidad: number;
  creado_en: string;
  productos: { nombre: string; precio: number } | null;
  perfiles?: { nombre: string | null; telefono: string | null } | null;
};

const formato = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export function precioBonito(precio: number): string {
  return formato.format(Number(precio));
}
