"use strict";

/* ============================================================
   STORAGE.JS — Состояние, localStorage, миграции, утилиты данных
   Проект «Икра» · v386 (рефакторинг)
   Глобальные DEFAULT_* заполняются в api.js (loadAllData).
   ============================================================ */

const STORAGE_KEY = 'iqra_data';
const APP_URL = 'https://ibrahimnalgievwb-sudo.github.io/iqra/';
const APP_VERSION = 'iqra-v386';

const BACKUP_SCHEMA = 2;
const LIMITS = { tasbihs:1000, history:10000, historyDays:365, reminders:50, textLen:1000, idLen:100, targetMax:100000, cyclesMax:1000000 };
const QURAN_USE_API = false;

let state = null;

function cloneData(obj) {
  if (typeof structuredClone === 'function') {
    try { return structuredClone(obj); } catch(e) {}
  }
  return JSON.parse(JSON.stringify(obj));
}

function defaultSettings() { return { theme:'auto', arSize:1, dailyGoal:100, autoNext:true, wakeLock:true, sound:true, vibrate:true, goalNotify:false, lastRead:null, lastScreen:null }; }

function load() {
  let s = null;
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) s = JSON.parse(raw); } catch(e) { s = null; }
  if (!s) {
    const legacyKeys = ['tasbih_app_v13','tasbih_app_v12','tasbih_app_v11','tasbih_app_v10','tasbih_app_v9'];
    for (const k of legacyKeys) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            s = parsed;
            try { localStorage.setItem(STORAGE_KEY, raw); } catch(e) {}
            break;
          }
        }
      } catch(e) {}
    }
  }
   if (!s) {
    s = {
      tasbihs: cloneData(DEFAULT_TASBIHS), history:{}, settings:defaultSettings(),
      reminders:[], draft:null, duas:cloneData(DEFAULT_DUAS),
      hadiths:cloneData(DEFAULT_HADITHS), quran:cloneData(DEFAULT_QURAN),
      migrations:{}
    };
  }
  s.settings = Object.assign(defaultSettings(), s.settings || {});   if (typeof s.settings.tajweedMode !== 'boolean') s.settings.tajweedMode = false;   if (s.settings.theme === 'night') s.settings.theme = 'dark';
  if (s.settings.lastRead && !s.settings.lastRead.type && s.settings.lastRead.quranId) {
    s.settings.lastRead = { type: 'quran', id: s.settings.lastRead.quranId, ts: s.settings.lastRead.ts || Date.now() };
  }
  s.reminders = Array.isArray(s.reminders) ? s.reminders : [];
  s.draft = s.draft && typeof s.draft === 'object' ? s.draft : null;
  s.tasbihs = Array.isArray(s.tasbihs) ? s.tasbihs : JSON.parse(JSON.stringify(DEFAULT_TASBIHS));
  s.history = s.history && typeof s.history === 'object' ? s.history : {};
  s.duas = Array.isArray(s.duas) ? s.duas : [];
  s.hadiths = Array.isArray(s.hadiths) ? s.hadiths : [];
  s.quran = Array.isArray(s.quran) ? s.quran : [];
  s.migrations = s.migrations && typeof s.migrations === 'object' ? s.migrations : {};   s.favorites = Array.isArray(s.favorites) ? s.favorites : [];   s.bookmarks = Array.isArray(s.bookmarks) ? s.bookmarks : [];   s.settings.readScrolls = (s.settings.readScrolls && typeof s.settings.readScrolls === 'object') ? s.settings.readScrolls : {};   s.settings.readAyah = (s.settings.readAyah && typeof s.settings.readAyah === 'object') ? s.settings.readAyah : {};

  if (!s.migrations.sanitizeIds_v1) {
    const validId = (id) => (typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id));
    s.tasbihs = s.tasbihs.filter(t => t && typeof t === 'object' && validId(t.id));
    s.duas = s.duas.filter(d => d && typeof d === 'object' && validId(d.id));
    s.hadiths = s.hadiths.filter(h => h && typeof h === 'object' && validId(h.id));
    s.favorites = s.favorites.filter(id => validId(id));
    s.bookmarks = s.bookmarks.filter(b => b && typeof b === 'object' && validId(b.id) && validId(b.quranId));
    s.migrations.sanitizeIds_v1 = true;
  }

  if (!s.migrations.addedTawhid) { if (!s.tasbihs.some(t=>t.id==='tawhid')) s.tasbihs.unshift(JSON.parse(JSON.stringify(TAWHID_TASBIH))); s.migrations.addedTawhid = true; }
  if (!s.migrations.addedIstighfar) { if (!s.tasbihs.some(t=>t.id==='istighfar')) s.tasbihs.splice(1,0,JSON.parse(JSON.stringify(ISTIGHFAR_TASBIH))); s.migrations.addedIstighfar = true; }
  if (!s.migrations.addedDuas) { const ids=new Set(s.duas.map(d=>d.id)); for (const d of DEFAULT_DUAS) if (!ids.has(d.id)) s.duas.push(JSON.parse(JSON.stringify(d))); s.migrations.addedDuas = true; }
  if (!s.migrations.addedHadiths) { const ids=new Set(s.hadiths.map(h=>h.id)); for (const h of DEFAULT_HADITHS) if (!ids.has(h.id)) s.hadiths.push(JSON.parse(JSON.stringify(h))); s.migrations.addedHadiths = true; }    if (!s.migrations.duaSayyidulFix_v1) {     const fixed = DEFAULT_DUAS.find(d => d.id === 'dua_sayyidul_istighfar');     const existing = s.duas.find(d => d.id === 'dua_sayyidul_istighfar');     if (fixed && existing) { existing.arabic = fixed.arabic; existing.transcription = fixed.transcription; existing.translation = fixed.translation; }     s.migrations.duaSayyidulFix_v1 = true;   }
  if (!s.migrations.ruqyahGuideFix_v1) {
    const fixed = DEFAULT_DUAS.find(d => d.id === 'ruqyah_guide');
    const existing = s.duas.find(d => d.id === 'ruqyah_guide');
    if (fixed && existing) {
      existing.subtitle = fixed.subtitle;
      existing.translation = fixed.translation;
      existing.note = fixed.note;
      existing.source = fixed.source;
    }
      s.migrations.ruqyahGuideFix_v1 = true;
  }
  if (!s.migrations.ruqyahGuideFix_v2) {
    const fixed = DEFAULT_DUAS.find(d => d.id === 'ruqyah_guide');
    const existing = s.duas.find(d => d.id === 'ruqyah_guide');
    if (fixed && existing) {
      existing.subtitle = fixed.subtitle;
      existing.translation = fixed.translation;
      existing.note = fixed.note;
      existing.source = fixed.source;
    }
    s.migrations.ruqyahGuideFix_v2 = true;
  }
  if (!s.migrations.prophetTitleFix_v1) {
    const h_mulk = s.hadiths.find(h => h.id === 'h_mulk');
    if (h_mulk) h_mulk.note = 'Пророк ﷺ (да благословит его Аллах и приветствует) сказал: «В Коране есть сура из тридцати аятов, которая заступится за человека, пока ему не будет прощено».';
    const q67 = s.quran.find(q => q.id === 'q67');
    if (q67) q67.note = 'Пророк ﷺ (да благословит его Аллах и приветствует) сказал: «В Коране есть сура из тридцати аятов, которая заступится за человека, пока ему не будет прощено: "Благословен Тот, в Чьей Руке власть…"» (ат-Тирмизи № 2891, Абу Дауд № 1400).';
    s.migrations.prophetTitleFix_v1 = true;
  }
  if (!s.migrations.quran_v15) {
    const learnedMap = new Map(s.quran.map(q => [q.id, { learned: q.learned, learnedAt: q.learnedAt }]));
    s.quran = cloneData(DEFAULT_QURAN);
    s.quran.forEach(q => { const prev = learnedMap.get(q.id); if (prev) { q.learned = !!prev.learned; q.learnedAt = prev.learnedAt || ''; } });
    s.migrations.quran_v15 = true;
  }
   if (!s.migrations.quran_v16 || !s.quran || s.quran.length === 0) {
    const learnedMap = new Map((s.quran || []).map(q => [q.id, { learned: q.learned, learnedAt: q.learnedAt }]));
    s.quran = cloneData(DEFAULT_QURAN);
    s.quran.forEach(q => { const prev = learnedMap.get(q.id); if (prev) { q.learned = !!prev.learned; q.learnedAt = prev.learnedAt || ''; } });
    s.migrations.quran_v16 = true;
  }
    (function canonicalizeQuran(){
    if (!Array.isArray(s.quran)) { s.quran = cloneData(DEFAULT_QURAN); return; }
    var learnedMap = new Map(s.quran.map(function(q){ return [q.id, { learned: q.learned, learnedAt: q.learnedAt }]; }));
    s.quran = cloneData(DEFAULT_QURAN);
    s.quran.forEach(function(q){ var prev = learnedMap.get(q.id); if (prev) { q.learned = !!prev.learned; q.learnedAt = prev.learnedAt || ''; } });
  })();

    if (!s.migrations.tajweedCacheFix_v3) {
    try { 
      Object.keys(localStorage).forEach(function(k) {
        if (k.indexOf('iqra_tajweed_') === 0) localStorage.removeItem(k);
      });
    } catch(e) {}
    s.migrations.tajweedCacheFix_v3 = true;
  }

  if (!s.migrations.addedRuqyah_v1) {
    const qIds = new Set(s.quran.map(q => q.id));
    const newAyahs = [
      { id: 'ruqyah_araf', type: 'ruqyah', number: '7:117-119', title: 'Аль-А‘раф', subtitle: 'Шариатская рукья · аяты 117–119', bismillah: null,
        arabic: 'وَأَوْحَيْنَا إِلَىٰ مُوسَىٰ أَنْ أَلْقِ عَصَاكَ ۖ فَإِذَا هِيَ تَلْقَفُ مَا يَأْفِكُونَ ﴿١١٧﴾ فَوَقَعَ الْحَقُّ وَبَطَلَ مَا كَانُوا يَعْمَلُونَ ﴿١١٨﴾ فَغُلِبُوا هُنَالِكَ وَانقَلَبُوا صَاغِرِينَ ﴿١١٩﴾',
        transcription: 'Ва авхайна иля Муса ан альки ‘асака фа-иза хийа талькафу ма йа’фикун. Фавака‘а-ль-хакку ва баталя ма кану йа‘малюн. Фагулибу хуна-лика ванкалябу сагирин.',
        translation: '«И внушили Мы Мусе: “Брось свой посох!” И вот он пожирает то, что они измышляют. И утвердилась истина, и исчезло то, что они делали. И были они побеждены там и обратились в униженных».',
        note: 'Читается в составе шариатской рукьи.', source: 'Священный Коран, сура 7 «Аль-А‘раф», аяты 117–119.', learned: false, learnedAt: '', tags: [], tafsir: null },
      { id: 'ruqyah_yunus', type: 'ruqyah', number: '10:79-82', title: 'Юнус', subtitle: 'Шариатская рукья · аяты 79–82', bismillah: null,
        arabic: 'وَقَالَ فِرْعَوْنُ ائْتُونِي بِكُلِّ سَاحِرٍ عَلِيمٍ ﴿٧٩﴾ فَلَمَّا جَاءَ السَّحَرَةُ قَالَ لَهُم مُّوسَىٰ أَلْقُوا مَا أَنتُم مُّلْقُونَ ﴿٨٠﴾ فَلَمَّا أَلْقَوْا قَالَ مُوسَىٰ مَا جِئْتُم بِهِ السِّحْرُ ۖ إِنَّ اللَّهَ سَيُبْطِلُهُ ۖ إِنَّ اللَّهَ لَا يُصْلِحُ عَمَلَ الْمُفْسِدِينَ ﴿٨١﴾ وَيُحِقُّ اللَّهُ الْحَقَّ بِكَلِمَاتِهِ وَلَوْ كَرِهَ الْمُجْرِمُونَ ﴿٨٢﴾',
        transcription: 'Ва каля фир‘ауну-’туни бикулли сахирин ‘алим. Фалямма джа’а-с-сахарату каля ляхум Муса альку ма антум мулькун. Фалямма алькау каля Муса ма джи’тум бихи-с-сихру инна-Ллаха сайубтилюху инна-Ллаха ля йуслиху ‘амаля-ль-муфсидин. Ва йухикку-Ллаху-ль-хакка бикалиматихи ва ляу кариха-ль-муджримун.',
        translation: '«И сказал Фараон: “Приведите ко мне каждого искусного колдуна!” Когда колдуны пришли, Муса сказал им: “Бросьте то, что вы хотите бросить”. Когда они бросили, Муса сказал: “То, что вы принесли, — колдовство. Поистине, Аллах сделает его тщетным. Поистине, Аллах не исправляет дела тех, кто сеет нечестие. И Аллах утвердит истину Своими словами, даже если это ненавистно грешникам”».',
        note: 'Читается в составе шариатской рукьи.', source: 'Священный Коран, сура 10 «Юнус», аяты 79–82.', learned: false, learnedAt: '', tags: [], tafsir: null },
      { id: 'ruqyah_taha', type: 'ruqyah', number: '20:65-69', title: 'Та Ха', subtitle: 'Шариатская рукья · аяты 65–69', bismillah: null,
        arabic: 'قَالُوا يَا مُوسَىٰ إِمَّا أَن تُلْقِيَ وَإِمَّا أَن نَّكُونَ أَوَّلَ مَنْ أَلْقَىٰ ﴿٦٥﴾ قَالَ بَلْ أَلْقُوا ۖ فَإِذَا حِبَالُهُمْ وَعِصِيُّهُمْ يُخَيَّلُ إِلَيْهِ مِن سِحْرِهِمْ أَنَّهَا تَسْعَىٰ ﴿٦٦﴾ فَأَوْجَسَ فِي نَفْسِهِ خِيفَةً مُّوسَىٰ ﴿٦٧﴾ قُلْنَا لَا تَخَفْ إِنَّكَ أَنتَ الْأَعْلَىٰ ﴿٦٨﴾ وَأَلْقِ مَا فِي يَمِينِكَ تَلْقَفْ مَا صَنَعُوا ۖ إِنَّمَا صَنَعُوا كَيْدُ سَاحِرٍ ۖ وَلَا يُفْلِحُ السَّاحِرُ حَيْثُ أَتَىٰ ﴿٦٩﴾',
        transcription: 'Калю йа Муса имма ан тулькийа ва имма ан накуна авваля ман алька. Каля баль альку фа-иза хибалюхум ва ‘исийухум йухаййалю иляйхи мин сихрихим аннаха тас‘а. Фа авджаса фи нафсихи хифатан Муса. Кульна ля тахаф иннака анта-ль-а‘ля. Ва альки ма фи йаминика талькаф ма сана‘у иннама сана‘у кайду сахир ва ля йуфлиху-с-сахиру хайсу ата.',
        translation: '«Они сказали: “О Муса! Ты бросишь первым, или же нам быть первыми?” Он сказал: “Нет, бросайте вы!” И вот их веревки и посохи, из-за их колдовства, показались ему (Мусé) движущимися. И почувствовал Муса в душе страх. Мы сказали: “Не бойся, поистине, ты — выше всех! Брось то, что в твоей правой руке, и оно проглотит то, что они сделали. Поистине, то, что они сделали, — лишь козни колдуна, а колдун не преуспеет, где бы он ни был”».',
        note: 'Читается в составе шариатской рукьи.', source: 'Священный Коран, сура 20 «Та Ха», аяты 65–69.', learned: false, learnedAt: '', tags: [], tafsir: null },
      { id: 'ruqyah_ayat_kursi', type: 'ruqyah', number: '2:255', title: 'Аят аль-Курси', subtitle: 'Шариатская рукья · аят 255', bismillah: null,
        arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
        transcription: 'Аллаху ля иляха илля хуваль-Хаййуль-Каййум. Ля та’хузуху синатун ва ля наум. Ляху ма фис-самауати ва ма филь-ард. Ман заль-лязи яшфа‘у ‘индаху илля би-изних. Я‘ляму ма байна айдихим ва ма хальфахум. Ва ля йухитуна бишай’ин мин ‘ильмихи илля бима ша’. Васи‘а курсиййухус-самауати валь-ард. Ва ля йа’удуху хифзухума. Ва хуваль-‘Алиййуль-‘Азым.',
        translation: '«Аллах — нет божества, кроме Него, Живого, Вседержителя...»',
        note: 'Пророк ﷺ (да благословит его Аллах и приветствует) назвал его величайшим аятом Корана (Муслим № 810).', source: 'Священный Коран, сура 2 «Аль-Бакара», аят 255.', learned: false, learnedAt: '', tags: [], tafsir: null }
];
    for (const a of newAyahs) if (!qIds.has(a.id)) s.quran.push(a);

    const dIds = new Set(s.duas.map(d => d.id));
    const newDuas = [
      { id:'ruqyah_guide', title:'Руководство по Шариатской рукье', subtitle:'Сидр, аяты о колдовстве, профилактика и важные условия', arabic:'', transcription:'',
      translation:'**СТАТУС ПРАКТИКИ С СИДРОМ**\nЭта практика НЕ является Сунной в строгом смысле (нет прямого хадиса от Пророка ﷺ (да благословит его Аллах и приветствует), однако она дозволена (мубах) и признана полезной многими авторитетными учёными, включая шейха Ибн База (да помилует его Аллах).\n\n**1. Лечение водой с листьями сидра**\nШейх Ибн Баз в своих фетвах подтверждал: если взять семь зелёных листьев сидра, растолочь их, положить в воду, прочитать над этой водой аяты рукьи, а затем выпить воду и совершить ею омовение — в этом нет ничего плохого, и Аллах может дать исцеление посредством этого. Он говорил: «Это то, что мы испытывали много раз».\n\n**2. Аяты о колдовстве (читаются в рукье)**\nИбн Баз и другие учёные приводят следующие аяты:\n• Сура «аль-А\'раф» (7:117–119)\n• Сура «Юнус» (10:79–82)\n• Сура «Та Ха» (20:65–69)\nИх можно читать над больным, а также **читать в воду, а затем пить эту воду и совершать ею омовение**.\n\n**3. Защитные суры (аль-Му\'аввизат)**\nСунной является чтение следующих сур для защиты:\n• **«Аль-Ихлас» (112)** — основа единобожия, равна трети Корана.\n• **«Аль-Фаляк» (113)** и **«Ан-Нас» (114)** — две защищающие суры (аль-Му\'аввизатайн).\nПорядок чтения, установленный в Сунне: «Аль-Ихлас», затем «Аль-Фаляк», затем «Ан-Нас». Читаются три раза утром и вечером, а также перед сном с дуновением на ладони и протиранием тела.\n• **«Аль-Кафирун» (109)** — чтение перед сном является сунной и защитой от многобожия (ширка).\nКроме того, **эти суры (а также Аят аль-Курси и «Аль-Кафирун») можно читать в воду**, а затем пить её и совершать ею омовение — это один из видов шариатской рукьи, подтверждённый фетвами учёных.\n\n**4. Постоянная защита (профилактика)**\n• Читайте утренние и вечерние азкары.\n• Читайте Аят аль-Курси после каждого обязательного намаза и перед сном.\n• Читайте защитные суры (см. пункт 3) для защиты.\n• Для лечения **читайте Аят аль-Курси, «Аль-Ихлас», «Аль-Фаляк», «Ан-Нас» и «Аль-Кафирун» в воду**, а затем пейте её и совершайте ею омовение.\n\n**5. Важное предостережение**\nИсцеление приходит только от Аллаха. Все эти средства — лишь причина. Строго запрещено использовать талисманы, амулеты или любые действия, ведущие к многобожию (ширку).',
        note:'Практика с сидром: нет прямого хадиса (марфу\'), но дозволена учёными (Ибн Баз, Ибн Батталь, аль-Куртуби, Ибн Касир, Ибн Хаджар). Источник практики — «Мусаннаф» Абдурраззака и книги Вахба ибн Мунаббиха (исраилият).', source:'Фетвы шейха Ибн База («Фатава Нур аля ад-Дарб», «ад-Дава аш-Шар\'и ли-с-Сихр»), Islamweb (фетва № 520900).', learned:false },
      { id:'ruqyah_jibril', title:'Дуа Джибриля (для исцеления)', subtitle:'Читал Пророк ﷺ (да благословит его Аллах и приветствует), и ангел Джибриль читал для него',
        arabic:'بِسْمِ اللَّهِ أَرْقِيكَ مِنْ كُلِّ شَيْءٍ يُؤْذِيكَ، مِنْ شَرِّ كُلِّ نَفْسٍ أَوْ عَيْنِ حَاسِدٍ، اللَّهُ يَشْفِيكَ، بِسْمِ اللَّهِ أَرْقِيكَ',
        transcription:'Бисмилляхи аркыка, мин кулли шай’ин йу’зика, мин шарри кулли нафсин ав ‘айнин хасидин, Аллаху йашфика, бисмилляхи аркыка.',
        translation:'«Именем Аллаха заклинаю тебя от всего, что причиняет тебе страдания, от зла каждой души или завистливого глаза. Да исцелит тебя Аллах! Именем Аллаха заклинаю тебя».',
        note:'', source:'Сахих Муслим (№ 2186).', learned:false },
      { id:'ruqyah_shifa', title:'Дуа о выздоровлении', subtitle:'Читается три раза',
        arabic:'اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَأْسَ، اشْفِ أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا',
        transcription:'Аллахумма, Рабба-н-нас, азхиби-ль-ба’с, ишфи Анта-ш-Шафи, ля шифа’а илля шифа’ука, шифа’ан ля йугадиру сакама.',
        translation:'«О Аллах, Господь людей, удали страдание и исцели, Ты — Исцеляющий. Нет исцеления, кроме Твоего исцеления, исцеления, которое не оставляет болезни».',
        note:'', source:'Сахих аль-Бухари (№ 5675), Сахих Муслим (№ 2191).', learned:false },
      { id:'ruqyah_hifz', title:'Краткие дуа для защиты', subtitle:'От шайтана, ядовитых существ и дурного глаза',
        arabic:'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ\nأَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ، وَمِنْ كُلِّ عَيْنٍ لَامَّةٍ',
        transcription:'А‘узу бикалимати-Лляхи-т-таммати мин шарри ма халяк.\nА‘узу бикалимати-Лляхи-т-таммати мин кулли шайтанин ва хамматин ва мин кулли ‘айнин лямматин.',
        translation:'«Прибегаю к защите совершенных слов Аллаха от зла того, что Он создал».\n«Прибегаю к совершенным словам Аллаха, чтобы они защитили меня от любого шайтана, и от любого ядовитого существа, и от всякого дурного глаза».',
        note:'', source:'Сахих Муслим (№ 2708, 2709).', learned:false }
    ];
    for (const d of newDuas) if (!dIds.has(d.id)) s.duas.push(d);

    s.migrations.addedRuqyah_v1 = true;
  }

  if (!s.migrations.tajweedCacheFix_v4) {
    try {
      Object.keys(localStorage).forEach(function(k) {
        if (k.indexOf('iqra_tajweed_') === 0) localStorage.removeItem(k);
      });
    } catch(e) {}
    s.migrations.tajweedCacheFix_v4 = true;
  }

    if (!s.migrations.tajweedCacheFix_v5) {
    try {
      Object.keys(localStorage).forEach(function(k) {
        if (k.indexOf('iqra_tajweed_surah_') === 0) localStorage.removeItem(k);
      });
    } catch(e) {}
    s.migrations.tajweedCacheFix_v5 = true;
  }
  
  return s;
}

