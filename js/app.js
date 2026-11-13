"use strict";

/* ============================================================
   APP.JS — Точка входа, навигация, UI-ядро, SW, PWA, debug
   Проект «Икра» · v387 (Этап 3.5)
   D-10: добавлена escapeHtml(); аудит innerHTML проведён —
   все места с пользовательскими/внешними данными используют
   esc() / escNl() / escapeHtml() из storage.js.
   ============================================================ */

/* ---------- XSS: escape helper (D-10) ---------- */
function escapeHtml(s) {
  if (typeof esc === 'function') return esc(s);
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
    return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c];
  });
}

/* ---------- iOS DETECTION ---------- */
(function(){
  var ua = navigator.userAgent || '';
  var isIOS = /iPad|iPhone|iPod/.test(ua)
           || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) document.documentElement.classList.add('is-ios');
})();

/* ---------- ANDROID VIEWPORT HEIGHT FIX ---------- */
(function fixAndroidViewportHeight(){
  if (document.documentElement.classList.contains('is-ios')) return;
  function syncHeight(){
    if (!document.body) return;
    document.body.style.height = window.innerHeight + 'px';
  }
  window.addEventListener('resize', syncHeight, { passive: true });
  window.addEventListener('orientationchange', syncHeight, { passive: true });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncHeight);
  } else {
    syncHeight();
  }
  window.addEventListener('load', syncHeight);
  setTimeout(syncHeight, 50);
})();

/* ---------- GLOBAL STATE ---------- */
let activeId = null, editingId = null;
let activeDuaId = null, activeQuranId = null, activeHadithId = null, activeNightId = null;
let quranFilter = 'all';
let activeReadId = null;
let _lastScreenName = null, _lastScreenTs = null;
let _searchShowAll = false;
let searchFilters = { type: 'all', status: 'all', favorite: 'all' };
let obStep = 0; const OB_TOTAL = 4;
let deferredPrompt = null;
let memorizeItem = null, memorizeAyahs = [], memorizeStep = 0;
let memorizePhase = 'learn', memorizeRevealed = false;
let calDate = new Date();
let progTab = 'overview';
let wakeLock = null, nextToastTimer = null, audioCtx = null;
let dragEl = null, dragId = null, dragHoldTimer = null, suppressNextClick = false;
let activePathTag = null;
let pathShowAll = false;
let _dashQuote = null;
var _toastTimer = null;
let _pendingConfirmResolve = null;
let _reminderTimer = null;
let _progFilter = '';

/* ---------- AUDIO ---------- */
function ensureAudio(){ try { if (!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)(); if (audioCtx.state==='suspended') audioCtx.resume(); } catch(e){} }
function playClick() { if (!state.settings.sound) return; ensureAudio(); if (!audioCtx) return; const t=audioCtx.currentTime; const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.type='sine'; o.frequency.setValueAtTime(680,t); o.frequency.exponentialRampToValueAtTime(420,t+0.05); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.08,t+0.005); g.gain.exponentialRampToValueAtTime(0.0001,t+0.09); o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t+0.1); }
function playChime() { if (!state.settings.sound) return; ensureAudio(); if (!audioCtx) return; const t=audioCtx.currentTime; [660,880].forEach((f,i)=>{ const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.type='sine'; o.frequency.value=f; g.gain.setValueAtTime(0.0001,t+i*0.08); g.gain.exponentialRampToValueAtTime(0.06,t+i*0.08+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+i*0.08+0.5); o.connect(g).connect(audioCtx.destination); o.start(t+i*0.08); o.stop(t+i*0.08+0.55); }); }

