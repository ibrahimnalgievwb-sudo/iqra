"use strict";

/* ============================================================
   SETTINGS.JS — Настройки, темы (sunrise/sunset), напоминания,
                 экспорт/импорт/сброс, дневная цель
   Проект «Икра» · v417
   ============================================================ */

/* ---------- OPEN SETTINGS ---------- */
function openSettings() {
  document.getElementById('daily-goal-input').value = state.settings.dailyGoal;
  document.getElementById('opt-autonext').checked = state.settings.autoNext;
  document.getElementById('opt-wake').checked = state.settings.wakeLock;
  document.getElementById('opt-sound').checked = state.settings.sound;
    document.getElementById('opt-vibrate').checked = state.settings.vibrate;
  document.getElementById('opt-goal-notify').checked = !!state.settings.goalNotify;
  document.querySelectorAll('#size-seg button').forEach(b=>b.classList.toggle('active', parseFloat(b.dataset.size)===state.settings.arSize));
  renderReminders(); showScreen('screen-settings');
}

function setDailyGoal(v) { state.settings.dailyGoal = Math.max(0, Math.min(1000000, parseInt(v)||0)); save(); }

/* ---------- REMINDERS ---------- */
function renderReminders() { const el=document.getElementById('reminders-list'); if (!state.reminders.length) { el.innerHTML=`<div style="padding:14px 16px;color:var(--muted);font-size:13px">Пока нет напоминаний</div>`; return; } el.innerHTML = state.reminders.map((r,i)=>`<div class="reminder-row"><div class="rr-top"><input type="time" value="${esc(r.time)}" onchange="updateReminderField(${i},'time',this.value)"><label class="toggle"><input type="checkbox" ${r.on?'checked':''} onchange="toggleReminder(${i}, this.checked)"><span class="slider"></span></label><button class="del" onclick="deleteReminder(${i})">×</button></div><input type="text" value="${esc(r.message||'')}" placeholder="Сообщение (необязательно)" maxlength="200" onchange="updateReminderField(${i},'message',this.value)"></div>`).join(''); }
function addReminder() { if (state.reminders.length >= LIMITS.reminders) { alert('Максимум '+LIMITS.reminders+' напоминаний'); return; } const t=document.getElementById('new-reminder-time').value; const mi=document.getElementById('new-reminder-msg'); const msg=(mi?mi.value:'').trim().slice(0,200); if (!t || !/^\d{2}:\d{2}$/.test(t)) return; state.reminders.push({time:t,on:true,lastFired:'',message:msg}); if (mi) mi.value=''; save(); renderReminders(); if ('Notification' in window && Notification.permission === 'default') { try { const p = Notification.requestPermission(); if (p && typeof p.catch === 'function') p.catch(function(){}); } catch(e) {} } }
function updateReminderField(i, field, v) { if (field==='time') { if (!/^\d{2}:\d{2}$/.test(v)) return; state.reminders[i].time=v; } else if (field==='message') { state.reminders[i].message=String(v||'').trim().slice(0,200); } save(); }
function toggleReminder(i,v) { state.reminders[i].on = v; save(); }
function deleteReminder(i) { state.reminders.splice(i,1); save(); renderReminders(); }

