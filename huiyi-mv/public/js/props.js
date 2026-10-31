/* =========================================================
   纸艺道具库 —— 剪纸叠层 + 水彩纸纹理
   所有图形都是「一层一层的纸」：填充 + 柔投影 + 纸边高光
   ========================================================= */

const W = 1920, H = 1080;
const FONT_S = 'Songti SC';
const FONT_H = 'PingFang SC';

const C = {
  wall1: '#F1E6D6', wall2: '#DCC8AE',
  desk1: '#C99C74', desk2: '#A97B52',
  paper: '#FDF7EA', paper2: '#F3E7D2', paperEdge: '#E6D6BC',
  ink: '#493A31', inkSoft: '#7C6555',
  coral: '#E27B70', coralDeep: '#C2574E', blush: '#F5B6AC',
  hair: '#4C382F', skin: '#F8DAC5',
  boy: '#FCF8EE', boyLine: '#BCAF9F',
  gold: '#F2BC50', goldDeep: '#D9992F',
  blue: '#6E92B7', blueDeep: '#44637F', bluePale: '#BFD3E4',
  red: '#CE463D', redDeep: '#A33129',
  green: '#7FA98A', greenDeep: '#5C866A',
  grey: '#A2A09B', greyDark: '#6E6B67', greyLight: '#C9C6C0',
  night: '#31415C', nightDeep: '#22304A',
  cream: '#FFF3DC'
};

/* ---------- 随机（按帧种子，保证可重绘） ---------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let RND = mulberry32(1);
const rr = (a = 1, b = 0) => b + RND() * (a - b);

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, u) => a + (b - a) * u;
const easeOut = (u) => 1 - Math.pow(1 - clamp01(u), 3);
const easeIn = (u) => Math.pow(clamp01(u), 3);
const easeInOut = (u) => { u = clamp01(u); return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; };
const easeOutBack = (u) => { u = clamp01(u); const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };

/* ---------- 纸的柔投影 ---------- */
function shOn(blur = 16, dy = 9, a = 0.22, col = '92,68,46') {
  const x = drawingContext;
  x.shadowColor = `rgba(${col},${a})`;
  x.shadowBlur = blur;
  x.shadowOffsetX = 0;
  x.shadowOffsetY = dy;
}
function shOff() {
  const x = drawingContext;
  x.shadowColor = 'rgba(0,0,0,0)';
  x.shadowBlur = 0;
  x.shadowOffsetY = 0;
}


/* 带透明度的颜色（避免 fill(字符串, alpha) 在 p5 中的兼容问题） */
function fa(colStr, a) {
  const c = color(colStr);
  c.setAlpha(a);
  return c;
}

/* ---------- 基础纸片 ---------- */
function paperPoly(pts, fillCol, o = {}) {
  const { blur = 14, dy = 8, a = 0.2, edge = true, strokeCol = null, sw = 0, line = true } = o;
  shOn(blur, dy, a);
  noStroke();
  fill(fillCol);
  beginShape();
  for (const p of pts) vertex(p[0], p[1]);
  endShape(CLOSE);
  shOff();
  if (line) {
    noFill(); stroke(lerpColor(color(fillCol), color(96, 70, 48), 0.30)); strokeWeight(1.7);
    beginShape(); for (const p of pts) vertex(p[0], p[1]); endShape(CLOSE);
    noStroke();
  }
  if (strokeCol) { noFill(); stroke(strokeCol); strokeWeight(sw); beginShape(); for (const p of pts) vertex(p[0], p[1]); endShape(CLOSE); noStroke(); }
  if (edge) {
    noFill(); stroke(255, 255, 255, 80); strokeWeight(1.4);
    beginShape(); for (let i = 0; i < pts.length; i++) vertex(pts[i][0] - 1.2, pts[i][1] - 1.2); endShape(CLOSE);
    noStroke();
  }
}