/* ---------- WAKELOCK ---------- */
async function requestWakeLock() { try { if ('wakeLock' in navigator) { wakeLock=await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release',()=>{wakeLock=null;}); } } catch(e){} }
function releaseWakeLock() { try { if (wakeLock) { wakeLock.release(); wakeLock=null; } } catch(e){} }

/* ---------- REMINDERS ---------- */
function checkReminders() {
  if (document.visibilityState !== 'visible') return;
  const now = new Date();
  const hh = pad(now.getHours()) + ':' + pad(now.getMinutes());
  const k = todayKey();
  state.reminders.forEach(r => {
    if (!r.on) return;
    if (r.time === hh && r.lastFired !== k) {
      r.lastFired = k; save();
      if ('Notification' in window && Notification.permission === 'granted') {
        try { new Notification('Iqra | Читай', { body: r.message || 'Время зикра' }); } catch(e) {}
      }
    }
  });
}
function scheduleReminders() {
  if (_reminderTimer) clearTimeout(_reminderTimer);
  _reminderTimer = setTimeout(() => { checkReminders(); scheduleReminders(); }, 60000);
}

/* ---------- TOAST ---------- */
function showMarkToast(text) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = text;
  el.classList.add('show');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function(){ el.classList.remove('show'); }, 1800);
}

/* ---------- MODAL / CONFIRM ---------- */
function closeModal() { 
  document.getElementById('modal-bg').classList.remove('active'); 
  if (_pendingConfirmResolve) {
    const r = _pendingConfirmResolve;
    _pendingConfirmResolve = null;
    r(false);
  }
}
function confirmAsync(title, sub, okText, cancelText) {
  return new Promise(function(resolve) {
    okText = okText || 'Подтвердить';
    cancelText = cancelText || 'Отмена';
    var html = '<h2>' + escapeHtml(title) + '</h2>' +
      (sub ? '<div style="font-size:14px;color:var(--muted);margin-bottom:20px;line-height:1.5">' + escNl(sub) + '</div>' : '') +
      '<div style="display:flex;gap:10px;">' +
        '<button class="btn secondary" id="cf-cancel" style="flex:1;margin:0;">' + escapeHtml(cancelText) + '</button>' +
        '<button class="btn" id="cf-ok" style="flex:1;margin:0;">' + escapeHtml(okText) + '</button>' +
      '</div>';
    var modal = document.getElementById('modal-content');
    modal.innerHTML = html;
    document.getElementById('modal-bg').classList.add('active');
    
    function done(v) {
      if (state.settings.vibrate && navigator.vibrate) navigator.vibrate(10);
      _pendingConfirmResolve = null;
      var bg = document.getElementById('modal-bg');
      bg.onclick = null;
      bg.classList.remove('active');
      resolve(v);
    }
    _pendingConfirmResolve = done;
    
    document.getElementById('cf-ok').onclick = function(){ done(true); };
    document.getElementById('cf-cancel').onclick = function(){ done(false); };
    var bg = document.getElementById('modal-bg');
    bg.onclick = function(e){ if (e.target === bg) done(false); };
  });
}

function openDay(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
  const entry = state.history[key]; const [y,m,d] = key.split('-');
  let html = `<h2>${escapeHtml(d)}.${escapeHtml(m)}.${escapeHtml(y)}</h2><div style="font-size:13px;color:var(--muted);margin-bottom:16px">${escapeHtml(formatHijri(new Date(+y, +m - 1, +d)))}</div>`;
  if (!entry || !entry.total) html += `<div style="color:var(--muted);padding:20px 0;text-align:center">В этот день счёта не было</div>`;
  else { for (const [tid,cnt] of Object.entries(entry.byId)) { const t=getById(tid); const name=t?(t.transcription||t.arabic):'Удалённый тасбих'; html += `<div class="modal-row"><span>${escapeHtml(name)}</span><span class="num">${escapeHtml(cnt)}</span></div>`; } html += `<div class="modal-total"><span>Всего</span><span class="num">${escapeHtml(entry.total)}</span></div>`; }
  html += `<button class="btn secondary" style="margin-top:20px" onclick="closeModal()">Закрыть</button>`;
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-bg').classList.add('active');
}

/* ---------- NAVIGATION ---------- */
function showScreen(id) {
  if (_lastScreenName && _lastScreenTs) {
    const dur = Math.round((Date.now() - _lastScreenTs) / 1000);
    if (dur >= 2) trackEvent('duration/' + _lastScreenName, 'Экран ' + _lastScreenName + ': ' + dur + ' сек');
  }
  _lastScreenName = id; _lastScreenTs = Date.now();
  state.settings.lastScreen = id; save();
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const nav = document.getElementById('nav');
  const tabs = ['screen-dashboard','screen-tasbih','screen-quran','screen-night','screen-dua','screen-hadith','screen-cal','screen-path','screen-library'];
  nav.style.display = tabs.includes(id) ? 'flex' : 'none';
  if (id==='screen-dashboard') setNav('dashboard');
  if (id==='screen-tasbih') setNav('tasbih');
  if (id==='screen-quran') setNav('quran');
  if (id==='screen-night') setNav('night');
  if (id==='screen-dua') setNav('dua');
  if (id==='screen-hadith') setNav('hadith');
  if (id==='screen-cal') setNav('cal');
  if (id==='screen-path') setNav('path');
  if (id==='screen-library') setNav('library');
  window.scrollTo(0,0);
  saveNavContext();
}
function setNav(tab) { document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab)); }
function setLibraryTab(tab) {
  document.getElementById('lib-tab-dua').classList.toggle('active', tab === 'dua');
  document.getElementById('lib-tab-hadith').classList.toggle('active', tab === 'hadith');
  document.getElementById('library-dua-list').style.display = tab === 'dua' ? 'flex' : 'none';
  document.getElementById('library-hadith-list').style.display = tab === 'hadith' ? 'flex' : 'none';
  if (tab === 'dua') renderDuaList();
  else renderHadithList();
}
async function switchTab(tab) {
  trackEvent('tab/' + tab, 'Вкладка: ' + tab);
  if (state.settings.vibrate && navigator.vibrate) navigator.vibrate(10);

  if (tab === 'dashboard') {
    renderDashboard();
    showScreen('screen-dashboard');
  }
  else if (tab === 'tasbih') {
    renderTasbih();
    showScreen('screen-tasbih');
  }
  else if (tab === 'quran') {
    setQuranFilter('all');
    showScreen('screen-quran');
  }
   else if (tab === 'path') {
    activePathTag = null;
    pathShowAll = false;
    const inp = document.getElementById('path-search');
    if (inp) inp.value = '';
    renderPath();
    showScreen('screen-path');
  }
  else if (tab === 'library') {
    setLibraryTab('dua');
    showScreen('screen-library');
  }
  else if (tab === 'cal') {
    calDate = new Date();
    renderProgress();
    showScreen('screen-cal');
  }
}

