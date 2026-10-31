/* =========================================================
   分镜：18 个纸艺场景
   页面局部坐标：x ∈ [-600, 600]，y ∈ [-340, 340]
   地面线 y = 110，歌词印在 y ≈ 262
   ========================================================= */

const FLOOR = 110;
const ART_L = -600, ART_R = 600, ART_T = -336, ART_B = 190;

function beatPhase(t) {
  const k = (t - BEAT.t0) / BEAT.dur;
  return k - Math.floor(k);
}
function pulse(t, decay = 5.5) {
  return Math.exp(-beatPhase(t) * decay);
}
function beatIndex(t) {
  return Math.floor((t - BEAT.t0) / BEAT.dur);
}
// 场景内第 i 拍开始的时间（绝对秒）
function beatAt(t0, i) {
  return BEAT.t0 + Math.ceil((t0 - BEAT.t0) / BEAT.dur + 0.001) * BEAT.dur + i * BEAT.dur;
}

/* ---------------- 通用：纸舞台 ---------------- */
function stageBase(col = '#EFDCBE', h = 92) {
  paperPoly(
    [[ART_L, FLOOR + 6], [ART_R, FLOOR + 6], [ART_R, FLOOR + h], [ART_L, FLOOR + h]],
    col, { blur: 16, dy: 6, a: 0.2, edge: false }
  );
  // 舞台前沿的纸齿
  noStroke();
  for (let x = ART_L + 20; x < ART_R; x += 40) {
    fill(255, 250, 236, 60);
    triangle(x, FLOOR + 8, x + 20, FLOOR + 8, x + 10, FLOOR + 30);
    fill(120, 90, 62, 26);
    triangle(x + 10, FLOOR + 30, x + 20, FLOOR + 8, x + 30, FLOOR + 30);
  }
  // 地面前沿：纸的厚度
  noStroke();
  fill(lerpColor(color(col), color(96, 70, 48), 0.34));
  rect(ART_L, FLOOR + h, ART_R - ART_L, 14);
  fill(lerpColor(color(col), color(96, 70, 48), 0.12));
  rect(ART_L, FLOOR + h - 4, ART_R - ART_L, 5);
}

/* =========================================================
   S1 回忆 · 四朵纸烟花接连炸开
   ========================================================= */
function sceneFireworks(lt, dur, t) {
  wash(-260, -60, 620, 420, '#F7C9A8', 26);
  wash(320, -110, 520, 360, '#F6D98F', 22);
  stageBase('#F7EBD8', 150);

  const cues = [0.0, 0.62, 1.24, 1.86];
  const pos = [[-330, -140], [-60, -205], [235, -150], [450, -175]];
  const hues = ['gold', 'coral', 'blue', 'gold'];
  for (let i = 0; i < 4; i++) {
    const p = (lt - cues[i]) / 0.92;
    if (p > 0 && p < 1.2) {
      const kick = 1 + 0.08 * (1 - clamp01(p * 2));
      drawFirework(pos[i][0], pos[i][1], 128 * kick, clamp01(p), hues[i], 1);
    }
  }
  confetti(lt, 26, 1180, 520, 11, ['#F2BC50', '#E27B70', '#6E92B7', '#F5B6AC', '#FFF3DC']);

  // 半开的书页立片（开场书页翘起）
  const openP = easeOut(lt / 0.5);
  push(); translate(-520, FLOOR + 10); rotate(-0.25 + 0.1 * (1 - openP)); scale(openP);
  paperPoly([[0, 0], [180, -14], [186, 120], [4, 116]], '#FBF1DE', { blur: 16, dy: 6, a: 0.2 });
  pop();
  push(); translate(520, FLOOR + 10); rotate(0.25 - 0.1 * (1 - openP)); scale(openP);
  paperPoly([[0, 0], [-180, -14], [-186, 120], [-4, 116]], '#FBF1DE', { blur: 16, dy: 6, a: 0.2 });
  pop();

  const bob = pulse(t) * 6;
  drawKid(-120, FLOOR + 8 - bob * 0.4, 0.86, { girl: true, armR: -2.5, headTilt: -0.12, expr: 'happy' });
  drawKid(-4, FLOOR + 8, 0.82, { girl: false, armL: 0.9, armR: -0.9, headTilt: 0.1, expr: 'wow', look: -1 });
}

/* =========================================================
   S2 收集 · 碎片被收进书页
   ========================================================= */
