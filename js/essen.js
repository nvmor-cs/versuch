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
    /* Tagesziele. Die Kalorien sind die Zahl, die man setzt; die Nährstoffe
       hängen als Anteil daran. Wer die Kalorien ändert, will nicht auch noch
       drei Gramm-Zahlen nachrechnen – 30 % Eiweiß bleiben 30 % Eiweiß.
       Gerundet wird auf volle Gramm; dass 30/40/30 dadurch nicht exakt die
       Kalorienzahl ergeben, ist der Preis und in Kauf genommen. */
    ziele: { kcal: 2200, eiweissP: 30, khP: 40, fettP: 30 },
    // Eigene Lebensmittel und alles, was schon einmal aus der Datenbank
    // geholt wurde. Was hier steht, funktioniert ohne Netz.
    lebensmittel: [],
    // Tagebuch: { "2026-08-12": [ { id, lmId, mahlzeit, menge } ] }
    tage: {},
  };
}

// Aus der ersten Fassung: feste Gramm-Ziele. Daraus die Anteile ausrechnen,
// dann steht der Nutzer nach dem Update vor seinen gewohnten Zahlen.
function migriereZiele(z) {
  if (!z || z.eiweissP !== undefined) return;
  const kcal = z.kcal > 0 ? z.kcal : 2200;
  const anteil = (gramm, proKcal) =>
    Math.round(((Number(gramm) || 0) * proKcal * 100) / kcal);
  z.eiweissP = anteil(z.eiweiss, 4);
  z.khP = anteil(z.kh, 4);
  z.fettP = anteil(z.fett, 9);
  // Summe glattziehen, damit nicht 97 % dastehen
  const rest = 100 - z.eiweissP - z.khP - z.fettP;
  z.khP = Math.max(0, z.khP + rest);
  delete z.eiweiss; delete z.kh; delete z.fett;
}