function saveNavContext() {
  var activeScreenEl = document.querySelector('.screen.active');
  var ctx = {
    screen: activeScreenEl ? activeScreenEl.id : 'screen-dashboard',
    quranId: activeQuranId || null,
    duaId: activeDuaId || null,
    hadithId: activeHadithId || null,
    tasbihId: activeId || null,
    nightId: (typeof activeNightId === 'number') ? activeNightId : null,
    readId: (typeof activeReadId !== 'undefined' && activeReadId) ? activeReadId : null,
    readOpen: !!(document.getElementById('read-mode') && document.getElementById('read-mode').classList.contains('active')),
    memOpen: !!(document.getElementById('memorize-mode') && document.getElementById('memorize-mode').classList.contains('active')),
    memId: memorizeItem ? memorizeItem.id : null,
    memStep: memorizeStep || 0,
    memPhase: memorizePhase || 'learn'
  };
  state.settings.lastScreen = ctx.screen;
  state.settings.lastScreenContext = ctx;
  save();
}

function restoreNav() {
  renderDashboard();
  showScreen('screen-dashboard');
}

function goHome() { if (activeId) saveNow(); activeId=null; releaseWakeLock(); renderDashboard(); showScreen('screen-dashboard'); }

/* ---------- DEBUG ---------- */
function initDebugMode() {
  try {
    if (new URLSearchParams(location.search).get('debug') === '1') {
      var fab = document.getElementById('debug-fab');
      if (fab) fab.classList.add('visible');
    }
  } catch(e) {}
}
function showDebugResult(text) {
  var ov = document.getElementById('debug-overlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'debug-overlay';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-label', 'Диагностика таджвида');
    var pre = document.createElement('pre');
    pre.id = 'debug-output';
    ov.appendChild(pre);
    var actions = document.createElement('div');
    actions.id = 'debug-actions';
    actions.innerHTML = '<button class="btn secondary" onclick="copyDebugOutput()">Скопировать</button>' +
      '<button class="btn" onclick="runTajweedDiagnostics()">Запустить</button>' +
      '<button class="btn secondary" onclick="document.getElementById(\'debug-overlay\').classList.remove(\'active\')">Закрыть</button>';
    ov.appendChild(actions);
    document.body.appendChild(ov);
  }
  var out = document.getElementById('debug-output');
  if (out) out.textContent = text;
  ov.classList.add('active');
}
function copyDebugOutput() {
  var out = document.getElementById('debug-output');
  if (out) copyToClipboard(out.textContent || '');
}
async function runTajweedDiagnostics() {
  showDebugResult('Идёт проверка...\n\nЗапрос к API. Подождите 5–10 секунд.');
  var out = [];
  out.push('=== TAJWEED DIAGNOSTICS ===');
  out.push('Time: ' + new Date().toISOString());
  out.push('APP_VERSION: ' + APP_VERSION);
  out.push('UA: ' + navigator.userAgent);
  out.push('standalone: ' + window.matchMedia('(display-mode: standalone)').matches);
  out.push('SW controller: ' + (navigator.serviceWorker && navigator.serviceWorker.controller ? 'yes' : 'no'));
  out.push('');

  var url = 'https://api.alquran.cloud/v1/surah/112/quran-tajweed';
  out.push('--- 1. FETCH ---');
  out.push('URL: ' + url);
  var t0 = performance.now();
  var text = '';
  try {
    var res = await fetch(url, { cache: 'no-store' });
    var t1 = performance.now();
    out.push('HTTP status: ' + res.status + ' (' + Math.round(t1 - t0) + ' ms)');
    if (!res.ok) {
      out.push('ERROR: non-OK response');
      showDebugResult(out.join('\n'));
      return;
    }
    var json = await res.json();
    var ayahs = json && json.data && json.data.ayahs;
    if (!ayahs || !ayahs.length) {
      out.push('ERROR: no ayahs in response');
      out.push('Raw (first 300): ' + JSON.stringify(json).slice(0, 300));
      showDebugResult(out.join('\n'));
      return;
    }
    text = ayahs[0].text || '';
    out.push('Ayahs received: ' + ayahs.length);
    out.push('First ayah length: ' + text.length);
    out.push('First ayah raw (first 300 chars):');
    out.push(text.slice(0, 300));
    out.push('');
  } catch(e) {
    out.push('FETCH ERROR: ' + (e && e.message ? e.message : String(e)));
    showDebugResult(out.join('\n'));
    return;
  }

  out.push('--- 2. PARSER ---');
  out.push('Contains [code[ pattern: ' + /\[([a-zA-Z])(?::\d+)?\[/.test(text));
  out.push('Contains <tajweed pattern: ' + /<tajweed/i.test(text));
  var result;
  try {
    result = renderTajweedHtml(text);
  } catch(e) {
    out.push('PARSER ERROR: ' + (e && e.message ? e.message : String(e)));
    showDebugResult(out.join('\n'));
    return;
  }
  out.push('Parsed HTML length: ' + result.text.length);
  out.push('Parsed HTML (first 300 chars):');
  out.push(result.text.slice(0, 300));
  out.push('Rules HTML present: ' + (result.rules ? 'yes' : 'no'));
  out.push('');

  out.push('--- 3. DOM/CSS ---');
  var testDiv = document.createElement('div');
  testDiv.className = 'read-ayah-ar ar-font';
  testDiv.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;';
  testDiv.innerHTML = result.text;
  document.body.appendChild(testDiv);
  try {
    var parentCs = getComputedStyle(testDiv);
    out.push('Parent color: ' + parentCs.color);
    out.push('Parent -webkit-text-fill-color: ' + (parentCs.webkitTextFillColor || 'n/a'));
    out.push('Parent -webkit-background-clip: ' + (parentCs.webkitBackgroundClip || 'n/a'));
    out.push('Parent background-image: ' + (parentCs.backgroundImage || 'none').slice(0, 80));
    var spans = testDiv.querySelectorAll('span[class^="tajweed-"]');
    out.push('Tajweed spans found: ' + spans.length);
    if (spans.length) {
      var s = spans[0];
      var cs = getComputedStyle(s);
      out.push('First span class: ' + s.className);
      out.push('First span color: ' + cs.color);
      out.push('First span -webkit-text-fill-color: ' + (cs.webkitTextFillColor || 'n/a'));
    } else {
      out.push('!! NO span[class^="tajweed-"] — парсер не создал теги');
    }
  } catch(e) {
    out.push('DOM ERROR: ' + (e && e.message ? e.message : String(e)));
  } finally {
    testDiv.remove();
  }
  out.push('');
  out.push('=== END ===');
  showDebugResult(out.join('\n'));
}

async function testScreenTajweed(kind) {
  try { closeRead(); } catch(e) {}
  try { closeMemorize(); } catch(e) {}
  var ov = document.getElementById('debug-overlay');
  if (ov) ov.classList.add('active');

  var id = 'q112';
  var item = getQuranById(id);
  if (!item) { showDebugResult('ERROR: q112 не найден'); return; }

  if (kind === 'read') openRead(id);
  else openQuran(id);

  for (var i = 1; i <= 60; i++) {
    await new Promise(function(r){ setTimeout(r, 1000); });
    var pre = document.getElementById('debug-output');
    if (pre) {
      pre.textContent = '=== SCREEN TEST: ' + kind + ' ===\n\n' +
        'Открыт экран ' + (kind === 'read' ? 'openRead' : 'openQuran') + ' для ' + item.title + '.\n' +
        'Прошло ' + i + ' сек из 60. Ждём загрузки таджвида (API медленный).\n\n' +
        'Не закрывайте приложение.';
    }
    if (ov) ov.classList.add('active');
  }

  var container = kind === 'read' ? document.getElementById('read-body') : document.getElementById('quran-detail-content');
  var out = [];
  out.push('=== SCREEN TEST: ' + kind + ' ===');
  out.push('Time: ' + new Date().toISOString());
  out.push('APP_VERSION: ' + APP_VERSION);
  out.push('');
  if (!container) { out.push('ERROR: container not found'); showDebugResult(out.join('\n')); return; }

  var arEls = container.querySelectorAll('.read-ayah-ar');
  out.push('read-ayah-ar elements: ' + arEls.length);

  var totalSpans = 0;
  var withSpans = 0;
  var firstSpanColor = '';
  arEls.forEach(function(el) {
    var spans = el.querySelectorAll('span[class^="tajweed-"]');
    totalSpans += spans.length;
    if (spans.length) {
      withSpans++;
      if (!firstSpanColor && spans[0]) firstSpanColor = getComputedStyle(spans[0]).color;
    }
  });
  out.push('Total tajweed spans: ' + totalSpans);
  out.push('Ayahs with spans: ' + withSpans + ' / ' + arEls.length);
  out.push('First span color: ' + (firstSpanColor || 'n/a'));

  if (arEls[0]) {
    var el0 = arEls[0];
    var cs0 = getComputedStyle(el0);
    out.push('');
    out.push('First ayah-ar:');
    out.push('  textLength: ' + (el0.textContent || '').length);
    out.push('  innerHTML (first 200): ' + el0.innerHTML.slice(0, 200));
    out.push('  color: ' + cs0.color);
    out.push('  -webkit-text-fill-color: ' + (cs0.webkitTextFillColor || 'n/a'));
  }
  out.push('');
  out.push('=== END ===');
  showDebugResult(out.join('\n'));
}

/* ---------- INIT / BOOT ---------- */
function initApp() {
  try {
    migrateData();
    applyTheme();
    setArSize(state.settings.arSize);
    renderPresets();
    renderDashboard();
    restoreNav();
    scheduleAutoTheme();
    scheduleReminders();
  } catch (e) {
    console.error('Ошибка инициализации:', e);
  } finally {
    var splash = document.getElementById('splash-screen');
    if (splash) { 
      splash.classList.add('hidden'); 
      setTimeout(function(){ splash.remove(); }, 400); 
    }
  }
}

async function _boot() {
  try {
    await loadAllData();
    state = load();
    try {
      if (new URLSearchParams(location.search).get('reset') === '1') {
        state.migrations.onboarded = false;
        saveNow();
        history.replaceState(null, '', location.pathname);
      }
    } catch (e) {}
    initDebugMode();
    initApp();
    if (!state.migrations.onboarded) setTimeout(startOnboarding, 200);
  } catch (e) {
    console.error('Ошибка загрузки данных:', e);
    var splash = document.getElementById('splash-screen');
    if (splash) { 
      splash.classList.add('hidden'); 
      setTimeout(function(){ splash.remove(); }, 400); 
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _boot);
} else {
  _boot();
}

/* ---------- SETTINGS LISTENERS (opt-*) ---------- */
document.getElementById('opt-autonext').addEventListener('change', e=>{ state.settings.autoNext = e.target.checked; save(); });
document.getElementById('opt-wake').addEventListener('change', e=>{ state.settings.wakeLock = e.target.checked; save(); });
document.getElementById('opt-sound').addEventListener('change', e=>{ state.settings.sound = e.target.checked; save(); if (e.target.checked) playClick(); });
document.getElementById('opt-vibrate').addEventListener('change', e=>{ state.settings.vibrate = e.target.checked; save(); });
document.getElementById('opt-goal-notify').addEventListener('change', e=>{ state.settings.goalNotify = e.target.checked; save(); });

/* ---------- GLOBAL EVENT LISTENERS ---------- */
window.addEventListener('pagehide', () => {
  if (activeReadId) {
    const b = document.getElementById('read-body');
    if (b && state.settings.readScrolls) state.settings.readScrolls[activeReadId] = b.scrollTop || 0;
    if (b && state.settings.readAyah) state.settings.readAyah[activeReadId] = currentAyahIdx();
  }
  saveNow();
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && state.settings.theme === 'auto') applyTheme(); });
document.addEventListener('visibilitychange', ()=>{ if (document.visibilityState==='visible' && activeId && state.settings.wakeLock) requestWakeLock(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkReminders();
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  const searchOv = document.getElementById('search-overlay');
  if (searchOv && searchOv.classList.contains('active')) { closeSearch(); return; }
  const modal = document.getElementById('modal-bg');
  if (modal && modal.classList.contains('active')) { closeModal(); return; }
  const read = document.getElementById('read-mode');
  if (read && read.classList.contains('active')) { closeRead(); return; }
  const mem = document.getElementById('memorize-mode');
  if (mem && mem.classList.contains('active')) { closeMemorize(); return; }
});

/* Touch-swipe в режиме чтения */
(function(){
  var el=document.getElementById('read-body');
  if (!el) return;
  let tx=0, ty=0, on=false;
  el.addEventListener('touchstart', function(e){ tx=e.touches[0].clientX; ty=e.touches[0].clientY; on=true; }, { passive:true });
  el.addEventListener('touchend', function(e){
    if (!on) return; on=false;
    var dx=e.changedTouches[0].clientX-tx; var dy=e.changedTouches[0].clientY-ty;
    if (Math.abs(dx)<80 || Math.abs(dy)>Math.abs(dx)) return;
    if (!activeReadId) return;
    if (dx<0) readNextSurah(); else if (dx>0) readPrevSurah();
  }, { passive:true });
})();

/* ---------- SERVICE WORKER ---------- */
if ('serviceWorker' in navigator) {
  var _swRefreshing = false;
  var _swReg = null;

  function swReload() {
    if (_swRefreshing) return;
    _swRefreshing = true;
    console.log('SW: доступно обновление. Перезагрузите приложение вручную.');
    setTimeout(function(){ _swRefreshing = false; }, 30000);
  }

  function activateWaiting(reg) {
    if (!reg) return;
    if (reg.waiting) {
      try { reg.waiting.postMessage({ type: 'SKIP_WAITING' }); } catch(e) {}
    }
    if (reg.installing) {
      reg.installing.addEventListener('statechange', function() {
        if (this.state === 'installed' && reg.waiting) {
          try { reg.waiting.postMessage({ type: 'SKIP_WAITING' }); } catch(e) {}
        }
      });
    }
  }

  function handleUpdate(reg) {
    _swReg = reg;
    activateWaiting(reg);
    reg.addEventListener('updatefound', function() {
      var nw = reg.installing;
      if (!nw) return;
      nw.addEventListener('statechange', function() {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
          try { nw.postMessage({ type: 'SKIP_WAITING' }); } catch(e) {}
        }
      });
    });
  }

  window.addEventListener('load', function() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(regs) {
        regs.forEach(function(r) { r.unregister(); });
        return navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
      }).then(function(reg) {
        handleUpdate(reg);
        try { reg.update(); } catch(e) {}
        setInterval(function() {
          if (document.visibilityState !== 'visible') return;
          try { reg.update(); } catch(e) {}
        }, 5 * 60 * 1000);
        document.addEventListener('visibilitychange', function() {
          if (document.visibilityState === 'visible') {
            try { reg.update(); } catch(e) {}
          }
        });
        window.addEventListener('focus', function() {
          try { reg.update(); } catch(e) {}
        });
      }).catch(function() {});
    }
  });

  navigator.serviceWorker.addEventListener('controllerchange', function() {
    swReload();
  });

  navigator.serviceWorker.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'SW_UPDATED') {
      if (e.data.version && e.data.version !== APP_VERSION) {
        swReload();
      }
    }
  });
}

