# Eisenzeit im Play Store veröffentlichen 🚀

Alles ist vorbereitet: Das Android-Projekt (Capacitor) liegt unter `android/`, der Build läuft automatisch über GitHub Actions, und in diesem Ordner findest du alle Grafiken und Texte für den Store-Eintrag. Du musst nur noch die Schritte unten abarbeiten.

**Was du brauchst:** ein Google-Play-Console-Konto (einmalig 25 USD), einen Rechner mit Java (für einen einzigen Befehl) und ca. 1–2 Stunden. Google prüft neue Apps danach einige Tage.

---

## Schritt 1: Play-Console-Konto anlegen (einmalig)

1. Gehe auf https://play.google.com/console und registriere dich als Entwickler (einmalig 25 USD).
2. **Wichtig seit 2023:** Für persönliche Konten verlangt Google vor der ersten Veröffentlichung einen **geschlossenen Test mit mindestens 12 Testern über 14 Tage**. Plane das ein – Freunde/Familie mit Android-Handys reichen.

## Schritt 2: Signierschlüssel erstellen (einmalig, 2 Minuten)

Android-Apps müssen signiert sein. Führe auf deinem Rechner aus (Java muss installiert sein; der Befehl fragt ein Passwort und ein paar Angaben ab):

```bash
keytool -genkeypair -v -keystore eisenzeit-upload.keystore \
  -alias eisenzeit -keyalg RSA -keysize 2048 -validity 10000
```

> ⚠️ **Bewahre die Datei `eisenzeit-upload.keystore` und das Passwort sicher auf** (z. B. Passwort-Manager). Committe sie NIEMALS ins Repository.

Dann die Datei als Base64-Text kodieren:

```bash
# Linux/macOS:
base64 -w0 eisenzeit-upload.keystore
# Windows (PowerShell):
[Convert]::ToBase64String([IO.File]::ReadAllBytes("eisenzeit-upload.keystore"))
```

## Schritt 3: GitHub-Secrets anlegen (einmalig)

Im Repository auf GitHub: **Settings → Secrets and variables → Actions → New repository secret**. Lege vier Secrets an:

| Name | Wert |
|---|---|
| `KEYSTORE_BASE64` | die Base64-Ausgabe aus Schritt 2 |
| `KEYSTORE_PASSWORD` | das Keystore-Passwort |
| `KEY_ALIAS` | `eisenzeit` |
| `KEY_PASSWORD` | das Key-Passwort (meist identisch mit dem Keystore-Passwort) |

## Schritt 4: App bauen lassen (pro Release, 1 Klick)

