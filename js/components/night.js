"use strict";

/* ============================================================
   NIGHT.JS — Ночное чтение (суры, аяты, тасбих Фатимы, чек-лист, тафсир)
   Проект «Икра» · v460
   ============================================================ */

var _fatimaStageCounts = [0, 0, 0];

function _nightPluralRaz(n) {
  var mod10 = n % 10, mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return n + ' раза';
  return n + ' раз';
}

function _nightLinkify(html) {
  var out = (typeof IqraScholars !== 'undefined' && typeof IqraScholars.linkifyScholars === 'function')
    ? IqraScholars.linkifyScholars(html)
    : html;
  if (typeof IqraScholars !== 'undefined' && typeof IqraScholars.formatSacredTermsHtml === 'function') {
    out = IqraScholars.formatSacredTermsHtml(out);
  }
  return out;
}

function _getFatimaTasbihItem() {
  return {
    id: 'fatima_tasbih',
    type: 'nightTasbih',
    title: 'Тасбих перед сном (завет Фатимы)',
    subtitle: 'Субханаллах (33) · Альхамдулиллях (33) · Аллаху Акбар (34)',
    arabic: 'سُبْحَانَ اللَّهِ (٣٣) · الْحَمْدُ لِلَّهِ (٣٣) · اللَّهُ أَكْبَرُ (٣٤)',
    transcription: 'Субханаллах (33) · Альхамдулиллях (33) · Аллаху Акбар (34)',
    translation: 'Слава Аллаху (33 раза), хвала Аллаху (33 раза), Аллах Превелик (34 раза).',
    note: 'Когда Фатима (да будет доволен ею Аллах) попросила у Пророка (да благословит его Аллах и приветствует) слугу для помощи по дому, Пророк (да благословит его Аллах и приветствует) сказал ей и ‘Али (да будет доволен им Аллах): «Не указать ли мне вам на нечто лучшее, чем слуга? Когда вы будете ложиться в постель, произносите слова «Аллаху Акбар» тридцать четыре раза, «Субханаллах» — тридцать три раза и «Альхамдулиллях» — тридцать три раза. Поистине, это лучше для вас, чем слуга» (Сахих аль-Бухари № 3113, Сахих Муслим № 2727).',
    source: 'Сахих аль-Бухари (№ 3113, № 3705), Сахих Муслим (№ 2727)'
  };
}

function _resolveNightEntry(n) {
  if (!n) return null;
  if (n.quranId) return getQuranById(n.quranId);
  if (n.duaId) return getDuaById(n.duaId);
  if (n.hadithId) return getHadithById(n.hadithId);
  if (n.nightTasbih || n.id === 'fatima_tasbih') return _getFatimaTasbihItem();
  return null;
}

function _getNightChecklist() {
  var today = (typeof todayKey === 'function') ? todayKey() : '';
  if (!state || !state.settings) return { date: today, done: [] };
  var cur = state.settings.nightChecklist;
  if (!cur || typeof cur !== 'object' || cur.date !== today || !Array.isArray(cur.done)) {
    state.settings.nightChecklist = { date: today, done: [] };
  }
  return state.settings.nightChecklist;
}

function _isNightIdxDone(idx) {
  var cl = _getNightChecklist();
  return cl.done.indexOf(idx) !== -1;
}

function _setNightIdxDone(idx, val) {
  var cl = _getNightChecklist();
  var pos = cl.done.indexOf(idx);
  if (val && pos === -1) cl.done.push(idx);
  else if (!val && pos !== -1) cl.done.splice(pos, 1);
  if (typeof save === 'function') save();
}

function toggleNightChecklist(idx, fromDetail) {
  var nextVal = !_isNightIdxDone(idx);
  _setNightIdxDone(idx, nextVal);
  if (state && state.settings && state.settings.vibrate && navigator.vibrate) {
    navigator.vibrate(nextVal ? [15, 25, 15] : 10);
  }
  if (fromDetail) {
    openNight(idx);
  } else {
    renderNightList();
  }
}

function resetNightChecklistToday() {
  var cl = _getNightChecklist();
  cl.done = [];
  if (typeof save === 'function') save();
  renderNightList();
  if (typeof showMarkToast === 'function') showMarkToast('Вечерний список очищен');
}
window.resetNightChecklistToday = resetNightChecklistToday;

