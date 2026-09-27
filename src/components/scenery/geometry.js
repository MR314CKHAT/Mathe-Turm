/**
 * Gemeinsame Maße für alle Turm-Szenen (Schloss und Piratenmast),
 * damit beide Welten exakt gleich aufgebaut sind.
 */

export const FLOOR_H = 48;
export const GROUND_H = 76;
export const VISIBLE_FLOORS = 8;
export const VIEW_W = 300;
export const VIEW_H = FLOOR_H * VISIBLE_FLOORS + GROUND_H;

/** Unterkante einer Etage in Pixeln (Etage 1 = unterste Etage). */
export function floorBottom(number) {
  return GROUND_H + (number - 1) * FLOOR_H;
}

/** Wie weit die Kamera mitgefahren ist. */
export function cameraOffset(floor) {
  return Math.max(0, (floor - 3) * FLOOR_H);
}

/** So viele Etagen werden gezeichnet (etwas über die Sichtweite hinaus). */
export function renderedFloors(floor) {
  return Math.max(VISIBLE_FLOORS + 6, floor + 8);
}
