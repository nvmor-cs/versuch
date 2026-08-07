// Lumora – Training, Fortschritt, Gesundheit
// Vanilla JS, keine Abhängigkeiten. Daten liegen in localStorage.

"use strict";

const APP_NAME = "Lumora";
const APP_VERSION = "2.2.0";

// Wählbare Akzentfarben. Die Werte spiegeln die :root[data-accent="…"]-Blöcke
// im Stylesheet; hier stehen sie nur für die Farbpunkte in den Einstellungen.
const ACCENT_DEFAULT = "blau";
const ACCENTS = [
  { id: "blau",       name: "Blau",      dot: "#3b82f6", ink: "#ffffff" },
  { id: "gruen",      name: "Grün",      dot: "#22c55e", ink: "#06210f" },
  { id: "bernstein",  name: "Bernstein", dot: "#f59e0b", ink: "#1a1200" },
  { id: "rot",        name: "Rot",       dot: "#ef4444", ink: "#ffffff" },
  { id: "magenta",    name: "Magenta",   dot: "#ec4899", ink: "#ffffff" },
  { id: "weiss",      name: "Weiß",      dot: "#ffffff", ink: "#111827" },
];

// Die Marke: eine dreiblättrige Blüte – abstrakt für Wachstum und Vitalität.
// Dieselbe Geometrie rendert scripts/make-icons.py zu den App-Icons.
const LOGO_PETAL = "M50 10C78 23.6 70.56 38.4 50 44C37.44 38.4 42 23.6 50 10Z";
const logoSvg = () =>
  `<svg viewBox="0 0 100 100" class="logo" aria-hidden="true" fill="currentColor">` +
  [0, 120, 240].map((a) =>
    `<path d="${LOGO_PETAL}"${a ? ` transform="rotate(${a} 50 50)"` : ""}/>`).join("") +
  `</svg>`;

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

