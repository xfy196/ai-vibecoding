// probe.js — 天空的四种画法，看哪种像水彩
LOOPS.probe = t => {
  const W1 = W / 2, H1 = H / 2;
  const variants = [
    // 0: 满铺 base + top + low
    (ox, oy) => { push(); translate(ox, oy); scale(.5);
      SET.sky(t, { hz: .84, base: '#A8C4E0', top: '#4D74CD', low: '#D9964E' }); pop(); },
    // 1: 只铺 base + top，地平线留纸
    (ox, oy) => { push(); translate(ox, oy); scale(.5);
      SET.sky(t, { hz: .84, base: '#A8C4E0', top: '#4D74CD' });
      paint(rectPts(-900, H * .80, W + 1800, H * .4), { fill: '#F0E2C8', fillOp: 255, bleed: .3, tex: .5, ink: null }); pop(); },
    // 2: 不铺底，只在天顶压一道 blue，下面留纸
    (ox, oy) => { push(); translate(ox, oy); scale(.5);
      SET.sky(t, { hz: .84, base: false, top: '#2D4E8C', topOp: 255 });
      SET.mass(W * .5, H * 1.0, W * 1.2, H * .22, '#F2C57A', 255, 'p2low'); pop(); },
    // 3: 淡紫 dusk：base 淡紫 + top 蓝紫
    (ox, oy) => { push(); translate(ox, oy); scale(.5);
      SET.sky(t, { hz: .84, base: '#B9A8D8', top: '#5E4E96', low: '#D9964E' }); pop(); },
  ];
  variants.forEach((f, i) => { boilSeed('v' + i); f((i % 2) * W / 2, Math.floor(i / 2) * H / 2); });
};
LOOPS.probe.len = 1;
