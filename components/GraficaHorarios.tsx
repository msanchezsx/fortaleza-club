"use client";

import { useState } from "react";
import { NEGOCIO } from "@/lib/negocio";

export type Promedio = {
  dia: number;
  hora: number;
  promedio: number;
  dias_con_datos: number;
};

// Lunes primero; 0 es domingo como en la base de datos.
const DIAS = [
  { dia: 1, corto: "Lun", largo: "lunes" },
  { dia: 2, corto: "Mar", largo: "martes" },
  { dia: 3, corto: "Mié", largo: "miércoles" },
  { dia: 4, corto: "Jue", largo: "jueves" },
  { dia: 5, corto: "Vie", largo: "viernes" },
  { dia: 6, corto: "Sáb", largo: "sábado" },
  { dia: 0, corto: "Dom", largo: "domingo" },
];
const HORAS = Array.from(
  { length: NEGOCIO.cierra - NEGOCIO.abre },
  (_, i) => NEGOCIO.abre + i,
);

const NIVELES = [
  { hasta: 0.34, nombre: "Tranquilo", barra: "bg-oro/40" },
  { hasta: 0.67, nombre: "Normal", barra: "bg-oro/70" },
  { hasta: Infinity, nombre: "Lleno", barra: "bg-ladrillo" },
];

// Un día típico de barbería: tranquilo temprano, lleno en la tarde y el fin de semana.
const CURVA = [0.4, 0.6, 1.2, 1.5, 0.9, 0.7, 1.4, 2.6, 3.4, 2.2];
const FACTOR: Record<number, number> = {
  0: 1.3,
  1: 0.8,
  2: 0.7,
  3: 0.8,
  4: 0.9,
  5: 1.2,
  6: 1.6,
};
const EJEMPLO: Promedio[] = DIAS.flatMap(({ dia }) =>
  HORAS.map((hora, i) => ({
    dia,
    hora,
    promedio: Math.round((CURVA[i] ?? 1) * FACTOR[dia] * 10) / 10,
    dias_con_datos: 8,
  })),
);

function hora12(h: number) {
  return `${h % 12 || 12} ${h < 12 ? "am" : "pm"}`;
}

export function GraficaHorarios({
  datos,
  hoy,
  horaAhora,
}: {
  datos: Promedio[];
  hoy: number;
  horaAhora: number;
}) {
  const [dia, setDia] = useState(hoy);

  const reales = datos.filter((d) => Number(d.promedio) > 0);
  // Sin datos suficientes mostramos un ejemplo (marcado) para que se entienda la gráfica.
  const ejemplo = !reales.some((d) => d.dias_con_datos >= 2);
  const usar = ejemplo ? EJEMPLO : reales;

  const promedio = new Map(
    usar.map((d) => [`${d.dia}-${d.hora}`, Number(d.promedio)]),
  );
  const maximo = Math.max(1, ...usar.map((d) => Number(d.promedio)));
  const conDatos = new Set(
    usar.filter((d) => d.dias_con_datos >= 2).map((d) => d.dia),
  );

  const filas = HORAS.map((h) => {
    const valor = promedio.get(`${dia}-${h}`) ?? 0;
    const proporcion = valor / maximo;
    return {
      hora: h,
      valor,
      proporcion,
      nivel: NIVELES.find((n) => proporcion < n.hasta)!,
    };
  });

  // Para hoy solo cuentan las horas que faltan.
  const esHoy = dia === hoy;
  const candidatas = filas.filter((f) => !esHoy || f.hora >= horaAhora);
  const mejor =
    conDatos.has(dia) && candidatas.length > 0
      ? candidatas.reduce((a, b) => (b.valor < a.valor ? b : a))
      : null;
  const nombreDia = DIAS.find((d) => d.dia === dia)!.largo;

  return (
    <section className="mt-8 rounded-2xl border border-oro/20 bg-carbon p-5">
      <h2 className="font-serif text-2xl text-oro">
        ¿Cuándo hay menos espera?
      </h2>
      {ejemplo ? (
        <p className="mt-2 rounded-xl border border-dashed border-oro/50 px-4 py-3 text-sm text-crema/80">
          <span className="mr-2 rounded bg-oro px-2 py-0.5 text-xs font-bold text-noche uppercase">
            Ejemplo
          </span>
          Así se verá cuando tengamos unas semanas de datos de la barbería.
        </p>
      ) : (
        <p className="mt-1 text-sm text-crema/60">
          Según los cortes de las últimas 8 semanas.
        </p>
      )}

      <div
        className="mt-4 grid grid-cols-7 gap-1"
        role="tablist"
        aria-label="Día de la semana"
      >
        {DIAS.map((d) => (
          <button
            key={d.dia}
            role="tab"
            aria-selected={d.dia === dia}
            onClick={() => setDia(d.dia)}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              d.dia === dia
                ? "bg-oro text-noche"
                : "border border-oro/30 text-crema/80 hover:bg-oro/10"
            }`}
          >
            {d.dia === hoy ? "Hoy" : d.corto}
          </button>
        ))}
      </div>

      {mejor ? (
        <p className="mt-4 rounded-xl bg-oro/10 px-4 py-3 text-crema">
          {esHoy
            ? "La mejor hora que queda hoy: "
            : `La mejor hora el ${nombreDia}: `}
          <span className="font-semibold text-oro">{hora12(mejor.hora)}</span>
        </p>
      ) : (
        <p className="mt-4 rounded-xl bg-oro/10 px-4 py-3 text-crema/70">
          {esHoy && conDatos.has(dia)
            ? "Ya casi cerramos por hoy. Mira otro día."
            : `Aún no hay suficientes datos del ${nombreDia}.`}
        </p>
      )}

      {conDatos.has(dia) && (
        <ul className="mt-4 flex flex-col gap-1.5">
          {filas.map((f) => (
            <li
              key={f.hora}
              className="grid grid-cols-[3.5rem_1fr_5.5rem] items-center gap-2 text-sm"
            >
              <span className="text-right text-crema/70">{hora12(f.hora)}</span>
              <span className="h-4 rounded-r bg-noche">
                <span
                  className={`block h-4 rounded-r ${f.nivel.barra}`}
                  style={{ width: `${Math.max(f.proporcion * 100, 3)}%` }}
                />
              </span>
              <span
                className={
                  f.nivel.nombre === "Tranquilo"
                    ? "text-crema"
                    : "text-crema/70"
                }
              >
                {f.nivel.nombre}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
