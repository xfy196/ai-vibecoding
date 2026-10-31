/* =========================================================
   分镜 续：S10 - S18 + 调度
   ========================================================= */

/* =========================================================
   S10 现实 · 纸船与立起的海浪
   ========================================================= */
function sceneBoat(lt, dur, t) {
  // 天空
  paperPoly([[ART_L, ART_T], [ART_R, ART_T], [ART_R, FLOOR + 160], [ART_L, FLOOR + 160]], '#E9EEEC', { blur: 0, dy: 0, a: 0, edge: false, line: false });
  wash(0, -210, 1000, 320, '#C6D6DE', 30);
  wash(-260, -120, 520, 260, '#E3D6C4', 24);

  // 云
  for (let i = 0; i < 3; i++) {
    const cx = -380 + i * 380 + Math.sin(lt * 0.45 + i) * 16;
    const cy = -238 + (i % 2) * 34;
    paperEllipse(cx, cy, 150, 54, '#FBFAF4', { blur: 18, dy: 6, a: 0.14 });
    paperEllipse(cx + 54, cy + 12, 100, 42, '#FBFAF4', { blur: 14, dy: 5, a: 0.12 });
    paperEllipse(cx - 58, cy + 14, 92, 38, '#FBFAF4', { blur: 14, dy: 5, a: 0.12 });
  }

  // 一排排立起的海浪（一拍一排，越高越深）
  const rows = [
    { y: FLOOR - 74, col: '#A9C6D6', amp: 13, crest: 0.9 },
    { y: FLOOR - 26, col: '#8FB0C4', amp: 15, crest: 1.0 },
    { y: FLOOR + 24, col: '#6E92B7', amp: 17, crest: 1.15 },
    { y: FLOOR + 76, col: '#54779B', amp: 15, crest: 1.3 }
  ];
  rows.forEach((row, i) => {
    const t0 = beatAt(34.05, i) - 34.05;
    const p = easeOutBack(clamp01((lt - t0) / 0.34));
    push(); translate(0, (1 - p) * 190);
    drawingContext.globalAlpha = clamp01(p);
    // 浪体
    paperPoly([[ART_L, row.y + 20], [ART_R, row.y + 20], [ART_R, row.y + 150], [ART_L, row.y + 150]], row.col, { blur: 12, dy: 6, a: 0.16, line: false });
    // 浪尖（立起来的纸）
    for (let x = ART_L + 40; x < ART_R; x += 150) {
      const hh = 42 * row.crest * (0.7 + 0.5 * pulse(t));
      paperPoly([[x - 70, row.y + 22], [x - 20, row.y + 22 - hh], [x + 30, row.y + 22], [x + 80, row.y + 22 - hh * 0.7], [x + 130, row.y + 22]], row.col, { blur: 10, dy: 5, a: 0.14, edge: false });
    }
    drawingContext.globalAlpha = 1;
    pop();
  });

  // 船
  const rock = Math.sin(lt * 2.2) * 0.04;
  const bob = Math.sin(lt * 2.2) * 7;
  push(); translate(0, FLOOR + 44 + bob); rotate(rock); scale(1.5);
  // 帆（在人物后面）
  shOn(14, 7, 0.2);
  fill('#FFFDF4'); noStroke();
  beginShape(); vertex(2, -8); vertex(2, -96); vertex(56, -8); endShape(CLOSE);
  beginShape(); vertex(-4, -8); vertex(-4, -78); vertex(-44, -8); endShape(CLOSE);
  shOff();
  stroke(198, 175, 140, 150); strokeWeight(2); line(0, -100, 0, -6); noStroke();
  // 人物（站在船里）
  drawKid(-16, -10, 0.62, { girl: true, expr: 'sad', armL: 0.8, armR: -0.8, headTilt: -0.06 });
  drawKid(18, -10, 0.58, { girl: false, expr: 'smile', armL: -0.7, armR: 0.7 });
  // 船身（盖住下半身）
  shOn(16, 8, 0.24);
  fill('#FBF4E4'); noStroke();
  beginShape();
  vertex(-80, -12); vertex(80, -12); vertex(52, 32); vertex(-52, 32);
  endShape(CLOSE);
  shOff();
  stroke(198, 175, 140, 170); strokeWeight(1.8);
  line(-80, -12, 80, -12);
  noStroke();
  fill('#EEE2CB'); rect(-50, 12, 100, 20, 2);
  pop();

  // 雨丝
  stroke(255, 255, 255, 110); strokeWeight(2);
  for (let i = 0; i < 16; i++) {
    const x = -560 + ((i * 211) % 1120);
    const y = ((lt * 190 + i * 71) % 430) - 280;
    line(x, y, x - 5, y + 22);
  }
  noStroke();
}