/* ---------- BACK BUTTON (iOS swipe + Android system back) ---------- */
(function(){
  var going = false;
  var OVERLAY_CLOSERS = {
    'search-overlay': 'closeSearch',
    'read-mode':      'closeRead',
    'memorize-mode':  'closeMemorize',
    'modal-bg':       'closeModal'
  };
  var ALL_OVERLAYS = Object.keys(OVERLAY_CLOSERS);

  function currentScreen() {
    var el = document.querySelector('.screen.active');
    return el ? el.id : null;
  }
  function currentOverlay() {
    for (var i = 0; i < ALL_OVERLAYS.length; i++) {
      var el = document.getElementById(ALL_OVERLAYS[i]);
      if (el && el.classList.contains('active')) return ALL_OVERLAYS[i];
    }
    return null;
  }
  function closeOverlay(name) {
    var fn = OVERLAY_CLOSERS[name];
    if (fn && typeof window[fn] === 'function') {
      try { window[fn](); } catch(e) {}
    }
  }

  try {
    var s0 = currentScreen();
    if (s0) history.replaceState({ screen: s0 }, '');
  } catch(e) {}

  var _showScreen = window.showScreen;
  window.showScreen = function(id) {
    if (!going) {
      var cur = currentScreen();
      if (cur && cur !== id) {
        var st = { screen: id };
        var ov = currentOverlay();
        if (ov) st.overlay = ov;
        if (activeId) st.tasbihId = activeId;
        if (activeQuranId) st.quranId = activeQuranId;
        if (activeDuaId) st.duaId = activeDuaId;
        if (activeHadithId) st.hadithId = activeHadithId;
        if (typeof activeNightId === 'number') st.nightId = activeNightId;
        try { history.pushState(st, ''); } catch(e) {}
      }
    }
    return _showScreen.apply(this, arguments);
  };

  function hookOpener(fnName, ovId) {
    var orig = window[fnName];
    if (typeof orig !== 'function') return;
    window[fnName] = function() {
      if (!going) {
        var st = { screen: currentScreen(), overlay: ovId };
        if (ovId === 'read-mode' && arguments[0]) st.readQuranId = arguments[0];
        else if (ovId === 'memorize-mode' && arguments[0] && arguments[0].id) st.memId = arguments[0].id;
        else if (ovId === 'modal-bg' && arguments[0]) st.modalKey = arguments[0];
        try { history.pushState(st, ''); } catch(e) {}
      }
      return orig.apply(this, arguments);
    };
  }
  hookOpener('openSearch', 'search-overlay');
  hookOpener('openRead', 'read-mode');
  hookOpener('openMemorizeFor', 'memorize-mode');
  hookOpener('openDay', 'modal-bg');

  function hookCloser(fnName, ovId) {
    var orig = window[fnName];
    if (typeof orig !== 'function') return;
    window[fnName] = function() {
      var st = history.state;
      if (!going && st && st.overlay === ovId) {
        try { history.back(); } catch(e) {}
      }
      return orig.apply(this, arguments);
    };
  }
  hookCloser('closeSearch', 'search-overlay');
  hookCloser('closeRead', 'read-mode');
  hookCloser('closeMemorize', 'memorize-mode');
  hookCloser('closeModal', 'modal-bg');

  window.addEventListener('popstate', function(e) {
    var st = e.state || {};
    going = true;
    try {
      var targetOverlay = st.overlay || null;
      for (var i = 0; i < ALL_OVERLAYS.length; i++) {
        var ov = ALL_OVERLAYS[i];
        var el = document.getElementById(ov);
        if (!el) continue;
        var isOpen = el.classList.contains('active');
        var shouldBeOpen = (ov === targetOverlay);
        if (isOpen && !shouldBeOpen) closeOverlay(ov);
      }
      if (st.screen === 'screen-quran-detail' && st.quranId) {
        if (activeQuranId !== st.quranId || currentScreen() !== 'screen-quran-detail') openQuran(st.quranId);
      } else if (st.screen === 'screen-dua-detail' && st.duaId) {
        if (activeDuaId !== st.duaId || currentScreen() !== 'screen-dua-detail') openDua(st.duaId);
      } else if (st.screen === 'screen-hadith-detail' && st.hadithId) {
        if (activeHadithId !== st.hadithId || currentScreen() !== 'screen-hadith-detail') openHadith(st.hadithId);
      } else if (st.screen === 'screen-night-detail' && typeof st.nightId === 'number') {
        if (activeNightId !== st.nightId || currentScreen() !== 'screen-night-detail') openNight(st.nightId);
      } else if (st.screen === 'screen-counter' && st.tasbihId) {
        if (activeId !== st.tasbihId || currentScreen() !== 'screen-counter') {
          activeId = st.tasbihId;
          openCounter(st.tasbihId);
        }
      } else if (st.screen && currentScreen() !== st.screen) {
        try { _showScreen.call(window, st.screen); } catch(err) {}
      }
      if (targetOverlay) {
        var ovEl = document.getElementById(targetOverlay);
        if (ovEl && !ovEl.classList.contains('active')) {
          if (targetOverlay === 'search-overlay') {
            openSearch();
          } else if (targetOverlay === 'read-mode' && st.readQuranId) {
            openRead(st.readQuranId);
          } else if (targetOverlay === 'memorize-mode' && st.memId) {
            var memItem = getQuranById(st.memId) || getDuaById(st.memId) || getHadithById(st.memId);
            if (memItem) openMemorizeFor(memItem);
          } else if (targetOverlay === 'modal-bg' && st.modalKey) {
            openDay(st.modalKey);
          }
        }
      }
    } finally {
      going = false;
    }
  });

  window.goBack = function() {
    try { history.back(); } catch(e) {}
  };
})();

