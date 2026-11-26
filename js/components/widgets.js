"use strict";

/* ============================================================
   WIDGETS.JS — Виджеты на главном экране + экранные PWA-виджеты
   Проект «Икра» · v460
   ============================================================ */

var WIDGET_CATALOG = [
  { id: 'goal_ring', title: 'Дневная цель', desc: 'Кольцо прогресса зикра на сегодня' },
  { id: 'night_check', title: 'Ночное чтение', desc: 'Прогресс вечерних сур, дуа и тасбиха Фатимы' },
  { id: 'mini_tasbih', title: 'Быстрый тасбих', desc: 'Счётчик тасбиха +1 прямо с главной' },
  { id: 'daily_dhikr', title: 'Аят и зикр дня', desc: 'Быстрый доступ к выбранному зикру дня' }
];

var STANDALONE_WIDGETS = [
  {
    id: 'dhikr',
    title: 'Виджет «Быстрый тасбих»',
    desc: 'Слова единобожия и быстрый счётчик +1 одним нажатием.',
    url: './?widget=dhikr&autostart=1'
  },
  {
    id: 'night',
    title: 'Виджет «Ночное чтение»',
    desc: 'Ежедневный чек-лист сур и аятов перед сном.',
    url: './?widget=night&autostart=1'
  },
  {
    id: 'stats',
    title: 'Виджет «Дневная цель»',
    desc: 'Сводка сегодняшнего прогресса и серии дней.',
    url: './?widget=stats&autostart=1'
  },
  {
    id: 'ayah',
    title: 'Виджет «Аят дня»',
    desc: 'Чтение аята с переводом и переходом к тафсиру.',
    url: './?widget=ayah&autostart=1'
  }
];

function _getEnabledWidgets() {
  var allIds = WIDGET_CATALOG.map(function (w) { return w.id; });
  if (!state || !state.settings || !state.settings.widgetPrefs || !Array.isArray(state.settings.widgetPrefs.enabled)) {
    return allIds;
  }
  return state.settings.widgetPrefs.enabled.filter(function (id) { return allIds.indexOf(id) !== -1; });
}

function _toggleWidgetPref(widgetId) {
  if (!state || !state.settings) return;
  if (!state.settings.widgetPrefs || typeof state.settings.widgetPrefs !== 'object') {
    state.settings.widgetPrefs = { enabled: WIDGET_CATALOG.map(function (w) { return w.id; }) };
  }
  var list = Array.isArray(state.settings.widgetPrefs.enabled) ? state.settings.widgetPrefs.enabled.slice() : [];
  var idx = list.indexOf(widgetId);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(widgetId);
  state.settings.widgetPrefs.enabled = list;
  if (typeof save === 'function') save();
  renderDashboardWidgets();
  openWidgetsModal();
}

function _widgetTapMiniTasbih(tasbihId) {
  var id = tasbihId || 'tawhid';
  var t = (typeof getById === 'function') ? (getById(id) || state.tasbihs[0]) : null;
  if (!t) return;
  t.current = (t.current || 0) + 1;
  if (t.current >= (t.target || 33)) {
    t.current = 0;
    t.cycles = (t.cycles || 0) + 1;
    if (typeof showMarkToast === 'function') showMarkToast('Цикл завершён');
    if (state.settings.vibrate && navigator.vibrate) navigator.vibrate([20, 40, 20]);
  } else if (state.settings.vibrate && navigator.vibrate) {
    navigator.vibrate(10);
  }
  if (typeof addToHistory === 'function') addToHistory(t.id, 1);
  if (typeof save === 'function') save();
  renderDashboardWidgets();
  if (document.body.classList.contains('widget-mode')) {
    renderStandaloneWidgetMode('dhikr');
  }
}

