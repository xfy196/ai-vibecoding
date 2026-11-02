/**
 * 合片：帧序列 + 原曲片段 → mp4
 *
 * 用法：
 *   node scripts/mux.mjs <audio.mp3> [--out 名字.mp4] [--fade=1.0] [--crf=17]
 *
 * 默认按 data/spec.json 的 duration 截取原曲，首 0.12s 淡入、末尾 fade 秒淡出，
 * 输出 out/<名字>.mp4（1920×1080 / 30fps / H.264 + AAC）。
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveFfmpeg } from './lib/paths.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FF = await resolveFfmpeg();
const SPEC = JSON.parse(readFileSync(resolve(ROOT, 'data/spec.json'), 'utf8'));
const DUR = SPEC.duration || 60;

const argv = process.argv.slice(2);
const SRC = argv.find((a) => !a.startsWith('--'));
if (!SRC) {
  console.error('用法: node scripts/mux.mjs <audio.mp3> [--out 名字.mp4] [--fade=1.0] [--crf=17]');
  process.exit(1);
}
const opt = (k, d) => {
  const hit = argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.split('=')[1] : d;
};
const FADE = Number(opt('fade', 1.0));
const CRF = Number(opt('crf', 17));
const OUT_NAME = opt('out', `${SPEC.title || basename(SRC, '.mp3')}_MV_${DUR}s.mp4`);

mkdirSync(resolve(ROOT, 'audio'), { recursive: true });
mkdirSync(resolve(ROOT, 'out'), { recursive: true });

const song = resolve(ROOT, `audio/song${DUR}.mp4`);
if (!existsSync(song)) {
  console.log('→ 截取原曲');
  // 精简版 ffmpeg 没有 afade，用 volume 的帧级包络做同样的淡入淡出
  const expr = FADE > 0
    ? `min(1,t/0.12)*min(1,max(0,(${DUR}-t)/${FADE}))`
    : 'min(1,t/0.12)';
  execFileSync(FF, [
    '-y', '-v', 'error', '-i', SRC, '-t', String(DUR),
    '-af', `volume=eval=frame:volume='${expr}'`,
    '-c:a', 'aac', '-b:a', '224k', song
  ], { stdio: 'inherit' });
}

const out = resolve(ROOT, 'out', OUT_NAME);
console.log('→ 合成视频');
execFileSync(FF, [
  '-y', '-v', 'warning', '-stats',
  '-framerate', String(SPEC.fps || 30),
  '-i', resolve(ROOT, 'out/frames/%05d.jpg'),
  '-i', song,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF),
  '-pix_fmt', 'yuv420p', '-r', String(SPEC.fps || 30),
  '-c:a', 'aac', '-b:a', '224k',
  '-shortest', '-movflags', '+faststart',
  out
], { stdio: 'inherit' });

console.log('✔', out);
