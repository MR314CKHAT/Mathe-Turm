/**
 * Erzeugt alle App-Icons und das Teilen-Bild als PNG-Dateien.
 * Läuft komplett ohne externe Bibliothek: zlib ist in Node enthalten.
 *
 * Aufruf:  npm run icons
 */
import { deflateSync, inflateSync } from 'node:zlib';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const publicDir = path.join(root, 'public');

/* ------------------------------------------------------------------ */
/* Mini-PNG-Encoder                                                    */
/* ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // Filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bittiefe
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Prüft eine erzeugte PNG-Datei, indem sie wieder eingelesen wird. */
function verifyPng(buffer, width, height) {
  if (buffer.readUInt32BE(0) !== 0x89504e47) return 'Signatur falsch';
  let offset = 8;
  let sawHeader = false;
  let pixelBytes = 0;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    const expectedCrc = buffer.readUInt32BE(offset + 8 + length);
    if (crc32(buffer.subarray(offset + 4, offset + 8 + length)) !== expectedCrc) {
      return `CRC-Fehler im Block ${type}`;
    }
    if (type === 'IHDR') {
      if (data.readUInt32BE(0) !== width || data.readUInt32BE(4) !== height) {
        return 'falsche Größe im IHDR';
      }
      sawHeader = true;
    }
    if (type === 'IDAT') {
      pixelBytes += inflateSync(data).length;
    }
    offset += 12 + length;
  }
  if (!sawHeader) return 'IHDR fehlt';
  if (pixelBytes !== (width * 4 + 1) * height) {
    return `Bilddaten unvollständig (${pixelBytes} statt ${(width * 4 + 1) * height})`;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Farben                                                              */
/* ------------------------------------------------------------------ */

function parseColor(value) {
  if (Array.isArray(value)) return value;
  let hex = String(value).replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  if (hex.length === 6) hex += 'ff';
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
    parseInt(hex.slice(6, 8), 16),
  ];
}

function mixColor(from, to, t) {
  return [0, 1, 2, 3].map((i) => Math.round(from[i] + (to[i] - from[i]) * t));
}

function gradientColor(stops, t) {
  const parsed = stops.map(([pos, color]) => [pos, parseColor(color)]);
  if (t <= parsed[0][0]) return parsed[0][1];
  for (let i = 1; i < parsed.length; i += 1) {
    if (t <= parsed[i][0]) {
      const [p0, c0] = parsed[i - 1];
      const [p1, c1] = parsed[i];
      const local = p1 === p0 ? 0 : (t - p0) / (p1 - p0);
      return mixColor(c0, c1, local);
    }
  }
  return parsed[parsed.length - 1][1];
}

/* ------------------------------------------------------------------ */
/* Maler (mit 3-facher Überabtastung für weiche Kanten)                */
/* ------------------------------------------------------------------ */

class Painter {
  constructor(width, height, scale = 3) {
    this.width = width;
    this.height = height;
    this.scale = scale;
    this.w = width * scale;
    this.h = height * scale;
    this.buf = new Uint8ClampedArray(this.w * this.h * 4);
  }

  _blend(index, color) {
    const [r, g, b, a] = color;
    if (a === 0) return;
    if (a === 255) {
      this.buf[index] = r;
      this.buf[index + 1] = g;
      this.buf[index + 2] = b;
      this.buf[index + 3] = 255;
      return;
    }
    const t = a / 255;
    this.buf[index] = this.buf[index] * (1 - t) + r * t;
    this.buf[index + 1] = this.buf[index + 1] * (1 - t) + g * t;
    this.buf[index + 2] = this.buf[index + 2] * (1 - t) + b * t;
    this.buf[index + 3] = Math.max(this.buf[index + 3], a);
  }

  /** Füllt alle Subpixel im Bereich, für die test(x, y) wahr ist. */
  fillShape(x0, y0, x1, y1, test, color) {
    const s = this.scale;
    const px0 = Math.max(0, Math.floor(x0 * s));
    const px1 = Math.min(this.w, Math.ceil(x1 * s));
    const py0 = Math.max(0, Math.floor(y0 * s));
    const py1 = Math.min(this.h, Math.ceil(y1 * s));
    const rgba = parseColor(color);

    for (let sy = py0; sy < py1; sy += 1) {
      const ly = (sy + 0.5) / s;
      const rowOffset = sy * this.w;
      for (let sx = px0; sx < px1; sx += 1) {
        if (test((sx + 0.5) / s, ly)) {
          this._blend((rowOffset + sx) * 4, rgba);
        }
      }
    }
  }

