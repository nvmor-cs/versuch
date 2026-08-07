// Eisenzeit – Trainingslog
// Vanilla JS, keine Abhängigkeiten. Daten liegen in localStorage.

"use strict";

const APP_VERSION = "1.3.0";

// Wählbare Akzentfarben. Die Werte spiegeln die :root[data-accent="…"]-Blöcke
// im Stylesheet; hier stehen sie nur für die Farbpunkte in den Einstellungen.
const ACCENTS = [
  { id: "gold",  name: "Gold",  dot: "#f7b500", ink: "#0b0c0d" },
  { id: "rot",   name: "Rot",   dot: "#ff1f1f", ink: "#ffffff" },
  { id: "gruen", name: "Grün",  dot: "#00e35f", ink: "#06120a" },
  { id: "weiss", name: "Weiß",  dot: "#ffffff", ink: "#0b0c0d" },
];

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
  Number.isFinite(n) ? n.toLocaleString("de-DE", { maximumFractionDigits: 2 }) : "–";
const fmtVol = (n) => Math.round(n).toLocaleString("de-DE") + " kg";

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
  if (m < 60) return m + " Min.";
  return Math.floor(m / 60) + " Std. " + (m % 60) + " Min.";
};
const fmtDate = (ts) =>
  new Date(ts).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });
const fmtDateShort = (ts) =>
  new Date(ts).toLocaleDateString("de-DE", { day: "numeric", month: "numeric" });

const weekStart = (ts) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Montag
  return d.getTime();
};

const MUSCLE_ABBR = {
  Brust: "BR", "Rücken": "RÜ", Schultern: "SC", Nacken: "NA", Bizeps: "BI",
  Trizeps: "TR", Beine: "BE", Po: "PO", Waden: "WA", Bauch: "BA",
  Unterarme: "UA", "Ganzkörper": "GK", Cardio: "CA",
};

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
  link: '<path d="M10 14 14 10"/><path d="M7.5 11.5 6 13a3.5 3.5 0 0 0 5 5l1.5-1.5"/><path d="M16.5 12.5 18 11a3.5 3.5 0 0 0-5-5l-1.5 1.5"/>',
  unlink: '<path d="M7.5 11.5 6 13a3.5 3.5 0 0 0 5 5l1.5-1.5"/><path d="M16.5 12.5 18 11a3.5 3.5 0 0 0-5-5l-1.5 1.5"/><path d="M4 4l16 16"/>',
};
const icon = (n) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;

/* ═══════════════ Datenhaltung ═══════════════ */

const LS_DB = "eisenzeit.db.v1";
const LS_ACTIVE = "eisenzeit.active.v1";

function defaultDB() {
  return {
    version: 2,
    settings: { restSecs: 90, autoRest: true, lastBackupAt: null, accent: "gold" },
    customExercises: [],
    plans: [],
    workouts: [],
    activePlanId: null,
    seeded: false,
  };
}

