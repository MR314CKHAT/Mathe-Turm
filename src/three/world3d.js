/**
 * Gemeinsame Maße und Paletten für die 3D-Welten (Schloss + Pirat).
 * Eine Etage ist FLOOR_H Einheiten hoch – die Kamera folgt dieser Höhe.
 */

export const FLOOR_H = 2.4;
export const TOWER_R = 3.1;

/** Der Turm wird einmalig so hoch gebaut – die Spitze verschwindet im Nebel. */
export const MAX_FLOORS = 120;

/** Höhe, auf der die Spielfigur steht. */
export const characterY = (floor) => floor * FLOOR_H;

/** Abstand der Kletter-Plattform von der Mittelachse (Turm dick, Mast dünn). */
export function standZ(theme) {
  return theme === 'pirate' ? 1.45 : TOWER_R + 0.42;
}

/** Farben pro Spielwelt (an die 2D-Welten aus theme.js angelehnt). */
export const PALETTES = {
  princess: {
    stone: '#cdb4e6',
    stoneDark: '#a98fd0',
    mortar: '#8f6fc0',
    trim: '#ffd35e',
    window: '#ffe9a8',
    door: '#6b3fa0',
    grass: '#7ec96f',
    grassDark: '#5da24f',
    path: '#e8d9b8',
    bush: '#4f9e4a',
    flower: ['#ff9ecb', '#ffd35e', '#7ee8fa', '#ffffff'],
    confetti: ['#ff9ecb', '#ffd35e', '#9a63e0', '#7ee8fa', '#ffffff'],
    dress: '#ff9ecb',
    cape: '#9a63e0',
    hair: '#9c5228',
    skin: '#f7d7c0',
    crown: '#ffd35e',
    iris: '#5f7d4f',
    lips: '#c06b74',
    freckle: '#c98256',
  },
  pirate: {
    wood: '#7a4f2c',
    woodDark: '#54371e',
    rope: '#d8c49a',
    sail: '#f4f1e8',
    sea: '#1b6f9c',
    seaDeep: '#0c3d5c',
    foam: '#cfeef7',
    window: '#ffd35e',
    confetti: ['#ffd35e', '#f4a259', '#e8e0cc', '#8ad0e8'],
    shirt: '#f4f1e8',
    stripe: '#3b6ea5',
    vest: '#7a4f2c',
    bandana: '#e0454b',
    skin: '#efc39b',
    pants: '#2f4a6b',
    gold: '#ffd35e',
    hair: '#33261b',
    boots: '#3b2a1e',
    beltDark: '#2b2118',
    silver: '#c9ccd4',
    iris: '#4a3524',
    lips: '#a8635a',
    scar: '#d98b7d',
  },
};

export function paletteFor(theme) {
  return PALETTES[theme] || PALETTES.princess;
}
