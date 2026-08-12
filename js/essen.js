// Lumora – Ernährung
//
// Bewusst ein eigenes Modul mit eigenem Speicher: Ernährung und Training
// haben nichts miteinander zu tun. Sie teilen nur die Oberfläche – Farben,
// Karten, Dialoge – und die Tab-Leiste, über die man zwischen beiden Welten
// wischt. Die Daten liegen unter einem eigenen Schlüssel, und keine Funktion
// hier greift auf DB.workouts zu.

"use strict";

const LS_ESSEN = "lumora.essen.v1";

const MAHLZEITEN = [
  { id: "fr", label: "Frühstück" },
  { id: "mi", label: "Mittagessen" },
  { id: "ab", label: "Abendessen" },
  { id: "sn", label: "Snacks" },
];

/* ═══════════════ Grundvorrat ═══════════════
   Damit die Ernährung vom ersten Tag an offline funktioniert, bringt die App
   einen Grundvorrat gängiger Lebensmittel mit – Werte je 100 g bzw. 100 ml.

   Das sind gerundete Richtwerte, keine Laboranalyse: Ein Apfel hat je nach
   Sorte 45 bis 60 kcal, und beim Brot entscheidet der Bäcker. Für die Frage
   „komme ich auf mein Eiweiß?" reicht das bei Weitem; wer es genauer will,
   nimmt die Packung über die Suche oder legt sich das Lebensmittel selbst an.
   Ein Grundnahrungsmittel lässt sich überschreiben – die Änderung landet als
   eigener Eintrag unter derselben Kennung und gewinnt danach immer. */
const ESSEN_BASIS = [
  // id, Name, Marke/Zusatz, kcal, Eiweiß, KH, Fett, Portion
  b("haferflocken", "Haferflocken", 370, 13, 59, 7, "Portion", 60),
  b("magerquark", "Magerquark", 67, 12, 4, 0.3, "Becher", 250),
  b("quark20", "Speisequark 20 %", 109, 12, 3.5, 5),
  b("skyr", "Skyr natur", 63, 11, 4, 0.2, "Becher", 150),
  b("joghurt35", "Naturjoghurt 3,5 %", 68, 3.5, 4.7, 3.5, "Becher", 150),
  b("huettenkaese", "Hüttenkäse", 98, 13, 3, 4.3),
  b("frischkaese", "Frischkäse", 250, 6, 3.5, 24),
  b("milch35", "Vollmilch 3,5 %", 65, 3.4, 4.8, 3.6, "Glas", 200, "ml"),
  b("milch15", "Milch 1,5 %", 47, 3.4, 4.9, 1.5, "Glas", 200, "ml"),
  b("gouda", "Gouda, mittelalt", 356, 25, 0, 28, "Scheibe", 30),
  b("feta", "Feta", 264, 14, 1, 22),
  b("mozzarella", "Mozzarella", 250, 18, 1, 19),
  b("ei", "Hühnerei", 137, 12, 1, 9.3, "Ei (M)", 55),
  b("haehnchenbrust", "Hähnchenbrustfilet, roh", 106, 23, 0, 1.3, "Filet", 150),
  b("putenbrust", "Putenbrustfilet, roh", 105, 24, 0, 1),
  b("hack-rind-mager", "Rinderhack, mager (5 %)", 137, 21, 0, 5),
  b("schwein-schnitzel", "Schweineschnitzel, roh", 106, 22, 0, 2),
  b("lachs", "Lachsfilet", 208, 20, 0, 13, "Filet", 125),
  b("thunfisch-wasser", "Thunfisch in Wasser", 108, 24, 0, 1, "Dose", 150),
  b("garnelen", "Garnelen", 87, 19, 0, 1),
  b("kochschinken", "Kochschinken", 110, 19, 1, 3, "Scheibe", 20),
  b("salami", "Salami", 380, 20, 1, 33, "Scheibe", 10),
  b("tofu", "Tofu natur", 127, 14, 2, 7),
  b("linsen-trocken", "Linsen, getrocknet", 318, 24, 41, 1.5),
  b("kichererbsen-dose", "Kichererbsen, Dose", 118, 7, 15, 2.5),
  b("kidneybohnen-dose", "Kidneybohnen, Dose", 116, 8, 15, 0.6),
  b("reis-roh", "Reis, roh", 350, 7, 77, 0.6),
  b("reis-gekocht", "Reis, gekocht", 130, 2.7, 28, 0.3),
  b("nudeln-roh", "Nudeln, roh", 360, 12, 71, 1.5),
  b("nudeln-vk-roh", "Vollkornnudeln, roh", 340, 13, 60, 2.5),
  b("kartoffeln", "Kartoffeln", 70, 2, 15, 0.1),
  b("suesskartoffel", "Süßkartoffel", 86, 1.6, 20, 0.1),
  b("pommes-ofen", "Pommes, Ofen", 180, 2.8, 27, 6),
  b("brot-vk", "Vollkornbrot", 215, 7, 38, 2, "Scheibe", 45),
  b("toast", "Toastbrot", 265, 8, 48, 3.5, "Scheibe", 25),
  b("broetchen", "Brötchen, Weizen", 270, 9, 53, 1.5, "Brötchen", 55),
  b("reiswaffel", "Reiswaffel", 380, 8, 80, 3, "Waffel", 6),
  b("mehl405", "Weizenmehl 405", 348, 10, 72, 1),
  b("banane", "Banane", 89, 1.1, 21, 0.3, "Banane", 120),
  b("apfel", "Apfel", 52, 0.3, 12, 0.2, "Apfel", 150),
  b("orange", "Orange", 47, 0.9, 9, 0.1, "Orange", 180),
  b("blaubeeren", "Blaubeeren", 57, 0.7, 12, 0.3),
  b("erdbeeren", "Erdbeeren", 32, 0.7, 5.5, 0.3),
  b("weintrauben", "Weintrauben", 69, 0.7, 16, 0.2),
  b("avocado", "Avocado", 160, 2, 2, 15, "halbe Avocado", 100),
  b("brokkoli", "Brokkoli", 34, 2.8, 4, 0.4),
  b("paprika", "Paprika, rot", 31, 1, 6, 0.3),
  b("tomate", "Tomate", 18, 0.9, 2.6, 0.2),
  b("gurke", "Gurke", 15, 0.7, 1.8, 0.1),
  b("zucchini", "Zucchini", 17, 1.2, 2, 0.3),
  b("karotte", "Karotte", 41, 0.9, 7, 0.2),
  b("spinat", "Spinat, frisch", 23, 2.9, 1.4, 0.4),
  b("zwiebel", "Zwiebel", 40, 1.1, 7, 0.1),
  b("olivenoel", "Olivenöl", 884, 0, 0, 100, "Esslöffel", 10),
  b("rapsoel", "Rapsöl", 884, 0, 0, 100, "Esslöffel", 10),
  b("butter", "Butter", 741, 0.7, 0.6, 82, "Portion", 10),
  b("mandeln", "Mandeln", 579, 21, 9, 50, "Handvoll", 25),
  b("walnuesse", "Walnüsse", 654, 15, 7, 65, "Handvoll", 25),
  b("erdnussbutter", "Erdnussbutter", 588, 25, 20, 50, "Esslöffel", 15),
  b("whey", "Whey-Proteinpulver", 380, 78, 6, 5, "Portion", 30),
  b("eiweissriegel", "Eiweißriegel", 350, 32, 30, 11, "Riegel", 60),
  b("honig", "Honig", 304, 0.3, 82, 0, "Teelöffel", 7),
  b("zucker", "Zucker", 400, 0, 100, 0, "Teelöffel", 4),
  b("ketchup", "Ketchup", 100, 1.2, 23, 0.1, "Esslöffel", 15),
  b("mayonnaise", "Mayonnaise", 700, 1, 2, 75, "Esslöffel", 15),
  b("schoko70", "Zartbitterschokolade 70 %", 570, 8, 33, 42, "Riegel", 100),
  b("schoko-vollmilch", "Vollmilchschokolade", 535, 7, 57, 30, "Riegel", 100),
  b("gummibaerchen", "Fruchtgummi", 340, 7, 77, 0.2, "Tüte", 200),
  b("chips", "Kartoffelchips", 535, 6, 50, 34, "Tüte", 150),
  b("pizza-salami", "Pizza Salami, TK", 260, 11, 28, 11, "Pizza", 320),
  b("cola", "Cola", 42, 0, 10.6, 0, "Glas", 250, "ml"),
  b("cola-zero", "Cola Zero", 0.3, 0, 0, 0, "Glas", 250, "ml"),
  b("orangensaft", "Orangensaft", 45, 0.7, 10, 0.1, "Glas", 200, "ml"),
  // Bei Bier und Wein gehen die Kalorien nicht in Eiweiß, Kohlenhydraten und
  // Fett auf – der Alkohol selbst liefert sie (7 kcal je Gramm). Das ist kein
  // Rechenfehler, sondern der Grund, warum ein Glas Wein so zu Buche schlägt.
  b("bier", "Bier", 43, 0.5, 3.6, 0, "Glas (0,5 l)", 500, "ml"),
  b("wein-rot", "Rotwein", 85, 0.1, 2.6, 0, "Glas", 200, "ml"),
  b("kaffee", "Kaffee, schwarz", 2, 0.1, 0, 0, "Tasse", 200, "ml"),
];

