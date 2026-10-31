/* =========================================================
   核心：教室背景 / 课桌 / 立体书 / 歌词盖章 / 翻页 / 合书
   ========================================================= */

let SPEC = null;
let BEAT = { t0: 0.39, dur: 0.5687 };
let bgLayer, deskLayer, paperTex, grainLayer, beamLayer;
let cnv;

const PAGE_W = 1240, PAGE_H = 740;
const BOOK_CX = 960, BOOK_CY = 556;
const TEXT_Y = 262;

function preload() {
  SPEC = loadJSON('/data/spec.json');
}

function setup() {
  cnv = createCanvas(W, H);
  pixelDensity(1);
  noLoop();
  BEAT = SPEC.beat || BEAT;
  buildBackground();
  buildDesk();
  buildPaperTex();
  buildGrain();
  buildBeam();

  window.renderFrame = (t) => { drawAt(t); return cnv.canvas.toDataURL('image/jpeg', 0.94); };
  window.renderPNG = (t) => { drawAt(t); return cnv.canvas.toDataURL('image/png'); };
  window.__ready = true;
  window.__spec = SPEC;
  drawAt(0);
}

/* =========================================================
   背景：虚化的教室
   ========================================================= */
function buildBackground() {
  const g = createGraphics(W, H);
  g.pixelDensity(1);
  const x = g.drawingContext;

  // 墙
  const grad = x.createLinearGradient(0, -80, W * 0.7, H * 0.8);
  grad.addColorStop(0, '#F6EBD9');
  grad.addColorStop(0.42, '#EBDAC0');
  grad.addColorStop(1, '#D6BF9F');
  x.fillStyle = grad;
  x.fillRect(0, 0, W, H);

  x.filter = 'blur(80px)';
  x.fillStyle = 'rgba(255,240,205,0.65)';
  x.beginPath(); x.ellipse(1500, 180, 520, 340, 0, 0, 7); x.fill();

  // —— 黑板（左侧）——
  x.filter = 'blur(14px)';
  x.fillStyle = '#6F4E3B';
  x.beginPath(); x.roundRect(-180, 30, 780, 500, 12); x.fill();
  x.fillStyle = '#465C4E';
  x.beginPath(); x.roundRect(-160, 50, 740, 456, 8); x.fill();
  x.fillStyle = 'rgba(236,240,228,0.34)';
  for (let i = 0; i < 6; i++) {
    x.beginPath(); x.roundRect(-60, 108 + i * 58, 160 + ((i * 137) % 420), 12, 6); x.fill();
  }
  x.fillStyle = 'rgba(236,240,228,0.20)';
  x.beginPath(); x.roundRect(340, 120, 150, 200, 6); x.fill();
  x.fillStyle = 'rgba(150,120,92,0.55)';
  x.beginPath(); x.roundRect(-180, 512, 780, 22, 6); x.fill();

  // —— 窗户（右侧）——
  x.filter = 'blur(9px)';
  const wx0 = 1230, wy0 = -30, ww = 700, wh = 700;
  x.fillStyle = '#E9D6B8';
  x.beginPath(); x.roundRect(wx0 - 18, wy0 - 18, ww + 36, wh + 36, 14); x.fill();
  const sk = x.createLinearGradient(wx0, wy0, wx0, wy0 + wh);
  sk.addColorStop(0, '#FFFDF2');
  sk.addColorStop(0.5, '#FFF2D2');
  sk.addColorStop(1, '#FBDCA9');
  x.fillStyle = sk;
  x.beginPath(); x.roundRect(wx0, wy0, ww, wh, 6); x.fill();
  x.filter = 'blur(30px)';
  x.fillStyle = 'rgba(158,180,132,0.40)';
  x.beginPath(); x.ellipse(wx0 + 150, wy0 + 520, 240, 180, 0, 0, 7); x.fill();
  x.fillStyle = 'rgba(178,196,148,0.32)';
  x.beginPath(); x.ellipse(wx0 + 520, wy0 + 560, 260, 190, 0, 0, 7); x.fill();
  x.filter = 'blur(7px)';
  x.fillStyle = 'rgba(226,208,178,0.95)';
  x.fillRect(wx0 + ww / 2 - 10, wy0, 20, wh);
  x.fillRect(wx0, wy0 + wh / 2 - 10, ww, 20);
  x.fillRect(wx0, wy0, ww, 14);

  // —— 远处课桌 ——
  x.filter = 'blur(16px)';
  for (let row = 0; row < 2; row++) {
    const y = 470 + row * 96;
    for (let c = 0; c < 6; c++) {
      const xx = -120 + c * 380 + row * 120;
      x.fillStyle = 'rgba(176,138,100,0.30)';
      x.beginPath(); x.roundRect(xx, y, 250, 20, 6); x.fill();
      x.fillStyle = 'rgba(146,112,80,0.24)';
      x.beginPath(); x.roundRect(xx + 30, y + 20, 190, 66, 6); x.fill();
    }
  }

  // —— 吊灯 ——
  x.filter = 'blur(14px)';
  for (let i = 0; i < 2; i++) {
    const lx = 330 + i * 720;
    x.fillStyle = 'rgba(120,100,80,0.26)';
    x.fillRect(lx - 3, -20, 6, 130);
    x.beginPath(); x.ellipse(lx, 140, 66, 34, 0, 0, 7); x.fill();
    x.fillStyle = 'rgba(255,246,220,0.5)';
    x.beginPath(); x.ellipse(lx, 158, 40, 12, 0, 0, 7); x.fill();
  }

  // —— 光斑 ——
  x.filter = 'blur(40px)';
  for (let i = 0; i < 10; i++) {
    x.fillStyle = `rgba(255,238,200,${0.08 + (i % 3) * 0.05})`;
    x.beginPath();
    x.ellipse(140 + ((i * 331) % 1600), 80 + ((i * 211) % 520), 50 + (i % 4) * 30, 50 + (i % 4) * 30, 0, 0, 7);
    x.fill();
  }
  x.filter = 'none';

  const vg = x.createRadialGradient(W / 2, H * 0.46, 300, W / 2, H * 0.5, 1300);
  vg.addColorStop(0, 'rgba(255,240,215,0)');
  vg.addColorStop(0.6, 'rgba(110,80,52,0.14)');
  vg.addColorStop(1, 'rgba(70,48,30,0.46)');
  x.fillStyle = vg;
  x.fillRect(0, 0, W, H);

  bgLayer = g;
}

