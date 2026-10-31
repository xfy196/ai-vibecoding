import http from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { extname, join, normalize, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PORT = 4174;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const srv = await new Promise((r) => {
  const s = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/public/index.html';
    const f = normalize(join(ROOT, p));
    if (!f.startsWith(ROOT) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' });
    createReadStream(f).pipe(res);
  });
  s.listen(PORT, '127.0.0.1', () => r(s));
});

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox'],
  defaultViewport: { width: 1920, height: 1080 }
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${PORT}/public/index.html`, { waitUntil: 'load' });
await page.waitForFunction('window.__ready === true', { timeout: 60000 });
const t = Number(process.argv[2] || 0.8);
const out = await page.evaluate((tt) => {
  try { window.renderPNG(tt); return 'ok'; } catch (e) { return e.stack || String(e); }
}, t);
console.log(out);
await browser.close();
srv.close();