function ladeEssen() {
  let e = defaultEssen();
  try {
    const raw = localStorage.getItem(LS_ESSEN);
    if (raw) {
      const p = JSON.parse(raw);
      // Erst umrechnen, dann auffüllen: Andersherum stünden die Anteile aus
      // den Standardwerten schon da, und die Umrechnung hielte den
      // Altbestand für längst erledigt.
      migriereZiele(p.ziele);
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

// Kalorien je Gramm – die üblichen Faustzahlen
const PRO_GRAMM = { eiweiss: 4, kh: 4, fett: 9 };

// Das Tagesziel eines Nährstoffs in Gramm, aus Kalorien und Anteil.
// Volle Gramm, wie gewünscht – die Rundung nehmen wir in Kauf.
function zielGramm(art) {
  const z = ESSEN.ziele;
  const p = Number(z[art + "P"]) || 0;
  return Math.round(((Number(z.kcal) || 0) * p) / 100 / PRO_GRAMM[art]);
}

const zieleGramm = () => ({
  kcal: Number(ESSEN.ziele.kcal) || 0,
  eiweiss: zielGramm("eiweiss"),
  kh: zielGramm("kh"),
  fett: zielGramm("fett"),
});

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

// Die deutsche Adresse liefert deutsche Namen und deutsche Produkte zuerst;
// die internationale ist der Ausweichweg, wenn sie klemmt.
const OFF_HOST_DE = "https://de.openfoodfacts.org";
const OFF_HOST_WELT = "https://world.openfoodfacts.org";
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

/* Anfragen an OFF sind der wackeligste Teil der Ernährung: fremder Server,
   Mobilfunk, und die Volltextsuche dort ist bekanntermaßen langsam. Deshalb
   drei Vorkehrungen statt einer:

   * großzügige Frist (20 s) – lieber warten als grundlos aufgeben,
   * ein zweiter Versuch über die internationale Adresse, wenn die deutsche
     nicht antwortet oder mit 429 (zu viele Anfragen) abwinkt,
   * ein Gedächtnis: Jede Antwort wird zum Suchbegriff gemerkt. Wer ein
     Zeichen löscht und wieder tippt, fragt nicht erneut an. */

const OFF_FRIST = 20000;
const offErinnerung = new Map();   // Suchbegriff → Treffer

async function einAnfrage(url, signal) {
  const uhr = setTimeout(() => steuerAbbrechen(signal), OFF_FRIST);
  try {
    const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!res.ok) {
      const e = new Error("HTTP " + res.status);
      e.status = res.status;
      throw e;
    }
    return await res.json();
  } finally {
    clearTimeout(uhr);
  }
}

// Der AbortController hängt am Signal – so kommt die Frist an ihn heran
const steuerZuSignal = new WeakMap();
function steuerAbbrechen(signal) {
  const st = steuerZuSignal.get(signal);
  if (st) st.abort();
}

async function offAnfrage(pfad) {
  if (offAbbruch) offAbbruch.abort();
  const steuer = new AbortController();
  offAbbruch = steuer;
  steuerZuSignal.set(steuer.signal, steuer);

  // Die Suche bei OFF ist auf wenige Anfragen pro Minute begrenzt. Ein
  // Mindestabstand ist keine Bremse, sondern Anstand.
  const warten = Math.max(0, 1000 - (Date.now() - offLetzte));
  if (warten) await new Promise((r) => setTimeout(r, warten));
  if (steuer.signal.aborted) throw abbruchFehler();
  offLetzte = Date.now();

  try {
    return await einAnfrage(OFF_HOST_DE + pfad, steuer.signal);
  } catch (e) {
    if (e && e.name === "AbortError" && !steuer.signal.aborted) {
      // Nicht der Nutzer war es, sondern die Frist
    } else if (steuer.signal.aborted) {
      throw e;   // eine neue Suche hat übernommen
    }
    // Zweiter Anlauf über die internationale Adresse
    offLetzte = Date.now();
    return einAnfrage(OFF_HOST_WELT + pfad, steuer.signal);
  }
}

const istBarcode = (q) => /^\d{8,14}$/.test(q.trim());

// Ein einzelnes Produkt über seine Nummer – der Weg des Scanners und der
// eingetippten Ziffernfolge
async function offProdukt(code) {
  const d = await offAnfrage(`/api/v2/product/${encodeURIComponent(code)}.json?fields=${OFF_FELDER}`);
  return d && d.status === 1 ? ausOff(d.product) : null;
}

async function offSuchen(begriff) {
  const q = begriff.trim();
  if (!q) return [];
  if (offErinnerung.has(q)) return offErinnerung.get(q);
  let treffer;
  if (istBarcode(q)) {
    const lm = await offProdukt(q);
    treffer = lm ? [lm] : [];
  } else {
    const pfad = `/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process`
      + `&json=1&page_size=24&lc=de&fields=${OFF_FELDER}`;
    const d = await offAnfrage(pfad);
    const roh = Array.isArray(d && d.products) ? d.products : [];
    treffer = roh.map(ausOff).filter(Boolean).slice(0, 20);
  }
  offErinnerung.set(q, treffer);
  return treffer;
}

/* ═══════════════ Reiter „Heute" ═══════════════ */

let essenTag = tagKey(Date.now());
/* Welcher Tag „heute" war, als zuletzt gezeichnet wurde. Die App liegt oft
   tagelang im Hintergrund, ohne neu zu starten – ohne das stünde man am
   nächsten Morgen weiter auf dem gestrigen Tagebuch, trüge dort ein und
   suchte den Eintrag vergeblich unter „Heute". */
let letztesHeute = tagKey(Date.now());

const istHeute = (key) => key === tagKey(Date.now());

function tagesWechselPruefen() {
  const heute = tagKey(Date.now());
  if (heute === letztesHeute) return;
  // Nur mitwandern, wer auf dem bisherigen Heute stand – wer bewusst
  // zurückgeblättert hat, bleibt, wo er ist.
  const mitwandern = essenTag === letztesHeute;
  letztesHeute = heute;
  if (mitwandern) essenTag = heute;
  renderEssen();
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") tagesWechselPruefen();
});

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
  const z = zieleGramm();
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

/* Ein Blatt für „wie viel davon?" – beim Hinzufügen wie beim Ändern.
 *
 * Das Feld ist der Hauptweg: hineintippen, wie viel es waren, und darunter
 * stehen Kalorien und Nährstoffe sofort da – ausgerechnet aus den Werten je
 * 100 g. Die Plus/Minus-Knöpfe sind nur die Abkürzung für „ungefähr so viel";
 * wer die Packung abgewogen hat, tippt die Zahl.
 *
 * Beim Antippen wird der Inhalt markiert: Man will die vorgeschlagene Menge
 * ersetzen, nicht hinter ihr weiterschreiben.
 */
function mengeSheet(lm, menge, mahlzeit, fertig) {
  if (!lm) return;
  let m = Number(menge) || 0;
  const e = lm.einheit;
  const je100 = `Je 100 ${e}: ${Math.round(lm.kcal)} kcal · E ${fmtKg(lm.eiweiss)} g `
    + `· KH ${fmtKg(lm.kh)} g · F ${fmtKg(lm.fett)} g`;

  const bd = openSheet(`
    <div class="sheet-title">${esc(lm.name)}
      <button class="icon-btn plain" data-action="close-sheet" aria-label="Schließen">${icon("x")}</button>
    </div>
    ${lm.marke ? `<p class="hint" style="margin:-6px 2px 10px">${esc(lm.marke)}</p>` : ""}
    <div class="stepper-group">
      <div class="stepper-label">Wie viel hast du gegessen? (${e})</div>
      <div class="stepper">
        <button class="stepper-btn" data-m="-1" aria-label="weniger">−</button>
        <input class="stepper-val" type="text" inputmode="decimal" id="menge-feld"
               value="${esc(String(fmtKg(m)))}" aria-label="Menge in ${e}">
        <button class="stepper-btn" data-m="1" aria-label="mehr">+</button>
      </div>
    </div>
    ${lm.portion ? `<button class="btn btn-soft btn-compact" data-p="1" style="margin-bottom:10px">
      1 ${esc(lm.portion.name)} = ${fmtKg(lm.portion.gramm)} ${e}</button>` : ""}
    <div class="werte-gitter" id="menge-werte"></div>
    <p class="hint" style="margin:-6px 2px 14px">${esc(je100)}</p>
    <div class="settings-row">
      <div class="lbl">Mahlzeit</div>
      <select id="mz-feld">
        ${MAHLZEITEN.map((x) => `<option value="${x.id}" ${x.id === (mahlzeit || "fr") ? "selected" : ""}>${x.label}</option>`).join("")}
      </select>
    </div>
    <div class="sheet-fuss">
      <button class="btn" data-ok="1">${icon("check")} Übernehmen</button>
    </div>`, { fest: true });

  const feld = bd.querySelector("#menge-feld");
  const gitter = bd.querySelector("#menge-werte");

  // Nur die Zahlen neu schreiben, nicht das ganze Blatt – sonst verlöre das
  // Feld beim Tippen Fokus und Cursor.
  const werteZeigen = () => {
    const f = m / 100;
    gitter.innerHTML = [
      ["kcal", Math.round((lm.kcal || 0) * f)],
      ["Eiweiß", Math.round((lm.eiweiss || 0) * f) + " g"],
      ["KH", Math.round((lm.kh || 0) * f) + " g"],
      ["Fett", Math.round((lm.fett || 0) * f) + " g"],
    ].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join("");
  };
  werteZeigen();

  const setzen = (wert) => {
    m = Math.max(0, wert);
    feld.value = String(fmtKg(m));
    werteZeigen();
  };

  feld.addEventListener("input", () => {
    const v = parseNum(feld.value);
    m = Number.isFinite(v) && v > 0 ? v : 0;
    werteZeigen();
  });
  feld.addEventListener("focus", () => feld.select());

  bd.addEventListener("click", (ev) => {
    const stufe = ev.target.closest("[data-m]");
    if (stufe) {
      // Kleine Mengen in 5er-Schritten, große in 10er – Öl zählt man anders
      // als Reis. Gesprungen wird auf das nächste Vielfache in der Richtung
      // des Knopfes: Von 75 führt „+" nach 80 und nicht nach 90.
      const schritt = m < 50 ? 5 : 10;
      setzen(+stufe.dataset.m > 0
        ? (Math.floor(m / schritt) + 1) * schritt
        : Math.max(0, (Math.ceil(m / schritt) - 1) * schritt));
      return;
    }
    if (ev.target.closest("[data-p]")) { setzen(lm.portion.gramm); return; }
    if (ev.target.closest("[data-ok]")) {
      const v = parseNum(feld.value);
      if (Number.isFinite(v) && v > 0) m = v;
      if (!(m > 0)) { toast("Trag erst eine Menge ein"); return; }
      const sel = bd.querySelector("#mz-feld");
      bd.remove();
      fertig(m, sel ? sel.value : mahlzeit || "fr");
    }
  });
}

/* ═══════════════ Reiter „Lebensmittel" ═══════════════ */

let lmSuche = "";
let lmTreffer = [];        // aus der Datenbank
let lmStatus = "";         // Hinweiszeile über den Treffern
let lmSuchTimer = null;
let lmLetzteSuche = "";    // wofür „Nochmal versuchen" gilt
let lmFehler = false;

/* Die Liste war eine einzige, alphabetisch sortierte Reihe – und bei 40
   Einträgen abgeschnitten. Mit 76 Grundnahrungsmitteln fiel damit ein frisch
   angelegtes „Selbstgemacht" hinten heraus und war schlicht unsichtbar.

   Jetzt in Gruppen: Zuletzt benutztes zuerst (das ist beim Essen fast immer
   das Richtige), dann die eigenen Lebensmittel – beide vollständig, da wird
   nichts abgeschnitten –, dann der Grundvorrat. Wird gesucht, fallen die
   Gruppen zusammen; ein Suchbegriff grenzt schon genug ein. */

const passtAuf = (l, s) => !s || (l.name + " " + (l.marke || "")).toLowerCase().includes(s);
const nachName = (a, b) => a.name.localeCompare(b.name, "de");

function lmGruppen(q) {
  const s = q.trim().toLowerCase();
  const alle = alleLebensmittel().filter((l) => passtAuf(l, s));
  if (s) {
    // Bei einer Suche: eigene zuerst, dann zuletzt benutzte, dann der Rest
    const sortiert = alle.slice().sort((a, b) =>
      (b.quelle === "eigen") - (a.quelle === "eigen")
      || (b.benutzt || 0) - (a.benutzt || 0)
      || nachName(a, b));
    return [{ titel: "Deine Liste", eintraege: sortiert.slice(0, 40) }];
  }
  const benutzt = alle.filter((l) => l.benutzt)
    .sort((a, b) => (b.benutzt || 0) - (a.benutzt || 0)).slice(0, 12);
  const drin = new Set(benutzt.map((l) => l.id));
  const eigen = alle.filter((l) => l.quelle === "eigen" && !drin.has(l.id)).sort(nachName);
  eigen.forEach((l) => drin.add(l.id));
  const rest = alle.filter((l) => !drin.has(l.id)).sort(nachName);
  return [
    { titel: "Zuletzt benutzt", eintraege: benutzt },
    { titel: "Eigene Lebensmittel", eintraege: eigen },
    { titel: "Grundvorrat", eintraege: rest },
  ].filter((g) => g.eintraege.length);
}

function renderEssenLib() {
  const host = $("#screen-food-lib");
  if (!host) return;
  host.innerHTML = `
    <div class="screen-head">
      <div class="screen-title">Lebensmittel</div>
      <button class="icon-btn" data-action="essen-neu" aria-label="Eigenes Lebensmittel">${icon("plus")}</button>
    </div>
    <div class="such-zeile">
      <div class="search-wrap">${icon("search")}
        <input class="search-input" data-input="lm-suche" value="${esc(lmSuche)}" placeholder="Suchen oder Barcode eintippen …" autocomplete="off">
      </div>
      ${scannerMoeglich() ? `<button class="icon-btn scan-btn" data-action="essen-scannen" aria-label="Barcode scannen">${icon("barcode")}</button>` : ""}
    </div>
    <div id="lm-liste">${lmListe()}</div>`;
}

function lmListe() {
  const gruppen = lmGruppen(lmSuche);
  return `
    ${gruppen.length ? gruppen.map((g) => `
      <div class="section-label">${g.titel}</div>
      ${g.eintraege.map((l) => lmZeile(l)).join("")}`).join("")
      : `<p class="hint">Nichts gefunden. Such unten in der Datenbank oder leg dir das Lebensmittel selbst an.</p>`}
    <div class="section-label">Open Food Facts</div>
    ${lmStatus ? `<p class="hint">${esc(lmStatus)}</p>` : ""}
    ${lmFehler ? `<button class="btn btn-ghost btn-compact" data-action="essen-nochmal" style="margin-bottom:8px">
      ${icon("history")} Nochmal versuchen</button>` : ""}
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

/* Eine Suche für beide Orte: den Reiter „Lebensmittel" und das Vollbild, das
   aus einer Mahlzeit heraus aufgeht. Vorher stand das zweimal fast gleich da –
   und ging zweimal fast gleich schief. */
function lmListenZeichnen() {
  const html = lmListe();
  const a = $("#lm-liste"), b = $("#lm-liste-ov");
  if (a) a.innerHTML = html;
  if (b) b.innerHTML = html;
}

function lmSucheSetzen(wert) {
  lmSuche = wert;
  clearTimeout(lmSuchTimer);
  const q = wert.trim();
  if (q.length < 3 && !istBarcode(q)) {
    lmTreffer = [];
    lmStatus = q ? "Noch zu kurz – ab drei Zeichen wird gesucht." : "Tippe, um in der Datenbank zu suchen.";
    lmListenZeichnen();
    return;
  }
  lmFehler = false;
  lmStatus = "Wird gesucht …";
  lmListenZeichnen();
  // Etwas mehr Ruhe als beim Tippen üblich: Die Datenbank begrenzt Anfragen,
  // und jeder Tastendruck eine eigene zu schicken wäre sinnlos wie unhöflich.
  lmSuchTimer = setTimeout(() => lmSucheAusfuehren(q), 700);
}

async function lmSucheAusfuehren(q) {
  lmLetzteSuche = q;
  if (navigator.onLine === false) {
    lmTreffer = [];
    lmStatus = "Kein Netz – gesucht wird nur in deiner Liste.";
    lmListenZeichnen();
    return;
  }
  lmStatus = "Wird gesucht …";
  lmListenZeichnen();
  try {
    lmTreffer = await offSuchen(q);
    lmTreffer.forEach((l) => offCache.set(l.id, l));
    lmStatus = lmTreffer.length ? "" : "Nichts gefunden. Vielleicht als eigenes Lebensmittel anlegen?";
  } catch (err) {
    if (err && err.name === "AbortError") return;   // eine neue Suche hat übernommen
    lmTreffer = [];
    // Den Grund nennen: Bei „zu viele Anfragen" hilft Warten, bei allem
    // anderen ein zweiter Versuch – das ist ein Unterschied.
    lmStatus = err && err.status === 429
      ? "Die Datenbank bremst gerade (zu viele Anfragen). Gleich nochmal versuchen."
      : "Die Datenbank antwortet nicht. Prüf die Verbindung – oder versuch es erneut.";
    lmFehler = true;
  }
  lmListenZeichnen();
}

ACTIONS["essen-nochmal"] = () => {
  const q = (lmLetzteSuche || lmSuche || "").trim();
  if (!q) return;
  offErinnerung.delete(q);
  lmFehler = false;
  lmSucheAusfuehren(q);
};

INPUTS["lm-suche"] = (el) => lmSucheSetzen(el.value);
INPUTS["lm-suche-ov"] = (el) => lmSucheSetzen(el.value);

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
  mengeSheet(lm, lm.portion ? lm.portion.gramm : 100, mahlzeit || vorschlagMahlzeit(),
    (menge, mz) => eintragen(lm, menge, mz));
}

/* Der eine Weg ins Tagebuch – egal ob über die Liste, den Scanner oder das
   Formular. Das Lebensmittel wandert dabei in die eigene Liste: ab dann ist
   es auch ohne Netz da und steht ganz oben unter „Zuletzt benutzt". */
function eintragen(lm, menge, mahlzeit) {
  lmMerken(Object.assign({}, lm, { benutzt: Date.now() }));
  const liste = ESSEN.tage[essenTag] || (ESSEN.tage[essenTag] = []);
  liste.push({ id: uid(), lmId: lm.id, mahlzeit, menge });
  speichereEssen();
  tippen(true);
  toast("Eingetragen");
  // Die Suche hat ihren Zweck erfüllt und darf aus dem Weg
  $(".essen-ov")?.remove();
  renderEssenTag();
  renderEssenLib();
  renderEssenVerlauf();
  // Ans Ziel bringen: Wer etwas einträgt, will sehen, dass es angekommen ist
  currentBereich = "essen";
  currentTab = "food-day";
  letzterTab.essen = "food-day";
  render();
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
    <div class="such-zeile">
      <div class="search-wrap">${icon("search")}
        <input class="search-input" data-input="lm-suche-ov" placeholder="Suchen oder Barcode eintippen …" autocomplete="off">
      </div>
      ${scannerMoeglich() ? `<button class="icon-btn scan-btn" data-action="essen-scannen" aria-label="Barcode scannen">${icon("barcode")}</button>` : ""}
    </div>
    <div id="lm-liste-ov"></div>`, "essen-ov");
  ov.dataset.mz = mz;
  lmListenZeichnen();
  const feld = ov.querySelector("input");
  if (feld) setTimeout(() => feld.focus(), 60);
};

