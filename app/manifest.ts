import type { MetadataRoute } from "next";

// Permite "Agregar a pantalla de inicio" y abrir la página como si fuera app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "La Fortaleza Barbería",
    short_name: "La Fortaleza",
    description: "Mira qué tan lleno está, aparta tu cita y gana cortes gratis.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1115",
    theme_color: "#0f1115",
    lang: "es-MX",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
