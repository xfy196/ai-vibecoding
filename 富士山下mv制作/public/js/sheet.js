/* =========================================================
   档案纸：底纹 / 打孔 / 印刷线 / 页脚 / 登记卡
   ========================================================= */
(function (MV) {
  'use strict';
  const { rng, clamp01, E } = MV.util;
  const { F, COL, font, spaced, typed } = MV.fx;

  const S = { w: 2160, h: 1240 };
  const PAD = 90;
  const DPR = 1.5;
  let sheetCv = null;

  /* ---------------- 纸 ---------------- */
  function buildSheet() {
    const cw = S.w + PAD * 2, ch = S.h + PAD * 2;
    const c = document.createElement('canvas');
    c.width = Math.round(cw * DPR);
    c.height = Math.round(ch * DPR);
    const x = c.getContext('2d');
    x.scale(DPR, DPR);
    x.translate(PAD, PAD);

    // 桌面投影
    x.save();
    x.shadowColor = 'rgba(0,0,0,0.62)';
    x.shadowBlur = 54;
    x.shadowOffsetY = 26;
    x.fillStyle = COL.paper;
    x.fillRect(0, 0, S.w, S.h);
    x.restore();

    // 纸基色 + 光
    const g = x.createLinearGradient(0, 0, S.w * 0.85, S.h);
    g.addColorStop(0, '#f0ebdf');
    g.addColorStop(0.45, '#eae5d9');
    g.addColorStop(1, '#e3ddce');
    x.fillStyle = g;
    x.fillRect(0, 0, S.w, S.h);

    // 点阵（网格纸）
    const tile = document.createElement('canvas');
    tile.width = tile.height = 12;
    const tx = tile.getContext('2d');
    tx.fillStyle = 'rgba(146,136,114,0.26)';
    tx.beginPath(); tx.arc(1.2, 1.2, 0.85, 0, 7); tx.fill();
    tx.beginPath(); tx.arc(7.2, 7.2, 0.85, 0, 7); tx.fill();
    x.fillStyle = x.createPattern(tile, 'repeat');
    x.fillRect(0, 0, S.w, S.h);

    // 纸纤维
    const r = rng(31337);
    for (let i = 0; i < 3200; i++) {
      const px = r() * S.w, py = r() * S.h;
      const a = r() * Math.PI;
      const len = 4 + r() * 26;
      x.beginPath();
      x.moveTo(px, py);
      x.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len);
      x.strokeStyle = r() > 0.5 ? 'rgba(255,255,255,0.20)' : 'rgba(120,108,86,0.07)';
      x.lineWidth = 0.7 + r() * 0.8;
      x.stroke();
    }

    // 几块淡茶渍
    for (let i = 0; i < 5; i++) {
      const rr = rng(700 + i);
      const cx = rr() * S.w, cy = rr() * S.h;
      const rad = 90 + rr() * 220;
      const rg = x.createRadialGradient(cx, cy, rad * 0.55, cx, cy, rad);
      rg.addColorStop(0, 'rgba(160,140,100,0.0)');
      rg.addColorStop(0.82, `rgba(150,128,88,${0.05 + rr() * 0.05})`);
      rg.addColorStop(1, 'rgba(150,128,88,0)');
      x.fillStyle = rg;
      x.beginPath(); x.arc(cx, cy, rad, 0, 7); x.fill();
    }

    // 边缘压暗
    const eg = x.createRadialGradient(S.w * 0.46, S.h * 0.42, S.h * 0.3, S.w * 0.5, S.h * 0.5, S.w * 0.78);
    eg.addColorStop(0, 'rgba(120,104,74,0)');
    eg.addColorStop(1, 'rgba(116,100,70,0.30)');
    x.fillStyle = eg;
    x.fillRect(0, 0, S.w, S.h);

    // 纸边
    x.strokeStyle = 'rgba(92,82,62,0.35)';
    x.lineWidth = 1.4;
    x.strokeRect(0.7, 0.7, S.w - 1.4, S.h - 1.4);

    // 打孔
    [168, 480, 792, 1104].forEach((cy) => {
      x.save();
      x.beginPath(); x.arc(72, cy, 13.5, 0, 7);
      x.fillStyle = '#15181a'; x.fill();
      x.shadowColor = 'rgba(0,0,0,0.55)';
      x.shadowBlur = 6;
      x.shadowOffsetY = -2;
      x.beginPath(); x.arc(72, cy, 15.5, 0, 7);
      x.strokeStyle = 'rgba(255,255,255,0.35)';
      x.lineWidth = 1.6; x.stroke();
      x.restore();
    });

    // 印刷线
    x.fillStyle = 'rgba(38,32,24,0.72)';
    x.fillRect(150, 300, S.w - 300, 2.4);
    x.fillStyle = 'rgba(38,32,24,0.24)';
    x.fillRect(150, 309, S.w - 300, 1);

    // 淡表格线
    x.strokeStyle = 'rgba(90,80,62,0.10)';
    x.lineWidth = 1;
    for (let i = 1; i < 9; i++) {
      const px = 150 + i * 232;
      x.beginPath(); x.moveTo(px, 340); x.lineTo(px, 1180); x.stroke();
    }

    // 角部十字规线
    const cross = (px, py) => {
      x.strokeStyle = 'rgba(80,70,54,0.30)';
      x.lineWidth = 1;
      x.beginPath(); x.moveTo(px - 9, py); x.lineTo(px + 9, py);
      x.moveTo(px, py - 9); x.lineTo(px, py + 9); x.stroke();
    };
    cross(150, 340); cross(S.w - 150, 340); cross(150, S.h - 90); cross(S.w - 150, S.h - 90);

    // 页脚
    font(x, 10, F.mono, 400);
    x.fillStyle = 'rgba(95,88,75,0.85)';
    spaced(x, 'PHOTOGRAPHED 04:19 · 22 JUL 2019 · 12°C · FLAT-LAY 1:1', S.w - 150, S.h - 52, 2.2, 'right');
    spaced(x, 'CASE NO. 001 · 富士山下 · 证物清册', S.w - 150, S.h - 34, 2.2, 'right');

    // 左下比例尺
    x.strokeStyle = 'rgba(77,70,58,0.9)';
    x.lineWidth = 1.2;
    const bx = 150, by = S.h - 56;
    for (let i = 0; i < 9; i++) {
      x.beginPath();
      x.moveTo(bx + i * 24, by - (i % 2 ? 5 : 11));
      x.lineTo(bx + i * 24, by);
      x.stroke();
    }
    x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + 8 * 24, by); x.stroke();
    font(x, 9, F.mono, 400);
    x.fillStyle = 'rgba(95,88,75,0.9)';
    spaced(x, '0 — 50 MM', bx + 210, by - 2, 2.4);

    sheetCv = c;
  }

  function drawSheet(x) {
    x.drawImage(sheetCv, -PAD, -PAD, S.w + PAD * 2, S.h + PAD * 2);
  }

  /* ---------------- 桌面 ---------------- */
  let tableCv = null;
  function buildTable() {
    const c = document.createElement('canvas');
    c.width = 960; c.height = 540;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(300, -60, 60, 480, 320, 760);
    g.addColorStop(0, '#2e353a');
    g.addColorStop(0.55, '#1b1f22');
    g.addColorStop(1, '#0e1113');
    x.fillStyle = g;
    x.fillRect(0, 0, 960, 540);
    x.strokeStyle = 'rgba(255,255,255,0.035)';
    x.lineWidth = 1;
    for (let i = 0; i <= 960; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 540); x.stroke(); }
    for (let j = 0; j <= 540; j += 32) { x.beginPath(); x.moveTo(0, j); x.lineTo(960, j); x.stroke(); }
    tableCv = c;
  }

  function drawTable(x, W, H) {
    x.drawImage(tableCv, 0, 0, W, H);
  }

  /* ---------------- 登记卡 ---------------- */
  const CARD = { w: 640, h: 430 };
  const ROWS = [
    ['001', '风褛 / OLD COAT', '1'],
    ['002', '车票 / TICKETS', '2'],
    ['003', '花瓣 / PETALS', '6'],
    ['004', '石头 / STONE', '1'],
    ['005', '试管 / TEST TUBE', '1'],
    ['006', '钥匙 / KEY', '1']
  ];

  function drawCard(x, cx, cy, rot, a, t) {
    if (a <= 0.001) return;
    const w = CARD.w, h = CARD.h;
    x.save();
    x.translate(cx, cy);
    x.rotate(rot);
    x.globalAlpha = a;

    x.save();
    x.shadowColor = 'rgba(24,20,14,0.48)';
    x.shadowBlur = 26;
    x.shadowOffsetY = 12;
    x.fillStyle = '#f4efe2';
    x.fillRect(-w / 2, -h / 2, w, h);
    x.restore();

    x.strokeStyle = 'rgba(120,108,86,0.45)';
    x.lineWidth = 1;
    x.strokeRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1);

    // 抬头
    x.fillStyle = COL.ink;
    font(x, 22, F.serif, 400);
    spaced(x, '物 证 登 记', -w / 2 + 30, -h / 2 + 48, 4);
    font(x, 9, F.mono, 400);
    x.fillStyle = COL.ink3;
    spaced(x, 'INTAKE / EVIDENCE LOG', -w / 2 + 30, -h / 2 + 72, 2.4);

    // 红线
    x.fillStyle = 'rgba(165,48,31,0.55)';
    x.fillRect(-w / 2 + 30, -h / 2 + 86, w - 60, 1.4);

    font(x, 11, F.mono, 400);
    x.fillStyle = COL.ink2;
    spaced(x, 'CASE 001 · 富士山下', -w / 2 + 30, -h / 2 + 112, 2);

    // 勾选行
    ROWS.forEach((row, i) => {
      const ry = -h / 2 + 156 + i * 40;
      const k = typed(row[1], t, 9.9 + i * 0.82, 26);
      const done = k >= row[1].length;
      x.globalAlpha = a * (k > 0 ? 1 : 0.18);

      font(x, 10, F.mono, 400);
      x.fillStyle = COL.ink3;
      spaced(x, row[0], -w / 2 + 30, ry, 2);

      font(x, 15, F.sans, 400);
      x.fillStyle = COL.ink;
      x.fillText(row[1].slice(0, k), -w / 2 + 86, ry);

      // 点线
      const tw = 220;
      x.globalAlpha = a * 0.45;
      x.strokeStyle = 'rgba(90,80,62,0.6)';
      x.lineWidth = 1;
      x.setLineDash([1.5, 5]);
      x.beginPath(); x.moveTo(-w / 2 + 86 + tw, ry - 4); x.lineTo(w / 2 - 64, ry - 4); x.stroke();
      x.setLineDash([]);

      x.globalAlpha = a;
      font(x, 13, F.mono, 400);
      x.fillStyle = done ? COL.red : 'rgba(95,88,75,0.5)';
      x.fillText(done ? row[2] : '·', w / 2 - 48, ry);
    });

    // 签名
    font(x, 9, F.mono, 400);
    x.fillStyle = COL.ink3;
    spaced(x, 'FILED BY', -w / 2 + 30, h / 2 - 42, 2.2);
    x.fillStyle = COL.ink;
    font(x, 17, F.serif, 400);
    x.fillText('我', -w / 2 + 96, h / 2 - 38);
    font(x, 9, F.mono, 400);
    x.fillStyle = COL.ink3;
    spaced(x, '22 JUL 2019 / 04:19', -w / 2 + 132, h / 2 - 40, 1.8);

    // 右上折角
    x.fillStyle = 'rgba(160,148,122,0.30)';
    x.beginPath();
    x.moveTo(w / 2 - 46, -h / 2);
    x.lineTo(w / 2, -h / 2 + 46);
    x.lineTo(w / 2 - 46, -h / 2 + 46);
    x.closePath();
    x.fill();

    x.restore();
  }

  MV.sheet = { S, PAD, buildSheet, drawSheet, buildTable, drawTable, drawCard, CARD, ROWS };
})(window.MV);
