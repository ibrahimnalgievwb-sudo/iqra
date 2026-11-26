"use strict";

/* ============================================================
   API.JS — Загрузка JSON-данных, офлайн-таджвид (чанки), парсер со стеком
   Проект «Икра» · v450
   ============================================================ */

/* ---------- BASE_URL (работает и на /iqra/, и на корневом /, и в Capacitor) ---------- */
function getIqraBaseUrl() {
  try {
    var rawUri = (typeof document !== 'undefined' && document.baseURI) ? document.baseURI : (typeof location !== 'undefined' ? location.href : '');
    if (rawUri) {
      var u = new URL(rawUri);
      if (!u.pathname.endsWith('/') && !/\.[a-zA-Z0-9]+$/.test(u.pathname)) {
        u.pathname += '/';
        return u.href;
      }
      return new URL('./', u.href).href;
    }
  } catch (e) {}
  return './';
}

function iqraResolveUrl(relPath) {
  var raw = String(relPath == null ? './' : relPath);
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  var clean = raw.replace(/^\/+/, './');
  var base = getIqraBaseUrl();
  try {
    if (base && base !== './') {
      return new URL(clean, base).href;
    }
  } catch (e) {}
  return clean;
}

var BASE_URL = getIqraBaseUrl();
window.IQRA_BASE_URL = BASE_URL;
window.getIqraBaseUrl = getIqraBaseUrl;
window.iqraResolveUrl = iqraResolveUrl;

function trackEvent(name, title) {
  try {
    if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') return;
    if (typeof window !== 'undefined' && window.doNotTrack === '1') return;
    if (typeof state !== 'undefined' && state && state.settings && state.settings.analytics === false) return;
    if (window.umami && typeof window.umami.track === 'function') {
      window.umami.track(String(name).slice(0, 100), { title: String(title || name).slice(0, 200) });
    }
  } catch (e) {}
}

var DEFAULT_TASBIHS = [];
var PRESETS = [];
var TAWHID_TASBIH = null;
var ISTIGHFAR_TASBIH = null;
var DEFAULT_DUAS = [];
var DEFAULT_HADITHS = [];
var DEFAULT_QURAN = [];
var ALL_TAGS = [];
var BISMILLAH = null;
var NIGHT_ORDER = [];
var TAJWEED_TAG_MAP = {};
var TAJWEED_RULE_NAMES = {};
var TAJWEED_RULE_COLORS = {};
var DEFAULT_TAFSIRS = [];
var DEFAULT_BIOGRAPHIES = [];
var GRAPH_EDGES = [];
var GRAPH_THEMES = [];
var GRAPH_SCHOLARS = [];

var _UNSAFE_JSON_KEYS = { '__proto__': true, 'constructor': true, 'prototype': true };

function _stripUnsafeJsonKeys(val, depth) {
  if (val === null || typeof val !== 'object') return val;
  if ((depth || 0) > 40) return undefined;
  if (Array.isArray(val)) {
    return val.map(function (item) { return _stripUnsafeJsonKeys(item, (depth || 0) + 1); });
  }
  var clean = {};
  var keys = Object.keys(val);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (Object.prototype.hasOwnProperty.call(_UNSAFE_JSON_KEYS, k)) continue;
    clean[k] = _stripUnsafeJsonKeys(val[k], (depth || 0) + 1);
  }
  return clean;
}

function safeJsonParseGuarded(text) {
  var parsed = JSON.parse(text);
  return _stripUnsafeJsonKeys(parsed, 0);
}

window.IqraJsonGuard = {
  sanitize: _stripUnsafeJsonKeys,
  parse: safeJsonParseGuarded
};

// Безопасная загрузка JSON, чтобы ошибка в одном файле не ломала всё приложение
async function safeFetchJSON(url, fallback) {
  if (fallback === undefined) fallback = {};
  try {
    var res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var text = await res.text();
    if (!text) return fallback;
    return safeJsonParseGuarded(text);
  } catch (e) {
    console.warn('[API] Ошибка загрузки/парсинга ' + url + ':', e.message);
    return fallback;
  }
}

