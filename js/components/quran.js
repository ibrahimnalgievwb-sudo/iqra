"use strict";

var debouncedRenderQuranList = debounce(renderQuranList, 250);
function excerpt(text, lines) { return String(text || '').split('\n').slice(0, lines).join('\n'); }

function renderQuranList() {
  const el = document.getElementById('quran-list');
  const qEl = document.getElementById('quran-search');
  if (!el) return;
  
  let q = qEl ? (qEl.value || '').toLowerCase().trim() : '';
  const ayahM = q.match(/^(\d+)\s*[:\-]\s*\d+$/); if (ayahM) q = ayahM[1];
  const qAr = normalizeArabic(q);
  
  let items = state.quran;
  if (quranFilter === 'surah') items = items.filter(i => i.type === 'surah');
  else if (quranFilter === 'ruqyah') items = items.filter(i => i.type === 'ruqyah' || ['q109','q112','q113','q114'].includes(i.id));
  
  if (q) {
    items = items.filter(item => {
      const hay = [item.title, item.subtitle, item.arabic, item.transcription, item.translation, String(item.number || '')].filter(Boolean).join(' ').toLowerCase();
      if (hay.includes(q)) return true;
      if (qAr && normalizeArabic([item.title, item.arabic, item.transcription].filter(Boolean).join(' ')).includes(qAr)) return true;
      return false;
    });
  }
  
  if (!items.length && quranFilter !== 'ruqyah') { 
    el.innerHTML = state.quran.length ? '<div class="empty">Ничего не найдено</div>' : '<div class="empty">Пока нет текстов</div>'; 
    return; 
  }
  
  let html = '';
  if (quranFilter === 'ruqyah') {
    html += `<div class="content-card content-card--feature" onclick="openDua('ruqyah_guide')"><div class="c-title"><svg class="ico ico-sm" style="display:inline-block;vertical-align:-3px;margin-right:6px;color:var(--gold-accent)"><use href="#i-book"/></svg>Руководство по Рукье</div><div class="c-sub">Статус сидра · Аяты о колдовстве · Профилактика</div><div class="c-tr">Нажмите, чтобы прочитать важные наставления учёных и фетвы Ибн База</div></div>`;
    html += `<div class="content-card content-card--feature" onclick="openQuran('ruqyah_araf')"><div class="c-badge">Рукья</div><div class="c-title">Аяты о колдовстве</div><div class="c-sub">Начните с аль-А'раф 117–119 · Юнус и Та Ха — ниже в списке</div><div class="c-ar ar-font">وَأَوْحَيْنَا إِلَىٰ مُوسَىٰ أَنْ أَلْقِ عَصَاكَ ۖ فَإِذَا هِيَ تَلْقَفُ مَا يَأْفِكُونَ</div><div class="c-tr">Читаются в составе шариатской рукьи на воду или над больным</div></div>`;
  }
  
  html += items.map(item => {
    const fav = isFavorite(item.id);
    const numHtml = item.type === 'surah' ? `<div class="c-num">${item.number}</div>` : '';
    const hasNum = item.type === 'surah' ? ' has-num' : '';
    const star = `<button class="star-btn ${fav?'active':''}" aria-label="${fav?'Убрать из избранного':'Добавить в избранное'}: ${escAttr(item.title)}" onclick="starClick(event,'${escAttr(item.id)}','quran')">${fav?'<svg class="ico"><use href="#i-star-filled"/></svg>':'<svg class="ico"><use href="#i-star"/></svg>'}</button>`;
    let readBadge = '';
    if (item.type === 'surah' && state.settings.readAyah && typeof state.settings.readAyah[item.id] === 'number' && state.settings.readAyah[item.id] > 0) {
      const ayahN = state.settings.readAyah[item.id] + 1;
      readBadge = `<div class="c-badge">С аята ${ayahN}</div>`;
    }
    return `<div class="content-card${hasNum}" onclick="openQuran('${escAttr(item.id)}')">${numHtml}${star}${readBadge}<div class="c-title">${esc(item.title)}</div><div class="c-sub">${esc(item.subtitle||'')}</div><div class="c-ar ar-font">${esc(excerpt(item.arabic, 3))}</div><div class="c-tr">${esc(excerpt(item.translation, 3))}</div></div>`;
  }).join('');
  
  el.innerHTML = html;
}

