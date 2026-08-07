// Lumora – Muskel-Piktogramme
//
// Jedes Symbol zeigt den relevanten Körperteil, der trainierte Muskel ist
// hervorgehoben. Dahinter stecken fünf Grundfiguren – Oberkörper von vorn
// und hinten, Beine von vorn und hinten sowie ein einzelner Arm. Alle
// Gruppen greifen darauf zu, deshalb wirkt die Reihe wie aus einem Guss.
//
// Aufbau einer Figur: erst die Silhouette (--m-haut), darauf die
// Muskelfelder. Das aktive Feld bekommt die Akzentfarbe, die übrigen eine
// Spur dunkler als die Haut – das gibt Zeichnung, ohne dass bei 26 px ein
// Liniengewirr entsteht.
//
// Koordinaten: 0 0 100 100. Die Figur ist bewusst größer als der Rahmen und
// läuft unten hinaus – der runde Rand der Kachel schneidet sie ab. Genau so
// bekommt man bei 26 px noch erkennbare Muskeln statt einer Miniatur.

"use strict";

// Spiegelt die rechte Körperhälfte nach links – hält die Figuren symmetrisch
// und halbiert die Pfadarbeit.
const spiegel = (s) => `${s}<g transform="matrix(-1,0,0,1,100,0)">${s}</g>`;

/* ── Oberkörper: Silhouette (vorn und hinten dieselbe) ───── */

const KOPF = `<ellipse cx="50" cy="15" rx="11.5" ry="12.5"/>
  <path d="M42 25h16v9.5c0 3.5-8 5-8 5s-8-1.5-8-5z"/>`;
// Rumpf: breite Schultern, schmale Taille, Hüfte läuft unten aus dem Bild
const RUMPF = `<path d="M50 29c11 0 18.5 3 22.5 9 2.5 6.5 1 14-1 21.5-2.5 9-4.5 16-5.5 25-1.5 13-1.5 24-1.5 38H35.5c0-14 0-25-1.5-38-1-9-3-16-5.5-25-2-7.5-3.5-15-1-21.5 4-6 11.5-9 22.5-9z"/>`;
// Arme als eigene Glieder mit sichtbarem Abstand – sonst verschmilzt bei
// kleiner Größe alles zu einer Masse.
const ARME = spiegel(`<rect x="74" y="37" width="15.5" height="50" rx="7.75" transform="rotate(6 81.75 62)"/>
  <rect x="77" y="85" width="14" height="44" rx="7" transform="rotate(3 84 107)"/>`);

const OBERKOERPER = KOPF + RUMPF + ARME;

/* ── Oberkörper von vorn ─────────────────────────────────── */

const VORN = {
  haut: OBERKOERPER,
  felder: {
    // Kapuzenmuskel, von vorn nur der Schrägzug Hals → Schulter
    nacken: spiegel(`<path d="M50.5 31c9.5.3 17 2.5 22 7-7-2.5-14-3.8-22-4z"/>`),
    // Deltamuskel: sitzt über Schultergelenk und Armkopf
    schultern: spiegel(`<ellipse cx="75" cy="47" rx="10.5" ry="12.5" transform="rotate(-22 75 47)"/>`),
    // Brustmuskel – zwei getrennte Platten, Spalt am Brustbein
    brust: spiegel(`<path d="M52 38.5c6 .2 11 1.4 15 3.8 3.5 2.2 4.5 6 3 9.5-1.8 4-6.5 6.8-13 7.7-2.5.3-4-.8-5-2.5z"/>`),
    // Gerade Bauchmuskeln
    bauch: `<path d="M40 64h20c2 0 3 1.4 3 3.5V91c0 8-5 12.5-13 15-8-2.5-13-7-13-15V67.5c0-2.1 1-3.5 3-3.5z"/>`,
    // Bizeps
    bizeps: spiegel(`<ellipse cx="81" cy="59" rx="6.5" ry="15" transform="rotate(6 81 59)"/>`),
    // Unterarm – liegt tief; das Symbol schwenkt dafür nach unten
    unterarme: spiegel(`<ellipse cx="84" cy="106" rx="6" ry="16" transform="rotate(3 84 106)"/>`),
    // Herz – nur für Cardio
    herz: `<path d="M50 50c-4-5.5-10.5-4-12 .5-1.8 4.5 1 10 12 17.5 11-7.5 13.8-13 12-17.5-1.5-4.5-8-6-12-.5z"/>`,
  },
  // Zeichnung, die immer bleibt: Bauchraster
  linien: `<path d="M50 41v62M41 76h18M41 85h18M41 94h17"/>`,
};

/* ── Oberkörper von hinten ───────────────────────────────── */

const HINTEN = {
  haut: OBERKOERPER,
  felder: {
    // Kapuzenmuskel: das große Dreieck zwischen Hals und Schulterblättern
    nacken: `<path d="M50 29c9.5.5 17 3.5 22 9-7-.5-13 1-17 4L50 68l-5-26c-4-3-10-4.5-17-4 5-5.5 12.5-8.5 22-9z"/>`,
    // Latissimus: die Flügel unter den Achseln
    ruecken: spiegel(`<path d="M51.5 45c6.5 2 11.5 5.5 14.5 10.5 3.5 6 3 13-1 20.5-4-5.5-8-10-13.5-12.5z"/>`),
    // Hintere Schulter
    schultern: spiegel(`<ellipse cx="75" cy="47" rx="10.5" ry="12.5" transform="rotate(-22 75 47)"/>`),
    // Trizeps: Armrückseite, etwas weiter außen als der Bizeps
    trizeps: spiegel(`<ellipse cx="82.5" cy="61" rx="6.5" ry="15.5" transform="rotate(6 82.5 61)"/>`),
  },
  linien: `<path d="M50 70v28"/>`,
};

