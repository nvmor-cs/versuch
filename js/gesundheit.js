// Lumora – Gesundheit
//
// Die dritte Welt neben Training und Ernährung. Sie beantwortet die Frage, die
// keine der beiden anderen beantworten kann: Wirkt das eigentlich?
//
// Training zeigt, was du gehoben hast. Ernährung zeigt, was du gegessen hast.
// Erst der Körper zeigt, was dabei herauskommt – und der Kalender, ob du
// überhaupt regelmäßig dabei bist.
//
// Eigene Daten hat dieses Modul nur wenige: die Messungen (Gewicht, Körperfett,
// Umfänge) unter einem eigenen Schlüssel. Kalender und Balance sind reine
// Lesesichten auf das, was ohnehin schon da ist – Workouts und Tagebuch. Das
// ist der Grund, warum dieses Modul als einziges über die Grenze schaut: Eine
// Übersicht, die nur die Hälfte kennt, wäre keine.

"use strict";

const LS_GESUND = "lumora.gesundheit.v1";

/* Was sich messen lässt. Das Gewicht ist der Hauptwert – alles andere ist
   freiwillig und bleibt leer, bis man es einträgt. Umfänge sind gerade bei
   gleichbleibendem Gewicht das ehrlichere Maß: Muskel wiegt wie Fett, sieht
   aber anders aus. */
const MASSE = [
  { k: "gewicht", label: "Gewicht", einheit: "kg", schritt: 0.1, haupt: true },
  { k: "fett", label: "Körperfett", einheit: "%", schritt: 0.1 },
  { k: "taille", label: "Taille", einheit: "cm", schritt: 0.5 },
  { k: "brust", label: "Brust", einheit: "cm", schritt: 0.5 },
  { k: "arm", label: "Oberarm", einheit: "cm", schritt: 0.5 },
  { k: "bein", label: "Oberschenkel", einheit: "cm", schritt: 0.5 },
  { k: "huefte", label: "Hüfte", einheit: "cm", schritt: 0.5 },
];

const MASS_GRENZEN = { gewicht: 500, fett: 100, taille: 300, brust: 300, arm: 150, bein: 200, huefte: 300 };

/* ═══════════════ Datenhaltung ═══════════════ */

function defaultGesund() {
  return {
    version: 1,
    // { "2026-08-16": { gewicht: 82.4, fett: 18, taille: 84, … } }
    koerper: {},
    // Zielgewicht als Linie im Diagramm; null heißt: kein Ziel gesetzt
    zielGewicht: null,
    // Trainingseinheiten je Woche. Drei ist die Zahl, die für die meisten
    // aufgeht – änderbar.
    wochenziel: 3,
  };
}

/* Fremddaten in Form bringen – dieselbe Regel wie überall (siehe bereinigeDB):
   Was aus localStorage oder einem Backup kommt, ist erst einmal nur JSON. */
function bereinigeGesund(roh) {
  const g = Object.assign(defaultGesund(), roh && typeof roh === "object" ? roh : {});
  const tage = {};
  const rohe = g.koerper && typeof g.koerper === "object" ? g.koerper : {};
  for (const [tag, werte] of Object.entries(rohe)) {
    if (!TAG_MUSTER.test(tag) || !werte || typeof werte !== "object") continue;
    const eintrag = {};
    for (const { k } of MASSE) {
      const v = alsZahl(werte[k], 0);
      if (v > 0) eintrag[k] = Math.min(MASS_GRENZEN[k], Math.round(v * 10) / 10);
    }
    // Ein Tag ganz ohne Zahl ist kein Eintrag
    if (Object.keys(eintrag).length) tage[tag] = eintrag;
  }
  g.koerper = tage;
  const ziel = alsZahl(g.zielGewicht, 0);
  g.zielGewicht = ziel > 0 ? Math.min(MASS_GRENZEN.gewicht, Math.round(ziel * 10) / 10) : null;
  g.wochenziel = Math.min(14, Math.max(1, Math.round(alsZahl(g.wochenziel, 3))));
  g.version = 1;
  return g;
}

function ladeGesund() {
  let g = defaultGesund();
  try {
    const raw = localStorage.getItem(LS_GESUND);
    if (raw) g = bereinigeGesund(JSON.parse(raw));
  } catch (_) {
    try { localStorage.setItem(LS_GESUND + ".corrupt", localStorage.getItem(LS_GESUND) || ""); } catch (__) {}
  }
  return g;
}

let GESUND = ladeGesund();

function speichereGesund() {
  try { localStorage.setItem(LS_GESUND, JSON.stringify(GESUND)); } catch (_) {}
}

/* ═══════════════ Rechnen: Körper ═══════════════ */

