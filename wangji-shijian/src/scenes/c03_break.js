// c03_break.js — 主歌一后半（63.13 – 91.29 s）
//   I 63.13–70.52 「说好了的永远 断了线」  手里的红线绷紧 → 啪地断了，一头飞上天
//   J 70.52–77.33 「期许了 不变的 却都已改变」 记忆里那座暖色小屋立着，然后折成一座冷山
//   K 77.33–84.46 「紧闭 双眼 才能看的见」  大特写：他闭眼，世界退掉，暖光从眼里漫开
//   L 84.46–91.29 「那些曾经温暖 鲜艳过的画面」 金色记忆：屋顶、灯笼、自行车，她第一次出现
(() => {
  const C = SET.C;
  // 冷（现在）
  const SKY_C = { base: '#A8C4E0', top: '#4D74CD', mid: '#8FB0E0', warm: '#E8D2A8', cool: '#A8C4E0' };
  const HILL_C = ['#B2C1D4', '#8A9AB0', '#6E7E96'];
  // 暖（记忆）
  const SKY_W = { base: '#F2C57A', top: '#D9964E', mid: '#E8B478', warm: '#A85A20', cool: '#C9A87A' };
  const HILL_W = ['#E8D2A8', '#C9A87A', '#A85A20'];

  function skyCool(t, hz, w = 105) { SET.sky(t, { hz, base: SKY_C.base, baseOp: 145, top: SKY_C.top, topOp: 92, mid: SKY_C.mid, midOp: 45, warm: SKY_C.warm, warmOp: w, cool: SKY_C.cool, coolOp: 45 }); }
  function skyWarm(t, hz, op = 1) {
    SET.sky(t, { hz, base: SKY_W.base, baseOp: 150 * op, top: SKY_W.top, topOp: 70 * op, mid: SKY_W.mid, midOp: 40 * op,
      warm: SKY_W.warm, warmOp: 60 * op, cool: SKY_W.cool, coolOp: 40 * op, texCol: '#D98B52', texOp: 90 * op });
  }

  // ================= I 63.13–70.52 =================
  const I_G = 900, I_U = 25;
  function shotI(t, lt, dur) {
    const push = ease(seg(lt, 0, dur));
    camBegin(900, 690, 1.10 + .18 * push);
    skyCool(t, .80, 95);
    // SET.clock(1180, 300, 158, t, { hand: -.075 * (lt + 63.13) - 5.0, fade: .48, bg: SKY_C.base, face: '#FBF3E4' });
    SET.hills(t, [
      { cx: 900, cy: 700, rx: 1200, ry: 150, col: HILL_C[0], fillOp: 85, seed: 4 },
      { cx: 1520, cy: 812, rx: 1000, ry: 186, col: HILL_C[2], fillOp: 120, seed: 1, tufts: 9 },
    ]);
    SET.ground(t, I_G, '#BFB195', { fillOp: 95 });

    const snap = 2.55;                          // 断线的瞬间
    const u = I_U, x = 900, hand = [x, I_G - 5.2 * u];
    const taut = 1 - seg(lt, snap, snap + .25);
    // 线：一头在他手里，一头飞向天上
    const farEnd = snap > lt
      ? [hand[0] + 60 + 40 * Math.sin(lt * 1.4), hand[1] - 520 - 40 * lt]
      : (() => { const a = lt - snap, k = easeIn(clamp(a / .5)); return [hand[0] + 60 + 700 * k + 90 * a, hand[1] - 520 - 260 * a + 340 * a * a]; })();
    const mid = [(hand[0] + farEnd[0]) / 2, (hand[1] + farEnd[1]) / 2];
    if (lt < snap + 1.6) SET.thread([hand, mid, farEnd], 9, { sag: 30 * taut, key: 'thrI' });

    const mood = emotions(lt, [[0, 'sad'], [snap + .05, 'surprised', { lookY: -1 }], [4.4, 'cry'], [6.0, 'sad']]);
    SET.him(x, I_G, u, { ...mood, view: 'front', aL: lerp(-.1, 1.5, taut), aR: lerp(-.1, 1.5, taut), lookY: lt < 4.4 ? -1 : (mood.lookY ?? .4), boilKey: 'himI' });
    camEnd();
  }

  // ================= J 70.52–77.33 =================
  // 小屋 → 山：同一串点从"屋子"插值到"山丘"
  const HOUSE = [[-170, 0], [-170, -150], [0, -260], [170, -150], [170, 0]];
  const HILLP = [[-170, 0], [-150, -110], [0, -150], [150, -110], [170, 0]];
  const J_G = 900;
  function shotJ(t, lt, dur) {
    const fold = ease(seg(lt, 2.2, 5.4));
    camBegin(940, 700, 1.04 + .06 * ease(seg(lt, 0, dur)));
    // 天空从冷到暖再到冷
    const warm = Math.sin(Math.PI * clamp(seg(lt, .3, 6.2)));
    SET.sky(t, { hz: .80, base: mixCol(SKY_C.base, SKY_W.base, warm * .85), baseOp: 145,
      top: mixCol(SKY_C.top, SKY_W.top, warm * .7), topOp: 90, mid: mixCol(SKY_C.mid, SKY_W.mid, warm), midOp: 45,
      warm: mixCol(SKY_C.warm, SKY_W.warm, warm), warmOp: 105, cool: SKY_C.cool, coolOp: 40 });
    SET.hills(t, [
      { cx: 900, cy: 706, rx: 1200, ry: 150, col: mixCol(HILL_C[0], HILL_W[0], warm * .8), fillOp: 85 },
      { cx: 1560, cy: 812, rx: 1000, ry: 186, col: mixCol(HILL_C[2], HILL_W[2], warm * .8), fillOp: 120, tufts: 8 },
    ]);
    SET.ground(t, J_G, mixCol('#BFB195', '#D9AC7E', warm * .8), { fillOp: 95 });

    // 屋子：立着 → 折下去变成山
    const pts = HOUSE.map((p, i) => [940 + lerp(p[0], HILLP[i][0], fold), J_G + lerp(p[1], HILLP[i][1], fold)]);
    const wcol = mixCol('#E8A76A', HILL_C[2], fold);
    SET.boil('house');
    paint(through(pts, 3), { wash: wcol, washOp: 240, fill: mixCol(wcol, C.night, .35), fillOp: 100, bleed: .1, tex: .55, ink: C.ink, sw: 1.1 });
    if (fold < .5) {   // 窗（暖光）在折到一半时熄掉
      const a = 1 - fold * 2;
      SET.boil('housewin');
      paint(rectPts(900, J_G - 130, 46, 54, 1), { wash: mixCol('#FFD98F', wcol, fold * 2), washOp: 250, ink: C.ink, sw: .8 });
      paint(rectPts(972, J_G - 130, 46, 54, 1), { wash: mixCol('#FFD98F', wcol, fold * 2), washOp: 250, ink: C.ink, sw: .8 });
      if (a > .3) glow(940, J_G - 100, 190 * a, '#FFC766', .5 * a);
    }

    const u = 20, x = 690;
    const mood = emotions(lt, [[0, 'hopeful'], [2.4, 'surprised'], [3.6, 'sad'], [5.8, 'cry']]);
    SET.him(x, J_G, u, { ...mood, view: 'q', aR: lt < 5.0 ? 1.15 - .5 * fold : -.6, lookX: .8, boilKey: 'himJ' });
    camEnd();
  }

  // ================= K 77.33–84.46 =================
  function shotK(t, lt, dur) {
    const close = ease(seg(lt, 0, 1.4));
    camBegin(960, lerp(700, 560, close), lerp(1.2, 2.35, close));
    skyCool(t, .84, 90);
    SET.hills(t, [{ cx: 900, cy: 700, rx: 1200, ry: 150, col: HILL_C[0], fillOp: 80, seed: 4 }]);
    SET.ground(t, 900, '#BFB195', { fillOp: 90 });

    const mood = emotions(lt, [[0, 'sad'], [1.5, 'cry'], [3.9, 'relieved'], [6.2, 'hopeful']]);
    const shut = ease(seg(lt, 1.5, 2.1));        // 闭眼
    const eyesShut = shut > .5 ? 'closed' : mood.eyes;
    SET.him(960, 900, 44, { ...mood, eyes: eyesShut, view: 'front', lookY: -.2, swMul: .62, boilKey: 'himK' });

    // 冷色退掉、变暗
    const dark = ease(seg(lt, 2.0, 3.9)) * (1 - ease(seg(lt, 4.6, 5.6)));
    if (dark > .01) { SET.boil('kdark'); paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#2C3560', washOp: 150 * dark, ink: null }); }
    // 暖光从眼里漫开
    const bloom = ease(seg(lt, 3.7, 6.2));
    if (bloom > .01) {
      const [ex, ey] = [960, 900 - 6 * 44];
      glow(ex, ey, 260 + 1500 * bloom, '#FFCE7A', .5 * bloom);
      glow(ex - 110, ey, 160 + 700 * bloom, '#FFE3A8', .55 * bloom);
      glow(ex + 110, ey, 160 + 700 * bloom, '#FFE3A8', .55 * bloom);
    }
    camEnd();
    if (lt > dur - .8) { SET.boil('kwash'); paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#F7CFA6', washOp: 210 * ease(seg(lt, dur - .8, dur - .05)), ink: null }); }
  }

  // ================= L 84.46–91.29 =================
  const L_G = 880;
  function shotL(t, lt, dur) {
    camBegin(960 + 20 * Math.sin(lt * .4), 620, 1.02 + .03 * ease(seg(lt, 0, dur)));
    skyWarm(t, .76);
    // 屋顶
    SET.boil('roof');
    paint(rectPts(-200, L_G - 24, W + 400, 460, 2), { wash: '#C08F63', washOp: 245, fill: '#A8703F', fillOp: 110, bleed: .1, tex: .55, ink: C.ink, sw: 1 });
    for (let i = 0; i < 14; i++) { SET.boil('tile' + i); inkLine([[-160 + i * 160, L_G - 20], [-160 + i * 160 + 30, L_G - 60]], .8, C.ink, 'inkfine', 0); }
    // 两盏灯笼
    SET.lantern(430, L_G - 250, 44, t, { ph: 0, key: 'a' });
    SET.lantern(1500, L_G - 268, 44, t, { ph: 1.7, key: 'b' });
    // 一辆自行车靠在后面
    SET.boil('lbike');
    inkLine(ellPts(1220, L_G - 50, 44, 44, 18), 1.1, C.ink, 'ink', .4);
    inkLine(ellPts(1320, L_G - 50, 44, 44, 18), 1.1, C.ink, 'ink', .4);
    inkLine([[1220, L_G - 50], [1262, L_G - 100], [1310, L_G - 100], [1320, L_G - 50]], 1.1, C.ink, 'ink', .3);

    // 他
    const u = 23;
    const mood = emotions(lt, [[0, 'hopeful'], [3.6, 'love'], [5.8, 'happy']]);
    SET.him(860, L_G, u, { ...mood, view: 'q', aL: -.3, aR: -.4, boilKey: 'himL' });
    // 她：从右边慢慢浮进来，靠在他旁边
    const kin = easeOut(seg(lt, 3.2, 5.4));
    if (kin > .02) {
      const hx = lerp(1500, 1060, kin), alphaK = kin;
      SET.her(hx, L_G, u * .94, {
        ...emotions(lt, [[3.2, 'shy'], [4.8, 'happy']]), view: 'q', flip: true, aL: -.2, aR: -.25,
        col: mixCol('#C9DCEB', '#F0C27A', .25 * (1 - alphaK)), dk: mixCol('#7E9CBC', '#C08F63', .25 * (1 - alphaK)), lt: '#E8F2FA',
        boilKey: 'herL',
      });
    }
    // 金色的暖光晕
    glow(960, L_G - 160, 620, '#FFC766', .35 + .2 * ease(seg(lt, 4.0, 6.8)));
    camEnd();
    // 结尾：整幅画开始被水冲开
    if (lt > dur - .9) { SET.boil('lwash'); paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#FFF5E2', washOp: 170 * ease(seg(lt, dur - .9, dur - .05)), ink: null }); }
  }

  shots([
    [63.13, shotI],
    [70.52, shotJ],
    [77.33, shotK],
    [84.46, shotL],
  ]);
})();
