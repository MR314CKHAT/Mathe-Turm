import { useEffect, useRef, useState } from 'react';
import Tower from './Tower.jsx';
import Keypad from './Keypad.jsx';
import { GRADES, generateTask, randomPraise } from '../utils/mathTasks.js';
import { playCorrect, playFinish, playWrong } from '../utils/sound.js';
import { themeOf } from '../utils/theme.js';

function formatTime(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function GameScreen({ settings, onFinish, onQuit }) {
  const totalSeconds = Math.max(10, Math.round(settings.totalMinutes * 60));
  const perTask = Math.max(0, Math.round(settings.perTaskSeconds));
  const grade = GRADES.find((g) => g.id === settings.grade) || GRADES[0];

  const [task, setTask] = useState(() => generateTask(settings.grade, settings.ops));
  const [input, setInput] = useState('');
  const [floor, setFloor] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [taskTimeLeft, setTaskTimeLeft] = useState(perTask);
  const [elapsed, setElapsed] = useState(0);
  const [feedback, setFeedbackRaw] = useState(null);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Stimmung und Effekte der Spielfigur (Zähler starten Animationen neu)
  const [mood, setMood] = useState('idle');
  const [burst, setBurst] = useState(0);
  const [rain, setRain] = useState(0);
  const [sparkle, setSparkle] = useState(0);
  const [shake, setShake] = useState(0);
  const moodTimerRef = useRef(null);

  const theme = themeOf(settings.theme);

  /** Die Figur freut sich / trauert eine Weile und geht dann auf "idle". */
  function setMoodFor(nextMood, ms = 1700) {
    setMood(nextMood);
    if (moodTimerRef.current) window.clearTimeout(moodTimerRef.current);
    moodTimerRef.current = window.setTimeout(() => setMood('idle'), ms);
  }

  // Mood-Timer beim Verlassen aufräumen
  useEffect(
    () => () => {
      if (moodTimerRef.current) window.clearTimeout(moodTimerRef.current);
    },
    []
  );

  const liveRef = useRef(null);
  const handlersRef = useRef({});
  const finishedRef = useRef(false);
  const inputRef = useRef(null);

  // Aktuelle Werte für Timer-Callbacks bereitstellen (keine veralteten Closures)
  useEffect(() => {
    liveRef.current = {
      timeLeft,
      taskTimeLeft,
      elapsed,
      paused,
      floor,
      correct,
      wrong,
      maxStreak,
    };
  });

  function nextTask(avoidText) {
    return generateTask(settings.grade, settings.ops, avoidText ?? null);
  }

  function finish(reason, elapsedOverride) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const live = liveRef.current || {};
    setGameOver(true);
    if (settings.sound) playFinish();
    onFinish({
      reason,
      grade: settings.grade,
      floor: live.floor ?? 0,
      correct: live.correct ?? 0,
      wrong: live.wrong ?? 0,
      maxStreak: live.maxStreak ?? 0,
      secondsPlayed: elapsedOverride ?? live.elapsed ?? 0,
    });
  }

  /** Falsche Antwort / übersprungene Aufgabe: je nach Modus bestrafen. */
  function applyPenalty(intro) {
    setWrong((value) => value + 1);
    setStreak(0);
    setMoodFor('sad');
    setShake((value) => value + 1);
    setTask((current) => nextTask(current.text));
    setInput('');
    if (perTask > 0) setTaskTimeLeft(perTask);
    const drop = settings.failMode === 'c';
    if (drop) setFloor((value) => Math.max(0, value - 1));
    setFeedback({
      type: 'wrong',
      text: drop ? `${intro} Ein Stockwerk runter! 😬` : `${intro} Neue Aufgabe!`,
    });
  }

  function handleTaskTimeout() {
    if (settings.failMode === 'a') {
      // Entspannt: Aufgabe bleibt, nur die Zeit startet neu.
      setTaskTimeLeft(perTask);
      setMoodFor('sad');
      setFeedback({ type: 'info', text: '⏰ Die Zeit ist um – versuch es nochmal!' });
      return;
    }
    if (settings.sound) playWrong();
    applyPenalty('⏰ Zeit um –');
  }

  function skipTask() {
    if (settings.failMode === 'a') {
      setTask((current) => nextTask(current.text));
      setInput('');
      if (perTask > 0) setTaskTimeLeft(perTask);
      setFeedback({ type: 'info', text: '🔄 Hier ist eine neue Aufgabe!' });
      return;
    }
    if (settings.sound) playWrong();
    applyPenalty('🔄 Übersprungen –');
  }

  function submit() {
    if (gameOver || paused) return;
    const raw = input.trim();
    if (raw === '') return;
    const value = Number(raw);
    if (!Number.isFinite(value)) return;

    if (value === task.answer) {
      const newStreak = streak + 1;
      const newFloor = floor + 1;
      setCorrect((count) => count + 1);
      setStreak(newStreak);
      setMaxStreak((best) => Math.max(best, newStreak));
      setFloor(newFloor);
      setInput('');
      setTask((current) => nextTask(current.text));
      if (perTask > 0) setTaskTimeLeft(perTask);

      let text = randomPraise();
      if (newStreak >= 5) text = `🔥 ${newStreak} richtige Antworten in Folge!`;
      if (newFloor % 5 === 0) text = `🎉 ${newFloor}. Stockwerk erreicht! Weiter so!`;
      setFeedback({ type: 'correct', text });
      if (settings.sound) playCorrect();

      // Figur jubelt, Konfetti und Glitzer starten – alle 5 Etagen regnet es
      setMoodFor('cheer');
      setBurst((value) => value + 1);
      setSparkle((value) => value + 1);
      if (newFloor % 5 === 0) setRain((value) => value + 1);
      return;
    }

    setWrong((count) => count + 1);
    setStreak(0);
    setInput('');
    if (settings.failMode === 'a') {
      // Entspannt: Stimmung + Beben, aber keine Bestrafung.
      setMoodFor('sad');
      setShake((value) => value + 1);
      if (perTask > 0) setTaskTimeLeft(perTask);
      setFeedback({ type: 'wrong', text: '💪 Fast! Versuch es nochmal.' });
    } else {
      // applyPenalty setzt selbst Stimmung ("sad") und Beben.
      applyPenalty(`❌ Leider falsch – ${task.answer} wäre richtig.`);
    }
    if (settings.sound) playWrong();
  }

  function pressDigit(digit) {
    if (gameOver || paused) return;
    setInput((current) => (current + digit).slice(0, 6));
  }

  function pressDelete() {
    if (gameOver || paused) return;
    setInput((current) => current.slice(0, -1));
  }

  function setFeedback(value) {
    setFeedbackRaw(value ? { ...value, nonce: Math.random() } : null);
  }

  // Handler-Referenz für die Timer-Callbacks aktuell halten
  useEffect(() => {
    handlersRef.current = { finish, handleTaskTimeout };
  });

  // Haupt-Uhr: Gesamtzeit + Zeit pro Aufgabe
  useEffect(() => {
    if (gameOver) return undefined;
    const id = window.setInterval(() => {
      const live = liveRef.current;
      if (!live || live.paused) return;

      const nextTimeLeft = Math.max(0, live.timeLeft - 1);
      const nextElapsed = live.elapsed + 1;
      setTimeLeft(nextTimeLeft);
      setElapsed(nextElapsed);

      if (perTask > 0) {
        const nextTaskTime = Math.max(0, live.taskTimeLeft - 1);
        if (nextTaskTime === 0) {
          setTaskTimeLeft(0);
          handlersRef.current.handleTaskTimeout();
        } else {
          setTaskTimeLeft(nextTaskTime);
        }
      }

      if (nextTimeLeft === 0) {
        handlersRef.current.finish('zeit', nextElapsed);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [gameOver, perTask]);

  // Hinweisblase nach kurzer Zeit ausblenden
  useEffect(() => {
    if (!feedback) return undefined;
    const id = window.setTimeout(() => setFeedbackRaw(null), 2200);
    return () => window.clearTimeout(id);
  }, [feedback]);

  // Eingabefeld im Blick behalten – auf Geräten mit Tastatur/Maus automatisch,
  // auf Handys nicht, damit dort nicht sofort die Bildschirmtastatur aufspringt.
  const autoFocusInput =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

  useEffect(() => {
    if (autoFocusInput && !paused && inputRef.current) inputRef.current.focus();
  }, [task.id, paused, autoFocusInput]);

  const totalRatio = Math.max(0, Math.min(1, timeLeft / totalSeconds));
  const taskRatio =
    perTask > 0 ? Math.max(0, Math.min(1, taskTimeLeft / perTask)) : 1;
  const taskTone = taskRatio > 0.5 ? 'ok' : taskRatio > 0.25 ? 'warn' : 'bad';

  return (
    <div className="screen screen--game">
      <header className="hud">
        <div className="hud__chips">
          <span className="hud__chip">
            {theme.emoji} {theme.name}
          </span>
          <span className="hud__chip">🎓 {grade.label}</span>
          <span className="hud__chip">🔥 Serie: {streak}</span>
          <span className="hud__chip">✅ {correct}</span>
          <span className="hud__chip">❌ {wrong}</span>
        </div>
        <div className="hud__buttons">
          <button
            type="button"
            className="btn btn--icon"
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? 'Weiterspielen' : 'Pause'}
          >
            {paused ? '▶️' : '⏸️'}
          </button>
          <button
            type="button"
            className="btn btn--icon"
            onClick={onQuit}
            aria-label="Zurück zum Menü"
          >
            🏠
          </button>
        </div>
      </header>

      <div className="timers">
        <div className="timer">
          <span className="timer__label">Gesamtzeit</span>
          <div className="timer__bar">
            <div
              className="timer__fill timer__fill--total"
              style={{ width: `${totalRatio * 100}%` }}
            />
          </div>
          <span className="timer__value">{formatTime(timeLeft)}</span>
        </div>

        {perTask > 0 && (
          <div className="timer">
            <span className="timer__label">diese Aufgabe</span>
            <div className="timer__bar">
              <div
                className={`timer__fill timer__fill--${taskTone}`}
                style={{ width: `${taskRatio * 100}%` }}
              />
            </div>
            <span className="timer__value">{taskTimeLeft}s</span>
          </div>
        )}
      </div>

      <main className="game">
        <section className="game__tower">
          <Tower
            floor={floor}
            theme={theme.id}
            mood={mood}
            burst={burst}
            rain={rain}
            sparkle={sparkle}
            shake={shake}
          />
        </section>

        <section className={`game__panel${paused ? ' game__panel--paused' : ''}`}>
          <div className="taskbox">
            <span className="taskbox__hint">Wie viel ist …</span>
            <div className="taskbox__task">
              {task.text} <span className="taskbox__eq">= ?</span>
            </div>

            <form
              className="answer"
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <input
                ref={inputRef}
                className="answer__input"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="?"
                value={input}
                onChange={(event) =>
                  setInput(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))
                }
                disabled={paused}
                aria-label="Deine Antwort"
              />
              <button
                type="submit"
                className="btn btn--primary answer__submit"
                disabled={paused}
              >
                Antwort ✔
              </button>
            </form>
          </div>

          <Keypad
            onDigit={pressDigit}
            onDelete={pressDelete}
            onSubmit={submit}
            disabled={paused}
          />

          <div className="game__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={skipTask}
              disabled={paused}
            >
              🔄 Neue Aufgabe
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => finish('aufgeben')}
              disabled={paused}
            >
              🏳️ Aufgeben
            </button>
          </div>

          {feedback && (
            <div className={`toast toast--${feedback.type}`} key={feedback.nonce}>
              {feedback.text}
            </div>
          )}

          {paused && (
            <div className="pauseoverlay">
              <span className="pauseoverlay__emoji">⏸️</span>
              <p className="pauseoverlay__text">Pause</p>
              <button
                type="button"
                className="btn btn--primary btn--big"
                onClick={() => setPaused(false)}
              >
                ▶️ Weiterspielen
              </button>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
