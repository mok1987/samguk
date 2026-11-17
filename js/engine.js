// 직장 삼국지 판정 엔진. tools/engine.py 와 같은 계산을 한다.
// 1) 캐릭터별 기대 답과 비교해 원점수(0~100)를 낸다.
// 2) 보통 사람 기준 평균(mu)·표준편차(sd)로 보정한다. → 무난한 답 캐릭터 쏠림 방지
// 3) 보정 점수가 가장 높은 1명 + 다음 2명을 돌려준다.
(function (root) {
  function rawScores(answers, D) {
    var wsum = D.weights.reduce(function (a, b) { return a + b; }, 0);
    return D.chars.map(function (c) {
      var s = 0;
      for (var q = 0; q < 16; q++) {
        var p = c.profile.charCodeAt(q) - 65, d = Math.abs(answers[q] - p), v;
        if (D.nominal.indexOf(q) >= 0) v = d === 0 ? 1 : 0;
        else v = d === 0 ? 1 : (d === 1 ? D.adj : 0);
        s += v * D.weights[q];
      }
      return s / wsum * 100;
    });
  }

  // 연차(0~3)·직책(0 팀원, 1 팀장)에 따른 캐릭터별 가산점
  function ctxBonus(name, ctx, D) {
    if (!ctx) return 0;
    var b = 0, c = D.tenureCenter[name];
    if (c !== undefined && ctx.tenure !== undefined) b += D.tenureStep[Math.abs(ctx.tenure - c)];
    if (ctx.role !== undefined) {
      if (D.leader.indexOf(name) >= 0) b += ctx.role === 1 ? 0.3 : -0.2;
      if (D.member.indexOf(name) >= 0) b += ctx.role === 0 ? 0.2 : -0.2;
    }
    return b;
  }

  function judge(answers, D, ctx) {
    var raw = rawScores(answers, D);
    var list = raw.map(function (r, i) {
      return { i: i, raw: r, z: (r - D.mu[i]) / D.sd[i] + ctxBonus(D.chars[i].name, ctx, D) };
    });
    // 보정 점수 → 원점수 → 목록 순서로 정렬(동점이 사실상 없지만 안전장치)
    list.sort(function (a, b) { return (b.z - a.z) || (b.raw - a.raw) || (a.i - b.i); });
    return list.slice(0, 3).map(function (x) {
      // 화면용 '매칭 점수'(앱 내부 점수, 심리검사 정확도 아님): 원점수를 그대로 사용
      return { char: D.chars[x.i], match: Math.round(x.raw), z: x.z };
    });
  }

  var api = { rawScores: rawScores, judge: judge, ctxBonus: ctxBonus };
  if (typeof module !== 'undefined') module.exports = api; else root.SamgukEngine = api;
})(this);