let _saveTimer = null;
function saveNow() {
  if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
  pruneHistory();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch(e) {
    if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
      alert('Хранилище заполнено. Сохраните бэкап и удалите старые данные.');
    }
  }
  const ind = document.getElementById('save-indicator');
  if (ind) ind.classList.remove('active');
}

function migrateData() {
  if (state.migrations.tagsAdded === true) return;
  let changed = false;
  if (Array.isArray(state.duas)) {
    state.duas.forEach(item => {
      if (!Array.isArray(item.tags)) {
        item.tags = [];
        changed = true;
      }
    });
  }
  if (Array.isArray(state.hadiths)) {
    state.hadiths.forEach(item => {
      if (!Array.isArray(item.tags)) {
        item.tags = [];
        changed = true;
      }
    });
  }
  state.migrations.tagsAdded = true;
  if (changed) {
    saveNow();
  }
}
function save() {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(saveNow, 500);
  const ind = document.getElementById('save-indicator');
  if (ind) ind.classList.add('active');
}

function pruneHistory() {
  if (!state.history || typeof state.history !== 'object') return;
  const keys = Object.keys(state.history);
  if (keys.length <= LIMITS.historyDays && keys.length <= LIMITS.history) return;
  keys.sort();
  let toRemove = [];
  if (keys.length > LIMITS.historyDays) {
    toRemove = keys.slice(0, keys.length - LIMITS.historyDays);
  }
  const remaining = keys.filter(k => toRemove.indexOf(k) < 0);
  if (remaining.length > LIMITS.history) {
    toRemove = toRemove.concat(remaining.slice(0, remaining.length - LIMITS.history));
  }
    toRemove.forEach(k => { delete state.history[k]; });

  try {
    var quoteKeys = Object.keys(localStorage).filter(function(k){ return k.indexOf('iqra_quote_') === 0; });
    if (quoteKeys.length > 7) {
      quoteKeys.sort();
      var toRemoveQuotes = quoteKeys.slice(0, quoteKeys.length - 7);
      toRemoveQuotes.forEach(function(k){ localStorage.removeItem(k); });
    }
  } catch(e) {}
}

