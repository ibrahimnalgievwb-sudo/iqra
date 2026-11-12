"use strict";

/* ============================================================
   DASHBOARD.JS — Главный экран, приветствие, цитата дня
   Проект «Икра» · v383 (рефакторинг)
   ============================================================ */

function getDailyQuote() {
  var key = 'iqra_quote_' + todayKey();
  try {
    var cached = localStorage.getItem(key);
    if (cached && cached !== 'null' && cached !== 'undefined') {
      return JSON.parse(cached);
    }
  } catch(e) {}
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
  if (!q96) return;

  const arLines = (q96.arabic || '').split('\n');
  const trLines = (q96.transcription || '').split('\n');
  const trnLines = (q96.translation || '').split('\n');

  const arText = arLines.slice(0, 2).join(' ');
  const trText = trLines.slice(0, 2).join(' ');
  const trnText = trnLines.slice(0, 2).join(' ');

  el.innerHTML = `
    <div class="spiritual-card">
      <div class="sc-ar-bismillah text-gold-metallic">${esc(BISMILLAH.arabic)}</div>
      <div class="sc-tr-bismillah">${esc(BISMILLAH.transcription)}</div>
      <div class="sc-trn-bismillah">${esc(BISMILLAH.translation)}</div>
      
      <div class="sc-divider"></div>
      
      <div class="sc-ar-alyaq text-gold-metallic">${esc(arText)}</div>
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
    if (lr && lr.type === 'quran') {
      const q = getQuranById(lr.id);
      if (q) {
        contEl.innerHTML = `<div class="continue-card" onclick="openRead('${q.id}')"><div class="cc-label">Продолжить чтение</div><div class="cc-title">${esc(q.title)}</div><div class="cc-sub">${esc(q.subtitle||'')}</div></div>`;
      } else {
        contEl.innerHTML = `<div class="continue-card" onclick="openRead('q1')"><div class="cc-label">Начать с Аль-Фатихи</div><div class="cc-title">Аль-Фатиха</div><div class="cc-sub">Открывающая · 7 аятов</div></div>`;
      }
    } else {
      contEl.innerHTML = `<div class="continue-card" onclick="openRead('q1')"><div class="cc-label">Начать с Аль-Фатихи</div><div class="cc-title">Аль-Фатиха</div><div class="cc-sub">Открывающая · 7 аятов</div></div>`;
    }
  }

  _dashQuote = getDailyQuote();
  const qEl = document.getElementById('dash-quote');
  if (qEl && _dashQuote) {
    qEl.innerHTML =
      '<div class="dq-head"><span class="dq-badge">' + esc(_dashQuote.badge) + '</span><div style="display:flex;gap:8px;align-items:center;"><button class="icon-btn ghost" style="width:24px;height:24px;padding:0;" onclick="event.stopPropagation();refreshQuote()" aria-label="Другая цитата"><svg class="ico ico-sm"><use href="#i-rotate-ccw"/></svg></button><span class="dq-arrow">→</span></div></div>' +
      '<div class="dq-title">' + esc(_dashQuote.title) + '</div>' +
      (_dashQuote.ar ? '<div class="dq-ar ar-font">' + esc(_dashQuote.ar) + '</div>' : '') +
      (_dashQuote.tr ? '<div class="dq-tr">' + esc(_dashQuote.tr) + '</div>' : '');
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