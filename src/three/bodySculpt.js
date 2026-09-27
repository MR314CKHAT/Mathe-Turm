import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Körper- statt Primitive-Geometrie.
 *
 * Kern ist `loftGeometry()`: eine Mantelfläche wird durch eine Knotenliste
 * gezogen – elliptische Querschnitte entlang einer Catmull-Rom-Kurve, beide
 * Enden mit **Hemisphären-Kappen** verschlossen. Dadurch ist jedes Teil aus
 * jeder Richtung geschlossen (keine flachen Deckflächen) und Gelenke lassen
 * sich als zwei konzentrische Kappen bilden, die beim Beugen nicht
 * auseinandergehen können.
 *
 * Alle Maße in Welt-Einheiten, Fußboden = 0, Gesamthöhe ≈ 1,78.
 */

const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

/** Zentrale Rig-Maße – Character3D und Prüfskript lesen beide hier. */
export const RIG = {
  ankle: 0.075,
  knee: 0.47,
  hip: 0.86,
  waist: 1.05,
  shoulder: 1.41,
  neck: 1.47,
  headGroup: 1.45, // Ursprung der Kopf-Gruppe (Kopf-Mitte +0,16)
  headTop: 1.78,
  upperArm: 0.43, // Schulter → Ellbogen
  forearm: 0.38, // Ellbogen → Handgelenk
  hand: 0.175,
  thigh: 0.39, // Hüfte → Knie
  shin: 0.395, // Knie → Knöchel
  rShoulder: 0.062, // Deltakugel
  rElbow: 0.038,
  rKnee: 0.05,
  rHip: 0.085,
  rAnkle: 0.034,
  rWrist: 0.028,
};

/**
 * Mantel durch Knotenliste.
 * nodes: [{ p:[x,y,z], rx, ry }] – rx = halbe Breite, ry = halbe Tiefe
 * arc/arcStart: Revolutionsausschnitt (z. B. Weste mit V-Öffnung)
 */
