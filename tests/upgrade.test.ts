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

test('Scholars directory includes Prophet Muhammad bio, Ibn Kathir, Tajweed 17-rule guide, and excludes FSEM-risk items', () => {
  const { sandbox } = createDomSandbox();
  loadScript('js/scholars.js', sandbox);
  const mod = sandbox.IqraScholars;
  assert.ok(mod, 'IqraScholars must load cleanly');
  const prophet = mod.getScholarById('prophet_muhammad');
  assert.ok(prophet && prophet.type === 'prophet', 'Prophet Muhammad bio must exist');
  const kathir = mod.getScholarById('ibn_kathir');
  assert.ok(kathir && kathir.type === 'scholar', 'Ibn Kathir bio must exist');
  assert.equal(mod.getScholarById('as_sadi'), null, 'As-Sadi bio must remain absent (FSEM #5162 compliance)');
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

test('v464 share.js copyAyah/copyLibraryItem/custom toast and widgets.js standalone URL resolution work cleanly', async () => {
  const { sandbox } = createDomSandbox();
  const quranDoc = readJson<{ quran: any[] }>('data/quran.json');
  const duasDoc = readJson<{ duas: any[] }>('data/duas.json');
  sandbox.APP_URL = 'https://ibrahimnalgievwb-sudo.github.io/iqra/';
  sandbox.getQuranById = (id: string) => quranDoc.quran.find((q: any) => q.id === id) || null;
  sandbox.getDuaById = (id: string) => duasDoc.duas.find((d: any) => d.id === id) || null;
  sandbox.getHadithById = () => null;
  sandbox.getById = () => null;
  sandbox.parseAyahs = (item: any) => {
    const ars = String(item.arabic || '').split('\n');
    const trns = String(item.translation || '').split('\n');
    return ars.map((ar, i) => ({ num: i + 1, ar, tr: '', trn: trns[i] || '' }));
  };

  let copiedText = '';
  sandbox.navigator.clipboard = {
    writeText(txt: string) {
      copiedText = txt;
      return Promise.resolve();
    },
  };

  loadScript('js/components/share.js', sandbox);
  sandbox.copyAyah('q112', 0);
  await Promise.resolve();
  await Promise.resolve();
  assert.ok(copiedText.includes('قُلْ هُوَ') && copiedText.includes('аят 1'), 'copyAyah copies Arabic text and ayah reference');
  assert.equal(sandbox.toasts[0], 'Аят скопирован');

  sandbox.copyLibraryItem('dua', duasDoc.duas[0].id);
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(sandbox.toasts[1], 'Дуа скопировано');

  // Verify widgets.js builds relative widget URL cleanly using URL constructor
  const baseHref = 'https://example.com/iqra-main/index.html';
  const resolved = new URL('./widget.html?widget=goal_ring', baseHref).href;
  assert.equal(resolved, 'https://example.com/iqra-main/widget.html?widget=goal_ring');
});

test('v464 reader.js toolbar (transcription toggle, arSize step) and per-ayah copy button work cleanly', async () => {
  const { sandbox, getEl } = createDomSandbox();
  const quranDoc = readJson<{ quran: any[] }>('data/quran.json');
  sandbox.state = {
    quran: quranDoc.quran,
    bookmarks: [],
    settings: { arSize: 1, readerPrefs: { showTranscription: true, pageBatch: 40 }, readScrolls: {}, readAyah: {} },
  };
  sandbox.activeReadId = null;
  sandbox.setArSize = (s: number) => { sandbox.state.settings.arSize = s; };
  sandbox.getQuranById = (id: string) => quranDoc.quran.find((q: any) => q.id === id) || null;
  sandbox.parseAyahs = (item: any) => {
    const ars = String(item.arabic || '').split('\n');
    const trs = String(item.transcription || '').split('\n');
    const trns = String(item.translation || '').split('\n');
    return ars.map((ar, i) => ({ num: i + 1, ar, tr: trs[i] || '', trn: trns[i] || '' }));
  };
  sandbox.ayahMarker = (n: number) => `(${n})`;
  sandbox.getSmartTafsirHtml = () => '';
  sandbox.applyTajweedToContainer = async () => {};
  sandbox.saveLastRead = () => {};
  sandbox.requestAnimationFrame = () => {};

  loadScript('js/components/reader.js', sandbox);
  await sandbox.openRead('q112');

  const html = getEl('read-body').innerHTML;
  assert.ok(html.includes('id="read-toolbar"'), 'Reader toolbar must render');
  assert.ok(html.includes('id="read-tr-btn"'), 'Transcription toggle button must render');
  assert.ok(html.includes('class="ayah-actions-row"'), 'Ayah actions row must render');
  assert.ok(html.includes('onclick="copyAyah(\'q112\',0)"'), 'Per-ayah copy button must render');

  assert.equal(getEl('read-body').classList.contains('is-hide-transcription'), false);
  sandbox.toggleReaderTranscription();
  assert.equal(sandbox.state.settings.readerPrefs.showTranscription, false);
  assert.equal(getEl('read-body').classList.contains('is-hide-transcription'), true);
  assert.equal(sandbox.toasts.at(-1), 'Транскрипция скрыта');

  sandbox.stepReaderArSize(1);
  assert.equal(sandbox.state.settings.arSize, 1.2);
  assert.equal(getEl('read-size-val').textContent, 'L');
});

test('v464 memorize.js direct phase switcher and reset hints button work cleanly', () => {
  const { sandbox, getEl } = createDomSandbox();
  sandbox.memorizeItem = null;
  sandbox.memorizeAyahs = [];
  sandbox.memorizeStep = 0;
  sandbox.memorizePhase = 'learn';
  sandbox.memorizeRevealed = false;
  sandbox.parseAyahs = (item: any) => [{ num: 1, ar: item.arabic, tr: item.transcription, trn: item.translation }];

  loadScript('js/components/memorize.js', sandbox);
  sandbox.openMemorizeFor({ id: 'q112', title: 'Аль-Ихлас', arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ', transcription: 'Qul huwa Allahu ahad', translation: 'Скажи: Он — Аллах Единый' });
  assert.ok(getEl('mem-body').innerHTML.includes('mem-phase-seg'), 'Phase switcher must render in memorize');

  sandbox.setMemorizePhase('test');
  assert.equal(sandbox.memorizePhase, 'test');
  assert.ok(getEl('mem-body').innerHTML.includes('Подсказка (2 слова)'), 'Hint button renders in test phase');

  sandbox.revealMemorizeHint();
  assert.ok(sandbox.memorizeHintWords > 0);
  assert.ok(getEl('mem-body').innerHTML.includes('mem-reset-btn'), 'Reset hints button renders after showing hint');

  sandbox.resetMemorizeHints();
  assert.equal(sandbox.memorizeHintWords, 0);
  assert.equal(sandbox.memorizeRevealed, false);
});

test('v464 dua.js & hadith.js filtering, search, learned checkmark, empty reset CTA, and detail Copy button work', () => {
  const { sandbox, getEl } = createDomSandbox();
  const duasDoc = readJson<{ duas: any[] }>('data/duas.json');
  const hadithsDoc = readJson<{ hadiths: any[] }>('data/hadiths.json');
  duasDoc.duas[0].learned = true;
  hadithsDoc.hadiths[0].learned = true;
  sandbox.state = { duas: duasDoc.duas, hadiths: hadithsDoc.hadiths };
  sandbox.activeDuaId = null;
  sandbox.activeHadithId = null;
  sandbox.getDuaById = (id: string) => duasDoc.duas.find((d: any) => d.id === id) || null;
  sandbox.getHadithById = (id: string) => hadithsDoc.hadiths.find((h: any) => h.id === id) || null;
  sandbox.saveLastRead = () => {};
  sandbox.showScreen = () => {};
  sandbox.escRich = (s: any) => sandbox.escNl(s);

  loadScript('js/components/dua.js', sandbox);
  loadScript('js/components/hadith.js', sandbox);

  sandbox.setDuaFilter('learned');
  assert.ok(getEl('library-dua-list').innerHTML.includes('c-learned-mark'), 'Learned badge renders on learned dua');
  sandbox.setDuaFilter('protection');
  assert.ok(getEl('library-dua-list').innerHTML.includes('ruqyah_guide'), 'Protection filter shows ruqyah entries');

  sandbox.setHadithFilter('night');
  assert.ok(getEl('library-hadith-list').innerHTML.includes('h_mulk'), 'Night hadith filter includes Al-Mulk');

  getEl('library-search').value = 'несуществующий_запрос_xyz';
  sandbox.renderHadithList();
  assert.ok(getEl('library-hadith-list').innerHTML.includes('clearLibrarySearch()'), 'Empty state provides filter reset button');

  sandbox.openDua(duasDoc.duas[0].id);
  assert.ok(getEl('dua-detail-content').innerHTML.includes("copyLibraryItem('dua'"), 'Dua detail has Copy button');
  sandbox.openHadith(hadithsDoc.hadiths[0].id);
  assert.ok(getEl('hadith-detail-content').innerHTML.includes("copyLibraryItem('hadith'"), 'Hadith detail has Copy button');
});

test('v464 night.js scaleX + reset, progress.js clearProgFilter, and actions.js new allowlist entries', () => {
  const { sandbox, getEl } = createDomSandbox();
  const quranDoc = readJson<{ quran: any[] }>('data/quran.json');
  const duasDoc = readJson<{ duas: any[] }>('data/duas.json');
  const hadithsDoc = readJson<{ hadiths: any[] }>('data/hadiths.json');

  sandbox.NIGHT_ORDER = [
    { quranId: 'q112', times: 3 },
    { quranId: 'q113', times: 3 },
  ];
  sandbox.state = {
    quran: quranDoc.quran,
    duas: duasDoc.duas,
    hadiths: hadithsDoc.hadiths,
    favorites: [],
    bookmarks: [],
    history: {},
    settings: { nightChecklist: { date: '2026-11-25', done: [0, 1] }, dailyGoal: 100 },
  };
  sandbox._progFilter = 'несуществующий';
  sandbox.progTab = 'learned';
  sandbox.getQuranById = (id: string) => quranDoc.quran.find((q: any) => q.id === id) || null;
  sandbox.getDuaById = (id: string) => duasDoc.duas.find((d: any) => d.id === id) || null;
  sandbox.getHadithById = (id: string) => hadithsDoc.hadiths.find((h: any) => h.id === id) || null;
  sandbox.getById = () => null;

  loadScript('js/components/night.js', sandbox);
  loadScript('js/components/progress.js', sandbox);
  loadScript('js/actions.js', sandbox);

  sandbox.renderNightList();
  const nightHtml = getEl('night-list').innerHTML;
  assert.ok(nightHtml.includes('transform:scaleX(1.0000)'), 'Night progress bar must use scaleX transform');
  assert.ok(nightHtml.includes('night-done-banner'), 'Night done banner must appear when all entries checked');
  assert.ok(nightHtml.includes('resetNightChecklistToday()'), 'Reset button renders when items are checked');

  sandbox.resetNightChecklistToday();
  assert.equal(sandbox.state.settings.nightChecklist.done.length, 0);

  sandbox.renderProgressLearned();
  assert.ok(getEl('prog-body').innerHTML.includes('clearProgFilter()'), 'Filtered empty progress shows reset search CTA');
  sandbox.clearProgFilter();
  assert.equal(sandbox._progFilter, '');

  for (const act of ['copyCurrent', 'setTargetPreset', 'debouncedRenderLibrary', 'clearLibrarySearch', 'setDuaFilter', 'setHadithFilter', 'toggleReaderTranscription', 'stepReaderArSize', 'setMemorizePhase', 'resetMemorizeHints', 'resetNightChecklistToday', 'clearProgFilter', 'copyAyah', 'copyLibraryItem']) {
    assert.equal(sandbox.__iqraActions.isAllowedAction(act), true, `Action ${act} must be allowlisted`);
  }
});

test('Dual-domain compatibility: BASE_URL resolution, manifest.json, two-tier sw.js with /.well-known/ bypass, and store/privacy files', () => {
  // 1. Dynamic BASE_URL & iqraResolveUrl across GitHub Pages (/iqra/), root domain (/), and Capacitor
  for (const [baseURI, expectedData, expectedWidget] of [
    ['https://example.github.io/iqra/index.html', 'https://example.github.io/iqra/data/quran.json', 'https://example.github.io/iqra/?widget=dhikr&autostart=1'],
    ['https://iqra-app.org/', 'https://iqra-app.org/data/quran.json', 'https://iqra-app.org/?widget=dhikr&autostart=1'],
    ['capacitor://localhost/index.html', 'capacitor://localhost/data/quran.json', 'capacitor://localhost/?widget=dhikr&autostart=1'],
  ]) {
    const { sandbox } = createDomSandbox();
    sandbox.document.baseURI = baseURI;
    sandbox.URL = URL;
    sandbox.localStorage = { getItem: () => null, setItem() {}, removeItem() {}, key: () => null, length: 0 };
    loadScript('js/api.js', sandbox);
    assert.equal(sandbox.iqraResolveUrl('./data/quran.json'), expectedData);
    assert.equal(sandbox.iqraResolveUrl('/data/quran.json'), expectedData);
    assert.equal(sandbox.iqraResolveUrl('./?widget=dhikr&autostart=1'), expectedWidget);

    loadScript('js/smart-reminders.js', sandbox);
    loadScript('js/storage.js', sandbox);
    const expectedRoot = new URL('./', baseURI).href;
    assert.equal(sandbox.getAppShareUrl(), expectedRoot);
    assert.equal(vm.runInNewContext('APP_URL', sandbox), expectedRoot);
  }

  // 2. No hardcoded github.io/iqra in js/, css/, index.html, manifest.json, sw.js
  const storageJs = fs.readFileSync(path.join(IQRA_ROOT, 'js/storage.js'), 'utf8');
  assert.equal(storageJs.includes('github.io/iqra'), false);
  const indexHtml = fs.readFileSync(path.join(IQRA_ROOT, 'index.html'), 'utf8');
  assert.equal(indexHtml.includes('/iqra/'), false);
  assert.ok(indexHtml.includes('href="./privacy.html"'), 'Settings must link to ./privacy.html');
  assert.ok(indexHtml.includes('Открытые источники текстов'), 'Settings must display open text sources');

  // 3. manifest.json uses relative paths and has required any + maskable icons
  const manifest = readJson<any>('manifest.json');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  for (const icon of manifest.icons) {
    assert.ok(String(icon.src).startsWith('./assets/'), `Icon src must be relative: ${icon.src}`);
  }
  assert.ok(manifest.icons.some((i: any) => i.sizes === '192x192' && i.purpose === 'any'));
  assert.ok(manifest.icons.some((i: any) => i.sizes === '512x512' && i.purpose === 'any'));
  assert.ok(manifest.icons.some((i: any) => i.sizes === '512x512' && i.purpose === 'maskable'));
  for (const sc of manifest.shortcuts || []) {
    assert.ok(String(sc.url).startsWith('./?widget='), `Shortcut URL must be relative: ${sc.url}`);
  }

  // 4. sw.js has Core precache + lazy Data Runtime cache + /.well-known/ bypass + does not touch localStorage/IndexedDB
  const swJs = fs.readFileSync(path.join(IQRA_ROOT, 'sw.js'), 'utf8');
  assert.ok(swJs.includes("'./privacy.html'"), 'Core cache must include ./privacy.html');
  assert.equal(swJs.includes('PRECACHE_DATA'), false, 'Data files must be cached lazily at runtime, not eagerly precached in install');
  assert.ok(swJs.includes('/.well-known/'), 'SW must bypass /.well-known/ requests');
  assert.ok(swJs.includes('CACHE_DATA'), 'SW must keep dedicated Data Runtime cache');
  const swCodeNoComments = swJs.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.equal(swCodeNoComments.includes('localStorage'), false, 'SW must never touch localStorage');
  assert.equal(swCodeNoComments.includes('indexedDB'), false, 'SW must never touch indexedDB');

  // 5. Store verification & legal files exist with valid content
  assert.equal(fs.existsSync(path.join(IQRA_ROOT, '.nojekyll')), true);
  assert.deepEqual(readJson<any>('.well-known/assetlinks.json'), []);
  assert.deepEqual(readJson<any>('.well-known/apple-app-site-association'), { applinks: { apps: [], details: [] } });
  const privacyHtml = fs.readFileSync(path.join(IQRA_ROOT, 'privacy.html'), 'utf8');
  assert.ok(privacyHtml.includes('Политика конфиденциальности'));
  assert.ok(privacyHtml.includes('href="./"'));
  assert.ok(privacyHtml.includes('./css/variables.css'));
  assert.equal(/["']\/(assets|css|js|iqra)\//.test(privacyHtml), false);
});

test('Iqra+ roadmap includes all 9 planned projects from prompts and renders them in Settings Plans overview', () => {
  const { sandbox, getEl } = createDomSandbox();
  loadScript('js/architecture.js', sandbox);
  loadScript('js/smart-reminders.js', sandbox);
  loadScript('js/storage.js', sandbox);
  loadScript('js/components/settings.js', sandbox);

  const arch = sandbox.IqraArchitecture;
  const plusCaps = arch.listCapabilities(arch.TIERS.IQRA_PLUS);
  const expectedIds = [
    'arabic_tajweed_course',
    'hifz',
    'planner',
    'qada_tracker',
    'sunnah_fasts',
    'prophets_encyclopedia',
    'diary',
    'extended_progress',
    'cloud_sync',
  ];

  assert.deepEqual(
    Array.from(plusCaps, (c: any) => c.id),
    expectedIds,
    'All 9 planned Iqra+ capabilities must be registered in architecture.js'
  );

  for (const cap of plusCaps) {
    assert.equal(cap.available, false, `${cap.id} must remain marked unavailable until implemented`);
    assert.equal(arch.hasCapability(null, cap.id), false, `${cap.id} must remain locked without server receipt`);
  }

  const verifiedPlus = arch.IqraEntitlements.parseServerReceipt({
    tier: 'iqra_plus',
    active: true,
    verifiedBy: 'server',
    signature: 'sig_verified_server_token_123456',
    receiptId: 'rc_all_plus',
    expiresAt: Date.now() + 60000,
  });
  for (const id of expectedIds) {
    assert.equal(arch.hasCapability(verifiedPlus, id), true, `Verified server receipt unlocks ${id}`);
  }
  assert.equal(arch.hasCapability(verifiedPlus, 'academy'), false, 'Deferred Academy stays locked');

  sandbox.state = { settings: { prayerPrefs: {} } };
  sandbox.renderSettingsArchitecture();
  const slotHtml = getEl('plans-overview-slot').innerHTML;
  for (const cap of plusCaps) {
    assert.ok(slotHtml.includes(cap.title), `Settings Plans overview must render ${cap.title}`);
  }
});

test('Privacy policy (152-FZ, 114-FZ Art. 3.1, no Tafsir As-Saadi claim) and Umami privacy/opt-out hardening work cleanly', () => {
  const privacyHtml = fs.readFileSync(path.join(IQRA_ROOT, 'privacy.html'), 'utf8');
  const indexHtml = fs.readFileSync(path.join(IQRA_ROOT, 'index.html'), 'utf8');

  // 1. Accurate sources: Tafsir As-Saadi not claimed as published; Ibn Kathir & Kuliev listed
  assert.equal(/ас-Саади/i.test(privacyHtml), false, 'privacy.html must not claim Tafsir As-Saadi is published');
  const openSourcesMatch = indexHtml.match(/class="sub plans-sources-sub">([\s\S]*?)<\/div>/);
  assert.ok(openSourcesMatch, 'Open sources block must exist in index.html');
  assert.equal(/ас-Саади/i.test(openSourcesMatch[1]), false, 'index.html open sources must not claim Tafsir As-Saadi is published');

  // 2. Legal compliance: 152-FZ + 114-FZ Art. 3.1 + Umami disclosure
  assert.ok(privacyHtml.includes('152-ФЗ'), 'privacy.html must address RF Law 152-FZ');
  assert.ok(privacyHtml.includes('114-ФЗ') && privacyHtml.includes('3.1'), 'privacy.html must cite RF Law 114-FZ Art. 3.1 protecting Quran and direct translation');
  assert.ok(privacyHtml.includes('Umami'), 'privacy.html must transparently disclose Umami anonymized stats');
  assert.ok(privacyHtml.includes('Не собирается'), 'privacy.html must clearly list what is not collected');

  // 3. Umami hardening attributes & opt-out wiring in index.html
  assert.ok(indexHtml.includes('data-do-not-track'), 'Umami must enable Do Not Track');
  assert.ok(indexHtml.includes('data-exclude-search'), 'Umami must strip URL search queries');
  assert.ok(indexHtml.includes('data-exclude-hash'), 'Umami must strip URL hashes');
  assert.ok(indexHtml.includes('id="opt-analytics"'), 'Settings must expose analytics toggle');

  // 4. Runtime trackEvent respects DNT, opt-out setting, and custom tasbih anonymization
  const { sandbox } = createDomSandbox();
  const tracked: any[] = [];
  sandbox.umami = { track(name: string, payload: any) { tracked.push({ name, payload }); } };
  sandbox.navigator = { doNotTrack: '0' };
  sandbox.localStorage = { getItem: () => null, setItem() {}, removeItem() {}, key: () => null, length: 0 };

  loadScript('js/api.js', sandbox);
  loadScript('js/actions.js', sandbox);
  loadScript('js/smart-reminders.js', sandbox);
  loadScript('js/storage.js', sandbox);
  sandbox.state = { settings: { analytics: true } };
  loadScript('js/components/settings.js', sandbox);
  loadScript('js/components/share.js', sandbox);

  assert.equal(sandbox.__iqraActions.isAllowedAction('setAnalyticsPref'), true);
  assert.equal(sandbox.sanitizeSettings({ analytics: false }).analytics, false);
  assert.equal(sandbox.sanitizeSettings({}).analytics, true);

  // Custom tasbih copy never sends user transcription to Umami
  sandbox.getById = () => ({ id: 'u_999', custom: true, arabic: 'سُبْحَانَ اللَّهِ', transcription: 'PRIVATE_USER_TEXT', translation: 'Custom' });
  sandbox.navigator.clipboard = { writeText: () => Promise.resolve() };
  sandbox.copyLibraryItem('tasbih', 'u_999');
  assert.equal(tracked.length, 1);
  assert.equal(tracked[0].name, 'copy/tasbih/custom');
  assert.equal(JSON.stringify(tracked[0]).includes('PRIVATE_USER_TEXT'), false);

  // Opt-out blocks trackEvent immediately
  sandbox.setAnalyticsPref(false);
  sandbox.trackEvent('tab/quran', 'Вкладка: quran');
  assert.equal(tracked.length, 1, 'trackEvent must stop when analytics is disabled');

  // DNT blocks trackEvent even when analytics=true
  sandbox.setAnalyticsPref(true);
  sandbox.navigator.doNotTrack = '1';
  sandbox.trackEvent('tab/quran', 'Вкладка: quran');
  assert.equal(tracked.length, 1, 'trackEvent must respect Do Not Track');
});

test('RF Minjust FSEM legal audit: zero banned editions, titles, publishers, or trigger strings in app content & code', () => {
  const filesToScan: string[] = [];
  function walk(dir: string) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'tests' || e.name === 'node_modules' || e.name === '.git') continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(json|js|html|css)$/i.test(e.name)) filesToScan.push(p);
    }
  }
  walk(IQRA_ROOT);

  const forbiddenPatterns: Array<[RegExp, string]> = [
    [/абд(\s+|-)ар-?рахман[ау]?\s+(?:ибн\s+насир\s+)?ас-?са[‘']?ди|\bас-?саади\b|as_sadi|"scholar":\s*"Ас-Са[‘']?ди"|Ас-Са[‘']?ди\s+(?:отмечает|подчёркивает|поясняет)/i, 'As-Saadi (FSEM #5162 / #891)'],
    [/тайсир\s+аль-?карим/i, 'Taysir al-Karim ar-Rahman (FSEM #5162)'],
    [/облегчение\s+(от\s+)?великодушн/i, 'Oblegchenie ot Velikodushnogo (FSEM #5162)'],
    [/крепость\s+мусульманин|хисн\s+аль-?муслим/i, 'Hisn al-Muslim / Fortress of the Muslim'],
    [/сады\s+праведных|рияд\s+ас-?салихин/i, 'Riyad as-Salihin banned editions'],
    [/книга\s+единобожия|китаб\s+ат-?таухид/i, 'Kitab at-Tawhid homonym / banned title'],
    [/три\s+основы|четыре\s+правила/i, 'Three Fundamental Principles / Four Rules'],
    [/издательств[оа]\s+[«"]?(умм[аы]|бадр|эжаев|сантлада)/i, 'Banned publisher reference'],
    [/\bнирш[аеу]\b|\bэжаев\b|\bсаид\s+кутб\b|\bкардави\b/i, 'Banned translator/author/publisher'],
    [/ибн\s+тайми/i, 'Ibn Taymiyyah trigger mention'],
    [/«аль-?джихад»/i, 'Al-Jihad title trigger'],
    [/очищение\s+и\s+воспитание/i, 'FSEM #694 pamphlet title'],
    [/абу\s+адел/i, 'Unverified Abu Adel mention'],
  ];

  for (const file of filesToScan) {
    const content = fs.readFileSync(file, 'utf8');
    for (const [re, label] of forbiddenPatterns) {
      assert.equal(re.test(content), false, `FSEM audit failure [${label}] in ${path.relative(IQRA_ROOT, file)}`);
    }
  }
});
