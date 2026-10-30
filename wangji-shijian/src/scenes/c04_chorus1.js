// c04_chorus1.js — 副歌一（91.29 – 122.10 s）
//   M 91.29–95.05 「渐渐地忘记 赶不上明天」   记忆的暖色被水冲开、淌走，他伸手抓空
//   N 95.05–99.23 「只要用力地抓紧了想念」     他把手臂合拢——抱住的只有一把花瓣
//   O 99.23–106.11 「明天再也 没有你的笑脸」   掌心一小团光；花瓣里浮出她的脸，淡掉
//   P 106.11–109.79 「渐渐地忘记 忘记了时间」   天上的钟化成花瓣往下掉
//   Q 109.79–114.31 「我只要沿着记忆的路线」    一条发光的路线铺向黑暗，他走上去
//   R 114.31–122.10 「到最深处 纵然那只是瞬间」 他跃进发光的内核，一个极亮的瞬间
(() => {
  const C = SET.C;
  const WARM = { base: '#F2C57A', top: '#D9964E', mid: '#E8B478', warm: '#A85A20', cool: '#C9A87A' };
  const COLD = { base: '#A8C4E0', top: '#4D74CD', mid: '#8FB0E0', warm: '#E8D2A8', cool: '#A8C4E0' };
  const DEEP = { base: '#8A74B8', top: '#2D4E8C', mid: '#5E4E96', warm: '#5E4E96', cool: '#8A74B8' };
  const G = 890;

  function petals(t, n, o = {}) { SET.petalFall(t, n, o); }

  // ================= M 91.29–95.05 =================
  const M_G = 880;
  function shotM(t, lt, dur) {
    const wash = ease(seg(lt, .15, 3.2));
    camBegin(960 + 16 * Math.sin(lt * .5), 640, 1.03 + .05 * ease(seg(lt, 0, dur)));
    // 暖色一点点被水冲淡成冷色
    SET.sky(t, { hz: .76,
      base: mixCol('#F2C57A', '#A8C4E0', wash), top: mixCol('#D9964E', '#4D74CD', wash),
      mid: mixCol('#E8B478', '#8FB0E0', wash), low: mixCol('#A85A20', '#E8D2A8', wash) });
    // 记忆里的屋顶
    SET.boil('mroof');
    paint(rectPts(-300, M_G - 26, W + 600, 470, 2),
      { fill: mixCol('#C9A87A', '#B2C1D4', wash), fillOp: 255, bleed: .16, tex: .6, border: .5, ink: null });
    for (let i = 0; i < 12; i++) {
      SET.boil('mtile' + i);
      inkLine([[-200 + i * 180, M_G - 22], [-170 + i * 180, M_G - 58]], .8, SET.fade(C.ink, '#C9A87A', .3 + .5 * wash), 'inkfine', 0);
    }
    // 花瓣往上飘、被水带散
    petals(t, 14, { y0: 950, y1: 220, sp: -110, r: 15, col: mixCol(C.roseLt, '#E8D2A8', wash * .7), sway: 90 });
    // 水从上面淌下来，把颜色洗掉（柔和的一大片，不是硬边）
    if (lt > .4) {
      SET.mass(W * .5, H * (.10 + .55 * wash), W * 1.3, H * (.30 + .25 * wash), '#FFF0D0', 255, 'mwash');
    }
    const u = 24;
    const mood = emotions(lt, [[0, 'happy'], [1.2, 'surprised'], [2.2, 'sad']]);
    const reach = easeOut(seg(lt, 1.1, 2.6));
    SET.him(830, M_G, u, { ...mood, view: 'q', aR: lerp(-.4, 1.5, reach), aL: -.5, lookY: -.7, boilKey: 'himM' });
    camEnd();
  }

  // ================= N 95.05–99.23 =================
  function shotN(t, lt, dur) {
    camBegin(960, 660, 1.14);
    SET.sky(t, { hz: .80, base: COLD.base, baseOp: 140, top: DEEP.top, topOp: 80, mid: COLD.mid, midOp: 40, warm: COLD.warm, warmOp: 60, cool: COLD.cool, coolOp: 45 });
    SET.ground(t, G, '#A9A79C', { fillOp: 90 });
    // 花瓣在被抱住的位置聚成一团，然后散开
    const close = easeOut(seg(lt, 1.5, 2.2)), burst = easeIn(seg(lt, 2.6, 3.9));
    const cx = 960, cy = G - 5.4 * 24;
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * TAU + hash(i) * .5, r0 = 150 + 60 * hash(i + 5);
      const r = lerp(r0, 40, close) + burst * (420 + 300 * hash(i + 9));
      SET.petal(cx + Math.cos(a) * r, cy + Math.sin(a) * r * .8, 15 + 8 * hash(i + 3), a + lt, mixCol(C.roseLt, C.cream, burst * .5), { key: 'np' + i });
    }
    const u = 24;
    const mood = emotions(lt, [[0, 'sad'], [2.7, 'surprised'], [3.4, 'cry']]);
    const arm = lerp(1.4, .25, close);
    SET.him(960, G, u, { ...mood, view: 'front', aL: arm, aR: arm, sq: (mood.sq || 0) + .1 * close, boilKey: 'himN' });
    camEnd();
  }

  // ================= O 99.23–106.11 =================
  function shotO(t, lt, dur) {
    camBegin(960, 640, 1.18 + .1 * ease(seg(lt, 0, dur)));
    SET.sky(t, { hz: .82, base: COLD.base, baseOp: 135, top: DEEP.top, topOp: 85, mid: COLD.mid, midOp: 38, warm: COLD.warm, warmOp: 55, cool: COLD.cool, coolOp: 45 });
    SET.ground(t, G, '#A9A79C', { fillOp: 90 });
    const u = 26, x = 960;
    const palm = [x, G - 4.6 * u];
    // 掌心的那一小团光
    const glowK = easeOut(seg(lt, .1, 1.4)) * (1 - ease(seg(lt, 5.2, 6.4)));
    if (glowK > .01) glow(palm[0], palm[1] - 20, 90 + 60 * glowK, '#FFCE7A', .55 * glowK);
    // 花瓣里浮出她的脸，然后淡掉
    const face = Math.sin(Math.PI * clamp(seg(lt, 1.8, 5.6)));
    if (face > .02) {
      SET.her(palm[0], palm[1] + 16, 5.5 * (1 + .1 * face), {
        ...feel('happy', t), view: 'front', col: mixCol(C.her, COLD.base, 1 - face * .85),
        dk: mixCol(C.herDk, COLD.base, 1 - face * .8), lt: mixCol(C.herLt, COLD.base, 1 - face * .8),
        swMul: .5, noShadow: true, noLegs: true, boilKey: 'herO',
      });
    }
    const mood = emotions(lt, [[0, 'cry'], [4.6, 'sad'], [5.8, 'bored']]);
    SET.him(x, G, u, { ...mood, view: 'front', aL: 1.25, aR: 1.25, lookY: .7, boilKey: 'himO' });
    camEnd();
  }

  // ================= P 106.11–109.79 =================
  function shotP(t, lt, dur) {
    const k = ease(seg(lt, 0, dur));
    camBegin(960, lerp(520, 600, k), lerp(1.0, 1.12, k));
    SET.sky(t, { hz: .86, base: COLD.base, baseOp: 130, top: DEEP.top, topOp: 90, mid: COLD.mid, midOp: 35, warm: COLD.warm, warmOp: 50, cool: COLD.cool, coolOp: 45 });
    SET.clock(960, 330, 210, t, { hand: -.075 * (lt + 106.11) - 9.0, fade: .20 + .7 * k, bg: COLD.base, face: '#FBF3E4' });
    // 刻度化成花瓣往下掉
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU - Math.PI / 2, rel = seg(lt, .4 + i * .12, dur);
      if (rel <= 0) continue;
      const x = 960 + Math.cos(a) * 195, y = 330 + Math.sin(a) * 195 + rel * rel * 640;
      SET.petal(x, y, 13, a + rel * 6, mixCol(C.roseLt, C.cream, rel * .6), { key: 'pp' + i });
    }
    petals(t, 12, { y0: -80, y1: H + 80, sp: 130, r: 13, col: C.roseLt, sway: 60 });
    SET.ground(t, 900, '#A9A79C', { fillOp: 85 });
    const mood = emotions(lt, [[0, 'sad'], [2.0, 'bored']]);
    SET.him(960, 900, 16, { ...mood, view: 'back', boilKey: 'himP' });
    camEnd();
  }

  // ================= Q 109.79–114.31 =================
  function shotQ(t, lt, dur) {
    const k = ease(seg(lt, .3, dur));
    camBegin(960, 640, 1.0 + .08 * k);
    SET.sky(t, { hz: .95, nite: '#3A3566', niteOp: 225, base: '#5E4E96', top: '#2D4E8C', low: '#8A74B8' });
    // 一层层往远处收的柔和光带（不是多边形，免得出现尖角）
    for (let i = 9; i >= 0; i--) {
      const u = i / 9, y = lerp(930, 500, u), x = 960 + Math.sin(u * 2.0 + .4) * 150;
      const grow = easeOut(seg(lt, i * .1, i * .1 + 1.4));
      if (grow <= .02) continue;
      SET.boil('qband' + i);
      paint(ellPts(x, y, lerp(230, 26, u) * grow, lerp(46, 7, u) * grow, 18, 6),
        { fill: i % 2 ? '#F2C57A' : '#E8B478', fillOp: 255, bleed: .3, tex: .5, border: .5, ink: null });
      glow(x, y, lerp(210, 40, u) * grow, '#FFCE7A', .30 * grow);
    }
    // 路上零星的光点
    for (let i = 0; i < 10; i++) {
      const u = frac(hash(i) + lt * .35), y = lerp(930, 500, u), x = 960 + Math.sin(u * 2.0 + .4) * 150;
      SET.star(x + (hash(i + 3) - .5) * 120, y, 8, 1 + .4 * Math.sin(t * 5 + i), '#FFE9C0', { key: 'qs' + i });
    }
    const mood = emotions(lt, [[0, 'determined'], [2.4, 'sad']]);
    const yy = lerp(916, 720, ease(seg(lt, .2, dur)));
    SET.him(960 + Math.sin(k * 2.0 + .4) * 120, yy, lerp(22, 13, k), { ...mood, view: 'back', walk: lt * 2.4, boilKey: 'himQ' });
    camEnd();
  }

  // ================= R 114.31–122.10 =================
  function shotR(t, lt, dur) {
    const k = easeIn(seg(lt, 0, 3.6)), near = ease(seg(lt, 2.2, 6.2));
    camBegin(960, lerp(700, 470, k), lerp(1.0, 1.9, k));
    SET.sky(t, { hz: 1.0, nite: '#2E2A56', niteOp: 230, base: '#5E4E96', top: '#3A3566', low: '#8A74B8' });
    // 一圈圈往里收的光环（隧道）
    for (let i = 0; i < 7; i++) {
      const ph = frac(hash(i + 11) + near * .55);
      const r = lerp(60, 1200, ph);
      SET.boil('rring' + i);
      inkLine(ellPts(960, 470, r, r * .96, 30), 2.2 * (1 - ph), SET.fade('#F2C57A', '#3A3566', .1 + .55 * ph), 'inkfine', .5);
    }
    // 内核：光核在中心
    glow(960, 470, 140 + 420 * near, '#FFD98F', .55 + .35 * near);
    glow(960, 470, 60 + 150 * near, '#FFF5E2', .7 + .3 * near);
    // 他掉进去，拖出光尾
    const u = lerp(24, 6, k), y = lerp(900, 500, k);
    for (let i = 1; i < 7; i++) {
      const q = easeIn(seg(lt - i * .07, 0, 3.6));
      if (q <= 0) continue;
      SET.petal(960 + Math.sin(q * 7) * 34, lerp(900, 500, q) + i * 12, 12 - i, q * 5, mixCol('#FFE3A8', '#8A74B8', i / 7), { key: 'rt' + i });
    }
    const mood = emotions(lt, [[0, 'determined'], [3.0, 'scared'], [4.6, 'hopeful']]);
    SET.him(960, y, u, { ...mood, view: 'back', rot: lt * .6, boilKey: 'himR' });
    camEnd();
    const flashK = ease(seg(lt, dur - 2.0, dur - .1));
    if (flashK > .01) { SET.boil('rflash'); paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#FFF8EC', washOp: 255 * flashK, ink: null }); }
  }

  shots([
    [91.29, shotM],
    [95.05, shotN],
    [99.23, shotO],
    [106.11, shotP],
    [109.79, shotQ],
    [114.31, shotR],
  ]);
})();