function loadDB() {
  let db = defaultDB();
  try {
    const raw = localStorage.getItem(LS_DB);
    if (raw) {
      const parsed = JSON.parse(raw);
      db = Object.assign(defaultDB(), parsed);
      db.settings = Object.assign(defaultDB().settings, parsed.settings || {});
    }
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
  if (!db.seeded) {
    db.plans = SAMPLE_PLANS.map((p) => ({
      id: uid(), name: p.name, createdAt: Date.now(),
      workouts: p.workouts.map((w) => ({
        id: uid(), name: w.name,
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
  const id = DB.settings.accent || "gold";
  document.documentElement.setAttribute("data-accent", id);
}
applyAccent();

let active = null;
try { active = JSON.parse(localStorage.getItem(LS_ACTIVE) || "null"); } catch (e) { active = null; }
const saveActive = () => {
  if (active) localStorage.setItem(LS_ACTIVE, JSON.stringify(active));
  else localStorage.removeItem(LS_ACTIVE);
};

/* ═══════════════ Übungs-Zugriff ═══════════════ */

const allExercises = () => EXERCISE_LIBRARY.concat(DB.customExercises);
const exById = (id) => allExercises().find((e) => e.id === id) || null;
const exName = (id) => exById(id) ? exById(id).name : "Gelöschte Übung";
const exType = (id) => exById(id) ? exById(id).type : "weight_reps";

// Sortierte Workouts (neueste zuerst)
const workoutsDesc = () => DB.workouts.slice().sort((a, b) => b.startedAt - a.startedAt);

// Der Plan, nach dem aktuell trainiert wird
const activePlan = () =>
  DB.plans.find((p) => p.id === DB.activePlanId) || DB.plans[0] || null;

// Sätze des letzten Workouts mit dieser Übung
function prevSetsFor(exId, excludeId) {
  for (const w of workoutsDesc()) {
    if (excludeId && w.id === excludeId) continue;
    const ex = w.exercises.find((e) => e.exerciseId === exId);
    if (ex && ex.sets.length) return ex.sets;
  }
  return null;
}

const setValue = (type, s) =>
  type === "weight_reps" ? (s.w || 0) : type === "reps" ? (s.r || 0) : (s.t || 0);

// Bisheriger Rekord (Maximalwert) für eine Übung
function recordFor(exId, excludeId) {
  const type = exType(exId);
  let best = null;
  for (const w of DB.workouts) {
    if (excludeId && w.id === excludeId) continue;
    const ex = w.exercises.find((e) => e.exerciseId === exId);
    if (!ex) continue;
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
  if (type === "reps") return (s.r || 0) + " Wdh.";
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
      <div class="sheet" role="alertdialog" aria-label="Bestätigung">
        <div class="sheet-grip"></div>
        <p style="font-size:15px;font-weight:600;margin:4px 2px 18px">${esc(msg)}</p>
        <div style="display:flex;gap:10px">
          <button class="btn btn-ghost" data-c="0" style="flex:1">Abbrechen</button>
          <button class="btn ${opts.danger ? "btn-danger-soft" : ""}" data-c="1" style="flex:1">${esc(opts.ok || "OK")}</button>
        </div>
      </div>`;
    const done = (v) => { bd.remove(); resolve(v); };
    bd.addEventListener("click", (e) => {
      const b = e.target.closest("[data-c]");
      if (b) done(b.dataset.c === "1");
      else if (e.target === bd) done(false);
    });
    document.body.appendChild(bd);
  });
}

/* ═══════════════ Sheets & Overlays ═══════════════ */

function openSheet(html) {
  const bd = document.createElement("div");
  bd.className = "backdrop";
  bd.innerHTML = `<div class="sheet" role="dialog"><div class="sheet-grip"></div>${html}</div>`;
  bd.addEventListener("click", (e) => { if (e.target === bd) bd.remove(); });
  document.body.appendChild(bd);
  return bd;
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

/* ═══════════════ Tabs ═══════════════ */

let currentTab = "home";
const TABS = [
  { id: "home", label: "Start", ic: "home" },
  { id: "plans", label: "Pläne", ic: "plans" },
  { id: "exercises", label: "Übungen", ic: "dumbbell" },
  { id: "history", label: "Verlauf", ic: "history" },
];

ACTIONS["tab"] = (el) => {
  currentTab = el.dataset.tab;
  render();
};

function renderTabbar() {
  $("#tabbar-inner").innerHTML = TABS.map(
    (t) => `<button class="tab-btn ${t.id === currentTab ? "active" : ""}" data-action="tab" data-tab="${t.id}" aria-label="${t.label}">${icon(t.ic)}<span>${t.label}</span></button>`
  ).join("");
  $$(".screen").forEach((s) => s.classList.toggle("active", s.id === "screen-" + currentTab));
}

/* ═══════════════ Start-Tab ═══════════════ */

function renderHome() {
  const today = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
  const recent = workoutsDesc().slice(0, 3);
  const ap = activePlan();
  $("#screen-home").innerHTML = `
    <div class="screen-head">
      <div>
        <div class="wordmark">Eisen<b>zeit</b></div>
        <div class="screen-title">${esc(today)}</div>
      </div>
      <button class="icon-btn" data-action="open-settings" aria-label="Einstellungen">${icon("gear")}</button>
    </div>
    <button class="btn" data-action="start-empty">${icon("plus")} Leeres Workout starten</button>
    <div class="section-label" style="margin-top:24px">Aktueller Plan</div>
    ${ap ? planCard(ap) : `<p class="hint">Noch kein Plan – lege im Tab „Pläne" einen an.</p>`}
    ${DB.plans.length > 1 ? `<button class="btn btn-ghost" data-action="switch-plan">${icon("plans")} Plan wechseln</button>` : ""}
    ${recent.length ? `<div class="section-label">Zuletzt trainiert</div>` + recent.map(historyRow).join("") : ""}
  `;
}

ACTIONS["switch-plan"] = () => {
  const ap = activePlan();
  openSheet(`
    <div class="sheet-title">Aktiven Plan wählen
      <button class="icon-btn plain" data-action="close-sheet" aria-label="Schließen">${icon("x")}</button>
    </div>
    ${DB.plans.map((p) => `
      <button class="row ${ap && ap.id === p.id ? "picked" : ""}" data-action="set-active-plan" data-id="${p.id}">
        <span class="pick-check">${icon("check")}</span>
        <span class="row-main">
          <span class="row-title">${esc(p.name)}</span>
          <span class="row-sub">${p.workouts.length} Trainings</span>
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
  toast("Aktueller Plan gesetzt");
};

function planCard(p) {
  return `
    <div class="plan-card">
      <div class="plan-card-head">
        <div class="ttl">${esc(p.name)}</div>
        <button class="icon-btn plain" data-action="edit-plan" data-id="${p.id}" aria-label="Plan bearbeiten" style="width:32px;height:32px">${icon("edit")}</button>
      </div>
      ${p.workouts.length ? p.workouts.map((w) => {
        const muscles = Array.from(new Set(w.exercises.map((e) => exById(e.exerciseId)?.muscle).filter(Boolean))).slice(0, 3).join(", ");
        return `
        <div class="plan-wo-row">
          <div class="row-main">
            <div class="row-title">${esc(w.name)}</div>
            <div class="row-sub">${w.exercises.length} Übungen${muscles ? " · " + esc(muscles) : ""}</div>
          </div>
          <button class="btn btn-compact" data-action="start-plan" data-plan="${p.id}" data-wo="${w.id}">Start</button>
        </div>`;
      }).join("") : `<div class="plan-wo-row"><span class="hint">Noch keine Trainings in diesem Plan.</span></div>`}
    </div>`;
}

/* ═══════════════ Pläne-Tab ═══════════════ */

function renderPlans() {
  const ap = activePlan();
  $("#screen-plans").innerHTML = `
    <div class="screen-head">
      <div class="screen-title">Pläne</div>
      <button class="icon-btn" data-action="new-plan" aria-label="Neuer Plan">${icon("plus")}</button>
    </div>
    ${DB.plans.length ? DB.plans.map((p) => {
      const nEx = p.workouts.reduce((a, w) => a + w.exercises.length, 0);
      return `
      <button class="row" data-action="open-plan" data-id="${p.id}">
        <span class="row-main">
          <span class="row-title">${esc(p.name)}</span>
          <span class="row-sub">${p.workouts.length} Trainings · ${nEx} Übungen</span>
        </span>
        ${ap && ap.id === p.id ? `<span class="badge badge-accent">Aktiv</span>` : ""}
        <span class="chev">${icon("chevR")}</span>
      </button>`;
    }).join("") : `
      <div class="empty">${icon("plans")}
        <h3>Noch keine Pläne</h3>
        <p>Ein Plan bündelt mehrere Trainings – z. B. Push, Pull und Beine.</p>
      </div>`}
    <button class="btn btn-ghost" data-action="new-plan" style="margin-top:8px">${icon("plus")} Neuen Plan erstellen</button>
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
      <button class="icon-btn plain" data-action="close-overlay" aria-label="Zurück">${icon("chevL")}</button>
      <div class="screen-title">${esc(p.name)}</div>
      <button class="icon-btn" data-action="edit-plan" data-id="${p.id}" aria-label="Plan bearbeiten">${icon("edit")}</button>
    </div>
    ${isActive
      ? `<span class="badge badge-accent" style="margin-bottom:14px">${icon("check")} Aktiver Plan</span>`
      : `<button class="btn btn-soft" data-action="set-active-plan" data-id="${p.id}" style="margin-bottom:14px">Als aktiven Plan setzen</button>`}
    <div class="section-label">Trainings</div>
    ${p.workouts.length ? p.workouts.map((w, i) => {
      const names = w.exercises.slice(0, 3).map((e) => exName(e.exerciseId)).join(", ");
      return `
      <div class="row" style="cursor:default">
        <div class="row-main" data-action="edit-plan-wo-direct" data-plan="${p.id}" data-i="${i}" style="cursor:pointer">
          <div class="row-title">${esc(w.name)}</div>
          <div class="row-sub">${w.exercises.length} Übungen${names ? " · " + esc(names) : ""}</div>
        </div>
        <button class="btn btn-compact" data-action="start-plan" data-plan="${p.id}" data-wo="${w.id}">Start</button>
      </div>`;
    }).join("") : `<p class="hint" style="padding:4px 0 10px">Noch keine Trainings – tippe oben auf den Stift, um welche anzulegen.</p>`}
    <p class="hint" style="margin-top:10px">Tippe auf ein Training, um Übungen und Sätze zu bearbeiten.</p>
  `;
}

// Öffnet den Editor direkt auf Ebene 2 (ein bestimmtes Training)
ACTIONS["edit-plan-wo-direct"] = (el) => {
  openPlanEditor(el.dataset.plan);
  openPlanWoEditor(+el.dataset.i);
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
      <button class="icon-btn plain" data-action="close-overlay" aria-label="Zurück">${icon("chevL")}</button>
      <div class="screen-title">${isNew ? "Neuer Plan" : "Plan bearbeiten"}</div>
      <button class="btn btn-compact" data-action="save-plan">Speichern</button>
    </div>
    <div class="field">
      <label for="plan-name">Name des Plans</label>
      <input id="plan-name" data-input="plan-name" value="${esc(draftPlan.name)}" placeholder="z. B. Push / Pull / Beine" autocomplete="off">
    </div>
    <div class="section-label">Trainings in diesem Plan</div>
    <div id="plan-wo-liste">
    ${draftPlan.workouts.length ? draftPlan.workouts.map((w, i) => `
      <div class="row" style="cursor:default" data-i="${i}">
        <button class="drag-handle" aria-label="Training verschieben">${icon("grip")}</button>
        <div class="row-main" data-action="edit-plan-wo" data-i="${i}" style="cursor:pointer">
          <div class="row-title">${esc(w.name || "Training " + (i + 1))}</div>
          <div class="row-sub">${w.exercises.length} Übungen · ${w.exercises.reduce((a, e) => a + (e.sets || 0), 0)} Sätze</div>
        </div>
        <button class="mini-btn" data-action="edit-plan-wo" data-i="${i}" aria-label="Bearbeiten">${icon("edit")}</button>
        <button class="mini-btn danger" data-action="plan-wo-del" data-i="${i}" aria-label="Entfernen">${icon("x")}</button>
      </div>`).join("") : `<p class="hint" style="padding:4px 0 12px">Noch keine Trainings – füge z. B. „Push", „Pull" und „Beine" hinzu.</p>`}
    </div>
    <button class="btn btn-soft" data-action="plan-add-wo">${icon("plus")} Training hinzufügen</button>
    ${isNew ? "" : `<button class="btn btn-danger-soft" data-action="delete-plan" style="margin-top:10px">${icon("trash")} Plan löschen</button>`}
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
  if (w.exercises.length && !(await appConfirm(`Training „${w.name || "Training " + (i + 1)}" aus dem Plan entfernen?`, { ok: "Entfernen", danger: true }))) return;
  draftPlan.workouts.splice(i, 1);
  renderPlanEditor();
};
ACTIONS["plan-add-wo"] = () => {
  draftPlan.workouts.push({ id: uid(), name: "", exercises: [] });
  openPlanWoEditor(draftPlan.workouts.length - 1);
};
ACTIONS["edit-plan-wo"] = (el) => openPlanWoEditor(+el.dataset.i);

ACTIONS["save-plan"] = () => {
  draftPlan.name = draftPlan.name.trim() || "Mein Plan";
  draftPlan.workouts.forEach((w, i) => { w.name = (w.name || "").trim() || "Training " + (i + 1); });
  const idx = DB.plans.findIndex((p) => p.id === draftPlan.id);
  if (idx >= 0) DB.plans[idx] = draftPlan;
  else DB.plans.push(draftPlan);
  saveDB();
  $(".plan-editor-ov")?.remove();
  toast("Plan gespeichert");
  render();
  renderPlanDetail();
};
ACTIONS["delete-plan"] = async () => {
  if (!(await appConfirm(`Plan „${draftPlan.name}" wirklich löschen?`, { ok: "Löschen", danger: true }))) return;
  DB.plans = DB.plans.filter((p) => p.id !== draftPlan.id);
  saveDB();
  $(".plan-editor-ov")?.remove();
  $(".plan-detail-ov")?.remove();
  toast("Plan gelöscht");
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
      <button class="icon-btn plain" data-action="plan-wo-done" aria-label="Zurück">${icon("chevL")}</button>
      <div class="screen-title">Training bearbeiten</div>
      <button class="btn btn-compact" data-action="plan-wo-done">Fertig</button>
    </div>
    <div class="field">
      <label for="plan-wo-name">Name des Trainings</label>
      <input id="plan-wo-name" data-input="plan-wo-name" value="${esc(w.name)}" placeholder="z. B. Push (Brust, Schultern, Trizeps)" autocomplete="off">
    </div>
    <div class="section-label">Übungen &amp; Sätze</div>
    <div class="card" style="padding:6px 14px">
      ${w.exercises.length ? w.exercises.map((pe, i) => `
        <div class="plan-ex-row" data-i="${i}">
          <button class="drag-handle" aria-label="Übung verschieben">${icon("grip")}</button>
          <div class="nm">${ssInfo[i] ? `<span class="ss-tag">${ssInfo[i].letter}${ssInfo[i].pos}</span>` : ""}${esc(exName(pe.exerciseId))}<small>${esc(exById(pe.exerciseId)?.muscle || "")}</small></div>
          <input type="text" inputmode="numeric" value="${pe.sets}" data-input="plan-sets" data-i="${i}" aria-label="Sätze">
          <span class="hint">Sätze</span>
          <button class="mini-btn danger" data-action="plan-ex-del" data-i="${i}" aria-label="Entfernen">${icon("x")}</button>
        </div>
        ${i < w.exercises.length - 1 ? `
        <button class="ss-link ${verbunden(i) ? "on" : ""}" data-action="plan-ex-superset" data-i="${i}">
          ${icon(verbunden(i) ? "unlink" : "link")}
          ${verbunden(i) ? "Supersatz – trennen" : "Zum Supersatz verbinden"}
        </button>` : ""}`).join("") : `<p class="hint" style="padding:12px 0">Noch keine Übungen in diesem Training.</p>`}
    </div>
    <button class="btn btn-soft" data-action="plan-add-ex">${icon("plus")} Übungen hinzufügen</button>
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

function renderExercises() {
  $("#screen-exercises").innerHTML = `
    <div class="screen-head">
      <div class="screen-title">Übungen</div>
      <button class="icon-btn" data-action="new-exercise" aria-label="Eigene Übung anlegen">${icon("plus")}</button>
    </div>
    <div class="search-wrap">${icon("search")}
      <input class="search-input" data-input="ex-search" value="${esc(exSearch)}" placeholder="Übung suchen …" autocomplete="off">
    </div>
    <div class="chips">
      ${["Alle"].concat(MUSCLES).map((m) =>
        `<button class="chip ${m === exFilter ? "active" : ""}" data-action="ex-filter" data-m="${esc(m)}">${esc(m)}</button>`).join("")}
    </div>
    <div id="ex-list"></div>
  `;
  renderExerciseList();
}

function filteredExercises() {
  const q = exSearch.trim().toLowerCase();
  return allExercises()
    .filter((e) => exFilter === "Alle" || e.muscle === exFilter)
    .filter((e) => !q || e.name.toLowerCase().includes(q) || (e.alias || "").toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
}

function exerciseRow(e, extra) {
  return `
    <button class="row" data-action="${extra ? extra.action : "open-exercise"}" data-id="${e.id}">
      ${extra && extra.pick ? `<span class="pick-check">${icon("check")}</span>` : ""}
      <span class="muscle-dot">${MUSCLE_ABBR[e.muscle] || "?"}</span>
      <span class="row-main">
        <span class="row-title">${esc(e.name)}</span>
        <span class="row-sub">${esc(e.muscle)} · ${esc(e.equipment)}${e.custom ? " · Eigene" : ""}</span>
      </span>
      ${extra && extra.pick ? "" : `<span class="chev">${icon("chevR")}</span>`}
    </button>`;
}

function renderExerciseList() {
  const list = filteredExercises();
  $("#ex-list").innerHTML = list.length
    ? list.map((e) => exerciseRow(e)).join("")
    : `<div class="empty">${icon("search")}<h3>Nichts gefunden</h3><p>Lege die Übung über das Plus oben rechts selbst an.</p></div>`;
}

ACTIONS["ex-filter"] = (el) => {
  exFilter = el.dataset.m;
  renderExercises();
};

/* Eigene Übung anlegen / bearbeiten */

ACTIONS["new-exercise"] = () => openExerciseForm(null);
ACTIONS["edit-exercise"] = (el) => openExerciseForm(el.dataset.id);

function openExerciseForm(exId) {
  const ex = exId ? DB.customExercises.find((e) => e.id === exId) : null;
  openSheet(`
    <div class="sheet-title">${ex ? "Übung bearbeiten" : "Eigene Übung"}
      <button class="icon-btn plain" data-action="close-sheet" aria-label="Schließen">${icon("x")}</button>
    </div>
    <div class="field"><label for="cx-name">Name</label>
      <input id="cx-name" placeholder="z. B. Larsen Press" value="${esc(ex ? ex.name : "")}" autocomplete="off"></div>
    <div class="field"><label for="cx-muscle">Muskelgruppe</label>
      <select id="cx-muscle">${MUSCLES.map((m) => `<option ${ex && ex.muscle === m ? "selected" : ""}>${m}</option>`).join("")}</select></div>
    <div class="field"><label for="cx-equip">Gerät</label>
      <select id="cx-equip">${EQUIPMENT.map((m) => `<option ${ex && ex.equipment === m ? "selected" : ""}>${m}</option>`).join("")}</select></div>
    <div class="field"><label for="cx-type">Erfassung</label>
      <select id="cx-type">${Object.entries(EXERCISE_TYPES).map(([k, v]) =>
        `<option value="${k}" ${ex && ex.type === k ? "selected" : ""}>${v.label}</option>`).join("")}</select></div>
    <button class="btn" data-action="save-exercise" data-id="${ex ? ex.id : ""}">Speichern</button>
  `);
}

ACTIONS["save-exercise"] = (el) => {
  const name = $("#cx-name").value.trim();
  if (!name) { toast("Bitte einen Namen eingeben"); return; }
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
  toast("Übung gespeichert");
  render();
  if ($(".picker-ov")) renderPickerList();
};

ACTIONS["delete-exercise"] = async (el) => {
  const ex = DB.customExercises.find((e) => e.id === el.dataset.id);
  if (!ex) return;
  if (!(await appConfirm(`„${ex.name}" löschen? Bereits getrackte Workouts bleiben erhalten.`, { ok: "Löschen", danger: true }))) return;
  DB.customExercises = DB.customExercises.filter((e) => e.id !== ex.id);
  saveDB();
  $(".ex-detail-ov")?.remove();
  toast("Übung gelöscht");
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
      : ex.type === "reps" ? rec.val + " Wdh." : fmtClock(rec.val)
    : null;

  openOverlay(`
    <div class="overlay-head">
      <button class="icon-btn plain" data-action="close-overlay" aria-label="Zurück">${icon("chevL")}</button>
      <div class="screen-title">${esc(ex.name)}</div>
      ${ex.custom ? `<button class="icon-btn" data-action="edit-exercise" data-id="${ex.id}" aria-label="Bearbeiten">${icon("edit")}</button>` : ""}
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
      <span class="badge badge-accent">${esc(ex.muscle)}</span>
      <span class="badge badge-muted">${esc(ex.equipment)}</span>
      <span class="badge badge-muted">${EXERCISE_TYPES[ex.type].label}</span>
      ${ex.custom ? `<span class="badge badge-muted">Eigene Übung</span>` : ""}
    </div>
    ${rec ? `
      <div class="card" style="display:flex;gap:16px;align-items:center">
        <span class="badge badge-gold" style="padding:8px">${icon("trophy")}</span>
        <div>
          <div style="font-weight:800;font-size:18px">${recLabel}</div>
          <div class="hint">Bester Satz${best1rm ? " · geschätztes 1RM: " + fmtKg(Math.round(best1rm * 2) / 2) + " kg" : ""}</div>
        </div>
      </div>` : ""}
    <div class="card chart-card">
      <h3>Entwicklung</h3>
      <div class="chart-sub">${ex.type === "weight_reps" ? "Schwerster Satz (kg) pro Workout" : ex.type === "reps" ? "Beste Wiederholungszahl pro Workout" : "Längste Dauer pro Workout"}</div>
      <div class="chart-wrap">${progressChart(exId)}</div>
    </div>
    ${hist.length ? `<div class="section-label">Historie</div>` + hist.map((h) => `
      <div class="card" style="padding:12px 14px">
        <div class="row-sub" style="margin-bottom:6px">${fmtDate(h.w.startedAt)} · ${esc(h.w.name)}</div>
        ${h.sets.map((s, i) => `<div style="display:flex;gap:10px;font-variant-numeric:tabular-nums;padding:2px 0">
          <span style="color:var(--ink-3);width:22px">${i + 1}.</span><span>${fmtSet(ex.type, s)}</span></div>`).join("")}
      </div>`).join("")
      : `<div class="empty">${icon("dumbbell")}<h3>Noch keine Einträge</h3><p>Tracke die Übung in einem Workout, dann erscheint hier deine Entwicklung.</p></div>`}
    ${ex.custom ? `<button class="btn btn-danger-soft" data-action="delete-exercise" data-id="${ex.id}">${icon("trash")} Übung löschen</button>` : ""}
  `, "ex-detail-ov");
}

/* ═══════════════ Übungs-Picker (Mehrfachauswahl) ═══════════════ */

let pickerState = null;

function openExercisePicker(onDone) {
  pickerState = { selected: new Set(), search: "", filter: "Alle", onDone };
  const ov = openOverlay(`
    <div class="overlay-head">
      <button class="icon-btn plain" data-action="picker-cancel" aria-label="Abbrechen">${icon("x")}</button>
      <div class="screen-title">Übungen wählen</div>
      <button class="icon-btn" data-action="new-exercise" aria-label="Eigene Übung">${icon("plus")}</button>
    </div>
    <div class="search-wrap">${icon("search")}
      <input class="search-input" data-input="picker-search" placeholder="Übung suchen …" autocomplete="off">
    </div>
    <div class="chips" id="picker-chips"></div>
    <div id="picker-list"></div>
    <div style="position:fixed;left:0;right:0;bottom:0;z-index:65;padding:12px 16px calc(var(--safe-bottom) + 14px);background:linear-gradient(transparent, var(--bg) 40%)">
      <div style="max-width:560px;margin:0 auto">
        <button class="btn" data-action="picker-done" id="picker-done" disabled>Übungen hinzufügen</button>
      </div>
    </div>
  `, "picker-ov");
  renderPickerChips();
  renderPickerList();
  return ov;
}

function renderPickerChips() {
  $("#picker-chips").innerHTML = ["Alle"].concat(MUSCLES).map((m) =>
    `<button class="chip ${m === pickerState.filter ? "active" : ""}" data-action="picker-filter" data-m="${esc(m)}">${esc(m)}</button>`).join("");
}

function renderPickerList() {
  const q = pickerState.search.trim().toLowerCase();
  const list = allExercises()
    .filter((e) => pickerState.filter === "Alle" || e.muscle === pickerState.filter)
    .filter((e) => !q || e.name.toLowerCase().includes(q) || (e.alias || "").toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
  $("#picker-list").innerHTML = list.map((e) => `
    <button class="row ${pickerState.selected.has(e.id) ? "picked" : ""}" data-action="picker-toggle" data-id="${e.id}">
      <span class="pick-check">${icon("check")}</span>
      <span class="muscle-dot">${MUSCLE_ABBR[e.muscle] || "?"}</span>
      <span class="row-main">
        <span class="row-title">${esc(e.name)}</span>
        <span class="row-sub">${esc(e.muscle)} · ${esc(e.equipment)}</span>
      </span>
    </button>`).join("") || `<p class="hint" style="padding:12px 4px">Nichts gefunden.</p>`;
  updatePickerDone();
}

function updatePickerDone() {
  const n = pickerState.selected.size;
  const btn = $("#picker-done");
  if (!btn) return;
  btn.disabled = n === 0;
  btn.textContent = n === 0 ? "Übungen hinzufügen" : n === 1 ? "1 Übung hinzufügen" : `${n} Übungen hinzufügen`;
}

ACTIONS["picker-filter"] = (el) => { pickerState.filter = el.dataset.m; renderPickerChips(); renderPickerList(); };
ACTIONS["picker-toggle"] = (el) => {
  const id = el.dataset.id;
  if (pickerState.selected.has(id)) pickerState.selected.delete(id);
  else pickerState.selected.add(id);
  el.classList.toggle("picked");
  updatePickerDone();
};
ACTIONS["picker-cancel"] = () => { $(".picker-ov")?.remove(); pickerState = null; };
ACTIONS["picker-done"] = () => {
  const ids = Array.from(pickerState.selected);
  const cb = pickerState.onDone;
  $(".picker-ov")?.remove();
  pickerState = null;
  if (ids.length) cb(ids);
};

/* ═══════════════ Aktives Workout ═══════════════ */

const newSet = () => ({ w: null, r: null, t: null, done: false });

function autoName() {
  const h = new Date().getHours();
  return h < 11 ? "Morgen-Workout" : h < 15 ? "Mittags-Workout" : h < 19 ? "Nachmittags-Workout" : "Abend-Workout";
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
  toast("Es läuft bereits ein Workout");
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
      <button class="icon-btn plain" data-action="minimize-workout" aria-label="Minimieren">${icon("chevD")}</button>
      <input class="screen-title" data-input="wo-name" value="${esc(active.name)}"
        style="background:none;border:none;padding:0;width:100%;min-width:0" aria-label="Workout-Name">
      <button class="btn btn-good btn-compact" data-action="finish-workout">Beenden</button>
    </div>
    <div class="wo-meta">
      <div><span>Dauer</span><b id="wo-dur">${fmtClock((Date.now() - active.startedAt) / 1000)}</b></div>
      <div><span>Sätze</span><b id="wo-sets">0</b></div>
      <div><span>Volumen</span><b id="wo-vol">0 kg</b></div>
    </div>
    <div id="wo-exercises"></div>
    <button class="btn btn-soft" data-action="wo-add-ex">${icon("plus")} Übung hinzufügen</button>
    <button class="btn btn-danger-soft" data-action="discard-workout" style="margin-top:10px">${icon("trash")} Workout verwerfen</button>
  `;
  renderWoExercises();
  updateWoMeta();
}

function renderWoExercises() {
  const host = $("#wo-exercises");
  if (!host || !active) return;
  host.innerHTML = active.exercises.length
    ? active.exercises.map((ex, xi) => woExerciseBlock(ex, xi)).join("")
    : `<div class="empty">${icon("dumbbell")}<h3>Leg los!</h3><p>Füge deine erste Übung hinzu.</p></div>`;
}

function woExerciseBlock(ex, xi) {
  const type = exType(ex.exerciseId);
  const prev = prevSetsFor(ex.exerciseId);
  const curIdx = ex.sets.findIndex((s) => !s.done);
  const ss = supersetInfo(active.exercises)[xi];
  const nächste = active.exercises[xi + 1];
  const verbunden = !!ex.superset && ex.superset === (nächste || {}).superset;
  return `
    <div class="exercise-block ${ss ? "in-superset" : ""}" data-xi="${xi}">
      ${ss ? `<div class="ss-head">${icon("link")} Supersatz ${ss.letter} · Übung ${ss.pos} von ${ss.size}</div>` : ""}
      <div class="exercise-block-head">
        <button class="name" data-action="open-exercise" data-id="${ex.exerciseId}">${esc(exName(ex.exerciseId))}</button>
        <button class="mini-btn danger" data-action="wo-del-ex" data-xi="${xi}" aria-label="Übung entfernen">${icon("x")}</button>
      </div>
      ${ex.sets.map((s, si) =>
        s.done ? doneSetRow(type, s, si, xi)
        : si === curIdx ? currentSetCard(type, ex, xi, si, prev)
        : queuedSetRow(si, xi)).join("")}
      ${curIdx < 0 ? `<div class="all-done-note">${icon("check")} Alle ${ex.sets.length} Sätze abgeschlossen</div>` : ""}
      <button class="add-set-btn" data-action="wo-add-set" data-xi="${xi}">+ Satz hinzufügen</button>
    </div>
    ${nächste ? `
    <button class="ss-link ${verbunden ? "on" : ""}" data-action="wo-superset" data-xi="${xi}">
      ${icon(verbunden ? "unlink" : "link")}
      ${verbunden ? "Supersatz – trennen" : "Mit nächster Übung verbinden"}
    </button>` : ""}`;
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
      <button class="done-set-main" data-action="wo-undo-set" data-xi="${xi}" data-si="${si}" title="Satz zurückholen">
        <span class="done-check">${icon("check")}</span>
        <span class="done-no">Satz ${si + 1}</span>
        <b>${fmtSet(type, s)}</b>
      </button>
      <button class="mini-btn danger" data-action="wo-del-set" data-xi="${xi}" data-si="${si}" aria-label="Satz löschen">${icon("x")}</button>
    </div>`;
}

// Geplanter Satz: wartet, bis der aktuelle abgeschlossen ist
function queuedSetRow(si, xi) {
  return `
    <div class="queued-set">
      <span class="q-no">Satz ${si + 1}</span>
      <span class="q-lbl">geplant</span>
      <button class="mini-btn danger" data-action="wo-del-set" data-xi="${xi}" data-si="${si}" aria-label="Geplanten Satz entfernen">${icon("x")}</button>
    </div>`;
}

// Aktueller Satz: Karte mit Plus/Minus-Steppern und Abschließen-Button
function currentSetCard(type, ex, xi, si, prev) {
  const s = ex.sets[si];
  const p = prev && prev[si];
  // Startwerte: gleicher Satz vom letzten Mal, sonst letzter fertiger Satz, sonst Standard
  const lastDone = ex.sets.slice(0, si).reverse().find((x) => x.done);
  if (type === "weight_reps") {
    if (s.w == null) s.w = p && p.w != null ? p.w : lastDone && lastDone.w != null ? lastDone.w : 20;
    if (s.r == null) s.r = p && p.r != null ? p.r : lastDone && lastDone.r != null ? lastDone.r : 8;
  } else if (type === "reps") {
    if (s.r == null) s.r = p && p.r != null ? p.r : lastDone && lastDone.r != null ? lastDone.r : 10;
  } else {
    if (s.t == null) s.t = p && p.t ? p.t : lastDone && lastDone.t ? lastDone.t : 60;
  }
  saveActive();
  const d = `data-xi="${xi}" data-si="${si}"`;
  const stepper = (label, field, inputHtml) => `
    <div class="stepper-group">
      <div class="stepper-label">${label}</div>
      <div class="stepper">
        <button class="stepper-btn" data-action="wo-step" data-f="${field}" data-d="-1" ${d} aria-label="${label} verringern">−</button>
        ${inputHtml}
        <button class="stepper-btn" data-action="wo-step" data-f="${field}" data-d="1" ${d} aria-label="${label} erhöhen">+</button>
      </div>
    </div>`;
  const wInput = `<input class="stepper-val" type="text" inputmode="decimal" data-input="set-w" ${d} value="${String(s.w).replace(".", ",")}" aria-label="Gewicht in kg">`;
  const rInput = `<input class="stepper-val" type="text" inputmode="numeric" data-input="set-r" ${d} value="${s.r}" aria-label="Wiederholungen">`;
  const tInput = `<input class="stepper-val" type="text" inputmode="numeric" data-input="set-t" ${d} value="${fmtClock(s.t)}" aria-label="Zeit">`;
  return `
    <div class="current-set">
      <div class="current-set-head">
        <span class="cs-no">Satz ${si + 1} / ${ex.sets.length}</span>
        <span class="cs-prev">${p ? "Letztes Mal: " + fmtSet(type, p) : "Erster Eintrag"}</span>
        <button class="mini-btn" data-action="wo-del-set" ${d} aria-label="Satz entfernen">${icon("x")}</button>
      </div>
      ${type === "weight_reps" ? stepper("Gewicht (kg)", "w", wInput) + stepper("Wiederholungen", "r", rInput) : ""}
      ${type === "reps" ? stepper("Wiederholungen", "r", rInput) : ""}
      ${type === "time" ? stepper("Zeit (Min:Sek)", "t", tInput) : ""}
      <button class="btn" data-action="wo-complete-set" ${d}>${icon("check")} Satz abschließen</button>
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
  if (ex.sets.some((s) => s.done) && !(await appConfirm(`„${exName(ex.exerciseId)}" mit abgehakten Sätzen entfernen?`, { ok: "Entfernen", danger: true }))) return;
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
  if (ex.sets.length <= 1) { toast("Letzter Satz – entferne stattdessen die Übung"); return; }
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
  if (f === "r") s.r = Math.max(1, (s.r || 0) + dir);
  if (f === "t") s.t = Math.max(15, (s.t || 0) + dir * 15);
  const inp = $(`[data-input="set-${f}"][data-xi="${xi}"][data-si="${si}"]`);
  if (inp) inp.value = f === "w" ? String(s.w).replace(".", ",") : f === "t" ? fmtClock(s.t) : s.r;
  saveActive();
};

ACTIONS["wo-complete-set"] = (el) => {
  const xi = +el.dataset.xi, si = +el.dataset.si;
  const ex = active.exercises[xi];
  const s = ex.sets[si];
  const type = exType(ex.exerciseId);
  if ((type === "weight_reps" || type === "reps") && (!s.r || s.r <= 0)) { toast("Wiederholungen eintragen"); return; }
  if (type === "time" && (!s.t || s.t <= 0)) { toast("Zeit eintragen, z. B. 1:30"); return; }
  if (type === "weight_reps" && s.w == null) s.w = 0;
  s.done = true;
  saveActive();
  renderWoExercises();
  updateWoMeta();

  // Im Supersatz geht es ohne Pause direkt zur nächsten Übung der Runde.
  // Erst wenn die Runde durch ist, läuft der Pausen-Timer.
  const weiter = naechsteImSupersatz(xi);
  if (weiter >= 0) {
    const block = $(`.exercise-block[data-xi="${weiter}"]`);
    if (block) block.scrollIntoView({ behavior: "smooth", block: "center" });
    toast("Weiter mit " + exName(active.exercises[weiter].exerciseId));
    return;
  }
  if (DB.settings.autoRest && type !== "time") startRest(DB.settings.restSecs);
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
  if (!(await appConfirm("Workout wirklich verwerfen? Alle Eingaben gehen verloren.", { ok: "Verwerfen", danger: true }))) return;
  active = null;
  saveActive();
  stopRest();
  $(".workout-ov")?.remove();
  render();
  toast("Workout verworfen");
};

ACTIONS["finish-workout"] = async () => {
  if (!active) return;
  const finished = {
    id: active.id,
    name: active.name.trim() || "Workout",
    startedAt: active.startedAt,
    endedAt: Date.now(),
    durationSec: Math.round((Date.now() - active.startedAt) / 1000),
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
    if (await appConfirm("Keine abgehakten Sätze. Workout verwerfen?", { ok: "Verwerfen", danger: true })) {
      active = null; saveActive(); stopRest();
      $(".workout-ov")?.remove(); render();
    }
    return;
  }
  if (undone > 0 && !(await appConfirm(`${undone} nicht abgehakte${undone === 1 ? "r Satz wird" : " Sätze werden"} verworfen. Workout beenden?`, { ok: "Beenden" }))) return;
  if (!active) return;

  // Rekorde ermitteln (vor dem Speichern, gegen die bisherige Historie)
  const prs = [];
  for (const ex of finished.exercises) {
    const type = exType(ex.exerciseId);
    let bestNew = 0;
    for (const s of ex.sets) bestNew = Math.max(bestNew, setValue(type, s));
    const old = recordFor(ex.exerciseId);
    if (bestNew > 0 && (!old || bestNew > old.val)) {
      prs.push({ name: exName(ex.exerciseId), type, val: bestNew, first: !old });
    }
  }

  DB.workouts.push(finished);
  saveDB();
  active = null;
  saveActive();
  stopRest();
  $(".workout-ov")?.remove();
  render();
  showSummary(finished, prs);
};

function showSummary(w, prs) {
  openSheet(`
    <div class="summary-hero">
      <div class="sub">Workout gespeichert</div>
      <div class="big">${fmtVol(workoutVolume(w))}</div>
      <div class="sub">${fmtDur(w.durationSec)} · ${workoutSets(w)} Sätze · ${w.exercises.length} Übungen</div>
    </div>
    ${prs.length ? `<div class="section-label">Neue Rekorde</div>` + prs.map((p) => `
      <div class="row" style="cursor:default">
        <span class="badge badge-gold">${icon("trophy")} ${p.first ? "Erste Marke" : "Rekord"}</span>
        <span class="row-main"><span class="row-title">${esc(p.name)}</span></span>
        <b style="font-variant-numeric:tabular-nums">${p.type === "weight_reps" ? fmtKg(p.val) + " kg" : p.type === "reps" ? p.val + " Wdh." : fmtClock(p.val)}</b>
      </div>`).join("") : ""}
    ${backupReminder()}
    <button class="btn" data-action="close-sheet" style="margin-top:14px">Fertig</button>
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
        <div style="font-weight:800;font-size:14px">Backup sichern</div>
        <div class="hint">${last
          ? "Dein letztes Backup ist über zwei Wochen her."
          : "Du hast noch kein Backup – so gehen deine Daten nie verloren."}</div>
      </div>
      <button class="btn btn-compact" data-action="export-data">Sichern</button>
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
      <span class="sub">Workout läuft · <span class="t">${fmtClock((Date.now() - active.startedAt) / 1000)}</span></span>
    </span>
    <span class="go">Weiter</span>`;
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

/* ═══════════════ Pausen-Timer ═══════════════ */

let rest = null; // { endsAt, total, interval }
let audioCtx = null;

function startRest(secs) {
  stopRest();
  try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume(); } catch (e) {}
  rest = { endsAt: Date.now() + secs * 1000, total: secs };
  const bar = document.createElement("div");
  bar.id = "rest-bar";
  bar.className = "rest-bar";
  bar.innerHTML = `
    <div class="time" id="rest-time"></div>
    <div class="bar"><i id="rest-fill"></i></div>
    <button data-action="rest-plus">+15 s</button>
    <button data-action="rest-skip">Fertig</button>`;
  document.body.appendChild(bar);
  rest.interval = setInterval(tickRest, 250);
  tickRest();
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

function restDone() {
  stopRest();
  toast("Pause vorbei – nächster Satz!");
  try { navigator.vibrate && navigator.vibrate([180, 90, 180]); } catch (e) {}
  try {
    if (audioCtx) {
      [0, 0.22, 0.44].forEach((d) => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.frequency.value = 880;
        o.connect(g); g.connect(audioCtx.destination);
        const t0 = audioCtx.currentTime + d;
        g.gain.setValueAtTime(0.001, t0);
        g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.16);
        o.start(t0); o.stop(t0 + 0.18);
      });
    }
  } catch (e) {}
}

function stopRest() {
  if (rest) clearInterval(rest.interval);
  rest = null;
  $("#rest-bar")?.remove();
}

ACTIONS["rest-plus"] = () => { if (rest) { rest.endsAt += 15000; rest.total += 15; tickRest(); } };
ACTIONS["rest-skip"] = () => stopRest();

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

function renderHistory() {
  const range = HIST_RANGES.find((r) => r.id === histRange);
  const start = rangeStart(histRange);
  const ws = workoutsDesc().filter((w) => w.startedAt >= start);
  const vol = ws.reduce((a, w) => a + workoutVolume(w), 0);
  const sets = ws.reduce((a, w) => a + workoutSets(w), 0);

  $("#screen-history").innerHTML = `
    <div class="screen-head"><div class="screen-title">Verlauf</div></div>
    <div class="seg" role="tablist" aria-label="Zeitraum">
      ${HIST_RANGES.map((r) => `<button role="tab" aria-selected="${r.id === histRange}" class="${r.id === histRange ? "active" : ""}" data-action="hist-range" data-r="${r.id}">${r.label}</button>`).join("")}
    </div>
    <div class="section-label">${range.title}</div>
    <div class="stat-tiles">
      <div class="stat-tile"><b>${ws.length}</b><span>Workouts</span></div>
      <div class="stat-tile"><b>${sets}</b><span>Sätze</span></div>
      <div class="stat-tile"><b>${fmtVol(vol)}</b><span>Volumen</span></div>
    </div>
    <div class="card chart-card">
      <h3>Volumen</h3>
      <div class="chart-sub">${
        histRange === "week" ? "Gewicht × Wiederholungen pro Tag, aktuelle Woche"
        : histRange === "quarter" ? "Gewicht × Wiederholungen pro Woche, aktuelles Quartal"
        : histRange === "year" ? "Gewicht × Wiederholungen pro Monat, aktuelles Jahr"
        : "Gewicht × Wiederholungen pro " + (volumeBuckets("all").length && volumeBuckets("all")[0].end - volumeBuckets("all")[0].start > 32 * 86400000 ? "Jahr" : "Monat") + ", gesamte Historie"
      }</div>
      <div class="chart-wrap">${volumeChart(histRange)}</div>
    </div>
    <div class="section-label">Workouts</div>
    ${ws.length ? ws.map(historyRow).join("") : `
      <div class="empty">${icon("history")}
        <h3>Nichts im Zeitraum</h3>
        <p>${DB.workouts.length ? "In diesem Zeitraum wurde noch nicht trainiert." : "Starte dein erstes Workout über den Start-Tab."}</p>
      </div>`}
  `;
}

function historyRow(w) {
  return `
    <button class="row" data-action="open-workout" data-id="${w.id}">
      <span class="row-main">
        <span class="row-title">${esc(w.name)}</span>
        <span class="row-sub">${fmtDate(w.startedAt)} · ${fmtDur(w.durationSec)} · ${workoutSets(w)} Sätze</span>
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
      <button class="icon-btn plain" data-action="close-overlay" aria-label="Zurück">${icon("chevL")}</button>
      <div class="screen-title">${esc(w.name)}</div>
    </div>
    <div class="hint" style="margin-bottom:12px">${new Date(w.startedAt).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
    <div class="stat-tiles">
      <div class="stat-tile"><b>${fmtDur(w.durationSec)}</b><span>Dauer</span></div>
      <div class="stat-tile"><b>${workoutSets(w)}</b><span>Sätze</span></div>
      <div class="stat-tile"><b>${fmtVol(workoutVolume(w))}</b><span>Volumen</span></div>
    </div>
    ${w.exercises.map((ex) => `
      <div class="card" style="padding:12px 14px">
        <div style="font-weight:700;color:var(--accent);margin-bottom:6px">${esc(exName(ex.exerciseId))}</div>
        ${ex.sets.map((s, i) => `<div style="display:flex;gap:10px;font-variant-numeric:tabular-nums;padding:2px 0">
          <span style="color:var(--ink-3);width:22px">${i + 1}.</span><span>${fmtSet(exType(ex.exerciseId), s)}</span></div>`).join("")}
      </div>`).join("")}
    <button class="btn btn-soft" data-action="repeat-workout" data-id="${w.id}">Workout wiederholen</button>
    <button class="btn btn-danger-soft" data-action="delete-workout" data-id="${w.id}" style="margin-top:10px">${icon("trash")} Löschen</button>
  `, "wo-detail-ov");
}

ACTIONS["repeat-workout"] = (el) => {
  if (active) { toast("Es läuft bereits ein Workout"); return; }
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
  if (!(await appConfirm("Workout endgültig löschen?", { ok: "Löschen", danger: true }))) return;
  DB.workouts = DB.workouts.filter((w) => w.id !== el.dataset.id);
  saveDB();
  $(".wo-detail-ov")?.remove();
  render();
  toast("Workout gelöscht");
};

/* ═══════════════ Charts (SVG, eine Serie, Akzentfarbe) ═══════════════ */

const MONTH_SHORT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

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
      buckets.push({ start: new Date(y, m, 1).getTime(), end: new Date(y, m + 1, 1).getTime(), label: MONTH_SHORT[m], show: m % 2 === 0 });
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
        buckets.push({ start: new Date(y, m, 1).getTime(), end: new Date(y, m + 1, 1).getTime(), label: MONTH_SHORT[m] + (m === 0 ? " " + String(y).slice(2) : ""), show: buckets.length % 2 === 0 });
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
    return `<div class="chart-empty">Sobald du in diesem Zeitraum Workouts trackst, siehst du hier dein Volumen.</div>`;
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
      out += `<text class="chart-value-text" x="${cx}" y="${y - 5}" text-anchor="middle">${v >= 1000 ? (Math.round(v / 100) / 10).toLocaleString("de-DE") + "k" : Math.round(v)}</text>`;
    }
    if (buckets[i].show) {
      out += `<text class="chart-axis-text" x="${cx}" y="${H - 5}" text-anchor="middle">${esc(buckets[i].label)}</text>`;
    }
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Balkendiagramm: Trainingsvolumen">${out}</svg>`;
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
    return `<div class="chart-empty">Nach mindestens zwei Workouts mit dieser Übung erscheint hier der Verlauf.</div>`;
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
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Liniendiagramm: Entwicklung über die Zeit">${out}</svg>`;
}

/* ═══════════════ Einstellungen ═══════════════ */

ACTIONS["open-settings"] = () => {
  const s = DB.settings;
  openSheet(`
    <div class="sheet-title">Einstellungen
      <button class="icon-btn plain" data-action="close-sheet" aria-label="Schließen">${icon("x")}</button>
    </div>
    <div class="settings-row">
      <div class="lbl">Pausen-Timer<small>Startet automatisch nach jedem abgehakten Satz</small></div>
      <button class="switch ${s.autoRest ? "on" : ""}" data-action="toggle-autorest" role="switch" aria-checked="${s.autoRest}" aria-label="Pausen-Timer"></button>
    </div>
    <div class="settings-row">
      <div class="lbl">Akzentfarbe<small id="accent-name">${esc(accentName())}</small></div>
      <div class="accent-picker" role="radiogroup" aria-label="Akzentfarbe">
        ${ACCENTS.map((a) => `
          <button class="accent-dot ${a.id === (s.accent || "gold") ? "active" : ""}"
            data-action="set-accent" data-a="${a.id}"
            style="--dot:${a.dot};--dot-ink:${a.ink}"
            role="radio" aria-checked="${a.id === (s.accent || "gold")}"
            aria-label="${a.name}">${icon("check")}</button>`).join("")}
      </div>
    </div>
    <div class="settings-row">
      <div class="lbl">Pausendauer</div>
      <select data-input="rest-secs">
        ${[30, 45, 60, 90, 120, 150, 180, 240, 300].map((v) =>
          `<option value="${v}" ${v === s.restSecs ? "selected" : ""}>${v < 60 ? v + " s" : fmtClock(v) + " Min."}</option>`).join("")}
      </select>
    </div>
    <div class="divider"></div>
    <div class="section-label" style="margin-top:0">Datensicherung</div>
    <div class="settings-row">
      <div class="lbl">Backup erstellen<small>${lastBackupLabel()}</small></div>
      <button class="btn btn-compact" data-action="export-data">${icon("download")} Sichern</button>
    </div>
    <div class="settings-row">
      <div class="lbl">Backup wiederherstellen<small>Nach einer Neuinstallation zurückholen</small></div>
      <button class="btn btn-compact btn-ghost" data-action="import-data">${icon("upload")} Laden</button>
    </div>
    <p class="hint" style="margin:10px 2px 0">Sichere dein Backup in Google Drive oder Dateien – dann kannst du es
      jederzeit zurückholen. Zusätzlich sichert Android die App automatisch in deinem Google-Konto.</p>
    <div class="divider"></div>
    <button class="btn btn-danger-soft" data-action="wipe-data">${icon("trash")} Alle Daten löschen</button>
    <p class="hint" style="margin-top:16px;text-align:center">Eisenzeit ${APP_VERSION} · Deine Daten bleiben auf diesem Gerät.</p>
  `);
};

function lastBackupLabel() {
  const t = DB.settings.lastBackupAt;
  if (!t) return "Noch kein Backup erstellt";
  const days = Math.floor((Date.now() - t) / 86400000);
  const when = days === 0 ? "heute" : days === 1 ? "gestern" : "vor " + days + " Tagen";
  return "Zuletzt " + when + " (" + fmtDate(t) + ")";
}

function accentName() {
  const a = ACCENTS.find((x) => x.id === (DB.settings.accent || "gold"));
  return a ? a.name : "Gold";
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
  "eisenzeit-backup-" + new Date().toISOString().slice(0, 10) + ".json";

function markBackupDone() {
  DB.settings.lastBackupAt = Date.now();
  saveDB();
}

ACTIONS["export-data"] = async () => {
  const json = JSON.stringify(DB, null, 2);
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
        title: "Eisenzeit-Backup",
        url: uri,
        dialogTitle: "Backup speichern",
      });
      markBackupDone();
      toast("Backup erstellt");
      return;
    } catch (e) {
      // Abbruch durch den Nutzer ist kein Fehler
      if (/cancel/i.test(String((e && e.message) || e))) return;
      showBackupText(json, "Teilen hat nicht geklappt – hier ist dein Backup als Text:");
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
    toast("Backup gespeichert");
  } catch (e) {
    showBackupText(json);
  }
};

// Letzter Ausweg: Backup als Text zum Kopieren
function showBackupText(json, note) {
  openSheet(`
    <div class="sheet-title">Backup als Text
      <button class="icon-btn plain" data-action="close-sheet" aria-label="Schließen">${icon("x")}</button>
    </div>
    <p class="hint" style="margin-bottom:10px">${esc(note || "Kopiere den Text und sichere ihn, z. B. in einer Notiz.")}</p>
    <textarea id="backup-text" readonly rows="6" style="width:100%;background:var(--surface-2);border:1px solid var(--border);border-radius:6px;padding:10px;font-size:12px;font-family:monospace">${esc(json)}</textarea>
    <button class="btn" data-action="copy-backup" style="margin-top:12px">Text kopieren</button>
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
  toast("In die Zwischenablage kopiert");
};

/* ── Backup: wiederherstellen ─────────────────────────────── */

ACTIONS["import-data"] = () => {
  openSheet(`
    <div class="sheet-title">Backup wiederherstellen
      <button class="icon-btn plain" data-action="close-sheet" aria-label="Schließen">${icon("x")}</button>
    </div>
    <p class="hint" style="margin-bottom:14px">Wähle deine Backup-Datei aus – oder füge den Backup-Text unten ein.</p>
    <button class="btn" data-action="import-file">${icon("upload")} Datei auswählen</button>
    <div class="divider"></div>
    <div class="field">
      <label for="restore-text">Backup-Text einfügen</label>
      <textarea id="restore-text" rows="4" placeholder='{"version":2,"plans":[…' style="font-family:monospace;font-size:12px"></textarea>
    </div>
    <button class="btn btn-ghost" data-action="import-paste">Aus Text wiederherstellen</button>
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
    rd.onerror = () => toast("Datei konnte nicht gelesen werden");
    rd.readAsText(f);
  };
  inp.click();
};

ACTIONS["import-paste"] = () => {
  const txt = ($("#restore-text") || {}).value || "";
  if (!txt.trim()) { toast("Bitte den Backup-Text einfügen"); return; }
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
  let data;
  try {
    data = JSON.parse(text);
    if (!Array.isArray(data.workouts) || !Array.isArray(data.plans)) throw new Error("Format");
  } catch (e) {
    toast("Das ist kein gültiges Eisenzeit-Backup");
    return;
  }

  const hasOwnData = DB.workouts.length > 0 || DB.customExercises.length > 0;
  const anz = (n, ein, viele) => n + " " + (n === 1 ? ein : viele);
  const summary = `${anz(data.workouts.length, "Workout", "Workouts")} und `
    + `${anz(data.plans.length, "Plan", "Pläne")} gefunden.`;

  let mode = "replace";
  if (hasOwnData) {
    mode = await askRestoreMode(summary);
    if (!mode) return;
  } else if (!(await appConfirm(summary + " Jetzt wiederherstellen?", { ok: "Wiederherstellen" }))) {
    return;
  }

  const incoming = {
    plans: upgradePlans(data.plans),
    workouts: data.workouts || [],
    customExercises: data.customExercises || [],
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
    DB = Object.assign(defaultDB(), data, incoming, { seeded: true });
  }
  if (data.settings) DB.settings = Object.assign(DB.settings, data.settings);

  saveDB();
  applyAccent();
  $$(".backdrop").forEach((b) => b.remove());
  render();
  toast(mode === "merge" ? "Backup zusammengeführt" : "Backup wiederhergestellt");
}

// Auswahl: ersetzen oder zusammenführen
function askRestoreMode(summary) {
  return new Promise((resolve) => {
    const bd = openSheet(`
      <div class="sheet-title">Wie wiederherstellen?</div>
      <p class="hint" style="margin-bottom:14px">${esc(summary)} Du hast bereits eigene Daten in der App.</p>
      <button class="btn" data-r="merge">Zusammenführen</button>
      <p class="hint" style="margin:6px 2px 14px">Fehlende Workouts und Pläne werden ergänzt, vorhandene bleiben.</p>
      <button class="btn btn-danger-soft" data-r="replace">Alles ersetzen</button>
      <p class="hint" style="margin:6px 2px 0">Die aktuellen Daten in der App werden verworfen.</p>
    `);
    bd.addEventListener("click", (e) => {
      const b = e.target.closest("[data-r]");
      if (b) { bd.remove(); resolve(b.dataset.r); }
      else if (e.target === bd) { bd.remove(); resolve(null); }
    });
  });
}

ACTIONS["wipe-data"] = async () => {
  if (!(await appConfirm("Wirklich ALLE Workouts, Pläne und Übungen löschen?", { ok: "Löschen", danger: true }))) return;
  if (!(await appConfirm("Ganz sicher? Das kann nicht rückgängig gemacht werden.", { ok: "Endgültig löschen", danger: true }))) return;
  localStorage.removeItem(LS_DB);
  localStorage.removeItem(LS_ACTIVE);
  DB = loadDB();
  saveDB();
  active = null;
  $$(".backdrop").forEach((b) => b.remove());
  render();
  toast("Alle Daten gelöscht");
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
  else if (k === "set-w" || k === "set-r" || k === "set-t") {
    const s = active.exercises[+el.dataset.xi].sets[+el.dataset.si];
    if (k === "set-w") { const v = parseNum(el.value); s.w = Number.isFinite(v) ? v : null; }
    if (k === "set-r") { const v = parseInt(el.value, 10); s.r = Number.isFinite(v) ? v : null; }
    if (k === "set-t") { const v = parseTimeStr(el.value); s.t = Number.isFinite(v) ? v : null; }
    if (s.done) updateWoMeta();
    saveActive();
  }
});

document.addEventListener("change", (e) => {
  const el = e.target.closest('[data-input="rest-secs"]');
  if (el) { DB.settings.restSecs = parseInt(el.value, 10); saveDB(); }
});

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

function render() {
  renderTabbar();
  renderHome();
  renderPlans();
  renderExercises();
  renderHistory();
  renderResumeBar();
}

render();
