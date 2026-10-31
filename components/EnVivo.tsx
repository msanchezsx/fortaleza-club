"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CuentaRegresiva } from "@/components/CuentaRegresiva";
import { MiFavorito } from "@/components/MiFavorito";
import { estimarLiberacion } from "@/lib/estimado";
import { estaAbierto } from "@/lib/negocio";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { supabaseConfigurado } from "@/lib/supabase/config";

type Estado = "libre" | "atendiendo";
type Barbero = { id: string; nombre: string; estado: Estado; desde: string };
type Fila = { id: string; nombre: string; estado_barbero: { estado: Estado; desde: string } | null };

// "Ahora en La Fortaleza": qué barberos están libres, en tiempo real.
export function EnVivo() {
  const [barberos, setBarberos] = useState<Barbero[] | null>(null);
  const [abierto, setAbierto] = useState(true);
  const [duracion, setDuracion] = useState(35);
  const [favoritoId, setFavoritoId] = useState<string | null>(null);
  const [conSesion, setConSesion] = useState(false);
  const [tocado, setTocado] = useState<{ id: string; nombre: string; texto: string } | null>(null);

  useEffect(() => {
    if (!supabaseConfigurado) return;
    const supabase = crearClienteNavegador();

    async function cargar() {
      const { data } = await supabase
        .from("barberos")
        .select("id, nombre, estado_barbero (estado, desde)")
        .eq("activo", true)
        .order("nombre")
        .returns<Fila[]>();
      setBarberos(
        (data ?? []).map((b) => ({
          id: b.id,
          nombre: b.nombre,
          estado: b.estado_barbero?.estado ?? "libre",
          desde: b.estado_barbero?.desde ?? new Date().toISOString(),
        })),
      );
      const { data: minutos } = await supabase.rpc("duracion_corte_min");
      if (typeof minutos === "number") setDuracion(minutos);

      // Si entró con su cuenta, buscar su barbero favorito.
      const { data: sesion } = await supabase.auth.getSession();
      const userId = sesion.session?.user.id;
      setConSesion(Boolean(userId));
      if (userId) {
        const { data: perfil } = await supabase
          .from("perfiles")
          .select("barbero_favorito")
          .eq("id", userId)
          .maybeSingle<{ barbero_favorito: string | null }>();
        setFavoritoId(perfil?.barbero_favorito ?? null);
      }
    }

    cargar();
    const revisarHorario = () => setAbierto(estaAbierto());
    revisarHorario();
    const reloj = setInterval(revisarHorario, 60_000);

    // Cuando un barbero cambia su estado, se actualiza aquí sin recargar.
    const canal = supabase
      .channel("estado-barberos")
      .on("postgres_changes", { event: "*", schema: "public", table: "estado_barbero" }, (cambio) => {
        const nuevo = cambio.new as { barbero_id?: string; estado?: Estado; desde?: string };
        if (!nuevo.barbero_id || !nuevo.estado) return;
        setBarberos(
          (lista) =>
            lista?.map((b) =>
              b.id === nuevo.barbero_id ? { ...b, estado: nuevo.estado!, desde: nuevo.desde ?? b.desde } : b,
            ) ?? lista,
        );
      })
      .subscribe();

    // Al volver a la pestaña, recargar por si se perdió algún cambio.
    const alVolver = () => document.visibilityState === "visible" && cargar();
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      clearInterval(reloj);
      document.removeEventListener("visibilitychange", alVolver);
      supabase.removeChannel(canal);
    };
  }, []);

  // Al tocar un barbero: si está libre o cuánto le falta (se calcula al momento del toque).
  function tocar(b: Barbero) {
    const falta = estimarLiberacion([b.desde], duracion)?.segundos ?? 0;
    const minutos = Math.ceil(falta / 60);
    const texto = !abierto
      ? "te esperamos a partir de las 11 am."
      : b.estado === "libre"
        ? "está libre, ¡llega sin esperar!"
        : minutos <= 1
          ? "está terminando un corte, se libera en cualquier momento."
          : `está atendiendo, se libera en unos ${minutos} min.`;
    setTocado({ id: b.id, nombre: b.nombre, texto });
  }

  if (!supabaseConfigurado || barberos === null) {
    return <div className="mt-6 h-24 animate-pulse rounded-xl bg-crema/5" />;
  }
  if (barberos.length === 0) return null;

  const libres = barberos.filter((b) => b.estado === "libre").length;
  const ocupados = barberos.filter((b) => b.estado === "atendiendo").map((b) => b.desde);
  const ocupacion = 1 - libres / barberos.length;
  const favorito = barberos.find((b) => b.id === favoritoId);
  const nivel =
    !abierto ? null : libres === 0 ? "Lleno, hay espera" : ocupacion >= 0.6 ? "Algo lleno" : "Tranquilo, sin espera";

  return (
    <div className="mt-6 text-left">
      {favorito && (
        <MiFavorito
          nombre={favorito.nombre}
          abierto={abierto}
          libre={favorito.estado === "libre"}
          desde={favorito.desde}
          duracionMin={duracion}
        />
      )}
      {abierto && (
        <>
          <div className="flex items-baseline justify-between">
            <p className="font-serif text-lg text-oro">Ahora mismo</p>
            <p className="text-sm text-crema/70">
              {libres} de {barberos.length} libres
            </p>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-crema/10">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                libres === 0 ? "bg-ladrillo" : ocupacion >= 0.6 ? "bg-oro" : "bg-emerald-400"
              }`}
              style={{ width: `${Math.max(ocupacion * 100, 4)}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-crema/80">{nivel}</p>
          {libres <= 1 && <CuentaRegresiva inicios={ocupados} duracionMin={duracion} />}
        </>
      )}

      <p className="mt-4 text-xs text-crema/50">Toca a un barbero para ver si está libre</p>
      <ul className="-mx-6 mt-1 flex snap-x gap-3 overflow-x-auto px-6 py-2 [scrollbar-width:none]">
        {barberos.map((b) => {
          const libre = abierto && b.estado === "libre";
          const elegido = b.id === tocado?.id;
          return (
            <li key={b.id} className="shrink-0 snap-start">
              <button
                type="button"
                onClick={() => tocar(b)}
                className="flex w-16 flex-col items-center gap-1 transition active:scale-90"
              >
                <span
                  className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-noche font-serif text-xl text-oro ring-2 ${
                    !abierto ? "ring-crema/20" : libre ? "ring-emerald-400" : "ring-ladrillo"
                  } ${elegido ? "animate-[brinco_0.4s_ease-out] ring-4" : ""}`}
                >
                  {b.nombre.trim().charAt(0).toUpperCase()}
                  {b.id === favoritoId && (
                    <span className="absolute -top-1 -right-1 text-sm text-oro">★</span>
                  )}
                  {abierto && (
                    <span
                      className={`absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2 border-carbon ${
                        libre ? "bg-emerald-400" : "bg-ladrillo"
                      }`}
                    />
                  )}
                </span>
                <span className="w-full truncate text-center text-xs">{b.nombre}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {tocado && (
        <p
          key={tocado.id + tocado.texto}
          className="mt-1 animate-[aparecer_0.3s_ease-out] rounded-xl bg-noche/60 px-3 py-2 text-sm"
        >
          <span className="text-oro">{tocado.nombre}:</span> {tocado.texto}
        </p>
      )}
      {!favorito && (
        <Link href="/cuenta" className="mt-3 block text-center text-sm text-oro/80 underline-offset-4 hover:underline">
          {conSesion ? "★ Elige tu barbero favorito" : "★ Crea tu cuenta y elige tu barbero favorito"}
        </Link>
      )}
    </div>
  );
}
