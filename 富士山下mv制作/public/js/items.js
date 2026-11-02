/* =========================================================
   物证：六件道具的轨迹 / 标签 / 红线 / 印章 / 结案
   ========================================================= */
(function (MV) {
  'use strict';
  const { rng, clamp01, lerp, E } = MV.util;
  const { F, COL, font, spaced, partial, handCircle, handLine, arrowHead, castShadow } = MV.fx;
  const P = MV.props;

  const SLOTS = {
    coat: { cx: 400, cy: 566, rot: -0.012, w: 380, h: 330 },
    tickets: { cx: 800, cy: 448, rot: 0.015, w: 300, h: 178 },
    petal: { cx: 1160, cy: 456, rot: -0.02, w: 210, h: 170 },
    stone: { cx: 1415, cy: 492, rot: 0.02, w: 220, h: 190 },
    tube: { cx: 1710, cy: 500, rot: 0.02, w: 96, h: 300 },
    key: { cx: 1660, cy: 790, rot: -0.30, w: 210, h: 84 }
  };

  const ORDER = ['coat', 'tickets', 'petal', 'stone', 'tube', 'key'];

  /* 关键帧：缺的字段由上一条继承 */
  function prep(keys) {
    const out = [];
    let cur = { cx: 0, cy: 0, rot: 0, s: 1, a: 1 };
    for (const k of keys) {
      cur = Object.assign({}, cur, k);
      out.push(cur);
    }
    return out;
  }

  function trackAt(t, keys) {
    if (t <= keys[0].t) return keys[0];
    for (let i = 1; i < keys.length; i++) {
      const k1 = keys[i], k0 = keys[i - 1];
      if (t <= k1.t) {
        const p = clamp01((t - k0.t) / ((k1.t - k0.t) || 1));
        const e = E[k1.e || 'inOut'](p);
        const o = {};
        for (const f of ['cx', 'cy', 'rot', 's', 'a']) o[f] = lerp(k0[f], k1[f], e);
        return o;
      }
    }
    return keys[keys.length - 1];
  }

  /* 入场 / 退场 / 二次入场 / 收尾 */
  const TRACKS = {
    coat: prep([
      { t: 0, cx: 400, cy: 566, rot: -0.012, s: 1, a: 0 },
      { t: 25.9, s: 0.96 },
      { t: 26.05, cx: -250, cy: 620, rot: -0.40, a: 1, e: 'linear' },
      { t: 27.4, cx: 400, cy: 566, rot: -0.012, s: 1, e: 'outBack' },
      { t: 97.9 },
      { t: 98.8, a: 0 },
      { t: 106.8, a: 0, cx: 400, cy: 566, rot: -0.012, s: 0.97 },
      { t: 107.8, a: 1, s: 1, e: 'out' },
      { t: 230.6 },
      { t: 232.6, cx: 700, cy: 600, rot: -0.03, s: 1.12 },
      { t: 233.3, cx: 700, cy: 600, rot: -0.03, s: 1.14, a: 0.85 },
      { t: 234.2, a: 0 }
    ]),
    tickets: prep([
      { t: 0, cx: 800, cy: 448, rot: 0.015, s: 1, a: 0 },
      { t: 35.1, cx: 1180, cy: 980, rot: 0.36, s: 0.96 },
      { t: 35.25, a: 1, e: 'linear' },
      { t: 36.6, cx: 800, cy: 448, rot: 0.015, s: 1, e: 'outBack' },
      { t: 97.9 },
      { t: 98.8, a: 0 },
      { t: 102.2, a: 0, cx: 800, cy: 448, rot: 0.015, s: 0.96 },
      { t: 103.0, a: 1, s: 1, e: 'out' },
      { t: 226.0 },
      { t: 227.0, a: 0 }
    ]),
    petal: prep([
      { t: 0, cx: 1160, cy: 456, rot: -0.02, s: 1, a: 0 },
      { t: 39.9, cx: 1150, cy: -170, rot: 0.34, s: 0.96 },
      { t: 40.05, a: 1, e: 'linear' },
      { t: 41.4, cx: 1160, cy: 456, rot: -0.02, s: 1, e: 'outBack' },
      { t: 97.9 },
      { t: 98.8, a: 0 },
      { t: 111.4, a: 0, cx: 1160, cy: 456, rot: -0.02, s: 0.96 },
      { t: 112.2, a: 1, s: 1, e: 'out' },
      { t: 226.0 },
      { t: 227.0, a: 0 }
    ]),
    stone: prep([
      { t: 0, cx: 1415, cy: 492, rot: 0.02, s: 1, a: 0 },
      { t: 49.15, cx: 1415, cy: 1360, rot: 0.22, s: 0.96 },
      { t: 49.3, a: 1, e: 'linear' },
      { t: 50.7, cx: 1415, cy: 492, rot: 0.02, s: 1, e: 'outBack' },
      { t: 97.9 },
      { t: 98.8, a: 0 },
      { t: 120.6, a: 0, cx: 1415, cy: 492, rot: 0.02, s: 0.96 },
      { t: 121.4, a: 1, s: 1, e: 'out' },
      { t: 226.0 },
      { t: 227.0, a: 0 }
    ]),
    tube: prep([
      { t: 0, cx: 1710, cy: 500, rot: 0.02, s: 1, a: 0 },
      { t: 58.2, cx: 1710, cy: -230, rot: 0.10, s: 0.96 },
      { t: 58.35, a: 1, e: 'linear' },
      { t: 59.8, cx: 1710, cy: 500, rot: 0.02, s: 1, e: 'outBack' },
      { t: 97.9 },
      { t: 98.8, a: 0 },
      { t: 125.2, a: 0, cx: 1710, cy: 500, rot: 0.02, s: 0.96 },
      { t: 126.0, a: 1, s: 1, e: 'out' },
      { t: 226.0 },
      { t: 227.0, a: 0 }
    ]),
    key: prep([
      { t: 0, cx: 1660, cy: 790, rot: -0.30, s: 1, a: 0 },
      { t: 58.5, cx: 2200, cy: 860, rot: 0.30, s: 0.96 },
      { t: 58.65, a: 1, e: 'linear' },
      { t: 60.2, cx: 1660, cy: 790, rot: -0.30, s: 1, e: 'outBack' },
      { t: 97.9 },
      { t: 98.8, a: 0 },
      { t: 129.9, a: 0, cx: 1660, cy: 790, rot: -0.30, s: 0.96 },
      { t: 130.7, a: 1, s: 1, e: 'out' },
      { t: 226.0 },
      { t: 227.0, a: 0 }
    ])
  };

  const TAG = {
    coat: { dx: 0, dy: 198, rot: -0.012, text: '001 · 风褛 / OLD COAT' },
    tickets: { dx: -150, dy: 144, rot: 0.022, text: '002 · 车票 / TICKETS ×2' },
    petal: { dx: 0, dy: 140, rot: -0.018, text: '003 · 花瓣 / PETALS' },
    stone: { dx: 4, dy: 146, rot: 0.02, text: '004 · 石头 / STONE' },
    tube: { dx: 0, dy: 228, rot: -0.02, text: '005 · 试管 / TEST TUBE' },
    key: { dx: 0, dy: 98, rot: 0.012, text: '006 · 钥匙 / KEY' }
  };

  let props = null, shadows = null, tags = null, tagRelease = null;

  function init() {
    props = {
      coat: P.coatBag(),
      coatFree: P.coatFree(),
      tickets: P.tickets(),
      petal: P.petalBag(),
      stone: P.stone(),
      tube: P.tube(),
      key: P.key()
    };
    shadows = {};
    for (const k of Object.keys(props)) shadows[k] = castShadow(props[k], 18, 0.40);
    tags = {};
    for (const k of Object.keys(TAG)) tags[k] = P.tag(TAG[k].text);
    tagRelease = P.tag('007 · 解咒 / RELEASED');
  }

  /* ---------------- 空位（虚线框） ---------------- */
  function drawSlots(x, t) {
    let base = 0.07;
    if (t > 53.6 && t < 58.6) base = 0.42;
    if (t > 226.4 && t < 233.4) base = 0.30;
    if (t > 231 && t < 236) base = 0.14;
    x.save();
    x.setLineDash([7, 9]);
    x.lineWidth = 1.2;
    ORDER.forEach((k, i) => {
      const s = SLOTS[k];
      const pulse = t > 53.6 && t < 58.6 ? 0.5 + 0.5 * Math.sin((t - 53.6) * 2.6 - i * 0.5) : 1;
      x.globalAlpha = base * (0.55 + 0.45 * pulse);
      x.strokeStyle = k === 'coat' ? COL.red : 'rgba(72,64,50,0.9)';
      x.strokeRect(s.cx - s.w / 2 - 10, s.cy - s.h / 2 - 10, s.w + 20, s.h + 20);
      font(x, 9, F.mono, 400);
      x.fillStyle = 'rgba(72,64,50,0.95)';
      x.globalAlpha = base;
      spaced(x, '00' + (i + 1), s.cx - s.w / 2 - 10, s.cy - s.h / 2 - 18, 1.6);
    });
    x.restore();
  }

  /* ---------------- 石头翻面 ---------------- */
  const FLIPS = [86.9, 167.6, 212.6];
  function stoneFlip(t) {
    let sx = 1, under = false;
    for (const f of FLIPS) {
      const p = (t - f) / 1.15;
      if (p > 0 && p < 1) {
        sx = Math.abs(Math.cos(Math.PI * p));
        under = p < 0.5;
      }
    }
    return { sx, under };
  }

  function drawStone(x, it, t, prop) {
    const f = stoneFlip(t);
    x.save();
    x.translate(it.cx, it.cy);
    x.rotate(it.rot);
    x.scale(it.s * Math.max(0.05, f.sx), it.s);
    x.globalAlpha = it.a;
    x.drawImage(shadows.stone.cv, -shadows.stone.ox + 14, -shadows.stone.oy + 20, shadows.stone.w, shadows.stone.h);
    if (f.under) {
      // 底面：一块切开的灰岩，刻着日期
      x.beginPath();
      x.ellipse(0, 0, 78, 64, 0.1, 0, 7);
      const g = x.createRadialGradient(-10, -14, 6, 0, 0, 90);
      g.addColorStop(0, '#8f8b7c');
      g.addColorStop(1, '#5d5a51');
      x.fillStyle = g;
      x.fill();
      x.strokeStyle = '#46443c';
      x.lineWidth = 3;
      x.stroke();
      x.fillStyle = 'rgba(48,45,38,0.55)';
      font(x, 13, F.mono, 400);
      spaced(x, '2014.02.14', 0, -4, 2, 'center');
      spaced(x, '前 尘 硬 化', 0, 26, 4, 'center');
    } else {
      x.drawImage(prop.cv, -prop.w / 2, -prop.h / 2, prop.w, prop.h);
      // 合上时的边缘高光
      if (f.sx < 0.6) {
        x.globalAlpha = it.a * (0.6 - f.sx) * 1.6;
        x.fillStyle = 'rgba(255,255,255,0.55)';
        x.fillRect(-3, -70, 6, 140);
      }
    }
    x.restore();
  }

  /* ---------------- 试管里的墨 ---------------- */
  function drawTubeInk(x, it, t) {
    if (it.a < 0.05) return;
    const clear = clamp01((t - 207.7) / 2.4);      // 207.7 之后墨慢慢消失
    const k = 1 - clear;
    if (k <= 0.01) return;
    x.save();
    x.translate(it.cx, it.cy);
    x.rotate(it.rot);
    x.beginPath();
    x.moveTo(-24, -118);
    x.lineTo(-24, 96);
    x.quadraticCurveTo(-24, 124, 0, 124);
    x.quadraticCurveTo(24, 124, 24, 96);
    x.lineTo(24, -118);
    x.closePath();
    x.clip();
    const sway = Math.sin(t * 0.9) * 4;
    const g = x.createRadialGradient(sway, 78, 3, sway, 60, 74);
    g.addColorStop(0, `rgba(14,19,23,${0.55 * k * it.a})`);
    g.addColorStop(0.5, `rgba(30,42,48,${0.30 * k * it.a})`);
    g.addColorStop(1, 'rgba(40,54,60,0)');
    x.fillStyle = g;
    x.fillRect(-30, -40, 60, 190);
    x.restore();
  }

  /* ---------------- 道具本体 ---------------- */
  function drawItems(x, t) {
    ORDER.forEach((k) => {
      const it = trackAt(t, TRACKS[k]);
      if (it.a <= 0.002) return;
      const prop = props[k];
      if (k === 'stone') { drawStone(x, it, t, prop); return; }
      x.save();
      x.translate(it.cx, it.cy);
      x.rotate(it.rot);
      x.scale(it.s, it.s);
      x.globalAlpha = it.a;
      const sh = shadows[k];
      x.drawImage(sh.cv, -sh.ox + 13, -sh.oy + 19, sh.w, sh.h);
      x.drawImage(prop.cv, -prop.w / 2, -prop.h / 2, prop.w, prop.h);
      x.restore();
      if (k === 'tube') drawTubeInk(x, it, t);
    });
  }

  /* ---------------- 标签 ---------------- */
  function drawTags(x, t) {
    ORDER.forEach((k) => {
      const it = trackAt(t, TRACKS[k]);
      if (it.a <= 0.002) return;
      const g = TAG[k], img = tags[k];
      let cy = it.cy + g.dy * it.s;
      let rot = it.rot + g.rot;
      let a = it.a;
      // 首次入场时掉下来
      const inT = k === 'coat' ? 27.6 : k === 'tickets' ? 36.8 : k === 'petal' ? 41.6 : k === 'stone' ? 50.9 : k === 'tube' ? 60.0 : 60.4;
      if (t > inT - 0.35 && t < inT + 0.9) {
        const p = clamp01((t - (inT - 0.35)) / 1.0);
        const e = E.outBack(p);
        cy += -80 * (1 - e);
        rot += 0.18 * (1 - e);
        a *= clamp01(p * 3);
      }
      // 解咒时 001 的标签脱落
      if (k === 'coat' && t > 234.4) {
        const p = clamp01((t - 234.4) / 1.4);
        cy += 120 * E.in(p);
        rot += 0.55 * E.in(p);
        a *= 1 - p;
      }
      x.save();
      x.translate(it.cx + g.dx * it.s, cy);
      x.rotate(rot);
      x.globalAlpha = a * 0.97;
      x.drawImage(img.cv, -img.w / 2, -img.h / 2, img.w, img.h);
      x.restore();
    });

    // 007 解咒标签：236 之后掉在纸中间
    if (t > 235.4) {
      const p = clamp01((t - 235.4) / 0.9);
      const e = E.outBack(p);
      const y = 760 + 300 * (1 - e);
      x.save();
      x.globalAlpha = clamp01(p * 2.2);
      x.translate(1140, y);
      x.rotate(0.05 + 0.2 * (1 - e));
      x.drawImage(tagRelease.cv, -tagRelease.w / 2, -tagRelease.h / 2, tagRelease.w, tagRelease.h);
      x.restore();
    }
  }

  /* ---------------- 红线 ---------------- */
  function threadPts(t) {
    const pts = [];
    for (const k of ORDER) {
      const it = trackAt(t, TRACKS[k]);
      if (it.a < 0.4) continue;
      pts.push([it.cx + 40 * Math.sin(k.length * 2.1), it.cy - 30 + 20 * Math.cos(k.length)]);
    }
    return pts;
  }

  function drawThread(x, t) {
    if (t < 58.6 || t > 204.2) return;
    const pts = threadPts(t);
    if (pts.length < 2) return;

    let p = 1;
    if (t < 62.4) p = clamp01((t - 58.8) / 3.4);
    let a = 0.9;
    if (t > 202.6) a = clamp01(1 - (t - 202.6) / 1.4);

    // 断线：202.85 起分成两截，垂下来
    let broken = false;
    let bp = 0;
    if (t > 202.85) { broken = true; bp = clamp01((t - 202.85) / 1.2); }

    // 手铺的线：每段加一点弯
    const path = [];
    for (let i = 0; i < pts.length; i++) {
      if (i === 0) { path.push(pts[0]); continue; }
      const a0 = pts[i - 1], b0 = pts[i];
      const mid = [(a0[0] + b0[0]) / 2, (a0[1] + b0[1]) / 2];
      const dx = b0[0] - a0[0], dy = b0[1] - a0[1];
      const L = Math.hypot(dx, dy) || 1;
      const bow = (i % 2 ? 1 : -1) * 16;
      mid[0] += -dy / L * bow;
      mid[1] += dx / L * bow;
      for (let s = 0; s <= 6; s++) {
        const q = s / 6;
        const xx = (1 - q) * (1 - q) * a0[0] + 2 * (1 - q) * q * mid[0] + q * q * b0[0];
        const yy = (1 - q) * (1 - q) * a0[1] + 2 * (1 - q) * q * mid[1] + q * q * b0[1];
        path.push([xx, yy]);
      }
    }

    // 振动 / 绷紧
    const ta = t > 198 ? 1 : 0;
    if (ta && !broken) {
      a = Math.min(1, a + 0.1);
      const amp = 3.5 * clamp01((t - 198) / 4.8);
      for (let i = 0; i < path.length; i++) path[i][1] += Math.sin(t * 26 + i * 0.7) * amp * (i / path.length);
    }

    x.save();
    if (broken) {
      const half = Math.floor(path.length * 0.52);
      // 影子
      partial(x, path.slice(0, half).map(q => [q[0] + 3, q[1] + 4 + 70 * bp]), 1, 'rgba(30,24,16,0.18)', 4, a);
      partial(x, path.slice(half).map(q => [q[0] + 3, q[1] + 4 + 70 * bp]), 1, 'rgba(30,24,16,0.18)', 4, a);
      partial(x, path.slice(0, half).map(q => [q[0], q[1] + 80 * bp]), 1, COL.thread, 2.2, a);
      partial(x, path.slice(half).map(q => [q[0], q[1] + 80 * bp]), 1, COL.thread, 2.2, a);
    } else {
      partial(x, path.map(q => [q[0] + 3, q[1] + 4]), p, 'rgba(30,24,16,0.20)', 4, a);
      partial(x, path, p, COL.thread, 2.4, a);
      // 线上的一点高光
      partial(x, path.map(q => [q[0] - 0.5, q[1] - 0.7]), p, 'rgba(255,220,200,0.22)', 0.9, a);
    }
    x.restore();
  }

  /* ---------------- 印章 ---------------- */
  const STAMPS = [
    { t: 72.733, x: 1812, y: 258, rot: -0.24, s: 0.96, main: '私有', sub: 'DENIED · MT. FUJI' },
    { t: 153.512, x: 1180, y: 806, rot: 0.08, s: 1.16, main: '私有', sub: 'DENIED · MT. FUJI' },
    { t: 198.156, x: 700, y: 762, rot: -0.10, s: 1.42, main: '私有', sub: 'DENIED · MT. FUJI' },
    { t: 236.55, x: 1436, y: 486, rot: 0.12, s: 1.12, main: '解咒', sub: 'CASE CLOSED' }
  ];

  let stampImg = null, stampRel = null;

  function drawStamps(x, t) {
    STAMPS.forEach((st, idx) => {
      if (t < st.t) return;
      const endA = idx === 0 ? 1 - clamp01((t - 152.0) / 1.4)
        : idx === 1 ? 1 - clamp01((t - 196.9) / 1.2)
        : idx === 2 ? 1 - clamp01((t - 227.0) / 1.6) : 1;
      if (endA <= 0.002) return;
      const p = clamp01((t - st.t) / 0.24);
      const e = E.out(p);
      const sc = st.s * lerp(2.05, 1, e);
      const a = clamp01(p * 1.6) * 0.94 * endA;
      const img = idx === 3 ? stampRel : stampImg;
      x.save();
      x.translate(st.x, st.y);
      x.rotate(st.rot);
      x.scale(sc, sc);
      x.globalAlpha = a;
      x.drawImage(img.cv, -img.w / 2, -img.h / 2, img.w, img.h);
      x.restore();

      // 落章冲击：一圈涟漪 + 飞墨
      const dt = t - st.t;
      if (dt < 0.5) {
        const r = rng(880 + idx);
        x.save();
        x.translate(st.x, st.y);
        x.rotate(st.rot);
        x.globalAlpha = (1 - dt / 0.5) * 0.18;
        x.strokeStyle = COL.red;
        x.lineWidth = 2;
        x.beginPath();
        x.arc(0, 0, 96 * st.s + dt * 96, 0, 7);
        x.stroke();
        const n = 30;
        for (let i = 0; i < n; i++) {
          const ang = r() * Math.PI * 2;
          const rr = 88 + r() * 26 + dt * 180;
          const rad = 0.8 + r() * 2.4;
          x.globalAlpha = (1 - dt / 0.5) * 0.55 * r();
          x.fillStyle = COL.red;
          x.beginPath();
          x.arc(Math.cos(ang) * rr, Math.sin(ang) * rr, rad, 0, 7);
          x.fill();
        }
        x.restore();
      }

      // 驳回：大叉
      if (idx === 2 && t > 200.4) {
        const q = clamp01((t - 200.4) / 0.5) * endA;
        const R = 118 * st.s;
        partial(x, handLine(st.x - R, st.y - R * 0.9, st.x + R, st.y + R * 0.9, 71, 4), q, 'rgba(140,30,20,0.9)', 9, 0.45);
        partial(x, handLine(st.x + R, st.y - R * 0.9, st.x - R, st.y + R * 0.9, 72, 4), q, 'rgba(140,30,20,0.9)', 9, 0.45);
      }

      // 墨没干：洇开
      const wet = win(t, st.t + 0.3, st.t + 5.2, 0.6, 3.0);
      if (wet > 0.01 && idx < 3) {
        x.save();
        x.filter = 'blur(6px)';
        x.globalAlpha = wet * 0.10 * endA;
        x.translate(st.x, st.y);
        x.rotate(st.rot);
        x.scale(st.s, st.s);
        x.drawImage(img.cv, -img.w / 2, -img.h / 2, img.w, img.h);
        x.restore();
      }
    });
  }

  function win(t, a, b, fi, fo) {
    if (t < a || t > b) return 0;
    const i = clamp01((t - a) / (fi || 0.01));
    const o = clamp01((b - t) / (fo || 0.01));
    return Math.min(E.inOut(i), E.inOut(o));
  }

  /* ---------------- 解咒：开袋、取出外套 ---------------- */
  function drawEnding(x, t) {
    if (t < 233.0) return;

    // 划开证物袋
    if (t > 233.1 && t < 234.5) {
      const p = clamp01((t - 233.1) / 0.55);
      const a = clamp01(1 - (t - 233.75) / 0.55) * clamp01((t - 233.1) / 0.12);
      x.save();
      x.globalAlpha = a;
      const pts = handLine(540, 470, 880, 742, 4242, 10);
      partial(x, pts, p, 'rgba(60,50,36,0.55)', 5.5, 0.75);
      partial(x, pts, p, 'rgba(255,255,255,0.95)', 2.6, 1);
      partial(x, pts.map(q => [q[0], q[1] + 2]), p, 'rgba(165,48,31,0.5)', 1.2, 0.7);
      x.restore();
    }

    // 外套从袋里出来
    const coat = props.coatFree;
    if (t > 234.2) {
      const p = clamp01((t - 234.2) / 0.9);
      const e = E.out(p);
      const a = e * clamp01(1 - (t - 240.2) / 1.8);
      x.save();
      x.translate(700, 600 - 26 * e);
      x.rotate(-0.02 - 0.02 * e);
      x.scale(1.02, 1.02);
      x.globalAlpha = a;
      const sh = shadows.coatFree;
      x.drawImage(sh.cv, -sh.ox + 16, -sh.oy + 24, sh.w, sh.h);
      x.drawImage(coat.cv, -coat.w / 2, -coat.h / 2, coat.w, coat.h);
      x.restore();
    }
  }

  MV.items = {
    init, drawSlots, drawItems, drawTags, drawThread, drawStamps, drawEnding,
    trackAt, TRACKS, SLOTS, TAG, ORDER, STAMPS,
    _stampImg() { return stampImg; },
    setStamps(main, rel) { stampImg = main; stampRel = rel; }
  };
})(window.MV);