function paperRect(x, y, w, h, r, fillCol, o = {}) {
  const { blur = 14, dy = 8, a = 0.2, edge = true, line = true } = o;
  shOn(blur, dy, a);
  noStroke(); fill(fillCol);
  rect(x - w / 2, y - h / 2, w, h, r);
  shOff();
  if (line) { noFill(); stroke(lerpColor(color(fillCol), color(96, 70, 48), 0.28)); strokeWeight(1.6); rect(x - w / 2, y - h / 2, w, h, r); noStroke(); }
  if (edge) { noFill(); stroke(255, 255, 255, 70); strokeWeight(1.4); rect(x - w / 2 - 1, y - h / 2 - 1, w, h, r); noStroke(); }
}

function paperEllipse(x, y, w, h, fillCol, o = {}) {
  const { blur = 12, dy = 7, a = 0.18, line = false } = o;
  shOn(blur, dy, a);
  noStroke(); fill(fillCol); ellipse(x, y, w, h);
  shOff();
  if (line) { noFill(); stroke(lerpColor(color(fillCol), color(96, 70, 48), 0.26)); strokeWeight(1.6); ellipse(x, y, w, h); noStroke(); }
}

/* 撕纸边（不规则多边形条带） */
function tornStrip(x, y, w, h, fillCol, seed = 1, o = {}) {
  const r = mulberry32(seed);
  const pts = [];
  const n = Math.max(4, Math.round(w / 26));
  for (let i = 0; i <= n; i++) pts.push([x - w / 2 + (w * i) / n, y - h / 2 + (r() - 0.5) * h * 0.22]);
  for (let i = n; i >= 0; i--) pts.push([x - w / 2 + (w * i) / n, y + h / 2 + (r() - 0.5) * h * 0.22]);
  paperPoly(pts, fill, o);
}

/* 纸的折痕 / 折线 */
function foldLine(x1, y1, x2, y2, a = 0.18) {
  stroke(120, 95, 70, 255 * a); strokeWeight(1.6);
  line(x1, y1, x2, y2);
  stroke(255, 255, 255, 255 * a * 0.9); strokeWeight(1.4);
  line(x1 + 1.6, y1 + 1.6, x2 + 1.6, y2 + 1.6);
  noStroke();
}

/* 纸卷边高光（书页边缘） */
function curlHighlight(x, y, w, h, side = 'right') {
  const ctx = drawingContext;
  const g = side === 'right'
    ? ctx.createLinearGradient(x + w - 70, 0, x + w, 0)
    : ctx.createLinearGradient(x + 70, 0, x, 0);
  if (side === 'right') { g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.75)'); }
  else { g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.75)'); }
  ctx.save(); ctx.fillStyle = g;
  ctx.fillRect(side === 'right' ? x + w - 70 : x, y, 70, h);
  ctx.restore();
}

/* =========================================================
   Q版纸片小人
   x,y = 脚底中心；s = 缩放
   ========================================================= */
