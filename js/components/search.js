"use strict";

/* ============================================================
   SEARCH.JS — Глобальный поиск по тасбихам/Корану/дуа/хадисам
   Проект «Икра» · v383 (рефакторинг)
   _searchShowAll и searchFilters объявлены в app.js.
   ============================================================ */

var debouncedRenderGlobalSearch = debounce(renderGlobalSearch, 200);

var _lastSearchQuery = '';
function openSearch(){ _searchShowAll = false; _lastSearchQuery = ''; document.getElementById('search-overlay').classList.add('active'); setTimeout(()=>{ const i=document.getElementById('global-search-input'); if (i) i.focus(); }, 120); renderGlobalSearch(); }
function closeSearch(){ _searchShowAll = false; _lastSearchQuery = ''; document.getElementById('search-overlay').classList.remove('active'); const i=document.getElementById('global-search-input'); if (i) i.value=''; }
function showAllSearchResults() { _searchShowAll = true; renderGlobalSearch(); }

function searchOpen(type, id){
  if (typeof closeSearch === 'function') closeSearch({ skipHistoryBack: true });
  var res = document.getElementById('search-results');
  if (res) res.innerHTML = '';
  if (type==='quran') openQuran(id);
  else if (type==='dua') openDua(id);
  else if (type==='hadith') openHadith(id);
  else if (type==='tasbih') openCounter(id);
}

function setSearchFilter(key, value){ _searchShowAll = false; searchFilters[key] = value; document.querySelectorAll('#search-filters .filter-group[data-filter="' + key + '"] .filter-chip').forEach(function(b){ b.classList.toggle('active', b.dataset.value === value); }); renderGlobalSearch(); }

function openPathFromGlobalSearch(mode, tag) {
  closeSearch({ skipHistoryBack: true });
  if (typeof openPathFilter === 'function') {
    openPathFilter(mode, tag);
  }
}

