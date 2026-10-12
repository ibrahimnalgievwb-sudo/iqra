const CACHE_VERSION = 'iqra-v10';
const CACHE_ASSETS = [
  './', './index.html', './manifest.json', './count.js', './fonts.css',
  './favicon.png', './apple-touch-icon.png', './icon-192.png', './icon-512.png', './logo.svg', './logo-mini.svg',
  './fonts/amiri-v30-arabic_latin-regular.woff2',
  './fonts/amiri-v30-arabic_latin-700.woff2',
  './fonts/noto-naskh-arabic-v44-arabic_latin-regular.woff2',
  './fonts/noto-naskh-arabic-v44-arabic_latin-500.woff2',
  './fonts/noto-naskh-arabic-v44-arabic_latin-700.woff2',
  './fonts/inter-v20-latin_latin-ext-regular.woff2',
  './fonts/inter-v20-latin_latin-ext-500.woff2',
  './fonts/inter-v20-latin_latin-ext-600.woff2',
  './fonts/inter-v20-latin_latin-ext-700.woff2',
  './fonts/inter-v20-latin_latin-ext-800.woff2'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache) {
      return cache.addAll(CACHE_ASSETS);
    }).catch(function() {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_VERSION; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req).then(function(res) {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(function(c) { c.put(req, copy); });
        }
        return res;
      }).catch(function() {
        return caches.match(req).then(function(r) {
          return r || caches.match('./index.html');
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function(cached) {
      if (cached) return cached;
      return fetch(req).then(function(res) {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(function(c) { c.put(req, copy); });
        }
        return res;
      }).catch(function() { return cached; });
    })
  );
});
