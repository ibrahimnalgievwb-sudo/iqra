"use strict";

/* ============================================================
   READER.JS — Полноэкранный режим чтения, таджвид, закладки, быстрый переход
   Проект «Икра» · v450
   ============================================================ */

var READ_AYAH_BATCH = 60;
var _readRenderState = { id: null, ayahs: [], item: null, renderedCount: 0, surahMap: null };

function readPrevSurah() {
  if (!activeReadId) return;
  var idx = state.quran.findIndex(function (q) { return q.id === activeReadId; });
  if (idx > 0) { openRead(state.quran[idx - 1].id, null, 'prev'); }
}
function readNextSurah() {
  if (!activeReadId) return;
  var idx = state.quran.findIndex(function (q) { return q.id === activeReadId; });
  if (idx > -1 && idx < state.quran.length - 1) { openRead(state.quran[idx + 1].id, null, 'next'); }
}

const TAJWEED_LEGEND = [
  ['madda_normal', 'Мадд 2 огласовки — естественное удлинение, 2 счёта'], ['madda_permissible', 'Мадд 2/4/6 — допустимое удлинение'],
  ['madda_obligatory', 'Мадд 4–5 — обязательное удлинение'], ['madda_necessary', 'Мадд 6 — необходимое удлинение, 6 счётов'],
  ['qalqalah', 'Калькаля — «отскок» звука на буквах ق ط ب ج د с сукуном'], ['ghunnah', 'Гунна — носовой звук, 2 счёта'],
  ['ikhfa', 'Ихфа — сокрытие нун сакины или танвина перед 15 буквами'], ['ikhfa_shafawi', 'Ихфа шафави — сокрытие мим сакины'],
  ['idghaam_ghunnah', 'Идгам с гунной — буквы ي ن م و'], ['idghaam_no_ghunnah', 'Идгам без гунны — буквы ل ر'],
  ['idghaam_shafawi', 'Идгам шафави — слияние мим сакины с мим'], ['idghaam_mutajanisayn', 'Идгам мутаджанисайн — слияние букв одного выхода'],
  ['idghaam_mutaqaribayn', 'Идгам мутакарибайн — слияние букв близких выходов'], ['iqlab', 'Иклаб — нун сакина или танвин перед ب переходит в мим'],
  ['ham_wasl', 'Хамзат васль — не произносится при слитном чтении'], ['laam_shamsiyah', 'Лям шамсия — сливается со следующей буквой'],
  ['silent', 'Немая буква']
];
function tajweedLegendHtml() {
  var items = TAJWEED_LEGEND.map(function (r) { return '<span class="tl-item"><i class="tajweed-' + r[0] + '"></i><span>' + r[1] + '</span></span>'; }).join('');
  return '<details class="tajweed-legend"><summary><span class="tl-title">Справка по таджвиду (офлайн)</span></summary><div class="tl-items">' + items + '</div><div class="tl-note">Чтение Хафс ʿан ʿАсым. Встроена проверенная офлайн-разметка (KFGQPC / Quran Tajweed), приложение её не искажает.</div></details>';
}

function tajweedDescription(rule) {
  for (var i = 0; i < TAJWEED_LEGEND.length; i++) {
    if (TAJWEED_LEGEND[i][0] === rule) return TAJWEED_LEGEND[i][1];
  }
  return '';
}

function openTajweedInfo(ayahBlock) {
  if (!ayahBlock) return;
  var rulesEl = ayahBlock.querySelector('.ayah-tajweed-rules');
  if (!rulesEl) return;
  var items = rulesEl.querySelectorAll('.rule-item');
  if (!items.length) return;

  var numEl = ayahBlock.querySelector('.read-ayah-num');
  var ayahNum = numEl ? numEl.textContent.trim() : '';
  var seen = {};
  var rows = '';

  items.forEach(function (item) {
    var i = item.querySelector('i');
    if (!i) return;
    var rule = null;
    for (var k = 0; k < i.classList.length; k++) {
      var c = i.classList[k];
      if (c.indexOf('tajweed-') === 0) { rule = c.slice('tajweed-'.length); break; }
    }
    if (!rule || seen[rule]) return;
    seen[rule] = true;
    var name = item.textContent.trim();
    var desc = tajweedDescription(rule);
    rows += '<div class="tm-item"><i class="tajweed-' + escAttr(rule) + '"></i>' +
      '<div class="tm-txt"><div class="tm-name">' + esc(name) + '</div>' +
      (desc ? '<div class="tm-desc">' + esc(desc) + '</div>' : '') +
      '</div></div>';
  });

  if (!rows) return;

  var modal = document.getElementById('modal-content');
  var bg = document.getElementById('modal-bg');
  if (!modal || !bg) return;

  modal.className = 'modal tajweed-modal';
  modal.innerHTML =
    '<div class="tm-head">' +
      '<h2 class="tm-title"><svg class="ico ico-sm"><use href="#i-book"/></svg>Таджвид · аят ' + esc(ayahNum) + '</h2>' +
      '<button type="button" class="tm-close" aria-label="Закрыть" onclick="closeModal()"><svg class="ico ico-sm"><use href="#i-x"/></svg></button>' +
    '</div>' +
    '<div class="tm-body">' +
      '<div class="tm-ayah-label">Правила в этом аяте</div>' +
      '<div class="tm-list">' + rows + '</div>' +
      '<div class="tm-note">Чтение Хафс ʿан ʿАсым. Встроенная офлайн-разметка таджвида.</div>' +
    '</div>';

  bg.style.backgroundColor = '';
  bg.style.backdropFilter = '';
  bg.style.webkitBackdropFilter = '';

  bg.classList.add('active');
}

