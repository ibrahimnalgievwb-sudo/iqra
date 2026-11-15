"use strict";

/* ============================================================
   QURAN.JS — Список сур, фильтры, детали суры/аята
   Проект «Икра» · v421 (Умная книга: премиум-тафсир)
   ============================================================ */

var debouncedRenderQuranList = debounce(renderQuranList, 250);
function excerpt(text, lines) { return String(text || '').split('\n').slice(0, lines).join('\n'); }

function renderQuranList() {
  const el = document.getElementById('quran-list');
  const qEl = document.getElementById('quran-search');
  if (!el) return;
  
  let q = qEl ? (qEl.value || '').toLowerCase().trim() : '';
  const ayahM = q.match(/^(\d+)\s*[:\-]\s*\d+$/); if (ayahM) q = ayahM[1];
  const qAr = normalizeArabic(q);
  
  let items = state.quran;
  if (quranFilter === 'surah') items = items.filter(i => i.type === 'surah');
  else if (quranFilter === 'ruqyah') items = items.filter(i => i.type === 'ruqyah' || ['q109','q112','q113','q114'].includes(i.id));
  
  if (q) {
    items = items.filter(item => {
      const hay = [item.title, item.subtitle, item.arabic, item.transcription, item.translation, String(item.number || '')].filter(Boolean).join(' ').toLowerCase();
      if (hay.includes(q)) return true;
      if (qAr && normalizeArabic([item.title, item.arabic, item.transcription].filter(Boolean).join(' ')).includes(qAr)) return true;
      return false;
    });
  }
  
  if (!items.length && quranFilter !== 'ruqyah') { 
    el.innerHTML = state.quran.length ? '<div class="empty">Ничего не найдено</div>' : '<div class="empty">Пока нет текстов</div>'; 
    return; 
  }
  
  let html = '';
  if (quranFilter === 'ruqyah') {
    html += `<div class="content-card content-card--feature" onclick="openDua('ruqyah_guide')"><div class="c-title"><svg class="ico ico-sm" style="display:inline-block;vertical-align:-3px;margin-right:6px;color:var(--gold-accent)"><use href="#i-book"/></svg>Руководство по Рукье</div><div class="c-sub">Статус сидра · Аяты о колдовстве · Профилактика</div><div class="c-tr">Нажмите, чтобы прочитать важные наставления учёных и фетвы Ибн База</div></div>`;
    html += `<div class="content-card content-card--feature" onclick="openQuran('ruqyah_araf')"><div class="c-badge">Рукья</div><div class="c-title">Аяты о колдовстве</div><div class="c-sub">Начните с аль-А'раф 117–119 · Юнус и Та Ха — ниже в списке</div><div class="c-ar ar-font">وَأَوْحَيْنَا إِلَىٰ مُوسَىٰ أَنْ أَلْقِ عَصَاكَ ۖ فَإِذَا هِيَ تَلْقَفُ مَا يَأْفِكُونَ</div><div class="c-tr">Читаются в составе шариатской рукьи на воду или над больным</div></div>`;
  }
  
  html += items.map(item => {
    const fav = isFavorite(item.id);
    const numHtml = item.type === 'surah' ? `<div class="c-num">${item.number}</div>` : '';
    const hasNum = item.type === 'surah' ? ' has-num' : '';
    const star = `<button class="star-btn ${fav?'active':''}" aria-label="${fav?'Убрать из избранного':'Добавить в избранное'}: ${escAttr(item.title)}" onclick="starClick(event,'${escAttr(item.id)}','quran')">${fav?'<svg class="ico"><use href="#i-star-filled"/></svg>':'<svg class="ico"><use href="#i-star"/></svg>'}</button>`;
    let readBadge = '';
    if (item.type === 'surah' && state.settings.readAyah && typeof state.settings.readAyah[item.id] === 'number' && state.settings.readAyah[item.id] > 0) {
      const ayahN = state.settings.readAyah[item.id] + 1;
      readBadge = `<div class="c-badge">С аята ${ayahN}</div>`;
    }
    return `<div class="content-card${hasNum}" onclick="openQuran('${escAttr(item.id)}')">${numHtml}${star}${readBadge}<div class="c-title">${esc(item.title)}</div><div class="c-sub">${esc(item.subtitle||'')}</div><div class="c-ar ar-font">${esc(excerpt(item.arabic, 3))}</div><div class="c-tr">${esc(excerpt(item.translation, 3))}</div></div>`;
  }).join('');
  
  el.innerHTML = html;
}

