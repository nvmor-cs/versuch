// Lumora – Einstieg
//
// Zwei Dinge, die beim allerersten Start zusammengehören:
//
// 1. Die Einführung erklärt in wenigen Seiten, was die App kann und wie man
//    sie bedient. Bewusst kurz und ohne Zwang – überspringen geht jederzeit,
//    und über die Einstellungen kommt sie zurück.
//
// 2. Der Coach stellt danach ein paar Fragen und baut daraus einen
//    Basistrainingsplan. Wer neu ist, steht sonst vor einer leeren App und
//    soll sich einen Plan aus 150 Übungen selbst zusammenstellen – das ist die
//    Stelle, an der die meisten aufgeben.
//
// Der Plan ist ein Startpunkt, kein Dogma: Er landet als ganz normaler Plan in
// der App und lässt sich danach wie jeder andere umbauen.

"use strict";

/* ═══════════════ Einführung ═══════════════ */

const EINSTIEG_SEITEN = [
  {
    ic: "trophy",
    titel: "Willkommen bei Lumora",
    zeilen: [
      "Deine App für Training, Ernährung und Gesundheit – in einem.",
      "Alles bleibt auf diesem Gerät. Kein Konto, keine Anmeldung, kein Server.",
    ],
  },
  {
    ic: "grip",
    titel: "Drei Welten, eine Leiste",
    zeilen: [
      "Unten sitzt eine Pille mit den Reitern. Wisch darüber, und du wechselst zwischen Training, Ernährung und Gesundheit.",
      "Die drei Punkte darüber zeigen, wo du bist – antippen geht auch. Es läuft im Kreis, du kannst nicht falsch wischen.",
    ],
  },
  {
    ic: "dumbbell",
    titel: "Training",
    zeilen: [
      "Ein Plan bündelt mehrere Trainings – etwa Push, Pull und Beine. Vom Start-Tab aus startest du eines davon.",
      "Dann hakst du Satz für Satz ab. Gewicht und Wiederholungen sind mit den Werten vom letzten Mal vorbelegt, die Pause läuft von allein.",
      "Rekorde erkennt die App selbst, und der Coach sagt hinterher kurz, was ihm aufgefallen ist.",
    ],
  },
  {
    ic: "apple",
    titel: "Ernährung",
    zeilen: [
      "Ein Tagebuch mit vier Mahlzeiten. Such ein Lebensmittel, scanne den Barcode oder leg es selbst an.",
      "Deine Ziele setzt du als Kalorien plus Anteile – 30 % Eiweiß bleiben 30 %, egal wie du die Kalorien änderst.",
    ],
  },
  {
    ic: "scale",
    titel: "Gesundheit",
    zeilen: [
      "Gewicht mit gleitendem Wochenschnitt: Ein einzelner Morgen sagt nichts, die Linie schon.",
      "Der Kalender zeigt, wie regelmäßig du dabei bist, die Balance, welche Muskelgruppe zu kurz kommt.",
      "Dazu Tagestracker, die du selbst zusammenstellst – Kreatin, Wasser, Schlaf, Stimmung. Nur was du auswählst, taucht auf.",
    ],
  },
  {
    ic: "download",
    titel: "Deine Daten gehören dir",
    zeilen: [
      "Weil nichts in einer Cloud liegt, hängt alles an diesem Gerät. Mach gelegentlich ein Backup über die Einstellungen.",
      "Damit holst du alles zurück – auch auf einem neuen Handy.",
    ],
  },
];

let einstiegSeite = 0;

function einstiegZeigen() {
  einstiegSeite = 0;
  const ov = openOverlay("", "einstieg-ov");
  ov.zurueck = () => { if (!einstiegBlaettern(-1)) einstiegSchliessen(); };
  einstiegZeichnen();
  wischenVerbinden(ov, {
    pane: () => $("#einstieg-seite"),
    amRand: (r) => einstiegSeite + r < 0 || einstiegSeite + r >= EINSTIEG_SEITEN.length,
    blaettern: einstiegBlaettern,
  });
}

