/**
 * Kleine Sound-Effekte ohne externe Bibliothek (Web Audio API).
 * Alle Funktionen sind "weich" – Fehler werden ignoriert, damit das Spiel
 * auch ohne Audio-Unterstützung läuft.
 */

let audioContext = null;

function getContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioContext) {
    try {
      audioContext = new AudioCtx();
    } catch (error) {
      return null;
    }
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

function tone({ freq, duration = 0.15, delay = 0, type = 'sine', volume = 0.16 }) {
  const ctx = getContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + delay;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  } catch (error) {
    /* Ton konnte nicht gespielt werden – egal. */
  }
}

export function playCorrect() {
  tone({ freq: 659, duration: 0.12 });
  tone({ freq: 880, duration: 0.18, delay: 0.1 });
}

export function playWrong() {
  tone({ freq: 220, duration: 0.22, type: 'triangle', volume: 0.12 });
  tone({ freq: 160, duration: 0.24, delay: 0.14, type: 'triangle', volume: 0.12 });
}

export function playFinish() {
  tone({ freq: 523, duration: 0.16 });
  tone({ freq: 659, duration: 0.16, delay: 0.16 });
  tone({ freq: 784, duration: 0.16, delay: 0.32 });
  tone({ freq: 1046, duration: 0.3, delay: 0.48 });
}
