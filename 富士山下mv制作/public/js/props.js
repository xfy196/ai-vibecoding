/* =========================================================
   道具：全部预渲染成离屏画布，正片里只做 transform 变换
   ========================================================= */
(function (MV) {
  'use strict';
  const { makeCanvas, roundRect, tornRect, rng } = MV.util;

  const C = {
    paper: '#e9e4d8',
    paperDark: '#ddd6c6',
    ink: '#242019',
    ink2: '#5f584b',
    ink3: '#8d8474',
    kraft: '#cdb78c',
    kraftDark: '#8a6f45',
    red: '#a5301f',
    red2: '#b03325',
    navy: '#33445c',
    navyDark: '#24303f',
    coatLine: '#1d2733'
  };

  const PAD = 34;

  /* ---------------------------------------------------------
     通用：塑料证物袋
     --------------------------------------------------------- */
  function drawBag(x, w, h, opt = {}) {
    // 袋子本体：极淡，靠边光和折痕立起来
    const g = x.createLinearGradient(0, 0, w * 0.9, h);
    g.addColorStop(0, 'rgba(255,255,255,0.34)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.03)');
    g.addColorStop(0.78, 'rgba(255,255,255,0.10)');
    g.addColorStop(1, 'rgba(255,255,255,0.30)');
    x.fillStyle = g;
    roundRect(x, 0, 0, w, h, 5);
    x.fill();

    // 边：外亮内暗，像一层膜
    x.strokeStyle = 'rgba(255,255,255,0.55)';
    x.lineWidth = 1.6;
    roundRect(x, 1, 1, w - 2, h - 2, 5);
    x.stroke();
    x.strokeStyle = 'rgba(120,118,108,0.22)';
    x.lineWidth = 1;
    roundRect(x, 4, 4, w - 8, h - 8, 4);
    x.stroke();

    // 封口条
    x.fillStyle = 'rgba(255,255,255,0.48)';
    x.fillRect(0, 0, w, 15);
    x.fillStyle = 'rgba(255,255,255,0.85)';
    x.fillRect(0, 13, w, 2);
    x.strokeStyle = 'rgba(110,110,110,0.35)';
    x.lineWidth = 1;
    x.setLineDash([5, 4]);
    x.beginPath(); x.moveTo(0, 16.5); x.lineTo(w, 16.5); x.stroke();
    x.setLineDash([]);

    // 一道斜反光 + 底部折痕
    x.save();
    x.beginPath(); roundRect(x, 0, 0, w, h, 5); x.clip();
    const s = x.createLinearGradient(w * 0.05, 0, w * 0.62, h);
    s.addColorStop(0, 'rgba(255,255,255,0.0)');
    s.addColorStop(0.42, 'rgba(255,255,255,0.30)');
    s.addColorStop(0.52, 'rgba(255,255,255,0.02)');
    s.addColorStop(1, 'rgba(255,255,255,0.0)');
    x.fillStyle = s;
    x.fillRect(-w * 0.2, -h * 0.3, w * 1.6, h * 1.6);
    x.strokeStyle = 'rgba(120,118,108,0.16)';
    x.lineWidth = 1.4;
    x.beginPath(); x.moveTo(6, h - 10); x.lineTo(w - 6, h - 10); x.stroke();
    x.restore();
  }

  /* ---------------------------------------------------------
     001 风褛（旧外套，装在证物袋里 / 取出后）
     --------------------------------------------------------- */
  function coatPath(x) {
    x.beginPath();
    x.moveTo(150, 22);
    x.lineTo(128, 30); x.lineTo(104, 42); x.lineTo(86, 58);
    x.lineTo(46, 240); x.lineTo(44, 296); x.lineTo(86, 306);
    x.lineTo(94, 250); x.lineTo(96, 190); x.lineTo(96, 392);
    x.lineTo(204, 392); x.lineTo(204, 190); x.lineTo(206, 250);
    x.lineTo(214, 306); x.lineTo(256, 296); x.lineTo(254, 240);
    x.lineTo(214, 58); x.lineTo(196, 42); x.lineTo(172, 30);
    x.closePath();
  }

  function coatShape(x) {
    /* ---------- 布面：底色的明暗 ---------- */
    coatPath(x);
    const g = x.createLinearGradient(40, 20, 260, 400);
    g.addColorStop(0, '#33465f');
    g.addColorStop(0.42, '#28374b');
    g.addColorStop(1, '#1b2634');
    x.fillStyle = g;
    x.fill();

    /* ---------- 布纹 + 折痕（裁在衣服里） ---------- */
    x.save();
    coatPath(x);
    x.clip();

    // 羊毛颗粒
    const rt = rng(771);
    for (let i = 0; i < 2600; i++) {
      const px = 30 + rt() * 245, py = 15 + rt() * 385;
      const l = 1 + rt() * 2.6;
      x.beginPath();
      x.moveTo(px, py);
      x.lineTo(px + (rt() - 0.5) * l, py + l);
      x.strokeStyle = rt() > 0.55
        ? `rgba(150,172,200,${0.05 + rt() * 0.09})`
        : `rgba(8,13,20,${0.06 + rt() * 0.10})`;
      x.lineWidth = 0.8;
      x.stroke();
    }

    // 袖子与身体的交界阴影
    const arm = (ax, dir) => {
      const ag = x.createLinearGradient(ax, 0, ax + 26 * dir, 0);
      ag.addColorStop(0, 'rgba(7,12,19,0.55)');
      ag.addColorStop(1, 'rgba(7,12,19,0)');
      x.fillStyle = ag;
      x.fillRect(Math.min(ax, ax + 26 * dir), 60, 26, 250);
    };
    arm(96, 1);
    arm(204, -1);

    // 前襟两侧的竖向明暗
    const fg = x.createLinearGradient(120, 0, 196, 0);
    fg.addColorStop(0, 'rgba(6,11,18,0.12)');
    fg.addColorStop(0.42, 'rgba(6,11,18,0.30)');
    fg.addColorStop(0.5, 'rgba(120,146,180,0.10)');
    fg.addColorStop(0.6, 'rgba(6,11,18,0.22)');
    fg.addColorStop(1, 'rgba(6,11,18,0.10)');
    x.fillStyle = fg;
    x.fillRect(96, 90, 108, 302);

    // 折痕：暗线 + 紧邻的高光
    const fold = (pts, w, dark, light) => {
      x.beginPath();
      x.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i += 2) {
        x.quadraticCurveTo(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
      }
      x.strokeStyle = dark;
      x.lineWidth = w;
      x.lineCap = 'round';
      x.stroke();
      x.save();
      x.translate(2.4, 1.2);
      x.strokeStyle = light;
      x.lineWidth = w * 0.45;
      x.stroke();
      x.restore();
    };
    fold([[110, 96], [118, 200], [104, 300], [100, 380]], 9, 'rgba(8,13,20,0.30)', 'rgba(150,174,204,0.10)');
    fold([[192, 100], [186, 190], [196, 280], [200, 378]], 8, 'rgba(8,13,20,0.26)', 'rgba(150,174,204,0.09)');
    fold([[60, 240], [68, 268], [58, 296]], 7, 'rgba(8,13,20,0.26)', 'rgba(150,174,204,0.08)');
    fold([[240, 244], [232, 272], [242, 296]], 7, 'rgba(8,13,20,0.24)', 'rgba(150,174,204,0.08)');
    // 下摆的横向堆褶
    fold([[104, 352], [130, 344], [152, 356], [176, 344], [200, 352]], 6, 'rgba(8,13,20,0.22)', 'rgba(150,174,204,0.07)');

    // 双肩的落光
    const lg = x.createRadialGradient(112, 40, 6, 150, 110, 190);
    lg.addColorStop(0, 'rgba(160,186,216,0.22)');
    lg.addColorStop(0.55, 'rgba(120,146,180,0.06)');
    lg.addColorStop(1, 'rgba(120,146,180,0)');
    x.fillStyle = lg;
    x.fillRect(30, 15, 250, 390);

    // 肩头的磨损发白
    const wg = x.createRadialGradient(150, 26, 4, 150, 26, 62);
    wg.addColorStop(0, 'rgba(190,200,214,0.26)');
    wg.addColorStop(1, 'rgba(190,200,214,0)');
    x.fillStyle = wg;
    x.fillRect(80, 10, 140, 90);
    x.restore();

    /* ---------- 轮廓 ---------- */
    coatPath(x);
    x.strokeStyle = 'rgba(12,19,28,0.9)';
    x.lineWidth = 3;
    x.lineJoin = 'round';
    x.stroke();
    // 右下方一道底光，把衣服从纸上抬起来
    x.beginPath();
    x.moveTo(206, 250); x.lineTo(214, 306); x.lineTo(256, 296);
    x.strokeStyle = 'rgba(120,142,172,0.45)';
    x.lineWidth = 1.4;
    x.stroke();

    /* ---------- 领子：翻领 ---------- */
    // 后领座
    x.beginPath();
    x.moveTo(126, 34);
    x.lineTo(150, 22);
    x.lineTo(174, 34);
    x.lineTo(166, 56);
    x.lineTo(150, 48);
    x.lineTo(134, 56);
    x.closePath();
    x.fillStyle = '#1a2532';
    x.fill();
    x.strokeStyle = 'rgba(8,13,20,0.9)';
    x.lineWidth = 1.6;
    x.stroke();

    // 两片翻领
    const lapel = (dir) => {
      x.beginPath();
      x.moveTo(150, 46);
      x.lineTo(150 - 20 * dir, 34);
      x.lineTo(150 - 54 * dir, 60);
      x.lineTo(150 - 40 * dir, 124);
      x.lineTo(150 - 4 * dir, 106);
      x.closePath();
      const lgg = x.createLinearGradient(150 - 54 * dir, 40, 150, 120);
      lgg.addColorStop(0, '#33465f');
      lgg.addColorStop(1, '#213044');
      x.fillStyle = lgg;
      x.fill();
      x.strokeStyle = 'rgba(9,15,23,0.85)';
      x.lineWidth = 1.6;
      x.stroke();
      // 领边的一线高光
      x.beginPath();
      x.moveTo(150 - 20 * dir, 36);
      x.lineTo(150 - 52 * dir, 61);
      x.lineTo(150 - 39 * dir, 122);
      x.strokeStyle = 'rgba(146,168,198,0.34)';
      x.lineWidth = 1.2;
      x.stroke();
    };
    lapel(1);
    lapel(-1);

    // 领口里子
    x.beginPath();
    x.moveTo(140, 52);
    x.quadraticCurveTo(150, 66, 160, 52);
    x.strokeStyle = 'rgba(5,9,14,0.8)';
    x.lineWidth = 4;
    x.lineCap = 'round';
    x.stroke();

    /* ---------- 门襟 + 扣子 ---------- */
    x.beginPath(); x.moveTo(150, 86); x.lineTo(150, 390);
    x.strokeStyle = 'rgba(9,14,22,0.5)'; x.lineWidth = 2; x.stroke();
    x.beginPath(); x.moveTo(153, 86); x.lineTo(153, 390);
    x.strokeStyle = 'rgba(150,172,200,0.10)'; x.lineWidth = 1.4; x.stroke();

    // 双排扣的门襟布条
    x.beginPath();
    x.moveTo(150, 86); x.lineTo(168, 92); x.lineTo(168, 380); x.lineTo(150, 380);
    x.strokeStyle = 'rgba(9,14,22,0.16)';
    x.lineWidth = 1;
    x.stroke();

    [176, 222, 268].forEach((cy) => {
      [157, 139].forEach((bx0, bi) => {
        const rr2 = 7 - bi * 1.4;
        x.beginPath(); x.arc(bx0, cy, rr2, 0, 7);
        const bg = x.createRadialGradient(bx0 - 2, cy - 2, 1, bx0, cy, rr2 + 1);
        bg.addColorStop(0, bi ? '#b8533f' : '#d05a48');
        bg.addColorStop(0.7, bi ? '#8f2f22' : C.red2);
        bg.addColorStop(1, bi ? '#651b13' : '#7d221a');
        x.fillStyle = bg;
        x.fill();
        x.strokeStyle = bi ? 'rgba(12,20,30,0.7)' : 'rgba(60,12,8,0.6)';
        x.lineWidth = 0.9;
        x.stroke();
        x.beginPath();
        x.arc(bx0 - 2, cy - 2, 1.3, 0, 7);
        x.fillStyle = bi ? 'rgba(200,216,236,0.4)' : 'rgba(255,225,215,0.55)';
        x.fill();
      });
    });

    /* ---------- 袖子上的缝线 ---------- */
    const stitch = (pts) => {
      x.beginPath();
      x.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i += 2) {
        x.quadraticCurveTo(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
      }
      x.setLineDash([3.2, 3]);
      x.strokeStyle = 'rgba(168,186,210,0.22)';
      x.lineWidth = 1;
      x.stroke();
      x.setLineDash([]);
    };
    stitch([[52, 250], [60, 268], [52, 290]]);
    stitch([[248, 252], [240, 270], [248, 292]]);

    /* ---------- 磨破的袖口（"磨到有襟花"） ---------- */
    x.save();
    x.beginPath(); x.ellipse(46, 268, 13, 20, -0.2, 0, 7); x.clip();
    for (let i = 0; i < 26; i++) {
      const rr = rng(100 + i)();
      x.beginPath();
      x.moveTo(34 + rr * 24, 248 + ((i * 37) % 44));
      x.lineTo(34 + rr * 24 + (rr - 0.5) * 10, 248 + ((i * 37) % 44) + 7);
      x.strokeStyle = 'rgba(168,180,198,0.5)';
      x.lineWidth = 1.3;
      x.stroke();
    }
    x.restore();
    x.beginPath(); x.ellipse(46, 268, 7, 11, -0.2, 0, 7);
    x.fillStyle = 'rgba(12,17,25,0.62)'; x.fill();
    x.strokeStyle = 'rgba(196,206,220,0.45)';
    x.lineWidth = 1;
    x.stroke();
  }

  function coatBag() {
    const W = 380, H = 330;
    const { canvas, ctx: x } = makeCanvas(W + PAD * 2, H + PAD * 2);
    x.translate(PAD, PAD);
    drawBag(x, W, H, { seed: 11 });

    x.save();
    x.translate(W / 2, H / 2 + 4);
    x.scale(0.72, 0.72);
    x.translate(-150, -210);
    coatShape(x);
    x.restore();

    return { cv: canvas, w: W + PAD * 2, h: H + PAD * 2, pad: PAD, content: { w: W, h: H } };
  }

  /* 取出后的外套：更大、带一层布面高光 */
  function coatFree() {
    const W = 400, H = 470;
    const { canvas, ctx: x } = makeCanvas(W + PAD * 2, H + PAD * 2);
    x.translate(PAD, PAD);

    x.save();
    x.translate(W / 2, H / 2 + 4);
    x.scale(0.90, 0.90);
    x.translate(-150, -210);
    coatShape(x);
    x.restore();

    // 平铺的折痕：两道路光
    x.save();
    x.globalCompositeOperation = 'source-atop';
    x.strokeStyle = 'rgba(140,160,190,0.16)';
    x.lineWidth = 5;
    x.beginPath(); x.moveTo(120, 120); x.lineTo(150, 430); x.stroke();
    x.beginPath(); x.moveTo(290, 110); x.lineTo(262, 420); x.stroke();
    x.restore();

    return { cv: canvas, w: W + PAD * 2, h: H + PAD * 2, pad: PAD, content: { w: W, h: H } };
  }

  /* ---------------------------------------------------------
     002 车票 ×2
     --------------------------------------------------------- */
  function tickets() {
    const W = 300, H = 178;
    const { canvas, ctx: x } = makeCanvas(W + PAD * 2, H + PAD * 2);
    x.translate(PAD, PAD);

    const card = (ox, oy, rot, bg, seed) => {
      x.save();
      x.translate(ox, oy);
      x.rotate(rot);
      x.shadowColor = 'rgba(0,0,0,0.30)';
      x.shadowBlur = 16;
      x.shadowOffsetY = 8;
      x.fillStyle = bg;
      roundRect(x, 0, 0, 262, 104, 3);
      x.fill();
      x.shadowColor = 'transparent';
      x.strokeStyle = 'rgba(120,112,96,0.35)';
      x.lineWidth = 1;
      x.stroke();
      // 打孔线
      x.beginPath(); x.moveTo(26, 4); x.lineTo(26, 100);
      x.setLineDash([4, 4]);
      x.strokeStyle = 'rgba(150,145,130,0.8)';
      x.stroke();
      x.setLineDash([]);
      // 文字
      x.fillStyle = '#4a4438';
      x.font = '400 9px "SF Mono", Menlo, monospace';
      x.textBaseline = 'middle';
      const rows = [
        '新宿 → 河口湖',
        'SHINJUKU / KAWAGUCHIKO',
        '2019.02.14   09:42',
        '¥ 1,750    指定席'
      ];
      rows.forEach((s, i) => x.fillText(s, 40, 22 + i * 20));
      // 检票孔
      if (seed === 2) {
        x.beginPath(); x.arc(232, 54, 5, 0, 7);
        x.fillStyle = 'rgba(70,64,54,0.5)'; x.fill();
      }
      x.restore();
    };

    card(6, 8, -0.10, '#f5f0e3', 1);
    card(18, 72, 0.045, '#efe8d8', 2);

    return { cv: canvas, w: W + PAD * 2, h: H + PAD * 2, pad: PAD, content: { w: W, h: H } };
  }

  /* ---------------------------------------------------------
     003 花瓣（压在证物袋里）
     --------------------------------------------------------- */
  function petalBag() {
    const W = 210, H = 170;
    const { canvas, ctx: x } = makeCanvas(W + PAD * 2, H + PAD * 2);
    x.translate(PAD, PAD);

    // 纸上渗出的花渍
    const st = x.createRadialGradient(W / 2, H / 2, 6, W / 2, H / 2, 74);
    st.addColorStop(0, 'rgba(178,88,80,0.16)');
    st.addColorStop(0.6, 'rgba(178,88,80,0.07)');
    st.addColorStop(1, 'rgba(178,88,80,0)');
    x.fillStyle = st;
    x.beginPath(); x.arc(W / 2, H / 2, 76, 0, 7); x.fill();

    drawBag(x, W, H, { seed: 21 });

    x.save();
    x.translate(W / 2 - 4, H / 2 + 2);
    x.rotate(-0.16);

    // 花影
    x.save();
    x.globalAlpha = 0.22;
    x.translate(1.5, 2.5);
    x.fillStyle = '#5d4438';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      x.beginPath();
      x.ellipse(Math.cos(a) * 22, Math.sin(a) * 22, 12, 18, a + Math.PI / 2, 0, 7);
      x.fill();
    }
    x.restore();

    // 压平的五瓣
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      x.save();
      x.translate(Math.cos(a) * 21, Math.sin(a) * 21);
      x.rotate(a + Math.PI / 2);
      const g = x.createLinearGradient(0, -16, 0, 16);
      g.addColorStop(0, 'rgba(190,96,88,0.95)');
      g.addColorStop(0.6, 'rgba(172,78,72,0.92)');
      g.addColorStop(1, 'rgba(146,64,60,0.9)');
      x.beginPath();
      x.moveTo(0, -17);
      x.bezierCurveTo(11, -12, 13, 6, 0, 15);
      x.bezierCurveTo(-13, 6, -11, -12, 0, -17);
      x.closePath();
      x.fillStyle = g;
      x.fill();
      x.strokeStyle = 'rgba(238,222,200,0.55)';
      x.lineWidth = 1.2;
      x.stroke();
      // 花脉
      x.strokeStyle = 'rgba(120,48,44,0.35)';
      x.lineWidth = 0.7;
      x.beginPath(); x.moveTo(0, -13); x.lineTo(0, 11); x.stroke();
      x.restore();
    }
    x.beginPath(); x.arc(0, 0, 4.2, 0, 7);
    x.fillStyle = '#7d3a33'; x.fill();

    // 枝与两片落叶
    x.beginPath();
    x.moveTo(0, 8);
    x.bezierCurveTo(4, 26, 16, 40, 34, 50);
    x.strokeStyle = 'rgba(96,84,52,0.75)';
    x.lineWidth = 1.8;
    x.stroke();

    x.save();
    x.translate(44, 56);
    x.rotate(0.7);
    x.beginPath();
    x.moveTo(0, -13);
    x.bezierCurveTo(10, -9, 11, 6, 0, 12);
    x.bezierCurveTo(-11, 6, -10, -9, 0, -13);
    x.fillStyle = 'rgba(178,86,80,0.82)';
    x.fill();
    x.restore();

    x.save();
    x.translate(-46, 62);
    x.rotate(-0.5);
    x.beginPath();
    x.moveTo(0, -12);
    x.bezierCurveTo(9, -8, 10, 6, 0, 11);
    x.bezierCurveTo(-10, 6, -9, -8, 0, -12);
    x.fillStyle = 'rgba(170,82,76,0.7)';
    x.fill();
    x.restore();

    x.restore();

    return { cv: canvas, w: W + PAD * 2, h: H + PAD * 2, pad: PAD, content: { w: W, h: H } };
  }

  /* ---------------------------------------------------------
     004 石头（"前尘硬化像石头"）
     --------------------------------------------------------- */
  function stone() {
    const W = 220, H = 190;
    const { canvas, ctx: x } = makeCanvas(W + PAD * 2, H + PAD * 2);
    x.translate(PAD, PAD);

    x.save();
    x.translate(W / 2, H / 2 + 4);

    // 不规则的圆石轮廓
    const r = rng(5150);
    const N = 16;
    const pts = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const rad = 78 + Math.sin(i * 2.31 + 0.6) * 5 + (r() - 0.5) * 9;
      pts.push([Math.cos(a) * rad * 1.06, Math.sin(a) * rad * 0.86]);
    }
    const rockPath = () => {
      x.beginPath();
      x.moveTo((pts[0][0] + pts[N - 1][0]) / 2, (pts[0][1] + pts[N - 1][1]) / 2);
      for (let i = 0; i < N; i++) {
        const p = pts[i], q = pts[(i + 1) % N];
        x.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
      }
      x.closePath();
    };

    rockPath();
    const g = x.createLinearGradient(-62, -66, 54, 62);
    g.addColorStop(0, '#928d7e');
    g.addColorStop(0.5, '#777366');
    g.addColorStop(1, '#524f47');
    x.fillStyle = g;
    x.fill();
    x.strokeStyle = '#46433b';
    x.lineWidth = 2.2;
    x.stroke();

    // 石面颗粒
    x.save();
    rockPath();
    x.clip();
    const rr = rng(991);
    for (let i = 0; i < 620; i++) {
      const px = (rr() - 0.5) * 180, py = (rr() - 0.5) * 150;
      const s = rr() * 1.7 + 0.4;
      x.fillStyle = rr() > 0.5 ? `rgba(210,204,186,${0.10 + rr() * 0.22})` : `rgba(48,45,38,${0.10 + rr() * 0.24})`;
      x.beginPath(); x.arc(px, py, s, 0, 7); x.fill();
    }
    // 顶光
    const lg = x.createRadialGradient(-34, -44, 10, -10, -10, 120);
    lg.addColorStop(0, 'rgba(255,255,255,0.22)');
    lg.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = lg;
    x.fillRect(-110, -95, 220, 190);
    // 底部压暗
    const dg = x.createLinearGradient(0, 30, 0, 90);
    dg.addColorStop(0, 'rgba(30,28,22,0)');
    dg.addColorStop(1, 'rgba(30,28,22,0.4)');
    x.fillStyle = dg;
    x.fillRect(-110, 20, 220, 80);
    x.restore();

    // 石面的小凹坑
    x.save();
    rockPath();
    x.clip();
    for (let i = 0; i < 8; i++) {
      const rr2 = rng(240 + i);
      const cx0 = -58 + rr2() * 116;
      const cy0 = -44 + rr2() * 86;
      const pr = 5 + rr2() * 11;
      const pg2 = x.createRadialGradient(cx0 - pr * 0.32, cy0 - pr * 0.35, 1, cx0, cy0, pr);
      pg2.addColorStop(0, 'rgba(206,200,184,0.26)');
      pg2.addColorStop(0.55, 'rgba(96,92,80,0.16)');
      pg2.addColorStop(1, 'rgba(60,57,48,0)');
      x.fillStyle = pg2;
      x.beginPath(); x.arc(cx0, cy0, pr, 0, 7); x.fill();
    }
    // 几道浅划痕
    for (let i = 0; i < 4; i++) {
      const rr2 = rng(280 + i);
      x.beginPath();
      x.moveTo(-60 + rr2() * 30, 10 + i * 14);
      x.lineTo(-10 + rr2() * 40, 4 + i * 12);
      x.strokeStyle = `rgba(60,57,48,${0.08 + rr2() * 0.1})`;
      x.lineWidth = 0.9;
      x.stroke();
    }
    x.restore();

    // 一道裂
    x.beginPath();
    x.moveTo(58, -18);
    x.bezierCurveTo(44, -2, 34, 16, 18, 30);
    x.strokeStyle = 'rgba(40,37,30,0.5)';
    x.lineWidth = 1.4;
    x.stroke();

    x.restore();

    return { cv: canvas, w: W + PAD * 2, h: H + PAD * 2, pad: PAD, content: { w: W, h: H } };
  }

  /* ---------------------------------------------------------
     005 试管（"试管里找不到它染污眼眸"）
     --------------------------------------------------------- */
  function tube() {
    const W = 96, H = 300;
    const { canvas, ctx: x } = makeCanvas(W + PAD * 2, H + PAD * 2);
    x.translate(PAD, PAD);

    x.save();
    x.translate(W / 2, 18);

    // 玻璃
    x.beginPath();
    x.moveTo(-26, 0);
    x.lineTo(-26, 232);
    x.quadraticCurveTo(-26, 264, 0, 264);
    x.quadraticCurveTo(26, 264, 26, 232);
    x.lineTo(26, 0);
    x.closePath();
    const g = x.createLinearGradient(-26, 0, 26, 0);
    g.addColorStop(0, 'rgba(255,255,255,0.92)');
    g.addColorStop(0.45, 'rgba(222,232,232,0.38)');
    g.addColorStop(1, 'rgba(255,255,255,0.86)');
    x.fillStyle = g;
    x.fill();
    x.strokeStyle = 'rgba(88,102,108,0.55)';
    x.lineWidth = 2;
    x.stroke();

    // 墨
    x.save();
    x.beginPath();
    x.moveTo(-26, 0); x.lineTo(-26, 232);
    x.quadraticCurveTo(-26, 264, 0, 264);
    x.quadraticCurveTo(26, 264, 26, 232);
    x.lineTo(26, 0); x.closePath();
    x.clip();
    const ink = x.createRadialGradient(0, 236, 4, 0, 210, 82);
    ink.addColorStop(0, 'rgba(16,21,25,0.92)');
    ink.addColorStop(0.55, 'rgba(38,50,56,0.42)');
    ink.addColorStop(1, 'rgba(58,74,78,0.0)');
    x.fillStyle = ink;
    x.fillRect(-30, 120, 60, 150);
    x.restore();

    // 高光
    x.beginPath();
    x.moveTo(-16, 24);
    x.quadraticCurveTo(-19, 120, -15, 210);
    x.strokeStyle = 'rgba(255,255,255,0.8)';
    x.lineWidth = 7;
    x.lineCap = 'round';
    x.stroke();

    // 胶塞
    x.fillStyle = '#9aa7aa';
    roundRect(x, -30, -16, 60, 18, 5);
    x.fill();
    x.strokeStyle = '#6d7a7d';
    x.lineWidth = 1;
    x.stroke();
    x.restore();

    return { cv: canvas, w: W + PAD * 2, h: H + PAD * 2, pad: PAD, content: { w: W, h: H } };
  }

  /* ---------------------------------------------------------
     006 车钥匙
     --------------------------------------------------------- */
  function key() {
    const W = 210, H = 84;
    const { canvas, ctx: x } = makeCanvas(W + PAD * 2, H + PAD * 2);
    x.translate(PAD, PAD);
    x.translate(8, 4);
    x.rotate(-0.04);

    // 金属钥匙：圆环头 + 杆 + 齿
    const metal = (x0, y0, x1, y1) => {
      const g = x.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, '#9aa3ab');
      g.addColorStop(0.28, '#e2e8ee');
      g.addColorStop(0.52, '#b6bfc7');
      g.addColorStop(0.78, '#7e878f');
      g.addColorStop(1, '#aab3bb');
      return g;
    };

    x.save();
    x.shadowColor = 'rgba(24,20,14,0.42)';
    x.shadowBlur = 9;
    x.shadowOffsetY = 5;
    // 杆
    x.fillStyle = metal(0, 30, 0, 48);
    roundRect(x, 44, 31, 116, 15, 3);
    x.fill();
    // 齿
    roundRect(x, 128, 44, 13, 16, 2); x.fill();
    roundRect(x, 148, 44, 10, 11, 2); x.fill();
    // 环头
    x.beginPath();
    x.arc(40, 38, 26, 0, 7);
    x.fillStyle = metal(14, 12, 66, 64);
    x.fill();
    x.restore();

    // 环头边缘
    x.beginPath(); x.arc(40, 38, 26, 0, 7);
    x.strokeStyle = 'rgba(70,78,86,0.75)';
    x.lineWidth = 2;
    x.stroke();

    // 打孔（真的透过去）
    x.save();
    x.globalCompositeOperation = 'destination-out';
    x.beginPath(); x.arc(40, 38, 9, 0, 7); x.fill();
    x.restore();
    x.beginPath(); x.arc(40, 38, 9, 0, 7);
    x.strokeStyle = 'rgba(60,68,76,0.85)';
    x.lineWidth = 1.6;
    x.stroke();

    // 杆上的高光与一道划痕
    x.beginPath(); x.moveTo(50, 35); x.lineTo(156, 35);
    x.strokeStyle = 'rgba(255,255,255,0.55)';
    x.lineWidth = 1.4;
    x.stroke();
    x.beginPath(); x.moveTo(96, 41); x.lineTo(140, 41);
    x.strokeStyle = 'rgba(90,98,106,0.45)';
    x.lineWidth = 0.9;
    x.stroke();

    // 环上挂着的小红签
    x.save();
    x.translate(28, 70);
    x.rotate(0.18);
    x.beginPath();
    roundRect(x, -9, -6, 18, 12, 2);
    x.fillStyle = 'rgba(150,34,24,0.8)';
    x.fill();
    x.restore();

    return { cv: canvas, w: W + PAD * 2, h: H + PAD * 2, pad: PAD, content: { w: W, h: H } };
  }

  /* ---------------------------------------------------------
     证物标签（牛皮纸吊牌）
     --------------------------------------------------------- */
  function tag(text, sub) {
    const fs = 15;
    const tmp = makeCanvas(10, 10).ctx;
    tmp.font = `400 ${fs}px "SF Mono", Menlo, monospace`;
    const w1 = tmp.measureText(text).width;
    const W = Math.ceil(w1 + 58);
    const H = sub ? 54 : 34;
    const { canvas, ctx: x } = makeCanvas(W + 16, H + 16);
    x.translate(8, 8);

    x.save();
    x.shadowColor = 'rgba(0,0,0,0.34)';
    x.shadowBlur = 12;
    x.shadowOffsetY = 5;
    x.fillStyle = C.kraft;
    x.beginPath();
    x.moveTo(0, 2); x.lineTo(W, 0); x.lineTo(W - 1, H); x.lineTo(2, H - 2);
    x.closePath();
    x.fill();
    x.restore();

    x.fillStyle = C.kraftDark;
    x.fillRect(0, 0, 6, H);

    x.fillStyle = '#332a1c';
    x.font = `400 ${fs}px "SF Mono", Menlo, monospace`;
    x.textBaseline = 'middle';
    x.fillText(text, 20, sub ? 20 : H / 2 + 1);
    if (sub) {
      x.fillStyle = 'rgba(51,42,28,0.62)';
      x.font = '400 10px "SF Mono", Menlo, monospace';
      x.fillText(sub, 20, 38);
    }

    return { cv: canvas, w: W + 16, h: H + 16 };
  }

  /* ---------------------------------------------------------
     印章（双圈，可换字）
     --------------------------------------------------------- */
  function stamp(main, sub) {
    const S = 210;
    const { canvas, ctx: x } = makeCanvas(S, S);
    x.translate(S / 2, S / 2);

    x.strokeStyle = C.red;
    x.fillStyle = C.red;
    x.lineWidth = 5;
    x.beginPath(); x.arc(0, 0, 92, 0, 7); x.stroke();
    x.lineWidth = 2;
    x.beginPath(); x.arc(0, 0, 80, 0, 7); x.stroke();

    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.font = '600 40px "Songti SC", "Hiragino Mincho ProN", serif';
    x.fillText(main, 0, -6);
    x.font = '400 11px "SF Mono", Menlo, monospace';
    x.fillText(sub, 0, 42);

    // 做旧：随机掉墨
    const r = rng(77);
    x.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 220; i++) {
      const a = r() * Math.PI * 2;
      const rad = 20 + r() * 74;
      x.beginPath();
      x.arc(Math.cos(a) * rad, Math.sin(a) * rad, r() * 2.6, 0, 7);
      x.fill();
    }
    x.globalCompositeOperation = 'source-over';

    return { cv: canvas, w: S, h: S };
  }

  MV.props = { coatBag, coatFree, tickets, petalBag, stone, tube, key, tag, stamp, drawBag, drawBagRaw: drawBag, PAD, C };
})(window.MV);