  rect(x, y, w, h, color) {
    this.fillShape(x, y, x + w, y + h, () => true, color);
  }

  gradient(x, y, w, h, stops) {
    const s = this.scale;
    const px0 = Math.max(0, Math.floor(x * s));
    const px1 = Math.min(this.w, Math.ceil((x + w) * s));
    const py0 = Math.max(0, Math.floor(y * s));
    const py1 = Math.min(this.h, Math.ceil((y + h) * s));

    for (let sy = py0; sy < py1; sy += 1) {
      const ly = (sy + 0.5) / s;
      const t = h > 0 ? Math.min(1, Math.max(0, (ly - y) / h)) : 0;
      const color = gradientColor(stops, t);
      const rowOffset = sy * this.w;
      for (let sx = px0; sx < px1; sx += 1) {
        this._blend((rowOffset + sx) * 4, color);
      }
    }
  }

  circle(cx, cy, radius, color) {
    const r2 = radius * radius;
    this.fillShape(
      cx - radius,
      cy - radius,
      cx + radius,
      cy + radius,
      (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r2,
      color
    );
  }

  roundedRect(x, y, w, h, radius, color) {
    const r = Math.min(radius, w / 2, h / 2);
    this.fillShape(
      x,
      y,
      x + w,
      y + h,
      (px, py) => {
        const dx = px < x + r ? x + r - px : px > x + w - r ? px - (x + w - r) : 0;
        const dy = py < y + r ? y + r - py : py > y + h - r ? py - (y + h - r) : 0;
        return dx * dx + dy * dy <= r * r;
      },
      color
    );
  }

  star(cx, cy, outer, inner, color, rotationDeg = -90, points = 5) {
    const vertices = [];
    const step = Math.PI / points;
    const rotation = (rotationDeg * Math.PI) / 180;
    for (let i = 0; i < points * 2; i += 1) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = rotation + i * step;
      vertices.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
    }
    this.fillShape(
      cx - outer,
      cy - outer,
      cx + outer,
      cy + outer,
      (x, y) => {
        let inside = false;
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i, i += 1) {
          const [xi, yi] = vertices[i];
          const [xj, yj] = vertices[j];
          if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
            inside = !inside;
          }
        }
        return inside;
      },
      color
    );
  }

  toPng() {
    const s = this.scale;
    const out = Buffer.alloc(this.width * this.height * 4);
    const samples = s * s;

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        let r = 0;
        let g = 0;
        let b = 0;
        let a = 0;
        for (let dy = 0; dy < s; dy += 1) {
          for (let dx = 0; dx < s; dx += 1) {
            const i = ((y * s + dy) * this.w + (x * s + dx)) * 4;
            const alpha = this.buf[i + 3];
            r += this.buf[i] * alpha;
            g += this.buf[i + 1] * alpha;
            b += this.buf[i + 2] * alpha;
            a += alpha;
          }
        }
        if (a === 0) continue;
        const o = (y * this.width + x) * 4;
        out[o] = Math.round(r / a);
        out[o + 1] = Math.round(g / a);
        out[o + 2] = Math.round(b / a);
        out[o + 3] = Math.round(a / samples);
      }
    }

    return encodePng(this.width, this.height, out);
  }
}

/* ------------------------------------------------------------------ */
/* Mini-Bitmap-Schrift (5×7) für das Teilen-Bild                       */
/* ------------------------------------------------------------------ */

const FONT = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10001', '10001', '10001', '10001'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  5: ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};

function textWidth(text, pixel, spacing = 1) {
  return text.length * (5 + spacing) * pixel - spacing * pixel;
}

function drawText(painter, text, x, y, pixel, color, spacing = 1) {
  let cursor = x;
  for (const character of text.toUpperCase()) {
    const glyph = FONT[character] || FONT[' '];
    glyph.forEach((row, rowIndex) => {
      for (let column = 0; column < 5; column += 1) {
        if (row[column] === '1') {
          painter.rect(
            cursor + column * pixel,
            y + rowIndex * pixel,
            pixel,
            pixel,
            color
          );
        }
      }
    });
    cursor += (5 + spacing) * pixel;
  }
}

/* ------------------------------------------------------------------ */
/* Motiv: Hochhaus mit Stern                                           */
/* ------------------------------------------------------------------ */

const SKY_STOPS = [
  [0, '#4f7cff'],
  [0.55, '#9ec8ff'],
  [1, '#eaf6ff'],
];
const GROUND = '#22c55e';
const GROUND_LINE = '#16a34a';
const BRAND_DARK = '#3559c7';
const WINDOW_BLUE = '#bbd3ff';
const ACCENT = '#ffb703';