/* ---------- THEME / SUNRISE-SUNSET ---------- */
function _regionForTheme() {
  var off = -new Date().getTimezoneOffset() / 60;
  var table = {
     2: { lat: 54.7, lon:  20.5 },
     3: { lat: 55.75, lon: 37.62 },
     4: { lat: 56.3, lon:  44.0 },
     5: { lat: 55.0, lon:  60.0 },
     6: { lat: 55.0, lon:  73.0 },
     7: { lat: 55.0, lon:  83.0 },
     8: { lat: 52.3, lon: 104.3 },
     9: { lat: 48.5, lon: 135.0 },
    10: { lat: 48.5, lon: 135.0 },
    11: { lat: 48.5, lon: 135.0 },
    12: { lat: 48.5, lon: 135.0 }
  };
  return table[off] || { lat: 45, lon: off * 15 };
}
function getSunTimes(date) {
  const rad = Math.PI / 180;
  var region = _regionForTheme();
  const lat = region.lat * rad;
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = (date - start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60000);
  const doy = Math.floor(diff / 86400000);
  const B = 360 / 365 * (doy - 81) * rad;
  const eqTime = 9.87 * Math.sin(2*B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const decl = 23.45 * Math.sin(360 * (284 + doy) / 365 * rad) * rad;
  const cosH = -Math.tan(lat) * Math.tan(decl);
  if (cosH > 1 || cosH < -1) return null;
  const H = Math.acos(cosH) / rad;
  const noonUTC = 720 - 4 * region.lon - eqTime;
  const tzMin = -date.getTimezoneOffset();
  return { sunriseMin: noonUTC - 4*H + tzMin, sunsetMin: noonUTC + 4*H + tzMin };
}
function _clearInlinePalette() {
  const s = document.documentElement.style;
  ['--bg','--card','--card2','--accent','--accent2','--text','--muted','--border','--accent-rgb','--ripple'].forEach(v => s.removeProperty(v));
}
function applyTheme() {
  const t = state.settings.theme;
  _clearInlinePalette();
  function setMetaTheme(color) {
    var el = document.querySelector('meta[name=theme-color]');
    if (el) el.setAttribute('content', color);
  }
  if (t === 'mono') {
    document.documentElement.setAttribute('data-theme', 'mono');
    setMetaTheme('#0B0B0B');
  } else if (t === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    setMetaTheme('#F7F5EF');
  } else if (t === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    setMetaTheme('#050505');
  } else {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const times = getSunTimes(now);
    let isDark;
    if (times) {
      isDark = nowMin < times.sunriseMin || nowMin >= times.sunsetMin;
    } else {
      const h = now.getHours();
      isDark = (h >= 19 || h < 6);
    }
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    setMetaTheme(isDark ? '#050505' : '#F7F5EF');
  }
  document.querySelectorAll('#theme-seg button').forEach(b=>b.classList.toggle('active', b.dataset.theme===t));
}
function setTheme(t){ state.settings.theme=t; save(); applyTheme(); }
function setArSize(s) { state.settings.arSize=parseFloat(s); save(); document.documentElement.style.setProperty('--ar-scale',s); document.querySelectorAll('#size-seg button').forEach(b=>b.classList.toggle('active',parseFloat(b.dataset.size)===parseFloat(s))); }
function scheduleAutoTheme() {
  setTimeout(() => {
    if (state.settings.theme === 'auto') applyTheme();
    scheduleAutoTheme();
  }, 300000);
}

/* ---------- DATA: EXPORT / IMPORT / RESET ---------- */
function exportCSV() {
  var csv = 'Дата,Всего зикра,Детали (ID:кол-во)\n';
  var keys = Object.keys(state.history).sort();
  keys.forEach(function(k) {
    var data = state.history[k];
    var details = JSON.stringify(data.byId).replace(/"/g, "'");
    csv += '"' + k + '","' + data.total + '","' + details + '"\n';
  });
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'iqra-stats-' + todayKey() + '.csv';
  a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
  showMarkToast('Статистика сохранена');
  if (state.settings.vibrate && navigator.vibrate) navigator.vibrate(15);
}

function exportData() {
  const payload = Object.assign({}, state, {
    __schema: BACKUP_SCHEMA,
    __exportedAt: new Date().toISOString(),
    __appVersion: APP_VERSION
  });
  const data = JSON.stringify(payload, null, 2);
  const blob = new Blob([data], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'iqra-backup-' + todayKey() + '.json';
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
  showMarkToast('Бэкап сохранён');
  if (state.settings.vibrate && navigator.vibrate) navigator.vibrate(15);
}

/* ---------- IMPORT: ОЧИСТКА ВХОДНЫХ ДАННЫХ (v417) ----------
   Резервная копия — недоверенный ввод. Всё, что попадёт в state и затем в
   разметку, приводится к ожидаемым типам и диапазонам. */
function _impSafeId(id) { return (typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id)) ? id : null; }
function _impNumMap(raw) {
  const out = {};
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    Object.keys(raw).forEach(function (k) {
      const v = raw[k];
      if (_impSafeId(k) && typeof v === 'number' && isFinite(v) && v >= 0) out[k] = Math.min(Math.floor(v), 10000000);
    });
  }
  return out;
}
function sanitizeSettings(raw) {
  const src = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
  const base = defaultSettings();
  const num = function (v, min, max, d) { return (typeof v === 'number' && isFinite(v)) ? Math.min(max, Math.max(min, v)) : d; };
  const bool = function (v, d) { return typeof v === 'boolean' ? v : d; };
  const out = {};
  out.theme = ['auto', 'light', 'dark', 'mono'].indexOf(src.theme) >= 0 ? src.theme : base.theme;
  out.arSize = num(src.arSize, 0.8, 1.6, base.arSize);
  out.dailyGoal = Math.floor(num(src.dailyGoal, 0, 1000000, base.dailyGoal));
  ['autoNext', 'wakeLock', 'sound', 'vibrate', 'goalNotify'].forEach(function (k) { out[k] = bool(src[k], base[k]); });
  out.tajweedMode = bool(src.tajweedMode, false);
  const lr = src.lastRead;
  out.lastRead = (lr && typeof lr === 'object' && ['quran', 'dua', 'hadith'].indexOf(lr.type) >= 0 && _impSafeId(lr.id))
    ? { type: lr.type, id: lr.id, ts: (typeof lr.ts === 'number' && isFinite(lr.ts)) ? lr.ts : Date.now() } : null;
  out.lastScreen = (typeof src.lastScreen === 'string' && /^screen-[a-z0-9-]{1,40}$/.test(src.lastScreen)) ? src.lastScreen : null;
  out.readScrolls = _impNumMap(src.readScrolls);
  out.readAyah = _impNumMap(src.readAyah);
  return out;
}
function sanitizeReminders(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  raw.forEach(function (r) {
    if (out.length >= LIMITS.reminders || !r || typeof r !== 'object') return;
    const m = /^(\d{2}):(\d{2})$/.exec(String(r.time || ''));
    if (!m || +m[1] > 23 || +m[2] > 59) return;
    out.push({
      time: m[1] + ':' + m[2],
      on: r.on === true,
      lastFired: (typeof r.lastFired === 'string' && /^[0-9-]{0,10}$/.test(r.lastFired)) ? r.lastFired : '',
      message: String(r.message == null ? '' : r.message).slice(0, 200)
    });
  });
  return out;
}

function validateImport(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
  if (!Array.isArray(d.tasbihs)) return null;
  const safeId = (id) => (typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id)) ? id : null;
  const safe = {};
  safe.tasbihs = d.tasbihs.filter(t => t && typeof t === 'object' && typeof t.target === 'number' && isFinite(t.target) && t.target > 0).map(t => {
    const id = safeId(t.id);
    if (!id) return null;
    const clean = Object.assign({}, t);
    clean.id = id;
    clean.current = (typeof t.current === 'number' && isFinite(t.current) && t.current >= 0) ? Math.floor(t.current) : 0;
    clean.cycles = (typeof t.cycles === 'number' && isFinite(t.cycles) && t.cycles >= 0) ? Math.floor(t.cycles) : 0;
    return clean;
  }).filter(Boolean);
  safe.settings = sanitizeSettings(d.settings);
  safe.history = (d.history && typeof d.history === 'object' && !Array.isArray(d.history)) ? d.history : {};
  safe.reminders = sanitizeReminders(d.reminders);
  safe.duas = Array.isArray(d.duas) ? d.duas.filter(x => x && typeof x === 'object' && safeId(x.id)).map(x => { const c = Object.assign({}, x); c.id = safeId(x.id); return c; }) : [];
  safe.hadiths = Array.isArray(d.hadiths) ? d.hadiths.filter(x => x && typeof x === 'object' && safeId(x.id)).map(x => { const c = Object.assign({}, x); c.id = safeId(x.id); return c; }) : [];
  safe.migrations = (d.migrations && typeof d.migrations === 'object' && !Array.isArray(d.migrations)) ? d.migrations : {};
  safe.draft = (d.draft && typeof d.draft === 'object') ? d.draft : null;
  safe.favorites = Array.isArray(d.favorites) ? d.favorites.filter(x => safeId(x)) : [];
  safe.bookmarks = Array.isArray(d.bookmarks) ? d.bookmarks.filter(function(x){
    return x && typeof x === 'object' && safeId(x.id) && safeId(x.quranId)
           && typeof x.ayahIdx === 'number' && x.ayahIdx >= 0;
  }).map(function(x){
    var c = Object.assign({}, x);
    c.id = safeId(x.id); c.quranId = safeId(x.quranId); c.ayahIdx = Math.floor(x.ayahIdx);
    return c;
  }) : [];
  safe.quranLearned = {};
  if (Array.isArray(d.quran)) {
    d.quran.forEach(function (x) {
      if (x && typeof x === 'object' && safeId(x.id) && x.learned === true) {
        safe.quranLearned[x.id] = /^\d{4}-\d{2}-\d{2}$/.test(String(x.learnedAt || '')) ? x.learnedAt : '';
      }
    });
  }
  return safe;
}