/* =========================================================
   S11 人海 · 回忆书页快翻
   ========================================================= */
function sceneFlip(lt, dur, t) {
  wash(0, -40, 1000, 440, '#EFDCC2', 30);
  stageBase('#F4E7D2', 150);

  // 背后堆叠的旧页
  for (let i = 5; i >= 1; i--) {
    push(); translate(-i * 8, -i * 6);
    paperRect(0, -50, 880, 320, 6, i % 2 ? '#F7EDDB' : '#F1E4CE', { blur: 10, dy: 6, a: 0.12 });
    pop();
  }

  // 快翻的纸页：从右往左连续掠过
  const N = 5;
  for (let k = 0; k < N; k++) {
    const ph = (lt * 1.75 + k / N) % 1;
    const x = lerp(640, -640, ph);
    const sq = Math.cos(ph * Math.PI);         // 翻页透视
    const w = 470 * Math.max(0.10, Math.abs(sq));
    const h = 330;
    push(); translate(x, -50);
    // 纸页（带头部弯曲）
    shOn(20, 9, 0.24);
    fill(k % 2 ? '#FBF3E1' : '#F6EBD8'); noStroke();
    beginShape();
    vertex(-w / 2, -h / 2);
    vertex(w / 2, -h / 2 + 14 * sq);
    vertex(w / 2 + 12 * sq, 0);
    vertex(w / 2, h / 2 - 14 * sq);
    vertex(-w / 2, h / 2);
    endShape(CLOSE);
    shOff();
    // 页上的小回忆（一起被压扁）
    if (Math.abs(sq) > 0.35) {
      push(); scale(Math.abs(sq), 1);
      const cols = ['#E9A0A0', '#8FB0C4', '#E0C48A', '#9FB99F', '#D8B7D8'];
      fill(cols[k % 5]); noStroke(); ellipse(0, 6, 180, 110);
      fill('#FBF3E1'); ellipse(0, -34, 230, 78);
      fill('#EFDCC2'); ellipse(0, 62, 300, 40);
      fill(255, 255, 255, 120); ellipse(-40, -4, 42, 30);
      pop();
    }
    // 折痕
    stroke(190, 170, 140, 60); strokeWeight(1.4);
    line(-w / 2 + 10, h / 6, w / 2 - 10, h / 6);
    noStroke();
    pop();
  }

  // 风线
  stroke(255, 255, 255, 120); strokeWeight(2);
  for (let i = 0; i < 6; i++) {
    const y = -240 + i * 62;
    const x = ((lt * 1100 + i * 260) % 1300) - 650;
    line(x, y, x + 110, y - 10);
  }
  noStroke();

  drawKid(-30, FLOOR + 6, 0.76, { girl: true, expr: 'smile', headTilt: 0.08, armL: 1.15, armR: -1.15 });
  drawKid(66, FLOOR + 6, 0.72, { girl: false, expr: 'smile', armL: -1.0, armR: 1.0 });
}

/* =========================================================
   S12 尘埃 · 铅笔画被涂灰
   ========================================================= */
