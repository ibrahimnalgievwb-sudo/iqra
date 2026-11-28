import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const IQRA_ROOT = path.resolve(import.meta.dirname, '..');

function loadScript(relPath: string, sandbox: any) {
  const code = fs.readFileSync(path.join(IQRA_ROOT, relPath), 'utf8');
  vm.runInNewContext(code, sandbox);
}

function makeSandbox(overrides: Record<string, any> = {}) {
  const elements: Record<string, any> = {};
  const makeEl = (id: string) => ({
    id,
    innerHTML: '',
    textContent: '',
    value: '',
    hidden: false,
    disabled: false,
    scrollTop: 0,
    style: {} as Record<string, string>,
    dataset: {} as Record<string, string>,
    classList: {
      _set: new Set<string>(),
      add(...cls: string[]) { cls.forEach((c) => this._set.add(c)); },
      remove(...cls: string[]) { cls.forEach((c) => this._set.delete(c)); },
      toggle(c: string, force?: boolean) {
        if (force === undefined) {
          if (this._set.has(c)) this._set.delete(c);
          else this._set.add(c);
        } else if (force) this._set.add(c);
        else this._set.delete(c);
      },
      contains(c: string) { return this._set.has(c); },
    },
    setAttribute() {},
    getAttribute() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    appendChild() {},
    remove() {},
    scrollIntoView() {},
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
    setTimeout: (fn: any) => { if (typeof fn === 'function') fn._scheduled = true; return 1; },
    clearTimeout: () => {},
    requestAnimationFrame: (fn: any) => { if (typeof fn === 'function') fn(); return 1; },
    navigator: {},
    document: {
      getElementById: (id: string) => getEl(id),
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => makeEl('tmp'),
      documentElement: makeEl('html'),
    },
    module: { exports: {} },
    exports: {},
    ...overrides,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  return { sandbox, getEl };
}

test('IqraPlatform provides safe cross-device feature detection and never throws without vibrate, IO, rIC, or localStorage', () => {
  const throwingStorage = {
    getItem() { throw new Error('SecurityError'); },
    setItem() { throw new Error('QuotaExceededError'); },
    removeItem() { throw new Error('SecurityError'); },
  };
  const { sandbox } = makeSandbox({
    localStorage: throwingStorage,
    navigator: {},
  });
  loadScript('js/core/platform.js', sandbox);

  const P = sandbox.IqraPlatform;
  assert.ok(P && P.features);
  assert.equal(P.features.vibrate, false);
  assert.equal(P.features.mediaSession, false);
  assert.equal(P.features.intersectionObserver, false);
  assert.equal(P.features.idleCallback, false);
  assert.equal(P.features.nativeStorage, false);

  assert.equal(P.safeVibrate(20), false);
  assert.equal(P.safeMediaSession.setMetadata({ title: 'Test' }), false);
  assert.equal(P.safeMediaSession.setPlaybackState('playing'), false);
  assert.equal(P.safeMediaSession.setActionHandler('play', () => {}), false);

  // Fallback Map storage remains operational even when native localStorage throws
  assert.equal(P.safeStorage.setItem('iqra_test_key', 'ok'), false);
  assert.equal(P.safeStorage.getItem('iqra_test_key'), 'ok');
  assert.ok(P.safeStorage.keys().includes('iqra_test_key'));
  P.safeStorage.removeItem('iqra_test_key');
  assert.equal(P.safeStorage.getItem('iqra_test_key'), null);

  let idleRan = false;
  const tid = P.safeIdleCallback(() => { idleRan = true; }, { fallbackDelay: 0 });
  assert.ok(tid);
  assert.equal(idleRan, false);
  P.cancelSafeIdleCallback(tid);
});

test('IqraAccess defines 4 "В разработке" modules, keeps core 100% free, and avoids paywalls/prices', () => {
  const { sandbox } = makeSandbox();
  loadScript('js/core/feature-flags.js', sandbox);

  const A = sandbox.IqraAccess;
  const mods = A.listModules();
  assert.equal(mods.length, 4);
  for (const mod of mods) {
    assert.equal(mod.status, 'В разработке');
    assert.equal(A.canUse(mod.id).allowed, true);
  }
  for (const coreKey of ['quran', 'tajweed', 'audio', 'tasbih', 'dua', 'hadith', 'night', 'path']) {
    const res = A.canUse(coreKey);
    assert.equal(res.allowed, true);
    assert.equal(res.mode, 'free_core');
  }
});

test('IqraSnapshot exports schemaVersion: 1 without static Quran texts, enforces 5MB cap, strips proto keys, and accepts legacy BACKUP_SCHEMA 3', () => {
  const { sandbox } = makeSandbox();
  loadScript('js/core/storage-snapshot.js', sandbox);

  const S = sandbox.IqraSnapshot;
  assert.equal(S.SCHEMA_VERSION, 1);
  assert.equal(S.MAX_SNAPSHOT_BYTES, 5 * 1024 * 1024);

  const sampleState = {
    tasbihs: [{ id: 't1', arabic: 'سُبْحَانَ اللَّهِ', transcription: 'Subhanallah', translation: 'Glory', target: 33, current: 5, cycles: 1, custom: false }],
    quran: [{ id: 'q1', title: 'Al-Fatiha', arabic: 'LONG_STATIC_QURAN_TEXT', learned: true, learnedAt: '2026-11-28' }],
    quranProgress: { q1: { learned: true, learnedAt: '2026-11-28' } },
    history: { '2026-11-28': { total: 5, byId: { t1: 5 } } },
    settings: { theme: 'dark', arSize: 1.2 },
    reminders: [],
    duas: [],
    hadiths: [],
    favorites: ['q1'],
    bookmarks: [],
    migrations: { onboarded: true },
  };

  const exported = S.exportUserSnapshot(sampleState, { legacySchema: 3 });
  assert.equal(exported.schemaVersion, 1);
  assert.equal(exported.__schema, 3);
  assert.equal(exported.app, 'iqra');
  assert.ok(exported.payload);
  assert.equal(JSON.stringify(exported).includes('LONG_STATIC_QURAN_TEXT'), false);
  assert.equal(exported.payload.quranProgress.q1.learned, true);

  // Roundtrip parse
  const parsed = S.parseAndValidateSnapshot(JSON.stringify(exported));
  assert.ok(parsed);
  assert.equal(parsed.tasbihs[0].id, 't1');

  // Legacy flat BACKUP_SCHEMA 3 acceptance
  const legacyFlat = { __schema: 3, tasbihs: sampleState.tasbihs, history: {} };
  const legacyParsed = S.parseAndValidateSnapshot(JSON.stringify(legacyFlat));
  assert.ok(legacyParsed);
  assert.equal(legacyParsed.tasbihs[0].id, 't1');

  // >5MB rejection
  const oversized = ' '.repeat(5 * 1024 * 1024 + 10);
  assert.equal(S.parseAndValidateSnapshot(oversized), null);

  // Prototype pollution stripping
  const dirty = JSON.parse('{"schemaVersion":1,"payload":{"tasbihs":[],"__proto__":{"polluted":true},"constructor":{"bad":1}}}');
  const clean = S.unwrapEnvelope(dirty);
  assert.equal(Object.prototype.hasOwnProperty.call(clean, '__proto__'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(clean, 'constructor'), false);
  assert.equal(({} as any).polluted, undefined);
});

test('IqraAudio computes exact global ayah numbers (1..6236), reuses a single Audio element, and handles unavailable Audio safely', () => {
  // 1. Safe when Audio is unavailable
  const noAudio = makeSandbox();
  loadScript('js/core/platform.js', noAudio.sandbox);
  loadScript('js/components/audio.js', noAudio.sandbox);
  assert.equal(noAudio.sandbox.IqraAudio.getGlobalAyahNumber(1, 0), 1);
  assert.equal(noAudio.sandbox.IqraAudio.getGlobalAyahNumber(2, 0), 8);
  assert.equal(noAudio.sandbox.IqraAudio.getGlobalAyahNumber(112, 0), 6222);
  assert.equal(noAudio.sandbox.IqraAudio.getGlobalAyahNumber(114, 5), 6236);
  noAudio.sandbox.getQuranById = () => ({ id: 'q1', type: 'surah', number: 1, title: 'Аль-Фатиха', arabic: 'a\nb\nc\nd\ne\nf\ng' });
  noAudio.sandbox.playAyahAudio('q1', 0); // must not throw

  // 2. Single Audio instance reuse with mock Audio
  let createdCount = 0;
  class MockAudio {
    preload = '';
    src = '';
    paused = true;
    currentTime = 0;
    listeners: Record<string, Function[]> = {};
    constructor() { createdCount++; }
    addEventListener(ev: string, fn: Function) {
      if (!this.listeners[ev]) this.listeners[ev] = [];
      this.listeners[ev].push(fn);
    }
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
    removeAttribute(attr: string) { if (attr === 'src') this.src = ''; }
    load() {}
  }

  const withAudio = makeSandbox({ Audio: MockAudio });
  withAudio.sandbox.activeReadId = 'q1';
  withAudio.sandbox.getQuranById = (id: string) => ({
    id,
    type: 'surah',
    number: id === 'q1' ? 1 : 2,
    title: id === 'q1' ? 'Аль-Фатиха' : 'Аль-Бакара',
    arabic: 'a1\na2\na3\na4\na5\na6\na7',
  });
  withAudio.getEl('read-mode').classList.add('active');
  loadScript('js/core/platform.js', withAudio.sandbox);
  loadScript('js/components/audio.js', withAudio.sandbox);

  withAudio.sandbox.playAyahAudio('q1', 0);
  withAudio.sandbox.playAyahAudio('q1', 2);
  assert.equal(createdCount, 1, 'Must reuse single Audio element across ayahs');
  assert.ok(withAudio.getEl('read-audio-bar').innerHTML.includes('Аль-Фатиха'));
  assert.equal(withAudio.getEl('read-audio-bar').hidden, false);

  withAudio.sandbox.cycleAudioLoop();
  assert.equal(withAudio.sandbox.IqraAudio.getState().loopMode, 'ayah');
  withAudio.sandbox.stopAudioPlayer();
  assert.equal(withAudio.sandbox.IqraAudio.getState().quranId, null);
  assert.equal(withAudio.getEl('read-audio-bar').hidden, true);
});

test('Reader incremental batching (READ_AYAH_BATCH=30), NBSP markers, and platform/SW/CNAME security invariants hold', async () => {
  const { sandbox, getEl } = makeSandbox();
  sandbox.activeReadId = null;
  sandbox.esc = (s: any) => String(s ?? '');
  sandbox.escAttr = (s: any) => String(s ?? '');
  sandbox.escNl = (s: any) => String(s ?? '');
  sandbox.ayahMarker = (n: any) => `﴿${n}﴾`;
  sandbox.trackEvent = () => {};
  sandbox.saveLastRead = () => {};
  sandbox.saveNavContext = () => {};
  sandbox.save = () => {};
  sandbox.getSmartTafsirHtml = () => '';
  sandbox.transcriptionNote = () => '';
  sandbox.applyTajweedToContainer = () => Promise.resolve();
  sandbox.state = {
    quran: [
      { id: 'q2', type: 'surah', number: 2, title: 'Аль-Бакара', arabic: Array.from({ length: 45 }, (_, i) => `آية ${i + 1}`).join('\n') },
    ],
    bookmarks: [],
    settings: { arSize: 1, readerPrefs: { showTranscription: true }, readScrolls: {}, readAyah: {}, vibrate: false },
  };
  sandbox.getQuranById = (id: string) => sandbox.state.quran.find((q: any) => q.id === id);
  sandbox.parseAyahs = (item: any) => item.arabic.split('\n').map((ar: string, i: number) => ({ num: i + 1, ar, tr: '', trn: '' }));

  loadScript('js/core/platform.js', sandbox);
  loadScript('js/components/reader.js', sandbox);

  assert.equal(sandbox.READ_AYAH_BATCH, 30);
  await sandbox.openRead('q2');
  const bodyHtml = getEl('read-body').innerHTML;
  assert.ok(bodyHtml.includes('\u00A0<span class="read-ayah-marker">'), 'Marker must be bound via NBSP');
  assert.ok(bodyHtml.includes('id="read-more-sentinel"'), 'Sentinel element must exist for lazy scroll loading');
  assert.ok(bodyHtml.includes('id="read-audio-btn"'), 'Surah toolbar must expose audio trigger');
  assert.equal(sandbox._readRenderState.renderedCount, 30);

  // Security & infra checks
  const cname = fs.readFileSync(path.join(IQRA_ROOT, 'CNAME'), 'utf8').trim();
  assert.equal(cname, 'e-iqra.ru');

  const swJs = fs.readFileSync(path.join(IQRA_ROOT, 'sw.js'), 'utf8');
  assert.ok(swJs.includes('DATA_CACHE_MAX_ENTRIES = 150'));
  assert.ok(swJs.includes('NETWORK_TIMEOUT_MS = 8000'));
  assert.ok(/CACHE_CORE\s*=\s*CACHE_STATIC/.test(swJs));

  const indexHtml = fs.readFileSync(path.join(IQRA_ROOT, 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('media-src \'self\' https://cdn.islamic.network'));
  assert.ok(indexHtml.includes('./js/core/platform.js'));
  assert.ok(indexHtml.includes('./js/core/feature-flags.js'));
  assert.ok(indexHtml.includes('./js/core/storage-snapshot.js'));
  assert.ok(indexHtml.includes('./js/components/audio.js'));

  const appJs = fs.readFileSync(path.join(IQRA_ROOT, 'js/app.js'), 'utf8');
  assert.ok(appJs.includes("const allowedWidgets = ['dhikr', 'night', 'stats', 'ayah']"));
  assert.ok(appJs.includes("const allowedTypes = ['read', 'counter', 'dua', 'hadith', 'night', 'tab']"));
});

test('Interactive surah TOC builds ranges, marks bookmarks/tafsirs, opens modal, and jumps beyond initial batch', async () => {
  const { sandbox, getEl } = makeSandbox();
  sandbox.activeReadId = null;
  sandbox.esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  sandbox.escAttr = (s: any) => String(s ?? '').replace(/"/g, '&quot;');
  sandbox.escNl = (s: any) => String(s ?? '');
  sandbox.ayahMarker = (n: any) => `﴿${n}﴾`;
  sandbox.trackEvent = () => {};
  sandbox.saveLastRead = () => {};
  sandbox.saveNavContext = () => {};
  sandbox.save = () => {};
  sandbox.getSmartTafsirHtml = () => '';
  sandbox.transcriptionNote = () => '';
  sandbox.applyTajweedToContainer = () => Promise.resolve();
  let modalClosed = false;
  sandbox.closeModal = () => {
    modalClosed = true;
    getEl('modal-bg').classList.remove('active');
  };

  const ayahs286 = Array.from({ length: 286 }, (_, i) => ({
    num: i + 1,
    ar: `كلمة أولى ثانية ثالثة رابعة خامسة سادسة سابعة ${i + 1}`,
    tr: '',
    trn: i === 254 ? 'Аллах — нет божества, кроме Него, Живого, Вседержителя' : `Перевод аята ${i + 1}`,
  }));
  sandbox.state = {
    quran: [
      { id: 'q2', type: 'surah', number: 2, title: 'Аль-Бакара', arabic: ayahs286.map((a) => a.ar).join('\n') },
    ],
    bookmarks: [{ id: 'bm1', quranId: 'q2', ayahIdx: 254, label: 'Аят аль-Курси' }],
    tafsirs: [{ surah: 2, ayah: 255, text: 'Тафсир Аят аль-Курси' }],
    settings: { arSize: 1, readerPrefs: { showTranscription: true }, readScrolls: {}, readAyah: {}, vibrate: false },
  };
  sandbox.getQuranById = (id: string) => sandbox.state.quran.find((q: any) => q.id === id);
  sandbox.parseAyahs = () => ayahs286;
  sandbox.IqraGraph = {
    resolveTafsirForAyah: (list: any[], s: number, a: number) => list.find((t) => t.surah === s && t.ayah === a) || null,
  };

  loadScript('js/core/platform.js', sandbox);
  loadScript('js/components/reader.js', sandbox);

  await sandbox.openRead('q2');
  const readBodyHtml = getEl('read-body').innerHTML;
  assert.ok(readBodyHtml.includes('id="read-toc-btn"'), 'Long surah toolbar should expose Оглавление button');
  assert.ok(readBodyHtml.includes('id="aj-toc-btn"'), 'Long surah jumper should expose Оглавление button');

  const tocData = sandbox.buildSurahTocData(sandbox.state.quran[0], ayahs286, {
    currentAyahNum: 10,
    bookmarks: sandbox.state.bookmarks,
    hasTafsir: (n: number) => n === 255,
  });
  assert.equal(tocData.total, 286);
  assert.equal(tocData.step, 20);
  assert.equal(tocData.ranges.length, 15);
  assert.equal(tocData.ranges[0].label, '1–20');
  assert.equal(tocData.ranges[14].label, '281–286');
  assert.equal(tocData.entries[9].isCurrent, true);
  assert.equal(tocData.entries[254].bookmarked, true);
  assert.equal(tocData.entries[254].hasTafsir, true);
  assert.ok(tocData.entries[254].arSnippet.endsWith('…'));

  sandbox.openSurahToc();
  assert.equal(getEl('modal-bg').classList.contains('active'), true);
  assert.ok(getEl('modal-content').className.includes('surah-toc-modal'));
  const modalHtml = getEl('modal-content').innerHTML;
  assert.ok(modalHtml.includes('id="surah-toc-search"'));
  assert.ok(modalHtml.includes('Оглавление · Аль-Бакара'));
  assert.ok(modalHtml.includes('id="stoc-ayah-255"'));
  assert.ok(modalHtml.includes('Вседержителя'));

  await sandbox.selectSurahTocAyah(255);
  assert.equal(modalClosed, true);
  assert.ok(sandbox._readRenderState.renderedCount >= 255, 'Jumping via TOC should render batches through target ayah');
  assert.equal(getEl('rm-ayah-jump').value, '255');
});

