// Lumora Service Worker – App-Shell offline verfügbar halten
const CACHE = "lumora-v33";
const ASSETS = [
  "./",
  "index.html",
  "css/style.css",
  "js/exercises.js",
  "js/muscle-paths.js",
  "js/muscle-icons.js",
  "img/koerper-vorn.png",
  "img/koerper-hinten.png",
  "js/app.js",
  "js/essen.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-512-maskable.png",
  "icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Fremde Adressen – die Lebensmittel-Datenbank – gehen am Cache vorbei.
  // Suchergebnisse sind nichts zum Wiederverwenden, und ignoreSearch würde
  // unten zwei verschiedene Suchen für dieselbe halten.
  if (new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => {
        if (e.request.mode === "navigate") return caches.match("index.html");
      });
    })
  );
});
