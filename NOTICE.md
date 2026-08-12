# Verwendete Fremdinhalte

## Körperzeichnungen der Muskel-Piktogramme

`img/koerper-vorn.png` und `img/koerper-hinten.png` sind aus einer Vorlage
freigestellt, die der Auftraggeber beigesteuert hat (anatomische
Strichzeichnung, weiße Linien auf dunklem Grund). Die Herkunft dieser Vorlage
ist im Projekt nicht dokumentiert.

> ⚠️ **Vor einer Veröffentlichung im Play Store klären:** Für die Zeichnung
> müssen Nutzungsrechte vorliegen. Ist das nicht der Fall, lassen sich beide
> Dateien gegen eine lizenzfreie anatomische Zeichnung austauschen – die
> Highlights werden mit `python3 scripts/make-muscle-paths.py` neu erzeugt,
> es sind nur die Saatpunkte in dem Skript nachzuziehen.

## Lebensmitteldaten (Open Food Facts)

Der Ernährungsteil fragt bei Bedarf [Open Food Facts](https://de.openfoodfacts.org)
ab. Die Produktdaten dort stehen unter der
[Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/),
die Einzelinhalte unter [Database Contents License](https://opendatacommons.org/licenses/dbcl/1-0/).

Was daraus folgt: Die Herkunft ist zu nennen – die App tut das an der
Trefferliste („Open Food Facts"), in der Datenschutzerklärung und hier. Eine
eigene Kopie der Datenbank hält die App **nicht**; gespeichert wird nur, was
der Nutzer selbst einträgt, und zwar auf seinem Gerät. Wird das später
anders (etwa ein mitgelieferter Auszug der Datenbank), greift die
Share-alike-Pflicht der ODbL und muss vorher geklärt werden.

Der mitgelieferte Grundvorrat in `js/essen.js` stammt **nicht** von dort. Es
sind gerundete Richtwerte für gängige Lebensmittel, von Hand
zusammengetragen – für die Praxis genau genug, aber keine Laboranalyse und
keine Grundlage für medizinische Entscheidungen.

## Übriges

Alles andere sind eigene Arbeiten und steht unter der Lizenz des Projekts:

- **App-Icon, Launcher-Grafiken, Splashscreen und Store-Material** – erzeugt
  aus `scripts/make-icons.py`
- **Bedien-Symbole** – Strichzeichnungen in `js/app.js`
- **Muskel-Highlights** – aus den Zeichnungen ausgefüllt und vereinfacht von
  `scripts/make-muscle-paths.py`, abgelegt in `js/muscle-paths.js`

Frühere Versionen nutzten Piktogramme von [Game-Icons.net](https://game-icons.net)
(CC BY 3.0). Sie sind seit Version 2.3.0 nicht mehr enthalten.
