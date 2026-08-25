# Lumora – Training, Ernährung, Gesundheit

Eine Progressive Web App (PWA) fürs Fitnessstudio und für den Küchentisch – inspiriert von Hevy und MacroFactor. Komplett offline-fähig, ohne Konto, ohne Server: **Alle Daten bleiben lokal auf deinem Gerät.**

Die App hat **zwei Welten**: Training und Ernährung. Sie haben nichts miteinander zu tun, teilen keine Daten und liegen sogar in getrennten Speichern – geteilt werden nur das Aussehen und die Tab-Leiste. **Über die Leiste unten wischt man von der einen in die andere**; die zwei Punkte darüber zeigen, wo man ist, und sind selbst antippbar. Drei Sekunden nach einem Wechsel blenden sie sich aus, damit die Pille so klein bleibt wie möglich.

Die Marke ist eine dreiblättrige Blüte – abstrakt für Wachstum und Vitalität, bewusst ohne Hantel-Motiv. Alle Grafiken (App-Icons, Launcher, Splash, Store-Assets) entstehen aus derselben Formdefinition per `python3 scripts/make-icons.py`.

## Einstieg 🚀

- **Einführung beim ersten Start**: sechs Seiten, die erklären, was die App kann und wie man sie bedient – die drei Welten und das Wischen über die Pille, Training, Ernährung, Gesundheit, Datensicherung. Überspringen geht jederzeit, wischen und Punkte antippen auch, und über die Einstellungen kommt sie zurück
- **Trainingsplan vom Coach**: Am Ende der Einführung – oder jederzeit aus den Einstellungen – stellt der Coach sechs Fragen (Ziel, Erfahrung, Tage pro Woche, Ort, Zeit je Einheit, Rücksichten) und baut daraus einen Basisplan. Wer neu ist, steht sonst vor einer leeren App und soll sich aus 150 Übungen selbst etwas zusammenstellen; das ist die Stelle, an der die meisten aufgeben
  - Der **Split** hängt an den Tagen und der Erfahrung: 2 Tage → Ganzkörper A/B, 3 Tage → Ganzkörper A/B/C für Anfänger, sonst Push/Pull/Beine, 4 Tage → Oberkörper/Beine je zweimal, 5 Tage → Push/Pull/Beine plus Oberkörper/Beine. **Ohne Geräte** wird immer Ganzkörper oder Oberkörper/Beine gewählt – ein Push-Tag käme mit dem eigenen Körper auf drei Übungen
  - Die **Übungszahl** folgt der Zeit (30/45/60/75+ Min. → 4/5/6/7), die **Sätze** dem Ziel und der Erfahrung, die **Pausendauer** ebenfalls dem Ziel (Kraft 3:00, Muskelaufbau 1:30, Abnehmen 1:00). Je Muskelgruppe gibt es eine Reihenfolge von grundlegend nach ergänzend – so stehen die großen Übungen vorn
  - **Ort und Rücksichten filtern**: Zu Hause fallen Maschinen und Kabelzüge weg, bei „nur Körpergewicht" alles außer dem eigenen Körper. Rücken, Knie oder Schulter angegeben, lässt der Plan die Übungen weg, die dort erfahrungsgemäß als Erste Ärger machen. Beim Ziel „Abnehmen" hängt am Ende jeder Einheit ein Cardio-Stück
  - Der Plan ist ein **normaler Plan**: er wird der aktive, das Wochenziel im Kalender folgt den gewählten Tagen, und danach lässt sich alles umbauen wie bei jedem anderen Plan
- **Zum Ausprobieren ohne Installation**: `npm run demo` baut die ganze App in eine einzige HTML-Datei (`demo/lumora-demo.html`). Der Speicher liegt dort im Arbeitsspeicher, jeder Neuladen fängt bei null an – ideal, um Einführung und Coach mehrmals durchzuspielen

## Training 🏋️