function pad(n){ return n<10?'0'+n:''+n; }
function todayKey(){ return dateKey(new Date()); }
function dateKey(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function getById(id){ return state.tasbihs.find(t=>t.id===id); }
function getDuaById(id){ return state.duas.find(d=>d.id===id); }
function getHadithById(id){ return state.hadiths.find(h=>h.id===id); }
function getQuranById(id){ return state.quran.find(q=>q.id===id); }

function formatHijri(date){
  try {
    const MONTHS = ['мухаррам','сафар','раби аль-авваль','раби ас-сани','джумада аль-уля','джумада ас-сания','раджаб','шаабан','рамадан','шавваль','зуль-када','зуль-хиджа'];
    const parts = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { day:'numeric', month:'numeric', year:'numeric' }).formatToParts(date);
    let d = 1, m = 1, y = 1;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (p.type === 'day') d = parseInt(p.value, 10) || 1;
      else if (p.type === 'month') m = parseInt(p.value, 10) || 1;
      else if (p.type === 'year') y = parseInt(p.value, 10) || 1;
    }
    const monthName = MONTHS[m - 1] || '';
    return d + ' ' + monthName + ' ' + y + ' г. х.';
  } catch(e) { return ''; }
}

function isFavorite(id){ return Array.isArray(state.favorites) && state.favorites.includes(id); }
function toggleFavorite(id){ if (!Array.isArray(state.favorites)) state.favorites=[]; const i=state.favorites.indexOf(id); if (i>=0) { state.favorites.splice(i,1); trackEvent('fav_off/' + id, 'Убрано из избранного: ' + id); if (typeof showMarkToast === 'function') showMarkToast('Удалено из избранного'); } else { state.favorites.push(id); trackEvent('fav_on/' + id, 'В избранное: ' + id); if (typeof showMarkToast === 'function') showMarkToast('Сохранено в избранное'); } if (state.settings.vibrate && navigator.vibrate) navigator.vibrate(15); save(); }

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escAttr(s){ return esc(s).replace(/'/g, '&#39;'); }
function escNl(s){ return esc(s).replace(/\n/g,'<br>'); }
function escRich(s){ return esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\n/g,'<br>'); }

function renderTagLinks(text) {
  if (!text) return '';
  const parts = String(text).split(/(\[\[[^\]]+\]\])/g);
  
  return parts.map(part => {
    const match = part.match(/^\[\[([^\]]+)\]\]$/);
    if (match) {
      const tag = match[1].trim();
      if (ALL_TAGS.includes(tag)) {
        return `<span class="gold-link" data-tag="${escAttr(tag)}">${esc(tag)}</span>`;
      }
    }
    return esc(part);
  }).join('');
}

