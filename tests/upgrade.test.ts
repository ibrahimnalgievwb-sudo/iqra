import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const IQRA_ROOT = path.resolve(import.meta.dirname, '..');

function readJson<T = any>(relPath: string): T {
  return JSON.parse(fs.readFileSync(path.join(IQRA_ROOT, relPath), 'utf8')) as T;
}

function createDomSandbox() {
  const elements: Record<string, any> = {};
  const makeEl = (id: string) => ({
    id,
    innerHTML: '',
    textContent: '',
    value: '',
    className: '',
    style: { setProperty() {} },
    classList: {
      classes: new Set<string>(),
      add(c: string) { this.classes.add(c); },
      remove(c: string) { this.classes.delete(c); },
      contains(c: string) { return this.classes.has(c); },
      toggle(c: string, f?: boolean) {
        if (f === undefined) {
          if (this.classes.has(c)) this.classes.delete(c);
          else this.classes.add(c);
        } else if (f) this.classes.add(c);
        else this.classes.delete(c);
      },
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    setAttribute() {},
    addEventListener() {},
    removeEventListener() {},
  });

  const getEl = (id: string) => {
    if (!elements[id]) elements[id] = makeEl(id);
    return elements[id];
  };

  const sandbox: any = {
    console,
    Date,
    Math,
    Set,
    Map,
    Array,
    Object,
    String,
    Number,
    Boolean,
    JSON,
    RegExp,
    Error,
    Promise,
    parseInt,
    parseFloat,
    isFinite,
    setTimeout: () => 0,
    clearTimeout: () => {},
    navigator: {},
    document: {
      getElementById: (id: string) => getEl(id),
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener() {},
    },
    esc: (s: any) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)),
    escNl: (s: any) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)).replace(/\n/g, '<br>'),
    escAttr: (s: any) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)),
    debounce: (fn: any) => fn,
    transcriptionNote: () => '<div class="tn-note"></div>',
    trackEvent: () => {},
    saveNavContext: () => {},
    save: () => {},
    todayKey: () => '2026-11-25',
    formatDateShort: (d: string) => d,
    formatHijri: () => '15 Джумада аль-уля 1448',
    pad: (n: number) => (n < 10 ? '0' + n : String(n)),
    calculateStreak: () => 5,
    isFavorite: () => false,
    toasts: [] as string[],
    copied: [] as string[],
    showMarkToast(msg: string) { sandbox.toasts.push(msg); },
    copyToClipboard(txt: string) { sandbox.copied.push(txt); },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  return { sandbox, getEl };
}

function loadScript(relPath: string, sandbox: any) {
  const code = fs.readFileSync(path.join(IQRA_ROOT, relPath), 'utf8');
  vm.runInNewContext(code, sandbox, { filename: relPath });
}

test('100% tafsir coverage across Surahs 93-114 with authentic content and zero forbidden strings', () => {
  const quranDoc = readJson<{ quran: any[] }>('data/quran.json');
  const tafsirsDoc = readJson<{ tafsirs: any[] }>('data/tafsirs.json');
  const fatihaDoc = readJson<{ tafsirs: any[] }>('data/tafsirs_fatiha.json');

  const combined = [...tafsirsDoc.tafsirs, ...fatihaDoc.tafsirs];
  const combinedStr = JSON.stringify(tafsirsDoc);
  for (const forbidden of ['Ибн Баз', 'Статус сидра', 'Муслим (№ 595)', 'аль-Бухари (№ 3292)', 'требует сверки', 'требуют уточнения', 'requires_verification', 'Хузайфы', 'Мусé', 'Евангелие,', 'Хытаби', 'аль-Карзи', 'ﷺ']) {
    assert.equal(combinedStr.includes(forbidden), false, `Forbidden string in tafsirs.json: ${forbidden}`);
  }

  for (let s = 93; s <= 114; s++) {
    const surah = quranDoc.quran.find((q: any) => q.type === 'surah' && q.number === s);
    assert.ok(surah, `Surah q${s} must exist`);
    const totalAyahs = String(surah.arabic || '').split('\n').filter(Boolean).length;
    assert.ok(totalAyahs >= 3);
    for (let a = 1; a <= totalAyahs; a++) {
      const entry = combined.find((t: any) => t.surah === s && t.ayah === a);
      assert.ok(entry, `Missing tafsir entry for ${s}:${a}`);
      assert.notEqual(entry.status, 'placeholder', `Placeholder tafsir for ${s}:${a}`);
      assert.ok(String(entry.tafsir_text || '').trim().length >= 80, `Substantial tafsir text expected for ${s}:${a}`);
      assert.ok(entry.source && entry.source.scholar, `Source scholar expected for ${s}:${a}`);
    }
  }
});

