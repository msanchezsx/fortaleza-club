// Datos fijos de la barbería. Cambia aquí y se actualiza en toda la app.
export const NEGOCIO = {
  nombre: "La Fortaleza",
  subtitulo: "Barbería",
  direccion: "Av. Malaquías Huitrón S/n, San Lorenzo Tetlixtac, 55714 Coacalco, Méx.",
  horario: "Todos los días de 11:00 am a 9:00 pm",
  abre: 11,
  cierra: 21,
  // TODO: poner el número real de WhatsApp (10 dígitos, con 52 al inicio)
  whatsapp: "5200000000000",
};

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `La Fortaleza Barbería, ${NEGOCIO.direccion}`,
)}`;

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
