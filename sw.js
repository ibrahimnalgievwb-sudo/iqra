const CACHE_VERSION = 'iqra-v175';
const CACHE_ASSETS = [
  './', './index.html', './manifest.json', './count.js', './fonts.css',
  './tajweed.css', './tajweed.json',
  './favicon.png', './apple-touch-icon.png', './icon-192.png', './icon-512.png',
  './logo.svg', './logo-mini.svg',
  './fonts/amiri-v30-arabic_latin-regular.woff2',
  './fonts/amiri-v30-arabic_latin-700.woff2',
  './fonts/noto-naskh-arabic-v44-arabic_latin-regular.woff2',
  './fonts/noto-naskh-arabic-v44-arabic_latin-500.woff2',
  './fonts/noto-naskh-arabic-v44-arabic_latin-700.woff2',
  './fonts/inter-v20-cyrillic_cyrillic-ext_latin_latin-ext-regular.woff2',
  './fonts/inter-v20-cyrillic_cyrillic-ext_latin_latin-ext-500.woff2',
  './fonts/inter-v20-cyrillic_cyrillic-ext_latin_latin-ext-600.woff2',
  './fonts/inter-v20-cyrillic_cyrillic-ext_latin_latin-ext-700.woff2',
  './fonts/inter-v20-cyrillic_cyrillic-ext_latin_latin-ext-800.woff2',
  './fonts/inter-v20-cyrillic_cyrillic-ext_latin_latin-ext-300.woff2'
];

self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache) {
      return Promise.allSettled(
        CACHE_ASSETS.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('SW: failed to cache', url, err);
          });
        })
      );
    })
  );
});
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_VERSION; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.matchAll({ type: 'window' }).then(function(clients) {
        clients.forEach(function(client) {
          try { client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION }); } catch(e) {}
        });
      });
    }).then(function() {
      return self.clients.claim();
    }).then(function() {
      if (self.registration.navigationPreload) {
        return self.registration.navigationPreload.enable();
      }
    })
  );
});

self.addEventListener('fetch', function(event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(req).then(function(res) {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(function(c) { c.put(req, copy); });
        }
        return res;
      }).catch(function() {
        return caches.match(req).then(function(cached) {
          return cached || new Response('{}', { status: 503, headers: { 'Content-Type': 'application/json' } });
        });
      })
    );
    return;
  }

  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      (async function() {
        try {
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) return preloadResponse;
          const networkResponse = await fetch(req);
          if (networkResponse && networkResponse.status === 200) {
             const copy = networkResponse.clone();
             caches.open(CACHE_VERSION).then(function(c) { c.put(req, copy); });
          }
          return networkResponse;
        } catch (error) {
          const cachedResponse = await caches.match(req);
          if (cachedResponse) return cachedResponse;
          const fallbackResponse = await caches.match('./index.html');
          if (fallbackResponse) return fallbackResponse;
          return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
        }
      })()
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
      }).catch(function() {
        return cached || new Response('', {
          status: 504,
          statusText: 'Offline'
        });
      });
    })
  );
});
