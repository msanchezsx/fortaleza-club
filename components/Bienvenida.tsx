import { LogoCastillo } from "@/components/LogoCastillo";

// Pantalla de bienvenida al abrir la app. Es solo CSS, así que no retrasa la
// carga. Se muestra una vez por visita; al cambiar de página ya no sale.
// Hay varias versiones para escoger; se prueban abriendo la app con
// ?intro=glitch, ?intro=poste, ?intro=caramelo o ?intro=barbero (así sale siempre, aunque ya se haya visto).
const PREDETERMINADA = "poste";

const ELEGIR = `try{var d=document.documentElement,q=new URLSearchParams(location.search).get("intro");d.dataset.intro=q||"${PREDETERMINADA}";if(!q){if(sessionStorage.getItem("fz-bienvenida"))d.dataset.bienvenida="vista";else sessionStorage.setItem("fz-bienvenida","1")}}catch(e){}`;

export function Bienvenida() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ELEGIR }} />

      {/* Principal: pantalla "descompuesta" con los colores de la barbería y
          al final el castillo con el nombre, como si la señal regresara */}
      <div className="bienvenida bienvenida-glitch" aria-hidden="true">
        <div className="glitch-franja glitch-arriba" />
        <div className="glitch-franja glitch-linea" style={{ top: "26%" }} />
        <div className="glitch-franja glitch-linea" style={{ top: "29%" }} />
        <div
          className="glitch-franja glitch-linea glitch-delgada"
          style={{ top: "39%" }}
        />
        <div className="glitch-franja glitch-linea" style={{ top: "66%" }} />
        <div
          className="glitch-franja glitch-linea glitch-delgada"
          style={{ top: "74%" }}
        />
        <div className="glitch-franja glitch-linea" style={{ top: "97%" }} />
        <div className="glitch-ruido" />
        <div className="glitch-ruido glitch-ruido-2" />
        <div className="bienvenida-centro glitch-logo">
          <LogoCastillo className="h-24 w-24 text-oro" />
          <Nombre />
        </div>
      </div>

      {/* Opción: dentro de un aro dorado pasan el caramelo, la navaja, la
          máquina y las tijeras, y al final el castillo con el nombre */}
      <div className="bienvenida bienvenida-poste" aria-hidden="true">
        <div className="bienvenida-centro">
          <div className="poste">
            <svg viewBox="0 0 200 200" className="poste-aro">
              <circle cx="100" cy="100" r="94" />
            </svg>
            <div className="pieza" style={{ animationDelay: "0.1s" }}>
              <div className="poste-cuerpo">
                <span className="poste-bola" />
                <span className="poste-tapa" />
                <span className="poste-anillo" />
                <span className="caramelo-tubo poste-tubo" />
                <span className="poste-anillo" />
                <span className="poste-tapa poste-tapa-abajo" />
                <span className="poste-bola" />
              </div>
            </div>
            <div className="pieza" style={{ animationDelay: "1.3s" }}>
              <Navaja />
            </div>
            <div className="pieza" style={{ animationDelay: "2.5s" }}>
              <Maquina />
            </div>
            <div className="pieza" style={{ animationDelay: "3.7s" }}>
              <TijerasAbiertas />
            </div>
            <div className="pieza pieza-final">
              <LogoCastillo className="h-24 w-24 text-oro" />
            </div>
          </div>
          <div className="poste-nombre">
            <Nombre />
          </div>
        </div>
      </div>

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

const PLATA = "#d8dce3";

// Navaja abierta: mango azul marino con remaches dorados y hoja plateada.
function Navaja() {
  return (
    <svg viewBox="0 0 200 200" className="herramienta">
      <g transform="rotate(20 100 100)">
        <path
          d="M118 112 L118 34 Q118 24 128 24 L150 28 Q154 29 154 34 L150 112 Z"
          fill={PLATA}
        />
        <path d="M150 30 L154 34 L150 112 L146 112 Z" fill="#ffffff" />
        <path
          d="M124 40 L144 36 M124 60 L144 56 M124 80 L144 76"
          stroke="var(--color-ladrillo)"
          strokeWidth="6"
        />
        <g transform="rotate(-35 134 112)">
          <rect
            x="24"
            y="103"
            width="112"
            height="18"
            rx="9"
            fill="var(--color-marino)"
            stroke="var(--color-oro)"
            strokeWidth="2.5"
          />
          <circle cx="38" cy="112" r="3.5" fill="var(--color-oro)" />
          <circle cx="124" cy="112" r="4.5" fill="var(--color-oro-claro)" />
        </g>
      </g>
    </svg>
  );
}

// Máquina de cortar pelo con detalles dorados y cable.
function Maquina() {
  return (
    <svg viewBox="0 0 200 200" className="herramienta">
      <g transform="rotate(35 100 100)">
        <path
          d="M100 160 Q100 178 88 186"
          fill="none"
          stroke="var(--color-crema)"
          strokeOpacity="0.6"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <rect
          x="76"
          y="48"
          width="48"
          height="114"
          rx="20"
          fill="#22252d"
          stroke="var(--color-oro)"
          strokeWidth="3"
        />
        <rect x="72" y="36" width="56" height="16" rx="4" fill={PLATA} />
        <path
          d="M76 36 v-7 M82 36 v-7 M88 36 v-7 M94 36 v-7 M100 36 v-7 M106 36 v-7 M112 36 v-7 M118 36 v-7 M124 36 v-7"
          stroke={PLATA}
          strokeWidth="3"
        />
        <rect
          x="88"
          y="72"
          width="24"
          height="44"
          rx="5"
          fill="none"
          stroke="var(--color-oro)"
          strokeWidth="2"
        />
        <path
          d="M93 104 L107 84"
          stroke="var(--color-oro-claro)"
          strokeWidth="2"
        />
        <rect
          x="93"
          y="128"
          width="14"
          height="16"
          rx="4"
          fill="var(--color-oro)"
        />
      </g>
    </svg>
  );
}

// Tijeras de barbero abiertas: hojas plateadas y argollas doradas.
function TijerasAbiertas() {
  const hoja = (abre: number) => (
    <g transform={`rotate(${abre})`}>
      <path d="M-8 -5 L78 -2 Q82 0 78 2 L-8 5 Z" fill={PLATA} />
      <path d="M-8 -5 L78 -2 L-8 -1 Z" fill="#ffffff" opacity="0.7" />
      <path
        d="M-8 0 L-26 -10"
        stroke="var(--color-oro)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle
        cx="-38"
        cy="-16"
        r="13"
        fill="none"
        stroke="var(--color-oro)"
        strokeWidth="6"
      />
    </g>
  );
  return (
    <svg viewBox="0 0 200 200" className="herramienta">
      <g transform="translate(100 104) rotate(-58)">
        {hoja(-11)}
        <g transform="scale(1 -1)">{hoja(-11)}</g>
        <circle r="4.5" fill="var(--color-oro-claro)" />
      </g>
    </svg>
  );
}