function drawKid(x, y, s, o = {}) {
  const {
    girl = true, lean = 0, headTilt = 0, armL = 0.6, armR = -0.6,
    expr = 'smile', look = 0, alpha = 1, colorAmt = 1, pencil = false,
    hairUp = false, blushOn = true, legs = 0
  } = o;
  push();
  translate(x, y);
  scale(s, s);
  rotate(lean);
  if (alpha < 1) drawingContext.globalAlpha = alpha;

  const cAmt = colorAmt;
  const cBody = pencil ? '#DCD5C8' : (girl ? C.coral : lerpColor(color('#FCF8EE'), color('#8FB0C4'), cAmt).toString());
  const cBody2 = pencil ? '#CFC7B8' : (girl ? C.coralDeep : lerpColor(color('#EFE7D6'), color('#6E8FB4'), cAmt * 0.9).toString());
  const cSkin = pencil ? '#E4DDD0' : lerpColor(color('#F1E8D8'), color(C.skin), girl ? 1 : cAmt).toString();
  const cHair = pencil ? '#B9B0A2' : (girl ? C.hair : lerpColor(color('#C9BFB1'), color('#5E4639'), cAmt).toString());
  const cLeg = pencil ? '#D6CFC1' : (girl ? '#F6D3BC' : lerpColor(color('#F0E9DB'), color('#EDCFB6'), cAmt).toString());

  // 地面投影
  noStroke(); fill(120, 92, 70, 46); ellipse(0, 2, 96, 18);

  // 腿
  shOn(10, 5, 0.16);
  fill(cLeg); rect(-16, -44, 15, 44, 7); rect(3, -44, 15, 44, 7);
  shOff();
  // 鞋
  fill(pencil ? '#C0B8AB' : (girl ? C.coralDeep : C.blueDeep));
  rect(-18, -8, 20, 10, 5); rect(2, -8, 20, 10, 5);

  // 身体（裙 / 衬衫）
  shOn(16, 8, 0.2);
  fill(cBody);
  if (pencil) { stroke(96, 90, 82, 150); strokeWeight(2); }
  beginShape();
  vertex(-24, -118);
  vertex(24, -118);
  vertex(girl ? 44 : 34, -46);
  if (girl) {
    for (let i = 0; i <= 6; i++) {
      const u = i / 6;
      vertex(44 - u * 88, -46 + Math.sin(u * Math.PI * 3) * 6);
    }
  } else {
    vertex(30, -48);
    vertex(-30, -48);
  }
  endShape(CLOSE);
  shOff();
  noStroke();

  // 领口 / 衣服细节
  noFill(); stroke(255, 255, 255, pencil ? 40 : 120); strokeWeight(2);
  if (girl) {
    arc(0, -112, 26, 18, 0.15, PI - 0.15);
  } else {
    line(-8, -116, 0, -100); line(8, -116, 0, -100);
  }
  noStroke();

  if (!pencil && !girl) {
    // 短裤
    fill(cBody2); noStroke();
    rect(-30, -58, 60, 14, 4);
  }
  if (!pencil) {
    // 裙子下摆深色纸层
    if (girl) {
    fill(cBody2); noStroke();
    beginShape();
    vertex(-44, -52); vertex(44, -52); vertex(43, -46);
    for (let i = 0; i <= 6; i++) {
      const u = i / 6;
      vertex(44 - u * 88, -46 + Math.sin(u * Math.PI * 3) * 6);
    }
    endShape(CLOSE);
    }
  }

  // 手臂
  const shoulderY = -110;
  drawArm(-22, shoulderY, armL, cBody, cSkin, girl);
  drawArm(22, shoulderY, armR, cBody, cSkin, girl);

  // 脖子
  fill(cSkin); noStroke(); rect(-7, -128, 14, 12, 5);

  // 头
  push();
  translate(0, -172);
  rotate(headTilt);
  shOn(18, 9, 0.2);
  fill(cSkin); noStroke(); ellipse(0, 0, 92, 88);
  shOff();
  if (pencil) { noFill(); stroke(96, 90, 82, 130); strokeWeight(2); ellipse(0, 0, 92, 88); noStroke(); }
  // 头发
  if (girl) {
    fill(cHair);
    arc(0, -6, 100, 96, PI + 0.32, TWO_PI + 0.12);
    if (hairUp) {
      ellipse(0, -46, 40, 26);
      ellipse(-30, -40, 20, 18); ellipse(30, -40, 20, 18);
    } else {
      // 两侧发尾
      quad(-46, -12, -30, -12, -34, 42, -52, 34);
      quad(46, -12, 30, -12, 34, 42, 52, 34);
    }
    // 刘海
    beginShape();
    vertex(-46, -4); vertex(-40, -30); vertex(-18, -16); vertex(0, -30);
    vertex(18, -16); vertex(40, -30); vertex(46, -4);
    endShape(CLOSE);
  } else {
    fill(cHair);
    arc(0, -8, 98, 92, PI + 0.42, TWO_PI + 0.02);
    beginShape();
    vertex(-45, -2); vertex(-30, -28); vertex(-4, -14); vertex(16, -28);
    vertex(40, -12); vertex(45, -2);
    endShape(CLOSE);
  }

  // 眼睛
  const eyeY = 8 + look * 4;
  fill(pencil ? '#6E6B67' : '#3B2E28'); noStroke();
  if (expr === 'happy' || expr === 'wow') {
    noFill(); stroke(pencil ? '#6E6B67' : '#3B2E28'); strokeWeight(3.2);
    arc(-17, eyeY + 2, 15, 12, PI + 0.2, TWO_PI - 0.2);
    arc(17, eyeY + 2, 15, 12, PI + 0.2, TWO_PI - 0.2);
    noStroke();
  } else if (expr === 'sad') {
    noFill(); stroke(pencil ? '#6E6B67' : '#3B2E28'); strokeWeight(3);
    arc(-17, eyeY + 4, 14, 9, PI, TWO_PI);
    arc(17, eyeY + 4, 14, 9, PI, TWO_PI);
    noStroke();
  } else {
    ellipse(-17, eyeY, 8, 10);
    ellipse(17, eyeY, 8, 10);
    fill(255, 255, 255, 200); ellipse(-19, eyeY - 3, 3, 3); ellipse(15, eyeY - 3, 3, 3);
  }
  // 腮红
  if (blushOn && !pencil) {
    fill(fa(C.blush, 130)); noStroke();
    ellipse(-29, 22, 16, 9); ellipse(29, 22, 16, 9);
  }
  // 嘴
  noFill(); stroke(pencil ? '#6E6B67' : '#9C5A4C'); strokeWeight(2.4);
  if (expr === 'sad') arc(0, 26, 16, 12, PI + 0.4, TWO_PI - 0.4);
  else if (expr === 'wow') { fill('#B76A5A'); noStroke(); ellipse(0, 27, 12, 13); }
  else arc(0, 22, 20, 14, 0.25, PI - 0.25);
  noStroke();
  pop();

  noStroke();
  drawingContext.globalAlpha = 1;
  pop();
}

