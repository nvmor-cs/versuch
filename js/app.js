// Lumora – Training, Fortschritt, Gesundheit
// Vanilla JS, keine Abhängigkeiten. Daten liegen in localStorage.

"use strict";

const APP_NAME = "Lumora";
const APP_VERSION = "3.5.0";

// Wählbare Akzentfarben. Die Werte spiegeln die :root[data-accent="…"]-Blöcke
// im Stylesheet; hier stehen sie nur für die Farbpunkte in den Einstellungen.
const ACCENT_DEFAULT = "blau";
const ACCENTS = [
  { id: "blau",       name: "Blau",      dot: "#3b82f6", ink: "#ffffff" },
  { id: "gruen",      name: "Grün",      dot: "#22c55e", ink: "#06210f" },
  { id: "bernstein",  name: "Bernstein", dot: "#f59e0b", ink: "#1a1200" },
  { id: "rot",        name: "Rot",       dot: "#ef4444", ink: "#ffffff" },
  { id: "magenta",    name: "Magenta",   dot: "#ec4899", ink: "#ffffff" },
  { id: "weiss",      name: "Weiß",      dot: "#ffffff", ink: "#111827" },
];

// Die Marke: eine dreiblättrige Blüte – abstrakt für Wachstum und Vitalität.
// Dieselbe Geometrie rendert scripts/make-icons.py zu den App-Icons.
const LOGO_PETAL = "M50 10C78 23.6 70.56 38.4 50 44C37.44 38.4 42 23.6 50 10Z";
const logoSvg = () =>
  `<svg viewBox="0 0 100 100" class="logo" aria-hidden="true" fill="currentColor">` +
  [0, 120, 240].map((a) =>
    `<path d="${LOGO_PETAL}"${a ? ` transform="rotate(${a} 50 50)"` : ""}/>`).join("") +
  `</svg>`;

/* ═══════════════ Helpers ═══════════════ */

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// "82,5" → 82.5 ; leer → NaN
const parseNum = (s) => {
  const v = String(s ?? "").trim().replace(",", ".");
  return v === "" ? NaN : parseFloat(v);
};
const fmtKg = (n) =>
  Number.isFinite(n) ? n.toLocaleString(locale(), { maximumFractionDigits: 2 }) : "–";
const fmtVol = (n) => Math.round(n).toLocaleString(locale()) + " kg";
// Für Eingabefelder: das Dezimalzeichen der Sprache, damit die Zahl so
// dasteht, wie man sie eintippen würde
const fmtEingabe = (n) => String(n).replace(".", SPRACHE === "de" ? "," : ".");

// "1:30" oder "90" → Sekunden
const parseTimeStr = (s) => {
  const v = String(s ?? "").trim();
  if (!v) return NaN;
  if (v.includes(":")) {
    const p = v.split(":").map((x) => parseInt(x, 10));
    if (p.some((x) => !Number.isFinite(x))) return NaN;
    return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
  }
  const n = parseNum(v);
  return Number.isFinite(n) ? Math.round(n) : NaN;
};
const fmtClock = (secs) => {
  secs = Math.max(0, Math.round(secs));
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return (h > 0 ? h + ":" + mm : mm) + ":" + String(s).padStart(2, "0");
};
const fmtDur = (secs) => {
  const m = Math.round(secs / 60);
  if (m < 60) return m + " " + tr("Min.");
  return tr("{h} Std. {m} Min.", { h: Math.floor(m / 60), m: m % 60 });
};
const fmtDate = (ts) =>
  new Date(ts).toLocaleDateString(locale(), { weekday: "short", day: "numeric", month: "short" });
const fmtDateShort = (ts) =>
  new Date(ts).toLocaleDateString(locale(), { day: "numeric", month: "numeric" });

const weekStart = (ts) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Montag
  return d.getTime();
};

// Piktogramme der Muskelgruppen: Körperteil mit hervorgehobenem Muskel.
// Die Figuren stehen in js/muscle-icons.js.
const muscleIcon = (m) => muskelSvg(m);

/* ═══════════════ Icons ═══════════════ */

const I = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  plans: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 9h6M9 13h6M9 17h4"/>',
  dumbbell: '<path d="M2 12h2M20 12h2M8.5 12h7"/><rect x="4.5" y="7" width="3.5" height="10" rx="1"/><rect x="16" y="7" width="3.5" height="10" rx="1"/>',
  history: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M4 12.5 9.5 18 20 6.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  chevR: '<path d="m9 5 7 7-7 7"/>',
  chevL: '<path d="m15 5-7 7 7 7"/>',
  chevD: '<path d="m5 9 7 7 7-7"/>',
  chevU: '<path d="m19 15-7-7-7 7"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  edit: '<path d="M4 20h4L20 8l-4-4L4 16v4z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9.5V13l2.5 2.5M9.5 2h5"/>',
  gear: '<path d="M4 8h9M18 8h2M4 16h2M11 16h9"/><circle cx="15.5" cy="8" r="2.2"/><circle cx="8.5" cy="16" r="2.2"/>',
  trophy: '<path d="M8 21h8M12 17v4M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3"/>',
  download: '<path d="M12 4v10M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 14V4M7 8l5-5 5 5M5 20h14"/>',
  grip: '<path d="M5 9h14M5 15h14"/>',
  barcode: '<path d="M4 6v12M7 6v12M10.5 6v12M14 6v9M17 6v12M20 6v12"/>',
  apple: '<path d="M9 8.5c-2 0-3.5 1.9-3.5 4.6C5.5 17 7.6 21 9.6 21c.9 0 1.5-.5 2.4-.5s1.5.5 2.4.5c2 0 4.1-4 4.1-7.9 0-2.7-1.5-4.6-3.5-4.6-1 0-1.9.5-3 .5s-2-.5-3-.5z"/><path d="M12 8.5V6"/><path d="M12 6c2.1 0 3.8-1.6 3.8-3.5C13.7 2.5 12 4.1 12 6z"/>',
  scale: '<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M8.5 13a3.5 3.5 0 0 1 7 0"/><path d="M12 13 10 10.8"/>',
  calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  bars: '<path d="M4 7h14M4 12h9M4 17h5"/>',
  link: '<path d="M10 14 14 10"/><path d="M7.5 11.5 6 13a3.5 3.5 0 0 0 5 5l1.5-1.5"/><path d="M16.5 12.5 18 11a3.5 3.5 0 0 0-5-5l-1.5 1.5"/>',
  unlink: '<path d="M7.5 11.5 6 13a3.5 3.5 0 0 0 5 5l1.5-1.5"/><path d="M16.5 12.5 18 11a3.5 3.5 0 0 0-5-5l-1.5 1.5"/><path d="M4 4l16 16"/>',
};
const icon = (n) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;

/* ═══════════════ Datenhaltung ═══════════════ */

// Die Schlüssel behalten den alten Namen: Sie sind der Anker zu den bereits
// gespeicherten Plänen und Workouts. Umbenennen hieße Daten verlieren.
const LS_DB = "eisenzeit.db.v1";
const LS_ACTIVE = "eisenzeit.active.v1";

// Version des Farbschemas. Steigt sie, werden alte Akzentfarben einmalig
// auf den neuen Standard gesetzt (siehe migrateScheme).
const SCHEME_VERSION = 2;

function defaultDB() {
  return {
    version: 2,
    // schemeV fehlt hier bewusst: Beim Laden werden die Standardwerte mit den
    // gespeicherten überlagert. Stünde schemeV schon drin, würde es einen
    // Altbestand ohne diesen Schlüssel überdecken – die Migration liefe nie.
    // migrateScheme() setzt ihn, auch für eine frische Datenbank.
    settings: {
      restSecs: 90, autoRest: true, lastBackupAt: null,
      accent: ACCENT_DEFAULT, sprache: "de",
      // Übungen, deren Entwicklung im Verlauf-Tab dauerhaft mitläuft
      beobachtet: [],
      // Rückmeldung nach dem Workout (siehe coachTipps)
      coach: true,
      // Zugeklappte Abschnitte der Startseite (siehe sektion())
      eingeklappt: [],
      // Geräteübungen je Training vergleichen (siehe verlaufFuer)
      geraeteGetrennt: true,
    },
    customExercises: [],
    plans: [],
    workouts: [],
    activePlanId: null,
    seeded: false,
  };
}

// Das alte Schema kannte Akzentfarben wie „gold", die es nicht mehr gibt.
// Ohne diesen Schritt bliebe ein Altbestand auf einer Farbe hängen, für die
// es keinen Stylesheet-Block mehr gibt – die App sähe halb umgestellt aus.
function migrateScheme(settings) {
  if (!settings || settings.schemeV === SCHEME_VERSION) return;
  settings.accent = ACCENT_DEFAULT;
  settings.schemeV = SCHEME_VERSION;
}

// „Beine" gibt es nicht mehr, die Gruppe ist in Vorder-, Rückseite,
// Adduktoren und Abduktoren aufgeteilt. Eigene Übungen mit der alten
// Gruppe fielen sonst aus jedem Filter heraus.
const MUSKEL_UMZUG = { "Beine": "Quadrizeps" };

function migrateMuskeln(liste) {
  (liste || []).forEach((e) => {
    if (e && MUSKEL_UMZUG[e.muscle]) e.muscle = MUSKEL_UMZUG[e.muscle];
  });
  return liste;
}

/* ═══════════════ Daten prüfen ═══════════════
 *
 * Alles, was aus localStorage oder aus einer Backup-Datei kommt, ist erst
 * einmal nur JSON – nichts garantiert, dass es die erwartete Form hat. Eine
 * abgebrochene Übertragung, ein von Hand bearbeitetes Backup oder ein Rest aus
 * einer viel älteren Fassung reichten bisher, um die App unbrauchbar zu machen:
 * Beim Zeichnen flog eine Ausnahme, und da der Zustand schon gespeichert war,
 * ging es auch nach einem Neustart nicht weiter.
 *
 * Deshalb läuft alles Fremde durch diese Stelle. Sie wirft nichts weg, was sich
 * retten lässt, und lässt nichts durch, was hinterher jemanden zum Stolpern
 * bringt. Kennungen bekommen zusätzlich einen engen Zeichensatz: Sie landen in
 * HTML-Attributen, und dort hat Markup nichts verloren.
 */

const SICHERE_ID = /^[A-Za-z0-9_.-]{1,64}$/;
const istId = (v) => typeof v === "string" && SICHERE_ID.test(v);
const alsId = (v) => (istId(v) ? v : null);
const alsZahl = (v, ersatz = 0) => (Number.isFinite(+v) && v !== "" && v !== null ? +v : ersatz);
const alsText = (v, max = 200) => (typeof v === "string" ? v.slice(0, max) : "");
const alsListe = (v) => (Array.isArray(v) ? v : []);
const ausAuswahl = (v, erlaubt, ersatz) => (erlaubt.includes(v) ? v : ersatz);

function bereinigeSatz(s) {
  if (!s || typeof s !== "object") return null;
  const neu = { w: alsZahl(s.w), r: alsZahl(s.r), t: alsZahl(s.t) };
  if (s.done) neu.done = true;
  return neu;
}

function bereinigeUebung(e) {
  const id = alsId(e && e.exerciseId);
  if (!id) return null;
  const ex = { exerciseId: id, sets: alsListe(e.sets).map(bereinigeSatz).filter(Boolean) };
  if (istId(e.superset)) ex.superset = e.superset;
  return ex;
}

function bereinigeWorkout(w) {
  if (!w || typeof w !== "object" || !istId(w.id)) return null;
  const start = alsZahl(w.startedAt, 0);
  if (!start) return null;   // ohne Zeitpunkt lässt sich nichts einordnen
  const out = {
    id: w.id,
    name: alsText(w.name) || "Workout",
    startedAt: start,
    endedAt: alsZahl(w.endedAt, start),
    durationSec: alsZahl(w.durationSec, 0),
    exercises: alsListe(w.exercises).map(bereinigeUebung).filter(Boolean),
  };
  // Herkunft aus dem Plan – daran hängt der Vergleich von Geräteübungen
  if (istId(w.planId)) out.planId = w.planId;
  if (istId(w.woId)) out.woId = w.woId;
  return out;
}

function bereinigePlan(p) {
  if (!p || typeof p !== "object" || !istId(p.id)) return null;
  return {
    id: p.id,
    name: alsText(p.name) || "Mein Plan",
    createdAt: alsZahl(p.createdAt, Date.now()),
    workouts: alsListe(p.workouts).map((w) => {
      if (!w || typeof w !== "object") return null;
      return {
        id: istId(w.id) ? w.id : uid(),
        name: alsText(w.name) || "Training",
        exercises: alsListe(w.exercises).map((pe) => {
          const id = alsId(pe && pe.exerciseId);
          if (!id) return null;
          const ex = { exerciseId: id, sets: Math.min(20, Math.max(1, Math.round(alsZahl(pe.sets, 3)))) };
          if (istId(pe.superset)) ex.superset = pe.superset;
          return ex;
        }).filter(Boolean),
      };
    }).filter(Boolean),
  };
}

function bereinigeEigeneUebung(e) {
  if (!e || typeof e !== "object" || !istId(e.id)) return null;
  return {
    id: e.id,
    name: alsText(e.name, 80) || "Übung",
    muscle: ausAuswahl(e.muscle, MUSCLES, MUSCLES[0]),
    equipment: ausAuswahl(e.equipment, EQUIPMENT, "Sonstiges"),
    type: ausAuswahl(e.type, Object.keys(EXERCISE_TYPES), "weight_reps"),
    alias: alsText(e.alias, 120),
    custom: true,
  };
}

/** Der eine Ort, an dem Fremddaten in die Form der App gebracht werden. */
function bereinigeDB(roh) {
  const db = Object.assign(defaultDB(), roh && typeof roh === "object" ? roh : {});
  const st = Object.assign(defaultDB().settings,
    db.settings && typeof db.settings === "object" ? db.settings : {});

  st.restSecs = Math.min(600, Math.max(10, Math.round(alsZahl(st.restSecs, 90))));
  st.autoRest = st.autoRest !== false;
  st.coach = st.coach !== false;
  st.geraeteGetrennt = st.geraeteGetrennt !== false;
  st.sprache = ausAuswahl(st.sprache, SPRACHEN.map((x) => x.id), "de");
  st.accent = ausAuswahl(st.accent, ACCENTS.map((a) => a.id), ACCENT_DEFAULT);
  st.lastBackupAt = st.lastBackupAt ? alsZahl(st.lastBackupAt, null) : null;
  st.beobachtet = alsListe(st.beobachtet).filter(istId).slice(0, 5);
  st.eingeklappt = alsListe(st.eingeklappt).filter((x) => typeof x === "string").slice(0, 20);
  if (st.schemeV !== undefined) st.schemeV = alsZahl(st.schemeV, 0);

  db.settings = st;
  db.customExercises = alsListe(db.customExercises).map(bereinigeEigeneUebung).filter(Boolean);
  db.workouts = alsListe(db.workouts).map(bereinigeWorkout).filter(Boolean);
  db.plans = alsListe(db.plans).map(bereinigePlan).filter(Boolean);
  db.activePlanId = alsId(db.activePlanId);
  db.seeded = !!db.seeded;
  db.version = 2;
  return db;
}

/** Dasselbe für ein wiederhergestelltes laufendes Workout. */
function bereinigeAktiv(roh) {
  if (!roh || typeof roh !== "object") return null;
  const w = bereinigeWorkout(Object.assign({ id: uid(), startedAt: Date.now() }, roh));
  if (!w) return null;
  // Beim laufenden Workout zählen auch die noch offenen Sätze
  w.exercises = alsListe(roh.exercises).map(bereinigeUebung).filter(Boolean);
  return w;
}

function loadDB() {
  let db = defaultDB();
  try {
    const raw = localStorage.getItem(LS_DB);
    if (raw) db = bereinigeDB(JSON.parse(raw));
  } catch (e) {
    // Defektes JSON sichern statt still zu überschreiben
    try { localStorage.setItem(LS_DB + ".corrupt", localStorage.getItem(LS_DB) || ""); } catch (_) {}
  }
  // Migration v1 → v2: Ein Plan war früher EIN Training.
  // Jetzt bündelt ein Plan mehrere Trainings.
  db.plans = (db.plans || []).map((p) =>
    p.workouts ? p : {
      id: p.id, name: p.name, createdAt: p.createdAt || Date.now(),
      workouts: [{ id: uid(), name: p.name, exercises: p.exercises || [] }],
    });
  db.version = 2;
  migrateScheme(db.settings);
  migrateMuskeln(db.customExercises);
  // Vor dem Beispielplan: Der wird einmalig als eigene Daten angelegt und
  // soll in der Sprache dastehen, die eingestellt ist.
  spracheSetzen(db.settings.sprache);
  if (!db.seeded) {
    db.plans = SAMPLE_PLANS.map((p) => ({
      id: uid(), name: tr(p.name), createdAt: Date.now(),
      workouts: p.workouts.map((w) => ({
        id: uid(), name: tr(w.name),
        exercises: w.exercises.map((e) => ({ exerciseId: e.exerciseId, sets: e.sets })),
      })),
    }));
    db.seeded = true;
  }
  return db;
}

let DB = loadDB();
const saveDB = () => localStorage.setItem(LS_DB, JSON.stringify(DB));
saveDB();

// Akzentfarbe sofort setzen – noch bevor die Oberfläche aufgebaut wird,
// damit nichts kurz in der Standardfarbe aufblitzt.
function applyAccent() {
  const id = DB.settings.accent || ACCENT_DEFAULT;
  document.documentElement.setAttribute("data-accent", id);
}
applyAccent();

let active = null;
try { active = bereinigeAktiv(JSON.parse(localStorage.getItem(LS_ACTIVE) || "null")); } catch (e) { active = null; }
const saveActive = () => {
  if (active) localStorage.setItem(LS_ACTIVE, JSON.stringify(active));
  else localStorage.removeItem(LS_ACTIVE);
  // Jede Änderung am Workout läuft hier durch – der eine Ort, an dem sich
  // der Zustand für die Leiste zuverlässig nachziehen lässt.
  standPlanen();
};

/* ═══════════════ Übungs-Zugriff ═══════════════ */

const allExercises = () => EXERCISE_LIBRARY.concat(DB.customExercises);
const exById = (id) => allExercises().find((e) => e.id === id) || null;
const exName = (id) => exById(id) ? tUebung(exById(id)) : tr("Gelöschte Übung");
const exType = (id) => exById(id) ? exById(id).type : "weight_reps";

// Sortierte Workouts (neueste zuerst)
const workoutsDesc = () => DB.workouts.slice().sort((a, b) => b.startedAt - a.startedAt);

// Der Plan, nach dem aktuell trainiert wird
const activePlan = () =>
  DB.plans.find((p) => p.id === DB.activePlanId) || DB.plans[0] || null;

/* ── Geräte: was vergleichbar ist und was nicht ──────────────
 *
 * An Maschinen und Kabelzügen sagt die Zahl am Stapel nur im Zusammenhang mit
 * genau diesem Gerät etwas: 30 kg am Kabelzug im einen Studio sind nicht die
 * 30 kg im anderen – Rollen, Hebel und Übersetzung unterscheiden sich. Freie
 * Gewichte dagegen wiegen überall gleich viel.
 *
 * Deshalb werden Geräteübungen je Training verglichen: Was im Training
 * „Oberkörper Meridian" stand, taucht nur dort wieder auf, nicht im
 * „Oberkörper Owschlag". Freie Übungen laufen wie bisher über alles.
 * Abschaltbar in den Einstellungen, wer immer im selben Studio trainiert.
 */
const GERAET_STUDIOABHAENGIG = ["Kabelzug", "Maschine", "Smith-Maschine", "Cardiogerät"];

function geraetGetrennt(exId) {
  if (DB.settings.geraeteGetrennt === false) return false;
  const ex = exById(exId);
  return !!ex && GERAET_STUDIOABHAENGIG.includes(ex.equipment);
}

// Stammt ein Workout aus der Historie aus demselben Training wie ref?
function selbesTraining(w, ref) {
  if (!ref) return true;
  // woId ist die Herkunft aus dem Plan. Einträge von vor dieser Fassung
  // kennen sie nicht – für die muss der Name des Trainings reichen.
  if (ref.woId && w.woId) return w.woId === ref.woId;
  return (w.name || "") === (ref.name || "");
}

// Historie einer Übung, neueste zuerst. ref = laufendes bzw. betrachtetes
// Workout; an ihm hängt bei Geräteübungen, was überhaupt zählt.
function* verlaufFuer(exId, excludeId, ref) {
  const nurHier = geraetGetrennt(exId);
  for (const w of workoutsDesc()) {
    if (excludeId && w.id === excludeId) continue;
    if (nurHier && !selbesTraining(w, ref)) continue;
    const ex = w.exercises.find((e) => e.exerciseId === exId);
    if (ex && ex.sets.length) yield { workout: w, ex };
  }
}

// Sätze des letzten Workouts mit dieser Übung
function prevSetsFor(exId, excludeId, ref) {
  for (const t of verlaufFuer(exId, excludeId, ref)) return t.ex.sets;
  return null;
}

const setValue = (type, s) =>
  type === "weight_reps" ? (s.w || 0) : type === "reps" ? (s.r || 0) : (s.t || 0);

// Bisheriger Rekord (Maximalwert) für eine Übung. Bei Geräteübungen zählt nur,
// was am selben Gerät passiert ist – sonst wäre jeder Studiowechsel entweder
// ein Rekordregen oder eine Durststrecke.
function recordFor(exId, excludeId, ref) {
  const type = exType(exId);
  let best = null;
  for (const { workout: w, ex } of verlaufFuer(exId, excludeId, ref)) {
    for (const s of ex.sets) {
      const v = setValue(type, s);
      if (!best || v > best.val) best = { val: v, set: s, date: w.startedAt };
    }
  }
  return best;
}

const est1rm = (w, r) => (r > 1 ? w * (1 + r / 30) : w);

