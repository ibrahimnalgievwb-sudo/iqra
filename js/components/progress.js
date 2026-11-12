"use strict";

/* ============================================================
   PROGRESS.JS — Раздел «Прогресс»: обзор, календарь, заучено,
                избранное + закладки
   Проект «Икра» · v383 (рефакторинг)
   Зависимости: calculateStreak, formatDateShort (storage.js),
                openDay (app.js), openBookmark/removeBookmark (reader.js).
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
  if (newInp) { newInp.focus(); try { newInp.setSelectionRange(pos, pos); } catch(e){} }
}
function _progMatch(title) {
  if (!_progFilter) return true;
  return String(title || '').toLowerCase().indexOf(_progFilter) >= 0;
}
function _progSearchHtml() {
  return '<div style="padding:0 0 12px;"><div class="search-wrap"><input type="text" id="prog-search-input" placeholder="Поиск по списку..." value="' + escAttr(_progFilter) + '" oninput="setProgFilter(this.value)"></div></div>';
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
      html += '<div class="learned-item mark-item"><div onclick="openBookmark(\'' + b.id + '\')" style="cursor:pointer;flex:1;min-width:0"><div class="li-title">' + esc(b.label) + '</div><div class="li-sub">' + new Date(b.ts).toLocaleDateString('ru-RU') + '</div></div><button class="mi-del" onclick="removeBookmark(\'' + b.id + '\')" aria-label="Удалить">×</button></div>';
    });
    html += '</div>';
  }
  if (favQ.length) { html += `<div class="settings-group"><div class="progress-section-title">Суры и аяты</div>`; favQ.forEach(q => { html += `<div class="learned-item" onclick="openQuran('${q.id}')" style="cursor:pointer"><div><div class="li-title">${esc(q.title)}</div><div class="li-sub">${esc(q.subtitle||'')}</div></div><div class="li-check">★</div></div>`; }); html += `</div>`; }
  if (favD.length) { html += `<div class="settings-group"><div class="progress-section-title">Дуа</div>`; favD.forEach(d => { html += `<div class="learned-item" onclick="openDua('${d.id}')" style="cursor:pointer"><div><div class="li-title">${esc(d.title)}</div><div class="li-sub">${esc(d.subtitle||'')}</div></div><div class="li-check">★</div></div>`; }); html += `</div>`; }
  if (favH.length) { html += `<div class="settings-group"><div class="progress-section-title">Хадисы</div>`; favH.forEach(h => { html += `<div class="learned-item" onclick="openHadith('${h.id}')" style="cursor:pointer"><div><div class="li-title">${esc(h.title)}</div><div class="li-sub">${esc(h.subtitle||'')}</div></div><div class="li-check">★</div></div>`; }); html += `</div>`; }
  if (!bms.length && !favQ.length && !favD.length && !favH.length) {
    html += '<div class="empty">Пока пусто.<br>Нажимайте ★ на карточках и добавляйте закладки в режиме чтения.</div>';
  }
  body.innerHTML = html;
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
  body.innerHTML = `
    <div class="stat-card" style="grid-column: span 2; background:linear-gradient(135deg, rgba(var(--accent-rgb), .15), rgba(var(--accent-rgb), .05));">
      <div class="sc-label">Сегодня</div>
      <div style="display:flex; align-items:baseline; gap:10px; flex-wrap:wrap;"><div class="sc-value" style="font-size:44px;">${todayTotal}</div><div style="font-size:15px; color:var(--muted); font-weight:500;">/ ${goal} · ${goalPct}%</div></div>
      <div style="margin-top:10px; height:6px; background:var(--card2); border-radius:3px; overflow:hidden;"><div style="width:${goalPct}%; height:100%; background:var(--accent); border-radius:3px;"></div></div>
    </div>
      <div class="stat-grid">
      <div class="stat-card"><div class="sc-label">Всего зикра</div><div class="sc-value">${totalAll}</div><div class="sc-sub">за всё время</div></div>
      <div class="stat-card"><div class="sc-label">Серия</div><div class="sc-value">${calculateStreak()} 🔥</div><div class="sc-sub">дней подряд</div></div>
      <div class="stat-card"><div class="sc-label">Среднее в день</div><div class="sc-value">${avg}</div><div class="sc-sub">за активный день</div></div>
      <div class="stat-card"><div class="sc-label">Лучший день</div><div class="sc-value">${bestDay}</div><div class="sc-sub">${bestDayKey ? formatDateShort(bestDayKey) : '—'}</div></div>
      <div class="stat-card"><div class="sc-label">Тасбихов создано</div><div class="sc-value">${state.tasbihs.length}</div><div class="sc-sub">в списке</div></div>
    </div>
    <div class="settings-group">
      <div class="progress-section-title">Заучивание</div>
      <div class="learned-item"><div><div class="li-title">Суры и аяты</div><div class="li-sub">${learnedQuran} из ${totalQuran} выучено</div></div><div style="font-size:15px; font-weight:700; color:var(--accent);">${totalQuran > 0 ? Math.round((learnedQuran/totalQuran)*100) : 0}%</div></div>
      <div class="learned-item"><div><div class="li-title">Дуа</div><div class="li-sub">${learnedDuas} из ${totalDuas} выучено</div></div><div style="font-size:15px; font-weight:700; color:var(--accent);">${totalDuas > 0 ? Math.round((learnedDuas/totalDuas)*100) : 0}%</div></div>
      <div class="learned-item"><div><div class="li-title">Хадисы</div><div class="li-sub">${learnedHadiths} из ${totalHadiths} изучено</div></div><div style="font-size:15px; font-weight:700; color:var(--accent);">${totalHadiths > 0 ? Math.round((learnedHadiths/totalHadiths)*100) : 0}%</div></div>
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
    html += `<div class="${cls}" onclick="openDay('${key}')"><div>${d}</div>${cnt}</div>`;
  }
  const maxV = Math.max(1, ...daily);
  const today = new Date();
  let bars = daily.map((v,i)=>{ const h=v>0?Math.max(4,(v/maxV)*100):2; const isToday=(today.getFullYear()===y && today.getMonth()===m && today.getDate()===i+1); return `<div class="bar ${isToday?'today':''}" style="height:${h}%"></div>`; }).join('');
  let labels = '';
  for (let d=1; d<=daily.length; d++) { if (d===1 || d%5===0 || d===daily.length) labels += `<span>${d}</span>`; else labels += `<span></span>`; }
  body.innerHTML = `
    <div class="cal-header"><div><div class="month">${MONTHS[m]} ${y}</div><div style="font-size:12px;color:var(--muted);margin-top:2px">${formatHijri(new Date(y, m, 15))}</div></div><div class="cal-nav"><button onclick="shiftMonth(-1)">‹</button><button onclick="shiftMonth(1)">›</button></div></div>
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
  if (learnedQuran.length) { html += `<div class="settings-group"><div class="progress-section-title">Выученные суры и аяты</div>`; learnedQuran.forEach(q => { html += `<div class="learned-item"><div><div class="li-title">${esc(q.title)}</div><div class="li-sub">${q.learnedAt ? formatDateShort(q.learnedAt) : ''}</div></div><div class="li-check">✓</div></div>`; }); html += `</div>`; }
  if (learnedDuas.length) { html += `<div class="settings-group"><div class="progress-section-title">Выученные дуа</div>`; learnedDuas.forEach(d => { html += `<div class="learned-item"><div><div class="li-title">${esc(d.title)}</div></div><div class="li-check">✓</div></div>`; }); html += `</div>`; }
  if (learnedHadiths.length) { html += `<div class="settings-group"><div class="progress-section-title">Изученные хадисы</div>`; learnedHadiths.forEach(h => { html += `<div class="learned-item"><div><div class="li-title">${esc(h.title)}</div></div><div class="li-check">✓</div></div>`; }); html += `</div>`; }
  if (!learnedQuran.length && !learnedDuas.length && !learnedHadiths.length) {
    html += '<div class="empty">Пока ничего не выучено.<br>Начните с раздела «Коран» или «Дуа».</div>';
  }
  body.innerHTML = html;
}

function shiftMonth(d) { calDate.setMonth(calDate.getMonth()+d); renderProgress(); }