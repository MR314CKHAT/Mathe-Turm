const FLOOR_H = 46;
const GROUND_H = 48;
const VISIBLE_FLOORS = 8;
const VIEW_H = FLOOR_H * VISIBLE_FLOORS + GROUND_H;

const mix = (from, to, t) =>
  `rgb(${from.map((c, i) => Math.round(c + (to[i] - c) * t)).join(', ')})`;

/**
 * Zeichnet das Hochhaus. Je höher der Spieler kommt, desto höher "fährt"
 * die Kamera mit (der Turm bewegt sich nach unten) und desto dunkler wird
 * der Himmel – bis man irgendwann in den Sternen steht.
 */
export default function Tower({ floor }) {
  const totalFloors = Math.max(14, floor + 8);
  const camY = Math.max(0, (floor - 3) * FLOOR_H);
  const progress = Math.min(1, Math.max(0, floor / 25));
  const dark = progress > 0.5;

  const skyTop = mix([124, 180, 255], [8, 16, 50], progress);
  const skyBottom = mix([216, 238, 255], [34, 60, 124], progress);

  const floors = [];
  for (let i = 1; i <= totalFloors; i += 1) floors.push(i);

  const character = floor >= 15 ? '🧑‍🚀' : '🧒';

  return (
    <div
      className="tower"
      style={{
        height: `${VIEW_H}px`,
        background: `linear-gradient(to top, ${skyBottom}, ${skyTop})`,
      }}
      aria-label={`Du bist im ${floor}. Stockwerk`}
    >
      <div className="tower__stars" style={{ opacity: progress }} aria-hidden="true">
        {Array.from({ length: 22 }).map((_, index) => (
          <span
            key={index}
            className="tower__star"
            style={{
              left: `${(index * 37) % 96}%`,
              top: `${(index * 53) % 90}%`,
              animationDelay: `${(index % 5) * 0.4}s`,
            }}
          />
        ))}
      </div>

      <div
        className="tower__clouds"
        style={{ opacity: Math.max(0, 1 - progress * 2) }}
        aria-hidden="true"
      >
        <span className="tower__cloud tower__cloud--1">☁️</span>
        <span className="tower__cloud tower__cloud--2">☁️</span>
        <span className="tower__cloud tower__cloud--3">⛅</span>
      </div>

      <div
        className="tower__inner"
        style={{ transform: `translateY(${camY}px)` }}
      >
        <div className="tower__ground" style={{ height: `${GROUND_H}px` }}>
          <span className="tower__tree">🌳</span>
          <span className="tower__tree tower__tree--right">🌲</span>
          <span className="tower__door">🚪</span>
        </div>

        {floors.map((number) => {
          const isCurrent = number === floor;
          const isMilestone = number % 5 === 0;
          return (
            <div
              key={number}
              className={`floor${isCurrent ? ' floor--current' : ''}${
                isMilestone ? ' floor--milestone' : ''
              }`}
              style={{
                bottom: `${GROUND_H + (number - 1) * FLOOR_H}px`,
                height: `${FLOOR_H}px`,
              }}
            >
              <span className="floor__number">
                {isMilestone && number !== 0 ? '⭐' : number}
              </span>
              <span className="floor__window">{isCurrent ? character : '🪟'}</span>
            </div>
          );
        })}
      </div>

      <div className={`tower__badge${dark ? ' tower__badge--light' : ''}`}>
        <strong>{floor}</strong>
        <span>Stockwerk</span>
      </div>
    </div>
  );
}

