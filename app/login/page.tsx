import { Suspense } from "react";
import { FormularioLogin } from "./FormularioLogin";

export default function PaginaLogin() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-10">
      <Suspense>
        <FormularioLogin />
      </Suspense>
    </main>
  );
}
