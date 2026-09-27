/**
 * WebGL-Erkennung: Läuft der Browser kein WebGL (alte Kindertablets,
 * deaktivierte GPU), fällt die App automatisch auf die 2D-CSS-Szene zurück.
 *
 * Das Ergebnis wird gecacht, damit nicht bei jedem Render ein Canvas
 * angelegt wird. Serverseitig (Smoke-Test) gilt: kein WebGL.
 */
let cached = null;

export function hasWebGL() {
  if (cached !== null) return cached;
  if (typeof document === 'undefined') {
    // Nicht cachen – im echten Browser soll später echt geprüft werden.
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    cached = Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    );
  } catch {
    cached = false;
  }
  return cached;
}
