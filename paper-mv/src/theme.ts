export const W = 1920;
export const H = 1080;
export const FPS = 30;

/** 100 BPM at 30 fps: one beat is exactly 18 frames (0.6 s). */
export const BEAT = 18;
export const DURATION_IN_FRAMES = 723; // 24.1 s
export const DURATION_IN_SECONDS = 24.1;

/** Cut points from the brief. Each one is a frame-perfect hard cut. */
export const CUTS_SECONDS = [0, 3.6, 5.7, 7.4, 10.4, 13.8, 17.3, 20.2, 22.4, 24.1];
export const CUTS_FRAMES = CUTS_SECONDS.map((s) => Math.round(s * FPS));

export const SHOT_NAMES = [
  '① 启航',
  '② 孤夜',
  '③ 想着你',
  '④ 不惶恐',
  '⑤ 人来人往',
  '⑥ 离开',
  '⑦ 感谢',
  '⑧ 你眼中',
  '⑨ 尾声',
];

export interface ShotSpan {
  index: number;
  from: number;
  to: number;
  dur: number;
  beats: number;
}

export const SHOTS: ShotSpan[] = CUTS_FRAMES.slice(0, -1).map((from, i) => {
  const to = CUTS_FRAMES[i + 1];
  return { index: i + 1, from, to, dur: to - from, beats: (to - from) / BEAT };
});

// ------------------------------------------------------------------ palette
export const C = {
  inkDeep: '#050a18',
  ink: '#0a1228',
  night1: '#0d1a3c',
  night2: '#132450',
  night3: '#1b3168',
  sea1: '#16305c',
  sea2: '#1c4177',
  sea3: '#24568f',
  sea4: '#2f6ea5',
  foam: '#cfe3f2',
  cream: '#f7efdc',
  moon: '#f8f0d8',
  moon2: '#e8dcbb',
  amber: '#ffb347',
  amber2: '#ffd489',
  amber3: '#ff8a3c',
  warm: '#ff9b52',
  whale: '#2f6191',
  whale2: '#3d7cb0',
  dusk1: '#f9c0a9',
  dusk2: '#f0a191',
  dusk3: '#de8296',
  dusk4: '#b0638f',
  dusk5: '#7b477f',
  dusk6: '#4b2f60',
  plum: '#2b1a3f',
  gold: '#ffc65c',
  gold2: '#ffe6ae',
  gold3: '#f6a935',
  paper: '#fbf6ea',
  teal: '#0e2f45',
  teal2: '#14465f',
};

export function hexToRgb(h: string): [number, number, number] {
  const s = h.replace('#', '');
  const v = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Blend two paper colours (used for the cool -> warm shifts). */
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
