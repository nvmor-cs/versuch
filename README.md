# lumora – Training, Fortschritt, Gesundheit

Eine Progressive Web App (PWA) fürs Fitnessstudio – inspiriert von Hevy und MacroFactor Training. Komplett offline-fähig, ohne Konto, ohne Server: **Alle Daten bleiben lokal auf deinem Gerät.**

Die Marke ist eine dreiblättrige Blüte – abstrakt für Wachstum und Vitalität, bewusst ohne Hantel-Motiv. Alle Grafiken (App-Icons, Launcher, Splash, Store-Assets) entstehen aus derselben Formdefinition per `python3 scripts/make-icons.py`.

## Features

- **Übungsbibliothek** mit 135 vordefinierten Übungen, jede mit einem Piktogramm ihrer Muskelgruppe (nach Muskelgruppe und Gerät filterbar, Suche versteht auch englische Begriffe wie „bench press")
- **Eigene Übungen** anlegen (Gewicht × Wdh., nur Wiederholungen oder Zeit)
- **Trainingspläne mit mehreren Trainings**: Ein Plan bündelt z. B. Push, Pull und Beine als einzelne Trainings, jedes mit einem Tipp startbar; der Start-Tab zeigt nur den aktiven Plan (ein Beispielplan „Push / Pull / Beine" ist vorinstalliert)
- **Supersätze**: Übungen im Trainings-Editor oder direkt im Workout zu einer Gruppe verbinden (A1, A2 …). Im Supersatz läuft nach dem Satz kein Pausen-Timer – die App weist auf die nächste Übung der Runde hin und pausiert erst, wenn die Runde durch ist
- **Reihenfolge per Ziehen**: Übungen und Trainings am Griff greifen und frei verschieben (Finger wie Maus), mit Einfügemarke und Mitscrollen am Rand
- **Workout-Tracking** Satz für Satz: Der aktuelle Satz ist eine Karte mit großen Plus/Minus-Steppern (Gewicht ±2,5 kg, Wiederholungen ±1), vorbelegt mit den Werten vom letzten Mal – abschließen, fertig. Abgeschlossene Sätze lassen sich antippen und zurückholen; dazu laufende Dauer und Live-Volumen
- **Pausen-Timer** startet automatisch nach jedem abgehakten Satz (Dauer einstellbar). Am Ende gibt es Ton, Vibration oder beides – und eine Systemmeldung, sodass das Signal auch ankommt, wenn das Handy in der Tasche steckt
- **Rekord-Erkennung**: Neue Bestleistungen werden beim Beenden gefeiert
- **Verlauf & Statistik** mit umschaltbarer Sicht: Woche, Quartal, Jahr und Gesamt – Kennzahlen, Volumen-Chart (Tage/Wochen/Monate/Jahre) und Workout-Liste passen sich an; dazu Entwicklungskurve pro Übung. Zwischen den Zeiträumen wechselt man per Tipp auf die Leiste **oder mit einem waagerechten Wisch**; senkrecht wird wie gewohnt gescrollt
- **Workout wiederholen**, minimieren und später fortsetzen (übersteht auch ein versehentliches Schließen der App)
- **Datensicherung**: Backup als Datei teilen (Google Drive, Dateien, Mail) und jederzeit wiederherstellen – wahlweise **ersetzen** oder **zusammenführen**, sodass nichts verloren geht. Dazu sichert Android die App automatisch im Google-Konto (Auto Backup), und die App erinnert ans Sichern, wenn das letzte Backup zu lange her ist.
- **Bildschirm bleibt an**, solange die App im Vordergrund liegt – mitten im Satz muss niemand erst entsperren. Geht die App in den Hintergrund, gilt wieder der normale Sperr-Timeout des Handys
- **Android-Zurücktaste** navigiert innerhalb der App: erst Dialoge, dann Vollbild-Ansichten, dann zurück zum Start-Tab – die App schließt sich erst beim zweiten Zurück
- **Updates ohne Datenverlust**: Die App wird mit einem festen Schlüssel signiert, neue Versionen installieren sich einfach über die alte
- **Dunkles Design**: tiefes Nachtblau als Grund (`#111827`), Karten eine Stufe heller (`#1F2937`), dazu **eine** Akzentfarbe, die du in den Einstellungen wählst: Blau, Grün, Bernstein, Rot, Magenta oder Weiß. Erledigte Sätze sind grün, Rekorde bernsteinfarben, Löschen rot – Farbe hat immer eine Bedeutung

## Android-App & Play Store 🤖

Die App ist als natives Android-Projekt (Capacitor) vorbereitet:

- **`android/`** – das komplette Android-Studio-Projekt (App-ID `io.github.nvmorcs.eisenzeit` – bleibt bewusst unverändert, denn an ihr hängt die installierte App samt Daten)
- **GitHub Actions → „Android Build"** – baut per Klick eine installierbare `app-debug.apk` und (mit Signier-Secrets) die signierte `app-release.aab` für den Play Store
- **`store/`** – Schritt-für-Schritt-Anleitung ([PLAY_STORE.md](store/PLAY_STORE.md)), App-Icon 512×512, Funktionsgrafik 1024×500 und fertige Screenshots (1080×1920)
- **`privacy.html`** – Datenschutzerklärung (über GitHub Pages als Pflicht-URL für den Store nutzbar)

Lokal bauen (Node + Android SDK nötig): `npm ci && npm run android:debug`

## Als PWA auf dem Handy installieren

Die App muss über **HTTPS** erreichbar sein. Der einfachste Weg: GitHub Pages.

### 1. GitHub Pages aktivieren (einmalig, ~1 Minute)

1. Auf GitHub: **Settings → Pages**
2. Unter „Build and deployment" → Source: **Deploy from a branch**
3. Branch auswählen (z. B. diesen Branch oder `main` nach dem Merge), Ordner `/ (root)`, **Save**
4. Nach 1–2 Minuten ist die App unter `https://<benutzername>.github.io/versuch/` erreichbar

### 2. Auf dem Handy zum Startbildschirm hinzufügen

- **Android (Chrome):** URL öffnen → Menü (⋮) → **„App installieren"** bzw. „Zum Startbildschirm hinzufügen"
- **iPhone (Safari):** URL öffnen → Teilen-Symbol → **„Zum Home-Bildschirm"**

Danach startet lumora wie eine native App im Vollbild und funktioniert auch offline.

> **Wichtig:** Die Daten liegen lokal auf dem Gerät. Mach gelegentlich ein Backup über *Einstellungen → Backup erstellen* – besonders bevor du Browserdaten löschst.

## Lokal ausprobieren

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Technik

- Vanilla HTML/CSS/JS, keine Abhängigkeiten, kein Build-Schritt
- Datenhaltung in `localStorage` (inkl. laufendem Workout, übersteht Reloads)
- Service Worker cached die App-Shell für den Offline-Betrieb
- Farbsystem über CSS-Custom-Properties; die Akzentfarbe hängt an einem `data-accent`-Attribut am Wurzelelement
- Alle Grafiken werden aus `scripts/make-icons.py` generiert (Pillow), die Marke steckt zusätzlich als SVG-Pfad in `js/app.js`

| Datei | Inhalt |
|---|---|
| `index.html` | App-Gerüst, PWA-Meta, Service-Worker-Registrierung |
| `css/style.css` | Design-Tokens und alle Komponenten |
| `js/exercises.js` | Übungsbibliothek und Beispielpläne |
| `js/app.js` | App-Logik: Tracking, Pläne, Timer, Charts, Backup, Wortmarke |
| `scripts/make-icons.py` | Erzeugt Icons, Launcher-Grafiken, Splash und Store-Assets |
| `sw.js` | Offline-Cache |
| `manifest.webmanifest` | PWA-Manifest (Installierbarkeit) |
