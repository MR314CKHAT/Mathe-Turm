/**
 * Vertex-Skulptur für den Kopf: Aus einer Kugel wird per Deformations-
 * Feldern ein echtes Schädel-Profil geschnitzt – Kieferlinie, Kinn,
 * Stirnbein, Jochbeine, Schläfen und **Augenhöhlen** sind echte Geometrie.
 *
 * Alle Amplituden stehen in WELT-Einheiten (Figuren-Höhe ~1,70),
 * die Basisform wird zuerst ellipsoid skaliert, dann verformt.
 * Nach der Verformung wird neu normalisiert (computeVertexNormals),
 * damit die Beleuchtung glatt über die Übergänge läuft.
 */

import * as THREE from 'three';

/** Gaussian-Feld über die Richtung (1 - dot)/sigma – glatte Beule/Delle. */
function field(dot, sigma) {
  return Math.exp(-(1 - dot) / sigma);
}

/**
 * Baut die Kopf-Geometrie (zentriert auf Ursprung, Krone +Y, Gesicht +Z).
 * cfg erlaubt pro Person eigene Züge (queen = fein, pirate = kräftig).
 */
export function makeHeadGeometry(cfg = {}) {
  const {
    R = 0.15,
    sx = 0.96, // Breite
    sy = 1.14, // Höhe (Schädel lang)
    sz = 1.05, // Tiefe vorn/hinten
    jaw = 0.42, // Kiefer-Verjüngung unten (0..0.6)
    backTuck = 0.5, // Nacken stutzt nach innen
    chinAmp = 0.024, // Kinn-Vorwölbung (Welt-Einheiten)
    browAmp = 0.008, // Stirnbein-Wulst
    cheekAmp = 0.011, // Jochbein
    socketAmp = 0.019, // Augenhöhlen-Tiefe
    templeDent = 0.009, // Schläfen-Delle
    bridgeAmp = 0.006, // Nasenbrücken-Rinne
    sockets = [
      [-0.396, -0.1, 0.91],
      [0.396, -0.1, 0.91],
    ],
  } = cfg;

  const geo = new THREE.SphereGeometry(1, 56, 40);
  const pos = geo.attributes.position;
  const n = new THREE.Vector3();

  const chinDir = [0, -0.78, 0.62];
  const cheekDirs = [
    [-0.757, -0.053, 0.652],
    [0.757, -0.053, 0.652],
  ];
  const templeDirs = [
    [-0.803, 0.422, 0.422],
    [0.803, 0.422, 0.422],
  ];

  for (let i = 0; i < pos.count; i += 1) {
    n.fromBufferAttribute(pos, i);
    const dirX = n.x;
    const dirY = n.y;
    const dirZ = n.z;

    // --- Basisskalierung ---
    let x = dirX * sx;
    let y = dirY * sy;
    let z = dirZ * sz;

    // --- Kieferlinie & Nacken ---
    if (y < 0) {
      const t = Math.min(1, -y);
      x *= 1 - jaw * Math.pow(t, 1.4);
      if (z < 0) z *= 1 - backTuck * Math.pow(t, 1.6);
      else z *= 1 - 0.1 * Math.pow(t, 2);
    }

    // in Welt-Einheiten umrechnen
    x *= R;
    y *= R;
    z *= R;

    // --- Kinn-Vorwölbung ---
    let dot =
      dirX * chinDir[0] + dirY * chinDir[1] + dirZ * chinDir[2];
    const chin = chinAmp * field(dot, 0.07);
    x += chinDir[0] * chin;
    y += chinDir[1] * chin;
    z += chinDir[2] * chin;

    // --- Jochbeine ---
    for (const c of cheekDirs) {
      dot = dirX * c[0] + dirY * c[1] + dirZ * c[2];
      const a = cheekAmp * field(dot, 0.1);
      x += c[0] * a;
      y += c[1] * a;
      z += c[2] * a;
    }

    // --- Augenhöhlen (nach innen) ---
    for (const s of sockets) {
      dot = dirX * s[0] + dirY * s[1] + dirZ * s[2];
      z -= socketAmp * field(dot, 0.045);
    }

    // --- Stirnbein: Wulst über den Augen, nur im Frontbereich ---
    const front = Math.max(0, (dirZ - 0.35) / 0.65);
    z += browAmp * Math.exp(-Math.pow(dirY - 0.2, 2) / 0.03) * front;

    // --- Nasenbrücken-Rinne (Mitte) ---
    z +=
      bridgeAmp *
      Math.exp(-(dirX * dirX) / 0.012) *
      Math.exp(-Math.pow(dirY - 0.05, 2) / 0.09) *
      front;

    // --- Schläfen ---
    for (const tp of templeDirs) {
      dot = dirX * tp[0] + dirY * tp[1] + dirZ * tp[2];
      const a = templeDent * field(dot, 0.07);
      x -= Math.sign(tp[0]) * a * 0.7;
      z -= a * 0.3;
    }

    pos.setXYZ(i, x, y, z);
  }

  geo.computeVertexNormals();
  return geo;
}
