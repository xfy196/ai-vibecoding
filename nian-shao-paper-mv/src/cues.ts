import { f } from './theme';

export type SfxName =
  | 'paper_slide'
  | 'paper_swish'
  | 'paper_flip'
  | 'paper_tear'
  | 'paper_crack'
  | 'paper_fall'
  | 'paper_big'
  | 'paper_stamp'
  | 'tv_static'
  | 'tv_off'
  | 'phone_buzz'
  | 'ui_blip'
  | 'tape_rip'
  | 'clock_tick'
  | 'lamp_click'
  | 'spoon_tink'
  | 'steam_hiss'
  | 'wall_thud'
  | 'glass_clink'
  | 'coin_rain'
  | 'crowd_walla'
  | 'rain_loop'
  | 'thunder_far'
  | 'roof_wind'
  | 'room_tone'
  | 'chime_gold'
  | 'whoosh_up'
  | 'lantern_whoosh'
  | 'boom_soft'
  | 'heart_thud'
  | 'wind_low'
  | 'chair_scrape';

export interface Cue {
  at: number; // absolute frame
  sfx: SfxName;
  vol: number;
}

const a = (sec: number, sfx: SfxName, vol: number): Cue => ({ at: f(sec), sfx, vol });
const rep = (start: number, count: number, step: number, sfx: SfxName, vol: number, rampTo?: number): Cue[] =>
  new Array(count).fill(0).map((_, i) => a(start + i * step, sfx, rampTo === undefined ? vol : vol + (rampTo - vol) * (i / Math.max(1, count - 1))));

const base: Cue[] = [];

// ① 窗阵隧道 — 0:00–0:30
const shot1: Cue[] = [
  a(0.05, 'paper_slide', 0.34),
  a(0.0, 'wind_low', 0.26),
  a(12.0, 'wind_low', 0.2),
  a(21.5, 'wind_low', 0.24),
  a(6.0, 'paper_swish', 0.3),
  a(6.5, 'paper_slide', 0.3),
  ...rep(14.0, 14, 0.62, 'paper_swish', 0.1, 0.16),
  ...rep(24.0, 5, 1.05, 'tv_static', 0.14, 0.3),
  a(29.55, 'tv_off', 0.42),
];

// ② 俯视平铺 — 0:30–1:00.56
const shot2: Cue[] = [
  a(30.0, 'tv_static', 0.22),
  a(30.9, 'tv_static', 0.26),
  a(31.8, 'tv_static', 0.2),
  a(33.06, 'phone_buzz', 0.28),
  ...rep(33.4, 12, 0.23, 'ui_blip', 0.1),
  a(36.5, 'tape_rip', 0.34),
  a(37.6, 'paper_fall', 0.26),
  a(38.2, 'paper_fall', 0.2),
  a(44.0, 'paper_flip', 0.3),
  a(47.58, 'paper_slide', 0.26),
  ...rep(50.88, 5, 0.62, 'paper_swish', 0.18),
  ...rep(50.9, 18, 0.16, 'clock_tick', 0.1),
  ...rep(55.12, 7, 0.28, 'paper_flip', 0.16),
  a(57.6, 'paper_swish', 0.2),
  a(59.4, 'paper_swish', 0.24),
  a(60.1, 'paper_swish', 0.26),
];

// ③ 左右对开 — 1:00.56–1:26.78
const shot3: Cue[] = [
  a(60.56, 'wall_thud', 0.44),
  a(60.6, 'paper_crack', 0.4),
  a(61.5, 'paper_crack', 0.26),
  a(63.2, 'paper_crack', 0.2),
  a(65.36, 'spoon_tink', 0.3),
  a(65.4, 'steam_hiss', 0.26),
  a(69.92, 'paper_tear', 0.4),
  a(70.15, 'paper_fall', 0.2),
  a(70.7, 'paper_fall', 0.16),
  a(72.26, 'chime_gold', 0.32),
  a(76.72, 'heart_thud', 0.34),
  a(80.06, 'heart_thud', 0.3),
  a(80.1, 'paper_swish', 0.2),
  a(83.5, 'paper_big', 0.3),
];

// ④ 仰视塔群 — 1:26.78–1:57.42
const shot4: Cue[] = [
  a(86.78, 'boom_soft', 0.4),
  ...rep(86.85, 12, 0.075, 'paper_swish', 0.1, 0.2),
  a(91.28, 'chime_gold', 0.34),
  a(95.3, 'whoosh_up', 0.26),
  a(101.28, 'boom_soft', 0.34),
  a(105.82, 'heart_thud', 0.32),
  a(110.0, 'paper_fall', 0.24),
  a(113.42, 'boom_soft', 0.3),
];

// ⑤ 雨窗微距 — 1:57.42–2:25.58
const shot5: Cue[] = [
  a(117.42, 'rain_loop', 0.34),
  a(117.42, 'room_tone', 0.18),
  a(126.0, 'paper_swish', 0.16),
  a(133.6, 'paper_swish', 0.22),
  a(137.0, 'paper_swish', 0.14),
  a(140.0, 'thunder_far', 0.34),
  a(143.4, 'paper_swish', 0.18),
  a(145.0, 'paper_swish', 0.24),
];