ACTIONS["essen-suche-zu"] = () => { $(".essen-ov")?.remove(); };

/* ── Barcode scannen ──────────────────────────────────────
   Ohne zusätzliche Bibliothek: Die Kamera liefert Bilder, und das System
   liest den Code – Android bringt dafür seit Jahren einen Erkenner mit
   (BarcodeDetector). Das spart eine halbe Megabyte fremden Code und ist
   schneller als alles, was in JavaScript nachgebaut wäre.

   Wo es das nicht gibt, sagt die App es klar und lässt einen die Ziffern
   eintippen – die stehen ja unter jedem Strichcode. */

const BARCODE_FORMATE = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "itf"];

const scannerMoeglich = () =>
  typeof window.BarcodeDetector === "function"
  && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

let scanner = null;   // { strom, halt }

ACTIONS["essen-scannen"] = () => scannerOeffnen();

async function scannerOeffnen() {
  if (!scannerMoeglich()) {
    toast("Dieses Gerät kann keine Codes lesen – tipp die Ziffern ein");
    return;
  }
  const ov = openOverlay(`
    <div class="scan-buehne">
      <video id="scan-video" playsinline muted autoplay></video>
      <div class="scan-rahmen"><span></span></div>
      <p class="scan-hinweis" id="scan-hinweis">Halte den Strichcode in den Rahmen</p>
      <button class="btn btn-ghost" data-action="essen-scan-zu" style="max-width:280px">Abbrechen</button>
    </div>`, "scan-ov");
  ov.zurueck = () => scannerSchliessen();

  const video = $("#scan-video");
  let strom = null;
  try {
    strom = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
      audio: false,
    });
  } catch (e) {
    scannerSchliessen();
    // Die häufigste Ursache ist eine abgelehnte Kamerafreigabe – das ist
    // etwas anderes als „geht nicht" und gehört auch so gesagt.
    toast(e && e.name === "NotAllowedError"
      ? "Ohne Kamerafreigabe geht es nicht – in den Android-Einstellungen erlauben"
      : "Die Kamera lässt sich nicht öffnen");
    return;
  }
  if (!$(".scan-ov")) {   // in der Zwischenzeit abgebrochen
    strom.getTracks().forEach((t) => t.stop());
    return;
  }
  // Ab hier hält die App die Kamera. Was jetzt noch schiefgeht, darf sie
  // nicht mit sich reißen – eine offene Kamera hinter einem geschlossenen
  // Bild ist das Unangenehmste, was diese Funktion anrichten kann.
  scanner = { strom, halt: false };
  let leser;
  try {
    video.srcObject = strom;
    // Bewusst ohne Warten: Auf manchen Geräten wird dieses Versprechen nie
    // eingelöst, und dann liefe der Scanner gar nicht erst los. Ist das Bild
    // noch nicht da, scheitert die erste Erkennung – und die nächste kommt
    // 220 ms später von allein.
    video.play().catch(() => {});
    try {
      leser = new window.BarcodeDetector({ formats: BARCODE_FORMATE });
    } catch (_) {
      leser = new window.BarcodeDetector();
    }
  } catch (e) {
    scannerSchliessen();
    toast("Das Kamerabild lässt sich nicht anzeigen");
    return;
  }
  const suchen = async () => {
    if (!scanner || scanner.halt || !$(".scan-ov")) return;
    try {
      const codes = await leser.detect(video);
      const code = codes && codes.find((c) => /^\d{8,14}$/.test(c.rawValue || ""));
      if (code) {
        scanner.halt = true;
        tippen(true);
        scannerSchliessen();
        barcodeVerarbeiten(code.rawValue);
        return;
      }
    } catch (_) {
      // Einzelne Bilder scheitern immer mal – das ist kein Grund aufzuhören
    }
    setTimeout(suchen, 220);
  };
  suchen();
}

