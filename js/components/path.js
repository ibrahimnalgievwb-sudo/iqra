"use strict";

/* ============================================================
   PATH.JS — Вкладка «Путь» (Умная книга · экосистема-справочник)
   Режимы: По словам · По темам · Настроение + перекрёстные связи
   ============================================================ */

var debouncedRenderPath = debounce(renderPath, 220);

var _cachedPathIndex = null;
var _cachedPathSig = '';

function _pathLinkify(safeHtml, opts) {
  return (typeof IqraScholars !== 'undefined' && typeof IqraScholars.linkifyScholars === 'function')
    ? IqraScholars.linkifyScholars(safeHtml, opts)
    : (safeHtml == null ? '' : String(safeHtml));
}

function getPathGraphContext() {
  return {
    quran: (typeof state !== 'undefined' && state && Array.isArray(state.quran)) ? state.quran : (window.DEFAULT_QURAN || []),
    duas: (typeof state !== 'undefined' && state && Array.isArray(state.duas)) ? state.duas : (window.DEFAULT_DUAS || []),
    hadiths: (typeof state !== 'undefined' && state && Array.isArray(state.hadiths)) ? state.hadiths : (window.DEFAULT_HADITHS || []),
    tasbihs: (typeof state !== 'undefined' && state && Array.isArray(state.tasbihs)) ? state.tasbihs : (window.DEFAULT_TASBIHS || []),
    tafsirs: Array.isArray(window.DEFAULT_TAFSIRS) ? window.DEFAULT_TAFSIRS : [],
    themes: Array.isArray(window.GRAPH_THEMES) ? window.GRAPH_THEMES : [],
    scholars: Array.isArray(window.GRAPH_SCHOLARS) ? window.GRAPH_SCHOLARS : [],
    biographies: Array.isArray(window.DEFAULT_BIOGRAPHIES) ? window.DEFAULT_BIOGRAPHIES : [],
    edges: Array.isArray(window.GRAPH_EDGES) ? window.GRAPH_EDGES : [],
    parseAyahs: typeof parseAyahs === 'function' ? parseAyahs : undefined
  };
}

function getPathGraphIndex() {
  if (typeof IqraGraph === 'undefined') return null;
  var ctx = getPathGraphContext();
  var tasbihSig = ctx.tasbihs.map(function (t) {
    return (t && t.id ? t.id : '') + ':' + (t && t.dalil ? t.dalil.length : 0);
  }).join(',');
  var sig = [
    ctx.quran.length,
    ctx.duas.length,
    ctx.hadiths.length,
    ctx.tasbihs.length,
    tasbihSig,
    ctx.tafsirs.length,
    ctx.edges.length,
    ctx.themes.length,
    ctx.biographies.length
  ].join('|');
  if (!_cachedPathIndex || _cachedPathSig !== sig) {
    _cachedPathIndex = IqraGraph.createContextIndex(ctx);
    _cachedPathSig = sig;
  }
  return _cachedPathIndex;
}

