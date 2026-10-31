// 音频分析：能量包络、鼓点/节拍网格、乐句间隙
import { execFile } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const FF = '/Users/xufuying/Desktop/projects/opencode 工作台/wangji-shijian/bin/ffmpeg';
const SRC = '/Users/xufuying/Downloads/M800003Y2CjS19ttwQ.mp3';
const SR = 22050;

function decode() {
  return new Promise((res, rej) => {
    execFile(
      FF,
      ['-v', 'error', '-i', SRC, '-t', '70', '-ac', '1', '-ar', String(SR), '-f', 's16le', '-'],
      { maxBuffer: 1 << 30, encoding: 'buffer' },
      (err, stdout) => (err ? rej(err) : res(stdout))
    );
  });
}

const buf = await decode();
const n = Math.floor(buf.length / 2);
const pcm = new Float32Array(n);
for (let i = 0; i < n; i++) pcm[i] = buf.readInt16LE(i * 2) / 32768;

const hop = 441; // 20ms
const frames = Math.floor(n / hop);
const rms = new Float32Array(frames);
for (let f = 0; f < frames; f++) {
  let s = 0;
  for (let i = 0; i < hop; i++) {
    const v = pcm[f * hop + i] || 0;
    s += v * v;
  }
  rms[f] = Math.sqrt(s / hop);
}

// 低频（鼓点）能量：简易一阶低通后的包络
const lp = new Float32Array(n);
let y = 0;
const a = 0.02;
for (let i = 0; i < n; i++) {
  y += a * (pcm[i] - y);
  lp[i] = y;
}
const lowRms = new Float32Array(frames);
for (let f = 0; f < frames; f++) {
  let s = 0;
  for (let i = 0; i < hop; i++) {
    const v = lp[f * hop + i] || 0;
    s += v * v;
  }
  lowRms[f] = Math.sqrt(s / hop);
}

// 节拍：低频能量上升沿 + 自相关测 BPM
const onset = new Float32Array(frames);
for (let f = 1; f < frames; f++) onset[f] = Math.max(0, lowRms[f] - lowRms[f - 1]);

const fpsEnv = 50; // 每秒 50 帧
let best = { bpm: 0, score: -1 };
for (let bpm = 60; bpm <= 160; bpm += 0.5) {
  const lag = Math.round((60 / bpm) * fpsEnv);
  if (lag < 2 || lag >= frames / 2) continue;
  let s = 0;
  for (let i = 0; i + lag < frames; i++) s += onset[i] * onset[i + lag];
  s /= frames - lag;
  // 对齐人气区间（流行抒情 ~68-90）
  const prior = bpm > 66 && bpm < 96 ? 1.15 : 0.9;
  if (s * prior > best.score) best = { bpm, score: s * prior };
}

// 用最佳 BPM 找相位
const period = (60 / best.bpm) * fpsEnv;
let phaseBest = { phase: 0, score: -1 };
for (let p = 0; p < period; p += 0.5) {
  let s = 0;
  let k = 0;
  for (let i = p; i < frames; i += period) {
    s += onset[Math.round(i)] || 0;
    k++;
  }
  if (s / k > phaseBest.score) phaseBest = { phase: p, score: s / k };
}

const firstBeat = phaseBest.phase / fpsEnv;
const beats = [];
for (let t = firstBeat; t < 70; t += 60 / best.bpm) beats.push(+t.toFixed(3));

// 乐句间隙：整体能量（含人声）在局部范围内的低谷
const dips = [];
const win = 25; // ±0.5s
for (let f = win; f < frames - win; f++) {
  let isMin = true;
  for (let j = f - win; j <= f + win; j++) {
    if (rms[j] < rms[f]) { isMin = false; break; }
  }
  if (isMin) {
    const t = f / fpsEnv;
    if (!dips.length || t - dips[dips.length - 1] > 0.45) dips.push(+t.toFixed(2));
  }
}

mkdirSync(resolve(ROOT, 'audio'), { recursive: true });
writeFileSync(
  resolve(ROOT, 'audio', 'analysis.json'),
  JSON.stringify(
    {
      bpm: best.bpm,
      firstBeat: +firstBeat.toFixed(3),
      beats,
      dips,
      envelope: Array.from({ length: Math.min(frames, 3500) }, (_, i) => +rms[i].toFixed(3)),
      lowEnvelope: Array.from({ length: Math.min(frames, 3500) }, (_, i) => +lowRms[i].toFixed(3)),
    },
    null,
    0
  )
);

console.log('BPM', best.bpm, 'firstBeat', firstBeat.toFixed(2));
console.log('前 40 个鼓点:', beats.slice(0, 40).map((b) => b.toFixed(2)).join(' '));
console.log('能量低谷(秒):', dips.filter((d) => d < 65).join(' '));
