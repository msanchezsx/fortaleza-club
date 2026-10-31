// Pantalla de bienvenida al abrir la app. Es solo CSS, así que no retrasa la
// carga. Se muestra una vez por visita; al cambiar de página ya no sale.
// Hay varias versiones para escoger; se prueban abriendo la app con
// ?intro=caramelo o ?intro=barbero (así sale siempre, aunque ya se haya visto).
const PREDETERMINADA = "caramelo";

const ELEGIR = `try{var d=document.documentElement,q=new URLSearchParams(location.search).get("intro");d.dataset.intro=q||"${PREDETERMINADA}";if(!q){if(sessionStorage.getItem("fz-bienvenida"))d.dataset.bienvenida="vista";else sessionStorage.setItem("fz-bienvenida","1")}}catch(e){}`;

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

      {/* Opción 2: silueta del barbero cortándole el pelo a un cliente */}
      <div className="bienvenida bienvenida-barbero" aria-hidden="true">
        <div className="bienvenida-centro">
          <EscenaBarbero />
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

// Siluetas sobre un círculo dorado: el cliente sentado con su capa y el
// barbero detrás, moviendo el brazo con las tijeras. Caen pelitos.
function EscenaBarbero() {
  return (
    <svg viewBox="0 0 200 200" className="escena-barbero">
      <defs>
        <radialGradient id="luz-barbero" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#fff4dc" />
          <stop offset="60%" stopColor="var(--color-oro-claro)" />
          <stop offset="100%" stopColor="var(--color-oro)" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="92" fill="url(#luz-barbero)" />
      <g fill="var(--color-noche)">
        {/* Silla */}
        <ellipse cx="100" cy="183" rx="24" ry="4" />
        <rect x="96" y="134" width="8" height="48" />
        <rect x="76" y="128" width="46" height="8" rx="2" />
        <rect x="113" y="86" width="9" height="48" rx="3" />
        <rect x="74" y="117" width="34" height="4" rx="2" />
        <rect x="46" y="162" width="22" height="4" rx="2" />
        {/* Cliente */}
        <path d="M82 128 L58 131 L55 162 L63 162 L65 139 L84 136 Z" />
        <path d="M84 86 L100 86 L119 132 L64 132 Z" />
        <rect x="88" y="80" width="8" height="8" />
        <circle cx="92" cy="73" r="12" />
        <path d="M79 71 Q79 57 92 57 Q106 57 105 71 Q99 63 92 65 Q85 63 79 71 Z" />
        {/* Barbero */}
        <circle cx="143" cy="48" r="10" />
        <path d="M133 46 Q134 35 144 36 Q153 37 153 46 Q148 41 143 42 Q137 41 133 46 Z" />
        <rect x="139" y="56" width="7" height="7" />
        <path d="M131 62 L155 62 L158 122 L129 122 Z" />
        <path d="M131 120 L141 120 L140 182 L130 182 Z" />
        <path d="M145 120 L156 120 L158 182 L148 182 Z" />
        <rect x="126" y="180" width="15" height="4" rx="2" />
        <rect x="146" y="180" width="15" height="4" rx="2" />
      </g>
      {/* Brazo con tijeras */}
      <g className="barbero-brazo">
        <path
          d="M135 67 L121 77 L108 58"
          fill="none"
          stroke="var(--color-noche)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g className="barbero-tijeras">
          <path
            d="M108 58 L98 48"
            stroke="var(--color-noche)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            className="barbero-hoja"
            d="M108 58 L96 53"
            stroke="var(--color-noche)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
        <circle cx="108" cy="58" r="4" fill="var(--color-noche)" />
      </g>
      {/* Pelitos que caen */}
      <g stroke="var(--color-noche)" strokeWidth="2" strokeLinecap="round">
        {[95, 98, 101, 97, 100, 99].map((x, i) => (
          <path
            key={i}
            d={`M${x} 55 l2 4`}
            className="pelito"
            style={{ animationDelay: `${0.2 + i * 0.25}s` }}
          />
        ))}
      </g>
    </svg>
  );
}