function renderGlobalSearch() {
  const rawQ = (document.getElementById('global-search-input').value || '').trim();
  if (rawQ !== _lastSearchQuery) {
    _lastSearchQuery = rawQ;
    _searchShowAll = false;
  }
  const q = rawQ.toLowerCase();
  const el = document.getElementById('search-results');
  const hasGraph = typeof IqraGraph !== 'undefined';
  const indexOrCtx = hasGraph ? (typeof getPathGraphIndex === 'function' ? getPathGraphIndex() : (typeof getPathGraphContext === 'function' ? getPathGraphContext() : null)) : null;

  if (!q && searchFilters.type === 'all' && searchFilters.status === 'all' && searchFilters.favorite === 'all') {
    let quickHtml = '';
    if (hasGraph && indexOrCtx) {
      const themes = IqraGraph.getThemeCatalog(indexOrCtx).slice(0, 4);
      const moods = IqraGraph.getMoodCatalog(indexOrCtx).slice(0, 4);
      quickHtml =
        '<div class="search-smart-box">' +
          '<div class="ssb-label">Быстрый переход в Умную книгу</div>' +
          '<div class="ecosystem-pills">' +
            themes.map(th => '<button type="button" class="ecosystem-pill ecosystem-pill-theme" onclick="openPathFromGlobalSearch(\'theme\',\'' + escAttr(th.title) + '\')"><svg class="ico ico-sm"><use href="#i-bookmark"/></svg><span>' + esc(th.title) + '</span></button>').join('') +
            moods.map(m => '<button type="button" class="ecosystem-pill ecosystem-pill-mood" onclick="openPathFromGlobalSearch(\'mood\',\'' + escAttr(m.title) + '\')"><svg class="ico ico-sm"><use href="#i-compass"/></svg><span>' + esc(m.title) + '</span></button>').join('') +
          '</div>' +
        '</div>';
    }
    el.innerHTML = '<div class="empty search-empty-intro">Введите запрос или выберите категорию выше — поиск по тасбихам, Корану (включая «2:255»), тафсирам, дуа и хадисам.</div>' + quickHtml;
    return;
  }

  const verseRef = (typeof parseDirectVerseQuery === 'function') ? parseDirectVerseQuery(rawQ) : null;
  const qRu = hasGraph ? IqraGraph.normalizeSearchText(rawQ) : q;
  const qAr = hasGraph ? IqraGraph.normalizeArabicText(rawQ) : '';
  const qArTokens = qAr ? qAr.split(' ').filter(Boolean) : [];

  const textMatches = (rawText) => {
    const src = String(rawText || '');
    if (!src) return false;
    const ruSrc = hasGraph ? IqraGraph.normalizeSearchText(src) : src.toLowerCase();
    if (qRu && ruSrc.indexOf(qRu) !== -1) return true;
    if (qAr) {
      const arSrc = IqraGraph.normalizeArabicText(src);
      if (arSrc.indexOf(qAr) !== -1) return true;
      if (qArTokens.length && qArTokens.every(tk => {
        if (arSrc.indexOf(tk) !== -1) return true;
        if (/^ال[\u0621-\u064A]{3,}$/.test(tk) && arSrc.indexOf(tk.slice(2)) !== -1) return true;
        return false;
      })) return true;
    }
    return false;
  };

  const score = (it) => {
    if (!q) return 1;
    const t = hasGraph ? IqraGraph.normalizeSearchText(it.title || '') : (it.title || '').toLowerCase();
    const num = String(it.number || '').toLowerCase();
    let w = 0;
    if (verseRef && it.type === 'surah' && Number(it.number) === verseRef.surah) w += 20;
    if (qRu && t.startsWith(qRu)) w += 10;
    else if (qRu && t.includes(qRu)) w += 6;
    if (num && num.includes(q)) w += 5;
    if (textMatches(it.subtitle)) w += 3;
    if (textMatches(it.transcription)) w += 3;
    if (textMatches(it.arabic)) w += 2;
    if (textMatches(it.translation)) w += 2;
    return w;
  };
  
  const statusOk = (it, type) => { 
    if (type === 'tasbih') return true; 
    return searchFilters.status === 'all' || 
           (searchFilters.status === 'learned' && !!it.learned) || 
           (searchFilters.status === 'unlearned' && !it.learned); 
  };
  
  const favOk = (it) => searchFilters.favorite === 'all' || (searchFilters.favorite === 'only' && isFavorite(it.id));
  const showType = (t) => searchFilters.type === 'all' || searchFilters.type === t;

  let truncatedCount = 0;
  const filtered = (arr, type) => {
    const res = arr.map(it => ({ it: it, s: score(it) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map(x => x.it)
      .filter(it => statusOk(it, type))
      .filter(favOk);
    if (!_searchShowAll && res.length > 30) {
      truncatedCount += (res.length - 30);
      return res.slice(0, 30);
    }
    return res;
  };

  const searchTafsirs = () => {
    if (!qRu || qRu.length < 3) return [];
    if (searchFilters.status !== 'all' || searchFilters.favorite !== 'all') return [];
    if (searchFilters.type !== 'all' && searchFilters.type !== 'quran') return [];
    const list = (typeof DEFAULT_TAFSIRS !== 'undefined' && Array.isArray(DEFAULT_TAFSIRS)) ? DEFAULT_TAFSIRS : [];
    const matched = [];
    for (let i = 0; i < list.length; i++) {
      const t = list[i];
      if (!t || !t.surah || !t.ayah || t.status === 'placeholder' || !t.tafsir_text) continue;
      const themesStr = Array.isArray(t.themes) ? t.themes.join(' ') : '';
      const scholarStr = (t.source && t.source.scholar) ? t.source.scholar : '';
      const hay = hasGraph
        ? IqraGraph.normalizeSearchText([t.tafsir_text, themesStr, scholarStr].join(' '))
        : [t.tafsir_text, themesStr, scholarStr].join(' ').toLowerCase();
      if (hay.indexOf(qRu) !== -1) {
        const refMatch = (t.surah + ':' + t.ayah) === rawQ ? 10 : 0;
        const themeMatch = themesStr && (hasGraph ? IqraGraph.normalizeSearchText(themesStr) : themesStr.toLowerCase()).indexOf(qRu) !== -1 ? 4 : 0;
        matched.push({ item: t, w: 1 + refMatch + themeMatch });
      }
    }
    matched.sort((a, b) => b.w - a.w || (a.item.surah - b.item.surah) || (a.item.ayah - b.item.ayah));
    const cap = _searchShowAll ? 12 : 3;
    if (!_searchShowAll && matched.length > cap) truncatedCount += (matched.length - cap);
    return matched.slice(0, cap).map(m => m.item);
  };

  const shortText = (txt, lines) => (typeof excerpt === 'function' ? excerpt(txt, lines) : String(txt || '').split('\n').slice(0, lines).join('\n'));

  const grp = (title, items, type) => {
    if (!items.length) return '';
    return '<div class="progress-section-title">' + title + '</div>' + items.map(it => {
      const t = it.title || it.transcription || it.arabic || '—';
      const sub = it.subtitle ? '<div class="c-sub">' + esc(it.subtitle) + '</div>' : '';
      const arSrc = shortText(it.arabic, 2);
      const trSrc = shortText(it.translation, 2);
      const ar = arSrc ? '<div class="c-ar ar-font" dir="rtl" lang="ar">' + esc(arSrc) + '</div>' : '';
      const tr = trSrc ? '<div class="c-tr">' + esc(trSrc) + '</div>' : '';
      return '<div class="content-card" role="button" tabindex="0" onclick="searchOpen(\'' + type + '\',\'' + escAttr(it.id) + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();searchOpen(\'' + type + '\',\'' + escAttr(it.id) + '\')}"><div class="c-title">' + esc(t) + '</div>' + sub + ar + tr + '</div>';
    }).join('');
  };

  const tafsirGrp = (tafsirItems) => {
    if (!tafsirItems.length || typeof openTafsirReader !== 'function') return '';
    return '<div class="progress-section-title">Тафсиры</div>' + tafsirItems.map(t => {
      const surahObj = (typeof getQuranById === 'function') ? getQuranById('q' + t.surah) : null;
      const surahTitle = surahObj ? surahObj.title : ('Сура ' + t.surah);
      const scholar = (t.source && t.source.scholar) ? t.source.scholar : 'Ибн Касир';
      const preview = String(t.tafsir_text || '').replace(/\s+/g, ' ').trim().slice(0, 150) + '…';
      return '<button type="button" class="content-card content-card-btn search-tafsir-card" onclick="closeSearch({skipHistoryBack:true});openTafsirReader(' + Number(t.surah) + ',' + Number(t.ayah) + ')">' +
        '<div class="c-badge">Тафсир · ' + Number(t.surah) + ':' + Number(t.ayah) + '</div>' +
        '<div class="c-title">' + esc(surahTitle) + ' — аят ' + Number(t.ayah) + '</div>' +
        '<div class="c-sub">' + esc(scholar) + '</div>' +
        '<div class="c-tr">' + esc(preview) + '</div>' +
      '</button>';
    }).join('');
  };

  let html = '';
  if (verseRef && showType('quran')) {
    const vs = getQuranById('q' + verseRef.surah);
    if (vs) {
      html += '<button type="button" class="content-card content-card--feature content-card-btn" onclick="closeSearch({skipHistoryBack:true});openRead(\'' + escAttr(vs.id) + '\',' + Math.max(0, verseRef.ayah - 1) + ')"><div class="c-badge">Прямой переход</div><div class="c-title">Открыть аят ' + verseRef.surah + ':' + verseRef.ayah + ' (' + esc(vs.title) + ')</div><div class="c-sub">Перейти в режим чтения к аяту ' + verseRef.ayah + '</div></button>';
    }
  }

  if (hasGraph && indexOrCtx) {
    const pathRes = IqraGraph.queryPathItems({ query: rawQ, mode: 'all', itemTypeFilter: 'all' }, indexOrCtx);
    const hasTopics = pathRes.matchedTopics && pathRes.matchedTopics.length;
    const hasMoods = pathRes.matchedMoods && pathRes.matchedMoods.length;
    const hasScholars = pathRes.matchedScholars && pathRes.matchedScholars.length;
    if (hasTopics || hasMoods || hasScholars) {
      html += '<div class="search-smart-box"><div class="ssb-label">Разделы Умной книги</div><div class="ecosystem-pills">' +
        (pathRes.matchedScholars || []).slice(0, 3).map(sc => '<button type="button" class="ecosystem-pill ecosystem-pill-scholar" onclick="openPathFromGlobalSearch(\'scholar\',\'scholar:' + escAttr(sc.id) + '\')"><svg class="ico ico-sm"><use href="#i-info"/></svg><span>Учёный: ' + esc(sc.name) + '</span></button>').join('') +
        (pathRes.matchedTopics || []).slice(0, 4).map(th => '<button type="button" class="ecosystem-pill ecosystem-pill-theme" onclick="openPathFromGlobalSearch(\'theme\',\'' + escAttr(th.title) + '\')"><svg class="ico ico-sm"><use href="#i-bookmark"/></svg><span>Тема: ' + esc(th.title) + '</span></button>').join('') +
        (pathRes.matchedMoods || []).slice(0, 4).map(m => '<button type="button" class="ecosystem-pill ecosystem-pill-mood" onclick="openPathFromGlobalSearch(\'mood\',\'' + escAttr(m.title) + '\')"><svg class="ico ico-sm"><use href="#i-compass"/></svg><span>Настроение: ' + esc(m.title) + '</span></button>').join('') +
        '</div></div>';
    }
  }

  if (showType('tasbih')) html += grp('Тасбихи', filtered(state.tasbihs, 'tasbih'), 'tasbih');
  if (showType('quran')) html += grp('Коран', filtered(state.quran, 'quran'), 'quran');
  if (showType('dua')) html += grp('Дуа', filtered(state.duas, 'dua'), 'dua');
  if (showType('hadith')) html += grp('Хадисы', filtered(state.hadiths, 'hadith'), 'hadith');
  html += tafsirGrp(searchTafsirs());

  if (!_searchShowAll && truncatedCount > 0 && html) {
    html += `<button type="button" class="show-all-btn" onclick="showAllSearchResults()">Показать все результаты (+${truncatedCount})</button>`;
  }
  el.innerHTML = html || '<div class="empty">Ничего не найдено</div>'; 
}