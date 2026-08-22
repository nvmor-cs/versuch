// Lumora – Sprachen
//
// Die Quellsprache ist Deutsch: Im Code steht der deutsche Text, t() sucht
// dazu die englische Fassung. Das hat zwei Vorteile. Der Code bleibt lesbar –
// man sieht, was auf dem Bildschirm steht, statt einen Schlüssel wie
// "home.plan.empty" nachschlagen zu müssen. Und fehlt eine Übersetzung, steht
// dort deutscher Text statt einer Lücke oder eines rohen Schlüssels.
//
// Namen von Übungen, Lebensmitteln und Portionen hängen an ihrer Kennung und
// nicht am Text: So bleiben Übersetzungen gültig, auch wenn ein deutscher Name
// später anders geschrieben wird.

"use strict";

const SPRACHEN = [
  { id: "de", label: "Deutsch" },
  { id: "en", label: "English" },
];

// Wird beim Laden aus den Einstellungen gesetzt (siehe spracheSetzen).
let SPRACHE = "de";

/* Für Datums- und Zahlformate. Britisches Englisch, weil dort – wie im
   Deutschen – der Tag vor dem Monat steht; die Oberfläche bleibt damit in
   beiden Sprachen gleich aufgebaut. */
const LOCALES = { de: "de-DE", en: "en-GB" };
const locale = () => LOCALES[SPRACHE] || LOCALES.de;

function spracheSetzen(id) {
  SPRACHE = id === "en" ? "en" : "de";
  if (document.documentElement) document.documentElement.lang = SPRACHE;
}

/**
 * Übersetzt einen deutschen Text.
 *
 * Dasselbe deutsche Wort kann an zwei Stellen zwei Bedeutungen haben:
 * „Start" ist einmal der Reiter (englisch „Home") und einmal die Taste, die
 * ein Training beginnt (englisch „Start"). Damit beide ihre eigene Übersetzung
 * bekommen, darf ein Schlüssel nach einem senkrechten Strich einen Zusatz
 * tragen – tr("Start|Reiter"). Auf dem Bildschirm steht davon nichts: Im
 * Deutschen fällt der Zusatz weg, im Wörterbuch steht er als Teil des
 * Schlüssels.
 *
 * @param s   der deutsche Text, so wie er im Code steht
 * @param v   optionale Werte für Platzhalter der Form {name}
 */
function tr(s, v) {
  const strich = s.indexOf("|");
  const deutsch = strich < 0 ? s : s.slice(0, strich);
  let out = SPRACHE === "en" && Object.prototype.hasOwnProperty.call(EN, s) ? EN[s] : deutsch;
  if (v) out = out.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
  return out;
}

/* ═══════════════ Namen aus den Datenbeständen ═══════════════ */

// Muskelgruppen und Geräte sind im Datenbestand deutsche Wörter – sie stehen
// in gespeicherten Übungen und werden verglichen. Übersetzt wird deshalb erst
// bei der Anzeige, der gespeicherte Wert bleibt, wie er ist.
const tMuskel = (m) => tr(m);
const tGeraet = (g) => tr(g);

/** Anzeigename einer Übung; eigene Übungen behalten ihren getippten Namen. */
function tUebung(ex) {
  if (!ex) return "";
  if (SPRACHE === "en" && EN_UEBUNG[ex.id]) return EN_UEBUNG[ex.id];
  return ex.name;
}

/** Anzeigename eines Lebensmittels; nur der Grundvorrat ist übersetzt. */
function tLebensmittel(l) {
  if (!l) return "";
  if (SPRACHE === "en" && EN_ESSEN[l.id]) return EN_ESSEN[l.id];
  return l.name;
}

/** Portionsnamen des Grundvorrats („Scheibe", „Esslöffel" …). */
const tPortion = (n) => (SPRACHE === "en" && EN_PORTION[n] ? EN_PORTION[n] : n);

/* ═══════════════ Wörterbuch: Oberfläche ═══════════════ */

