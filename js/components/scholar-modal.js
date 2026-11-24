"use strict";

/* Сообщение внутри окна справки (вместо системного alert) */
function _scholarNotice(text) {
  var modalContent = document.getElementById('modal-content');
  var modalBg = document.getElementById('modal-bg');
  if (!modalContent || !modalBg) {
    if (typeof showMarkToast === 'function') showMarkToast(text);
    return;
  }
  modalContent.className = 'modal';
  modalBg.style.backgroundColor = 'rgba(0, 0, 0, 0.45)';
  modalBg.style.backdropFilter = 'blur(8px)';
  modalBg.style.webkitBackdropFilter = 'blur(8px)';
  modalContent.innerHTML = `
    <div style="width: 40px; height: 4px; background: var(--border); border-radius: 2px; margin: 0 auto 20px;"></div>
    <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--card2); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; border: 2px solid var(--gold-standard); color: var(--gold-accent);">
      <svg class="ico ico-lg"><use href="#i-info"/></svg>
    </div>
    <h2 style="font-size: 20px; font-weight: 700; text-align: center; margin: 0 0 8px; color: var(--text);">Справка</h2>
    <p style="font-size: 14px; line-height: 1.6; color: var(--muted); text-align: center; margin: 0;">${esc(text)}</p>
    <button class="btn secondary" style="display: block; width: 100%; margin-top: 24px; padding: 14px; border-radius: 12px; font-size: 15px; font-weight: 600;" onclick="closeModal()">Закрыть</button>
  `;
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

  modalContent.className = 'modal scholar-modal';

  modalBg.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  modalBg.style.backdropFilter = 'blur(8px)';
  modalBg.style.webkitBackdropFilter = 'blur(8px)';

  var typeLabels = {
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
  var iconUse = person.type === 'companion' ? '#i-scroll' : (person.type === 'transmitter' ? '#i-info' : '#i-book');

  var linkifyFn = (typeof IqraScholars !== 'undefined' && typeof IqraScholars.linkifyScholars === 'function')
    ? function(safeHtml) { return IqraScholars.linkifyScholars(safeHtml, { excludeId: person.id }); }
    : function(safeHtml) { return safeHtml; };

  var descHtml = person.description
    ? '<p class="sm-desc">' + linkifyFn(escNl(person.description)) + '</p>'
    : '<p class="sm-desc is-empty">Биографические данные уточняются.</p>';

  var sourcesHtml = '';
  if (Array.isArray(person.sources) && person.sources.length) {
    sourcesHtml = '<div class="sm-sources">' +
      '<div class="sm-sources-title">Источники биографии</div>' +
      '<ul class="sm-sources-list">' +
      person.sources.map(function(s) { return '<li>' + linkifyFn(esc(s)) + '</li>'; }).join('') +
      '</ul>' +
      '</div>';
  }

  var ecoHtml = (typeof renderEcosystemSection === 'function')
    ? renderEcosystemSection('scholar:' + person.id, { compact: true, title: 'Упоминания и связи в Умной книге' })
    : '';

  var openInPathBtn = (typeof openPathFilter === 'function')
    ? '<button type="button" class="btn secondary sm-action-btn" onclick="closeModal({skipHistoryBack:true});openPathFilter(\'scholar\',\'' + escAttr(person.id) + '\')"><svg class="ico ico-sm"><use href="#i-compass"/></svg>Материалы в Умной книге</button>'
    : '';

  modalContent.innerHTML =
    '<div class="sm-top">' +
      '<div class="sm-drag"></div>' +
      '<button type="button" class="sm-close" aria-label="Закрыть" onclick="closeModal()"><svg class="ico ico-sm"><use href="#i-x"/></svg></button>' +
    '</div>' +
    '<div class="sm-avatar"><svg class="ico ico-lg"><use href="' + iconUse + '"/></svg></div>' +
    '<h2 class="sm-name">' + esc(person.name) + '</h2>' +
    (person.full_name ? '<div class="sm-fullname">' + esc(person.full_name) + '</div>' : '') +
    '<div class="sm-role">' + esc(typeLabel) + '</div>' +
    (person.lifespan ? '<div class="sm-life">' + esc(person.lifespan) + '</div>' : '') +
    '<div class="sm-body">' + descHtml + '</div>' +
    sourcesHtml +
    (ecoHtml ? '<div class="scholar-eco-wrap">' + ecoHtml + '</div>' : '') +
    (statusLabel ? '<div class="sm-status">' + esc(statusLabel) + '</div>' : '') +
    '<div class="sm-actions">' +
      openInPathBtn +
      '<button type="button" class="btn secondary sm-close-btn" onclick="closeModal()">Закрыть</button>' +
    '</div>';

  modalBg.classList.add('active');
};
