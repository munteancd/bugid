const CACHE = "bugid-v2";
const SHELL = [
  "./index.html", "./app.js", "./api.js", "./render.js", "./journal.js",
  "./styles.css", "./manifest.webmanifest",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
});

// Shell: cache-first (jurnalul merge offline). Apelurile la Worker NU se cache-uiesc.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return; // POST la Worker trece direct la rețea
  if (SHELL.some((p) => url.pathname.endsWith(p.replace("./", "")))) {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
  }
});