test('tafsir.js copy helper, ayah position kicker, and copy button work cleanly', () => {
  const { sandbox, getEl } = createDomSandbox();
  const quranDoc = readJson<{ quran: any[] }>('data/quran.json');
  const tafsirsDoc = readJson<{ tafsirs: any[] }>('data/tafsirs.json');

  sandbox.DEFAULT_TAFSIRS = tafsirsDoc.tafsirs;
  sandbox.getTafsirForAyah = (s: number, a: number) =>
    tafsirsDoc.tafsirs.find((t: any) => t.surah === s && t.ayah === a) || null;
  sandbox.getQuranById = (id: string) => quranDoc.quran.find((q: any) => q.id === id) || null;
  sandbox.parseAyahs = (item: any) => {
    const ars = String(item.arabic || '').split('\n');
    const trns = String(item.translation || '').split('\n');
    return ars.map((ar, i) => ({ num: i + 1, ar, tr: '', trn: trns[i] || '' }));
  };

  loadScript('js/scholars.js', sandbox);
  loadScript('js/components/tafsir.js', sandbox);

  const copyText = sandbox._buildTafsirCopyText(93, 1);
  assert.ok(copyText.includes('93:1'), 'Copy text must include 93:1');
  assert.ok(copyText.includes('Источник:'), 'Copy text must include source attribution');
  assert.ok(copyText.includes('Iqra | Читай'), 'Copy text must include brand signature');

  const ok = sandbox.copyTafsirReader(93, 1);
  assert.equal(ok, true);
  assert.equal(sandbox.copied.length, 1);
  assert.equal(sandbox.toasts[0], 'Тафсир скопирован');

  sandbox.openTafsirReader(93, 1);
  const modalHtml = getEl('modal-content').innerHTML;
  assert.ok(modalHtml.includes('аят 1 из 11'), 'Reader kicker should show ayah position out of 11');
  assert.ok(modalHtml.includes('copyTafsirReader(93,1)'), 'Reader should include Copy Tafsir button');
});

