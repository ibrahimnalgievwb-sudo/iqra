"use strict";

/* ============================================================
   PATH.JS — Раздел «Путь»: поиск по темам (Коран + Сунна)
   Проект «Икра» · v383 (рефакторинг)
   activePathTag / pathShowAll объявлены в app.js.
   ============================================================ */

var debouncedRenderPath = debounce(renderPath, 250);

function renderPathChips() {
  const container = document.getElementById('path-chips-container');
  if (!container) return;
  if (container.innerHTML !== '') return;

  let html = `<button class="path-chip ${!activePathTag ? 'active' : ''}" onclick="setPathTag(null)">Все темы</button>`;
  html += ALL_TAGS.map(tag => `
    <button class="path-chip ${activePathTag === tag ? 'active' : ''}" onclick="setPathTag('${escAttr(tag)}')">${esc(tag)}</button>
  `).join('');
  container.innerHTML = html;
}

function setPathTag(tag) {
  activePathTag = tag;
  pathShowAll = false;
  const qInput = document.getElementById('path-search');
  if (qInput) qInput.value = '';
  renderPathChips();
  renderPath();
}

function togglePathShowAll() {
  pathShowAll = true;
  renderPath();
}

function flattenQuranToAyahs() {
  const result = [];
  (state.quran || []).forEach(q => {
    if (q.type === 'surah') {
      const ayahs = parseAyahs(q);
      const tags = Array.isArray(q.tags) ? q.tags : [];
      ayahs.forEach((a, i) => {
        result.push({
          _type: 'ayah', _id: q.id + '_' + i, _surahId: q.id,
          _surahTitle: q.title, _surahNum: q.number, _ayahNum: a.num, _ayahIdx: i,
          _ar: a.ar, _tr: a.tr, _trn: a.trn, _tags: tags,
          _title: q.title + ' · аят ' + a.num, _sub: q.subtitle || '', _isSurahAyah: true
        });
      });
    } else {
      result.push({
        _type: 'ayah', _id: q.id, _surahId: q.id, _surahTitle: q.title,
        _surahNum: q.number, _ayahNum: q.number, _ayahIdx: 0,
        _ar: q.arabic, _tr: q.transcription, _trn: q.translation,
        _tags: Array.isArray(q.tags) ? q.tags : [], _title: q.title,
        _sub: q.subtitle || '', _isSurahAyah: false
      });
    }
  });
  return result;
}