function sceneCollect(lt, dur, t) {
  wash(0, -40, 900, 460, '#F3D6B4', 22);
  stageBase('#F7EBD6', 150);

  const p = easeInOut(lt / 1.7);
  // 纸盒子（回忆收纳盒）
  shOn(18, 9, 0.24);
  fill('#EBD6B4'); noStroke();
  beginShape();
  vertex(-150, FLOOR + 4); vertex(150, FLOOR + 4); vertex(130, FLOOR - 88); vertex(-130, FLOOR - 88);
  endShape(CLOSE);
  shOff();
  fill('#DCC29C'); rect(-150, FLOOR - 4, 300, 12, 3);

  // 飞进来的碎片
  const r = mulberry32(42);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TWO_PI + r() * 0.5;
    const d0 = 320 + r() * 260;
    const d = lerp(d0, 26, clamp01(p * (0.8 + r() * 0.5)));
    const px = Math.cos(a) * d;
    const py = Math.sin(a) * d * 0.62 - 40 + Math.sin(lt * 2 + i) * 6;
    const sz = 20 + r() * 16;
    push(); translate(px, py); rotate(lt * (0.6 + r()) + i);
    shOn(10, 5, 0.18);
    fill(['#F6DCA8', '#F3B7AC', '#BFD3E4', '#D8E4C8', '#FBF1DE'][i % 5]); noStroke();
    rect(-sz / 2, -sz / 2, sz, sz, 3);
    shOff();
    pop();
  }
  // 盒中微光
  fill(255, 236, 190, 90 + 40 * Math.sin(lt * 4)); noStroke();
  ellipse(0, FLOOR - 96, 210, 56);

  drawKid(-262, FLOOR + 8, 0.84, { girl: true, armL: 1.15, armR: -1.2, expr: 'smile', headTilt: 0.08 });
  drawKid(268, FLOOR + 8, 0.8, { girl: false, armL: 1.05, armR: -1.5, expr: 'smile' });
}

/* =========================================================
   S3 哭泣 · 纸泪滴
   ========================================================= */
function sceneTears(lt, dur, t) {
  wash(0, -60, 1000, 460, '#C9DCEA', 24);
  stageBase('#EDF1F2', 150);

  // 雨丝
  stroke(140, 170, 200, 60); strokeWeight(2);
  for (let i = 0; i < 26; i++) {
    const x = -580 + ((i * 137) % 1160);
    const y = ((lt * 130 + i * 53) % 420) - 320;
    line(x, y, x - 6, y + 26);
  }
  noStroke();

  // 水洼
  paperEllipse(20, FLOOR + 8, 380, 44, '#CFDFE8', { blur: 12, dy: 0, a: 0.18 });

  drawKid(-40, FLOOR + 6, 1.12, { girl: true, headTilt: 0.16, armL: 0.9, armR: -0.9, expr: 'sad', look: 1 });

  // 泪滴
  for (let i = 0; i < 2; i++) {
    for (let k = 0; k < 3; k++) {
      const gp = ((lt * 0.85 + k * 0.34 + i * 0.16) % 1);
      const y = -196 + gp * 250;
      const x = -40 + (i === 0 ? -18 : 18) + Math.sin(gp * 6 + i) * 5;
      const s = 6 + gp * 4;
      push(); translate(x, y);
      shOn(6, 3, 0.14, '80,110,140');
      fill('#A9C8DE'); noStroke();
      beginShape();
      vertex(0, -s * 1.6); bezierVertex(s, -s * 0.2, s * 0.8, s, 0, s);
      bezierVertex(-s * 0.8, s, -s, -s * 0.2, 0, -s * 1.6);
      endShape(CLOSE);
      shOff(); pop();
    }
  }
  // 纸伞：他为她撑起
  push(); translate(56, FLOOR - 210); rotate(0.1);
  shOn(20, 10, 0.22);
  fill('#E9A99A'); noStroke();
  arc(0, 0, 300, 168, PI, TWO_PI);
  shOff();
  fill('#F6D9CB'); arc(0, -4, 268, 148, PI, TWO_PI);
  // 伞骨
  stroke(190, 140, 124, 120); strokeWeight(2);
  for (let i = 0; i <= 6; i++) {
    const a = PI + (i / 6) * PI;
    line(0, 0, Math.cos(a) * 148, Math.sin(a) * 72);
  }
  noStroke();
  // 伞柄
  stroke('#B08063'); strokeWeight(5); line(0, 0, 0, 196); noStroke();
  pop();
  drawKid(86, FLOOR + 8, 0.8, { girl: false, armL: 2.35, armR: 0.4, expr: 'sad' });
}

/* =========================================================
   S4 倦鸟 · 纸鹤飞离
   ========================================================= */
