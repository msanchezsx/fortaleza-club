// Pantalla de bienvenida al abrir la app: el caramelo de barbería gira frente
// a las puertas del castillo, las puertas se abren y entramos. Es solo CSS,
// así que no retrasa la carga. Sale una vez por visita.
const MARCAR_VISTA = `try{if(sessionStorage.getItem("fz-bienvenida"))document.documentElement.dataset.bienvenida="vista";else sessionStorage.setItem("fz-bienvenida","1")}catch(e){}`;

export function Bienvenida() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: MARCAR_VISTA }} />
      <div className="bienvenida" aria-hidden="true">
        <div className="bienvenida-titulo">
          <p className="font-serif text-2xl tracking-[0.3em] text-oro uppercase">
            La Fortaleza
          </p>
          <p className="mt-1 text-xs tracking-[0.4em] text-crema/60 uppercase">
            Barbería
          </p>
        </div>
        <div className="portal">
          <div className="portal-luz" />
          <div className="puerta puerta-izquierda" />
          <div className="puerta puerta-derecha" />
          <div className="caramelo">
            <span className="caramelo-tapa" />
            <span className="caramelo-tubo" />
            <span className="caramelo-tapa caramelo-tapa-abajo" />
          </div>
        </div>
      </div>
    </>
  );
}
