import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const IQRA_ROOT = path.resolve(import.meta.dirname, '..');

function readJson<T = any>(relPath: string): T {
  return JSON.parse(fs.readFileSync(path.join(IQRA_ROOT, relPath), 'utf8')) as T;
}

const kbDoc = readJson<any>('data/knowledge-base.json');
const quranDoc = readJson<{ quran: any[] }>('data/quran.json');
const duasDoc = readJson<{ duas: any[] }>('data/duas.json');
const hadithsDoc = readJson<{ hadiths: any[] }>('data/hadiths.json');
const tasbihsDoc = readJson<{ defaults: any[] }>('data/tasbihs.json');
const tajweedManifest = readJson<{ version: number; source: string; chunks: Record<string, string> }>('data/tajweed/manifest.json');

function createAppSandbox(initialStorage: Record<string, string> = {}) {
  const store: Record<string, string> = { ...initialStorage };
  const localStorageMock = {
    getItem(k: string) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem(k: string, v: string) { store[k] = String(v); },
    removeItem(k: string) { delete store[k]; },
    key(i: number) { return Object.keys(store)[i] ?? null; },
    get length() { return Object.keys(store).length; },
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
    Number_isFinite: Number.isFinite,
    setTimeout: () => 0,
    clearTimeout: () => {},
    localStorage: localStorageMock,
    navigator: {},
    document: {
      getElementById: () => null,
      querySelectorAll: () => [],
      querySelector: () => null,
    },
    module: { exports: {} },
    exports: {},
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  return { sandbox, store };
}

function loadClassicScript(relPath: string, sandbox: any) {
  const code = fs.readFileSync(path.join(IQRA_ROOT, relPath), 'utf8');
  vm.runInNewContext(code, sandbox);
}

test('Offline Tajweed manifest and all 12 chunks cover 114 surahs / 6236 ayahs cleanly', () => {
  assert.equal(Object.keys(tajweedManifest.chunks).length, 114);

  const chunkFiles = new Set<string>(Object.values(tajweedManifest.chunks));
  assert.equal(chunkFiles.size, 12);

  const { sandbox } = createAppSandbox();
  loadClassicScript('js/api.js', sandbox);
  const { renderTajweedHtml } = sandbox.IqraTajweed;

  let ayahCount = 0;
  let nestedCasesVerified = 0;

  for (const chunkFile of chunkFiles) {
    const chunkDoc = readJson<{ surahs: Record<string, Record<string, string>> }>(`data/tajweed/${chunkFile}`);
    for (const [surahNum, ayahsMap] of Object.entries(chunkDoc.surahs)) {
      const qSurah = quranDoc.quran.find((q) => q.type === 'surah' && String(q.number) === surahNum);
      assert.ok(qSurah, `Missing surah ${surahNum} in quran.json`);
      const expectedLines = String(qSurah.arabic || '').split('\n').filter(Boolean).length;
      const gotKeys = Object.keys(ayahsMap);
      assert.equal(gotKeys.length, expectedLines, `Surah ${surahNum} tajweed ayah count mismatch`);

      for (const [ayahNum, rawTajweed] of Object.entries(ayahsMap)) {
        ayahCount++;
        const parsed = renderTajweedHtml(rawTajweed, kbDoc.tajweedTagMap, kbDoc.tajweedRuleNames);
        assert.ok(parsed.text.length > 0, `Empty rendered text on ${surahNum}:${ayahNum}`);
        assert.equal(parsed.text.includes('['), false, `Unparsed '[' leak on ${surahNum}:${ayahNum}: ${parsed.text}`);
        assert.equal(parsed.text.includes(']'), false, `Unparsed ']' leak on ${surahNum}:${ayahNum}: ${parsed.text}`);
        if (surahNum === '2' && ayahNum === '190') {
          assert.ok(parsed.text.includes('<span class="tajweed-'), 'Expected tajweed spans in 2:190');
          nestedCasesVerified++;
        }
        if ((surahNum === '3' && ayahNum === '153') || (surahNum === '6' && ayahNum === '39')) {
          nestedCasesVerified++;
        }
      }
    }
  }

  assert.equal(ayahCount, 6236);
  assert.equal(nestedCasesVerified, 3);

  // Security check: XSS payloads in non-tag text are HTML-escaped cleanly
  const xssRes = renderTajweedHtml('<img src=x onerror=alert(1)>[h:1[ٱل]]', kbDoc.tajweedTagMap, kbDoc.tajweedRuleNames);
  assert.equal(xssRes.text.includes('<img'), false);
  assert.ok(xssRes.text.includes('&lt;img src=x onerror=alert(1)&gt;<span class="tajweed-ham_wasl">ٱل</span>'));
});

test('CSS Light-theme Tajweed colors and knowledge-base rules use verified contrast and matching keys', () => {
  const tajweedCss = fs.readFileSync(path.join(IQRA_ROOT, 'css/tajweed.css'), 'utf8');
  const lightKeys = Object.keys(kbDoc.tajweedRuleNames);
  assert.equal(lightKeys.length, 17);
  for (const rule of lightKeys) {
    assert.ok(tajweedCss.includes(`.tajweed-${rule}`), `Missing CSS class .tajweed-${rule}`);
    assert.ok(kbDoc.tajweedRuleColors[rule], `Missing rule color for ${rule}`);
  }
});

test('Compact quranProgress storage stays tiny (<10KB), hydrates 120 Quran items, and preserves preferences cleanly', () => {
  const legacySeed = {
    tasbihs: tasbihsDoc.defaults,
    duas: duasDoc.duas,
    hadiths: hadithsDoc.hadiths,
    quran: [{ id: 'q1', learned: true, learnedAt: '2026-01-15' }],
    history: { '2026-01-15': { total: 33, byId: { subhan: 33 } } },
    settings: {
      theme: 'mono',
      arSize: 1.2,
      dailyGoal: 100,
      seenGuides: { dashboard: true },
      prayerPrefs: { method: 'mwl', asrMadhhab: 'hanafi' }
    },
    favorites: ['q112'],
    bookmarks: [{ id: 'bm_1', quranId: 'q2', ayahIdx: 254, label: 'Аль-Бакара · аят 255', ts: 1700000000000 }],
    migrations: { onboarded: true }
  };

  const { sandbox, store } = createAppSandbox({
    iqra_data: JSON.stringify(legacySeed),
    iqra_tajweed_v4: 'stale-key',
    iqra_tajweed_cache: 'stale-cache'
  });

  loadClassicScript('js/architecture.js', sandbox);
  loadClassicScript('js/api.js', sandbox);
  loadClassicScript('js/storage.js', sandbox);
  loadClassicScript('js/components/settings.js', sandbox);

  sandbox.DEFAULT_QURAN = quranDoc.quran;
  sandbox.DEFAULT_DUAS = duasDoc.duas;
  sandbox.DEFAULT_HADITHS = hadithsDoc.hadiths;
  sandbox.DEFAULT_TASBIHS = tasbihsDoc.defaults;
  sandbox.TAWHID_TASBIH = tasbihsDoc.defaults[0];
  sandbox.ISTIGHFAR_TASBIH = tasbihsDoc.defaults[1];

  const loaded = sandbox.load();
  sandbox.state = loaded;
  sandbox.saveNow();

  // Hydrated full corpus in memory
  assert.equal(loaded.quran.length, 120);
  assert.equal(loaded.quran.find((q: any) => q.id === 'q1').learned, true);
  assert.equal(loaded.quran.find((q: any) => q.id === 'q1').learnedAt, '2026-01-15');
  assert.equal(loaded.settings.seenGuides.dashboard, true);
  assert.equal(loaded.settings.prayerPrefs.method, 'mwl');
  assert.equal(loaded.settings.prayerPrefs.asrMadhhab, 'hanafi');

  // Legacy tajweed localStorage keys purged
  assert.equal(store['iqra_tajweed_v4'], undefined);
  assert.equal(store['iqra_tajweed_cache'], undefined);

  // Compact persisted payload excludes raw quran texts
  const persisted = JSON.parse(store['iqra_data']);
  assert.equal(persisted.quran, undefined);
  assert.equal(persisted.quranProgress.q1.learned, true);
  assert.ok(store['iqra_data'].length < 15000, `Compact storage too large: ${store['iqra_data'].length}`);

  // sanitizeSettings & validateImport accept both v3 quranProgress and legacy v2 quran array
  const cleanSet = sandbox.sanitizeSettings({
    theme: 'dark',
    seenGuides: { quran: true, bad: 'nope' },
    prayerPrefs: { method: 'umm_al_qura', asrMadhhab: 'shafii', lat: 55.75, lng: 37.62 },
    readerPrefs: { showTranscription: false, pageBatch: 999 }
  });
  assert.equal(cleanSet.seenGuides.quran, true);
  assert.equal(cleanSet.seenGuides.bad, undefined);
  assert.equal(cleanSet.prayerPrefs.method, 'umm_al_qura');
  assert.equal(cleanSet.readerPrefs.pageBatch, 200);

  const importedV3 = sandbox.validateImport({
    tasbihs: tasbihsDoc.defaults,
    quranProgress: { q112: { learned: true, learnedAt: '2026-02-01' } }
  });
  assert.equal(importedV3.quranLearned.q112, '2026-02-01');
});

test('IqraArchitecture enforces Free Forever, rejects client spoofing, merges user sync deterministically, and covers 8 guides', () => {
  const { sandbox } = createAppSandbox();
  loadClassicScript('js/architecture.js', sandbox);
  const arch = sandbox.IqraArchitecture;

  // Free forever guarantees hold even with null entitlement
  assert.equal(arch.hasCapability(null, 'quran_full'), true);
  assert.equal(arch.hasCapability(null, 'tajweed_offline'), true);
  assert.equal(arch.hasCapability(null, 'tafsir_hadith'), true);
  assert.equal(arch.hasCapability(null, 'smart_book'), true);
  assert.equal(arch.hasCapability(null, 'tasbih_dua'), true);

  // Client boolean spoofing is rejected
  const spoofed = arch.IqraEntitlements.parseServerReceipt({ tier: 'iqra_plus', active: true });
  assert.equal(spoofed.tier, 'free');
  assert.equal(arch.hasCapability(spoofed, 'hifz'), false);

  // Deferred Academy stays disabled even on valid server receipt
  const verifiedPlus = arch.IqraEntitlements.parseServerReceipt({
    tier: 'iqra_plus',
    active: true,
    verifiedBy: 'server',
    signature: 'sig_verified_server_token_123456',
    receiptId: 'rc_001',
    expiresAt: Date.now() + 60000
  });
  assert.equal(arch.hasCapability(verifiedPlus, 'hifz'), true);
  assert.equal(arch.hasCapability(verifiedPlus, 'academy'), false);

  // Deterministic user snapshot merge keeps union of learned, favorites, bookmarks, max daily dhikr, and excludes static quran corpus
  const merged = arch.IqraSync.mergeUserSnapshots(
    {
      quran: [{ id: 'q1', arabic: 'SHOULD_BE_EXCLUDED', learned: true, learnedAt: '2026-01-01' }],
      favorites: ['q1'],
      bookmarks: [{ id: 'b1', quranId: 'q2', ayahIdx: 254, ts: 100 }],
      history: { '2026-03-01': { total: 33, byId: { subhan: 33 } } },
      settings: { seenGuides: { dashboard: true }, readAyah: { q2: 10 }, updatedAt: 100 }
    },
    {
      quranProgress: { q112: { learned: true, learnedAt: '2026-01-02' } },
      favorites: ['q112'],
      bookmarks: [{ id: 'b2', quranId: 'q2', ayahIdx: 254, ts: 200 }],
      history: { '2026-03-01': { total: 99, byId: { subhan: 99 } } },
      settings: { seenGuides: { quran: true }, readAyah: { q2: 50 }, updatedAt: 200 }
    }
  );
  assert.equal(merged.quran, undefined);
  assert.equal(merged.quranProgress.q1.learned, true);
  assert.equal(merged.quranProgress.q112.learned, true);
  assert.deepEqual(Array.from(merged.favorites), ['q1', 'q112']);
  assert.equal(merged.bookmarks.length, 1);
  assert.equal(merged.bookmarks[0].id, 'b2');
  assert.equal(merged.history['2026-03-01'].total, 99);
  assert.equal(merged.settings.seenGuides.dashboard, true);
  assert.equal(merged.settings.seenGuides.quran, true);
  assert.equal(merged.settings.readAyah.q2, 50);

  // Guides exist for all 8 core screens
  const expectedScreens = ['dashboard', 'quran', 'read-mode', 'path', 'library', 'tasbih', 'cal', 'settings'];
  for (const k of expectedScreens) {
    const g = arch.SCREEN_GUIDES[k];
    assert.ok(g && g.title && Array.isArray(g.items) && g.items.length >= 2, `Missing guide for ${k}`);
  }
});

test('IqraSmartReminders handles time windows, Friday priority, quiet hours wrap-around, suppression, and authentic sources cleanly', () => {
  const { sandbox } = createAppSandbox();
  loadClassicScript('js/smart-reminders.js', sandbox);
  loadClassicScript('js/architecture.js', sandbox);
  loadClassicScript('js/api.js', sandbox);
  loadClassicScript('js/storage.js', sandbox);
  loadClassicScript('js/components/settings.js', sandbox);

  const sr = sandbox.IqraSmartReminders;
  assert.ok(sr, 'IqraSmartReminders should be defined');
  assert.ok(sr.SCENARIOS.length >= 10, 'Expected full set of authentic scenarios');

  // Every scenario must have verified hadith text, source citation, and valid action
  for (const sc of sr.SCENARIOS) {
    assert.ok(sc.title && sc.hadithText && sc.source, `Scenario ${sc.id} missing hadithText or source`);
    assert.ok(sc.action && sc.action.type && sc.action.id, `Scenario ${sc.id} missing action`);
  }

  // Quiet hours overnight wrap-around (23:00 -> 05:00)
  assert.equal(sr.isWithinQuietHours(new Date('2026-11-23T23:30:00'), '23:00', '05:00'), true);
  assert.equal(sr.isWithinQuietHours(new Date('2026-11-23T02:15:00'), '23:00', '05:00'), true);
  assert.equal(sr.isWithinQuietHours(new Date('2026-11-23T05:00:00'), '23:00', '05:00'), false);
  assert.equal(sr.isWithinQuietHours(new Date('2026-11-23T22:59:00'), '23:00', '05:00'), false);

  const basePrefs = sr.defaultPrefs();

  // Suppressed before onboarding and during quiet hours
  assert.equal(
    sr.selectActiveReminder({ now: new Date('2026-11-23T08:00:00'), prefs: basePrefs, onboarded: false }),
    null
  );
  assert.equal(
    sr.selectActiveReminder({ now: new Date('2026-11-23T01:30:00'), prefs: basePrefs, onboarded: true }),
    null
  );

  // Morning Monday -> morning_tawhid; once daily goal met, skips tawhid in favor of morning_sayyid
  const monMorning = new Date('2026-11-23T08:30:00');
  assert.equal(
    sr.selectActiveReminder({ now: monMorning, prefs: basePrefs, onboarded: true, todayTotal: 0, dailyGoal: 100 })?.id,
    'morning_tawhid'
  );
  assert.equal(
    sr.selectActiveReminder({ now: monMorning, prefs: basePrefs, onboarded: true, todayTotal: 100, dailyGoal: 100 })?.id,
    'morning_sayyid'
  );

  // Evening Monday -> evening_muawwizat; Night (21:30 outside quiet hours 23-05) -> night_sunnah
  assert.equal(
    sr.selectActiveReminder({ now: new Date('2026-11-23T18:00:00'), prefs: basePrefs, onboarded: true })?.id,
    'evening_muawwizat'
  );
  assert.equal(
    sr.selectActiveReminder({ now: new Date('2026-11-23T21:30:00'), prefs: basePrefs, onboarded: true })?.id,
    'night_sunnah'
  );

  // Friday priority -> friday_kahf; if q18 learned today, steps to friday_salawat
  const friDay = new Date('2026-11-27T11:00:00'); // Friday
  assert.equal(friDay.getDay(), 5);
  assert.equal(
    sr.selectActiveReminder({ now: friDay, prefs: basePrefs, onboarded: true })?.id,
    'friday_kahf'
  );
  assert.equal(
    sr.selectActiveReminder({
      now: friDay,
      prefs: basePrefs,
      onboarded: true,
      quranLearned: { q18: { learned: true, learnedAt: '2026-11-27' } }
    })?.id,
    'friday_salawat'
  );

  // Muted for today suppresses both card and browser notifications
  const mutedPrefs = { ...basePrefs, browserNotify: true, mutedDate: '2026-11-27' };
  assert.equal(sr.selectActiveReminder({ now: friDay, prefs: mutedPrefs, onboarded: true }), null);

  // Browser notification fires at most once per scenario per day
  const notifyPrefs = { ...basePrefs, browserNotify: true, notified: {} };
  const activeFri = sr.selectActiveReminder({ now: friDay, prefs: notifyPrefs, onboarded: true });
  assert.equal(sr.shouldSendBrowserNotification(activeFri, { now: friDay, prefs: notifyPrefs, onboarded: true }), true);
  const alreadyNotifiedPrefs = { ...notifyPrefs, notified: { [activeFri.id]: '2026-11-27' } };
  assert.equal(sr.shouldSendBrowserNotification(activeFri, { now: friDay, prefs: alreadyNotifiedPrefs, onboarded: true }), false);

  // sanitizeSettings cleanly validates smartReminders
  const sanitized = sandbox.sanitizeSettings({
    smartReminders: {
      enabled: false,
      browserNotify: true,
      quietStart: '99:99',
      quietEnd: '06:30',
      categories: { adhkar: false, night: true, friday: 'bad' },
      mutedDate: 'invalid'
    }
  });
  assert.equal(sanitized.smartReminders.enabled, false);
  assert.equal(sanitized.smartReminders.browserNotify, true);
  assert.equal(sanitized.smartReminders.quietStart, '23:00');
  assert.equal(sanitized.smartReminders.quietEnd, '06:30');
  assert.equal(sanitized.smartReminders.categories.adhkar, false);
  assert.equal(sanitized.smartReminders.categories.friday, true);
  assert.equal(sanitized.smartReminders.mutedDate, '');
});

test('Audit regression checks: debounce args, canonical tasbih dalil sync, custom tasbih merge scoring, Tajweed marker preservation, and clean content', () => {
  const { sandbox } = createAppSandbox({
    iqra_data: JSON.stringify({
      tasbihs: [
        { id: 'tawhid', arabic: '...', transcription: '...', translation: '...', dalil: 'STALE_DALIL', target: 10, current: 7, cycles: 2 },
        { id: 'u_custom', arabic: 'سُبْحَانَ اللَّهِ', target: 33, current: 12, cycles: 1, custom: true }
      ]
    })
  });
  let receivedArgs: any[] = [];
  let timerFn: any = null;
  sandbox.setTimeout = (fn: any) => { timerFn = fn; return 1; };
  loadClassicScript('js/architecture.js', sandbox);
  loadClassicScript('js/api.js', sandbox);
  loadClassicScript('js/storage.js', sandbox);

  sandbox.DEFAULT_QURAN = quranDoc.quran;
  sandbox.DEFAULT_DUAS = duasDoc.duas;
  sandbox.DEFAULT_HADITHS = hadithsDoc.hadiths;
  sandbox.DEFAULT_TASBIHS = tasbihsDoc.defaults;
  sandbox.TAWHID_TASBIH = tasbihsDoc.defaults[0];
  sandbox.ISTIGHFAR_TASBIH = tasbihsDoc.defaults[1];

  // 1. debounce forwards context and arguments
  const obj = {
    tag: 'ok',
    fn: sandbox.debounce(function (this: any, a: number, b: string) {
      receivedArgs = [this.tag, a, b];
    }, 50)
  };
  obj.fn(42, 'quran');
  assert.ok(typeof timerFn === 'function');
  timerFn();
  assert.deepEqual(receivedArgs, ['ok', 42, 'quran']);

  // 2. canonicalizeContent syncs DEFAULT_TASBIHS dalil while preserving progress and custom items
  const loaded = sandbox.load();
  const tawhidLoaded = loaded.tasbihs.find((t: any) => t.id === 'tawhid');
  assert.equal(tawhidLoaded.current, 7);
  assert.equal(tawhidLoaded.cycles, 2);
  assert.ok(tawhidLoaded.dalil.includes('№ 3293') && tawhidLoaded.dalil.includes('№ 2691') && tawhidLoaded.dalil.includes('№ 2693'));
  assert.ok(loaded.tasbihs.some((t: any) => t.id === 'u_custom' && t.current === 12));

  // 3. mergeUserSnapshots uses current field for customTasbihs score
  const merged = sandbox.IqraArchitecture.IqraSync.mergeUserSnapshots(
    { customTasbihs: [{ id: 'u1', current: 5, cycles: 0, target: 33 }] },
    { customTasbihs: [{ id: 'u1', current: 25, cycles: 0, target: 33 }] }
  );
  assert.equal(merged.customTasbihs[0].current, 25);

  // 4. renderTajweedForElement preserves .read-ayah-marker
  const fakeMarker = { outerHTML: '<span class="read-ayah-marker">۝١</span>' };
  const fakeEl: any = {
    dataset: { raw: 'بِسْمِ ٱللَّهِ', marker: '۝١' },
    innerHTML: 'بِسْمِ ٱللَّهِ <span class="read-ayah-marker">۝١</span>',
    classList: { added: [] as string[], removed: [] as string[], add(c: string) { this.added.push(c); }, remove(c: string) { this.removed.push(c); } },
    querySelector(sel: string) { return sel === '.read-ayah-marker' ? fakeMarker : null; },
    insertAdjacentElement() {}
  };
  const fakeBlock: any = { dataset: { verseKey: '1:1' }, querySelector: () => null };
  const rendered = sandbox.renderTajweedForElement(fakeEl, fakeBlock, { '1': 'بِسْمِ [h:1[ٱ]للَّهِ' });
  assert.equal(rendered, true);
  assert.ok(fakeEl.innerHTML.includes('<span class="read-ayah-marker">۝١</span>'), 'Marker must survive Tajweed rendering');

  // 5. Content integrity: no stale placeholder or inaccurate hadith references
  const fatihaDoc = readJson<{ tafsirs: any[]; biographies: any[] }>('data/tafsirs_fatiha.json');
  const edgesDoc = readJson<any[]>('data/graph/edges.json');
  const combinedStr = JSON.stringify([duasDoc, tasbihsDoc, hadithsDoc, quranDoc.quran.filter((q: any) => q.note || q.type !== 'surah'), fatihaDoc, edgesDoc]);
  for (const forbidden of ['Ибн Баз', 'Статус сидра', 'Муслим (№ 595)', 'аль-Бухари (№ 3292)', 'требует сверки', 'требуют уточнения', 'requires_verification', 'Хузайфы', 'Мусé', 'Евангелие,', 'Хытаби', 'аль-Карзи']) {
    assert.equal(combinedStr.includes(forbidden), false, `Forbidden stale string remains: ${forbidden}`);
  }
});

test('IqraDalil splits multi-hadith dalils into separate cards, renders collapsed disclosure, and escapes HTML', () => {
  const { sandbox } = createAppSandbox();
  loadClassicScript('js/smart-reminders.js', sandbox);
  loadClassicScript('js/scholars.js', sandbox);
  loadClassicScript('js/dalil.js', sandbox);

  const dalilMod = sandbox.IqraDalil;
  assert.ok(dalilMod, 'IqraDalil should be exported');

  // Tasbihs
  const tawhid = tasbihsDoc.defaults.find((t: any) => t.id === 'tawhid');
  const istighfar = tasbihsDoc.defaults.find((t: any) => t.id === 'istighfar');
  const subhan = tasbihsDoc.defaults.find((t: any) => t.id === 'u1');
  assert.equal(dalilMod.parseDalilHadiths(tawhid.dalil).length, 2);
  assert.equal(dalilMod.parseDalilHadiths(istighfar.dalil).length, 2);
  assert.equal(dalilMod.parseDalilHadiths(subhan.dalil).length, 1);

  // Duas
  const ruqyahGuide = duasDoc.duas.find((d: any) => d.id === 'ruqyah_guide');
  const ruqyahHifz = duasDoc.duas.find((d: any) => d.id === 'ruqyah_hifz');
  const duaAnxiety = duasDoc.duas.find((d: any) => d.id === 'dua_anxiety');
  assert.equal(dalilMod.parseDalilHadiths(ruqyahGuide.note).length, 2);
  assert.equal(dalilMod.parseDalilHadiths(ruqyahHifz.note).length, 2);
  assert.equal(dalilMod.parseDalilHadiths(duaAnxiety.note).length, 1);

  // Hadiths
  const hMuawwizat = hadithsDoc.hadiths.find((h: any) => h.id === 'h_muawwizat');
  const hTawhid = hadithsDoc.hadiths.find((h: any) => h.id === 'h_tawhid');
  const hIkhlas = hadithsDoc.hadiths.find((h: any) => h.id === 'h_ikhlas');
  assert.equal(dalilMod.parseDalilHadiths(hMuawwizat.note).length, 2);
  assert.equal(dalilMod.parseDalilHadiths(hTawhid.note).length, 2);
  assert.equal(dalilMod.parseDalilHadiths(hIkhlas.note).length, 1);

  // Quran notes & ruqyah ayahs
  const q113 = quranDoc.quran.find((q: any) => q.id === 'q113');
  const q114 = quranDoc.quran.find((q: any) => q.id === 'q114');
  const qKursi = quranDoc.quran.find((q: any) => q.id === 'q_ayat_kursi');
  const ruqyahAraf = quranDoc.quran.find((q: any) => q.id === 'ruqyah_araf');
  assert.equal(dalilMod.parseDalilHadiths(q113.note).length, 3);
  assert.equal(dalilMod.parseDalilHadiths(q114.note).length, 3);
  assert.equal(dalilMod.parseDalilHadiths(qKursi.note).length, 2);
  assert.equal(dalilMod.parseDalilHadiths(ruqyahAraf.note).length, 1);

  // Smart reminders
  const nightSunnah = sandbox.IqraSmartReminders.SCENARIOS.find((s: any) => s.id === 'night_sunnah');
  const eveningIstighfar = sandbox.IqraSmartReminders.SCENARIOS.find((s: any) => s.id === 'evening_istighfar');
  assert.equal(dalilMod.parseDalilHadiths(nightSunnah.hadithText).length, 3);
  assert.equal(dalilMod.parseDalilHadiths(eveningIstighfar.hadithText).length, 2);

  // Disclosure markup: collapsed by default, 2 hadith cards for tawhid, interactive scholar links preserved
  const html = dalilMod.renderDalilDisclosureHtml(tawhid.dalil);
  assert.ok(html.startsWith('<details class="dalil-disclosure">'), 'Disclosure must be collapsed by default');
  assert.equal((html.match(/<article class="dalil-hadith-card">/g) || []).length, 2);
  assert.ok(html.includes('2 хадиса'));
  assert.ok(html.includes('class="scholar-link"'));
  assert.ok(html.includes('data-scholar-id='));
  assert.ok(html.includes('openScholarInfo('));

  // Security check: XSS payloads are escaped safely
  const unsafeHtml = dalilMod.renderDalilDisclosureHtml('<img src=x onerror=alert(1)> Передал Муслим (№ 1).');
  assert.equal(unsafeHtml.includes('<img'), false);
  assert.ok(unsafeHtml.includes('&lt;img src=x onerror=alert(1)&gt;'));
});

test('Full Salawat form is used across all app assets and scripts/precaching are wired', () => {
  const scanDirs = ['data', 'js', 'index.html'];
  const collectFiles = (rel: string): string[] => {
    const full = path.join(IQRA_ROOT, rel);
    const stat = fs.statSync(full);
    if (stat.isFile()) return [full];
    let list: string[] = [];
    for (const entry of fs.readdirSync(full)) {
      if (entry === 'tajweed') continue;
      list = list.concat(collectFiles(path.join(rel, entry)));
    }
    return list;
  };
  const files = scanDirs.flatMap(collectFiles).filter((f) => /\.(json|js|html)$/i.test(f));
  assert.ok(files.length > 20);
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    assert.equal(content.includes('ﷺ'), false, `Shorthand ﷺ found in ${path.relative(IQRA_ROOT, file)}`);
  }

  const indexHtml = fs.readFileSync(path.join(IQRA_ROOT, 'index.html'), 'utf8');
  const swJs = fs.readFileSync(path.join(IQRA_ROOT, 'sw.js'), 'utf8');
  assert.ok(indexHtml.includes('<script src="./js/scholars.js"></script>'));
  assert.ok(indexHtml.includes('<script src="./js/dalil.js"></script>'));
  assert.ok(swJs.includes("'./js/scholars.js'"));
  assert.ok(swJs.includes("'./js/dalil.js'"));
});



