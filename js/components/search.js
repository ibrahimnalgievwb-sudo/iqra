"use strict";

/* ============================================================
   SEARCH.JS — Глобальный поиск по тасбихам/Корану/дуа/хадисам
   Проект «Икра» · v383 (рефакторинг)
   _searchShowAll и searchFilters объявлены в app.js.
   ============================================================ */

var debouncedRenderGlobalSearch = debounce(renderGlobalSearch, 200);

function openSearch(){ document.getElementById('search-overlay').classList.add('active'); setTimeout(()=>{ const i=document.getElementById('global-search-input'); if (i) i.focus(); }, 120); renderGlobalSearch(); }
function closeSearch(){ document.getElementById('search-overlay').classList.remove('active'); const i=document.getElementById('global-search-input'); if (i) i.value=''; }
function showAllSearchResults() { _searchShowAll = true; renderGlobalSearch(); }

function searchOpen(type, id){
  var ov = document.getElementById('search-overlay');
  if (ov) ov.classList.remove('active');
  var inp = document.getElementById('global-search-input');
  if (inp) inp.value = '';
  var res = document.getElementById('search-results');
  if (res) res.innerHTML = '';
  var st = history.state;
  if (st && st.overlay) {
    try { history.replaceState({ screen: st.screen }, ''); } catch(e) {}
  }
  if (type==='quran') openQuran(id);
  else if (type==='dua') openDua(id);
  else if (type==='hadith') openHadith(id);
  else if (type==='tasbih') openCounter(id);
}

function setSearchFilter(key, value){ searchFilters[key] = value; document.querySelectorAll('#search-filters .filter-group[data-filter="' + key + '"] .filter-chip').forEach(function(b){ b.classList.toggle('active', b.dataset.value === value); }); renderGlobalSearch(); }

function renderGlobalSearch() {
  const q = (document.getElementById('global-search-input').value || '').toLowerCase().trim();
  const el = document.getElementById('search-results');
  if (!q) { el.innerHTML = '<div class="empty">Введите запрос — поиск по тасбихам, Корану, дуа и хадисам.</div>'; return; }
  
  const score = (it) => {
    const t = (it.title || '').toLowerCase();
    const s = (it.subtitle || '').toLowerCase();
    const tr = (it.transcription || '').toLowerCase();
    const num = String(it.number || '').toLowerCase();
    const ar = (it.arabic || '').toLowerCase();
    const trn = (it.translation || '').toLowerCase();
    let w = 0;
    if (t.startsWith(q)) w += 10;
    else if (t.includes(q)) w += 6;
    if (num && num.includes(q)) w += 5;
    if (s.includes(q)) w += 3;
    if (tr.includes(q)) w += 3;
    if (ar.includes(q)) w += 1;
    if (trn.includes(q)) w += 1;
    return w;
  };
  
  const statusOk = (it, type) => { 
    if (type === 'tasbih') return true; 
    return searchFilters.status === 'all' || 
           (searchFilters.status === 'learned' && !!it.learned) || 
           (searchFilters.status === 'unlearned' && !it.learned); 
  };
  
  const favOk = (it) => searchFilters.favorite === 'all' || (searchFilters.favorite === 'only' && isFavorite(it.id));
  const showType = (t) => searchFilters.type === 'all' || searchFilters.type === t;
  
  const filtered = (arr, type) => {
    const res = arr.map(it => ({ it: it, s: score(it) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map(x => x.it)
      .filter(it => statusOk(it, type))
      .filter(favOk);
    return _searchShowAll ? res : res.slice(0, 30);
  };

  const grp = (title, items, type) => {
    if (!items.length) return '';
    return '<div class="progress-section-title">' + title + '</div>' + items.map(it => {
      const t = it.title || it.transcription || it.arabic || '—';
      const sub = it.subtitle ? '<div class="c-sub">' + esc(it.subtitle) + '</div>' : '';
      const ar = it.arabic ? '<div class="c-ar ar-font">' + esc(it.arabic) + '</div>' : '';
      const tr = it.translation ? '<div class="c-tr">' + esc(it.translation) + '</div>' : '';
      return '<div class="content-card" onclick="searchOpen(\'' + type + '\',\'' + it.id + '\')"><div class="c-title">' + esc(t) + '</div>' + sub + ar + tr + '</div>';
    }).join('');
  };

  let html = '';
  if (showType('tasbih')) html += grp('Тасбихи', filtered(state.tasbihs, 'tasbih'), 'tasbih');
  if (showType('quran')) html += grp('Коран', filtered(state.quran, 'quran'), 'quran');
  if (showType('dua')) html += grp('Дуа', filtered(state.duas, 'dua'), 'dua');
  if (showType('hadith')) html += grp('Хадисы', filtered(state.hadiths, 'hadith'), 'hadith');

  if (!_searchShowAll && html) {
    html += `<button class="show-all-btn" onclick="showAllSearchResults()">Показать все результаты</button>`;
  }
  el.innerHTML = html || '<div class="empty">Ничего не найдено</div>'; 
}