"use strict";

/* ============================================================
   TASBIH.JS — Список тасбихов, счётчик, drag&drop, форма CRUD
   Проект «Икра» · v387 (Этап 3.5)
   D-06: dg-bar через scaleX, top-progress-bar через scaleX.
   ============================================================ */

let dragStartY = 0, dragStartX = 0;
let isMouseDrag = false, hasMoved = false;

var debouncedRenderTasbih = debounce(renderTasbih, 250);

function cardClick(event, id) {
  if (suppressNextClick) { suppressNextClick = false; return; }
  if (dragEl) return;
  openCounter(id);
}

function renderTasbih() {
  const today = state.history[todayKey()];
  const done = today ? today.total : 0;
  const goal = state.settings.dailyGoal;
  const pct = goal > 0 ? Math.min(100, (done/goal)*100) : 0;
  
  const goalSlot = document.getElementById('daily-goal-slot');
  if (goal > 0) {
    /* D-06: dg-bar via transform: scaleX */
    goalSlot.innerHTML = `<div class="daily-goal"><div class="dg-top"><div class="dg-label">Сегодня</div><div class="dg-num">${done} <span>/ ${goal}</span></div></div><div class="dg-bar"><div style="transform: scaleX(${(pct/100).toFixed(4)}); transform-origin: left center; width: 100%;"></div></div></div>`;
  } else {
    goalSlot.innerHTML = '';
  }

  const contSlot = document.getElementById('continue-slot');
  if (contSlot) {
    contSlot.innerHTML = '';
    const lr = state.settings.lastRead;
    let lrItem = null, lrLabel = '';
    if (lr && lr.type === 'quran') {
      const q = getQuranById(lr.id);
      if (q) { lrItem = q; lrLabel = 'Продолжить чтение'; }
    }
    if (lrItem) {
      const card = document.createElement('div');
      card.className = 'continue-card';
      card.addEventListener('click', () => openRead(lrItem.id));
      
      const lbl = document.createElement('div');
      lbl.className = 'cc-label';
      lbl.textContent = lrLabel;
      
      const title = document.createElement('div');
      title.className = 'cc-title';
      title.textContent = lrItem.title;
      
      const sub = document.createElement('div');
      sub.className = 'cc-sub';
      sub.textContent = lrItem.subtitle || '';
      
      card.appendChild(lbl);
      card.appendChild(title);
      card.appendChild(sub);
      contSlot.appendChild(card);
    }
  }

  const q = (document.getElementById('search').value||'').toLowerCase().trim();
  const sort = document.getElementById('sort').value;
  let items = [...state.tasbihs];
  if (q) items = items.filter(t => (t.arabic||'').toLowerCase().includes(q) || (t.transcription||'').toLowerCase().includes(q) || (t.translation||'').toLowerCase().includes(q));
  if (sort === 'alpha') items.sort((a,b)=>(a.transcription||a.arabic||'').localeCompare(b.transcription||b.arabic||''));
  if (sort === 'freq') items.sort((a,b)=>usageCount(b.id)-usageCount(a.id));
  
  const container = document.getElementById('cards-container');
  container.innerHTML = '';
  
  if (!items.length) { 
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.innerHTML = state.tasbihs.length ? 'Ничего не найдено' : 'Нет тасбихов.<br>Нажмите «＋», чтобы создать свой.';
    container.appendChild(empty);
    return; 
  }

  const R = 22, C = 2*Math.PI*R;
  const fragment = document.createDocumentFragment();

  items.forEach(t => {
    const _tg = Math.max(1, Number(t.target) || 0);
    const p = Math.min(1, Math.max(0, (Number(t.current) || 0) / _tg));
    const off = C*(1-p);
    const tc = todayCountFor(t.id);
    
    const card = document.createElement('div');
    card.className = 'tasbih-card';
    card.dataset.id = t.id;
    card.tabIndex = 0;
    
    card.addEventListener('click', (e) => cardClick(e, t.id));
    card.addEventListener('pointerdown', cardPointerDown);
    card.addEventListener('pointermove', cardPointerMove);
    card.addEventListener('pointerup', cardPointerUp);
    card.addEventListener('pointercancel', cardPointerUp);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        cardClick(e, t.id);
      }
    });

    if (tc > 0) {
      const badge = document.createElement('div');
      badge.className = 'today-badge';
      badge.textContent = tc;
      card.appendChild(badge);
    }

    const body = document.createElement('div');
    body.className = 'body';

    const ar = document.createElement('div');
    ar.className = 'ar ar-font';
    ar.textContent = t.arabic || '';
    
    const tr = document.createElement('div');
    tr.className = 'tr';
    tr.textContent = t.transcription || '';
    
    const trn = document.createElement('div');
    trn.className = 'trn';
    trn.textContent = t.translation || '';

    const pRow = document.createElement('div');
    pRow.className = 'p-row';
    const span1 = document.createElement('span');
    span1.textContent = `${t.current} / ${t.target}`;
    const span2 = document.createElement('span');
    span2.textContent = `Циклов: ${t.cycles}`;
    pRow.appendChild(span1);
    pRow.appendChild(span2);

    body.appendChild(ar);
    body.appendChild(tr);
    body.appendChild(trn);
    body.appendChild(pRow);
    card.appendChild(body);

    /* SVG mini-ring — stroke-dashoffset, D-06 не трогает */
    const ring = document.createElement('div');
    ring.className = 'mini-ring';
    ring.innerHTML = `<svg width="52" height="52"><circle class="ring-bg" cx="26" cy="26" r="${R}" fill="none" stroke-width="3.5"/><circle class="ring-fg" cx="26" cy="26" r="${R}" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${off}"/></svg><div class="ring-num">${Math.round(p*100)}%</div>`;
    
    card.appendChild(ring);
    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