function fmtSet(type, s) {
  if (type === "weight_reps") return fmtKg(s.w || 0) + " kg × " + (s.r || 0);
  if (type === "reps") return tr("{n} Wdh.", { n: s.r || 0 });
  return fmtClock(s.t || 0);
}

const workoutVolume = (w) =>
  w.exercises.reduce((sum, ex) => {
    if (exType(ex.exerciseId) !== "weight_reps") return sum;
    return sum + ex.sets.reduce((a, s) => a + (s.w || 0) * (s.r || 0), 0);
  }, 0);
const workoutSets = (w) => w.exercises.reduce((a, ex) => a + ex.sets.length, 0);

/* ═══════════════ Aktions-Registry (Event-Delegation) ═══════════════ */

const ACTIONS = {};

/* Dasselbe für Eingabefelder. Die Fälle unten in app.js sind gewachsen und
   bleiben, wo sie sind; Module wie die Ernährung tragen sich hier ein, statt
   die Kette dort zu verlängern. */
const INPUTS = {};

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const fn = ACTIONS[el.dataset.action];
  if (fn) fn(el, e);
});

/* ═══════════════ Toast ═══════════════ */

let toastTimer = null;
function toast(msg) {
  $$(".toast").forEach((t) => t.remove());
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 2200);
}

/* ═══════════════ Ziehen zum Umsortieren ═══════════════
   Macht Listeneinträge per Griff verschiebbar – mit Finger wie mit Maus.
   Das gezogene Element folgt dem Zeiger, ein Strich zeigt die Zielposition.
   Umsortiert wird erst beim Loslassen. */

function makeSortable(container, itemSel, handleSel, onDrop) {
  let drag = null;
  const items = () => Array.from(container.querySelectorAll(itemSel));

  const clearMarks = () =>
    items().forEach((n) => n.classList.remove("drop-before", "drop-after"));

  container.addEventListener("pointerdown", (e) => {
    const handle = e.target.closest(handleSel);
    if (!handle || !container.contains(handle)) return;
    const el = handle.closest(itemSel);
    if (!el) return;
    e.preventDefault();

    // Nächstes scrollendes Elternelement finden (Overlay oder Seite)
    let sc = el.parentElement;
    while (sc && sc !== document.body) {
      const ov = getComputedStyle(sc).overflowY;
      if (ov === "auto" || ov === "scroll") break;
      sc = sc.parentElement;
    }
    const scroller = sc && sc !== document.body ? sc : document.scrollingElement;

    drag = {
      el, handle, scroller,
      from: items().indexOf(el),
      to: items().indexOf(el),
      startY: e.clientY,
      startScroll: scroller.scrollTop,
    };
    el.classList.add("dragging");
    handle.setPointerCapture(e.pointerId);
  });

  container.addEventListener("pointermove", (e) => {
    if (!drag) return;
    e.preventDefault();

    // Am Rand mitscrollen, damit auch längere Listen erreichbar bleiben
    const r = drag.scroller.getBoundingClientRect
      ? drag.scroller.getBoundingClientRect()
      : { top: 0, bottom: window.innerHeight };
    const rand = 90;
    if (e.clientY < r.top + rand) drag.scroller.scrollTop -= 14;
    else if (e.clientY > r.bottom - rand) drag.scroller.scrollTop += 14;

    const versatz = drag.scroller.scrollTop - drag.startScroll;
    drag.el.style.transform = `translateY(${e.clientY - drag.startY + versatz}px)`;

    // Zielposition: wie viele der übrigen Einträge liegen oberhalb des Zeigers
    const andere = items().filter((n) => n !== drag.el);
    drag.to = andere.filter((n) => {
      const b = n.getBoundingClientRect();
      return b.top + b.height / 2 < e.clientY;
    }).length;

    clearMarks();
    if (andere.length) {
      if (drag.to < andere.length) andere[drag.to].classList.add("drop-before");
      else andere[andere.length - 1].classList.add("drop-after");
    }
  });

  const ende = () => {
    if (!drag) return;
    const { el, from, to } = drag;
    el.classList.remove("dragging");
    el.style.transform = "";
    clearMarks();
    drag = null;
    if (from !== to) onDrop(from, to);
  };
  container.addEventListener("pointerup", ende);
  container.addEventListener("pointercancel", ende);
}

/* ═══════════════ Wischen zum Umschalten ═══════════════
   Verbindet einen Bereich mit einer Reihe von Ansichten: Waagerecht wischen
   blättert eine Position weiter, der Inhalt folgt dabei dem Finger und rastet
   beim Loslassen ein. Senkrechte Gesten bleiben normales Scrollen – dafür
   sorgt touch-action: pan-y auf .swipe-pane; alles außerhalb der Pane
   (etwa die Chip-Leiste) behält seine eigene waagerechte Geste. */

// Liegt der Punkt in etwas, das selbst waagerecht scrollt? Dann gehört
// die Geste diesem Element und nicht uns.
function waagerechtScrollbar(el) {
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    if (n.scrollWidth > n.clientWidth + 4) {
      const ov = getComputedStyle(n).overflowX;
      if (ov === "auto" || ov === "scroll") return true;
    }
  }
  return false;
}

// Lässt neuen Inhalt von der Seite hereinrutschen (richtung: 1 = von rechts)
function paneEinblenden(pane, richtung) {
  if (!pane) return;
  pane.style.transition = "none";
  pane.style.transform = `translateX(${richtung > 0 ? 40 : -40}px)`;
  pane.style.opacity = "0";
  void pane.offsetWidth;   // Umbruch erzwingen, sonst wird nur der Endzustand gezeichnet
  pane.style.transition = "";
  pane.style.transform = "";
  pane.style.opacity = "";
}

// opts: pane() – das mitwandernde Element, amRand(r) – geht es weiter?,
//       blaettern(r) – schaltet um (r: 1 = nächste, -1 = vorige)
function wischenVerbinden(bereich, opts) {
  let zug = null;

  const schieben = (dx, sanft) => {
    const pane = opts.pane();
    if (!pane) return;
    pane.style.transition = sanft ? "" : "none";
    pane.style.transform = dx ? `translateX(${dx}px)` : "";
  };

  bereich.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const pane = opts.pane();
    if (!pane || !pane.contains(e.target) || waagerechtScrollbar(e.target)) return;
    zug = { id: e.pointerId, x: e.clientX, y: e.clientY, achse: null, dx: 0 };
  });

  bereich.addEventListener("pointermove", (e) => {
    if (!zug || e.pointerId !== zug.id) return;
    const dx = e.clientX - zug.x, dy = e.clientY - zug.y;
    if (!zug.achse) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      // Nur deutlich waagerechte Gesten übernehmen
      if (Math.abs(dx) <= Math.abs(dy) * 1.4) { zug = null; return; }
      zug.achse = "x";
      bereich.setPointerCapture(e.pointerId);
    }
    e.preventDefault();
    // An den Enden zäh werden – so merkt man, dass es nicht weitergeht
    zug.dx = opts.amRand(dx < 0 ? 1 : -1) ? dx * 0.25 : dx;
    schieben(zug.dx, false);
  });

  const loslassen = () => {
    if (!zug) return;
    const { achse, dx } = zug;
    zug = null;
    if (achse !== "x") return;
    const schwelle = Math.min(70, bereich.clientWidth * 0.18);
    if (Math.abs(dx) > schwelle && opts.blaettern(dx < 0 ? 1 : -1)) return;
    schieben(0, true);   // zurückfedern
  };
  bereich.addEventListener("pointerup", loslassen);
  bereich.addEventListener("pointercancel", loslassen);
}

/* ═══════════════ Supersätze ═══════════════
   Zusammengehörige Übungen tragen dieselbe superset-Kennung. Eine Gruppe
   sind nur direkt aufeinanderfolgende Übungen – nach dem Umsortieren
   räumt normalizeSupersets zerrissene Gruppen auf. */

function normalizeSupersets(list) {
  let i = 0;
  while (i < list.length) {
    const id = list[i].superset;
    if (!id) { i++; continue; }
    let j = i;
    while (j + 1 < list.length && list[j + 1].superset === id) j++;
    if (j === i) delete list[i].superset;  // allein übrig – keine Gruppe mehr
    i = j + 1;
  }
}

// Liefert pro Eintrag { letter, pos, size } oder null
function supersetInfo(list) {
  const info = list.map(() => null);
  let buchstabe = -1, letzteId = null, pos = 0;
  list.forEach((e, i) => {
    if (!e.superset) { letzteId = null; return; }
    if (e.superset !== letzteId) { buchstabe++; pos = 0; letzteId = e.superset; }
    info[i] = { letter: String.fromCharCode(65 + buchstabe), pos: ++pos, id: e.superset };
  });
  const groesse = {};
  list.forEach((e) => { if (e.superset) groesse[e.superset] = (groesse[e.superset] || 0) + 1; });
  info.forEach((x) => { if (x) x.size = groesse[x.id]; });
  return info;
}

// Verbindet Eintrag i mit dem folgenden – oder trennt die Verbindung
function toggleSuperset(list, i) {
  const cur = list[i], next = list[i + 1];
  if (!next) return;
  if (cur.superset && cur.superset === next.superset) {
    delete next.superset;                     // Verbindung nach unten lösen
  } else {
    cur.superset = cur.superset || next.superset || "ss" + uid();
    next.superset = cur.superset;
  }
  normalizeSupersets(list);
}

/* ═══════════════ In-App-Bestätigung ═══════════════
   Native confirm() ist in eingebetteten Umgebungen (Sandbox-iframe)
   blockiert und gibt dort still false zurück – deshalb ein eigener Dialog. */

function appConfirm(msg, opts = {}) {
  return new Promise((resolve) => {
    const bd = document.createElement("div");
    bd.className = "backdrop";
    bd.innerHTML = `
      <div class="sheet" role="alertdialog" aria-label="${tr("Bestätigung")}">
        <div class="sheet-grip"></div>
        <p style="font-size:15px;font-weight:600;margin:4px 2px 18px">${esc(msg)}</p>
        <div style="display:flex;gap:10px">
          <button class="btn btn-ghost" data-c="0" style="flex:1">${esc(opts.cancel || tr("Abbrechen"))}</button>
          <button class="btn ${opts.danger ? "btn-danger-soft" : ""}" data-c="1" style="flex:1">${esc(opts.ok || tr("OK"))}</button>
        </div>
      </div>`;
    const done = (v) => { bd.remove(); resolve(v); };
    bd.zurueck = () => done(false);   // von der Android-Zurücktaste genutzt
    bd.addEventListener("click", (e) => {
      const b = e.target.closest("[data-c]");
      if (b) done(b.dataset.c === "1");
      else if (e.target === bd) done(false);
    });
    document.body.appendChild(bd);
  });
}

/* ═══════════════ Sheets & Overlays ═══════════════ */

/* opt.fest: Ein Tipp daneben schließt das Blatt NICHT. Für alles, in das man
   etwas einträgt – eine halb ausgefüllte Eingabe darf nicht an einem
   danebengegangenen Tipp verloren gehen. Zu ist es über das Kreuz oder die
   Zurücktaste. */
function openSheet(html, opt) {
  const bd = document.createElement("div");
  bd.className = "backdrop";
  bd.innerHTML = `<div class="sheet" role="dialog"><div class="sheet-grip"></div>${html}</div>`;
  if (!opt || !opt.fest) {
    bd.addEventListener("click", (e) => { if (e.target === bd) bd.remove(); });
  }
  blattZiehen(bd);
  document.body.appendChild(bd);
  return bd;
}

/* Der Griff oben am Blatt sah aus, als könne man es herunterziehen – konnte
   man aber nicht. Jetzt kann man.
 *
 * Die Zuhörer hängen am Hintergrund und nicht am Griff selbst: Manche Blätter
 * schreiben ihren Inhalt neu (die Tagesziele bei jeder Änderung), dabei ginge
 * der Griff samt Zuhörern verloren. Gezogen wird nur nach unten; losgelassen
 * entscheidet der Weg – oder das Tempo, denn ein kurzer Schnipp ist auch eine
 * Ansage. */
function blattZiehen(bd) {
  let zug = null;
  const blatt = () => bd.querySelector(".sheet");

  bd.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (!e.target.closest(".sheet-grip")) return;
    zug = { id: e.pointerId, y: e.clientY, dy: 0, start: Date.now() };
    const b = blatt();
    if (b) b.style.transition = "none";
    try { bd.setPointerCapture(e.pointerId); } catch (_) {}
  });

  bd.addEventListener("pointermove", (e) => {
    if (!zug || e.pointerId !== zug.id) return;
    e.preventDefault();
    // Nach oben gibt das Blatt nur zäh nach – dort ist nichts zu holen
    const roh = e.clientY - zug.y;
    zug.dy = roh > 0 ? roh : roh * 0.2;
    const b = blatt();
    if (b) b.style.transform = `translateY(${zug.dy}px)`;
    bd.style.background = `rgba(0,0,0,${(0.65 * Math.max(0.2, 1 - Math.max(0, zug.dy) / 420)).toFixed(3)})`;
  });

  const loslassen = () => {
    if (!zug) return;
    const { dy, start } = zug;
    zug = null;
    const b = blatt();
    if (b) b.style.transition = "";
    const schnipp = Date.now() - start < 300 && dy > 50;
    if (dy > 110 || schnipp) {
      if (b) b.style.transform = `translateY(${b.offsetHeight}px)`;
      bd.style.background = "transparent";
      setTimeout(() => {
        if (typeof bd.zurueck === "function") bd.zurueck();
        else bd.remove();
      }, 170);
      return;
    }
    if (b) b.style.transform = "";
    bd.style.background = "";
  };
  bd.addEventListener("pointerup", loslassen);
  bd.addEventListener("pointercancel", loslassen);
}
ACTIONS["close-sheet"] = (el) => el.closest(".backdrop")?.remove();

function openOverlay(html, cls) {
  const ov = document.createElement("div");
  ov.className = "overlay" + (cls ? " " + cls : "");
  ov.innerHTML = `<div class="overlay-inner">${html}</div>`;
  document.body.appendChild(ov);
  return ov;
}
ACTIONS["close-overlay"] = (el) => { el.closest(".overlay")?.remove(); render(); };

/* ═══════════════ Seite festhalten ═══════════════
   Liegt ein Blatt oder ein Overlay über der Seite, darf die Seite darunter
   nicht mitwandern. Mit CSS allein war das nicht zu halten: Fing der Finger
   an einer Stelle an, an der es im Blatt gerade nichts zu scrollen gab, nahm
   die Liste dahinter die Geste an – man wischte im Blatt und schob in
   Wahrheit die Lebensmittel darunter weg, statt zu den Nährwerten zu kommen.

   Deshalb wird der Hintergrund festgestellt (position: fixed), sobald etwas
   darüber liegt, und beim Schließen an genau derselben Stelle wieder
   freigegeben. Der Beobachter hängt am <body> und nicht an den einzelnen
   Blättern: Die werden an vielen Stellen einfach entfernt – so gibt es
   keinen Weg, der das Freigeben vergessen könnte. */

let seitenPos = 0;
function seitensperrePruefen() {
  const offen = !!document.querySelector(".backdrop, .overlay");
  const gesperrt = document.body.classList.contains("blatt-offen");
  if (offen === gesperrt) return;
  if (offen) {
    seitenPos = window.scrollY || window.pageYOffset || 0;
    document.body.style.top = `-${seitenPos}px`;
    document.body.classList.add("blatt-offen");
  } else {
    document.body.classList.remove("blatt-offen");
    document.body.style.top = "";
    window.scrollTo(0, seitenPos);
  }
}
new MutationObserver(seitensperrePruefen).observe(document.body, { childList: true });

/* ═══════════════ Tabs ═══════════════ */

let currentTab = "home";
/* Zwei Welten, eine Leiste.
   Training und Ernährung haben nichts miteinander zu tun – sie in eine Reihe
   aus sieben Reitern zu quetschen wäre falsch. Stattdessen zeigt die Pille
   immer nur eine Welt; ein Wischen darüber wechselt sie. Damit das nicht
   geheim bleibt, sitzen zwei Punkte über der Pille, die auch antippbar sind. */
const BEREICHE = [
  {
    id: "training", label: "Training", tabs: [
      { id: "home", label: "Start", ic: "home" },
      { id: "plans", label: "Pläne", ic: "plans" },
      { id: "exercises", label: "Übungen", ic: "dumbbell" },
      { id: "history", label: "Verlauf", ic: "history" },
    ],
  },
  {
    id: "essen", label: "Ernährung", tabs: [
      { id: "food-day", label: "Heute", ic: "apple" },
      { id: "food-lib", label: "Lebensmittel", ic: "search" },
      { id: "food-hist", label: "Verlauf", ic: "history" },
    ],
  },
  {
    id: "gesundheit", label: "Gesundheit", tabs: [
      { id: "health-body", label: "Körper", ic: "scale" },
      { id: "health-cal", label: "Kalender", ic: "calendar" },
      { id: "health-muscle", label: "Balance", ic: "bars" },
    ],
  },
];

/* Gestartet wird immer im Training: Das ist die Heimat der App, dort liegt
   die Leiste für ein laufendes Workout, und dorthin führt auch die
   Zurücktaste. Die Ernährung ist einen Wisch entfernt. Innerhalb einer
   Sitzung merkt sich jede Welt ihren Reiter – wer hin und her wechselt,
   steht wieder da, wo er war. */
let currentBereich = "training";
const letzterTab = { training: "home", essen: "food-day", gesundheit: "health-body" };

const bereich = () => BEREICHE.find((b) => b.id === currentBereich) || BEREICHE[0];
const bereichIndex = () => BEREICHE.findIndex((b) => b.id === currentBereich);

ACTIONS["tab"] = (el) => {
  // Auf demselben Reiter nichts tun – sonst klopft es bei jedem Tipp
  if (el.dataset.tab === currentTab) return;
  currentTab = el.dataset.tab;
  letzterTab[currentBereich] = currentTab;
  tippen();
  render();
};

function bereichWechseln(richtung) {
  const i = bereichIndex() + richtung;
  if (i < 0 || i >= BEREICHE.length) return false;
  currentBereich = BEREICHE[i].id;
  currentTab = letzterTab[currentBereich] || BEREICHE[i].tabs[0].id;
  tippen();
  render();
  const inner = $("#tabbar-inner");
  if (inner) paneEinblenden(inner, richtung);
  const screen = $("#screen-" + currentTab);
  if (screen) paneEinblenden(screen, richtung);
  punkteZeigen(3000);
  return true;
}

ACTIONS["bereich"] = (el) => {
  const ziel = BEREICHE.findIndex((b) => b.id === el.dataset.b);
  if (ziel >= 0 && ziel !== bereichIndex()) bereichWechseln(ziel - bereichIndex());
};

/* Die Beschriftungen der Bildschirme und der Leiste stehen im HTML als
   data-label und werden hier zu aria-label in der eingestellten Sprache. Sie
   sind nur für Vorlesehilfen da – sichtbar ist von ihnen nichts. */
function bildschirmBeschriften() {
  $$("[data-label]").forEach((el) => el.setAttribute("aria-label", tr(el.dataset.label)));
}

function renderTabbar() {
  const b = bereich();
  const inner = $("#tabbar-inner");
  inner.style.gridTemplateColumns = `repeat(${b.tabs.length}, 1fr)`;
  inner.innerHTML = b.tabs.map(
    (x) => `<button class="tab-btn ${x.id === currentTab ? "active" : ""}" data-action="tab" data-tab="${esc(x.id)}" aria-label="${esc(tr(x.label))}">${icon(x.ic)}<span>${esc(tr(x.label))}</span></button>`
  ).join("");
  const punkte = $("#bereich-punkte");
  if (punkte) {
    punkte.innerHTML = BEREICHE.map((x) => `
      <button class="bereich-punkt ${x.id === currentBereich ? "active" : ""}" data-action="bereich" data-b="${esc(x.id)}"
        aria-label="${esc(tr(x.label))}" aria-current="${x.id === currentBereich}"></button>`).join("");
  }
  $$(".screen").forEach((s) => s.classList.toggle("active", s.id === "screen-" + currentTab));
}

/* Die Punkte zeigen sich nur, wenn sie gebraucht werden: beim Start, während
   des Wischens und drei Sekunden nach einem Wechsel. Danach schrumpft die
   Pille wieder auf die Reiter zusammen. */
let punkteTimer = null;
function punkteZeigen(dauer) {
  document.body.classList.add("punkte");
  clearTimeout(punkteTimer);
  if (dauer) punkteTimer = setTimeout(() => document.body.classList.remove("punkte"), dauer);
}

/* Wischen über der Pille wechselt die Welt. Bewusst nur dort und nicht über
   dem ganzen Bildschirm: Im Inhalt bedeutet Wischen schon etwas anderes
   (Muskelgruppe, Zeitraum, Tag).

   touch-action: none steht dafür im Stylesheet an der Leiste. Ohne das nimmt
   der Browser die Geste als Seiten-Scroll an und bricht sie ab, bevor sie
   hier ankommt – mit der Maus fällt das nicht auf, mit dem Finger geht dann
   gar nichts. */