/* ---------- PWA INSTALL ---------- */
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (!localStorage.getItem('iqra_install_dismissed')) {
    setTimeout(() => {
      const b = document.getElementById('install-banner');
      if (b) b.classList.add('show');
    }, 3000);
  }
});
(function initIOSInstallBanner() {
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isStandalone = window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  if (isIOS && !isStandalone && !localStorage.getItem('iqra_install_dismissed')) {
    setTimeout(() => {
      const b = document.getElementById('install-banner');
      if (!b) return;
      const txt = b.querySelector('.ib-text');
      if (txt) txt.textContent = 'Установить Iqra: «Поделиться» → «На экран Домой»';
      const ins = b.querySelector('.ib-install');
      if (ins) ins.textContent = 'Понятно';
      const later = b.querySelector('.ib-later');
      if (later) later.textContent = 'Скрыть';
      b.classList.add('show');
    }, 5000);
  }
})();
function installPWA() {
  const b = document.getElementById('install-banner');
  if (b) b.classList.remove('show');
  if (!deferredPrompt) {
    try { localStorage.setItem('iqra_install_dismissed', '1'); } catch(e) {}
    return;
  }
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then((c) => {
    if (c.outcome === 'accepted') trackEvent('pwa_install', 'PWA установлено');
    deferredPrompt = null;
  });
}
function dismissInstall() {
  const b = document.getElementById('install-banner');
  if (b) b.classList.remove('show');
  try { localStorage.setItem('iqra_install_dismissed', '1'); } catch(e) {}
}
window.addEventListener('appinstalled', () => {
  const b = document.getElementById('install-banner');
  if (b) b.classList.remove('show');
  try { localStorage.setItem('iqra_install_dismissed', '1'); } catch(e) {}
});

