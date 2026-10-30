import { periodosMexico } from "@/lib/negocio";
import { crearClienteServidor } from "@/lib/supabase/server";

type PorBarbero = {
  barbero_id: string;
  nombre: string;
  activo: boolean;
  cortes_hoy: number;
  cortes_semana: number;
  cortes_mes: number;
};
type PorDia = { dia: string; cortes: number };

const DIAS = 14;

// Panel de números para el dueño: hoy, semana y mes, total y por barbero.
export async function Estadisticas() {
  const p = periodosMexico(new Date(), DIAS);
  const supabase = await crearClienteServidor();

  const [{ data: porBarbero }, { data: porDia }] = await Promise.all([
    supabase.rpc("resumen_cortes", { hoy: p.hoy, semana: p.semana, mes: p.mes }),
    supabase.rpc("cortes_por_dia", { desde: p.desdeDias }),
  ]);

  const filas = ((porBarbero ?? []) as PorBarbero[]).filter((b) => b.activo || b.cortes_mes > 0);
  const total = (campo: "cortes_hoy" | "cortes_semana" | "cortes_mes") =>
    filas.reduce((suma, b) => suma + Number(b[campo]), 0);

  // Llenar los días sin cortes con 0 para que la gráfica no tenga huecos.
  const cuenta = new Map(((porDia ?? []) as PorDia[]).map((d) => [d.dia, Number(d.cortes)]));
  const dias = Array.from({ length: DIAS }, (_, i) => {
    const fecha = new Date(`${p.diaHoy}T00:00:00Z`);
    fecha.setUTCDate(fecha.getUTCDate() - (DIAS - 1 - i));
    const clave = fecha.toISOString().slice(0, 10);
    return { clave, dia: fecha.getUTCDate(), cortes: cuenta.get(clave) ?? 0 };
  });
  const maximo = Math.max(1, ...dias.map((d) => d.cortes));

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ["Hoy", total("cortes_hoy")],
            ["Semana", total("cortes_semana")],
            ["Mes", total("cortes_mes")],
          ] as const
        ).map(([etiqueta, valor]) => (
          <div key={etiqueta} className="rounded-2xl border border-oro/20 bg-carbon p-4 text-center">
            <p className="text-xs tracking-wider text-crema/60 uppercase">{etiqueta}</p>
            <p className="font-serif text-3xl text-oro">{valor}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-oro/20 bg-carbon p-5">
        <p className="font-serif text-xl text-oro">Últimos {DIAS} días</p>
        <div className="mt-4 flex h-32 items-end gap-1">
          {dias.map((d) => (
            <div key={d.clave} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-crema/60">{d.cortes || ""}</span>
              <div
                className={`w-full rounded-t ${d.clave === p.diaHoy ? "bg-oro" : "bg-oro/40"}`}
                style={{ height: `${(d.cortes / maximo) * 96}px`, minHeight: d.cortes ? 4 : 1 }}
              />
              <span className="text-[10px] text-crema/50">{d.dia}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-oro/20 bg-carbon p-5">
        <p className="font-serif text-xl text-oro">Por barbero</p>
        {filas.length === 0 ? (
          <p className="mt-2 text-sm text-crema/60">Todavía no hay cortes registrados.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-crema/50">
                <th className="pb-2 font-normal">Barbero</th>
                <th className="pb-2 text-right font-normal">Hoy</th>
                <th className="pb-2 text-right font-normal">Semana</th>
                <th className="pb-2 text-right font-normal">Mes</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((b) => (
                <tr key={b.barbero_id} className="border-t border-crema/10">
                  <td className={`py-2 ${b.activo ? "" : "text-crema/40"}`}>{b.nombre}</td>
                  <td className="py-2 text-right">{b.cortes_hoy}</td>
                  <td className="py-2 text-right">{b.cortes_semana}</td>
                  <td className="py-2 text-right font-semibold text-oro">{b.cortes_mes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