const EN = {
  /* ── Reiter und Bereiche ── */
  "Training": "Training",
  "Ernährung": "Nutrition",
  // Der Reiter heißt „Home"; die gleichnamige Taste auf einer Plankarte
  // beginnt ein Training und heißt auch im Englischen „Start" (Fallback).
  "Start|Reiter": "Home",
  "Pläne": "Plans",
  "Übungen": "Exercises",
  "Verlauf": "History",
  "Heute": "Today",
  "Lebensmittel": "Foods",
  "Hauptnavigation": "Main navigation",
  "Bereich wechseln": "Switch section",
  "Ernährung heute": "Nutrition today",
  "Ernährung im Verlauf": "Nutrition history",

  /* ── Startseite ── */
  "Aktueller Plan": "Current plan",
  "Zuletzt trainiert": "Recent workouts",
  "kein Plan": "no plan",
  "Noch kein Plan – lege im Tab „Pläne\" einen an.": "No plan yet – create one in the “Plans” tab.",
  "Plan wechseln": "Switch plan",
  "Leeres Workout starten": "Start empty workout",
  "Aktiven Plan wählen": "Choose active plan",
  "Aktueller Plan gesetzt": "Active plan set",
  "Noch keine Trainings in diesem Plan.": "No workouts in this plan yet.",
  "Einstellungen": "Settings",

  /* ── Pläne ── */
  "Aktiv": "Active",
  "Trainings": "workouts",
  "Noch keine Pläne": "No plans yet",
  "Ein Plan bündelt mehrere Trainings – z. B. Push, Pull und Beine.":
    "A plan groups several workouts – e.g. push, pull and legs.",
  "Neuen Plan erstellen": "Create new plan",
  "Plan bearbeiten": "Edit plan",
  "Plan-Name": "Plan name",
  "Aktiver Plan": "Active plan",
  "Als aktiven Plan setzen": "Set as active plan",
  "Noch keine Trainings – leg unten das erste an.": "No workouts yet – add the first one below.",
  "Training hinzufügen": "Add workout",
  "Gestartet wird ein Training über den Start-Tab. Den Plan-Namen kannst du oben direkt überschreiben.":
    "Workouts are started from the Home tab. You can edit the plan name directly above.",
  "Plan löschen": "Delete plan",
  "Plan „{name}\" wirklich löschen? Bereits getrackte Workouts bleiben erhalten.":
    "Really delete the plan “{name}”? Workouts you already logged are kept.",
  "Plan „{name}\" wirklich löschen?": "Really delete the plan “{name}”?",
  "Plan gelöscht": "Plan deleted",
  "Neuer Plan": "New plan",
  "Speichern": "Save",
  "Name des Plans": "Plan name",
  "z. B. Push / Pull / Beine": "e.g. push / pull / legs",
  "Trainings in diesem Plan": "Workouts in this plan",
  "Noch keine Trainings – füge z. B. „Push\", „Pull\" und „Beine\" hinzu.":
    "No workouts yet – add “Push”, “Pull” and “Legs”, for example.",
  "Training verschieben": "Move workout",
  "Bearbeiten": "Edit",
  "Entfernen": "Remove",
  "Training „{name}\" aus dem Plan entfernen?": "Remove the workout “{name}” from this plan?",
  "Mein Plan": "My plan",
  "Plan gespeichert": "Plan saved",
  "Training bearbeiten": "Edit workout",
  "Fertig": "Done",
  "Name des Trainings": "Workout name",
  "z. B. Push (Brust, Schultern, Trizeps)": "e.g. Push (chest, shoulders, triceps)",
  "Übungen &amp; Sätze": "Exercises &amp; sets",
  "Übung verschieben": "Move exercise",
  "Sätze": "sets",
  "Noch keine Übungen in diesem Training.": "No exercises in this workout yet.",
  "Übungen hinzufügen": "Add exercises",
  "Supersatz {letter} · Übung {pos} von {size}": "Superset {letter} · exercise {pos} of {size}",
  "Zeit (Min:Sek)": "Time (min:sec)",
  "Letztes Mal: {satz}": "Last time: {satz}",
  "Erstes Mal in diesem Training": "First time in this workout",
  "Erster Eintrag": "First entry",
  "{kg} kg × {r} Wdh.": "{kg} kg × {r} reps",
  "Supersatz – trennen": "Superset – split",
  "Mit nächster Übung verbinden": "Link with next exercise",
  "Zum Supersatz verbinden": "Link into a superset",
  "Training {n}": "Workout {n}",

  /* ── Übungen ── */
  "Alle": "All",
  "Eigene Übung anlegen": "Create custom exercise",
  "Übung suchen …": "Search exercises …",
  "Nichts gefunden": "Nothing found",
  "Nichts gefunden.": "Nothing found.",
  "Lege die Übung über das Plus oben rechts selbst an.":
    "Create the exercise yourself with the plus at the top right.",
  "Eigene Übung": "Custom exercise",
  "Eigene": "Custom",
  "Übung bearbeiten": "Edit exercise",
  "Name": "Name",
  "z. B. Larsen Press": "e.g. Larsen press",
  "Muskelgruppe": "Muscle group",
  "Gerät": "Equipment",
  "Erfassung": "Tracking",
  "Bitte einen Namen eingeben": "Please enter a name",
  "Übung gespeichert": "Exercise saved",
  "„{name}\" löschen? Bereits getrackte Workouts bleiben erhalten.":
    "Delete “{name}”? Workouts you already logged are kept.",
  "Übung gelöscht": "Exercise deleted",
  "Übung löschen": "Delete exercise",
  "Gelöschte Übung": "Deleted exercise",
  "Entwicklung": "Progress",
  "Historie": "History",
  "Bester Satz": "Best set",
  "{n} Wdh.": "{n} reps",
  "Bester Satz · geschätztes 1RM: {kg} kg": "Best set · estimated 1RM: {kg} kg",
  "Schwerster Satz (kg) pro Workout": "Heaviest set (kg) per workout",
  "Beste Wiederholungszahl pro Workout": "Best rep count per workout",
  "Längste Dauer pro Workout": "Longest duration per workout",
  "Noch keine Einträge": "No entries yet",
  "Tracke die Übung in einem Workout, dann erscheint hier deine Entwicklung.":
    "Log this exercise in a workout and your progress will show up here.",
  "Übungen wählen": "Choose exercises",
  "Keine auswählen": "Select none",
  "Übungen {wort}": "{wort} exercises",
  "{n} Übung {wort}": "{wort} {n} exercise",
  "{n} Übungen {wort}": "{wort} {n} exercises",
  "hinzufügen": "add",
  "übernehmen": "apply",
  "Höchstens {n} Übungen": "At most {n} exercises",
  "(max. {n})": "(max. {n})",

  /* ── Laufendes Workout ── */
  "Morgen-Workout": "Morning workout",
  "Mittags-Workout": "Midday workout",
  "Nachmittags-Workout": "Afternoon workout",
  "Abend-Workout": "Evening workout",
  "Workout": "Workout",
  "Es läuft bereits ein Workout": "A workout is already running",
  "Minimieren": "Minimise",
  "Workout-Name": "Workout name",
  "Beenden": "Finish",
  "Dauer": "Duration",
  "Volumen": "Volume",
  "Übung hinzufügen": "Add exercise",
  "Workout verwerfen": "Discard workout",
  "Leg los!": "Get started!",
  "Füge deine erste Übung hinzu.": "Add your first exercise.",
  "Übung zuklappen": "Collapse exercise",
  "Übung aufklappen": "Expand exercise",
  "Übung entfernen": "Remove exercise",
  "Fertig · {n} Sätze": "Done · {n} sets",
  "{fertig}/{gesamt} Sätze": "{fertig}/{gesamt} sets",
  "Alle {n} Sätze abgeschlossen": "All {n} sets completed",
  "+ Satz hinzufügen": "+ Add set",
  "Satz zurückholen": "Undo set",
  "Satz löschen": "Delete set",
  "Satz {n}": "Set {n}",
  "Satz {n} / {gesamt}": "Set {n} / {gesamt}",
  "geplant": "planned",
  "Geplanten Satz entfernen": "Remove planned set",
  "Satz entfernen": "Remove set",
  "Gewicht (kg)": "Weight (kg)",
  "Gewicht in kg": "Weight in kg",
  "Wiederholungen": "Reps",
  "Zeit": "Time",
  "{label} erhöhen": "Increase {label}",
  "{label} verringern": "Decrease {label}",
  "Satz abschließen": "Complete set",
  "„{name}\" mit abgehakten Sätzen entfernen?": "Remove “{name}” with completed sets?",
  "Letzter Satz – entferne stattdessen die Übung": "Last set – remove the exercise instead",
  "Wiederholungen eintragen": "Enter reps",
  "Zeit eintragen, z. B. 1:30": "Enter a time, e.g. 1:30",
  "Weiter mit {name}": "Next up: {name}",
  "Workout wirklich verwerfen? Alle Eingaben gehen verloren.":
    "Really discard this workout? All entries will be lost.",
  "Verwerfen": "Discard",
  "Workout verworfen": "Workout discarded",
  "Keine abgehakten Sätze. Workout verwerfen?": "No completed sets. Discard the workout?",
  "{n} nicht abgehakter Satz wird verworfen. Workout beenden?":
    "{n} unchecked set will be discarded. Finish the workout?",
  "{n} nicht abgehakte Sätze werden verworfen. Workout beenden?":
    "{n} unchecked sets will be discarded. Finish the workout?",
  "Pause vorbei – nächster Satz!": "Rest over – next set!",
  "+15 s": "+15 s",
  "Workout läuft ·": "Workout running ·",
  "Weiter": "Resume",

  /* ── Plan-Abgleich nach dem Workout ── */
  "{n} Übung dazu": "{n} exercise added",
  "{n} Übungen dazu": "{n} exercises added",
  "{n} Übung entfernt": "{n} exercise removed",
  "{n} Übungen entfernt": "{n} exercises removed",
  "Reihenfolge geändert": "order changed",
  "Sätze geändert": "sets changed",
  "Du hast im Workout etwas verändert ({was}). Soll „{name}\" künftig so aussehen?":
    "You changed something in this workout ({was}). Should “{name}” look like this from now on?",
  "Übernehmen": "Apply",
  "Nur diesmal": "Just this time",

  /* ── Abschluss und Coach ── */
  "Workout gespeichert": "Workout saved",
  "Neue Rekorde": "New records",
  "Erste Marke": "First mark",
  "Rekord": "Record",
  "Coach": "Coach",
  "Backup sichern": "Back up your data",
  "Sichern": "Back up",
  "Dein letztes Backup ist über zwei Wochen her.": "Your last backup is more than two weeks old.",
  "Du hast noch kein Backup – so gehen deine Daten nie verloren.":
    "You have no backup yet – that way your data can never be lost.",
  "„{name}\" aktualisiert": "“{name}” updated",
  "{name}: neuer Bestwert. Sauber.": "{name}: new best. Clean work.",
  "Bei {name} liegst du seit drei Einheiten bei {kg} kg × {r}. Bist du da wirklich ans Limit gegangen?":
    "You have been at {kg} kg × {r} on {name} for three sessions. Did you really go to the limit there?",
  "{name}: erste Marke gesetzt. Ab hier geht es aufwärts.":
    "{name}: first mark set. It goes up from here.",
  "{name}: {jetzt} kg statt {damals} kg beim letzten Mal. Schöne Steigerung.":
    "{name}: {jetzt} kg instead of {damals} kg last time. Nice jump.",
  "{name}: {jetzt} kg, letztes Mal waren es {damals} kg. War das Absicht – oder steckt Müdigkeit dahinter?":
    "{name}: {jetzt} kg, last time it was {damals} kg. On purpose – or was fatigue in play?",
  "{name}: dreimal {r} Wiederholungen ohne Einbruch. Da ist Luft für mehr Gewicht.":
    "{name}: three sets of {r} reps without dropping off. There is room for more weight.",
  "Gesamtvolumen {proz} % über dem letzten „{name}\". Das summiert sich.":
    "Total volume {proz} % above the last “{name}”. That adds up.",
  "Gesamtvolumen {proz} % unter dem letzten „{name}\" – kürzeres Training oder weniger Sätze?":
    "Total volume {proz} % below the last “{name}” – shorter session or fewer sets?",

  /* ── Verlauf ── */
  "Woche": "Week",
  "Diese Woche": "This week",
  "Quartal": "Quarter",
  "Dieses Quartal": "This quarter",
  "Jahr": "Year",
  "Dieses Jahr": "This year",
  "Gesamt": "All time",
  "Zeitraum": "Period",
  "Workouts": "Workouts",
  "Gewicht × Wiederholungen pro Tag, aktuelle Woche": "Weight × reps per day, current week",
  "Gewicht × Wiederholungen pro Woche, aktuelles Quartal": "Weight × reps per week, current quarter",
  "Gewicht × Wiederholungen pro Monat, aktuelles Jahr": "Weight × reps per month, current year",
  "Gewicht × Wiederholungen pro Jahr, gesamte Historie": "Weight × reps per year, all time",
  "Gewicht × Wiederholungen pro Monat, gesamte Historie": "Weight × reps per month, all time",
  "Nichts im Zeitraum": "Nothing in this period",
  "In diesem Zeitraum wurde noch nicht trainiert.": "No workouts logged in this period yet.",
  "Starte dein erstes Workout über den Start-Tab.": "Start your first workout from the Home tab.",
  "Übungen im Blick": "Exercises to watch",
  "Aus der Übersicht nehmen": "Remove from overview",
  "Beste Zeit": "Best time",
  "Meiste Wiederholungen": "Most reps",
  "Bestes Gewicht": "Best weight",
  "{was} pro Workout · alle Workouts": "{was} per workout · all workouts",
  "{was} pro Workout · alle Workouts · Rekord {rek}": "{was} per workout · all workouts · record {rek}",
  "Noch keine ausgewählt. Wähle bis zu {n} Übungen – etwa Kniebeugen –, dann siehst du hier ihre Entwicklung über alle Workouts.":
    "None selected yet. Pick up to {n} exercises – squats, say – and their progress across all workouts shows up here.",
  "Übungen ändern": "Change exercises",
  "Workout wiederholen": "Repeat workout",
  "Löschen": "Delete",
  "Workout endgültig löschen?": "Delete this workout for good?",
  "Workout gelöscht": "Workout deleted",
  "Sobald du in diesem Zeitraum Workouts trackst, siehst du hier dein Volumen.":
    "Once you log workouts in this period, your volume shows up here.",
  "Nach mindestens zwei Workouts mit dieser Übung erscheint hier der Verlauf.":
    "After at least two workouts with this exercise, the trend appears here.",
  "Balkendiagramm: Trainingsvolumen": "Bar chart: training volume",
  "Liniendiagramm: Entwicklung über die Zeit": "Line chart: progress over time",

  /* ── Einstellungen ── */
  "Sprache": "Language",
  "Sprache der App": "Language of the app",
  "Pausen-Timer": "Rest timer",
  "Startet automatisch nach jedem abgehakten Satz": "Starts automatically after each completed set",
  "Akzentfarbe": "Accent colour",
  "Kurze Rückmeldung nach jedem Workout": "A short note after each workout",
  "Geräte je Training": "Machines per workout",
  "Kabelzug und Maschinen nur mit demselben Training vergleichen – freie Gewichte immer":
    "Compare cables and machines only within the same workout – free weights always",
  "Pausendauer": "Rest length",
  "{n} Min.": "{n} min",
  "Datensicherung": "Backup",
  "Backup erstellen": "Create backup",
  "Backup wiederherstellen": "Restore backup",
  "Nach einer Neuinstallation zurückholen": "Bring your data back after reinstalling",
  "Laden": "Load",
  "Sichere dein Backup in Google Drive oder Dateien – dann kannst du es jederzeit zurückholen. Zusätzlich sichert Android die App automatisch in deinem Google-Konto.":
    "Save your backup to Google Drive or Files – then you can restore it any time. Android also backs the app up automatically in your Google account.",
  "Alle Daten löschen": "Delete all data",
  "Deine Daten bleiben auf diesem Gerät.": "Your data stays on this device.",
  "Noch kein Backup erstellt": "No backup created yet",
  "Zuletzt heute ({datum})": "Last backed up today ({datum})",
  "Zuletzt gestern ({datum})": "Last backed up yesterday ({datum})",
  "Zuletzt vor {n} Tagen ({datum})": "Last backed up {n} days ago ({datum})",
  "Blau": "Blue",
  "Grün": "Green",
  "Bernstein": "Amber",
  "Rot": "Red",
  "Magenta": "Magenta",
  "Weiß": "White",

  /* ── Backup ── */
  "Lumora-Backup": "Lumora backup",
  "Backup speichern": "Save backup",
  "{summary} gefunden.": "{summary} found.",
  "{summary} gefunden. Jetzt wiederherstellen?": "{summary} found. Restore now?",
  "Backup erstellt": "Backup created",
  "Backup gespeichert": "Backup saved",
  "Teilen hat nicht geklappt – hier ist dein Backup als Text:":
    "Sharing did not work – here is your backup as text:",
  "Backup als Text": "Backup as text",
  "Kopiere den Text und sichere ihn, z. B. in einer Notiz.":
    "Copy the text and keep it somewhere safe, in a note for example.",
  "Text kopieren": "Copy text",
  "In die Zwischenablage kopiert": "Copied to clipboard",
  "Wähle deine Backup-Datei aus – oder füge den Backup-Text unten ein.":
    "Pick your backup file – or paste the backup text below.",
  "Datei auswählen": "Choose file",
  "Backup-Text einfügen": "Paste backup text",
  "Aus Text wiederherstellen": "Restore from text",
  "Datei konnte nicht gelesen werden": "The file could not be read",
  "Bitte den Backup-Text einfügen": "Please paste the backup text",
  "Das ist kein gültiges Lumora-Backup": "That is not a valid Lumora backup",
  "Wie wiederherstellen?": "How should we restore?",
  "{summary} Du hast bereits eigene Daten in der App.": "{summary} You already have data in the app.",
  "Zusammenführen": "Merge",
  "Fehlende Workouts und Pläne werden ergänzt, vorhandene bleiben.":
    "Missing workouts and plans are added, existing ones stay.",
  "Alles ersetzen": "Replace everything",
  "Die aktuellen Daten in der App werden verworfen.": "The data currently in the app is discarded.",
  "Backup zusammengeführt": "Backup merged",
  "Backup wiederhergestellt": "Backup restored",
  "{n} Workout": "{n} workout",
  "{n} Workouts": "{n} workouts",
  "{n} Plan": "{n} plan",
  "{n} Pläne": "{n} plans",
  "{n} Ernährungstag": "{n} nutrition day",
  "{n} Ernährungstage": "{n} nutrition days",
  "{workouts}, {plaene}": "{workouts}, {plaene}",
  "{workouts}, {plaene} und {tage}": "{workouts}, {plaene} and {tage}",
  "Wiederherstellen": "Restore",
  "Wirklich ALLE Workouts, Pläne und Übungen löschen?":
    "Really delete ALL workouts, plans and exercises?",
  "Ganz sicher? Das kann nicht rückgängig gemacht werden.":
    "Absolutely sure? This cannot be undone.",
  "Endgültig löschen": "Delete for good",
  "Alle Daten gelöscht": "All data deleted",

  /* ── Allgemein ── */
  "Abbrechen": "Cancel",
  "Schließen": "Close",
  "Zurück": "Back",
  "Bestätigung": "Confirmation",
  "OK": "OK",
  "Min.": "min",
  "Std.": "h",
  "{h} Std. {m} Min.": "{h} h {m} min",
  "Workout läuft – nochmal für Beenden": "Workout running – press again to leave",
  "Nochmal zurück zum Beenden": "Press back again to leave",

  /* ── Ernährung: Tag ── */
  "Frühstück": "Breakfast",
  "{wert} / {ziel} g": "{wert} / {ziel} g",
  "{menge} {einheit} · E {eiweiss} · KH {kh} · F {fett}":
    "{menge} {einheit} · P {eiweiss} · C {kh} · F {fett}",
  "Mittagessen": "Lunch",
  "Abendessen": "Dinner",
  "Snacks": "Snacks",
  "Gestern": "Yesterday",
  "Vorheriger Tag": "Previous day",
  "Nächster Tag": "Next day",
  "Tagesziele": "Daily goals",
  "von {kcal} kcal": "of {kcal} kcal",
  "übrig": "left",
  "darüber": "over",
  "Eiweiß": "Protein",
  "Kohlenhydrate": "Carbs",
  "KH": "Carbs",
  "Fett": "Fat",
  "Hinzufügen": "Add",
  "Eintrag löschen": "Delete entry",
  "Noch nichts eingetragen": "Nothing logged yet",
  "Tipp auf „Hinzufügen\" und trag dein erstes Lebensmittel ein.":
    "Tap “Add” and log your first food.",
  "Eingetragen": "Logged",

  /* ── Ernährung: Menge ── */
  "Wie viel hast du gegessen? ({einheit})": "How much did you eat? ({einheit})",
  "Menge in {einheit}": "Amount in {einheit}",
  "weniger": "less",
  "mehr": "more",
  "Je 100 {einheit}: {kcal} kcal · E {eiweiss} g · KH {kh} g · F {fett} g":
    "Per 100 {einheit}: {kcal} kcal · P {eiweiss} g · C {kh} g · F {fett} g",
  "Mahlzeit": "Meal",
  "Trag erst eine Menge ein": "Enter an amount first",
  "1 {name} = {gramm} {einheit}": "1 {name} = {gramm} {einheit}",

  /* ── Ernährung: Lebensmittel ── */
  "Eigenes Lebensmittel": "Custom food",
  "Suchen oder Barcode eintippen …": "Search or type a barcode …",
  "Barcode scannen": "Scan barcode",
  "Deine Liste": "Your list",
  "Zuletzt benutzt": "Recently used",
  "Eigene Lebensmittel": "Your foods",
  "Grundvorrat": "Basics",
  "Nichts gefunden. Such unten in der Datenbank oder leg dir das Lebensmittel selbst an.":
    "Nothing found. Search the database below, or create the food yourself.",
  "{kcal} kcal je 100 {einheit} · E {eiweiss} · KH {kh} · F {fett}":
    "{kcal} kcal per 100 {einheit} · P {eiweiss} · C {kh} · F {fett}",
  "Noch zu kurz – ab drei Zeichen wird gesucht.": "Too short – search starts at three characters.",
  "Tippe, um in der Datenbank zu suchen.": "Type to search the database.",
  "Kein Netz – gesucht wird nur in deiner Liste.": "No connection – searching your own list only.",
  "Die Datenbank antwortet nicht. Prüf die Verbindung – oder versuch es erneut.":
    "The database is not responding. Check your connection – or try again.",
  "Nochmal versuchen": "Try again",
  "Nichts gefunden. Vielleicht als eigenes Lebensmittel anlegen?":
    "Nothing found. Create it as your own food?",
  "Die Datenbank bremst gerade (zu viele Anfragen). Gleich nochmal versuchen.":
    "The database is throttling right now (too many requests). Try again in a moment.",
  "Werte je 100 {einheit}": "Values per 100 {einheit}",
  "Werte je 100 {einheit} · gerundeter Richtwert": "Values per 100 {einheit} · rounded guide value",
  "Werte je 100 {einheit} · aus Open Food Facts": "Values per 100 {einheit} · from Open Food Facts",
  "Wird gesucht …": "Searching …",
  "Open Food Facts": "Open Food Facts",
  "eigen": "custom",
  "Werte anpassen": "Adjust values",
  "Zu {mahlzeit} hinzufügen": "Add to {mahlzeit}",
  "Werte ändern": "Change values",
  "„{name}\" löschen? Bereits eingetragene Mengen bleiben stehen.":
    "Delete “{name}”? Amounts already logged stay.",
  "Lebensmittel gelöscht": "Food deleted",
  "Unbekannt": "Unknown",

  /* ── Ernährung: Formular ── */
  "Gegessen": "Eaten",
  "Menge": "Amount",
  "z. B. 150": "e.g. 150",
  "Leer lassen, wenn du die Werte nur speichern willst.":
    "Leave empty if you only want to save the values.",
  "{menge} {einheit} = {kcal} kcal · E {eiweiss} g · KH {kh} g · F {fett} g":
    "{menge} {einheit} = {kcal} kcal · P {eiweiss} g · C {kh} g · F {fett} g",
  "Nährwerte": "Nutrition facts",
  "Bezug": "Basis",
  "je 100 g": "per 100 g",
  "je 100 ml": "per 100 ml",
  "Eiweiß (g)": "Protein (g)",
  "Kohlenhydrate (g)": "Carbs (g)",
  "Fett (g)": "Fat (g)",
  "Marke (optional)": "Brand (optional)",
  "Portion heißt": "Portion name",
  "Portion hat": "Portion size",
  "Der Name fehlt": "The name is missing",
  "Gespeichert": "Saved",

  /* ── Ernährung: Scanner ── */
  "Halte den Strichcode in den Rahmen": "Hold the barcode inside the frame",
  "Dieses Gerät kann keine Codes lesen – tipp die Ziffern ein":
    "This device cannot read codes – type the digits instead",
  "Ohne Kamerafreigabe geht es nicht – in den Android-Einstellungen erlauben":
    "It needs camera access – allow it in the Android settings",
  "Die Kamera lässt sich nicht öffnen": "The camera cannot be opened",
  "Das Kamerabild lässt sich nicht anzeigen": "The camera image cannot be shown",
  "Kein Netz – der Code {code} ist noch nicht in deiner Liste":
    "No connection – the code {code} is not in your list yet",
  "Die Datenbank antwortet nicht – versuch es gleich nochmal":
    "The database is not responding – try again in a moment",
  "Den Code {code} kennt Open Food Facts nicht. Das Lebensmittel selbst anlegen?":
    "Open Food Facts does not know the code {code}. Create the food yourself?",
  "Anlegen": "Create",
  "Code {code} – wird nachgeschlagen …": "Code {code} – looking it up …",

  /* ── Ernährung: Ziele ── */
  "Kalorien am Tag": "Calories per day",
  "Verteilung": "Split",
  "in %": "in %",
  "{label} in Prozent": "{label} in percent",
  "Summe 100 % · {kcal} kcal nach Rundung auf volle Gramm":
    "Total 100 % · {kcal} kcal after rounding to whole grams",
  "Summe {summe} % – wird beim Speichern auf 100 % gebracht":
    "Total {summe} % – will be normalised to 100 % on save",
  "Ziele gespeichert": "Goals saved",

  /* ── Ernährung: Verlauf ── */
  "7 Tage": "7 days",
  "30 Tage": "30 days",
  "90 Tage": "90 days",
  "Ø kcal": "avg kcal",
  "Tage": "days",
  "Ø Eiweiß": "avg protein",
  "Kalorien je Tag": "Calories per day",
  "Die Linie ist dein Ziel: {kcal} kcal": "The line is your goal: {kcal} kcal",
  "Noch nichts getrackt": "Nothing logged yet",
  "Trag im Reiter „Heute\" dein erstes Lebensmittel ein – hier entsteht daraus die Entwicklung.":
    "Log your first food in the “Today” tab – the trend builds up from there.",
  "Nährstoffe im Mittel": "Average nutrients",
  "Ø {wert} / {ziel} g": "avg {wert} / {ziel} g",
  "{datum}: {kcal} kcal": "{datum}: {kcal} kcal",
  "Balkendiagramm: Kalorien je Tag": "Bar chart: calories per day",

  /* ── Gesundheit ── */
  "Gesundheit": "Health",
  "Körper": "Body",
  "Kalender": "Calendar",
  "Balance": "Balance",
  "Trainingskalender": "Training calendar",
  "Balance der Muskelgruppen": "Muscle group balance",

  /* Körper */
  "Gewicht": "Weight",
  "Körperfett": "Body fat",
  "Taille": "Waist",
  "Oberarm": "Upper arm",
  "Oberschenkel": "Thigh",
  "Hüfte": "Hips",
  "Maße": "Measurements",
  "Freiwillig": "Optional",
  "Gewicht eintragen": "Log weight",
  "Heute: {gewicht} kg": "Today: {gewicht} kg",
  "in 7 Tagen": "over 7 days",
  "Zielgewicht": "Target weight",
  "Noch {rest} kg bis {ziel} kg": "{rest} kg to go to {ziel} kg",
  "{rest} kg unter dem Ziel von {ziel} kg": "{rest} kg below the target of {ziel} kg",
  "Zielgewicht {ziel} kg erreicht": "Target weight of {ziel} kg reached",
  "Punkte sind einzelne Messungen, die Linie der Schnitt über sieben Tage":
    "Dots are single readings, the line is the seven-day average",
  "Noch nichts gemessen": "Nothing measured yet",
  "Trag dein Gewicht ein – am besten morgens, nüchtern und immer zur selben Zeit. Erst über Wochen wird daraus eine Aussage.":
    "Log your weight – ideally in the morning, before eating, always at the same time. Only over weeks does it mean anything.",
  "Ab der zweiten Messung in diesem Zeitraum entsteht hier eine Kurve.":
    "From the second reading in this period, a curve appears here.",
  "Liniendiagramm: Gewichtsverlauf": "Line chart: weight over time",
  "seit {datum}: {diff} {einheit}": "since {datum}: {diff} {einheit}",
  "erste Messung": "first reading",
  "Messung vom {datum}": "Reading from {datum}",
  "Messung löschen": "Delete reading",
  "Messung gelöscht": "Reading deleted",
  "Messung bearbeiten": "Edit reading",
  "Messung nachtragen": "Add reading",
  "Trag mindestens einen Wert ein": "Enter at least one value",
  "z. B. 78": "e.g. 78",
  "Leer lassen, wenn du ohne Ziel trackst. Gesetzt erscheint es als Linie im Diagramm.":
    "Leave empty to track without a target. If set, it shows as a line in the chart.",
  "1 Jahr": "1 year",

  /* Kalender */
  "Vorheriger Monat": "Previous month",
  "Nächster Monat": "Next month",
  "Wochenziel": "Weekly goal",
  "Einheiten je Woche": "Sessions per week",
  "Woran sich die Serie im Kalender misst": "What the streak in the calendar is measured against",
  "Einheiten diese Woche": "sessions this week",
  "Woche in Folge": "week in a row",
  "Wochen in Folge": "weeks in a row",
  "trainiert": "trained",
  "gegessen erfasst": "food logged",
  "gewogen": "weighed",
  "An diesem Tag wurde nicht trainiert.": "No workout on this day.",
  "{n} Einträge": "{n} entries",

  /* Tagestracker */
  "Tagestracker": "Daily trackers",
  "Tracker auswählen": "Choose trackers",
  "Tracker anpassen": "Adjust trackers",
  "Tracker nachtragen": "Add trackers",
  "Tracker vom {datum}": "Trackers for {datum}",
  "Noch nichts ausgewählt. Trag ein, was du täglich mitschreiben willst – Kreatin, Wasser, Schlaf, Stimmung. Nur was du auswählst, steht hier.":
    "Nothing selected yet. Pick what you want to note down daily – creatine, water, sleep, mood. Only what you pick shows up here.",
  "Nur was hier an ist, erscheint auf der Körper-Seite.": "Only what is switched on here appears on the Body screen.",
  "Haken je Tag": "one tick per day",
  "Skala 1 bis 5": "scale of 1 to 5",
  "Zahl in {einheit}": "number in {einheit}",
  "Zahl": "number",
  "Körper notiert": "body logged",
  "Zählt das Gerät selbst": "counted by the device",
  "automatisch": "automatic",
  "Erlauben": "Allow",
  "Automatisch zählen": "Count automatically",
  "Der Bewegungssensor zählt mit, auch wenn die App zu ist":
    "The motion sensor keeps counting, even with the app closed",
  "Braucht die Freigabe für Körperaktivität": "Needs the physical activity permission",

  "Nahrungsergänzung": "Supplements",
  "Alltag": "Everyday",
  "Befinden": "How you feel",
  "Kreatin": "Creatine",
  "Proteinshake": "Protein shake",
  "Multivitamin": "Multivitamin",
  "Vitamin D": "Vitamin D",
  "Omega 3": "Omega 3",
  "Magnesium": "Magnesium",
  "Zink": "Zinc",
  "Eisen": "Iron",
  "Wasser": "Water",
  "Schlaf": "Sleep",
  "Schritte": "Steps",
  "Ruhepuls": "Resting heart rate",
  "Koffein": "Caffeine",
  "Alkohol": "Alcohol",
  "Gläser": "glasses",
  "Dehnen": "Stretching",
  "Spaziergang": "Walk",
  "Tageslicht": "Daylight",
  "Meditation": "Meditation",
  "Energie": "Energy",
  "Stimmung": "Mood",
  "Schlafqualität": "Sleep quality",
  "Muskelkater": "Soreness",
  "Stress": "Stress",

  /* Balance – „Diese Woche" steht schon beim Verlauf */
  "4 Wochen": "4 weeks",
  "12 Wochen": "12 weeks",
  "Abgehakte Sätze diese Woche, nach Muskelgruppe. Das hinterlegte Band markiert 10 bis 20 Sätze – ein grober Richtwert, kein Urteil.":
    "Completed sets this week, by muscle group. The shaded band marks 10 to 20 sets – a rough guide, not a verdict.",
  "Sätze je Woche im Schnitt der letzten {n} Wochen. Das hinterlegte Band markiert 10 bis 20 Sätze – ein grober Richtwert, kein Urteil.":
    "Sets per week, averaged over the last {n} weeks. The shaded band marks 10 to 20 sets – a rough guide, not a verdict.",
  "Noch keine Sätze im Zeitraum": "No sets in this period yet",
  "Sobald du trainierst, siehst du hier, welche Muskelgruppe wie viel abbekommt – und welche zu kurz kommt.":
    "Once you train, you will see here which muscle group gets how much – and which one is falling behind.",

  /* ── Einführung ── */
  "Einführung": "Introduction",
  "Die Erklärung vom ersten Start nochmal ansehen": "See the first-run explanation again",
  "Ansehen": "View",
  "Überspringen": "Skip",
  "Seite": "Page",
  "Seite {n}": "Page {n}",
  "Erstmal selbst umschauen": "Have a look around first",
  "Plan vom Coach erstellen": "Let the coach build a plan",
  "Willkommen bei Lumora": "Welcome to Lumora",
  "Deine App für Training, Ernährung und Gesundheit – in einem.":
    "Your app for training, nutrition and health – all in one.",
  "Alles bleibt auf diesem Gerät. Kein Konto, keine Anmeldung, kein Server.":
    "Everything stays on this device. No account, no sign-in, no server.",
  "Drei Welten, eine Leiste": "Three worlds, one bar",
  "Unten sitzt eine Pille mit den Reitern. Wisch darüber, und du wechselst zwischen Training, Ernährung und Gesundheit.":
    "At the bottom sits a pill with the tabs. Swipe across it to move between Training, Nutrition and Health.",
  "Die drei Punkte darüber zeigen, wo du bist – antippen geht auch. Es läuft im Kreis, du kannst nicht falsch wischen.":
    "The three dots above show where you are – you can tap them too. It loops around, so you cannot swipe the wrong way.",
  "Ein Plan bündelt mehrere Trainings – etwa Push, Pull und Beine. Vom Start-Tab aus startest du eines davon.":
    "A plan groups several workouts – push, pull and legs, for example. You start one of them from the Home tab.",
  "Dann hakst du Satz für Satz ab. Gewicht und Wiederholungen sind mit den Werten vom letzten Mal vorbelegt, die Pause läuft von allein.":
    "Then you tick off set after set. Weight and reps are pre-filled with last time's values, and the rest timer runs by itself.",
  "Rekorde erkennt die App selbst, und der Coach sagt hinterher kurz, was ihm aufgefallen ist.":
    "The app spots records on its own, and afterwards the coach briefly says what it noticed.",
  "Ein Tagebuch mit vier Mahlzeiten. Such ein Lebensmittel, scanne den Barcode oder leg es selbst an.":
    "A diary with four meals. Search for a food, scan its barcode or create it yourself.",
  "Deine Ziele setzt du als Kalorien plus Anteile – 30 % Eiweiß bleiben 30 %, egal wie du die Kalorien änderst.":
    "You set your goals as calories plus shares – 30 % protein stays 30 %, however you change the calories.",
  "Gewicht mit gleitendem Wochenschnitt: Ein einzelner Morgen sagt nichts, die Linie schon.":
    "Weight with a rolling weekly average: a single morning says nothing, the line does.",
  "Der Kalender zeigt, wie regelmäßig du dabei bist, die Balance, welche Muskelgruppe zu kurz kommt.":
    "The calendar shows how consistent you are, the balance which muscle group is falling behind.",
  "Dazu Tagestracker, die du selbst zusammenstellst – Kreatin, Wasser, Schlaf, Stimmung. Nur was du auswählst, taucht auf.":
    "Plus daily trackers you put together yourself – creatine, water, sleep, mood. Only what you pick shows up.",
  "Deine Daten gehören dir": "Your data is yours",
  "Weil nichts in einer Cloud liegt, hängt alles an diesem Gerät. Mach gelegentlich ein Backup über die Einstellungen.":
    "Because nothing lives in a cloud, everything hangs on this device. Make a backup now and then via the settings.",
  "Damit holst du alles zurück – auch auf einem neuen Handy.":
    "With it you get everything back – on a new phone as well.",

  /* ── Coach: Plan ── */
  "Trainingsplan vom Coach": "Training plan from the coach",
  "Ein paar Fragen, dann ein Plan – der alte bleibt erhalten":
    "A few questions, then a plan – your old one is kept",
  "Starten": "Start",
  "{n} von {gesamt}": "{n} of {gesamt}",
  "Nichts davon": "None of these",
  "Dein Plan": "Your plan",
  "Antworten ändern": "Change answers",
  "Plan übernehmen": "Use this plan",
  "{n}×": "{n}×",
  "Plan übernommen – viel Erfolg!": "Plan applied – good luck!",
  "{tage} Einheiten pro Woche · {saetze} Sätze insgesamt · Pause {pause}":
    "{tage} sessions per week · {saetze} sets in total · rest {pause}",
  "Ein Startpunkt, kein Gesetz: Du kannst jedes Training später umbauen, Übungen tauschen und Sätze ändern. Bei Schmerzen frag jemanden, der dich ansehen kann – der Coach kann das nicht.":
    "A starting point, not a law: you can rebuild every workout later, swap exercises and change sets. If something hurts, ask someone who can actually look at you – the coach cannot.",

  "Was willst du erreichen?": "What do you want to achieve?",
  "Muskeln aufbauen": "Build muscle",
  "Mehr Volumen auf den großen Übungen": "More volume on the big lifts",
  "Stärker werden": "Get stronger",
  "Wenige schwere Sätze, lange Pausen": "Few heavy sets, long rests",
  "Abnehmen, Kraft halten": "Lose fat, keep strength",
  "Kompakte Einheiten mit Cardio am Ende": "Compact sessions with cardio at the end",
  "Fit und gesund bleiben": "Stay fit and healthy",
  "Ganzkörper, moderat, ohne Druck": "Full body, moderate, no pressure",
  "Wie lange trainierst du schon?": "How long have you been training?",
  "Ich fange gerade an": "I am just starting",
  "Weniger als ein halbes Jahr": "Less than six months",
  "Ein bis zwei Jahre": "One to two years",
  "Länger als zwei Jahre": "More than two years",
  "Wie viele Tage pro Woche?": "How many days per week?",
  "Lieber ehrlich zu wenig als ambitioniert zu viel – der Plan ist nur so gut, wie du ihn durchhältst.":
    "Better honestly too few than ambitiously too many – a plan is only as good as your ability to stick to it.",
  "2 Tage": "2 days",
  "3 Tage": "3 days",
  "4 Tage": "4 days",
  "5 Tage": "5 days",
  "Zwei Ganzkörper-Einheiten": "Two full-body sessions",
  "Der Klassiker": "The classic",
  "Oberkörper und Beine je zweimal": "Upper body and legs twice each",
  "Für Erfahrene mit Zeit": "For experienced lifters with time",
  "Wo trainierst du?": "Where do you train?",
  "Im Studio": "At the gym",
  "Maschinen, Kabelzüge, alles da": "Machines, cables, everything available",
  "Zu Hause mit Gewichten": "At home with weights",
  "Hanteln, Stange, Bank": "Dumbbells, barbell, bench",
  "Nur mit dem eigenen Körper": "Bodyweight only",
  "Ohne Geräte": "No equipment",
  "Wie viel Zeit hast du je Einheit?": "How much time per session?",
  "Etwa 30 Minuten": "About 30 minutes",
  "Etwa 45 Minuten": "About 45 minutes",
  "Etwa eine Stunde": "About an hour",
  "Mehr als eine Stunde": "More than an hour",
  "Vier Übungen": "Four exercises",
  "Fünf Übungen": "Five exercises",
  "Sechs Übungen": "Six exercises",
  "Sieben Übungen": "Seven exercises",
  "Worauf sollen wir Rücksicht nehmen?": "What should we work around?",
  "Mehrfachauswahl. Übungen, die dort typischerweise Ärger machen, lässt der Plan weg.":
    "Multiple choice. The plan leaves out exercises that typically cause trouble there.",
  "Ohne Kreuzheben und vorgebeugtes Rudern": "No deadlifts or bent-over rows",
  "Ohne tiefe Kniebeugen und Ausfallschritte": "No deep squats or lunges",
  "Ohne Überkopfdrücken und Dips": "No overhead pressing or dips",

  /* ── Coach: Splits und Einheiten ── */
  "Ganzkörper 2×": "Full body 2×",
  "Ganzkörper 3×": "Full body 3×",
  "Ganzkörper A": "Full body A",
  "Ganzkörper B": "Full body B",
  "Ganzkörper C": "Full body C",
  "Oberkörper / Beine": "Upper / Lower",
  "Oberkörper": "Upper body",
  "Oberkörper A": "Upper body A",
  "Oberkörper B": "Upper body B",
  "Beine": "Legs",
  "Beine A": "Legs A",
  "Beine B": "Legs B",
  "Beine extra": "Legs extra",
  "Push": "Push",
  "Pull": "Pull",
  "Push / Pull / Beine + Oberkörper / Beine": "Push / Pull / Legs + Upper / Lower",

  /* ── Muskelgruppen ── */
  "Brust": "Chest",
  "Rücken": "Back",
  "Schultern": "Shoulders",
  "Nacken": "Neck",
  "Bizeps": "Biceps",
  "Trizeps": "Triceps",
  "Unterarme": "Forearms",
  "Bauch": "Abs",
  "Quadrizeps": "Quads",
  "Beinbeuger": "Hamstrings",
  "Po": "Glutes",
  "Adduktoren": "Adductors",
  "Abduktoren": "Abductors",
  "Waden": "Calves",
  "Ganzkörper": "Full body",
  "Cardio": "Cardio",

  /* ── Geräte ── */
  "Langhantel": "Barbell",
  "Kurzhantel": "Dumbbell",
  "SZ-Stange": "EZ bar",
  "Kettlebell": "Kettlebell",
  "Kabelzug": "Cable",
  "Maschine": "Machine",
  "Smith-Maschine": "Smith machine",
  "Körpergewicht": "Bodyweight",
  "Cardiogerät": "Cardio machine",
  "Sonstiges": "Other",

  /* ── Erfassungsarten ── */
  "Gewicht × Wdh.": "Weight × reps",
  "Wdh.": "reps",

  /* ── Beispielplan beim ersten Start ── */
  "Push / Pull / Beine": "Push / Pull / Legs",
  "Push (Brust, Schultern, Trizeps)": "Push (chest, shoulders, triceps)",
  "Pull (Rücken, Bizeps)": "Pull (back, biceps)",
  "Beine & Bauch": "Legs & abs",
};