function syncPathControls() {
  var mode = (typeof pathMode === 'string' && pathMode) ? pathMode : 'all';
  var typeFilter = (typeof pathTypeFilter === 'string' && pathTypeFilter) ? pathTypeFilter : 'all';

  document.querySelectorAll('.path-mode-seg [data-path-mode]').forEach(function (btn) {
    var active = btn.getAttribute('data-path-mode') === mode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  document.querySelectorAll('.path-type-filters [data-path-type]').forEach(function (btn) {
    var active = btn.getAttribute('data-path-type') === typeFilter;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  var inp = document.getElementById('path-search');
  if (inp) {
    if (mode === 'theme') inp.placeholder = 'Уточнить внутри тем по слову или суре…';
    else if (mode === 'mood') inp.placeholder = 'Уточнить по состоянию души или слову…';
    else if (mode === 'scholar') inp.placeholder = 'Поиск сподвижника, таби‘ина или учёного…';
    else inp.placeholder = 'Поиск по словам, арабскому, теме или имени…';
  }

  var clearBtn = document.getElementById('path-clear-btn');
  if (clearBtn) {
    clearBtn.style.display = (inp && inp.value.trim()) ? 'flex' : 'none';
  }
}

function setPathMode(mode) {
  if (mode !== 'all' && mode !== 'theme' && mode !== 'mood' && mode !== 'scholar') mode = 'all';
  pathMode = mode;
  activePathTag = null;
  pathShowAll = false;
  var inp = document.getElementById('path-search');
  if (inp) inp.value = '';
  renderPath();
}

function setPathTag(tag) {
  activePathTag = tag || null;
  pathShowAll = false;
  renderPath();
}

function togglePathChip(tag) {
  if (!tag) {
    setPathTag(null);
    return;
  }
  setPathTag(activePathTag === tag ? null : tag);
}

function setPathTypeFilter(type) {
  var allowed = ['all', 'ayah', 'hadith', 'dua', 'tasbih'];
  pathTypeFilter = allowed.indexOf(type) !== -1 ? type : 'all';
  pathShowAll = false;
  renderPath();
}

function clearPathSearch() {
  var inp = document.getElementById('path-search');
  if (inp) {
    inp.value = '';
    try { inp.focus(); } catch (e) {}
  }
  pathShowAll = false;
  renderPath();
}

function togglePathShowAll() {
  pathShowAll = !pathShowAll;
  renderPath();
}

function openPathFilter(mode, tag) {
  var index = getPathGraphIndex() || getPathGraphContext();
  var resolvedMode = mode;
  if (resolvedMode !== 'all' && resolvedMode !== 'theme' && resolvedMode !== 'mood' && resolvedMode !== 'scholar') {
    if (tag && String(tag).indexOf('scholar:') === 0) {
      resolvedMode = 'scholar';
    } else if (tag && typeof IqraGraph !== 'undefined') {
      var moods = IqraGraph.getMoodCatalog(index);
      var isMood = moods.some(function (m) { return m.title === tag || m.id === tag; });
      var themes = IqraGraph.getThemeCatalog(index);
      var isTheme = themes.some(function (t) { return t.title === tag || t.id === tag; });
      var scholars = typeof IqraGraph.getScholarCatalog === 'function' ? IqraGraph.getScholarCatalog(index) : [];
      var isScholar = scholars.some(function (s) { return s.id === tag || ('scholar:' + s.id) === tag || s.name === tag; });
      if (isMood && !isTheme) resolvedMode = 'mood';
      else if (isTheme) resolvedMode = 'theme';
      else if (isScholar) resolvedMode = 'scholar';
      else resolvedMode = 'all';
    } else {
      resolvedMode = 'all';
    }
  }

  pathMode = resolvedMode;
  if (resolvedMode === 'scholar' && tag && String(tag).indexOf('scholar:') !== 0) {
    activePathTag = 'scholar:' + tag;
  } else {
    activePathTag = tag || null;
  }
  pathTypeFilter = 'all';
  pathShowAll = false;

  var inp = document.getElementById('path-search');
  if (inp) inp.value = '';

  renderPath();
  if (typeof showScreen === 'function') showScreen('screen-path');
}

window.openPathMode = openPathFilter;

function openPathItem(type, id, ayahIdx) {
  if (type === 'quran' || type === 'ayah') {
    if (typeof openQuran === 'function') openQuran(id, ayahIdx);
  } else if (type === 'hadith') {
    if (typeof openHadith === 'function') openHadith(id);
  } else if (type === 'dua') {
    if (typeof openDua === 'function') openDua(id);
  } else if (type === 'tasbih') {
    if (typeof openCounter === 'function') openCounter(id);
  }
}

function renderPathChips(ctxOrIndex) {
  var wrapper = document.getElementById('path-chips-wrapper');
  var container = document.getElementById('path-chips-container');
  if (!container || typeof IqraGraph === 'undefined') return;

  var mode = (typeof pathMode === 'string' && pathMode) ? pathMode : 'all';
  if (mode === 'all' && !activePathTag) {
    if (wrapper) wrapper.style.display = 'none';
    container.innerHTML = '';
    return;
  }
  if (wrapper) wrapper.style.display = '';

  if (mode === 'scholar' || (activePathTag && String(activePathTag).indexOf('scholar:') === 0)) {
    var scholars = typeof IqraGraph.getScholarCatalog === 'function' ? IqraGraph.getScholarCatalog(ctxOrIndex) : [];
    var cleanActive = activePathTag ? String(activePathTag).replace(/^scholar:/, '') : '';
    var chipList = scholars.filter(function (s) {
      return s.count > 0 || s.id === cleanActive;
    }).slice(0, 18);
    var htmlS = '<button type="button" class="path-chip ' + (!activePathTag ? 'active' : '') + '" onclick="setPathTag(null)">Все учёные</button>';
    htmlS += chipList.map(function (sc) {
      var tagVal = 'scholar:' + sc.id;
      var active = activePathTag === tagVal || activePathTag === sc.id;
      return '<button type="button" class="path-chip ' + (active ? 'active' : '') + '" onclick="togglePathChip(\'' + escAttr(tagVal) + '\')">' + esc(sc.name) + '</button>';
    }).join('');
    container.innerHTML = htmlS;
    return;
  }

  var isMoodMode = mode === 'mood';
  var items = isMoodMode ? IqraGraph.getMoodCatalog(ctxOrIndex) : IqraGraph.getThemeCatalog(ctxOrIndex);
  var allLabel = isMoodMode ? 'Все состояния' : 'Все темы';

  var html = '<button type="button" class="path-chip ' + (!activePathTag ? 'active' : '') + '" onclick="setPathTag(null)">' + allLabel + '</button>';
  html += items.map(function (it) {
    var active = activePathTag === it.title || activePathTag === it.id;
    return '<button type="button" class="path-chip ' + (active ? 'active' : '') + '" onclick="togglePathChip(\'' + escAttr(it.title) + '\')">' + esc(it.title) + '</button>';
  }).join('');

  container.innerHTML = html;
}

function buildPathContextBannerHtml(queryRes) {
  if (queryRes && queryRes.activeScholar) {
    var sc = queryRes.activeScholar;
    var roleLabels = {
      companion: 'Сподвижник Пророка (да благословит его Аллах и приветствует)',
      tabii: 'Таби‘ин (поколение учеников сподвижников)',
      scholar: 'Учёный Ахлю-с-Сунна',
      transmitter: 'Передатчик'
    };
    var countSc = (queryRes.items || []).length;
    return (
      '<div class="path-focus-banner path-focus-scholar" style="margin-bottom:12px;">' +
        '<div class="pfb-top">' +
          '<span class="pfb-kicker">' + esc(roleLabels[sc.type] || 'Учёный Ахлю-с-Сунна') + '</span>' +
          '<button type="button" class="pfb-reset" onclick="setPathTag(null)">Все учёные</button>' +
        '</div>' +
        '<div class="pfb-title">' + esc(sc.name_ru || sc.name) + '</div>' +
        (sc.full_name ? '<div class="pfb-fullname">' + esc(sc.full_name) + '</div>' : '') +
        (sc.lifespan ? '<div class="pfb-life">' + esc(sc.lifespan) + '</div>' : '') +
        (sc.description ? '<div class="pfb-desc">' + _pathLinkify(esc(sc.description), { excludeId: sc.id }) + '</div>' : '') +
        '<div class="pfb-actions-row">' +
          '<span class="pfb-meta">Связанных материалов: ' + countSc + '</span>' +
          '<button type="button" class="btn secondary btn-inline pfb-bio-btn" onclick="openScholarInfo(\'' + escAttr(sc.id) + '\')">' +
            '<svg class="ico ico-sm"><use href="#i-info"/></svg> Полная справка и источники' +
          '</button>' +
        '</div>' +
      '</div>'
    );
  }
  var focus = queryRes && (queryRes.activeMood || queryRes.activeTheme);
  if (!focus) return '';
  var kindLabel = queryRes.activeMood ? 'Состояние души' : 'Тема Умной книги';
  var count = (queryRes.items || []).length;
  return (
    '<div class="path-focus-banner" style="margin-bottom:12px;">' +
      '<div class="pfb-top">' +
        '<span class="pfb-kicker">' + esc(kindLabel) + '</span>' +
        '<button type="button" class="pfb-reset" onclick="setPathTag(null)">К обзору</button>' +
      '</div>' +
      '<div class="pfb-title">' + esc(focus.title) + '</div>' +
      (focus.description ? '<div class="pfb-desc">' + _pathLinkify(esc(focus.description)) + '</div>' : '') +
      '<div class="pfb-meta">Подобрано материалов: ' + count + '</div>' +
    '</div>'
  );
}

function _renderScholarCard(sc) {
  var clickPrimary = sc.count > 0
    ? 'setPathTag(\'scholar:' + escAttr(sc.id) + '\')'
    : 'openScholarInfo(\'' + escAttr(sc.id) + '\')';
  return (
    '<div class="path-catalog-card path-scholar-card" role="button" tabindex="0" onclick="' + clickPrimary + '" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();' + clickPrimary + '}">' +
      '<div class="pcc-top">' +
        '<span class="pcc-title">' + esc(sc.name) + '</span>' +
        '<span class="pcc-count" title="Связанных материалов в приложении">' + sc.count + '</span>' +
      '</div>' +
      (sc.lifespan ? '<div class="psc-life">' + esc(sc.lifespan) + '</div>' : '') +
      '<div class="pcc-desc psc-desc">' + esc(sc.description || sc.full_name || '') + '</div>' +
      '<div class="psc-actions">' +
        '<button type="button" class="psc-btn" onclick="event.stopPropagation();openScholarInfo(\'' + escAttr(sc.id) + '\')">' +
          '<svg class="ico ico-sm"><use href="#i-info"/></svg> Справка' +
        '</button>' +
        (sc.count > 0 ? '<button type="button" class="psc-btn psc-btn-accent" onclick="event.stopPropagation();setPathTag(\'scholar:' + escAttr(sc.id) + '\')"><svg class="ico ico-sm"><use href="#i-compass"/></svg> Материалы (' + sc.count + ')</button>' : '') +
      '</div>' +
    '</div>'
  );
}

function renderIdlePathOverview(ctxOrIndex, mode) {
  var themes = IqraGraph.getThemeCatalog(ctxOrIndex);
  var moods = IqraGraph.getMoodCatalog(ctxOrIndex);
  var scholars = typeof IqraGraph.getScholarCatalog === 'function' ? IqraGraph.getScholarCatalog(ctxOrIndex) : [];

  if (mode === 'scholar') {
    var groups = [
      { key: 'companion', title: 'Сподвижники Пророка, да благословит его Аллах и приветствует (сахабы)', items: scholars.filter(function (s) { return s.type === 'companion'; }) },
      { key: 'tabii', title: 'Таби‘ины (ученики сподвижников)', items: scholars.filter(function (s) { return s.type === 'tabii'; }) },
      { key: 'scholar', title: 'Имамы и учёные Ахлю-с-Сунна', items: scholars.filter(function (s) { return s.type !== 'companion' && s.type !== 'tabii'; }) }
    ];
    return (
      '<div class="path-catalog-section">' +
        '<div class="pcs-head">' +
          '<div class="pcs-title">Сподвижники, таби‘ины и учёные Ахлю-с-Сунна</div>' +
          '<div class="pcs-sub">Проверенные биографии по классическим книгам («аль-Исаба», «Сияр а‘лям ан-нубаля» и др.) и все связанные материалы в приложении</div>' +
        '</div>' +
        groups.map(function (g) {
          if (!g.items.length) return '';
          return (
            '<div class="path-scholar-group">' +
              '<div class="psg-title">' + esc(g.title) + ' <span class="psg-count">' + g.items.length + '</span></div>' +
              '<div class="path-catalog-grid path-scholar-grid">' +
                g.items.map(_renderScholarCard).join('') +
              '</div>' +
            '</div>'
          );
        }).join('') +
      '</div>'
    );
  }

  if (mode === 'mood') {
    return (
      '<div class="path-catalog-section">' +
        '<div class="pcs-head">' +
          '<div class="pcs-title path-heart-title">' +
            '<span class="path-bismillah-kicker">С именем Аллаха</span>' +
            '<span class="path-heart-heading">Что тревожит твоё сердце — и о чём просит душа?</span>' +
          '</div>' +
          '<div class="pcs-sub">Выберите состояние — приложение подберёт аяты, достоверные хадисы, дуа и зикры</div>' +
        '</div>' +
        '<div class="path-catalog-grid">' +
          moods.map(function (m) {
            return '<button type="button" class="path-catalog-card" onclick="setPathTag(\'' + escAttr(m.title) + '\')">' +
              '<div class="pcc-top">' +
                '<span class="pcc-title">' + esc(m.title) + '</span>' +
                '<span class="pcc-count">' + m.count + '</span>' +
              '</div>' +
              '<div class="pcc-desc">' + esc(m.description) + '</div>' +
            '</button>';
          }).join('') +
        '</div>' +
      '</div>'
    );
  }

  if (mode === 'theme') {
    return (
      '<div class="path-catalog-section">' +
        '<div class="pcs-head">' +
          '<div class="pcs-title">Темы Умной книги</div>' +
          '<div class="pcs-sub">12 смысловых разделов с проверенными ссылками на тафсир Ибн Касира и сборники Сунны</div>' +
        '</div>' +
        '<div class="path-catalog-grid">' +
          themes.map(function (th) {
            return '<button type="button" class="path-catalog-card" onclick="setPathTag(\'' + escAttr(th.title) + '\')">' +
              '<div class="pcc-top">' +
                '<span class="pcc-title">' + esc(th.title) + '</span>' +
                '<span class="pcc-count">' + th.count + '</span>' +
              '</div>' +
              '<div class="pcc-desc">' + esc(th.description) + '</div>' +
            '</button>';
          }).join('') +
        '</div>' +
      '</div>'
    );
  }

  var quickThemes = themes.slice(0, 6);
  var quickMoods = moods.slice(0, 6);
  var quickScholars = scholars.filter(function (s) { return s.count > 0; }).slice(0, 6);
  return (
    '<div class="path-overview">' +
      '<div class="path-empty path-empty-smart">' +
        '<div class="pes-title path-heart-title">' +
          '<span class="path-bismillah-kicker">С именем Аллаха</span>' +
          '<span class="path-heart-heading">Что тревожит твоё сердце — и о чём просит душа?</span>' +
        '</div>' +
        '<div class="pes-sub">Ищите по русским словам, арабскому тексту и именам учёных, переходите к темам Корана и Сунны или подбирайте тексты под состояние души.</div>' +
        '<div class="pes-group-label">Популярные темы</div>' +
        '<div class="path-fallback">' +
          quickThemes.map(function (th) {
            return '<button type="button" class="path-chip" onclick="openPathFilter(\'theme\',\'' + escAttr(th.title) + '\')">' + esc(th.title) + '</button>';
          }).join('') +
        '</div>' +
        '<div class="pes-group-label">Состояние души</div>' +
        '<div class="path-fallback">' +
          quickMoods.map(function (m) {
            return '<button type="button" class="path-chip" onclick="openPathFilter(\'mood\',\'' + escAttr(m.title) + '\')">' + esc(m.title) + '</button>';
          }).join('') +
        '</div>' +
        (quickScholars.length ? (
          '<div class="pes-group-label">Сподвижники и учёные</div>' +
          '<div class="path-fallback">' +
            quickScholars.map(function (sc) {
              return '<button type="button" class="path-chip" onclick="openScholarInfo(\'' + escAttr(sc.id) + '\')">' + esc(sc.name) + '</button>';
            }).join('') +
          '</div>'
        ) : '') +
        '<div class="pes-mode-actions">' +
          '<button type="button" class="btn secondary btn-inline" onclick="setPathMode(\'theme\')">Все темы (' + themes.length + ')</button>' +
          '<button type="button" class="btn secondary btn-inline" onclick="setPathMode(\'mood\')">Все состояния (' + moods.length + ')</button>' +
          '<button type="button" class="btn secondary btn-inline" onclick="setPathMode(\'scholar\')">Все учёные (' + scholars.length + ')</button>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function renderMatchedSuggestionsBar(matchedTopics, matchedMoods, matchedScholars) {
  var hasT = Array.isArray(matchedTopics) && matchedTopics.length > 0;
  var hasM = Array.isArray(matchedMoods) && matchedMoods.length > 0;
  var hasS = Array.isArray(matchedScholars) && matchedScholars.length > 0;
  if (!hasT && !hasM && !hasS) return '';

  var chips = [];
  if (hasS) {
    matchedScholars.slice(0, 4).forEach(function (sc) {
      chips.push('<button type="button" class="ecosystem-pill ecosystem-pill-scholar" onclick="openScholarInfo(\'' + escAttr(sc.id) + '\')"><svg class="ico ico-sm"><use href="#i-info"/></svg>Справка: ' + esc(sc.name) + '</button>');
      if (sc.count > 0) {
        chips.push('<button type="button" class="ecosystem-pill" onclick="openPathFilter(\'scholar\',\'scholar:' + escAttr(sc.id) + '\')"><svg class="ico ico-sm"><use href="#i-compass"/></svg>Материалы: ' + esc(sc.name) + ' (' + sc.count + ')</button>');
      }
    });
  }
  if (hasT) {
    matchedTopics.slice(0, 4).forEach(function (th) {
      chips.push('<button type="button" class="ecosystem-pill" onclick="openPathFilter(\'theme\',\'' + escAttr(th.title) + '\')"><svg class="ico ico-sm"><use href="#i-bookmark"/></svg>Тема: ' + esc(th.title) + '</button>');
    });
  }
  if (hasM) {
    matchedMoods.slice(0, 4).forEach(function (m) {
      chips.push('<button type="button" class="ecosystem-pill" onclick="openPathFilter(\'mood\',\'' + escAttr(m.title) + '\')"><svg class="ico ico-sm"><use href="#i-compass"/></svg>Настроение: ' + esc(m.title) + '</button>');
    });
  }

  return (
    '<div class="path-matched-bar">' +
      '<div class="pmb-label">Подходящие разделы Умной книги</div>' +
      '<div class="ecosystem-pills">' + chips.join('') + '</div>' +
    '</div>'
  );
}

function buildEcosystemHtml(rels, opts) {
  if (!rels) return '';
  var o = opts || {};
  var compact = !!o.compact;
  var excludeTheme = o.excludeTheme || '';
  var excludeMood = o.excludeMood || '';

  var ayahs = rels.ayahs || [];
  var hadiths = rels.hadiths || [];
  var duas = rels.duas || [];
  var tasbihs = rels.tasbihs || [];
  var themes = (rels.themes || []).filter(function (t) { return t.title !== excludeTheme; });
  var moods = (rels.moods || []).filter(function (m) { return m.title !== excludeMood; });
  var scholars = compact ? [] : (rels.scholars || []);

  var total = ayahs.length + hadiths.length + duas.length + tasbihs.length + themes.length + moods.length + scholars.length;
  if (!total) return '';

  var groupsHtml = '';

  if (ayahs.length) {
    var inReader = typeof o.inReader === 'boolean'
      ? o.inReader
      : Boolean(typeof document !== 'undefined' && document.getElementById('read-mode') && document.getElementById('read-mode').classList.contains('active'));
    groupsHtml +=
      '<div class="ecosystem-group">' +
        '<div class="ecosystem-group-label">Аяты Корана</div>' +
        '<div class="ecosystem-pills">' +
          ayahs.slice(0, compact ? 4 : 8).map(function (a) {
            var cleanTitle = a.title.replace(/\s*·\s*(?:\d+:\d+|аят\s*\d+)$/i, '');
            var label = (a.refLabel ? (a.refLabel + ' · ') : '') + cleanTitle;
            var ayahAction = inReader
              ? ('openRead(\'' + escAttr(a.surahId) + '\',' + Number(a.ayahIdx || 0) + ')')
              : ('openQuran(\'' + escAttr(a.surahId) + '\',' + Number(a.ayahIdx || 0) + ')');
            return '<button type="button" class="ecosystem-pill" onclick="event.stopPropagation();' + ayahAction + '" title="' + escAttr(a.evidence || a.title) + '">' +
              '<svg class="ico ico-sm"><use href="#i-book"/></svg>' +
              '<span>' + esc(label) + '</span>' +
            '</button>';
          }).join('') +
        '</div>' +
      '</div>';
  }

  if (hadiths.length) {
    groupsHtml +=
      '<div class="ecosystem-group">' +
        '<div class="ecosystem-group-label">Связанные хадисы</div>' +
        '<div class="ecosystem-pills">' +
          hadiths.slice(0, compact ? 3 : 8).map(function (h) {
            return '<button type="button" class="ecosystem-pill" onclick="event.stopPropagation();openHadith(\'' + escAttr(h.id) + '\')" title="' + escAttr(h.source || h.title) + '">' +
              '<svg class="ico ico-sm"><use href="#i-scroll"/></svg>' +
              '<span>' + esc(h.title) + '</span>' +
            '</button>';
          }).join('') +
        '</div>' +
      '</div>';
  }

  if (duas.length) {
    groupsHtml +=
      '<div class="ecosystem-group">' +
        '<div class="ecosystem-group-label">Дуа и руководства</div>' +
        '<div class="ecosystem-pills">' +
          duas.slice(0, compact ? 3 : 8).map(function (d) {
            return '<button type="button" class="ecosystem-pill" onclick="event.stopPropagation();openDua(\'' + escAttr(d.id) + '\')" title="' + escAttr(d.source || d.title) + '">' +
              '<svg class="ico ico-sm"><use href="#i-dua"/></svg>' +
              '<span>' + esc(d.title) + '</span>' +
            '</button>';
          }).join('') +
        '</div>' +
      '</div>';
  }

  if (tasbihs.length) {
    groupsHtml +=
      '<div class="ecosystem-group">' +
        '<div class="ecosystem-group-label">Зикр и тасбих</div>' +
        '<div class="ecosystem-pills">' +
          tasbihs.slice(0, compact ? 3 : 6).map(function (t) {
            var label = t.transcription || t.translation || 'Тасбих';
            if (label.length > 34) label = label.slice(0, 32) + '…';
            return '<button type="button" class="ecosystem-pill" onclick="event.stopPropagation();openCounter(\'' + escAttr(t.id) + '\')">' +
              '<svg class="ico ico-sm"><use href="#i-misbaha"/></svg>' +
              '<span>' + esc(label) + '</span>' +
            '</button>';
          }).join('') +
        '</div>' +
      '</div>';
  }

  if (themes.length) {
    groupsHtml +=
      '<div class="ecosystem-group">' +
        '<div class="ecosystem-group-label">Темы</div>' +
        '<div class="ecosystem-pills">' +
          themes.slice(0, compact ? 4 : 8).map(function (th) {
            return '<button type="button" class="ecosystem-pill ecosystem-pill-theme" onclick="event.stopPropagation();openPathFilter(\'theme\',\'' + escAttr(th.title) + '\')">' +
              '<svg class="ico ico-sm"><use href="#i-bookmark"/></svg>' +
              '<span>' + esc(th.title) + '</span>' +
            '</button>';
          }).join('') +
        '</div>' +
      '</div>';
  }

  if (moods.length) {
    groupsHtml +=
      '<div class="ecosystem-group">' +
        '<div class="ecosystem-group-label">Состояния души</div>' +
        '<div class="ecosystem-pills">' +
          moods.slice(0, compact ? 4 : 8).map(function (m) {
            return '<button type="button" class="ecosystem-pill ecosystem-pill-mood" onclick="event.stopPropagation();openPathFilter(\'mood\',\'' + escAttr(m.title) + '\')">' +
              '<svg class="ico ico-sm"><use href="#i-compass"/></svg>' +
              '<span>' + esc(m.title) + '</span>' +
            '</button>';
          }).join('') +
        '</div>' +
      '</div>';
  }

  if (scholars.length) {
    groupsHtml +=
      '<div class="ecosystem-group">' +
        '<div class="ecosystem-group-label">Учёные и передатчики</div>' +
        '<div class="ecosystem-pills">' +
          scholars.map(function (sc) {
            return '<button type="button" class="ecosystem-pill ecosystem-pill-scholar" onclick="event.stopPropagation();openScholarInfo(\'' + escAttr(sc.id) + '\')">' +
              '<svg class="ico ico-sm"><use href="#i-info"/></svg>' +
              '<span>' + esc(sc.name) + '</span>' +
            '</button>';
          }).join('') +
        '</div>' +
      '</div>';
  }

  if (!groupsHtml) return '';

  var boxClass = compact ? 'ecosystem-box ecosystem-inline' : 'ecosystem-box ecosystem-detail';
  var heading = o.title || (compact ? 'Связи в экосистеме' : 'Связи в Умной книге');

  return (
    '<div class="' + boxClass + '" onclick="event.stopPropagation()">' +
      '<div class="ecosystem-head">' +
        '<svg class="ico ico-sm"><use href="#i-compass"/></svg>' +
        '<span>' + esc(heading) + '</span>' +
      '</div>' +
      groupsHtml +
    '</div>'
  );
}

function renderEcosystemSection(nodeId, options) {
  if (!nodeId || typeof IqraGraph === 'undefined') return '';
  var index = getPathGraphIndex();
  if (!index) return '';
  var rels = IqraGraph.getSmartBookRelations(nodeId, index);
  return buildEcosystemHtml(rels, Object.assign({ compact: false, title: 'Связи в Умной книге' }, options || {}));
}

function renderAyahEcosystemDetails(ayahNodeId, options) {
  if (!ayahNodeId || typeof IqraGraph === 'undefined') return '';
  var index = getPathGraphIndex();
  if (!index) return '';
  var rels = IqraGraph.getSmartBookRelations(ayahNodeId, index);
  if (!rels) return '';
  var count =
    (rels.ayahs ? rels.ayahs.length : 0) +
    (rels.hadiths ? rels.hadiths.length : 0) +
    (rels.duas ? rels.duas.length : 0) +
    (rels.tasbihs ? rels.tasbihs.length : 0) +
    (rels.themes ? rels.themes.length : 0) +
    (rels.moods ? rels.moods.length : 0);
  if (!count) return '';
  var inner = buildEcosystemHtml(rels, Object.assign({ compact: true, title: 'Связи в Умной книге' }, options || {}));
  if (!inner) return '';
  return (
    '<details class="ayah-eco-details" onclick="event.stopPropagation()">' +
      '<summary class="aed-summary">' +
        '<svg class="ico ico-sm"><use href="#i-compass"/></svg>' +
        '<span>Связи этого аята (' + count + ')</span>' +
      '</summary>' +
      inner +
    '</details>'
  );
}

function renderPathResultCard(item) {
  var isAyah = item._type === 'ayah';
  var icon = '#i-book';
  var typeLabel = 'Коран';
  if (item._type === 'hadith') { icon = '#i-scroll'; typeLabel = 'Хадис'; }
  else if (item._type === 'dua') { icon = '#i-dua'; typeLabel = 'Дуа'; }
  else if (item._type === 'tasbih') { icon = '#i-misbaha'; typeLabel = 'Тасбих'; }
  else if (isAyah && item._surahTitle) { typeLabel = 'Коран · ' + item._surahTitle; }

  var openId = isAyah ? item._surahId : item._id;
  var openAction = 'openPathItem(\'' + escAttr(item._type) + '\',\'' + escAttr(openId) + '\',' + (typeof item._ayahIdx === 'number' ? item._ayahIdx : 0) + ')';

  var actionsHtml = '';
  if (isAyah) {
    var ayahActionLabel = item._isSurahAyah ? ('Читать аят ' + esc(item._verseLabel || '')) : 'Читать в режиме чтения';
    var secondaryLabel = item._isSurahAyah ? 'Открыть суру' : 'Открыть разбор';
    actionsHtml =
      '<div class="path-card-actions">' +
        '<button type="button" class="btn secondary btn-inline" onclick="event.stopPropagation();openRead(\'' + escAttr(item._surahId) + '\',' + Number(item._ayahIdx || 0) + ')">' +
          '<svg class="ico ico-sm"><use href="#i-book"/></svg> ' + ayahActionLabel +
        '</button>' +
        '<button type="button" class="btn secondary btn-inline" onclick="event.stopPropagation();openQuran(\'' + escAttr(item._surahId) + '\',' + Number(item._ayahIdx || 0) + ')">' +
          secondaryLabel +
        '</button>' +
      '</div>';
  } else if (item._type === 'hadith') {
    actionsHtml =
      '<div class="path-card-actions">' +
        '<button type="button" class="btn secondary btn-inline" onclick="event.stopPropagation();openHadith(\'' + escAttr(item._id) + '\')">' +
          '<svg class="ico ico-sm"><use href="#i-scroll"/></svg> Открыть хадис' +
        '</button>' +
      '</div>';
  } else if (item._type === 'dua') {
    actionsHtml =
      '<div class="path-card-actions">' +
        '<button type="button" class="btn secondary btn-inline" onclick="event.stopPropagation();openDua(\'' + escAttr(item._id) + '\')">' +
          '<svg class="ico ico-sm"><use href="#i-dua"/></svg> Открыть дуа' +
        '</button>' +
      '</div>';
  } else if (item._type === 'tasbih') {
    actionsHtml =
      '<div class="path-card-actions">' +
        '<button type="button" class="btn secondary btn-inline" onclick="event.stopPropagation();openCounter(\'' + escAttr(item._id) + '\')">' +
          '<svg class="ico ico-sm"><use href="#i-misbaha"/></svg> Открыть счётчик' +
        '</button>' +
      '</div>';
  }

  var semanticHtml = '';
  if (item._semanticJustification || item._semanticNote || item._hasTafsir) {
    var rows = '';
    if (item._scholarTitle) {
      rows += '<div class="psb-row"><span class="psb-key">Учёный / сподвижник:</span> ' + esc(item._scholarTitle) + '</div>';
    }
    if (item._themeTitle) {
      rows += '<div class="psb-row"><span class="psb-key">Тема:</span> ' + esc(item._themeTitle) + '</div>';
    }
    if (item._moodTitle) {
      rows += '<div class="psb-row"><span class="psb-key">Состояние:</span> ' + esc(item._moodTitle) + '</div>';
    }
    if (item._semanticJustification) {
      rows += '<div class="psb-row"><span class="psb-key">Основание:</span> ' + _pathLinkify(esc(item._semanticJustification)) + '</div>';
    }
    if (item._semanticNote) {
      rows += '<div class="psb-note">' + _pathLinkify(esc(item._semanticNote)) + '</div>';
    }

    var tafsirBlock = '';
    if (item._hasTafsir) {
      tafsirBlock =
        '<details class="tafsir-card psb-tafsir">' +
          '<summary class="psb-tafsir-sum">' +
            '<svg class="ico ico-sm"><use href="#i-book"/></svg> Показать тафсир' +
          '</summary>' +
          '<div class="psb-tafsir-body">' + _pathLinkify(escNl(item._tafsirReason)) + '</div>' +
        '</details>' +
        '<div class="psb-tafsir-foot">' +
          '<div class="psb-tafsir-src">' + _pathLinkify(esc(item._tafsirSource)) + '</div>' +
          '<button type="button" class="btn secondary psb-scholar-btn" onclick="event.stopPropagation();openScholarInfo(\'' + escAttr(item._scholarId || 'ibn_kathir') + '\')">' +
            '<svg class="ico ico-sm"><use href="#i-info"/></svg> Справка' +
          '</button>' +
        '</div>';
    }

    semanticHtml =
      '<div class="path-semantic-box" onclick="event.stopPropagation()">' +
        '<div class="psb-kicker">Смысловая связь</div>' +
        rows +
        tafsirBlock +
      '</div>';
  }

  var ecoHtml = buildEcosystemHtml(item._relations, {
    compact: true,
    title: 'Связи в Умной книге',
    excludeTheme: item._themeTitle || '',
    excludeMood: item._moodTitle || ''
  });

  var refBadge = (isAyah && item._verseLabel) ? '<span class="c-badge path-ref-badge">' + esc(item._verseLabel) + '</span>' : '';

  return (
    '<div class="content-card path-result-card" role="button" tabindex="0" onclick="' + openAction + '" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();' + openAction + '}">' +
      '<div class="path-card-head">' +
        '<div class="path-card-type">' +
          '<svg class="ico ico-sm"><use href="' + icon + '"/></svg>' +
          '<span>' + esc(typeLabel) + '</span>' +
        '</div>' +
        refBadge +
      '</div>' +
      '<div class="c-title">' + esc(item._title) + '</div>' +
      (item._sub ? '<div class="c-sub">' + _pathLinkify(esc(item._sub)) + '</div>' : '') +
      (item._ar ? '<div class="c-ar ar-font">' + esc(item._ar) + '</div>' : '') +
      (item._trn ? '<div class="c-tr">' + esc(item._trn) + '</div>' : '') +
      ((item._tr && item._trn && item._type === 'tasbih') ? '<div class="c-sub" style="margin-top:6px;">' + esc(item._tr) + '</div>' : '') +
      semanticHtml +
      ecoHtml +
      actionsHtml +
    '</div>'
  );
}

function getAllItemsByType(index, itemTypeFilter, limit) {
  if (typeof IqraGraph === 'undefined' || !index) return { total: 0, items: [] };
  var maxN = typeof limit === 'number' ? limit : 8;
  var out = [];
  var total = 0;

  if (itemTypeFilter === 'ayah') {
    total = index.ayahs.length;
    index.ayahs.slice(0, maxN).forEach(function (a) {
      var rels = IqraGraph.getSmartBookRelations(a._nodeId, index);
      var card = Object.assign({}, a, { _relations: rels });
      if (rels.tafsirs.length) {
        card._tafsirReason = rels.tafsirs[0].text;
        card._tafsirSource = rels.tafsirs[0].sourceLine;
        card._hasTafsir = true;
        card._scholarId = rels.tafsirs[0].scholarId;
      }
      out.push(card);
    });
  } else if (itemTypeFilter === 'hadith') {
    total = index.hadiths.length;
    index.hadiths.slice(0, maxN).forEach(function (h) {
      var rels = IqraGraph.getSmartBookRelations('hadith:' + h.id, index);
      out.push({
        _type: 'hadith', _nodeId: 'hadith:' + h.id, _id: h.id,
        _title: h.title, _sub: h.subtitle || '', _ar: h.arabic || '', _tr: h.transcription || '', _trn: h.translation || '',
        _relations: rels
      });
    });
  } else if (itemTypeFilter === 'dua') {
    total = index.duas.length;
    index.duas.slice(0, maxN).forEach(function (d) {
      var rels = IqraGraph.getSmartBookRelations('dua:' + d.id, index);
      out.push({
        _type: 'dua', _nodeId: 'dua:' + d.id, _id: d.id,
        _title: d.title, _sub: d.subtitle || '', _ar: d.arabic || '', _tr: d.transcription || '', _trn: d.translation || '',
        _relations: rels
      });
    });
  } else if (itemTypeFilter === 'tasbih') {
    total = index.tasbihs.length;
    index.tasbihs.slice(0, maxN).forEach(function (t) {
      var rels = IqraGraph.getSmartBookRelations('tasbih:' + t.id, index);
      out.push({
        _type: 'tasbih', _nodeId: 'tasbih:' + t.id, _id: t.id,
        _title: t.transcription || t.translation || 'Тасбих', _sub: 'Зикр · цель ' + (t.target || 33) + ' раз',
        _ar: t.arabic || '', _tr: t.transcription || '', _trn: t.translation || '',
        _relations: rels
      });
    });
  }
  return { total: total, items: out };
}

function renderPath() {
  var resultsEl = document.getElementById('path-results');
  if (!resultsEl) return;

  var index = getPathGraphIndex() || getPathGraphContext();
  var mode = (typeof pathMode === 'string' && pathMode) ? pathMode : 'all';
  var typeFilter = (typeof pathTypeFilter === 'string' && pathTypeFilter) ? pathTypeFilter : 'all';

  syncPathControls();
  renderPathChips(index);

  var qInput = document.getElementById('path-search');
  var q = qInput ? qInput.value.trim() : '';

  if (!q && !activePathTag && (mode !== 'all' || typeFilter === 'all')) {
    var ctxBanner = document.getElementById('path-context-banner');
    if (ctxBanner) ctxBanner.innerHTML = '';
    resultsEl.innerHTML = renderIdlePathOverview(index, mode);
    return;
  }

  if (!q && !activePathTag && mode === 'all' && typeFilter !== 'all') {
    var ctxBanner2 = document.getElementById('path-context-banner');
    if (ctxBanner2) ctxBanner2.innerHTML = '';
    var limit = pathShowAll ? 40 : 8;
    var typedRes = getAllItemsByType(index, typeFilter, limit);
    var disp = typedRes.items;
    var summaryHtml =
      '<div class="path-results-summary">' +
        '<span>Материалы раздела: ' + typedRes.total + '</span>' +
        '<button type="button" class="prs-reset" onclick="setPathTypeFilter(\'all\')">Сбросить фильтр</button>' +
      '</div>';
    var listHtml = disp.map(renderPathResultCard).join('');
    if (typedRes.total > limit && !pathShowAll) {
      listHtml += '<button type="button" class="show-all-btn" onclick="togglePathShowAll()">Показать ещё (' + disp.length + ' из ' + typedRes.total + ')</button>';
    }
    resultsEl.innerHTML = summaryHtml + listHtml;
    return;
  }

  var queryRes = IqraGraph.queryPathItems({
    query: q,
    mode: mode,
    tag: activePathTag,
    itemTypeFilter: typeFilter
  }, index);

  var ctxBannerEl = document.getElementById('path-context-banner');
  if (ctxBannerEl) ctxBannerEl.innerHTML = '';

  var bannerHtml = buildPathContextBannerHtml(queryRes);
  var matchedBar = renderMatchedSuggestionsBar(queryRes.matchedTopics, queryRes.matchedMoods, queryRes.matchedScholars);
  var finalItems = queryRes.items || [];

  if (!finalItems.length) {
    resultsEl.innerHTML = bannerHtml + matchedBar +
      '<div class="path-empty">' +
        'По вашему запросу в этом фильтре ничего не найдено.' +
        (typeFilter !== 'all' ? '<br>Попробуйте переключить тип источника на «Всё».' : '<br>Попробуйте другое слово или выберите тему ниже.') +
        '<div class="path-fallback" style="justify-content:center;margin-top:16px;">' +
          (typeFilter !== 'all' ? '<button type="button" class="path-chip active" onclick="setPathTypeFilter(\'all\')">Показать всё</button>' : '') +
          '<button type="button" class="path-chip" onclick="openPathFilter(\'mood\',\'Тревога\')">Тревога</button>' +
          '<button type="button" class="path-chip" onclick="openPathFilter(\'theme\',\'Единобожие\')">Единобожие</button>' +
          '<button type="button" class="path-chip" onclick="openPathFilter(\'scholar\',\'scholar:ibn_kathir\')">Ибн Касир</button>' +
          '<button type="button" class="path-chip" onclick="switchTab(\'quran\')">Открыть Коран</button>' +
        '</div>' +
      '</div>';
    return;
  }

  var pageSize = 8;
  var hasMore = finalItems.length > pageSize && !pathShowAll;
  var displayItems = pathShowAll ? finalItems : finalItems.slice(0, pageSize);

  var headHtml =
    '<div class="path-results-summary">' +
      '<span>Найдено в Умной книге: ' + finalItems.length + '</span>' +
      (typeFilter !== 'all' ? '<button type="button" class="prs-reset" onclick="setPathTypeFilter(\'all\')">Показать всё</button>' : '') +
    '</div>';

  var cardsHtml = displayItems.map(renderPathResultCard).join('');
  if (hasMore) {
    cardsHtml += '<button type="button" class="show-all-btn" onclick="togglePathShowAll()">Показать все результаты (' + finalItems.length + ')</button>';
  }

  resultsEl.innerHTML = bannerHtml + matchedBar + headHtml + cardsHtml;
}