// ⑥ 房屋剖面 — 2:25.58–3:08.80
const shot6: Cue[] = [
  a(145.58, 'room_tone', 0.2),
  a(145.6, 'lamp_click', 0.26),
  a(149.22, 'lamp_click', 0.22),
  a(152.0, 'lamp_click', 0.2),
  ...rep(152.66, 26, 0.16, 'clock_tick', 0.09),
  a(156.0, 'lamp_click', 0.14),
  a(162.36, 'paper_crack', 0.32),
  a(162.7, 'paper_fall', 0.16),
  a(167.16, 'spoon_tink', 0.28),
  a(167.2, 'steam_hiss', 0.22),
  a(171.68, 'paper_slide', 0.22),
  a(176.88, 'chime_gold', 0.14),
  a(181.88, 'lamp_click', 0.24),
  a(184.4, 'paper_fall', 0.22),
  a(188.0, 'paper_swish', 0.18),
];

// ⑦ 极低地平线 — 3:08.80–3:43.82
const shot7: Cue[] = [
  a(188.8, 'roof_wind', 0.28),
  a(197.5, 'roof_wind', 0.2),
  a(206.0, 'roof_wind', 0.22),
  a(188.8, 'whoosh_up', 0.24),
  ...rep(189.3, 9, 0.95, 'lantern_whoosh', 0.12, 0.18),
  a(193.12, 'chime_gold', 0.26),
  a(195.78, 'whoosh_up', 0.2),
  ...rep(196.5, 6, 1.7, 'chime_gold', 0.12, 0.16),
  a(203.08, 'paper_swish', 0.24),
  a(207.64, 'chime_gold', 0.22),
  a(211.8, 'crowd_walla', 0.1),
  a(214.9, 'boom_soft', 0.22),
];

// ⑧ 前景巨物 — 3:43.82–4:14.22
const shot8: Cue[] = [
  a(223.82, 'crowd_walla', 0.26),
  a(223.9, 'glass_clink', 0.3),
  a(228.58, 'glass_clink', 0.26),
  a(231.6, 'coin_rain', 0.3),
  a(231.58, 'boom_soft', 0.34),
  a(235.8, 'glass_clink', 0.2),
  a(239.08, 'chair_scrape', 0.24),
  a(240.4, 'glass_clink', 0.16),
  a(244.38, 'heart_thud', 0.3),
  a(244.5, 'glass_clink', 0.2),
  a(248.54, 'paper_swish', 0.2),
  a(252.0, 'paper_big', 0.34),
];

// ⑨ 极简留白 — 4:14.22–4:39.15
const shot9: Cue[] = [
  a(254.22, 'room_tone', 0.16),
  a(254.6, 'chair_scrape', 0.2),
  a(258.5, 'glass_clink', 0.22),
  a(262.0, 'paper_slide', 0.3),
  a(267.0, 'paper_stamp', 0.46),
  a(273.6, 'paper_slide', 0.32),
];

// 歌词上屏：每句都有一声极轻的纸响（纸条被按在桌上）
const lyricCues: Cue[] = [
  a(30.0, 'paper_swish', 0.05),
  a(33.06, 'paper_swish', 0.05),
  a(36.38, 'paper_swish', 0.05),
  a(44.0, 'paper_swish', 0.05),
  a(47.58, 'paper_swish', 0.05),
  a(50.88, 'paper_swish', 0.05),
  a(55.12, 'paper_swish', 0.05),
  a(60.56, 'paper_swish', 0.05),
  a(65.36, 'paper_swish', 0.05),
  a(69.92, 'paper_swish', 0.05),
  a(72.26, 'paper_swish', 0.05),
  a(76.72, 'paper_swish', 0.05),
  a(80.06, 'paper_swish', 0.05),
  a(86.78, 'paper_swish', 0.05),
  a(91.28, 'paper_swish', 0.05),
  a(97.3, 'paper_swish', 0.05),
  a(101.28, 'paper_swish', 0.05),
  a(105.82, 'paper_swish', 0.05),
  a(110.0, 'paper_swish', 0.05),
  a(113.42, 'paper_swish', 0.05),
  a(145.58, 'paper_swish', 0.05),
  a(149.22, 'paper_swish', 0.05),
  a(152.66, 'paper_swish', 0.05),
  a(158.72, 'paper_swish', 0.05),
  a(162.36, 'paper_swish', 0.05),
  a(167.16, 'paper_swish', 0.05),
  a(171.68, 'paper_swish', 0.05),
  a(176.88, 'paper_swish', 0.05),
  a(181.88, 'paper_swish', 0.05),
  a(188.8, 'paper_swish', 0.05),
  a(193.12, 'paper_swish', 0.05),
  a(195.78, 'paper_swish', 0.05),
  a(203.08, 'paper_swish', 0.05),
  a(207.64, 'paper_swish', 0.05),
  a(211.8, 'paper_swish', 0.05),
  a(214.9, 'paper_swish', 0.05),
  a(223.82, 'paper_swish', 0.05),
  a(228.58, 'paper_swish', 0.05),
  a(235.8, 'paper_swish', 0.05),
  a(240.38, 'paper_swish', 0.05),
  a(244.54, 'paper_swish', 0.05),
  a(254.22, 'paper_swish', 0.05),
  a(258.58, 'paper_swish', 0.05),
];

export const CUES: Cue[] = [
  ...base,
  ...lyricCues,
  ...shot1, ...shot2, ...shot3, ...shot4, ...shot5, ...shot6, ...shot7, ...shot8, ...shot9].sort(
  (x, y) => x.at - y.at,
);
