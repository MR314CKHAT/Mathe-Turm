# 🏢 Mathe-Turm

Ein Rechen-Spiel für Kinder (Klasse 1–5): Aufgabe lösen → ein Stockwerk höher →
nächste Aufgabe. Ziel ist es, in der eingestellten Zeit so hoch wie möglich zu kommen.

Die App ist eine **reine statische Website** (React + Vite, kein Server, keine Datenbank)
und läuft damit kostenlos auf GitHub Pages.

---

## 🧑‍💻 Lokal starten

```powershell
cd "c:\Users\leviathan\Desktop\AI B\Apps\mathe-turm"
npm install
npm run dev
```

Danach im Browser öffnen: <http://localhost:5173>

## 📜 Befehle

| Befehl | Was er macht |
| --- | --- |
| `npm run dev` | Entwicklungsserver mit Auto-Reload |
| `npm run build` | Produktions-Build nach `dist/` (inkl. Service Worker) |
| `npm run preview` | Testet den Build lokal unter <http://localhost:4173> |
| `npm run check` | Prüft den Aufgaben-Generator (80.002 Aufgaben) |
| `npm run smoke` | Render-Test aller Bildschirme |
| `npm run icons` | Erzeugt Icons + Teilen-Bild neu (`public/`) |
| `npm run fonts` | Lädt die Schriften lokal herunter (`src/assets/fonts/`) |
| `npm run assets` | `icons` + `fonts` zusammen (selten nötig, Ergebnisse sind eingecheckt) |

---

## 🚀 Online stellen mit GitHub Pages

Der Deploy läuft komplett automatisch über `.github/workflows/deploy.yml`.

**1. Repository anlegen und hochladen**

```powershell
cd "c:\Users\leviathan\Desktop\AI B\Apps\mathe-turm"
git init
git add .
git commit -m "Mathe-Turm"
git branch -M main
git remote add origin https://github.com/DEIN-NAME/DEIN-REPO.git
git push -u origin main
```

**2. In GitHub Pages aktivieren**

Repository → **Settings** → **Pages** → bei *Build and deployment* →
**Source: „GitHub Actions"** auswählen.

**3. Fertig**

Bei jedem `git push` auf `main` läuft automatisch:

```
npm ci  →  npm run check  →  npm run build  →  Upload  →  Deploy
```

Die Adresse ist danach:

```
https://DEIN-NAME.github.io/DEIN-REPO/
```

> Wenn der erste Workflow-Lauf fehlschlägt, weil Pages noch nicht aktiviert war:
> Schritt 2 nachholen und im Tab **Actions** auf *Re-run all jobs* klicken.

### Wie der richtige Pfad entsteht

GitHub Pages liefert im Unterordner `/DEIN-REPO/` aus. Vite braucht dafür den
passenden `base`. Das passiert in `vite.config.js` **automatisch**:

```js
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1]; // in Actions gesetzt
const base = process.env.VITE_BASE ?? (repository ? `/${repository}/` : '/');
```

* In GitHub Actions → `/DEIN-REPO/`
* Lokal, bei Netlify/Vercel oder mit eigener Domain → `/`
* Manuell erzwingen: `VITE_BASE=/ npm run build` (z. B. für eine eigene Domain)

Zusätzlich liegt `public/.nojekyll` im Build, damit GitHub keine Dateien ausfiltert.

### Nach dem ersten Deploy (optional)

In `index.html` die beiden Zeilen

```html
<meta property="og:image" content="og-image.png" />
<meta name="twitter:image" content="og-image.png" />
```

auf die vollständige Adresse setzen, z. B.
`https://DEIN-NAME.github.io/DEIN-REPO/og-image.png` – dann zeigt WhatsApp beim
Teilen eine Vorschaugrafik. (Manche Dienste brauchen absolute Adressen.)

---

## 🎮 Spielablauf

1. **Start:** Klasse, Rechenarten, Zeiten und Modus einstellen → „🚀 Los geht's!"
2. **Spiel:** Aufgabe unten im Haus lösen. Richtig = ein Stockwerk höher (mit
   Sprung-Animation, alle 5 Stockwerke gibt es einen ⭐). Oben laufen zwei Timer
   (Gesamtzeit + Zeit pro Aufgabe), dazu Serie 🔥, richtig ✅ und falsch ❌.
   Mit ⏸️ pausieren, 🔄 Aufgabe überspringen, 🏠 zurück zum Menü.
3. **Ergebnis:** erreichte Stockwerke (1 Stockwerk ≈ 3 Meter), Trefferquote,
   längste Serie, Spielzeit und Rekord.

Je höher man kommt, desto dunkler wird der Himmel – ab Stockwerk 25 steht man
zwischen den Sternen.

## ⚙️ Einstellungen (alles frei wählbar)

