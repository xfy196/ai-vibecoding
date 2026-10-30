// karaoke.js: 毛笔字歌词，逐字填充。歌词条占 y ≈ 975–1070，所以画面主要动作全部压在 y < 940。
// LY = [起, 止, "词", opts]。时间就是歌曲时间（本片没有裁切，clip 时间 = 歌曲时间）。
const LY = [
  [33.538, 40.979, '沉默着走了有 多遥远'],
  [40.979, 47.784, '抬起头 蓦然间 才发现'],
  [47.784, 55.374, '一直倒退 倒退到原点'],
  [55.374, 63.129, '倔强坚持 对抗时间'],
  [63.129, 70.522, '说好了的永远 断了线'],
  [70.522, 77.331, '期许了 不变的 却都已改变'],
  [77.331, 84.464, '紧闭 双眼 才能看的见'],
  [84.464, 91.290, '那些曾经温暖 鲜艳过的画面'],
  [91.290, 95.046, '渐渐地忘记 赶不上明天'],
  [95.046, 99.231, '只要用力地抓紧了想念'],
  [99.231, 106.106, '明天再也 没有你的笑脸'],
  [106.106, 109.791, '渐渐地忘记 忘记了时间'],
  [109.791, 114.306, '我只要沿着记忆的路线'],
  [114.306, 122.103, '到最深处 纵然那只是瞬间'],
  [122.103, 129.437, '当眼泪 滑落的 是句点'],
  [129.437, 136.389, '心里面 始终你 从没有走远'],
  [136.389, 143.409, '耳边 誓言 还在回旋'],
  [143.409, 149.500, '我会好好珍惜 没有你的明天'],
  [179.930, 183.587, '渐渐地忘记 赶不上明天'],
  [183.587, 187.783, '只要用力地抓紧了想念'],
  [187.783, 194.676, '明天再也 没有你的笑脸'],
  [194.676, 198.356, '渐渐地忘记 忘记了时间'],
  [198.356, 202.805, '我只要沿着记忆的路线'],
  [202.805, 209.467, '到最深处 纵然那只是瞬间'],
  [209.467, 213.198, '渐渐地忘记 忘记了时间'],
  [213.198, 217.604, '我只要沿着记忆的路线'],
  [217.604, 224.000, '到最深处 纵然那只是瞬间'],
];
const KFONT = '"Ma Shan Zheng", "Kaiti SC", "STKaiti", serif';
window.EXTRA_FONTS = [[`64px ${KFONT}`, LY.map(l => l[2]).join('')]];

// 全局微调（秒）：正数 = 歌词整体往后推。只有在核对过成片、确认整片统一偏晚/偏早时才改，
// 改 config.js 里的 PROJECT.lyricOffset，不要在这里写死。
const LOFF = (typeof PROJECT !== 'undefined' && PROJECT.lyricOffset) || 0;

window.overlayHook = (c, t) => {
  const u = t - LOFF;
  const i = LY.findIndex(l => u >= l[0] && u < l[1]);
  if (i >= 0) kLine(c, LY[i], u, 1024, 1, 1, false);
};
function kLine(c, L, t, y, sc, alpha, held) {
  const [a, b, txt, opt = {}] = L;
  const grow = easeOut((t - a) / .18) * (1 - ease((t - (b - .12)) / .12));
  if (grow < .02 || alpha <= .01) return;
  c.save(); c.globalAlpha = alpha; c.translate(960, y); c.scale(sc, sc); c.translate(-960, -y);
  c.font = `56px ${KFONT}`; c.textBaseline = 'middle'; c.textAlign = 'left';
  const total = c.measureText(txt).width;
  const w = (total + 96) * grow, x0 = 960 - w / 2, y0 = y - 42, r = n => hash(BOILN * 13 + n) * 8 - 4;
  c.globalAlpha = .55 * alpha; c.fillStyle = PAL.ink; c.beginPath();
  c.moveTo(x0 + r(1), y0 + r(2)); c.lineTo(x0 + w / 2, y0 - 5 + r(3)); c.lineTo(x0 + w + r(4), y0 + r(5));
  c.lineTo(x0 + w + 14, y0 + 42); c.lineTo(x0 + w + r(6), y0 + 84 + r(7)); c.lineTo(x0 + w / 2, y0 + 88 + r(8));
  c.lineTo(x0 + r(9), y0 + 84 + r(10)); c.lineTo(x0 - 14, y0 + 42); c.closePath(); c.fill();
  c.globalAlpha = alpha;
  if (grow > .85) {
    // 逐字填充必须覆盖这一行真正的演唱长度：LRC 里下一行的起点就是这行唱完的时刻，
    // 所以 (b - a) 本身就是这句话的演唱时长，* .85 留出换气的尾巴。
    // 原实现额外卡了个 n * .3（0.3 秒/字）的上限，而慢歌每字实际要 0.6–0.8 秒，
    // 这个上限比真实演唱快 2–3 倍 —— 27 行里有 22 行的字在唱完前 2–5 秒就全变色了，
    // 表现就是"字幕跑在声音前面 / 歌词对不上声音"。别再加回来。
    const singDur = opt.sing ?? (b - a) * .85, f = clamp((t - a) / singDur);
    const x = 960 - total / 2;
    c.fillStyle = PAL.cream; c.fillText(txt, x, y);
    c.save(); c.beginPath(); c.rect(x - 2, y - 50, total * f + 2, 100); c.clip(); c.fillStyle = PAL.ochre; c.fillText(txt, x, y); c.restore();
  }
  c.restore();
}
