"use strict";

/* ============================================================
   MEMORIZE.JS — Режим заучивания (изучение + проверка + подсказка по словам)
   Проект «Икра» · v463
   D-06: mem-progress-bar через transform: scaleX().
   ============================================================ */

var memorizeHintWords = 0;

function _memorizeFormatText(raw) {
  var safe = esc(raw == null ? '' : raw);
  if (typeof IqraScholars !== 'undefined' && typeof IqraScholars.formatSacredTermsHtml === 'function') {
    return IqraScholars.formatSacredTermsHtml(safe);
  }
  return safe;
}

function _buildMemorizeArabicHtml(arText, revealed, hintCount) {
  var text = String(arText || '').trim();
  if (!text) return '';
  if (revealed) {
    return '<div class="mb-ar ar-font" dir="rtl" lang="ar">' + esc(text) + '</div>';
  }
  var words = text.split(/\s+/).filter(Boolean);
  var visibleCount = Math.max(0, Math.min(words.length, hintCount || 0));
  if (visibleCount === 0) {
    return '<div class="mb-ar ar-font hidden" dir="rtl" lang="ar">' + esc(text) + '</div>';
  }
  var shownPart = words.slice(0, visibleCount).join(' ');
  var hiddenPart = words.slice(visibleCount).join(' ');
  return '<div class="mb-ar ar-font mem-ar-words" dir="rtl" lang="ar">' +
    '<span class="mem-ar-word is-revealed">' + esc(shownPart) + '</span>' +
    (hiddenPart ? ' <span class="mem-ar-word hidden">' + esc(hiddenPart) + '</span>' : '') +
  '</div>';
}

function openMemorizeFor(item) {
  memorizeItem = item;
  memorizeAyahs = parseAyahs(item);
  if (!memorizeAyahs.length) { showMarkToast('Нет текста для заучивания', 3200); return; }
  memorizeStep = 0; memorizePhase = 'learn'; memorizeRevealed = false; memorizeHintWords = 0;
  renderMemorize();
  document.getElementById('memorize-mode').classList.add('active');
  saveNavContext();
}
function openMemorize(id) { const item = getQuranById(id); if (!item) return; trackEvent('memorize/' + id, 'Заучивание: ' + item.title); openMemorizeFor(item); }

function jumpMemorize(stepIdx) {
  if (!memorizeItem || !memorizeAyahs.length) return;
  var idx = Math.max(0, Math.min(memorizeAyahs.length - 1, parseInt(stepIdx, 10) || 0));
  memorizeStep = idx;
  memorizeRevealed = false;
  memorizeHintWords = 0;
  renderMemorize();
}

function setMemorizePhase(phase) {
  if (!memorizeItem || !memorizeAyahs.length) return;
  var next = (phase === 'test') ? 'test' : 'learn';
  if (memorizePhase === next) return;
  memorizePhase = next;
  memorizeRevealed = false;
  memorizeHintWords = 0;
  renderMemorize();
}

function resetMemorizeHints() {
  if (!memorizeItem || !memorizeAyahs.length) return;
  memorizeRevealed = false;
  memorizeHintWords = 0;
  renderMemorize();
}

