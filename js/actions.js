"use strict";

/* ============================================================
   ACTIONS.JS — безопасное делегирование событий (v460)
   Элементы несут data-click / data-input / data-change с JSON-шагами.
   Вызываются ТОЛЬКО функции из явного белого списка ALLOWED_ACTIONS,
   а служебные @click / @removeClass ограничены разрешёнными целями.
   ============================================================ */
(function () {
  var ALLOWED_ACTIONS = new Set([
    'toggleScreenGuide', 'switchTab', 'openSearch', 'openSettings', 'goHome',
    'openNight', 'goNightList', 'openFavorites', 'openDua', 'openHadith', 'openQuran',
    'setQuranFilter', 'debouncedRenderTasbih', 'renderTasbih', 'openForm',
    'goDetailBack', 'goTasbihList', 'goQuranList', 'goDuaList', 'goHadithList',
    'shareCurrent', 'resetCurrent', 'editCurrent', 'tap', 'goNext', 'cancelForm',
    'updatePreview', 'stepTarget', 'saveForm', 'deleteCurrent',
    'debouncedRenderQuranList', 'detailStarClick', 'setProgTab', 'setPathMode',
    'debouncedRenderPath', 'clearPathSearch', 'setPathTypeFilter', 'setLibraryTab',
    'setTheme', 'setArSize', 'setDailyGoal',
    'setSmartReminderEnabled', 'setSmartReminderNotify', 'setSmartReminderCategory',
    'setSmartReminderQuiet', 'unmuteSmartRemindersToday',
    'addReminder', 'setReminderPreset', 'testReminderNotification',
    'setPrayerPref', 'resetAllScreenGuides', 'exportData', 'exportCSV',
    'importData', 'resetAll', 'closeRead', 'addBookmarkFromRead',
    'scrollToTopRead', 'readPrevSurah', 'readNextSurah', 'closeMemorize',
    'memPrev', 'memNext', 'debouncedRenderGlobalSearch', 'closeSearch',
    'setSearchFilter', 'closeModal', 'finishOnboarding', 'setOnboardingTheme',
    'setOnboardingSize', 'prevOnboarding', 'nextOnboarding', 'installPWA',
    'dismissInstall', 'runTajweedDiagnostics', 'copyDebugOutput',
    'testScreenTajweed', 'dashQuoteTap', 'openWidgetsModal',
    'cycleSmartReminder', 'dismissSmartReminderToday', 'openTafsirReader',
    'copyTafsirReader', 'revealMemorizeHint', 'jumpMemorize',
    'copyCurrent', 'setTargetPreset', 'debouncedRenderLibrary', 'clearLibrarySearch',
    'setDuaFilter', 'setHadithFilter', 'toggleReaderTranscription', 'stepReaderArSize',
    'setMemorizePhase', 'resetMemorizeHints', 'resetNightChecklistToday',
    'clearProgFilter', 'copyAyah', 'copyLibraryItem', 'setAnalyticsPref'
  ]);

  var ALLOWED_CLICK_TARGETS = {
    'import-file': true
  };

  var ALLOWED_REMOVE_CLASS_TARGETS = {
    'debug-overlay': { active: true }
  };

  function resolve(a, el, ev) {
    if (a && typeof a === 'object' && typeof a.$ === 'string') {
      switch (a.$) {
        case 'event': return ev;
        case 'value': return el.value;
        case 'checked': return el.checked;
        case 'el': return el;
      }
      return undefined;
    }
    return a;
  }

  function run(raw, el, ev) {
    var steps;
    try { steps = JSON.parse(raw); } catch (e) { return; }
    if (!Array.isArray(steps)) return;
    for (var i = 0; i < steps.length; i++) {
      var s = steps[i];
      if (s === '@stop') { if (ev && ev.stopPropagation) ev.stopPropagation(); continue; }
      if (s === '@prevent') { if (ev && ev.preventDefault) ev.preventDefault(); continue; }
      if (s === '@self') { if (ev && ev.target !== el) return; continue; }
      if (!Array.isArray(s) || typeof s[0] !== 'string') continue;
      var n = s[0];
      if (n === '@click') {
        var clickId = typeof s[1] === 'string' ? s[1] : '';
        if (!Object.prototype.hasOwnProperty.call(ALLOWED_CLICK_TARGETS, clickId)) continue;
        var t = document.getElementById(clickId);
        if (t) t.click();
        continue;
      }
      if (n === '@removeClass') {
        var targetId = typeof s[1] === 'string' ? s[1] : '';
        var clsName = typeof s[2] === 'string' ? s[2] : '';
        var allowedCls = ALLOWED_REMOVE_CLASS_TARGETS[targetId];
        if (!allowedCls || !Object.prototype.hasOwnProperty.call(allowedCls, clsName)) continue;
        var u = document.getElementById(targetId);
        if (u) u.classList.remove(clsName);
        continue;
      }
      if (!ALLOWED_ACTIONS.has(n)) continue;
      var fn = window[n];
      if (typeof fn !== 'function' || /\[native code\]/.test(Function.prototype.toString.call(fn))) continue;
      fn.apply(null, s.slice(1).map(function (a) { return resolve(a, el, ev); }));
    }
  }

  function listen(type, attr) {
    document.addEventListener(type, function (ev) {
      for (var el = ev.target; el && el !== document; el = el.parentNode) {
        if (el.nodeType === 1 && el.hasAttribute(attr)) {
          run(el.getAttribute(attr), el, ev);
          if (ev.cancelBubble) break;
        }
      }
    });
  }

  listen('click', 'data-click');
  listen('input', 'data-input');
  listen('change', 'data-change');
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    var el = ev.target;
    if (!el || el.nodeType !== 1 || !el.hasAttribute('data-click')) return;
    var tag = el.tagName;
    if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    ev.preventDefault();
    run(el.getAttribute('data-click'), el, ev);
  });
  var rb = document.getElementById('read-body');
  if (rb) rb.addEventListener('scroll', function () { if (typeof window.toggleScrollTop === 'function') window.toggleScrollTop(); }, { passive: true });
  window.__iqraActions = {
    run: run,
    isAllowedAction: function (name) { return ALLOWED_ACTIONS.has(name); }
  };
})();