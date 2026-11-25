"use strict";

/* ============================================================
   SCHOLAR-MODAL.JS — Единое окно справки для Пророка
   (да благословит его Аллах и приветствует), сподвижников и учёных
   Проект «Икра» · v460
   ============================================================ */

function _formatModalTextHtml(safeHtml, excludeId) {
  var out = safeHtml;
  if (typeof IqraScholars !== 'undefined') {
    if (typeof IqraScholars.linkifyScholars === 'function') {
      out = IqraScholars.linkifyScholars(out, { excludeId: excludeId || '' });
    }
    if (typeof IqraScholars.formatSacredTermsHtml === 'function') {
      out = IqraScholars.formatSacredTermsHtml(out);
    }
  }
  return out;
}

/* Сообщение внутри окна справки (вместо системного alert) */
function _scholarNotice(text) {
  var modalContent = document.getElementById('modal-content');
  var modalBg = document.getElementById('modal-bg');
  if (!modalContent || !modalBg) {
    if (typeof showMarkToast === 'function') showMarkToast(text);
    return;
  }
  modalContent.className = 'modal sm-notice-modal';
  modalBg.style.backgroundColor = '';
  modalBg.style.backdropFilter = '';
  modalBg.style.webkitBackdropFilter = '';
  modalContent.innerHTML =
    '<div class="sm-drag"></div>' +
    '<div class="sm-notice-avatar"><svg class="ico ico-lg"><use href="#i-info"/></svg></div>' +
    '<h2 class="sm-notice-title">Справка</h2>' +
    '<p class="sm-notice-text">' + esc(text) + '</p>' +
    '<button type="button" class="btn secondary sm-close-btn" onclick="closeModal()">Закрыть</button>';
  modalBg.classList.add('active');
}