- **Übungsbibliothek** mit 151 vordefinierten Übungen (nach Muskelgruppe und Gerät filterbar, Suche versteht auch englische Begriffe wie „bench press")
- **Mitarbeitende Muskeln**: Jede Übung hat eine Hauptmuskelgruppe – die, unter der sie im Filter steht – und dazu die Muskeln, die nennenswert mitarbeiten. Bei Dips also Brust, dazu Trizeps und Schultern; bei Klimmzügen Rücken, dazu Bizeps und Unterarme. Sie stehen im Übungs-Detail unter „Arbeitet mit" (`SEKUNDAER` in `js/exercises.js`). Bewusst kurz gehalten: aufgeführt ist, was man am nächsten Tag spürt, nicht jeder Muskel, der irgendetwas stabilisiert. Bei reinen Isolationsübungen wie Beinstrecker steht dort nichts
- **Muskel-Piktogramme**: Jede Übung zeigt eine anatomische Strichzeichnung, auf der genau der trainierte Muskel in der **gewählten Akzentfarbe** leuchtet. Jede Gruppe zoomt dabei auf ihre Körperregion – bei Brust auf den Brustkorb, bei Waden auf die Unterschenkel. Die Flächen sind nicht gezeichnet, sondern aus der Vorlage ausgefüllt (`scripts/make-muscle-paths.py`), sitzen also exakt auf den Linien
- **16 Muskelgruppen**: Die Beine sind aufgeteilt in Quadrizeps (vordere Oberschenkel), Beinbeuger (hintere Oberschenkel), Po, Adduktoren, Abduktoren und Waden – jede mit eigenen Übungen
- **Wischen zum Blättern**: Durch die Muskelgruppen – im Übungen-Tab wie beim Zusammenstellen eines Trainings – und im Verlauf durch die Zeiträume. Die Leiste oben bleibt Anzeige und Sprungziel, der aktive Chip rückt beim Wischen automatisch in die Mitte
- **Eigene Übungen** anlegen (Gewicht × Wdh., nur Wiederholungen oder Zeit)
- **Trainingspläne mit mehreren Trainings**: Ein Plan bündelt z. B. Push, Pull und Beine als einzelne Trainings. Gestartet wird im Start-Tab (dort steht der aktive Plan), in der Plan-Ansicht geht es ums Bearbeiten: **„Training hinzufügen"** direkt an der Liste, Plan-Name oben überschreibbar, „Plan löschen" unten. Ein Beispielplan „Push / Pull / Beine" ist vorinstalliert
- **Supersätze**: Übungen im Trainings-Editor oder direkt im Workout zu einer Gruppe verbinden (A1, A2 …). Im Supersatz läuft nach dem Satz kein Pausen-Timer – die App weist auf die nächste Übung der Runde hin und pausiert erst, wenn die Runde durch ist
- **Reihenfolge per Ziehen**: Übungen und Trainings am Griff greifen und frei verschieben (Finger wie Maus), mit Einfügemarke und Mitscrollen am Rand
- **Workout-Tracking** Satz für Satz: **Höchstens eine Übung ist aufgeklappt**, die übrigen stehen als Zeile mit Fortschritt darunter – ein Tipp holt sie nach vorn, ein Tipp auf die offene klappt auch sie zu. Alles zugeklappt ist die ganze Reihenfolge auf einen Blick da und lässt sich bequem umstellen, ohne vorher irgendwo Sätze eintragen zu müssen. Der aktuelle Satz ist eine Karte mit großen Plus/Minus-Steppern (Gewicht ±2,5 kg, Wiederholungen ±1), vorbelegt mit den Werten vom letzten Mal; bei einer Übung ohne Historie startet alles bei 0, damit nichts Erfundenes im Log landet. Abgeschlossene Sätze lassen sich antippen und zurückholen; dazu laufende Dauer und Live-Volumen. **Die noch geplanten Sätze zeigen schon, womit zu rechnen ist** – dieselbe Vorhersage, mit der die Karte sie später vorbelegt
- **Reihenfolge im laufenden Workout ändern**: Übungen am Griff greifen und verschieben – das gilt nur für dieses eine Training, der Plan bleibt, wie er ist
- **Pausen-Timer** startet automatisch nach jedem abgehakten Satz (Dauer einstellbar). Die Pause hat **einen Besitzer**: die native Seite. Die Weboberfläche hält nur den Balken auf dem Bildschirm und schickt hinüber, wie der Zustand gerade *insgesamt* aussieht – nicht mehr „plane", „sag ab", „plane neu". Jede Nachricht trägt eine laufende Nummer, ältere werden verworfen, und jede Pause hat eine Kennung: Dieselbe Kennung schreibt nur die Anzeige neu, der einmal gesetzte Zielzeitpunkt verrutscht nie. **Ton und Vibration am Pausenende gibt es bewusst nicht**: Drei Anläufe lang war das Signal nicht verlässlich – mal kam es zu früh, mal gar nicht –, weil zu viele Stellen mitspielen mussten, die Android jederzeit einzeln stillegen darf. Was man nicht verlässlich hört, taugt nicht als Signal. Geblieben ist der stille Countdown, der immer stimmt
- **Geräte je Training**: An Kabelzügen und Maschinen sagt die Zahl am Stapel nur zusammen mit *diesem* Gerät etwas – 30 kg am Kabelzug im einen Studio sind nicht die 30 kg im anderen. Solche Übungen vergleicht die App deshalb nur innerhalb desselben Trainings: Was im Training „Oberkörper Meridian" stand, taucht auch nur dort wieder auf. Freie Gewichte wiegen überall gleich und laufen weiter über die gesamte Historie. Abschaltbar in den Einstellungen
- **Workout in der Benachrichtigungsleiste**: Solange ein Workout läuft, steht dort eine Meldung mit Name, Sätzen und mitlaufender Dauer – ein Tipp bringt zurück in die App. Während der Satzpause wechselt dieselbe Meldung auf Übung, Satz und **rückwärts laufende Restzeit**. Die Zeit zählt Android selbst, die App muss dafür nicht wach bleiben
- **Rekord-Erkennung**: Neue Bestleistungen werden beim Beenden gefeiert
- **Coach** (abschaltbar in den Einstellungen): kurze Rückmeldung nach dem Workout aus der eigenen Historie – Steigerungen, Rückgänge, Stillstand über mehrere Einheiten („Bist du da wirklich ans Limit gegangen?"). Regelbasiert, ohne Netz und ohne Server
- **Änderungen im Workout dauerhaft übernehmen**: Hast du im laufenden Workout Übungen ergänzt, entfernt oder umsortiert, fragt die App beim Beenden, ob das Training künftig so aussehen soll – oder ob es nur für diesmal galt
- **Verlauf & Statistik** mit umschaltbarer Sicht: Woche, Quartal, Jahr und Gesamt – Kennzahlen, Volumen-Chart (Tage/Wochen/Monate/Jahre) und Workout-Liste passen sich an
- **Übungen im Blick**: Bis zu fünf Übungen auswählen (etwa Kniebeugen), deren Entwicklungskurve dauerhaft im Verlauf-Tab steht. Diese Kurven zeigen bewusst **alle** Workouts statt des gewählten Zeitraums – bei „Woche" wären es ein bis zwei Punkte, und die Frage ist ja, ob es über Monate aufwärtsgeht
- **Startseite zum Zuklappen**: „Aktueller Plan" und „Zuletzt trainiert" lassen sich am Kopf zuklappen. Zugeklappt bleibt eine Kurzzeile stehen (Plan-Name bzw. Datum des letzten Workouts), damit nichts blind verschwindet. Der Zustand liegt in den Einstellungen und übersteht damit auch einen Neustart der App
- **Workout wiederholen**, minimieren und später fortsetzen (übersteht auch ein versehentliches Schließen der App)
- **Datensicherung**: Backup als Datei teilen (Google Drive, Dateien, Mail) und jederzeit wiederherstellen – wahlweise **ersetzen** oder **zusammenführen**, sodass nichts verloren geht. Dazu sichert Android die App automatisch im Google-Konto (Auto Backup), und die App erinnert ans Sichern, wenn das letzte Backup zu lange her ist.
- **Bildschirm bleibt an**, solange die App im Vordergrund liegt – mitten im Satz muss niemand erst entsperren. Geht die App in den Hintergrund, gilt wieder der normale Sperr-Timeout des Handys
- **Android-Zurücktaste** navigiert innerhalb der App: erst Dialoge, dann Vollbild-Ansichten, dann aus der Ernährung zurück ins Training, dann zum Start-Tab – die App schließt sich erst beim zweiten Zurück
- **Updates ohne Datenverlust**: Die App wird mit einem festen Schlüssel signiert, neue Versionen installieren sich einfach über die alte
- **Schwebende Tab-Leiste** am unteren Rand: eine abgesetzte Pille, der aktive Reiter sitzt in seiner eigenen Fassung. **Wischen über der Pille wechselt zwischen Training, Ernährung und Gesundheit** – und zwar im Kreis: Hinter der letzten Welt kommt wieder die erste, in beide Richtungen. Bei zwei Welten war ein Anschlag noch plausibel, bei dreien nicht mehr. Die drei Punkte darüber zeigen die Welt an und sind auch antippbar. Beim Wechsel gibt es einen kurzen haptischen Stups, beim abgeschlossenen Satz einen kräftigeren – bewusst nur an diesen beiden Stellen, damit sie etwas bedeuten. Gestartet wird immer im Training: Dort liegt die Leiste für ein laufendes Workout, und dorthin führt auch die Zurücktaste
- **Deutsch und Englisch**: umschaltbar in den Einstellungen, ohne Neustart – die ganze Oberfläche wechselt sofort, samt Übungsnamen, Muskelgruppen, Geräten, Lebensmitteln des Grundvorrats, Datums- und Zahlenformat. Übersetzt wird über die Kennung, nicht über den Text: Was du selbst benannt hast – deine Pläne, Trainings, eigenen Übungen und Lebensmittel – bleibt so stehen, wie du es geschrieben hast. Voreingestellt ist **die Sprache des Geräts**: Ein englisches Handy zeigt die App auf Englisch, alles andere ebenfalls (Englisch versteht, wer kein Deutsch kann). Wer sich einmal ausdrücklich für eine Sprache entscheidet, behält sie – auch wenn das Gerät später umgestellt wird
- **Dunkles Design**: tiefes Nachtblau als Grund (`#111827`), Karten eine Stufe heller (`#1F2937`), dazu **eine** Akzentfarbe, die du in den Einstellungen wählst: Blau, Grün, Bernstein, Rot, Magenta oder Weiß. Erledigte Sätze sind grün, Rekorde bernsteinfarben, Löschen rot – Farbe hat immer eine Bedeutung

## Gesundheit 🫀

Die dritte Welt beantwortet die Frage, die weder Training noch Ernährung beantworten kann: *Wirkt das eigentlich?*

- **Körper**: Gewicht mit **gleitendem Wochenschnitt** – ein einzelner Morgen sagt fast nichts, Salz und der Vorabend bewegen die Zahl um mehr als eine Woche Defizit. Die Punkte sind die Messungen, die Linie ist die Aussage. Dazu optional Körperfett und fünf Umfänge (Taille, Brust, Oberarm, Oberschenkel, Hüfte), ein Zielgewicht als Linie im Diagramm und der Trend der letzten sieben Tage. Umfänge sind bei gleichbleibendem Gewicht das ehrlichere Maß – Muskel wiegt wie Fett, sieht aber anders aus
- **Tagestracker, selbst zusammengestellt**: 23 Dinge zur Auswahl – Nahrungsergänzung (Kreatin, Proteinshake, Multivitamin, Vitamin D, Omega 3, Magnesium, Zink, Eisen), Alltag (Wasser, Schlaf, Schritte, Ruhepuls, Koffein, Alkohol, Dehnen, Spaziergang, Tageslicht, Meditation) und Befinden (Energie, Stimmung, Schlafqualität, Muskelkater, Stress). **Voreingestellt ist nichts**: Wer nichts auswählt, sieht auch nichts – die Seite bleibt so schlank wie ohne sie. Drei Arten reichen: Haken je Tag, Zahl mit Einheit und sinnvoller Schrittweite, Skala von 1 bis 5. Unter jeder Zeile ein Streifen der letzten sieben Tage – ein Haken für heute sagt nichts, sieben Tage am Stück schon. Vergessene Tage lassen sich über den Kalender nachtragen
- **Schritte zählt das Gerät selbst**: Fast jedes Android-Telefon hat einen sparsamen Bewegungssensor (`TYPE_STEP_COUNTER`), der auch bei geschlossener App weiterzählt. Die App muss deshalb nicht mitlaufen – sie sieht beim Öffnen nach und verbucht die Differenz. Kein Vordergrunddienst, keine dauerhafte Meldung in der Leiste, kein zusätzlicher Akkuverbrauch. Zwei Fallen sind umgangen: Nach einem **Neustart** fängt der Zähler bei null an (dann ist der neue Stand selbst die Differenz), und über **Mitternacht** zählt ein Zeitraum für den Tag, in dem seine Mitte liegt – dazu sieht ein Wecker jeden Abend um 23:57 einmal nach, damit jeder Tag seinen Abschluss bekommt, auch wenn die App tagelang zubleibt. Ohne Sensor oder ohne Freigabe bleibt die Zeile wie zuvor zum Eintippen
- **Kalender**: ein Monat auf einen Blick. Trainingstage sind ausgefüllt, kleine Marken zeigen, an welchen Tagen Ernährung erfasst und gewogen wurde. Darüber das **Wochenziel** (Voreinstellung: 3 Einheiten) und die **Serie** – wie viele Wochen am Stück es aufgegangen ist. Die laufende Woche zählt erst mit, wenn sie voll ist, sonst risse die Serie jeden Montag. Ein Tipp auf einen Tag zeigt, was an ihm passiert ist, und trägt eine vergessene Messung nach
- **Balance**: Sätze je Muskelgruppe – diese Woche oder im Wochenschnitt der letzten 4 bzw. 12 Wochen. Die Daten lagen immer schon in der Historie, nur nie ausgewertet: Man sieht auf einen Blick, dass die Beine seit vier Wochen zu kurz kommen. Das hinterlegte Band markiert 10 bis 20 Sätze als groben Richtwert – eine Orientierung, kein Urteil
- Messungen liegen unter einem **eigenen Schlüssel** (`lumora.gesundheit.v1`) und gehen mit ins Backup. Kalender und Balance speichern nichts – sie sind reine Lesesichten auf Workouts und Tagebuch

## Ernährung 🥗

- **Menge frei eintragen**: Beim Hinzufügen steht ein Feld für die Gramm-Zahl – hineintippen, und Kalorien, Eiweiß, Kohlenhydrate und Fett stehen sofort darunter, ausgerechnet aus den Werten je 100 g. Die Plus/Minus-Knöpfe springen auf das nächste Vielfache (von 75 führt „+" nach 80), und ist eine Portionsgröße hinterlegt, setzt ein Tipp sie ein. Der Knopf zum Übernehmen klebt am unteren Rand des Blattes, damit ihn die Bildschirmtastatur nicht verdeckt, und ein Tipp daneben verwirft nichts mehr
- **Tagebuch nach Mahlzeiten**: Frühstück, Mittagessen, Abendessen, Snacks. Oben stehen Kalorien, das, was vom Tagesziel übrig ist, und drei Balken für Eiweiß, Kohlenhydrate und Fett. Durch die Tage wischt man wie durch die Zeiträume im Trainingsverlauf – nach vorn ist heute Schluss
- **Lebensmittel aus Open Food Facts**: kostenlos, offen (Open Database License) und mit sehr guter Abdeckung deutscher Produkte. Gesucht wird über die deutsche Adresse, also mit deutschen Namen und deutschen Produkten zuerst. Kein Konto, kein Schlüssel; hinausgeschickt wird nur der Suchbegriff
- **Barcode scannen**: Kamera auf die Packung halten, fertig. Gelesen wird mit dem Code-Erkenner, den Android selbst mitbringt (`BarcodeDetector`) – keine zusätzliche Bibliothek, kein Bild verlässt das Gerät, nur die erkannte Ziffernfolge geht als Anfrage hinaus. Kennt die Datenbank den Code nicht, bietet die App an, das Lebensmittel anzulegen; der Code bleibt daran hängen und wird beim nächsten Mal ohne Netz gefunden. Wo es den Erkenner nicht gibt, erscheint der Knopf gar nicht erst – die Ziffern lassen sich auch eintippen
- **Offline ist die Regel, nicht der Notfall**: 76 gängige Lebensmittel sind eingebaut (Richtwerte je 100 g bzw. ml), und alles, was einmal eingetragen wurde, bleibt in der eigenen Liste. Ohne Netz sucht die App darin weiter und sagt es auch. Die Datenbank ist eine Ergänzung, keine Voraussetzung
- **Wenn die Datenbank klemmt**: großzügige Frist statt vorschnellem Aufgeben, ein zweiter Versuch über die internationale Adresse, und jede Antwort wird zum Suchbegriff gemerkt – ein gelöschtes Zeichen fragt nicht neu an. Scheitert es doch, nennt die App den Grund (bremst gerade / antwortet nicht) und bietet einen Knopf zum Wiederholen
- **Eigene Lebensmittel** anlegen, mit Portionsgröße („1 Scheibe = 45 g") und wahlweise gleich mit der gegessenen Menge – dann wandert es in einem Rutsch ins Tagebuch. Die Menge steht dabei oben und in einem großen Feld: Sie ist der Grund, warum man das Blatt öffnet. Die Nährwerte darunter liest man eher, als dass man sie ändert, und stehen deshalb kompakt in einem eigenen, ruhigeren Abschnitt. Auch ein eingebautes Lebensmittel lässt sich korrigieren; die Änderung gilt danach überall, alte Einträge bleiben gültig
- **Die Liste ist gruppiert**: zuletzt Benutztes zuerst, dann die eigenen Lebensmittel, dann der Grundvorrat. Beide oberen Gruppen sind vollständig – bei einer einzigen alphabetischen Reihe verschwand ein frisch angelegtes Lebensmittel hinter 76 Grundnahrungsmitteln
- **Blätter lassen sich herunterziehen**, so wie es der Griff oben verspricht. Ein Tipp daneben schließt sie dagegen nicht mehr, wenn etwas darin eingetragen wird
- **Tagesziele**: Die Kalorien sind die eine Zahl, die man setzt – die drei Nährstoffe hängen als **Anteil** daran. 30 % Eiweiß bleiben 30 % Eiweiß, egal ob man auf 1800 oder 2600 kcal geht; die Gramm-Zahl steht live daneben. Die Anteile ergeben immer 100 %: Ändert man einen, zieht die App die Differenz von den Kohlenhydraten ab (bzw. vom Fett, wenn man die Kohlenhydrate selbst anfasst). Gerundet wird auf volle Gramm – dass 30/40/30 dadurch nicht exakt die Kalorienzahl ergeben, steht als Hinweis dabei. Reine Zielmarken: Mit dem Training wird nichts davon verrechnet
- **Verlauf** über 7, 30 oder 90 Tage: Durchschnitte und ein Balken je Tag, Tage über dem Ziel bernsteinfarben, die Ziellinie gestrichelt darüber

## Android-App & Play Store 🤖

Die App ist als natives Android-Projekt (Capacitor) vorbereitet:

- **`android/`** – das komplette Android-Studio-Projekt (App-ID `io.github.nvmorcs.eisenzeit` – bleibt bewusst unverändert, denn an ihr hängt die installierte App samt Daten)
- **GitHub Actions → „Android Build"** – baut per Klick eine installierbare `app-debug.apk` und (mit Signier-Secrets) die signierte `app-release.aab` für den Play Store
- **`store/`** – alles für den Eintrag: Schritt-für-Schritt-Anleitung ([PLAY_STORE.md](store/PLAY_STORE.md)), fertige Texte auf Deutsch ([eintrag-de.md](store/eintrag-de.md)) und Englisch ([eintrag-en.md](store/eintrag-en.md)), die Antworten für Googles Datensicherheits-Formular ([datensicherheit.md](store/datensicherheit.md)), App-Icon 512×512, Funktionsgrafik 1024×500 in beiden Sprachen und je acht Screenshots (1080×1920)
- **`privacy.html`** / **`privacy-en.html`** – Datenschutzerklärung auf Deutsch und Englisch (über GitHub Pages als Pflicht-URL für den Store nutzbar)

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

Danach startet Lumora wie eine native App im Vollbild und funktioniert auch offline.

> **Wichtig:** Die Daten liegen lokal auf dem Gerät. Mach gelegentlich ein Backup über *Einstellungen → Backup erstellen* – besonders bevor du Browserdaten löschst.

## Lokal ausprobieren

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Technik

- Vanilla HTML/CSS/JS, keine Abhängigkeiten, kein Build-Schritt
- Datenhaltung in `localStorage`, inkl. laufendem Workout (übersteht Reloads). Die drei Welten nutzen **getrennte Schlüssel** (`eisenzeit.db.v1`, `lumora.essen.v1`, `lumora.gesundheit.v1`) – das Backup sichert und stellt alle drei wieder her
- Service Worker cached die App-Shell für den Offline-Betrieb
- Farbsystem über CSS-Custom-Properties; die Akzentfarbe hängt an einem `data-accent`-Attribut am Wurzelelement
- Sprachen über `tr("deutscher Text")`: Die Quellsprache steht im Code, das Wörterbuch in `js/i18n.js` liefert die englische Fassung. Der Code bleibt damit lesbar, und fehlt eine Übersetzung, steht dort deutscher Text statt einer Lücke. Namen von Übungen, Lebensmitteln und Portionen hängen an ihrer Kennung, nicht am Text
- Alle Grafiken werden aus `scripts/make-icons.py` generiert (Pillow), die Marke steckt zusätzlich als SVG-Pfad in `js/app.js`
- Die Muskel-Highlights entstehen per Flutfüllung aus den Körperzeichnungen (`scripts/make-muscle-paths.py`) – Herkunft der Zeichnungen siehe [NOTICE.md](NOTICE.md)

| Datei | Inhalt |
|---|---|
| `index.html` | App-Gerüst, PWA-Meta, Service-Worker-Registrierung |
| `css/style.css` | Design-Tokens und alle Komponenten |
| `js/i18n.js` | Sprachen: `tr()`, Wörterbuch, englische Namen für Übungen und Lebensmittel |
| `js/exercises.js` | Übungsbibliothek, Muskelgruppen und Beispielpläne |
| `js/muscle-icons.js` | Zuordnung Muskelgruppe → Figur und Bildausschnitt |
| `js/muscle-paths.js` | Erzeugte Muskelflächen (nicht von Hand ändern) |
| `scripts/make-muscle-paths.py` | Füllt die Muskeln aus `img/koerper-*.png` aus |
| `js/app.js` | App-Logik: Tracking, Pläne, Timer, Charts, Backup, Wortmarke, Tab-Leiste |
| `js/essen.js` | Ernährung: Tagebuch, Lebensmittel, Open Food Facts, eigener Speicher |
| `js/gesundheit.js` | Gesundheit: Körpermaße, Tagestracker, Trainingskalender, Balance der Muskelgruppen |
| `js/einstieg.js` | Einführung beim ersten Start und der Coach, der den Basisplan baut |
| `scripts/build-demo.mjs` | Baut die App in eine einzelne HTML-Datei (`npm run demo`) |
| `scripts/make-icons.py` | Erzeugt Icons, Launcher-Grafiken, Splash und Store-Assets |
| `scripts/make-screenshots.mjs` | Fotografiert die laufende App für den Store ab (`npm run screenshots`) |
| `android/…/PausenTimerPlugin.java` | Stille Meldung mit mitlaufender Restzeit (eigenes Capacitor-Plugin) |
| `android/…/SchrittZaehlerPlugin.java` | Schritte aus dem Bewegungssensor, ohne Dienst im Hintergrund |
| `android/…/SchrittAlarm.java` | Sieht einmal am Tag nach, damit jeder Tag seine eigene Summe bekommt |
| `sw.js` | Offline-Cache |
| `manifest.webmanifest` | PWA-Manifest (Installierbarkeit) |
