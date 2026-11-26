"use strict";

/* ============================================================
   ARCHITECTURE.JS — Модульная архитектура под развитие «Икра» и «Икра+»
   Чистый UMD-модуль: работает и в браузере, и в Node.js тестах.
   Гарантия: весь базовый Коран (114 сур), таджвид, тафсиры, хадисы,
   дуа, тасбих, Умная книга и базовые календарь/синхронизация — навсегда бесплатны.
   ============================================================ */

(function (root) {
  var TIERS = {
    FREE: 'free',
    IQRA_PLUS: 'iqra_plus',
    ACADEMY: 'academy'
  };

  var CAPABILITIES = [
    // Бесплатно навсегда (Free Forever)
    {
      id: 'quran_full',
      tier: TIERS.FREE,
      available: true,
      title: 'Весь Священный Коран (114 сур)',
      summary: 'Мединский мусхаф (Усмани) и перевод смыслов Э. Кулиева офлайн и бесплатно.'
    },
    {
      id: 'tajweed_offline',
      tier: TIERS.FREE,
      available: true,
      title: 'Офлайн-таджвид и справка по правилам',
      summary: 'Цветовая разметка правил Хафс ан Асим и разбор каждого аята без сети.'
    },
    {
      id: 'tafsir_hadith',
      tier: TIERS.FREE,
      available: true,
      title: 'Тафсиры, хадисы, дуа и рукия',
      summary: 'Проверенные толкования аятов, достоверные предания, утренние и вечерние азкары.'
    },
    {
      id: 'smart_book',
      tier: TIERS.FREE,
      available: true,
      title: 'Умная книга («Путь»)',
      summary: 'Смысловые связи между аятами, хадисами, дуа, темами и состояниями души.'
    },
    {
      id: 'tasbih_dua',
      tier: TIERS.FREE,
      available: true,
      title: 'Тасбих, закладки и избранное',
      summary: 'Счётчик поминаний, дневные цели, закладки на аятах и прогресс чтения.'
    },
    {
      id: 'prayer_hijri',
      tier: TIERS.FREE,
      available: true,
      title: 'Хиджра и расписание намаза',
      summary: 'Исламский календарь и подготовка расчётных методов времени молитвы.'
    },
    {
      id: 'sync_basic',
      tier: TIERS.FREE,
      available: true,
      title: 'Локальный бэкап и базовая синхронизация',
      summary: 'Экспорт/импорт прогресса в JSON без передачи или дублирования священных текстов.'
    },

    // Будущий план Икра+ (опциональные личные инструменты)
    {
      id: 'arabic_tajweed_course',
      tier: TIERS.IQRA_PLUS,
      available: false,
      title: 'Обучение чтению Корана и арабскому языку с нуля',
      summary: 'Пошаговый интерактивный курс с азов: алфавит, соединение букв, огласовки, махаридж и практика таджвида (отдельно от бесплатной подсветки таджвида в Коране).'
    },
    {
      id: 'hifz',
      tier: TIERS.IQRA_PLUS,
      available: false,
      title: 'Тренер заучивания (Хифз)',
      summary: 'Карточки интервального повторения, статистика запоминания аятов и персональные планы по заучиванию.'
    },
    {
      id: 'planner',
      tier: TIERS.IQRA_PLUS,
      available: false,
      title: 'Персональный планировщик (Planner)',
      summary: 'Гибкое расписание чтения Корана по джузам и дням, трекинг привычек чтения и зикров без давления и штрафных серий.'
    },
    {
      id: 'qada_tracker',
      tier: TIERS.IQRA_PLUS,
      available: false,
      title: 'Интеллектуальный календарь и трекер долгов (Када)',
      summary: 'Учёт пропущенных намазов (Фаджр, Зухр, Аср, Магриб, Иша) и дней поста с планом восполнения на месяц и импортом/экспортом.'
    },
    {
      id: 'sunnah_fasts',
      tier: TIERS.IQRA_PLUS,
      available: false,
      title: 'Посты Сунны и исламские памятные даты',
      summary: 'Напоминания и расчёт серединных лунных дней (Айям аль-Бид — 13, 14, 15 числа), постов по понедельникам и четвергам, дней Арафа, Ашура и праздников со справками.'
    },
    {
      id: 'prophets_encyclopedia',
      tier: TIERS.IQRA_PLUS,
      available: false,
      title: 'Энциклопедия пророков и аятов',
      summary: 'Сравнительные таблицы пророков (Ислам и Библия), каталог аятов с тафсирами (классический тафсир Ибн Касира и смысловой перевод Э. Кулиева) и хадисов с оценкой достоверности (сахих, хасан, даиф).'
    },
    {
      id: 'diary',
      tier: TIERS.IQRA_PLUS,
      available: false,
      title: 'Личный духовный дневник',
      summary: 'Приватные заметки и размышления над аятами и дуа с личным архивом.'
    },
    {
      id: 'extended_progress',
      tier: TIERS.IQRA_PLUS,
      available: false,
      title: 'Расширенный прогресс и аналитика чтения',
      summary: 'Глубокая аналитика, графики активности и детальные срезы по сурам и темам без геймификации.'
    },
    {
      id: 'cloud_sync',
      tier: TIERS.IQRA_PLUS,
      available: false,
      title: 'Облачная синхронизация и расширенный бэкап',
      summary: 'Расширенные опции зашифрованного резервного копирования и синхронизации данных между устройствами (базовая синхронизация остаётся бесплатной).'
    },

    // Отложено (пока не запускается в интерфейсе)
    {
      id: 'academy',
      tier: TIERS.ACADEMY,
      available: false,
      title: 'Академия Корана',
      summary: 'Углублённые учебные модули (в проработке).'
    }
  ];

  var CAPABILITY_MAP = {};
  CAPABILITIES.forEach(function (c) { CAPABILITY_MAP[c.id] = c; });

  function getCapability(capId) {
    return CAPABILITY_MAP[capId] || null;
  }

  function listCapabilities(tierFilter) {
    return CAPABILITIES.filter(function (c) {
      return !tierFilter || c.tier === tierFilter;
    }).map(function (c) { return Object.assign({}, c); });
  }

  function hasCapability(entitlement, capId) {
    var cap = getCapability(capId);
    if (!cap) return false;
    if (cap.tier === TIERS.FREE) return true; // Гарантия Free Forever
    if (cap.tier === TIERS.ACADEMY) return false; // Академия отложена
    if (!entitlement || typeof entitlement !== 'object') return false;
    if (entitlement.verifiedBy !== 'server') return false;
    if (entitlement.active !== true) return false;
    if (entitlement.tier !== TIERS.IQRA_PLUS) return false;
    if (entitlement.expiresAt && Number(entitlement.expiresAt) <= Date.now()) return false;
    return true;
  }

  var IqraEntitlements = {
    createFreeEntitlement: function (reason) {
      return {
        tier: TIERS.FREE,
        active: true,
        verifiedBy: 'default',
        source: reason || 'free_forever',
        expiresAt: null
      };
    },
    parseServerReceipt: function (raw, nowMs) {
      var now = typeof nowMs === 'number' ? nowMs : Date.now();
      if (!raw || typeof raw !== 'object') {
        return IqraEntitlements.createFreeEntitlement('invalid_payload');
      }
      // Клиентские булевы флаги без серверной подписи никогда не открывают платный план
      if (raw.verifiedBy !== 'server' || typeof raw.signature !== 'string' || raw.signature.trim().length < 16) {
        return IqraEntitlements.createFreeEntitlement('unverified_client_rejected');
      }
      if (raw.active !== true || raw.tier !== TIERS.IQRA_PLUS) {
        return IqraEntitlements.createFreeEntitlement('inactive_or_free');
      }
      var exp = raw.expiresAt != null ? Number(raw.expiresAt) : null;
      if (exp !== null && (!Number.isFinite(exp) || exp <= now)) {
        return IqraEntitlements.createFreeEntitlement('expired_receipt');
      }
      return {
        tier: TIERS.IQRA_PLUS,
        active: true,
        verifiedBy: 'server',
        receiptId: typeof raw.receiptId === 'string' ? raw.receiptId : '',
        expiresAt: exp,
        source: 'server_verified'
      };
    }
  };

  function _pickLatestTimestamped(a, b) {
    var aTs = a && typeof a.ts === 'number' ? a.ts : 0;
    var bTs = b && typeof b.ts === 'number' ? b.ts : 0;
    if (bTs > aTs) return Object.assign({}, b);
    if (aTs > 0 || a) return Object.assign({}, a);
    return null;
  }

  var IqraSync = {
    SNAPSHOT_SCHEMA: 3,
    extractUserSnapshot: function (appState) {
      var st = appState && typeof appState === 'object' ? appState : {};
      var progress = {};
      if (st.quranProgress && typeof st.quranProgress === 'object') {
        Object.keys(st.quranProgress).forEach(function (id) {
          var p = st.quranProgress[id];
          if (p && p.learned) progress[id] = { learned: true, learnedAt: String(p.learnedAt || '') };
        });
      }
      if (Array.isArray(st.quran)) {
        st.quran.forEach(function (q) {
          if (q && q.id && q.learned) {
            progress[q.id] = { learned: true, learnedAt: String(q.learnedAt || '') };
          }
        });
      }
      var s = st.settings && typeof st.settings === 'object' ? st.settings : {};
      var customTasbihMap = new Map();
      if (Array.isArray(st.customTasbihs)) {
        st.customTasbihs.forEach(function (t) {
          if (t && t.id) customTasbihMap.set(t.id, Object.assign({}, t));
        });
      }
      if (Array.isArray(st.tasbihs)) {
        st.tasbihs.forEach(function (t) {
          if (t && t.id && t.custom === true) customTasbihMap.set(t.id, Object.assign({}, t));
        });
      }
      var customTasbihs = Array.from(customTasbihMap.values());
      return {
        schema: IqraSync.SNAPSHOT_SCHEMA,
        updatedAt: Number(st.updatedAt || Date.now()),
        quranProgress: progress,
        favorites: Array.isArray(st.favorites) ? st.favorites.slice() : [],
        bookmarks: Array.isArray(st.bookmarks) ? st.bookmarks.map(function (b) { return Object.assign({}, b); }) : [],
        history: st.history && typeof st.history === 'object' ? JSON.parse(JSON.stringify(st.history)) : {},
        customTasbihs: customTasbihs,
        settings: {
          theme: s.theme || 'auto',
          arSize: typeof s.arSize === 'number' ? s.arSize : 1,
          dailyGoal: typeof s.dailyGoal === 'number' ? s.dailyGoal : 100,
          autoNext: typeof s.autoNext === 'boolean' ? s.autoNext : true,
          wakeLock: typeof s.wakeLock === 'boolean' ? s.wakeLock : true,
          vibrate: typeof s.vibrate === 'boolean' ? s.vibrate : true,
          goalNotify: typeof s.goalNotify === 'boolean' ? s.goalNotify : false,
          tajweedMode: !!s.tajweedMode,
          lastRead: s.lastRead ? Object.assign({}, s.lastRead) : null,
          readScrolls: Object.assign({}, s.readScrolls || {}),
          readAyah: Object.assign({}, s.readAyah || {}),
          seenGuides: Object.assign({}, s.seenGuides || {}),
          prayerPrefs: Object.assign({}, s.prayerPrefs || {}),
          readerPrefs: Object.assign({}, s.readerPrefs || {}),
          syncPrefs: Object.assign({}, s.syncPrefs || {}),
          smartReminders: s.smartReminders && typeof s.smartReminders === 'object' ? Object.assign({}, s.smartReminders) : null,
          updatedAt: Number(s.updatedAt || st.updatedAt || 0)
        }
      };
    },
    mergeUserSnapshots: function (localSnap, remoteSnap) {
      var a = IqraSync.extractUserSnapshot(localSnap || {});
      var b = IqraSync.extractUserSnapshot(remoteSnap || {});

      // 1. quranProgress: union (OR on learned, latest learnedAt)
      var progress = {};
      [a.quranProgress, b.quranProgress].forEach(function (src) {
        Object.keys(src || {}).forEach(function (id) {
          var item = src[id];
          if (!item || !item.learned) return;
          var prev = progress[id];
          if (!prev) {
            progress[id] = { learned: true, learnedAt: String(item.learnedAt || '') };
          } else {
            var nextDate = (item.learnedAt || '') > (prev.learnedAt || '') ? item.learnedAt : prev.learnedAt;
            progress[id] = { learned: true, learnedAt: String(nextDate || '') };
          }
        });
      });

      // 2. favorites: union keeping deterministic order
      var favSet = new Set();
      var favorites = [];
      (a.favorites || []).concat(b.favorites || []).forEach(function (id) {
        if (typeof id === 'string' && id && !favSet.has(id)) {
          favSet.add(id);
          favorites.push(id);
        }
      });

      // 3. bookmarks: dedupe by quranId + ayahIdx (latest ts wins)
      var bmByKey = new Map();
      (a.bookmarks || []).concat(b.bookmarks || []).forEach(function (bm) {
        if (!bm || !bm.quranId) return;
        var idx = Number.isFinite(Number(bm.ayahIdx)) ? Number(bm.ayahIdx) : 0;
        var key = bm.quranId + ':' + idx;
        var prev = bmByKey.get(key);
        if (!prev || Number(bm.ts || 0) >= Number(prev.ts || 0)) {
          bmByKey.set(key, Object.assign({}, bm, { ayahIdx: idx }));
        }
      });
      var bookmarks = Array.from(bmByKey.values()).sort(function (x, y) {
        return Number(y.ts || 0) - Number(x.ts || 0);
      });

      // 4. history: per day, Math.max per tasbih id + max total
      var history = {};
      var allDays = new Set(Object.keys(a.history || {}).concat(Object.keys(b.history || {})));
      allDays.forEach(function (day) {
        var da = a.history[day] || {};
        var db = b.history[day] || {};
        var byId = {};
        var ids = new Set(Object.keys(da.byId || {}).concat(Object.keys(db.byId || {})));
        var sumById = 0;
        ids.forEach(function (tid) {
          var v = Math.max(Number((da.byId && da.byId[tid]) || 0), Number((db.byId && db.byId[tid]) || 0));
          if (v > 0) {
            byId[tid] = v;
            sumById += v;
          }
        });
        var maxTotal = Math.max(Number(da.total || 0), Number(db.total || 0), sumById);
        if (maxTotal > 0 || Object.keys(byId).length > 0) {
          history[day] = { total: maxTotal, byId: byId };
        }
      });

      // 5. customTasbihs: union by id
      var customMap = new Map();
      (a.customTasbihs || []).concat(b.customTasbihs || []).forEach(function (t) {
        if (!t || !t.id) return;
        var prev = customMap.get(t.id);
        var curT = Number(t.current != null ? t.current : (t.count || 0));
        var curP = prev ? Number(prev.current != null ? prev.current : (prev.count || 0)) : 0;
        var scoreT = Number(t.cycles || 0) * Math.max(1, Number(t.target || 33)) + curT;
        var scoreP = prev ? (Number(prev.cycles || 0) * Math.max(1, Number(prev.target || 33)) + curP) : -1;
        if (!prev || scoreT >= scoreP) customMap.set(t.id, Object.assign({}, t));
      });

      // 6. settings: LWW on scalars, union on seenGuides, max on scrolls/ayah
      var sa = a.settings || {};
      var sb = b.settings || {};
      var newer = Number(sb.updatedAt || 0) > Number(sa.updatedAt || 0) ? sb : sa;
      var seenGuides = Object.assign({}, sa.seenGuides || {}, sb.seenGuides || {});
      var readAyah = Object.assign({}, sa.readAyah || {});
      Object.keys(sb.readAyah || {}).forEach(function (k) {
        readAyah[k] = Math.max(Number(readAyah[k] || 0), Number(sb.readAyah[k] || 0));
      });
      var readScrolls = Object.assign({}, sa.readScrolls || {});
      Object.keys(sb.readScrolls || {}).forEach(function (k) {
        readScrolls[k] = Math.max(Number(readScrolls[k] || 0), Number(sb.readScrolls[k] || 0));
      });

      return {
        schema: IqraSync.SNAPSHOT_SCHEMA,
        updatedAt: Math.max(a.updatedAt || 0, b.updatedAt || 0, Date.now()),
        quranProgress: progress,
        favorites: favorites,
        bookmarks: bookmarks,
        history: history,
        customTasbihs: Array.from(customMap.values()),
        settings: Object.assign({}, newer, {
          lastRead: _pickLatestTimestamped(sa.lastRead, sb.lastRead),
          seenGuides: seenGuides,
          readAyah: readAyah,
          readScrolls: readScrolls,
          prayerPrefs: Object.assign({}, sa.prayerPrefs || {}, sb.prayerPrefs || {}),
          readerPrefs: Object.assign({}, sa.readerPrefs || {}, sb.readerPrefs || {}),
          syncPrefs: Object.assign({}, sa.syncPrefs || {}, sb.syncPrefs || {}),
          smartReminders: (newer && newer.smartReminders) ? Object.assign({}, newer.smartReminders) : (sa.smartReminders || sb.smartReminders || null)
        })
      };
    },
    createLocalAdapter: function (storageApi, storageKey) {
      var key = storageKey || 'iqra_sync_remote_stub';
      return {
        id: 'local_snapshot',
        available: true,
        push: function (snapshot) {
          var payload = IqraSync.extractUserSnapshot(snapshot);
          if (storageApi && typeof storageApi.setItem === 'function') {
            storageApi.setItem(key, JSON.stringify(payload));
          }
          return Promise.resolve({ ok: true, updatedAt: payload.updatedAt });
        },
        pull: function () {
          if (!storageApi || typeof storageApi.getItem !== 'function') return Promise.resolve(null);
          try {
            var raw = storageApi.getItem(key);
            return Promise.resolve(raw ? JSON.parse(raw) : null);
          } catch (e) {
            return Promise.resolve(null);
          }
        }
      };
    }
  };

  var IqraPrayer = {
    METHODS: [
      { id: 'dum_rf', title: 'ДУМ РФ / Россия (стандарт)', fajrAngle: 18, ishaAngle: 15, summary: 'Адаптированный расчёт для средних широт России и СНГ.' },
      { id: 'mwl', title: 'Всемирная исламская лига (MWL)', fajrAngle: 18, ishaAngle: 17, summary: 'Классический международный стандарт (Фаджр 18°, Иша 17°).' },
      { id: 'umm_al_qura', title: 'Умм аль-Кура (Мекка)', fajrAngle: 18.5, ishaIntervalMin: 90, summary: 'Используется в Королевстве Саудовская Аравия.' },
      { id: 'egyptian', title: 'Египетское управление (Egyptian)', fajrAngle: 19.5, ishaAngle: 17.5, summary: 'Распространён на Ближнем Востоке и в Северной Африке.' },
      { id: 'karachi', title: 'Университет Карачи', fajrAngle: 18, ishaAngle: 18, summary: 'Южноазиатская традиция расчёта сумерков.' },
      { id: 'isna', title: 'ISNA (Северная Америка)', fajrAngle: 15, ishaAngle: 15, summary: 'Умеренные углы 15° для северных городов.' }
    ],
    ASR_MADHHABS: [
      { id: 'shafii', title: 'Джумхур (Шафии / Малики / Ханбали)', factor: 1 },
      { id: 'hanafi', title: 'Ханафитский мазхаб', factor: 2 }
    ],
    getMethod: function (methodId) {
      return IqraPrayer.METHODS.find(function (m) { return m.id === methodId; }) || IqraPrayer.METHODS[0];
    },
    getAsrMadhhab: function (madhhabId) {
      return IqraPrayer.ASR_MADHHABS.find(function (m) { return m.id === madhhabId; }) || IqraPrayer.ASR_MADHHABS[0];
    },
    normalizeLocation: function (raw) {
      var loc = raw && typeof raw === 'object' ? raw : {};
      var lat = Number(loc.lat);
      var lng = Number(loc.lng);
      var validCoords = Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
      return {
        city: typeof loc.city === 'string' ? loc.city.trim().slice(0, 80) : '',
        lat: validCoords ? lat : null,
        lng: validCoords ? lng : null,
        timezone: typeof loc.timezone === 'string' ? loc.timezone.trim().slice(0, 64) : '',
        method: IqraPrayer.getMethod(loc.method).id,
        asrMadhhab: IqraPrayer.getAsrMadhhab(loc.asrMadhhab).id
      };
    }
  };

  var SCREEN_GUIDES = {
    dashboard: {
      id: 'dashboard',
      title: 'Главная панель дня',
      items: [
        'Секция «На сегодня» подбирает утренние, вечерние или ночные азкары и чтение по времени суток.',
        'Нажмите «Продолжить чтение», чтобы вернуться ровно к тому месту и аяту, на котором остановились.',
        'Счётчик зикров и отметка выученных сур сохраняются локально и никогда не обнуляются при обновлении.'
      ]
    },
    quran: {
      id: 'quran',
      title: 'Священный Коран (114 сур)',
      items: [
        'В библиотеке доступны все 114 сур (Мединский мусхаф, перевод смыслов Э. Кулиева) и подборки для защиты (рукья).',
        'Поиск понимает не только название или номер суры, но и точную ссылку вроде «2:255» или «18:10».',
        'Нажмите на суру для разбора с тафсиром и перекрёстными связями или перейдите сразу в «Режим чтения».'
      ]
    },
    'read-mode': {
      id: 'read-mode',
      title: 'Режим чтения и таджвид',
      items: [
        'Цветовая подсветка правил таджвида Хафс ан Асим работает полностью офлайн. Нажмите кнопку «Таджвид» под аятом для разбора правил.',
        'Под аятом доступны тафсир Ибн Касира (для суры «Аль-Фатиха») и перекрёстные связи, а в шапке можно добавить закладку.',
        'Для длинных сур используйте быстрый переход к нужному номеру аята в верхней панели.'
      ]
    },
    path: {
      id: 'path',
      title: 'Умная книга («Путь»)',
      items: [
        'Ищите по жизненной ситуации, состоянию сердца (тревога, терпение, благодарность) или ключевому слову.',
        'Каждая карточка показывает проверенные связи между аятами, достоверными хадисами, дуа и тафсиром.',
        'Переключайте вкладки «Все», «Темы», «Состояния» и «По слову» для точного подбора.'
      ]
    },
    library: {
      id: 'library',
      title: 'Дуа, хадисы и рукья',
      items: [
        'Здесь собраны достоверные мольбы, хадисы с указанием сборников и руководство по шариатской рукье на основе Корана и Сунны.',
        'Используйте закладку-флажок вверху, чтобы отфильтровать только сохранённое в избранное.'
      ]
    },
    tasbih: {
      id: 'tasbih',
      title: 'Счётчик тасбиха',
      items: [
        'Касайтесь центрального круга для счёта. Виброотклик и автопереход к следующему зикру настраиваются в Настройках.',
        'Выбирайте готовые формулы зикра в списке или создавайте собственные напоминания через кнопку «+».'
      ]
    },
    cal: {
      id: 'cal',
      title: 'Календарь и регулярность',
      items: [
        'Отслеживайте ежедневный ритм поминания Аллаха без навязчивых штрафов и давления.',
        'Синхронизируйте дневную цель в Настройках и сверяйтесь с датой по хиджре на главной панели.'
      ]
    },
    settings: {
      id: 'settings',
      title: 'Настройки, планы и резервные копии',
      items: [
        'Выбирайте комфортную тему (Светлая, Тёмная, Моно или Авто), размер арабского шрифта и режим таджвида.',
        'Экспортируйте бэкап в JSON в любой момент — хранятся только ваши настройки, история, закладки и выученное.'
      ]
    }
  };

  var api = {
    TIERS: TIERS,
    CAPABILITIES: CAPABILITIES,
    getCapability: getCapability,
    listCapabilities: listCapabilities,
    hasCapability: hasCapability,
    IqraEntitlements: IqraEntitlements,
    IqraSync: IqraSync,
    IqraPrayer: IqraPrayer,
    SCREEN_GUIDES: SCREEN_GUIDES
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.IqraArchitecture = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
