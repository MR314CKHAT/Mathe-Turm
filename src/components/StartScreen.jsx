import { GRADES, OPS, allowedOps } from '../utils/mathTasks.js';
import { getHighscore } from '../utils/storage.js';
import { themeList } from '../utils/theme.js';

const TOTAL_PRESETS = [3, 5, 10];
const PER_TASK_PRESETS = [0, 10, 20, 30];

const FAIL_MODES = [
  {
    id: 'a',
    emoji: '🌱',
    title: 'Entspannt',
    text: 'Nichts Schlimmes: Die Aufgabe bleibt stehen, du darfst es nochmal versuchen. Gut zum Üben.',
  },
  {
    id: 'b',
    emoji: '⏱️',
    title: 'Zeitdruck',
    text: 'Es kommt sofort eine neue Aufgabe. Die Restzeit für diese Aufgabe ist verloren.',
  },
  {
    id: 'c',
    emoji: '😬',
    title: 'Abstieg',
    text: 'Eine neue Aufgabe und du fällst ein Stockwerk nach unten. Für echte Profis!',
  },
];

export default function StartScreen({ settings, highscores, onChange, onStart }) {
  const grade = GRADES.find((g) => g.id === settings.grade) || GRADES[0];
  const allowed = allowedOps(settings.grade);
  const record = getHighscore(highscores, settings.grade);
  const hasAnyRecord = GRADES.some((entry) => getHighscore(highscores, entry.id) > 0);

  function changeGrade(gradeId) {
    const nextAllowed = allowedOps(gradeId);
    const ops = settings.ops.filter((id) => nextAllowed.includes(id));
    onChange({
      grade: gradeId,
      ops: ops.length > 0 ? ops : [nextAllowed[0]],
    });
  }

  function toggleOp(opId) {
    if (!allowed.includes(opId)) return;
    const active = settings.ops.includes(opId);
    if (active && settings.ops.length === 1) return; // eine Rechenart bleibt immer
    const ops = active
      ? settings.ops.filter((id) => id !== opId)
      : [...settings.ops, opId];
    onChange({ ops });
  }

  return (
    <div className="screen screen--start">
      <div className="card">
        <header className="hero">
          <span className="hero__emoji" aria-hidden="true">
            🏢
          </span>
          <div>
            <h1 className="hero__title">Mathe-Turm</h1>
            <p className="hero__subtitle">
              Rechne dich Stockwerk für Stockwerk bis in die Wolken!
            </p>
          </div>
        </header>

        <section className="block">
          <h2 className="block__title">
            <span className="block__num">1</span> Welche Welt möchtest du?
          </h2>
          <div className="choices choices--theme">
            {themeList().map((entry) => {
              const active = settings.theme === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  className={`themeportal themeportal--${entry.id}${
                    active ? ' themeportal--active' : ''
                  }`}
                  onClick={() => onChange({ theme: entry.id })}
                  disabled={!entry.ready}
                  aria-pressed={active}
                  title={entry.ready ? entry.tagline : 'Kommt als Nächstes!'}
                >
                  <span className="themeportal__scene" aria-hidden="true">
                    <span className="themeportal__sun" />
                    <span className="themeportal__cloud themeportal__cloud--1" />
                    <span className="themeportal__cloud themeportal__cloud--2" />
                    <span className="themeportal__mark">
                      {entry.id === 'pirate' ? '🚢' : '🏰'}
                    </span>
                    <span className="themeportal__ground" />
                  </span>
                  <span className="themeportal__head">
                    <span className="themeportal__emoji" aria-hidden="true">
                      {entry.emoji}
                    </span>
                    <strong className="themeportal__name">{entry.name}</strong>
                  </span>
                  <small className="themeportal__tag">{entry.tagline}</small>
                  {!entry.ready && <small className="themeportal__soon">✨ kommt bald</small>}
                </button>
              );
            })}
          </div>
        </section>

        <section className="block">
          <h2 className="block__title">
            <span className="block__num">2</span> Welche Klasse gehst du?
          </h2>
          <div className="choices choices--grade">
            {GRADES.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={`choice${settings.grade === entry.id ? ' choice--active' : ''}`}
                onClick={() => changeGrade(entry.id)}
              >
                <strong>{entry.label}</strong>
                <small>{entry.hint}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="block">
          <h2 className="block__title">
            <span className="block__num">3</span> Was möchtest du rechnen?
          </h2>
          <div className="choices choices--ops">
            {OPS.map((op) => {
              const locked = !allowed.includes(op.id);
              const active = settings.ops.includes(op.id);
              return (
                <button
                  key={op.id}
                  type="button"
                  className={`choice choice--op${active ? ' choice--active' : ''}${
                    locked ? ' choice--locked' : ''
                  }`}
                  onClick={() => toggleOp(op.id)}
                  disabled={locked}
                  title={locked ? 'Kommt erst ab Klasse 3' : op.name}
                >
                  <span className="choice__emoji">{op.emoji}</span>
                  <strong>{op.label}</strong>
                  {locked && <small>ab Klasse 3</small>}
                </button>
              );
            })}
          </div>
        </section>
        <section className="block">
          <h2 className="block__title">
            <span className="block__num">4</span> Wie lange möchtest du spielen?
          </h2>
          <div className="row">
            <span className="row__label">Spielzeit insgesamt</span>
            <div className="presets">
              {TOTAL_PRESETS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className={`pill${settings.totalMinutes === minutes ? ' pill--active' : ''}`}
                  onClick={() => onChange({ totalMinutes: minutes })}
                >
                  {minutes} Min
                </button>
              ))}
              <label className="numfield">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.totalMinutes}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (!Number.isFinite(value)) return;
                    onChange({
                      totalMinutes: Math.min(60, Math.max(1, Math.round(value))),
                    });
                  }}
                />
                <span>Min (1–60)</span>
              </label>
            </div>
          </div>

          <div className="row">
            <span className="row__label">Zeit pro Aufgabe</span>
            <div className="presets">
              {PER_TASK_PRESETS.map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  className={`pill${
                    settings.perTaskSeconds === seconds ? ' pill--active' : ''
                  }`}
                  onClick={() => onChange({ perTaskSeconds: seconds })}
                >
                  {seconds === 0 ? 'AUS' : `${seconds} Sek`}
                </button>
              ))}
              <label className="numfield">
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={settings.perTaskSeconds}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (!Number.isFinite(value)) return;
                    onChange({
                      perTaskSeconds: Math.min(300, Math.max(0, Math.round(value))),
                    });
                  }}
                />
                <span>Sek (0 = AUS)</span>
              </label>
            </div>
          </div>
        </section>
        <section className="block">
          <h2 className="block__title">
            <span className="block__num">5</span> Wenn eine Antwort falsch ist …
          </h2>
          <div className="choices choices--mode">
            {FAIL_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={`choice choice--mode${
                  settings.failMode === mode.id ? ' choice--active' : ''
                }`}
                onClick={() => onChange({ failMode: mode.id })}
              >
                <span className="choice__emoji">{mode.emoji}</span>
                <strong>
                  {mode.id.toUpperCase()}) {mode.title}
                </strong>
                <small>{mode.text}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="block block--row">
          <button
            type="button"
            className={`toggle${settings.sound ? ' toggle--on' : ''}`}
            onClick={() => onChange({ sound: !settings.sound })}
            aria-pressed={settings.sound}
          >
            {settings.sound ? '🔊 Töne an' : '🔇 Töne aus'}
          </button>
          <div className="record">
            🏆 Rekord {grade.label}: <strong>{record}</strong> Stockwerke
          </div>
        </section>

        {hasAnyRecord && (
          <section className="block">
            <h2 className="block__title">
              <span className="block__num">🏆</span> Deine Rekorde
            </h2>
            <div className="recordlist">
              {GRADES.map((entry) => {
                const value = getHighscore(highscores, entry.id);
                return (
                  <span
                    key={entry.id}
                    className={`recordlist__item${
                      entry.id === settings.grade ? ' recordlist__item--active' : ''
                    }`}
                  >
                    {entry.label}: <strong>{value > 0 ? value : '–'}</strong>
                  </span>
                );
              })}
            </div>
          </section>
        )}

        <details className="rules">
          <summary>❓ So funktioniert das Spiel</summary>
          <ul>
            <li>Du bekommst unten im Haus eine Rechenaufgabe.</li>
            <li>Jede richtige Antwort bringt dich ein Stockwerk höher. 🧗</li>
            <li>Die Uhr läuft – komm in der Zeit so hoch wie möglich!</li>
            <li>Am Ende siehst du, wie viele Meter hoch du gekommen bist.</li>
          </ul>
        </details>

        <button
          type="button"
          className="btn btn--primary btn--big btn--start"
          onClick={onStart}
        >
          🚀 Los geht&apos;s!
        </button>
      </div>
    </div>
  );
}
