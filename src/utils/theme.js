/**
 * Spielwelten: jede Welt bringt eigene Farben, Himmels-Zonen, Figuren,
 * Deko und Belohnungen mit.
 *
 * Der Himmel ist in "Zonen" aufgeteilt. Je höher das Kind klettert, desto
 * weiter oben in der Liste landet es – die Farben werden dazwischen
 * weich gemischt (siehe skyFor()).
 */

export const THEMES = {
  princess: {
    id: 'princess',
    name: 'Zauberschloss',
    emoji: '👑',
    tagline: 'Klettere den Schlossturm hoch',
    ready: true,
    rewardName: 'Zauberschlüssel',
    rewardEmoji: '🗝️',
    sky: [
      { at: 0, zone: 'Morgenhimmel', top: '#8ab6ff', mid: '#cfe6ff', bottom: '#ffe9f6', stars: 0, sun: 1, moon: 0, rainbow: 0, magic: 0 },
      { at: 8, zone: 'Abendrot', top: '#ff9ecb', mid: '#ffd0b0', bottom: '#fff0c9', stars: 0.1, sun: 0.85, moon: 0, rainbow: 0, magic: 0.1 },
      { at: 17, zone: 'Sternennacht', top: '#4b3a86', mid: '#a06fb8', bottom: '#ffc0dd', stars: 0.85, sun: 0, moon: 1, rainbow: 0.4, magic: 0.5 },
      { at: 28, zone: 'Feenhimmel', top: '#1d1250', mid: '#5b34a8', bottom: '#b98fe8', stars: 1, sun: 0, moon: 1, rainbow: 0.85, magic: 0.85 },
      { at: 45, zone: 'Zauberwelt', top: '#140b3a', mid: '#432184', bottom: '#8f5fd8', stars: 1, sun: 0, moon: 1, rainbow: 1, magic: 1 },
    ],
  },

  pirate: {
    id: 'pirate',
    name: 'Piratenmeer',
    emoji: '🏴‍☠️',
    tagline: 'Klettere den Mast hoch',
    ready: true,
    rewardName: 'Goldmünze',
    rewardEmoji: '🪙',
    sky: [
      { at: 0, zone: 'Sonnenschein', top: '#5fb8f0', mid: '#a8dcf7', bottom: '#e8f6ff', stars: 0, sun: 1, moon: 0, rainbow: 0, magic: 0 },
      { at: 8, zone: 'Gewitterwolken', top: '#3b5668', mid: '#7d93a3', bottom: '#c8d4dc', stars: 0.1, sun: 0.4, moon: 0, rainbow: 0, magic: 0.1 },
      { at: 17, zone: 'Sternenhimmel', top: '#12203f', mid: '#2f4a72', bottom: '#6f8fb5', stars: 0.9, sun: 0, moon: 1, rainbow: 0, magic: 0.25 },
      { at: 28, zone: 'Wolkenmeer', top: '#0d1730', mid: '#26405f', bottom: '#7c9ec0', stars: 1, sun: 0, moon: 1, rainbow: 0, magic: 0.5 },
      { at: 45, zone: 'Himmelsmeer', top: '#081026', mid: '#1b3350', bottom: '#5c7fa3', stars: 1, sun: 0, moon: 1, rainbow: 0, magic: 0.7 },
    ],
  },
};

export const DEFAULT_THEME = 'princess';

export function themeOf(themeId) {
  return THEMES[themeId] || THEMES[DEFAULT_THEME];
}

export function themeList() {
  return Object.values(THEMES);
}

/* ---------------------------------------------------------------- */
/* Farb-Mischung                                                     */
/* ---------------------------------------------------------------- */

function hexToRgb(hex) {
  let value = String(hex).replace('#', '');
  if (value.length === 3) {
    value = value
      .split('')
      .map((c) => c + c)
      .join('');
  }
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function toHex(rgb) {
  return `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
}

function mixHex(a, b, t) {
  const from = hexToRgb(a);
  const to = hexToRgb(b);
  return toHex(from.map((c, index) => c + (to[index] - c) * t));
}

const mixNumber = (a, b, t) => a + (b - a) * t;

/**
 * Himmels-Daten für eine Etage: Farben werden zwischen den Zonen gemischt,
 * damit der Übergang fließend ist statt sprunghaft.
 */
export function skyFor(themeId, floor) {
  const zones = themeOf(themeId).sky;
  const value = Math.max(0, floor);

  let lower = zones[0];
  let upper = zones[zones.length - 1];
  for (let index = 0; index < zones.length - 1; index += 1) {
    if (value >= zones[index].at && value <= zones[index + 1].at) {
      lower = zones[index];
      upper = zones[index + 1];
      break;
    }
  }

  const span = upper.at - lower.at;
  const t = span > 0 ? Math.min(1, Math.max(0, (value - lower.at) / span)) : 0;
  const blend = (key) => mixNumber(lower[key], upper[key], t);

  return {
    zone: t < 0.5 ? lower.zone : upper.zone,
    top: mixHex(lower.top, upper.top, t),
    mid: mixHex(lower.mid, upper.mid, t),
    bottom: mixHex(lower.bottom, upper.bottom, t),
    stars: blend('stars'),
    sun: blend('sun'),
    moon: blend('moon'),
    rainbow: blend('rainbow'),
    magic: blend('magic'),
  };
}