/* =========================================================
   课桌
   ========================================================= */
function buildDesk() {
  const g = createGraphics(W, H);
  g.pixelDensity(1);
  const x = g.drawingContext;
  const top = 330;

  const grad = x.createLinearGradient(0, top, 0, H);
  grad.addColorStop(0, '#D9AE84');
  grad.addColorStop(0.28, '#C9966B');
  grad.addColorStop(1, '#9A6D48');
  x.fillStyle = grad;
  x.fillRect(0, top, W, H - top);

  const lp = x.createRadialGradient(1240, 470, 60, 1240, 620, 1000);
  lp.addColorStop(0, 'rgba(255,236,196,0.60)');
  lp.addColorStop(0.45, 'rgba(255,222,172,0.20)');
  lp.addColorStop(1, 'rgba(255,210,160,0)');
  x.fillStyle = lp;
  x.fillRect(0, top, W, H - top);

  x.globalAlpha = 0.14;
  for (let i = 0; i < 220; i++) {
    const y = top + Math.pow(i / 220, 1.3) * (H - top) + 4;
    x.strokeStyle = i % 3 ? '#7E5330' : '#FBE2BE';
    x.lineWidth = 1 + (i % 4) * 0.6;
    x.beginPath();
    x.moveTo(-40, y);
    for (let xx = 0; xx < W + 80; xx += 60) x.lineTo(xx, y + Math.sin(xx * 0.0035 + i * 0.9) * (2 + (i % 5)));
    x.stroke();
  }
  x.globalAlpha = 1;

  const sh = x.createLinearGradient(0, top - 10, 0, top + 110);
  sh.addColorStop(0, 'rgba(70,46,28,0.52)');
  sh.addColorStop(1, 'rgba(70,46,28,0)');
  x.fillStyle = sh;
  x.fillRect(0, top - 10, W, 120);

  const hl = x.createLinearGradient(0, top, 0, top + 9);
  hl.addColorStop(0, 'rgba(255,244,214,0.75)');
  hl.addColorStop(1, 'rgba(255,244,214,0)');
  x.fillStyle = hl;
  x.fillRect(0, top, W, 10);

  const vg = x.createRadialGradient(W / 2, 720, 260, W / 2, 720, 1250);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(58,36,20,0.38)');
  x.fillStyle = vg;
  x.fillRect(0, 0, W, H);

  deskLayer = g;
}