function transcriptionNote() { return `<div class="transcription-note"><svg class="ico ico-sm tn-icon" style="flex-shrink:0;opacity:.75"><use href="#i-info"/></svg><div>Транскрипция передаёт лишь <b>примерное произношение</b> и не отражает всех тонкостей арабского. Для правильного чтения следует изучить <b>таджвид</b>.</div></div>`; }

function addToHistory(id, n) {
  const k = todayKey();
  if (!state.history[k]) state.history[k] = { total:0, byId:{} };
  state.history[k].total += n;
  state.history[k].byId[id] = (state.history[k].byId[id] || 0) + n;
}
function usageCount(id) { let n = 0; for (const k in state.history) n += state.history[k].byId[id] || 0; return n; }
function todayCountFor(id) { const t = state.history[todayKey()]; return t && t.byId[id] ? t.byId[id] : 0; }
function saveLastRead(type, id) { state.settings.lastRead = { type: type, id: id, ts: Date.now() }; save(); }

function normalizeArabic(s) {
  return String(s || '')
    .replace(/[\u064B-\u065F\u0610-\u061A\u0670\u06D6-\u06ED\u0640\u06DD]/g, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0649/g, '\u064A')
    .replace(/\u0624/g, '\u0648')
    .replace(/\u0626/g, '\u064A')
    .replace(/\s+/g, ' ')
    .trim();
}
function parseAyahs(item) {
  if (!item) return [];
  const ar = (item.arabic||'').split('\n').map(s=>s.trim()).filter(Boolean);
  const tr  = (item.transcription||'').split('\n').map(s=>s.trim()).filter(Boolean);
  const trn = (item.translation||'').split('\n').map(s=>s.trim()).filter(Boolean);
  const isSurah = item.type === 'surah';
  let perLineNum = null;
  if (!isSurah && item.number) {
    const m = String(item.number).match(/^(\d+):(\d+)(?:-(\d+))?$/);
    if (m) {
      const surahN = m[1], start = parseInt(m[2], 10);
      perLineNum = ar.map((_, i) => surahN + ':' + (start + i));
    }
  }
  return ar.map((line, i) => ({
    num: isSurah ? (i+1) : (perLineNum ? perLineNum[i] : (item.number || '')),
    ar: line, tr: tr[i] || '', trn: trn[i] || ''
  }));
}
function perLineNumbered(item) {
  if (!item || item.type === 'surah' || !item.number) return false;
  return /^\d+:\d+(?:-\d+)?$/.test(String(item.number));
}
function ayahMarker(n) {
  var num = (typeof n === 'number') ? n : parseInt(String(n).replace(/[^\d]/g, ''), 10);
  if (!num || num < 1 || num > 999) return '';
  var ar = '٠١٢٣٤٥٦٧٨٩';
  var s = String(num).split('').map(function(d){ return ar[+d]; }).join('');
  return '\u06DD' + s;
}

function debounce(fn, wait) {
  let t = null;
  return function() {
    if (t) clearTimeout(t);
    t = setTimeout(function() { t = null; fn.apply(null, arguments); }, wait);
  };
}

function calculateStreak() {
  let streak = 0;
  let d = new Date();
  if (!state.history[todayKey()] || state.history[todayKey()].total === 0) {
    d.setDate(d.getDate() - 1);
  }
  while (true) {
    const key = dateKey(d);
    if (state.history[key] && state.history[key].total > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
function formatDateShort(key) { if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return ''; const [y,m,d] = key.split('-'); return `${parseInt(d)} ${['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'][parseInt(m)-1]} ${y}`; }
