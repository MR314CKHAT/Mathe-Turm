/**
 * Prozedurale Character-Maps: Haut mit Sommersprossen/Narbe, Iris, Lider,
 * Haar, Stoffe – alles auf Canvas gezeichnet, keine Bilddateien.
 *
 * Wichtige UV-Rechnung (THREE.SphereGeometry):
 *  - u = phi/(2π): Vorderseite (+Z) liegt bei u=0,25 → Canvas x = 0,25*W
 *  - v: Krone (theta=0) liegt bei uv.y=1 → Canvas y=0 (oben), Gesicht wächst nach unten
 *  - Canvas 1024×512 ⇒ ~2,84 px pro Grad auf beiden Achsen (keine Verzerrung)
 */

import * as THREE from 'three';

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return [canvas, canvas.getContext('2d')];
}

function asTexture(canvas, repeatX = 1, repeatY = 1) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Deterministischer Zufall (mulberry32) – Texturen sind bei jedem Lauf identisch. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shade(hex, light = 0, sat = 0) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, sat, light);
  return `#${c.getHexString()}`;
}

function radial(ctx, x, y, r, color, inner = 0) {
  const g = ctx.createRadialGradient(x, y, r * inner, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/**
 * Der kopfweite Skin: Haut mit Schattierung, Wangenrötung, Sommersprossen
 * (queen), Narbe (pirate) und gemaltem Haaransatz mit Strähnen.
 */
export function makeHeadTexture(opts) {
  const {
    skin,
    hair,
    hairHi,
    freckles = 0,
    scar = false,
    blush = 0.1,
    hairA = 250,
    hairB = -96,
    seed = 7,
  } = opts;
  const W = 1024;
  const H = 512;
  const [canvas, ctx] = makeCanvas(W, H);
  const rand = rng(seed);

  // Hautbasis
  ctx.fillStyle = skin;
  ctx.fillRect(0, 0, W, H);

  // Vertikale Lichtführung: Stirn heller, Kinn dunkler
  let g = ctx.createLinearGradient(0, 60, 0, 470);
  g.addColorStop(0, 'rgba(255,255,255,0.14)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.03)');
  g.addColorStop(1, 'rgba(0,0,0,0.16)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Gesichtsoval seitlich abdunkeln
  g = ctx.createLinearGradient(120, 0, 210, 0);
  g.addColorStop(0, 'rgba(0,0,0,0.20)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(120, 180, 90, 300);
  g = ctx.createLinearGradient(392, 0, 302, 0);
  g.addColorStop(0, 'rgba(0,0,0,0.20)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(302, 180, 90, 300);

  // Wangenrötung
  radial(ctx, 208, 302, 52, `rgba(232,120,120,${blush})`);
  radial(ctx, 304, 302, 52, `rgba(232,120,120,${blush})`);

  // Augenhöhlen-Schatten (stützt die geometrischen Augen)
  radial(ctx, 190, 272, 60, 'rgba(90,55,40,0.28)');
  radial(ctx, 322, 272, 60, 'rgba(90,55,40,0.28)');
  radial(ctx, 190, 246, 44, 'rgba(90,55,40,0.16)');
  radial(ctx, 322, 246, 44, 'rgba(90,55,40,0.16)');

  // Nase: Flügel-Schatten, Unter-Schatten, Nasenlöcher
  ctx.fillStyle = 'rgba(90,55,40,0.13)';
  ctx.beginPath();
  ctx.ellipse(230, 285, 12, 44, -0.12, 0, Math.PI * 2);
  ctx.ellipse(282, 285, 12, 44, 0.12, 0, Math.PI * 2);
  ctx.fill();
  radial(ctx, 256, 328, 30, 'rgba(80,45,35,0.22)');
  ctx.fillStyle = 'rgba(70,40,32,0.5)';
  ctx.beginPath();
  ctx.ellipse(231, 318, 7, 4.5, -0.15, 0, Math.PI * 2);
  ctx.ellipse(281, 318, 7, 4.5, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Mund- und Kinnzone andunkeln (geometrische Lippen sitzen darauf)
  radial(ctx, 256, 358, 58, 'rgba(80,45,35,0.16)');
  radial(ctx, 256, 398, 44, 'rgba(80,45,35,0.14)');

  // Glanzpunkte
  radial(ctx, 256, 190, 95, 'rgba(255,255,255,0.12)');
  radial(ctx, 256, 300, 16, 'rgba(255,255,255,0.20)');
  radial(ctx, 213, 286, 34, 'rgba(255,255,255,0.10)');
  radial(ctx, 299, 286, 34, 'rgba(255,255,255,0.10)');

  // Sommersprossen
  if (freckles > 0) {
    ctx.fillStyle = opts.freckle || '#c98256';
    for (let i = 0; i < freckles; i += 1) {
      const x = 165 + rand() * 185;
      const y = 255 + rand() * 90 - Math.abs(x - 256) * 0.12;
      const r = 1.1 + rand() * 1.7;
      ctx.globalAlpha = 0.35 + rand() * 0.35;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Narbe über der Braue (Piratin)
  if (scar) {
    ctx.strokeStyle = opts.scarColor || '#d98b7d';
    ctx.lineCap = 'round';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(316, 150);
    ctx.quadraticCurveTo(330, 200, 334, 246);
    ctx.stroke();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(315, 152);
    ctx.quadraticCurveTo(329, 201, 333, 244);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(120,60,50,0.75)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) {
      const t = 0.25 + i * 0.26;
      const x = 316 + (334 - 316) * t;
      const y = 150 + (246 - 150) * t;
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 3);
      ctx.lineTo(x + 6, y + 3);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // --- Haar: Haarlinie als Wellenfunktion über alle u ---
  const yAt = (u) =>
    hairA +
    hairB * Math.cos(2 * Math.PI * (u - 0.25)) +
    5 * Math.sin(u * 41) +
    3.5 * Math.sin(u * 97 + 2);
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let px = 0; px <= W; px += 4) {
    ctx.lineTo(px, yAt(px / W));
  }
  ctx.lineTo(W, 0);
  ctx.closePath();
  ctx.fill();

  // Krone etwas dunkler
  g = ctx.createLinearGradient(0, 0, 0, 120);
  g.addColorStop(0, 'rgba(0,0,0,0.22)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 130);

  // Strähnen von der Krone zur Haarlinie
  ctx.lineCap = 'round';
  for (let i = 0; i < 150; i += 1) {
    const u = rand();
    const x0 = u * W;
    const y1 = yAt(u) - 4 - rand() * 26;
    ctx.strokeStyle = rand() > 0.55 ? shade(hairHi || hair, 0.06) : shade(hair, -0.06);
    ctx.globalAlpha = 0.22 + rand() * 0.3;
    ctx.lineWidth = 1 + rand() * 1.6;
    ctx.beginPath();
    ctx.moveTo(x0, rand() * 30);
    ctx.quadraticCurveTo(x0 + (rand() - 0.5) * 60, y1 * 0.5, x0 + (rand() - 0.5) * 34, y1);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Flecht-Kante am Haaransatz (Jungkönigin, nur vorn)
  if (freckles > 0) {
    ctx.strokeStyle = shade(hair, -0.08);
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.65;
    for (let x = 176; x < 340; x += 13) {
      const yb = yAt(x / W) + 7;
      ctx.beginPath();
      ctx.moveTo(x, yb);
      ctx.lineTo(x + 7, yb + 9);
      ctx.lineTo(x + 14, yb);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  return asTexture(canvas);
}

/**
 * Iris-Map für die Glasaugen: Lederhaut mit Venen, Iris mit radialen
 * Fasern, Limbusring, Pupille und zwei Lichtreflexen.
 * Canvas 512×256 ⇒ ~1,42 px pro Grad auf beiden Achsen (kreisrunde Iris).
 */
export function makeIrisTexture(irisColor) {
  const W = 512;
  const H = 256;
  const [canvas, ctx] = makeCanvas(W, H);
  const rand = rng(21);
  const cx = W * 0.25; // Vorderseite der Augenkugel
  const cy = H * 0.5;
  const irisR = (W / 360) * 30; // Iris-Winkelhalbte ~30°

  // Lederhaut
  ctx.fillStyle = '#f4f1e8';
  ctx.fillRect(0, 0, W, H);
  // leichte Rötung / Adern
  ctx.lineCap = 'round';
  for (let i = 0; i < 26; i += 1) {
    const edge = rand() * Math.PI * 2;
    const r0 = irisR + 24 + rand() * 60;
    const x0 = cx + Math.cos(edge) * r0;
    const y0 = cy + Math.sin(edge) * r0 * 0.8;
    ctx.strokeStyle = `rgba(200,90,80,${0.10 + rand() * 0.12})`;
    ctx.lineWidth = 1 + rand();
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(
      x0 + (rand() - 0.5) * 30,
      y0 + (rand() - 0.5) * 30,
      cx + Math.cos(edge) * (irisR + 8),
      cy + Math.sin(edge) * (irisR + 8) * 0.8
    );
    ctx.stroke();
  }

  // Iris: heller Kern, dunkler Rand
  let g = ctx.createRadialGradient(cx, cy, irisR * 0.15, cx, cy, irisR);
  g.addColorStop(0, shade(irisColor, 0.14));
  g.addColorStop(0.55, irisColor);
  g.addColorStop(1, shade(irisColor, -0.16));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, irisR, 0, Math.PI * 2);
  ctx.fill();

  // radiale Fasern
  for (let i = 0; i < 64; i += 1) {
    const a = (i / 64) * Math.PI * 2 + rand() * 0.06;
    const r1 = irisR * (0.28 + rand() * 0.1);
    const r2 = irisR * (0.82 + rand() * 0.16);
    ctx.strokeStyle = rand() > 0.5
      ? `rgba(255,255,255,${0.10 + rand() * 0.16})`
      : `rgba(0,0,0,${0.10 + rand() * 0.16})`;
    ctx.lineWidth = 1 + rand() * 1.4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    ctx.stroke();
  }

  // Limbusring
  ctx.strokeStyle = 'rgba(20,14,10,0.85)';
  ctx.lineWidth = irisR * 0.14;
  ctx.beginPath();
  ctx.arc(cx, cy, irisR * 0.93, 0, Math.PI * 2);
  ctx.stroke();

  // Pupille
  ctx.fillStyle = '#0d0a08';
  ctx.beginPath();
  ctx.arc(cx, cy, irisR * 0.38, 0, Math.PI * 2);
  ctx.fill();

  // Lichtreflexe
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.arc(cx - irisR * 0.34, cy - irisR * 0.34, irisR * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc(cx + irisR * 0.3, cy + irisR * 0.32, irisR * 0.1, 0, Math.PI * 2);
  ctx.fill();

  return asTexture(canvas);
}

/**
 * Lider: Haut + dunkle Wimpernkante an der jeweiligen Blendenkante.
 * Obere Kante liegt bei Canvas-y≈0,446H, untere bei≈0,556H (siehe UV-Formel).
 */
export function makeLidTexture(skin) {
  const S = 128;
  const [canvas, ctx] = makeCanvas(S, S);
  ctx.fillStyle = skin;
  ctx.fillRect(0, 0, S, S);
  // sanfter Shader über dem Lid
  const g = ctx.createLinearGradient(0, 0, 0, S);
  g.addColorStop(0, 'rgba(0,0,0,0.10)');
  g.addColorStop(0.44, 'rgba(255,255,255,0.05)');
  g.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  // Wimpernkanten
  ctx.strokeStyle = 'rgba(46,30,22,0.95)';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(0, 0.446 * S);
  ctx.lineTo(S, 0.446 * S);
  ctx.moveTo(0, 0.556 * S);
  ctx.lineTo(S, 0.556 * S);
  ctx.stroke();
  return asTexture(canvas);
}

/** Körperhaut: gleichmäßiger Ton mit Poren-Noise und weichen Verläufen. */
export function makeSkinTexture(skin, weather = 0) {
  const S = 256;
  const [canvas, ctx] = makeCanvas(S, S);
  const rand = rng(11);
  ctx.fillStyle = skin;
  ctx.fillRect(0, 0, S, S);
  // untermischte Flecken (Natürlichkeit)
  for (let i = 0; i < 40; i += 1) {
    const x = rand() * S;
    const y = rand() * S;
    const r = 8 + rand() * 30;
    radial(ctx, x, y, r, rand() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(120,70,50,0.05)');
  }
  // feiner Poren-Noise
  for (let i = 0; i < 900; i += 1) {
    ctx.fillStyle = `rgba(${weather > 0 ? '110,70,45' : '150,100,80'},${0.03 + rand() * 0.05})`;
    ctx.fillRect(rand() * S, rand() * S, 1 + rand() * 1.5, 1 + rand() * 1.5);
  }
  // Witterung: leicht gebräunte Partien
  if (weather > 0) {
    radial(ctx, S * 0.5, S * 0.3, S * 0.5, `rgba(160,95,55,${0.10 * weather})`);
    radial(ctx, S * 0.2, S * 0.7, S * 0.4, `rgba(140,80,50,${0.08 * weather})`);
  }
  return asTexture(canvas);
}

/** Haar-Map für Dutt/Strähnen: Strähnenverlauf mit Licht und Schatten. */
export function makeHairTexture(base, hi) {
  const S = 256;
  const [canvas, ctx] = makeCanvas(S, S);
  const rand = rng(5);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  ctx.lineCap = 'round';
  for (let i = 0; i < 130; i += 1) {
    const x = rand() * S;
    ctx.strokeStyle = rand() > 0.5 ? hi || shade(base, 0.08) : shade(base, -0.07);
    ctx.globalAlpha = 0.2 + rand() * 0.35;
    ctx.lineWidth = 1 + rand() * 2;
    ctx.beginPath();
    ctx.moveTo(x, -10);
    ctx.bezierCurveTo(x + (rand() - 0.5) * 40, S * 0.35, x + (rand() - 0.5) * 40, S * 0.7, x + (rand() - 0.5) * 24, S + 10);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return asTexture(canvas);
}

/**
 * Kleid-Stoff: Seidenverlauf, vertikale Falten-Schattierung, Goldsaum an
 * OBER- und Unterkante (robust gegen Lathe-Umkehr).
 */
export function makeDressTexture(base, trim) {
  const S = 512;
  const [canvas, ctx] = makeCanvas(S, S);
  const rand = rng(3);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);

  // weicher Seidenverlauf
  radial(ctx, S * 0.5, S * 0.35, S * 0.6, 'rgba(255,255,255,0.12)');

  // vertikale Falten
  for (let i = 0; i < 26; i += 1) {
    const x = (i / 26) * S + rand() * 8;
    const w = 8 + rand() * 14;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.16)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.07)');
    g.addColorStop(1, 'rgba(0,0,0,0.14)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, w, S);
  }

  // Goldsaum oben und unten
  ctx.fillStyle = trim;
  ctx.fillRect(0, 0, S, 15);
  ctx.fillRect(0, S - 15, S, 15);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 15, S, 4);
  ctx.fillRect(0, S - 19, S, 4);
  // kleine Perlen-Kanten
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let x = 6; x < S; x += 24) {
    ctx.beginPath();
    ctx.arc(x, 24, 3, 0, Math.PI * 2);
    ctx.arc(x, S - 24, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  return asTexture(canvas);
}

/** Matrosenhemd: waagerechte Streifen + Stofffalten-Schattierung. */
export function makeShirtTexture(base, stripe) {
  const S = 512;
  const [canvas, ctx] = makeCanvas(S, S);
  const rand = rng(9);
  const rows = 8;
  const bh = S / rows;
  for (let i = 0; i < rows; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? stripe : base;
    ctx.fillRect(0, i * bh, S, bh + 1);
  }
  // Webstruktur
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  for (let y = 0; y < S; y += 4) ctx.fillRect(0, y, S, 1);
  // Falten
  for (let i = 0; i < 14; i += 1) {
    const x = rand() * S;
    const w = 10 + rand() * 20;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.14)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, w, S);
  }
  return asTexture(canvas);
}

/** Leder: Korn, Weichzeichnungs-Verlauf und genähte Ränder. */
export function makeLeatherTexture(base) {
  const S = 512;
  const [canvas, ctx] = makeCanvas(S, S);
  const rand = rng(13);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  radial(ctx, S * 0.4, S * 0.3, S * 0.6, 'rgba(255,255,255,0.08)');
  radial(ctx, S * 0.8, S * 0.85, S * 0.5, 'rgba(0,0,0,0.16)');
  // Korn
  for (let i = 0; i < 420; i += 1) {
    const x = rand() * S;
    const y = rand() * S;
    ctx.strokeStyle = rand() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 2 + rand() * 5, rand() * Math.PI, rand() * Math.PI + 2);
    ctx.stroke();
  }
  // Naht-Stiche an den Rändern
  ctx.strokeStyle = 'rgba(216,196,154,0.85)';
  ctx.lineWidth = 2.4;
  ctx.setLineDash([7, 6]);
  ctx.strokeRect(16, 16, S - 32, S - 32);
  ctx.setLineDash([]);
  return asTexture(canvas);
}

/**
 * Gewebe: Kreuzschraffur-Webung + optionales Muster (Bandana-Punkte).
 */
export function makeClothTexture(base, opts = {}) {
  const S = 512;
  const [canvas, ctx] = makeCanvas(S, S);
  const rand = rng(17);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  // Webung
  ctx.fillStyle = 'rgba(0,0,0,0.055)';
  for (let y = 0; y < S; y += 6) ctx.fillRect(0, y, S, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.045)';
  for (let x = 0; x < S; x += 6) ctx.fillRect(x, 0, 2, S);
  // weiche Lichtfalte
  const g = ctx.createLinearGradient(0, 0, S, S);
  g.addColorStop(0, 'rgba(255,255,255,0.10)');
  g.addColorStop(0.5, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.14)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  // Bandana-Muster: weiße Punkte + Ringe
  if (opts.dots) {
    for (let gy = 32; gy < S; gy += 64) {
      for (let gx = 32; gx < S; gx += 64) {
        const off = (gy / 64) % 2 === 0 ? 0 : 32;
        ctx.fillStyle = 'rgba(244,241,232,0.85)';
        ctx.beginPath();
        ctx.arc(gx + off, gy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(244,241,232,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(gx + off, gy, 13, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  // winzige Woll-Flocken
  for (let i = 0; i < 200; i += 1) {
    ctx.fillStyle = `rgba(255,255,255,${0.02 + rand() * 0.03})`;
    ctx.fillRect(rand() * S, rand() * S, 2, 2);
  }
  return asTexture(canvas);
}

/** Lippen: feine Vertikalfalten + Glanz-Highlight. */
export function makeLipTexture(base) {
  const S = 128;
  const [canvas, ctx] = makeCanvas(S, S);
  const rand = rng(29);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = 'rgba(0,0,0,0.16)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 26; i += 1) {
    const x = rand() * S;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (rand() - 0.5) * 8, S);
    ctx.stroke();
  }
  const g = ctx.createLinearGradient(0, 0, 0, S);
  g.addColorStop(0, 'rgba(0,0,0,0.12)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.14)');
  g.addColorStop(1, 'rgba(0,0,0,0.10)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return asTexture(canvas);
}