// Alle Messtage eines Werts, ältester zuerst
function messReihe(k) {
  return Object.keys(GESUND.koerper)
    .filter((tag) => Number.isFinite(GESUND.koerper[tag][k]))
    .sort()
    .map((tag) => ({ tag, wert: GESUND.koerper[tag][k], zeit: new Date(tag + "T12:00:00").getTime() }));
}

const letzteMessung = (k) => {
  const r = messReihe(k);
  return r.length ? r[r.length - 1] : null;
};

/* Der gleitende Mittelwert ist beim Gewicht das Entscheidende. Ein einzelner
   Morgen sagt fast nichts: Salz, Wasser und der Vorabend bewegen die Zahl um
   mehr als eine Woche Defizit. Erst der Schnitt über sieben Tage zeigt, wohin
   es geht. */
function schnittUm(reihe, zeit, tage) {
  const von = zeit - (tage - 1) * 86400000, bis = zeit + 43200000;
  const drin = reihe.filter((p) => p.zeit >= von && p.zeit <= bis);
  if (!drin.length) return null;
  return drin.reduce((a, p) => a + p.wert, 0) / drin.length;
}

/* Wie viel hat sich in den letzten sieben Tagen bewegt? Verglichen werden zwei
   Wochenschnitte, nicht zwei Tage – sonst misst man das Rauschen. */
function gewichtTrend() {
  const reihe = messReihe("gewicht");
  if (reihe.length < 2) return null;
  const jetzt = reihe[reihe.length - 1].zeit;
  const a = schnittUm(reihe, jetzt, 7);
  const b = schnittUm(reihe, jetzt - 7 * 86400000, 7);
  if (a == null || b == null) return null;
  return { jetzt: a, vorher: b, delta: a - b };
}

/* ═══════════════ Rechnen: Kalender ═══════════════ */

const wochenAnfang = (ts) => weekStart(ts);

const workoutsAmTag = (key) =>
  DB.workouts.filter((w) => tagKey(w.startedAt) === key);

function workoutsInWoche(start) {
  const ende = start + 7 * 86400000;
  return DB.workouts.filter((w) => w.startedAt >= start && w.startedAt < ende).length;
}

/* Wie viele Wochen am Stück ist das Wochenziel aufgegangen? Die laufende Woche
   zählt nur mit, wenn sie schon voll ist – sonst risse die Serie jeden Montag,
   und das wäre eine unfaire Zahl. */
function wochenSerie() {
  const ziel = GESUND.wochenziel || 3;
  let n = 0;
  for (let i = 0; i < 260; i++) {
    const anzahl = workoutsInWoche(wochenAnfang(Date.now() - i * 7 * 86400000));
    if (anzahl >= ziel) { n++; continue; }
    if (i === 0) continue;   // laufende Woche darf noch werden
    break;
  }
  return n;
}

/* ═══════════════ Rechnen: Balance ═══════════════ */

// Cardio ist keine Muskelgruppe – Sätze zu zählen ergäbe dort keinen Sinn.
const BALANCE_MUSKELN = MUSCLES.filter((m) => m !== "Cardio");

const BALANCE_RANGES = [
  { id: "1", label: "Diese Woche", wochen: 1 },
  { id: "4", label: "4 Wochen", wochen: 4 },
  { id: "12", label: "12 Wochen", wochen: 12 },
];
let balanceRange = "1";

const balanceIndex = () => Math.max(0, BALANCE_RANGES.findIndex((r) => r.id === balanceRange));

/* Sätze je Muskelgruppe. Gezählt wird, was im Workout abgehakt wurde – in der
   Historie stehen ohnehin nur abgeschlossene Sätze. Zugeordnet wird über die
   Muskelgruppe der Übung; die App kennt je Übung genau eine, was für die Frage
   „kommt mein Rücken zu kurz?" völlig ausreicht. */
function saetzeJeMuskel(wochen) {
  const start = wochenAnfang(Date.now()) - (wochen - 1) * 7 * 86400000;
  const zaehler = {};
  BALANCE_MUSKELN.forEach((m) => { zaehler[m] = 0; });
  for (const w of DB.workouts) {
    if (w.startedAt < start) continue;
    for (const ex of w.exercises) {
      const uebung = exById(ex.exerciseId);
      if (!uebung || !(uebung.muscle in zaehler)) continue;
      zaehler[uebung.muscle] += ex.sets.length;
    }
  }
  // Bei mehreren Wochen der Schnitt je Woche – nur so sind die Zahlen
  // untereinander vergleichbar
  if (wochen > 1) {
    for (const m of BALANCE_MUSKELN) zaehler[m] = Math.round((zaehler[m] / wochen) * 10) / 10;
  }
  return zaehler;
}

/* Grober Richtwert aus der Trainingslehre: unter etwa 10 Sätzen je Woche
   passiert wenig, über 20 wird es für die meisten mehr, als sie wegstecken.
   Bewusst ein Band und keine Zahl – das ist eine Orientierung, kein Urteil. */
const BALANCE_MIN = 10;
const BALANCE_MAX = 20;

