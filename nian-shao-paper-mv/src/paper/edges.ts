/**
 * Path cutters. Everything visible in the film is one of these: machine-cut
 * polygons that are then wobbled, torn, scalloped or punched like real paper.
 * All generators are deterministic (seeded), so a shape is identical on every
 * frame and the only thing that changes is its transform.
 */
import { rng } from '../anim';

export type Pt = [number, number];

export const P = (pts: Pt[], close = true): string => {
  if (!pts.length) return '';
  const body = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  return `${body}${close ? ' Z' : ''}`;
};

/** Points along a straight edge, displaced perpendicular by smooth noise. */
export function tornEdge(
  from: Pt,
  to: Pt,
  amp: number,
  step: number,
  seed: number,
  freq = 0.55,
): Pt[] {
  const r = rng(seed);
  const [x1, y1] = from;
  const [x2, y2] = to;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const n = Math.max(2, Math.round(len / step));
  const nx = -dy / len;
  const ny = dx / len;
  const phase = r() * 10;
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const wob =
      Math.sin(t * Math.PI * 2 * freq * len * 0.02 + phase) * 0.45 +
      Math.sin(t * Math.PI * 2 * freq * 2.7 + phase * 1.7) * 0.3 +
      (r() - 0.5) * 0.7;
    const k = amp * wob;
    // keep the ends anchored so sheets still meet at their corners
    const anchor = Math.min(1, Math.sin(Math.PI * t) * 2.4);
    out.push([x1 + dx * t + nx * k * anchor, y1 + dy * t + ny * k * anchor]);
  }
  return out;
}

export interface TornRectOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  step?: number;
  seed?: number;
}

/** A rectangular sheet whose edges are cut (or torn) instead of ruled. */
export function tornRect(o: TornRectOpts): string {
  const { x, y, w, h, top = 6, bottom = 6, left = 3, right = 3, step = 22, seed = 1 } = o;
  const pts: Pt[] = [];
  pts.push(...tornEdge([x, y], [x + w, y], top, step, seed + 1));
  pts.push(...tornEdge([x + w, y], [x + w, y + h], right, step, seed + 2));
  pts.push(...tornEdge([x + w, y + h], [x, y + h], bottom, step, seed + 3));
  pts.push(...tornEdge([x, y + h], [x, y], left, step, seed + 4));
  return P(pts);
}

/** Rect with one edge eaten into sawtooth — the classic 剪纸 secondary cut. */
export function sawRect(o: TornRectOpts & { side?: 'top' | 'bottom' | 'left' | 'right'; teeth?: number; depth?: number }): string {
  const { x, y, w, h, side = 'bottom', teeth = 24, depth = 9 } = o;
  const pts: Pt[] = [];
  const per = (side === 'top' || side === 'bottom' ? w : h) / teeth;
  if (side === 'bottom') {
    pts.push([x, y]);
    pts.push([x + w, y]);
    for (let i = teeth; i >= 0; i--) {
      const xa = x + i * per;
      pts.push([xa, y + h - (i % 2 === 0 ? depth : 0)]);
    }
  } else if (side === 'top') {
    pts.push([x, y + h]);
    pts.push([x + w, y + h]);
    for (let i = teeth; i >= 0; i--) {
      const xa = x + i * per;
      pts.push([xa, y + (i % 2 === 0 ? depth : 0)]);
    }
  } else if (side === 'left') {
    pts.push([x + w, y]);
    pts.push([x + w, y + h]);
    for (let i = teeth; i >= 0; i--) {
      const ya = y + i * per;
      pts.push([x + (i % 2 === 0 ? depth : 0), ya]);
    }
  } else {
    pts.push([x, y]);
    pts.push([x, y + h]);
    for (let i = teeth; i >= 0; i--) {
      const ya = y + i * per;
      pts.push([x + w - (i % 2 === 0 ? depth : 0), ya]);
    }
  }
  return P(pts);
}

/** Half-round scallops along the bottom edge (花边). */
export function scallopBottom(x: number, y: number, w: number, h: number, count: number): string {
  const per = w / count;
  let d = `M${x} ${y} L${x + w} ${y} L${x + w} ${y + h}`;
  for (let i = count - 1; i >= 0; i--) {
    const xr = x + (i + 1) * per;
    const xl = x + i * per;
    d += ` Q ${(xr + xl) / 2} ${y + h + per * 0.9} ${xl.toFixed(2)} ${y + h}`;
  }
  return `${d} Z`;
}

/**
 * Crescent moon — the 月牙纹 that shows up in every layer of decoration.
 * Two arcs from the same two endpoints, the return arc tighter, so it reads as
 * a cut-out sliver of paper rather than a circle.
 */
