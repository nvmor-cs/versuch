# Lumora in den Play Store bringen 🚀

Alles, was sich im Repository vorbereiten lässt, ist vorbereitet: Das
Android-Projekt liegt unter `android/`, der Build läuft über GitHub Actions,
und in diesem Ordner liegen die Grafiken und die fertigen Texte für den
Eintrag. Was bleibt, sind Klicks in der Play Console und ein einziger Befehl
auf deinem Rechner.

**Was du brauchst:** ein Google-Play-Console-Konto (einmalig 25 USD), einen
Rechner mit Java (für den Signierschlüssel), 12 Menschen mit Android-Handy für
die Testphase – und Geduld: Zwischen erstem Upload und Veröffentlichung liegen
bei einem neuen Privatkonto mindestens zwei Wochen.

| In diesem Ordner | Wofür |
|---|---|
| `eintrag-de.md` | Store-Texte auf Deutsch, fertig zum Kopieren |
| `eintrag-en.md` | dieselben Texte auf Englisch |
| `datensicherheit.md` | die Antworten für Googles Formular „Datensicherheit" |
| `play-icon-512.png` | App-Symbol 512×512 |
| `play-feature-1024x500.png` | Funktionsgrafik (deutsch) |
| `play-feature-1024x500-en.png` | Funktionsgrafik (englisch) |
| `screenshots/` | acht Telefon-Screenshots 1080×1920 (deutsch) |
| `screenshots-en/` | dieselben acht auf Englisch |

---

## Schritt 0: Zwei Entscheidungen, bevor du etwas hochlädst

**Die Paket-Kennung ist danach für immer festgelegt.** Die App heißt intern
`io.github.nvmorcs.eisenzeit` – ein Name aus der ersten Fassung, als das
Projekt noch „Eisenzeit" hieß. Sichtbar ist er nur in der Adresse des
Store-Eintrags (`play.google.com/store/apps/details?id=…`). Sobald etwas
hochgeladen ist, lässt er sich nie wieder ändern; eine andere Kennung wäre
dann eine andere App.

Willst du ihn ändern (z. B. auf `io.github.nvmorcs.lumora`), dann **jetzt**.
Zu ändern wären `capacitor.config.json`, `android/app/build.gradle`
(`namespace` und `applicationId`) und der Ordner der Java-Dateien unter
`android/app/src/main/java/…`. Achtung: Auf deinem eigenen Handy gilt die App
danach als neue App – vorher in den Einstellungen ein Backup exportieren und
hinterher wieder einlesen, sonst sind die Daten weg.

**Datenschutzerklärung ins Netz stellen.** Google verlangt eine öffentlich
erreichbare URL. Die beiden Seiten liegen fertig im Repository
(`privacy.html`, `privacy-en.html`), aber **GitHub Pages ist derzeit noch
ausgeschaltet** – ohne diesen Schritt geht die URL ins Leere:

1. Auf GitHub: **Settings → Pages**
2. Bei „Build and deployment" → Source: **Deploy from a branch**
3. Branch: `claude/fitness-studio-app-mxrssx` (der Standard-Branch), Ordner:
   `/ (root)` → **Save**
4. Nach ein paar Minuten prüfen, ob
   `https://nvmor-cs.github.io/versuch/privacy.html` erscheint.

## Schritt 1: Play-Console-Konto anlegen (einmalig)

1. https://play.google.com/console – als Entwickler registrieren (25 USD,
   einmalig). Identitätsprüfung einplanen, das dauert manchmal Tage.
2. **Wichtig für Privatkonten:** Vor der ersten Veröffentlichung verlangt
   Google einen **geschlossenen Test mit mindestens 12 Testern, die
   14 Tage lang durchgehend angemeldet sind**. Die genaue Zahl kann sich
   ändern – maßgeblich ist, was die Console dir unter „Testen" anzeigt.
   Sammle die Google-Konto-Adressen deiner Tester am besten schon jetzt.

## Schritt 2: Signierschlüssel erstellen (einmalig, 2 Minuten)

Android-Apps müssen signiert sein. Auf deinem Rechner (Java muss installiert
sein; der Befehl fragt nach einem Passwort und ein paar Angaben):

```bash
keytool -genkeypair -v -keystore lumora-upload.keystore \
  -alias lumora -keyalg RSA -keysize 2048 -validity 10000
```

> ⚠️ **Bewahre `lumora-upload.keystore` und das Passwort sicher auf**
> (Passwort-Manager, zweite Kopie an einem anderen Ort). Ohne sie kannst du
> keine Updates mehr hochladen. Committe sie **niemals** ins Repository –
> `.gitignore` verhindert das bereits für `*.keystore` und `*.jks`.

Danach die Datei als Base64-Text ausgeben:

```bash
# Linux/macOS:
base64 -w0 lumora-upload.keystore
# Windows (PowerShell):
[Convert]::ToBase64String([IO.File]::ReadAllBytes("lumora-upload.keystore"))
```

## Schritt 3: GitHub-Secrets anlegen (einmalig)

Im Repository: **Settings → Secrets and variables → Actions → New repository
secret**. Vier Stück:

| Name | Wert |
|---|---|
| `KEYSTORE_BASE64` | die Base64-Ausgabe aus Schritt 2 |
| `KEYSTORE_PASSWORD` | das Keystore-Passwort |
| `KEY_ALIAS` | `lumora` |
| `KEY_PASSWORD` | das Key-Passwort (meist dasselbe) |

## Schritt 4: App bauen lassen (pro Release, ein Klick)