/* ═══════════════ Reiter „Körper" ═══════════════ */

const KOERPER_RANGES = [
  { id: "30", label: "30 Tage", tage: 30 },
  { id: "90", label: "90 Tage", tage: 90 },
  { id: "365", label: "1 Jahr", tage: 365 },
];
let koerperRange = "30";

const koerperIndex = () => Math.max(0, KOERPER_RANGES.findIndex((r) => r.id === koerperRange));

ACTIONS["koerper-range"] = (el) => {
  if (el.dataset.r === koerperRange) return;
  koerperRange = el.dataset.r;
  tippen();
  renderKoerper();
};

function koerperRangeWechseln(richtung) {
  const i = koerperIndex() + richtung;
  if (i < 0 || i >= KOERPER_RANGES.length) return false;
  koerperRange = KOERPER_RANGES[i].id;
  renderKoerper();
  paneEinblenden($("#koerper-pane"), richtung);
  return true;
}

function renderKoerper() {
  const host = $("#screen-health-body");
  if (!host) return;
  const heute = tagKey(Date.now());
  const heuteWert = (GESUND.koerper[heute] || {}).gewicht;
  const letzte = letzteMessung("gewicht");

  host.innerHTML = `
    <div class="screen-head">
      <div>
        <div class="wordmark">${logoSvg()}${tr("Gesundheit")}</div>
        <div class="screen-title">${tr("Körper")}</div>
      </div>
      <button class="icon-btn" data-action="koerper-ziel" aria-label="${tr("Zielgewicht")}">${icon("gear")}</button>
    </div>
    <div class="swipe-pane" id="koerper-pane">
      ${letzte ? gewichtKarte(letzte) : ""}
      <button class="btn${letzte ? " btn-soft" : ""}" data-action="koerper-eintragen">
        ${icon(heuteWert ? "edit" : "plus")} ${heuteWert
          ? esc(tr("Heute: {gewicht} kg", { gewicht: fmtKg(heuteWert) }))
          : tr("Gewicht eintragen")}</button>
      ${letzte ? `
      <div class="seg" role="tablist" aria-label="${tr("Zeitraum")}">
        ${KOERPER_RANGES.map((r) => `<button role="tab" aria-selected="${r.id === koerperRange}" class="${r.id === koerperRange ? "active" : ""}" data-action="koerper-range" data-r="${esc(r.id)}">${esc(tr(r.label))}</button>`).join("")}
      </div>
      <div class="card chart-card">
        <h3>${tr("Gewicht")}</h3>
        <div class="chart-sub">${tr("Punkte sind einzelne Messungen, die Linie der Schnitt über sieben Tage")}</div>
        <div class="chart-wrap">${gewichtChart()}</div>
      </div>
      ${masseBlock()}`
      : `<div class="empty">${icon("scale")}
          <h3>${tr("Noch nichts gemessen")}</h3>
          <p>${tr("Trag dein Gewicht ein – am besten morgens, nüchtern und immer zur selben Zeit. Erst über Wochen wird daraus eine Aussage.")}</p>
        </div>`}
    </div>`;
}

function gewichtKarte(letzte) {
  const t = gewichtTrend();
  const ziel = GESUND.zielGewicht;
  const rest = ziel ? Math.round((letzte.wert - ziel) * 10) / 10 : null;
  return `
    <div class="card gew-karte">
      <div class="gew-zahlen">
        <div>
          <div class="gew-gross">${fmtKg(letzte.wert)} <em>kg</em></div>
          <div class="hint">${esc(fmtDate(letzte.zeit))}</div>
        </div>
        ${t ? `
        <div class="gew-trend ${t.delta > 0.05 ? "hoch" : t.delta < -0.05 ? "runter" : ""}">
          <b>${t.delta > 0 ? "+" : ""}${fmtKg(Math.round(t.delta * 10) / 10)} kg</b>
          <span>${tr("in 7 Tagen")}</span>
        </div>` : ""}
      </div>
      ${ziel ? `<div class="gew-ziel">${esc(Math.abs(rest) < 0.05
        ? tr("Zielgewicht {ziel} kg erreicht", { ziel: fmtKg(ziel) })
        : rest > 0
          ? tr("Noch {rest} kg bis {ziel} kg", { rest: fmtKg(rest), ziel: fmtKg(ziel) })
          : tr("{rest} kg unter dem Ziel von {ziel} kg", { rest: fmtKg(Math.abs(rest)), ziel: fmtKg(ziel) }))}</div>` : ""}
    </div>`;
}

/* Umfänge und Körperfett: aktueller Wert und was sich seit der ersten Messung
   getan hat. Ohne Verlaufsdiagramm – dafür misst man sie zu selten. */