function pencilGround() {
  fill('#DCD6CA'); noStroke();
  rect(ART_L, ART_T, ART_R - ART_L, ART_B - ART_T);
  // 灰调块面
  const r0 = mulberry32(3);
  for (let i = 0; i < 7; i++) {
    fill(120, 114, 104, 14);
    ellipse(ART_L + r0() * 1200, ART_T + r0() * 420, 240 + r0() * 260, 160 + r0() * 160);
  }
  // 排线
  stroke(120, 112, 100, 40); strokeWeight(1.3);
  for (let i = -760; i < 760; i += 11) line(i, ART_T, i + 280, ART_B);
  stroke(120, 112, 100, 24); strokeWeight(1.1);
  for (let i = -760; i < 760; i += 17) line(i, ART_B, i + 300, ART_T);
  noStroke();
  // 纸边
  noFill(); stroke(110, 102, 92, 55); strokeWeight(2);
  rect(ART_L + 26, ART_T + 26, ART_R - ART_L - 52, ART_B - ART_T - 52, 4);
  noStroke();
}

function scenePencil(lt, dur, t) {
  pencilGround();
  // 擦除前的彩色残影
  const ghost = clamp01(1 - lt / 1.2);
  if (ghost > 0) {
    push(); drawingContext.globalAlpha = ghost * 0.6;
    wash(-140, -40, 640, 380, '#F3B7AC', 40);
    wash(240, -80, 540, 320, '#BFD3E4', 34);
    pop();
  }
  // 铅灰云
  const r = mulberry32(5);
  for (let i = 0; i < 12; i++) {
    fill(110, 105, 98, 18 + 12 * Math.sin(lt * 1.4 + i));
    noStroke();
    ellipse(-500 + r() * 1000, -260 + r() * 400, 120 + r() * 160, 80 + r() * 90);
  }

  drawKid(-70, FLOOR + 4, 0.92, { girl: true, pencil: true, expr: 'sad', headTilt: 0.1, armL: 0.9, armR: -0.9 });
  drawKid(56, FLOOR + 4, 0.86, { girl: false, pencil: true, expr: 'sad', armL: -0.5, armR: 0.5 });

  // 灰尘
  const r2 = mulberry32(17);
  for (let i = 0; i < 22; i++) {
    const x = -520 + r2() * 1040;
    const y = ((lt * 26 + r2() * 400) % 420) - 300;
    fill(90, 86, 80, 60); noStroke();
    ellipse(x, y, 3 + r2() * 3, 3 + r2() * 3);
  }
  // 铅笔躺在页面底部
  push(); translate(-360, FLOOR + 66); rotate(-0.05);
  fill('#E0B975'); noStroke(); rect(-96, -8, 192, 16, 3);
  fill('#C08F4E'); triangle(96, -8, 96, 8, 126, 0);
  fill('#4E4C49'); triangle(120, -3.6, 120, 3.6, 130, 0);
  fill('#D8A9A2'); rect(-106, -8, 14, 16, 3);
  stroke(110, 90, 70, 60); strokeWeight(1.2); line(-96, 0, 96, 0); noStroke();
  pop();
}

/* =========================================================
   S13 盆栽 · 橡皮擦回彩色
   ========================================================= */
function eraserScene(mono, lt) {
  // 地面
  if (mono) {
    fill('#DCD6CA'); noStroke(); rect(ART_L, ART_T, ART_R - ART_L, ART_B - ART_T);
  } else {
    paperPoly([[ART_L, ART_T], [ART_R, ART_T], [ART_R, ART_B], [ART_L, ART_B]], '#FCF2DE', { blur: 0, dy: 0, a: 0, edge: false, line: false });
    wash(-80, -30, 940, 420, '#F7D7B6', 30);
    wash(320, -60, 620, 320, '#CFE0DC', 26);
    stageBase('#F4E3C8', 150);
  }

  // 盆栽
  push(); translate(286, FLOOR + 6);
  paperPoly([[-56, 0], [56, 0], [40, -78], [-40, -78]], mono ? '#DAD4C9' : '#D89B72', { blur: 14, dy: 8, a: 0.2, line: !mono });
  fill(mono ? '#C6BFB2' : C.greenDeep); noStroke(); ellipse(0, -80, 88, 16);
  const bloom = clamp01((lt - 0.4) / 0.9);
  drawFlower(0, FLOOR - 70, 1.25, bloom, '#E27B70', mono);
  drawFlower(-40, FLOOR - 52, 0.9, bloom * 0.9, '#F2BC50', mono);
  drawFlower(42, FLOOR - 56, 0.95, bloom * 0.85, '#E9A0C0', mono);
  pop();

  drawKid(-176, FLOOR + 6, 0.96, { girl: true, pencil: mono, expr: mono ? 'sad' : 'happy', armR: -2.2, headTilt: -0.1 });
  drawKid(-44, FLOOR + 6, 0.9, { girl: false, pencil: mono, expr: mono ? 'sad' : 'smile', armL: -0.9, armR: 0.9 });
}

