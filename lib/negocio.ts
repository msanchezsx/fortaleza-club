// Datos fijos de la barbería. Cambia aquí y se actualiza en toda la app.
export const NEGOCIO = {
  nombre: "La Fortaleza",
  subtitulo: "Barbería",
  direccion:
    "Av. Malaquías Huitrón S/n, San Lorenzo Tetlixtac, 55714 Coacalco, Méx.",
  horario: "Todos los días de 11:00 am a 9:00 pm",
  abre: 11,
  cierra: 21,
  // WhatsApp: 52 (México) + 10 dígitos
  whatsapp: "525572763587",
  maps: "https://maps.app.goo.gl/u2SYuPBwMKk1z8waA",
  // Dirección pública de la app (para los enlaces de invitación)
  sitio: "https://fortaleza-club.vercel.app",
  // Datos para pagar por transferencia. Si están vacíos, la app pide pedirlos por WhatsApp.
  transferencia: {
    banco: "",
    clabe: "",
    titular: "",
  },
};

export const mapsUrl = NEGOCIO.maps;

export const whatsappUrl = `https://wa.me/${NEGOCIO.whatsapp}?text=${encodeURIComponent(
  "Hola, quiero información de La Fortaleza Barbería",
)}`;

// Hora actual en Ciudad de México, sin importar dónde esté el servidor.
export function horaMexico(fecha = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("es-MX", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/Mexico_City",
    }).format(fecha),
  );
}

export function estaAbierto(fecha = new Date()): boolean {
  const hora = horaMexico(fecha);
  return hora >= NEGOCIO.abre && hora < NEGOCIO.cierra;
}

// Inicio del día de hoy en Ciudad de México (UTC-6 todo el año desde 2022), en formato ISO.
export function inicioDelDiaMexico(fecha = new Date()): string {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
  }).format(fecha);
  return `${ymd}T00:00:00-06:00`;
}

// Inicio de hoy, de esta semana (lunes), de este mes y de hace N días, en hora de México.
export function periodosMexico(fecha = new Date(), dias = 14) {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
  }).format(fecha);
  const hoy = new Date(`${ymd}T00:00:00Z`); // solo para contar días, sin zona
  const aIso = (d: Date) => `${d.toISOString().slice(0, 10)}T00:00:00-06:00`;
  const restar = (n: number) => new Date(hoy.getTime() - n * 86_400_000);
  const diaSemana = (hoy.getUTCDay() + 6) % 7; // lunes = 0

  return {
    hoy: aIso(hoy),
    semana: aIso(restar(diaSemana)),
    mes: `${ymd.slice(0, 8)}01T00:00:00-06:00`,
    desdeDias: aIso(restar(dias - 1)),
    diaHoy: ymd,
  };
}
