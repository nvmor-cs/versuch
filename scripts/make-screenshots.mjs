#!/usr/bin/env node
/* Erzeugt die Telefon-Screenshots für den Play-Store-Eintrag.
 *
 * Der Play Store will Bilder aus der laufenden App – keine Montagen. Also
 * läuft hier die echte App in einem Browser mit Handy-Maßen, bekommt einen
 * erfundenen, aber plausiblen Datenbestand untergeschoben und wird
 * abfotografiert. Dadurch sind die Bilder jederzeit reproduzierbar: Ändert
 * sich die Oberfläche, erzeugt ein Aufruf hier neue, aktuelle Screenshots.
 *
 *     npm i --no-save playwright      (einmalig, liegt nicht in package.json:
 *                                      der Android-Build braucht es nicht)
 *     npm run screenshots
 *
 * Maße: 360×640 Punkte bei dreifacher Pixeldichte → 1080×1920. Das ist das
 * Format, das Google für Telefone erwartet (16:9 hochkant, mind. 320 px).
 *
 * Die Daten sind erfunden. Sie sollen zeigen, wie die App mit ein paar Wochen
 * Gebrauch aussieht – ein leerer Startbildschirm verkauft nichts und erklärt
 * auch nichts.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ZIEL = path.join(ROOT, "store", "screenshots");

const BROWSER = process.env.CHROMIUM_PFAD || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

/* Ein Ein-Datei-Webserver: file:// reicht nicht, weil localStorage dort
   keinen eigenen Ursprung bekommt – und ohne localStorage keine Daten. */
function serverStarten() {
  const srv = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
    const datei = path.join(ROOT, rel);
    if (!datei.startsWith(ROOT) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
      res.writeHead(404).end("nicht gefunden");
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(datei)] || "application/octet-stream" });
    fs.createReadStream(datei).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok(srv)));
}

/* ═══════════════ Beispieldaten ═══════════════
   Läuft im Browser, nicht hier: Nur dort sind DB, ESSEN, GESUND und die
   Übungsbibliothek bekannt, und nur dort weiß exType(), ob eine Übung mit
   Gewicht, mit Wiederholungen oder mit Zeit geführt wird. */
