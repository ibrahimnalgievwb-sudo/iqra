// Тест эквивалентности: исходный inline-обработчик и его data-версия должны делать ОДНО И ТО ЖЕ.
// Оба выполняются на заглушках; сравниваются журналы вызовов (имена, аргументы, stopPropagation и т.д.).
const fs = require('fs');
const pairs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const actionsSrc = fs.readFileSync(process.argv[3], 'utf8');

function mkEnv(targetIsSelf) {
  const log = [];
  const el = { value: 'VAL', checked: true, click() { log.push('el.click'); } };
  const ev = { target: targetIsSelf ? el : { other: 1 }, stopPropagation() { log.push('stop'); }, preventDefault() { log.push('prevent'); } };
  const norm = a => a === ev ? '$event' : a === el ? '$el' : a;
  const doc = { getElementById: id => ({ addEventListener() {}, click() { log.push('click:' + id); }, classList: { remove(c) { log.push('removeClass:' + id + ':' + c); } } }), addEventListener() {} };
  const rec = new Proxy({}, { get: (t, k) => typeof k === 'string' ? function (...a) { log.push(k + '(' + JSON.stringify(a.map(norm)) + ')'); } : undefined, has: () => true });
  return { log, el, ev, doc, rec };
}
let ok = 0, bad = 0;
for (const p of pairs) {
  for (const self of [true, false]) {
    const A = mkEnv(self);
    const scope = new Proxy({}, { has: () => true, get: (t, k) => k === 'event' ? A.ev : k === 'document' ? A.doc : k === Symbol.unscopables ? undefined : A.rec[k] });
    try { new Function('__s', 'with(__s){ ' + p.original + ' }').call(A.el, scope); } catch (e) { A.log.push('ERR ' + e.message); }
    const B = mkEnv(self);
    new Function('window', 'document', actionsSrc)(B.rec, B.doc);
    B.rec.__iqraActions; // инициализация не нужна: берём run из замыкания через повторную загрузку ниже
    const holder = {}; const win = new Proxy(holder, { get: (t, k) => k === '__iqraActions' ? t.__iqraActions : B.rec[k], set: (t, k, v) => { t[k] = v; return true; } });
    new Function('window', 'document', actionsSrc)(win, B.doc);
    holder.__iqraActions.run(p.attr, B.el, B.ev);
    const a = JSON.stringify(A.log), b = JSON.stringify(B.log);
    if (a === b) ok++; else { bad++; console.log('РАСХОЖДЕНИЕ', JSON.stringify(p.original), '\n  исходный:', a, '\n  новый   :', b); }
  }
}
console.log(`Эквивалентность: ${ok} совпало, ${bad} расхождений (проверено ${pairs.length} обработчиков × 2 сценария)`);
process.exit(bad ? 1 : 0);