function einstiegBlaettern(richtung) {
  const ziel = einstiegSeite + richtung;
  if (ziel < 0 || ziel >= EINSTIEG_SEITEN.length) return false;
  einstiegSeite = ziel;
  einstiegZeichnen();
  paneEinblenden($("#einstieg-seite"), richtung);
  return true;
}

function einstiegZeichnen() {
  const ov = $(".einstieg-ov");
  if (!ov) return;
  const s = EINSTIEG_SEITEN[einstiegSeite];
  const letzte = einstiegSeite === EINSTIEG_SEITEN.length - 1;
  $(".overlay-inner", ov).innerHTML = `
    <div class="einstieg-kopf">
      <div class="wordmark">${logoSvg()}Lumora</div>
      ${letzte ? "" : `<button class="btn-link" data-action="einstieg-fertig">${tr("Überspringen")}</button>`}
    </div>
    <div class="einstieg-seite" id="einstieg-seite">
      <div class="einstieg-bild">${icon(s.ic)}</div>
      <h2>${esc(tr(s.titel))}</h2>
      ${s.zeilen.map((z) => `<p>${esc(tr(z))}</p>`).join("")}
    </div>
    <div class="einstieg-fuss">
      <div class="einstieg-punkte" role="tablist" aria-label="${tr("Seite")}">
        ${EINSTIEG_SEITEN.map((_, i) => `
          <button class="einstieg-punkt ${i === einstiegSeite ? "active" : ""}" data-action="einstieg-punkt"
                  data-i="${i}" aria-label="${esc(tr("Seite {n}", { n: i + 1 }))}"
                  aria-selected="${i === einstiegSeite}" role="tab"></button>`).join("")}
      </div>
      ${letzte ? `
        <button class="btn" data-action="einstieg-coach">${icon("trophy")} ${tr("Plan vom Coach erstellen")}</button>
        <button class="btn btn-ghost" data-action="einstieg-fertig">${tr("Erstmal selbst umschauen")}</button>`
        : `<button class="btn" data-action="einstieg-weiter">${tr("Weiter")}</button>`}
    </div>`;
}

ACTIONS["einstieg-weiter"] = () => einstiegBlaettern(1);
ACTIONS["einstieg-punkt"] = (el) => {
  const ziel = +el.dataset.i;
  if (ziel !== einstiegSeite) einstiegBlaettern(ziel - einstiegSeite);
};

/* Gesehen ist gesehen – auch wer überspringt, soll die Einführung nicht bei
   jedem Start wieder vorfinden. Zurückholen kann man sie in den Einstellungen. */
function einstiegSchliessen() {
  DB.settings.eingefuehrt = true;
  saveDB();
  $(".einstieg-ov")?.remove();
  render();
}
ACTIONS["einstieg-fertig"] = () => einstiegSchliessen();
ACTIONS["einstieg-coach"] = () => { einstiegSchliessen(); coachStarten(); };
ACTIONS["einstieg-nochmal"] = () => { $$(".backdrop").forEach((b) => b.remove()); einstiegZeigen(); };

/* ═══════════════ Coach: die Fragen ═══════════════

   Sechs Fragen, eine je Bildschirm. Mehr wäre ein Formular, weniger würde
   raten. Jede Antwort verändert den Plan an einer klar benennbaren Stelle –
   deshalb steht unter jeder Option, was sie bedeutet. */

