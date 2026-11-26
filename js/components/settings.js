"use strict";

/* ============================================================
   SETTINGS.JS — Настройки, темы (sunrise/sunset), напоминания,
                 экспорт/импорт/сброс, дневная цель
   Проект «Икра» · v438
   ============================================================ */

/* ---------- OPEN SETTINGS ---------- */
function openSettings() {
  document.getElementById('daily-goal-input').value = state.settings.dailyGoal;
  document.getElementById('opt-autonext').checked = state.settings.autoNext;
  document.getElementById('opt-wake').checked = state.settings.wakeLock;
  document.getElementById('opt-vibrate').checked = state.settings.vibrate;
  document.getElementById('opt-goal-notify').checked = !!state.settings.goalNotify;
  var optAn = document.getElementById('opt-analytics');
  if (optAn) optAn.checked = state.settings.analytics !== false;
  document.querySelectorAll('#size-seg button').forEach(b=>b.classList.toggle('active', parseFloat(b.dataset.size)===state.settings.arSize));
  renderSettingsArchitecture();
  renderSmartReminderSettings();
  renderReminders();
  showScreen('screen-settings');
}

function renderSettingsArchitecture() {
  var methodSel = document.getElementById('prayer-method-select');
  var madhhabSel = document.getElementById('prayer-madhhab-select');
  var prefs = (state && state.settings && state.settings.prayerPrefs) || {};
  if (typeof IqraArchitecture !== 'undefined' && IqraArchitecture.IqraPrayer) {
    var P = IqraArchitecture.IqraPrayer;
    if (methodSel) {
      methodSel.innerHTML = P.METHODS.map(function (m) {
        return '<option value="' + escAttr(m.id) + '">' + esc(m.title) + '</option>';
      }).join('');
      methodSel.value = P.getMethod(prefs.method).id;
    }
    if (madhhabSel) {
      madhhabSel.innerHTML = P.ASR_MADHHABS.map(function (m) {
        return '<option value="' + escAttr(m.id) + '">' + esc(m.title) + '</option>';
      }).join('');
      madhhabSel.value = P.getAsrMadhhab(prefs.asrMadhhab).id;
    }
  }
  var plansSlot = document.getElementById('plans-overview-slot');
  if (plansSlot && typeof IqraArchitecture !== 'undefined') {
    var freeCaps = IqraArchitecture.listCapabilities(IqraArchitecture.TIERS.FREE);
    var plusCaps = IqraArchitecture.listCapabilities(IqraArchitecture.TIERS.IQRA_PLUS);
    var renderCapList = function (list) {
      return '<ul class="plan-cap-list">' + list.map(function (c) {
        return '<li class="plan-cap-item"><div class="pci-title">' + esc(c.title) + '</div><div class="pci-sub">' + esc(c.summary) + '</div></li>';
      }).join('') + '</ul>';
    };
    plansSlot.innerHTML =
      '<div class="plan-block">' +
        '<div class="plan-head"><div class="plan-name">Бесплатно навсегда</div><span class="plan-status plan-status--active">Активно</span></div>' +
        '<div class="plan-desc">Священный Коран, таджвид, тафсиры, хадисы, дуа, тасбих и Умная книга остаются полностью бесплатными и работают офлайн.</div>' +
        renderCapList(freeCaps) +
      '</div>' +
      '<div class="plan-block plan-block--future">' +
        '<div class="plan-head"><div class="plan-name">Икра+ (готовится)</div><span class="plan-status">В разработке</span></div>' +
        '<div class="plan-desc">Опциональные инструменты обучения с нуля, планирования, трекера Када, постов Сунны, энциклопедии, дневника и облачного бэкапа. Тексты Корана и Сунны и подсветка таджвида при чтении навсегда остаются бесплатными.</div>' +
        renderCapList(plusCaps) +
      '</div>';
  }
}