function b(id, name, kcal, eiweiss, kh, fett, portName, portGramm, einheit) {
  return {
    id: "b-" + id, name, marke: "", quelle: "basis",
    einheit: einheit || "g", kcal, eiweiss, kh, fett,
    portion: portName ? { name: portName, gramm: portGramm } : null,
  };
}

/* ═══════════════ Datenhaltung ═══════════════ */

function defaultEssen() {
  return {
    version: 1,
    // Tagesziele. Die Vorgaben sind bewusst neutral – jeder setzt sie selbst.
    ziele: { kcal: 2200, eiweiss: 160, kh: 240, fett: 70 },
    // Eigene Lebensmittel und alles, was schon einmal aus der Datenbank
    // geholt wurde. Was hier steht, funktioniert ohne Netz.
    lebensmittel: [],
    // Tagebuch: { "2026-08-12": [ { id, lmId, mahlzeit, menge } ] }
    tage: {},
  };
}

function ladeEssen() {
  let e = defaultEssen();
  try {
    const raw = localStorage.getItem(LS_ESSEN);
    if (raw) {
      const p = JSON.parse(raw);
      e = Object.assign(defaultEssen(), p);
      e.ziele = Object.assign(defaultEssen().ziele, p.ziele || {});
    }
  } catch (_) {
    try { localStorage.setItem(LS_ESSEN + ".corrupt", localStorage.getItem(LS_ESSEN) || ""); } catch (__) {}
  }
  return e;
}

let ESSEN = ladeEssen();

function speichereEssen() {
  try { localStorage.setItem(LS_ESSEN, JSON.stringify(ESSEN)); } catch (_) {}
}

// Eigene Einträge gewinnen: Wer ein Grundnahrungsmittel korrigiert, bekommt
// eine Kopie unter derselben Kennung – und die wird ab dann gefunden.
function lmById(id) {
  return ESSEN.lebensmittel.find((l) => l.id === id) || ESSEN_BASIS.find((l) => l.id === id) || null;
}

function alleLebensmittel() {
  const eigen = ESSEN.lebensmittel;
  const ids = new Set(eigen.map((l) => l.id));
  return eigen.concat(ESSEN_BASIS.filter((l) => !ids.has(l.id)));
}

// Ein Lebensmittel in die eigene Liste übernehmen (oder aktualisieren)
function lmMerken(lm) {
  const i = ESSEN.lebensmittel.findIndex((l) => l.id === lm.id);
  if (i >= 0) ESSEN.lebensmittel[i] = Object.assign(ESSEN.lebensmittel[i], lm);
  else ESSEN.lebensmittel.push(lm);
  speichereEssen();
}

/* ═══════════════ Rechnen ═══════════════ */

const tagKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

const NAEHRWERTE = ["kcal", "eiweiss", "kh", "fett"];

// Werte eines Eintrags: Basiswerte gelten je 100 g, der Eintrag hat Gramm
function eintragWerte(e) {
  const lm = lmById(e.lmId);
  const f = (e.menge || 0) / 100;
  const out = { kcal: 0, eiweiss: 0, kh: 0, fett: 0 };
  if (!lm) return out;
  for (const k of NAEHRWERTE) out[k] = (lm[k] || 0) * f;
  return out;
}

function summe(eintraege) {
  const out = { kcal: 0, eiweiss: 0, kh: 0, fett: 0 };
  for (const e of eintraege || []) {
    const w = eintragWerte(e);
    for (const k of NAEHRWERTE) out[k] += w[k];
  }
  return out;
}