function drawArm(sx, sy, ang, cBody, cSkin, girl) {
  push();
  translate(sx, sy);
  rotate(ang);
  shOn(10, 5, 0.14);
  fill(cBody); noStroke(); rect(-7, 0, 14, 34, 7);
  shOff();
  fill(cSkin); noStroke(); ellipse(0, 38, 17, 16);
  pop();
}

/* =========================================================
   小道具
   ========================================================= */

/* 纸烟花：p=0..1 炸开进度 */
function drawFirework(x, y, rad, p, hue = 'gold', alpha = 1) {
  if (p <= 0 || p >= 1) return;
  const cols = { gold: [C.gold, C.goldDeep, '#F8E3B0'], coral: [C.coral, C.coralDeep, '#FAD3CB'], blue: [C.blue, C.blueDeep, C.bluePale] }[hue] || [C.gold, C.goldDeep, '#F8E3B0'];
  push();
  drawingContext.globalAlpha = alpha;
  const grow = easeOut(p);
  const fade = 1 - easeIn(clamp01((p - 0.55) / 0.45));
  // 中心光点
  if (p < 0.35) {
    const g = 1 - p / 0.35;
    fill(255, 240, 200, 210 * g); noStroke();
    ellipse(x, y, 46 * g + 10, 46 * g + 10);
  }
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TWO_PI + 0.22 * i;
    const len = rad * (0.62 + 0.42 * ((i * 37) % 11) / 11) * grow;
    const w = 15 * (1 - p * 0.55);
    const px = x + Math.cos(a) * len * 0.55;
    const py = y + Math.sin(a) * len * 0.55 + p * p * 34;
    push(); translate(px, py); rotate(a);
    shOn(10, 5, 0.16 * fade, '80,60,40');
    fill(cols[i % 3]); noStroke();
    beginShape();
    vertex(-len * 0.5, 0); vertex(0, -w * 0.5); vertex(len * 0.5, 0); vertex(0, w * 0.5);
    endShape(CLOSE);
    shOff();
    pop();
  }
  // 火星碎纸
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TWO_PI + 0.5;
    const d = rad * 0.5 * grow;
    fill(255, 250, 235, 180 * fade); noStroke();
    ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d + p * 60, 7, 7);
  }
  drawingContext.globalAlpha = 1;
  pop();
}

