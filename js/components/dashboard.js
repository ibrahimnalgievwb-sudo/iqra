"use strict";

/* ============================================================
   DASHBOARD.JS — Главный экран, приветствие, цитата дня
   Проект «Икра» · v387 (Этап 3.5)
   Прогресс-баров нет — патч D-06 не требуется.
   ============================================================ */

var _smartCycleOffset = 0;
var _activeSmartScenario = null;

function getSmartReminderContext(nowDate) {
  var now = nowDate instanceof Date ? nowDate : new Date();
  var today = (typeof todayKey === 'function') ? todayKey() : '';
  var todayEntry = (state && state.history && today) ? state.history[today] : null;
  return {
    now: now,
    prefs: state && state.settings ? state.settings.smartReminders : null,
    onboarded: !!(state && state.migrations && state.migrations.onboarded),
    todayTotal: todayEntry ? Number(todayEntry.total || 0) : 0,
    dailyGoal: state && state.settings ? Number(state.settings.dailyGoal || 0) : 0,
    quranLearned: (state && state.quranProgress) || {},
    cycleOffset: _smartCycleOffset
  };
}

function executeSmartAction(type, id) {
  if (!type) return;
  if (type === 'read' && id && typeof openRead === 'function') openRead(id);
  else if (type === 'counter' && id && typeof openCounter === 'function') openCounter(id);
  else if (type === 'dua' && id && typeof openDua === 'function') openDua(id);
  else if (type === 'hadith' && id && typeof openHadith === 'function') openHadith(id);
  else if (type === 'night' && typeof openNight === 'function') openNight(parseInt(id || '0', 10) || 0);
  else if (type === 'tab' && id && typeof switchTab === 'function') switchTab(id);
}

function cycleSmartReminder() {
  _smartCycleOffset++;
  renderDashSmartReminder();
}

function dismissSmartReminderToday() {
  if (!state || !state.settings) return;
  if (typeof IqraSmartReminders !== 'undefined') {
    state.settings.smartReminders = IqraSmartReminders.sanitizePrefs(state.settings.smartReminders);
    state.settings.smartReminders.mutedDate = IqraSmartReminders.formatDateKey(new Date());
  }
  save();
  renderDashSmartReminder();
  if (typeof showMarkToast === 'function') showMarkToast('Напоминание скрыто до завтра');
}

function renderDashSmartReminder() {
  var slot = document.getElementById('dash-smart-reminder-slot');
  if (!slot) return;
  if (typeof IqraSmartReminders === 'undefined' || !state) {
    slot.innerHTML = '';
    slot.style.display = 'none';
    _activeSmartScenario = null;
    return;
  }
  var ctx = getSmartReminderContext(new Date());
  var eligible = IqraSmartReminders.listEligibleScenarios(ctx);
  var scenario = IqraSmartReminders.selectActiveReminder(ctx);
  _activeSmartScenario = scenario;
  if (!scenario) {
    slot.innerHTML = '';
    slot.style.display = 'none';
    return;
  }
  slot.style.display = 'block';
  var canCycle = eligible.length > 1;
  var secBtn = (scenario.secondaryLabel && scenario.secondaryAction)
    ? '<button type="button" class="btn secondary btn-inline src-action-btn" onclick="executeSmartAction(\'' + escAttr(scenario.secondaryAction.type) + '\',\'' + escAttr(scenario.secondaryAction.id) + '\')">' + esc(scenario.secondaryLabel) + '</button>'
    : '';
  var _dashLinkify = (typeof IqraScholars !== 'undefined' && typeof IqraScholars.linkifyScholars === 'function')
    ? function (h) {
        var linked = IqraScholars.linkifyScholars(h);
        return typeof IqraScholars.formatSacredTermsHtml === 'function'
          ? IqraScholars.formatSacredTermsHtml(linked)
          : linked;
      }
    : function (h) { return h; };
  var _dashHadithHtml = (typeof IqraDalil !== 'undefined' && typeof IqraDalil.renderNoteBlocksHtml === 'function')
    ? IqraDalil.renderNoteBlocksHtml(scenario.hadithText, { linkify: _dashLinkify })
    : _dashLinkify(esc(scenario.hadithText));
  slot.innerHTML =
    '<aside class="smart-reminder-card" aria-label="Умное напоминание">' +
      '<div class="src-head">' +
        '<div class="src-meta">' + esc(scenario.kicker) + '</div>' +
        '<div class="src-head-actions">' +
          (canCycle ? '<button type="button" class="icon-btn ghost src-icon-btn" onclick="cycleSmartReminder()" aria-label="Следующее напоминание"><svg class="ico ico-sm"><use href="#i-rotate-ccw"/></svg></button>' : '') +
        '</div>' +
      '</div>' +
      '<div class="src-title">' + esc(scenario.title) + '</div>' +
      (scenario.arabic ? '<div class="src-ar ar-font">' + esc(scenario.arabic) + '</div>' : '') +
      '<div class="src-hadith">' + _dashHadithHtml + '</div>' +
      '<div class="src-source">' + _dashLinkify(esc(scenario.source)) + '</div>' +
      '<div class="src-actions">' +
        '<button type="button" class="btn secondary btn-inline src-action-btn src-action-primary" onclick="executeSmartAction(\'' + escAttr(scenario.action.type) + '\',\'' + escAttr(scenario.action.id) + '\')">' + esc(scenario.actionLabel) + '<svg class="ico ico-sm"><use href="#i-arrow-right"/></svg></button>' +
        secBtn +
        '<button type="button" class="src-dismiss-btn" onclick="dismissSmartReminderToday()">Скрыть на сегодня</button>' +
      '</div>' +
    '</aside>';
}

