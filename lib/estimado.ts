// Cuándo se desocupa el próximo barbero, según cuánto tarda un corte normalmente.
// Devuelve null si nadie está atendiendo.
export function estimarLiberacion(
  inicios: string[],
  duracionMin: number,
  ahora = Date.now(),
): { minutos: number; cantidad: number } | null {
  if (inicios.length === 0) return null;

  const restantes = inicios.map((desde) => Math.max(0, duracionMin - (ahora - new Date(desde).getTime()) / 60_000));
  const primero = Math.min(...restantes);

  // Ya casi terminan (o ya se pasaron del tiempo normal).
  if (primero <= 2) return { minutos: 0, cantidad: restantes.filter((r) => r <= 2).length };

  // Redondeo a 5 minutos para no prometer de más.
  const minutos = Math.ceil(primero / 5) * 5;
  return { minutos, cantidad: restantes.filter((r) => r <= minutos).length };
}

export function textoLiberacion({ minutos, cantidad }: { minutos: number; cantidad: number }): string {
  const quien = cantidad === 1 ? "se desocupa 1 barbero" : `se desocupan ${cantidad} barberos`;
  return minutos === 0 ? `En cualquier momento ${quien}` : `En ~${minutos} min ${quien}`;
}
