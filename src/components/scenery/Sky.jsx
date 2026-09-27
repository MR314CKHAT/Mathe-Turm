import { skyFor } from '../../utils/theme.js';

/**
 * Der Himmel über dem Turm: wechselt mit der Höhe von Morgenrot über
 * Sternennacht bis zur Zauberwelt – inklusive Wolken, Sonne, Mond,
 * Regenbogen und Glitzer.
 */

function Cloud({ top, scale, duration, delay, opacity = 1 }) {
  return (
    <span
      className="cloud-track"
      style={{
        top: `${top}%`,
        '--cloud-duration': `${duration}s`,
        '--cloud-delay': `${delay}s`,
      }}
    >
      <span className="cloud" style={{ opacity, '--cloud-scale': scale }} />
    </span>
  );
}

export default function Sky({ floor, theme }) {
  const sky = skyFor(theme, floor);

  return (
    <div className={`sky sky--${theme}`}>
      <div
        className="sky__gradient"
        style={{
          background: `linear-gradient(to top, ${sky.bottom} 0%, ${sky.mid} 48%, ${sky.top} 100%)`,
        }}
      />

      <div className="sky__stars" style={{ opacity: sky.stars }}>
        {Array.from({ length: 26 }).map((_, index) => (
          <span
            key={index}
            className="sky__star"
            style={{
              left: `${(index * 41) % 97}%`,
              top: `${(index * 29) % 86}%`,
              transform: `scale(${0.6 + ((index * 7) % 5) / 5})`,
              animationDelay: `${(index % 6) * 0.4}s`,
            }}
          />
        ))}
      </div>

      <div className="sky__sun" style={{ opacity: sky.sun }}>
        <span className="sky__rays" />
        <span className="sky__sun-core" />
      </div>

      <div className="sky__moon" style={{ opacity: sky.moon }}>
        <span className="sky__moon-crater sky__moon-crater--1" />
        <span className="sky__moon-crater sky__moon-crater--2" />
        <span className="sky__moon-crater sky__moon-crater--3" />
      </div>

      <div className="sky__rainbow" style={{ opacity: sky.rainbow }}>
        <i />
        <i />
        <i />
      </div>

      <div className="sky__birds" style={{ opacity: Math.max(0, 1 - sky.magic * 1.4) }}>
        <span className="bird bird--1" />
        <span className="bird bird--2" />
        <span className="bird bird--3" />
      </div>

      <div className="sky__balloon" style={{ opacity: Math.max(0.15, 1 - sky.magic) }}>
        <span className="balloon__envelope" />
        <span className="balloon__basket" />
      </div>

      <div className="sky__magic" style={{ opacity: sky.magic }}>
        <span className="sparkle sparkle--1" />
        <span className="sparkle sparkle--2" />
        <span className="sparkle sparkle--3" />
        <span className="sparkle sparkle--4" />
        <span className="sparkle sparkle--5" />
        <span className="sparkle sparkle--6" />
        <span className="butterfly butterfly--1" />
        <span className="butterfly butterfly--2" />
      </div>

      <div className="sky__clouds sky__clouds--back">
        <Cloud top={60} scale={0.85} duration={52} delay={0} opacity={0.75} />
        <Cloud top={33} scale={1.05} duration={64} delay={-12} opacity={0.8} />
        <Cloud top={52} scale={0.9} duration={58} delay={-30} opacity={0.7} />
      </div>

      <div className="sky__clouds sky__clouds--front">
        <Cloud top={80} scale={1.25} duration={40} delay={-6} opacity={0.95} />
        <Cloud top={13} scale={1.15} duration={46} delay={-24} opacity={0.9} />
      </div>

      <span className="sky__zone">{sky.zone}</span>
    </div>
  );
}