function bereichWischenVerbinden() {
  const leiste = $(".tabbar");
  if (!leiste) return;
  let zug = null;
  let gewischtBis = 0;

  const zuruecksetzen = () => {
    const inner = $("#tabbar-inner");
    if (inner) { inner.style.transition = ""; inner.style.transform = ""; inner.style.opacity = ""; }
  };

  leiste.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    zug = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, achse: null };
  });

  leiste.addEventListener("pointermove", (e) => {
    if (!zug || e.pointerId !== zug.id) return;
    const dx = e.clientX - zug.x, dy = e.clientY - zug.y;
    if (!zug.achse) {
      if (Math.abs(dx) < 10) return;
      if (Math.abs(dx) <= Math.abs(dy) * 1.2) { zug = null; return; }
      zug.achse = "x";
      punkteZeigen(0);   // während des Ziehens sichtbar lassen
      try { leiste.setPointerCapture(e.pointerId); } catch (_) {}
    }
    e.preventDefault();
    const inner = $("#tabbar-inner");
    const rand = bereichIndex() + (dx < 0 ? 1 : -1);
    // An den Enden zäh werden – so merkt man, dass es nicht weitergeht
    zug.dx = rand < 0 || rand >= BEREICHE.length ? dx * 0.25 : dx;
    if (inner) {
      inner.style.transition = "none";
      inner.style.transform = `translateX(${zug.dx * 0.5}px)`;
      inner.style.opacity = String(Math.max(0.35, 1 - Math.abs(zug.dx) / 160));
    }
  });

  const loslassen = () => {
    if (!zug) return;
    const { achse, dx } = zug;
    zug = null;
    zuruecksetzen();
    if (achse !== "x") return;
    // Nach einem Wisch darf der Reiter darunter nicht auch noch auslösen
    gewischtBis = Date.now() + 400;
    if (Math.abs(dx) > 46) bereichWechseln(dx < 0 ? 1 : -1);
    else punkteZeigen(3000);
  };
  leiste.addEventListener("pointerup", loslassen);
  leiste.addEventListener("pointercancel", loslassen);

  leiste.addEventListener("click", (e) => {
    if (Date.now() < gewischtBis) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);
}

/* ═══════════════ Start-Tab ═══════════════ */

/* Ein Abschnitt der Startseite, der sich zuklappen lässt.
 *
 * Der Zustand liegt in den Einstellungen und damit in localStorage: Wer den
 * Verlauf einmal weggeräumt hat, will ihn nicht beim nächsten Start wieder
 * vorfinden. Zugeklappt wird der Inhalt gar nicht erst gebaut – dafür steht
 * neben der Überschrift eine kurze Zeile, damit der Abschnitt nicht zur
 * blinden Klappe wird.
 */
function istEingeklappt(id) {
  return (DB.settings.eingeklappt || []).includes(id);
}

function sektion(id, titel, inhalt, kurz) {
  const zu = istEingeklappt(id);
  return `
    <button class="section-label klapp${zu ? " zu" : ""}" data-action="sektion" data-sektion="${esc(id)}"
            aria-expanded="${zu ? "false" : "true"}">
      <span class="klapp-titel">${esc(titel)}</span>
      ${zu && kurz ? `<span class="klapp-kurz">${esc(kurz)}</span>` : ""}
      <span class="klapp-pfeil">${icon("chevD")}</span>
    </button>
    ${zu ? "" : inhalt}`;
}

ACTIONS["sektion"] = (el) => {
  const liste = DB.settings.eingeklappt || (DB.settings.eingeklappt = []);
  const i = liste.indexOf(el.dataset.sektion);
  if (i < 0) liste.push(el.dataset.sektion); else liste.splice(i, 1);
  saveDB();
  renderHome();
};

function renderHome() {
  const today = new Date().toLocaleDateString(locale(), { weekday: "long", day: "numeric", month: "long" });
  const recent = workoutsDesc().slice(0, 3);
  const ap = activePlan();
  const planInhalt =
    (ap ? planCard(ap) : `<p class="hint">${tr("Noch kein Plan – lege im Tab „Pläne\" einen an.")}</p>`) +
    (DB.plans.length > 1 ? `<button class="btn btn-ghost" data-action="switch-plan">${icon("plans")} ${tr("Plan wechseln")}</button>` : "");
  $("#screen-home").innerHTML = `
    <div class="screen-head">
      <div>
        <div class="wordmark">${logoSvg()}Lumora</div>
        <div class="screen-title">${esc(today)}</div>
      </div>
      <button class="icon-btn" data-action="open-settings" aria-label="${tr("Einstellungen")}">${icon("gear")}</button>
    </div>
    <button class="btn" data-action="start-empty">${icon("plus")} ${tr("Leeres Workout starten")}</button>
    ${sektion("plan", tr("Aktueller Plan"), planInhalt, ap ? ap.name : tr("kein Plan"))}
    ${recent.length ? sektion("verlauf", tr("Zuletzt trainiert"), recent.map(historyRow).join(""),
      fmtDateShort(recent[0].startedAt)) : ""}
  `;
}

ACTIONS["switch-plan"] = () => {
  const ap = activePlan();
  openSheet(`
    <div class="sheet-title">${tr("Aktiven Plan wählen")}
      <button class="icon-btn plain" data-action="close-sheet" aria-label="${tr("Schließen")}">${icon("x")}</button>
    </div>
    ${DB.plans.map((p) => `
      <button class="row ${ap && ap.id === p.id ? "picked" : ""}" data-action="set-active-plan" data-id="${esc(p.id)}">
        <span class="pick-check">${icon("check")}</span>
        <span class="row-main">
          <span class="row-title">${esc(p.name)}</span>
          <span class="row-sub">${p.workouts.length} ${tr("Trainings")}</span>
        </span>
      </button>`).join("")}
  `);
};

ACTIONS["set-active-plan"] = (el) => {
  DB.activePlanId = el.dataset.id;
  saveDB();
  el.closest(".backdrop")?.remove();
  render();
  renderPlanDetail();
  toast(tr("Aktueller Plan gesetzt"));
};

function planCard(p) {
  return `
    <div class="plan-card">
      <div class="plan-card-head">
        <div class="ttl">${esc(p.name)}</div>
        <button class="icon-btn plain" data-action="edit-plan" data-id="${esc(p.id)}" aria-label="${tr("Plan bearbeiten")}" style="width:32px;height:32px">${icon("edit")}</button>
      </div>
      ${p.workouts.length ? p.workouts.map((w) => {
        const muscles = Array.from(new Set(w.exercises.map((e) => exById(e.exerciseId)?.muscle).filter(Boolean))).slice(0, 3).map(tMuskel).join(", ");
        return `
        <div class="plan-wo-row">
          <div class="row-main">
            <div class="row-title">${esc(w.name)}</div>
            <div class="row-sub">${w.exercises.length} ${tr("Übungen")}${muscles ? " · " + esc(muscles) : ""}</div>
          </div>
          <button class="btn btn-compact" data-action="start-plan" data-plan="${esc(p.id)}" data-wo="${esc(w.id)}">${tr("Start")}</button>
        </div>`;
      }).join("") : `<div class="plan-wo-row"><span class="hint">${tr("Noch keine Trainings in diesem Plan.")}</span></div>`}
    </div>`;
}

/* ═══════════════ Pläne-Tab ═══════════════ */

function renderPlans() {
  const ap = activePlan();
  $("#screen-plans").innerHTML = `
    <div class="screen-head">
      <div class="screen-title">${tr("Pläne")}</div>
    </div>
    ${DB.plans.length ? DB.plans.map((p) => {
      const nEx = p.workouts.reduce((a, w) => a + w.exercises.length, 0);
      return `
      <button class="row" data-action="open-plan" data-id="${esc(p.id)}">
        <span class="row-main">
          <span class="row-title">${esc(p.name)}</span>
          <span class="row-sub">${p.workouts.length} ${tr("Trainings")} · ${nEx} ${tr("Übungen")}</span>
        </span>
        ${ap && ap.id === p.id ? `<span class="badge badge-accent">${tr("Aktiv")}</span>` : ""}
        <span class="chev">${icon("chevR")}</span>
      </button>`;
    }).join("") : `
      <div class="empty">${icon("plans")}
        <h3>${tr("Noch keine Pläne")}</h3>
        <p>${tr("Ein Plan bündelt mehrere Trainings – z. B. Push, Pull und Beine.")}</p>
      </div>`}
    <button class="btn btn-ghost" data-action="new-plan" style="margin-top:8px">${icon("plus")} ${tr("Neuen Plan erstellen")}</button>
  `;
}

/* Plan-Detail: Trainings ansehen, starten, bearbeiten */

ACTIONS["open-plan"] = (el) => openPlanDetail(el.dataset.id);

function openPlanDetail(planId) {
  $(".plan-detail-ov")?.remove();
  const ov = openOverlay("", "plan-detail-ov");
  ov.dataset.planId = planId;
  renderPlanDetail(ov);
}

function renderPlanDetail(ov) {
  ov = ov || $(".plan-detail-ov");
  if (!ov) return;
  const p = DB.plans.find((x) => x.id === ov.dataset.planId);
  if (!p) { ov.remove(); return; }
  const isActive = activePlan()?.id === p.id;
  $(".overlay-inner", ov).innerHTML = `
    <div class="overlay-head">
      <button class="icon-btn plain" data-action="close-overlay" aria-label="${tr("Zurück")}">${icon("chevL")}</button>
      <input class="screen-title" data-input="plan-titel" data-id="${esc(p.id)}" value="${esc(p.name)}"
        style="background:none;border:none;padding:0;width:100%;min-width:0" aria-label="${tr("Plan-Name")}">
    </div>
    ${isActive
      ? `<span class="badge badge-accent" style="margin-bottom:14px">${icon("check")} ${tr("Aktiver Plan")}</span>`
      : `<button class="btn btn-soft" data-action="set-active-plan" data-id="${esc(p.id)}" style="margin-bottom:14px">${tr("Als aktiven Plan setzen")}</button>`}
    <div class="section-label">${tr("Trainings")}</div>
    ${p.workouts.length ? p.workouts.map((w, i) => {
      const names = w.exercises.slice(0, 3).map((e) => exName(e.exerciseId)).join(", ");
      return `
      <div class="row" style="cursor:default">
        <div class="row-main" data-action="edit-plan-wo-direct" data-plan="${esc(p.id)}" data-i="${esc(i)}" style="cursor:pointer">
          <div class="row-title">${esc(w.name)}</div>
          <div class="row-sub">${w.exercises.length} ${tr("Übungen")}${names ? " · " + esc(names) : ""}</div>
        </div>
        <button class="btn btn-compact btn-ghost" data-action="edit-plan-wo-direct" data-plan="${esc(p.id)}" data-i="${esc(i)}">${icon("edit")} ${tr("Bearbeiten")}</button>
      </div>`;
    }).join("") : `<p class="hint" style="padding:4px 0 10px">${tr("Noch keine Trainings – leg unten das erste an.")}</p>`}
    <button class="btn btn-soft" data-action="plan-wo-neu" data-id="${esc(p.id)}" style="margin-top:12px">${icon("plus")} ${tr("Training hinzufügen")}</button>
    <p class="hint" style="margin-top:10px">${tr("Gestartet wird ein Training über den Start-Tab. Den Plan-Namen kannst du oben direkt überschreiben.")}</p>
    <div class="divider"></div>
    <button class="btn btn-danger-soft" data-action="plan-loeschen" data-id="${esc(p.id)}">${icon("trash")} ${tr("Plan löschen")}</button>
  `;
}

// Öffnet den Editor direkt auf Ebene 2 (ein bestimmtes Training)
ACTIONS["edit-plan-wo-direct"] = (el) => {
  openPlanEditor(el.dataset.plan);
  openPlanWoEditor(+el.dataset.i);
};

// Neues Training aus der Plan-Ansicht heraus: Editor öffnen und gleich ein
// leeres Training anhängen. Bricht man ab, bleibt der Plan unverändert –
// gearbeitet wird auf einer Kopie (draftPlan).
ACTIONS["plan-loeschen"] = async (el) => {
  const pl = DB.plans.find((x) => x.id === el.dataset.id);
  if (!pl) return;
  if (!(await appConfirm(tr("Plan „{name}\" wirklich löschen? Bereits getrackte Workouts bleiben erhalten.", { name: pl.name }),
                         { ok: tr("Löschen"), danger: true }))) return;
  DB.plans = DB.plans.filter((x) => x.id !== pl.id);
  if (DB.activePlanId === pl.id) DB.activePlanId = (DB.plans[0] || {}).id || null;
  saveDB();
  $(".plan-detail-ov")?.remove();
  toast(tr("Plan gelöscht"));
  render();
};

ACTIONS["plan-wo-neu"] = (el) => {
  openPlanEditor(el.dataset.id);
  ACTIONS["plan-add-wo"]();
};

/* Plan-Editor – Ebene 1: der Plan mit seinen Trainings */

let draftPlan = null;
let draftWoIdx = -1;

ACTIONS["new-plan"] = () => openPlanEditor(null);
ACTIONS["edit-plan"] = (el) => openPlanEditor(el.dataset.id);

function openPlanEditor(planId) {
  const existing = planId ? DB.plans.find((p) => p.id === planId) : null;
  draftPlan = existing
    ? JSON.parse(JSON.stringify(existing))
    : { id: uid(), name: "", createdAt: Date.now(), workouts: [] };
  const ov = openOverlay("", "plan-editor-ov");
  renderPlanEditor(ov);
}

function renderPlanEditor(ov) {
  ov = ov || $(".plan-editor-ov");
  if (!ov) return;
  const isNew = !DB.plans.some((p) => p.id === draftPlan.id);
  $(".overlay-inner", ov).innerHTML = `
    <div class="overlay-head">
      <button class="icon-btn plain" data-action="close-overlay" aria-label="${tr("Zurück")}">${icon("chevL")}</button>
      <div class="screen-title">${isNew ? tr("Neuer Plan") : tr("Plan bearbeiten")}</div>
      <button class="btn btn-compact" data-action="save-plan">${tr("Speichern")}</button>
    </div>
    <div class="field">
      <label for="plan-name">${tr("Name des Plans")}</label>
      <input id="plan-name" data-input="plan-name" value="${esc(draftPlan.name)}" placeholder="${tr("z. B. Push / Pull / Beine")}" autocomplete="off">
    </div>
    <div class="section-label">${tr("Trainings in diesem Plan")}</div>
    <div id="plan-wo-liste">
    ${draftPlan.workouts.length ? draftPlan.workouts.map((w, i) => `
      <div class="row" style="cursor:default" data-i="${esc(i)}">
        <button class="drag-handle" aria-label="${tr("Training verschieben")}">${icon("grip")}</button>
        <div class="row-main" data-action="edit-plan-wo" data-i="${esc(i)}" style="cursor:pointer">
          <div class="row-title">${esc(w.name || tr("Training {n}", { n: i + 1 }))}</div>
          <div class="row-sub">${w.exercises.length} ${tr("Übungen")} · ${w.exercises.reduce((a, e) => a + (e.sets || 0), 0)} ${tr("Sätze")}</div>
        </div>
        <button class="mini-btn" data-action="edit-plan-wo" data-i="${esc(i)}" aria-label="${tr("Bearbeiten")}">${icon("edit")}</button>
        <button class="mini-btn danger" data-action="plan-wo-del" data-i="${esc(i)}" aria-label="${tr("Entfernen")}">${icon("x")}</button>
      </div>`).join("") : `<p class="hint" style="padding:4px 0 12px">${tr("Noch keine Trainings – füge z. B. „Push\", „Pull\" und „Beine\" hinzu.")}</p>`}
    </div>
    <button class="btn btn-soft" data-action="plan-add-wo">${icon("plus")} ${tr("Training hinzufügen")}</button>
    ${isNew ? "" : `<button class="btn btn-danger-soft" data-action="delete-plan" style="margin-top:10px">${icon("trash")} ${tr("Plan löschen")}</button>`}
  `;
  const liste = $("#plan-wo-liste", ov);
  if (liste) {
    makeSortable(liste, ".row", ".drag-handle", (von, nach) => {
      const ws = draftPlan.workouts;
      ws.splice(nach, 0, ws.splice(von, 1)[0]);
      renderPlanEditor();
    });
  }
}
ACTIONS["plan-wo-del"] = async (el) => {
  const i = +el.dataset.i;
  const w = draftPlan.workouts[i];
  if (w.exercises.length && !(await appConfirm(
    tr("Training „{name}\" aus dem Plan entfernen?", { name: w.name || tr("Training {n}", { n: i + 1 }) }),
    { ok: tr("Entfernen"), danger: true }))) return;
  draftPlan.workouts.splice(i, 1);
  renderPlanEditor();
};
ACTIONS["plan-add-wo"] = () => {
  draftPlan.workouts.push({ id: uid(), name: "", exercises: [] });
  openPlanWoEditor(draftPlan.workouts.length - 1);
};
ACTIONS["edit-plan-wo"] = (el) => openPlanWoEditor(+el.dataset.i);

ACTIONS["save-plan"] = () => {
  draftPlan.name = draftPlan.name.trim() || tr("Mein Plan");
  draftPlan.workouts.forEach((w, i) => { w.name = (w.name || "").trim() || tr("Training {n}", { n: i + 1 }); });
  const idx = DB.plans.findIndex((p) => p.id === draftPlan.id);
  if (idx >= 0) DB.plans[idx] = draftPlan;
  else DB.plans.push(draftPlan);
  saveDB();
  $(".plan-editor-ov")?.remove();
  toast(tr("Plan gespeichert"));
  render();
  renderPlanDetail();
};
ACTIONS["delete-plan"] = async () => {
  if (!(await appConfirm(tr("Plan „{name}\" wirklich löschen?", { name: draftPlan.name }), { ok: tr("Löschen"), danger: true }))) return;
  DB.plans = DB.plans.filter((p) => p.id !== draftPlan.id);
  saveDB();
  $(".plan-editor-ov")?.remove();
  $(".plan-detail-ov")?.remove();
  toast(tr("Plan gelöscht"));
  render();
};

/* Plan-Editor – Ebene 2: ein Training mit Übungen & Sätzen */

function openPlanWoEditor(i) {
  draftWoIdx = i;
  const ov = openOverlay("", "plan-wo-ov");
  renderPlanWoEditor(ov);
}

function renderPlanWoEditor(ov) {
  ov = ov || $(".plan-wo-ov");
  if (!ov) return;
  const w = draftPlan.workouts[draftWoIdx];
  const ssInfo = supersetInfo(w.exercises);
  const verbunden = (i) =>
    !!w.exercises[i].superset && w.exercises[i].superset === (w.exercises[i + 1] || {}).superset;
  $(".overlay-inner", ov).innerHTML = `
    <div class="overlay-head">
      <button class="icon-btn plain" data-action="plan-wo-done" aria-label="${tr("Zurück")}">${icon("chevL")}</button>
      <div class="screen-title">${tr("Training bearbeiten")}</div>
      <button class="btn btn-compact" data-action="plan-wo-done">${tr("Fertig")}</button>
    </div>
    <div class="field">
      <label for="plan-wo-name">${tr("Name des Trainings")}</label>
      <input id="plan-wo-name" data-input="plan-wo-name" value="${esc(w.name)}" placeholder="${tr("z. B. Push (Brust, Schultern, Trizeps)")}" autocomplete="off">
    </div>
    <div class="section-label">${tr("Übungen &amp; Sätze")}</div>
    <div class="card" style="padding:6px 14px">
      ${w.exercises.length ? w.exercises.map((pe, i) => `
        <div class="plan-ex-row" data-i="${esc(i)}">
          <button class="drag-handle" aria-label="${tr("Übung verschieben")}">${icon("grip")}</button>
          <div class="nm">${ssInfo[i] ? `<span class="ss-tag">${ssInfo[i].letter}${ssInfo[i].pos}</span>` : ""}${esc(exName(pe.exerciseId))}<small>${esc(tMuskel(exById(pe.exerciseId)?.muscle || ""))}</small></div>
          <input type="text" inputmode="numeric" value="${esc(pe.sets)}" data-input="plan-sets" data-i="${esc(i)}" aria-label="${tr("Sätze")}">
          <span class="hint">${tr("Sätze")}</span>
          <button class="mini-btn danger" data-action="plan-ex-del" data-i="${esc(i)}" aria-label="${tr("Entfernen")}">${icon("x")}</button>
        </div>
        ${i < w.exercises.length - 1 ? `
        <button class="ss-link ${verbunden(i) ? "on" : ""}" data-action="plan-ex-superset" data-i="${esc(i)}">
          ${icon(verbunden(i) ? "unlink" : "link")}
          ${verbunden(i) ? tr("Supersatz – trennen") : tr("Zum Supersatz verbinden")}
        </button>` : ""}`).join("") : `<p class="hint" style="padding:12px 0">${tr("Noch keine Übungen in diesem Training.")}</p>`}
    </div>
    <button class="btn btn-soft" data-action="plan-add-ex">${icon("plus")} ${tr("Übungen hinzufügen")}</button>
  `;
  const liste = $(".card", ov);
  if (liste) {
    makeSortable(liste, ".plan-ex-row", ".drag-handle", (von, nach) => {
      const ex = draftPlan.workouts[draftWoIdx].exercises;
      ex.splice(nach, 0, ex.splice(von, 1)[0]);
      normalizeSupersets(ex);
      renderPlanWoEditor();
    });
  }
}

ACTIONS["plan-ex-superset"] = (el) => {
  toggleSuperset(draftPlan.workouts[draftWoIdx].exercises, +el.dataset.i);
  renderPlanWoEditor();
};
ACTIONS["plan-ex-del"] = (el) => {
  const ex = draftPlan.workouts[draftWoIdx].exercises;
  ex.splice(+el.dataset.i, 1);
  normalizeSupersets(ex);
  renderPlanWoEditor();
};
ACTIONS["plan-add-ex"] = () => {
  openExercisePicker((ids) => {
    for (const id of ids) draftPlan.workouts[draftWoIdx].exercises.push({ exerciseId: id, sets: 3 });
    renderPlanWoEditor();
  });
};
ACTIONS["plan-wo-done"] = () => {
  const w = draftPlan.workouts[draftWoIdx];
  w.name = (w.name || "").trim() || "Training " + (draftWoIdx + 1);
  $(".plan-wo-ov")?.remove();
  draftWoIdx = -1;
  renderPlanEditor();
};

/* ═══════════════ Übungen-Tab ═══════════════ */

let exSearch = "";
let exFilter = "Alle";

// Die Filterreihe der Übungslisten – „Alle" vorweg, dann die Muskelgruppen.
// Sie ist zugleich die Reihenfolge, durch die man wischen kann.
const MUSCLE_FILTER = ["Alle"].concat(MUSCLES);

