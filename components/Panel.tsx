import Link from "next/link";
import { BotonSalir } from "@/components/BotonSalir";
import { LogoCastillo } from "@/components/LogoCastillo";

// Marco común para los paneles del dueño y del barbero.
export function Panel({ titulo, nombre, children }: { titulo: string; nombre: string | null; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-oro">
          <LogoCastillo className="h-8 w-8" />
          <span className="font-serif text-lg">La Fortaleza</span>
        </Link>
        <BotonSalir />
      </header>
      <h1 className="mt-8 font-serif text-3xl text-oro">{titulo}</h1>
      <p className="mt-1 text-crema/70">Hola, {nombre ?? "bienvenido"}</p>
      <div className="mt-6 flex flex-col gap-4">{children}</div>
    </main>
  );
}

export function Cargando() {
  return <div className="mx-auto mt-24 h-8 w-8 animate-spin rounded-full border-2 border-oro border-t-transparent" />;
}

export function Tarjeta({ children }: { children: React.ReactNode }) {
  return <section className="rounded-2xl border border-oro/20 bg-carbon p-5 text-crema/80">{children}</section>;
}
