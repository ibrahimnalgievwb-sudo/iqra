"use strict";

/* ============================================================
   READER.JS — Режим чтения, навигация по сурам, закладки
   Проект «Икра» · v417
   ============================================================ */

function readPrevSurah() {
  if (!activeReadId) return;
  const idx = state.quran.findIndex(q => q.id === activeReadId);
  if (idx > 0) { openRead(state.quran[idx - 1].id, null, 'prev'); }
}
function readNextSurah() {
  if (!activeReadId) return;
  const idx = state.quran.findIndex(q => q.id === activeReadId);
  if (idx > -1 && idx < state.quran.length - 1) { openRead(state.quran[idx + 1].id, null, 'next'); }
}

/* Справка по таджвиду. Точки берут цвет из CSS-классов правил, поэтому
   совпадают с буквами в любой теме. Описания — общепринятые определения;
   разметка букв приходит готовой из API и приложением не меняется. */
const TAJWEED_LEGEND = [
  ['madda_normal', 'Мадд 2 — естественное удлинение, 2 счёта'],
  ['madda_permissible', 'Мадд 2/4/6 — допустимое удлинение'],
  ['madda_obligatory', 'Мадд 4–5 — обязательное удлинение'],
  ['madda_necessary', 'Мадд 6 — необходимое удлинение, 6 счётов'],
  ['qalqalah', 'Калькаля — «отскок» звука на буквах ق ط ب ج د с сукуном'],
  ['ghunnah', 'Гунна — носовой звук, 2 счёта'],
  ['ikhfa', 'Ихфа — сокрытие нун сакины или танвина перед 15 буквами'],
  ['ikhfa_shafawi', 'Ихфа шафави — сокрытие мим сакины'],
  ['idghaam_ghunnah', 'Идгам с гунной — буквы ي ن م و'],
  ['idghaam_no_ghunnah', 'Идгам без гунны — буквы ل ر'],
  ['idghaam_shafawi', 'Идгам шафави — слияние мим сакины с мим'],
  ['idghaam_mutajanisayn', 'Идгам мутаджанисайн — слияние букв одного выхода'],
  ['idghaam_mutaqaribayn', 'Идгам мутакарибайн — слияние букв близких выходов'],
  ['iqlab', 'Иклаб — нун сакина или танвин перед ب переходит в мим'],
  ['ham_wasl', 'Хамзат васль — не произносится при слитном чтении'],
  ['laam_shamsiyah', 'Лям шамсия — сливается со следующей буквой'],
  ['silent', 'Немая буква']
];
function tajweedLegendHtml() {
  const items = TAJWEED_LEGEND.map(function (r) {
    return '<span class="tl-item"><i class="tajweed-' + r[0] + '"></i><span>' + r[1] + '</span></span>';
  }).join('');
  return '<details class="tajweed-legend"><summary><span class="tl-title">Справка по таджвиду</span></summary>' +
    '<div class="tl-items">' + items + '</div>' +
    '<div class="tl-note">Чтение хафс ʿан ʿасым. Разметка букв — готовая (Al Quran Cloud), приложение её не изменяет.</div></details>';
}

async function openRead(id, targetAyahIdx, dir) {
  const item = getQuranById(id);
  if (!item) return;
  activeReadId = id;
  trackEvent('read/' + id, 'Чтение: ' + item.title);
  saveLastRead('quran', id);
  document.getElementById('read-title').textContent = item.title;
  const container = document.getElementById('read-body');
  const ayahs = parseAyahs(item);
  let bismillahHtml = '';
  if (item.bismillah) {
    bismillahHtml = `<div class="bismillah-card"><div class="b-ar ar-font">${esc(item.bismillah.arabic)}</div><div class="b-tr">${esc(item.bismillah.transcription)}</div><div class="b-trn">${esc(item.bismillah.translation)}</div></div>`;
  }
  const legendHtml = tajweedLegendHtml();
  container.innerHTML = `
    <div class="detail-hero" style="background: transparent; border: none; box-shadow: none; padding: 0; margin-bottom: 10px;">
      <div class="dh-title" style="text-align: center; font-size: 24px;">${esc(item.title)}</div>
    </div>
    ${legendHtml}
    ${item.note ? `<div class="note-box"><svg class="ico ico-sm" style="flex-shrink:0;color:var(--accent2)"><use href="#i-lightbulb"/></svg><div>${escNl(item.note)}</div></div>` : ''}
    ${bismillahHtml}
    <div style="height:16px"></div>
    ${ayahs.map((a, idx) => {
      let verseKey = '';
      if (item.type === 'surah') { verseKey = `${item.number}:${idx + 1}`; }
      else if (item.type === 'ayat' && item.number && !String(item.number).includes('-')) { verseKey = String(item.number); }
      return `
       <div class="read-ayah ${item.type==='ayat'?'ayat-mode':''}" id="ayah-${idx}" data-verse-key="${escAttr(verseKey)}">
        <div class="read-ayah-num">${a.num}</div>
        <div class="read-ayah-ar ar-font" data-raw="${esc(a.ar)}">${esc(a.ar)}${item.type==='surah' ? ' <span class="read-ayah-marker">' + ayahMarker(a.num) + '</span>' : ''}</div>
        ${a.tr ? `<div class="read-ayah-tr">${esc(a.tr)}</div>` : ''}
        <div class="read-ayah-trn">${esc(a.trn)}</div>
        <button class="ayah-share-btn" onclick="shareAyah('${escAttr(item.id)}',${idx})"><svg class="ico ico-sm"><use href="#i-upload"/></svg>Поделиться аятом</button>
      </div>
    `}).join('')}
    ${item.source ? `<div class="dh-section" style="margin-top:20px;"><div class="dh-label">Источник</div><div class="dh-text muted" style="font-size:13px;">${esc(item.source)}</div></div>` : ''}
    ${transcriptionNote()}
  `;
  const readMode = document.getElementById('read-mode');
  readMode.classList.remove('read-slide-next', 'read-slide-prev');
  void readMode.offsetWidth;
  if (dir === 'next') readMode.classList.add('read-slide-next');
  if (dir === 'prev') readMode.classList.add('read-slide-prev');
  readMode.classList.add('active');
  document.getElementById('btn-scroll-top').classList.remove('visible');
  var idx = state.quran.findIndex(function(q){ return q.id === id; });
  var prevBtn = document.getElementById('btn-prev-surah');
  var nextBtn = document.getElementById('btn-next-surah');
  if (prevBtn) { prevBtn.style.opacity = idx === 0 ? '0.3' : '1'; prevBtn.style.pointerEvents = idx === 0 ? 'none' : 'auto'; }
  if (nextBtn) { nextBtn.style.opacity = idx === state.quran.length - 1 ? '0.3' : '1'; nextBtn.style.pointerEvents = idx === state.quran.length - 1 ? 'none' : 'auto'; }
  try { await applyTajweedToContainer(container, item); } catch(e) { console.warn('Tajweed load error:', e); }
  if (state.settings.readScrolls && state.settings.readScrolls[id]) {
    const targetScroll = state.settings.readScrolls[id];
    requestAnimationFrame(() => { container.scrollTop = targetScroll; });
  }
  saveNavContext();
}