// Piktogramme der Muskelgruppen – anatomische Silhouetten.
// Neun stammen aus Game-Icons (CC BY 3.0, siehe NOTICE.md); Rücken,
// Schultern, Nacken, Po und Trizeps sind eigene Zeichnungen im selben Stil.
const MUSCLE_ICONS = {
  "Brust": { vb: "0 0 512 512", body: `<path fill="currentColor" d="M196.629 18c5.912 17.013 14.242 32.992 22.43 38.557c9.701 6.593 23.321 9.89 36.941 9.89s27.24-3.297 36.941-9.89c8.188-5.565 16.518-21.544 22.43-38.557H196.63zm-16.424 8.264c-12.18 19.569-25.92 40.841-54.713 56.945c12.332 18.881 15.63 38.117 11.809 55.26c29.675-.906 58.603 2.266 90.732 13.486l.115.057l.114.06c8.228 4.423 19.276 11.506 27.738 22.31c8.462-10.804 19.51-17.887 27.738-22.31l.114-.06l.115-.057c32.13-11.22 61.057-14.392 90.732-13.486c-3.821-17.143-.523-36.379 11.809-55.26c-28.794-16.104-42.533-37.376-54.713-56.945c-5.946 17.839-14.404 35.438-28.736 45.18c-6.636 4.51-14.087 7.903-21.948 10.189c2.346 16.9 19.092 31.4 33.03 46.367c-13.482 0-25.88.216-34.108-8.078c-9.017-9.09-11.305-21.722-11.695-35.592a91.6 91.6 0 0 1-28.39-.586c-.343 14.102-2.57 26.96-11.716 36.178c-8.228 8.294-20.625 8.078-34.107 8.078c14.251-15.304 31.434-30.12 33.16-47.512c-6.533-2.223-12.731-5.23-18.344-9.045c-14.332-9.741-22.79-27.34-28.736-45.18zM99.143 87.775c-17.69.11-39.135 7.635-56.498 19.15c-10.28 6.819-18.751 14.923-24.645 22.913v67.908c24.558 3.093 70.735-25.185 97.006-65.355c3.765-11.413 6.445-25.011-7.963-43.977c-2.466-.35-5.193-.745-7.9-.639m313.714 0c-2.707-.106-5.434.29-7.9.64c-14.408 18.965-11.728 32.563-7.963 43.976c26.27 40.17 72.448 68.448 97.006 65.355v-67.908c-5.894-7.99-14.365-16.094-24.645-22.912c-17.363-11.516-38.807-19.04-56.498-19.15zm-262.36 67.57c-63.148.5-88.27 46.696-99.104 129.22c4.602 3.195 12.321 6.723 22.263 9.404c47.449 12.526 97.552 8.55 148.375 1.25c11.224-2.647 23.381-10.45 24.969-23.219v-77.945c-5.536-12.054-17.133-22.852-27.14-26.053c-27.14-8.68-50.033-12.81-69.364-12.656zm211.007 0c-19.33-.152-42.224 3.977-69.363 12.657c-10.008 3.2-21.605 13.999-27.141 26.053V272c1.588 12.77 13.745 20.572 24.969 23.219c50.823 7.3 100.926 11.276 148.375-1.25c9.942-2.681 17.661-6.21 22.263-9.405c-10.834-82.523-35.956-128.718-99.103-129.218zM18 205.874v118.719c21.138-37.657 24.415-68.827 30.182-115.512c-9.019 1.421-19.768-1.08-30.182-3.207m476 0c-10.414 2.127-21.163 4.628-30.182 3.207c5.768 46.685 9.044 77.855 30.182 115.512v-118.72zm-390.72 52.342c8.776 0 15.89 4.45 15.89 9.937c0 5.488-7.114 9.937-15.89 9.938c-8.778 0-15.893-4.45-15.893-9.938s7.115-9.937 15.892-9.937zm305.44 0c8.778 0 15.893 4.449 15.893 9.937c0 5.489-7.115 9.938-15.892 9.938s-15.89-4.45-15.89-9.938s7.113-9.937 15.89-9.937zM256 295.055a47 47 0 0 1-4.1 4.271c-7.385 6.78-16.593 11.361-25.931 13.455c-47.557 10.258-106.701 5.934-156.797-1.383c-17.011-2.484-24.294-5.647-27.34 11.497c-4.35 24.484 21.499 47.728 44.53 70.738c1.938 1.937 2.8 2.776 2.613 5.69c2.414 31.955 5.053 63.473 11.957 94.677h45.07c-.677-8.915 1.187-17.507 5.129-27.975c-6.171-15.747-10.355-34.688-.363-52.18c-1.848-21.207-.755-42.269 13.548-60.665c18.601-22.962 61.04-32.342 91.684-21.135c30.645-11.207 73.083-1.827 91.684 21.135c14.303 18.396 15.396 39.458 13.548 60.666c9.992 17.49 5.808 36.432-.363 52.18c3.942 10.467 5.806 19.06 5.129 27.974h45.07c6.904-31.204 9.543-62.722 11.957-94.678c-.187-2.913.675-3.752 2.614-5.69c23.03-23.009 48.879-46.253 44.529-70.737c-3.046-17.144-10.329-13.981-27.34-11.497c-50.096 7.317-109.24 11.641-156.797 1.383c-9.338-2.094-18.546-6.675-25.931-13.455a47 47 0 0 1-4.1-4.271m-28.729 50.449c-17.232-.256-34.73 5.441-47.863 18.842c-7.088 9.117-9.738 18.924-10.201 30.265c21.7-15.263 49.534-23.781 77.895-22.039v-24.138a76.8 76.8 0 0 0-19.83-2.93zm57.458 0a76.8 76.8 0 0 0-19.83 2.93v24.138c28.36-1.742 56.194 6.776 77.894 22.04c-.463-11.342-3.113-21.15-10.201-30.266c-13.133-13.401-30.63-19.098-47.863-18.842m-47.471 44.642c-23.725.118-53.462 12.998-69.776 30.854c-5.787 8.661-5.82 17.585-3.158 27.512c20.858-17.294 51.703-23.635 82.676-25.114V390.9c-3.087-.526-6.353-.77-9.742-.754m37.484 0c-3.39-.016-6.655.228-9.742.754v32.498c30.973 1.479 61.818 7.82 82.676 25.114c2.661-9.927 2.63-18.851-3.158-27.512c-16.314-17.856-46.051-30.736-69.776-30.854m-35.06 51.077c-21.798.181-60.852 12.549-71.287 30.023c-4.336 11.21-5.895 16.256-4.71 22.754h82.157v-52.436c-1.835-.25-3.905-.36-6.16-.341m32.636 0c-2.255-.02-4.325.092-6.16.341V494h82.156c1.186-6.498-.373-11.544-4.709-22.754c-10.435-17.474-49.489-29.841-71.287-30.023"/>` },
  "Rücken": { vb: "0 0 24 24", body: `<path fill="currentColor" d="M11.2 2.8C8.4 3.2 5.2 4.4 2.2 6.6c-.2 5.6 2 10 9 14.6z"/><path fill="currentColor" d="M12.8 2.8c2.8.4 6 1.6 9 3.8.2 5.6-2 10-9 14.6z"/>` },
  "Schultern": { vb: "0 0 24 24", body: `<path fill="currentColor" d="M9.4 7.4h5.2c.6 0 1.1.5 1.1 1.1l-.6 11.4c0 .6-.5 1.1-1.1 1.1H9.9c-.6 0-1.1-.5-1.1-1.1L8.3 8.5c0-.6.5-1.1 1.1-1.1z"/><circle fill="currentColor" cx="4.4" cy="10.2" r="4"/><circle fill="currentColor" cx="19.6" cy="10.2" r="4"/>` },
  "Nacken": { vb: "0 0 24 24", body: `<circle fill="currentColor" cx="12" cy="4.6" r="3"/><path fill="currentColor" d="M12 8.4c-1.7 0-2.8.7-3.6 1.6L2.9 14.4c-.5.4-.6 1.2-.1 1.7l2.5 2.7c.4.5 1.1.6 1.6.3L12 15.8l5.1 3.3c.5.3 1.2.2 1.6-.3l2.5-2.7c.5-.5.4-1.3-.1-1.7L15.6 10c-.8-.9-1.9-1.6-3.6-1.6z"/>` },
  "Bizeps": { vb: "0 0 512 512", body: `<path fill="currentColor" d="M211.832 39.06c-15.022 15.31-15.894 22.83-23.473 43.903c2.69 9.14 5.154 16.927 9.148 25.117c5.158.283 10.765.47 15.342.43c-6.11-10.208-8.276-19.32-4.733-35.274c4.3 19.05 12.847 29.993 21.203 34.332q4.548-.5 8.776-1.146c-6.255-10.337-8.494-19.47-4.914-35.588c3.897 17.27 11.287 27.876 18.86 32.94c4.658-1.043 9.283-2.243 13.927-3.534c-5.517-9.69-7.36-18.692-3.97-33.957c3.357 14.876 9.307 24.81 15.732 30.516a1528 1528 0 0 0 13.852-4.347c-.685-5.782-.416-12.187 1.064-19.115l1.883-8.8l17.603 3.76l-1.88 8.804c-3.636 17.008 1.324 24.42 7.306 28.666c5.98 4.244 14.69 3.46 16.03 2.6l7.576-4.86l9.72 15.15c-3.857 2.34-7.9 5.44-11.822 7.06c18.65 27.678 32.183 61.465 24.756 93.55c-2.365 9.474-6.03 18.243-11.715 24.986c12.725 12.13 21.215 22.026 31.032 34.5a692 692 0 0 0-11.692-7.37c-11.397-7.01-23.832-14.214-34.98-19.802c-16.012-7.8-31.367-18.205-47.73-20.523c-22.552-2.967-46.27 4.797-73.32 21.06c7.872 8.72 13.282 15.474 20.312 24.288c-6.98-4.338-14.652-9.07-23.16-14.23c-32.554-17.48-65.39-48.227-100.438-49.99c-30.56-1.092-59.952 14.955-89.677 38.568L18 254.293V494h31.963c45.184-17.437 80.287-57.654 97.03-94.52l.25-.564l.325-.52c9.463-15.252 11.148-29.688 16.79-44.732c5.645-15.044 16.907-29.718 41.884-38.756c4.353-2.16 5.07-1.415 8.633 1.395c30.468 24.01 57.29 32.02 83.24 32.35c32.61-1.557 58.442-9.882 85.682-19.38c-3.966 3.528-8.77 7.21-13.986 10.762c-15.323 10.436-34.217 19.928-46.304 24.8c-14.716 2.006-28.36 2.416-41.967.616c-9.96 12.09-25.574 20.358-37.35 26.673c63.92 14.023 115.88.91 167.386-22.896c-9.522-1.817-19.008-3.692-27.994-5.42c31.634-4.422 64.984-3.766 94.705-3.53c4.084-.02 7.213-.453 8.7-.886c14.167-51.072-4.095-97.893-34.294-145.216c-30.263-47.425-72.18-94.107-101.896-143.04c-21.1-17.257-48.6-31.455-77.522-46.175c-20.386 4.25-41.026 9.336-61.443 14.1zm85.385 70.49c-11.678 3.6-23.71 7.425-33.852 10.012c2.527 4.93 3.735 10.664 3.395 16.202c11.028.877 21.082-2.018 28.965-6.356c4.845-2.666 8.74-6.048 11.414-8.96c-3.854-2.735-7.26-6.41-9.923-10.9zm-54.213 14.698c-11.76 1.143-24.59 2.362-35.06 2.236c2.39 4.772 3.78 12.067 8.51 14.84c11.18 1.164 20.6 1.997 29.91-1.746c5.435-3.214 1.818-15.058-3.36-15.33m-34.98 209.332c-17.593 7.233-22.586 15.14-26.813 26.406c-3.998 10.66-6.227 25.076-14.48 41.014c32.29-6.38 69.625-21.23 93.852-40.088c-17.017-5.098-34.553-13.852-52.557-27.332zm9.318 71.385c-18.723 7.237-40.836 16.144-59.696 14.062C143.774 446.68 124.012 474.03 91.762 494h84.68c21.564-29.798 38.067-56.575 40.9-89.035"/>` },
  "Trizeps": { vb: "0 0 24 24", body: `<path fill="currentColor" d="M6.6 3.2h3.6v9.6a1.8 1.8 0 0 0 3.6 0V3.2h3.6v9.6a5.4 5.4 0 0 1-10.8 0z"/>` },
  "Beine": { vb: "0 0 512 512", body: `<path fill="currentColor" d="M329.4 16.38c20.7 13.71 33.6 29.78 39.1 48.03c7.7 25.32.6 52.79-15.1 80.89c-2.2 3.9-4.3 7.7-6.3 11.5c21.2 42.5 38.6 84.8 44.4 128.3c4.9 17.3-25.6 32.3-23.8 44.5c2.4 12.6 9.3 17.2 18.6 22.6c11.4 6.2 23.2 13.3 26.8 25c5.8 21 13.4 31.6 19.7 37s11.4 6.3 15.3 6.8c10.8 1.2 22.5-1.2 28.9-4.7c4.2-2.3 6-5.2 4.4-7.9c-19.6-36.2-53.5-73.4-54-114.3c.6-60.2-22.8-129.8-13.7-196.25c4-29.33 3.5-44.93-1.2-52.6c-16.8-27.67-54.3-27.75-83.1-28.87M30.05 18.72C76.23 100.3 192 102.1 276.4 99.03L265 114.1c-25.3 33.5-29.9 62.3-29.7 92.5c.3 30.3 6.3 61.8 1.7 97.4c-2.2 17.3-14.5 28.6-24.2 37.5c-4.9 5.7-15.9 11.5-16.1 19.7c-.1 16.2 2.7 24.5 6.2 32.3c3.5 7.7 8.5 15.6 10.1 27.8c2 14.9 1.8 26.8 3.2 35.9c1.3 9 3.5 15.1 10.7 22.2c11.4 9 25.5 10.9 34.8 8.8c4.5-1.1 10.7-3.9 9-7.4c-26.9-55.9-11.5-108.3-2.5-161.5c9.7-58.5 31.8-115.3 69.4-182.8c14.4-25.8 19.4-48.02 13.7-66.89c-5.6-18.56-22-35.81-55.1-50.89z"/>` },
  "Po": { vb: "0 0 24 24", body: `<path fill="currentColor" d="M11.2 7.4c-4.1 0-6.9 2.7-6.9 6.2s2.7 5.8 6.5 5.8c.3 0 .6-.3.6-.7V8.1c0-.4-.2-.7-.2-.7z"/><path fill="currentColor" d="M12.8 7.4c4.1 0 6.9 2.7 6.9 6.2s-2.7 5.8-6.5 5.8c-.3 0-.6-.3-.6-.7V8.1c0-.4.2-.7.2-.7z"/>` },
  "Waden": { vb: "0 0 512 512", body: `<path fill="currentColor" d="M44.156 19.47c40.24 103.666 45.06 254.208 5.22 367.28c-28.324 80.378 9.553 105.938 66.25 105.938l31.374.28c63.568-40.225 127.15-23.413 190.72 1.813l110.78 1.033c77.705 0 54.114-80.826-18.594-69.125L278.53 349.5C212.117 277.39 222.04 85.354 241.407 20l-197.25-.53z"/>` },
  "Bauch": { vb: "0 0 512 512", body: `<path fill="currentColor" d="m162 35.75l-94.49 27.1c-12.05 6.3-23.47 23.9-31.01 46.35c-6.07 18.2-9.62 38.9-10.93 58.3L136.7 112zm188 .1L375.4 112l111 55.6c-1.3-19.3-4.9-40.2-10.9-58.3c-5.7-17.05-13.6-31.35-22.5-40.05c-2.7-2.8-5.5-4.9-8.4-6.4zm-172.9 11.5l-25.7 77.45l-92.9 46.4l14.08 53.5l88.82 44.4l94.6-15.9l94.6 15.9l88.8-44.4l14.1-53.5l-92.8-46.4l-25.8-77.35h-10.5l-59.3 73.95l-.1 61.1h-18.1l.1-61l-59.3-74.15zM78.65 247.7l22.05 83.9l146.2-43.8v-14.7l-88.4 14.7zm354.75 0l-80 40.1l-88.4-14.7v14.7l146.3 43.8zm-186.5 58.7l-31.6 9.6l-35.1 70.2l66.7-33.3zm18.1 0v46.5l66.9 33.4l-35.2-70.3zM191.7 323l-86.4 26l25.3 96.3zm128.6.1l61.1 122.1l25.3-96.2zm-55.3 50l.1 43.2l100.7 37.8l-20.4-40.8zm-18.1 0l-80.2 40.1l-20.5 40.9L247 416.3zm.1 62.4l-81.6 30.6l81.6 10.2zm18.1 0v40.7l81.7-10.2z"/>` },
  "Unterarme": { vb: "0 0 512 512", body: `<path fill="currentColor" d="M470.92 53.162c21.738 76.755-126.736 189.16-213.57 251.49c4.21 19.66 2.796 37.915 0 55.825c20.223 32.576.83 44.814 2.76 82.5c-1.05 13.887-23.797 12.58-28.066-8.576c4.852-31.07-2.95-57.924-15.472-54.243l-31.933 43.23l-47.61 67.04c-5.897 5.975-27.768 1.664-22.4-12.69l39.123-71.307l-3.784-2.538l-74.42 79c-6.056 6.26-26.28-7.956-19.953-16.503l69.72-74.202l-3.783-1.925l-66.576 44.227c-7.596 5.33-22.805-10.34-12.628-17.663l63.976-50.98l-43.874 22.025c-6.156 2.1-12.68-10.355-5.976-13.335l50.997-32.6c26.468-21.393 58.785-57.834 94.072-65.2c55.417-83.656 104.97-167.018 175.057-253.61c26.274-13.577 86.7 8.58 94.34 30.035"/>` },
  "Ganzkörper": { vb: "0 0 512 512", body: `<path fill="currentColor" d="M257.375 20.313c-13.418 0-26.07 7.685-35.938 21.75c-9.868 14.064-16.343 34.268-16.343 56.75c0 22.48 6.475 42.654 16.344 56.718c9.868 14.066 22.52 21.75 35.937 21.75c13.418 0 26.038-7.684 35.906-21.75c9.87-14.063 16.376-34.236 16.376-56.718c0-22.48-6.506-42.685-16.375-56.75c-9.867-14.064-22.487-21.75-35.905-21.75zm-150.25 43.062c-20.305.574-23.996 13.892-31.78 29.03c-23.298 45.304-55.564 164.75-55.564 164.75l160.47-5.436l29.125 137.593l-22.78 106.03h149.093l-22.282-106l24.25-137.5l157.53 5.313c.002 0-32.264-119.447-55.56-164.75c-7.787-15.14-11.477-28.457-31.782-29.03c-17.898 0-32.406 15.552-32.406 34.718s14.508 34.72 32.406 34.72c3.728 0 7.258-.884 10.594-2.126l7.937 74.406L309.437 165c-.285.42-.552.867-.843 1.28c-12.436 17.724-30.604 29.69-51.22 29.69c-20.614 0-38.782-11.966-51.218-29.69c-.277-.395-.54-.816-.812-1.218l-116.75 40.032l7.937-74.406c3.337 1.242 6.867 2.125 10.595 2.125c17.898 0 32.406-15.553 32.406-34.72c0-19.165-14.507-34.718-32.405-34.718z"/>` },
  "Cardio": { vb: "0 0 512 512", body: `<path fill="currentColor" d="M372.97 24.938c-8.67.168-17.816 3.644-26.69 10.28c-12.618 9.44-24.074 25.203-30.5 44.844c-6.424 19.642-6.48 39.12-1.874 54.157c4.608 15.036 13.375 25.225 24.97 29c11.593 3.772 24.724.72 37.343-8.72c12.618-9.44 24.074-25.234 30.5-44.875c6.424-19.642 6.512-39.12 1.905-54.156c-4.607-15.038-13.404-25.196-25-28.97a32 32 0 0 0-8.938-1.563c-.573-.018-1.14-.01-1.718 0zm-155.69 69.78c-21.696.024-43.394 2.203-65.093 7.094c-24.91 29.824-43.848 60.255-52.875 98.47l37.376 17.812c8.273-30.735 21.485-53.817 43.375-77c22.706-7.844 45.418-6.237 68.125 1.5c-74.24 65.137-51.17 120.676-80.344 226.47c-42.653 17.867-85.098 20.53-123.25-.002L23 415.625c59.418 27.09 125.736 29.818 190.844 0c20.368-43.443 27.214-88.603 25-132.906C295.31 354.663 323.11 398.2 338.78 498.56h57.94c-3.12-14.706-6.21-28.394-9.345-41.218c-22.522-92.133-47.263-139.63-100.22-198.406c9.695-36.13 22.143-59.665 52.44-74.282c11.167 19.767 29.982 36.682 51.092 48.906l97.375 1.563l.47-41.03L402 191.968c-8.05-5.556-14.925-11.73-20.75-18.314c-14.886 9.08-32.024 12.563-48.156 7.313c-18.422-5.997-31.143-21.962-37.063-41.282c-3.482-11.37-4.742-24.05-3.686-37.25c-25.017-4.884-50.047-7.746-75.063-7.72z"/>` },
};