function getDailyQuote() {
  var key = 'iqra_quote_' + todayKey();
  try {
    var cached = localStorage.getItem(key);
    if (cached && cached !== 'null' && cached !== 'undefined') {
      return JSON.parse(cached);
    }
  } catch(e) {}
  /* чистим цитаты прошлых дней, чтобы ключи не копились */
  try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('iqra_quote_') === 0 && k !== key) localStorage.removeItem(k); }); } catch (e) {}
  var q = getRandomQuote();
  try { localStorage.setItem(key, JSON.stringify(q)); } catch(e) {}
  return q;
}

function refreshQuote() {
  try { localStorage.removeItem('iqra_quote_' + todayKey()); } catch(e) {}
  renderDashboard();
}

function renderDashSpiritual() {
  const el = document.getElementById('dash-spiritual');
  if (!el) return;

  const q96 = DEFAULT_QURAN.find(q => q.id === 'q96');
  if (!q96 || !BISMILLAH) return;

  const arLines = (q96.arabic || '').split('\n');
  const trLines = (q96.transcription || '').split('\n');
  const trnLines = (q96.translation || '').split('\n');

  const arText = arLines.slice(0, 2).join(' ');
  const trText = trLines.slice(0, 2).join(' ');
  const trnText = trnLines.slice(0, 2).join(' ');

  el.innerHTML = `
    <div class="spiritual-card">
      <div class="sc-ar-bismillah ar-font">${esc(BISMILLAH.arabic)}</div>
      <div class="sc-tr-bismillah">${esc(BISMILLAH.transcription)}</div>
      <div class="sc-trn-bismillah">${esc(BISMILLAH.translation)}</div>
      
      <div class="sc-divider"></div>
      
      <div class="sc-ar-alyaq ar-font">${esc(arText)}</div>
      <div class="sc-tr-alyaq">${esc(trText)}</div>
      <div class="sc-trn-alyaq">${esc(trnText)}</div>
      
      <button class="btn secondary btn-inline" onclick="openRead('q96')">
        <svg class="ico ico-sm"><use href="#i-book"/></svg>
        Читать суру полностью
      </button>
    </div>
  `;
}

