"use strict";

/* ============================================================
   API.JS — Загрузка JSON-данных, Tajweed API, аналитика
   Проект «Икра» · v387 (Этап 3.5)
   Заполняет глобальные DEFAULT_* для storage.js.
   D-10: renderTajweedHtml экранирует всё содержимое через esc().
         trackEvent — только имя+title события, без личных данных.
         Umami (cloud.umami.is) сохранён по решению Директора.
         GoatCounter вызов остаётся, но window.goatcounter
         отсутствует — безопасный no-op.
   ============================================================ */

const UMAMI_SRC        = 'https://cloud.umami.is/script.js';
const UMAMI_WEBSITE_ID = 'ccc49755-faf3-4ad6-993c-9f8be18a1746';

function trackEvent(name, title) {
  try {
    if (window.umami && typeof window.umami.track === 'function') {
      window.umami.track(String(name).slice(0, 100), { title: String(title || name).slice(0, 200) });
    }
  } catch(e) {}
  var data = {
    path: '/event/' + String(name).slice(0, 100),
    title: String(title || name).slice(0, 200),
    event: true
  };
  var tries = 0;
  function attempt() {
    try {
      if (window.goatcounter && typeof window.goatcounter.count === 'function') {
        window.goatcounter.count(data);
      } else if (tries < 10) {
        tries++; setTimeout(attempt, 200);
      }
    } catch (e) {}
  }
  attempt();
}

/* ---------- LOAD JSON DATA ---------- */
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

async function loadAllData() {
  const [tasbihsRes, duasRes, hadithsRes, quranRes, knowledgeRes] = await Promise.all([
    fetch('./data/tasbihs.json'),
    fetch('./data/duas.json'),
    fetch('./data/hadiths.json'),
    fetch('./data/quran.json'),
    fetch('./data/knowledge-base.json')
  ]);
  const tasbihsData = await tasbihsRes.json();
  const duasData = await duasRes.json();
  const hadithsData = await hadithsRes.json();
  const quranData = await quranRes.json();
  const knowledgeData = await knowledgeRes.json();

  DEFAULT_TASBIHS = tasbihsData.defaults || [];
  PRESETS = tasbihsData.presets || [];
  TAWHID_TASBIH = DEFAULT_TASBIHS.find(function(t){ return t.id === 'tawhid'; }) || DEFAULT_TASBIHS[0] || null;
  ISTIGHFAR_TASBIH = DEFAULT_TASBIHS.find(function(t){ return t.id === 'istighfar'; }) || DEFAULT_TASBIHS[1] || null;

  DEFAULT_DUAS = duasData.duas || [];
  DEFAULT_HADITHS = hadithsData.hadiths || [];
  DEFAULT_QURAN = quranData.quran || [];

  ALL_TAGS = knowledgeData.allTags || [];
  BISMILLAH = knowledgeData.bismillah || null;
  NIGHT_ORDER = knowledgeData.nightOrder || [];
  TAJWEED_TAG_MAP = knowledgeData.tajweedTagMap || {};
  TAJWEED_RULE_NAMES = knowledgeData.tajweedRuleNames || {};
  TAJWEED_RULE_COLORS = knowledgeData.tajweedRuleColors || {};

  return {
    tasbihs: DEFAULT_TASBIHS,
    presets: PRESETS,
    duas: DEFAULT_DUAS,
    hadiths: DEFAULT_HADITHS,
    quran: DEFAULT_QURAN,
    allTags: ALL_TAGS,
    bismillah: BISMILLAH,
    nightOrder: NIGHT_ORDER,
    tajweedTagMap: TAJWEED_TAG_MAP,
    tajweedRuleNames: TAJWEED_RULE_NAMES,
    tajweedRuleColors: TAJWEED_RULE_COLORS
  };
}

/* ---------- TAJWEED API (alquran.cloud) ---------- */
const TAJWEED_CACHE_PREFIX = 'iqra_tajweed_v3_';
const TAJWEED_FETCH_TIMEOUT = 15000;
const TAJWEED_API_BASE = 'https://api.alquran.cloud/v1';

const _tajweedQueue = [];
let _tajweedActive = 0;
const TAJWEED_MAX_CONCURRENT = 2;

function _processTajweedQueue() {
  if (_tajweedActive >= TAJWEED_MAX_CONCURRENT || _tajweedQueue.length === 0) return;
  const task = _tajweedQueue.shift();
  _tajweedActive++;
  task().finally(() => {
    _tajweedActive--;
    _processTajweedQueue();
  });
}

