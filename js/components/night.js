"use strict";

/* ============================================================
   NIGHT.JS — Ночное чтение (список и детальный просмотр)
   Проект «Икра» · v383 (рефакторинг)
   ============================================================ */

function _nightPluralRaz(n) {
  var mod10 = n % 10, mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return n + ' раза';
  return n + ' раз';
}

function _nightLinkify(html) {
  return (typeof IqraScholars !== 'undefined' && typeof IqraScholars.linkifyScholars === 'function')
    ? IqraScholars.linkifyScholars(html)
    : html;
}

function renderNightList() {
  const el = document.getElementById('night-list');
  let html = `<div class="night-note">${_nightLinkify('<b>Что читать перед сном по достоверным хадисам</b><br>Суры «Аль-Ихлас», «Аль-Фаляк» и «Ан-Нас» по три раза с дуновением на ладони и протиранием тела (Сахих аль-Бухари № 5017), Аят аль-Курси (аль-Бухари № 2311), два последних аята суры «Аль-Бакара» (аль-Бухари № 5009, Муслим № 807), суру «Аль-Мульк» (ат-Тирмизи № 2891, Абу Дауд № 1400) и пророческое дуа перед сном (аль-Бухари № 6320, Муслим № 2714).')}</div>`;
  NIGHT_ORDER.forEach((n, i) => {
    let title='', sub='', ar='', trn='';
    if (n.quranId) { const it=getQuranById(n.quranId); if (!it) return; title=it.title; sub=[it.subtitle, 'Читать '+_nightPluralRaz(n.times)].filter(Boolean).join(' · '); ar=it.arabic; trn=it.translation; }
    else if (n.duaId) { const it=getDuaById(n.duaId); if (!it) return; title=it.title; sub=it.subtitle||''; ar=it.arabic; trn=it.translation; }
    else if (n.hadithId) { const it=getHadithById(n.hadithId); if (!it) return; title=it.title; sub=it.subtitle||''; ar=it.arabic; trn=it.translation; }
    html += `<div class="content-card has-num" role="button" tabindex="0" onclick="openNight(${i})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openNight(${i})}"><div class="c-num">${i+1}</div><div class="c-title">${esc(title)}</div>${sub ? `<div class="c-sub">${esc(sub)}</div>` : ''}<div class="c-ar ar-font">${esc(ar)}</div><div class="c-tr">${esc(trn)}</div></div>`;
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
  const subParts = [];
  if (item.subtitle) subParts.push(item.subtitle);
  if (n.times > 1) subParts.push('Читать ' + _nightPluralRaz(n.times));
  const subStr = subParts.join(' · ');
  const noteContent = item.note
    ? ((typeof IqraDalil !== 'undefined' && typeof IqraDalil.renderNoteBlocksHtml === 'function')
        ? IqraDalil.renderNoteBlocksHtml(item.note, { linkify: _nightLinkify })
        : _nightLinkify(escNl(item.note)))
    : '';
  const el = document.getElementById('night-detail-content');
  el.innerHTML = `
    <div class="detail-hero">
      <div class="dh-title">${esc(item.title)}</div>
      ${subStr ? `<div class="dh-sub">${esc(subStr)}</div>` : ''}
    </div>
    ${ayahs.map(a => `
      <div class="read-ayah ${item.type==='ayat'?'ayat-mode':''}">
        <div class="read-ayah-num">${a.num}</div>
        <div class="read-ayah-ar ar-font">${esc(a.ar)}${item.type==='surah' ? ' <span class="read-ayah-marker">' + ayahMarker(a.num) + '</span>' : ''}</div>
        ${a.tr ? `<div class="read-ayah-tr">${esc(a.tr)}</div>` : ''}
        <div class="read-ayah-trn">${esc(a.trn)}</div>
      </div>
    `).join('')}
    ${item.note ? `<div class="note-box"><svg class="ico ico-sm note-box-ico"><use href="#i-lightbulb"/></svg><div class="note-box-body">${noteContent}</div></div>` : ''}
    ${item.source ? `<div class="dh-section detail-source-block"><div class="dh-label">Источник</div><div class="dh-text muted detail-source-text">${_nightLinkify(esc(item.source))}</div></div>` : ''}
    ${typeof renderEcosystemSection === 'function' ? renderEcosystemSection(n.quranId ? ('quran:' + n.quranId) : (n.duaId ? ('dua:' + n.duaId) : (n.hadithId ? ('hadith:' + n.hadithId) : '')), { title: 'Связи в Умной книге' }) : ''}
    ${transcriptionNote()}
    <div class="detail-actions">
      ${n.quranId ? `<button type="button" class="btn secondary" onclick="openRead('${escAttr(item.id)}')"><svg class="ico ico-sm"><use href="#i-book"/></svg>Читать</button>` : ''}
      <button type="button" class="btn secondary" onclick="memorizeFromNight(${idx})"><svg class="ico ico-sm"><use href="#i-lightbulb"/></svg>Заучить</button>
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