function scannerSchliessen() {
  if (scanner) {
    scanner.halt = true;
    scanner.strom.getTracks().forEach((t) => t.stop());
    scanner = null;
  }
  $(".scan-ov")?.remove();
}

ACTIONS["essen-scan-zu"] = () => scannerSchliessen();

/* Nach dem Scan: erst in der eigenen Liste nachsehen (geht ohne Netz und ist
   sofort da), sonst bei der Datenbank nachfragen. */
async function barcodeVerarbeiten(code) {
  const mahlzeit = ($(".essen-ov") || { dataset: {} }).dataset.mz;
  const bekannt = alleLebensmittel().find((l) => l.barcode === code);
  if (bekannt) {
    lmHinzufuegen(bekannt, mahlzeit);
    return;
  }
  if (navigator.onLine === false) {
    toast("Kein Netz – der Code " + code + " ist noch nicht in deiner Liste");
    return;
  }
  toast("Code " + code + " – wird nachgeschlagen …");
  try {
    const lm = await offProdukt(code);
    if (lm) {
      offCache.set(lm.id, lm);
      // Direkt zur Menge: Nach dem Scannen weiß man, was man hat – die Frage
      // ist nur noch, wie viel davon. Ein Blatt weniger auf dem Weg.
      lmHinzufuegen(lm, mahlzeit);
    } else {
      // Das kommt vor: Die Datenbank lebt von Beiträgen und kennt längst
      // nicht jede Packung.
      unbekannterCode(code, mahlzeit);
    }
  } catch (_) {
    toast("Die Datenbank antwortet nicht – versuch es gleich nochmal");
  }
}

