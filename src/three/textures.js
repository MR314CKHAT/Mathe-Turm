import * as THREE from 'three';

/**
 * Prozedurale Texturen: alles wird zur Laufzeit auf einem <canvas> gemalt.
 * Keine Bilddateien nötig – passt zum "selbst gebaut"-Prinzip und hält
 * die App klein. Läuft nur im Browser (die 3D-Welt wird nie serverseitig
 * gerendert).
 */

function makeCanvas(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
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

/** Zufällig leicht schwankende Steinfarbe. */
function shade(hex, amount) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amount);
  return `#${c.getHexString()}`;
}

/** Mauerwerk für den Schlossturm. */
export function makeStoneTexture(base, mortar) {
  const [canvas, ctx] = makeCanvas(256);
  ctx.fillStyle = mortar;
  ctx.fillRect(0, 0, 256, 256);
  const rows = 8;
  const bh = 256 / rows;
  for (let row = 0; row < rows; row += 1) {
    const offset = row % 2 === 0 ? 0 : 32;
    for (let col = -1; col < 4; col += 1) {
      const x = col * 64 + offset;
      const jitter = ((row * 7 + col * 13) % 10) / 10 - 0.5;
      ctx.fillStyle = shade(base, jitter * 0.08);
      ctx.fillRect(x + 2, row * bh + 2, 60, bh - 4);
      // kleine Highlight-Kante oben
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(x + 2, row * bh + 2, 60, 4);
      // Schatten unten
      ctx.fillStyle = 'rgba(0,0,0,0.10)';
      ctx.fillRect(x + 2, row * bh + bh - 8, 60, 6);
    }
  }
  return asTexture(canvas, 5, 34);
}

/** Spitzbogen-Fenster mit warmem Glas und Kreuzsprossen. */
export function makeWindowTexture(glass, frame) {
  const [canvas, ctx] = makeCanvas(128);
  ctx.clearRect(0, 0, 128, 128);
  // Rahmen
  ctx.fillStyle = frame;
  ctx.beginPath();
  ctx.moveTo(14, 118);
  ctx.lineTo(14, 56);
  ctx.quadraticCurveTo(14, 12, 64, 12);
  ctx.quadraticCurveTo(114, 12, 114, 56);
  ctx.lineTo(114, 118);
  ctx.closePath();
  ctx.fill();
  // Glas
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.moveTo(24, 112);
  ctx.lineTo(24, 58);
  ctx.quadraticCurveTo(24, 22, 64, 22);
  ctx.quadraticCurveTo(104, 22, 104, 58);
  ctx.lineTo(104, 112);
  ctx.closePath();
  ctx.fill();
  // Sprossen
  ctx.strokeStyle = frame;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(64, 24);
  ctx.lineTo(64, 112);
  ctx.moveTo(26, 70);
  ctx.lineTo(102, 70);
  ctx.stroke();
  return asTexture(canvas);
}

/** Rundbogentür fürs Erdgeschoss. */
export function makeDoorTexture(door, frame) {
  const [canvas, ctx] = makeCanvas(128);
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = frame;
  ctx.beginPath();
  ctx.moveTo(10, 126);
  ctx.lineTo(10, 52);
  ctx.quadraticCurveTo(10, 8, 64, 8);
  ctx.quadraticCurveTo(118, 8, 118, 52);
  ctx.lineTo(118, 126);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = door;
  ctx.beginPath();
  ctx.moveTo(20, 126);
  ctx.lineTo(20, 56);
  ctx.quadraticCurveTo(20, 18, 64, 18);
  ctx.quadraticCurveTo(108, 18, 108, 56);
  ctx.lineTo(108, 126);
  ctx.closePath();
  ctx.fill();
  // Holzbohlen
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 3;
  for (let x = 36; x < 108; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 30);
    ctx.lineTo(x, 126);
    ctx.stroke();
  }
  // Türklopfer
  ctx.fillStyle = '#ffd35e';
  ctx.beginPath();
  ctx.arc(88, 78, 5, 0, Math.PI * 2);
  ctx.fill();
  return asTexture(canvas);
}

/** Holzplanken für Schiff/Mast-Plattformen. */
export function makeWoodTexture(base) {
  const [canvas, ctx] = makeCanvas(256);
  ctx.fillStyle = shade(base, -0.06);
  ctx.fillRect(0, 0, 256, 256);
  const planks = 6;
  for (let i = 0; i < planks; i += 1) {
    const jitter = ((i * 31) % 10) / 10 - 0.5;
    ctx.fillStyle = shade(base, jitter * 0.1);
    ctx.fillRect(0, i * (256 / planks) + 2, 256, 256 / planks - 4);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, i * (256 / planks), 256, 3);
    // Maserung
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    for (let g = 0; g < 3; g += 1) {
      const y = i * (256 / planks) + 8 + g * 12;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(70, y + 4, 180, y - 4, 256, y + 2);
      ctx.stroke();
    }
  }
  return asTexture(canvas, 2, 2);
}

/** Weiches Glow-Sprite (Sonne, Mond, Funken). */
export function makeGlowTexture(inner = '#ffffff', outer = 'rgba(255,255,255,0)') {
  const [canvas, ctx] = makeCanvas(128);
  const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.35, inner);
  gradient.addColorStop(1, outer);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return asTexture(canvas);
}

/** Piratenflagge: schwarz mit Totenkopf und gekreuzten Knochen. */
export function makeFlagTexture() {
  const [canvas, ctx] = makeCanvas(128);
  ctx.fillStyle = '#1c1f26';
  ctx.fillRect(0, 0, 128, 128);
  // gekreuzte Knochen
  ctx.strokeStyle = '#e8e6df';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(28, 96);
  ctx.lineTo(100, 34);
  ctx.moveTo(28, 34);
  ctx.lineTo(100, 96);
  ctx.stroke();
  // Schädel
  ctx.fillStyle = '#f4f2ea';
  ctx.beginPath();
  ctx.arc(64, 58, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(52, 66, 24, 14);
  // Augen + Nase
  ctx.fillStyle = '#1c1f26';
  ctx.beginPath();
  ctx.arc(56, 56, 5.5, 0, Math.PI * 2);
  ctx.arc(72, 56, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(64, 64);
  ctx.lineTo(60, 72);
  ctx.lineTo(68, 72);
  ctx.closePath();
  ctx.fill();
  return asTexture(canvas);
}

/** Wasser mit sanften Schaumstreifen. */
export function makeSeaTexture(base, foam) {
  const [canvas, ctx] = makeCanvas(256);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = foam;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 3;
  for (let i = 0; i < 10; i += 1) {
    const y = ((i * 47) % 256);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(60, y + 10, 180, y - 10, 256, y + 6);
    ctx.stroke();
  }
  return asTexture(canvas, 8, 8);
}

/** Matrosen-Streifen für Hemd und Ärmel (waagerechte Bänder). */
export function makeStripeTexture(base, stripe, bands = 6) {
  const [canvas, ctx] = makeCanvas(64);
  const bh = 64 / bands;
  for (let i = 0; i < bands; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? stripe : base;
    ctx.fillRect(0, i * bh, 64, bh + 1);
  }
  return asTexture(canvas, 1, 1);
}