function masseBlock() {
  const zeilen = MASSE.filter((m) => !m.haupt).map((m) => {
    const r = messReihe(m.k);
    if (!r.length) return "";
    const jetzt = r[r.length - 1], erst = r[0];
    const diff = Math.round((jetzt.wert - erst.wert) * 10) / 10;
    return `
      <div class="row" style="cursor:default">
        <span class="row-main">
          <span class="row-title">${esc(tr(m.label))}</span>
          <span class="row-sub">${esc(r.length > 1
            ? tr("seit {datum}: {diff} {einheit}", { datum: fmtDateShort(erst.zeit), diff: (diff > 0 ? "+" : "") + fmtKg(diff), einheit: m.einheit })
            : tr("erste Messung"))}</span>
        </span>
        <span class="row-side"><b style="font-variant-numeric:tabular-nums">${fmtKg(jetzt.wert)} ${esc(m.einheit)}</b></span>
      </div>`;
  }).join("");
  if (!zeilen) return "";
  return `<div class="section-label">${tr("Maße")}</div>${zeilen}`;
}

function gewichtChart() {
  const tage = (KOERPER_RANGES.find((r) => r.id === koerperRange) || KOERPER_RANGES[0]).tage;
  const von = Date.now() - tage * 86400000;
  const alle = messReihe("gewicht");
  const data = alle.filter((p) => p.zeit >= von);
  if (data.length < 2) {
    return `<div class="chart-empty">${tr("Ab der zweiten Messung in diesem Zeitraum entsteht hier eine Kurve.")}</div>`;
  }
  const ziel = GESUND.zielGewicht;
  const W = 320, H = 160, padL = 34, padR = 12, padT = 14, padB = 20;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const werte = data.map((p) => p.wert).concat(ziel ? [ziel] : []);
  let lo = Math.min(...werte), hi = Math.max(...werte);
  if (hi - lo < 1) { lo -= 0.5; hi += 0.5; }
  const rand = (hi - lo) * 0.12;
  lo -= rand; hi += rand;
  const t0 = data[0].zeit, t1 = data[data.length - 1].zeit;
  const X = (z) => padL + (t1 === t0 ? innerW / 2 : (innerW * (z - t0)) / (t1 - t0));
  const Y = (v) => padT + innerH - ((v - lo) / (hi - lo)) * innerH;

  let out = "";
  for (let g = 0; g <= 3; g++) {
    const v = lo + ((hi - lo) * g) / 3;
    const y = Y(v);
    out += `<line class="chart-grid-line" x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}"/>`;
    out += `<text class="chart-axis-text" x="${padL - 5}" y="${y + 3}" text-anchor="end">${fmtKg(Math.round(v * 10) / 10)}</text>`;
  }
  if (ziel && ziel > lo && ziel < hi) {
    out += `<line class="ziel-linie" x1="${padL}" y1="${Y(ziel)}" x2="${W - padR}" y2="${Y(ziel)}"/>`;
  }
  // Erst die Glättung, dann die Punkte darüber – die Linie ist die Aussage,
  // die Punkte sind der Beleg
  const glatt = data
    .map((p) => ({ x: X(p.zeit), y: schnittUm(alle, p.zeit, 7) }))
    .filter((p) => p.y != null);
  if (glatt.length > 1) {
    out += `<polyline class="chart-line" points="${glatt.map((p) => p.x.toFixed(1) + "," + Y(p.y).toFixed(1)).join(" ")}"/>`;
  }
  data.forEach((p) => {
    out += `<circle class="gew-punkt" cx="${X(p.zeit).toFixed(1)}" cy="${Y(p.wert).toFixed(1)}" r="2.6">`
      + `<title>${esc(fmtDate(p.zeit))}: ${fmtKg(p.wert)} kg</title></circle>`;
  });
  const letzt = data[data.length - 1];
  out += `<circle class="chart-dot" cx="${X(letzt.zeit).toFixed(1)}" cy="${Y(letzt.wert).toFixed(1)}" r="4.5"/>`;
  out += `<text class="chart-axis-text" x="${padL}" y="${H - 5}">${esc(fmtDateShort(t0))}</text>`;
  out += `<text class="chart-axis-text" x="${W - padR}" y="${H - 5}" text-anchor="end">${esc(fmtDateShort(t1))}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${tr("Liniendiagramm: Gewichtsverlauf")}">${out}</svg>`;
}

/* ── Messung eintragen ───────────────────────────────────
   Ein Blatt für alles: Gewicht groß oben, der Rest darunter und freiwillig.
   Vorbelegt wird mit dem zuletzt gemessenen Wert – Umfänge ändern sich
   langsam, und wer 84 auf 84,5 korrigiert, tippt lieber eine Stelle um, als
   alles neu einzugeben. */
ACTIONS["koerper-eintragen"] = () => koerperFormular(tagKey(Date.now()));

