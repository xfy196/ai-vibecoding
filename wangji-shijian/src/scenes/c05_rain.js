// c05_rain.js — 主歌二（122.10 – 149.50 s）夜 · 雨
//   S 122.10–129.44 「当眼泪 滑落的 是句点」   夜雨；一滴眼泪慢慢落下，涟漪收成一个句点
//   T 129.44–136.39 「心里面 始终你 从没有走远」 他回头，雨里她苍白地站着；他跑过去，她是水洼里的倒影
//   U 136.39–143.41 「耳边 誓言 还在回旋」     雨在半空冻成一个个圆环，绕着他转；他侧耳听
//   V 143.41–149.50 「我会好好珍惜 没有你的明天」 他站起来抹一把脸，转向地平线，天边裂开一道晨光
(() => {
  const C = SET.C;
  const NIGHT = { base: '#2D4E8C', top: '#17335E', mid: '#24457C', warm: '#5E4E96', cool: '#2D4E8C' };
  const G = 890;

  function skyNight(t, hz) {
    SET.sky(t, { hz, base: NIGHT.base, baseOp: 165, top: NIGHT.top, topOp: 120, mid: NIGHT.mid, midOp: 70, warm: NIGHT.warm, warmOp: 45, cool: NIGHT.cool, coolOp: 70, texCol: '#3A4780', texOp: 120 });
  }

  // ================= S 122.10–129.44 =================
  function shotS(t, lt, dur) {
    const tilt = ease(seg(lt, 3.2, 6.0));       // 泪落之后镜头往下看水洼
    camBegin(960, lerp(600, 760, tilt), lerp(1.5, 1.05, tilt));
    skyNight(t, .84);
    SET.ground(t, G, '#6E7C96', { fillOp: 95 });
    SET.water(t, G + 34, '#4E6E96', { washOp: 190, fillOp: 80, lines: 5, gap: 26 });
    SET.rain(t, { n: 44, col: '#C6D4E6', bg: '#3A4780', sw: .9 });
    SET.rainRings(t, G + 34, { n: 8, col: '#9FC0DC', bg: '#4E6E96' });

    const u = 34, x = 960;
    // 眼泪：从眼角滑下、离开脸、落进水洼
    const tear0 = 1.5, fall = 2.2, hit = tear0 + fall;
    const mood = emotions(lt, [[0, 'cry'], [hit + .3, 'sad']]);
    SET.him(x, G, u, { ...mood, view: 'front', swMul: .8, boilKey: 'himS' });
    if (lt > tear0 - .4 && lt < hit) {
      const k = clamp((lt - tear0) / fall);
      const ex = x - 2.5 * u, ey = G - 6 * u + 2 * u * .6;
      const tx = ex + 6, ty = lerp(ey + 10, G + 30, easeIn(k));
      SET.boil('tear');
      paint(ellPts(tx, ty, 9 + 3 * k, 13 + 4 * k, 12), { wash: '#DCEEF8', washOp: 240, fill: '#9FC0DC', fillOp: 110, ink: C.ink, sw: .8 });
    }
    // 落水：涟漪收成一个句点
    if (lt > hit) {
      const a = lt - hit;
      for (let i = 0; i < 3; i++) {
        const r = 30 + 170 * easeOut(clamp((a - i * .14) / 1.5));
        SET.boil('sring' + i);
        inkLine(ellPts(x, G + 34, r, r * .3, 22), 1.1 - .2 * i, SET.fade('#DCEEF8', '#4E6E96', .2 + .2 * i), 'inkfine', .5);
      }
      const dot = easeOut(seg(a, 1.5, 2.4));
      if (dot > .01) { SET.boil('sdot'); paint(ellPts(x, G + 34, 20 * dot, 7 * dot, 16), { wash: '#1A1F3A', washOp: 255, ink: null }); }
    }
    camEnd();
  }

  // ================= T 129.44–136.39 =================
  function shotT(t, lt, dur) {
    const run = ease(seg(lt, 3.4, 5.2));
    camBegin(lerp(960, 900, run), 660, lerp(1.05, .96, run));
    skyNight(t, .84);
    SET.ground(t, G, '#6E7C96', { fillOp: 95 });
    SET.water(t, G + 30, '#4E6E96', { washOp: 185, fillOp: 80, lines: 5, gap: 24 });
    SET.rain(t, { n: 40, col: '#C6D4E6', bg: '#3A4780', sw: .9 });

    // 她：雨里的苍白身影，跑近之后才知道是倒影
    const fadeK = 1 - ease(seg(lt, 4.6, 5.8));
    if (lt > 1.6) {
      SET.her(1240, G + 30, 22, {
        ...emotions(lt, [[1.6, 'happy'], [4.2, 'sad']]), view: 'front', noLegs: true,
        col: mixCol(C.her, NIGHT.base, .35 + .5 * (1 - fadeK)), dk: mixCol(C.herDk, NIGHT.base, .4 + .5 * (1 - fadeK)),
        lt: mixCol(C.herLt, NIGHT.base, .3 + .5 * (1 - fadeK)), swMul: .8, boilKey: 'herT',
      });
    }
    const u = 24, x = lerp(700, 1130, run);
    const mood = emotions(lt, [[0, 'sad'], [1.4, 'surprised'], [2.6, 'hopeful'], [5.0, 'cry']]);
    const kneel = ease(seg(lt, 5.0, 5.8));
    SET.him(x, G, u, {
      ...mood, view: lt < 5.0 ? 'side' : 'front', flip: false, walk: run * 4.2,
      sq: (mood.sq || 0) + .3 * kneel, dy: (mood.dy || 0) - 1.1 * kneel, rot: -.1 * kneel, boilKey: 'himT',
    });
    camEnd();
  }

  // ================= U 136.39–143.41 =================
  function shotU(t, lt, dur) {
    const freeze = ease(seg(lt, .2, 2.6));
    camBegin(960, 640, 1.06 + .12 * ease(seg(lt, 0, dur)));
    skyNight(t, .86);
    SET.ground(t, G, '#6E7C96', { fillOp: 92 });
    SET.water(t, G + 28, '#4E6E96', { washOp: 180, fillOp: 78, lines: 4, gap: 26 });
    // 雨：越来越慢，最后冻在半空
    for (let i = 0; i < 40; i++) {
      SET.boil('urain' + i);
      const ph = frac(hash(i + 60) + lt * (.9 - .8 * freeze));
      const y = -100 + ph * (H + 200), x = hash(i) * (W + 200) - 100;
      inkLine([[x, y], [x + 8, y + lerp(44, 18, freeze)]], .8, SET.fade('#C6D4E6', '#3A4780', .3), 'inkfine', .2);
      if (freeze > .5) { SET.petal(x, y, 4.5, 0, '#DCEEF8', { key: 'ud' + i, op: 200 }); }
    }
    // 声波：一圈圈从他耳朵散开的环
    const [ex, ey] = [960, G - 5.4 * 26];
    for (let i = 0; i < 5; i++) {
      const ph = seg(lt, 1.4 + i * .55, 5.4 + i * .55);
      if (ph <= 0 || ph >= 1) continue;
      SET.boil('ur' + i);
      inkLine(ellPts(ex, ey, 60 + 620 * easeOut(ph), (60 + 620 * easeOut(ph)) * .82, 30), 1.4 * (1 - ph), SET.fade('#F2C55E', '#3A4780', .15 + .3 * ph), 'inkfine', .5);
    }
    const mood = emotions(lt, [[0, 'cry'], [2.2, 'relieved'], [4.6, 'sad']]);
    SET.him(960, G, 26, { ...mood, view: 'front', lookX: .5, lookY: -.4, aL: -.5, aR: -.55, boilKey: 'himU' });
    camEnd();
  }

  // ================= V 143.41–149.50 =================
  function shotV(t, lt, dur) {
    const dawn = ease(seg(lt, 2.6, 5.6));
    camBegin(960 + 10 * Math.sin(lt * .5), 660, 1.04 + .1 * ease(seg(lt, 0, dur)));
    SET.sky(t, { hz: .82, base: mixCol(NIGHT.base, '#E8C79A', dawn * .8), baseOp: 160,
      top: mixCol(NIGHT.top, '#7B8FC0', dawn * .7), topOp: 115, mid: mixCol(NIGHT.mid, '#C9A88C', dawn * .8), midOp: 65,
      warm: mixCol(NIGHT.warm, '#F2C57A', dawn), warmOp: 45 + 70 * dawn, cool: NIGHT.cool, coolOp: 60 });
    SET.ground(t, G, mixCol('#6E7C96', '#BFB195', dawn * .8), { fillOp: 95 });
    SET.water(t, G + 30, mixCol('#4E6E96', '#C9B48E', dawn * .8), { washOp: 185, fillOp: 78, lines: 4, gap: 26 });
    SET.rain(t, { n: 26 * (1 - dawn), col: '#C6D4E6', bg: '#3A4780', sw: .8 });

    // 天边一道细细的晨光
    if (dawn > .02) {
      SET.boil('dawnline');
      inkLine([[-100, 806], [960, 800], [W + 100, 806]], 3.2 * dawn, SET.fade('#FFE3A8', '#E8C79A', .1), 'ink', .4);
      glow(960, 800, 700 * dawn, '#FFD08A', .45 * dawn);
    }
    const u = 24;
    const mood = emotions(lt, [[0, 'sad'], [1.5, 'relieved'], [3.4, 'hopeful'], [5.2, 'determined']]);
    // 抹脸 → 转身面向地平线
    const wipe = Math.sin(Math.PI * clamp(seg(lt, .6, 1.8)));
    const face = turn(lt, 2.2, 2.5, 0, .25);
    SET.him(960, G, u, { ...mood, ...(lt > 2.2 ? face : { view: 'front' }), aR: -.4 + .9 * wipe, lookY: lt > 3.2 ? -.3 : .2, boilKey: 'himV' });
    camEnd();
  }

  shots([
    [122.10, shotS],
    [129.44, shotT],
    [136.39, shotU],
    [143.41, shotV],
  ]);
})();
