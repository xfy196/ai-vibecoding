// c07_chorus2.js — 副歌二（179.93 – 209.47 s）星路上，一切更大
//   Z  179.93–183.59 「渐渐地忘记 赶不上明天」   他在星路上跑，身后的星星一颗颗灭掉
//   AA 183.59–187.78 「只要用力地抓紧了想念」     他弯腰抱起一大把星光
//   AB 187.78–194.68 「明天再也 没有你的笑脸」   他张开手臂——光里浮出她的笑脸，然后炸成星屑
//   AC 194.68–198.36 「渐渐地忘记 忘记了时间」   巨大的钟面占满天空，指针越走越慢
//   AD 198.36–202.81 「我只要沿着记忆的路线」     他走进钟面里
//   AE 202.81–209.47 「到最深处 纵然那只是瞬间」  暖光的隧道，他往上坠落
(() => {
  const C = SET.C;

  function nightSky(t, hz = .95) {
    SET.boil('bg');
    paint(rectPts(-900, -900, W + 1800, H + 1800), { wash: '#46579A', washOp: 210, ink: null });
    SET.mass(W * .5, H * .26, W * 1.1, H * .55, '#5A6AA8', 145, 'bg1');
    SET.mass(W * .5, H * hz, W * 1.15, H * .36, '#8A74B8', 140, 'bg2');
  }
  // 星路：一串点，u 0..1 从近到远
  function starRoad(t, lt, on, n = 26, col = '#FFE9C0') {
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), k = on(i, u);
      if (k <= .01) continue;
      const y = lerp(930, 420, u), x = 960 + Math.sin(u * 3.1 + .6) * 460 * (1 - u * .4);
      glow(x, y, 78 * k, '#FFE3A8', .4 * k);
      SET.star(x, y, 10 * k, 1 + .4 * Math.sin(t * 4 + i), col, { key: 'srd' + i });
    }
  }

  // ================= Z 179.93–183.59 =================
  function shotZ(t, lt, dur) {
    camBegin(960, 660, 1.02);
    nightSky(t);
    const x = lerp(560, 1360, ease(seg(lt, .1, dur)));
    // 身后的星一颗颗灭
    starRoad(t, lt, (i, u) => {
      const sx = 960 + Math.sin(u * 3.1 + .6) * 460 * (1 - u * .4);
      const died = sx < x - 60 ? ease(seg(lt, .2, dur)) : 0;
      return 1 - died;
    });
    const u = 21;
    const mood = emotions(lt, [[0, 'determined'], [2.4, 'sad']]);
    SET.him(x, 930, u, { ...mood, view: 'side', walk: lt * 3.4, dy: (mood.dy || 0) * .4 - Math.abs(Math.sin(lt * 8)) * .5, boilKey: 'himZ' });
    camEnd();
  }

  // ================= AA 183.59–187.78 =================
  function shotAA(t, lt, dur) {
    camBegin(960, 640, 1.16);
    nightSky(t, .9);
    starRoad(t, lt, () => 1, 20);
    const u = 24, x = 960, bend = ease(seg(lt, 1.2, 3.4));
    // 抱起来的星光：一团往上聚
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU, r0 = 200 + 70 * hash(i), r = lerp(r0, 70, bend);
      glow(x + Math.cos(a) * r, 640 + Math.sin(a) * r * .7, 70, '#FFE3A8', .5);
      SET.star(x + Math.cos(a) * r, 640 + Math.sin(a) * r * .7, 11, 1 + .4 * Math.sin(t * 5 + i), '#FFE9C0', { key: 'aa' + i });
    }
    const mood = emotions(lt, [[0, 'determined'], [2.0, 'hopeful']]);
    SET.him(x, 916, u, { ...mood, view: 'front', aL: lerp(-.4, 1.2, bend), aR: lerp(-.4, 1.2, bend), sq: (mood.sq || 0) + .12 * bend, boilKey: 'himAA' });
    camEnd();
  }

  // ================= AB 187.78–194.68 =================
  function shotAB(t, lt, dur) {
    camBegin(960, 620, 1.1 + .06 * ease(seg(lt, 0, dur)));
    nightSky(t, .9);
    starRoad(t, lt, () => 1, 18);
    const open = ease(seg(lt, .3, 2.2)), scatter = easeIn(seg(lt, 3.4, 5.8));
    const cx = 960, cy = 430;
    // 光里浮出她的笑脸
    const face = Math.sin(Math.PI * clamp(seg(lt, 1.0, 5.4)));
    if (face > .02) {
      glow(cx, cy, 260 + 120 * face, '#FFCE7A', .5 * face);
      SET.her(cx, cy + 60, 9 * (1 + .06 * face), {
        ...feel('happy', t), view: 'front', col: mixCol(C.her, '#2A3566', 1 - face * .9),
        dk: mixCol(C.herDk, '#2A3566', 1 - face * .85), lt: mixCol(C.herLt, '#2A3566', 1 - face * .85),
        swMul: .45, noShadow: true, noLegs: true, boilKey: 'herAB',
      });
    }
    // 炸成星屑
    for (let i = 0; i < 18; i++) {
      const a = i / 18 * TAU + hash(i) * .6, r = 90 + scatter * (420 + 320 * hash(i + 7));
      SET.star(cx + Math.cos(a) * r, cy + Math.sin(a) * r * .85, 9 * (1 - scatter * .5), 1 + .5 * Math.sin(t * 6 + i), '#FFE9C0', { key: 'ab' + i });
    }
    const mood = emotions(lt, [[0, 'hopeful'], [3.2, 'surprised'], [4.4, 'cry']]);
    SET.him(960, 916, 24, { ...mood, view: 'front', aL: lerp(.5, 1.6, open) - scatter * 1.2, aR: lerp(.5, 1.6, open) - scatter * 1.2, lookY: -.9, boilKey: 'himAB' });
    camEnd();
  }

  // ================= AC 194.68–198.36 =================
  function shotAC(t, lt, dur) {
    const slow = ease(seg(lt, 0, dur));
    camBegin(960, 560, .96 + .06 * slow);
    nightSky(t, 1.05);
    SET.clock(960, 330, lerp(220, 290, slow), t, { hand: -.075 * (lt + 194.68) * (1 - .85 * slow), fade: .15, bg: '#2A3566', face: '#F0E8D6', sw: 1.1 });
    SET.starField(t, 24, { seed: 12, h: H * .5, r: 4 });
    SET.him(960, 900, 14, { ...feel('sad', t), view: 'back', lookY: -1, boilKey: 'himAC' });
    camEnd();
  }

  // ================= AD 198.36–202.81 =================
  function shotAD(t, lt, dur) {
    const k = easeIn(seg(lt, 0, dur));
    camBegin(960, lerp(560, 420, k), lerp(1.0, 2.1, k));
    nightSky(t, 1.1);
    SET.clock(960, 420, 280, t, { hand: -.075 * (lt + 198.36) * .15, fade: .1 + .75 * k, bg: '#3A4780', face: '#F0E8D6', sw: 1 });
    // 钟面变成一个门洞：中间的暖光
    const hole = ease(seg(lt, 1.6, 4.0));
    if (hole > .01) {
      glow(960, 430, 60 + 300 * hole, '#FFD98F', .75 * hole);
      SET.boil('adhole');
      paint(ellPts(960, 430, 90 + 120 * hole, 90 + 120 * hole, 26, 3), { wash: '#FFE9C0', washOp: 255, ink: null });
    }
    SET.him(960, lerp(920, 470, k), lerp(20, 7, k), { ...feel('determined', t), view: 'back', boilKey: 'himAD' });
    camEnd();
  }

  // ================= AE 202.81–209.47 =================
  function shotAE(t, lt, dur) {
    const k = ease(seg(lt, 0, dur));
    SET.boil('aebg');
    paint(rectPts(-900, -900, W + 1800, H + 1800), { wash: '#4A3D66', washOp: 228, ink: null });
    // 隧道：一圈圈往镜头外退的光环
    camBegin(960, 540, 1.0);
    for (let i = 8; i >= 0; i--) {
      const ph = frac(hash(i) + k * .9), r = lerp(90, 1500, ph);
      glow(960, 470, r * .8, '#FFCE7A', .5 * (1 - ph) * (0.4 + .6 * Math.sin(Math.PI * ph)));
      SET.boil('aer' + i);
      inkLine(ellPts(960, 470, r, r * .92, 32), 3.4 * (1 - ph), SET.fade('#FFD98F', '#4A3D66', .05 + .5 * ph), 'inkfine', .5);
    }
    // 他往上坠落
    const yy = lerp(880, 200, easeIn(seg(lt, .2, dur)));
    SET.him(960 + Math.sin(lt * 2.2) * 60, yy, lerp(22, 9, k), { ...feel('scared', t), view: 'back', rot: lt * .9, boilKey: 'himAE' });
    camEnd();
    const flashK = ease(seg(lt, dur - 1.8, dur - .1));
    if (flashK > .01) { SET.boil('aeflash'); paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#FFF8EC', washOp: 255 * flashK, ink: null }); }
  }

  shots([
    [179.93, shotZ],
    [183.59, shotAA],
    [187.78, shotAB],
    [194.68, shotAC],
    [198.36, shotAD],
    [202.81, shotAE],
  ]);
})();
