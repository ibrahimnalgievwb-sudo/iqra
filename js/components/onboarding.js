"use strict";

/* ============================================================
   ONBOARDING.JS — Экран знакомства (4 слайда: приветствие, офлайн,
                    тема, размер арабского текста)
   Проект «Икра» · v387 (Этап 3.5)
   obStep / OB_TOTAL объявлены в app.js.
   D-08: иконки — #i-book, #i-star, #i-moon, logo.svg — все
   геометрические. Одушевлённых существ нет.
   ============================================================ */

function startOnboarding() {
  obStep = 0;
  const ob = document.getElementById('onboarding');
  if (!ob) return;
  ob.classList.add('active');
  renderOnboarding();
  const themeBtn = ob.querySelector('[data-ob-theme="' + state.settings.theme + '"]');
  if (themeBtn) themeBtn.classList.add('active');
  const sizeBtn = ob.querySelector('[data-ob-size="' + state.settings.arSize + '"]');
  if (sizeBtn) sizeBtn.classList.add('active');
}
function renderOnboarding() {
  document.querySelectorAll('#onboarding .ob-slide').forEach(function(s) {
    s.classList.toggle('active', parseInt(s.dataset.slide) === obStep);
  });
  document.querySelectorAll('#onboarding .ob-dot').forEach(function(d, i) {
    d.classList.toggle('active', i === obStep);
  });
  const prev = document.getElementById('ob-prev');
  const next = document.getElementById('ob-next');
  if (prev) prev.style.display = obStep === 0 ? 'none' : 'block';
  if (next) next.textContent = obStep === OB_TOTAL - 1 ? 'Начать ✓' : 'Далее →';
}
function nextOnboarding() {
  if (obStep < OB_TOTAL - 1) { obStep++; renderOnboarding(); }
  else finishOnboarding();
}
function prevOnboarding() {
  if (obStep > 0) { obStep--; renderOnboarding(); }
}
function setOnboardingTheme(t) {
  setTheme(t);
  document.querySelectorAll('#onboarding [data-ob-theme]').forEach(function(b) {
    b.classList.toggle('active', b.dataset.obTheme === t);
  });
}
function setOnboardingSize(s) {
  setArSize(s);
  document.querySelectorAll('#onboarding [data-ob-size]').forEach(function(b) {
    b.classList.toggle('active', parseFloat(b.dataset.obSize) === parseFloat(s));
  });
}
function finishOnboarding() {
  const ob = document.getElementById('onboarding');
  if (ob) ob.classList.remove('active');
  state.migrations.onboarded = true;
  saveNow();
}
