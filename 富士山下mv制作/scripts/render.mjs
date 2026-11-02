/**
 * 逐帧渲染：静态服务器 + puppeteer-core 驱动本机 Chrome 无头模式
 *
 * 用法：
 *   node scripts/render.mjs --stills [t1 t2 ...]   只出关键帧 → out/stills/
 *   node scripts/render.mjs                         全片 → out/frames/%05d.jpg
 *   node scripts/render.mjs --from=1200 --to=1390   只重渲一段（改完某几场后补帧用）
 *
 * 时长/帧率/尺寸来自 data/spec.json。
 */
import http from 'node:http';
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { resolveChrome } from './lib/paths.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SPEC = JSON.parse(readFileSync(join(ROOT, 'data/spec.json'), 'utf8'));
const FPS = SPEC.fps || 30;
const DUR = SPEC.duration || 60;
const WIDTH = SPEC.width || 1920;
const HEIGHT = SPEC.height || 1080;

const PORT = Number(process.env.PORT || 4173);
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
};

function serve() {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/public/index.html';
    const file = normalize(join(ROOT, p));
    if (!file.startsWith(ROOT) || !existsSync(file)) {
      res.writeHead(404); res.end('not found'); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((r) => srv.listen(PORT, '127.0.0.1', () => r(srv)));
}

const args = process.argv.slice(2);
const stills = args.includes('--stills');
const only = args.filter((a) => /^\d+(\.\d+)?$/.test(a)).map(Number);
const fromArg = args.find((a) => a.startsWith('--from='));
const toArg = args.find((a) => a.startsWith('--to='));
const FROM = fromArg ? Number(fromArg.split('=')[1]) : 0;
const TO = toArg ? Number(toArg.split('=')[1]) : null;
const quality = Number((args.find((a) => a.startsWith('--q=')) || '--q=0.94').split('=')[1]);

const srv = await serve();
const browser = await puppeteer.launch({
  executablePath: resolveChrome(),
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--force-color-profile=srgb', '--hide-scrollbars', '--mute-audio'],
  defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 }
});

const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text()); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${PORT}/public/index.html`, { waitUntil: 'load' });
await page.waitForFunction('window.__ready === true', { timeout: 60000 });

mkdirSync(join(ROOT, 'out'), { recursive: true });

if (stills) {
  const times = only.length ? only : defaultStills();
  const dir = join(ROOT, 'out/stills');
  mkdirSync(dir, { recursive: true });
  for (const t of times) {
    const dataUrl = await page.evaluate((tt) => window.renderPNG(tt), t);
    writeFileSync(join(dir, `still_${String(t).replace('.', '_')}.png`), Buffer.from(dataUrl.split(',')[1], 'base64'));
  }
  console.log('stills →', dir);
} else {
  const dir = join(ROOT, 'out/frames');
  mkdirSync(dir, { recursive: true });
  const total = Math.min(TO ?? DUR * FPS, DUR * FPS);
  const t0 = Date.now();
  for (let i = FROM; i < total; i++) {
    const dataUrl = await page.evaluate((tt) => window.renderFrame(tt), i / FPS);
    writeFileSync(join(dir, `${String(i).padStart(5, '0')}.jpg`), Buffer.from(dataUrl.split(',')[1], 'base64'));
    if (i % 60 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`frame ${i}/${total}  ${el.toFixed(1)}s  eta ${((el / (i - FROM + 1)) * (total - i - 1)).toFixed(0)}s`);
    }
  }
  console.log(`frames ${FROM}..${total - 1} done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  if (FROM === 0 && total === DUR * FPS) console.log('下一步: node scripts/mux.mjs <audio>');
}

function defaultStills() {
  const list = [];
  for (const s of SPEC.scenes) list.push(+(s.t + Math.min(1.0, (SPEC.duration - s.t) / 2)).toFixed(2));
  return list;
}

await browser.close();
srv.close();