export function loftGeometry(opts) {
  const {
    nodes,
    samples = 30,
    radial = 14,
    arc = Math.PI * 2,
    arcStart = 0,
    capStart = true,
    capEnd = true,
    capRings = 4,
    up = [0, 0, 1],
  } = opts;

  const pts = nodes.map((n) => new THREE.Vector3(n.p[0], n.p[1], n.p[2]));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
  const N = Math.max(8, samples);
  const last = nodes.length - 1;
  const full = Math.abs(arc - Math.PI * 2) < 1e-6;

  // Kurvenpunkte, Tangenten, Radien
  const P = curve.getPoints(N);
  const tan = [];
  for (let i = 0; i <= N; i += 1) {
    const a = P[Math.max(0, i - 1)];
    const b = P[Math.min(N, i + 1)];
    tan.push(new THREE.Vector3().subVectors(b, a).normalize());
  }
  const rad = [];
  for (let i = 0; i <= N; i += 1) {
    const t = (i / N) * last;
    const k = Math.min(last - 1, Math.floor(t));
    const f = smooth(t - k);
    rad.push({
      rx: lerp(nodes[k].rx, nodes[k + 1].rx, f),
      ry: lerp(nodes[k].ry, nodes[k + 1].ry, f),
    });
  }

  // Frames per Parallel-Transport (verhindert Verdrehung)
  const frames = [];
  let ref = new THREE.Vector3(up[0], up[1], up[2]);
  if (Math.abs(ref.dot(tan[0])) > 0.95) ref.set(1, 0, 0);
  let right = new THREE.Vector3().crossVectors(tan[0], ref).normalize();
  let fwd = new THREE.Vector3().crossVectors(right, tan[0]).normalize();
  frames.push({ right: right.clone(), fwd: fwd.clone() });
  for (let i = 1; i <= N; i += 1) {
    const q = new THREE.Quaternion().setFromUnitVectors(tan[i - 1], tan[i]);
    right = right.clone().applyQuaternion(q).normalize();
    fwd = new THREE.Vector3().crossVectors(right, tan[i]).normalize();
    frames.push({ right, fwd: fwd.clone() });
  }
  // Ringe: Hemisphären-Kappen vorne und hinten anhängen
  const rings = [];
  if (capStart) {
    for (let j = capRings; j >= 1; j -= 1) {
      const phi = (j / capRings) * (Math.PI / 2);
      const c = Math.cos(phi);
      rings.push({
        c: P[0].clone().addScaledVector(tan[0], -rad[0].rx * Math.sin(phi)),
        f: frames[0],
        rx: rad[0].rx * c,
        ry: rad[0].ry * c,
      });
    }
  }
  for (let i = 0; i <= N; i += 1) {
    rings.push({ c: P[i], f: frames[i], rx: rad[i].rx, ry: rad[i].ry });
  }
  if (capEnd) {
    for (let j = 1; j <= capRings; j += 1) {
      const phi = (j / capRings) * (Math.PI / 2);
      const c = Math.cos(phi);
      rings.push({
        c: P[N].clone().addScaledVector(tan[N], rad[N].rx * Math.sin(phi)),
        f: frames[N],
        rx: rad[N].rx * c,
        ry: rad[N].ry * c,
      });
    }
  }

  // Vertices: bei Radius ~0 nur ein Pol-Vertex
  const cols = full ? radial : radial + 1;
  const positions = [];
  const uvs = [];
  const ringInfo = [];
  for (let i = 0; i < rings.length; i += 1) {
    const r = rings[i];
    const pole = r.rx <= 1e-6 || r.ry <= 1e-6;
    const count = pole ? 1 : cols;
    ringInfo.push({ offset: positions.length / 3, count });
    for (let k = 0; k < count; k += 1) {
      const a = arcStart + arc * (k / radial);
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      positions.push(
        r.c.x + r.f.right.x * r.rx * ca + r.f.fwd.x * r.ry * sa,
        r.c.y + r.f.right.y * r.rx * ca + r.f.fwd.y * r.ry * sa,
        r.c.z + r.f.right.z * r.rx * ca + r.f.fwd.z * r.ry * sa
      );
      uvs.push(k / Math.max(1, count - 1), i / (rings.length - 1));
    }
  }

  // Dreiecke zwischen den Ringen (Pol-Fächer oder Quader) + Schnittkanten
  const indices = [];
  const strip = (i0, i1) => {
    const a = ringInfo[i0];
    const b = ringInfo[i1];
    if (a.count === 1 && b.count === 1) return;
    if (a.count === 1) {
      for (let k = 0; k < b.count; k += 1) {
        const k2 = full ? (k + 1) % b.count : k + 1;
        if (k2 >= b.count) break;
        indices.push(a.offset, b.offset + k, b.offset + k2);
      }
      return;
    }
    if (b.count === 1) {
      for (let k = 0; k < a.count; k += 1) {
        const k2 = full ? (k + 1) % a.count : k + 1;
        if (k2 >= a.count) break;
        indices.push(a.offset + k, b.offset, a.offset + k2);
      }
      return;
    }
    for (let k = 0; k < (full ? a.count : a.count - 1); k += 1) {
      const k2 = full ? (k + 1) % a.count : k + 1;
      indices.push(
        a.offset + k, b.offset + k, b.offset + k2,
        a.offset + k, b.offset + k2, a.offset + k2
      );
    }
  };
  for (let i = 0; i < rings.length - 1; i += 1) strip(i, i + 1);
  if (!full) {
    for (let i = 0; i < rings.length - 1; i += 1) {
      const a = ringInfo[i];
      const b = ringInfo[i + 1];
      if (a.count < 2 || b.count < 2) continue;
      indices.push(
        a.offset, a.offset + a.count - 1, b.offset + a.count - 1,
        a.offset, b.offset + a.count - 1, b.offset
      );
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Mehrere Teile zu einem Mesh verschmelzen. */
export function mergeParts(list) {
  const geos = list.filter(Boolean);
  if (geos.length === 1) return geos[0];
  const merged = mergeGeometries(geos, false);
  geos.forEach((g) => g.dispose());
  return merged;
}

/** Rumpf-Knoten (Ursprung = Hüfte, y 0 … 0,64 = Welt 0,86 … 1,50). */
const TORSO_NODES = [
  { p: [0, 0.0, 0.0], rx: 0.152, ry: 0.118 },   // Becken
  { p: [0, 0.07, 0.002], rx: 0.15, ry: 0.116 },
  { p: [0, 0.14, 0.0], rx: 0.138, ry: 0.106 },
  { p: [0, 0.195, 0.0], rx: 0.12, ry: 0.094 },  // Taille
  { p: [0, 0.26, 0.004], rx: 0.128, ry: 0.101 },
  { p: [0, 0.33, 0.008], rx: 0.142, ry: 0.112 },
  { p: [0, 0.395, 0.01], rx: 0.152, ry: 0.116 }, // Brustkorb
  { p: [0, 0.45, 0.006], rx: 0.15, ry: 0.11 },
  { p: [0, 0.5, 0.0], rx: 0.16, ry: 0.1 },
  { p: [0, 0.545, 0.0], rx: 0.158, ry: 0.09 },  // Schultergürtel
  { p: [0, 0.58, 0.0], rx: 0.12, ry: 0.078 },
  { p: [0, 0.615, 0.0], rx: 0.07, ry: 0.062 }, // Halsansatz
  { p: [0, 0.64, 0.0], rx: 0.055, ry: 0.05 },
];

/**
 * Rumpf (ein geschlossenes Mesh) – optional als Kleidungs-Shell mit
 * `pad` (Verdickung) und Ausschnitt (Weste).
 * `nodes` überschreibt die Rumpf-Vorlage (z. B. für Mieder/Hemd/Weste).
 */
export function makeTorsoGeometry(opts = {}) {
  const {
    pad = 0,
    yStart = 0,
    yEnd = 0.64,
    gap = 0,
    samples = 34,
    radial = 20,
    nodes: custom = null,
  } = opts;
  const src = custom
    ? custom
    : TORSO_NODES.filter((n) => n.p[1] >= yStart - 1e-6 && n.p[1] <= yEnd + 1e-6);
  const base = custom ? yStart : 0;
  const nodes = src
    .filter((n) => n.p[1] >= (custom ? -Infinity : yStart - 1e-6))
    .filter((n) => n.p[1] <= yEnd + 1e-6)
    .map((n) => ({ p: [n.p[0], n.p[1] - base, n.p[2]], rx: n.rx + pad, ry: n.ry + pad }));
  return loftGeometry({
    nodes,
    samples,
    radial,
    // V-Öffnung vorne: Winkel π/2 zeigt nach +Z
    arc: Math.PI * 2 - gap,
    arcStart: Math.PI / 2 + gap / 2,
  });
}

/** Mieder der Prinzessin: folgt dem Rumpf, läuft oben in den Hals aus. */
export const BODICE_NODES = [
  { p: [0, 0.14, 0.0], rx: 0.15, ry: 0.118 },
  { p: [0, 0.21, 0.0], rx: 0.14, ry: 0.108 },
  { p: [0, 0.3, 0.004], rx: 0.135, ry: 0.108 },
  { p: [0, 0.4, 0.01], rx: 0.142, ry: 0.115 },
  { p: [0, 0.48, 0.006], rx: 0.145, ry: 0.112 },
  { p: [0, 0.545, 0.0], rx: 0.144, ry: 0.095 },
  { p: [0, 0.585, 0.0], rx: 0.1, ry: 0.075 },
  { p: [0, 0.61, 0.0], rx: 0.06, ry: 0.055 },
];

/** Hemd der Piratin: von der Hüfte bis in den Halsansatz. */
export const SHIRT_NODES = [
  { p: [0, 0.1, 0.0], rx: 0.152, ry: 0.118 },
  { p: [0, 0.17, 0.0], rx: 0.148, ry: 0.115 },
  { p: [0, 0.26, 0.004], rx: 0.13, ry: 0.104 },
  { p: [0, 0.34, 0.008], rx: 0.145, ry: 0.115 },
  { p: [0, 0.43, 0.01], rx: 0.157, ry: 0.119 },
  { p: [0, 0.5, 0.002], rx: 0.164, ry: 0.104 },
  { p: [0, 0.555, 0.0], rx: 0.162, ry: 0.094 },
  { p: [0, 0.6, 0.0], rx: 0.1, ry: 0.076 },
  { p: [0, 0.625, 0.0], rx: 0.06, ry: 0.055 },
];

/** Weste der Piratin: dicker, mit V-Öffnung vorn (gap). */
export const VEST_NODES = [
  { p: [0, 0.18, 0.0], rx: 0.13, ry: 0.106 },
  { p: [0, 0.27, 0.004], rx: 0.142, ry: 0.115 },
  { p: [0, 0.37, 0.01], rx: 0.156, ry: 0.126 },
  { p: [0, 0.45, 0.006], rx: 0.16, ry: 0.12 },
  { p: [0, 0.51, 0.0], rx: 0.168, ry: 0.11 },
  { p: [0, 0.555, 0.0], rx: 0.166, ry: 0.1 },
  { p: [0, 0.595, 0.0], rx: 0.105, ry: 0.08 },
  { p: [0, 0.62, 0.0], rx: 0.062, ry: 0.057 },
];

/** Kurzer, kräftiger Hals – steckt in Rumpf und Kopf. */
export function makeNeckGeometry() {
  return loftGeometry({
    nodes: [
      { p: [0, 0, 0], rx: 0.06, ry: 0.057 },
      { p: [0, 0.05, -0.004], rx: 0.052, ry: 0.05 },
      { p: [0, 0.12, -0.005], rx: 0.05, ry: 0.048 },
    ],
    samples: 14,
    radial: 16,
  });
}

/** Oberarm: Deltakugel → Bizeps → Ellbogenkugel (Ursprung = Schulter). */
export function makeUpperArmGeometry() {
  return loftGeometry({
    nodes: [
      { p: [0, 0, 0], rx: RIG.rShoulder, ry: 0.058 },
      { p: [0, -0.07, 0.002], rx: 0.056, ry: 0.052 },
      { p: [0, -0.16, 0.002], rx: 0.047, ry: 0.045 },
      { p: [0, -0.26, 0], rx: 0.045, ry: 0.043 },
      { p: [0, -0.35, -0.002], rx: 0.041, ry: 0.04 },
      { p: [0, -RIG.upperArm, 0], rx: RIG.rElbow, ry: RIG.rElbow },
    ],
    samples: 26,
    radial: 16,
  });
}

/** Unterarm: Ellbogenkugel → Wade des Arms → Handgelenk. */
export function makeForearmGeometry() {
  return loftGeometry({
    nodes: [
      { p: [0, 0, 0], rx: RIG.rElbow, ry: RIG.rElbow },
      { p: [0, -0.06, 0.004], rx: 0.041, ry: 0.04 },
      { p: [0, -0.15, 0.002], rx: 0.036, ry: 0.035 },
      { p: [0, -0.26, 0], rx: 0.031, ry: 0.03 },
      { p: [0, -RIG.forearm, 0], rx: RIG.rWrist, ry: RIG.rWrist },
    ],
    samples: 24,
    radial: 16,
  });
}

/**
 * Hand: Handfläche + abgespreizter Daumen, zu **einem** Mesh verschmolzen.
 * side = +1 (rechte Hand) / -1 (linke Hand).
 */
export function makeHandGeometry(side = 1) {
  const palm = loftGeometry({
    nodes: [
      { p: [0, 0, 0], rx: RIG.rWrist, ry: RIG.rWrist },
      { p: [0, -0.045, 0.004], rx: 0.036, ry: 0.03 },
      { p: [0, -0.095, 0.006], rx: 0.043, ry: 0.031 },
      { p: [0, -0.14, 0.004], rx: 0.042, ry: 0.028 },
      { p: [0, -RIG.hand, 0], rx: 0.03, ry: 0.022 },
    ],
    samples: 20,
    radial: 14,
  });
  const thumb = loftGeometry({
    nodes: [
      { p: [0, 0, 0], rx: 0.016, ry: 0.015 },
      { p: [side * 0.02, -0.016, 0.014], rx: 0.014, ry: 0.013 },
      { p: [side * 0.038, -0.03, 0.03], rx: 0.011, ry: 0.011 },
    ],
    samples: 10,
    radial: 10,
  });
  thumb.translate(side * 0.026, -0.07, 0.004);
  return mergeParts([palm, thumb]);
}

/** Oberschenkel: Hüftkugel → Quadriceps → Kniekugel. */
export function makeThighGeometry() {
  return loftGeometry({
    nodes: [
      { p: [0, 0, 0], rx: RIG.rHip, ry: RIG.rHip },
      { p: [0, -0.09, 0.004], rx: 0.079, ry: 0.079 },
      { p: [0, -0.2, 0.002], rx: 0.068, ry: 0.07 },
      { p: [0, -0.3, 0], rx: 0.058, ry: 0.062 },
      { p: [0, -0.36, 0.002], rx: 0.052, ry: 0.055 },
      { p: [0, -RIG.thigh, 0], rx: RIG.rKnee, ry: RIG.rKnee },
    ],
    samples: 26,
    radial: 16,
  });
}

/** Unterschenkel: Kniekugel → Wadenbauch (nach hinten) → Knöchel. */
export function makeShinGeometry() {
  return loftGeometry({
    nodes: [
      { p: [0, 0, 0], rx: RIG.rKnee, ry: RIG.rKnee },
      { p: [0, -0.07, -0.008], rx: 0.056, ry: 0.055 },
      { p: [0, -0.15, -0.014], rx: 0.053, ry: 0.055 },
      { p: [0, -0.25, -0.004], rx: 0.041, ry: 0.042 },
      { p: [0, -0.33, 0.002], rx: 0.034, ry: 0.035 },
      { p: [0, -RIG.shin, 0], rx: RIG.rAnkle, ry: RIG.rAnkle },
    ],
    samples: 26,
    radial: 16,
  });
}

/** Fuß/Schuh: Knöchel → Spann → Zehenkappe, Länge ≈ 0,24, Sohle am Boden. */
export function makeFootGeometry() {
  return loftGeometry({
    nodes: [
      { p: [0, 0, 0], rx: RIG.rAnkle, ry: RIG.rAnkle },
      { p: [-0.006, -0.022, 0.035], rx: 0.04, ry: 0.03 },
      { p: [-0.01, -0.038, 0.095], rx: 0.045, ry: 0.028 },
      { p: [-0.01, -0.045, 0.155], rx: 0.042, ry: 0.024 },
      { p: [-0.01, -0.046, 0.19], rx: 0.03, ry: 0.019 },
    ],
    samples: 24,
    radial: 16,
    up: [0, 1, 0],
  });
}

/** Kurzer Matrosenärmel über Deltakugel und Oberarm. */
export function makeSleeveGeometry() {
  return loftGeometry({
    nodes: [
      { p: [0, 0.01, 0], rx: 0.072, ry: 0.068 },
      { p: [0, -0.08, 0.002], rx: 0.062, ry: 0.058 },
      { p: [0, -0.15, 0], rx: 0.052, ry: 0.049 },
      { p: [0, -0.17, -0.002], rx: 0.048, ry: 0.045 },
    ],
    samples: 16,
    radial: 16,
  });
}

/** Stiefelschaft (über den Knöchel geschoben, deckt die Wade). */
export function makeBootShaftGeometry() {
  return loftGeometry({
    nodes: [
      { p: [0, 0, 0], rx: 0.048, ry: 0.05 },
      { p: [0, 0.06, -0.004], rx: 0.05, ry: 0.052 },
      { p: [0, 0.14, -0.008], rx: 0.058, ry: 0.062 },
    ],
    samples: 12,
    radial: 16,
    up: [0, 0, 1],
  });
}