const muscleIcon = (m) => {
  const ic = MUSCLE_ICONS[m] || MUSCLE_ICONS["Ganzkörper"];
  return `<svg viewBox="${ic.vb}" fill="currentColor" aria-hidden="true">${ic.body}</svg>`;
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

// Die Schlüssel behalten den alten Namen: Sie sind der Anker zu den bereits
// gespeicherten Plänen und Workouts. Umbenennen hieße Daten verlieren.
const LS_DB = "eisenzeit.db.v1";
const LS_ACTIVE = "eisenzeit.active.v1";

// Version des Farbschemas. Steigt sie, werden alte Akzentfarben einmalig
// auf den neuen Standard gesetzt (siehe migrateScheme).
const SCHEME_VERSION = 2;

function defaultDB() {
  return {
    version: 2,
    // schemeV fehlt hier bewusst: Beim Laden werden die Standardwerte mit den
    // gespeicherten überlagert. Stünde schemeV schon drin, würde es einen
    // Altbestand ohne diesen Schlüssel überdecken – die Migration liefe nie.
    // migrateScheme() setzt ihn, auch für eine frische Datenbank.
    settings: {
      restSecs: 90, autoRest: true, lastBackupAt: null,
      accent: ACCENT_DEFAULT, restSignal: "beides",
    },
    customExercises: [],
    plans: [],
    workouts: [],
    activePlanId: null,
    seeded: false,
  };
}

// Das alte Schema kannte Akzentfarben wie „gold", die es nicht mehr gibt.
// Ohne diesen Schritt bliebe ein Altbestand auf einer Farbe hängen, für die
// es keinen Stylesheet-Block mehr gibt – die App sähe halb umgestellt aus.
function migrateScheme(settings) {
  if (!settings || settings.schemeV === SCHEME_VERSION) return;
  settings.accent = ACCENT_DEFAULT;
  settings.schemeV = SCHEME_VERSION;
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
  migrateScheme(db.settings);
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
  const id = DB.settings.accent || ACCENT_DEFAULT;
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

/* ═══════════════ Wischen zum Umschalten ═══════════════
   Verbindet einen Bereich mit einer Reihe von Ansichten: Waagerecht wischen
   blättert eine Position weiter, der Inhalt folgt dabei dem Finger und rastet
   beim Loslassen ein. Senkrechte Gesten bleiben normales Scrollen – dafür
   sorgt touch-action: pan-y auf .swipe-pane; alles außerhalb der Pane
   (etwa die Chip-Leiste) behält seine eigene waagerechte Geste. */

// Liegt der Punkt in etwas, das selbst waagerecht scrollt? Dann gehört
// die Geste diesem Element und nicht uns.
function waagerechtScrollbar(el) {
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    if (n.scrollWidth > n.clientWidth + 4) {
      const ov = getComputedStyle(n).overflowX;
      if (ov === "auto" || ov === "scroll") return true;
    }
  }
  return false;
}

// Lässt neuen Inhalt von der Seite hereinrutschen (richtung: 1 = von rechts)
function paneEinblenden(pane, richtung) {
  if (!pane) return;
  pane.style.transition = "none";
  pane.style.transform = `translateX(${richtung > 0 ? 40 : -40}px)`;
  pane.style.opacity = "0";
  void pane.offsetWidth;   // Umbruch erzwingen, sonst wird nur der Endzustand gezeichnet
  pane.style.transition = "";
  pane.style.transform = "";
  pane.style.opacity = "";
}

// opts: pane() – das mitwandernde Element, amRand(r) – geht es weiter?,
//       blaettern(r) – schaltet um (r: 1 = nächste, -1 = vorige)
function wischenVerbinden(bereich, opts) {
  let zug = null;

  const schieben = (dx, sanft) => {
    const pane = opts.pane();
    if (!pane) return;
    pane.style.transition = sanft ? "" : "none";
    pane.style.transform = dx ? `translateX(${dx}px)` : "";
  };

  bereich.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const pane = opts.pane();
    if (!pane || !pane.contains(e.target) || waagerechtScrollbar(e.target)) return;
    zug = { id: e.pointerId, x: e.clientX, y: e.clientY, achse: null, dx: 0 };
  });

  bereich.addEventListener("pointermove", (e) => {
    if (!zug || e.pointerId !== zug.id) return;
    const dx = e.clientX - zug.x, dy = e.clientY - zug.y;
    if (!zug.achse) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      // Nur deutlich waagerechte Gesten übernehmen
      if (Math.abs(dx) <= Math.abs(dy) * 1.4) { zug = null; return; }
      zug.achse = "x";
      bereich.setPointerCapture(e.pointerId);
    }
    e.preventDefault();
    // An den Enden zäh werden – so merkt man, dass es nicht weitergeht
    zug.dx = opts.amRand(dx < 0 ? 1 : -1) ? dx * 0.25 : dx;
    schieben(zug.dx, false);
  });

  const loslassen = () => {
    if (!zug) return;
    const { achse, dx } = zug;
    zug = null;
    if (achse !== "x") return;
    const schwelle = Math.min(70, bereich.clientWidth * 0.18);
    if (Math.abs(dx) > schwelle && opts.blaettern(dx < 0 ? 1 : -1)) return;
    schieben(0, true);   // zurückfedern
  };
  bereich.addEventListener("pointerup", loslassen);
  bereich.addEventListener("pointercancel", loslassen);
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
    bd.zurueck = () => done(false);   // von der Android-Zurücktaste genutzt
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
        <div class="wordmark">${logoSvg()}Lumora</div>
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