/* 水彩纸纹理 */
function buildPaperTex() {
  const g = createGraphics(820, 820);
  g.pixelDensity(1);
  const x = g.drawingContext;
  x.fillStyle = '#FBF4E4';
  x.fillRect(0, 0, 820, 820);
  const r = mulberry32(101);
  x.filter = 'blur(18px)';
  for (let i = 0; i < 46; i++) {
    const a = 0.05 + r() * 0.09;
    x.fillStyle = i % 3 === 0 ? `rgba(226,206,176,${a})` : (i % 3 === 1 ? `rgba(250,236,208,${a})` : `rgba(214,196,168,${a})`);
    x.beginPath();
    x.ellipse(r() * 820, r() * 820, 60 + r() * 170, 50 + r() * 150, r() * 3, 0, 7);
    x.fill();
  }
  x.filter = 'none';
  x.globalAlpha = 0.10;
  for (let i = 0; i < 900; i++) {
    x.strokeStyle = i % 2 ? '#B9A78C' : '#FFFFFF';
    x.lineWidth = 0.8;
    const sx = r() * 820, sy = r() * 820, len = 4 + r() * 26, ang = r() * 3.14;
    x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + Math.cos(ang) * len, sy + Math.sin(ang) * len); x.stroke();
  }
  x.globalAlpha = 1;
  paperTex = g;
}

/* 颗粒 */
function buildGrain() {
  const g = createGraphics(W, H);
  g.pixelDensity(1);
  g.loadPixels();
  const r = mulberry32(7);
  for (let i = 0; i < g.pixels.length; i += 4) {
    const v = r();
    g.pixels[i] = 255; g.pixels[i + 1] = 250; g.pixels[i + 2] = 240;
    g.pixels[i + 3] = v > 0.986 ? 24 : (v > 0.962 ? 9 : 0);
  }
  g.updatePixels();
  grainLayer = g;
}

/* 预模糊的暖光柱 */
function buildBeam() {
  const g = createGraphics(W, H);
  g.pixelDensity(1);
  const x = g.drawingContext;
  x.filter = 'blur(34px)';
  const grad = x.createLinearGradient(1560, -80, 900, H);
  grad.addColorStop(0, 'rgba(255,238,196,0.55)');
  grad.addColorStop(0.5, 'rgba(255,228,172,0.20)');
  grad.addColorStop(1, 'rgba(255,220,160,0)');
  x.fillStyle = grad;
  x.beginPath();
  x.moveTo(1250, -80); x.lineTo(1900, -80); x.lineTo(1180, H + 60); x.lineTo(500, H + 60);
  x.closePath(); x.fill();

  const g2 = x.createLinearGradient(1780, -80, 1200, H);
  g2.addColorStop(0, 'rgba(255,248,220,0.30)');
  g2.addColorStop(1, 'rgba(255,242,206,0)');
  x.fillStyle = g2;
  x.beginPath();
  x.moveTo(1520, -80); x.lineTo(1980, -80); x.lineTo(1640, H + 60); x.lineTo(1080, H + 60);
  x.closePath(); x.fill();
  x.filter = 'none';
  beamLayer = g;
}

/* =========================================================
   镜头：中远景 → 近景
   ========================================================= */
function cameraAt(t) {
  // 前 52 秒缓慢推近，最后 8 秒轻轻拉开，露出桌面与合上的书
  const push = easeInOut(clamp01(t / 52));
  const back = easeInOut(clamp01((t - 51) / 8.4));
  const scale = 1.0 + 0.36 * push - 0.20 * back;
  return {
    scale,
    x: 16 - 34 * push + 16 * back + Math.sin(t * 0.55) * 3,
    y: 6 - 18 * push + 10 * back + Math.cos(t * 0.42) * 2.5,
    rot: -0.004 + 0.006 * push
  };
}

/* =========================================================
   书
   ========================================================= */