function _renderWidgetGoalRingHtml() {
  var goal = (state && state.settings) ? Math.max(0, Number(state.settings.dailyGoal || 100)) : 100;
  var today = (typeof todayKey === 'function') ? todayKey() : '';
  var todayEntry = (state && state.history && today) ? state.history[today] : null;
  var done = todayEntry ? Number(todayEntry.total || 0) : 0;
  var ratio = goal > 0 ? Math.min(1, done / goal) : 1;
  var dashTotal = 125.6;
  var dashOffset = (dashTotal * (1 - ratio)).toFixed(1);
  var pct = goal > 0 ? Math.min(100, Math.round(ratio * 100)) : 100;

  return '<div class="widget-card widget-goal" role="button" tabindex="0" onclick="switchTab(\'cal\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();switchTab(\'cal\')}">' +
    '<div class="wc-top">' +
      '<span class="wc-kicker">Дневная цель</span>' +
      '<span class="wc-badge">' + pct + '%</span>' +
    '</div>' +
    '<div class="wc-ring-row">' +
      '<svg class="widget-ring" viewBox="0 0 48 48" aria-hidden="true">' +
        '<circle class="wr-bg" cx="24" cy="24" r="20" fill="none" stroke-width="4"/>' +
        '<circle class="wr-fg" cx="24" cy="24" r="20" fill="none" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + dashTotal + '" stroke-dashoffset="' + dashOffset + '"/>' +
      '</svg>' +
      '<div class="wc-ring-nums">' +
        '<div class="wc-val">' + done + (goal > 0 ? (' / ' + goal) : '') + '</div>' +
        '<div class="wc-sub">зикров сегодня</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function _renderWidgetNightCheckHtml() {
  var list = (typeof NIGHT_ORDER !== 'undefined' && Array.isArray(NIGHT_ORDER)) ? NIGHT_ORDER : [];
  var cl = (state && state.settings && state.settings.nightChecklist && state.settings.nightChecklist.date === todayKey() && Array.isArray(state.settings.nightChecklist.done))
    ? state.settings.nightChecklist.done
    : [];
  var validTotal = list.length || 10;
  var done = Math.min(validTotal, cl.length);

  return '<button type="button" class="widget-card widget-night" onclick="goNightList()">' +
    '<div class="wc-top">' +
      '<span class="wc-kicker">Ночное чтение</span>' +
      '<svg class="ico ico-sm wc-ico"><use href="#i-moon"/></svg>' +
    '</div>' +
    '<div class="wc-val">' + done + ' из ' + validTotal + '</div>' +
    '<div class="wc-sub">' + (done >= validTotal ? 'Всё прочитано сегодня' : 'Суры, дуа и тасбих перед сном') + '</div>' +
  '</button>';
}

