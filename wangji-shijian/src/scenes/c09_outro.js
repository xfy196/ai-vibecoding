// c09_outro.js — 尾奏（224.00 – 272.14 s）天亮了
//   AI 224.00–233.00 金色褪成苍白；花瓣往上升；屋顶变回序里那片山
//   AJ 233.00–242.00 他沿着同一条路往回走（天已亮）；天上钟的指针越来越慢，停住
//   AK 242.00–252.00 那片枫叶第一次往下落；他伸出手；叶子落进掌心
//   AL 252.00–262.00 他合上手掌，抬头；天彻底亮开，几只鸟飞过
//   AM 262.00–272.14 大远景：天亮了的空山与路；他小小的，从右边走出画面；淡回纸色
(() => {
  const C = SET.C;
  const SKY = { base: '#A8C4E0', top: '#8FB0E0', mid: '#CBD8E8', warm: '#F0E2C8', cool: '#A8C4E0' };
  const HILL = ['#B2C1D4', '#8A9AB0', '#6E7E96'];
  const GROUND = '#E8D2A8', ROAD = '#F0E2C8';
  const G = 896;

  function dawnSky(t, k) {   // k: 0 = 记忆的金，1 = 天亮
    SET.sky(t, { hz: .80, base: mixCol('#F2C87E', SKY.base, k), baseOp: 145, top: mixCol('#D98B52', SKY.top, k), topOp: 85,
      mid: mixCol('#E8AE72', SKY.mid, k), midOp: 45, warm: mixCol('#F2C57A', SKY.warm, k), warmOp: 70 + 40 * k,
      cool: mixCol('#C98B4C', SKY.cool, k), coolOp: 40 });
  }

  // ================= AI 224.00–233.00 =================
  function shotAI(t, lt, dur) {
    const k = ease(seg(lt, 0, 6.4));
    camBegin(960, 650, 1.04 + .06 * ease(seg(lt, 0, dur)));
    dawnSky(t, k);
    // 屋顶慢慢塌成山
    SET.boil('roof');
    const rc = mixCol('#C08F63', HILL[2], k);
    paint(rectPts(-200, G - 24 + 40 * k, W + 400, 460, 2), { wash: rc, washOp: 245, fill: mixCol('#A8703F', C.night, k * .4), fillOp: 105, bleed: .1, tex: .55, ink: C.ink, sw: 1 });
    SET.hills(t, [{ cx: 960, cy: 900, rx: 1400, ry: 90 + 40 * k, col: HILL[1], fillOp: 60 + 40 * k, ink: null }]);
    // 花瓣往上升
    SET.petalFall(t, 14, { y0: 940, y1: 120, sp: -70, r: 14, col: mixCol(C.roseLt, C.cream, k), sway: 80 });
    glow(960, G - 220, 700 * (1 - k * .6), '#FFC766', .3 * (1 - k * .5));
    const mood = emotions(lt, [[0, 'cry'], [4.0, 'sad'], [7.0, 'relieved']]);
    SET.him(820, G, 24, { ...mood, view: 'q', aL: -.3, aR: -.3, lookY: .2, boilKey: 'himAI' });
    camEnd();
  }

  // ================= AJ 233.00–242.00 =================
  function shotAJ(t, lt, dur) {
    const x = lerp(560, 1240, ease(seg(lt, .4, dur - 1.2)));
    camBegin(x + 80, 660, 1.0);
    dawnSky(t, 1);
    // 钟的指针越来越慢，最后停住
    const slow = ease(seg(lt, 0, dur));
    SET.clock(1160, 300, 168, t, { hand: -.075 * (lt + 233) * (1 - .92 * slow), fade: .42, bg: SKY.base, face: '#FBF3E4' });
    SET.hills(t, [
      { cx: 900, cy: 700, rx: 1200, ry: 150, col: HILL[0], fillOp: 85, seed: 4 },
      { cx: 520, cy: 780, rx: 900, ry: 170, col: HILL[1], fillOp: 105, seed: 2, tufts: 8 },
      { cx: 1600, cy: 812, rx: 1000, ry: 186, col: HILL[2], fillOp: 120, seed: 4, tufts: 10 },
    ]);
    SET.ground(t, G, GROUND, { fillOp: 95 });
    SET.road(x + 260, G + 6, 260, x + 900, 794, 26, ROAD, { fillOp: 75, ink: null });
    SET.road(x - 900, G + 6, 300, x + 40, 800, 28, ROAD, { fillOp: 75, ink: null });
    const walk = (x - 560) / (4.2 * 20);
    const mood = emotions(lt, [[0, 'relieved'], [4.0, 'sad'], [7.0, 'neutral']]);
    SET.him(x, G, 20, { ...mood, view: 'side', walk: walk + .1, dy: (mood.dy || 0) * .4, boilKey: 'himAJ' });
    camEnd();
  }

  // ================= AK 242.00–252.00 =================
  function shotAK(t, lt, dur) {
    const fall = ease(seg(lt, .3, 6.6));
    camBegin(lerp(980, 1000, fall), lerp(700, 690, fall), lerp(1.06, 1.5, ease(seg(lt, 4.4, dur))));
    dawnSky(t, 1);
    SET.hills(t, [
      { cx: 900, cy: 704, rx: 1200, ry: 150, col: HILL[0], fillOp: 85, seed: 4 },
      { cx: 1560, cy: 812, rx: 1000, ry: 186, col: HILL[2], fillOp: 120, seed: 6, tufts: 9 },
    ]);
    SET.ground(t, G, GROUND, { fillOp: 95 });

    const u = 22, hx = 1000;
    const mood = emotions(lt, [[0, 'sad'], [4.0, 'hopeful'], [7.4, 'relieved']]);
    // 伸手
    const reach = easeOut(seg(lt, 3.4, 4.6));
    SET.him(hx, G, u, { ...mood, view: 'front', aR: lerp(-.35, 1.45, reach), aL: -.3, lookY: -1, boilKey: 'himAK' });
    // 叶子第一次往下落，落进掌心
    const ly = lerp(-140, G - 5.4 * u - 6, easeIn(fall));
    const lx = lerp(hx + 300, hx + 8, easeOut(fall)) + Math.sin(fall * 8) * 60 * (1 - fall);
    SET.leaf(lx, ly, lerp(46, 30, fall), fall * 5 + Math.sin(fall * 6), { key: 'akleaf', col: C.ochre });
    // 落定的一点小光
    if (fall > .96) glow(hx + 8, G - 5.4 * u - 6, 150, '#FFD08A', .5);
    camEnd();
  }

  // ================= AL 252.00–262.00 =================
  function shotAL(t, lt, dur) {
    const up = ease(seg(lt, .4, 4.0));
    camBegin(lerp(1000, 990, up), lerp(690, 430, up), lerp(1.2, .92, up));
    dawnSky(t, 1);
    SET.hills(t, [
      { cx: 900, cy: 704, rx: 1200, ry: 150, col: HILL[0], fillOp: 85, seed: 4 },
      { cx: 1560, cy: 812, rx: 1000, ry: 186, col: HILL[2], fillOp: 120, seed: 6, tufts: 9 },
    ]);
    SET.ground(t, G, GROUND, { fillOp: 95 });
    // 天彻底亮开
    const open = ease(seg(lt, 2.2, 6.4));
    glow(960, 640, 900 + 500 * open, '#FFE9C0', .35 * open);
    // 几只鸟飞过
    for (let i = 0; i < 4; i++) {
      const bx = lerp(-200, W + 240, frac(hash(i + 5) + lt * .18));
      SET.bird(bx, 300 + i * 46 + Math.sin(lt + i) * 14, 24 - i * 2, t, i * 1.7, mixCol(C.ink, SKY.base, .3));
    }
    const u = 22, hx = 1000;
    const mood = emotions(lt, [[0, 'relieved'], [4.4, 'hopeful'], [7.0, 'happy']]);
    // 合掌 → 抬头
    const close = easeOut(seg(lt, .6, 2.0));
    SET.him(hx, G, u, { ...mood, view: 'front', aL: lerp(1.4, .3, close), aR: lerp(1.4, .3, close), lookY: -1, boilKey: 'himAL' });
    camEnd();
  }

  // ================= AM 262.00–272.14 =================
  function shotAM(t, lt, dur) {
    const x = lerp(700, 1760, ease(seg(lt, 0, 7.4)));
    camBegin(960, 640, 1.0 - .03 * ease(seg(lt, 0, dur)));
    dawnSky(t, 1);
    SET.hills(t, [
      { cx: 900, cy: 700, rx: 1200, ry: 150, col: HILL[0], fillOp: 85, seed: 4 },
      { cx: 520, cy: 782, rx: 900, ry: 170, col: HILL[1], fillOp: 105, seed: 2, tufts: 8 },
      { cx: 1600, cy: 812, rx: 1000, ry: 186, col: HILL[2], fillOp: 120, seed: 4, tufts: 10 },
    ]);
    SET.ground(t, G, GROUND, { fillOp: 95 });
    SET.road(x + 220, G + 6, 220, x + 900, 796, 24, ROAD, { fillOp: 70, ink: null });
    const walk = (x - 700) / (4.2 * 13);
    SET.him(x, G, 13, { ...feel('relieved', t), view: 'side', walk: walk + .1, boilKey: 'himAM' });
    // 一只鸟远远跟着
    SET.bird(lerp(300, 1500, ease(seg(lt, 0, dur))), 250 + Math.sin(lt * .8) * 20, 16, t, .5, mixCol(C.ink, SKY.base, .35));
    camEnd();
    // 淡回纸色
    const out = ease(seg(lt, dur - 3.4, dur - .1));
    if (out > .01) iris(960, 540, lerp(1900, 0, out), PAL.paper);
  }

  shots([
    [224.00, shotAI],
    [233.00, shotAJ],
    [242.00, shotAK],
    [252.00, shotAL],
    [262.00, shotAM],
  ]);
})();
