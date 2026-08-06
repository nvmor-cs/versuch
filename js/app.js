// Eisenzeit – Trainingslog
// Vanilla JS, keine Abhängigkeiten. Daten liegen in localStorage.

"use strict";

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
};
const icon = (n) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;

/* ═══════════════ Datenhaltung ═══════════════ */

const LS_DB = "eisenzeit.db.v1";
const LS_ACTIVE = "eisenzeit.active.v1";

function defaultDB() {
  return {
    version: 2,
    settings: { restSecs: 90, autoRest: true },
    customExercises: [],
    plans: [],
    workouts: [],
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
  $("#screen-home").innerHTML = `
    <div class="screen-head">
      <div>
        <div class="wordmark">Eisen<b>zeit</b></div>
        <div class="screen-title">${esc(today)}</div>
      </div>
      <button class="icon-btn" data-action="open-settings" aria-label="Einstellungen">${icon("gear")}</button>
    </div>
    <button class="btn" data-action="start-empty">${icon("plus")} Leeres Workout starten</button>
    <div class="section-label" style="margin-top:24px">Meine Pläne</div>
    ${DB.plans.length ? DB.plans.map(planCard).join("") : `<p class="hint">Noch keine Pläne – lege im Tab „Pläne" einen an.</p>`}
    ${recent.length ? `<div class="section-label">Zuletzt trainiert</div>` + recent.map(historyRow).join("") : ""}
  `;
}

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
  $("#screen-plans").innerHTML = `
    <div class="screen-head">
      <div class="screen-title">Pläne</div>
      <button class="icon-btn" data-action="new-plan" aria-label="Neuer Plan">${icon("plus")}</button>
    </div>
    ${DB.plans.length ? DB.plans.map(planCard).join("") : `
      <div class="empty">${icon("plans")}
        <h3>Noch keine Pläne</h3>
        <p>Ein Plan bündelt mehrere Trainings – z. B. Push, Pull und Beine.</p>
      </div>`}
    <button class="btn btn-ghost" data-action="new-plan" style="margin-top:8px">${icon("plus")} Neuen Plan erstellen</button>
  `;
}

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
    ${draftPlan.workouts.length ? draftPlan.workouts.map((w, i) => `
      <div class="row" style="cursor:default">
        <div class="row-main" data-action="edit-plan-wo" data-i="${i}" style="cursor:pointer">
          <div class="row-title">${esc(w.name || "Training " + (i + 1))}</div>
          <div class="row-sub">${w.exercises.length} Übungen · ${w.exercises.reduce((a, e) => a + (e.sets || 0), 0)} Sätze</div>
        </div>
        <button class="mini-btn" data-action="plan-wo-up" data-i="${i}" aria-label="Nach oben" ${i === 0 ? "disabled" : ""}>${icon("up")}</button>
        <button class="mini-btn" data-action="edit-plan-wo" data-i="${i}" aria-label="Bearbeiten">${icon("edit")}</button>
        <button class="mini-btn danger" data-action="plan-wo-del" data-i="${i}" aria-label="Entfernen">${icon("x")}</button>
      </div>`).join("") : `<p class="hint" style="padding:4px 0 12px">Noch keine Trainings – füge z. B. „Push", „Pull" und „Beine" hinzu.</p>`}
    <button class="btn btn-soft" data-action="plan-add-wo">${icon("plus")} Training hinzufügen</button>
    ${isNew ? "" : `<button class="btn btn-danger-soft" data-action="delete-plan" style="margin-top:10px">${icon("trash")} Plan löschen</button>`}
  `;
}

ACTIONS["plan-wo-up"] = (el) => {
  const i = +el.dataset.i;
  if (i > 0) {
    [draftPlan.workouts[i - 1], draftPlan.workouts[i]] = [draftPlan.workouts[i], draftPlan.workouts[i - 1]];
    renderPlanEditor();
  }
};
ACTIONS["plan-wo-del"] = (el) => {
  const i = +el.dataset.i;
  const w = draftPlan.workouts[i];
  if (w.exercises.length && !confirm(`Training „${w.name}" aus dem Plan entfernen?`)) return;
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
};
ACTIONS["delete-plan"] = () => {
  if (!confirm(`Plan „${draftPlan.name}" wirklich löschen?`)) return;
  DB.plans = DB.plans.filter((p) => p.id !== draftPlan.id);
  saveDB();
  $(".plan-editor-ov")?.remove();
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
        <div class="plan-ex-row">
          <div class="nm">${esc(exName(pe.exerciseId))}<small>${esc(exById(pe.exerciseId)?.muscle || "")}</small></div>
          <input type="text" inputmode="numeric" value="${pe.sets}" data-input="plan-sets" data-i="${i}" aria-label="Sätze">
          <span class="hint">Sätze</span>
          <button class="mini-btn" data-action="plan-ex-up" data-i="${i}" aria-label="Nach oben" ${i === 0 ? "disabled" : ""}>${icon("up")}</button>
          <button class="mini-btn danger" data-action="plan-ex-del" data-i="${i}" aria-label="Entfernen">${icon("x")}</button>
        </div>`).join("") : `<p class="hint" style="padding:12px 0">Noch keine Übungen in diesem Training.</p>`}
    </div>
    <button class="btn btn-soft" data-action="plan-add-ex">${icon("plus")} Übungen hinzufügen</button>
  `;
}

ACTIONS["plan-ex-up"] = (el) => {
  const i = +el.dataset.i;
  const list = draftPlan.workouts[draftWoIdx].exercises;
  if (i > 0) {
    [list[i - 1], list[i]] = [list[i], list[i - 1]];
    renderPlanWoEditor();
  }
};
ACTIONS["plan-ex-del"] = (el) => {
  draftPlan.workouts[draftWoIdx].exercises.splice(+el.dataset.i, 1);
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

ACTIONS["delete-exercise"] = (el) => {
  const ex = DB.customExercises.find((e) => e.id === el.dataset.id);
  if (!ex) return;
  if (!confirm(`„${ex.name}" löschen? Bereits getrackte Workouts bleiben erhalten.`)) return;
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
    <div style="position:fixed;left:0;right:0;bottom:0;z-index:65;padding:12px 16px calc(env(safe-area-inset-bottom,0px) + 14px);background:linear-gradient(transparent, var(--bg) 40%)">
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
  const cols = type === "weight_reps"
    ? `<div class="set-grid-head">Satz</div><div class="set-grid-head left">Letztes Mal</div><div class="set-grid-head">kg</div><div class="set-grid-head">Wdh.</div><div class="set-grid-head">✓</div>`
    : type === "reps"
      ? `<div class="set-grid-head">Satz</div><div class="set-grid-head left">Letztes Mal</div><div class="set-grid-head">Wdh.</div><div class="set-grid-head">✓</div>`
      : `<div class="set-grid-head">Satz</div><div class="set-grid-head left">Letztes Mal</div><div class="set-grid-head">Zeit</div><div class="set-grid-head">✓</div>`;
  return `
    <div class="exercise-block" data-xi="${xi}">
      <div class="exercise-block-head">
        <button class="name" data-action="open-exercise" data-id="${ex.exerciseId}">${esc(exName(ex.exerciseId))}</button>
        <button class="mini-btn danger" data-action="wo-del-ex" data-xi="${xi}" aria-label="Übung entfernen">${icon("x")}</button>
      </div>
      <div class="set-grid ${type === "weight_reps" ? "" : "type-" + type}">
        ${cols}
        ${ex.sets.map((s, si) => woSetRow(type, s, si, xi, prev)).join("")}
      </div>
      <button class="add-set-btn" data-action="wo-add-set" data-xi="${xi}">+ Satz hinzufügen</button>
    </div>`;
}

function woSetRow(type, s, si, xi, prev) {
  const p = prev && prev[si];
  const prevTxt = p ? fmtSet(type, p) : "–";
  const d = `data-xi="${xi}" data-si="${si}"`;
  const inputs = type === "weight_reps"
    ? `<input class="set-input" type="text" inputmode="decimal" data-input="set-w" ${d} value="${s.w != null ? String(s.w).replace(".", ",") : ""}" placeholder="${p && p.w != null ? fmtKg(p.w) : "kg"}" aria-label="Gewicht">
       <input class="set-input" type="text" inputmode="numeric" data-input="set-r" ${d} value="${s.r ?? ""}" placeholder="${p && p.r != null ? p.r : "Wdh."}" aria-label="Wiederholungen">`
    : type === "reps"
      ? `<input class="set-input" type="text" inputmode="numeric" data-input="set-r" ${d} value="${s.r ?? ""}" placeholder="${p && p.r != null ? p.r : "Wdh."}" aria-label="Wiederholungen">`
      : `<input class="set-input" type="text" inputmode="numeric" data-input="set-t" ${d} value="${s.t ? fmtClock(s.t) : ""}" placeholder="${p && p.t ? fmtClock(p.t) : "m:ss"}" aria-label="Zeit">`;
  return `
    <div class="set-row ${s.done ? "done" : ""}" data-setrow="${xi}-${si}">
      <button class="set-no" data-action="wo-del-set" ${d} title="Satz entfernen">${si + 1}</button>
      <div class="set-prev">${prevTxt}</div>
      ${inputs}
      <button class="set-check" data-action="wo-check" ${d} aria-label="Satz abhaken">${icon("check")}</button>
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
ACTIONS["wo-del-ex"] = (el) => {
  const ex = active.exercises[+el.dataset.xi];
  if (ex.sets.some((s) => s.done) && !confirm(`„${exName(ex.exerciseId)}" mit abgehakten Sätzen entfernen?`)) return;
  active.exercises.splice(+el.dataset.xi, 1);
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

ACTIONS["wo-check"] = (el) => {
  const xi = +el.dataset.xi, si = +el.dataset.si;
  const ex = active.exercises[xi];
  const s = ex.sets[si];
  const type = exType(ex.exerciseId);
  const row = $(`[data-setrow="${xi}-${si}"]`);

  if (!s.done) {
    // Leere Felder mit den Werten vom letzten Mal (Platzhalter) füllen
    const p = (prevSetsFor(ex.exerciseId) || [])[si];
    if (type === "weight_reps") {
      if (s.w == null && p && p.w != null) s.w = p.w;
      if (s.r == null && p && p.r != null) s.r = p.r;
      if (s.r == null || s.r <= 0) { toast("Wiederholungen eintragen"); return; }
      if (s.w == null) s.w = 0;
    } else if (type === "reps") {
      if (s.r == null && p && p.r != null) s.r = p.r;
      if (s.r == null || s.r <= 0) { toast("Wiederholungen eintragen"); return; }
    } else {
      if (s.t == null && p && p.t != null) s.t = p.t;
      if (s.t == null || s.t <= 0) { toast("Zeit eintragen, z. B. 1:30"); return; }
    }
    s.done = true;
    // Autofill in die Inputs zurückschreiben
    if (row) {
      const iw = $(`[data-input="set-w"][data-xi="${xi}"][data-si="${si}"]`, row);
      const ir = $(`[data-input="set-r"][data-xi="${xi}"][data-si="${si}"]`, row);
      const it = $(`[data-input="set-t"][data-xi="${xi}"][data-si="${si}"]`, row);
      if (iw && s.w != null) iw.value = String(s.w).replace(".", ",");
      if (ir && s.r != null) ir.value = s.r;
      if (it && s.t != null) it.value = fmtClock(s.t);
      row.classList.add("done");
    }
    if (DB.settings.autoRest && exById(ex.exerciseId)?.type !== "time") startRest(DB.settings.restSecs);
  } else {
    s.done = false;
    if (row) row.classList.remove("done");
  }
  saveActive();
  updateWoMeta();
};

ACTIONS["minimize-workout"] = () => {
  $(".workout-ov")?.remove();
  render();
};

ACTIONS["discard-workout"] = () => {
  if (!confirm("Workout wirklich verwerfen? Alle Eingaben gehen verloren.")) return;
  active = null;
  saveActive();
  stopRest();
  $(".workout-ov")?.remove();
  render();
  toast("Workout verworfen");
};

ACTIONS["finish-workout"] = () => {
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
    if (done.length) finished.exercises.push({ exerciseId: ex.exerciseId, sets: done });
  }
  if (!finished.exercises.length) {
    if (confirm("Keine abgehakten Sätze. Workout verwerfen?")) {
      active = null; saveActive(); stopRest();
      $(".workout-ov")?.remove(); render();
    }
    return;
  }
  if (undone > 0 && !confirm(`${undone} nicht abgehakte${undone === 1 ? "r Satz wird" : " Sätze werden"} verworfen. Workout beenden?`)) return;

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
    <button class="btn" data-action="close-sheet" style="margin-top:14px">Fertig</button>
  `);
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
      sets: ex.sets.map(() => newSet()),
    })),
  };
  saveActive();
  $(".wo-detail-ov")?.remove();
  openWorkoutScreen();
};

ACTIONS["delete-workout"] = (el) => {
  if (!confirm("Workout endgültig löschen?")) return;
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
      <div class="lbl">Pausendauer</div>
      <select data-input="rest-secs">
        ${[30, 45, 60, 90, 120, 150, 180, 240, 300].map((v) =>
          `<option value="${v}" ${v === s.restSecs ? "selected" : ""}>${v < 60 ? v + " s" : fmtClock(v) + " Min."}</option>`).join("")}
      </select>
    </div>
    <div class="divider"></div>
    <div class="settings-row">
      <div class="lbl">Daten exportieren<small>Backup als JSON-Datei speichern</small></div>
      <button class="icon-btn" data-action="export-data" aria-label="Exportieren">${icon("download")}</button>
    </div>
    <div class="settings-row">
      <div class="lbl">Daten importieren<small>Ersetzt die aktuellen Daten</small></div>
      <button class="icon-btn" data-action="import-data" aria-label="Importieren">${icon("upload")}</button>
    </div>
    <div class="divider"></div>
    <button class="btn btn-danger-soft" data-action="wipe-data">${icon("trash")} Alle Daten löschen</button>
    <p class="hint" style="margin-top:16px;text-align:center">Eisenzeit · Deine Daten bleiben auf diesem Gerät.</p>
  `);
};

ACTIONS["toggle-autorest"] = (el) => {
  DB.settings.autoRest = !DB.settings.autoRest;
  saveDB();
  el.classList.toggle("on", DB.settings.autoRest);
  el.setAttribute("aria-checked", DB.settings.autoRest);
};

ACTIONS["export-data"] = () => {
  const blob = new Blob([JSON.stringify(DB, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "eisenzeit-backup-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Backup exportiert");
};

ACTIONS["import-data"] = () => {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = "application/json,.json";
  inp.onchange = () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const data = JSON.parse(rd.result);
        if (!Array.isArray(data.workouts) || !Array.isArray(data.plans)) throw new Error("Format");
        if (!confirm(`Backup mit ${data.workouts.length} Workouts und ${data.plans.length} Plänen importieren? Aktuelle Daten werden ersetzt.`)) return;
        DB = Object.assign(defaultDB(), data, { seeded: true });
        saveDB();
        $$(".backdrop").forEach((b) => b.remove());
        render();
        toast("Backup importiert");
      } catch (e) {
        toast("Datei konnte nicht gelesen werden");
      }
    };
    rd.readAsText(f);
  };
  inp.click();
};

ACTIONS["wipe-data"] = () => {
  if (!confirm("Wirklich ALLE Workouts, Pläne und Übungen löschen?")) return;
  if (!confirm("Ganz sicher? Das kann nicht rückgängig gemacht werden.")) return;
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

function render() {
  renderTabbar();
  renderHome();
  renderPlans();
  renderExercises();
  renderHistory();
  renderResumeBar();
}

render();
