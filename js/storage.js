"use strict";

/* ============================================================
   STORAGE.JS — Состояние, компактное хранение прогресса, миграции
   Проект «Икра» · v450
   Компактность: 114 сур (DEFAULT_QURAN) живут только в памяти,
   в localStorage сохраняются лишь отметки прогресса quranProgress.
   ============================================================ */

const STORAGE_KEY = 'iqra_data';
const APP_URL = 'https://ibrahimnalgievwb-sudo.github.io/iqra/';

const BACKUP_SCHEMA = 3;
const LIMITS = { tasbihs: 1000, history: 10000, historyDays: 365, reminders: 50, textLen: 1000, idLen: 100, targetMax: 100000, cyclesMax: 1000000 };
const QURAN_USE_API = false;

var state = null;

function cloneData(obj) {
  if (typeof structuredClone === 'function') {
    try { return structuredClone(obj); } catch (e) {}
  }
  return JSON.parse(JSON.stringify(obj));
}

function defaultSettings() {
  return {
    theme: 'auto',
    arSize: 1,
    dailyGoal: 100,
    autoNext: true,
    wakeLock: true,
    vibrate: true,
    goalNotify: false,
    tajweedMode: false,
    lastRead: null,
    lastScreen: null,
    readScrolls: {},
    readAyah: {},
    seenGuides: {},
    readerPrefs: { showTranscription: true, pageBatch: 40 },
    prayerPrefs: { method: 'dum_rf', asrMadhhab: 'shafii', city: '', lat: null, lng: null, timezone: '' },
    syncPrefs: { autoBackupHint: false, lastLocalSyncAt: 0 },
    smartReminders: (typeof IqraSmartReminders !== 'undefined') ? IqraSmartReminders.defaultPrefs() : {
      enabled: true, browserNotify: false, quietStart: '23:00', quietEnd: '05:00',
      categories: { adhkar: true, night: true, friday: true, motivation: true },
      mutedDate: '', dismissed: {}, notified: {}
    },
    nightChecklist: { date: '', done: [] },
    widgetPrefs: { enabled: ['goal_ring', 'night_check', 'mini_tasbih', 'daily_dhikr'] }
  };
}

function buildQuranProgressMap(quranList) {
  var map = {};
  if (!Array.isArray(quranList)) return map;
  quranList.forEach(function (q) {
    if (q && q.id && q.learned) {
      map[q.id] = { learned: true, learnedAt: q.learnedAt || '' };
    }
  });
  return map;
}

function hydrateQuranFromProgress(progressMap) {
  var baseList = (typeof DEFAULT_QURAN !== 'undefined' && Array.isArray(DEFAULT_QURAN)) ? DEFAULT_QURAN : [];
  var map = (progressMap && typeof progressMap === 'object' && !Array.isArray(progressMap)) ? progressMap : {};
  return baseList.map(function (item) {
    var copy = Object.assign({}, item);
    var p = map[item.id];
    copy.learned = !!(p && p.learned);
    copy.learnedAt = (p && p.learned && typeof p.learnedAt === 'string') ? p.learnedAt : '';
    return copy;
  });
}

function _compactCatalogEntries(list, defaults) {
  if (!Array.isArray(list)) return [];
  var defIds = new Set(Array.isArray(defaults) ? defaults.map(function (d) { return d && d.id; }) : []);
  var out = [];
  list.forEach(function (item) {
    if (!item || !item.id) return;
    if (!defIds.has(item.id)) {
      out.push(item);
    } else if (item.learned) {
      out.push({ id: item.id, learned: true });
    }
  });
  return out;
}

