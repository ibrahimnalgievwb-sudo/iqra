import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const IQRA_ROOT = path.resolve(import.meta.dirname, '..');

function readJson<T = any>(relPath: string): T {
  const full = path.join(IQRA_ROOT, relPath);
  return JSON.parse(fs.readFileSync(full, 'utf8')) as T;
}

function loadGraphEngine() {
  const scholarsCode = fs.readFileSync(path.join(IQRA_ROOT, 'js/scholars.js'), 'utf8');
  const code = fs.readFileSync(path.join(IQRA_ROOT, 'js/graph-engine.js'), 'utf8');
  const mod = { exports: {} as any };
  const g: any = {};
  const sandbox: any = {
    module: mod,
    exports: mod.exports,
    globalThis: g,
    console,
    window: undefined as any,
  };
  sandbox.window = sandbox;
  vm.runInNewContext(scholarsCode, sandbox);
  vm.runInNewContext(code, sandbox);
  return mod.exports;
}

const quranDoc = readJson<{ quran: any[] }>('data/quran.json');
const hadithsDoc = readJson<{ hadiths: any[] }>('data/hadiths.json');
const duasDoc = readJson<{ duas: any[] }>('data/duas.json');
const tasbihsDoc = readJson<{ defaults: any[]; presets?: any[] }>('data/tasbihs.json');
const fatihaDoc = readJson<{ tafsirs: any[]; biographies?: any[] }>('data/tafsirs_fatiha.json');
const allTafsirsDoc = readJson<{ tafsirs: any[] }>('data/tafsirs.json');
const kbDoc = readJson<any>('data/knowledge-base.json');
const themes = readJson<any[]>('data/graph/themes.json');
const scholarsDoc = readJson<{ scholars: any[] }>('data/graph/scholars.json');
const edges = readJson<any[]>('data/graph/edges.json');

const IqraGraph = loadGraphEngine();

const fullContext = {
  quran: quranDoc.quran,
  duas: duasDoc.duas,
  hadiths: hadithsDoc.hadiths,
  tasbihs: tasbihsDoc.defaults,
  tafsirs: [...fatihaDoc.tafsirs, ...allTafsirsDoc.tafsirs],
  themes,
  scholars: scholarsDoc.scholars,
  biographies: fatihaDoc.biographies || [],
  edges,
};

const index = IqraGraph.createContextIndex(fullContext);

test('All JSON data files parse and match expected structure', () => {
  assert.ok(Array.isArray(quranDoc.quran) && quranDoc.quran.length === 120);
  const surahs = quranDoc.quran.filter((q: any) => q.type === 'surah');
  assert.equal(surahs.length, 114);
  const totalSurahAyahs = surahs.reduce((sum: number, q: any) => sum + String(q.arabic || '').split('\n').filter(Boolean).length, 0);
  assert.equal(totalSurahAyahs, 6236);
  assert.ok(Array.isArray(hadithsDoc.hadiths) && hadithsDoc.hadiths.length === 11);
  assert.ok(Array.isArray(duasDoc.duas) && duasDoc.duas.length === 6);
  assert.ok(Array.isArray(tasbihsDoc.defaults) && tasbihsDoc.defaults.length === 5);
  assert.ok(Array.isArray(fatihaDoc.tafsirs) && fatihaDoc.tafsirs.length === 7);
  assert.ok(Array.isArray(themes) && themes.length === 12);
  assert.ok(Array.isArray(scholarsDoc.scholars) && scholarsDoc.scholars.length >= 1);
  assert.ok(Array.isArray(edges) && edges.length > 200);
  assert.ok(kbDoc && Array.isArray(kbDoc.allTags) && Array.isArray(kbDoc.nightOrder));
});

