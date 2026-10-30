import { etiquetaDia, horaBonita } from "@/lib/citas";

export type CitaBarbero = { cita_id: number; horario_id: number; inicio: string; cliente: string | null; telefono: string | null };

// Próximas citas del barbero, con WhatsApp del cliente si lo dejó.
export function CitasBarbero({ citas }: { citas: CitaBarbero[] }) {
  return (
    <section className="rounded-2xl border border-oro/20 bg-carbon p-5">
      <p className="font-serif text-xl text-oro">Mis citas</p>
      {citas.length === 0 ? (
        <p className="mt-2 text-sm text-crema/60">No tienes citas apartadas.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {citas.map((c) => {
            const digitos = c.telefono?.replace(/\D/g, "") ?? "";
            return (
              <li key={c.cita_id} className="flex items-center gap-3 rounded-xl bg-noche/60 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-crema first-letter:uppercase">
                    {etiquetaDia(c.inicio)}, {horaBonita(c.inicio)}
                  </p>
                  <p className="truncate text-sm text-crema/70">{c.cliente ?? "Cliente"}</p>
                </div>
                {digitos.length >= 10 && (
                  <a
                    href={`https://wa.me/52${digitos.slice(-10)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg border border-oro/50 px-3 py-2 text-xs text-oro"
                  >
                    WhatsApp
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