function setQuranFilter(f) {
  quranFilter = f;
  document.querySelectorAll('[data-q-filter]').forEach(b => b.classList.toggle('active', b.dataset.qFilter === f));
  if (typeof renderQuranList === 'function') renderQuranList();
}

// ПРЕМИУМ-КАРТОЧКА ТАФСИРА
function getSmartTafsirHtml(ayahRef) {
  if (!window.GRAPH_EDGES || !window.DEFAULT_TAFSIRS) return '';
  const edges = window.GRAPH_EDGES.filter(e => e.to === `ayah:${ayahRef}` && e.type === 'tafsir_comments_ayah');
  if (!edges.length) return '';
  let html = '';
  edges.forEach(edge => {
    const tafsir = window.DEFAULT_TAFSIRS.find(t => t.id === edge.from.replace('tafsir:', ''));
    if (tafsir) {
      const scholar = window.GRAPH_SCHOLARS ? window.GRAPH_SCHOLARS.find(s => s.id === tafsir.scholar_id) : null;
      const scholarName = scholar ? scholar.name_ru : 'Ибн Касир';
      const scholarId = tafsir.scholar_id || 'ibn_kathir';
      
      let sourceText = tafsir.evidence_source.locator;
      if (sourceText.includes(';')) sourceText = sourceText.split(';')[0];
      
      html += `
        <details class="tafsir-card" style="margin-top: 16px; background: var(--card2); border-radius: 12px; padding: 14px; border-left: 3px solid var(--gold-accent); text-align: left; direction: ltr;">
          <summary style="font-weight: 700; color: var(--gold-accent); font-size: 14px; outline: none; display: flex; align-items: center; gap: 8px; cursor: pointer; list-style: none;">
            <span class="arrow-icon" style="font-size: 10px; color: var(--muted); transition: transform 0.2s;">▶</span>
            <svg class="ico ico-sm"><use href="#i-book"/></svg> Показать тафсир
          </summary>
          <div style="margin-top: 12px; font-size: 15px; line-height: 1.6; color: var(--text); border-top: 1px dashed var(--border); padding-top: 12px;">
            ${escNl(tafsir.text_ru)}
            
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-top: 14px;">
              <div style="font-size: 12px; color: var(--muted); font-style: italic;">
                ${esc(scholarName)} · ${esc(sourceText)}
              </div>
              <button onclick="event.preventDefault(); openScholarInfo('${escAttr(scholarId)}')" class="btn secondary" style="width: auto; margin: 0; padding: 6px 12px; font-size: 12px; font-weight: 600; min-height: 30px; border-radius: 8px; display: flex; align-items: center; gap: 6px;">
                <svg class="ico ico-sm"><use href="#i-info"/></svg> Справка
              </button>
            </div>
          </div>
        </details>
      `;
    }
  });
  return html;
}