const tagEintraege = (key) => ESSEN.tage[key] || [];

/* ═══════════════ Open Food Facts ═══════════════
   Kostenlos, offen (Open Database License) und mit sehr guter Abdeckung
   deutscher Produkte – die deutsche Adresse liefert deutsche Namen und
   sortiert Produkte aus Deutschland nach vorn.

   Regeln, die wir einhalten: höchstens eine Suchanfrage pro Sekunde
   (die Suche ist bei OFF absichtlich streng begrenzt), Tippen wird gebündelt,
   und jede laufende Anfrage wird abgebrochen, wenn eine neue kommt. Kein
   Konto, kein Schlüssel, keine Daten von uns an sie – nur der Suchbegriff.

   Wichtig fürs Offline-Versprechen: Die Datenbank ist eine Ergänzung, keine
   Grundlage. Was einmal benutzt wurde, liegt danach lokal. Ohne Netz sucht
   die App nur in der eigenen Liste und sagt das auch. */

const OFF_SUCHE = "https://de.openfoodfacts.org/cgi/search.pl";
const OFF_PRODUKT = "https://world.openfoodfacts.org/api/v2/product/";
const OFF_FELDER = "code,product_name,product_name_de,generic_name_de,brands,quantity,serving_size,serving_quantity,nutriments";

let offAbbruch = null;
let offLetzte = 0;

function zahl(v) {
  const n = typeof v === "string" ? parseFloat(v.replace(",", ".")) : v;
  return Number.isFinite(n) ? n : null;
}

// Ein OFF-Produkt in unsere Form bringen. Ohne Kalorien ist ein Eintrag
// wertlos – dann lieber weglassen als eine Null behaupten.
function ausOff(p) {
  if (!p) return null;
  const n = p.nutriments || {};
  let kcal = zahl(n["energy-kcal_100g"]);
  if (kcal == null) {
    const kj = zahl(n["energy-kj_100g"]) ?? zahl(n.energy_100g);
    if (kj != null) kcal = kj / 4.184;
  }
  const name = (p.product_name_de || p.product_name || p.generic_name_de || "").trim();
  if (kcal == null || !name) return null;
  const fluessig = /\b(ml|l|cl)\b/i.test(String(p.quantity || "")) || /\b(ml|l)\b/i.test(String(p.serving_size || ""));
  const portGramm = zahl(p.serving_quantity);
  return {
    id: "off-" + p.code,
    name,
    marke: (p.brands || "").split(",")[0].trim(),
    quelle: "off",
    barcode: String(p.code || ""),
    einheit: fluessig ? "ml" : "g",
    kcal: Math.round(kcal * 10) / 10,
    eiweiss: zahl(n.proteins_100g) ?? 0,
    kh: zahl(n.carbohydrates_100g) ?? 0,
    fett: zahl(n.fat_100g) ?? 0,
    portion: portGramm && portGramm > 0
      ? { name: (String(p.serving_size || "Portion").trim() || "Portion").slice(0, 24), gramm: portGramm }
      : null,
  };
}

async function offAnfrage(url) {
  if (offAbbruch) offAbbruch.abort();
  const steuer = new AbortController();
  offAbbruch = steuer;
  // Die Suche bei OFF ist auf wenige Anfragen pro Minute begrenzt. Ein
  // Mindestabstand ist keine Bremse, sondern Anstand.
  const warten = Math.max(0, 1000 - (Date.now() - offLetzte));
  if (warten) await new Promise((r) => setTimeout(r, warten));
  if (steuer.signal.aborted) throw abbruchFehler();
  offLetzte = Date.now();
  // Die Volltextsuche bei OFF kann träge sein. Nach zwölf Sekunden ist die
  // Frage beantwortet: heute nicht.
  const uhr = setTimeout(() => steuer.abort(), 12000);
  try {
    const res = await fetch(url, { signal: steuer.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } finally {
    clearTimeout(uhr);
  }
}

function abbruchFehler() {
  const e = new Error("abgebrochen");
  e.name = "AbortError";
  return e;
}

async function offSuchen(begriff) {
  const q = begriff.trim();
  if (!q) return [];
  // Reine Zahlenfolge? Das ist ein Barcode von der Packung – direkt abfragen.
  if (/^\d{8,14}$/.test(q)) {
    const d = await offAnfrage(`${OFF_PRODUKT}${q}.json?fields=${OFF_FELDER}`);
    const lm = d && d.status === 1 ? ausOff(d.product) : null;
    return lm ? [lm] : [];
  }
  const url = `${OFF_SUCHE}?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process`
    + `&json=1&page_size=24&lc=de&fields=${OFF_FELDER}`;
  const d = await offAnfrage(url);
  const roh = Array.isArray(d && d.products) ? d.products : [];
  return roh.map(ausOff).filter(Boolean).slice(0, 20);
}

/* ═══════════════ Reiter „Heute" ═══════════════ */

let essenTag = tagKey(Date.now());

const istHeute = (key) => key === tagKey(Date.now());

function tagVerschieben(richtung) {
  const [y, m, d] = essenTag.split("-").map(Number);
  const neu = new Date(y, m - 1, d + richtung);
  if (neu.getTime() > Date.now()) return false;   // in die Zukunft nicht
  essenTag = tagKey(neu);
  renderEssenTag();
  paneEinblenden($("#essen-tag-pane"), richtung);
  return true;
}

ACTIONS["essen-tag"] = (el) => { tagVerschieben(+el.dataset.r); };

function tagLabel(key) {
  const [y, m, d] = key.split("-").map(Number);
  const dat = new Date(y, m - 1, d);
  if (istHeute(key)) return "Heute";
  if (key === tagKey(Date.now() - 86400000)) return "Gestern";
  return dat.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "long" });
}

