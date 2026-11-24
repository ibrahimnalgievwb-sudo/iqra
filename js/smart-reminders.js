"use strict";

/* ============================================================
   SMART-REMINDERS.JS — Умные ненавязчивые напоминания по Сунне
   Чистый UMD-модуль: работает в браузере и в Node.js тестах.
   Все сценарии основаны исключительно на полных достоверных
   хадисах Ахли Сунна без авторских трактовок.
   ============================================================ */

(function (root) {
  var CATEGORIES = ['adhkar', 'night', 'friday', 'motivation'];

  function defaultPrefs() {
    return {
      enabled: true,
      browserNotify: false,
      quietStart: '23:00',
      quietEnd: '05:00',
      categories: {
        adhkar: true,
        night: true,
        friday: true,
        motivation: true
      },
      mutedDate: '',
      dismissed: {},
      notified: {}
    };
  }

  function _pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function formatDateKey(date) {
    var d = date instanceof Date ? date : new Date();
    return d.getFullYear() + '-' + _pad2(d.getMonth() + 1) + '-' + _pad2(d.getDate());
  }

  function _validTime(val, fallback) {
    var m = /^(\d{2}):(\d{2})$/.exec(String(val || '').trim());
    if (!m) return fallback;
    var hh = parseInt(m[1], 10);
    var mm = parseInt(m[2], 10);
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return fallback;
    return _pad2(hh) + ':' + _pad2(mm);
  }

  function _validDateMap(raw) {
    var out = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
    var keys = Object.keys(raw).slice(0, 32);
    keys.forEach(function (k) {
      if (!/^[a-zA-Z0-9_-]{1,64}$/.test(k)) return;
      var v = String(raw[k] || '');
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) out[k] = v;
    });
    return out;
  }

  function sanitizePrefs(raw) {
    var base = defaultPrefs();
    var src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    var cats = src.categories && typeof src.categories === 'object' && !Array.isArray(src.categories) ? src.categories : {};
    var outCats = {};
    CATEGORIES.forEach(function (c) {
      outCats[c] = typeof cats[c] === 'boolean' ? cats[c] : base.categories[c];
    });
    var mutedDate = /^\d{4}-\d{2}-\d{2}$/.test(String(src.mutedDate || '')) ? String(src.mutedDate) : '';
    return {
      enabled: typeof src.enabled === 'boolean' ? src.enabled : base.enabled,
      browserNotify: typeof src.browserNotify === 'boolean' ? src.browserNotify : base.browserNotify,
      quietStart: _validTime(src.quietStart, base.quietStart),
      quietEnd: _validTime(src.quietEnd, base.quietEnd),
      categories: outCats,
      mutedDate: mutedDate,
      dismissed: _validDateMap(src.dismissed),
      notified: _validDateMap(src.notified)
    };
  }

  function _parseMinutes(hhmm) {
    var m = /^(\d{2}):(\d{2})$/.exec(String(hhmm || ''));
    if (!m) return null;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  }

  function isWithinQuietHours(date, quietStart, quietEnd) {
    var sMin = _parseMinutes(quietStart);
    var eMin = _parseMinutes(quietEnd);
    if (sMin === null || eMin === null || sMin === eMin) return false;
    var d = date instanceof Date ? date : new Date();
    var nowMin = d.getHours() * 60 + d.getMinutes();
    if (sMin < eMin) {
      return nowMin >= sMin && nowMin < eMin;
    }
    return nowMin >= sMin || nowMin < eMin;
  }

  function getTimeSlot(date) {
    var d = date instanceof Date ? date : new Date();
    var h = d.getHours();
    if (h >= 5 && h < 12) return 'morning';
    if (h >= 12 && h < 16) return 'day';
    if (h >= 16 && h < 21) return 'evening';
    return 'night';
  }

  var SCENARIOS = [
    {
      id: 'friday_kahf',
      category: 'friday',
      fridayOnly: true,
      slots: ['morning', 'day', 'evening'],
      kicker: 'Пятница · Сунна дня',
      title: 'Чтение суры «Аль-Кахф» в пятницу',
      arabic: 'مَنْ قَرَأَ سُورَةَ الْكَهْفِ فِي يَوْمِ الْجُمُعَةِ، أَضَاءَ لَهُ مِنَ النُّورِ مَا بَيْنَ الْجُمُعَتَيْنِ',
      hadithText: 'Передали аль-Хаким («аль-Мустадрак», 2/399) и аль-Байхаки («ас-Сунан аль-Кубра», № 5856) со слов Абу Са‘ида аль-Худри (да будет доволен им Аллах), что Пророк (да благословит его Аллах и приветствует) сказал: «Кто прочитает суру "Аль-Кахф" (Пещера) в день пятницы, того будет освещать свет между двумя пятницами».',
      source: 'аль-Хаким (2/399), аль-Байхаки (№ 5856) · сахих (аль-Альбани, «Сахих аль-Джами‘», № 6470)',
      actionLabel: 'Читать суру «Аль-Кахф»',
      action: { type: 'read', id: 'q18' },
      secondaryLabel: null,
      secondaryAction: null,
      notifyTitle: 'Пятница · Сура «Аль-Кахф»',
      notifyBody: 'Пророк (да благословит его Аллах и приветствует) сказал: «Кто прочитает суру "Аль-Кахф" в день пятницы, того будет освещать свет между двумя пятницами» (аль-Хаким, 2/399).'
    },
    {
      id: 'friday_salawat',
      category: 'friday',
      fridayOnly: true,
      slots: ['morning', 'day', 'evening'],
      kicker: 'Пятница · Салават Пророку (да благословит его Аллах и приветствует)',
      title: 'Призывание благословений в пятницу',
      arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ',
      hadithText: 'Передал Абу Дауд (№ 1047) со слов Ауса ибн Ауса (да будет доволен им Аллах), что Посланник Аллаха (да благословит его Аллах и приветствует) сказал: «Поистине, пятница является одним из наилучших ваших дней. В этот день был сотворён Адам, и в этот день он скончался, в этот день подуют в Рог, и в этот день творения будут поражены. Так почаще же призывайте на меня благословения в этот день, ибо, поистине, ваши благословения будут представляться мне». Люди спросили: «О Посланник Аллаха, как же наши благословения будут представляться тебе, когда ты уже истлеешь?» Он сказал: «Поистине, Всемогущий и Великий Аллах сделал запретным для земли тела пророков».',
      source: 'Сунан Абу Дауда (№ 1047) · сахих (аль-Альбани)',
      actionLabel: 'Открыть тасбих',
      action: { type: 'tab', id: 'tasbih' },
      secondaryLabel: null,
      secondaryAction: null,
      notifyTitle: 'Пятница · Салават Пророку (да благословит его Аллах и приветствует)',
      notifyBody: '«Так почаще же призывайте на меня благословения в этот день, ибо, поистине, ваши благословения будут представляться мне» (Абу Дауд, № 1047).'
    },
    {
      id: 'night_sunnah',
      category: 'night',
      fridayOnly: false,
      slots: ['night'],
      kicker: 'Ночь · Перед сном',
      title: 'Ночное чтение по Сунне',
      arabic: 'إِذَا أَوَيْتَ إِلَى فِرَاشِكَ فَاقْرَأْ آيَةَ الْكُرْسِيِّ',
      hadithText: 'Передал аль-Бухари (№ 2311) со слов Абу Хурайры (да будет доволен им Аллах): «Когда ты ложишься спать, прочитай Аят аль-Курси. Поистине, с тобой всегда будет хранитель от Аллаха, и шайтан не приблизится к тебе до утра». Передали аль-Бухари (№ 5009) и Муслим (№ 807) со слов Абу Мас‘уда аль-Ансари: «Тому, кто прочитает два последних аята из суры "Аль-Бакара" ночью, этого будет достаточно». Передал ат-Тирмизи (№ 2891) со слов Абу Хурайры: «Поистине, есть в Коране сура из тридцати аятов, которая заступится за человека, пока ему не будет прощено. Это — "Благословен Тот, в Чьей Руке власть..."».',
      source: 'аль-Бухари (№ 2311, 5009), Муслим (№ 807), ат-Тирмизи (№ 2891)',
      actionLabel: 'Открыть ночное чтение',
      action: { type: 'night', id: '0' },
      secondaryLabel: 'Сура «Аль-Мульк»',
      secondaryAction: { type: 'read', id: 'q67' },
      notifyTitle: 'Ночное чтение перед сном',
      notifyBody: 'Аят аль-Курси, два последних аята «Аль-Бакары» и сура «Аль-Мульк» (аль-Бухари № 2311, № 5009; ат-Тирмизи № 2891).'
    },
    {
      id: 'morning_tawhid',
      category: 'adhkar',
      fridayOnly: false,
      slots: ['morning'],
      kicker: 'Утро · Зикр и тасбих',
      title: 'Слова единобожия и защита на весь день',
      arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
      hadithText: 'Передали аль-Бухари (№ 3293, № 6403) и Муслим (№ 2691) со слов Абу Хурайры (да будет доволен им Аллах), что Посланник Аллаха (да благословит его Аллах и приветствует) сказал: «Кто скажет: "Нет бога, кроме одного лишь Аллаха, у Которого нет сотоварища, Ему принадлежит власть, Ему хвала, и Он всё может" сто раз в день, тому это запишется как освобождение десяти рабов, запишется ему сто благих деяний, будут стёрты его сто прегрешений, и это будет для него защитой от шайтана в этот день до самого вечера, и никто не совершит ничего лучше того, что совершил он, кроме человека, который сделал больше этого».',
      source: 'Сахих аль-Бухари (№ 3293, № 6403), Сахих Муслим (№ 2691) · сахих',
      actionLabel: 'Перейти к тасбиху',
      action: { type: 'counter', id: 'tawhid' },
      secondaryLabel: 'К хадису',
      secondaryAction: { type: 'hadith', id: 'h_tawhid' },
      notifyTitle: 'Утреннее поминание · Таухид',
      notifyBody: '«Кто скажет: "Ля иляха илля-Ллаху вахдаху ля шарика ляху..." сто раз в день, это будет для него защитой от шайтана до самого вечера» (аль-Бухари № 3293, Муслим № 2691).'
    },
    {
      id: 'morning_sayyid',
      category: 'adhkar',
      fridayOnly: false,
      slots: ['morning'],
      kicker: 'Утро · Дуа и покаяние',
      title: 'Саййидуль-истигфар (Господин истигфара)',
      arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ',
      hadithText: 'Передал аль-Бухари (№ 6306) со слов Шаддада ибн Ауса (да будет доволен им Аллах), что Пророк (да благословит его Аллах и приветствует) сказал: «Господин истигфара — это когда раб говорит: "О Аллах, Ты — мой Господь, нет бога, кроме Тебя, Ты создал меня, и я — Твой раб..." Тот, кто произнесёт эти слова днём, будучи убеждённым в них, и умрёт в тот же день до наступления вечера, — станет из числа обитателей Рая. И тот, кто произнесёт их ночью, будучи убеждённым в них, и умрёт до наступления утра, — станет из числа обитателей Рая».',
      source: 'Сахих аль-Бухари (№ 6306) · сахих',
      actionLabel: 'Открыть дуа',
      action: { type: 'dua', id: 'dua_sayyidul_istighfar' },
      secondaryLabel: null,
      secondaryAction: null,
      notifyTitle: 'Утреннее дуа · Саййидуль-истигфар',
      notifyBody: '«Тот, кто произнесёт эти слова днём, будучи убеждённым в них, и умрёт до вечера — станет из числа обитателей Рая» (аль-Бухари № 6306).'
    },
    {
      id: 'evening_muawwizat',
      category: 'adhkar',
      fridayOnly: false,
      slots: ['evening'],
      kicker: 'Вечер · Защитные суры',
      title: 'Чтение «Аль-Ихлас», «Аль-Фаляк» и «Ан-Нас»',
      arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ · قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ · قُلْ أَعُوذُ بِرَبِّ النَّاسِ',
      hadithText: 'Передали Абу Дауд (№ 5082) и ат-Тирмизи (№ 3575) со слов ‘Абдуллаха ибн Хубайба (да будет доволен им Аллах), что Посланник Аллаха (да благословит его Аллах и приветствует) сказал: «Читай "Скажи: Он — Аллах Единый..." («Аль-Ихлас») и две защищающие суры («Аль-Фаляк» и «Ан-Нас») вечером и утром по три раза, и этого будет достаточно тебе от всего».',
      source: 'Сунан Абу Дауда (№ 5082), ат-Тирмизи (№ 3575) · хасан сахих',
      actionLabel: 'Читать «Аль-Ихлас»',
      action: { type: 'read', id: 'q112' },
      secondaryLabel: '«Аль-Фаляк»',
      secondaryAction: { type: 'read', id: 'q113' },
      notifyTitle: 'Вечернее чтение · Защитные суры',
      notifyBody: '«Читай суру "Аль-Ихлас", "Аль-Фаляк" и "Ан-Нас" вечером и утром по три раза, и этого будет достаточно тебе от всего» (Абу Дауд № 5082).'
    },
    {
      id: 'evening_istighfar',
      category: 'adhkar',
      fridayOnly: false,
      slots: ['evening'],
      kicker: 'Вечер · Зикр и покаяние',
      title: 'Просьба о прощении и восхваление Аллаха',
      arabic: 'أَسْتَغْفِرُ اللَّهَ · سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
      hadithText: 'Передал аль-Бухари (№ 6307) от Абу Хурайры (да будет доволен им Аллах): «Я слышал, как Посланник Аллаха (да благословит его Аллах и приветствует) говорил: "Клянусь Аллахом, поистине, я прошу прощения у Аллаха и каюсь перед Ним более семидесяти раз в день"». И передал Муслим (№ 2692) со слов Абу Хурайры (да будет доволен им Аллах), что Посланник Аллаха (да благословит его Аллах и приветствует) сказал: «Кто скажет утром и вечером по сто раз: "Субхана-Ллахи ва бихамдихи" (Слава Аллаху и хвала Ему), в День воскресения не придёт никто с лучшим деянием, чем он, кроме того, кто скажет столько же или больше».',
      source: 'Сахих аль-Бухари (№ 6307), Сахих Муслим (№ 2692) · сахих',
      actionLabel: 'Открыть истигфар',
      action: { type: 'counter', id: 'istighfar' },
      secondaryLabel: null,
      secondaryAction: null,
      notifyTitle: 'Вечернее поминание · Истигфар',
      notifyBody: '«Клянусь Аллахом, я прошу прощения у Аллаха и каюсь перед Ним более семидесяти раз в день» (аль-Бухари № 6307).'
    },
    {
      id: 'quran_reward_letters',
      category: 'motivation',
      fridayOnly: false,
      slots: ['morning', 'day', 'evening', 'night'],
      kicker: 'Хадис · Награда за Коран',
      title: 'Десять наград за каждую букву Корана',
      arabic: 'مَنْ قَرَأَ حَرْفًا مِنْ كِتَابِ اللَّهِ فَلَهُ بِهِ حَسَنَةٌ، وَالْحَسَنَةُ بِعَشْرِ أَمْثَالِهَا',
      hadithText: 'Передал ат-Тирмизи (№ 2910) со слов ‘Абдуллаха ибн Мас‘уда (да будет доволен им Аллах), что Посланник Аллаха (да благословит его Аллах и приветствует) сказал: «Тому, кто прочтёт хотя бы одну букву из Книги Аллаха, запишется одно доброе дело, а за каждое доброе дело воздастся десятикратно. И я не говорю, что "Алиф, Лям, Мим" — это одна буква, нет: "Алиф" — буква, "Лям" — буква и "Мим" — буква».',
      source: 'Сунан ат-Тирмизи (№ 2910) · хасан сахих (аль-Альбани, «ас-Сильсиля ас-сахиха», № 3327)',
      actionLabel: 'Открыть Коран',
      action: { type: 'tab', id: 'quran' },
      secondaryLabel: null,
      secondaryAction: null,
      notifyTitle: 'Награда за чтение Корана',
      notifyBody: '«Тому, кто прочтёт хотя бы одну букву из Книги Аллаха, запишется одно доброе дело, а за каждое доброе дело воздастся десятикратно» (ат-Тирмизи № 2910).'
    },
    {
      id: 'quran_reward_intercession',
      category: 'motivation',
      fridayOnly: false,
      slots: ['morning', 'day', 'evening'],
      kicker: 'Хадис · Заступничество Корана',
      title: 'Коран заступится за читающего его',
      arabic: 'اقْرَءُوا الْقُرْآنَ فَإِنَّهُ يَأْتِي يَوْمَ الْقِيَامَةِ شَفِيعًا لِأَصْحَابِهِ',
      hadithText: 'Передал Муслим (№ 804) со слов Абу Умамы аль-Бахили (да будет доволен им Аллах), что он слышал, как Посланник Аллаха (да благословит его Аллах и приветствует) говорил: «Читайте Коран, потому что в День воскрешения он придёт и будет заступаться за тех, кто читал его. Читайте две сияющие суры — суру "Аль-Бакара" и суру "Али ‘Имран", потому что в День воскрешения они явятся, словно два облака, или как два навеса, или две стаи птиц, выстроившихся рядами, и будут защищать тех, кто читал их».',
      source: 'Сахих Муслим (№ 804) · сахих',
      actionLabel: 'Читать «Аль-Бакара»',
      action: { type: 'read', id: 'q2' },
      secondaryLabel: '«Али Имран»',
      secondaryAction: { type: 'read', id: 'q3' },
      notifyTitle: 'Читайте Коран',
      notifyBody: '«Читайте Коран, потому что в День воскрешения он придёт и будет заступаться за тех, кто читал его» (Муслим № 804).'
    },
    {
      id: 'dhikr_reward_scales',
      category: 'motivation',
      fridayOnly: false,
      slots: ['morning', 'day', 'evening'],
      kicker: 'Хадис · Награда за зикр',
      title: 'Два слова, тяжёлые на Весах',
      arabic: 'كَلِمَتَانِ خَفِيفَتَانِ عَلَى اللِّسَانِ، ثَقِيلَتَانِ فِي الْمِيزَانِ، حَبِيبَتَانِ إِلَى الرَّحْمَنِ: سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
      hadithText: 'Передали аль-Бухари (№ 6406) и Муслим (№ 2694) со слов Абу Хурайры (да будет доволен им Аллах), что Посланник Аллаха (да благословит его Аллах и приветствует) сказал: «Есть два слова, которые любит Милостивый, и они легки для языка, а на Весах они будут тяжелы: "Субхана-Ллахи ва бихамдихи, Субхана-Ллахиль-‘Азым" (Слава Аллаху и хвала Ему, Слава Аллаху Великому)».',
      source: 'Сахих аль-Бухари (№ 6406), Сахих Муслим (№ 2694) · сахих',
      actionLabel: 'Перейти к тасбиху',
      action: { type: 'counter', id: 'u1' },
      secondaryLabel: null,
      secondaryAction: null,
      notifyTitle: 'Два слова, любимые Милостивым',
      notifyBody: '«Субхана-Ллахи ва бихамдихи, Субхана-Ллахиль-‘Азым — легки для языка и тяжелы на Весах» (аль-Бухари № 6406, Муслим № 2694).'
    }
  ];

  function getScenarioById(id) {
    return SCENARIOS.find(function (s) { return s.id === id; }) || null;
  }

  function _dayOfYear(date) {
    var start = new Date(date.getFullYear(), 0, 0);
    return Math.floor((date - start) / 86400000);
  }

  function listEligibleScenarios(ctx) {
    var c = ctx && typeof ctx === 'object' ? ctx : {};
    var now = c.now instanceof Date ? c.now : new Date();
    var prefs = sanitizePrefs(c.prefs);
    if (!prefs.enabled) return [];
    if (c.onboarded === false) return [];
    var today = formatDateKey(now);
    if (prefs.mutedDate === today) return [];
    if (isWithinQuietHours(now, prefs.quietStart, prefs.quietEnd)) return [];

    var slot = getTimeSlot(now);
    var isFriday = now.getDay() === 5;
    var quranLearned = c.quranLearned && typeof c.quranLearned === 'object' ? c.quranLearned : {};
    var todayTotal = Number(c.todayTotal || 0);
    var dailyGoal = Number(c.dailyGoal || 0);
    var goalCompletedToday = dailyGoal > 0 && todayTotal >= dailyGoal;
    var kahfLearnedToday = !!(quranLearned.q18 && quranLearned.q18.learned && quranLearned.q18.learnedAt === today);

    var candidates = [];
    // 1. Пятница (наивысший приоритет, пока не скрыто / не выполнено)
    if (isFriday && prefs.categories.friday) {
      if (!kahfLearnedToday) candidates.push(getScenarioById('friday_kahf'));
      candidates.push(getScenarioById('friday_salawat'));
    }

    // 2. Время суток: ночь / утро / вечер
    if (slot === 'night' && prefs.categories.night) {
      candidates.push(getScenarioById('night_sunnah'));
    } else if (slot === 'morning' && prefs.categories.adhkar) {
      if (!goalCompletedToday) candidates.push(getScenarioById('morning_tawhid'));
      candidates.push(getScenarioById('morning_sayyid'));
    } else if (slot === 'evening' && prefs.categories.adhkar) {
      candidates.push(getScenarioById('evening_muawwizat'));
      if (!goalCompletedToday) candidates.push(getScenarioById('evening_istighfar'));
    }

    // 3. Мотивационные достоверные хадисы о Коране и зикре (ротация по дню)
    if (prefs.categories.motivation) {
      var motIds = ['quran_reward_letters', 'quran_reward_intercession', 'dhikr_reward_scales'];
      var shift = _dayOfYear(now) % motIds.length;
      for (var i = 0; i < motIds.length; i++) {
        var sc = getScenarioById(motIds[(shift + i) % motIds.length]);
        if (sc && sc.slots.indexOf(slot) !== -1) candidates.push(sc);
      }
      // На случай ночи, если ночные отключены: хотя бы один хадис о Коране
      if (slot === 'night') {
        var qLetters = getScenarioById('quran_reward_letters');
        if (candidates.indexOf(qLetters) === -1) candidates.push(qLetters);
      }
    }

    var seen = new Set();
    return candidates.filter(function (sc) {
      if (!sc || seen.has(sc.id)) return false;
      seen.add(sc.id);
      if (prefs.dismissed && prefs.dismissed[sc.id] === today) return false;
      return true;
    });
  }

  function selectActiveReminder(ctx) {
    var eligible = listEligibleScenarios(ctx);
    if (!eligible.length) return null;
    var offset = Number(ctx && ctx.cycleOffset ? ctx.cycleOffset : 0);
    if (!Number.isFinite(offset) || offset < 0) offset = 0;
    return eligible[offset % eligible.length] || eligible[0];
  }

  function shouldSendBrowserNotification(scenario, ctx) {
    if (!scenario) return false;
    var c = ctx && typeof ctx === 'object' ? ctx : {};
    var now = c.now instanceof Date ? c.now : new Date();
    var prefs = sanitizePrefs(c.prefs);
    if (!prefs.enabled || !prefs.browserNotify) return false;
    if (c.onboarded === false) return false;
    var today = formatDateKey(now);
    if (prefs.mutedDate === today) return false;
    if (isWithinQuietHours(now, prefs.quietStart, prefs.quietEnd)) return false;
    if (prefs.dismissed && prefs.dismissed[scenario.id] === today) return false;
    if (prefs.notified && prefs.notified[scenario.id] === today) return false;
    return true;
  }

  var api = {
    CATEGORIES: CATEGORIES,
    SCENARIOS: SCENARIOS,
    defaultPrefs: defaultPrefs,
    sanitizePrefs: sanitizePrefs,
    formatDateKey: formatDateKey,
    isWithinQuietHours: isWithinQuietHours,
    getTimeSlot: getTimeSlot,
    getScenarioById: getScenarioById,
    listEligibleScenarios: listEligibleScenarios,
    selectActiveReminder: selectActiveReminder,
    shouldSendBrowserNotification: shouldSendBrowserNotification
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.IqraSmartReminders = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
