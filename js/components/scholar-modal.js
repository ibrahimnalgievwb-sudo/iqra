"use strict";

window.openScholarInfo = function(scholarId) {
  if (!scholarId) {
    if (typeof showToast === 'function') showToast("Информация недоступна.");
    return;
  }

  let person = null;
  if (window.DEFAULT_BIOGRAPHIES && Array.isArray(window.DEFAULT_BIOGRAPHIES)) {
    person = window.DEFAULT_BIOGRAPHIES.find(function(b) { return b && b.id === scholarId; });
  }
  if (!person && window.GRAPH_SCHOLARS && Array.isArray(window.GRAPH_SCHOLARS)) {
    const scholar = window.GRAPH_SCHOLARS.find(function(s) { return s && s.id === scholarId; });
    if (scholar) {
      person = {
        id: scholar.id,
        name: scholar.name_ru || scholar.name,
        full_name: scholar.full_name || '',
        type: 'scholar',
        lifespan: scholar.lifespan || '',
        description: scholar.note || scholar.description || '',
        sources: scholar.bio_source ? [scholar.bio_source.locator || ''] : [],
        verification_status: 'single_source'
      };
    }
  }

  if (!person) {
    console.error("Не найден: " + scholarId);
    if (typeof showToast === 'function') showToast("Информация об этом человеке пока недоступна в базе.");
    return;
  }

  const modalContent = document.getElementById('modal-content');
  const modalBg = document.getElementById('modal-bg');
  if (!modalContent || !modalBg) return;

  // Сбрасываем возможный класс tajweed-modal от предыдущей модалки,
  // чтобы модалка учёного не унаследовала узкий glassmorphism-стиль.
  modalContent.className = 'modal';

  // Премиальный полупрозрачный фон и размытие (glassmorphism)
  modalBg.style.backgroundColor = 'rgba(0, 0, 0, 0.45)';
  modalBg.style.backdropFilter = 'blur(8px)';
  modalBg.style.webkitBackdropFilter = 'blur(8px)';

  const typeLabels = { 'scholar': 'Учёный', 'transmitter': 'Передатчик' };
  const typeLabel = typeLabels[person.type] || 'Учёный';

  const statusLabels = {
    'cross_checked': 'Проверено по нескольким источникам',
    'single_source': 'Один источник',
    'not_found': 'Данные не найдены'
  };
  const statusLabel = statusLabels[person.verification_status] || '';

  const iconUse = person.type === 'transmitter' ? '#i-info' : '#i-book';

  let sourcesHtml = '';
  if (Array.isArray(person.sources) && person.sources.length) {
    sourcesHtml = '<div style="margin-top:16px;font-size:12px;color:var(--muted);text-align:left;padding:10px;background:var(--card2);border-radius:8px;">' +
      '<b style="color:var(--gold-accent);">Источники:</b>' +
      '<ul style="margin:6px 0 0 18px;padding:0;">' +
      person.sources.map(function(s) { return '<li style="margin-bottom:4px;">' + esc(s) + '</li>'; }).join('') +
      '</ul>' +
      '</div>';
  }

  modalContent.innerHTML = `
    <div style="width: 40px; height: 4px; background: var(--border); border-radius: 2px; margin: 0 auto 20px;"></div>
    
    <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--card2); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; border: 2px solid var(--gold-standard); color: var(--gold-accent);">
      <svg class="ico ico-lg"><use href="${iconUse}"/></svg>
    </div>
    
    <h2 style="font-size: 20px; font-weight: 700; text-align: center; margin: 0 0 4px; color: var(--text);">${esc(person.name)}</h2>
    ${person.full_name ? '<div style="font-size: 13px; color: var(--muted); text-align: center; margin-bottom: 4px;">' + esc(person.full_name) + '</div>' : ''}
    <div style="font-size: 13px; color: var(--gold-accent); text-align: center; font-weight: 600; margin-bottom: 6px;">${esc(typeLabel)}</div>
    ${person.lifespan ? '<div style="font-size: 12px; color: var(--muted); text-align: center; margin-bottom: 16px;">' + esc(person.lifespan) + '</div>' : ''}
    
    <div style="font-size: 14px; line-height: 1.6; color: var(--text); padding-bottom: 16px; border-bottom: 1px dashed var(--border);">
      ${person.description ? '<p style="margin:0;text-align:center;">' + esc(person.description) + '</p>' : '<p style="margin:0;text-align:center;color:var(--muted);">Биографические данные уточняются.</p>'}
    </div>
    
    ${sourcesHtml}
    
    ${statusLabel ? '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:12px;font-style:italic;">Статус проверки: ' + esc(statusLabel) + '</div>' : ''}
    
    <button class="btn secondary" style="display: block; width: 100%; margin-top: 24px; padding: 14px; border-radius: 12px; font-size: 15px; font-weight: 600;" data-click='[["closeModal"]]'>Закрыть</button>
  `;

  modalBg.classList.add('active');
};