function sceneEraser(lt, dur, t) {
  const sweep = lerp(-560, 700, easeInOut(clamp01(lt / dur * 1.05)));

  // 彩色层
  eraserScene(false, lt);

  // 铅笔层（sweep 右侧）
  const ctx = drawingContext;
  ctx.save();
  ctx.beginPath();
  ctx.rect(sweep, ART_T - 40, ART_R - sweep + 80, ART_B - ART_T + 120);
  ctx.clip();
  eraserScene(true, lt);
  // 擦除边缘的铅灰拖尾
  const gr = ctx.createLinearGradient(sweep - 40, 0, sweep + 26, 0);
  gr.addColorStop(0, 'rgba(150,142,130,0)');
  gr.addColorStop(1, 'rgba(150,142,130,0.35)');
  ctx.fillStyle = gr;
  ctx.fillRect(sweep - 40, ART_T, 66, ART_B - ART_T + 60);
  ctx.restore();

  // 橡皮
  push(); translate(sweep, FLOOR - 36); rotate(-0.14);
  scale(1.25 + pulse(t) * 0.04);
  shOn(22, 12, 0.3);
  fill('#F7E9EE'); noStroke(); rect(-56, -26, 112, 52, 10);
  shOff();
  fill('#E3BFC8'); rect(-56, 8, 112, 18, 8);
  fill(200, 140, 156); textFont(FONT_H); textSize(14); textAlign(CENTER, CENTER);
  text('ERASER', 0, -10);
  textAlign(LEFT, BASELINE);
  pop();

  // 橡皮屑
  for (let i = 0; i < 12; i++) {
    const r = mulberry32(i + 21);
    fill(206, 198, 188, 190); noStroke();
    ellipse(sweep - 50 - r() * 110, FLOOR - 16 + r() * 58, 5 + r() * 7, 4 + r() * 4);
  }
}

/* =========================================================
   S14 愉快 · 纸杯电话
   ========================================================= */
function sceneCup(lt, dur, t) {
  wash(0, -60, 1100, 440, '#F6DFC6', 24);
  stageBase('#F6EAD6', 150);

  const lx = -430, rx = 430, ly = FLOOR - 96, ry = FLOOR - 96;
  // 线（下垂）
  noFill(); stroke('#B08A66'); strokeWeight(3);
  beginShape();
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    const x = lerp(lx, rx, u);
    const sag = Math.sin(u * PI) * 92;
    curveVertex(x, lerp(ly, ry, u) + sag);
  }
  endShape();
  noStroke();

  // 顺着线跑的爱心
  for (let i = 0; i < 5; i++) {
    const u = ((lt * 0.42 + i * 0.2) % 1);
    const x = lerp(lx + 40, rx - 40, u);
    const sag = Math.sin(u * PI) * 82;
    const y = lerp(ly, ry, u) + sag - 6;
    const s = 0.8 + 0.3 * Math.sin(u * PI);
    drawHeart(x, y, s, i % 2 ? C.coral : C.red, 235);
    // 尾迹
    fill(226, 123, 112, 60); noStroke();
    ellipse(x - 22, y + 4, 12, 8);
  }

  drawCup(-470, FLOOR - 70, 1.15, 1, '#F6E1C6');
  drawCup(470, FLOOR - 70, 1.15, 1, '#F6E1C6');

  drawKid(-330, FLOOR + 6, 0.86, { girl: true, armL: 2.6, expr: 'happy', headTilt: -0.12 });
  drawKid(330, FLOOR + 6, 0.82, { girl: false, armR: -2.6, expr: 'happy', headTilt: 0.12 });
}

