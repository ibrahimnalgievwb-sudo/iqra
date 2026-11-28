"use strict";

/* ============================================================
   STORAGE-SNAPSHOT.JS — Версионированные снимки прогресса
   Проект «Икра» · v470
   Экспортирует ТОЛЬКО пользовательский прогресс и настройки
   (без статических текстов Корана, дуа, хадисов и CNAME),
   поддерживает schemaVersion: 1 и обратную совместимость
   с плоским форматом BACKUP_SCHEMA v3.
   ============================================================ */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.IqraSnapshot = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  var SCHEMA_VERSION = 1;
  var MAX_SNAPSHOT_BYTES = 5 * 1024 * 1024; // 5 МБ

  function stripProtoKeys(val, depth) {
    if (val === null || typeof val !== 'object') return val;
    if ((depth || 0) > 40) return undefined;
    if (Array.isArray(val)) {
      return val.map(function (x) { return stripProtoKeys(x, (depth || 0) + 1); });
    }
    var out = {};
    Object.keys(val).forEach(function (k) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') return;
      out[k] = stripProtoKeys(val[k], (depth || 0) + 1);
    });
    return out;
  }

  function _buildFallbackCompact(appState) {
    if (!appState || typeof appState !== 'object') return null;
    var qProgress = {};
    if (appState.quranProgress && typeof appState.quranProgress === 'object' && !Array.isArray(appState.quranProgress)) {
      Object.keys(appState.quranProgress).forEach(function (id) {
        var val = appState.quranProgress[id];
        if (val && val.learned) qProgress[id] = { learned: true, learnedAt: val.learnedAt || '' };
      });
    } else if (Array.isArray(appState.quran)) {
      appState.quran.forEach(function (q) {
        if (q && q.id && q.learned) qProgress[q.id] = { learned: true, learnedAt: q.learnedAt || '' };
      });
    }
    return {
      tasbihs: Array.isArray(appState.tasbihs) ? appState.tasbihs : [],
      history: (appState.history && typeof appState.history === 'object') ? appState.history : {},
      settings: (appState.settings && typeof appState.settings === 'object') ? appState.settings : {},
      reminders: Array.isArray(appState.reminders) ? appState.reminders : [],
      draft: appState.draft || null,
      duas: Array.isArray(appState.duas) ? appState.duas : [],
      hadiths: Array.isArray(appState.hadiths) ? appState.hadiths : [],
      quranProgress: qProgress,
      favorites: Array.isArray(appState.favorites) ? appState.favorites : [],
      bookmarks: Array.isArray(appState.bookmarks) ? appState.bookmarks : [],
      migrations: (appState.migrations && typeof appState.migrations === 'object') ? appState.migrations : {}
    };
  }

  function exportUserSnapshot(appState, opts) {
    var compact = (typeof serializeCompactState === 'function')
      ? serializeCompactState(appState)
      : _buildFallbackCompact(appState);
    if (!compact) return null;
    var legacyVer = (opts && typeof opts.legacySchema === 'number')
      ? opts.legacySchema
      : (typeof BACKUP_SCHEMA === 'number' ? BACKUP_SCHEMA : 3);
    return {
      schemaVersion: SCHEMA_VERSION,
      __schema: legacyVer,
      app: 'iqra',
      exportedAt: new Date().toISOString(),
      payload: stripProtoKeys(compact, 0)
    };
  }

  function unwrapEnvelope(rawInput) {
    var clean = stripProtoKeys(rawInput, 0);
    if (!clean || typeof clean !== 'object' || Array.isArray(clean)) return null;
    if (typeof clean.schemaVersion === 'number') {
      if (clean.schemaVersion !== SCHEMA_VERSION) return null;
      if (!clean.payload || typeof clean.payload !== 'object' || Array.isArray(clean.payload)) return null;
      return clean.payload;
    }
    return clean;
  }

  function parseAndValidateSnapshot(rawOrObj, validateFn) {
    var obj = rawOrObj;
    if (typeof rawOrObj === 'string') {
      if (rawOrObj.length > MAX_SNAPSHOT_BYTES) return null;
      try {
        obj = (typeof safeJsonParseGuarded === 'function')
          ? safeJsonParseGuarded(rawOrObj)
          : JSON.parse(rawOrObj);
      } catch (e) {
        return null;
      }
    } else if (obj && typeof obj === 'object') {
      try {
        var approxSize = JSON.stringify(obj).length;
        if (approxSize > MAX_SNAPSHOT_BYTES) return null;
      } catch (e) {
        return null;
      }
    }

    var unwrapped = unwrapEnvelope(obj);
    if (!unwrapped) return null;
    if (typeof validateFn === 'function') {
      return validateFn(unwrapped);
    }
    if (!Array.isArray(unwrapped.tasbihs)) return null;
    return unwrapped;
  }

  return {
    SCHEMA_VERSION: SCHEMA_VERSION,
    MAX_SNAPSHOT_BYTES: MAX_SNAPSHOT_BYTES,
    stripProtoKeys: stripProtoKeys,
    exportUserSnapshot: exportUserSnapshot,
    unwrapEnvelope: unwrapEnvelope,
    parseAndValidateSnapshot: parseAndValidateSnapshot
  };
});