function _buildReadAyahHtml(item, a, idx) {
  var verseKey = '';
  if (item.type === 'surah') verseKey = item.number + ':' + (idx + 1);
  else if (item.number && String(item.number).indexOf('-') === -1) verseKey = String(item.number);

  return '<div class="read-ayah ' + (item.type === 'ayat' || item.type === 'ruqyah' ? 'ayat-mode' : '') + '" id="ayah-' + idx + '" data-verse-key="' + escAttr(verseKey) + '">' +
    '<div class="read-ayah-num">' + esc(a.num) + '</div>' +
    '<div class="read-ayah-ar ar-font" data-raw="' + escAttr(a.ar) + '">' + esc(a.ar) + (item.type === 'surah' ? ' <span class="read-ayah-marker">' + ayahMarker(a.num) + '</span>' : '') + '</div>' +
    (a.tr ? '<div class="read-ayah-tr">' + esc(a.tr) + '</div>' : '') +
    '<div class="read-ayah-trn">' + esc(a.trn) + '</div>' +
    getSmartTafsirHtml(item, idx + 1) +
    (typeof renderAyahEcosystemDetails === 'function' ? renderAyahEcosystemDetails('ayah:' + item.id + '#' + (idx + 1)) : '') +
    '<button class="ayah-tajweed-btn" type="button" onclick="openTajweedInfo(this.closest(\'.read-ayah\'))" aria-label="Справка по таджвиду">' +
      '<svg class="ico ico-sm"><use href="#i-info"/></svg>Таджвид' +
    '</button>' +
    '<button type="button" class="ayah-share-btn" onclick="shareAyah(\'' + escAttr(item.id) + '\',' + idx + ')"><svg class="ico ico-sm"><use href="#i-upload"/></svg>Поделиться аятом</button>' +
  '</div>';
}

function _refreshTajweedButtons(container) {
  if (!container) return;
  container.querySelectorAll('.read-ayah').forEach(function (ayahBlock) {
    var btn = ayahBlock.querySelector('.ayah-tajweed-btn');
    if (!btn) return;
    var hasRules = ayahBlock.querySelector('.ayah-tajweed-rules .rule-item');
    if (hasRules) btn.classList.add('visible');
    else btn.classList.remove('visible');
  });
}

async function appendReadAyahBatch(nextCount) {
  var st = _readRenderState;
  var listHost = document.getElementById('read-ayahs-host');
  var moreBtn = document.getElementById('read-more-ayahs-btn');
  if (!st.item || !listHost) return;

  var startIdx = st.renderedCount;
  var endIdx = Math.min(st.ayahs.length, startIdx + (nextCount || READ_AYAH_BATCH));
  if (endIdx <= startIdx) return;

  var html = '';
  for (var i = startIdx; i < endIdx; i++) {
    html += _buildReadAyahHtml(st.item, st.ayahs[i], i);
  }
  var temp = document.createElement('div');
  temp.innerHTML = html;
  var appendedNodes = Array.prototype.slice.call(temp.children);
  appendedNodes.forEach(function (n) { listHost.appendChild(n); });
  st.renderedCount = endIdx;

  if (moreBtn) {
    if (st.renderedCount >= st.ayahs.length) {
      moreBtn.remove();
    } else {
      moreBtn.textContent = 'Показать следующие аяты (' + st.renderedCount + ' из ' + st.ayahs.length + ')';
    }
  }

  if (st.surahMap && typeof renderTajweedForElement === 'function') {
    appendedNodes.forEach(function (ayahBlock) {
      var arEl = ayahBlock.querySelector('.read-ayah-ar');
      renderTajweedForElement(arEl, ayahBlock, st.surahMap);
    });
    _refreshTajweedButtons(listHost);
  }
}

