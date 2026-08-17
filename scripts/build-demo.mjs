// Baut die ganze App in eine einzige HTML-Datei – zum Ausprobieren im Browser,
// ohne Installation und ohne Server.
//
// Nur zwei Dinge unterscheiden die Demo von der App:
//
// * Der Speicher liegt im Arbeitsspeicher statt in localStorage. Jeder Neuladen
//   startet damit bei null – genau richtig, um die Einführung und den Coach
//   mehrmals durchzuspielen. Nebenbei läuft die Datei so auch dort, wo
//   localStorage gesperrt ist.
// * Kein Service Worker, kein Manifest: Es gibt nichts nachzuladen.
//
// Ausgegeben wird ein Fragment ohne <html>/<head>/<body> – so lässt es sich
// direkt einbetten.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lies = (p) => readFileSync(join(root, p), "utf8");

const SKRIPTE = [
  "js/i18n.js", "js/exercises.js", "js/muscle-paths.js", "js/muscle-icons.js",
  "js/app.js", "js/essen.js", "js/gesundheit.js", "js/einstieg.js",
];

// Aus index.html nur das Gerüst übernehmen: alles zwischen <body> und </body>,
// ohne die Skript-Tags und ohne die Service-Worker-Anmeldung.
const html = lies("index.html");
const koerper = html.slice(html.indexOf("<body>") + 6, html.indexOf("</body>"))
  .replace(/\s*<script[\s\S]*?<\/script>/g, "")
  .trim();

/* Der Ersatzspeicher. Er steht vor der App, damit deren erster Zugriff schon
   hier landet. Bewusst keine Anbindung an den echten localStorage: Die Demo
   soll bei jedem Aufruf gleich anfangen. */
const speicher = `
(function () {
  var daten = {};
  var ersatz = {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(daten, k) ? daten[k] : null; },
    setItem: function (k, v) { daten[k] = String(v); },
    removeItem: function (k) { delete daten[k]; },
    clear: function () { daten = {}; },
    key: function (i) { return Object.keys(daten)[i] ?? null; },
    get length() { return Object.keys(daten).length; },
  };
  try { Object.defineProperty(window, "localStorage", { value: ersatz, configurable: true }); }
  catch (e) { window.localStorage = ersatz; }
})();`;

const teile = [
  "<title>Lumora Probelauf</title>",
  "<style>\n" + lies("css/style.css") + "\n</style>",
  koerper,
  "<script>" + speicher + "</script>",
  ...SKRIPTE.map((p) => "<script>\n" + lies(p) + "\n</script>"),
];

const ziel = join(root, "demo");
mkdirSync(ziel, { recursive: true });
const datei = join(ziel, "lumora-demo.html");
writeFileSync(datei, teile.join("\n\n"), "utf8");
console.log("demo/lumora-demo.html gebaut (" + Math.round(teile.join("").length / 1024) + " KB)");