function renderEssenTag() {
  const host = $("#screen-food-day");
  if (!host) return;
  const eintraege = tagEintraege(essenTag);
  const s = summe(eintraege);
  const z = ESSEN.ziele;
  host.innerHTML = `
    <div class="screen-head">
      <div>
        <div class="wordmark">${logoSvg()}Ernährung</div>
        <div class="screen-title">${esc(tagLabel(essenTag))}</div>
      </div>
      <button class="icon-btn" data-action="essen-ziele" aria-label="Tagesziele">${icon("gear")}</button>
    </div>
    <div class="tag-leiste">
      <button class="icon-btn plain" data-action="essen-tag" data-r="-1" aria-label="Vorheriger Tag">${icon("chevL")}</button>
      <span>${esc(new Date(essenTag).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }))}</span>
      <button class="icon-btn plain ${istHeute(essenTag) ? "aus" : ""}" data-action="essen-tag" data-r="1"
        aria-label="Nächster Tag" ${istHeute(essenTag) ? "disabled" : ""}>${icon("chevR")}</button>
    </div>
    <div class="swipe-pane" id="essen-tag-pane">
      ${tagesUebersicht(s, z)}
      ${MAHLZEITEN.map((m) => mahlzeitBlock(m, eintraege)).join("")}
    </div>`;
}

function tagesUebersicht(s, z) {
  const rest = Math.round((z.kcal || 0) - s.kcal);
  const anteil = z.kcal ? Math.min(100, (s.kcal / z.kcal) * 100) : 0;
  const makro = (label, wert, ziel, klasse) => {
    const p = ziel ? Math.min(100, (wert / ziel) * 100) : 0;
    return `
      <div class="makro">
        <div class="makro-kopf"><span>${label}</span><b>${Math.round(wert)} / ${ziel} g</b></div>
        <div class="makro-bar"><i class="${klasse}" style="width:${p}%"></i></div>
      </div>`;
  };
  return `
    <div class="card kcal-karte">
      <div class="kcal-zahlen">
        <div>
          <div class="kcal-gross">${Math.round(s.kcal).toLocaleString("de-DE")}</div>
          <div class="hint">von ${(z.kcal || 0).toLocaleString("de-DE")} kcal</div>
        </div>
        <div class="kcal-rest ${rest < 0 ? "drueber" : ""}">
          <b>${rest < 0 ? "+" + Math.abs(rest).toLocaleString("de-DE") : rest.toLocaleString("de-DE")}</b>
          <span>${rest < 0 ? "darüber" : "übrig"}</span>
        </div>
      </div>
      <div class="kcal-bar"><i style="width:${anteil}%" class="${rest < 0 ? "drueber" : ""}"></i></div>
      ${makro("Eiweiß", s.eiweiss, z.eiweiss, "m-eiweiss")}
      ${makro("Kohlenhydrate", s.kh, z.kh, "m-kh")}
      ${makro("Fett", s.fett, z.fett, "m-fett")}
    </div>`;
}

function mahlzeitBlock(m, alle) {
  const drin = alle.filter((e) => e.mahlzeit === m.id);
  const s = summe(drin);
  return `
    <div class="section-label">${m.label}<span class="mz-kcal">${Math.round(s.kcal)} kcal</span></div>
    ${drin.map((e) => eintragZeile(e)).join("")}
    <button class="btn btn-ghost btn-compact mz-add" data-action="essen-suchen" data-mz="${m.id}">
      ${icon("plus")} Hinzufügen</button>`;
}

function eintragZeile(e) {
  const lm = lmById(e.lmId);
  const w = eintragWerte(e);
  const einheit = lm ? lm.einheit : "g";
  return `
    <div class="lm-zeile">
      <button class="lm-haupt" data-action="essen-eintrag" data-id="${e.id}">
        <span class="lm-name">${esc(lm ? lm.name : "Unbekannt")}${lm && lm.marke ? ` <span class="lm-marke">${esc(lm.marke)}</span>` : ""}</span>
        <span class="lm-sub">${fmtKg(e.menge)} ${einheit} · E ${Math.round(w.eiweiss)} · KH ${Math.round(w.kh)} · F ${Math.round(w.fett)}</span>
      </button>
      <span class="lm-kcal">${Math.round(w.kcal)}</span>
      <button class="mini-btn danger" data-action="essen-loeschen" data-id="${e.id}" aria-label="Eintrag löschen">${icon("x")}</button>
    </div>`;
}

ACTIONS["essen-loeschen"] = (el) => {
  const liste = ESSEN.tage[essenTag] || [];
  const i = liste.findIndex((e) => e.id === el.dataset.id);
  if (i < 0) return;
  liste.splice(i, 1);
  if (!liste.length) delete ESSEN.tage[essenTag];
  speichereEssen();
  renderEssenTag();
  renderEssenVerlauf();
};

/* ── Menge eines Eintrags ändern ─────────────────────────── */

ACTIONS["essen-eintrag"] = (el) => {
  const e = (ESSEN.tage[essenTag] || []).find((x) => x.id === el.dataset.id);
  if (!e) return;
  mengeSheet(lmById(e.lmId), e.menge, e.mahlzeit, (menge, mz) => {
    e.menge = menge;
    e.mahlzeit = mz;
    speichereEssen();
    renderEssenTag();
    renderEssenVerlauf();
  });
};

// Ein Blatt für „wie viel davon?" – beim Hinzufügen wie beim Ändern
function mengeSheet(lm, menge, mahlzeit, fertig) {
  if (!lm) return;
  let m = menge, mz = mahlzeit || "fr";
  const bd = openSheet("");
  const zeichne = () => {
    const f = m / 100;
    bd.querySelector(".sheet").innerHTML = `
      <div class="sheet-grip"></div>
      <div class="sheet-title">${esc(lm.name)}
        <button class="icon-btn plain" data-action="close-sheet" aria-label="Schließen">${icon("x")}</button>
      </div>
      ${lm.marke ? `<p class="hint" style="margin:-6px 2px 12px">${esc(lm.marke)}</p>` : ""}
      <div class="stepper-group">
        <div class="stepper-label">Menge (${lm.einheit})</div>
        <div class="stepper">
          <button class="stepper-btn" data-m="-1" aria-label="weniger">−</button>
          <input class="stepper-val" type="text" inputmode="decimal" id="menge-feld" value="${String(fmtKg(m)).replace(".", ",")}" aria-label="Menge">
          <button class="stepper-btn" data-m="1" aria-label="mehr">+</button>
        </div>
      </div>
      ${lm.portion ? `<button class="btn btn-soft btn-compact" data-p="1" style="margin-bottom:12px">
        1 ${esc(lm.portion.name)} = ${fmtKg(lm.portion.gramm)} ${lm.einheit}</button>` : ""}
      <div class="werte-gitter">
        ${[["kcal", Math.round((lm.kcal || 0) * f)], ["Eiweiß", Math.round((lm.eiweiss || 0) * f) + " g"],
           ["KH", Math.round((lm.kh || 0) * f) + " g"], ["Fett", Math.round((lm.fett || 0) * f) + " g"]]
          .map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join("")}
      </div>
      <div class="settings-row">
        <div class="lbl">Mahlzeit</div>
        <select id="mz-feld">
          ${MAHLZEITEN.map((x) => `<option value="${x.id}" ${x.id === mz ? "selected" : ""}>${x.label}</option>`).join("")}
        </select>
      </div>
      <button class="btn" data-ok="1">${icon("check")} Übernehmen</button>`;
  };
  zeichne();
  bd.addEventListener("click", (e) => {
    const stufe = e.target.closest("[data-m]");
    if (stufe) {
      // Kleine Mengen in 5er-Schritten, große in 10er – Öl zählt man anders als Reis
      const schritt = m < 50 ? 5 : 10;
      m = Math.max(1, Math.round((m + +stufe.dataset.m * schritt) / schritt) * schritt);
      zeichne();
      return;
    }
    if (e.target.closest("[data-p]")) { m = lm.portion.gramm; zeichne(); return; }
    if (e.target.closest("[data-ok]")) {
      const feld = bd.querySelector("#menge-feld");
      const v = parseNum(feld ? feld.value : "");
      const sel = bd.querySelector("#mz-feld");
      if (sel) mz = sel.value;
      if (Number.isFinite(v) && v > 0) m = v;
      bd.remove();
      fertig(m, mz);
    }
  });
}

