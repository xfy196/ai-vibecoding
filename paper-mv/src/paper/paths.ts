// Pure geometry helpers: every paper shape in the film is generated here,
// so no external art assets are needed.

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type P = [number, number];

const f = (n: number) => Math.round(n * 100) / 100;

/** Catmull-Rom through points -> cubic bezier path. */
export function smoothPath(points: P[], closed = false, tension = 1): string {
  if (points.length < 2) return '';
  const p = points;
  const n = p.length;
  const get = (i: number): P => {
    if (closed) return p[(i + n) % n];
    return p[Math.max(0, Math.min(n - 1, i))];
  };
  let d = `M ${f(p[0][0])} ${f(p[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension;
    d += ` C ${f(c1x)} ${f(c1y)}, ${f(c2x)} ${f(c2y)}, ${f(p2[0])} ${f(p2[1])}`;
  }
  if (closed) d += ' Z';
  return d;
}

/** Organic blob (clouds, bushes, foam, thought bubbles). */
export function blob(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed = 1,
  harmonics = 4,
  samples = 26,
  roughness = 0.16,
): string {
  const rnd = mulberry32(seed);
  const amps: number[] = [];
  const phs: number[] = [];
  for (let k = 2; k <= harmonics + 1; k++) {
    amps.push((roughness * 2) / Math.pow(k, 1.15) * (0.6 + rnd() * 0.8));
    phs.push(rnd() * Math.PI * 2);
  }
  const pts: P[] = [];
  for (let i = 0; i < samples; i++) {
    const a = (i / samples) * Math.PI * 2;
    let r = 1;
    for (let k = 0; k < amps.length; k++) {
      r += amps[k] * Math.cos((k + 2) * a + phs[k]);
    }
    pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
  }
  return smoothPath(pts, true, 0.9);
}

export interface WaveOpts {
  y: number; // base line of the crest
  amp: number; // crest height variation
  wavelength: number;
  phase: number;
  jag?: number; // hand-cut wobble
  seed?: number;
  x0?: number;
  x1?: number;
  bottom?: number;
  step?: number;
  tilt?: number; // rises to the right
}

/** A single torn-paper wave band that fills downwards. */
export function wavePath(o: WaveOpts): string {
  const x0 = o.x0 ?? -80;
  const x1 = o.x1 ?? 2000;
  const bottom = o.bottom ?? 1200;
  const step = o.step ?? 34;
  const jag = o.jag ?? 3;
  const tilt = o.tilt ?? 0;
  const rnd = mulberry32(o.seed ?? 3);
  const pts: P[] = [];
  for (let x = x0; x <= x1 + 0.1; x += step) {
    const u = (x - x0) / (x1 - x0);
    const y =
      o.y +
      o.amp * (0.62 * Math.sin((x / o.wavelength) * Math.PI * 2 + o.phase) +
        0.26 * Math.sin((x / (o.wavelength * 0.47)) * Math.PI * 2 - o.phase * 1.4 + 1.1) +
        0.12 * Math.sin((x / (o.wavelength * 0.23)) * Math.PI * 2 + o.phase * 2.2)) -
      tilt * (1 - u) +
      (rnd() - 0.5) * jag;
    pts.push([x, y]);
  }
  const top = smoothPath(pts, false, 0.85);
  return `${top} L ${f(x1)} ${f(bottom)} L ${f(x0)} ${f(bottom)} Z`;
}

/** Just the crest curve (open path) — used for foam lines drawn with a stroke. */
export function crestPath(o: WaveOpts): string {
  const x0 = o.x0 ?? -80;
  const x1 = o.x1 ?? 2000;
  const step = o.step ?? 34;
  const jag = o.jag ?? 3;
  const tilt = o.tilt ?? 0;
  const rnd = mulberry32(o.seed ?? 3);
  const pts: P[] = [];
  for (let x = x0; x <= x1 + 0.1; x += step) {
    const u = (x - x0) / (x1 - x0);
    const y =
      o.y +
      o.amp * (0.62 * Math.sin((x / o.wavelength) * Math.PI * 2 + o.phase) +
        0.26 * Math.sin((x / (o.wavelength * 0.47)) * Math.PI * 2 - o.phase * 1.4 + 1.1) +
        0.12 * Math.sin((x / (o.wavelength * 0.23)) * Math.PI * 2 + o.phase * 2.2)) -
      tilt * (1 - u) +
      (rnd() - 0.5) * jag;
    pts.push([x, y]);
  }
  return smoothPath(pts, false, 0.85);
}

/** Plain torn strip (paper band lying across the frame). */
export function tornStrip(
  x0: number,
  x1: number,
  y: number,
  h: number,
  seed = 5,
  jag = 4,
  step = 26,
): string {
  const rnd = mulberry32(seed);
  const top: P[] = [];
  const bot: P[] = [];
  for (let x = x0; x <= x1 + 0.1; x += step) {
    top.push([x, y + (rnd() - 0.5) * jag]);
    bot.push([x, y + h + (rnd() - 0.5) * jag]);
  }
  return `${smoothPath(top, false, 0.6)} L ${f(x1)} ${f(bot[bot.length - 1][1])} ${smoothPath(
    bot.slice().reverse(),
    false,
    0.6,
  ).replace('M', 'L')} Z`;
}

/** Rolling ridge (mountains, distant shore, pier line). */
export function ridge(
  x0: number,
  x1: number,
  y: number,
  amp: number,
  seed = 9,
  peaks = 5,
  bottom = 1200,
): string {
  const rnd = mulberry32(seed);
  const pts: P[] = [];
  const n = 40;
  const ctrl: P[] = [];
  for (let i = 0; i <= peaks; i++) {
    ctrl.push([x0 + ((x1 - x0) * i) / peaks, y - amp * (0.35 + rnd() * 0.9)]);
  }
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = x0 + (x1 - x0) * u;
    const seg = u * peaks;
    const i0 = Math.min(peaks, Math.floor(seg));
    const i1 = Math.min(peaks, i0 + 1);
    const t = seg - i0;
    const s = t * t * (3 - 2 * t);
    const yv = ctrl[i0][1] * (1 - s) + ctrl[i1][1] * s;
    pts.push([x, yv + Math.sin(u * Math.PI * peaks * 2.7) * amp * 0.06]);
  }
  return `${smoothPath(pts, false, 0.8)} L ${f(x1)} ${bottom} L ${f(x0)} ${bottom} Z`;
}

/** 4-point paper sparkle. */
export function sparkle(cx: number, cy: number, r: number, waist = 0.24): string {
  const w = r * waist;
  return `M ${f(cx)} ${f(cy - r)}
    C ${f(cx + w)} ${f(cy - w)}, ${f(cx + w)} ${f(cy - w)}, ${f(cx + r)} ${f(cy)}
    C ${f(cx + w)} ${f(cy + w)}, ${f(cx + w)} ${f(cy + w)}, ${f(cx)} ${f(cy + r)}
    C ${f(cx - w)} ${f(cy + w)}, ${f(cx - w)} ${f(cy + w)}, ${f(cx - r)} ${f(cy)}
    C ${f(cx - w)} ${f(cy - w)}, ${f(cx - w)} ${f(cy - w)}, ${f(cx)} ${f(cy - r)} Z`;
}

/** Rounded lantern silhouette with a slightly imprecise paper cut. */
export function lanternPath(w: number, h: number, seed = 2): string {
  const rnd = mulberry32(seed);
  const hw = w / 2;
  const pts: P[] = [
    [-hw * 0.72, -h * 0.5],
    [-hw * 0.9 + rnd() * 2, -h * 0.16],
    [-hw, h * 0.28],
    [-hw * 0.55, h * 0.5],
    [hw * 0.55, h * 0.5],
    [hw, h * 0.28],
    [hw * 0.9 - rnd() * 2, -h * 0.16],
    [hw * 0.72, -h * 0.5],
  ];
  return smoothPath(pts, true, 1);
}

/** Simple two-layer paper boat, origin at the waterline. */
export const BOAT_HULL =
  'M -96 0 L 96 0 L 52 46 Q 0 62 -52 46 Z';
export const BOAT_SAIL_L = 'M -70 -6 L -14 -104 L -14 -6 Z';
export const BOAT_SAIL_R = 'M 14 -6 L 14 -92 L 62 -6 Z';

/** Faceted paper whale (origin at its belly). */
export function whalePath(w = 520, h = 240): string {
  const s = w / 520;
  const pts: P[] = [
    [-250 * s, 0],
    [-232 * s, -46 * s],
    [-150 * s, -92 * s],
    [-40 * s, -104 * s],
    [70 * s, -86 * s],
    [150 * s, -44 * s],
    [196 * s, -6 * s],
    [228 * s, -40 * s],
    [262 * s, -76 * s],
    [258 * s, -18 * s],
    [246 * s, 8 * s],
    [258 * s, 44 * s],
    [214 * s, 20 * s],
    [150 * s, 40 * s],
    [40 * s, 56 * s],
    [-90 * s, 46 * s],
    [-190 * s, 24 * s],
  ];
  return smoothPath(pts, true, 0.8);
}
