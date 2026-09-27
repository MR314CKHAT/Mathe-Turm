/**
 * Laedt die Schriftarten (Baloo 2 + Nunito, nur den lateinischen Zeichensatz)
 * von Google herunter, legt sie lokal in src/assets/fonts/ ab und schreibt
 * src/fonts.css mit den @font-face-Regeln.
 *
 * Vorteil: Die App laedt keine Daten mehr von Google-Servern (DSGVO) und
 * funktioniert auch offline (wichtig fuer die PWA).
 *
 * Aufruf: npm run fonts
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const fontDir = path.join(root, 'src', 'assets', 'fonts');
const cssFile = path.join(root, 'src', 'fonts.css');

const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&family=Nunito:wght@400;600;800&display=swap';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const WANTED_SUBSETS = new Set(['latin']);

const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-');

function placeholderCss(reason) {
  return [
    '/* AUTOMATISCH ERZEUGT von scripts/fetch-fonts.mjs – nicht von Hand bearbeiten. */',
    `/* ${reason} */`,
    '/* Solange diese Datei leer ist, verwendet die App die Systemschriften. */',
    '',
  ].join('\n');
}

async function main() {
  console.log('→ Lade Font-CSS von Google ...');
  const response = await fetch(CSS_URL, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`CSS-Antwort ${response.status}`);
  const css = await response.text();

  const blocks = [...css.matchAll(/\/\*\s*([a-z0-9-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/gi)];
  if (blocks.length === 0) throw new Error('Keine @font-face-Blöcke gefunden.');

  await rm(fontDir, { recursive: true, force: true });
  await mkdir(fontDir, { recursive: true });

  const downloaded = [];
  for (const match of blocks) {
    const subset = match[1].toLowerCase();
    const body = match[2];
    if (!WANTED_SUBSETS.has(subset)) continue;

    const family = /font-family:\s*'([^']+)'/.exec(body)?.[1];
    const weight = /font-weight:\s*(\d+)/.exec(body)?.[1];
    const style = /font-style:\s*(\w+)/.exec(body)?.[1] ?? 'normal';
    const url = /url\((https:[^)]+\.woff2)\)/.exec(body)?.[1];
    const range = /unicode-range:\s*([^;]+);/.exec(body)?.[1]?.trim();
    if (!family || !weight || !url) continue;

    const fontResponse = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!fontResponse.ok) {
      throw new Error(`${family} ${weight}: HTTP ${fontResponse.status}`);
    }
    const buffer = Buffer.from(await fontResponse.arrayBuffer());
    downloaded.push({
      family,
      weight,
      style,
      subset,
      range,
      buffer,
      hash: createHash('sha1').update(buffer).digest('hex'),
    });
  }

  if (downloaded.length === 0) throw new Error('Keine passenden Schriftdateien gefunden.');

  // Google liefert variable Schriften: für mehrere Gewichte kommt dieselbe Datei.
  // Deshalb nach Inhalt entdoppeln – dann wird jede Datei nur einmal geladen.
  const groups = new Map();
  for (const face of downloaded) {
    if (!groups.has(face.hash)) {
      groups.set(face.hash, { faces: [], fileName: null });
    }
    groups.get(face.hash).faces.push(face);
  }

  let savedBytes = 0;
  for (const group of groups.values()) {
    const familySlug = slug(group.faces[0].family);
    const subset = group.faces[0].subset;
    const weights = [...new Set(group.faces.map((face) => Number(face.weight)))].sort(
      (a, b) => a - b
    );
    const fileName =
      weights.length > 1
        ? `${familySlug}-${weights[0]}-${weights[weights.length - 1]}-${subset}.woff2`
        : `${familySlug}-${weights[0]}-${subset}.woff2`;

    group.fileName = fileName;
    group.faces.forEach((face) => {
      face.fileName = fileName;
    });
    savedBytes += group.faces[0].buffer.length * (weights.length - 1);

    await writeFile(path.join(fontDir, fileName), group.faces[0].buffer);
    console.log(
      `  ✓ ${fileName} (${(group.faces[0].buffer.length / 1024).toFixed(1)} KB) ` +
        `für Gewicht ${weights.join(' / ')}`
    );
  }

  if (savedBytes > 0) {
    console.log(`  ↳ ${(savedBytes / 1024).toFixed(1)} KB gespart (variable Schriftart).`);
  }

  const faces = downloaded;

  const rules = faces.map((face) =>
    [
      '@font-face {',
      `  font-family: '${face.family}';`,
      `  font-style: ${face.style};`,
      `  font-weight: ${face.weight};`,
      '  font-display: swap;',
      `  src: url('./assets/fonts/${face.fileName}') format('woff2');`,
      face.range ? `  unicode-range: ${face.range};` : null,
      '}',
    ]
      .filter(Boolean)
      .join('\n')
  );

  const header = [
    '/* AUTOMATISCH ERZEUGT von scripts/fetch-fonts.mjs – nicht von Hand bearbeiten. */',
    '/* Schriften liegen lokal in src/assets/fonts/ – keine Verbindung zu Google. */',
    '',
  ].join('\n');

  await writeFile(cssFile, `${header}${rules.join('\n\n')}\n`, 'utf8');

  // Gegenprobe: alle genannten Dateien müssen existieren und echte woff2 sein
  const uniqueFiles = [...new Set(faces.map((face) => face.fileName))];
  for (const fileName of uniqueFiles) {
    const buffer = await readFile(path.join(fontDir, fileName));
    if (buffer.toString('ascii', 0, 4) !== 'wOF2') {
      throw new Error(`${fileName} ist keine gültige woff2-Datei.`);
    }
  }

  const written = await readFile(cssFile, 'utf8');
  if (!written.includes('@font-face')) throw new Error('fonts.css wurde nicht korrekt geschrieben.');
  for (const fileName of uniqueFiles) {
    if (!written.includes(fileName)) throw new Error(`${fileName} fehlt in src/fonts.css.`);
  }

  console.log(
    `\n✓ ${uniqueFiles.length} Schriftdateien (${faces.length} Gewichte) lokal gespeichert, ` +
      'src/fonts.css geschrieben.'
  );
}

main().catch(async (error) => {
  console.error(`\n✗ Schriften konnten nicht geladen werden: ${error.message}`);
  console.error('  Die App benutzt weiterhin die Systemschriften – kein Problem.');
  try {
    await writeFile(cssFile, placeholderCss(`Fehler: ${error.message}`), 'utf8');
  } catch {
    /* egal */
  }
  process.exit(1);
});
