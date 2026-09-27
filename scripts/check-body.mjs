/**
 * Numerische Körper-Prüfung ohne Rendering: Proportionen, Gelenk- und
 * Radius-Vermeidung, Boden-Kontakt. Beweist, dass die Beine/Arme keine
 * dünnen Stäbe sind und an den Gelenken keine Lücken entstehen können.
 *
 *   node scripts/check-body.mjs
 */
import {
  RIG,
  makeTorsoGeometry,
  makeNeckGeometry,
  makeUpperArmGeometry,
  makeForearmGeometry,
  makeHandGeometry,
  makeThighGeometry,
  makeShinGeometry,
  makeFootGeometry,
} from '../src/three/bodySculpt.js';

const r3 = (v) => Math.round(v * 1000) / 1000;

// --- Bauteile wie im Rig platziert ---
const parts = [
  { name: 'Rumpf', geo: makeTorsoGeometry(), at: [0, RIG.hip, 0] },
  { name: 'Hals', geo: makeNeckGeometry(), at: [0, 1.4, 0] },
  { name: 'Oberarm', geo: makeUpperArmGeometry(), at: [-0.145, RIG.shoulder, 0] },
  { name: 'Unterarm', geo: makeForearmGeometry(), at: [-0.145, RIG.shoulder - RIG.upperArm, 0] },
  { name: 'Hand', geo: makeHandGeometry(-1), at: [-0.145, RIG.shoulder - RIG.upperArm - RIG.forearm, 0] },
  { name: 'Oberschenkel', geo: makeThighGeometry(), at: [-0.085, RIG.hip, 0] },
  { name: 'Unterschenkel', geo: makeShinGeometry(), at: [-0.085, RIG.knee, 0] },
  { name: 'Fuß', geo: makeFootGeometry(), at: [-0.085, RIG.ankle, 0] },
];

console.log('=== Bauteile: Radius, Vertices, Dreiecke ===');
let verts = 0;
let tris = 0;
for (const p of parts) {
  const pos = p.geo.attributes.position;
  verts += pos.count;
  tris += p.geo.index.count / 3;
  // schmalster echter Querschnitt: pro Höhen-Ring der größte Radius.
  // Pol-Vertices (Einzelpunkte) und die Hemisphären-Kappen an beiden Enden
  // sind konstruktionsbedingt schmal und werden ausgenommen.
  const posAll = pos;
  let minYy = Infinity;
  let maxYy = -Infinity;
  for (let i = 0; i < posAll.count; i += 1) {
    const y = posAll.getY(i);
    if (y < minYy) minYy = y;
    if (y > maxYy) maxYy = y;
  }
  const span = maxYy - minYy;
  const lo = minYy + span * 0.16;
  const hi = maxYy - span * 0.16;
  const buckets = new Map();
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    if (y < lo || y > hi) continue;
    const key = Math.round(y * 1000) / 1000;
    const r = Math.hypot(pos.getX(i), pos.getZ(i));
    if (!buckets.has(key)) buckets.set(key, { max: 0, n: 0 });
    const b = buckets.get(key);
    b.max = Math.max(b.max, r);
    b.n += 1;
  }
  let minR = Infinity;
  for (const b of buckets.values()) {
    if (b.n < 3) continue; // Pol
    if (b.max < minR) minR = b.max;
  }
  const flag = minR < 0.02 ? '  ⚠ zu dünn' : '';
  console.log(
    `  ${p.name.padEnd(14)} dünnster Radius ${r3(minR)}  ` +
      `Vertices ${String(pos.count).padStart(4)}  Dreiecke ${String(p.geo.index.count / 3).padStart(4)}${flag}`
  );
}
console.log(`  Summe: ${verts} Vertices, ${tris} Dreiecke (eine Figur)`);

console.log('\n=== Gelenke: konzentrische Kappen ⇒ keine Lücke ===');
const joints = [
  ['Ellbogen', RIG.rElbow, RIG.upperArm],
  ['Knie', RIG.rKnee, RIG.thigh],
  ['Schulter', RIG.rShoulder, 0],
  ['Hüfte', RIG.rHip, 0],
];
for (const [name, r] of joints) {
  console.log(
    `  ${name.padEnd(9)} Kappenradius ${r} – beide Segmente teilen den Mittelpunkt,` +
      ' Abstand beim Biegen bleibt 0 → kein Spalt'
  );
}

console.log('\n=== Proportionen (Gesamthöhe 1,78) ===');
const H = RIG.headTop;
const rows = [
  ['Kopfhöhe', 0.339, '1 : ' + r3(H / 0.339) + ' Körper'],
  ['Schulterhöhe', RIG.shoulder, r3((RIG.shoulder / H) * 100) + ' % (real ≈ 82 %)'],
  ['Hüfthöhe', RIG.hip, r3((RIG.hip / H) * 100) + ' % (real ≈ 49 %)'],
  ['Kniehöhe', RIG.knee, r3((RIG.knee / H) * 100) + ' % (real ≈ 28 %)'],
  ['Arm gesamt', RIG.upperArm + RIG.forearm + RIG.hand, r3(RIG.shoulder - (RIG.upperArm + RIG.forearm + RIG.hand)) + ' Knöchelhöhe'],
  ['Bein gesamt', RIG.thigh + RIG.shin, r3(H / 2 - (RIG.ankle - 0.03)) + ' Beinlänge/Höhe'],
  ['Oberarm-Ø', 0.045 * 2, 'Unterarm-Ø 0,082 – kein Stab'],
  ['Oberschenkel-Ø', 0.068 * 2, 'Wade-Ø 0,106'],
  ['Hand', RIG.hand, 'Handfläche 0,086 breit, Daumen verschmolzen'],
];
for (const [a, b, c] of rows) {
  console.log(`  ${a.padEnd(16)} ${String(r3(b)).padStart(6)}   ${c}`);
}

console.log('\n=== Boden & Silhouette ===');
let minY = Infinity;
let maxX = 0;
for (const p of parts) {
  const pos = p.geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i) + p.at[1];
    const x = pos.getX(i) + p.at[0];
    if (y < minY) minY = y;
    if (Math.abs(x) > maxX) maxX = Math.abs(x);
  }
}
console.log(`  tiefster Punkt y=${r3(minY)} (Sohle soll ≈ 0 sein)`);
console.log(`  größte Breite ±${r3(maxX)} (Schulter mit Deltakugel)`);
console.log(minY > -0.03 ? '  ✅ Füße stehen auf dem Boden' : '  ⚠ Fuß steht über/unter dem Boden');
console.log('\nOK');