1. Auf GitHub: **Actions → „Android Build" → „Run workflow"** (Branch auswählen).
2. Nach ~5–10 Minuten liegen unter dem Lauf zwei Downloads („Artifacts"):
   - **eisenzeit-release** → enthält `app-release.aab` (für den Play Store) und `app-release.apk`
   - **eisenzeit-debug-apk** → `app-debug.apk`, die du sofort per Datei auf jedem Android-Handy installieren kannst („Unbekannte Quellen" erlauben) – perfekt zum Testen, ganz ohne Store

## Schritt 5: App in der Play Console anlegen

**App erstellen:** Name `Eisenzeit – Trainingslog`, Standardsprache Deutsch, Typ **App**, **kostenlos**.

**Store-Eintrag** (Texte fertig zum Kopieren):

- **App-Name (max. 30):** `Eisenzeit – Trainingslog`
- **Kurzbeschreibung (max. 80):**
  `Workouts tracken: Pläne, Sätze, Gewichte, Rekorde. Offline & ohne Konto.`
- **Vollständige Beschreibung:**

```
Eisenzeit ist dein Trainingslogbuch fürs Fitnessstudio – schnörkellos, dunkel, aufs Wesentliche reduziert.

TRACKE DEINE WORKOUTS
• Satz für Satz: Gewicht und Wiederholungen mit großen Plus/Minus-Tasten einstellen und abschließen
• Werte vom letzten Training sind automatisch vorbelegt
• Pausen-Timer startet nach jedem Satz (Dauer einstellbar)
• Laufende Dauer und Trainingsvolumen live im Blick

DEINE PLÄNE, DEINE ÜBUNGEN
• Über 135 Übungen, nach Muskelgruppe und Gerät filterbar
• Eigene Übungen anlegen (Gewicht × Wdh., nur Wdh. oder Zeit)
• Trainingspläne mit mehreren Trainings – z. B. Push / Pull / Beine
• Der Startbildschirm zeigt immer deinen aktiven Plan

SIEH DEINEN FORTSCHRITT
• Neue Bestleistungen werden automatisch erkannt und gefeiert
• Volumen-Statistik für Woche, Quartal, Jahr und Gesamt
• Entwicklungskurve für jede Übung
• Komplette Trainingshistorie, Workouts mit einem Tipp wiederholen

DEINE DATEN GEHÖREN DIR
• Kein Konto, keine Anmeldung, keine Werbung
• Alles wird nur lokal auf deinem Gerät gespeichert
• Backup als Datei exportieren und importieren
• 100 % offline nutzbar
```

**Grafiken** (liegen in diesem Ordner):
- App-Symbol 512×512: `store/play-icon-512.png`
- Funktionsgrafik 1024×500: `store/play-feature-1024x500.png`
- Telefon-Screenshots (mind. 2): `store/screenshots/*.png` (1080×1920, fertig)

**Kategorie:** Gesundheit & Fitness · **Tags:** Fitness, Krafttraining

## Schritt 6: Pflichtangaben ausfüllen

- **Datenschutzerklärung (URL):** Aktiviere GitHub Pages (Settings → Pages → Branch wählen), dann ist sie erreichbar unter
  `https://nvmor-cs.github.io/versuch/privacy.html` – diese URL einfügen.
- **Datensicherheit:** „Es werden **keine Nutzerdaten erhoben** und **keine Daten weitergegeben**" – alles wird nur lokal gespeichert. (Alle Fragen entsprechend mit Nein beantworten.)
- **Inhaltseinstufung:** Fragebogen ausfüllen – keine bedenklichen Inhalte → Einstufung „Alle Altersgruppen".
- **Zielgruppe:** 18+ (einfachste Wahl, keine Kinder-Richtlinien nötig).
- **Werbung:** Nein, die App enthält keine Werbung.

## Schritt 7: Release hochladen

1. **Testen → Geschlossener Test → Track erstellen**, `app-release.aab` hochladen, Tester-E-Mail-Liste anlegen (mind. 12 Tester, 14 Tage – Pflicht bei neuen Privatkonten).
2. Beim ersten Upload aktiviert Google automatisch **Play App Signing** (Google verwahrt den App-Signaturschlüssel; deine Keystore-Datei ist der Upload-Schlüssel).
3. Nach der Testphase: **Produktion → Release erstellen**, dieselbe oder eine neue AAB hochladen, Länder auswählen (z. B. Deutschland, Österreich, Schweiz), einreichen.
4. Google prüft die App (meist 1–7 Tage) – danach ist sie live. 💪

## Updates veröffentlichen

1. `versionCode` (+1) und `versionName` in `android/app/build.gradle` erhöhen (z. B. `versionCode 2`, `versionName "1.1.0"`).
2. Actions-Workflow laufen lassen, neue AAB herunterladen.
3. In der Play Console unter Produktion als neues Release hochladen.

---

## Sofort aufs eigene Handy (ohne Play Store)

Du willst nicht auf Google warten? Lass den Workflow laufen (geht auch **ohne** Signier-Secrets), lade `eisenzeit-debug-apk` herunter, schick die Datei an dein Handy (z. B. per Downloads/USB) und tippe sie an. Android fragt einmal nach der Erlaubnis, Apps aus dieser Quelle zu installieren – bestätigen, fertig. Die App läuft dann als vollwertige, eigenständige Android-App.