const COACH_FRAGEN = [
  {
    id: "ziel", frage: "Was willst du erreichen?", art: "eine",
    optionen: [
      { id: "muskel", label: "Muskeln aufbauen", sub: "Mehr Volumen auf den großen Übungen" },
      { id: "kraft", label: "Stärker werden", sub: "Wenige schwere Sätze, lange Pausen" },
      { id: "abnehmen", label: "Abnehmen, Kraft halten", sub: "Kompakte Einheiten mit Cardio am Ende" },
      { id: "fit", label: "Fit und gesund bleiben", sub: "Ganzkörper, moderat, ohne Druck" },
    ],
  },
  {
    id: "erfahrung", frage: "Wie lange trainierst du schon?", art: "eine",
    optionen: [
      { id: "anfang", label: "Ich fange gerade an", sub: "Weniger als ein halbes Jahr" },
      { id: "mittel", label: "Ein bis zwei Jahre" },
      { id: "erfahren", label: "Länger als zwei Jahre" },
    ],
  },
  {
    id: "tage", frage: "Wie viele Tage pro Woche?", art: "eine",
    hinweis: "Lieber ehrlich zu wenig als ambitioniert zu viel – der Plan ist nur so gut, wie du ihn durchhältst.",
    optionen: [
      { id: "2", label: "2 Tage", sub: "Zwei Ganzkörper-Einheiten" },
      { id: "3", label: "3 Tage", sub: "Der Klassiker" },
      { id: "4", label: "4 Tage", sub: "Oberkörper und Beine je zweimal" },
      { id: "5", label: "5 Tage", sub: "Für Erfahrene mit Zeit" },
    ],
  },
  {
    id: "ort", frage: "Wo trainierst du?", art: "eine",
    optionen: [
      { id: "studio", label: "Im Studio", sub: "Maschinen, Kabelzüge, alles da" },
      { id: "home", label: "Zu Hause mit Gewichten", sub: "Hanteln, Stange, Bank" },
      { id: "koerper", label: "Nur mit dem eigenen Körper", sub: "Ohne Geräte" },
    ],
  },
  {
    id: "zeit", frage: "Wie viel Zeit hast du je Einheit?", art: "eine",
    optionen: [
      { id: "30", label: "Etwa 30 Minuten", sub: "Vier Übungen" },
      { id: "45", label: "Etwa 45 Minuten", sub: "Fünf Übungen" },
      { id: "60", label: "Etwa eine Stunde", sub: "Sechs Übungen" },
      { id: "90", label: "Mehr als eine Stunde", sub: "Sieben Übungen" },
    ],
  },
  {
    id: "ruecksicht", frage: "Worauf sollen wir Rücksicht nehmen?", art: "mehrere",
    hinweis: "Mehrfachauswahl. Übungen, die dort typischerweise Ärger machen, lässt der Plan weg.",
    optionen: [
      { id: "ruecken", label: "Rücken", sub: "Ohne Kreuzheben und vorgebeugtes Rudern" },
      { id: "knie", label: "Knie", sub: "Ohne tiefe Kniebeugen und Ausfallschritte" },
      { id: "schulter", label: "Schulter", sub: "Ohne Überkopfdrücken und Dips" },
    ],
  },
];

let coachAntworten = {};
let coachFrage = 0;

function coachStarten() {
  coachAntworten = {};
  coachFrage = 0;
  const ov = openOverlay("", "coach-ov");
  ov.zurueck = () => { if (coachFrage > 0) { coachFrage--; coachZeichnen(); } else ov.remove(); };
  coachZeichnen();
}