function renderDashboard() {
  renderDashSpiritual();
  
  const hh = document.getElementById('dash-hijri-header');
  if (hh) hh.textContent = formatHijri(new Date());

  const contEl = document.getElementById('dash-continue-block');
  if (contEl) {
    const lr = state.settings.lastRead;
    var contId = 'q1', contLabel = 'Начать с Аль-Фатихи', contTitle = 'Аль-Фатиха', contSub = 'Открывающая · 7 аятов';
    if (lr && lr.type === 'quran') {
      const q = getQuranById(lr.id);
      if (q) {
        contId = q.id;
        contLabel = 'Продолжить чтение';
        contTitle = q.title;
        contSub = q.subtitle || '';
      }
    }
    contEl.innerHTML = `<button type="button" class="continue-card continue-card-btn" onclick="openRead('${escAttr(contId)}')"><div class="cc-label">${esc(contLabel)}</div><div class="cc-title">${esc(contTitle)}</div>${contSub ? `<div class="cc-sub">${esc(contSub)}</div>` : ''}</button>`;
  }

  renderDashSmartReminder();
  if (typeof renderDashboardWidgets === 'function') renderDashboardWidgets();

  _dashQuote = getDailyQuote();
  const qEl = document.getElementById('dash-quote');
  if (qEl && _dashQuote) {
    var quoteTrHtml = esc(_dashQuote.tr);
    if (typeof IqraScholars !== 'undefined' && typeof IqraScholars.formatSacredTermsHtml === 'function') {
      quoteTrHtml = IqraScholars.formatSacredTermsHtml(quoteTrHtml);
    }
    qEl.innerHTML =
      '<div class="dq-head"><span class="dq-badge">' + esc(_dashQuote.badge) + '</span><div class="dq-actions"><button type="button" class="icon-btn ghost dq-refresh-btn" onclick="event.stopPropagation();refreshQuote()" aria-label="Другая цитата"><svg class="ico ico-sm"><use href="#i-rotate-ccw"/></svg></button><span class="dq-arrow"><svg class="ico ico-sm"><use href="#i-arrow-right"/></svg></span></div></div>' +
      '<div class="dq-title">' + esc(_dashQuote.title) + '</div>' +
      (_dashQuote.ar ? '<div class="dq-ar ar-font">' + esc(_dashQuote.ar) + '</div>' : '') +
      (_dashQuote.tr ? '<div class="dq-tr">' + quoteTrHtml + '</div>' : '');
  }
}

function dashQuoteTap() {
  if (!_dashQuote) return;
  if (_dashQuote.type === 'quran') openQuran(_dashQuote.id);
  else if (_dashQuote.type === 'hadith') openHadith(_dashQuote.id);
  else if (_dashQuote.type === 'dua') openDua(_dashQuote.id);
  else if (_dashQuote.type === 'tasbih') openCounter(_dashQuote.id);
}

function getRandomQuote() {
  const sources = [];
  state.quran.forEach(function(q) {
    if (q.arabic && q.translation) {
      sources.push({
        type: 'quran', id: q.id, badge: 'Коран',
        title: q.title,
        ar: q.arabic.split('\n')[0],
        tr: q.translation.split('\n')[0]
      });
    }
  });
  state.hadiths.forEach(function(h) {
    if (h.arabic && h.translation) {
      sources.push({
        type: 'hadith', id: h.id, badge: 'Хадис',
        title: h.title,
        ar: h.arabic,
        tr: h.translation
      });
    }
  });
  state.duas.forEach(function(d) {
    if (d.arabic && d.translation) {
      sources.push({
        type: 'dua', id: d.id, badge: 'Дуа',
        title: d.title,
        ar: d.arabic.split('\n')[0],
        tr: d.translation.split('\n')[0]
      });
    }
  });
  state.tasbihs.forEach(function(t) {
    if (t.arabic && t.translation) {
      sources.push({
        type: 'tasbih', id: t.id, badge: 'Тасбих',
        title: t.transcription || t.translation,
        ar: t.arabic,
        tr: t.translation
      });
    }
  });
  if (!sources.length) {
    return {
      type: null, id: null, badge: 'Iqra',
      title: 'Читай!',
      ar: 'ٱقْرَأْ',
      tr: 'Читай во имя Господа твоего!'
    };
  }
  return sources[Math.floor(Math.random() * sources.length)];
}