test('All 120 Quran entries have aligned arabic/translation lines, valid Bismillah rules, and matching transcription lines when present', () => {
  const curatedWithTranscription = quranDoc.quran.filter((q: any) => String(q.transcription || '').trim().length > 0);
  assert.equal(curatedWithTranscription.length, 25);
  for (const q of quranDoc.quran) {
    const ar = String(q.arabic || '').split('\n').map((s: string) => s.trim()).filter(Boolean);
    const tr = String(q.transcription || '').split('\n').map((s: string) => s.trim()).filter(Boolean);
    const trn = String(q.translation || '').split('\n').map((s: string) => s.trim()).filter(Boolean);
    assert.ok(ar.length > 0, `Empty arabic in ${q.id}`);
    assert.equal(ar.length, trn.length, `Mismatch ar vs trn line count in ${q.id}`);
    if (tr.length > 0) {
      assert.equal(ar.length, tr.length, `Mismatch ar vs tr line count in ${q.id}`);
    }
    if (q.type === 'surah') {
      if (q.number === 1 || q.number === 9) {
        assert.equal(q.bismillah, null, `Surah ${q.number} must have bismillah: null`);
      } else {
        assert.ok(q.bismillah && q.bismillah.arabic, `Surah ${q.number} must include bismillah`);
      }
    }
  }
});

test('Every edge resolves to valid nodes, has unique triple (from, type, to), valid weight, and non-empty evidence', () => {
  const validTafsirIds = new Set<string>();
  for (const tf of fullContext.tafsirs) {
    if (!tf || tf.status === 'placeholder' || !tf.tafsir_text) continue;
    const scId = IqraGraph.scholarIdFromSource(tf.source, scholarsDoc.scholars);
    validTafsirIds.add(`tafsir:${scId}_${tf.surah}_${tf.ayah}`);
  }

  function isValidNode(nodeId: string): boolean {
    if (nodeId.startsWith('ayah:')) return index.ayahByNode.has(nodeId);
    if (nodeId.startsWith('hadith:')) return index.hadithById.has(nodeId.slice(7));
    if (nodeId.startsWith('dua:')) return index.duaById.has(nodeId.slice(4));
    if (nodeId.startsWith('tasbih:')) return index.tasbihById.has(nodeId.slice(7));
    if (nodeId.startsWith('theme:')) return Boolean(IqraGraph.queryPathItems && index.themeById.has(nodeId.slice(6)));
    if (nodeId.startsWith('mood:')) return index.moodById.has(nodeId.slice(5).toLowerCase());
    if (nodeId.startsWith('scholar:')) return index.scholarById.has(nodeId.slice(8));
    if (nodeId.startsWith('tafsir:')) return validTafsirIds.has(nodeId);
    return false;
  }

  const seenTriples = new Set<string>();
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    assert.ok(isValidNode(e.from), `Edge[${i}] dangling from: ${e.from}`);
    assert.ok(isValidNode(e.to), `Edge[${i}] dangling to: ${e.to}`);
    assert.ok(typeof e.type === 'string' && e.type.length > 0, `Edge[${i}] missing type`);
    assert.ok(typeof e.weight === 'number' && e.weight > 0 && e.weight <= 1, `Edge[${i}] invalid weight: ${e.weight}`);
    assert.ok(typeof e.evidence_source === 'string' && e.evidence_source.length > 0, `Edge[${i}] missing evidence_source`);
    assert.ok(typeof e.evidence_note === 'string' && e.evidence_note.trim().length > 0, `Edge[${i}] empty evidence_note`);

    const renderedEvidence = IqraGraph.describePathEvidence(e.evidence_source, index);
    assert.ok(renderedEvidence && renderedEvidence.length > 0, `Edge[${i}] describePathEvidence empty for ${e.evidence_source}`);

    const triple = `${e.from}|${e.type}|${e.to}`;
    assert.equal(seenTriples.has(triple), false, `Duplicate edge triple: ${triple}`);
    seenTriples.add(triple);
  }
});

