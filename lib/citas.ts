import { NEGOCIO } from "@/lib/negocio";

const ZONA = "America/Mexico_City";

// Los próximos `n` días en hora de México: { ymd: "2026-10-30", etiqueta: "Hoy" | "Mañana" | "sáb 1" }.
export function proximosDias(n = 7, desde = new Date()) {
  const ymdHoy = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(desde);
  const base = new Date(`${ymdHoy}T12:00:00Z`);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(base.getTime() + i * 86_400_000);
    const ymd = d.toISOString().slice(0, 10);
    const etiqueta =
      i === 0
        ? "Hoy"
        : i === 1
          ? "Mañana"
          : new Intl.DateTimeFormat("es-MX", { weekday: "short", day: "numeric", timeZone: "UTC" }).format(d);
    return { ymd, etiqueta };
  });
}

// Horas en que se puede abrir cita: cada 30 min, la última termina antes de cerrar.
export const HORAS_CITA = Array.from({ length: (NEGOCIO.cierra - 1 - NEGOCIO.abre) * 2 + 1 }, (_, i) => {
  const minutos = NEGOCIO.abre * 60 + i * 30;
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
});

// "2026-10-30" + "16:30" -> instante en hora de México (UTC-6).
export function instanteMexico(ymd: string, hhmm: string): string {
  return new Date(`${ymd}T${hhmm}:00-06:00`).toISOString();
}

// Instante -> "4:30 pm"
export function horaBonita(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: ZONA })
    .format(new Date(iso))
    .replace(/\s?a\.\s?m\./, " am")
    .replace(/\s?p\.\s?m\./, " pm");
}

// Instante -> "2026-10-30" en hora de México.
export function diaMexico(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(new Date(iso));
}

// Instante -> "Hoy", "Mañana" o "sáb 31".
export function etiquetaDia(iso: string): string {
  const dia = diaMexico(iso);
  return proximosDias(14).find((d) => d.ymd === dia)?.etiqueta ?? dia;
}