// Nachbar-Filter in der Reihe oder null, wenn dort Schluss ist
function filterNachbar(aktuell, richtung) {
  const ziel = MUSCLE_FILTER.indexOf(aktuell) + richtung;
  return ziel >= 0 && ziel < MUSCLE_FILTER.length ? MUSCLE_FILTER[ziel] : null;
}

function chipsHtml(aktiv, action) {
  return MUSCLE_FILTER.map((m) =>
    `<button class="chip ${m === aktiv ? "active" : ""}" data-action="${esc(action)}" data-m="${esc(m)}">${esc(tMuskel(m))}</button>`).join("");
}

// Nur die Markierung umsetzen, ohne die Leiste neu zu bauen. Wichtig: Ein
// Neuaufbau setzt die Scroll-Position auf 0 zurück – man sähe dann alle
// Muskelgruppen einmal durchrollen, bevor der Chip wieder da steht.
function chipsMarkieren(leiste, aktiv) {
  if (!leiste) return;
  leiste.querySelectorAll(".chip").forEach((c) =>
    c.classList.toggle("active", c.dataset.m === aktiv));
}

// Den aktiven Chip in Sicht holen – aber nur, wenn er wirklich außerhalb
// liegt. Sonst ruckelt die Leiste bei jedem Tipp ohne Grund.
function chipInSicht(leiste, sanft) {
  const chip = leiste && leiste.querySelector(".chip.active");
  if (!chip) return;
  const c = chip.getBoundingClientRect(), l = leiste.getBoundingClientRect();
  if (c.left >= l.left && c.right <= l.right) return;
  const ziel = leiste.scrollLeft + (c.left - l.left) - (l.width - c.width) / 2;
  leiste.scrollTo({ left: Math.max(0, ziel), behavior: sanft ? "smooth" : "auto" });
}

function renderExercises() {
  $("#screen-exercises").innerHTML = `
    <div class="screen-head">
      <div class="screen-title">${tr("Übungen")}</div>
      <button class="icon-btn" data-action="new-exercise" aria-label="${tr("Eigene Übung anlegen")}">${icon("plus")}</button>
    </div>
    <div class="search-wrap">${icon("search")}
      <input class="search-input" data-input="ex-search" value="${esc(exSearch)}" placeholder="${tr("Übung suchen …")}" autocomplete="off">
    </div>
    <div class="chips" id="ex-chips">${chipsHtml(exFilter, "ex-filter")}</div>
    <div class="swipe-pane" id="ex-list"></div>
  `;
  renderExerciseList();
  chipInSicht($("#ex-chips"));
}

function filteredExercises() {
  const q = exSearch.trim().toLowerCase();
  return allExercises()
    .filter((e) => exFilter === "Alle" || e.muscle === exFilter)
    .filter((e) => !q
      || e.name.toLowerCase().includes(q)
      || tUebung(e).toLowerCase().includes(q)
      || (e.alias || "").toLowerCase().includes(q))
    .sort((a, b) => tUebung(a).localeCompare(tUebung(b), locale()));
}

function exerciseRow(e, extra) {
  return `
    <button class="row" data-action="${extra ? extra.action : "open-exercise"}" data-id="${esc(e.id)}">
      ${extra && extra.pick ? `<span class="pick-check">${icon("check")}</span>` : ""}
      <span class="muscle-dot">${muscleIcon(e.muscle)}</span>
      <span class="row-main">
        <span class="row-title">${esc(tUebung(e))}</span>
        <span class="row-sub">${esc(tMuskel(e.muscle))} · ${esc(tGeraet(e.equipment))}${e.custom ? " · " + tr("Eigene") : ""}</span>
      </span>
      ${extra && extra.pick ? "" : `<span class="chev">${icon("chevR")}</span>`}
    </button>`;
}

function renderExerciseList() {
  const list = filteredExercises();
  $("#ex-list").innerHTML = list.length
    ? list.map((e) => exerciseRow(e)).join("")
    : `<div class="empty">${icon("search")}<h3>${tr("Nichts gefunden")}</h3><p>${tr("Lege die Übung über das Plus oben rechts selbst an.")}</p></div>`;
}

ACTIONS["ex-filter"] = (el) => setExFilter(el.dataset.m);

// Filter wechseln: Nur Markierung und Liste anfassen, nicht den ganzen
// Screen – so bleibt die Chip-Leiste stehen, wo sie ist.
function setExFilter(m, richtung) {
  if (m === exFilter) return false;
  exFilter = m;
  chipsMarkieren($("#ex-chips"), m);
  renderExerciseList();
  chipInSicht($("#ex-chips"), true);
  if (richtung) paneEinblenden($("#ex-list"), richtung);
  return true;
}

// Wischen blättert eine Muskelgruppe weiter
function exFilterBlaettern(richtung) {
  const ziel = filterNachbar(exFilter, richtung);
  return ziel ? setExFilter(ziel, richtung) : false;
}

function exWischenVerbinden() {
  const screen = $("#screen-exercises");
  if (!screen) return;
  wischenVerbinden(screen, {
    pane: () => $("#ex-list"),
    amRand: (r) => !filterNachbar(exFilter, r),
    blaettern: exFilterBlaettern,
  });
}

/* Eigene Übung anlegen / bearbeiten */

ACTIONS["new-exercise"] = () => openExerciseForm(null);
ACTIONS["edit-exercise"] = (el) => openExerciseForm(el.dataset.id);

function openExerciseForm(exId) {
  const ex = exId ? DB.customExercises.find((e) => e.id === exId) : null;
  openSheet(`
    <div class="sheet-title">${ex ? tr("Übung bearbeiten") : tr("Eigene Übung")}
      <button class="icon-btn plain" data-action="close-sheet" aria-label="${tr("Schließen")}">${icon("x")}</button>
    </div>
    <div class="field"><label for="cx-name">${tr("Name")}</label>
      <input id="cx-name" placeholder="${tr("z. B. Larsen Press")}" value="${esc(ex ? ex.name : "")}" autocomplete="off"></div>
    <div class="field"><label for="cx-muscle">${tr("Muskelgruppe")}</label>
      <select id="cx-muscle">${MUSCLES.map((m) => `<option value="${esc(m)}" ${ex && ex.muscle === m ? "selected" : ""}>${esc(tMuskel(m))}</option>`).join("")}</select></div>
    <div class="field"><label for="cx-equip">${tr("Gerät")}</label>
      <select id="cx-equip">${EQUIPMENT.map((m) => `<option value="${esc(m)}" ${ex && ex.equipment === m ? "selected" : ""}>${esc(tGeraet(m))}</option>`).join("")}</select></div>
    <div class="field"><label for="cx-type">${tr("Erfassung")}</label>
      <select id="cx-type">${Object.entries(EXERCISE_TYPES).map(([k, v]) =>
        `<option value="${esc(k)}" ${ex && ex.type === k ? "selected" : ""}>${tr(v.label)}</option>`).join("")}</select></div>
    <button class="btn" data-action="save-exercise" data-id="${esc(ex ? ex.id : "")}">${tr("Speichern")}</button>
  `);
}

ACTIONS["save-exercise"] = (el) => {
  const name = $("#cx-name").value.trim();
  if (!name) { toast(tr("Bitte einen Namen eingeben")); return; }
  const data = {
    name, muscle: $("#cx-muscle").value, equipment: $("#cx-equip").value,
    type: $("#cx-type").value, alias: "", custom: true,
  };
  const id = el.dataset.id;
  if (id) {
    Object.assign(DB.customExercises.find((e) => e.id === id), data);
  } else {
    DB.customExercises.push(Object.assign({ id: "c-" + uid() }, data));
  }
  saveDB();
  el.closest(".backdrop").remove();
  $(".ex-detail-ov")?.remove();
  toast(tr("Übung gespeichert"));
  render();
  if ($(".picker-ov")) renderPickerList();
};

ACTIONS["delete-exercise"] = async (el) => {
  const ex = DB.customExercises.find((e) => e.id === el.dataset.id);
  if (!ex) return;
  if (!(await appConfirm(tr("„{name}\" löschen? Bereits getrackte Workouts bleiben erhalten.", { name: ex.name }), { ok: tr("Löschen"), danger: true }))) return;
  DB.customExercises = DB.customExercises.filter((e) => e.id !== ex.id);
  saveDB();
  $(".ex-detail-ov")?.remove();
  toast(tr("Übung gelöscht"));
  render();
};

/* Übungs-Detail mit Rekorden, Chart, Historie */

ACTIONS["open-exercise"] = (el) => openExerciseDetail(el.dataset.id);

function openExerciseDetail(exId) {
  const ex = exById(exId);
  if (!ex) return;
  const rec = recordFor(exId);
  const hist = [];
  for (const w of workoutsDesc()) {
    const wex = w.exercises.find((e) => e.exerciseId === exId);
    if (wex && wex.sets.length) hist.push({ w, sets: wex.sets });
  }
  let best1rm = 0;
  if (ex.type === "weight_reps") {
    for (const h of hist) for (const s of h.sets) best1rm = Math.max(best1rm, est1rm(s.w || 0, s.r || 0));
  }
  const recLabel = rec
    ? ex.type === "weight_reps" ? fmtKg(rec.val) + " kg × " + (rec.set.r || 0)
      : ex.type === "reps" ? tr("{n} Wdh.", { n: rec.val }) : fmtClock(rec.val)
    : null;

  openOverlay(`
    <div class="overlay-head">
      <button class="icon-btn plain" data-action="close-overlay" aria-label="${tr("Zurück")}">${icon("chevL")}</button>
      <div class="screen-title">${esc(tUebung(ex))}</div>
      ${ex.custom ? `<button class="icon-btn" data-action="edit-exercise" data-id="${esc(ex.id)}" aria-label="${tr("Bearbeiten")}">${icon("edit")}</button>` : ""}
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
      <span class="badge badge-accent">${esc(tMuskel(ex.muscle))}</span>
      <span class="badge badge-muted">${esc(tGeraet(ex.equipment))}</span>
      <span class="badge badge-muted">${tr(EXERCISE_TYPES[ex.type].label)}</span>
      ${ex.custom ? `<span class="badge badge-muted">${tr("Eigene Übung")}</span>` : ""}
    </div>
    ${rec ? `
      <div class="card" style="display:flex;gap:16px;align-items:center">
        <span class="badge badge-record" style="padding:8px">${icon("trophy")}</span>
        <div>
          <div style="font-weight:800;font-size:18px">${recLabel}</div>
          <div class="hint">${best1rm ? tr("Bester Satz · geschätztes 1RM: {kg} kg", { kg: fmtKg(Math.round(best1rm * 2) / 2) }) : tr("Bester Satz")}</div>
        </div>
      </div>` : ""}
    <div class="card chart-card">
      <h3>${tr("Entwicklung")}</h3>
      <div class="chart-sub">${ex.type === "weight_reps" ? tr("Schwerster Satz (kg) pro Workout") : ex.type === "reps" ? tr("Beste Wiederholungszahl pro Workout") : tr("Längste Dauer pro Workout")}</div>
      <div class="chart-wrap">${progressChart(exId)}</div>
    </div>
    ${hist.length ? `<div class="section-label">${tr("Historie")}</div>` + hist.map((h) => `
      <div class="card" style="padding:12px 14px">
        <div class="row-sub" style="margin-bottom:6px">${fmtDate(h.w.startedAt)} · ${esc(h.w.name)}</div>
        ${h.sets.map((s, i) => `<div style="display:flex;gap:10px;font-variant-numeric:tabular-nums;padding:2px 0">
          <span style="color:var(--ink-3);width:22px">${i + 1}.</span><span>${fmtSet(ex.type, s)}</span></div>`).join("")}
      </div>`).join("")
      : `<div class="empty">${icon("dumbbell")}<h3>${tr("Noch keine Einträge")}</h3><p>${tr("Tracke die Übung in einem Workout, dann erscheint hier deine Entwicklung.")}</p></div>`}
    ${ex.custom ? `<button class="btn btn-danger-soft" data-action="delete-exercise" data-id="${esc(ex.id)}">${icon("trash")} ${tr("Übung löschen")}</button>` : ""}
  `, "ex-detail-ov");
}

/* ═══════════════ Übungs-Picker (Mehrfachauswahl) ═══════════════ */

let pickerState = null;

// opt: { vorauswahl: [id], max: n, knopf: "…", leerErlaubt: true }
// max bremst die Auswahl (der Verlauf zeigt höchstens fünf Kurven),
// leerErlaubt lässt auch ein Abwählen aller Einträge durch.
function openExercisePicker(onDone, opt) {
  const o = opt || {};
  pickerState = {
    selected: new Set(o.vorauswahl || []), search: "", filter: "Alle", onDone,
    max: o.max || 0, knopf: o.knopf || "", leerErlaubt: !!o.leerErlaubt,
  };
  const ov = openOverlay(`
    <div class="overlay-head">
      <button class="icon-btn plain" data-action="picker-cancel" aria-label="${tr("Abbrechen")}">${icon("x")}</button>
      <div class="screen-title">${tr("Übungen wählen")}</div>
      <button class="icon-btn" data-action="new-exercise" aria-label="${tr("Eigene Übung")}">${icon("plus")}</button>
    </div>
    <div class="search-wrap">${icon("search")}
      <input class="search-input" data-input="picker-search" placeholder="${tr("Übung suchen …")}" autocomplete="off">
    </div>
    <div class="chips" id="picker-chips"></div>
    <div class="swipe-pane" id="picker-list"></div>
    <div style="position:fixed;left:0;right:0;bottom:0;z-index:65;padding:12px 16px calc(var(--safe-bottom) + 14px);background:linear-gradient(transparent, var(--bg) 40%)">
      <div style="max-width:560px;margin:0 auto">
        <button class="btn" data-action="picker-done" id="picker-done" disabled>${tr("Übungen hinzufügen")}</button>
      </div>
    </div>
  `, "picker-ov");
  renderPickerChips();
  renderPickerList();
  // Wischen blättert hier durch dieselbe Reihe wie im Übungen-Tab
  wischenVerbinden(ov, {
    pane: () => $("#picker-list"),
    amRand: (r) => !pickerState || !filterNachbar(pickerState.filter, r),
    blaettern: pickerFilterBlaettern,
  });
  return ov;
}

function renderPickerChips() {
  $("#picker-chips").innerHTML = chipsHtml(pickerState.filter, "picker-filter");
  chipInSicht($("#picker-chips"));
}

function renderPickerList() {
  const q = pickerState.search.trim().toLowerCase();
  const list = allExercises()
    .filter((e) => pickerState.filter === "Alle" || e.muscle === pickerState.filter)
    .filter((e) => !q
      || e.name.toLowerCase().includes(q)
      || tUebung(e).toLowerCase().includes(q)
      || (e.alias || "").toLowerCase().includes(q))
    .sort((a, b) => tUebung(a).localeCompare(tUebung(b), locale()));
  $("#picker-list").innerHTML = list.map((e) => `
    <button class="row ${pickerState.selected.has(e.id) ? "picked" : ""}" data-action="picker-toggle" data-id="${esc(e.id)}">
      <span class="pick-check">${icon("check")}</span>
      <span class="muscle-dot">${muscleIcon(e.muscle)}</span>
      <span class="row-main">
        <span class="row-title">${esc(tUebung(e))}</span>
        <span class="row-sub">${esc(tMuskel(e.muscle))} · ${esc(tGeraet(e.equipment))}</span>
      </span>
    </button>`).join("") || `<p class="hint" style="padding:12px 4px">${tr("Nichts gefunden.")}</p>`;
  updatePickerDone();
}

function updatePickerDone() {
  const n = pickerState.selected.size;
  const btn = $("#picker-done");
  if (!btn) return;
  btn.disabled = n === 0 && !pickerState.leerErlaubt;
  const wort = tr(pickerState.knopf || "hinzufügen");
  btn.textContent = (n === 0
    ? (pickerState.leerErlaubt ? tr("Keine auswählen") : tr("Übungen {wort}", { wort }))
    : tr(n === 1 ? "{n} Übung {wort}" : "{n} Übungen {wort}", { n, wort }))
    + (pickerState.max ? " " + tr("(max. {n})", { n: pickerState.max }) : "");
}

ACTIONS["picker-filter"] = (el) => setPickerFilter(el.dataset.m);

function setPickerFilter(m, richtung) {
  if (!pickerState || m === pickerState.filter) return false;
  pickerState.filter = m;
  chipsMarkieren($("#picker-chips"), m);
  renderPickerList();
  chipInSicht($("#picker-chips"), true);
  if (richtung) paneEinblenden($("#picker-list"), richtung);
  return true;
}

function pickerFilterBlaettern(richtung) {
  if (!pickerState) return false;
  const ziel = filterNachbar(pickerState.filter, richtung);
  return ziel ? setPickerFilter(ziel, richtung) : false;
}
ACTIONS["picker-toggle"] = (el) => {
  const id = el.dataset.id;
  if (pickerState.selected.has(id)) pickerState.selected.delete(id);
  else {
    if (pickerState.max && pickerState.selected.size >= pickerState.max) {
      toast(tr("Höchstens {n} Übungen", { n: pickerState.max }));
      return;
    }
    pickerState.selected.add(id);
  }
  el.classList.toggle("picked");
  updatePickerDone();
};
ACTIONS["picker-cancel"] = () => { $(".picker-ov")?.remove(); pickerState = null; };
ACTIONS["picker-done"] = () => {
  const ids = Array.from(pickerState.selected);
  const cb = pickerState.onDone;
  const leerOk = pickerState.leerErlaubt;
  $(".picker-ov")?.remove();
  pickerState = null;
  if (ids.length || leerOk) cb(ids);
};

/* ═══════════════ Aktives Workout ═══════════════ */

const newSet = () => ({ w: null, r: null, t: null, done: false });

function autoName() {
  const h = new Date().getHours();
  return tr(h < 11 ? "Morgen-Workout" : h < 15 ? "Mittags-Workout" : h < 19 ? "Nachmittags-Workout" : "Abend-Workout");
}

ACTIONS["start-empty"] = () => {
  if (activeGuard()) return;
  active = { id: uid(), name: autoName(), startedAt: Date.now(), exercises: [] };
  saveActive();
  openWorkoutScreen();
};

ACTIONS["start-plan"] = (el) => {
  if (activeGuard()) return;
  const plan = DB.plans.find((p) => p.id === el.dataset.plan);
  const wo = plan && plan.workouts.find((w) => w.id === el.dataset.wo);
  if (!wo) return;
  active = {
    id: uid(), name: wo.name, startedAt: Date.now(),
    // Herkunft: Nur damit lässt sich am Ende fragen, ob Änderungen dauerhaft
    // in dieses Training sollen
    planId: plan.id, woId: wo.id,
    exercises: wo.exercises.map((pe) => ({
      exerciseId: pe.exerciseId,
      superset: pe.superset,
      sets: Array.from({ length: Math.max(1, pe.sets || 1) }, newSet),
    })),
  };
  saveActive();
  openWorkoutScreen();
};

function activeGuard() {
  if (!active) return false;
  toast(tr("Es läuft bereits ein Workout"));
  openWorkoutScreen();
  return true;
}

function openWorkoutScreen() {
  $(".workout-ov")?.remove();
  const ov = openOverlay("", "workout-ov");
  renderWorkout(ov);
  renderResumeBar();
}

function renderWorkout(ov) {
  ov = ov || $(".workout-ov");
  if (!ov || !active) return;
  $(".overlay-inner", ov).innerHTML = `
    <div class="overlay-head">
      <button class="icon-btn plain" data-action="minimize-workout" aria-label="${tr("Minimieren")}">${icon("chevD")}</button>
      <input class="screen-title" data-input="wo-name" value="${esc(active.name)}"
        style="background:none;border:none;padding:0;width:100%;min-width:0" aria-label="${tr("Workout-Name")}">
      <button class="btn btn-good btn-compact" data-action="finish-workout">${tr("Beenden")}</button>
    </div>
    <div class="wo-meta">
      <div><span>${tr("Dauer")}</span><b id="wo-dur">${fmtClock((Date.now() - active.startedAt) / 1000)}</b></div>
      <div><span>${tr("Sätze")}</span><b id="wo-sets">0</b></div>
      <div><span>${tr("Volumen")}</span><b id="wo-vol">0 kg</b></div>
    </div>
    <div id="wo-exercises"></div>
    <button class="btn btn-soft" data-action="wo-add-ex">${icon("plus")} ${tr("Übung hinzufügen")}</button>
    <button class="btn btn-danger-soft" data-action="discard-workout" style="margin-top:10px">${icon("trash")} ${tr("Workout verwerfen")}</button>
  `;
  renderWoExercises();
  updateWoMeta();
}

/* Höchstens eine Übung offen. Alles gleichzeitig aufgeklappt war beim
   Trainieren unübersichtlich – man scrollt dann an der Stelle vorbei, an der
   man gerade eintragen will.

   null heißt „automatisch": die erste Übung mit einem offenen Satz. Ein Tipp
   auf eine zugeklappte Übung setzt sie fest, ein Tipp auf die offene klappt
   sie wieder zu (ALLE_ZU). Zugeklappt ist jede Übung eine kurze Zeile – so
   sieht man die ganze Reihenfolge und kann sie bequem umstellen, ohne vorher
   irgendwo Sätze eintragen zu müssen. */
const ALLE_ZU = -1;
let offeneUebung = null;

function offeneUebungIndex() {
  if (!active) return -1;
  if (offeneUebung === ALLE_ZU) return -1;
  if (offeneUebung != null && active.exercises[offeneUebung]) return offeneUebung;
  return active.exercises.findIndex((e) => e.sets.some((s) => !s.done));
}

function renderWoExercises() {
  const host = $("#wo-exercises");
  if (!host || !active) return;
  host.innerHTML = active.exercises.length
    ? active.exercises.map((ex, xi) => woExerciseBlock(ex, xi)).join("")
    : `<div class="empty">${icon("dumbbell")}<h3>${tr("Leg los!")}</h3><p>${tr("Füge deine erste Übung hinzu.")}</p></div>`;
  woSortierbar();
}

