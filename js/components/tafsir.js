"use strict";

/* ============================================================
   TAFSIR.JS — Единая разметка тафсира + полноэкранный режим чтения
   Проект «Икра» · v460
   Зависимости (глобальные): esc, escNl, escAttr, getTafsirForAyah,
   openScholarInfo (scholar-modal.js), IqraScholars.
   ============================================================ */

/* Пояснения к терминам, которые подсказываются читателю в тексте тафсира */
const TAFSIR_TERMS = {
  'тасмию': '(произнесение «Бисмиллях»)',
  'тасмия': '(произнесение «Бисмиллях»)',
  'тасмии': '(произнесения «Бисмиллях»)',
  'басмаллы': '(фразы «Бисмиллях»)',
  'басмалла': '(фраза «Бисмиллях»)',
  'исраилят': '(предания израильтян)',
  'исраилийят': '(предания израильтян)',
  'иснадом': '(цепочкой передатчиков)',
  'иснад': '(цепочка передатчиков)',
  'кадариты': '(секта, отрицающая предопределение)',
  'джабриты': '(секта, отрицающая свободу воли)'
};

/* Резервный список имён на случай отсутствия IqraScholars */
const TAFSIR_SCHOLARS = [
  { names: ['Ибн ‘Аббас', 'Ибн Аббас', 'Ибн ‘Аббаса', 'Ибн Аббаса'], id: 'ibn_abbas' },
  { names: ['Абу Хурайра', 'Абу Хурайры'], id: 'abu_hurayra' },
  { names: ['Умм Салама', 'Умм Саламы'], id: 'umm_salama' },
  { names: ['‘Аиша', '‘Аиши', 'Аиша', 'Аиши'], id: 'aisha' },
  { names: ['‘Убада ибн Самит', '‘Убады ибн Самита'], id: 'ubada_ibn_samit' },
  { names: ['‘Ади ибн Хатим', '‘Адия ибн Хатима', 'Ади ибн Хатим'], id: 'adi_ibn_hatim' },
  { names: ['Уаиль ибн Хаджар', 'Уаиля ибн Хаджара'], id: 'wail_ibn_hajar' }
];