/* =========================================================
   S15 落日 · 烟花烧成灰又倒带开满
   ========================================================= */
function sceneAsh(lt, dur, t) {
  // 前段暖色黄昏，后段倒带
  const rewindStart = 1.55;
  const rw = lt > rewindStart;
  const bgCol = rw ? '#E9D9CB' : '#F5D9B2';
  paperPoly([[ART_L, ART_T], [ART_R, ART_T], [ART_R, ART_B], [ART_L, ART_B]], bgCol, { blur: 0, dy: 0, a: 0, edge: false });
  // 落日
  const sunY = rw ? -40 : FLOOR - 40 + (lt / rewindStart) * 70;
  paperEllipse(0, sunY, 260, 260, '#F2A15E', { blur: 30, dy: 0, a: 0.3 });
  fill('#F7C192'); noStroke(); rect(ART_L, FLOOR - 30, ART_R - ART_L, ART_B - FLOOR + 30);
  // 山
  paperPoly([[-600, FLOOR], [-380, FLOOR - 90], [-160, FLOOR], [90, FLOOR - 70], [330, FLOOR], [600, FLOOR - 80], [600, FLOOR + 60], [-600, FLOOR + 60]], '#D9A982', { blur: 14, dy: 4, a: 0.16 });

  // 烟花：正放燃烧 → 倒带重开
  const p1 = clamp01(lt / rewindStart);          // 0→1 燃烧殆尽
  const p2 = clamp01((lt - rewindStart) / (dur - rewindStart)); // 0→1 倒带重开
  const mainX = -40, mainY = -150;

  if (!rw) {
    drawFirework(mainX, mainY, 150 * (1.15 - p1 * 0.35), 0.35 + p1 * 0.6, 'gold', 1 - p1 * 0.25);
    // 灰烬下沉
    for (let i = 0; i < 26; i++) {
      const r = mulberry32(i + 61);
      const a = r() * TWO_PI;
      const d = 40 + r() * 150 * p1;
      fill(120, 112, 104, 150 * p1); noStroke();
      ellipse(mainX + Math.cos(a) * d, mainY + Math.sin(a) * d + p1 * 90, 4 + r() * 5, 3 + r() * 4);
    }
  } else {
    // 倒带：从灰烬 → 满开
    const back = 1 - easeOut(p2);
    drawFirework(mainX, mainY, 150, 0.95 - back * 0.6, 'gold', 1);
    // 灰烬上浮
    for (let i = 0; i < 26; i++) {
      const r = mulberry32(i + 61);
      const a = r() * TWO_PI;
      const d = 40 + r() * 150;
      fill(150, 142, 132, 120 * (1 - p2)); noStroke();
      ellipse(mainX + Math.cos(a) * d, mainY + Math.sin(a) * d + 90 * (1 - p2) - p2 * 60, 4 + r() * 5, 3 + r() * 4);
    }
    // 倒带标记
    push(); translate(470, -250);
    noFill(); stroke(180, 80, 70, 150); strokeWeight(3);
    arc(0, 0, 96, 96, -2.4 + lt * 4, 0.9 + lt * 4);
    noStroke();
    fill(180, 80, 70, 190); noStroke();
    triangle(-30, -14, -30, 10, -8, -2);
    triangle(-46, -14, -46, 10, -24, -2);
    pop();
  }

  // 小人
  const look = rw ? -1 : -1;
  drawKid(-210, FLOOR + 6, 0.8, { girl: true, look, expr: rw ? 'wow' : 'sad', headTilt: -0.08 });
  drawKid(-110, FLOOR + 6, 0.76, { girl: false, look, expr: rw ? 'wow' : 'sad' });
}

/* =========================================================
   S16 集邮 · 红线缠住她
   ========================================================= */