function coachZeichnen() {
  const ov = $(".coach-ov");
  if (!ov) return;
  const f = COACH_FRAGEN[coachFrage];
  const gewaehlt = coachAntworten[f.id];
  const mehrere = f.art === "mehrere";
  const anzahl = mehrere ? (gewaehlt || []).length : 0;
  $(".overlay-inner", ov).innerHTML = `
    <div class="overlay-head">
      <button class="icon-btn plain" data-action="coach-zurueck" aria-label="${tr("Zurück")}">${icon("chevL")}</button>
      <div class="screen-title">${tr("Coach")}</div>
      <span class="coach-zaehler">${esc(tr("{n} von {gesamt}", { n: coachFrage + 1, gesamt: COACH_FRAGEN.length }))}</span>
    </div>
    <div class="coach-balken"><i style="width:${((coachFrage + 1) / COACH_FRAGEN.length) * 100}%"></i></div>
    <h2 class="coach-frage">${esc(tr(f.frage))}</h2>
    ${f.hinweis ? `<p class="hint" style="margin:-6px 2px 14px">${esc(tr(f.hinweis))}</p>` : ""}
    ${f.optionen.map((o) => {
      const an = mehrere ? (gewaehlt || []).includes(o.id) : gewaehlt === o.id;
      return `
      <button class="row ${an ? "picked" : ""}" data-action="coach-antwort" data-f="${esc(f.id)}" data-o="${esc(o.id)}">
        <span class="pick-check">${icon("check")}</span>
        <span class="row-main">
          <span class="row-title">${esc(tr(o.label))}</span>
          ${o.sub ? `<span class="row-sub">${esc(tr(o.sub))}</span>` : ""}
        </span>
      </button>`;
    }).join("")}
    ${mehrere ? `<button class="btn" data-action="coach-weiter" style="margin-top:14px">
      ${anzahl ? tr("Weiter") : tr("Nichts davon")}</button>` : ""}`;
}

ACTIONS["coach-zurueck"] = () => {
  if (coachFrage > 0) { coachFrage--; coachZeichnen(); return; }
  $(".coach-ov")?.remove();
};

ACTIONS["coach-antwort"] = (el) => {
  const f = COACH_FRAGEN.find((x) => x.id === el.dataset.f);
  if (!f) return;
  tippen();
  if (f.art === "mehrere") {
    const liste = coachAntworten[f.id] || (coachAntworten[f.id] = []);
    const i = liste.indexOf(el.dataset.o);
    if (i < 0) liste.push(el.dataset.o); else liste.splice(i, 1);
    coachZeichnen();
    return;
  }
  coachAntworten[f.id] = el.dataset.o;
  // Bei einer einzelnen Antwort geht es von selbst weiter – ein „Weiter" nach
  // jeder Auswahl wäre ein Tipp zu viel
  ACTIONS["coach-weiter"]();
};

ACTIONS["coach-weiter"] = () => {
  if (coachFrage < COACH_FRAGEN.length - 1) {
    coachFrage++;
    coachZeichnen();
    paneEinblenden($(".coach-ov .overlay-inner"), 1);
    return;
  }
  coachVorschau(planBauen(coachAntworten));
};

/* ═══════════════ Coach: der Plan ═══════════════ */

// Was an welchem Ort zur Verfügung steht. null heißt: alles.
const COACH_GERAETE = {
  studio: null,
  home: ["Langhantel", "Kurzhantel", "SZ-Stange", "Kettlebell", "Körpergewicht", "Sonstiges"],
  koerper: ["Körpergewicht", "Sonstiges"],
};

/* Übungen, die bei Beschwerden erfahrungsgemäß als Erste Ärger machen. Das ist
   eine Vorsichtsmaßnahme und keine Diagnose – deshalb steht der Hinweis auch
   in der Vorschau: Wer Schmerzen hat, fragt jemanden, der hinsehen kann. */
const COACH_MEIDEN = {
  ruecken: ["kreuzheben", "rack-pulls", "sumo-kreuzheben", "rudern-lh", "rudern-tbar",
            "good-mornings", "rdl", "power-clean", "clean-press", "snatch", "thrusters"],
  knie: ["kniebeugen", "frontkniebeugen", "kniebeugen-smith", "hackenschmidt", "ausfallschritte",
         "walking-lunges", "bulgarian-split-squats", "pistol-squats", "box-jumps", "burpees",
         "seitliche-ausfallschritte", "cossack-squats", "rueckwaerts-ausfallschritte", "step-ups"],
  schulter: ["schulterdruecken-lh", "push-press", "aufrechtes-rudern", "dips", "dips-gewicht",
             "arnold-press", "snatch", "thrusters", "negativbank-lh"],
};