function renderNightList() {
  var el = document.getElementById('night-list');
  if (!el) return;

  var validEntries = [];
  NIGHT_ORDER.forEach(function (n, i) {
    var it = _resolveNightEntry(n);
    if (it) validEntries.push({ idx: i, entry: n, item: it });
  });

  var doneCount = validEntries.filter(function (v) { return _isNightIdxDone(v.idx); }).length;
  var totalCount = validEntries.length;
  var ratio = totalCount ? Math.min(1, Math.max(0, doneCount / totalCount)) : 0;

  var introText =
    '<b>Что читать перед сном по достоверным хадисам</b><br>' +
    'Суры «Аль-Ихлас», «Аль-Фаляк» и «Ан-Нас» по 3 раза с дуновением на ладони и протиранием тела (Сахих аль-Бухари № 5017), ' +
    'Аят аль-Курси (аль-Бухари № 2311), два последних аята суры «Аль-Бакара» (аль-Бухари № 5009, Муслим № 807), ' +
    'суру «Аль-Мульк» (ат-Тирмизи № 2891, Абу Дауд № 1400), суру «Аль-Кафирун» перед сном (Абу Дауд № 5055, ат-Тирмизи № 3403), ' +
    'пророческое дуа перед сном (аль-Бухари № 6320, Муслим № 2714) и тасбих Фатимы — 33 «Субханаллах», 33 «Альхамдулиллях», 34 «Аллаху Акбар» (аль-Бухари № 3113, Муслим № 2727).';

  var html =
    '<div class="night-note">' + _nightLinkify(introText) + '</div>' +
    '<div class="night-progress-card">' +
      '<div class="npc-top">' +
        '<span class="npc-label">Вечерний прогресс сегодня</span>' +
        '<span class="npc-actions">' +
          '<span class="npc-val">' + doneCount + ' из ' + totalCount + '</span>' +
          (doneCount > 0 ? '<button type="button" class="npc-reset-btn" onclick="resetNightChecklistToday()" aria-label="Сбросить вечерний прогресс">Сбросить</button>' : '') +
        '</span>' +
      '</div>' +
      '<div class="npc-bar"><div class="npc-bar-fill" style="transform:scaleX(' + ratio.toFixed(4) + ')"></div></div>' +
      (doneCount === totalCount && totalCount > 0 ? '<div class="night-done-banner"><svg class="ico ico-sm"><use href="#i-check"/></svg><span>Вечернее чтение полностью завершено сегодня. Да примет Аллах!</span></div>' : '') +
    '</div>';

  validEntries.forEach(function (v) {
    var n = v.entry;
    var it = v.item;
    var i = v.idx;
    var done = _isNightIdxDone(i);
    var sub = '';
    if (n.quranId) {
      sub = [it.subtitle, n.times ? ('Читать ' + _nightPluralRaz(n.times)) : ''].filter(Boolean).join(' · ');
    } else {
      sub = it.subtitle || '';
    }
    var ar = String(it.arabic || '').split('\n')[0] || '';
    var trn = String(it.translation || '').split('\n')[0] || '';

    html +=
      '<div class="content-card has-num night-card ' + (done ? 'is-done' : '') + '" role="button" tabindex="0" onclick="openNight(' + i + ')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openNight(' + i + ')}">' +
        '<div class="c-num">' + (i + 1) + '</div>' +
        '<button type="button" class="night-check-btn ' + (done ? 'done' : '') + '" aria-label="' + (done ? 'Снять отметку выполнения' : 'Отметить выполненным сегодня') + ': ' + escAttr(it.title) + '" onclick="event.stopPropagation();toggleNightChecklist(' + i + ',false)">' +
          '<svg class="ico ico-sm"><use href="#i-check"/></svg>' +
        '</button>' +
        '<div class="c-title">' + esc(it.title) + '</div>' +
        (sub ? '<div class="c-sub">' + esc(sub) + '</div>' : '') +
        '<div class="c-ar ar-font" dir="rtl" lang="ar">' + esc(ar) + '</div>' +
        '<div class="c-tr">' + esc(trn) + '</div>' +
      '</div>';
  });

  el.innerHTML = html;
}