function woExerciseBlock(ex, xi) {
  const type = exType(ex.exerciseId);
  const ss = supersetInfo(active.exercises)[xi];
  const nächste = active.exercises[xi + 1];
  const verbunden = !!ex.superset && ex.superset === (nächste || {}).superset;
  const offen = xi === offeneUebungIndex();
  const griff = `<button class="drag-handle" aria-label="${tr("Übung verschieben")}">${icon("grip")}</button>`;
  const kopf = `${ss ? `<div class="ss-head">${icon("link")} ${tr("Supersatz {letter} · Übung {pos} von {size}", { letter: ss.letter, pos: ss.pos, size: ss.size })}</div>` : ""}`;

  return `
    <div class="wo-item" data-xi="${esc(xi)}">
      <div class="exercise-block ${ss ? "in-superset" : ""} ${offen ? "" : "zu"}" data-xi="${esc(xi)}">
        ${kopf}
        ${offen ? woKopfOffen(ex, xi, griff) : woKopfZu(ex, xi, type)}
        ${offen ? woSaetze(ex, xi, type) : ""}
      </div>
      ${nächste ? `
      <button class="ss-link ${verbunden ? "on" : ""}" data-action="wo-superset" data-xi="${esc(xi)}">
        ${icon(verbunden ? "unlink" : "link")}
        ${verbunden ? tr("Supersatz – trennen") : tr("Mit nächster Übung verbinden")}
      </button>` : ""}
    </div>`;
}

function woKopfOffen(ex, xi, griff) {
  return `
    <div class="exercise-block-head">
      ${griff}
      <button class="name" data-action="open-exercise" data-id="${esc(ex.exerciseId)}">${esc(exName(ex.exerciseId))}</button>
      <button class="mini-btn" data-action="wo-open-ex" data-xi="${esc(xi)}" aria-label="${tr("Übung zuklappen")}">${icon("chevU")}</button>
      <button class="mini-btn danger" data-action="wo-del-ex" data-xi="${esc(xi)}" aria-label="${tr("Übung entfernen")}">${icon("x")}</button>
    </div>`;
}

function woKopfZu(ex, xi, type) {
  const fertig = ex.sets.filter((s) => s.done).length;
  const letzter = ex.sets.filter((s) => s.done).pop();
  const stand = fertig === ex.sets.length
    ? tr("Fertig · {n} Sätze", { n: ex.sets.length })
    : tr("{fertig}/{gesamt} Sätze", { fertig, gesamt: ex.sets.length })
      + (letzter ? " · " + fmtSet(type, letzter) : "");
  return `
    <div class="exercise-block-head zu">
      <button class="drag-handle" aria-label="${tr("Übung verschieben")}">${icon("grip")}</button>
      <button class="ex-zu" data-action="wo-open-ex" data-xi="${esc(xi)}">
        <span class="ex-zu-name">${esc(exName(ex.exerciseId))}</span>
        <span class="ex-zu-stand">${stand}</span>
      </button>
      <button class="ex-zu-chev ${fertig === ex.sets.length ? "fertig" : ""}"
        data-action="wo-open-ex" data-xi="${esc(xi)}" aria-label="${tr("Übung aufklappen")}">
        ${fertig === ex.sets.length ? icon("check") : icon("chevD")}</button>
    </div>`;
}

function woSaetze(ex, xi, type) {
  const prev = prevSetsFor(ex.exerciseId, null, active);
  // Nichts aus diesem Training, aber anderswo schon gemacht? Dann ist „Erster
  // Eintrag" gelogen – es ist der erste an diesem Gerät.
  const andernorts = !prev && geraetGetrennt(ex.exerciseId) && !!prevSetsFor(ex.exerciseId);
  const curIdx = ex.sets.findIndex((s) => !s.done);
  return `
    ${ex.sets.map((s, si) =>
      s.done ? doneSetRow(type, s, si, xi)
      : si === curIdx ? currentSetCard(type, ex, xi, si, prev, andernorts)
      : queuedSetRow(si, xi)).join("")}
    ${curIdx < 0 ? `<div class="all-done-note">${icon("check")} ${tr("Alle {n} Sätze abgeschlossen", { n: ex.sets.length })}</div>` : ""}
    <button class="add-set-btn" data-action="wo-add-set" data-xi="${esc(xi)}">${tr("+ Satz hinzufügen")}</button>`;
}

