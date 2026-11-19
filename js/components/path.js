"use strict";

var debouncedRenderPath = debounce(renderPath, 250);

function getOrderedPathThemes() {
  const result = new Array();
  const seen = new Set();
  if (Array.isArray(window.GRAPH_THEMES)) {
    window.GRAPH_THEMES.forEach(t => {
      if (t && t.title_ru && !seen.has(t.title_ru)) {
        seen.add(t.title_ru);
        result.push(t.title_ru);
      }
    });
  }
  if (Array.isArray(window.ALL_TAGS)) {
    window.ALL_TAGS.forEach(tag => {
      if (tag && !seen.has(tag)) {
        seen.add(tag);
        result.push(tag);
      }
    });
  }
  return result;
}

function renderPathChips() {
  const container = document.getElementById('path-chips-container');
  if (!container) return;
  const themes = getOrderedPathThemes();
  let html = `<button class="path-chip ${!activePathTag ? 'active' : ''}" onclick="setPathTag(null)">Все темы</button>`;
  html += themes.map(tag => `<button class="path-chip ${activePathTag === tag ? 'active' : ''}" onclick="setPathTag('${escAttr(tag)}')">${esc(tag)}</button>`).join('');
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

function normalizeSurahAyah(surahNum, ayahNum) {
  const s = Number(surahNum);
  const a = Number(ayahNum);
  if (!Number.isFinite(s) || !Number.isFinite(a)) return null;
  return { surah: s, ayah: a };
}

function resolveTafsirForAyah(surahNum, ayahNum) {
  const norm = normalizeSurahAyah(surahNum, ayahNum);
  if (!norm || !Array.isArray(window.DEFAULT_TAFSIRS)) return null;
  const found = window.DEFAULT_TAFSIRS.find(t =>
    t &&
    Number(t.surah) === norm.surah &&
    Number(t.ayah) === norm.ayah &&
    t.status !== 'placeholder' &&
    typeof t.tafsir_text === 'string' &&
    t.tafsir_text.trim() !== '' &&
    !t.tafsir_text.includes('Ин ша Аллах, здесь скоро появится тафсир')
  );
  return found || null;
}

function scholarIdFromName(sourceText) {
  if (!sourceText || !Array.isArray(window.GRAPH_SCHOLARS)) return 'ibn_kathir';
  const low = String(sourceText).toLowerCase();
  if (low.includes('ибн касир')) return 'ibn_kathir';
  if (low.includes('саади') || low.includes('са‘ди')) return 'as_saadi';
  const match = window.GRAPH_SCHOLARS.find(s => s && s.name_ru && low.includes(s.name_ru.toLowerCase()));
  return match ? match.id : 'ibn_kathir';
}

function flattenQuranToAyahs() {
  const result = new Array();
  (state.quran || new Array()).forEach(q => {
    if (q.type === 'surah') {
      const ayahs = parseAyahs(q);
      const tags = Array.isArray(q.tags) ? q.tags : new Array();
      ayahs.forEach((a, i) => {
        result.push({
          _type: 'ayah',
          _id: q.id + '_' + i,
          _surahId: q.id,
          _surahTitle: q.title,
          _surahNum: q.number,
          _ayahNum: a.num,
          _ayahIdx: i,
          _ar: a.ar,
          _tr: a.tr,
          _trn: a.trn,
          _tags: tags,
          _title: q.title + ' · аят ' + a.num,
          _sub: q.subtitle || '',
          _isSurahAyah: true
        });
      });
    } else {
      result.push({
        _type: 'ayah',
        _id: q.id,
        _surahId: q.id,
        _surahTitle: q.title,
        _surahNum: q.number,
        _ayahNum: 1,
        _ayahIdx: 0,
        _ar: q.arabic,
        _tr: q.transcription,
        _trn: q.translation,
        _tags: Array.isArray(q.tags) ? q.tags : new Array(),
        _title: q.title,
        _sub: q.subtitle || '',
        _isSurahAyah: false
      });
    }
  });
  return result;
}

function renderPath() {
  renderPathChips();

  const qInput = document.getElementById('path-search');
  const q = (qInput ? qInput.value : '').toLowerCase().trim();
  const resultsEl = document.getElementById('path-results');
  if (!resultsEl) return;

  if (!q && !activePathTag) {
    const featuredThemes = getOrderedPathThemes().slice(0, 7);
    resultsEl.innerHTML = `
      <div class="path-empty">
        Введите запрос или выберите тему ниже, чтобы найти ответ в Коране и Сунне.
        <div class="path-fallback">
          ${featuredThemes.map(t => `<button class="path-chip" onclick="setPathTag('${escAttr(t)}')">${esc(t)}</button>`).join('')}
        </div>
      </div>`;
    return;
  }

  const ayats = flattenQuranToAyahs();
  let finalItems = new Array();

  if (activePathTag && Array.isArray(window.GRAPH_EDGES) && Array.isArray(window.GRAPH_THEMES)) {
    const themeObj = window.GRAPH_THEMES.find(t => t.title_ru === activePathTag);
    const themeId = themeObj ? themeObj.id : activePathTag.toLowerCase();
    const semanticEdges = window.GRAPH_EDGES.filter(e => e.type === 'ayah_theme' && e.to === `theme:${themeId}`);

    semanticEdges.forEach(edge => {
      const ayahRef = edge.from.replace('ayah:', '');
      const parts = ayahRef.split('#');
      const surahId = parts.at(0);
      const ayahNum = parts.at(1);
      const foundAyah = ayats.find(a => a._surahId === surahId && String(a._ayahNum) === String(ayahNum || 1));
      if (foundAyah) {
        const sourceLoc = edge.evidence_source && edge.evidence_source.locator ? edge.evidence_source.locator : '';
        const tafsirObj = foundAyah._isSurahAyah ? resolveTafsirForAyah(foundAyah._surahNum, foundAyah._ayahNum) : null;
        const tafsirText = tafsirObj ? tafsirObj.tafsir_text : '';
        const scholarId = tafsirObj ? scholarIdFromName(tafsirObj.source) : 'ibn_kathir';

        const relatedHadithEdges = window.GRAPH_EDGES.filter(e => e.type === 'hadith_explains_ayah' && e.to === `ayah:${ayahRef}`);
        const relatedHadiths = new Array();
        relatedHadithEdges.forEach(he => {
          const hId = he.from.replace('hadith:', '');
          const hObj = (state.hadiths || new Array()).find(h => h.id === hId);
          if (hObj && !relatedHadiths.find(x => x.id === hObj.id)) {
            relatedHadiths.push(hObj);
          }
        });

        finalItems.push({
          ...foundAyah,
          _semanticJustification: sourceLoc,
          _tafsirReason: tafsirText,
          _hasTafsir: Boolean(tafsirText),
          _scholarId: scholarId,
          _relatedHadiths: relatedHadiths
        });
      }
    });
  }

  if (q || !activePathTag) {
    const duas = (state.duas || new Array()).map(d => ({
      _type: 'dua',
      _id: d.id,
      _title: d.title,
      _sub: d.subtitle || '',
      _ar: d.arabic,
      _tr: d.transcription,
      _trn: d.translation,
      _tags: Array.isArray(d.tags) ? d.tags : new Array(),
      _isSurahAyah: false
    }));
    const hadiths = (state.hadiths || new Array()).map(h => ({
      _type: 'hadith',
      _id: h.id,
      _title: h.title,
      _sub: h.subtitle || '',
      _ar: h.arabic,
      _tr: h.transcription,
      _trn: h.translation,
      _tags: Array.isArray(h.tags) ? h.tags : new Array(),
      _isSurahAyah: false
    }));
    let textItems = [...ayats, ...duas, ...hadiths];

    if (activePathTag) {
      textItems = textItems.filter(item => {
        if (Array.isArray(item._tags) && item._tags.includes(activePathTag)) return true;
        const hay = [item._title, item._sub, item._trn, item._tr, item._ar].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(activePathTag.toLowerCase());
      });
    }
    if (q) {
      const searchStr = q.toLowerCase().trim();
      textItems = textItems.filter(item => {
        const hay = [item._title, item._sub, item._trn, item._tr, item._ar].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(searchStr);
      });
    }
    textItems.forEach(item => {
      if (!finalItems.find(f => f._id === item._id)) finalItems.push(item);
    });
  }

  if (!finalItems.length) {
    const fallbackThemes = getOrderedPathThemes().slice(0, 4);
    resultsEl.innerHTML = `
      <div class="path-empty">
        По вашему запросу ничего не найдено.<br>Попробуйте смежные темы или откройте базовую суру.
        <div class="path-fallback">
          ${fallbackThemes.map(t => `<button class="path-chip" onclick="setPathTag('${escAttr(t)}')">${esc(t)}</button>`).join('')}
          <button class="path-chip" onclick="switchTab('quran')">Открыть Коран</button>
        </div>
      </div>`;
    return;
  }

  const hasMore = finalItems.length > 5 && !pathShowAll;
  const displayItems = pathShowAll ? finalItems : finalItems.slice(0, 5);

  let html = displayItems.map(item => {
    const isAyah = item._type === 'ayah';
    let icon = '#i-book';
    let typeLabel = 'Коран';
    if (item._type === 'hadith') {
      icon = '#i-scroll';
      typeLabel = 'Хадис';
    } else if (item._type === 'dua') {
      icon = '#i-dua';
      typeLabel = 'Дуа';
    } else if (isAyah && item._surahTitle) {
      typeLabel = 'Коран · ' + item._surahTitle;
    }

    const openAction = isAyah ? `openQuran('${escAttr(item._surahId)}')` : `openPathItem('${item._type}', '${escAttr(item._id)}')`;
    const openBtn = (isAyah && item._isSurahAyah)
      ? `<button class="btn secondary btn-inline" onclick="event.stopPropagation();openRead('${escAttr(item._surahId)}')"><svg class="ico ico-sm"><use href="#i-book"/></svg> Читать суру полностью</button>`
      : '';

    let semanticBlock = '';
    if (item._semanticJustification) {
      const scholar = Array.isArray(window.GRAPH_SCHOLARS) ? window.GRAPH_SCHOLARS.find(s => s.id === item._scholarId) : null;
      const scholarName = scholar ? scholar.name_ru : 'Ибн Касир';
      let locText = item._semanticJustification;
      if (locText.includes(';')) locText = locText.split(';').at(0);

      const tafsirHtml = item._hasTafsir
        ? `<div style="font-size: 14px; color: var(--text); line-height: 1.55; margin-bottom: 12px;">«${esc(item._tafsirReason)}»</div>` : <div style="font-size: 13.5px; color: var(--muted); line-height: 1.5; margin-bottom: 12px; font-style: italic;">Ин ша Аллах, здесь скоро появится тафсир</div>;
const hadithsHtml = (Array.isArray(item._relatedHadiths) && item._relatedHadiths.length > 0)
? item._relatedHadiths.map(h => <div onclick="event.stopPropagation(); openHadith('${escAttr(h.id)}')" style="margin-top: 10px; padding: 10px 12px; background: rgba(212, 175, 55, 0.08); border: 1px solid rgba(212, 175, 55, 0.22); border-radius: 10px; cursor: pointer;"> <div style="font-size: 11px; color: var(--gold-accent); font-weight: 700; margin-bottom: 4px;">${esc(h.title || 'Достоверный хадис')}${h.subtitle ? ' · ' + esc(h.subtitle) : ''}</div> <div style="font-size: 13px; color: var(--text); line-height: 1.5;">${esc(h.translation || '')}</div> </div>).join('')
: '';
semanticBlock =  <div style="margin-top: 16px; padding: 16px; background: rgba(var(--accent-rgb), 0.05); border-left: 3px solid var(--gold-accent); border-radius: 8px; text-align: left;"> <div style="font-size: 11px; color: var(--gold-accent); font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Смысловая связь</div> ${tafsirHtml} <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-top: 0;"> <div style="font-size: 12px; color: var(--muted); font-style: italic;">${esc(scholarName)} · ${esc(locText)}</div> <button onclick="event.stopPropagation(); openScholarInfo('${escAttr(item._scholarId)}')" class="btn secondary" style="width: auto; margin: 0; padding: 6px 12px; font-size: 12px; font-weight: 600; min-height: 30px; border-radius: 8px; display: flex; align-items: center; gap: 6px;"> <svg class="ico ico-sm"><use href="#i-info"/></svg> Справка </button> </div> ${hadithsHtml} </div>;
}
return <div class="content-card" onclick="${openAction}"> <div class="c-sub" style="display:flex; align-items:center; gap:6px; margin-bottom:8px;"> <svg class="ico ico-sm" style="color:var(--gold-accent)"><use href="${icon}"/></svg> <span style="text-transform:uppercase; font-weight:700; letter-spacing:.5px;">${esc(typeLabel)}</span> </div> <div class="c-title">${esc(item._title)}</div> ${item._sub ? ${esc(item._sub)}: ''} ${item._ar ?${esc(item._ar)} : ''} <div class="c-tr">${esc(item._trn || item._tr || '')}</div> ${semanticBlock} ${openBtn} </div>;
}).join('');
if (hasMore) html += <button class="show-all-btn" onclick="togglePathShowAll()">Показать все результаты (${finalItems.length})</button>;
resultsEl.innerHTML = html;
}
function openPathItem(type, id) {
if (type === 'quran') openQuran(id);
else if (type === 'hadith') openHadith(id);
else if (type === 'dua') openDua(id);
}