/* 灰色高楼：pop=0..1 弹起 */
function drawTower(x, baseY, w, h, pop, tone = 0) {
  const p = easeOutBack(pop);
  if (p <= 0.01) return;
  const hh = h * p;
  const top = baseY - hh;
  const g = lerp(0, 1, tone);
  const fill1 = lerpColor(color(C.greyLight), color('#8E8B86'), g).toString();
  const fill2 = lerpColor(color('#BDB9B2'), color('#767370'), g).toString();
  // 楼体
  paperPoly([[x - w / 2, baseY], [x + w / 2, baseY], [x + w / 2, top], [x - w / 2, top]], fill1, { blur: 14, dy: 7, a: 0.22 });
  // 侧面
  paperPoly([[x + w / 2, baseY], [x + w / 2 + w * 0.16, baseY - h * 0.03], [x + w / 2 + w * 0.16, top + h * 0.04], [x + w / 2, top]], fill2, { blur: 8, dy: 4, a: 0.16, edge: false });
  // 窗
  noStroke();
  const cols = Math.max(2, Math.floor(w / 26));
  const rows = Math.max(2, Math.floor(hh / 34));
  for (let r = 0; r < rows; r++) {
    for (let c2 = 0; c2 < cols; c2++) {
      const wx = x - w / 2 + 13 + c2 * (w - 20) / cols;
      const wy = top + 18 + r * (hh - 24) / rows;
      if (wy > baseY - 12) continue;
      fill(70, 68, 66, 40 + (tone * 40));
      rect(wx, wy, (w - 20) / cols - 8, 12, 2);
    }
  }
  // 楼的纸边高光
  stroke(255, 255, 255, 40); strokeWeight(1.2);
  line(x - w / 2, baseY, x - w / 2, top);
  noStroke();
}

/* 五角纸星 */
function drawStar(x, y, r, rot = 0, fillCol = C.gold, o = {}) {
  const { blur = 12, dy = 6, a = 0.2, points = 5, inner = 0.44 } = o;
  shOn(blur, dy, a);
  fill(fillCol); noStroke();
  beginShape();
  for (let i = 0; i < points * 2; i++) {
    const ang = rot + (i / (points * 2)) * TWO_PI - HALF_PI;
    const rad = i % 2 === 0 ? r : r * inner;
    vertex(x + Math.cos(ang) * rad, y + Math.sin(ang) * rad);
  }
  endShape(CLOSE);
  shOff();
  noFill(); stroke(255, 255, 255, 90); strokeWeight(1.2);
  beginShape();
  for (let i = 0; i < points * 2; i++) {
    const ang = rot + (i / (points * 2)) * TWO_PI - HALF_PI;
    const rad = i % 2 === 0 ? r : r * inner;
    vertex(x + Math.cos(ang) * rad, y + Math.sin(ang) * rad);
  }
  endShape(CLOSE);
  noStroke();
}


/* 折纸鹤：flap = 翅膀开合 */
function drawCrane(x, y, s, rot, flap, col = '#FFFDF4') {
  push(); translate(x, y); rotate(rot); scale(s);
  const f = 0.45 + 0.55 * flap;
  shOn(10, 5, 0.16);
  // 翅膀（先画，藏在身体后）
  fill(lerpColor(color(col), color('#E7D6B8'), 0.30)); noStroke();
  beginShape();
  vertex(-4, -2); vertex(-16 * f, -34 * f); vertex(-2, -6); vertex(10 * f, -26 * f); vertex(8, -1);
  endShape(CLOSE);
  fill(lerpColor(color(col), color('#D6C2A0'), 0.42));
  beginShape();
  vertex(-4, 0); vertex(-20 * f, 26 * f); vertex(-4, 4); vertex(8 * f, 20 * f); vertex(8, 1);
  endShape(CLOSE);
  shOff();
  // 身体
  shOn(8, 4, 0.14);
  fill(col); noStroke();
  beginShape();
  vertex(-12, 0); vertex(-2, -6); vertex(10, -4); vertex(13, -9); vertex(15, -1); vertex(11, 4); vertex(-2, 5);
  endShape(CLOSE);
  shOff();
  // 折痕
  stroke(150, 128, 100, 80); strokeWeight(1);
  line(-2, -4, 12, -4); line(-2, 3, 10, 3);
  noStroke();
  pop();
}

