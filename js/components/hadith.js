"use strict";

/* ============================================================
   HADITH.JS — Список хадисов, детальный просмотр
   Проект «Икра» · v383 (рефакторинг)
   ============================================================ */

function _hadithPreview(text, lines) {
  return (typeof excerpt === 'function') ? excerpt(text, lines) : String(text || '').split('\n').slice(0, lines).join('\n');
}

function renderHadithList() {
  const el = document.getElementById('library-hadith-list');
  if (!state.hadiths.length) { el.innerHTML = '<div class="empty">Пока нет хадисов</div>'; return; }
  el.innerHTML = state.hadiths.map(h => {
    const fav = isFavorite(h.id);
    const star = `<button type="button" class="star-btn ${fav?'active':''}" aria-label="${fav?'Убрать из избранного':'Добавить в избранное'}: ${escAttr(h.title)}" onclick="starClick(event,'${escAttr(h.id)}','hadith')">${fav?'<svg class="ico"><use href="#i-star-filled"/></svg>':'<svg class="ico"><use href="#i-star"/></svg>'}</button>`;
    const subHtml = h.subtitle ? `<div class="c-sub">${esc(h.subtitle)}</div>` : '';
<<<<<<< HEAD
    const arPrev = _hadithPreview(h.arabic, 2);
    const trnPrev = _hadithPreview(h.translation, 2);
    const arHtml = arPrev ? `<div class="c-ar ar-font" dir="rtl" lang="ar">${esc(arPrev)}</div>` : '';
    return `<div class="content-card" role="button" tabindex="0" onclick="openHadith('${escAttr(h.id)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openHadith('${escAttr(h.id)}')}">${star}<div class="c-title">${esc(h.title)}</div>${subHtml}${arHtml}<div class="c-tr">${esc(trnPrev)}</div></div>`;
=======
    const arHtml = h.arabic ? `<div class="c-ar ar-font">${esc(h.arabic)}</div>` : '';
    return `<div class="content-card" role="button" tabindex="0" onclick="openHadith('${escAttr(h.id)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openHadith('${escAttr(h.id)}')}">${star}<div class="c-title">${esc(h.title)}</div>${subHtml}${arHtml}<div class="c-tr">${esc(h.translation)}</div></div>`;
>>>>>>> ca4756abbe657ac1e757d8f0c9ae20ab9f37d6ce
  }).join('');
}

function _hadithLinkify(html) {
<<<<<<< HEAD
  var out = (typeof IqraScholars !== 'undefined' && typeof IqraScholars.linkifyScholars === 'function')
    ? IqraScholars.linkifyScholars(html)
    : html;
  if (typeof IqraScholars !== 'undefined' && typeof IqraScholars.formatSacredTermsHtml === 'function') {
    out = IqraScholars.formatSacredTermsHtml(out);
  }
  return out;
=======
  return (typeof IqraScholars !== 'undefined' && typeof IqraScholars.linkifyScholars === 'function')
    ? IqraScholars.linkifyScholars(html)
    : html;
>>>>>>> ca4756abbe657ac1e757d8f0c9ae20ab9f37d6ce
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
    <div class="detail-actions"><button type="button" class="btn" onclick="openMemorizeFor(getHadithById('${escAttr(h.id)}'))"><svg class="ico ico-sm"><use href="#i-lightbulb"/></svg>Заучить</button><button type="button" class="btn secondary" onclick="shareItem('hadith','${escAttr(h.id)}')"><svg class="ico ico-sm"><use href="#i-upload"/></svg>Поделиться</button></div>
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

function toggleHadithLearned(id) { const h=getHadithById(id); if (!h) return; h.learned=!h.learned; save(); if (h.learned) { if (navigator.vibrate) navigator.vibrate([20,40,20]); } openHadith(id); }
function goHadithList() { activeHadithId=null; switchTab('library'); setLibraryTab('hadith'); }