// Die Filterreihe der Übungslisten – „Alle" vorweg, dann die Muskelgruppen.
// Sie ist zugleich die Reihenfolge, durch die man wischen kann.
const MUSCLE_FILTER = ["Alle"].concat(MUSCLES);

// Nachbar-Filter in der Reihe oder null, wenn dort Schluss ist
function filterNachbar(aktuell, richtung) {
  const ziel = MUSCLE_FILTER.indexOf(aktuell) + richtung;
  return ziel >= 0 && ziel < MUSCLE_FILTER.length ? MUSCLE_FILTER[ziel] : null;
}

function chipsHtml(aktiv, action) {
  return MUSCLE_FILTER.map((m) =>
    `<button class="chip ${m === aktiv ? "active" : ""}" data-action="${action}" data-m="${esc(m)}">${esc(m)}</button>`).join("");
}

// Den aktiven Chip mittig in die Leiste holen – sonst wischt man an
// Muskelgruppen vorbei, die man gar nicht sieht.
function chipInSicht(leiste) {
  const chip = leiste && leiste.querySelector(".chip.active");
  if (!chip) return;
  const ziel = chip.offsetLeft - (leiste.clientWidth - chip.offsetWidth) / 2;
  leiste.scrollTo({ left: Math.max(0, ziel), behavior: "smooth" });
}