function _renderWidgetMiniTasbihHtml() {
  var t = (typeof getById === 'function') ? (getById('tawhid') || (state && state.tasbihs && state.tasbihs[0])) : null;
  if (!t) return '';
  var cur = t.current || 0;
  var target = t.target || 33;
  var shortTitle = t.transcription || 'Тасбих';
  if (shortTitle.length > 28) shortTitle = shortTitle.slice(0, 26) + '…';

  return '<div class="widget-card widget-tasbih" role="button" tabindex="0" onclick="openCounter(\'' + escAttr(t.id) + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openCounter(\'' + escAttr(t.id) + '\')}">' +
    '<div class="wc-top">' +
      '<span class="wc-kicker">Быстрый тасбих</span>' +
      '<span class="wc-badge">' + cur + ' / ' + target + '</span>' +
    '</div>' +
    '<div class="wc-tasbih-ar ar-font" dir="rtl" lang="ar">' + esc(String(t.arabic || '').split(',')[0]) + '</div>' +
    '<div class="wc-tasbih-row">' +
      '<span class="wc-sub">' + esc(shortTitle) + '</span>' +
      '<button type="button" class="wc-tap-btn" onclick="event.stopPropagation();_widgetTapMiniTasbih(\'' + escAttr(t.id) + '\')" aria-label="Прибавить 1 к быстрому тасбиху">+1</button>' +
    '</div>' +
  '</div>';
}

function _renderWidgetDailyDhikrHtml() {
  var q112 = (typeof getQuranById === 'function') ? getQuranById('q112') : null;
  var ar = q112 ? String(q112.arabic || '').split('\n')[0] : 'قُلْ هُوَ ٱللَّهُ أَحَدٌ';
  var title = q112 ? q112.title : 'Аль-Ихлас';
  var actionId = q112 ? q112.id : 'q1';

  return '<button type="button" class="widget-card widget-ayah" onclick="openQuran(\'' + escAttr(actionId) + '\')">' +
    '<div class="wc-top">' +
      '<span class="wc-kicker">Сура для размышления</span>' +
      '<svg class="ico ico-sm wc-ico"><use href="#i-book"/></svg>' +
    '</div>' +
    '<div class="wc-ayah-ar ar-font" dir="rtl" lang="ar">' + esc(ar) + '</div>' +
    '<div class="wc-sub">' + esc(title) + ' · открыть с тафсиром</div>' +
  '</button>';
}

function renderDashboardWidgets() {
  var slot = document.getElementById('dash-widgets-slot');
  if (!slot) return;
  var enabled = _getEnabledWidgets();
  if (!enabled.length) {
    slot.innerHTML =
      '<div class="widgets-head-bar">' +
        '<span class="whb-title">Виджеты</span>' +
        '<button type="button" class="whb-btn" onclick="openWidgetsModal()">Настроить</button>' +
      '</div>';
    return;
  }

  var cards = enabled.map(function (id) {
    if (id === 'goal_ring') return _renderWidgetGoalRingHtml();
    if (id === 'night_check') return _renderWidgetNightCheckHtml();
    if (id === 'mini_tasbih') return _renderWidgetMiniTasbihHtml();
    if (id === 'daily_dhikr') return _renderWidgetDailyDhikrHtml();
    return '';
  }).filter(Boolean).join('');

  slot.innerHTML =
    '<div class="widgets-head-bar">' +
      '<span class="whb-title">Быстрые виджеты</span>' +
      '<button type="button" class="whb-btn" onclick="openWidgetsModal()">Настроить и установить</button>' +
    '</div>' +
    '<div class="dash-widgets-grid">' + cards + '</div>';
}

function openWidgetsModal() {
  var modal = document.getElementById('modal-content');
  var bg = document.getElementById('modal-bg');
  if (!modal || !bg) return;

  var enabled = _getEnabledWidgets();
  var togglesHtml = WIDGET_CATALOG.map(function (w) {
    var checked = enabled.indexOf(w.id) !== -1;
    return '<div class="wm-toggle-row">' +
      '<div class="wm-toggle-txt">' +
        '<div class="wm-toggle-title">' + esc(w.title) + '</div>' +
        '<div class="wm-toggle-desc">' + esc(w.desc) + '</div>' +
      '</div>' +
      '<label class="toggle"><input type="checkbox" ' + (checked ? 'checked' : '') + ' onchange="_toggleWidgetPref(\'' + escAttr(w.id) + '\')"><span class="slider"></span></label>' +
    '</div>';
  }).join('');

  var standaloneHtml = STANDALONE_WIDGETS.map(function (sw) {
    var fullUrl = sw.url;
    try {
      if (typeof iqraResolveUrl === 'function') {
        fullUrl = iqraResolveUrl(sw.url);
      } else if (typeof document !== 'undefined' && document.baseURI) {
        fullUrl = new URL(sw.url, document.baseURI).href;
      } else if (typeof location !== 'undefined' && location.href) {
        fullUrl = new URL(sw.url, location.href).href;
      }
    } catch (e) {}
    return '<div class="wm-shortcut-card">' +
      '<div class="wm-sc-title">' + esc(sw.title) + '</div>' +
      '<div class="wm-sc-desc">' + esc(sw.desc) + '</div>' +
      '<div class="wm-sc-actions">' +
        '<button type="button" class="btn secondary btn-inline" onclick="closeModal();renderStandaloneWidgetMode(\'' + escAttr(sw.id) + '\')">Открыть виджет</button>' +
        '<button type="button" class="btn secondary btn-inline" onclick="copyToClipboard(\'' + escAttr(fullUrl) + '\',\'Ссылка скопирована\')">Копировать URL</button>' +
      '</div>' +
    '</div>';
  }).join('');

  modal.className = 'modal widgets-modal';
  modal.innerHTML =
    '<div class="sm-top">' +
      '<div class="sm-drag" aria-hidden="true"></div>' +
      '<button type="button" class="sm-close" aria-label="Закрыть" onclick="closeModal()"><svg class="ico ico-sm"><use href="#i-x"/></svg></button>' +
    '</div>' +
    '<div class="wm-head">' +
      '<h2 class="wm-title">Виджеты приложения</h2>' +
      '<div class="wm-sub">Настройте карточки на главном экране или выведите отдельный виджет на экран «Домой»</div>' +
    '</div>' +
    '<div class="wm-scroll">' +
      '<div class="wm-sec-label">На главном экране</div>' +
      '<div class="wm-toggles">' + togglesHtml + '</div>' +
      '<div class="wm-sec-label">Автономные виджеты и ярлыки (PWA)</div>' +
      '<div class="wm-guide-box">' +
        '<b>Как установить виджет на экран Домой:</b><br>' +
        '• <b>iPhone / iPad (Safari):</b> нажмите «Поделиться» → «На экран Домой» или откройте нужный режим ниже и закрепите ярлык.<br>' +
        '• <b>Android (Chrome):</b> меню «⋮» → «Добавить на гл. экран», либо удерживайте иконку «Iqra» для быстрого запуска разделов.<br>' +
        '• <b>Компьютер:</b> нажмите «Установить» в адресной строке браузера.' +
      '</div>' +
      '<div class="wm-shortcuts">' + standaloneHtml + '</div>' +
    '</div>' +
    '<div class="sm-actions">' +
      '<button type="button" class="btn secondary sm-close-btn" onclick="closeModal()">Готово</button>' +
    '</div>';

  bg.style.backgroundColor = '';
  bg.style.backdropFilter = '';
  bg.style.webkitBackdropFilter = '';
  bg.classList.add('active');
}

function exitStandaloneWidgetMode() {
  document.body.classList.remove('widget-mode');
  var host = document.getElementById('standalone-widget-host');
  if (host) host.remove();
  try { history.replaceState(null, '', location.pathname); } catch (e) {}
  if (typeof goHome === 'function') goHome();
}

function renderStandaloneWidgetMode(mode) {
  var safeMode = (mode === 'night' || mode === 'stats' || mode === 'ayah') ? mode : 'dhikr';
  document.body.classList.add('widget-mode');

  var host = document.getElementById('standalone-widget-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'standalone-widget-host';
    host.className = 'standalone-widget-host';
    document.body.appendChild(host);
  }

  var cardHtml = '';
  if (safeMode === 'night') {
    cardHtml = _renderWidgetNightCheckHtml() +
      '<button type="button" class="btn" onclick="exitStandaloneWidgetMode();goNightList()">Открыть ночное чтение</button>';
  } else if (safeMode === 'stats') {
    var streak = (typeof calculateStreak === 'function') ? calculateStreak() : 0;
    cardHtml = _renderWidgetGoalRingHtml() +
      '<div class="sw-stat-line">Текущая серия дней: <b>' + streak + '</b></div>' +
      '<button type="button" class="btn" onclick="exitStandaloneWidgetMode();switchTab(\'cal\')">Открыть статистику</button>';
  } else if (safeMode === 'ayah') {
    cardHtml = _renderWidgetDailyDhikrHtml() +
      '<button type="button" class="btn" onclick="exitStandaloneWidgetMode();openQuran(\'q112\')">Открыть суру с тафсиром</button>';
  } else {
    cardHtml = _renderWidgetMiniTasbihHtml() +
      '<button type="button" class="btn secondary" onclick="exitStandaloneWidgetMode();openCounter(\'tawhid\')">Открыть полный счётчик</button>';
  }

  host.innerHTML =
    '<div class="sw-shell">' +
      '<div class="sw-brand">Iqra · Виджет</div>' +
      cardHtml +
      '<button type="button" class="btn secondary sw-home-btn" onclick="exitStandaloneWidgetMode()">Вернуться в полное приложение</button>' +
    '</div>';
}

window.renderDashboardWidgets = renderDashboardWidgets;
window.openWidgetsModal = openWidgetsModal;
window.renderStandaloneWidgetMode = renderStandaloneWidgetMode;
window.exitStandaloneWidgetMode = exitStandaloneWidgetMode;
window._toggleWidgetPref = _toggleWidgetPref;
window._widgetTapMiniTasbih = _widgetTapMiniTasbih;