function openQuran(id) {
  activeQuranId = id;
  const item = getQuranById(id); if (!item) return;
  trackEvent('quran/' + id, 'Сура/аят: ' + item.title);
  saveLastRead('quran', id);
  document.getElementById('quran-detail-title').textContent = item.title;
  const ayahs = parseAyahs(item);
  const st = document.getElementById('quran-detail-star');
  if (st) { const fav=isFavorite(id); st.innerHTML=fav?'<svg class="ico"><use href="#i-star-filled"/></svg>':'<svg class="ico"><use href="#i-star"/></svg>'; st.classList.toggle('starred', fav); }
  const el = document.getElementById('quran-detail-content');
  let bismillahHtml = '';
  if (item.bismillah) {
    bismillahHtml = `<div class="bismillah-card"><div class="b-ar ar-font">${esc(item.bismillah.arabic)}</div><div class="b-tr">${esc(item.bismillah.transcription)}</div><div class="b-trn">${esc(item.bismillah.translation)}</div></div>`;
  }
  
  el.innerHTML = `
    <div class="detail-hero">
      <div class="dh-title">${esc(item.title)}</div>
      <div class="dh-sub">${esc(item.subtitle||'')}</div>
    </div>
    ${item.note ? `<div class="note-box"><svg class="ico ico-sm" style="flex-shrink:0;color:var(--accent2)"><use href="#i-lightbulb"/></svg><div>${escNl(item.note)}</div></div>` : ''}
    <div class="detail-actions">
      <button class="btn secondary" onclick="openRead('${escAttr(item.id)}')"><svg class="ico ico-sm" style="display:inline-block;vertical-align:-3px;margin-right:6px"><use href="#i-book"/></svg>Читать</button>
      <button class="btn secondary" onclick="openMemorize('${escAttr(item.id)}')"><svg class="ico ico-sm" style="display:inline-block;vertical-align:-3px;margin-right:6px"><use href="#i-lightbulb"/></svg>Заучить</button>
      <button class="btn secondary" onclick="shareItem('quran','${escAttr(item.id)}')"><svg class="ico ico-sm" style="display:inline-block;vertical-align:-3px;margin-right:6px"><use href="#i-upload"/></svg>Поделиться</button>
    </div>
    <div class="learned-toggle ${item.learned?'done':''}" onclick="toggleQuranLearned('${escAttr(item.id)}')">
      <div class="lt-icon">${item.learned?'✓':'<svg class="ico ico-sm"><use href="#i-book"/></svg>'}</div>
      <div class="lt-body">
        <div class="lt-title">${item.learned?'Выучено':'Отметить как выучено'}</div>
        <div class="lt-sub">${item.learned ? (item.learnedAt ? 'Выучено ' + item.learnedAt : 'Нажми, чтобы снять отметку') : 'Изучи текст и отметь'}</div>
      </div>
    </div>
    ${bismillahHtml}
    <div style="height:16px"></div>
     ${ayahs.map((a, idx) => {
      let verseKey = '';
      let ayahRef = `${item.id}#${idx + 1}`;
      if (item.type === 'surah') { verseKey = `${item.number}:${idx + 1}`; }
      else if (item.type === 'ayat' && item.number && !String(item.number).includes('-')) { verseKey = String(item.number); ayahRef = `${item.id}#1`; }

      return `
       <div class="read-ayah ${item.type==='ayat'?'ayat-mode':''}" data-verse-key="${verseKey}">
        <div class="read-ayah-num">${a.num}</div>
        <div class="read-ayah-ar ar-font" data-raw="${escAttr(a.ar)}">${esc(a.ar)}${item.type==='surah' ? ' <span class="read-ayah-marker">' + ayahMarker(a.num) + '</span>' : ''}</div>
        ${a.tr ? `<div class="read-ayah-tr">${esc(a.tr)}</div>` : ''}
        <div class="read-ayah-trn">${esc(a.trn)}</div>
        ${getSmartTafsirHtml(ayahRef)}
        <button class="ayah-share-btn" onclick="shareAyah('${escAttr(item.id)}',${idx})"><svg class="ico ico-sm"><use href="#i-upload"/></svg>Поделиться аятом</button>
      </div>
      `;
    }).join('')}
    ${item.source ? `<div class="dh-section" style="margin-top:20px;"><div class="dh-label">Источник</div><div class="dh-text muted" style="font-size:13px;">${esc(item.source)}</div></div>` : ''}
    ${transcriptionNote()}
  `;
  showScreen('screen-quran-detail');
}

function toggleQuranLearned(id) {
  const item = getQuranById(id); if (!item) return;
  item.learned = !item.learned; item.learnedAt = item.learned ? todayKey() : '';
  save(); if (item.learned) { if (navigator.vibrate) navigator.vibrate([20,40,20]); }
  openQuran(id);
}
function goQuranList() { activeQuranId = null; renderQuranList(); showScreen('screen-quran'); }
