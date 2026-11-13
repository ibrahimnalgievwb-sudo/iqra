/* ============================================================
   SW.JS — Service Worker проекта «Икра» v416
   ============================================================ */

const SW_VERSION   = 'iqra-v416'; /* МЕНЯЙ ВЕРСИЮ ТОЛЬКО ЗДЕСЬ */
const SW_VER_SHORT = SW_VERSION.replace(/^iqra-/, '');
const CACHE_STATIC = 'iqra-static-' + SW_VER_SHORT;
const CACHE_DATA   = 'iqra-data-'   + SW_VER_SHORT;
const CACHE_FONTS  = 'iqra-fonts-'  + SW_VER_SHORT;

const PRECACHE_STATIC = [
  './',
  './index.html',
  './manifest.json',
  './css/fonts.css',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/layout.css',
  './css/tajweed.css',
  './js/api.js',
  './js/storage.js',
  './js/app.js',
  './js/deprecated.js',
  './js/components/quran.js',
  './js/components/reader.js',
  './js/components/tasbih.js',
  './js/components/dashboard.js',
  './js/components/dua.js',
  './js/components/hadith.js',
  './js/components/night.js',
  './js/components/memorize.js',
  './js/components/progress.js',
  './js/components/settings.js',
  './js/components/path.js',
  './js/components/search.js',
  './js/components/share.js',
  './js/components/onboarding.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/logo.svg',
  './assets/icons/favicon.png',
  './assets/icons/apple-touch-icon.png'
];

const PRECACHE_DATA = [
  './data/quran.json',
  './data/duas.json',
  './data/hadiths.json',
  './data/tasbihs.json',
  './data/knowledge-base.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cacheS = await caches.open(CACHE_STATIC);
    const cacheD = await caches.open(CACHE_DATA);
    await Promise.all(
      PRECACHE_STATIC.map((url) =>
        cacheS.add(url).catch((e) => console.warn('[SW] precache static skip:', url, e && e.message))
      )
    );
    await Promise.all(
      PRECACHE_DATA.map((url) =>
        cacheD.add(url).catch((e) => console.warn('[SW] precache data skip:', url, e && e.message))
      )
    );
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const ownedCachePattern = /^iqra-(static|data|fonts)-/;
    await Promise.all(
      keys
        .filter((key) => ownedCachePattern.test(key) && ![CACHE_STATIC, CACHE_DATA, CACHE_FONTS].includes(key))
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => {
      try { client.postMessage({ type: 'SW_UPDATED', version: SW_VERSION }); } catch (e) {}
    });
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (url.hostname === 'api.alquran.cloud' || url.hostname === 'api.quran.foundation') {
    event.respondWith(networkFirst(req));
    return;
  }

  if (url.hostname === 'cloud.umami.is' || url.hostname === 'gateway.umami.is') {
    return;
  }

  if (isSameOrigin && url.pathname.indexOf('/data/') !== -1) {
    event.respondWith(staleWhileRevalidate(req, CACHE_DATA));
    return;
  }

  if (/\.(woff2?|ttf|otf)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(req, CACHE_FONTS));
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(req));
    return;
  }

  if (isSameOrigin) {
    event.respondWith(cacheFirst(req, CACHE_STATIC));
    return;
  }
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req, { ignoreSearch: false });
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok && res.status === 200) {
      try { await cache.put(req, res.clone()); } catch (e) {}
    }
    return res;
  } catch (e) {
    const fallback = await cache.match(req);
    if (fallback) return fallback;
    throw e;
  }
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE_STATIC);
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      try { await cache.put(req, res.clone()); } catch (e) {}
    }
    return res;
  } catch (e) {
    const cached = await cache.match(req);
    if (cached) return cached;
    return new Response('', { status: 504, statusText: 'Network Error' });
  }
}

async function networkFirstNavigation(req) {
  try {
    const res = await fetch(req);
    if (res && res.ok) return res;
    throw new Error('non-ok');
  } catch (e) {
    const cache = await caches.open(CACHE_STATIC);
    const cached =
      (await cache.match(req)) ||
      (await cache.match('./index.html')) ||
      (await cache.match('./'));
    if (cached) return cached;
    return new Response('<!doctype html><meta charset="utf-8"><title>Offline</title><p>Приложение недоступно офлайн.</p>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      status: 503
    });
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const networkPromise = fetch(req)
    .then((res) => {
      if (res && res.ok) {
        try { cache.put(req, res.clone()); } catch (e) {}
      }
      return res;
    })
    .catch(() => null);
  if (cached) {
    networkPromise;
    return cached;
  }
  const fresh = await networkPromise;
  if (fresh) return fresh;
  return new Response('{}', { headers: { 'Content-Type': 'application/json' }, status: 504 });
}
