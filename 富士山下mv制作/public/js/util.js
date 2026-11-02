/* =========================================================
   工具：确定性随机 / 缓动 / 关键帧 / 画布小工具
   ========================================================= */
window.MV = window.MV || {};

(function (MV) {
  'use strict';

  /* ---------- 确定性伪随机（同一 seed 永远同一序列） ---------- */
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  /* ---------- 数学 ---------- */
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const clamp01 = (v) => clamp(v, 0, 1);
  const lerp = (a, b, k) => a + (b - a) * k;
  const invlerp = (a, b, v) => (b === a ? 0 : clamp01((v - a) / (b - a)));

  /* ---------- 缓动 ---------- */
  const E = {
    linear: (k) => k,
    inOut: (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2),
    out: (k) => 1 - Math.pow(1 - k, 3),
    in: (k) => k * k * k,
    outBack: (k) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
    },
    outQuint: (k) => 1 - Math.pow(1 - k, 5),
    inOutQuint: (k) => (k < 0.5 ? 16 * k * k * k * k * k : 1 - Math.pow(-2 * k + 2, 5) / 2)
  };

  /* ---------- 关键帧插值 ----------
     keys: [[t, value, easeName?], ...]
     easeName 作用于「进入该关键帧」的那一段 */
  function kf(t, keys, fallbackEase = 'inOut') {
    if (!keys.length) return 0;
    if (t <= keys[0][0]) return keys[0][1];
    const last = keys[keys.length - 1];
    if (t >= last[0]) return last[1];
    for (let i = 1; i < keys.length; i++) {
      const [t1, v1, eName] = keys[i];
      if (t <= t1) {
        const [t0, v0] = keys[i - 1];
        const k = (t - t0) / (t1 - t0 || 1);
        return lerp(v0, v1, E[eName || fallbackEase](clamp01(k)));
      }
    }
    return last[1];
  }

  /* ---------- 画布 ---------- */
  function makeCanvas(w, h, dpr = 2) {
    const c = document.createElement('canvas');
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    const x = c.getContext('2d');
    x.scale(dpr, dpr);
    return { canvas: c, ctx: x, w, h };
  }

  function roundRect(x, px, py, w, h, r) {
    x.beginPath();
    x.moveTo(px + r, py);
    x.arcTo(px + w, py, px + w, py + h, r);
    x.arcTo(px + w, py + h, px, py + h, r);
    x.arcTo(px, py + h, px, py, r);
    x.arcTo(px, py, px + w, py, r);
    x.closePath();
  }

  /* 一条有毛边的纸片路径（撕纸感） */
  function tornRect(x, px, py, w, h, jitter = 3, seed = 7) {
    const r = rng(seed);
    const step = 26;
    x.beginPath();
    x.moveTo(px, py);
    for (let i = step; i < w; i += step) x.lineTo(px + i, py + (r() - 0.5) * jitter * 2);
    for (let i = step; i < h; i += step) x.lineTo(px + w + (r() - 0.5) * jitter * 2, py + i);
    for (let i = w - step; i > 0; i -= step) x.lineTo(px + i, py + h + (r() - 0.5) * jitter * 2);
    for (let i = h - step; i > 0; i -= step) x.lineTo(px + (r() - 0.5) * jitter * 2, py + i);
    x.closePath();
  }

  /* 逐字显示：返回已显示的字符数 */
  function typedCount(t, start, perChar, total) {
    if (t < start) return 0;
    return Math.min(total, Math.floor((t - start) / perChar) + 1);
  }

  /* 打字机光标闪烁（按 30fps 帧号，确定性） */
  function caretOn(frame) {
    return Math.floor(frame / 15) % 2 === 0;
  }

  MV.util = {
    rng, clamp, clamp01, lerp, invlerp, E, kf,
    makeCanvas, roundRect, tornRect, typedCount, caretOn
  };
})(window.MV);