function cardPointerDown(e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const card = e.currentTarget; 
  dragId = card.dataset.id; 
  dragStartY = e.clientY; 
  dragStartX = e.clientX;
  isMouseDrag = (e.pointerType === 'mouse');
  hasMoved = false;
  
  try { card.setPointerCapture(e.pointerId); } catch(_) {}

  if (isMouseDrag) {
    dragEl = card; 
  } else {
    dragHoldTimer = setTimeout(() => { 
      dragEl = card; 
      card.classList.add('dragging'); 
      if (navigator.vibrate) navigator.vibrate(15); 
    }, 450);
  }
}

function cardPointerMove(e) {
  if (!dragEl) {
    if (dragHoldTimer && Math.abs(e.clientY - dragStartY) > 8) { 
      clearTimeout(dragHoldTimer); 
      dragHoldTimer = null; 
    }
    return;
  }
  
  if (isMouseDrag && !hasMoved) {
    if (Math.abs(e.clientX - dragStartX) > 5 || Math.abs(e.clientY - dragStartY) > 5) {
       hasMoved = true;
       dragEl.classList.add('dragging');
    } else {
       return;
    }
  } else if (!isMouseDrag) {
    hasMoved = true; 
  }

  e.preventDefault();
  const y = e.clientY; 
  const container = document.getElementById('cards-container');
  const cards = [...container.querySelectorAll('.tasbih-card:not(.dragging)')];
  let before = null;
  for (const c of cards) { 
    const r = c.getBoundingClientRect(); 
    if (y < r.top + r.height / 2) { before = c; break; } 
  }
  if (before) container.insertBefore(dragEl, before); else container.appendChild(dragEl);
}

function cardPointerUp(e) {
  if (dragHoldTimer) { clearTimeout(dragHoldTimer); dragHoldTimer = null; }
  
  if (dragEl) {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch(_) {}
    
    if (hasMoved) {
      dragEl.classList.remove('dragging');
      const ids = [...document.querySelectorAll('#cards-container .tasbih-card')].map(c => c.dataset.id);
      state.tasbihs.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
      save(); 
      setTimeout(() => renderTasbih(), 50);
      suppressNextClick = true;
    }
  }
  
  dragEl = null; 
  dragId = null;
  
  setTimeout(() => { suppressNextClick = false; }, 400);
}