function _buildFatimaStepperHtml(idx) {
  var stages = [
    { name: 'Субханаллах', ar: 'سُبْحَانَ اللَّهِ', trn: 'Слава Аллаху', target: 33 },
    { name: 'Альхамдулиллях', ar: 'الْحَمْدُ لِلَّهِ', trn: 'Хвала Аллаху', target: 33 },
    { name: 'Аллаху Акбар', ar: 'اللَّهُ أَكْبَرُ', trn: 'Аллах Превелик', target: 34 }
  ];
  var activeStage = 0;
  if (_fatimaStageCounts[0] >= 33) activeStage = 1;
  if (_fatimaStageCounts[0] >= 33 && _fatimaStageCounts[1] >= 33) activeStage = 2;
  var totalDone = _fatimaStageCounts[0] + _fatimaStageCounts[1] + _fatimaStageCounts[2];
  var isComplete = totalDone >= 100;
  var cur = stages[activeStage];

  var stagePills = stages.map(function (st, sIdx) {
    var done = _fatimaStageCounts[sIdx] >= st.target;
    var active = !isComplete && sIdx === activeStage;
    return '<div class="fs-stage ' + (active ? 'active' : '') + ' ' + (done ? 'done' : '') + '">' +
      '<div class="fs-stage-name">' + esc(st.name) + '</div>' +
      '<div class="fs-stage-count">' + _fatimaStageCounts[sIdx] + ' / ' + st.target + '</div>' +
    '</div>';
  }).join('');

  return '<div class="fatima-stepper">' +
    '<div class="fs-stages">' + stagePills + '</div>' +
    '<div class="fs-active-box">' +
      '<div class="fs-active-ar ar-font" dir="rtl" lang="ar">' + esc(isComplete ? 'لَا إِلَٰهَ إِلَّا اللَّهُ' : cur.ar) + '</div>' +
      '<div class="fs-active-tr">' + esc(isComplete ? 'Тасбих завершён (100 / 100)' : cur.name) + '</div>' +
      '<div class="fs-active-trn">' + esc(isComplete ? 'Пусть Всевышний Аллах примет ваш ночной зикр.' : cur.trn) + '</div>' +
    '</div>' +
    '<div class="fs-controls">' +
      '<button type="button" class="btn fs-tap-btn" onclick="tapFatimaNightTasbih(' + idx + ')">' +
        (isComplete ? 'Повторить заново' : ('Произнести (+1) · ' + _fatimaStageCounts[activeStage] + ' / ' + cur.target)) +
      '</button>' +
      '<button type="button" class="btn secondary fs-reset-btn" onclick="resetFatimaNightTasbih(' + idx + ')" aria-label="Сбросить тасбих Фатимы"><svg class="ico ico-sm"><use href="#i-rotate-ccw"/></svg></button>' +
    '</div>' +
  '</div>';
}

function tapFatimaNightTasbih(idx) {
  var totalBefore = _fatimaStageCounts[0] + _fatimaStageCounts[1] + _fatimaStageCounts[2];
  if (totalBefore >= 100) {
    _fatimaStageCounts = [0, 0, 0];
    openNight(idx);
    return;
  }
  if (_fatimaStageCounts[0] < 33) _fatimaStageCounts[0]++;
  else if (_fatimaStageCounts[1] < 33) _fatimaStageCounts[1]++;
  else if (_fatimaStageCounts[2] < 34) _fatimaStageCounts[2]++;

  var totalAfter = _fatimaStageCounts[0] + _fatimaStageCounts[1] + _fatimaStageCounts[2];
  if (typeof addToHistory === 'function') addToHistory('fatima_tasbih', 1);
  if (state && state.settings && state.settings.vibrate && navigator.vibrate) {
    navigator.vibrate(totalAfter === 100 ? [25, 45, 25] : 10);
  }
  if (totalAfter === 100) {
    _setNightIdxDone(idx, true);
    if (typeof showMarkToast === 'function') showMarkToast('Тасбих перед сном выполнен (100)');
  }
  if (typeof save === 'function') save();
  openNight(idx);
}

function resetFatimaNightTasbih(idx) {
  _fatimaStageCounts = [0, 0, 0];
  openNight(idx);
}