export function crescent(cx: number, cy: number, r: number, thickness = 0.3): string {
  const ri = r * (1 - thickness);
  return (
    `M${(cx - r).toFixed(2)} ${cy.toFixed(2)} ` +
    `A ${r} ${r} 0 0 1 ${(cx + r).toFixed(2)} ${cy.toFixed(2)} ` +
    `A ${ri} ${ri} 0 0 0 ${(cx - r).toFixed(2)} ${cy.toFixed(2)} Z`
  );
}

/** Jagged crack radiating from a point. */
export function crackPath(x0: number, y0: number, len: number, angle: number, jag: number, seed: number, segs = 9): string {
  const r = rng(seed);
  const pts: Pt[] = [[x0, y0]];
  let a = (angle * Math.PI) / 180;
  let x = x0;
  let y = y0;
  for (let i = 0; i < segs; i++) {
    a += (r() - 0.5) * 0.6;
    const step = len / segs;
    x += Math.cos(a) * step + (r() - 0.5) * jag;
    y += Math.sin(a) * step + (r() - 0.5) * jag;
    pts.push([x, y]);
  }
  return P(pts, false);
}

/** Random paper scrap: a small irregular polygon. */
export function shard(w: number, h: number, seed: number, sides = 7): string {
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 + (r() - 0.5) * 0.5;
    const rr = 0.55 + r() * 0.45;
    pts.push([Math.cos(a) * w * rr, Math.sin(a) * h * rr]);
  }
  return P(pts);
}

/** Organic blob (steam, foliage, shadows). */
export function blob(cx: number, cy: number, rx: number, ry: number, seed: number, jag = 3): string {
  const r = rng(seed);
  const pts: Pt[] = [];
  const n = 14;
  const ph = r() * 6.28;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + Math.sin(a * 3 + ph) * 0.12 + (r() - 0.5) * (jag / 100);
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return P(pts);
}

/** Closed strip with punched-out crescents — lace band used for borders. */
export function laceBand(x: number, y: number, w: number, h: number, period: number, r: number, seed = 3): string {
  const parts = [P([[x, y], [x + w, y], [x + w, y + h], [x, y + h]])];
  const rr = rng(seed);
  for (let cx = x + period * 0.5; cx < x + w; cx += period) {
    const cy = y + h * (0.5 + (rr() - 0.5) * 0.2);
    parts.push(
      `M${(cx + r).toFixed(2)} ${cy.toFixed(2)} A ${r} ${r} 0 1 1 ${(cx - r).toFixed(2)} ${cy.toFixed(2)} A ${r} ${r} 0 0 0 ${(cx + r).toFixed(2)} ${cy.toFixed(2)} Z`,
    );
  }
  return parts.join(' ');
}

/** A wavy sheet edge, e.g. a paper "hill" or a curtain hem. */
export function waveEdge(
  x0: number,
  x1: number,
  y: number,
  amp: number,
  wavelength: number,
  phase: number,
  bottom: number,
  step = 18,
  jag = 0,
  seed = 1,
): string {
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let x = x0; x <= x1; x += step) {
    const yv =
      y + Math.sin(((x - x0) / wavelength) * Math.PI * 2 + phase) * amp + (jag ? (r() - 0.5) * jag : 0);
    pts.push([x, yv]);
  }
  pts.push([x1, bottom], [x0, bottom]);
  return P(pts);
}

/** Coiled paper strip (steam). Radius shrinks as the coil unwinds. */
export function coil(cx: number, cy: number, r0: number, turns: number, sign = 1): string {
  const pts: Pt[] = [];
  const n = 26 * turns;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = sign * t * Math.PI * 2 * turns;
    const rr = r0 * (1 - t * 0.55);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.45 - t * r0 * 1.5]);
  }
  return P(pts, false);
}

/** Gear-like rosette, used for clock faces / ornate window bosses. */
export function rosette(cx: number, cy: number, r: number, teeth: number, depth: number): string {
  const pts: Pt[] = [];
  const n = teeth * 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r - depth;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return P(pts);
}

/** Rounded rect path (paper cards, phone bodies). */
export function rrect(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h / 2);
  return (
    `M${x + rr} ${y} L${x + w - rr} ${y} Q${x + w} ${y} ${x + w} ${y + rr} ` +
    `L${x + w} ${y + h - rr} Q${x + w} ${y + h} ${x + w - rr} ${y + h} ` +
    `L${x + rr} ${y + h} Q${x} ${y + h} ${x} ${y + h - rr} ` +
    `L${x} ${y + rr} Q${x} ${y} ${x + rr} ${y} Z`
  );
}

/** Punch holes into a shape: returns one `d` string for fillRule="evenodd". */
export const punch = (base: string, holes: string[]) => [base, ...holes].join(' ');
