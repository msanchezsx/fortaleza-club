"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NEGOCIO, mapsUrl, whatsappUrl } from "@/lib/negocio";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { supabaseConfigurado } from "@/lib/supabase/config";

const CUADRO =
  "group flex flex-col items-center justify-center gap-2 rounded-2xl border border-oro/25 bg-carbon px-2 py-4 text-sm font-semibold text-crema transition active:scale-95 active:bg-oro/10";
const ICONO = "h-7 w-7 text-oro group-active:animate-[brinco_0.4s_ease-out]";

// Menú de la pantalla principal: seis cuadritos en lugar de una lista larga de botones.
export function MenuPrincipal() {
  const [conSesion, setConSesion] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!supabaseConfigurado) return;
    crearClienteNavegador()
      .auth.getSession()
      .then(({ data }) => setConSesion(Boolean(data.session)));
  }, []);

  async function compartir() {
    const datos = {
      title: `${NEGOCIO.nombre} ${NEGOCIO.subtitulo}`,
      text: "Mira si hay barbero libre antes de ir a La Fortaleza:",
      url: NEGOCIO.sitio,
    };
    try {
      if (navigator.share) return await navigator.share(datos);
      await navigator.clipboard.writeText(`${datos.text} ${datos.url}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // El cliente cerró la ventana de compartir.
    }
  }

  return (
    <nav className="mt-6 grid w-full grid-cols-3 gap-3">
      <Link href="/citas" className={CUADRO}>
        <Icono d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm4 9 2 2 4-4" />
        Citas
      </Link>
      <Link href="/productos" className={CUADRO}>
        <Icono d="M5 8h14l-1 12H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2" />
        Productos
      </Link>
      <Link href={conSesion ? "/cuenta" : "/login"} className={CUADRO}>
        <Icono d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />
        {conSesion ? "Mi cuenta" : "Entrar"}
      </Link>
      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={CUADRO}>
        <Icono d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
        Cómo llegar
      </a>
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={CUADRO}>
        <Icono d="M4 20l1.3-3.9A8 8 0 1 1 8 19l-4 1Zm5-11c0 3 3 6 6 6l1-1.5-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2L9 9Z" />
        WhatsApp
      </a>
      <button type="button" onClick={compartir} className={CUADRO}>
        <Icono d="M12 15V3m0 0L8 7m4-4 4 4M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
        {copiado ? "¡Copiado!" : "Compartir"}
      </button>
    </nav>
  );
}

function Icono({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={ICONO}
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}