/**
 * Zeichnet das Turm-Motiv randlos.
 * @param {Painter} painter
 * @param {number} size Kantenlänge der quadratischen Fläche
 * @param {{inset?: number}} [options] inset < 1 rückt das Motiv in die
 *        sichere Zone (nötig für "maskable" PWA-Icons).
 */
function drawTowerMotif(painter, size, { inset = 1 } = {}) {
  const center = size / 2;
  const p = (value) => center + (value * size - center) * inset;
  const r = (value) => value * size * inset;

  // Himmel
  painter.gradient(0, 0, size, size, SKY_STOPS);

  // Sonne
  painter.circle(p(0.8), p(0.16), r(0.075), '#ffe9a8');
  painter.circle(p(0.795), p(0.155), r(0.055), '#ffd35e');

  // Sternchen am Himmel
  [
    [0.14, 0.09],
    [0.3, 0.19],
    [0.68, 0.07],
    [0.88, 0.33],
    [0.09, 0.31],
  ].forEach(([x, y], index) => {
    painter.circle(p(x), p(y), r(index % 2 === 0 ? 0.011 : 0.008), '#ffffffcc');
  });

  // Wolken (bewusst neben dem Haus, damit nichts hervorlugt)
  painter.roundedRect(p(0.01), p(0.3), r(0.21), r(0.07), r(0.035), '#ffffffe6');
  painter.roundedRect(p(0.77), p(0.43), r(0.22), r(0.072), r(0.036), '#ffffffd0');

  // Wiese – beginnt immer dort, wo das Haus steht
  const groundTop = p(0.86);
  painter.rect(0, groundTop, size, size - groundTop, GROUND);
  painter.rect(0, groundTop, size, Math.max(1, r(0.016)), GROUND_LINE);

  // Bäume
  painter.circle(p(0.1), groundTop + r(0.03), r(0.055), '#15803d');
  painter.circle(p(0.9), groundTop + r(0.035), r(0.05), '#15803d');

  // Hochhaus: dunkler Rand + weißer Körper
  painter.roundedRect(p(0.265), p(0.2), r(0.47), r(0.66), r(0.05), BRAND_DARK);
  painter.roundedRect(p(0.285), p(0.22), r(0.43), r(0.64), r(0.04), '#ffffff');

  // Fenster: 3 Spalten × 5 Reihen, eins leuchtet
  const columns = [0.315, 0.45, 0.585];
  const rows = [0.26, 0.365, 0.47, 0.575, 0.68];
  rows.forEach((rowY, rowIndex) => {
    columns.forEach((columnX, columnIndex) => {
      const highlighted = rowIndex === 1 && columnIndex === 2;
      painter.roundedRect(
        p(columnX),
        p(rowY),
        r(0.085),
        r(0.078),
        r(0.018),
        highlighted ? ACCENT : WINDOW_BLUE
      );
    });
  });

  // Haustür
  painter.roundedRect(p(0.455), p(0.785), r(0.09), r(0.095), r(0.02), BRAND_DARK);

  // Stern auf dem Dach
  painter.star(p(0.5), p(0.115), r(0.085), r(0.036), ACCENT, -90);
}

/* ------------------------------------------------------------------ */
/* Teilen-Bild (1200×630 für WhatsApp, Signal, Facebook, X)            */
/* ------------------------------------------------------------------ */

