"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CuentaRegresiva } from "@/components/CuentaRegresiva";
import { MiFavorito } from "@/components/MiFavorito";
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

      <ul className="mt-4 grid grid-cols-2 gap-2">
        {barberos.map((b) => {
          const libre = abierto && b.estado === "libre";
          return (
            <li key={b.id} className="flex items-center gap-2 rounded-xl bg-noche/60 px-3 py-2">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  !abierto ? "bg-crema/30" : libre ? "bg-emerald-400" : "bg-ladrillo"
                }`}
              />
              <span className="truncate text-sm">
                {b.id === favoritoId && <span className="text-oro">★ </span>}
                {b.nombre}
              </span>
              <span className="ml-auto text-xs text-crema/50">{!abierto ? "" : libre ? "Libre" : "Ocupado"}</span>
            </li>
          );
        })}
      </ul>
      {!favorito && (
        <Link href="/cuenta" className="mt-3 block text-center text-sm text-oro/80 underline-offset-4 hover:underline">
          {conSesion ? "★ Elige tu barbero favorito" : "★ Crea tu cuenta y elige tu barbero favorito"}
        </Link>
      )}
    </div>
  );
}