/* ═══════════════ Wörterbuch: Übungen ═══════════════ */

const EN_UEBUNG = {
  // Brust
  "bankdruecken-lh": "Bench Press (Barbell)",
  "schraegbank-lh": "Incline Bench Press (Barbell)",
  "negativbank-lh": "Decline Bench Press (Barbell)",
  "bankdruecken-kh": "Bench Press (Dumbbells)",
  "schraegbank-kh": "Incline Press (Dumbbells)",
  "bankdruecken-smith": "Bench Press (Smith Machine)",
  "fliegende-kh": "Flyes (Dumbbells)",
  "fliegende-schraeg": "Incline Flyes (Dumbbells)",
  "butterfly": "Pec Deck (Machine)",
  "cable-fly": "Cable Fly",
  "brustpresse": "Chest Press (Machine)",
  "liegestuetze": "Push-Ups",
  "liegestuetze-erhoeht": "Push-Ups (Feet Elevated)",
  "dips": "Dips",
  "dips-gewicht": "Dips (Weighted)",
  "ueberzuege-kh": "Pullover (Dumbbell)",
  // Rücken
  "klimmzuege": "Pull-Ups",
  "klimmzuege-untergriff": "Chin-Ups",
  "klimmzuege-gewicht": "Pull-Ups (Weighted)",
  "latzug-breit": "Lat Pulldown (Wide Grip)",
  "latzug-eng": "Lat Pulldown (Close Grip)",
  "rudern-lh": "Barbell Row",
  "rudern-kh": "Dumbbell Row (One Arm)",
  "rudern-kabel": "Seated Cable Row",
  "rudern-tbar": "T-Bar Row",
  "rudern-maschine": "Row (Machine)",
  "kreuzheben": "Deadlift",
  "rack-pulls": "Rack Pulls",
  "hyperextensions": "Hyperextensions (Back Extension)",
  "straight-arm-pulldown": "Straight-Arm Pulldown",
  "muscle-ups": "Muscle-Ups",
  // Nacken
  "shrugs-lh": "Shrugs (Barbell)",
  "shrugs-kh": "Shrugs (Dumbbells)",
  // Schultern
  "schulterdruecken-lh": "Overhead Press (Barbell)",
  "schulterdruecken-kh": "Shoulder Press (Dumbbells)",
  "schulterdruecken-maschine": "Shoulder Press (Machine)",
  "arnold-press": "Arnold Press",
  "push-press": "Push Press",
  "seitheben-kh": "Lateral Raise (Dumbbells)",
  "seitheben-kabel": "Lateral Raise (Cable)",
  "seitheben-maschine": "Lateral Raise (Machine)",
  "frontheben": "Front Raise (Dumbbells)",
  "reverse-flys": "Reverse Flyes",
  "reverse-butterfly": "Reverse Pec Deck (Machine)",
  "face-pulls": "Face Pulls (Cable)",
  "aufrechtes-rudern": "Upright Row (Barbell)",
  // Bizeps
  "curls-lh": "Biceps Curls (Barbell)",
  "curls-sz": "Biceps Curls (EZ Bar)",
  "curls-kh": "Biceps Curls (Dumbbells)",
  "hammer-curls": "Hammer Curls (Dumbbells)",
  "schraegbank-curls": "Incline Curls (Dumbbells)",
  "konzentrations-curls": "Concentration Curls",
  "scott-curls": "Preacher Curls (EZ Bar)",
  "curls-kabel": "Biceps Curls (Cable)",
  "curls-maschine": "Biceps Curls (Machine)",
  // Trizeps
  "trizepsdruecken-kabel": "Triceps Pushdown (Cable)",
  "trizeps-seil": "Rope Pushdown (Cable)",
  "overhead-trizeps-kabel": "Overhead Triceps Extension (Cable)",
  "french-press": "Skull Crushers (EZ Bar)",
  "stirndruecken-kh": "Skull Crushers (Dumbbells)",
  "enges-bankdruecken": "Close-Grip Bench Press (Barbell)",
  "bench-dips": "Bench Dips",
  "kickbacks": "Triceps Kickbacks (Dumbbell)",
  "overhead-trizeps-kh": "Overhead Triceps Extension (Dumbbell)",
  "trizeps-maschine": "Triceps Machine (Dip Machine)",
  // Beine
  "kniebeugen": "Squats (Barbell)",
  "frontkniebeugen": "Front Squats (Barbell)",
  "kniebeugen-smith": "Squats (Smith Machine)",
  "goblet-squats": "Goblet Squats",
  "kniebeugen-kg": "Squats (Bodyweight)",
  "beinpresse": "Leg Press",
  "hackenschmidt": "Hack Squat (Machine)",
  "ausfallschritte": "Lunges (Dumbbells)",
  "walking-lunges": "Walking Lunges",
  "bulgarian-split-squats": "Bulgarian Split Squats",
  "beinstrecker": "Leg Extension (Machine)",
  "beinbeuger-liegend": "Lying Leg Curl (Machine)",
  "beinbeuger-sitzend": "Seated Leg Curl (Machine)",
  "rdl": "Romanian Deadlift (Barbell)",
  "rdl-kh": "Romanian Deadlift (Dumbbells)",
  "sumo-kreuzheben": "Sumo Deadlift",
  "step-ups": "Step-Ups (Dumbbells)",
  "nordic-curls": "Nordic Hamstring Curls",
  "good-mornings": "Good Mornings (Barbell)",
  "glute-ham-raise": "Glute-Ham Raise",
  "beinbeuger-stehend": "Standing Leg Curl (Machine)",
  "adduktoren": "Adductor Machine",
  "sumo-kniebeuge": "Sumo Squat (Barbell)",
  "adduktion-kabel": "Cable Adduction",
  "cossack-squats": "Cossack Squats",
  "seitliche-ausfallschritte": "Lateral Lunges",
  "abduktoren": "Abductor Machine",
  "abduktion-kabel": "Cable Abduction",
  "beinheben-seitlich": "Side Leg Raise (Lying)",
  "clamshells": "Clamshells",
  "monster-walk": "Monster Walk (Mini Band)",
  "pistol-squats": "Pistol Squats",
  "wandsitz": "Wall Sit",
  // Po
  "hip-thrusts": "Hip Thrusts (Barbell)",
  "hip-thrust-maschine": "Hip Thrust (Machine)",
  "glute-bridge": "Glute Bridge",
  "kickbacks-kabel": "Glute Kickbacks (Cable)",
  "hip-thrust-einbeinig": "Hip Thrust (Single Leg)",
  "rdl-einbeinig": "Romanian Deadlift (Single Leg)",
  "rueckwaerts-ausfallschritte": "Reverse Lunges",
  // Waden
  "wadenheben-stehend": "Standing Calf Raise",
  "wadenheben-sitzend": "Seated Calf Raise (Machine)",
  "wadenheben-beinpresse": "Calf Press (Leg Press)",
  "wadenheben-kh": "Calf Raise (Dumbbells)",
  "eselwadenheben": "Donkey Calf Raise",
  // Bauch
  "crunches": "Crunches",
  "situps": "Sit-Ups",
  "beinheben-haengend": "Hanging Leg Raise",
  "beinheben-liegend": "Lying Leg Raise",
  "knieheben-dip": "Knee Raise (Captain's Chair)",
  "plank": "Plank",
  "seitstuetz": "Side Plank",
  "russian-twists": "Russian Twists",
  "cable-crunches": "Cable Crunches",
  "bauchmaschine": "Ab Machine (Crunch Machine)",
  "ab-roller": "Ab Wheel Rollout",
  "mountain-climbers": "Mountain Climbers",
  "dead-bug": "Dead Bug",
  "hollow-hold": "Hollow Hold",
  // Unterarme
  "wrist-curls": "Wrist Curls (Barbell)",
  "reverse-curls": "Reverse Curls (EZ Bar)",
  "farmers-walk": "Farmer's Walk",
  "dead-hang": "Dead Hang",
  // Ganzkörper
  "kb-swings": "Kettlebell Swings",
  "thrusters": "Thrusters (Barbell)",
  "power-clean": "Power Clean",
  "clean-press": "Clean & Press",
  "snatch": "Snatch",
  "burpees": "Burpees",
  "wall-balls": "Wall Balls",
  "sled-push": "Sled Push",
  "turkish-getup": "Turkish Get-Up (Kettlebell)",
  "box-jumps": "Box Jumps",
  "stretching": "Stretching",
  // Cardio
  "laufband": "Treadmill",
  "laufen": "Running (Outdoors)",
  "gehen": "Walking",
  "ergometer": "Exercise Bike",
  "radfahren": "Cycling (Outdoors)",
  "crosstrainer": "Elliptical",
  "rudergeraet": "Rowing Machine",
  "stairmaster": "Stairmaster",
  "seilspringen": "Jump Rope",
  "schwimmen": "Swimming",
  "assault-bike": "Assault Bike",
  "hiit": "HIIT Session",
};

