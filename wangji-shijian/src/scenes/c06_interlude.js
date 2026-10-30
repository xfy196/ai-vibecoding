// c06_interlude.js — 间奏（149.50 – 179.93 s）
//   W 149.50–158.50 大远景：雨落在湖上，他站在木栈桥尽头，一盏纸灯笼漂远
//   X 158.50–167.50 那片枫叶又往上飘；镜头跟着它升上天空；星星亮起来
//   Y 167.50–179.93 星星连成一条路；天上一个巨大的、发暗的钟；他在下面小得像一粒
(() => {
  const C = SET.C;
  const G = 890;

  // ================= W 149.50–158.50 =================
  function shotW(t, lt, dur) {
    camBegin(960 + 30 * Math.sin(lt * .18), 640, 1.0 + .05 * ease(seg(lt, 0, dur)));
    SET.sky(t, { hz: .70, base: '#7C8CB8', baseOp: 155, top: '#232B56', topOp: 120, mid: '#48558C', midOp: 70, warm: '#9A7FA8', warmOp: 40, cool: '#2A3566', coolOp: 65, texCol: '#3A4780', texOp: 115 });
    SET.hills(t, [{ cx: 900, cy: 700, rx: 1300, ry: 130, col: '#7E90B4', fillOp: 80, seed: 4, ink: null }]);
    SET.water(t, 760, '#5A76A0', { washOp: 195, fillOp: 85, lines: 6, gap: 30, seed: 2 });
    SET.rain(t, { n: 40, col: '#C6D4E6', bg: '#48558C', sw: .8 });
    SET.rainRings(t, 800, { n: 12, col: '#9FC0DC', bg: '#5A76A0', speed: .5 });

    // 木栈桥
    SET.boil('jetty');
    paint(rectPts(960 - 34, 786, 68, 130, 2), { fill: '#C9A87A', fillOp: 255, bleed: .12, tex: .6, border: .45, ink: C.ink, sw: .9 });
    for (let i = 0; i < 3; i++) {
      SET.boil('post' + i);
      inkLine([[960 - 34 + i * 34, 790], [960 - 34 + i * 34, 916]], 1, mixCol(C.ink, '#C9A87A', .45), 'ink', 0);
    }
    SET.boil('postc');
    inkLine([[960 - 70, 786], [960 + 70, 786]], 1, mixCol(C.ink, '#C9A87A', .4), 'ink', 0);
    // 漂远的纸灯笼
    const lx = lerp(1500, 1760, ease(seg(lt, 0, dur)));
    SET.lantern(lx, 806, 26, t, { ph: .4, key: 'w', glow: 3.8 });
    const mood = emotions(lt, [[0, 'sad'], [5.0, 'relieved']]);
    SET.him(960, 792, 15, { ...mood, view: 'back', boilKey: 'himW' });
    camEnd();
  }

  // ================= X 158.50–167.50 =================
  function shotX(t, lt, dur) {
    const rise = ease(seg(lt, 0, dur));
    camBegin(960, lerp(700, 300, rise), lerp(1.0, 1.06, rise));
    SET.sky(t, { hz: .92, base: '#7A8BBE', baseOp: 150, top: '#3E4E90', topOp: 120, mid: '#3A4780', midOp: 80, warm: '#8A6FA8', warmOp: 40, cool: '#2A3566', coolOp: 60, texCol: '#2A3566', texOp: 120 });
    SET.starField(t, 46, { seed: 3, h: H * .82, r: 5 });
    SET.water(t, 880, '#4E6E96', { washOp: 185, fillOp: 75, lines: 3, gap: 30 });
    // 叶子往上飘，镜头跟着它
    const ly = lerp(880, 150, easeIn(seg(lt, .4, dur)));
    SET.leaf(960 + Math.sin(lt * .7) * 90, ly, lerp(30, 46, seg(lt, 0, dur)), lt * .8, { key: 'xleaf', col: C.ochre });
    // 星星一颗颗亮起来
    for (let i = 0; i < 14; i++) {
      const k = easeOut(seg(lt, 1.2 + i * .32, 2.0 + i * .32));
      if (k <= .01) continue;
      const x = hash(i + 200) * W, y = 120 + hash(i + 300) * 460;
      glow(x, y, 90 * k, '#FFE3A8', .55 * k);
      SET.star(x, y, 12 * k, 1 + .3 * Math.sin(t * 3 + i), C.cream, { key: 'xs' + i });
    }
    SET.him(960, 892, 12, { ...feel('hopeful', t), view: 'back', lookY: -1, boilKey: 'himX' });
    camEnd();
  }

  // ================= Y 167.50–179.93 =================
  function shotY(t, lt, dur) {
    const k = ease(seg(lt, 0, dur));
    camBegin(960, lerp(320, 470, k), lerp(1.0, .92, k));
    SET.boil('ybg');
    paint(rectPts(-900, -900, W + 1800, H + 1800), { wash: '#46579A', washOp: 215, ink: null });
    SET.mass(W * .5, H * .30, W * 1.1, H * .55, '#5A6AA8', 150, 'y1');
    SET.mass(W * .5, H * .78, W * 1.15, H * .34, '#8A74B8', 140, 'y2');
    SET.starField(t, 70, { seed: 9, h: H * .7, r: 5 });

    // 星星连成一条路
    const road = easeOut(seg(lt, 1.2, 6.4));
    for (let i = 0; i < 22; i++) {
      const u = i / 21, on = seg(lt, 1.2 + i * .16, 1.6 + i * .16);
      if (on <= 0) continue;
      const y = lerp(900, 470, u), x = 960 + Math.sin(u * 3.1 + .6) * 420 * (1 - u * .4);
      glow(x, y, 70 * on, '#FFE3A8', .45 * on);
      SET.star(x, y, 9 * on, 1 + .4 * Math.sin(t * 4 + i), '#FFE9C0', { key: 'yr' + i });
    }
    // 巨大的、发暗的钟
    SET.clock(960, 260, 235, t, { hand: -.075 * (lt + 167.5), fade: .55, bg: '#2A3566', face: '#E8E0D0', sw: 1.2 });
    const mood = emotions(lt, [[0, 'hopeful'], [6.0, 'sad']]);
    SET.him(960, 878, 10, { ...mood, view: 'back', lookY: -1, boilKey: 'himY' });
    camEnd();
  }

  shots([
    [149.50, shotW],
    [158.50, shotX],
    [167.50, shotY],
  ]);
})();
