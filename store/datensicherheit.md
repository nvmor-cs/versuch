# Datensicherheit – die Antworten für Googles Formular

In der Play Console unter **App-Inhalte → Datensicherheit**. Google prüft
diese Angaben gegen das, was die App tatsächlich tut; falsche Angaben sind ein
Grund für eine Sperrung. Deshalb steht hier nicht „wir erheben nichts",
sondern jede Antwort mit der Stelle im Code, aus der sie folgt.

## Was die App tatsächlich nach draußen schickt

Genau eine Sache: die **Lebensmittelsuche**. Wenn du im Ernährungsteil in das
Suchfeld tippst oder einen Barcode scannst, fragt die App die offene Datenbank
[Open Food Facts](https://world.openfoodfacts.org) (`js/essen.js`,
`einAnfrage`). Übertragen werden dabei:

* der **Suchbegriff** bzw. die **Ziffernfolge des Barcodes**,
* das Sprachkürzel `de` oder `en`,
* technisch bedingt die **IP-Adresse** deines Geräts.

Nicht übertragen wird alles andere: kein Konto (es gibt keins), keine Kennung
des Geräts oder der Installation, nichts aus dem Tagebuch, keine Gewichte,
keine Schritte, kein Training. Es gibt keinen eigenen Server, keine Analyse,
keine Werbung und kein Absturzmelde-System.

Das Kamerabild des Barcode-Scanners wird **im Gerät** ausgewertet und
verlässt es nie – nach draußen geht allenfalls die erkannte Ziffernfolge, und
zwar als dieselbe Suchanfrage wie oben.

---

## Die Antworten, Frage für Frage

### Erhebt oder teilt deine App eine der erforderlichen Nutzerdatentypen?

**Ja.** – Wegen des Suchbegriffs oben. Alles Weitere ergibt sich daraus.

### Datentypen

Nur ein einziger Typ wird angehakt:

| Kategorie | Datentyp | Erhoben | Geteilt |
|---|---|---|---|
| App-Aktivitäten | **In-App-Suchverlauf** | nein | **ja** |

Alle übrigen Kategorien bleiben leer: kein Standort, keine personenbezogenen
Informationen, keine Finanzinformationen, keine Nachrichten, keine Fotos oder
Videos, keine Audiodateien, keine Dateien, kein Kalender, keine Kontakte, kein
Web-Verlauf, keine Geräte- oder anderen IDs, keine Angaben zu Leistung oder
Abstürzen.

> Sollte die Console verlangen, dass für „Geteilt" auch „Erhoben" gesetzt ist,
> setze beides. Der Sachverhalt bleibt derselbe, und die Erklärung darunter
> passt in beiden Fällen.

**Rückfragen zu diesem Datentyp:**

* **Zweck:** nur **App-Funktionalität** (ohne die Anfrage gäbe es keine
  Suchergebnisse). Nicht: Analyse, Werbung, Personalisierung, Betrugsabwehr.
* **Ist die Erhebung erforderlich?** **Nein – Nutzer können auswählen.** Die
  Anfrage entsteht nur, während jemand aktiv sucht. Wer den eigenen Vorrat und
  die 76 Grundnahrungsmittel benutzt oder Lebensmittel selbst anlegt, löst nie
  eine aus.

### Was ausdrücklich *nicht* angehakt wird – und warum

* **Gesundheit und Fitness** (Gewicht, Umfänge, Schritte, Trainings,
  Tagebuch): bleibt vollständig auf dem Gerät (`localStorage`, siehe
  `js/app.js`, `js/essen.js`, `js/gesundheit.js`). Nichts davon wird
  übertragen, also weder erhoben noch geteilt.
* **Fotos und Videos:** Die Kamera läuft nur, solange der Scanner offen ist.
  Das Bild wird im Gerät ausgewertet und nicht gespeichert. Googles Formular
  zählt rein flüchtig verarbeitete Daten nicht als Erhebung.
* **Standort:** Die App fragt keinen Standort ab. Open Food Facts sieht die
  IP-Adresse, wie jeder Server, der eine Anfrage beantwortet – als reine
  Verbindungsinformation ist das nach Googles Vorgaben kein zu meldender
  Datentyp. In der Datenschutzerklärung steht es trotzdem, weil es stimmt.
* **Android-Backup:** Wenn „Auto Backup" auf dem Gerät eingeschaltet ist,
  sichert **Android** den Datenordner in das Google-Konto des Nutzers – nicht
  die App. Das ist Systemverhalten und keine Datenerhebung durch Lumora. Auch
  das steht in der Datenschutzerklärung.

### Sicherheitspraktiken

* **Werden Daten bei der Übertragung verschlüsselt?** **Ja.** Die einzige
  Anfrage geht über HTTPS (`https://de.openfoodfacts.org` bzw.
  `https://world.openfoodfacts.org`), und `allowMixedContent` ist in
  `capacitor.config.json` ausgeschaltet.
* **Können Nutzer die Löschung ihrer Daten anfordern?** **Ja.** In den
  Einstellungen löscht „Alle Daten löschen" alles unwiderruflich, und mit dem
  Deinstallieren verschwindet ohnehin jede Spur. Beim Betreiber liegt nichts,
  was gelöscht werden könnte – es gibt keinen Betreiber-Server.
* **Datenerhebung unabhängig geprüft:** nein (optional, keine Prüfung
  beauftragt).

### Konto löschen

Entfällt: Die App kennt keine Konten und keine Anmeldung. Die Frage nach einer
URL zum Löschen des Kontos taucht deshalb gar nicht erst auf.

---

## Berechtigungen und wofür sie da sind

Nützlich für die Antworten oben und für den Fall, dass Google nachfragt.

| Berechtigung | Wofür | Ohne sie |
|---|---|---|
| `INTERNET` | Lebensmittelsuche bei Open Food Facts | Suche ohne Netz, eigener Vorrat und Grundnahrungsmittel funktionieren weiter |
| `CAMERA` | Barcode-Scanner, Auswertung im Gerät | Ziffernfolge unter dem Strichcode von Hand eintippen |
| `ACTIVITY_RECOGNITION` | Schrittzähler des Geräts auslesen | Schritte von Hand eintragen |
| `POST_NOTIFICATIONS` | stille Anzeige der laufenden Satzpause | Pause läuft nur in der App |
| `VIBRATE` | kurzes Klopfen beim Antippen | kein Tastgefühl |

Dazu zwei `uses-feature`-Einträge mit `required="false"` (Kamera,
Schrittzähler): Die App läuft auch auf Geräten ohne diese Sensoren, und der
Play Store schließt solche Geräte deshalb nicht aus.

## Verwandte Angaben an anderer Stelle

* **Werbung:** Nein – keine Werbebibliothek, keine Werbe-ID.
* **Gesundheits-Apps:** Fitness und Wellness, kein Medizinprodukt. Keine
  Diagnose, keine Behandlung, keine Medikamentenerinnerung, keine Anbindung an
  Health Connect.
* **Zielgruppe:** 18+.
* **Datenschutzerklärung:** `https://nvmor-cs.github.io/versuch/privacy.html`
  (englisch: `…/privacy-en.html`). Die beiden Seiten sagen dasselbe wie
  dieses Dokument, nur in der Sprache der Nutzer.