function closeRead() {
  if (activeReadId) {
    const b = document.getElementById('read-body');
    if (b && state.settings.readScrolls) state.settings.readScrolls[activeReadId] = b.scrollTop || 0;
    if (state.settings.readAyah && b) state.settings.readAyah[activeReadId] = currentAyahIdx();
    save();
  }
  document.getElementById('read-mode').classList.remove('active');
  document.getElementById('btn-scroll-top').classList.remove('visible');
  activeReadId = null;
  saveNavContext();
}

function toggleScrollTop() {
  var body = document.getElementById('read-body');
  var btn = document.getElementById('btn-scroll-top');
  if (!body || !btn) return;
  if (body.scrollTop > 300) btn.classList.add('visible');
  else btn.classList.remove('visible');
}
function scrollToTopRead() {
  var body = document.getElementById('read-body');
  if (body) body.scrollTo({ top: 0, behavior: 'smooth' });
}

function currentAyahIdx() {
  var body = document.getElementById('read-body');
  if (!body) return 0;
  var ayahs = body.querySelectorAll('.read-ayah');
  if (!ayahs.length) return 0;
  var bodyRect = body.getBoundingClientRect();
  var mid = bodyRect.top + bodyRect.height * 0.35;
  var best = 0;
  for (var i = 0; i < ayahs.length; i++) {
    var r = ayahs[i].getBoundingClientRect();
    if (r.top <= mid) best = i; else break;
  }
  return best;
}

function addBookmarkFromRead() {
  if (!activeReadId) return;
  var item = getQuranById(activeReadId);
  if (!item) return;
  var ayahIdx = currentAyahIdx();
  if (!Array.isArray(state.bookmarks)) state.bookmarks = [];
  var exists = state.bookmarks.some(function(b){
    return b.quranId === activeReadId && b.ayahIdx === ayahIdx;
  });
  if (exists) { showMarkToast('Метка уже есть на этом аяте'); return; }
  if (state.bookmarks.length >= 50) { showMarkToast('Максимум 50 меток'); return; }
  var label = item.title + ' · аят ' + (ayahIdx + 1);
  if (label.length > 60) label = label.slice(0, 57) + '…';
  state.bookmarks.push({
    id: 'bm_' + Date.now(), quranId: activeReadId,
    ayahIdx: ayahIdx, label: label, ts: Date.now()
  });
  save();
  showMarkToast('Метка добавлена (аят ' + (ayahIdx + 1) + ')');
  if (state.settings.vibrate && navigator.vibrate) navigator.vibrate(15);
}

function removeBookmark(bmId) {
  if (!Array.isArray(state.bookmarks)) return;
  var i = state.bookmarks.findIndex(function(b){ return b.id === bmId; });
  if (i < 0) return;
  state.bookmarks.splice(i, 1);
  save();
  renderProgress();
  showMarkToast('Метка удалена');
}

function openBookmark(bmId) {
  if (!Array.isArray(state.bookmarks)) return;
  var bm = state.bookmarks.find(function(b){ return b.id === bmId; });
  if (!bm) return;
  if (!getQuranById(bm.quranId)) { showMarkToast('Текст недоступен'); return; }
  openRead(bm.quranId);
  setTimeout(function(){
    var el = document.getElementById('ayah-' + bm.ayahIdx);
    if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, 400);
}