function openNight(idx) {
  activeNightId = idx;
  var n = NIGHT_ORDER[idx];
  if (!n) return;
  var item = _resolveNightEntry(n);
  if (!item) return;

  trackEvent('night/' + idx, 'Ночное чтение: пункт ' + (idx + 1));
  document.getElementById('night-detail-title').textContent = item.title;

  var subParts = [];
  if (item.subtitle) subParts.push(item.subtitle);
  if (n.times > 1 && !n.nightTasbih) subParts.push('Читать ' + _nightPluralRaz(n.times));
  var subStr = subParts.join(' · ');

  var noteContent = item.note
    ? ((typeof IqraDalil !== 'undefined' && typeof IqraDalil.renderNoteBlocksHtml === 'function')
        ? IqraDalil.renderNoteBlocksHtml(item.note, { linkify: _nightLinkify })
        : _nightLinkify(escNl(item.note)))
    : '';

  var isDone = _isNightIdxDone(idx);
  var bodyMainHtml = '';
  if (n.nightTasbih || n.id === 'fatima_tasbih') {
    bodyMainHtml = _buildFatimaStepperHtml(idx);
  } else {
    var ayahs = parseAyahs(item);
    bodyMainHtml = ayahs.map(function (a, aIdx) {
      var tafsirHtml = (typeof getSmartTafsirHtml === 'function' && n.quranId)
        ? getSmartTafsirHtml(item, aIdx + 1)
        : '';
      return '<div class="read-ayah ' + (item.type === 'ayat' ? 'ayat-mode' : '') + '">' +
        '<div class="read-ayah-num">' + esc(a.num) + '</div>' +
        '<div class="read-ayah-ar ar-font" dir="rtl" lang="ar">' + esc(a.ar) + (item.type === 'surah' ? ' <span class="read-ayah-marker">' + ayahMarker(a.num) + '</span>' : '') + '</div>' +
        (a.tr ? '<div class="read-ayah-tr">' + esc(a.tr) + '</div>' : '') +
        '<div class="read-ayah-trn">' + _nightLinkify(esc(a.trn)) + '</div>' +
        tafsirHtml +
      '</div>';
    }).join('');
  }

  var ecoNodeId = n.quranId
    ? ('quran:' + n.quranId)
    : (n.duaId ? ('dua:' + n.duaId) : (n.hadithId ? ('hadith:' + n.hadithId) : 'hadith:h_fatima_tasbih'));

  var hasPrev = idx > 0;
  var hasNext = idx < NIGHT_ORDER.length - 1;

  var el = document.getElementById('night-detail-content');
  el.innerHTML =
    '<div class="detail-hero">' +
      '<div class="dh-title">' + esc(item.title) + '</div>' +
      (subStr ? '<div class="dh-sub">' + esc(subStr) + '</div>' : '') +
    '</div>' +
    '<button type="button" class="learned-toggle ' + (isDone ? 'done' : '') + '" onclick="toggleNightChecklist(' + idx + ',true)">' +
      '<span class="lt-icon"><svg class="ico ico-sm"><use href="' + (isDone ? '#i-check' : '#i-moon') + '"/></svg></span>' +
      '<span class="lt-body">' +
        '<span class="lt-title">' + (isDone ? 'Прочитано сегодня' : 'Отметить как выполненное сегодня') + '</span>' +
        '<span class="lt-sub">' + (isDone ? 'Нажмите, чтобы снять отметку на сегодня' : 'Чек-лист обновляется каждый день') + '</span>' +
      '</span>' +
    '</button>' +
    bodyMainHtml +
    (item.note ? '<div class="note-box"><svg class="ico ico-sm note-box-ico"><use href="#i-lightbulb"/></svg><div class="note-box-body">' + noteContent + '</div></div>' : '') +
    (item.source ? '<div class="dh-section detail-source-block"><div class="dh-label">Источник</div><div class="dh-text muted detail-source-text">' + _nightLinkify(esc(item.source)) + '</div></div>' : '') +
    (typeof renderEcosystemSection === 'function' ? renderEcosystemSection(ecoNodeId, { title: 'Связи в Умной книге' }) : '') +
    (!n.nightTasbih ? transcriptionNote() : '') +
    '<div class="detail-actions">' +
      (n.quranId ? '<button type="button" class="btn secondary" onclick="openRead(\'' + escAttr(item.id) + '\')"><svg class="ico ico-sm"><use href="#i-book"/></svg>Читать</button>' : '') +
      (!n.nightTasbih ? '<button type="button" class="btn secondary" onclick="memorizeFromNight(' + idx + ')"><svg class="ico ico-sm"><use href="#i-lightbulb"/></svg>Заучить</button>' : '') +
    '</div>' +
    '<div class="night-detail-nav">' +
      (hasPrev ? '<button type="button" class="btn secondary" onclick="openNight(' + (idx - 1) + ')"><svg class="ico ico-sm"><use href="#i-arrow-left"/></svg>Предыдущее</button>' : '<span></span>') +
      (hasNext ? '<button type="button" class="btn secondary" onclick="openNight(' + (idx + 1) + ')">Следующее<svg class="ico ico-sm"><use href="#i-arrow-right"/></svg></button>' : '<span></span>') +
    '</div>';

  showScreen('screen-night-detail');
}

function memorizeFromNight(idx) {
  var n = NIGHT_ORDER[idx];
  if (!n) return;
  var item = _resolveNightEntry(n);
  if (item && !n.nightTasbih) openMemorizeFor(item);
}

function goNightList() { activeNightId = null; renderNightList(); showScreen('screen-night'); }

window.toggleNightChecklist = toggleNightChecklist;
window.tapFatimaNightTasbih = tapFatimaNightTasbih;
window.resetFatimaNightTasbih = resetFatimaNightTasbih;