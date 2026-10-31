// Pantalla de bienvenida al abrir la app: el caramelo de barbería gira y luego
// se abren las puertas del castillo. Es solo CSS, así que no retrasa la carga.
// Se muestra una vez por visita; al cambiar de página ya no vuelve a salir.
const MARCAR_VISTA = `try{if(sessionStorage.getItem("fz-bienvenida"))document.documentElement.dataset.bienvenida="vista";else sessionStorage.setItem("fz-bienvenida","1")}catch(e){}`;

export function Bienvenida() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: MARCAR_VISTA }} />
      <div className="bienvenida" aria-hidden="true">
        <div className="bienvenida-puerta bienvenida-izquierda" />
        <div className="bienvenida-puerta bienvenida-derecha" />
        <div className="bienvenida-centro">
          <div className="caramelo">
            <span className="caramelo-tapa" />
            <span className="caramelo-tubo" />
            <span className="caramelo-tapa caramelo-tapa-abajo" />
          </div>
          <p className="font-serif text-2xl tracking-[0.3em] text-oro uppercase">
            La Fortaleza
          </p>
          <p className="-mt-3 text-xs tracking-[0.4em] text-crema/60 uppercase">
            Barbería
          </p>
        </div>
      </div>
    </>
  );
}