function serializeCompactState(appState) {
  var st = appState && typeof appState === 'object' ? appState : {};
  var defDuas = (typeof DEFAULT_DUAS !== 'undefined' && Array.isArray(DEFAULT_DUAS)) ? DEFAULT_DUAS : [];
  var defHadiths = (typeof DEFAULT_HADITHS !== 'undefined' && Array.isArray(DEFAULT_HADITHS)) ? DEFAULT_HADITHS : [];
  var out = {
    tasbihs: Array.isArray(st.tasbihs) ? st.tasbihs : [],
    history: st.history || {},
    settings: st.settings || defaultSettings(),
    reminders: Array.isArray(st.reminders) ? st.reminders : [],
    draft: st.draft || null,
    duas: _compactCatalogEntries(st.duas, defDuas),
    hadiths: _compactCatalogEntries(st.hadiths, defHadiths),
    quranProgress: buildQuranProgressMap(st.quran && st.quran.length ? st.quran : []),
    favorites: Array.isArray(st.favorites) ? st.favorites : [],
    bookmarks: Array.isArray(st.bookmarks) ? st.bookmarks : [],
    migrations: st.migrations || {},
    updatedAt: Date.now()
  };
  if ((!st.quran || !st.quran.length) && st.quranProgress && typeof st.quranProgress === 'object') {
    out.quranProgress = st.quranProgress;
  }
  return out;
}

function _stripProtoKeys(val, depth) {
  if (val === null || typeof val !== 'object') return val;
  if ((depth || 0) > 40) return undefined;
  if (Array.isArray(val)) return val.map(function (x) { return _stripProtoKeys(x, (depth || 0) + 1); });
  var out = {};
  Object.keys(val).forEach(function (k) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') return;
    out[k] = _stripProtoKeys(val[k], (depth || 0) + 1);
  });
  return out;
}