/* ═══════════════ Reiter „Lebensmittel" ═══════════════ */

let lmSuche = "";
let lmTreffer = [];        // aus der Datenbank
let lmStatus = "";         // Hinweiszeile über den Treffern
let lmSuchTimer = null;

// Wonach zuletzt gegriffen wurde, steht oben – das ist beim Essen fast immer
// die richtige Reihenfolge.
function eigeneTreffer(q) {
  const s = q.trim().toLowerCase();
  const passt = (l) => !s || (l.name + " " + (l.marke || "")).toLowerCase().includes(s);
  return alleLebensmittel().filter(passt)
    .sort((a, x) => (x.benutzt || 0) - (a.benutzt || 0) || a.name.localeCompare(x.name, "de"))
    .slice(0, 40);
}

function renderEssenLib() {
  const host = $("#screen-food-lib");
  if (!host) return;
  const eigen = eigeneTreffer(lmSuche);
  host.innerHTML = `
    <div class="screen-head">
      <div class="screen-title">Lebensmittel</div>
      <button class="icon-btn" data-action="essen-neu" aria-label="Eigenes Lebensmittel">${icon("plus")}</button>
    </div>
    <div class="search-wrap">${icon("search")}
      <input class="search-input" data-input="lm-suche" value="${esc(lmSuche)}" placeholder="Suchen oder Barcode eintippen …" autocomplete="off">
    </div>
    <div id="lm-liste">${lmListe(eigen)}</div>`;
}

function lmListe(eigen) {
  return `
    <div class="section-label">Deine Liste</div>
    ${eigen.length ? eigen.map((l) => lmZeile(l)).join("")
      : `<p class="hint">Nichts gefunden. Such unten in der Datenbank oder leg dir das Lebensmittel selbst an.</p>`}
    <div class="section-label">Open Food Facts</div>
    ${lmStatus ? `<p class="hint">${esc(lmStatus)}</p>` : ""}
    ${lmTreffer.map((l) => lmZeile(l, true)).join("")}`;
}

function lmZeile(l, neu) {
  return `
    <button class="row" data-action="essen-lm" data-id="${esc(l.id)}" data-neu="${neu ? 1 : 0}">
      <span class="row-main">
        <span class="row-title">${esc(l.name)}</span>
        <span class="row-sub">${l.marke ? esc(l.marke) + " · " : ""}${Math.round(l.kcal)} kcal je 100 ${l.einheit}
          · E ${fmtKg(l.eiweiss)} · KH ${fmtKg(l.kh)} · F ${fmtKg(l.fett)}</span>
      </span>
      ${l.quelle === "eigen" ? `<span class="badge">eigen</span>` : ""}
      <span class="chev">${icon("chevR")}</span>
    </button>`;
}

// Treffer aus der Datenbank liegen nur im Speicher, bis man sie benutzt
const offCache = new Map();

function lmSucheSetzen(wert) {
  lmSuche = wert;
  const liste = $("#lm-liste");
  if (liste) liste.innerHTML = lmListe(eigeneTreffer(lmSuche));
  clearTimeout(lmSuchTimer);
  const q = wert.trim();
  if (q.length < 3) {
    lmTreffer = [];
    lmStatus = q ? "Noch zu kurz – ab drei Zeichen wird gesucht." : "Tippe, um in der Datenbank zu suchen.";
    if (liste) liste.innerHTML = lmListe(eigeneTreffer(lmSuche));
    return;
  }
  lmStatus = "Wird gesucht …";
  if (liste) liste.innerHTML = lmListe(eigeneTreffer(lmSuche));
  lmSuchTimer = setTimeout(async () => {
    if (navigator.onLine === false) {
      lmTreffer = [];
      lmStatus = "Kein Netz – gesucht wird nur in deiner Liste.";
    } else {
      try {
        lmTreffer = await offSuchen(q);
        lmTreffer.forEach((l) => offCache.set(l.id, l));
        lmStatus = lmTreffer.length ? "" : "Nichts gefunden. Vielleicht als eigenes Lebensmittel anlegen?";
      } catch (err) {
        if (err && err.name === "AbortError") return;
        lmTreffer = [];
        lmStatus = "Die Datenbank ist gerade nicht erreichbar.";
      }
    }
    const l2 = $("#lm-liste");
    if (l2) l2.innerHTML = lmListe(eigeneTreffer(lmSuche));
  }, 550);
}

INPUTS["lm-suche"] = (el) => lmSucheSetzen(el.value);

/* ── Ein Lebensmittel antippen ───────────────────────────── */

ACTIONS["essen-lm"] = (el) => {
  const lm = lmById(el.dataset.id) || offCache.get(el.dataset.id);
  // Wurde aus einer Mahlzeit heraus gesucht, gilt die – nicht die Uhrzeit
  if (lm) lmDetail(lm, ($(".essen-ov") || { dataset: {} }).dataset.mz);
};

