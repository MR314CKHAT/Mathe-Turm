import { Component } from 'react';

/**
 * Fängt Laufzeitfehler der App ab. Statt eines weißen Bildschirms
 * sieht das Kind dann eine freundliche Karte mit "Neu laden"-Knopf.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: (error && error.message) || '' };
  }

  componentDidCatch(error, info) {
    console.error('App-Fehler:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app">
          <div className="crashbox" role="alert">
            <span className="crashbox__emoji" aria-hidden="true">
              🙈
            </span>
            <h1 className="crashbox__title">Ups, da ist etwas schiefgegangen!</h1>
            <p className="crashbox__text">
              Der Turm hat kurz gebebt. Tippe auf <strong>Neu laden</strong> und versuch es
              nochmal – deine Einstellungen und Rekorde bleiben erhalten.
            </p>
            <button
              type="button"
              className="btn btn--primary btn--big"
              onClick={() => window.location.reload()}
            >
              🔄 Neu laden
            </button>
            {this.state.message && <pre className="crashbox__detail">{this.state.message}</pre>}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