/* Je Muskelgruppe eine Reihenfolge von grundlegend nach ergänzend. Der Plan
   nimmt die erste Übung, die zum Ort passt und nicht gemieden wird – so
   stehen die großen Übungen vorn und die Feinarbeit hinten. */
const COACH_AUSWAHL = {
  "Brust": ["bankdruecken-lh", "bankdruecken-kh", "liegestuetze", "schraegbank-kh", "brustpresse", "butterfly", "cable-fly", "dips", "liegestuetze-erhoeht"],
  "Rücken": ["klimmzuege", "latzug-breit", "rudern-lh", "rudern-kabel", "rudern-kh", "rudern-maschine", "latzug-eng", "klimmzuege-untergriff", "hyperextensions"],
  "Schultern": ["schulterdruecken-kh", "schulterdruecken-lh", "schulterdruecken-maschine", "seitheben-kh", "seitheben-kabel", "reverse-flys", "face-pulls", "frontheben"],
  "Nacken": ["shrugs-kh", "shrugs-lh"],
  "Bizeps": ["curls-sz", "curls-kh", "curls-lh", "hammer-curls", "curls-kabel", "schraegbank-curls", "klimmzuege-untergriff"],
  "Trizeps": ["trizepsdruecken-kabel", "enges-bankdruecken", "french-press", "trizeps-seil", "overhead-trizeps-kh", "bench-dips", "stirndruecken-kh"],
  "Bauch": ["plank", "beinheben-liegend", "crunches", "cable-crunches", "russian-twists", "beinheben-haengend", "ab-roller", "situps", "hollow-hold", "mountain-climbers"],
  "Quadrizeps": ["kniebeugen", "beinpresse", "goblet-squats", "hackenschmidt", "ausfallschritte", "beinstrecker", "bulgarian-split-squats", "kniebeugen-kg", "pistol-squats", "wandsitz"],
  "Beinbeuger": ["rdl", "beinbeuger-liegend", "rdl-kh", "beinbeuger-sitzend", "nordic-curls", "glute-ham-raise", "good-mornings"],
  "Po": ["hip-thrusts", "glute-bridge", "hip-thrust-maschine", "rdl-einbeinig", "kickbacks-kabel", "hip-thrust-einbeinig", "rueckwaerts-ausfallschritte"],
  "Waden": ["wadenheben-stehend", "wadenheben-sitzend", "wadenheben-kh", "wadenheben-beinpresse", "eselwadenheben"],
  "Adduktoren": ["adduktoren", "sumo-kniebeuge", "adduktion-kabel", "cossack-squats"],
  "Abduktoren": ["abduktoren", "abduktion-kabel", "beinheben-seitlich", "monster-walk", "clamshells"],
  "Ganzkörper": ["kb-swings", "burpees", "thrusters"],
};

/* Die Reihenfolge der Muskelgruppen je Einheit. Länger als nötig: Fällt eine
   Gruppe wegen Ort oder Rücksicht aus, rückt die nächste nach. */
const COACH_MUSTER = {
  ganzA: ["Quadrizeps", "Brust", "Rücken", "Schultern", "Bauch", "Beinbeuger", "Bizeps", "Waden"],
  ganzB: ["Beinbeuger", "Rücken", "Brust", "Po", "Trizeps", "Bauch", "Waden", "Schultern"],
  ganzC: ["Quadrizeps", "Schultern", "Rücken", "Brust", "Bizeps", "Bauch", "Waden", "Po"],
  push: ["Brust", "Schultern", "Brust", "Trizeps", "Schultern", "Trizeps", "Bauch", "Nacken"],
  pull: ["Rücken", "Rücken", "Bizeps", "Rücken", "Nacken", "Bizeps", "Bauch", "Schultern"],
  beine: ["Quadrizeps", "Beinbeuger", "Po", "Quadrizeps", "Waden", "Bauch", "Adduktoren", "Abduktoren"],
  okA: ["Brust", "Rücken", "Schultern", "Rücken", "Bizeps", "Trizeps", "Bauch", "Nacken"],
  okB: ["Rücken", "Brust", "Schultern", "Brust", "Trizeps", "Bizeps", "Nacken", "Bauch"],
  ukA: ["Quadrizeps", "Beinbeuger", "Po", "Waden", "Bauch", "Adduktoren", "Quadrizeps", "Abduktoren"],
  ukB: ["Beinbeuger", "Quadrizeps", "Po", "Waden", "Abduktoren", "Bauch", "Beinbeuger", "Adduktoren"],
};