function lmDetail(lm, mahlzeit) {
  const eigen = lm.quelle === "eigen";
  const bd = openSheet(`
    <div class="sheet-title">${esc(lm.name)}
      <button class="icon-btn plain" data-action="close-sheet" aria-label="Schließen">${icon("x")}</button>
    </div>
    ${lm.marke ? `<p class="hint" style="margin:-6px 2px 12px">${esc(lm.marke)}</p>` : ""}
    <div class="werte-gitter">
      ${[["kcal", Math.round(lm.kcal)], ["Eiweiß", fmtKg(lm.eiweiss) + " g"],
         ["KH", fmtKg(lm.kh) + " g"], ["Fett", fmtKg(lm.fett) + " g"]]
        .map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join("")}
    </div>
    <p class="hint" style="margin:0 2px 14px">Werte je 100 ${lm.einheit}${
      lm.quelle === "basis" ? " · gerundeter Richtwert" : lm.quelle === "off" ? " · aus Open Food Facts" : ""}</p>
    <button class="btn" data-t="add">${icon("plus")} Zu ${esc(tagLabel(essenTag).toLowerCase())} hinzufügen</button>
    <button class="btn btn-ghost" data-t="edit" style="margin-top:8px">${icon("edit")} ${eigen ? "Bearbeiten" : "Werte anpassen"}</button>
    ${eigen ? `<button class="btn btn-danger-soft" data-t="del" style="margin-top:8px">${icon("trash")} Löschen</button>` : ""}
  `);
  bd.addEventListener("click", async (e) => {
    const t = e.target.closest("[data-t]");
    if (!t) return;
    if (t.dataset.t === "add") {
      bd.remove();
      lmHinzufuegen(lm, mahlzeit || null);
    } else if (t.dataset.t === "edit") {
      bd.remove();
      lmFormular(lm);
    } else if (t.dataset.t === "del") {
      if (!(await appConfirm(`„${lm.name}" löschen? Bereits eingetragene Mengen bleiben stehen.`, { ok: "Löschen", danger: true }))) return;
      ESSEN.lebensmittel = ESSEN.lebensmittel.filter((l) => l.id !== lm.id);
      speichereEssen();
      bd.remove();
      renderEssenLib();
      toast("Lebensmittel gelöscht");
    }
  });
}

// Ins Tagebuch übernehmen. Dabei wandert das Lebensmittel in die eigene
// Liste – ab dann geht es auch ohne Netz.
function lmHinzufuegen(lm, mahlzeit) {
  mengeSheet(lm, lm.portion ? lm.portion.gramm : 100, mahlzeit || vorschlagMahlzeit(), (menge, mz) => {
    lmMerken(Object.assign({}, lm, { benutzt: Date.now() }));
    const liste = ESSEN.tage[essenTag] || (ESSEN.tage[essenTag] = []);
    liste.push({ id: uid(), lmId: lm.id, mahlzeit: mz, menge });
    speichereEssen();
    tippen(true);
    toast("Eingetragen");
    // Die Suche hat ihren Zweck erfüllt und darf aus dem Weg
    $(".essen-ov")?.remove();
    renderEssenTag();
    renderEssenLib();
    renderEssenVerlauf();
    if (currentTab !== "food-day") {
      currentTab = "food-day";
      letzterTab.essen = "food-day";
      render();
    }
  });
}

// Nach der Uhrzeit geraten – das trifft meistens zu und spart einen Griff
function vorschlagMahlzeit() {
  const h = new Date().getHours();
  if (h < 11) return "fr";
  if (h < 15) return "mi";
  if (h < 21) return "ab";
  return "sn";
}

/* ── Suche als Vollbild, aus einer Mahlzeit heraus ────────── */

ACTIONS["essen-suchen"] = (el) => {
  const mz = el.dataset.mz;
  lmSuche = "";
  lmTreffer = [];
  lmStatus = "Tippe, um in der Datenbank zu suchen.";
  const ov = openOverlay(`
    <div class="overlay-head">
      <button class="icon-btn plain" data-action="essen-suche-zu" aria-label="Zurück">${icon("chevL")}</button>
      <div class="screen-title">${esc((MAHLZEITEN.find((m) => m.id === mz) || {}).label || "Hinzufügen")}</div>
      <button class="icon-btn" data-action="essen-neu" aria-label="Eigenes Lebensmittel">${icon("plus")}</button>
    </div>
    <div class="search-wrap">${icon("search")}
      <input class="search-input" data-input="lm-suche-ov" placeholder="Suchen oder Barcode eintippen …" autocomplete="off">
    </div>
    <div id="lm-liste-ov"></div>`, "essen-ov");
  ov.dataset.mz = mz;
  ovListeZeichnen();
  const feld = ov.querySelector("input");
  if (feld) setTimeout(() => feld.focus(), 60);
};

ACTIONS["essen-suche-zu"] = () => { $(".essen-ov")?.remove(); };

function ovListeZeichnen() {
  const ziel = $("#lm-liste-ov");
  if (ziel) ziel.innerHTML = lmListe(eigeneTreffer(lmSuche));
}

INPUTS["lm-suche-ov"] = (el) => {
  // Dieselbe Suche, nur ein anderer Behälter
  const echt = $("#lm-liste");
  lmSuche = el.value;
  lmSucheSetzenOv(el.value);
  if (echt) echt.innerHTML = lmListe(eigeneTreffer(lmSuche));
};

function lmSucheSetzenOv(wert) {
  clearTimeout(lmSuchTimer);
  const q = wert.trim();
  if (q.length < 3) {
    lmTreffer = [];
    lmStatus = q ? "Noch zu kurz – ab drei Zeichen wird gesucht." : "Tippe, um in der Datenbank zu suchen.";
    ovListeZeichnen();
    return;
  }
  lmStatus = "Wird gesucht …";
  ovListeZeichnen();
  lmSuchTimer = setTimeout(async () => {
    if (navigator.onLine === false) {
      lmTreffer = [];
      lmStatus = "Kein Netz – gesucht wird nur in deiner Liste.";
    } else {
      try {
        lmTreffer = await offSuchen(q);
        lmTreffer.forEach((l) => offCache.set(l.id, l));
        lmStatus = lmTreffer.length ? "" : "Nichts gefunden. Vielleicht als eigenes Lebensmittel anlegen?";
      } catch (err) {
        if (err && err.name === "AbortError") return;
        lmTreffer = [];
        lmStatus = "Die Datenbank ist gerade nicht erreichbar.";
      }
    }
    ovListeZeichnen();
  }, 550);
}

