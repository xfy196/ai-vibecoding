/**
 * 风格试片截图：把 previews/styles.html 里每个 .frame 存成 1920×1080 PNG
 *
 * 用法：node scripts/keyart.mjs [previews/styles.html] [--out=out/previews]
 */
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import { resolveChrome } from './lib/paths.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const SRC = resolve(ROOT, argv.find((a) => !a.startsWith('--')) || 'previews/styles.html');
const OUT = resolve(ROOT, (argv.find((a) => a.startsWith('--out=')) || '--out=out/previews').split('=')[1]);
mkdirSync(OUT, { recursive: true });

const W = 1920;

const browser = await puppeteer.launch({
  executablePath: resolveChrome(),
  headless: 'new',
  args: [`--window-size=${W},1080`, '--force-color-profile=srgb', '--hide-scrollbars']
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: 1080, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(SRC).href, { waitUntil: 'load' });
await page.evaluate(() => document.fonts && document.fonts.ready);

const ids = await page.$$eval('.frame', (els) => els.map((e) => e.id));
for (const id of ids) {
  const el = await page.$(`#${id}`);
  const box = await el.boundingBox();
  const file = resolve(OUT, `${id}.png`);
  await page.screenshot({ path: file, clip: box });
  console.log('✔', file);
}
await browser.close();
