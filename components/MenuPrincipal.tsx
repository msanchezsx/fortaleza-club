"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NEGOCIO, mapsUrl, whatsappUrl } from "@/lib/negocio";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { supabaseConfigurado } from "@/lib/supabase/config";

type Opcion = { nombre: string; texto: string; icono: string; ir: () => void };

const RADIO = 112; // distancia del centro a cada icono, en px
const PASO_GRADOS = 360 / 6;

// Menú en forma de rueda: se gira con el dedo; la opción que queda arriba se abre
// tocando el centro (o tocándola otra vez).
export function MenuPrincipal() {
  const router = useRouter();
  const [conSesion, setConSesion] = useState(false);
  const [giro, setGiro] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const rueda = useRef<HTMLDivElement>(null);
  const arrastre = useRef({ angulo: 0, giro: 0, movido: 0 });

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
      setAviso("¡Enlace copiado!");
      setTimeout(() => setAviso(null), 2000);
    } catch {
      // El cliente cerró la ventana de compartir.
    }
  }

  const abrir = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const opciones: Opcion[] = [
    { nombre: "Citas", texto: "Aparta tu horario gratis", icono: ICONOS.citas, ir: () => router.push("/citas") },
    { nombre: "Productos", texto: "Ceras, aceites y más", icono: ICONOS.productos, ir: () => router.push("/productos") },
    {
      nombre: conSesion ? "Mi cuenta" : "Entrar",
      texto: conSesion ? "Tu barbero, puntos y fotos" : "Crea tu cuenta y gana cortes",
      icono: ICONOS.cuenta,
      ir: () => router.push(conSesion ? "/cuenta" : "/login"),
    },
    { nombre: "Cómo llegar", texto: "Abre el mapa", icono: ICONOS.mapa, ir: () => abrir(mapsUrl) },
    { nombre: "WhatsApp", texto: "Escríbenos", icono: ICONOS.whatsapp, ir: () => abrir(whatsappUrl) },
    { nombre: "Compartir", texto: "Pásale la app a un amigo", icono: ICONOS.compartir, ir: compartir },
  ];

  // La opción que está arriba (la rueda gira en pasos de 60°).
  const total = opciones.length;
  const elegida = (((-Math.round(giro / PASO_GRADOS)) % total) + total) % total;
  const actual = opciones[elegida];

  function anguloDel(e: { clientX: number; clientY: number }) {
    const caja = rueda.current!.getBoundingClientRect();
    const x = e.clientX - (caja.left + caja.width / 2);
    const y = e.clientY - (caja.top + caja.height / 2);
    return (Math.atan2(y, x) * 180) / Math.PI;
  }

  function empezar(e: React.PointerEvent) {
    arrastre.current = { angulo: anguloDel(e), giro, movido: 0 };
    setArrastrando(true);
  }

  useEffect(() => {
    if (!arrastrando) return;
    let ultimo = elegida;
    function mover(e: PointerEvent) {
      const a = arrastre.current;
      let delta = anguloDel(e) - a.angulo;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      a.angulo += delta;
      a.giro += delta;
      a.movido += Math.abs(delta);
      setGiro(a.giro);
      // Un pequeño "clic" en el celular cada vez que cambia la opción de arriba.
      const nueva = (((-Math.round(a.giro / PASO_GRADOS)) % total) + total) % total;
      if (nueva !== ultimo) {
        ultimo = nueva;
        navigator.vibrate?.(8);
      }
    }
    function soltar() {
      setArrastrando(false);
      setGiro(Math.round(arrastre.current.giro / PASO_GRADOS) * PASO_GRADOS);
    }
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
    };
    // elegida solo se lee al empezar a arrastrar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrastrando, total]);

  function tocarOpcion(i: number) {
    if (arrastre.current.movido > 8) return; // fue un giro, no un toque
    if (i === elegida) return actual.ir();
    // Gira por el camino más corto hasta dejarla arriba.
    let pasos = (elegida - i) % total;
    if (pasos > total / 2) pasos -= total;
    if (pasos < -total / 2) pasos += total;
    setGiro((g) => Math.round(g / PASO_GRADOS) * PASO_GRADOS + pasos * PASO_GRADOS);
    navigator.vibrate?.(8);
  }

  return (
    <nav className="mt-6 flex w-full flex-col items-center">
      <div
        ref={rueda}
        onPointerDown={empezar}
        className="relative h-[19rem] w-[19rem] touch-none select-none"
        style={{ "--giro": `${giro}deg` } as React.CSSProperties}
      >
        {/* Aro dorado con rayas, como un poste de barbería visto desde arriba. */}
        <div
          className={`rueda-aro absolute inset-3 rounded-full ${arrastrando ? "" : "transition-transform duration-500"}`}
        />
        <div className="absolute inset-12 rounded-full border border-oro/30 bg-carbon/90" />
        {/* Marca de arriba: la opción que queda aquí es la elegida. */}
        <span className="absolute top-0 left-1/2 h-0 w-0 -translate-x-1/2 border-x-8 border-t-[10px] border-x-transparent border-t-oro" />

        {opciones.map((o, i) => {
          const angulo = ((i * PASO_GRADOS + giro - 90) * Math.PI) / 180;
          const x = Math.cos(angulo) * RADIO;
          const y = Math.sin(angulo) * RADIO;
          const activa = i === elegida;
          return (
            <button
              key={o.nombre + i}
              type="button"
              onClick={() => tocarOpcion(i)}
              aria-label={o.nombre}
              className={`absolute top-1/2 left-1/2 flex h-14 w-14 items-center justify-center rounded-full border-2 ${
                arrastrando ? "" : "transition-all duration-500"
              } ${activa ? "border-oro bg-oro text-noche shadow-[0_0_24px] shadow-oro/50" : "border-oro/40 bg-noche text-oro"}`}
              style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${activa ? 1.15 : 1})` }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7"
                aria-hidden
              >
                <path d={o.icono} />
              </svg>
            </button>
          );
        })}

        {/* Centro: abre la opción elegida. */}
        <button
          type="button"
          onClick={() => arrastre.current.movido <= 8 && actual.ir()}
          className="absolute top-1/2 left-1/2 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full transition active:scale-95"
        >
          <span key={actual.nombre} className="animate-[aparecer_0.3s_ease-out] font-serif text-2xl leading-tight text-oro">
            {aviso ?? actual.nombre}
          </span>
          <span className="text-[11px] tracking-widest text-crema/60 uppercase">Toca para entrar</span>
        </button>
      </div>
      <p key={actual.texto} className="-mt-1 animate-[aparecer_0.3s_ease-out] text-sm text-crema/70">
        {actual.texto}
      </p>
      <p className="mt-1 text-xs text-crema/40">Gira la rueda con el dedo o toca un icono</p>
    </nav>
  );
}

const ICONOS = {
  citas: "M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm4 9 2 2 4-4",
  productos: "M5 8h14l-1 12H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2",
  cuenta: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
  mapa: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  whatsapp: "M4 20l1.3-3.9A8 8 0 1 1 8 19l-4 1Zm5-11c0 3 3 6 6 6l1-1.5-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2L9 9Z",
  compartir: "M12 15V3m0 0L8 7m4-4 4 4M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7",
};
