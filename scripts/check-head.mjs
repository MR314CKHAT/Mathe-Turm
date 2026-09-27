/**
 * Numerischer Kopf-Check ohne Rendering: dumpet das Gesichtsprofil
 * (Sagittalschnitt x≈0), Breiten auf Augen-/Kieferhöhe sowie die
 * Socket-Tiefe – so lässt sich die Skulptur prüfen, bevor sie jemand sieht.
 *
 *   node scripts/check-head.mjs
 */
import { makeHeadGeometry } from '../src/three/headSculpt.js';

const CONFIGS = {
  'Jungkönigin (fein)': { sx: 0.94, sy: 1.13, sz: 1.04, jaw: 0.44, chinAmp: 0.021, browAmp: 0.006, cheekAmp: 0.012, socketAmp: 0.019 },
  'Piratin (kräftig)': { sx: 1.0, sy: 1.16, sz: 1.08, jaw: 0.36, chinAmp: 0.028, browAmp: 0.011, cheekAmp: 0.013, socketAmp: 0.021 },
};

for (const [name, cfg] of Object.entries(CONFIGS)) {
  const geo = makeHeadGeometry(cfg);
  const pos = geo.attributes.position;
  const verts = [];
  for (let i = 0; i < pos.count; i += 1) {
    verts.push([pos.getX(i), pos.getY(i), pos.getZ(i)]);
  }

  const round = (v) => Math.round(v * 1000) / 1000;
  console.log(`\n########## ${name} ##########`);

  console.log('=== Sagittales Profil (x ≈ 0,003) : y → z (vorn) ===');
  const mid = verts.filter((v) => Math.abs(v[0]) < 0.003);
  const buckets = new Map();
  for (const [, y, z] of mid) {
    const key = Math.round(y * 50) / 50;
    if (!buckets.has(key) || z > buckets.get(key)) buckets.set(key, z);
  }
  for (const y of [...buckets.keys()].sort((a, b) => b - a)) {
    console.log(`  y=${String(round(y)).padStart(6)} → z=${round(buckets.get(y))}`);
  }

  console.log('=== Breiten (max |x|) ===');
  for (const yLevel of [0.13, 0.05, -0.01, -0.08, -0.12, -0.16]) {
    const near = verts.filter((v) => Math.abs(v[1] - yLevel) < 0.012);
    const mx = Math.max(...near.map((v) => Math.abs(v[0])));
    console.log(`  y=${String(yLevel).padStart(5)} → Breite ±${round(mx)}`);
  }

  console.log('=== Augenhöhlen (Delle vs. rechnerische Grundfläche) ===');
  for (const s of [[-0.396, -0.1, 0.91], [0.396, -0.1, 0.91]]) {
    let best = null;
    for (const v of verts) {
      const len = Math.hypot(v[0], v[1], v[2]);
      if (len < 0.05) continue;
      const dot = (v[0] * s[0] + v[1] * s[1] + v[2] * s[2]) / len;
      if (!best || dot > best.dot) best = { dot, v };
    }
    const eye = best.v;
    // Grundfläche (Ellipsoid ohne Deformation) auf Höhe des Augapunkts
    const R = cfg.R ?? 0.15;
    const ex = eye[0] / (R * cfg.sx);
    const ey = eye[1] / (R * cfg.sy);
    const base = R * cfg.sz * Math.sqrt(Math.max(0, 1 - ex * ex - ey * ey));
    console.log(
      `  x=${round(eye[0])}: Oberfläche z=${round(eye[2])} | Basis ≈${round(base)}` +
        ` → Höhle ${round(base - eye[2])}`
    );
  }

  const ys = verts.map((v) => v[1]);
  const zs = verts.map((v) => v[2]);
  const xs = verts.map((v) => v[0]);
  console.log(
    `Maße: Höhe ${round(Math.min(...ys))}…${round(Math.max(...ys))}` +
      ` | Breite ±${round(Math.max(...xs.map(Math.abs)))}` +
      ` | Tiefe ${round(Math.min(...zs))}…${round(Math.max(...zs))}`
  );
}
console.log('\nOK');
