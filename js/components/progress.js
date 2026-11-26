"use strict";

/* ============================================================
   PROGRESS.JS — Раздел «Прогресс»: обзор, календарь, заучено,
                избранное + закладки
   Проект «Икра» · v387 (Этап 3.5)
   D-06: goal-бар через scaleX, bar-chart через scaleY.
   ============================================================ */

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const DOW = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

function setProgTab(t) { progTab = t; document.querySelectorAll('.prog-tabs button').forEach(b=>b.classList.toggle('active', b.dataset.pt===t)); renderProgress(); }

function renderProgress() { if (progTab === 'overview') renderProgressOverview(); else if (progTab === 'calendar') renderProgressCalendar(); else if (progTab === 'learned') renderProgressLearned(); else if (progTab === 'favorites') renderProgressFavorites(); }

function setProgFilter(v) {
  var inp = document.getElementById('prog-search-input');
  var pos = inp ? (inp.selectionStart || 0) : 0;
  _progFilter = (v || '').toLowerCase().trim();
  renderProgress();
  var newInp = document.getElementById('prog-search-input');
  if (newInp && typeof newInp.focus === 'function') { newInp.focus(); try { newInp.setSelectionRange(pos, pos); } catch(e){} }
}
function _progMatch(title) {
  if (!_progFilter) return true;
  return String(title || '').toLowerCase().indexOf(_progFilter) >= 0;
}
function clearProgFilter() {
  _progFilter = '';
  renderProgress();
  var newInp = document.getElementById('prog-search-input');
  if (newInp && typeof newInp.focus === 'function') newInp.focus();
}
window.clearProgFilter = clearProgFilter;

function _progSearchHtml() {
  return '<div class="prog-search-row"><div class="search-wrap"><input type="text" id="prog-search-input" placeholder="Поиск по списку..." value="' + escAttr(_progFilter) + '" oninput="setProgFilter(this.value)"></div></div>';
}

function renderProgressFavorites() {
  const body = document.getElementById('prog-body');
  const favQ = state.quran.filter(q=>isFavorite(q.id) && _progMatch(q.title));
  const favD = state.duas.filter(d=>isFavorite(d.id) && _progMatch(d.title));
  const favH = state.hadiths.filter(h=>isFavorite(h.id) && _progMatch(h.title));
  const bms = Array.isArray(state.bookmarks) ? state.bookmarks.slice().reverse() : [];
  let html = _progSearchHtml();
  if (bms.length) {
    html += '<div class="settings-group"><div class="progress-section-title">Закладки</div>';
    bms.forEach(b => {
      html += '<div class="learned-item mark-item"><button type="button" class="learned-item-btn" onclick="openBookmark(\'' + escAttr(b.id) + '\')"><div class="li-title">' + esc(b.label) + '</div><div class="li-sub">' + new Date(b.ts).toLocaleDateString('ru-RU') + '</div></button><button type="button" class="mi-del" onclick="removeBookmark(\'' + escAttr(b.id) + '\')" aria-label="Удалить закладку: ' + escAttr(b.label) + '"><svg class="ico ico-sm"><use href="#i-x"/></svg></button></div>';
    });
    html += '</div>';
  }
  if (favQ.length) { html += `<div class="settings-group"><div class="progress-section-title">Суры и аяты</div>`; favQ.forEach(q => { html += `<button type="button" class="learned-item learned-item-fullbtn" onclick="openQuran('${escAttr(q.id)}')"><div><div class="li-title">${esc(q.title)}</div><div class="li-sub">${esc(q.subtitle||'')}</div></div><div class="li-check"><svg class="ico ico-sm"><use href="#i-star-filled"/></svg></div></button>`; }); html += `</div>`; }
  if (favD.length) { html += `<div class="settings-group"><div class="progress-section-title">Дуа</div>`; favD.forEach(d => { html += `<button type="button" class="learned-item learned-item-fullbtn" onclick="openDua('${escAttr(d.id)}')"><div><div class="li-title">${esc(d.title)}</div><div class="li-sub">${esc(d.subtitle||'')}</div></div><div class="li-check"><svg class="ico ico-sm"><use href="#i-star-filled"/></svg></div></button>`; }); html += `</div>`; }
  if (favH.length) { html += `<div class="settings-group"><div class="progress-section-title">Хадисы</div>`; favH.forEach(h => { html += `<button type="button" class="learned-item learned-item-fullbtn" onclick="openHadith('${escAttr(h.id)}')"><div><div class="li-title">${esc(h.title)}</div><div class="li-sub">${esc(h.subtitle||'')}</div></div><div class="li-check"><svg class="ico ico-sm"><use href="#i-star-filled"/></svg></div></button>`; }); html += `</div>`; }
  if (!bms.length && !favQ.length && !favD.length && !favH.length) {
    html += _progFilter
      ? '<div class="empty">По запросу ничего не найдено<div class="spacer-sm"></div><button type="button" class="btn secondary btn-inline" onclick="clearProgFilter()">Сбросить поиск</button></div>'
      : '<div class="empty">Пока пусто.<br>Нажимайте на звезду на карточках и добавляйте закладки в режиме чтения.</div>';
  }
  body.innerHTML = html;
}

