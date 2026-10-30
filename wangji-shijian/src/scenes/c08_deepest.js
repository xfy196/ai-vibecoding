// c08_deepest.js — 副歌三 · 最深处（209.47 – 224.00 s）全片最暖
//   AF 209.47–213.20 「渐渐地忘记 忘记了时间」   他落在金红色的屋顶上——记忆里完整的世界，她在
//   AG 213.20–217.60 「我只要沿着记忆的路线」     她转身；红线重新接上，两人各牵一头；她笑
//   AH 217.60–224.00 「到最深处 纵然那只是瞬间」  整个瞬间冻住：光最亮；然后她开始变成花瓣
(() => {
  const C = SET.C;
  const G = 880;

  function goldenSky(t, op = 1) {
    SET.sky(t, { hz: .74, base: '#F2C57A', top: '#D9964E', mid: '#E8B478',
      warm: '#E8B478' });
  }
  function roof(t, col = '#C08F63') {
    SET.boil('roof');
    paint(rectPts(-200, G - 24, W + 400, 460, 2), { wash: col, washOp: 245, fill: '#A8703F', fillOp: 105, bleed: .1, tex: .55, ink: C.ink, sw: 1 });
    for (let i = 0; i < 14; i++) { SET.boil('tile' + i); inkLine([[-160 + i * 160, G - 20], [-130 + i * 160, G - 58]], .8, C.ink, 'inkfine', 0); }
  }

  // ================= AF 209.47–213.20 =================
  function shotAF(t, lt, dur) {
    const land = easeOut(seg(lt, 0, 1.2));
    camBegin(960, lerp(520, 640, land), lerp(1.18, 1.04, land));
    goldenSky(t, .6 + .4 * land);
    roof(t);
    SET.lantern(400, G - 250, 44, t, { ph: 0, key: 'a' });
    SET.lantern(1520, G - 268, 44, t, { ph: 1.7, key: 'b' });
    glow(960, G - 200, 780, '#FFC766', .32 + .18 * land);

    const u = 24;
    // 她站在那儿，已经在了
    SET.her(1180, G, u * .96, { ...emotions(lt, [[0, 'hopeful'], [2.4, 'happy']]), view: 'front', aL: -.2, aR: -.25, boilKey: 'herAF' });
    // 他掉下来、站住
    const yy = lerp(-160, G, easeIn(seg(lt, 0, 1.1)));
    const mood = emotions(lt, [[0, 'scared'], [1.1, 'surprised'], [2.2, 'love']]);
    SET.him(760, yy, u, { ...mood, view: 'q', sq: (mood.sq || 0) + .25 * (1 - land), aL: -.3, aR: -.35, boilKey: 'himAF' });
    camEnd();
  }

  // ================= AG 213.20–217.60 =================
  function shotAG(t, lt, dur) {
    camBegin(960, 660, 1.08 + .1 * ease(seg(lt, 0, dur)));
    goldenSky(t, 1);
    roof(t);
    SET.lantern(360, G - 250, 44, t, { ph: 0, key: 'a' });
    SET.lantern(1560, G - 268, 44, t, { ph: 1.7, key: 'b' });
    glow(960, G - 200, 900, '#FFC766', .42);

    const u = 26;
    const turnK = ease(seg(lt, .2, .7));
    SET.her(1140, G, u * .96, { ...emotions(lt, [[0, 'hopeful'], [1.0, 'shy'], [2.2, 'happy']]), ...(lt < .7 ? turn(t, .2, .7, .5, 0) : { view: 'front' }), aL: -.15, aR: -.2, boilKey: 'herAG' });
    const mood = emotions(lt, [[0, 'love'], [2.0, 'happy']]);
    SET.him(800, G, u, { ...mood, view: 'q', aL: -.2, aR: lerp(-.4, 1.0, easeOut(seg(lt, 1.2, 2.0))), boilKey: 'himAG' });

    // 红线重新接上：从他的手到她的手，中间自然下垂
    const tie = easeOut(seg(lt, 1.2, 2.6));
    if (tie > .02) {
      const a = [800 + 4.9 * u, G - 4.5 * u], b = [1140 - 4.9 * u * .96, G - 4.5 * u * .96];
      const n = 7, pts = [];
      for (let i = 0; i < n; i++) {
        const q = i / (n - 1);
        pts.push([lerp(a[0], b[0], q), lerp(a[1], b[1], q) + Math.sin(q * Math.PI) * 30 * (1 - tie) + Math.sin(t * 2 + q * 3) * 4]);
      }
      SET.thread(pts, 9 * tie, { key: 'agThread' });
    }
    camEnd();
  }

  // ================= AH 217.60–224.00 =================
  function shotAH(t, lt, dur) {
    // 冻住的瞬间：镜头几乎不动，只有光在涨
    const freeze = ease(seg(lt, .2, 2.4)), peak = ease(seg(lt, 2.0, 4.6));
    camBegin(960, 660, 1.1 + .16 * ease(seg(lt, 0, dur)));
    goldenSky(t, 1);
    roof(t);
    SET.lantern(360, G - 250, 44, t * (1 - freeze), { ph: 0, key: 'a' });
    SET.lantern(1560, G - 268, 44, t * (1 - freeze), { ph: 1.7, key: 'b' });
    glow(960, G - 200, 900 + 500 * peak, '#FFD08A', .42 + .3 * peak);

    const u = 26;
    // 她开始变成花瓣：越到后面越淡
    const gone = easeIn(seg(lt, 3.4, dur - .2));
    if (gone < .98) {
      SET.her(1140, G, u * .96, {
        ...emotions(lt, [[0, 'happy'], [3.0, 'sad']]), view: 'front', aL: -.15, aR: -.2,
        col: mixCol(C.her, '#F2C87E', gone * .92), dk: mixCol(C.herDk, '#F2C87E', gone * .9), lt: mixCol(C.herLt, '#F2C87E', gone * .9),
        boilKey: 'herAH',
      });
    }
    // 花瓣从她身上散出去
    for (let i = 0; i < 18; i++) {
      const a = i / 18 * TAU, r = 40 + gone * (260 + 260 * hash(i + 3));
      SET.petal(1140 + Math.cos(a) * r, G - 120 + Math.sin(a) * r * .8 - gone * 160 * hash(i + 5), 13, a + lt, mixCol(C.roseLt, '#FFF5E2', gone * .5), { key: 'ahp' + i });
    }
    const mood = emotions(lt, [[0, 'happy'], [3.2, 'cry']]);
    SET.him(800, G, u, { ...mood, view: 'q', aL: -.2, aR: 1.0, boilKey: 'himAH' });
    camEnd();
    // 结尾过曝到暖白
    const fl = ease(seg(lt, dur - 1.6, dur - .1));
    if (fl > .01) { SET.boil('ahfl'); paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#FFF8EC', washOp: 250 * fl, ink: null }); }
  }

  shots([
    [209.47, shotAF],
    [213.20, shotAG],
    [217.60, shotAH],
  ]);
})();
