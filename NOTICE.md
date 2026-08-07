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

## Übriges

Alles andere sind eigene Arbeiten und steht unter der Lizenz des Projekts:

- **App-Icon, Launcher-Grafiken, Splashscreen und Store-Material** – erzeugt
  aus `scripts/make-icons.py`
- **Bedien-Symbole** – Strichzeichnungen in `js/app.js`
- **Muskel-Highlights** – aus den Zeichnungen ausgefüllt und vereinfacht von
  `scripts/make-muscle-paths.py`, abgelegt in `js/muscle-paths.js`

Frühere Versionen nutzten Piktogramme von [Game-Icons.net](https://game-icons.net)
(CC BY 3.0). Sie sind seit Version 2.3.0 nicht mehr enthalten.
