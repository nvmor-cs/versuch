// Kopiert die Web-App nach www/ – das ist das webDir für Capacitor.
// Die PWA im Repo-Root bleibt unverändert (GitHub Pages), www/ ist Build-Output.
import { cpSync, rmSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "www");

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const entry of ["index.html", "manifest.webmanifest", "sw.js", "css", "js", "icons", "img"]) {
  cpSync(join(root, entry), join(out, entry), { recursive: true });
}
console.log("www/ gebaut");
