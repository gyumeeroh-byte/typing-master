/* ============================================================
   타이핑 마스터 — 가상 키보드
   · 손가락별 색상 (터치 타이핑 안내)
   · 지금 눌러야 할 키 하이라이트 + Shift 안내
   ============================================================ */
(function () {
  'use strict';

  /* 각 키: {k: 기본키, s: Shift 결과} */
  var ROWS = [
    [{k:'`',s:'~'},{k:'1',s:'!'},{k:'2',s:'@'},{k:'3',s:'#'},{k:'4',s:'$'},{k:'5',s:'%'},
     {k:'6',s:'^'},{k:'7',s:'&'},{k:'8',s:'*'},{k:'9',s:'('},{k:'0',s:')'},{k:'-',s:'_'},{k:'=',s:'+'}],
    [{k:'q',s:'Q'},{k:'w',s:'W'},{k:'e',s:'E'},{k:'r',s:'R'},{k:'t',s:'T'},{k:'y',s:'Y'},{k:'u',s:'U'},
     {k:'i',s:'I'},{k:'o',s:'O'},{k:'p',s:'P'},{k:'[',s:'{'},{k:']',s:'}'},{k:'\\',s:'|'}],
    [{k:'Shift',label:'Shift',mod:true,wide:true},
     {k:'a',s:'A'},{k:'s',s:'S'},{k:'d',s:'D'},{k:'f',s:'F'},{k:'g',s:'G'},{k:'h',s:'H'},{k:'j',s:'J'},
     {k:'k',s:'K'},{k:'l',s:'L'},{k:';',s:':'},{k:"'",s:'"'},{k:'Enter',label:'Enter',mod:true,wide:true}],
    [{k:'Shift',label:'Shift',mod:true,wide:true},
     {k:'z',s:'Z'},{k:'x',s:'X'},{k:'c',s:'C'},{k:'v',s:'V'},{k:'b',s:'B'},{k:'n',s:'N'},{k:'m',s:'M'},
     {k:',',s:'<'},{k:'.',s:'>'},{k:'/',s:'?'},{k:'Shift',label:'Shift',mod:true,wide:true}],
    [{k:' ',label:'space',space:true}]
  ];

  /* 휴대폰용 컴팩트 배열: 숫자 줄을 빼고 폭에 맞춰 늘어나게 한다.
     (연습 단어에는 숫자가 없고, 영문자·스페이스·아포스트로피만 필요) */
  var COMPACT_ROWS = [
    [{k:'q',s:'Q'},{k:'w',s:'W'},{k:'e',s:'E'},{k:'r',s:'R'},{k:'t',s:'T'},
     {k:'y',s:'Y'},{k:'u',s:'U'},{k:'i',s:'I'},{k:'o',s:'O'},{k:'p',s:'P'}],
    [{k:'a',s:'A'},{k:'s',s:'S'},{k:'d',s:'D'},{k:'f',s:'F'},{k:'g',s:'G'},
     {k:'h',s:'H'},{k:'j',s:'J'},{k:'k',s:'K'},{k:'l',s:'L'},{k:"'",s:'"'}],
    [{k:'z',s:'Z'},{k:'x',s:'X'},{k:'c',s:'C'},{k:'v',s:'V'},{k:'b',s:'B'},
     {k:'n',s:'N'},{k:'m',s:'M'},{k:'Backspace',label:'⌫',del:true}],
    [{k:' ',label:'space',space:true}]
  ];

  /* 손가락 배정 */
  var FINGER = {
    '`':'l5','1':'l5','q':'l5','a':'l5','z':'l5',
    '2':'l4','w':'l4','s':'l4','x':'l4',
    '3':'l3','e':'l3','d':'l3','c':'l3',
    '4':'l2','5':'l2','r':'l2','t':'l2','f':'l2','g':'l2','v':'l2','b':'l2',
    '6':'r2','7':'r2','y':'r2','u':'r2','h':'r2','j':'r2','n':'r2','m':'r2',
    '8':'r3','i':'r3','k':'r3',',':'r3',
    '9':'r4','o':'r4','l':'r4','.':'r4',
    '0':'r5','-':'r5','=':'r5','p':'r5','[':'r5',']':'r5','\\':'r5',';':'r5',"'":'r5','/':'r5',
    ' ':'th','Shift':'th','Enter':'r5'
  };
  var FINGER_COLOR = {
    l5:'var(--f-l5)', l4:'var(--f-l4)', l3:'var(--f-l3)', l2:'var(--f-l2)',
    r2:'var(--f-r2)', r3:'var(--f-r3)', r4:'var(--f-r4)', r5:'var(--f-r5)', th:'var(--f-th)'
  };
  var FINGER_NAME = {
    l5:'왼손 새끼', l4:'왼손 약지', l3:'왼손 중지', l2:'왼손 검지',
    r2:'오른손 검지', r3:'오른손 중지', r4:'오른손 약지', r5:'오른손 새끼', th:'엄지'
  };

  var SHIFT_SYMBOLS = { '~':'`','!':'1','@':'2','#':'3','$':'4','%':'5','^':'6','&':'7','*':'8','(':'9',')':'0',
    '_':'-','+':'=','{':'[','}':']','|':'\\',':':';','"':"'",'<':',','>':'.','?':'/' };

  var keyEls = {};      /* 기본키(소문자) -> element (여러 개일 수 있어 배열) */
  var shiftEls = [];
  var activeEl = null;
  var root = null;
  var fingerColorsOn = true;
  var tapHandler = null;

  function baseKey(ch) {
    if (ch === ' ') return ' ';
    if (!ch || ch.length !== 1) return null;
    var low = ch.toLowerCase();
    if (low >= 'a' && low <= 'z') return low;
    if (low >= '0' && low <= '9') return low;
    if ('`-=[]\\;\',./'.indexOf(low) !== -1) return low;
    if (SHIFT_SYMBOLS[ch]) return SHIFT_SYMBOLS[ch];
    return null;
  }
  function needsShift(ch) {
    if (!ch || ch.length !== 1) return false;
    if (ch >= 'A' && ch <= 'Z') return true;
    return !!SHIFT_SYMBOLS[ch];
  }

  function build(el, opts) {
    root = el;
    opts = opts || {};
    tapHandler = opts.onKey || null;
    keyEls = {}; shiftEls = []; activeEl = null;
    el.innerHTML = '';
    el.classList.toggle('kb-compact', !!opts.compact);

    var rows = opts.compact ? COMPACT_ROWS : ROWS;

    rows.forEach(function (row) {
      var rowEl = document.createElement('div');
      rowEl.className = 'kb-row';
      row.forEach(function (def) {
        var k = document.createElement('div');
        k.className = 'key';
        if (def.wide) k.classList.add('wide');
        if (def.space) k.classList.add('space');
        if (def.del) k.classList.add('del');
        if (def.k === 'f' || def.k === 'j') k.classList.add('home');
        if (def.s) k.classList.add('has-shift');

        var label = document.createElement('div');
        label.className = 'main';
        label.textContent = def.label || def.k;
        k.appendChild(label);

        if (def.s && def.s !== def.k) {
          var sh = document.createElement('div');
          sh.className = 'shift';
          sh.textContent = def.s;
          k.appendChild(sh);
        }

        var f = FINGER[def.k];
        if (f) {
          k.dataset.finger = f;
          k.style.setProperty('--fc', FINGER_COLOR[f]);
        }

        /* 터치/클릭으로 입력 (모바일 탭 입력) */
        if (!def.mod) {
          k.setAttribute('role', 'button');
          k.addEventListener('click', function () {
            if (!def.space) { k.classList.add('pressed'); setTimeout(function () { k.classList.remove('pressed'); }, 110); }
            if (tapHandler) tapHandler(def.k, def.s);
          });
        }

        rowEl.appendChild(k);

        if (def.k === 'Shift') { shiftEls.push(k); return; }
        var bk = def.k === ' ' ? ' ' : def.k.toLowerCase();
        if (!keyEls[bk]) keyEls[bk] = [];
        keyEls[bk].push(k);
      });
      el.appendChild(rowEl);
    });

    setFingerColors(fingerColorsOn);
  }

  function setFingerColors(on) {
    fingerColorsOn = !!on;
    if (!root) return;
    root.classList.toggle('finger', fingerColorsOn);
  }
  function setVisible(on) {
    if (root && root.parentElement) root.parentElement.style.display = on ? '' : 'none';
  }

  /* 눌러야 할 글자 하이라이트 */
  function highlight(ch) {
    clearHighlight();
    var bk = baseKey(ch);
    if (!bk || !keyEls[bk]) return;
    var el = keyEls[bk][0];
    el.classList.add('active');
    activeEl = el;
    if (needsShift(ch)) shiftEls.forEach(function (s) { s.classList.add('active'); });
  }
  function clearHighlight() {
    if (activeEl) activeEl.classList.remove('active');
    activeEl = null;
    shiftEls.forEach(function (s) { s.classList.remove('active'); });
  }

  /* 실제 키 입력 시각화 */
  function press(e) {
    var ch = e.key;
    if (ch === 'Shift') { shiftEls.forEach(function (s) { s.classList.add('pressed'); }); return; }
    var bk = baseKey(ch);
    if (bk && keyEls[bk]) keyEls[bk].forEach(function (el) { el.classList.add('pressed'); });
  }
  function release(e) {
    var ch = e.key;
    if (ch === 'Shift') { shiftEls.forEach(function (s) { s.classList.remove('pressed'); }); return; }
    var bk = baseKey(ch);
    if (bk && keyEls[bk]) keyEls[bk].forEach(function (el) { el.classList.remove('pressed'); });
  }

  /* 손가락 이름 / 키 안내 문구 */
  function fingerName(ch) {
    var f = FINGER[baseKey(ch)];
    return f ? FINGER_NAME[f] : '';
  }
  function keyLabel(ch) {
    if (!ch) return '';
    if (ch === ' ') return '스페이스';
    var bk = baseKey(ch);
    if (!bk) return ch;
    return needsShift(ch) ? 'Shift + ' + bk.toUpperCase() : bk.toUpperCase();
  }

  window.Keyboard = {
    build: build,
    highlight: highlight,
    clearHighlight: clearHighlight,
    press: press,
    release: release,
    setFingerColors: setFingerColors,
    setVisible: setVisible,
    baseKey: baseKey,
    needsShift: needsShift,
    fingerName: fingerName,
    keyLabel: keyLabel
  };
})();
