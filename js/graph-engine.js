"use strict";

/* ============================================================
   GRAPH-ENGINE.JS — Ядро «Умной книги» и экосистемы знаний Iqra
   Чистая логика без DOM: работает и в браузере, и в Node.js тестах.
   ============================================================ */

(function (root) {
  var PATH_MOOD_ORDER = [
    {
      id: 'Тревога',
      title: 'Тревога',
      description: 'Когда сердце сжимается от беспокойства — обратись к Поминающему и Отвечающему на мольбу.'
    },
    {
      id: 'Печаль',
      title: 'Печаль',
      description: 'Даже в тяжёлые часы Аллах не оставляет раба: с каждой тягостью приходит облегчение.'
    },
    {
      id: 'Страх',
      title: 'Страх',
      description: 'Истинная безопасность — под защитой Того, Кто хранит небеса и землю и не ведает сна.'
    },
    {
      id: 'Гнев',
      title: 'Гнев',
      description: 'Сила верующего — в умении сдержать себя ради Аллаха и прибегнуть к Его защите от наущений.'
    },
    {
      id: 'Одиночество',
      title: 'Одиночество',
      description: 'В молитве и земном поклоне сердце напрямую обращается к Господу миров.'
    },
    {
      id: 'Вина',
      title: 'Вина',
      description: 'Двери покаяния открыты: Аллах прощает грехи тем, кто искренне возвращается к Нему.'
    },
    {
      id: 'Усталость',
      title: 'Усталость',
      description: 'Аллах знает меру сил каждого человека и не возлагает сверх возможностей.'
    },
    {
      id: 'Надежда',
      title: 'Надежда',
      description: 'Упование и надежда на всеобъемлющую милость Аллаха укрепляют душу в испытаниях.'
    },
    {
      id: 'Радость',
      title: 'Радость',
      description: 'Благодарность в радости сохраняет благодать и обращает сердце к Дарующему блага.'
    },
    {
      id: 'Благодарность',
      title: 'Благодарность',
      description: 'Признание милостей Аллаха сердцем, языком и праведными делами.'
    },
    {
      id: 'Болезнь',
      title: 'Болезнь',
      description: 'Исцеление приходит от одного Аллаха: шариатская рукья, достоверные дуа и терпение — дозволенные причины.'
    },
    {
      id: 'Потеря',
      title: 'Потеря',
      description: 'Всё принадлежит Аллаху и к Нему возвращается; терпение и надежда на Вечную жизнь утешают душу.'
    },
    {
      id: 'Несправедливость',
      title: 'Несправедливость',
      description: 'Властелин Дня воздаяния видит каждого притеснителя и защищает Своих рабов.'
    },
    {
      id: 'Бедность',
      title: 'Бедность',
      description: 'Пропитание в Руках Аллаха, а мерило достоинства человека — вера, поклонение и благодарность.'
    },
    {
      id: 'Сомнение',
      title: 'Сомнение',
      description: 'Ясное знание из Корана и Сунны и искренняя мольба о прямом пути укрепляют убеждённость.'
    },
    {
      id: 'Семья',
      title: 'Семья',
      description: 'Забота о близких, сиротах и защита семьи словами Аллаха из достоверной Сунны.'
    }
  ];

  var PATH_FALLBACK_STEMS = {
    'Гнев': ['гнев', 'ярост', 'злост', 'раздраж', 'хул', 'обид', 'терп'],
    'Тревога': ['тревог', 'беспокой', 'тягот', 'облегч', 'наущ', 'сердц'],
    'Страх': ['страх', 'боязн', 'бойтесь', 'защит', 'прибега', 'хранител', 'безопас'],
    'Печаль': ['печал', 'груст', 'скорб', 'тоск', 'утеш', 'радост', 'поко'],
    'Болезнь': ['болезн', 'исцел', 'здоров', 'недуг', 'рукья', 'страдан', 'исцеляющ'],
    'Несправедливость': ['несправедлив', 'притесн', 'обид', 'суд', 'воздаян', 'сирот'],
    'Потеря': ['потер', 'утрат', 'смерт', 'терпен', 'воздаян', 'рай', 'последн'],
    'Семья': ['родител', 'семь', 'сирот', 'внук', 'близк', 'родств', 'защит'],
    'Одиночество': ['близ', 'поклон', 'приближ', 'поклоня', 'душ', 'уповаем'],
    'Вина': ['грех', 'прост', 'прощ', 'покая', 'истигфар', 'кающ'],
    'Усталость': ['под силу', 'возможност', 'нош', 'тягот', 'облегч', 'достаточн'],
    'Надежда': ['милост', 'рай', 'заступ', 'облегч', 'надежд', 'вечн'],
    'Радость': ['радост', 'благо', 'побед', 'награ', 'хвал'],
    'Благодарность': ['благодар', 'хвал', 'милост', 'благ', 'альхамдулиллях'],
    'Бедность': ['ризк', 'удел', 'голод', 'накорм', 'бедняк', 'богатств', 'пропитан'],
    'Сомнение': ['истин', 'прям', 'пут', 'знан', 'писан', 'единобож', 'увер'],
    'Единобожие': ['единобож', 'един', 'божеств', 'поклоня', 'господ', 'самад'],
    'Защита Аллаха': ['защит', 'прибега', 'хранител', 'шайтан', 'зла', 'колдовств'],
    'Упование': ['упова', 'полаг', 'помощ', 'достаточ', 'милостив'],
    'Терпение': ['терп', 'стойк', 'испытан', 'тягот', 'облегч'],
    'Судный день': ['судн', 'воздаян', 'воскреш', 'геенн', 'рай'],
    'Покаяние': ['покай', 'прост', 'прощ', 'грех', 'истигфар'],
    'Искренность': ['искрен', 'ради аллаха', 'показух', 'лицемер', 'намаз'],
    'Поминание и тасбих': ['тасбих', 'помина', 'субханаллах', 'славь', 'хвал']
  };

  function normalizeArabicText(s) {
    return String(s || '')
      .replace(/[\u064B-\u065F\u0610-\u061A\u0670\u06D6-\u06ED\u0640\u06DD\u06DE\u06E9]/g, '')
      .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
      .replace(/\u0629/g, '\u0647')
      .replace(/\u0649/g, '\u064A')
      .replace(/\u0624/g, '\u0648')
      .replace(/\u0626/g, '\u064A')
      .replace(/[«»"'.,!?():;—–\-﴿﴾۩]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeSearchText(s) {
    return normalizeArabicText(String(s || '').toLowerCase().replace(/ё/g, 'е'));
  }

  function defaultParseAyahs(item) {
    if (!item) return [];
    var ar = String(item.arabic || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var tr = String(item.transcription || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var trn = String(item.translation || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var isSurah = item.type === 'surah';
    var perLineNum = null;
    if (!isSurah && item.number) {
      var m = String(item.number).match(/^(\d+):(\d+)(?:-(\d+))?$/);
      if (m) {
        var surahN = m[1];
        var start = parseInt(m[2], 10);
        perLineNum = ar.map(function (_, i) { return surahN + ':' + (start + i); });
      }
    }
    return ar.map(function (line, i) {
      return {
        num: isSurah ? (i + 1) : (perLineNum ? perLineNum[i] : (item.number || '')),
        ar: line,
        tr: tr[i] || '',
        trn: trn[i] || ''
      };
    });
  }

  function parseAyahNodeRef(nodeId) {
    var s = String(nodeId || '');
    if (s.indexOf('ayah:') === 0) s = s.slice(5);
    var parts = s.split('#');
    return {
      surahId: parts[0] || '',
      ayahNum: parts[1] ? parseInt(parts[1], 10) || 1 : 1
    };
  }

  function resolveSurahAndAyah(qItem, ayahIdx1Based) {
    if (!qItem) return null;
    if (qItem.type === 'surah') {
      return { surah: Number(qItem.number), ayah: Number(ayahIdx1Based || 1) };
    }
    if (qItem.number) {
      var parts = String(qItem.number).split(':');
      if (parts.length === 2) {
        var sNum = parseInt(parts[0], 10);
        var aPart = parts[1];
        var aNum = 1;
        if (aPart.indexOf('-') !== -1) {
          var bounds = aPart.split('-').map(Number);
          aNum = bounds[0] + (Number(ayahIdx1Based || 1) - 1);
          if (Number.isFinite(bounds[1]) && aNum > bounds[1]) aNum = bounds[1];
        } else {
          aNum = parseInt(aPart, 10);
        }
        if (Number.isFinite(sNum) && Number.isFinite(aNum)) return { surah: sNum, ayah: aNum };
      }
    }
    return null;
  }

  function resolveTafsirForAyah(tafsirs, surahNum, ayahNum) {
    var s = Number(surahNum);
    var a = Number(ayahNum);
    if (!Number.isFinite(s) || !Number.isFinite(a) || !Array.isArray(tafsirs)) return null;
    var found = tafsirs.find(function (t) {
      return t &&
        Number(t.surah) === s &&
        Number(t.ayah) === a &&
        t.status !== 'placeholder' &&
        typeof t.tafsir_text === 'string' &&
        t.tafsir_text.trim() !== '' &&
        t.tafsir_text.indexOf('Ин ша Аллах, здесь скоро появится тафсир') === -1;
    });
    return found || null;
  }

  function describeTafsirSource(tf) {
    if (!tf || !tf.source) return '';
    var parts = [];
    if (tf.source.scholar) parts.push(tf.source.scholar);
    if (tf.source.book) parts.push(tf.source.book);
    if (tf.source.volume) parts.push('т. ' + tf.source.volume);
    return parts.join(' · ');
  }

  function scholarIdFromSource(sourceObj, scholarsList) {
    if (sourceObj && typeof sourceObj === 'object') {
      if (sourceObj.scholar_id) return sourceObj.scholar_id;
      if (sourceObj.scholar) sourceObj = sourceObj.scholar;
    }
    if (!sourceObj) return 'ibn_kathir';
    var low = String(sourceObj).toLowerCase();
    if (low.indexOf('ибн касир') !== -1) return 'ibn_kathir';
    if (Array.isArray(scholarsList)) {
      var match = scholarsList.find(function (s) {
        return s && s.name_ru && low.indexOf(s.name_ru.toLowerCase()) !== -1;
      });
      if (match) return match.id;
    }
    return 'ibn_kathir';
  }

  function flattenQuranToAyahs(quranList, parseAyahsFn) {
    var parser = typeof parseAyahsFn === 'function' ? parseAyahsFn : defaultParseAyahs;
    var result = [];
    (quranList || []).forEach(function (q) {
      if (!q) return;
      var ayahs = parser(q);
      var tags = Array.isArray(q.tags) ? q.tags : [];
      if (q.type === 'surah') {
        ayahs.forEach(function (a, i) {
          result.push({
            _type: 'ayah',
            _nodeId: 'ayah:' + q.id + '#' + a.num,
            _id: q.id + '_' + i,
            _surahId: q.id,
            _surahTitle: q.title,
            _surahNum: q.number,
            _ayahNum: Number(a.num),
            _ayahIdx: i,
            _verseLabel: q.number + ':' + a.num,
            _ar: a.ar,
            _tr: a.tr,
            _trn: a.trn,
            _note: i === 0 ? (q.note || '') : '',
            _source: q.source || '',
            _tags: tags,
            _title: q.title + ' · аят ' + a.num,
            _sub: q.subtitle || '',
            _isSurahAyah: true
          });
        });
      } else if (ayahs.length > 1) {
        ayahs.forEach(function (a, i) {
          var sa = resolveSurahAndAyah(q, i + 1);
          result.push({
            _type: 'ayah',
            _nodeId: 'ayah:' + q.id + '#' + (i + 1),
            _id: q.id + '_' + (i + 1),
            _surahId: q.id,
            _surahTitle: q.title,
            _surahNum: sa ? sa.surah : q.number,
            _ayahNum: i + 1,
            _ayahIdx: i,
            _verseLabel: a.num || q.number || '',
            _ar: a.ar,
            _tr: a.tr,
            _trn: a.trn,
            _note: q.note || '',
            _source: q.source || '',
            _tags: tags,
            _title: q.title + (a.num ? ' · ' + a.num : ''),
            _sub: q.subtitle || '',
            _isSurahAyah: false
          });
        });
      } else {
        var single = ayahs[0] || {};
        var sa1 = resolveSurahAndAyah(q, 1);
        result.push({
          _type: 'ayah',
          _nodeId: 'ayah:' + q.id + '#1',
          _id: q.id,
          _surahId: q.id,
          _surahTitle: q.title,
          _surahNum: sa1 ? sa1.surah : q.number,
          _ayahNum: 1,
          _ayahIdx: 0,
          _verseLabel: single.num || q.number || '',
          _ar: q.arabic || single.ar || '',
          _tr: q.transcription || single.tr || '',
          _trn: q.translation || single.trn || '',
          _note: q.note || '',
          _source: q.source || '',
          _tags: tags,
          _title: q.title,
          _sub: q.subtitle || '',
          _isSurahAyah: false
        });
      }
    });
    return result;
  }

  function describePathEvidence(ev, ctx, surahNum, ayahNum) {
    if (!ev) return '';
    if (typeof ev === 'object') {
      return ev.locator ? String(ev.locator).split(';')[0] : '';
    }
    var s = String(ev);
    var colonIdx = s.indexOf(':');
    var kind = colonIdx >= 0 ? s.slice(0, colonIdx) : s;
    var rest = colonIdx >= 0 ? s.slice(colonIdx + 1) : '';
    var context = ctx || {};

    if (kind === 'tafsir') {
      var m = rest.match(/_(\d+)_(\d+)$/);
      var sn = m ? Number(m[1]) : surahNum;
      var an = m ? Number(m[2]) : ayahNum;
      var tf = resolveTafsirForAyah(context.tafsirs || [], sn, an);
      var who = tf && tf.source && tf.source.scholar ? tf.source.scholar : 'Ибн Касир';
      return 'Тафсир (' + who + '), аят ' + sn + ':' + an;
    }
    if (kind === 'hadith') {
      var h = (context.hadiths || []).find(function (x) { return x && x.id === rest; });
      if (h) {
        return h.title ? ('Хадис «' + h.title + '»' + (h.source ? ' · ' + h.source : '')) : (h.source || rest);
      }
      return 'Хадис (' + rest + ')';
    }
    if (kind === 'dua') {
      var d = (context.duas || []).find(function (x) { return x && x.id === rest; });
      if (d) {
        return d.title ? ('Дуа / раздел «' + d.title + '»') : rest;
      }
      return 'Дуа (' + rest + ')';
    }
    if (kind === 'quran') {
      var qm = rest.match(/^(\d+)_(\d+)$/);
      if (qm) return 'Коран, ' + qm[1] + ':' + qm[2];
    }
    return s;
  }

  function createContextIndex(ctx) {
    var context = ctx || {};
    var quran = context.quran || [];
    var duas = context.duas || [];
    var hadiths = context.hadiths || [];
    var tasbihs = context.tasbihs || [];
    var tafsirs = context.tafsirs || [];
    var themes = context.themes || [];
    var scholars = context.scholars || [];
    var biographies = context.biographies || [];
    var edges = context.edges || [];

    var ayahs = flattenQuranToAyahs(quran, context.parseAyahs);
    var ayahByNode = new Map();
    ayahs.forEach(function (a) { ayahByNode.set(a._nodeId, a); });

    var quranById = new Map();
    quran.forEach(function (q) { if (q && q.id) quranById.set(q.id, q); });

    var duaById = new Map();
    duas.forEach(function (d) { if (d && d.id) duaById.set(d.id, d); });

    var hadithById = new Map();
    hadiths.forEach(function (h) { if (h && h.id) hadithById.set(h.id, h); });

    var tasbihById = new Map();
    tasbihs.forEach(function (t) { if (t && t.id) tasbihById.set(t.id, t); });

    var themeById = new Map();
    var themeByTitle = new Map();
    themes.forEach(function (th) {
      if (!th) return;
      var title = th.title_ru || th.title || th.id;
      var obj = Object.assign({}, th, { title: title });
      themeById.set(th.id, obj);
      themeByTitle.set(title.toLowerCase(), obj);
    });

    var moodById = new Map();
    PATH_MOOD_ORDER.forEach(function (m) { moodById.set(m.id.toLowerCase(), m); });

    var scholarById = new Map();
    scholars.forEach(function (s) { if (s && s.id) scholarById.set(s.id, s); });
    biographies.forEach(function (b) {
      if (b && b.id && !scholarById.has(b.id)) {
        scholarById.set(b.id, { id: b.id, name_ru: b.name, lifespan: b.lifespan || '' });
      }
    });

    return {
      quran: quran,
      ayahs: ayahs,
      duas: duas,
      hadiths: hadiths,
      tasbihs: tasbihs,
      tafsirs: tafsirs,
      themes: themes.map(function (t) { return themeById.get(t.id); }),
      scholars: scholars,
      biographies: biographies,
      edges: edges,
      ayahByNode: ayahByNode,
      quranById: quranById,
      duaById: duaById,
      hadithById: hadithById,
      tasbihById: tasbihById,
      themeById: themeById,
      themeByTitle: themeByTitle,
      moodById: moodById,
      scholarById: scholarById
    };
  }

  function resolveMoodByKey(key, index) {
    if (!key) return null;
    var clean = String(key).replace(/^mood:/, '').trim().toLowerCase();
    return index.moodById.get(clean) || null;
  }

  function resolveThemeByKey(key, index) {
    if (!key) return null;
    var clean = String(key).replace(/^theme:/, '').trim();
    return index.themeById.get(clean) || index.themeByTitle.get(clean.toLowerCase()) || null;
  }

  function expandTargetNodeIds(nodeId, index) {
    var s = String(nodeId || '');
    if (s.indexOf('quran:') === 0) {
      var qId = s.slice(6);
      var list = index.ayahs.filter(function (a) { return a._surahId === qId; }).map(function (a) { return a._nodeId; });
      return list.length ? list : [s];
    }
    return [s];
  }

  function relationLabelForEdge(edgeType, isReverse) {
    switch (edgeType) {
      case 'hadith_explains_ayah': return isReverse ? 'Аят из хадиса' : 'Хадис разъясняет аят';
      case 'ayah_related_ayah': return 'Связанный аят';
      case 'dua_hadith': return isReverse ? 'Связанное дуа' : 'Хадис о данном дуа';
      case 'dua_ayah': return isReverse ? 'Упоминается в руководстве/дуа' : 'Аят из этого раздела';
      case 'dua_tasbih': return isReverse ? 'Связанное дуа' : 'Связанный тасбих';
      case 'hadith_tasbih': return isReverse ? 'Хадис о тасбихе' : 'Тасбих по этому хадису';
      case 'tafsir_comments_ayah': return 'Тафсир к аяту';
      default: return '';
    }
  }

  function getSmartBookRelations(nodeId, ctxOrIndex) {
    var index = (ctxOrIndex && ctxOrIndex.ayahByNode) ? ctxOrIndex : createContextIndex(ctxOrIndex);
    var seedIds = expandTargetNodeIds(nodeId, index);
    var seedSet = new Set(seedIds);

    var out = {
      themes: [],
      moods: [],
      ayahs: [],
      hadiths: [],
      duas: [],
      tasbihs: [],
      tafsirs: [],
      scholars: []
    };

    var seenThemes = new Set();
    var seenMoods = new Set();
    var seenAyahs = new Set();
    var seenHadiths = new Set();
    var seenDuas = new Set();
    var seenTasbihs = new Set();
    var seenTafsirs = new Set();
    var seenScholars = new Set();

    function pushTheme(themeId, edge) {
      var th = resolveThemeByKey(themeId, index);
      if (!th || seenThemes.has(th.id)) return;
      seenThemes.add(th.id);
      out.themes.push({
        id: th.id,
        title: th.title,
        description: th.description || '',
        evidence: describePathEvidence(edge && edge.evidence_source, index),
        note: (edge && edge.evidence_note) || '',
        weight: (edge && edge.weight) || 0.8
      });
    }

    function pushMood(moodId, edge) {
      var m = resolveMoodByKey(moodId, index);
      if (!m || seenMoods.has(m.id)) return;
      seenMoods.add(m.id);
      out.moods.push({
        id: m.id,
        title: m.title,
        description: m.description || '',
        evidence: describePathEvidence(edge && edge.evidence_source, index),
        note: (edge && edge.evidence_note) || '',
        weight: (edge && edge.weight) || 0.8
      });
    }

    function pushAyah(aNodeId, edge, isReverse) {
      if (seedSet.has(aNodeId) || seenAyahs.has(aNodeId)) return;
      var a = index.ayahByNode.get(aNodeId);
      if (!a) return;
      seenAyahs.add(aNodeId);
      out.ayahs.push({
        nodeId: a._nodeId,
        surahId: a._surahId,
        ayahNum: a._ayahNum,
        ayahIdx: a._ayahIdx,
        title: a._title,
        sub: a._sub,
        refLabel: a._verseLabel || String(a._ayahNum),
        relationLabel: relationLabelForEdge(edge.type, isReverse),
        evidence: describePathEvidence(edge.evidence_source, index, a._surahNum, a._ayahNum),
        note: edge.evidence_note || '',
        weight: edge.weight || 0.8
      });
    }

    function pushHadith(hNodeId, edge, isReverse) {
      var hId = String(hNodeId).replace(/^hadith:/, '');
      if (seedSet.has('hadith:' + hId) || seenHadiths.has(hId)) return;
      var h = index.hadithById.get(hId);
      if (!h) return;
      seenHadiths.add(hId);
      out.hadiths.push({
        id: h.id,
        title: h.title,
        subtitle: h.subtitle || '',
        source: h.source || '',
        translation: h.translation || '',
        relationLabel: relationLabelForEdge(edge.type, isReverse),
        evidence: describePathEvidence(edge.evidence_source, index),
        note: edge.evidence_note || '',
        weight: edge.weight || 0.8
      });
    }

    function pushDua(dNodeId, edge, isReverse) {
      var dId = String(dNodeId).replace(/^dua:/, '');
      if (seedSet.has('dua:' + dId) || seenDuas.has(dId)) return;
      var d = index.duaById.get(dId);
      if (!d) return;
      seenDuas.add(dId);
      out.duas.push({
        id: d.id,
        title: d.title,
        subtitle: d.subtitle || '',
        source: d.source || '',
        translation: d.translation || '',
        relationLabel: relationLabelForEdge(edge.type, isReverse),
        evidence: describePathEvidence(edge.evidence_source, index),
        note: edge.evidence_note || '',
        weight: edge.weight || 0.8
      });
    }

    function pushTasbih(tNodeId, edge, isReverse) {
      var tId = String(tNodeId).replace(/^tasbih:/, '');
      if (seedSet.has('tasbih:' + tId) || seenTasbihs.has(tId)) return;
      var t = index.tasbihById.get(tId);
      if (!t) return;
      seenTasbihs.add(tId);
      out.tasbihs.push({
        id: t.id,
        arabic: t.arabic || '',
        transcription: t.transcription || '',
        translation: t.translation || '',
        target: t.target || 33,
        relationLabel: relationLabelForEdge(edge.type, isReverse),
        evidence: describePathEvidence(edge.evidence_source, index),
        note: edge.evidence_note || '',
        weight: edge.weight || 0.8
      });
    }

    function pushScholar(sId) {
      var clean = String(sId || '').replace(/^scholar:/, '');
      if (!clean || seenScholars.has(clean)) return;
      var sc = index.scholarById.get(clean);
      if (!sc) return;
      seenScholars.add(clean);
      out.scholars.push({
        id: sc.id,
        name: sc.name_ru || sc.name || clean,
        lifespan: sc.lifespan || ''
      });
    }

    seedIds.forEach(function (sid) {
      if (sid.indexOf('ayah:') === 0) {
        var ayahObj = index.ayahByNode.get(sid);
        if (ayahObj) {
          var qObj = index.quranById.get(ayahObj._surahId);
          var sa = resolveSurahAndAyah(qObj, ayahObj._ayahNum);
          if (sa) {
            var tf = resolveTafsirForAyah(index.tafsirs, sa.surah, sa.ayah);
            var tKey = sa.surah + ':' + sa.ayah;
            if (tf && !seenTafsirs.has(tKey)) {
              seenTafsirs.add(tKey);
              var scId = scholarIdFromSource(tf.source, index.scholars);
              out.tafsirs.push({
                id: 'tafsir:' + scId + '_' + sa.surah + '_' + sa.ayah,
                surah: sa.surah,
                ayah: sa.ayah,
                text: tf.tafsir_text,
                sourceLine: describeTafsirSource(tf),
                scholarId: scId,
                hadiths: Array.isArray(tf.hadiths) ? tf.hadiths : [],
                israiliyat_note: tf.israiliyat_note || null
              });
              pushScholar(scId);
              if (Array.isArray(tf.hadiths)) {
                tf.hadiths.forEach(function (th) {
                  if (th && th.transmitter_id) pushScholar(th.transmitter_id);
                });
              }
            }
          }
        }
      }
    });

    index.edges.forEach(function (edge) {
      if (!edge || !edge.from || !edge.to) return;
      var fromIn = seedSet.has(edge.from);
      var toIn = seedSet.has(edge.to);
      if (!fromIn && !toIn) return;

      var other = fromIn ? edge.to : edge.from;
      var isReverse = !fromIn;

      if (other.indexOf('theme:') === 0) pushTheme(other, edge);
      else if (other.indexOf('mood:') === 0) pushMood(other, edge);
      else if (other.indexOf('ayah:') === 0) pushAyah(other, edge, isReverse);
      else if (other.indexOf('hadith:') === 0) pushHadith(other, edge, isReverse);
      else if (other.indexOf('dua:') === 0) pushDua(other, edge, isReverse);
      else if (other.indexOf('tasbih:') === 0) pushTasbih(other, edge, isReverse);
      else if (other.indexOf('scholar:') === 0) pushScholar(other);
    });

    out.themes.sort(function (a, b) { return b.weight - a.weight; });
    out.moods.sort(function (a, b) { return b.weight - a.weight; });
    out.ayahs.sort(function (a, b) { return b.weight - a.weight; });
    out.hadiths.sort(function (a, b) { return b.weight - a.weight; });
    out.duas.sort(function (a, b) { return b.weight - a.weight; });
    out.tasbihs.sort(function (a, b) { return b.weight - a.weight; });

    return out;
  }

  function makeCardItem(kind, raw, index, extra) {
    var base = null;
    if (kind === 'ayah') {
      base = Object.assign({}, raw);
    } else if (kind === 'hadith') {
      base = {
        _type: 'hadith',
        _nodeId: 'hadith:' + raw.id,
        _id: raw.id,
        _title: raw.title,
        _sub: raw.subtitle || '',
        _ar: raw.arabic || '',
        _tr: raw.transcription || '',
        _trn: raw.translation || '',
        _note: raw.note || '',
        _source: raw.source || '',
        _tags: Array.isArray(raw.tags) ? raw.tags : [],
        _isSurahAyah: false
      };
    } else if (kind === 'dua') {
      base = {
        _type: 'dua',
        _nodeId: 'dua:' + raw.id,
        _id: raw.id,
        _title: raw.title,
        _sub: raw.subtitle || '',
        _ar: raw.arabic || '',
        _tr: raw.transcription || '',
        _trn: raw.translation || '',
        _note: raw.note || '',
        _source: raw.source || '',
        _tags: Array.isArray(raw.tags) ? raw.tags : [],
        _isSurahAyah: false
      };
    } else if (kind === 'tasbih') {
      base = {
        _type: 'tasbih',
        _nodeId: 'tasbih:' + raw.id,
        _id: raw.id,
        _title: raw.transcription || raw.translation || 'Тасбих',
        _sub: 'Зикр · цель ' + (raw.target || 33) + ' раз',
        _ar: raw.arabic || '',
        _tr: raw.transcription || '',
        _trn: raw.translation || '',
        _note: '',
        _source: '',
        _target: raw.target || 33,
        _tags: [],
        _isSurahAyah: false
      };
    }
    if (!base) return null;
    if (extra) Object.assign(base, extra);

    var rels = getSmartBookRelations(base._nodeId, index);
    base._relations = rels;

    if (kind === 'ayah' && rels.tafsirs.length) {
      var tf = rels.tafsirs[0];
      base._tafsirReason = tf.text;
      base._tafsirSource = tf.sourceLine;
      base._hasTafsir = true;
      base._scholarId = tf.scholarId;
    }
    if (!base._relatedHadiths && rels.hadiths.length) {
      base._relatedHadiths = rels.hadiths;
    }
    return base;
  }

  function resolveRawByNodeId(nodeId, index) {
    var s = String(nodeId || '');
    if (s.indexOf('ayah:') === 0) {
      var a = index.ayahByNode.get(s);
      return a ? { kind: 'ayah', raw: a } : null;
    }
    if (s.indexOf('hadith:') === 0) {
      var h = index.hadithById.get(s.slice(7));
      return h ? { kind: 'hadith', raw: h } : null;
    }
    if (s.indexOf('dua:') === 0) {
      var d = index.duaById.get(s.slice(4));
      return d ? { kind: 'dua', raw: d } : null;
    }
    if (s.indexOf('tasbih:') === 0) {
      var t = index.tasbihById.get(s.slice(7));
      return t ? { kind: 'tasbih', raw: t } : null;
    }
    return null;
  }

  function getThemeCatalog(ctxOrIndex) {
    var index = (ctxOrIndex && ctxOrIndex.ayahByNode) ? ctxOrIndex : createContextIndex(ctxOrIndex);
    return index.themes.map(function (th) {
      var target = 'theme:' + th.id;
      var nodes = new Set();
      index.edges.forEach(function (e) {
        if (e && e.to === target && e.from) nodes.add(e.from);
      });
      return Object.assign({}, th, { count: nodes.size });
    });
  }

  function getMoodCatalog(ctxOrIndex) {
    var index = (ctxOrIndex && ctxOrIndex.ayahByNode) ? ctxOrIndex : createContextIndex(ctxOrIndex);
    return PATH_MOOD_ORDER.map(function (m) {
      var target = 'mood:' + m.id;
      var nodes = new Set();
      index.edges.forEach(function (e) {
        if (e && e.to === target && e.from) nodes.add(e.from);
      });
      return Object.assign({}, m, { count: nodes.size });
    });
  }

  function itemMatchesQuery(item, normQuery, tokens) {
    if (!normQuery) return { matched: true, score: 0 };
    var titleNorm = normalizeSearchText(item._title);
    var subNorm = normalizeSearchText(item._sub);
    var trnNorm = normalizeSearchText(item._trn);
    var trNorm = normalizeSearchText(item._tr);
    var arNorm = normalizeArabicText(item._ar);
    var noteNorm = normalizeSearchText(item._note);
    var tafsirNorm = normalizeSearchText(item._tafsirReason);
    var relThemesNorm = item._relations
      ? normalizeSearchText(item._relations.themes.map(function (t) { return t.title + ' ' + t.note; }).join(' '))
      : '';
    var relMoodsNorm = item._relations
      ? normalizeSearchText(item._relations.moods.map(function (m) { return m.title + ' ' + m.note; }).join(' '))
      : '';
    var semanticNorm = normalizeSearchText([item._semanticJustification, item._semanticNote, item._themeTitle, item._moodTitle].filter(Boolean).join(' '));

    var fullHay = [titleNorm, subNorm, trnNorm, trNorm, arNorm, noteNorm, tafsirNorm, relThemesNorm, relMoodsNorm, semanticNorm]
      .filter(Boolean)
      .join(' ');

    var exactPhrase = fullHay.indexOf(normQuery) !== -1;
    var allTokensMatch = tokens.length > 0 && tokens.every(function (tk) {
      if (fullHay.indexOf(tk) !== -1) return true;
      if (/^ال[\u0621-\u064A]{3,}$/.test(tk)) {
        return fullHay.indexOf(tk.slice(2)) !== -1;
      }
      return false;
    });

    if (!exactPhrase && !allTokensMatch) return { matched: false, score: 0 };

    var score = 10;
    if (titleNorm.indexOf(normQuery) !== -1) score += 50;
    if (arNorm && arNorm.indexOf(normQuery) !== -1) score += 45;
    if (trnNorm.indexOf(normQuery) !== -1) score += 30;
    if (trNorm.indexOf(normQuery) !== -1) score += 25;
    if (relThemesNorm.indexOf(normQuery) !== -1 || relMoodsNorm.indexOf(normQuery) !== -1) score += 20;
    if (exactPhrase) score += 15;
    if (item._semanticJustification) score += 10;
    if (item._type === 'ayah') score += 4;
    else if (item._type === 'hadith') score += 3;
    else if (item._type === 'dua') score += 2;
    return { matched: true, score: score };
  }

  function typeRank(t) {
    if (t === 'ayah') return 4;
    if (t === 'hadith') return 3;
    if (t === 'dua') return 2;
    if (t === 'tasbih') return 1;
    return 0;
  }

  function queryPathItems(params, ctx) {
    var p = params || {};
    var index = createContextIndex(ctx);
    var mode = p.mode || 'all';
    var rawTag = p.tag ? String(p.tag).trim() : '';
    var itemTypeFilter = p.itemTypeFilter || 'all';
    var rawQuery = String(p.query || '').trim();
    var normQuery = normalizeSearchText(rawQuery);
    var tokens = normQuery ? normQuery.split(' ').filter(function (tk) { return tk.length >= 2 || /[\u0600-\u06FF]/.test(tk); }) : [];
    if (normQuery && !tokens.length) tokens = [normQuery];

    var activeTheme = resolveThemeByKey(rawTag, index);
    var activeMood = resolveMoodByKey(rawTag, index);

    // Auto-detect semantic kind when mode is 'all' or 'word'
    var targetKind = null;
    if (mode === 'theme') targetKind = 'theme';
    else if (mode === 'mood') targetKind = 'mood';
    else if (rawTag) {
      if (activeMood && !activeTheme) targetKind = 'mood';
      else if (activeTheme && !activeMood) targetKind = 'theme';
      else if (activeMood) targetKind = 'mood';
      else if (activeTheme) targetKind = 'theme';
    }

    var matchedTopics = [];
    var matchedMoods = [];
    if (normQuery) {
      matchedTopics = getThemeCatalog(index).filter(function (th) {
        var h = normalizeSearchText(th.title + ' ' + (th.description || ''));
        return h.indexOf(normQuery) !== -1 || tokens.every(function (tk) { return h.indexOf(tk) !== -1; });
      });
      matchedMoods = getMoodCatalog(index).filter(function (m) {
        var h = normalizeSearchText(m.title + ' ' + (m.description || ''));
        return h.indexOf(normQuery) !== -1 || tokens.every(function (tk) { return h.indexOf(tk) !== -1; });
      });
    }

    var candidates = new Map();
    function addCandidate(item, score) {
      if (!item) return;
      var key = item._nodeId;
      var existing = candidates.get(key);
      if (!existing) {
        item._score = score;
        candidates.set(key, item);
      } else {
        if (score > (existing._score || 0)) existing._score = score;
        if (!existing._semanticJustification && item._semanticJustification) {
          existing._semanticJustification = item._semanticJustification;
          existing._semanticNote = item._semanticNote;
        }
        if (!existing._themeTitle && item._themeTitle) existing._themeTitle = item._themeTitle;
        if (!existing._moodTitle && item._moodTitle) existing._moodTitle = item._moodTitle;
      }
    }

    if (rawTag && ((targetKind === 'theme' && activeTheme) || (targetKind === 'mood' && activeMood))) {
      var edgeTarget = targetKind === 'theme' ? ('theme:' + activeTheme.id) : ('mood:' + activeMood.id);
      var matchingEdges = index.edges.filter(function (e) {
        return e && e.to === edgeTarget;
      });
      matchingEdges.forEach(function (edge) {
        var resolved = resolveRawByNodeId(edge.from, index);
        if (!resolved) return;
        var sNum = resolved.kind === 'ayah' ? resolved.raw._surahNum : null;
        var aNum = resolved.kind === 'ayah' ? resolved.raw._ayahNum : null;
        var card = makeCardItem(resolved.kind, resolved.raw, index, {
          _semanticJustification: describePathEvidence(edge.evidence_source, index, sNum, aNum),
          _semanticNote: edge.evidence_note || '',
          _themeTitle: targetKind === 'theme' ? activeTheme.title : '',
          _moodTitle: targetKind === 'mood' ? activeMood.title : ''
        });
        addCandidate(card, 1000 + Math.round((edge.weight || 0.8) * 100) + typeRank(card._type));
      });

      // Fallback stem/tag matching only if graph edges didn't already cover items (kept strict)
      var tagTitle = targetKind === 'theme' ? activeTheme.title : activeMood.title;
      var stems = PATH_FALLBACK_STEMS[tagTitle] || [tagTitle.toLowerCase()];
      var allNodes = [];
      index.ayahs.forEach(function (a) { allNodes.push({ kind: 'ayah', raw: a }); });
      index.hadiths.forEach(function (h) { allNodes.push({ kind: 'hadith', raw: h }); });
      index.duas.forEach(function (d) { allNodes.push({ kind: 'dua', raw: d }); });
      index.tasbihs.forEach(function (t) { allNodes.push({ kind: 'tasbih', raw: t }); });

      allNodes.forEach(function (entry) {
        var nodeId = entry.kind === 'ayah' ? entry.raw._nodeId : (entry.kind + ':' + entry.raw.id);
        if (candidates.has(nodeId)) return;
        var card = makeCardItem(entry.kind, entry.raw, index);
        var hasExplicitTag = Array.isArray(card._tags) && card._tags.indexOf(tagTitle) !== -1;
        if (!hasExplicitTag && matchingEdges.length > 0) {
          // For already well-curated themes/moods in edges.json, keep fallback tightly scoped to explicit tags or direct title mentions
          var titleHay = normalizeSearchText(card._title);
          var hitTitle = stems.some(function (st) { return titleHay.indexOf(st) !== -1; });
          if (!hitTitle) return;
          addCandidate(card, 300 + typeRank(card._type));
          return;
        }
        if (hasExplicitTag) {
          addCandidate(card, 500 + typeRank(card._type));
        } else {
          var hay = normalizeSearchText([card._title, card._sub, card._trn, card._tr].filter(Boolean).join(' '));
          if (stems.some(function (st) { return hay.indexOf(st) !== -1; })) {
            addCandidate(card, 250 + typeRank(card._type));
          }
        }
      });
    } else if (rawTag) {
      // Custom / legacy tag fallback
      var legacyStems = PATH_FALLBACK_STEMS[rawTag] || [rawTag.toLowerCase()];
      var legacyList = []
        .concat(index.ayahs.map(function (a) { return { kind: 'ayah', raw: a }; }))
        .concat(index.hadiths.map(function (h) { return { kind: 'hadith', raw: h }; }))
        .concat(index.duas.map(function (d) { return { kind: 'dua', raw: d }; }))
        .concat(index.tasbihs.map(function (t) { return { kind: 'tasbih', raw: t }; }));
      legacyList.forEach(function (entry) {
        var card = makeCardItem(entry.kind, entry.raw, index);
        var hasTag = Array.isArray(card._tags) && card._tags.indexOf(rawTag) !== -1;
        var hay = normalizeSearchText([card._title, card._sub, card._trn, card._tr, card._note].filter(Boolean).join(' '));
        if (hasTag || legacyStems.some(function (st) { return hay.indexOf(st) !== -1; })) {
          addCandidate(card, (hasTag ? 500 : 250) + typeRank(card._type));
        }
      });
    } else if (normQuery) {
      var everyEntry = []
        .concat(index.ayahs.map(function (a) { return { kind: 'ayah', raw: a }; }))
        .concat(index.hadiths.map(function (h) { return { kind: 'hadith', raw: h }; }))
        .concat(index.duas.map(function (d) { return { kind: 'dua', raw: d }; }))
        .concat(index.tasbihs.map(function (t) { return { kind: 'tasbih', raw: t }; }));

      everyEntry.forEach(function (entry) {
        var card = makeCardItem(entry.kind, entry.raw, index);
        var res = itemMatchesQuery(card, normQuery, tokens);
        if (res.matched) {
          addCandidate(card, res.score);
        }
      });
    }

    var results = Array.from(candidates.values());

    if (normQuery && rawTag) {
      results = results.filter(function (item) {
        var m = itemMatchesQuery(item, normQuery, tokens);
        if (m.matched) item._score = (item._score || 0) + m.score;
        return m.matched;
      });
    }

    if (itemTypeFilter && itemTypeFilter !== 'all') {
      results = results.filter(function (item) { return item._type === itemTypeFilter; });
    }

    results.sort(function (a, b) {
      if ((b._score || 0) !== (a._score || 0)) return (b._score || 0) - (a._score || 0);
      return typeRank(b._type) - typeRank(a._type);
    });

    return {
      items: results,
      activeTheme: targetKind === 'theme' ? activeTheme : null,
      activeMood: targetKind === 'mood' ? activeMood : null,
      matchedTopics: matchedTopics,
      matchedMoods: matchedMoods
    };
  }

  var api = {
    PATH_MOOD_ORDER: PATH_MOOD_ORDER,
    normalizeArabicText: normalizeArabicText,
    normalizeSearchText: normalizeSearchText,
    parseAyahNodeRef: parseAyahNodeRef,
    resolveSurahAndAyah: resolveSurahAndAyah,
    resolveTafsirForAyah: resolveTafsirForAyah,
    describeTafsirSource: describeTafsirSource,
    scholarIdFromSource: scholarIdFromSource,
    flattenQuranToAyahs: flattenQuranToAyahs,
    describePathEvidence: describePathEvidence,
    createContextIndex: createContextIndex,
    getSmartBookRelations: getSmartBookRelations,
    getThemeCatalog: getThemeCatalog,
    getMoodCatalog: getMoodCatalog,
    queryPathItems: queryPathItems
  };

  root.IqraGraph = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
