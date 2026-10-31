"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { LogoCastillo } from "@/components/LogoCastillo";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { supabaseConfigurado } from "@/lib/supabase/config";

type Modo = "entrar" | "registro";

const ERRORES: Record<string, string> = {
  "Invalid login credentials": "Correo o contraseña incorrectos.",
  "User already registered": "Ese correo ya tiene cuenta. Usa \"Entrar\".",
  "Email not confirmed": "Falta confirmar el correo. Revisa tu bandeja de entrada.",
  "Email logins are disabled": "El inicio con correo está apagado en Supabase (Sign In / Providers > Email).",
  "Password should be at least 6 characters.": "La contraseña debe tener al menos 6 caracteres.",
};

export function FormularioLogin() {
  const parametros = useSearchParams();
  const siguiente = parametros.get("siguiente");
  const invita = parametros.get("invita")?.replace(/\D/g, "").slice(0, 4) ?? "";
  const [modo, setModo] = useState<Modo>(invita ? "registro" : "entrar");
  const [codigoInvita, setCodigoInvita] = useState(invita);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(
    parametros.get("error") === "google" ? "No se pudo entrar con Google. Intenta otra vez." : null,
  );
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Regresa a /auth/callback con lo necesario para seguir después de iniciar sesión.
  function urlDeRegreso(destino = siguiente) {
    const extra = new URLSearchParams();
    if (destino) extra.set("siguiente", destino);
    if (codigoInvita.length === 4) extra.set("invita", codigoInvita);
    const consulta = extra.toString();
    return `${window.location.origin}/auth/callback${consulta ? `?${consulta}` : ""}`;
  }

  async function entrarConGoogle() {
    setError(null);
    setEnviando(true);
    const { error } = await crearClienteNavegador().auth.signInWithOAuth({
      provider: "google",
      // select_account: Google deja escoger la cuenta aunque ya tenga una abierta.
      options: { redirectTo: urlDeRegreso(), queryParams: { prompt: "select_account" } },
    });
    if (error) {
      setError(
        error.message.includes("provider is not enabled")
          ? "Entrar con Google todavía no está activado en Supabase."
          : error.message,
      );
      setEnviando(false);
    }
  }

  async function olvideContrasena() {
    setError(null);
    setAviso(null);
    if (!correo.includes("@")) {
      setError("Escribe tu correo arriba y vuelve a tocar \"¿Olvidaste tu contraseña?\".");
      return;
    }
    setEnviando(true);
    const { error } = await crearClienteNavegador().auth.resetPasswordForEmail(correo, {
      redirectTo: urlDeRegreso("/nueva-contrasena"),
    });
    setEnviando(false);
    if (error) setError(error.message);
    else setAviso("Te mandamos un correo con un enlace para poner una contraseña nueva.");
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAviso(null);
    setEnviando(true);

    try {
      const supabase = crearClienteNavegador();
      const { data, error } =
        modo === "entrar"
          ? await supabase.auth.signInWithPassword({ email: correo, password: contrasena })
          : await supabase.auth.signUp({
              email: correo,
              password: contrasena,
              options: { data: { full_name: nombre } },
            });

      if (error) {
        setError(ERRORES[error.message] ?? error.message);
        return;
      }
      if (!data.session) {
        setAviso("Cuenta creada. Revisa tu correo para confirmarla y luego entra.");
        return;
      }

      // Si lo invitó un amigo, registrar la invitación (si falla, puede intentarlo en Mi cuenta).
      if (modo === "registro" && codigoInvita.length === 4) {
        await supabase.rpc("usar_invitacion", { p_codigo: codigoInvita });
      }

      // Recarga completa: el servidor lee la sesión nueva y manda a cada quien a su página.
      const destino = siguiente ? `?siguiente=${encodeURIComponent(siguiente)}` : "";
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- /entrar es una ruta del servidor y queremos recarga completa
      window.location.assign(`/entrar${destino}`);
    } catch (e) {
      setError(`No se pudo conectar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col items-center text-center">
      <Link href="/" className="text-oro">
        <LogoCastillo className="h-16 w-16" />
      </Link>
      <h1 className="mt-4 font-serif text-3xl text-oro">{modo === "entrar" ? "Entrar" : "Crear cuenta"}</h1>

      <div className="mt-6 grid w-full grid-cols-2 rounded-xl bg-carbon p-1">
        {(["entrar", "registro"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setModo(m)}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              modo === m ? "bg-oro text-noche" : "text-crema/70"
            }`}
          >
            {m === "entrar" ? "Entrar" : "Crear cuenta"}
          </button>
        ))}
      </div>

      {!supabaseConfigurado && (
        <p className="mt-4 rounded-lg bg-ladrillo/30 p-3 text-sm">
          Falta poner las llaves de Supabase en Vercel.
        </p>
      )}

      <button
        type="button"
        onClick={entrarConGoogle}
        disabled={enviando || !supabaseConfigurado}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-crema px-6 py-4 font-semibold text-noche transition active:scale-95 disabled:opacity-50"
      >
        <LogoGoogle />
        {modo === "entrar" ? "Entrar con Google" : "Crear cuenta con Google"}
      </button>
      <div className="mt-5 flex w-full items-center gap-3 text-xs text-crema/50">
        <span className="h-px flex-1 bg-crema/15" />o con tu correo
        <span className="h-px flex-1 bg-crema/15" />
      </div>

      <form onSubmit={enviar} className="mt-4 flex w-full flex-col gap-3 text-left">
        {modo === "registro" && (
          <Campo etiqueta="Nombre" value={nombre} onChange={setNombre} autoComplete="name" required />
        )}
        {modo === "registro" && (
          <Campo
            etiqueta="Código de quien te invitó (opcional)"
            value={codigoInvita}
            onChange={(v) => setCodigoInvita(v.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            placeholder="0000"
          />
        )}
        <Campo etiqueta="Correo" type="email" value={correo} onChange={setCorreo} autoComplete="email" required />
        <Campo
          etiqueta="Contraseña"
          type="password"
          value={contrasena}
          onChange={setContrasena}
          autoComplete={modo === "entrar" ? "current-password" : "new-password"}
          minLength={6}
          required
        />
        {modo === "entrar" && (
          <button
            type="button"
            onClick={olvideContrasena}
            disabled={enviando}
            className="self-end text-sm text-oro/80 underline-offset-4 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </button>
        )}

        {error && <p className="rounded-lg bg-ladrillo/30 p-3 text-sm">{error}</p>}
        {aviso && <p className="rounded-lg bg-emerald-900/50 p-3 text-sm text-emerald-200">{aviso}</p>}

        <button
          disabled={enviando || !supabaseConfigurado}
          className="mt-2 rounded-xl bg-oro px-6 py-4 font-semibold text-noche transition hover:bg-oro-claro disabled:opacity-50"
        >
          {enviando ? "Un momento…" : modo === "entrar" ? "Entrar" : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}

function Campo({
  etiqueta,
  onChange,
  type,
  ...props
}: { etiqueta: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const [ver, setVer] = useState(false);
  const esContrasena = type === "password";
  return (
    <label className="flex flex-col gap-1 text-sm text-crema/70">
      {etiqueta}
      <div className="relative">
        <input
          {...props}
          type={esContrasena && ver ? "text" : type}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-xl border border-crema/15 bg-carbon px-4 py-3 text-base text-crema outline-none focus:border-oro ${
            esContrasena ? "pr-20" : ""
          }`}
        />
        {esContrasena && (
          <button
            type="button"
            onClick={() => setVer(!ver)}
            className="absolute inset-y-0 right-3 text-sm text-oro"
          >
            {ver ? "Ocultar" : "Ver"}
          </button>
        )}
      </div>
    </label>
  );
}

function LogoGoogle() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