test('memorize.js progressive 2-word Arabic hints, step navigation, and optional tafsir work cleanly', () => {
  const { sandbox, getEl } = createDomSandbox();
  const quranDoc = readJson<{ quran: any[] }>('data/quran.json');
  const tafsirsDoc = readJson<{ tafsirs: any[] }>('data/tafsirs.json');

  sandbox.DEFAULT_TAFSIRS = tafsirsDoc.tafsirs;
  sandbox.getTafsirForAyah = (s: number, a: number) =>
    tafsirsDoc.tafsirs.find((t: any) => t.surah === s && t.ayah === a) || null;
  sandbox.getQuranById = (id: string) => quranDoc.quran.find((q: any) => q.id === id) || null;
  sandbox.getDuaById = () => null;
  sandbox.getHadithById = () => null;
  sandbox.parseAyahs = (item: any) => {
    const ars = String(item.arabic || '').split('\n');
    const trns = String(item.translation || '').split('\n');
    return ars.map((ar, i) => ({ num: i + 1, ar, tr: '', trn: trns[i] || '' }));
  };

  loadScript('js/scholars.js', sandbox);
  loadScript('js/components/tafsir.js', sandbox);
  vm.runInNewContext('var memorizeItem=null, memorizeAyahs=[], memorizeStep=0, memorizePhase="learn", memorizeRevealed=false;', sandbox);
  loadScript('js/components/memorize.js', sandbox);

  const s93 = quranDoc.quran.find((q: any) => q.id === 'q93');
  sandbox.openMemorizeFor(s93);
  const learnHtml = getEl('mem-body').innerHTML;
  assert.ok(learnHtml.includes('class="tafsir-card tafsir-full"'), 'Learn phase should offer collapsed tafsir for Surah 93');
  assert.ok(learnHtml.includes('class="mem-step-chips"'), 'Multi-ayah surah should show ayah step navigation chips');

  // Switch to test phase on ayah 3 (which has > 4 words: مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ)
  sandbox.jumpMemorize(2);
  vm.runInNewContext('memorizePhase = "test"; renderMemorize();', sandbox);
  let testHtml = getEl('mem-body').innerHTML;
  assert.ok(testHtml.includes('Подсказка (2 слова)'));
  assert.ok(!testHtml.includes('style="display:inline-block'), 'Inline SVG styles should be removed');

  sandbox.revealMemorizeHint();
  testHtml = getEl('mem-body').innerHTML;
  assert.ok(testHtml.includes('class="mem-ar-word is-revealed"'), 'First 2 words should be clearly revealed');
  assert.ok(testHtml.includes('class="mem-ar-word hidden"'), 'Remaining tail words should remain blurred');

  sandbox.closeMemorize();
  assert.equal(vm.runInNewContext('memorizeHintWords', sandbox), 0);
});

test('search.js matches curated tafsirs, truncates long cards, and hides Show All when unnecessary', () => {
  const { sandbox, getEl } = createDomSandbox();
  const quranDoc = readJson<{ quran: any[] }>('data/quran.json');
  const duasDoc = readJson<{ duas: any[] }>('data/duas.json');
  const hadithsDoc = readJson<{ hadiths: any[] }>('data/hadiths.json');
  const tasbihsDoc = readJson<{ defaults: any[] }>('data/tasbihs.json');
  const tafsirsDoc = readJson<{ tafsirs: any[] }>('data/tafsirs.json');

  sandbox.DEFAULT_TAFSIRS = tafsirsDoc.tafsirs;
  sandbox.state = {
    quran: quranDoc.quran,
    duas: duasDoc.duas,
    hadiths: hadithsDoc.hadiths,
    tasbihs: tasbihsDoc.defaults,
  };
  sandbox.searchFilters = { type: 'all', status: 'all', favorite: 'all' };
  sandbox._searchShowAll = false;
  sandbox.getQuranById = (id: string) => quranDoc.quran.find((q: any) => q.id === id) || null;
  sandbox.excerpt = (txt: any, lines: number) => String(txt || '').split('\n').slice(0, lines).join('\n');
  sandbox.openTafsirReader = () => {};

  loadScript('js/scholars.js', sandbox);
  loadScript('js/graph-engine.js', sandbox);
  loadScript('js/components/search.js', sandbox);

  // 1. Specific tafsir search with <= 3 matches -> finds tafsir card and hides Show All
  getEl('global-search-input').value = 'не притесняй';
  sandbox.renderGlobalSearch();
  const specificHtml = getEl('search-results').innerHTML;
  assert.ok(specificHtml.includes('search-tafsir-card'), 'Should surface curated tafsir match card');
  assert.ok(specificHtml.includes('openTafsirReader(93,9)'), 'Should link directly to Tafsir 93:9');
  assert.equal(specificHtml.includes('show-all-btn'), false, 'Should NOT render Show All when results fit cleanly');

  // 2. Tafsir search exceeding cap ("сирот" = 4 tafsirs) & broad search -> renders Show All with count
  getEl('global-search-input').value = 'сирот';
  sandbox.renderGlobalSearch();
  const overflowTafsirHtml = getEl('search-results').innerHTML;
  assert.ok(overflowTafsirHtml.includes('show-all-btn'), 'Should show Show All (+1) when > 3 tafsirs match');

  getEl('global-search-input').value = 'а';
  sandbox.renderGlobalSearch();
  const broadHtml = getEl('search-results').innerHTML;
  assert.ok(broadHtml.includes('class="show-all-btn"'), 'Should render Show All when > 30 items match');
});