function drawShareImage(painter, width, height) {
  painter.gradient(0, 0, width, height, SKY_STOPS);

  // Sonne und Sternchen (freie Flächen, damit nichts mit dem Text kollidiert)
  painter.circle(width * 0.9, height * 0.14, height * 0.1, '#ffe9a8');
  painter.circle(width * 0.895, height * 0.135, height * 0.072, '#ffd35e');
  [
    [0.44, 0.11],
    [0.7, 0.52],
  ].forEach(([x, y]) => {
    painter.circle(width * x, height * y, height * 0.013, '#ffffffb0');
  });

  // Wolken
  painter.roundedRect(width * 0.04, height * 0.04, width * 0.2, height * 0.06, height * 0.03, '#ffffffe0');
  painter.roundedRect(width * 0.52, height * 0.085, width * 0.15, height * 0.05, height * 0.025, '#ffffffb0');
  painter.roundedRect(width * 0.03, height * 0.71, width * 0.26, height * 0.07, height * 0.035, '#ffffffd8');

  // Wiese
  const groundTop = height * 0.84;
  painter.rect(0, groundTop, width, height - groundTop, GROUND);
  painter.rect(0, groundTop, width, height * 0.012, GROUND_LINE);

  // Turm rechts
  const towerW = width * 0.15;
  const towerX = width * 0.72;
  const towerTop = height * 0.13;
  const towerH = groundTop - towerTop;
  painter.roundedRect(towerX - 7, towerTop - 7, towerW + 14, towerH + 7, 16, BRAND_DARK);
  painter.roundedRect(towerX, towerTop, towerW, towerH, 13, '#ffffff');

  const windowW = towerW * 0.3;
  const windowH = towerH * 0.11;
  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 2; column += 1) {
      const windowX = towerX + towerW * (column === 0 ? 0.16 : 0.54);
      const windowY = towerTop + towerH * (0.07 + row * 0.175);
      const highlighted = row === 1 && column === 0;
      painter.roundedRect(
        windowX,
        windowY,
        windowW,
        windowH,
        windowH * 0.25,
        highlighted ? ACCENT : WINDOW_BLUE
      );
    }
  }

  // Haustür
  painter.roundedRect(
    towerX + towerW * 0.34,
    groundTop - towerH * 0.09,
    towerW * 0.32,
    towerH * 0.09,
    8,
    BRAND_DARK
  );

  // Stern über dem Turm
  painter.star(towerX + towerW / 2, height * 0.08, height * 0.09, height * 0.038, ACCENT, -90);

  // Überschrift mit Schatten
  const titleX = width * 0.06;
  const titleY = height * 0.2;
  drawText(painter, 'MATHE-TURM', titleX + 4, titleY + 4, 11, '#2a49a8a0');
  drawText(painter, 'MATHE-TURM', titleX, titleY, 11, '#ffffff');

  // Akzentbalken
  painter.roundedRect(titleX, height * 0.37, width * 0.24, height * 0.014, height * 0.007, ACCENT);

  // Untertitel
  drawText(painter, 'KLASSE 1-5', titleX, height * 0.44, 6, '#2f4fa8');

  // Sternreihe als Deko
  for (let index = 0; index < 5; index += 1) {
    painter.star(
      titleX + height * 0.045 * index + height * 0.03,
      height * 0.63,
      height * 0.028,
      height * 0.012,
      ACCENT,
      -90
    );
  }
}

/* ------------------------------------------------------------------ */
/* Hauptprogramm                                                       */
/* ------------------------------------------------------------------ */

const ICONS = [
  { name: 'icon-192.png', size: 192, scale: 3, inset: 1 },
  { name: 'icon-512.png', size: 512, scale: 2, inset: 1 },
  { name: 'icon-maskable-512.png', size: 512, scale: 2, inset: 0.78 },
  { name: 'apple-touch-icon.png', size: 180, scale: 3, inset: 1 },
];

async function writePng(fileName, painter, width, height) {
  const png = painter.toPng();
  const problem = verifyPng(png, width, height);
  if (problem) throw new Error(`${fileName}: ${problem}`);
  await writeFile(path.join(publicDir, fileName), png);
  console.log(`  ✓ ${fileName}  ${width}×${height}  ${(png.length / 1024).toFixed(1)} KB`);
  return png;
}

async function main() {
  await mkdir(publicDir, { recursive: true });
  console.log('Erzeuge Icons ...');

  for (const icon of ICONS) {
    const painter = new Painter(icon.size, icon.size, icon.scale);
    drawTowerMotif(painter, icon.size, { inset: icon.inset });
    await writePng(icon.name, painter, icon.size, icon.size);
  }

  console.log('Erzeuge Teilen-Bild ...');
  const share = new Painter(1200, 630, 2);
  drawShareImage(share, 1200, 630);
  await writePng('og-image.png', share, 1200, 630);

  // Gegenprobe: Dateien wieder einlesen und prüfen
  console.log('Prüfe erzeugte Dateien ...');
  for (const icon of ICONS) {
    const buffer = await readFile(path.join(publicDir, icon.name));
    const problem = verifyPng(buffer, icon.size, icon.size);
    if (problem) throw new Error(`${icon.name}: ${problem}`);
  }
  const shareFile = await readFile(path.join(publicDir, 'og-image.png'));
  const shareProblem = verifyPng(shareFile, 1200, 630);
  if (shareProblem) throw new Error(`og-image.png: ${shareProblem}`);

  console.log('\nAlles in Ordnung – Icons liegen in public/.');
}

main().catch((error) => {
  console.error(`\n✗ ${error.message}`);
  process.exit(1);
});
