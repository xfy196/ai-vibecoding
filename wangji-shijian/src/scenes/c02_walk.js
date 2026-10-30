// c02_walk.js — 主歌一前半（33.54 – 63.13 s）
//   E 33.54–40.98 「沉默着走了有 多遥远」  长跟拍：他沿路走，身后的路越来越短
//   F 40.98–47.78 「抬起头 蓦然间 才发现」 他停下抬头；镜头摇上天空：巨钟，和朝他折回来的山
//   G 47.78–55.37 「一直倒退 倒退到原点」  世界倒带：他被拽着退过篱笆、自行车、猫，停在门框前
//   H 55.37–63.13 「倔强坚持 对抗时间」    他顶住倒带硬扛，风终于停了
(() => {
  const C = SET.C;
  const SKY = { base: '#A8C4E0', top: '#4D74CD', mid: '#8FB0E0', warm: '#E8D2A8', cool: '#A8C4E0' };
  const HILL = ['#B2C1D4', '#8A9AB0', '#6E7E96'];
  const GROUND = '#C9A87A', ROAD = '#F0E2C8';
  const CLOCK = { x: 1010, y: 300, r: 108 };

  function skyBase(t, hz, warmOp = 215) {
    SET.sky(t, { hz, base: SKY.base, baseOp: 165, top: SKY.top, topOp: 80, mid: SKY.mid, midOp: 45, warm: SKY.warm, warmOp, cool: SKY.cool, coolOp: 45 });
  }

  // ---------- 道具 ----------
  // 门框：两根柱子 + 一根横梁，是"原点"
  function gate(x, gy, s, o = {}) {
    const w = 260 * s, h = 300 * s, pw = 26 * s;
    SET.boil('gate');
    const col = o.col || '#C6B394';
    for (const sx of [-w / 2, w / 2 - pw]) {
      paint(rectPts(x + sx, gy - h, pw, h, 2), { wash: col, washOp: 245, fill: mixCol(col, C.night, .5), fillOp: 110, bleed: .1, tex: .5, ink: C.ink, sw: 1.1 });
    }
    paint(rectPts(x - w / 2 - 14 * s, gy - h - 22 * s, w + 28 * s, 30 * s, 2), { wash: col, washOp: 245, fill: mixCol(col, C.night, .5), fillOp: 110, bleed: .1, tex: .5, ink: C.ink, sw: 1.1 });
  }
  // 自行车：两个轮子 + 一个三角架，纯墨线
  function bicycle(x, gy, s, col) {
    SET.boil('bike');
    inkLine(ellPts(x - 46 * s, gy - 46 * s, 46 * s, 46 * s, 18), 1.1, col, 'ink', .4);
    inkLine(ellPts(x + 46 * s, gy - 46 * s, 46 * s, 46 * s, 18), 1.1, col, 'ink', .4);
    inkLine([[x - 46 * s, gy - 46 * s], [x - 8 * s, gy - 96 * s], [x + 30 * s, gy - 96 * s], [x + 46 * s, gy - 46 * s]], 1.1, col, 'ink', .3);
    inkLine([[x - 8 * s, gy - 96 * s], [x + 46 * s, gy - 46 * s]], 1.1, col, 'ink', 0);
    inkLine([[x + 30 * s, gy - 96 * s], [x + 24 * s, gy - 120 * s], [x + 44 * s, gy - 122 * s]], 1.1, col, 'ink', .3);
  }
  // 猫：一坨剪影 + 两只耳朵 + 一条尾巴
  function cat(x, gy, s, t, col) {
    SET.boil('cat');
    const sway = Math.sin(t * 2.2) * 12 * s;
    paint(ellPts(x, gy - 30 * s, 40 * s, 26 * s, 16), { wash: col, washOp: 250, ink: C.ink, sw: .9 });
    paint(ellPts(x + 30 * s, gy - 54 * s, 17 * s, 16 * s, 12), { wash: col, washOp: 250, ink: C.ink, sw: .9 });
    inkLine([[x + 22 * s, gy - 66 * s], [x + 20 * s, gy - 82 * s]], 1, C.ink, 'ink', 0);
    inkLine([[x + 38 * s, gy - 66 * s], [x + 42 * s, gy - 82 * s]], 1, C.ink, 'ink', 0);
    SET.boil('cattail');
    paint(ribbon([[x - 36 * s, gy - 34 * s], [x - 66 * s, gy - 48 * s + sway * .3], [x - 74 * s, gy - 80 * s + sway]], 11 * s, 5 * s), { wash: col, washOp: 250, ink: C.ink, sw: .9 });
  }
  // 被风横扫的一把叶子
  function leafWind(t, lt, n, x0, x1, y0, y1, key, colA) {
    for (let i = 0; i < n; i++) {
      const ph = frac(hash(i + key) + lt * (.6 + .5 * hash(i + 9)));
      const x = lerp(x0, x1, ph), y = lerp(y0, y1, hash(i + 3)) + Math.sin(ph * 9 + i) * 40;
      SET.leaf(x, y, 11 + 7 * hash(i + 5), ph * 14 + i, { key: 'lw' + key + i, col: mixCol(colA, C.rose, hash(i + 2) * .6), ink: null });
    }
  }

  // ================= E 33.54–40.98 =================
  const E_G = 898, E_U = 19;
  function shotE(t, lt, dur) {
    const x = lerp(700, 1180, ease(seg(lt, 0, dur)));
    camBegin(x + 120, 660, 1.02);
    skyBase(t, .80);
    // SET.clock(CLOCK.x + 120, CLOCK.y, CLOCK.r, t, { hand: -.075 * (lt + 33.54), fade: .40, bg: SKY.base, face: '#FBF3E4' });
    SET.hills(t, [
      { cx: 900, cy: 690, rx: 1200, ry: 150, col: HILL[0], fillOp: 90, seed: 4 },
      { cx: 400, cy: 780, rx: 900, ry: 170, col: HILL[1], fillOp: 110, seed: 1, tufts: 9 },
      { cx: 1700, cy: 812, rx: 1000, ry: 186, col: HILL[2], fillOp: 125, seed: 6, tufts: 10 },
    ]);
    SET.ground(t, E_G, GROUND, { fillOp: 100 });
    // 身后的路：越走越短
    const backLen = lerp(1000, 300, ease(seg(lt, 3.4, 7.0)));
    SET.road(x + 260, E_G + 6, 250, x + 900, 792, 26, ROAD, { fillOp: 80, ink: null });
    SET.road(x - backLen, E_G + 6, 300, x + 40, 800, 28, ROAD, { fillOp: 80, ink: null });

    const walk = (x - 700) / (4.2 * E_U);
    const mood = emotions(lt, [[0, 'sad'], [4.6, 'neutral'], [6.0, 'sad']]);
    // 5.4 起回头看一眼：q → qback
    const look = lt > 5.2 && lt < 6.9 ? turn(lt, 5.2, 5.5, .25, .42) : (lt >= 6.9 ? turn(lt, 6.9, 7.2, .42, .25) : { view: 'side' });
    SET.him(x, E_G, E_U, { ...mood, ...look, walk: walk + .1, dy: (mood.dy || 0) * .4, boilKey: 'himE' });
    camEnd();
    SET.boil('wipeE');
    if (lt < .3) brushWipe(.5 + lt / .6, ['#8E9DBF', SKY.base]);
  }

  // ================= F 40.98–47.78 =================
  function shotF(t, lt, dur) {
    const tilt = ease(seg(lt, 1.9, 4.4));        // 0 → 1，镜头从人摇到天上的钟
    camBegin(960, lerp(720, 380, tilt), lerp(1.06, .96, tilt));
    skyBase(t, .84, 200);
    SET.clock(CLOCK.x, CLOCK.y, CLOCK.r, t, { hand: -.075 * (lt + 40.98) - 1.2 * easeIn(seg(lt, 4.2, 7.0)), fade: .34, bg: SKY.base, face: '#FBF3E4' });
    // 山在朝他折回来：整体朝中心收、变矮
    const fold = ease(seg(lt, 3.6, 6.8));
    const shrink = (cx, cy, rx, ry) => [lerp(cx, 960, .22 * fold), lerp(cy, 760, .3 * fold), rx * (1 - .3 * fold), ry * (1 - .35 * fold)];
    const L = [
      { cx: 900, cy: 690, rx: 1200, ry: 150, col: HILL[0], fillOp: 90, seed: 4 },
      { cx: 500, cy: 782, rx: 900, ry: 172, col: HILL[1], fillOp: 110, seed: 3, tufts: 9 },
      { cx: 1600, cy: 812, rx: 1000, ry: 186, col: HILL[2], fillOp: 125, seed: 4, tufts: 10 },
    ].map(l => { const [cx, cy, rx, ry] = shrink(l.cx, l.cy, l.rx, l.ry); return { ...l, cx, cy, rx, ry }; });
    SET.hills(t, L);
    SET.ground(t, 900, GROUND, { fillOp: 100 });

    const x = 900, u = 18;
    const mood = emotions(lt, [[0, 'sad'], [1.15, 'surprised', { lookY: -1 }], [3.6, 'confused'], [6.0, 'sad']]);
    SET.him(x, 900, u, { ...mood, view: 'q', lookY: lt > 1.2 && lt < 5.8 ? -1 : (mood.lookY ?? 0), aL: -.4, aR: -.45, boilKey: 'himF' });
    camEnd();
  }

  // ================= G 47.78–55.37 =================
  const G_G = 900, G_U = 20;
  function shotG(t, lt, dur) {
    // 他被拽着往左退：x 从 1500 退到 640，最后停在门框前
    const x = lerp(1460, 640, ease(seg(lt, 0, 5.4)));
    camBegin(x + 100, 660, 1.0);
    skyBase(t, .80, 190);
    // SET.clock(CLOCK.x + 200, CLOCK.y, CLOCK.r, t, { hand: -.075 * (lt + 47.78) - 2.4 * easeIn(seg(lt, .2, 5.0)), fade: .46, bg: SKY.base, face: '#FBF3E4' });
    SET.hills(t, [
      { cx: 900, cy: 694, rx: 1200, ry: 150, col: HILL[0], fillOp: 90, seed: 4 },
      { cx: 1500, cy: 812, rx: 1000, ry: 186, col: HILL[2], fillOp: 125, seed: 2, tufts: 10 },
    ]);
    SET.ground(t, G_G, GROUND, { fillOp: 100 });
    SET.road(x + 300, G_G + 6, 280, x + 60, 800, 28, ROAD, { fillOp: 70, ink: null });

    // 倒带的东西从右往左掠过（相对他在往右）
    const slip = (k, span) => lerp(1, -1, seg(lt, k, k + span));
    const bx = x + 520 * slip(1.2, 5.0);
    if (lt > 1.0) bicycle(bx, G_G + 2, 1.0, mixCol(C.ink, SKY.base, .2));
    const cx2 = x + 900 * slip(2.0, 4.6);
    if (lt > 1.8) cat(cx2, G_G + 4, 1.0, t, '#9A8F86');
    // 篱笆一排，也在往回滑
    for (let i = 0; i < 6; i++) {
      const fx = x + 300 + i * 92 - lt * 90;
      if (fx < -200 || fx > W + 200) continue;
      SET.boil('gfence' + i);
      paint(rectPts(fx, G_G - 92, 7, 92, 1.2), { wash: '#C6B394', washOp: 245, ink: C.ink, sw: .7 });
    }
    gate(640, G_G + 4, 1.0);

    const walk = -Math.abs(Math.sin(lt * 7)) * 1.6;
    const mood = emotions(lt, [[0, 'determined'], [2.4, 'surprised'], [4.0, 'confused'], [5.6, 'determined']]);
    SET.him(x, G_G, G_U, { ...mood, view: 'side', flip: true, walk: walk, rot: -.12 * ease(seg(lt, 0, 5.0)), dy: (mood.dy || 0) * .5, boilKey: 'himG' });
    camEnd();
  }

  // ================= H 55.37–63.13 =================
  const H_G = 900, H_U = 24;
  function shotH(t, lt, dur) {
    const push = ease(seg(lt, 0, dur));
    camBegin(760, 700, 1.06 + .16 * push);
    skyBase(t, .80, 170);
    // SET.clock(CLOCK.x - 60, CLOCK.y + 40, CLOCK.r, t, { hand: -.075 * (lt + 55.37) - 4.0 * easeIn(seg(lt, 0, 5.6)), fade: .50, bg: SKY.base, face: '#FBF3E4' });
    SET.hills(t, [
      { cx: 900, cy: 694, rx: 1200, ry: 150, col: HILL[0], fillOp: 90, seed: 4 },
      { cx: 1500, cy: 812, rx: 1000, ry: 186, col: HILL[2], fillOp: 125, seed: 2, tufts: 10 },
    ]);
    SET.ground(t, H_G, GROUND, { fillOp: 100 });
    gate(760, H_G + 4, 1.12);

    // 风：越吹越猛，5.8 之后停
    const wind = Math.sin(Math.PI * clamp(seg(lt, .2, 6.2)));
    leafWind(t, lt, 9, 1900, -300, 300, 820, 7, C.ochre);
    for (let i = 0; i < 8; i++) {
      SET.boil('hwind' + i);
      const ph = frac(hash(i + 40) + lt * 1.6), x = lerp(1900, -300, ph), y = 260 + hash(i) * 560;
      inkLine([[x, y], [x - 150 * wind - 40, y + 16]], .9, SET.fade(SKY.top, SKY.base, .3), 'inkfine', .4);
    }

    const strain = ease(seg(lt, 1.4, 5.6)) * (1 - ease(seg(lt, 6.0, 6.6)));
    const mood = emotions(lt, [[0, 'determined'], [6.4, 'relieved']]);
    SET.him(760, H_G, H_U, {
      ...mood, view: 'q', flip: true, rot: -.26 * strain, sq: (mood.sq || 0) + .16 * strain,
      dy: (mood.dy || 0) - .4 * strain, aL: -.9 + .5 * strain, aR: -.9 + .5 * strain,
      dx: -.35 * strain, boilKey: 'himH',
    });
    camEnd();
  }

  shots([
    [33.54, shotE],
    [40.98, shotF],
    [47.78, shotG],
    [55.37, shotH],
  ]);
})();