/* Der Split hängt an den Tagen – und bei drei Tagen an der Erfahrung: Wer
   anfängt, fährt mit drei Ganzkörper-Einheiten besser als mit Push/Pull/Beine,
   weil jede Bewegung dreimal in der Woche geübt wird. */
function coachSplit(tage, erfahrung, ort) {
  if (tage <= 2) {
    return { name: "Ganzkörper 2×", teile: [["Ganzkörper A", "ganzA"], ["Ganzkörper B", "ganzB"]] };
  }
  /* Ohne Geräte fehlen die Isolationsübungen: Ein Push-Tag käme auf drei
     Übungen, weil es für Schultern und Trizeps mit dem eigenen Körper kaum
     etwas gibt. Ganzkörper und Oberkörper/Beine tragen dagegen problemlos. */
  if (ort === "koerper") {
    return tage === 3
      ? { name: "Ganzkörper 3×", teile: [["Ganzkörper A", "ganzA"], ["Ganzkörper B", "ganzB"], ["Ganzkörper C", "ganzC"]] }
      : { name: "Oberkörper / Beine", teile: tage === 4
          ? [["Oberkörper A", "okA"], ["Beine A", "ukA"], ["Oberkörper B", "okB"], ["Beine B", "ukB"]]
          : [["Oberkörper A", "okA"], ["Beine A", "ukA"], ["Oberkörper B", "okB"], ["Beine B", "ukB"], ["Ganzkörper C", "ganzC"]] };
  }
  if (tage === 3) {
    return erfahrung === "anfang"
      ? { name: "Ganzkörper 3×", teile: [["Ganzkörper A", "ganzA"], ["Ganzkörper B", "ganzB"], ["Ganzkörper C", "ganzC"]] }
      : { name: "Push / Pull / Beine", teile: [["Push", "push"], ["Pull", "pull"], ["Beine", "beine"]] };
  }
  if (tage === 4) {
    return { name: "Oberkörper / Beine", teile: [["Oberkörper A", "okA"], ["Beine A", "ukA"], ["Oberkörper B", "okB"], ["Beine B", "ukB"]] };
  }
  return { name: "Push / Pull / Beine + Oberkörper / Beine",
           teile: [["Push", "push"], ["Pull", "pull"], ["Beine", "beine"], ["Oberkörper", "okB"], ["Beine extra", "ukB"]] };
}

const COACH_UEBUNGSZAHL = { 30: 4, 45: 5, 60: 6, 90: 7 };

/* Sätze: Anfänger fahren überall mit drei gut. Wer Kraft will, macht auf den
   ersten beiden Übungen mehr und kürzt hinten; beim Muskelaufbau liegt das
   Gewicht auf den ersten drei. */
function coachSaetze(ziel, erfahrung, index) {
  if (erfahrung === "anfang") return 3;
  if (ziel === "kraft") return index < 2 ? 5 : 3;
  if (ziel === "muskel") return index < 3 ? 4 : 3;
  return 3;
}

const COACH_PAUSE = { kraft: 180, muskel: 90, abnehmen: 60, fit: 90 };

function coachUebungWaehlen(muskel, erlaubt, gemieden, drin) {
  for (const id of COACH_AUSWAHL[muskel] || []) {
    if (drin.has(id) || gemieden.has(id)) continue;
    const ex = exById(id);
    if (!ex) continue;
    if (erlaubt && !erlaubt.includes(ex.equipment)) continue;
    return id;
  }
  return null;
}

