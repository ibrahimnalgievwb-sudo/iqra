const CACHE_VERSION = 'iqra-v288';
const CACHE_ASSETS = [
  './', './index.html', './manifest.json', './count.js', './fonts.css',
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
  event.waitUntil((async function() {
    const cache = await caches.open(CACHE_VERSION);
    try {
      await Promise.all(CACHE_ASSETS.map(url => cache.add(url)));
    } catch (err) {
      console.warn('SW: failed to cache asset (quota or network)', err);
    }
  })());
});
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', function(event) {
  event.waitUntil((async function() {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)));
    
    try {
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(client => {
        try { client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION }); } catch(e) {}
      });
      await self.clients.claim();
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
    } catch (e) {
      console.warn('SW: activation step failed', e);
    }
  })());
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