function _getNightProgressSummary() {
  const total = (typeof NIGHT_ORDER !== 'undefined' && Array.isArray(NIGHT_ORDER)) ? NIGHT_ORDER.length : 0;
  const today = (typeof todayKey === 'function') ? todayKey() : '';
  const cl = (state && state.settings && state.settings.nightChecklist && state.settings.nightChecklist.date === today && Array.isArray(state.settings.nightChecklist.done))
    ? state.settings.nightChecklist.done
    : [];
  const validDone = cl.filter(idx => typeof idx === 'number' && idx >= 0 && idx < total);
  return { done: validDone.length, total: total };
}

function renderProgressOverview() {
  const body = document.getElementById('prog-body');
  let totalAll = 0, daysWithDhikr = 0, bestDay = 0, bestDayKey = '';
  for (const k in state.history) { const t = state.history[k].total; totalAll += t; if (t > 0) daysWithDhikr++; if (t > bestDay) { bestDay = t; bestDayKey = k; } }
  const avg = daysWithDhikr > 0 ? Math.round(totalAll / daysWithDhikr) : 0;
  const today = state.history[todayKey()]; const todayTotal = today ? today.total : 0;
  const goal = state.settings.dailyGoal;
  const goalPct = goal > 0 ? Math.min(100, Math.round((todayTotal/goal)*100)) : 0;
  const learnedQuran = state.quran.filter(q => q.learned).length; const totalQuran = state.quran.length;
  const learnedDuas = state.duas.filter(d => d.learned).length; const totalDuas = state.duas.length;
  const learnedHadiths = state.hadiths.filter(h => h.learned).length; const totalHadiths = state.hadiths.length;
  const nightSum = _getNightProgressSummary();
  const bookmarksCount = Array.isArray(state.bookmarks) ? state.bookmarks.length : 0;

  body.innerHTML = `
    <div class="stat-card prog-today-card">
      <div class="sc-label">Сегодня</div>
      <div class="prog-today-row">
        <div class="sc-value prog-today-val">${todayTotal}</div>
        <div class="prog-today-goal">/ ${goal} · ${goalPct}%</div>
      </div>
      <div class="prog-goal-track"><div class="prog-goal-fill" style="transform: scaleX(${(goalPct / 100).toFixed(4)})"></div></div>
    </div>
    <div class="stat-grid">
      <div class="stat-card"><div class="sc-label">Всего зикра</div><div class="sc-value">${totalAll}</div><div class="sc-sub">за всё время</div></div>
      <div class="stat-card"><div class="sc-label">Серия</div><div class="sc-value">${calculateStreak()} <svg class="ico ico-sm prog-flame-ico"><use href="#i-flame"/></svg></div><div class="sc-sub">дней подряд</div></div>
      <div class="stat-card"><div class="sc-label">Среднее в день</div><div class="sc-value">${avg}</div><div class="sc-sub">за активный день</div></div>
      <div class="stat-card"><div class="sc-label">Лучший день</div><div class="sc-value">${bestDay}</div><div class="sc-sub">${bestDayKey ? formatDateShort(bestDayKey) : '—'}</div></div>
      <button type="button" class="stat-card stat-card-btn" onclick="switchTab('night')"><div class="sc-label">Ночное чтение</div><div class="sc-value">${nightSum.done} / ${nightSum.total}</div><div class="sc-sub">чеклист сегодня</div></button>
      <button type="button" class="stat-card stat-card-btn" onclick="setProgTab('favorites')"><div class="sc-label">Закладки</div><div class="sc-value">${bookmarksCount}</div><div class="sc-sub">сохранено при чтении</div></button>
    </div>
    <div class="settings-group">
      <div class="progress-section-title">Заучивание</div>
      <button type="button" class="learned-item learned-item-fullbtn" onclick="setProgTab('learned')"><div><div class="li-title">Суры и аяты</div><div class="li-sub">${learnedQuran} из ${totalQuran} выучено</div></div><div class="prog-pct-badge">${totalQuran > 0 ? Math.round((learnedQuran/totalQuran)*100) : 0}%</div></button>
      <button type="button" class="learned-item learned-item-fullbtn" onclick="setProgTab('learned')"><div><div class="li-title">Дуа</div><div class="li-sub">${learnedDuas} из ${totalDuas} выучено</div></div><div class="prog-pct-badge">${totalDuas > 0 ? Math.round((learnedDuas/totalDuas)*100) : 0}%</div></button>
      <button type="button" class="learned-item learned-item-fullbtn" onclick="setProgTab('learned')"><div><div class="li-title">Хадисы</div><div class="li-sub">${learnedHadiths} из ${totalHadiths} изучено</div></div><div class="prog-pct-badge">${totalHadiths > 0 ? Math.round((learnedHadiths/totalHadiths)*100) : 0}%</div></button>
    </div>
  `;
}

