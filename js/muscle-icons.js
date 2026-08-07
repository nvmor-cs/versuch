// Lumora – Muskel-Piktogramme
//
// Grundlage sind zwei Strichzeichnungen des Körpers (img/koerper-vorn.png und
// koerper-hinten.png, freigestellt auf Transparenz). Sie werden nicht
// nachgezeichnet – für jedes Symbol liegt lediglich eine farbige Fläche unter
// der Zeichnung, genau auf dem trainierten Muskel. Die weißen Linien laufen
// darüber und geben der Fläche ihre Kanten.
//
// Die Flächen sind nicht von Hand gezeichnet, sondern aus der Vorlage
// ausgefüllt: scripts/make-muscle-paths.py setzt einen Saatpunkt in die
// Zelle, flutet bis zur nächsten Linie und schreibt die Kontur nach
// js/muscle-paths.js. Deshalb sitzt jedes Highlight exakt auf dem Muskel.
//
// Der zweite Teil ist der Ausschnitt: Jede Gruppe bringt ihr eigenes viewBox
// mit und zoomt auf ihre Körperregion. Die ganze Figur bei 42 px wäre ein
// Gekritzel – der Ausschnitt zeigt Brust, Bizeps oder Wade groß genug.
//
// Koordinaten sind Bildpunkte der jeweiligen Zeichnung:
//   vorn   493 × 920, Mittelachse x = 246
//   hinten 488 × 920, Mittelachse x = 244

"use strict";

// Cardio hat keinen Muskel in der Zeichnung – dafür ein Herz im Brustkorb,
// in Bildkoordinaten der Vorderansicht.
const HERZ = "M245 212c-18-26-54-18-60 8-7 26 10 54 60 90 50-36 67-64 60-90-6-26-42-34-60-8z";

const FIGUREN = {
  vorn:   { bild: "img/koerper-vorn.png",   breite: 493, hoehe: 920 },
  hinten: { bild: "img/koerper-hinten.png", breite: 488, hoehe: 920 },
};

/* ═══════════════ Gruppe → Figur, Muskel, Ausschnitt ═══════════════ */

// zoom = "x y kante", quadratisch: Die Kachel ist rund, ein anderes
// Seitenverhältnis würde die Figur verzerren.
const MUSKEL_ART = {
  "Brust":      { fig: "vorn",   teil: "brust",     zoom: "130 107 230" },
  "Schultern":  { fig: "vorn",   teil: "schultern", zoom: "83 118 320" },
  "Bizeps":     { fig: "vorn",   teil: "bizeps",    zoom: "50 172 390" },
  "Unterarme":  { fig: "vorn",   teil: "unterarme", zoom: "352 382 140" },
  "Bauch":      { fig: "vorn",   teil: "bauch",     zoom: "124 256 230" },
  "Cardio":     { fig: "vorn",   teil: "herz",      zoom: "130 150 230" },
  "Nacken":     { fig: "hinten", teil: "nacken",    zoom: "139 136 210" },
  "Rücken":     { fig: "hinten", teil: "ruecken",   zoom: "134 222 220" },
  "Trizeps":    { fig: "hinten", teil: "trizeps",   zoom: "84 188 320" },
  "Quadrizeps": { fig: "vorn",   teil: "quad",      zoom: "124 448 240" },
  "Adduktoren": { fig: "vorn",   teil: "add",       zoom: "137 467 210" },
  "Abduktoren": { fig: "vorn",   teil: "abd",       zoom: "151 403 190" },
  "Beinbeuger": { fig: "hinten", teil: "ham",       zoom: "149 504 190" },
  "Po":         { fig: "hinten", teil: "po",        zoom: "149 385 190" },
  "Waden":      { fig: "hinten", teil: "wade",      zoom: "143 657 200" },
  "Ganzkörper": { fig: "vorn",   teil: "*",         zoom: "-223 -10 940" },
};

function muskelSvg(gruppe) {
  const art = MUSKEL_ART[gruppe] || MUSKEL_ART["Ganzkörper"];
  const f = FIGUREN[art.fig];
  const [zx, zy, zk] = art.zoom.split(" ").map(Number);

  const alle = MUSKEL_PFADE[art.fig];
  const flaechen = (art.teil === "*" ? Object.values(alle)
    : art.teil === "herz" ? [HERZ] : [alle[art.teil]])
    .filter(Boolean)
    .map((d) => `<path d="${d}"/>`).join("");

  // Reihenfolge: erst die Farbfläche, dann die Zeichnung darüber – so
  // schneiden die weißen Linien den Muskel sauber ab.
  return `<svg viewBox="${zx} ${zy} ${zk} ${zk}" aria-hidden="true" class="muskel-svg">
    <g fill="var(--m-aktiv)">${flaechen}</g>
    <image href="${f.bild}" x="0" y="0" width="${f.breite}" height="${f.hoehe}"/>
  </svg>`;
}
