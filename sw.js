/* ============================================================
   SW.JS — Service Worker проекта «Икра» v385 (рефакторинг)
   Cache-first для статики, network-first для API/навигации,
   stale-while-revalidate для данных. SKIP_WAITING поддерживается
   (его отправляет app.js при обновлении).
   ============================================================ */

const SW_VERSION   = 'iqra-v385';
const CACHE_STATIC = 'iqra-static-' + SW_VERSION;
const CACHE_DATA   = 'iqra-data-'   + SW_VERSION;
const CACHE_FONTS  = 'iqra-fonts-'  + SW_VERSION;

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

/* ---------- INSTALL ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cacheS = await caches.open(CACHE_STATIC);
    const cacheD = await caches.open(CACHE_DATA);
    // addAll ломается целиком при одном 404 — грузим по одному
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

/* ---------- ACTIVATE ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k !== CACHE_STATIC && k !== CACHE_DATA && k !== CACHE_FONTS)
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((c) => {
      try { c.postMessage({ type: 'SW_UPDATED', version: SW_VERSION }); } catch (e) {}
    });
  })());
});

/* ---------- MESSAGE: SKIP_WAITING ---------- */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ---------- FETCH ---------- */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Только свой origin — внешние (API, GoatCounter, Umami, шрифты) не кэшируем агрессивно
  const isSameOrigin = url.origin === self.location.origin;

  // API аль-Куран — network-first, при провале — из кэша
  if (
    url.hostname === 'api.alquran.cloud' ||
    url.hostname === 'api.quran.foundation'
  ) {
    event.respondWith(networkFirst(req));
    return;
  }

  // GoatCounter / Umami — только сеть, без кэша
  if (
    url.hostname === 'iqra-stats.goatcounter.com' ||
    url.hostname === 'cloud.umami.is'
  ) {
    return; // пусть работает браузер как обычно
  }

  // Данные (./data/*.json) — stale-while-revalidate
  if (isSameOrigin && url.pathname.indexOf('/data/') !== -1) {
    event.respondWith(staleWhileRevalidate(req, CACHE_DATA));
    return;
  }

  // Шрифты (любые .woff2/.ttf/.otf) — cache-first
  if (/\.(woff2?|ttf|otf)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(req, CACHE_FONTS));
    return;
  }

  // Навигация (HTML) — network-first с fallback на ./index.html
  if (req.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(req));
    return;
  }

  // Остальная статика своего origin — cache-first
  if (isSameOrigin) {
    event.respondWith(cacheFirst(req, CACHE_STATIC));
    return;
  }

  // Всё прочее — пусть как есть
});

/* ---------- STRATEGIES ---------- */
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
    // обновляем в фоне
    networkPromise;
    return cached;
  }
  const fresh = await networkPromise;
  if (fresh) return fresh;
  return new Response('{}', { headers: { 'Content-Type': 'application/json' }, status: 504 });
}