function setPrayerPref(field, val) {
  if (!state || !state.settings) return;
  var cur = Object.assign({}, state.settings.prayerPrefs || {});
  cur[field] = val;
  if (typeof IqraArchitecture !== 'undefined' && IqraArchitecture.IqraPrayer) {
    state.settings.prayerPrefs = IqraArchitecture.IqraPrayer.normalizeLocation(cur);
  } else {
    state.settings.prayerPrefs = cur;
  }
  save();
}

function setDailyGoal(v) { state.settings.dailyGoal = Math.max(0, Math.min(1000000, parseInt(v)||0)); save(); }
function setAnalyticsPref(v) {
  if (!state || !state.settings) return;
  state.settings.analytics = !!v;
  saveNow();
  if (typeof showMarkToast === 'function') {
    showMarkToast(state.settings.analytics ? 'Обезличенная статистика включена' : 'Обезличенная статистика отключена');
  }
}

/* ---------- SMART REMINDERS SETTINGS ---------- */
function _ensureSmartPrefs() {
  if (!state || !state.settings) return null;
  if (typeof IqraSmartReminders !== 'undefined') {
    state.settings.smartReminders = IqraSmartReminders.sanitizePrefs(state.settings.smartReminders);
  } else if (!state.settings.smartReminders || typeof state.settings.smartReminders !== 'object') {
    state.settings.smartReminders = {
      enabled: true, browserNotify: false, quietStart: '23:00', quietEnd: '05:00',
      categories: { adhkar: true, night: true, friday: true, motivation: true },
      mutedDate: '', dismissed: {}, notified: {}
    };
  }
  return state.settings.smartReminders;
}

function renderSmartReminderSettings() {
  var prefs = _ensureSmartPrefs();
  if (!prefs) return;
  var enEl = document.getElementById('opt-smart-enabled');
  if (enEl) enEl.checked = !!prefs.enabled;

  var nfEl = document.getElementById('opt-smart-notify');
  if (nfEl) nfEl.checked = !!prefs.browserNotify;

  var qsEl = document.getElementById('smart-quiet-start');
  if (qsEl) qsEl.value = prefs.quietStart || '23:00';
  var qeEl = document.getElementById('smart-quiet-end');
  if (qeEl) qeEl.value = prefs.quietEnd || '05:00';

  ['adhkar', 'night', 'friday', 'motivation'].forEach(function (cat) {
    var cb = document.getElementById('opt-smart-cat-' + cat);
    if (cb) cb.checked = !!(prefs.categories && prefs.categories[cat]);
  });

  var wrapEl = document.getElementById('smart-reminders-controls');
  if (wrapEl) {
    wrapEl.style.opacity = prefs.enabled ? '1' : '0.55';
  }

  var statusEl = document.getElementById('smart-notify-status');
  if (statusEl) {
    if (!('Notification' in window)) {
      statusEl.textContent = 'Браузерные уведомления недоступны в этом окружении (тихая карточка на главной продолжит работать).';
    } else if (Notification.permission === 'denied') {
      statusEl.textContent = 'Уведомления заблокированы в настройках браузера или системы.';
    } else if (prefs.browserNotify && Notification.permission === 'granted') {
      statusEl.textContent = 'Разрешено · срабатывает не чаще раза в окно, вне тихих часов.';
    } else {
      statusEl.textContent = 'Ненавязчивое уведомление браузера (по одному на окно времени).';
    }
  }

  var unmuteRow = document.getElementById('smart-unmute-row');
  if (unmuteRow) {
    unmuteRow.style.display = (prefs.mutedDate && prefs.mutedDate === todayKey()) ? 'flex' : 'none';
  }
}

function setSmartReminderEnabled(v) {
  var prefs = _ensureSmartPrefs();
  if (!prefs) return;
  prefs.enabled = !!v;
  save();
  renderSmartReminderSettings();
  if (typeof renderDashboard === 'function') renderDashboard();
}

