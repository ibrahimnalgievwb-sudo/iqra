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

function _shareAppUrl() {
  if (typeof getAppShareUrl === 'function') {
    var dyn = getAppShareUrl();
    if (dyn && dyn !== './') return dyn;
  }
  if (typeof APP_URL === 'string' && APP_URL && APP_URL !== './') return APP_URL;
  if (typeof getIqraBaseUrl === 'function') {
    var b = getIqraBaseUrl();
    if (b && b !== './') return b;
  }
  return '';
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
  var shareUrl = _shareAppUrl();
  if (shareUrl) parts.push(shareUrl);
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
  var shareUrl = _shareAppUrl();
  if (shareUrl) parts.push(shareUrl);
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
  var shareUrl = _shareAppUrl();
  if (shareUrl) parts.push(shareUrl);
  return parts.join('\n\n');
}

function copyAyah(itemId, ayahIdx) {
  var item = getQuranById(itemId);
  if (!item) return;
  var text = buildShareTextAyah(item, ayahIdx);
  if (typeof trackEvent === 'function') {
    trackEvent('copy_ayah/' + itemId + '/' + ayahIdx, 'Копия аята: ' + item.title);
  }
  copyToClipboard(text, 'Аят скопирован');
}

function copyLibraryItem(type, id) {
  var item = null;
  var msg = 'Скопировано в буфер';
  if (type === 'quran') { item = getQuranById(id); msg = 'Сура скопирована'; }
  else if (type === 'dua') { item = getDuaById(id); msg = 'Дуа скопировано'; }
  else if (type === 'hadith') { item = getHadithById(id); msg = 'Хадис скопирован'; }
  else if (type === 'tasbih') { item = getById(id); msg = 'Тасбих скопирован'; }
  if (!item) return;
  var text = (type === 'quran') ? buildShareTextSurah(item) : buildShareText(item);
  if (typeof trackEvent === 'function') {
    var safeCopyId = (type === 'tasbih' && item.custom) ? 'custom' : id;
    var safeCopyTitle = (type === 'tasbih' && item.custom) ? 'пользовательский зикр' : (item.title || item.transcription || id);
    trackEvent('copy/' + type + '/' + safeCopyId, 'Копия: ' + safeCopyTitle);
  }
  copyToClipboard(text, msg);
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
  copyToClipboard(text, 'Аят скопирован');
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
  var safeShareId = (type === 'tasbih' && item.custom) ? 'custom' : id;
  var safeShareTitle = (type === 'tasbih' && item.custom) ? 'пользовательский зикр' : title;
  if (navigator.share) {
    navigator.share({ title: title, text: text }).then(function() {
      trackEvent('share/' + type + '/' + safeShareId, 'Репост: ' + safeShareTitle);
    }).catch(function() {});
    return;
  }
  copyToClipboard(text);
}

function copyToClipboard(text, successMsg) {
  var msg = successMsg || 'Скопировано в буфер';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      if (typeof showMarkToast === 'function') showMarkToast(msg);
    }).catch(function() {
      legacyCopy(text, msg);
    });
    return;
  }
  legacyCopy(text, msg);
}

function legacyCopy(text, successMsg) {
  var msg = successMsg || 'Скопировано в буфер';
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
    if (typeof showMarkToast === 'function') showMarkToast(ok ? msg : 'Не удалось скопировать');
  } catch (e) {
    if (typeof showMarkToast === 'function') showMarkToast('Не удалось скопировать');
  }
}

window.copyAyah = copyAyah;
window.copyLibraryItem = copyLibraryItem;
window.copyToClipboard = copyToClipboard;