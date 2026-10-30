"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { supabaseConfigurado } from "@/lib/supabase/config";

// "Entrar" si no hay sesión; "Mi cuenta" si ya entró.
export function EnlaceCuenta() {
  const [conSesion, setConSesion] = useState(false);

  useEffect(() => {
    if (!supabaseConfigurado) return;
    crearClienteNavegador()
      .auth.getSession()
      .then(({ data }) => setConSesion(Boolean(data.session)));
  }, []);

  return (
    <Link
      href={conSesion ? "/cuenta" : "/login"}
      className="self-end text-sm text-crema/60 underline-offset-4 hover:text-oro hover:underline"
    >
      {conSesion ? "Mi cuenta" : "Entrar"}
    </Link>
  );
}