/* ═══════════════ Wörterbuch: Grundvorrat ═══════════════ */

const EN_ESSEN = {
  "b-haferflocken": "Rolled oats",
  "b-magerquark": "Quark, low fat",
  "b-quark20": "Quark 20 %",
  "b-skyr": "Skyr, plain",
  "b-joghurt35": "Yoghurt, plain 3.5 %",
  "b-huettenkaese": "Cottage cheese",
  "b-frischkaese": "Cream cheese",
  "b-milch35": "Whole milk 3.5 %",
  "b-milch15": "Milk 1.5 %",
  "b-gouda": "Gouda, medium",
  "b-feta": "Feta",
  "b-mozzarella": "Mozzarella",
  "b-ei": "Egg",
  "b-haehnchenbrust": "Chicken breast, raw",
  "b-putenbrust": "Turkey breast, raw",
  "b-hack-rind-mager": "Beef mince, lean (5 %)",
  "b-schwein-schnitzel": "Pork escalope, raw",
  "b-lachs": "Salmon fillet",
  "b-thunfisch-wasser": "Tuna in water",
  "b-garnelen": "Prawns",
  "b-kochschinken": "Cooked ham",
  "b-salami": "Salami",
  "b-tofu": "Tofu, plain",
  "b-linsen-trocken": "Lentils, dried",
  "b-kichererbsen-dose": "Chickpeas, canned",
  "b-kidneybohnen-dose": "Kidney beans, canned",
  "b-reis-roh": "Rice, raw",
  "b-reis-gekocht": "Rice, cooked",
  "b-nudeln-roh": "Pasta, raw",
  "b-nudeln-vk-roh": "Wholemeal pasta, raw",
  "b-kartoffeln": "Potatoes",
  "b-suesskartoffel": "Sweet potato",
  "b-pommes-ofen": "Oven chips",
  "b-brot-vk": "Wholemeal bread",
  "b-toast": "Toast bread",
  "b-broetchen": "Bread roll, wheat",
  "b-reiswaffel": "Rice cake",
  "b-mehl405": "Plain flour",
  "b-banane": "Banana",
  "b-apfel": "Apple",
  "b-orange": "Orange",
  "b-blaubeeren": "Blueberries",
  "b-erdbeeren": "Strawberries",
  "b-weintrauben": "Grapes",
  "b-avocado": "Avocado",
  "b-brokkoli": "Broccoli",
  "b-paprika": "Pepper, red",
  "b-tomate": "Tomato",
  "b-gurke": "Cucumber",
  "b-zucchini": "Courgette",
  "b-karotte": "Carrot",
  "b-spinat": "Spinach, fresh",
  "b-zwiebel": "Onion",
  "b-olivenoel": "Olive oil",
  "b-rapsoel": "Rapeseed oil",
  "b-butter": "Butter",
  "b-mandeln": "Almonds",
  "b-walnuesse": "Walnuts",
  "b-erdnussbutter": "Peanut butter",
  "b-whey": "Whey protein powder",
  "b-eiweissriegel": "Protein bar",
  "b-honig": "Honey",
  "b-zucker": "Sugar",
  "b-ketchup": "Ketchup",
  "b-mayonnaise": "Mayonnaise",
  "b-schoko70": "Dark chocolate 70 %",
  "b-schoko-vollmilch": "Milk chocolate",
  "b-gummibaerchen": "Gummy sweets",
  "b-chips": "Crisps",
  "b-pizza-salami": "Pizza salami, frozen",
  "b-cola": "Cola",
  "b-cola-zero": "Cola Zero",
  "b-orangensaft": "Orange juice",
  "b-bier": "Beer",
  "b-wein-rot": "Red wine",
  "b-kaffee": "Coffee, black",
};

/* ═══════════════ Wörterbuch: Portionen ═══════════════ */

const EN_PORTION = {
  "Portion": "serving",
  "Becher": "pot",
  "Glas": "glass",
  "Glas (0,5 l)": "glass (0.5 l)",
  "Tasse": "cup",
  "Scheibe": "slice",
  "Ei (M)": "egg (M)",
  "Filet": "fillet",
  "Dose": "can",
  "Brötchen": "roll",
  "Waffel": "cake",
  "Banane": "banana",
  "Apfel": "apple",
  "Orange": "orange",
  "halbe Avocado": "half an avocado",
  "Esslöffel": "tablespoon",
  "Teelöffel": "teaspoon",
  "Handvoll": "handful",
  "Riegel": "bar",
  "Tüte": "bag",
  "Pizza": "pizza",
};

/* Monatskürzel für die Diagrammachsen. toLocaleDateString liefert sie zwar
   auch, aber hier sollen sie garantiert dreistellig und ohne Punkt sein. */
const MONATE_KURZ = {
  de: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};
const monatKurz = (i) => (MONATE_KURZ[SPRACHE] || MONATE_KURZ.de)[i];