test('100% node coverage: every curated Quran entry, hadith, dua, tasbih default, theme, and mood has >= 1 graph edge', () => {
  const curatedEntries = quranDoc.quran.filter((q: any) => String(q.transcription || '').trim().length > 0);
  for (const q of curatedEntries) {
    const rels = IqraGraph.getSmartBookRelations('quran:' + q.id, index);
    const total = rels.themes.length + rels.moods.length + rels.ayahs.length + rels.hadiths.length + rels.duas.length + rels.tasbihs.length;
    assert.ok(total > 0, `Unlinked curated quran entry: ${q.id}`);
  }
  for (const h of hadithsDoc.hadiths) {
    const rels = IqraGraph.getSmartBookRelations('hadith:' + h.id, index);
    const total = rels.themes.length + rels.moods.length + rels.ayahs.length + rels.hadiths.length + rels.duas.length + rels.tasbihs.length;
    assert.ok(total > 0, `Unlinked hadith: ${h.id}`);
  }
  for (const d of duasDoc.duas) {
    const rels = IqraGraph.getSmartBookRelations('dua:' + d.id, index);
    const total = rels.themes.length + rels.moods.length + rels.ayahs.length + rels.hadiths.length + rels.duas.length + rels.tasbihs.length;
    assert.ok(total > 0, `Unlinked dua: ${d.id}`);
  }
  for (const t of tasbihsDoc.defaults) {
    const rels = IqraGraph.getSmartBookRelations('tasbih:' + t.id, index);
    const total = rels.themes.length + rels.moods.length + rels.ayahs.length + rels.hadiths.length + rels.duas.length + rels.tasbihs.length;
    assert.ok(total > 0, `Unlinked tasbih default: ${t.id}`);
  }
  for (const th of IqraGraph.getThemeCatalog(index)) {
    assert.ok(th.count > 0, `Theme with 0 links: ${th.id}`);
  }
  for (const m of IqraGraph.getMoodCatalog(index)) {
    assert.ok(m.count > 0, `Mood with 0 links: ${m.id}`);
  }
});

test('Corrected Sunni hadith & Quran references and non-forced links hold', () => {
  // Forced link hadith:h_after_salah -> ayah:q110#3 was removed
  const forced = edges.find((e) => e.from === 'hadith:h_after_salah' && e.to === 'ayah:q110#3' && e.type === 'hadith_explains_ayah');
  assert.equal(forced, undefined, 'Forced hadith_explains_ayah edge h_after_salah -> q110#3 must be absent');

  // Surah 97:3 points to theme:iman, not theme:akhira
  assert.ok(edges.some((e) => e.from === 'ayah:q97#3' && e.to === 'theme:iman'));
  assert.equal(edges.some((e) => e.from === 'ayah:q97#3' && e.to === 'theme:akhira'), false);

  // Surah 96:19 points to theme:tawakkul, and 112:1 points to theme:ikhlas
  assert.ok(edges.some((e) => e.from === 'ayah:q96#19' && e.to === 'theme:tawakkul'));
  assert.ok(edges.some((e) => e.from === 'ayah:q112#1' && e.to === 'theme:ikhlas'));

  // Sahih al-Bukhari 7361 misattribution absent across edges, hadiths, duas
  assert.equal(JSON.stringify(edges).includes('7361'), false, 'Erroneous Bukhari 7361 must not remain in edges.json');
  assert.equal(JSON.stringify(hadithsDoc).includes('7361'), false, 'Erroneous Bukhari 7361 must not remain in hadiths.json');
  assert.equal(JSON.stringify(duasDoc).includes('7361'), false, 'Erroneous Bukhari 7361 must not remain in duas.json');

  // Tafsir 1:1, 1:3 & 1:7 fixes (ensure misattributed Muslim citation is absent in every entry)
  assert.equal(JSON.stringify(fatihaDoc.tafsirs).includes('Благодеяния и родство'), false, 'Erroneous Sahih Muslim citation must not appear in any Fatiha tafsir');
  const tafsir13 = fatihaDoc.tafsirs.find((t) => t.surah === 1 && t.ayah === 3);
  assert.equal(tafsir13.tafsir_text.includes('Муслим'), false, 'Erroneous Sahih Muslim reference in 1:3 tafsir_text removed');
  const tafsir17 = fatihaDoc.tafsirs.find((t) => t.surah === 1 && t.ayah === 7);
  assert.ok(tafsir17.tafsir_text.includes('Аль-Маида'), '1:7 tafsir_text cites Surah Al-Maida 5:78-79');
});