function renderMemorize() {
  if (!memorizeItem) return;
  const total = memorizeAyahs.length;
  const a = memorizeAyahs[memorizeStep];
  if (!a) return;
  document.getElementById('mem-title').textContent = memorizeItem.title;
  const pct = ((memorizeStep + 1) / total) * 100;
  /* D-06: progress bar via transform: scaleX */
  var pb = document.getElementById('mem-progress-bar');
  if (pb) pb.style.transform = 'scaleX(' + (pct / 100) + ')';
  const phaseLabel = memorizePhase === 'learn' ? 'Заучивание' : 'Проверка';
  const phaseSegHtml =
    '<div class="seg mem-phase-seg" role="tablist" aria-label="Режим заучивания">' +
      '<button type="button" role="tab" aria-selected="' + (memorizePhase === 'learn' ? 'true' : 'false') + '" class="' + (memorizePhase === 'learn' ? 'active' : '') + '" onclick="setMemorizePhase(\'learn\')">Изучение</button>' +
      '<button type="button" role="tab" aria-selected="' + (memorizePhase === 'test' ? 'true' : 'false') + '" class="' + (memorizePhase === 'test' ? 'active' : '') + '" onclick="setMemorizePhase(\'test\')">Проверка</button>' +
    '</div>';
  const stepInfo = '<div class="mem-step"><span>' + phaseLabel + ' · Аят ' + (memorizeStep + 1) + ' из ' + total + '</span><span class="phase">' + (memorizePhase === 'learn' ? 'изучаем' : 'проверяем') + '</span></div>';

  var stepNavHtml = '';
  if (total > 1 && total <= 25) {
    stepNavHtml = '<div class="mem-step-chips" role="tablist" aria-label="Выбор аята">' +
      memorizeAyahs.map(function (_, idx) {
        var activeCls = idx === memorizeStep ? ' active' : '';
        return '<button type="button" class="mem-step-chip' + activeCls + '" onclick="jumpMemorize(' + idx + ')" aria-label="Аят ' + (idx + 1) + '"' + (idx === memorizeStep ? ' aria-current="step"' : '') + '>' + (idx + 1) + '</button>';
      }).join('') +
    '</div>';
  }

  let body = '';
  if (memorizePhase === 'learn') {
    var tafsirHtml = (typeof getSmartTafsirHtml === 'function') ? getSmartTafsirHtml(memorizeItem, memorizeStep + 1) : '';
    body = phaseSegHtml + stepInfo + stepNavHtml +
      '<div class="mem-block"><div class="mb-label">Арабский</div><div class="mb-ar ar-font" dir="rtl" lang="ar">' + esc(a.ar) + '</div></div>' +
      (a.tr ? '<div class="mem-block"><div class="mb-label">Транскрипция</div><div class="mb-text">' + esc(a.tr) + '</div></div>' : '') +
      '<div class="mem-block"><div class="mb-label">Перевод</div><div class="mb-text">' + _memorizeFormatText(a.trn) + '</div></div>' +
      tafsirHtml +
      '<div class="mem-body-note">' + transcriptionNote() + '</div>';
  } else {
    var words = String(a.ar || '').trim().split(/\s+/).filter(Boolean);
    var allHinted = words.length > 0 && memorizeHintWords >= words.length;
    var isShownAll = memorizeRevealed || allHinted;
    var hintLabel = memorizeHintWords === 0 ? 'Подсказка (2 слова)' : 'Ещё +2 слова (' + Math.min(words.length, memorizeHintWords) + '/' + words.length + ')';
    var hasAnyShown = isShownAll || memorizeHintWords > 0;
    var controlsHtml = '<div class="mem-hint-actions">' +
      (!isShownAll && words.length > 2 ? '<button type="button" class="mem-hint-btn" onclick="revealMemorizeHint()"><svg class="ico ico-sm"><use href="#i-lightbulb"/></svg><span>' + esc(hintLabel) + '</span></button>' : '') +
      (!isShownAll ? '<button type="button" class="mem-reveal-btn" onclick="revealMemorize()"><svg class="ico ico-sm"><use href="#i-eye"/></svg><span>Показать целиком</span></button>' : '') +
      (hasAnyShown ? '<button type="button" class="mem-reset-btn" onclick="resetMemorizeHints()"><svg class="ico ico-sm"><use href="#i-rotate-ccw"/></svg><span>Спрятать обратно</span></button>' : '') +
    '</div>';
    var arStateLabel = isShownAll ? '· открыт' : (memorizeHintWords > 0 ? '· подсказка' : '· вспомни');
    body = phaseSegHtml + stepInfo + stepNavHtml +
      '<div class="mem-block"><div class="mb-label">Перевод (подсказка)</div><div class="mb-text">' + _memorizeFormatText(a.trn) + '</div></div>' +
      '<div class="mem-block"><div class="mb-label">Арабский ' + arStateLabel + '</div>' +
        _buildMemorizeArabicHtml(a.ar, isShownAll, memorizeHintWords) +
        controlsHtml +
      '</div>';
  }
  document.getElementById('mem-body').innerHTML = body;
  const nextBtn = document.getElementById('mem-next');
  const prevBtn = document.getElementById('mem-prev');
  if (memorizePhase === 'learn') nextBtn.innerHTML = (memorizeStep === total-1 ? 'К проверке' : 'Далее') + '<svg class="ico ico-sm"><use href="#i-arrow-right"/></svg>';
  else nextBtn.innerHTML = memorizeStep === total-1 ? 'Готово<svg class="ico ico-sm"><use href="#i-check"/></svg>' : 'Далее<svg class="ico ico-sm"><use href="#i-arrow-right"/></svg>';
  prevBtn.innerHTML = memorizeStep === 0 && memorizePhase === 'learn' ? 'Закрыть' : '<svg class="ico ico-sm"><use href="#i-arrow-left"/></svg>Назад';
}