/* 纸花：pop 0..1 */
function drawFlower(x, y, s, grow, col = C.coral, mono = false) {
  const p = easeOutBack(grow);
  if (p <= 0.01) return;
  const stemC = mono ? '#AFA89C' : C.greenDeep;
  const leafC = mono ? '#C3BCB0' : C.green;
  push(); translate(x, y); scale(p);
  // 茎
  noFill(); stroke(stemC); strokeWeight(3.5 * s);
  bezier(0, 0, -3 * s, -22 * s, 4 * s, -44 * s, 0, -58 * s);
  noStroke();
  // 叶
  fill(leafC); noStroke();
  push(); translate(-2 * s, -30 * s); rotate(-0.5); ellipse(-8 * s, 0, 18 * s, 8 * s); pop();
  push(); translate(2 * s, -42 * s); rotate(0.4); ellipse(8 * s, 0, 16 * s, 7 * s); pop();
  // 花瓣
  const n = 6;
  shOn(10, 5, 0.18);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TWO_PI;
    if (mono) fill(i % 2 ? '#CFC8BC' : '#DED8CD');
    else fill(i % 2 ? col : lerpColor(color(col), color(255), 0.22).toString());
    ellipse(Math.cos(a) * 11 * s, -58 * s + Math.sin(a) * 11 * s, 17 * s, 15 * s);
  }
  fill(mono ? '#B6AEA2' : C.goldDeep); ellipse(0, -58 * s, 10 * s, 10 * s);
  shOff();
  pop();
}

/* 纸海浪：一行一行的纸带 */
function drawWaveRow(y, w, amp, phase, col, alpha = 255) {
  push();
  drawingContext.globalAlpha = alpha / 255;
  shOn(10, 6, 0.14);
  fill(col); noStroke();
  beginShape();
  vertex(-w / 2, y + amp + 40);
  for (let x = -w / 2; x <= w / 2; x += 18) {
    const yy = y + Math.sin((x / w) * TWO_PI * 1.4 + phase) * amp;
    vertex(x, yy);
  }
  vertex(w / 2, y + amp + 40);
  endShape(CLOSE);
  shOff();
  // 浪尖白边
  noFill(); stroke(255, 255, 255, 120); strokeWeight(1.8);
  beginShape();
  for (let x = -w / 2; x <= w / 2; x += 18) {
    vertex(x, y + Math.sin((x / w) * TWO_PI * 1.4 + phase) * amp);
  }
  endShape();
  noStroke();
  drawingContext.globalAlpha = 1;
  pop();
}

/* 纸船 */
function drawBoat(x, y, s, rock = 0) {
  push(); translate(x, y); rotate(rock); scale(s);
  shOn(14, 8, 0.22);
  fill(C.paper); noStroke();
  beginShape();
  vertex(-58, 0); vertex(58, 0); vertex(38, 26); vertex(-38, 26);
  endShape(CLOSE);
  shOff();
  // 船身折痕
  stroke(C.paperEdge); strokeWeight(2); line(-58, 0, 58, 0); noStroke();
  // 帆
  shOn(12, 6, 0.18);
  fill('#FFFDF4'); noStroke();
  beginShape(); vertex(0, -6); vertex(0, -74); vertex(40, -6); endShape(CLOSE);
  beginShape(); vertex(-4, -6); vertex(-4, -62); vertex(-34, -6); endShape(CLOSE);
  shOff();
  stroke(C.paperEdge); strokeWeight(1.6); line(0, -76, 0, -4); noStroke();
  pop();
}

/* 纸杯 */
function drawCup(x, y, s, flip = 1, col = '#F6E7D2') {
  push(); translate(x, y); scale(s, s * flip);
  shOn(12, 6, 0.2);
  fill(col); noStroke();
  beginShape();
  vertex(-26, -34); vertex(26, -34); vertex(18, 34); vertex(-18, 34);
  endShape(CLOSE);
  shOff();
  stroke(180, 160, 135, 120); strokeWeight(1.5);
  line(-26, -34, 26, -34);
  noStroke();
  pop();
}

