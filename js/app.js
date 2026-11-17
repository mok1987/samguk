// 직장 삼국지 앱 초안 (설치 없이 도는 정적 웹앱)
(function () {
  var D = window.SAMGUK, E = window.SamgukEngine;
  var app = document.getElementById('app');
  var SITE = location.origin + location.pathname;
  var YAGEUN_URL = 'https://overtimenote.kr';

  // 캐릭터별 결과 화면 동작 (이미지 1장을 통째로 움직임)
  var MOTION = {
    '조조': 'proud', '손권': 'nod', '동탁': 'laugh', '조비': 'proud', '유비': 'nod',
    '사마의': 'nod', '순욱': 'shake', '초선': 'sway', '양수': 'shake', '십상시': 'laugh',
    '제갈량': 'fan', '주유': 'fan', '방통': 'fan', '육손': 'fan',
    '관우': 'swing', '조운': 'swing', '하후돈': 'swing', '전위': 'punch',
    '장비': 'swing', '마초': 'swing', '여포': 'swing', '맹획': 'punch',
    '황충': 'nod', '화타': 'nod', '강유': 'swing', '위연': 'swing', '황건적': 'punch',
    '원술': 'laugh', '원소': 'shake', '마속': 'shake'
  };
  var MOTION_MS = { proud: 1800, nod: 1400, laugh: 1200, shake: 1100, sway: 2400, fan: 2200, swing: 1100, punch: 1000 };

  // 대분류별 야근수첩 연결 문구
  var YAGEUN = {
    '권력자형': '높은 자리일수록 퇴근은 늦어지는 법. 오늘 야근, 잠금화면 버튼 한 번으로 남겨 두세요.',
    '정치·처세형': '눈치 보다 늦어진 퇴근도 야근이에요. 기록해 두면 쌓인 시간이 보여요.',
    '천재·전략가형': '결국 내가 다 하다 생긴 야근, 숫자로 남겨야 덜 억울해요.',
    '충성·실무형': '끝까지 책임지느라 쌓인 야근, 기록해 둬야 인정받아요.',
    '행동·돌격형': '일단 달리다 보니 밤 10시? 퇴근 버튼 하나로 야근 기록 끝.',
    '베테랑·전문가형': '나 아니면 안 되는 일, 그 야근 시간도 내 경력이에요.',
    '야망·성장형': '성장하는 만큼 늘어나는 야근, 얼마나 했는지 한눈에 확인하세요.',
    '허세·실속부족형': '바쁜 척 말고 진짜 야근 시간, 정확히 기록해 보세요.'
  };

  // 명패에 쓰는 한자 이름
  var HANJA = { '조조':'曹操','손권':'孫權','동탁':'董卓','조비':'曹丕','유비':'劉備','사마의':'司馬懿','순욱':'荀彧','초선':'貂蟬','양수':'楊修','십상시':'十常侍',
    '제갈량':'諸葛亮','주유':'周瑜','방통':'龐統','육손':'陸遜','관우':'關羽','조운':'趙雲','하후돈':'夏侯惇','전위':'典韋','장비':'張飛','마초':'馬超',
    '여포':'呂布','맹획':'孟獲','황충':'黃忠','화타':'華佗','강유':'姜維','위연':'魏延','황건적':'黃巾賊','원술':'袁術','원소':'袁紹','마속':'馬謖' };
  function plate(c) {
    return '<div class="myeongpae"><span class="hj">' + (HANJA[c.name] || '') + '</span><div class="name">' + esc(c.name) + '</div></div><br>' +
      '<div class="sub">' + esc(c.sub) + '</div>';
  }
  function palaceBtn(id, hanja, label) {
    return '<button class="banner-btn" id="' + id + '"><span><small>' + hanja + '</small>' + label + '</span></button>';
  }

  var state = { q: 0, answers: [], who: 'me', tenure: null, role: null };
  function newState() { return { q: 0, answers: [], who: 'me', tenure: null, role: null, pname: '', ptitle: '' }; }
  // 동료 호칭: '김철수 과장님', 이름만 '김철수 님', 직함만 '과장님', 둘 다 없으면 '그 분'
  function peerLabel(st) {
    var n = (st.pname || '').trim(), t = (st.ptitle || '').trim();
    if (t && !/님$/.test(t)) t += '님';
    if (n && t) return n + ' ' + t; if (n) return n + ' 님'; if (t) return t; return '그 분';
  }
  function peer() { return state.who === 'peer'; }
  var typingTimer = null, loopTimer = null;

  function img(name) { return 'img/' + encodeURIComponent(name) + '.webp'; }
  function byName(n) { return D.chars.filter(function (c) { return c.name === n; })[0]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function stopTimers() { clearTimeout(typingTimer); clearTimeout(loopTimer); clearTimeout(sceneTimer); }
  function seen() { try { return JSON.parse(localStorage.getItem('samguk_seen') || '[]'); } catch (e) { return []; } }
  function markSeen(n) { try { var s = seen(); if (s.indexOf(n) < 0) { s.push(n); localStorage.setItem('samguk_seen', JSON.stringify(s)); } } catch (e) {} }
  function render(html) { stopTimers(); app.innerHTML = '<div class="screen">' + html + '</div>'; window.scrollTo(0, 0); }

  // ---------- 시작 ----------
  // 첫 화면: 삼국지 장수들이 회사에서 일하는 장면 3개가 번갈아 나옴 (시계가 점점 늦어짐)
  var SCENES = [
    { clock: 'PM 6:58', boss: '조조', say: '다음 주까지 처리합시다.', workers: ['조운', '전위', '하후돈'], think: 0, thought: '오늘 퇴근은…?' },
    { clock: 'PM 8:30', boss: '동탁', say: '내가 팀장인데 왜 내 말을 안 들어?', workers: ['원소', '초선', '여포'], think: 2, thought: '다음 부장님은 누구지…' },
    { clock: 'PM 10:47', boss: '제갈량', say: '하아… 이걸 설명하는 것부터가 일이구나.', workers: ['마속', '장비', '강유'], think: 0, thought: '이론적으론 완벽한데요?' }
  ];
  var sceneTimer = null;

  function officeHTML() {
    var desks = [0, 1, 2].map(function (k) {
      return '<div class="worker w' + k + '" id="w' + k + '"><img alt=""><div class="desk"><i class="laptop"></i><i class="papers"></i></div></div>';
    }).join('');
    return '<div class="office-wrap" id="officeWrap"><div class="floor-band"></div><div class="office" id="office" aria-hidden="true">' +
      '<div class="window"><i class="moon"></i><i class="city"></i></div>' +
      '<div class="clock" id="clock">PM 6:58</div>' +
      '<div class="floor"></div>' + desks +
      '<div class="think" id="think"></div>' +
      '<div class="boss" id="boss"><div class="actor" id="actor"><img alt=""></div></div>' +
      '<div class="bubble office-bubble" id="bubble"></div>' +
      '</div></div>';
  }

  function playScenes() {
    var i = 0, office = document.getElementById('office');
    // 다음 장면 이미지 미리 불러오기
    SCENES.forEach(function (sc) { [sc.boss].concat(sc.workers).forEach(function (n) { new Image().src = img(n); }); });
    function show() {
      var sc = SCENES[i % SCENES.length];
      office.classList.add('fade');
      sceneTimer = setTimeout(function () {
        document.getElementById('clock').textContent = sc.clock;
        document.querySelector('#boss img').src = img(sc.boss);
        sc.workers.forEach(function (n, k) { document.querySelector('#w' + k + ' img').src = img(n); });
        var th = document.getElementById('think');
        th.className = 'think t' + sc.think; th.textContent = sc.thought; th.classList.remove('show');
        office.classList.remove('fade');
        speak('“' + sc.say + '”', MOTION[sc.boss] || 'nod', function () {
          // 상사 말이 끝나면 말풍선을 내리고, 직원 속마음을 보여 줌
          document.getElementById('bubble').classList.remove('show');
          th.classList.add('show');
          sceneTimer = setTimeout(function () { i++; show(); }, 2600);
        });
      }, 350);
    }
    show();
  }

  // 첫 화면이 휴대폰 한 화면에 들어오도록 사무실 장면 높이를 남는 공간에 맞춤(170~350px)
  function fitIntro() {
    var wrap = document.getElementById('officeWrap'), sec = app.querySelector('.intro');
    if (!wrap || !sec) return;
    var others = sec.offsetHeight - wrap.offsetHeight;
    var pad = parseFloat(getComputedStyle(app).paddingTop) + parseFloat(getComputedStyle(app).paddingBottom);
    var h = Math.max(150, Math.min(350, window.innerHeight - others - pad - 4));
    var w = wrap.clientWidth, s = Math.min(h / 350, w / 364);
    // 줄어든 만큼 장면을 옆으로 넓혀서 양옆이 비지 않게 함
    wrap.style.setProperty('--oh', h + 'px'); wrap.style.setProperty('--s', s); wrap.style.setProperty('--iw', Math.max(364, w / s) + 'px');
  }

  function intro() {
    render(
      '<section class="intro">' +
      '<div class="hyeonpan"><i></i><h1>직장 삼국지</h1><small>職場三國志</small></div>' +
      '<div class="scroll center lead">우리 조직에서 나는<br>조조일까, 여포일까?<br>일하는 방식으로 알아보는 나의 유형</div>' +
      officeHTML() +
      '<p class="meta">16문항을 답하고 30가지 장수 중 한 명이 되어 보자</p>' +
      '<button class="img-btn" id="start" aria-label="출정하기"><img src="img/ui/btn-start.webp" alt="" width="960" height="296"></button>' +
      '</section>');
    document.getElementById('start').onclick = function () { state = newState(); chooseWho(); };
    fitIntro(); window.onresize = fitIntro;
    // 버튼 이미지·글꼴이 늦게 불러와지면 높이가 바뀌므로 다시 맞춤
    var bi = document.querySelector('#start img'); if (bi && !bi.complete) bi.onload = fitIntro;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitIntro);
    playScenes();
  }

  // ---------- 질문 ----------
  // ---------- 준비: 누구를 / 연차 / 직책 ----------
  function steps() { return peer() ? 4 : 3; }
  function stepScreen(step, title, sub, options, picked, onPick, onBack) {
    var opts = options.map(function (o, k) {
      return '<button class="opt setup' + (picked === k ? ' on' : '') + '" data-k="' + k + '">' +
        (o.img ? '<img src="' + img(o.img) + '" alt="">' : '<span class="k">' + '一二三四'[k] + '</span>') +
        '<span><b>' + esc(o.label) + '</b>' + (o.desc ? '<small>' + esc(o.desc) + '</small>' : '') + '</span></button>';
    }).join('');
    render(
      '<div class="quiz-top"><button class="back" id="back" aria-label="이전">←</button>' +
      '<div class="bar"><i style="width:0%"></i></div><span class="count">준비 ' + step + '/' + steps() + '</span></div>' +
      '<div class="scroll qscroll setup-title"><h2 class="qtext">' + esc(title) + '</h2>' + (sub ? '<p class="setup-sub">' + esc(sub) + '</p>' : '') + '</div>' + opts);
    document.getElementById('back').onclick = onBack;
    Array.prototype.forEach.call(app.querySelectorAll('.opt'), function (b) {
      b.onclick = function () {
        Array.prototype.forEach.call(app.querySelectorAll('.opt'), function (x) { x.classList.toggle('on', x === b); });
        setTimeout(function () { onPick(+b.dataset.k); }, 220);
      };
    });
  }
  function chooseWho() {
    stepScreen(1, '누구를 알아볼까요?', '동료나 팀장님을 떠올리며 대신 답할 수도 있어요.', [
      { label: '나', desc: '내가 직접 답해요', img: '강유' },
      { label: '동료 · 상사', desc: '그 분을 떠올리며 대신 답해요', img: '조조' }
    ], state.who === 'me' && state.tenure !== null ? 0 : (state.who === 'peer' ? 1 : null),
    function (k) { state.who = k === 1 ? 'peer' : 'me'; if (peer()) askName(); else chooseTenure(); }, intro);
  }
  // 동료·상사: 이름과 직함 입력 (둘 다 빈칸이어도 됨 → '그 분')
  function askName() {
    render(
      '<div class="quiz-top"><button class="back" id="back" aria-label="이전">←</button>' +
      '<div class="bar"><i style="width:0%"></i></div><span class="count">준비 2/4</span></div>' +
      '<div class="scroll qscroll setup-title"><h2 class="qtext">어떤 분을 떠올리고 있나요?</h2>' +
      '<p class="setup-sub">결과에 이름과 직함이 같이 나와요. 이 휴대폰에서만 쓰고 어디에도 저장하지 않아요.</p></div>' +
      '<label class="field"><span>이름</span><input id="pname" maxlength="10" placeholder="예: 김철수" value="' + esc(state.pname) + '"></label>' +
      '<label class="field"><span>직함</span><input id="ptitle" maxlength="8" placeholder="예: 과장, 팀장" value="' + esc(state.ptitle) + '"></label>' +
      '<button class="btn btn-wood" id="next">다음</button>');
    document.getElementById('back').onclick = chooseWho;
    document.getElementById('next').onclick = function () {
      state.pname = document.getElementById('pname').value; state.ptitle = document.getElementById('ptitle').value; chooseTenure();
    };
  }
  function chooseTenure() {
    stepScreen(peer() ? 3 : 2, peer() ? peerLabel(state) + '은 회사 생활 몇 년 차인가요?' : '회사 생활 몇 년 차인가요?', '', D.tenures.map(function (t) { return { label: t }; }),
      state.tenure, function (k) { state.tenure = k; chooseRole(); }, peer() ? askName : chooseWho);
  }
  function chooseRole() {
    stepScreen(peer() ? 4 : 3, peer() ? peerLabel(state) + '의 직책은 무엇인가요?' : '지금 직책은 무엇인가요?', '', [{ label: '팀원' }, { label: '팀장' }],
      state.role, function (k) { state.role = k; state.q = 0; question(); }, chooseTenure);
  }

  function question() {
    var i = state.q, Q = (peer() ? D.questionsPeer : D.questions)[i];
    var opts = Q.a.map(function (t, k) {
      var on = state.answers[i] === k ? ' on' : '';
      return '<button class="opt' + on + '" data-k="' + k + '"><span class="k">' + '甲乙丙'[k] + '</span><span>' + esc(t) + '</span></button>';
    }).join('');
    render(
      '<div class="quiz-top"><button class="back" id="back" aria-label="이전">←</button>' +
      '<div class="bar"><i style="width:' + ((i) / 16 * 100) + '%"></i></div><span class="count">' + (i + 1) + ' / 16</span></div>' +
      '<div class="scroll qscroll"><div class="qnum">제' + (i + 1) + '문</div><h2 class="qtext">' + esc(Q.q) + '</h2></div>' + opts);
    document.getElementById('back').onclick = function () { if (state.q === 0) chooseRole(); else { state.q--; question(); } };
    Array.prototype.forEach.call(app.querySelectorAll('.opt'), function (b) {
      b.onclick = function () {
        var k = +b.dataset.k; state.answers[i] = k;
        Array.prototype.forEach.call(app.querySelectorAll('.opt'), function (x) { x.classList.toggle('on', x === b); });
        setTimeout(function () {
          if (state.q < 15) { state.q++; question(); } else loading();
        }, 220);
      };
    });
  }

  function loading() {
    render('<div class="loading"><div><div class="spin"></div><p>군사가 천하의 형세를 살피는 중…</p></div></div>');
    var top = E.judge(state.answers, D, { tenure: state.tenure, role: state.role });
    saveAnswers(state.answers, top[0].char.name);
    var ctx = { who: state.who, tenure: state.tenure, role: state.role, label: peerLabel(state), title: (state.ptitle || '').trim() };
    loopTimer = setTimeout(function () { result(top, false, ctx); }, 1400);
  }

  // 출시 후 보정값을 다시 맞추기 위해 익명 답변을 모으는 자리 (아직 서버 없음)
  function saveAnswers(answers, name) {
    try {
      var log = JSON.parse(localStorage.getItem('samguk_log') || '[]');
      log.push({ a: answers.join(''), r: name, w: state.who, y: state.tenure, p: state.role, t: Date.now() });
      localStorage.setItem('samguk_log', JSON.stringify(log.slice(-20)));
    } catch (e) {}
    // TODO: Firebase/Supabase 연결 후 { a: 'ABBC...', r: 결과, w: 나/동료, y: 연차, p: 직책 } 만 전송 (개인정보 없음)
  }

  // ---------- 결과 ----------
  var lastResult = null;
  function result(top, shared, ctx) {
    ctx = ctx || {};
    lastResult = { top: top, shared: shared, ctx: ctx };
    var me = top[0], c = me.char, isPeer = ctx.who === 'peer';
    var who = isPeer ? (shared ? '그 분' : (ctx.label || '그 분')) : '';
    markSeen(c.name);
    var sim = top.slice(1).map(function (t) {
      return '<button data-n="' + esc(t.char.name) + '"><img src="' + img(t.char.name) + '" alt=""><b>' + esc(t.char.name) + '</b><span>' + esc(t.char.sub) + '</span><span>매칭 ' + t.match + '점</span></button>';
    }).join('');
    render(
      '<section class="result">' +
      (shared ? '<div class="scroll center shared-note">' + (isPeer ? '친구가 공유한 우리 팀 장수예요.' : '친구가 공유한 결과예요.') + '<br>나는 어떤 장수일까요?</div>' : '') +
      '<span class="seal">' + esc(c.type) + '</span>' +
      '<p class="you">' + (isPeer ? '회사에서 <b>' + esc(who) + '</b>은' : (shared ? '이 사람은 회사에서' : '회사에서 당신은')) + '</p>' +
      stageHTML(c) +
      '<p class="tap-hint">캐릭터를 누르면 다시 말해요</p>' +
      plate(c) +
      '<div class="chips">' + c.traits.map(function (t) { return '<span class="chip">' + esc(t) + '</span>'; }).join('') + '</div>' +
      '<div class="scroll"><h3>직장에서는 이런 사람</h3><p>' + esc(c.desc) + '</p></div>' +
      adviceHTML(c, isPeer ? who : null) + partnersHTML(c, isPeer ? who : null) +
      (sim ? '<div class="scroll"><h3>' + (isPeer ? '그 분과 닮은 장수' : '나와 닮은 장수') + '</h3><div class="similar">' + sim + '</div><p class="note">매칭 점수는 앱 안에서 계산한 재미용 점수예요.</p></div>' : '') +
      '<div class="actions">' +
      (shared ? palaceBtn('again', '出 征', '나도 해 보기') :
        palaceBtn('share', '傳 令', '결과 공유하기') +
        '<div class="row"><button class="btn btn-wood" id="save">이미지 저장</button><button class="btn btn-wood" id="again">' + (isPeer ? '다른 사람 보기' : '다시 하기') + '</button></div>') +
      '<button class="btn btn-wood" id="dex">30인 장수 도감</button></div>' +
      '<a class="yageun" href="' + YAGEUN_URL + '" target="_blank" rel="noopener"><span class="ico">🌙</span><span><b>' +
        (isPeer ? esc(c.name) + '형과 일하다 늘어난 야근, 야근수첩' : esc(c.name) + '형 직장인의 야근 관리, 야근수첩') +
        '</b><p>' + esc(isPeer ? '누구 때문에 늦게 퇴근했는지, 오늘 야근부터 잠금화면 버튼 한 번으로 남겨 두세요.' : (YAGEUN[c.type] || '')) + '</p></span></a>' +
      '<div class="ad">광고 자리 (출시 때 애드센스)</div>' +
      '<p class="footer">재미로 보는 테스트예요. 결과는 실제 성격 검사가 아닙니다.<br>캐릭터 이미지 © 직장 삼국지</p>' +
      '</section>');
    startActor(c);
    Array.prototype.forEach.call(app.querySelectorAll('.similar button, .partners button'), function (b) {
      b.onclick = function () { detail(byName(b.dataset.n)); };
    });
    document.getElementById('again').onclick = function () { history.replaceState(null, '', location.pathname); state = newState(); chooseWho(); };
    document.getElementById('dex').onclick = dex;
    var sh = document.getElementById('share'); if (sh) sh.onclick = function () { share(c, isPeer, ctx.title); };
    var sv = document.getElementById('save'); if (sv) sv.onclick = function () { saveImage(c, isPeer); };
  }

  // 조심할 점 + 개선 팁 (동료 모드면 '○○님과 일할 때' 문구)
  function adviceHTML(c, who) {
    return '<div class="scroll advice"><h3>' + (who ? esc(who) + '과 일할 때 알아 둘 점' : '이런 점은 조심해요') + '</h3>' +
      '<p class="warn"><b>주의</b>' + esc(c.caution) + '</p>' +
      '<p class="tip"><b>' + (who ? '이렇게 해 보세요' : '이렇게 바꿔 보세요') + '</b>' + esc(who ? c.tipPeer : c.tipSelf) + '</p></div>';
  }
  // 같이 일하면 좋은 장수 4명 (tools/engine.py의 상호 보완 로직으로 미리 계산)
  function partnersHTML(c, who) {
    if (!c.partners) return '';
    return '<div class="scroll"><h3>' + (who ? esc(who) + '과 잘 맞는 장수' : '같이 일하면 좋은 장수') + '</h3><div class="partners">' +
      c.partners.map(function (p) {
        var pc = byName(p.n);
        return '<button data-n="' + esc(p.n) + '"><img src="' + img(p.n) + '" alt=""><span><b>' + esc(p.n) + '</b><i>' + esc(pc.sub) + '</i><em>' + esc(p.why) + '</em></span></button>';
      }).join('') + '</div></div>';
  }

  function stageHTML(c) {
    return '<div class="stage" id="stage" role="button" aria-label="' + esc(c.name) + ' 다시 말하기">' +
      '<div class="bubble" id="bubble"></div><div class="shadow"></div>' +
      '<div class="body"><div class="actor" id="actor"><img src="' + img(c.name) + '" alt="' + esc(c.name) + '"></div></div></div>';
  }

  // 말풍선 타이핑(말하는 동안 입 뻐끔 느낌) → 캐릭터 고유 동작 → done()
  function speak(text, motion, done) {
    var bubble = document.getElementById('bubble'), actor = document.getElementById('actor');
    clearTimeout(typingTimer); clearTimeout(loopTimer);
    actor.className = 'actor act-talk';
    bubble.classList.remove('show'); void bubble.offsetWidth; bubble.classList.add('show');
    var n = 0;
    (function type() {
      n++; bubble.innerHTML = esc(text.slice(0, n)) + (n < text.length ? '<span class="caret"></span>' : '');
      if (n < text.length) typingTimer = setTimeout(type, 55);
      else {
        actor.className = 'actor'; void actor.offsetWidth;
        actor.className = 'actor act-' + motion;
        loopTimer = setTimeout(function () { actor.className = 'actor'; if (done) done(); }, MOTION_MS[motion]);
      }
    })();
  }

  // 결과 화면: 말하고 → 동작 → 3.2초 쉬고 반복. 누르면 다시
  function startActor(c) {
    var motion = MOTION[c.name] || 'nod', text = '“' + c.quote + '”';
    function play() { speak(text, motion, function () { loopTimer = setTimeout(play, 3200); }); }
    document.getElementById('stage').onclick = play;
    loopTimer = setTimeout(play, 350);
  }

  // ---------- 공유 / 이미지 저장 ----------
  // 카톡 미리보기 카드가 장수별로 나오도록 공유 페이지(r/영문이름.html) 주소를 보냄 → 열면 바로 결과 화면으로 이동
  var SLUG = {'조조':'jojo','손권':'songwon','동탁':'dongtak','조비':'jobi','유비':'yubi','사마의':'samaui','순욱':'sunuk','초선':'choseon',
    '양수':'yangsu','십상시':'sipsangsi','제갈량':'jegallyang','주유':'juyu','방통':'bangtong','육손':'yukson','관우':'gwanu','조운':'jowun',
    '하후돈':'hahudon','전위':'jeonwi','장비':'jangbi','마초':'macho','여포':'yeopo','맹획':'maenghoek','황충':'hwangchung','화타':'hwata',
    '강유':'gangyu','위연':'wiyeon','황건적':'hwanggeonjeok','원술':'wonsul','원소':'wonso','마속':'masok'};
  function share(c, isPeer, title) {
    var base = SITE.replace(/index\.html$/, '');
    var url = base + 'r/' + SLUG[c.name] + (isPeer ? '-team' : '') + '.html';
    // 공유 문구에는 실명을 넣지 않고 직함만 씀
    var t = (title || '').trim(); if (t && !/님$/.test(t)) t += '님';
    var text = isPeer ? '우리 팀 ' + (t || '그 분') + '은 ' + c.name + '(' + c.sub + ')래. 너희 팀엔 어떤 장수가 있어?'
                      : '회사에서 나는 ' + c.name + '(' + c.sub + ')래. 너는 어떤 장수야?';
    // 휴대폰 공유 창이 되면 그걸 쓰고, 안 되면(카톡 안 브라우저 등) 링크 복사 창을 띄움
    if (navigator.share && !/KAKAOTALK/i.test(navigator.userAgent)) {
      navigator.share({ title: '직장 삼국지', text: text, url: url }).catch(function (e) { if (!e || e.name !== 'AbortError') copySheet(text, url); });
    } else copySheet(text, url);
  }

  function sheet(html) {
    var bg = document.createElement('div'); bg.className = 'sheet-bg';
    bg.innerHTML = '<div class="sheet">' + html + '<button class="btn btn-wood" data-close>닫기</button></div>';
    bg.onclick = function (e) { if (e.target === bg || e.target.hasAttribute('data-close')) bg.remove(); };
    document.body.appendChild(bg); return bg;
  }
  function copyText(t, ta) {
    function legacy() { try { ta.focus(); ta.select(); ta.setSelectionRange(0, 99999); return document.execCommand('copy'); } catch (e) { return false; } }
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t).then(function () { return true; }, legacy);
    return Promise.resolve(legacy());
  }
  function copySheet(text, url) {
    var all = text + '\n' + url;
    var bg = sheet('<h3>결과 공유하기</h3><p>아래 링크를 복사해서 카톡에 붙여 넣으세요. 받은 사람에게 내 장수 카드가 보여요.</p>' +
      '<textarea readonly>' + esc(all) + '</textarea><button class="btn btn-palace" id="copyBtn" style="font-size:18px;padding:14px 50px">링크 복사</button><div class="done" id="copyMsg"></div>');
    var ta = bg.querySelector('textarea');
    bg.querySelector('#copyBtn').onclick = function () {
      copyText(all, ta).then(function (ok) {
        bg.querySelector('#copyMsg').textContent = ok ? '복사했어요! 카톡 대화방에 붙여 넣으세요.' : '복사가 안 되면 위 글을 길게 눌러 복사해 주세요.';
      });
    };
  }

  // 결과 이미지: 카톡 카드용으로 만든 장수 카드(img/share)를 그대로 보여 주고 길게 눌러 저장
  function saveImage(c, isPeer) {
    var src = 'img/share/' + SLUG[c.name] + (isPeer ? '-team' : '') + '.jpg';
    var bg = sheet('<h3>결과 이미지</h3><p>이미지를 길게 눌러 <b>사진에 저장</b>하세요. PC에서는 아래 버튼으로 내려받을 수 있어요.</p>' +
      '<img src="' + src + '" alt="' + esc(c.name) + ' 결과 이미지"><a class="btn btn-wood" id="dl" style="text-decoration:none">내려받기</a>');
    var dl = bg.querySelector('#dl'); dl.href = src; dl.download = '직장삼국지_' + c.name + '.jpg';
  }
  function wrap(g, t, max) {
    var out = [], line = '';
    t.split('').forEach(function (ch) { if (g.measureText(line + ch).width > max) { out.push(line); line = ch; } else line += ch; });
    out.push(line); return out;
  }
  function round(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  // ---------- 도감 ----------
  function dex() {
    var s = seen(), types = [];
    D.chars.forEach(function (c) { if (types.indexOf(c.type) < 0) types.push(c.type); });
    var html = types.map(function (t) {
      return '<div class="dex-type">' + esc(t) + '</div><div class="dex">' + D.chars.filter(function (c) { return c.type === t; }).map(function (c) {
        return '<button class="' + (s.indexOf(c.name) < 0 ? 'lock' : '') + '" data-n="' + esc(c.name) + '"><img src="' + img(c.name) + '" alt="" loading="lazy"><b>' + esc(c.name) + '</b><span>' + esc(c.sub) + '</span></button>';
      }).join('') + '</div>';
    }).join('');
    render('<div class="dex-head"><button class="back" id="back" aria-label="결과로">←</button><h2>30인 장수 도감</h2></div>' +
      '<p class="muted small">내가 만난 장수 ' + s.length + ' / 30 · 어두운 장수도 눌러서 볼 수 있어요</p>' + html);
    document.getElementById('back').onclick = function () { if (lastResult) result(lastResult.top, lastResult.shared, lastResult.ctx); else intro(); };
    Array.prototype.forEach.call(app.querySelectorAll('.dex button'), function (b) { b.onclick = function () { detail(byName(b.dataset.n)); }; });
  }

  function detail(c) {
    render('<section class="result"><div class="dex-head"><button class="back" id="back" aria-label="도감으로">←</button></div>' +
      '<span class="seal">' + esc(c.type) + '</span>' + stageHTML(c) + plate(c) +
      '<div class="chips">' + c.traits.map(function (t) { return '<span class="chip">' + esc(t) + '</span>'; }).join('') + '</div>' +
      '<div class="scroll"><h3>직장에서는 이런 사람</h3><p>' + esc(c.desc) + '</p></div>' +
      adviceHTML(c, null) + partnersHTML(c, null) +
      '<div class="actions">' + palaceBtn('go', '出 征', '나도 테스트하기') + '</div></section>');
    document.getElementById('back').onclick = dex;
    Array.prototype.forEach.call(app.querySelectorAll('.partners button'), function (b) { b.onclick = function () { detail(byName(b.dataset.n)); }; });
    document.getElementById('go').onclick = function () { state = newState(); chooseWho(); };
    startActor(c);
  }

  // ---------- 시작점 ----------
  var r = new URLSearchParams(location.search).get('r');
  var shared = r && byName(r);
  if (shared) result([{ char: shared, match: 0 }], true, { who: new URLSearchParams(location.search).get('p') ? 'peer' : 'me' }); else intro();
})();