1. **Actions → „Android Build" → „Run workflow"**.
2. Nach ~5–10 Minuten hängen unter dem Lauf zwei Downloads:
   - **lumora-release** → `app-release.aab` (das lädst du hoch) und
     `app-release.apk` (zum Selberinstallieren)
   - **lumora-debug-apk** → `app-debug.apk`, sofort auf jedem Android-Handy
     installierbar, ganz ohne Store

Ohne die Secrets aus Schritt 3 entsteht nur die Debug-APK; der Lauf meldet das
in der Zusammenfassung.

## Schritt 5: App anlegen und Eintrag füllen

**App erstellen:** Name `Lumora – Training & Gesundheit`, Standardsprache
Deutsch, Typ **App**, **kostenlos**.

**Store-Eintrag:** Die Texte stehen fertig in `eintrag-de.md`. Danach unter
**Store-Eintrag → Sprachen hinzufügen** Englisch (Vereinigtes Königreich oder
USA) ergänzen und mit `eintrag-en.md` füllen – die App ist zweisprachig, der
Eintrag sollte es auch sein.

**Grafiken hochladen:**

| Feld in der Console | Datei |
|---|---|
| App-Symbol | `play-icon-512.png` |
| Funktionsgrafik (Deutsch) | `play-feature-1024x500.png` |
| Funktionsgrafik (Englisch) | `play-feature-1024x500-en.png` |
| Telefon-Screenshots (Deutsch) | alle acht aus `screenshots/` |
| Telefon-Screenshots (Englisch) | alle acht aus `screenshots-en/` |

Die Screenshots sind der Reihe nach nummeriert – so hochgeladen, erzählen sie
die App von der Startseite bis zur Muskelbalance.

**Kategorie:** Gesundheit & Fitness · **Tags:** Fitness, Krafttraining,
Ernährung

## Schritt 6: Pflichtangaben ausfüllen

- **Datenschutzerklärung:** `https://nvmor-cs.github.io/versuch/privacy.html`
  (englischer Eintrag: `…/privacy-en.html`) – setzt Schritt 0 voraus.
- **Datensicherheit:** Frage für Frage in `datensicherheit.md`. Bitte nicht
  raten: Die App schickt bei der Lebensmittelsuche etwas ins Netz, und genau
  das gehört ins Formular.
- **App-Zugriff:** „Alle Funktionen sind ohne besondere Zugangsdaten
  verfügbar" – es gibt kein Konto und keine Anmeldung.
- **Werbung:** Nein, die App enthält keine Werbung.
- **Inhaltseinstufung:** Fragebogen ausfüllen, alles verneinen → Einstufung
  „Alle Altersgruppen" (USK 0).
- **Zielgruppe:** 18+. Das ist die einfachste Wahl und erspart dir die
  Kinderschutz-Richtlinien.
- **Gesundheits-Apps:** Lumora ist eine Fitness- und Wellness-App ohne
  medizinische Funktion. Keine Diagnose, keine Behandlung, keine
  Medikamentenerinnerung, kein Health Connect. Entsprechend verneinen.
- **Regierungs-App / Finanzfunktionen:** Nein.

## Schritt 7: Testen, dann veröffentlichen

1. **Testen → Geschlossener Test → Track erstellen.** `app-release.aab`
   hochladen, Tester-Liste anlegen (die Google-Konto-Adressen aus Schritt 1),
   Release ausrollen. Beim ersten Upload aktiviert Google automatisch **Play
   App Signing**: Google verwahrt den eigentlichen App-Schlüssel, dein
   Keystore ist ab dann nur noch der Upload-Schlüssel.
2. Tester den Beitrittslink schicken. Sie müssen die App installieren und
   über die 14 Tage angemeldet bleiben – wer wieder austritt, zählt nicht.
3. **Produktion → Release erstellen**, dieselbe oder eine neuere AAB
   hochladen, Länder wählen (z. B. Deutschland, Österreich, Schweiz – oder
   gleich weltweit, die App ist zweisprachig), einreichen.
4. Google prüft (meist 1–7 Tage, beim ersten Mal gern länger). Danach ist sie
   live. 💪

## Updates veröffentlichen

1. In `android/app/build.gradle` `versionCode` um 1 erhöhen (Pflicht – Google
   nimmt keine zweite AAB mit derselben Zahl) und `versionName` anpassen.
   Dieselbe Zahl auch in `js/app.js` (`APP_VERSION`) und den Cache-Namen in
   `sw.js` hochsetzen, damit die Web-Fassung nicht am alten Stand klebt.
2. Workflow laufen lassen, neue AAB herunterladen.
3. In der Console unter **Produktion → Neues Release**. Die
   „Neu in dieser Version"-Notiz steht in `eintrag-de.md` / `eintrag-en.md`.

## Screenshots neu erzeugen

Ändert sich die Oberfläche, sind die Bilder veraltet. Sie entstehen aus der
laufenden App – ein Befehl genügt:

```bash
npm i --no-save playwright     # einmalig, liegt bewusst nicht in package.json
npm run screenshots            # füllt screenshots/ und screenshots-en/ neu
```

Die Grafiken (Symbol, Funktionsgrafik, Launcher-Icons, Splash) kommen aus
`python3 scripts/make-icons.py`.

---

## Sofort aufs eigene Handy (ohne Play Store)

Du willst nicht auf Google warten? Workflow laufen lassen (geht auch **ohne**
Signier-Secrets), `lumora-debug-apk` herunterladen, die Datei aufs Handy
schicken und antippen. Android fragt einmal nach der Erlaubnis, Apps aus
dieser Quelle zu installieren – bestätigen, fertig. Die App läuft dann als
vollwertige, eigenständige Android-App.