| Einstellung | Optionen |
| --- | --- |
| **Klassenstufe** | 1–5 (bestimmt Zahlenraum und Rechenarten) |
| **Rechenarten** | ➕ Plus, ➖ Minus, ✖️ Mal, ➗ Geteilt (mehrere gleichzeitig; Mal/Geteilt ab Klasse 3) |
| **Spielzeit insgesamt** | 3 / 5 / 10 Minuten oder frei 1–60 Minuten |
| **Zeit pro Aufgabe** | AUS / 10 / 20 / 30 Sekunden oder frei 0–300 Sekunden |
| **Modus bei falscher Antwort** | **A) Entspannt** – Aufgabe bleibt, nochmal versuchen<br>**B) Zeitdruck** – sofort neue Aufgabe<br>**C) Abstieg** – neue Aufgabe *und* ein Stockwerk nach unten |
| **Töne** | an / aus (Web Audio, keine Zusatzbibliothek) |

Der Highscore wird pro Klassenstufe im Browser gespeichert (`localStorage`).

## ➗ Rechenarten pro Klassenstufe

| Klasse | Plus / Minus | Mal / Geteilt |
| --- | --- | --- |
| 1 | bis 10 | – |
| 2 | bis 20 und bis 100 | – |
| 3 | bis 100 | kleines Einmaleins (1×1 bis 10×10) |
| 4 | bis 100 / 1.000 | großes Einmaleins (bis 20 × 10) |
| 5 | bis 1.000 / 10.000 | bis 100 × 12, Division mit Quotient bis 50 |

Division geht **immer glatt auf**, Subtraktion wird **nie negativ** – keine
Kommazahlen, keine negativen Ergebnisse.

## 📁 Projektstruktur

```
mathe-turm/
├── index.html                     Meta-Tags, Icons, Vorschau beim Teilen
├── vite.config.js                 base-Pfad (GitHub Pages) + PWA
├── public/                        wird 1:1 mitkopiert
│   ├── favicon.svg                Browser-Icon
│   ├── icon-192.png, icon-512.png App-Icons (PWA)
│   ├── icon-maskable-512.png      Icon für runde/runde Ecken
│   ├── apple-touch-icon.png       Icon für iPhone/iPad
│   ├── og-image.png               Vorschaubild beim Teilen (1200×630)
│   └── .nojekyll                  für GitHub Pages
├── src/
│   ├── App.jsx                    Bildschirm-Wechsel, Einstellungen, Highscore
│   ├── main.jsx                   React-Start
│   ├── fonts.css                  automatisch erzeugte @font-face-Regeln
│   ├── assets/fonts/*.woff2       Schriften lokal (keine Google-Verbindung)
│   ├── styles.css                 komplettes Design (responsive)
│   ├── components/
│   │   ├── StartScreen.jsx        Einstellungen + Rekordliste
│   │   ├── GameScreen.jsx         Timer, Eingabe, Modi, Pause
│   │   ├── Tower.jsx              Hochhaus mit Kamera, Sternen, Wolken
│   │   ├── Keypad.jsx             Zahlen-Tastatur für Tablets
│   │   └── ResultScreen.jsx       Ergebnis + Rekord
│   └── utils/
│       ├── mathTasks.js           Aufgaben-Generator
│       ├── storage.js             Highscore im localStorage
│       └── sound.js               Töne (Web Audio)
├── scripts/
│   ├── check-tasks.mjs            Test für den Generator
│   ├── smoke-entry.jsx            Render-Test aller Bildschirme
│   ├── make-icons.mjs             PNG-Icons selbst erzeugt (ohne Bibliothek)
│   └── fetch-fonts.mjs            Schriften lokal herunterladen
└── .github/workflows/deploy.yml   Automatischer Deploy auf GitHub Pages
```

## ℹ️ Gut zu wissen

* **Offline nutzbar (PWA):** Der Build enthält einen Service Worker. Auf dem
  Tablet/Handy kann die Seite über „Zum Startbildschirm hinzufügen" installiert
  werden und läuft danach auch ohne Internet.
* **Datenschutz:** Es werden **keine** Daten an Dritte gesendet. Schriften liegen
  lokal, es gibt keine Analyse/Tracking. Der Rekord bleibt auf dem Gerät.
* **Icons & Teilen-Bild** werden von `scripts/make-icons.mjs` als PNG erzeugt
  (eigener Mini-PNG-Encoder, nur Node-Bordmittel). Änderungen am Motiv:
  `npm run icons`.
* **Schriften** kommen von `scripts/fetch-fonts.mjs`. Google liefert variable
  Schriften, deshalb werden nur 2 Dateien (~70 KB) gebraucht.
  Fehlt die Datei, greift automatisch die Systemschrift.
* **Keine Online-Bestenliste:** Für ein Klassen-Ranking über mehrere Geräte
  bräuchte es später ein Backend (z. B. Supabase).
