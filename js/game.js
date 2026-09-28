/* ============================================================
   타이핑 마스터 — 게임 엔진
   모드: 따라쓰기 / 타임어택 / 낙하 단어 / 정확도 챌린지 / 문장 연습
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };

  /* ---------------- 저장소 ---------------- */
  var S_KEY = 'typingmaster.settings.v1';
  var R_KEY = 'typingmaster.records.v1';
  var C_KEY = 'typingmaster.custom.v1';

  /* 터치 기기(휴대폰·태블릿) 판별 */
  function isMobile() {
    try {
      if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return true;
    } catch (e) {}
    return /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(
      (typeof navigator !== 'undefined' && navigator.userAgent) || '');
  }
  var TOUCH = isMobile();
  /* 좁은 화면에서는 터치 기기가 아니어도 컴팩트 자판을 쓴다 (가로 넘침 방지) */
  var NARROW = (typeof window !== 'undefined' && (window.innerWidth || 9999) <= 760);
  var COMPACT_KB = TOUCH || NARROW;

  var DEFAULT_SETTINGS = {
    sound: true,
    keyboard: !TOUCH,        /* 휴대폰에서는 화면 자판을 기본으로 숨겨 공간 확보 */
    fingerColors: true,
    showMeaning: true,
    ignoreCase: true,
    allowBackspace: true,
    haptics: true,           /* 진동 피드백 (안드로이드 지원) */
    tapKeys: false           /* 화면 자판을 눌러서 입력 (시스템 키보드 대신) */
  };

  function loadObj(key, def) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        var out = JSON.parse(JSON.stringify(def));
        Object.keys(def).forEach(function (k) { if (k in v) out[k] = v[k]; });
        return out;
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(def));
  }
  function loadArr(key) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }
  /* 자유 형식 객체(기록장) 전용 로더 — 기본값과 키가 겹치지 않아도 그대로 복원 */
  function loadRecords(key) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      if (v && typeof v === 'object' && !Array.isArray(v)) return v;
    } catch (e) {}
    return {};
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  var settings = loadObj(S_KEY, DEFAULT_SETTINGS);
  var records = loadRecords(R_KEY);   /* key -> record */
  var customWords = loadArr(C_KEY);

  /* ---------------- 모드 정의 ---------------- */
  var MODES = {
    follow: {
      id: 'follow', icon: '🎯', name: '따라쓰기',
      desc: '단어를 하나씩 따라 쓰면 레벨이 올라가요',
      end: 'none'
    },
    time: {
      id: 'time', icon: '⏱️', name: '타임어택',
      desc: '제한 시간 동안 최대한 많이 입력!',
      end: 'time'
    },
    fall: {
      id: 'fall', icon: '🌧️', name: '낙하 단어',
      desc: '떨어지는 단어를 입력해서 막아요 (목숨 3개)',
      end: 'lives'
    },
    accuracy: {
      id: 'accuracy', icon: '💎', name: '정확도 챌린지',
      desc: '30단어를 오타 없이 정확하게',
      end: 'words', goal: 30
    },
    sentence: {
      id: 'sentence', icon: '✍️', name: '문장 연습',
      desc: '긴 문장과 속담으로 실전 감각 익히기',
      end: 'words', goal: 10
    }
  };

  var DIFFS = {
    easy:   { id: 'easy',   name: '쉬움',   fallSpeed: 0.70, lives: 5, time: 90, startLevel: 1, lenBias: -1 },
    normal: { id: 'normal', name: '보통',   fallSpeed: 1.00, lives: 3, time: 60, startLevel: 1, lenBias: 0 },
    hard:   { id: 'hard',   name: '어려움', fallSpeed: 1.35, lives: 3, time: 45, startLevel: 3, lenBias: 1 }
  };

  /* ---------------- DOM ---------------- */
  var el = {
    screens: {},
    app: document.querySelector('.app'),
    nextHint: $('#next-hint'),
    kbToggle: $('#btn-kb'),
    btnInstall: $('#btn-install'),
    installHint: $('#install-hint'),
    categoryGrid: $('#category-grid'),
    modeGrid: $('#mode-grid'),
    diffRow: $('#diff-row'),
    setupInfo: $('#setup-info'),
    btnStart: $('#btn-start'),
    target: $('#target'),
    meaning: $('#meaning'),
    fallArea: $('#fall-area'),
    typeEcho: $('#type-echo'),
    stage: $('#stage'),
    stageMsg: $('#stage-msg'),
    input: $('#typing-input'),
    keyboard: $('#keyboard'),
    kbWrap: $('#kb-wrap'),
    veil: $('#focus-veil'),
    veilTitle: $('#veil-title'),
    veilSub: $('#veil-sub'),
    veilQuit: $('#veil-quit'),
    hudLevel: $('#hud-level'),
    hudScore: $('#hud-score'),
    hudCombo: $('#hud-combo'),
    hudAcc: $('#hud-acc'),
    hudWpm: $('#hud-wpm'),
    hudExtraWrap: $('#hud-extra-wrap'),
    hudExtraLabel: $('#hud-extra-label'),
    hudExtra: $('#hud-extra'),
    progress: $('.progress'),
    progressBar: $('#progress-bar'),
    btnQuit: $('#btn-quit'),
    btnRetry: $('#btn-retry'),
    btnSound: $('#btn-sound'),
    resultEmoji: $('#result-emoji'),
    resultTitle: $('#result-title'),
    resultStars: $('#result-stars'),
    resultGrid: $('#result-grid'),
    resultMsg: $('#result-msg'),
    wordcatGrid: $('#wordcat-grid'),
    wordList: $('#word-list'),
    customInput: $('#custom-input'),
    recordList: $('#record-list'),
    settingList: $('#setting-list')
  };
  Array.prototype.forEach.call(document.querySelectorAll('.screen'), function (s) {
    el.screens[s.id.replace('screen-', '')] = s;
  });

  /* ---------------- 선택 상태 ---------------- */
  var pick = {
    cats: ['computer'],
    mode: 'follow',
    diff: 'normal'
  };

  /* ---------------- 게임 상태 ---------------- */
  var state = {
    active: false,
    paused: false,
    mode: 'follow',
    diff: 'normal',
    cats: [],
    pool: [],
    sorted: [],
    recent: [],
    level: 1,
    score: 0,
    combo: 0,
    maxCombo: 0,
    correct: 0,
    errors: 0,
    words: 0,
    lives: 3,
    timeLeft: 60,
    timeTotal: 60,
    goal: 0,
    target: null,
    typed: '',
    good: 0,          /* 현재 단어에서 앞에서부터 연속으로 맞은 글자 수 */
    errChar: '',      /* 현재 오류로 표시 중인 글자 (중복 집계 방지) */
    wordErrors: 0,
    cleanWords: 0,
    startTime: 0,
    endTime: 0,
    pausedMs: 0,
    pauseStart: 0,
    tickId: null,
    fall: { list: [], rafId: null, lastTs: 0, spawnAcc: 0, spawnEvery: 1600 }
  };

  /* ============================================================
     유틸
     ============================================================ */
  function catsOf(id) {
    if (id === 'custom') {
      return {
        id: 'custom', name: '내 단어', icon: '⭐', desc: '직접 추가한 단어',
        words: customWords.map(function (w) { return window.parseWordEntry(w); })
          .filter(function (w) { return w.text; })
      };
    }
    return window.WORD_DATA[id];
  }
  function allCategoryIds() {
    var ids = Object.keys(window.WORD_DATA).filter(function (i) { return i !== 'sentence'; });
    if (customWords.length) ids.push('custom');
    return ids;
  }
  function cmp(a, b) {
    if (settings.ignoreCase) return a.toLowerCase() === b.toLowerCase();
    return a === b;
  }
  /* 종료 후에도 결과 화면에서 속도를 계산할 수 있도록 종료 시각을 고정한다 */
  function elapsedSec() {
    var end = state.active ? performance.now() : (state.endTime || performance.now());
    return Math.max(0.001, (end - state.startTime - state.pausedMs) / 1000);
  }
  function accuracyPct() {
    var total = state.correct + state.errors;
    if (!total) return 100;
    return (state.correct / total) * 100;
  }
  function wpm() {
    var m = elapsedSec() / 60;
    if (m <= 0) return 0;
    return Math.round((state.correct / 5) / m);
  }
  function diffCfg() { return DIFFS[state.diff]; }
  function pickRandom(arr, n) {
    var c = arr.slice();
    var out = [];
    while (out.length < n && c.length) out.push(c.splice(Math.floor(Math.random() * c.length), 1)[0]);
    return out;
  }

  /* ============================================================
     화면 전환
     ============================================================ */
  var currentScreen = 'home';
  function show(name) {
    Object.keys(el.screens).forEach(function (k) { el.screens[k].classList.remove('active'); });
    if (el.screens[name]) el.screens[name].classList.add('active');
    currentScreen = name;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (el.app) el.app.scrollTop = 0;
    if (name === 'records') renderRecords();
    if (name === 'words') renderWordList();
    if (name === 'setup') refreshSetup();
  }

  /* ============================================================
     설정 화면
     ============================================================ */
  var SETTING_ROWS = [
    { k: 'sound', t: '효과음', d: '키 입력 · 정답 · 레벨업 소리' },
    { k: 'haptics', t: '진동 피드백', d: '입력할 때 손맛을 줍니다 (안드로이드)' },
    { k: 'keyboard', t: '화면 자판 보기', d: '아래에 자판 그림을 표시합니다 (초보자 추천)' },
    { k: 'tapKeys', t: '화면 자판으로 입력', d: '시스템 키보드 대신 화면 자판을 눌러 입력합니다 (휴대폰 추천)' },
    { k: 'fingerColors', t: '손가락 색상 표시', d: '어느 손가락으로 누를지 색으로 알려줘요' },
    { k: 'showMeaning', t: '단어 뜻 보기', d: '단어 아래에 한글 뜻을 표시합니다' },
    { k: 'ignoreCase', t: '대소문자 무시', d: '대문자·소문자를 구분하지 않습니다 (초보자 추천)' },
    { k: 'allowBackspace', t: '백스페이스 허용', d: '틀린 글자를 지울 수 있게 합니다' }
  ];

  function renderSettings() {
    el.settingList.innerHTML = '';
    SETTING_ROWS.forEach(function (row) {
      var d = document.createElement('div');
      d.className = 'setting-row';
      var txt = document.createElement('div');
      txt.innerHTML = '<div class="st-t">' + row.t + '</div><div class="st-d">' + row.d + '</div>';
      var sw = document.createElement('button');
      sw.className = 'switch' + (settings[row.k] ? ' on' : '');
      sw.setAttribute('aria-label', row.t);
      sw.addEventListener('click', function () {
        settings[row.k] = !settings[row.k];
        save(S_KEY, settings);
        sw.classList.toggle('on', settings[row.k]);
        applySettings();
        window.Sfx.click();
      });
      d.appendChild(txt); d.appendChild(sw);
      el.settingList.appendChild(d);
    });
  }

  function applySettings() {
    window.Sfx.setEnabled(settings.sound);
    el.btnSound.textContent = settings.sound ? '🔊' : '🔇';
    if (!el.keyboard.childElementCount) {
      window.Keyboard.build(el.keyboard, { compact: COMPACT_KB, onKey: onVirtualKey });
    }
    window.Keyboard.setFingerColors(settings.fingerColors);
    /* 탭 입력 모드에서는 화면 자판이 입력 수단이므로 항상 보이게 한다 */
    var kbOn = !!settings.keyboard || !!settings.tapKeys;
    window.Keyboard.setVisible(kbOn);
    document.documentElement.classList.toggle('tap-mode', !!settings.tapKeys);
    if (el.kbToggle) el.kbToggle.classList.toggle('on', kbOn);
    /* 탭 입력 모드에서는 시스템 키보드를 띄우지 않는다 (readonly 로 차단) */
    el.input.readOnly = !!settings.tapKeys;
    if (settings.tapKeys) {
      try { el.input.blur(); } catch (e) {}
      hideVeil();
    }
    if (state.active && state.mode !== 'fall') renderTarget();
    else updateNextHint();
  }

  /* ---------------- 진동 피드백 ---------------- */
  function buzz(pattern) {
    if (!settings.haptics) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
    } catch (e) {}
  }

  /* ============================================================
     설정(setup) 화면
     ============================================================ */
  function renderCategoryGrid() {
    el.categoryGrid.innerHTML = '';
    allCategoryIds().forEach(function (id) {
      var c = catsOf(id);
      var b = document.createElement('button');
      b.className = 'chip' + (pick.cats.indexOf(id) !== -1 ? ' on' : '');
      b.dataset.cat = id;
      b.innerHTML = '<span class="ic">' + c.icon + '</span><span>' + c.name + '</span>' +
        '<span class="cnt">' + c.words.length + '개</span>';
      b.addEventListener('click', function () {
        if (pick.mode === 'sentence') return;
        var i = pick.cats.indexOf(id);
        if (i === -1) pick.cats.push(id); else pick.cats.splice(i, 1);
        if (!pick.cats.length) pick.cats.push(id);
        renderCategoryGrid();
        refreshSetup();
      });
      el.categoryGrid.appendChild(b);
    });
  }

  function renderModeGrid() {
    el.modeGrid.innerHTML = '';
    Object.keys(MODES).forEach(function (id) {
      var m = MODES[id];
      var b = document.createElement('button');
      b.className = 'mode-card' + (pick.mode === id ? ' on' : '');
      b.dataset.mode = id;
      b.innerHTML = '<span class="mt">' + m.icon + ' ' + m.name + '</span><span class="md">' + m.desc + '</span>';
      b.addEventListener('click', function () {
        pick.mode = id;
        renderModeGrid();
        renderCategoryGrid();
        refreshSetup();
      });
      el.modeGrid.appendChild(b);
    });
  }

  function renderDiffRow() {
    Array.prototype.forEach.call(el.diffRow.querySelectorAll('button'), function (b) {
      b.classList.toggle('on', b.dataset.diff === pick.diff);
    });
  }

  function sentenceMode() { return pick.mode === 'sentence'; }

  function refreshSetup() {
    var names = pick.cats.map(function (id) { return catsOf(id).name; });
    var m = MODES[pick.mode], d = DIFFS[pick.diff];
    var sentenceNote = sentenceMode()
      ? '<b>문장 연습 세트</b>가 자동으로 선택됩니다 (분류 선택은 문장 모드에서 쓰이지 않아요)'
      : '분류: <b>' + names.join(' · ') + '</b>';
    el.setupInfo.innerHTML = sentenceNote + '<br>모드: <b>' + m.name + '</b> · 난이도: <b>' + d.name + '</b>';

    var hasWords = sentenceMode() || pick.cats.some(function (id) { return catsOf(id) && catsOf(id).words.length; });
    el.btnStart.disabled = !hasWords;
    el.btnStart.textContent = hasWords ? '시작하기 ▶' : '단어가 없습니다';
    Array.prototype.forEach.call(el.categoryGrid.querySelectorAll('.chip'), function (c) {
      c.classList.toggle('locked', sentenceMode());
    });
  }

  /* ============================================================
     게임 시작
     ============================================================ */
  function buildPool() {
    if (sentenceMode()) return window.WORD_DATA.sentence.words.slice();
    var list = [];
    pick.cats.forEach(function (id) {
      var c = catsOf(id);
      if (c) list = list.concat(c.words);
    });
    /* 중복 제거 */
    var seen = {}, out = [];
    list.forEach(function (w) {
      if (seen[w.text]) return;
      seen[w.text] = 1; out.push(w);
    });
    return out;
  }

  function startGame() {
    var pool = buildPool();
    if (!pool.length) return;

    var d = DIFFS[pick.diff];
    state.active = true;
    state.paused = false;
    state.mode = pick.mode;
    state.diff = pick.diff;
    state.cats = pick.cats.slice();
    state.pool = pool;
    state.sorted = pool.slice().sort(function (a, b) { return a.len - b.len; });
    state.recent = [];
    state.level = d.startLevel;
    state.score = 0;
    state.combo = 0;
    state.maxCombo = 0;
    state.correct = 0;
    state.errors = 0;
    state.words = 0;
    state.cleanWords = 0;
    state.lives = d.lives;
    state.timeTotal = d.time;
    state.timeLeft = d.time;
    state.goal = MODES[state.mode].goal || 0;
    state.wordErrors = 0;
    state.typed = '';
    state.good = 0;
    state.errChar = '';
    state.startTime = performance.now();
    state.endTime = 0;
    state.pausedMs = 0;
    state.fall.list = [];

    el.fallArea.innerHTML = '';
    el.input.value = '';
    forceCaret();
    el.input.disabled = false;

    show('play');
    setStageMode(state.mode === 'fall' ? 'fall' : 'word');
    el.btnStart.blur();

    if (state.mode === 'fall') startFall();
    else nextWord(true);

    updateHud(true);
    updateProgress();
    el.veil.classList.remove('show');
    focusInput();

    clearInterval(state.tickId);
    state.tickId = setInterval(onTick, 150);
  }

  function setStageMode(m) {
    var isFall = m === 'fall';
    el.target.style.display = isFall ? 'none' : 'flex';
    el.meaning.style.display = isFall ? 'none' : 'block';
    el.fallArea.classList.toggle('show', isFall);
    el.typeEcho.classList.toggle('show', isFall);
    el.typeEcho.textContent = '';
  }

  function focusInput() {
    if (!state.active) return;
    if (settings.tapKeys) { try { el.input.blur(); } catch (e) {} return; }
    if (TOUCH) { el.input.focus(); return; }
    try { el.input.focus({ preventScroll: true }); } catch (e) { el.input.focus(); }
  }

  /* ---------------- 입력 파이프라인 (물리 키보드 · 시스템 키보드 · 화면 자판 공용) ---------------- */
  var composing = false;   /* IME(한글 등) 조합 중인지 */

  /* 커서를 항상 맨 끝으로 되돌린다.
     휴대폰에서 입력창을 손가락으로 탭하면 커서가 글자 중간에 놓이는데,
     그 상태로 입력하면 정상 글자도 오타로 판정되기 때문이다. */
  function forceCaret() {
    if (composing) return;
    if (typeof el.input.setSelectionRange !== 'function') return;
    var n = el.input.value.length;
    try {
      if (el.input.selectionStart !== n || el.input.selectionEnd !== n) {
        el.input.setSelectionRange(n, n);
      }
    } catch (e) {}
  }

  function applyInput() {
    if (!state.active || state.paused) return;
    if (state.mode === 'fall') onFallInput();
    else onWordInput();
  }

  /* 화면 자판 · 붙여넣기 등에서 글자를 직접 넣을 때 */
  function typeChars(str) {
    if (!state.active || state.paused) return;
    if (str === '\b') {
      if (!el.input.value.length) return;
      el.input.value = el.input.value.slice(0, -1);
    } else {
      el.input.value += str;
    }
    forceCaret();
    applyInput();
  }

  /* 다음에 눌러야 할 글자 (낙하 모드는 가장 아래에 있는 매칭 단어 기준) */
  function nextNeededChar() {
    var pos = el.input.value.length;
    if (state.mode !== 'fall') {
      return state.target ? (state.target.text.charAt(pos) || '') : '';
    }
    var low = el.input.value.toLowerCase();
    var matches = state.fall.list.filter(function (i) {
      return i.text.toLowerCase().indexOf(low) === 0;
    });
    if (!matches.length) return '';
    matches.sort(function (a, b) { return b.y - a.y; });
    return matches[0].text.charAt(pos) || '';
  }

  /* 화면 자판을 눌렀을 때 */
  function onVirtualKey(baseKey, shifted) {
    if (!state.active || state.paused) return;
    if (baseKey === 'Enter' || baseKey === 'Shift') return;
    if (baseKey === 'Backspace') { typeChars('\b'); return; }
    var need = nextNeededChar();
    var ch = baseKey;
    /* 눌린 키가 지금 필요한 글자와 같은 키라면, 목표의 대소문자를 그대로 사용 */
    if (need && window.Keyboard.baseKey(need) === baseKey) ch = need;
    typeChars(ch);
  }

  /* ---------------- 뷰포트 (모바일 시스템 키보드 대응) ---------------- */
  function syncViewport() {
    var vv = (typeof window !== 'undefined') ? window.visualViewport : null;
    var h = vv ? vv.height : (window.innerHeight || 0);
    if (!h) return;
    var root = document.documentElement;
    root.style.setProperty('--vvh', Math.round(h) + 'px');

    var inset = vv ? Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0)) : 0;
    root.classList.toggle('kb-open', inset > 120);

    /* 화면이 좁아지면 화면 자판을 자동으로 접어 목표 단어가 가려지지 않게 한다 */
    if (el.kbWrap) {
      el.kbWrap.classList.toggle('auto-hide', TOUCH && state.active && h < 470);
    }
    if (TOUCH && vv && vv.offsetTop > 0) window.scrollTo(0, 0);
  }

  function bindViewport() {
    syncViewport();
    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.addEventListener('resize', syncViewport);
      window.visualViewport.addEventListener('scroll', syncViewport);
    }
    window.addEventListener('resize', syncViewport);
    window.addEventListener('orientationchange', function () {
      setTimeout(syncViewport, 250);
    });
  }

  /* ---------------- 다음 키 안내 (자판이 숨겨져 있을 때 크게 표시) ---------------- */
  function updateNextHint() {
    var nh = el.nextHint;
    if (!nh) return;
    var kbVisible = !!settings.keyboard || !!settings.tapKeys;
    var visible = state.active && !state.paused && state.mode !== 'fall' && !kbVisible;
    var ch = visible ? nextNeededChar() : '';
    if (!ch) { nh.classList.remove('show'); nh.innerHTML = ''; return; }
    var label = window.Keyboard.keyLabel(ch).replace(/</g, '&lt;');
    var finger = window.Keyboard.fingerName(ch);
    nh.innerHTML = '다음 키 <b>' + label + '</b>' +
      (finger ? '<span>' + finger + '</span>' : '');
    nh.classList.add('show');
  }

  /* ---------------- 단어 선택 ---------------- */
  function pickWord() {
    var s = state.sorted;
    if (!s.length) return null;

    /* 문장 모드는 길이 제한 없이 전체 문장에서 고른다 */
    if (state.mode === 'sentence') {
      var c0 = s.filter(function (w) { return state.recent.indexOf(w.text) === -1; });
      if (!c0.length) c0 = s;
      return c0[Math.floor(Math.random() * c0.length)];
    }

    var lv = Math.max(1, Math.min(10, state.level + diffCfg().lenBias));
    var pool = s;
    if (state.mode === 'fall') {
      /* 낙하 모드는 짧은 단어 위주 */
      var maxLen = 3 + lv;
      var cand = s.filter(function (w) { return w.len <= maxLen; });
      if (cand.length >= 6) pool = cand;
      var fracF = 0.30 + (lv - 1) * 0.045;
      pool = pool.slice(0, Math.max(8, Math.floor(pool.length * fracF)));
    } else {
      var frac = 0.35 + (lv - 1) * 0.068;
      var cut = Math.max(14, Math.floor(s.length * Math.min(1, frac)));
      pool = s.slice(0, cut);
      if (pool.length < 8) pool = s;      /* 후보가 너무 적으면 전체 사용 */
    }

    var w = null, tries = 0;
    do {
      w = pool[Math.floor(Math.random() * pool.length)];
      tries++;
    } while (w && state.recent.indexOf(w.text) !== -1 && tries < 40);
    return w;
  }

  function nextWord(first) {
    var w = pickWord();
    if (!w) { endGame('empty'); return; }
    state.target = w;
    state.typed = '';
    state.good = 0;
    state.errChar = '';
    state.wordErrors = 0;
    state.recent.push(w.text);
    if (state.recent.length > 4) state.recent.shift();

    el.input.value = '';
    forceCaret();
    el.meaning.innerHTML = (settings.showMeaning && w.meaning)
      ? w.meaning.replace(/</g, '&lt;') : '&nbsp;';
    renderTarget();
  }

  function renderTarget() {
    if (!state.target) return;
    var t = state.target.text;
    var v = el.input.value;
    el.target.innerHTML = '';
    el.target.classList.toggle('fallback', t.length > 16 || state.mode === 'sentence');

    for (var i = 0; i < t.length; i++) {
      var span = document.createElement('span');
      var ch = t.charAt(i);
      span.className = 'ch';
      if (ch === ' ') { span.classList.add('sp'); span.textContent = ' '; }
      else span.textContent = ch;

      if (i < v.length) span.classList.add(cmp(v.charAt(i), ch) ? 'done' : 'bad');
      else span.classList.add('pending');
      if (i === v.length) span.classList.add('cur');
      el.target.appendChild(span);
    }
    window.Keyboard.highlight(t.charAt(v.length) || '');
    updateNextHint();
  }

  /* ---------------- 입력 처리 (단어 모드) ----------------
     중요: 입력값을 "앞에 덧붙인다"고 가정하지 않는다.
     휴대폰에서 입력창을 탭하면 커서가 글자 중간에 놓이기 때문에,
     매번 입력값 전체를 목표 단어와 처음부터 비교해 판정한다(멱등).
     또한 커서를 항상 끝으로 되돌려 중간 삽입 자체를 막는다. */
  function onWordInput() {
    if (!state.target) return;
    var t = state.target.text;
    var raw = el.input.value;
    if (raw.length > t.length) raw = raw.slice(0, t.length);

    /* 앞에서부터 처음 어긋나는 위치 */
    var errPos = -1;
    for (var i = 0; i < raw.length; i++) {
      if (!cmp(raw.charAt(i), t.charAt(i))) { errPos = i; break; }
    }
    var newGood = (errPos === -1) ? raw.length : errPos;

    /* 백스페이스 금지: 이미 맞힌 글자를 지우는 것은 되돌린다 */
    if (!settings.allowBackspace && newGood < state.good) {
      el.input.value = t.slice(0, Math.min(state.good, t.length));
      forceCaret();
      renderTarget();
      updateHud();
      return;
    }

    /* 새로 맞힌 글자 수만큼만 점수 반영 (여러 번 처리해도 안전) */
    if (newGood > state.good) {
      var delta = newGood - state.good;
      state.correct += delta;
      state.combo += delta;
      if (state.combo > state.maxCombo) state.maxCombo = state.combo;
      state.score += delta * 10 + Math.floor(state.combo / 10) * 5;
      window.Sfx.key();
      buzz(6);
      if (state.combo > 0 && state.combo % 25 === 0) flashMessage('🔥 ' + state.combo + ' 콤보!');
    }
    state.good = newGood;

    if (errPos !== -1) {
      var badCh = raw.charAt(errPos);
      if (badCh !== state.errChar) {          /* 같은 오타를 두 번 세지 않는다 */
        state.errors++;
        state.wordErrors++;
        state.combo = 0;
        window.Sfx.error();
        buzz(35);
      }
      state.errChar = badCh;
      /* 틀린 글자는 1개만 남기고 뒤는 버린다 (백스페이스 금지 시에는 남기지 않음) */
      el.input.value = settings.allowBackspace ? raw.slice(0, errPos + 1) : raw.slice(0, errPos);
      forceCaret();
      if (!settings.allowBackspace) {
        el.target.classList.add('shake');
        setTimeout(function () { el.target.classList.remove('shake'); }, 220);
      }
    } else {
      state.errChar = '';
      if (el.input.value !== raw) el.input.value = raw;
      forceCaret();
    }

    state.typed = el.input.value;
    renderTarget();
    updateHud();

    /* 단어 완성 판정 */
    if (errPos === -1 && raw.length === t.length) completeWord();
  }

  function completeWord() {
    state.words++;
    if (state.wordErrors === 0) state.cleanWords++;
    var bonus = 20 + state.level * 5 + state.target.len * 3;
    state.score += bonus;
    window.Sfx.word();
    buzz(15);

    var newLevel = levelForWords(state.words);
    if (newLevel > state.level) {
      state.level = newLevel;
      flashMessage('⬆️ 레벨 ' + state.level + '! 단어가 길어져요');
      window.Sfx.level();
      buzz([0, 25, 50, 25]);
    }

    updateHud(true);
    updateProgress();

    var endCfg = MODES[state.mode];
    if (endCfg.end === 'words' && state.words >= state.goal) {
      endGame('clear');
      return;
    }
    nextWord();
  }

  function levelForWords(n) {
    var step = state.mode === 'time' ? 4 : 5;
    return Math.max(diffCfg().startLevel, Math.min(10, 1 + Math.floor(n / step)));
  }

  /* ---------------- 낙하 단어 모드 ---------------- */
  function startFall() {
    var st = state.fall;
    st.list = [];
    st.lastTs = 0;
    st.spawnAcc = 99999;       /* 시작하자마자 1개 등장 */
    st.spawnEvery = 1700;
    cancelAnimationFrame(st.rafId);
    st.rafId = requestAnimationFrame(fallTick);
  }

  function fallSpawn() {
    var area = el.fallArea;
    var W = area.clientWidth || 600;
    var H = area.clientHeight || 290;
    if (H < 60) return;

    var used = st_texts();
    var w = null, tries = 0;
    do { w = pickWord(); tries++; } while (w && used.indexOf(w.text) !== -1 && tries < 30);
    if (!w) return;

    var node = document.createElement('div');
    node.className = 'fw';
    node.textContent = w.text;
    node.style.top = '0px';
    node.style.left = '0px';
    node.style.transform = 'translate(-200px,-100px)';
    area.appendChild(node);

    var width = node.offsetWidth || 90;
    var x = 6 + Math.random() * Math.max(10, W - width - 12);

    var lv = Math.min(12, state.level);
    var speed = (20 + lv * 7) * diffCfg().fallSpeed * (0.85 + Math.random() * 0.35);

    var item = { text: w.text, x: x, y: -46, speed: speed, node: node, w: width };
    state.fall.list.push(item);
    moveFallItem(item);
  }

  function st_texts() {
    return state.fall.list.map(function (i) { return i.text; });
  }

  function moveFallItem(it) {
    it.node.style.transform = 'translate(' + it.x + 'px,' + it.y + 'px)';
  }

  function fallTick(ts) {
    if (!state.active || state.mode !== 'fall') return;
    var st = state.fall;
    if (!st.lastTs) st.lastTs = ts;
    var dt = Math.min(0.05, (ts - st.lastTs) / 1000);
    st.lastTs = ts;

    if (!state.paused) {
      var H = el.fallArea.clientHeight || 290;

      /* 생성 */
      st.spawnAcc += dt * 1000;
      var every = Math.max(700, st.spawnEvery - (state.level - 1) * 90);
      if (st.spawnAcc >= every) { st.spawnAcc = 0; fallSpawn(); }

      /* 이동 */
      for (var i = st.list.length - 1; i >= 0; i--) {
        var it = st.list[i];
        it.y += it.speed * dt;
        moveFallItem(it);
        it.node.classList.toggle('danger', it.y > H - 90);
        if (it.y > H - 34) {
          st.list.splice(i, 1);
          it.node.remove();
          loseLife();
          if (!state.active) return;
        }
      }
    }
    st.rafId = requestAnimationFrame(fallTick);
  }

  function loseLife() {
    state.lives--;
    state.combo = 0;
    window.Sfx.life();
    buzz(120);
    el.stage.classList.add('shake');
    setTimeout(function () { el.stage.classList.remove('shake'); }, 320);
    updateHud(true);
    if (state.lives <= 0) endGame('over');
  }

  function onFallInput() {
    var v = el.input.value;
    var low = v.toLowerCase();
    el.typeEcho.textContent = v;
    forceCaret();

    if (!v) { clearFallMatch(); el.typeEcho.classList.remove('bad'); return; }

    var matches = state.fall.list.filter(function (i) {
      return i.text.toLowerCase().indexOf(low) === 0;
    });

    if (!matches.length) {
      state.errors++;
      state.combo = 0;
      el.input.value = '';
      el.typeEcho.classList.remove('bad');
      clearFallMatch();
      window.Sfx.error();
      buzz(35);
      updateHud();
      return;
    }

    clearFallMatch();
    matches.forEach(function (m) { m.node.classList.add('matching'); });
    el.typeEcho.classList.remove('bad');
    window.Sfx.key();

    var exact = matches.filter(function (m) { return m.text.toLowerCase() === low; })[0];
    if (exact) destroyFall(exact);
  }

  function clearFallMatch() {
    state.fall.list.forEach(function (i) { i.node.classList.remove('matching'); });
  }

  function destroyFall(it) {
    var idx = state.fall.list.indexOf(it);
    if (idx === -1) return;
    state.fall.list.splice(idx, 1);
    it.node.classList.add('pop');
    setTimeout(function () { it.node.remove(); }, 240);

    state.correct += it.text.length;
    state.words++;
    state.combo++;
    if (state.combo > state.maxCombo) state.maxCombo = state.combo;
    state.score += 15 + it.text.length * 6 + Math.floor(state.combo / 10) * 8;

    el.input.value = '';
    el.typeEcho.textContent = '';
    clearFallMatch();
    window.Sfx.word();
    buzz(15);

    var newLevel = Math.min(10, 1 + Math.floor(state.words / 8));
    if (newLevel > state.level) {
      state.level = newLevel;
      flashMessage('⬆️ 레벨 ' + state.level + '! 빨라집니다');
      window.Sfx.level();
    }
    updateHud(true);
  }

  /* ---------------- 공통 틱 ---------------- */
  function onTick() {
    if (!state.active || state.paused) return;
    if (state.mode === 'time') {
      state.timeLeft -= 0.15;
      if (state.timeLeft <= 0) { state.timeLeft = 0; updateHud(true); endGame('timeup'); return; }
      updateProgress();
    }
    updateHud();
  }

  /* ---------------- HUD ---------------- */
  function pulse(node) {
    node.classList.remove('pulse');
    void node.offsetWidth;
    node.classList.add('pulse');
  }

  function updateHud(big) {
    el.hudLevel.textContent = state.level;
    el.hudScore.textContent = state.score;
    el.hudCombo.textContent = state.combo;
    var acc = accuracyPct();
    el.hudAcc.textContent = (state.correct + state.errors === 0) ? '100%' : acc.toFixed(1) + '%';
    el.hudAcc.classList.toggle('bad', acc < 90 && (state.correct + state.errors) > 10);
    el.hudWpm.textContent = wpm();

    if (state.mode === 'time') {
      el.hudExtraWrap.style.display = '';
      el.hudExtraLabel.textContent = '남은 시간';
      el.hudExtra.textContent = Math.ceil(state.timeLeft) + '초';
      el.hudExtra.classList.toggle('bad', state.timeLeft <= 10);
    } else if (state.mode === 'fall') {
      el.hudExtraWrap.style.display = '';
      el.hudExtraLabel.textContent = '목숨';
      el.hudExtra.textContent = '❤️'.repeat(Math.max(0, state.lives));
    } else if (state.goal) {
      el.hudExtraWrap.style.display = '';
      el.hudExtraLabel.textContent = '남은 개수';
      el.hudExtra.textContent = Math.max(0, state.goal - state.words);
    } else {
      el.hudExtraWrap.style.display = 'none';
    }

    if (big) pulse(el.hudScore);
    updateProgress();
  }

  function updateProgress() {
    var showBar = state.mode === 'accuracy' || state.mode === 'sentence' || state.mode === 'time';
    el.progress.classList.toggle('show', showBar);
    if (!showBar) return;
    var pct = 0;
    if (state.mode === 'time') pct = ((state.timeTotal - state.timeLeft) / state.timeTotal) * 100;
    else pct = (state.words / state.goal) * 100;
    el.progressBar.style.width = Math.max(0, Math.min(100, pct)) + '%';
  }

  var msgTimer = null;
  function flashMessage(text) {
    el.stageMsg.textContent = text;
    el.stageMsg.classList.add('show');
    clearTimeout(msgTimer);
    msgTimer = setTimeout(function () { el.stageMsg.classList.remove('show'); }, 1200);
  }

  /* ---------------- 일시정지 / 종료 ---------------- */
  function showVeil(title, sub) {
    el.veilTitle.textContent = title;
    el.veilSub.textContent = sub;
    el.veil.classList.add('show');
  }
  function hideVeil() { el.veil.classList.remove('show'); }

  function setPaused(p) {
    if (!state.active) return;
    if (p === state.paused) return;
    state.paused = p;
    if (p) {
      state.pauseStart = performance.now();
      showVeil('⏸ 일시정지', '클릭하거나 Esc 키를 누르면 계속합니다');
    } else {
      state.pausedMs += performance.now() - state.pauseStart;
      hideVeil();
      focusInput();
    }
  }

  function starsFor() {
    var acc = accuracyPct();
    if (state.mode === 'accuracy') return acc >= 99.5 ? 3 : (acc >= 96 ? 2 : 1);
    if (state.mode === 'sentence') return (acc >= 98 && wpm() >= 25) ? 3 : ((acc >= 93 && wpm() >= 15) ? 2 : 1);
    if (state.mode === 'time') return state.score >= 1200 ? 3 : (state.score >= 600 ? 2 : 1);
    if (state.mode === 'fall') return state.level >= 6 ? 3 : (state.level >= 4 ? 2 : 1);
    return (acc >= 97 && state.level >= 5) ? 3 : (acc >= 92 ? 2 : 1);
  }

  function endGame(reason) {
    if (!state.active) return;
    state.endTime = performance.now();   /* 속도 계산 전에 시각 고정 */
    state.active = false;
    state.paused = false;
    clearInterval(state.tickId);
    cancelAnimationFrame(state.fall.rafId);
    hideVeil();
    window.Keyboard.clearHighlight();

    var acc = accuracyPct();
    var speed = wpm();
    var st = starsFor();

    /* 기록 저장 */
    var key = state.mode + '|' + state.diff + '|' + (state.mode === 'sentence' ? 'sentence' : state.cats.join('+'));
    var prev = records[key];
    var isBest = !prev || state.score > prev.score;
    if (isBest && (state.words > 0)) {
      records[key] = {
        mode: state.mode, diff: state.diff,
        cats: state.mode === 'sentence' ? ['sentence'] : state.cats,
        score: state.score, wpm: speed, acc: Math.round(acc * 10) / 10,
        level: state.level, words: state.words, stars: st, date: Date.now()
      };
      save(R_KEY, records);
    }

    /* 결과 화면 */
    var titles = {
      clear: ['🎉', '목표 달성!'],
      timeup: ['⏰', '시간 종료!'],
      over: ['💥', '게임 오버'],
      empty: ['📭', '연습할 단어가 없어요'],
      quit: ['📊', '연습 결과']
    };
    var t = titles[reason] || ['📊', '연습 결과'];
    el.resultEmoji.textContent = t[0];
    el.resultTitle.textContent = t[1];

    el.resultStars.innerHTML = '';
    for (var i = 0; i < 3; i++) {
      var s = document.createElement('span');
      s.textContent = '★';
      if (i >= st) s.className = 'off';
      el.resultStars.appendChild(s);
    }

    var stats = [
      ['점수', state.score],
      ['정확도', (state.correct + state.errors ? acc.toFixed(1) : '100.0') + '%'],
      ['속도', speed + ' WPM'],
      ['최대 콤보', state.maxCombo],
      ['완료 단어', state.words + '개'],
      ['도달 레벨', state.level]
    ];
    el.resultGrid.innerHTML = '';
    stats.forEach(function (pair) {
      var d = document.createElement('div');
      d.className = 'rs' + (pair[0] === '점수' && isBest ? ' best' : '');
      d.innerHTML = '<span>' + pair[0] + '</span><b>' + pair[1] + '</b>';
      el.resultGrid.appendChild(d);
    });

    var msg = '';
    if (isBest && state.words > 0) msg += '🏅 <b>새 최고 기록!</b> ';
    if (reason === 'empty') msg = '선택한 분류에 단어가 없습니다. “단어 살펴보기”에서 내 단어를 추가해 보세요.';
    else if (acc >= 98 && speed >= 30) msg += '정확도와 속도가 모두 훌륭해요. 다음 난이도에 도전해 보세요!';
    else if (acc < 90) msg += '정확도를 먼저 올려 보세요. 천천히, 키보드를 보지 않고 치는 연습이 좋아요.';
    else if (speed < 15 && state.words > 3) msg += '조금씩 빨라지고 있어요. 매일 5분씩만 연습해도 크게 늘어요!';
    else msg += '좋아요! 한 번 더 하면 손이 더 익숙해집니다.';
    el.resultMsg.innerHTML = msg;

    window.Sfx.over();
    buzz([0, 60, 60, 60]);
    show('result');
  }

  /* ============================================================
     단어 살펴보기
     ============================================================ */
  var browseCat = 'computer';
  function renderWordCats() {
    el.wordcatGrid.innerHTML = '';
    allCategoryIds().forEach(function (id) {
      var c = catsOf(id);
      var b = document.createElement('button');
      b.className = 'chip' + (browseCat === id ? ' on' : '');
      b.innerHTML = '<span class="ic">' + c.icon + '</span><span>' + c.name + '</span>' +
        '<span class="cnt">' + c.words.length + '개</span>';
      b.addEventListener('click', function () { browseCat = id; renderWordCats(); renderWordList(); });
      el.wordcatGrid.appendChild(b);
    });
  }

  function renderWordList() {
    if (!allCategoryIds().length) return;
    if (allCategoryIds().indexOf(browseCat) === -1) browseCat = 'computer';
    renderWordCats();
    var c = catsOf(browseCat);
    el.wordList.innerHTML = '';
    if (!c || !c.words.length) {
      el.wordList.innerHTML = '<div class="empty-note">아직 단어가 없습니다.<br>아래에서 직접 추가해 보세요.</div>';
      return;
    }
    c.words.forEach(function (w) {
      var d = document.createElement('div');
      d.className = 'wl-item';
      d.innerHTML = '<b>' + w.text.replace(/</g, '&lt;') + '</b><span>' + (w.meaning || '—') + '</span>';
      el.wordList.appendChild(d);
    });
  }

  function saveCustom() {
    var lines = el.customInput.value.split('\n');
    var list = [];
    lines.forEach(function (ln) {
      var v = ln.trim();
      if (v) list.push(v);
    });
    customWords = list;
    save(C_KEY, customWords);
    if (list.length) browseCat = 'custom';
    renderWordList();
    renderCategoryGrid();
    refreshSetup();
    flashMessageLocal('저장했습니다: ' + list.length + '개');
  }

  var toastEl = null, toastTimer = null;
  function flashMessageLocal(text) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = text;
    /* 강제 리플로우 후 표시 */
    void toastEl.offsetWidth;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }

  /* ============================================================
     기록
     ============================================================ */
  function renderRecords() {
    var keys = Object.keys(records);
    el.recordList.innerHTML = '';
    if (!keys.length) {
      el.recordList.innerHTML = '<div class="empty-note">아직 기록이 없습니다.<br>게임을 한 번 해 보세요! 🎮</div>';
      return;
    }
    keys.map(function (k) { return records[k]; })
      .sort(function (a, b) { return b.score - a.score; })
      .forEach(function (r) {
        var m = MODES[r.mode] || { icon: '🎮', name: r.mode };
        var names = (r.cats || []).map(function (id) {
          var c = catsOf(id); return c ? c.name : id;
        }).join(' · ');
        var row = document.createElement('div');
        row.className = 'record-row';
        row.innerHTML =
          '<div class="rr-t">' + m.icon + ' ' + m.name + '<br>' +
          '<small style="color:var(--muted);font-weight:500;font-size:12px">' + names +
          ' · ' + (DIFFS[r.diff] ? DIFFS[r.diff].name : r.diff) + '</small></div>' +
          '<div class="rr-s">' +
          '<span>점수 <b>' + r.score + '</b></span>' +
          '<span>정확도 <b>' + r.acc + '%</b></span>' +
          '<span>속도 <b>' + r.wpm + ' WPM</b></span>' +
          '<span>레벨 <b>' + r.level + '</b></span>' +
          '<span style="color:var(--gold)">' + '★'.repeat(r.stars || 1) + '</span>' +
          '</div>';
        el.recordList.appendChild(row);
      });
  }

  /* ============================================================
     이벤트 연결
     ============================================================ */
  function bind() {
    /* 화면 이동 버튼 */
    Array.prototype.forEach.call(document.querySelectorAll('[data-go]'), function (b) {
      b.addEventListener('click', function () {
        var target = b.dataset.go;
        if (target !== 'play' && state.active) {
          state.active = false;
          clearInterval(state.tickId);
          cancelAnimationFrame(state.fall.rafId);
          hideVeil();
        }
        window.Sfx.click();
        show(target);
      });
    });

    /* 난이도 버튼 (한 번만 연결) */
    Array.prototype.forEach.call(el.diffRow.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () {
        pick.diff = b.dataset.diff;
        renderDiffRow();
        refreshSetup();
        window.Sfx.click();
      });
    });

    el.btnStart.addEventListener('click', function () {
      window.Sfx.unlock();
      window.Sfx.click();
      startGame();
    });
    el.btnRetry.addEventListener('click', startGame);
    el.btnQuit.addEventListener('click', function () { endGame('quit'); });

    el.btnSound.addEventListener('click', function () {
      settings.sound = !settings.sound;
      save(S_KEY, settings);
      applySettings();
      if (settings.sound) { window.Sfx.unlock(); window.Sfx.click(); }
      renderSettings();
    });

    el.veil.addEventListener('click', function () {
      if (state.paused) setPaused(false);
      else { hideVeil(); focusInput(); }
    });
    el.veilQuit.addEventListener('click', function (e) {
      e.stopPropagation();
      endGame('quit');
    });

    /* 입력 (물리 키보드 · 시스템 키보드 · 화면 자판 모두 이 경로로 들어온다) */
    el.input.addEventListener('input', function (e) {
      if (e && e.isComposing) return;      /* IME 조합 중에는 아직 판정하지 않는다 */
      applyInput();
    });
    el.input.addEventListener('paste', function (e) { e.preventDefault(); });
    el.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') e.preventDefault();
    });

    /* 커서가 글자 중간에 놓이지 않도록 항상 끝으로 되돌린다.
       (휴대폰에서 입력창을 탭한 직후가 가장 위험하다) */
    ['focus', 'click', 'mouseup', 'touchend', 'keyup'].forEach(function (ev) {
      el.input.addEventListener(ev, function () { setTimeout(forceCaret, 0); });
    });
    el.input.addEventListener('compositionstart', function () { composing = true; });
    el.input.addEventListener('compositionend', function () {
      composing = false;
      forceCaret();
      applyInput();                        /* 조합이 끝난 뒤 한 번 더 판정 (멱등이라 안전) */
    });

    el.input.addEventListener('blur', function () {
      if (settings.tapKeys) return;          /* 탭 입력 모드에서는 포커스가 필요 없다 */
      if (state.active && !state.paused) {
        setTimeout(function () {
          if (state.active && !state.paused && !settings.tapKeys) {
            showVeil('⌨️ 입력을 기다리는 중', '화면을 클릭하면 계속합니다');
          }
        }, 60);
      }
    });

    /* 화면 자판 보기/숨기기 (휴대폰에서 자주 씀) */
    if (el.kbToggle) {
      el.kbToggle.addEventListener('click', function () {
        settings.keyboard = !settings.keyboard;
        save(S_KEY, settings);
        applySettings();
        renderSettings();
        window.Sfx.click();
      });
    }

    /* 물리 키보드 시각화 */
    document.addEventListener('keydown', function (e) {
      window.Keyboard.press(e);
      if (e.key === 'Tab' && state.active) e.preventDefault();
      if (e.key === 'Escape' && state.active) { e.preventDefault(); setPaused(!state.paused); }
    });
    document.addEventListener('keyup', function (e) { window.Keyboard.release(e); });
    window.addEventListener('blur', function () {
      if (state.active && !state.paused) setPaused(true);
    });
    document.addEventListener('click', function () { window.Sfx.unlock(); }, { once: true });

    /* 단어 관리 */
    $('#btn-custom-save').addEventListener('click', saveCustom);
    $('#btn-custom-clear').addEventListener('click', function () {
      if (!confirm('내 단어를 모두 지울까요?')) return;
      customWords = [];
      save(C_KEY, customWords);
      el.customInput.value = '';
      browseCat = 'computer';
      renderWordList();
      renderCategoryGrid();
    });

    /* 기록 삭제 */
    $('#btn-record-clear').addEventListener('click', function () {
      if (!confirm('모든 기록을 지울까요?')) return;
      records = {};
      save(R_KEY, records);
      renderRecords();
    });

    bindInstall();
  }

  /* ============================================================
     앱 설치 (PWA)
     ============================================================ */
  function bindInstall() {
    var deferred = null;

    function showHint(html) {
      if (!el.installHint) return;
      el.installHint.innerHTML = html;
      el.installHint.classList.add('show');
    }

    /* 안드로이드 Chrome: 설치 가능해지면 이벤트가 발생한다 */
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferred = e;
      if (el.installHint) el.installHint.classList.remove('show');
      if (el.btnInstall) el.btnInstall.classList.add('show');
    });

    if (el.btnInstall) {
      el.btnInstall.addEventListener('click', function () {
        window.Sfx.click();
        if (!deferred) return;
        deferred.prompt();
        var choice = deferred.userChoice;
        deferred = null;
        el.btnInstall.classList.remove('show');
        if (choice && choice.then) choice.then(function () { el.btnInstall.classList.remove('show'); });
      });
    }

    window.addEventListener('appinstalled', function () {
      deferred = null;
      if (el.btnInstall) el.btnInstall.classList.remove('show');
      showHint('✅ <b>앱이 설치되었습니다!</b> 홈 화면의 아이콘으로 열면 인터넷 없이도 실행됩니다.');
    });

    /* 이미 앱으로 실행 중이면 안내하지 않는다 */
    var standalone = false;
    try {
      standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
        (typeof navigator !== 'undefined' && navigator.standalone === true);
    } catch (e) {}

    if (!standalone && el.installHint) {
      var ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
      if (/iPhone|iPad|iPod/i.test(ua)) {
        showHint('📲 앱처럼 쓰려면 <b>공유</b> 버튼 → <b>홈 화면에 추가</b>를 눌러 주세요.');
      } else if (TOUCH || /Android/i.test(ua)) {
        showHint('📲 앱처럼 쓰려면 <b>Chrome 메뉴 ⋮</b> → <b>앱 설치</b> 또는 <b>홈 화면에 추가</b>를 눌러 주세요.');
      }
    }
  }

  /* ============================================================
     초기화
     ============================================================ */
  function init() {
    document.documentElement.classList.toggle('touch', TOUCH);

    /* PWA 바로가기 지원: index.html?mode=follow / ?mode=fall ... */
    try {
      if (typeof location !== 'undefined' && location.search) {
        var q = /[?&]mode=([a-z]+)/.exec(location.search);
        if (q && MODES[q[1]]) pick.mode = q[1];
      }
    } catch (e) {}

    window.Keyboard.build(el.keyboard, { compact: COMPACT_KB, onKey: onVirtualKey });
    applySettings();
    renderSettings();
    renderCategoryGrid();
    renderModeGrid();
    renderDiffRow();
    renderWordCats();
    renderWordList();
    renderRecords();
    refreshSetup();
    bind();
    bindViewport();
    el.customInput.value = customWords.join('\n');
    show('home');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