/* ── Eigenes Lebensmittel anlegen und bearbeiten ─────────── */

ACTIONS["essen-neu"] = () => lmFormular(null);

function lmFormular(vorlage) {
  // Ein angepasstes Grundnahrungsmittel behält seine Kennung: Damit bleiben
  // alte Einträge im Tagebuch gültig und zeigen ab jetzt die neuen Werte.
  const l = vorlage
    ? Object.assign({}, vorlage, { quelle: "eigen" })
    : { id: "e-" + uid(), name: "", marke: "", quelle: "eigen", einheit: "g",
        kcal: 0, eiweiss: 0, kh: 0, fett: 0, portion: null };
  const feld = (k, label, wert, mode) => `
    <div class="field">
      <label for="lf-${k}">${label}</label>
      <input id="lf-${k}" data-f="${k}" type="text" ${mode ? `inputmode="${mode}"` : ""} value="${esc(wert)}" autocomplete="off">
    </div>`;
  const bd = openSheet(`
    <div class="sheet-title">${vorlage ? "Werte anpassen" : "Eigenes Lebensmittel"}
      <button class="icon-btn plain" data-action="close-sheet" aria-label="Schließen">${icon("x")}</button>
    </div>
    ${feld("name", "Name", l.name)}
    ${feld("marke", "Marke (optional)", l.marke || "")}
    <div class="field">
      <label for="lf-einheit">Bezug</label>
      <select id="lf-einheit" data-f="einheit">
        <option value="g" ${l.einheit === "g" ? "selected" : ""}>je 100 g</option>
        <option value="ml" ${l.einheit === "ml" ? "selected" : ""}>je 100 ml</option>
      </select>
    </div>
    <div class="feld-zwei">
      ${feld("kcal", "kcal", fmtKg(l.kcal), "decimal")}
      ${feld("eiweiss", "Eiweiß (g)", fmtKg(l.eiweiss), "decimal")}
      ${feld("kh", "Kohlenhydrate (g)", fmtKg(l.kh), "decimal")}
      ${feld("fett", "Fett (g)", fmtKg(l.fett), "decimal")}
    </div>
    <div class="feld-zwei">
      ${feld("pname", "Portion heißt", l.portion ? l.portion.name : "")}
      ${feld("pgramm", "Portion hat", l.portion ? fmtKg(l.portion.gramm) : "", "decimal")}
    </div>
    <button class="btn" data-speichern="1" style="margin-top:6px">${icon("check")} Speichern</button>
  `);
  bd.querySelector("[data-speichern]").addEventListener("click", () => {
    const v = (k) => (bd.querySelector(`[data-f="${k}"]`) || {}).value || "";
    const num = (k) => { const n = parseNum(v(k)); return Number.isFinite(n) && n >= 0 ? n : 0; };
    const name = v("name").trim();
    if (!name) { toast("Der Name fehlt"); return; }
    const pg = parseNum(v("pgramm"));
    const neu = Object.assign(l, {
      name, marke: v("marke").trim(), einheit: v("einheit") === "ml" ? "ml" : "g",
      kcal: num("kcal"), eiweiss: num("eiweiss"), kh: num("kh"), fett: num("fett"),
      portion: v("pname").trim() && Number.isFinite(pg) && pg > 0
        ? { name: v("pname").trim(), gramm: pg } : null,
    });
    lmMerken(neu);
    bd.remove();
    renderEssenLib();
    toast("Gespeichert");
  });
}

/* ── Tagesziele ──────────────────────────────────────────── */

ACTIONS["essen-ziele"] = () => {
  const z = ESSEN.ziele;
  const feld = (k, label, wert) => `
    <div class="field">
      <label for="z-${k}">${label}</label>
      <input id="z-${k}" data-z="${k}" type="text" inputmode="numeric" value="${wert}">
    </div>`;
  const bd = openSheet(`
    <div class="sheet-title">Tagesziele
      <button class="icon-btn plain" data-action="close-sheet" aria-label="Schließen">${icon("x")}</button>
    </div>
    ${feld("kcal", "Kalorien (kcal)", z.kcal)}
    <div class="feld-zwei">
      ${feld("eiweiss", "Eiweiß (g)", z.eiweiss)}
      ${feld("kh", "Kohlenhydrate (g)", z.kh)}
      ${feld("fett", "Fett (g)", z.fett)}
    </div>
    <p class="hint" style="margin:4px 2px 14px">Die Ziele sind reine Zielmarken – die App rechnet nichts daraus und
      vergleicht sie mit nichts aus dem Training.</p>
    <button class="btn" data-ziele="1">${icon("check")} Speichern</button>
  `);
  bd.querySelector("[data-ziele]").addEventListener("click", () => {
    for (const k of NAEHRWERTE) {
      const el = bd.querySelector(`[data-z="${k}"]`);
      const n = parseInt(el ? el.value : "", 10);
      if (Number.isFinite(n) && n >= 0) ESSEN.ziele[k] = n;
    }
    speichereEssen();
    bd.remove();
    renderEssenTag();
    renderEssenVerlauf();
    toast("Ziele gespeichert");
  });
};

/* ═══════════════ Reiter „Verlauf" (Ernährung) ═══════════════ */

const ESSEN_RANGES = [
  { id: "7", label: "7 Tage", tage: 7 },
  { id: "30", label: "30 Tage", tage: 30 },
  { id: "90", label: "90 Tage", tage: 90 },
];
let essenRange = "7";

const essenRangeIndex = () => ESSEN_RANGES.findIndex((r) => r.id === essenRange);

function essenRangeWechseln(richtung) {
  const i = essenRangeIndex() + richtung;
  if (i < 0 || i >= ESSEN_RANGES.length) return false;
  essenRange = ESSEN_RANGES[i].id;
  renderEssenVerlauf();
  paneEinblenden($("#essen-hist-pane"), richtung);
  return true;
}

ACTIONS["essen-range"] = (el) => {
  if (el.dataset.r === essenRange) return;
  essenRange = el.dataset.r;
  tippen();
  renderEssenVerlauf();
};

// Die Tage des Zeitraums, ältester zuerst
function essenTage(n) {
  const out = [];
  const heute = new Date();
  heute.setHours(12, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(heute.getTime() - i * 86400000);
    const key = tagKey(d);
    out.push({ key, datum: d, summe: summe(tagEintraege(key)), leer: !tagEintraege(key).length });
  }
  return out;
}

