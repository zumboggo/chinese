const CACHE = "parallel-reader-cache-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(resp => {
      if (req.method === "GET") {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return resp;
    }).catch(() => cached))
  );
});
