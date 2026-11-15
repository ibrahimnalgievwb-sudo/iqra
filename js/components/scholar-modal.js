"use strict";

/* ============================================================
   SCHOLAR-MODAL.JS — Справка об ученых (Умная книга)
   Проект «Икра» · v421
   ============================================================ */

window.openScholarInfo = function(scholarId) {
  if (!window.GRAPH_SCHOLARS) return;
  const scholar = window.GRAPH_SCHOLARS.find(s => s.id === scholarId);
  if (!scholar) return;

  const modalContent = document.getElementById('modal-content');
  const modalBg = document.getElementById('modal-bg');
  if (!modalContent || !modalBg) return;

  let bioSourceHtml = '';
  if (scholar.bio_source) {
    let loc = scholar.bio_source.locator || '';
    if (loc.includes(';')) loc = loc.split(';')[0];
    bioSourceHtml = `<div style="font-size: 11px; color: var(--muted); text-align: center; margin-top: 16px; font-style: italic;">Источник: ${esc(loc)}</div>`;
  }

  modalContent.innerHTML = `
    <div style="width: 40px; height: 4px; background: var(--border); border-radius: 2px; margin: 0 auto 20px;"></div>
    
    <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--card2); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; border: 2px solid var(--gold-standard); color: var(--gold-accent);">
      <svg class="ico ico-lg"><use href="#i-book"/></svg>
    </div>
    
    <h2 style="font-size: 20px; font-weight: 700; text-align: center; margin: 0 0 4px; color: var(--text);">${esc(scholar.name_ru)}</h2>
    <div style="font-size: 13px; color: var(--gold-accent); text-align: center; font-weight: 600; margin-bottom: 20px;">${esc(scholar.role_ru)}</div>
    
    <div style="font-size: 14px; line-height: 1.6; color: var(--muted); text-align: center; padding-bottom: 20px; border-bottom: 1px dashed var(--border);">
      ${scholar.note ? `<p style="margin:0;">${esc(scholar.note)}</p>` : '<p style="margin:0;">Биографические данные уточняются.</p>'}
      ${bioSourceHtml}
    </div>
    
    <button class="btn secondary" style="display: block; width: 100%; margin-top: 24px; padding: 14px; border-radius: 12px; font-size: 15px; font-weight: 600;" onclick="closeModal()">Закрыть</button>
  `;

  modalBg.classList.add('active');
};