test('Placeholder tafsirs are never resolved by resolveTafsirForAyah, while verified tafsirs resolve cleanly', () => {
  const placeholderMock = [{ surah: 999, ayah: 1, status: 'placeholder', tafsir_text: 'Ин ша Аллах, здесь скоро появится тафсир' }];
  assert.equal(IqraGraph.resolveTafsirForAyah(placeholderMock, 999, 1), null);

  const verified112 = IqraGraph.resolveTafsirForAyah(fullContext.tafsirs, 112, 1);
  assert.ok(verified112 && verified112.status === 'verified' && verified112.tafsir_text.length > 20, 'Verified tafsir for 112:1 should resolve');

  const res = IqraGraph.queryPathItems({ query: 'скоро появится тафсир' }, fullContext);
  assert.equal(res.items.length, 0, 'Placeholder tafsir text must never pollute Smart Book search');
});

test('Arabic normalization search & Russian search work cleanly', () => {
  // Without tashkeel & with/without ال
  const r1 = IqraGraph.queryPathItems({ query: 'قل هو الله احد' }, fullContext);
  assert.ok(r1.items.some((x: any) => x._nodeId === 'ayah:q112#1'), 'Should find Al-Ikhlas 112:1 without harakat');

  const r2 = IqraGraph.queryPathItems({ query: 'الحمد' }, fullContext);
  assert.ok(r2.items.some((x: any) => x._nodeId === 'ayah:q1#2'), 'Should find Al-Fatiha 1:2');

  const r3 = IqraGraph.queryPathItems({ query: 'терпение' }, fullContext);
  assert.ok(r3.items.length > 0 && r3.matchedTopics.some((t: any) => t.id === 'sabr'));

  // Multi-ayah q_baqarah_2 lookup by theme title 'Покаяние'
  const r4 = IqraGraph.queryPathItems({ tag: 'Покаяние', itemTypeFilter: 'ayah' }, fullContext);
  assert.ok(r4.items.some((x: any) => x._nodeId === 'ayah:q_baqarah_2#2'));
});

test('Bidirectional relations work symmetrically from scholar, hadith, dua, and ayah', () => {
  const ikRel = IqraGraph.getSmartBookRelations('scholar:ibn_kathir', index);
  assert.ok(ikRel.ayahs.length >= 7, 'Ibn Kathir should link to Al-Fatiha and verified tafsirs');
  assert.equal(index.scholarById.has('as_sadi'), false, 'as_sadi must be excluded for RF Minjust FSEM #5162 compliance');
  assert.ok(ikRel.ayahs.length >= 200, 'Ibn Kathir must cover curated tafsirs cleanly');

  const ruqyahRel = IqraGraph.getSmartBookRelations('dua:ruqyah_guide', index);
  assert.ok(ruqyahRel.hadiths.some((h: any) => h.id === 'h_ayat_kursi'));
  assert.ok(ruqyahRel.ayahs.some((a: any) => a.nodeId === 'ayah:q112#1'));
  assert.ok(ruqyahRel.ayahs.some((a: any) => a.nodeId === 'ayah:q113#1'));
  assert.ok(ruqyahRel.ayahs.some((a: any) => a.nodeId === 'ayah:q114#1'));
});

