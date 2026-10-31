import { EnVivo } from "@/components/EnVivo";
import { EstadoAbierto } from "@/components/EstadoAbierto";
import { LogoCastillo } from "@/components/LogoCastillo";
import { MenuPrincipal } from "@/components/MenuPrincipal";
import { NEGOCIO } from "@/lib/negocio";

export default function Inicio() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4 py-8 text-center">
      <LogoCastillo className="h-32 w-32 text-oro drop-shadow-[0_0_18px_rgba(201,166,95,0.35)]" />
      <h1 className="mt-3 font-serif text-5xl tracking-wide text-oro">{NEGOCIO.nombre}</h1>
      <p className="mt-1 font-serif text-xl tracking-[0.4em] text-crema/80 uppercase">{NEGOCIO.subtitulo}</p>
      <div className="mt-4 h-px w-24 bg-oro/40" />

      <MenuPrincipal />

      <section className="mt-6 w-full overflow-hidden rounded-2xl border border-oro/20 bg-carbon p-6">
        <EstadoAbierto />
        <p className="mt-3 text-sm text-crema/80">{NEGOCIO.horario}</p>
        <EnVivo />
      </section>

      <p className="mt-6 text-xs text-crema/50">{NEGOCIO.direccion}</p>
    </main>
  );
}