/* ── Beine: Silhouette (vorn und hinten dieselbe) ────────── */

// Becken oben, zwei Beine mit Spalt dazwischen, unten aus dem Bild laufend
const BECKEN = `<path d="M25 -20h50c2.5 13 1.5 24-3 31.5-5 8.5-13.5 12.5-22 12.5s-17-4-22-12.5c-4.5-7.5-5.5-18.5-3-31.5z"/>`;
const BEINE = spiegel(`<rect x="51" y="16" width="23" height="56" rx="11.5" transform="rotate(2 62.5 44)"/>
  <rect x="54.5" y="68" width="18" height="52" rx="9" transform="rotate(1 63.5 94)"/>`);
const BEIN_HAUT = BECKEN + BEINE;

const BEINE_VORN = {
  haut: BEIN_HAUT,
  felder: {
    // Vordere Oberschenkel
    quad: spiegel(`<ellipse cx="62.5" cy="42" rx="8.5" ry="21" transform="rotate(2 62.5 42)"/>`),
    // Adduktoren: die Innenseite
    add: spiegel(`<ellipse cx="54.5" cy="46" rx="4.5" ry="18" transform="rotate(4 54.5 46)"/>`),
    // Abduktoren: Hüftaußenseite
    abd: spiegel(`<ellipse cx="72" cy="20" rx="8.5" ry="14" transform="rotate(-20 72 20)"/>`),
  },
  linien: `<path d="M62.5 28v24M37.5 28v24"/>`,
};

const BEINE_HINTEN = {
  haut: BEIN_HAUT,
  felder: {
    // Gesäß
    po: spiegel(`<path d="M51.5 5c6 .2 10.5 2.2 13.5 5.8 2.3 3 2.3 7.5-.5 11-3.2 3.8-8.5 5.5-13 5.7z"/>`),
    // Beinbeuger
    ham: spiegel(`<ellipse cx="62.5" cy="46" rx="8.5" ry="19" transform="rotate(2 62.5 46)"/>`),
    // Waden
    wade: spiegel(`<ellipse cx="63.5" cy="84" rx="7.5" ry="16" transform="rotate(1 63.5 84)"/>`),
  },
  linien: `<path d="M62.5 32v22M37.5 32v22"/>`,
};

const FIGUREN = { vorn: VORN, hinten: HINTEN, beinVorn: BEINE_VORN, beinHinten: BEINE_HINTEN };

// Welche Gruppe zeigt welche Figur, und welches Feld leuchtet?
const MUSKEL_ART = {
  "Brust":       { fig: "vorn",       teil: "brust" },
  "Schultern":   { fig: "vorn",       teil: "schultern" },
  "Bizeps":      { fig: "vorn",       teil: "bizeps" },
  "Bauch":       { fig: "vorn",       teil: "bauch" },
  "Cardio":      { fig: "vorn",       teil: "herz" },
  "Rücken":      { fig: "hinten",     teil: "ruecken" },
  "Nacken":      { fig: "hinten",     teil: "nacken" },
  "Trizeps":     { fig: "hinten",     teil: "trizeps" },
  "Unterarme":   { fig: "vorn",       teil: "unterarme", schieb: 48 },
  "Quadrizeps":  { fig: "beinVorn",   teil: "quad" },
  "Adduktoren":  { fig: "beinVorn",   teil: "add" },
  "Abduktoren":  { fig: "beinVorn",   teil: "abd" },
  "Beinbeuger":  { fig: "beinHinten", teil: "ham" },
  "Po":          { fig: "beinHinten", teil: "po" },
  "Waden":       { fig: "beinHinten", teil: "wade" },
  "Ganzkörper":  { fig: "vorn",       teil: "*" },
};

function muskelSvg(gruppe) {
  const art = MUSKEL_ART[gruppe] || MUSKEL_ART["Ganzkörper"];
  const f = FIGUREN[art.fig];
  // Ganzkörper färbt die ganze Figur ein; die Felder bleiben als dunkle
  // Zeichnung darauf. Alles blau zu fluten ergäbe nur einen Klecks.
  const alles = art.teil === "*";
  const felder = Object.entries(f.felder)
    // Das Herz gehört nur zu Cardio, sonst säße immer eines im Brustkorb
    .filter(([id]) => id !== "herz" || art.teil === "herz")
    .map(([id, d]) => {
      const farbe = alles ? "rgba(9,16,30,0.16)" : id === art.teil ? "var(--m-aktiv)" : "var(--m-feld)";
      return `<g fill="${farbe}">${d}</g>`;
    }).join("");
  // schieb: Bildausschnitt nach unten verlegen (z. B. für den Unterarm,
  // der am vollständigen Oberkörper unten aus dem Rahmen liefe)
  const g = art.schieb ? `<g transform="translate(0,${-art.schieb})">` : "<g>";
  return `<svg viewBox="0 0 100 100" aria-hidden="true" class="muskel-svg">${g}
    <g fill="${alles ? "var(--m-aktiv)" : "var(--m-haut)"}">${f.haut}</g>
    ${felder}
    <g stroke="var(--m-linie)" fill="none" stroke-width="1.7" stroke-linecap="round">${f.linien}</g>
  </g></svg>`;
}
