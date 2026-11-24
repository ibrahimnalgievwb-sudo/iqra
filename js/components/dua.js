"use strict";

/* ============================================================
   DUA.JS — Список дуа, детальный просмотр, отметка «выучено»
   Проект «Икра» · v383 (рефакторинг)
   ============================================================ */

function renderDuaList() {
  const el = document.getElementById('library-dua-list');
  if (!state.duas.length) { el.innerHTML = '<div class="empty">Пока нет дуа</div>'; return; }
  el.innerHTML = state.duas.map(d => {
    const fav = isFavorite(d.id);
    const star = `<button type="button" class="star-btn ${fav?'active':''}" aria-label="${fav?'Убрать из избранного':'Добавить в избранное'}: ${escAttr(d.title)}" onclick="starClick(event,'${escAttr(d.id)}','dua')">${fav?'<svg class="ico"><use href="#i-star-filled"/></svg>':'<svg class="ico"><use href="#i-star"/></svg>'}</button>`;
    const subHtml = d.subtitle ? `<div class="c-sub">${esc(d.subtitle)}</div>` : '';
    const arHtml = d.arabic ? `<div class="c-ar ar-font">${esc(d.arabic)}</div>` : '';
    return `<div class="content-card" role="button" tabindex="0" onclick="openDua('${escAttr(d.id)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openDua('${escAttr(d.id)}')}">${star}<div class="c-title">${esc(d.title)}</div>${subHtml}${arHtml}<div class="c-tr">${esc(d.translation)}</div></div>`;
  }).join('');
}

function _duaLinkify(html) {
  return (typeof IqraScholars !== 'undefined' && typeof IqraScholars.linkifyScholars === 'function')
    ? IqraScholars.linkifyScholars(html)
    : html;
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
        <div class="read-ayah-trn${isGuide ? ' ruqyah-trn-body' : ''}">${isGuide ? _duaLinkify(escRich(d.translation)) : escNl(d.translation)}</div>
      </div>
    </div>
    ${d.note ? `<div class="note-box"><svg class="ico ico-sm note-box-ico"><use href="#i-lightbulb"/></svg><div class="note-box-body">${noteContent}</div></div>` : ''}
    <div class="detail-actions">${isGuide || (d.title && d.title.toLowerCase().includes('рукья')) ? '' : `<button type="button" class="btn" onclick="openMemorizeFor(getDuaById('${escAttr(d.id)}'))"><svg class="ico ico-sm"><use href="#i-lightbulb"/></svg>Заучить</button>`}<button type="button" class="btn secondary" onclick="shareItem('dua','${escAttr(d.id)}')"><svg class="ico ico-sm"><use href="#i-upload"/></svg>Поделиться</button></div>
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

function toggleDuaLearned(id) { const d=getDuaById(id); if (!d) return; d.learned=!d.learned; save(); if (d.learned) { if (navigator.vibrate) navigator.vibrate([20,40,20]); } openDua(id); }
function goDuaList() { activeDuaId=null; switchTab('library'); setLibraryTab('dua'); }