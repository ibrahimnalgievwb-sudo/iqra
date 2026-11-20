"use strict";

/* PATH.JS — Путь (поиск по темам) · Проект «Икра» · v435
   Темы читаются из themes.json (поле title). Основание связи — из идентификатора связи в edges.json.
   v435: добавлен рендер связей dua_theme (дуа → тема) и удалены связи на отсутствующие суры 93/99/101. */

var debouncedRenderPath = debounce(renderPath, 250);

var TAG_STEMS = {
  'Гнев': ['гнев', 'ярост', 'злост', 'раздраж', 'сдержан', 'проща'],
  'Тревога': ['тревог', 'беспокой', 'печал', 'груст', 'скорб', 'утеш', 'облегч', 'тягот'],
  'Страх': ['страх', 'боязн', 'бойтесь', 'защит', 'прибега', 'убежищ', 'охраня'],
  'Печаль': ['печал', 'груст', 'скорб', 'тоск', 'уныни', 'тягот', 'облегч'],
  'Болезнь': ['болезн', 'исцел', 'здоров', 'недуг', 'леч', 'боль', 'страдан'],
  'Несправедливость': ['несправедлив', 'притесн', 'обид', 'угнет', 'справедлив', 'суд'],
  'Потеря': ['потер', 'утрат', 'лишен', 'смерт', 'терпен', 'воздаян'],
  'Семья': ['родител', 'мать', 'отец', 'дет', 'жен', 'муж', 'семь', 'родств', 'сирот'],
  'Терпение': ['терп', 'стойк', 'испытан', 'тягот', 'облегч'],
  'Покаяние': ['покай', 'прост', 'прощ', 'грех', 'кай'],
  'Прощение': ['прост', 'прощ', 'милосерд', 'милостив', 'снисхожд'],
  'Упование': ['упова', 'полаг', 'помощ', 'достаточ', 'защит'],
  'Сомнение': ['сомнен', 'истин', 'знан', 'прям', 'пут', 'размышл'],
  'Вера': ['вер', 'уверова', 'единобож', 'господ', 'поклоня'],
  'Искренность': ['искрен', 'ради аллаха', 'показух', 'намерен', 'сердц'],
  'Смирение': ['смирен', 'покорн', 'богобоязн', 'молитв', 'намаз'],
  'Благодарность': ['благодар', 'хвал', 'милост', 'благ', 'щедр'],
  'Защита Аллаха': ['защит', 'прибега', 'хранител', 'шайтан', 'зла', 'колдовств'],
  'Единобожие': ['единобож', 'един', 'божеств', 'поклоня', 'господ'],
  'Судный день': ['судн', 'воздаян', 'воскреш', 'расчет', 'расчёт', 'могил']
};

function getMergedPathTags() {
  var list = new Array();
  var seen = new Set();
  if (Array.isArray(window.ALL_TAGS)) {
    window.ALL_TAGS.forEach(function (t) {
      if (t && !seen.has(t)) {
        seen.add(t);
        list.push(t);
      }
    });
  }
  if (Array.isArray(window.GRAPH_THEMES)) {
    window.GRAPH_THEMES.forEach(function (th) {
      var thTitle = th && (th.title_ru || th.title);
      if (thTitle && !seen.has(thTitle)) {
        seen.add(thTitle);
        list.push(thTitle);
      }
    });
  }
  return list;
}