function renderPath() {
  const containerChips = document.getElementById('path-chips-container');
  if (containerChips) {
    let chipsHtml = `<button class="path-chip ${!activePathTag ? 'active' : ''}" onclick="setPathTag(null)">Все темы</button>`;
    chipsHtml += ALL_TAGS.map(tag => `
      <button class="path-chip ${activePathTag === tag ? 'active' : ''}" onclick="setPathTag('${escAttr(tag)}')">${esc(tag)}</button>
    `).join('');
    containerChips.innerHTML = chipsHtml;
  }

  const qInput = document.getElementById('path-search');
  const q = (qInput ? qInput.value : '').toLowerCase().trim();
  const resultsEl = document.getElementById('path-results');
  if (!resultsEl) return;

  if (!q && !activePathTag) {
    resultsEl.innerHTML = `
      <div class="path-empty">
        Введите запрос или выберите тему ниже, чтобы найти ответ в Коране и Сунне.
        <div class="path-fallback">
          <button class="path-chip" onclick="setPathTag('Терпение')">Терпение</button>
          <button class="path-chip" onclick="setPathTag('Упование')">Упование</button>
          <button class="path-chip" onclick="setPathTag('Печаль')">Печаль</button>
          <button class="path-chip" onclick="setPathTag('Благодарность')">Благодарность</button>
        </div>
      </div>`;
    return;
  }

  const ayats = flattenQuranToAyahs();
  const duas = (state.duas || []).map(d => ({
    _type: 'dua', _id: d.id, _title: d.title, _sub: d.subtitle || '',
    _ar: d.arabic, _tr: d.transcription, _trn: d.translation,
    _tags: Array.isArray(d.tags) ? d.tags : [], _isSurahAyah: false
  }));
  const hadiths = (state.hadiths || []).map(h => ({
    _type: 'hadith', _id: h.id, _title: h.title, _sub: h.subtitle || '',
    _ar: h.arabic, _tr: h.transcription, _trn: h.translation,
    _tags: Array.isArray(h.tags) ? h.tags : [], _isSurahAyah: false
  }));

  let items = [...ayats, ...duas, ...hadiths];

  if (activePathTag) {
    items = items.filter(item => {
      if (Array.isArray(item._tags) && item._tags.includes(activePathTag)) return true;
      const hay = [item._title, item._sub, item._trn, item._tr, item._ar].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(activePathTag.toLowerCase());
    });
  }
  if (q) {
    const searchStr = q.toLowerCase().trim();
    items = items.filter(item => {
      const hay = [item._title, item._sub, item._trn, item._tr, item._ar].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(searchStr);
    });
  }

  if (!items.length) {
    resultsEl.innerHTML = `
      <div class="path-empty">
        По вашему запросу ничего не найдено.<br>Попробуйте смежные темы или откройте базовую суру.
        <div class="path-fallback">
          <button class="path-chip" onclick="setPathTag('Терпение')">Терпение</button>
          <button class="path-chip" onclick="setPathTag('Упование')">Упование</button>
          <button class="path-chip" onclick="setPathTag('Печаль')">Печаль</button>
          <button class="path-chip" onclick="setPathTag('Благодарность')">Благодарность</button>
          <button class="path-chip" onclick="switchTab('quran')">Открыть Коран</button>
        </div>
      </div>`;
    return;
  }

  const hasMore = items.length > 5 && !pathShowAll;
  const displayItems = pathShowAll ? items : items.slice(0, 5);

  let html = displayItems.map(item => {
    const isAyah = item._type === 'ayah';
    const star = isAyah ? '' :
      `<button class="star-btn ${isFavorite(item._id) ? 'active' : ''}" onclick="starClick(event,'${escAttr(item._id)}','${item._type}')">${isFavorite(item._id) ? '<svg class="ico"><use href="#i-star-filled"/></svg>' : '<svg class="ico"><use href="#i-star"/></svg>'}</button>`;

    let icon = '#i-book';
    let typeLabel = 'Коран';
    if (item._type === 'hadith') { icon = '#i-scroll'; typeLabel = 'Хадис'; }
    else if (item._type === 'dua') { icon = '#i-dua'; typeLabel = 'Дуа'; }
    else if (isAyah && item._surahTitle) { typeLabel = 'Коран · ' + item._surahTitle; }

    const openAction = isAyah
      ? `openQuran('${escAttr(item._surahId)}')`
      : `openPathItem('${item._type}', '${escAttr(item._id)}')`;

    const openBtn = (isAyah && item._isSurahAyah) ? `
      <button class="btn secondary btn-inline" onclick="event.stopPropagation();openRead('${escAttr(item._surahId)}')">
        <svg class="ico ico-sm"><use href="#i-book"/></svg>
        Читать суру полностью
      </button>` : '';

    return `
      <div class="content-card" onclick="${openAction}">
        ${star}
        <div class="c-sub" style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">
          <svg class="ico ico-sm" style="color:var(--gold-accent)"><use href="${icon}"/></svg>
          <span style="text-transform:uppercase; font-weight:700; letter-spacing:.5px;">${esc(typeLabel)}</span>
        </div>
        <div class="c-title">${esc(item._title)}</div>
        ${item._sub ? `<div class="c-sub">${esc(item._sub)}</div>` : ''}
        ${item._ar ? `<div class="c-ar ar-font">${esc(item._ar)}</div>` : ''}
        <div class="c-tr">${esc(item._trn || item._tr || '')}</div>
        ${openBtn}
      </div>`;
  }).join('');

  if (hasMore) html += `<button class="show-all-btn" onclick="togglePathShowAll()">Показать все результаты (${items.length})</button>`;
  resultsEl.innerHTML = html;
}

function openPathItem(type, id) {
  if (type === 'quran') openQuran(id);
  else if (type === 'hadith') openHadith(id);
  else if (type === 'dua') openDua(id);
}