window.openScholarInfo = function(scholarId) {
  if (!scholarId) {
    _scholarNotice("Справка по этому источнику пока недоступна.");
    return;
  }

  var person = null;
  if (typeof IqraScholars !== 'undefined' && typeof IqraScholars.getScholarById === 'function') {
    person = IqraScholars.getScholarById(scholarId, window.DEFAULT_BIOGRAPHIES, window.GRAPH_SCHOLARS);
  }
  if (!person && window.DEFAULT_BIOGRAPHIES && Array.isArray(window.DEFAULT_BIOGRAPHIES)) {
    person = window.DEFAULT_BIOGRAPHIES.find(function(b) { return b && b.id === scholarId; });
  }
  if (!person && window.GRAPH_SCHOLARS && Array.isArray(window.GRAPH_SCHOLARS)) {
    var scholar = window.GRAPH_SCHOLARS.find(function(s) { return s && s.id === scholarId; });
    if (scholar) {
      person = {
        id: scholar.id,
        name: scholar.name_ru || scholar.name,
        full_name: scholar.full_name || '',
        type: 'scholar',
        lifespan: scholar.lifespan || '',
        description: scholar.note || scholar.description || '',
        sources: scholar.bio_source ? [scholar.bio_source.locator || ''] : [],
        verification_status: scholar.status === 'verified' ? 'cross_checked' : 'single_source'
      };
    }
  }

  if (!person) {
    _scholarNotice("Информация об этом человеке пока недоступна в базе.");
    return;
  }

  var modalContent = document.getElementById('modal-content');
  var modalBg = document.getElementById('modal-bg');
  if (!modalContent || !modalBg) return;

<<<<<<< HEAD
  var isProphet = person.type === 'prophet' || person.id === 'prophet_muhammad';
  modalContent.className = 'modal scholar-modal' + (isProphet ? ' is-prophet' : '');

  modalBg.style.backgroundColor = '';
  modalBg.style.backdropFilter = '';
  modalBg.style.webkitBackdropFilter = '';

  var typeLabels = {
    prophet: 'Посланник Аллаха и печать пророков',
=======
  modalContent.className = 'modal scholar-modal';

  modalBg.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  modalBg.style.backdropFilter = 'blur(8px)';
  modalBg.style.webkitBackdropFilter = 'blur(8px)';

  var typeLabels = {
>>>>>>> ca4756abbe657ac1e757d8f0c9ae20ab9f37d6ce
    companion: 'Сподвижник Пророка (да благословит его Аллах и приветствует)',
    tabii: 'Таби‘ин (поколение учеников сподвижников)',
    scholar: 'Учёный Ахлю-с-Сунна',
    transmitter: 'Передатчик'
  };
  var typeLabel = typeLabels[person.type] || 'Учёный Ахлю-с-Сунна';

  var statusLabels = {
    cross_checked: 'Проверено по классическим источникам',
    single_source: 'Указан по источнику',
    not_found: 'Данные уточняются'
  };
  var statusLabel = statusLabels[person.verification_status] || '';
<<<<<<< HEAD
  var iconUse = isProphet
    ? '#i-star-filled'
    : (person.type === 'companion' ? '#i-scroll' : (person.type === 'transmitter' ? '#i-info' : '#i-book'));

  var paragraphs = person.description
    ? String(person.description).split(/\n{2,}/).filter(Boolean).map(function(p) {
        return '<p class="sm-desc">' + _formatModalTextHtml(escNl(p.trim()), person.id) + '</p>';
      }).join('')
=======
  var iconUse = person.type === 'companion' ? '#i-scroll' : (person.type === 'transmitter' ? '#i-info' : '#i-book');

  var linkifyFn = (typeof IqraScholars !== 'undefined' && typeof IqraScholars.linkifyScholars === 'function')
    ? function(safeHtml) { return IqraScholars.linkifyScholars(safeHtml, { excludeId: person.id }); }
    : function(safeHtml) { return safeHtml; };

  var descHtml = person.description
    ? '<p class="sm-desc">' + linkifyFn(escNl(person.description)) + '</p>'
>>>>>>> ca4756abbe657ac1e757d8f0c9ae20ab9f37d6ce
    : '<p class="sm-desc is-empty">Биографические данные уточняются.</p>';

  var sourcesHtml = '';
  if (Array.isArray(person.sources) && person.sources.length) {
    sourcesHtml = '<div class="sm-sources">' +
      '<div class="sm-sources-title">Источники биографии</div>' +
      '<ul class="sm-sources-list">' +
<<<<<<< HEAD
      person.sources.map(function(s) { return '<li>' + _formatModalTextHtml(esc(s), person.id) + '</li>'; }).join('') +
=======
      person.sources.map(function(s) { return '<li>' + linkifyFn(esc(s)) + '</li>'; }).join('') +
>>>>>>> ca4756abbe657ac1e757d8f0c9ae20ab9f37d6ce
      '</ul>' +
      '</div>';
  }

<<<<<<< HEAD
  var ecoHtml = (!isProphet && typeof renderEcosystemSection === 'function')
    ? renderEcosystemSection('scholar:' + person.id, { compact: true, title: 'Упоминания и связи в Умной книге' })
    : '';

  var openInPathBtn = (!isProphet && typeof openPathFilter === 'function')
=======
  var ecoHtml = (typeof renderEcosystemSection === 'function')
    ? renderEcosystemSection('scholar:' + person.id, { compact: true, title: 'Упоминания и связи в Умной книге' })
    : '';

  var openInPathBtn = (typeof openPathFilter === 'function')
>>>>>>> ca4756abbe657ac1e757d8f0c9ae20ab9f37d6ce
    ? '<button type="button" class="btn secondary sm-action-btn" onclick="closeModal({skipHistoryBack:true});openPathFilter(\'scholar\',\'' + escAttr(person.id) + '\')"><svg class="ico ico-sm"><use href="#i-compass"/></svg>Материалы в Умной книге</button>'
    : '';

  modalContent.innerHTML =
    '<div class="sm-top">' +
      '<div class="sm-drag"></div>' +
      '<button type="button" class="sm-close" aria-label="Закрыть" onclick="closeModal()"><svg class="ico ico-sm"><use href="#i-x"/></svg></button>' +
    '</div>' +
<<<<<<< HEAD
    '<div class="sm-hero">' +
      '<div class="sm-avatar"><svg class="ico ico-lg"><use href="' + iconUse + '"/></svg></div>' +
      '<h2 class="sm-name">' + esc(person.name) + '</h2>' +
      (person.full_name ? '<div class="sm-fullname">' + esc(person.full_name) + '</div>' : '') +
      '<div class="sm-meta-row">' +
        '<span class="sm-role">' + esc(typeLabel) + '</span>' +
        (person.lifespan ? '<span class="sm-life">' + esc(person.lifespan) + '</span>' : '') +
      '</div>' +
    '</div>' +
    '<div class="sm-scroll">' +
      '<div class="sm-body">' + paragraphs + '</div>' +
      sourcesHtml +
      (ecoHtml ? '<div class="scholar-eco-wrap">' + ecoHtml + '</div>' : '') +
      (statusLabel ? '<div class="sm-status">' + esc(statusLabel) + '</div>' : '') +
    '</div>' +
=======
    '<div class="sm-avatar"><svg class="ico ico-lg"><use href="' + iconUse + '"/></svg></div>' +
    '<h2 class="sm-name">' + esc(person.name) + '</h2>' +
    (person.full_name ? '<div class="sm-fullname">' + esc(person.full_name) + '</div>' : '') +
    '<div class="sm-role">' + esc(typeLabel) + '</div>' +
    (person.lifespan ? '<div class="sm-life">' + esc(person.lifespan) + '</div>' : '') +
    '<div class="sm-body">' + descHtml + '</div>' +
    sourcesHtml +
    (ecoHtml ? '<div class="scholar-eco-wrap">' + ecoHtml + '</div>' : '') +
    (statusLabel ? '<div class="sm-status">' + esc(statusLabel) + '</div>' : '') +
>>>>>>> ca4756abbe657ac1e757d8f0c9ae20ab9f37d6ce
    '<div class="sm-actions">' +
      openInPathBtn +
      '<button type="button" class="btn secondary sm-close-btn" onclick="closeModal()">Закрыть</button>' +
    '</div>';

  modalBg.classList.add('active');
};