function renderProgressCalendar() {
  const body = document.getElementById('prog-body');
  const y = calDate.getFullYear(), m = calDate.getMonth();
  const firstDay = new Date(y, m, 1);
  let startDow = firstDay.getDay()-1; if (startDow<0) startDow=6;
  const daysInMonth = new Date(y, m+1, 0).getDate();
  const todayK = todayKey();
  let html = '';
  DOW.forEach(d=>html += `<div class="cal-dow">${d}</div>`);
  for (let i=0;i<startDow;i++) html += `<div class="cal-day empty"></div>`;
  let monthTotal=0, monthDays=0, best=0;
  const daily = [];
  for (let d=1; d<=daysInMonth; d++) {
    const key = y+'-'+pad(m+1)+'-'+pad(d);
    const entry = state.history[key];
    const count = entry ? entry.total : 0;
    daily.push(count);
    if (count>0) { monthTotal+=count; monthDays++; if (count>best) best=count; }
    const isToday = key===todayK;
    const isFuture = new Date(y,m,d) > new Date();
    let cls='cal-day'; if (count>0) cls+=' has-count'; if (isToday) cls+=' today'; if (isFuture) cls+=' future';
    const cnt = count>0 ? `<div class="cnt">${count>999?'999+':count}</div>` : '';
    html += `<button type="button" class="${cls}" onclick="openDay('${key}')"><div>${d}</div>${cnt}</button>`;
  }
  const maxV = Math.max(1, ...daily);
  const today = new Date();
  /* D-06: bar-chart via transform: scaleY */
  let bars = daily.map((v,i)=>{ const h=v>0?Math.max(4,(v/maxV)*100):2; const isToday=(today.getFullYear()===y && today.getMonth()===m && today.getDate()===i+1); return `<div class="bar ${isToday?'today':''}" style="transform:scaleY(${(h/100).toFixed(4)})"></div>`; }).join('');
  let labels = '';
  for (let d=1; d<=daily.length; d++) { if (d===1 || d%5===0 || d===daily.length) labels += `<span>${d}</span>`; else labels += `<span></span>`; }
  body.innerHTML = `
    <div class="cal-header"><div><div class="month">${MONTHS[m]} ${y}</div><div class="prog-hijri-sub">${formatHijri(new Date(y, m, 15))}</div></div><div class="cal-nav"><button type="button" onclick="shiftMonth(-1)" aria-label="Предыдущий месяц"><svg class="ico"><use href="#i-chevron-left"/></svg></button><button type="button" onclick="shiftMonth(1)" aria-label="Следующий месяц"><svg class="ico"><use href="#i-chevron-right"/></svg></button></div></div>
    <div class="cal-grid">${html}</div>
     <div class="cal-summary">
      <div class="stat"><div class="label">Всего за месяц</div><div class="value">${monthTotal}</div></div>
      <div class="stat"><div class="label">Дней с зикром</div><div class="value">${monthDays}</div></div>
      <div class="stat"><div class="label">Лучший день</div><div class="value">${best}</div></div>
      <div class="stat"><div class="label">Средн. в день</div><div class="value">${monthDays > 0 ? Math.round(monthTotal / monthDays) : 0}</div></div>
    </div>
    <div class="bar-chart"><div class="bc-title">По дням месяца</div><div class="bars">${bars}</div><div class="x-axis">${labels}</div></div>
  `;
}

