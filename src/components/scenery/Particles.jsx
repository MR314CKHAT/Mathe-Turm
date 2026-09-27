/**
 * Belohnungs-Effekte, komplett in CSS: Konfetti-Burst, Glitzerregen
 * (Zauberschlüssel) und Funken. Der Effekt wird über "key" neu gestartet.
 */

function randomFrom(list, index) {
  return list[index % list.length];
}

export function Burst({ nonce = 0, theme = 'princess', count = 16 }) {
  const colors =
    theme === 'pirate'
      ? ['#ffd35e', '#f4a259', '#e8e0cc', '#8ad0e8']
      : ['#ff9ecb', '#ffd35e', '#9a63e0', '#7ee8fa', '#ffffff'];

  return (
    <div className="burst" key={nonce} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => {
        const angle = (index / count) * 360 + (index % 3) * 12;
        const distance = 60 + ((index * 37) % 70);
        return (
          <span
            key={index}
            className={`burst__piece burst__piece--${index % 3}`}
            style={{
              '--tx': `${Math.cos((angle * Math.PI) / 180) * distance}px`,
              '--ty': `${Math.sin((angle * Math.PI) / 180) * distance}px`,
              '--rot': `${index * 47}deg`,
              '--delay': `${(index % 5) * 0.04}s`,
              background: randomFrom(colors, index),
            }}
          />
        );
      })}
    </div>
  );
}

export function Rain({ nonce = 0, theme = 'princess', count = 22 }) {
  const symbol = theme === 'pirate' ? '🪙' : '🗝️';

  return (
    <div className="rain" key={nonce} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={index}
          className="rain__drop"
          style={{
            left: `${(index * 43) % 96}%`,
            animationDelay: `${(index % 8) * 0.16}s`,
            fontSize: `${14 + ((index * 13) % 12)}px`,
          }}
        >
          {index % 3 === 0 ? '⭐' : symbol}
        </span>
      ))}
    </div>
  );
}

export function Sparkles({ nonce = 0, count = 10 }) {
  return (
    <div className="sparkle-burst" key={nonce} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={index}
          className="sparkle-burst__star"
          style={{
            left: `${8 + ((index * 37) % 84)}%`,
            top: `${10 + ((index * 53) % 70)}%`,
            animationDelay: `${(index % 5) * 0.07}s`,
          }}
        />
      ))}
    </div>
  );
}