function koerperFormular(tag) {
  const vorhanden = GESUND.koerper[tag] || {};
  const wert = (k) => {
    if (Number.isFinite(vorhanden[k])) return fmtKg(vorhanden[k]);
    const l = letzteMessung(k);
    // Nur Umfänge vorbelegen: Ein altes Gewicht als Vorschlag wäre eine
    // Behauptung über heute
    return l && k !== "gewicht" ? fmtKg(l.wert) : "";
  };
  const feld = (m) => `
    <div class="field">
      <label for="kf-${m.k}">${esc(tr(m.label))} (${esc(m.einheit)})</label>
      <input id="kf-${m.k}" data-m="${esc(m.k)}" type="text" inputmode="decimal"
             class="${m.haupt ? "feld-gross" : ""}" value="${esc(wert(m.k))}" autocomplete="off">
    </div>`;

  const bd = openSheet(`
    <div class="sheet-title">${esc(tr("Messung vom {datum}", { datum: fmtDate(new Date(tag + "T12:00:00").getTime()) }))}
      <button class="icon-btn plain" data-action="close-sheet" aria-label="${tr("Schließen")}">${icon("x")}</button>
    </div>
    ${MASSE.filter((m) => m.haupt).map(feld).join("")}
    <div class="section-label">${tr("Freiwillig")}</div>
    <div class="feld-block">
      <div class="feld-zwei">
        ${MASSE.filter((m) => !m.haupt).map(feld).join("")}
      </div>
    </div>
    <div class="sheet-fuss">
      <button class="btn" data-speichern="1">${icon("check")} ${tr("Speichern")}</button>
      ${Object.keys(vorhanden).length ? `<button class="btn btn-danger-soft" data-loeschen="1" style="margin-top:8px">${icon("trash")} ${tr("Messung löschen")}</button>` : ""}
    </div>
  `, { fest: true });

  bd.addEventListener("click", (e) => {
    if (e.target.closest("[data-loeschen]")) {
      delete GESUND.koerper[tag];
      speichereGesund();
      bd.remove();
      renderGesundheit();
      toast(tr("Messung gelöscht"));
      return;
    }
    if (!e.target.closest("[data-speichern]")) return;
    const neu = {};
    for (const m of MASSE) {
      const el = bd.querySelector(`[data-m="${m.k}"]`);
      const v = parseNum(el ? el.value : "");
      if (Number.isFinite(v) && v > 0) neu[m.k] = Math.min(MASS_GRENZEN[m.k], Math.round(v * 10) / 10);
    }
    if (!Object.keys(neu).length) { toast(tr("Trag mindestens einen Wert ein")); return; }
    GESUND.koerper[tag] = neu;
    speichereGesund();
    bd.remove();
    tippen(true);
    renderGesundheit();
    toast(tr("Gespeichert"));
  });
}

ACTIONS["koerper-ziel"] = () => {
  const bd = openSheet(`
    <div class="sheet-title">${tr("Zielgewicht")}
      <button class="icon-btn plain" data-action="close-sheet" aria-label="${tr("Schließen")}">${icon("x")}</button>
    </div>
    <div class="field">
      <label for="kz-ziel">${tr("Zielgewicht")} (kg)</label>
      <input id="kz-ziel" type="text" inputmode="decimal" class="feld-gross"
             value="${esc(GESUND.zielGewicht ? fmtKg(GESUND.zielGewicht) : "")}" placeholder="${tr("z. B. 78")}" autocomplete="off">
    </div>
    <p class="hint" style="margin:-4px 2px 14px">${tr("Leer lassen, wenn du ohne Ziel trackst. Gesetzt erscheint es als Linie im Diagramm.")}</p>
    <div class="sheet-fuss">
      <button class="btn" data-ok="1">${icon("check")} ${tr("Speichern")}</button>
    </div>
  `, { fest: true });
  bd.addEventListener("click", (e) => {
    if (!e.target.closest("[data-ok]")) return;
    const v = parseNum(bd.querySelector("#kz-ziel").value);
    GESUND.zielGewicht = Number.isFinite(v) && v > 0
      ? Math.min(MASS_GRENZEN.gewicht, Math.round(v * 10) / 10) : null;
    speichereGesund();
    bd.remove();
    renderKoerper();
    toast(tr("Gespeichert"));
  });
};

/* ═══════════════ Reiter „Kalender" ═══════════════ */

// Angezeigter Monat als erster Tag des Monats
let kalMonat = (() => { const d = new Date(); d.setDate(1); d.setHours(12, 0, 0, 0); return d.getTime(); })();

function monatVerschieben(richtung) {
  const d = new Date(kalMonat);
  const grenze = new Date();
  grenze.setDate(1); grenze.setHours(12, 0, 0, 0);
  // Nach vorn ist der laufende Monat Schluss – die Zukunft ist leer
  if (richtung > 0 && d.getTime() >= grenze.getTime()) return false;
  d.setMonth(d.getMonth() + richtung);
  kalMonat = d.getTime();
  renderKalender();
  paneEinblenden($("#kal-pane"), richtung);
  return true;
}