function renderPathChips() {
  var container = document.getElementById('path-chips-container');
  if (!container) return;
  var tags = getMergedPathTags();
  var html = '\x3cbutton class="path-chip ' + (!activePathTag ? 'active' : '') + '" onclick="setPathTag(null)">Все темы\x3c/button>';
  html += tags.map(function (tag) {
    return '\x3cbutton class="path-chip ' + (activePathTag === tag ? 'active' : '') + '" onclick="setPathTag(\'' + escAttr(tag) + '\')">' + esc(tag) + '\x3c/button>';
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
  var match = window.GRAPH_SCHOLARS.find(function (s) {
    return s && s.name_ru && low.includes(s.name_ru.toLowerCase());
  });
  return match ? match.id : 'ibn_kathir';
}

function describePathEvidence(ev, surahNum, ayahNum) {
  /* ev — строка вида tafsir:ibn_kathir_1_5 | hadith:h_ikhlas | quran:93_11 | dua_collection_verified */
  if (!ev) return '';
  if (typeof ev === 'object') return ev.locator ? String(ev.locator).split(';').at(0) : '';
  var s = String(ev);
  var kind = s.split(':').at(0);
  var rest = s.slice(kind.length + 1);
  if (kind === 'tafsir') {
    var m = rest.match(/_(\d+)_(\d+)$/);
    var sn = m ? Number(m[1]) : surahNum;
    var an = m ? Number(m[2]) : ayahNum;
    var tf = resolveTafsirForAyah(sn, an);
    var who = tf && tf.source && tf.source.scholar ? tf.source.scholar : '';
    return 'тафсир' + (who ? ', ' + who : '') + ', аят ' + sn + ':' + an;
  }
  if (kind === 'hadith') {
    var h = (state.hadiths || new Array()).find(function (x) { return x.id === rest; });
    return h && h.title ? 'хадис «' + h.title + '»' : '';
  }
  if (kind === 'quran') {
    var q = rest.match(/^(\d+)_(\d+)$/);
    return q ? 'Коран, аят ' + q[1] + ':' + q[2] : '';
  }
  if (s === 'dua_collection_verified') {
    return 'дуа проверена положительно';
  }
  return '';
}

function describeTafsirSource(tf) {
  if (!tf || !tf.source) return '';
  var parts = new Array();
  if (tf.source.scholar) parts.push(tf.source.scholar);
  if (tf.source.book) parts.push(tf.source.book);
  if (tf.source.volume) parts.push('т. ' + tf.source.volume);
  return parts.join(' · ');
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
    resultsEl.innerHTML =
      '\x3cdiv class="path-empty">' +
        'Введите запрос или выберите тему ниже, чтобы найти ответ в Коране и Сунне.' +
        '\x3cdiv class="path-fallback">' +
          '\x3cbutton class="path-chip" onclick="setPathTag(\'Терпение\')">Терпение\x3c/button>' +
          '\x3cbutton class="path-chip" onclick="setPathTag(\'Тревога\')">Тревога\x3c/button>' +
          '\x3cbutton class="path-chip" onclick="setPathTag(\'Защита Аллаха\')">Защита Аллаха\x3c/button>' +
          '\x3cbutton class="path-chip" onclick="setPathTag(\'Единобожие\')">Единобожие\x3c/button>' +
          '\x3cbutton class="path-chip" onclick="setPathTag(\'Упование\')">Упование\x3c/button>' +
        '\x3c/div>' +
      '\x3c/div>';
    return;
  }

  var ayats = flattenQuranToAyahs();
  var finalItems = new Array();

  if (activePathTag && Array.isArray(window.GRAPH_EDGES) && Array.isArray(window.GRAPH_THEMES)) {
    var themeObj = window.GRAPH_THEMES.find(function (t) { return (t.title_ru || t.title) === activePathTag; });
    var themeId = themeObj ? themeObj.id : activePathTag.toLowerCase();

    /* v435: связи аят → тема */
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
        var tafsirObj = foundAyah._isSurahAyah ? resolveTafsirForAyah(foundAyah._surahNum, foundAyah._ayahNum) : null;
        var sourceLoc = describePathEvidence(edge.evidence_source, foundAyah._surahNum, foundAyah._ayahNum);
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
          _themeTitle: themeObj ? (themeObj.title_ru || themeObj.title) : activePathTag,
          _tafsirReason: tafsirText,
          _tafsirSource: describeTafsirSource(tafsirObj),
          _hasTafsir: Boolean(tafsirText),
          _scholarId: scholarId,
          _relatedHadiths: relatedHadiths
        }));
      }
    });

    /* v435: связи дуа → тема (новое) */
    var duaEdges = window.GRAPH_EDGES.filter(function (e) {
      return e.type === 'dua_theme' && e.to === ('theme:' + themeId);
    });
    duaEdges.forEach(function (edge) {
      var duaId = edge.from.replace('dua:', '');
      var dObj = (state.duas || new Array()).find(function (d) { return d.id === duaId; });
      if (dObj) {
        finalItems.push({
          _type: 'dua',
          _id: dObj.id,
          _title: dObj.title,
          _sub: dObj.subtitle || '',
          _ar: dObj.arabic,
          _tr: dObj.transcription,
          _trn: dObj.translation,
          _tags: Array.isArray(dObj.tags) ? dObj.tags : new Array(),
          _isSurahAyah: false,
          _semanticJustification: describePathEvidence(edge.evidence_source),
          _themeTitle: themeObj ? (themeObj.title_ru || themeObj.title) : activePathTag
        });
      }
    });
  }

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
    var stems = TAG_STEMS[activePathTag] || new Array(activePathTag.toLowerCase());
    textItems = textItems.filter(function (item) {
      if (Array.isArray(item._tags) && item._tags.includes(activePathTag)) return true;
      var hay = [item._title, item._sub, item._trn, item._tr, item._ar].filter(Boolean).join(' ').toLowerCase();
      return stems.some(function (st) { return hay.includes(st); });
    });
  }

  if (q) {
    var searchStr = q.toLowerCase().trim();
    textItems = textItems.filter(function (item) {
      var hay = [item._title, item._sub, item._trn, item._tr, item._ar].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(searchStr);
    });
    finalItems = finalItems.filter(function (item) {
      var hay = [item._title, item._sub, item._trn, item._tr, item._ar, item._tafsirReason].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(searchStr);
    });
  }

  textItems.forEach(function (item) {
    if (!finalItems.find(function (f) { return f._id === item._id; })) {
      finalItems.push(item);
    }
  });

  if (!finalItems.length) {
    resultsEl.innerHTML =
      '\x3cdiv class="path-empty">' +
        'По вашему запросу ничего не найдено.\x3cbr>Попробуйте смежные темы или откройте базовую суру.' +
        '\x3cdiv class="path-fallback">' +
          '\x3cbutton class="path-chip" onclick="setPathTag(\'Гнев\')">Гнев\x3c/button>' +
          '\x3cbutton class="path-chip" onclick="setPathTag(\'Тревога\')">Тревога\x3c/button>' +
          '\x3cbutton class="path-chip" onclick="setPathTag(\'Страх\')">Страх\x3c/button>' +
          '\x3cbutton class="path-chip" onclick="setPathTag(\'Печаль\')">Печаль\x3c/button>' +
          '\x3cbutton class="path-chip" onclick="switchTab(\'quran\')">Открыть Коран\x3c/button>' +
        '\x3c/div>' +
      '\x3c/div>';
    return;
  }

  var hasMore = finalItems.length > 5 && !pathShowAll;
  var displayItems = pathShowAll ? finalItems : finalItems.slice(0, 5);

  var html = displayItems.map(function (item) {
    var isAyah = item._type === 'ayah';
    var icon = '#i-book';
    var typeLabel = 'Коран';
    if (item._type === 'hadith') { icon = '#i-scroll'; typeLabel = 'Хадис'; }
    else if (item._type === 'dua') { icon = '#i-dua'; typeLabel = 'Дуа'; }
    else if (isAyah && item._surahTitle) { typeLabel = 'Коран · ' + item._surahTitle; }

    var openAction = isAyah
      ? 'openQuran(\'' + escAttr(item._surahId) + '\')'
      : 'openPathItem(\'' + item._type + '\', \'' + escAttr(item._id) + '\')';

    var openBtn = (isAyah && item._isSurahAyah)
      ? '\x3cbutton class="btn secondary btn-inline" onclick="event.stopPropagation();openRead(\'' + escAttr(item._surahId) + '\')">\x3csvg class="ico ico-sm">\x3cuse href="#i-book"/>\x3c/svg> Читать суру полностью\x3c/button>'
      : '';

    var semanticBlock = '';
    var hasHadiths = Array.isArray(item._relatedHadiths) && item._relatedHadiths.length > 0;
    if (item._semanticJustification || item._hasTafsir || hasHadiths) {
      var rowsHtml = '';
      if (item._themeTitle) {
        rowsHtml += '<div style="font-size: 13px; line-height: 1.5; margin-bottom: 5px;"><b style="font-weight: 600; color: var(--muted);">Тема:</b> ' + esc(item._themeTitle) + '</div>';
      }
      if (item._semanticJustification) {
        rowsHtml += '<div style="font-size: 13px; line-height: 1.5; margin-bottom: 5px;"><b style="font-weight: 600; color: var(--muted);">Основание:</b> ' + esc(item._semanticJustification) + '</div>';
      }

      var tafsirHtml = '';
      if (item._hasTafsir) {
        tafsirHtml =
          '<details class="tafsir-card" style="margin-top: 10px; background: var(--card2); border-radius: 10px; padding: 10px 12px;">' +
            '<summary style="font-weight: 700; color: var(--gold-accent); font-size: 13.5px; outline: none; display: flex; align-items: center; gap: 8px; cursor: pointer; list-style: none;">' +
              '<svg class="ico ico-sm"><use href="#i-book"/></svg> Показать тафсир' +
            '</summary>' +
            '<div style="margin-top: 10px; font-size: 14px; line-height: 1.6; color: var(--text); border-top: 1px dashed var(--border); padding-top: 10px;">' +
              escNl(item._tafsirReason) +
            '</div>' +
          '</details>' +
          '<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-top: 12px;">' +
            '<div style="font-size: 12px; color: var(--muted); font-style: italic;">' + esc(item._tafsirSource) + '</div>' +
            '<button onclick="event.stopPropagation(); openScholarInfo(\'' + escAttr(item._scholarId) + '\')" class="btn secondary" style="width: auto; margin: 0; padding: 6px 12px; font-size: 12px; font-weight: 600; min-height: 30px; border-radius: 8px; display: flex; align-items: center; gap: 6px;">' +
              '<svg class="ico ico-sm"><use href="#i-info"/></svg> Справка' +
            '</button>' +
          '</div>';
      }

      var hadithsHtml = hasHadiths
        ? item._relatedHadiths.map(function (h) {
            return '<div onclick="event.stopPropagation(); openHadith(\'' + escAttr(h.id) + '\')" style="margin-top: 10px; padding: 10px 12px; background: rgba(212, 175, 55, 0.08); border: 1px solid rgba(212, 175, 55, 0.22); border-radius: 10px; cursor: pointer;">' +
              '<div style="font-size: 11.5px; color: var(--gold-accent); font-weight: 700; margin-bottom: 4px;">' + esc(h.title || 'Хадис') + (h.subtitle ? ' · ' + esc(h.subtitle) : '') + '</div>' +
              '<div style="font-size: 13px; color: var(--text); line-height: 1.5;">' + esc(h.translation || '') + '</div>' +
              (h.source ? '<div style="font-size: 12px; color: var(--muted); font-style: italic; margin-top: 4px;">' + esc(h.source) + '</div>' : '') +
            '</div>';
          }).join('')
        : '';

      semanticBlock =
        '<div onclick="event.stopPropagation()" style="margin-top: 16px; padding: 14px; background: rgba(var(--accent-rgb), 0.05); border-left: 3px solid var(--gold-accent); border-radius: 8px; text-align: left;">' +
          '<div style="font-size: 11px; color: var(--gold-accent); font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 9px;">Смысловая связь</div>' +
          rowsHtml +
          tafsirHtml +
          hadithsHtml +
        '</div>';
    }

    return '\x3cdiv class="content-card" onclick="' + openAction + '">' +
      '\x3cdiv class="c-sub" style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">' +
        '\x3csvg class="ico ico-sm" style="color:var(--gold-accent)">\x3cuse href="' + icon + '"/>\x3c/svg>' +
      '\x3cspan style="text-transform:uppercase; font-weight:700; letter-spacing:.5px;">' + esc(typeLabel) + '\x3c/span>' +
'\x3c/div>' +
'\x3cdiv class="c-title">' + esc(item._title) + '\x3c/div>' +
(item._sub ? '\x3cdiv class="c-sub">' + esc(item._sub) + '\x3c/div>' : '') +
(item._ar ? '\x3cdiv class="c-ar">' + esc(item._ar) + '\x3c/div>' : '') +
'\x3cdiv class="c-tr">' + esc(item._trn || item._tr || '') + '\x3c/div>' +
semanticBlock +
openBtn +
'\x3c/div>';
}).join('');
if (hasMore) {
html += '\x3cbutton class="show-all-btn" onclick="togglePathShowAll()">Показать все результаты (' + finalItems.length + ')\x3c/button>';
}
resultsEl.innerHTML = html;
}
function openPathItem(type, id) {
if (type === 'quran') openQuran(id);
else if (type === 'hadith') openHadith(id);
else if (type === 'dua') openDua(id);
}
