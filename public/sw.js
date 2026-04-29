// public/sw.js
const CACHE = "news-ame-v1";
const STATIC = ["/", "/_next/static/"];

self.addEventListener("install", e => {
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", e => {
  // APIリクエストはキャッシュしない
  if (e.request.url.includes("/api/")) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
