# Eisenzeit – Trainingslog 🏋️

Eine Progressive Web App (PWA) fürs Fitnessstudio – inspiriert von Hevy und MacroFactor Training. Komplett offline-fähig, ohne Konto, ohne Server: **Alle Daten bleiben lokal auf deinem Gerät.**

## Features

- **Übungsbibliothek** mit 135 vordefinierten Übungen (nach Muskelgruppe und Gerät filterbar, Suche versteht auch englische Begriffe wie „bench press")
- **Eigene Übungen** anlegen (Gewicht × Wdh., nur Wiederholungen oder Zeit)
- **Trainingspläne** erstellen, bearbeiten und mit einem Tipp starten (3 Beispielpläne sind vorinstalliert: Push / Pull / Beine)
- **Workout-Tracking** wie in Hevy: Sätze abhaken, Gewicht & Wiederholungen eintragen, Werte vom letzten Mal als Vorlage, laufende Dauer und Live-Volumen
- **Pausen-Timer** startet automatisch nach jedem abgehakten Satz (Dauer einstellbar, mit Ton + Vibration)
- **Rekord-Erkennung**: Neue Bestleistungen werden beim Beenden gefeiert
- **Verlauf & Statistik**: Wochenübersicht, Volumen pro Woche als Chart, Entwicklungskurve pro Übung, komplette Historie
- **Workout wiederholen**, minimieren und später fortsetzen (übersteht auch ein versehentliches Schließen der App)
- **Backup**: Export/Import aller Daten als JSON-Datei
- Helles und dunkles Design (folgt der Systemeinstellung)

## Auf dem Handy installieren

Die App muss über **HTTPS** erreichbar sein. Der einfachste Weg: GitHub Pages.

### 1. GitHub Pages aktivieren (einmalig, ~1 Minute)

1. Auf GitHub: **Settings → Pages**
2. Unter „Build and deployment" → Source: **Deploy from a branch**
3. Branch auswählen (z. B. diesen Branch oder `main` nach dem Merge), Ordner `/ (root)`, **Save**
4. Nach 1–2 Minuten ist die App unter `https://<benutzername>.github.io/versuch/` erreichbar

### 2. Auf dem Handy zum Startbildschirm hinzufügen

- **Android (Chrome):** URL öffnen → Menü (⋮) → **„App installieren"** bzw. „Zum Startbildschirm hinzufügen"
- **iPhone (Safari):** URL öffnen → Teilen-Symbol → **„Zum Home-Bildschirm"**

Danach startet Eisenzeit wie eine native App im Vollbild und funktioniert auch offline.

> **Wichtig:** Die Daten liegen im Browser-Speicher des Geräts. Mach gelegentlich ein Backup über *Einstellungen → Daten exportieren* – besonders bevor du Browserdaten löschst.

## Lokal ausprobieren

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Technik

- Vanilla HTML/CSS/JS, keine Abhängigkeiten, kein Build-Schritt
- Datenhaltung in `localStorage` (inkl. laufendem Workout, übersteht Reloads)
- Service Worker cached die App-Shell für den Offline-Betrieb
- Ein-Themen-Farbsystem über CSS-Custom-Properties (hell/dunkel)

| Datei | Inhalt |
|---|---|
| `index.html` | App-Gerüst, PWA-Meta, Service-Worker-Registrierung |
| `css/style.css` | Design-Tokens und alle Komponenten |
| `js/exercises.js` | Übungsbibliothek und Beispielpläne |
| `js/app.js` | App-Logik: Tracking, Pläne, Timer, Charts, Backup |
| `sw.js` | Offline-Cache |
| `manifest.webmanifest` | PWA-Manifest (Installierbarkeit) |
