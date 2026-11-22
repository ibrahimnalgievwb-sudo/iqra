"use strict";

/* ============================================================
   ACTIONS.JS — делегирование событий вместо inline-обработчиков (v419)
   Элементы несут data-click / data-input / data-change с JSON-описанием шагов.
   Код из атрибутов НЕ исполняется (нет eval): шаг это вызов функции приложения по имени
   либо служебное действие (@stop, @prevent, @self, @click, @removeClass).
   Вызываются только функции, написанные в приложении, но не встроенные браузерные.
   ============================================================ */
(function () {
  var NAME = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

  function resolve(a, el, ev) {
    if (a && typeof a === 'object' && typeof a.$ === 'string') {
      switch (a.$) {
        case 'event': return ev;
        case 'value': return el.value;
        case 'checked': return el.checked;
        case 'el': return el;
      }
      return undefined;
    }
    return a;
  }

  function run(raw, el, ev) {
    var steps;
    try { steps = JSON.parse(raw); } catch (e) { return; }
    if (!Array.isArray(steps)) return;
    for (var i = 0; i < steps.length; i++) {
      var s = steps[i];
      if (s === '@stop') { ev.stopPropagation(); continue; }
      if (s === '@prevent') { ev.preventDefault(); continue; }
      if (s === '@self') { if (ev.target !== el) return; continue; }
      if (!Array.isArray(s) || typeof s[0] !== 'string') continue;
      var n = s[0];
      if (n === '@click') { var t = document.getElementById(s[1]); if (t) t.click(); continue; }
      if (n === '@removeClass') { var u = document.getElementById(s[1]); if (u) u.classList.remove(s[2]); continue; }
      if (!NAME.test(n)) continue;
      var fn = window[n];
      if (typeof fn !== 'function' || /\[native code\]/.test(Function.prototype.toString.call(fn))) continue;
      fn.apply(null, s.slice(1).map(function (a) { return resolve(a, el, ev); }));
    }
  }

  function listen(type, attr) {
    document.addEventListener(type, function (ev) {
      for (var el = ev.target; el && el !== document; el = el.parentNode) {
        if (el.nodeType === 1 && el.hasAttribute(attr)) {
          run(el.getAttribute(attr), el, ev);
          if (ev.cancelBubble) break;   /* как у inline-обработчика: stopPropagation останавливает всплытие */
        }
      }
    });
  }

  listen('click', 'data-click');
  listen('input', 'data-input');
  listen('change', 'data-change');
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    var el = ev.target;
    if (!el || el.nodeType !== 1 || !el.hasAttribute('data-click')) return;
    var tag = el.tagName;
    if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    ev.preventDefault();
    run(el.getAttribute('data-click'), el, ev);
  });
  /* прокрутка не всплывает, поэтому слушаем напрямую (раньше был inline onscroll) */
  var rb = document.getElementById('read-body');
  if (rb) rb.addEventListener('scroll', function () { if (typeof window.toggleScrollTop === 'function') window.toggleScrollTop(); }, { passive: true });
  window.__iqraActions = { run: run };
})();