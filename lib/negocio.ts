// Datos fijos de la barbería. Cambia aquí y se actualiza en toda la app.
export const NEGOCIO = {
  nombre: "La Fortaleza",
  subtitulo: "Barbería",
  direccion: "Av. Malaquías Huitrón S/n, San Lorenzo Tetlixtac, 55714 Coacalco, Méx.",
  horario: "Todos los días de 11:00 am a 9:00 pm",
  abre: 11,
  cierra: 21,
  // WhatsApp: 52 (México) + 10 dígitos
  whatsapp: "525572763587",
  maps: "https://maps.app.goo.gl/u2SYuPBwMKk1z8waA",
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
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(fecha);
  return `${ymd}T00:00:00-06:00`;
}