// Ein Tipp auf den Kopf klappt auf – oder zu, wenn die Übung schon offen war
ACTIONS["wo-open-ex"] = (el) => {
  const xi = +el.dataset.xi;
  offeneUebung = xi === offeneUebungIndex() ? ALLE_ZU : xi;
  renderWoExercises();
  if (offeneUebung !== ALLE_ZU) {
    $(`.wo-item[data-xi="${esc(xi)}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

/* Reihenfolge nur für dieses Workout ändern. active.exercises ist beim Start
   aus dem Plan kopiert worden – der Plan selbst bleibt also unberührt. */
function woSortierbar() {
  const host = $("#wo-exercises");
  if (!host || !active) return;
  // Nur einmal je Behälter binden. renderWoExercises tauscht bloß den Inhalt
  // aus, das Element selbst bleibt – ohne diese Sperre sammelte sich mit
  // jedem Satz ein weiterer Zuhörer an.
  if (host.dataset.sortierbar) return;
  host.dataset.sortierbar = "1";
  makeSortable(host, ".wo-item", ".drag-handle", (von, nach) => {
    if (von === nach) return;
    // Die offene Übung am Objekt festhalten, nicht am Index – der verschiebt
    // sich ja gerade
    const zu = offeneUebungIndex() < 0;
    const offenObj = active.exercises[offeneUebungIndex()];
    const [weg] = active.exercises.splice(von, 1);
    active.exercises.splice(nach, 0, weg);
    normalizeSupersets(active.exercises);
    const neu = active.exercises.indexOf(offenObj);
    // Wer alles zugeklappt hat, um zu sortieren, will danach nicht wieder
    // eine aufgeklappte Übung vorfinden
    offeneUebung = zu ? ALLE_ZU : neu >= 0 ? neu : null;
    saveActive();
    renderWoExercises();
  });
}

ACTIONS["wo-superset"] = (el) => {
  toggleSuperset(active.exercises, +el.dataset.xi);
  saveActive();
  renderWoExercises();
};

// Abgeschlossener Satz: kompakte Zeile, antippen holt ihn zurück
function doneSetRow(type, s, si, xi) {
  return `
    <div class="done-set">
      <button class="done-set-main" data-action="wo-undo-set" data-xi="${esc(xi)}" data-si="${esc(si)}" title="${tr("Satz zurückholen")}">
        <span class="done-check">${icon("check")}</span>
        <span class="done-no">${tr("Satz {n}", { n: si + 1 })}</span>
        <b>${fmtSet(type, s)}</b>
      </button>
      <button class="mini-btn danger" data-action="wo-del-set" data-xi="${esc(xi)}" data-si="${esc(si)}" aria-label="${tr("Satz löschen")}">${icon("x")}</button>
    </div>`;
}

// Geplanter Satz: wartet, bis der aktuelle abgeschlossen ist
function queuedSetRow(si, xi) {
  return `
    <div class="queued-set">
      <span class="q-no">${tr("Satz {n}", { n: si + 1 })}</span>
      <span class="q-lbl">${tr("geplant")}</span>
      <button class="mini-btn danger" data-action="wo-del-set" data-xi="${esc(xi)}" data-si="${esc(si)}" aria-label="${tr("Geplanten Satz entfernen")}">${icon("x")}</button>
    </div>`;
}

// Aktueller Satz: Karte mit Plus/Minus-Steppern und Abschließen-Button
function currentSetCard(type, ex, xi, si, prev, andernorts) {
  const s = ex.sets[si];
  const p = prev && prev[si];
  // Startwerte: gleicher Satz vom letzten Mal, sonst letzter fertiger Satz
  // dieser Übung. Gibt es beides nicht, bleibt alles auf 0 – geraten wird
  // nicht, sonst trägt man versehentlich Zahlen ein, die nie jemand gehoben
  // hat. Nur die Zeit startet bei einer Minute, weil 0 Sekunden keine
  // sinnvolle Vorgabe für eine Halteübung sind.
  const lastDone = ex.sets.slice(0, si).reverse().find((x) => x.done);
  if (type === "weight_reps") {
    if (s.w == null) s.w = p && p.w != null ? p.w : lastDone && lastDone.w != null ? lastDone.w : 0;
    if (s.r == null) s.r = p && p.r != null ? p.r : lastDone && lastDone.r != null ? lastDone.r : 0;
  } else if (type === "reps") {
    if (s.r == null) s.r = p && p.r != null ? p.r : lastDone && lastDone.r != null ? lastDone.r : 0;
  } else {
    if (s.t == null) s.t = p && p.t ? p.t : lastDone && lastDone.t ? lastDone.t : 60;
  }
  saveActive();
  const d = `data-xi="${esc(xi)}" data-si="${esc(si)}"`;
  const stepper = (label, field, inputHtml) => `
    <div class="stepper-group">
      <div class="stepper-label">${label}</div>
      <div class="stepper">
        <button class="stepper-btn" data-action="wo-step" data-f="${esc(field)}" data-d="-1" ${d} aria-label="${tr("{label} verringern", { label })}">−</button>
        ${inputHtml}
        <button class="stepper-btn" data-action="wo-step" data-f="${esc(field)}" data-d="1" ${d} aria-label="${tr("{label} erhöhen", { label })}">+</button>
      </div>
    </div>`;
  const wInput = `<input class="stepper-val" type="text" inputmode="decimal" data-input="set-w" ${d} value="${esc(fmtEingabe(s.w))}" aria-label="${tr("Gewicht in kg")}">`;
  const rInput = `<input class="stepper-val" type="text" inputmode="numeric" data-input="set-r" ${d} value="${esc(s.r)}" aria-label="${tr("Wiederholungen")}">`;
  const tInput = `<input class="stepper-val" type="text" inputmode="numeric" data-input="set-t" ${d} value="${esc(fmtClock(s.t))}" aria-label="${tr("Zeit")}">`;
  return `
    <div class="current-set">
      <div class="current-set-head">
        <span class="cs-no">${tr("Satz {n} / {gesamt}", { n: si + 1, gesamt: ex.sets.length })}</span>
        <span class="cs-prev">${p ? tr("Letztes Mal: {satz}", { satz: fmtSet(type, p) })
          : andernorts ? tr("Erstes Mal in diesem Training") : tr("Erster Eintrag")}</span>
        <button class="mini-btn" data-action="wo-del-set" ${d} aria-label="${tr("Satz entfernen")}">${icon("x")}</button>
      </div>
      ${type === "weight_reps" ? stepper(tr("Gewicht (kg)"), "w", wInput) + stepper(tr("Wiederholungen"), "r", rInput) : ""}
      ${type === "reps" ? stepper(tr("Wiederholungen"), "r", rInput) : ""}
      ${type === "time" ? stepper(tr("Zeit (Min:Sek)"), "t", tInput) : ""}
      <button class="btn" data-action="wo-complete-set" ${d}>${icon("check")} ${tr("Satz abschließen")}</button>
    </div>`;
}

function updateWoMeta() {
  if (!active) return;
  let sets = 0, vol = 0;
  for (const ex of active.exercises) {
    const type = exType(ex.exerciseId);
    for (const s of ex.sets) {
      if (!s.done) continue;
      sets++;
      if (type === "weight_reps") vol += (s.w || 0) * (s.r || 0);
    }
  }
  const es = $("#wo-sets"), ev = $("#wo-vol");
  if (es) es.textContent = sets;
  if (ev) ev.textContent = fmtVol(vol);
}

ACTIONS["wo-add-ex"] = () => {
  openExercisePicker((ids) => {
    for (const id of ids) active.exercises.push({ exerciseId: id, sets: [newSet(), newSet(), newSet()] });
    saveActive();
    renderWoExercises();
    updateWoMeta();
  });
};
ACTIONS["wo-del-ex"] = async (el) => {
  const xi = +el.dataset.xi;
  const ex = active.exercises[xi];
  if (ex.sets.some((s) => s.done) && !(await appConfirm(tr("„{name}\" mit abgehakten Sätzen entfernen?", { name: exName(ex.exerciseId) }), { ok: tr("Entfernen"), danger: true }))) return;
  active.exercises.splice(xi, 1);
  normalizeSupersets(active.exercises);
  saveActive();
  renderWoExercises();
  updateWoMeta();
};
ACTIONS["wo-add-set"] = (el) => {
  active.exercises[+el.dataset.xi].sets.push(newSet());
  saveActive();
  renderWoExercises();
};
ACTIONS["wo-del-set"] = (el) => {
  const ex = active.exercises[+el.dataset.xi];
  if (ex.sets.length <= 1) { toast(tr("Letzter Satz – entferne stattdessen die Übung")); return; }
  ex.sets.splice(+el.dataset.si, 1);
  saveActive();
  renderWoExercises();
  updateWoMeta();
};

// Plus/Minus: Gewicht ±2,5 kg, Wiederholungen ±1, Zeit ±15 s
ACTIONS["wo-step"] = (el) => {
  const xi = +el.dataset.xi, si = +el.dataset.si;
  const f = el.dataset.f, dir = +el.dataset.d;
  const ex = active && active.exercises[xi];
  const s = ex && ex.sets[si];
  if (!s) return;
  if (f === "w") s.w = Math.max(0, Math.round(((s.w || 0) + dir * 2.5) * 100) / 100);
  if (f === "r") s.r = Math.max(0, (s.r || 0) + dir);
  if (f === "t") s.t = Math.max(15, (s.t || 0) + dir * 15);
  const inp = $(`[data-input="set-${f}"][data-xi="${esc(xi)}"][data-si="${esc(si)}"]`);
  if (inp) inp.value = f === "w" ? fmtEingabe(s.w) : f === "t" ? fmtClock(s.t) : s.r;
  saveActive();
};

ACTIONS["wo-complete-set"] = (el) => {
  const xi = +el.dataset.xi, si = +el.dataset.si;
  const ex = active.exercises[xi];
  const s = ex.sets[si];
  const type = exType(ex.exerciseId);
  if ((type === "weight_reps" || type === "reps") && (!s.r || s.r <= 0)) { toast(tr("Wiederholungen eintragen")); return; }
  if (type === "time" && (!s.t || s.t <= 0)) { toast(tr("Zeit eintragen, z. B. 1:30")); return; }
  if (type === "weight_reps" && s.w == null) s.w = 0;
  s.done = true;
  tippen(true);
  // Übung durch? Dann die Festlegung lösen, damit die nächste offene Übung
  // von selbst aufklappt.
  if (!ex.sets.some((x) => !x.done)) offeneUebung = null;
  saveActive();
  renderWoExercises();
  updateWoMeta();

  // Im Supersatz geht es ohne Pause direkt zur nächsten Übung der Runde.
  // Erst wenn die Runde durch ist, läuft der Pausen-Timer.
  const weiter = naechsteImSupersatz(xi);
  if (weiter >= 0) {
    offeneUebung = weiter;   // die nächste Übung der Runde aufklappen
    renderWoExercises();
    const block = $(`.wo-item[data-xi="${esc(weiter)}"]`);
    if (block) block.scrollIntoView({ behavior: "smooth", block: "start" });
    toast(tr("Weiter mit {name}", { name: exName(active.exercises[weiter].exerciseId) }));
    return;
  }
  if (DB.settings.autoRest && type !== "time") {
    startRest(DB.settings.restSecs, pausenInfo(ex, si));
  }
};

// Nächste Übung derselben Supersatz-Gruppe, die noch offene Sätze hat.
// -1, wenn die Runde komplett ist oder es kein Supersatz ist.
function naechsteImSupersatz(xi) {
  const gruppe = active.exercises[xi].superset;
  if (!gruppe) return -1;
  const idx = active.exercises
    .map((e, i) => (e.superset === gruppe ? i : -1))
    .filter((i) => i >= 0);
  const pos = idx.indexOf(xi);
  for (let k = pos + 1; k < idx.length; k++) {
    if (active.exercises[idx[k]].sets.some((x) => !x.done)) return idx[k];
  }
  return -1;
}

ACTIONS["wo-undo-set"] = (el) => {
  const s = active.exercises[+el.dataset.xi].sets[+el.dataset.si];
  s.done = false;
  saveActive();
  renderWoExercises();
  updateWoMeta();
};

ACTIONS["minimize-workout"] = () => {
  $(".workout-ov")?.remove();
  render();
};

ACTIONS["discard-workout"] = async () => {
  if (!(await appConfirm(tr("Workout wirklich verwerfen? Alle Eingaben gehen verloren."), { ok: tr("Verwerfen"), danger: true }))) return;
  active = null;
  saveActive();
  stopRest();
  $(".workout-ov")?.remove();
  render();
  toast(tr("Workout verworfen"));
};

ACTIONS["finish-workout"] = async () => {
  if (!active) return;
  const finished = {
    id: active.id,
    name: active.name.trim() || tr("Workout"),
    startedAt: active.startedAt,
    endedAt: Date.now(),
    durationSec: Math.round((Date.now() - active.startedAt) / 1000),
    // Herkunft mitschreiben: Nur so lässt sich später sagen, ob zwei Einträge
    // aus demselben Training stammen – daran hängt der Vergleich von
    // Geräteübungen (siehe verlaufFuer).
    planId: active.planId || null,
    woId: active.woId || null,
    exercises: [],
  };
  let undone = 0;
  for (const ex of active.exercises) {
    const done = ex.sets.filter((s) => s.done).map((s) => ({
      w: s.w ?? 0, r: s.r ?? 0, t: s.t ?? 0,
    }));
    undone += ex.sets.length - done.length;
    if (done.length) finished.exercises.push(
      { exerciseId: ex.exerciseId, superset: ex.superset, sets: done });
  }
  if (!finished.exercises.length) {
    if (await appConfirm(tr("Keine abgehakten Sätze. Workout verwerfen?"), { ok: tr("Verwerfen"), danger: true })) {
      active = null; saveActive(); stopRest();
      $(".workout-ov")?.remove(); render();
    }
    return;
  }
  if (undone > 0 && !(await appConfirm(
    tr(undone === 1 ? "{n} nicht abgehakter Satz wird verworfen. Workout beenden?"
                    : "{n} nicht abgehakte Sätze werden verworfen. Workout beenden?", { n: undone }),
    { ok: tr("Beenden") }))) return;
  if (!active) return;

  // Rekorde ermitteln (vor dem Speichern, gegen die bisherige Historie)
  const prs = [];
  for (const ex of finished.exercises) {
    const type = exType(ex.exerciseId);
    let bestNew = 0;
    for (const s of ex.sets) bestNew = Math.max(bestNew, setValue(type, s));
    const old = recordFor(ex.exerciseId, null, finished);
    if (bestNew > 0 && (!old || bestNew > old.val)) {
      prs.push({ name: exName(ex.exerciseId), type, val: bestNew, first: !old });
    }
  }

  DB.workouts.push(finished);
  saveDB();
  const herkunft = { planId: active.planId, woId: active.woId, exercises: active.exercises };
  active = null;
  saveActive();
  stopRest();
  $(".workout-ov")?.remove();
  render();

  await planAbgleichen(herkunft);
  showSummary(finished, prs);
};

/* Hat man im Workout Übungen ergänzt, entfernt oder umsortiert, gilt das
   zunächst nur für dieses eine Mal. Beim Beenden fragen wir, ob es auch für
   die Zukunft gelten soll – ungefragt den Plan umzuschreiben wäre übergriffig,
   und die Änderung stillschweigend verfallen zu lassen ärgerlich. */

const planSignatur = (liste) => liste
  .map((e) => `${e.exerciseId}:${e.superset || "-"}:${Array.isArray(e.sets) ? e.sets.length : e.sets || 0}`)
  .join("|");

function planUnterschied(vorher, nachher) {
  const alt = vorher.map((e) => e.exerciseId), neu = nachher.map((e) => e.exerciseId);
  const dazu = neu.filter((id) => !alt.includes(id)).length;
  const weg = alt.filter((id) => !neu.includes(id)).length;
  const teile = [];
  if (dazu) teile.push(tr(dazu === 1 ? "{n} Übung dazu" : "{n} Übungen dazu", { n: dazu }));
  if (weg) teile.push(tr(weg === 1 ? "{n} Übung entfernt" : "{n} Übungen entfernt", { n: weg }));
  if (!dazu && !weg) {
    const umsortiert = alt.join() !== neu.join();
    teile.push(umsortiert ? tr("Reihenfolge geändert") : tr("Sätze geändert"));
  }
  return teile.join(", ");
}

async function planAbgleichen(h) {
  if (!h.planId || !h.woId) return;                 // freies Workout
  const plan = DB.plans.find((p) => p.id === h.planId);
  const wo = plan && plan.workouts.find((x) => x.id === h.woId);
  if (!wo) return;                                  // Training inzwischen weg
  if (planSignatur(wo.exercises) === planSignatur(h.exercises)) return;

  const was = planUnterschied(wo.exercises, h.exercises);
  const ok = await appConfirm(
    tr("Du hast im Workout etwas verändert ({was}). Soll „{name}\" künftig so aussehen?", { was, name: wo.name }),
    { ok: tr("Übernehmen"), cancel: tr("Nur diesmal") });
  if (!ok) return;
  wo.exercises = h.exercises.map((e) => ({
    exerciseId: e.exerciseId,
    superset: e.superset,
    sets: Math.max(1, e.sets.length),
  }));
  saveDB();
  render();
  toast(tr("„{name}\" aktualisiert", { name: wo.name }));
}

/* ═══════════════ Coach ═══════════════
   Regelbasiert, ohne Netz und ohne Server: Die App kennt die eigene Historie,
   das reicht für die Beobachtungen, die beim Training wirklich helfen. Lieber
   wenige treffende Sätze als eine Liste – deshalb höchstens vier, und die
   auffälligsten zuerst. */

const COACH_MAX = 4;

// Das vorherige Vorkommen einer Übung, ohne das gerade beendete Workout.
// ref sorgt dafür, dass der Coach Geräteübungen nur mit demselben Gerät
// vergleicht – „weniger als letzte Woche" wäre sonst oft nur ein anderes
// Studio.
function vorigerEintrag(exId, ausserId, ref) {
  for (const t of verlaufFuer(exId, ausserId, ref)) return t;
  return null;
}

const bestwert = (typ, ex) => ex.sets.reduce((m, s) => Math.max(m, setValue(typ, s)), 0);

function coachTipps(w, prs) {
  if (DB.settings.coach === false) return [];
  const tipps = [];

  // 1) Rekorde zuerst – das ist die stärkste Rückmeldung
  for (const p of prs.slice(0, 2)) {
    tipps.push({ ton: "lob", text: tr(p.first
      ? "{name}: erste Marke gesetzt. Ab hier geht es aufwärts."
      : "{name}: neuer Bestwert. Sauber.", { name: p.name }) });
  }

  // 2) Steigerung oder Rückgang gegenüber dem letzten Mal
  for (const ex of w.exercises) {
    const typ = exType(ex.exerciseId);
    if (typ !== "weight_reps") continue;
    const vor = vorigerEintrag(ex.exerciseId, w.id, w);
    if (!vor) continue;
    const jetzt = bestwert(typ, ex), damals = bestwert(typ, vor.ex);
    if (!damals) continue;
    const name = exName(ex.exerciseId);
    if (jetzt > damals) {
      tipps.push({ ton: "lob", text: tr(
        "{name}: {jetzt} kg statt {damals} kg beim letzten Mal. Schöne Steigerung.",
        { name, jetzt: fmtKg(jetzt), damals: fmtKg(damals) }) });
    } else if (jetzt < damals * 0.92) {
      tipps.push({ ton: "frage", text: tr(
        "{name}: {jetzt} kg, letztes Mal waren es {damals} kg. War das Absicht – oder steckt Müdigkeit dahinter?",
        { name, jetzt: fmtKg(jetzt), damals: fmtKg(damals) }) });
    }
  }

  // 3) Stillstand: dreimal in Folge dasselbe Topgewicht bei gleichen Wdh.
  for (const ex of w.exercises) {
    const typ = exType(ex.exerciseId);
    if (typ !== "weight_reps") continue;
    const reihe = [ex];
    let letzteId = w.id;
    for (let i = 0; i < 2; i++) {
      const v = vorigerEintrag(ex.exerciseId, letzteId, w);
      if (!v) break;
      reihe.push(v.ex); letzteId = v.workout.id;
    }
    if (reihe.length < 3) continue;
    const werte = reihe.map((e) => bestwert(typ, e));
    const wdh = reihe.map((e) => Math.max(...e.sets.map((x) => x.r || 0)));
    if (werte.every((v) => v === werte[0]) && wdh.every((v) => v === wdh[0]) && werte[0] > 0) {
      tipps.push({ ton: "frage", text: tr(
        "Bei {name} liegst du seit drei Einheiten bei {kg} kg × {r}. Bist du da wirklich ans Limit gegangen?",
        { name: exName(ex.exerciseId), kg: fmtKg(werte[0]), r: wdh[0] }) });
    }
  }

  // 4) Alle Sätze gleich und viele Wiederholungen – Zeichen für zu leicht
  for (const ex of w.exercises) {
    if (exType(ex.exerciseId) !== "weight_reps" || ex.sets.length < 3) continue;
    const gleich = ex.sets.every((x) => x.w === ex.sets[0].w && x.r === ex.sets[0].r);
    if (gleich && (ex.sets[0].r || 0) >= 12) {
      tipps.push({ ton: "hinweis", text: tr(
        "{name}: dreimal {r} Wiederholungen ohne Einbruch. Da ist Luft für mehr Gewicht.",
        { name: exName(ex.exerciseId), r: ex.sets[0].r }) });
    }
  }

  // 5) Gesamtvolumen gegenüber dem letzten gleichnamigen Workout
  const vorherGleich = workoutsDesc().find((x) => x.id !== w.id && x.name === w.name);
  if (vorherGleich) {
    const a = workoutVolume(w), b2 = workoutVolume(vorherGleich);
    if (b2 > 0) {
      const proz = Math.round(((a - b2) / b2) * 100);
      if (proz >= 8) tipps.push({ ton: "lob", text: tr("Gesamtvolumen {proz} % über dem letzten „{name}\". Das summiert sich.", { proz, name: w.name }) });
      else if (proz <= -15) tipps.push({ ton: "hinweis", text: tr("Gesamtvolumen {proz} % unter dem letzten „{name}\" – kürzeres Training oder weniger Sätze?", { proz: Math.abs(proz), name: w.name }) });
    }
  }

  // Fragen und Hinweise vor reinem Lob: Sie sind das, woran man arbeitet
  const rang = { frage: 0, hinweis: 1, lob: 2 };
  tipps.sort((x, y) => rang[x.ton] - rang[y.ton]);
  return tipps.slice(0, COACH_MAX);
}

function coachBlock(w, prs) {
  const tipps = coachTipps(w, prs);
  if (!tipps.length) return "";
  const zeichen = { lob: "trophy", frage: "search", hinweis: "timer" };
  return `<div class="section-label">${tr("Coach")}</div>` + tipps.map((x) => `
    <div class="coach-zeile ${x.ton}">
      <span class="coach-ic">${icon(zeichen[x.ton])}</span>
      <span>${esc(x.text)}</span>
    </div>`).join("");
}

function showSummary(w, prs) {
  openSheet(`
    <div class="summary-hero">
      <div class="sub">${tr("Workout gespeichert")}</div>
      <div class="big">${fmtVol(workoutVolume(w))}</div>
      <div class="sub">${fmtDur(w.durationSec)} · ${workoutSets(w)} ${tr("Sätze")} · ${w.exercises.length} ${tr("Übungen")}</div>
    </div>
    ${prs.length ? `<div class="section-label">${tr("Neue Rekorde")}</div>` + prs.map((p) => `
      <div class="row" style="cursor:default">
        <span class="badge badge-record">${icon("trophy")} ${p.first ? tr("Erste Marke") : tr("Rekord")}</span>
        <span class="row-main"><span class="row-title">${esc(p.name)}</span></span>
        <b style="font-variant-numeric:tabular-nums">${p.type === "weight_reps" ? fmtKg(p.val) + " kg" : p.type === "reps" ? tr("{n} Wdh.", { n: p.val }) : fmtClock(p.val)}</b>
      </div>`).join("") : ""}
    ${coachBlock(w, prs)}
    ${backupReminder()}
    <button class="btn" data-action="close-sheet" style="margin-top:14px">${tr("Fertig")}</button>
  `);
}

// Erinnert nach dem Workout ans Sichern – aber erst, wenn es etwas zu
// verlieren gibt, und nur wenn das letzte Backup länger her ist.
function backupReminder() {
  const last = DB.settings.lastBackupAt;
  if (DB.workouts.length < 3) return "";
  if (last && Date.now() - last < 14 * 86400000) return "";
  return `
    <div class="card" style="display:flex;gap:12px;align-items:center;margin-top:16px">
      <div style="flex:1;min-width:0">
        <div style="font-weight:800;font-size:14px">${tr("Backup sichern")}</div>
        <div class="hint">${last
          ? tr("Dein letztes Backup ist über zwei Wochen her.")
          : tr("Du hast noch kein Backup – so gehen deine Daten nie verloren.")}</div>
      </div>
      <button class="btn btn-compact" data-action="export-data">${tr("Sichern")}</button>
    </div>`;
}

/* Fortsetzen-Leiste */

function renderResumeBar() {
  $("#resume-bar")?.remove();
  if (!active || $(".workout-ov")) return;
  const bar = document.createElement("button");
  bar.id = "resume-bar";
  bar.className = "resume-bar";
  bar.dataset.action = "resume-workout";
  bar.innerHTML = `
    <span style="flex:1;text-align:left;min-width:0">
      <span style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(active.name)}</span>
      <span class="sub">${tr("Workout läuft ·")} <span class="t">${fmtClock((Date.now() - active.startedAt) / 1000)}</span></span>
    </span>
    <span class="go">${tr("Weiter")}</span>`;
  document.body.appendChild(bar);
}
ACTIONS["resume-workout"] = () => openWorkoutScreen();

/* Dauer-Ticker */

setInterval(() => {
  if (!active) return;
  const t = fmtClock((Date.now() - active.startedAt) / 1000);
  const d = $("#wo-dur");
  if (d) d.textContent = t;
  const r = $("#resume-bar .t");
  if (r) r.textContent = t;
}, 1000);

/* ═══════════════ Satzpause ═══════════════

   Die Pause gehört der nativen Seite (siehe PausenTimerPlugin). Hier läuft
   nur der Balken auf dem Bildschirm – und der ist reine Anzeige.

   Zwei Anläufe sind daran gescheitert, dass beide Seiten mitgeplant haben:
   JavaScript sagte ab und plante neu, während die native Seite dasselbe tat.
   Jeder Aufruf über die Brücke hat seine eigene Laufzeit, also konnten sich
   zwei Nachrichten überholen – ein „keine Pause mehr" traf nach dem „neue
   Pause" ein und löschte sie. Deshalb jetzt:

   * Es gibt nur **eine** Nachricht, standSenden(), und die beschreibt den
     **ganzen** Zustand. Halb überholen kann man einen ganzen Zustand nicht.
   * Sie trägt eine laufende Nummer, und die native Seite verwirft alles
     Ältere. Damit ist die Reihenfolge der Brücke egal.
   * Nachrichten gehen durch **eine Kette**, nie parallel.
   * Jede Pause hat eine Kennung. Dieselbe Kennung schreibt nur die Anzeige
     neu, eine neue plant den Zeitpunkt. Wer die Pause verlängert, vergibt
     eine neue Kennung – dann und nur dann verschiebt sich das Ziel. */

let rest = null;      // { id, endsAt, total, interval, info }
let standFolge = 0;
let standKette = Promise.resolve();
// Die Weboberfläche kann neu laden, ohne dass die App darunter stirbt. Dann
// beginnt die Zählung wieder bei eins – daran erkennt die native Seite den
// neuen Durchlauf, statt jede Nachricht für überholt zu halten.
const STAND_LAUF = uid();

// Der vollständige Zustand, wie ihn die native Seite braucht
function standDaten() {
  const d = { lauf: STAND_LAUF, folge: ++standFolge, aktiv: !!active };
  if (!active) return d;
  d.workoutMs = Math.max(0, Math.round(Date.now() - active.startedAt));
  d.titel = active.name || "Workout";
  d.text = `${workoutSets(active)} Sätze · ${fmtVol(workoutVolume(active))}`;
  d.pauseId = rest ? rest.id : "";
  if (rest) {
    d.pauseMs = Math.max(0, Math.round(rest.endsAt - Date.now()));
    d.pauseTitel = (rest.info && rest.info.titel) || d.titel;
    d.pauseText = (rest.info && rest.info.text) || "";
  }
  return d;
}

function standSenden() {
  const { PausenTimer } = capPlugins();
  if (!PausenTimer || !PausenTimer.stand) return;
  pauseSignalVerbinden();
  if (active) meldungErlaubnisHolen();
  const daten = standDaten();
  // Einreihen statt losschicken: So kann keine Nachricht die vorige überholen.
  standKette = standKette.then(() => PausenTimer.stand(daten)).catch(() => {});
}

// Bei jeder Kleinigkeit neu zu schreiben wäre Verschwendung – die Zeit läuft
// ja von allein weiter. Deshalb gebündelt kurz nach der letzten Änderung.
let standTimer = null;
function standPlanen() {
  clearTimeout(standTimer);
  standTimer = setTimeout(standSenden, 700);
}

// info: { titel, text } für die Meldung in der Benachrichtigungsleiste
function startRest(secs, info) {
  // still, damit für den Wechsel „alte Pause weg, neue Pause an" nur eine
  // einzige Nachricht hinausgeht
  stopRest({ still: true });
  rest = {
    id: uid(),
    endsAt: Date.now() + secs * 1000,
    total: secs,
    info: info || null,
  };
  const bar = document.createElement("div");
  bar.id = "rest-bar";
  bar.className = "rest-bar";
  bar.innerHTML = `
    <div class="time" id="rest-time"></div>
    <div class="bar"><i id="rest-fill"></i></div>
    <button data-action="rest-plus">${tr("+15 s")}</button>
    <button data-action="rest-skip">${tr("Fertig")}</button>`;
  document.body.appendChild(bar);
  document.body.classList.add("rest-an");
  rest.interval = setInterval(tickRest, 250);
  tickRest();
  standSenden();
}

function stopRest(opt) {
  if (rest) clearInterval(rest.interval);
  rest = null;
  $("#rest-bar")?.remove();
  document.body.classList.remove("rest-an");
  if (!opt || !opt.still) standSenden();
}

function tickRest() {
  if (!rest) return;
  const left = (rest.endsAt - Date.now()) / 1000;
  if (left <= 0) {
    restDone();
    return;
  }
  const t = $("#rest-time"), f = $("#rest-fill");
  if (t) t.textContent = fmtClock(left);
  if (f) f.style.width = Math.max(0, Math.min(100, (left / rest.total) * 100)) + "%";
}

/* Der Zähler auf dem Bildschirm ist bei null. Die App ist damit sichtbar
   offen – also der nativen Seite Bescheid geben, damit sie die Anzeige in der
   Leiste sofort zurückstellt, statt auf ihren wartenden Aufruf zu warten. Ob
   die Meldung überhaupt noch zur laufenden Pause gehört, entscheidet dort die
   Kennung: Lag die App zwischendurch im Hintergrund, war der Zähler
   eingefroren und meldet sich verspätet – dann ist die Pause längst abgehakt
   und die Meldung verpufft.

   Ton und Vibration gibt es hier bewusst nicht mehr. Drei Anläufe lang war
   das Signal nicht verlässlich – mal kam es zu früh, mal gar nicht –, weil zu
   viele Stellen mitspielen mussten, die Android jederzeit einzeln stillegen
   darf. Geblieben ist der stille Countdown in der Leiste, der immer stimmt. */
function restDone() {
  const id = rest ? rest.id : null;
  const { PausenTimer } = capPlugins();
  // still: Die Anzeige in der Leiste stellt die native Seite selbst zurück.
  stopRest({ still: !!(PausenTimer && PausenTimer.pauseVorbei && id) });
  if (PausenTimer && PausenTimer.pauseVorbei && id) {
    standKette = standKette.then(() => PausenTimer.pauseVorbei({ pauseId: id })).catch(() => {});
  }
  toast(tr("Pause vorbei – nächster Satz!"));
}

// Die native Seite meldet das Ende. Das kann auch passiert sein, während die
// App weg war: dann steht der Balken noch, obwohl längst nichts mehr läuft.
function pauseSignalEmpfangen() {
  if (!rest) return;
  stopRest({ still: true });
  toast(tr("Pause vorbei – nächster Satz!"));
}

let signalVerbunden = false;
function pauseSignalVerbinden() {
  if (signalVerbunden) return;
  const { PausenTimer } = capPlugins();
  if (!PausenTimer || !PausenTimer.addListener) return;
  signalVerbunden = true;
  PausenTimer.addListener("pauseVorbei", pauseSignalEmpfangen);
}

ACTIONS["rest-plus"] = () => {
  if (!rest) return;
  rest.endsAt += 15000;
  rest.total += 15;
  // Neue Kennung: Nur so verschiebt die native Seite den Zielzeitpunkt.
  rest.id = uid();
  standSenden();
  tickRest();
};
ACTIONS["rest-skip"] = () => stopRest();

/* ── Laufendes Workout in der Benachrichtigungsleiste ───── */

// Die Anzeige in der Leiste gehört der nativen Seite. Von hier geht nur der
// Zustand hinaus – siehe standSenden().

// Zeile unter dem Übungsnamen, im Stil der Satzkarte
function pausenInfo(ex, si) {
  const s = ex.sets[si];
  const typ = exType(ex.exerciseId);
  const wert = typ === "time" ? fmtClock(s.t || 0)
    : typ === "reps" ? `${s.r} Wdh.`
    : `${fmtKg(s.w || 0)} kg × ${s.r} Wdh.`;
  return {
    titel: exName(ex.exerciseId),
    text: `Satz ${si + 1}/${ex.sets.length} · ${wert}`,
  };
}

/* ── Erlaubnis für die Leiste ─────────────────────────────
   Ohne sie bleibt die Meldung aus. Gefragt wird genau einmal und nur, wenn
   tatsächlich ein Workout läuft – nicht beim ersten Start der App, wo die
   Frage aus dem Nichts käme. Bewusst außerhalb des Nachrichtenwegs: Das
   Warten auf eine Antwort war in der alten Fassung genau die Stelle, an der
   sich zwei Nachrichten überholen konnten. */

const REST_MELDUNG_ID = 4711;

let erlaubnisGefragt = false;
function meldungErlaubnisHolen() {
  if (erlaubnisGefragt) return;
  erlaubnisGefragt = true;
  const { LocalNotifications } = capPlugins();
  if (!LocalNotifications) return;
  LocalNotifications.checkPermissions()
    .then((st) => (st.display === "granted" ? null : LocalNotifications.requestPermissions()))
    .catch(() => {});
}

// Aus einer früheren Fassung könnte noch eine über LocalNotifications geplante
// Meldung in der Warteschlange stehen. Die gehört zu keiner Pause mehr und
// würde irgendwann grundlos klingeln – einmal beim Start wegräumen.
function alteErinnerungAufraeumen() {
  const { LocalNotifications } = capPlugins();
  if (!LocalNotifications) return;
  LocalNotifications.cancel({ notifications: [{ id: REST_MELDUNG_ID }] }).catch(() => {});
}

/* ═══════════════ Verlauf-Tab ═══════════════ */

let histRange = "week";
const HIST_RANGES = [
  { id: "week", label: "Woche", title: "Diese Woche" },
  { id: "quarter", label: "Quartal", title: "Dieses Quartal" },
  { id: "year", label: "Jahr", title: "Dieses Jahr" },
  { id: "all", label: "Gesamt", title: "Gesamt" },
];

function rangeStart(r) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (r === "week") return weekStart(Date.now());
  if (r === "quarter") { d.setMonth(Math.floor(d.getMonth() / 3) * 3, 1); return d.getTime(); }
  if (r === "year") { d.setMonth(0, 1); return d.getTime(); }
  return 0;
}

ACTIONS["hist-range"] = (el) => { histRange = el.dataset.r; renderHistory(); };

const histIndex = () => Math.max(0, HIST_RANGES.findIndex((r) => r.id === histRange));

// Wechselt um eine Position weiter. Liefert false, wenn es in die
// Richtung nicht weitergeht (vor „Woche" bzw. hinter „Gesamt").
function histWechseln(richtung) {
  const ziel = histIndex() + richtung;
  if (ziel < 0 || ziel >= HIST_RANGES.length) return false;
  histRange = HIST_RANGES[ziel].id;
  renderHistory();
  paneEinblenden($("#hist-pane"), richtung);
  return true;
}

function histWischenVerbinden() {
  const screen = $("#screen-history");
  if (!screen) return;
  wischenVerbinden(screen, {
    pane: () => $("#hist-pane"),
    amRand: (r) => histIndex() + r < 0 || histIndex() + r >= HIST_RANGES.length,
    blaettern: histWechseln,
  });
}

function renderHistory() {
  const range = HIST_RANGES.find((r) => r.id === histRange);
  const start = rangeStart(histRange);
  const ws = workoutsDesc().filter((w) => w.startedAt >= start);
  const vol = ws.reduce((a, w) => a + workoutVolume(w), 0);
  const sets = ws.reduce((a, w) => a + workoutSets(w), 0);

  $("#screen-history").innerHTML = `
    <div class="screen-head"><div class="screen-title">${tr("Verlauf")}</div></div>
    <div class="seg" role="tablist" aria-label="${tr("Zeitraum")}">
      ${HIST_RANGES.map((r) => `<button role="tab" aria-selected="${r.id === histRange}" class="${r.id === histRange ? "active" : ""}" data-action="hist-range" data-r="${esc(r.id)}">${tr(r.label)}</button>`).join("")}
    </div>
    <div class="swipe-pane" id="hist-pane">
    <div class="section-label">${tr(range.title)}</div>
    <div class="stat-tiles">
      <div class="stat-tile"><b>${ws.length}</b><span>${tr("Workouts")}</span></div>
      <div class="stat-tile"><b>${sets}</b><span>${tr("Sätze")}</span></div>
      <div class="stat-tile"><b>${fmtVol(vol)}</b><span>${tr("Volumen")}</span></div>
    </div>
    <div class="card chart-card">
      <h3>${tr("Volumen")}</h3>
      <div class="chart-sub">${
        histRange === "week" ? tr("Gewicht × Wiederholungen pro Tag, aktuelle Woche")
        : histRange === "quarter" ? tr("Gewicht × Wiederholungen pro Woche, aktuelles Quartal")
        : histRange === "year" ? tr("Gewicht × Wiederholungen pro Monat, aktuelles Jahr")
        : volumeBuckets("all").length && volumeBuckets("all")[0].end - volumeBuckets("all")[0].start > 32 * 86400000
          ? tr("Gewicht × Wiederholungen pro Jahr, gesamte Historie")
          : tr("Gewicht × Wiederholungen pro Monat, gesamte Historie")
      }</div>
      <div class="chart-wrap">${volumeChart(histRange)}</div>
    </div>
    ${beobachtetBlock()}
    <div class="section-label">${tr("Workouts")}</div>
    ${ws.length ? ws.map(historyRow).join("") : `
      <div class="empty">${icon("history")}
        <h3>${tr("Nichts im Zeitraum")}</h3>
        <p>${DB.workouts.length ? tr("In diesem Zeitraum wurde noch nicht trainiert.") : tr("Starte dein erstes Workout über den Start-Tab.")}</p>
      </div>`}
    </div>
  `;
}

/* ── Übungen im Blick ────────────────────────────────────
   Bis zu fünf Übungen, deren Entwicklung man dauerhaft im Verlauf-Tab sehen
   will. Die Kurven zeigen bewusst *alle* Workouts, nicht den oben gewählten
   Zeitraum: Bei „Woche" wären es ein oder zwei Punkte, und die Frage lautet
   ja gerade, ob es über Monate aufwärtsgeht. */

const BEOBACHTET_MAX = 5;

const beobachtet = () =>
  (DB.settings.beobachtet || []).filter((id) => !!exById(id));

function beobachtetBlock() {
  const ids = beobachtet();
  return `
    <div class="section-label">${tr("Übungen im Blick")}</div>
    ${ids.map((id) => {
      const typ = exType(id);
      const rek = recordFor(id);
      return `
      <div class="card chart-card">
        <h3>
          <button class="watch-name" data-action="open-exercise" data-id="${esc(id)}">${esc(exName(id))}</button>
          <button class="mini-btn danger" data-action="watch-del" data-id="${esc(id)}" aria-label="${tr("Aus der Übersicht nehmen")}">${icon("x")}</button>
        </h3>
        <div class="chart-sub">${(() => {
          const was = typ === "time" ? tr("Beste Zeit") : typ === "reps" ? tr("Meiste Wiederholungen") : tr("Bestes Gewicht");
          return rek
            ? tr("{was} pro Workout · alle Workouts · Rekord {rek}", { was, rek: fmtSet(typ, rek.set) })
            : tr("{was} pro Workout · alle Workouts", { was });
        })()}</div>
        <div class="chart-wrap">${progressChart(id)}</div>
      </div>`;
    }).join("")}
    ${ids.length === 0 ? `<p class="hint" style="padding:2px 0 10px">${tr("Noch keine ausgewählt. Wähle bis zu {n} Übungen – etwa Kniebeugen –, dann siehst du hier ihre Entwicklung über alle Workouts.", { n: BEOBACHTET_MAX })}</p>` : ""}
    <button class="btn btn-soft" data-action="watch-pick">${icon(ids.length ? "edit" : "plus")} ${ids.length ? tr("Übungen ändern") : tr("Übungen wählen")}</button>`;
}

ACTIONS["watch-pick"] = () => {
  openExercisePicker((ids) => {
    DB.settings.beobachtet = ids;
    saveDB();
    renderHistory();
  }, {
    vorauswahl: beobachtet(),
    max: BEOBACHTET_MAX,
    knopf: "übernehmen",
    leerErlaubt: true,
  });
};

ACTIONS["watch-del"] = (el) => {
  DB.settings.beobachtet = beobachtet().filter((id) => id !== el.dataset.id);
  saveDB();
  renderHistory();
};

function historyRow(w) {
  return `
    <button class="row" data-action="open-workout" data-id="${esc(w.id)}">
      <span class="row-main">
        <span class="row-title">${esc(w.name)}</span>
        <span class="row-sub">${fmtDate(w.startedAt)} · ${fmtDur(w.durationSec)} · ${workoutSets(w)} ${tr("Sätze")}</span>
      </span>
      <span class="row-side"><b style="font-variant-numeric:tabular-nums">${fmtVol(workoutVolume(w))}</b></span>
      <span class="chev">${icon("chevR")}</span>
    </button>`;
}

ACTIONS["open-workout"] = (el) => openWorkoutDetail(el.dataset.id);

function openWorkoutDetail(id) {
  const w = DB.workouts.find((x) => x.id === id);
  if (!w) return;
  openOverlay(`
    <div class="overlay-head">
      <button class="icon-btn plain" data-action="close-overlay" aria-label="${tr("Zurück")}">${icon("chevL")}</button>
      <div class="screen-title">${esc(w.name)}</div>
    </div>
    <div class="hint" style="margin-bottom:12px">${new Date(w.startedAt).toLocaleDateString(locale(), { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
    <div class="stat-tiles">
      <div class="stat-tile"><b>${fmtDur(w.durationSec)}</b><span>${tr("Dauer")}</span></div>
      <div class="stat-tile"><b>${workoutSets(w)}</b><span>${tr("Sätze")}</span></div>
      <div class="stat-tile"><b>${fmtVol(workoutVolume(w))}</b><span>${tr("Volumen")}</span></div>
    </div>
    ${w.exercises.map((ex) => `
      <div class="card" style="padding:12px 14px">
        <div style="font-weight:700;color:var(--accent);margin-bottom:6px">${esc(exName(ex.exerciseId))}</div>
        ${ex.sets.map((s, i) => `<div style="display:flex;gap:10px;font-variant-numeric:tabular-nums;padding:2px 0">
          <span style="color:var(--ink-3);width:22px">${i + 1}.</span><span>${fmtSet(exType(ex.exerciseId), s)}</span></div>`).join("")}
      </div>`).join("")}
    <button class="btn btn-soft" data-action="repeat-workout" data-id="${esc(w.id)}">${tr("Workout wiederholen")}</button>
    <button class="btn btn-danger-soft" data-action="delete-workout" data-id="${esc(w.id)}" style="margin-top:10px">${icon("trash")} ${tr("Löschen")}</button>
  `, "wo-detail-ov");
}

ACTIONS["repeat-workout"] = (el) => {
  if (active) { toast(tr("Es läuft bereits ein Workout")); return; }
  const w = DB.workouts.find((x) => x.id === el.dataset.id);
  if (!w) return;
  active = {
    id: uid(), name: w.name, startedAt: Date.now(),
    exercises: w.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      superset: ex.superset,
      sets: ex.sets.map(() => newSet()),
    })),
  };
  saveActive();
  $(".wo-detail-ov")?.remove();
  openWorkoutScreen();
};

ACTIONS["delete-workout"] = async (el) => {
  if (!(await appConfirm(tr("Workout endgültig löschen?"), { ok: tr("Löschen"), danger: true }))) return;
  DB.workouts = DB.workouts.filter((w) => w.id !== el.dataset.id);
  saveDB();
  $(".wo-detail-ov")?.remove();
  render();
  toast(tr("Workout gelöscht"));
};

/* ═══════════════ Charts (SVG, eine Serie, Akzentfarbe) ═══════════════ */


// Zeit-Buckets für die jeweilige Sicht: {start, end, label, show}
function volumeBuckets(range) {
  const buckets = [];
  const now = Date.now();
  if (range === "week") {
    const ws = weekStart(now);
    const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
    for (let i = 0; i < 7; i++) {
      buckets.push({ start: ws + i * 86400000, end: ws + (i + 1) * 86400000, label: days[i], show: true });
    }
  } else if (range === "quarter") {
    let i = 0;
    for (let s = weekStart(rangeStart("quarter")); s <= now; s += 7 * 86400000) {
      buckets.push({ start: s, end: s + 7 * 86400000, label: fmtDateShort(s), show: i % 4 === 0 });
      i++;
    }
  } else if (range === "year") {
    const y = new Date().getFullYear();
    for (let m = 0; m < 12; m++) {
      buckets.push({ start: new Date(y, m, 1).getTime(), end: new Date(y, m + 1, 1).getTime(), label: monatKurz(m), show: m % 2 === 0 });
    }
  } else {
    if (!DB.workouts.length) return [];
    const first = new Date(Math.min(...DB.workouts.map((w) => w.startedAt)));
    const cur = new Date();
    const months = (cur.getFullYear() - first.getFullYear()) * 12 + (cur.getMonth() - first.getMonth()) + 1;
    if (months > 24) {
      for (let y = first.getFullYear(); y <= cur.getFullYear(); y++) {
        buckets.push({ start: new Date(y, 0, 1).getTime(), end: new Date(y + 1, 0, 1).getTime(), label: String(y), show: true });
      }
    } else {
      let y = first.getFullYear(), m = first.getMonth();
      while (y < cur.getFullYear() || (y === cur.getFullYear() && m <= cur.getMonth())) {
        buckets.push({ start: new Date(y, m, 1).getTime(), end: new Date(y, m + 1, 1).getTime(), label: monatKurz(m) + (m === 0 ? " " + String(y).slice(2) : ""), show: buckets.length % 2 === 0 });
        m++; if (m > 11) { m = 0; y++; }
      }
    }
  }
  return buckets;
}

function volumeChart(range) {
  const buckets = volumeBuckets(range);
  const vols = buckets.map((b) =>
    DB.workouts.filter((w) => w.startedAt >= b.start && w.startedAt < b.end)
      .reduce((a, w) => a + workoutVolume(w), 0));
  if (!buckets.length || !vols.some((v) => v > 0)) {
    return `<div class="chart-empty">${tr("Sobald du in diesem Zeitraum Workouts trackst, siehst du hier dein Volumen.")}</div>`;
  }
  const W = 320, H = 150, padL = 4, padR = 4, padT = 20, padB = 20;
  const max = Math.max(...vols, 1);
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const n = buckets.length;
  const slot = innerW / n, barW = Math.max(4, Math.min(30, slot * 0.62));
  const maxIdx = vols.indexOf(Math.max(...vols));
  const nowTs = Date.now();
  let curIdx = buckets.findIndex((b) => nowTs >= b.start && nowTs < b.end);
  if (curIdx < 0) curIdx = n - 1;
  let out = "";
  for (let g = 1; g <= 3; g++) {
    const y = padT + innerH - (innerH * g) / 3;
    out += `<line class="chart-grid-line" x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}"/>`;
  }
  out += `<line class="chart-grid-line" x1="${padL}" y1="${padT + innerH}" x2="${W - padR}" y2="${padT + innerH}" style="stroke:var(--axis)"/>`;
  vols.forEach((v, i) => {
    const cx = padL + slot * i + slot / 2;
    const x = cx - barW / 2;
    const h = Math.max(v > 0 ? 3 : 0, (v / max) * innerH);
    const y = padT + innerH - h;
    if (v > 0) {
      const r = Math.min(4, barW / 2, h);
      out += `<path class="bar-rect${i === curIdx ? "" : " dim"}" d="M${x} ${y + r} a${r} ${r} 0 0 1 ${r} ${-r} h${barW - 2 * r} a${r} ${r} 0 0 1 ${r} ${r} v${h - r} h${-barW} z"><title>${esc(buckets[i].label)}: ${fmtVol(v)}</title></path>`;
    }
    // Direkte Beschriftung: Maximum und aktueller Zeitraum
    if (v > 0 && (i === maxIdx || i === curIdx)) {
      out += `<text class="chart-value-text" x="${cx}" y="${y - 5}" text-anchor="middle">${v >= 1000 ? (Math.round(v / 100) / 10).toLocaleString(locale()) + "k" : Math.round(v)}</text>`;
    }
    if (buckets[i].show) {
      out += `<text class="chart-axis-text" x="${cx}" y="${H - 5}" text-anchor="middle">${esc(buckets[i].label)}</text>`;
    }
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${tr("Balkendiagramm: Trainingsvolumen")}">${out}</svg>`;
}

function progressChart(exId) {
  const type = exType(exId);
  const pts = [];
  for (const w of DB.workouts.slice().sort((a, b) => a.startedAt - b.startedAt)) {
    const ex = w.exercises.find((e) => e.exerciseId === exId);
    if (!ex || !ex.sets.length) continue;
    let best = 0;
    for (const s of ex.sets) best = Math.max(best, setValue(type, s));
    pts.push({ date: w.startedAt, val: best });
  }
  const data = pts.slice(-20);
  if (data.length < 2) {
    return `<div class="chart-empty">${tr("Nach mindestens zwei Workouts mit dieser Übung erscheint hier der Verlauf.")}</div>`;
  }
  const W = 320, H = 150, padL = 34, padR = 12, padT = 14, padB = 20;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const vals = data.map((p) => p.val);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (lo === hi) { lo = Math.max(0, lo - 1); hi = hi + 1; }
  const pad = (hi - lo) * 0.12;
  lo = Math.max(0, lo - pad); hi = hi + pad;
  const X = (i) => padL + (innerW * i) / (data.length - 1);
  const Y = (v) => padT + innerH - ((v - lo) / (hi - lo)) * innerH;
  const fmtVal = (v) => type === "time" ? fmtClock(v) : fmtKg(Math.round(v * 10) / 10);
  let out = "";
  for (let g = 0; g <= 3; g++) {
    const v = lo + ((hi - lo) * g) / 3;
    const y = Y(v);
    out += `<line class="chart-grid-line" x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}"/>`;
    out += `<text class="chart-axis-text" x="${padL - 5}" y="${y + 3}" text-anchor="end">${type === "time" ? fmtClock(v) : Math.round(v)}</text>`;
  }
  out += `<polyline class="chart-line" points="${data.map((p, i) => X(i).toFixed(1) + "," + Y(p.val).toFixed(1)).join(" ")}"/>`;
  data.forEach((p, i) => {
    const last = i === data.length - 1;
    out += `<circle class="chart-dot" cx="${X(i).toFixed(1)}" cy="${Y(p.val).toFixed(1)}" r="${last ? 5 : 3.5}"><title>${fmtDate(p.date)}: ${fmtVal(p.val)}</title></circle>`;
  });
  const lastP = data[data.length - 1];
  out += `<text class="chart-value-text" x="${X(data.length - 1)}" y="${Y(lastP.val) - 9}" text-anchor="end">${fmtVal(lastP.val)}</text>`;
  out += `<text class="chart-axis-text" x="${padL}" y="${H - 5}">${fmtDateShort(data[0].date)}</text>`;
  out += `<text class="chart-axis-text" x="${W - padR}" y="${H - 5}" text-anchor="end">${fmtDateShort(lastP.date)}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${tr("Liniendiagramm: Entwicklung über die Zeit")}">${out}</svg>`;
}

/* ═══════════════ Einstellungen ═══════════════ */

ACTIONS["open-settings"] = () => {
  const s = DB.settings;
  openSheet(`
    <div class="sheet-title">${tr("Einstellungen")}
      <button class="icon-btn plain" data-action="close-sheet" aria-label="${tr("Schließen")}">${icon("x")}</button>
    </div>
    <div class="settings-row">
      <div class="lbl">${tr("Sprache")}<small>${tr("Sprache der App")}</small></div>
      <select data-input="sprache" aria-label="${tr("Sprache")}">
        ${SPRACHEN.map((x) => `<option value="${esc(x.id)}" ${x.id === SPRACHE ? "selected" : ""}>${esc(x.label)}</option>`).join("")}
      </select>
    </div>
    <div class="settings-row">
      <div class="lbl">${tr("Pausen-Timer")}<small>${tr("Startet automatisch nach jedem abgehakten Satz")}</small></div>
      <button class="switch ${s.autoRest ? "on" : ""}" data-action="toggle-autorest" role="switch" aria-checked="${s.autoRest}" aria-label="${tr("Pausen-Timer")}"></button>
    </div>
    <div class="settings-row">
      <div class="lbl">${tr("Akzentfarbe")}<small id="accent-name">${esc(accentName())}</small></div>
      <div class="accent-picker" role="radiogroup" aria-label="${tr("Akzentfarbe")}">
        ${ACCENTS.map((a) => `
          <button class="accent-dot ${a.id === (s.accent || ACCENT_DEFAULT) ? "active" : ""}"
            data-action="set-accent" data-a="${esc(a.id)}"
            style="--dot:${a.dot};--dot-ink:${a.ink}"
            role="radio" aria-checked="${a.id === (s.accent || ACCENT_DEFAULT)}"
            aria-label="${esc(tr(a.name))}">${icon("check")}</button>`).join("")}
      </div>
    </div>
    <div class="settings-row">
      <div class="lbl">${tr("Coach")}<small>${tr("Kurze Rückmeldung nach jedem Workout")}</small></div>
      <button class="switch ${s.coach !== false ? "on" : ""}" data-action="toggle-coach" role="switch" aria-checked="${s.coach !== false}" aria-label="${tr("Coach")}"></button>
    </div>
    <div class="settings-row">
      <div class="lbl">${tr("Geräte je Training")}<small>${tr("Kabelzug und Maschinen nur mit demselben Training vergleichen – freie Gewichte immer")}</small></div>
      <button class="switch ${s.geraeteGetrennt !== false ? "on" : ""}" data-action="toggle-geraete" role="switch" aria-checked="${s.geraeteGetrennt !== false}" aria-label="${tr("Geräte je Training")}"></button>
    </div>
    <div class="settings-row">
      <div class="lbl">${tr("Pausendauer")}</div>
      <select data-input="rest-secs">
        ${[30, 45, 60, 90, 120, 150, 180, 240, 300].map((v) =>
          `<option value="${esc(v)}" ${v === s.restSecs ? "selected" : ""}>${v < 60 ? v + " s" : tr("{n} Min.", { n: fmtClock(v) })}</option>`).join("")}
      </select>
    </div>
    <div class="divider"></div>
    <div class="section-label" style="margin-top:0">${tr("Datensicherung")}</div>
    <div class="settings-row">
      <div class="lbl">${tr("Backup erstellen")}<small>${esc(lastBackupLabel())}</small></div>
      <button class="btn btn-compact" data-action="export-data">${icon("download")} ${tr("Sichern")}</button>
    </div>
    <div class="settings-row">
      <div class="lbl">${tr("Backup wiederherstellen")}<small>${tr("Nach einer Neuinstallation zurückholen")}</small></div>
      <button class="btn btn-compact btn-ghost" data-action="import-data">${icon("upload")} ${tr("Laden")}</button>
    </div>
    <p class="hint" style="margin:10px 2px 0">${tr("Sichere dein Backup in Google Drive oder Dateien – dann kannst du es jederzeit zurückholen. Zusätzlich sichert Android die App automatisch in deinem Google-Konto.")}</p>
    <div class="divider"></div>
    <button class="btn btn-danger-soft" data-action="wipe-data">${icon("trash")} ${tr("Alle Daten löschen")}</button>
    <p class="hint" style="margin-top:16px;text-align:center" id="ver-zeile">${APP_NAME} ${APP_VERSION} · ${tr("Deine Daten bleiben auf diesem Gerät.")}</p>
  `);
};

function lastBackupLabel() {
  const ts = DB.settings.lastBackupAt;
  if (!ts) return tr("Noch kein Backup erstellt");
  const days = Math.floor((Date.now() - ts) / 86400000);
  const datum = fmtDate(ts);
  if (days === 0) return tr("Zuletzt heute ({datum})", { datum });
  if (days === 1) return tr("Zuletzt gestern ({datum})", { datum });
  return tr("Zuletzt vor {n} Tagen ({datum})", { n: days, datum });
}

function accentName() {
  const a = ACCENTS.find((x) => x.id === (DB.settings.accent || ACCENT_DEFAULT));
  return a ? tr(a.name) : tr("Blau");
}

ACTIONS["set-accent"] = (el) => {
  DB.settings.accent = el.dataset.a;
  saveDB();
  applyAccent();
  // Auswahl im offenen Sheet markieren, ohne es neu aufzubauen –
  // so sieht man die neue Farbe sofort in der ganzen App.
  $$(".accent-dot").forEach((d) => {
    const on = d.dataset.a === el.dataset.a;
    d.classList.toggle("active", on);
    d.setAttribute("aria-checked", on);
  });
  const lbl = $("#accent-name");
  if (lbl) lbl.textContent = accentName();
  render();
};

ACTIONS["toggle-coach"] = (el) => {
  DB.settings.coach = DB.settings.coach === false;
  saveDB();
  el.classList.toggle("on", DB.settings.coach);
  el.setAttribute("aria-checked", DB.settings.coach);
};

ACTIONS["toggle-geraete"] = (el) => {
  DB.settings.geraeteGetrennt = DB.settings.geraeteGetrennt === false;
  saveDB();
  el.classList.toggle("on", DB.settings.geraeteGetrennt);
  el.setAttribute("aria-checked", DB.settings.geraeteGetrennt);
};

ACTIONS["toggle-autorest"] = (el) => {
  DB.settings.autoRest = !DB.settings.autoRest;
  saveDB();
  el.classList.toggle("on", DB.settings.autoRest);
  el.setAttribute("aria-checked", DB.settings.autoRest);
};

/* ── Backup: erstellen ────────────────────────────────────── */

// Capacitor-Plugins, sofern die App nativ läuft (im Browser: undefined)
const capPlugins = () => (window.Capacitor && window.Capacitor.Plugins) || {};

const backupName = () =>
  "Lumora-Backup-" + new Date().toISOString().slice(0, 10) + ".json";

function markBackupDone() {
  DB.settings.lastBackupAt = Date.now();
  saveDB();
}

// Das Backup nimmt beide Welten mit. Sie liegen getrennt im Speicher, aber
// wer sichert, will alles sichern – nicht die Hälfte.
const backupDaten = () => Object.assign({}, DB, {
  essen: typeof ESSEN === "object" ? ESSEN : undefined,
  gesundheit: typeof GESUND === "object" ? GESUND : undefined,
});

ACTIONS["export-data"] = async () => {
  const json = JSON.stringify(backupDaten(), null, 2);
  const name = backupName();
  const { Filesystem, Share } = capPlugins();

  // Native App: Datei ablegen und über den Teilen-Dialog weitergeben
  // (Google Drive, Dateien, Mail …). Ein Browser-Download funktioniert in
  // der Android-WebView nicht.
  if (Filesystem && Share) {
    try {
      const { uri } = await Filesystem.writeFile({
        path: name, data: json, directory: "CACHE", encoding: "utf8",
      });
      await Share.share({
        title: tr("Lumora-Backup"),
        url: uri,
        dialogTitle: tr("Backup speichern"),
      });
      markBackupDone();
      toast(tr("Backup erstellt"));
      return;
    } catch (e) {
      // Abbruch durch den Nutzer ist kein Fehler
      if (/cancel/i.test(String((e && e.message) || e))) return;
      showBackupText(json, tr("Teilen hat nicht geklappt – hier ist dein Backup als Text:"));
      return;
    }
  }

  // Browser / PWA: klassischer Download
  try {
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    markBackupDone();
    toast(tr("Backup gespeichert"));
  } catch (e) {
    showBackupText(json);
  }
};

// Letzter Ausweg: Backup als Text zum Kopieren
function showBackupText(json, note) {
  openSheet(`
    <div class="sheet-title">${tr("Backup als Text")}
      <button class="icon-btn plain" data-action="close-sheet" aria-label="${tr("Schließen")}">${icon("x")}</button>
    </div>
    <p class="hint" style="margin-bottom:10px">${esc(note || tr("Kopiere den Text und sichere ihn, z. B. in einer Notiz."))}</p>
    <textarea id="backup-text" readonly rows="6" style="width:100%;background:var(--surface-2);border:1px solid var(--border);border-radius:6px;padding:10px;font-size:12px;font-family:monospace">${esc(json)}</textarea>
    <button class="btn" data-action="copy-backup" style="margin-top:12px">${tr("Text kopieren")}</button>
  `);
}

ACTIONS["copy-backup"] = async () => {
  const el = $("#backup-text");
  if (!el) return;
  try {
    await navigator.clipboard.writeText(el.value);
  } catch (e) {
    el.select();
    document.execCommand("copy");
  }
  markBackupDone();
  toast(tr("In die Zwischenablage kopiert"));
};

/* ── Backup: wiederherstellen ─────────────────────────────── */

ACTIONS["import-data"] = () => {
  openSheet(`
    <div class="sheet-title">${tr("Backup wiederherstellen")}
      <button class="icon-btn plain" data-action="close-sheet" aria-label="${tr("Schließen")}">${icon("x")}</button>
    </div>
    <p class="hint" style="margin-bottom:14px">${tr("Wähle deine Backup-Datei aus – oder füge den Backup-Text unten ein.")}</p>
    <button class="btn" data-action="import-file">${icon("upload")} ${tr("Datei auswählen")}</button>
    <div class="divider"></div>
    <div class="field">
      <label for="restore-text">${tr("Backup-Text einfügen")}</label>
      <textarea id="restore-text" rows="4" placeholder='{"version":2,"plans":[…' style="font-family:monospace;font-size:12px"></textarea>
    </div>
    <button class="btn btn-ghost" data-action="import-paste">${tr("Aus Text wiederherstellen")}</button>
  `);
};

ACTIONS["import-file"] = () => {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = "application/json,.json,text/plain";
  inp.onchange = () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => restoreBackup(String(rd.result));
    rd.onerror = () => toast(tr("Datei konnte nicht gelesen werden"));
    rd.readAsText(f);
  };
  inp.click();
};

ACTIONS["import-paste"] = () => {
  const txt = ($("#restore-text") || {}).value || "";
  if (!txt.trim()) { toast(tr("Bitte den Backup-Text einfügen")); return; }
  restoreBackup(txt);
};

// Alte Backups (v1: ein Plan = ein Training) auf die aktuelle Struktur heben
function upgradePlans(plans) {
  return (plans || []).map((p) =>
    p.workouts ? p : {
      id: p.id || uid(), name: p.name, createdAt: p.createdAt || Date.now(),
      workouts: [{ id: uid(), name: p.name, exercises: p.exercises || [] }],
    });
}

async function restoreBackup(text) {
  let data, geprueft;
  try {
    data = JSON.parse(text);
    if (!Array.isArray(data.workouts) || !Array.isArray(data.plans)) throw new Error("Format");
    // In Form bringen, BEVOR irgendetwas davon übernommen wird: Eine
    // abgebrochene Übertragung oder ein von Hand bearbeitetes Backup darf die
    // App nicht in einen Zustand bringen, aus dem sie nicht mehr herauskommt.
    geprueft = bereinigeDB(data);
  } catch (e) {
    toast(tr("Das ist kein gültiges Lumora-Backup"));
    return;
  }

  const hasOwnData = DB.workouts.length > 0 || DB.customExercises.length > 0;
  const anz = (n, ein, viele) => tr(n === 1 ? ein : viele, { n });
  const essenTage = data.essen && data.essen.tage && typeof data.essen.tage === "object"
    ? Object.keys(data.essen.tage).length : 0;
  const teile = {
    workouts: anz(geprueft.workouts.length, "{n} Workout", "{n} Workouts"),
    plaene: anz(geprueft.plans.length, "{n} Plan", "{n} Pläne"),
    tage: anz(essenTage, "{n} Ernährungstag", "{n} Ernährungstage"),
  };
  const summary = tr(essenTage ? "{workouts}, {plaene} und {tage}" : "{workouts}, {plaene}", teile);

  let mode = "replace";
  if (hasOwnData) {
    mode = await askRestoreMode(tr("{summary} gefunden.", { summary }));
    if (!mode) return;
  } else if (!(await appConfirm(tr("{summary} gefunden. Jetzt wiederherstellen?", { summary }), { ok: tr("Wiederherstellen") }))) {
    return;
  }

  // upgradePlans fängt Backups aus der Zeit ab, als ein Plan EIN Training war
  const incoming = {
    plans: bereinigeDB({ plans: upgradePlans(data.plans) }).plans,
    workouts: geprueft.workouts,
    customExercises: migrateMuskeln(geprueft.customExercises),
  };

  if (mode === "merge") {
    // Nach id zusammenführen – vorhandene Einträge bleiben unangetastet
    const byId = (list) => new Set(list.map((x) => x.id));
    const haveW = byId(DB.workouts), haveP = byId(DB.plans), haveE = byId(DB.customExercises);
    DB.workouts = DB.workouts.concat(incoming.workouts.filter((w) => !haveW.has(w.id)));
    DB.plans = DB.plans.concat(incoming.plans.filter((p) => !haveP.has(p.id)));
    DB.customExercises = DB.customExercises.concat(
      incoming.customExercises.filter((e) => !haveE.has(e.id)));
  } else {
    DB = Object.assign(geprueft, incoming, { seeded: true });
    // Ein Backup ohne schemeV stammt aus der Zeit vor dem neuen Farbschema.
    // Der Schlüssel darf dann nicht aus den aktuellen Einstellungen
    // überleben, sonst hält migrateScheme die alte Akzentfarbe für migriert.
    if (!data.settings || data.settings.schemeV === undefined) delete DB.settings.schemeV;
  }
  migrateScheme(DB.settings);

  essenWiederherstellen(data.essen, mode);
  if (typeof gesundWiederherstellen === "function") gesundWiederherstellen(data.gesundheit, mode);

  saveDB();
  applyAccent();
  $$(".backdrop").forEach((b) => b.remove());
  render();
  toast(mode === "merge" ? tr("Backup zusammengeführt") : tr("Backup wiederhergestellt"));
}

/* Die Ernährung wohnt in ihrem eigenen Speicher und darf nicht mitverwaltet
   werden – nur mitgesichert. Deshalb hier ein eigener, kleiner Schritt: Beim
   Ersetzen zählt das Backup, beim Zusammenführen werden Lebensmittel nach
   Kennung und Tage nach Datum ergänzt. Ein Tag, der schon Einträge hat, bleibt
   unangetastet: Zwei Fassungen desselben Tages zu vermischen ergäbe ein
   Mittagessen, das niemand gegessen hat. */
function essenWiederherstellen(daten, mode) {
  if (typeof ESSEN !== "object" || !daten || typeof daten !== "object") return;
  // Erst in Form bringen (siehe bereinigeEssen), dann übernehmen
  const geprueft = bereinigeEssen(daten);
  if (mode !== "merge") {
    ESSEN = geprueft;
  } else {
    const da = new Set(ESSEN.lebensmittel.map((l) => l.id));
    ESSEN.lebensmittel = ESSEN.lebensmittel.concat(
      geprueft.lebensmittel.filter((l) => !da.has(l.id)));
    for (const [tag, liste] of Object.entries(geprueft.tage)) {
      if (!ESSEN.tage[tag] || !ESSEN.tage[tag].length) ESSEN.tage[tag] = liste;
    }
  }
  speichereEssen();
  if (typeof renderEssen === "function") renderEssen();
}

// Auswahl: ersetzen oder zusammenführen
function askRestoreMode(summary) {
  return new Promise((resolve) => {
    const bd = openSheet(`
      <div class="sheet-title">${tr("Wie wiederherstellen?")}</div>
      <p class="hint" style="margin-bottom:14px">${esc(tr("{summary} Du hast bereits eigene Daten in der App.", { summary }))}</p>
      <button class="btn" data-r="merge">${tr("Zusammenführen")}</button>
      <p class="hint" style="margin:6px 2px 14px">${tr("Fehlende Workouts und Pläne werden ergänzt, vorhandene bleiben.")}</p>
      <button class="btn btn-danger-soft" data-r="replace">${tr("Alles ersetzen")}</button>
      <p class="hint" style="margin:6px 2px 0">${tr("Die aktuellen Daten in der App werden verworfen.")}</p>
    `);
    bd.zurueck = () => { bd.remove(); resolve(null); };
    bd.addEventListener("click", (e) => {
      const b = e.target.closest("[data-r]");
      if (b) { bd.remove(); resolve(b.dataset.r); }
      else if (e.target === bd) { bd.remove(); resolve(null); }
    });
  });
}

ACTIONS["wipe-data"] = async () => {
  if (!(await appConfirm(tr("Wirklich ALLE Workouts, Pläne und Übungen löschen?"), { ok: tr("Löschen"), danger: true }))) return;
  if (!(await appConfirm(tr("Ganz sicher? Das kann nicht rückgängig gemacht werden."), { ok: tr("Endgültig löschen"), danger: true }))) return;
  localStorage.removeItem(LS_DB);
  localStorage.removeItem(LS_ACTIVE);
  DB = loadDB();
  saveDB();
  active = null;
  $$(".backdrop").forEach((b) => b.remove());
  render();
  toast(tr("Alle Daten gelöscht"));
};

/* ═══════════════ Eingabe-Delegation ═══════════════ */

document.addEventListener("input", (e) => {
  const el = e.target.closest("[data-input]");
  if (!el) return;
  const k = el.dataset.input;
  if (k === "ex-search") { exSearch = el.value; renderExerciseList(); }
  else if (k === "picker-search") { pickerState.search = el.value; renderPickerList(); }
  else if (k === "plan-name") { draftPlan.name = el.value; }
  else if (k === "plan-wo-name") { draftPlan.workouts[draftWoIdx].name = el.value; }
  else if (k === "plan-sets") {
    const n = parseInt(el.value, 10);
    draftPlan.workouts[draftWoIdx].exercises[+el.dataset.i].sets = Number.isFinite(n) && n > 0 ? Math.min(n, 20) : 3;
  }
  else if (k === "wo-name") { active.name = el.value; saveActive(); }
  else if (k === "plan-titel") {
    // Direkt an der Plan-Ansicht, ohne Entwurf. Ein leerer Name wäre in der
    // Liste unsichtbar, deshalb füllt der blur-Handler ihn auf.
    const pl = DB.plans.find((x) => x.id === el.dataset.id);
    if (pl) { pl.name = el.value; saveDB(); renderPlans(); renderHome(); }
  }
  else if (k === "set-w" || k === "set-r" || k === "set-t") {
    const s = active.exercises[+el.dataset.xi].sets[+el.dataset.si];
    if (k === "set-w") { const v = parseNum(el.value); s.w = Number.isFinite(v) ? v : null; }
    if (k === "set-r") { const v = parseInt(el.value, 10); s.r = Number.isFinite(v) ? v : null; }
    if (k === "set-t") { const v = parseTimeStr(el.value); s.t = Number.isFinite(v) ? v : null; }
    if (s.done) updateWoMeta();
    saveActive();
  }
  else if (INPUTS[k]) INPUTS[k](el, e);
});

// Ein leer gelassener Plan-Name wäre in der Liste unsichtbar
document.addEventListener("blur", (e) => {
  const el = e.target;
  if (!el.dataset || el.dataset.input !== "plan-titel") return;
  const pl = DB.plans.find((x) => x.id === el.dataset.id);
  if (pl && !pl.name.trim()) {
    pl.name = tr("Mein Plan");
    saveDB();
    el.value = pl.name;
    render();
  }
}, true);

document.addEventListener("change", (e) => {
  const sek = e.target.closest('[data-input="rest-secs"]');
  if (sek) { DB.settings.restSecs = parseInt(sek.value, 10); saveDB(); }

  // Sprache wechseln: Die ganze Oberfläche wird neu gezeichnet – auch das
  // offene Einstellungsblatt, damit man den Wechsel sofort sieht.
  const spr = e.target.closest('[data-input="sprache"]');
  if (spr) {
    DB.settings.sprache = spr.value;
    saveDB();
    spracheSetzen(spr.value);
    render();
    $(".backdrop")?.remove();
    ACTIONS["open-settings"]();
  }
});

/* ═══════════════ Android-Zurücktaste ═══════════════
   Zurück soll innerhalb der App navigieren statt sie zu schließen:
   erst offene Dialoge, dann Vollbild-Ansichten, dann zurück zum Start-Tab.
   Erst auf dem Start-Tab beendet ein zweites Zurück die App. */

let beendenBereitBis = 0;

function zurueckNavigieren() {
  // 1. Oberster Dialog (Bestätigung, Sheet, Auswahl)
  const dialoge = $$(".backdrop");
  if (dialoge.length) {
    const oben = dialoge[dialoge.length - 1];
    if (typeof oben.zurueck === "function") oben.zurueck();
    else oben.remove();
    return true;
  }

  // 2. Oberste Vollbild-Ansicht – jede mit ihrer eigenen Schließ-Logik
  const ovs = $$(".overlay");
  if (ovs.length) {
    const oben = ovs[ovs.length - 1];
    // Der Scanner hält die Kamera – die muss beim Zurück wieder los
    if (oben.classList.contains("scan-ov")) ACTIONS["essen-scan-zu"]();
    else if (oben.classList.contains("workout-ov")) ACTIONS["minimize-workout"]();
    else if (oben.classList.contains("picker-ov")) ACTIONS["picker-cancel"]();
    else if (oben.classList.contains("plan-wo-ov")) ACTIONS["plan-wo-done"]();
    else { oben.remove(); render(); }
    return true;
  }

  // 3. Läuft der Pausen-Timer, hat Zurück ihn zuerst weg
  if (rest) { stopRest(); return true; }

  // 4. Aus der Ernährung zurück ins Training – das ist die Heimatwelt
  if (currentBereich !== "training") { bereichWechseln(-bereichIndex()); return true; }

  // 5. Von jedem anderen Tab zurück zum Start
  if (currentTab !== "home") { currentTab = "home"; letzterTab.training = "home"; render(); return true; }

  // 6. Auf dem Start-Tab: erst beim zweiten Mal beenden
  if (Date.now() < beendenBereitBis) return false;
  beendenBereitBis = Date.now() + 2000;
  toast(active ? tr("Workout läuft – nochmal für Beenden") : tr("Nochmal zurück zum Beenden"));
  return true;
}

// Für die Web-Version ohne Capacitor nicht nötig – dort gibt es keine
// Hardware-Zurücktaste, die die App schließen würde.
(function zurueckTasteVerbinden() {
  const { App } = capPlugins();
  if (!App || !App.addListener) return;
  App.addListener("backButton", () => {
    if (!zurueckNavigieren()) App.exitApp();
  });
})();

/* ═══════════════ Haptik ═══════════════
   Zwei Stärken, zwei Bedeutungen: leicht beim Reiterwechsel (reine
   Navigation), kräftiger beim abgeschlossenen Satz (da ist etwas passiert,
   und die Hand ist möglicherweise die einzige, die es mitbekommt – man
   schaut beim Absetzen der Hantel nicht aufs Display).

   Bewusst nur an diesen beiden Stellen: Vibriert alles, achtet man auf
   nichts mehr. Ohne Capacitor (im Browser) versucht es die
   Vibrations-Schnittstelle, die viele Handys ignorieren – dann passiert
   eben nichts. */

function tippen(stark) {
  const { Haptics } = capPlugins();
  if (Haptics) {
    // ImpactStyle: LIGHT ist der kürzeste, MEDIUM der spürbare Klopfer
    Haptics.impact({ style: stark ? "MEDIUM" : "LIGHT" }).catch(() => {});
    return;
  }
  try { navigator.vibrate && navigator.vibrate(stark ? 28 : 12); } catch (e) {}
}

/* ═══════════════ Vollbild-Ansichten melden ═══════════════
   Overlays decken die Tab-Leiste ab. Die Pausenleiste muss das wissen: über
   der Tab-Leiste schweben, wenn sie da ist, sonst ganz nach unten rücken.
   Ein Beobachter ist zuverlässiger, als jede Stelle einzeln zu pflegen, an
   der ein Overlay auf- oder zugeht. */

function vollbildBeobachten() {
  const pruefen = () => {
    document.body.classList.toggle("vollbild", !!document.querySelector(".overlay"));
    // Der Übungs-Picker hat unten eine eigene Aktionsleiste. Ohne diesen
    // Hinweis läge die Pausenleiste genau auf „Übungen hinzufügen" – man
    // konnte auswählen, aber nicht bestätigen.
    document.body.classList.toggle("aktionsleiste", !!document.querySelector(".picker-ov"));
  };
  new MutationObserver(pruefen).observe(document.body, { childList: true });
  pruefen();
}

/* ═══════════════ Platz für die Bildschirmtastatur ═══════════════
   Geht die Tastatur auf, schrumpft der sichtbare Bereich – feste Leisten am
   unteren Rand lägen dann über dem Feld, in das man gerade tippt. Die
   Differenz landet als --tastatur im Stylesheet, die Pausenleiste rückt
   entsprechend nach oben. */

function tastaturBeobachten() {
  const vv = window.visualViewport;
  if (!vv) return;
  const setzen = () => {
    // Wie viel des Fensters verdeckt die Tastatur? Kleine Werte sind
    // Rundungsrauschen, die ignorieren wir.
    const verdeckt = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    document.documentElement.style.setProperty(
      "--tastatur", (verdeckt > 80 ? Math.round(verdeckt) : 0) + "px");
  };
  vv.addEventListener("resize", setzen);
  vv.addEventListener("scroll", setzen);
  setzen();
}

/* ═══════════════ Bildschirm wach halten ═══════════════
   Solange die App offen im Vordergrund liegt, soll der Bildschirm nicht
   zugehen – mitten im Satz will niemand erst entsperren. In der Android-App
   erledigt das MainActivity über ein Fensterflag, hier greift zusätzlich
   die Wake-Lock-API für Browser und PWA. Sobald die App in den Hintergrund
   geht, gibt das System die Sperre von selbst wieder frei. */

let wachSperre = null;

async function bildschirmWachHalten() {
  if (!("wakeLock" in navigator)) return;
  if (document.visibilityState !== "visible" || wachSperre) return;
  try {
    wachSperre = await navigator.wakeLock.request("screen");
    wachSperre.addEventListener("release", () => { wachSperre = null; });
  } catch (e) {
    // Kein Drama: Im Akkusparmodus lehnt das System die Anfrage ab
  }
}

document.addEventListener("visibilitychange", bildschirmWachHalten);

/* ═══════════════ Init ═══════════════ */

// In der nativen App zeichnet Android randlos – der Inhalt läge sonst unter der
// Statusleiste. MainActivity reicht die echten Insets nach; falls das nicht
// greift, sichert dieser Mindestabstand den Kopfbereich ab.
function safeAreaFallback() {
  if (!window.Capacitor) return;
  const root = document.documentElement;
  if (!root.style.getPropertyValue("--android-inset-top")) {
    root.style.setProperty("--min-safe-top", "28px");
  }
}
safeAreaFallback();
setTimeout(safeAreaFallback, 800);

/* Gezeichnet wird nur, was man sieht.
 *
 * Ein voller Durchlauf über alle sieben Bildschirme kostet gemessen rund
 * 40 ms – davon allein 30 ms die Übungsliste mit ihren 180 Piktogrammen. Das
 * bei jedem Reiterwechsel und jedem abgehakten Satz zu zahlen war auf dem
 * Handy als Ruckler zu sehen, obwohl sechs der sieben Bildschirme gar nicht
 * zu sehen waren.
 *
 * Deshalb merkt sich render(), welche Bildschirme veraltet sind, und zeichnet
 * sofort nur den aktuellen. Die übrigen kommen dran, wenn man sie aufruft –
 * für den Betrachter ist das nicht zu unterscheiden, denn jeder Bildschirm
 * baut sich ohnehin vollständig aus dem Zustand auf. */
function bildschirmZeichner() {
  const z = {
    home: renderHome, plans: renderPlans,
    exercises: renderExercises, history: renderHistory,
  };
  // Das Ernährungsmodul lädt nach app.js – beim allerersten render() ist es
  // noch nicht da.
  if (typeof renderEssenTag === "function") {
    z["food-day"] = renderEssenTag;
    z["food-lib"] = renderEssenLib;
    z["food-hist"] = renderEssenVerlauf;
  }
  if (typeof renderKoerper === "function") {
    z["health-body"] = renderKoerper;
    z["health-cal"] = renderKalender;
    z["health-muscle"] = renderBalance;
  }
  return z;
}

let veraltet = new Set();

function sichtbarenZeichnen() {
  const z = bildschirmZeichner();
  if (!veraltet.has(currentTab) || !z[currentTab]) return;
  veraltet.delete(currentTab);
  z[currentTab]();
}

function render() {
  bildschirmBeschriften();
  renderTabbar();
  veraltet = new Set(Object.keys(bildschirmZeichner()));
  sichtbarenZeichnen();
  renderResumeBar();
}

render();
bereichWischenVerbinden();
punkteZeigen(3000);
pauseSignalVerbinden();
alteErinnerungAufraeumen();
histWischenVerbinden();
exWischenVerbinden();
vollbildBeobachten();
tastaturBeobachten();
bildschirmWachHalten();
// Ein wiederhergestelltes Workout gehört sofort in die Leiste
standSenden();