function tafsirScholarLink(scholarId, label) {
  var safeId = escAttr(scholarId);
  return '<span role="button" tabindex="0" class="scholar-link" data-scholar-id="' + safeId + '" onclick="event.preventDefault();event.stopPropagation();openScholarInfo(\'' + safeId + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();event.stopPropagation();openScholarInfo(\'' + safeId + '\')}">' + label + '</span>';
}

function _linkifyTafsirSafeHtml(safeHtml) {
<<<<<<< HEAD
  var out = safeHtml == null ? '' : String(safeHtml);
  if (typeof IqraScholars !== 'undefined' && typeof IqraScholars.linkifyScholars === 'function') {
    out = IqraScholars.linkifyScholars(out);
  } else {
    TAFSIR_SCHOLARS.forEach(function (scholar) {
      scholar.names.forEach(function (name) {
        var safeName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var regex = new RegExp('(^|\\s|[.,!?()«»"\'])(' + safeName + ')(?=\\s|[.,!?()«»"\']|$)', 'g');
        out = out.split(/(<[^>]+>)/g).map(function (seg, idx) {
          return idx % 2 === 0 ? seg.replace(regex, function (m, pre, nm) { return pre + tafsirScholarLink(scholar.id, nm); }) : seg;
        }).join('');
      });
    });
  }
  if (typeof IqraScholars !== 'undefined' && typeof IqraScholars.formatSacredTermsHtml === 'function') {
    out = IqraScholars.formatSacredTermsHtml(out);
  }
  return out;
}

function _formatInlineTafsirSegment(rawParagraph) {
  if (!rawParagraph) return '';
  var html = escNl(rawParagraph);

  Object.keys(TAFSIR_TERMS).forEach(function (term) {
    var regex = new RegExp('(^|\\s|[.,!?()«»"\'])(' + term + ')(?=\\s|[.,!?()«»"\']|$)', 'gi');
    html = html.replace(regex, '$1<span class="tafsir-term">$2 ' + TAFSIR_TERMS[term] + '</span>');
  });

  return _linkifyTafsirSafeHtml(html);
=======
  if (typeof IqraScholars !== 'undefined' && typeof IqraScholars.linkifyScholars === 'function') {
    return IqraScholars.linkifyScholars(safeHtml);
  }
  return safeHtml;
>>>>>>> ca4756abbe657ac1e757d8f0c9ae20ab9f37d6ce
}

function formatTafsirText(text) {
  if (!text) return '';
<<<<<<< HEAD
  var normalized = String(text).replace(/\r\n/g, '\n').trim();
  if (!normalized) return '';
  var paras = normalized.split(/\n{2,}/).map(function (p) { return p.trim(); }).filter(Boolean);
  if (!paras.length) return '';
  return paras.map(function (p) {
    return '<p class="tafsir-para">' + _formatInlineTafsirSegment(p) + '</p>';
  }).join('');
=======
  let html = escNl(text);

  // 1. Пояснения для терминов
  Object.keys(TAFSIR_TERMS).forEach(term => {
    const regex = new RegExp(`(^|\\s|[.,!?()«»"'])(${term})(?=\\s|[.,!?()«»"']|$)`, 'gi');
    html = html.replace(regex, `$1<span class="tafsir-term">$2 ${TAFSIR_TERMS[term]}</span>`);
  });

  // 2. Кликабельные имена сподвижников, таби‘инов и учёных (через централизованный IqraScholars)
  if (typeof IqraScholars !== 'undefined' && typeof IqraScholars.linkifyScholars === 'function') {
    html = IqraScholars.linkifyScholars(html);
  } else {
    TAFSIR_SCHOLARS.forEach(scholar => {
      scholar.names.forEach(name => {
        const safeName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(^|\\s|[.,!?()«»"'])(${safeName})(?=\\s|[.,!?()«»"']|$)`, 'g');
        html = html.split(/(<[^>]+>)/g).map((seg, idx) => (
          idx % 2 === 0 ? seg.replace(regex, (m, pre, nm) => pre + tafsirScholarLink(scholar.id, nm)) : seg
        )).join('');
      });
    });
  }

  return html;
>>>>>>> ca4756abbe657ac1e757d8f0c9ae20ab9f37d6ce
}

/* Сводка «Справка» + «Открыть крупно» + источник — нижняя строка карточки тафсира */
function tafsirFootHtml(sourceLine, scholarId, surah, ayah) {
  var openReaderBtn = (surah && ayah)
    ? '<button type="button" onclick="event.preventDefault();event.stopPropagation();openTafsirReader(' + Number(surah) + ',' + Number(ayah) + ')" class="btn secondary tafsir-read-btn">' +
        '<svg class="ico ico-sm"><use href="#i-eye"/></svg> Открыть крупно' +
      '</button>'
    : '';
  return '<div class="tafsir-foot">' +
    '<div class="tafsir-source">' + _linkifyTafsirSafeHtml(esc(sourceLine)) + '</div>' +
<<<<<<< HEAD
    '<div class="tafsir-foot-actions">' +
      openReaderBtn +
      '<button type="button" onclick="event.preventDefault();event.stopPropagation();openScholarInfo(\'' + escAttr(scholarId) + '\')" class="btn secondary tafsir-info-btn">' +
        '<svg class="ico ico-sm"><use href="#i-info"/></svg> Справка' +
      '</button>' +
    '</div>' +
  '</div>';
}

function _buildTafsirHadithsHtml(tafsir) {
  if (!tafsir || !Array.isArray(tafsir.hadiths) || !tafsir.hadiths.length) return '';
  return '<div class="tafsir-hadiths"><div class="tafsir-hadiths-title">Хадисы в тафсире</div>' +
    tafsir.hadiths.map(function (h) {
      var hTransmitter = h.transmitter || '';
      var hTransmitterId = h.transmitter_id || '';
      var hSource = h.source || '';
      var hStatus = h.status || '';
      var statusLabels = {
        sahih: 'Достоверный (сахих)',
        hasan: 'Хороший (хасан)',
        daif: 'Слабый (да‘иф)',
        requires_verification: 'Требует уточнения'
      };
      var statusLabel = statusLabels[hStatus] || hStatus;
      var statusClass = hStatus === 'sahih' ? 'is-sahih' : (hStatus === 'hasan' ? 'is-hasan' : 'is-other');
      var transmitterClickable = hTransmitterId
        ? tafsirScholarLink(hTransmitterId, esc(hTransmitter))
        : _linkifyTafsirSafeHtml(esc(hTransmitter));
      var cleanHadithText = String(h.text || '').trim().replace(/^[«»""']+|[«»""']+$/g, '').trim();
      return '<div class="tafsir-hadith">' +
        '<div class="tafsir-hadith-text">«' + _linkifyTafsirSafeHtml(esc(cleanHadithText)) + '»</div>' +
        '<div class="tafsir-hadith-meta">Передал: ' + transmitterClickable + ' · Источник: ' + _linkifyTafsirSafeHtml(esc(hSource)) + ' · <span class="tafsir-status ' + statusClass + '">' + esc(statusLabel) + '</span></div>' +
      '</div>';
    }).join('') +
=======
    '<button type="button" onclick="event.preventDefault();event.stopPropagation();openScholarInfo(\'' + escAttr(scholarId) + '\')" class="btn secondary tafsir-info-btn">' +
      '<svg class="ico ico-sm"><use href="#i-info"/></svg> Справка' +
    '</button>' +
>>>>>>> ca4756abbe657ac1e757d8f0c9ae20ab9f37d6ce
  '</div>';
}

function getSmartTafsirHtml(item, ayahNum) {
  var surah = null, ayah = null;
  if (item.type === 'surah') {
    surah = item.number;
    ayah = ayahNum;
  } else if (item.number) {
    var parts = String(item.number).split(':');
    if (parts.length === 2) {
      surah = parseInt(parts[0], 10);
      var ayahPart = parts[1];
      if (ayahPart.indexOf('-') !== -1) {
        var bounds = ayahPart.split('-').map(Number);
        ayah = bounds[0] + (ayahNum - 1);
        if (ayah > bounds[1]) ayah = bounds[1];
      } else {
        ayah = parseInt(ayahPart, 10);
      }
    }
  }
  if (!surah || !ayah) return '';

  var tafsir = (typeof getTafsirForAyah === 'function') ? getTafsirForAyah(surah, ayah) : null;
  if (!tafsir) return '';

<<<<<<< HEAD
  var isPlaceholder = tafsir.status === 'placeholder' || !tafsir.tafsir_text ||
    String(tafsir.tafsir_text).indexOf('Ин ша Аллах, здесь скоро появится тафсир') !== -1;
  if (isPlaceholder) return '';

  var summaryHtml =
    '<summary class="tafsir-summary" aria-expanded="false" onclick="toggleTafsirDisclosure(this,event)">' +
=======
  const isPlaceholder = tafsir.status === 'placeholder' || !tafsir.tafsir_text ||
    String(tafsir.tafsir_text).indexOf('Ин ша Аллах, здесь скоро появится тафсир') !== -1;
  if (isPlaceholder) return '';

  const summaryHtml =
    '<summary class="tafsir-summary">' +
>>>>>>> ca4756abbe657ac1e757d8f0c9ae20ab9f37d6ce
      '<span class="tafsir-arrow" aria-hidden="true"></span>' +
      '<svg class="ico ico-sm" aria-hidden="true"><use href="#i-book"/></svg>' +
      '<span class="tafsir-summary-label">Тафсир</span>' +
      '<span class="tafsir-state-hint" aria-hidden="true"></span>' +
    '</summary>';

<<<<<<< HEAD
  var scholar = tafsir.source && tafsir.source.scholar ? tafsir.source.scholar : 'Ибн Касир';
  var scholarId = (tafsir.source && tafsir.source.scholar_id) ? tafsir.source.scholar_id : 'ibn_kathir';
  var book = (tafsir.source && tafsir.source.book) ? tafsir.source.book : '';
  var volume = (tafsir.source && tafsir.source.volume) ? ('т. ' + tafsir.source.volume) : '';
  var page = (tafsir.source && tafsir.source.page) ? tafsir.source.page : '';

  var sourceLine = [scholar, book, volume, page].filter(Boolean).join(' · ');
  var formattedText = formatTafsirText(tafsir.tafsir_text);
  if (!formattedText) return '';

  var themesHtml = '';
=======
  const scholar = tafsir.source && tafsir.source.scholar ? tafsir.source.scholar : 'Ибн Касир';
  const scholarId = (tafsir.source && tafsir.source.scholar_id) ? tafsir.source.scholar_id : 'ibn_kathir';
  const book = (tafsir.source && tafsir.source.book) ? tafsir.source.book : '';
  const volume = (tafsir.source && tafsir.source.volume) ? ('т. ' + tafsir.source.volume) : '';
  const page = (tafsir.source && tafsir.source.page) ? tafsir.source.page : '';

  const sourceLine = [scholar, book, volume, page].filter(Boolean).join(' · ');
  const formattedText = formatTafsirText(tafsir.tafsir_text);

  let themesHtml = '';
>>>>>>> ca4756abbe657ac1e757d8f0c9ae20ab9f37d6ce
  if (Array.isArray(tafsir.themes) && tafsir.themes.length) {
    themesHtml = '<div class="tafsir-themes">' +
      tafsir.themes.map(function (th) { return '<span class="tafsir-theme">' + esc(th) + '</span>'; }).join('') +
      '</div>';
  }

<<<<<<< HEAD
  var hadithsHtml = _buildTafsirHadithsHtml(tafsir);
=======
  let hadithsHtml = '';
  if (Array.isArray(tafsir.hadiths) && tafsir.hadiths.length) {
    hadithsHtml = '<div class="tafsir-hadiths"><div class="tafsir-hadiths-title">Хадисы в тафсире</div>' +
      tafsir.hadiths.map(function(h) {
        const hTransmitter = h.transmitter || '';
        const hTransmitterId = h.transmitter_id || '';
        const hSource = h.source || '';
        const hStatus = h.status || '';
        const statusLabels = {
          sahih: 'Достоверный (сахих)',
          hasan: 'Хороший (хасан)',
          daif: 'Слабый (да‘иф)',
          requires_verification: 'Требует уточнения'
        };
        const statusLabel = statusLabels[hStatus] || hStatus;
        const statusClass = hStatus === 'sahih' ? 'is-sahih' : (hStatus === 'hasan' ? 'is-hasan' : 'is-other');
        const transmitterClickable = hTransmitterId
          ? tafsirScholarLink(hTransmitterId, esc(hTransmitter))
          : _linkifyTafsirSafeHtml(esc(hTransmitter));
        return '<div class="tafsir-hadith">' +
          '<div class="tafsir-hadith-text">«' + _linkifyTafsirSafeHtml(esc(h.text)) + '»</div>' +
          '<div class="tafsir-hadith-meta">Передал: ' + transmitterClickable + ' · Источник: ' + _linkifyTafsirSafeHtml(esc(hSource)) + ' · <span class="tafsir-status ' + statusClass + '">' + esc(statusLabel) + '</span></div>' +
          '</div>';
      }).join('') +
      '</div>';
  }
>>>>>>> ca4756abbe657ac1e757d8f0c9ae20ab9f37d6ce

  var israiliyatHtml = '';
  if (tafsir.israiliyat_note && tafsir.israiliyat_note.present) {
    israiliyatHtml = '<div class="tafsir-israiliyat">' +
      '<b>Памятка об исраилят:</b> ' + _linkifyTafsirSafeHtml(esc(tafsir.israiliyat_note.text)) +
      '</div>';
  }

  return '<details class="tafsir-card tafsir-full">' +
    summaryHtml +
    '<div class="tafsir-body">' +
      formattedText +
      themesHtml +
      hadithsHtml +
      israiliyatHtml +
      tafsirFootHtml(sourceLine, scholarId, surah, ayah) +
    '</div>' +
  '</details>';
}

/* ---------- ПОЛНОЭКРАННОЕ ОКНО ЧТЕНИЯ ТАФСИРА ---------- */
var _TAFSIR_READER_SCALES = [0.92, 1, 1.12, 1.26];
var _tafsirReaderScale = 1;
var _activeTafsirNav = { prev: null, next: null };
var _tafsirKeyBound = false;

function _findTafsirNeighbors(surah, ayah) {
  var list = (typeof DEFAULT_TAFSIRS !== 'undefined' && Array.isArray(DEFAULT_TAFSIRS)) ? DEFAULT_TAFSIRS : [];
  var valid = list.filter(function (t) {
    return t && t.surah != null && t.ayah != null && t.status !== 'placeholder' && t.tafsir_text;
  }).sort(function (a, b) {
    if (a.surah !== b.surah) return a.surah - b.surah;
    return a.ayah - b.ayah;
  });
  var curIdx = valid.findIndex(function (t) { return t.surah === surah && t.ayah === ayah; });
  return {
    prev: curIdx > 0 ? valid[curIdx - 1] : null,
    next: (curIdx >= 0 && curIdx < valid.length - 1) ? valid[curIdx + 1] : null
  };
}

function _buildTafsirCopyText(surah, ayah) {
  var sNum = parseInt(surah, 10);
  var aNum = parseInt(ayah, 10);
  if (!sNum || !aNum) return '';
  var tafsir = (typeof getTafsirForAyah === 'function') ? getTafsirForAyah(sNum, aNum) : null;
  if (!tafsir || tafsir.status === 'placeholder' || !tafsir.tafsir_text) return '';

  var surahObj = (typeof getQuranById === 'function') ? getQuranById('q' + sNum) : null;
  var surahTitle = surahObj ? surahObj.title : ('Сура ' + sNum);
  var ayahInfo = null;
  if (surahObj && typeof parseAyahs === 'function') {
    var parsed = parseAyahs(surahObj);
    if (parsed[aNum - 1]) ayahInfo = parsed[aNum - 1];
  }

  var scholar = tafsir.source && tafsir.source.scholar ? tafsir.source.scholar : 'Ибн Касир';
  var book = (tafsir.source && tafsir.source.book) ? tafsir.source.book : '';
  var volume = (tafsir.source && tafsir.source.volume) ? ('т. ' + tafsir.source.volume) : '';
  var page = (tafsir.source && tafsir.source.page) ? tafsir.source.page : '';
  var sourceLine = [scholar, book, volume, page].filter(Boolean).join(' · ');

  var parts = ['Тафсир · ' + surahTitle + ' (' + sNum + ':' + aNum + ')'];
  if (ayahInfo && ayahInfo.ar) parts.push(ayahInfo.ar);
  if (ayahInfo && ayahInfo.trn) parts.push(ayahInfo.trn);
  parts.push(String(tafsir.tafsir_text).trim());
  if (sourceLine) parts.push('Источник: ' + sourceLine);
  parts.push('— Iqra | Читай');
  return parts.join('\n\n');
}

function copyTafsirReader(surah, ayah) {
  var text = _buildTafsirCopyText(surah, ayah);
  if (!text) return false;
  if (typeof copyToClipboard === 'function') {
    copyToClipboard(text);
  } else if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(function () {});
  }
  if (typeof showMarkToast === 'function') showMarkToast('Тафсир скопирован');
  return true;
}

function _bindTafsirReaderKeys() {
  if (_tafsirKeyBound || typeof document === 'undefined') return;
  _tafsirKeyBound = true;
  document.addEventListener('keydown', function (ev) {
    if (!ev || (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight')) return;
    var bg = document.getElementById('modal-bg');
    var modal = document.getElementById('modal-content');
    if (!bg || !bg.classList.contains('active') || !modal || !modal.classList.contains('tafsir-reader-modal')) return;
    var activeTag = (document.activeElement && document.activeElement.tagName) ? document.activeElement.tagName.toUpperCase() : '';
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;
    if (ev.key === 'ArrowLeft' && _activeTafsirNav.prev) {
      ev.preventDefault();
      openTafsirReader(_activeTafsirNav.prev.surah, _activeTafsirNav.prev.ayah);
    } else if (ev.key === 'ArrowRight' && _activeTafsirNav.next) {
      ev.preventDefault();
      openTafsirReader(_activeTafsirNav.next.surah, _activeTafsirNav.next.ayah);
    }
  });
}

function setTafsirReaderScale(delta, surah, ayah) {
  var curIdx = _TAFSIR_READER_SCALES.indexOf(_tafsirReaderScale);
  if (curIdx === -1) curIdx = 1;
  var nextIdx = Math.max(0, Math.min(_TAFSIR_READER_SCALES.length - 1, curIdx + delta));
  _tafsirReaderScale = _TAFSIR_READER_SCALES[nextIdx];
  var modal = document.getElementById('modal-content');
  if (modal && modal.classList.contains('tafsir-reader-modal')) {
    modal.style.setProperty('--tafsir-scale', String(_tafsirReaderScale));
    var lbl = modal.querySelector('.tr-scale-val');
    if (lbl) lbl.textContent = Math.round(_tafsirReaderScale * 100) + '%';
  } else if (surah && ayah) {
    openTafsirReader(surah, ayah);
  }
}

function openTafsirReader(surah, ayah) {
  var sNum = parseInt(surah, 10);
  var aNum = parseInt(ayah, 10);
  if (!sNum || !aNum) return;
  var tafsir = (typeof getTafsirForAyah === 'function') ? getTafsirForAyah(sNum, aNum) : null;
  if (!tafsir || tafsir.status === 'placeholder' || !tafsir.tafsir_text) return;

  var modal = document.getElementById('modal-content');
  var bg = document.getElementById('modal-bg');
  if (!modal || !bg) return;

  var surahObj = (typeof getQuranById === 'function') ? getQuranById('q' + sNum) : null;
  var surahTitle = surahObj ? surahObj.title : ('Сура ' + sNum);
  var ayahInfo = null;
  var surahTotalAyahs = 0;
  if (surahObj && typeof parseAyahs === 'function') {
    var parsed = parseAyahs(surahObj);
    surahTotalAyahs = parsed.length;
    if (parsed[aNum - 1]) ayahInfo = parsed[aNum - 1];
  }

  var scholar = tafsir.source && tafsir.source.scholar ? tafsir.source.scholar : 'Ибн Касир';
  var scholarId = (tafsir.source && tafsir.source.scholar_id) ? tafsir.source.scholar_id : 'ibn_kathir';
  var book = (tafsir.source && tafsir.source.book) ? tafsir.source.book : '';
  var volume = (tafsir.source && tafsir.source.volume) ? ('т. ' + tafsir.source.volume) : '';
  var page = (tafsir.source && tafsir.source.page) ? tafsir.source.page : '';
  var sourceLine = [scholar, book, volume, page].filter(Boolean).join(' · ');

  var themesHtml = (Array.isArray(tafsir.themes) && tafsir.themes.length)
    ? '<div class="tafsir-themes">' + tafsir.themes.map(function (th) { return '<span class="tafsir-theme">' + esc(th) + '</span>'; }).join('') + '</div>'
    : '';
  var hadithsHtml = _buildTafsirHadithsHtml(tafsir);
  var israiliyatHtml = (tafsir.israiliyat_note && tafsir.israiliyat_note.present)
    ? '<div class="tafsir-israiliyat"><b>Памятка об исраилят:</b> ' + _linkifyTafsirSafeHtml(esc(tafsir.israiliyat_note.text)) + '</div>'
    : '';

  var neighbors = _findTafsirNeighbors(sNum, aNum);
  _activeTafsirNav = neighbors;
  _bindTafsirReaderKeys();

  var prevBtn = neighbors.prev
    ? '<button type="button" class="btn secondary tr-nav-btn" onclick="openTafsirReader(' + neighbors.prev.surah + ',' + neighbors.prev.ayah + ')"><svg class="ico ico-sm"><use href="#i-arrow-left"/></svg>Аят ' + neighbors.prev.surah + ':' + neighbors.prev.ayah + '</button>'
    : '<span></span>';
  var nextBtn = neighbors.next
    ? '<button type="button" class="btn secondary tr-nav-btn" onclick="openTafsirReader(' + neighbors.next.surah + ',' + neighbors.next.ayah + ')">Аят ' + neighbors.next.surah + ':' + neighbors.next.ayah + '<svg class="ico ico-sm"><use href="#i-arrow-right"/></svg></button>'
    : '<span></span>';

  var kickerText = 'Тафсир · ' + sNum + ':' + aNum + (surahTotalAyahs > 0 ? (' · аят ' + aNum + ' из ' + surahTotalAyahs) : '');

  modal.className = 'modal tafsir-reader-modal';
  modal.style.setProperty('--tafsir-scale', String(_tafsirReaderScale));
  modal.innerHTML =
    '<div class="tr-head">' +
      '<div class="tr-head-title">' +
        '<div class="tr-kicker">' + esc(kickerText) + '</div>' +
        '<h2 class="tr-title">' + esc(surahTitle) + '</h2>' +
      '</div>' +
      '<div class="tr-head-controls">' +
        '<div class="tr-scale-seg" role="group" aria-label="Размер шрифта тафсира">' +
          '<button type="button" class="tr-scale-btn" onclick="setTafsirReaderScale(-1,' + sNum + ',' + aNum + ')" aria-label="Уменьшить шрифт">A-</button>' +
          '<span class="tr-scale-val">' + Math.round(_tafsirReaderScale * 100) + '%</span>' +
          '<button type="button" class="tr-scale-btn" onclick="setTafsirReaderScale(1,' + sNum + ',' + aNum + ')" aria-label="Увеличить шрифт">A+</button>' +
        '</div>' +
        '<button type="button" class="sm-close" aria-label="Закрыть" onclick="closeModal()"><svg class="ico ico-sm"><use href="#i-x"/></svg></button>' +
      '</div>' +
    '</div>' +
    '<div class="tr-scroll">' +
      (ayahInfo ? (
        '<div class="tr-ayah-quote">' +
          '<div class="tr-ayah-ar ar-font" dir="rtl" lang="ar">' + esc(ayahInfo.ar) + '</div>' +
          (ayahInfo.trn ? '<div class="tr-ayah-trn">' + _linkifyTafsirSafeHtml(esc(ayahInfo.trn)) + '</div>' : '') +
        '</div>'
      ) : '') +
      '<div class="tr-body">' + formatTafsirText(tafsir.tafsir_text) + '</div>' +
      themesHtml +
      hadithsHtml +
      israiliyatHtml +
      '<div class="tr-source-box">' +
        '<div class="tr-source-line">' + _linkifyTafsirSafeHtml(esc(sourceLine)) + '</div>' +
        '<div class="tr-source-actions">' +
          '<button type="button" class="btn secondary btn-inline tr-scholar-btn" onclick="openScholarInfo(\'' + escAttr(scholarId) + '\')"><svg class="ico ico-sm"><use href="#i-info"/></svg> Справка о толкователе</button>' +
          '<button type="button" class="btn secondary btn-inline tr-copy-btn" onclick="copyTafsirReader(' + sNum + ',' + aNum + ')"><svg class="ico ico-sm"><use href="#i-copy"/></svg> Скопировать тафсир</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="tr-nav-row">' +
      prevBtn +
      '<button type="button" class="btn secondary tr-close-btn" onclick="closeModal()">Закрыть</button>' +
      nextBtn +
    '</div>';

  bg.style.backgroundColor = '';
  bg.style.backdropFilter = '';
  bg.style.webkitBackdropFilter = '';
  bg.classList.add('active');

  var scrollEl = modal.querySelector('.tr-scroll');
  if (scrollEl) scrollEl.scrollTop = 0;
}

function toggleTafsirDisclosure(summaryEl, ev) {
  if (ev) {
    if (typeof ev.preventDefault === 'function') ev.preventDefault();
    if (typeof ev.stopPropagation === 'function') ev.stopPropagation();
  }
  var details = (summaryEl && typeof summaryEl.closest === 'function')
    ? summaryEl.closest('details')
    : (summaryEl && summaryEl.parentNode);
  if (!details || String(details.tagName || '').toUpperCase() !== 'DETAILS') return false;
  var nextOpen = !details.open;
  details.open = nextOpen;
  if (summaryEl && typeof summaryEl.setAttribute === 'function') {
    summaryEl.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
  }
  return nextOpen;
}

window.toggleTafsirDisclosure = toggleTafsirDisclosure;
window.openTafsirReader = openTafsirReader;
window.setTafsirReaderScale = setTafsirReaderScale;
window.copyTafsirReader = copyTafsirReader;
window._buildTafsirCopyText = _buildTafsirCopyText;