function renderExercises() {
  $("#screen-exercises").innerHTML = `
    <div class="screen-head">
      <div class="screen-title">Übungen</div>
      <button class="icon-btn" data-action="new-exercise" aria-label="Eigene Übung anlegen">${icon("plus")}</button>
    </div>
    <div class="search-wrap">${icon("search")}
      <input class="search-input" data-input="ex-search" value="${esc(exSearch)}" placeholder="Übung suchen …" autocomplete="off">
    </div>
    <div class="chips" id="ex-chips">${chipsHtml(exFilter, "ex-filter")}</div>
    <div class="swipe-pane" id="ex-list"></div>
  `;
  renderExerciseList();
  chipInSicht($("#ex-chips"));
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
      <span class="muscle-dot">${muscleIcon(e.muscle)}</span>
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

// Wischen blättert eine Muskelgruppe weiter
function exFilterBlaettern(richtung) {
  const ziel = filterNachbar(exFilter, richtung);
  if (!ziel) return false;
  exFilter = ziel;
  renderExercises();
  paneEinblenden($("#ex-list"), richtung);
  return true;
}

function exWischenVerbinden() {
  const screen = $("#screen-exercises");
  if (!screen) return;
  wischenVerbinden(screen, {
    pane: () => $("#ex-list"),
    amRand: (r) => !filterNachbar(exFilter, r),
    blaettern: exFilterBlaettern,
  });
}

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
        <span class="badge badge-record" style="padding:8px">${icon("trophy")}</span>
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
    <div class="swipe-pane" id="picker-list"></div>
    <div style="position:fixed;left:0;right:0;bottom:0;z-index:65;padding:12px 16px calc(var(--safe-bottom) + 14px);background:linear-gradient(transparent, var(--bg) 40%)">
      <div style="max-width:560px;margin:0 auto">
        <button class="btn" data-action="picker-done" id="picker-done" disabled>Übungen hinzufügen</button>
      </div>
    </div>
  `, "picker-ov");
  renderPickerChips();
  renderPickerList();
  // Wischen blättert hier durch dieselbe Reihe wie im Übungen-Tab
  wischenVerbinden(ov, {
    pane: () => $("#picker-list"),
    amRand: (r) => !pickerState || !filterNachbar(pickerState.filter, r),
    blaettern: pickerFilterBlaettern,
  });
  return ov;
}

function renderPickerChips() {
  $("#picker-chips").innerHTML = chipsHtml(pickerState.filter, "picker-filter");
  chipInSicht($("#picker-chips"));
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
      <span class="muscle-dot">${muscleIcon(e.muscle)}</span>
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

function pickerFilterBlaettern(richtung) {
  if (!pickerState) return false;
  const ziel = filterNachbar(pickerState.filter, richtung);
  if (!ziel) return false;
  pickerState.filter = ziel;
  renderPickerChips();
  renderPickerList();
  paneEinblenden($("#picker-list"), richtung);
  return true;
}
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
        <span class="badge badge-record">${icon("trophy")} ${p.first ? "Erste Marke" : "Rekord"}</span>
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
  entsperreTon();
  const endet = Date.now() + secs * 1000;
  // Benachrichtigung planen: Der Timer im Bildschirm läuft nicht weiter,
  // wenn das Handy in der Tasche steckt – die Meldung kommt trotzdem.
  planeErinnerung(endet);
  rest = { endsAt: endet, total: secs };
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
  stopRest({ meldungBehalten: true });
  toast("Pause vorbei – nächster Satz!");
  signalGeben();
}

/* ── Signal am Ende der Pause ───────────────────────────── */

// Ton darf erst nach einer Nutzeraktion starten – beim Satzabschluss ist
// diese gegeben, also den Audio-Kontext dort aufwecken.
function entsperreTon() {
  if (DB.settings.restSignal === "aus" || DB.settings.restSignal === "vibration") return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (e) {}
}

function signalGeben() {
  const modus = DB.settings.restSignal || "beides";
  if (modus === "aus") return;
  if (modus !== "vibration") tonSpielen();
  if (modus !== "ton") vibrieren();
}

function tonSpielen() {
  try {
    if (!audioCtx) return;
    if (audioCtx.state === "suspended") audioCtx.resume();
    // Drei kräftige Töne, absteigend – im Hallenlärm besser hörbar
    [[0, 1046], [0.28, 1046], [0.56, 784]].forEach(([versatz, hz]) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = "square";
      o.frequency.value = hz;
      o.connect(g); g.connect(audioCtx.destination);
      const t0 = audioCtx.currentTime + versatz;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.015);
      g.gain.setValueAtTime(0.5, t0 + 0.16);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.24);
      o.start(t0); o.stop(t0 + 0.26);
    });
  } catch (e) {}
}

function vibrieren() {
  const muster = [0, 260, 120, 260, 120, 420];
  const { Haptics } = capPlugins();
  if (Haptics) {
    // Capacitor vibriert zuverlässiger als die Browser-Schnittstelle
    Haptics.vibrate({ duration: 260 }).catch(() => {});
    setTimeout(() => Haptics.vibrate({ duration: 260 }).catch(() => {}), 380);
    setTimeout(() => Haptics.vibrate({ duration: 420 }).catch(() => {}), 760);
    return;
  }
  try { navigator.vibrate && navigator.vibrate(muster); } catch (e) {}
}

/* ── Erinnerung, wenn die App nicht im Vordergrund ist ──── */

const REST_MELDUNG_ID = 4711;

async function planeErinnerung(endetUm) {
  const { LocalNotifications } = capPlugins();
  if (!LocalNotifications || DB.settings.restSignal === "aus") return;
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display !== "granted") {
      const neu = await LocalNotifications.requestPermissions();
      if (neu.display !== "granted") return;
    }
    await LocalNotifications.cancel({ notifications: [{ id: REST_MELDUNG_ID }] });
    await LocalNotifications.schedule({
      notifications: [{
        id: REST_MELDUNG_ID,
        title: "Pause vorbei",
        body: "Weiter mit dem nächsten Satz.",
        schedule: { at: new Date(endetUm), allowWhileIdle: true },
        sound: DB.settings.restSignal === "vibration" ? null : undefined,
      }],
    });
  } catch (e) {}
}

function loescheErinnerung() {
  const { LocalNotifications } = capPlugins();
  if (!LocalNotifications) return;
  LocalNotifications.cancel({ notifications: [{ id: REST_MELDUNG_ID }] }).catch(() => {});
}

function stopRest(opt) {
  if (rest) clearInterval(rest.interval);
  rest = null;
  $("#rest-bar")?.remove();
  // Beim vorzeitigen Abbrechen auch die geplante Meldung zurücknehmen
  if (!opt || !opt.meldungBehalten) loescheErinnerung();
}

ACTIONS["rest-plus"] = () => {
  if (!rest) return;
  rest.endsAt += 15000;
  rest.total += 15;
  planeErinnerung(rest.endsAt);
  tickRest();
};
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

const histIndex = () => Math.max(0, HIST_RANGES.findIndex((r) => r.id === histRange));

// Wechselt um eine Position weiter. Liefert false, wenn es in die
// Richtung nicht weitergeht (vor „Woche" bzw. hinter „Gesamt").
function histWechseln(richtung) {
  const ziel = histIndex() + richtung;
  if (ziel < 0 || ziel >= HIST_RANGES.length) return false;
  histRange = HIST_RANGES[ziel].id;
  renderHistory();
  paneEinblenden($("#hist-pane"), richtung);
  return true;
}

function histWischenVerbinden() {
  const screen = $("#screen-history");
  if (!screen) return;
  wischenVerbinden(screen, {
    pane: () => $("#hist-pane"),
    amRand: (r) => histIndex() + r < 0 || histIndex() + r >= HIST_RANGES.length,
    blaettern: histWechseln,
  });
}

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
    <div class="swipe-pane" id="hist-pane">
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
    </div>
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
          <button class="accent-dot ${a.id === (s.accent || ACCENT_DEFAULT) ? "active" : ""}"
            data-action="set-accent" data-a="${a.id}"
            style="--dot:${a.dot};--dot-ink:${a.ink}"
            role="radio" aria-checked="${a.id === (s.accent || ACCENT_DEFAULT)}"
            aria-label="${a.name}">${icon("check")}</button>`).join("")}
      </div>
    </div>
    <div class="settings-row">
      <div class="lbl">Signal am Pausenende<small>Klingelt auch, wenn das Handy in der Tasche steckt</small></div>
      <select data-input="rest-signal">
        ${[["beides","Ton + Vibration"],["ton","Nur Ton"],["vibration","Nur Vibration"],["aus","Aus"]]
          .map(([v,t]) => `<option value="${v}" ${v === (s.restSignal || "beides") ? "selected" : ""}>${t}</option>`).join("")}
      </select>
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
    <p class="hint" style="margin-top:16px;text-align:center">${APP_NAME} ${APP_VERSION} · Deine Daten bleiben auf diesem Gerät.</p>
    <p class="hint" style="margin-top:6px;text-align:center;font-size:11.5px">
      Muskel-Symbole: <a href="https://game-icons.net" style="color:var(--ink-2)">Game-Icons.net</a> (CC BY 3.0)</p>
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
  const a = ACCENTS.find((x) => x.id === (DB.settings.accent || ACCENT_DEFAULT));
  return a ? a.name : "Blau";
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
  "Lumora-Backup-" + new Date().toISOString().slice(0, 10) + ".json";

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
        title: "Lumora-Backup",
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
    toast("Das ist kein gültiges Lumora-Backup");
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
  if (data.settings) {
    // Ein Backup ohne schemeV stammt aus der Zeit vor dem neuen Farbschema.
    // Der Schlüssel darf dann nicht aus den aktuellen Einstellungen überleben,
    // sonst hält migrateScheme die alte Akzentfarbe für schon migriert.
    if (data.settings.schemeV === undefined) delete DB.settings.schemeV;
    DB.settings = Object.assign(DB.settings, data.settings);
  }
  migrateScheme(DB.settings);

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
    bd.zurueck = () => { bd.remove(); resolve(null); };
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
  const sek = e.target.closest('[data-input="rest-secs"]');
  if (sek) { DB.settings.restSecs = parseInt(sek.value, 10); saveDB(); }
  const sig = e.target.closest('[data-input="rest-signal"]');
  if (sig) {
    DB.settings.restSignal = sig.value;
    saveDB();
    entsperreTon();
    // Kurz vorführen, damit man die Wahl gleich hört bzw. spürt
    setTimeout(signalGeben, 120);
  }
});