function openCounter(id) { activeId=id; const t=getById(id); if (!t) return; try { localStorage.setItem('iqra_last_tasbih', id); } catch(e) {} trackEvent('tasbih/' + id, 'Тасбих: ' + id); document.getElementById('c-ar').textContent=t.arabic; document.getElementById('c-tr').textContent=t.transcription; document.getElementById('c-trn').textContent=t.translation; document.getElementById('c-target').textContent='из '+t.target; updateCounterUI(); showScreen('screen-counter'); if (state.settings.wakeLock) requestWakeLock(); }

function updateCounterUI() {
  const t=getById(activeId); if (!t) return;
  const numEl=document.getElementById('c-num');
  numEl.textContent=t.current;
  const done=t.current>=t.target;
  numEl.classList.toggle('done', done);
  document.getElementById('c-cycles').textContent='Циклов: '+t.cycles;
  const R=44, C=2*Math.PI*R;
  const _tg=Math.max(1, Number(t.target)||0);
  const p=Math.min(1, Math.max(0, (Number(t.current)||0)/_tg));
  /* SVG ring — stroke-dashoffset (не layout, D-06 разрешает) */
  document.getElementById('c-ring').setAttribute('stroke-dashoffset', C*(1-p));
  /* D-06: top-progress-bar via transform: scaleX */
  var tp = document.getElementById('top-progress-bar');
  if (tp) tp.style.transform = 'scaleX(' + p + ')';
}

function tap(e) {
  const t=getById(activeId); if (!t) return;
  const area=document.getElementById('counter-area'); const rect=area.getBoundingClientRect();
  const r=document.createElement('div'); r.className='ripple'; r.style.left=(e.clientX-rect.left)+'px'; r.style.top=(e.clientY-rect.top)+'px'; area.appendChild(r); setTimeout(()=>r.remove(),600);
  let completed = false;
  if (t.current >= t.target) {
    t.cycles += 1;
    t.current = 1;
  } else {
    t.current += 1;
    if (t.current >= t.target) completed = true;
  }
  const _k = todayKey();
  const prevTotal = (state.history[_k] && state.history[_k].total) || 0;
  addToHistory(t.id, 1); updateCounterUI(); save();
  const newTotal = (state.history[_k] && state.history[_k].total) || 0;
  const goal = state.settings.dailyGoal || 0;
  if (state.settings.goalNotify && goal > 0 && prevTotal < goal && newTotal >= goal) {
    showMarkToast('Дневная цель достигнута — ' + newTotal);
    if (state.settings.vibrate && navigator.vibrate) navigator.vibrate([40,60,40]);
  }
  const numEl=document.getElementById('c-num'); numEl.classList.remove('pulse'); void numEl.offsetWidth; numEl.classList.add('pulse');
  if (completed) { trackEvent('complete/' + t.id, 'Цель достигнута: ' + t.id); playChime(); if (state.settings.vibrate && navigator.vibrate) navigator.vibrate([30,40,30]); if (state.settings.autoNext) setTimeout(showNextToast, 800); }
  else { playClick(); if (state.settings.vibrate && navigator.vibrate) navigator.vibrate(8); }
}
function showNextToast() { const idx=state.tasbihs.findIndex(x=>x.id===activeId); const next=state.tasbihs[idx+1]; if (!next) return; const toast=document.getElementById('next-toast'); document.getElementById('nt-name').textContent=next.transcription||next.translation||'—'; document.getElementById('nt-ar').textContent=next.arabic||''; toast.classList.add('show'); clearTimeout(nextToastTimer); nextToastTimer=setTimeout(()=>toast.classList.remove('show'),5000); }
function goNext() { const idx=state.tasbihs.findIndex(x=>x.id===activeId); const next=state.tasbihs[idx+1]; document.getElementById('next-toast').classList.remove('show'); if (next) openCounter(next.id); }
function shareCurrent(e) { if (e) e.stopPropagation(); if (activeId) shareItem('tasbih', activeId); }

