/* 静态服务器 + puppeteer-core 无头 Chrome 逐帧渲染 */
import http from 'node:http';
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PORT = 4173;

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

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const args = process.argv.slice(2);
const mode = args.includes('--stills') ? 'stills' : 'all';
const only = args.filter((a) => /^\d+(\.\d+)?$/.test(a)).map(Number);
const fromArg = args.find((a) => a.startsWith('--from='));
const toArg = args.find((a) => a.startsWith('--to='));
const FROM = fromArg ? Number(fromArg.split('=')[1]) : 0;
const TO = toArg ? Number(toArg.split('=')[1]) : null;

const FPS = 30;
const DUR = 60;

const srv = await serve();
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--force-color-profile=srgb', '--hide-scrollbars', '--mute-audio'],
  defaultViewport: { width: W(), height: 1080, deviceScaleFactor: 1 }
});
function W() { return 1920; }

const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text()); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${PORT}/public/index.html`, { waitUntil: 'load' });
await page.waitForFunction('window.__ready === true', { timeout: 60000 });

const dataDir = join(ROOT, 'out');
mkdirSync(dataDir, { recursive: true });

if (mode === 'stills') {
  const times = only.length ? only : [0.8, 4.5, 7.5, 10.5, 13.6, 16.5, 20, 24, 30, 35.5, 38.5, 41.5, 45, 47.5, 50.5, 54, 56.4, 58.9, 59.5];
  const dir = join(dataDir, 'stills');
  mkdirSync(dir, { recursive: true });
  for (const t of times) {
    const dataUrl = await page.evaluate((tt) => window.renderPNG(tt), t);
    const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
    writeFileSync(join(dir, `still_${String(t).replace('.', '_')}.png`), buf);
  }
  console.log('stills ->', dir);
} else {
  const dir = join(dataDir, 'frames');
  mkdirSync(dir, { recursive: true });
  const total = TO === null ? DUR * FPS : Math.min(TO, DUR * FPS);
  const t0 = Date.now();
  for (let i = FROM; i < total; i++) {
    const t = i / FPS;
    const dataUrl = await page.evaluate((tt) => window.renderFrame(tt), t);
    const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
    writeFileSync(join(dir, `${String(i).padStart(5, '0')}.jpg`), buf);
    if (i % 60 === 0) {
      const el = (Date.now() - t0) / 1000;
      const eta = (el / (i + 1)) * (total - i - 1);
      console.log(`frame ${i}/${total}  ${el.toFixed(1)}s elapsed  eta ${eta.toFixed(0)}s`);
    }
  }
  console.log('frames done in', ((Date.now() - t0) / 1000).toFixed(1), 's');
}

await browser.close();
srv.close();
