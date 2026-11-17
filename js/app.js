// 직장 삼국지 앱 초안 (설치 없이 도는 정적 웹앱)
(function () {
  var D = window.SAMGUK, E = window.SamgukEngine;
  var app = document.getElementById('app');
  var SITE = location.origin + location.pathname;
  var YAGEUN_URL = 'https://overtimenote.kr';
  // 카카오톡 공유 (카카오 개발자 사이트의 JavaScript 키, 사이트에 공개되는 키)
  var KAKAO_JS_KEY = '523d5866bf18feffdf65fdfd3df72bc8';  // '직장삼국지 웹' 키 (JS SDK 도메인 등록된 키)
  try { if (window.Kakao && !Kakao.isInitialized()) Kakao.init(KAKAO_JS_KEY); } catch (e) {}
  // 야근수첩 출시 상태: 스토어 주소가 생기면 여기만 채우면 배너가 휴대폰 종류에 맞게 바뀜
  var YAGEUN_STORE = {
    android: '',   // 예: 'https://play.google.com/store/apps/details?id=...'  (플레이 스토어 출시 후)
    ios: ''        // 예: 'https://apps.apple.com/kr/app/...'                  (앱스토어 출시 후)
  };
  function yageunLink() {
    var ua = navigator.userAgent, isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS && YAGEUN_STORE.ios) return { url: YAGEUN_STORE.ios, tag: '앱스토어', cta: "앱스토어에서 '야근수첩' 검색 후 설치" };
    if (isIOS) return { url: YAGEUN_URL, tag: '아이폰 준비 중', cta: '아이폰 버전 준비 중 · 자세히 보기' };
    if (YAGEUN_STORE.android) return { url: YAGEUN_STORE.android, tag: '구글 플레이', cta: "구글 플레이에서 '야근수첩' 검색 후 설치" };
    return { url: YAGEUN_URL, tag: '곧 출시', cta: "구글 플레이 '야근수첩' 곧 출시" };
  }

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
      yageunHTML(c, isPeer) +
      '<div class="scroll"><h3>직장에서는 이런 사람</h3><p>' + esc(c.desc) + '</p></div>' +
      adviceHTML(c, isPeer ? who : null) + partnersHTML(c, isPeer ? who : null) +
      '<div class="actions">' +
      (shared ? palaceBtn('again', '出 征', '나도 해 보기') :
        palaceBtn('share', '傳 令', '카카오톡으로 공유') +
        '<button class="link-share" id="share2">링크 복사 · 다른 앱으로 공유</button>' +
        '<div class="row"><button class="btn btn-wood" id="save">이미지 저장</button><button class="btn btn-wood" id="again">' + (isPeer ? '다른 사람 보기' : '다시 하기') + '</button></div>') +
      '<button class="btn btn-wood" id="dex">30인 장수 도감</button></div>' +
      yageunHTML(c, isPeer) +
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
    var sh2 = document.getElementById('share2'); if (sh2) sh2.onclick = function () { share(c, isPeer, ctx.title, true); };
    var sv = document.getElementById('save'); if (sv) { sv.onclick = function () { saveImage(c, isPeer, ctx); }; setTimeout(function () { buildImage(c, isPeer, ctx).catch(function () {}); }, 1500); }
  }

  // 야근수첩 배너 (결과 화면 위·아래 두 곳)
  function yageunHTML(c, isPeer) {
    var L = yageunLink();
    return '<a class="yageun" href="' + L.url + '" target="_blank" rel="noopener"><img class="yicon" src="img/ui/yageun-icon.webp" alt="야근수첩"><span>' +
      '<b>' + esc(c.name) + '의 야근 기록, 야근수첩에서 기록해 보세요</b>' +
      '<em class="ycta">' + esc(L.cta) + ' ›</em></span></a>';
  }



  // 조심할 점 + 개선 팁 (동료 모드면 '○○님과 일할 때' 문구)
  function adviceHTML(c, who) {
    return '<div class="scroll advice"><h3>' + (who ? esc(who) + '과 일할 때 알아 둘 점' : '이런 점은 조심해요') + '</h3>' +
      '<p>' + esc(c.caution) + '</p>' +
      '<h3 class="tip-h">' + (who ? '이렇게 해 보세요' : '이렇게 바꿔 보세요') + '</h3>' +
      '<p>' + esc(who ? c.tipPeer : c.tipSelf) + '</p></div>';
  }

  // 같이 일하면 좋은 장수 4명 (tools/engine.py의 상호 보완 로직으로 미리 계산)
  function partnersHTML(c, who) {
    if (!c.partners) return '';
    return '<div class="scroll"><h3>' + (who ? esc(who) + '과 잘 맞는 장수' : '같이 일하면 좋은 장수') + '</h3><div class="partners">' +
      c.partners.map(function (p) {
        var pc = byName(p.n);
        return '<button data-n="' + esc(p.n) + '"><img src="' + img(p.n) + '" alt=""><span><b>' + esc(p.n) + '</b><i>' + esc(pc.sub) + '</i><em>' + esc(p.why) + '</em></span></button>';
      }).join('') + '</div><p class="partner-note">주변에 이런 동료가 있을지 공유해 봐요</p></div>';
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
  function share(c, isPeer, title, other) {
    var base = SITE.replace(/index\.html$/, '');
    var url = base + 'r/' + SLUG[c.name] + (isPeer ? '-team' : '') + '.html';
    // 공유 문구에는 실명을 넣지 않고 직함만 씀
    var t = (title || '').trim(); if (t && !/님$/.test(t)) t += '님';
    var text = isPeer ? '우리 팀 ' + (t || '그 분') + '은 ' + c.name + '(' + c.sub + ')래. 너희 팀엔 어떤 장수가 있어?'
                      : '회사에서 나는 ' + c.name + '(' + c.sub + ')래. 너는 어떤 장수야?';
    if (other) return otherShare(text, url);
    // 1순위: 카카오톡 공유(장수 카드 + '결과 보기'·'나도 테스트하기' 버튼)
    var img = base + 'img/share/' + SLUG[c.name] + (isPeer ? '-team' : '') + '.jpg';
    try {
      if (window.Kakao && Kakao.isInitialized() && Kakao.Share) {
        Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: isPeer ? '우리 팀 ' + (t || '그 분') + '은 ' + c.name + '(' + c.sub + ')' : '회사에서 나는 ' + c.name + ', ' + c.sub,
            description: '“' + c.quote + '” · 일하는 방식으로 알아보는 직장 삼국지',
            imageUrl: img, imageWidth: 1200, imageHeight: 630,
            link: { mobileWebUrl: url, webUrl: url }
          },
          buttons: [
            { title: '결과 보기', link: { mobileWebUrl: url, webUrl: url } },
            { title: '나도 테스트하기', link: { mobileWebUrl: base, webUrl: base } }
          ]
        });
        return;
      }
    } catch (e) {}
    otherShare(text, url);
  }
  // 2순위: 휴대폰 공유 창, 3순위: 링크 복사 창
  function otherShare(text, url) {
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

  // 결과 이미지: 결과 화면 내용을 캔버스로 세로형 이미지(1080px 폭)로 그려서 저장
  function wait(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
  function loadImg(src) {  // 3초 안에 안 오면 그 그림은 빼고 그림
    return Promise.race([new Promise(function (ok) { var im = new Image(); im.onload = function () { ok(im); }; im.onerror = function () { ok(null); }; im.src = src; }),
      wait(3000).then(function () { return null; })]);
  }
  // 결과 화면이 열리면 뒤에서 미리 만들어 두고, 저장 버튼은 만들어 둔 것을 바로 보여 줌
  var imgCache = {};
  function buildImage(c, isPeer, ctx) {
    ctx = ctx || {};
    var label = isPeer ? (ctx.title ? ctx.title + '님' : '그 분') : '';  // 실명은 넣지 않음
    var key = c.name + '|' + label;
    if (imgCache[key]) return imgCache[key];
    var adv = { h1: isPeer ? label + '과 일할 때 알아 둘 점' : '이런 점은 조심해요', p1: c.caution,
      h2: isPeer ? '이렇게 해 보세요' : '이렇게 바꿔 보세요', p2: isPeer ? c.tipPeer : c.tipSelf };
    var parts = (c.partners || []).slice(0, 4);
    var fontsReady = Promise.resolve();
    try {
      if (document.fonts && document.fonts.load) fontsReady = Promise.all([
        document.fonts.load('900 60px "Noto Serif KR"', c.name + c.type), document.fonts.load('700 40px "Noto Serif KR"', c.quote),
        document.fonts.load('600 30px "Noto Serif KR"', c.desc)]).catch(function () {});
    } catch (e) {}
    fontsReady = Promise.race([fontsReady, wait(1500)]);
    var name = '직장삼국지_' + c.name + '.jpg';
    var job = Promise.all([fontsReady, loadImg(img(c.name)), loadImg('img/deco/cloud.svg'), loadImg('img/deco/bg-cloud.svg')].concat(parts.map(function (p) { return loadImg(img(p.n)); })))
      .then(function (r) {
        var canvas = drawResult(c, label, adv, parts, r[1], r.slice(4), r[2], r[3]);
        return new Promise(function (ok, no) {
          function fromDataURL() {
            var d = canvas.toDataURL('image/jpeg', 0.88), bin = atob(d.split(',')[1]), arr = new Uint8Array(bin.length);
            for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
            ok(new Blob([arr], { type: 'image/jpeg' }));
          }
          try { if (canvas.toBlob) canvas.toBlob(function (bl) { if (bl) ok(bl); else { try { fromDataURL(); } catch (e) { no(e); } } }, 'image/jpeg', 0.88); else fromDataURL(); }
          catch (e) { no(e); }
        });
      })
      .then(function (blob) {
        var file = null; try { file = new File([blob], name, { type: 'image/jpeg' }); } catch (e) {}
        return { url: URL.createObjectURL(blob), file: file, name: name };
      });
    job.catch(function () { delete imgCache[key]; });
    imgCache[key] = job;
    return job;
  }
  function saveImage(c, isPeer, ctx) {
    var bg = sheet('<h3>결과 이미지</h3><p id="saveMsg">이미지를 만드는 중이에요…</p><div id="saveBox"></div>');
    var msg = bg.querySelector('#saveMsg'), box = bg.querySelector('#saveBox');
    var card = 'img/share/' + SLUG[c.name] + (isPeer ? '-team' : '') + '.jpg';
    function fallback() {  // 기기에서 그리기가 안 되면 기존 장수 카드라도 보여 줌
      if (box.innerHTML) return;
      msg.innerHTML = '이 기기에서는 전체 이미지를 만들지 못했어요. 장수 카드를 길게 눌러 저장하거나 화면을 캡처해 주세요.';
      box.innerHTML = '<img src="' + card + '" alt=""><a class="btn btn-wood" style="text-decoration:none" href="' + card + '" download="직장삼국지_' + esc(c.name) + '.jpg">내려받기</a>';
    }
    var timer = setTimeout(fallback, 8000);
    buildImage(c, isPeer, ctx).then(function (o) {
      clearTimeout(timer);
      if (box.innerHTML) return;
      var canFile = false; try { canFile = o.file && navigator.canShare && navigator.canShare({ files: [o.file] }); } catch (e) {}
      msg.innerHTML = '이미지를 길게 눌러 <b>사진에 저장</b>하세요.' + (canFile ? ' 아래 버튼으로 저장·공유할 수도 있어요.' : ' PC에서는 내려받기를 누르세요.');
      box.innerHTML = '<img src="' + o.url + '" alt="' + esc(c.name) + ' 결과 이미지">' +
        (canFile ? '<button class="btn btn-palace" id="shareImg" style="font-size:18px;padding:14px 40px">사진 저장 · 공유</button>' : '') +
        '<a class="btn btn-wood" id="dl" style="text-decoration:none" href="' + o.url + '" download="' + o.name + '">내려받기</a>';
      var si = box.querySelector('#shareImg');
      if (si) si.onclick = function () { navigator.share({ files: [o.file] }).catch(function () {}); };
    }, function () { clearTimeout(timer); fallback(); });
  }
  function drawResult(c, label, adv, parts, main, pimgs, cloud, cloudBg) {
    var W = 1080, P = 70, IW = W - P * 2, SERIF = '"Noto Serif KR","Noto Serif CJK KR","AppleMyungjo",serif';
    var cv = document.createElement('canvas'), g = cv.getContext('2d');
    function font(w, s) { g.font = w + ' ' + s + 'px ' + SERIF; }
    // 1차: 높이 계산용으로 글 줄 나누기
    cv.width = W; cv.height = 10;
    font(600, 34); var descL = wrap(g, c.desc, IW - 80), p1L = wrap(g, adv.p1, IW - 80), p2L = wrap(g, adv.p2, IW - 80);
    font(600, 26); var whyL = parts.map(function (p) { return wrap(g, p.why, IW - 230).slice(0, 2); });
    font(700, 40); var quoteL = wrap(g, '“' + c.quote + '”', IW - 120);
    font(600, 32); var chipRows = Math.ceil(c.traits.length / 3);
    var LH = 52;
    var hBubble = 60 + quoteL.length * 56, hChar = 600;
    var hHead = 330 + hBubble, hPlate = 330, hChips = chipRows * 84 + 50;
    var hDesc = 130 + descL.length * LH, hAdv = 230 + (p1L.length + p2L.length) * LH;
    var hPart = parts.length ? 130 + whyL.reduce(function (a, w) { return a + Math.max(130, 70 + w.length * 38); }, 0) : 0;
    var H = hHead + hChar + hPlate + hChips + hDesc + 40 + hAdv + 40 + hPart + 40 + 190;
    cv.width = W; cv.height = H;
    // 배경 (사이트와 같은 구름 무늬)
    g.fillStyle = '#efe3c8'; g.fillRect(0, 0, W, H);
    if (cloudBg) { try { var pt = g.createPattern(cloudBg, 'repeat'); g.save(); g.scale(2.25, 2.25); g.fillStyle = pt; g.fillRect(0, 0, W, H); g.restore(); } catch (e) {} }
    var grd = g.createRadialGradient(W / 2, 0, 50, W / 2, 0, 900); grd.addColorStop(0, 'rgba(255,250,235,.7)'); grd.addColorStop(1, 'rgba(255,250,235,0)');
    g.fillStyle = grd; g.fillRect(0, 0, W, 900);
    // 단청 띠 (위·아래)
    function band(y) {
      var cols = [['#1f6f5c', 36], ['#e2bb5c', 6], ['#c23b2c', 18], ['#e2bb5c', 6], ['#2f4f8f', 30], ['#e2bb5c', 6]];
      for (var x = 0; x < W;) { for (var i = 0; i < cols.length && x < W; i++) { g.fillStyle = cols[i][0]; g.fillRect(x, y, cols[i][1], 30); x += cols[i][1]; } }
      g.fillStyle = '#e2bb5c'; g.fillRect(0, y, W, 4); g.fillStyle = '#8f1d14'; g.fillRect(0, y + 26, W, 6);
    }
    band(0); band(H - 32);
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    function seal(t, cy, size, padX, h) {
      font(800, size); var w = g.measureText(t).width + padX * 2;
      g.fillStyle = '#b3352b'; round(g, W / 2 - w / 2, cy, w, h, 6); g.fill();
      g.strokeStyle = 'rgba(255,240,210,.6)'; g.lineWidth = 3; round(g, W / 2 - w / 2 + 5, cy + 5, w - 10, h - 10, 4); g.stroke();
      g.fillStyle = '#fff4dc'; g.fillText(t, W / 2, cy + h / 2 + size * 0.36);
    }
    var y = 105;
    font(900, 52); g.fillStyle = '#8f1d14'; g.fillText('직장 삼국지', W / 2, y);
    y += 40; seal(c.type, y, 34, 26, 64);
    y += 120; font(600, 38); g.fillStyle = '#6b5238';
    g.fillText(label ? '회사에서 ' + label + '은' : '회사에서 당신은', W / 2, y);
    // 말풍선
    y += 40; font(700, 40);
    var bw = Math.max.apply(null, quoteL.map(function (l) { return g.measureText(l).width; })) + 80, bh = hBubble - 30, bx = W / 2 - bw / 2;
    g.fillStyle = '#2a1a10'; round(g, bx + 8, y + 10, bw, bh, 44); g.fill();
    g.fillStyle = '#fff'; g.strokeStyle = '#2a1a10'; g.lineWidth = 6; round(g, bx, y, bw, bh, 44); g.fill(); g.stroke();
    g.save(); g.translate(W / 2, y + bh); g.rotate(Math.PI / 4); g.fillStyle = '#fff'; g.fillRect(-22, -22, 44, 44);
    g.beginPath(); g.moveTo(22, -22); g.lineTo(22, 22); g.lineTo(-22, 22); g.stroke(); g.restore();
    g.fillStyle = '#2a1a10'; quoteL.forEach(function (l, i) { g.fillText(l, W / 2, y + 66 + i * 56); });
    y += hBubble + 40;
    // 캐릭터
    g.fillStyle = 'rgba(60,30,10,.18)'; g.beginPath(); g.ellipse(W / 2, y + hChar - 30, 220, 32, 0, 0, Math.PI * 2); g.fill();
    if (main) { var s = Math.min((hChar - 10) / main.height, 620 / main.width); var mw = main.width * s, mh = main.height * s; g.drawImage(main, W / 2 - mw / 2, y + hChar - 20 - mh, mw, mh); }
    y += hChar + 20;
    // 명패 (사이트와 같은 검은 바탕 + 금색 테두리 + 양옆 구름)
    var pw = 520, ph = 170, px = W / 2 - pw / 2;
    g.fillStyle = '#5a2d1a'; round(g, px - 14, y - 14, pw + 28, ph + 28, 10); g.fill();
    g.fillStyle = '#c9a24a'; round(g, px - 6, y - 6, pw + 12, ph + 12, 8); g.fill();
    var pg = g.createLinearGradient(0, y, 0, y + ph); pg.addColorStop(0, '#3b2418'); pg.addColorStop(1, '#1e110a');
    g.fillStyle = pg; round(g, px, y, pw, ph, 6); g.fill();
    g.strokeStyle = 'rgba(226,187,92,.55)'; g.lineWidth = 3; round(g, px + 12, y + 12, pw - 24, ph - 24, 4); g.stroke();
    if (cloud) { g.drawImage(cloud, px - 130, y + ph / 2 - 26, 104, 52); g.save(); g.translate(px + pw + 130, 0); g.scale(-1, 1); g.drawImage(cloud, 0, y + ph / 2 - 26, 104, 52); g.restore(); }
    font(600, 30); g.fillStyle = 'rgba(226,187,92,.85)';
    var hj = (HANJA[c.name] || '').split('').join('   '); g.fillText(hj, W / 2, y + 55);
    font(900, 84); var ng = g.createLinearGradient(0, y + 70, 0, y + 150); ng.addColorStop(0, '#fff2c4'); ng.addColorStop(.55, '#e2bb5c'); ng.addColorStop(1, '#b8862c');
    g.fillStyle = ng; g.fillText(c.name, W / 2, y + 145);
    y += ph + 50; seal(c.sub, y, 38, 30, 72);
    y += 110;
    // 칩 (한 줄에 3개)
    font(600, 32); var gap = 16, cwid = (IW - gap * 2) / 3;
    c.traits.forEach(function (t, i) {
      var row = Math.floor(i / 3), inRow = Math.min(3, c.traits.length - row * 3), col = i % 3;
      var rx = W / 2 - (inRow * cwid + (inRow - 1) * gap) / 2 + col * (cwid + gap), ry = y + row * 84;
      var cg = g.createLinearGradient(0, ry, 0, ry + 68); cg.addColorStop(0, '#f8ecd2'); cg.addColorStop(1, '#ead6ad');
      g.fillStyle = cg; g.strokeStyle = '#a47c46'; g.lineWidth = 2.5; round(g, rx, ry, cwid, 68, 6); g.fill(); g.stroke();
      g.fillStyle = '#2a1a10'; var t2 = t; while (g.measureText(t2).width > cwid - 20 && t2.length > 2) t2 = t2.slice(0, -1);
      g.fillText(t2, rx + cwid / 2, ry + 45);
    });
    y += hChips;
    // 두루마리 상자
    function box(h, fn) {
      g.fillStyle = '#fbf3df'; g.strokeStyle = '#cdb68a'; g.lineWidth = 3; round(g, P, y, IW, h, 22); g.fill(); g.stroke();
      g.fillStyle = '#8b5a2b'; g.fillRect(P + 24, y - 8, IW - 48, 12); g.fillRect(P + 24, y + h - 4, IW - 48, 12);
      g.textAlign = 'left'; fn(P + 40, y); g.textAlign = 'center'; y += h + 40;
    }
    function lines(arr, x, yy) { font(600, 34); g.fillStyle = '#2a1a10'; arr.forEach(function (l) { g.fillText(l, x, yy); yy += LH; }); return yy; }
    function head(t, x, yy, col) { font(900, 40); g.fillStyle = col || '#8f1d14'; g.fillText(t, x, yy); }
    box(hDesc, function (x, top) { head('직장에서는 이런 사람', x, top + 76); lines(descL, x, top + 140); });
    box(hAdv, function (x, top) {
      head(adv.h1, x, top + 76); var yy = lines(p1L, x, top + 140);
      head(adv.h2, x, yy + 40, '#1f6f5c'); lines(p2L, x, yy + 104);
    });
    if (parts.length) box(hPart, function (x, top) {
      head(label ? label + '과 잘 맞는 장수' : '같이 일하면 좋은 장수', x, top + 76);
      var yy = top + 120;
      parts.forEach(function (p, i) {
        var rowH = Math.max(130, 70 + whyL[i].length * 38), im = pimgs[i];
        g.fillStyle = '#efe3c8'; round(g, x, yy, 120, 120, 60); g.fill();
        if (im) { g.save(); round(g, x, yy, 120, 120, 60); g.clip(); var s2 = 130 / im.width; g.drawImage(im, x + 60 - im.width * s2 / 2, yy - 4, im.width * s2, im.height * s2); g.restore(); }
        var pc = byName(p.n);
        font(900, 36); g.fillStyle = '#2a1a10'; g.fillText(p.n, x + 150, yy + 42);
        var nw = g.measureText(p.n).width; font(600, 26); g.fillStyle = '#6b5238'; g.fillText(pc ? pc.sub : '', x + 166 + nw, yy + 42);
        font(600, 26); g.fillStyle = '#2a1a10'; whyL[i].forEach(function (l, k) { g.fillText(l, x + 150, yy + 86 + k * 38); });
        yy += rowH;
      });
    });
    // 맨 아래 주소
    font(700, 34); g.fillStyle = '#6b5238'; g.fillText('나도 테스트하기', W / 2, H - 120);
    font(900, 40); g.fillStyle = '#8f1d14'; g.fillText('samguk.overtimenote.kr', W / 2, H - 66);
    return cv;
  }
  // 띄어쓰기 단위로 줄 나누기 (한 단어가 너무 길면 글자 단위)
  function wrap(g, t, max) {
    var out = [], line = '';
    String(t).split(' ').forEach(function (w) {
      var test = line ? line + ' ' + w : w;
      if (g.measureText(test).width <= max) { line = test; return; }
      if (line) out.push(line);
      line = '';
      w.split('').forEach(function (ch) { if (g.measureText(line + ch).width > max) { out.push(line); line = ch; } else line += ch; });
    });
    if (line) out.push(line); return out;
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