function setQuranFilter(f) {
  quranFilter = f;
  document.querySelectorAll('[data-q-filter]').forEach(b => b.classList.toggle('active', b.dataset.qFilter === f));
  if (typeof renderQuranList === 'function') renderQuranList();
}

/* ---------- Умная книга: Форматирование текста тафсира ---------- */
function formatTafsirText(text) {
  if (!text) return '';
  let html = escNl(text);

  // 1. Пояснения для терминов
  const terms = {
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
  
  Object.keys(terms).forEach(term => {
    const regex = new RegExp(`(^|\\s|[.,!?()«»"'])(${term})(?=\\s|[.,!?()«»"']|$)`, 'gi');
    html = html.replace(regex, `$1<span style="color:var(--muted); font-style:italic; font-size:0.9em;">$2 ${terms[term]}</span>`);
  });

  // 2. Кликабельные имена ученых и передатчиков
  const scholars = [
    { names: ['Ибн ‘Аббас', 'Ибн Аббас', 'Ибн ‘Аббаса', 'Ибн Аббаса'], id: 'ibn_abbas' },
    { names: ['Абу Хурайра', 'Абу Хурайры'], id: 'abu_hurayra' },
    { names: ['Умм Салама', 'Умм Саламы'], id: 'umm_salama' },
    { names: ['‘Аиша', '‘Аиши', 'Аиша', 'Аиши'], id: 'aisha' },
    { names: ['‘Убада ибн Самит', '‘Убады ибн Самита'], id: 'ubada_ibn_samit' },
    { names: ['‘Ади ибн Хатим', '‘Адия ибн Хатима', 'Ади ибн Хатим'], id: 'adi_ibn_hatim' },
    { names: ['Уаиль ибн Хаджар', 'Уаиля ибн Хаджара'], id: 'wail_ibn_hajar' }
  ];

  scholars.forEach(scholar => {
    scholar.names.forEach(name => {
      const safeName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|\\s|[.,!?()«»"'])(${safeName})(?=\\s|[.,!?()«»"']|$)`, 'g');
      html = html.replace(regex, `$1<a href="#" class="scholar-link" style="color:var(--text); font-weight:600; text-decoration:underline; text-decoration-color:var(--gold-accent); text-underline-offset:3px; text-decoration-thickness:1.5px; cursor:pointer;" onclick="event.preventDefault(); openScholarInfo('${scholar.id}')">$2</a>`);
    });
  });

  return html;
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

  const isPlaceholder = tafsir.status === 'placeholder' || !tafsir.tafsir_text;

  if (isPlaceholder) {
    return `<details class="tafsir-card" style="margin-top:16px; background:var(--card2); border-radius:12px; padding:14px; border-left:3px solid var(--gold-accent); text-align:left; direction:ltr;">
      <summary style="font-weight:700; color:var(--gold-accent); font-size:14px; outline:none; display:flex; align-items:center; gap:8px; cursor:pointer; list-style:none;">
        <span class="arrow-icon" style="font-size:10px; color:var(--muted); transition:transform 0.2s;">▶</span>
        <svg class="ico ico-sm"><use href="#i-book"/></svg> Тафсир
      </summary>
      <div style="margin-top:12px; font-size:14px; line-height:1.6; color:var(--muted); border-top:1px dashed var(--border); padding-top:12px; text-align:center; font-style:italic;">
        ${esc(tafsir.tafsir_text || 'Ин ша Аллах, здесь скоро появится тафсир')}
      </div>
    </details>`;
  }

  const scholar = tafsir.source && tafsir.source.scholar ? tafsir.source.scholar : 'Ибн Касир';
  const scholarId = (tafsir.source && tafsir.source.scholar_id) ? tafsir.source.scholar_id : 'ibn_kathir';
  const book = (tafsir.source && tafsir.source.book) ? tafsir.source.book : '';
  const volume = (tafsir.source && tafsir.source.volume) ? ('т. ' + tafsir.source.volume) : '';
  const page = (tafsir.source && tafsir.source.page) ? tafsir.source.page : '';

  let sourceLine = [scholar, book, volume, page].filter(Boolean).join(' · ');
  const formattedText = formatTafsirText(tafsir.tafsir_text);

  let themesHtml = '';
  if (Array.isArray(tafsir.themes) && tafsir.themes.length) {
    themesHtml = '<div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px;">' +
      tafsir.themes.map(function(th) { return '<span style="font-size:11px;padding:3px 8px;border-radius:6px;background:var(--gold-accent);color:#000;font-weight:600;">' + esc(th) + '</span>'; }).join('') +
      '</div>';
  }

  let hadithsHtml = '';
  if (Array.isArray(tafsir.hadiths) && tafsir.hadiths.length) {
    hadithsHtml = '<div style="margin-top:14px;border-top:1px dashed var(--border);padding-top:10px;"><div style="font-size:12px;color:var(--gold-accent);font-weight:700;margin-bottom:8px;">Хадисы в тафсире</div>' +
      tafsir.hadiths.map(function(h) {
        const hTransmitter = h.transmitter || '';
        const hTransmitterId = h.transmitter_id || '';
        const hSource = h.source || '';
        const hStatus = h.status || '';
        const statusColor = hStatus === 'sahih' ? 'var(--gold-accent)' : (hStatus === 'hasan' ? 'var(--accent2)' : 'var(--muted)');
        const transmitterClickable = hTransmitterId
          ? `<a href="#" class="scholar-link" style="color:var(--text); font-weight:600; text-decoration:underline; text-decoration-color:var(--gold-accent); text-underline-offset:3px; text-decoration-thickness:1.5px; cursor:pointer;" onclick="event.preventDefault(); openScholarInfo('${escAttr(hTransmitterId)}')">${esc(hTransmitter)}</a>`
          : esc(hTransmitter);
        return '<div style="background:var(--card);border-radius:8px;padding:10px;margin-bottom:8px;font-size:13px;line-height:1.5;">' +
          '<div style="color:var(--text);margin-bottom:6px;">«' + esc(h.text) + '»</div>' +
          '<div style="font-size:11px;color:var(--muted);">Передал: ' + transmitterClickable + ' · Источник: ' + esc(hSource) + ' · <span style="color:' + statusColor + ';font-weight:600;">' + esc(hStatus) + '</span></div>' +
          '</div>';
      }).join('') +
      '</div>';
  }

  let israiliyatHtml = '';
  if (tafsir.israiliyat_note && tafsir.israiliyat_note.present) {
    israiliyatHtml = '<div style="margin-top:14px;padding:12px;background:rgba(180,140,60,0.08);border-radius:8px;border-left:3px solid var(--gold-accent);font-size:12px;line-height:1.6;color:var(--muted);">' +
      '<b style="color:var(--gold-accent);">Памятка об исраилят:</b> ' + esc(tafsir.israiliyat_note.text) +
      '</div>';
  }

  // Прокручиваемый контент для длинных текстов и sticky-заголовок
  return '<details class="tafsir-card" style="margin-top:16px;background:var(--card2);border-radius:12px;padding:0;border-left:3px solid var(--gold-accent);text-align:left;direction:ltr;overflow:hidden;">' +
    '<summary style="font-weight:700;color:var(--gold-accent);font-size:14px;outline:none;display:flex;align-items:center;gap:8px;cursor:pointer;list-style:none;padding:14px;position:sticky;top:0;background:var(--card2);z-index:10;border-bottom:1px solid var(--border);">' +
      '<span class="arrow-icon" style="font-size:10px;color:var(--muted);transition:transform 0.2s;">▶</span>' +
      '<svg class="ico ico-sm"><use href="#i-book"/></svg> Тафсир' +
    '</summary>' +
    '<div style="padding:14px;font-size:15px;line-height:1.7;color:var(--text);max-height: 60vh; overflow-y: auto;">' +
      formattedText +
      themesHtml +
      hadithsHtml +
      israiliyatHtml +
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-top:14px;border-top:1px dashed var(--border);padding-top:12px;">' +
        '<div style="font-size:12px;color:var(--muted);font-style:italic;">' + esc(sourceLine) + '</div>' +
        '<button onclick="event.preventDefault(); openScholarInfo(\'' + escAttr(scholarId) + '\')" class="btn secondary" style="width:auto;margin:0;padding:6px 12px;font-size:12px;font-weight:600;min-height:30px;border-radius:8px;display:flex;align-items:center;gap:6px;">' +
          '<svg class="ico ico-sm"><use href="#i-info"/></svg> Справка' +
        '</button>' +
      '</div>' +
    '</div>' +
  '</details>';
}

function openQuran(id) {
  activeQuranId = id;
  const item = getQuranById(id); if (!item) return;
  trackEvent('quran/' + id, 'Сура/аят: ' + item.title);
  saveLastRead('quran', id);
  document.getElementById('quran-detail-title').textContent = item.title;
  const ayahs = parseAyahs(item);
  const st = document.getElementById('quran-detail-star');
  if (st) { const fav=isFavorite(id); st.innerHTML=fav?'<svg class="ico"><use href="#i-star-filled"/></svg>':'<svg class="ico"><use href="#i-star"/></svg>'; st.classList.toggle('starred', fav); }
  const el = document.getElementById('quran-detail-content');
  let bismillahHtml = '';
  if (item.bismillah) {
    bismillahHtml = `<div class="bismillah-card"><div class="b-ar ar-font">${esc(item.bismillah.arabic)}</div><div class="b-tr">${esc(item.bismillah.transcription)}</div><div class="b-trn">${esc(item.bismillah.translation)}</div></div>`;
  }
  
  el.innerHTML = `
    <div class="detail-hero">
      <div class="dh-title">${esc(item.title)}</div>
      <div class="dh-sub">${esc(item.subtitle||'')}</div>
    </div>
    ${item.note ? `<div class="note-box"><svg class="ico ico-sm" style="flex-shrink:0;color:var(--accent2)"><use href="#i-lightbulb"/></svg><div>${escNl(item.note)}</div></div>` : ''}
    <div class="detail-actions">
      <button class="btn secondary" onclick="openRead('${escAttr(item.id)}')"><svg class="ico ico-sm" style="display:inline-block;vertical-align:-3px;margin-right:6px"><use href="#i-book"/></svg>Читать</button>
      <button class="btn secondary" onclick="openMemorize('${escAttr(item.id)}')"><svg class="ico ico-sm" style="display:inline-block;vertical-align:-3px;margin-right:6px"><use href="#i-lightbulb"/></svg>Заучить</button>
      <button class="btn secondary" onclick="shareItem('quran','${escAttr(item.id)}')"><svg class="ico ico-sm" style="display:inline-block;vertical-align:-3px;margin-right:6px"><use href="#i-upload"/></svg>Поделиться</button>
    </div>
    <div class="learned-toggle ${item.learned?'done':''}" onclick="toggleQuranLearned('${escAttr(item.id)}')">
      <div class="lt-icon">${item.learned?'✓':'<svg class="ico ico-sm"><use href="#i-book"/></svg>'}</div>
      <div class="lt-body">
        <div class="lt-title">${item.learned?'Выучено':'Отметить как выучено'}</div>
        <div class="lt-sub">${item.learned ? (item.learnedAt ? 'Выучено ' + item.learnedAt : 'Нажми, чтобы снять отметку') : 'Изучи текст и отметь'}</div>
      </div>
    </div>
    ${bismillahHtml}
    <div style="height:16px"></div>
     ${ayahs.map((a, idx) => {
      let verseKey = '';
      if (item.type === 'surah') { verseKey = `${item.number}:${idx + 1}`; }
      else if (item.number && !String(item.number).includes('-')) { verseKey = String(item.number); }

      return `
       <div class="read-ayah ${item.type==='ayat'?'ayat-mode':''}" data-verse-key="${verseKey}">
        <div class="read-ayah-num">${a.num}</div>
        <div class="read-ayah-ar ar-font" data-raw="${escAttr(a.ar)}">${esc(a.ar)}${item.type==='surah' ? ' <span class="read-ayah-marker">' + ayahMarker(a.num) + '</span>' : ''}</div>
        ${a.tr ? `<div class="read-ayah-tr">${esc(a.tr)}</div>` : ''}
        <div class="read-ayah-trn">${esc(a.trn)}</div>
        ${getSmartTafsirHtml(item, idx + 1)}
        <button class="ayah-share-btn" onclick="shareAyah('${escAttr(item.id)}',${idx})"><svg class="ico ico-sm"><use href="#i-upload"/></svg>Поделиться аятом</button>
      </div>
      `;
    }).join('')}
    ${item.source ? `<div class="dh-section" style="margin-top:20px;"><div class="dh-label">Источник</div><div class="dh-text muted" style="font-size:13px;">${esc(item.source)}</div></div>` : ''}
    ${transcriptionNote()}
  `;
  showScreen('screen-quran-detail');
}

function toggleQuranLearned(id) {
  const item = getQuranById(id); if (!item) return;
  item.learned = !item.learned; item.learnedAt = item.learned ? todayKey() : '';
  save(); if (item.learned) { if (navigator.vibrate) navigator.vibrate([20,40,20]); }
  openQuran(id);
}
function goQuranList() { activeQuranId = null; renderQuranList(); showScreen('screen-quran'); }