/**
 * Baut aus den Antworten einen Plan.
 * Der Plan ist ein normaler Plan wie jeder andere – nichts daran ist besonders
 * oder gesperrt, er lässt sich anschließend umbauen, umbenennen und löschen.
 */
function planBauen(a) {
  const tage = parseInt(a.tage, 10) || 3;
  const erfahrung = a.erfahrung || "mittel";
  const ziel = a.ziel || "muskel";
  const erlaubt = COACH_GERAETE[a.ort] !== undefined ? COACH_GERAETE[a.ort] : null;
  const gemieden = new Set();
  for (const r of a.ruecksicht || []) (COACH_MEIDEN[r] || []).forEach((id) => gemieden.add(id));

  const split = coachSplit(tage, erfahrung, a.ort);
  const wieViele = COACH_UEBUNGSZAHL[a.zeit] || 6;

  const workouts = split.teile.map(([name, muster]) => {
    const drin = new Set();
    const uebungen = [];
    /* Bis zu drei Durchgänge durch dasselbe Muster. Der erste holt je Gruppe
       die grundlegendste Übung, die weiteren füllen mit der nächstbesten
       derselben Gruppen auf. So bleibt der Charakter der Einheit erhalten –
       ein Push-Tag füllt sich mit Drücken, nicht mit Kniebeugen. */
    for (let runde = 0; runde < 3 && uebungen.length < wieViele; runde++) {
      const vorher = uebungen.length;
      for (const muskel of COACH_MUSTER[muster]) {
        if (uebungen.length >= wieViele) break;
        const id = coachUebungWaehlen(muskel, erlaubt, gemieden, drin);
        if (!id) continue;
        drin.add(id);
        uebungen.push({ exerciseId: id, sets: coachSaetze(ziel, erfahrung, uebungen.length) });
      }
      if (uebungen.length === vorher) break;   // nichts mehr zu holen
    }
    // Notnagel: Bei „nur Körpergewicht" plus Rücksichten kann ein Muster leer
    // laufen. Dann füllt die App aus allem auf, was übrig ist – lieber vier
    // brauchbare Übungen als ein halbes Training.
    if (uebungen.length < Math.min(3, wieViele)) {
      for (const muskel of Object.keys(COACH_AUSWAHL)) {
        if (uebungen.length >= wieViele) break;
        const id = coachUebungWaehlen(muskel, erlaubt, gemieden, drin);
        if (!id) continue;
        drin.add(id);
        uebungen.push({ exerciseId: id, sets: coachSaetze(ziel, erfahrung, uebungen.length) });
      }
    }
    // Beim Abnehmen ein Cardio-Stück ans Ende – nach dem Krafttraining, nicht
    // davor, sonst leidet das Gewicht auf der Stange
    if (ziel === "abnehmen") {
      const cardio = ["rudergeraet", "ergometer", "crosstrainer", "laufband", "seilspringen", "laufen"]
        .find((id) => {
          const ex = exById(id);
          return ex && !drin.has(id) && (!erlaubt || erlaubt.includes(ex.equipment));
        });
      if (cardio) uebungen.push({ exerciseId: cardio, sets: 1 });
    }
    return { id: uid(), name: tr(name), exercises: uebungen };
  });

  return {
    id: uid(),
    name: tr(split.name),
    createdAt: Date.now(),
    workouts,
    // Nur für die Vorschau, wird nicht gespeichert
    _tage: tage,
    _pause: COACH_PAUSE[ziel] || 90,
  };
}

let coachPlan = null;