function sceneBirds(lt, dur, t) {
  wash(0, -120, 1100, 480, '#CFE0EA', 26);
  stageBase('#F4EBDC', 150);
  // 远山纸片
  paperPoly([[-600, FLOOR - 30], [-380, FLOOR - 130], [-120, FLOOR - 40], [140, FLOOR - 120], [420, FLOOR - 50], [600, FLOOR - 110], [600, FLOOR], [-600, FLOOR]], '#E4D9C6', { blur: 14, dy: 4, a: 0.14 });

  // 纸鹤
  for (let i = 0; i < 9; i++) {
    const st = i * 0.13;
    const p = clamp01((lt - st) / (dur * 0.85));
    const x = -430 + i * 108 + Math.sin(lt * 1.3 + i) * 24;
    const y = FLOOR - 30 - p * 360 - (i % 3) * 14;
    const s = 1.5 + (i % 3) * 0.5;
    if (y < -370) continue;
    const flap = 0.5 + 0.5 * Math.sin(lt * 5 + i);
    drawCrane(x, y, s, Math.sin(lt * 2 + i) * 0.1 - 0.12, flap);
    // 拖尾
    stroke(255, 252, 240, 90); strokeWeight(2);
    line(x - 26, y + 6, x - 10, y + 2);
    noStroke();
  }
  drawHeart(-92, -190, 0.7, C.coral, 190);

  drawKid(-150, FLOOR + 8, 0.84, { girl: true, armR: -2.6, expr: 'smile', headTilt: -0.1, look: -1 });
  drawKid(-30, FLOOR + 8, 0.8, { girl: false, armR: -2.2, expr: 'smile', look: -1 });
}

/* =========================================================
   S5 爱情 · 高楼一拍弹起一栋
   ========================================================= */
function sceneTowers(lt, dur, t) {
  wash(0, -60, 1100, 460, '#B9BCC0', 26);
  stageBase('#DCD8D0', 150);

  const towers = [
    [-470, 300, 128], [-330, 220, 96], [-205, 260, 110],
    [210, 250, 104], [345, 300, 124], [470, 210, 92]
  ];
  towers.forEach((tw, i) => {
    const t0 = beatAt(12.45, i) - 12.45;
    const p = clamp01((lt - t0 + 0.06) / 0.26);
    drawTower(tw[0], FLOOR + 6, tw[2], tw[1] * (1 + 0.08 * pulse(t)), p, 0.35 + (i % 3) * 0.2);
  });

  // 中间空隙透出的暖光
  const g = pulse(t) * 14;
  fill(255, 226, 170, 70); noStroke();
  ellipse(0, FLOOR - 60, 150 + g, 300 + g);

  const bob = Math.sin(lt * 2.2) * 3;
  drawKid(-22, FLOOR + 6 + bob, 0.72, { girl: true, headTilt: 0.06, armL: 0.5, armR: -0.5, expr: 'wow', look: -1 });
  drawKid(48, FLOOR + 6 - bob, 0.66, { girl: false, armL: -0.4, armR: 0.3, expr: 'smile' });
}

/* =========================================================
   S6 紧握 · 高楼围合，双手紧握
   ========================================================= */
function sceneTowerClose(lt, dur, t) {
  wash(0, -60, 1100, 460, '#ADB0B4', 30);
  stageBase('#D6D2CA', 150);

  // 围合成圈的高楼
  const ring = [-560, -420, -300, -180, 180, 300, 420, 560];
  ring.forEach((x, i) => {
    const p = clamp01((lt - i * 0.07) / 0.4);
    const hh = 220 + (i % 4) * 70;
    drawTower(x, FLOOR - 40, 110, hh, p, 0.55 + (i % 3) * 0.15);
  });
  // 顶部压过来的楼
  push(); translate(0, ART_T + 30);
  const pTop = clamp01(lt / 0.6);
  drawTower(0, 0, 940, 150 * easeOut(pTop), pTop, 0.75);
  pop();

  // 中央两双手 + 纸心
  const popP = easeOutBack(clamp01((lt - 0.25) / 0.5));
  push(); scale(popP); translate(0, 0);
  drawHeart(0, FLOOR - 78, 2.1, C.coral);
  // 两只手（纸片）
  const drawHand = (x, y, flip) => {
    push(); translate(x, y); scale(flip, 1);
    shOn(16, 8, 0.22);
    fill('#F8DAC5'); noStroke();
    beginShape();
    vertex(0, 44); bezierVertex(-40, 30, -46, -12, -18, -26);
    bezierVertex(6, -38, 34, -22, 40, 2);
    bezierVertex(44, 24, 26, 44, 0, 44);
    endShape(CLOSE);
    shOff();
    // 手指缝
    stroke(200, 155, 130, 120); strokeWeight(2);
    line(6, -18, 26, -6); line(2, -6, 30, 6);
    noStroke(); pop();
  };
  drawHand(-52, FLOOR - 74, 1);
  drawHand(52, FLOOR - 74, -1);
  pop();

  drawKid(-210, FLOOR + 6, 0.6, { girl: true, expr: 'smile', headTilt: -0.1 });
  drawKid(214, FLOOR + 6, 0.56, { girl: false, expr: 'smile' });
}

