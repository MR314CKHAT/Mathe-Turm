import { useState } from 'react';
import StartScreen from './components/StartScreen.jsx';
import GameScreen from './components/GameScreen.jsx';
import ResultScreen from './components/ResultScreen.jsx';
import { getHighscore, loadHighscores, loadTheme, saveHighscore, saveTheme } from './utils/storage.js';
import { DEFAULT_THEME, THEMES } from './utils/theme.js';

const DEFAULT_SETTINGS = {
  theme: DEFAULT_THEME,
  grade: 2,
  ops: ['add'],
  totalMinutes: 5,
  perTaskSeconds: 20,
  failMode: 'a',
  sound: true,
};

export default function App() {
  const [screen, setScreen] = useState('start'); // start | playing | result
  const [settings, setSettings] = useState(() => {
    // Zuletzt gewählte Spielwelt wiederherstellen
    const saved = loadTheme();
    const theme = saved && THEMES[saved] && THEMES[saved].ready ? saved : DEFAULT_THEME;
    return { ...DEFAULT_SETTINGS, theme };
  });
  const [round, setRound] = useState(0); // erzwingt einen frischen Spielstart
  const [highscores, setHighscores] = useState(loadHighscores);
  const [result, setResult] = useState(null);
  const [isRecord, setIsRecord] = useState(false);

  function updateSettings(patch) {
    if (patch.theme && patch.theme !== settings.theme) saveTheme(patch.theme);
    setSettings((current) => ({ ...current, ...patch }));
  }

  function startGame() {
    setRound((value) => value + 1);
    setScreen('playing');
  }

  function handleFinish(gameResult) {
    const previous = getHighscore(highscores, gameResult.grade);
    const record = gameResult.floor > previous;
    if (record) {
      setHighscores(saveHighscore(gameResult.grade, gameResult.floor));
    }
    setIsRecord(record);
    setResult(gameResult);
    setScreen('result');
  }

  return (
    <div className="app">
      {/* Lebendiger Hintergrund hinter allen Screens */}
      <div className="appbg" aria-hidden="true">
        <div className="appbg__gradient" />
        <div className="appbg__blob appbg__blob--1" />
        <div className="appbg__blob appbg__blob--2" />
        <div className="appbg__blob appbg__blob--3" />
        <div className="appbg__stars" />
      </div>

      {screen === 'start' && (
        <StartScreen
          settings={settings}
          highscores={highscores}
          onChange={updateSettings}
          onStart={startGame}
        />
      )}

      {screen === 'playing' && (
        <GameScreen
          key={round}
          settings={settings}
          onFinish={handleFinish}
          onQuit={() => setScreen('start')}
        />
      )}

      {screen === 'result' && result && (
        <ResultScreen
          result={result}
          isRecord={isRecord}
          highscore={Math.max(
            getHighscore(highscores, result.grade),
            result.floor
          )}
          onRestart={startGame}
          onSettings={() => setScreen('start')}
        />
      )}
    </div>
  );
}