async function fetchWithTimeout(url, timeoutMs) {
  var controller = new AbortController();
  var timer = setTimeout(function(){ try { controller.abort(); } catch(e){} }, timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timer);
  }
}

function _isValidTajweedText(text) {
  if (typeof text !== 'string' || text.length === 0) return false;
  return /\[[a-zA-Z](?::\d+)?\[/.test(text);
}

async function fetchTajweedText(verseKey) {
  const cacheKey = TAJWEED_CACHE_PREFIX + 'ayah_' + verseKey;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      if (_isValidTajweedText(cached)) return cached;
      localStorage.removeItem(cacheKey);
    }
  } catch (e) {}

  const url = TAJWEED_API_BASE + '/ayah/' + verseKey + '/quran-tajweed';

  return new Promise((resolve) => {
    _tajweedQueue.push(async () => {
      try {
        const res = await fetchWithTimeout(url, TAJWEED_FETCH_TIMEOUT);
        if (!res.ok) {
          console.warn('[Tajweed] ayah HTTP ' + res.status + ' for ' + verseKey);
          resolve(null);
          return;
        }
        const json = await res.json();
        const text = json && json.data && json.data.text ? json.data.text : null;
        if (text && _isValidTajweedText(text)) {
          try { localStorage.setItem(cacheKey, text); } catch (e) {}
          resolve(text);
          return;
        }
        if (text) {
          console.warn('[Tajweed] ayah ' + verseKey + ' returned non-tajweed text: ' + text.slice(0, 80));
        }
        resolve(null);
      } catch (e) {
        console.warn('[Tajweed] ayah fetch failed for ' + verseKey + ': ' + (e && e.message ? e.message : String(e)));
        resolve(null);
      }
    });
    _processTajweedQueue();
  });
}

async function fetchTajweedSurah(surahNumber) {
  const cacheKey = TAJWEED_CACHE_PREFIX + 'surah_' + surahNumber;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        let valid = false;
        for (const k in parsed) {
          if (_isValidTajweedText(parsed[k])) { valid = true; break; }
        }
        if (valid) return parsed;
        localStorage.removeItem(cacheKey);
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }
  } catch (e) {}

  const url = TAJWEED_API_BASE + '/surah/' + surahNumber + '/quran-tajweed';
  try {
    const res = await fetchWithTimeout(url, TAJWEED_FETCH_TIMEOUT);
    if (!res.ok) {
      console.warn('[Tajweed] surah HTTP ' + res.status + ' for surah ' + surahNumber);
      return null;
    }
    const json = await res.json();
    const ayahs = json && json.data && json.data.ayahs ? json.data.ayahs : null;
    if (!ayahs || !Array.isArray(ayahs)) {
      console.warn('[Tajweed] surah ' + surahNumber + ': response missing ayahs');
      return null;
    }
    const map = {};
    let validCount = 0;
    ayahs.forEach(function(a) {
      if (a && a.numberInSurah && a.text) {
        map[a.numberInSurah] = a.text;
        if (_isValidTajweedText(a.text)) validCount++;
      }
    });
    if (validCount === 0) {
      console.warn('[Tajweed] surah ' + surahNumber + ': no ayahs contained tajweed markers');
      return null;
    }
    try { localStorage.setItem(cacheKey, JSON.stringify(map)); } catch (e) {}
    return map;
  } catch (e) {
    console.warn('[Tajweed] surah fetch failed for ' + surahNumber + ': ' + (e && e.message ? e.message : String(e)));
    return null;
  }
}

