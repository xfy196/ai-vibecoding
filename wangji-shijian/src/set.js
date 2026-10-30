// set.js — 《忘记时间》MV 的共享世界、角色与道具。所有 chapter 共用。
// 规则：只用水彩块面（paint 的 fill/wash）+ 墨线；纯 2D；每帧都是 t 的纯函数；
// 每个独立元素前调用 boilSeed（这里统一走 boil(key)），否则会整片抖。
// 构图：歌词条占 y≈975–1070，主要动作全部压在 y < 940。
const SET = (() => {
  // ---------- 本片的调色板 ----------
  // 这些是**颜料**色，不是屏幕色。p5.brush 叠色是乘法，fill 在纸上会淡成右边注释的样子（实测值）。
  // 用 fill 画水彩块面（边缘会自然渗开），用 wash 只有夜景才用（fill 有"浅底"，画不到深色）。
  const C = {
    paper: PAL.paper, ink: PAL.ink,
    // 天空 / 冷
    skyLt: '#A8C4E0',   // → 197,206,200
    skyMd: '#4D74CD',   // → 141,173,203
    skyDp: '#2D4E8C',   // → 130,165,188
    skyDk: '#17335E',   // → 125,158,172
    // 山
    hillFar: '#B2C1D4', // → 200,205,203
    hillMid: '#8A9AB0', // → 172,177,178
    hillNr:  '#6E7E96', // → 157,162,165
    // 地
    sand:   '#E8D2A8',  // → 230,213,182
    sandDk: '#C9A87A',  // → 216,195,160
    road:   '#F0E2C8',  // → 232,220,197
    // 暖 / 记忆
    gold:   '#F2C57A',  // → 234,206,148
    amber:  '#D9964E',  // → 212,174,120
    rust:   '#A85A20',  // → 206,155,95
    // 花
    rose:   '#D98A9E',  // → 226,181,184
    roseLt: '#E8B4BE',  // 更淡的花
    roseDk: '#A85A70',  // → 208,151,163
    // 水
    waterDk: '#256B6E', // → 95,167,164
    water:   '#3A9C98', // → 104,185,175
    // 紫
    vio:    '#5E4E96',  // → 153,139,183
    vioLt:  '#8A74B8',  // → 181,164,195
    vioXlt: '#B9A8D8',  // → 203,190,207
    moss:   '#8AA86E',  // → 164,179,135
    // 夜（wash 用的浓颜料，wash230 的实测显色）
    nite:   '#24457C',  // → 37,71,123
    niteDp: '#17335E',  // → 24,51,90
    niteMd: '#2D4E8C',  // → 46,80,139
    // 沿用
    night: '#20264E', indigo: '#2F3C7A', dusk: '#3D4478', duskLt: '#7C7EAC',
    violet: '#7B5CA8', teal: '#3A9C98', tealDk: '#2A6E77', sap: '#6E9F58',
    ochre: '#E8AA38', cream: '#FFF5E2', red: '#C0392B', dawn: '#F7E2C8', sky: '#8EC3E6',
    him: PAL.clay, himDk: PAL.clayDk, himLt: '#F5B394',
    her: '#BBD3E6', herDk: '#7E9CBC', herLt: '#E8F2FA',
  };
  const boil = k => boilSeed(k);
  // 把颜色朝背景色混过去，代替透明度（p5.brush 的墨线没有 alpha）
  const fade = (col, bg, k) => mixCol(col, bg, clamp(k));

  // ---------- 天空 ----------
  // 纸就是底：只用半透明水彩块面往上叠，纸纹始终透出来。
  // 一块柔和的晕染（带抖动边和颗粒），fills 的最基本单位。
  function mass(cx, cy, rx, ry, col, op, key, o = {}) {
    boil(key);
    paint(ellPts(cx, cy, rx, ry, 26, o.j ?? 22),
      { fill: col, fillOp: op, bleed: o.bleed ?? .34, tex: o.tex ?? .55, border: o.border ?? .55, ink: null });
  }
  // 天空：先用一层 fill 把最浅的调子铺满纸，再用同色系更深的 fill 压天顶。
  // 冷暖不要叠在一起——p5.brush 是乘法叠色，暖冷相撞会立刻发灰。
  // o.nite = 底色（wash），只有夜景用，因为 fill 有个"浅底"，画不到真正深的夜。
  function sky(t, o = {}) {
    const hz = o.hz ?? .84;
    if (o.nite) {
      boil('sky.nite');
      paint(rectPts(-900, -900, W + 1800, H + 1800), { wash: o.nite, washOp: o.niteOp ?? 230, ink: null });
    }
    if (o.base !== false) {
      boil('sky.base');
      paint(rectPts(-900, -900, W + 1800, H + 1800),
        { fill: o.base || C.skyLt, fillOp: o.baseOp ?? 255, bleed: .34, tex: .55, border: .6, ink: null });
    }
    if (o.top) mass(W * .5, -H * .08, W * 1.32, H * .64, o.top, o.topOp ?? 255, 'sky.top');
    if (o.mid) mass(W * .5, H * .34, W * 1.18, H * .34, o.mid, o.midOp ?? 255, 'sky.mid');
    // 靠地平线再压一道更暖/更实的调子（同色系，不会灰）
    const low = o.low || o.warm;
    if (low) mass(W * .5, H * (hz + .04), W * 1.22, H * .22, low, o.lowOp ?? o.warmOp ?? 255, 'sky.low');
    return hz * H;
  }

  // ---------- 云 ----------
  // 一条湿云带，随 t 慢慢漂。seed 决定形状。
  function cloud(x, y, w, h, col, seed, t, op = 130) {
    boil('cloud' + seed);
    const pts = [], n = 9;
    for (let i = 0; i <= n; i++) { const u = i / n; pts.push([x - w / 2 + w * u, y + Math.sin(u * 7 + seed) * h * .18 - h * .5 * Math.sin(u * Math.PI)]); }
    for (let i = n; i >= 0; i--) { const u = i / n; pts.push([x - w / 2 + w * u, y + h * .55 + Math.sin(u * 5 + seed * 2) * h * .2]); }
    paint(pts, { fill: col, fillOp: op, bleed: .3, tex: .45, border: .5, ink: null });
  }

  // ---------- 远山 / 丘陵 ----------
  // 一层山脊：只画出上缘（一条起伏的线），底边沉到画面外，所以不会变成一个"大椭圆色块"。
  // 采样的 x 一定铺满（并超出）画面，否则多边形两侧会留下竖直的边。
  // L = { cx, cy(山脚), rx(w), ry(h), col, tufts?, ink? }
  function hills(t, layers) {
    layers.forEach((L, i) => {
      const w = L.rx ?? L.w ?? 1200, h = L.ry ?? L.h ?? 160, cy = L.cy ?? 780;
      boil('hill' + i);
      const pts = [], n = 28, sh = (L.seed ?? i) * 7.3, x0 = -1100, x1 = W + 1100;
      for (let k = 0; k <= n; k++) {
        const x = x0 + (x1 - x0) * k / n;
        const d = (x - L.cx) / (w * .5);
        const shape = Math.pow(Math.max(0, 1 - d * d), L.p ?? .8);
        const jitK = 1 + .13 * Math.sin(x * .011 + sh) + .06 * Math.sin(x * .029 + sh * 2);
        pts.push([x, cy - h * shape * jitK + jit(1.5)]);
      }
      pts.push([x1, H + 900], [x0, H + 900]);
      paint(pts, { fill: L.col, fillOp: L.fillOp ?? 255, bleed: .18, tex: .6, border: .55,
        ink: L.ink === null ? null : (L.ink || C.ink), sw: L.sw ?? 1.1 });
      if (L.tufts) tufts(t, L.cx, cy - h * .92, w * .28, h * .12, L.tufts, L.col);
    });
  }
  // 山脊上的草：几笔细墨线，随风摆
  function tufts(t, cx, cy, rx, ry, n, col) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (hash(i + cx) - .5) * 1.7, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry + 3;
      const sw = wob(t, .5, hash(i) * 3) * 6;
      boil('tuft' + i);
      for (const k of [-1, 0, 1]) inkLine([[x + k * 8, y], [x + k * 12 + sw, y - 24 - 10 * hash(i + k)]], .7, mixCol(col, C.cream, .4), 'inkfine', .4);
    }
  }

  // ---------- 地 / 路 ----------
  // 一块从 y 铺到画面底的地面，上缘是一条起伏的缓坡（不是横线）。
  function ground(t, y, col, o = {}) {
    boil('ground');
    const pts = [], n = 14, sh = (o.seed ?? 3) * 4.7, amp = o.wave ?? 26;
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = -900 + (W + 1800) * u;
      pts.push([x, y + amp * Math.sin(u * 2.6 + sh) + amp * .45 * Math.sin(u * 6.3 + sh * 2) + jit(2)]);
    }
    pts.push([W + 900, H + 900], [-900, H + 900]);
    paint(pts, { fill: col, fillOp: o.fillOp ?? 255, bleed: .16, tex: .58, border: .5,
      ink: o.edge ? (o.edgeCol || mixCol(C.ink, col, .5)) : null, sw: o.sw ?? .8 });
    if (o.grass !== false) {
      for (let i = 0; i < (o.grass ?? 9); i++) {
        const u = hash(i + 71), x = -200 + (W + 400) * u;
        const yy = y + amp * Math.sin(u * 2.6 + sh) + amp * .45 * Math.sin(u * 6.3 + sh * 2);
        boil('grs' + i);
        const sw2 = wob(t, .5, hash(i) * 3) * 4;
        inkLine([[x, yy + 2], [x + 2 + sw2, yy - 14 - 10 * hash(i + 5)]], .7, mixCol(C.ink, col, .55), 'inkfine', .4);
      }
    }
  }
  // 一条从 (x0,y0) 宽 w0 收窄到 (x1,y1) 宽 w1 的路
  function road(x0, y0, w0, x1, y1, w1, col, o = {}) {
    boil('road');
    const pts = [[x0 - w0 / 2, y0], [x1 - w1 / 2, y1], [x1 + w1 / 2, y1], [x0 + w0 / 2, y0]];
    paint(pts, { fill: col, fillOp: o.fillOp ?? 255, bleed: .18, tex: .5, border: .55, ink: o.ink === null ? null : (o.ink || C.ink), sw: o.sw ?? .9 });
  }

  // ---------- 雨 ----------
  // 斜雨：一排细墨线，落得比 t 快。dir = 倾斜方向。
  function rain(t, o = {}) {
    const n = o.n ?? 46, a = o.ang ?? .22, len = o.len ?? 46, sp = o.speed ?? 900;
    for (let i = 0; i < n; i++) {
      boil('rain' + i);
      const x0 = hash(i) * (W + 400) - 200, ph = frac(hash(i + 50) + t * sp / (H + 200));
      const y = ph * (H + 260) - 130;
      const al = .35 + .5 * hash(i + 90);
      inkLine([[x0, y], [x0 + len * a, y + len]], (o.sw ?? .8) * (.7 + .6 * al), fade(o.col || C.duskLt, o.bg || C.night, 1 - al * .8), 'inkfine', .2);
    }
  }
  // 雨打在水面上的小圈
  function rainRings(t, y, o = {}) {
    const n = o.n ?? 9;
    for (let i = 0; i < n; i++) {
      boil('ring' + i);
      const ph = frac(hash(i + 7) + t * (o.speed ?? .7)), r = 6 + 46 * ph;
      const x = hash(i + 31) * W;
      const col = fade(o.col || C.teal, o.bg || C.night, .35 + .5 * ph);
      inkLine(ellPts(x, y + hash(i + 3) * 40, r, r * .28, 16), .8 * (1 - ph), col, 'inkfine', .5);
    }
  }

  // ---------- 钟 ----------
  // 天上的巨钟。hand = 指针走过的"圈数"（可以是负数 = 倒着走）。fade 0..1 往 bg 褪。
  function clock(x, y, r, t, o = {}) {
    const f = clamp(o.fade ?? 0), bg = o.bg || C.dusk;
    const face = fade(o.face || '#FFF0D0', bg, .30 + .68 * f);
    const mark = fade(C.ink, bg, .42 + .56 * f);
    boil('clock.face');
    paint(ellPts(x, y, r, r, 40, r * .016), { fill: face, fillOp: o.fillOp ?? 210, bleed: .22, tex: .5, border: .5, ink: mark, sw: o.sw ?? .9 });
    const sw = clamp(r / 220, .5, 1.6);
    if (o.ticks !== false) {
      boil('clock.ticks');
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * TAU - Math.PI / 2, k = i % 3 === 0 ? .82 : .88;
        inkLine([[x + Math.cos(a) * r * k, y + Math.sin(a) * r * k], [x + Math.cos(a) * r * .97, y + Math.sin(a) * r * .97]],
          sw * (i % 3 === 0 ? 1.5 : .9), mark, 'ink', 0);
      }
    }
    // 指针：分针走 hand 圈，时针走 hand/12 圈
    const hands = [[o.hand ?? 0, .72, 1.4], [(o.hand ?? 0) / 12, .46, 2.0]];
    boil('clock.hands');
    for (const [turnN, len, wgt] of hands) {
      const a = turnN * TAU - Math.PI / 2;
      inkLine([[x - Math.cos(a) * r * .08, y - Math.sin(a) * r * .08], [x + Math.cos(a) * r * len, y + Math.sin(a) * r * len]], sw * wgt, mark, 'ink', 0);
    }
    boil('clock.pin');
    paint(ellPts(x, y, r * .035, r * .035, 10), { wash: mark, ink: null });
  }

  // ---------- 枫叶 ----------
  // 一片枫叶：(x,y) 叶心，r 半径，rot 转角。掉下来/飘上去都靠调用方给位置。
  function leaf(x, y, r, rot, o = {}) {
    const col = o.col || C.ochre, dark = o.dark || mixCol(C.ochre, C.red, .45);
    boil(o.key || 'leaf');
    push(); translate(x, y); rotate(rot);
    const pts = [];
    for (let i = 0; i < 10; i++) {           // 5 个尖 5 个凹
      const a = i / 10 * TAU - Math.PI / 2, q = i % 2 ? r * .34 : r * (i === 0 ? 1.05 : .88);
      pts.push([Math.cos(a) * q, Math.sin(a) * q]);
    }
    paint(pts, { wash: col, washOp: 245, fill: dark, fillOp: 120, bleed: .1, tex: .55, ink: o.ink === null ? null : (o.ink || C.ink), sw: clamp(r / 22, .55, 1.4), curv: .3 });
    inkLine([[0, 0], [0, r * .95]], clamp(r / 34, .4, 1.1), o.ink || C.ink, 'ink', 0);   // 叶脉/叶柄
    pop();
  }

  // ---------- 花瓣 ----------
  function petal(x, y, r, rot, col, o = {}) {
    boil(o.key || 'petal');
    paint(ellPts(x, y, r, r * .58, 12, r * .05, rot), { wash: col, washOp: o.op ?? 235, ink: o.ink === null ? null : fade(o.ink || C.ink, col, .55), sw: .7 });
  }

  // ---------- 星 ----------
  function star(x, y, r, tw, col, o = {}) {
    boil(o.key || 'star');
    paint(starPts(x, y, r * tw, .34, o.n || 4, (o.rot || 0) + tw * .3), { wash: col, washOp: o.op ?? 240, ink: null });
  }

  // ---------- 鸟 ----------
  // 两只小翅膀的简笔鸟，扇翅相位不同。
  function bird(x, y, s, t, ph, col) {
    boil('bird' + ph);
    const k = Math.sin(t * 9 + ph) * .5;
    inkLine([[x - s, y - s * .3 * k], [x - s * .4, y - s * .5], [x, y]], 1, col, 'ink', .5);
    inkLine([[x, y], [x + s * .4, y - s * .5], [x + s, y - s * .3 * k]], 1, col, 'ink', .5);
  }

  // ---------- 她 ----------
  // 奶油淡蓝的小 Clawd。o 里可以放任何 clawd() 选项。
  function her(x, y, u, o = {}) {
    return clawd(x, y, u, { col: C.her, dk: C.herDk, lt: C.herLt, ...o });
  }
  // 他
  function him(x, y, u, o = {}) {
    return clawd(x, y, u, { col: C.him, dk: C.himDk, lt: C.himLt, ...o });
  }

  // ---------- 红线 ----------
  // 一根用 ribbon 画的红线。P = 点列，w = 粗。松的时候自然下垂，用 sag 给中点加重量。
  function thread(P, w, o = {}) {
    boil(o.key || 'thread');
    const pts = [];
    for (let i = 0; i < P.length; i++) {
      const p = P[i], u = P.length > 1 ? i / (P.length - 1) : 0;
      const sag = (o.sag || 0) * 4 * u * (1 - u);
      pts.push([p[0], p[1] + sag]);
    }
    const C2 = through(pts, 5);
    paint(ribbon(C2, w, w * .8), { wash: o.col || C.red, ink: o.ink === null ? null : (o.ink || mixCol(C.red, C.ink, .5)), sw: .8 });
  }

  // ---------- 水 ----------
  // 一片水面：一条横向的水彩带 + 几道横向墨线（波纹）+ 若干闪光。
  function water(t, y, col, o = {}) {
    boil('water');
    const pts = [], sh = (o.seed || 0) * 4.7;
    for (let i = 0; i <= 14; i++) {
      const u = i / 14, x = -900 + (W + 1800) * u;
      pts.push([x, y + 10 * Math.sin(u * 2.4 + sh) + 5 * Math.sin(u * 6.1 + sh) + jit(2)]);
    }
    pts.push([W + 900, H + 900], [-900, H + 900]);
    paint(pts, { fill: col, fillOp: o.fillOp ?? 255, bleed: .18, tex: .58, border: .5, ink: o.edge ? mixCol(C.ink, col, .55) : null, sw: .8 });
    for (let i = 0; i < (o.lines ?? 7); i++) {
      boil('wline' + i);
      const yy = y + 22 + i * (o.gap ?? 34) + Math.sin(t * .8 + i) * 3;
      for (let k = 0; k < 3; k++) {
        const cx = hash(i * 7 + k + 3) * W, len = 90 + 260 * hash(i + k * 5);
        if (cx + len < -100 || cx > W + 100) continue;
        inkLine([[cx, yy + jit(2)], [cx + len * .5, yy + 2 + jit(2)], [cx + len, yy]], .7, fade(o.lineCol || C.duskLt, col, .35), 'inkfine', .5);
      }
    }
  }

  // ---------- 星野 ----------
  function starField(t, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const x = hash(i + (o.seed || 0)) * (W + 240) - 120, y = hash(i + 100 + (o.seed || 0)) * (o.h ?? H * .62);
      const tw = .5 + .5 * Math.sin(t * (1.6 + 2 * hash(i + 300)) + i);
      boil('sf' + i);
      paint(starPts(x, y, (o.r ?? 5) * (.6 + .7 * hash(i + 200)) * (.75 + .35 * tw), .34, 4, tw), { wash: o.col || C.cream, washOp: o.op ?? 235, ink: null });
    }
  }

  // ---------- 飘落的花瓣 ----------
  function petalFall(t, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const sp = o.sp ?? 60, ph = frac(hash(i + 11) + t * sp / (H + 260));
      const y = lerp(o.y0 ?? -120, o.y1 ?? H + 120, ph);
      const x = lerp(o.x0 ?? -100, o.x1 ?? W + 100, hash(i + 31)) + Math.sin(t * .9 + i) * (o.sway ?? 60);
      petal(x, y, (o.r ?? 15) * (.6 + .7 * hash(i + 7)), t * .8 + i, o.col || C.roseLt, { key: 'pf' + i });
    }
  }

  // ---------- 灯笼 ----------
  function lantern(x, y, r, t, o = {}) {
    const sw = Math.sin(t * 1.3 + (o.ph || 0)) * .08;
    glow(x, y, r * (o.glow ?? 3.4), o.col || '#FFCE7A', o.glowA ?? .85);
    push(); translate(x, y); rotate(sw);
    boil('lantern' + (o.key || ''));
    paint(ellPts(0, 0, r, r * 1.12, 22, 1.2), { fill: o.col2 || C.amber, fillOp: 255, bleed: .16, tex: .5, ink: C.ink, sw: 1 });
    inkLine([[0, -r * 1.12], [0, -r * 1.5]], .9, C.ink, 'ink', 0);
    inkLine([[-r * .8, r * 1.05], [r * .8, r * 1.05]], .9, C.ink, 'ink', 0);
    pop();
  }

  // ---------- 小工具 ----------
  // 从 a 到 b 的二段式路径（带一点弧度），给红线 / 光路用
  function arcP(a, b, bend, n = 5) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, p = arcPt(a, b, bend, u);
      out.push(p);
    }
    return out;
  }
  // 一束柔光（画在要照亮的物体之前）
  function light(x, y, r, col, a) { glow(x, y, r, col, a); }

  return { C, boil, fade, sky, cloud, hills, tufts, ground, road, rain, rainRings, clock, leaf, petal, star, bird, her, him, thread, arcP, light, water, starField, petalFall, lantern, mass };
})();
