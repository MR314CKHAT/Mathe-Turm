import { Component, Suspense, lazy } from 'react';
import Tower from '../components/Tower.jsx';
import { themeOf } from '../utils/theme.js';
import { hasWebGL } from '../utils/webgl.js';

/**
 * Einstieg in die 3D-Welt mit dreifacher Absicherung:
 *  1. Kein WebGL?            → 2D-CSS-Turm
 *  2. 3D-Chunk lädt noch?    → 2D-CSS-Turm (Suspense)
 *  3. Fehler im 3D-Render?   → 2D-CSS-Turm (ErrorBoundary)
 * Ein weißer Bildschirm ist damit ausgeschlossen.
 */

const World3D = lazy(() => import('./World3D.jsx'));

class Boundary3D extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('3D-Welt abgestürzt, wechsle auf 2D:', error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function Tower3D(props) {
  const fallback = <Tower {...props} />;
  if (!hasWebGL()) return fallback;

  const theme = themeOf(props.theme);

  return (
    <div className="stage3d" aria-label={`Du bist im ${props.floor}. Stockwerk`}>
      <Boundary3D fallback={fallback}>
        <Suspense fallback={fallback}>
          <World3D {...props} />
          <div className="stage3d__badge" aria-hidden="true">
            <b>{props.floor}</b>
            <span>{theme.id === 'pirate' ? 'Plattform' : 'Stockwerk'}</span>
          </div>
        </Suspense>
      </Boundary3D>
    </div>
  );
}