async function applyTajweedToContainer(container, item) {
  if (!container || !item) return;
  const elements = container.querySelectorAll('.read-ayah-ar');
  if (!elements.length) return;

  var loader = document.createElement('div');
  loader.className = 'tajweed-loading';
  loader.textContent = 'Загрузка правил таджвида…';
  container.insertBefore(loader, container.firstChild);

  var success = false;
  var errorMsg = '';

  try {
    if (item.type === 'surah') {
      const surahMap = await fetchTajweedSurah(item.number);
      if (surahMap) {
        success = true;
        Array.from(elements).forEach(function(el) {
          const ayahBlock = el.closest('.read-ayah');
          if (!ayahBlock) return;
          const verseKey = ayahBlock.dataset.verseKey;
          if (!verseKey) return;
          const ayahNum = parseInt(verseKey.split(':')[1], 10);
          const tajweedText = surahMap[ayahNum];
          const raw = el.dataset.raw || '';
          if (tajweedText && _isValidTajweedText(tajweedText)) {
            const result = renderTajweedHtml(tajweedText);
            el.innerHTML = result.text;
            const existingRules = ayahBlock.querySelector('.ayah-tajweed-rules');
            if (existingRules) existingRules.remove();
            if (result.rules) {
              const rulesContainer = document.createElement('div');
              rulesContainer.innerHTML = result.rules;
              el.insertAdjacentElement('afterend', rulesContainer);
            }
          } else {
            el.innerHTML = esc(raw);
          }
        });
      } else {
        errorMsg = 'API не вернул данные';
      }
    } else {
      const arr = Array.from(elements);
      const results = await Promise.all(arr.map(function(el) {
        const ayahBlock = el.closest('.read-ayah');
        if (!ayahBlock) return Promise.resolve(false);
        const verseKey = ayahBlock.dataset.verseKey;
        if (!verseKey) return Promise.resolve(false);
        const raw = el.dataset.raw || '';
        return fetchTajweedText(verseKey).then(function(tajweed) {
          if (!tajweed || !_isValidTajweedText(tajweed)) {
            el.innerHTML = esc(raw);
            return false;
          }
          const result = renderTajweedHtml(tajweed);
          el.innerHTML = result.text;
          const existingRules = ayahBlock.querySelector('.ayah-tajweed-rules');
          if (existingRules) existingRules.remove();
          if (result.rules) {
            const rulesContainer = document.createElement('div');
            rulesContainer.innerHTML = result.rules;
            el.insertAdjacentElement('afterend', rulesContainer);
          }
          return true;
        }).catch(function() {
          el.innerHTML = esc(raw);
          return false;
        });
      }));
      success = results.some(function(r) { return r === true; });
      if (!success) errorMsg = 'API не вернул данные';
    }
  } catch (e) {
    console.warn('[Tajweed] apply error:', e);
    errorMsg = e && e.message ? e.message : 'Ошибка';
  }

  if (loader.parentNode) {
    if (success) {
      loader.parentNode.removeChild(loader);
    } else {
      const retryId = activeReadId || (item && item.id) || '';
      loader.className = 'tajweed-error';
      loader.innerHTML = 'Таджвид временно недоступен' + (errorMsg ? ' (' + esc(errorMsg) + ')' : '') +
        '. <a href="#" onclick="event.preventDefault(); if(activeReadId) closeRead(); setTimeout(function(){ openRead(\'' + esc(retryId) + '\'); }, 120); return false;">Повторить</a>';
      setTimeout(function(){
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 8000);
    }
  }
}

function renderTajweedHtml(text) {
  if (!text) return { text: '', rules: '' };
  const rulesFound = new Set();
  let html = '';
  let i = 0;
  const len = text.length;
  let plainStart = 0;

  function flushPlain(end) {
    if (end > plainStart) html += esc(text.slice(plainStart, end));
  }

  while (i < len) {
    if (text[i] === '[') {
      const m = text.slice(i).match(/^\[([a-zA-Z])(?::\d+)?\[/);
      if (m) {
        flushPlain(i);
        const tag = m[1].toLowerCase();
        const ruleName = TAJWEED_TAG_MAP[tag];
        const tagEnd = i + m[0].length;
        const closeIdx = text.indexOf(']', tagEnd);
        if (closeIdx === -1) {
          html += esc(text.slice(i));
          i = len;
          plainStart = len;
          break;
        }
        const content = text.slice(tagEnd, closeIdx);
        if (ruleName) {
          rulesFound.add(ruleName);
          html += '<span class="tajweed-' + ruleName + '">' + esc(content) + '</span>';
        } else {
          html += esc(content);
        }
        i = closeIdx + 1;
        plainStart = i;
      } else {
        i++;
      }
    } else {
      i++;
    }
  }
  flushPlain(len);

  let rulesHtml = '';
  if (rulesFound.size > 0) {
    const items = Array.from(rulesFound).map(function(rule) {
      const color = TAJWEED_RULE_COLORS[rule] || '#666';
      const name = TAJWEED_RULE_NAMES[rule] || rule;
      return '<span class="rule-item"><i style="background:' + color + ';"></i>' + name + '</span>';
    }).join('');
    rulesHtml = '<div class="ayah-tajweed-rules">' + items + '</div>';
  }

  return { text: html, rules: rulesHtml };
}
