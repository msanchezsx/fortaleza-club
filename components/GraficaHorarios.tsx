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

  const promedio = new Map(
    datos.map((d) => [`${d.dia}-${d.hora}`, Number(d.promedio)]),
  );
  const maximo = Math.max(0, ...datos.map((d) => Number(d.promedio)));
  const conDatos = new Set(
    datos.filter((d) => d.dias_con_datos >= 2).map((d) => d.dia),
  );

  if (maximo === 0 || conDatos.size === 0) {
    return (
      <section className="mt-8 rounded-2xl border border-oro/20 bg-carbon p-5">
        <h2 className="font-serif text-2xl text-oro">
          ¿Cuándo hay menos espera?
        </h2>
        <p className="mt-2 text-crema/70">
          Todavía estamos juntando datos. En unas semanas verás aquí las horas
          más tranquilas.
        </p>
      </section>
    );
  }

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
      <p className="mt-1 text-sm text-crema/60">
        Según los cortes de las últimas 8 semanas.
      </p>

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
