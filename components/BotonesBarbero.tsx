"use client";

import { useState } from "react";
import { horaBonita } from "@/lib/citas";
import { crearClienteNavegador } from "@/lib/supabase/client";

export type Estado = "libre" | "atendiendo";

export function BotonesBarbero({
  barberoId,
  estadoInicial,
  desdeInicial,
  cortesHoyInicial,
  citas,
}: {
  barberoId: string;
  estadoInicial: Estado;
  desdeInicial: string | null;
  cortesHoyInicial: number;
  citas: { inicio: string; cliente: string | null; codigo: string | null }[];
}) {
  const [estado, setEstado] = useState<Estado>(estadoInicial);
  const [desde, setDesde] = useState<string | null>(desdeInicial);
  const [cortesHoy, setCortesHoy] = useState(cortesHoyInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [preguntando, setPreguntando] = useState(false);

  async function cambiarEstado(nuevo: Estado) {
    const ahora = new Date().toISOString();
    const { error } = await crearClienteNavegador()
      .from("estado_barbero")
      .update({ estado: nuevo, desde: ahora })
      .eq("barbero_id", barberoId);
    if (error) throw error;
    setEstado(nuevo);
    setDesde(ahora);
  }

  async function ejecutar(accion: () => Promise<void>) {
    setGuardando(true);
    setError(null);
    setAviso(null);
    try {
      await accion();
    } catch (e) {
      setError(`No se guardó: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setGuardando(false);
    }
  }

  const terminarCorte = (codigo: string | null, gratis: boolean) =>
    ejecutar(async () => {
      const { error } = await crearClienteNavegador().rpc("registrar_corte", {
        p_inicio: estado === "atendiendo" ? desde : null,
        p_codigo: codigo,
        p_gratis: gratis,
      });
      if (error) throw error;
      setCortesHoy((n) => n + 1);
      setPreguntando(false);
      await cambiarEstado("libre");
      setAviso(gratis ? "✓ Corte gratis registrado" : codigo ? "✓ Corte registrado en su tarjeta" : "✓ Corte registrado");
    });

  const atendiendo = estado === "atendiendo";

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`rounded-2xl border p-5 text-center ${
          atendiendo ? "border-ladrillo/60 bg-ladrillo/20" : "border-emerald-500/40 bg-emerald-900/30"
        }`}
      >
        <p className="text-sm text-crema/70">Ahora estás</p>
        <p className={`font-serif text-4xl ${atendiendo ? "text-crema" : "text-emerald-300"}`}>
          {atendiendo ? "Atendiendo" : "Libre"}
        </p>
      </div>

      {atendiendo && preguntando ? (
        <ParaQuien
          citas={citas}
          guardando={guardando}
          onGuardar={terminarCorte}
          onVolver={() => setPreguntando(false)}
        />
      ) : atendiendo ? (
        <button
          onClick={() => {
            setAviso(null);
            setPreguntando(true);
          }}
          disabled={guardando}
          className="rounded-2xl bg-oro py-8 text-2xl font-bold text-noche transition active:scale-[0.98] disabled:opacity-50"
        >
          ✂️ Corte terminado
        </button>
      ) : (
        <button
          onClick={() => ejecutar(() => cambiarEstado("atendiendo"))}
          disabled={guardando}
          className="rounded-2xl bg-oro py-8 text-2xl font-bold text-noche transition active:scale-[0.98] disabled:opacity-50"
        >
          💈 Empezar a atender
        </button>
      )}

      {atendiendo && !preguntando && (
        <button
          onClick={() => ejecutar(() => cambiarEstado("libre"))}
          disabled={guardando}
          className="rounded-xl border border-crema/20 py-3 text-sm text-crema/70 transition hover:bg-crema/10 disabled:opacity-50"
        >
          Me equivoqué, sigo libre (no cuenta corte)
        </button>
      )}

      {aviso && <p className="rounded-lg bg-emerald-900/50 p-3 text-center text-emerald-200">{aviso}</p>}
      {error && <p className="rounded-lg bg-ladrillo/30 p-3 text-center text-sm">{error}</p>}

      <p className="text-center text-crema/70">
        Cortes de hoy: <span className="font-serif text-2xl text-oro">{cortesHoy}</span>
      </p>
    </div>
  );
}

type Cliente = { nombre: string | null; regla: number; activo: boolean; disponibles: number; progreso: number };

// Después de "Corte terminado": el barbero escribe el código del cliente (o lo guarda sin cliente).
function ParaQuien({
  citas,
  guardando,
  onGuardar,
  onVolver,
}: {
  citas: { inicio: string; cliente: string | null; codigo: string | null }[];
  guardando: boolean;
  onGuardar: (codigo: string | null, gratis: boolean) => void;
  onVolver: () => void;
}) {
  const [codigo, setCodigo] = useState("");
  const [cliente, setCliente] = useState<Cliente | null | "no-existe">(null);
  const [ahora] = useState(() => Date.now());

  // Citas de esta hora (de 1 h antes a 30 min después) para elegir con un toque.
  const cercanas = citas.filter((c) => {
    const t = new Date(c.inicio).getTime();
    return c.codigo && t > ahora - 60 * 60_000 && t < ahora + 30 * 60_000;
  });

  async function cambiarCodigo(valor: string) {
    const limpio = valor.replace(/\D/g, "").slice(0, 4);
    setCodigo(limpio);
    setCliente(null);
    if (limpio.length !== 4) return;
    const { data } = await crearClienteNavegador().rpc("buscar_cliente", { p_codigo: limpio });
    const fila = (data as Cliente[] | null)?.[0];
    setCliente(fila ?? "no-existe");
  }

  const encontrado = cliente && cliente !== "no-existe" ? cliente : null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-oro bg-carbon p-5">
      <p className="font-serif text-xl text-oro">¿Para quién fue el corte?</p>

      {cercanas.map((c) => (
        <button
          key={c.inicio}
          onClick={() => cambiarCodigo(c.codigo ?? "")}
          className="rounded-xl border border-emerald-400/50 bg-emerald-400/10 px-4 py-3 text-left text-sm text-emerald-200"
        >
          Cita de las {horaBonita(c.inicio)}: <b>{c.cliente ?? "cliente"}</b>
        </button>
      ))}

      <label className="text-sm text-crema/70">
        Código del cliente (está en su Mi cuenta)
        <input
          value={codigo}
          onChange={(e) => cambiarCodigo(e.target.value)}
          inputMode="numeric"
          autoComplete="off"
          placeholder="0000"
          className="mt-1 w-full rounded-xl border border-crema/15 bg-noche px-4 py-3 text-center font-mono text-3xl tracking-[0.5em] text-crema outline-none focus:border-oro"
        />
      </label>

      {cliente === "no-existe" && <p className="text-sm text-ladrillo">No hay ningún cliente con ese código.</p>}
      {encontrado && (
        <p className="rounded-lg bg-noche/60 p-3 text-sm text-crema/80">
          <b className="text-crema">{encontrado.nombre ?? "Cliente"}</b>
          {encontrado.activo &&
            (encontrado.disponibles > 0
              ? ` · ¡Tiene ${encontrado.disponibles} corte${encontrado.disponibles > 1 ? "s" : ""} gratis!`
              : ` · Lleva ${encontrado.progreso} de ${encontrado.regla}`)}
        </p>
      )}

      {encontrado ? (
        <>
          <button
            onClick={() => onGuardar(codigo, false)}
            disabled={guardando}
            className="rounded-2xl bg-oro py-5 text-xl font-bold text-noche disabled:opacity-50"
          >
            ✂️ Guardar corte
          </button>
          {encontrado.activo && encontrado.disponibles > 0 && (
            <button
              onClick={() => onGuardar(codigo, true)}
              disabled={guardando}
              className="rounded-xl border border-emerald-400/60 py-3 font-semibold text-emerald-300 disabled:opacity-50"
            >
              🎁 Este fue su corte gratis
            </button>
          )}
        </>
      ) : (
        <button
          onClick={() => onGuardar(null, false)}
          disabled={guardando}
          className="rounded-2xl bg-oro py-5 text-xl font-bold text-noche disabled:opacity-50"
        >
          ✂️ Guardar sin código
        </button>
      )}
      <button onClick={onVolver} className="py-2 text-sm text-crema/60">
        ← Volver
      </button>
    </div>
  );
}