function datenSetzen() {
  const TAG = 86400000;
  const heute = new Date(); heute.setHours(12, 0, 0, 0);
  const key = (d) => new Date(d).toLocaleDateString("sv-SE");   // YYYY-MM-DD

  /* ── Training: zwölf Wochen dreimal die Woche ───────────── */
  const plan = DB.plans[0];
  // Startwerte je Übung; alles Übrige bekommt einen Standard nach Art.
  const START = {
    "bankdruecken-lh": [60, 8], "schulterdruecken-kh": [18, 10], "schraegbank-kh": [22, 10],
    "seitheben-kh": [10, 12], "trizepsdruecken-kabel": [25, 12], "overhead-trizeps-kabel": [20, 12],
    "kreuzheben": [90, 5], "klimmzuege": [0, 6], "rudern-kabel": [55, 10],
    "latzug-breit": [50, 10], "face-pulls": [20, 15], "curls-sz": [25, 10], "hammer-curls": [14, 10],
    "kniebeugen": [75, 8], "rdl": [60, 8], "beinpresse": [140, 10], "beinbeuger-liegend": [40, 12],
    "wadenheben-stehend": [70, 12], "plank": [0, 0], "cable-crunches": [30, 12],
  };
  const workouts = [];
  const WOCHEN = 12, TAGE = [1, 3, 5];              // Mo, Mi, Fr
  let nr = 0;
  for (let w = WOCHEN - 1; w >= 0; w--) {
    for (const tag of TAGE) {
      // Der Sonntag der laufenden Woche als Anker, damit die Reihe sauber
      // in Wochen fällt – der Kalender zeigt sie genau so.
      const so = new Date(heute); so.setDate(so.getDate() - so.getDay() - w * 7);
      const d = new Date(so); d.setDate(d.getDate() + tag); d.setHours(18, 15, 0, 0);
      if (d.getTime() > Date.now()) continue;
      const wo = plan.workouts[nr % plan.workouts.length];
      nr++;
      const fortschritt = (WOCHEN - 1 - w) / (WOCHEN - 1);   // 0 → 1
      workouts.push({
        id: "demo-w" + nr, name: wo.name, planId: plan.id, woId: wo.id,
        startedAt: d.getTime(), endedAt: d.getTime() + 68 * 60000, durationSec: 68 * 60,
        exercises: wo.exercises.map((pe) => {
          const [gw, wdh] = START[pe.exerciseId] || [30, 10];
          const typ = exType(pe.exerciseId);
          return {
            exerciseId: pe.exerciseId,
            sets: Array.from({ length: pe.sets }, (_, i) => {
              if (typ === "time") return { t: 45 + Math.round(fortschritt * 30) + i * 5, w: 0, r: 0, done: true };
              // Gewicht wächst über die zwölf Wochen um gut ein Fünftel,
              // in Stufen von 2,5 kg – so, wie man es wirklich auflegt.
              const ziel = gw * (1 + 0.22 * fortschritt);
              const last = gw ? Math.max(gw, Math.round(ziel / 2.5) * 2.5) : 0;
              return { w: last, r: Math.max(4, wdh - (i > 1 ? 1 : 0)), t: 0, done: true };
            }),
          };
        }),
      });
    }
  }
  DB.workouts = workouts;
  DB.activePlanId = plan.id;
  DB.settings.eingefuehrt = true;
  DB.settings.beobachtet = ["bankdruecken-lh", "kniebeugen"];
  saveDB();

  /* ── Ernährung: ein Tag, wie er aussieht, wenn man mitschreibt ── */
  ESSEN.ziele = { kcal: 2400, eiweissP: 30, khP: 40, fettP: 30 };
  // Kennungen des Grundvorrats tragen das Präfix „b-" (siehe b() in essen.js)
  ESSEN.tage[key(heute)] = [
    { id: "d1", lmId: "b-haferflocken", mahlzeit: "fr", menge: 80 },
    { id: "d2", lmId: "b-milch15", mahlzeit: "fr", menge: 250 },
    { id: "d3", lmId: "b-banane", mahlzeit: "fr", menge: 120 },
    { id: "d4", lmId: "b-haehnchenbrust", mahlzeit: "mi", menge: 180 },
    { id: "d5", lmId: "b-reis-gekocht", mahlzeit: "mi", menge: 220 },
    { id: "d6", lmId: "b-brokkoli", mahlzeit: "mi", menge: 200 },
    { id: "d7", lmId: "b-skyr", mahlzeit: "sn", menge: 150 },
    { id: "d8", lmId: "b-blaubeeren", mahlzeit: "sn", menge: 100 },
  ];
  speichereEssen();

  /* ── Gesundheit: Gewicht, Maße, Tagestracker ────────────── */
  GESUND.zielGewicht = 79;
  GESUND.wochenziel = 3;
  GESUND.tracker = ["kreatin", "protein", "wasser", "schlaf", "schritte", "energie"];
  GESUND.koerper = {};
  // Vierzehn Wochen Gewicht, alle zwei bis drei Tage gewogen: von 84,2 auf
  // knapp 80. Die Zacken sind Absicht – ohne sie hätte die Trendlinie im
  // Diagramm nichts zu tun.
  const zacken = [0, .4, -.3, .5, -.2, .3, -.5, .2, .45, -.35, .1, -.25, .35, -.15];
  for (let i = 98; i >= 0; i -= 2) {
    const d = new Date(heute.getTime() - i * TAG);
    const grund = 84.2 - (98 - i) / 98 * 4.1;
    GESUND.koerper[key(d)] = { gewicht: Math.round((grund + zacken[i % zacken.length]) * 10) / 10 };
  }
  // Umfänge misst man nicht täglich – alle vier Wochen reicht.
  const masse = [
    [84, { taille: 88, brust: 104, arm: 36.5, bein: 58 }],
    [56, { taille: 86.5, brust: 105, arm: 37, bein: 58.5 }],
    [28, { taille: 85, brust: 106, arm: 37.5, bein: 59 }],
    [0, { taille: 83.5, brust: 107, arm: 38, bein: 59.5 }],
  ];
  for (const [vor, werte] of masse) {
    const k = key(new Date(heute.getTime() - vor * TAG));
    GESUND.koerper[k] = Object.assign(GESUND.koerper[k] || { gewicht: 80.1 }, werte);
  }
  // Die letzten sieben Tage bekommen Tracker – nur dann zeigt der Streifen
  // unter jeder Zeile etwas.
  const schritte = [9200, 11400, 7600, 12800, 8900, 10300, 6400];
  for (let i = 6; i >= 0; i--) {
    const k = key(new Date(heute.getTime() - i * TAG));
    const e = GESUND.koerper[k] || (GESUND.koerper[k] = {});
    e.kreatin = 1;
    if (i !== 3) e.protein = 1;
    e.wasser = [2.5, 3, 2.25, 3.25, 2.75, 3, 2.5][i];
    e.schlaf = [7, 7.5, 6.5, 8, 7.5, 7, 8][i];
    e.schritte = schritte[i];
    e.energie = [4, 5, 3, 5, 4, 4, 5][i];
  }
  speichereGesund();
}