function sceneAt(t) {
  const list = SPEC.scenes;
  let cur = list[0];
  for (let i = 0; i < list.length; i++) if (t >= list[i].t - 1e-6) cur = list[i];
  return { cur };
}

function coverProgress(t) {
  const s = SPEC.scenes[SPEC.scenes.length - 1];
  return clamp01((t - (s.t + 1.0)) / 0.55);
}
function giftProgress(t) {
  const s = SPEC.scenes[SPEC.scenes.length - 1];
  return clamp01((t - (s.t + 1.62)) / 0.45);
}

function drawBook(t) {
  const closeU = coverProgress(t);
  const { cur } = sceneAt(t);

  const ctx = drawingContext;
  ctx.save();
  ctx.translate(BOOK_CX + 30, BOOK_CY + 250);
  ctx.scale(1, 0.30);
  const sg = ctx.createRadialGradient(0, 0, 120, 0, 0, 800);
  sg.addColorStop(0, 'rgba(58,36,20,0.48)');
  sg.addColorStop(0.55, 'rgba(58,36,20,0.20)');
  sg.addColorStop(1, 'rgba(58,36,20,0)');
  ctx.fillStyle = sg;
  ctx.beginPath(); ctx.arc(0, 0, 800, 0, 7); ctx.fill();
  ctx.restore();

  push();
  translate(BOOK_CX, BOOK_CY);
  rotate(-0.014);

  // 书页厚度
  for (let i = 10; i >= 1; i--) {
    noStroke();
    fill(i % 2 ? '#E3D2B6' : '#F0E2C8');
    rect(-PAGE_W / 2 + i * 1.1, -PAGE_H / 2 + i * 3.2, PAGE_W, PAGE_H, 8);
  }
  // 封面
  push();
  shOn(24, 8, 0.28);
  noStroke(); fill('#B4704E');
  rect(-PAGE_W / 2 - 24, -PAGE_H / 2 - 18, PAGE_W + 48, PAGE_H + 44, 16);
  shOff();
  ctx.save();
  ctx.beginPath(); ctx.roundRect(-PAGE_W / 2 - 24, -PAGE_H / 2 - 18, PAGE_W + 48, PAGE_H + 44, 16); ctx.clip();
  ctx.globalAlpha = 0.08;
  for (let i = -40; i < 60; i++) { ctx.fillStyle = i % 2 ? '#7E4530' : '#EFC0A2'; ctx.fillRect(-PAGE_W / 2 - 24, i * 12, PAGE_W + 48, 5); }
  ctx.globalAlpha = 1;
  ctx.restore();
  pop();

  // 页面
  push();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(-PAGE_W / 2, -PAGE_H / 2, PAGE_W, PAGE_H, 6);
  ctx.clip();

  noStroke(); fill(C.paper);
  rect(-PAGE_W / 2, -PAGE_H / 2, PAGE_W, PAGE_H);
  // 页面柔和渐变：上方暖、下方沉
  const pg = ctx.createLinearGradient(0, -PAGE_H / 2, 0, PAGE_H / 2);
  pg.addColorStop(0, 'rgba(255,238,206,0.55)');
  pg.addColorStop(0.45, 'rgba(255,248,232,0.10)');
  pg.addColorStop(1, 'rgba(196,166,124,0.16)');
  ctx.fillStyle = pg;
  ctx.fillRect(-PAGE_W / 2, -PAGE_H / 2, PAGE_W, PAGE_H);

  if (closeU < 1) {
    // 合书前，纸艺先「压平」收进书页
    const foldP = clamp01(closeU / 0.28);
    push();
    translate(0, 46); scale(1, 1 - 0.88 * foldP); translate(0, -46);
    drawingContext.globalAlpha = 1 - foldP * 0.9;
    const lt = Math.max(0, t - cur.t);
    drawScene(cur.id, lt, nextSceneDur(cur), t);
    drawingContext.globalAlpha = 1;
    pop();

    const gg = ctx.createLinearGradient(-46, 0, 46, 0);
    gg.addColorStop(0, 'rgba(255,255,255,0)');
    gg.addColorStop(0.42, 'rgba(120,95,70,0.30)');
    gg.addColorStop(0.58, 'rgba(120,95,70,0.30)');
    gg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gg;
    ctx.fillRect(-46, -PAGE_H / 2, 92, PAGE_H);
    const hg = ctx.createLinearGradient(-12, 0, 12, 0);
    hg.addColorStop(0, 'rgba(255,255,255,0)');
    hg.addColorStop(0.5, 'rgba(255,255,255,0.16)');
    hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(-12, -PAGE_H / 2, 24, PAGE_H);

    const eg = ctx.createLinearGradient(0, -PAGE_H / 2, 0, -PAGE_H / 2 + 70);
    eg.addColorStop(0, 'rgba(120,95,70,0.20)');
    eg.addColorStop(1, 'rgba(120,95,70,0)');
    ctx.fillStyle = eg; ctx.fillRect(-PAGE_W / 2, -PAGE_H / 2, PAGE_W, 70);
  }

  push();
  blendMode(MULTIPLY);
  tint(255, 62);
  image(paperTex, -PAGE_W / 2, -PAGE_H / 2, PAGE_W, PAGE_H);
  noTint();
  blendMode(BLEND);
  pop();
  ctx.restore();

  noFill(); stroke(120, 90, 64, 45); strokeWeight(2);
  rect(-PAGE_W / 2, -PAGE_H / 2, PAGE_W, PAGE_H, 6);
  noStroke();

  if (closeU > 0) drawClosingCover(closeU);
  if (giftProgress(t) > 0) drawGift(giftProgress(t));
  drawLyrics(t, closeU);
  if (closeU < 0.02) drawPageFlip(t, cur);

  pop();
  pop();
}