ACTIONS["kal-monat"] = (el) => { monatVerschieben(+el.dataset.r); };

function renderKalender() {
  const host = $("#screen-health-cal");
  if (!host) return;
  const d = new Date(kalMonat);
  const jahr = d.getFullYear(), monat = d.getMonth();
  const istAktuell = new Date().getMonth() === monat && new Date().getFullYear() === jahr;

  host.innerHTML = `
    <div class="screen-head">
      <div>
        <div class="wordmark">${logoSvg()}${tr("Gesundheit")}</div>
        <div class="screen-title">${tr("Kalender")}</div>
      </div>
      <button class="icon-btn" data-action="wochenziel" aria-label="${tr("Wochenziel")}">${icon("gear")}</button>
    </div>
    <div class="tag-leiste">
      <button class="icon-btn plain" data-action="kal-monat" data-r="-1" aria-label="${tr("Vorheriger Monat")}">${icon("chevL")}</button>
      <span>${esc(new Date(kalMonat).toLocaleDateString(locale(), { month: "long", year: "numeric" }))}</span>
      <button class="icon-btn plain ${istAktuell ? "aus" : ""}" data-action="kal-monat" data-r="1"
        aria-label="${tr("Nächster Monat")}" ${istAktuell ? "disabled" : ""}>${icon("chevR")}</button>
    </div>
    <div class="swipe-pane" id="kal-pane">
      ${wochenKarte()}
      ${monatsGitter(jahr, monat)}
      <p class="hint kal-legende">
        <span><i class="kal-mark trainiert"></i>${tr("trainiert")}</span>
        <span><i class="kal-mark p-essen"></i>${tr("gegessen erfasst")}</span>
        <span><i class="kal-mark p-koerper"></i>${tr("gewogen")}</span>
      </p>
    </div>`;
}

function wochenKarte() {
  const ziel = GESUND.wochenziel || 3;
  const diese = workoutsInWoche(wochenAnfang(Date.now()));
  const serie = wochenSerie();
  const anteil = Math.min(100, (diese / ziel) * 100);
  return `
    <div class="card kcal-karte woche-karte">
      <div class="kcal-zahlen">
        <div>
          <div class="kcal-gross">${diese} <em>/ ${ziel}</em></div>
          <div class="hint">${tr("Einheiten diese Woche")}</div>
        </div>
        <div class="kcal-rest">
          <b>${serie}</b>
          <span>${serie === 1 ? tr("Woche in Folge") : tr("Wochen in Folge")}</span>
        </div>
      </div>
      <div class="kcal-bar"><i style="width:${anteil}%"></i></div>
    </div>`;
}

function monatsGitter(jahr, monat) {
  const erster = new Date(jahr, monat, 1);
  const tageImMonat = new Date(jahr, monat + 1, 0).getDate();
  // Montag als erster Spaltentag – so steht es auch im Verlauf
  const versatz = (erster.getDay() + 6) % 7;
  const heute = tagKey(Date.now());

  // Wochentagsköpfe aus der Sprache holen, statt sie zu tippen
  const kopf = [];
  for (let i = 0; i < 7; i++) {
    const tag = new Date(2024, 0, 1 + i);   // 1.1.2024 war ein Montag
    kopf.push(`<span>${esc(tag.toLocaleDateString(locale(), { weekday: "short" }).slice(0, 2))}</span>`);
  }

  let zellen = "";
  for (let i = 0; i < versatz; i++) zellen += `<span class="kal-leer"></span>`;
  for (let t = 1; t <= tageImMonat; t++) {
    const key = tagKey(new Date(jahr, monat, t, 12));
    const wos = workoutsAmTag(key).length;
    const gegessen = Array.isArray(ESSEN.tage[key]) && ESSEN.tage[key].length > 0;
    const gewogen = !!(GESUND.koerper[key] && GESUND.koerper[key].gewicht);
    const zukunft = key > heute;
    zellen += `
      <button class="kal-tag${wos ? " trainiert" : ""}${key === heute ? " heute" : ""}${zukunft ? " zukunft" : ""}"
              data-action="kal-tag" data-k="${esc(key)}" ${zukunft ? "disabled" : ""}>
        <span class="kal-nr">${t}</span>
        <span class="kal-punkte">${gegessen ? `<i class="p-essen"></i>` : ""}${gewogen ? `<i class="p-koerper"></i>` : ""}</span>
        ${wos > 1 ? `<span class="kal-zahl">${wos}</span>` : ""}
      </button>`;
  }
  return `<div class="kal-kopf">${kopf.join("")}</div><div class="kal-gitter">${zellen}</div>`;
}

/* Ein Tag im Detail: was an ihm passiert ist, und der kurze Weg, eine Messung
   nachzutragen – vergessen hat man sie meistens erst am Abend. */
