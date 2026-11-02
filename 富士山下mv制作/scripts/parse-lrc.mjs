/**
 * LRC → data/lyrics.json
 *
 * 用法：node scripts/parse-lrc.mjs [lrc 路径] [--out=data/lyrics.json]
 *
 * 只保留演唱句（丢掉作词/作曲/制作人等版权行和末尾的制作名单），
 * 每句补一个 keyword 字段，给画面里"落字"用。
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const SRC = resolve(ROOT, argv.find((a) => !a.startsWith('--')) || 'reference/song.lrc');
const OUT = resolve(ROOT, (argv.find((a) => a.startsWith('--out=')) || '--out=data/lyrics.json').split('=')[1]);

/** 每句挑一个"题眼"，画面上放大、盖章或变色 */
const KEYWORDS = {
  '拦路雨偏似雪花 饮泣的你冻吗': '雪花',
  '这风褛我给你磨到有襟花': '风褛',
  '连调了职也不怕 怎么始终牵挂': '牵挂',
  '苦心选中今天想车你回家': '回家',
  '原谅我不再送花 伤口应要结疤': '结疤',
  '花瓣铺满心里坟场才害怕': '坟场',
  '如若你非我不嫁 彼此终必火化': '火化',
  '一生一世等一天需要代价': '代价',
  '谁都只得那双手靠拥抱亦难任你拥有': '拥有',
  '要拥有必先懂失去怎接受': '失去',
  '曾沿着雪路浪游 为何为好事泪流': '雪路',
  '谁能凭爱意要富士山私有': '私有',
  '何不把悲哀感觉假设是来自你虚构': '虚构',
  '试管里找不到它染污眼眸': '试管',
  '前尘硬化像石头 随缘地抛下便逃走': '石头',
  '我绝不罕有 往街里绕过一周': '罕有',
  '我便化乌有': '乌有',
  '情人节不要说穿 只敢抚你发端': '发端',
  '这种姿态可会令你更心酸': '心酸',
  '留在汽车里取暖 应该怎么规劝': '取暖',
  '怎么可以将手腕忍痛划损': '划损',
  '人活到几岁算短 失恋只有更短': '更短',
  '归家需要几里路谁能预算': '几里路',
  '忘掉我跟你恩怨 樱花开了几转': '樱花',
  '东京之旅一早比一世遥远': '东京',
  '你还嫌不够 我把这陈年风褛 送赠你解咒': '解咒'
};

const CREDIT = /^(作词|作曲|编曲|制作人|Produced|Production|Keyboards|Drums|Bass|Guitar|Percussion|Strings|Recorded|Engineered|Vocals|Mixed|OP:|SP:)/i;

const raw = readFileSync(SRC, 'utf8');
const lines = [];
for (const row of raw.split(/\r?\n/)) {
  const m = row.match(/^\[(\d+):(\d+)[.:](\d+)\](.*)$/);
  if (!m) continue;
  const t = Number(m[1]) * 60 + Number(m[2]) + Number(m[3].padEnd(3, '0')) / 1000;
  const text = m[4].trim();
  if (!text || CREDIT.test(text)) continue;
  lines.push({ t: Number(t.toFixed(3)), text });
}

const lyrics = lines.map((l, i) => ({
  ...l,
  keyword: KEYWORDS[l.text] || '',
  next: lines[i + 1] ? lines[i + 1].t : null
}));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ count: lyrics.length, lyrics }, null, 2) + '\n');
console.log(`✔ ${lyrics.length} 句 → ${OUT}`);