/* 钟面 */
function drawClock(x, y, r, handRot, minuteRot, col = C.paper, tickCol = null) {
  shOn(16, 9, 0.22);
  fill(col); noStroke(); ellipse(x, y, r * 2, r * 2);
  shOff();
  noFill(); stroke(120, 95, 70, 70); strokeWeight(3); ellipse(x, y, r * 2 - 6, r * 2 - 6);
  const tc = tickCol || 'rgba(90,72,58,0.55)';
  stroke(tc); strokeWeight(2.5);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TWO_PI;
    line(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82, x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9);
  }
  // 时针
  stroke('#6A4B3C'); strokeWeight(6); strokeCap(ROUND);
  line(x, y, x + Math.cos(handRot) * r * 0.44, y + Math.sin(handRot) * r * 0.44);
  stroke('#C2574E'); strokeWeight(4);
  line(x, y, x + Math.cos(minuteRot) * r * 0.68, y + Math.sin(minuteRot) * r * 0.68);
  noStroke(); fill('#6A4B3C'); ellipse(x, y, 9, 9);
  strokeCap(SQUARE);
}

/* 一张飘起来的小书页（翻页用） */
function drawSheet(x, y, w, h, rot, alpha, tint = C.paper) {
  push();
  translate(x, y); rotate(rot);
  drawingContext.globalAlpha = alpha;
  shOn(18, 10, 0.24);
  fill(tint); noStroke(); rect(-w / 2, -h / 2, w, h, 4);
  shOff();
  stroke(190, 170, 145, 70); strokeWeight(1.4); line(-w / 2 + 8, h / 2 - 8, w / 2 - 8, h / 2 - 8); noStroke();
  drawingContext.globalAlpha = 1;
  pop();
}

/* 纸屑 */
function confetti(t, n, w, h, seed = 7, cols = null) {
  const r = mulberry32(seed);
  const palette = cols || [C.gold, C.coral, C.blue, C.green, C.blush];
  for (let i = 0; i < n; i++) {
    const x0 = (r() - 0.5) * w;
    const sp = 30 + r() * 90;
    const sway = Math.sin(t * (0.8 + r()) + i) * 22;
    const y = -h / 2 + ((r() * h + t * sp) % (h + 60)) - 20;
    const sz = 6 + r() * 8;
    push(); translate(x0 + sway, y); rotate(t * (0.6 + r()) + i);
    fill(fa(palette[i % palette.length], 210)); noStroke();
    rect(-sz / 2, -sz / 2, sz, sz * (0.5 + r() * 0.6), 1.5);
    pop();
  }
}

/* 水彩晕染块 */
function wash(x, y, w, h, col, alpha = 30) {
  push();
  const ctx = drawingContext;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, w / 2, h / 2, 0, 0, TWO_PI);
  ctx.clip();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TWO_PI;
    const cc = color(col);
    cc.setAlpha(Math.min(255, alpha * 1.7 * (0.45 + 0.55 * ((i * 13) % 7) / 7)));
    fill(cc);
    noStroke();
    ellipse(x + Math.cos(a) * w * 0.16, y + Math.sin(a) * h * 0.16, w * (0.5 + 0.14 * i), h * (0.5 + 0.1 * (i % 3)));
  }
  ctx.restore();
  pop();
}

/* 爱心 */
function drawHeart(x, y, s, col = C.red, alpha = 255) {
  push();
  translate(x, y); scale(s);
  drawingContext.globalAlpha = alpha / 255;
  shOn(10, 5, 0.18);
  fill(col); noStroke();
  beginShape();
  vertex(0, 12);
  bezierVertex(-20, -4, -14, -20, 0, -9);
  bezierVertex(14, -20, 20, -4, 0, 12);
  endShape(CLOSE);
  shOff();
  drawingContext.globalAlpha = 1;
  pop();
}

/* 纸标签（关键词小吊牌） */
function drawTag(x, y, rot, text, s = 1) {
  push(); translate(x, y); rotate(rot); scale(s);
  shOn(14, 8, 0.22);
  fill('#F7EBD6'); noStroke(); rect(-52, -20, 104, 40, 8);
  shOff();
  fill(C.ink); noStroke();
  textFont(FONT_S); textSize(21); textAlign(CENTER, CENTER);
  text(text, 0, 1);
  noFill(); stroke(160, 130, 100, 90); strokeWeight(1.4);
  line(-52, 0, -64, 0);
  noStroke();
  pop();
}