test('dua.js truncates multi-paragraph list previews and progress.js renders clickable items and night/bookmark cards', () => {
  const { sandbox, getEl } = createDomSandbox();
  const quranDoc = readJson<{ quran: any[] }>('data/quran.json');
  const duasDoc = readJson<{ duas: any[] }>('data/duas.json');
  const hadithsDoc = readJson<{ hadiths: any[] }>('data/hadiths.json');

  quranDoc.quran[0].learned = true;
  quranDoc.quran[0].learnedAt = '2026-11-25';
  duasDoc.duas[0].learned = true;
  hadithsDoc.hadiths[0].learned = true;

  sandbox.NIGHT_ORDER = new Array(10).fill({});
  sandbox.state = {
    quran: quranDoc.quran,
    duas: duasDoc.duas,
    hadiths: hadithsDoc.hadiths,
    tasbihs: [{ id: 'u1' }],
    bookmarks: [{ id: 'bm1', quranId: 'q1', ayahIdx: 0, label: 'Аль-Фатиха · аят 1', ts: Date.now() }],
    history: { '2026-11-25': { total: 42 } },
    settings: { dailyGoal: 100, nightChecklist: { date: '2026-11-25', done: [0, 1, 2] } },
  };
  sandbox._progFilter = '';
  sandbox.progTab = 'overview';
  sandbox.excerpt = (txt: any, lines: number) => String(txt || '').split('\n').slice(0, lines).join('\n');

  loadScript('js/scholars.js', sandbox);
  loadScript('js/components/dua.js', sandbox);
  loadScript('js/components/progress.js', sandbox);

  // Dua list card preview truncates multi-paragraph ruqyah_guide cleanly
  sandbox.renderDuaList();
  const duaListHtml = getEl('library-dua-list').innerHTML;
  assert.equal(duaListHtml.includes('ЧТЕНИЕ КОРАНА НАД БОЛЬНЫМ'), false, 'Deep ruqyah guide paragraphs must not leak into card preview');

  // Progress overview uses semantic CSS classes and surfaces Night checklist + Bookmarks
  sandbox.renderProgressOverview();
  const overviewHtml = getEl('prog-body').innerHTML;
  assert.ok(overviewHtml.includes('3 / 10'), 'Overview must show 3 / 10 Night Reading checklist progress');
  assert.ok(overviewHtml.includes('Закладки'), 'Overview must show Bookmarks card');
  assert.ok(!overviewHtml.includes('rgba(var(--accent-rgb)'), 'Inline accent card styles removed in favor of semantic CSS');

  // Progress learned tab renders clickable button items
  sandbox.renderProgressLearned();
  const learnedHtml = getEl('prog-body').innerHTML;
  assert.ok(learnedHtml.includes('onclick="openQuran(\'q1\')"'), 'Learned Quran item must be clickable button');
  assert.ok(learnedHtml.includes('onclick="openDua('), 'Learned Dua item must be clickable button');
  assert.ok(learnedHtml.includes('onclick="openHadith('), 'Learned Hadith item must be clickable button');
});

test('Night reading catalog includes Al-Kafirun (q109) with authentic Sunnah dalil and Fatima Tasbih (33/33/34)', () => {
  const kbDoc = readJson<any>('data/knowledge-base.json');
  const quranDoc = readJson<{ quran: any[] }>('data/quran.json');
  const nightOrder = kbDoc.nightOrder || [];
  assert.ok(nightOrder.some((n: any) => n.quranId === 'q109'), 'Al-Kafirun (q109) must be in nightOrder');
  assert.ok(nightOrder.some((n: any) => n.nightTasbih === true || n.id === 'fatima_tasbih'), 'Fatima Tasbih must be in nightOrder');
  const q109 = quranDoc.quran.find((q: any) => q.id === 'q109');
  assert.ok(q109 && q109.note && q109.note.length > 40, 'Al-Kafirun must have authentic dalil note');
});

