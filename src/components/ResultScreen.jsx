import { GRADES } from '../utils/mathTasks.js';

const REASONS = {
  zeit: 'Die Zeit ist abgelaufen ⏰',
  aufgeben: 'Du hast das Spiel beendet',
};

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function motivation(floor) {
  if (floor === 0) return 'Der Start ist unten im Erdgeschoss – gleich nochmal versuchen! 💪';
  if (floor < 5) return 'Du bist aus dem Erdgeschoss raus – weiter so! 🌱';
  if (floor < 10) return 'Schon in den mittleren Etagen – stark! ⭐';
  if (floor < 20) return 'Fast in den Wolken – super gemacht! ☁️';
  return 'Du bist über den Wolken geflogen! 🚀';
}

const CONFETTI_COLORS = ['#ff9ecb', '#ffd35e', '#9a63e0', '#7ee8fa', '#5fd97e'];

function ResultConfetti({ count = 26 }) {
  return (
    <div className="resultconfetti" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={index}
          className="resultconfetti__piece"
          style={{
            left: `${(index * 37) % 100}%`,
            background: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
            animationDuration: `${2.6 + ((index * 13) % 22) / 10}s`,
            animationDelay: `${((index * 29) % 30) / 10}s`,
            transform: `rotate(${index * 47}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default function ResultScreen({
  result,
  isRecord,
  highscore,
  onRestart,
  onSettings,
}) {
  const grade = GRADES.find((g) => g.id === result.grade);
  const height = result.floor * 3; // 1 Stockwerk ≈ 3 Meter
  const total = result.correct + result.wrong;
  const accuracy = total > 0 ? Math.round((result.correct / total) * 100) : 0;

  return (
    <div className="screen screen--result">
      <div className="card result">
        <ResultConfetti />
        <p className="result__reason">{REASONS[result.reason] ?? ''}</p>

        <h1 className="result__headline">
          {isRecord ? '🎉 Neuer Rekord!' : '🏁 Geschafft!'}
        </h1>

        <p className="result__motivation">{motivation(result.floor)}</p>

        <div className="result__tower">
          <span className="result__floors">{result.floor}</span>
          <span className="result__floors-label">Stockwerke hoch</span>
          <span className="result__height">≈ {height} Meter Höhe 🗼</span>
        </div>

        <div className="stats">
          <div className="stat">
            <span className="stat__value stat__value--ok">{result.correct}</span>
            <span className="stat__label">richtig ✅</span>
          </div>
          <div className="stat">
            <span className="stat__value stat__value--bad">{result.wrong}</span>
            <span className="stat__label">falsch ❌</span>
          </div>
          <div className="stat">
            <span className="stat__value">{accuracy}%</span>
            <span className="stat__label">Trefferquote 🎯</span>
          </div>
          <div className="stat">
            <span className="stat__value">{result.maxStreak}</span>
            <span className="stat__label">längste Serie 🔥</span>
          </div>
          <div className="stat">
            <span className="stat__value">{formatTime(result.secondsPlayed)}</span>
            <span className="stat__label">Spielzeit ⏱️</span>
          </div>
          <div className="stat">
            <span className="stat__value">
              {highscore}
              {isRecord ? ' 🏆' : ''}
            </span>
            <span className="stat__label">Rekord {grade ? grade.label : ''} 🥇</span>
          </div>
        </div>

        <div className="result__actions">
          <button type="button" className="btn btn--primary btn--big" onClick={onRestart}>
            🔁 Nochmal spielen
          </button>
          <button type="button" className="btn btn--ghost" onClick={onSettings}>
            ⚙️ Einstellungen ändern
          </button>
        </div>
      </div>
    </div>
  );
}