function sceneThread(lt, dur, t) {
  wash(0, -60, 1100, 460, '#F2D9CE', 26);
  stageBase('#F6E8D6', 150);

  const cx = 0, cy = FLOOR - 90;
  // 线轴
  push(); translate(-470, FLOOR - 10);
  shOn(14, 8, 0.2);
  fill('#E8C9A0'); noStroke(); rect(-30, -46, 60, 66, 8);
  shOff();
  fill(C.red); rect(-30, -34, 60, 42, 6);
  fill('#E8C9A0'); ellipse(0, -46, 60, 16); ellipse(0, 20, 60, 16);
  pop();

  // 红线圈数随拍增加，缠住她
  const loops = 1 + Math.floor(lt / 0.36);
  const total = 7;
  for (let i = 0; i < Math.min(loops, total); i++) {
    const grow = clamp01((lt - i * 0.36) / 0.45);
    const ry = 52 + i * 30;
    const rx = 104 + i * 10;
    noFill(); stroke(fa(C.red, 245)); strokeWeight(5.5);
    push(); translate(cx, cy + 58 - i * 12);
    beginShape();
    for (let a = 0; a <= 40; a++) {
      const ang = -HALF_PI + (a / 40) * TWO_PI * grow;
      curveVertex(Math.cos(ang) * rx, Math.sin(ang) * ry * 0.44 + Math.sin(ang * 2) * 6);
    }
    endShape();
    pop();
    // 线的高光
    push(); translate(cx, cy + 58 - i * 12);
    noFill(); stroke(255, 210, 200, 90); strokeWeight(1.8);
    beginShape();
    for (let a = 0; a <= 40; a++) {
      const ang = -HALF_PI + (a / 40) * TWO_PI * grow;
      curveVertex(Math.cos(ang) * rx - 1.5, Math.sin(ang) * ry * 0.44 - 2 + Math.sin(ang * 2) * 6);
    }
    endShape();
    pop();
  }
  // 线头甩向她
  noFill(); stroke(fa(C.red, 220)); strokeWeight(4);
  beginShape();
  const tail = clamp01(lt / 1.0);
  curveVertex(-442, FLOOR - 20);
  curveVertex(-330, FLOOR - 120 - 20 * tail);
  curveVertex(-160, cy + 20);
  curveVertex(cx - 60, cy + 10);
  endShape();
  noStroke();

  drawKid(cx, FLOOR + 4, 0.92, { girl: true, armL: 1.1, armR: -1.1, expr: 'wow', headTilt: 0.06 });
  // 蝴蝶结
  const bow = clamp01((lt - 1.9) / 0.6);
  if (bow > 0) {
    push(); translate(60, cy + 40); scale(bow);
    fill(C.red); noStroke();
    ellipse(-18, 0, 34, 26); ellipse(18, 0, 34, 26);
    fill(C.redDeep); ellipse(0, 0, 14, 14);
    pop();
  }
}

/* =========================================================
   S17 妖怪 · 两个钟面反着转
   ========================================================= */
function sceneClocks(lt, dur, t) {
  paperPoly([[ART_L, ART_T], [ART_R, ART_T], [ART_R, ART_B], [ART_L, ART_B]], C.night, { blur: 0, dy: 0, a: 0, edge: false });
  const r = mulberry32(31);
  for (let i = 0; i < 36; i++) {
    fill(255, 244, 214, 150 + 80 * Math.sin(lt * 2 + i)); noStroke();
    ellipse(-560 + r() * 1120, ART_T + r() * 420, 3, 3);
  }

  const c1x = -250, c2x = 250, cyy = -60, R = 132;
  drawClock(c1x, cyy, R, -HALF_PI + lt * 2.4, -HALF_PI + lt * 6.2, '#FBF2DF');
  drawClock(c2x, cyy, R, -HALF_PI - lt * 2.4, -HALF_PI - lt * 6.2, '#FBF2DF');

  // 连接两钟的虚线
  stroke(255, 255, 255, 70); strokeWeight(2);
  for (let x = c1x + R; x < c2x - R; x += 16) line(x, cyy, x + 8, cyy);
  noStroke();

  // 可爱小妖怪
  const peek = clamp01((lt - 0.6) / 0.5);
  if (peek > 0) {
    push(); translate(150, FLOOR + 30 - peek * 90);
    fill('#8FB59A'); noStroke(); ellipse(0, 0, 120, 110);
    fill('#FBF2DF'); ellipse(-26, -8, 26, 30); ellipse(26, -8, 26, 30);
    fill('#3B2E28'); ellipse(-26, -6, 12, 16); ellipse(26, -6, 12, 16);
    fill('#8FB59A'); triangle(-50, -44, -30, -66, -16, -42); triangle(50, -44, 30, -66, 16, -42);
    fill('#6E9679'); ellipse(0, 34, 34, 18);
    pop();
  }

  drawKid(-90, FLOOR + 10, 0.66, { girl: true, expr: 'wow', armR: -1.6, headTilt: -0.14, look: -1 });
  drawKid(0, FLOOR + 10, 0.62, { girl: false, expr: 'wow', armL: -1.4, headTilt: 0.12, look: -1 });
}

