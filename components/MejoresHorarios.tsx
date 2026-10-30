import { connection } from "next/server";
import { GraficaHorarios, type Promedio } from "@/components/GraficaHorarios";
import { horaMexico } from "@/lib/negocio";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";

const DOW: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// Qué tan lleno suele estar cada hora, con los cortes de las últimas 8 semanas.
export async function MejoresHorarios() {
  await connection();
  if (!supabaseConfigurado) return null;
  const supabase = await crearClienteServidor();
  const { data } = await supabase.rpc("mejores_horarios");
  const ahora = new Date();
  const hoy = DOW[new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "America/Mexico_City" }).format(ahora)];

  return <GraficaHorarios datos={(data ?? []) as Promedio[]} hoy={hoy} horaAhora={horaMexico(ahora)} />;
}
