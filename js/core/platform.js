"use strict";

/* ============================================================
   PLATFORM.JS — Кросс-девайсные фолбэки и Feature Detection
   Проект «Икра» · v470
   Оборачивает браузерные API (vibrate, MediaSession, IO,
   requestIdleCallback, localStorage, WebAudio, backdrop-filter,
   100dvh), чтобы iOS 15+ Safari/PWA, Android, Desktop и
   тестовые песочницы работали без единой ошибки.
   ============================================================ */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.IqraPlatform = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  var _memStorage = new Map();

  function _safeHasNativeStorage() {
    try {
      if (typeof localStorage === 'undefined' || !localStorage) return false;
      var k = '__iqra_probe__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  function _probeFeatures() {
    var hasNav = typeof navigator !== 'undefined' && navigator !== null;
    var hasCss = typeof CSS !== 'undefined' && CSS && typeof CSS.supports === 'function';
    var hasWin = typeof window !== 'undefined' && window !== null;

    var dvh = false;
    var backdropFilter = false;
    try {
      if (hasCss) {
        dvh = CSS.supports('height', '100dvh');
        backdropFilter = CSS.supports('backdrop-filter', 'blur(1px)') ||
          CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
      }
    } catch (e) {}

    return {
      vibrate: !!(hasNav && 'vibrate' in navigator && typeof navigator.vibrate === 'function'),
      mediaSession: !!(hasNav && 'mediaSession' in navigator && navigator.mediaSession),
      intersectionObserver: typeof IntersectionObserver === 'function',
      webAudio: !!(hasWin && (typeof window.AudioContext === 'function' || typeof window.webkitAudioContext === 'function')),
      backdropFilter: backdropFilter,
      idleCallback: typeof requestIdleCallback === 'function',
      dvh: dvh,
      nativeStorage: _safeHasNativeStorage()
    };
  }

  var features = _probeFeatures();

  function safeVibrate(pattern, options) {
    try {
      var respectPref = !options || options.ignoreSetting !== true;
      if (respectPref && typeof state !== 'undefined' && state && state.settings && state.settings.vibrate === false) {
        return false;
      }
      if (typeof navigator !== 'undefined' && navigator && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
        return !!navigator.vibrate(pattern);
      }
    } catch (e) {}
    return false;
  }

  function safeIdleCallback(fn, opts) {
    if (typeof fn !== 'function') return 0;
    try {
      if (typeof requestIdleCallback === 'function') {
        return requestIdleCallback(fn, opts || { timeout: 800 });
      }
    } catch (e) {}
    var delay = (opts && typeof opts.fallbackDelay === 'number') ? opts.fallbackDelay : 120;
    return setTimeout(function () {
      try {
        fn({ didTimeout: false, timeRemaining: function () { return 0; } });
      } catch (e) {}
    }, delay);
  }

  function cancelSafeIdleCallback(id) {
    if (!id) return;
    try {
      if (typeof cancelIdleCallback === 'function') {
        cancelIdleCallback(id);
        return;
      }
    } catch (e) {}
    try { clearTimeout(id); } catch (e) {}
  }

  var safeStorage = {
    getItem: function (key) {
      var k = String(key);
      try {
        if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.getItem === 'function') {
          var v = localStorage.getItem(k);
          if (v !== null && v !== undefined) return v;
        }
      } catch (e) {}
      return _memStorage.has(k) ? _memStorage.get(k) : null;
    },

    setItem: function (key, value) {
      var k = String(key);
      var v = String(value);
      _memStorage.set(k, v);
      try {
        if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.setItem === 'function') {
          localStorage.setItem(k, v);
          return true;
        }
      } catch (e) {
        if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
          if (typeof showMarkToast === 'function') {
            showMarkToast('Хранилище заполнено. Сохраните бэкап и очистите старую историю.', 4500);
          }
        }
        return false;
      }
      return true;
    },

    removeItem: function (key) {
      var k = String(key);
      _memStorage.delete(k);
      try {
        if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.removeItem === 'function') {
          localStorage.removeItem(k);
        }
      } catch (e) {}
    },

    keys: function () {
      var out = new Set(_memStorage.keys());
      try {
        if (typeof localStorage !== 'undefined' && localStorage) {
          if (typeof localStorage.length === 'number' && typeof localStorage.key === 'function') {
            for (var i = 0; i < localStorage.length; i++) {
              var k = localStorage.key(i);
              if (k !== null && k !== undefined) out.add(k);
            }
          } else {
            Object.keys(localStorage).forEach(function (k) { out.add(k); });
          }
        }
      } catch (e) {}
      return Array.from(out);
    }
  };

  var safeMediaSession = {
    setMetadata: function (meta) {
      try {
        if (typeof navigator !== 'undefined' && navigator && 'mediaSession' in navigator && navigator.mediaSession && typeof MediaMetadata === 'function') {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: String((meta && meta.title) || 'Iqra'),
            artist: String((meta && meta.artist) || 'Коран'),
            album: String((meta && meta.album) || 'Iqra · e-iqra.ru')
          });
          return true;
        }
      } catch (e) {}
      return false;
    },

    setPlaybackState: function (stateStr) {
      try {
        if (typeof navigator !== 'undefined' && navigator && 'mediaSession' in navigator && navigator.mediaSession) {
          navigator.mediaSession.playbackState = stateStr;
          return true;
        }
      } catch (e) {}
      return false;
    },

    setActionHandler: function (action, handler) {
      try {
        if (typeof navigator !== 'undefined' && navigator && 'mediaSession' in navigator && navigator.mediaSession && typeof navigator.mediaSession.setActionHandler === 'function') {
          navigator.mediaSession.setActionHandler(action, handler);
          return true;
        }
      } catch (e) {}
      return false;
    }
  };

  return {
    features: features,
    probeFeatures: _probeFeatures,
    safeVibrate: safeVibrate,
    safeIdleCallback: safeIdleCallback,
    cancelSafeIdleCallback: cancelSafeIdleCallback,
    safeStorage: safeStorage,
    safeMediaSession: safeMediaSession
  };
});