/* =========================================================
   S18 心不在焉 · 上色 → 牵手
   （合书 / 礼物由 core 负责）
   ========================================================= */
function sceneEnding(lt, dur, t) {
  wash(0, -30, 1000, 460, '#FBE7C8', 34);
  wash(-260, -60, 560, 320, '#F6C9B4', 26);
  stageBase('#FBF0DA', 150);

  const colorP = clamp01(lt / 0.66);
  const holdP = clamp01((lt - 0.55) / 0.42);
  const SC = 1.08;

  const girlX = lerp(-138, -64, holdP);
  const boyX = lerp(126, 66, holdP);

  // 纸调色盘
  push(); translate(-330, FLOOR - 6);
  paperEllipse(0, 0, 150, 62, '#F3E3C6', { blur: 14, dy: 6, a: 0.2 });
  const dabs = [['#E27B70', -44, -4], ['#8FB0C4', -12, -10], ['#F2BC50', 18, -6], ['#8FB59A', 46, -2]];
  dabs.forEach((d) => { fill(d[0]); noStroke(); ellipse(d[1], d[2], 26, 18); });
  pop();

  // 他：白纸 → 被上色（左半边上色，右半边仍是白纸）
  push();
  drawKid(boyX, FLOOR + 6, SC, { girl: false, expr: 'smile', headTilt: 0.05, armL: lerp(-0.5, 1.42, holdP), armR: 0.6, colorAmt: 0 });
  if (colorP > 0.01) {
    const ctx = drawingContext;
    const px = boyX - 132 + 268 * colorP;
    ctx.save();
    ctx.beginPath();
    ctx.rect(boyX - 200, -260, px - (boyX - 200), 480);
    ctx.clip();
    drawKid(boyX, FLOOR + 6, SC, { girl: false, expr: 'smile', headTilt: 0.05, armL: lerp(-0.5, 1.42, holdP), armR: 0.6, colorAmt: 1 });
    ctx.restore();
    // 上色的水彩边
    if (colorP < 1) {
      const gg = ctx.createLinearGradient(px - 26, 0, px + 8, 0);
      gg.addColorStop(0, 'rgba(238,168,140,0)');
      gg.addColorStop(1, 'rgba(238,168,140,0.35)');
      ctx.fillStyle = gg;
      ctx.fillRect(px - 26, -230, 34, 300);
    }
  }
  pop();

  // 她（画师）
  drawKid(girlX, FLOOR + 6, SC, {
    girl: true, expr: 'happy', headTilt: -0.08,
    armR: lerp(-1.9, -1.44, holdP), armL: lerp(1.0, 0.8, holdP)
  });

  // 画笔
  if (colorP < 1) {
    const bx = boyX - 132 + 268 * colorP - 6;
    const by = FLOOR - 96 + Math.sin(colorP * PI) * 40;
    push(); translate(bx, by); rotate(-0.72);
    fill('#E7C27E'); noStroke(); rect(-46, -4, 92, 9, 3);
    fill('#C2574E'); rect(-54, -5, 16, 11, 4);
    fill('#5C5A56'); triangle(46, -4.5, 46, 4.5, 62, 0);
    fill('#E27B70'); ellipse(64, 0, 9, 9);
    pop();
  }

  // 擦出的纸屑 / 彩点
  const r = mulberry32(83);
  for (let i = 0; i < 12; i++) {
    const px = boyX - 130 + r() * 260;
    const py = FLOOR - 190 + r() * 230;
    fill(fa(['#E27B70', '#8FB0C4', '#F2BC50', '#8FB59A'][i % 4], 120));
    noStroke();
    ellipse(px, py, 4 + r() * 5, 4 + r() * 5);
  }

  // 牵手：指尖的心
  if (holdP > 0.3) {
    const hp = clamp01((holdP - 0.3) / 0.7);
    push(); translate(4, FLOOR - 66 - hp * 30); scale(1 + 0.1 * pulse(t));
    drawHeart(0, 0, 1.6 * hp, C.coral, 240 * hp);
    pop();
  }

  confetti(lt, 16, 1000, 460, 71, ['#F3B7AC', '#F6D98F', '#FFF3DC']);
}