ACTIONS["kal-tag"] = (el) => {
  const key = el.dataset.k;
  const wos = workoutsAmTag(key);
  const eintraege = Array.isArray(ESSEN.tage[key]) ? ESSEN.tage[key] : [];
  const kcal = eintraege.reduce((a, e) => a + eintragWerte(e).kcal, 0);
  const messung = GESUND.koerper[key];
  const zeit = new Date(key + "T12:00:00").getTime();

  const bd = openSheet(`
    <div class="sheet-title">${esc(new Date(zeit).toLocaleDateString(locale(), { weekday: "long", day: "numeric", month: "long" }))}
      <button class="icon-btn plain" data-action="close-sheet" aria-label="${tr("Schließen")}">${icon("x")}</button>
    </div>
    ${wos.length ? wos.map((w) => `
      <button class="row" data-wo="${esc(w.id)}">
        <span class="row-main">
          <span class="row-title">${esc(w.name)}</span>
          <span class="row-sub">${fmtDur(w.durationSec)} · ${workoutSets(w)} ${tr("Sätze")} · ${fmtVol(workoutVolume(w))}</span>
        </span>
        <span class="chev">${icon("chevR")}</span>
      </button>`).join("")
      : `<p class="hint" style="margin-bottom:12px">${tr("An diesem Tag wurde nicht trainiert.")}</p>`}
    ${eintraege.length ? `<div class="row" style="cursor:default">
      <span class="row-main"><span class="row-title">${tr("Ernährung")}</span>
        <span class="row-sub">${esc(tr("{n} Einträge", { n: eintraege.length }))}</span></span>
      <span class="row-side"><b>${Math.round(kcal).toLocaleString(locale())} kcal</b></span>
    </div>` : ""}
    ${messung && messung.gewicht ? `<div class="row" style="cursor:default">
      <span class="row-main"><span class="row-title">${tr("Gewicht")}</span></span>
      <span class="row-side"><b>${fmtKg(messung.gewicht)} kg</b></span>
    </div>` : ""}
    <button class="btn btn-soft" data-mess="1" style="margin-top:12px">
      ${icon(messung ? "edit" : "plus")} ${messung ? tr("Messung bearbeiten") : tr("Messung nachtragen")}</button>
  `);

  bd.addEventListener("click", (e) => {
    const wo = e.target.closest("[data-wo]");
    if (wo) { bd.remove(); openWorkoutDetail(wo.dataset.wo); return; }
    if (e.target.closest("[data-mess]")) { bd.remove(); koerperFormular(key); }
  });
};

ACTIONS["wochenziel"] = () => {
  const bd = openSheet(`
    <div class="sheet-title">${tr("Wochenziel")}
      <button class="icon-btn plain" data-action="close-sheet" aria-label="${tr("Schließen")}">${icon("x")}</button>
    </div>
    <div class="settings-row">
      <div class="lbl">${tr("Einheiten je Woche")}<small>${tr("Woran sich die Serie im Kalender misst")}</small></div>
      <select id="wz-feld">
        ${[1, 2, 3, 4, 5, 6, 7].map((n) => `<option value="${n}" ${n === (GESUND.wochenziel || 3) ? "selected" : ""}>${n}</option>`).join("")}
      </select>
    </div>
    <div class="sheet-fuss">
      <button class="btn" data-ok="1">${icon("check")} ${tr("Speichern")}</button>
    </div>
  `, { fest: true });
  bd.addEventListener("click", (e) => {
    if (!e.target.closest("[data-ok]")) return;
    GESUND.wochenziel = Math.min(14, Math.max(1, parseInt(bd.querySelector("#wz-feld").value, 10) || 3));
    speichereGesund();
    bd.remove();
    renderKalender();
    toast(tr("Gespeichert"));
  });
};

/* ═══════════════ Reiter „Balance" ═══════════════ */

ACTIONS["balance-range"] = (el) => {
  if (el.dataset.r === balanceRange) return;
  balanceRange = el.dataset.r;
  tippen();
  renderBalance();
};

function balanceWechseln(richtung) {
  const i = balanceIndex() + richtung;
  if (i < 0 || i >= BALANCE_RANGES.length) return false;
  balanceRange = BALANCE_RANGES[i].id;
  renderBalance();
  paneEinblenden($("#balance-pane"), richtung);
  return true;
}

