/**
 * Highscore-Speicher (pro Klassenstufe) im localStorage des Browsers.
 * Hier landet auch die zuletzt gewählte Spielwelt.
 */

const KEY = 'mathe-turm.highscore.v1';
const THEME_KEY = 'mathe-turm.theme.v1';

/** Gespeicherte Spielwelt laden (oder null, wenn noch keine gewählt wurde). */
export function loadTheme() {
  try {
    return window.localStorage.getItem(THEME_KEY);
  } catch (error) {
    console.warn('Spielwelt konnte nicht geladen werden:', error);
    return null;
  }
}

/** Gewählte Spielwelt merken, damit sie beim nächsten Start bleibt. */
export function saveTheme(themeId) {
  try {
    window.localStorage.setItem(THEME_KEY, String(themeId));
  } catch (error) {
    console.warn('Spielwelt konnte nicht gespeichert werden:', error);
  }
}

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
