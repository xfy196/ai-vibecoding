/* =========================================================
   画法工具：字距 / 手绘线 / 样条 / 噪点 / 投影
   ========================================================= */
(function (MV) {
  'use strict';
  const { rng, clamp01, lerp, E } = MV.util;

  const F = {
    serif: '"Songti SC","Hiragino Mincho ProN","Noto Serif SC",serif',
    sans: '"PingFang SC","Hiragino Sans GB",sans-serif',
    mono: '"SF Mono",Menlo,"Courier New",monospace'
  };

  const COL = {
    paper: '#eae5d9',
    ink: '#242019',
    ink2: '#5f584b',
    ink3: '#8d8474',
    red: '#a5301f',
    navy: '#3d4a6b',
    thread: '#8e2c20'
  };

  function font(x, size, fam, weight) {
    x.font = `${weight || 400} ${size}px ${fam || F.serif}`;
  }

  /* ---------- 字距 ---------- */
  function spacedW(x, s, sp) {
    let w = 0;
    for (const ch of s) w += x.measureText(ch).width + sp;
    return Math.max(0, w - sp);
  }

  function spaced(x, s, px, py, sp, align) {
    const w = spacedW(x, s, sp);
    let cx = align === 'center' ? px - w / 2 : align === 'right' ? px - w : px;
    for (const ch of s) {
      x.fillText(ch, cx, py);
      cx += x.measureText(ch).width + sp;
    }
    return w;
  }

  /* 打字机：返回已显示字符数 */
  function typed(s, t, start, cps) {
    if (t < start) return 0;
    return Math.min(s.length, Math.floor((t - start) * cps));
  }

  /* 时间窗 alpha */
  function win(t, a, b, fi, fo) {
    fi = fi === undefined ? 0.5 : fi;
    fo = fo === undefined ? 0.5 : fo;
    if (t < a || t > b) return 0;
    const i = clamp01((t - a) / (fi || 0.0001));
    const o = clamp01((b - t) / (fo || 0.0001));
    return Math.min(E.inOut(i), E.inOut(o));
  }

  /* ---------- 按弧长截取折线 ---------- */
  function partial(x, pts, p, color, width, alpha) {
    if (p <= 0 || pts.length < 2) return;
    let total = 0;
    const seg = [];
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      seg.push(d);
      total += d;
    }
    let need = total * Math.min(1, p);
    x.beginPath();
    x.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      if (need <= 0) break;
      const d = seg[i - 1];
      if (d <= need) {
        x.lineTo(pts[i][0], pts[i][1]);
        need -= d;
      } else {
        const k = need / d;
        x.lineTo(lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k));
        need = 0;
      }
    }
    x.strokeStyle = color;
    x.lineWidth = width;
    x.lineCap = 'round';
    x.lineJoin = 'round';
    x.globalAlpha = alpha === undefined ? 1 : alpha;
    x.stroke();
    x.globalAlpha = 1;
  }

  /* 手绘圆：一整圈带抖动 */
  function handCircle(cx, cy, rx, ry, seed, span) {
    const r = rng(seed);
    const pts = [];
    const N = 96;
    const s = span === undefined ? 0.97 : span;
    for (let i = 0; i <= N; i++) {
      const a = -1.1 + (i / N) * Math.PI * 2 * s;
      const j = (r() - 0.5) * 3.0;
      pts.push([cx + Math.cos(a) * (rx + j), cy + Math.sin(a) * (ry + j)]);
    }
    return pts;
  }

  /* 手绘线：起终点之间加一点弯曲 */
  function handLine(x0, y0, x1, y1, seed, amp) {
    const r = rng(seed);
    const pts = [];
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const N = 14;
    const a = amp === undefined ? 6 : amp;
    for (let i = 0; i <= N; i++) {
      const k = i / N;
      const bow = Math.sin(k * Math.PI) * (r() - 0.5) * a;
      pts.push([x0 + dx * k + nx * bow, y0 + dy * k + ny * bow]);
    }
    return pts;
  }

  /* 箭头 */
  function arrowHead(x, p0, p1, size, color, p) {
    if (p < 0.92) return;
    const a = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
    const s = size || 9;
    x.beginPath();
    x.moveTo(p1[0], p1[1]);
    x.lineTo(p1[0] - Math.cos(a - 0.38) * s, p1[1] - Math.sin(a - 0.38) * s);
    x.moveTo(p1[0], p1[1]);
    x.lineTo(p1[0] - Math.cos(a + 0.38) * s, p1[1] - Math.sin(a + 0.38) * s);
    x.strokeStyle = color;
    x.lineWidth = 2;
    x.lineCap = 'round';
    x.stroke();
  }

  /* ---------- 单调三次样条：不超调，镜头滑行用 ---------- */
  function spline(ts, vs) {
    const n = ts.length;
    const m = new Array(n).fill(0);
    const d = [];
    for (let i = 0; i < n - 1; i++) d.push((vs[i + 1] - vs[i]) / ((ts[i + 1] - ts[i]) || 1));
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) m[i] = 0;
      else m[i] = (d[i - 1] + d[i]) / 2;
    }
    for (let i = 0; i < n - 1; i++) {
      if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
      const a = m[i] / d[i], b = m[i + 1] / d[i];
      const s = a * a + b * b;
      if (s > 9) {
        const tau = 3 / Math.sqrt(s);
        m[i] = tau * a * d[i];
        m[i + 1] = tau * b * d[i];
      }
    }
    return { ts, vs, m };
  }

  function evalSpline(sp, t) {
    const { ts, vs, m } = sp;
    const n = ts.length;
    if (t <= ts[0]) return vs[0];
    if (t >= ts[n - 1]) return vs[n - 1];
    let i = 0;
    while (i < n - 2 && t > ts[i + 1]) i++;
    const h = ts[i + 1] - ts[i];
    const s = (t - ts[i]) / h;
    const s2 = s * s, s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1;
    const h10 = s3 - 2 * s2 + s;
    const h01 = -2 * s3 + 3 * s2;
    const h11 = s3 - s2;
    return h00 * vs[i] + h10 * h * m[i] + h01 * vs[i + 1] + h11 * h * m[i + 1];
  }

  /* ---------- 噪点层 ---------- */
  function noiseTile(size, alpha) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const x = c.getContext('2d');
    const img = x.createImageData(size, size);
    const r = rng(4242);
    for (let i = 0; i < size * size; i++) {
      const v = r();
      const k = i * 4;
      if (v < 0.5) {
        img.data[k] = 0; img.data[k + 1] = 0; img.data[k + 2] = 0;
        img.data[k + 3] = Math.floor(v * 2 * 255 * alpha);
      } else {
        img.data[k] = 255; img.data[k + 1] = 255; img.data[k + 2] = 255;
        img.data[k + 3] = Math.floor((v - 0.5) * 2 * 255 * alpha);
      }
    }
    x.putImageData(img, 0, 0);
    return c;
  }

  /* ---------- 道具投影（预先烘焙成剪影） ---------- */
  function castShadow(prop, blur, alpha, color) {
    const pad = 46;
    const w = prop.w + pad * 2, h = prop.h + pad * 2;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.filter = `blur(${blur || 13}px)`;
    x.drawImage(prop.cv, pad, pad, prop.w, prop.h);
    x.filter = 'none';
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = color || `rgba(26,21,14,${alpha || 0.5})`;
    x.fillRect(0, 0, w, h);
    return { cv: c, ox: w / 2, oy: h / 2, w, h };
  }

  MV.fx = {
    F, COL, font, spacedW, spaced, typed, win, partial,
    handCircle, handLine, arrowHead, spline, evalSpline, noiseTile, castShadow
  };
})(window.MV);