function nextSceneDur(cur) {
  const i = SPEC.scenes.indexOf(cur);
  const nxt = SPEC.scenes[i + 1];
  return (nxt ? nxt.t : SPEC.duration) - cur.t;
}

/* 合上的封面：从右侧合过来 */
function drawClosingCover(u) {
  const p = easeOut(clamp01((u - 0.2) / 0.8));
  const w = lerp(0, PAGE_W + 32, p);
  const h = PAGE_H + 34;
  const left = PAGE_W / 2 - w;
  push();
  shOn(26, 10, 0.34);
  noStroke(); fill('#B4704E');
  rect(left, -h / 2, w, h, 12);
  shOff();
  const ctx = drawingContext;
  ctx.save();
  ctx.beginPath(); ctx.roundRect(left, -h / 2, w, h, 12); ctx.clip();
  ctx.globalAlpha = 0.05;
  for (let i = -50; i < 55; i++) { ctx.fillStyle = i % 2 ? '#7E4530' : '#EFC0A2'; ctx.fillRect(left, i * 18, w, 9); }
  ctx.globalAlpha = 0.10;
  const gg = ctx.createLinearGradient(left, 0, left + 70, 0);
  gg.addColorStop(0, 'rgba(70,36,22,0.55)');
  gg.addColorStop(1, 'rgba(70,36,22,0)');
  ctx.fillStyle = gg; ctx.fillRect(left, -h / 2, 70, h);
  ctx.restore();
  if (w > 120) {
    noFill(); stroke(234, 200, 148, 210 * p); strokeWeight(3);
    rect(left + 20, -h / 2 + 20, w - 40, h - 40, 8);
    stroke(234, 200, 148, 120 * p); strokeWeight(1.4);
    rect(left + 32, -h / 2 + 32, w - 64, h - 64, 6);
    noStroke();
    fill(120, 62, 40, 120 * p);
    rect(left, -h / 2 + 10, 26, h - 20, 4);
  }
  pop();
}

/* 红线捆成礼物 */
function drawGift(u) {
  const p = easeOutBack(u);
  const w = PAGE_W + 32, h = PAGE_H + 34;
  push();
  noStroke(); fill(fa(C.red, 240));
  rect(-17, -h / 2 - 8, 34, h + 16, 5);
  rect(-w / 2 - 8, -15, w + 16, 30, 5);
  fill(255, 255, 255, 46);
  rect(-17, -h / 2 - 8, 8, h + 16, 3);
  rect(-w / 2 - 8, -15, w + 16, 8, 3);
  push(); scale(p); translate(0, -h / 2 + 150);
  fill(C.redDeep); noStroke();
  ellipse(-44, -16, 88, 58); ellipse(44, -16, 88, 58);
  fill(C.red);
  ellipse(-44, -16, 74, 44); ellipse(44, -16, 74, 44);
  fill(C.redDeep); ellipse(0, 0, 40, 40);
  fill(C.red);
  beginShape(); vertex(-13, 10); vertex(-50, 92); vertex(-22, 84); vertex(-30, 112); vertex(4, 32); endShape(CLOSE);
  beginShape(); vertex(13, 10); vertex(50, 92); vertex(22, 84); vertex(30, 112); vertex(-4, 32); endShape(CLOSE);
  pop();
  pop();
}

