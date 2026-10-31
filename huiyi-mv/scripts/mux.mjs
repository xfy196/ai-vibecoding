/* 合片：帧序列 + 原曲前 60 秒 → mp4 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FF = '/Users/xufuying/Desktop/projects/opencode 工作台/wangji-shijian/bin/ffmpeg';
const SRC = '/Users/xufuying/Downloads/M800003Y2CjS19ttwQ.mp3';

mkdirSync(resolve(ROOT, 'audio'), { recursive: true });
mkdirSync(resolve(ROOT, 'out'), { recursive: true });

const song = resolve(ROOT, 'audio/song60.m4a');
if (!existsSync(song)) {
  console.log('→ 截取原曲前 60 秒');
  execFileSync(FF, [
    '-y', '-v', 'error', '-i', SRC, '-t', '60',
    '-af', 'afade=t=in:st=0:d=0.12,afade=t=out:st=59.0:d=1.0',
    '-c:a', 'aac', '-b:a', '224k', song
  ], { stdio: 'inherit' });
}

const out = resolve(ROOT, 'out/把回忆拼好给你_立体书MV_60s.mp4');
console.log('→ 合成视频');
execFileSync(FF, [
  '-y', '-v', 'warning', '-stats',
  '-framerate', '30',
  '-i', resolve(ROOT, 'out/frames/%05d.jpg'),
  '-i', song,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
  '-pix_fmt', 'yuv420p', '-r', '30',
  '-c:a', 'aac', '-b:a', '224k',
  '-shortest', '-movflags', '+faststart',
  out
], { stdio: 'inherit' });

console.log('✔', out);