/* ---------- STRUCTURE / INLINE CHECKS ---------- */
(function checkStructure(){
  var expected = ['screen-dashboard','screen-tasbih','screen-quran','screen-night','screen-dua','screen-hadith','screen-cal','screen-quran-detail','screen-night-detail','screen-dua-detail','screen-hadith-detail','screen-form','screen-counter','screen-settings','read-mode','memorize-mode','search-overlay','nav','modal-bg','onboarding','save-indicator'];
  var missing = [];
  expected.forEach(function(id){ if (!document.getElementById(id)) missing.push(id); });
  if (missing.length) console.error('⚠️ Структура — отсутствуют: ' + missing.join(', '));
  else console.log('✓ Структура: все ключевые элементы на месте');
})();
(function checkInlineHandlers(){
  var attrs = ['onclick','oninput','onchange','onsubmit'];
  var problems = [];
  attrs.forEach(function(a){
    document.querySelectorAll('[' + a + ']').forEach(function(el){
      var v = el.getAttribute(a) || '';
      if (/\s[a-z-]+=\s*$/.test(v)) {
        problems.push('<' + el.tagName.toLowerCase() + '> ' + a + '=' + JSON.stringify(v));
      }
      var opens = (v.match(/\(/g) || []).length;
      var closes = (v.match(/\)/g) || []).length;
      if (opens !== closes) problems.push('Скобки (' + opens + '/' + closes + '): ' + a + '=' + JSON.stringify(v));
    });
  });
  if (problems.length) { console.error('⚠️ Inline-обработчики — ' + problems.length + ':'); problems.forEach(function(p){ console.error('  • ' + p); }); }
  else console.log('✓ Inline-обработчики: парность в порядке');
})();

