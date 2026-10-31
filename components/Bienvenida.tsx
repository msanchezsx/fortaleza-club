// Pantalla de bienvenida al abrir la app. Es solo CSS, así que no retrasa la
// carga. Se muestra una vez por visita; al cambiar de página ya no sale.
// Hay varias versiones para escoger; se prueban abriendo la app con
// ?intro=caramelo o ?intro=tijeras (así sale siempre, aunque ya se haya visto).
const PREDETERMINADA = "caramelo";

const ELEGIR = `try{var d=document.documentElement,q=new URLSearchParams(location.search).get("intro");d.dataset.intro=q||"${PREDETERMINADA}";if(!q){if(sessionStorage.getItem("fz-bienvenida"))d.dataset.bienvenida="vista";else sessionStorage.setItem("fz-bienvenida","1")}}catch(e){}`;

// Mechones de pelo que las tijeras van cortando (posición en px desde el centro)
const MECHONES = Array.from({ length: 13 }, (_, i) => -120 + i * 20);

export function Bienvenida() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ELEGIR }} />

      {/* Opción 1: caramelo de barbería con la línea dorada en medio */}
      <div className="bienvenida bienvenida-caramelo" aria-hidden="true">
        <div className="bienvenida-puerta bienvenida-izquierda" />
        <div className="bienvenida-puerta bienvenida-derecha" />
        <div className="bienvenida-centro">
          <div className="caramelo">
            <span className="caramelo-tapa" />
            <span className="caramelo-tubo" />
            <span className="caramelo-tapa caramelo-tapa-abajo" />
          </div>
          <Nombre />
        </div>
      </div>

      {/* Opción 2: tijeras cortando mechones de pelo */}
      <div className="bienvenida bienvenida-tijeras" aria-hidden="true">
        <div className="bienvenida-centro">
          <div className="corte">
            {MECHONES.map((x, i) => (
              <span
                key={x}
                className="mechon"
                style={
                  {
                    "--x": `${x}px`,
                    "--retraso": `${0.35 + ((x + 140) / 280) * 1.1}s`,
                    "--giro": `${i % 2 ? 35 : -30}deg`,
                    "--ladeo": `${((i * 7) % 5) - 2}deg`,
                  } as React.CSSProperties
                }
              >
                <span className="mechon-arriba" />
                <span className="mechon-abajo" />
              </span>
            ))}
            <Tijeras className="tijeras tijeras-grande" />
          </div>
          <Tijeras className="tijeras tijeras-esquina tijeras-arriba" />
          <Tijeras className="tijeras tijeras-esquina tijeras-abajo" />
          <Nombre />
        </div>
      </div>
    </>
  );
}

function Nombre() {
  return (
    <div className="text-center">
      <p className="font-serif text-2xl tracking-[0.3em] text-oro uppercase">
        La Fortaleza
      </p>
      <p className="mt-3 text-xs tracking-[0.4em] text-crema/60 uppercase">
        Barbería
      </p>
    </div>
  );
}

// Tijeras abiertas hacia la derecha; cada hoja gira sobre el tornillo.
function Tijeras({ className }: { className: string }) {
  const hoja = (
    <g className="tijeras-hoja">
      <path d="M-6 -4 L46 -1.5 Q48 0 46 1 L-6 3 Z" fill="#d8dce3" />
      <path d="M-6 -4 L46 -1.5 L-6 -1 Z" fill="#ffffff" opacity="0.6" />
      <path
        d="M-6 0 L-20 -8"
        stroke="var(--color-oro)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle
        cx="-30"
        cy="-13"
        r="11"
        fill="none"
        stroke="var(--color-oro)"
        strokeWidth="5"
      />
    </g>
  );
  return (
    <svg viewBox="-50 -50 100 100" className={className}>
      {hoja}
      <g transform="scale(1 -1)">{hoja}</g>
      <circle r="3.5" fill="var(--color-oro-claro)" />
    </svg>
  );
}
