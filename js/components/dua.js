"use strict";

/* ============================================================
   DUA.JS — Список дуа, детальный просмотр, отметка «выучено»
   Проект «Икра» · v383 (рефакторинг)
   ============================================================ */

var _duaFilter = 'all';

function _duaPreview(text, lines) {
  return (typeof excerpt === 'function') ? excerpt(text, lines) : String(text || '').split('\n').slice(0, lines).join('\n');
}

function setDuaFilter(f) {
  _duaFilter = f || 'all';
  if (typeof renderLibraryFilterChips === 'function') renderLibraryFilterChips('dua');
  renderDuaList();
}

function _duaMatchesFilter(d, filterKey) {
  if (!filterKey || filterKey === 'all') return true;
  if (filterKey === 'learned') return !!d.learned;
  var hay = [d.id, d.title, d.subtitle, d.translation].filter(Boolean).join(' ').toLowerCase();
  if (filterKey === 'protection') {
    return (d.id && d.id.indexOf('ruqyah') === 0) || /защит|рукь|исцелен|выздоровл/.test(hay);
  }
  if (filterKey === 'heart') {
    return d.id === 'dua_anxiety' || d.id === 'dua_sayyidul_istighfar' || /груст|беспокой|истигфар|покаян|прощен/.test(hay);
  }
  return true;
}

function renderDuaList() {
  const el = document.getElementById('library-dua-list');
  if (!el) return;
  if (!state.duas.length) { el.innerHTML = '<div class="empty">Пока нет дуа</div>'; return; }

  var qEl = document.getElementById('library-search');
  var rawQ = qEl ? (qEl.value || '').trim() : '';
  var q = rawQ.toLowerCase();
  var qAr = (typeof normalizeArabic === 'function') ? normalizeArabic(q) : '';

  var items = state.duas.filter(function (d) {
    if (!_duaMatchesFilter(d, _duaFilter)) return false;
    if (!q) return true;
    var hay = [d.title, d.subtitle, d.transcription, d.translation, d.source].filter(Boolean).join(' ').toLowerCase();
    if (hay.indexOf(q) !== -1) return true;
    if (d.arabic && d.arabic.toLowerCase().indexOf(q) !== -1) return true;
    if (qAr && typeof normalizeArabic === 'function' && normalizeArabic([d.title, d.arabic, d.transcription].filter(Boolean).join(' ')).indexOf(qAr) !== -1) return true;
    return false;
  });

  if (!items.length) {
    el.innerHTML = '<div class="empty">Ничего не найдено<div class="spacer-sm"></div><button type="button" class="btn secondary btn-inline" onclick="clearLibrarySearch()">Сбросить фильтр</button></div>';
    return;
  }

  el.innerHTML = items.map(d => {
    const fav = isFavorite(d.id);
    const star = `<button type="button" class="star-btn ${fav?'active':''}" aria-label="${fav?'Убрать из избранного':'Добавить в избранное'}: ${escAttr(d.title)}" onclick="starClick(event,'${escAttr(d.id)}','dua')">${fav?'<svg class="ico"><use href="#i-star-filled"/></svg>':'<svg class="ico"><use href="#i-star"/></svg>'}</button>`;
    const learnedMark = d.learned ? `<span class="c-learned-mark" title="Выучено" aria-label="Выучено"><svg class="ico ico-sm"><use href="#i-check"/></svg></span>` : '';
    const subHtml = d.subtitle ? `<div class="c-sub">${esc(d.subtitle)}</div>` : '';
    const arPrev = _duaPreview(d.arabic, 2);
    const trnPrev = _duaPreview(d.translation, 2);
    const arHtml = arPrev ? `<div class="c-ar ar-font" dir="rtl" lang="ar">${esc(arPrev)}</div>` : '';
    return `<div class="content-card" role="button" tabindex="0" onclick="openDua('${escAttr(d.id)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openDua('${escAttr(d.id)}')}">${star}${learnedMark}<div class="c-title">${esc(d.title)}</div>${subHtml}${arHtml}<div class="c-tr">${esc(trnPrev)}</div></div>`;
  }).join('');
}

function _duaLinkify(html) {
  var out = (typeof IqraScholars !== 'undefined' && typeof IqraScholars.linkifyScholars === 'function')
    ? IqraScholars.linkifyScholars(html)
    : html;
  if (typeof IqraScholars !== 'undefined' && typeof IqraScholars.formatSacredTermsHtml === 'function') {
    out = IqraScholars.formatSacredTermsHtml(out);
  }
  return out;
}