function revealMemorizeHint() {
  var a = memorizeAyahs[memorizeStep];
  if (!a) return;
  var totalWords = String(a.ar || '').trim().split(/\s+/).filter(Boolean).length;
  memorizeHintWords = Math.min(totalWords, (memorizeHintWords || 0) + 2);
  if (totalWords > 0 && memorizeHintWords >= totalWords) memorizeRevealed = true;
  renderMemorize();
}

function revealMemorize() { memorizeRevealed = true; renderMemorize(); }
function memPrev() {
  if (memorizePhase === 'test' && memorizeStep === 0) { memorizePhase = 'learn'; memorizeRevealed = false; memorizeHintWords = 0; renderMemorize(); return; }
  if (memorizeStep > 0) { memorizeStep--; memorizeRevealed = false; memorizeHintWords = 0; renderMemorize(); }
  else closeMemorize();
}
function memNext() {
  const total = memorizeAyahs.length;
  if (memorizePhase === 'learn') {
    if (memorizeStep < total - 1) { memorizeStep++; memorizeRevealed = false; memorizeHintWords = 0; renderMemorize(); }
    else { memorizePhase = 'test'; memorizeStep = 0; memorizeRevealed = false; memorizeHintWords = 0; renderMemorize(); }
  } else {
    if (memorizeStep < total - 1) { memorizeStep++; memorizeRevealed = false; memorizeHintWords = 0; renderMemorize(); }
    else {
      var doneItem = memorizeItem;
      closeMemorize();
      if (typeof IqraPlatform !== 'undefined' && typeof IqraPlatform.safeVibrate === 'function') {
        IqraPlatform.safeVibrate([30, 40, 30], { ignoreSetting: true });
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([30, 40, 30]);
      }
      var markedNew = false;
      if (doneItem && doneItem.id) {
        const q = getQuranById(doneItem.id);
        if (q && !q.learned) { q.learned = true; q.learnedAt = todayKey(); markedNew = true; save(); }
        const d = getDuaById(doneItem.id);
        if (d && !d.learned) { d.learned = true; markedNew = true; save(); }
        const h = getHadithById(doneItem.id);
        if (h && !h.learned) { h.learned = true; markedNew = true; save(); }
        if (markedNew) {
          var scrQ = document.getElementById('screen-quran-detail');
          var scrD = document.getElementById('screen-dua-detail');
          var scrH = document.getElementById('screen-hadith-detail');
          if (scrQ && scrQ.classList.contains('active') && activeQuranId === doneItem.id && typeof openQuran === 'function') openQuran(doneItem.id, null, true);
          else if (scrD && scrD.classList.contains('active') && activeDuaId === doneItem.id && typeof openDua === 'function') openDua(doneItem.id);
          else if (scrH && scrH.classList.contains('active') && activeHadithId === doneItem.id && typeof openHadith === 'function') openHadith(doneItem.id);
        }
      }
      if (typeof showMarkToast === 'function') {
        showMarkToast(markedNew ? 'Отмечено как выученное' : 'Проверка завершена');
      }
    }
  }
}
function closeMemorize() {
  document.getElementById('memorize-mode').classList.remove('active');
  memorizeItem = null; memorizeAyahs = []; memorizeStep = 0; memorizePhase = 'learn'; memorizeRevealed = false; memorizeHintWords = 0;
  saveNavContext();
}

(function _bindMemorizeKeys() {
  if (typeof document === 'undefined' || !document.addEventListener) return;
  document.addEventListener('keydown', function (e) {
    var mode = document.getElementById('memorize-mode');
    if (!mode || !mode.classList.contains('active')) return;
    var modalBg = document.getElementById('modal-bg');
    if (modalBg && modalBg.classList.contains('active')) return;
    var tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); memNext(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); memPrev(); }
  });
})();

window.revealMemorizeHint = revealMemorizeHint;
window.jumpMemorize = jumpMemorize;
window.setMemorizePhase = setMemorizePhase;
window.resetMemorizeHints = resetMemorizeHints;
window._buildMemorizeArabicHtml = _buildMemorizeArabicHtml;