function load() {
  let s = null;
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) s = _stripProtoKeys(JSON.parse(raw), 0); } catch (e) { s = null; }
  if (!s) {
    const legacyKeys = ['tasbih_app_v13', 'tasbih_app_v12', 'tasbih_app_v11', 'tasbih_app_v10', 'tasbih_app_v9'];
    for (const k of legacyKeys) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = _stripProtoKeys(JSON.parse(raw), 0);
          if (parsed && typeof parsed === 'object') {
            s = parsed;
            break;
          }
        }
      } catch (e) {}
    }
  }
  if (!s) {
    s = {
      tasbihs: cloneData(DEFAULT_TASBIHS),
      history: {},
      settings: defaultSettings(),
      reminders: [],
      draft: null,
      duas: cloneData(DEFAULT_DUAS),
      hadiths: cloneData(DEFAULT_HADITHS),
      quranProgress: {},
      quran: hydrateQuranFromProgress({}),
      migrations: {}
    };
  }

  var defSet = defaultSettings();
  s.settings = Object.assign(defSet, s.settings || {});
  if (typeof s.settings.tajweedMode !== 'boolean') s.settings.tajweedMode = false;
  if (s.settings.theme === 'night') s.settings.theme = 'dark';
  if (s.settings.lastRead && !s.settings.lastRead.type && s.settings.lastRead.quranId) {
    s.settings.lastRead = { type: 'quran', id: s.settings.lastRead.quranId, ts: s.settings.lastRead.ts || Date.now() };
  }
  s.settings.readScrolls = (s.settings.readScrolls && typeof s.settings.readScrolls === 'object' && !Array.isArray(s.settings.readScrolls)) ? s.settings.readScrolls : {};
  s.settings.readAyah = (s.settings.readAyah && typeof s.settings.readAyah === 'object' && !Array.isArray(s.settings.readAyah)) ? s.settings.readAyah : {};
  s.settings.seenGuides = (s.settings.seenGuides && typeof s.settings.seenGuides === 'object' && !Array.isArray(s.settings.seenGuides)) ? s.settings.seenGuides : {};
  s.settings.readerPrefs = Object.assign({}, defSet.readerPrefs, (s.settings.readerPrefs && typeof s.settings.readerPrefs === 'object') ? s.settings.readerPrefs : {});
  s.settings.prayerPrefs = Object.assign({}, defSet.prayerPrefs, (s.settings.prayerPrefs && typeof s.settings.prayerPrefs === 'object') ? s.settings.prayerPrefs : {});
  s.settings.syncPrefs = Object.assign({}, defSet.syncPrefs, (s.settings.syncPrefs && typeof s.settings.syncPrefs === 'object') ? s.settings.syncPrefs : {});
  if (typeof IqraSmartReminders !== 'undefined') {
    s.settings.smartReminders = IqraSmartReminders.sanitizePrefs(s.settings.smartReminders);
  } else {
    s.settings.smartReminders = Object.assign({}, defSet.smartReminders, (s.settings.smartReminders && typeof s.settings.smartReminders === 'object') ? s.settings.smartReminders : {});
  }
  var nc = s.settings.nightChecklist;
  s.settings.nightChecklist = (nc && typeof nc === 'object' && !Array.isArray(nc))
    ? {
        date: (typeof nc.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(nc.date)) ? nc.date : '',
        done: Array.isArray(nc.done) ? nc.done.filter(function (x) { return typeof x === 'number' && isFinite(x) && x >= 0 && x < 50; }).slice(0, 50) : []
      }
    : { date: '', done: [] };
  var wp = s.settings.widgetPrefs;
  var allowedWidgets = ['goal_ring', 'night_check', 'mini_tasbih', 'daily_dhikr'];
  s.settings.widgetPrefs = (wp && typeof wp === 'object' && !Array.isArray(wp) && Array.isArray(wp.enabled))
    ? { enabled: wp.enabled.filter(function (w) { return allowedWidgets.indexOf(w) !== -1; }).slice(0, 8) }
    : { enabled: allowedWidgets.slice() };

  s.reminders = Array.isArray(s.reminders) ? s.reminders : [];
  s.draft = s.draft && typeof s.draft === 'object' ? s.draft : null;
  s.tasbihs = Array.isArray(s.tasbihs) ? s.tasbihs : cloneData(DEFAULT_TASBIHS);
  s.history = s.history && typeof s.history === 'object' ? s.history : {};
  s.duas = Array.isArray(s.duas) ? s.duas : [];
  s.hadiths = Array.isArray(s.hadiths) ? s.hadiths : [];
  s.migrations = s.migrations && typeof s.migrations === 'object' ? s.migrations : {};
  s.favorites = Array.isArray(s.favorites) ? s.favorites : [];
  s.bookmarks = Array.isArray(s.bookmarks) ? s.bookmarks : [];

  // Миграция устаревшего полного массива s.quran -> компактный quranProgress + свежая гидратация из DEFAULT_QURAN
  var extractedProgress = {};
  if (s.quranProgress && typeof s.quranProgress === 'object' && !Array.isArray(s.quranProgress)) {
    Object.keys(s.quranProgress).forEach(function (id) {
      var val = s.quranProgress[id];
      if (val && val.learned) extractedProgress[id] = { learned: true, learnedAt: val.learnedAt || '' };
    });
  }
  if (Array.isArray(s.quran)) {
    s.quran.forEach(function (q) {
      if (q && q.id && q.learned) {
        extractedProgress[q.id] = { learned: true, learnedAt: q.learnedAt || '' };
      }
    });
  }
  s.quranProgress = extractedProgress;
  s.quran = hydrateQuranFromProgress(extractedProgress);

  if (!s.migrations.sanitizeIds_v1) {
    const validId = (id) => (typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id));
    s.tasbihs = s.tasbihs.filter(t => t && typeof t === 'object' && validId(t.id));
    s.duas = s.duas.filter(d => d && typeof d === 'object' && validId(d.id));
    s.hadiths = s.hadiths.filter(h => h && typeof h === 'object' && validId(h.id));
    s.favorites = s.favorites.filter(id => validId(id));
    s.bookmarks = s.bookmarks.filter(b => b && typeof b === 'object' && validId(b.id) && validId(b.quranId));
    s.migrations.sanitizeIds_v1 = true;
  }

  if (!s.migrations.addedTawhid && TAWHID_TASBIH) { if (!s.tasbihs.some(t => t.id === 'tawhid')) s.tasbihs.unshift(cloneData(TAWHID_TASBIH)); s.migrations.addedTawhid = true; }
  if (!s.migrations.addedIstighfar && ISTIGHFAR_TASBIH) { if (!s.tasbihs.some(t => t.id === 'istighfar')) s.tasbihs.splice(1, 0, cloneData(ISTIGHFAR_TASBIH)); s.migrations.addedIstighfar = true; }
  if (!s.migrations.addedDuas) { const ids = new Set(s.duas.map(d => d.id)); for (const d of DEFAULT_DUAS) if (!ids.has(d.id)) s.duas.push(cloneData(d)); s.migrations.addedDuas = true; }
  if (!s.migrations.addedHadiths) { const ids = new Set(s.hadiths.map(h => h.id)); for (const h of DEFAULT_HADITHS) if (!ids.has(h.id)) s.hadiths.push(cloneData(h)); s.migrations.addedHadiths = true; }

  // Удаление устаревших кэшей таджвида из localStorage (теперь используются офлайн-чанки в RAM)
  if (!s.migrations.tajweedOfflineChunks_v1) {
    try {
      var staleKeys = [];
      for (var li = 0; li < localStorage.length; li++) {
        var lk = localStorage.key(li);
        if (lk && lk.indexOf('iqra_tajweed') === 0) staleKeys.push(lk);
      }
      staleKeys.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) {}
    s.migrations.tajweedCacheFix_v3 = true;
    s.migrations.tajweedCacheFix_v4 = true;
    s.migrations.tajweedCacheFix_v5 = true;
    s.migrations.tajweedOfflineChunks_v1 = true;
  }

  /* Единый источник контента для дуа и хадисов (прогресс learned сохраняется) */
  (function canonicalizeContent() {
    function sync(list, defaults) {
      var prev = new Map((Array.isArray(list) ? list : [])
        .filter(function (x) { return x && typeof x === 'object' && x.id; })
        .map(function (x) { return [x.id, x]; }));
      var defIds = new Set(defaults.map(function (d) { return d.id; }));
      var out = defaults.map(function (d) {
        var item = cloneData(d);
        var p = prev.get(d.id);
        if (p) item.learned = !!p.learned;
        return item;
      });
      prev.forEach(function (x, id) { if (!defIds.has(id)) out.push(x); });
      return out;
    }
    if (Array.isArray(DEFAULT_DUAS) && DEFAULT_DUAS.length) s.duas = sync(s.duas, DEFAULT_DUAS);
    if (Array.isArray(DEFAULT_HADITHS) && DEFAULT_HADITHS.length) s.hadiths = sync(s.hadiths, DEFAULT_HADITHS);
    if (typeof DEFAULT_TASBIHS !== 'undefined' && Array.isArray(DEFAULT_TASBIHS) && DEFAULT_TASBIHS.length && Array.isArray(s.tasbihs)) {
      var defTasbihById = new Map(DEFAULT_TASBIHS.map(function (t) { return [t.id, t]; }));
      s.tasbihs.forEach(function (t) {
        if (!t || !t.id) return;
        var defT = defTasbihById.get(t.id);
        if (defT && defT.dalil) t.dalil = defT.dalil;
      });
    }
    if (s.settings) delete s.settings.sound;
  })();

  s.migrations.quran_v15 = true;
  s.migrations.quran_v16 = true;
  s.migrations.compactQuran_v1 = true;

  // Перезаписываем в компактном виде, если старый ключ ещё держал полный текст 25/114 сур
  try {
    var existingRaw = localStorage.getItem(STORAGE_KEY);
    if (existingRaw && existingRaw.indexOf('"quran":[') !== -1) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeCompactState(s)));
    }
  } catch (e) {}

  return s;
}

