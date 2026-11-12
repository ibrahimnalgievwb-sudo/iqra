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
    const star = `<button class="star-btn ${fav?'active':''}" aria-label="${fav?'Убрать из избранного':'Добавить в избранное'}: ${escAttr(d.title)}" onclick="starClick(event,'${escAttr(d.id)}','dua')">${fav?'<svg class="ico"><use href="#i-star-filled"/></svg>':'<svg class="ico"><use href="#i-star"/></svg>'}</button>`;
    return `<div class="content-card" onclick="openDua('${escAttr(d.id)}')">${star}<div class="c-title">${esc(d.title)}</div><div class="c-sub">${esc(d.subtitle||'')}</div><div class="c-ar ar-font">${esc(d.arabic)}</div><div class="c-tr">${esc(d.translation)}</div></div>`;
  }).join('');
}

function openDua(id) {
  activeDuaId = id; const d = getDuaById(id); if (!d) return;
  trackEvent('dua/' + id, 'Дуа: ' + d.title);
  saveLastRead('dua', id);
  const st = document.getElementById('dua-detail-star');
  if (st) { const fav=isFavorite(id); st.innerHTML=fav?'<svg class="ico"><use href="#i-star-filled"/></svg>':'<svg class="ico"><use href="#i-star"/></svg>'; st.classList.toggle('starred', fav); }
  const el = document.getElementById('dua-detail-content');
  el.innerHTML = `
    <div class="detail-hero">
      <div class="dh-title">${esc(d.title)}</div>
      <div class="dh-sub">${esc(d.subtitle||'')}</div>
      <div class="read-ayah" ${d.id === 'ruqyah_guide' ? 'style="padding:0;background:none;box-shadow:none;"' : ''}>
        ${d.arabic ? `<div class="read-ayah-ar ar-font">${escNl(d.arabic)}</div>` : ''}
        ${d.transcription ? `<div class="read-ayah-tr">${escNl(d.transcription)}</div>` : ''}
        <div class="read-ayah-trn" ${d.id === 'ruqyah_guide' ? 'style="font-size:15px;line-height:1.7;text-align:left;color:var(--text);"' : ''}>${d.id === 'ruqyah_guide' ? escRich(d.translation) : escNl(d.translation)}</div>
      </div>
    </div>
    ${d.note ? `<div class="note-box"><svg class="ico ico-sm" style="flex-shrink:0;color:var(--accent2)"><use href="#i-lightbulb"/></svg><div>${escNl(d.note)}</div></div>` : ''}
    <div class="detail-actions">${d.id === 'ruqyah_guide' || d.title && d.title.toLowerCase().includes('рукья') ? '' : `<button class="btn" onclick="openMemorizeFor(getDuaById('${d.id}'))"><svg class="ico ico-sm" style="display:inline-block;vertical-align:-3px;margin-right:6px"><use href="#i-lightbulb"/></svg>Заучить</button>`}<button class="btn secondary" onclick="shareItem('dua','${d.id}')"><svg class="ico ico-sm" style="display:inline-block;vertical-align:-3px;margin-right:6px"><use href="#i-upload"/></svg>Поделиться</button></div>
    <div class="learned-toggle ${d.learned?'done':''}" onclick="toggleDuaLearned('${d.id}')">
      <div class="lt-icon">${d.learned?'✓':'<svg class="ico ico-sm"><use href="#i-book"/></svg>'}</div>
      <div class="lt-body"><div class="lt-title">${d.learned?'Выучено':'Отметить как выучено'}</div><div class="lt-sub">${d.learned?'Нажми, чтобы снять отметку':'Изучи дуа и отметь'}</div></div>
    </div>
    ${d.source ? `<div class="dh-section" style="margin-top:20px;"><div class="dh-label">Источник</div><div class="dh-text muted" style="font-size:13px;">${esc(d.source)}</div></div>` : ''}
    ${transcriptionNote()}
  `;
  showScreen('screen-dua-detail');
}

function toggleDuaLearned(id) { const d=getDuaById(id); if (!d) return; d.learned=!d.learned; save(); if (d.learned) { playChime(); if (navigator.vibrate) navigator.vibrate([20,40,20]); } openDua(id); }
function goDuaList() { activeDuaId=null; switchTab('library'); setLibraryTab('dua'); }