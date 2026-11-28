"use strict";

/* ============================================================
   AUDIO.JS — Лёгкий аудиоплеер Корана (поаятно и по суре)
   Проект «Икра» · v470
   Единственный переиспользуемый Audio-экземпляр (без наложений),
   вычисление глобального номера аята (1..6236), бесконечный
   автопереход, MediaSession и безопасная обработка ошибок.
   ============================================================ */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.IqraAudio = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  /* Количество аятов в каждой из 114 сур Корана (стандарт Медины / Hafs) */
  var SURAH_AYAH_COUNTS = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
    111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73,
    54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60,
    49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52,
    44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19,
    26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3,
    6, 3, 5, 4, 5, 6
  ];

  var _audioEl = null;
  var _state = {
    quranId: null,
    surahNumber: 0,
    surahTitle: '',
    ayahIdx: 0,
    totalAyahs: 0,
    playing: false,
    loading: false,
    loopMode: 'off', // 'off' | 'ayah' | 'surah'
    error: false
  };

  function _esc(s) {
    return typeof esc === 'function'
      ? esc(s)
      : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
  }

  function getGlobalAyahNumber(surahNumber, ayahIdxInSurah) {
    var s = parseInt(surahNumber, 10);
    var a = parseInt(ayahIdxInSurah, 10);
    if (!Number.isFinite(s) || s < 1 || s > 114) return null;
    if (!Number.isFinite(a) || a < 0) a = 0;
    var countInSurah = SURAH_AYAH_COUNTS[s - 1] || 1;
    if (a >= countInSurah) a = countInSurah - 1;
    var offset = 0;
    for (var i = 0; i < s - 1; i++) {
      offset += SURAH_AYAH_COUNTS[i];
    }
    return offset + a + 1;
  }

  function buildAyahAudioUrl(surahNumber, ayahIdxInSurah) {
    var g = getGlobalAyahNumber(surahNumber, ayahIdxInSurah);
    if (!g) return '';
    return 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/' + g + '.mp3';
  }

  function _resolveItem(quranId) {
    if (typeof getQuranById === 'function') return getQuranById(quranId);
    if (typeof state !== 'undefined' && state && Array.isArray(state.quran)) {
      return state.quran.find(function (q) { return q.id === quranId; }) || null;
    }
    return null;
  }

  function _getTotalAyahs(item) {
    if (!item) return 0;
    if (typeof parseAyahs === 'function') {
      return parseAyahs(item).length;
    }
    var sNum = parseInt(item.number, 10);
    if (sNum >= 1 && sNum <= 114) return SURAH_AYAH_COUNTS[sNum - 1];
    return 0;
  }

  function _ensureAudioEl() {
    if (_audioEl) return _audioEl;
    if (typeof Audio !== 'function') return null;
    var el = new Audio();
    el.preload = 'auto';

    el.addEventListener('playing', function () {
      _state.playing = true;
      _state.loading = false;
      _state.error = false;
      _syncMediaSession();
      _renderUI();
    });
    el.addEventListener('pause', function () {
      _state.playing = false;
      _syncMediaSession();
      _renderUI();
    });
    el.addEventListener('waiting', function () {
      _state.loading = true;
      _renderUI();
    });
    el.addEventListener('canplay', function () {
      _state.loading = false;
      _renderUI();
    });
    el.addEventListener('ended', function () {
      _handleEnded();
    });
    el.addEventListener('error', function () {
      _state.playing = false;
      _state.loading = false;
      _state.error = true;
      _renderUI();
      if (typeof showMarkToast === 'function') {
        showMarkToast('Не удалось загрузить аудио. Проверьте интернет.', 3200);
      }
    });

    _audioEl = el;
    return el;
  }

  function _syncMediaSession() {
    if (typeof IqraPlatform === 'undefined' || !IqraPlatform.safeMediaSession) return;
    if (!_state.quranId) return;
    IqraPlatform.safeMediaSession.setMetadata({
      title: (_state.surahTitle || 'Сура') + ' · аят ' + (_state.ayahIdx + 1),
      artist: 'Мишари Рашид аль-Афаси',
      album: 'Iqra · Коран'
    });
    IqraPlatform.safeMediaSession.setPlaybackState(_state.playing ? 'playing' : 'paused');
    IqraPlatform.safeMediaSession.setActionHandler('play', function () { toggleAudioPlayPause(); });
    IqraPlatform.safeMediaSession.setActionHandler('pause', function () { toggleAudioPlayPause(); });
    IqraPlatform.safeMediaSession.setActionHandler('previoustrack', function () { prevAudioAyah(); });
    IqraPlatform.safeMediaSession.setActionHandler('nexttrack', function () { nextAudioAyah(); });
    IqraPlatform.safeMediaSession.setActionHandler('stop', function () { stopAudioPlayer(); });
  }

  function _highlightActiveAyah() {
    if (typeof document === 'undefined') return;
    var host = document.getElementById('read-ayahs-host');
    if (host) {
      host.querySelectorAll('.read-ayah.is-playing').forEach(function (n) {
        n.classList.remove('is-playing');
      });
      if (_state.quranId && typeof activeReadId !== 'undefined' && activeReadId === _state.quranId) {
        var el = document.getElementById('ayah-' + _state.ayahIdx);
        if (el) el.classList.add('is-playing');
      }
    }
    var barActive = !!(_state.quranId && (_state.playing || _state.loading || _state.error));
    var readBtn = document.getElementById('read-audio-btn');
    if (readBtn) {
      var isCur = _state.quranId && typeof activeReadId !== 'undefined' && activeReadId === _state.quranId && barActive;
      readBtn.classList.toggle('active', !!isCur);
      readBtn.setAttribute('aria-pressed', isCur ? 'true' : 'false');
    }
  }

  function _loopLabel() {
    if (_state.loopMode === 'ayah') return 'Повтор аята';
    if (_state.loopMode === 'surah') return 'Повтор суры';
    return 'Без повтора';
  }

  function _renderUI() {
    _highlightActiveAyah();
    if (typeof document === 'undefined') return;
    var bar = document.getElementById('read-audio-bar');
    if (!bar) return;

    var readMode = document.getElementById('read-mode');
    var inCurrentReader = !!(readMode && readMode.classList.contains('active') &&
      _state.quranId && typeof activeReadId !== 'undefined' && activeReadId === _state.quranId);

    if (!_state.quranId || !inCurrentReader) {
      bar.hidden = true;
      bar.innerHTML = '';
      if (readMode) readMode.classList.remove('has-audio-bar');
      return;
    }

    bar.hidden = false;
    if (readMode) readMode.classList.add('has-audio-bar');

    var playIcon = _state.playing ? '#i-pause' : '#i-play';
    var playLabel = _state.playing ? 'Пауза' : 'Воспроизвести';
    var subText = _state.error
      ? 'Нет сети · нажмите чтобы повторить'
      : (_state.loading ? 'Загрузка аята…' : ('Мишари аль-Афаси · ' + _loopLabel()));

    bar.innerHTML =
      '<div class="rab-controls">' +
        '<button type="button" class="rab-btn" data-click=\'[["prevAudioAyah"]]\' aria-label="Предыдущий аят"' + (_state.ayahIdx <= 0 ? ' disabled' : '') + '>' +
          '<svg class="ico ico-sm"><use href="#i-chevron-left"/></svg>' +
        '</button>' +
        '<button type="button" class="rab-btn rab-play" data-click=\'[["toggleAudioPlayPause"]]\' aria-label="' + playLabel + '">' +
          '<svg class="ico ico-sm"><use href="' + playIcon + '"/></svg>' +
        '</button>' +
        '<button type="button" class="rab-btn" data-click=\'[["nextAudioAyah"]]\' aria-label="Следующий аят"' + (_state.ayahIdx >= _state.totalAyahs - 1 ? ' disabled' : '') + '>' +
          '<svg class="ico ico-sm"><use href="#i-chevron-right"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="rab-meta">' +
        '<div class="rab-title">' + _esc(_state.surahTitle) + ' · аят ' + (_state.ayahIdx + 1) + ' / ' + _state.totalAyahs + '</div>' +
        '<div class="rab-sub">' + _esc(subText) + '</div>' +
      '</div>' +
      '<button type="button" class="rab-btn rab-loop' + (_state.loopMode !== 'off' ? ' active' : '') + '" data-click=\'[["cycleAudioLoop"]]\' aria-label="Повтор: ' + _loopLabel() + '" title="' + _loopLabel() + '">' +
        '<svg class="ico ico-sm"><use href="#i-repeat"/></svg>' +
        (_state.loopMode === 'ayah' ? '<span class="rab-loop-badge">1</span>' : '') +
      '</button>' +
      '<button type="button" class="rab-btn rab-close" data-click=\'[["stopAudioPlayer"]]\' aria-label="Закрыть плеер">' +
        '<svg class="ico ico-sm"><use href="#i-x"/></svg>' +
      '</button>';
  }

  async function _ensureAyahVisibleInReader(idx) {
    if (typeof document === 'undefined') return;
    if (typeof _readRenderState !== 'undefined' && _readRenderState &&
        _readRenderState.id === _state.quranId &&
        idx >= _readRenderState.renderedCount &&
        typeof appendReadAyahBatch === 'function') {
      await appendReadAyahBatch((idx + 10) - _readRenderState.renderedCount);
    }
    var el = document.getElementById('ayah-' + idx);
    if (el && typeof el.scrollIntoView === 'function') {
      try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
    }
  }

  function _playIndex(ayahIdx) {
    var idx = Math.max(0, Math.min(Math.max(0, _state.totalAyahs - 1), parseInt(ayahIdx, 10) || 0));
    _state.ayahIdx = idx;
    _state.error = false;
    _state.loading = true;
    var url = buildAyahAudioUrl(_state.surahNumber, idx);
    if (!url) {
      _state.loading = false;
      _state.playing = false;
      _renderUI();
      return;
    }

    _ensureAyahVisibleInReader(idx);

    var el = _ensureAudioEl();
    if (!el) {
      _state.loading = false;
      _state.playing = false;
      _renderUI();
      return;
    }

    try { el.pause(); } catch (e) {}
    try { el.currentTime = 0; } catch (e) {}
    el.src = url;
    _renderUI();

    try {
      var p = el.play();
      if (p && typeof p.then === 'function') {
        p.catch(function (err) {
          _state.playing = false;
          _state.loading = false;
          if (err && err.name !== 'AbortError') {
            _state.error = true;
            if (typeof showMarkToast === 'function') {
              showMarkToast('Нажмите «Воспроизвести», чтобы начать аудио', 2800);
            }
          }
          _renderUI();
        });
      }
    } catch (e) {
      _state.playing = false;
      _state.loading = false;
      _renderUI();
    }
  }

  function _handleEnded() {
    if (_state.loopMode === 'ayah') {
      _playIndex(_state.ayahIdx);
      return;
    }
    if (_state.ayahIdx + 1 < _state.totalAyahs) {
      _playIndex(_state.ayahIdx + 1);
      return;
    }
    if (_state.loopMode === 'surah') {
      _playIndex(0);
      return;
    }
    _state.playing = false;
    _state.loading = false;
    _syncMediaSession();
    _renderUI();
  }

  function playAyahAudio(quranId, ayahIdx) {
    var item = _resolveItem(quranId);
    if (!item || item.type !== 'surah') {
      if (typeof showMarkToast === 'function') showMarkToast('Аудио доступно для сур Корана');
      return;
    }
    var sNum = parseInt(item.number, 10);
    if (!Number.isFinite(sNum) || sNum < 1 || sNum > 114) return;
    var total = _getTotalAyahs(item) || SURAH_AYAH_COUNTS[sNum - 1];
    var targetIdx = Math.max(0, Math.min(total - 1, parseInt(ayahIdx, 10) || 0));

    if (_state.quranId === quranId && _state.ayahIdx === targetIdx && _audioEl && _audioEl.src) {
      toggleAudioPlayPause();
      return;
    }

    _state.quranId = quranId;
    _state.surahNumber = sNum;
    _state.surahTitle = item.title || ('Сура ' + sNum);
    _state.totalAyahs = total;
    _playIndex(targetIdx);
  }

  function playSurahAudio(quranId) {
    var id = quranId || (typeof activeReadId !== 'undefined' ? activeReadId : null);
    if (!id) return;
    if (_state.quranId === id && _audioEl && _audioEl.src) {
      toggleAudioPlayPause();
      return;
    }
    var startIdx = 0;
    if (typeof currentAyahIdx === 'function' && typeof activeReadId !== 'undefined' && activeReadId === id) {
      startIdx = currentAyahIdx() || 0;
    }
    playAyahAudio(id, startIdx);
  }

  function toggleAudioPlayPause() {
    if (!_state.quranId) return;
    if (_state.error || !_audioEl || !_audioEl.src) {
      _playIndex(_state.ayahIdx);
      return;
    }
    if (_audioEl.paused) {
      try {
        var p = _audioEl.play();
        if (p && typeof p.catch === 'function') {
          p.catch(function (err) {
            _state.playing = false;
            if (err && err.name !== 'AbortError') _state.error = true;
            _renderUI();
          });
        }
      } catch (e) {}
    } else {
      try { _audioEl.pause(); } catch (e) {}
    }
  }

  function prevAudioAyah() {
    if (!_state.quranId) return;
    if (_state.ayahIdx > 0) _playIndex(_state.ayahIdx - 1);
  }

  function nextAudioAyah() {
    if (!_state.quranId) return;
    if (_state.ayahIdx + 1 < _state.totalAyahs) _playIndex(_state.ayahIdx + 1);
  }

  function cycleAudioLoop() {
    var order = ['off', 'ayah', 'surah'];
    var next = order[(order.indexOf(_state.loopMode) + 1) % order.length];
    _state.loopMode = next;
    _renderUI();
    if (typeof showMarkToast === 'function') showMarkToast(_loopLabel());
  }

  function stopAudioPlayer() {
    if (_audioEl) {
      try { _audioEl.pause(); } catch (e) {}
      try { _audioEl.currentTime = 0; } catch (e) {}
      try { _audioEl.removeAttribute('src'); _audioEl.load(); } catch (e) {}
    }
    _state.quranId = null;
    _state.surahNumber = 0;
    _state.playing = false;
    _state.loading = false;
    _state.error = false;
    _syncMediaSession();
    _renderUI();
  }

  function getState() {
    return Object.assign({}, _state);
  }

  function syncReaderBar() {
    _renderUI();
  }

  if (root) {
    root.playSurahAudio = playSurahAudio;
    root.playAyahAudio = playAyahAudio;
    root.toggleAudioPlayPause = toggleAudioPlayPause;
    root.stopAudioPlayer = stopAudioPlayer;
    root.cycleAudioLoop = cycleAudioLoop;
    root.prevAudioAyah = prevAudioAyah;
    root.nextAudioAyah = nextAudioAyah;
  }

  return {
    SURAH_AYAH_COUNTS: SURAH_AYAH_COUNTS,
    getGlobalAyahNumber: getGlobalAyahNumber,
    buildAyahAudioUrl: buildAyahAudioUrl,
    playSurahAudio: playSurahAudio,
    playAyahAudio: playAyahAudio,
    toggleAudioPlayPause: toggleAudioPlayPause,
    stopAudioPlayer: stopAudioPlayer,
    cycleAudioLoop: cycleAudioLoop,
    prevAudioAyah: prevAudioAyah,
    nextAudioAyah: nextAudioAyah,
    syncReaderBar: syncReaderBar,
    getState: getState
  };
});