let _saveTimer = null;
function saveNow() {
  if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
  pruneHistory();
  if (state) state.quranProgress = buildQuranProgressMap(state.quran);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeCompactState(state)));
  } catch (e) {
    if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
      if (typeof showMarkToast === 'function') {
        showMarkToast('Хранилище заполнено. Сохраните бэкап и очистите старую историю.', 4500);
      }
    }
  }
  const ind = document.getElementById('save-indicator');
  if (ind) ind.classList.remove('active');
}

function migrateData() {
  if (!state || !state.migrations || state.migrations.tagsAdded === true) return;
  let changed = false;
  if (Array.isArray(state.duas)) {
    state.duas.forEach(item => {
      if (!Array.isArray(item.tags)) { item.tags = []; changed = true; }
    });
  }
  if (Array.isArray(state.hadiths)) {
    state.hadiths.forEach(item => {
      if (!Array.isArray(item.tags)) { item.tags = []; changed = true; }
    });
  }
  state.migrations.tagsAdded = true;
  if (changed) saveNow();
}

function save() {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(saveNow, 500);
  const ind = document.getElementById('save-indicator');
  if (ind) ind.classList.add('active');
}

function pruneHistory() {
  if (!state || !state.history || typeof state.history !== 'object') return;
  const keys = Object.keys(state.history);
  if (keys.length > LIMITS.historyDays || keys.length > LIMITS.history) {
    keys.sort();
    let toRemove = [];
    if (keys.length > LIMITS.historyDays) toRemove = keys.slice(0, keys.length - LIMITS.historyDays);
    const remaining = keys.filter(k => toRemove.indexOf(k) < 0);
    if (remaining.length > LIMITS.history) toRemove = toRemove.concat(remaining.slice(0, remaining.length - LIMITS.history));
    toRemove.forEach(k => { delete state.history[k]; });
  }
  try {
    var quoteKeys = [];
    for (var qi = 0; qi < localStorage.length; qi++) {
      var qk = localStorage.key(qi);
      if (qk && qk.indexOf('iqra_quote_') === 0) quoteKeys.push(qk);
    }
    if (quoteKeys.length > 7) {
      quoteKeys.sort();
      quoteKeys.slice(0, quoteKeys.length - 7).forEach(function (k) { localStorage.removeItem(k); });
    }
  } catch (e) {}
}