/* =========================================================
   S7 时光 · 墙化成星空
   ========================================================= */
function sceneStarwall(lt, dur, t) {
  // 灰墙 → 夜空
  const mix = easeInOut(clamp01(lt / 1.5));
  const skyA = lerpColor(color('#C7C4BE'), color(C.night), mix).toString();
  paperPoly([[ART_L, ART_T], [ART_R, ART_T], [ART_R, FLOOR + 60], [ART_L, FLOOR + 60]], skyA, { blur: 0, dy: 0, a: 0, edge: false });
  paperPoly([[ART_L, FLOOR + 10], [-320, FLOOR - 46], [60, FLOOR + 6], [380, FLOOR - 30], [ART_R, FLOOR + 12], [ART_R, FLOOR + 90], [ART_L, FLOOR + 90]], '#243551', { blur: 16, dy: 4, a: 0.2, line: false });

  // 翻转中的灰色墙片
  for (let i = 0; i < 7; i++) {
    const p = clamp01((lt - i * 0.1) / 0.55);
    if (p >= 1) continue;
    const x = ART_L + 90 + i * 175;
    push(); translate(x, -120 + (i % 2) * 40);
    scale(1, 1 - easeIn(p));
    fill(lerpColor(color('#B8B5AF'), color(C.nightDeep), p).toString()); noStroke();
    rect(-80, -190, 160, 380, 4);
    pop();
  }

  // 星星
  const r = mulberry32(9);
  for (let i = 0; i < 42; i++) {
    const x = -560 + r() * 1120;
    const y = -320 + r() * 400;
    const tw = 0.55 + 0.45 * Math.sin(lt * 3 + i);
    fill(255, 244, 214, 255 * tw * mix); noStroke();
    ellipse(x, y, 3 + r() * 4, 3 + r() * 4);
  }
  // 月亮
  paperEllipse(360, -230, 130, 130, '#FFF4D6', { blur: 26, dy: 0, a: 0.3 });
  fill(C.night); noStroke(); ellipse(398, -252, 106, 106);

  // 许愿纸星星升起
  for (let i = 0; i < 5; i++) {
    const p = clamp01((lt - 0.3 - i * 0.24) / 2.2);
    if (p <= 0) continue;
    const x = -420 + i * 210 + Math.sin(lt * 1.2 + i) * 12;
    const y = FLOOR - 20 - p * 330;
    drawStar(x, y, 26 + (i % 3) * 6, lt * 0.4 + i, '#FFE9A8');
    // 拖尾
    stroke(255, 236, 190, 70); strokeWeight(2.4);
    line(x, y + 26, x - 6, y + 74); noStroke();
  }

  drawKid(-20, FLOOR + 4, 0.8, { girl: true, armR: -2.7, look: -1, expr: 'wow', headTilt: -0.1 });
  drawKid(96, FLOOR + 4, 0.72, { girl: false, armL: -2.4, look: -1, expr: 'wow' });
}

/* =========================================================
   S8 光明 · 纸光芒炸开
   ========================================================= */
