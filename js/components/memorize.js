"use strict";

/* ============================================================
   MEMORIZE.JS — Режим заучивания (изучение + проверка)
   Проект «Икра» · v387 (Этап 3.5)
   D-06: mem-progress-bar через transform: scaleX().
   ============================================================ */

function openMemorizeFor(item) {
  memorizeItem = item;
  memorizeAyahs = parseAyahs(item);
  if (!memorizeAyahs.length) { showMarkToast('Нет текста для заучивания', 3200); return; }
  memorizeStep = 0; memorizePhase = 'learn'; memorizeRevealed = false;
  renderMemorize();
  document.getElementById('memorize-mode').classList.add('active');
  saveNavContext();
}
function openMemorize(id) { const item = getQuranById(id); if (!item) return; trackEvent('memorize/' + id, 'Заучивание: ' + item.title); openMemorizeFor(item); }

function renderMemorize() {
  if (!memorizeItem) return;
  const total = memorizeAyahs.length;
  const a = memorizeAyahs[memorizeStep];
  if (!a) return;
  document.getElementById('mem-title').textContent = memorizeItem.title;
  const pct = ((memorizeStep + 1) / total) * 100;
  /* D-06: progress bar via transform: scaleX */
  var pb = document.getElementById('mem-progress-bar');
  if (pb) pb.style.transform = 'scaleX(' + (pct / 100) + ')';
  const phaseLabel = memorizePhase === 'learn' ? 'Заучивание' : 'Проверка';
  const stepInfo = `<div class="mem-step"><span>${phaseLabel} · Аят ${memorizeStep+1} из ${total}</span><span class="phase">${memorizePhase==='learn'?'изучаем':'проверяем'}</span></div>`;
  let body = '';
  if (memorizePhase === 'learn') { body = `${stepInfo}<div class="mem-block"><div class="mb-label">Арабский</div><div class="mb-ar ar-font">${esc(a.ar)}</div></div><div class="mem-block"><div class="mb-label">Транскрипция</div><div class="mb-text">${esc(a.tr)}</div></div><div class="mem-block"><div class="mb-label">Перевод</div><div class="mb-text">${esc(a.trn)}</div></div><div class="mem-body-note">${transcriptionNote()}</div>`; }
  else { body = `${stepInfo}<div class="mem-block"><div class="mb-label">Перевод (подсказка)</div><div class="mb-text">${esc(a.trn)}</div></div><div class="mem-block"><div class="mb-label">Арабский ${memorizeRevealed ? '· открыт' : '· вспомни'}</div><div class="mb-ar ar-font ${memorizeRevealed ? '' : 'hidden'}">${esc(a.ar)}</div>${memorizeRevealed ? '' : `<button class="mem-reveal-btn" onclick="revealMemorize()"><svg class="ico ico-sm" style="display:inline-block;vertical-align:-3px;margin-right:6px"><use href="#i-eye"/></svg>Показать арабский</button>`}</div>`; }
  document.getElementById('mem-body').innerHTML = body;
  const nextBtn = document.getElementById('mem-next');
  const prevBtn = document.getElementById('mem-prev');
  if (memorizePhase === 'learn') nextBtn.innerHTML = (memorizeStep === total-1 ? 'К проверке' : 'Далее') + '<svg class="ico ico-sm"><use href="#i-arrow-right"/></svg>';
  else nextBtn.innerHTML = memorizeStep === total-1 ? 'Готово<svg class="ico ico-sm"><use href="#i-check"/></svg>' : 'Далее<svg class="ico ico-sm"><use href="#i-arrow-right"/></svg>';
  prevBtn.innerHTML = memorizeStep === 0 && memorizePhase === 'learn' ? 'Закрыть' : '<svg class="ico ico-sm"><use href="#i-arrow-left"/></svg>Назад';
}
function revealMemorize() { memorizeRevealed = true; renderMemorize(); }
function memPrev() {
  if (memorizePhase === 'test' && memorizeStep === 0) { memorizePhase = 'learn'; memorizeRevealed = false; renderMemorize(); return; }
  if (memorizeStep > 0) { memorizeStep--; memorizeRevealed = false; renderMemorize(); }
  else closeMemorize();
}
function memNext() {
  const total = memorizeAyahs.length;
  if (memorizePhase === 'learn') {
    if (memorizeStep < total - 1) { memorizeStep++; memorizeRevealed = false; renderMemorize(); }
    else { memorizePhase = 'test'; memorizeStep = 0; memorizeRevealed = false; renderMemorize(); }
  } else {
    if (memorizeStep < total - 1) { memorizeStep++; memorizeRevealed = false; renderMemorize(); }
    else {
      var doneItem = memorizeItem;
      closeMemorize();
      if (navigator.vibrate) navigator.vibrate([30,40,30]);
      var markedNew = false;
      if (doneItem && doneItem.id) {
        const q = getQuranById(doneItem.id);
        if (q && !q.learned) { q.learned = true; q.learnedAt = todayKey(); markedNew = true; save(); }
        const d = getDuaById(doneItem.id);
        if (d && !d.learned) { d.learned = true; markedNew = true; save(); }
        const h = getHadithById(doneItem.id);
        if (h && !h.learned) { h.learned = true; markedNew = true; save(); }
        if (markedNew) {
          var scrQ = document.getElementById('screen-quran-detail');
          var scrD = document.getElementById('screen-dua-detail');
          var scrH = document.getElementById('screen-hadith-detail');
          if (scrQ && scrQ.classList.contains('active') && activeQuranId === doneItem.id && typeof openQuran === 'function') openQuran(doneItem.id, null, true);
          else if (scrD && scrD.classList.contains('active') && activeDuaId === doneItem.id && typeof openDua === 'function') openDua(doneItem.id);
          else if (scrH && scrH.classList.contains('active') && activeHadithId === doneItem.id && typeof openHadith === 'function') openHadith(doneItem.id);
        }
      }
      if (typeof showMarkToast === 'function') {
        showMarkToast(markedNew ? 'Отмечено как выученное' : 'Проверка завершена');
      }
    }
  }
}
function closeMemorize() { document.getElementById('memorize-mode').classList.remove('active'); memorizeItem=null; memorizeAyahs=[]; memorizeStep=0; memorizePhase='learn'; memorizeRevealed=false; saveNavContext(); }
