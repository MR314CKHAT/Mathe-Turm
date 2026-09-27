import { Component, Suspense, lazy } from 'react';
import { themeOf } from '../utils/theme.js';
import { hasWebGL } from '../utils/webgl.js';

/**
 * Kleine 3D-Vorschau der gewählten Welt für den Startscreen:
 * Die Kamera umkreist langsam Turm bzw. Schiff. Lädt denselben
 * Lazy-Chunk wie die Spielwelt. Fällt bei Problemen auf ein Emoji zurück.
 */

const World3D = lazy(() => import('./World3D.jsx'));

class Boundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('3D-Vorschau fehlgeschlagen:', error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function Preview3D({ theme }) {
  const entry = themeOf(theme);
  const emojiFallback = (
    <span className="hero3d__emoji" aria-hidden="true">
      {entry.id === 'pirate' ? '🏴‍☠️' : '🏰'}
    </span>
  );

  return (
    <div className="hero3d" aria-label={`Vorschau: ${entry.name}`}>
      {hasWebGL() ? (
        <Boundary fallback={emojiFallback}>
          <Suspense fallback={emojiFallback}>
            <World3D theme={entry.id} floor={2} mood="cheer" preview />
            <span className="hero3d__tag">
              {entry.emoji} {entry.name}
            </span>
          </Suspense>
        </Boundary>
      ) : (
        emojiFallback
      )}
    </div>
  );
}