/* 歌词盖章 */
function drawLyrics(t, closeU) {
  const lines = SPEC.lyrics;
  let cur = null;
  for (const l of lines) if (t >= l.t - 0.001) cur = l;
  if (!cur) return;

  const chars = [...cur.text];
  const size = chars.length > 14 ? 47 : 53;
  textFont(FONT_S);
  textStyle(BOLD);
  textAlign(CENTER, BASELINE);
  textSize(size);
  const gap = size * 0.07;
  const widths = chars.map((c) => textWidth(c) + gap);
  const total = widths.reduce((a, b) => a + b, 0);

  // 歌词纸带：印在书页上的一条纸
  const stripW = total + 176;
  const stripA = clamp01((t - cur.t) / 0.22);
  if (stripA > 0) {
    push();
    const r2 = mulberry32(29);
    const pts = [];
    const top = TEXT_Y - 54, bot = TEXT_Y + 34;
    for (let i = 0; i <= 10; i++) pts.push([-stripW / 2 + (stripW * i) / 10, top + (r2() - 0.5) * 6]);
    for (let i = 10; i >= 0; i--) pts.push([-stripW / 2 + (stripW * i) / 10, bot + (r2() - 0.5) * 6]);
    drawingContext.globalAlpha = stripA * 0.92;
    paperPoly(pts, '#FBF2E0', { blur: 12, dy: 5, a: 0.16, line: false });
    drawingContext.globalAlpha = 1;
    pop();
  }

  let cx = -total / 2;
  const el = t - cur.t;
  const per = 0.082;

  for (let i = 0; i < chars.length; i++) {
    const ce = el - i * per;
    if (ce <= 0) break;
    const k = clamp01(ce / 0.17);
    const sc = 1 + (1 - k) * 0.75;
    const jitter = (1 - k) * 0.05 * (i % 2 ? 1 : -1);
    push();
    translate(cx + widths[i] / 2, TEXT_Y);
    rotate(jitter);
    scale(sc);
    if (k > 0.6) { fill(120, 100, 78, 26); text(chars[i], 1.6, 2.0); }
    fill(73, 58, 49, 255 * Math.min(1, k * 1.4));
    text(chars[i], 0, 0);
    pop();
    if (k < 0.7) {
      fill(73, 58, 49, 60 * (1 - k)); noStroke();
      ellipse(cx + widths[i] / 2 + rr(7, -7), TEXT_Y + rr(10, -10), 3, 3);
    }
    cx += widths[i];
  }

  if (el > 0.25) {
    const s = clamp01((el - 0.25) / 0.3);
    push();
    translate(-total / 2 - 40, TEXT_Y);
    scale(s); rotate(-0.06);
    noFill(); stroke(fa(C.red, 210)); strokeWeight(3.2);
    rect(-21, -21, 42, 42, 4);
    fill(fa(C.red, 200)); noStroke();
    textFont(FONT_S); textStyle(BOLD); textSize(15); textAlign(CENTER, CENTER);
    text(cur.keyword.slice(0, 2), 0, 1);
    pop();
  }
  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
}