async function jumpToReadAyah(ayahNumVal) {
  var st = _readRenderState;
  if (!st.item || !st.ayahs.length) return;
  var num = Math.max(1, Math.min(st.ayahs.length, parseInt(ayahNumVal, 10) || 1));
  var targetIdx = num - 1;
  if (targetIdx >= st.renderedCount) {
    await appendReadAyahBatch((targetIdx + 20) - st.renderedCount);
  }
  var el = document.getElementById('ayah-' + targetIdx);
  if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

async function openRead(id, targetAyahIdx, dir) {
  var item = getQuranById(id); if (!item) return;
  activeReadId = id;
  trackEvent('read/' + id, 'Чтение: ' + item.title);
  saveLastRead('quran', id);
  document.getElementById('read-title').textContent = item.title;
  var container = document.getElementById('read-body');
  var ayahs = parseAyahs(item);
  var initialCount = Math.min(ayahs.length, (typeof targetAyahIdx === 'number' && targetAyahIdx >= READ_AYAH_BATCH) ? (targetAyahIdx + 20) : READ_AYAH_BATCH);

  _readRenderState = {
    id: id,
    item: item,
    ayahs: ayahs,
    renderedCount: initialCount,
    surahMap: null
  };

  var bismillahHtml = '';
  if (item.bismillah) {
    bismillahHtml = '<div class="bismillah-card"><div class="b-ar ar-font">' + esc(item.bismillah.arabic) + '</div><div class="b-tr">' + esc(item.bismillah.transcription) + '</div><div class="b-trn">' + esc(item.bismillah.translation) + '</div></div>';
  }
  var legendHtml = tajweedLegendHtml();
  var jumpHtml = '';
  if (ayahs.length >= 15) {
    jumpHtml = '<div class="ayah-jumper">' +
      '<label for="rm-ayah-jump" class="aj-label">Аят (1–' + ayahs.length + '):</label>' +
      '<input id="rm-ayah-jump" class="aj-input" type="number" min="1" max="' + ayahs.length + '" inputmode="numeric" placeholder="№">' +
      '<button type="button" class="btn secondary btn-inline aj-btn" onclick="jumpToReadAyah(document.getElementById(\'rm-ayah-jump\').value)">Перейти</button>' +
    '</div>';
  }

  var initialAyahsHtml = ayahs.slice(0, initialCount).map(function (a, idx) {
    return _buildReadAyahHtml(item, a, idx);
  }).join('');

  container.innerHTML =
    '<div id="guide-slot-read-mode"></div>' +
    '<div class="detail-hero read-hero-title">' +
      '<div class="dh-title read-hero-heading">' + esc(item.title) + '</div>' +
    '</div>' +
    legendHtml +
    jumpHtml +
    (item.note ? '<div class="note-box"><svg class="ico ico-sm note-box-ico"><use href="#i-lightbulb"/></svg><div>' + escNl(item.note) + '</div></div>' : '') +
    bismillahHtml +
    '<div class="spacer-sm"></div>' +
    '<div id="read-ayahs-host">' + initialAyahsHtml + '</div>' +
    (initialCount < ayahs.length ? '<button type="button" id="read-more-ayahs-btn" class="show-all-btn" onclick="appendReadAyahBatch()">Показать следующие аяты (' + initialCount + ' из ' + ayahs.length + ')</button>' : '') +
    (item.source ? '<div class="dh-section detail-source-block"><div class="dh-label">Источник</div><div class="dh-text muted detail-source-text">' + esc(item.source) + '</div></div>' : '') +
    (typeof renderEcosystemSection === 'function' ? renderEcosystemSection('quran:' + item.id, { title: 'Связи в Умной книге' }) : '') +
    transcriptionNote();

  if (typeof renderScreenGuideSlot === 'function') renderScreenGuideSlot('read-mode');

  var readMode = document.getElementById('read-mode');
  readMode.classList.remove('read-slide-next', 'read-slide-prev');
  void readMode.offsetWidth;
  if (dir === 'next') readMode.classList.add('read-slide-next');
  if (dir === 'prev') readMode.classList.add('read-slide-prev');
  readMode.classList.add('active');
  document.getElementById('btn-scroll-top').classList.remove('visible');

  var idx = state.quran.findIndex(function (q) { return q.id === id; });
  var prevBtn = document.getElementById('btn-prev-surah');
  var nextBtn = document.getElementById('btn-next-surah');
  if (prevBtn) { prevBtn.style.opacity = idx === 0 ? '0.3' : '1'; prevBtn.style.pointerEvents = idx === 0 ? 'none' : 'auto'; }
  if (nextBtn) { nextBtn.style.opacity = idx === state.quran.length - 1 ? '0.3' : '1'; nextBtn.style.pointerEvents = idx === state.quran.length - 1 ? 'none' : 'auto'; }

  try {
    await applyTajweedToContainer(container, item);
    if (item.type === 'surah' && typeof fetchTajweedSurah === 'function') {
      _readRenderState.surahMap = await fetchTajweedSurah(item.number);
    }
  } catch (e) {}
  try {
    _refreshTajweedButtons(container);
  } catch (e) {}

  if (typeof targetAyahIdx === 'number' && targetAyahIdx >= 0) {
    requestAnimationFrame(function () {
      var targetEl = document.getElementById('ayah-' + targetAyahIdx);
      if (targetEl) targetEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  } else if (state.settings.readScrolls && state.settings.readScrolls[id]) {
    var targetScroll = state.settings.readScrolls[id];
    requestAnimationFrame(function () { container.scrollTop = targetScroll; });
  }
  saveNavContext();
}

function closeRead() {
  if (activeReadId) {
    var b = document.getElementById('read-body');
    if (b && state.settings.readScrolls) state.settings.readScrolls[activeReadId] = b.scrollTop || 0;
    if (state.settings.readAyah && b) state.settings.readAyah[activeReadId] = currentAyahIdx();
    save();
  }
  document.getElementById('read-mode').classList.remove('active');
  document.getElementById('btn-scroll-top').classList.remove('visible');
  activeReadId = null; saveNavContext();
}

function toggleScrollTop() {
  var body = document.getElementById('read-body'); var btn = document.getElementById('btn-scroll-top');
  if (!body || !btn) return;
  if (body.scrollTop > 300) btn.classList.add('visible'); else btn.classList.remove('visible');
}
function scrollToTopRead() { var body = document.getElementById('read-body'); if (body) body.scrollTo({ top: 0, behavior: 'smooth' }); }

function currentAyahIdx() {
  var body = document.getElementById('read-body'); if (!body) return 0;
  var ayahs = body.querySelectorAll('.read-ayah'); if (!ayahs.length) return 0;
  var bodyRect = body.getBoundingClientRect(); var mid = bodyRect.top + bodyRect.height * 0.35; var best = 0;
  for (var i = 0; i < ayahs.length; i++) { var r = ayahs[i].getBoundingClientRect(); if (r.top <= mid) best = i; else break; }
  return best;
}

function addBookmarkFromRead() {
  if (!activeReadId) return;
  var item = getQuranById(activeReadId); if (!item) return;
  var ayahIdx = currentAyahIdx();
  if (!Array.isArray(state.bookmarks)) state.bookmarks = [];
  var exists = state.bookmarks.some(function (b) { return b.quranId === activeReadId && b.ayahIdx === ayahIdx; });
  if (exists) { showMarkToast('Метка уже есть на этом аяте'); return; }
  if (state.bookmarks.length >= 50) { showMarkToast('Максимум 50 меток'); return; }
  var label = item.title + ' · аят ' + (ayahIdx + 1);
  if (label.length > 60) label = label.slice(0, 57) + '…';
  state.bookmarks.push({ id: 'bm_' + Date.now(), quranId: activeReadId, ayahIdx: ayahIdx, label: label, ts: Date.now() });
  save(); showMarkToast('Метка добавлена (аят ' + (ayahIdx + 1) + ')');
  if (state.settings.vibrate && navigator.vibrate) navigator.vibrate(15);
}

function removeBookmark(bmId) {
  if (!Array.isArray(state.bookmarks)) return;
  var i = state.bookmarks.findIndex(function (b) { return b.id === bmId; });
  if (i < 0) return;
  state.bookmarks.splice(i, 1); save(); renderProgress(); showMarkToast('Метка удалена');
}

function openBookmark(bmId) {
  if (!Array.isArray(state.bookmarks)) return;
  var bm = state.bookmarks.find(function (b) { return b.id === bmId; });
  if (!bm) return;
  if (!getQuranById(bm.quranId)) { showMarkToast('Текст недоступен'); return; }
  openRead(bm.quranId, bm.ayahIdx);
}
