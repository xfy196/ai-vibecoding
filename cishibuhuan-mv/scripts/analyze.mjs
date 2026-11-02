/**
 * 音频分析：能量包络 / 鼓点节拍网格 / 乐句间隙
 *
 * 用法：
 *   node scripts/analyze.mjs <audio.mp3> [--duration=70]
 *
 * 输出 audio/analysis.json：{ bpm, firstBeat, beatDur, beats[], dips[], envelope[] }
 *   bpm / firstBeat / beatDur → 写进 data/spec.json 的 beat 字段（道具跟着鼓点弹动）
 *   dips（能量低谷）→ 核对歌词断句时间用
 */
import { execFile, execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveFfmpeg } from './lib/paths.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FF = await resolveFfmpeg();

const argv = process.argv.slice(2);
const SRC = argv.find((a) => !a.startsWith('--'));
if (!SRC) {
  console.error('用法: node scripts/analyze.mjs <audio.mp3> [--duration=70]');
  process.exit(1);
}
const durArg = argv.find((a) => a.startsWith('--duration='));
const DURATION = durArg ? Number(durArg.split('=')[1]) : 70;
const SR = 22050;

function decodeS16() {
  return new Promise((res, rej) => {
    execFile(
      FF,
      ['-v', 'error', '-i', SRC, '-t', String(DURATION), '-ac', '1', '-ar', String(SR), '-f', 's16le', '-'],
      { maxBuffer: 1 << 30, encoding: 'buffer' },
      (err, stdout) => (err ? rej(err) : res(stdout))
    );
  });
}

/* 精简版 ffmpeg 没有 s16le muxer：退回「写成 wav，再剥掉 RIFF 头」 */
function decodeWav() {
  const dir = resolve(ROOT, 'audio');
  mkdirSync(dir, { recursive: true });
  const tmp = resolve(dir, '_decode.wav');
  execFileSync(FF, ['-v', 'error', '-y', '-i', SRC, '-t', String(DURATION), '-ac', '1', '-ar', String(SR), '-f', 'wav', tmp]);
  const b = readFileSync(tmp);
  let off = 12;
  while (off + 8 <= b.length) {
    const id = b.toString('ascii', off, off + 4);
    const sz = b.readUInt32LE(off + 4);
    if (id === 'data') return b.subarray(off + 8, Math.min(b.length, off + 8 + sz));
    off += 8 + sz + (sz % 2);
  }
  return b.subarray(44);
}

let buf = null;
try { buf = await decodeS16(); } catch {}
if (!buf || buf.length < 1024) buf = decodeWav();
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

// 低频包络（鼓）
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

const onset = new Float32Array(frames);
for (let f = 1; f < frames; f++) onset[f] = Math.max(0, lowRms[f] - lowRms[f - 1]);

const fpsEnv = 50;
let best = { bpm: 0, score: -1 };
for (let bpm = 60; bpm <= 160; bpm += 0.5) {
  const lag = Math.round((60 / bpm) * fpsEnv);
  if (lag < 2 || lag >= frames / 2) continue;
  let s = 0;
  for (let i = 0; i + lag < frames; i++) s += onset[i] * onset[i + lag];
  s /= frames - lag;
  const prior = bpm > 66 && bpm < 100 ? 1.15 : 0.9;
  if (s * prior > best.score) best = { bpm, score: s * prior };
}

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
const beatDur = 60 / best.bpm;
const beats = [];
for (let t = firstBeat; t < DURATION; t += beatDur) beats.push(+t.toFixed(3));

const dips = [];
const win = 25;
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
  resolve(ROOT, 'audio/analysis.json'),
  JSON.stringify({
    bpm: best.bpm,
    firstBeat: +firstBeat.toFixed(3),
    beatDur: +beatDur.toFixed(4),
    beats,
    dips,
    envelope: Array.from({ length: Math.min(frames, 4000) }, (_, i) => +rms[i].toFixed(3)),
    lowEnvelope: Array.from({ length: Math.min(frames, 4000) }, (_, i) => +lowRms[i].toFixed(3))
  })
);

console.log(`BPM ${best.bpm} | beatDur ${beatDur.toFixed(4)} | firstBeat ${firstBeat.toFixed(2)}`);
console.log('前 24 拍:', beats.slice(0, 24).map((b) => b.toFixed(2)).join(' '));
console.log('能量低谷:', dips.filter((d) => d < DURATION).join(' '));
console.log('→ audio/analysis.json');
