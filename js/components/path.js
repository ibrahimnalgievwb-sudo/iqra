// ============================================================
// PATH.JS — Раздел «Путь» (семантический граф знаний)
// Проект «Икра» · Без эмодзи, строго дословные данные из БД
// ============================================================

import {
  getGraphThemes,
  getEdgesByType,
  getEdgesFrom,
  getEdgesTo,
  getQuranData,
  getTafsirsFatiha,
  getTafsirsData,
  getHadithsData,
  getScholarsData,
  getSourcesData
} from '../api.js';
import { openScholarModal } from './scholar-modal.js';

let currentThemeId = null;
let searchQuery = '';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseAyahNodeId(nodeId) {
  const match = /^ayah:q(\d+)#(\d+)$/.exec(nodeId || '');
  if (!match) return null;
  return { surah: Number(match[1]), ayah: Number(match[2]) };
}

function resolveAyahData(quranData, surahNum, ayahNum) {
  if (!Array.isArray(quranData)) return null;
  const surahObj = quranData.find(s => Number(s.number || s.id) === surahNum);
  if (!surahObj || !Array.isArray(surahObj.ayahs)) return null;
  const ayahObj = surahObj.ayahs.find(a => Number(a.numberInSurah || a.number || a.ayah) === ayahNum);
  if (!ayahObj) return null;
  return {
    surahNumber: surahNum,
    surahName: surahObj.name_ru || surahObj.name || `Сура ${surahNum}`,
    ayahNumber: ayahNum,
    arabic: ayahObj.text || ayahObj.arabic || '',
    translation: ayahObj.translation || ayahObj.text_ru || '',
    transcription: ayahObj.transcription || ''
  };
}

function resolveTafsirForAyah(fatihaTafsirs, generalTafsirs, surahNum, ayahNum) {
  if (surahNum === 1 && Array.isArray(fatihaTafsirs)) {
    const found = fatihaTafsirs.find(t => Number(t.surah) === 1 && Number(t.ayah) === ayahNum);
    if (found && found.tafsir_text) {
      return {
        isAvailable: true,
        text: found.tafsir_text,
        source: found.source || 'Тафсир Ибн Касира',
        scholarId: 'ibn_kathir'
      };
    }
  }
  if (Array.isArray(generalTafsirs)) {
    const found = generalTafsirs.find(t => Number(t.surah) === surahNum && Number(t.ayah) === ayahNum);
    if (found && found.status !== 'placeholder' && found.tafsir_text) {
      return {
        isAvailable: true,
        text: found.tafsir_text,
        source: found.source || 'Тафсир Ибн Касира',
        scholarId: 'ibn_kathir'
      };
    }
  }
  return {
    isAvailable: false,
    text: 'Ин ша Аллах, здесь скоро появится тафсир',
    source: '',
    scholarId: null
  };
}

function resolveEvidenceLabel(evidenceId, sourcesData, hadithsData) {
  if (!evidenceId) return '';
  if (evidenceId.startsWith('hadith:')) {
    const hId = evidenceId.replace('hadith:', '');
    const h = Array.isArray(hadithsData) ? hadithsData.find(item => item.id === hId) : null;
    if (h) return `${h.source} (${h.grade})`;
  }
  if (evidenceId.startsWith('tafsir:')) {
    return 'Тафсир Ибн Касира';
  }
  if (evidenceId.startsWith('quran:')) {
    return 'Священный Коран';
  }
  if (Array.isArray(sourcesData)) {
    const s = sourcesData.find(item => item.id === evidenceId);
    if (s && s.title_ru) return s.title_ru;
  }
  return '';
}

