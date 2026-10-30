export const W = 1920;
export const H = 1080;
export const FPS = 30;

/** 279.147 s of song at 30 fps, rounded down so we never overshoot the audio. */
export const DURATION_IN_FRAMES = 8374;
export const DURATION_IN_SECONDS = 279.147;

/** Tempo measured from the song (assets/analyze_song.py): 66.3 BPM. */
export const BPM = 66.3;
export const BEAT_SECONDS = 60 / BPM; // 0.905 s
export const BEAT = BEAT_SECONDS * FPS; // 27.15 frames
export const BAR = BEAT * 4;

/** seconds -> absolute frame (for cue placement). */
export const f = (seconds: number) => Math.round(seconds * FPS);

// ---------------------------------------------------------------- shot table
export interface ShotSpan {
  index: number;
  name: string;
  section: string;
  from: number;
  to: number;
  dur: number;
}

const cuts = [
  [0, '① 窗阵隧道', '引子', 0],
  [900, '② 俯视平铺', '电视已经闪 · 联络方式都还没删', 30.0],
  [1817, '③ 左右对开', '墙板被我砸烂 · 一碗热的粥', 60.56],
  [2603, '④ 仰视塔群', '假如我年少有为不自卑', 86.78],
  [3523, '⑤ 雨窗微距', '间奏', 117.42],
  [4367, '⑥ 房屋剖面', '也曾一起想 有个地方睡觉吃饭', 145.58],
  [5664, '⑦ 极低地平线', '那些美梦 没给你', 188.8],
  [6715, '⑧ 前景巨物', '尝过后悔的滋味 · 金钱地位', 223.82],
  [7627, '⑨ 极简留白', '祝我年少有为', 254.22],
] as const;

export const SHOTS: ShotSpan[] = cuts.map(([from, name, section], i) => {
  const to = i + 1 < cuts.length ? cuts[i + 1][0] : DURATION_IN_FRAMES;
  return { index: i + 1, name, section, from, to, dur: to - from };
});

export const CUT_FRAMES = cuts.map((c) => c[0]);

// ------------------------------------------------------------------- lyrics
/** Lyric lines with their timestamps, straight from the .lrc (offset 0). */
export const LYRICS: { at: number; text: string }[] = [
  { at: 30.0, text: '电视已经闪' },
  { at: 33.06, text: '联络方式都还没删' },
  { at: 36.38, text: '你待我的好 我却措手毁掉' },
  { at: 44.0, text: '也曾一起想' },
  { at: 47.58, text: '有个地方睡觉吃饭' },
  { at: 50.88, text: '可怎么去熬 日夜颠倒' },
  { at: 55.12, text: '连头款也凑不到' },
  { at: 60.56, text: '墙板被我砸烂 到现在还没修' },
  { at: 65.36, text: '一碗热的粥 你怕我没够' },
  { at: 69.92, text: '都留一半带走' },
  { at: 72.26, text: '给你形容美好今后' },
  { at: 76.72, text: '你常常眼睛挥红' },
  { at: 80.06, text: '原来心疼我 我那时候不懂' },
  { at: 86.78, text: '假如我年少 有为不自卑' },
  { at: 91.28, text: '懂得什么是珍贵 那些美梦' },
  { at: 97.3, text: '没给你 我一生有愧' },
  { at: 101.28, text: '假如我年少 有为知进退' },
  { at: 105.82, text: '才不会让你 替我受罪' },
  { at: 110.0, text: '婚礼上 多喝几杯' },
  { at: 113.42, text: '和你现在那位' },
  { at: 145.58, text: '也曾一起想' },
  { at: 149.22, text: '有个地方睡觉吃饭' },
  { at: 152.66, text: '可怎么去熬 日夜颠倒' },
  { at: 158.72, text: '连头款也凑不到' },
  { at: 162.36, text: '墙板被我砸烂 到现在还没修' },
  { at: 167.16, text: '一碗热的粥 你怕我没够' },
  { at: 171.68, text: '都留一半带走 给你形容' },
  { at: 176.88, text: '你常常眼睛挥红' },
  { at: 181.88, text: '原来心疼我 我那时候不懂' },
  { at: 188.8, text: '假如我年少有为不自卑' },
  { at: 193.12, text: '懂得什么是珍贵' },
  { at: 195.78, text: '那些美梦没给你我一生有愧' },
  { at: 203.08, text: '假如我年少有为知进退' },
  { at: 207.64, text: '才不会让你替我受罪' },
  { at: 211.8, text: '婚礼上 多喝几杯' },
  { at: 214.9, text: '和你现在那位 假如我年少' },
  { at: 223.82, text: '有为不自卑 尝过后悔的滋味' },
  { at: 228.58, text: '金钱地位 搏到了 却好想退回' },
  { at: 235.8, text: '假如我年少 有为知进退' },
  { at: 240.38, text: '才不会让你替我受罪' },
  { at: 244.54, text: '婚礼上 多喝几杯 和你现在那位' },
  { at: 254.22, text: '在婚礼上多喝几杯' },
  { at: 258.58, text: '祝我年少有为' },
];

/** Absolute frame of a lyric line, by its exact timestamp. */
export const lyric = (seconds: number) => f(seconds);

// ------------------------------------------------------------------ palette
export const C = {
  // paper stock
  black: '#07080b',
  inkNight: '#070d18',
  ink1: '#0c1522',
  ink2: '#132436',
  ink3: '#1e3a52',
  ink4: '#2b4a63',
  slate: '#41586b',
  mist: '#8fa8b8',
  ice: '#cfe0ee',
  paper: '#f7f1e3',
  paper2: '#efe3c8',
  paper3: '#e0cfae',
  cream: '#f2e7d2',
  kraft: '#c9a06a',
  kraft2: '#8a5a34',
  wood: '#6b4326',

  // warm / gold
  gold: '#d8a24a',
  gold2: '#ffc45c',
  gold3: '#ffb347',
  amber: '#e07a3f',
  ember: '#a8562a',

  // red (剪纸红)
  red: '#a3272a',
  red2: '#c0392b',
  red3: '#7d1f1f',
  redDeep: '#3a0d10',

  // cold accents
  teal: '#16323a',
  teal2: '#204a4d',
  cyan: '#5f92a8',

  // misc
  smoke: '#6b6f76',
  moss: '#4c5a3f',
  white: '#ffffff',
};

export function hexToRgb(h: string): [number, number, number] {
  const s = h.replace('#', '');
  const v = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Blend two paper colours — the main tool for "the same sheet, another hour". */
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const k = Math.max(0, Math.min(1, t));
  return rgbToHex(r1 + (r2 - r1) * k, g1 + (g2 - g1) * k, b1 + (b2 - b1) * k);
}

export function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  if (amount >= 0) return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
  return rgbToHex(r * (1 + amount), g * (1 + amount), b * (1 + amount));
}

export const light = (hex: string, a = 0.18) => shade(hex, a);
export const dark = (hex: string, a = 0.18) => shade(hex, -a);