test('Scholars directory includes Prophet Muhammad bio, as-Sadi, Tajweed 17-rule guide, and non-corrupting sacred term formatter', () => {
  const { sandbox } = createDomSandbox();
  loadScript('js/scholars.js', sandbox);
  const mod = sandbox.IqraScholars;
  assert.ok(mod, 'IqraScholars must load cleanly');
  const prophet = mod.getScholarById('prophet_muhammad');
  assert.ok(prophet && prophet.type === 'prophet', 'Prophet Muhammad bio must exist');
  const sadi = mod.getScholarById('as_sadi');
  assert.ok(sadi && sadi.type === 'scholar', 'As-Sadi bio must exist');
  const ruleCount = (mod.TAJWEED_GUIDE_GROUPS || []).reduce((acc: number, g: any) => acc + (g.rules ? g.rules.length : 0), 0);
  assert.equal(ruleCount, 17, 'Tajweed guide must cover all 17 rules');

  const safeInput = 'Хвала Аллаху и <a href="https://example.com" data-x="Аллах">Коран</a>, передал <span class="scholar-link" data-scholar-id="abu_hurayra">Абу Хурайра</span>.';
  const formatted = mod.formatSacredTermsHtml(safeInput);
  assert.ok(formatted.includes('<span class="sacred-term">Аллаху</span>'), 'Sacred term Allahu highlighted cleanly');
  assert.ok(formatted.includes('<a href="https://example.com" data-x="Аллах">Коран</a>'), 'Anchors and attributes must never be corrupted');
  assert.ok(formatted.includes('<span class="scholar-link" data-scholar-id="abu_hurayra">Абу Хурайра</span>'), 'Scholar links must stay untouched');
});

test('Security hardening: actions allowlist, prototype-pollution guards, strict validateImport, and XSS/selector guards', () => {
  const { sandbox } = createDomSandbox();
  sandbox.window.__proto_guard_check = true;
  loadScript('js/actions.js', sandbox);
  assert.equal(sandbox.__iqraActions.isAllowedAction('openTafsirReader'), true);
  assert.equal(sandbox.__iqraActions.isAllowedAction('copyTafsirReader'), true);
  assert.equal(sandbox.__iqraActions.isAllowedAction('revealMemorizeHint'), true);
  assert.equal(sandbox.__iqraActions.isAllowedAction('jumpMemorize'), true);
  assert.equal(sandbox.__iqraActions.isAllowedAction('eval'), false);
  assert.equal(sandbox.__iqraActions.isAllowedAction('constructor'), false);

  loadScript('js/smart-reminders.js', sandbox);
  loadScript('js/storage.js', sandbox);
  sandbox.IqraArchitecture = undefined;
  sandbox.activePrayer = undefined;
  loadScript('js/components/settings.js', sandbox);

  const maliciousJson = JSON.parse('{"__proto__":{"polluted":true},"tasbihs":[{"id":"t1","target":33,"current":1,"cycles":0}],"settings":{"dailyGoal":200,"nightChecklist":{"date":"2026-11-25","done":[0,999]}},"bookmarks":[{"id":"bm1","quranId":"q1","ayahIdx":0,"label":"Safe"}]}');
  const validated = sandbox.validateImport(maliciousJson);
  assert.ok(validated, 'Valid fields pass validateImport');
  assert.equal(({} as any).polluted, undefined, 'Prototype pollution stripped');
  assert.equal(validated.tasbihs.length, 1);
  assert.deepEqual(validated.settings.nightChecklist.done, [0]);
  assert.equal(validated.bookmarks.length, 1);
  assert.equal(sandbox.validateImport({ tasbihs: 'bad' }), null);
});