function openDua(id) {
  activeDuaId = id; const d = getDuaById(id); if (!d) return;
  trackEvent('dua/' + id, 'Дуа: ' + d.title);
  saveLastRead('dua', id);
  const st = document.getElementById('dua-detail-star');
  if (st) { const fav=isFavorite(id); st.innerHTML=fav?'<svg class="ico"><use href="#i-star-filled"/></svg>':'<svg class="ico"><use href="#i-star"/></svg>'; st.classList.toggle('starred', fav); }
  const isGuide = d.id === 'ruqyah_guide';
  const noteContent = d.note
    ? ((typeof IqraDalil !== 'undefined' && typeof IqraDalil.renderNoteBlocksHtml === 'function')
        ? IqraDalil.renderNoteBlocksHtml(d.note, { linkify: _duaLinkify })
        : _duaLinkify(escNl(d.note)))
    : '';
  const el = document.getElementById('dua-detail-content');
  el.innerHTML = `
    <div class="detail-hero">
      <div class="dh-title">${esc(d.title)}</div>
      ${d.subtitle ? `<div class="dh-sub">${esc(d.subtitle)}</div>` : ''}
      <div class="read-ayah${isGuide ? ' ruqyah-ayah-reset' : ''}">
        ${d.arabic ? `<div class="read-ayah-ar ar-font">${escNl(d.arabic)}</div>` : ''}
        ${d.transcription ? `<div class="read-ayah-tr">${escNl(d.transcription)}</div>` : ''}
        <div class="read-ayah-trn${isGuide ? ' ruqyah-trn-body' : ''}">${isGuide ? _duaLinkify(escRich(d.translation)) : _duaLinkify(escNl(d.translation))}</div>
      </div>
    </div>
    ${d.note ? `<div class="note-box"><svg class="ico ico-sm note-box-ico"><use href="#i-lightbulb"/></svg><div class="note-box-body">${noteContent}</div></div>` : ''}
    <div class="detail-actions">${isGuide || (d.title && d.title.toLowerCase().includes('рукья')) ? '' : `<button type="button" class="btn" onclick="openMemorizeFor(getDuaById('${escAttr(d.id)}'))"><svg class="ico ico-sm"><use href="#i-lightbulb"/></svg>Заучить</button>`}<button type="button" class="btn secondary" onclick="copyLibraryItem('dua','${escAttr(d.id)}')"><svg class="ico ico-sm"><use href="#i-copy"/></svg>Копировать</button><button type="button" class="btn secondary" onclick="shareItem('dua','${escAttr(d.id)}')"><svg class="ico ico-sm"><use href="#i-upload"/></svg>Поделиться</button></div>
    <button type="button" class="learned-toggle ${d.learned?'done':''}" onclick="toggleDuaLearned('${escAttr(d.id)}')">
      <span class="lt-icon">${d.learned?'<svg class="ico ico-sm"><use href="#i-check"/></svg>':'<svg class="ico ico-sm"><use href="#i-book"/></svg>'}</span>
      <span class="lt-body"><span class="lt-title">${d.learned?'Выучено':'Отметить как выучено'}</span><span class="lt-sub">${d.learned?'Нажми, чтобы снять отметку':'Изучи дуа и отметь'}</span></span>
    </button>
    ${d.source ? `<div class="dh-section detail-source-block"><div class="dh-label">Источник</div><div class="dh-text muted detail-source-text">${_duaLinkify(esc(d.source))}</div></div>` : ''}
    ${typeof renderEcosystemSection === 'function' ? renderEcosystemSection('dua:' + d.id, { title: 'Связи в Умной книге' }) : ''}
    ${transcriptionNote()}
  `;
  showScreen('screen-dua-detail');
}

function toggleDuaLearned(id) {
  const d = getDuaById(id); if (!d) return;
  d.learned = !d.learned; save();
  if (d.learned) {
    if (typeof IqraPlatform !== 'undefined' && typeof IqraPlatform.safeVibrate === 'function') IqraPlatform.safeVibrate([20, 40, 20]);
    else if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([20, 40, 20]);
  }
  openDua(id);
}
function goDuaList() { activeDuaId=null; switchTab('library'); setLibraryTab('dua'); }

window.setDuaFilter = setDuaFilter;