function renderProgressLearned() {
  const body = document.getElementById('prog-body');
  const learnedQuran = state.quran.filter(q => q.learned && _progMatch(q.title));
  const learnedDuas = state.duas.filter(d => d.learned && _progMatch(d.title));
  const learnedHadiths = state.hadiths.filter(h => h.learned && _progMatch(h.title));
  let html = _progSearchHtml();
  if (learnedQuran.length) {
    html += `<div class="settings-group"><div class="progress-section-title">Выученные суры и аяты</div>`;
    learnedQuran.forEach(q => {
      html += `<button type="button" class="learned-item learned-item-fullbtn" onclick="openQuran('${escAttr(q.id)}')"><div><div class="li-title">${esc(q.title)}</div><div class="li-sub">${q.learnedAt ? esc(formatDateShort(q.learnedAt)) : esc(q.subtitle||'')}</div></div><div class="li-check"><svg class="ico ico-sm"><use href="#i-check"/></svg></div></button>`;
    });
    html += `</div>`;
  }
  if (learnedDuas.length) {
    html += `<div class="settings-group"><div class="progress-section-title">Выученные дуа</div>`;
    learnedDuas.forEach(d => {
      html += `<button type="button" class="learned-item learned-item-fullbtn" onclick="openDua('${escAttr(d.id)}')"><div><div class="li-title">${esc(d.title)}</div>${d.subtitle ? `<div class="li-sub">${esc(d.subtitle)}</div>` : ''}</div><div class="li-check"><svg class="ico ico-sm"><use href="#i-check"/></svg></div></button>`;
    });
    html += `</div>`;
  }
  if (learnedHadiths.length) {
    html += `<div class="settings-group"><div class="progress-section-title">Изученные хадисы</div>`;
    learnedHadiths.forEach(h => {
      html += `<button type="button" class="learned-item learned-item-fullbtn" onclick="openHadith('${escAttr(h.id)}')"><div><div class="li-title">${esc(h.title)}</div>${h.subtitle ? `<div class="li-sub">${esc(h.subtitle)}</div>` : ''}</div><div class="li-check"><svg class="ico ico-sm"><use href="#i-check"/></svg></div></button>`;
    });
    html += `</div>`;
  }
  if (!learnedQuran.length && !learnedDuas.length && !learnedHadiths.length) {
    html += _progFilter
      ? '<div class="empty">По запросу ничего не найдено<div class="spacer-sm"></div><button type="button" class="btn secondary btn-inline" onclick="clearProgFilter()">Сбросить поиск</button></div>'
      : '<div class="empty">Пока ничего не выучено.<br>Начните с раздела «Коран» или «Дуа».</div>';
  }
  body.innerHTML = html;
}

function shiftMonth(d) { calDate.setMonth(calDate.getMonth()+d); renderProgress(); }