async function unbekannterCode(code, mahlzeit) {
  if (await appConfirm(
    `Den Code ${code} kennt Open Food Facts nicht. Das Lebensmittel selbst anlegen?`,
    { ok: "Anlegen", cancel: "Abbrechen" })) {
    lmFormular(null, { barcode: code, mahlzeit });
  }
}

/* ── Eigenes Lebensmittel anlegen und bearbeiten ─────────── */

ACTIONS["essen-neu"] = () => lmFormular(null);

function lmFormular(vorlage, opt) {
  // Ein angepasstes Grundnahrungsmittel behält seine Kennung: Damit bleiben
  // alte Einträge im Tagebuch gültig und zeigen ab jetzt die neuen Werte.
  const o = opt || {};
  const l = vorlage
    ? Object.assign({}, vorlage, { quelle: "eigen" })
    : { id: "e-" + uid(), name: "", marke: "", quelle: "eigen", einheit: "g",
        kcal: 0, eiweiss: 0, kh: 0, fett: 0, portion: null,
        // Nach einem Scan bleibt der Code am Lebensmittel hängen – beim
        // nächsten Mal wird es dann ohne Netz sofort gefunden.
        barcode: o.barcode || undefined };
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
    <div class="section-label">Gleich eintragen</div>
    <p class="hint" style="margin:-4px 2px 10px">Optional: Wie viel hast du davon gegessen? Leer lassen,
      wenn du die Werte nur speichern willst.</p>
    <div class="feld-zwei">
      <div class="field">
        <label for="lf-menge">Menge</label>
        <input id="lf-menge" data-f="menge" type="text" inputmode="decimal" placeholder="z. B. 150" autocomplete="off">
      </div>
      <div class="field">
        <label for="lf-mahlzeit">Mahlzeit</label>
        <select id="lf-mahlzeit" data-f="mahlzeit">
          ${MAHLZEITEN.map((x) => `<option value="${x.id}" ${x.id === (o.mahlzeit || vorschlagMahlzeit()) ? "selected" : ""}>${x.label}</option>`).join("")}
        </select>
      </div>
    </div>
    <p class="hint" id="lf-vorschau" style="margin:-6px 2px 12px"></p>
    <div class="sheet-fuss">
      <button class="btn" data-speichern="1">${icon("check")} Speichern</button>
    </div>
  `, { fest: true });
  // Vorschau: Sobald Werte und Menge dastehen, zeigt die Zeile, was das ergibt
  const v = (k) => (bd.querySelector(`[data-f="${k}"]`) || {}).value || "";
  const vorschau = () => {
    const zeile = bd.querySelector("#lf-vorschau");
    if (!zeile) return;
    const menge = parseNum(v("menge"));
    const kcal = parseNum(v("kcal"));
    if (!(menge > 0) || !Number.isFinite(kcal)) { zeile.textContent = ""; return; }
    const f = menge / 100;
    const g = (k) => Math.round((parseNum(v(k)) || 0) * f);
    zeile.textContent = `${fmtKg(menge)} ${v("einheit") === "ml" ? "ml" : "g"} = `
      + `${Math.round(kcal * f)} kcal · E ${g("eiweiss")} g · KH ${g("kh")} g · F ${g("fett")} g`;
  };
  bd.addEventListener("input", vorschau);
  bd.addEventListener("change", vorschau);

  bd.querySelector("[data-speichern]").addEventListener("click", () => {
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

    // Steht eine Menge im Formular, wandert sie gleich ins Tagebuch – dann
    // spart man sich den Umweg über Liste, Antippen, Hinzufügen.
    const menge = parseNum(v("menge"));
    if (Number.isFinite(menge) && menge > 0) {
      eintragen(neu, menge, v("mahlzeit") || vorschlagMahlzeit());
      return;
    }
    toast("Gespeichert");
    // Direkt nach einem Scan will man es auch eintragen, nicht nur anlegen
    if (o.barcode) lmHinzufuegen(neu, o.mahlzeit);
  });
}

/* ── Tagesziele ────────────────────────────────────────────
   Die Kalorien sind die eine Zahl, die man setzt. Die drei Nährstoffe hängen
   als Anteil daran – 30 % Eiweiß bleiben 30 % Eiweiß, egal ob man auf 1800
   oder 2600 kcal geht. Die Gramm-Zahl steht live darunter, damit man nicht
   im Kopf rechnen muss.

   Die Anteile müssen zusammen 100 % ergeben. Statt beim Speichern zu meckern,
   zieht die App die Differenz von den Kohlenhydraten ab: Sie sind der Posten,
   den man üblicherweise auffüllt, nachdem Eiweiß und Fett stehen. Wer die
   Kohlenhydrate selbst anfasst, bekommt die Differenz beim Fett abgezogen. */

const ZIEL_ARTEN = [
  { k: "eiweiss", label: "Eiweiß" },
  { k: "kh", label: "Kohlenhydrate" },
  { k: "fett", label: "Fett" },
];

ACTIONS["essen-ziele"] = () => {
  const stand = {
    kcal: Number(ESSEN.ziele.kcal) || 0,
    eiweiss: Number(ESSEN.ziele.eiweissP) || 0,
    kh: Number(ESSEN.ziele.khP) || 0,
    fett: Number(ESSEN.ziele.fettP) || 0,
  };
  const bd = openSheet("", { fest: true });

  // Nach einer Änderung die restlichen Anteile so nachziehen, dass die Summe
  // wieder 100 ergibt – zuerst am Ausgleichsposten, dann am dritten Wert.
  const ausgleichen = (geaendert) => {
    stand[geaendert] = Math.max(0, Math.min(100, Math.round(stand[geaendert])));
    const reihe = geaendert === "kh" ? ["fett", "eiweiss"] : ["kh", "fett", "eiweiss"];
    for (const k of reihe) {
      if (k === geaendert) continue;
      const fehlt = 100 - (stand.eiweiss + stand.kh + stand.fett);
      if (!fehlt) break;
      stand[k] = Math.max(0, stand[k] + fehlt);
    }
  };

  const zeichne = () => {
    const summeP = stand.eiweiss + stand.kh + stand.fett;
    const gramm = (k) => Math.round((stand.kcal * stand[k]) / 100 / PRO_GRAMM[k]);
    bd.querySelector(".sheet").innerHTML = `
      <div class="sheet-grip"></div>
      <div class="sheet-title">Tagesziele
        <button class="icon-btn plain" data-action="close-sheet" aria-label="Schließen">${icon("x")}</button>
      </div>
      <div class="field">
        <label for="z-kcal">Kalorien am Tag</label>
        <input id="z-kcal" data-kcal="1" type="text" inputmode="numeric" value="${stand.kcal}">
      </div>
      <div class="section-label" style="margin-top:14px">Verteilung</div>
      ${ZIEL_ARTEN.map(({ k, label }) => `
        <div class="ziel-zeile">
          <div class="ziel-kopf">
            <span>${label} <em>in %</em></span>
            <b>${gramm(k)} g</b>
          </div>
          <div class="stepper">
            <button class="stepper-btn" data-p="${k}" data-d="-1" aria-label="${label} verringern">−</button>
            <input class="stepper-val" data-pv="${k}" type="text" inputmode="numeric" value="${stand[k]}" aria-label="${label} in Prozent">
            <button class="stepper-btn" data-p="${k}" data-d="1" aria-label="${label} erhöhen">+</button>
          </div>
        </div>`).join("")}
      <p class="hint ${summeP === 100 ? "" : "warn-text"}" style="margin:2px 2px 14px">
        ${summeP === 100
          ? `Summe 100 % · ${gramm("eiweiss") * 4 + gramm("kh") * 4 + gramm("fett") * 9} kcal nach Rundung auf volle Gramm`
          : `Summe ${summeP} % – wird beim Ändern automatisch auf 100 % gebracht`}
      </p>
      <div class="sheet-fuss">
        <button class="btn" data-ziele="1">${icon("check")} Speichern</button>
      </div>`;
  };
  zeichne();

  const kcalLesen = () => {
    const el = bd.querySelector("[data-kcal]");
    const n = parseInt(el ? el.value : "", 10);
    if (Number.isFinite(n) && n >= 0) stand.kcal = n;
  };

  bd.addEventListener("input", (e) => {
    if (e.target.matches("[data-kcal]")) { kcalLesen(); zeichne(); bd.querySelector("[data-kcal]").focus(); }
  });

  bd.addEventListener("click", (e) => {
    const stufe = e.target.closest("[data-p]");
    if (stufe) {
      kcalLesen();
      stand[stufe.dataset.p] += 5 * +stufe.dataset.d;
      ausgleichen(stufe.dataset.p);
      zeichne();
      return;
    }
    if (e.target.closest("[data-ziele]")) {
      kcalLesen();
      const feld = (k) => {
        const el = bd.querySelector(`[data-pv="${k}"]`);
        const n = parseInt(el ? el.value : "", 10);
        if (Number.isFinite(n) && n >= 0) stand[k] = n;
      };
      ZIEL_ARTEN.forEach(({ k }) => feld(k));
      ausgleichen("eiweiss");
      ESSEN.ziele = {
        kcal: stand.kcal, eiweissP: stand.eiweiss, khP: stand.kh, fettP: stand.fett,
      };
      speichereEssen();
      bd.remove();
      renderEssenTag();
      renderEssenVerlauf();
      toast("Ziele gespeichert");
    }
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
  const z = zieleGramm();
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
