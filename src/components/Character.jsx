/**
 * Spielfiguren als SVG. Keine Emojis, damit sie überall gleich aussehen
 * und animiert werden können (Arme, Kopf, Umhang).
 *
 * Stimmungen (mood): idle | jump | cheer | sad
 */

function Princess() {
  return (
    <svg className="ch" viewBox="0 0 100 150" role="img" aria-label="Prinzessin">
      {/* Umhang */}
      <path
        className="ch-cape"
        d="M32 70 Q16 108 20 134 L80 134 Q84 108 68 70 Z"
        fill="#9a63e0"
        stroke="#3f1668"
        strokeWidth="3.4"
        strokeLinejoin="round"
      />

      {/* Kleid */}
      <path
        className="ch-dress"
        d="M36 68 L64 68 L78 128 Q50 137 22 128 Z"
        fill="#ff9ecb"
        stroke="#5b2352"
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
      <path
        className="ch-apron"
        d="M43 76 L57 76 L66 122 Q50 128 34 122 Z"
        fill="#ffe3f1"
        stroke="#5b2352"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle className="ch-gem" cx="50" cy="88" r="4.4" fill="#ffd35e" stroke="#5b2352" strokeWidth="2" />

      {/* Arme */}
      <g className="ch-arm ch-arm--l">
        <rect x="21" y="70" width="12" height="33" rx="6" fill="#ffdcc9" stroke="#5b2352" strokeWidth="3" />
        <circle cx="27" cy="76" r="8.5" fill="#ff9ecb" stroke="#5b2352" strokeWidth="3" />
      </g>
      <g className="ch-arm ch-arm--r">
        <rect x="67" y="70" width="12" height="33" rx="6" fill="#ffdcc9" stroke="#5b2352" strokeWidth="3" />
        <circle cx="73" cy="76" r="8.5" fill="#ff9ecb" stroke="#5b2352" strokeWidth="3" />
      </g>

      {/* Kopf */}
      <g className="ch-head">
        <ellipse cx="50" cy="47" rx="24" ry="24" fill="#c2793f" stroke="#5b2352" strokeWidth="3.4" />
        <circle cx="50" cy="50" r="19.5" fill="#ffe2cf" stroke="#5b2352" strokeWidth="3.4" />
        <path
          d="M31 42 Q36 24 50 24 Q64 24 69 42 Q60 33 50 33 Q40 33 31 42 Z"
          fill="#c2793f"
          stroke="#5b2352"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <path
          className="ch-crown"
          d="M32 26 L37 13 L44 23 L50 10 L56 23 L63 13 L68 26 Z"
          fill="#ffd35e"
          stroke="#8a5a00"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <circle className="ch-crown-gem" cx="50" cy="20" r="2.6" fill="#ff77b0" />
        <ellipse className="ch-eye" cx="43" cy="50" rx="2.8" ry="3.4" fill="#43220f" />
        <ellipse className="ch-eye" cx="57" cy="50" rx="2.8" ry="3.4" fill="#43220f" />
        <circle className="ch-cheek" cx="37.5" cy="57" r="3.6" fill="#ff9ecb" opacity="0.55" />
        <circle className="ch-cheek" cx="62.5" cy="57" r="3.6" fill="#ff9ecb" opacity="0.55" />
        <path
          className="ch-mouth"
          d="M44 58 Q50 65 56 58"
          fill="none"
          stroke="#5b2352"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </g>

      {/* Schleife */}
      <path
        className="ch-bow"
        d="M68 40 L80 34 L80 48 Z"
        fill="#ff77b0"
        stroke="#5b2352"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Pirate() {
  return (
    <svg className="ch" viewBox="0 0 100 150" role="img" aria-label="Pirat">
      {/* Beine + Stiefel */}
      <g className="ch-legs">
        <rect x="36" y="108" width="11" height="26" rx="4" fill="#2f4a6b" stroke="#16233a" strokeWidth="3" />
        <rect x="53" y="108" width="11" height="26" rx="4" fill="#2f4a6b" stroke="#16233a" strokeWidth="3" />
        <rect x="32" y="128" width="17" height="10" rx="4" fill="#6b4a2f" stroke="#16233a" strokeWidth="3" />
        <rect x="51" y="128" width="17" height="10" rx="4" fill="#6b4a2f" stroke="#16233a" strokeWidth="3" />
      </g>

      {/* Arme (links mit Haken) */}
      <g className="ch-arm ch-arm--l">
        <rect x="22" y="70" width="12" height="32" rx="6" fill="#efc39b" stroke="#16233a" strokeWidth="3" />
        <path d="M25 100 q6 9 13 3" fill="none" stroke="#c9d3da" strokeWidth="5" strokeLinecap="round" />
      </g>
      <g className="ch-arm ch-arm--r">
        <rect x="66" y="70" width="12" height="32" rx="6" fill="#efc39b" stroke="#16233a" strokeWidth="3" />
      </g>

      {/* Ringelshirt + Weste + Gürtel */}
      <path
        className="ch-shirt"
        d="M36 68 L64 68 L70 112 Q50 120 30 112 Z"
        fill="#f4f1e8"
        stroke="#16233a"
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
      <g className="ch-stripes">
        <rect x="31" y="76" width="38" height="5" rx="2.5" fill="#3b6ea5" />
        <rect x="30" y="88" width="40" height="5" rx="2.5" fill="#3b6ea5" />
        <rect x="31" y="100" width="38" height="5" rx="2.5" fill="#3b6ea5" />
      </g>
      <path
        className="ch-vest"
        d="M36 68 L46 68 L46 110 L31 108 Z M64 68 L54 68 L54 110 L69 108 Z"
        fill="#7a4f2c"
        stroke="#16233a"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <rect x="30" y="106" width="40" height="9" rx="3" fill="#3a2a1c" stroke="#16233a" strokeWidth="3" />
      <rect x="45" y="105" width="10" height="11" rx="2.5" fill="#ffd35e" stroke="#8a5a00" strokeWidth="2.4" />

      {/* Kopf */}
      <g className="ch-head">
        <circle cx="50" cy="48" r="20.5" fill="#efc39b" stroke="#16233a" strokeWidth="3.4" />
        <path
          className="ch-bandana"
          d="M29 46 Q32 22 50 22 Q68 22 71 46 Q60 38 50 38 Q40 38 29 46 Z"
          fill="#e0454b"
          stroke="#16233a"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          className="ch-bandana-tail"
          d="M69 40 L84 32 L82 48 Z"
          fill="#e0454b"
          stroke="#16233a"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <path d="M33 43 L57 39" stroke="#16233a" strokeWidth="3" />
        <circle cx="61" cy="49" r="6.4" fill="#232f42" stroke="#16233a" strokeWidth="2.6" />
        <ellipse className="ch-eye" cx="43" cy="51" rx="2.8" ry="3.2" fill="#3a2415" />
        <path
          className="ch-mouth"
          d="M42 60 Q50 68 60 60"
          fill="none"
          stroke="#16233a"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <circle className="ch-cheek" cx="37" cy="58" r="3.4" fill="#e08a6a" opacity="0.5" />
        <circle className="ch-cheek" cx="64" cy="58" r="3.4" fill="#e08a6a" opacity="0.5" />
      </g>
    </svg>
  );
}

export default function Character({ theme = 'princess', mood = 'idle' }) {
  return (
    <div className={`character character--${theme} character--${mood}`}>
      {theme === 'pirate' ? <Pirate /> : <Princess />}
    </div>
  );
}
