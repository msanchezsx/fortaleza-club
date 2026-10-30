export type Lealtad = { codigo: string; regla: number; activo: boolean; pagados: number; disponibles: number; progreso: number };

// Tarjeta de sellos del cliente y su código para dárselo al barbero.
export function TarjetaLealtad({ lealtad }: { lealtad: Lealtad }) {
  const { codigo, regla, activo, pagados, disponibles, progreso } = lealtad;
  return (
    <section className="rounded-2xl border border-oro/20 bg-carbon p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-serif text-xl text-oro">Mi tarjeta</p>
          <p className="mt-1 text-sm text-crema/60">Dile este código a tu barbero al terminar tu corte.</p>
        </div>
        <p className="shrink-0 rounded-xl border border-oro/40 px-3 py-2 font-mono text-2xl tracking-[0.3em] text-oro">
          {codigo}
        </p>
      </div>

      {activo ? (
        <>
          {disponibles > 0 && (
            <p className="mt-4 rounded-xl bg-emerald-400/15 p-3 text-center font-semibold text-emerald-300">
              🎁 Tienes {disponibles} corte{disponibles > 1 ? "s" : ""} gratis. Avísale a tu barbero.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2" aria-label={`${progreso} de ${regla} cortes`}>
            {Array.from({ length: regla }, (_, i) => (
              <span
                key={i}
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg ${
                  i < progreso ? "border-oro bg-oro text-noche" : "border-crema/20 text-crema/30"
                }`}
              >
                ✂
              </span>
            ))}
            <span className="flex h-10 items-center rounded-full border border-dashed border-emerald-400/50 px-3 text-sm text-emerald-300">
              = 1 gratis
            </span>
          </div>
          <p className="mt-3 text-sm text-crema/70">
            Llevas {progreso} de {regla}. En total, {pagados} {pagados === 1 ? "corte" : "cortes"} en La Fortaleza.
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-crema/60">El programa de lealtad está en pausa por ahora.</p>
      )}
    </section>
  );
}