/* ═══════════════ Aufnahmen ═══════════════
   Jede Aufnahme sagt, wohin die App springen soll. Die Namen sind nummeriert,
   weil der Play Store die Bilder in der Reihenfolge des Dateinamens anzeigt. */
const AUFNAHMEN = [
  ["1-start", () => { currentBereich = "training"; currentTab = "home"; render(); }],
  ["2-workout", () => {
    const plan = DB.plans[0], wo = plan.workouts[0];
    active = {
      id: "demo-live", name: wo.name, planId: plan.id, woId: wo.id,
      startedAt: Date.now() - 26 * 60000,
      exercises: wo.exercises.map((pe, i) => ({
        exerciseId: pe.exerciseId,
        sets: Array.from({ length: pe.sets }, (_, s) => {
          const fertig = i === 0 || (i === 1 && s < 2);
          const gw = { "bankdruecken-lh": 75, "schulterdruecken-kh": 22 }[pe.exerciseId] || 0;
          return fertig ? { w: gw, r: 8, t: 0, done: true } : { w: null, r: null, t: null, done: false };
        }),
      })),
    };
    saveActive();
    openWorkoutScreen();
  }],
  ["3-verlauf", () => {
    $(".workout-ov")?.remove(); active = null; saveActive();
    currentBereich = "training"; currentTab = "history"; histRange = "quarter"; render();
  }],
  ["4-uebung", () => { currentTab = "exercises"; render(); openExerciseDetail("bankdruecken-lh"); }],
  ["5-ernaehrung", () => { $(".overlay")?.remove(); currentBereich = "essen"; currentTab = "food-day"; render(); }],
  ["6-koerper", () => {
    currentBereich = "gesundheit"; currentTab = "health-body"; koerperRange = "90"; render();
    // Das Gewichtsdiagramm steht unter den Tagestrackern. Für das Standbild
    // zählt die Kurve – also so weit scrollen, dass sie ganz zu sehen ist.
    const anker = document.querySelector('#screen-health-body [data-action="tracker-waehlen"]');
    if (anker) window.scrollTo(0, anker.getBoundingClientRect().top + window.scrollY - 16);
  }],
  ["7-kalender", () => { window.scrollTo(0, 0); currentTab = "health-cal"; render(); }],
  ["8-balance", () => { currentTab = "health-muscle"; render(); }],
];

const RUHE = `
  *, *::before, *::after { transition: none !important; animation: none !important; }
  ::-webkit-scrollbar { width: 0; height: 0; }`;

/* Der Store-Eintrag ist zweisprachig, also gibt es die Bilder zweimal. Die
   Sprache muss stehen, bevor die App lädt: Der Beispielplan wird beim ersten
   Start einmalig angelegt und trägt danach die Namen der Sprache, die zu dem
   Zeitpunkt eingestellt war. */
async function aufnehmen(browser, url, sprache, ziel) {
  const ctx = await browser.newContext({
    viewport: { width: 360, height: 640 },
    deviceScaleFactor: 3,
    locale: sprache === "en" ? "en-GB" : "de-DE",
    colorScheme: "dark",
  });
  await ctx.addInitScript((s) => {
    localStorage.setItem("eisenzeit.db.v1", JSON.stringify({ settings: { sprache: s, eingefuehrt: true } }));
  }, sprache);

  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "load" });
  await page.addStyleTag({ content: RUHE });
  await page.waitForTimeout(400);
  await page.evaluate(datenSetzen);
  // Der Einstieg meldet sich verzögert – nach dem Merkzeichen oben bleibt er
  // weg, ein schon offenes Fenster muss aber noch verschwinden.
  await page.evaluate(() => { document.querySelector(".einstieg-ov")?.remove(); });

  fs.mkdirSync(ziel, { recursive: true });
  for (const alt of fs.readdirSync(ziel)) fs.unlinkSync(path.join(ziel, alt));

  for (const [name, schritt] of AUFNAHMEN) {
    await page.evaluate(schritt);
    // Die Punkte über der Pille zeigen, dass es drei Welten gibt – auf einem
    // Standbild ist das der einzige Hinweis darauf.
    await page.evaluate(() => punkteZeigen(600000));
    await page.waitForTimeout(500);
    const datei = path.join(ziel, name + ".png");
    await page.screenshot({ path: datei });
    console.log("✓", path.relative(ROOT, datei));
  }
  await ctx.close();
}

async function main() {
  const srv = await serverStarten();
  const url = `http://127.0.0.1:${srv.address().port}/index.html`;
  const browser = await chromium.launch({ executablePath: BROWSER });
  await aufnehmen(browser, url, "de", ZIEL);
  await aufnehmen(browser, url, "en", ZIEL + "-en");
  await browser.close();
  srv.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