function coachVorschau(plan) {
  coachPlan = plan;
  const ov = $(".coach-ov");
  if (!ov) return;
  const saetze = plan.workouts.reduce((a, w) => a + w.exercises.reduce((b, e) => b + e.sets, 0), 0);
  $(".overlay-inner", ov).innerHTML = `
    <div class="overlay-head">
      <button class="icon-btn plain" data-action="coach-nochmal" aria-label="${tr("Zurück")}">${icon("chevL")}</button>
      <div class="screen-title">${tr("Dein Plan")}</div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div style="font-weight:900;font-size:18px;margin-bottom:4px">${esc(plan.name)}</div>
      <div class="hint">${esc(tr("{tage} Einheiten pro Woche · {saetze} Sätze insgesamt · Pause {pause}", {
        tage: plan._tage, saetze, pause: fmtClock(plan._pause) }))}</div>
    </div>
    ${plan.workouts.map((w) => `
      <div class="section-label">${esc(w.name)}</div>
      ${w.exercises.map((e) => `
        <div class="row" style="cursor:default">
          <span class="muscle-dot">${muscleIcon((exById(e.exerciseId) || {}).muscle || "Ganzkörper")}</span>
          <span class="row-main">
            <span class="row-title">${esc(exName(e.exerciseId))}</span>
            <span class="row-sub">${esc(tMuskel((exById(e.exerciseId) || {}).muscle || ""))}</span>
          </span>
          <span class="row-side"><b>${esc(tr("{n}×", { n: e.sets }))}</b></span>
        </div>`).join("")}`).join("")}
    <p class="hint" style="margin:16px 2px 0">${tr("Ein Startpunkt, kein Gesetz: Du kannst jedes Training später umbauen, Übungen tauschen und Sätze ändern. Bei Schmerzen frag jemanden, der dich ansehen kann – der Coach kann das nicht.")}</p>
    <div class="divider"></div>
    <button class="btn" data-action="coach-uebernehmen">${icon("check")} ${tr("Plan übernehmen")}</button>
    <button class="btn btn-ghost" data-action="coach-nochmal" style="margin-top:8px">${tr("Antworten ändern")}</button>`;
  ov.zurueck = () => ACTIONS["coach-nochmal"]();
  ov.querySelector(".overlay-inner").scrollTop = 0;
}

ACTIONS["coach-nochmal"] = () => {
  coachFrage = COACH_FRAGEN.length - 1;
  const ov = $(".coach-ov");
  if (ov) ov.zurueck = () => { if (coachFrage > 0) { coachFrage--; coachZeichnen(); } else ov.remove(); };
  coachZeichnen();
};

/* Übernehmen heißt: Der Plan wird der aktive, das Wochenziel im Kalender folgt
   den gewählten Tagen, und die Pausendauer passt zum Ziel. Alles drei kann man
   danach ändern – aber es soll gleich zusammenpassen. */
ACTIONS["coach-uebernehmen"] = () => {
  if (!coachPlan) return;
  const plan = { id: coachPlan.id, name: coachPlan.name, createdAt: coachPlan.createdAt, workouts: coachPlan.workouts };
  DB.plans.push(plan);
  DB.activePlanId = plan.id;
  DB.settings.restSecs = coachPlan._pause;
  saveDB();
  if (typeof GESUND === "object") {
    GESUND.wochenziel = Math.min(14, Math.max(1, coachPlan._tage));
    speichereGesund();
  }
  coachPlan = null;
  $(".coach-ov")?.remove();
  currentBereich = "training";
  currentTab = "home";
  render();
  toast(tr("Plan übernommen – viel Erfolg!"));
};

// Aus den Einstellungen heraus – der alte Plan bleibt dabei stehen, der neue
// kommt daneben und wird der aktive
ACTIONS["coach-plan"] = () => { $$(".backdrop").forEach((b) => b.remove()); coachStarten(); };

/* ═══════════════ Erster Start ═══════════════ */

// Nach dem ersten Zeichnen, damit die App dahinter schon steht und nicht
// hinter der Einführung noch aufgebaut wird
if (!DB.settings.eingefuehrt) setTimeout(einstiegZeigen, 250);