export async function renderPathScreen() {
  const container = document.getElementById('screen-path');
  if (!container) return;

  const [themes, ayahThemeEdges, quranData, fatihaTafsirs, generalTafsirs, hadithsData, scholarsData, sourcesData] = await Promise.all([
    getGraphThemes(),
    getEdgesByType('ayah_theme'),
    getQuranData(),
    getTafsirsFatiha(),
    getTafsirsData(),
    getHadithsData(),
    getScholarsData(),
    getSourcesData()
  ]);

  if (!Array.isArray(themes) || themes.length === 0) {
    container.innerHTML = '<div class="content-card"><p>Темы графа знаний загружаются...</p></div>';
    return;
  }

  if (!currentThemeId || !themes.some(t => t.id === currentThemeId)) {
    currentThemeId = themes[0].id;
  }

  const activeTheme = themes.find(t => t.id === currentThemeId) || themes[0];
  const themeEdges = (ayahThemeEdges || []).filter(e => e.to === `theme:${activeTheme.id}`);

  const cards = themeEdges
    .map(edge => {
      const parsed = parseAyahNodeId(edge.from);
      if (!parsed) return null;
      const ayah = resolveAyahData(quranData, parsed.surah, parsed.ayah);
      if (!ayah) return null;

      const tafsir = resolveTafsirForAyah(fatihaTafsirs, generalTafsirs, parsed.surah, parsed.ayah);
      const evidenceLabel = resolveEvidenceLabel(edge.evidence_source, sourcesData, hadithsData);

      const incomingHadithEdges = (getEdgesTo(edge.from) || []).filter(e => e.type === 'hadith_explains_ayah');
      const linkedHadiths = incomingHadithEdges
        .map(he => {
          const hId = he.from.replace('hadith:', '');
          return Array.isArray(hadithsData) ? hadithsData.find(h => h.id === hId) : null;
        })
        .filter(Boolean);

      const relatedAyahEdges = [
        ...(getEdgesFrom(edge.from) || []).filter(e => e.type === 'ayah_related_ayah'),
        ...(getEdgesTo(edge.from) || []).filter(e => e.type === 'ayah_related_ayah')
      ];
      const relatedRefs = Array.from(new Set(
        relatedAyahEdges
          .map(re => (re.from === edge.from ? re.to : re.from))
          .map(id => parseAyahNodeId(id))
          .filter(Boolean)
          .map(p => `${p.surah}:${p.ayah}`)
      ));

      return {
        nodeId: edge.from,
        ayah,
        tafsir,
        evidenceLabel,
        linkedHadiths,
        relatedRefs
      };
    })
    .filter(Boolean)
    .filter(item => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      const hay = [
        item.ayah.surahName,
        `${item.ayah.surahNumber}:${item.ayah.ayahNumber}`,
        item.ayah.translation,
        item.tafsir.isAvailable ? item.tafsir.text : '',
        ...item.linkedHadiths.map(h => `${h.title_ru} ${h.text_ru} ${h.source}`)
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });

  const themesBarHtml = themes.map(t => {
    const count = (ayahThemeEdges || []).filter(e => e.to === `theme:${t.id}`).length;
    const isActive = t.id === activeTheme.id;
    return `
      <button type="button" class="path-theme-pill ${isActive ? 'active' : ''}" data-theme-id="${escapeHtml(t.id)}">
        <span>${escapeHtml(t.title)}</span>
        <span class="path-theme-count">${count}</span>
      </button>
    `;
  }).join('');

  const cardsHtml = cards.length > 0
    ? cards.map(card => {
        const scholar = card.tafsir.scholarId && Array.isArray(scholarsData)
          ? scholarsData.find(s => s.id === card.tafsir.scholarId)
          : null;

        const tafsirHtml = card.tafsir.isAvailable
          ? `
            <div class="path-tafsir-box">
              <div class="path-tafsir-head">
                <span>${escapeHtml(card.tafsir.source)}</span>
                ${scholar ? `<button type="button" class="scholar-link-btn" data-scholar-id="${escapeHtml(scholar.id)}">${escapeHtml(scholar.short_name || 'Ибн Касир')}</button>` : ''}
              </div>
              <div class="path-tafsir-text">${escapeHtml(card.tafsir.text)}</div>
            </div>
          `
          : `
            <div class="path-tafsir-placeholder">
              ${escapeHtml(card.tafsir.text)}
            </div>
          `;

        const hadithsHtml = card.linkedHadiths.map(h => `
          <div class="path-hadith-box">
            <div class="path-hadith-head">
              <span>${escapeHtml(h.title_ru || 'Достоверный хадис')}</span>
              <span>${escapeHtml(h.source)} · ${escapeHtml(h.grade)}</span>
            </div>
            <div class="path-hadith-text">${escapeHtml(h.text_ru)}</div>
          </div>
        `).join('');

        const relatedHtml = card.relatedRefs.length > 0
          ? `
            <div class="path-related-row">
              <span>Связанные аяты:</span>
              ${card.relatedRefs.map(ref => {
                const [s, a] = ref.split(':');
                return `<button type="button" class="path-related-chip" data-open-surah="${s}" data-open-ayah="${a}">${escapeHtml(ref)}</button>`;
              }).join('')}
            </div>
          `
          : '';

        return `
          <article class="content-card path-node-card">
            <div class="path-card-head">
              <span class="path-ayah-ref">Сура ${card.ayah.surahNumber} «${escapeHtml(card.ayah.surahName)}», аят ${card.ayah.ayahNumber}</span>
              ${card.evidenceLabel ? `<span class="path-evidence-badge">${escapeHtml(card.evidenceLabel)}</span>` : ''}
            </div>
            <div class="read-ayah-ar" dir="rtl">${escapeHtml(card.ayah.arabic)}</div>
            <p class="path-ayah-tr">${escapeHtml(card.ayah.translation)}</p>
            ${tafsirHtml}
            ${hadithsHtml}
            ${relatedHtml}
            <button type="button" class="btn secondary path-open-read-btn" data-open-surah="${card.ayah.surahNumber}" data-open-ayah="${card.ayah.ayahNumber}">
              Открыть в Коране
            </button>
          </article>
        `;
      }).join('')
    : '<div class="content-card"><p>По выбранному запросу узлы не найдены.</p></div>';

  container.innerHTML = `
    <div class="path-header">
      <h2 class="screen-title">Путь</h2>
      <p class="screen-subtitle">${escapeHtml(activeTheme.description || '')}</p>
      <div class="path-search-wrap">
        <input type="search" id="path-search-input" class="path-search-input" placeholder="Поиск по аятам, темам и хадисам..." value="${escapeHtml(searchQuery)}" />
      </div>
    </div>
    <div class="path-themes-bar" role="tablist">
      ${themesBarHtml}
    </div>
    <div class="path-cards-list">
      ${cardsHtml}
    </div>
  `;

  container.querySelectorAll('.path-theme-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      currentThemeId = btn.getAttribute('data-theme-id');
      renderPathScreen();
    });
  });

  const searchInput = container.querySelector('#path-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      searchQuery = e.target.value;
      renderPathScreen();
    });
  }

  container.querySelectorAll('.scholar-link-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sId = btn.getAttribute('data-scholar-id');
      if (typeof openScholarModal === 'function') {
        openScholarModal(sId);
      } else if (typeof window.openScholarInfo === 'function') {
        window.openScholarInfo(sId);
      }
    });
  });

  container.querySelectorAll('[data-open-surah]').forEach(btn => {
    btn.addEventListener('click', () => {
      const surah = Number(btn.getAttribute('data-open-surah'));
      const ayah = Number(btn.getAttribute('data-open-ayah'));
      if (typeof window.openRead === 'function') {
        window.openRead(surah, ayah);
      }
    });
  });
}

export function selectPathTheme(themeId) {
  if (!themeId) return;
  currentThemeId = themeId;
  renderPathScreen();
}