test('Canonical full-surah ayahs inherit curated relations symmetrically without self-duplication', () => {
  const relKursiFull = IqraGraph.getSmartBookRelations('ayah:q2#255', index);
  assert.ok(relKursiFull.hadiths.some((h: any) => h.id === 'h_ayat_kursi'), 'q2#255 must link to h_ayat_kursi');
  assert.ok(relKursiFull.hadiths.some((h: any) => h.id === 'h_kursi_greatest'), 'q2#255 must link to h_kursi_greatest');
  assert.ok(relKursiFull.duas.some((d: any) => d.id === 'ruqyah_guide'), 'q2#255 must link to ruqyah_guide');
  assert.ok(relKursiFull.moods.some((m: any) => m.id === 'Страх'), 'q2#255 must link to mood Страх');
  assert.equal(relKursiFull.ayahs.some((a: any) => a.nodeId === 'ayah:q_ayat_kursi#1'), false, 'q2#255 must not self-link q_ayat_kursi#1');
  assert.equal(relKursiFull.ayahs.some((a: any) => a.nodeId === 'ayah:ruqyah_ayat_kursi#1'), false, 'q2#255 must not self-link ruqyah_ayat_kursi#1');

  const rel286 = IqraGraph.getSmartBookRelations('ayah:q2#286', index);
  assert.ok(rel286.hadiths.some((h: any) => h.id === 'h_baqarah'), 'q2#286 must inherit h_baqarah');
  assert.ok(rel286.moods.some((m: any) => m.id === 'Усталость'), 'q2#286 must inherit mood Усталость');

  const rel7_117 = IqraGraph.getSmartBookRelations('ayah:q7#117', index);
  assert.ok(rel7_117.duas.some((d: any) => d.id === 'ruqyah_guide'), 'q7#117 must inherit ruqyah_guide');
  assert.ok(rel7_117.ayahs.some((a: any) => a.nodeId === 'ayah:ruqyah_yunus#1'), 'q7#117 must link to ruqyah_yunus#1');

  const hKursi = IqraGraph.getSmartBookRelations('hadith:h_ayat_kursi', index);
  const kursiHits = hKursi.ayahs.filter((a: any) => a.refLabel === '2:255');
  assert.equal(kursiHits.length, 1, '2:255 must appear only once in h_ayat_kursi ayah pills');

  const albaniRel = IqraGraph.getSmartBookRelations('scholar:al_albani', index);
  assert.ok(albaniRel.duas.some((d: any) => d.id === 'dua_anxiety'), 'al_albani should link to dua_anxiety via graded_by');
});

test('100% of Smart Book transition targets resolve cleanly within valid ayah bounds', () => {
  const allSeeds = [
    ...quranDoc.quran.filter((q: any) => String(q.transcription || '').trim().length > 0).map((q: any) => 'quran:' + q.id),
    'ayah:q2#255',
    'ayah:q2#285',
    'ayah:q2#286',
    'ayah:q7#117',
    'ayah:q10#79',
    'ayah:q20#65',
    ...hadithsDoc.hadiths.map((h: any) => 'hadith:' + h.id),
    ...duasDoc.duas.map((d: any) => 'dua:' + d.id),
    ...tasbihsDoc.defaults.map((t: any) => 'tasbih:' + t.id),
  ];

  for (const seed of allSeeds) {
    const rels = IqraGraph.getSmartBookRelations(seed, index);
    for (const a of rels.ayahs) {
      const q = index.quranById.get(a.surahId);
      assert.ok(q, `Target surah missing for ${seed} -> ${a.surahId}`);
      const lineCount = String(q.arabic || '').split('\n').filter(Boolean).length;
      assert.ok(a.ayahIdx >= 0 && a.ayahIdx < lineCount, `Out-of-bounds ayahIdx ${a.ayahIdx} on ${a.surahId}`);
    }
    for (const h of rels.hadiths) {
      assert.ok(index.hadithById.has(h.id), `Target hadith missing: ${h.id}`);
    }
    for (const d of rels.duas) {
      assert.ok(index.duaById.has(d.id), `Target dua missing: ${d.id}`);
    }
    for (const t of rels.tasbihs) {
      assert.ok(index.tasbihById.has(t.id), `Target tasbih missing: ${t.id}`);
    }
    for (const sc of rels.scholars) {
      assert.ok(index.scholarById.has(sc.id), `Target scholar missing: ${sc.id}`);
    }
  }
});