function pad(n) { return n < 10 ? '0' + n : '' + n; }
function todayKey() { return dateKey(new Date()); }
function dateKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function getById(id) { return state.tasbihs.find(t => t.id === id); }
function getDuaById(id) { return state.duas.find(d => d.id === id); }
function getHadithById(id) { return state.hadiths.find(h => h.id === id); }
function getQuranById(id) { return state.quran.find(q => q.id === id); }

function formatHijri(date) {
  try {
    const MONTHS = ['мухаррам', 'сафар', 'раби аль-авваль', 'раби ас-сани', 'джумада аль-уля', 'джумада ас-сания', 'раджаб', 'шаабан', 'рамадан', 'шавваль', 'зуль-када', 'зуль-хиджа'];
    const parts = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(date);
    let d = 1, m = 1, y = 1;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (p.type === 'day') d = parseInt(p.value, 10) || 1;
      else if (p.type === 'month') m = parseInt(p.value, 10) || 1;
      else if (p.type === 'year') y = parseInt(p.value, 10) || 1;
    }
    const monthName = MONTHS[m - 1] || '';
    return d + ' ' + monthName + ' ' + y + ' г. х.';
  } catch (e) { return ''; }
}

function isFavorite(id) { return Array.isArray(state.favorites) && state.favorites.includes(id); }
function toggleFavorite(id) {
  if (!Array.isArray(state.favorites)) state.favorites = [];
  const i = state.favorites.indexOf(id);
  if (i >= 0) {
    state.favorites.splice(i, 1);
    trackEvent('fav_off/' + id, 'Убрано из избранного: ' + id);
    if (typeof showMarkToast === 'function') showMarkToast('Удалено из избранного');
  } else {
    state.favorites.push(id);
    trackEvent('fav_on/' + id, 'В избранное: ' + id);
    if (typeof showMarkToast === 'function') showMarkToast('Сохранено в избранное');
  }
  if (state.settings.vibrate && navigator.vibrate) navigator.vibrate(15);
  save();
}

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function escAttr(s) { return esc(s).replace(/'/g, '&#39;'); }
function escNl(s) { return esc(s).replace(/\n/g, '<br>'); }
function escRich(s) { return esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>'); }

function renderTagLinks(text) {
  if (!text) return '';
  const parts = String(text).split(/(\[\[[^\]]+\]\])/g);
  return parts.map(part => {
    const match = part.match(/^\[\[([^\]]+)\]\]$/);
    if (match) {
      const tag = match[1].trim();
      if (ALL_TAGS.includes(tag)) {
        return `<span class="gold-link" data-tag="${escAttr(tag)}">${esc(tag)}</span>`;
      }
    }
    return esc(part);
  }).join('');
}

function transcriptionNote() {
  return `<div class="transcription-note"><svg class="ico ico-sm tn-icon"><use href="#i-info"/></svg><div>Транскрипция передаёт лишь <b>примерное произношение</b> и не отражает всех тонкостей арабского. Для правильного чтения следует изучить <b>таджвид</b>.</div></div>`;
}

function addToHistory(id, n) {
  const k = todayKey();
  if (!state.history[k]) state.history[k] = { total: 0, byId: {} };
  state.history[k].total += n;
  state.history[k].byId[id] = (state.history[k].byId[id] || 0) + n;
}
function usageCount(id) { let n = 0; for (const k in state.history) n += state.history[k].byId[id] || 0; return n; }
function todayCountFor(id) { const t = state.history[todayKey()]; return t && t.byId[id] ? t.byId[id] : 0; }
function saveLastRead(type, id) { state.settings.lastRead = { type: type, id: id, ts: Date.now() }; save(); }

function normalizeArabic(s) {
  return String(s || '')
    .replace(/[\u064B-\u065F\u0610-\u061A\u0670\u06D6-\u06ED\u0640\u06DD]/g, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0649/g, '\u064A')
    .replace(/\u0624/g, '\u0648')
    .replace(/\u0626/g, '\u064A')
    .replace(/\s+/g, ' ')
    .trim();
}
function parseAyahs(item) {
  if (!item) return [];
  const ar = (item.arabic || '').split('\n').map(s => s.trim()).filter(Boolean);
  const tr = (item.transcription || '').split('\n').map(s => s.trim()).filter(Boolean);
  const trn = (item.translation || '').split('\n').map(s => s.trim()).filter(Boolean);
  const isSurah = item.type === 'surah';
  let perLineNum = null;
  if (!isSurah && item.number) {
    const m = String(item.number).match(/^(\d+):(\d+)(?:-(\d+))?$/);
    if (m) {
      const surahN = m[1], start = parseInt(m[2], 10);
      perLineNum = ar.map((_, i) => surahN + ':' + (start + i));
    }
  }
  return ar.map((line, i) => ({
    num: isSurah ? (i + 1) : (perLineNum ? perLineNum[i] : (item.number || '')),
    ar: line, tr: tr[i] || '', trn: trn[i] || ''
  }));
}
function perLineNumbered(item) {
  if (!item || item.type === 'surah' || !item.number) return false;
  return /^\d+:\d+(?:-\d+)?$/.test(String(item.number));
}
function ayahMarker(n) {
  var num = (typeof n === 'number') ? n : parseInt(String(n).replace(/[^\d]/g, ''), 10);
  if (!num || num < 1 || num > 999) return '';
  var ar = '٠١٢٣٤٥٦٧٨٩';
  var s = String(num).split('').map(function (d) { return ar[+d]; }).join('');
  return '\u06DD' + s;
}

function debounce(fn, wait) {
  let t = null;
  return function () {
    const ctx = this;
    const args = arguments;
    if (t) clearTimeout(t);
    t = setTimeout(function () { t = null; fn.apply(ctx, args); }, wait);
  };
}

function calculateStreak() {
  let streak = 0;
  let d = new Date();
  if (!state.history[todayKey()] || state.history[todayKey()].total === 0) {
    d.setDate(d.getDate() - 1);
  }
  while (true) {
    const key = dateKey(d);
    if (state.history[key] && state.history[key].total > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
function formatDateShort(key) {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return '';
  const [y, m, d] = key.split('-');
  return `${parseInt(d)} ${['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'][parseInt(m) - 1]} ${y}`;
}
