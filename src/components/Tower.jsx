import { useEffect, useRef } from 'react';
import Character from './Character.jsx';
import Sky from './scenery/Sky.jsx';
import CastleScene from './scenery/CastleScene.jsx';
import { Burst, Rain, Sparkles } from './scenery/Particles.jsx';
import { cameraOffset, floorBottom, renderedFloors, VIEW_H } from './scenery/geometry.js';

/**
 * Der Turm: Kamera, Himmel, Szene, Spielfigur, Effekte und Höhenskala.
 * Die Szene (Zauberschloss / Piratenmast) wird über "theme" ausgetauscht.
 *
 * mood: idle | cheer | sad   – Stimmung der Figur
 * burst/rain/sparkle/shake   – Zähler, die einen Effekt neu starten
 */
export default function Tower({
  floor,
  theme = 'princess',
  mood = 'idle',
  burst = 0,
  rain = 0,
  sparkle = 0,
  shake = 0,
}) {
  const totalFloors = renderedFloors(floor);
  const camY = cameraOffset(floor);

  // Schritt 1: Schloss-Welt. Der Piratenmast folgt in Schritt 2.
  const Scene = CastleScene;

  // Beben neu starten: Klasse kurz abziehen, neu auslösen (Reflow), wieder setzen.
  const towerRef = useRef(null);
  const lastShake = useRef(0);
  useEffect(() => {
    const node = towerRef.current;
    if (!node || shake === lastShake.current) return;
    lastShake.current = shake;
    node.classList.remove('tower--shake');
    if (shake <= 0) return;
    void node.offsetWidth; // Reflow erzwingen
    node.classList.add('tower--shake');
  }, [shake]);

  const knots = [];
  for (let number = 5; number <= totalFloors + 5; number += 5) knots.push(number);

  return (
    <div
      ref={towerRef}
      className={`tower tower--${theme}`}
      style={{ '--tower-height': `${VIEW_H}px` }}
      aria-label={`Du bist im ${floor}. Stockwerk`}
    >
      <Sky floor={floor} theme={theme} />

      <div className="tower__inner" style={{ transform: `translateY(${camY}px)` }}>
        <Scene floor={floor} totalFloors={totalFloors} />

        <div className="climber" style={{ bottom: `${floorBottom(floor) + 6}px` }}>
          <Character theme={theme} mood={mood} />
        </div>
      </div>

      {/* Kletterseil links als Höhenskala */}
      <div className="gauge" aria-hidden="true">
        <span className="gauge__rope" />
        {knots.map((number) => (
          <span
            key={number}
            className={`gauge__knot${floor >= number ? ' gauge__knot--reached' : ''}`}
            style={{ bottom: `${floorBottom(number) - camY + 20}px` }}
          >
            {floor >= number ? '★' : ''}
          </span>
        ))}
      </div>

      {burst > 0 && <Burst nonce={burst} theme={theme} />}
      {sparkle > 0 && <Sparkles nonce={sparkle} />}
      {rain > 0 && <Rain nonce={rain} theme={theme} />}

      <div className="tower__badge">
        <b>{floor}</b>
        <span>{theme === 'pirate' ? 'Plattform' : 'Stockwerk'}</span>
      </div>
    </div>
  );
}
