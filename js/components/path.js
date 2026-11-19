"use strict";

var debouncedRenderPath = debounce(renderPath, 250);

function getOrderedPathThemes() {
  var result = new Array();
  var seen = new Set();
  if (Array.isArray(window.GRAPH_THEMES)) {
    window.GRAPH_THEMES.forEach(function (t) {
      if (t && t.title_ru && !seen.has(t.title_ru)) {
        seen.add(t.title_ru);
        result.push(t.title_ru);
      }
    });
  }
  if (Array.isArray(window.ALL_TAGS)) {
    window.ALL_TAGS.forEach(function (tag) {
      if (tag && !seen.has(tag)) {
        seen.add(tag);
        result.push(tag);
      }
    });
  }
  return result;
}

function renderPathChips() {
  var container = document.getElementById('path-chips-container');
  if (!container) return;
  var themes = getOrderedPathThemes();
  var html = '<button class="path-chip ' + (!activePathTag ? 'active' : '') + '" onclick="setPathTag(null)">Все темы</button>';
  html += themes.map(function (tag) {
    return '<button class="path-chip ' + (activePathTag === tag ? 'active' : '') + '" onclick="setPathTag(\'' + escAttr(tag) + '\')">' + esc(tag) + '</button>';
  }).join('');
  container.innerHTML = html;
}

function setPathTag(tag) {
  activePathTag = tag;
  pathShowAll = false;
  var qInput = document.getElementById('path-search');
  if (qInput) qInput.value = '';
  renderPathChips();
  renderPath();
}

function togglePathShowAll() {
  pathShowAll = true;
  renderPath();
}

function normalizeSurahAyah(surahNum, ayahNum) {
  var s = Number(surahNum);
  var a = Number(ayahNum);
  if (!Number.isFinite(s) || !Number.isFinite(a)) return null;
  return { surah: s, ayah: a };
}

function resolveTafsirForAyah(surahNum, ayahNum) {
  var norm = normalizeSurahAyah(surahNum, ayahNum);
  if (!norm || !Array.isArray(window.DEFAULT_TAFSIRS)) return null;
  var found = window.DEFAULT_TAFSIRS.find(function (t) {
    return t &&
      Number(t.surah) === norm.surah &&
      Number(t.ayah) === norm.ayah &&
      t.status !== 'placeholder' &&
      typeof t.tafsir_text === 'string' &&
      t.tafsir_text.trim() !== '' &&
      !t.tafsir_text.includes('Ин ша Аллах, здесь скоро появится тафсир');
  });
  return found || null;
}

function scholarIdFromName(sourceText) {
  if (!sourceText || !Array.isArray(window.GRAPH_SCHOLARS)) return 'ibn_kathir';
  var low = String(sourceText).toLowerCase();
  if (low.includes('ибн касир')) return 'ibn_kathir';
  if (low.includes('саади') || low.includes('са‘ди')) return 'as_saadi';
  var match = window.GRAPH_SCHOLARS.find(function (s) {
    return s && s.name_ru && low.includes(s.name_ru.toLowerCase());
  });
  return match ? match.id : 'ibn_kathir';
}

function flattenQuranToAyahs() {
  var result = new Array();
  (state.quran || new Array()).forEach(function (q) {
    if (q.type === 'surah') {
      var ayahs = parseAyahs(q);
      var tags = Array.isArray(q.tags) ? q.tags : new Array();
      ayahs.forEach(function (a, i) {
        result.push({
          _type: 'ayah',
          _id: q.id + '_' + i,
          _surahId: q.id,
          _surahTitle: q.title,
          _surahNum: q.number,
          _ayahNum: a.num,
          _ayahIdx: i,
          _ar: a.ar,
          _tr: a.tr,
          _trn: a.trn,
          _tags: tags,
          _title: q.title + ' · аят ' + a.num,
          _sub: q.subtitle || '',
          _isSurahAyah: true
        });
      });
    } else {
      result.push({
        _type: 'ayah',
        _id: q.id,
        _surahId: q.id,
        _surahTitle: q.title,
        _surahNum: q.number,
        _ayahNum: 1,
        _ayahIdx: 0,
        _ar: q.arabic,
        _tr: q.transcription,
        _trn: q.translation,
        _tags: Array.isArray(q.tags) ? q.tags : new Array(),
        _title: q.title,
        _sub: q.subtitle || '',
        _isSurahAyah: false
      });
    }
  });
  return result;
}