function importData(e) {
  const f = e.target.files[0]; if (!f) return;
  if (f.size > 5 * 1024 * 1024) { alert('Файл слишком большой'); e.target.value = ''; return; }
  const r = new FileReader();
    r.onload = async () => {
    let parsed;
    try { parsed = JSON.parse(r.result); } catch(err) { alert('Файл повреждён'); e.target.value = ''; return; }
    const validated = validateImport(parsed);
    if (!validated) { alert('Файл не похож на резервную копию'); e.target.value = ''; return; }
    if (!await confirmAsync('Импорт данных?', 'Текущие данные будут полностью заменены.', 'Импортировать', 'Отмена')) { e.target.value = ''; return; }
    const quranLearned = validated.quranLearned || {};
    delete validated.quranLearned;
    const currentMigrations = state.migrations || {};
    const incomingMigrations = Object.assign({}, validated.migrations || {});
    delete incomingMigrations.onboarded;
    const mergedMigrations = Object.assign({}, currentMigrations, incomingMigrations);
    mergedMigrations.quran_v15 = true;
    mergedMigrations.quran_v16 = true;
    mergedMigrations.ruqyahGuideFix_v1 = false;
    mergedMigrations.ruqyahGuideFix_v2 = false;
    mergedMigrations.prophetTitleFix_v1 = false;
    state = Object.assign({}, state, validated);
    state.quran = JSON.parse(JSON.stringify(DEFAULT_QURAN));
    state.quran.forEach(function (q) {
      if (Object.prototype.hasOwnProperty.call(quranLearned, q.id)) { q.learned = true; q.learnedAt = quranLearned[q.id]; }
    });
    state.migrations = mergedMigrations;
    saveNow();
    state = load();
    applyTheme();
    setArSize(state.settings.arSize);
    renderDashboard();
    renderTasbih();
    renderDuaList();
    renderHadithList();
    renderQuranList();
    renderNightList();
    renderProgress();
    showScreen('screen-dashboard');
    showMarkToast('Импортировано');
    e.target.value = '';
  };
  r.readAsText(f);
}

async function resetAll() {
  if (!await confirmAsync('Удалить все данные?', 'Это необратимо. Резервную копию можно сохранить в Настройках перед сбросом.', 'Удалить всё', 'Отмена')) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('iqra_last_tasbih');
    localStorage.removeItem('iqra_install_dismissed');
    localStorage.removeItem('iqra_tajweed_cache');
    var _qk = Object.keys(localStorage).filter(function(k){ return k.indexOf('iqra_quote_') === 0 || k.indexOf('iqra_tajweed_') === 0; });
    _qk.forEach(function(k){ localStorage.removeItem(k); });
  } catch(e) {}
  location.reload();
}