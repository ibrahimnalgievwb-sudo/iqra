"use strict";

/* ============================================================
   TAFSIR.JS — Единое место разметки тафсира (раньше две копии:
   quran.js и reader.js). Проект «Икра» · v445
   Подключается ПЕРЕД quran.js. Логика отбора, атрибуции и
   экранирования сохранена без изменений; inline-стили заменены
   классами .tafsir-* и .scholar-link (css/polish.css, раздел 17).
   Зависимости (глобальные): esc, escNl, escAttr, getTafsirForAyah,
   openScholarInfo (scholar-modal.js).
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

/* Имена, которые в тексте становятся ссылками на справку об учёном/передатчике */
const TAFSIR_SCHOLARS = [
  { names: ['Ибн ‘Аббас', 'Ибн Аббас', 'Ибн ‘Аббаса', 'Ибн Аббаса'], id: 'ibn_abbas' },
  { names: ['Абу Хурайра', 'Абу Хурайры'], id: 'abu_hurayra' },
  { names: ['Умм Салама', 'Умм Саламы'], id: 'umm_salama' },
  { names: ['‘Аиша', '‘Аиши', 'Аиша', 'Аиши'], id: 'aisha' },
  { names: ['‘Убада ибн Самит', '‘Убады ибн Самита'], id: 'ubada_ibn_samit' },
  { names: ['‘Ади ибн Хатим', '‘Адия ибн Хатима', 'Ади ибн Хатим'], id: 'adi_ibn_hatim' },
  { names: ['Уаиль ибн Хаджар', 'Уаиля ибн Хаджара'], id: 'wail_ibn_hajar' }
];

/* Ссылка на справку об учёном (единый вид для текста и для хадисов) */
function tafsirScholarLink(scholarId, label) {
  var safeId = escAttr(scholarId);
  return '<span role="button" tabindex="0" class="scholar-link" data-scholar-id="' + safeId + '" onclick="event.preventDefault();event.stopPropagation();openScholarInfo(\'' + safeId + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();event.stopPropagation();openScholarInfo(\'' + safeId + '\')}">' + label + '</span>';
}

function _linkifyTafsirSafeHtml(safeHtml) {
  if (typeof IqraScholars !== 'undefined' && typeof IqraScholars.linkifyScholars === 'function') {
    return IqraScholars.linkifyScholars(safeHtml);
  }
  return safeHtml;
}

function formatTafsirText(text) {
  if (!text) return '';
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
}

/* Сводка «Справка» + источник — нижняя строка карточки тафсира */
function tafsirFootHtml(sourceLine, scholarId) {
  return '<div class="tafsir-foot">' +
    '<div class="tafsir-source">' + _linkifyTafsirSafeHtml(esc(sourceLine)) + '</div>' +
    '<button type="button" onclick="event.preventDefault();event.stopPropagation();openScholarInfo(\'' + escAttr(scholarId) + '\')" class="btn secondary tafsir-info-btn">' +
      '<svg class="ico ico-sm"><use href="#i-info"/></svg> Справка' +
    '</button>' +
  '</div>';
}

function getSmartTafsirHtml(item, ayahNum) {
  let surah = null, ayah = null;
  if (item.type === 'surah') {
    surah = item.number;
    ayah = ayahNum;
  } else if (item.number) {
    const parts = String(item.number).split(':');
    if (parts.length === 2) {
      surah = parseInt(parts[0], 10);
      const ayahPart = parts[1];
      if (ayahPart.includes('-')) {
        const bounds = ayahPart.split('-').map(Number);
        ayah = bounds[0] + (ayahNum - 1);
        if (ayah > bounds[1]) ayah = bounds[1];
      } else {
        ayah = parseInt(ayahPart, 10);
      }
    }
  }
  if (!surah || !ayah) return '';

  const tafsir = (typeof getTafsirForAyah === 'function') ? getTafsirForAyah(surah, ayah) : null;
  if (!tafsir) return '';

  const isPlaceholder = tafsir.status === 'placeholder' || !tafsir.tafsir_text ||
    String(tafsir.tafsir_text).indexOf('Ин ша Аллах, здесь скоро появится тафсир') !== -1;
  if (isPlaceholder) return '';

  const summaryHtml =
    '<summary class="tafsir-summary">' +
      '<span class="tafsir-arrow" aria-hidden="true"></span>' +
      '<svg class="ico ico-sm"><use href="#i-book"/></svg> Тафсир' +
    '</summary>';

  const scholar = tafsir.source && tafsir.source.scholar ? tafsir.source.scholar : 'Ибн Касир';
  const scholarId = (tafsir.source && tafsir.source.scholar_id) ? tafsir.source.scholar_id : 'ibn_kathir';
  const book = (tafsir.source && tafsir.source.book) ? tafsir.source.book : '';
  const volume = (tafsir.source && tafsir.source.volume) ? ('т. ' + tafsir.source.volume) : '';
  const page = (tafsir.source && tafsir.source.page) ? tafsir.source.page : '';

  const sourceLine = [scholar, book, volume, page].filter(Boolean).join(' · ');
  const formattedText = formatTafsirText(tafsir.tafsir_text);

  let themesHtml = '';
  if (Array.isArray(tafsir.themes) && tafsir.themes.length) {
    themesHtml = '<div class="tafsir-themes">' +
      tafsir.themes.map(function(th) { return '<span class="tafsir-theme">' + esc(th) + '</span>'; }).join('') +
      '</div>';
  }

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

  let israiliyatHtml = '';
  if (tafsir.israiliyat_note && tafsir.israiliyat_note.present) {
    israiliyatHtml = '<div class="tafsir-israiliyat">' +
      '<b>Памятка об исраилят:</b> ' + _linkifyTafsirSafeHtml(esc(tafsir.israiliyat_note.text)) +
      '</div>';
  }

  // Прокручиваемое тело для длинных текстов и закреплённый заголовок
  return '<details class="tafsir-card tafsir-full">' +
    summaryHtml +
    '<div class="tafsir-body">' +
      formattedText +
      themesHtml +
      hadithsHtml +
      israiliyatHtml +
      tafsirFootHtml(sourceLine, scholarId) +
    '</div>' +
  '</details>';
}