/* ---------- FOCUS MODE ---------- */
(function initFocusMode() {
  var body = document.getElementById('read-body');
  if (!body) return;
  var lastY = 0;
  body.addEventListener('scroll', function() {
    var header = document.querySelector('#read-mode .fs-header');
    if (!header) return;
    var y = body.scrollTop;
    if (y > 60 && y > lastY) header.classList.add('fs-header-hidden');
    else if (y < lastY - 8 || y < 60) header.classList.remove('fs-header-hidden');
    lastY = y;
  }, { passive: true });
})();

/* ---------- HAPTIC ---------- */
(function initHaptic() {
  document.addEventListener('click', function(e) {
    if (!state || !state.settings || !state.settings.vibrate) return;
    if (!navigator.vibrate) return;
    var t = e.target && e.target.closest && e.target.closest(
      '.btn, .icon-btn, .path-chip, .nav button, .filter-chip, .preset-chip, ' +
      '.cal-day, .fab, .dash-grid-item, .dash-quick, .content-card, .continue-card, ' +
      '.ob-option, .ayah-share-btn, .star-btn, .show-all-btn, .fs-bottom-nav button'
    );
    if (t) navigator.vibrate(8);
  }, { passive: true });
})();

/* ---------- GOLD-LINK (hash-tags) ---------- */
document.addEventListener('click', function(e) {
  if (e.target && e.target.classList.contains('gold-link')) {
    const tag = e.target.getAttribute('data-tag');
    if (tag) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof closeSearch === 'function') closeSearch();
      if (typeof closeRead === 'function') closeRead();
      switchTab('path');
      setTimeout(() => setPathTag(tag), 50);
    }
  }
});
