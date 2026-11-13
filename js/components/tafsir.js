"use strict";
/* ============================================================
   TAFSIR.JS — Список тафсиров, детальный просмотр, отметка «изучено»
   Проект «Икра» · v417 (Этап 3.6)
   Схема: узлы типа `tafsir` с полной атрибуцией (белый список).
   ============================================================ */

var debouncedRenderTafsirList = debounce(renderTafsirList, 250);
var activeTafsirId = null;
var tafsirFilter = 'all';

function renderTafsirList() {
  const el = document.getElementById('library-tafsir-list');
  if (!el) return;

  let items = (state.tafsirs || []).slice();

  if (tafsirFilter !== 'all') {
    items = items.filter(function(t) { return t.scholar_id === tafsirFilter; });
  }

  if (!items.length) {
    el.innerHTML = '<div class="empty">Тафсиры ещё не добавлены</div>';
    return;
  }

  el.innerHTML = items.map(function(t) {
    const fav = isFavorite(t.id);
    const star = `<button class="star-btn ${fav?'active':''}" aria-label="${fav?'Убрать из избранного':'Добавить в избранное'}: ${escAttr(t.verse_key)}" onclick="starClick(event,'${escAttr(t.id)}','tafsir')">${fav?'<svg class="ico"><use href="#i-star-filled"/></svg>':'<svg class="ico"><use href="#i-star"/></svg>'}</button>`;
    const learnedBadge = t.learned ? '<div class="c-badge">✓ Изучено</div>' : '';
    const sub = esc(t.scholar) + ' · ' + esc(t.source_book);
    return `<div class="content-card" onclick="openTafsir('${escAttr(t.id)}')">${star}${learnedBadge}
      <div class="c-sub">${sub}</div>
      <div class="c-title">${esc(t.surah_name)} · аят ${esc(t.verse_key)}</div>
      <div class="c-ar ar-font">${esc(t.text_ar || '')}</div>
      <div class="c-tr">${esc(t.text_ru || '')}</div>
    </div>`;
  }).join('');
}

function setTafsirFilter(f) {
  tafsirFilter = f;
  document.querySelectorAll('[data-tafsir-filter]').forEach(function(b) {
    b.classList.toggle('active', b.dataset.tafsirFilter === f);
  });
  renderTafsirList();
}

function openTafsir(id) {
  activeTafsirId = id;
  const t = getTafsirById(id);
  if (!t) return;
  trackEvent('tafsir/' + id, 'Тафсир: ' + t.scholar + ' ' + t.verse_key);
  saveLastRead('tafsir', id);

  const st = document.getElementById('tafsir-detail-star');
  if (st) {
    const fav = isFavorite(id);
    st.innerHTML = fav ? '<svg class="ico"><use href="#i-star-filled"/></svg>' : '<svg class="ico"><use href="#i-star"/></svg>';
    st.classList.toggle('starred', fav);
  }

  const el = document.getElementById('tafsir-detail-content');
  const q = getQuranByVerseKey(t.verse_key);

  el.innerHTML = `
    <div class="detail-hero">
      <div class="dh-sub">${esc(t.scholar)} · ${esc(t.source_book)}</div>
      <div class="dh-title">${esc(t.surah_name)} · аят ${esc(t.verse_key)}</div>
      ${q ? `<div class="read-ayah" style="margin-top:16px">
        <div class="read-ayah-ar ar-font">${esc(q.arabic)}</div>
        <div class="read-ayah-trn">${esc(q.translation)}</div>
      </div>` : ''}
    </div>

    <div class="detail-hero">
      <div class="dh-label">Тафсир</div>
      <div class="dh-text" style="line-height:1.8; white-space:pre-line">${esc(t.text_ru)}</div>
    </div>

    ${t.note ? `<div class="note-box"><svg class="ico ico-sm" style="flex-shrink:0;color:var(--accent2)"><use href="#i-lightbulb"/></svg><div>${escNl(t.note)}</div></div>` : ''}

    <div class="detail-actions">
      <button class="btn secondary" onclick="shareItem('tafsir','${t.id}')"><svg class="ico ico-sm" style="display:inline-block;vertical-align:-3px;margin-right:6px"><use href="#i-upload"/></svg>Поделиться</button>
      ${q ? `<button class="btn secondary" onclick="openQuran('${escAttr(q.id)}')"><svg class="ico ico-sm" style="display:inline-block;vertical-align:-3px;margin-right:6px"><use href="#i-book"/></svg>К аяту</button>` : ''}
    </div>

    <div class="learned-toggle ${t.learned?'done':''}" onclick="toggleTafsirLearned('${escAttr(t.id)}')">
      <div class="lt-icon">${t.learned?'✓':'<svg class="ico ico-sm"><use href="#i-book"/></svg>'}</div>
      <div class="lt-body">
        <div class="lt-title">${t.learned?'Изучено':'Отметить как изученное'}</div>
        <div class="lt-sub">${t.learned?'Нажми, чтобы снять отметку':'Прочитай тафсир и отметь'}</div>
      </div>
    </div>

    ${t.themes && t.themes.length ? `<div class="settings-group"><div class="progress-section-title">Связанные темы</div>${t.themes.map(function(th) { return `<div class="learned-item" onclick="setPathTag('${escAttr(th)}');switchTab('path')" style="cursor:pointer"><div class="li-title">${esc(th)}</div><div class="li-check">→</div></div>`; }).join('')}</div>` : ''}

    <div class="settings-group">
      <div class="progress-section-title">Атрибуция</div>
      <div class="learned-item"><div class="li-title">Учёный</div><div>${esc(t.scholar)}</div></div>
      <div class="learned-item"><div class="li-title">Книга</div><div>${esc(t.source_book)}</div></div>
      <div class="learned-item"><div class="li-title">Издание</div><div>${esc(t.edition||'—')}</div></div>
      <div class="learned-item"><div class="li-title">Том / стр.</div><div>${esc(String(t.volume||'—'))} / ${esc(String(t.page||'—'))}</div></div>
      ${t.page_mushaf ? `<div class="learned-item"><div class="li-title">Стр. мусхафа</div><div>${esc(String(t.page_mushaf))}</div></div>` : ''}
    </div>
  `;
  showScreen('screen-tafsir-detail');
}

function toggleTafsirLearned(id) {
  const t = getTafsirById(id);
  if (!t) return;
  t.learned = !t.learned;
  t.learnedAt = t.learned ? todayKey() : '';
  save();
  if (t.learned) {
    playChime();
    if (navigator.vibrate) navigator.vibrate([20,40,20]);
  }
  openTafsir(id);
}

function goTafsirList() {
  activeTafsirId = null;
  renderTafsirList();
  showScreen('screen-library');
}