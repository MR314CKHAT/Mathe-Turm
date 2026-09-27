import { renderToString as rawRender } from 'react-dom/server';
import StartScreen from '../src/components/StartScreen.jsx';
import GameScreen from '../src/components/GameScreen.jsx';
import ResultScreen from '../src/components/ResultScreen.jsx';
import Tower from '../src/components/Tower.jsx';

const noop = () => {};

const settings = {
  grade: 3,
  ops: ['mul', 'div'],
  totalMinutes: 5,
  perTaskSeconds: 20,
  failMode: 'c',
  sound: false,
};

let errors = 0;

const clean = (html) => html.replace(/<!-- -->/g, '');
const renderToString = (element) => clean(rawRender(element));

function expect(name, condition) {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    errors += 1;
    console.error(`  FAIL ${name}`);
  }
}

console.log('Render-Smoke-Test');

// --- StartScreen ---
const startHtml = renderToString(
  <StartScreen settings={settings} highscores={{ 3: 9 }} onChange={noop} onStart={noop} />
);
expect('StartScreen zeigt den Titel', startHtml.includes('Mathe-Turm'));
expect('StartScreen zeigt alle Klassenstufen', ['Klasse 1', 'Klasse 5'].every((t) => startHtml.includes(t)));
expect('StartScreen zeigt die Modi A/B/C', ['Entspannt', 'Zeitdruck', 'Abstieg'].every((t) => startHtml.includes(t)));
expect('StartScreen zeigt den Rekord der Klasse', startHtml.includes('9'));
expect('StartScreen zeigt die Rekordliste', startHtml.includes('Deine Rekorde'));
expect('StartScreen listet Rekorde aller Klassen', startHtml.includes('Klasse 3: <strong>9</strong>'));
expect('StartScreen zeigt den Start-Button', startHtml.includes('Los geht'));

// --- GameScreen (mit Zeit pro Aufgabe) ---
const gameHtml = renderToString(
  <GameScreen settings={settings} onFinish={noop} onQuit={noop} />
);
expect('GameScreen zeigt die Aufgabe', gameHtml.includes('Wie viel ist'));
expect('GameScreen zeigt den Gesamt-Timer', gameHtml.includes('Gesamtzeit'));
expect('GameScreen zeigt den Timer pro Aufgabe', gameHtml.includes('diese Aufgabe'));
expect('GameScreen zeigt die Tastatur', gameHtml.includes('keypad__key'));
expect('GameScreen zeigt den Turm', gameHtml.includes('Stockwerk'));
expect('GameScreen zeigt die Antwort-Bestätigung', gameHtml.includes('Antwort'));

// --- GameScreen ohne Zeit pro Aufgabe ---
const gameNoTimer = renderToString(
  <GameScreen
    settings={{ ...settings, perTaskSeconds: 0 }}
    onFinish={noop}
    onQuit={noop}
  />
);
expect('ohne Aufgaben-Timer wird dieser nicht angezeigt', !gameNoTimer.includes('diese Aufgabe'));

// --- Tower ---
const towerHtml = renderToString(<Tower floor={7} />);
expect('Tower markiert das aktuelle Stockwerk', towerHtml.includes('floor--current'));
expect('Tower hebt Meilensteine hervor', towerHtml.includes('floor--milestone'));
expect('Tower zeichnet Stockwerke', (towerHtml.match(/class="floor/g) || []).length >= 14);

// --- ResultScreen ---
const resultHtml = renderToString(
  <ResultScreen
    result={{
      reason: 'zeit',
      grade: 3,
      floor: 12,
      correct: 14,
      wrong: 3,
      maxStreak: 6,
      secondsPlayed: 300,
    }}
    isRecord
    highscore={12}
    onRestart={noop}
    onSettings={noop}
  />
);
expect('ResultScreen meldet den Rekord', resultHtml.includes('Neuer Rekord'));
expect('ResultScreen zeigt die Stockwerke', resultHtml.includes('Stockwerke hoch'));
expect('ResultScreen rechnet Meter aus', resultHtml.includes('36 Meter'));
expect('ResultScreen zeigt die Trefferquote', resultHtml.includes('Trefferquote'));

// --- Ergebnis ohne ein einziges Stockwerk (Trost-Text) ---
const zeroHtml = renderToString(
  <ResultScreen
    result={{
      reason: 'zeit',
      grade: 1,
      floor: 0,
      correct: 0,
      wrong: 3,
      maxStreak: 0,
      secondsPlayed: 120,
    }}
    isRecord={false}
    highscore={0}
    onRestart={noop}
    onSettings={noop}
  />
);
expect('Ergebnis bei 0 Stockwerken hat einen Trost-Text', zeroHtml.includes('Erdgeschoss'));
expect('Ergebnis bei 0 Stockwerken zeigt keine Meter', zeroHtml.includes('0 Meter'));

console.log(
  `\n${errors === 0 ? 'Alle Render-Tests bestanden ✅' : `${errors} Render-Test(s) fehlgeschlagen ❌`}`
);
process.exit(errors === 0 ? 0 : 1);
