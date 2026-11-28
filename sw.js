const SW_VERSION   = 'iqra-v469'; /* МЕНЯЙ ВЕРСИЮ ТОЛЬКО ЗДЕСЬ */
const SW_VER_SHORT = SW_VERSION.replace(/^iqra-/, '');
const CACHE_STATIC = 'iqra-static-' + SW_VER_SHORT;
const CACHE_CORE   = CACHE_STATIC;
const CACHE_DATA   = 'iqra-data-'   + SW_VER_SHORT;
const CACHE_FONTS  = 'iqra-fonts-'  + SW_VER_SHORT;

const SW_BASE_URL  = new URL('./', self.location.href);
const SW_BASE_PATH = SW_BASE_URL.pathname.endsWith('/') ? SW_BASE_URL.pathname : (SW_BASE_URL.pathname + '/');

/* Контур 1 — Core Cache: оболочка интерфейса, стили, скрипты, базовые иконки */
const PRECACHE_STATIC = [
  './',
  './index.html',
  './privacy.html',
  './manifest.json',
  './css/fonts.css',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/layout.css',
  './css/tajweed.css',
  './css/polish.css',
  './js/core/platform.js',
  './js/core/feature-flags.js',
  './js/core/storage-snapshot.js',
  './js/architecture.js',
  './js/smart-reminders.js',
  './js/scholars.js',
  './js/dalil.js',
  './js/api.js',
  './js/storage.js',
  './js/app.js',
  './js/actions.js',
  './js/deprecated.js',
  './js/graph-engine.js',
  './js/components/guide.js',
  './js/components/tafsir.js',
  './js/components/audio.js',
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
  './js/components/scholar-modal.js',
  './js/components/share.js',
  './js/components/widgets.js',
  './js/components/onboarding.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/logo.svg',
  './assets/icons/favicon.png',
  './assets/icons/apple-touch-icon.png'
];

/* Контур 2 — Data Runtime Cache (CACHE_DATA):
   Файлы контента из ./data/ (суры, хадисы, дуа, тафсиры, граф, чанки таджвида)
   не загружаются заранее при установке, а кэшируются лениво по мере открытия. */

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cacheS = await caches.open(CACHE_STATIC);
    await Promise.all(
      PRECACHE_STATIC.map((url) =>
        cacheS.add(url).catch((e) => console.warn('[SW] precache static skip:', url, e && e.message))
      )
    );
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    /* Миграция старых версий: удаляем только устаревшие кэши SW,
       не затрагивая localStorage и IndexedDB пользователей. */
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

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.notification && event.notification.data ? event.notification.data.action : '';
  event.waitUntil((async () => {
    const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if ('focus' in client) {
        await client.focus();
        if (action) {
          try { client.postMessage({ type: 'SMART_REMINDER_ACTION', action }); } catch (e) {}
        }
        return;
      }
    }
    if (self.clients.openWindow) {
      const relTarget = action ? ('./?smart_action=' + encodeURIComponent(action)) : './';
      const targetUrl = new URL(relTarget, self.location.href).href;
      await self.clients.openWindow(targetUrl);
    }
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  /* Исключаем /.well-known/ (assetlinks.json, apple-app-site-association)
     для прямой отдачи сервером верификационных файлов Google Play и Apple. */
  if (url.pathname.indexOf('/.well-known/') !== -1) {
    return;
  }

  if (url.hostname === 'api.alquran.cloud' || url.hostname === 'api.quran.foundation') {
    event.respondWith(networkFirst(req));
    return;
  }

  if (url.hostname === 'cloud.umami.is' || url.hostname === 'gateway.umami.is') {
    return;
  }

  /* Контур 2 — ленивое runtime-кэширование контента из data/ в CACHE_DATA */
  if (isSameOrigin && (url.pathname.indexOf(SW_BASE_PATH + 'data/') === 0 || url.pathname.indexOf('/data/') !== -1)) {
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
    const isPreviewHost = /(^|\.)run\.app$|^(localhost|127\.0\.0\.1)$/i.test(self.location.hostname);
    event.respondWith(isPreviewHost ? networkFirst(req) : cacheFirst(req, CACHE_STATIC));
    return;
  }
});

const DATA_CACHE_MAX_ENTRIES = 150;
const NETWORK_TIMEOUT_MS = 8000;

async function fetchWithTimeout(req, timeoutMs) {
  var limit = typeof timeoutMs === 'number' ? timeoutMs : NETWORK_TIMEOUT_MS;
  if (typeof AbortController !== 'function') {
    return fetch(req);
  }
  var ctrl = new AbortController();
  var timer = setTimeout(function () {
    try { ctrl.abort(); } catch (e) {}
  }, limit);
  try {
    return await fetch(req, { signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function trimCacheLRU(cache, maxItems) {
  try {
    var limit = typeof maxItems === 'number' ? maxItems : DATA_CACHE_MAX_ENTRIES;
    var keys = await cache.keys();
    if (keys.length <= limit) return;
    var overflow = keys.length - limit;
    for (var i = 0; i < overflow; i++) {
      await cache.delete(keys[i]);
    }
  } catch (e) {}
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req, { ignoreSearch: false });
  if (cached) return cached;
  try {
    const res = await fetchWithTimeout(req, NETWORK_TIMEOUT_MS);
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
  const cache = await caches.open(CACHE_CORE);
  try {
    const res = await fetchWithTimeout(req, NETWORK_TIMEOUT_MS);
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
    const res = await fetchWithTimeout(req, NETWORK_TIMEOUT_MS);
    if (res && (res.ok || res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400))) return res;
    throw new Error('non-ok');
  } catch (e) {
    const cache = await caches.open(CACHE_CORE);
    const cached =
      (await cache.match(req)) ||
      (await cache.match(new URL('./index.html', self.location.href).href)) ||
      (await cache.match(new URL('./', self.location.href).href));
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
  const networkPromise = fetchWithTimeout(req, NETWORK_TIMEOUT_MS)
    .then(async (res) => {
      if (res && res.ok) {
        try {
          await cache.put(req, res.clone());
          if (cacheName === CACHE_DATA) await trimCacheLRU(cache, DATA_CACHE_MAX_ENTRIES);
        } catch (e) {}
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