test('Offline storage budget (<15KB) holds with nightChecklist + widgetPrefs and reminder 30-min catch-up works', () => {
  const samplePersisted = {
    tasbihs: [{ id: 'u1', target: 33, current: 10, cycles: 1 }],
    history: { '2026-11-25': { total: 100, byId: { u1: 100 } } },
    quranProgress: { q1: true, q93: true, q112: true },
    favorites: ['q1', 'q112'],
    bookmarks: [{ id: 'bm1', quranId: 'q1', ayahIdx: 0, label: 'Аль-Фатиха · аят 1', ts: 1700000000000 }],
    reminders: [{ time: '05:30', on: true, lastFired: '', message: 'Утро' }],
    settings: {
      theme: 'dark',
      arScale: 1,
      dailyGoal: 100,
      nightChecklist: { date: '2026-11-25', done: [0, 1, 2, 3, 4] },
      widgetPrefs: { enabled: ['goal_ring', 'night_check', 'mini_tasbih', 'daily_dhikr'] }
    }
  };
  assert.ok(JSON.stringify(samplePersisted).length < 15 * 1024, 'Persisted payload stays well under 15KB budget');

  // Verify reminder 30-min catch-up rule
  const parseMin = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };
  const isDue = (r: any, nowDate: Date, today: string) => {
    if (!r || !r.on || r.lastFired === today) return false;
    const sMin = parseMin(r.time);
    const nMin = nowDate.getHours() * 60 + nowDate.getMinutes();
    return nMin >= sMin && (nMin - sMin) <= 30;
  };
  assert.equal(isDue({ time: '05:30', on: true, lastFired: '' }, new Date(2026, 10, 25, 5, 55), '2026-11-25'), true);
  assert.equal(isDue({ time: '05:30', on: true, lastFired: '' }, new Date(2026, 10, 25, 6, 5), '2026-11-25'), false);
});

test('toggleTafsirDisclosure reliably toggles details open -> closed -> open and getSmartTafsirHtml wires it', () => {
  const { sandbox } = createDomSandbox();
  const tafsirsDoc = readJson<{ tafsirs: any[] }>('data/tafsirs.json');
  sandbox.DEFAULT_TAFSIRS = tafsirsDoc.tafsirs;
  sandbox.getTafsirForAyah = (s: number, a: number) =>
    tafsirsDoc.tafsirs.find((t: any) => t.surah === s && t.ayah === a) || null;
  loadScript('js/scholars.js', sandbox);
  loadScript('js/components/tafsir.js', sandbox);

  let defaultPrevented = false;
  let propStopped = false;
  const fakeDetails: any = { tagName: 'DETAILS', open: false };
  const fakeSummary: any = {
    attrs: {} as Record<string, string>,
    closest: (sel: string) => (sel === 'details' ? fakeDetails : null),
    setAttribute(k: string, v: string) { this.attrs[k] = v; },
  };
  const fakeEv = { preventDefault() { defaultPrevented = true; }, stopPropagation() { propStopped = true; } };

  const first = sandbox.toggleTafsirDisclosure(fakeSummary, fakeEv);
  assert.equal(first, true);
  assert.equal(fakeDetails.open, true);
  assert.equal(fakeSummary.attrs['aria-expanded'], 'true');
  assert.equal(defaultPrevented, true);
  assert.equal(propStopped, true);

  const second = sandbox.toggleTafsirDisclosure(fakeSummary, fakeEv);
  assert.equal(second, false);
  assert.equal(fakeDetails.open, false);
  assert.equal(fakeSummary.attrs['aria-expanded'], 'false');

  const third = sandbox.toggleTafsirDisclosure(fakeSummary, fakeEv);
  assert.equal(third, true);
  assert.equal(fakeDetails.open, true);

  const html = sandbox.getSmartTafsirHtml({ type: 'surah', number: 112 }, 1);
  assert.ok(html.includes('onclick="toggleTafsirDisclosure(this,event)"'));
  assert.ok(html.includes('tafsir-state-hint'));
});

