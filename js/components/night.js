"use strict";

/* ============================================================
   NIGHT.JS — Ночное чтение (список и детальный просмотр)
   Проект «Икра» · v383 (рефакторинг)
   ============================================================ */

function renderNightList() {
  const el = document.getElementById('night-list');
  let html = `<div class="night-note"><b>Что читать перед сном</b><br>В достоверных хадисах упоминается чтение перед сном: сур «Аль-Ихлас», «Аль-Фаляк», «Ан-Нас» (по три раза, хадис Аиши — аль-Бухари 5017), Аята аль-Курси (аль-Бухари 2311), двух последних аятов суры «Аль-Бакара» (аль-Бухари 5009) и суры «Аль-Мульк» (ат-Тирмизи 2891). Строгий порядок между ними в Сунне не установлен.</div>`;
  NIGHT_ORDER.forEach((n, i) => {
    let title='', sub='', ar='', trn='';
    if (n.quranId) { const it=getQuranById(n.quranId); if (!it) return; title=it.title; sub=(it.subtitle||'')+' · Читать '+n.times+' раз'+(n.times>1?'а':''); ar=it.arabic; trn=it.translation; }
    else if (n.duaId) { const it=getDuaById(n.duaId); if (!it) return; title=it.title; sub=it.subtitle||''; ar=it.arabic; trn=it.translation; }
    else if (n.hadithId) { const it=getHadithById(n.hadithId); if (!it) return; title=it.title; sub=it.subtitle||''; ar=it.arabic; trn=it.translation; }
    html += `<div class="content-card has-num" onclick="openNight(${i})"><div class="c-num">${i+1}</div><div class="c-title">${esc(title)}</div><div class="c-sub">${esc(sub)}</div><div class="c-ar ar-font">${esc(ar)}</div><div class="c-tr">${esc(trn)}</div></div>`;
  });
  el.innerHTML = html;
}

function openNight(idx) {
  activeNightId = idx;
  const n = NIGHT_ORDER[idx]; if (!n) return;
  let item=null;
  if (n.quranId) item = getQuranById(n.quranId);
  else if (n.duaId) item = getDuaById(n.duaId);
  else if (n.hadithId) item = getHadithById(n.hadithId);
  if (!item) return;
  trackEvent('night/' + idx, 'Ночное чтение: пункт ' + (idx+1));
  document.getElementById('night-detail-title').textContent = item.title;
  const ayahs = parseAyahs(item);
  const el = document.getElementById('night-detail-content');
  el.innerHTML = `
    <div class="detail-hero">
      <div class="dh-title">${esc(item.title)}</div>
      <div class="dh-sub">${esc(item.subtitle||'')} ${n.times>1?' · Читать '+n.times+' раза':''}</div>
    </div>
    ${ayahs.map(a => `
      <div class="read-ayah ${item.type==='ayat'?'ayat-mode':''}">
        <div class="read-ayah-num">${a.num}</div>
        <div class="read-ayah-ar ar-font">${esc(a.ar)}${item.type==='surah' ? ' <span class="read-ayah-marker">' + ayahMarker(a.num) + '</span>' : ''}</div>
        ${a.tr ? `<div class="read-ayah-tr">${esc(a.tr)}</div>` : ''}
        <div class="read-ayah-trn">${esc(a.trn)}</div>
      </div>
    `).join('')}
    ${item.note ? `<div class="note-box"><svg class="ico ico-sm" style="flex-shrink:0;color:var(--accent2)"><use href="#i-lightbulb"/></svg><div>${escNl(item.note)}</div></div>` : ''}
    ${item.source ? `<div class="dh-section" style="margin-top:20px;"><div class="dh-label">Источник</div><div class="dh-text muted" style="font-size:13px;">${esc(item.source)}</div></div>` : ''}
    ${transcriptionNote()}
    <div class="detail-actions" style="margin-top:20px">
      ${n.quranId ? `<button class="btn secondary" onclick="openRead('${item.id}')"><svg class="ico ico-sm" style="display:inline-block;vertical-align:-3px;margin-right:6px"><use href="#i-book"/></svg>Читать</button>` : ''}
      <button class="btn secondary" onclick="memorizeFromNight(${idx})"><svg class="ico ico-sm" style="display:inline-block;vertical-align:-3px;margin-right:6px"><use href="#i-lightbulb"/></svg>Заучить</button>
    </div>
  `;
  showScreen('screen-night-detail');
}

function memorizeFromNight(idx) {
  const n = NIGHT_ORDER[idx]; if (!n) return;
  let item=null;
  if (n.quranId) item = getQuranById(n.quranId);
  else if (n.duaId) item = getDuaById(n.duaId);
  else if (n.hadithId) item = getHadithById(n.hadithId);
  if (item) openMemorizeFor(item);
}

function goNightList() { activeNightId=null; renderNightList(); showScreen('screen-night'); }