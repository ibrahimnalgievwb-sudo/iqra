"use strict";

/* ============================================================
   DALIL.JS — Разбиение многохадисных далилей и примечаний на отдельные блоки
   и формирование сворачиваемой плашки Далиля для счётчика.
   Универсальный UMD-модуль (браузер + Node.js тесты).
   ============================================================ */

(function (root) {
  function _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function _escNl(s) {
    return _esc(s).replace(/\n/g, '<br>');
  }

  function _linkify(html, customLinkify) {
    if (typeof customLinkify === 'function') return customLinkify(html);
    if (typeof root !== 'undefined' && root.IqraScholars && typeof root.IqraScholars.linkifyScholars === 'function') {
      return root.IqraScholars.linkifyScholars(html);
    }
    return html;
  }

  function _pluralHadith(n) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return n + ' хадис';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return n + ' хадиса';
    return n + ' хадисов';
  }

  var _NARRATION_BOUNDARY_RE = /(?:[.!?»"])\s+(?=(?:Также\s+(?:передал[аи]?|аль-Бухари|Муслим|Абу Дауд|ат-Тирмизи|ан-Насаи)|О произнесении этих(?:\s+же)?\s+слов|И\s+в\s+хадисе\s+от|И\s+передал[аи]?|Передал[аи]?\s+(?:аль-Бухари|Муслим|Абу Дауд|ат-Тирмизи|ан-Насаи|Ибн Маджах?|Ахмад|аль-Хаким|аль-Байхаки))(?=\s|[,«(]|$))/gu;

  var _SOURCE_EXTRACT_RE = /(аль-Бухари\s*\([^)]+\)\s*и\s*Муслим\s*\([^)]+\)|аль-Хаким\s*(?:\([^)]+\)|«[^»]+»[^)]*\))\s*и\s*аль-Байхаки\s*\([^)]+\)|Абу Дауд\s*\([^)]+\)\s*и\s*ат-Тирмизи\s*\([^)]+\)|ат-Тирмизи\s*\([^)]+\)\s*и\s*Абу Дауд\s*\([^)]+\)|аль-Бухари\s*\([^)]+\)|Муслим\s*\([^)]+\)|Муслим,\s*№\s*\d+|Абу Дауд\s*\([^)]+\)|ат-Тирмизи\s*\([^)]+\)|ан-Насаи\s*\([^)]+\)|Ибн Маджах?\s*\([^)]+\)|Ахмад\s*\([^)]+\))/u;

  function _isBalancedPrefix(str) {
    var guil = 0;
    var paren = 0;
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (ch === '«') guil++;
      else if (ch === '»' && guil > 0) guil--;
      else if (ch === '(') paren++;
      else if (ch === ')' && paren > 0) paren--;
    }
    return guil === 0 && paren === 0;
  }

  function _splitRawHadiths(rawText) {
    var text = String(rawText || '').trim();
    if (!text) return [];

    // Сначала сохраняем явное разделение абзацами, если оно уже есть
    var paragraphs = text.split(/\n{2,}/).map(function (p) { return p.trim(); }).filter(Boolean);
    var out = [];

    paragraphs.forEach(function (para) {
      _NARRATION_BOUNDARY_RE.lastIndex = 0;
      var start = 0;
      var match;
      while ((match = _NARRATION_BOUNDARY_RE.exec(para)) !== null) {
        // Разделяем строго после знака конца предложения/цитаты, перед пробелом
        var splitAt = match.index + 1;
        var candidateLeft = para.slice(start, splitAt).trim();
        var candidateRight = para.slice(splitAt).trim();
        if (candidateLeft && candidateRight && _isBalancedPrefix(para.slice(0, splitAt))) {
          out.push(candidateLeft);
          start = splitAt;
        }
      }
      var rest = para.slice(start).trim();
      if (rest) out.push(rest);
    });

    return out;
  }

  function parseDalilHadiths(input) {
    var parts = [];
    if (Array.isArray(input)) {
      input.forEach(function (item) {
        if (typeof item === 'string') {
          parts = parts.concat(_splitRawHadiths(item));
        } else if (item && typeof item === 'object' && item.text) {
          parts.push({ text: String(item.text).trim(), sourceTag: item.sourceTag || '' });
        }
      });
    } else if (typeof input === 'string') {
      parts = _splitRawHadiths(input);
    }

    var normalized = parts.map(function (p) {
      if (p && typeof p === 'object') return p;
      var txt = String(p || '').trim();
      var srcMatch = _SOURCE_EXTRACT_RE.exec(txt.slice(0, 140));
      return {
        text: txt,
        sourceTag: srcMatch ? srcMatch[1].trim() : ''
      };
    }).filter(function (x) { return Boolean(x.text); });

    var total = normalized.length;
    return normalized.map(function (item, idx) {
      return {
        index: idx + 1,
        count: total,
        sourceTag: item.sourceTag,
        text: item.text
      };
    });
  }

  function _renderHadithCard(item, opts) {
    var o = opts || {};
    var linkifyFn = o.linkify;
    var showNumber = item.count > 1;
    var headMeta = '';
    if (showNumber && item.sourceTag) {
      headMeta = 'Хадис ' + item.index + ' · ' + item.sourceTag;
    } else if (showNumber) {
      headMeta = 'Хадис ' + item.index + ' из ' + item.count;
    } else if (item.sourceTag) {
      headMeta = item.sourceTag;
    }

    var headHtml = headMeta
      ? '<div class="dalil-hadith-head"><span class="dalil-hadith-kicker">' + _linkify(_esc(headMeta), linkifyFn) + '</span></div>'
      : '';

    return (
      '<article class="dalil-hadith-card">' +
        headHtml +
        '<div class="dalil-hadith-text">' + _linkify(_escNl(item.text), linkifyFn) + '</div>' +
      '</article>'
    );
  }

  function renderDalilDisclosureHtml(input, opts) {
    var o = opts || {};
    var items = parseDalilHadiths(input);
    if (!items.length) return '';

    var label = o.label || 'Далиль (довод из Сунны)';
    var countText = _pluralHadith(items.length);
    var openAttr = o.open ? ' open' : '';
    var cardsHtml = items.map(function (it) { return _renderHadithCard(it, o); }).join('');

    return (
      '<details class="dalil-disclosure"' + openAttr + '>' +
        '<summary class="dalil-summary">' +
          '<span class="dalil-summary-main">' +
            '<svg class="ico ico-sm dalil-ico" aria-hidden="true"><use href="#i-lightbulb"/></svg>' +
            '<span class="dalil-title">' + _esc(label) + '</span>' +
          '</span>' +
          '<span class="dalil-summary-meta">' +
            '<span class="dalil-count">' + _esc(countText) + '</span>' +
            '<span class="dalil-arrow" aria-hidden="true"></span>' +
          '</span>' +
        '</summary>' +
        '<div class="dalil-body">' +
          '<div class="dalil-hadith-list">' + cardsHtml + '</div>' +
        '</div>' +
      '</details>'
    );
  }

  function renderNoteBlocksHtml(input, opts) {
    var o = opts || {};
    var items = parseDalilHadiths(input);
    if (!items.length) return '';

    if (items.length === 1) {
      return '<div class="dalil-note-single">' + _linkify(_escNl(items[0].text), o.linkify) + '</div>';
    }

    return (
      '<div class="dalil-note-blocks">' +
        items.map(function (it) { return _renderHadithCard(it, o); }).join('') +
      '</div>'
    );
  }

  var api = {
    parseDalilHadiths: parseDalilHadiths,
    renderDalilDisclosureHtml: renderDalilDisclosureHtml,
    renderNoteBlocksHtml: renderNoteBlocksHtml
  };

  root.IqraDalil = api;
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
