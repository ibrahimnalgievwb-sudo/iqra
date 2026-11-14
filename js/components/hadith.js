"use strict";

/* ============================================================
   HADITH.JS — Список хадисов, детальный просмотр
   Проект «Икра» · v383 (рефакторинг)
   ============================================================ */

function renderHadithList() {
  const el = document.getElementById('library-hadith-list');
  if (!state.hadiths.length) { el.innerHTML = '<div class="empty">Пока нет хадисов</div>'; return; }
  el.innerHTML = state.hadiths.map(h => {
    const fav = isFavorite(h.id);
    const star = `<button class="star-btn ${fav?'active':''}" aria-label="${fav?'Убрать из избранного':'Добавить в избранное'}: ${escAttr(h.title)}" onclick="starClick(event,'${escAttr(h.id)}','hadith')">${fav?'<svg class="ico"><use href="#i-star-filled"/></svg>':'<svg class="ico"><use href="#i-star"/></svg>'}</button>`;
    return `<div class="content-card" onclick="openHadith('${escAttr(h.id)}')">${star}<div class="c-title">${esc(h.title)}</div><div class="c-sub">${esc(h.subtitle||'')}</div><div class="c-ar ar-font">${esc(h.arabic)}</div><div class="c-tr">${esc(h.translation)}</div></div>`;
  }).join('');
}

function openHadith(id) {
  activeHadithId = id; const h = getHadithById(id); if (!h) return;
  trackEvent('hadith/' + id, 'Хадис: ' + h.title);
  saveLastRead('hadith', id);
  const st = document.getElementById('hadith-detail-star');
  if (st) { const fav=isFavorite(id); st.innerHTML=fav?'<svg class="ico"><use href="#i-star-filled"/></svg>':'<svg class="ico"><use href="#i-star"/></svg>'; st.classList.toggle('starred', fav); }
  const el = document.getElementById('hadith-detail-content');
  el.innerHTML = `
    <div class="detail-hero">
      <div class="dh-title">${esc(h.title)}</div>
      <div class="dh-sub">${esc(h.subtitle||'')}</div>
      <div class="read-ayah">
        <div class="read-ayah-ar ar-font">${escNl(h.arabic)}</div>
        <div class="read-ayah-tr">${escNl(h.transcription)}</div>
        <div class="read-ayah-trn">${escNl(h.translation)}</div>
      </div>
    </div>
    ${h.note ? `<div class="note-box"><svg class="ico ico-sm" style="flex-shrink:0;color:var(--accent2)"><use href="#i-lightbulb"/></svg><div>${escNl(h.note)}</div></div>` : ''}
    <div class="detail-actions"><button class="btn" onclick="openMemorizeFor(getHadithById('${escAttr(h.id)}'))"><svg class="ico ico-sm" style="display:inline-block;vertical-align:-3px;margin-right:6px"><use href="#i-lightbulb"/></svg>Заучить</button><button class="btn secondary" onclick="shareItem('hadith','${escAttr(h.id)}')"><svg class="ico ico-sm" style="display:inline-block;vertical-align:-3px;margin-right:6px"><use href="#i-upload"/></svg>Поделиться</button></div>
    <div class="learned-toggle ${h.learned?'done':''}" onclick="toggleHadithLearned('${escAttr(h.id)}')">
      <div class="lt-icon">${h.learned?'✓':'<svg class="ico ico-sm"><use href="#i-book"/></svg>'}</div>
      <div class="lt-body"><div class="lt-title">${h.learned?'Изучено':'Отметить как изученный'}</div><div class="lt-sub">${h.learned?'Нажми, чтобы снять отметку':'Изучи хадис и отметь'}</div></div>
    </div>
    ${h.source ? `<div class="dh-section" style="margin-top:20px;"><div class="dh-label">Источник</div><div class="dh-text muted" style="font-size:13px;">${esc(h.source)}</div></div>` : ''}
    ${transcriptionNote()}
  `;
  showScreen('screen-hadith-detail');
}

function toggleHadithLearned(id) { const h=getHadithById(id); if (!h) return; h.learned=!h.learned; save(); if (h.learned) { playChime(); if (navigator.vibrate) navigator.vibrate([20,40,20]); } openHadith(id); }
function goHadithList() { activeHadithId=null; switchTab('library'); setLibraryTab('hadith'); }