function setSmartReminderNotify(v) {
  var prefs = _ensureSmartPrefs();
  if (!prefs) return;
  if (!v) {
    prefs.browserNotify = false;
    save();
    renderSmartReminderSettings();
    return;
  }
  if (!('Notification' in window)) {
    prefs.browserNotify = false;
    save();
    renderSmartReminderSettings();
    if (typeof showMarkToast === 'function') showMarkToast('Уведомления браузера не поддерживаются здесь');
    return;
  }
  if (Notification.permission === 'granted') {
    prefs.browserNotify = true;
    save();
    renderSmartReminderSettings();
    if (typeof checkReminders === 'function') checkReminders();
    return;
  }
  if (Notification.permission === 'denied') {
    prefs.browserNotify = false;
    save();
    renderSmartReminderSettings();
    if (typeof showMarkToast === 'function') showMarkToast('Разрешите уведомления в настройках браузера', 3200);
    return;
  }
  try {
    var req = Notification.requestPermission();
    if (req && typeof req.then === 'function') {
      req.then(function (perm) {
        prefs.browserNotify = (perm === 'granted');
        save();
        renderSmartReminderSettings();
        if (prefs.browserNotify && typeof checkReminders === 'function') checkReminders();
      }).catch(function () {
        prefs.browserNotify = false;
        save();
        renderSmartReminderSettings();
      });
    }
  } catch (e) {
    prefs.browserNotify = false;
    save();
    renderSmartReminderSettings();
  }
}

function setSmartReminderCategory(cat, v) {
  var prefs = _ensureSmartPrefs();
  if (!prefs || !prefs.categories) return;
  if (Object.prototype.hasOwnProperty.call(prefs.categories, cat)) {
    prefs.categories[cat] = !!v;
    save();
    if (typeof renderDashboard === 'function') renderDashboard();
  }
}

function setSmartReminderQuiet(field, v) {
  var prefs = _ensureSmartPrefs();
  if (!prefs) return;
  if (!/^\d{2}:\d{2}$/.test(String(v || ''))) return;
  if (field === 'start') prefs.quietStart = v;
  else if (field === 'end') prefs.quietEnd = v;
  save();
  if (typeof renderDashboard === 'function') renderDashboard();
}

function unmuteSmartRemindersToday() {
  var prefs = _ensureSmartPrefs();
  if (!prefs) return;
  prefs.mutedDate = '';
  prefs.dismissed = {};
  save();
  renderSmartReminderSettings();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof showMarkToast === 'function') showMarkToast('Умные напоминания снова активны');
}

