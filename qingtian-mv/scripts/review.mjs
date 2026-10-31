// review.mjs — the checks check.sh runs, re-routed for a stripped ffmpeg (no tblend / volumedetect /
// signalstats / tile). Same metrics: mean |frame diff| per 0.5 s, and the score's level per second.
// Usage: FFMPEG_DIR=<dir with ffmpeg> node scripts/review.mjs [out/film.mp4]
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readdirSync, readFileSync, rmSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const bin = process.argv[2] ?? 'out/film.mp4';
const FF = process.env.FFMPEG_DIR ? `${process.env.FFMPEG_DIR}/ffmpeg` : 'ffmpeg';
const W = 192, H = 108;

// minimal 8-bit greyscale PNG reader (filters 0-4)
const readPng = (file) => {
  const b = readFileSync(file);
  let p = 8, w = 0, h = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p);
    const type = b.toString('ascii', p + 4, p + 8);
    const data = b.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  if (bitDepth !== 8 || colorType !== 0) throw new Error(`${file}: expected 8-bit grey, got depth ${bitDepth} type ${colorType}`);
  const raw = inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(w * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (w + 1)];
    const src = raw.subarray(y * (w + 1) + 1, (y + 1) * (w + 1));
    for (let x = 0; x < w; x++) {
      const a = x > 0 ? out[y * w + x - 1] : 0;
      const up = y > 0 ? out[(y - 1) * w + x] : 0;
      const c = x > 0 && y > 0 ? out[(y - 1) * w + x - 1] : 0;
      let v = src[x];
      if (f === 1) v += a;
      else if (f === 2) v += up;
      else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) {
        const pa = Math.abs(up - c), pb = Math.abs(a - c), pc = Math.abs(a + up - 2 * c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c;
      }
      out[y * w + x] = v & 255;
    }
  }
  return out;
};

const dir = mkdtempSync(join(tmpdir(), 'curve-'));
execFileSync(FF, ['-v', 'error', '-i', bin, '-vf', `scale=${W}:${H},format=gray`, '-r', '2', join(dir, '%04d.png')]);
const files = readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
const frames = files.map((f) => readPng(join(dir, f)));
rmSync(dir, {recursive: true, force: true});

const curve = [];
for (let i = 1; i < frames.length; i++) {
  let s = 0;
  for (let k = 0; k < frames[i].length; k++) s += Math.abs(frames[i][k] - frames[i - 1][k]);
  curve.push(s / frames[i].length);
}
const sorted = [...curve].sort((a, b) => a - b);
const median = sorted[Math.floor(sorted.length / 2)] || 0.05;
console.log(`${files.length} samples · motion per 0.5 s (mean |frame diff|, 0-255) · median ${median.toFixed(2)}`);
curve.forEach((v, i) => {
  const flag = v > 4 * median && v > 1 ? '  <-- spike' : v < 0.005 ? '  (still)' : '';
  if (flag || i % 4 === 0) console.log(`${(i * 0.5).toFixed(1).padStart(6)}s ${v.toFixed(2).padStart(6)}${flag}`);
});
const dead = curve.filter((v) => v < 0.005).length;
console.log(`frames that never changed: ${dead} / ${curve.length}`);

// the score, straight off the PCM: RMS per second
try {
  const wav = readFileSync('public/score.wav');
  const data = wav.subarray(44), SR = 48000, secs = Math.floor(data.length / 4 / SR);
  const rms = [];
  for (let s = 0; s < secs; s++) {
    let acc = 0;
    for (let i = s * SR; i < (s + 1) * SR; i++) {
      const v = data.readInt16LE(i * 4) / 32768;
      acc += v * v;
    }
    rms.push(20 * Math.log10(Math.sqrt(acc / SR) + 1e-12));
  }
  const audible = rms.map((d, s) => ({s, d})).filter((x) => x.d > -55);
  console.log(`\nscore: audible seconds ${audible.map((x) => `${x.s}s ${x.d.toFixed(0)}dB`).join(' · ') || 'none'}`);
  console.log(`score: silent seconds ${rms.length - audible.length} / ${rms.length}`);
} catch {
  console.log('\nscore: public/score.wav not readable');
}