async function loadAllData() {
  var results = await Promise.all([
    safeFetchJSON(iqraResolveUrl('./data/tasbihs.json'), { defaults: [], presets: [] }),
    safeFetchJSON(iqraResolveUrl('./data/duas.json'), { duas: [] }),
    safeFetchJSON(iqraResolveUrl('./data/hadiths.json'), { hadiths: [] }),
    safeFetchJSON(iqraResolveUrl('./data/quran.json'), { quran: [] }),
    safeFetchJSON(iqraResolveUrl('./data/knowledge-base.json'), {}),
    safeFetchJSON(iqraResolveUrl('./data/tafsirs.json'), { tafsirs: [] }),
    safeFetchJSON(iqraResolveUrl('./data/tafsirs_fatiha.json'), { tafsirs: [], biographies: [] }),
    safeFetchJSON(iqraResolveUrl('./data/graph/edges.json'), []),
    safeFetchJSON(iqraResolveUrl('./data/graph/themes.json'), []),
    safeFetchJSON(iqraResolveUrl('./data/graph/scholars.json'), { scholars: [] })
  ]);

  var tasbihsData = results[0];
  var duasData = results[1];
  var hadithsData = results[2];
  var quranData = results[3];
  var knowledgeData = results[4];
  var tafsirsData = results[5];
  var fatihaData = results[6];
  var edgesData = results[7];
  var themesData = results[8];
  var scholarsData = results[9];

  DEFAULT_TASBIHS = tasbihsData.defaults || [];
  PRESETS = tasbihsData.presets || [];
  TAWHID_TASBIH = DEFAULT_TASBIHS.find(function (t) { return t.id === 'tawhid'; }) || DEFAULT_TASBIHS[0] || null;
  ISTIGHFAR_TASBIH = DEFAULT_TASBIHS.find(function (t) { return t.id === 'istighfar'; }) || DEFAULT_TASBIHS[1] || null;
  DEFAULT_DUAS = duasData.duas || [];
  DEFAULT_HADITHS = hadithsData.hadiths || [];
  DEFAULT_QURAN = quranData.quran || [];
  ALL_TAGS = knowledgeData.allTags || [];
  BISMILLAH = knowledgeData.bismillah || null;
  NIGHT_ORDER = knowledgeData.nightOrder || [];
  TAJWEED_TAG_MAP = knowledgeData.tajweedTagMap || {};
  TAJWEED_RULE_NAMES = knowledgeData.tajweedRuleNames || {};
  TAJWEED_RULE_COLORS = knowledgeData.tajweedRuleColors || {};

  // Объединение тафсиров
  var baseTafsirs = tafsirsData.tafsirs || [];
  var fatihaTafsirs = fatihaData.tafsirs || [];
  var fatihaByKey = {};
  fatihaTafsirs.forEach(function (t) {
    if (t && t.surah != null && t.ayah != null) {
      fatihaByKey[t.surah + ':' + t.ayah] = t;
    }
  });
  var mergedTafsirs = baseTafsirs.map(function (t) {
    var key = (t.surah != null && t.ayah != null) ? (t.surah + ':' + t.ayah) : null;
    if (key && fatihaByKey[key]) return fatihaByKey[key];
    return t;
  });
  fatihaTafsirs.forEach(function (t) {
    if (!t || t.surah == null || t.ayah == null) return;
    var key = t.surah + ':' + t.ayah;
    var exists = mergedTafsirs.some(function (x) { return x.surah != null && x.ayah != null && (x.surah + ':' + x.ayah) === key; });
    if (!exists) mergedTafsirs.push(t);
  });
  DEFAULT_TAFSIRS = mergedTafsirs;
  var baseBios = fatihaData.biographies || [];
  GRAPH_EDGES = Array.isArray(edgesData) ? edgesData : (edgesData && edgesData.edges) || [];
  GRAPH_THEMES = Array.isArray(themesData) ? themesData : (themesData && themesData.themes) || [];
  GRAPH_SCHOLARS = Array.isArray(scholarsData) ? scholarsData : (scholarsData && scholarsData.scholars) || [];

  DEFAULT_BIOGRAPHIES = (typeof IqraScholars !== 'undefined' && typeof IqraScholars.mergeBiographies === 'function')
    ? IqraScholars.mergeBiographies(baseBios, GRAPH_SCHOLARS)
    : baseBios;

  window.DEFAULT_QURAN = DEFAULT_QURAN;
  window.DEFAULT_DUAS = DEFAULT_DUAS;
  window.DEFAULT_HADITHS = DEFAULT_HADITHS;
  window.DEFAULT_TASBIHS = DEFAULT_TASBIHS;
  window.DEFAULT_TAFSIRS = DEFAULT_TAFSIRS;
  window.DEFAULT_BIOGRAPHIES = DEFAULT_BIOGRAPHIES;
  window.GRAPH_EDGES = GRAPH_EDGES;
  window.GRAPH_THEMES = GRAPH_THEMES;
  window.GRAPH_SCHOLARS = GRAPH_SCHOLARS;

  return {
    tasbihs: DEFAULT_TASBIHS, presets: PRESETS, duas: DEFAULT_DUAS, hadiths: DEFAULT_HADITHS, quran: DEFAULT_QURAN,
    allTags: ALL_TAGS, bismillah: BISMILLAH, nightOrder: NIGHT_ORDER, tajweedTagMap: TAJWEED_TAG_MAP,
    tajweedRuleNames: TAJWEED_RULE_NAMES, tajweedRuleColors: TAJWEED_RULE_COLORS,
    tafsirs: DEFAULT_TAFSIRS, biographies: DEFAULT_BIOGRAPHIES,
    edges: GRAPH_EDGES, themes: GRAPH_THEMES, scholars: GRAPH_SCHOLARS
  };
}