/* ═══════════════ Android-Zurücktaste ═══════════════
   Zurück soll innerhalb der App navigieren statt sie zu schließen:
   erst offene Dialoge, dann Vollbild-Ansichten, dann zurück zum Start-Tab.
   Erst auf dem Start-Tab beendet ein zweites Zurück die App. */

let beendenBereitBis = 0;

function zurueckNavigieren() {
  // 1. Oberster Dialog (Bestätigung, Sheet, Auswahl)
  const dialoge = $$(".backdrop");
  if (dialoge.length) {
    const oben = dialoge[dialoge.length - 1];
    if (typeof oben.zurueck === "function") oben.zurueck();
    else oben.remove();
    return true;
  }

  // 2. Oberste Vollbild-Ansicht – jede mit ihrer eigenen Schließ-Logik
  const ovs = $$(".overlay");
  if (ovs.length) {
    const oben = ovs[ovs.length - 1];
    if (oben.classList.contains("workout-ov")) ACTIONS["minimize-workout"]();
    else if (oben.classList.contains("picker-ov")) ACTIONS["picker-cancel"]();
    else if (oben.classList.contains("plan-wo-ov")) ACTIONS["plan-wo-done"]();
    else { oben.remove(); render(); }
    return true;
  }

  // 3. Läuft der Pausen-Timer, hat Zurück ihn zuerst weg
  if (rest) { stopRest(); return true; }

  // 4. Von jedem anderen Tab zurück zum Start
  if (currentTab !== "home") { currentTab = "home"; render(); return true; }

  // 5. Auf dem Start-Tab: erst beim zweiten Mal beenden
  if (Date.now() < beendenBereitBis) return false;
  beendenBereitBis = Date.now() + 2000;
  toast(active ? "Workout läuft – nochmal für Beenden" : "Nochmal zurück zum Beenden");
  return true;
}

