/**
 * Highscore-Speicher (pro Klassenstufe) im localStorage des Browsers.
 */

const KEY = 'mathe-turm.highscore.v1';

export function loadHighscores() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const clean = {};
    Object.entries(parsed).forEach(([grade, floors]) => {
      const value = Number(floors);
      if (Number.isFinite(value) && value > 0) clean[grade] = value;
    });
    return clean;
  } catch (error) {
    console.warn('Highscore konnte nicht geladen werden:', error);
    return {};
  }
}

export function saveHighscore(gradeId, floors) {
  const all = loadHighscores();
  const previous = all[String(gradeId)] ?? 0;
  if (floors > previous) {
    all[String(gradeId)] = floors;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(all));
    } catch (error) {
      console.warn('Highscore konnte nicht gespeichert werden:', error);
    }
  }
  return all;
}

export function getHighscore(highscores, gradeId) {
  return highscores[String(gradeId)] ?? 0;
}
