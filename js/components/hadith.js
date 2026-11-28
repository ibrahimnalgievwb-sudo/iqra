"use strict";

/* ============================================================
   HADITH.JS — Список хадисов, детальный просмотр
   Проект «Икра» · v383 (рефакторинг)
   ============================================================ */

var _hadithFilter = 'all';

function _hadithPreview(text, lines) {
  return (typeof excerpt === 'function') ? excerpt(text, lines) : String(text || '').split('\n').slice(0, lines).join('\n');
}

function setHadithFilter(f) {
  _hadithFilter = f || 'all';
  if (typeof renderLibraryFilterChips === 'function') renderLibraryFilterChips('hadith');
  renderHadithList();
}

function _hadithMatchesFilter(h, filterKey) {
  if (!filterKey || filterKey === 'all') return true;
  if (filterKey === 'learned') return !!h.learned;
  var hay = [h.id, h.title, h.subtitle, h.translation, h.note].filter(Boolean).join(' ').toLowerCase();
  if (filterKey === 'quran') {
    return ['h_ikhlas', 'h_muawwizat', 'h_ayat_kursi', 'h_baqarah', 'h_mulk', 'h_kursi_greatest'].indexOf(h.id) !== -1 || /сур|аят|коран/.test(hay);
  }
  if (filterKey === 'adhkar') {
    return ['h_sayyid', 'h_tawhid', 'h_after_salah', 'h_sleep_dua', 'h_people_of_book'].indexOf(h.id) !== -1 || /тасбих|зикр|истигфар|дуа|намаз/.test(hay);
  }
  if (filterKey === 'night') {
    return ['h_muawwizat', 'h_ayat_kursi', 'h_baqarah', 'h_mulk', 'h_sleep_dua'].indexOf(h.id) !== -1 || /сном|ночь|ночн/.test(hay);
  }
  return true;
}

function renderHadithList() {
  const el = document.getElementById('library-hadith-list');
  if (!el) return;
  if (!state.hadiths.length) { el.innerHTML = '<div class="empty">Пока нет хадисов</div>'; return; }

  var qEl = document.getElementById('library-search');
  var rawQ = qEl ? (qEl.value || '').trim() : '';
  var q = rawQ.toLowerCase();
  var qAr = (typeof normalizeArabic === 'function') ? normalizeArabic(q) : '';

  var items = state.hadiths.filter(function (h) {
    if (!_hadithMatchesFilter(h, _hadithFilter)) return false;
    if (!q) return true;
    var hay = [h.title, h.subtitle, h.transcription, h.translation, h.source].filter(Boolean).join(' ').toLowerCase();
    if (hay.indexOf(q) !== -1) return true;
    if (h.arabic && h.arabic.toLowerCase().indexOf(q) !== -1) return true;
    if (qAr && typeof normalizeArabic === 'function' && normalizeArabic([h.title, h.arabic, h.transcription].filter(Boolean).join(' ')).indexOf(qAr) !== -1) return true;
    return false;
  });

  if (!items.length) {
    el.innerHTML = '<div class="empty">Ничего не найдено<div class="spacer-sm"></div><button type="button" class="btn secondary btn-inline" onclick="clearLibrarySearch()">Сбросить фильтр</button></div>';
    return;
  }

  el.innerHTML = items.map(h => {
    const fav = isFavorite(h.id);
    const star = `<button type="button" class="star-btn ${fav?'active':''}" aria-label="${fav?'Убрать из избранного':'Добавить в избранное'}: ${escAttr(h.title)}" onclick="starClick(event,'${escAttr(h.id)}','hadith')">${fav?'<svg class="ico"><use href="#i-star-filled"/></svg>':'<svg class="ico"><use href="#i-star"/></svg>'}</button>`;
    const learnedMark = h.learned ? `<span class="c-learned-mark" title="Изучено" aria-label="Изучено"><svg class="ico ico-sm"><use href="#i-check"/></svg></span>` : '';
    const subHtml = h.subtitle ? `<div class="c-sub">${esc(h.subtitle)}</div>` : '';
    const arPrev = _hadithPreview(h.arabic, 2);
    const trnPrev = _hadithPreview(h.translation, 2);
    const arHtml = arPrev ? `<div class="c-ar ar-font" dir="rtl" lang="ar">${esc(arPrev)}</div>` : '';
    return `<div class="content-card" role="button" tabindex="0" onclick="openHadith('${escAttr(h.id)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openHadith('${escAttr(h.id)}')}">${star}${learnedMark}<div class="c-title">${esc(h.title)}</div>${subHtml}${arHtml}<div class="c-tr">${esc(trnPrev)}</div></div>`;
  }).join('');
}

