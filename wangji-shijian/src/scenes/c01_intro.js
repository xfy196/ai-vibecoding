// c01_intro.js — 序 · 逆流（0.00 – 33.54 s）
//   A 0.00–8.20   黄昏大远景：远山、天上的巨钟（指针倒着走）、枫叶逆着重力往上飘
//   B 8.20–16.20  近景：一片枫叶打转飘过；叶子后面路浮出来；他从左边走进画面
//   C 16.20–24.20 中景：他停下抬头；钟的指针猛地倒转、风起；他低头看脚，一圈光逆着流过地面
//   D 24.20–33.54 他跟镜向右走；身后的景倒放（篱笆自己立起来、鸟倒着飞）；笔刷擦出
(() => {
  const C = SET.C;
  // 这一章的黄昏色（都偏淡，纸要透出来）
  const SKY = { base: '#A8C4E0', top: '#4D74CD', mid: '#8FB0E0', warm: '#E8D2A8', cool: '#A8C4E0' };
  const HILL = ['#B2C1D4', '#8A9AB0', '#6E7E96'];
  const GROUND = '#C9A87A', ROAD = '#F0E2C8';
  const CLOCK = { x: 1010, y: 300, r: 108 };

  // ---------- 道具 ----------
  // 一片往上飘的叶子。i 只固定相位，位置是 lt 的纯函数。
  function leafUp(lt, i, o = {}) {
    const sp = o.sp ?? 74, x0 = o.x0 ?? hash(i) * (W + 300) - 150, y0 = o.y0 ?? 1010;
    const y = y0 - sp * lt - 40 * hash(i + 7);
    const x = x0 + Math.sin(lt * (.45 + .3 * hash(i + 3)) + hash(i) * 7) * (o.sway ?? 70);
    if (y < -140 || y > H + 200) return;
    const rot = Math.sin(lt * 1.1 + hash(i + 5) * 6) * .9 + lt * .3;
    SET.leaf(x, y, o.r ?? (19 + 12 * hash(i + 9)), rot, { key: 'leafup' + i, col: mixCol(C.ochre, C.rose, hash(i + 2) * .55) });
  }

  // 倒着往上飞的雨丝（世界在倒放）
  function rainUp(lt) {
    for (let i = 0; i < 22; i++) {
      SET.boil('rainup' + i);
      const ph = frac(hash(i + 20) + lt * 1.5), y = H + 60 - ph * (H + 200);
      const x = hash(i) * (W + 300) - 150;
      inkLine([[x, y], [x - 12, y + 34]], .8, SET.fade(SKY.top, PAL.paper, .25), 'inkfine', .2);
    }
  }

  // 篱笆：每根柱子有自己的"立起来"时刻
  function fence(lt, t0, x0, n) {
    for (let i = 0; i < n; i++) {
      const ti = t0 + i * .16, k = easeOut(seg(lt, ti, ti + .5));
      if (k <= .01) return;
      const x = x0 + i * 96, y = 884 + (i % 3) * 8, h = 98 * k, w = 6;
      SET.boil('fence' + i);
      paint(rectPts(x - w / 2, y - h, w, h, 1.2), { wash: '#C0AE8E', fill: '#8E8064', fillOp: 90, bleed: .08, tex: .5, ink: C.ink, sw: .7 });
      if (k > .8) { SET.boil('fencebar' + i); inkLine([[x, y - h * .74], [x + 96, y - h * .74]], .7, C.ink, 'ink', 0); }
    }
  }

  // ================= A 0.00–8.20 =================
  function shotA(t, lt, dur) {
    camBegin(960 + 26 * Math.sin(lt * .22), 528 - lt * 3.2, 1 + .010 * lt);
    SET.sky(t, { hz: .78, base: SKY.base, baseOp: 145, top: SKY.top, topOp: 90, mid: SKY.mid, midOp: 45, warm: SKY.warm, warmOp: 110, cool: SKY.cool, coolOp: 45 });
    SET.clock(CLOCK.x, CLOCK.y, CLOCK.r, t, { hand: -.075 * lt, fade: .22, bg: SKY.top, face: '#FBF3E4' });
    SET.hills(t, [
      { cx: 900, cy: 686, rx: 1180, ry: 150, col: HILL[0], fillOp: 150, seed: 4 },
      { cx: 520, cy: 760, rx: 900, ry: 168, col: HILL[1], fillOp: 175, seed: 2, tufts: 9 },
      { cx: 1420, cy: 800, rx: 1000, ry: 186, col: HILL[2], fillOp: 195, seed: 6, tufts: 11 },
    ]);
    SET.ground(t, 880, GROUND, { fillOp: 190 });
    for (let i = 0; i < 5; i++) leafUp(lt, i, { sp: 62 + 16 * hash(i + 40), y0: 960 });
    camEnd();
    if (lt < 1.15) iris(960, 540, lerp(0, 1750, easeIn(lt / 1.15)), PAL.paper);   // 从纸色开出来
  }

  // ================= B 8.20–16.20 =================
  function shotB(t, lt, dur) {
    camBegin(960 + 14 * Math.sin(lt * .3), 520 - lt * 2, 1.02 + .006 * lt);
    SET.sky(t, { hz: .78, base: SKY.base, baseOp: 145, top: SKY.top, topOp: 92, mid: SKY.mid, midOp: 45, warm: SKY.warm, warmOp: 110, cool: SKY.cool, coolOp: 45 });
    // SET.clock(CLOCK.x, CLOCK.y, CLOCK.r, t, { hand: -.075 * (lt + 8.2), fade: .40, bg: SKY.top, face: '#FBF3E4' });
    SET.hills(t, [
      { cx: 900, cy: 692, rx: 1180, ry: 150, col: HILL[0], fillOp: 150, seed: 4 },
      { cx: 520, cy: 768, rx: 900, ry: 168, col: HILL[1], fillOp: 175, seed: 2, tufts: 9 },
      { cx: 1420, cy: 806, rx: 1000, ry: 186, col: HILL[2], fillOp: 195, seed: 6, tufts: 11 },
    ]);
    SET.ground(t, 886, GROUND, { fillOp: 190 });
    SET.road(1080, 900, 210, 980, 792, 26, ROAD, { fillOp: 155, ink: null });

    // 他从左边走进来
    const u = 15.5, x = lerp(-120, 560, ease(seg(lt, 3.6, 7.6)));
    const walk = (lt > 3.6 && lt < 7.6) ? (x + 120) / (4.2 * u) : 0;
    if (lt > 3.3) {
      const mood = emotions(lt, [[3.5, 'sad'], [5.6, 'neutral']]);
      SET.him(x, 902, u, { ...mood, view: 'side', walk: walk + .1, dy: (mood.dy || 0) * .5, boilKey: 'himB' });
    }
    // 那片叶子：打转、从镜头前掠过
    const ly = lerp(1040, 150, easeOut(seg(lt, 0, 6.4))), lx = 900 + Math.sin(lt * .8) * 70;
    const lr = lerp(96, 30, ease(seg(lt, 0, 6.4)));
    SET.leaf(lx, ly, lr, lt * .55 + Math.sin(lt) * .5, { key: 'bigleaf', col: C.ochre });
    for (let i = 0; i < 4; i++) leafUp(lt + 3, i + 20, { sp: 58 + 14 * hash(i), y0: 980, sway: 46, r: 12 });
    camEnd();
  }

  // ================= C 16.20–24.20 =================
  const C_GROUND = 902, C_U = 23, C_X = 940;
  function shotC(t, lt, dur) {
    const push = ease(seg(lt, 0, dur));
    camBegin(C_X, 700, 1.05 + .22 * push);
    SET.sky(t, { hz: .82, base: SKY.base, baseOp: 145, top: SKY.top, topOp: 92, mid: SKY.mid, midOp: 45, warm: SKY.warm, warmOp: 110, cool: SKY.cool, coolOp: 45 });
    SET.clock(1080, 300, 150, t, { hand: -.075 * (lt + 16.2) - 1.5 * easeIn(seg(lt, 1.6, 4.4)), fade: .30, bg: SKY.top, face: '#FBF3E4' });
    SET.hills(t, [
      { cx: 900, cy: 700, rx: 1200, ry: 150, col: HILL[0], fillOp: 145, seed: 4 },
      { cx: 1420, cy: 800, rx: 1000, ry: 186, col: HILL[2], fillOp: 195, seed: 6, tufts: 10 },
    ]);
    SET.ground(t, C_GROUND, GROUND, { fillOp: 190 });

    // 风起：叶子被抽上去
    const gust = ease(seg(lt, 1.5, 3.2));
    for (let i = 0; i < 6; i++) leafUp(lt * (1 + 1.4 * gust), i + 50, { sp: 90 + 60 * gust, y0: 960, sway: 60 + 90 * gust, r: 12 });

    const mood = emotions(lt, [[0, 'sad'], [1.35, 'surprised', { lookY: -.8 }], [3.5, 'confused'], [5.6, 'determined']]);
    const look = lt > 6.2 ? { lookY: 1, lookX: 0 } : {};
    SET.him(C_X, C_GROUND, C_U, { ...mood, ...look, view: 'q', flip: true, aL: -.5, aR: -.55, boilKey: 'himC' });

    // 地面上一圈光逆着（从右往左）流过
    for (let i = 0; i < 4; i++) {
      const ph = seg(lt, 6.0 + i * .22, 7.4 + i * .22);
      if (ph <= 0 || ph >= 1) continue;
      const x = lerp(1750, -200, ph);
      SET.boil('ripple' + i);
      inkLine([[x, C_GROUND + 6], [x - 200, C_GROUND + 16], [x - 420, C_GROUND + 22]], 1.1, '#C98B3C', 'inkfine', .5);
    }
    camEnd();
  }

  // ================= D 24.20–33.54 =================
  const D_GROUND = 898, D_U = 20;
  function shotD(t, lt, dur) {
    const x = lerp(560, 1500, ease(seg(lt, 1.0, dur - 1.6)));
    camBegin(x + 60, 640, 1.0);
    SET.sky(t, { hz: .80, base: SKY.base, baseOp: 145, top: SKY.top, topOp: 95, mid: SKY.mid, midOp: 45, warm: SKY.warm, warmOp: 110, cool: SKY.cool, coolOp: 45 });
    // SET.clock(CLOCK.x, CLOCK.y, CLOCK.r, t, { hand: -.075 * (lt + 24.2), fade: .42, bg: SKY.top, face: '#FBF3E4' });
    SET.hills(t, [
      { cx: 900, cy: 700, rx: 1200, ry: 152, col: HILL[0], fillOp: 145, seed: 4 },
      { cx: 1500, cy: 806, rx: 1000, ry: 186, col: HILL[2], fillOp: 195, seed: 2, tufts: 10 },
    ]);
    SET.ground(t, D_GROUND, GROUND, { fillOp: 190 });
    SET.road(x + 100, D_GROUND + 4, 300, x + 40, 800, 30, ROAD, { fillOp: 130, ink: null });

    fence(lt, 2.2, x - 720, 7);
    rainUp(lt);
    if (lt > 4.0) {
      const bx = lerp(1560, 380, ease(seg(lt, 4.0, 7.6)));
      SET.bird(bx, 560 + Math.sin(lt * 1.4) * 20, 26, -t, 1.3, mixCol(C.ink, SKY.top, .25));
    }
    const walk = lt > 1.0 ? (x - 560) / (4.0 * D_U) : 0;
    const mood = emotions(lt, [[0, 'determined'], [6.0, 'sad']]);
    SET.him(x, D_GROUND, D_U, { ...mood, view: 'side', walk: walk + .1, dy: (mood.dy || 0) * .5 + (lt > 1 ? -Math.abs(Math.sin(walk * 2)) * .4 : 0), boilKey: 'himD' });
    camEnd();
    SET.boil('wipeD');
    if (lt > dur - .34) brushWipe((lt - (dur - .34)) / .68, ['#8E9DBF', SKY.top]);
  }

  shots([
    [0.00, shotA],
    [8.20, shotB],
    [16.20, shotC],
    [24.20, shotD],
  ]);
})();