function getTafsirForAyah(surah, ayah) {
  if (!Array.isArray(DEFAULT_TAFSIRS)) return null;
  return DEFAULT_TAFSIRS.find(function (t) {
    return t && t.surah === surah && t.ayah === ayah;
  }) || null;
}

function getBiographyById(id) {
  if (typeof IqraScholars !== 'undefined' && typeof IqraScholars.getScholarById === 'function') {
    return IqraScholars.getScholarById(id, DEFAULT_BIOGRAPHIES, GRAPH_SCHOLARS);
  }
  if (!Array.isArray(DEFAULT_BIOGRAPHIES)) return null;
  return DEFAULT_BIOGRAPHIES.find(function (b) { return b && b.id === id; }) || null;
}

/* ---------- OFFLINE TAJWEED (статические чанки в RAM без localStorage) ---------- */
var TAJWEED_MANIFEST_URL = './data/tajweed/manifest.json';
var _tajweedManifestPromise = null;
var _tajweedChunkCache = {};
var _tajweedSurahCache = {};

function _isValidTajweedText(text) {
  return typeof text === 'string' && text.length > 0 && /\[[a-zA-Z](?::\d+)?\[/.test(text);
}

function _loadTajweedManifest() {
  if (!_tajweedManifestPromise) {
    _tajweedManifestPromise = safeFetchJSON(iqraResolveUrl(TAJWEED_MANIFEST_URL), null);
  }
  return _tajweedManifestPromise;
}

async function fetchTajweedSurah(surahNumber) {
  var sKey = String(parseInt(surahNumber, 10));
  if (!sKey || sKey === 'NaN') return null;
  if (_tajweedSurahCache[sKey]) return _tajweedSurahCache[sKey];

  var manifest = await _loadTajweedManifest();
  var chunkFile = manifest && manifest.chunks ? manifest.chunks[sKey] : null;
  if (!chunkFile) return null;

  if (!_tajweedChunkCache[chunkFile]) {
    _tajweedChunkCache[chunkFile] = safeFetchJSON(iqraResolveUrl('./data/tajweed/' + chunkFile), null);
  }
  var chunkData = await _tajweedChunkCache[chunkFile];
  if (!chunkData || !chunkData.surahs) return null;

  var surahMap = chunkData.surahs[sKey] || null;
  if (surahMap) {
    _tajweedSurahCache[sKey] = surahMap;
  }
  return surahMap;
}

async function fetchTajweedText(verseKey) {
  var parts = String(verseKey || '').split(':');
  if (parts.length !== 2) return null;
  var sNum = parseInt(parts[0], 10);
  var aKey = String(parseInt(parts[1], 10));
  if (!Number.isFinite(sNum) || aKey === 'NaN') return null;
  var map = await fetchTajweedSurah(sNum);
  return (map && map[aKey]) ? map[aKey] : null;
}

function renderTajweedForElement(el, ayahBlock, surahMap) {
  if (!el || !ayahBlock) return false;
  var verseKey = ayahBlock.dataset.verseKey;
  if (!verseKey) return false;
  var parts = verseKey.split(':');
  var ayahNum = parts.length === 2 ? String(parseInt(parts[1], 10)) : '';
  var tajweedText = surahMap && ayahNum ? surahMap[ayahNum] : null;
  var raw = el.dataset.raw || '';
  var existingMarker = el.querySelector('.read-ayah-marker');
  var markerHtml = existingMarker
    ? existingMarker.outerHTML
    : (el.dataset.marker ? '<span class="read-ayah-marker">' + esc(el.dataset.marker) + '</span>' : '');
  var markerSuffix = markerHtml ? ' ' + markerHtml : '';

  if (tajweedText && _isValidTajweedText(tajweedText)) {
    var result = renderTajweedHtml(tajweedText);
    el.innerHTML = result.text + markerSuffix;
    el.classList.add('has-tajweed');
    var existingRules = ayahBlock.querySelector('.ayah-tajweed-rules');
    if (existingRules) existingRules.remove();
    if (result.rules) {
      var rulesHolder = document.createElement('div');
      rulesHolder.innerHTML = result.rules;
      if (rulesHolder.firstElementChild) {
        el.insertAdjacentElement('afterend', rulesHolder.firstElementChild);
      }
    }
    return true;
  }
  el.innerHTML = esc(raw) + markerSuffix;
  el.classList.remove('has-tajweed');
  return false;
}

async function applyTajweedToContainer(container, item) {
  if (!container || !item) return;
  var elements = container.querySelectorAll('.read-ayah-ar');
  if (!elements.length) return;

  var loader = document.createElement('div');
  loader.className = 'tajweed-loading';
  loader.textContent = 'Подготовка правил таджвида…';
  container.insertBefore(loader, container.firstChild);

  var success = false;
  var errorMsg = '';
  try {
    if (item.type === 'surah') {
      var surahMap = await fetchTajweedSurah(item.number);
      if (surahMap) {
        success = true;
        Array.prototype.forEach.call(elements, function (el) {
          var ayahBlock = el.closest('.read-ayah');
          renderTajweedForElement(el, ayahBlock, surahMap);
        });
      } else {
        errorMsg = 'Чанк таджвида недоступен';
      }
    } else {
      var surahMapsByNum = {};
      var arr = Array.prototype.slice.call(elements);
      for (var idx = 0; idx < arr.length; idx++) {
        var el = arr[idx];
        var ayahBlock = el.closest('.read-ayah');
        var vk = ayahBlock ? ayahBlock.dataset.verseKey : '';
        if (!vk) continue;
        var sNum = parseInt(vk.split(':')[0], 10);
        if (!Number.isFinite(sNum)) continue;
        if (!Object.prototype.hasOwnProperty.call(surahMapsByNum, sNum)) {
          surahMapsByNum[sNum] = await fetchTajweedSurah(sNum);
        }
        if (renderTajweedForElement(el, ayahBlock, surahMapsByNum[sNum])) {
          success = true;
        }
      }
      if (!success) errorMsg = 'Разметка для отрывка не найдена';
    }
  } catch (e) {
    errorMsg = e && e.message ? e.message : 'Ошибка разбора';
  }

  if (loader.parentNode) {
    if (success) {
      loader.parentNode.removeChild(loader);
    } else {
      var retryId = activeReadId || (item && item.id) || '';
      loader.className = 'tajweed-error';
      loader.textContent = 'Таджвид временно недоступен' + (errorMsg ? ' (' + errorMsg + ')' : '') + '. ';
      var retryBtn = document.createElement('button');
      retryBtn.type = 'button';
      retryBtn.className = 'tajweed-retry-link';
      retryBtn.textContent = 'Повторить';
      retryBtn.addEventListener('click', function () {
        if (typeof closeRead === 'function') closeRead();
        setTimeout(function () {
          if (typeof openRead === 'function') openRead(retryId);
        }, 100);
      });
      loader.appendChild(retryBtn);
      setTimeout(function () { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 8000);
    }
  }
}

/* Рекурсивный стек-парсер разметки таджвида (поддерживает вложенные теги без утечки скобок) */
function renderTajweedHtml(text, tagMap, ruleNames) {
  if (!text) return { text: '', rules: '' };
  var tMap = tagMap || TAJWEED_TAG_MAP || {};
  var rNames = ruleNames || TAJWEED_RULE_NAMES || {};
  var rulesFound = new Set();
  var escFn = (typeof esc === 'function')
    ? esc
    : function (s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
      };

  var str = String(text);
  var len = str.length;
  var i = 0;

  function parseSegment(stopOnClose) {
    var out = '';
    var plainStart = i;

    function flush(endIdx) {
      if (endIdx > plainStart) out += escFn(str.slice(plainStart, endIdx));
    }

    while (i < len) {
      var ch = str[i];
      if (stopOnClose && ch === ']') {
        flush(i);
        i++; // потребляем закрывающую ']'
        plainStart = i;
        return out;
      }
      if (ch === '[') {
        var rest = str.slice(i);
        var m = rest.match(/^\[([a-zA-Z])(?::\d+)?\[/);
        if (m) {
          flush(i);
          var code = m[1].toLowerCase();
          var rule = tMap[code];
          i += m[0].length;
          plainStart = i;
          var innerHtml = parseSegment(true);
          plainStart = i;
          if (rule) {
            rulesFound.add(rule);
            out += '<span class="tajweed-' + escFn(rule) + '">' + innerHtml + '</span>';
          } else {
            out += innerHtml;
          }
          continue;
        }
      }
      i++;
    }
    flush(len);
    return out;
  }

  var html = parseSegment(false);

  var rulesHtml = '';
  if (rulesFound.size > 0) {
    var items = Array.from(rulesFound).map(function (rule) {
      return '<span class="rule-item"><i class="tajweed-' + escFn(rule) + '"></i>' + escFn(rNames[rule] || rule) + '</span>';
    }).join('');
    rulesHtml = '<div class="ayah-tajweed-rules">' + items + '</div>';
  }
  return { text: html, rules: rulesHtml };
}

window.IqraTajweed = {
  renderTajweedHtml: renderTajweedHtml,
  isValidTajweedText: _isValidTajweedText,
  fetchTajweedSurah: fetchTajweedSurah
};
