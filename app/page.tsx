import Link from "next/link";
import { EnVivo } from "@/components/EnVivo";
import { EstadoAbierto } from "@/components/EstadoAbierto";
import { LogoCastillo } from "@/components/LogoCastillo";
import { NEGOCIO, mapsUrl, whatsappUrl } from "@/lib/negocio";

export default function Inicio() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4 py-10 text-center">
      <Link href="/login" className="self-end text-sm text-crema/60 underline-offset-4 hover:text-oro hover:underline">
        Entrar
      </Link>
      <LogoCastillo className="h-24 w-24 text-oro" />
      <h1 className="mt-4 font-serif text-4xl tracking-wide text-oro">{NEGOCIO.nombre}</h1>
      <p className="font-serif text-lg tracking-[0.3em] text-crema/80 uppercase">
        {NEGOCIO.subtitulo}
      </p>
      <div className="mt-6 h-px w-24 bg-oro/40" />

      <section className="mt-8 w-full rounded-2xl border border-oro/20 bg-carbon p-6">
        <EstadoAbierto />
        <p className="mt-4 text-crema/90">{NEGOCIO.horario}</p>
        <p className="mt-2 text-sm text-crema/60">{NEGOCIO.direccion}</p>
        <EnVivo />
      </section>

      <div className="mt-6 flex w-full flex-col gap-3">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-oro px-6 py-4 font-semibold text-noche transition hover:bg-oro-claro"
        >
          Cómo llegar
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-oro/50 px-6 py-4 font-semibold text-oro transition hover:bg-oro/10"
        >
          Escríbenos por WhatsApp
        </a>
      </div>
    </main>
  );
}
