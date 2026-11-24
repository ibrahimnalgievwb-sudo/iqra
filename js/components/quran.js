"use strict";

/* ============================================================
   QURAN.JS — Список 114 сур, быстрый переход по номеру/аяту, разбор суры
   Проект «Икра» · v450
   ============================================================ */

var debouncedRenderQuranList = debounce(renderQuranList, 200);
var QURAN_DETAIL_BATCH = 40;
var _quranDetailLimit = QURAN_DETAIL_BATCH;

function excerpt(text, lines) {
  return String(text || '').split('\n').slice(0, lines).join('\n');
}

function parseDirectVerseQuery(raw) {
  var m = String(raw || '').trim().match(/^(\d{1,3})\s*[:\-]\s*(\d{1,3})$/);
  if (!m) return null;
  var sNum = parseInt(m[1], 10);
  var aNum = parseInt(m[2], 10);
  if (sNum < 1 || sNum > 114 || aNum < 1) return null;
  return { surah: sNum, ayah: aNum };
}

function renderQuranList() {
  var el = document.getElementById('quran-list');
  var qEl = document.getElementById('quran-search');
  if (!el) return;

  var rawQ = qEl ? (qEl.value || '').trim() : '';
  var verseRef = parseDirectVerseQuery(rawQ);
  var q = verseRef ? String(verseRef.surah) : rawQ.toLowerCase();
  var qAr = normalizeArabic(q);

  var items = state.quran;
  if (quranFilter === 'surah') items = items.filter(function (i) { return i.type === 'surah'; });
  else if (quranFilter === 'juz30') items = items.filter(function (i) { return i.type === 'surah' && i.number >= 78 && i.number <= 114; });
  else if (quranFilter === 'ruqyah') items = items.filter(function (i) { return i.type === 'ruqyah' || ['q109', 'q112', 'q113', 'q114'].indexOf(i.id) !== -1; });

  if (q) {
    items = items.filter(function (item) {
      if (String(item.number || '') === q) return true;
      var numStr = String(item.number || '');
      if (/^\d+$/.test(q) && item.type === 'surah') {
        return numStr === q || numStr.indexOf(q) === 0;
      }
      var hay = [item.title, item.subtitle, item.transcription, item.translation, numStr].filter(Boolean).join(' ').toLowerCase();
      if (hay.indexOf(q) !== -1) return true;
      if (item.arabic && item.arabic.toLowerCase().indexOf(q) !== -1) return true;
      if (qAr && normalizeArabic([item.title, item.arabic, item.transcription].filter(Boolean).join(' ')).indexOf(qAr) !== -1) return true;
      return false;
    });
  }

  if (!items.length && quranFilter !== 'ruqyah' && !verseRef) {
    el.innerHTML = state.quran.length ? '<div class="empty">Ничего не найдено</div>' : '<div class="empty">Пока нет текстов</div>';
    return;
  }

  var html = '';
  if (verseRef) {
    var targetSurah = getQuranById('q' + verseRef.surah);
    if (targetSurah) {
      var targetIdx = Math.max(0, verseRef.ayah - 1);
      html += '<button type="button" class="content-card content-card--feature content-card-btn" onclick="openRead(\'' + escAttr(targetSurah.id) + '\',' + targetIdx + ')">' +
        '<div class="c-badge">Прямой переход</div>' +
        '<div class="c-title">Открыть аят ' + verseRef.surah + ':' + verseRef.ayah + ' (' + esc(targetSurah.title) + ')</div>' +
        '<div class="c-sub">Перейти сразу в режим чтения к нужному аяту</div>' +
      '</button>';
    }
  }

  if (quranFilter === 'ruqyah' && !rawQ) {
    html += '<button type="button" class="content-card content-card--feature content-card-btn" onclick="openDua(\'ruqyah_guide\')">' +
      '<div class="c-title"><svg class="ico ico-sm ico-inline-gold"><use href="#i-book"/></svg>Руководство по Рукье</div>' +
      '<div class="c-sub">Аль-Му‘аввизат · Аят аль-Курси · Достоверная Сунна</div>' +
      '<div class="c-tr">Аяты Корана и полные тексты хадисов из «Сахихов» аль-Бухари и Муслима</div>' +
    '</button>';
    html += '<button type="button" class="content-card content-card--feature content-card-btn" onclick="openQuran(\'ruqyah_araf\')">' +
      '<div class="c-badge">Коран · 7:117–119</div>' +
      '<div class="c-title">Аяты о победе истины над колдовством</div>' +
      '<div class="c-sub">Суры «Аль-А‘раф» (7:117–119), «Юнус» (10:79–82) и «Та Ха» (20:65–69)</div>' +
      '<div class="c-ar ar-font">۞ وَأَوْحَيْنَآ إِلَىٰ مُوسَىٰٓ أَنْ أَلْقِ عَصَاكَ ۖ فَإِذَا هِىَ تَلْقَفُ مَا يَأْفِكُونَ</div>' +
      '<div class="c-tr">«Мы внушили Мусе: \"Брось свой посох!\". И вот она (змея) стала заглатывать то, что они измыслили»</div>' +
    '</button>';
  }

  html += items.map(function (item) {
    var fav = isFavorite(item.id);
    var numHtml = item.type === 'surah' ? '<div class="c-num">' + item.number + '</div>' : '';
    var hasNum = item.type === 'surah' ? ' has-num' : '';
    var star = '<button type="button" class="star-btn ' + (fav ? 'active' : '') + '" aria-label="' + (fav ? 'Убрать из избранного' : 'Добавить в избранное') + ': ' + escAttr(item.title) + '" onclick="starClick(event,\'' + escAttr(item.id) + '\',\'quran\')">' + (fav ? '<svg class="ico"><use href="#i-star-filled"/></svg>' : '<svg class="ico"><use href="#i-star"/></svg>') + '</button>';
    var readBadge = '';
    if (item.type === 'surah' && state.settings.readAyah && typeof state.settings.readAyah[item.id] === 'number' && state.settings.readAyah[item.id] > 0) {
      readBadge = '<div class="c-badge">С аята ' + (state.settings.readAyah[item.id] + 1) + '</div>';
    }
    return '<div class="content-card' + hasNum + '" role="button" tabindex="0" onclick="openQuran(\'' + escAttr(item.id) + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openQuran(\'' + escAttr(item.id) + '\')}">' +
      numHtml + star + readBadge +
      '<div class="c-title">' + esc(item.title) + '</div>' +
      (item.subtitle ? '<div class="c-sub">' + esc(item.subtitle) + '</div>' : '') +
      '<div class="c-ar ar-font">' + esc(excerpt(item.arabic, 1)) + '</div>' +
      '<div class="c-tr">' + esc(excerpt(item.translation, 1)) + '</div>' +
    '</div>';
  }).join('');

  el.innerHTML = html;
}

function setQuranFilter(f) {
  quranFilter = f;
  document.querySelectorAll('[data-q-filter]').forEach(function (b) {
    b.classList.toggle('active', b.dataset.qFilter === f);
  });
  if (typeof renderQuranList === 'function') renderQuranList();
}

function _buildQuranDetailAyahHtml(item, a, idx) {
  var verseKey = '';
  if (item.type === 'surah') verseKey = item.number + ':' + (idx + 1);
  else if (/^\d+:\d+$/.test(String(a.num || ''))) verseKey = String(a.num);
  else if (item.number && String(item.number).indexOf('-') === -1) verseKey = String(item.number);

  return '<div class="read-ayah ' + (item.type === 'ayat' ? 'ayat-mode' : '') + '" id="q-detail-ayah-' + idx + '" data-verse-key="' + escAttr(verseKey) + '">' +
    '<div class="read-ayah-num">' + esc(a.num) + '</div>' +
    '<div class="read-ayah-ar ar-font" data-raw="' + escAttr(a.ar) + '">' + esc(a.ar) + (item.type === 'surah' ? ' <span class="read-ayah-marker">' + ayahMarker(a.num) + '</span>' : '') + '</div>' +
    (a.tr ? '<div class="read-ayah-tr">' + esc(a.tr) + '</div>' : '') +
    '<div class="read-ayah-trn">' + esc(a.trn) + '</div>' +
    getSmartTafsirHtml(item, idx + 1) +
    (typeof renderAyahEcosystemDetails === 'function' ? renderAyahEcosystemDetails('ayah:' + item.id + '#' + (idx + 1), { inReader: false }) : '') +
    '<button type="button" class="ayah-share-btn" onclick="shareAyah(\'' + escAttr(item.id) + '\',' + idx + ')"><svg class="ico ico-sm"><use href="#i-upload"/></svg>Поделиться аятом</button>' +
  '</div>';
}

function showMoreQuranDetailAyahs() {
  var item = getQuranById(activeQuranId);
  if (!item) return;
  _quranDetailLimit += QURAN_DETAIL_BATCH;
  openQuran(activeQuranId, null, true);
}

function jumpQuranDetailAyah(ayahNumVal) {
  var item = getQuranById(activeQuranId);
  if (!item) return;
  var ayahs = parseAyahs(item);
  var num = Math.max(1, Math.min(ayahs.length, parseInt(ayahNumVal, 10) || 1));
  var targetIdx = num - 1;
  if (targetIdx >= _quranDetailLimit) {
    _quranDetailLimit = targetIdx + 20;
    openQuran(activeQuranId, targetIdx, true);
    return;
  }
  var el = document.getElementById('q-detail-ayah-' + targetIdx);
  if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function openQuran(id, targetAyahIdx, keepLimit) {
  activeQuranId = id;
  if (typeof activeQuranAyahIdx !== 'undefined') {
    activeQuranAyahIdx = (typeof targetAyahIdx === 'number' && targetAyahIdx >= 0) ? targetAyahIdx : null;
  }
  var item = getQuranById(id); if (!item) return;
  if (!keepLimit) {
    _quranDetailLimit = (typeof targetAyahIdx === 'number' && targetAyahIdx >= QURAN_DETAIL_BATCH)
      ? (targetAyahIdx + 20)
      : QURAN_DETAIL_BATCH;
  }
  trackEvent('quran/' + id, 'Сура/аят: ' + item.title);
  saveLastRead('quran', id);
  document.getElementById('quran-detail-title').textContent = item.title;

  var ayahs = parseAyahs(item);
  var visibleCount = Math.min(ayahs.length, _quranDetailLimit);
  var visibleAyahs = ayahs.slice(0, visibleCount);
  var hasMore = ayahs.length > visibleCount;

  var st = document.getElementById('quran-detail-star');
  if (st) {
    var fav = isFavorite(id);
    st.innerHTML = fav ? '<svg class="ico"><use href="#i-star-filled"/></svg>' : '<svg class="ico"><use href="#i-star"/></svg>';
    st.classList.toggle('starred', fav);
  }
  var el = document.getElementById('quran-detail-content');
  var bismillahHtml = '';
  if (item.bismillah) {
    bismillahHtml = '<div class="bismillah-card"><div class="b-ar ar-font">' + esc(item.bismillah.arabic) + '</div><div class="b-tr">' + esc(item.bismillah.transcription) + '</div><div class="b-trn">' + esc(item.bismillah.translation) + '</div></div>';
  }

  var jumpHtml = '';
  if (ayahs.length >= 15) {
    jumpHtml = '<div class="ayah-jumper">' +
      '<label for="qd-ayah-jump" class="aj-label">Перейти к аяту (1–' + ayahs.length + '):</label>' +
      '<input id="qd-ayah-jump" class="aj-input" type="number" min="1" max="' + ayahs.length + '" inputmode="numeric" placeholder="№">' +
      '<button type="button" class="btn secondary btn-inline aj-btn" onclick="jumpQuranDetailAyah(document.getElementById(\'qd-ayah-jump\').value)">Перейти</button>' +
    '</div>';
  }

  var _qLinkify = (typeof IqraScholars !== 'undefined' && typeof IqraScholars.linkifyScholars === 'function')
    ? IqraScholars.linkifyScholars
    : function (h) { return h; };

  var _qNoteHtml = item.note
    ? ((typeof IqraDalil !== 'undefined' && typeof IqraDalil.renderNoteBlocksHtml === 'function')
        ? IqraDalil.renderNoteBlocksHtml(item.note, { linkify: _qLinkify })
        : _qLinkify(escNl(item.note)))
    : '';

  el.innerHTML =
    '<div class="detail-hero">' +
      '<div class="dh-title">' + esc(item.title) + '</div>' +
      (item.subtitle ? '<div class="dh-sub">' + esc(item.subtitle) + '</div>' : '') +
    '</div>' +
    (item.note ? '<div class="note-box"><svg class="ico ico-sm note-box-ico"><use href="#i-lightbulb"/></svg><div class="note-box-body">' + _qNoteHtml + '</div></div>' : '') +
    '<div class="detail-actions">' +
      '<button type="button" class="btn secondary" onclick="openRead(\'' + escAttr(item.id) + '\'' + ((typeof targetAyahIdx === 'number' && targetAyahIdx >= 0) ? (',' + targetAyahIdx) : '') + ')"><svg class="ico ico-sm"><use href="#i-book"/></svg>Читать</button>' +
      '<button type="button" class="btn secondary" onclick="openMemorize(\'' + escAttr(item.id) + '\')"><svg class="ico ico-sm"><use href="#i-lightbulb"/></svg>Заучить</button>' +
      '<button type="button" class="btn secondary" onclick="openTajweedGuide()"><svg class="ico ico-sm"><use href="#i-book"/></svg>Таджвид</button>' +
      '<button type="button" class="btn secondary" onclick="shareItem(\'quran\',\'' + escAttr(item.id) + '\')"><svg class="ico ico-sm"><use href="#i-upload"/></svg>Поделиться</button>' +
    '</div>' +
    '<button type="button" class="learned-toggle ' + (item.learned ? 'done' : '') + '" onclick="toggleQuranLearned(\'' + escAttr(item.id) + '\')">' +
      '<div class="lt-icon">' + (item.learned ? '<svg class="ico ico-sm"><use href="#i-check"/></svg>' : '<svg class="ico ico-sm"><use href="#i-book"/></svg>') + '</div>' +
      '<div class="lt-body">' +
        '<div class="lt-title">' + (item.learned ? 'Выучено' : 'Отметить как выучено') + '</div>' +
        '<div class="lt-sub">' + (item.learned ? (item.learnedAt ? 'Выучено ' + item.learnedAt : 'Нажми, чтобы снять отметку') : 'Изучи текст и отметь') + '</div>' +
      '</div>' +
    '</button>' +
    bismillahHtml +
    jumpHtml +
    '<div class="spacer-sm"></div>' +
    visibleAyahs.map(function (a, idx) { return _buildQuranDetailAyahHtml(item, a, idx); }).join('') +
    (hasMore ? '<button type="button" class="show-all-btn" onclick="showMoreQuranDetailAyahs()">Показать ещё аяты (' + visibleCount + ' из ' + ayahs.length + ')</button>' : '') +
    (item.source ? '<div class="dh-section detail-source-block"><div class="dh-label">Источник</div><div class="dh-text muted detail-source-text">' + _qLinkify(esc(item.source)) + '</div></div>' : '') +
    (typeof renderEcosystemSection === 'function' ? renderEcosystemSection('quran:' + item.id, { title: 'Связи в Умной книге', inReader: false }) : '') +
    transcriptionNote();

  showScreen('screen-quran-detail');
  if (typeof targetAyahIdx === 'number' && targetAyahIdx >= 0) {
    requestAnimationFrame(function () {
      var targetEl = document.getElementById('q-detail-ayah-' + targetAyahIdx);
      if (targetEl) {
        targetEl.classList.add('is-target-ayah');
        targetEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    });
  }
}

function toggleQuranLearned(id) {
  var item = getQuranById(id); if (!item) return;
  item.learned = !item.learned; item.learnedAt = item.learned ? todayKey() : '';
  save(); if (item.learned) { if (navigator.vibrate) navigator.vibrate([20, 40, 20]); }
  openQuran(id, null, true);
}
function goQuranList() { activeQuranId = null; if (typeof activeQuranAyahIdx !== 'undefined') activeQuranAyahIdx = null; renderQuranList(); showScreen('screen-quran'); }