function renderEssenVerlauf() {
  const host = $("#screen-food-hist");
  if (!host) return;
  const r = ESSEN_RANGES.find((x) => x.id === essenRange);
  const tage = essenTage(r.tage);
  const getrackt = tage.filter((t) => !t.leer);
  const mittel = (k) => getrackt.length
    ? getrackt.reduce((a, t) => a + t.summe[k], 0) / getrackt.length : 0;
  const z = ESSEN.ziele;
  host.innerHTML = `
    <div class="screen-head">
      <div class="screen-title">Ernährung im Verlauf</div>
    </div>
    <div class="seg" role="tablist" aria-label="Zeitraum">
      ${ESSEN_RANGES.map((x) => `<button role="tab" aria-selected="${x.id === essenRange}" class="${x.id === essenRange ? "active" : ""}" data-action="essen-range" data-r="${x.id}">${x.label}</button>`).join("")}
    </div>
    <div class="swipe-pane" id="essen-hist-pane">
      ${getrackt.length ? `
      <div class="stat-tiles">
        <div class="stat-tile"><b>${Math.round(mittel("kcal")).toLocaleString("de-DE")}</b><span>Ø kcal</span></div>
        <div class="stat-tile"><b>${getrackt.length}/${r.tage}</b><span>Tage</span></div>
        <div class="stat-tile"><b>${Math.round(mittel("eiweiss"))} g</b><span>Ø Eiweiß</span></div>
      </div>
      <div class="card chart-card">
        <h3>Kalorien je Tag</h3>
        <div class="chart-sub">Die Linie ist dein Ziel: ${(z.kcal || 0).toLocaleString("de-DE")} kcal</div>
        <div class="chart-wrap">${kcalChart(tage, z.kcal)}</div>
      </div>
      ${makroMittelKarte(mittel, z)}`
      : `<div class="empty">${icon("apple")}
          <h3>Noch nichts getrackt</h3>
          <p>Trag im Reiter „Heute" dein erstes Lebensmittel ein – hier entsteht daraus die Entwicklung.</p>
        </div>`}
    </div>`;
}

function makroMittelKarte(mittel, z) {
  const zeile = (label, wert, ziel, kl) => {
    const p = ziel ? Math.min(100, (wert / ziel) * 100) : 0;
    return `<div class="makro">
      <div class="makro-kopf"><span>${label}</span><b>Ø ${Math.round(wert)} / ${ziel} g</b></div>
      <div class="makro-bar"><i class="${kl}" style="width:${p}%"></i></div></div>`;
  };
  return `<div class="card">
    <div class="section-label" style="margin-top:0">Nährstoffe im Mittel</div>
    ${zeile("Eiweiß", mittel("eiweiss"), z.eiweiss, "m-eiweiss")}
    ${zeile("Kohlenhydrate", mittel("kh"), z.kh, "m-kh")}
    ${zeile("Fett", mittel("fett"), z.fett, "m-fett")}
  </div>`;
}

function kcalChart(tage, ziel) {
  const werte = tage.map((t) => t.summe.kcal);
  const max = Math.max(...werte, ziel || 0, 1);
  const W = 320, H = 150, padL = 4, padR = 4, padT = 20, padB = 20;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const n = tage.length;
  const slot = innerW / n, barW = Math.max(3, Math.min(26, slot * 0.62));
  let out = "";
  for (let g = 1; g <= 3; g++) {
    const y = padT + innerH - (innerH * g) / 3;
    out += `<line class="chart-grid-line" x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}"/>`;
  }
  out += `<line class="chart-grid-line" x1="${padL}" y1="${padT + innerH}" x2="${W - padR}" y2="${padT + innerH}" style="stroke:var(--axis)"/>`;
  werte.forEach((v, i) => {
    if (v <= 0) return;
    const cx = padL + slot * i + slot / 2;
    const x = cx - barW / 2;
    const h = Math.max(3, (v / max) * innerH);
    const y = padT + innerH - h;
    const r = Math.min(4, barW / 2, h);
    // Über dem Ziel bekommt der Balken die Warnfarbe – ohne Text, das sieht man
    const drueber = ziel && v > ziel * 1.05;
    out += `<path class="bar-rect${drueber ? " ueberziel" : ""}"`
      + ` d="M${x} ${y + r} a${r} ${r} 0 0 1 ${r} ${-r} h${barW - 2 * r} a${r} ${r} 0 0 1 ${r} ${r} v${h - r} h${-barW} z">`
      + `<title>${esc(tage[i].datum.toLocaleDateString("de-DE"))}: ${Math.round(v)} kcal</title></path>`;
  });
  if (ziel) {
    const y = padT + innerH - (ziel / max) * innerH;
    out += `<line class="ziel-linie" x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}"/>`;
  }
  // Randbeschriftungen nach innen ausrichten – mittig würden sie abgeschnitten
  const beschriften = (i, x, anker) =>
    `<text class="chart-axis-text" x="${x}" y="${H - 5}" text-anchor="${anker}">${
      tage[i].datum.toLocaleDateString("de-DE", { day: "numeric", month: "numeric" })}</text>`;
  out += beschriften(0, padL, "start");
  if (n > 4) {
    const mitte = Math.floor(n / 2);
    out += beschriften(mitte, padL + slot * mitte + slot / 2, "middle");
  }
  out += beschriften(n - 1, W - padR, "end");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Balkendiagramm: Kalorien je Tag">${out}</svg>`;
}

/* ═══════════════ Anbinden ═══════════════ */

function renderEssen() {
  renderEssenTag();
  renderEssenLib();
  renderEssenVerlauf();
}

function essenWischenVerbinden() {
  const tag = $("#screen-food-day");
  if (tag) {
    wischenVerbinden(tag, {
      pane: () => $("#essen-tag-pane"),
      // Nach vorn ist heute Schluss – Essen von morgen trägt niemand ein
      amRand: (r) => r > 0 && istHeute(essenTag),
      blaettern: tagVerschieben,
    });
  }
  const hist = $("#screen-food-hist");
  if (hist) {
    wischenVerbinden(hist, {
      pane: () => $("#essen-hist-pane"),
      amRand: (r) => essenRangeIndex() + r < 0 || essenRangeIndex() + r >= ESSEN_RANGES.length,
      blaettern: essenRangeWechseln,
    });
  }
}

essenWischenVerbinden();
renderEssen();
