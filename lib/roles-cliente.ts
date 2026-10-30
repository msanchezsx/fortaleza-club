export type Rol = "dueno" | "barbero" | "cliente";

// Página de inicio de cada rol después de iniciar sesión.
export function inicioDeRol(rol: Rol): string {
  if (rol === "dueno") return "/dueno";
  if (rol === "barbero") return "/barbero";
  return "/";
}