function _hadithLinkify(html) {
  var out = (typeof IqraScholars !== 'undefined' && typeof IqraScholars.linkifyScholars === 'function')
    ? IqraScholars.linkifyScholars(html)
    : html;
  if (typeof IqraScholars !== 'undefined' && typeof IqraScholars.formatSacredTermsHtml === 'function') {
    out = IqraScholars.formatSacredTermsHtml(out);
  }
  return out;
}

function openHadith(id) {
  activeHadithId = id; const h = getHadithById(id); if (!h) return;
  trackEvent('hadith/' + id, 'Хадис: ' + h.title);
  saveLastRead('hadith', id);
  const st = document.getElementById('hadith-detail-star');
  if (st) { const fav=isFavorite(id); st.innerHTML=fav?'<svg class="ico"><use href="#i-star-filled"/></svg>':'<svg class="ico"><use href="#i-star"/></svg>'; st.classList.toggle('starred', fav); }
  const noteContent = h.note
    ? ((typeof IqraDalil !== 'undefined' && typeof IqraDalil.renderNoteBlocksHtml === 'function')
        ? IqraDalil.renderNoteBlocksHtml(h.note, { linkify: _hadithLinkify })
        : _hadithLinkify(escNl(h.note)))
    : '';
  const el = document.getElementById('hadith-detail-content');
  el.innerHTML = `
    <div class="detail-hero">
      <div class="dh-title">${esc(h.title)}</div>
      ${h.subtitle ? `<div class="dh-sub">${esc(h.subtitle)}</div>` : ''}
      <div class="read-ayah">
        <div class="read-ayah-ar ar-font">${escNl(h.arabic)}</div>
        <div class="read-ayah-tr">${escNl(h.transcription)}</div>
        <div class="read-ayah-trn">${_hadithLinkify(escNl(h.translation))}</div>
      </div>
    </div>
    ${h.note ? `<div class="note-box"><svg class="ico ico-sm note-box-ico"><use href="#i-lightbulb"/></svg><div class="note-box-body">${noteContent}</div></div>` : ''}
    <div class="detail-actions"><button type="button" class="btn" onclick="openMemorizeFor(getHadithById('${escAttr(h.id)}'))"><svg class="ico ico-sm"><use href="#i-lightbulb"/></svg>Заучить</button><button type="button" class="btn secondary" onclick="copyLibraryItem('hadith','${escAttr(h.id)}')"><svg class="ico ico-sm"><use href="#i-copy"/></svg>Копировать</button><button type="button" class="btn secondary" onclick="shareItem('hadith','${escAttr(h.id)}')"><svg class="ico ico-sm"><use href="#i-upload"/></svg>Поделиться</button></div>
    <button type="button" class="learned-toggle ${h.learned?'done':''}" onclick="toggleHadithLearned('${escAttr(h.id)}')">
      <span class="lt-icon">${h.learned?'<svg class="ico ico-sm"><use href="#i-check"/></svg>':'<svg class="ico ico-sm"><use href="#i-book"/></svg>'}</span>
      <span class="lt-body"><span class="lt-title">${h.learned?'Изучено':'Отметить как изученный'}</span><span class="lt-sub">${h.learned?'Нажми, чтобы снять отметку':'Изучи хадис и отметь'}</span></span>
    </button>
    ${h.source ? `<div class="dh-section detail-source-block"><div class="dh-label">Источник</div><div class="dh-text muted detail-source-text">${_hadithLinkify(esc(h.source))}</div></div>` : ''}
    ${typeof renderEcosystemSection === 'function' ? renderEcosystemSection('hadith:' + h.id, { title: 'Связи в Умной книге' }) : ''}
    ${transcriptionNote()}
  `;
  showScreen('screen-hadith-detail');
}

function toggleHadithLearned(id) {
  const h = getHadithById(id); if (!h) return;
  h.learned = !h.learned; save();
  if (h.learned) {
    if (typeof IqraPlatform !== 'undefined' && typeof IqraPlatform.safeVibrate === 'function') IqraPlatform.safeVibrate([20, 40, 20]);
    else if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([20, 40, 20]);
  }
  openHadith(id);
}
function goHadithList() { activeHadithId=null; switchTab('library'); setLibraryTab('hadith'); }

window.setHadithFilter = setHadithFilter;