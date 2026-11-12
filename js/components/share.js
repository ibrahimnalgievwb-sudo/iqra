"use strict";

/* ============================================================
   SHARE.JS — Звёздочки/избранное, шеринг, копирование в буфер
   Проект «Икра» · v383 (рефакторинг)
   ============================================================ */

function starClick(event, id, list){ event.stopPropagation(); toggleFavorite(id); if (list==='quran') renderQuranList(); else if (list==='dua') renderDuaList(); else if (list==='hadith') renderHadithList(); else if (list==='favorites') renderProgressFavorites(); }
function detailStarClick(){ if (document.getElementById('screen-quran-detail').classList.contains('active') && activeQuranId) { toggleFavorite(activeQuranId); openQuran(activeQuranId); } else if (document.getElementById('screen-dua-detail').classList.contains('active') && activeDuaId) { toggleFavorite(activeDuaId); openDua(activeDuaId); } else if (document.getElementById('screen-hadith-detail').classList.contains('active') && activeHadithId) { toggleFavorite(activeHadithId); openHadith(activeHadithId); } }

function openFavorites() {
  progTab = 'favorites';
  switchTab('cal');
}

function buildShareText(item) {
  var parts = [];
  if (item.title) parts.push(item.title);
  if (item.subtitle) parts.push(item.subtitle);
  if (item.arabic) parts.push(item.arabic);
  if (item.transcription) parts.push(item.transcription);
  if (item.translation) parts.push(item.translation);
  if (item.source) parts.push(item.source);
  parts.push('— Iqra | Читай');
  parts.push(APP_URL);
  return parts.join('\n\n');
}

function buildShareTextSurah(item) {
  var ayahs = parseAyahs(item);
  if (!ayahs.length) return buildShareText(item);
  var parts = [];
  if (item.bismillah) parts.push(item.bismillah.arabic);
  ayahs.forEach(function(a) {
    var block = [];
    if (a.ar) block.push(a.ar);
    if (a.tr) block.push(a.tr);
    if (a.trn) block.push(a.trn);
    if (block.length) parts.push(block.join('\n'));
  });
  var label = item.title;
  if (item.type === 'surah') label += ' · аяты 1-' + ayahs.length;
  else if (item.number) label += ' · ' + item.number;
  parts.push(label);
  parts.push(APP_URL);
  return parts.join('\n\n');
}

function buildShareTextAyah(item, ayahIdx) {
  var ayahs = parseAyahs(item);
  var a = ayahs[ayahIdx];
  if (!a) return buildShareTextSurah(item);
  var parts = [];
  if (item.bismillah) parts.push(item.bismillah.arabic);
  if (a.ar) parts.push(a.ar);
  if (a.tr) parts.push(a.tr);
  if (a.trn) parts.push(a.trn);
  var label = item.title;
  if (item.type === 'surah') label += ' · аят ' + a.num;
  else if (item.number) label += ' · ' + item.number;
  parts.push(label);
  parts.push(APP_URL);
  return parts.join('\n\n');
}

function shareAyah(itemId, ayahIdx) {
  var item = getQuranById(itemId);
  if (!item) return;
  var text = buildShareTextAyah(item, ayahIdx);
  var title = item.title;
  if (navigator.share) {
    navigator.share({ title: title, text: text })
      .then(function() { trackEvent('share_ayah/' + itemId + '/' + ayahIdx, 'Репост аята: ' + title); })
      .catch(function() {});
    return;
  }
  copyToClipboard(text);
}

function shareItem(type, id) {
  var item = null;
  if (type === 'quran') item = getQuranById(id);
  else if (type === 'dua') item = getDuaById(id);
  else if (type === 'hadith') item = getHadithById(id);
  else if (type === 'tasbih') item = getById(id);
  if (!item) return;
  var text = (type === 'quran') ? buildShareTextSurah(item) : buildShareText(item);
  var title = item.title || item.transcription || 'Iqra | Читай';
  if (navigator.share) {
    navigator.share({ title: title, text: text }).then(function() {
      trackEvent('share/' + type + '/' + id, 'Репост: ' + title);
    }).catch(function() {});
    return;
  }
  copyToClipboard(text);
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      showMarkToast('Скопировано в буфер');
    }).catch(function() {
      legacyCopy(text);
    });
    return;
  }
  legacyCopy(text);
}

function legacyCopy(text) {
  try {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    var ok = document.execCommand('copy');
    document.body.removeChild(ta);
    showMarkToast(ok ? 'Скопировано в буфер' : 'Не удалось скопировать');
  } catch (e) {
    showMarkToast('Не удалось скопировать');
  }
}