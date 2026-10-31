import { EnVivo } from "@/components/EnVivo";
import { EstadoAbierto } from "@/components/EstadoAbierto";
import { LogoCastillo } from "@/components/LogoCastillo";
import { MenuPrincipal } from "@/components/MenuPrincipal";
import { NEGOCIO } from "@/lib/negocio";

export default function Inicio() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4 py-8 text-center">
      <div className="flex items-center gap-3">
        <LogoCastillo className="h-16 w-16 text-oro" />
        <div className="text-left">
          <h1 className="font-serif text-3xl tracking-wide text-oro">{NEGOCIO.nombre}</h1>
          <p className="font-serif text-sm tracking-[0.3em] text-crema/80 uppercase">{NEGOCIO.subtitulo}</p>
        </div>
      </div>

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