/* 翻页转场 */
function drawPageFlip(t, cur) {
  const idx = SPEC.scenes.indexOf(cur);
  if (idx <= 0) return;
  const p = clamp01((t - cur.t) / 0.46);
  if (p >= 1) return;

  push();
  const ctx = drawingContext;
  const coverW = (1 - easeOut(p)) * (PAGE_W + 20);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(-PAGE_W / 2, -PAGE_H / 2, PAGE_W, PAGE_H, 6);
  ctx.clip();

  const x0 = -PAGE_W / 2;
  const x1 = -PAGE_W / 2 + coverW;
  shOn(24, 8, 0.28);
  fill('#FBF1DD'); noStroke();
  beginShape();
  vertex(x0, -PAGE_H / 2);
  vertex(x1, -PAGE_H / 2 + 16 * (1 - p));
  vertex(x1 + 26 * (1 - p), 0);
  vertex(x1, PAGE_H / 2 - 16 * (1 - p));
  vertex(x0, PAGE_H / 2);
  endShape(CLOSE);
  shOff();
  const gr = ctx.createLinearGradient(x1 - 150, 0, x1 + 10, 0);
  gr.addColorStop(0, 'rgba(120,95,70,0)');
  gr.addColorStop(1, 'rgba(120,95,70,0.24)');
  ctx.fillStyle = gr;
  ctx.fillRect(x1 - 150, -PAGE_H / 2, 160, PAGE_H);
  const sh2 = ctx.createLinearGradient(x1 + 10, 0, x1 + 130, 0);
  sh2.addColorStop(0, 'rgba(90,64,42,0.26)');
  sh2.addColorStop(1, 'rgba(90,64,42,0)');
  ctx.fillStyle = sh2;
  ctx.fillRect(x1 + 10, -PAGE_H / 2, 130, PAGE_H);
  ctx.restore();

  const r = mulberry32(Math.floor(t * 30) % 97);
  for (let i = 0; i < 10; i++) {
    fill(255, 250, 236, 150 * (1 - p)); noStroke();
    ellipse(x1 + r() * 90 - 30, -PAGE_H / 2 + r() * PAGE_H, 3 + r() * 4, 3 + r() * 4);
  }
  pop();
}

/* 光：窗外斜进的暖光 + 浮尘 */
function drawBeam(t) {
  const ctx = drawingContext;
  const sway = Math.sin(t * 0.35) * 14;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.95;
  ctx.drawImage(beamLayer.elt, sway, 0);
  ctx.restore();

  const r = mulberry32(13);
  for (let i = 0; i < 30; i++) {
    const x = 1240 + r() * 620;
    const sp = 10 + r() * 26;
    const y = ((r() * 980 + t * sp) % 1040) - 30;
    const drift = Math.sin(t * 0.7 + i) * 28;
    fill(255, 246, 216, 30 + 40 * Math.sin(t * 2 + i));
    noStroke();
    ellipse(x + drift, y, 3 + r() * 3, 3 + r() * 3);
  }
}

/* =========================================================
   主绘制
   ========================================================= */
function drawAt(t) {
  RND = mulberry32(Math.round(t * 30) + 1);
  const cam = cameraAt(t);
  const ctx = drawingContext;

  background('#D8C3A6');

  push();
  translate(W / 2, H / 2);
  scale(cam.scale * 0.97, cam.scale * 0.97);
  rotate(cam.rot * 0.5);
  translate(-W / 2 - cam.x * 0.5, -H / 2 - cam.y * 0.5);
  image(bgLayer, -40, -40, W + 80, H + 80);
  pop();

  push();
  translate(W / 2, H / 2);
  scale(cam.scale);
  rotate(cam.rot);
  translate(-W / 2 + cam.x, -H / 2 + cam.y);
  image(deskLayer, -30, -20, W + 60, H + 40);
  drawBook(t);
  pop();

  drawBeam(t);

  const gift = giftProgress(t);
  if (gift > 0) {
    const g = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 1100);
    g.addColorStop(0, `rgba(255,240,206,${0.16 * gift})`);
    g.addColorStop(1, 'rgba(255,235,200,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  if (t > 59.5) {
    const a = clamp01((t - 59.5) / 0.5);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `rgba(255,244,222,${0.34 * a})`);
    g.addColorStop(1, `rgba(255,236,206,${0.52 * a})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  push();
  blendMode(MULTIPLY);
  tint(255, 110);
  image(grainLayer, 0, 0);
  noTint();
  blendMode(BLEND);
  pop();

  const vg = ctx.createRadialGradient(W / 2, H * 0.5, 420, W / 2, H * 0.5, 1220);
  vg.addColorStop(0, 'rgba(40,26,16,0)');
  vg.addColorStop(1, 'rgba(40,26,16,0.30)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}