function sceneLight(lt, dur, t) {
  const mix = clamp01(lt / 1.0);
  fill(lerpColor(color(C.night), color('#F7DFA8'), easeOut(mix))); noStroke();
  rect(ART_L, ART_T, ART_R - ART_L, FLOOR + 60 - ART_T);

  const p = easeOut(clamp01(lt / 1.6));
  const cx = 0, cy = -130;
  // 放射纸光芒
  const n = 20;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TWO_PI + lt * 0.12;
    const len = (280 + 160 * ((i * 7) % 5) / 5) * p;
    push(); translate(cx, cy); rotate(a);
    shOn(14, 6, 0.14, '170,120,50');
    fill(i % 3 === 0 ? '#FFF3D2' : (i % 3 === 1 ? '#F7C96A' : '#FFFDF4'));
    noStroke();
    beginShape();
    vertex(20, 0); vertex(len, -26); vertex(len * 1.06, 0); vertex(len, 26);
    endShape(CLOSE);
    shOff(); pop();
  }
  // 同心纸环
  for (let k = 0; k < 3; k++) {
    const rp = clamp01((lt - k * 0.14) / 1.2);
    if (rp <= 0) continue;
    noFill(); stroke(255, 245, 220, 150 * (1 - rp)); strokeWeight(3);
    ellipse(cx, cy, 120 + rp * 620, 120 + rp * 620);
    noStroke();
  }
  // 中心太阳
  paperEllipse(cx, cy, 150, 150, '#FFF6DF', { blur: 30, dy: 0, a: 0.35 });
  paperEllipse(cx, cy, 110, 110, '#FFE9A8', { blur: 18, dy: 0, a: 0.2 });

  // 地面
  paperPoly([[ART_L, FLOOR + 4], [ART_R, FLOOR + 4], [ART_R, FLOOR + 150], [ART_L, FLOOR + 150]], '#F0DFC4', { blur: 14, dy: -2, a: 0.12, edge: false });

  // 逆光小人和纸花
  const bob = pulse(t) * 5;
  drawKid(-150, FLOOR + 6 - bob, 0.82, { girl: true, armR: -2.6, expr: 'happy', headTilt: -0.12, look: -1 });
  drawKid(-34, FLOOR + 6 + bob * 0.5, 0.76, { girl: false, armL: -2.3, expr: 'wow', look: -1 });
  for (let i = 0; i < 4; i++) drawFlower(-430 + i * 96, FLOOR + 8, 0.62, clamp01((lt - 0.4 - i * 0.12) / 0.5), '#E9A0A0');
}

/* =========================================================
   S9 星空 · 花一路开过去
   ========================================================= */
function sceneFlowers(lt, dur, t) {
  wash(0, -80, 1200, 460, '#F4DCC0', 24);
  stageBase('#F7EEDC', 150);
  // 夜空一角（承接上一场）
  push();
  const fade = clamp01(1 - lt / 1.2);
  if (fade > 0) {
    fill(fa(C.night, 190 * fade)); noStroke();
    rect(ART_L, ART_T, ART_R - ART_L, 260);
    for (let i = 0; i < 24; i++) {
      const r = mulberry32(i + 3);
      fill(255, 244, 214, 200 * fade); noStroke();
      ellipse(-560 + r() * 1120, ART_T + r() * 240, 3, 3);
    }
  }
  pop();

  // 蜿蜒小路
  const pathP = clamp01(lt / 0.7);
  noFill(); stroke('#E8D3B2'); strokeWeight(56); strokeCap(ROUND);
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10;
    pts.push([lerp(-560, 560, u), FLOOR + 30 - Math.sin(u * PI * 1.6) * 54 - u * 40]);
  }
  beginShape();
  for (let i = 0; i <= 10 * pathP; i++) curveVertex(pts[i][0], pts[i][1]);
  endShape();
  noStroke(); strokeCap(SQUARE);

  // 花一路开过去
  const flowerCols = ['#E27B70', '#F2BC50', '#E9A0C0', '#8FB59A', '#E27B70'];
  for (let i = 0; i < 11; i++) {
    const st = 0.25 + i * 0.16;
    const p = clamp01((lt - st) / 0.34);
    if (p <= 0) continue;
    const u = i / 10;
    const x = lerp(-560, 560, u);
    const y = FLOOR + 30 - Math.sin(u * PI * 1.6) * 54 - u * 40 + 16;
    drawFlower(x, y, 0.8 + (i % 3) * 0.16, p, flowerCols[i % 5]);
  }

  // 小人沿路走
  const walk = easeInOut(clamp01(lt / dur)) * 0.72 + 0.1;
  const wx = lerp(-560, 560, walk);
  const wy = FLOOR + 30 - Math.sin(walk * PI * 1.6) * 54 - walk * 40 + 24;
  const step = Math.sin(lt * 6.5) * 3;
  drawKid(wx, wy + step, 0.8, { girl: true, armL: 0.9, armR: -0.9, expr: 'happy' });
  drawKid(wx + 92, wy - step * 0.8, 0.74, { girl: false, armL: -0.7, armR: 0.7, expr: 'smile' });

  // 蝴蝶
  for (let i = 0; i < 3; i++) {
    const bx = -200 + i * 260 + Math.sin(lt * 1.6 + i) * 40;
    const by = -80 + Math.cos(lt * 1.9 + i) * 30;
    push(); translate(bx, by); rotate(Math.sin(lt * 6 + i) * 0.4);
    fill(i % 2 ? '#F3B7AC' : '#F6D98F'); noStroke();
    ellipse(-9, 0, 16, 12); ellipse(9, 0, 16, 12);
    pop();
  }
}
