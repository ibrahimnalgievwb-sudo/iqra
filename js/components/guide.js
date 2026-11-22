"use strict";

/* ============================================================
   GUIDE.JS — Ненавязчивое контекстное обучение по экранам
   Проект «Икра» · v450
   Показывается один раз при первом посещении экрана (после онбординга)
   или вручную по кнопке «?» в шапке экрана. Без эмодзи и давления.
   ============================================================ */

var _activeManualGuide = {};

function _getGuideConfig(screenKey) {
  if (typeof IqraArchitecture === 'undefined' || !IqraArchitecture.SCREEN_GUIDES) return null;
  return IqraArchitecture.SCREEN_GUIDES[screenKey] || null;
}

function isGuideDismissed(screenKey) {
  return !!(state && state.settings && state.settings.seenGuides && state.settings.seenGuides[screenKey]);
}

function renderScreenGuideSlot(screenKey) {
  var slot = document.getElementById('guide-slot-' + screenKey);
  if (!slot) return;

  var cfg = _getGuideConfig(screenKey);
  if (!cfg) { slot.innerHTML = ''; return; }

  var onboarded = !!(state && state.migrations && state.migrations.onboarded);
  var forced = !!_activeManualGuide[screenKey];
  var dismissed = isGuideDismissed(screenKey);

  if (!forced && (!onboarded || dismissed)) {
    slot.innerHTML = '';
    return;
  }

  var itemsHtml = cfg.items.map(function (line) {
    return '<li>' + esc(line) + '</li>';
  }).join('');

  slot.innerHTML =
    '<aside class="screen-guide-card" aria-label="Подсказка по разделу">' +
      '<div class="sgc-head">' +
        '<div class="sgc-title-wrap">' +
          '<svg class="ico ico-sm sgc-ico"><use href="#i-info"/></svg>' +
          '<span class="sgc-kicker">Коротко о разделе</span>' +
        '</div>' +
        '<button type="button" class="sgc-close" onclick="dismissScreenGuide(\'' + escAttr(screenKey) + '\')" aria-label="Скрыть подсказку">' +
          '<svg class="ico ico-sm"><use href="#i-x"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="sgc-title">' + esc(cfg.title) + '</div>' +
      '<ul class="sgc-list">' + itemsHtml + '</ul>' +
      '<div class="sgc-foot">' +
        '<button type="button" class="btn secondary btn-inline sgc-ok" onclick="dismissScreenGuide(\'' + escAttr(screenKey) + '\')">Понятно</button>' +
      '</div>' +
    '</aside>';
}

function dismissScreenGuide(screenKey) {
  _activeManualGuide[screenKey] = false;
  if (state && state.settings) {
    if (!state.settings.seenGuides || typeof state.settings.seenGuides !== 'object') {
      state.settings.seenGuides = {};
    }
    state.settings.seenGuides[screenKey] = true;
    save();
  }
  renderScreenGuideSlot(screenKey);
}

function toggleScreenGuide(screenKey) {
  var slot = document.getElementById('guide-slot-' + screenKey);
  if (!slot) return;
  var currentlyVisible = slot.innerHTML.trim() !== '';
  if (currentlyVisible) {
    dismissScreenGuide(screenKey);
  } else {
    _activeManualGuide[screenKey] = true;
    renderScreenGuideSlot(screenKey);
  }
}

function resetAllScreenGuides() {
  if (state && state.settings) {
    state.settings.seenGuides = {};
    save();
  }
  _activeManualGuide = {};
  if (typeof showMarkToast === 'function') {
    showMarkToast('Подсказки по разделам снова включены');
  }
  renderScreenGuideSlot('settings');
}