/* ---------- REMINDERS ---------- */
function renderReminders() {
  const el = document.getElementById('reminders-list');
  if (!el) return;
  if (!state.reminders.length) {
    el.innerHTML = `<div style="padding:14px 16px;color:var(--muted);font-size:13px">Пока нет напоминаний</div>`;
    return;
  }
  el.innerHTML = state.reminders.map((r, i) =>
    `<div class="reminder-row"><div class="rr-top"><input type="time" value="${esc(r.time)}" onchange="updateReminderField(${i},'time',this.value)"><label class="toggle"><input type="checkbox" ${r.on ? 'checked' : ''} onchange="toggleReminder(${i}, this.checked)"><span class="slider"></span></label><button class="del" onclick="deleteReminder(${i})" aria-label="Удалить"><svg class="ico ico-sm"><use href="#i-x"/></svg></button></div><input type="text" value="${esc(r.message || '')}" placeholder="Сообщение (необязательно)" maxlength="200" onchange="updateReminderField(${i},'message',this.value)"></div>`
  ).join('');
}
function addReminder() {
  if (state.reminders.length >= LIMITS.reminders) { showMarkToast('Максимум ' + LIMITS.reminders + ' напоминаний', 3200); return; }
  const t = document.getElementById('new-reminder-time').value;
  const mi = document.getElementById('new-reminder-msg');
  const msg = (mi ? mi.value : '').trim().slice(0, 200);
  if (!t || !/^\d{2}:\d{2}$/.test(t)) { showMarkToast('Укажите корректное время ЧЧ:ММ', 2600); return; }
  state.reminders.push({ time: t, on: true, lastFired: '', message: msg });
  if (mi) mi.value = '';
  save(); renderReminders(); showMarkToast('Напоминание добавлено');
  if ('Notification' in window && Notification.permission === 'default') {
    try { const p = Notification.requestPermission(); if (p && typeof p.catch === 'function') p.catch(function () {}); } catch (e) {}
  }
}
function setReminderPreset(hhmm, msg) {
  if (!/^\d{2}:\d{2}$/.test(String(hhmm || ''))) return;
  var cleanMsg = String(msg || '').trim().slice(0, 200);
  var existing = state.reminders.find(function (r) { return r && r.time === hhmm; });
  if (existing) {
    existing.on = true;
    if (cleanMsg && !existing.message) existing.message = cleanMsg;
    showMarkToast('Напоминание на ' + hhmm + ' включено');
  } else {
    if (state.reminders.length >= LIMITS.reminders) {
      showMarkToast('Максимум ' + LIMITS.reminders + ' напоминаний', 3200);
      return;
    }
    state.reminders.push({ time: hhmm, on: true, lastFired: '', message: cleanMsg });
    showMarkToast('Добавлено напоминание на ' + hhmm);
  }
  save();
  renderReminders();
  if ('Notification' in window && Notification.permission === 'default') {
    try { const p = Notification.requestPermission(); if (p && typeof p.catch === 'function') p.catch(function () {}); } catch (e) {}
  }
}
function testReminderNotification() {
  var msg = 'Время зикра и чтения Корана (тестовое напоминание)';
  if (typeof showReminderToastBanner === 'function') {
    showReminderToastBanner(msg, { type: 'tab', id: 'tasbih' });
  } else if (typeof showMarkToast === 'function') {
    showMarkToast(msg, 3500);
  }
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      try { new Notification('Iqra | Читай', { body: msg }); } catch (e) {}
    } else if (Notification.permission === 'default') {
      try {
        Notification.requestPermission().then(function (perm) {
          if (perm === 'granted') {
            try { new Notification('Iqra | Читай', { body: msg }); } catch (e) {}
          }
        }).catch(function () {});
      } catch (e) {}
    }
  }
}
function updateReminderField(i, field, v) { if (field === 'time') { if (!/^\d{2}:\d{2}$/.test(v)) return; state.reminders[i].time = v; } else if (field === 'message') { state.reminders[i].message = String(v || '').trim().slice(0, 200); } save(); }
function toggleReminder(i, v) { state.reminders[i].on = v; save(); }
function deleteReminder(i) { state.reminders.splice(i, 1); save(); renderReminders(); }

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
  document.querySelectorAll('#theme-seg button').forEach(b=>b.classList.toggle('active', b.dataset.themeOpt===t));
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
  var base = (typeof serializeCompactState === 'function') ? serializeCompactState(state) : Object.assign({}, state);
  const payload = Object.assign({}, base, {
    __schema: BACKUP_SCHEMA,
    __exportedAt: new Date().toISOString()
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

/* ---------- IMPORT: ОЧИСТКА ВХОДНЫХ ДАННЫХ (v450) ----------
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
function _impBoolMap(raw) {
  const out = {};
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    Object.keys(raw).forEach(function (k) {
      if (_impSafeId(k) && raw[k] === true) out[k] = true;
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
  ['autoNext', 'wakeLock', 'vibrate', 'goalNotify'].forEach(function (k) { out[k] = bool(src[k], base[k]); });
  out.tajweedMode = bool(src.tajweedMode, false);
  out.analytics = bool(src.analytics, true);
  const lr = src.lastRead;
  out.lastRead = (lr && typeof lr === 'object' && ['quran', 'dua', 'hadith'].indexOf(lr.type) >= 0 && _impSafeId(lr.id))
    ? { type: lr.type, id: lr.id, ts: (typeof lr.ts === 'number' && isFinite(lr.ts)) ? lr.ts : Date.now() } : null;
  out.lastScreen = (typeof src.lastScreen === 'string' && /^screen-[a-z0-9-]{1,40}$/.test(src.lastScreen)) ? src.lastScreen : null;
  out.readScrolls = _impNumMap(src.readScrolls);
  out.readAyah = _impNumMap(src.readAyah);
  out.seenGuides = _impBoolMap(src.seenGuides);
  const rp = (src.readerPrefs && typeof src.readerPrefs === 'object' && !Array.isArray(src.readerPrefs)) ? src.readerPrefs : {};
  out.readerPrefs = {
    showTranscription: bool(rp.showTranscription, base.readerPrefs.showTranscription),
    pageBatch: Math.floor(num(rp.pageBatch, 10, 200, base.readerPrefs.pageBatch))
  };
  if (typeof IqraArchitecture !== 'undefined' && IqraArchitecture.IqraPrayer) {
    out.prayerPrefs = IqraArchitecture.IqraPrayer.normalizeLocation(src.prayerPrefs);
  } else {
    out.prayerPrefs = Object.assign({}, base.prayerPrefs);
  }
  const sp = (src.syncPrefs && typeof src.syncPrefs === 'object' && !Array.isArray(src.syncPrefs)) ? src.syncPrefs : {};
  out.syncPrefs = {
    autoBackupHint: bool(sp.autoBackupHint, false),
    lastLocalSyncAt: Math.floor(num(sp.lastLocalSyncAt, 0, 9999999999999, 0))
  };
  if (typeof IqraSmartReminders !== 'undefined') {
    out.smartReminders = IqraSmartReminders.sanitizePrefs(src.smartReminders);
  } else {
    out.smartReminders = base.smartReminders;
  }
  const nc = (src.nightChecklist && typeof src.nightChecklist === 'object' && !Array.isArray(src.nightChecklist)) ? src.nightChecklist : {};
  out.nightChecklist = {
    date: (typeof nc.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(nc.date)) ? nc.date : '',
    done: Array.isArray(nc.done) ? nc.done.filter(function (n) { return typeof n === 'number' && isFinite(n) && n >= 0 && n < 50; }).map(Math.floor).slice(0, 50) : []
  };
  const allowedWidgets = ['goal_ring', 'night_check', 'mini_tasbih', 'daily_dhikr'];
  const wp = (src.widgetPrefs && typeof src.widgetPrefs === 'object' && !Array.isArray(src.widgetPrefs)) ? src.widgetPrefs : {};
  out.widgetPrefs = {
    enabled: Array.isArray(wp.enabled) ? wp.enabled.filter(function (w) { return allowedWidgets.indexOf(w) !== -1; }).slice(0, 8) : allowedWidgets.slice()
  };
  return out;
}
/* История зикра: { 'ГГГГ-ММ-ДД': { total, byId: { id: число } } }.
   Приложение читает entry.total и entry.byId без проверок, поэтому структура приводится к ожидаемой. */
function sanitizeHistory(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  const keys = Object.keys(raw).filter(function (k) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(k);
    return m && +m[2] >= 1 && +m[2] <= 12 && +m[3] >= 1 && +m[3] <= 31;
  }).sort();
  keys.slice(-LIMITS.historyDays).forEach(function (k) {
    const e = raw[k];
    if (!e || typeof e !== 'object' || Array.isArray(e)) return;
    const byId = _impNumMap(e.byId);
    let total = (typeof e.total === 'number' && isFinite(e.total) && e.total >= 0) ? Math.min(Math.floor(e.total), 10000000) : -1;
    if (total < 0) {
      total = 0;
      Object.keys(byId).forEach(function (id) { total += byId[id]; });
    }
    out[k] = { total: total, byId: byId };
  });
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

function _stripUnsafeImportKeys(val, depth) {
  if (val === null || typeof val !== 'object') return val;
  if ((depth || 0) > 40) return undefined;
  if (Array.isArray(val)) return val.map(function (x) { return _stripUnsafeImportKeys(x, (depth || 0) + 1); });
  const out = {};
  Object.keys(val).forEach(function (k) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') return;
    out[k] = _stripUnsafeImportKeys(val[k], (depth || 0) + 1);
  });
  return out;
}

function _impCleanStr(val, maxLen) {
  return typeof val === 'string' ? val.slice(0, maxLen || 2000) : '';
}

function _impCleanTags(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter(function (x) { return typeof x === 'string'; }).map(function (x) { return x.slice(0, 80); }).slice(0, 30);
}

function validateImport(rawInput) {
  const d = _stripUnsafeImportKeys(rawInput, 0);
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
  if (!Array.isArray(d.tasbihs)) return null;
  const safeId = (id) => (typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id)) ? id : null;
  const safe = {};
  safe.tasbihs = d.tasbihs.slice(0, LIMITS.tasbihs).filter(t => t && typeof t === 'object' && typeof t.target === 'number' && isFinite(t.target) && t.target > 0).map(t => {
    const id = safeId(t.id);
    if (!id) return null;
    const target = Math.min(LIMITS.targetMax, Math.max(1, Math.floor(t.target)));
    return {
      id: id,
      arabic: _impCleanStr(t.arabic, 2000),
      transcription: _impCleanStr(t.transcription, 1000),
      translation: _impCleanStr(t.translation, 2000),
      dalil: _impCleanStr(t.dalil, 4000),
      target: target,
      current: (typeof t.current === 'number' && isFinite(t.current) && t.current >= 0) ? Math.min(LIMITS.targetMax, Math.floor(t.current)) : 0,
      cycles: (typeof t.cycles === 'number' && isFinite(t.cycles) && t.cycles >= 0) ? Math.min(LIMITS.cyclesMax, Math.floor(t.cycles)) : 0,
      custom: t.custom === true
    };
  }).filter(Boolean);
  safe.settings = sanitizeSettings(d.settings);
  safe.history = sanitizeHistory(d.history);
  safe.reminders = sanitizeReminders(d.reminders);
  safe.duas = Array.isArray(d.duas) ? d.duas.slice(0, 500).filter(x => x && typeof x === 'object' && safeId(x.id)).map(x => ({
    id: safeId(x.id),
    title: _impCleanStr(x.title, 300),
    subtitle: _impCleanStr(x.subtitle, 400),
    arabic: _impCleanStr(x.arabic, 4000),
    transcription: _impCleanStr(x.transcription, 4000),
    translation: _impCleanStr(x.translation, 4000),
    note: _impCleanStr(x.note, 6000),
    source: _impCleanStr(x.source, 600),
    tags: _impCleanTags(x.tags),
    learned: x.learned === true
  })) : [];
  safe.hadiths = Array.isArray(d.hadiths) ? d.hadiths.slice(0, 500).filter(x => x && typeof x === 'object' && safeId(x.id)).map(x => ({
    id: safeId(x.id),
    title: _impCleanStr(x.title, 300),
    subtitle: _impCleanStr(x.subtitle, 400),
    arabic: _impCleanStr(x.arabic, 4000),
    transcription: _impCleanStr(x.transcription, 4000),
    translation: _impCleanStr(x.translation, 4000),
    note: _impCleanStr(x.note, 6000),
    source: _impCleanStr(x.source, 600),
    tags: _impCleanTags(x.tags),
    learned: x.learned === true
  })) : [];
  safe.migrations = _impBoolMap(d.migrations);
  safe.draft = (d.draft && typeof d.draft === 'object' && !Array.isArray(d.draft))
    ? {
        arabic: _impCleanStr(d.draft.arabic, 2000),
        transcription: _impCleanStr(d.draft.transcription, 1000),
        translation: _impCleanStr(d.draft.translation, 2000),
        target: (typeof d.draft.target === 'number' && isFinite(d.draft.target) && d.draft.target > 0)
          ? Math.min(LIMITS.targetMax, Math.floor(d.draft.target))
          : 33
      }
    : null;
  safe.favorites = Array.isArray(d.favorites) ? d.favorites.slice(0, 1000).filter(x => safeId(x)) : [];
  safe.bookmarks = Array.isArray(d.bookmarks) ? d.bookmarks.slice(0, 200).filter(function (x) {
    return x && typeof x === 'object' && safeId(x.id) && safeId(x.quranId)
      && typeof x.ayahIdx === 'number' && isFinite(x.ayahIdx) && x.ayahIdx >= 0;
  }).map(function (x) {
    return {
      id: safeId(x.id),
      quranId: safeId(x.quranId),
      ayahIdx: Math.min(300, Math.floor(x.ayahIdx)),
      label: _impCleanStr(x.label, 80),
      ts: (typeof x.ts === 'number' && isFinite(x.ts) && x.ts >= 0) ? Math.floor(x.ts) : Date.now()
    };
  }) : [];
  safe.quranLearned = {};
  if (d.quranProgress && typeof d.quranProgress === 'object' && !Array.isArray(d.quranProgress)) {
    Object.keys(d.quranProgress).forEach(function (id) {
      var val = d.quranProgress[id];
      if (safeId(id) && val && typeof val === 'object' && val.learned === true) {
        safe.quranLearned[id] = /^\d{4}-\d{2}-\d{2}$/.test(String(val.learnedAt || '')) ? val.learnedAt : '';
      }
    });
  }
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
  if (f.size > 8 * 1024 * 1024) { showMarkToast('Файл слишком большой', 3200); e.target.value = ''; return; }
  const r = new FileReader();
  r.onload = async () => {
    let parsed;
    try { parsed = JSON.parse(r.result); } catch(err) { showMarkToast('Файл повреждён', 3200); e.target.value = ''; return; }
    const validated = validateImport(parsed);
    if (!validated) { showMarkToast('Файл не похож на резервную копию', 3200); e.target.value = ''; return; }
    if (!await confirmAsync('Импорт данных?', 'Текущие данные будут полностью заменены.', 'Импортировать', 'Отмена')) { e.target.value = ''; return; }
    const quranLearned = validated.quranLearned || {};
    delete validated.quranLearned;
    const currentMigrations = state.migrations || {};
    const incomingMigrations = Object.assign({}, validated.migrations || {});
    delete incomingMigrations.onboarded;
    const mergedMigrations = Object.assign({}, currentMigrations, incomingMigrations);
    mergedMigrations.quran_v15 = true;
    mergedMigrations.quran_v16 = true;
    mergedMigrations.compactQuran_v1 = true;
    mergedMigrations.ruqyahGuideFix_v1 = false;
    mergedMigrations.ruqyahGuideFix_v2 = false;
    mergedMigrations.prophetTitleFix_v1 = false;
    state = Object.assign({}, state, validated);
    var progressMap = {};
    Object.keys(quranLearned).forEach(function (id) {
      progressMap[id] = { learned: true, learnedAt: quranLearned[id] };
    });
    state.quranProgress = progressMap;
    state.quran = (typeof hydrateQuranFromProgress === 'function')
      ? hydrateQuranFromProgress(progressMap)
      : JSON.parse(JSON.stringify(DEFAULT_QURAN));
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
    localStorage.removeItem('iqra_sync_remote_stub');
    var _qk = [];
    for (var _ri = 0; _ri < localStorage.length; _ri++) {
      var _rk = localStorage.key(_ri);
      if (_rk && (_rk.indexOf('iqra_quote_') === 0 || _rk.indexOf('iqra_tajweed') === 0)) _qk.push(_rk);
    }
    _qk.forEach(function(k){ localStorage.removeItem(k); });
  } catch(e) {}
  location.reload();
}