async function resetCurrent(e) {   
  if (e) e.stopPropagation();   
  if (!activeId) return;
  if (!await confirmAsync('Сбросить счёт?', 'Текущий прогресс этого тасбиха обнулится.', 'Сбросить', 'Отмена')) return;   
  const t = getById(activeId); 
  if (t) {
    t.current = 0; save(); updateCounterUI(); 
  }
}

function editCurrent(e) { if (e) e.stopPropagation(); if (activeId) openForm(activeId); }

function renderPresets() { document.getElementById('presets').innerHTML = PRESETS.map((p,i)=>`<button type="button" class="preset-chip" onclick="applyPreset(${i})">${esc((p.tr||'').slice(0,30))}</button>`).join(''); }
function applyPreset(i) { const p=PRESETS[i]; document.getElementById('f-ar').value=p.ar; document.getElementById('f-tr').value=p.tr; document.getElementById('f-trn').value=p.trn; document.getElementById('f-target').value=p.target; updatePreview(); }
function updatePreview() { document.getElementById('pv-ar').textContent=document.getElementById('f-ar').value; document.getElementById('pv-tr').textContent=document.getElementById('f-tr').value; document.getElementById('pv-trn').textContent=document.getElementById('f-trn').value; state.draft={ar:document.getElementById('f-ar').value.slice(0,LIMITS.textLen),tr:document.getElementById('f-tr').value.slice(0,LIMITS.textLen),trn:document.getElementById('f-trn').value.slice(0,LIMITS.textLen),target:document.getElementById('f-target').value}; save(); }
function openForm(id) { editingId=id||null; const t=id?getById(id):null; document.getElementById('form-title').textContent=id?'Редактировать':'Новый Тасбих'; let ar='',tr='',trn='',target=33; if (t) { ar=t.arabic; tr=t.transcription; trn=t.translation; target=t.target; } else if (state.draft) { ar=state.draft.ar||''; tr=state.draft.tr||''; trn=state.draft.trn||''; target=state.draft.target||33; } document.getElementById('f-ar').value=ar; document.getElementById('f-tr').value=tr; document.getElementById('f-trn').value=trn; document.getElementById('f-target').value=target; document.getElementById('btn-delete').style.display=id?'block':'none'; updatePreview(); showScreen('screen-form'); }
function cancelForm() { if (activeId) showScreen('screen-counter'); else { renderTasbih(); showScreen('screen-tasbih'); } }
function stepTarget(d){ const el=document.getElementById('f-target'); el.value=Math.max(1,(parseInt(el.value)||1)+d); updatePreview(); }
function saveForm() { const arabic=document.getElementById('f-ar').value.trim().slice(0,LIMITS.textLen); const transcription=document.getElementById('f-tr').value.trim().slice(0,LIMITS.textLen); const translation=document.getElementById('f-trn').value.trim().slice(0,LIMITS.textLen); const target=Math.max(1,Math.min(LIMITS.targetMax,parseInt(document.getElementById('f-target').value)||33)); if (!arabic && !transcription && !translation) { alert('Заполните хотя бы одно поле'); return; } if (editingId) { const t=getById(editingId); t.arabic=arabic; t.transcription=transcription; t.translation=translation; t.target=target; if (t.current>target) { t.current=0; t.cycles=0; } } else {
    if (state.tasbihs.length >= LIMITS.tasbihs) { alert('Максимум ' + LIMITS.tasbihs + ' тасбихов. Удалите старые.'); return; }
    state.tasbihs.push({id:'u'+Date.now(),arabic,transcription,translation,target,current:0,cycles:0}); } state.draft=null; save(); if (state.settings.vibrate && navigator.vibrate) navigator.vibrate(15); showMarkToast('Сохранено'); if (activeId) openCounter(activeId); else { renderTasbih(); showScreen('screen-tasbih'); } }
async function deleteCurrent() {   if (!editingId) return;   if (!await confirmAsync('Удалить тасбих?', 'Это действие нельзя отменить.', 'Удалить', 'Отмена')) return;   state.tasbihs = state.tasbihs.filter(t => t.id !== editingId);   save(); activeId = null; editingId = null; renderTasbih(); showScreen('screen-tasbih'); }
