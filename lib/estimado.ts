// Cuándo se desocupa el próximo barbero, según cuánto tarda un corte normalmente.
// Devuelve null si nadie está atendiendo.
export function estimarLiberacion(
  inicios: string[],
  duracionMin: number,
  ahora = Date.now(),
): { segundos: number; enDiezMin: number } | null {
  if (inicios.length === 0) return null;

  const restantes = inicios.map((desde) =>
    Math.max(0, Math.round(duracionMin * 60 - (ahora - new Date(desde).getTime()) / 1000)),
  );
  return {
    segundos: Math.min(...restantes),
    enDiezMin: restantes.filter((s) => s <= 600).length,
  };
}

// 9 minutos 5 segundos -> "09:05"
export function formatoReloj(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
