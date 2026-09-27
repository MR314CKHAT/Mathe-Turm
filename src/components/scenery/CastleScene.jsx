import { FLOOR_H, GROUND_H, floorBottom } from './geometry.js';

/**
 * Die Schloss-Welt: gemauerter Rundturm mit Spitzbogen-Fenstern,
 * Blumenkästen, Balkonen, Rosenranken und Wimpelketten.
 */

/** Jede Etage bekommt eine Aufgabe fürs Auge – aber immer gleich, nicht zufällig. */
function floorKind(number) {
  if (number % 5 === 0) return 'checkpoint';
  if (number % 3 === 0) return 'balcony';
  if (number % 4 === 0) return 'vine';
  if (number % 6 === 0) return 'arch';
  return 'plain';
}

function CastleFloor({ number, isCurrent }) {
  const kind = floorKind(number);

  return (
    <div
      className={`floor floor--${kind}${isCurrent ? ' floor--current' : ''}`}
      style={{ bottom: `${floorBottom(number)}px`, height: `${FLOOR_H}px` }}
    >
      <span className="floor__stones" aria-hidden="true" />

      {kind === 'checkpoint' && (
        <span className="floor__banner" aria-hidden="true">
          <i className="floor__banner-flag" />
          <b className="floor__banner-num">{number}</b>
        </span>
      )}

      <span className="floor__window" aria-hidden="true">
        <i className="floor__pane floor__pane--l" />
        <i className="floor__pane floor__pane--r" />
        {number % 7 === 0 && <span className="floor__neighbor" />}
      </span>

      {kind === 'balcony' && (
        <span className="floor__balcony" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      )}

      {kind === 'vine' && <span className="floor__vine" aria-hidden="true" />}
      {kind === 'arch' && <span className="floor__torch" aria-hidden="true" />}

      <span className="floor__sill" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>

      <span className="floor__number">{number}</span>
    </div>
  );
}

function Garden() {
  return (
    <div className="ground" style={{ height: `${GROUND_H}px` }}>
      <span className="ground__hill" aria-hidden="true" />
      <span className="ground__grass" aria-hidden="true" />
      <span className="ground__hedge ground__hedge--l" aria-hidden="true" />
      <span className="ground__hedge ground__hedge--r" aria-hidden="true" />
      <span className="ground__path" aria-hidden="true" />
      <span className="ground__gate" aria-hidden="true">
        <i className="ground__gate-top" />
      </span>
      <span className="ground__fountain" aria-hidden="true">
        <i className="ground__fountain-water" />
      </span>
      <span className="ground__bush ground__bush--1" aria-hidden="true" />
      <span className="ground__bush ground__bush--2" aria-hidden="true" />
      <span className="ground__flowers" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

export default function CastleScene({ floor, totalFloors }) {
  const floors = [];
  for (let number = 1; number <= totalFloors; number += 1) floors.push(number);

  return (
    <>
      <Garden />
      {floors.map((number) => (
        <CastleFloor key={number} number={number} isCurrent={number === floor} />
      ))}
    </>
  );
}