function renderPath() {
  renderPathChips();

  var qInput = document.getElementById('path-search');
  var q = (qInput ? qInput.value : '').toLowerCase().trim();
  var resultsEl = document.getElementById('path-results');
  if (!resultsEl) return;

  if (!q && !activePathTag) {
    var featuredThemes = getOrderedPathThemes().slice(0, 7);
    var featuredHtml = featuredThemes.map(function (t) {
      return '<button class="path-chip" onclick="setPathTag(\'' + escAttr(t) + '\')">' + esc(t) + '</button>';
    }).join('');
    resultsEl.innerHTML =
      '<div class="path-empty">' +
        'Введите запрос или выберите тему ниже, чтобы найти ответ в Коране и Сунне.' +
        '<div class="path-fallback">' + featuredHtml + '</div>' +
      '</div>';
    return;
  }

  var ayats = flattenQuranToAyahs();
  var finalItems = new Array();

  if (activePathTag && Array.isArray(window.GRAPH_EDGES) && Array.isArray(window.GRAPH_THEMES)) {
    var themeObj = window.GRAPH_THEMES.find(function (t) { return t.title_ru === activePathTag; });
    var themeId = themeObj ? themeObj.id : activePathTag.toLowerCase();
    var semanticEdges = window.GRAPH_EDGES.filter(function (e) {
      return e.type === 'ayah_theme' && e.to === ('theme:' + themeId);
    });

    semanticEdges.forEach(function (edge) {
      var ayahRef = edge.from.replace('ayah:', '');
      var parts = ayahRef.split('#');
      var surahId = parts.at(0);
      var ayahNum = parts.at(1);
      var foundAyah = ayats.find(function (a) {
        return a._surahId === surahId && String(a._ayahNum) === String(ayahNum || 1);
      });
      if (foundAyah) {
        var sourceLoc = edge.evidence_source && edge.evidence_source.locator ? edge.evidence_source.locator : '';
        var tafsirObj = foundAyah._isSurahAyah ? resolveTafsirForAyah(foundAyah._surahNum, foundAyah._ayahNum) : null;
        var tafsirText = tafsirObj ? tafsirObj.tafsir_text : '';
        var scholarId = tafsirObj ? scholarIdFromName(tafsirObj.source) : 'ibn_kathir';

        var relatedHadithEdges = window.GRAPH_EDGES.filter(function (e) {
          return e.type === 'hadith_explains_ayah' && e.to === ('ayah:' + ayahRef);
        });
        var relatedHadiths = new Array();
        relatedHadithEdges.forEach(function (he) {
          var hId = he.from.replace('hadith:', '');
          var hObj = (state.hadiths || new Array()).find(function (h) { return h.id === hId; });
          if (hObj && !relatedHadiths.find(function (x) { return x.id === hObj.id; })) {
            relatedHadiths.push(hObj);
          }
        });

        finalItems.push(Object.assign({}, foundAyah, {
          _semanticJustification: sourceLoc,
          _tafsirReason: tafsirText,
          _hasTafsir: Boolean(tafsirText),
          _scholarId: scholarId,
          _relatedHadiths: relatedHadiths
        }));
      }
    });
  }

  if (q || !activePathTag) {
    var duas = (state.duas || new Array()).map(function (d) {
      return {
        _type: 'dua',
        _id: d.id,
        _title: d.title,
        _sub: d.subtitle || '',
        _ar: d.arabic,
        _tr: d.transcription,
        _trn: d.translation,
        _tags: Array.isArray(d.tags) ? d.tags : new Array(),
        _isSurahAyah: false
      };
    });
    var hadiths = (state.hadiths || new Array()).map(function (h) {
      return {
        _type: 'hadith',
        _id: h.id,
        _title: h.title,
        _sub: h.subtitle || '',
        _ar: h.arabic,
        _tr: h.transcription,
        _trn: h.translation,
        _tags: Array.isArray(h.tags) ? h.tags : new Array(),
        _isSurahAyah: false
      };
    });
    var textItems = ayats.concat(duas, hadiths);

    if (activePathTag) {
      textItems = textItems.filter(function (item) {
        if (Array.isArray(item._tags) && item._tags.includes(activePathTag)) return true;
        var hay = [item._title, item._sub, item._trn, item._tr, item._ar].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(activePathTag.toLowerCase());
      });
    }
    if (q) {
      var searchStr = q.toLowerCase().trim();
      textItems = textItems.filter(function (item) {
        var hay = [item._title, item._sub, item._trn, item._tr, item._ar].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(searchStr);
      });
    }
    textItems.forEach(function (item) {
      if (!finalItems.find(function (f) { return f._id === item._id; })) {
        finalItems.push(item);
      }
    });
  }

  if (!finalItems.length) {
    var fallbackThemes = getOrderedPathThemes().slice(0, 4);
    var fallbackHtml = fallbackThemes.map(function (t) {
      return '<button class="path-chip" onclick="setPathTag(\'' + escAttr(t) + '\')">' + esc(t) + '</button>';
    }).join('');
    resultsEl.innerHTML =
      '<div class="path-empty">' +
        'По вашему запросу ничего не найдено.<br>Попробуйте смежные темы или откройте базовую суру.' +
        '<div class="path-fallback">' +
          fallbackHtml +
          '<button class="path-chip" onclick="switchTab(\'quran\')">Открыть Коран</button>' +
        '</div>' +
      '</div>';
    return;
  }

  var hasMore = finalItems.length > 5 && !pathShowAll;
  var displayItems = pathShowAll ? finalItems : finalItems.slice(0, 5);

  var html = displayItems.map(function (item) {
    var isAyah = item._type === 'ayah';
    var icon = '#i-book';
    var typeLabel = 'Коран';
    if (item._type === 'hadith') {
      icon = '#i-scroll';
      typeLabel = 'Хадис';
    } else if (item._type === 'dua') {
      icon = '#i-dua';
      typeLabel = 'Дуа';
    } else if (isAyah && item._surahTitle) {
      typeLabel = 'Коран · ' + item._surahTitle;
    }

    var openAction = isAyah
      ? 'openQuran(\'' + escAttr(item._surahId) + '\')'
      : 'openPathItem(\'' + item._type + '\', \'' + escAttr(item._id) + '\')';

    var openBtn = (isAyah && item._isSurahAyah)
      ? '<button class="btn secondary btn-inline" onclick="event.stopPropagation();openRead(\'' + escAttr(item._surahId) + '\')"><svg class="ico ico-sm"><use href="#i-book"/></svg> Читать суру полностью</button>'
      : '';

    var semanticBlock = '';
    if (item._semanticJustification) {
var scholar = Array.isArray(window.GRAPH_SCHOLARS)
? window.GRAPH_SCHOLARS.find(function (s) { return s.id === item._scholarId; })
: null;
var scholarName = scholar ? scholar.name_ru : 'Ибн Касир';
var locText = item._semanticJustification;
if (locText.includes(';')) locText = locText.split(';').at(0);
var tafsirHtml = item._hasTafsir
? '«' + esc(item._tafsirReason) + '»'
: 'Ин ша Аллах, здесь скоро появится тафсир';
var hadithsHtml = (Array.isArray(item._relatedHadiths) && item._relatedHadiths.length > 0)
? item._relatedHadiths.map(function (h) {
return '' +
'' + esc(h.title || 'Достоверный хадис') + (h.subtitle ? ' · ' + esc(h.subtitle) : '') + '' +
'' + esc(h.translation || '') + '' +
'';
}).join('')
: '';
semanticBlock =
'' +
'Смысловая связь' +
tafsirHtml +
'' +
'' + esc(scholarName) + ' · ' + esc(locText) + '' +
'' +
' Справка' +
'' +
'' +
hadithsHtml +
'';
}
return '' +
'' +
'' +
'' + esc(typeLabel) + '' +
'' +
'' + esc(item._title) + '' +
(item._sub ? '' + esc(item._sub) + '' : '') +
(item._ar ? '' + esc(item._ar) + '' : '') +
'' + esc(item._trn || item._tr || '') + '' +
semanticBlock +
openBtn +
'';
}).join('');
if (hasMore) {
html += 'Показать все результаты (' + finalItems.length + ')';
}
resultsEl.innerHTML = html;
}
function openPathItem(type, id) {
if (type === 'quran') openQuran(id);
else if (type === 'hadith') openHadith(id);
else if (type === 'dua') openDua(id);
}