/* =========================================================
   调度
   ========================================================= */
const SCENE_FN = {
  fireworks: sceneFireworks,
  collect: sceneCollect,
  tears: sceneTears,
  birds: sceneBirds,
  towers: sceneTowers,
  towerClose: sceneTowerClose,
  starwall: sceneStarwall,
  light: sceneLight,
  flowers: sceneFlowers,
  boat: sceneBoat,
  flip: sceneFlip,
  pencil: scenePencil,
  eraser: sceneEraser,
  cup: sceneCup,
  ash: sceneAsh,
  thread: sceneThread,
  clocks: sceneClocks,
  ending: sceneEnding
};

function drawScene(id, lt, dur, t) {
  const fn = SCENE_FN[id];
  if (!fn) return;
  push();
  // 场景整体入场：纸片抬起
  const inP = clamp01(lt / 0.34);
  const lift = (1 - easeOut(inP)) * 26;
  translate(0, lift);
  translate(0, 34);
  scale(1.2);
  translate(0, -34);
  fn(lt, dur, t);
  drawGarland(t, id);
  pop();
}

/* 页面顶部的纸挂饰：随鼓点弹动 */
function drawGarland(t, seedStr) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) % 9973;
  const r = mulberry32(seed + 5);
  const y0 = -286;
  const n = 11;
  const xs = [];
  for (let i = 0; i < n; i++) xs.push(-540 + i * 108 + (r() - 0.5) * 12);
  // 绳
  noFill(); stroke(150, 120, 88, 120); strokeWeight(2.2);
  beginShape();
  for (let i = 0; i < n; i++) curveVertex(xs[i], y0 + Math.sin((i / (n - 1)) * PI) * 26);
  endShape();
  noStroke();
  const pal = ['#E27B70', '#F2BC50', '#6E92B7', '#8FB59A', '#E9A0C0'];
  for (let i = 0; i < n; i++) {
    const bx = xs[i];
    const by = y0 + Math.sin((i / (n - 1)) * PI) * 26;
    const ph = ((t - BEAT.t0) / BEAT.dur - i * 0.16);
    const k = Math.exp(-(ph - Math.floor(ph)) * 5);
    const dy = k * 9;
    const rot = Math.sin(t * 2 + i) * 0.06;
    push(); translate(bx, by + 22 + dy); rotate(rot);
    shOn(10, 5, 0.18);
    const type = (seed + i) % 4;
    const c = pal[i % pal.length];
    if (type === 0) { fill(c); noStroke(); beginShape(); vertex(0, 9); bezierVertex(-15, -3, -6, -14, 0, -6); bezierVertex(6, -14, 15, -3, 0, 9); endShape(CLOSE); }
    else if (type === 1) { drawStar(0, 0, 10, t * 0.5 + i, c, { blur: 8, dy: 4, a: 0.16 }); }
    else if (type === 2) { fill(c); noStroke(); ellipse(0, 0, 20, 20); }
    else { fill(c); noStroke(); beginShape(); vertex(-9, -7); vertex(9, -7); vertex(0, 10); endShape(CLOSE); }
    shOff();
    pop();
  }
}
