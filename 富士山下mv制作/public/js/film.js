/* =========================================================
   正片：镜头 / 批注 / 字幕 / 合成
   ========================================================= */
(function (MV) {
  'use strict';
  const { rng, clamp, clamp01, lerp, E } = MV.util;
  const { F, COL, font, spaced, spacedW, typed, win, partial, handCircle, handLine, arrowHead, spline, evalSpline, noiseTile } = MV.fx;
  const SH = MV.sheet;
  const IT = MV.items;
  const S = SH.S;

  const W = 1920, H = 1080;

  /* ---------------- 镜头 ---------------- */
  const CAM = [
    [0.0, 1080, 620, 0.86, -0.004],
    [6.3, 1060, 600, 0.87, -0.003],
    [8.8, 640, 300, 1.22, -0.002],
    [9.9, 640, 300, 1.22, -0.002],
    [12.2, 1230, 330, 1.02, -0.003],
    [15.6, 1330, 350, 1.10, -0.002],
    [18.6, 1200, 470, 1.00, -0.003],
    [21.9, 900, 540, 1.05, -0.002],
    [26.4, 420, 560, 1.55, -0.004],
    [31.0, 640, 500, 1.35, -0.002],
    [35.6, 800, 450, 1.70, -0.003],
    [40.2, 1000, 470, 1.45, -0.002],
    [44.7, 1160, 455, 1.85, -0.003],
    [49.3, 1200, 520, 1.75, -0.002],
    [53.9, 1080, 620, 0.94, -0.003],
    [58.4, 1080, 620, 0.82, -0.004],
    [63.6, 1180, 600, 0.92, -0.002],
    [68.2, 1300, 640, 1.25, -0.003],
    [72.7, 1680, 360, 1.15, -0.002],
    [77.3, 1560, 430, 1.05, -0.003],
    [81.9, 1710, 470, 1.95, -0.002],
    [86.4, 1415, 490, 1.90, -0.003],
    [94.1, 1080, 620, 0.92, -0.002],
    [98.5, 1080, 620, 0.86, -0.003],
    [102.6, 810, 450, 1.85, -0.003],
    [105.7, 810, 450, 1.82, -0.003],
    [107.2, 420, 560, 1.60, -0.002],
    [111.8, 900, 560, 1.15, -0.003],
    [116.4, 900, 700, 1.35, -0.002],
    [121.0, 1560, 620, 1.25, -0.003],
    [125.5, 1080, 830, 1.02, -0.002],
    [130.1, 1160, 455, 1.70, -0.003],
    [134.7, 1080, 620, 0.90, -0.002],
    [139.2, 1080, 600, 0.98, -0.003],
    [144.4, 1220, 540, 1.10, -0.002],
    [148.9, 1360, 600, 1.30, -0.003],
    [153.5, 1080, 620, 1.22, -0.002],
    [158.1, 1120, 600, 1.00, -0.003],
    [162.7, 1710, 470, 1.95, -0.002],
    [167.2, 1415, 490, 1.85, -0.003],
    [174.2, 1250, 640, 1.45, -0.002],
    [179.0, 1080, 620, 1.00, -0.003],
    [183.3, 1080, 600, 1.05, -0.002],
    [188.7, 1080, 560, 1.18, -0.003],
    [193.4, 1080, 700, 1.00, -0.002],
    [198.2, 1080, 600, 1.30, -0.003],
    [202.9, 1080, 640, 1.12, -0.002],
    [207.6, 1710, 470, 1.90, -0.003],
    [212.2, 1415, 490, 1.80, -0.002],
    [221.3, 1080, 620, 0.94, -0.003],
    [226.6, 1080, 620, 0.86, -0.002],
    [232.0, 760, 600, 1.22, -0.003],
    [236.6, 1010, 620, 1.02, -0.002],
    [240.0, 1080, 620, 0.94, -0.002],
    [242.0, 1080, 620, 0.90, -0.002]
  ];

  let spCx, spCy, spZ, spRot;

  function buildCam() {
    const ts = CAM.map((r) => r[0]);
    spCx = spline(ts, CAM.map((r) => r[1]));
    spCy = spline(ts, CAM.map((r) => r[2]));
    spZ = spline(ts, CAM.map((r) => r[3]));
    spRot = spline(ts, CAM.map((r) => r[4]));
  }

  function shakeAt(t) {
    let v = 0;
    for (const s of IT.STAMPS) {
      const d = t - s.t;
      if (d > 0 && d < 0.6) v += Math.exp(-d * 11) * Math.sin(d * 62) * 6.5;
    }
    return v;
  }

  function cameraAt(t) {
    const cx0 = evalSpline(spCx, t) + Math.sin(t * 0.31) * 2.6 + Math.sin(t * 1.13) * 0.8;
    const cy0 = evalSpline(spCy, t) + Math.cos(t * 0.27) * 2.1;
    const z = evalSpline(spZ, t) * (1 + Math.sin(t * 0.19) * 0.0018);
    const rot = evalSpline(spRot, t) + Math.sin(t * 0.13) * 0.0012;
    // 推近之后不许拍到纸外：纸必须铺满画面
    let cx = cx0, cy = cy0;
    const hw = W / (2 * z), hh = H / (2 * z);
    if (S.w * z >= W) cx = clamp(cx0, hw, S.w - hw);
    if (S.h * z >= H) cy = clamp(cy0, hh, S.h - hh);
    return { cx, cy, z, rot };
  }

  /* ---------------- 抬头 ---------------- */
  function drawHeader(x, t) {
    const a = clamp01((t - 5.9) / 0.7);
    if (a <= 0) return;
    x.save();
    x.globalAlpha = a;

    const lines = [
      ['CASE NO. 001 — 富士山下', 6.0, 11],
      ['SUBJECT: 私有 / POSSESSION — DENIED', 6.9, 10],
      ['OPENED 2019.07.22 04:19 · INTAKE BY 我', 7.6, 10]
    ];
    font(x, 10.5, F.mono, 400);
    x.fillStyle = COL.ink3;
    lines.forEach((ln, i) => {
      const n = typed(ln[0], t, ln[1], 22);
      if (n > 0) spaced(x, ln[0].slice(0, n), 150, 132 + i * 22, 2.4);
    });

    // 右侧编号
    font(x, 9.5, F.mono, 400);
    x.fillStyle = 'rgba(125,117,102,0.9)';
    spaced(x, 'SHEET 1 / 1', S.w - 150, 132, 2.2, 'right');
    spaced(x, 'FLAT-LAY · TOP', S.w - 150, 154, 2.2, 'right');

    // 大标题
    const ta = clamp01((t - 8.2) / 0.9);
    if (ta > 0) {
      x.globalAlpha = a * ta;
      font(x, 62, F.serif, 400);
      x.fillStyle = COL.ink;
      spaced(x, '解 咒', 150, 268, 16);
      font(x, 10, F.mono, 400);
      x.fillStyle = COL.ink3;
      spaced(x, 'EXHIBITS 001—006', 372, 262, 2.6);
      font(x, 9, F.mono, 400);
      spaced(x, 'PRIVATE OWNERSHIP DENIED', 372, 282, 2.4);
      // 红线
      x.fillStyle = 'rgba(165,48,31,0.75)';
      x.fillRect(150, 286, 200 * ta, 2);
    }
    x.restore();

    // 登记卡
    const cin = t < 19.4 ? E.outBack(clamp01((t - 9.3) / 0.9)) : 1;
    const cout = clamp01((t - 19.4) / 0.8);
    if (t > 9.25 && cout < 1) {
      const cy = 352 - 320 * (1 - cin) - 340 * E.in(cout);
      SH.drawCard(x, 1660, cy, 0.008, clamp01((t - 9.3) / 0.5) * (1 - cout), t);
    }
  }

  /* ---------------- 批注 ---------------- */
  function note(x, s, px, py, rot, size, color, alpha, align) {
    x.save();
    x.translate(px, py);
    x.rotate(rot || 0);
    x.globalAlpha = alpha === undefined ? 1 : alpha;
    font(x, size || 17, F.serif, 400);
    x.fillStyle = color || COL.navy;
    spaced(x, s, 0, 0, 1.6, align || 'left');
    x.restore();
  }

  function monoNote(x, s, px, py, rot, size, color, alpha, align) {
    x.save();
    x.translate(px, py);
    x.rotate(rot || 0);
    x.globalAlpha = alpha === undefined ? 1 : alpha;
    font(x, size || 9, F.mono, 400);
    x.fillStyle = color || COL.ink3;
    spaced(x, s, 0, 0, 2, align || 'left');
    x.restore();
  }

  function drawNotes(x, t) {
    /* 风褛：袖口 */
    if (t > 27.2 && t < 35.6) {
      const a = win(t, 27.2, 35.6, 0.5, 0.6);
      const p = clamp01((t - 27.4) / 0.8);
      x.save();
      x.globalAlpha = a * 0.9;
      partial(x, handCircle(336, 607, 47, 40, 31), p, COL.red, 2.1, 0.85);
      partial(x, handCircle(336, 607, 51, 44, 32), p * 0.9, COL.red, 1.2, 0.45);
      const ar = handLine(600, 648, 392, 620, 33, 10);
      partial(x, ar, clamp01((t - 27.9) / 0.5), COL.red, 1.8, 0.75);
      arrowHead(x, ar[ar.length - 3], ar[ar.length - 1], 8, COL.red, clamp01((t - 27.9) / 0.5));
      x.restore();
      note(x, '磨到有襟花', 610, 664, -0.015, 22, COL.navy, a * clamp01((t - 28) / 0.5));
      monoNote(x, 'CUFF · 5 YEARS', 611, 684, -0.015, 9, COL.ink3, a * clamp01((t - 28) / 0.5));
    }

    /* 车票：同一班 */
    if (t > 36.9 && t < 40.6) {
      const a = win(t, 36.9, 40.6, 0.5, 0.6);
      const p = clamp01((t - 37.1) / 0.7);
      x.save();
      x.globalAlpha = a * 0.85;
      partial(x, handCircle(900, 485, 27, 24, 41), p, COL.red, 1.9, 0.8);
      const ar = handLine(975, 392, 912, 462, 42, 8);
      partial(x, ar, clamp01((t - 37.7) / 0.5), COL.red, 1.6, 0.7);
      arrowHead(x, ar[ar.length - 3], ar[ar.length - 1], 7, COL.red, clamp01((t - 37.7) / 0.5));
      x.restore();
      note(x, '同一班车 09:42', 986, 384, 0.02, 19, COL.navy, a);
    }

    /* 花瓣：坟场 */
    if (t > 44.9 && t < 49.4) {
      const a = win(t, 44.9, 49.4, 0.6, 0.6);
      note(x, '花瓣铺满 · 心里坟场', 1002, 344, -0.012, 21, COL.navy, a);
      monoNote(x, 'GRAVEYARD 6 × 6 FT', 1004, 362, -0.012, 8.5, COL.ink3, a);
      x.save();
      x.globalAlpha = a * 0.5;
      x.strokeStyle = COL.red;
      x.lineWidth = 1.4;
      x.beginPath();
      x.moveTo(1070, 374); x.lineTo(1070, 398); x.lineTo(1254, 398); x.lineTo(1254, 374);
      x.stroke();
      x.restore();
    }

    /* 火化：烧穿纸面 */
    if (t > 49.4 && t < 98.2) {
      const a = win(t, 49.4, 98.2, 1.2, 2.5);
      const p = clamp01((t - 49.6) / 3.0);
      const bx = 1106, by = 508;
      const rad = 4 + 21 * p;
      const r = rng(4477);

      x.save();
      x.globalAlpha = a;

      // 焦痕：整片纸被烤黄
      const sg = x.createRadialGradient(bx, by, rad * 0.6, bx, by, rad * 4.4);
      sg.addColorStop(0, 'rgba(64,36,16,0.55)');
      sg.addColorStop(0.32, 'rgba(120,72,30,0.26)');
      sg.addColorStop(0.62, 'rgba(166,122,64,0.13)');
      sg.addColorStop(1, 'rgba(150,116,60,0)');
      x.fillStyle = sg;
      x.beginPath(); x.arc(bx, by, rad * 4.4, 0, 7); x.fill();

      // 不规则洞口
      const N = 22;
      const ring = [];
      for (let i = 0; i < N; i++) {
        const ang = (i / N) * Math.PI * 2;
        const k = 0.86 + r() * 0.34;
        ring.push([bx + Math.cos(ang) * rad * k, by + Math.sin(ang) * rad * k * 0.86]);
      }
      const holePath = () => {
        x.beginPath();
        x.moveTo((ring[0][0] + ring[N - 1][0]) / 2, (ring[0][1] + ring[N - 1][1]) / 2);
        for (let i = 0; i < N; i++) {
          const q = ring[(i + 1) % N];
          x.quadraticCurveTo(ring[i][0], ring[i][1], (ring[i][0] + q[0]) / 2, (ring[i][1] + q[1]) / 2);
        }
        x.closePath();
      };

      // 洞口里：不是纯黑，是桌面透上来的一点冷光
      holePath();
      const hg = x.createRadialGradient(bx - rad * 0.2, by - rad * 0.3, 1, bx, by, rad * 1.5);
      hg.addColorStop(0, 'rgba(10,11,12,0.99)');
      hg.addColorStop(0.62, 'rgba(14,15,16,0.98)');
      hg.addColorStop(1, 'rgba(26,24,21,0.96)');
      x.fillStyle = hg;
      x.fill();

      // 洞口内沿还在发红
      holePath();
      x.strokeStyle = `rgba(196,92,32,${0.55 + 0.2 * Math.sin(t * 6)})`;
      x.lineWidth = Math.max(1, rad * 0.12);
      x.stroke();

      // 纸的厚度：右下侧露出一线米白
      x.save();
      holePath();
      x.clip();
      x.beginPath();
      x.arc(bx - 1.6, by - 1.8, rad * 1.2, 0, 7);
      x.strokeStyle = 'rgba(238,230,210,0.55)';
      x.lineWidth = 3.4;
      x.stroke();
      x.beginPath();
      x.arc(bx - 2.2, by - 2.4, rad * 1.05, 0, 7);
      x.strokeStyle = 'rgba(120,64,28,0.85)';
      x.lineWidth = 2.2;
      x.stroke();
      x.restore();

      // 洞口一圈焦黑，边缘毛糙
      holePath();
      x.strokeStyle = 'rgba(32,20,12,0.75)';
      x.lineWidth = 1.6;
      x.stroke();
      for (let i = 0; i < 26; i++) {
        const ang = r() * Math.PI * 2;
        const rr = rad * (0.92 + r() * 0.5);
        const px = bx + Math.cos(ang) * rr;
        const py = by + Math.sin(ang) * rr * 0.9;
        x.beginPath();
        x.moveTo(px, py);
        x.lineTo(px + (r() - 0.5) * 7, py + (r() - 0.5) * 6);
        x.strokeStyle = r() > 0.5 ? 'rgba(48,28,14,0.5)' : 'rgba(140,86,36,0.35)';
        x.lineWidth = 1 + r() * 1.2;
        x.stroke();
      }
      x.restore();

      // 火苗：只在最开始的十几秒
      const fa = win(t, 49.7, 78.0, 0.5, 2.4) * clamp01(1 - p * 0.35);
      if (fa > 0.02) {
        x.save();
        x.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 3; k++) {
          const ph = t * (5.2 + k * 1.3) + k * 2.1;
          const hgt = (18 + 10 * Math.sin(ph)) * (1 - k * 0.22) * (0.7 + 0.5 * p);
          const wdt = (7 - k * 1.6) * (0.9 + 0.2 * Math.sin(ph * 1.7));
          const fxx = bx + (k - 1) * 5 + Math.sin(ph * 0.8) * 3;
          const fyy = by - rad * 0.35;
          const fg2 = x.createLinearGradient(fxx, fyy, fxx, fyy - hgt);
          fg2.addColorStop(0, `rgba(255,196,96,${0.55 * fa})`);
          fg2.addColorStop(0.45, `rgba(240,130,44,${0.42 * fa})`);
          fg2.addColorStop(1, `rgba(180,60,16,0)`);
          x.fillStyle = fg2;
          x.beginPath();
          x.moveTo(fxx - wdt, fyy);
          x.bezierCurveTo(fxx - wdt * 1.1, fyy - hgt * 0.5, fxx - wdt * 0.3, fyy - hgt * 0.8, fxx, fyy - hgt);
          x.bezierCurveTo(fxx + wdt * 0.4, fyy - hgt * 0.75, fxx + wdt * 1.1, fyy - hgt * 0.45, fxx + wdt, fyy);
          x.quadraticCurveTo(fxx, fyy + wdt * 0.5, fxx - wdt, fyy);
          x.fill();
        }
        x.restore();
      }

      // 烟
      x.save();
      x.globalAlpha = a * 0.14;
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.2 + i * 0.33) % 1;
        const sy = by - 14 - ph * 130;
        const sx = bx + 10 + Math.sin(ph * 6 + i) * 20 + ph * 26;
        const sg2 = x.createRadialGradient(sx, sy, 2, sx, sy, 24 + ph * 38);
        sg2.addColorStop(0, 'rgba(86,80,68,0.5)');
        sg2.addColorStop(1, 'rgba(86,80,68,0)');
        x.fillStyle = sg2;
        x.beginPath(); x.arc(sx, sy, 24 + ph * 38, 0, 7); x.fill();
      }
      x.restore();

      note(x, '火化', 1016, 574, -0.06, 30, COL.red, a * 0.8);
    }

    /* 六件待归档 */
    if (t > 54.0 && t < 58.6) {
      const a = win(t, 54.0, 58.6, 0.8, 0.5);
      note(x, '六件 · 待归档', 700, 1012, -0.01, 24, COL.navy, a * 0.9);
      monoNote(x, 'SIX EXHIBITS / AWAITING FILING', 702, 1032, -0.01, 9, COL.ink3, a * 0.9);
      x.save();
      x.globalAlpha = a * 0.7;
      x.fillStyle = COL.red;
      x.fillRect(700, 1018, 208, 1.6);
      x.restore();
    }

    /* 红线：关联 */
    if (t > 60.2 && t < 63.6) {
      const a = win(t, 60.2, 63.6, 0.6, 0.6);
      monoNote(x, 'RED THREAD / 关联', 878, 690, -0.03, 10, COL.ink2, a);
    }

    /* 私有：申请 */
    if (t > 72.9 && t < 79.4) {
      const a = win(t, 72.9, 79.4, 0.5, 0.9);
      const n = typed('APPLICATION: PRIVATE OWNERSHIP', t, 73.0, 34);
      if (n > 0) {
        x.save();
        x.globalAlpha = a;
        font(x, 10, F.mono, 400);
        x.fillStyle = COL.ink2;
        spaced(x, 'APPLICATION: PRIVATE OWNERSHIP'.slice(0, n), 1462, 148, 2);
        x.restore();
      }
      const na = clamp01((t - 73.6) / 0.5);
      if (na > 0) {
        note(x, '驳 回', 1462, 186, -0.015, 27, COL.red, a * na);
        monoNote(x, 'DENIED', 1544, 184, -0.015, 11, COL.red, a * na);
      }
    }

    /* 试管 */
    if (t > 82.0 && t < 86.4) {
      const a = win(t, 82.0, 86.4, 0.5, 0.6);
      const p = clamp01((t - 82.2) / 0.7);
      x.save();
      x.globalAlpha = a * 0.85;
      partial(x, handCircle(1710, 592, 40, 34, 51), p, COL.red, 1.9, 0.8);
      x.restore();
      note(x, '找不到', 1648, 596, -0.02, 20, COL.navy, a, 'right');
      monoNote(x, 'NO TRACE IN SAMPLE', 1648, 614, -0.02, 8.5, COL.ink3, a, 'right');
    }

    /* 石头：日期 */
    if (t > 87.0 && t < 98.2) {
      const a = win(t, 87.0, 98.2, 0.8, 2.0);
      note(x, '前尘硬化', 1312, 366, -0.012, 21, COL.navy, a * 0.95);
      monoNote(x, '2014.02.14 / HARDENED', 1314, 384, -0.012, 8.5, COL.ink3, a * 0.95);
    }

    /* 罕有：箭头出纸 */
    if (t > 94.4 && t < 98.4) {
      const a = win(t, 94.4, 98.4, 0.6, 0.8);
      const ar = handLine(1560, 742, 1960, 700, 61, 12);
      partial(x, ar, clamp01((t - 94.6) / 0.9), COL.red, 2, a * 0.8);
      arrowHead(x, ar[ar.length - 3], ar[ar.length - 1], 10, COL.red, clamp01((t - 94.6) / 0.9));
      note(x, '我绝不罕有 → 0', 1582, 780, -0.015, 20, COL.navy, a);
    }

    /* 情人节：圈住票上的日期，旁边一个手画的心 */
    if (t > 103.0 && t < 108.2) {
      const a = win(t, 103.0, 108.2, 0.6, 0.8);
      const p = clamp01((t - 103.2) / 0.7);
      if (p > 0) {
        x.save();
        x.globalAlpha = a * 0.85;
        partial(x, handCircle(736, 464, 58, 19, 41, 1.05), p, COL.red, 2.2, 0.8);
        partial(x, handCircle(736, 464, 61, 22, 42, 0.96), p * 0.9, COL.red, 1.2, 0.4);
        x.restore();
      }
      const hp = clamp01((t - 103.7) / 0.5);
      if (hp > 0) {
        x.save();
        x.translate(812, 468);
        x.scale(0.42, 0.42);
        x.globalAlpha = a * 0.85 * hp;
        x.strokeStyle = COL.red;
        x.lineWidth = 8;
        x.beginPath();
        x.moveTo(0, 44);
        x.bezierCurveTo(-58, 6, -46, -52, -8, -52);
        x.bezierCurveTo(-2, -52, 0, -44, 0, -40);
        x.bezierCurveTo(0, -44, 2, -52, 8, -52);
        x.bezierCurveTo(46, -52, 58, 6, 0, 44);
        x.stroke();
        x.restore();
      }
      note(x, '情人节', 860, 320, 0.015, 21, COL.navy, a);
      monoNote(x, '14 FEB — SAID NOTHING', 861, 338, 0.015, 8.5, COL.ink3, a);
    }

    /* 同一件风褛 */
    if (t > 107.8 && t < 111.8) {
      const a = win(t, 107.8, 111.8, 0.6, 0.6);
      note(x, '同一件 · 第五年', 606, 738, -0.02, 21, COL.navy, a);
      monoNote(x, 'SAME COAT / 5TH YEAR', 607, 756, -0.02, 8.5, COL.ink3, a);
    }

    /* 划损：纸上的一道刀口 */
    if (t > 116.6) {
      const p = clamp01((t - 116.6) / 0.9);
      const a = t < 119.8 ? 1 : clamp01(1 - (t - 119.8) / 2.4);
      if (a > 0.01 && p > 0) {
        const A = [596, 690], B = [1288, 792];
        const pts = handLine(A[0], A[1], B[0], B[1], 77, 4);
        // 刀口：一条亮的切口 + 一条挤出来的红
        partial(x, pts.map(q => [q[0] + 3, q[1] + 6]), p, 'rgba(62,50,34,0.28)', 10, a * 0.5);
        partial(x, pts.map(q => [q[0] + 1, q[1] + 2]), p, 'rgba(255,255,255,0.98)', 3.4, a * 0.95);
        partial(x, pts, p, 'rgba(70,58,42,0.75)', 1.1, a * 0.7);
        partial(x, pts.map(q => [q[0], q[1] + 6]), p, 'rgba(145,32,24,0.55)', 2.6, a * 0.6);
        // 血珠：两滴，挂在刀口下缘
        const dp = clamp01((t - 117.5) / 0.5);
        if (dp > 0) {
          x.save();
          x.globalAlpha = a * dp;
          [[1092, 745, 3.4, 1.5], [1170, 773, 2.2, 1.2]].forEach((d) => {
            x.beginPath();
            x.ellipse(d[0], d[1], d[2] * 0.8, d[2] * d[3], 0.1, 0, 7);
            x.fillStyle = 'rgba(132,26,18,0.78)';
            x.fill();
          });
          x.restore();
        }
        note(x, '划损', 1312, 822, -0.02, 22, COL.red, a * clamp01((t - 117.2) / 0.5) * 0.9);
        monoNote(x, 'LACERATION · 5 CM', 1314, 842, -0.02, 8.5, COL.ink3, a * clamp01((t - 117.2) / 0.5));
      }
    }

    /* 身高的量尺 */
    if (t > 121.2 && t < 126.2) {
      const a = win(t, 121.2, 126.2, 0.7, 0.7);
      if (a > 0) {
        const p = clamp01((t - 121.4) / 1.0);
        x.save();
        x.globalAlpha = a * 0.6;
        x.strokeStyle = 'rgba(72,64,50,0.75)';
        x.lineWidth = 1.2;
        x.beginPath(); x.moveTo(1868, 900); x.lineTo(1868, 900 - 520 * p); x.stroke();
        for (let i = 0; i <= 26 * p; i++) {
          const y = 900 - i * 20;
          const w = i % 5 === 0 ? 16 : 8;
          x.beginPath(); x.moveTo(1868, y); x.lineTo(1868 - w, y); x.stroke();
        }
        x.restore();
        if (p > 0.98) {
          note(x, '1.72 M', 1892, 640, 0.02, 19, COL.navy, a);
          monoNote(x, 'NOBODY STOOD HERE', 1893, 660, 0.02, 8, COL.ink3, a);
        }
      }
    }

    /* 回程路线 */
    if (t > 125.6 && t < 135.2) {
      const a = win(t, 125.6, 135.2, 0.8, 1.2);
      const stations = [
        [330, 946, '新宿'],
        [760, 906, '八王子'],
        [1180, 946, '大月'],
        [1580, 900, '河口湖']
      ];
      const p = clamp01((t - 125.9) / 2.2);
      x.save();
      x.globalAlpha = a * 0.55;
      x.strokeStyle = COL.red;
      x.lineWidth = 1.6;
      x.setLineDash([6, 8]);
      x.lineDashOffset = -t * 26;
      x.beginPath();
      x.moveTo(stations[0][0], stations[0][1]);
      for (let i = 1; i < stations.length; i++) {
        const prev = stations[i - 1], cur = stations[i];
        x.quadraticCurveTo((prev[0] + cur[0]) / 2, (prev[1] + cur[1]) / 2 - 22, cur[0], cur[1]);
      }
      x.stroke();
      x.setLineDash([]);
      x.restore();
      stations.forEach((s, i) => {
        const sa = clamp01((t - (125.9 + i * 0.45)) / 0.4) * a;
        x.save();
        x.globalAlpha = sa * 0.9;
        x.fillStyle = COL.red;
        x.beginPath(); x.arc(s[0], s[1], 3.4, 0, 7); x.fill();
        x.restore();
        monoNote(x, s[2], s[0] + 10, s[1] + 4, 0, 10, COL.ink2, sa * 0.95);
      });
      monoNote(x, '104 KM · 1 WAY', 330, 974, 0, 9, COL.ink3, a * 0.9);
    }

    /* 樱花 */
    if (t > 130.4 && t < 135.2) {
      const a = win(t, 130.4, 135.2, 1.2, 0.8);
      note(x, '樱花开了几转', 1252, 690, -0.015, 21, COL.navy, a * 0.9);
    }

    /* 东京 */
    if (t > 134.9 && t < 139.4) {
      const a = win(t, 134.9, 139.4, 0.7, 0.6);
      monoNote(x, 'TOKYO ↔ 104 KM', 700, 372, -0.01, 11, COL.red, a * 0.9);
      note(x, '一早 比一世遥远', 700, 408, -0.01, 23, COL.navy, a * 0.9);
    }

    /* 第二次归档 */
    if (t > 139.6 && t < 145.0) {
      const a = win(t, 139.6, 145.0, 0.8, 0.8);
      monoNote(x, 'RE-FILE 02 / 重新归档', 1520, 1010, -0.01, 10, COL.ink2, a * 0.85);
    }

    /* 划掉：一道长线划过整排，再逐个否掉标签 */
    if (t > 188.9) {
      const p0 = clamp01((t - 188.9) / 1.7);
      const a = t < 194 ? 1 : clamp01(1 - (t - 194) / 2);
      if (a > 0.01 && p0 > 0) {
        const pts = handLine(168, 436, 2012, 816, 909, 16);
        partial(x, pts.map(q => [q[0] + 3, q[1] + 5]), p0, 'rgba(80,20,12,0.22)', 11, a * 0.55);
        partial(x, pts, p0, COL.red, 6.5, a * 0.42);
      }
      IT.ORDER.forEach((k, i) => {
        const s = IT.SLOTS[k];
        const g = IT.TAG[k];
        const t0 = 190.0 + i * 0.22;
        const p = clamp01((t - t0) / 0.26);
        if (p <= 0) return;
        const a = t < 194 ? 1 : clamp01(1 - (t - 194) / 2);
        const cx = s.cx + g.dx * s.s, cy = s.cy + g.dy * s.s;
        const R = 34;
        x.save();
        x.translate(cx, cy);
        x.rotate(g.rot - 0.06);
        partial(x, handLine(-R, -R * 0.8, R, R * 0.8, 90 + i, 5), p, 'rgba(150,34,22,0.9)', 3.4, a * 0.72);
        partial(x, handLine(R, -R * 0.8, -R, R * 0.8, 100 + i, 5), p, 'rgba(150,34,22,0.9)', 3.4, a * 0.72);
        x.restore();
      });
    }

    /* 最终驳回 */
    if (t > 198.6 && t < 205.2) {
      const a = win(t, 198.6, 205.2, 0.6, 1.0);
      monoNote(x, 'FINAL / 第三次申请', 1310, 664, -0.01, 10, COL.ink2, a * 0.9);
      note(x, '不予受理', 1310, 696, -0.01, 20, COL.red, a * 0.85);
    }

    /* 结案 */
    if (t > 237.0) {
      const a = clamp01((t - 237.0) / 1.2) * clamp01((241.2 - t) / 1.2);
      monoNote(x, 'RELEASED / 归 还', 1436, 618, 0.01, 10, COL.ink2, a, 'center');
    }
  }

  /* ---------------- 雪 / 灰 ---------------- */
  function drawSnow(x, t) {
    if ((t > 21.9 && t < 31.6) || (t > 193.0 && t < 198.6)) {
      const ash = t > 193;
      const a = ash ? win(t, 193.0, 198.6, 1.0, 0.8) : win(t, 21.9, 31.6, 1.2, 1.0);
      const n = 60;
      for (let i = 0; i < n; i++) {
        const r = rng(6000 + i);
        const sp = 22 + r() * 46;
        const base = r();
        const y = 330 + ((base * 900 + (t - (ash ? 193 : 21.9)) * sp) % 880);
        const x0 = 120 + r() * 1920 + Math.sin(t * 0.7 + i) * 14;
        const sz = 1.2 + r() * 2.4;
        x.save();
        x.globalAlpha = a * (0.25 + r() * 0.5);
        x.fillStyle = ash ? 'rgba(46,40,32,0.8)' : 'rgba(255,255,255,0.95)';
        x.beginPath(); x.arc(x0, y, sz, 0, 7); x.fill();
        x.restore();
      }
    }
  }

  /* ---------------- 屏幕叠加 ---------------- */
  let grainCv = null, vigCv = null;

  function buildOverlays() {
    grainCv = noiseTile(256, 0.07);
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(W * 0.5, H * 0.46, H * 0.36, W * 0.5, H * 0.5, W * 0.72);
    g.addColorStop(0, 'rgba(8,10,10,0)');
    g.addColorStop(0.7, 'rgba(8,10,10,0.22)');
    g.addColorStop(1, 'rgba(6,8,8,0.62)');
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    vigCv = c;
  }

  function drawCredits(x, t) {
    const a = win(t, 0.7, 6.5, 0.9, 0.6);
    if (a <= 0) return;
    x.save();
    x.globalAlpha = a;
    x.translate(0, (1 - clamp01((t - 0.6) / 1.2)) * 14);

    monoNote(x, 'EVIDENCE SHEET · CASE 001', 300, 356, 0, 10, 'rgba(95,88,75,0.95)', 1);

    // 底纹编号
    x.save();
    x.globalAlpha = a * 0.055;
    font(x, 300, F.mono, 700);
    x.fillStyle = COL.ink;
    spaced(x, '001', 1180, 720, 8);
    x.restore();

    font(x, 128, F.serif, 400);
    x.fillStyle = COL.ink;
    spaced(x, '富士山下', 296, 500, 12);

    x.fillStyle = 'rgba(165,48,31,0.8)';
    x.fillRect(300, 536, 74, 3);

    font(x, 30, F.serif, 400);
    x.fillStyle = COL.ink;
    spaced(x, '陈奕迅', 300, 588, 4);

    font(x, 10, F.mono, 400);
    x.fillStyle = 'rgba(95,88,75,0.95)';
    spaced(x, '词 林夕　曲 CHRISTOPHER CHAK', 300, 622, 1.8);

    font(x, 19, F.serif, 400);
    x.fillStyle = 'rgba(61,74,107,0.95)';
    spaced(x, '谁能凭爱意要富士山私有', 300, 676, 3);

    // 私有章
    x.save();
    x.translate(806, 556);
    x.rotate(-0.19);
    x.globalAlpha = a * 0.62;
    x.scale(0.42, 0.42);
    x.drawImage(MV.items._stampImg().cv, -105, -105, 210, 210);
    x.restore();

    x.restore();
  }

  function drawLyrics(x, t, spec) {
    const L = spec.lyrics;
    if (!L || !L.length) return;
    let idx = -1;
    for (let i = 0; i < L.length; i++) if (t >= L[i].t - 0.45) idx = i;
    if (idx < 0) return;
    const cur = L[idx];
    const isLast = idx === L.length - 1;
    const fadeOut = isLast ? clamp01((241.4 - t) / 1.6) : clamp01(((cur.next || 999) - t) / 0.32);
    const a = clamp01((t - (cur.t - 0.45)) / 0.32) * fadeOut;
    if (a <= 0.01) return;

    const n = typed(cur.text, t, cur.t - 0.35, 23);
    const text = cur.text;
    const size = 33;

    font(x, size, F.serif, 400);
    const fullW = spacedW(x, text, 2);
    const w = Math.min(1300, Math.max(720, fullW + 118));

    x.save();
    x.translate(84, 924);
    x.rotate(-0.0035);
    x.globalAlpha = a;

    // 纸条
    x.save();
    x.shadowColor = 'rgba(10,8,6,0.55)';
    x.shadowBlur = 26;
    x.shadowOffsetY = 10;
    x.fillStyle = 'rgba(240,234,221,0.955)';
    x.fillRect(0, 0, w, 104);
    x.restore();
    x.fillStyle = 'rgba(165,48,31,0.85)';
    x.fillRect(0, 0, 4, 104);
    x.fillStyle = 'rgba(120,110,90,0.35)';
    x.fillRect(4, 24, w - 4, 1);

    // 标签
    font(x, 8.5, F.mono, 400);
    x.fillStyle = 'rgba(110,102,86,0.95)';
    spaced(x, 'TRANSCRIPT · SIDE A', 22, 17, 2.2);
    spaced(x, String(idx + 1).padStart(2, '0') + ' / 44', w - 22, 17, 2.2, 'right');

    // 正文字（关键字标红）
    font(x, size, F.serif, 400);
    x.textBaseline = 'alphabetic';
    let px = 26;
    const kw = cur.keyword || '';
    const ki = kw ? text.indexOf(kw) : -1;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (i < n) {
        x.fillStyle = ki >= 0 && i >= ki && i < ki + kw.length ? COL.red : 'rgba(38,32,24,0.96)';
        x.fillText(ch, px, 74);
      }
      px += x.measureText(ch).width + 2;
    }

    // 光标
    if (n < text.length) {
      const frame = Math.round(t * 30);
      if (Math.floor(frame / 15) % 2 === 0) {
        x.fillStyle = 'rgba(165,48,31,0.85)';
        x.fillRect(px + 2, 46, 2, 32);
      }
    }

    x.restore();
  }

  function drawWarm(x, t) {
    const a = win(t, 111.6, 116.8, 1.4, 1.2);
    if (a <= 0.01) return;
    x.save();
    x.globalCompositeOperation = 'soft-light';
    x.globalAlpha = a * 0.85;
    const g = x.createRadialGradient(760, 420, 60, 900, 620, 900);
    g.addColorStop(0, 'rgba(255,186,104,0.85)');
    g.addColorStop(0.55, 'rgba(255,150,70,0.35)');
    g.addColorStop(1, 'rgba(120,60,20,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    x.restore();
  }

  function drawSakura(x, t) {
    const a = win(t, 130.2, 135.4, 1.4, 1.0);
    if (a <= 0.01) return;
    x.save();
    x.globalAlpha = a;
    for (let i = 0; i < 34; i++) {
      const r = rng(7100 + i);
      const sp = 30 + r() * 56;
      const yy = ((r() * 1400 + (t - 130.2) * sp) % 1280) - 100;
      const xx = (r() * 1.2 - 0.1) * W + Math.sin(t * 0.6 + i * 1.7) * 60;
      const rot = t * (0.55 + r() * 0.9) + i;
      const sz = 5 + r() * 8;
      const op = (0.28 + r() * 0.4) * (0.6 + 0.4 * Math.sin(t * 1.4 + i));
      x.save();
      x.translate(xx, yy);
      x.rotate(rot);
      x.globalAlpha = a * Math.max(0.12, op);
      const pg = x.createLinearGradient(0, sz, 0, -sz);
      pg.addColorStop(0, 'rgba(214,136,148,0.95)');
      pg.addColorStop(0.55, 'rgba(224,158,166,0.92)');
      pg.addColorStop(1, 'rgba(240,196,198,0.9)');
      x.fillStyle = pg;
      x.beginPath();
      x.moveTo(0, sz);
      x.bezierCurveTo(sz * 0.86, sz * 0.42, sz * 0.98, -sz * 0.32, sz * 0.34, -sz * 0.92);
      x.quadraticCurveTo(sz * 0.12, -sz * 0.62, 0, -sz * 0.7);
      x.quadraticCurveTo(-sz * 0.12, -sz * 0.62, -sz * 0.34, -sz * 0.92);
      x.bezierCurveTo(-sz * 0.98, -sz * 0.32, -sz * 0.86, sz * 0.42, 0, sz);
      x.fill();
      x.restore();
    }
    x.restore();
  }

  function drawFlash(x, t) {
    [98.55, 179.06, 226.9].forEach((t0, i) => {
      const d = t - t0;
      if (d >= 0 && d < 0.5) {
        const a = (1 - d / 0.5) * (i === 2 ? 0.35 : 0.9);
        x.save();
        x.globalAlpha = a;
        x.fillStyle = '#fdfaf2';
        x.fillRect(0, 0, W, H);
        x.restore();
      }
    });
  }

  function drawGrain(x, t) {
    const frame = Math.round(t * 30);
    x.save();
    x.globalAlpha = 0.35;
    const ox = (frame * 37) % 256, oy = (frame * 61) % 256;
    x.translate(-ox, -oy);
    const p = x.createPattern(grainCv, 'repeat');
    x.fillStyle = p;
    x.fillRect(0, 0, W + 256, H + 256);
    x.restore();
    x.globalAlpha = 1;
    x.drawImage(vigCv, 0, 0, W, H);
  }

  function drawFade(x, t) {
    let a = 0;
    if (t < 1.6) a = 1 - clamp01(t / 1.6);
    if (t > 239.6) a = Math.max(a, clamp01((t - 239.6) / 2.2));
    if (a > 0.001) {
      x.save();
      x.globalAlpha = a;
      x.fillStyle = '#080909';
      x.fillRect(0, 0, W, H);
      x.restore();
    }
  }

  /* ---------------- 总装 ---------------- */
  let ready = false;

  function init(spec) {
    SH.buildSheet();
    SH.buildTable();
    IT.init();
    IT.setStamps(MV.props.stamp('私有', 'DENIED · MT. FUJI'), MV.props.stamp('解咒', 'CASE CLOSED'));
    buildCam();
    buildOverlays();
    ready = true;
  }

  function draw(t, x) {
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalAlpha = 1;
    x.globalCompositeOperation = 'source-over';
    x.imageSmoothingEnabled = true;

    SH.drawTable(x, W, H);

    const cam = cameraAt(t);
    const sk = shakeAt(t);

    x.save();
    x.translate(W / 2 + sk, H / 2 + sk * 0.55);
    x.rotate(cam.rot);
    x.scale(cam.z, cam.z);
    x.translate(-cam.cx, -cam.cy);

    SH.drawSheet(x);
    drawHeader(x, t);
    IT.drawSlots(x, t);
    IT.drawItems(x, t);
    IT.drawTags(x, t);
    IT.drawThread(x, t);
    drawNotes(x, t);
    IT.drawStamps(x, t);
    drawSnow(x, t);
    IT.drawEnding(x, t);
    x.restore();

    drawWarm(x, t);
    drawSakura(x, t);
    drawFlash(x, t);
    drawGrain(x, t);
    drawCredits(x, t);
    drawLyrics(x, t, MV.spec);
    drawFade(x, t);
  }

  MV.film = { init, draw, CAM };
})(window.MV);