// Für die Web-Version ohne Capacitor nicht nötig – dort gibt es keine
// Hardware-Zurücktaste, die die App schließen würde.
(function zurueckTasteVerbinden() {
  const { App } = capPlugins();
  if (!App || !App.addListener) return;
  App.addListener("backButton", () => {
    if (!zurueckNavigieren()) App.exitApp();
  });
})();

/* ═══════════════ Bildschirm wach halten ═══════════════
   Solange die App offen im Vordergrund liegt, soll der Bildschirm nicht
   zugehen – mitten im Satz will niemand erst entsperren. In der Android-App
   erledigt das MainActivity über ein Fensterflag, hier greift zusätzlich
   die Wake-Lock-API für Browser und PWA. Sobald die App in den Hintergrund
   geht, gibt das System die Sperre von selbst wieder frei. */

let wachSperre = null;

async function bildschirmWachHalten() {
  if (!("wakeLock" in navigator)) return;
  if (document.visibilityState !== "visible" || wachSperre) return;
  try {
    wachSperre = await navigator.wakeLock.request("screen");
    wachSperre.addEventListener("release", () => { wachSperre = null; });
  } catch (e) {
    // Kein Drama: Im Akkusparmodus lehnt das System die Anfrage ab
  }
}

document.addEventListener("visibilitychange", bildschirmWachHalten);

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
histWischenVerbinden();
exWischenVerbinden();
bildschirmWachHalten();
