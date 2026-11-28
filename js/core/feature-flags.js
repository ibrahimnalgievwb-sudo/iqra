"use strict";

/* ============================================================
   FEATURE-FLAGS.JS — Модульная карта «Икра+» и гарантия ядра
   Проект «Икра» · v470
   Базовое ядро (Коран, таджвид Hafs V4, аудио, тасбих, дуа,
   хадисы, ночное чтение, Умная книга) — 100% бесплатно навсегда.
   Модули «Икра+» сгруппированы в 4 блока со статусом
   «В разработке» без пейволлов и блокировок.
   ============================================================ */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.IqraAccess = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  var CORE_FREE_ALWAYS = Object.freeze([
    'quran',
    'tajweed',
    'audio',
    'tasbih',
    'dua',
    'hadith',
    'night',
    'path'
  ]);

  var MODULES = Object.freeze({
    ACADEMY: Object.freeze({
      id: 'ACADEMY',
      title: 'Академия Икра',
      status: 'В разработке',
      summary: 'Пошаговый курс арабского алфавита, махраджа букв и практики чтения с нуля.',
      capabilityIds: Object.freeze(['arabic_tajweed_course'])
    }),
    HIFZ_PLANNER: Object.freeze({
      id: 'HIFZ_PLANNER',
      title: 'Тренажёр Хифза и Планировщик',
      status: 'В разработке',
      summary: 'Интервальное повторение аятов, личный ритм чтения и памятные даты Сунны.',
      capabilityIds: Object.freeze(['hifz', 'planner', 'sunnah_fasts'])
    }),
    TAFSIR_JOURNAL: Object.freeze({
      id: 'TAFSIR_JOURNAL',
      title: 'Справочник аятов и Дневник',
      status: 'В разработке',
      summary: 'Тематический обзор историй пророков, личный дневник размышлений и расширенная аналитика.',
      capabilityIds: Object.freeze(['prophets_encyclopedia', 'diary', 'extended_progress'])
    }),
    QADA_CLOUD: Object.freeze({
      id: 'QADA_CLOUD',
      title: 'Трекер Када и Облачный бэкап',
      status: 'В разработке',
      summary: 'Бережный календарь восполнения пропусков и резервное копирование между устройствами.',
      capabilityIds: Object.freeze(['qada_tracker', 'cloud_sync'])
    })
  });

  function listModules() {
    return [MODULES.ACADEMY, MODULES.HIFZ_PLANNER, MODULES.TAFSIR_JOURNAL, MODULES.QADA_CLOUD];
  }

  function getModule(key) {
    if (!key || typeof key !== 'string') return null;
    var upper = key.toUpperCase();
    return Object.prototype.hasOwnProperty.call(MODULES, upper) ? MODULES[upper] : null;
  }

  function canUse(key) {
    var k = String(key || '').toLowerCase();
    if (CORE_FREE_ALWAYS.indexOf(k) !== -1) {
      return { allowed: true, mode: 'free_core', status: 'Активно' };
    }
    var mod = getModule(key);
    if (mod) {
      return { allowed: true, mode: 'free_preview', status: mod.status, module: mod };
    }
    return { allowed: true, mode: 'free_preview', status: 'В разработке' };
  }

  return {
    CORE_FREE_ALWAYS: CORE_FREE_ALWAYS,
    MODULES: MODULES,
    listModules: listModules,
    getModule: getModule,
    canUse: canUse
  };
});