function renderBalance() {
  const host = $("#screen-health-muscle");
  if (!host) return;
  const r = BALANCE_RANGES.find((x) => x.id === balanceRange) || BALANCE_RANGES[0];
  const zaehler = saetzeJeMuskel(r.wochen);
  const gesamt = BALANCE_MUSKELN.reduce((a, m) => a + zaehler[m], 0);
  const max = Math.max(BALANCE_MAX + 4, ...BALANCE_MUSKELN.map((m) => zaehler[m]));
  const sortiert = BALANCE_MUSKELN.slice().sort((a, b) => zaehler[b] - zaehler[a] || tMuskel(a).localeCompare(tMuskel(b), locale()));

  host.innerHTML = `
    <div class="screen-head">
      <div>
        <div class="wordmark">${logoSvg()}${tr("Gesundheit")}</div>
        <div class="screen-title">${tr("Balance")}</div>
      </div>
    </div>
    <div class="seg" role="tablist" aria-label="${tr("Zeitraum")}">
      ${BALANCE_RANGES.map((x) => `<button role="tab" aria-selected="${x.id === balanceRange}" class="${x.id === balanceRange ? "active" : ""}" data-action="balance-range" data-r="${esc(x.id)}">${esc(tr(x.label))}</button>`).join("")}
    </div>
    <div class="swipe-pane" id="balance-pane">
      ${gesamt > 0 ? `
      <p class="hint" style="margin:2px 2px 12px">${esc(r.wochen === 1
        ? tr("Abgehakte Sätze diese Woche, nach Muskelgruppe. Das hinterlegte Band markiert 10 bis 20 Sätze – ein grober Richtwert, kein Urteil.")
        : tr("Sätze je Woche im Schnitt der letzten {n} Wochen. Das hinterlegte Band markiert 10 bis 20 Sätze – ein grober Richtwert, kein Urteil.", { n: r.wochen }))}</p>
      ${sortiert.map((m) => balanceZeile(m, zaehler[m], max)).join("")}`
      : `<div class="empty">${icon("dumbbell")}
          <h3>${tr("Noch keine Sätze im Zeitraum")}</h3>
          <p>${tr("Sobald du trainierst, siehst du hier, welche Muskelgruppe wie viel abbekommt – und welche zu kurz kommt.")}</p>
        </div>`}
    </div>`;
}

function balanceZeile(muskel, saetze, max) {
  const breite = Math.min(100, (saetze / max) * 100);
  const von = (BALANCE_MIN / max) * 100, bis = (BALANCE_MAX / max) * 100;
  const stufe = saetze === 0 ? "leer" : saetze < BALANCE_MIN ? "wenig" : saetze > BALANCE_MAX ? "viel" : "gut";
  return `
    <div class="balance-zeile ${stufe}">
      <span class="balance-ic">${muscleIcon(muskel)}</span>
      <span class="balance-haupt">
        <span class="balance-kopf">
          <span>${esc(tMuskel(muskel))}</span>
          <b>${fmtKg(saetze)}</b>
        </span>
        <span class="balance-bar">
          <i class="balance-band" style="left:${von}%;width:${Math.max(0, bis - von)}%"></i>
          <i class="balance-fuell" style="width:${breite}%"></i>
        </span>
      </span>
    </div>`;
}

/* ═══════════════ Anbinden ═══════════════ */

function renderGesundheit() {
  renderKoerper();
  renderKalender();
  renderBalance();
}

/* Beim Wiederherstellen eines Backups: Ersetzen nimmt das Backup, Zusammen-
   führen ergänzt nur Tage, die es noch nicht gibt – ein vorhandener Messtag
   bleibt stehen. */
function gesundWiederherstellen(daten, mode) {
  if (!daten || typeof daten !== "object") return;
  const geprueft = bereinigeGesund(daten);
  if (mode !== "merge") {
    GESUND = geprueft;
  } else {
    for (const [tag, werte] of Object.entries(geprueft.koerper)) {
      if (!GESUND.koerper[tag]) GESUND.koerper[tag] = werte;
    }
    if (!GESUND.zielGewicht && geprueft.zielGewicht) GESUND.zielGewicht = geprueft.zielGewicht;
  }
  speichereGesund();
}

function gesundWischenVerbinden() {
  const koerper = $("#screen-health-body");
  if (koerper) {
    wischenVerbinden(koerper, {
      pane: () => $("#koerper-pane"),
      amRand: (r) => koerperIndex() + r < 0 || koerperIndex() + r >= KOERPER_RANGES.length,
      blaettern: koerperRangeWechseln,
    });
  }
  const kal = $("#screen-health-cal");
  if (kal) {
    wischenVerbinden(kal, {
      pane: () => $("#kal-pane"),
      amRand: (r) => {
        if (r < 0) return false;
        const d = new Date(kalMonat), g = new Date();
        return d.getMonth() === g.getMonth() && d.getFullYear() === g.getFullYear();
      },
      blaettern: monatVerschieben,
    });
  }
  const bal = $("#screen-health-muscle");
  if (bal) {
    wischenVerbinden(bal, {
      pane: () => $("#balance-pane"),
      amRand: (r) => balanceIndex() + r < 0 || balanceIndex() + r >= BALANCE_RANGES.length,
      blaettern: balanceWechseln,
    });
  }
}

gesundWischenVerbinden();
renderGesundheit();
